import { supabase } from '@/lib/supabase/client';

export interface UserAccess {
  hasFullAccess: boolean;
  hasPaidSubscription: boolean;
  role: string;
  organizationId: string;
  limitedFeatures: string[];
  upgradeRequired: boolean;
}

/**
 * Check user's access level for reports and features
 */
export async function checkUserAccess(userId: string, organizationId: string): Promise<UserAccess> {
  try {
    // Get user's role in the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership) {
      throw new Error('User not found in organization');
    }

    // Check if organization has paid subscription
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('payment_status, amount')
      .eq('organization_id', organizationId)
      .eq('payment_status', 'completed');

    if (paymentsError) {
      console.error('Error checking payments:', paymentsError);
    }

    const hasPaidSubscription = payments && payments.length > 0;
    const role = membership.role;

    // Determine access level
    let hasFullAccess = false;
    let limitedFeatures: string[] = [];
    let upgradeRequired = false;

    if (role === 'owner' || role === 'admin') {
      // Owners and admins always have full access
      hasFullAccess = true;
    } else if (hasPaidSubscription) {
      // If organization has paid, all members get full access
      hasFullAccess = true;
    } else {
      // Limited access for unpaid organizations
      hasFullAccess = false;
      upgradeRequired = true;

      // Define what features are limited
      limitedFeatures = [
        'Advanced Analytics',
        'Historical Data (>30 days)',
        'Export Functionality',
        'Custom Reports',
        'Real-time Data Updates',
        'API Access',
        'Integrations',
        'Bulk Operations'
      ];
    }

    return {
      hasFullAccess,
      hasPaidSubscription: !!hasPaidSubscription,
      role,
      organizationId,
      limitedFeatures,
      upgradeRequired
    };

  } catch (error) {
    console.error('Error checking user access:', error);

    // Return minimal access on error
    return {
      hasFullAccess: false,
      hasPaidSubscription: false,
      role: 'viewer',
      organizationId,
      limitedFeatures: ['All features'],
      upgradeRequired: true
    };
  }
}

/**
 * Get sample/limited data for unpaid users
 */
export function getLimitedReportData(fullData: any[], maxItems: number = 5): any[] {
  if (!Array.isArray(fullData)) return [];

  // Return only first few items for limited access
  return fullData.slice(0, maxItems);
}

/**
 * Check if a specific feature requires payment
 */
export function isFeatureLimited(feature: string, userAccess: UserAccess): boolean {
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
}

/**
 * Get upgrade message for users
 */
export function getUpgradeMessage(userAccess: UserAccess): string {
  if (userAccess.hasFullAccess) return '';

  if (userAccess.role === 'owner' || userAccess.role === 'admin') {
    return 'Upgrade your organization to unlock all features and get full access to reports and analytics.';
  } else {
    return 'This organization needs to upgrade to unlock full features. Contact your organization admin to upgrade.';
  }
}