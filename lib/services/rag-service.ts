/**
 * RAG (Retrieval-Augmented Generation) Service
 * Handles context-aware AI responses using LangChain and agent knowledge base
 * Modular design for future backend deployment to Render
 */

import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { BaseRetriever } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { enhancedKnowledgeIngestionService } from './enhanced-knowledge-ingestion-service';

export interface AgentContext {
  agentId: string;
  userId: string;
  conversationId: string;
  customerMessage: string;
  conversationHistory?: ConversationMessage[];
  customerInfo?: any;
}

export interface ConversationMessage {
  role: 'customer' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

export interface RAGResponse {
  response: string;
  contextUsed: RelevantContext[];
  confidenceScore: number;
  responseTime: number;
  shouldEscalate?: boolean;
  escalationReason?: string;
}

export interface RelevantContext {
  content: string;
  source: string;
  relevanceScore: number;
  metadata?: any;
}

export interface AgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  personality: {
    tone: string;
    style: string;
    empathy: number;
    formality: number;
  };
  capabilities: string[];
  specialization: string[];
}

/**
 * Custom retriever for agent knowledge base
 */
class AgentKnowledgeRetriever extends BaseRetriever {
  private agentId: string;
  private userId: string;

  constructor(agentId: string, userId: string) {
    super();
    this.agentId = agentId;
    this.userId = userId;
  }

  async getRelevantDocuments(query: string): Promise<Document[]> {
    try {
      const searchResults = await enhancedKnowledgeIngestionService.searchKnowledge(
        query,
        this.agentId,
        this.userId,
        5,
        0.7
      );

      return searchResults.map(result => new Document({
        pageContent: result.content,
        metadata: {
          source: result.metadata?.source || 'unknown',
          similarity: result.similarity,
          ...result.metadata
        }
      }));
    } catch (error) {
      console.error('Error retrieving relevant documents:', error);
      return [];
    }
  }
}

