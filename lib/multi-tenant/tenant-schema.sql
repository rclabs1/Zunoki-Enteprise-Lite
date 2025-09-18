-- Multi-Tenant Database Schema for Zunoki Enterprise
-- This schema provides true enterprise-grade multi-tenancy with complete data isolation

-- ===================================
-- TENANT MANAGEMENT TABLES
-- ===================================

-- Organizations/Tenants table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- for subdomain routing
  domain VARCHAR(255), -- for custom domain routing
  plan_type VARCHAR(50) DEFAULT 'enterprise' CHECK (plan_type IN ('starter', 'professional', 'enterprise', 'custom')),
  settings JSONB DEFAULT '{}',
  billing_info JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization users (many-to-many with roles)
CREATE TABLE IF NOT EXISTS organization_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- Firebase UID
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES organization_users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Organization invitations
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  invited_by UUID REFERENCES organization_users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- ===================================
-- TENANT-AWARE DATA TABLES
-- ===================================

-- Update existing tables to be tenant-aware
-- Add organization_id to all existing tables

-- Campaign metrics with tenant isolation
ALTER TABLE campaign_metrics
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- OAuth tokens with tenant isolation
ALTER TABLE oauth_tokens
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- User activities with tenant isolation
ALTER TABLE user_activities
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Maya conversations with tenant isolation
ALTER TABLE maya_conversations
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- User workflows with tenant isolation
ALTER TABLE user_workflows
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Messaging integrations with tenant isolation
ALTER TABLE messaging_integrations
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- User profiles with tenant awareness
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- ===================================
-- TENANT-SPECIFIC RESOURCE TABLES
-- ===================================

-- Organization-specific knowledge bases
CREATE TABLE IF NOT EXISTS organization_knowledge_bases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'support', 'sales', 'hr', 'custom')),
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_by UUID REFERENCES organization_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization-specific agent configurations
CREATE TABLE IF NOT EXISTS organization_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'support' CHECK (type IN ('support', 'sales', 'hr', 'custom')),
  configuration JSONB DEFAULT '{}',
  knowledge_base_ids UUID[] DEFAULT '{}',
  model_settings JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'training')),
  created_by UUID REFERENCES organization_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization-specific templates
CREATE TABLE IF NOT EXISTS organization_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  template_type VARCHAR(50) CHECK (template_type IN ('message', 'workflow', 'response', 'email')),
  content JSONB NOT NULL,
  variables JSONB DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES organization_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization-specific integrations and API keys
CREATE TABLE IF NOT EXISTS organization_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  config JSONB DEFAULT '{}', -- encrypted config
  credentials JSONB DEFAULT '{}', -- encrypted credentials
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'pending')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50),
  created_by UUID REFERENCES organization_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, platform, provider, name)
);

-- ===================================
-- ROW LEVEL SECURITY POLICIES
-- ===================================

-- Enable RLS on all tenant-aware tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_integrations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing tables
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE maya_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ===================================
-- RLS POLICIES FOR ORGANIZATION ACCESS
-- ===================================

