/**
 * Enhanced RAG Service with LangChain + Weaviate + Dual LLM Support
 * Handles context-aware AI responses using vector database and smart LLM routing
 */

import { enhancedKnowledgeIngestionService } from './enhanced-knowledge-ingestion-service';
import { llmProvider, LLMProvider, UserTier } from './llm-provider-service';
import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';

export interface RAGQuery {
  query: string;
  agentId: string;
  userId: string;
  conversationId?: string;
  messageId?: string;
  userTier?: UserTier;
  preferredProvider?: LLMProvider;
}

export interface RAGResponse {
  response: string;
  confidence: number;
  contextsUsed: Array<{
    content: string;
    source: string;
    similarity: number;
  }>;
  provider: LLMProvider;
  tokensUsed: number;
  responseTime: number;
  escalateToHuman: boolean;
  suggestedActions?: string[];
}

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  personality: {
    tone: string;
    style: string;
    empathy: number;
    formality: number;
  };
  capabilities: string[];
  systemPrompt?: string;
  escalationThreshold: number;
}

class EnhancedRAGService {
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.7;
  private readonly CONTEXT_LIMIT = 5;
  private readonly SIMILARITY_THRESHOLD = 0.7;

  /**
   * Generate context-aware response using RAG pipeline
   */
  async generateResponse(ragQuery: RAGQuery): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      // Get agent configuration
      const agentConfig = await this.getAgentConfig(ragQuery.agentId, ragQuery.userId);
      
      // Search knowledge base for relevant context
      const knowledgeContext = await this.searchKnowledgeBase(ragQuery);
      
      // Generate response using appropriate LLM provider
      const llmConfig = llmProvider.getProviderConfig(
        ragQuery.userTier || 'free',
        ragQuery.preferredProvider
      );

      const llmResponse = await llmProvider.generateRAGResponse(
        ragQuery.query,
        knowledgeContext.map(ctx => ctx.content),
        this.buildPersonalityPrompt(agentConfig),
        llmConfig
      );

      // Determine if escalation is needed
      const escalateToHuman = this.shouldEscalateToHuman(
        llmResponse.confidence,
        knowledgeContext,
        agentConfig.escalationThreshold
      );

      // Store interaction for learning
      await this.storeInteraction(ragQuery, llmResponse, knowledgeContext);

      const response: RAGResponse = {
        response: llmResponse.content,
        confidence: llmResponse.confidence,
        contextsUsed: knowledgeContext,
        provider: llmResponse.provider,
        tokensUsed: llmResponse.tokensUsed,
        responseTime: Date.now() - startTime,
        escalateToHuman,
        suggestedActions: escalateToHuman 
          ? ['Contact human agent', 'Provide more details', 'Try different wording']
          : this.generateSuggestedActions(ragQuery.query, knowledgeContext),
      };

