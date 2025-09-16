// Sarvam Text-to-Speech service with real API integration

interface TTSOptions {
  text: string
  voice?: string
}

interface TTSResponse {
  audioUrl: string
  error?: string
}

// Cache for audio URLs to prevent duplicate API calls
const audioCache = new Map<string, string>()

export async function sarvamTextToSpeech({ text, voice = "meera" }: TTSOptions): Promise<TTSResponse> {
  // Validate and limit text length (Sarvam API has 500 character limit)
  let processedText = text.trim()

  if (processedText.length > 500) {
    // Truncate to 500 characters, but try to end at a sentence or word boundary
    processedText = processedText.substring(0, 500)

    // Try to end at the last sentence
    const lastSentence = processedText.lastIndexOf(".")
    const lastQuestion = processedText.lastIndexOf("?")
    const lastExclamation = processedText.lastIndexOf("!")

    const lastPunctuation = Math.max(lastSentence, lastQuestion, lastExclamation)

    if (lastPunctuation > 400) {
      // Only use sentence boundary if it's not too short
      processedText = processedText.substring(0, lastPunctuation + 1)
    } else {
      // Try to end at the last word boundary
      const lastSpace = processedText.lastIndexOf(" ")
      if (lastSpace > 450) {
        // Only use word boundary if it's not too short
        processedText = processedText.substring(0, lastSpace)
      }
      // Add ellipsis to indicate truncation
      processedText += "..."
    }

    console.log(`Text truncated from ${text.length} to ${processedText.length} characters for Sarvam API`)
  }

  // Generate a cache key based on the input parameters
  const cacheKey = `${processedText}-${voice}`

  // Check if we have a cached response
  if (audioCache.has(cacheKey)) {
    return { audioUrl: audioCache.get(cacheKey)! }
  }

  try {
    // Call the Sarvam API with proper headers and payload
    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": "b372d7a1-218c-4d74-9fd5-64138ac419c1",
      },
      body: JSON.stringify({
        inputs: [processedText],
        target_language_code: "hi-IN", // Hindi language code
        speaker: "meera", // Consistent speaker
        pitch: 0,
        pace: 1.0,
        loudness: 1.0,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: "bulbul:v1",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Sarvam API response:", response.status, errorText)
      throw new Error(`Sarvam API error: ${response.status} - ${errorText || response.statusText}`)
    }

    const responseData = await response.json()

    // Check if the response contains audio data
    if (!responseData.audios || !responseData.audios[0]) {
      throw new Error("No audio data received from Sarvam API")
    }

    // The Sarvam API returns base64 encoded audio
    const base64Audio = responseData.audios[0]

    // Convert base64 to blob
    const audioBlob = new Blob([Uint8Array.from(atob(base64Audio), (c) => c.charCodeAt(0))], {
      type: "audio/wav",
    })

    // Create a URL for the audio blob
    const audioUrl = URL.createObjectURL(audioBlob)

    // Cache the audio URL
    audioCache.set(cacheKey, audioUrl)

    return { audioUrl }
  } catch (error) {
    console.error("Error generating speech with Sarvam:", error)
    return {
      audioUrl: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Clean up audio URLs when they're no longer needed
export function cleanupSarvamAudioCache(): void {
  audioCache.forEach((url) => {
    URL.revokeObjectURL(url)
  })
  audioCache.clear()
}
