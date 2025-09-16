/**
 * Unified Multi-Platform Chart Intelligence System
 * Core Types and Interfaces
 */

export type PlatformType = 'advertising' | 'analytics' | 'social' | 'ecommerce' | 'crm' | 'email' | 'sms';

export interface DateRange {
  start: Date;
  end: Date;
  period?: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface RawPlatformData {
  [key: string]: any;
}

export interface StandardMetrics {
  // Universal metrics that all platforms can map to
  impressions?: number;
  clicks?: number;
  conversions?: number;
  spend?: number;
  revenue?: number;
  users?: number;
  sessions?: number;
  pageViews?: number;
  engagementRate?: number;
  conversionRate?: number;
  costPerClick?: number;
  costPerConversion?: number;
  returnOnAdSpend?: number;
  clickThroughRate?: number;
  
  // Meta information
  platform: string;
  dataType: string;
  timestamp: Date;
  currency?: string;
  
  // Platform-specific data preserved as JSON
  platformSpecific?: Record<string, any>;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter' | 'area' | 'gauge';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      tension?: number;
      [key: string]: any;
    }>;
  };
  options: Record<string, any>;
  insights: Insight[];
  voiceNarration: string;
  quickActions: QuickAction[];
}

export interface Insight {
  type: 'trend' | 'correlation' | 'anomaly' | 'recommendation' | 'benchmark';
  title: string;
  description: string;
  value?: number | string;
  change?: {
    amount: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
    period: string;
  };
  confidence: number; // 0-1
  platforms: string[];
  metadata?: Record<string, any>;
}

export interface QuickAction {
  label: string;
  action: string;
  type: 'diagnostic' | 'prescriptive' | 'predictive';
  data?: any;
  icon?: string;
}

export interface UnifiedMetrics {
  platforms: PlatformMetrics[];
  crossPlatformInsights: Insight[];
  overallQuality: number;
  lastUpdated: Date;
  dataFreshness: Record<string, string>;
}

export interface PlatformMetrics {
  platform: string;
  platformName: string;
  platformType: PlatformType;
  metrics: StandardMetrics;
  quality: number;
  freshness: string;
  error?: string;
  lastSync?: Date;
}

export interface UnifiedChartConfig extends ChartConfig {
  platformsUsed: string[];
  dataQuality: number;
  crossPlatformCorrelations: Correlation[];
  queryIntent: string;
  confidenceScore: number;
}

export interface Correlation {
  platforms: [string, string];
  metric: string;
  coefficient: number; // -1 to 1
  strength: 'weak' | 'moderate' | 'strong';
  description: string;
}

export interface PlatformConnector {
  // Platform identification
  id: string;
  name: string;
  type: PlatformType;
  version: string;
  
  // Capabilities
  capabilities: {
    realTimeData: boolean;
    historicalData: boolean;
    predictiveAnalytics: boolean;
    crossPlatformCorrelation: boolean;
  };
  
  // Authentication
  authenticate(userId: string): Promise<boolean>;
  isAuthenticated(userId: string): Promise<boolean>;
  
  // Data operations
  fetchData(userId: string, dateRange?: DateRange): Promise<RawPlatformData>;
  transformToStandardFormat(data: RawPlatformData): StandardMetrics;
  
  // Chart generation
  generateChartConfig(metrics: StandardMetrics, query: string): ChartConfig;
  
  // Voice synthesis
  generateVoiceNarration(metrics: StandardMetrics, insights: Insight[]): string;
  
  // Health check
  validateData(data: StandardMetrics): { isValid: boolean; issues: string[] };
  getDataFreshness(data: StandardMetrics): string;
  
  // Metadata
  getSupportedMetrics(): string[];
  getDefaultChartTypes(): string[];
  getOptimalDateRanges(): string[];
}

export interface PlatformRegistryConfig {
  enableAutoDiscovery: boolean;
  fallbackToMockData: boolean;
  cacheTimeout: number;
  maxRetries: number;
  enableCrossPlatformAnalysis: boolean;
  voiceNarrationEnabled: boolean;
}

export interface ChartGenerationRequest {
  userId: string;
  query: string;
  platforms?: string[];
  dateRange?: DateRange;
  chartType?: string;
  includeVoiceNarration?: boolean;
  includeCrossPlatformAnalysis?: boolean;
  maxPlatforms?: number;
}

export interface VoiceNarrationOptions {
  length: 'short' | 'medium' | 'long';
  style: 'conversational' | 'professional' | 'casual';
  includeNumbers: boolean;
  includeRecommendations: boolean;
  skipTechnicalTerms: boolean;
}