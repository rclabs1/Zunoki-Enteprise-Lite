'use client';

import { UserAccess } from '@/lib/access-control';

interface UpgradePromptProps {
  userAccess: UserAccess;
  feature?: string;
  className?: string;
  compact?: boolean;
}

export function UpgradePrompt({
  userAccess,
  feature = 'full access',
  className = '',
  compact = false
}: UpgradePromptProps) {
  if (userAccess.hasFullAccess) return null;

  const canUpgrade = userAccess.role === 'owner' || userAccess.role === 'admin';

  if (compact) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center">
          <svg className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-yellow-800">
            {feature} requires upgrade
          </p>
          {canUpgrade && (
            <button className="ml-2 text-yellow-600 hover:text-yellow-800 underline text-sm">
              Upgrade
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upgrade to Unlock {feature}
          </h3>
          <p className="text-gray-600 mb-4">
            {canUpgrade
              ? 'Upgrade your organization to access advanced features, full historical data, and premium analytics.'
              : 'Your organization is on a limited plan. Contact your admin to upgrade for full access.'
            }
          </p>

          {userAccess.limitedFeatures.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Features requiring upgrade:
              </p>
              <div className="flex flex-wrap gap-2">
                {userAccess.limitedFeatures.slice(0, 4).map((limitedFeature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {limitedFeature}
                  </span>
                ))}
                {userAccess.limitedFeatures.length > 4 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    +{userAccess.limitedFeatures.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {canUpgrade ? (
            <div className="flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Upgrade Now
              </button>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors font-medium">
                View Plans
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Need full access?</strong> Ask your organization admin to upgrade:
              </p>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <span className="text-sm text-gray-600">Contact your admin or owner</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}