import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock YouTube Analytics data
    const mockData = {
      videos: [
        {
          id: 'vid_001',
          title: 'How to Set Up Enterprise Chat in 5 Minutes',
          views: 25340,
          watch_time_hours: 1234,
          likes: 567,
          comments: 89,
          shares: 45,
          subscribers_gained: 23
        },
        {
          id: 'vid_002',
          title: 'WhatsApp Business API Integration Tutorial',
          views: 18765,
          watch_time_hours: 987,
          likes: 432,
          comments: 67,
          shares: 34,
          subscribers_gained: 18
        },
        {
          id: 'vid_003',
          title: 'AI Chat Features Demo',
          views: 12456,
          watch_time_hours: 678,
          likes: 298,
          comments: 45,
          shares: 22,
          subscribers_gained: 12
        }
      ],
      channel_metrics: {
        total_views: 56561,
        total_watch_time_hours: 2899,
        subscribers: 3456,
        total_videos: 25
      },
      period: '30d'
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('YouTube Analytics proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}