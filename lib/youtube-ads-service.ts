import { GoogleAdsApi } from 'google-ads-api';
import { supabase } from '@/lib/supabase/client';
import { decryptTokenData } from '@/lib/utils/token-encryption';

export interface YouTubeAdsConfig {
  customerId: string;
  accessToken: string;
  refreshToken?: string;
  channelId?: string;
}

export interface YouTubeAdsCampaign {
  id: string;
  name: string;
  status: string;
  campaignType: string;
  advertisingChannelType: string;
  advertisingChannelSubType: string;
  targetingType: string;
  budget: {
    dailyBudget: number;
    totalBudget?: number;
  };
  bidStrategy: {
    type: string;
    targetCpm?: number;
    targetCpv?: number;
  };
  performance: {
    impressions: number;
    views: number;
    clicks: number;
    cost: number;
    ctr: number;
    averageCpv: number;
    averageCpm: number;
    videoViews: number;
    videoViewRate: number;
    engagementRate: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface YouTubeAdsMetrics {
  campaignId: string;
  date: string;
  impressions: number;
  views: number;
  clicks: number;
  cost: number;
  videoViews: number;
  videoViewRate: number;
  averageCpv: number;
  averageCpm: number;
  engagementRate: number;
  conversions: number;
  conversionValue: number;
}

export interface YouTubeVideoAd {
  id: string;
  name: string;
  videoId: string;
  videoUrl: string;
  thumbnailUrl: string;
  headline: string;
  description: string;
  callToAction: string;
  landingPageUrl: string;
  performance: {
    impressions: number;
    views: number;
    clicks: number;
    cost: number;
    videoViewRate: number;
    engagementRate: number;
  };
}

export class YouTubeAdsService {
  private googleAdsClient: GoogleAdsApi;
  private customerId: string;
  private channelId?: string;

  constructor(config: YouTubeAdsConfig) {
    this.customerId = config.customerId;
    this.channelId = config.channelId;
    
    this.googleAdsClient = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });

    // Set OAuth credentials
    const customer = this.googleAdsClient.Customer({
      customer_id: this.customerId,
      refresh_token: config.refreshToken,
    });
  }

