import { NextRequest, NextResponse } from 'next/server';
import { authenticateFirebaseUser } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase/client';

export interface TenantContext {
  organizationId: string;
  userId: string;
  userRole: string;
  permissions: Record<string, any>;
  organization: any;
}

export interface TenantRequest extends NextRequest {
  tenant?: TenantContext;
}

/**
 * Extract tenant identifier from request
 * Priority: Header > Subdomain > Query param
 */
function extractTenantIdentifier(request: NextRequest): string | null {
  // 1. Check X-Organization-ID header
  const headerOrgId = request.headers.get('X-Organization-ID');
  if (headerOrgId) {
    return headerOrgId;
  }

  // 2. Check X-Organization-Slug header
  const headerSlug = request.headers.get('X-Organization-Slug');
  if (headerSlug) {
    return headerSlug;
  }

  // 3. Extract from subdomain (e.g., acme.zunoki.com)
  const host = request.headers.get('host');
  if (host) {
    const subdomain = host.split('.')[0];
    // Skip common subdomains
    if (!['www', 'app', 'api', 'admin', 'localhost'].includes(subdomain)) {
      return subdomain;
    }
  }

  // 4. Check query parameter
  const url = new URL(request.url);
  const queryOrg = url.searchParams.get('org');
  if (queryOrg) {
    return queryOrg;
  }

  return null;
}

/**
 * Get organization by identifier (slug, domain, or ID)
 */
async function getOrganizationByIdentifier(identifier: string) {
  try {
    // Try by ID first (UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let query = supabase
      .from('organizations')
      .select('*')
      .eq('subscription_status', 'active');

    if (uuidRegex.test(identifier)) {
      query = query.eq('id', identifier);
    } else {
      // Try by slug first, then domain
      query = query.or(`slug.eq.${identifier},domain.eq.${identifier}`);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Failed to get organization:', error);
    return null;
  }
}

/**
 * Get user's role and permissions in organization
 */
async function getUserOrgContext(userId: string, organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('organization_memberships')
      .select('role, permissions, status')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Failed to get user org context:', error);
    return null;
  }
}

/**
 * Multi-tenant middleware for API routes
 */
export async function withTenantContext(
  request: NextRequest,
  handler: (request: TenantRequest, tenant: TenantContext) => Promise<NextResponse>,
  options: {
    requireRole?: 'viewer' | 'member' | 'manager' | 'admin' | 'owner';
    requirePermission?: string;
    allowNoTenant?: boolean;
  } = {}
): Promise<NextResponse> {
  try {
    // 1. Authenticate user
    const authResult = await authenticateFirebaseUser(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const user = authResult.user!;

    // 2. Extract tenant identifier
    const tenantIdentifier = extractTenantIdentifier(request);

    if (!tenantIdentifier) {
      if (options.allowNoTenant) {
        // Proceed without tenant context
        const tenantRequest = request as TenantRequest;
        return handler(tenantRequest, {
          organizationId: '',
          userId: user.uid,
          userRole: 'member',
          permissions: {},
          organization: null,
        });
      }

      return NextResponse.json(
        { error: 'Missing tenant identifier' },
        { status: 400 }
      );
    }

    // 3. Get organization
    const organization = await getOrganizationByIdentifier(tenantIdentifier);
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // 4. Check user belongs to organization
    const userOrgContext = await getUserOrgContext(user.uid, organization.id);
    if (!userOrgContext) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      );
    }

    // 5. Check role requirements
    if (options.requireRole) {
      const roleHierarchy = ['viewer', 'member', 'manager', 'admin', 'owner'];
      const userLevel = roleHierarchy.indexOf(userOrgContext.role);
      const requiredLevel = roleHierarchy.indexOf(options.requireRole);

      if (userLevel < requiredLevel) {
        return NextResponse.json(
          { error: 'Insufficient role permissions' },
          { status: 403 }
        );
      }
    }

    // 6. Check permission requirements
    if (options.requirePermission) {
      const hasPermission =
        ['owner', 'admin'].includes(userOrgContext.role) ||
        userOrgContext.permissions?.[options.requirePermission];

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // 7. Set Supabase RLS context
    await supabase.rpc('set_current_user_id', { user_id: user.uid });

    // 8. Create tenant context
    const tenantContext: TenantContext = {
      organizationId: organization.id,
      userId: user.uid,
      userRole: userOrgContext.role,
      permissions: userOrgContext.permissions || {},
      organization,
    };

    // 9. Add tenant to request
    const tenantRequest = request as TenantRequest;
    tenantRequest.tenant = tenantContext;

    // 10. Call handler
    return handler(tenantRequest, tenantContext);

  } catch (error) {
    console.error('Tenant middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper for tenant-aware data queries
 */
export function createTenantQuery(baseQuery: any, tenantContext: TenantContext) {
  return baseQuery.eq('organization_id', tenantContext.organizationId);
}

/**
 * Middleware specifically for organization management endpoints
 */
export async function withOrgManagement(
  request: NextRequest,
  handler: (request: TenantRequest, tenant: TenantContext) => Promise<NextResponse>
): Promise<NextResponse> {
  return withTenantContext(request, handler, {
    requireRole: 'admin',
  });
}

/**
 * Middleware for data access endpoints
 */
export async function withDataAccess(
  request: NextRequest,
  handler: (request: TenantRequest, tenant: TenantContext) => Promise<NextResponse>
): Promise<NextResponse> {
  return withTenantContext(request, handler, {
    requireRole: 'viewer',
  });
}

/**
 * Extract tenant info from different sources
 */
export function getTenantFromRequest(request: NextRequest): {
  method: 'header' | 'subdomain' | 'query' | 'none';
  identifier: string | null;
} {
  // Check headers first
  const headerOrgId = request.headers.get('X-Organization-ID');
  if (headerOrgId) {
    return { method: 'header', identifier: headerOrgId };
  }

  const headerSlug = request.headers.get('X-Organization-Slug');
  if (headerSlug) {
    return { method: 'header', identifier: headerSlug };
  }

  // Check subdomain
  const host = request.headers.get('host');
  if (host) {
    const subdomain = host.split('.')[0];
    if (!['www', 'app', 'api', 'admin', 'localhost'].includes(subdomain)) {
      return { method: 'subdomain', identifier: subdomain };
    }
  }

  // Check query
  const url = new URL(request.url);
  const queryOrg = url.searchParams.get('org');
  if (queryOrg) {
    return { method: 'query', identifier: queryOrg };
  }

  return { method: 'none', identifier: null };
}