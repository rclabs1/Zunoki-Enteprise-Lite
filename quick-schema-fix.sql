-- Quick Schema Fix for Platform Integration Support
-- Run this in your Supabase SQL editor

-- 1. Fix integrations table to support all platforms
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

-- 2. Fix conversations table to support all channels
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

-- 3. Add webhook_secret field if missing
ALTER TABLE public.integrations
ADD COLUMN IF NOT EXISTS webhook_secret text;

-- 4. Add integration_id to conversations for better tracking
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS integration_id uuid REFERENCES public.integrations(id);