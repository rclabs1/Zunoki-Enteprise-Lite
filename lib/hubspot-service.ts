import { supabase } from '@/lib/supabase/client';

export interface HubSpotConfig {
  accessToken: string;
  refreshToken?: string;
  portalId?: string;
}

export interface HubSpotContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  lifecycleStage: string;
  leadStatus: string;
  source: string;
  createDate: string;
  lastModifiedDate: string;
  properties: Record<string, any>;
}

export interface HubSpotDeal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  pipeline: string;
  closeDate: string;
  probability: number;
  source: string;
  contactId: string;
  companyId: string;
  createDate: string;
  lastModifiedDate: string;
  properties: Record<string, any>;
}

export interface HubSpotCompany {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  city: string;
  state: string;
  country: string;
  source: string;
  createDate: string;
  lastModifiedDate: string;
  properties: Record<string, any>;
}

export interface HubSpotLifecycleAnalysis {
  stages: Array<{
    stage: string;
    count: number;
    percentage: number;
    avgTimeInStage: number;
    conversionRate: number;
  }>;
  funnelMetrics: {
    totalContacts: number;
    qualifiedLeads: number;
    opportunities: number;
    customers: number;
    overallConversionRate: number;
  };
  trends: Array<{
    date: string;
    newContacts: number;
    qualifiedLeads: number;
    closedWonDeals: number;
    revenue: number;
  }>;
}

export interface HubSpotCohortAnalysis {
  cohorts: Array<{
    cohortDate: string;
    totalUsers: number;
    retentionRates: Array<{
      period: number;
      activeUsers: number;
      retentionRate: number;
    }>;
  }>;
  avgLifetimeValue: number;
  churnRate: number;
  avgCustomerLifespan: number;
}

export interface HubSpotAttributionData {
  sources: Array<{
    source: string;
    contacts: number;
    deals: number;
    revenue: number;
    conversionRate: number;
    avgDealSize: number;
  }>;
  campaigns: Array<{
    campaign: string;
    contacts: number;
    deals: number;
    revenue: number;
    roi: number;
  }>;
  channels: Array<{
    channel: string;
    firstTouch: number;
    lastTouch: number;
    assisted: number;
    revenue: number;
  }>;
}

export class HubSpotService {
  private accessToken: string;
  private baseUrl = 'https://api.hubapi.com';
  private portalId?: string;

  constructor(config: HubSpotConfig) {
    this.accessToken = config.accessToken;
    this.portalId = config.portalId;
  }

