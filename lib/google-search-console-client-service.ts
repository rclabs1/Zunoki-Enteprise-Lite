export interface SearchConsoleQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleMetrics {
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  topQueries: SearchConsoleQuery[];
}

export interface SearchConsoleIndexing {
  indexedPages: number;
  totalPages: number;
  coverageIssues: number;
  lastCrawled: string;
}

export interface SearchConsoleData {
  connected: boolean;
  metrics?: SearchConsoleMetrics;
  indexing?: SearchConsoleIndexing;
  message?: string;
}

export class GoogleSearchConsoleClientService {
  private userId: string;
  private baseUrl: string;

  constructor(userId: string) {
    this.userId = userId;
    this.baseUrl = '/api/google-search-console-proxy';
  }

  public async getSearchPerformance(siteUrl?: string, startDate?: string, endDate?: string, dimensions?: string): Promise<SearchConsoleData> {
    try {
      const params = new URLSearchParams();
      if (siteUrl) params.append('siteUrl', siteUrl);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (dimensions) params.append('dimensions', dimensions);

      const response = await fetch(`${this.baseUrl}/getSearchPerformance?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            connected: false,
            message: "Google Search Console authentication required. Please reconnect your account.",
          };
        }

        if (response.status === 404) {
          return {
            connected: false,
            message: "Google Search Console integration not configured yet.",
          };
        }

        const errorData = await response.json().catch(() => ({}));
        return {
          connected: false,
          message: errorData.message || `Failed to fetch Google Search Console data (${response.status})`,
        };
      }

      const result = await response.json();
      return result.success ? {
        connected: result.connected,
        metrics: result.data?.metrics,
        message: result.message
      } : {
        connected: false,
        message: result.message || "Failed to fetch Google Search Console data",
      };
    } catch (error) {
      console.error("Error fetching Google Search Console data:", error);
      return {
        connected: false,
        message: "Failed to fetch Google Search Console data",
      };
    }
  }

  public async getIndexingStatus(siteUrl?: string, inspectionUrl?: string): Promise<SearchConsoleData> {
    try {
      const params = new URLSearchParams();
      if (siteUrl) params.append('siteUrl', siteUrl);
      if (inspectionUrl) params.append('inspectionUrl', inspectionUrl);

      const response = await fetch(`${this.baseUrl}/getIndexingStatus?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return {
          connected: false,
          message: "Failed to fetch Google Search Console indexing status"
        };
      }

      const result = await response.json();
      return result.success ? {
        connected: result.connected,
        indexing: result.data?.indexing,
        message: result.message
      } : {
        connected: false,
        message: result.message || "Failed to fetch Google Search Console indexing status",
      };
    } catch (error) {
      console.error("Error fetching Google Search Console indexing:", error);
      return {
        connected: false,
        message: "Failed to fetch Google Search Console indexing status",
      };
    }
  }

  public async syncData(siteUrl?: string, startDate?: string, endDate?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          siteUrl,
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
      console.error('Error syncing Google Search Console data:', error);
      return { success: false, message: `Failed to sync Google Search Console data` };
    }
  }

  // Backward compatibility methods for existing dashboard
  public async getSearchConsoleData(): Promise<SearchConsoleMetrics> {
    const data = await this.getSearchPerformance();
    return data.metrics || {
      totalClicks: 0,
      totalImpressions: 0,
      averageCtr: 0,
      averagePosition: 0,
      topQueries: [],
    };
  }
}

// Standalone function for backward compatibility
export const fetchGoogleSearchConsoleData = async (userId: string): Promise<SearchConsoleData> => {
  const service = new GoogleSearchConsoleClientService(userId);
  return service.getSearchPerformance();
}