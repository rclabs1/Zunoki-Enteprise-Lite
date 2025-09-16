import { google } from 'googleapis';
import { supabase } from '@/lib/supabase/client';
import { decryptTokenData } from '@/lib/utils/token-encryption';

export interface YouTubeAnalyticsConfig {
  channelId: string;
  accessToken: string;
  refreshToken?: string;
}

export interface YouTubeChannelMetrics {
  date: string;
  views: number;
  subscribersGained: number;
  estimatedMinutesWatched: number;
  likes: number;
  comments: number;
  shares: number;
  averageViewDuration: number;
  clickThroughRate: number;
  engagementRate: number;
}

export interface YouTubeVideoMetrics {
  videoId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  averageViewDuration: number;
  clickThroughRate: number;
  subscribersGained: number;
  publishedAt: string;
  thumbnailUrl: string;
}

export interface YouTubeAudienceInsights {
  ageGroup: string;
  gender: string;
  geography: string;
  percentage: number;
  watchTimePercentage: number;
}

export class YouTubeAnalyticsService {
  private youtubeAnalytics: any;
  private youtube: any;
  private channelId: string;

  constructor(config: YouTubeAnalyticsConfig) {
    this.channelId = config.channelId;
    
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });

    this.youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });
    this.youtube = google.youtube({ version: 'v3', auth });
  }

  // Get channel metrics for date range
  async getChannelMetrics(startDate: string, endDate: string): Promise<YouTubeChannelMetrics[]> {
    try {
      const response = await this.youtubeAnalytics.reports.query({
        ids: `channel==${this.channelId}`,
        startDate,
        endDate,
        metrics: 'views,subscribersGained,estimatedMinutesWatched,likes,comments,shares,averageViewDuration',
        dimensions: 'day',
        sort: 'day'
      });

      const rows = response.data.rows || [];
      return rows.map((row: any[]) => ({
        date: row[0],
        views: row[1] || 0,
        subscribersGained: row[2] || 0,
        estimatedMinutesWatched: row[3] || 0,
        likes: row[4] || 0,
        comments: row[5] || 0,
        shares: row[6] || 0,
        averageViewDuration: row[7] || 0,
        clickThroughRate: 0, // Calculated separately
        engagementRate: row[4] && row[1] ? ((row[4] + row[5]) / row[1]) * 100 : 0
      }));
    } catch (error) {
      console.error('YouTube Analytics channel metrics error:', error);
      throw new Error('Failed to fetch YouTube channel metrics');
    }
  }

  // Get top performing videos
  async getTopVideos(startDate: string, endDate: string, maxResults: number = 10): Promise<YouTubeVideoMetrics[]> {
    try {
      // First get video IDs by views
      const analyticsResponse = await this.youtubeAnalytics.reports.query({
        ids: `channel==${this.channelId}`,
        startDate,
        endDate,
        metrics: 'views,likes,comments,shares,averageViewDuration,subscribersGained',
        dimensions: 'video',
        sort: '-views',
        maxResults
      });

      const videoData = analyticsResponse.data.rows || [];
      const videoIds = videoData.map((row: any[]) => row[0]);

      if (videoIds.length === 0) return [];

      // Get video details from YouTube Data API
      const videoDetails = await this.youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: videoIds.join(',')
      });

      const videos = videoDetails.data.items || [];
      
      return videos.map((video: any, index: number) => {
        const analyticsRow = videoData[index] || [];
        return {
          videoId: video.id,
          title: video.snippet?.title || 'Unknown Title',
          views: parseInt(analyticsRow[1]) || 0,
          likes: parseInt(analyticsRow[2]) || 0,
          comments: parseInt(analyticsRow[3]) || 0,
          shares: parseInt(analyticsRow[4]) || 0,
          averageViewDuration: parseFloat(analyticsRow[5]) || 0,
          clickThroughRate: 0, // Would need separate API call
          subscribersGained: parseInt(analyticsRow[6]) || 0,
          publishedAt: video.snippet?.publishedAt || '',
          thumbnailUrl: video.snippet?.thumbnails?.medium?.url || ''
        };
      });
    } catch (error) {
      console.error('YouTube Analytics top videos error:', error);
      throw new Error('Failed to fetch top videos');
    }
  }

  // Get comprehensive channel performance
  async getChannelPerformance(startDate: string, endDate: string): Promise<any> {
    try {
      // Get channel statistics
      const channelResponse = await this.youtube.channels.list({
        part: ['statistics', 'snippet'],
        id: [this.channelId]
      });

      const channel = channelResponse.data.items?.[0];
      const stats = channel?.statistics;

      // Get analytics data for the period
      const analyticsResponse = await this.youtubeAnalytics.reports.query({
        ids: `channel==${this.channelId}`,
        startDate,
        endDate,
        metrics: 'views,subscribersGained,estimatedMinutesWatched,likes,comments,shares,averageViewDuration'
      });

      const periodData = analyticsResponse.data.rows?.[0] || [];

      return {
        channelName: channel?.snippet?.title || 'Unknown Channel',
        totalSubscribers: parseInt(stats?.subscriberCount) || 0,
        totalViews: parseInt(stats?.viewCount) || 0,
        totalVideos: parseInt(stats?.videoCount) || 0,
        periodViews: parseInt(periodData[0]) || 0,
        periodSubscribersGained: parseInt(periodData[1]) || 0,
        periodWatchTime: parseInt(periodData[2]) || 0,
        periodLikes: parseInt(periodData[3]) || 0,
        periodComments: parseInt(periodData[4]) || 0,
        periodShares: parseInt(periodData[5]) || 0,
        averageViewDuration: parseFloat(periodData[6]) || 0,
        engagementRate: periodData[0] ? ((periodData[3] + periodData[4]) / periodData[0]) * 100 : 0
      };
    } catch (error) {
      console.error('YouTube Analytics channel performance error:', error);
      throw new Error('Failed to fetch channel performance');
    }
  }

  // Get audience demographics and insights
  async getAudienceInsights(startDate: string, endDate: string): Promise<YouTubeAudienceInsights[]> {
    try {
      const insights: YouTubeAudienceInsights[] = [];

      // Get age and gender demographics
      const demographicsResponse = await this.youtubeAnalytics.reports.query({
        ids: `channel==${this.channelId}`,
        startDate,
        endDate,
        metrics: 'viewerPercentage,estimatedMinutesWatched',
        dimensions: 'ageGroup,gender',
        sort: '-viewerPercentage'
      });

      const demographicsData = demographicsResponse.data.rows || [];
      demographicsData.forEach((row: any[]) => {
        insights.push({
          ageGroup: row[0],
          gender: row[1],
          geography: 'Unknown',
          percentage: parseFloat(row[2]) || 0,
          watchTimePercentage: parseFloat(row[3]) || 0
        });
      });

      // Get geographic data
      const geoResponse = await this.youtubeAnalytics.reports.query({
        ids: `channel==${this.channelId}`,
        startDate,
        endDate,
        metrics: 'viewerPercentage,estimatedMinutesWatched',
        dimensions: 'country',
        sort: '-viewerPercentage',
        maxResults: 10
      });

      const geoData = geoResponse.data.rows || [];
      geoData.forEach((row: any[]) => {
        insights.push({
          ageGroup: 'All',
          gender: 'All',
          geography: row[0],
          percentage: parseFloat(row[1]) || 0,
          watchTimePercentage: parseFloat(row[2]) || 0
        });
      });

      return insights;
    } catch (error) {
      console.error('YouTube Analytics audience insights error:', error);
      throw new Error('Failed to fetch audience insights');
    }
  }

  // Sync data to Supabase database (follows Google Analytics pattern)
  async syncToSupabase(userId: string, startDate: string, endDate: string): Promise<void> {
    try {
      const [channelMetrics, channelPerformance, topVideos, audienceInsights] = await Promise.all([
        this.getChannelMetrics(startDate, endDate),
        this.getChannelPerformance(startDate, endDate),
        this.getTopVideos(startDate, endDate),
        this.getAudienceInsights(startDate, endDate)
      ]);

      // Aggregate metrics for campaign_metrics table
      const aggregatedMetrics = {
        // Channel overview
        channelName: channelPerformance.channelName,
        totalSubscribers: channelPerformance.totalSubscribers,
        totalViews: channelPerformance.totalViews,
        totalVideos: channelPerformance.totalVideos,
        
        // Period performance
        periodViews: channelPerformance.periodViews,
        periodSubscribersGained: channelPerformance.periodSubscribersGained,
        periodWatchTime: channelPerformance.periodWatchTime,
        periodLikes: channelPerformance.periodLikes,
        periodComments: channelPerformance.periodComments,
        periodShares: channelPerformance.periodShares,
        averageViewDuration: channelPerformance.averageViewDuration,
        engagementRate: channelPerformance.engagementRate,
        
        // Daily metrics breakdown
        dailyMetrics: channelMetrics,
        
        // Top performing content
        topVideos: topVideos.slice(0, 5), // Top 5 videos
        
        // Calculated KPIs
        avgViewsPerVideo: channelPerformance.totalViews / Math.max(channelPerformance.totalVideos, 1),
        subscriberGrowthRate: channelPerformance.periodSubscribersGained,
        watchTimeHours: channelPerformance.periodWatchTime / 60,
        
        // Data metadata
        syncDate: new Date().toISOString(),
        dateRange: { startDate, endDate },
        platform: 'youtube_analytics'
      };

      // Store in campaign_metrics table
      const { error: metricsError } = await supabase
        .from('campaign_metrics')
        .upsert({
          user_id: userId,
          platform: 'youtube_analytics',
          metrics_data: aggregatedMetrics,
          data_quality_score: 90, // High quality for YouTube Analytics API
          freshness_hours: 0,
          created_at: new Date().toISOString()
        });

      if (metricsError) {
        throw new Error(`Failed to store YouTube metrics: ${metricsError.message}`);
      }

      // Store audience insights
      const { error: insightsError } = await supabase
        .from('user_audience_insights')
        .upsert({
          user_id: userId,
          insight_type: 'youtube_demographics',
          insight_data: {
            demographics: audienceInsights,
            summary: {
              totalInsights: audienceInsights.length,
              topCountries: audienceInsights
                .filter(i => i.geography !== 'Unknown')
                .slice(0, 5),
              topAgeGroups: audienceInsights
                .filter(i => i.ageGroup !== 'All')
                .slice(0, 5)
            },
            syncDate: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      if (insightsError) {
        throw new Error(`Failed to store audience insights: ${insightsError.message}`);
      }

      console.log('✅ YouTube Analytics data synced successfully to Supabase');
    } catch (error) {
      console.error('YouTube Analytics sync error:', error);
      throw error;
    }
  }

  // Static method to create service from user tokens (follows Google Analytics pattern)
  static async createFromUserTokens(userId: string): Promise<YouTubeAnalyticsService | null> {
    try {
      const { data: tokenData } = await supabase
        .from('user_tokens')
        .select('token_data, expires_at')
        .eq('user_id', userId)
        .eq('platform', 'youtube_analytics')
        .eq('is_active', true)
        .single();

      if (!tokenData?.token_data) {
        console.log('No YouTube Analytics tokens found for user:', userId);
        return null;
      }

      // Decrypt token data
      const decryptedTokens = decryptTokenData(tokenData.token_data);
      
      // Get channel ID from token data or YouTube API
      let channelId = decryptedTokens.channelId;
      if (!channelId) {
        // If no channel ID stored, fetch from YouTube API
        const tempService = new YouTubeAnalyticsService({
          channelId: 'temp',
          accessToken: decryptedTokens.access_token,
          refreshToken: decryptedTokens.refresh_token
        });
        
        const channelResponse = await tempService.youtube.channels.list({
          part: ['id'],
          mine: true
        });
        
        channelId = channelResponse.data.items?.[0]?.id;
        if (!channelId) {
          throw new Error('No YouTube channel found for user');
        }
      }

      return new YouTubeAnalyticsService({
        channelId,
        accessToken: decryptedTokens.access_token,
        refreshToken: decryptedTokens.refresh_token
      });
    } catch (error) {
      console.error('Error creating YouTube Analytics service:', error);
      return null;
    }
  }
}