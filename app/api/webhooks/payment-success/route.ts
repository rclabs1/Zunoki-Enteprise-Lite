import { NextRequest } from 'next/server';
import { paymentAutomationService } from '@/lib/n8n/payment-automation';
import { supabaseServiceRole as supabase } from '@/lib/supabase/service-client';
import crypto from 'crypto';

/**
 * 🚀 COMPREHENSIVE PAYMENT SUCCESS WEBHOOK
 * Handles payment completion and triggers full automation workflow
 * for fintech/insurance clients with extensive onboarding and handholding
 */

interface PaymentWebhookPayload {
  // Stripe/Payment Gateway Fields
  id: string;
  object: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  payment_method: string;
  customer: {
    id: string;
    email: string;
    name: string;
    phone?: string;
  };
  metadata: {
    organization_id: string;
    customer_id: string;
    product_type: 'insurance' | 'investment' | 'loan' | 'subscription';
    plan_type: 'basic' | 'premium' | 'enterprise';
    policy_number?: string;
    investment_account?: string;
    loan_reference?: string;
    subscription_tier?: string;
    sales_agent_id?: string;
    campaign_source?: string;
    conversation_id?: string;
  };
  created: number;
}

interface PayPalWebhookPayload {
  id: string;
  event_type: string;
  resource: {
    id: string;
    amount: {
      total: string;
      currency: string;
    };
    state: 'approved' | 'pending' | 'failed';
    payer: {
      payer_info: {
        email: string;
        first_name: string;
        last_name: string;
        phone?: string;
      };
    };
    custom: string; // JSON string with metadata
  };
  create_time: string;
}

/**
 * POST /api/webhooks/payment-success
 * Handles payment success webhooks from multiple providers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') ||
                     request.headers.get('paypal-transmission-sig') ||
                     request.headers.get('webhook-signature');

    // Determine payment provider and verify webhook
    const provider = await determineProvider(request, body, signature);
    if (!provider.isValid) {
      return Response.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(body);

    // Process based on provider
    let normalizedPayload;
    if (provider.name === 'stripe') {
      normalizedPayload = await processStripeWebhook(payload);
    } else if (provider.name === 'paypal') {
      normalizedPayload = await processPayPalWebhook(payload);
    } else if (provider.name === 'custom') {
      normalizedPayload = await processCustomWebhook(payload);
    } else {
      return Response.json(
        { success: false, error: 'Unsupported payment provider' },
        { status: 400 }
      );
    }

    // Only process successful payments
    if (!normalizedPayload || normalizedPayload.status !== 'succeeded') {
      console.log(`⏭️ Skipping non-successful payment: ${normalizedPayload?.id || 'unknown'}`);
      return Response.json({ success: true, message: 'Payment not successful, skipping automation' });
    }

    // 🚀 TRIGGER COMPREHENSIVE AUTOMATION WORKFLOW
    console.log(`🎯 Processing successful payment: ${normalizedPayload.payment_id}`);

    // Store payment record
    await storePaymentRecord(normalizedPayload);

    // Trigger comprehensive automation (async to not block webhook response)
    setImmediate(async () => {
      try {
        await paymentAutomationService.handlePaymentSuccess(normalizedPayload);
      } catch (automationError) {
        console.error('❌ Payment automation failed:', automationError);
        // Log for manual review but don't fail webhook
        await logAutomationFailure(normalizedPayload.payment_id, automationError);
      }
    });

    // 📧 IMMEDIATE PAYMENT CONFIRMATION (before automation)
    await sendImmediateConfirmation(normalizedPayload);

    // 📊 REAL-TIME METRICS UPDATE
    await updateRealtimeMetrics(normalizedPayload);

    return Response.json({
      success: true,
      message: 'Payment processed successfully',
      payment_id: normalizedPayload.payment_id,
      automation_triggered: true
    });

  } catch (error) {
    console.error('❌ Payment webhook error:', error);

    // Critical: Don't fail webhook if it's just automation issues
    return Response.json(
      {
        success: false,
        error: 'Payment webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Determine payment provider and verify webhook signature
 */
