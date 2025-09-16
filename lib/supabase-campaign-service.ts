
import { getSupabaseAuthClient } from "./supabase/client";
import { supabaseServiceRole } from "./supabase/service-client";
import { auth } from "./firebase";

// Initialize Supabase client - use service role for server-side operations
export const supabase = supabaseServiceRole;

// Campaign Metrics Service
export const campaignService = {
  // Fetch all campaigns for current user
  async getCampaigns(userId: string) {
    const { data, error } = await supabase
      .from("campaign_metrics")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get campaign by ID
  async getCampaignById(userId: string, campaignId: string) {
    const { data, error } = await supabase
      .from("campaign_metrics")
      .select("*")
      .eq("user_id", userId)
      .eq("id", campaignId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update campaign metrics
  async updateCampaignMetrics(userId: string, campaignId: string, metrics: any) {
    const { data, error } = await supabase
      .from("campaign_metrics")
      .update({
        ...metrics,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", campaignId)
      .select();

    if (error) throw error;
    return data;
  },

  // Create new campaign (legacy method - updated to use correct table structure)
  async createCampaign(userId: string, campaignData: any) {
    try {
      const insertData = {
        user_id: userId,
        platform: campaignData.platform || 'unknown',
        metrics_data: campaignData,
        created_at: new Date().toISOString(),
      };

      console.log('Inserting campaign data:', {
        userId,
        platform: insertData.platform,
        dataKeys: campaignData ? Object.keys(campaignData) : 'no data'
      });

      const { data, error } = await supabase
        .from("campaign_metrics")
        .insert(insertData)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Supabase insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          insertData: {
            user_id: insertData.user_id,
            platform: insertData.platform,
            created_at: insertData.created_at,
            metrics_data_keys: Object.keys(insertData.metrics_data)
          }
        });
        // Don't throw - return null for graceful handling
        return null;
      }

      return data;
    } catch (error) {
      console.error('createCampaign error:', {
        error: error instanceof Error ? error.message : error,
        userId,
        campaignDataKeys: campaignData ? Object.keys(campaignData) : 'no data'
      });
      // Don't throw - return null for graceful handling
      return null;
    }
  },

  // Delete campaign
  async deleteCampaign(userId: string, campaignId: string) {
    const { error } = await supabase
      .from("campaign_metrics")
      .delete()
      .eq("user_id", userId)
      .eq("id", campaignId);

    if (error) throw error;
  },
};

// Automation Logs Service
export const automationService = {
  // Log automation action
  async logAction(userId: string, action: string, details: any, confirmedByUser = false) {
    const { data, error } = await supabase
      .from("automation_logs")
      .insert({
        user_id: userId,
        action,
        details,
        confirmed_by_user: confirmedByUser,
        timestamp: new Date().toISOString(),
      })
      .select();

    if (error) throw error;
    return data;
  },

  // Get automation history
  async getAutomationHistory(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from("automation_logs")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get pending actions (not confirmed by user)
  async getPendingActions(userId: string) {
    const { data, error } = await supabase
      .from("automation_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("confirmed_by_user", false)
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data;
  },
};

// Analytics Service
export const analyticsService = {
  // Get dashboard metrics
  async getDashboardMetrics(userId: string) {
    const { data, error } = await supabase
      .from("campaign_metrics")
      .select("platform, spend, revenue, impressions, clicks, conversions")
      .eq("user_id", userId);

    if (error) throw error;

    // Aggregate metrics across platforms
    const aggregated = data.reduce(
      (acc, campaign) => {
        acc.totalSpend += campaign.spend || 0;
        acc.totalRevenue += campaign.revenue || 0;
        acc.totalImpressions += campaign.impressions || 0;
        acc.totalClicks += campaign.clicks || 0;
        acc.totalConversions += campaign.conversions || 0;
        return acc;
      },
      {
        totalSpend: 0,
        totalRevenue: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
      },
    );

    return {
      ...aggregated,
      roas: aggregated.totalSpend > 0 ? aggregated.totalRevenue / aggregated.totalSpend : 0,
      ctr: aggregated.totalImpressions > 0 ? aggregated.totalClicks / aggregated.totalImpressions : 0,
      conversionRate: aggregated.totalClicks > 0 ? aggregated.totalConversions / aggregated.totalClicks : 0,
    };
  },

  // Get performance trends
  async getPerformanceTrends(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("campaign_metrics")
      .select("created_at, spend, revenue, clicks, impressions")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },
};

// Ad Inventory Service (for marketplace)
export const adInventoryService = {
  // Get available ad inventory
  async getInventory(userId: string, filters?: { category?: string; budget?: number }) {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("status", "active");

    if (error) throw error;
    return data;
  },

  // Get inventory by brand
  async getInventoryByBrand(brandId: string) {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .single();

    if (error) throw error;
    return data;
  },

  // Purchase ad inventory
  async purchaseInventory(userId: string, brandId: string, details: any) {
    const { data, error } = await supabase
      .from("user_purchases")
      .insert({
        user_id: userId,
        brand_id: brandId,
        purchase_details: details,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;
    return data;
  },

  // Log ad inventory purchase (marketplace functionality)
  async logAdInventoryPurchase(brand: any, userEmail: string) {
    const { data, error } = await supabase
      .from("ad_inventory_purchases")
      .insert({
        user_email: userEmail,
        brand_id: brand.id,
        brand_name: brand.name,
        brand_category: brand.category,
        cpm: brand.cpm,
        reach: brand.reach,
        impressions: brand.impressions,
        budget: brand.budget,
        purchase_timestamp: new Date().toISOString(),
        status: "pending"
      })
      .select();

    if (error) throw error;
    return data;
  },
};

export const tokenService = {
  async saveToken(userId: string, platform: string, tokenData: any) {
    const { data, error } = await supabase
      .from("user_tokens")
      .upsert({ user_id: userId, platform, token_data: tokenData }, { onConflict: ['user_id', 'platform'] })
      .select();
    if (error) throw error;
    return data;
  },

  async getToken(userId: string, platform: string) {
    const { data, error } = await supabase
      .from("user_tokens")
      .select("token_data")
      .eq("user_id", userId)
      .eq("platform", platform)
      .single();
    if (error) throw error;
    return data?.token_data;
  },
};

export class SupabaseService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async saveCampaignSnapshot(platform: string, campaignData: any) {
    try {
      // Validate input data
      if (!campaignData || typeof campaignData !== 'object') {
        console.log(`No valid campaign data provided for platform ${platform}, skipping cache`);
        return null;
      }

      console.log(`Saving campaign snapshot for ${platform}:`, {
        userId: this.userId,
        dataKeys: Object.keys(campaignData)
      });

      // Set user context for RLS - with better error handling
      try {
        const { error: rpcError } = await supabase.rpc('set_current_user_id', { user_id: this.userId });
        if (rpcError) {
          console.error('RPC set_current_user_id failed:', rpcError);
        }
      } catch (contextError) {
        console.error('Failed to set user context:', contextError);
        // Try alternative: use service role client directly
        console.log('Falling back to service role client...');
      }

      // Use the existing table structure - store complete data as JSON
      const insertData = {
        user_id: this.userId,
        platform: platform,
        metrics_data: campaignData,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("campaign_metrics")
        .insert(insertData)
        .select();

      if (error) {
        // Serialize error properties individually to avoid empty {} display
        console.warn('[SUPABASE] Campaign cache insert failed:', {
          code: error.code || 'unknown',
          message: error.message || 'no message',
          details: error.details || 'no details', 
          hint: error.hint || 'no hint'
        });
        console.warn('[SUPABASE] Error details:', {
          errorCode: error?.code,
          errorMessage: error?.message,
          errorDetails: error?.details,
          errorHint: error?.hint,
          errorName: error?.name
        });
        console.warn('[SUPABASE] Insert data was:', {
          userId: this.userId,
          userIdType: typeof this.userId,
          platform: platform,
          dataKeys: campaignData ? Object.keys(campaignData) : 'no data',
          insertData: {
            user_id: this.userId,
            platform,
            has_metrics_data: !!campaignData
          }
        });
        // Don't throw - return null so dashboard continues working
        return null;
      }

      console.log(`Successfully cached ${platform} campaign data`);
      return data;
    } catch (error) {
      console.warn(`[SUPABASE] saveCampaignSnapshot error for ${platform}:`, {
        error: error instanceof Error ? error.message : error,
        userId: this.userId,
        campaignDataKeys: campaignData ? Object.keys(campaignData) : 'null/undefined'
      });
      // Don't throw error - just log it and return null so dashboard continues working
      return null;
    }
  }

  async fetchHistoricalData(options?: { campaignId?: string; days?: number; type?: string; key?: string }) {
    if (options?.campaignId) {
      return campaignService.getCampaignById(this.userId, options.campaignId);
    } else if (options?.days) {
      return analyticsService.getPerformanceTrends(this.userId, options.days);
    } else if (options?.type === "preferences") {
      const { data, error } = await supabase
        .from("user_context")
        .select("preferences")
        .eq("user_id", this.userId)
        .single();
      if (error) throw error;
      return data?.preferences;
    } else {
      return campaignService.getCampaigns(this.userId);
    }
  }

  async pushAnalytics(analyticsData: any) {
    // This assumes analyticsData can be directly inserted or upserted into campaign_metrics
    // You might need to adjust this based on your actual analytics data structure
    const { data, error } = await supabase
      .from("campaign_metrics")
      .upsert({
        ...analyticsData,
        user_id: this.userId,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;
    return data;
  }

  async getUserContext() {
    const { data, error } = await supabase
      .from("user_context")
      .select("*")
      .eq("user_id", this.userId)
      .single();
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      throw error;
    }
    return data;
  }

  async saveUserContext(context: { campaign_history?: any; preferences?: any; last_action?: string }) {
    const { data, error } = await supabase
      .from("user_context")
      .upsert({
        user_id: this.userId,
        ...context,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select();
    if (error) throw error;
    return data;
  }

  async createApprovalRequest(actionToApprove: string, callbackId: string) {
    const { data, error } = await supabase
      .from("approval_requests")
      .insert({
        user_id: this.userId,
        action_to_approve: actionToApprove,
        callback_id: callbackId,
        status: 'pending',
      })
      .select();
    if (error) throw error;
    return data;
  }

  async getApprovalRequest(callbackId: string) {
    const { data, error } = await supabase
      .from("approval_requests")
      .select("*")
      .eq("callback_id", callbackId)
      .single();
    if (error) throw error;
    return data;
  }

  async updateApprovalRequestStatus(callbackId: string, status: 'approved' | 'denied') {
    const { data, error } = await supabase
      .from("approval_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("callback_id", callbackId)
      .select();
    if (error) throw error;
    return data;
  }
}
