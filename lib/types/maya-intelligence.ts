// Maya Intelligence TypeScript Types and Interfaces

export interface MayaChartRequest {
  userQuery: string;
  dataContext: {
    query: string;
    timestamp: number;
    userId?: string;
    sessionId?: string;
  };
  platformData: {
    googleAds?: GoogleAdsData[];
    metaAds?: MetaAdsData[];
    linkedin?: LinkedInData[];
    messaging?: MessagingData[];
  };
  timeframe?: '7d' | '30d' | '90d' | '1y' | 'custom';
  previousCharts?: MayaChartConfig[];
}

export interface MayaChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter' | 'area' | 'funnel';
  data: ChartData;
  options: ChartOptions;
  insights: MayaInsights;
  voiceNarration: string;
  quickActions: MayaQuickAction[];
  metadata?: {
    generatedAt: number;
    modelUsed: string;
    processingTime: number;
    cacheHit: boolean;
  };
}

export interface MayaInsights {
  diagnostic: DiagnosticInsight[];
  prescriptive: PrescriptiveInsight[];
  predictive: PredictiveInsight[];
}

export interface DiagnosticInsight {
  finding: string;
  explanation: string;
  impact: ImpactLevel;
  metrics: Record<string, string | number>;
  confidence?: number;
  timeframe?: string;
}

export interface PrescriptiveInsight {
  action: string;
  priority: PriorityLevel;
  estimatedImpact: string;
  timeline: string;
  difficulty: DifficultyLevel;
  roi: string;
  prerequisites?: string[];
  risks?: string[];
}

export interface PredictiveInsight {
  forecast: string;
  confidence: number;
  timeframe: string;
  scenario: ScenarioType;
  keyDrivers: string[];
  assumptions?: string[];
  alternativeScenarios?: {
    optimistic: string;
    realistic: string;
    pessimistic: string;
  };
}

export interface MayaQuickAction {
  label: string;
  action: string;
  data?: Record<string, any>;
  type: InsightType;
  icon?: string;
  category?: 'optimization' | 'analysis' | 'configuration' | 'reporting';
}

export interface MayaModelProvider {
  name: 'openai-gpt4' | 'groq-120b' | 'groq-20b' | 'anthropic-claude' | 'local-llm';
  apiKey?: string;
  model: string;
  available: boolean;
  cost: number;
  endpoint?: string;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  capabilities: ModelCapability[];
}

export interface GoogleAdsData {
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  cpc: number;
  roas: number;
  date: string;
}

export interface MetaAdsData {
  adSetId: string;
  adSetName: string;
  reach: number;
  impressions: number;
  clicks: number;
  spend: number;
  purchases: number;
  purchaseValue: number;
  cpm: number;
  cpp: number;
  roas: number;
  date: string;
}

export interface LinkedInData {
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
  leadValue: number;
  ctr: number;
  cpl: number;
  date: string;
}

export interface MessagingData {
  platformId: string;
  platformName: 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'slack' | 'discord';
  messageCount: number;
  responseTime: number;
  resolutionRate: number;
  satisfactionScore: number;
  date: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointBackgroundColor?: string | string[];
  pointBorderColor?: string | string[];
  pointRadius?: number | number[];
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    title?: {
      display: boolean;
      text: string;
    };
    legend?: {
      display: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip?: {
      enabled: boolean;
      callbacks?: Record<string, Function>;
    };
  };
  scales?: {
    x?: ScaleConfiguration;
    y?: ScaleConfiguration;
  };
  interaction?: {
    mode: 'index' | 'dataset' | 'point' | 'nearest';
    intersect: boolean;
  };
}

export interface ScaleConfiguration {
  type?: 'linear' | 'logarithmic' | 'category' | 'time';
  display?: boolean;
  beginAtZero?: boolean;
  min?: number;
  max?: number;
  ticks?: {
    callback?: Function;
    stepSize?: number;
  };
  title?: {
    display: boolean;
    text: string;
  };
}

export interface MayaError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  context?: {
    userQuery?: string;
    modelUsed?: string;
    apiEndpoint?: string;
  };
}

export interface MayaPerformanceMetrics {
  requestDuration: number;
  cacheHitRate: number;
  modelResponseTime: number;
  chartRenderTime: number;
  totalProcessingTime: number;
  errorRate: number;
  apiCallsThisHour: number;
  apiCallsToday: number;
}

// Type Guards and Validation
export function isValidChartType(type: string): type is MayaChartConfig['type'] {
  return ['line', 'bar', 'pie', 'doughnut', 'scatter', 'area', 'funnel'].includes(type);
}

export function isValidImpactLevel(impact: string): impact is ImpactLevel {
  return ['high', 'medium', 'low'].includes(impact);
}

export function isValidPriorityLevel(priority: string): priority is PriorityLevel {
  return ['urgent', 'high', 'medium', 'low'].includes(priority);
}

export function isValidInsightType(type: string): type is InsightType {
  return ['diagnostic', 'prescriptive', 'predictive'].includes(type);
}

// Type aliases for better readability
export type ImpactLevel = 'high' | 'medium' | 'low';
export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';
export type DifficultyLevel = 'easy' | 'medium' | 'complex';
export type ScenarioType = 'optimistic' | 'realistic' | 'pessimistic';
export type InsightType = 'diagnostic' | 'prescriptive' | 'predictive';
export type ModelCapability = 'charts' | 'insights' | 'voice' | 'forecasting' | 'optimization';

// Validation schemas (for runtime validation with Zod if needed)
export const MayaChartRequestSchema = {
  userQuery: 'string',
  dataContext: {
    query: 'string',
    timestamp: 'number',
    userId: 'string?',
    sessionId: 'string?'
  },
  platformData: 'object',
  timeframe: 'string?',
  previousCharts: 'array?'
};

// Export all types for external use
export type {
  MayaChartRequest as ChartRequest,
  MayaChartConfig as ChartConfig,
  MayaInsights as Insights,
  MayaQuickAction as QuickAction,
  MayaModelProvider as ModelProvider,
  MayaError as IntelligenceError,
  MayaPerformanceMetrics as PerformanceMetrics
};