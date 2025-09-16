import { NextRequest, NextResponse } from 'next/server';
import whatsappService, { WhatsAppWebhookPayload, TwilioWebhookMessage, WhatsAppBusinessMessage } from '@/lib/whatsapp-service';

// Handle WhatsApp webhook (both Twilio and WhatsApp Business API)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const contentType = request.headers.get('content-type') || '';
    
    // Determine if this is a Twilio webhook (form-encoded) or WhatsApp Business API (JSON)
    let payload: WhatsAppWebhookPayload;
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Twilio webhook
      const formData = new URLSearchParams(body);
      const twilioMessage: TwilioWebhookMessage = {
        AccountSid: formData.get('AccountSid') || '',
        MessageSid: formData.get('MessageSid') || '',
        From: formData.get('From') || '',
        To: formData.get('To') || '',
        Body: formData.get('Body') || '',
        MediaUrl0: formData.get('MediaUrl0') || undefined,
        MediaContentType0: formData.get('MediaContentType0') || undefined,
        NumMedia: formData.get('NumMedia') || '0',
      };
      
      payload = { messaging: [twilioMessage] };
    } else {
      // WhatsApp Business API webhook
      payload = JSON.parse(body);
    }

    // Process the webhook
    if (payload.messaging) {
      // Twilio webhook
      for (const message of payload.messaging) {
        await whatsappService.processTwilioWebhook(message);
      }
    } else if (payload.entry) {
      // WhatsApp Business API webhook
      for (const entry of payload.entry) {
        await whatsappService.processWhatsAppBusinessWebhook(entry);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle WhatsApp Business API webhook verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Verify webhook (WhatsApp Business API)
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token_here';
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new NextResponse(challenge, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (error) {
    console.error('WhatsApp webhook verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}