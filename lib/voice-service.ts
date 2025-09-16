import { supabase } from '@/lib/supabase/client';

export interface VoiceConfig {
  provider: 'elevenlabs' | 'sarvam' | 'web_tts';
  voiceId?: string;
  language: string;
  speed: number;
  pitch: number;
  stability?: number; // For ElevenLabs
  similarity?: number; // For ElevenLabs
  style?: number; // For ElevenLabs
}

export interface VoiceResponse {
  success: boolean;
  audioUrl?: string;
  audioData?: ArrayBuffer;
  duration?: number;
  error?: string;
  provider: string;
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  confidence?: number;
  language?: string;
  error?: string;
}

class VoiceService {
  private static instance: VoiceService;
  private elevenLabsApiKey?: string;
  private sarvamApiKey?: string;

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  constructor() {
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.sarvamApiKey = process.env.SARVAM_API_KEY;
  }

  // Generate speech using ElevenLabs
  async generateSpeechElevenLabs(
    text: string,
    config: VoiceConfig
  ): Promise<VoiceResponse> {
    try {
      if (!this.elevenLabsApiKey) {
        return {
          success: false,
          error: 'ElevenLabs API key not configured',
          provider: 'elevenlabs'
        };
      }

      const voiceId = config.voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default voice

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: config.stability || 0.5,
            similarity_boost: config.similarity || 0.75,
            style: config.style || 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `ElevenLabs API error: ${response.status} - ${errorData.detail || 'Unknown error'}`,
          provider: 'elevenlabs'
        };
      }

      const audioData = await response.arrayBuffer();
      
      // Convert to blob URL for playback
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      return {
        success: true,
        audioUrl,
        audioData,
        provider: 'elevenlabs'
      };

    } catch (error: any) {
      console.error('ElevenLabs TTS error:', error);
      return {
        success: false,
        error: `ElevenLabs generation failed: ${error.message}`,
        provider: 'elevenlabs'
      };
    }
  }

  // Generate speech using Sarvam AI
  async generateSpeechSarvam(
    text: string,
    config: VoiceConfig
  ): Promise<VoiceResponse> {
    try {
      if (!this.sarvamApiKey) {
        return {
          success: false,
          error: 'Sarvam API key not configured',
          provider: 'sarvam'
        };
      }

      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-Subscription-Key': this.sarvamApiKey
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: config.language || 'hi-IN',
          speaker: config.voiceId || 'meera',
          pitch: config.pitch || 0,
          pace: config.speed || 1.0,
          loudness: 1.0,
          speech_sample_rate: 22050,
          enable_preprocessing: true,
          model: 'bulbul:v1'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Sarvam API error: ${response.status} - ${errorData.message || 'Unknown error'}`,
          provider: 'sarvam'
        };
      }

      const data = await response.json();
      
      if (!data.audios || !data.audios[0]) {
        return {
          success: false,
          error: 'No audio data received from Sarvam',
          provider: 'sarvam'
        };
      }

      // Sarvam returns base64 encoded audio
      const audioBase64 = data.audios[0];
      const audioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      
      const blob = new Blob([audioData], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      return {
        success: true,
        audioUrl,
        audioData: audioData.buffer,
        provider: 'sarvam'
      };

    } catch (error: any) {
      console.error('Sarvam TTS error:', error);
      return {
        success: false,
        error: `Sarvam generation failed: ${error.message}`,
        provider: 'sarvam'
      };
    }
  }

  // Generate speech using Web Speech API
  async generateSpeechWebTTS(
    text: string,
    config: VoiceConfig
  ): Promise<VoiceResponse> {
    return new Promise((resolve) => {
      try {
        if (!('speechSynthesis' in window)) {
          resolve({
            success: false,
            error: 'Web Speech API not supported in this browser',
            provider: 'web_tts'
          });
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice settings
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => 
          voice.lang.startsWith(config.language) || 
          voice.name.includes(config.voiceId || '')
        ) || voices[0];

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.rate = config.speed || 1.0;
        utterance.pitch = config.pitch || 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
          resolve({
            success: true,
            provider: 'web_tts'
          });
        };

        utterance.onerror = (event) => {
          resolve({
            success: false,
            error: `Web TTS error: ${event.error}`,
            provider: 'web_tts'
          });
        };

        speechSynthesis.speak(utterance);

      } catch (error: any) {
        resolve({
          success: false,
          error: `Web TTS failed: ${error.message}`,
          provider: 'web_tts'
        });
      }
    });
  }

  // Main text-to-speech method
  async generateSpeech(
    text: string,
    config: VoiceConfig
  ): Promise<VoiceResponse> {
    switch (config.provider) {
      case 'elevenlabs':
        return this.generateSpeechElevenLabs(text, config);
      case 'sarvam':
        return this.generateSpeechSarvam(text, config);
      case 'web_tts':
        return this.generateSpeechWebTTS(text, config);
      default:
        return {
          success: false,
          error: `Unsupported voice provider: ${config.provider}`,
          provider: config.provider
        };
    }
  }

  // Speech-to-text transcription
  async transcribeAudio(
    audioData: ArrayBuffer | Blob,
    language: string = 'en-US'
  ): Promise<TranscriptionResult> {
    return new Promise((resolve) => {
      try {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          resolve({
            success: false,
            error: 'Speech recognition not supported in this browser'
          });
          return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          const confidence = event.results[0][0].confidence;

          resolve({
            success: true,
            text: transcript,
            confidence,
            language
          });
        };

        recognition.onerror = (event: any) => {
          resolve({
            success: false,
            error: `Speech recognition error: ${event.error}`
          });
        };

        recognition.start();

      } catch (error: any) {
        resolve({
          success: false,
          error: `Transcription failed: ${error.message}`
        });
      }
    });
  }

  // Get available voices for each provider
  async getAvailableVoices(): Promise<{
    elevenlabs: any[];
    sarvam: any[];
    web_tts: SpeechSynthesisVoice[];
  }> {
    const result = {
      elevenlabs: [],
      sarvam: [],
      web_tts: []
    };

    // Get ElevenLabs voices
    if (this.elevenLabsApiKey) {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: {
            'xi-api-key': this.elevenLabsApiKey
          }
        });
        if (response.ok) {
          const data = await response.json();
          result.elevenlabs = data.voices || [];
        }
      } catch (error) {
        console.error('Error fetching ElevenLabs voices:', error);
      }
    }

    // Sarvam voices (predefined list)
    result.sarvam = [
      { voice_id: 'meera', name: 'Meera', language: 'hi-IN', gender: 'female' },
      { voice_id: 'aditi', name: 'Aditi', language: 'hi-IN', gender: 'female' },
      { voice_id: 'arjun', name: 'Arjun', language: 'hi-IN', gender: 'male' },
      { voice_id: 'kavya', name: 'Kavya', language: 'hi-IN', gender: 'female' }
    ];

    // Web Speech API voices
    if ('speechSynthesis' in window) {
      result.web_tts = speechSynthesis.getVoices();
    }

    return result;
  }

  // Save voice message to database
  async saveVoiceMessage(
    conversationId: string,
    audioUrl: string,
    transcription?: string,
    duration?: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('voice_messages')
        .insert({
          conversation_id: conversationId,
          audio_url: audioUrl,
          transcription,
          duration,
          created_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error saving voice message:', error);
      return false;
    }
  }

  // Get voice messages for conversation
  async getVoiceMessages(conversationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('voice_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching voice messages:', error);
      return [];
    }
  }
}

export const voiceService = VoiceService.getInstance();
export default voiceService;