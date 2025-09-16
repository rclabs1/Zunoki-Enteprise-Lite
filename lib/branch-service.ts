import { supabase } from '@/lib/supabase/client';

export interface BranchConfig {
  accessToken: string;
  refreshToken?: string;
  appId: string;
}

export interface BranchLink {
  id: string;
  url: string;
  alias: string;
  campaign: string;
  channel: string;
  feature: string;
  stage: string;
  tags: string[];
  data: Record<string, any>;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface BranchAttributionEvent {
  id: string;
  name: string;
  timestamp: string;
  userAgent: string;
  platform: string;
  channel: string;
  campaign: string;
  feature: string;
  stage: string;
  tags: string[];
  customData: Record<string, any>;
  linkId?: string;
  linkUrl?: string;
  revenue?: number;
}

export interface BranchCampaignPerformance {
  campaign: string;
  channel: string;
  feature: string;
  clicks: number;
  installs: number;
  opens: number;
  webSessionStarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
  installRate: number;
  openRate: number;
  revenuePerUser: number;
  period: string;
}

export interface BranchAttributionAnalysis {
  crossPlatform: Array<{
    platform: string;
    clicks: number;
    installs: number;
    opens: number;
    purchases: number;
    revenue: number;
    conversionRate: number;
  }>;
  channels: Array<{
    channel: string;
    firstTouch: number;
    lastTouch: number;
    assisted: number;
    revenue: number;
    attribution: 'first_touch' | 'last_touch' | 'multi_touch';
  }>;
  campaigns: Array<{
    campaign: string;
    touches: number;
    conversions: number;
    revenue: number;
    roi: number;
    attributionWindow: string;
  }>;
  journeys: Array<{
    touchpoints: Array<{
      channel: string;
      timestamp: string;
      touchType: 'click' | 'install' | 'open' | 'purchase';
    }>;
    conversionValue: number;
    journeyDuration: number;
  }>;
}

export interface BranchDeepLinkAnalytics {
  links: Array<{
    id: string;
    alias: string;
    url: string;
    campaign: string;
    clicks: number;
    uniqueClicks: number;
    installs: number;
    opens: number;
    conversionRate: number;
    topCountries: Array<{ country: string; clicks: number }>;
    topPlatforms: Array<{ platform: string; clicks: number }>;
  }>;
  performance: {
    totalClicks: number;
    totalInstalls: number;
    totalOpens: number;
    overallConversionRate: number;
    avgClicksPerLink: number;
  };
}

export class BranchService {
  private accessToken: string;
  private appId: string;
  private baseUrl = 'https://api2.branch.io';

  constructor(config: BranchConfig) {
    this.accessToken = config.accessToken;
    this.appId = config.appId;
  }

