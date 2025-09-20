import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // Handle Telegram webhook format
    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const telegramUserId = message.from.id.toString();
    const userName = message.from.first_name + (message.from.last_name ? ` ${message.from.last_name}` : '');
    const username = message.from.username;

    // Find the integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'telegram')
      .eq('status', 'active')
      .single();

    if (!integration) {
      console.log('No active Telegram integration found');
      return NextResponse.json({ ok: true });
    }

    // Create or find contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert({
        organization_id: integration.organization_id,
        name: userName,
        metadata: {
          telegram_user_id: telegramUserId,
          telegram_username: username,
          platform: 'telegram'
        },
        created_by: integration.created_by
      }, {
        onConflict: 'organization_id,metadata->>telegram_user_id',
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
        title: `Telegram conversation with ${userName}`,
        channel: 'telegram',
        status: 'active',
        metadata: {
          telegram_chat_id: message.chat.id.toString(),
          telegram_user_id: telegramUserId,
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
    const { data: messageRecord, error: messageError } = await supabase
      .from('messages')
      .insert({
        organization_id: integration.organization_id,
        conversation_id: conversation.id,
        content: message.text,
        role: 'user',
        message_type: 'text',
        metadata: {
          telegram_message_id: message.message_id.toString(),
          telegram_user_id: telegramUserId,
          telegram_chat_id: message.chat.id.toString(),
          platform: 'telegram'
        }
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    console.log('Successfully processed Telegram message:', messageRecord.id);

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
            platform: 'telegram',
            auto_response: true
          }
        });
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}