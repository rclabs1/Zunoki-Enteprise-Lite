import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // Handle chat widget message format
    const { message, visitor, widget_id } = body;

    if (!message?.content || !visitor?.id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the integration using messaging_integrations table
    console.log('🔍 WEBHOOK DEBUG - Looking for integration with widget_id:', widget_id);
    console.log('🔍 WEBHOOK DEBUG - Message content:', message?.content);
    console.log('🔍 WEBHOOK DEBUG - Visitor ID:', visitor?.id);

    const { data: integration } = await supabase
      .from('messaging_integrations')
      .select('*')
      .eq('platform', 'website-chat')
      .eq('status', 'active')
      .contains('config', { widgetId: widget_id })
      .single();

    if (!integration) {
      console.log('No active chat widget integration found');
      return NextResponse.json({ ok: true });
    }

    // Create or find contact - production-grade approach
    const visitorName = visitor.name || visitor.email || `Visitor ${visitor.id}`;

    // Smart returning visitor detection
    // 1. First try to find by visitor_id (most accurate)
    let { data: contact } = await supabase
      .from('contacts')
      .select()
      .eq('organization_id', integration.organization_id)
      .contains('metadata', { visitor_id: visitor.id })
      .single();

    // 2. If not found by visitor_id, check for returning visitor by IP address
    if (!contact && visitor.ip_address) {
      console.log('🔍 Visitor ID not found, checking for returning visitor by IP:', visitor.ip_address);

      const { data: ipContact } = await supabase
        .from('contacts')
        .select()
        .eq('organization_id', integration.organization_id)
        .contains('metadata', { ip_address: visitor.ip_address })
        .eq('platform', 'website-chat')
        .order('last_interaction', { ascending: false })
        .limit(1)
        .single();

      if (ipContact) {
        console.log('🎯 Found returning visitor by IP! Contact ID:', ipContact.id);

        // Update the existing contact with new visitor_id (visitor came back with new session)
        const { data: updatedContact } = await supabase
          .from('contacts')
          .update({
            metadata: {
              ...ipContact.metadata,
              visitor_id: visitor.id,
              widget_id: widget_id,
              user_agent: visitor.user_agent,
              ip_address: visitor.ip_address,
              referrer: visitor.referrer,
              page_url: visitor.page_url,
              previous_visitor_ids: [
                ...(ipContact.metadata.previous_visitor_ids || []),
                ipContact.metadata.visitor_id
              ].filter(Boolean),
              session_count: (ipContact.metadata.session_count || 1) + 1,
              returning_visitor: true,
              last_visit: new Date().toISOString()
            },
            last_interaction: new Date().toISOString(),
            name: visitor.name || visitor.email || ipContact.name || `Returning Visitor ${visitor.id.split('_').pop()}`
          })
          .eq('id', ipContact.id)
          .select()
          .single();

        contact = updatedContact;
      }
    }

    let contactError = null;

    // 3. If still not found, create new contact
    if (!contact) {
      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          organization_id: integration.organization_id,
          name: visitorName,
          email: visitor.email || null,
          platform: 'website-chat',
          last_interaction: new Date().toISOString(),
          metadata: {
            visitor_id: visitor.id,
            widget_id: widget_id,
            platform: 'website-chat',
            user_agent: visitor.user_agent,
            ip_address: visitor.ip_address,
            referrer: visitor.referrer,
            page_url: visitor.page_url,
            session_count: 1,
            returning_visitor: false,
            first_visit: new Date().toISOString(),
            last_visit: new Date().toISOString()
          },
          created_by: integration.created_by
        })
        .select()
        .single();

      contact = newContact;
      contactError = createError;
    }

    if (contactError) {
      console.error('Error creating/finding contact:', contactError);
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
    }

    // Create or find conversation - production-grade approach
    // First try to find existing active conversation for this contact
    let { data: conversation } = await supabase
      .from('conversations')
      .select()
      .eq('organization_id', integration.organization_id)
      .eq('contact_id', contact.id)
      .eq('channel', 'chat-widget')
      .eq('status', 'active')
      .single();

    let conversationError = null;

    // If no active conversation found, create new one
    if (!conversation) {
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          organization_id: integration.organization_id,
          contact_id: contact.id,
          title: `Website chat with ${visitorName}`,
          channel: 'chat-widget',
          status: 'active',
          metadata: {
            widget_id: widget_id,
            visitor_id: visitor.id,
            integration_id: integration.id,
            page_url: visitor.page_url
          },
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      conversation = newConversation;
      conversationError = createError;
    } else {
      // Update last_message_at for existing conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);

      conversationError = updateError;
    }

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
        content: message.content,
        role: 'user',
        message_type: message.type || 'text',
        metadata: {
          widget_message_id: message.id,
          visitor_id: visitor.id,
          widget_id: widget_id,
          platform: 'website-chat',
          page_url: visitor.page_url,
          timestamp: message.timestamp
        }
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    console.log('Successfully processed chat widget message:', messageRecord.id);

    // Trigger advanced AI agent processing
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, settings')
      .eq('organization_id', integration.organization_id)
      .eq('status', 'active');

    if (agents && agents.length > 0) {
      // Process with first available agent
      const agent = agents[0];

      // Get integration configuration for advanced features
      const config = integration.config || {};
      const businessType = config.businessType || 'support';
      const features = config.features || {};

      // Generate context-aware response based on business type and message content
      let agentResponse = '';
      let responseType = 'text';
      let additionalData = {};

      // Analyze message content for intent
      const messageContent = message.content.toLowerCase();

      if (businessType === 'delivery' && (messageContent.includes('order') || messageContent.includes('track'))) {
        // Delivery/Food service - Order tracking like Nugget
        agentResponse = `Hi! I'm ${agent.name} 🍕 I can help you track your order, check delivery status, or resolve any issues. What's your order number?`;
        responseType = 'order_tracking';
        additionalData = {
          quickActions: [
            { text: 'Track my order', action: 'track_order' },
            { text: 'Delivery time', action: 'delivery_eta' },
            { text: 'Change address', action: 'update_address' },
            { text: 'Cancel order', action: 'cancel_order' }
          ]
        };
      } else if (businessType === 'ecommerce' && features.orderTracking) {
        // E-commerce with order tracking
        agentResponse = `Hello! I'm ${agent.name} 🛍️ I can help you with order tracking, returns, product questions, or account issues. How can I assist you?`;
        additionalData = {
          quickActions: [
            { text: 'Track order', action: 'track_order' },
            { text: 'Return/Exchange', action: 'returns' },
            { text: 'Product info', action: 'product_help' },
            { text: 'Account help', action: 'account_support' }
          ]
        };
      } else if (businessType === 'sales' || features.salesAutomation) {
        // Sales automation
        agentResponse = `Hi! I'm ${agent.name} 💼 I'm here to help you find the perfect solution for your needs. What brings you here today?`;
        responseType = 'sales_qualified';
        additionalData = {
          leadCapture: true,
          quickActions: [
            { text: 'View pricing', action: 'pricing' },
            { text: 'Book demo', action: 'book_demo' },
            { text: 'Talk to sales', action: 'sales_contact' },
            { text: 'Free trial', action: 'start_trial' }
          ]
        };
      } else if (businessType === 'saas') {
        // SaaS platform support
        agentResponse = `Hello! I'm ${agent.name} ⚡ I can help with technical issues, billing questions, feature requests, or account management. What do you need help with?`;
        additionalData = {
          quickActions: [
            { text: 'Technical issue', action: 'tech_support' },
            { text: 'Billing question', action: 'billing' },
            { text: 'Feature request', action: 'feature_request' },
            { text: 'Account settings', action: 'account_help' }
          ]
        };
      } else {
        // General intelligent support with seamless handoff
        agentResponse = `Hello! I'm ${agent.name} 👋 ${config.welcomeMessage || "I'm here to help you with any questions or issues you might have. How can I assist you today?"}`;
      }

      // Add seamless handoff capabilities to all business types
      if (!additionalData.quickActions) {
        additionalData.quickActions = [];
      }

      // Add handoff options to existing quick actions
      additionalData.quickActions.push(
        { text: 'Continue on WhatsApp', action: 'handoff_whatsapp', icon: '💬' },
        { text: 'Continue via Email', action: 'handoff_email', icon: '📧' },
        { text: 'Send Catalogue', action: 'send_catalogue', icon: '📋' }
      );

      // Add seamless handoff metadata
      additionalData.seamlessHandoff = {
        enabled: true,
        channels: ['whatsapp', 'email'],
        catalogueSupport: true,
        contextPreservation: true,
        conversationId: conversation.id,
        contactId: contact.id
      };

      // Add proactive notifications if enabled
      if (features.smartNotifications) {
        additionalData.notifications = {
          enabled: true,
          types: ['order_updates', 'promotions', 'support_followup']
        };
      }

      // Save agent message with enhanced metadata
      await supabase
        .from('messages')
        .insert({
          organization_id: integration.organization_id,
          conversation_id: conversation.id,
          content: agentResponse,
          role: 'assistant',
          message_type: responseType,
          agent_id: agent.id,
          metadata: {
            agent_name: agent.name,
            platform: 'website-chat',
            auto_response: true,
            business_type: businessType,
            response_type: responseType,
            features_enabled: features,
            additional_data: additionalData
          }
        });

      // Return enhanced response for Zunoki widget
      return NextResponse.json({
        ok: true,
        response: {
          message: agentResponse,
          agent: agent.name,
          type: responseType,
          business_type: businessType,
          quick_actions: additionalData.quickActions || [],
          notifications: additionalData.notifications || null,
          lead_capture: additionalData.leadCapture || false,
          seamless_handoff: additionalData.seamlessHandoff || null,
          conversation_context: {
            conversation_id: conversation.id,
            contact_id: contact.id,
            organization_id: integration.organization_id,
            agent_id: agent.id,
            visitor_data: {
              name: visitor.name || null,
              email: visitor.email || null,
              page_url: visitor.page_url || null
            }
          },
          branding: {
            color: config.primaryColor || '#3b82f6',
            position: config.position || 'bottom-right',
            name: config.widgetName || 'Zunoki Support',
            powered_by: 'Powered by Zunoki',
            zunoki_branding: true
          }
        }
      });
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Error processing chat widget webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}