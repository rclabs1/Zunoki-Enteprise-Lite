interface VoiceProvider {
  name: 'elevenlabs' | 'sarvam' | 'web-tts';
  priority: number;
  available: boolean;
  cost: 'paid' | 'free';
  quality: 'high' | 'medium' | 'basic';
  apiKey?: string;
  endpoint?: string;
}

interface VoiceNarrationOptions {
  text: string;
  voice?: string;
  speed?: number;
  pitch?: number;
  language?: string;
  preferredProvider?: 'elevenlabs' | 'sarvam' | 'web-tts';
}

interface ChartNarrationData {
  chartType: string;
  insights: string[];
  metrics: Array<{
    name: string;
    value: number | string;
    trend?: 'up' | 'down' | 'stable';
    change?: number;
  }>;
  timeframe?: string;
  platforms?: string[];
}

class MayaVoiceNarrationService {
  private providers: VoiceProvider[];
  private currentProvider: VoiceProvider | null = null;
  private isInitialized = false;

  constructor() {
    this.providers = [
      {
        name: 'elevenlabs',
        priority: 1,
        available: !!process.env.ELEVENLABS_API_KEY,
        cost: 'paid',
        quality: 'high',
        apiKey: process.env.ELEVENLABS_API_KEY,
        endpoint: 'https://api.elevenlabs.io/v1/text-to-speech'
      },
      {
        name: 'sarvam',
        priority: 2,
        available: !!process.env.SARVAM_API_KEY,
        cost: 'paid',
        quality: 'high',
        apiKey: process.env.SARVAM_API_KEY,
        endpoint: 'https://api.sarvam.ai/text-to-speech'
      },
      {
        name: 'web-tts',
        priority: 3,
        available: typeof window !== 'undefined' && 'speechSynthesis' in window,
        cost: 'free',
        quality: 'basic'
      }
    ];

    this.currentProvider = this.selectBestProvider();
  }

