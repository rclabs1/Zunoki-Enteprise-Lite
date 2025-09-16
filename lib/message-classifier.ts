import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MessageClassification {
  category: 'acquisition' | 'engagement' | 'retention' | 'support' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  urgency_score: number; // 0-10 scale
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: string;
  confidence: number; // 0-1 scale
  keywords_matched: string[];
  suggested_response_type?: 'immediate' | 'within_hour' | 'within_day' | 'scheduled';
  escalation_recommended?: boolean;
  customer_lifecycle_stage?: 'new' | 'exploring' | 'deciding' | 'purchased' | 'returning' | 'churning';
  emotion_detected?: string[];
  complexity_level?: 'simple' | 'medium' | 'complex';
  requires_human?: boolean;
}

export interface ClassificationContext {
  customerHistory?: {
    totalConversations: number;
    lastInteractionDays: number;
    previousPurchases: boolean;
    averageResponseTime: number;
    satisfactionScore?: number;
  };
  businessContext?: {
    businessHours: boolean;
    currentLoad: 'low' | 'medium' | 'high';
    availableAgents: number;
  };
  messageContext?: {
    isFirstMessage: boolean;
    conversationLength: number;
    previousClassifications: string[];
  };
}

class MessageClassifier {
  private static instance: MessageClassifier;

  static getInstance(): MessageClassifier {
    if (!MessageClassifier.instance) {
      MessageClassifier.instance = new MessageClassifier();
    }
    return MessageClassifier.instance;
  }

  // Main classification function using AI
  async classifyMessage(
    content: string, 
    context?: ClassificationContext
  ): Promise<MessageClassification> {
    try {
      // First, run rule-based classification for speed
      const ruleBasedResult = this.ruleBasedClassification(content);
      
      // Then enhance with AI classification
      const aiEnhancedResult = await this.aiEnhancedClassification(content, ruleBasedResult, context);
      
      return aiEnhancedResult;
    } catch (error) {
      console.error('Error in message classification:', error);
      // Fallback to rule-based classification if AI fails
      return this.ruleBasedClassification(content);
    }
  }

