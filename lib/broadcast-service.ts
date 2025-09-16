import { apiGet, apiPost, apiPut } from '@/lib/api-client';

export interface BroadcastCampaign {
  campaignName: string;
  platforms: string[];
  audienceSegments: string[];
  message: {
    content: string;
    messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
    mediaUrl?: string;
  };
  personalizeMessage?: boolean;
  scheduledFor?: string;
  sendImmediately?: boolean;
}

export interface BroadcastJob {
  id: string;
  campaignName: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  platforms: string[];
  totalRecipients: number;
  processedRecipients: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface BroadcastResponse {
  success: boolean;
  jobId?: string;
  message?: string;
  estimatedRecipients?: number;
  platforms?: number;
  error?: string;
}

export interface BroadcastJobResponse {
  success: boolean;
  job?: BroadcastJob;
  jobs?: BroadcastJob[];
  error?: string;
}

class BroadcastService {
  /**
   * Create and send a broadcast campaign
   */
  async createBroadcast(campaign: BroadcastCampaign): Promise<BroadcastResponse> {
    try {
      const response = await apiPost('/api/messaging/broadcast', campaign);
      return response;
    } catch (error: any) {
      console.error('Error creating broadcast:', error);
      return {
        success: false,
        error: error.message || 'Failed to create broadcast campaign'
      };
    }
  }

  /**
   * Get status of a specific broadcast job
   */
  async getBroadcastJob(jobId: string): Promise<BroadcastJobResponse> {
    try {
      const response = await apiGet(`/api/messaging/broadcast?jobId=${jobId}`);
      return response;
    } catch (error: any) {
      console.error('Error fetching broadcast job:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch broadcast job'
      };
    }
  }

  /**
   * Get all broadcast jobs for the current user
   */
  async getAllBroadcastJobs(): Promise<BroadcastJobResponse> {
    try {
      const response = await apiGet('/api/messaging/broadcast');
      return response;
    } catch (error: any) {
      console.error('Error fetching broadcast jobs:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch broadcast jobs'
      };
    }
  }

  /**
   * Update a broadcast job (pause, resume, cancel)
   */
  async updateBroadcastJob(jobId: string, action: 'pause' | 'resume' | 'cancel'): Promise<BroadcastJobResponse> {
    try {
      const response = await apiPut('/api/messaging/broadcast', { jobId, action });
      return response;
    } catch (error: any) {
      console.error('Error updating broadcast job:', error);
      return {
        success: false,
        error: error.message || 'Failed to update broadcast job'
      };
    }
  }

  /**
   * Get campaign analytics and performance metrics
   */
  async getCampaignAnalytics(jobId: string): Promise<{
    success: boolean;
    analytics?: {
      totalSent: number;
      deliveryRate: number;
      responseRate: number;
      openRate: number;
      platformBreakdown: Array<{
        platform: string;
        sent: number;
        delivered: number;
        responses: number;
      }>;
      timeSeriesData: Array<{
        timestamp: string;
        sent: number;
        delivered: number;
      }>;
    };
    error?: string;
  }> {
    try {
      // Get job details first
      const jobResponse = await this.getBroadcastJob(jobId);
      
      if (!jobResponse.success || !jobResponse.job) {
        return {
          success: false,
          error: 'Job not found'
        };
      }

      const job = jobResponse.job;
      
      // Calculate metrics (in production, this would come from actual tracking data)
      const deliveryRate = job.totalRecipients > 0 
        ? (job.successCount / job.totalRecipients) * 100 
        : 0;
      
      // Mock response rate and open rate (in production, track these separately)
      const responseRate = Math.random() * 20 + 5; // 5-25%
      const openRate = Math.random() * 30 + 60; // 60-90%

      // Mock platform breakdown
      const platformBreakdown = job.platforms.map(platform => ({
        platform,
        sent: Math.floor(job.successCount / job.platforms.length),
        delivered: Math.floor((job.successCount / job.platforms.length) * 0.95),
        responses: Math.floor((job.successCount / job.platforms.length) * (responseRate / 100))
      }));

      // Mock time series data
      const timeSeriesData = [];
      const startTime = job.startedAt ? new Date(job.startedAt) : new Date();
      const endTime = job.completedAt ? new Date(job.completedAt) : new Date();
      
      for (let i = 0; i <= 10; i++) {
        const timestamp = new Date(startTime.getTime() + (i / 10) * (endTime.getTime() - startTime.getTime()));
        const progress = i / 10;
        
        timeSeriesData.push({
          timestamp: timestamp.toISOString(),
          sent: Math.floor(job.successCount * progress),
          delivered: Math.floor(job.successCount * progress * 0.95)
        });
      }

      return {
        success: true,
        analytics: {
          totalSent: job.successCount,
          deliveryRate: Math.round(deliveryRate * 100) / 100,
          responseRate: Math.round(responseRate * 100) / 100,
          openRate: Math.round(openRate * 100) / 100,
          platformBreakdown,
          timeSeriesData
        }
      };

    } catch (error: any) {
      console.error('Error fetching campaign analytics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch campaign analytics'
      };
    }
  }

