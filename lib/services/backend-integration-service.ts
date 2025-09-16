import { supabaseMultiUserService } from '@/lib/supabase/multi-user-service';
import { auth } from '@/lib/firebase';

export interface BackendRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  userContext?: any;
}

export interface BackendResponse {
  success: boolean;
  data?: any;
  error?: string;
  jobId?: string;
}

export interface MayaRequest {
  message: string;
  conversationId: string;
  context?: any;
  platform?: string;
  campaignData?: any;
}

export interface MayaResponse {
  response: string;
  suggestions?: string[];
  actions?: any[];
  confidence: number;
  requiresApproval?: boolean;
  jobId?: string;
}

export interface MayaAgentResponse {
  response: string;
  toolsUsed: string[];
  intermediateSteps: Array<{
    tool: string;
    input: any;
    output: any;
  }>;
  confidence: number;
  actions?: Array<{
    id: string;
    type: string;
    description: string;
    parameters: any;
    requiresApproval: boolean;
  }>;
  metadata?: {
    processingTime: number;
    model: string;
    tokenUsage: number;
  };
}

export interface PredictionResult {
  metric: string;
  current_value: number;
  predicted_value: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  percentage_change: number;
  factors: string[];
  timeframe: string;
}

export interface AnomalyDetection {
  type: 'spend' | 'performance' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  current_value: number;
  expected_value: number;
  deviation_percentage: number;
  description: string;
  recommendations: string[];
  detected_at: string;
}

export interface MemorySearchResult {
  id: string;
  content: string;
  type: 'campaign' | 'conversation' | 'insight' | 'general';
  score: number;
  metadata: Record<string, any>;
  created_at: string;
}

