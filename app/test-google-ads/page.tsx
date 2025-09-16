"use client"

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';

/**
 * Test page to fetch actual Google Ads data
 * Navigate to: /test-google-ads
 */
export default function TestGoogleAdsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [supabaseSession, setSupabaseSession] = useState(null);
  const { user } = useAuth(); // Keep Firebase user for display only

  const logStep = (stepNum: number, message: string, data?: any) => {
    setStep(stepNum);
    console.log(`🔥 Step ${stepNum}: ${message}`, data || '');
  };

  const fetchGoogleAdsData = async () => {
    if (!user) {
      setError('❌ Please login first');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      logStep(1, 'Starting Google Ads LIVE data fetch (2025 YTD)...');
      console.log('👤 Current user:', { uid: user.uid, email: user.email });

      logStep(2, 'Getting Firebase authentication token...');
      const idToken = await user.getIdToken();
      console.log('🎟️ Firebase token obtained:', idToken.substring(0, 50) + '...');

      // STEP 1: Trigger historical data sync
      logStep(3, 'Triggering LIVE campaign data sync for 2025 (Jan-Aug)...');
      
      const syncResponse = await fetch('/api/google-ads-proxy/fetchPerformanceMetrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          startDate: '2025-01-01', // Start of 2025 (live campaigns)
          endDate: '2025-08-26',   // Current date (August 26, 2025)
          customerId: '8476740998' // Your Google Ads account number (847-674-0998 without dashes)
        })
      });

      console.log('📊 Sync response status:', syncResponse.status);
      const syncResult = await syncResponse.json();
      console.log('📈 Sync result:', syncResult);

      // STEP 2: Wait for background job to process
      logStep(4, 'Waiting for background sync to complete...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      // STEP 3: Fetch the synced campaign data
      logStep(5, 'Fetching synced campaign data...');
      const response = await fetch('/api/google-ads-proxy/fetchCampaigns', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });

      logStep(6, 'Processing API response...');
      const result = await response.json();
      console.log('📊 Backend response:', result);

      if (result.success) {
        logStep(7, '✅ SUCCESS! Historical Google Ads data received');
        setData(result.data);
        
        // Log campaign details for debugging
        if (result.data.campaigns && result.data.campaigns.length > 0) {
          console.log(`📈 Found ${result.data.campaigns.length} campaigns with historical data:`);
          result.data.campaigns.forEach((campaign, index) => {
            console.log(`Campaign ${index + 1}:`, {
              name: campaign.name,
              impressions: campaign.impressions,
              clicks: campaign.clicks,
              cost: campaign.cost,
              conversions: campaign.conversions,
              ctr: campaign.ctr,
              cpc: campaign.cpc
            });
          });
        } else {
          console.log('📊 No campaigns found - this might mean no historical data or no active campaigns in the past 30 days');
        }

        if (result.data.summary) {
          console.log('📊 Historical Account Summary (last 30 days):', result.data.summary);
        }

      } else {
        logStep(7, '❌ Backend returned error');
        setError(result.message || 'Unknown error');
        console.error('Backend error:', result);
      }

    } catch (err) {
      logStep(7, '💥 Request failed');
      console.error('💥 Error fetching Google Ads data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceMetrics = async () => {
    if (!user) {
      setError('❌ Please login first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logStep(1, 'Fetching performance metrics...');
      const idToken = await user.getIdToken();

      logStep(2, 'Calling performance metrics proxy API...');
      const response = await fetch('/api/google-ads-proxy/fetchPerformanceMetrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          startDate: '2025-01-01',
          endDate: '2025-01-25'
        })
      });

      const result = await response.json();
      console.log('📈 Performance metrics response:', result);

      if (result.success) {
        logStep(3, '✅ Performance metrics received');
        setData(result.data);
      } else {
        setError(result.message);
      }

    } catch (err) {
      console.error('💥 Error fetching performance metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const manualSyncData = async () => {
    if (!user) {
      setError('❌ Please login first');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      logStep(1, 'Starting MANUAL Google Ads sync...');
      console.log('👤 Current user:', { uid: user.uid, email: user.email });

      logStep(2, 'Getting Firebase authentication token...');
      const idToken = await user.getIdToken();
      console.log('🎟️ Firebase token obtained:', idToken.substring(0, 50) + '...');

      // MANUAL SYNC: Trigger sync job via fetchPerformanceMetrics
      logStep(3, 'Triggering manual sync job for last 90 days...');
      
      const syncResponse = await fetch('/api/google-ads-proxy/fetchPerformanceMetrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          startDate: '2025-01-01', // Start of 2025
          endDate: '2025-08-27',   // Current date
          customerId: '8476740998' // Your Google Ads account number
        })
      });

      console.log('🔄 Manual sync response status:', syncResponse.status);
      const syncResult = await syncResponse.json();
      console.log('🔄 Manual sync result:', syncResult);

      if (syncResult.success && syncResult.data.jobId) {
        logStep(4, `✅ Sync job created: ${syncResult.data.jobId}`);
        console.log('🎯 Sync job started, waiting for completion...');
        
        // Wait longer for sync to complete
        logStep(5, 'Waiting for sync to complete (30 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

        // Now fetch the synced data
        logStep(6, 'Fetching synced campaign data...');
        const campaignResponse = await fetch('/api/google-ads-proxy/fetchCampaigns', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
        });

        const campaignResult = await campaignResponse.json();
        console.log('📊 Campaign data response:', campaignResult);

        if (campaignResult.success) {
          logStep(7, '✅ SUCCESS! Manual sync completed');
          setData(campaignResult.data);
          
          console.log('📈 Manual sync completed successfully');
          if (campaignResult.data.campaigns && campaignResult.data.campaigns.length > 0) {
            console.log(`🎉 Found ${campaignResult.data.campaigns.length} campaigns with fresh data!`);
          }
        } else {
          setError(campaignResult.message || 'Failed to fetch synced data');
        }
      } else {
        setError(syncResult.message || 'Failed to trigger sync job');
      }

    } catch (err) {
      logStep(7, '💥 Manual sync failed');
      console.error('💥 Error during manual sync:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Google Ads Data Test
          </h1>
          <p className="text-gray-600">
            Test fetching real Google Ads data from your connected account
          </p>
        </div>

        {/* User Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">👤 Authentication Status</h2>
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-green-800">✅ Logged in</div>
                <div className="text-sm text-gray-600">
                  {user.email || user.uid}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="text-red-600">❌ Not logged in - Please login first</div>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        {loading && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <div>
                <div className="font-medium text-blue-800">Step {step}: Processing...</div>
                <div className="text-sm text-blue-600">
                  {step === 1 && "Initializing manual sync..."}
                  {step === 2 && "Getting authentication token..."}
                  {step === 3 && "Triggering sync job in background..."}
                  {step === 4 && "Sync job created successfully..."}
                  {step === 5 && "Waiting for sync to complete (30 seconds)..."}
                  {step === 6 && "Fetching synced campaign data..."}
                  {step === 7 && "Processing final results..."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Test Actions</h2>
          <div className="space-y-3">
            
            {/* NEW: Manual Sync Button - PRIMARY ACTION */}
            <button
              onClick={manualSyncData}
              disabled={loading || !user}
              className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-left border-2 border-purple-300"
            >
              {loading ? '🔄 Syncing...' : '🚀 Manual Sync Google Ads Data'}
              <div className="text-sm font-normal mt-1 opacity-90">
                Trigger fresh sync from Google Ads API → wait 30s → show results
              </div>
              <div className="text-xs font-normal mt-1 opacity-75">
                ⭐ Recommended: Tests complete pipeline (API → Queue → Database → UI)
              </div>
            </button>

            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm text-gray-600 mb-3">Legacy test functions (may show empty data):</p>
              
              <button
                onClick={fetchGoogleAdsData}
                disabled={loading || !user}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-left"
              >
                {loading ? '⏳ Fetching...' : '📊 Fetch Google Ads Campaigns'}
                <div className="text-sm font-normal mt-1 opacity-90">
                  Get cached campaign data (may be empty if never synced)
                </div>
              </button>

              <button
                onClick={fetchPerformanceMetrics}
                disabled={loading || !user}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-left mt-3"
              >
                {loading ? '⏳ Fetching...' : '📈 Fetch Performance Metrics'}
                <div className="text-sm font-normal mt-1 opacity-90">
                  Get daily performance data for date range analysis
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">❌ Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            
            {error.includes('not connected') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Next Step:</strong> Go to <a href="/ad-hub" className="underline">Ad Hub</a> and connect your Google Ads account first.
                </p>
              </div>
            )}
            
            {error.includes('token') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Solution:</strong> Try logging out and logging back in to refresh your authentication token.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Success Display */}
        {data && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-800 mb-4">✅ Google Ads Data Retrieved!</h3>
            
            {/* Connection Status */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">🔗 Connection Status</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${data.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={data.connected ? 'text-green-700' : 'text-red-700'}>
                  {data.connected ? 'Connected to Google Ads' : 'Not Connected'}
                </span>
              </div>
            </div>

            {/* Campaigns Preview */}
            {data.campaigns && data.campaigns.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3">📊 Campaigns ({data.campaigns.length} total)</h4>
                <div className="space-y-3">
                  {data.campaigns.slice(0, 3).map((campaign, index) => (
                    <div key={index} className="bg-white rounded p-4 border">
                      <div className="font-medium text-gray-900 mb-2">{campaign.name}</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-gray-500">Impressions</div>
                          <div className="font-medium">{campaign.impressions?.toLocaleString() || 0}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Clicks</div>
                          <div className="font-medium">{campaign.clicks?.toLocaleString() || 0}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Cost</div>
                          <div className="font-medium">${(campaign.cost || 0).toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">CTR</div>
                          <div className="font-medium">{((campaign.ctr || 0) * 100).toFixed(2)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {data.campaigns.length > 3 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      + {data.campaigns.length - 3} more campaigns
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {data.summary && (
              <div className="mb-6">
                <h4 className="font-medium mb-3">📈 Account Summary</h4>
                <div className="bg-white rounded p-4 border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-gray-500 text-sm">Total Impressions</div>
                      <div className="text-lg font-semibold">{data.summary.totalImpressions?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Total Clicks</div>
                      <div className="text-lg font-semibold">{data.summary.totalClicks?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Total Spend</div>
                      <div className="text-lg font-semibold">${(data.summary.totalSpend || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-sm">Avg CTR</div>
                      <div className="text-lg font-semibold">{(data.summary.averageCtr || 0).toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Data */}
            {data.performanceData && data.performanceData.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3">📊 Daily Performance ({data.performanceData.length} days)</h4>
                <div className="bg-white rounded p-4 border max-h-60 overflow-y-auto">
                  {data.performanceData.slice(0, 10).map((day, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div className="font-medium">{day.date}</div>
                      <div className="text-sm text-gray-600">
                        {day.impressions} imp, {day.clicks} clicks, ${(day.spend || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h4 className="font-medium text-blue-800 mb-2">🎯 Next Steps</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>✅ Data successfully fetched from Google Ads API</div>
                <div>✅ Authentication working properly</div>
                <div>🔄 Ready to integrate into Zunoki Intelligence dashboard</div>
                <div>📊 KPIs can now show real campaign metrics</div>
              </div>
            </div>

            {/* Raw Data Toggle */}
            <details className="mt-6">
              <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                🔍 View Raw API Response
              </summary>
              <pre className="mt-3 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-60 text-gray-800">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-3">📋 How to Use This Test</h3>
          <ol className="text-sm text-yellow-700 space-y-2">
            <li><strong>1.</strong> Make sure you're logged in (check status above)</li>
            <li><strong>2.</strong> Ensure Google Ads is connected in <a href="/ad-hub" className="underline">Ad Hub</a></li>
            <li><strong>3.</strong> Click "Fetch Google Ads Campaigns" to test the API</li>
            <li><strong>4.</strong> Check browser console for detailed logs</li>
            <li><strong>5.</strong> If successful, we'll integrate this data into Intelligence dashboard</li>
          </ol>
        </div>

      </div>
    </div>
  );
}