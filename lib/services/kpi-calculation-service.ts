import { supabase } from '@/lib/supabase/client';
import { supabaseMultiUserService } from '@/lib/supabase/multi-user-service';

export interface CalculatedKPI {
  kpi_id: string;
  name: string;
  display_name: string;
  value: number;
  formatted_value: string;
  change_percentage?: number;
  trend: 'up' | 'down' | 'stable';
  last_updated: string;
  platform_breakdown?: { [platform: string]: number };
}

export class KPICalculationService {
  
  static async calculateKPIValue(kpiName: string, userId: string): Promise<CalculatedKPI | null> {
    try {
      const calculations: { [key: string]: () => Promise<CalculatedKPI | null> } = {
        'roas': () => this.calculateROAS(userId),
        'cpc': () => this.calculateCPC(userId),
        'ctr': () => this.calculateCTR(userId),
        'conversion_rate': () => this.calculateConversionRate(userId),
        'cpl': () => this.calculateCPL(userId),
        'total_revenue': () => this.calculateTotalRevenue(userId),
        'total_spend': () => this.calculateTotalSpend(userId),
        'total_impressions': () => this.calculateTotalImpressions(userId),
        'total_clicks': () => this.calculateTotalClicks(userId),
        'avg_response_time': () => this.calculateAvgResponseTime(userId),
        'message_volume': () => this.calculateMessageVolume(userId),
        'response_rate': () => this.calculateResponseRate(userId),
        'satisfaction_score': () => this.calculateSatisfactionScore(userId),
        'active_conversations': () => this.calculateActiveConversations(userId),
        'customer_ltv': () => this.calculateCustomerLTV(userId),
        'new_contacts': () => this.calculateNewContacts(userId)
      };

      const calculator = calculations[kpiName];
      if (!calculator) {
        console.warn(`No calculator found for KPI: ${kpiName}`);
        return null;
      }

      return await calculator();
    } catch (error) {
      console.error(`Error calculating KPI ${kpiName}:`, error);
      return null;
    }
  }

