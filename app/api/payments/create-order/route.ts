import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';
import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, planKey, couponCode, finalAmount, customerInfo } = await request.json();

    // Validate input
    if (!amount || !currency || !planKey) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, planKey' },
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
      console.error('Firebase token verification failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error || 'Invalid authentication token' },
        { status: 401 }
      );
    }

    console.log('💳 Creating payment order:', {
      planKey,
      amount,
      finalAmount,
      couponCode,
      user: authResult.uid
    });

    // Create Supabase client
    const supabase = createClient();

    // Use finalAmount if coupon was applied, otherwise use original amount
    const orderAmount = finalAmount || amount;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(orderAmount * 100), // Razorpay expects amount in paise (smallest currency unit)
      currency: currency,
      receipt: `ord_${Date.now().toString().slice(-8)}`,
      notes: {
        userId: authResult.uid,
        planKey: planKey,
        couponCode: couponCode || '',
        originalAmount: amount,
        finalAmount: orderAmount
      }
    });

    console.log('✅ Razorpay order created:', razorpayOrder.id);

    // Create organization for the user
    const organizationName = customerInfo?.organizationName || `${customerInfo?.name}'s Organization` || 'My Organization';

    // Generate a unique slug from the organization name
    const baseSlug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    // Add timestamp to make it unique
    const uniqueSlug = `${baseSlug}-${Date.now()}`;

    // Create a new organization for the user
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        slug: uniqueSlug,
        is_trial: true,
        subscription_status: 'trialing'
      })
      .select('id')
      .single();

    if (orgError) {
      console.error('Failed to create organization:', orgError);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    const organizationId = newOrg.id;
    console.log('✅ Created new organization:', organizationName, organizationId);

    // Create or get user profile
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', authResult.uid)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authResult.uid,
          email: customerInfo?.email || authResult.email || '',
          full_name: customerInfo?.name || '',
          phone: customerInfo?.phone || ''
        });

      if (profileError) {
        console.error('Failed to create user profile:', profileError);
        // Don't fail the payment for this, but log it
      } else {
        console.log('✅ Created user profile for:', authResult.uid);
      }
    }

    // Create organization membership (make user the owner)
    const { error: membershipError } = await supabase
      .from('organization_memberships')
      .insert({
        organization_id: organizationId,
        user_id: authResult.uid,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString()
      });

    if (membershipError) {
      console.error('Failed to create organization membership:', membershipError);
      return NextResponse.json(
        { error: 'Failed to create organization membership' },
        { status: 500 }
      );
    }

    console.log('✅ Created organization membership for user:', authResult.uid);

    // Store payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: authResult.uid, // ✅ Add user_id to link payment to Firebase user
        organization_id: organizationId,
        amount: orderAmount,
        currency: currency,
        payment_method: 'razorpay',
        payment_status: 'pending',
        stripe_payment_intent_id: razorpayOrder.id, // Using this field for Razorpay order ID
        metadata: {
          planKey: planKey,
          couponCode: couponCode || null,
          originalAmount: amount,
          finalAmount: orderAmount,
          razorpayOrderId: razorpayOrder.id
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to store payment record:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    console.log('✅ Payment record stored:', payment.id);

    // Return Razorpay order details for frontend
    return NextResponse.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      },
      paymentRecord: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency
      }
    });

  } catch (error: any) {
    console.error('💥 Payment order creation failed:', error);

    // Handle Razorpay specific errors
    if (error.error?.code === 'BAD_REQUEST_ERROR') {
      return NextResponse.json(
        { error: 'Invalid payment details' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}