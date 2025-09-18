-- Coupon database update script
-- Run this in Supabase SQL Editor to update existing coupon system

-- Step 1: Remove the old LAUNCH25 single coupon (if it exists)
DELETE FROM public.coupons WHERE code = 'LAUNCH25';

-- Step 2: Generate 300 individual LAUNCH25 coupons (consistent with other coupons)
INSERT INTO public.coupons (code, discount_type, discount_value, max_uses, description, applies_to)
SELECT
  'LAUNCH25-' || LPAD(generate_series::text, 3, '0'),
  'percentage',
  25,
  1,
  '25% off first month - Launch special',
  'first_month'
FROM generate_series(1, 300);

-- Verification query: Check total coupon counts
SELECT
  SUBSTRING(code FROM '^[^-]+') as coupon_type,
  COUNT(*) as total_coupons,
  discount_value,
  max_uses,
  description
FROM public.coupons
GROUP BY SUBSTRING(code FROM '^[^-]+'), discount_value, max_uses, description
ORDER BY discount_value DESC;

-- Expected results after update:
-- VIP99: 100 coupons (99% off)
-- ELITE90: 100 coupons (90% off)
-- PREMIUM85: 100 coupons (85% off)
-- SILVER80: 100 coupons (80% off)
-- LAUNCH25: 300 coupons (25% off)
-- TOTAL: 700 individual coupon codes