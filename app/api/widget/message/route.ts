import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, message, contact, page } = await request.json();

    if (!apiKey || !message || !contact) {
      return NextResponse.json(
        { error: 'Missing required fields: apiKey, message, contact' },
        { status: 400 }
      );
    }

    console.log('📧 Website chat message received:', {
      apiKey: apiKey.substring(0, 8) + '...',
      message: message.substring(0, 50) + '...',
      contact: contact.email || contact.name || 'Anonymous',
      page: page || 'Unknown'
    });

    // Create Supabase client
    const supabase = createClient();

    // Find user by Firebase UID (apiKey)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, user_id')
      .eq('user_id', apiKey)
      .single();

    if (!profile) {
      console.log('❌ User not found for API key:', apiKey.substring(0, 8) + '...');
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id, organizations(id, name)')
      .eq('user_id', apiKey)
      .eq('status', 'active')
      .single();

    if (!membership) {
      console.log('❌ No organization found for user:', apiKey.substring(0, 8) + '...');
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    const organizationId = membership.organization_id;

    // Create or find contact
    let contactId: string;

    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', contact.email || '')
      .single();

    if (existingContact) {
      contactId = existingContact.id;
      console.log('📞 Found existing contact:', contactId);
    } else {
      // Create new contact
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          organization_id: organizationId,
          email: contact.email || null,
          phone: contact.phone || null,
          name: contact.name || 'Website Visitor',
          metadata: {
            source: 'website_widget',
            page: page || 'Unknown',
            userAgent: request.headers.get('user-agent') || '',
            ip: request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown'
          },
          created_by: apiKey
        })
        .select('id')
        .single();

      if (contactError) {
        console.error('❌ Error creating contact:', contactError);
        return NextResponse.json(
          { error: 'Failed to create contact' },
          { status: 500 }
        );
      }

      contactId = newContact.id;
      console.log('✅ Created new contact:', contactId);
    }

    // Find or create conversation
    let conversationId: string;

    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .eq('status', 'active')
      .single();

    if (existingConversation) {
      conversationId = existingConversation.id;
      console.log('💬 Found existing conversation:', conversationId);
    } else {
      // Create new conversation
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          organization_id: organizationId,
          contact_id: contactId,
          title: `Website Chat - ${contact.name || 'Visitor'}`,
          status: 'active',
          channel: 'web',
          metadata: {
            source: 'website_widget',
            page: page || 'Unknown'
          }
        })
        .select('id')
        .single();

      if (conversationError) {
        console.error('❌ Error creating conversation:', conversationError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }

      conversationId = newConversation.id;
      console.log('✅ Created new conversation:', conversationId);
    }

    // Create the message
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        organization_id: organizationId,
        conversation_id: conversationId,
        content: message,
        role: 'user',
        message_type: 'text',
        metadata: {
          source: 'website_widget',
          page: page || 'Unknown',
          contact: contact
        }
      })
      .select('id, created_at')
      .single();

    if (messageError) {
      console.error('❌ Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      );
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({
        last_message_at: newMessage.created_at,
        updated_at: newMessage.created_at
      })
      .eq('id', conversationId);

    console.log('✅ Website message saved successfully:', newMessage.id);

    return NextResponse.json({
      success: true,
      messageId: newMessage.id,
      conversationId: conversationId,
      contactId: contactId,
      response: {
        text: "Thank you for your message! Our team will get back to you shortly.",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Widget message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}