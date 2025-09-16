export interface VoiceConfig {
  provider: 'elevenlabs' | 'sarvam' | 'browser';
  language: string;
  voice: string;
  speed: number;
  pitch: number;
  emotionalTone: 'neutral' | 'enthusiastic' | 'concerned' | 'celebratory';
}

export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface VoiceResponse {
  text: string;
  audioUrl?: string;
  emotion: 'neutral' | 'happy' | 'concerned' | 'excited';
  urgency: 'low' | 'medium' | 'high';
  visualCues?: VoiceVisualCue[];
}

export interface VoiceVisualCue {
  type: 'waveform' | 'pulse' | 'glow' | 'particle';
  color: string;
  intensity: number;
  duration: number;
}

export interface VoiceInteraction {
  id: string;
  timestamp: string;
  userInput: string;
  mayaResponse: VoiceResponse;
  contextualData: any;
  confidence: number;
  emotion: string;
}

export class MayaVoiceIntelligence {
  private static instance: MayaVoiceIntelligence;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private currentConfig: VoiceConfig;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;

  constructor() {
    this.currentConfig = {
      provider: 'browser',
      language: 'en-US',
      voice: 'Maya',
      speed: 1.0,
      pitch: 1.0,
      emotionalTone: 'neutral'
    };
    this.initializeVoiceServices();
  }

  public static getInstance(): MayaVoiceIntelligence {
    if (!MayaVoiceIntelligence.instance) {
      MayaVoiceIntelligence.instance = new MayaVoiceIntelligence();
    }
    return MayaVoiceIntelligence.instance;
  }

