/**
 * AI-Powered Smart Response Generation for Financial Services
 * Integrates with n8n workflows for intelligent customer interactions
 */

import OpenAI from 'openai';

interface CustomerContext {
  profile: any;
  conversationHistory: any[];
  organizationId: string;
  currentIntent: string;
  riskProfile: string;
}

export class SmartResponseService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateContextualResponse(
    message: string,
    customerContext: CustomerContext
  ): Promise<{
    response: string;
    suggestedActions: string[];
    escalationNeeded: boolean;
    followUpScheduled: boolean;
  }> {
    const systemPrompt = this.buildFinancialServicePrompt(customerContext);

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        functions: [
          {
            name: "generate_financial_response",
            description: "Generate contextual response for financial services",
            parameters: {
              type: "object",
              properties: {
                response: { type: "string" },
                intent_detected: { type: "string" },
                urgency_level: { type: "number" },
                suggested_actions: {
                  type: "array",
                  items: { type: "string" }
                },
                escalation_needed: { type: "boolean" },
                follow_up_needed: { type: "boolean" },
                compliance_sensitive: { type: "boolean" }
              }
            }
          }
        ],
        function_call: { name: "generate_financial_response" }
      });

      const response = JSON.parse(
        completion.choices[0].message.function_call?.arguments || '{}'
      );

      return {
        response: response.response,
        suggestedActions: response.suggested_actions || [],
        escalationNeeded: response.escalation_needed || false,
        followUpScheduled: response.follow_up_needed || false
      };

    } catch (error) {
      console.error('AI response generation failed:', error);
      return {
        response: "Thank you for your message. One of our specialists will get back to you shortly.",
        suggestedActions: ["schedule_callback"],
        escalationNeeded: true,
        followUpScheduled: true
      };
    }
  }

  private buildFinancialServicePrompt(context: CustomerContext): string {
    return `You are an expert financial services AI assistant for ${context.organizationId}.

Customer Profile:
- Risk Profile: ${context.riskProfile}
- Customer Tier: ${context.profile.customer_tier}
- Policy Value: $${context.profile.portfolio_value}
- Lifecycle Stage: ${context.profile.lifecycle_stage}

Guidelines:
1. Provide accurate, compliant financial advice
2. Always prioritize customer safety and regulatory compliance
3. Escalate complex regulatory or high-value queries
4. Use empathetic, professional tone
5. Suggest relevant products/services when appropriate
6. Never provide specific investment advice without proper disclaimers

Current Intent: ${context.currentIntent}

Respond helpfully while following all financial services regulations.`;
  }
}

export const smartResponseService = new SmartResponseService();