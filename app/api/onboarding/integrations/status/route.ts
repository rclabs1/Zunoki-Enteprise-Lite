import { NextRequest, NextResponse } from 'next/server';
import { withFirebaseAuth } from '@/lib/auth-middleware';
import { SetupIntegrationBridge } from '@/lib/services/setup-integration-bridge';

export async function GET(request: NextRequest) {
  return withFirebaseAuth(request, async (req, user) => {
    try {
      const statuses = await SetupIntegrationBridge.getConnectionStatuses(user.uid);
      
      return NextResponse.json({
        success: true,
        statuses
      });

    } catch (error) {
      console.error('Error getting integration statuses:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get integration statuses' },
        { status: 500 }
      );
    }
  });
}