  private async initializeVoiceServices(): Promise<void> {
    // Skip initialization during SSR
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Initialize Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.configureSpeechRecognition();
      }

      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
      }

      // Initialize Audio Context for voice visualization
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      console.log('Maya Voice Intelligence initialized successfully');
    } catch (error) {
      console.error('Failed to initialize voice services:', error);
    }
  }

  private configureSpeechRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.currentConfig.language;
    this.recognition.maxAlternatives = 3;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onListeningStateChange?.(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onListeningStateChange?.(false);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.onError?.(event.error);
    };

    this.recognition.onresult = (event) => {
      this.handleSpeechResult(event);
    };
  }

  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // Provide interim results for better UX
    if (interimTranscript) {
      this.onInterimResult?.(interimTranscript);
    }

    // Process final result
    if (finalTranscript) {
      this.processFinalTranscript(finalTranscript);
    }
  }

  private async processFinalTranscript(transcript: string): Promise<void> {
    try {
      // Analyze the emotional context of the speech
      const emotion = this.analyzeEmotionalContext(transcript);
      
      // Create contextual response
      const response = await this.generateContextualVoiceResponse(transcript, emotion);
      
      // Store interaction
      const interaction: VoiceInteraction = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        userInput: transcript,
        mayaResponse: response,
        contextualData: { emotion },
        confidence: 0.9,
        emotion
      };

      await this.storeVoiceInteraction(interaction);

      // Respond with voice
      await this.speakResponse(response);

      // Notify listeners
      this.onVoiceInteraction?.(interaction);

    } catch (error) {
      console.error('Failed to process speech transcript:', error);
      this.onError?.(error);
    }
  }

  private analyzeEmotionalContext(transcript: string): string {
    const lowerText = transcript.toLowerCase();
    
    // Urgent/Concerned
    if (lowerText.includes('urgent') || lowerText.includes('problem') || lowerText.includes('help')) {
      return 'concerned';
    }
    
    // Excited/Happy
    if (lowerText.includes('great') || lowerText.includes('awesome') || lowerText.includes('excellent')) {
      return 'excited';
    }
    
    // Question/Neutral
    if (lowerText.includes('?') || lowerText.startsWith('what') || lowerText.startsWith('how')) {
      return 'neutral';
    }

    return 'neutral';
  }

  private async generateContextualVoiceResponse(transcript: string, emotion: string): Promise<VoiceResponse> {
    try {
      // This would integrate with the contextual intelligence system
      const contextualResponse = await this.getContextualResponse(transcript);
      
      // Adapt response based on emotion and context
      const adaptedText = this.adaptResponseToContext(contextualResponse.text, emotion);
      
      // Generate audio if using external TTS
      let audioUrl;
      if (this.currentConfig.provider !== 'browser') {
        audioUrl = await this.generateAudio(adaptedText, emotion);
      }

      return {
        text: adaptedText,
        audioUrl,
        emotion: this.mapEmotionToResponseEmotion(emotion),
        urgency: this.determineUrgency(transcript),
        visualCues: this.generateVisualCues(emotion)
      };

    } catch (error) {
      console.error('Failed to generate voice response:', error);
      return {
        text: "I apologize, but I encountered an issue processing your request. Could you please try again?",
        emotion: 'neutral',
        urgency: 'low',
        visualCues: []
      };
    }
  }

  private adaptResponseToContext(text: string, emotion: string): string {
    switch (emotion) {
      case 'concerned':
        return `I understand this is important. ${text} Let me help you resolve this quickly.`;
      case 'excited':
        return `That's fantastic! ${text} I'm excited to help you build on this success.`;
      default:
        return text;
    }
  }

  private mapEmotionToResponseEmotion(emotion: string): 'neutral' | 'happy' | 'concerned' | 'excited' {
    switch (emotion) {
      case 'concerned':
        return 'concerned';
      case 'excited':
        return 'excited';
      default:
        return 'neutral';
    }
  }

  private determineUrgency(transcript: string): 'low' | 'medium' | 'high' {
    const lowerText = transcript.toLowerCase();
    
    if (lowerText.includes('urgent') || lowerText.includes('immediately') || lowerText.includes('asap')) {
      return 'high';
    }
    
    if (lowerText.includes('soon') || lowerText.includes('quickly') || lowerText.includes('problem')) {
      return 'medium';
    }
    
    return 'low';
  }

  private generateVisualCues(emotion: string): VoiceVisualCue[] {
    switch (emotion) {
      case 'concerned':
        return [{
          type: 'pulse',
          color: '#FF6B6B',
          intensity: 0.8,
          duration: 2000
        }];
      case 'excited':
        return [{
          type: 'particle',
          color: '#4ECDC4',
          intensity: 1.0,
          duration: 3000
        }];
      default:
        return [{
          type: 'waveform',
          color: '#45B7D1',
          intensity: 0.6,
          duration: 2000
        }];
    }
  }

  private async generateAudio(text: string, emotion: string): Promise<string | undefined> {
    try {
      switch (this.currentConfig.provider) {
        case 'elevenlabs':
          return await this.generateElevenLabsAudio(text, emotion);
        case 'sarvam':
          return await this.generateSarvamAudio(text, emotion);
        default:
          return undefined;
      }
    } catch (error) {
      console.error('Failed to generate audio:', error);
      return undefined;
    }
  }

  private async generateElevenLabsAudio(text: string, emotion: string): Promise<string> {
    const response = await fetch('/api/tts/elevenlabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_id: this.getVoiceIdForEmotion(emotion),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: this.getStyleForEmotion(emotion),
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      throw new Error('ElevenLabs TTS failed');
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  }

  private async generateSarvamAudio(text: string, emotion: string): Promise<string> {
    const response = await fetch('/api/tts/sarvam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: this.currentConfig.language,
        speaker: 'maya',
        pitch: this.getPitchForEmotion(emotion),
        pace: this.getPaceForEmotion(emotion)
      }),
    });

    if (!response.ok) {
      throw new Error('Sarvam TTS failed');
    }

    const result = await response.json();
    return result.audios[0];
  }

  private getVoiceIdForEmotion(emotion: string): string {
    // ElevenLabs voice IDs for different emotions
    switch (emotion) {
      case 'concerned':
        return 'pNInz6obpgDQGcFmaJgB'; // Professional, concerned
      case 'excited':
        return '21m00Tcm4TlvDq8ikWAM'; // Enthusiastic
      default:
        return 'EXAVITQu4vr4xnSDxMaL'; // Neutral, professional
    }
  }

  private getStyleForEmotion(emotion: string): number {
    switch (emotion) {
      case 'concerned':
        return 0.2; // More serious
      case 'excited':
        return 0.8; // More expressive
      default:
        return 0.5; // Balanced
    }
  }

  private getPitchForEmotion(emotion: string): number {
    switch (emotion) {
      case 'concerned':
        return 0.8; // Lower pitch
      case 'excited':
        return 1.2; // Higher pitch
      default:
        return 1.0; // Normal pitch
    }
  }

  private getPaceForEmotion(emotion: string): number {
    switch (emotion) {
      case 'concerned':
        return 0.9; // Slightly slower
      case 'excited':
        return 1.1; // Slightly faster
      default:
        return 1.0; // Normal pace
    }
  }

  async speakResponse(response: VoiceResponse): Promise<void> {
    console.log('🔊 Maya Voice Intelligence - speakResponse called with:', {
      text: response.text.substring(0, 100) + '...',
      emotion: response.emotion,
      hasAudioUrl: !!response.audioUrl,
      hasSynthesis: !!this.synthesis
    });

    try {
      if (response.audioUrl) {
        console.log('🔊 Maya Voice Intelligence - Using audio URL');
        await this.playAudioUrl(response.audioUrl);
      } else if (this.synthesis) {
        console.log('🔊 Maya Voice Intelligence - Using browser TTS');
        await this.speakWithBrowserTTS(response.text, response.emotion);
      } else {
        console.warn('🔊 Maya Voice Intelligence - No TTS method available');
      }
    } catch (error) {
      console.error('🔊 Maya Voice Intelligence - Failed to speak response:', error);
    }
  }

  private async playAudioUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      
      audio.onended = () => resolve();
      audio.onerror = (error) => reject(error);
      
      audio.play().catch(reject);
    });
  }

  private async speakWithBrowserTTS(text: string, emotion: 'neutral' | 'happy' | 'concerned' | 'excited'): Promise<void> {
    if (!this.synthesis) return;

    console.log('🔊 Maya Voice Intelligence - TTS starting with text length:', text.length);
    console.log('🔊 Maya Voice Intelligence - Text preview:', text.substring(0, 100) + '...');
    console.log('🔊 Maya Voice Intelligence - Emotion:', emotion);

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice based on emotion
      utterance.rate = this.getRate(emotion);
      utterance.pitch = this.getPitch(emotion);
      utterance.volume = 0.8;
      
      console.log('🔊 Maya Voice Intelligence - Voice settings:', {
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume
      });
      
      // Select appropriate voice
      const voices = this.synthesis!.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('helen')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
        console.log('🔊 Maya Voice Intelligence - Selected voice:', femaleVoice.name);
      } else {
        console.log('🔊 Maya Voice Intelligence - No female voice found, using default');
      }

      utterance.onstart = () => {
        console.log('🔊 Maya Voice Intelligence - Speech started');
      };

      utterance.onend = () => {
        console.log('🔊 Maya Voice Intelligence - Speech ended normally');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('🔊 Maya Voice Intelligence - Speech error:', event.error);
        resolve();
      };

      utterance.onboundary = (event) => {
        console.log('🔊 Maya Voice Intelligence - Speech boundary:', event.name, 'at char:', event.charIndex);
      };

      console.log('🔊 Maya Voice Intelligence - Starting speech synthesis...');
      this.synthesis!.speak(utterance);
    });
  }

  private getRate(emotion: 'neutral' | 'happy' | 'concerned' | 'excited'): number {
    switch (emotion) {
      case 'concerned':
        return 0.8;
      case 'excited':
        return 1.2;
      default:
        return 1.0;
    }
  }

  private getPitch(emotion: 'neutral' | 'happy' | 'concerned' | 'excited'): number {
    switch (emotion) {
      case 'concerned':
        return 0.8;
      case 'excited':
        return 1.2;
      default:
        return 1.0;
    }
  }

  // Public API methods
  async startListening(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not available');
    }

    if (this.isListening) {
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start listening:', error);
      throw error;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  updateVoiceConfig(config: Partial<VoiceConfig>): void {
    this.currentConfig = { ...this.currentConfig, ...config };
  }

  getVoiceCapabilities(): any {
    return {
      speechRecognition: !!this.recognition,
      speechSynthesis: !!this.synthesis,
      audioContext: !!this.audioContext,
      languages: this.getAvailableLanguages(),
      voices: this.getAvailableVoices(),
      providers: ['browser', 'elevenlabs', 'sarvam']
    };
  }

  private getAvailableLanguages(): string[] {
    return [
      'en-US', 'en-GB', 'en-AU',
      'hi-IN', 'bn-IN', 'ta-IN',
      'es-ES', 'fr-FR', 'de-DE',
      'ja-JP', 'ko-KR', 'zh-CN'
    ];
  }

  private getAvailableVoices(): string[] {
    if (!this.synthesis) return [];
    
    return this.synthesis.getVoices().map(voice => voice.name);
  }

  // Event handlers (to be set by the component)
  onListeningStateChange: ((isListening: boolean) => void) | null = null;
  onInterimResult: ((transcript: string) => void) | null = null;
  onVoiceInteraction: ((interaction: VoiceInteraction) => void) | null = null;
  onError: ((error: any) => void) | null = null;

  // Private helper methods
  private async getContextualResponse(transcript: string): Promise<any> {
    // This would integrate with Maya Contextual Intelligence
    return {
      text: `I understand you said: "${transcript}". How can I help you with your marketing campaigns?`
    };
  }

  private async storeVoiceInteraction(interaction: VoiceInteraction): Promise<void> {
    try {
      // Store in Supabase for analytics and learning
      await fetch('/api/maya/voice-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interaction),
      });
    } catch (error) {
      console.error('Failed to store voice interaction:', error);
    }
  }
}

// Export a function to get the instance safely on client-side only
export const getMayaVoiceIntelligence = (): MayaVoiceIntelligence | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return MayaVoiceIntelligence.getInstance();
};