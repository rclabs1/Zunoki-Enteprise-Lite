export interface GoogleMyBusinessReview {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: number;
  comment?: string;
  createTime: string;
  updateTime: string;
}

export interface GoogleMyBusinessMetrics {
  totalViews: number;
  searchViews: number;
  mapsViews: number;
  totalActions: number;
  phoneCallActions: number;
  directionActions: number;
  websiteActions: number;
  averageRating: number;
  totalReviews: number;
}

export interface GoogleMyBusinessData {
  connected: boolean;
  metrics?: GoogleMyBusinessMetrics;
  reviews?: GoogleMyBusinessReview[];
  message?: string;
}

export class GoogleMyBusinessClientService {
  private userId: string;
  private baseUrl: string;

  constructor(userId: string) {
    this.userId = userId;
    this.baseUrl = '/api/google-my-business-proxy';
  }

  public async getBusinessMetrics(accountId?: string, locationId?: string, startDate?: string, endDate?: string): Promise<GoogleMyBusinessData> {
    try {
      const params = new URLSearchParams();
      if (accountId) params.append('accountId', accountId);
      if (locationId) params.append('locationId', locationId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${this.baseUrl}/getBusinessMetrics?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            connected: false,
            message: "Google My Business authentication required. Please reconnect your account.",
          };
        }

        if (response.status === 404) {
          return {
            connected: false,
            message: "Google My Business integration not configured yet.",
          };
        }

        const errorData = await response.json().catch(() => ({}));
        return {
          connected: false,
          message: errorData.message || `Failed to fetch Google My Business data (${response.status})`,
        };
      }

      const result = await response.json();
      return result.success ? {
        connected: result.connected,
        metrics: result.data?.metrics,
        message: result.message
      } : {
        connected: false,
        message: result.message || "Failed to fetch Google My Business data",
      };
    } catch (error) {
      console.error("Error fetching Google My Business data:", error);
      return {
        connected: false,
        message: "Failed to fetch Google My Business data",
      };
    }
  }

  public async getReviews(accountId?: string, locationId?: string, pageSize?: number, orderBy?: string): Promise<GoogleMyBusinessData> {
    try {
      const params = new URLSearchParams();
      if (accountId) params.append('accountId', accountId);
      if (locationId) params.append('locationId', locationId);
      if (pageSize) params.append('pageSize', pageSize.toString());
      if (orderBy) params.append('orderBy', orderBy);

      const response = await fetch(`${this.baseUrl}/getReviews?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return {
          connected: false,
          message: "Failed to fetch Google My Business reviews"
        };
      }

      const result = await response.json();
      return result.success ? {
        connected: result.connected,
        reviews: result.data?.reviews,
        message: result.message
      } : {
        connected: false,
        message: result.message || "Failed to fetch Google My Business reviews",
      };
    } catch (error) {
      console.error("Error fetching Google My Business reviews:", error);
      return {
        connected: false,
        message: "Failed to fetch Google My Business reviews",
      };
    }
  }

  public async syncData(accountId?: string, locationId?: string, startDate?: string, endDate?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          accountId,
          locationId,
          startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: endDate || new Date().toISOString().split('T')[0],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Error syncing Google My Business data:', error);
      return { success: false, message: `Failed to sync Google My Business data` };
    }
  }

  // Backward compatibility methods for existing dashboard
  public async getMyBusinessData(): Promise<GoogleMyBusinessMetrics> {
    const data = await this.getBusinessMetrics();
    return data.metrics || {
      totalViews: 0,
      searchViews: 0,
      mapsViews: 0,
      totalActions: 0,
      phoneCallActions: 0,
      directionActions: 0,
      websiteActions: 0,
      averageRating: 0,
      totalReviews: 0,
    };
  }
}

// Standalone function for backward compatibility
export const fetchGoogleMyBusinessData = async (userId: string): Promise<GoogleMyBusinessData> => {
  const service = new GoogleMyBusinessClientService(userId);
  return service.getBusinessMetrics();
}