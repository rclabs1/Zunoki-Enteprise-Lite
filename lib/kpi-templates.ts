/**
 * KPI Template Library
 * Industry-specific KPI definitions with real data source mappings
 * Supports Acquisition, Engagement, Retention, and Business frameworks
 */

import { KPIMetric } from '@/components/maya/maya-kpi-bar';

export interface KPITemplateDefinition {
  id: string;
  name: string;
  description: string;
  industry: string[];
  categories: {
    acquisition: KPIDefinition[];
    engagement: KPIDefinition[];
    retention: KPIDefinition[];
    business: KPIDefinition[];
  };
  defaultEnabled: string[]; // KPI IDs that are enabled by default
  premium?: boolean;
}

export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  dataSource: 'google_ads' | 'ga4' | 'mixpanel' | 'calculated' | 'platform';
  calculation: string;
  format: 'number' | 'currency' | 'percentage' | 'duration' | 'ratio';
  benchmark?: number;
  target?: number;
  priority: number;
  alerts?: {
    high?: number;
    low?: number;
    change?: number;
  };
}

// E-COMMERCE TEMPLATE
export const ecommerceTemplate: KPITemplateDefinition = {
  id: 'ecommerce',
  name: 'E-commerce',
  description: 'Online retail, marketplaces, D2C brands',
  industry: ['retail', 'marketplace', 'd2c', 'ecommerce'],
  categories: {
    acquisition: [
      {
        id: 'paid_traffic',
        name: 'Paid Traffic',
        description: 'Users acquired through paid advertising',
        icon: '📢',
        color: '#3B82F6',
        dataSource: 'google_ads',
        calculation: 'clicks',
        format: 'number',
        priority: 1,
        benchmark: 10000
      },
      {
        id: 'organic_traffic',
        name: 'Organic Traffic',
        description: 'Users from organic search and direct visits',
        icon: '🌐',
        color: '#10B981',
        dataSource: 'ga4',
        calculation: 'sessions.organic',
        format: 'number',
        priority: 2
      },
      {
        id: 'conversion_rate',
        name: 'Conversion Rate',
        description: 'Percentage of visitors who make a purchase',
        icon: '🎯',
        color: '#F59E0B',
        dataSource: 'ga4',
        calculation: 'conversions / sessions * 100',
        format: 'percentage',
        priority: 3,
        benchmark: 2.5,
        target: 3.5
      },
      {
        id: 'customer_acquisition_cost',
        name: 'Customer Acquisition Cost',
        description: 'Average cost to acquire one customer',
        icon: '💸',
        color: '#EF4444',
        dataSource: 'calculated',
        calculation: 'ad_spend / new_customers',
        format: 'currency',
        priority: 4,
        target: 50,
        alerts: { high: 75 }
      }
    ],
    engagement: [
      {
        id: 'session_duration',
        name: 'Session Duration',
        description: 'Average time users spend on site per visit',
        icon: '⏱️',
        color: '#8B5CF6',
        dataSource: 'ga4',
        calculation: 'avg_session_duration',
        format: 'duration',
        priority: 1,
        benchmark: 180 // 3 minutes
      },
      {
        id: 'pages_per_session',
        name: 'Pages per Session',
        description: 'Average pages viewed in each session',
        icon: '📄',
        color: '#06B6D4',
        dataSource: 'ga4',
        calculation: 'pageviews / sessions',
        format: 'ratio',
        priority: 2,
        benchmark: 2.5
      },
      {
        id: 'cart_abandonment_rate',
        name: 'Cart Abandonment Rate',
        description: 'Percentage of carts abandoned before checkout',
        icon: '🛒',
        color: '#F59E0B',
        dataSource: 'ga4',
        calculation: 'abandoned_carts / cart_additions * 100',
        format: 'percentage',
        priority: 3,
        target: 65, // Lower is better
        alerts: { high: 80 }
      },
      {
        id: 'product_page_views',
        name: 'Product Page Views',
        description: 'Total views on product detail pages',
        icon: '👁️',
        color: '#10B981',
        dataSource: 'ga4',
        calculation: 'product_detail_views',
        format: 'number',
        priority: 4
      }
    ],
    retention: [
      {
        id: 'repeat_purchase_rate',
        name: 'Repeat Purchase Rate',
        description: 'Percentage of customers who make repeat purchases',
        icon: '🔄',
        color: '#3B82F6',
        dataSource: 'mixpanel',
        calculation: 'repeat_customers / total_customers * 100',
        format: 'percentage',
        priority: 1,
        benchmark: 25,
        target: 35
      },
      {
        id: 'customer_lifetime_value',
        name: 'Customer Lifetime Value',
        description: 'Predicted revenue from average customer relationship',
        icon: '💎',
        color: '#10B981',
        dataSource: 'calculated',
        calculation: 'avg_order_value * purchase_frequency * customer_lifespan',
        format: 'currency',
        priority: 2,
        benchmark: 200
      },
      {
        id: 'churn_rate',
        name: 'Customer Churn Rate',
        description: 'Percentage of customers who stop purchasing',
        icon: '📉',
        color: '#EF4444',
        dataSource: 'mixpanel',
        calculation: 'churned_customers / total_customers * 100',
        format: 'percentage',
        priority: 3,
        target: 5, // Lower is better
        alerts: { high: 10 }
      }
    ],
    business: [
      {
        id: 'revenue',
        name: 'Total Revenue',
        description: 'Total revenue generated from all sales',
        icon: '💰',
        color: '#10B981',
        dataSource: 'ga4',
        calculation: 'purchase_revenue',
        format: 'currency',
        priority: 1
      },
      {
        id: 'average_order_value',
        name: 'Average Order Value',
        description: 'Average amount spent per transaction',
        icon: '🛍️',
        color: '#3B82F6',
        dataSource: 'ga4',
        calculation: 'revenue / transactions',
        format: 'currency',
        priority: 2,
        benchmark: 75
      },
      {
        id: 'return_on_ad_spend',
        name: 'Return on Ad Spend',
        description: 'Revenue generated per dollar spent on advertising',
        icon: '📈',
        color: '#8B5CF6',
        dataSource: 'calculated',
        calculation: 'revenue / ad_spend',
        format: 'ratio',
        priority: 3,
        benchmark: 4.0,
        target: 5.0
      },
      {
        id: 'gross_margin',
        name: 'Gross Margin',
        description: 'Percentage of revenue after cost of goods sold',
        icon: '📊',
        color: '#F59E0B',
        dataSource: 'calculated',
        calculation: '(revenue - cogs) / revenue * 100',
        format: 'percentage',
        priority: 4,
        benchmark: 40
      }
    ]
  },
  defaultEnabled: ['paid_traffic', 'conversion_rate', 'session_duration', 'repeat_purchase_rate', 'revenue', 'return_on_ad_spend']
};

