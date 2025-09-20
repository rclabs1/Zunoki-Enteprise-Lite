-- ===============================================
-- ZUNOKI ENTERPRISE LITE - MESSAGING SYSTEM MIGRATION
-- ===============================================
-- Based on Agenticflow schema adapted for our organization structure
-- This migration adds missing tables for complete messaging functionality

-- ===============================================
-- 1. MESSAGING INTEGRATIONS (Already created in simplified-schema.sql)
-- ===============================================

-- Create messaging_integrations table (if not exists)
CREATE TABLE IF NOT EXISTS public.messaging_integrations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id text NOT NULL,
  platform text NOT NULL CHECK (platform = ANY (ARRAY['whatsapp'::text, 'telegram'::text, 'facebook'::text, 'instagram'::text, 'slack'::text, 'discord'::text, 'youtube'::text, 'tiktok'::text, 'gmail'::text, 'website-chat'::text])),
  provider text,
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text DEFAULT 'inactive'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'error'::text, 'pending'::text, 'connecting'::text])),
  webhook_url text,
  webhook_secret text,
  last_sync_at timestamp with time zone,
  error_message text,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT messaging_integrations_pkey PRIMARY KEY (id),
  CONSTRAINT messaging_integrations_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT messaging_integrations_user_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id)
);

-- ===============================================
-- 2. CRM CONTACTS (Platform-aware contact management)
-- ===============================================

CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id text NOT NULL,
  phone_number text,
  email text,
  whatsapp_name text,
  display_name text,
  profile_picture_url text,
  tags jsonb DEFAULT '[]'::jsonb,
  notes text,
  lead_score integer DEFAULT 0,
  lifecycle_stage text DEFAULT 'lead'::text CHECK (lifecycle_stage = ANY (ARRAY['lead'::text, 'prospect'::text, 'customer'::text, 'evangelist'::text])),
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  last_seen timestamp with time zone,
  is_blocked boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  platform text DEFAULT 'whatsapp'::text CHECK (platform = ANY (ARRAY['whatsapp'::text, 'telegram'::text, 'facebook'::text, 'instagram'::text, 'slack'::text, 'discord'::text, 'youtube'::text, 'tiktok'::text, 'gmail'::text, 'website-chat'::text])),
  platform_id text DEFAULT ''::text,
  platform_username text,
  created_by text NOT NULL,
  CONSTRAINT crm_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT crm_contacts_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT crm_contacts_user_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id)
);

-- ===============================================
-- 3. CRM CONVERSATIONS (Platform conversations)
-- ===============================================

CREATE TABLE IF NOT EXISTS public.crm_conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id text NOT NULL,
  contact_id uuid NOT NULL,
  integration_id uuid, -- Link to messaging_integrations
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'pending'::text, 'resolved'::text, 'archived'::text])),
  assigned_agent_id uuid, -- Link to ai_agents
  assigned_agent_name text,
  handoff_reason text,
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  last_message_text text,
  last_message_at timestamp with time zone,
  unread_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  platform text DEFAULT 'whatsapp'::text CHECK (platform = ANY (ARRAY['whatsapp'::text, 'telegram'::text, 'facebook'::text, 'instagram'::text, 'slack'::text, 'discord'::text, 'youtube'::text, 'tiktok'::text, 'gmail'::text, 'website-chat'::text])),
  platform_thread_id text,
  category text DEFAULT 'general'::text CHECK (category = ANY (ARRAY['acquisition'::text, 'engagement'::text, 'retention'::text, 'support'::text, 'general'::text])),
  CONSTRAINT crm_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT crm_conversations_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT crm_conversations_contact_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id),
  CONSTRAINT crm_conversations_integration_fkey FOREIGN KEY (integration_id) REFERENCES public.messaging_integrations(id),
  CONSTRAINT crm_conversations_agent_fkey FOREIGN KEY (assigned_agent_id) REFERENCES public.ai_agents(id)
);

-- ===============================================
-- 4. PLATFORM-SPECIFIC MESSAGE TABLES
-- ===============================================

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id text NOT NULL,
  conversation_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  integration_id uuid,
  message_text text NOT NULL,
  direction text NOT NULL CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text])),
  message_type text DEFAULT 'text'::text CHECK (message_type = ANY (ARRAY['text'::text, 'image'::text, 'document'::text, 'audio'::text, 'video'::text, 'sticker'::text, 'location'::text, 'contact'::text])),
  media_url text,
  agent_id text,
  is_from_bot boolean DEFAULT false,
  bot_name text,
  status text DEFAULT 'sent'::text CHECK (status = ANY (ARRAY['sent'::text, 'delivered'::text, 'read'::text, 'failed'::text])),
  timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  platform text NOT NULL DEFAULT 'whatsapp'::text,
  platform_message_id text,
  reply_to_message_id text,
  CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_messages_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT whatsapp_messages_conversation_fkey FOREIGN KEY (conversation_id) REFERENCES public.crm_conversations(id),
  CONSTRAINT whatsapp_messages_contact_fkey FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id),
  CONSTRAINT whatsapp_messages_integration_fkey FOREIGN KEY (integration_id) REFERENCES public.messaging_integrations(id)
);