export class BackendIntegrationService {
  private static instance: BackendIntegrationService;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://fluffy-garbanzo-g4gjqvrr67v3w6g4-3001.app.github.dev';
    this.apiKey = process.env.BACKEND_API_KEY || '';
  }

  public static getInstance(): BackendIntegrationService {
    if (!BackendIntegrationService.instance) {
      BackendIntegrationService.instance = new BackendIntegrationService();
    }
    return BackendIntegrationService.instance;
  }

  private async makeRequest(request: BackendRequest): Promise<BackendResponse> {
    try {
      const firebaseUid = await supabaseMultiUserService.getCurrentUser();
      if (!firebaseUid) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.baseUrl}${request.endpoint}`, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-User-ID': firebaseUid, // Pass Firebase UID for backend user context
        },
        body: request.data ? JSON.stringify({
          ...request.data,
          userContext: {
            firebaseUid,
            ...request.userContext,
          },
        }) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
        jobId: data.jobId,
      };
    } catch (error) {
      console.error('Backend request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async queryMayaAgent(query: string, chatHistory?: any[], context?: any): Promise<MayaAgentResponse> {
    try {
      const firebaseUid = await supabaseMultiUserService.getCurrentUser();
      if (!firebaseUid) {
        throw new Error('No authenticated user');
      }

      // Get Supabase JWT token for authentication
      const supabaseToken = await supabaseMultiUserService.getSupabaseToken();
      if (!supabaseToken) {
        throw new Error('No Supabase token available');
      }

      const response = await fetch(`${this.baseUrl}/copilot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseToken}`,
        },
        body: JSON.stringify({
          message: query,
          userId: firebaseUid,
          chatHistory,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Maya Agent request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform backend response to expected format
      return {
        response: data.response || data.message || 'Response received',
        toolsUsed: data.toolsUsed || [],
        intermediateSteps: data.intermediateSteps || [],
        confidence: data.confidence || 0.8,
        actions: data.actions || [],
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('Maya Agent query failed:', error);
      throw error;
    }
  }

  async queryMaya(request: MayaRequest): Promise<MayaResponse> {
    try {
      // Get Firebase UID first
      const firebaseUid = await supabaseMultiUserService.getCurrentUser();
      if (!firebaseUid) {
        throw new Error('No authenticated user');
      }

      // Store the user message in conversation history
      await supabaseMultiUserService.storeMayaConversation(
        request.conversationId,
        'user',
        request.message,
        request.context
      );

      // Send request to backend Maya Agent (LangChain copilot)
      const backendResponse = await this.makeRequest({
        endpoint: '/copilot',
        method: 'POST',
        data: {
          message: request.message,
          userId: firebaseUid,
          conversationId: request.conversationId,
          context: request.context,
          platform: request.platform,
          campaignData: request.campaignData,
        },
      });

      if (!backendResponse.success) {
        throw new Error(backendResponse.error || 'Maya request failed');
      }

      const mayaResponse: MayaResponse = backendResponse.data;

      // Store the assistant response in conversation history
      await supabaseMultiUserService.storeMayaConversation(
        request.conversationId,
        'assistant',
        mayaResponse.response,
        {
          suggestions: mayaResponse.suggestions,
          actions: mayaResponse.actions,
          confidence: mayaResponse.confidence,
          jobId: mayaResponse.jobId,
        }
      );

      // Track Maya interaction
      await supabaseMultiUserService.trackActivity('maya_query', {
        conversationId: request.conversationId,
        platform: request.platform,
        confidence: mayaResponse.confidence,
        hasActions: !!mayaResponse.actions?.length,
        timestamp: new Date().toISOString(),
      });

      return mayaResponse;
    } catch (error) {
      console.error('Maya query failed:', error);
      
      // Store error in conversation
      await supabaseMultiUserService.storeMayaConversation(
        request.conversationId,
        'assistant',
        'I apologize, but I encountered an error processing your request. Please try again.',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        confidence: 0,
        suggestions: ['Try rephrasing your question', 'Check your platform connections'],
      };
    }
  }

  async executeAutomation(workflowId: string, params?: any): Promise<BackendResponse> {
    try {
      const response = await this.makeRequest({
        endpoint: '/automation/execute',
        method: 'POST',
        data: {
          workflowId,
          params,
        },
      });

      // Track automation execution
      await supabaseMultiUserService.trackActivity('automation_executed', {
        workflowId,
        success: response.success,
        jobId: response.jobId,
        timestamp: new Date().toISOString(),
      });

      return response;
    } catch (error) {
      console.error('Automation execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async syncPlatformData(platform: string, forceSync = false): Promise<BackendResponse> {
    try {
      const response = await this.makeRequest({
        endpoint: '/sync/platform',
        method: 'POST',
        data: {
          platform,
          forceSync,
        },
      });

      // Track sync operation
      await supabaseMultiUserService.trackActivity('platform_sync', {
        platform,
        success: response.success,
        forceSync,
        timestamp: new Date().toISOString(),
      });

      return response;
    } catch (error) {
      console.error('Platform sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getCampaignOptimizations(campaignId: string, platform: string): Promise<BackendResponse> {
    try {
      const response = await this.makeRequest({
        endpoint: `/optimization/campaign/${campaignId}`,
        method: 'GET',
        userContext: { platform },
      });

      // Track optimization request
      await supabaseMultiUserService.trackActivity('optimization_requested', {
        campaignId,
        platform,
        success: response.success,
        timestamp: new Date().toISOString(),
      });

      return response;
    } catch (error) {
      console.error('Campaign optimization failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getAudienceInsights(platform: string, audienceParams?: any): Promise<BackendResponse> {
    try {
      const response = await this.makeRequest({
        endpoint: '/insights/audience',
        method: 'POST',
        data: {
          platform,
          audienceParams,
        },
      });

      return response;
    } catch (error) {
      console.error('Audience insights failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async generateReport(reportType: string, params: any): Promise<BackendResponse> {
    try {
      const response = await this.makeRequest({
        endpoint: '/reports/generate',
        method: 'POST',
        data: {
          reportType,
          params,
        },
      });

      // Track report generation
      await supabaseMultiUserService.trackActivity('report_generated', {
        reportType,
        success: response.success,
        jobId: response.jobId,
        timestamp: new Date().toISOString(),
      });

      return response;
    } catch (error) {
      console.error('Report generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getJobStatus(jobId: string): Promise<BackendResponse> {
    try {
      const response = await this.makeRequest({
        endpoint: `/jobs/${jobId}/status`,
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Job status check failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // New Advanced Intelligence Methods
  async generateForecast(timeframe: '1d' | '7d' | '30d' = '7d'): Promise<PredictionResult[]> {
    try {
      const response = await this.makeRequest({
        endpoint: '/analytics/forecast',
        method: 'POST',
        data: { timeframe },
      });

      if (!response.success) {
        throw new Error(response.error || 'Forecast generation failed');
      }

      return response.data.predictions;
    } catch (error) {
      console.error('Forecast generation failed:', error);
      throw error;
    }
  }

  async detectAnomalies(): Promise<AnomalyDetection[]> {
    try {
      const response = await this.makeRequest({
        endpoint: '/analytics/anomalies',
        method: 'POST',
        data: {},
      });

      if (!response.success) {
        throw new Error(response.error || 'Anomaly detection failed');
      }

      return response.data.anomalies;
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      throw error;
    }
  }

  async getCompetitiveIntelligence(industry?: string): Promise<any> {
    try {
      const response = await this.makeRequest({
        endpoint: '/analytics/competitive-intelligence',
        method: 'POST',
        data: { industry },
      });

      if (!response.success) {
        throw new Error(response.error || 'Competitive intelligence failed');
      }

      return response.data;
    } catch (error) {
      console.error('Competitive intelligence failed:', error);
      throw error;
    }
  }

  async getSmartRecommendations(): Promise<any[]> {
    try {
      const response = await this.makeRequest({
        endpoint: '/analytics/recommendations',
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.error || 'Recommendations failed');
      }

      return response.data.recommendations;
    } catch (error) {
      console.error('Smart recommendations failed:', error);
      throw error;
    }
  }

  async searchMemory(query: string, type?: 'campaign' | 'conversation' | 'insight' | 'general', limit = 5): Promise<MemorySearchResult[]> {
    try {
      const response = await this.makeRequest({
        endpoint: '/memory/search',
        method: 'POST',
        data: { query, type, limit },
      });

      if (!response.success) {
        throw new Error(response.error || 'Memory search failed');
      }

      return response.data.results;
    } catch (error) {
      console.error('Memory search failed:', error);
      throw error;
    }
  }

  async storeMemory(content: string, type: 'campaign' | 'conversation' | 'insight' | 'general', metadata: Record<string, any> = {}): Promise<string> {
    try {
      const response = await this.makeRequest({
        endpoint: '/memory/store',
        method: 'POST',
        data: { content, type, metadata },
      });

      if (!response.success) {
        throw new Error(response.error || 'Memory storage failed');
      }

      return response.data.memoryId;
    } catch (error) {
      console.error('Memory storage failed:', error);
      throw error;
    }
  }

  async executeApprovedAction(callbackId: string, actionData: any): Promise<any> {
    try {
      const response = await this.makeRequest({
        endpoint: '/maya/execute-action',
        method: 'POST',
        data: {
          callbackId,
          approved: true,
          actionData,
        },
      });

      if (!response.success) {
        throw new Error(response.error || 'Action execution failed');
      }

      return response.data;
    } catch (error) {
      console.error('Action execution failed:', error);
      throw error;
    }
  }

  async getMayaCapabilities(): Promise<any> {
    try {
      const response = await this.makeRequest({
        endpoint: '/maya/capabilities',
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to get capabilities');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get Maya capabilities:', error);
      throw error;
    }
  }

  async getMemoryStats(): Promise<any> {
    try {
      const response = await this.makeRequest({
        endpoint: '/memory/stats',
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to get memory stats');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get memory stats:', error);
      throw error;
    }
  }

  async getAnalyticsHealth(): Promise<any> {
    try {
      const response = await this.makeRequest({
        endpoint: '/analytics/health',
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to get analytics health');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get analytics health:', error);
      throw error;
    }
  }

  // Enhanced batch operations for better performance
  async batchOperations(operations: Array<{
    type: 'query' | 'forecast' | 'anomalies' | 'memory';
    params: any;
  }>): Promise<any[]> {
    try {
      const promises = operations.map(async (op) => {
        switch (op.type) {
          case 'query':
            return this.queryMayaAgent(op.params.query, op.params.chatHistory, op.params.context);
          case 'forecast':
            return this.generateForecast(op.params.timeframe);
          case 'anomalies':
            return this.detectAnomalies();
          case 'memory':
            return this.searchMemory(op.params.query, op.params.type, op.params.limit);
          default:
            throw new Error(`Unknown operation type: ${op.type}`);
        }
      });

      return await Promise.all(promises);
    } catch (error) {
      console.error('Batch operations failed:', error);
      throw error;
    }
  }

  // Cache management for better performance
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private getCacheKey(endpoint: string, params: any): string {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCachedData(key: string, data: any, ttl = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  async getCachedForecast(timeframe: '1d' | '7d' | '30d' = '7d'): Promise<PredictionResult[]> {
    const cacheKey = this.getCacheKey('forecast', { timeframe });
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const forecast = await this.generateForecast(timeframe);
    this.setCachedData(cacheKey, forecast, 1800000); // 30 minutes cache
    
    return forecast;
  }

  async getCachedAnomalies(): Promise<AnomalyDetection[]> {
    const cacheKey = this.getCacheKey('anomalies', {});
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const anomalies = await this.detectAnomalies();
    this.setCachedData(cacheKey, anomalies, 300000); // 5 minutes cache
    
    return anomalies;
  }

  // Google Ads Integration Methods
  async fetchGoogleAdsPerformance(dateRange?: { startDate: string; endDate: string }): Promise<BackendResponse> {
    try {
      const response = await this.makeRequest({
        endpoint: '/api/jobs/google-ads',
        method: 'POST',
        data: {
          platform: 'google_ads',
          dateRange: dateRange || {
            startDate: '2025-06-01',
            endDate: '2025-08-31'
          },
          customerId: '8476740998' // Primary account
        },
      });

      // Track Google Ads sync
      await supabaseMultiUserService.trackActivity('google_ads_sync', {
        success: response.success,
        jobId: response.jobId,
        dateRange,
        timestamp: new Date().toISOString(),
      });

      return response;
    } catch (error) {
      console.error('Google Ads performance fetch failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getGoogleAdsCampaigns(): Promise<BackendResponse> {
    try {
      const response = await this.makeRequest({
        endpoint: '/api/google-ads/fetchCampaigns',
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Google Ads campaigns fetch failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getGoogleAdsKPIs(): Promise<BackendResponse> {
    try {
      // Get recent performance data for KPIs
      const response = await this.makeRequest({
        endpoint: '/api/google-ads/fetchPerformanceMetrics',
        method: 'POST',
        data: {
          startDate: '2025-08-01',
          endDate: '2025-08-31'
        }
      });

      return response;
    } catch (error) {
      console.error('Google Ads KPIs fetch failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const backendIntegrationService = BackendIntegrationService.getInstance();