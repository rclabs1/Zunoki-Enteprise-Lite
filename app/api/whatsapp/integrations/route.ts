import { NextRequest, NextResponse } from 'next/server';
import { withFirebaseAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase/client';

// Get WhatsApp integrations for authenticated user
export async function GET(request: NextRequest) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      const userId = user.uid;

    const { data, error } = await supabase
      .from('whatsapp_integrations')
      .select('id, provider, phone_number, status, created_at, updated_at, last_sync_at')
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the first active integration or null
    const activeIntegration = data?.find(integration => integration.status === 'active') || null;
    
    return NextResponse.json({ 
      success: true,
      integration: activeIntegration,
      integrations: data 
    });

    } catch (error: any) {
      console.error('Get WhatsApp integrations error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// Create or update WhatsApp integration
export async function POST(request: NextRequest) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      const userId = user.uid;
      const body = await req.json();
    const { provider, config } = body;
    
    // Extract configuration based on provider
    let integrationData;
    if (provider === 'twilio') {
      const { accountSid, authToken, phoneNumber } = config;
      integrationData = {
        provider: 'twilio',
        phone_number: phoneNumber,
        account_sid: accountSid,
        auth_token_encrypted: authToken, // TODO: Encrypt in production
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`
      };
    } else if (provider === 'twilio_sandbox') {
      const { accountSid, authToken, phoneNumber, sandboxKeyword } = config;
      integrationData = {
        provider: 'twilio_sandbox',
        phone_number: phoneNumber || '+14155238886', // Default Twilio sandbox number
        account_sid: accountSid,
        auth_token_encrypted: authToken, // TODO: Encrypt in production
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`,
        sandbox_keyword: sandboxKeyword
      };
    } else if (provider === 'meta') {
      const { businessAccountId, accessToken, phoneNumber, verifyToken } = config;
      integrationData = {
        provider: 'whatsapp_business',
        phone_number: phoneNumber,
        business_account_id: businessAccountId,
        auth_token_encrypted: accessToken, // TODO: Encrypt in production
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`,
        verify_token: verifyToken
      };
    } else if (provider === 'meta_sandbox') {
      const { businessAccountId, accessToken, phoneNumber, verifyToken } = config;
      integrationData = {
        provider: 'whatsapp_business_sandbox',
        phone_number: phoneNumber,
        business_account_id: businessAccountId,
        auth_token_encrypted: accessToken, // TODO: Encrypt in production
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`,
        verify_token: verifyToken
      };
    } else {
      return NextResponse.json(
        { error: 'Unsupported provider. Use "twilio", "twilio_sandbox", "meta", or "meta_sandbox"' },
        { status: 400 }
      );
    }

    // Validate required fields based on provider
    if (!integrationData.phone_number) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if user already has an active integration (users can only have one active integration)
    const { data: existingIntegrations } = await supabase
      .from('whatsapp_integrations')
      .select('id, status')
      .eq('user_id', userId);

    // Deactivate any existing integrations
    if (existingIntegrations && existingIntegrations.length > 0) {
      await supabase
        .from('whatsapp_integrations')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    }

    // Create new integration
    const { data, error } = await supabase
      .from('whatsapp_integrations')
      .insert({
        user_id: userId,
        ...integrationData,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = data;

    // Remove sensitive data before sending response
    const { auth_token_encrypted, ...safeResult } = result;

    return NextResponse.json({
      success: true,
      integration: safeResult,
    });

    } catch (error: any) {
      console.error('Create/Update WhatsApp integration error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// Delete WhatsApp integration
export async function DELETE(request: NextRequest) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      const userId = user.uid;

      const { searchParams } = new URL(req.url);
    const integrationId = searchParams.get('id');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Verify the integration belongs to the user
    const { data: integration } = await supabase
      .from('whatsapp_integrations')
      .select('user_id')
      .eq('id', integrationId)
      .single();

    if (!integration || integration.user_id !== userId) {
      return NextResponse.json(
        { error: 'Integration not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the integration
    const { error } = await supabase
      .from('whatsapp_integrations')
      .delete()
      .eq('id', integrationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

    } catch (error: any) {
      console.error('Delete WhatsApp integration error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}