import { google } from 'googleapis';
import { supabase } from '@/lib/supabase/client';
import { decryptTokenData } from '@/lib/utils/token-encryption';

export interface GoogleAnalyticsConfig {
  propertyId: string;
  accessToken: string;
  refreshToken?: string;
}

export interface AnalyticsMetric {
  date: string;
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  source: string;
  medium: string;
  campaign: string;
}

export interface AnalyticsFunnelData {
  step: string;
  users: number;
  dropoffRate: number;
  conversionRate: number;
}

export interface AttributionData {
  channel: string;
  firstClick: number;
  lastClick: number;
  linear: number;
  timeDecay: number;
  positionBased: number;
  revenue: number;
}

export class GoogleAnalyticsService {
  private analytics: any;
  private propertyId: string;

  constructor(config: GoogleAnalyticsConfig) {
    this.propertyId = config.propertyId;
    
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });
    
    this.analytics = google.analyticsdata({ version: 'v1beta', auth });
  }

  static async createFromUserTokens(userId: string): Promise<GoogleAnalyticsService | null> {
    try {
      const { data: tokenData, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'google_analytics')
        .single();

      if (error || !tokenData) {
        console.error('No Google Analytics tokens found for user:', userId);
        return null;
      }

      // Decrypt the token data if it's encrypted
      let decryptedTokenData;
      try {
        // Check if token_data is encrypted (base64 string) or plain object
        if (typeof tokenData.token_data === 'string') {
          console.log('🔓 Decrypting Google Analytics token data...');
          decryptedTokenData = await decryptTokenData(tokenData.token_data);
        } else {
          // Legacy unencrypted data - fallback for existing tokens
          decryptedTokenData = tokenData.token_data;
          console.warn('⚠️  Found unencrypted token data - consider re-authenticating for security');
        }
      } catch (decryptError) {
        console.error('❌ Failed to decrypt Google Analytics tokens:', decryptError);
        return null;
      }

      const { data: integrationData } = await supabase
        .from('user_integrations')
        .select('account_info')
        .eq('user_id', userId)
        .eq('provider', 'google_analytics')
        .single();

      const propertyId = integrationData?.account_info?.property_id || process.env.DEFAULT_GA4_PROPERTY_ID;

      return new GoogleAnalyticsService({
        propertyId,
        accessToken: decryptedTokenData.access_token,
        refreshToken: decryptedTokenData.refresh_token,
      });
    } catch (error) {
      console.error('Error creating Google Analytics service:', error);
      return null;
    }
  }

  async getTrafficMetrics(
    startDate: string,
    endDate: string,
    dimensions: string[] = ['date']
  ): Promise<AnalyticsMetric[]> {
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: dimensions.map(dim => ({ name: dim })),
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' },
            { name: 'totalRevenue' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        },
      };

      const response = await this.analytics.properties.runReport(request);
      const rows = response.data.rows || [];

      return rows.map((row: any) => ({
        date: row.dimensionValues[0]?.value || startDate,
        sessions: parseInt(row.metricValues[0]?.value || '0'),
        users: parseInt(row.metricValues[1]?.value || '0'),
        pageviews: parseInt(row.metricValues[2]?.value || '0'),
        bounceRate: parseFloat(row.metricValues[3]?.value || '0'),
        avgSessionDuration: parseFloat(row.metricValues[4]?.value || '0'),
        conversions: parseInt(row.metricValues[5]?.value || '0'),
        conversionRate: 0, // Calculate separately
        revenue: parseFloat(row.metricValues[6]?.value || '0'),
        source: row.dimensionValues[1]?.value || 'unknown',
        medium: row.dimensionValues[2]?.value || 'unknown',
        campaign: row.dimensionValues[3]?.value || 'unknown',
      }));
    } catch (error) {
      console.error('Error fetching Google Analytics metrics:', error);
      throw new Error('Failed to fetch analytics metrics');
    }
  }

  async getAttributionAnalysis(
    startDate: string,
    endDate: string
  ): Promise<AttributionData[]> {
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [
            { name: 'firstUserDefaultChannelGroup' },
            { name: 'sessionDefaultChannelGroup' },
          ],
          metrics: [
            { name: 'conversions' },
            { name: 'totalRevenue' },
            { name: 'sessions' },
          ],
        },
      };

      const response = await this.analytics.properties.runReport(request);
      const rows = response.data.rows || [];

      const channelData = new Map<string, AttributionData>();

      rows.forEach((row: any) => {
        const channel = row.dimensionValues[0]?.value || 'Unknown';
        const conversions = parseInt(row.metricValues[0]?.value || '0');
        const revenue = parseFloat(row.metricValues[1]?.value || '0');

        if (!channelData.has(channel)) {
          channelData.set(channel, {
            channel,
            firstClick: 0,
            lastClick: 0,
            linear: 0,
            timeDecay: 0,
            positionBased: 0,
            revenue: 0,
          });
        }

        const data = channelData.get(channel)!;
        data.firstClick += conversions;
        data.revenue += revenue;
      });

      return Array.from(channelData.values());
    } catch (error) {
      console.error('Error fetching attribution analysis:', error);
      throw new Error('Failed to fetch attribution data');
    }
  }

  async getFunnelAnalysis(
    startDate: string,
    endDate: string,
    funnelSteps: string[]
  ): Promise<AnalyticsFunnelData[]> {
    try {
      const funnelRequests = funnelSteps.map((step, index) => ({
        property: `properties/${this.propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'eventName' }],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              stringFilter: {
                matchType: 'EXACT',
                value: step,
              },
            },
          },
          metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
        },
      }));

      const responses = await Promise.all(
        funnelRequests.map(req => this.analytics.properties.runReport(req))
      );

      const funnelData: AnalyticsFunnelData[] = [];
      let previousUsers = 0;

      responses.forEach((response, index) => {
        const row = response.data.rows?.[0];
        const users = parseInt(row?.metricValues?.[1]?.value || '0');
        
        const dropoffRate = previousUsers > 0 ? 
          ((previousUsers - users) / previousUsers) * 100 : 0;
        
        const conversionRate = index === 0 ? 100 : 
          previousUsers > 0 ? (users / previousUsers) * 100 : 0;

        funnelData.push({
          step: funnelSteps[index],
          users,
          dropoffRate,
          conversionRate,
        });

        previousUsers = users;
      });

      return funnelData;
    } catch (error) {
      console.error('Error fetching funnel analysis:', error);
      throw new Error('Failed to fetch funnel data');
    }
  }

  async getTopPages(
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<Array<{ page: string; pageviews: number; uniquePageviews: number; avgTimeOnPage: number }>> {
    try {
      const request = {
        property: `properties/${this.propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'sessions' },
            { name: 'averageSessionDuration' },
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit,
        },
      };

      const response = await this.analytics.properties.runReport(request);
      const rows = response.data.rows || [];

      return rows.map((row: any) => ({
        page: row.dimensionValues[0]?.value || '',
        pageviews: parseInt(row.metricValues[0]?.value || '0'),
        uniquePageviews: parseInt(row.metricValues[1]?.value || '0'),
        avgTimeOnPage: parseFloat(row.metricValues[2]?.value || '0'),
      }));
    } catch (error) {
      console.error('Error fetching top pages:', error);
      throw new Error('Failed to fetch top pages data');
    }
  }

  async getAudienceInsights(
    startDate: string,
    endDate: string
  ): Promise<{
    demographics: Array<{ dimension: string; value: string; users: number; percentage: number }>;
    interests: Array<{ category: string; users: number; percentage: number }>;
    devices: Array<{ device: string; users: number; percentage: number }>;
  }> {
    try {
      const [demographicsResponse, interestsResponse, devicesResponse] = await Promise.all([
        this.analytics.properties.runReport({
          property: `properties/${this.propertyId}`,
          requestBody: {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'country' }, { name: 'city' }],
            metrics: [{ name: 'totalUsers' }],
            orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
            limit: 10,
          },
        }),
        this.analytics.properties.runReport({
          property: `properties/${this.propertyId}`,
          requestBody: {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'operatingSystem' }],
            metrics: [{ name: 'totalUsers' }],
            orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
          },
        }),
        this.analytics.properties.runReport({
          property: `properties/${this.propertyId}`,
          requestBody: {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [{ name: 'totalUsers' }],
            orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
          },
        }),
      ]);

      const totalUsers = demographicsResponse.data.rows?.reduce(
        (sum: number, row: any) => sum + parseInt(row.metricValues[0]?.value || '0'), 0
      ) || 1;

      return {
        demographics: (demographicsResponse.data.rows || []).map((row: any) => {
          const users = parseInt(row.metricValues[0]?.value || '0');
          return {
            dimension: 'location',
            value: `${row.dimensionValues[0]?.value}, ${row.dimensionValues[1]?.value}`,
            users,
            percentage: (users / totalUsers) * 100,
          };
        }),
        interests: (interestsResponse.data.rows || []).map((row: any) => {
          const users = parseInt(row.metricValues[0]?.value || '0');
          return {
            category: row.dimensionValues[0]?.value || 'Unknown',
            users,
            percentage: (users / totalUsers) * 100,
          };
        }),
        devices: (devicesResponse.data.rows || []).map((row: any) => {
          const users = parseInt(row.metricValues[0]?.value || '0');
          return {
            device: row.dimensionValues[0]?.value || 'Unknown',
            users,
            percentage: (users / totalUsers) * 100,
          };
        }),
      };
    } catch (error) {
      console.error('Error fetching audience insights:', error);
      throw new Error('Failed to fetch audience insights');
    }
  }

  async syncToSupabase(userId: string, startDate: string, endDate: string): Promise<void> {
    try {
      const metrics = await this.getTrafficMetrics(startDate, endDate, ['date', 'source', 'medium', 'campaign']);
      
      const syncData = metrics.map(metric => ({
        user_id: userId,
        platform: 'google_analytics' as const,
        campaign_id: `${metric.source}_${metric.medium}_${metric.campaign}`,
        campaign_name: `${metric.source} / ${metric.medium} / ${metric.campaign}`,
        date: metric.date,
        impressions: metric.pageviews,
        clicks: metric.sessions,
        cost: 0, // GA4 doesn't track cost directly
        conversions: metric.conversions,
        ctr: metric.pageviews > 0 ? (metric.sessions / metric.pageviews) * 100 : 0,
        cpc: 0,
        revenue: metric.revenue,
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
        throw new Error(`Failed to sync GA4 data: ${error.message}`);
      }

      // Log sync activity
      await supabase.from('user_activities').insert({
        user_id: userId,
        action: 'sync',
        platform: 'google_analytics',
        details: { 
          records_synced: syncData.length,
          date_range: { startDate, endDate }
        },
        created_at: new Date().toISOString(),
      });

      console.log(`Successfully synced ${syncData.length} GA4 records for user ${userId}`);
    } catch (error) {
      console.error('Error syncing GA4 data to Supabase:', error);
      throw error;
    }
  }

  async validateConnection(): Promise<{ valid: boolean; error?: string; accountInfo?: any }> {
    try {
      const response = await this.analytics.properties.get({
        name: `properties/${this.propertyId}`,
      });

      return {
        valid: true,
        accountInfo: {
          property_id: this.propertyId,
          property_name: response.data.displayName,
          currency: response.data.currencyCode,
          time_zone: response.data.timeZone,
        },
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Failed to validate Google Analytics connection',
      };
    }
  }
}