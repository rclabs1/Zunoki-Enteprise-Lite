// ElevenLabs Text-to-Speech service with Sarvam as default

import { sarvamTextToSpeech } from "./sarvam-tts-service"

interface TTSOptions {
  text: string
  voiceId?: string
  stability?: number
  similarityBoost?: number
  modelId?: string
}

interface TTSResponse {
  audioUrl: string
  error?: string
  quotaExceeded?: boolean
}

// Cache for audio URLs to prevent duplicate API calls
const audioCache = new Map<string, string>()

// Default voice IDs from ElevenLabs
const VOICE_IDS = {
  MAYA: "EXAVITQu4vr4xnSDxMaL", // Rachel voice
}

// Track if quota has been exceeded to avoid repeated API calls
let quotaExceeded = false
let sarvamFailed = false // Track if Sarvam is consistently failing

// Browser speech synthesis fallback
const useBrowserTTS = (text: string): Promise<TTSResponse> => {
  return new Promise((resolve) => {
    // Check if browser supports speech synthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text)

      // Try to find a female voice for consistency
      const voices = window.speechSynthesis.getVoices()
      const femaleVoice = voices.find(
        (voice) =>
          voice.name.includes("female") ||
          voice.name.includes("woman") ||
          voice.name.toLowerCase().includes("samantha"),
      )

      if (femaleVoice) {
        utterance.voice = femaleVoice
      }

      utterance.rate = 1.0
      utterance.pitch = 1.0

      window.speechSynthesis.speak(utterance)

      // Return a dummy URL since we're using browser TTS
      resolve({ audioUrl: "browser-tts://speech" })
    } else {
      resolve({ audioUrl: "", error: "Browser speech synthesis not supported" })
    }
  })
}

export async function textToSpeech({
  text,
  voiceId = "meera", // Default to Sarvam voice
  stability = 0.5,
  similarityBoost = 0.75,
  modelId = "eleven_monolingual_v1",
}: TTSOptions): Promise<TTSResponse> {
  // Skip Sarvam if it has been consistently failing
  if (!sarvamFailed) {
    try {
      const sarvamResponse = await sarvamTextToSpeech({
        text,
        voice: "meera", // Use consistent Sarvam voice
      })

      if (sarvamResponse.audioUrl && !sarvamResponse.error) {
        return {
          audioUrl: sarvamResponse.audioUrl,
          quotaExceeded: false,
        }
      } else if (sarvamResponse.error) {
        console.warn("Sarvam TTS error:", sarvamResponse.error)
        // Don't mark as failed for single errors, but continue to fallback
      }
    } catch (error) {
      console.warn("Sarvam TTS failed, falling back to ElevenLabs:", error)
      // Mark Sarvam as failed after multiple attempts
      sarvamFailed = true
    }
  }

  let useBrowser = false
  // If quota is already known to be exceeded, use browser TTS immediately
  if (quotaExceeded) {
    useBrowser = true
  }

  // Generate a cache key based on the input parameters
  const cacheKey = `${text}-${voiceId}-${stability}-${similarityBoost}-${modelId}`

  // Check if we have a cached response
  if (audioCache.has(cacheKey)) {
    return { audioUrl: audioCache.get(cacheKey)! }
  }

  // Limit text length to reduce API usage (max ~100 words)
  const limitedText = text.split(" ").slice(0, 100).join(" ")
  if (limitedText.length < text.length) {
    console.log("Text truncated to reduce API usage")
  }

  if (useBrowser) {
    return useBrowserTTS(text)
  }

  try {
    // Use our server-side API route instead of calling ElevenLabs directly
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: limitedText,
        voiceId: VOICE_IDS.MAYA, // Use ElevenLabs voice for fallback
        stability,
        similarityBoost,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      try {
        const jsonError = JSON.parse(errorData)

        // Check for quota exceeded error
        if (
          jsonError.error &&
          (jsonError.error.includes("quota_exceeded") ||
            jsonError.error.includes("quota") ||
            jsonError.error.includes("credits"))
        ) {
          console.warn("ElevenLabs quota exceeded, falling back to browser TTS")
          quotaExceeded = true
          return useBrowserTTS(text)
        }

        throw new Error(jsonError.error || "Error generating speech")
      } catch (e) {
        // Check for quota exceeded in the raw error message
        if (errorData.includes("quota_exceeded") || errorData.includes("quota") || errorData.includes("credits")) {
          console.warn("ElevenLabs quota exceeded, falling back to browser TTS")
          quotaExceeded = true
          return useBrowserTTS(text)
        }

        throw new Error(`Error generating speech: ${errorData || response.statusText}`)
      }
    }

    // Get the audio blob
    const audioBlob = await response.blob()

    // Create a URL for the audio blob
    const audioUrl = URL.createObjectURL(audioBlob)

    // Cache the audio URL
    audioCache.set(cacheKey, audioUrl)

    return { audioUrl }
  } catch (error) {
    console.error("Error generating speech:", error)

    // Check if the error is related to quota
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    if (errorMessage.includes("quota") || errorMessage.includes("credits")) {
      quotaExceeded = true
      return useBrowserTTS(text)
    }

    // If all else fails, use browser TTS
    console.warn("All TTS providers failed, falling back to browser TTS")
    return useBrowserTTS(text)
  }
}

// Audio player functions
let currentAudio: HTMLAudioElement | null = null

export function playAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("No audio URL provided"))
      return
    }

    // If using browser TTS, don't create an audio element
    if (url === "browser-tts://speech") {
      // Browser TTS is already playing, just resolve
      setTimeout(resolve, 100)
      return
    }

    // Stop any currently playing audio
    stopAudio()

    // Create and play new audio
    const audio = new Audio(url)
    currentAudio = audio

    audio.onended = () => {
      resolve()
    }

    audio.onerror = (error) => {
      reject(error)
    }

    audio.play().catch(reject)
  })
}

export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }

  // Also stop any browser TTS that might be playing
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

// Preload audio for common phrases
export async function preloadAudio(options: TTSOptions): Promise<void> {
  // Skip preloading if quota is exceeded or if we're having TTS issues
  if (quotaExceeded || sarvamFailed) return

  try {
    await textToSpeech(options)
  } catch (error) {
    console.error("Error preloading audio:", error)
    // Don't let preloading errors break the app
  }
}

// Clean up audio URLs when they're no longer needed
export function cleanupAudioCache(): void {
  audioCache.forEach((url) => {
    if (url !== "browser-tts://speech") {
      URL.revokeObjectURL(url)
    }
  })
  audioCache.clear()
}

// Check if quota is exceeded
export function isQuotaExceeded(): boolean {
  return quotaExceeded
}

// Reset quota exceeded flag (useful for testing)
export function resetQuotaExceeded(): void {
  quotaExceeded = false
  sarvamFailed = false
}
