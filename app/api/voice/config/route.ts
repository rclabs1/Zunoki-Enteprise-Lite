import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Voice configuration settings
    const voiceConfig = {
      enabled: true,
      ttsProvider: 'browser', // or 'elevenlabs', 'openai'
      language: 'en-US',
      voice: 'default',
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8,
      autoSpeak: false,
      wakeWord: 'maya',
      enableWakeWord: false,
      microphoneEnabled: true,
      continuousListening: false,
      silenceTimeout: 3000,
      maxRecordingTime: 30000,
      // API keys (should be in environment variables in production)
      elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      // Voice options for different providers
      browserVoices: [
        { name: 'Default', value: 'default' },
        { name: 'English (US) - Female', value: 'en-US-female' },
        { name: 'English (US) - Male', value: 'en-US-male' },
        { name: 'English (UK) - Female', value: 'en-GB-female' },
        { name: 'English (UK) - Male', value: 'en-GB-male' }
      ],
      elevenLabsVoices: [
        { name: 'Rachel', value: 'rachel' },
        { name: 'Adam', value: 'adam' },
        { name: 'Domi', value: 'domi' },
        { name: 'Elli', value: 'elli' }
      ]
    };

    return NextResponse.json(voiceConfig);
  } catch (error) {
    console.error('Error fetching voice config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();

    // In a real app, you'd save this to a database
    // For now, we'll just return success
    console.log('Voice config updated:', config);

    return NextResponse.json({
      success: true,
      message: 'Voice configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating voice config:', error);
    return NextResponse.json(
      { error: 'Failed to update voice configuration' },
      { status: 500 }
    );
  }
}