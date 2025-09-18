import { supabase } from '@/lib/supabase/client';
import { tenantService, TenantContext } from './tenant-service';

/**
 * Base class for all tenant-aware services
 */
export abstract class TenantAwareService {
  protected getTenantContext(): TenantContext {
    const context = tenantService.getCurrentTenant();
    if (!context) {
      throw new Error('No tenant context available. Call tenantService.setTenantContext() first.');
    }
    return context;
  }

  protected createTenantQuery(baseQuery: any) {
    const context = this.getTenantContext();
    return baseQuery.eq('organization_id', context.organizationId);
  }

  protected requireRole(role: 'viewer' | 'member' | 'manager' | 'admin' | 'owner'): void {
    if (!tenantService.requireRole(role)) {
      throw new Error(`Insufficient permissions. Required role: ${role}`);
    }
  }

  protected requirePermission(permission: string): void {
    if (!tenantService.hasPermission(permission)) {
      throw new Error(`Insufficient permissions. Required permission: ${permission}`);
    }
  }
}

/**
 * Tenant-aware campaign metrics service
 */
export class TenantCampaignService extends TenantAwareService {
  async storeCampaignMetrics(metrics: any[]): Promise<any[]> {
    const context = this.getTenantContext();

    const metricsWithTenant = metrics.map(metric => ({
      ...metric,
      organization_id: context.organizationId,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('campaign_metrics')
      .upsert(metricsWithTenant, {
        onConflict: 'organization_id,user_id,campaign_id,platform,account_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) throw error;
    return data || [];
  }

  async getCampaignMetrics(platform?: string): Promise<any[]> {
    this.requireRole('viewer');

    let query = this.createTenantQuery(
      supabase.from('campaign_metrics').select('*')
    );

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getCampaignAnalytics(dateRange: { start: string; end: string }) {
    this.requireRole('viewer');

    const { data, error } = await this.createTenantQuery(
      supabase.from('campaign_metrics').select('*')
    )
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    if (error) throw error;

    // Aggregate data
    const analytics = (data || []).reduce((acc, metric) => {
      const platform = metric.platform;
      if (!acc[platform]) {
        acc[platform] = {
          total_spend: 0,
          total_revenue: 0,
          total_impressions: 0,
          total_clicks: 0,
          total_conversions: 0,
          campaigns: 0,
        };
      }

      acc[platform].total_spend += metric.spend || 0;
      acc[platform].total_revenue += metric.revenue || 0;
      acc[platform].total_impressions += metric.impressions || 0;
      acc[platform].total_clicks += metric.clicks || 0;
      acc[platform].total_conversions += metric.conversions || 0;
      acc[platform].campaigns += 1;

      return acc;
    }, {} as Record<string, any>);

    return analytics;
  }
}

/**
 * Tenant-aware integration service
 */
export class TenantIntegrationService extends TenantAwareService {
  async storeIntegration(integration: any): Promise<any> {
    this.requireRole('admin');
    const context = this.getTenantContext();

    const { data, error } = await supabase
      .from('organization_integrations')
      .upsert({
        ...integration,
        organization_id: context.organizationId,
        created_by: context.userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,platform,provider,name',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getIntegrations(platform?: string): Promise<any[]> {
    this.requireRole('viewer');

    let query = this.createTenantQuery(
      supabase.from('organization_integrations').select('*')
    );

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async updateIntegrationStatus(integrationId: string, status: string): Promise<boolean> {
    this.requireRole('admin');

    const { error } = await this.createTenantQuery(
      supabase.from('organization_integrations')
    )
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId);

    if (error) throw error;
    return true;
  }

  async deleteIntegration(integrationId: string): Promise<boolean> {
    this.requireRole('admin');

    const { error } = await this.createTenantQuery(
      supabase.from('organization_integrations')
    )
      .delete()
      .eq('id', integrationId);

    if (error) throw error;
    return true;
  }
}

/**
 * Tenant-aware knowledge base service
 */
export class TenantKnowledgeService extends TenantAwareService {
  async createKnowledgeBase(kb: {
    name: string;
    description?: string;
    type: string;
    settings?: Record<string, any>;
  }): Promise<any> {
    this.requireRole('manager');
    const context = this.getTenantContext();

    const { data, error } = await supabase
      .from('organization_knowledge_bases')
      .insert({
        ...kb,
        organization_id: context.organizationId,
        created_by: context.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getKnowledgeBases(): Promise<any[]> {
    this.requireRole('viewer');

    const { data, error } = await this.createTenantQuery(
      supabase.from('organization_knowledge_bases').select('*')
    )
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateKnowledgeBase(kbId: string, updates: any): Promise<any> {
    this.requireRole('manager');

    const { data, error } = await this.createTenantQuery(
      supabase.from('organization_knowledge_bases')
    )
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', kbId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteKnowledgeBase(kbId: string): Promise<boolean> {
    this.requireRole('admin');

    const { error } = await this.createTenantQuery(
      supabase.from('organization_knowledge_bases')
    )
      .update({ status: 'archived' })
      .eq('id', kbId);

    if (error) throw error;
    return true;
  }
}

/**
 * Tenant-aware agent service
 */
export class TenantAgentService extends TenantAwareService {
  async createAgent(agent: {
    name: string;
    description?: string;
    type: string;
    configuration: Record<string, any>;
    knowledge_base_ids?: string[];
    model_settings?: Record<string, any>;
  }): Promise<any> {
    this.requireRole('manager');
    const context = this.getTenantContext();

    const { data, error } = await supabase
      .from('organization_agents')
      .insert({
        ...agent,
        organization_id: context.organizationId,
        created_by: context.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAgents(): Promise<any[]> {
    this.requireRole('viewer');

    const { data, error } = await this.createTenantQuery(
      supabase.from('organization_agents').select('*')
    )
      .in('status', ['active', 'training'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateAgent(agentId: string, updates: any): Promise<any> {
    this.requireRole('manager');

    const { data, error } = await this.createTenantQuery(
      supabase.from('organization_agents')
    )
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    this.requireRole('admin');

    const { error } = await this.createTenantQuery(
      supabase.from('organization_agents')
    )
      .update({ status: 'inactive' })
      .eq('id', agentId);

    if (error) throw error;
    return true;
  }
}

/**
 * Tenant-aware template service
 */
export class TenantTemplateService extends TenantAwareService {
  async createTemplate(template: {
    name: string;
    category?: string;
    template_type: string;
    content: Record<string, any>;
    variables?: Record<string, any>;
  }): Promise<any> {
    this.requireRole('member');
    const context = this.getTenantContext();

    const { data, error } = await supabase
      .from('organization_templates')
      .insert({
        ...template,
        organization_id: context.organizationId,
        created_by: context.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTemplates(category?: string, type?: string): Promise<any[]> {
    this.requireRole('viewer');

    let query = this.createTenantQuery(
      supabase.from('organization_templates').select('*')
    );

    if (category) {
      query = query.eq('category', category);
    }

    if (type) {
      query = query.eq('template_type', type);
    }

    const { data, error } = await query.order('usage_count', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async useTemplate(templateId: string): Promise<any> {
    this.requireRole('viewer');

    // Increment usage count
    const { error } = await this.createTenantQuery(
      supabase.from('organization_templates')
    )
      .update({
        usage_count: supabase.raw('usage_count + 1'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId);

    if (error) throw error;

    // Get the template
    const { data, error: fetchError } = await this.createTenantQuery(
      supabase.from('organization_templates').select('*')
    ).eq('id', templateId).single();

    if (fetchError) throw fetchError;
    return data;
  }
}

/**
 * Tenant-aware user activity service
 */
export class TenantActivityService extends TenantAwareService {
  async trackActivity(
    activityType: string,
    details: any,
    platform?: string
  ): Promise<void> {
    const context = this.getTenantContext();

    const { error } = await supabase
      .from('user_activities')
      .insert({
        user_id: context.userId,
        organization_id: context.organizationId,
        action: activityType,
        resource: platform,
        details,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to track activity:', error);
      // Don't throw error for activity tracking failures
    }
  }

  async getActivities(limit: number = 50): Promise<any[]> {
    this.requireRole('viewer');

    const { data, error } = await this.createTenantQuery(
      supabase.from('user_activities').select('*')
    )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getOrganizationActivities(limit: number = 100): Promise<any[]> {
    this.requireRole('manager');

    const { data, error } = await this.createTenantQuery(
      supabase.from('user_activities').select('*')
    )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

// Export service instances
export const tenantCampaignService = new TenantCampaignService();
export const tenantIntegrationService = new TenantIntegrationService();
export const tenantKnowledgeService = new TenantKnowledgeService();
export const tenantAgentService = new TenantAgentService();
export const tenantTemplateService = new TenantTemplateService();
export const tenantActivityService = new TenantActivityService();