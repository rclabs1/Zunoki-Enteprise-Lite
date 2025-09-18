import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/multi-tenant/tenant-middleware';

export async function GET(request: NextRequest) {
  return withTenantContext(
    request,
    async (req, tenant) => {
      try {
        // Check actual payment status from organization subscription
        const hasValidSubscription = tenant.organization?.subscription_status === 'active' &&
                                    tenant.organization?.subscription_tier !== 'free';
        const isAdmin = tenant.userRole === 'admin';

        return Response.json({
          hasAccess: hasValidSubscription || isAdmin, // Admins always have access
          needsOnboarding: !hasValidSubscription && !isAdmin, // Need onboarding if not paid and not admin
          isAdmin: isAdmin,
          subscription: {
            status: hasValidSubscription ? 'active' : 'inactive',
            plan: tenant.organization?.subscription_tier || 'free',
            organization_id: tenant.organizationId
          },
          userProfile: {
            userId: tenant.userId,
            role: tenant.userRole,
            organizationId: tenant.organizationId
          }
        });

      } catch (error) {
        console.error('Subscription check error:', error);
        // Return safe defaults for users without payment
        return Response.json({
          hasAccess: false,
          needsOnboarding: true,
          isAdmin: false,
          subscription: { status: 'inactive', plan: 'free' },
          userProfile: null
        });
      }
    },
    { requireRole: 'viewer' } // Minimum role required
  );
}