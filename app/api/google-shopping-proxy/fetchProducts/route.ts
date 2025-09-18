import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock Google Shopping data
    const mockData = {
      products: [
        {
          id: 'prod_001',
          title: 'Enterprise Chat Solution',
          price: '$99/month',
          impressions: 15234,
          clicks: 456,
          ctr: 0.03,
          conversions: 23,
          conversion_rate: 0.05
        },
        {
          id: 'prod_002', 
          title: 'Business Chat Plan',
          price: '$49/month',
          impressions: 8765,
          clicks: 234,
          ctr: 0.027,
          conversions: 12,
          conversion_rate: 0.051
        }
      ],
      total_impressions: 24000,
      total_clicks: 690,
      average_ctr: 0.029,
      total_conversions: 35,
      period: '30d'
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Google Shopping proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}