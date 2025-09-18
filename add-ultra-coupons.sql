-- Add ultra-exclusive 99.9% discount coupons to existing coupon system
-- Run this in Supabase SQL Editor after coupon-seed.sql

-- Generate 50 ULTRA999 coupons (99.9% off first month)
INSERT INTO public.coupons (code, discount_type, discount_value, max_uses, description, applies_to)
SELECT
  'ULTRA999-' || LPAD(generate_series::text, 2, '0'),
  'percentage',
  99.9,
  1,
  '99.9% off first month - Ultra exclusive users only',
  'first_month'
FROM generate_series(1, 50);

-- Verification query to check all coupon types including new ULTRA999
SELECT
  SUBSTRING(code FROM '^[^-]+') as coupon_type,
  COUNT(*) as total_coupons,
  discount_value,
  max_uses,
  description
FROM public.coupons
GROUP BY SUBSTRING(code FROM '^[^-]+'), discount_value, max_uses, description
ORDER BY discount_value DESC;

-- Expected results after running this:
-- ULTRA999: 50 coupons (99.9% off) <- NEW
-- VIP99: 100 coupons (99% off)
-- ELITE90: 100 coupons (90% off)
-- PREMIUM85: 100 coupons (85% off)
-- SILVER80: 100 coupons (80% off)
-- LAUNCH25: 300 coupons (25% off)
-- TOTAL: 750 individual coupon codes