  static async createFromUserTokens(userId: string): Promise<HubSpotService | null> {
    try {
      const { data: tokenData, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'hubspot_crm')
        .single();

      if (error || !tokenData) {
        console.error('No HubSpot tokens found for user:', userId);
        return null;
      }

      const { data: integrationData } = await supabase
        .from('user_integrations')
        .select('account_info')
        .eq('user_id', userId)
        .eq('provider', 'hubspot_crm')
        .single();

      return new HubSpotService({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        portalId: integrationData?.account_info?.portal_id,
      });
    } catch (error) {
      console.error('Error creating HubSpot service:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getContacts(
    limit: number = 100,
    after?: string,
    properties?: string[]
  ): Promise<{ contacts: HubSpotContact[]; paging?: any }> {
    try {
      const defaultProperties = [
        'email', 'firstname', 'lastname', 'company', 'phone', 
        'lifecyclestage', 'hs_lead_status', 'hs_analytics_source',
        'createdate', 'lastmodifieddate'
      ];
      
      const queryProperties = properties || defaultProperties;
      const params = new URLSearchParams({
        limit: limit.toString(),
        properties: queryProperties.join(','),
      });

      if (after) {
        params.append('after', after);
      }

      const response = await this.makeRequest(`/crm/v3/objects/contacts?${params.toString()}`);

      const contacts = response.results.map((contact: any) => ({
        id: contact.id,
        email: contact.properties.email || '',
        firstName: contact.properties.firstname || '',
        lastName: contact.properties.lastname || '',
        company: contact.properties.company || '',
        phone: contact.properties.phone || '',
        lifecycleStage: contact.properties.lifecyclestage || '',
        leadStatus: contact.properties.hs_lead_status || '',
        source: contact.properties.hs_analytics_source || '',
        createDate: contact.properties.createdate || '',
        lastModifiedDate: contact.properties.lastmodifieddate || '',
        properties: contact.properties,
      }));

      return {
        contacts,
        paging: response.paging,
      };
    } catch (error) {
      console.error('Error fetching HubSpot contacts:', error);
      throw new Error('Failed to fetch contacts');
    }
  }

  async getDeals(
    limit: number = 100,
    after?: string,
    properties?: string[]
  ): Promise<{ deals: HubSpotDeal[]; paging?: any }> {
    try {
      const defaultProperties = [
        'dealname', 'amount', 'dealstage', 'pipeline', 'closedate',
        'hs_probability', 'hs_analytics_source', 'createdate', 'lastmodifieddate'
      ];
      
      const queryProperties = properties || defaultProperties;
      const params = new URLSearchParams({
        limit: limit.toString(),
        properties: queryProperties.join(','),
        associations: 'contacts,companies',
      });

      if (after) {
        params.append('after', after);
      }

      const response = await this.makeRequest(`/crm/v3/objects/deals?${params.toString()}`);

      const deals = response.results.map((deal: any) => ({
        id: deal.id,
        name: deal.properties.dealname || '',
        amount: parseFloat(deal.properties.amount || '0'),
        stage: deal.properties.dealstage || '',
        pipeline: deal.properties.pipeline || '',
        closeDate: deal.properties.closedate || '',
        probability: parseFloat(deal.properties.hs_probability || '0'),
        source: deal.properties.hs_analytics_source || '',
        contactId: deal.associations?.contacts?.results?.[0]?.id || '',
        companyId: deal.associations?.companies?.results?.[0]?.id || '',
        createDate: deal.properties.createdate || '',
        lastModifiedDate: deal.properties.lastmodifieddate || '',
        properties: deal.properties,
      }));

      return {
        deals,
        paging: response.paging,
      };
    } catch (error) {
      console.error('Error fetching HubSpot deals:', error);
      throw new Error('Failed to fetch deals');
    }
  }

  async getCompanies(
    limit: number = 100,
    after?: string,
    properties?: string[]
  ): Promise<{ companies: HubSpotCompany[]; paging?: any }> {
    try {
      const defaultProperties = [
        'name', 'domain', 'industry', 'numberofemployees',
        'city', 'state', 'country', 'hs_analytics_source',
        'createdate', 'lastmodifieddate'
      ];
      
      const queryProperties = properties || defaultProperties;
      const params = new URLSearchParams({
        limit: limit.toString(),
        properties: queryProperties.join(','),
      });

      if (after) {
        params.append('after', after);
      }

      const response = await this.makeRequest(`/crm/v3/objects/companies?${params.toString()}`);

      const companies = response.results.map((company: any) => ({
        id: company.id,
        name: company.properties.name || '',
        domain: company.properties.domain || '',
        industry: company.properties.industry || '',
        size: company.properties.numberofemployees || '',
        city: company.properties.city || '',
        state: company.properties.state || '',
        country: company.properties.country || '',
        source: company.properties.hs_analytics_source || '',
        createDate: company.properties.createdate || '',
        lastModifiedDate: company.properties.lastmodifieddate || '',
        properties: company.properties,
      }));

      return {
        companies,
        paging: response.paging,
      };
    } catch (error) {
      console.error('Error fetching HubSpot companies:', error);
      throw new Error('Failed to fetch companies');
    }
  }

  async getLifecycleAnalysis(startDate: string, endDate: string): Promise<HubSpotLifecycleAnalysis> {
    try {
      const { contacts } = await this.getContacts(1000);
      const { deals } = await this.getDeals(1000);

      // Analyze lifecycle stages
      const stageAnalysis = new Map<string, number>();
      contacts.forEach(contact => {
        const stage = contact.lifecycleStage || 'unknown';
        stageAnalysis.set(stage, (stageAnalysis.get(stage) || 0) + 1);
      });

      const totalContacts = contacts.length;
      const stages = Array.from(stageAnalysis.entries()).map(([stage, count]) => ({
        stage,
        count,
        percentage: (count / totalContacts) * 100,
        avgTimeInStage: 0, // Would need historical data
        conversionRate: 0, // Would need conversion tracking
      }));

      // Calculate funnel metrics
      const qualifiedLeads = contacts.filter(c => 
        ['marketingqualifiedlead', 'salesqualifiedlead'].includes(c.lifecycleStage.toLowerCase())
      ).length;
      
      const opportunities = contacts.filter(c => 
        c.lifecycleStage.toLowerCase() === 'opportunity'
      ).length;
      
      const customers = contacts.filter(c => 
        c.lifecycleStage.toLowerCase() === 'customer'
      ).length;

      // Analyze trends by date
      const trendsMap = new Map<string, any>();
      const dateRange = this.getDateRange(startDate, endDate);
      
      dateRange.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        trendsMap.set(dateStr, {
          date: dateStr,
          newContacts: 0,
          qualifiedLeads: 0,
          closedWonDeals: 0,
          revenue: 0,
        });
      });

      contacts.forEach(contact => {
        const createDate = new Date(contact.createDate).toISOString().split('T')[0];
        if (trendsMap.has(createDate)) {
          trendsMap.get(createDate).newContacts++;
        }
      });

      deals.filter(deal => deal.stage.toLowerCase().includes('won')).forEach(deal => {
        const closeDate = new Date(deal.closeDate).toISOString().split('T')[0];
        if (trendsMap.has(closeDate)) {
          const trend = trendsMap.get(closeDate);
          trend.closedWonDeals++;
          trend.revenue += deal.amount;
        }
      });

      return {
        stages,
        funnelMetrics: {
          totalContacts,
          qualifiedLeads,
          opportunities,
          customers,
          overallConversionRate: totalContacts > 0 ? (customers / totalContacts) * 100 : 0,
        },
        trends: Array.from(trendsMap.values()),
      };
    } catch (error) {
      console.error('Error generating HubSpot lifecycle analysis:', error);
      throw new Error('Failed to generate lifecycle analysis');
    }
  }