// SAAS TEMPLATE
export const saasTemplate: KPITemplateDefinition = {
  id: 'saas',
  name: 'SaaS',
  description: 'Software as a Service, subscription platforms',
  industry: ['software', 'saas', 'b2b', 'subscription'],
  categories: {
    acquisition: [
      {
        id: 'trial_signups',
        name: 'Trial Signups',
        description: 'New users starting free trials',
        icon: '🚀',
        color: '#3B82F6',
        dataSource: 'mixpanel',
        calculation: 'trial_started',
        format: 'number',
        priority: 1
      },
      {
        id: 'lead_quality_score',
        name: 'Lead Quality Score',
        description: 'Average quality score of incoming leads',
        icon: '⭐',
        color: '#F59E0B',
        dataSource: 'calculated',
        calculation: 'weighted_lead_score',
        format: 'number',
        priority: 2,
        benchmark: 75
      },
      {
        id: 'demo_requests',
        name: 'Demo Requests',
        description: 'Requests for product demonstrations',
        icon: '🎥',
        color: '#10B981',
        dataSource: 'platform',
        calculation: 'demo_form_submissions',
        format: 'number',
        priority: 3
      },
      {
        id: 'organic_signups',
        name: 'Organic Signups',
        description: 'Signups from organic channels',
        icon: '🌱',
        color: '#8B5CF6',
        dataSource: 'ga4',
        calculation: 'signups.organic',
        format: 'number',
        priority: 4
      }
    ],
    engagement: [
      {
        id: 'feature_adoption_rate',
        name: 'Feature Adoption Rate',
        description: 'Percentage of users adopting key features',
        icon: '🎯',
        color: '#3B82F6',
        dataSource: 'mixpanel',
        calculation: 'feature_users / total_users * 100',
        format: 'percentage',
        priority: 1,
        benchmark: 60
      },
      {
        id: 'daily_active_users',
        name: 'Daily Active Users',
        description: 'Users who engage with the platform daily',
        icon: '👥',
        color: '#10B981',
        dataSource: 'mixpanel',
        calculation: 'daily_active_users',
        format: 'number',
        priority: 2
      },
      {
        id: 'session_frequency',
        name: 'Session Frequency',
        description: 'Average sessions per user per week',
        icon: '🔄',
        color: '#F59E0B',
        dataSource: 'mixpanel',
        calculation: 'sessions / users / 7',
        format: 'ratio',
        priority: 3,
        benchmark: 3.5
      },
      {
        id: 'support_ticket_rate',
        name: 'Support Ticket Rate',
        description: 'Support tickets per 100 active users',
        icon: '🎧',
        color: '#EF4444',
        dataSource: 'platform',
        calculation: 'tickets / active_users * 100',
        format: 'ratio',
        priority: 4,
        target: 2, // Lower is better
        alerts: { high: 5 }
      }
    ],
    retention: [
      {
        id: 'monthly_churn_rate',
        name: 'Monthly Churn Rate',
        description: 'Percentage of customers canceling monthly',
        icon: '📉',
        color: '#EF4444',
        dataSource: 'mixpanel',
        calculation: 'churned_subscriptions / total_subscriptions * 100',
        format: 'percentage',
        priority: 1,
        target: 5, // Lower is better
        alerts: { high: 8 }
      },
      {
        id: 'expansion_revenue',
        name: 'Expansion Revenue',
        description: 'Revenue from existing customer upgrades',
        icon: '📈',
        color: '#10B981',
        dataSource: 'calculated',
        calculation: 'upgrade_revenue',
        format: 'currency',
        priority: 2
      },
      {
        id: 'net_retention_rate',
        name: 'Net Retention Rate',
        description: 'Revenue retention including expansions',
        icon: '🔄',
        color: '#3B82F6',
        dataSource: 'calculated',
        calculation: '(start_mrr + expansion - contraction - churn) / start_mrr * 100',
        format: 'percentage',
        priority: 3,
        benchmark: 110,
        target: 120
      },
      {
        id: 'user_health_score',
        name: 'User Health Score',
        description: 'Composite score indicating user engagement health',
        icon: '❤️',
        color: '#8B5CF6',
        dataSource: 'calculated',
        calculation: 'weighted_engagement_score',
        format: 'number',
        priority: 4,
        benchmark: 75
      }
    ],
    business: [
      {
        id: 'monthly_recurring_revenue',
        name: 'Monthly Recurring Revenue',
        description: 'Predictable monthly revenue from subscriptions',
        icon: '💰',
        color: '#10B981',
        dataSource: 'calculated',
        calculation: 'subscription_revenue_monthly',
        format: 'currency',
        priority: 1
      },
      {
        id: 'annual_recurring_revenue',
        name: 'Annual Recurring Revenue',
        description: 'Annualized recurring revenue',
        icon: '📅',
        color: '#3B82F6',
        dataSource: 'calculated',
        calculation: 'mrr * 12',
        format: 'currency',
        priority: 2
      },
      {
        id: 'ltv_cac_ratio',
        name: 'LTV/CAC Ratio',
        description: 'Ratio of customer lifetime value to acquisition cost',
        icon: '⚖️',
        color: '#8B5CF6',
        dataSource: 'calculated',
        calculation: 'customer_lifetime_value / customer_acquisition_cost',
        format: 'ratio',
        priority: 3,
        benchmark: 3.0,
        target: 5.0
      },
      {
        id: 'gross_revenue_retention',
        name: 'Gross Revenue Retention',
        description: 'Revenue retained from existing customers',
        icon: '🛡️',
        color: '#F59E0B',
        dataSource: 'calculated',
        calculation: 'retained_revenue / start_revenue * 100',
        format: 'percentage',
        priority: 4,
        benchmark: 90,
        target: 95
      }
    ]
  },
  defaultEnabled: ['trial_signups', 'feature_adoption_rate', 'monthly_churn_rate', 'monthly_recurring_revenue', 'ltv_cac_ratio', 'user_health_score']
};

