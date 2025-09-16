export interface TTSProvider {
  id: "sarvam" | "elevenlabs" | "browser"
  name: string
  description: string
  available: boolean
}

export interface TTSResponse {
  audioUrl: string
  success: boolean
  error?: string
}

class RegionAwareTTSService {
  private currentProvider: TTSProvider
  private providers: TTSProvider[]
  private audioElement: HTMLAudioElement | null = null

  constructor() {
    this.providers = [
      {
        id: "sarvam",
        name: "Sarvam AI",
        description: "High-quality Hindi TTS optimized for Indian users",
        available: true,
      },
      {
        id: "elevenlabs",
        name: "ElevenLabs",
        description: "Premium English TTS with natural voices",
        available: true,
      },
      {
        id: "browser",
        name: "Browser TTS",
        description: "Native browser speech synthesis (offline)",
        available: typeof window !== "undefined" && "speechSynthesis" in window,
      },
    ]

    // Default to Sarvam for Indian users
    this.currentProvider = this.providers[0]
  }

  getProviders(): TTSProvider[] {
    return this.providers
  }

  getCurrentProvider(): TTSProvider {
    return this.currentProvider
  }

  setProvider(providerId: "sarvam" | "elevenlabs" | "browser"): void {
    const provider = this.providers.find((p) => p.id === providerId)
    if (provider && provider.available) {
      this.currentProvider = provider
    }
  }

  async speak(text: string, voiceSettings?: any): Promise<TTSResponse> {
    try {
      switch (this.currentProvider.id) {
        case "sarvam":
          return await this.speakWithSarvam(text, voiceSettings)
        case "elevenlabs":
          return await this.speakWithElevenLabs(text, voiceSettings)
        case "browser":
          return await this.speakWithBrowser(text, voiceSettings)
        default:
          throw new Error("No TTS provider available")
      }
    } catch (error) {
      console.error("TTS error:", error)
      // Fallback to browser TTS
      if (this.currentProvider.id !== "browser") {
        return await this.speakWithBrowser(text)
      }
      throw error
    }
  }

  private async speakWithSarvam(text: string, voiceSettings?: any): Promise<TTSResponse> {
    const response = await fetch("/api/tts/sarvam", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error(`Sarvam API error: ${response.status}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    return {
      audioUrl,
      success: true,
    }
  }

  private async speakWithElevenLabs(text: string, voiceSettings?: any): Promise<TTSResponse> {
    const response = await fetch("/api/tts/elevenlabs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voiceSettings }),
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    // Check if response is JSON (fallback signal) or audio
    const contentType = response.headers.get("content-type")
    
    if (contentType?.includes("application/json")) {
      // API returned fallback signal
      const jsonResponse = await response.json()
      return {
        audioUrl: jsonResponse.audioUrl || "browser://speech-synthesis",
        success: false,
        error: "ElevenLabs API not available, falling back to browser TTS"
      }
    } else {
      // API returned actual audio
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      return {
        audioUrl,
        success: true,
      }
    }
  }

  private async speakWithBrowser(text: string, voiceSettings?: any): Promise<TTSResponse> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve({
          audioUrl: "browser://speech-synthesis",
          success: false,
          error: "Browser TTS not available",
        })
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 0.8

      utterance.onend = () => {
        resolve({
          audioUrl: "browser://speech-synthesis",
          success: true,
        })
      }

      utterance.onerror = () => {
        resolve({
          audioUrl: "browser://speech-synthesis",
          success: false,
          error: "Browser TTS failed",
        })
      }

      speechSynthesis.speak(utterance)
    })
  }

  async playAudio(audioUrl: string): Promise<void> {
    if (audioUrl === "browser://speech-synthesis") {
      // Browser TTS handles playback automatically
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      if (this.audioElement) {
        this.audioElement.pause()
        this.audioElement.src = ""
      }

      this.audioElement = new Audio()
      this.audioElement.crossOrigin = "anonymous"

      this.audioElement.oncanplaythrough = () => {
        this.audioElement!.play().then(resolve).catch(reject)
      }

      this.audioElement.onended = () => {
        resolve()
      }

      this.audioElement.onerror = () => {
        reject(new Error("Audio playback failed"))
      }

      this.audioElement.src = audioUrl
      this.audioElement.load()
    })
  }

  stopAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.currentTime = 0
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel()
    }
  }
}

export const ttsService = new RegionAwareTTSService()
export type { TTSProvider, TTSResponse }
