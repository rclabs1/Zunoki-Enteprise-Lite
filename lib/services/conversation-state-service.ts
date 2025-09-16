/**
 * Conversation State Tracking Service
 * Tracks conversation progress, customer satisfaction, agent performance
 * Provides insights for routing decisions and escalation triggers
 */

import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';

export interface ConversationState {
  conversationId: string;
  userId: string;
  currentStage: 'initial' | 'engaged' | 'issue_identified' | 'resolving' | 'resolved' | 'escalated';
  sentiment: 'positive' | 'neutral' | 'negative';
  satisfaction: number; // 1-5 scale
  responseCount: number;
  avgResponseTime: number; // in minutes
  lastInteraction: Date;
  assignedAgentId?: string;
  agentType?: 'ai_agent' | 'human';
  escalationFlags: string[];
  isStuck: boolean; // Conversation not progressing
  customerNeedsAssistance: boolean;
  tags: string[];
  metadata: Record<string, any>;
}

export interface InteractionAnalysis {
  messageContent: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 to 1
  urgency: 'high' | 'medium' | 'low';
  isQuestion: boolean;
  isComplaint: boolean;
  isCompliment: boolean;
  requiresHumanAttention: boolean;
  suggestedActions: string[];
}

export class ConversationStateService {

  /**
   * Update conversation state based on new message
   */
  async updateConversationState(
    conversationId: string,
    userId: string,
    messageContent: string,
    direction: 'inbound' | 'outbound',
    platform: string
  ): Promise<ConversationState> {
    try {
      console.log(`📊 Updating conversation state for ${conversationId}`);

      // Get current state or create new one
      let currentState = await this.getConversationState(conversationId, userId);
      if (!currentState) {
        currentState = await this.initializeConversationState(conversationId, userId);
      }

      // Analyze the new message
      const analysis = await this.analyzeMessage(messageContent, direction);

      // Update state based on analysis
      currentState = await this.updateStateFromAnalysis(currentState, analysis, direction);

      // Check for escalation triggers
      const escalationFlags = await this.checkEscalationTriggers(currentState, analysis);
      if (escalationFlags.length > 0) {
        currentState.escalationFlags = [...new Set([...currentState.escalationFlags, ...escalationFlags])];
      }

      // Update stuck conversation detection
      currentState.isStuck = await this.detectStuckConversation(currentState, conversationId);

      // Save updated state
      await this.saveConversationState(currentState);

      console.log(`✅ Conversation state updated: ${currentState.currentStage} (sentiment: ${currentState.sentiment})`);
      return currentState;

    } catch (error) {
      console.error('Error updating conversation state:', error);
      throw error;
    }
  }