// TEMPLATE REGISTRY
export const KPI_TEMPLATES: Record<string, KPITemplateDefinition> = {
  ecommerce: ecommerceTemplate,
  saas: saasTemplate,
  // Add more templates as needed
};

// UTILITY FUNCTIONS
export function getTemplateById(templateId: string): KPITemplateDefinition | null {
  return KPI_TEMPLATES[templateId] || null;
}

export function getAllTemplates(): KPITemplateDefinition[] {
  return Object.values(KPI_TEMPLATES);
}

export function createKPIFromDefinition(
  definition: KPIDefinition,
  section: 'acquisition' | 'engagement' | 'retention' | 'business',
  actualValue?: any,
  change?: number,
  trend?: 'up' | 'down' | 'stable'
): KPIMetric {
  return {
    id: definition.id,
    name: definition.name,
    value: actualValue || generateMockValue(definition.format, definition.benchmark),
    change: change || generateMockChange(),
    trend: trend || generateMockTrend(change),
    icon: definition.icon,
    color: definition.color,
    priority: definition.priority,
    section: section,
    dataSource: definition.dataSource,
    description: definition.description,
    benchmark: definition.benchmark,
    target: definition.target,
    alert: generateAlert(definition, actualValue)
  };
}

export function generateKPIsFromTemplate(
  templateId: string,
  userSelections?: string[],
  realData?: Record<string, any>
): KPIMetric[] {
  const template = getTemplateById(templateId);
  if (!template) return [];

  const enabledKPIs = userSelections || template.defaultEnabled;
  const kpis: KPIMetric[] = [];

  // Process each category
  Object.entries(template.categories).forEach(([section, definitions]) => {
    definitions.forEach(definition => {
      if (enabledKPIs.includes(definition.id)) {
        const realValue = realData?.[definition.id];
        const kpi = createKPIFromDefinition(
          definition,
          section as 'acquisition' | 'engagement' | 'retention' | 'business',
          realValue?.value,
          realValue?.change,
          realValue?.trend
        );
        kpis.push(kpi);
      }
    });
  });

  return kpis.sort((a, b) => a.priority - b.priority);
}

