import { supabase } from './client';
import { Database } from '@/types/supabase';

export interface CampaignMetric {
  id: string;
  user_id: string;
  campaign_id: string;
  campaign_name: string;
  platform: string;
  account_id?: string;
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  date_range?: string;
  raw_data?: any;
  sync_status: string;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  session_id?: string;
  activity_type: string;
  page_path?: string;
  platform?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface OAuthToken {
  id: string;
  user_id: string;
  platform: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scope?: string;
  account_info?: any;
  created_at: string;
  updated_at: string;
}

export interface MayaConversation {
  id: string;
  user_id: string;
  conversation_id: string;
  message_type: 'user' | 'assistant';
  content: string;
  context_data?: any;
  backend_processed: boolean;
  tokens_used?: number;
  model_used?: string;
  created_at: string;
}

export interface UserWorkflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  workflow_type: string;
  platforms: string[];
  trigger_conditions: any;
  actions: any;
  status: 'active' | 'inactive' | 'paused';
  backend_job_config?: any;
  execution_count: number;
  last_executed_at?: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseMultiUserService {
  private static instance: SupabaseMultiUserService;

  public static getInstance(): SupabaseMultiUserService {
    if (!SupabaseMultiUserService.instance) {
      SupabaseMultiUserService.instance = new SupabaseMultiUserService();
    }
    return SupabaseMultiUserService.instance;
  }

  async getCurrentUser(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // OAuth Token Management
  async storeTokens(firebaseUid: string, platform: string, tokens: any): Promise<OAuthToken> {
    try {
      // Set user context for RLS policies
      await supabase.rpc('set_current_user_id', { user_id: firebaseUid });

      const { data, error } = await supabase
        .from('oauth_tokens')
        .upsert([
          {
            user_id: firebaseUid,
            platform,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expires_at ? new Date(tokens.expires_at).toISOString() : null,
            scope: tokens.scope,
            account_info: tokens.account_info,
            updated_at: new Date().toISOString()
          }
        ], {
          onConflict: 'user_id,platform',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;
      console.log(`OAuth tokens stored successfully for user: ${firebaseUid}, platform: ${platform}`);
      return data;
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  }

  async getTokens(platform?: string, explicitUserId?: string): Promise<OAuthToken[]> {
    try {
      let firebaseUid = explicitUserId;
      if (!firebaseUid) {
        firebaseUid = await this.getCurrentUser();
        if (!firebaseUid) throw new Error('No authenticated user');
      }

      // Set RLS context for the user before making database calls
      const { error: contextError } = await supabase.rpc('set_current_user_id', {
        user_id: firebaseUid
      });
      
      if (contextError) {
        console.warn('Failed to set user context for getTokens:', contextError);
      }

      let query = supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', firebaseUid);

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get tokens:', error);
      throw error;
    }
  }

  // Campaign Metrics Management
  async storeCampaignMetrics(metrics: Omit<CampaignMetric, 'id' | 'created_at' | 'updated_at'>[]): Promise<CampaignMetric[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_metrics')
        .upsert(
          metrics.map(metric => ({
            ...metric,
            updated_at: new Date().toISOString()
          })),
          {
            onConflict: 'user_id,campaign_id,platform,account_id',
            ignoreDuplicates: false
          }
        )
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to store campaign metrics:', error);
      throw error;
    }
  }

  async getCampaignMetrics(platform?: string): Promise<CampaignMetric[]> {
    try {
      const firebaseUid = await this.getCurrentUser();
      if (!firebaseUid) return [];

      let query = supabase
        .from('campaign_metrics')
        .select('*')
        .eq('user_id', firebaseUid);

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get campaign metrics:', error);
      return [];
    }
  }

  // User Activity Tracking
  async trackActivity(activityType: string, details: any, platform?: string, explicitUserId?: string): Promise<void> {
    try {
      // Try to get Firebase UID from explicit parameter, details, or getCurrentUser (in that order)
      let firebaseUid = explicitUserId || details?.user_id;
      if (!firebaseUid) {
        firebaseUid = await this.getCurrentUser();
      }
      
      if (!firebaseUid) {
        console.warn('No Firebase UID available for activity tracking, skipping...');
        return;
      }

      // Set user context for RLS policies
      await supabase.rpc('set_current_user_id', { user_id: firebaseUid });

      const { error } = await supabase
        .from('user_activities')
        .insert([
          {
            user_id: firebaseUid,
            action: activityType, // Note: user_activities table uses 'action' field, not 'activity_type'
            resource: platform,
            details,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      console.log(`Activity tracked: ${activityType} for user: ${firebaseUid}`);
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }

  async getUserActivities(limit: number = 50): Promise<UserActivity[]> {
    try {
      const firebaseUid = await this.getCurrentUser();
      if (!firebaseUid) return [];

      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', firebaseUid)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user activities:', error);
      return [];
    }
  }

  // Maya Conversations
  async storeMayaConversation(conversationId: string, messageType: 'user' | 'assistant', content: string, contextData?: any): Promise<MayaConversation> {
    try {
      const firebaseUid = await this.getCurrentUser();
      if (!firebaseUid) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('maya_conversations')
        .insert([
          {
            user_id: firebaseUid,
            conversation_id: conversationId,
            message_type: messageType,
            content,
            context_data: contextData,
            backend_processed: false,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to store Maya conversation:', error);
      throw error;
    }
  }

  async getMayaConversations(conversationId?: string): Promise<MayaConversation[]> {
    try {
      const firebaseUid = await this.getCurrentUser();
      if (!firebaseUid) return [];

      let query = supabase
        .from('maya_conversations')
        .select('*')
        .eq('user_id', firebaseUid);

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get Maya conversations:', error);
      return [];
    }
  }

  // User Workflows
  async createWorkflow(workflow: Omit<UserWorkflow, 'id' | 'user_id' | 'execution_count' | 'created_at' | 'updated_at'>): Promise<UserWorkflow> {
    try {
      const firebaseUid = await this.getCurrentUser();
      if (!firebaseUid) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_workflows')
        .insert([
          {
            ...workflow,
            user_id: firebaseUid,
            execution_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create workflow:', error);
      throw error;
    }
  }

  async getUserWorkflows(): Promise<UserWorkflow[]> {
    try {
      const firebaseUid = await this.getCurrentUser();
      if (!firebaseUid) return [];

      const { data, error } = await supabase
        .from('user_workflows')
        .select('*')
        .eq('user_id', firebaseUid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user workflows:', error);
      return [];
    }
  }

  // User Integrations
  async getUserIntegrations(explicitUserId?: string): Promise<any[]> {
    try {
      let firebaseUid = explicitUserId;
      if (!firebaseUid) {
        firebaseUid = await this.getCurrentUser();
        if (!firebaseUid) return [];
      }

      // Set RLS context for the user before making database calls
      const { error: contextError } = await supabase.rpc('set_current_user_id', {
        user_id: firebaseUid
      });
      
      if (contextError) {
        console.warn('Failed to set user context for integrations query:', contextError);
      }

      const { data, error } = await supabase
        .from('messaging_integrations')
        .select('id, user_id, platform, provider, name, config, status, created_at, updated_at')
        .eq('user_id', firebaseUid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user integrations:', error);
      return [];
    }
  }

  // Real-time subscriptions
  subscribeToUserActivities(callback: (activity: UserActivity) => void) {
    const firebaseUid = this.getCurrentUser();
    if (!firebaseUid) return null;

    return supabase
      .channel('user_activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activities',
          filter: `user_id=eq.${firebaseUid}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToCampaignMetrics(callback: (metrics: CampaignMetric) => void) {
    const firebaseUid = this.getCurrentUser();
    if (!firebaseUid) return null;

    return supabase
      .channel('campaign_metrics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_metrics',
          filter: `user_id=eq.${firebaseUid}`
        },
        callback
      )
      .subscribe();
  }

  // Get current user's Supabase JWT token for backend authentication
  async getSupabaseToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Failed to get Supabase token:', error);
      return null;
    }
  }
}

export const supabaseMultiUserService = SupabaseMultiUserService.getInstance();