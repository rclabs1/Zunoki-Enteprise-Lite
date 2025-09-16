
// lib/meta-ads-service.ts

export interface MetaAdsCampaign {
  id: string
  name: string
  status: string
  impressions: number
  clicks: number
  cost: number
  ctr: number
  cpc: number
  conversions: number
  conversionRate: number
  dateRange: string
}

export interface MetaAdsData {
  connected: boolean
  campaigns?: MetaAdsCampaign[]
  message?: string
}

export class MetaAdsService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  public async fetchMetaAdsData(): Promise<MetaAdsData> {
    try {
      const response = await fetch("/api/meta-ads/listCampaigns", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`Meta Ads API not available: ${response.status}`);
        // Return demo data like other stable providers
        return {
          connected: true,
          campaigns: [
            {
              id: 'demo-1',
              name: 'Demo Campaign 1',
              status: 'active',
              impressions: 25000,
              clicks: 1250,
              cost: 500,
              ctr: 5.0,
              cpc: 0.40,
              conversions: 87,
              conversionRate: 6.96,
              dateRange: 'Last 30 days'
            },
            {
              id: 'demo-2', 
              name: 'Demo Campaign 2',
              status: 'paused',
              impressions: 18500,
              clicks: 925,
              cost: 350,
              ctr: 5.0,
              cpc: 0.38,
              conversions: 62,
              conversionRate: 6.70,
              dateRange: 'Last 30 days'
            }
          ],
          message: "Using demo data - Meta Ads not connected"
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn("Meta Ads API unavailable:", error);
      return {
        connected: true,
        campaigns: [
          {
            id: 'demo-1',
            name: 'Demo Campaign 1',
            status: 'active',
            impressions: 25000,
            clicks: 1250,
            cost: 500,
            ctr: 5.0,
            cpc: 0.40,
            conversions: 87,
            conversionRate: 6.96,
            dateRange: 'Last 30 days'
          }
        ],
        message: "Using demo data - API unavailable"
      };
    }
  }

  public async pauseCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("/api/meta-ads/pauseCampaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ campaignId, userId: this.userId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`Error pausing campaign ${campaignId}:`, error);
      return { success: false, message: `Failed to pause campaign ${campaignId}` };
    }
  }

  public async enableCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("/api/meta-ads/enableCampaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ campaignId, userId: this.userId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`Error enabling campaign ${campaignId}:`, error);
      return { success: false, message: `Failed to enable campaign ${campaignId}` };
    }
  }

  public async fetchPerformanceMetrics(campaignId?: string): Promise<{ success: boolean; metrics?: any; message?: string }> {
    try {
      const response = await fetch("/api/meta-ads/fetchPerformanceMetrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ campaignId, userId: this.userId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`Error fetching performance metrics for campaign ${campaignId || 'all'}:`, error);
      return { success: false, message: `Failed to fetch performance metrics for campaign ${campaignId || 'all'}` };
    }
  }
}
