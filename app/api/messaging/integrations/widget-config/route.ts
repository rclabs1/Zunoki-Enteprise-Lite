import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminAuth } from '@/lib/firebase-admin';

async function verifyFirebaseToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header');
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    };
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    throw new Error('Invalid authentication token');
  }
}

async function getUserOrganization(supabase: any, userId: string) {
  try {
    const { data: memberships, error } = await supabase
      .from('organization_memberships')
      .select(`
        organization_id,
        role,
        organizations (
          id,
          name,
          subscription_status
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    const membership = memberships && memberships.length > 0 ? memberships[0] : null;

    if (error || !membership) {
      return null;
    }

    return {
      id: membership.organization_id,
      name: membership.organizations.name,
      status: membership.organizations.subscription_status,
      userRole: membership.role
    };
  } catch (error) {
    console.error('Error fetching user organization:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify Firebase authentication
    const firebaseUser = await verifyFirebaseToken(request);
    const supabase = createClient();

    // Get user's organization
    const userOrg = await getUserOrganization(supabase, firebaseUser.uid);
    if (!userOrg) {
      return NextResponse.json(
        { error: 'No active organization found for user' },
        { status: 403 }
      );
    }

    // Get user's website-chat integration
    const { data: integration, error } = await supabase
      .from('messaging_integrations')
      .select('*')
      .eq('organization_id', userOrg.id)
      .eq('platform', 'website-chat')
      .eq('status', 'active')
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { error: 'No active website chat integration found' },
        { status: 404 }
      );
    }

    // Extract widget configuration
    const widgetConfig = {
      widgetId: integration.config?.widgetId,
      webhookUrl: integration.config?.webhookUrl,
      integrationId: integration.id,
      organizationId: userOrg.id,
      businessType: integration.config?.businessType || 'support',
      primaryColor: integration.config?.primaryColor || '#3b82f6',
      position: integration.config?.position || 'bottom-right',
      widgetName: integration.config?.widgetName || 'Zunoki Support'
    };

    return NextResponse.json({
      success: true,
      widget: widgetConfig,
      organization: userOrg.name
    });

  } catch (error) {
    console.error('Error fetching widget config:', error);

    if (error.message === 'Invalid authentication token') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}