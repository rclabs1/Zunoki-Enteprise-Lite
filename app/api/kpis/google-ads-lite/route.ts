import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock KPI data for development/testing
    const mockKPIData = {
      data: {
        campaigns: [
          {
            id: 'campaign_001',
            name: 'Zunoki Brand Awareness',
            status: 'ENABLED',
            impressions: 125420,
            clicks: 3650,
            cost: 1240.50,
            conversions: 89,
            ctr: 2.91,
            cpc: 0.34,
            conversionRate: 2.44,
            costPerConversion: 13.94,
            date: new Date().toISOString()
          },
          {
            id: 'campaign_002',
            name: 'AI Platform - Search',
            status: 'ENABLED',
            impressions: 98765,
            clicks: 2890,
            cost: 950.75,
            conversions: 67,
            ctr: 2.93,
            cpc: 0.33,
            conversionRate: 2.32,
            costPerConversion: 14.19,
            date: new Date().toISOString()
          },
          {
            id: 'campaign_003',
            name: 'Messaging Platform',
            status: 'ENABLED',
            impressions: 87432,
            clicks: 2156,
            cost: 720.30,
            conversions: 52,
            ctr: 2.47,
            cpc: 0.33,
            conversionRate: 2.41,
            costPerConversion: 13.85,
            date: new Date().toISOString()
          }
        ],
        summary: {
          totalImpressions: 311617,
          totalClicks: 8696,
          totalCost: 2911.55,
          totalConversions: 208,
          avgCTR: 2.79,
          avgCPC: 0.33,
          avgConversionRate: 2.39,
          avgCostPerConversion: 14.00,
          lastUpdated: new Date().toISOString()
        },
        accountInfo: {
          accountId: 'dev_account_123',
          accountName: 'Zunoki Development',
          currency: 'USD',
          timezone: 'America/New_York'
        }
      },
      success: true,
      cached: true,
      lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      nextSync: new Date(Date.now() + 45 * 60 * 1000).toISOString()   // 45 minutes from now
    };

    return NextResponse.json(mockKPIData);
  } catch (error) {
    console.error('Error fetching Google Ads KPIs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Google Ads KPI data',
        success: false,
        cached: false
      },
      { status: 500 }
    );
  }
}