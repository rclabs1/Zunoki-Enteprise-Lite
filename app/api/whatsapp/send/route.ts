import { NextRequest, NextResponse } from 'next/server';
import { withFirebaseAuth } from '@/lib/auth-middleware';
import whatsappService, { WhatsAppMessage } from '@/lib/whatsapp-service';

export async function POST(request: NextRequest) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      const userId = user.uid;

      const body = await req.json();
    const { conversationId, to, content, messageType = 'text', mediaUrl, senderType = 'agent', senderId } = body;

    // Validate required fields
    if (!to || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: to, content' },
        { status: 400 }
      );
    }

    // Get user's WhatsApp integration to determine the 'from' number
    const integration = await whatsappService.getWhatsAppIntegration(userId);
    if (!integration) {
      return NextResponse.json(
        { error: 'No active WhatsApp integration found' },
        { status: 404 }
      );
    }

    const message: WhatsAppMessage = {
      conversationId,
      senderType,
      senderId,
      content,
      messageType,
      mediaUrl,
      to,
      from: integration.phoneNumber,
    };

    // Send the message
    const result = await whatsappService.sendMessage(userId, message);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    } catch (error: any) {
      console.error('WhatsApp send message error:', error);
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}