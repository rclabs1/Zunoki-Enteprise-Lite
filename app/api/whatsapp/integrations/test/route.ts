import { NextRequest, NextResponse } from 'next/server';
import { withFirebaseAuth } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase/client';
import whatsappService from '@/lib/whatsapp-service';

// Test WhatsApp integration connection
export async function POST(request: NextRequest) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      const userId = user.uid;

    // Get the user's active WhatsApp integration
    const { data: integration, error } = await supabase
      .from('whatsapp_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No active WhatsApp integration found. Please configure your integration first.' 
        },
        { status: 404 }
      );
    }

    // Test the connection based on provider
    let testResult;
    
    if (integration.provider === 'twilio') {
      testResult = await testTwilioConnection(integration);
    } else if (integration.provider === 'whatsapp_business') {
      testResult = await testMetaConnection(integration);
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported provider' },
        { status: 400 }
      );
    }

    if (testResult.success) {
      // Update integration status to indicate successful test
      await supabase
        .from('whatsapp_integrations')
        .update({ 
          last_sync_at: new Date().toISOString(),
          status: 'active'
        })
        .eq('id', integration.id);

      return NextResponse.json({
        success: true,
        message: 'Connection test successful',
        provider: integration.provider,
        testDetails: testResult.details
      });
    } else {
      // Update integration status to indicate error
      await supabase
        .from('whatsapp_integrations')
        .update({ status: 'error' })
        .eq('id', integration.id);

      return NextResponse.json({
        success: false,
        error: testResult.error,
        provider: integration.provider
      }, { status: 400 });
    }

    } catch (error: any) {
      console.error('WhatsApp integration test error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// Test Twilio connection
async function testTwilioConnection(integration: any) {
  try {
    // Create a simple test by verifying account details
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${integration.account_sid}.json`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${integration.account_sid}:${integration.auth_token_encrypted}`
          ).toString('base64')}`,
        },
      }
    );

    if (response.ok) {
      const accountData = await response.json();
      return {
        success: true,
        details: {
          accountSid: accountData.sid,
          friendlyName: accountData.friendly_name,
          status: accountData.status,
          type: accountData.type
        }
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: `Twilio API error: ${errorData.message || 'Authentication failed'}`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Connection failed: ${error.message}`
    };
  }
}

// Test Meta WhatsApp Business API connection
async function testMetaConnection(integration: any) {
  try {
    // Test by getting business account information
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${integration.business_account_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${integration.auth_token_encrypted}`,
        },
      }
    );

    if (response.ok) {
      const businessData = await response.json();
      return {
        success: true,
        details: {
          businessAccountId: businessData.id,
          name: businessData.name,
          status: 'verified'
        }
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: `Meta API error: ${errorData.error?.message || 'Authentication failed'}`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Connection failed: ${error.message}`
    };
  }
}