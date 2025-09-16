/**
 * Dual LLM Provider Service
 * Supports both OpenAI and Groq with smart routing and fallback
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export type LLMProvider = 'openai' | 'groq' | 'auto';
export type GroqModel = 'deepseek-r1-distill-llama-70b' | 'gpt-oss-20b' | 'gpt-oss-120b';
export type UserTier = 'free' | 'pro' | 'enterprise';

// Industry-standard document upload limits aligned with YC startups
export const DOCUMENT_UPLOAD_LIMITS = {
  free: {
    maxDocuments: 50,        // Industry: 5-100 docs
    maxPagesPerUpload: 100,  // Conservative for free tier
    maxFileSize: '10MB',     // Standard free tier limit
    monthlyCredits: 1000,    // Existing credit system
  },
  pro: {
    maxDocuments: 5000,      // Industry: 1,000-10,000 docs
    maxPagesPerUpload: 1000, // Competitive with VectorShift/Stack AI
    maxFileSize: '100MB',    // Standard pro tier
    monthlyCredits: 50000,   // Existing credit system
  },
  enterprise: {
    maxDocuments: 50000,     // Industry: Very high limits
    maxPagesPerUpload: 10000, // Large document processing
    maxFileSize: '1GB',      // Enterprise-grade uploads
    monthlyCredits: 500000,  // Existing credit system
  }
} as const;

interface LLMConfig {
  provider: LLMProvider;
  userTier?: UserTier;
  userId?: string;
  fallbackEnabled?: boolean;
  groqModel?: GroqModel;
}

interface ProviderResponse {
  content: string;
  provider: LLMProvider;
  tokensUsed: number;
  responseTime: number;
  confidence: number;
}

class LLMProviderService {
  private openaiClient: ChatOpenAI;
  private groqClients: Map<GroqModel, ChatGroq>;
  private fallbackEnabled: boolean = true;

  constructor() {
    // Initialize OpenAI client
    this.openaiClient = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      maxTokens: 1000,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize multiple Groq clients
    this.groqClients = new Map([
      ['deepseek-r1-distill-llama-70b', new ChatGroq({
        model: 'deepseek-r1-distill-llama-70b',
        temperature: 0.1,
        maxTokens: 1000,
        apiKey: process.env.GROQ_API_KEY,
      })],
      ['gpt-oss-20b', new ChatGroq({
        model: 'gpt-oss-20b', // Fast OpenAI model on Groq
        temperature: 0.1,
        maxTokens: 1000,
        apiKey: process.env.GROQ_API_KEY,
      })],
      ['gpt-oss-120b', new ChatGroq({
        model: 'gpt-oss-120b', // Flagship OpenAI model on Groq
        temperature: 0.1,
        maxTokens: 1000,
        apiKey: process.env.GROQ_API_KEY,
      })],
    ]);
  }

  /**
   * Get the appropriate LLM based on configuration
   */
  private getLLM(config: LLMConfig): BaseLanguageModel {
    const provider = this.selectProvider(config);
    
    switch (provider) {
      case 'groq':
        const model = this.selectGroqModel(config);
        return this.groqClients.get(model) || this.groqClients.get('gpt-oss-20b')!;
      case 'openai':
      default:
        return this.openaiClient;
    }
  }

  /**
   * Select optimal Groq model based on user tier and requirements
   */
  private selectGroqModel(config: LLMConfig): GroqModel {
    if (config.groqModel) {
      return config.groqModel;
    }

    // Auto-select based on user tier
    switch (config.userTier) {
      case 'free':
        return 'gpt-oss-20b'; // Fast, efficient
      case 'pro':
        return 'gpt-oss-120b'; // Best quality
      case 'enterprise':
        return 'gpt-oss-120b'; // Premium performance
      default:
        return 'gpt-oss-20b'; // Default to fast model
    }
  }

  /**
   * Smart provider selection based on user tier and requirements
   */
  private selectProvider(config: LLMConfig): LLMProvider {
    if (config.provider !== 'auto') {
      return config.provider;
    }

    // Auto selection logic
    switch (config.userTier) {
      case 'free':
        return 'groq'; // Cost savings for free users
      case 'pro':
        return 'openai'; // Reliability for paying users
      case 'enterprise':
        return 'openai'; // Maximum reliability
      default:
        return 'groq'; // Default to cost-effective option
    }
  }

  /**
   * Generate response with automatic fallback
   */
  async generateResponse(
    systemPrompt: string,
    userMessage: string,
    config: LLMConfig = { provider: 'auto' }
  ): Promise<ProviderResponse> {
    const startTime = Date.now();
    let selectedProvider = this.selectProvider(config);
    
    try {
      const response = await this.callProvider(
        selectedProvider,
        systemPrompt,
        userMessage,
        config
      );
      
      const responseTime = Date.now() - startTime;
      
      return {
        content: response.content,
        provider: selectedProvider,
        tokensUsed: this.estimateTokens(systemPrompt + userMessage + response.content),
        responseTime,
        confidence: this.calculateConfidence(response.content, selectedProvider),
      };
      
    } catch (error) {
      console.warn(`${selectedProvider} failed:`, error);
      
      // Fallback to OpenAI if Groq fails
      if (selectedProvider === 'groq' && this.fallbackEnabled) {
        console.log('Falling back to OpenAI...');
        
        try {
          const fallbackResponse = await this.callProvider(
            'openai',
            systemPrompt,
            userMessage,
            config
          );
          
          const responseTime = Date.now() - startTime;
          
          return {
            content: fallbackResponse.content,
            provider: 'openai',
            tokensUsed: this.estimateTokens(systemPrompt + userMessage + fallbackResponse.content),
            responseTime,
            confidence: this.calculateConfidence(fallbackResponse.content, 'openai'),
          };
          
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          throw new Error('Both primary and fallback LLM providers failed');
        }
      }
      
      throw error;
    }
  }

  /**
   * Call specific provider
   */
  private async callProvider(
    provider: LLMProvider,
    systemPrompt: string,
    userMessage: string,
    config?: LLMConfig
  ): Promise<{ content: string }> {
    let llm: BaseLanguageModel;
    
    if (provider === 'groq') {
      const model = this.selectGroqModel(config || { provider: 'groq' });
      llm = this.groqClients.get(model)!;
    } else {
      llm = this.openaiClient;
    }
    
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ];
    
    const response = await llm.invoke(messages);
    
    return {
      content: response.content as string,
    };
  }

  /**
   * Generate RAG response with context
   */
  async generateRAGResponse(
    query: string,
    context: string[],
    agentPersonality: string,
    config: LLMConfig = { provider: 'auto' }
  ): Promise<ProviderResponse> {
    const systemPrompt = `You are an AI assistant with the following personality: ${agentPersonality}

Use the following context to answer the user's question. If the context doesn't contain relevant information, say so politely.

Context:
${context.join('\n\n')}

Instructions:
- Be helpful and accurate
- Reference the context when relevant
- Maintain your personality
- If unsure, ask for clarification`;

    return await this.generateResponse(systemPrompt, query, config);
  }

  /**
   * Generate agent training response
   */
  async generateTrainingResponse(
    documents: string[],
    agentConfig: any,
    config: LLMConfig = { provider: 'openai' } // Use OpenAI for training consistency
  ): Promise<ProviderResponse> {
    const systemPrompt = `You are analyzing documents for AI agent training.

Agent Configuration:
- Name: ${agentConfig.name}
- Personality: ${agentConfig.personality?.tone} and ${agentConfig.personality?.style}
- Capabilities: ${agentConfig.capabilities?.join(', ')}

Analyze the following documents and provide:
1. Key topics covered
2. Potential FAQ questions and answers
3. Important facts and procedures
4. Any gaps in information

Documents to analyze:
${documents.join('\n\n---\n\n')}`;

    const query = 'Please analyze these documents for agent training.';
    
    return await this.generateResponse(systemPrompt, query, config);
  }

  /**
   * Check provider health
   */
  async checkProviderHealth(): Promise<{
    openai: boolean;
    groq: boolean;
    recommendation: LLMProvider;
  }> {
    const testPrompt = 'Test connection';
    const testMessage = 'Respond with "OK" if you can see this message.';
    
    let openaiHealthy = false;
    let groqHealthy = false;
    
    // Test OpenAI
    try {
      await this.callProvider('openai', testPrompt, testMessage);
      openaiHealthy = true;
    } catch (error) {
      console.warn('OpenAI health check failed:', error);
    }
    
    // Test Groq (test all models)
    try {
      await this.callProvider('groq', testPrompt, testMessage, { provider: 'groq', groqModel: 'gpt-oss-20b' });
      groqHealthy = true;
    } catch (error) {
      console.warn('Groq health check failed:', error);
    }
    
    // Recommend based on health
    let recommendation: LLMProvider = 'openai'; // Safe default
    if (groqHealthy && openaiHealthy) {
      recommendation = 'groq'; // Prefer cost-effective option
    } else if (openaiHealthy) {
      recommendation = 'openai';
    } else if (groqHealthy) {
      recommendation = 'groq';
    }
    
    return {
      openai: openaiHealthy,
      groq: groqHealthy,
      recommendation,
    };
  }

  /**
   * Estimate token usage (rough calculation)
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate confidence based on response and provider
   */
  private calculateConfidence(response: string, provider: LLMProvider): number {
    let baseConfidence = 0.8;
    
    // Provider-based confidence
    if (provider === 'openai') {
      baseConfidence = 0.9; // Higher confidence for OpenAI
    } else if (provider === 'groq') {
      baseConfidence = 0.85; // Good confidence for Groq
    }
    
    // Response quality indicators
    if (response.length < 20) {
      baseConfidence -= 0.2; // Very short responses are suspicious
    }
    
    if (response.includes('I don\'t know') || response.includes('unclear')) {
      baseConfidence -= 0.1; // Uncertainty indicators
    }
    
    if (response.includes('based on the context') || response.includes('according to')) {
      baseConfidence += 0.1; // Good context usage
    }
    
    return Math.max(0.1, Math.min(1.0, baseConfidence));
  }

  /**
   * Get provider configuration for user
   */
  getProviderConfig(userTier: UserTier, userPreference?: LLMProvider): LLMConfig {
    return {
      provider: userPreference || 'auto',
      userTier,
      fallbackEnabled: true,
    };
  }
}

// Export singleton instance
export const llmProvider = new LLMProviderService();