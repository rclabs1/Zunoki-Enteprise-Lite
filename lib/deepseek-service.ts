// DeepSeek LLM service via OpenRouter
export interface DeepSeekMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface DeepSeekResponse {
  id: string
  content: string
  finish_reason: string
}

// Fallback responses for when the API is unavailable
const FALLBACK_RESPONSES = [
  "I apologize, but I'm having trouble connecting to my language model right now. I can still help with basic questions about your campaigns.",
  "It seems I'm having connectivity issues. I'll do my best to assist you with the information I have.",
  "I'm currently experiencing some technical difficulties. Please try again in a moment.",
  "I'm sorry, but I can't access my full capabilities right now. I'll be back to normal soon.",
]

// Track API failures to determine when to use mock API
let apiFailureCount = 0
const MAX_FAILURES_BEFORE_MOCK = 2

export async function generateDeepSeekResponse(messages: DeepSeekMessage[]): Promise<DeepSeekResponse> {
  try {
    // If we've had multiple failures, try the mock API
    const apiEndpoint = apiFailureCount >= MAX_FAILURES_BEFORE_MOCK ? "/api/mock-chat" : "/api/chat"

    // Add a timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Even if the server returns an error status, we'll handle it gracefully
    const data = await response.json()

    if (!response.ok && !data.content) {
      throw new Error(data.error || "Unknown error occurred")
    }

    // Reset failure count on success
    apiFailureCount = 0

    return {
      id: data.id || "response",
      content: data.content,
      finish_reason: data.finish_reason || "stop",
    }
  } catch (error) {
    console.error("Error generating DeepSeek response:", error)

    // Increment failure count
    apiFailureCount++

    // Get a random fallback response
    const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]

    return {
      id: "error",
      content: fallbackResponse,
      finish_reason: "error",
    }
  }
}
