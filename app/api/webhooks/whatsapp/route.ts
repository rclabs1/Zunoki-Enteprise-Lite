import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // Handle Twilio WhatsApp webhook format
    const from = body.From || body.from;
    const to = body.To || body.to;
    const messageBody = body.Body || body.body || body.text;
    const messageId = body.MessageSid || body.id;

    if (!from || !messageBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract phone number (remove 'whatsapp:' prefix)
    const phoneNumber = from.replace('whatsapp:', '');

    // Find the integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'whatsapp')
      .eq('status', 'active')
      .single();

    if (!integration) {
      console.log('No active WhatsApp integration found');
      return NextResponse.json({ ok: true });
    }

    // Create or find contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert({
        organization_id: integration.organization_id,
        phone: phoneNumber,
        name: `WhatsApp ${phoneNumber}`,
        metadata: {
          whatsapp_number: phoneNumber,
          platform: 'whatsapp'
        },
        created_by: integration.created_by
      }, {
        onConflict: 'organization_id,phone',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (contactError) {
      console.error('Error creating/finding contact:', contactError);
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
    }

    // Create or find conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .upsert({
        organization_id: integration.organization_id,
        contact_id: contact.id,
        title: `WhatsApp conversation with ${phoneNumber}`,
        channel: 'whatsapp',
        status: 'active',
        metadata: {
          whatsapp_number: phoneNumber,
          integration_id: integration.id
        },
        last_message_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,contact_id,channel',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (conversationError) {
      console.error('Error creating/finding conversation:', conversationError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        organization_id: integration.organization_id,
        conversation_id: conversation.id,
        content: messageBody,
        role: 'user',
        message_type: 'text',
        metadata: {
          whatsapp_message_id: messageId,
          whatsapp_from: from,
          whatsapp_to: to,
          platform: 'whatsapp'
        }
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    console.log('Successfully processed WhatsApp message:', message.id);

    // Trigger agent processing if available
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, settings')
      .eq('organization_id', integration.organization_id)
      .eq('status', 'active');

    if (agents && agents.length > 0) {
      // Process with first available agent
      const agent = agents[0];

      // Create agent response
      const agentResponse = `Hello! I'm ${agent.name}, how can I help you today?`;

      // Save agent message
      await supabase
        .from('messages')
        .insert({
          organization_id: integration.organization_id,
          conversation_id: conversation.id,
          content: agentResponse,
          role: 'assistant',
          message_type: 'text',
          agent_id: agent.id,
          metadata: {
            agent_name: agent.name,
            platform: 'whatsapp',
            auto_response: true
          }
        });
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle verification for WhatsApp webhooks
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge);
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}