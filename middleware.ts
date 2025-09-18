import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequestEdge } from '@/lib/edge-auth';

/**
 * Multi-tenant routing middleware for Next.js
 * Handles subdomain and custom domain routing for organizations
 * Edge Runtime compatible - no Firebase Admin SDK imports
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Skip middleware for certain paths
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  // Extract tenant information using Edge-compatible function
  const tenantInfo = getTenantFromRequestEdge(request);

  // Handle different tenant routing scenarios
  if (tenantInfo.method === 'subdomain' && tenantInfo.identifier) {
    return handleSubdomainRouting(request, tenantInfo.identifier);
  }

  if (tenantInfo.method === 'none') {
    return handleNoTenantRouting(request);
  }

  // For header or query-based tenant identification, continue normally
  return NextResponse.next();
}

/**
 * Skip middleware for static files, API routes, and other system paths
 */
function shouldSkipMiddleware(pathname: string): boolean {
  const skipPaths = [
    '/_next',
    '/api/auth',
    '/api/health',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/public',
    '/.well-known',
  ];

  const skipExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.css', '.js', '.woff', '.woff2'];

  return (
    skipPaths.some(path => pathname.startsWith(path)) ||
    skipExtensions.some(ext => pathname.endsWith(ext))
  );
}

/**
 * Handle subdomain-based tenant routing
 * e.g., acme.zunoki.com -> /org/acme/...
 */
async function handleSubdomainRouting(request: NextRequest, subdomain: string) {
  const { pathname, search } = request.nextUrl;

  // Create new URL with organization context
  const url = new URL(request.url);

  // Rewrite to include organization in path
  url.pathname = `/org/${subdomain}${pathname}`;

  // Add organization header for API consumption
  const response = NextResponse.rewrite(url);
  response.headers.set('X-Organization-Slug', subdomain);
  response.headers.set('X-Tenant-Method', 'subdomain');

  return response;
}

/**
 * Handle routing when no tenant is identified
 * Redirect to tenant selection or marketing pages
 */
function handleNoTenantRouting(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to marketing/auth pages without tenant
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/pricing',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/invite',
    '/setup',
    '/onboarding',
    '/select-organization',
    '/shell', // Allow shell route - OnboardingGuard handles auth
    '/connect-messaging', // Allow connect messaging page
  ];

  if (publicPaths.includes(pathname) || pathname.startsWith('/auth/') || pathname.startsWith('/onboarding/') || pathname.startsWith('/org/') || pathname.startsWith('/invite/')) {
    return NextResponse.next();
  }

  // For authenticated users trying to access app routes,
  // redirect to select-organization which handles subscription routing
  // This lets select-org route users based on payment status and org count
  const url = new URL('/select-organization', request.url);
  return NextResponse.redirect(url);
}

/**
 * Custom domain handling (for enterprise customers)
 * This would typically be handled by a reverse proxy in production
 */
async function handleCustomDomainRouting(request: NextRequest, domain: string) {
  const { pathname, search } = request.nextUrl;

  // In a real implementation, you'd:
  // 1. Look up the organization by custom domain
  // 2. Verify the domain is properly configured
  // 3. Route to the correct organization context

  // For now, treat it like subdomain routing
  const response = NextResponse.next();
  response.headers.set('X-Organization-Domain', domain);
  response.headers.set('X-Tenant-Method', 'domain');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};