export class RAGService {
  private llm: ChatOpenAI;
  private promptTemplate: PromptTemplate;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Create the main prompt template
    this.promptTemplate = PromptTemplate.fromTemplate(`
You are {agentName}, an AI assistant with the following characteristics:

PERSONALITY:
- Tone: {tone}
- Style: {style}
- Empathy Level: {empathy}/10
- Formality Level: {formality}/10

CAPABILITIES:
{capabilities}

SPECIALIZATIONS:
{specializations}

SYSTEM INSTRUCTIONS:
{systemPrompt}

RELEVANT CONTEXT FROM KNOWLEDGE BASE:
{context}

CONVERSATION HISTORY:
{conversationHistory}

CUSTOMER INFORMATION:
{customerInfo}

CURRENT CUSTOMER MESSAGE: {customerMessage}

Instructions:
1. Use the provided context from the knowledge base to inform your response
2. Maintain your personality characteristics throughout the conversation
3. If the customer's question cannot be answered with the available context, be honest about limitations
4. If the situation seems complex or requires human intervention, indicate that escalation may be needed
5. Keep responses concise but comprehensive
6. Always be helpful and professional

Please provide a helpful response to the customer's message:
`);
  }

  /**
   * Generate context-aware response using RAG
   */
  async generateResponse(context: AgentContext): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      console.log(`🤖 Generating RAG response for agent ${context.agentId}`);

      // 1. Get agent configuration
      const agentConfig = await this.getAgentConfig(context.agentId, context.userId);
      if (!agentConfig) {
        console.error(`Agent configuration not found for ID: ${context.agentId}, User: ${context.userId}`);
        
        // Return a graceful fallback response
        return {
          response: "I'm sorry, but I'm currently unable to access my configuration. Please contact support for assistance.",
          confidenceScore: 0.1,
          contextUsed: [],
          responseTime: Date.now() - startTime,
          shouldEscalate: true,
          escalationReason: 'Agent configuration not found'
        };
      }

      // 2. Check if agent has knowledge base
      const retriever = new AgentKnowledgeRetriever(context.agentId, context.userId);
      let relevantDocs = [];
      
      try {
        relevantDocs = await retriever.getRelevantDocuments(context.customerMessage);
      } catch (error) {
        console.error('Error retrieving documents:', error);
        // Continue with empty docs to allow fallback response
        relevantDocs = [];
      }
      
      console.log(`🔍 RAG DEBUG: Context found: ${relevantDocs.length} documents`);

      // 3. Handle agents without knowledge base
      if (relevantDocs.length === 0) {
        console.log('🔍 RAG DEBUG: No documents found, checking if agent has knowledge base...');
        const hasKnowledgeBase = await this.checkIfAgentHasKnowledgeBase(context.agentId, context.userId);
        console.log(`🔍 RAG DEBUG: Agent has knowledge base: ${hasKnowledgeBase}`);
        
        if (!hasKnowledgeBase) {
          console.log('🔍 RAG DEBUG: Agent needs training, returning escalation response');
          return {
            response: '',
            confidenceScore: 0,
            contextUsed: [],
            responseTime: Date.now() - startTime,
            shouldEscalate: true,
            escalationReason: 'AGENT_NEEDS_TRAINING'
          };
        }
      }

      // 4. Build context string
      const contextString = this.buildContextString(relevantDocs);
      const relevantContext = this.formatRelevantContext(relevantDocs);

      // 5. Get conversation context
      const conversationContext = await this.getConversationContext(context.conversationId, context.userId);

      // 6. Format conversation history
      const historyString = this.formatConversationHistory(context.conversationHistory || []);

      // 7. Create LLM chain
      const chain = new LLMChain({
        llm: this.llm,
        prompt: this.promptTemplate,
      });

      // 8. Generate response
      const response = await chain.call({
        agentName: agentConfig.name,
        tone: agentConfig.personality.tone,
        style: agentConfig.personality.style,
        empathy: agentConfig.personality.empathy,
        formality: agentConfig.personality.formality,
        capabilities: agentConfig.capabilities.join(', '),
        specializations: agentConfig.specialization.join(', '),
        systemPrompt: agentConfig.systemPrompt,
        context: contextString,
        conversationHistory: historyString,
        customerInfo: this.formatCustomerInfo(context.customerInfo),
        customerMessage: context.customerMessage,
      });

      // 8. Calculate confidence and check for escalation
      const confidenceScore = this.calculateConfidenceScore(relevantContext, response.text);
      console.log(`🔍 RAG DEBUG: Context found: ${relevantContext.length} documents`);
      console.log(`🔍 RAG DEBUG: Confidence score: ${confidenceScore}`);
      console.log(`🔍 RAG DEBUG: Response: ${response.text.substring(0, 100)}...`);
      
      const escalationCheck = this.checkEscalationNeeded(context.customerMessage, response.text, confidenceScore);
      console.log(`🔍 RAG DEBUG: Should escalate: ${escalationCheck.shouldEscalate}, Reason: ${escalationCheck.reason}`);

      const responseTime = Date.now() - startTime;

      // 9. Store response for training
      await this.storeResponse(context, response.text, relevantContext, confidenceScore, responseTime);

      // 10. Update conversation context
      await this.updateConversationContext(context.conversationId, context.userId, {
        lastCustomerMessage: context.customerMessage,
        lastAgentResponse: response.text,
        contextUsed: relevantContext
      });

      console.log(`✅ Generated response in ${responseTime}ms with confidence ${confidenceScore}`);

      return {
        response: response.text,
        contextUsed: relevantContext,
        confidenceScore,
        responseTime,
        shouldEscalate: escalationCheck.shouldEscalate,
        escalationReason: escalationCheck.reason
      };

    } catch (error) {
      console.error('❌ Error generating RAG response:', error);
      const responseTime = Date.now() - startTime;
      
      return {
        response: "I apologize, but I'm having trouble processing your request right now. Let me connect you with a human agent who can better assist you.",
        contextUsed: [],
        confidenceScore: 0,
        responseTime,
        shouldEscalate: true,
        escalationReason: 'System error during response generation'
      };
    }
  }

  /**
   * Get agent configuration from database
   */
  private async getAgentConfig(agentId: string, userId: string): Promise<AgentConfig | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching agent config:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      systemPrompt: data.flow_data?.systemPrompt || 'You are a helpful AI assistant.',
      model: data.ai_model || 'gpt-4o-mini',
      temperature: data.ai_temperature || 0.7,
      maxTokens: data.ai_max_tokens || 500,
      personality: {
        tone: 'professional',
        style: 'helpful',
        empathy: 7,
        formality: 5
      },
      capabilities: data.features?.capabilities || [],
      specialization: data.specialization || []
    };
  }

  /**
   * Build context string from relevant documents
   */
  private buildContextString(docs: Document[]): string {
    if (!docs.length) {
      return "No specific context available from knowledge base.";
    }

    return docs.map((doc, index) => 
      `Context ${index + 1} (Source: ${doc.metadata.source}):\n${doc.pageContent}`
    ).join('\n\n');
  }

  /**
   * Format relevant context for response metadata
   */
  private formatRelevantContext(docs: Document[]): RelevantContext[] {
    return docs.map(doc => ({
      content: doc.pageContent,
      source: doc.metadata.source || 'Unknown',
      relevanceScore: 0.8, // Placeholder - would be from vector similarity
      metadata: doc.metadata
    }));
  }

  /**
   * Format conversation history
   */
  private formatConversationHistory(history: ConversationMessage[]): string {
    if (!history.length) {
      return "No previous conversation history.";
    }

    return history.slice(-5).map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n');
  }

  /**
   * Format customer information
   */
  private formatCustomerInfo(customerInfo: any): string {
    if (!customerInfo) {
      return "No specific customer information available.";
    }

    return `Customer: ${customerInfo.name || 'Unknown'}\nPlatform: ${customerInfo.platform || 'Unknown'}\nPrevious interactions: ${customerInfo.previousInteractions || 0}`;
  }

  /**
   * Calculate confidence score based on context relevance
   */
  private calculateConfidenceScore(context: RelevantContext[], response: string): number {
    if (!context.length) return 0.3; // Low confidence without context

    // Simple heuristic - in production, use more sophisticated methods
    const avgRelevance = context.reduce((sum, ctx) => sum + ctx.relevanceScore, 0) / context.length;
    const responseLength = response.length;
    
    // Higher confidence for longer responses with good context
    const baseScore = avgRelevance * 0.7;
    const lengthBonus = Math.min(responseLength / 500, 0.3); // Up to 0.3 bonus for length
    
    return Math.min(baseScore + lengthBonus, 1.0);
  }

  /**
   * Check if agent has any knowledge sources uploaded
   */
  private async checkIfAgentHasKnowledgeBase(agentId: string, userId: string): Promise<boolean> {
    try {
      // Check if agent exists in either agents table (your existing) OR ai_agents table (new)
      let agentExists = false;
      
      // First try the main agents table
      const { data: mainAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('id', agentId)
        .eq('user_id', userId)
        .single();
      
      if (mainAgent) {
        agentExists = true;
        console.log(`🔍 Agent ${agentId} found in main agents table`);
      } else {
        // Fallback to ai_agents table
        const { data: aiAgent } = await supabase
          .from('ai_agents')
          .select('id')
          .eq('id', agentId)
          .eq('user_id', userId)
          .single();
        
        if (aiAgent) {
          agentExists = true;
          console.log(`🔍 Agent ${agentId} found in ai_agents table`);
        }
      }

      if (!agentExists) {
        console.log(`🔍 Agent ${agentId} not found in any agents table for user ${userId}`);
        return false;
      }

      // Then check if it has knowledge sources
      const { data, error } = await supabase
        .from('agent_knowledge_sources')
        .select('id')
        .eq('agent_id', agentId)
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        console.error('Error checking knowledge base:', error);
        return false;
      }

      const hasKnowledge = data && data.length > 0;
      console.log(`🔍 Agent ${agentId} has knowledge sources: ${hasKnowledge}`);
      return hasKnowledge;
    } catch (error) {
      console.error('Error checking knowledge base:', error);
      return false;
    }
  }

  /**
   * Check if escalation to human is needed
   */
  private checkEscalationNeeded(customerMessage: string, agentResponse: string, confidence: number): { shouldEscalate: boolean; reason?: string } {
    // Low confidence responses should escalate
    if (confidence < 0.4) {
      return {
        shouldEscalate: true,
        reason: 'Low confidence in AI response'
      };
    }

    // Check for escalation keywords in customer message
    const escalationKeywords = ['urgent', 'emergency', 'complaint', 'frustrated', 'angry', 'refund', 'cancel', 'manager', 'supervisor'];
    const hasEscalationKeyword = escalationKeywords.some(keyword => 
      customerMessage.toLowerCase().includes(keyword)
    );

    if (hasEscalationKeyword) {
      return {
        shouldEscalate: true,
        reason: 'Customer message contains escalation indicators'
      };
    }

    // Check if AI admits uncertainty
    const uncertaintyIndicators = ['i don\'t know', 'i\'m not sure', 'unable to help', 'cannot assist'];
    const isUncertain = uncertaintyIndicators.some(indicator => 
      agentResponse.toLowerCase().includes(indicator)
    );

    if (isUncertain) {
      return {
        shouldEscalate: true,
        reason: 'AI expressed uncertainty in response'
      };
    }

    return { shouldEscalate: false };
  }

  /**
   * Store response for training and analytics
   */
  private async storeResponse(
    context: AgentContext, 
    response: string, 
    contextUsed: RelevantContext[], 
    confidenceScore: number, 
    responseTime: number
  ): Promise<void> {
    try {
      await supabase
        .from('agent_responses')
        .insert({
          conversation_id: context.conversationId,
          agent_id: context.agentId,
          user_id: context.userId,
          agent_type: 'ai_agent',
          customer_message: context.customerMessage,
          agent_response: response,
          response_time: responseTime / 1000, // Convert to seconds
          context_used: contextUsed,
          confidence_score: confidenceScore
        });
    } catch (error) {
      console.error('Error storing agent response:', error);
    }
  }

  /**
   * Get existing conversation context
   */
  private async getConversationContext(conversationId: string, userId: string): Promise<any> {
    const { data } = await supabase
      .from('conversation_context')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    return data || {};
  }

  /**
   * Update conversation context
   */
  private async updateConversationContext(conversationId: string, userId: string, updates: any): Promise<void> {
    try {
      await supabase
        .from('conversation_context')
        .upsert({
          conversation_id: conversationId,
          user_id: userId,
          last_updated_at: new Date().toISOString(),
          ...updates
        });
    } catch (error) {
      console.error('Error updating conversation context:', error);
    }
  }

  /**
   * Train agent with feedback
   */
  async trainWithFeedback(responseId: string, userId: string, feedback: {
    score: number;
    humanFeedback?: string;
    customerFeedback?: string;
    correctResponse?: string;
  }): Promise<void> {
    try {
      await supabase
        .from('agent_responses')
        .update({
          feedback_score: feedback.score,
          human_feedback: feedback.humanFeedback,
          customer_feedback: feedback.customerFeedback,
          // Store correct response for future fine-tuning
          correct_response: feedback.correctResponse
        })
        .eq('id', responseId)
        .eq('user_id', userId);

      console.log(`📚 Training feedback stored for response ${responseId}`);
    } catch (error) {
      console.error('Error storing training feedback:', error);
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(agentId: string, userId: string, days: number = 30): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_agent_performance', {
        p_agent_id: agentId,
        p_user_id: userId
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting agent performance:', error);
      return {
        totalConversations: 0,
        totalMessages: 0,
        averageResponseTime: 0,
        averageConfidence: 0,
        escalationRate: 0,
        customerSatisfaction: 0
      };
    }
  }
}

// Export singleton instance
export const ragService = new RAGService();
export default ragService;