// MOCK DATA GENERATORS (for development)
function generateMockValue(format: string, benchmark?: number): string | number {
  const base = benchmark || 100;
  const variance = 0.3; // 30% variance
  const value = base * (1 + (Math.random() - 0.5) * variance);

  switch (format) {
    case 'currency':
      return `$${Math.round(value).toLocaleString()}`;
    case 'percentage':
      return `${Math.round(value)}%`;
    case 'duration':
      return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
    case 'ratio':
      return `${(value / 10).toFixed(1)}x`;
    default:
      return Math.round(value);
  }
}

function generateMockChange(): number {
  return (Math.random() - 0.4) * 40; // Bias toward positive changes
}

function generateMockTrend(change?: number): 'up' | 'down' | 'stable' {
  const c = change || generateMockChange();
  if (Math.abs(c) < 2) return 'stable';
  return c > 0 ? 'up' : 'down';
}

function generateAlert(definition: KPIDefinition, actualValue?: any): KPIMetric['alert'] {
  if (!definition.alerts || !actualValue) return undefined;

  const numericValue = typeof actualValue === 'number' ? actualValue : parseFloat(String(actualValue).replace(/[^0-9.-]/g, ''));
  
  if (definition.alerts.high && numericValue > definition.alerts.high) {
    return {
      type: 'warning',
      message: `${definition.name} is above recommended threshold`
    };
  }
  
  if (definition.alerts.low && numericValue < definition.alerts.low) {
    return {
      type: 'error',
      message: `${definition.name} is below minimum threshold`
    };
  }

  return undefined;
}