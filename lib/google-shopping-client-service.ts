export interface GoogleShoppingProduct {
  id: string;
  title: string;
  price: string;
  availability: string;
  condition: string;
  brand?: string;
  gtin?: string;
  mpn?: string;
}

export interface GoogleShoppingMetrics {
  totalProducts: number;
  activeProducts: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
}

export interface GoogleShoppingData {
  connected: boolean;
  products?: GoogleShoppingProduct[];
  metrics?: GoogleShoppingMetrics;
  message?: string;
}

export class GoogleShoppingClientService {
  private userId: string;
  private baseUrl: string;

  constructor(userId: string) {
    this.userId = userId;
    this.baseUrl = '/api/google-shopping-proxy';
  }

  public async fetchProducts(merchantId?: string, maxResults?: number): Promise<GoogleShoppingData> {
    try {
      const params = new URLSearchParams();
      if (merchantId) params.append('merchantId', merchantId);
      if (maxResults) params.append('maxResults', maxResults.toString());

      const response = await fetch(`${this.baseUrl}/fetchProducts?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            connected: false,
            message: "Google Shopping authentication required. Please reconnect your account.",
          };
        }

        if (response.status === 404) {
          return {
            connected: false,
            message: "Google Shopping integration not configured yet.",
          };
        }

        const errorData = await response.json().catch(() => ({}));
        return {
          connected: false,
          message: errorData.message || `Failed to fetch Google Shopping data (${response.status})`,
        };
      }

      const result = await response.json();
      return result.success ? {
        connected: result.connected,
        products: result.data?.products,
        message: result.message
      } : {
        connected: false,
        message: result.message || "Failed to fetch Google Shopping data",
      };
    } catch (error) {
      console.error("Error fetching Google Shopping data:", error);
      return {
        connected: false,
        message: "Failed to fetch Google Shopping data",
      };
    }
  }

  public async getPerformanceMetrics(merchantId?: string, startDate?: string, endDate?: string): Promise<GoogleShoppingData> {
    try {
      const params = new URLSearchParams();
      if (merchantId) params.append('merchantId', merchantId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${this.baseUrl}/getPerformanceMetrics?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return {
          connected: false,
          message: "Failed to fetch Google Shopping performance metrics"
        };
      }

      const result = await response.json();
      return result.success ? {
        connected: result.connected,
        metrics: result.data?.metrics,
        message: result.message
      } : {
        connected: false,
        message: result.message || "Failed to fetch Google Shopping performance metrics",
      };
    } catch (error) {
      console.error("Error fetching Google Shopping performance:", error);
      return {
        connected: false,
        message: "Failed to fetch Google Shopping performance metrics",
      };
    }
  }

  public async syncData(merchantId?: string, startDate?: string, endDate?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          merchantId,
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
      console.error('Error syncing Google Shopping data:', error);
      return { success: false, message: `Failed to sync Google Shopping data` };
    }
  }

  // Backward compatibility methods for existing dashboard
  public async getShoppingData(): Promise<GoogleShoppingMetrics> {
    const data = await this.getPerformanceMetrics();
    return data.metrics || {
      totalProducts: 0,
      activeProducts: 0,
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      conversionRate: 0,
    };
  }
}

// Standalone function for backward compatibility
export const fetchGoogleShoppingData = async (userId: string): Promise<GoogleShoppingData> => {
  const service = new GoogleShoppingClientService(userId);
  return service.fetchProducts();
}