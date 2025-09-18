'use client';

import { UserAccess } from '@/lib/access-control';

interface LimitedChartProps {
  children: React.ReactNode;
  userAccess: UserAccess;
  feature?: string;
  className?: string;
}

export function LimitedChart({
  children,
  userAccess,
  feature = 'Advanced Charts',
  className = ''
}: LimitedChartProps) {
  if (userAccess.hasFullAccess) {
    return <div className={className}>{children}</div>;
  }

  const canUpgrade = userAccess.role === 'owner' || userAccess.role === 'admin';

  return (
    <div className={`relative ${className}`}>
      {/* Blurred Chart */}
      <div className="filter blur-sm pointer-events-none">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/60 flex items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {feature} Preview
          </h3>

          <p className="text-sm text-gray-600 mb-4">
            {canUpgrade
              ? 'Upgrade to unlock interactive charts and detailed analytics.'
              : 'This feature requires your organization to upgrade.'
            }
          </p>

          {canUpgrade ? (
            <div className="space-y-2">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Upgrade to View
              </button>
              <button className="w-full text-blue-600 hover:text-blue-800 text-sm">
                Learn More
              </button>
            </div>
          ) : (
            <div className="bg-white/90 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600">
                Contact your organization admin to upgrade
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}