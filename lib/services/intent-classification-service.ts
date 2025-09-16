/**
 * Intent Classification Service
 * Analyzes incoming messages to determine customer intent and route to appropriate agents
 * Supports keyword-based, ML-based, and hybrid classification approaches
 */

import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';

export interface IntentClassification {
  intent: string;
  confidence: number;
  category: 'acquisition' | 'engagement' | 'retention' | 'support';
  priority: 'hot' | 'warm' | 'cold';
  urgency: 'high' | 'medium' | 'low';
  suggestedAgentType?: 'ai_agent' | 'human';
  reasoning?: string;
}

export interface IntentRule {
  id: string;
  user_id: string;
  name: string;
  intent: string;
  keywords: string[];
  patterns: string[];
  category: string;
  priority: string;
  urgency: string;
  confidence_boost: number;
  is_active: boolean;
  created_at: string;
}

export class IntentClassificationService {
  
  // Built-in intent patterns for common use cases
  private static readonly BUILT_IN_INTENTS = {
    sales: {
      keywords: ['price', 'cost', 'buy', 'purchase', 'quote', 'demo', 'trial', 'interested', 'pricing', 'plan'],
      patterns: [/how much/i, /what.*cost/i, /can i buy/i, /interested in/i],
      category: 'acquisition',
      priority: 'hot',
      urgency: 'high'
    },
    support: {
      keywords: ['help', 'problem', 'issue', 'bug', 'error', 'broken', 'not working', 'support'],
      patterns: [/not work/i, /having trouble/i, /need help/i, /can't/i],
      category: 'support', 
      priority: 'warm',
      urgency: 'medium'
    },
    billing: {
      keywords: ['bill', 'invoice', 'payment', 'charge', 'refund', 'subscription', 'cancel'],
      patterns: [/billing issue/i, /payment problem/i, /want to cancel/i],
      category: 'retention',
      priority: 'hot',
      urgency: 'high'
    },
    general: {
      keywords: ['hello', 'hi', 'info', 'question', 'about'],
      patterns: [/just wondering/i, /quick question/i],
      category: 'engagement',
      priority: 'warm', 
      urgency: 'low'
    }
  };

  /**
   * Classify message intent using hybrid approach
   */
  async classifyIntent(
    messageContent: string, 
    userId: string, 
    conversationHistory?: any[]
  ): Promise<IntentClassification> {
    try {
      console.log(`🧠 Classifying intent for message: "${messageContent.substring(0, 100)}..."`);

      // 1. Get user's custom intent rules
      const customRules = await this.getCustomIntentRules(userId);
      
      // 2. Apply rule-based classification
      const ruleBasedResult = this.applyRuleBasedClassification(messageContent, customRules);
      
      // 3. Apply built-in patterns
      const builtInResult = this.applyBuiltInClassification(messageContent);
      
      // 4. Consider conversation context if available
      const contextBoost = this.getContextualBoost(conversationHistory);
      
      // 5. Combine results and pick best match
      const finalResult = this.combineClassificationResults(
        ruleBasedResult,
        builtInResult,
        contextBoost
      );

      console.log(`✅ Intent classified: ${finalResult.intent} (${finalResult.confidence}% confidence)`);
      
      return finalResult;

    } catch (error) {
      console.error('Error classifying intent:', error);
      
      // Return default classification on error
      return {
        intent: 'general',
        confidence: 50,
        category: 'engagement',
        priority: 'warm',
        urgency: 'medium',
        reasoning: 'Default classification due to error'
      };
    }
  }

  /**
   * Get custom intent rules for user
   */
  private async getCustomIntentRules(userIdentifier: string): Promise<IntentRule[]> {
    try {
      // Convert user_identifier to UUID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_identifier', userIdentifier)
        .single();

      if (!userData) return [];

      // Check if message_classification_rules table exists and get rules
      const { data: rules, error } = await supabase
        .from('message_classification_rules')
        .select('*')
        .eq('user_id', userData.id)
        .eq('is_active', true)
        .order('priority', { ascending: false }); // Higher priority first

      if (error) {
        console.log('No custom intent rules found or table does not exist');
        return [];
      }

      return rules?.map(rule => ({
        id: rule.id,
        user_id: rule.user_id,
        name: rule.rule_name,
        intent: rule.intent,
        keywords: rule.keywords || [],
        patterns: [], // Convert patterns if needed
        category: rule.intent,
        priority: rule.priority,
        urgency: rule.urgency,
        confidence_boost: rule.lead_score_boost || 10,
        is_active: rule.is_active,
        created_at: rule.created_at
      })) || [];
    } catch (error) {
      console.error('Error getting custom intent rules:', error);
      return [];
    }
  }

  /**
   * Apply rule-based classification using custom rules
   */
  private applyRuleBasedClassification(messageContent: string, rules: IntentRule[]): IntentClassification | null {
    const message = messageContent.toLowerCase();
    
    for (const rule of rules) {
      let matchScore = 0;
      let matches: string[] = [];

      // Check keyword matches
      for (const keyword of rule.keywords) {
        if (message.includes(keyword.toLowerCase())) {
          matchScore += 1;
          matches.push(keyword);
        }
      }

      // If we have matches, calculate confidence
      if (matchScore > 0) {
        const confidence = Math.min(90, 60 + (matchScore * 10) + rule.confidence_boost);
        
        return {
          intent: rule.intent,
          confidence,
          category: rule.category as any,
          priority: rule.priority as any,
          urgency: rule.urgency as any,
          reasoning: `Matched custom rule "${rule.name}" with keywords: ${matches.join(', ')}`
        };
      }
    }

    return null;
  }

  /**
   * Apply built-in classification patterns
   */
  private applyBuiltInClassification(messageContent: string): IntentClassification {
    const message = messageContent.toLowerCase();
    let bestMatch: IntentClassification = {
      intent: 'general',
      confidence: 30,
      category: 'engagement',
      priority: 'warm',
      urgency: 'medium'
    };

    for (const [intentName, config] of Object.entries(IntentClassificationService.BUILT_IN_INTENTS)) {
      let matchScore = 0;
      let matches: string[] = [];

      // Check keyword matches
      for (const keyword of config.keywords) {
        if (message.includes(keyword.toLowerCase())) {
          matchScore += 1;
          matches.push(keyword);
        }
      }

      // Check pattern matches  
      for (const pattern of config.patterns) {
        if (pattern.test(message)) {
          matchScore += 2; // Patterns are worth more than keywords
          matches.push(`pattern: ${pattern.source}`);
        }
      }

      // Calculate confidence based on matches
      if (matchScore > 0) {
        const confidence = Math.min(85, 50 + (matchScore * 15));
        
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent: intentName,
            confidence,
            category: config.category as any,
            priority: config.priority as any,
            urgency: config.urgency as any,
            reasoning: `Built-in classification matched: ${matches.join(', ')}`
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Get contextual boost based on conversation history
   */
  private getContextualBoost(conversationHistory?: any[]): number {
    if (!conversationHistory || conversationHistory.length === 0) {
      return 0;
    }

    // Boost confidence if recent messages support the classification
    // This is a simple implementation - could be much more sophisticated
    const recentMessages = conversationHistory.slice(-3);
    const hasMultipleExchanges = recentMessages.length > 1;
    const hasAgentResponse = recentMessages.some(msg => msg.role === 'agent');

    return hasMultipleExchanges && hasAgentResponse ? 5 : 0;
  }

  /**
   * Combine classification results and pick the best one
   */
  private combineClassificationResults(
    ruleResult: IntentClassification | null,
    builtInResult: IntentClassification,
    contextBoost: number
  ): IntentClassification {
    
    // Apply context boost
    builtInResult.confidence += contextBoost;
    if (ruleResult) {
      ruleResult.confidence += contextBoost;
    }

    // Custom rules take precedence if they have reasonable confidence
    if (ruleResult && ruleResult.confidence >= 60) {
      return ruleResult;
    }

    // Otherwise use built-in classification
    return builtInResult;
  }

  /**
   * Create custom intent rule
   */
  async createIntentRule(
    userIdentifier: string,
    rule: {
      name: string;
      intent: string;
      keywords: string[];
      category: string;
      priority: string;
      urgency: string;
      confidenceBoost?: number;
    }
  ): Promise<IntentRule | null> {
    try {
      // Convert user_identifier to UUID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('user_identifier', userIdentifier)
        .single();

      if (!userData) {
        console.error('User not found');
        return null;
      }

      const { data, error } = await supabase
        .from('message_classification_rules')
        .insert({
          user_id: userData.id,
          rule_name: rule.name,
          keywords: rule.keywords,
          intent: rule.intent,
          priority: rule.priority,
          urgency: rule.urgency,
          auto_assign_to: 'ai', // Default to AI
          lead_score_boost: rule.confidenceBoost || 10,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating intent rule:', error);
        return null;
      }

      return {
        id: data.id,
        user_id: data.user_id,
        name: data.rule_name,
        intent: data.intent,
        keywords: data.keywords,
        patterns: [],
        category: data.intent,
        priority: data.priority,
        urgency: data.urgency,
        confidence_boost: data.lead_score_boost,
        is_active: data.is_active,
        created_at: data.created_at
      };

    } catch (error) {
      console.error('Error creating intent rule:', error);
      return null;
    }
  }

  /**
   * Get all intent rules for user
   */
  async getIntentRules(userIdentifier: string): Promise<IntentRule[]> {
    return await this.getCustomIntentRules(userIdentifier);
  }

  /**
   * Update existing intent rule
   */
  async updateIntentRule(
    ruleId: string,
    updates: Partial<IntentRule>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_classification_rules')
        .update({
          rule_name: updates.name,
          keywords: updates.keywords,
          intent: updates.intent,
          priority: updates.priority,
          urgency: updates.urgency,
          lead_score_boost: updates.confidence_boost,
          is_active: updates.is_active
        })
        .eq('id', ruleId);

      return !error;
    } catch (error) {
      console.error('Error updating intent rule:', error);
      return false;
    }
  }

  /**
   * Delete intent rule
   */
  async deleteIntentRule(ruleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_classification_rules')
        .delete()
        .eq('id', ruleId);

      return !error;
    } catch (error) {
      console.error('Error deleting intent rule:', error);
      return false;
    }
  }
}

// Export singleton instance
export const intentClassificationService = new IntentClassificationService();
export default intentClassificationService;