  // 📈 Performance KPIs
  private static async calculateROAS(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('revenue, spend')
      .eq('user_id', userId);

    if (error || !data) return null;

    const totalRevenue = data.reduce((sum, row) => sum + (row.revenue || 0), 0);
    const totalSpend = data.reduce((sum, row) => sum + (row.spend || 0), 0);
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return {
      kpi_id: 'roas',
      name: 'roas',
      display_name: 'ROAS',
      value: roas,
      formatted_value: `${roas.toFixed(1)}x`,
      trend: roas > 3 ? 'up' : roas > 2 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  private static async calculateCPC(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('spend, clicks')
      .eq('user_id', userId);

    if (error || !data) return null;

    const totalSpend = data.reduce((sum, row) => sum + (row.spend || 0), 0);
    const totalClicks = data.reduce((sum, row) => sum + (row.clicks || 0), 0);
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

    return {
      kpi_id: 'cpc',
      name: 'cpc',
      display_name: 'CPC',
      value: cpc,
      formatted_value: `$${cpc.toFixed(2)}`,
      trend: cpc < 1.5 ? 'up' : cpc < 2.5 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  private static async calculateCTR(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('clicks, impressions')
      .eq('user_id', userId);

    if (error || !data) return null;

    const totalClicks = data.reduce((sum, row) => sum + (row.clicks || 0), 0);
    const totalImpressions = data.reduce((sum, row) => sum + (row.impressions || 0), 0);
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      kpi_id: 'ctr',
      name: 'ctr',
      display_name: 'CTR',
      value: ctr,
      formatted_value: `${ctr.toFixed(1)}%`,
      trend: ctr > 3 ? 'up' : ctr > 2 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  private static async calculateConversionRate(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('conversions, clicks')
      .eq('user_id', userId);

    if (error || !data) return null;

    const totalConversions = data.reduce((sum, row) => sum + (row.conversions || 0), 0);
    const totalClicks = data.reduce((sum, row) => sum + (row.clicks || 0), 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      kpi_id: 'conversion_rate',
      name: 'conversion_rate',
      display_name: 'Conversion Rate',
      value: conversionRate,
      formatted_value: `${conversionRate.toFixed(1)}%`,
      trend: conversionRate > 3 ? 'up' : conversionRate > 2 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  // 💰 Financial KPIs
  private static async calculateTotalRevenue(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('revenue')
      .eq('user_id', userId);

    if (error || !data) return null;

    const totalRevenue = data.reduce((sum, row) => sum + (row.revenue || 0), 0);

    return {
      kpi_id: 'total_revenue',
      name: 'total_revenue',
      display_name: 'Total Revenue',
      value: totalRevenue,
      formatted_value: `$${totalRevenue.toLocaleString()}`,
      trend: totalRevenue > 10000 ? 'up' : totalRevenue > 5000 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  private static async calculateTotalSpend(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('spend')
      .eq('user_id', userId);

    if (error || !data) return null;

    const totalSpend = data.reduce((sum, row) => sum + (row.spend || 0), 0);

    return {
      kpi_id: 'total_spend',
      name: 'total_spend',
      display_name: 'Total Ad Spend',
      value: totalSpend,
      formatted_value: `$${totalSpend.toLocaleString()}`,
      trend: 'stable', // Spend trends depend on strategy
      last_updated: new Date().toISOString()
    };
  }

  // 💬 Messaging KPIs
  private static async calculateMessageVolume(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('unified_messages')
      .select('platform')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error || !data) return null;

    const totalMessages = data.length;
    
    // Calculate platform breakdown
    const platformBreakdown: { [platform: string]: number } = {};
    data.forEach(msg => {
      platformBreakdown[msg.platform] = (platformBreakdown[msg.platform] || 0) + 1;
    });

    return {
      kpi_id: 'message_volume',
      name: 'message_volume',
      display_name: 'Message Volume',
      value: totalMessages,
      formatted_value: totalMessages.toLocaleString(),
      trend: totalMessages > 1000 ? 'up' : totalMessages > 500 ? 'stable' : 'down',
      platform_breakdown: platformBreakdown,
      last_updated: new Date().toISOString()
    };
  }

  private static async calculateAvgResponseTime(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('unified_messages')
      .select('timestamp, created_at, direction')
      .eq('user_id', userId)
      .eq('direction', 'outbound')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error || !data) return null;

    // Calculate average response time (simplified)
    const responseTimes = data.map(msg => {
      const responseTime = new Date(msg.timestamp).getTime() - new Date(msg.created_at).getTime();
      return Math.max(0, responseTime / (1000 * 60)); // Convert to minutes
    });

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    return {
      kpi_id: 'avg_response_time',
      name: 'avg_response_time',
      display_name: 'Avg Response Time',
      value: avgResponseTime,
      formatted_value: `${avgResponseTime.toFixed(1)} min`,
      trend: avgResponseTime < 10 ? 'up' : avgResponseTime < 20 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  private static async calculateResponseRate(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('unified_messages')
      .select('direction')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error || !data) return null;

    const inboundMessages = data.filter(msg => msg.direction === 'inbound').length;
    const outboundMessages = data.filter(msg => msg.direction === 'outbound').length;
    const responseRate = inboundMessages > 0 ? (outboundMessages / inboundMessages) * 100 : 0;

    return {
      kpi_id: 'response_rate',
      name: 'response_rate',
      display_name: 'Response Rate',
      value: responseRate,
      formatted_value: `${Math.min(100, responseRate).toFixed(1)}%`,
      trend: responseRate > 90 ? 'up' : responseRate > 75 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  private static async calculateActiveConversations(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('crm_conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error || !data) return null;

    const activeConversations = data.length;

    return {
      kpi_id: 'active_conversations',
      name: 'active_conversations',
      display_name: 'Active Conversations',
      value: activeConversations,
      formatted_value: activeConversations.toString(),
      trend: activeConversations > 50 ? 'up' : activeConversations > 20 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  private static async calculateCustomerLTV(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('total_spent')
      .eq('user_id', userId)
      .gt('total_spent', 0);

    if (error || !data) return null;

    const avgLTV = data.length > 0 
      ? data.reduce((sum, contact) => sum + contact.total_spent, 0) / data.length 
      : 0;

    return {
      kpi_id: 'customer_ltv',
      name: 'customer_ltv',
      display_name: 'Customer LTV',
      value: avgLTV,
      formatted_value: `$${avgLTV.toFixed(2)}`,
      trend: avgLTV > 150 ? 'up' : avgLTV > 100 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  private static async calculateNewContacts(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error || !data) return null;

    const newContacts = data.length;

    return {
      kpi_id: 'new_contacts',
      name: 'new_contacts',
      display_name: 'New Contacts',
      value: newContacts,
      formatted_value: newContacts.toString(),
      trend: newContacts > 50 ? 'up' : newContacts > 20 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  private static async calculateSatisfactionScore(userId: string): Promise<CalculatedKPI | null> {
    // This would come from customer feedback or ratings
    // For now, return a sample calculation
    return {
      kpi_id: 'satisfaction_score',
      name: 'satisfaction_score',
      display_name: 'Customer Satisfaction',
      value: 4.3,
      formatted_value: '4.3/5',
      trend: 'up',
      last_updated: new Date().toISOString()
    };
  }

  // Calculate totals for overview
  private static async calculateTotalImpressions(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('impressions')
      .eq('user_id', userId);

    if (error || !data) return null;

    const totalImpressions = data.reduce((sum, row) => sum + (row.impressions || 0), 0);

    return {
      kpi_id: 'total_impressions',
      name: 'total_impressions',
      display_name: 'Total Impressions',
      value: totalImpressions,
      formatted_value: totalImpressions.toLocaleString(),
      trend: totalImpressions > 1000000 ? 'up' : totalImpressions > 500000 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  private static async calculateTotalClicks(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('clicks')
      .eq('user_id', userId);

    if (error || !data) return null;

    const totalClicks = data.reduce((sum, row) => sum + (row.clicks || 0), 0);

    return {
      kpi_id: 'total_clicks',
      name: 'total_clicks',
      display_name: 'Total Clicks',
      value: totalClicks,
      formatted_value: totalClicks.toLocaleString(),
      trend: totalClicks > 10000 ? 'up' : totalClicks > 5000 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  private static async calculateCPL(userId: string): Promise<CalculatedKPI | null> {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('spend, conversions')
      .eq('user_id', userId);

    if (error || !data) return null;

    const totalSpend = data.reduce((sum, row) => sum + (row.spend || 0), 0);
    const totalConversions = data.reduce((sum, row) => sum + (row.conversions || 0), 0);
    const cpl = totalConversions > 0 ? totalSpend / totalConversions : 0;

    return {
      kpi_id: 'cpl',
      name: 'cpl',
      display_name: 'Cost Per Lead',
      value: cpl,
      formatted_value: `$${cpl.toFixed(2)}`,
      trend: cpl < 25 ? 'up' : cpl < 50 ? 'stable' : 'down',
      last_updated: new Date().toISOString()
    };
  }

  // Batch calculate multiple KPIs for dashboard
  static async calculateUserDashboardKPIs(userId: string, kpiNames: string[]): Promise<CalculatedKPI[]> {
    const results = await Promise.allSettled(
      kpiNames.map(name => this.calculateKPIValue(name, userId))
    );

    return results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<CalculatedKPI>).value);
  }
}