-- ===============================================
-- ZUNOKI ENTERPRISE LITE - SIMPLE SAFE DATABASE MIGRATION
-- ===============================================
-- Building on top of existing database-schema.sql
-- SIMPLIFIED VERSION - Avoiding complex constraint checks

-- ===============================================
-- 1. ADD MISSING COLUMNS TO EXISTING CONTACTS TABLE
-- ===============================================

-- Enhance existing contacts table with messaging-specific fields
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS whatsapp_name text,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS profile_picture_url text,
ADD COLUMN IF NOT EXISTS platform text DEFAULT 'web'::text,
ADD COLUMN IF NOT EXISTS platform_id text,
ADD COLUMN IF NOT EXISTS platform_username text,
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium'::text;

-- ===============================================
-- 2. ADD MISSING COLUMNS TO EXISTING CONVERSATIONS TABLE
-- ===============================================

-- Enhance existing conversations table with messaging-specific fields
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS platform_thread_id text,
ADD COLUMN IF NOT EXISTS unread_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS handoff_reason text,
ADD COLUMN IF NOT EXISTS assigned_agent_name text,
ADD COLUMN IF NOT EXISTS last_message_text text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general'::text,
ADD COLUMN IF NOT EXISTS integration_id uuid;

-- ===============================================
-- 3. ADD MISSING COLUMNS TO EXISTING MESSAGES TABLE
-- ===============================================

-- Enhance existing messages table with messaging-specific fields
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS direction text,
ADD COLUMN IF NOT EXISTS platform text DEFAULT 'web'::text,
ADD COLUMN IF NOT EXISTS platform_message_id text,
ADD COLUMN IF NOT EXISTS reply_to_message_id text,
ADD COLUMN IF NOT EXISTS is_from_bot boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bot_name text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'delivered'::text,
ADD COLUMN IF NOT EXISTS timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS integration_id uuid;

-- ===============================================
-- 4. NEW TABLE: MESSAGING INTEGRATIONS
-- ===============================================

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
-- 5. NEW TABLE: WEBHOOK LOGS
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
-- 6. ADD FOREIGN KEY CONSTRAINTS (Try to add, ignore if exists)
-- ===============================================

-- Try to add foreign key constraints - will fail silently if they already exist
DO $$
BEGIN
  -- Add foreign key for conversations.integration_id
  BEGIN
    ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_integration_fkey
    FOREIGN KEY (integration_id) REFERENCES public.messaging_integrations(id);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Constraint already exists, do nothing
      NULL;
  END;

  -- Add foreign key for messages.integration_id
  BEGIN
    ALTER TABLE public.messages
    ADD CONSTRAINT messages_integration_fkey
    FOREIGN KEY (integration_id) REFERENCES public.messaging_integrations(id);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Constraint already exists, do nothing
      NULL;
  END;
END $$;

-- ===============================================
-- 7. ENHANCED INDEXES
-- ===============================================

-- Additional indexes for messaging performance
CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON public.contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_contacts_platform ON public.contacts(platform);
CREATE INDEX IF NOT EXISTS idx_contacts_platform_id ON public.contacts(platform_id);

CREATE INDEX IF NOT EXISTS idx_conversations_integration_id ON public.conversations(integration_id);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON public.conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_unread_count ON public.conversations(unread_count);

CREATE INDEX IF NOT EXISTS idx_messages_direction ON public.messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_platform ON public.messages(platform);
CREATE INDEX IF NOT EXISTS idx_messages_platform_message_id ON public.messages(platform_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_integration_id ON public.messages(integration_id);

-- Messaging integrations indexes
CREATE INDEX IF NOT EXISTS idx_messaging_integrations_user_id ON public.messaging_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_messaging_integrations_organization_id ON public.messaging_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messaging_integrations_platform ON public.messaging_integrations(platform);
CREATE INDEX IF NOT EXISTS idx_messaging_integrations_status ON public.messaging_integrations(status);

-- Webhook logs indexes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_integration_id ON public.webhook_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_platform ON public.webhook_logs(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(processing_status);

-- ===============================================
-- 8. ENHANCED ROW LEVEL SECURITY (RLS)
-- ===============================================

-- Enable RLS on new tables
ALTER TABLE public.messaging_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - will fail silently if they already exist
DO $$
BEGIN
  -- RLS policy for messaging_integrations
  BEGIN
    CREATE POLICY "Users can manage their integrations" ON public.messaging_integrations
      FOR ALL USING (
        user_id = auth.uid()::text OR
        organization_id IN (
          SELECT om.organization_id
          FROM public.organization_memberships om
          WHERE om.user_id = auth.uid()::text AND om.status = 'active'
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists, do nothing
      NULL;
  END;

  -- RLS policy for webhook_logs
  BEGIN
    CREATE POLICY "Users can view their webhook logs" ON public.webhook_logs
      FOR ALL USING (
        organization_id IN (
          SELECT om.organization_id
          FROM public.organization_memberships om
          WHERE om.user_id = auth.uid()::text AND om.status = 'active'
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists, do nothing
      NULL;
  END;
END $$;

-- ===============================================
-- 9. HELPER FUNCTIONS
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

-- Create trigger - will fail silently if it already exists
DO $$
BEGIN
  BEGIN
    CREATE TRIGGER trigger_auto_populate_organization_id
      BEFORE INSERT ON public.messaging_integrations
      FOR EACH ROW
      WHEN (NEW.organization_id IS NULL)
      EXECUTE FUNCTION auto_populate_organization_id();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists, do nothing
      NULL;
  END;
END $$;

-- Function to update conversation last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    last_message_text = LEFT(NEW.content, 100),  -- Store first 100 chars
    unread_count = CASE
      WHEN NEW.direction = 'inbound' THEN unread_count + 1
      ELSE unread_count
    END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger - will fail silently if it already exists
DO $$
BEGIN
  BEGIN
    CREATE TRIGGER trigger_update_conversation_last_message
      AFTER INSERT ON public.messages
      FOR EACH ROW
      EXECUTE FUNCTION update_conversation_last_message();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists, do nothing
      NULL;
  END;
END $$;

-- ===============================================
-- MIGRATION COMPLETE - SIMPLE SAFE VERSION
-- ===============================================

-- This migration:
-- 1. Adds new columns to existing tables (safe)
-- 2. Creates new tables if they don't exist (safe)
-- 3. Adds indexes if they don't exist (safe)
-- 4. Uses exception handling for constraints/policies/triggers
-- 5. No complex information_schema queries
-- 6. Will run successfully even if partially applied before