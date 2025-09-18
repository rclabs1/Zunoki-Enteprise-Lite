-- Coupon seeding script for Zunoki Enterprise Lite
-- Run this in Supabase SQL Editor to create discount coupons
-- This integrates with existing database schema (payments table with metadata field)

-- Create coupons table that integrates with existing schema
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  max_uses integer DEFAULT 1,
  used_count integer DEFAULT 0,
  valid_from timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  valid_until timestamp with time zone,
  applies_to text DEFAULT 'first_month',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_by text DEFAULT 'system',
  description text,
  -- Integration with existing schema
  organization_id uuid REFERENCES public.organizations(id),
  CONSTRAINT coupons_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create policy for coupon access
CREATE POLICY "Allow coupon usage" ON public.coupons
  FOR SELECT
  TO authenticated
  USING (is_active = true AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP));

-- Generate 100 VIP99 coupons (99% off first month)
INSERT INTO public.coupons (code, discount_type, discount_value, max_uses, description, applies_to)
SELECT
  'VIP99-' || LPAD(generate_series::text, 3, '0'),
  'percentage',
  99,
  1,
  '99% off first month - VIP users only',
  'first_month'
FROM generate_series(1, 100);

-- Generate 100 ELITE90 coupons (90% off first month)
INSERT INTO public.coupons (code, discount_type, discount_value, max_uses, description, applies_to)
SELECT
  'ELITE90-' || LPAD(generate_series::text, 3, '0'),
  'percentage',
  90,
  1,
  '90% off first month - Elite users only',
  'first_month'
FROM generate_series(1, 100);

-- Generate 100 PREMIUM85 coupons (85% off first month)
INSERT INTO public.coupons (code, discount_type, discount_value, max_uses, description, applies_to)
SELECT
  'PREMIUM85-' || LPAD(generate_series::text, 3, '0'),
  'percentage',
  85,
  1,
  '85% off first month - Premium users only',
  'first_month'
FROM generate_series(1, 100);

-- Generate 100 SILVER80 coupons (80% off first month)
INSERT INTO public.coupons (code, discount_type, discount_value, max_uses, description, applies_to)
SELECT
  'SILVER80-' || LPAD(generate_series::text, 3, '0'),
  'percentage',
  80,
  1,
  '80% off first month - Silver users only',
  'first_month'
FROM generate_series(1, 100);

-- Add the public LAUNCH25 coupon (unlimited uses)
INSERT INTO public.coupons (code, discount_type, discount_value, max_uses, description, applies_to)
VALUES
  ('LAUNCH25', 'percentage', 25, 1000, '25% off first month - Launch special', 'first_month');

-- Create coupon usage tracking table that integrates with existing schema
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  user_id text NOT NULL REFERENCES public.user_profiles(user_id),
  organization_id uuid REFERENCES public.organizations(id),
  payment_id uuid REFERENCES public.payments(id),
  discount_amount numeric NOT NULL,
  original_amount numeric NOT NULL,
  final_amount numeric NOT NULL,
  used_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT coupon_usage_pkey PRIMARY KEY (id),
  CONSTRAINT coupon_usage_user_coupon_unique UNIQUE (coupon_id, user_id)
);

-- Enable RLS for coupon usage
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Create policy for coupon usage tracking
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
  FOR SELECT
  TO authenticated
  USING (user_id = get_current_user_id());

CREATE POLICY "Allow coupon usage insert" ON public.coupon_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = get_current_user_id());

-- Create function to validate and apply coupon (integrates with existing schema)
CREATE OR REPLACE FUNCTION public.apply_coupon(
  coupon_code text,
  user_uid text,
  org_id uuid DEFAULT NULL,
  order_amount numeric DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  coupon_record record;
  discount_amount numeric;
  final_amount numeric;
  user_profile_exists boolean;
BEGIN
  -- Verify user exists in user_profiles table (referential integrity)
  SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id = user_uid) INTO user_profile_exists;

  IF NOT user_profile_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User profile not found'
    );
  END IF;

  -- Find the coupon
  SELECT * INTO coupon_record
  FROM public.coupons
  WHERE code = coupon_code
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP)
    AND used_count < max_uses;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired coupon code'
    );
  END IF;

  -- Check if user already used this coupon
  IF EXISTS (
    SELECT 1 FROM public.coupon_usage
    WHERE coupon_id = coupon_record.id AND user_id = user_uid
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Coupon already used by this user'
    );
  END IF;

  -- Calculate discount
  IF coupon_record.discount_type = 'percentage' THEN
    discount_amount := order_amount * (coupon_record.discount_value / 100);
  ELSE
    discount_amount := coupon_record.discount_value;
  END IF;

  final_amount := GREATEST(0, order_amount - discount_amount);

  -- Record usage (will be linked to payment when payment is created)
  INSERT INTO public.coupon_usage (
    coupon_id,
    user_id,
    organization_id,
    discount_amount,
    original_amount,
    final_amount
  )
  VALUES (coupon_record.id, user_uid, org_id, discount_amount, order_amount, final_amount);

  -- Update coupon used count
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = coupon_record.id;

  RETURN json_build_object(
    'success', true,
    'coupon_id', coupon_record.id,
    'discount_type', coupon_record.discount_type,
    'discount_percentage', coupon_record.discount_value,
    'discount_amount', discount_amount,
    'original_amount', order_amount,
    'final_amount', final_amount,
    'applies_to', coupon_record.applies_to,
    'description', coupon_record.description
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.apply_coupon(text, text, uuid, numeric) TO authenticated;

-- Summary query to verify seeded data
SELECT
  SUBSTRING(code FROM '^[^-]+') as coupon_type,
  COUNT(*) as total_coupons,
  discount_value,
  description
FROM public.coupons
GROUP BY SUBSTRING(code FROM '^[^-]+'), discount_value, description
ORDER BY discount_value DESC;