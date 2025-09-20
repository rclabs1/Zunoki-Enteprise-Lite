-- Schema Migration: Fix Integration Platform Support
-- This migration updates the database schema to support all platforms

-- 1. Update integrations table type constraint
ALTER TABLE public.integrations
DROP CONSTRAINT IF EXISTS integrations_type_check;

ALTER TABLE public.integrations
ADD CONSTRAINT integrations_type_check
CHECK (type = ANY (ARRAY[
  'whatsapp'::text,
  'slack'::text,
  'telegram'::text,
  'gmail'::text,
  'email'::text,
  'sms'::text,
  'chat-widget'::text,
  'webhook'::text,
  'api'::text,
  'n8n'::text
]));

-- 2. Update conversations table channel constraint
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_channel_check;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_channel_check
CHECK (channel = ANY (ARRAY[
  'web'::text,
  'email'::text,
  'whatsapp'::text,
  'slack'::text,
  'telegram'::text,
  'gmail'::text,
  'sms'::text,
  'chat-widget'::text,
  'api'::text
]));

-- 3. Add indexes for better performance on messaging queries
CREATE INDEX IF NOT EXISTS idx_conversations_organization_status
ON public.conversations(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_conversations_channel
ON public.conversations(channel);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
ON public.conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON public.messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_role
ON public.messages(role);

CREATE INDEX IF NOT EXISTS idx_integrations_type_status
ON public.integrations(type, status);

-- 4. Add unique constraint to prevent duplicate active integrations per type per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_integrations_unique_active
ON public.integrations(organization_id, type)
WHERE status = 'active';

-- 5. Add constraint to ensure contact uniqueness per platform
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_unique_phone
ON public.contacts(organization_id, phone)
WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_unique_email
ON public.contacts(organization_id, email)
WHERE email IS NOT NULL;

-- 6. Add webhook_secret field to integrations if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'integrations'
                   AND column_name = 'webhook_secret') THEN
        ALTER TABLE public.integrations
        ADD COLUMN webhook_secret text;
    END IF;
END $$;

-- 7. Add integration_id to conversations for better tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'conversations'
                   AND column_name = 'integration_id') THEN
        ALTER TABLE public.conversations
        ADD COLUMN integration_id uuid REFERENCES public.integrations(id);
    END IF;
END $$;

COMMENT ON TABLE public.integrations IS 'Platform integrations for messaging (Slack, WhatsApp, Telegram, etc.)';
COMMENT ON TABLE public.conversations IS 'Customer conversations across all platforms';
COMMENT ON TABLE public.messages IS 'Messages within conversations from any platform';

-- Verify the changes
SELECT 'Integration types now supported:' as info,
       string_agg(unnest, ', ') as supported_types
FROM (
    SELECT unnest(regexp_split_to_array(
        substring(
            pg_get_constraintdef(oid)
            from 'ARRAY\[(.*?)\]'
        ),
        ', '
    )) as unnest
    FROM pg_constraint
    WHERE conname = 'integrations_type_check'
) t;

SELECT 'Conversation channels now supported:' as info,
       string_agg(unnest, ', ') as supported_channels
FROM (
    SELECT unnest(regexp_split_to_array(
        substring(
            pg_get_constraintdef(oid)
            from 'ARRAY\[(.*?)\]'
        ),
        ', '
    )) as unnest
    FROM pg_constraint
    WHERE conname = 'conversations_channel_check'
) t;