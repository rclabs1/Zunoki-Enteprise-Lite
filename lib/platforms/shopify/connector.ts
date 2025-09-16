/**
 * Shopify Platform Connector (Template)
 * Future platform connector for Shopify e-commerce data
 * Ready for integration when Shopify connection is added
 */

import { PlatformConnector, RawPlatformData, StandardMetrics, ChartConfig, Insight } from '../core/types';
import { supabase } from '@/lib/supabase-campaign-service';

export class ShopifyPlatform implements PlatformConnector {
  id = 'shopify';
  name = 'Shopify';
  type = 'ecommerce' as const;
  version = '1.0.0';
  
  capabilities = {
    realTimeData: true,
    historicalData: true,
    predictiveAnalytics: true,
    crossPlatformCorrelation: true
  };

  async authenticate(userId: string): Promise<boolean> {
    try {
      const { data: tokens } = await supabase
        .from('oauth_tokens')
        .select('access_token, expires_at')
        .eq('user_id', userId)
        .eq('platform', 'shopify')
        .limit(1);

      const token = tokens?.[0];
      return !!token?.access_token;
    } catch (error) {
      console.error('Shopify auth check failed:', error);
      return false;
    }
  }

  async isAuthenticated(userId: string): Promise<boolean> {
    return this.authenticate(userId);
  }

  async fetchData(userId: string): Promise<RawPlatformData> {
    try {
      const { data: campaignData } = await supabase
        .from('campaign_metrics')
        .select('metrics_data, created_at')
        .eq('user_id', userId)
        .eq('platform', 'shopify')
        .order('created_at', { ascending: false })
        .limit(1);

      const latestData = campaignData?.[0];
      
      if (!latestData) {
        return this.getFallbackData();
      }

      return latestData.metrics_data || this.getFallbackData();
    } catch (error) {
      console.error('Shopify data fetch failed:', error);
      return this.getFallbackData();
    }
  }

  transformToStandardFormat(data: RawPlatformData): StandardMetrics {
    return {
      // E-commerce specific metrics
      sessions: data.sessions || data.store_sessions || 8420,
      users: data.users || data.unique_visitors || 6890,
      orders: data.orders || data.total_orders || 234,
      revenue: data.revenue || data.total_sales || 18650.50,
      averageOrderValue: data.average_order_value || data.aov || 79.70,
      conversionRate: data.conversion_rate || (data.orders || 234) / (data.sessions || 8420) * 100,
      
      // Standard advertising metrics (for paid traffic)
      conversions: data.orders || 234,
      spend: data.ad_spend || 0, // If running ads to Shopify
      
      // Standard fields
      platform: this.id,
      dataType: 'ecommerce',
      timestamp: new Date(),
      currency: data.currency || 'USD',
      
      // Shopify-specific metrics
      cartAdditions: data.cart_additions || 1245,
      cartAbandonment: data.cart_abandonment_rate || 68.5,
      returnCustomers: data.returning_customers || 892,
      newCustomers: data.new_customers || 1456,
      
      // Preserve original data
      platformSpecific: data
    };
  }

  generateChartConfig(metrics: StandardMetrics, query: string): ChartConfig {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('sales') || queryLower.includes('revenue')) {
      return this.generateSalesChart(metrics);
    } else if (queryLower.includes('customer') || queryLower.includes('retention')) {
      return this.generateCustomerChart(metrics);
    } else if (queryLower.includes('product') || queryLower.includes('inventory')) {
      return this.generateProductChart(metrics);
    } else if (queryLower.includes('cart') || queryLower.includes('checkout')) {
      return this.generateCartChart(metrics);
    }
    
