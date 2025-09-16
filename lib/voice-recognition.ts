// Voice Recognition Service for Agent Maya
export class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null
  private isSupported: boolean = false
  private isListening: boolean = false
  private onResultCallback: ((transcript: string) => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null
  private onStartCallback: (() => void) | null = null
  private onEndCallback: (() => void) | null = null
  private currentLanguage: string = 'en-US'
  private supportedLanguages: string[] = ['en-US', 'hi-IN', 'fr-FR', 'de-DE']

  constructor() {
    this.checkSupport()
    this.initializeRecognition()
  }

  private checkSupport(): void {
    if (typeof window !== 'undefined') {
      this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    }
  }

  private initializeRecognition(): void {
    if (!this.isSupported || typeof window === 'undefined') return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()

    if (this.recognition) {
      this.recognition.continuous = false
      this.recognition.interimResults = true
      this.recognition.lang = this.currentLanguage
      this.recognition.maxAlternatives = 1

      this.recognition.onstart = () => {
        this.isListening = true
        this.onStartCallback?.()
      }

      this.recognition.onend = () => {
        this.isListening = false
        this.onEndCallback?.()
      }

      this.recognition.onerror = (event) => {
        this.isListening = false
        const errorMessage = this.getErrorMessage(event.error)
        this.onErrorCallback?.(errorMessage)
      }

      this.recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          this.onResultCallback?.(finalTranscript.trim())
        }
      }
    }
  }

  private getErrorMessage(error: string): string {
    switch (error) {
      case 'network':
        return 'Network error occurred during speech recognition'
      case 'not-allowed':
        return 'Microphone access denied. Please enable microphone permissions.'
      case 'no-speech':
        return 'No speech detected. Please try speaking again.'
      case 'audio-capture':
        return 'Audio capture failed. Please check your microphone.'
      case 'service-not-allowed':
        return 'Speech recognition service not allowed'
      default:
        return `Speech recognition error: ${error}`
    }
  }

  public isVoiceSupported(): boolean {
    return this.isSupported
  }

  public isCurrentlyListening(): boolean {
    return this.isListening
  }

  public startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (!this.isSupported || !this.recognition) {
      onError?.('Speech recognition not supported in this browser')
      return false
    }

    if (this.isListening) {
      this.stopListening()
    }

    this.onResultCallback = onResult
    this.onErrorCallback = onError
    this.onStartCallback = onStart
    this.onEndCallback = onEnd

    try {
      this.recognition.start()
      return true
    } catch (error) {
      onError?.('Failed to start speech recognition')
      return false
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  public async requestMicrophonePermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      return false
    }
  }

  public setLanguage(language: string): boolean {
    if (this.supportedLanguages.includes(language)) {
      this.currentLanguage = language
      if (this.recognition) {
        this.recognition.lang = this.currentLanguage
      }
      console.log(`🌐 Voice Recognition language changed to: ${language}`)
      return true
    }
    console.warn(`🌐 Unsupported language: ${language}`)
    return false
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage
  }

  public getSupportedLanguages(): Array<{code: string, name: string}> {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'hi-IN', name: 'हिंदी (Hindi)' },
      { code: 'fr-FR', name: 'Français (French)' },
      { code: 'de-DE', name: 'Deutsch (German)' }
    ]
  }

  public setMultiLanguageMode(): void {
    // Enable auto-detection by using multiple languages
    if (this.recognition) {
      // English first (primary), then Hindi and other languages for mixed conversations
      this.recognition.lang = 'en-US,hi-IN,fr-FR,de-DE'
      console.log('🌐 Multi-language mode enabled: English (primary) + Hindi + French + German')
    }
  }
}

// Voice Provider Types
export type VoiceProvider = 'web' | 'elevenlabs' | 'sarvam';

export interface VoiceSettings {
  provider: VoiceProvider;
  voiceId?: string;
  apiKey?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  usePersonalKey?: boolean; // When false, use centralized API
}

export interface VoiceConfig {
  elevenlabs: {
    available: boolean;
    keySource: 'centralized' | 'user' | null;
  };
  sarvam: {
    available: boolean;
    keySource: 'centralized' | 'user' | null;
  };
}

// Text-to-Speech Service for Agent Maya responses
export class TextToSpeechService {
  private synth: SpeechSynthesis | null = null
  private isSupported: boolean = false
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private settings: VoiceSettings = { provider: 'web', rate: 0.9, pitch: 1, volume: 1, usePersonalKey: false }
  private voiceConfig: VoiceConfig | null = null