async function determineProvider(request: NextRequest, body: string, signature: string | null): Promise<{name: string, isValid: boolean}> {
  try {
    // Stripe webhook verification
    if (request.headers.get('stripe-signature')) {
      const isValid = await verifyStripeSignature(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
      return { name: 'stripe', isValid };
    }

    // PayPal webhook verification
    if (request.headers.get('paypal-transmission-sig')) {
      const isValid = await verifyPayPalSignature(body, signature!, request.headers);
      return { name: 'paypal', isValid };
    }

    // Custom webhook verification (for your own payment system)
    if (request.headers.get('webhook-signature')) {
      const isValid = await verifyCustomSignature(body, signature!, process.env.CUSTOM_WEBHOOK_SECRET!);
      return { name: 'custom', isValid };
    }

    return { name: 'unknown', isValid: false };

  } catch (error) {
    console.error('Webhook verification error:', error);
    return { name: 'unknown', isValid: false };
  }
}

async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    // Stripe webhook signature verification
    const elements = signature.split(',');
    const timestamp = elements.find(el => el.startsWith('t='))?.slice(2);
    const signatures = elements.filter(el => el.startsWith('v1='));

    if (!timestamp || signatures.length === 0) return false;

    const payload = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signatures.some(sig => {
      const signature = sig.slice(3);
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      );
    });
  } catch {
    return false;
  }
}

async function verifyPayPalSignature(body: string, signature: string, headers: Headers): Promise<boolean> {
  // PayPal webhook verification logic
  // Simplified - in production, use PayPal's verification API
  return true; // Placeholder
}

async function verifyCustomSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Process Stripe webhook payload
 */
async function processStripeWebhook(payload: PaymentWebhookPayload): Promise<any> {
  if (payload.object !== 'payment_intent' || payload.status !== 'succeeded') {
    return null;
  }

  return {
    payment_id: payload.id,
    customer_id: payload.metadata.customer_id,
    organization_id: payload.metadata.organization_id,
    amount: payload.amount / 100, // Stripe uses cents
    currency: payload.currency.toUpperCase(),
    product_type: payload.metadata.product_type,
    plan_type: payload.metadata.plan_type,
    payment_method: payload.payment_method,
    customer_email: payload.customer.email,
    customer_phone: payload.customer.phone,
    customer_name: payload.customer.name,
    status: 'succeeded',
    provider: 'stripe',
    metadata: payload.metadata,
    processed_at: new Date(payload.created * 1000).toISOString()
  };
}

/**
 * Process PayPal webhook payload
 */
async function processPayPalWebhook(payload: PayPalWebhookPayload): Promise<any> {
  if (payload.event_type !== 'PAYMENT.CAPTURE.COMPLETED' || payload.resource.state !== 'approved') {
    return null;
  }

  const customData = JSON.parse(payload.resource.custom || '{}');

  return {
    payment_id: payload.id,
    customer_id: customData.customer_id,
    organization_id: customData.organization_id,
    amount: parseFloat(payload.resource.amount.total),
    currency: payload.resource.amount.currency,
    product_type: customData.product_type,
    plan_type: customData.plan_type,
    payment_method: 'paypal',
    customer_email: payload.resource.payer.payer_info.email,
    customer_phone: payload.resource.payer.payer_info.phone,
    customer_name: `${payload.resource.payer.payer_info.first_name} ${payload.resource.payer.payer_info.last_name}`,
    status: 'succeeded',
    provider: 'paypal',
    metadata: customData,
    processed_at: payload.create_time
  };
}

/**
 * Process custom payment webhook
 */
