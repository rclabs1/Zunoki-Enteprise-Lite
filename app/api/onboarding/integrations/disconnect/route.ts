import { NextRequest, NextResponse } from 'next/server';
import { withFirebaseAuth } from '@/lib/auth-middleware';
import { SetupIntegrationBridge } from '@/lib/services/setup-integration-bridge';

export async function POST(request: NextRequest) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      const { platform } = await req.json();

      if (!platform) {
        return NextResponse.json(
          { success: false, error: 'Platform is required' },
          { status: 400 }
        );
      }

      const result = await SetupIntegrationBridge.disconnect(user.uid, platform);
      
      return NextResponse.json(result);

    } catch (error) {
      console.error('Error disconnecting integration:', error);
      return NextResponse.json(
        { success: false, error: 'Disconnect failed' },
        { status: 500 }
      );
    }
  });
}