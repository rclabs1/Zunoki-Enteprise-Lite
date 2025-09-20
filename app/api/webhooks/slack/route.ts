import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.text();
    const timestamp = request.headers.get('x-slack-request-timestamp');
    const signature = request.headers.get('x-slack-signature');

    // Parse the Slack event
    const event = JSON.parse(body);

    // Handle URL verification challenge
    if (event.type === 'url_verification') {
      return NextResponse.json({ challenge: event.challenge });
    }

    // Handle message events
    if (event.type === 'event_callback' && event.event?.type === 'message') {
      const slackEvent = event.event;

      // Skip bot messages to avoid loops
      if (slackEvent.bot_id || slackEvent.subtype) {
        return NextResponse.json({ ok: true });
      }

      // Find the integration for this team
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('type', 'slack')
        .eq('status', 'active')
        .single();

      if (!integration) {
        console.log('No active Slack integration found');
        return NextResponse.json({ ok: true });
      }

      // Create or find contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .upsert({
          organization_id: integration.organization_id,
          name: `Slack User ${slackEvent.user}`,
          metadata: {
            slack_user_id: slackEvent.user,
            slack_channel: slackEvent.channel,
            platform: 'slack'
          },
          created_by: integration.created_by
        }, {
          onConflict: 'organization_id,metadata->>slack_user_id',
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
          title: `Slack conversation with ${contact.name}`,
          channel: 'slack',
          status: 'active',
          metadata: {
            slack_channel: slackEvent.channel,
            slack_team: event.team_id,
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
          content: slackEvent.text || '',
          role: 'user',
          message_type: 'text',
          metadata: {
            slack_ts: slackEvent.ts,
            slack_user: slackEvent.user,
            slack_channel: slackEvent.channel,
            platform: 'slack'
          }
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error creating message:', messageError);
        return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
      }

      console.log('Successfully processed Slack message:', message.id);

      // Trigger agent processing if available
      const { data: agents } = await supabase
        .from('agents')
        .select('id, name, settings')
        .eq('organization_id', integration.organization_id)
        .eq('status', 'active');

      if (agents && agents.length > 0) {
        // Process with first available agent (you can add logic for agent selection)
        const agent = agents[0];

        // Create agent response (this would typically call your AI service)
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
              platform: 'slack',
              auto_response: true
            }
          });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Error processing Slack webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}