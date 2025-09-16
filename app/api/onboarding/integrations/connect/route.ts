import { NextRequest, NextResponse } from 'next/server';
import { withFirebaseAuth } from '@/lib/auth-middleware';
import { SetupIntegrationBridge } from '@/lib/services/setup-integration-bridge';

export async function POST(request: NextRequest) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      const { platform, provider, config } = await req.json();

      if (!platform) {
        return NextResponse.json(
          { success: false, error: 'Platform is required' },
          { status: 400 }
        );
      }

      let result;

      switch (platform) {
        case 'whatsapp':
          if (!provider) {
            return NextResponse.json(
              { success: false, error: 'Provider is required for WhatsApp' },
              { status: 400 }
            );
          }
          result = await SetupIntegrationBridge.connectWhatsApp(user.uid, provider, config || {});
          break;

        case 'google-ads':
        case 'google-analytics':
          result = await SetupIntegrationBridge.connectGooglePlatform(user.uid, platform);
          break;

        case 'mixpanel':
          if (!config?.apiKey || !config?.projectToken) {
            return NextResponse.json(
              { success: false, error: 'API key and project token are required for Mixpanel' },
              { status: 400 }
            );
          }
          result = await SetupIntegrationBridge.connectMixpanel(user.uid, config);
          break;

        case 'telegram':
          if (!config?.botToken) {
            return NextResponse.json(
              { success: false, error: 'Bot token is required for Telegram' },
              { status: 400 }
            );
          }
          result = await SetupIntegrationBridge.connectTelegram(user.uid, config);
          break;

        case 'gmail':
          if (!config?.email || !config?.appPassword) {
            return NextResponse.json(
              { success: false, error: 'Email and app password are required for Gmail' },
              { status: 400 }
            );
          }
          result = await SetupIntegrationBridge.connectGmail(user.uid, config);
          break;

        default:
          return NextResponse.json(
            { success: false, error: `Unsupported platform: ${platform}` },
            { status: 400 }
          );
      }

      return NextResponse.json(result);

    } catch (error) {
      console.error('Error in setup integration connect:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}