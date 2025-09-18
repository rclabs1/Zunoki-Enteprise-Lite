import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Mock funnel dropoff analysis
    const mockFunnelData = {
      funnel_name: body.funnel_name || 'User Onboarding',
      total_users: 10000,
      steps: [
        {
          step_name: 'Landing Page Visit',
          users: 10000,
          conversion_rate: 1.0,
          dropoff_rate: 0.0
        },
        {
          step_name: 'Sign Up Started',
          users: 3200,
          conversion_rate: 0.32,
          dropoff_rate: 0.68,
          primary_dropoff_reasons: [
            'Form too long',
            'Required fields unclear',
            'Page load time'
          ]
        },
        {
          step_name: 'Email Verification',
          users: 2400,
          conversion_rate: 0.75,
          dropoff_rate: 0.25,
          primary_dropoff_reasons: [
            'Email not received',
            'Verification link expired',
            'Spam folder'
          ]
        },
        {
          step_name: 'Profile Setup',
          users: 1800,
          conversion_rate: 0.75,
          dropoff_rate: 0.25,
          primary_dropoff_reasons: [
            'Too many required fields',
            'Unclear value proposition',
            'Technical issues'
          ]
        },
        {
          step_name: 'First Action',
          users: 900,
          conversion_rate: 0.5,
          dropoff_rate: 0.5,
          primary_dropoff_reasons: [
            'Complex interface',
            'No clear next steps',
            'Missing features'
          ]
        }
      ],
      recommendations: [
        'Simplify the sign-up form by reducing required fields',
        'Improve email deliverability and verification process',
        'Add progress indicators to profile setup',
        'Implement better onboarding tooltips for first action'
      ],
      period: '30d'
    };

    return NextResponse.json(mockFunnelData);

  } catch (error) {
    console.error('Mixpanel funnel dropoffs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}