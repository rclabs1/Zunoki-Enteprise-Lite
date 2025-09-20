-- Simplified Schema for Zunoki Enterprise Lite
-- Auto-creates one organization per user to maintain structure but simplify UX

-- messaging_integrations table adapted for auto-organization approach
CREATE TABLE public.messaging_integrations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  organization_id uuid NOT NULL, -- Auto-populated from user's primary organization
  platform text NOT NULL CHECK (platform = ANY (ARRAY['whatsapp'::text, 'telegram'::text, 'facebook'::text, 'instagram'::text, 'slack'::text, 'discord'::text, 'youtube'::text, 'tiktok'::text, 'gmail'::text])),
  provider text, -- e.g., 'twilio', 'meta', 'google'
  name text NOT NULL, -- Display name for the integration
  config jsonb NOT NULL DEFAULT '{}'::jsonb, -- Platform-specific configuration
  status text DEFAULT 'inactive'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'error'::text, 'pending'::text, 'connecting'::text])),
  webhook_url text,
  webhook_secret text,
  last_sync_at timestamp with time zone,
  error_message text,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,

  -- Additional fields for better UX
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false, -- Mark one integration per platform as primary
  metadata jsonb DEFAULT '{}'::jsonb, -- Store additional platform data

  CONSTRAINT messaging_integrations_pkey PRIMARY KEY (id),
  CONSTRAINT messaging_integrations_organization_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT messaging_integrations_user_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_messaging_integrations_user_id ON public.messaging_integrations(user_id);
CREATE INDEX idx_messaging_integrations_organization_id ON public.messaging_integrations(organization_id);
CREATE INDEX idx_messaging_integrations_platform ON public.messaging_integrations(platform);
CREATE INDEX idx_messaging_integrations_status ON public.messaging_integrations(status);
CREATE INDEX idx_messaging_integrations_user_platform ON public.messaging_integrations(user_id, platform);

-- Enable Row Level Security
ALTER TABLE public.messaging_integrations ENABLE ROW LEVEL SECURITY;

-- Simplified RLS policy for user access (since one org per user)
CREATE POLICY "Users can manage their integrations" ON public.messaging_integrations
  FOR ALL USING (
    user_id = auth.uid()::text
  );

-- Function to auto-populate organization_id when inserting
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
CREATE TRIGGER trigger_auto_populate_organization_id
  BEFORE INSERT ON public.messaging_integrations
  FOR EACH ROW
  WHEN (NEW.organization_id IS NULL)
  EXECUTE FUNCTION auto_populate_organization_id();

-- Sample insert showing how it works
-- INSERT INTO messaging_integrations (user_id, platform, provider, name, config, created_by)
-- VALUES ('user123', 'whatsapp', 'twilio', 'My WhatsApp Business', '{"phone": "+1234567890"}', 'user123');
-- The organization_id will be auto-populated from user's primary organization