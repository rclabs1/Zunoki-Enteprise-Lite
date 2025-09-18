import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock YouTube channel performance data
    const mockData = {
      channel_name: 'Zunoki Enterprise',
      subscribers: 3456,
      subscriber_growth: 123,
      total_views: 156789,
      view_growth: 12456,
      watch_time_hours: 8934,
      watch_time_growth: 1234,
      average_view_duration: 234,
      engagement_rate: 0.067,
      top_traffic_sources: {
        youtube_search: 0.45,
        suggested_videos: 0.32,
        external_traffic: 0.13,
        direct_traffic: 0.06,
        playlist: 0.04
      },
      demographics: {
        age_groups: {
          '18-24': 0.12,
          '25-34': 0.34,
          '35-44': 0.28,
          '45-54': 0.18,
          '55+': 0.08
        },
        gender: {
          male: 0.62,
          female: 0.38
        },
        top_countries: [
          { country: 'USA', percentage: 0.45 },
          { country: 'India', percentage: 0.23 },
          { country: 'UK', percentage: 0.12 },
          { country: 'Canada', percentage: 0.08 }
        ]
      },
      period: '30d'
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('YouTube channel performance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}