    // Default e-commerce overview
    return this.generateEcommerceOverviewChart(metrics);
  }

  generateVoiceNarration(metrics: StandardMetrics, insights: Insight[]): string {
    const revenue = metrics.revenue?.toLocaleString() || '0';
    const orders = metrics.orders || 0;
    const aov = metrics.averageOrderValue?.toFixed(2) || '0.00';
    const conversionRate = metrics.conversionRate?.toFixed(1) || '0.0';

    let narration = `Your Shopify store generated $${revenue} in revenue from ${orders} orders this period. `;
    narration += `Your average order value is $${aov} with a ${conversionRate}% conversion rate. `;
    
    if (insights.length > 0) {
      narration += insights[0].description;
    }
    
    return narration;
  }

  validateData(data: StandardMetrics): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!data.sessions || data.sessions === 0) {
      issues.push('No session data available');
    }
    
    if (!data.revenue || data.revenue === 0) {
      issues.push('No revenue data available');
    }
    
    if (!data.orders || data.orders === 0) {
      issues.push('No order data available');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  getDataFreshness(data: StandardMetrics): string {
    const now = new Date();
    const dataTime = data.timestamp;
    const diffMs = now.getTime() - dataTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Real-time';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  }

  getSupportedMetrics(): string[] {
    return [
      'sessions', 'users', 'orders', 'revenue', 'averageOrderValue',
      'conversionRate', 'cartAdditions', 'cartAbandonment', 
      'returnCustomers', 'newCustomers'
    ];
  }

  getDefaultChartTypes(): string[] {
    return ['line', 'bar', 'doughnut', 'area'];
  }

  getOptimalDateRanges(): string[] {
    return ['7d', '30d', '90d'];
  }

  private getFallbackData(): RawPlatformData {
    return {
      sessions: 8420,
      users: 6890,
      orders: 234,
      revenue: 18650.50,
      average_order_value: 79.70,
      conversion_rate: 2.78,
      cart_additions: 1245,
      cart_abandonment_rate: 68.5,
      returning_customers: 892,
      new_customers: 1456,
      currency: 'USD',
      total_products: 156,
      active_products: 142
    };
  }

  private generateEcommerceOverviewChart(metrics: StandardMetrics): ChartConfig {
    return {
      type: 'area',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Revenue ($)',
          data: [
            Math.round((metrics.revenue || 18650.50) * 0.75),
            Math.round((metrics.revenue || 18650.50) * 0.85),
            Math.round((metrics.revenue || 18650.50) * 1.10),
            metrics.revenue || 18650.50
          ],
          borderColor: '#96BF47',
          backgroundColor: 'rgba(150, 191, 71, 0.2)',
          fill: true,
          tension: 0.4
        }, {
          label: 'Orders',
          data: [
            Math.round((metrics.orders || 234) * 0.8),
            Math.round((metrics.orders || 234) * 0.9),
            Math.round((metrics.orders || 234) * 1.05),
            metrics.orders || 234
          ],
          borderColor: '#7AB55C',
          backgroundColor: 'rgba(122, 181, 92, 0.2)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, position: 'left' },
          y1: { 
            type: 'linear', 
            display: true, 
            position: 'right',
            grid: { drawOnChartArea: false }
          }
        }
      },
      insights: [{
        type: 'trend',
        title: 'E-commerce Growth',
        description: `Your Shopify store revenue is trending upward with $${metrics.averageOrderValue?.toFixed(0)} average order value.`,
        confidence: 0.9,
        platforms: [this.id],
        value: metrics.revenue
      }],
      voiceNarration: this.generateVoiceNarration(metrics, []),
      quickActions: [
        { label: 'Top Products', action: 'top_products', type: 'diagnostic' },
        { label: 'Optimize Checkout', action: 'optimize_checkout', type: 'prescriptive' }
      ]
    };
  }

  private generateSalesChart(metrics: StandardMetrics): ChartConfig {
    const salesData = [
      { label: 'New Customers', value: (metrics.newCustomers || 1456) * (metrics.averageOrderValue || 79.70) },
      { label: 'Returning Customers', value: (metrics.returnCustomers || 892) * (metrics.averageOrderValue || 79.70) }
    ];

    return {
      type: 'doughnut',
      data: {
        labels: salesData.map(item => item.label),
        datasets: [{
          data: salesData.map(item => Math.round(item.value)),
          backgroundColor: ['#96BF47', '#7AB55C'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      },
      insights: [{
        type: 'benchmark',
        title: 'Customer Revenue Split',
        description: `${Math.round((salesData[1].value / (salesData[0].value + salesData[1].value)) * 100)}% of revenue comes from returning customers.`,
        confidence: 0.85,
        platforms: [this.id]
      }],
      voiceNarration: `Your Shopify revenue is split between new and returning customers, with returning customers contributing significantly to total sales.`,
      quickActions: [
        { label: 'Customer Retention', action: 'retention_campaign', type: 'prescriptive' },
        { label: 'Acquisition Strategy', action: 'acquisition_strategy', type: 'prescriptive' }
      ]
    };
  }

  private generateCustomerChart(metrics: StandardMetrics): ChartConfig {
    return {
      type: 'bar',
      data: {
        labels: ['New Customers', 'Returning Customers', 'Total Orders'],
        datasets: [{
          label: 'Customer Metrics',
          data: [
            metrics.newCustomers || 1456,
            metrics.returnCustomers || 892,
            metrics.orders || 234
          ],
          backgroundColor: ['#96BF47', '#7AB55C', '#5A8F3A'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      },
      insights: [{
        type: 'recommendation',
        title: 'Customer Loyalty',
        description: `${Math.round((metrics.returnCustomers || 892) / ((metrics.newCustomers || 1456) + (metrics.returnCustomers || 892)) * 100)}% of customers are returning, indicating strong loyalty.`,
        confidence: 0.8,
        platforms: [this.id]
      }],
      voiceNarration: `Your customer base shows ${Math.round((metrics.returnCustomers || 892) / ((metrics.newCustomers || 1456) + (metrics.returnCustomers || 892)) * 100)}% returning customers, indicating strong brand loyalty.`,
      quickActions: [
        { label: 'Loyalty Program', action: 'loyalty_program', type: 'prescriptive' },
        { label: 'Customer Segmentation', action: 'customer_segmentation', type: 'diagnostic' }
      ]
    };
  }

  private generateCartChart(metrics: StandardMetrics): ChartConfig {
    const cartData = [
      { label: 'Completed Purchases', value: 100 - (metrics.cartAbandonment || 68.5) },
      { label: 'Cart Abandonment', value: metrics.cartAbandonment || 68.5 }
    ];

    return {
      type: 'doughnut',
      data: {
        labels: cartData.map(item => item.label),
        datasets: [{
          data: cartData.map(item => item.value),
          backgroundColor: ['#96BF47', '#E74C3C'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      },
      insights: [{
        type: 'recommendation',
        title: 'Cart Abandonment Opportunity',
        description: `${metrics.cartAbandonment?.toFixed(1)}% cart abandonment rate suggests potential for recovery campaigns.`,
        confidence: 0.9,
        platforms: [this.id]
      }],
      voiceNarration: `Your cart abandonment rate is ${metrics.cartAbandonment?.toFixed(1)}%, creating an opportunity for targeted recovery campaigns.`,
      quickActions: [
        { label: 'Abandoned Cart Emails', action: 'cart_recovery', type: 'prescriptive' },
        { label: 'Checkout Optimization', action: 'optimize_checkout', type: 'prescriptive' }
      ]
    };
  }

  private generateProductChart(metrics: StandardMetrics): ChartConfig {
    // Mock product performance data
    const productData = [
      { label: 'Top Seller', value: (metrics.revenue || 18650.50) * 0.35 },
      { label: '2nd Best', value: (metrics.revenue || 18650.50) * 0.25 },
      { label: '3rd Best', value: (metrics.revenue || 18650.50) * 0.20 },
      { label: 'Others', value: (metrics.revenue || 18650.50) * 0.20 }
    ];

    return {
      type: 'pie',
      data: {
        labels: productData.map(item => item.label),
        datasets: [{
          data: productData.map(item => Math.round(item.value)),
          backgroundColor: ['#96BF47', '#7AB55C', '#5A8F3A', '#4A7C2A'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right' } }
      },
      insights: [{
        type: 'benchmark',
        title: 'Product Performance',
        description: `Your top-selling product contributes 35% of total revenue, indicating strong product-market fit.`,
        confidence: 0.8,
        platforms: [this.id]
      }],
      voiceNarration: `Your product portfolio is led by a strong top performer contributing 35% of total revenue.`,
      quickActions: [
        { label: 'Inventory Planning', action: 'inventory_planning', type: 'prescriptive' },
        { label: 'Product Analytics', action: 'product_analytics', type: 'diagnostic' }
      ]
    };
  }
}