      return response;

    } catch (error) {
      console.error('RAG generation failed:', error);
      
      return {
        response: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact support if the issue persists.",
        confidence: 0.1,
        contextsUsed: [],
        provider: 'openai',
        tokensUsed: 0,
        responseTime: Date.now() - startTime,
        escalateToHuman: true,
        suggestedActions: ['Contact support', 'Try again later'],
      };
    }
  }

  /**
   * Search knowledge base for relevant context
   */
  private async searchKnowledgeBase(ragQuery: RAGQuery): Promise<Array<{
    content: string;
    source: string;
    similarity: number;
  }>> {
    const results = await enhancedKnowledgeIngestionService.searchKnowledge(
      ragQuery.query,
      ragQuery.agentId,
      ragQuery.userId,
      this.CONTEXT_LIMIT,
      this.SIMILARITY_THRESHOLD
    );

    return results.map(result => ({
      content: result.content,
      source: result.metadata.sourceName || result.metadata.source || 'Unknown',
      similarity: result.similarity,
    }));
  }

  /**
   * Get agent configuration from database
   */
  private async getAgentConfig(agentId: string, userId: string): Promise<AgentConfig> {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Return default configuration if agent not found
      return {
        id: agentId,
        name: 'AI Assistant',
        personality: {
          tone: 'friendly',
          style: 'professional',
          empathy: 7,
          formality: 5,
        },
        capabilities: ['general_qa'],
        escalationThreshold: 0.7,
      };
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      personality: data.personality || {
        tone: 'friendly',
        style: 'professional', 
        empathy: 7,
        formality: 5,
      },
      capabilities: data.capabilities || ['general_qa'],
      systemPrompt: data.system_prompt,
      escalationThreshold: 0.7, // Could be configurable per agent
    };
  }

  /**
   * Build personality-aware system prompt
   */
  private buildPersonalityPrompt(agentConfig: AgentConfig): string {
    const { personality } = agentConfig;
    
    let prompt = `You are ${agentConfig.name}, an AI assistant with the following characteristics:\n\n`;
    
    // Personality traits
    prompt += `Personality:\n`;
    prompt += `- Tone: ${personality.tone}\n`;
    prompt += `- Style: ${personality.style}\n`;
    prompt += `- Empathy level: ${personality.empathy}/10\n`;
    prompt += `- Formality level: ${personality.formality}/10\n\n`;
    
    // Capabilities
    if (agentConfig.capabilities.length > 0) {
      prompt += `Your capabilities include: ${agentConfig.capabilities.join(', ')}\n\n`;
    }
    
    // Custom system prompt
    if (agentConfig.systemPrompt) {
      prompt += `Additional instructions: ${agentConfig.systemPrompt}\n\n`;
    }
    
    // General behavior guidelines
    prompt += `Guidelines:\n`;
    prompt += `- Use the provided context to answer questions accurately\n`;
    prompt += `- If you don't know something, say so honestly\n`;
    prompt += `- Maintain your personality throughout the conversation\n`;
    prompt += `- Be helpful while staying within your capabilities\n`;
    prompt += `- If a question is outside your expertise, suggest alternatives or escalation\n`;
    
    return prompt;
  }

  /**
   * Determine if query should escalate to human
   */
  private shouldEscalateToHuman(
    confidence: number,
    contexts: Array<{ similarity: number }>,
    threshold: number
  ): boolean {
    // Low confidence in LLM response
    if (confidence < threshold) {
      return true;
    }
    
    // No relevant context found
    if (contexts.length === 0) {
      return true;
    }
    
    // Low similarity scores in retrieved context
    const avgSimilarity = contexts.reduce((sum, ctx) => sum + ctx.similarity, 0) / contexts.length;
    if (avgSimilarity < this.SIMILARITY_THRESHOLD) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate suggested follow-up actions
   */
  private generateSuggestedActions(
    query: string,
    contexts: Array<{ content: string; source: string }>
  ): string[] {
    const actions: string[] = [];
    
    // Query-based suggestions
    if (query.toLowerCase().includes('how')) {
      actions.push('Get step-by-step guide');
    }
    
    if (query.toLowerCase().includes('price') || query.toLowerCase().includes('cost')) {
      actions.push('View pricing details', 'Contact sales');
    }
    
    if (query.toLowerCase().includes('support') || query.toLowerCase().includes('help')) {
      actions.push('Contact support', 'Browse help center');
    }
    
    // Context-based suggestions
    if (contexts.length > 0) {
      const sources = [...new Set(contexts.map(ctx => ctx.source))];
      if (sources.length === 1) {
        actions.push(`Read full ${sources[0]}`);
      } else if (sources.length > 1) {
        actions.push('View related documents');
      }
    }
    
    // Default suggestions
    if (actions.length === 0) {
      actions.push('Ask a follow-up question', 'Browse knowledge base');
    }
    
    return actions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Store interaction for learning and analytics
   */
  private async storeInteraction(
    ragQuery: RAGQuery,
    llmResponse: any,
    contexts: Array<{ content: string; source: string; similarity: number }>
  ): Promise<void> {
    try {
      await supabase.from('agent_responses').insert({
        conversation_id: ragQuery.conversationId,
        message_id: ragQuery.messageId,
        user_id: ragQuery.userId,
        agent_id: ragQuery.agentId,
        agent_type: 'ai_agent',
        customer_message: ragQuery.query,
        agent_response: llmResponse.content,
        response_time: llmResponse.responseTime / 1000, // Convert to seconds
        context_used: contexts,
        confidence_score: llmResponse.confidence,
        escalated_to_human: this.shouldEscalateToHuman(
          llmResponse.confidence,
          contexts,
          0.7
        ),
      });
    } catch (error) {
      console.error('Error storing interaction:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(
    agentId: string,
    userId: string,
    daysPeriod: number = 30
  ): Promise<{
    totalConversations: number;
    totalMessages: number;
    averageResponseTime: number;
    averageConfidence: number;
    escalationRate: number;
    customerSatisfaction: number;
    topQueries: Array<{ query: string; count: number }>;
    knowledgeUsage: Array<{ source: string; usage: number }>;
  }> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysPeriod);

    try {
      const { data, error } = await supabase
        .from('agent_responses')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', userId)
        .gte('created_at', fromDate.toISOString());

      if (error || !data) {
        return this.getDefaultPerformanceMetrics();
      }

      const totalMessages = data.length;
      const totalConversations = new Set(data.map(r => r.conversation_id)).size;
      
      const avgResponseTime = data.reduce((sum, r) => sum + (r.response_time || 0), 0) / totalMessages;
      const avgConfidence = data.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / totalMessages;
      const escalationRate = (data.filter(r => r.escalated_to_human).length / totalMessages) * 100;
      const avgSatisfaction = data.reduce((sum, r) => sum + (r.feedback_score || 0), 0) / 
                             data.filter(r => r.feedback_score).length || 0;

      // Analyze top queries
      const queryCount: Record<string, number> = {};
      data.forEach(r => {
        const query = r.customer_message.toLowerCase().substring(0, 50);
        queryCount[query] = (queryCount[query] || 0) + 1;
      });

      const topQueries = Object.entries(queryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));

      // Analyze knowledge source usage
      const sourceUsage: Record<string, number> = {};
      data.forEach(r => {
        if (r.context_used && Array.isArray(r.context_used)) {
          r.context_used.forEach((ctx: any) => {
            const source = ctx.source || 'Unknown';
            sourceUsage[source] = (sourceUsage[source] || 0) + 1;
          });
        }
      });

      const knowledgeUsage = Object.entries(sourceUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([source, usage]) => ({ source, usage }));

      return {
        totalConversations,
        totalMessages,
        averageResponseTime: Number(avgResponseTime.toFixed(2)),
        averageConfidence: Number(avgConfidence.toFixed(2)),
        escalationRate: Number(escalationRate.toFixed(2)),
        customerSatisfaction: Number(avgSatisfaction.toFixed(2)),
        topQueries,
        knowledgeUsage,
      };

    } catch (error) {
      console.error('Error getting agent performance:', error);
      return this.getDefaultPerformanceMetrics();
    }
  }

  private getDefaultPerformanceMetrics() {
    return {
      totalConversations: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      averageConfidence: 0,
      escalationRate: 0,
      customerSatisfaction: 0,
      topQueries: [],
      knowledgeUsage: [],
    };
  }

  /**
   * Test knowledge base quality for an agent
   */
  async testKnowledgeBase(agentId: string, userId: string, testQueries: string[]): Promise<{
    overallScore: number;
    results: Array<{
      query: string;
      response: string;
      confidence: number;
      contextsFound: number;
      avgSimilarity: number;
    }>;
  }> {
    const results = [];
    let totalScore = 0;

    for (const query of testQueries) {
      try {
        const ragResponse = await this.generateResponse({
          query,
          agentId,
          userId,
          userTier: 'pro', // Use best provider for testing
        });

        const avgSimilarity = ragResponse.contextsUsed.length > 0
          ? ragResponse.contextsUsed.reduce((sum, ctx) => sum + ctx.similarity, 0) / ragResponse.contextsUsed.length
          : 0;

        const queryScore = (ragResponse.confidence + avgSimilarity) / 2;
        totalScore += queryScore;

        results.push({
          query,
          response: ragResponse.response.substring(0, 200) + '...',
          confidence: ragResponse.confidence,
          contextsFound: ragResponse.contextsUsed.length,
          avgSimilarity: Number(avgSimilarity.toFixed(3)),
        });
      } catch (error) {
        results.push({
          query,
          response: 'Error generating response',
          confidence: 0,
          contextsFound: 0,
          avgSimilarity: 0,
        });
      }
    }

    return {
      overallScore: Number((totalScore / testQueries.length).toFixed(3)),
      results,
    };
  }
}

// Export singleton instance
export const enhancedRAGService = new EnhancedRAGService();