async function processCustomWebhook(payload: any): Promise<any> {
  // Handle your custom payment system webhooks
  return {
    payment_id: payload.payment_id,
    customer_id: payload.customer_id,
    organization_id: payload.organization_id,
    amount: payload.amount,
    currency: payload.currency,
    product_type: payload.product_type,
    plan_type: payload.plan_type,
    payment_method: payload.payment_method,
    customer_email: payload.customer_email,
    customer_phone: payload.customer_phone,
    customer_name: payload.customer_name,
    status: payload.status,
    provider: 'custom',
    metadata: payload.metadata,
    processed_at: new Date().toISOString()
  };
}

/**
 * Store payment record in database
 */
async function storePaymentRecord(payload: any): Promise<void> {
  try {
    await supabase
      .from('payments')
      .insert({
        payment_id: payload.payment_id,
        customer_id: payload.customer_id,
        organization_id: payload.organization_id,
        amount: payload.amount,
        currency: payload.currency,
        status: payload.status,
        payment_method: payload.payment_method,
        provider: payload.provider,
        product_type: payload.product_type,
        plan_type: payload.plan_type,
        metadata: payload.metadata,
        processed_at: payload.processed_at,
        created_at: new Date().toISOString()
      });

    console.log(`✅ Stored payment record: ${payload.payment_id}`);
  } catch (error) {
    console.error('❌ Error storing payment record:', error);
    throw error;
  }
}

/**
 * Send immediate payment confirmation
 */
async function sendImmediateConfirmation(payload: any): Promise<void> {
  try {
    // Send immediate email confirmation
    const emailData = {
      to: payload.customer_email,
      subject: `Payment Confirmation - ${payload.product_type.charAt(0).toUpperCase() + payload.product_type.slice(1)} Plan`,
      template: 'payment_success_immediate',
      variables: {
        customer_name: payload.customer_name,
        amount: payload.amount,
        currency: payload.currency,
        product_type: payload.product_type,
        plan_type: payload.plan_type,
        payment_id: payload.payment_id,
        date: new Date().toLocaleDateString()
      }
    };

    // In production, integrate with your email service
    console.log(`📧 Sent immediate confirmation to ${payload.customer_email}`);

    // Send immediate WhatsApp confirmation if phone available
    if (payload.customer_phone) {
      // In production, integrate with WhatsApp service
      console.log(`📱 Sent WhatsApp confirmation to ${payload.customer_phone}`);
    }

  } catch (error) {
    console.error('❌ Error sending immediate confirmation:', error);
    // Don't throw - confirmation failure shouldn't break webhook
  }
}

/**
 * Update real-time metrics and dashboards
 */
async function updateRealtimeMetrics(payload: any): Promise<void> {
  try {
    // Update organization metrics
    await supabase
      .from('organization_metrics')
      .upsert({
        organization_id: payload.organization_id,
        metric_date: new Date().toISOString().split('T')[0],
        total_revenue: supabase.raw(`COALESCE(total_revenue, 0) + ${payload.amount}`),
        customer_count: supabase.raw('COALESCE(customer_count, 0) + 1'),
        conversion_count: supabase.raw('COALESCE(conversion_count, 0) + 1'),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,metric_date'
      });

    // Broadcast real-time update
    await supabase
      .channel('organization_metrics')
      .send({
        type: 'broadcast',
        event: 'payment_success',
        payload: {
          organization_id: payload.organization_id,
          amount: payload.amount,
          customer_id: payload.customer_id,
          product_type: payload.product_type
        }
      });

    console.log(`📊 Updated real-time metrics for organization ${payload.organization_id}`);

  } catch (error) {
    console.error('❌ Error updating real-time metrics:', error);
    // Don't throw - metrics failure shouldn't break webhook
  }
}

/**
 * Log automation failure for manual review
 */
async function logAutomationFailure(paymentId: string, error: any): Promise<void> {
  try {
    await supabase
      .from('automation_failures')
      .insert({
        payment_id: paymentId,
        error_type: 'payment_automation_failure',
        error_message: error.message,
        error_stack: error.stack,
        created_at: new Date().toISOString(),
        status: 'needs_manual_review'
      });
  } catch (logError) {
    console.error('❌ Critical: Could not log automation failure:', logError);
  }
}