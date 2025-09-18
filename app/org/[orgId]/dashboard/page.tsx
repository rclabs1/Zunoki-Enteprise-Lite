'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTenantContext } from '../layout';

export default function OrganizationDashboard() {
  const params = useParams();
  const router = useRouter();
  const tenantContext = useTenantContext();

  console.log('🏢 Dashboard - About to redirect to shell with org:', params.orgId);

  // Redirect to the shell with organization context
  // The shell will pick up the organization from the URL parameter
  router.push(`/shell?org=${params.orgId}`);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}