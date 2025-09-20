'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tenantService } from '@/lib/multi-tenant/tenant-service';
import { tenantConfigService } from '@/lib/multi-tenant/tenant-config';
import { useAuth } from '@/contexts/auth-context';
import { OnboardingGuard } from '@/components/onboarding-guard';

interface TenantLayoutProps {
  children: React.ReactNode;
}

interface TenantContext {
  organizationId: string;
  organizationName: string;
  userRole: string;
  branding: any;
  config: any;
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tenantContext, setTenantContext] = useState<TenantContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgId = params.orgId as string;

  useEffect(() => {
    async function initializeTenant() {
      if (authLoading) return;

      if (!user) {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(window.location.pathname);
        router.push(`/login?returnUrl=${returnUrl}`);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🏢 TenantLayout - Starting initialization for orgId:', orgId);

        // Get organization by orgId
        const organization = await tenantService.getOrganizationByIdentifier(orgId);
        console.log('🏢 TenantLayout - Organization lookup result:', organization);
        if (!organization) {
          console.error('🏢 TenantLayout - Organization not found for:', orgId);
          setError('Organization not found');
          return;
        }

        // Set tenant context
        console.log('🏢 TenantLayout - Setting tenant context for org:', organization.id);
        const context = await tenantService.setTenantContext(organization.id);
        console.log('🏢 TenantLayout - Tenant context result:', context);
        if (!context) {
          console.error('🏢 TenantLayout - Access denied for user to org:', organization.id);
          setError('Access denied to this organization');
          return;
        }

        // Get branding configuration
        const branding = await tenantConfigService.getBranding();
        const config = await tenantConfigService.getConfig();

        setTenantContext({
          organizationId: organization.id,
          organizationName: organization.name,
          userRole: context.userRole,
          branding,
          config,
        });

        // Apply branding to document
        applyBranding(branding);

      } catch (err) {
        console.error('Failed to initialize tenant:', err);
        setError('Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    initializeTenant();
  }, [user, authLoading, orgId, router]);

  function applyBranding(branding: any) {
    // Apply custom CSS variables for theming
    const root = document.documentElement;

    if (branding.primary_color) {
      root.style.setProperty('--primary-color', branding.primary_color);
    }

    if (branding.secondary_color) {
      root.style.setProperty('--secondary-color', branding.secondary_color);
    }

    // Update page title
    if (branding.name) {
      document.title = branding.name;
    }

    // Update favicon if provided
    if (branding.favicon_url) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = branding.favicon_url;
      }
    }

    // Apply custom CSS if provided
    if (branding.custom_css) {
      const existingStyle = document.getElementById('tenant-custom-css');
      if (existingStyle) {
        existingStyle.remove();
      }

      const style = document.createElement('style');
      style.id = 'tenant-custom-css';
      style.textContent = branding.custom_css;
      document.head.appendChild(style);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Error</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => router.push('/shell')}
            className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!tenantContext) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-900 mb-4">Organization Not Found</h1>
          <button
            onClick={() => router.push('/shell')}
            className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tenant Context Provider */}
      <TenantContextProvider value={tenantContext}>
        {/* OnboardingGuard - Check subscription status for this organization */}
        <OnboardingGuard>
          {/* Organization Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  {tenantContext.branding.logo_url ? (
                    <img
                      src={tenantContext.branding.logo_url}
                      alt={tenantContext.organizationName}
                      className="h-8 w-auto"
                    />
                  ) : (
                    <span className="text-xl font-bold" style={{ color: tenantContext.branding.primary_color }}>
                      {tenantContext.organizationName}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    Role: {tenantContext.userRole}
                  </span>

                  <button
                    onClick={() => router.push('/shell')}
                    className="text-sm text-gray-700 hover:text-gray-900"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </OnboardingGuard>
      </TenantContextProvider>
    </div>
  );
}

/**
 * React context for tenant information
 */
import { createContext, useContext } from 'react';

const TenantContext = createContext<TenantContext | null>(null);

function TenantContextProvider({ children, value }: { children: React.ReactNode; value: TenantContext }) {
  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantContext must be used within a TenantContextProvider');
  }
  return context;
}