-- Telegram Messages
CREATE TABLE IF NOT EXISTS public.telegram_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id text NOT NULL,
  conversation_id uuid,
  contact_id uuid,
  integration_id uuid,
  message_text text,
  direction text NOT NULL CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text])),
  message_type text DEFAULT 'text'::text,
  media_url text,
  agent_id text,
  is_from_bot boolean DEFAULT false,
  bot_name text,
  status text DEFAULT 'delivered'::text,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  platform text NOT NULL DEFAULT 'telegram'::text,
  platform_message_id text,
  reply_to_message_id text,
  CONSTRAINT telegram_messages_pkey PRIMARY KEY (id),
  CONSTRAINT telegram_messages_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Gmail Messages
CREATE TABLE IF NOT EXISTS public.gmail_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id text NOT NULL,
  conversation_id uuid,
  contact_id uuid,
  integration_id uuid,
  message_text text,
  direction text NOT NULL CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text])),
  message_type text DEFAULT 'text'::text,
  media_url text,
  agent_id text,
  is_from_bot boolean DEFAULT false,
  bot_name text,
  status text DEFAULT 'delivered'::text,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  platform text NOT NULL DEFAULT 'gmail'::text,
  platform_message_id text,
  reply_to_message_id text,
  subject text,
  thread_id text,
  CONSTRAINT gmail_messages_pkey PRIMARY KEY (id),
  CONSTRAINT gmail_messages_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Website Chat Messages
CREATE TABLE IF NOT EXISTS public.website_chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id text NOT NULL,
  conversation_id uuid,
  contact_id uuid,
  integration_id uuid,
  message_text text,
  direction text NOT NULL CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text])),
  message_type text DEFAULT 'text'::text,
  media_url text,
  agent_id text,
  is_from_bot boolean DEFAULT false,
  bot_name text,
  status text DEFAULT 'delivered'::text,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  platform text NOT NULL DEFAULT 'website_chat'::text,
  platform_message_id text,
  reply_to_message_id text,
  visitor_session_id text,
  page_url text,
  CONSTRAINT website_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT website_chat_messages_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- ===============================================
-- 5. WEBHOOK LOGS (For tracking webhook events)
-- ===============================================

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  integration_id uuid,
  platform text NOT NULL,
  webhook_type text NOT NULL,
  payload jsonb NOT NULL,
  processing_status text DEFAULT 'pending'::text CHECK (processing_status = ANY (ARRAY['pending'::text, 'processed'::text, 'failed'::text])),
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  CONSTRAINT webhook_logs_pkey PRIMARY KEY (id),
  CONSTRAINT webhook_logs_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT webhook_logs_integration_fkey FOREIGN KEY (integration_id) REFERENCES public.messaging_integrations(id)
);

-- ===============================================
-- 6. INDEXES FOR PERFORMANCE
-- ===============================================

-- Messaging integrations indexes
CREATE INDEX IF NOT EXISTS idx_messaging_integrations_user_id ON public.messaging_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_messaging_integrations_organization_id ON public.messaging_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messaging_integrations_platform ON public.messaging_integrations(platform);
CREATE INDEX IF NOT EXISTS idx_messaging_integrations_status ON public.messaging_integrations(status);

-- CRM contacts indexes
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user_id ON public.crm_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_organization_id ON public.crm_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_platform ON public.crm_contacts(platform);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_phone_number ON public.crm_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(email);

-- CRM conversations indexes
CREATE INDEX IF NOT EXISTS idx_crm_conversations_user_id ON public.crm_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_organization_id ON public.crm_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_contact_id ON public.crm_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_platform ON public.crm_conversations(platform);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_status ON public.crm_conversations(status);

-- Message tables indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON public.whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_id ON public.whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON public.whatsapp_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_telegram_messages_user_id ON public.telegram_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_timestamp ON public.telegram_messages(timestamp);

CREATE INDEX IF NOT EXISTS idx_gmail_messages_user_id ON public.gmail_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_messages_timestamp ON public.gmail_messages(timestamp);

CREATE INDEX IF NOT EXISTS idx_website_chat_messages_user_id ON public.website_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_website_chat_messages_timestamp ON public.website_chat_messages(timestamp);

