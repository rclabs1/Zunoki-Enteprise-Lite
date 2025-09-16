export interface YouTubeVideo {
  id: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
  thumbnailUrl: string;
}

export interface YouTubeChannelMetrics {
  totalSubscribers: number;
  totalViews: number;
  totalVideos: number;
  averageViewDuration: number;
  engagementRate: number;
}

export interface YouTubeAnalyticsData {
  connected: boolean;
  videos?: YouTubeVideo[];
  channelMetrics?: YouTubeChannelMetrics;
  message?: string;
}

export class YouTubeClientService {
  private userId: string;
  private baseUrl: string;

  constructor(userId: string) {
    this.userId = userId;
    this.baseUrl = '/api/youtube-analytics-proxy';
  }

  public async fetchChannelPerformance(startDate?: string, endDate?: string, channelId?: string): Promise<YouTubeAnalyticsData> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (channelId) params.append('channelId', channelId);

      const response = await fetch(`${this.baseUrl}/channelPerformance?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            connected: false,
            message: "YouTube Analytics authentication required. Please reconnect your account.",
          };
        }

        if (response.status === 404) {
          return {
            connected: false,
            message: "YouTube Analytics integration not configured yet.",
          };
        }

        const errorData = await response.json().catch(() => ({}));
        return {
          connected: false,
          message: errorData.message || `Failed to fetch YouTube Analytics data (${response.status})`,
        };
      }

      const result = await response.json();
      return result.success ? {
        connected: result.connected,
        channelMetrics: result.performance,
        videos: [],
        message: result.message
      } : {
        connected: false,
        message: result.message || "Failed to fetch YouTube Analytics data",
      };
    } catch (error) {
      console.error("Error fetching YouTube Analytics data:", error);
      return {
        connected: false,
        message: "Failed to fetch YouTube Analytics data",
      };
    }
  }

  public async fetchVideoMetrics(videoId?: string, startDate?: string, endDate?: string, channelId?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (videoId) params.append('videoId', videoId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (channelId) params.append('channelId', channelId);

      const response = await fetch(`${this.baseUrl}/fetchVideoMetrics?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return { connected: false, message: "Failed to fetch video metrics" };
      }

      const result = await response.json();
      return result.success ? result.data : { connected: false };
    } catch (error) {
      console.error("Error fetching YouTube video metrics:", error);
      return { connected: false, message: "Failed to fetch video metrics" };
    }
  }

  public async listTopVideos(maxResults?: number, startDate?: string, endDate?: string, channelId?: string): Promise<YouTubeVideo[]> {
    try {
      const params = new URLSearchParams();
      if (maxResults) params.append('maxResults', maxResults.toString());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (channelId) params.append('channelId', channelId);

      const response = await fetch(`${this.baseUrl}/listTopVideos?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.success ? (result.data || []) : [];
    } catch (error) {
      console.error("Error fetching YouTube top videos:", error);
      return [];
    }
  }

  public async syncData(startDate?: string, endDate?: string, channelId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          channelId,
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
      console.error('Error syncing YouTube Analytics data:', error);
      return { success: false, message: `Failed to sync YouTube Analytics data` };
    }
  }

  // Backward compatibility methods for existing dashboard
  public async channelPerformance(): Promise<YouTubeChannelMetrics> {
    const data = await this.fetchChannelPerformance();
    return data.channelMetrics || {
      totalSubscribers: 0,
      totalViews: 0,
      totalVideos: 0,
      averageViewDuration: 0,
      engagementRate: 0,
    };
  }
}

// Standalone function for backward compatibility
export const fetchYouTubeAnalyticsData = async (userId: string): Promise<YouTubeAnalyticsData> => {
  const service = new YouTubeClientService(userId);
  return service.fetchChannelPerformance();
}