  // Get YouTube advertising campaigns
  async getYouTubeCampaigns(startDate: string, endDate: string): Promise<YouTubeAdsCampaign[]> {
    try {
      const customer = this.googleAdsClient.Customer({
        customer_id: this.customerId,
      });

      // Query for YouTube campaigns specifically
      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.advertising_channel_sub_type,
          campaign.campaign_budget,
          campaign.bidding_strategy_type,
          campaign.target_cpm,
          campaign.target_cpv,
          metrics.impressions,
          metrics.video_views,
          metrics.clicks,
          metrics.cost_micros,
          metrics.ctr,
          metrics.average_cpv,
          metrics.average_cpm,
          metrics.video_view_rate,
          metrics.engagement_rate,
          segments.date
        FROM campaign 
        WHERE 
          campaign.advertising_channel_type = 'VIDEO'
          AND segments.date BETWEEN '${startDate}' AND '${endDate}'
          AND campaign.status != 'REMOVED'
        ORDER BY campaign.id, segments.date
      `;

      const response = await customer.query(query);
      
      // Group results by campaign and aggregate metrics
      const campaignMap = new Map<string, any>();
      
      response.forEach((row: any) => {
        const campaignId = row.campaign.id;
        
        if (!campaignMap.has(campaignId)) {
          campaignMap.set(campaignId, {
            id: campaignId,
            name: row.campaign.name,
            status: row.campaign.status,
            campaignType: 'VIDEO',
            advertisingChannelType: row.campaign.advertising_channel_type,
            advertisingChannelSubType: row.campaign.advertising_channel_sub_type,
            targetingType: 'YOUTUBE_CHANNEL',
            budget: {
              dailyBudget: 0, // Will be calculated from budget data
            },
            bidStrategy: {
              type: row.campaign.bidding_strategy_type,
              targetCpm: row.campaign.target_cpm,
              targetCpv: row.campaign.target_cpv,
            },
            performance: {
              impressions: 0,
              views: 0,
              clicks: 0,
              cost: 0,
              ctr: 0,
              averageCpv: 0,
              averageCpm: 0,
              videoViews: 0,
              videoViewRate: 0,
              engagementRate: 0,
            },
            dateRange: { startDate, endDate },
            dailyMetrics: [],
          });
        }
        
        const campaign = campaignMap.get(campaignId);
        
        // Add to daily metrics
        campaign.dailyMetrics.push({
          date: row.segments.date,
          impressions: parseInt(row.metrics.impressions) || 0,
          views: parseInt(row.metrics.video_views) || 0,
          clicks: parseInt(row.metrics.clicks) || 0,
          cost: (parseInt(row.metrics.cost_micros) || 0) / 1_000_000,
          videoViews: parseInt(row.metrics.video_views) || 0,
          videoViewRate: parseFloat(row.metrics.video_view_rate) || 0,
          averageCpv: (parseInt(row.metrics.average_cpv) || 0) / 1_000_000,
          averageCpm: (parseInt(row.metrics.average_cpm) || 0) / 1_000_000,
          engagementRate: parseFloat(row.metrics.engagement_rate) || 0,
        });
        
        // Aggregate performance metrics
        campaign.performance.impressions += parseInt(row.metrics.impressions) || 0;
        campaign.performance.views += parseInt(row.metrics.video_views) || 0;
        campaign.performance.clicks += parseInt(row.metrics.clicks) || 0;
        campaign.performance.cost += (parseInt(row.metrics.cost_micros) || 0) / 1_000_000;
        campaign.performance.videoViews += parseInt(row.metrics.video_views) || 0;
      });

      // Calculate averages and final metrics
      const campaigns = Array.from(campaignMap.values()).map(campaign => {
        const totalDays = campaign.dailyMetrics.length;
        if (totalDays > 0) {
          campaign.performance.ctr = campaign.performance.impressions > 0 
            ? (campaign.performance.clicks / campaign.performance.impressions) * 100 
            : 0;
          campaign.performance.averageCpv = campaign.performance.views > 0 
            ? campaign.performance.cost / campaign.performance.views 
            : 0;
          campaign.performance.averageCpm = campaign.performance.impressions > 0 
            ? (campaign.performance.cost / campaign.performance.impressions) * 1000 
            : 0;
          campaign.performance.videoViewRate = campaign.performance.impressions > 0 
            ? (campaign.performance.videoViews / campaign.performance.impressions) * 100 
            : 0;
          campaign.performance.engagementRate = campaign.dailyMetrics.reduce((sum: number, day: any) => 
            sum + day.engagementRate, 0) / totalDays;
        }
        return campaign;
      });

      return campaigns;
    } catch (error) {
      console.error('YouTube Ads campaigns fetch error:', error);
      throw new Error('Failed to fetch YouTube Ads campaigns');
    }
  }

  // Get YouTube video ads performance
  async getVideoAds(campaignId: string, startDate: string, endDate: string): Promise<YouTubeVideoAd[]> {
    try {
      const customer = this.googleAdsClient.Customer({
        customer_id: this.customerId,
      });

      const query = `
        SELECT 
          ad_group_ad.ad.id,
          ad_group_ad.ad.name,
          ad_group_ad.ad.video_ad.video.id,
          ad_group_ad.ad.video_ad.headline,
          ad_group_ad.ad.video_ad.description1,
          ad_group_ad.ad.video_ad.call_to_action_text,
          ad_group_ad.ad.final_urls,
          metrics.impressions,
          metrics.video_views,
          metrics.clicks,
          metrics.cost_micros,
          metrics.video_view_rate,
          metrics.engagement_rate
        FROM ad_group_ad 
        WHERE 
          campaign.id = ${campaignId}
          AND segments.date BETWEEN '${startDate}' AND '${endDate}'
          AND ad_group_ad.status != 'REMOVED'
          AND ad_group_ad.ad.type = 'VIDEO_AD'
      `;

      const response = await customer.query(query);
      
      return response.map((row: any) => ({
        id: row.ad_group_ad.ad.id,
        name: row.ad_group_ad.ad.name || 'Untitled Video Ad',
        videoId: row.ad_group_ad.ad.video_ad.video?.id || '',
        videoUrl: row.ad_group_ad.ad.video_ad.video?.id 
          ? `https://www.youtube.com/watch?v=${row.ad_group_ad.ad.video_ad.video.id}`
          : '',
        thumbnailUrl: row.ad_group_ad.ad.video_ad.video?.id
          ? `https://img.youtube.com/vi/${row.ad_group_ad.ad.video_ad.video.id}/hqdefault.jpg`
          : '',
        headline: row.ad_group_ad.ad.video_ad.headline || '',
        description: row.ad_group_ad.ad.video_ad.description1 || '',
        callToAction: row.ad_group_ad.ad.video_ad.call_to_action_text || '',
        landingPageUrl: row.ad_group_ad.ad.final_urls?.[0] || '',
        performance: {
          impressions: parseInt(row.metrics.impressions) || 0,
          views: parseInt(row.metrics.video_views) || 0,
          clicks: parseInt(row.metrics.clicks) || 0,
          cost: (parseInt(row.metrics.cost_micros) || 0) / 1_000_000,
          videoViewRate: parseFloat(row.metrics.video_view_rate) || 0,
          engagementRate: parseFloat(row.metrics.engagement_rate) || 0,
        },
      }));
    } catch (error) {
      console.error('YouTube video ads fetch error:', error);
      throw new Error('Failed to fetch YouTube video ads');
    }
  }

  // Get comprehensive YouTube Ads account performance
  async getAccountPerformance(startDate: string, endDate: string): Promise<any> {
    try {
      const campaigns = await this.getYouTubeCampaigns(startDate, endDate);
      
      // Aggregate account-level metrics
      const totalMetrics = campaigns.reduce((acc, campaign) => ({
        totalImpressions: acc.totalImpressions + campaign.performance.impressions,
        totalViews: acc.totalViews + campaign.performance.views,
        totalClicks: acc.totalClicks + campaign.performance.clicks,
        totalCost: acc.totalCost + campaign.performance.cost,
        totalVideoViews: acc.totalVideoViews + campaign.performance.videoViews,
        activeCampaigns: acc.activeCampaigns + (campaign.status === 'ENABLED' ? 1 : 0),
        totalCampaigns: acc.totalCampaigns + 1,
      }), {
        totalImpressions: 0,
        totalViews: 0,
        totalClicks: 0,
        totalCost: 0,
        totalVideoViews: 0,
        activeCampaigns: 0,
        totalCampaigns: 0,
      });

      return {
        customerId: this.customerId,
        channelId: this.channelId,
        accountMetrics: {
          ...totalMetrics,
          averageCtr: totalMetrics.totalImpressions > 0 
            ? (totalMetrics.totalClicks / totalMetrics.totalImpressions) * 100 
            : 0,
          averageCpv: totalMetrics.totalViews > 0 
            ? totalMetrics.totalCost / totalMetrics.totalViews 
            : 0,
          averageCpm: totalMetrics.totalImpressions > 0 
            ? (totalMetrics.totalCost / totalMetrics.totalImpressions) * 1000 
            : 0,
          videoViewRate: totalMetrics.totalImpressions > 0 
            ? (totalMetrics.totalVideoViews / totalMetrics.totalImpressions) * 100 
            : 0,
        },
        campaigns: campaigns,
        dateRange: { startDate, endDate },
      };
    } catch (error) {
      console.error('YouTube Ads account performance error:', error);
      throw new Error('Failed to fetch account performance');
    }
  }

  // Sync YouTube Ads data to Supabase (follows Google Analytics pattern)
  async syncToSupabase(userId: string, startDate: string, endDate: string): Promise<void> {
    try {
      const [accountPerformance, topVideoAds] = await Promise.all([
        this.getAccountPerformance(startDate, endDate),
        this.getTopVideoAds(startDate, endDate)
      ]);

      // Aggregate metrics for campaign_metrics table
      const aggregatedMetrics = {
        // Account overview
        customerId: this.customerId,
        channelId: this.channelId,
        totalCampaigns: accountPerformance.accountMetrics.totalCampaigns,
        activeCampaigns: accountPerformance.accountMetrics.activeCampaigns,
        
        // Performance metrics
        totalImpressions: accountPerformance.accountMetrics.totalImpressions,
        totalViews: accountPerformance.accountMetrics.totalViews,
        totalClicks: accountPerformance.accountMetrics.totalClicks,
        totalCost: accountPerformance.accountMetrics.totalCost,
        totalVideoViews: accountPerformance.accountMetrics.totalVideoViews,
        
        // Calculated KPIs
        averageCtr: accountPerformance.accountMetrics.averageCtr,
        averageCpv: accountPerformance.accountMetrics.averageCpv,
        averageCpm: accountPerformance.accountMetrics.averageCpm,
        videoViewRate: accountPerformance.accountMetrics.videoViewRate,
        
        // Campaign details
        campaigns: accountPerformance.campaigns.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          performance: c.performance,
          budget: c.budget,
          bidStrategy: c.bidStrategy
        })),
        
        // Top performing video ads
        topVideoAds: topVideoAds.slice(0, 10),
        
        // Data metadata
        syncDate: new Date().toISOString(),
        dateRange: { startDate, endDate },
        platform: 'youtube_ads'
      };

      // Store in campaign_metrics table
      const { error: metricsError } = await supabase
        .from('campaign_metrics')
        .upsert({
          user_id: userId,
          platform: 'youtube_ads',
          metrics_data: aggregatedMetrics,
          data_quality_score: 95, // High quality for Google Ads API
          freshness_hours: 0,
          created_at: new Date().toISOString()
        });

      if (metricsError) {
        throw new Error(`Failed to store YouTube Ads metrics: ${metricsError.message}`);
      }

      console.log('✅ YouTube Ads data synced successfully to Supabase');
    } catch (error) {
      console.error('YouTube Ads sync error:', error);
      throw error;
    }
  }

  // Get top performing video ads across all campaigns
  async getTopVideoAds(startDate: string, endDate: string, limit: number = 10): Promise<YouTubeVideoAd[]> {
    try {
      const campaigns = await this.getYouTubeCampaigns(startDate, endDate);
      const allVideoAds: YouTubeVideoAd[] = [];

      // Get video ads for each campaign
      for (const campaign of campaigns) {
        const videoAds = await this.getVideoAds(campaign.id, startDate, endDate);
        allVideoAds.push(...videoAds);
      }

      // Sort by video view rate and return top performers
      return allVideoAds
        .sort((a, b) => b.performance.videoViewRate - a.performance.videoViewRate)
        .slice(0, limit);
    } catch (error) {
      console.error('Top video ads fetch error:', error);
      throw new Error('Failed to fetch top video ads');
    }
  }

  // Static method to create service from user tokens (follows Google Analytics pattern)
  static async createFromUserTokens(userId: string): Promise<YouTubeAdsService | null> {
    try {
      const { data: tokenData } = await supabase
        .from('user_tokens')
        .select('token_data, expires_at')
        .eq('user_id', userId)
        .eq('platform', 'youtube_ads')
        .eq('is_active', true)
        .single();

      if (!tokenData?.token_data) {
        console.log('No YouTube Ads tokens found for user:', userId);
        return null;
      }

      // Decrypt token data
      const decryptedTokens = decryptTokenData(tokenData.token_data);
      
      // Get Google Ads customer ID from connection metadata
      const connectionMetadata = decryptedTokens.connection_metadata;
      const adsAccounts = connectionMetadata?.ads_accounts || [];
      
      if (adsAccounts.length === 0) {
        console.log('No Google Ads accounts found for YouTube Ads user:', userId);
        return null;
      }

      // Use the first available ads account
      const customerId = adsAccounts[0].replace('customers/', '');
      
      // Get channel ID from YouTube channels
      const youtubeChannels = connectionMetadata?.youtube_channels || [];
      const channelId = youtubeChannels[0]?.id;

      return new YouTubeAdsService({
        customerId,
        channelId,
        accessToken: decryptedTokens.access_token,
        refreshToken: decryptedTokens.refresh_token
      });
    } catch (error) {
      console.error('Error creating YouTube Ads service:', error);
      return null;
    }
  }
}