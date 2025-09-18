-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id text NOT NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.agentic_usage_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  organization_id uuid,
  date date NOT NULL DEFAULT CURRENT_DATE,
  credits_used integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT agentic_usage_logs_pkey PRIMARY KEY (id),
  CONSTRAINT agentic_usage_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.ai_agents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  system_prompt text,
  model text DEFAULT 'gpt-4o-mini'::text,
  temperature numeric DEFAULT 0.7,
  max_tokens integer DEFAULT 1000,
  capabilities jsonb DEFAULT '[]'::jsonb,
  configuration jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'inactive'::text])),
  created_by text NOT NULL,
  usage_count integer DEFAULT 0,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ai_agents_pkey PRIMARY KEY (id),
  CONSTRAINT ai_agents_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.api_usage (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  endpoint text NOT NULL,
  method text NOT NULL,
  requests_count integer DEFAULT 1,
  date date NOT NULL DEFAULT CURRENT_DATE,
  hour_bucket integer NOT NULL DEFAULT EXTRACT(hour FROM now()),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT api_usage_pkey PRIMARY KEY (id),
  CONSTRAINT api_usage_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.automation_executions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  workflow_id uuid NOT NULL,
  trigger_data jsonb NOT NULL,
  execution_status text DEFAULT 'pending'::text CHECK (execution_status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text])),
  result_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  execution_time_ms integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  completed_at timestamp with time zone,
  CONSTRAINT automation_executions_pkey PRIMARY KEY (id),
  CONSTRAINT automation_executions_workflow_fkey FOREIGN KEY (workflow_id) REFERENCES public.automation_workflows(id)
);
CREATE TABLE public.automation_workflows (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  n8n_workflow_id text,
  trigger_type text NOT NULL CHECK (trigger_type = ANY (ARRAY['webhook'::text, 'message'::text, 'contact_created'::text, 'conversation_started'::text])),
  trigger_conditions jsonb DEFAULT '{}'::jsonb,
  webhook_url text,
  webhook_secret text,
  is_active boolean DEFAULT false,
  execution_count integer DEFAULT 0,
  last_executed_at timestamp with time zone,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT automation_workflows_pkey PRIMARY KEY (id),
  CONSTRAINT automation_workflows_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.campaign_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  organization_id uuid,
  platform text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  metrics_data jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT campaign_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_metrics_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  email text,
  phone text,
  name text,
  company text,
  tags jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  lead_score integer DEFAULT 0,
  lifecycle_stage text DEFAULT 'lead'::text CHECK (lifecycle_stage = ANY (ARRAY['lead'::text, 'prospect'::text, 'customer'::text, 'champion'::text])),
  created_by text NOT NULL,
  assigned_to text,
  last_interaction timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  title text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'closed'::text, 'archived'::text])),
  assigned_agent_id uuid,
  assigned_user_id text,
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
  channel text DEFAULT 'web'::text CHECK (channel = ANY (ARRAY['web'::text, 'email'::text, 'whatsapp'::text, 'slack'::text, 'api'::text])),
  metadata jsonb DEFAULT '{}'::jsonb,
  last_message_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT conversations_contact_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id),
  CONSTRAINT conversations_agent_fkey FOREIGN KEY (assigned_agent_id) REFERENCES public.ai_agents(id)
);
CREATE TABLE public.coupon_usage (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  coupon_id uuid NOT NULL,
  user_id text NOT NULL,
  organization_id uuid,
  payment_id uuid,
  discount_amount numeric NOT NULL,
  original_amount numeric NOT NULL,
  final_amount numeric NOT NULL,
  used_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT coupon_usage_pkey PRIMARY KEY (id),
  CONSTRAINT coupon_usage_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id),
  CONSTRAINT coupon_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id),
  CONSTRAINT coupon_usage_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT coupon_usage_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id)
);
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  discount_value numeric NOT NULL,
  max_uses integer DEFAULT 1,
  used_count integer DEFAULT 0,
  valid_from timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  valid_until timestamp with time zone,
  applies_to text DEFAULT 'first_month'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_by text DEFAULT 'system'::text,
  description text,
  organization_id uuid,
  CONSTRAINT coupons_pkey PRIMARY KEY (id),
  CONSTRAINT coupons_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.data_retention_policies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  data_type text NOT NULL,
  retention_days integer NOT NULL,
  auto_delete boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT data_retention_policies_pkey PRIMARY KEY (id),
  CONSTRAINT data_retention_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.feature_flags (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  flag_key text NOT NULL,
  flag_value boolean DEFAULT false,
  rollout_percentage integer DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  is_global boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT feature_flags_pkey PRIMARY KEY (id),
  CONSTRAINT feature_flags_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.integrations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['whatsapp'::text, 'slack'::text, 'webhook'::text, 'api'::text, 'n8n'::text])),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  credentials jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'error'::text])),
  webhook_url text,
  last_sync_at timestamp with time zone,
  error_message text,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT integrations_pkey PRIMARY KEY (id),
  CONSTRAINT integrations_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  content text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])),
  message_type text DEFAULT 'text'::text CHECK (message_type = ANY (ARRAY['text'::text, 'image'::text, 'file'::text, 'audio'::text])),
  attachments jsonb DEFAULT '[]'::jsonb,
  agent_id uuid,
  user_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT messages_conversation_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_agent_fkey FOREIGN KEY (agent_id) REFERENCES public.ai_agents(id)
);
CREATE TABLE public.organization_memberships (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id text NOT NULL,
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'member'::text])),
  permissions jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending'::text])),
  invited_by text,
  invited_at timestamp with time zone,
  joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT organization_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT organization_memberships_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT organization_memberships_user_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id)
);
CREATE TABLE public.organization_security_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL UNIQUE,
  require_2fa boolean DEFAULT false,
  password_policy jsonb DEFAULT '{"min_length": 8, "require_numbers": true, "require_symbols": false, "require_uppercase": true}'::jsonb,
  session_timeout_minutes integer DEFAULT 480,
  allowed_ip_ranges ARRAY,
  sso_enabled boolean DEFAULT false,
  sso_provider text,
  sso_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT organization_security_settings_pkey PRIMARY KEY (id),
  CONSTRAINT organization_security_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  domain text,
  logo_url text,
  settings jsonb DEFAULT '{}'::jsonb,
  subscription_tier text DEFAULT 'free'::text CHECK (subscription_tier = ANY (ARRAY['free'::text, 'starter'::text, 'business'::text, 'enterprise'::text])),
  subscription_status text DEFAULT 'active'::text CHECK (subscription_status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'trialing'::text])),
  subscription_start timestamp with time zone,
  subscription_end timestamp with time zone,
  max_users integer DEFAULT 5,
  max_ai_agents integer DEFAULT 3,
  max_conversations integer DEFAULT 1000,
  billing_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  industry text,
  company_size text CHECK (company_size = ANY (ARRAY['1-10'::text, '11-50'::text, '51-200'::text, '201-1000'::text, '1000+'::text])),
  timezone text DEFAULT 'UTC'::text,
  locale text DEFAULT 'en-US'::text,
  is_trial boolean DEFAULT true,
  trial_ends_at timestamp with time zone,
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD'::text,
  payment_method text,
  payment_status text NOT NULL CHECK (payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])),
  stripe_payment_intent_id text,
  invoice_number text UNIQUE,
  billing_period_start timestamp with time zone,
  billing_period_end timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  user_id text,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT payments_user_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id)
);
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price_monthly numeric NOT NULL,
  price_yearly numeric NOT NULL,
  max_users integer NOT NULL,
  max_ai_agents integer NOT NULL,
  max_conversations integer NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_audience_insights (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  organization_id uuid,
  insights_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_audience_insights_pkey PRIMARY KEY (id),
  CONSTRAINT user_audience_insights_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  timezone text DEFAULT 'UTC'::text,
  language text DEFAULT 'en'::text,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  job_title text,
  department text,
  last_login_at timestamp with time zone,
  is_active boolean DEFAULT true,
  two_factor_enabled boolean DEFAULT false,
  security_settings jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  organization_id uuid,
  platform text NOT NULL,
  token_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT user_tokens_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);