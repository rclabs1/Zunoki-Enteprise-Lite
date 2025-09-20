-- ===============================================
-- ZUNOKI ENTERPRISE LITE - ENHANCED DATABASE MIGRATION
-- ===============================================
-- Building on top of existing database-schema.sql
-- Adding messaging-specific enhancements while preserving existing structure

-- ===============================================
-- 1. ADD MISSING COLUMNS TO EXISTING CONTACTS TABLE
-- ===============================================

-- Enhance existing contacts table with messaging-specific fields
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS whatsapp_name text,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS profile_picture_url text,
ADD COLUMN IF NOT EXISTS platform text DEFAULT 'web'::text CHECK (platform = ANY (ARRAY['web'::text, 'whatsapp'::text, 'telegram'::text, 'facebook'::text, 'instagram'::text, 'slack'::text, 'discord'::text, 'youtube'::text, 'tiktok'::text, 'gmail'::text, 'website-chat'::text])),
ADD COLUMN IF NOT EXISTS platform_id text,
ADD COLUMN IF NOT EXISTS platform_username text,
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]));

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
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general'::text CHECK (category = ANY (ARRAY['acquisition'::text, 'engagement'::text, 'retention'::text, 'support'::text, 'general'::text]));

-- Update existing channel check to include more platforms
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_channel_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_channel_check
CHECK (channel = ANY (ARRAY['web'::text, 'email'::text, 'whatsapp'::text, 'telegram'::text, 'facebook'::text, 'instagram'::text, 'slack'::text, 'discord'::text, 'youtube'::text, 'tiktok'::text, 'gmail'::text, 'website-chat'::text, 'api'::text]));

-- ===============================================
-- 3. ADD MISSING COLUMNS TO EXISTING MESSAGES TABLE
-- ===============================================

-- Enhance existing messages table with messaging-specific fields
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS direction text CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text])),
ADD COLUMN IF NOT EXISTS platform text DEFAULT 'web'::text,
ADD COLUMN IF NOT EXISTS platform_message_id text,
ADD COLUMN IF NOT EXISTS reply_to_message_id text,
ADD COLUMN IF NOT EXISTS is_from_bot boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bot_name text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'delivered'::text CHECK (status = ANY (ARRAY['sent'::text, 'delivered'::text, 'read'::text, 'failed'::text, 'pending'::text])),
ADD COLUMN IF NOT EXISTS timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS media_url text;

-- Update existing message_type check to include more types
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check
CHECK (message_type = ANY (ARRAY['text'::text, 'image'::text, 'document'::text, 'audio'::text, 'video'::text, 'sticker'::text, 'location'::text, 'contact'::text, 'file'::text]));

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

-- Add integration_id to existing conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS integration_id uuid,
ADD CONSTRAINT IF NOT EXISTS conversations_integration_fkey
FOREIGN KEY (integration_id) REFERENCES public.messaging_integrations(id);

-- Add integration_id to existing messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS integration_id uuid,
ADD CONSTRAINT IF NOT EXISTS messages_integration_fkey
FOREIGN KEY (integration_id) REFERENCES public.messaging_integrations(id);

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
-- 6. PLATFORM-SPECIFIC MESSAGE VIEWS
-- ===============================================
-- Create views on top of the main messages table for platform-specific queries

-- WhatsApp Messages View
CREATE OR REPLACE VIEW public.whatsapp_messages AS
SELECT
  m.*,
  c.phone_number,
  c.whatsapp_name,
  c.platform_id as contact_platform_id
FROM public.messages m
JOIN public.conversations conv ON conv.id = m.conversation_id
JOIN public.contacts c ON c.id = conv.contact_id
WHERE conv.channel = 'whatsapp' OR m.platform = 'whatsapp';

-- Telegram Messages View
CREATE OR REPLACE VIEW public.telegram_messages AS
SELECT
  m.*,
  c.platform_username,
  c.platform_id as contact_platform_id
FROM public.messages m
JOIN public.conversations conv ON conv.id = m.conversation_id
JOIN public.contacts c ON c.id = conv.contact_id
WHERE conv.channel = 'telegram' OR m.platform = 'telegram';

-- Gmail Messages View
CREATE OR REPLACE VIEW public.gmail_messages AS
SELECT
  m.*,
  c.email,
  c.name as contact_name
FROM public.messages m
JOIN public.conversations conv ON conv.id = m.conversation_id
JOIN public.contacts c ON c.id = conv.contact_id
WHERE conv.channel = 'email' OR m.platform = 'gmail';

-- Website Chat Messages View
CREATE OR REPLACE VIEW public.website_chat_messages AS
SELECT
  m.*,
  c.email,
  c.name as visitor_name,
  conv.metadata->>'page_url' as page_url,
  conv.metadata->>'session_id' as visitor_session_id
FROM public.messages m
JOIN public.conversations conv ON conv.id = m.conversation_id
JOIN public.contacts c ON c.id = conv.contact_id
WHERE conv.channel = 'web' OR m.platform = 'website-chat';

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

-- Create RLS policies for webhook_logs
CREATE POLICY IF NOT EXISTS "Users can view their webhook logs" ON public.webhook_logs
  FOR ALL USING (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()::text AND om.status = 'active'
    )
  );

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

-- Trigger to auto-populate organization_id
DROP TRIGGER IF EXISTS trigger_auto_populate_organization_id ON public.messaging_integrations;
CREATE TRIGGER trigger_auto_populate_organization_id
  BEFORE INSERT ON public.messaging_integrations
  FOR EACH ROW
  WHEN (NEW.organization_id IS NULL)
  EXECUTE FUNCTION auto_populate_organization_id();

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

-- Trigger to update conversation when message is added
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON public.messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ===============================================
-- 10. SAMPLE DATA FOR TESTING (Optional)
-- ===============================================

-- Uncomment to insert sample data for testing
/*
-- Sample messaging integration
INSERT INTO messaging_integrations (user_id, platform, provider, name, config, status, created_by)
VALUES
  ('sample-user-id', 'whatsapp', 'twilio', 'My WhatsApp Business', '{"phone": "+1234567890"}', 'active', 'sample-user-id')
ON CONFLICT DO NOTHING;

-- Update sample contact with messaging fields
UPDATE public.contacts
SET
  phone_number = '+1234567890',
  whatsapp_name = 'John Doe',
  display_name = 'John Doe',
  platform = 'whatsapp'
WHERE email = 'sample@example.com';
*/

-- ===============================================
-- MIGRATION COMPLETE - ENHANCED EXISTING STRUCTURE
-- ===============================================