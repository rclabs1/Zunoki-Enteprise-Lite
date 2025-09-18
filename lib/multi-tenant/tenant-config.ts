import { tenantService } from './tenant-service';

/**
 * Enterprise tenant configuration types
 */
export interface TenantConfig {
  // Organization branding
  branding: {
    name: string;
    logo_url?: string;
    primary_color: string;
    secondary_color?: string;
    favicon_url?: string;
    custom_css?: string;
  };

  // Feature flags and limits
  features: {
    // AI/Maya features
    maya_enabled: boolean;
    max_maya_conversations_per_month: number;
    custom_ai_models: boolean;
    advanced_analytics: boolean;

    // Integration features
    unlimited_integrations: boolean;
    max_integrations: number;
    custom_integrations: boolean;

    // User management
    sso_enabled: boolean;
    ldap_enabled: boolean;
    max_users: number;
    role_based_permissions: boolean;

    // Data features
    data_export: boolean;
    api_access: boolean;
    webhook_endpoints: boolean;
    advanced_reporting: boolean;

    // Enterprise features
    white_label: boolean;
    custom_domain: boolean;
    priority_support: boolean;
    dedicated_infrastructure: boolean;
  };

  // API and integration limits
  limits: {
    api_calls_per_month: number;
    storage_gb: number;
    bandwidth_gb_per_month: number;
    webhook_calls_per_month: number;
    concurrent_connections: number;
  };

  // Security settings
  security: {
    enforce_2fa: boolean;
    session_timeout_minutes: number;
    ip_whitelist: string[];
    allowed_domains: string[];
    password_policy: {
      min_length: number;
      require_uppercase: boolean;
      require_lowercase: boolean;
      require_numbers: boolean;
      require_symbols: boolean;
      expiry_days?: number;
    };
  };

  // Notification settings
  notifications: {
    email_enabled: boolean;
    slack_enabled: boolean;
    webhook_enabled: boolean;
    alert_thresholds: {
      api_usage_percent: number;
      storage_usage_percent: number;
      error_rate_percent: number;
    };
  };

  // Compliance and data governance
  compliance: {
    data_retention_days: number;
    gdpr_enabled: boolean;
    hipaa_enabled: boolean;
    soc2_enabled: boolean;
    audit_logging: boolean;
    data_encryption_at_rest: boolean;
    data_encryption_in_transit: boolean;
  };

  // Custom configuration
  custom_settings: Record<string, any>;
}

/**
 * Default enterprise configuration
 */
const DEFAULT_ENTERPRISE_CONFIG: TenantConfig = {
  branding: {
    name: 'Zunoki Enterprise',
    primary_color: '#10B981',
    secondary_color: '#059669',
  },
  features: {
    maya_enabled: true,
    max_maya_conversations_per_month: 10000,
    custom_ai_models: true,
    advanced_analytics: true,
    unlimited_integrations: true,
    max_integrations: 50,
    custom_integrations: true,
    sso_enabled: true,
    ldap_enabled: true,
    max_users: 100,
    role_based_permissions: true,
    data_export: true,
    api_access: true,
    webhook_endpoints: true,
    advanced_reporting: true,
    white_label: true,
    custom_domain: true,
    priority_support: true,
    dedicated_infrastructure: false,
  },
  limits: {
    api_calls_per_month: 1000000,
    storage_gb: 100,
    bandwidth_gb_per_month: 1000,
    webhook_calls_per_month: 100000,
    concurrent_connections: 100,
  },
  security: {
    enforce_2fa: false,
    session_timeout_minutes: 480, // 8 hours
    ip_whitelist: [],
    allowed_domains: [],
    password_policy: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: false,
      expiry_days: 90,
    },
  },
  notifications: {
    email_enabled: true,
    slack_enabled: false,
    webhook_enabled: false,
    alert_thresholds: {
      api_usage_percent: 80,
      storage_usage_percent: 85,
      error_rate_percent: 5,
    },
  },
  compliance: {
    data_retention_days: 2555, // 7 years
    gdpr_enabled: false,
    hipaa_enabled: false,
    soc2_enabled: false,
    audit_logging: true,
    data_encryption_at_rest: true,
    data_encryption_in_transit: true,
  },
  custom_settings: {},
};

/**
 * Plan-specific configuration overrides
 */
const PLAN_CONFIGS: Record<string, Partial<TenantConfig>> = {
  starter: {
    features: {
      maya_enabled: true,
      max_maya_conversations_per_month: 1000,
      custom_ai_models: false,
      advanced_analytics: false,
      unlimited_integrations: false,
      max_integrations: 5,
      custom_integrations: false,
      sso_enabled: false,
      ldap_enabled: false,
      max_users: 10,
      role_based_permissions: false,
      data_export: false,
      api_access: false,
      webhook_endpoints: false,
      advanced_reporting: false,
      white_label: false,
      custom_domain: false,
      priority_support: false,
      dedicated_infrastructure: false,
    },
    limits: {
      api_calls_per_month: 10000,
      storage_gb: 5,
      bandwidth_gb_per_month: 50,
      webhook_calls_per_month: 1000,
      concurrent_connections: 10,
    },
  },
  professional: {
    features: {
      maya_enabled: true,
      max_maya_conversations_per_month: 5000,
      custom_ai_models: false,
      advanced_analytics: true,
      unlimited_integrations: false,
      max_integrations: 20,
      custom_integrations: false,
      sso_enabled: true,
      ldap_enabled: false,
      max_users: 50,
      role_based_permissions: true,
      data_export: true,
      api_access: true,
      webhook_endpoints: true,
      advanced_reporting: true,
      white_label: false,
      custom_domain: false,
      priority_support: false,
      dedicated_infrastructure: false,
    },
    limits: {
      api_calls_per_month: 100000,
      storage_gb: 25,
      bandwidth_gb_per_month: 250,
      webhook_calls_per_month: 10000,
      concurrent_connections: 25,
    },
  },
  enterprise: {
    // Uses DEFAULT_ENTERPRISE_CONFIG
  },
  custom: {
    // Fully customizable - loaded from database
  },
};

