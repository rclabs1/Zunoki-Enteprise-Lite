import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock Meta Ads campaigns data
    const mockData = {
      campaigns: [
        {
          id: 'meta_camp_001',
          name: 'Enterprise Chat - Awareness',
          status: 'ACTIVE',
          objective: 'BRAND_AWARENESS',
          budget: 4000,
          spend: 2876,
          reach: 156789,
          impressions: 234567,
          clicks: 3456,
          ctr: 0.015,
          cpm: 12.25,
          cpp: 18.36,
          conversions: 89,
          cost_per_conversion: 32.31
        },
        {
          id: 'meta_camp_002',
          name: 'WhatsApp Business - Conversions',
          status: 'ACTIVE',
          objective: 'CONVERSIONS',
          budget: 3500,
          spend: 2456,
          reach: 98765,
          impressions: 167890,
          clicks: 2134,
          ctr: 0.013,
          cpm: 14.63,
          cpp: 24.87,
          conversions: 67,
          cost_per_conversion: 36.66
        },
        {
          id: 'meta_camp_003',
          name: 'AI Chat Demo - Video Views',
          status: 'ACTIVE',
          objective: 'VIDEO_VIEWS',
          budget: 2500,
          spend: 1789,
          reach: 67890,
          impressions: 123456,
          video_views: 45678,
          video_completion_rate: 0.68,
          cpm: 14.49,
          cost_per_video_view: 0.039,
          conversions: 34,
          cost_per_conversion: 52.62
        }
      ],
      account_summary: {
        total_budget: 10000,
        total_spend: 7121,
        total_reach: 323444,
        total_impressions: 525913,
        total_clicks: 5590,
        total_conversions: 190,
        overall_ctr: 0.011,
        overall_cpm: 13.54,
        overall_conversion_rate: 0.034
      },
      period: '30d'
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Meta Ads campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}