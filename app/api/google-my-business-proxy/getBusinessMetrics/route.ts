import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock Google My Business data
    const mockData = {
      business_name: 'Zunoki Enterprise',
      total_views: 5234,
      search_views: 3456,
      maps_views: 1778,
      phone_calls: 234,
      direction_requests: 456,
      website_clicks: 678,
      reviews: {
        total: 45,
        average_rating: 4.7,
        recent_reviews: [
          { rating: 5, text: 'Great service!', date: '2024-01-15' },
          { rating: 4, text: 'Very helpful team', date: '2024-01-14' },
          { rating: 5, text: 'Excellent product', date: '2024-01-13' }
        ]
      },
      photos: {
        total_photos: 12,
        views: 2345,
        customer_photos: 8
      },
      period: '30d'
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Google My Business proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}