-- Webhook logs indexes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_integration_id ON public.webhook_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_platform ON public.webhook_logs(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(processing_status);

-- ===============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE public.messaging_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messaging_integrations
CREATE POLICY IF NOT EXISTS "Users can manage their integrations" ON public.messaging_integrations
  FOR ALL USING (
    user_id = auth.uid()::text OR
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()::text AND om.status = 'active'
    )
  );

-- Create RLS policies for crm_contacts
CREATE POLICY IF NOT EXISTS "Users can manage their contacts" ON public.crm_contacts
  FOR ALL USING (
    user_id = auth.uid()::text OR
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()::text AND om.status = 'active'
    )
  );

-- Create RLS policies for crm_conversations
CREATE POLICY IF NOT EXISTS "Users can manage their conversations" ON public.crm_conversations
  FOR ALL USING (
    user_id = auth.uid()::text OR
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()::text AND om.status = 'active'
    )
  );

-- Create RLS policies for message tables
CREATE POLICY IF NOT EXISTS "Users can manage their whatsapp messages" ON public.whatsapp_messages
  FOR ALL USING (
    user_id = auth.uid()::text OR
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()::text AND om.status = 'active'
    )
  );

CREATE POLICY IF NOT EXISTS "Users can manage their telegram messages" ON public.telegram_messages
  FOR ALL USING (
    user_id = auth.uid()::text OR
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()::text AND om.status = 'active'
    )
  );

CREATE POLICY IF NOT EXISTS "Users can manage their gmail messages" ON public.gmail_messages
  FOR ALL USING (
    user_id = auth.uid()::text OR
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()::text AND om.status = 'active'
    )
  );

CREATE POLICY IF NOT EXISTS "Users can manage their website chat messages" ON public.website_chat_messages
  FOR ALL USING (
    user_id = auth.uid()::text OR
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()::text AND om.status = 'active'
    )
  );

CREATE POLICY IF NOT EXISTS "Users can view their webhook logs" ON public.webhook_logs
  FOR ALL USING (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()::text AND om.status = 'active'
    )
  );

-- ===============================================
-- 8. HELPER FUNCTIONS
-- ===============================================

-- Function to auto-populate organization_id for messaging_integrations
CREATE OR REPLACE FUNCTION auto_populate_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user's primary organization
  SELECT om.organization_id INTO NEW.organization_id
  FROM public.organization_memberships om
  WHERE om.user_id = NEW.user_id
    AND om.status = 'active'
    AND om.role = 'owner'
  LIMIT 1;

  -- If no organization found, this should not happen in our simplified model
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user %', NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-populate organization_id
DROP TRIGGER IF EXISTS trigger_auto_populate_organization_id ON public.messaging_integrations;
CREATE TRIGGER trigger_auto_populate_organization_id
  BEFORE INSERT ON public.messaging_integrations
  FOR EACH ROW
  WHEN (NEW.organization_id IS NULL)
  EXECUTE FUNCTION auto_populate_organization_id();

-- Function to auto-populate organization_id for other tables
CREATE OR REPLACE FUNCTION auto_populate_org_for_crm()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user's primary organization
  SELECT om.organization_id INTO NEW.organization_id
  FROM public.organization_memberships om
  WHERE om.user_id = NEW.user_id
    AND om.status = 'active'
    AND om.role = 'owner'
  LIMIT 1;

  -- If no organization found, this should not happen in our simplified model
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user %', NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for CRM tables
DROP TRIGGER IF EXISTS trigger_auto_populate_org_crm_contacts ON public.crm_contacts;
CREATE TRIGGER trigger_auto_populate_org_crm_contacts
  BEFORE INSERT ON public.crm_contacts
  FOR EACH ROW
  WHEN (NEW.organization_id IS NULL)
  EXECUTE FUNCTION auto_populate_org_for_crm();

DROP TRIGGER IF EXISTS trigger_auto_populate_org_crm_conversations ON public.crm_conversations;
CREATE TRIGGER trigger_auto_populate_org_crm_conversations
  BEFORE INSERT ON public.crm_conversations
  FOR EACH ROW
  WHEN (NEW.organization_id IS NULL)
  EXECUTE FUNCTION auto_populate_org_for_crm();

-- ===============================================
-- MIGRATION COMPLETE
-- ===============================================

-- Insert some sample data for testing (optional)
/*
-- Sample messaging integration
INSERT INTO messaging_integrations (user_id, platform, provider, name, config, status, created_by)
VALUES
  ('sample-user-id', 'whatsapp', 'twilio', 'My WhatsApp Business', '{"phone": "+1234567890"}', 'active', 'sample-user-id')
ON CONFLICT DO NOTHING;

-- Sample contact
INSERT INTO crm_contacts (user_id, phone_number, whatsapp_name, display_name, platform, created_by)
VALUES
  ('sample-user-id', '+1234567890', 'John Doe', 'John Doe', 'whatsapp', 'sample-user-id')
ON CONFLICT DO NOTHING;
*/