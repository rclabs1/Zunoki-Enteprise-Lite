"use client"

import { useState, useCallback } from "react"
import { generateDeepSeekResponse, type DeepSeekMessage } from "@/lib/deepseek-service"

export interface Message {
  id: string
  type: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

// Simple responses that don't require the API
const SIMPLE_RESPONSES: Record<string, string> = {
  hello: "Hello! How can I help with your advertising campaigns today?",
  hi: "Hi there! I'm Zunoki. your AI advertising strategist. What can I help you with?",
  hey: "Hey! How can I assist you with your campaigns today?",
  help: "I can help you analyze campaign performance, provide budget recommendations, suggest platform optimizations, or help with creative strategies. What would you like assistance with?",
}

export function useConversation(initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isProcessing, setIsProcessing] = useState(false)
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)

  const addMessage = useCallback((message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    return newMessage
  }, [])

  const processUserMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return null

      // Add user message
      addMessage({ type: "user", content })
      setIsProcessing(true)

      // Check for simple responses that don't need API
      const lowerContent = content.toLowerCase().trim()
      if (SIMPLE_RESPONSES[lowerContent] && consecutiveErrors > 1) {
        // If we've had multiple API errors, use simple responses when possible
        const simpleResponse = SIMPLE_RESPONSES[lowerContent]
        const assistantMessage = addMessage({
          type: "assistant",
          content: simpleResponse,
        })
        setIsProcessing(false)
        setConsecutiveErrors(0) // Reset error count on successful response
        return assistantMessage
      }

      // Add Google Ads context if user asks about digital campaigns
      const lowerInput = content.toLowerCase()
      let contextData = ""

      if (lowerInput.includes("google ads") || lowerInput.includes("digital") || lowerInput.includes("campaign")) {
        try {
          const response = await fetch("/api/google-ads/fetchCampaigns")
          if (response.ok) {
            const googleAdsData = await response.json()

            if (googleAdsData.connected && googleAdsData.summary) {
              contextData = `\n\nCurrent Google Ads Performance:
- Total Impressions: ${googleAdsData.summary.totalImpressions.toLocaleString()}
- Total Clicks: ${googleAdsData.summary.totalClicks.toLocaleString()}
- Total Spend: $${googleAdsData.summary.totalSpend.toLocaleString()}
- Average CTR: ${googleAdsData.summary.averageCtr.toFixed(2)}%
- Average CPC: $${googleAdsData.summary.averageCpc.toFixed(2)}
- Total Conversions: ${googleAdsData.summary.totalConversions}

Active Campaigns: ${googleAdsData.campaigns?.length || 0}`
            }
          }
        } catch (error) {
          console.error("Error fetching Google Ads context:", error)
        }
      }

      try {
        // Convert messages to DeepSeek format
        const deepSeekMessages: DeepSeekMessage[] = [
          {
            role: "system",
            content: `You are Maya, an AI advertising strategist assistant for AdmoLabs. 
         You help users with campaign intelligence and advertising insights.
         Be warm, witty, and helpful. Keep responses clear and concise.
         Focus on advertising metrics like CTR, ROAS, budgets, and campaign optimization.
         Current date: ${new Date().toLocaleDateString()}`,
          },
          ...messages.map((msg) => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content,
          })),
          { role: "user", content: content + contextData },
        ]

        // Generate AI response
        const response = await generateDeepSeekResponse(deepSeekMessages)

        // Add assistant message
        const assistantMessage = addMessage({
          type: "assistant",
          content: response.content,
        })

        setIsProcessing(false)
        setConsecutiveErrors(0) // Reset error count on successful response
        return assistantMessage
      } catch (error) {
        console.error("Error processing message:", error)
        setConsecutiveErrors((prev) => prev + 1) // Increment error count

        // Add error message
        const errorMessage = addMessage({
          type: "assistant",
          content:
            "I apologize, but I encountered an issue processing your request. Please try again or ask a simpler question.",
        })

        setIsProcessing(false)
        return errorMessage
      }
    },
    [messages, addMessage, consecutiveErrors],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setConsecutiveErrors(0)
  }, [])

  return {
    messages,
    isProcessing,
    addMessage,
    processUserMessage,
    clearMessages,
  }
}
