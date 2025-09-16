import { signIn } from "next-auth/react"

export interface GoogleAdsCampaign {
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

export interface GoogleAdsData {
  connected: boolean
  campaigns?: GoogleAdsCampaign[]
  summary?: {
    totalImpressions: number
    totalClicks: number
    totalSpend: number
    averageCtr: number
    averageCpc: number
    totalConversions: number
    averageConversionRate: number
  }
  performanceData?: Array<{
    date: string
    impressions: number
    clicks: number
    spend: number
  }>
  message?: string
}

export class GoogleAdsService {
  private userId: string;
  private baseUrl: string;

  constructor(userId: string) {
    this.userId = userId;
    this.baseUrl = '/api/google-ads';
  }

  private async getAuthToken(): Promise<string> {
    // Get Firebase Auth token or NextAuth session token
    if (typeof window !== 'undefined') {
      // Client-side: get from Firebase Auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
      }
    }
    
    // Server-side: get from NextAuth session
    const { getToken } = await import('next-auth/jwt');
    const token = await getToken({ req: {} as any });
    return token?.accessToken as string || '';
  }

  public async fetchGoogleAdsData(): Promise<GoogleAdsData> {
    try {
      // The API route uses NextAuth session, not Authorization header
      const response = await fetch(`${this.baseUrl}/fetchCampaigns`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies for NextAuth session
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Handle rate limit exceeded
          const errorData = await response.json().catch(() => ({}));
          return {
            connected: true,
            campaigns: [],
            message: errorData.message || "Daily credit limit exceeded",
          };
        }
        
        if (response.status === 401) {
          // Handle authentication error gracefully
          return {
            connected: false,
            message: "Google Ads authentication required. Please reconnect your account.",
          };
        }

        if (response.status === 404) {
          // Handle missing API endpoint gracefully
          return {
            connected: false,
            message: "Google Ads integration not configured yet.",
          };
        }

        // For other errors, return graceful fallback instead of throwing
        const errorData = await response.json().catch(() => ({}));
        return {
          connected: false,
          message: errorData.message || `Failed to fetch Google Ads data (${response.status})`,
        };
      }

      const result = await response.json();
      return result.success ? result.data : {
        connected: false,
        message: result.message || "Failed to fetch Google Ads data",
      };
    } catch (error) {
      console.error("Error fetching Google Ads data:", error);
      return {
        connected: false,
        message: "Failed to fetch Google Ads data",
      };
    }
  }

  public async pauseCampaign(campaignId: string, customerId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/pauseCampaign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ campaignId, customerId }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          return { success: false, message: data.message || "Daily credit limit exceeded" };
        }
        if (response.status === 403) {
          return { success: false, message: data.message || "Pro plan required for campaign actions" };
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error(`Error pausing campaign ${campaignId}:`, error);
      return { success: false, message: `Failed to pause campaign ${campaignId}` };
    }
  }

  public async enableCampaign(campaignId: string, customerId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/enableCampaign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ campaignId, customerId }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          return { success: false, message: data.message || "Daily credit limit exceeded" };
        }
        if (response.status === 403) {
          return { success: false, message: data.message || "Pro plan required for campaign actions" };
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error(`Error enabling campaign ${campaignId}:`, error);
      return { success: false, message: `Failed to enable campaign ${campaignId}` };
    }
  }

  public async fetchPerformanceMetrics(
    startDate?: string, 
    endDate?: string, 
    customerId?: string
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/fetchPerformanceMetrics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ 
          startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: endDate || new Date().toISOString().split('T')[0],
          customerId 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          return { success: false, message: data.message || "Daily credit limit exceeded" };
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return { success: data.success, data: data.data, message: data.message };
    } catch (error) {
      console.error(`Error fetching performance metrics:`, error);
      return { success: false, message: `Failed to fetch performance metrics` };
    }
  }
}

export const connectGoogleAds = async () => {
  try {
    // Use NextAuth to sign in with Google and request Google Ads scope
    await signIn("google", {
      callbackUrl: "/dashboard",
      redirect: true,
    })
  } catch (error) {
    console.error("Error connecting Google Ads:", error)
    throw new Error("Failed to connect Google Ads account")
  }
}

// Standalone function for backward compatibility with existing imports
export const fetchGoogleAdsData = async (userId: string): Promise<GoogleAdsData> => {
  const service = new GoogleAdsService(userId);
  return service.fetchGoogleAdsData();
}