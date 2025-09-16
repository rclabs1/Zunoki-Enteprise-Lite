// Utility functions for audio processing

/**
 * Converts a Blob to a base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
      const base64 = base64String.split(",")[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Converts audio to the format required by Whisper API
 */
export async function prepareAudioForWhisper(blob: Blob): Promise<{ file: Blob; duration: number }> {
  // Convert to proper format if needed (Whisper prefers mp3 or wav)
  // For now, we'll just use the blob as is

  // Calculate approximate duration based on blob size
  // This is a rough estimate - in a real implementation you'd use Web Audio API
  const durationInSeconds = blob.size / (16000 * 2) // Assuming 16kHz mono 16-bit audio

  return {
    file: blob,
    duration: durationInSeconds,
  }
}

/**
 * Normalizes and enhances audio for better speech recognition
 */
export async function enhanceAudioForSpeechRecognition(blob: Blob): Promise<Blob> {
  // In a real implementation, you would:
  // 1. Use Web Audio API to normalize volume
  // 2. Apply noise reduction
  // 3. Apply bandpass filter to focus on speech frequencies

  // For now, we'll just return the original blob
  return blob
}

/**
 * Detects silence in audio to improve recognition accuracy
 */
export function detectSilence(audioBuffer: AudioBuffer, silenceThreshold = 0.01): { start: number; end: number } {
  const data = audioBuffer.getChannelData(0)
  let start = 0
  let end = data.length - 1

  // Find start (first non-silent sample)
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) > silenceThreshold) {
      start = i
      break
    }
  }

  // Find end (last non-silent sample)
  for (let i = data.length - 1; i >= 0; i--) {
    if (Math.abs(data[i]) > silenceThreshold) {
      end = i
      break
    }
  }

  return {
    start: start / audioBuffer.sampleRate,
    end: end / audioBuffer.sampleRate,
  }
}