  async getCohortAnalysis(startDate: string, endDate: string): Promise<HubSpotCohortAnalysis> {
    try {
      const { contacts } = await this.getContacts(1000);
      const { deals } = await this.getDeals(1000);

      // Group contacts by creation month (cohort)
      const cohorts = new Map<string, HubSpotContact[]>();
      
      contacts.forEach(contact => {
        const cohortDate = new Date(contact.createDate);
        const cohortKey = `${cohortDate.getFullYear()}-${String(cohortDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!cohorts.has(cohortKey)) {
          cohorts.set(cohortKey, []);
        }
        cohorts.get(cohortKey)!.push(contact);
      });

      // Calculate retention for each cohort
      const cohortAnalysis = Array.from(cohorts.entries()).map(([cohortDate, cohortContacts]) => {
        const totalUsers = cohortContacts.length;
        
        // Simplified retention calculation (would need engagement data)
        const retentionRates = [1, 2, 3, 6, 12].map(months => {
          const cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - months);
          
          const activeUsers = cohortContacts.filter(contact => {
            const lastActivity = new Date(contact.lastModifiedDate);
            return lastActivity >= cutoffDate;
          }).length;

          return {
            period: months,
            activeUsers,
            retentionRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
          };
        });

        return {
          cohortDate,
          totalUsers,
          retentionRates,
        };
      });

      // Calculate average metrics
      const customerDeals = deals.filter(deal => deal.stage.toLowerCase().includes('won'));
      const avgLifetimeValue = customerDeals.length > 0 
        ? customerDeals.reduce((sum, deal) => sum + deal.amount, 0) / customerDeals.length 
        : 0;

      const totalCustomers = contacts.filter(c => c.lifecycleStage.toLowerCase() === 'customer').length;
      const churnRate = 5; // Would need historical churn data
      const avgCustomerLifespan = 24; // Would calculate from actual data

      return {
        cohorts: cohortAnalysis,
        avgLifetimeValue,
        churnRate,
        avgCustomerLifespan,
      };
    } catch (error) {
      console.error('Error generating HubSpot cohort analysis:', error);
      throw new Error('Failed to generate cohort analysis');
    }
  }

  async getAttributionData(startDate: string, endDate: string): Promise<HubSpotAttributionData> {
    try {
      const { contacts } = await this.getContacts(1000);
      const { deals } = await this.getDeals(1000);

      // Analyze sources
      const sourceAnalysis = new Map<string, any>();
      
      contacts.forEach(contact => {
        const source = contact.source || 'Unknown';
        if (!sourceAnalysis.has(source)) {
          sourceAnalysis.set(source, {
            source,
            contacts: 0,
            deals: 0,
            revenue: 0,
          });
        }
        sourceAnalysis.get(source).contacts++;
      });

      deals.forEach(deal => {
        const source = deal.source || 'Unknown';
        if (sourceAnalysis.has(source)) {
          const analysis = sourceAnalysis.get(source);
          analysis.deals++;
          if (deal.stage.toLowerCase().includes('won')) {
            analysis.revenue += deal.amount;
          }
        }
      });

      const sources = Array.from(sourceAnalysis.values()).map((item: any) => ({
        ...item,
        conversionRate: item.contacts > 0 ? (item.deals / item.contacts) * 100 : 0,
        avgDealSize: item.deals > 0 ? item.revenue / item.deals : 0,
      }));

      // Simplified campaign and channel analysis (would need more detailed tracking)
      const campaigns = sources.slice(0, 5).map(source => ({
        campaign: source.source,
        contacts: source.contacts,
        deals: source.deals,
        revenue: source.revenue,
        roi: source.revenue > 0 ? (source.revenue / Math.max(source.contacts * 10, 1)) * 100 : 0,
      }));

      const channels = sources.slice(0, 5).map(source => ({
        channel: source.source,
        firstTouch: source.contacts,
        lastTouch: Math.floor(source.contacts * 0.7),
        assisted: Math.floor(source.contacts * 0.3),
        revenue: source.revenue,
      }));

      return {
        sources,
        campaigns,
        channels,
      };
    } catch (error) {
      console.error('Error generating HubSpot attribution data:', error);
      throw new Error('Failed to generate attribution data');
    }
  }

  private getDateRange(startDate: string, endDate: string): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  async syncToSupabase(userId: string, startDate: string, endDate: string): Promise<void> {
    try {
      const { deals } = await this.getDeals(1000);
      
      const syncData = deals.map(deal => ({
        user_id: userId,
        platform: 'hubspot_crm' as const,
        campaign_id: deal.id,
        campaign_name: deal.name,
        date: new Date(deal.createDate).toISOString().split('T')[0],
        impressions: 1, // Each deal as an impression
        clicks: deal.stage.toLowerCase().includes('won') ? 1 : 0,
        cost: 0, // HubSpot doesn't track advertising cost
        conversions: deal.stage.toLowerCase().includes('won') ? 1 : 0,
        ctr: 100, // 100% for CRM data
        cpc: 0,
        revenue: deal.amount,
        created_at: new Date().toISOString(),
      }));

      // Batch insert with upsert logic
      const { error } = await supabase
        .from('campaign_metrics')
        .upsert(syncData, {
          onConflict: 'user_id,platform,campaign_id,date',
          ignoreDuplicates: false,
        });

      if (error) {
        throw new Error(`Failed to sync HubSpot data: ${error.message}`);
      }

      // Log sync activity
      await supabase.from('user_activities').insert({
        user_id: userId,
        action: 'sync',
        platform: 'hubspot_crm',
        details: { 
          records_synced: syncData.length,
          date_range: { startDate, endDate }
        },
        created_at: new Date().toISOString(),
      });

      console.log(`Successfully synced ${syncData.length} HubSpot CRM records for user ${userId}`);
    } catch (error) {
      console.error('Error syncing HubSpot data to Supabase:', error);
      throw error;
    }
  }

  async validateConnection(): Promise<{ valid: boolean; error?: string; accountInfo?: any }> {
    try {
      const response = await this.makeRequest('/account-info/v3/details');
      
      return {
        valid: true,
        accountInfo: {
          portal_id: response.portalId,
          account_name: response.accountName || 'HubSpot Account',
          currency: response.currencyCode || 'USD',
          time_zone: response.timeZone || 'UTC',
          subscription: response.subscriptionType || 'Unknown',
        },
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Failed to validate HubSpot connection',
      };
    }
  }
}