export interface GoogleAnalyticsMetrics {
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  averageSessionDuration: number;
  conversionRate: number;
}

export interface GoogleAnalyticsData {
  connected: boolean;
  metrics?: GoogleAnalyticsMetrics;
  trafficSources?: any[];
  topPages?: any[];
  message?: string;
}

export class GoogleAnalyticsClientService {
  private userId: string;
  private baseUrl: string;

  constructor(userId: string) {
    this.userId = userId;
    this.baseUrl = '/api/google-analytics-proxy';
  }

  public async fetchTrafficMetrics(propertyId?: string, startDate?: string, endDate?: string): Promise<GoogleAnalyticsData> {
    try {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${this.baseUrl}/fetchTrafficMetrics?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            connected: false,
            message: "Google Analytics authentication required. Please reconnect your account.",
          };
        }

        if (response.status === 404) {
          return {
            connected: false,
            message: "Google Analytics integration not configured yet.",
          };
        }

        const errorData = await response.json().catch(() => ({}));
        return {
          connected: false,
          message: errorData.message || `Failed to fetch Google Analytics data (${response.status})`,
        };
      }

      const result = await response.json();
      return result.success ? {
        connected: result.connected,
        metrics: result.data?.metrics,
        trafficSources: result.data?.trafficSources,
        topPages: result.data?.topPages,
        message: result.message
      } : {
        connected: false,
        message: result.message || "Failed to fetch Google Analytics data",
      };
    } catch (error) {
      console.error("Error fetching Google Analytics data:", error);
      return {
        connected: false,
        message: "Failed to fetch Google Analytics data",
      };
    }
  }

  public async getAttributionAnalysis(propertyId?: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${this.baseUrl}/getAttributionAnalysis?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return { connected: false, message: "Failed to fetch attribution analysis" };
      }

      const result = await response.json();
      return result.success ? result.data : { connected: false };
    } catch (error) {
      console.error("Error fetching Google Analytics attribution:", error);
      return { connected: false, message: "Failed to fetch attribution analysis" };
    }
  }

  public async syncData(propertyId?: string, startDate?: string, endDate?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          propertyId,
          startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: endDate || new Date().toISOString().split('T')[0],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Error syncing Google Analytics data:', error);
      return { success: false, message: `Failed to sync Google Analytics data` };
    }
  }

  // Backward compatibility methods for existing dashboard
  public async getAnalyticsData(): Promise<GoogleAnalyticsMetrics> {
    const data = await this.fetchTrafficMetrics();
    return data.metrics || {
      sessions: 0,
      users: 0,
      pageviews: 0,
      bounceRate: 0,
      averageSessionDuration: 0,
      conversionRate: 0,
    };
  }
}

// Standalone function for backward compatibility
export const fetchGoogleAnalyticsData = async (userId: string): Promise<GoogleAnalyticsData> => {
  const service = new GoogleAnalyticsClientService(userId);
  return service.fetchTrafficMetrics();
}