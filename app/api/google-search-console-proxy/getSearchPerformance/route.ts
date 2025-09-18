import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock Google Search Console data
    const mockData = {
      total_clicks: 8456,
      total_impressions: 125340,
      average_ctr: 0.067,
      average_position: 12.4,
      top_queries: [
        { query: 'enterprise chat solution', clicks: 1234, impressions: 15678, ctr: 0.079, position: 8.2 },
        { query: 'business messaging platform', clicks: 987, impressions: 12456, ctr: 0.079, position: 9.1 },
        { query: 'ai chat for business', clicks: 765, impressions: 9876, ctr: 0.077, position: 11.3 },
        { query: 'whatsapp business api', clicks: 543, impressions: 8765, ctr: 0.062, position: 15.7 }
      ],
      top_pages: [
        { page: '/', clicks: 3456, impressions: 45678, ctr: 0.076, position: 10.2 },
        { page: '/pricing', clicks: 2134, impressions: 28765, ctr: 0.074, position: 11.8 },
        { page: '/features', clicks: 1567, impressions: 21234, ctr: 0.074, position: 13.1 }
      ],
      countries: [
        { country: 'USA', clicks: 4567, impressions: 67890 },
        { country: 'India', clicks: 2345, impressions: 34567 },
        { country: 'UK', clicks: 1234, impressions: 18765 }
      ],
      devices: {
        desktop: { clicks: 5067, impressions: 75204 },
        mobile: { clicks: 2712, impressions: 40102 },
        tablet: { clicks: 677, impressions: 10034 }
      },
      period: '30d'
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Google Search Console proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}