import { NextRequest } from 'next/server';
import { withDataAccess } from '@/lib/multi-tenant/tenant-middleware';
import { tenantCampaignService } from '@/lib/multi-tenant/tenant-aware-services';

/**
 * GET /api/organizations/campaigns - Get tenant's campaign metrics
 */
export async function GET(request: NextRequest) {
  return withDataAccess(request, async (req, tenant) => {
    try {
      const url = new URL(request.url);
      const platform = url.searchParams.get('platform') || undefined;
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');

      let campaigns;

      if (startDate && endDate) {
        // Get analytics for date range
        campaigns = await tenantCampaignService.getCampaignAnalytics({
          start: startDate,
          end: endDate,
        });
      } else {
        // Get raw campaign metrics
        campaigns = await tenantCampaignService.getCampaignMetrics(platform);
      }

      return Response.json({
        success: true,
        data: campaigns,
        tenant_context: {
          organization_id: tenant.organizationId,
          user_role: tenant.userRole,
        },
      });
    } catch (error) {
      console.error('Failed to get campaigns:', error);
      return Response.json(
        { success: false, error: 'Failed to get campaigns' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/organizations/campaigns - Store campaign metrics
 */
export async function POST(request: NextRequest) {
  return withDataAccess(request, async (req, tenant) => {
    try {
      const metrics = await request.json();

      if (!Array.isArray(metrics)) {
        return Response.json(
          { success: false, error: 'Metrics must be an array' },
          { status: 400 }
        );
      }

      const result = await tenantCampaignService.storeCampaignMetrics(metrics);

      return Response.json({
        success: true,
        data: result,
        message: `Stored ${result.length} campaign metrics`,
      });
    } catch (error) {
      console.error('Failed to store campaigns:', error);
      return Response.json(
        { success: false, error: 'Failed to store campaigns' },
        { status: 500 }
      );
    }
  });
}