// Speech Recognition Service with fallback options

export interface SpeechRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxSilenceTime?: number // Time in ms to wait for speech before timing out
}

export interface SpeechRecognitionResult {
  transcript: string
  isFinal: boolean
  error?: string
}

type SpeechRecognitionCallback = (result: SpeechRecognitionResult) => void

class SpeechRecognitionService {
  private recognition: any | null = null
  private isListening = false
  private callback: SpeechRecognitionCallback | null = null
  private options: SpeechRecognitionOptions = {
    language: "en-US",
    continuous: false,
    interimResults: true,
    maxSilenceTime: 5000, // Default 5 seconds
  }
  private silenceTimer: NodeJS.Timeout | null = null
  private hasReceivedInput = false

  constructor() {
    this.initRecognition()
  }

  private initRecognition(): void {
    // Check for browser support
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.setupRecognitionHandlers()
      }
    }
  }

  private setupRecognitionHandlers(): void {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.isListening = true
      this.hasReceivedInput = false

      // Set a timer to detect silence
      if (this.options.maxSilenceTime) {
        this.silenceTimer = setTimeout(() => {
          if (!this.hasReceivedInput && this.isListening) {
            // If no speech detected within timeout, stop listening and notify
            this.stop()
            if (this.callback) {
              this.callback({
                transcript: "",
                isFinal: true,
                error: "no-speech-detected",
              })
            }
          }
        }, this.options.maxSilenceTime)
      }
    }

    this.recognition.onaudiostart = () => {
      // Audio has started being processed
      console.log("Audio capturing started")
    }

    this.recognition.onspeechstart = () => {
      // Speech has been detected
      this.hasReceivedInput = true
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer)
        this.silenceTimer = null
      }
    }

    this.recognition.onresult = (event: any) => {
      if (!this.callback) return

      this.hasReceivedInput = true
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer)
        this.silenceTimer = null
      }

      const resultIndex = event.resultIndex
      const transcript = event.results[resultIndex][0].transcript
      const isFinal = event.results[resultIndex].isFinal

      this.callback({
        transcript,
        isFinal,
      })
    }

    this.recognition.onend = () => {
      this.isListening = false

      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer)
        this.silenceTimer = null
      }

      // If continuous is true, restart recognition when it ends
      if (this.options.continuous && this.callback) {
        this.start(this.callback, this.options)
      }
    }

    this.recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)

      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer)
        this.silenceTimer = null
      }

      // Handle specific error types
      let errorMessage = event.error

      if (event.error === "no-speech") {
        errorMessage = "no-speech-detected"
      } else if (event.error === "audio-capture") {
        errorMessage = "microphone-not-available"
      } else if (event.error === "not-allowed") {
        errorMessage = "microphone-permission-denied"
      } else if (event.error === "network") {
        errorMessage = "network-error"
      } else if (event.error === "aborted") {
        errorMessage = "aborted"
      }

      this.isListening = false

      if (this.callback) {
        this.callback({
          transcript: "",
          isFinal: true,
          error: errorMessage,
        })
      }
    }
  }

  public start(callback: SpeechRecognitionCallback, options: SpeechRecognitionOptions = {}): boolean {
    if (!this.recognition) {
      console.error("Speech recognition not supported in this browser")
      return false
    }

    if (this.isListening) {
      this.stop()
    }

    this.callback = callback
    this.options = { ...this.options, ...options }

    // Apply options
    this.recognition.lang = this.options.language || "en-US"
    this.recognition.continuous = !!this.options.continuous
    this.recognition.interimResults = !!this.options.interimResults

    try {
      this.recognition.start()
      return true
    } catch (error) {
      console.error("Error starting speech recognition:", error)
      return false
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop()
      } catch (error) {
        console.error("Error stopping speech recognition:", error)
      }
      this.isListening = false

      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer)
        this.silenceTimer = null
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition
  }
}

// Singleton instance
let speechRecognitionService: SpeechRecognitionService | null = null

export function getSpeechRecognitionService(): SpeechRecognitionService {
  if (!speechRecognitionService) {
    speechRecognitionService = new SpeechRecognitionService()
  }
  return speechRecognitionService
}