  // Rule-based classification (fast fallback)
  private ruleBasedClassification(content: string): MessageClassification {
    const lowerContent = content.toLowerCase();
    
    // Keywords for different categories
    const keywords = {
      urgent: ['urgent', 'emergency', 'asap', 'critical', 'help me', 'stuck', 'broken', 'not working', 'immediate'],
      sales: ['price', 'cost', 'buy', 'purchase', 'quote', 'demo', 'trial', 'pricing', 'discount', 'offer'],
      support: ['bug', 'error', 'problem', 'issue', 'broken', 'fix', 'help', 'trouble', 'support'],
      positive: ['thank', 'great', 'awesome', 'love', 'perfect', 'excellent', 'amazing', 'happy'],
      negative: ['hate', 'terrible', 'awful', 'bad', 'worst', 'angry', 'frustrated', 'disappointed'],
      retention: ['cancel', 'unsubscribe', 'stop', 'quit', 'leave', 'refund', 'return'],
      engagement: ['how', 'when', 'where', 'what', 'why', 'learn', 'understand', 'explain'],
    };

    // Calculate urgency score
    let urgencyScore = 0;
    let keywordsMatched: string[] = [];

    // Check urgent keywords
    keywords.urgent.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        urgencyScore += keyword === 'emergency' ? 3 : keyword === 'urgent' ? 2 : 1;
        keywordsMatched.push(keyword);
      }
    });

    // Determine category
    let category: MessageClassification['category'] = 'general';
    let confidence = 0.6; // Rule-based has moderate confidence

    if (keywords.sales.some(k => lowerContent.includes(k))) {
      category = 'acquisition';
      confidence = 0.7;
    } else if (keywords.support.some(k => lowerContent.includes(k))) {
      category = 'support';
      confidence = 0.8;
    } else if (keywords.retention.some(k => lowerContent.includes(k))) {
      category = 'retention';
      confidence = 0.8;
      urgencyScore = Math.max(urgencyScore, 7); // Retention issues are high priority
    } else if (keywords.engagement.some(k => lowerContent.includes(k))) {
      category = 'engagement';
      confidence = 0.6;
    }

    // Determine sentiment
    let sentiment: MessageClassification['sentiment'] = 'neutral';
    if (keywords.positive.some(k => lowerContent.includes(k))) {
      sentiment = 'positive';
    } else if (keywords.negative.some(k => lowerContent.includes(k))) {
      sentiment = 'negative';
      urgencyScore += 1;
    }

    // Determine priority based on urgency score
    let priority: MessageClassification['priority'];
    if (urgencyScore >= 8) priority = 'urgent';
    else if (urgencyScore >= 5) priority = 'high';
    else if (urgencyScore >= 2) priority = 'medium';
    else priority = 'low';

    // Basic intent detection
    let intent = 'general_inquiry';
    if (category === 'acquisition') intent = 'sales_inquiry';
    else if (category === 'support') intent = 'technical_support';
    else if (category === 'retention') intent = 'cancellation_request';

    return {
      category,
      priority,
      urgency_score: Math.min(urgencyScore, 10),
      sentiment,
      intent,
      confidence,
      keywords_matched: keywordsMatched,
      complexity_level: urgencyScore > 5 ? 'complex' : 'simple',
      requires_human: urgencyScore >= 8 || category === 'retention',
    };
  }

  // AI-enhanced classification using OpenAI
  private async aiEnhancedClassification(
    content: string,
    ruleBasedResult: MessageClassification,
    context?: ClassificationContext
  ): Promise<MessageClassification> {
    try {
      const systemPrompt = `You are an expert message classifier for a WhatsApp CRM system. Analyze customer messages and provide detailed classification.

Classification Categories:
- acquisition: Sales inquiries, pricing questions, new customer interest
- engagement: Questions, learning, general interaction
- retention: Cancellation requests, complaints, churn risk
- support: Technical issues, bugs, help requests
- general: Everything else

Priority Levels:
- urgent (9-10): Emergencies, system down, angry customers
- high (7-8): Important issues, qualified leads, escalations needed
- medium (4-6): Standard inquiries, moderate issues
- low (1-3): General questions, low-impact requests

Sentiment: positive, neutral, negative
Intent: Specific purpose (e.g., "wants_pricing", "technical_issue", "cancel_subscription")
Urgency Score: 0-10 scale
Confidence: 0-1 scale for classification accuracy

Context factors to consider:
${context ? JSON.stringify(context, null, 2) : 'No additional context provided'}

Respond ONLY with valid JSON matching this structure:
{
  "category": "string",
  "priority": "string", 
  "urgency_score": number,
  "sentiment": "string",
  "intent": "string",
  "confidence": number,
  "keywords_matched": ["string"],
  "suggested_response_type": "string",
  "escalation_recommended": boolean,
  "customer_lifecycle_stage": "string",
  "emotion_detected": ["string"],
  "complexity_level": "string",
  "requires_human": boolean
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Classify this message: "${content}"` }
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const aiResult = JSON.parse(response.choices[0].message.content || '{}');
      
      // Merge AI results with rule-based results, giving preference to AI where confidence is high
      return {
        category: aiResult.confidence > 0.8 ? aiResult.category : ruleBasedResult.category,
        priority: aiResult.confidence > 0.8 ? aiResult.priority : ruleBasedResult.priority,
        urgency_score: Math.max(aiResult.urgency_score || 0, ruleBasedResult.urgency_score),
        sentiment: aiResult.sentiment || ruleBasedResult.sentiment,
        intent: aiResult.intent || ruleBasedResult.intent,
        confidence: Math.max(aiResult.confidence || 0, ruleBasedResult.confidence),
        keywords_matched: [
          ...new Set([
            ...(aiResult.keywords_matched || []),
            ...ruleBasedResult.keywords_matched
          ])
        ],
        suggested_response_type: aiResult.suggested_response_type || this.getSuggestedResponseType(aiResult.priority || ruleBasedResult.priority),
        escalation_recommended: aiResult.escalation_recommended || (aiResult.urgency_score >= 8),
        customer_lifecycle_stage: aiResult.customer_lifecycle_stage,
        emotion_detected: aiResult.emotion_detected || [],
        complexity_level: aiResult.complexity_level || ruleBasedResult.complexity_level,
        requires_human: aiResult.requires_human || ruleBasedResult.requires_human,
      };

    } catch (error) {
      console.error('AI classification failed, using rule-based result:', error);
      return ruleBasedResult;
    }
  }

  // Get suggested response type based on priority
  private getSuggestedResponseType(priority: string): MessageClassification['suggested_response_type'] {
    switch (priority) {
      case 'urgent': return 'immediate';
      case 'high': return 'within_hour';
      case 'medium': return 'within_day';
      default: return 'scheduled';
    }
  }

  // Batch classify multiple messages
  async classifyMessages(
    messages: Array<{ content: string; context?: ClassificationContext }>
  ): Promise<MessageClassification[]> {
    const results = await Promise.all(
      messages.map(({ content, context }) => this.classifyMessage(content, context))
    );
    return results;
  }

  // Get classification statistics
  getClassificationStats(classifications: MessageClassification[]) {
    const stats = {
      total: classifications.length,
      by_category: {} as Record<string, number>,
      by_priority: {} as Record<string, number>,
      by_sentiment: {} as Record<string, number>,
      average_urgency: 0,
      requires_human_count: 0,
      escalation_count: 0,
    };

    let totalUrgency = 0;

    classifications.forEach(c => {
      // Count by category
      stats.by_category[c.category] = (stats.by_category[c.category] || 0) + 1;
      
      // Count by priority
      stats.by_priority[c.priority] = (stats.by_priority[c.priority] || 0) + 1;
      
      // Count by sentiment
      stats.by_sentiment[c.sentiment] = (stats.by_sentiment[c.sentiment] || 0) + 1;
      
      // Sum urgency
      totalUrgency += c.urgency_score;
      
      // Count special flags
      if (c.requires_human) stats.requires_human_count++;
      if (c.escalation_recommended) stats.escalation_count++;
    });

    stats.average_urgency = classifications.length > 0 ? totalUrgency / classifications.length : 0;

    return stats;
  }

  // Train the classifier with feedback (for future ML improvements)
  async recordClassificationFeedback(
    originalContent: string,
    predictedClassification: MessageClassification,
    actualClassification: Partial<MessageClassification>,
    feedback: 'correct' | 'incorrect' | 'partially_correct'
  ) {
    // This would be used to improve the classifier over time
    // For now, just log the feedback
    console.log('Classification feedback:', {
      content: originalContent,
      predicted: predictedClassification,
      actual: actualClassification,
      feedback,
      timestamp: new Date().toISOString(),
    });

    // In a production system, you'd store this feedback and use it to retrain models
  }
}

export const messageClassifier = MessageClassifier.getInstance();
export default messageClassifier;