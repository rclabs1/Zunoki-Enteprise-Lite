'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { checkUserAccess, UserAccess } from '@/lib/access-control';

interface AccessControlContextType {
  userAccess: UserAccess | null;
  loading: boolean;
  refresh: () => Promise<void>;
  isFeatureLimited: (feature: string) => boolean;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export function AccessControlProvider({
  children,
  organizationId
}: {
  children: React.ReactNode;
  organizationId: string;
}) {
  const { user } = useAuth();
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAccess = async () => {
    if (!user || !organizationId) {
      setUserAccess(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const access = await checkUserAccess(user.uid, organizationId);
      setUserAccess(access);
    } catch (error) {
      console.error('Failed to check user access:', error);
      setUserAccess({
        hasFullAccess: false,
        hasPaidSubscription: false,
        role: 'viewer',
        organizationId,
        limitedFeatures: ['All features'],
        upgradeRequired: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAccess();
  }, [user, organizationId]);

  const isFeatureLimited = (feature: string): boolean => {
    if (!userAccess) return true;
    if (userAccess.hasFullAccess) return false;

    const limitedFeatureMap: Record<string, boolean> = {
      'export': true,
      'advanced_analytics': true,
      'historical_data': true,
      'real_time_updates': true,
      'api_access': true,
      'integrations': true,
      'bulk_operations': true,
      'custom_reports': true
    };

    return limitedFeatureMap[feature] || false;
  };

  return (
    <AccessControlContext.Provider
      value={{
        userAccess,
        loading,
        refresh: refreshAccess,
        isFeatureLimited
      }}
    >
      {children}
    </AccessControlContext.Provider>
  );
}

export function useAccessControl() {
  const context = useContext(AccessControlContext);
  if (context === undefined) {
    throw new Error('useAccessControl must be used within an AccessControlProvider');
  }
  return context;
}

/**
 * Hook for checking if a specific feature is limited
 */
export function useFeatureAccess(feature: string) {
  const { userAccess, isFeatureLimited } = useAccessControl();

  return {
    hasAccess: !isFeatureLimited(feature),
    isLimited: isFeatureLimited(feature),
    userAccess,
    canUpgrade: userAccess?.role === 'owner' || userAccess?.role === 'admin'
  };
}