import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock Google Ads campaigns data
    const mockData = {
      campaigns: [
        {
          id: 'camp_001',
          name: 'Enterprise Chat - Search',
          status: 'ENABLED',
          budget: 5000,
          spend: 3456,
          impressions: 125340,
          clicks: 2345,
          ctr: 0.019,
          cpc: 1.47,
          conversions: 67,
          conversion_rate: 0.029,
          cost_per_conversion: 51.58
        },
        {
          id: 'camp_002',
          name: 'Business Messaging - Display',
          status: 'ENABLED',
          budget: 3000,
          spend: 2134,
          impressions: 89765,
          clicks: 1234,
          ctr: 0.014,
          cpc: 1.73,
          conversions: 34,
          conversion_rate: 0.028,
          cost_per_conversion: 62.76
        },
        {
          id: 'camp_003',
          name: 'WhatsApp Integration - Video',
          status: 'ENABLED',
          budget: 2000,
          spend: 1567,
          impressions: 67890,
          clicks: 987,
          ctr: 0.015,
          cpc: 1.59,
          conversions: 23,
          conversion_rate: 0.023,
          cost_per_conversion: 68.13
        }
      ],
      account_summary: {
        total_budget: 10000,
        total_spend: 7157,
        total_impressions: 282995,
        total_clicks: 4566,
        total_conversions: 124,
        overall_ctr: 0.016,
        overall_cpc: 1.57,
        overall_conversion_rate: 0.027
      },
      period: '30d'
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Google Ads campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}