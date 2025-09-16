import { supabase } from '@/lib/supabase/client';

export interface LinkedInAdsConfig {
  accessToken: string;
  refreshToken?: string;
  adAccountId?: string;
}

export interface LinkedInCampaign {
  id: string;
  name: string;
  status: string;
  type: string;
  costType: string;
  dailyBudget: number;
  totalBudget: number;
  startAt: string;
  endAt: string;
  targetingCriteria: any;
  createdAt: string;
  lastModifiedAt: string;
}

export interface LinkedInCampaignMetrics {
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  leads: number;
  videoViews: number;
  videoCompletions: number;
  ctr: number;
  cpc: number;
  cpl: number; // Cost per lead
  conversionRate: number;
  date: string;
}

export interface LinkedInAudienceInsight {
  dimension: string;
  value: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  targetingReach: number;
}

export interface LinkedInICPAnalysis {
  jobFunction: Array<{ function: string; performance: number; reach: number; efficiency: number }>;
  seniority: Array<{ level: string; performance: number; reach: number; efficiency: number }>;
  company: Array<{ size: string; performance: number; reach: number; efficiency: number }>;
  industry: Array<{ industry: string; performance: number; reach: number; efficiency: number }>;
  geography: Array<{ location: string; performance: number; reach: number; efficiency: number }>;
}

export class LinkedInAdsService {
  private accessToken: string;
  private baseUrl = 'https://api.linkedin.com/rest';
  private adAccountId?: string;

  constructor(config: LinkedInAdsConfig) {
    this.accessToken = config.accessToken;
    this.adAccountId = config.adAccountId;
  }

