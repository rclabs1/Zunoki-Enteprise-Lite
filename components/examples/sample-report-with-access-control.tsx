'use client';

import { useState, useEffect } from 'react';
import { AccessControlProvider, useAccessControl } from '@/hooks/use-access-control';
import { UpgradePrompt } from '@/components/access-control/upgrade-prompt';
import { LimitedDataTable } from '@/components/access-control/limited-data-table';
import { LimitedChart } from '@/components/access-control/limited-chart';

// Sample data for demonstration
const sampleData = [
  { id: 1, name: 'Campaign A', impressions: 15420, clicks: 234, ctr: '1.52%', cost: '$456.78' },
  { id: 2, name: 'Campaign B', impressions: 12350, clicks: 198, ctr: '1.60%', cost: '$389.45' },
  { id: 3, name: 'Campaign C', impressions: 9876, clicks: 156, ctr: '1.58%', cost: '$298.67' },
  { id: 4, name: 'Campaign D', impressions: 8765, clicks: 143, ctr: '1.63%', cost: '$267.89' },
  { id: 5, name: 'Campaign E', impressions: 7654, clicks: 128, ctr: '1.67%', cost: '$234.56' },
  { id: 6, name: 'Campaign F', impressions: 6543, clicks: 98, ctr: '1.50%', cost: '$198.45' },
  { id: 7, name: 'Campaign G', impressions: 5432, clicks: 87, ctr: '1.60%', cost: '$167.23' },
  { id: 8, name: 'Campaign H', impressions: 4321, clicks: 76, ctr: '1.76%', cost: '$134.67' },
];

const tableColumns = [
  { key: 'name', label: 'Campaign Name' },
  { key: 'impressions', label: 'Impressions', render: (value: number) => value.toLocaleString() },
  { key: 'clicks', label: 'Clicks' },
  { key: 'ctr', label: 'CTR' },
  { key: 'cost', label: 'Cost' },
];

// Sample chart component (you would use your actual chart library)
function SampleChart() {
  return (
    <div className="h-64 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-2">📊</div>
        <p className="text-gray-600">Sample Analytics Chart</p>
      </div>
    </div>
  );
}

function ReportContent() {
  const { userAccess, loading } = useAccessControl();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userAccess) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Unable to load access information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main upgrade prompt for limited users */}
      {!userAccess.hasFullAccess && (
        <UpgradePrompt
          userAccess={userAccess}
          feature="Advanced Analytics"
        />
      )}

      {/* Sample metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Impressions</p>
              <p className="text-2xl font-bold text-gray-900">
                {userAccess.hasFullAccess ? '64,561' : '15,420'}
                {!userAccess.hasFullAccess && (
                  <span className="text-sm text-yellow-600 ml-2">(Limited)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900">
                {userAccess.hasFullAccess ? '1,120' : '234'}
                {!userAccess.hasFullAccess && (
                  <span className="text-sm text-yellow-600 ml-2">(Limited)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average CTR</p>
              <p className="text-2xl font-bold text-gray-900">1.52%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spend</p>
              <p className="text-2xl font-bold text-gray-900">
                {userAccess.hasFullAccess ? '$2,147.70' : '$456.78'}
                {!userAccess.hasFullAccess && (
                  <span className="text-sm text-yellow-600 ml-2">(Limited)</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h3>
          <LimitedChart
            userAccess={userAccess}
            feature="Performance Charts"
          >
            <SampleChart />
          </LimitedChart>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Breakdown</h3>
          <LimitedChart
            userAccess={userAccess}
            feature="Campaign Analytics"
          >
            <SampleChart />
          </LimitedChart>
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
          {userAccess.hasFullAccess && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Export Data
            </button>
          )}
        </div>

        <LimitedDataTable
          data={sampleData}
          userAccess={userAccess}
          columns={tableColumns}
          maxRows={3}
          feature="full campaign data"
        />
      </div>

      {/* Advanced features section */}
      {!userAccess.hasFullAccess && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Historical Analysis', desc: 'View data from the past 12 months' },
              { title: 'Custom Reports', desc: 'Create and save custom report templates' },
              { title: 'API Access', desc: 'Integrate data with your own systems' },
            ].map((feature, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 opacity-60">
                <h4 className="font-medium text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{feature.desc}</p>
                <div className="flex items-center text-sm text-yellow-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Requires Upgrade
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SampleReportWithAccessControlProps {
  organizationId: string;
}

export default function SampleReportWithAccessControl({
  organizationId
}: SampleReportWithAccessControlProps) {
  return (
    <AccessControlProvider organizationId={organizationId}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor your campaign performance and engagement metrics
          </p>
        </div>
        <ReportContent />
      </div>
    </AccessControlProvider>
  );
}