  /**
   * Get current conversation state
   */
  async getConversationState(conversationId: string, userId: string): Promise<ConversationState | null> {
    try {
      const { data, error } = await supabase
        .from('crm_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      // Parse metadata for conversation state
      const metadata = data.metadata || {};
      const conversationState = metadata.conversationState;

      if (!conversationState) return null;

      return {
        conversationId: data.id,
        userId: data.user_id,
        currentStage: conversationState.currentStage || 'initial',
        sentiment: conversationState.sentiment || 'neutral',
        satisfaction: conversationState.satisfaction || 3,
        responseCount: conversationState.responseCount || 0,
        avgResponseTime: conversationState.avgResponseTime || 0,
        lastInteraction: new Date(conversationState.lastInteraction || data.updated_at),
        assignedAgentId: data.assigned_agent_id,
        agentType: conversationState.agentType,
        escalationFlags: conversationState.escalationFlags || [],
        isStuck: conversationState.isStuck || false,
        customerNeedsAssistance: conversationState.customerNeedsAssistance || false,
        tags: conversationState.tags || [],
        metadata: conversationState.metadata || {}
      };

    } catch (error) {
      console.error('Error getting conversation state:', error);
      return null;
    }
  }

  /**
   * Initialize conversation state for new conversation
   */
  private async initializeConversationState(conversationId: string, userId: string): Promise<ConversationState> {
    return {
      conversationId,
      userId,
      currentStage: 'initial',
      sentiment: 'neutral',
      satisfaction: 3,
      responseCount: 0,
      avgResponseTime: 0,
      lastInteraction: new Date(),
      escalationFlags: [],
      isStuck: false,
      customerNeedsAssistance: false,
      tags: [],
      metadata: {}
    };
  }

  /**
   * Analyze message content for sentiment, urgency, etc.
   */
  private async analyzeMessage(messageContent: string, direction: 'inbound' | 'outbound'): Promise<InteractionAnalysis> {
    try {
      const content = messageContent.toLowerCase();
      
      // Simple sentiment analysis (could be enhanced with ML)
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      let sentimentScore = 0;

      // Positive indicators
      const positiveWords = ['thank', 'great', 'awesome', 'perfect', 'love', 'excellent', 'amazing', 'good'];
      const positiveCount = positiveWords.reduce((count, word) => content.includes(word) ? count + 1 : count, 0);

      // Negative indicators
      const negativeWords = ['problem', 'issue', 'broken', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed'];
      const negativeCount = negativeWords.reduce((count, word) => content.includes(word) ? count + 1 : count, 0);

      // Calculate sentiment
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        sentimentScore = Math.min(0.8, positiveCount * 0.2);
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative'; 
        sentimentScore = -Math.min(0.8, negativeCount * 0.2);
      }

      // Detect urgency
      const urgentWords = ['urgent', 'asap', 'emergency', 'immediately', 'critical', 'important'];
      const urgency = urgentWords.some(word => content.includes(word)) ? 'high' : 'medium';

      // Detect question patterns
      const isQuestion = content.includes('?') || content.includes('how') || content.includes('what') || content.includes('when');

      // Detect complaints
      const complaintWords = ['complaint', 'complain', 'dissatisfied', 'unhappy'];
      const isComplaint = complaintWords.some(word => content.includes(word)) || (negativeCount > 1);

      // Detect compliments
      const isCompliment = positiveCount > 0 && content.includes('thank');

      // Determine if requires human attention
      const humanWords = ['speak to human', 'talk to person', 'manager', 'supervisor', 'human agent'];
      const requiresHumanAttention = humanWords.some(word => content.includes(word)) || 
        (sentiment === 'negative' && urgency === 'high');

      // Suggest actions
      const suggestedActions: string[] = [];
      if (isComplaint) suggestedActions.push('acknowledge_concern');
      if (isQuestion) suggestedActions.push('provide_information');
      if (requiresHumanAttention) suggestedActions.push('escalate_to_human');
      if (urgency === 'high') suggestedActions.push('prioritize_response');

      return {
        messageContent,
        sentiment,
        sentimentScore,
        urgency,
        isQuestion,
        isComplaint,
        isCompliment,
        requiresHumanAttention,
        suggestedActions
      };

    } catch (error) {
      console.error('Error analyzing message:', error);
      return {
        messageContent,
        sentiment: 'neutral',
        sentimentScore: 0,
        urgency: 'medium',
        isQuestion: false,
        isComplaint: false,
        isCompliment: false,
        requiresHumanAttention: false,
        suggestedActions: []
      };
    }
  }

  /**
   * Update conversation state based on analysis
   */
  private async updateStateFromAnalysis(
    state: ConversationState,
    analysis: InteractionAnalysis,
    direction: 'inbound' | 'outbound'
  ): Promise<ConversationState> {
    
    // Update response count for inbound messages
    if (direction === 'inbound') {
      state.responseCount++;
    }

    // Update sentiment (weighted average)
    if (direction === 'inbound') {
      const currentSentimentScore = state.sentiment === 'positive' ? 0.5 : 
        state.sentiment === 'negative' ? -0.5 : 0;
      const newSentimentScore = (currentSentimentScore + analysis.sentimentScore) / 2;
      
      state.sentiment = newSentimentScore > 0.1 ? 'positive' :
        newSentimentScore < -0.1 ? 'negative' : 'neutral';
    }

    // Update stage based on interaction
    state.currentStage = this.determineConversationStage(state, analysis);

    // Update customer needs assistance flag
    state.customerNeedsAssistance = analysis.requiresHumanAttention || 
      (analysis.isComplaint && state.responseCount > 2);

    // Update last interaction
    state.lastInteraction = new Date();

    // Add tags based on analysis
    if (analysis.isComplaint && !state.tags.includes('complaint')) {
      state.tags.push('complaint');
    }
    if (analysis.urgency === 'high' && !state.tags.includes('urgent')) {
      state.tags.push('urgent');
    }

    return state;
  }

  /**
   * Determine conversation stage based on state and analysis
   */
  private determineConversationStage(
    state: ConversationState,
    analysis: InteractionAnalysis
  ): ConversationState['currentStage'] {
    
    // If escalated, stay escalated
    if (state.currentStage === 'escalated') return 'escalated';

    // If customer is complaining, likely an issue
    if (analysis.isComplaint && state.currentStage === 'initial') {
      return 'issue_identified';
    }

    // If conversation has multiple exchanges, likely engaged
    if (state.responseCount > 2 && state.currentStage === 'initial') {
      return 'engaged';
    }

    // If positive sentiment and no new issues, possibly resolving
    if (state.currentStage === 'issue_identified' && analysis.sentiment === 'positive') {
      return 'resolving';
    }

    // If customer says thanks or positive feedback, likely resolved
    if (analysis.isCompliment && (state.currentStage === 'resolving' || state.currentStage === 'engaged')) {
      return 'resolved';
    }

    return state.currentStage;
  }

  /**
   * Check for escalation triggers
   */
  private async checkEscalationTriggers(
    state: ConversationState,
    analysis: InteractionAnalysis
  ): Promise<string[]> {
    const triggers: string[] = [];

    // Multiple negative interactions
    if (state.sentiment === 'negative' && state.responseCount > 3) {
      triggers.push('repeated_negative_sentiment');
    }

    // Customer explicitly requests human
    if (analysis.requiresHumanAttention) {
      triggers.push('human_agent_requested');
    }

    // High urgency complaint
    if (analysis.urgency === 'high' && analysis.isComplaint) {
      triggers.push('urgent_complaint');
    }

    // Conversation stuck for too long
    if (state.isStuck) {
      triggers.push('conversation_stuck');
    }

    return triggers;
  }

  /**
   * Detect if conversation is stuck (not progressing)
   */
  private async detectStuckConversation(
    state: ConversationState,
    conversationId: string
  ): Promise<boolean> {
    try {
      // Get recent messages to check for repetitive patterns
      const { data: recentMessages } = await supabase
        .from('whatsapp_messages') // Could check multiple platforms
        .select('message_text, direction, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentMessages || recentMessages.length < 3) return false;

      // Simple stuck detection: customer asking same type of question repeatedly
      const customerMessages = recentMessages
        .filter(msg => msg.direction === 'inbound')
        .map(msg => msg.message_text?.toLowerCase() || '');

      // Check for similar messages (basic approach)
      const hasRepetitiveQuestions = customerMessages.length >= 2 && 
        customerMessages.some((msg, i) => 
          customerMessages.slice(i + 1).some(otherMsg => 
            this.calculateMessageSimilarity(msg, otherMsg) > 0.7
          )
        );

      return hasRepetitiveQuestions;

    } catch (error) {
      console.error('Error detecting stuck conversation:', error);
      return false;
    }
  }

  /**
   * Calculate similarity between two messages (simple approach)
   */
  private calculateMessageSimilarity(msg1: string, msg2: string): number {
    const words1 = msg1.split(' ');
    const words2 = msg2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  /**
   * Save conversation state to database
   */
  private async saveConversationState(state: ConversationState): Promise<void> {
    try {
      // Update the conversation metadata
      await supabase
        .from('crm_conversations')
        .update({
          priority: state.escalationFlags.length > 0 ? 'high' : 'medium',
          metadata: {
            conversationState: state
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', state.conversationId)
        .eq('user_id', state.userId);

    } catch (error) {
      console.error('Error saving conversation state:', error);
      throw error;
    }
  }

  /**
   * Get conversations requiring attention
   */
  async getConversationsNeedingAttention(userId: string): Promise<ConversationState[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('crm_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .or('priority.eq.high,metadata->>conversationState->>isStuck.eq.true');

      if (error || !conversations) return [];

      return conversations
        .map(conv => {
          const state = conv.metadata?.conversationState;
          if (!state) return null;

          return {
            conversationId: conv.id,
            userId: conv.user_id,
            currentStage: state.currentStage || 'initial',
            sentiment: state.sentiment || 'neutral',
            satisfaction: state.satisfaction || 3,
            responseCount: state.responseCount || 0,
            avgResponseTime: state.avgResponseTime || 0,
            lastInteraction: new Date(state.lastInteraction || conv.updated_at),
            assignedAgentId: conv.assigned_agent_id,
            agentType: state.agentType,
            escalationFlags: state.escalationFlags || [],
            isStuck: state.isStuck || false,
            customerNeedsAssistance: state.customerNeedsAssistance || false,
            tags: state.tags || [],
            metadata: state.metadata || {}
          };
        })
        .filter(state => state !== null) as ConversationState[];

    } catch (error) {
      console.error('Error getting conversations needing attention:', error);
      return [];
    }
  }

  /**
   * Get conversation analytics summary
   */
  async getConversationAnalytics(userId: string): Promise<{
    totalConversations: number;
    byStage: Record<string, number>;
    bySentiment: Record<string, number>;
    avgSatisfaction: number;
    escalationRate: number;
  }> {
    try {
      const { data: conversations, error } = await supabase
        .from('crm_conversations')
        .select('metadata')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error || !conversations) {
        return {
          totalConversations: 0,
          byStage: {},
          bySentiment: {},
          avgSatisfaction: 0,
          escalationRate: 0
        };
      }

      const states = conversations
        .map(conv => conv.metadata?.conversationState)
        .filter(state => state);

      const totalConversations = states.length;
      
      const byStage = states.reduce((acc, state) => {
        acc[state.currentStage] = (acc[state.currentStage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const bySentiment = states.reduce((acc, state) => {
        acc[state.sentiment] = (acc[state.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const avgSatisfaction = states.reduce((sum, state) => sum + (state.satisfaction || 3), 0) / totalConversations;
      
      const escalatedCount = states.filter(state => state.escalationFlags?.length > 0).length;
      const escalationRate = escalatedCount / totalConversations;

      return {
        totalConversations,
        byStage,
        bySentiment,
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
        escalationRate: Math.round(escalationRate * 100) / 100
      };

    } catch (error) {
      console.error('Error getting conversation analytics:', error);
      return {
        totalConversations: 0,
        byStage: {},
        bySentiment: {},
        avgSatisfaction: 0,
        escalationRate: 0
      };
    }
  }
}

// Export singleton instance
export const conversationStateService = new ConversationStateService();
export default conversationStateService;