  static async createFromUserTokens(userId: string): Promise<LinkedInAdsService | null> {
    try {
      const { data: tokenData, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'linkedin_ads')
        .single();

      if (error || !tokenData) {
        console.error('No LinkedIn Ads tokens found for user:', userId);
        return null;
      }

      const { data: integrationData } = await supabase
        .from('user_integrations')
        .select('account_info')
        .eq('user_id', userId)
        .eq('provider', 'linkedin_ads')
        .single();

      return new LinkedInAdsService({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        adAccountId: integrationData?.account_info?.ad_account_id,
      });
    } catch (error) {
      console.error('Error creating LinkedIn Ads service:', error);
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
        'LinkedIn-Version': '202304',
        'X-Restli-Protocol-Version': '2.0.0',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LinkedIn API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getAdAccounts(): Promise<Array<{ id: string; name: string; currency: string; status: string }>> {
    try {
      const response = await this.makeRequest('/adAccounts?q=search&search.type.values[0]=BUSINESS');
      
      return response.elements.map((account: any) => ({
        id: account.id,
        name: account.name,
        currency: account.currency,
        status: account.status,
      }));
    } catch (error) {
      console.error('Error fetching LinkedIn ad accounts:', error);
      throw new Error('Failed to fetch ad accounts');
    }
  }

  async getCampaigns(adAccountId?: string): Promise<LinkedInCampaign[]> {
    const accountId = adAccountId || this.adAccountId;
    if (!accountId) {
      throw new Error('Ad account ID is required');
    }

    try {
      const response = await this.makeRequest(
        `/adCampaigns?q=search&search.account.values[0]=urn:li:sponsoredAccount:${accountId}`
      );

      return response.elements.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        type: campaign.type,
        costType: campaign.costType,
        dailyBudget: campaign.dailyBudget?.amount || 0,
        totalBudget: campaign.totalBudget?.amount || 0,
        startAt: campaign.runSchedule?.start,
        endAt: campaign.runSchedule?.end,
        targetingCriteria: campaign.targetingCriteria,
        createdAt: campaign.created,
        lastModifiedAt: campaign.lastModified,
      }));
    } catch (error) {
      console.error('Error fetching LinkedIn campaigns:', error);
      throw new Error('Failed to fetch campaigns');
    }
  }

  async getCampaignMetrics(
    campaignIds: string[],
    startDate: string,
    endDate: string
  ): Promise<LinkedInCampaignMetrics[]> {
    try {
      const campaignUrns = campaignIds.map(id => `urn:li:sponsoredCampaign:${id}`);
      const params = new URLSearchParams({
        q: 'analytics',
        'pivot': 'CAMPAIGN',
        'dateRange.start.day': new Date(startDate).getDate().toString(),
        'dateRange.start.month': (new Date(startDate).getMonth() + 1).toString(),
        'dateRange.start.year': new Date(startDate).getFullYear().toString(),
        'dateRange.end.day': new Date(endDate).getDate().toString(),
        'dateRange.end.month': (new Date(endDate).getMonth() + 1).toString(),
        'dateRange.end.year': new Date(endDate).getFullYear().toString(),
        'timeGranularity': 'DAILY',
        'fields': 'impressions,clicks,costInUsd,externalWebsiteConversions,leads,videoViews,videoCompletions',
      });

      campaignUrns.forEach((urn, index) => {
        params.append(`campaigns[${index}]`, urn);
      });

      const response = await this.makeRequest(`/adAnalytics?${params.toString()}`);

      const campaigns = await this.getCampaigns();
      const campaignMap = new Map(campaigns.map(c => [c.id, c.name]));

      return response.elements.map((metric: any) => {
        const campaignId = metric.campaign.split(':').pop();
        const campaignName = campaignMap.get(campaignId) || `Campaign ${campaignId}`;
        
        const impressions = metric.impressions || 0;
        const clicks = metric.clicks || 0;
        const cost = metric.costInUsd || 0;
        const conversions = metric.externalWebsiteConversions || 0;
        const leads = metric.leads || 0;

        return {
          campaignId,
          campaignName,
          impressions,
          clicks,
          cost,
          conversions,
          leads,
          videoViews: metric.videoViews || 0,
          videoCompletions: metric.videoCompletions || 0,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          cpc: clicks > 0 ? cost / clicks : 0,
          cpl: leads > 0 ? cost / leads : 0,
          conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
          date: `${metric.dateRange.start.year}-${metric.dateRange.start.month.toString().padStart(2, '0')}-${metric.dateRange.start.day.toString().padStart(2, '0')}`,
        };
      });
    } catch (error) {
      console.error('Error fetching LinkedIn campaign metrics:', error);
      throw new Error('Failed to fetch campaign metrics');
    }
  }

  async getAudienceInsights(
    campaignIds: string[],
    startDate: string,
    endDate: string,
    dimension: 'JOB_FUNCTION' | 'SENIORITY' | 'COMPANY_SIZE' | 'INDUSTRY' | 'GEOGRAPHY' = 'JOB_FUNCTION'
  ): Promise<LinkedInAudienceInsight[]> {
    try {
      const campaignUrns = campaignIds.map(id => `urn:li:sponsoredCampaign:${id}`);
      const params = new URLSearchParams({
        q: 'analytics',
        'pivot': dimension,
        'dateRange.start.day': new Date(startDate).getDate().toString(),
        'dateRange.start.month': (new Date(startDate).getMonth() + 1).toString(),
        'dateRange.start.year': new Date(startDate).getFullYear().toString(),
        'dateRange.end.day': new Date(endDate).getDate().toString(),
        'dateRange.end.month': (new Date(endDate).getMonth() + 1).toString(),
        'dateRange.end.year': new Date(endDate).getFullYear().toString(),
        'fields': 'impressions,clicks,costInUsd,externalWebsiteConversions',
      });

      campaignUrns.forEach((urn, index) => {
        params.append(`campaigns[${index}]`, urn);
      });

      const response = await this.makeRequest(`/adAnalytics?${params.toString()}`);

      return response.elements.map((insight: any) => {
        const impressions = insight.impressions || 0;
        const clicks = insight.clicks || 0;
        const cost = insight.costInUsd || 0;
        const conversions = insight.externalWebsiteConversions || 0;

        return {
          dimension: dimension.toLowerCase(),
          value: insight[dimension.toLowerCase()]?.name || 'Unknown',
          impressions,
          clicks,
          cost,
          conversions,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          targetingReach: insight.targetingReach || 0,
        };
      });
    } catch (error) {
      console.error('Error fetching LinkedIn audience insights:', error);
      throw new Error('Failed to fetch audience insights');
    }
  }

  async getICPAnalysis(
    campaignIds: string[],
    startDate: string,
    endDate: string
  ): Promise<LinkedInICPAnalysis> {
    try {
      const [jobFunction, seniority, companySize, industry, geography] = await Promise.all([
        this.getAudienceInsights(campaignIds, startDate, endDate, 'JOB_FUNCTION'),
        this.getAudienceInsights(campaignIds, startDate, endDate, 'SENIORITY'),
        this.getAudienceInsights(campaignIds, startDate, endDate, 'COMPANY_SIZE'),
        this.getAudienceInsights(campaignIds, startDate, endDate, 'INDUSTRY'),
        this.getAudienceInsights(campaignIds, startDate, endDate, 'GEOGRAPHY'),
      ]);

      const calculateEfficiency = (insight: LinkedInAudienceInsight) => {
        if (insight.cost === 0) return 0;
        return (insight.conversions / insight.cost) * 100;
      };

      return {
        jobFunction: jobFunction.map(insight => ({
          function: insight.value,
          performance: insight.ctr,
          reach: insight.impressions,
          efficiency: calculateEfficiency(insight),
        })),
        seniority: seniority.map(insight => ({
          level: insight.value,
          performance: insight.ctr,
          reach: insight.impressions,
          efficiency: calculateEfficiency(insight),
        })),
        company: companySize.map(insight => ({
          size: insight.value,
          performance: insight.ctr,
          reach: insight.impressions,
          efficiency: calculateEfficiency(insight),
        })),
        industry: industry.map(insight => ({
          industry: insight.value,
          performance: insight.ctr,
          reach: insight.impressions,
          efficiency: calculateEfficiency(insight),
        })),
        geography: geography.map(insight => ({
          location: insight.value,
          performance: insight.ctr,
          reach: insight.impressions,
          efficiency: calculateEfficiency(insight),
        })),
      };
    } catch (error) {
      console.error('Error generating LinkedIn ICP analysis:', error);
      throw new Error('Failed to generate ICP analysis');
    }
  }

  async pauseCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest(`/adCampaigns/${campaignId}`, {
        method: 'POST',
        body: JSON.stringify({
          patch: {
            $set: {
              status: 'PAUSED'
            }
          }
        }),
      });

      return {
        success: true,
        message: `Campaign ${campaignId} paused successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to pause campaign: ${error.message}`,
      };
    }
  }

  async enableCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest(`/adCampaigns/${campaignId}`, {
        method: 'POST',
        body: JSON.stringify({
          patch: {
            $set: {
              status: 'ACTIVE'
            }
          }
        }),
      });

      return {
        success: true,
        message: `Campaign ${campaignId} enabled successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to enable campaign: ${error.message}`,
      };
    }
  }

  async updateCampaignBudget(
    campaignId: string,
    dailyBudget?: number,
    totalBudget?: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const updateData: any = {};
      
      if (dailyBudget !== undefined) {
        updateData.dailyBudget = {
          currencyCode: 'USD',
          amount: dailyBudget.toString()
        };
      }
      
      if (totalBudget !== undefined) {
        updateData.totalBudget = {
          currencyCode: 'USD',
          amount: totalBudget.toString()
        };
      }

      const response = await this.makeRequest(`/adCampaigns/${campaignId}`, {
        method: 'POST',
        body: JSON.stringify({
          patch: {
            $set: updateData
          }
        }),
      });

      return {
        success: true,
        message: `Campaign ${campaignId} budget updated successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to update campaign budget: ${error.message}`,
      };
    }
  }

  async syncToSupabase(userId: string, startDate: string, endDate: string): Promise<void> {
    try {
      const campaigns = await this.getCampaigns();
      const campaignIds = campaigns.map(c => c.id);
      
      if (campaignIds.length === 0) {
        console.log('No campaigns found for LinkedIn Ads sync');
        return;
      }

      const metrics = await this.getCampaignMetrics(campaignIds, startDate, endDate);
      
      const syncData = metrics.map(metric => ({
        user_id: userId,
        platform: 'linkedin_ads' as const,
        campaign_id: metric.campaignId,
        campaign_name: metric.campaignName,
        date: metric.date,
        impressions: metric.impressions,
        clicks: metric.clicks,
        cost: metric.cost,
        conversions: metric.conversions,
        ctr: metric.ctr,
        cpc: metric.cpc,
        revenue: metric.conversions * 100, // Estimated revenue
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
        throw new Error(`Failed to sync LinkedIn Ads data: ${error.message}`);
      }

      // Log sync activity
      await supabase.from('user_activities').insert({
        user_id: userId,
        action: 'sync',
        platform: 'linkedin_ads',
        details: { 
          records_synced: syncData.length,
          date_range: { startDate, endDate }
        },
        created_at: new Date().toISOString(),
      });

      console.log(`Successfully synced ${syncData.length} LinkedIn Ads records for user ${userId}`);
    } catch (error) {
      console.error('Error syncing LinkedIn Ads data to Supabase:', error);
      throw error;
    }
  }

  async validateConnection(): Promise<{ valid: boolean; error?: string; accountInfo?: any }> {
    try {
      const accounts = await this.getAdAccounts();
      
      if (accounts.length === 0) {
        return {
          valid: false,
          error: 'No ad accounts found for this LinkedIn account',
        };
      }

      return {
        valid: true,
        accountInfo: {
          ad_account_id: accounts[0].id,
          account_name: accounts[0].name,
          currency: accounts[0].currency,
          status: accounts[0].status,
          total_accounts: accounts.length,
        },
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Failed to validate LinkedIn Ads connection',
      };
    }
  }
}