-- Function to get current user's organization IDs
CREATE OR REPLACE FUNCTION get_user_organization_ids(firebase_uid TEXT)
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT organization_id
    FROM organization_users
    WHERE user_id = firebase_uid
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role in organization
CREATE OR REPLACE FUNCTION user_has_org_role(firebase_uid TEXT, org_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy TEXT[] := ARRAY['viewer', 'member', 'manager', 'admin', 'owner'];
  user_level INTEGER;
  required_level INTEGER;
BEGIN
  SELECT role INTO user_role
  FROM organization_users
  WHERE user_id = firebase_uid AND organization_id = org_id AND status = 'active';

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  user_level := array_position(role_hierarchy, user_role);
  required_level := array_position(role_hierarchy, required_role);

  RETURN user_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations: Users can only see organizations they belong to
CREATE POLICY organization_access ON organizations
  FOR ALL USING (
    id = ANY(get_user_organization_ids(current_setting('app.current_user_id')::TEXT))
  );

-- Organization users: Users can see other users in their organizations
CREATE POLICY organization_users_access ON organization_users
  FOR ALL USING (
    organization_id = ANY(get_user_organization_ids(current_setting('app.current_user_id')::TEXT))
  );

-- Campaign metrics: Users can only see data from their organizations
CREATE POLICY campaign_metrics_org_access ON campaign_metrics
  FOR ALL USING (
    organization_id = ANY(get_user_organization_ids(current_setting('app.current_user_id')::TEXT))
  );

-- OAuth tokens: Users can only see tokens from their organizations
CREATE POLICY oauth_tokens_org_access ON oauth_tokens
  FOR ALL USING (
    organization_id = ANY(get_user_organization_ids(current_setting('app.current_user_id')::TEXT))
  );

-- User activities: Users can only see activities from their organizations
CREATE POLICY user_activities_org_access ON user_activities
  FOR ALL USING (
    organization_id = ANY(get_user_organization_ids(current_setting('app.current_user_id')::TEXT))
  );

-- ===================================
-- UTILITY FUNCTIONS
-- ===================================

-- Function to create a new organization
CREATE OR REPLACE FUNCTION create_organization(
  org_name TEXT,
  org_slug TEXT,
  owner_firebase_uid TEXT,
  owner_email TEXT
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  new_user_id UUID;
BEGIN
  -- Create organization
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  -- Add owner to organization
  INSERT INTO organization_users (organization_id, user_id, role, status)
  VALUES (new_org_id, owner_firebase_uid, 'owner', 'active')
  RETURNING id INTO new_user_id;

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate existing user data to organization
CREATE OR REPLACE FUNCTION migrate_user_to_organization(
  firebase_uid TEXT,
  org_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update all user's existing data to belong to the organization
  UPDATE campaign_metrics SET organization_id = org_id WHERE user_id = firebase_uid;
  UPDATE oauth_tokens SET organization_id = org_id WHERE user_id = firebase_uid;
  UPDATE user_activities SET organization_id = org_id WHERE user_id = firebase_uid;
  UPDATE maya_conversations SET organization_id = org_id WHERE user_id = firebase_uid;
  UPDATE user_workflows SET organization_id = org_id WHERE user_id = firebase_uid;
  UPDATE messaging_integrations SET organization_id = org_id WHERE user_id = firebase_uid;
  UPDATE user_profiles SET organization_id = org_id WHERE user_id = firebase_uid;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- Organization users indexes
CREATE INDEX IF NOT EXISTS idx_organization_users_org_id ON organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_role ON organization_users(role);
CREATE INDEX IF NOT EXISTS idx_organization_users_status ON organization_users(status);

-- Add organization_id indexes to existing tables
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_org_id ON campaign_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_org_id ON oauth_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_org_id ON user_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_maya_conversations_org_id ON maya_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_workflows_org_id ON user_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_messaging_integrations_org_id ON messaging_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(organization_id);

-- ===================================
-- COMMENTS FOR DOCUMENTATION
-- ===================================

COMMENT ON TABLE organizations IS 'Enterprise tenant/organization management with complete data isolation';
COMMENT ON TABLE organization_users IS 'User membership and roles within organizations';
COMMENT ON TABLE organization_invitations IS 'Pending invitations to join organizations';
COMMENT ON TABLE organization_knowledge_bases IS 'Organization-specific knowledge bases for AI agents';
COMMENT ON TABLE organization_agents IS 'Organization-specific AI agent configurations';
COMMENT ON TABLE organization_templates IS 'Organization-specific message and workflow templates';
COMMENT ON TABLE organization_integrations IS 'Organization-specific third-party integrations and API keys';

COMMENT ON FUNCTION get_user_organization_ids IS 'Returns all organization IDs that a user belongs to';
COMMENT ON FUNCTION user_has_org_role IS 'Checks if user has specific role or higher in organization';
COMMENT ON FUNCTION create_organization IS 'Creates new organization with owner user';
COMMENT ON FUNCTION migrate_user_to_organization IS 'Migrates existing user data to organization context';