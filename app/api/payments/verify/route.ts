import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planKey,
      couponCode
    } = await request.json();

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
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

    // Verify Firebase token
    const authResult = await verifyFirebaseToken(idToken);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Invalid authentication token' },
        { status: 401 }
      );
    }

    console.log('🔐 Verifying payment:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      user: authResult.uid
    });

    // Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Payment signature verification failed');
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    console.log('✅ Payment signature verified');

    // Create Supabase client
    const supabase = createClient();

    // Update payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        payment_status: 'completed',
        metadata: {
          ...{}, // Preserve existing metadata
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
          verified_at: new Date().toISOString()
        }
      })
      .eq('stripe_payment_intent_id', razorpay_order_id) // We stored order_id here
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to update payment record:', paymentError);
      return NextResponse.json(
        { error: 'Failed to update payment record' },
        { status: 500 }
      );
    }

    console.log('✅ Payment record updated:', payment.id);

    // Update organization subscription status to active
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        subscription_status: 'active',
        subscription_tier: payment.metadata?.planKey || 'business', // Set based on plan
        subscription_start: new Date().toISOString(),
        is_trial: false
      })
      .eq('id', payment.organization_id);

    if (orgError) {
      console.error('Failed to update organization subscription:', orgError);
      // Don't fail payment verification for this
    } else {
      console.log('✅ Organization subscription activated');
    }

    // If coupon was used, mark it as consumed
    if (couponCode) {
      console.log('🎫 Processing coupon consumption:', couponCode);

      // Apply the coupon (this will consume it)
      const { data: couponResult, error: couponError } = await supabase.rpc('apply_coupon', {
        coupon_code: couponCode,
        user_uid: authResult.uid,
        org_id: null,
        order_amount: payment.amount
      });

      if (couponError) {
        console.error('⚠️ Coupon consumption failed:', couponError);
        // Don't fail the payment verification, just log the issue
      } else {
        console.log('✅ Coupon consumed successfully');

        // Link coupon usage to payment
        await supabase
          .from('coupon_usage')
          .update({ payment_id: payment.id })
          .eq('coupon_id', couponResult.coupon_id)
          .eq('user_id', authResult.uid);
      }
    }

    // Store payment success data for redirect
    const successData = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      planKey: planKey,
      amount: payment.amount
    };

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.payment_status
      },
      redirectData: successData
    });

  } catch (error: any) {
    console.error('💥 Payment verification failed:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}