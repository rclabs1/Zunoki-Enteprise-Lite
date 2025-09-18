import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock Google Analytics data for now
    const mockData = {
      sessions: 15234,
      users: 12456,
      pageviews: 45678,
      bounce_rate: 0.62,
      avg_session_duration: 145,
      conversions: 234,
      conversion_rate: 0.015,
      traffic_sources: {
        organic: 45.2,
        direct: 28.1,
        social: 15.7,
        referral: 8.3,
        email: 2.7
      },
      top_pages: [
        { page: '/', views: 8234, bounce_rate: 0.45 },
        { page: '/pricing', views: 3456, bounce_rate: 0.32 },
        { page: '/features', views: 2134, bounce_rate: 0.58 }
      ],
      period: '30d'
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Google Analytics proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}