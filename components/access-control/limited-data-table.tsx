'use client';

import { UserAccess, getLimitedReportData } from '@/lib/access-control';

interface LimitedDataTableProps {
  data: any[];
  userAccess: UserAccess;
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  maxRows?: number;
  feature?: string;
  className?: string;
}

export function LimitedDataTable({
  data,
  userAccess,
  columns,
  maxRows = 5,
  feature = 'full data',
  className = ''
}: LimitedDataTableProps) {
  const displayData = userAccess.hasFullAccess
    ? data
    : getLimitedReportData(data, maxRows);

  const isLimited = !userAccess.hasFullAccess && data.length > maxRows;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table */}
      <div className="overflow-hidden bg-white rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, index) => (
              <tr
                key={index}
                className={isLimited && index >= maxRows - 1 ? 'opacity-75' : ''}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Limited Access Overlay */}
        {isLimited && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
            <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Showing {displayData.length} of {data.length} rows
                    </p>
                    <p className="text-xs text-yellow-600">
                      Upgrade to view all {data.length} rows and get full access
                    </p>
                  </div>
                </div>
                {(userAccess.role === 'owner' || userAccess.role === 'admin') && (
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium">
                    Upgrade Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Show empty state if no data */}
      {displayData.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-600">
            {userAccess.hasFullAccess
              ? 'No data to display at this time.'
              : 'Upgrade to access historical data and advanced analytics.'
            }
          </p>
        </div>
      )}
    </div>
  );
}