/**
 * Tenant configuration service
 */
class TenantConfigService {
  private static instance: TenantConfigService;
  private configCache = new Map<string, TenantConfig>();

  static getInstance(): TenantConfigService {
    if (!TenantConfigService.instance) {
      TenantConfigService.instance = new TenantConfigService();
    }
    return TenantConfigService.instance;
  }

  /**
   * Get configuration for current tenant
   */
  async getConfig(): Promise<TenantConfig> {
    const tenant = tenantService.getCurrentTenant();
    if (!tenant) {
      throw new Error('No tenant context available');
    }

    return this.getConfigForOrganization(tenant.organizationId);
  }

  /**
   * Get configuration for specific organization
   */
  async getConfigForOrganization(organizationId: string): Promise<TenantConfig> {
    // Check cache first
    if (this.configCache.has(organizationId)) {
      return this.configCache.get(organizationId)!;
    }

    try {
      // Get organization details from database
      const { data: org, error } = await supabase
        .from('organizations')
        .select('plan_type, settings')
        .eq('id', organizationId)
        .single();

      if (error) throw error;

      // Build configuration
      const config = this.buildConfig(org.plan_type, org.settings || {});

      // Cache the config
      this.configCache.set(organizationId, config);

      return config;
    } catch (error) {
      console.error('Failed to get tenant config:', error);
      // Return default config as fallback
      return DEFAULT_ENTERPRISE_CONFIG;
    }
  }

  /**
   * Update tenant configuration
   */
  async updateConfig(updates: Partial<TenantConfig>): Promise<TenantConfig> {
    const tenant = tenantService.getCurrentTenant();
    if (!tenant) {
      throw new Error('No tenant context available');
    }

    if (!tenantService.requireRole('admin')) {
      throw new Error('Only admins can update tenant configuration');
    }

    try {
      // Get current config
      const currentConfig = await this.getConfig();

      // Merge updates
      const newConfig = this.deepMerge(currentConfig, updates);

      // Save to database
      const { error } = await supabase
        .from('organizations')
        .update({
          settings: newConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tenant.organizationId);

      if (error) throw error;

      // Update cache
      this.configCache.set(tenant.organizationId, newConfig);

      return newConfig;
    } catch (error) {
      console.error('Failed to update tenant config:', error);
      throw error;
    }
  }

  /**
   * Check if feature is enabled for current tenant
   */
  async isFeatureEnabled(feature: keyof TenantConfig['features']): Promise<boolean> {
    const config = await this.getConfig();
    return config.features[feature] as boolean;
  }

  /**
   * Check if tenant has reached a limit
   */
  async checkLimit(
    limitType: keyof TenantConfig['limits'],
    currentUsage: number
  ): Promise<{ exceeded: boolean; limit: number; usage: number; percent: number }> {
    const config = await this.getConfig();
    const limit = config.limits[limitType] as number;
    const percent = (currentUsage / limit) * 100;

    return {
      exceeded: currentUsage >= limit,
      limit,
      usage: currentUsage,
      percent,
    };
  }

  /**
   * Get branding configuration for UI
   */
  async getBranding(): Promise<TenantConfig['branding']> {
    const config = await this.getConfig();
    return config.branding;
  }

  /**
   * Get security configuration
   */
  async getSecurityConfig(): Promise<TenantConfig['security']> {
    const config = await this.getConfig();
    return config.security;
  }

  /**
   * Clear cache for organization
   */
  clearCache(organizationId?: string): void {
    if (organizationId) {
      this.configCache.delete(organizationId);
    } else {
      this.configCache.clear();
    }
  }

  /**
   * Build configuration from plan and custom settings
   */
  private buildConfig(planType: string, customSettings: any): TenantConfig {
    // Start with default enterprise config
    let config = { ...DEFAULT_ENTERPRISE_CONFIG };

    // Apply plan-specific overrides
    if (PLAN_CONFIGS[planType]) {
      config = this.deepMerge(config, PLAN_CONFIGS[planType]);
    }

    // Apply custom settings
    if (customSettings && Object.keys(customSettings).length > 0) {
      config = this.deepMerge(config, customSettings);
    }

    return config;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}

export const tenantConfigService = TenantConfigService.getInstance();
export { DEFAULT_ENTERPRISE_CONFIG, PLAN_CONFIGS };