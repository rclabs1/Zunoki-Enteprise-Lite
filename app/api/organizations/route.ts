import { NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/multi-tenant/tenant-middleware';
import { tenantCampaignService } from '@/lib/multi-tenant/tenant-aware-services';

/**
 * GET /api/organizations - Get current tenant's organization info
 */
export async function GET(request: NextRequest) {
  return withTenantContext(
    request,
    async (req, tenant) => {
      try {
        return Response.json({
          success: true,
          data: {
            organization: tenant.organization,
            user_role: tenant.userRole,
            permissions: tenant.permissions,
          },
        });
      } catch (error) {
        console.error('Failed to get organization info:', error);
        return Response.json(
          { success: false, error: 'Failed to get organization info' },
          { status: 500 }
        );
      }
    },
    { requireRole: 'viewer' }
  );
}

/**
 * PUT /api/organizations - Update organization settings
 */
export async function PUT(request: NextRequest) {
  return withTenantContext(
    request,
    async (req, tenant) => {
      try {
        const updates = await request.json();

        // Validate updates
        const allowedFields = ['name', 'settings', 'billing_info'];
        const filteredUpdates = Object.keys(updates)
          .filter(key => allowedFields.includes(key))
          .reduce((obj: any, key) => {
            obj[key] = updates[key];
            return obj;
          }, {});

        // Update organization
        const { data, error } = await supabase
          .from('organizations')
          .update({
            ...filteredUpdates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tenant.organizationId)
          .select()
          .single();

        if (error) throw error;

        return Response.json({
          success: true,
          data,
          message: 'Organization updated successfully',
        });
      } catch (error) {
        console.error('Failed to update organization:', error);
        return Response.json(
          { success: false, error: 'Failed to update organization' },
          { status: 500 }
        );
      }
    },
    { requireRole: 'admin' }
  );
}