  constructor() {
    this.checkSupport()
    this.loadSettings()
  }

  private checkSupport(): void {
    if (typeof window !== 'undefined') {
      this.isSupported = 'speechSynthesis' in window
      this.synth = window.speechSynthesis
    }
  }

  private preprocessTextForTTS(text: string): string {
    return text
      // Remove emojis and special Unicode characters
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Replace markdown bold/italic with plain text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Replace en-dashes and em-dashes with regular dashes
      .replace(/[—–]/g, '-')
      // Replace special quotes with regular quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Remove markdown links but keep the text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Clean up multiple spaces and line breaks
      .replace(/\s+/g, ' ')
      .trim()
  }

  private loadSettings(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('maya-voice-settings')
      if (saved) {
        try {
          this.settings = { ...this.settings, ...JSON.parse(saved) }
        } catch (error) {
          console.warn('Failed to load voice settings:', error)
        }
      }
    }
  }

  public updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    if (typeof window !== 'undefined') {
      localStorage.setItem('maya-voice-settings', JSON.stringify(this.settings))
    }
  }

  public getSettings(): VoiceSettings {
    return { ...this.settings }
  }

  public async loadVoiceConfig(): Promise<VoiceConfig> {
    console.log('🔧 Voice Config - Starting to load voice configuration');
    
    if (this.voiceConfig) {
      console.log('🔧 Voice Config - Using cached config:', this.voiceConfig);
      return this.voiceConfig;
    }

    try {
      // Get Firebase ID token for authentication (same pattern as Maya context)
      console.log('🔧 Voice Config - Importing Firebase auth');
      const auth = await import('@/lib/firebase')
      
      const currentUser = auth.auth.currentUser;
      console.log('🔧 Voice Config - Current user status:', currentUser ? 'logged in' : 'not logged in');
      
      const idToken = await currentUser?.getIdToken()
      console.log('🔧 Voice Config - ID token obtained:', idToken ? 'yes' : 'no');
      
      if (!idToken) {
        console.warn('🔧 Voice Config - No Firebase ID token available for voice config')
        throw new Error('Authentication required')
      }
      
      console.log('🔧 Voice Config - Making API request to /api/voice/config');
      const response = await fetch('/api/voice/config', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      console.log('🔧 Voice Config - API response status:', response.status);
      console.log('🔧 Voice Config - API response ok:', response.ok);
      
      if (response.ok) {
        this.voiceConfig = await response.json();
        console.log('🔧 Voice Config - Loaded successfully:', this.voiceConfig);
        return this.voiceConfig!;
      } else {
        const errorText = await response.text();
        console.error('🔧 Voice Config - API error response:', errorText);
        throw new Error(`Config API error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('🔧 Voice Config - Failed to load voice config:', error);
    }

    // Fallback config
    console.log('🔧 Voice Config - Using fallback config (no APIs available)');
    this.voiceConfig = {
      elevenlabs: { available: false, keySource: null },
      sarvam: { available: false, keySource: null }
    };
    return this.voiceConfig;
  }

  public isSpeechSupported(): boolean {
    return this.isSupported
  }

  public async speak(
    text: string, 
    options: {
      voice?: string
      rate?: number
      pitch?: number
      volume?: number
      onStart?: () => void
      onEnd?: () => void
      onError?: (error: Event | string) => void
    } = {}
  ): Promise<boolean> {
    console.log('🔊 TTS Main - speak() called with provider:', this.settings.provider);
    console.log('🔊 TTS Main - Text preview:', text.substring(0, 50) + '...');
    console.log('🔊 TTS Main - Settings:', this.settings);
    console.log('🔊 TTS Main - Stopping any current speech first');
    
    // Stop any current speech
    this.stop()

    const finalOptions = {
      ...options,
      rate: options.rate || this.settings.rate,
      pitch: options.pitch || this.settings.pitch,
      volume: options.volume || this.settings.volume
    }
    
    console.log('🔊 TTS Main - Final options:', finalOptions);

    try {
      // Load voice config to check for centralized APIs
      console.log('🔊 TTS Main - Loading voice config...');
      const config = await this.loadVoiceConfig();
      console.log('🔊 TTS Main - Voice config loaded:', config);
      
      console.log('🔊 TTS Main - Selecting provider path:', this.settings.provider);
      
      switch (this.settings.provider) {
        case 'elevenlabs':
          console.log('🔊 TTS Main - Using ElevenLabs path');
          return await this.speakElevenLabs(text, finalOptions, config)
        case 'sarvam':
          console.log('🔊 TTS Main - Using Sarvam path');
          return await this.speakSarvam(text, finalOptions, config)
        case 'web':
        default:
          console.log('🔊 TTS Main - Using Web Speech API path');
          return this.speakWeb(text, finalOptions)
      }
    } catch (error) {
      console.error('🔊 TTS Main - Error in speak():', error);
      options.onError?.(error instanceof Error ? error.message : 'Speech synthesis failed')
      return false
    }
  }

  private speakWeb(text: string, options: any): boolean {
    if (!this.isSupported || !this.synth) {
      return false
    }

    // Clean text for better TTS compatibility
    const cleanedText = this.preprocessTextForTTS(text)
    console.log('Original text:', text)
    console.log('Cleaned text:', cleanedText)

    this.currentUtterance = new SpeechSynthesisUtterance(cleanedText)
    
    // Set voice properties
    this.currentUtterance.rate = options.rate || 0.9
    this.currentUtterance.pitch = options.pitch || 1
    this.currentUtterance.volume = options.volume || 1

    // Set voice if specified
    if (options.voice) {
      const voices = this.synth.getVoices()
      const selectedVoice = voices.find(voice => 
        voice.name.toLowerCase().includes(options.voice!.toLowerCase())
      )
      if (selectedVoice) {
        this.currentUtterance.voice = selectedVoice
      }
    } else {
      // Default to female voice for Maya
      const voices = this.synth.getVoices()
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('susan')
      )
      if (femaleVoice) {
        this.currentUtterance.voice = femaleVoice
      }
    }

    // Set event handlers
    this.currentUtterance.onstart = () => {
      console.log('🔊 Web TTS - Speech started')
      options.onStart?.()
    }
    this.currentUtterance.onend = () => {
      console.log('🔊 Web TTS - Speech ended normally')
      options.onEnd?.()
    }
    this.currentUtterance.onerror = (event) => {
      console.error('🔊 Web TTS - Speech error:', event.error)
      options.onError?.(event)
    }

    console.log('🔊 Web TTS - Starting speech synthesis...')
    this.synth.speak(this.currentUtterance)
    return true
  }

  private async speakElevenLabs(text: string, options: any, config: VoiceConfig): Promise<boolean> {
    const voiceId = this.settings.voiceId || 'EXAVITQu4vr4xnSDxMaL' // Default Bella voice

    console.log('🔊 ElevenLabs TTS - Starting synthesis');
    console.log('🔊 ElevenLabs TTS - Text length:', text.length);
    console.log('🔊 ElevenLabs TTS - Voice ID:', voiceId);
    console.log('🔊 ElevenLabs TTS - Config:', config);
    console.log('🔊 ElevenLabs TTS - Settings:', this.settings);

    try {
      options.onStart?.()
      
      let audioBuffer: ArrayBuffer;

      // Use centralized API if available and user hasn't opted for personal key
      if (config.elevenlabs.available && !this.settings.usePersonalKey) {
        console.log('🔊 ElevenLabs TTS - Using centralized API');
        
        // Get Firebase ID token for authentication
        const auth = await import('@/lib/firebase')
        console.log('🔊 ElevenLabs TTS - Firebase auth imported');
        
        const currentUser = auth.auth.currentUser;
        console.log('🔊 ElevenLabs TTS - Current user:', currentUser ? 'logged in' : 'not logged in');
        
        const idToken = await currentUser?.getIdToken()
        console.log('🔊 ElevenLabs TTS - ID token obtained:', idToken ? 'yes' : 'no');
        console.log('🔊 ElevenLabs TTS - Token preview:', idToken ? idToken.substring(0, 20) + '...' : 'null');
        
        if (!idToken) {
          throw new Error('Authentication required for premium voices');
        }
        
        const requestBody = {
          text,
          provider: 'elevenlabs',
          voiceId,
          settings: options
        };
        
        console.log('🔊 ElevenLabs TTS - Making API request to /api/voice/synthesize');
        console.log('🔊 ElevenLabs TTS - Request body:', requestBody);
        
        const response = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('🔊 ElevenLabs TTS - API response status:', response.status);
        console.log('🔊 ElevenLabs TTS - API response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔊 ElevenLabs TTS - API error response:', errorText);
          throw new Error(`Centralized ElevenLabs API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('🔊 ElevenLabs TTS - API response data keys:', Object.keys(data));
        console.log('🔊 ElevenLabs TTS - Audio data length:', data.audio ? data.audio.length : 'no audio');
        
        audioBuffer = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0)).buffer;
        console.log('🔊 ElevenLabs TTS - Audio buffer created, size:', audioBuffer.byteLength);
      } else {
        // Use personal API key
        console.log('🔊 ElevenLabs TTS - Using personal API key path');
        console.log('🔊 ElevenLabs TTS - this.settings.apiKey exists:', !!this.settings.apiKey);
        
        if (!this.settings.apiKey) {
          throw new Error('ElevenLabs API key not configured')
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.settings.apiKey
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.5,
              use_speaker_boost: true
            }
          })
        })

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status}`)
        }

        audioBuffer = await response.arrayBuffer()
      }

      // Play the audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const audioData = await audioContext.decodeAudioData(audioBuffer)
      
      const source = audioContext.createBufferSource()
      source.buffer = audioData
      source.connect(audioContext.destination)
      
      source.onended = options.onEnd || null
      source.start(0)
      
      return true
    } catch (error) {
      throw error
    }
  }

  private async speakSarvam(text: string, options: any, config: VoiceConfig): Promise<boolean> {
    const voiceId = this.settings.voiceId || 'anushka' // Default Anushka voice (Bulbul v2)

    try {
      options.onStart?.()
      
      let audioBuffer: ArrayBuffer;

      // Use centralized API if available and user hasn't opted for personal key
      if (config.sarvam.available && !this.settings.usePersonalKey) {
        // Get Firebase ID token for authentication
        const auth = await import('@/lib/firebase')
        const idToken = await auth.auth.currentUser?.getIdToken()
        
        if (!idToken) {
          throw new Error('Authentication required for premium voices');
        }
        
        const response = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            text,
            provider: 'sarvam',
            voiceId,
            languageCode: this.settings.languageCode || 'en-IN',
            settings: options
          })
        });

        if (!response.ok) {
          throw new Error(`Centralized Sarvam API error: ${response.status}`);
        }

        const data = await response.json();
        audioBuffer = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0)).buffer;
      } else {
        // Use personal API key
        if (!this.settings.apiKey) {
          throw new Error('Sarvam API key not configured')
        }

        const response = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'API-Subscription-Key': this.settings.apiKey
          },
          body: JSON.stringify({
            inputs: [text],
            target_language_code: 'en-IN',
            speaker: voiceId,
            pitch: options.pitch || 0,
            pace: options.rate || 1.0,
            loudness: options.volume || 1.0,
            speech_sample_rate: 22050,
            enable_preprocessing: true,
            model: 'bulbul:v1'
          })
        })

        if (!response.ok) {
          throw new Error(`Sarvam API error: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.audios && data.audios.length > 0) {
          const audioBase64 = data.audios[0]
          audioBuffer = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0)).buffer
        } else {
          throw new Error('No audio data received from Sarvam')
        }
      }

      // Play the audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const audioData = await audioContext.decodeAudioData(audioBuffer)
      
      const source = audioContext.createBufferSource()
      source.buffer = audioData
      source.connect(audioContext.destination)
      
      source.onended = options.onEnd || null
      source.start(0)
      
      return true
    } catch (error) {
      throw error
    }
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  public pause(): void {
    if (this.synth) {
      this.synth.pause()
    }
  }

  public resume(): void {
    if (this.synth) {
      this.synth.resume()
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported || !this.synth) {
      return []
    }
    return this.synth.getVoices()
  }

  public getAvailableProviders(): Array<{provider: VoiceProvider, name: string, description: string}> {
    return [
      {
        provider: 'web',
        name: 'Standard Voices',
        description: 'Built-in browser voices (free)'
      },
      {
        provider: 'elevenlabs',
        name: 'Premium Voices Global',
        description: 'High-quality AI voices with natural speech'
      },
      {
        provider: 'sarvam',
        name: 'Premium Indian Voices',
        description: 'Natural Indian English voices with local accents'
      }
    ]
  }

  public getElevenLabsVoices(): Array<{id: string, name: string, category: string, language: string}> {
    return [
      // English
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'English', language: 'English (US)' },
      { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'English', language: 'English (US)' },
      { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', category: 'English', language: 'English (US)' },
      { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'English', language: 'English (US)' },
      { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', category: 'English', language: 'English (US)' },
      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'English', language: 'English (US)' },
      { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'English', language: 'English (US)' },
      
      // Spanish
      { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Mateo', category: 'Spanish', language: 'Spanish (Spain)' },
      { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Valentina', category: 'Spanish', language: 'Spanish (Mexico)' },
      { id: 'jsCqWAovK2LkecY7zXl4', name: 'Diego', category: 'Spanish', language: 'Spanish (Mexico)' },
      
      // French
      { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Sophie', category: 'French', language: 'French (France)' },
      { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', category: 'French', language: 'French (France)' },
      { id: 'IKne3meq5aSn9XLyUdCD', name: 'Pierre', category: 'French', language: 'French (France)' },
      
      // German
      { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Freya', category: 'German', language: 'German (Germany)' },
      { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Klaus', category: 'German', language: 'German (Germany)' },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Greta', category: 'German', language: 'German (Germany)' },
      
      // Japanese
      { id: 'XB0fDUnXU5powFXDhCwa', name: 'Akira', category: 'Japanese', language: 'Japanese (Japan)' },
      { id: 'IKne3meq5aSn9XLyUdCD', name: 'Yuki', category: 'Japanese', language: 'Japanese (Japan)' },
      { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Hana', category: 'Japanese', language: 'Japanese (Japan)' },
      
      // Korean
      { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Min-jun', category: 'Korean', language: 'Korean (South Korea)' },
      { id: 'XrExE9yKIg1WjnnlVkGX', name: 'So-young', category: 'Korean', language: 'Korean (South Korea)' },
      
      // Chinese (Mandarin)
      { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Wei', category: 'Chinese', language: 'Chinese (Mandarin)' },
      { id: 'jsCqWAovK2LkecY7zXl4', name: 'Li', category: 'Chinese', language: 'Chinese (Mandarin)' },
      
      // Arabic
      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Omar', category: 'Arabic', language: 'Arabic (Standard)' },
      { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Layla', category: 'Arabic', language: 'Arabic (Standard)' }
    ]
  }

  public getSarvamVoices(): Array<{id: string, name: string, language: string, languageCode: string}> {
    return [
      // English (Indian)
      { id: 'meera', name: 'Meera', language: 'English (Indian)', languageCode: 'en-IN' },
      { id: 'pavithra', name: 'Pavithra', language: 'English (Indian)', languageCode: 'en-IN' },
      { id: 'maitreyi', name: 'Maitreyi', language: 'English (Indian)', languageCode: 'en-IN' },
      { id: 'arvind', name: 'Arvind', language: 'English (Indian)', languageCode: 'en-IN' },
      { id: 'amol', name: 'Amol', language: 'English (Indian)', languageCode: 'en-IN' },
      { id: 'arjun', name: 'Arjun', language: 'English (Indian)', languageCode: 'en-IN' },
      { id: 'maya', name: 'Maya', language: 'English (Indian)', languageCode: 'en-IN' },
      { id: 'anushka', name: 'Anushka', language: 'English (Indian)', languageCode: 'en-IN' },
      
      // Hindi
      { id: 'meera', name: 'Meera', language: 'Hindi', languageCode: 'hi-IN' },
      { id: 'arvind', name: 'Arvind', language: 'Hindi', languageCode: 'hi-IN' },
      { id: 'amol', name: 'Amol', language: 'Hindi', languageCode: 'hi-IN' },
      { id: 'maya', name: 'Maya', language: 'Hindi', languageCode: 'hi-IN' },
      { id: 'anushka', name: 'Anushka', language: 'Hindi', languageCode: 'hi-IN' },
      
      // Tamil
      { id: 'meera', name: 'Meera', language: 'Tamil', languageCode: 'ta-IN' },
      { id: 'pavithra', name: 'Pavithra', language: 'Tamil', languageCode: 'ta-IN' },
      { id: 'arjun', name: 'Arjun', language: 'Tamil', languageCode: 'ta-IN' },
      
      // Telugu
      { id: 'pavithra', name: 'Pavithra', language: 'Telugu', languageCode: 'te-IN' },
      { id: 'arjun', name: 'Arjun', language: 'Telugu', languageCode: 'te-IN' },
      
      // Kannada
      { id: 'meera', name: 'Meera', language: 'Kannada', languageCode: 'kn-IN' },
      { id: 'arvind', name: 'Arvind', language: 'Kannada', languageCode: 'kn-IN' },
      
      // Punjabi
      { id: 'amol', name: 'Amol', language: 'Punjabi', languageCode: 'pa-IN' },
      { id: 'arvind', name: 'Arvind', language: 'Punjabi', languageCode: 'pa-IN' },
      
      // Bengali
      { id: 'maya', name: 'Maya', language: 'Bengali', languageCode: 'bn-IN' },
      { id: 'anushka', name: 'Anushka', language: 'Bengali', languageCode: 'bn-IN' },
      
      // Gujarati
      { id: 'meera', name: 'Meera', language: 'Gujarati', languageCode: 'gu-IN' },
      { id: 'amol', name: 'Amol', language: 'Gujarati', languageCode: 'gu-IN' },
      
      // Marathi
      { id: 'maya', name: 'Maya', language: 'Marathi', languageCode: 'mr-IN' },
      { id: 'arvind', name: 'Arvind', language: 'Marathi', languageCode: 'mr-IN' }
    ]
  }

  public isSpeaking(): boolean {
    return this.synth?.speaking || false
  }
}

// Combined Voice Service for Agent Maya
export class MayaVoiceService {
  private speechRecognition: VoiceRecognitionService
  private textToSpeech: TextToSpeechService
  private isEnabled: boolean = false

  constructor() {
    this.speechRecognition = new VoiceRecognitionService()
    this.textToSpeech = new TextToSpeechService()
  }

  public async initialize(): Promise<boolean> {
    if (!this.speechRecognition.isVoiceSupported()) {
      console.warn('Speech recognition not supported')
      return false
    }

    const hasPermission = await this.speechRecognition.requestMicrophonePermission()
    if (!hasPermission) {
      console.warn('Microphone permission denied')
      return false
    }

    this.isEnabled = true
    return true
  }

  public isVoiceEnabled(): boolean {
    return this.isEnabled && this.speechRecognition.isVoiceSupported()
  }

  public startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (!this.isEnabled) {
      onError?.('Voice service not initialized')
      return false
    }

    return this.speechRecognition.startListening(onResult, onError, onStart, onEnd)
  }

  public stopListening(): void {
    this.speechRecognition.stopListening()
  }

  public isListening(): boolean {
    return this.speechRecognition.isCurrentlyListening()
  }

  public async speakResponse(text: string, onEnd?: () => void): Promise<boolean> {
    try {
      console.log('🔊 Maya TTS - Full text length:', text.length)
      console.log('🔊 Maya TTS - Text preview:', text.substring(0, 100) + '...')
      
      return await this.textToSpeech.speak(text, {
        voice: 'female', // Prefer female voice for Maya
        rate: 0.9, // Slightly slower for clarity
        onEnd: () => {
          console.log('🔊 Maya TTS - Speech ended successfully')
          onEnd?.()
        }
      })
    } catch (error) {
      console.error('🔊 Maya TTS - Speech synthesis error:', error)
      return false
    }
  }

  public updateVoiceSettings(settings: Partial<VoiceSettings>): void {
    this.textToSpeech.updateSettings(settings)
  }

  public getVoiceSettings(): VoiceSettings {
    return this.textToSpeech.getSettings()
  }

  public getAvailableProviders() {
    return this.textToSpeech.getAvailableProviders()
  }

  public stopSpeaking(): void {
    this.textToSpeech.stop()
  }

  public isSpeaking(): boolean {
    return this.textToSpeech.isSpeaking()
  }

  public async loadVoiceConfig(): Promise<VoiceConfig> {
    return await this.textToSpeech.loadVoiceConfig()
  }

  public setVoiceLanguage(language: string): boolean {
    return this.speechRecognition.setLanguage(language)
  }

  public getCurrentVoiceLanguage(): string {
    return this.speechRecognition.getCurrentLanguage()
  }

  public getSupportedVoiceLanguages(): Array<{code: string, name: string}> {
    return this.speechRecognition.getSupportedLanguages()
  }

  public enableMultiLanguageMode(): void {
    this.speechRecognition.setMultiLanguageMode()
  }
}

// Global instance
export const mayaVoiceService = new MayaVoiceService()

// Type definitions for speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}