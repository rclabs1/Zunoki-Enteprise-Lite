import { supabase } from '@/lib/supabase/client';

export interface SegmentConfig {
  writeKey: string;
  workspaceSlug: string;
  accessToken?: string; // For Config API access
}

export interface SegmentSource {
  id: string;
  name: string;
  slug: string;
  type: string;
  enabled: boolean;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SegmentDestination {
  id: string;
  name: string;
  slug: string;
  type: string;
  enabled: boolean;
  settings: Record<string, any>;
  sourceId: string;
}

export interface SegmentEvent {
  messageId: string;
  timestamp: string;
  type: string;
  userId?: string;
  anonymousId?: string;
  event?: string;
  properties?: Record<string, any>;
  traits?: Record<string, any>;
  context?: Record<string, any>;
}

export interface SegmentProfile {
  id: string;
  userId?: string;
  anonymousId?: string;
  traits: Record<string, any>;
  events: SegmentEvent[];
  firstSeen: string;
  lastSeen: string;
  sessionsCount: number;
}

export interface SegmentAudienceInsight {
  segment: string;
  userCount: number;
  traits: Array<{
    key: string;
    value: string;
    count: number;
    percentage: number;
  }>;
  topEvents: Array<{
    event: string;
    count: number;
    lastOccurred: string;
  }>;
  devices: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  geography: Array<{
    country: string;
    city: string;
    count: number;
    percentage: number;
  }>;
}

export interface SegmentFunnelAnalysis {
  steps: Array<{
    event: string;
    userCount: number;
    conversionRate: number;
    dropoffRate: number;
    avgTimeToNext?: number;
  }>;
  overallConversionRate: number;
  totalUsers: number;
}

export class SegmentService {
  private writeKey: string;
  private workspaceSlug: string;
  private accessToken?: string;
  private baseUrl = 'https://api.segmentapis.com';
  private trackingUrl = 'https://api.segment.io';

  constructor(config: SegmentConfig) {
    this.writeKey = config.writeKey;
    this.workspaceSlug = config.workspaceSlug;
    this.accessToken = config.accessToken;
  }