  /**
   * Get platform-specific delivery rates and costs
   */
  async getPlatformPerformance(): Promise<{
    success: boolean;
    platforms?: Array<{
      platform: string;
      icon: string;
      deliveryRate: number;
      avgResponseRate: number;
      costPerMessage: number;
      totalSent: number;
      status: 'connected' | 'disconnected' | 'error';
    }>;
    error?: string;
  }> {
    try {
      // In production, this would fetch real platform performance data
      const platforms = [
        {
          platform: 'WhatsApp',
          icon: '💚',
          deliveryRate: 96.5,
          avgResponseRate: 15.8,
          costPerMessage: 0.02,
          totalSent: 12450,
          status: 'connected' as const
        },
        {
          platform: 'SMS',
          icon: '💬',
          deliveryRate: 98.2,
          avgResponseRate: 8.3,
          costPerMessage: 0.05,
          totalSent: 8920,
          status: 'connected' as const
        },
        {
          platform: 'Telegram',
          icon: '✈️',
          deliveryRate: 94.1,
          avgResponseRate: 12.1,
          costPerMessage: 0.00,
          totalSent: 2890,
          status: 'connected' as const
        },
        {
          platform: 'Facebook',
          icon: '📘',
          deliveryRate: 78.5,
          avgResponseRate: 18.7,
          costPerMessage: 0.01,
          totalSent: 1567,
          status: 'connected' as const
        },
        {
          platform: 'Gmail',
          icon: '📧',
          deliveryRate: 92.3,
          avgResponseRate: 6.2,
          costPerMessage: 0.00,
          totalSent: 567,
          status: 'connected' as const
        }
      ];

      return {
        success: true,
        platforms
      };

    } catch (error: any) {
      console.error('Error fetching platform performance:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch platform performance'
      };
    }
  }

  /**
   * Get audience segments available for targeting
   */
  async getAudienceSegments(): Promise<{
    success: boolean;
    segments?: Array<{
      id: string;
      name: string;
      description: string;
      size: number;
      platforms: string[];
      lastUpdated: Date;
    }>;
    error?: string;
  }> {
    try {
      // Mock audience segments (in production, fetch from database)
      const segments = [
        {
          id: 'all-customers',
          name: 'All Customers',
          description: 'All active customers',
          size: 4200,
          platforms: ['whatsapp', 'telegram', 'twilio-sms', 'gmail'],
          lastUpdated: new Date('2024-01-15')
        },
        {
          id: 'premium-users',
          name: 'Premium Users',
          description: 'Users with premium subscription',
          size: 890,
          platforms: ['whatsapp', 'twilio-sms'],
          lastUpdated: new Date('2024-01-14')
        },
        {
          id: 'newsletter-subscribers',
          name: 'Newsletter Subscribers',
          description: 'Users subscribed to newsletter',
          size: 2100,
          platforms: ['telegram', 'gmail'],
          lastUpdated: new Date('2024-01-13')
        },
        {
          id: 'recent-signups',
          name: 'Recent Signups',
          description: 'Users who signed up in last 30 days',
          size: 450,
          platforms: ['whatsapp', 'twilio-sms'],
          lastUpdated: new Date('2024-01-12')
        },
        {
          id: 'high-engagement',
          name: 'High Engagement',
          description: 'Users with high interaction rates',
          size: 1200,
          platforms: ['whatsapp', 'telegram', 'facebook'],
          lastUpdated: new Date('2024-01-11')
        }
      ];

      return {
        success: true,
        segments
      };

    } catch (error: any) {
      console.error('Error fetching audience segments:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch audience segments'
      };
    }
  }

  /**
   * Validate a broadcast campaign before sending
   */
  async validateCampaign(campaign: BroadcastCampaign): Promise<{
    success: boolean;
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    estimatedReach?: number;
    estimatedCost?: number;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!campaign.campaignName?.trim()) {
      errors.push('Campaign name is required');
    }

    if (!campaign.platforms?.length) {
      errors.push('At least one platform must be selected');
    }

    if (!campaign.audienceSegments?.length) {
      errors.push('At least one audience segment must be selected');
    }

    if (!campaign.message?.content?.trim()) {
      errors.push('Message content is required');
    }

    // Message length validation
    if (campaign.message?.content?.length > 2000) {
      warnings.push('Message is longer than recommended (2000 characters)');
    }

    // Platform-specific validations
    if (campaign.platforms?.includes('twilio-sms') && campaign.message?.content?.length > 160) {
      warnings.push('SMS messages longer than 160 characters may be charged as multiple messages');
    }

    // Scheduling validation
    if (!campaign.sendImmediately && campaign.scheduledFor) {
      const scheduledTime = new Date(campaign.scheduledFor);
      if (scheduledTime <= new Date()) {
        errors.push('Scheduled time must be in the future');
      }
    }

    // Mock estimated reach and cost calculation
    const estimatedReach = Math.floor(Math.random() * 1000) + 500;
    const estimatedCost = estimatedReach * 0.02; // $0.02 per message average

    return {
      success: true,
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      estimatedReach,
      estimatedCost
    };
  }
}

export const broadcastService = new BroadcastService();
export default broadcastService;