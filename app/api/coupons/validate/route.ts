import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { code, planKey, amount } = await request.json();

    // Validate input
    if (!code || !planKey || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: code, planKey, amount' },
        { status: 400 }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract Firebase ID token
    const idToken = authHeader.replace('Bearer ', '');

    // Verify Firebase token using the existing robust verification function
    const authResult = await verifyFirebaseToken(idToken);

    if (!authResult.success) {
      console.error('Firebase token verification failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error || 'Invalid authentication token' },
        { status: 401 }
      );
    }

    console.log('🎫 Validating coupon:', {
      code,
      planKey,
      amount,
      user: authResult.uid,
      duration: authResult.duration
    });

    // Create Supabase client
    const supabase = createClient();

    // Only validate the coupon without consuming it
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (couponError || !coupon) {
      return NextResponse.json(
        { error: 'Invalid or expired coupon code', success: false },
        { status: 400 }
      );
    }

    // Check if coupon is still available
    if (coupon.used_count >= coupon.max_uses) {
      return NextResponse.json(
        { error: 'Coupon has reached maximum usage', success: false },
        { status: 400 }
      );
    }

    // Check if user already used this coupon
    const { data: existingUsage } = await supabase
      .from('coupon_usage')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('user_id', authResult.uid)
      .single();

    if (existingUsage) {
      return NextResponse.json(
        { error: 'Coupon already used by this user', success: false },
        { status: 400 }
      );
    }

    // Calculate discount (validation only)
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = amount * (coupon.discount_value / 100);
    } else {
      discountAmount = coupon.discount_value;
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    const couponResult = {
      success: true,
      coupon_id: coupon.id,
      discount_type: coupon.discount_type,
      discount_percentage: coupon.discount_value,
      discount_amount: discountAmount,
      original_amount: amount,
      final_amount: finalAmount,
      applies_to: coupon.applies_to,
      description: coupon.description
    };

    if (couponError) {
      console.error('🚨 Coupon validation error:', couponError);
      return NextResponse.json(
        { error: 'Failed to validate coupon' },
        { status: 500 }
      );
    }

    if (!couponResult || !couponResult.success) {
      return NextResponse.json(
        {
          error: couponResult?.error || 'Invalid coupon code',
          success: false
        },
        { status: 400 }
      );
    }

    console.log('✅ Coupon validation successful:', couponResult);

    // Return successful validation
    return NextResponse.json({
      success: true,
      coupon: {
        code: code,
        discount_type: couponResult.discount_type,
        discount_percentage: couponResult.discount_percentage,
        discount_amount: couponResult.discount_amount,
        original_amount: couponResult.original_amount,
        final_amount: couponResult.final_amount,
        applies_to: couponResult.applies_to,
        description: couponResult.description
      }
    });

  } catch (error) {
    console.error('🚨 Coupon validation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}