  static async createFromUserTokens(userId: string): Promise<SegmentService | null> {
    try {
      const { data: credentialData, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'segment')
        .single();

      if (error || !credentialData) {
        console.error('No Segment credentials found for user:', userId);
        return null;
      }

      const credentials = credentialData.credentials;
      
      return new SegmentService({
        writeKey: credentials.write_key,
        workspaceSlug: credentials.workspace_slug,
        accessToken: credentials.access_token,
      });
    } catch (error) {
      console.error('Error creating Segment service:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Access token required for Segment Config API access');
    }

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
      throw new Error(`Segment API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getSources(): Promise<SegmentSource[]> {
    try {
      const response = await this.makeRequest(`/workspaces/${this.workspaceSlug}/sources`);
      
      return response.data.sources.map((source: any) => ({
        id: source.id,
        name: source.name,
        slug: source.slug,
        type: source.metadata.id,
        enabled: !source.enabled === false,
        settings: source.settings || {},
        createdAt: source.createTime,
        updatedAt: source.updateTime,
      }));
    } catch (error) {
      console.error('Error fetching Segment sources:', error);
      throw new Error('Failed to fetch sources');
    }
  }

  async getDestinations(sourceId?: string): Promise<SegmentDestination[]> {
    try {
      const endpoint = sourceId 
        ? `/workspaces/${this.workspaceSlug}/sources/${sourceId}/destinations`
        : `/workspaces/${this.workspaceSlug}/destinations`;
        
      const response = await this.makeRequest(endpoint);
      
      return response.data.destinations.map((dest: any) => ({
        id: dest.id,
        name: dest.name,
        slug: dest.slug,
        type: dest.metadata.id,
        enabled: !dest.enabled === false,
        settings: dest.settings || {},
        sourceId: dest.sourceId || '',
      }));
    } catch (error) {
      console.error('Error fetching Segment destinations:', error);
      throw new Error('Failed to fetch destinations');
    }
  }

  async getEventVolume(
    sourceId: string,
    startDate: string,
    endDate: string,
    granularity: 'day' | 'hour' = 'day'
  ): Promise<Array<{ date: string; eventCount: number; userCount: number }>> {
    try {
      const response = await this.makeRequest(
        `/workspaces/${this.workspaceSlug}/sources/${sourceId}/stats/event-volume?` +
        `startTime=${startDate}&endTime=${endDate}&granularity=${granularity}`
      );

      return response.data.eventVolume.map((item: any) => ({
        date: item.date,
        eventCount: item.eventCount || 0,
        userCount: item.userCount || 0,
      }));
    } catch (error) {
      console.error('Error fetching Segment event volume:', error);
      throw new Error('Failed to fetch event volume');
    }
  }

  async getTopEvents(
    sourceId: string,
    startDate: string,
    endDate: string,
    limit: number = 20
  ): Promise<Array<{ event: string; count: number; percentage: number }>> {
    try {
      const response = await this.makeRequest(
        `/workspaces/${this.workspaceSlug}/sources/${sourceId}/stats/event-names?` +
        `startTime=${startDate}&endTime=${endDate}&limit=${limit}`
      );

      const totalEvents = response.data.eventNames.reduce(
        (sum: number, item: any) => sum + (item.count || 0), 0
      );

      return response.data.eventNames.map((item: any) => ({
        event: item.name,
        count: item.count || 0,
        percentage: totalEvents > 0 ? ((item.count || 0) / totalEvents) * 100 : 0,
      }));
    } catch (error) {
      console.error('Error fetching Segment top events:', error);
      throw new Error('Failed to fetch top events');
    }
  }

  async getUserProfiles(
    sourceId: string,
    limit: number = 100,
    cursor?: string
  ): Promise<{ profiles: SegmentProfile[]; nextCursor?: string }> {
    try {
      let endpoint = `/workspaces/${this.workspaceSlug}/sources/${sourceId}/profiles?limit=${limit}`;
      if (cursor) {
        endpoint += `&cursor=${cursor}`;
      }

      const response = await this.makeRequest(endpoint);

      const profiles = response.data.profiles.map((profile: any) => ({
        id: profile.id,
        userId: profile.external_ids?.user_id,
        anonymousId: profile.external_ids?.anonymous_id,
        traits: profile.traits || {},
        events: [], // Events would need separate API call
        firstSeen: profile.created_at,
        lastSeen: profile.updated_at,
        sessionsCount: profile.traits?.sessions_count || 0,
      }));

      return {
        profiles,
        nextCursor: response.data.cursor?.next,
      };
    } catch (error) {
      console.error('Error fetching Segment user profiles:', error);
      throw new Error('Failed to fetch user profiles');
    }
  }

  async getAudienceInsights(
    sourceId: string,
    startDate: string,
    endDate: string,
    segmentName?: string
  ): Promise<SegmentAudienceInsight> {
    try {
      // Get top events for the time period
      const topEvents = await this.getTopEvents(sourceId, startDate, endDate, 10);
      
      // Get user profiles sample
      const { profiles } = await this.getUserProfiles(sourceId, 500);
      
      // Analyze traits
      const traitAnalysis = new Map<string, Map<string, number>>();
      const deviceAnalysis = new Map<string, number>();
      const geoAnalysis = new Map<string, number>();

      profiles.forEach(profile => {
        // Analyze traits
        Object.entries(profile.traits).forEach(([key, value]) => {
          if (!traitAnalysis.has(key)) {
            traitAnalysis.set(key, new Map());
          }
          const valueStr = String(value);
          const currentCount = traitAnalysis.get(key)!.get(valueStr) || 0;
          traitAnalysis.get(key)!.set(valueStr, currentCount + 1);
        });

        // Analyze devices
        const device = profile.traits.device_type || 'Unknown';
        deviceAnalysis.set(device, (deviceAnalysis.get(device) || 0) + 1);

        // Analyze geography
        const country = profile.traits.country || 'Unknown';
        const city = profile.traits.city || 'Unknown';
        const location = `${country}, ${city}`;
        geoAnalysis.set(location, (geoAnalysis.get(location) || 0) + 1);
      });

      const totalUsers = profiles.length;

      return {
        segment: segmentName || 'All Users',
        userCount: totalUsers,
        traits: Array.from(traitAnalysis.entries()).flatMap(([key, valueMap]) =>
          Array.from(valueMap.entries()).map(([value, count]) => ({
            key,
            value,
            count,
            percentage: (count / totalUsers) * 100,
          }))
        ).sort((a, b) => b.count - a.count).slice(0, 20),
        topEvents: topEvents.slice(0, 10).map(event => ({
          event: event.event,
          count: event.count,
          lastOccurred: new Date().toISOString(), // Would need event details
        })),
        devices: Array.from(deviceAnalysis.entries()).map(([type, count]) => ({
          type,
          count,
          percentage: (count / totalUsers) * 100,
        })).sort((a, b) => b.count - a.count),
        geography: Array.from(geoAnalysis.entries()).map(([location, count]) => {
          const [country, city] = location.split(', ');
          return {
            country,
            city,
            count,
            percentage: (count / totalUsers) * 100,
          };
        }).sort((a, b) => b.count - a.count).slice(0, 20),
      };
    } catch (error) {
      console.error('Error generating Segment audience insights:', error);
      throw new Error('Failed to generate audience insights');
    }
  }

  async getFunnelAnalysis(
    sourceId: string,
    events: string[],
    startDate: string,
    endDate: string
  ): Promise<SegmentFunnelAnalysis> {
    try {
      // This is a simplified funnel analysis
      // In a real implementation, you'd need to track user journeys through events
      const eventCounts = await Promise.all(
        events.map(event => this.getTopEvents(sourceId, startDate, endDate, 100))
      );

      let previousCount = 0;
      const steps = events.map((event, index) => {
        const eventData = eventCounts[index].find(e => e.event === event);
        const count = eventData?.count || 0;
        
        const conversionRate = index === 0 ? 100 : previousCount > 0 ? (count / previousCount) * 100 : 0;
        const dropoffRate = index === 0 ? 0 : previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0;
        
        const step = {
          event,
          userCount: count,
          conversionRate,
          dropoffRate,
          avgTimeToNext: undefined, // Would need event timing analysis
        };
        
        previousCount = count;
        return step;
      });

      const totalUsers = steps[0]?.userCount || 0;
      const finalUsers = steps[steps.length - 1]?.userCount || 0;
      const overallConversionRate = totalUsers > 0 ? (finalUsers / totalUsers) * 100 : 0;

      return {
        steps,
        overallConversionRate,
        totalUsers,
      };
    } catch (error) {
      console.error('Error generating Segment funnel analysis:', error);
      throw new Error('Failed to generate funnel analysis');
    }
  }

  async trackEvent(
    userId: string,
    event: string,
    properties: Record<string, any> = {},
    traits: Record<string, any> = {}
  ): Promise<{ success: boolean; messageId: string }> {
    try {
      const messageId = `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const payload = {
        userId,
        event,
        properties,
        context: {
          traits,
          timestamp: new Date().toISOString(),
        },
        messageId,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${this.trackingUrl}/v1/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(this.writeKey + ':').toString('base64')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to track event: ${response.status}`);
      }

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      console.error('Error tracking Segment event:', error);
      throw new Error('Failed to track event');
    }
  }

  async identifyUser(
    userId: string,
    traits: Record<string, any>
  ): Promise<{ success: boolean; messageId: string }> {
    try {
      const messageId = `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const payload = {
        userId,
        traits,
        messageId,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${this.trackingUrl}/v1/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(this.writeKey + ':').toString('base64')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to identify user: ${response.status}`);
      }

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      console.error('Error identifying Segment user:', error);
      throw new Error('Failed to identify user');
    }
  }

  async syncToSupabase(userId: string, startDate: string, endDate: string): Promise<void> {
    try {
      const sources = await this.getSources();
      
      if (sources.length === 0) {
        console.log('No sources found for Segment sync');
        return;
      }

      const syncPromises = sources.map(async (source) => {
        try {
          const eventVolume = await this.getEventVolume(source.id, startDate, endDate);
          
          return eventVolume.map(volume => ({
            user_id: userId,
            platform: 'segment' as const,
            campaign_id: source.id,
            campaign_name: source.name,
            date: volume.date,
            impressions: volume.eventCount,
            clicks: volume.userCount,
            cost: 0, // Segment doesn't track cost
            conversions: Math.floor(volume.userCount * 0.1), // Estimated conversions
            ctr: volume.eventCount > 0 ? (volume.userCount / volume.eventCount) * 100 : 0,
            cpc: 0,
            revenue: 0,
            created_at: new Date().toISOString(),
          }));
        } catch (error) {
          console.error(`Error syncing source ${source.id}:`, error);
          return [];
        }
      });

      const syncResults = await Promise.all(syncPromises);
      const syncData = syncResults.flat();

      if (syncData.length === 0) {
        console.log('No data to sync for Segment');
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
        throw new Error(`Failed to sync Segment data: ${error.message}`);
      }

      // Log sync activity
      await supabase.from('user_activities').insert({
        user_id: userId,
        action: 'sync',
        platform: 'segment',
        details: { 
          records_synced: syncData.length,
          sources_synced: sources.length,
          date_range: { startDate, endDate }
        },
        created_at: new Date().toISOString(),
      });

      console.log(`Successfully synced ${syncData.length} Segment records for user ${userId}`);
    } catch (error) {
      console.error('Error syncing Segment data to Supabase:', error);
      throw error;
    }
  }

  async validateConnection(): Promise<{ valid: boolean; error?: string; accountInfo?: any }> {
    try {
      const sources = await this.getSources();
      
      return {
        valid: true,
        accountInfo: {
          workspace_slug: this.workspaceSlug,
          source_count: sources.length,
          sources: sources.map(s => ({ id: s.id, name: s.name, type: s.type })),
        },
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Failed to validate Segment connection',
      };
    }
  }
}