  private selectBestProvider(): VoiceProvider | null {
    // Priority: ElevenLabs > Sarvam > Web TTS
    const availableProviders = this.providers.filter(p => p.available);
    return availableProviders[0] || null;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Test current provider
      if (this.currentProvider) {
        await this.testProvider(this.currentProvider);
        this.isInitialized = true;
        return true;
      }

      // Try fallback providers
      for (const provider of this.providers.filter(p => p.available)) {
        try {
          await this.testProvider(provider);
          this.currentProvider = provider;
          this.isInitialized = true;
          return true;
        } catch (error) {
          console.warn(`Provider ${provider.name} test failed:`, error);
          continue;
        }
      }

      console.error('No voice providers available');
      return false;
    } catch (error) {
      console.error('Voice narration service initialization failed:', error);
      return false;
    }
  }

  private async testProvider(provider: VoiceProvider): Promise<void> {
    switch (provider.name) {
      case 'elevenlabs':
        await this.testElevenLabs();
        break;
      case 'sarvam':
        await this.testSarvam();
        break;
      case 'web-tts':
        await this.testWebTTS();
        break;
    }
  }

  private async testElevenLabs(): Promise<void> {
    if (!this.providers[0].apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': this.providers[0].apiKey!
      }
    });

    if (!response.ok) {
      throw new Error('ElevenLabs API test failed');
    }
  }

  private async testSarvam(): Promise<void> {
    if (!this.providers[1].apiKey) {
      throw new Error('Sarvam API key not configured');
    }

    // Simple API test for Sarvam
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.providers[1].apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'test',
        voice: 'en-IN-female',
        format: 'mp3'
      })
    });

    if (response.status !== 200 && response.status !== 400) {
      throw new Error('Sarvam API test failed');
    }
  }

  private async testWebTTS(): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      throw new Error('Web Speech API not available');
    }
  }

  async narrateChart(chartData: ChartNarrationData): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        console.warn('Voice narration not available');
        return;
      }
    }

    const narrationText = this.generateChartNarration(chartData);
    return this.speak(narrationText);
  }

  private generateChartNarration(data: ChartNarrationData): string {
    let narration = '';

    // Opening based on chart type
    switch (data.chartType) {
      case 'line':
        narration += `Looking at your ${data.metrics[0]?.name || 'performance'} trend, `;
        break;
      case 'bar':
        narration += `Comparing your metrics across platforms, `;
        break;
      case 'pie':
        narration += `Breaking down your spend distribution, `;
        break;
      default:
        narration += `Analyzing your marketing performance, `;
    }

    // Add key insights
    if (data.insights && data.insights.length > 0) {
      narration += data.insights[0];
      
      if (data.insights.length > 1) {
        narration += `. Additionally, ${data.insights[1]}`;
      }
    }

    // Add specific metric callouts
    if (data.metrics && data.metrics.length > 0) {
      const primaryMetric = data.metrics[0];
      if (primaryMetric.trend) {
        const trendText = primaryMetric.trend === 'up' ? 'increased' : 
                         primaryMetric.trend === 'down' ? 'decreased' : 'remained stable';
        
        if (primaryMetric.change) {
          narration += `. Your ${primaryMetric.name} has ${trendText} by ${Math.abs(primaryMetric.change)}%.`;
        }
      }
    }

    // Add platforms context
    if (data.platforms && data.platforms.length > 1) {
      narration += ` This analysis covers ${data.platforms.join(', ')} platforms`;
      if (data.timeframe) {
        narration += ` over the ${data.timeframe}`;
      }
      narration += '.';
    }

    return narration;
  }

  async speak(options: VoiceNarrationOptions | string): Promise<void> {
    const narrationOptions = typeof options === 'string' 
      ? { text: options } 
      : options;

    // Use voice coordinator instead of direct speech
    try {
      const { speakWithCoordination } = await import('./voice-coordinator');
      console.log('🎯 Chart Narration - Using coordinated voice for USP feature');
      
      // Use chart narration priority to preserve USP while coordinating
      await speakWithCoordination.chartNarration(narrationOptions.text);
      return;
    } catch (error) {
      console.warn('🎯 Chart Narration - Coordinator not available, using direct speech:', error);
    }

    // Fallback to original implementation if coordinator fails
    if (!this.currentProvider) {
      console.warn('No voice provider available');
      return;
    }

    try {
      switch (this.currentProvider.name) {
        case 'elevenlabs':
          await this.speakWithElevenLabs(narrationOptions);
          break;
        case 'sarvam':
          await this.speakWithSarvam(narrationOptions);
          break;
        case 'web-tts':
          await this.speakWithWebTTS(narrationOptions);
          break;
      }
    } catch (error) {
      console.error(`Speech failed with ${this.currentProvider.name}:`, error);
      
      // Try fallback provider
      await this.fallbackToNextProvider();
      if (this.currentProvider) {
        return this.speak(narrationOptions);
      }
    }
  }

  private async speakWithElevenLabs(options: VoiceNarrationOptions): Promise<void> {
    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Default Adam voice
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.providers[0].apiKey!
      },
      body: JSON.stringify({
        text: options.text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.5,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      throw new Error('ElevenLabs TTS failed');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = reject;
      audio.play().catch(reject);
    });
  }

  private async speakWithSarvam(options: VoiceNarrationOptions): Promise<void> {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.providers[1].apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: options.text,
        voice: options.language?.startsWith('hi') ? 'hi-IN-female' : 'en-IN-female',
        format: 'mp3',
        sample_rate: 22050
      })
    });

    if (!response.ok) {
      throw new Error('Sarvam TTS failed');
    }

    const result = await response.json();
    const audio = new Audio(`data:audio/mp3;base64,${result.audio_base64}`);
    
    return new Promise((resolve, reject) => {
      audio.onended = resolve;
      audio.onerror = reject;
      audio.play().catch(reject);
    });
  }

  private async speakWithWebTTS(options: VoiceNarrationOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('Web Speech API not available'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(options.text);
      
      // Configure voice settings
      utterance.rate = options.speed || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = 1;

      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith(options.language || 'en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
      ) || voices.find(voice => voice.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = reject;

      window.speechSynthesis.speak(utterance);
    });
  }

  private async fallbackToNextProvider(): Promise<void> {
    const currentIndex = this.providers.findIndex(p => p.name === this.currentProvider?.name);
    const nextProviders = this.providers.slice(currentIndex + 1).filter(p => p.available);
    
    this.currentProvider = nextProviders[0] || null;
    
    if (this.currentProvider) {
      console.log(`Falling back to voice provider: ${this.currentProvider.name}`);
      await this.testProvider(this.currentProvider);
    }
  }

  // Quick chart-specific narration methods
  async narrateROASTrend(roas: number, change: number, platform?: string): Promise<void> {
    const platformText = platform ? ` on ${platform}` : '';
    const trendText = change > 0 ? `increased by ${change.toFixed(1)}%` : 
                     change < 0 ? `decreased by ${Math.abs(change).toFixed(1)}%` : 'remained stable';
    
    await this.speak(`Your ROAS${platformText} is ${roas.toFixed(2)}x and has ${trendText} recently.`);
  }

  async narratePlatformComparison(platforms: Array<{name: string, value: number}>): Promise<void> {
    const best = platforms.reduce((max, p) => p.value > max.value ? p : max);
    const worst = platforms.reduce((min, p) => p.value < min.value ? p : min);
    
    await this.speak(`Comparing platforms, ${best.name} is performing best with ${best.value.toFixed(2)}, while ${worst.name} shows ${worst.value.toFixed(2)}.`);
  }

  async narrateSpendAnalysis(totalSpend: number, topPlatform: {name: string, percentage: number}): Promise<void> {
    await this.speak(`You've spent $${totalSpend.toLocaleString()} in total, with ${topPlatform.name} accounting for ${topPlatform.percentage}% of your budget.`);
  }

  // Provider management
  getCurrentProvider(): { name: string; quality: string } | null {
    return this.currentProvider ? {
      name: this.currentProvider.name,
      quality: this.currentProvider.quality
    } : null;
  }

  async switchProvider(providerName: 'elevenlabs' | 'sarvam' | 'web-tts'): Promise<boolean> {
    const provider = this.providers.find(p => p.name === providerName && p.available);
    if (provider) {
      try {
        await this.testProvider(provider);
        this.currentProvider = provider;
        return true;
      } catch (error) {
        console.error(`Failed to switch to ${providerName}:`, error);
        return false;
      }
    }
    return false;
  }

  getAvailableProviders(): Array<{ name: string; quality: string; cost: string; available: boolean }> {
    return this.providers.map(p => ({
      name: p.name,
      quality: p.quality,
      cost: p.cost,
      available: p.available
    }));
  }

  // Stop any current speech
  stopSpeaking(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const mayaVoiceNarrationService = new MayaVoiceNarrationService();