  static async createFromUserTokens(userId: string): Promise<BranchService | null> {
    try {
      const { data: tokenData, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'branch')
        .single();

      if (error || !tokenData) {
        console.error('No Branch tokens found for user:', userId);
        return null;
      }

      const { data: integrationData } = await supabase
        .from('user_integrations')
        .select('account_info')
        .eq('user_id', userId)
        .eq('provider', 'branch')
        .single();

      return new BranchService({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        appId: integrationData?.account_info?.app_id || process.env.BRANCH_APP_ID,
      });
    } catch (error) {
      console.error('Error creating Branch service:', error);
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
      throw new Error(`Branch API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getLinks(limit: number = 100, cursor?: string): Promise<{ links: BranchLink[]; nextCursor?: string }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (cursor) {
        params.append('cursor', cursor);
      }

      const response = await this.makeRequest(`/v1/app/${this.appId}/url?${params.toString()}`);

      const links = response.data.map((link: any) => ({
        id: link.id,
        url: link.url,
        alias: link.alias || '',
        campaign: link.data?.campaign || '',
        channel: link.data?.channel || '',
        feature: link.data?.feature || '',
        stage: link.data?.stage || '',
        tags: link.tags || [],
        data: link.data || {},
        clicks: link.click_count || 0,
        createdAt: link.creation_timestamp,
        updatedAt: link.update_timestamp,
      }));

      return {
        links,
        nextCursor: response.cursor?.next,
      };
    } catch (error) {
      console.error('Error fetching Branch links:', error);
      throw new Error('Failed to fetch links');
    }
  }

  async getEvents(
    startDate: string,
    endDate: string,
    eventName?: string,
    limit: number = 1000
  ): Promise<BranchAttributionEvent[]> {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        limit: limit.toString(),
        granularity: 'all',
      });

      if (eventName) {
        params.append('event_name', eventName);
      }

      const response = await this.makeRequest(`/v2/event/standard?${params.toString()}`);

      return response.data.map((event: any) => ({
        id: event.id,
        name: event.name,
        timestamp: event.timestamp,
        userAgent: event.user_agent || '',
        platform: event.platform || '',
        channel: event.last_attributed_touch_data?.channel || '',
        campaign: event.last_attributed_touch_data?.campaign || '',
        feature: event.last_attributed_touch_data?.feature || '',
        stage: event.last_attributed_touch_data?.stage || '',
        tags: event.last_attributed_touch_data?.tags || [],
        customData: event.custom_data || {},
        linkId: event.link_id,
        linkUrl: event.link_url,
        revenue: event.revenue_in_usd,
      }));
    } catch (error) {
      console.error('Error fetching Branch events:', error);
      throw new Error('Failed to fetch events');
    }
  }

  async getCampaignPerformance(
    startDate: string,
    endDate: string,
    campaigns?: string[]
  ): Promise<BranchCampaignPerformance[]> {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        data_source: 'eo_branch_cta_view',
        granularity: 'all',
        dimensions: 'last_attributed_touch_data_tilde_campaign,last_attributed_touch_data_tilde_channel,last_attributed_touch_data_tilde_feature',
        ordered_by: 'unique_count',
        order: 'descending',
      });

      if (campaigns && campaigns.length > 0) {
        params.append('filters', `last_attributed_touch_data_tilde_campaign:${campaigns.join(',')}`);
      }

      const response = await this.makeRequest(`/v3/export?${params.toString()}`);

      return response.data.map((item: any) => {
        const clicks = item.unique_count || 0;
        const installs = item.install_count || 0;
        const opens = item.open_count || 0;
        const purchases = item.purchase_count || 0;
        const revenue = item.revenue_in_usd || 0;
        const webSessions = item.web_session_start_count || 0;

        return {
          campaign: item.last_attributed_touch_data_tilde_campaign || 'Unknown',
          channel: item.last_attributed_touch_data_tilde_channel || 'Unknown',
          feature: item.last_attributed_touch_data_tilde_feature || 'Unknown',
          clicks,
          installs,
          opens,
          webSessionStarts: webSessions,
          purchases,
          revenue,
          conversionRate: clicks > 0 ? (purchases / clicks) * 100 : 0,
          installRate: clicks > 0 ? (installs / clicks) * 100 : 0,
          openRate: installs > 0 ? (opens / installs) * 100 : 0,
          revenuePerUser: (installs + opens) > 0 ? revenue / (installs + opens) : 0,
          period: `${startDate} to ${endDate}`,
        };
      });
    } catch (error) {
      console.error('Error fetching Branch campaign performance:', error);
      throw new Error('Failed to fetch campaign performance');
    }
  }

  async getAttributionAnalysis(
    startDate: string,
    endDate: string,
    attributionWindow: number = 7
  ): Promise<BranchAttributionAnalysis> {
    try {
      const events = await this.getEvents(startDate, endDate);
      
      // Analyze cross-platform attribution
      const platformAnalysis = new Map<string, any>();
      
      events.forEach(event => {
        const platform = event.platform || 'Unknown';
        if (!platformAnalysis.has(platform)) {
          platformAnalysis.set(platform, {
            platform,
            clicks: 0,
            installs: 0,
            opens: 0,
            purchases: 0,
            revenue: 0,
          });
        }

        const analysis = platformAnalysis.get(platform);
        if (event.name === 'click') analysis.clicks++;
        if (event.name === 'install') analysis.installs++;
        if (event.name === 'open') analysis.opens++;
        if (event.name === 'purchase') analysis.purchases++;
        analysis.revenue += event.revenue || 0;
      });

      const crossPlatform = Array.from(platformAnalysis.values()).map((item: any) => ({
        ...item,
        conversionRate: item.clicks > 0 ? (item.purchases / item.clicks) * 100 : 0,
      }));

      // Analyze channel attribution
      const channelAnalysis = new Map<string, any>();
      
      events.forEach(event => {
        const channel = event.channel || 'Unknown';
        if (!channelAnalysis.has(channel)) {
          channelAnalysis.set(channel, {
            channel,
            firstTouch: 0,
            lastTouch: 0,
            assisted: 0,
            revenue: 0,
          });
        }

        const analysis = channelAnalysis.get(channel);
        // Simplified attribution logic (would need more sophisticated tracking)
        if (event.name === 'click') analysis.firstTouch++;
        if (event.name === 'purchase') analysis.lastTouch++;
        analysis.revenue += event.revenue || 0;
      });

      const channels = Array.from(channelAnalysis.values()).map((item: any) => ({
        ...item,
        attribution: 'multi_touch' as const,
      }));

      // Analyze campaign attribution
      const campaignAnalysis = new Map<string, any>();
      
      events.forEach(event => {
        const campaign = event.campaign || 'Unknown';
        if (!campaignAnalysis.has(campaign)) {
          campaignAnalysis.set(campaign, {
            campaign,
            touches: 0,
            conversions: 0,
            revenue: 0,
          });
        }

        const analysis = campaignAnalysis.get(campaign);
        analysis.touches++;
        if (event.name === 'purchase') analysis.conversions++;
        analysis.revenue += event.revenue || 0;
      });

      const campaigns = Array.from(campaignAnalysis.values()).map((item: any) => ({
        ...item,
        roi: item.revenue > 0 ? (item.revenue / Math.max(item.touches * 0.1, 1)) * 100 : 0,
        attributionWindow: `${attributionWindow} days`,
      }));

      // Simplified journey analysis (would need more sophisticated tracking)
      const journeys = events
        .filter(event => event.name === 'purchase')
        .slice(0, 10)
        .map(purchaseEvent => ({
          touchpoints: [
            {
              channel: purchaseEvent.channel,
              timestamp: purchaseEvent.timestamp,
              touchType: 'purchase' as const,
            }
          ],
          conversionValue: purchaseEvent.revenue || 0,
          journeyDuration: 0, // Would calculate from actual journey data
        }));

      return {
        crossPlatform,
        channels,
        campaigns,
        journeys,
      };
    } catch (error) {
      console.error('Error generating Branch attribution analysis:', error);
      throw new Error('Failed to generate attribution analysis');
    }
  }

  async getDeepLinkAnalytics(
    startDate: string,
    endDate: string,
    linkIds?: string[]
  ): Promise<BranchDeepLinkAnalytics> {
    try {
      const { links } = await this.getLinks(1000);
      
      const filteredLinks = linkIds ? 
        links.filter(link => linkIds.includes(link.id)) : 
        links;

      // Get click analytics for each link
      const linkAnalytics = await Promise.all(
        filteredLinks.map(async (link) => {
          try {
            const params = new URLSearchParams({
              start_date: startDate,
              end_date: endDate,
              link_id: link.id,
              granularity: 'all',
            });

            const response = await this.makeRequest(`/v1/app/${this.appId}/url/stats?${params.toString()}`);
            
            return {
              id: link.id,
              alias: link.alias,
              url: link.url,
              campaign: link.campaign,
              clicks: response.clicks || 0,
              uniqueClicks: response.unique_clicks || 0,
              installs: response.installs || 0,
              opens: response.opens || 0,
              conversionRate: response.clicks > 0 ? ((response.installs + response.opens) / response.clicks) * 100 : 0,
              topCountries: response.countries?.slice(0, 5) || [],
              topPlatforms: response.platforms?.slice(0, 5) || [],
            };
          } catch (error) {
            console.error(`Error fetching analytics for link ${link.id}:`, error);
            return {
              id: link.id,
              alias: link.alias,
              url: link.url,
              campaign: link.campaign,
              clicks: 0,
              uniqueClicks: 0,
              installs: 0,
              opens: 0,
              conversionRate: 0,
              topCountries: [],
              topPlatforms: [],
            };
          }
        })
      );

      // Calculate overall performance
      const totalClicks = linkAnalytics.reduce((sum, link) => sum + link.clicks, 0);
      const totalInstalls = linkAnalytics.reduce((sum, link) => sum + link.installs, 0);
      const totalOpens = linkAnalytics.reduce((sum, link) => sum + link.opens, 0);

      return {
        links: linkAnalytics,
        performance: {
          totalClicks,
          totalInstalls,
          totalOpens,
          overallConversionRate: totalClicks > 0 ? ((totalInstalls + totalOpens) / totalClicks) * 100 : 0,
          avgClicksPerLink: linkAnalytics.length > 0 ? totalClicks / linkAnalytics.length : 0,
        },
      };
    } catch (error) {
      console.error('Error fetching Branch deep link analytics:', error);
      throw new Error('Failed to fetch deep link analytics');
    }
  }

  async createLink(
    campaign: string,
    channel: string,
    feature: string,
    alias?: string,
    data?: Record<string, any>
  ): Promise<{ url: string; linkId: string }> {
    try {
      const linkData = {
        branch_key: this.accessToken,
        data: {
          campaign,
          channel,
          feature,
          ...data,
        },
      };

      if (alias) {
        linkData['alias'] = alias;
      }

      const response = await this.makeRequest('/v1/url', {
        method: 'POST',
        body: JSON.stringify(linkData),
      });

      return {
        url: response.url,
        linkId: response.id,
      };
    } catch (error) {
      console.error('Error creating Branch link:', error);
      throw new Error('Failed to create link');
    }
  }

  async syncToSupabase(userId: string, startDate: string, endDate: string): Promise<void> {
    try {
      const campaignPerformance = await this.getCampaignPerformance(startDate, endDate);
      
      const syncData = campaignPerformance.map(campaign => ({
        user_id: userId,
        platform: 'branch' as const,
        campaign_id: `${campaign.campaign}_${campaign.channel}`,
        campaign_name: `${campaign.campaign} (${campaign.channel})`,
        date: new Date().toISOString().split('T')[0],
        impressions: campaign.clicks,
        clicks: campaign.installs + campaign.opens,
        cost: 0, // Branch doesn't track advertising cost
        conversions: campaign.purchases,
        ctr: campaign.conversionRate,
        cpc: 0,
        revenue: campaign.revenue,
        created_at: new Date().toISOString(),
      }));

      if (syncData.length === 0) {
        console.log('No data to sync for Branch');
        return;
      }

      // Batch insert with upsert logic
      const { error } = await supabase
        .from('campaign_metrics')
        .upsert(syncData, {
          onConflict: 'user_id,platform,campaign_id,date',
          ignoreDuplicates: false,
        });

      if (error) {
        throw new Error(`Failed to sync Branch data: ${error.message}`);
      }

      // Log sync activity
      await supabase.from('user_activities').insert({
        user_id: userId,
        action: 'sync',
        platform: 'branch',
        details: { 
          records_synced: syncData.length,
          date_range: { startDate, endDate }
        },
        created_at: new Date().toISOString(),
      });

      console.log(`Successfully synced ${syncData.length} Branch records for user ${userId}`);
    } catch (error) {
      console.error('Error syncing Branch data to Supabase:', error);
      throw error;
    }
  }

  async validateConnection(): Promise<{ valid: boolean; error?: string; accountInfo?: any }> {
    try {
      const response = await this.makeRequest(`/v1/app/${this.appId}`);
      
      return {
        valid: true,
        accountInfo: {
          app_id: this.appId,
          app_name: response.name || 'Branch App',
          creation_date: response.creation_date,
          dev_name: response.dev_name,
          dev_email: response.dev_email,
        },
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Failed to validate Branch connection',
      };
    }
  }
}