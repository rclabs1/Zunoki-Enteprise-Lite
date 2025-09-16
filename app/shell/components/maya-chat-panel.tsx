"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useMaya } from '@/contexts/maya-context'
import { mayaVoiceService } from '@/lib/voice-recognition'

export function MayaChatPanel() {
  const {
    messages,
    isListening,
    isProcessing,
    sendMessage,
    startListening,
    stopListening,
    executeAction,
    clearConversation
  } = useMaya()

  const [input, setInput] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize voice service
  useEffect(() => {
    const initVoice = async () => {
      const initialized = await mayaVoiceService.initialize()
      setVoiceEnabled(initialized)
      if (!initialized) {
        setVoiceError('Voice features require microphone permission')
      }
    }
    initVoice()
  }, [])

  const handleSendMessage = async () => {
    if (input.trim() && !isProcessing) {
      const message = input.trim()
      setInput('')
      await sendMessage(message)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleVoiceToggle = () => {
    if (!voiceEnabled) {
      setVoiceError('Voice features not available. Please enable microphone access.')
      return
    }

    if (isRecording) {
      mayaVoiceService.stopListening()
      setIsRecording(false)
    } else {
      setVoiceError(null)
      const started = mayaVoiceService.startListening(
        (transcript) => {
          setInput(transcript)
          setIsRecording(false)
          // Automatically send the message
          if (transcript.trim()) {
            setTimeout(() => {
              handleSendMessage()
            }, 500)
          }
        },
        (error) => {
          setVoiceError(error)
          setIsRecording(false)
        },
        () => {
          setIsRecording(true)
          setVoiceError(null)
        },
        () => {
          setIsRecording(false)
        }
      )

      if (!started) {
        setVoiceError('Failed to start voice recognition')
      }
    }
  }

  // Handle Maya responses with voice (only when panel is active/visible)
  useEffect(() => {
    if (messages.length > 0 && !isMinimized) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.type === 'maya' && voiceEnabled) {
        // Speak Maya's response
        mayaVoiceService.speakResponse(lastMessage.content)
      }
    }
  }, [messages, voiceEnabled, isMinimized])

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <span className="text-2xl">🤖</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-background border border-border rounded-lg shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/100 rounded-full flex items-center justify-center">
            🤖
          </div>
          <div>
            <h3 className="font-semibold">Agent Zunoki</h3>
            <p className="text-xs text-blue-100">Zunoki. Intelligence</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearConversation}
            className="p-1 hover:bg-primary/90 rounded"
            title="Clear conversation"
          >
            🗑️
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-primary/90 rounded"
            title="Minimize"
          >
            ➖
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              
              {/* Action Buttons */}
              {message.actionButtons && (
                <div className="mt-3 space-y-2">
                  {message.actionButtons.map((button, index) => (
                    <button
                      key={index}
                      onClick={() => executeAction(button.action)}
                      className={`w-full px-3 py-1 text-xs rounded ${
                        button.variant === 'primary'
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Agent Zunoki is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Error Display */}
      {voiceError && (
        <div className="border-t border-border px-4 py-2 bg-destructive/10">
          <div className="text-xs text-red-600">{voiceError}</div>
        </div>
      )}

      {/* Voice Status */}
      {isRecording && (
        <div className="border-t border-border px-4 py-2 bg-primary/10">
          <div className="flex items-center space-x-2 text-blue-700">
            <div className="animate-pulse w-2 h-2 bg-primary/100 rounded-full"></div>
            <span className="text-xs">Listening... Speak now</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Agent Zunoki anything..."
            className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            disabled={isProcessing}
          />
          
          <button
            onClick={handleVoiceToggle}
            className={`p-2 rounded-lg ${
              isRecording
                ? 'bg-red-100 text-red-600 animate-pulse'
                : voiceEnabled
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
            title={
              !voiceEnabled 
                ? 'Voice features not available' 
                : isRecording 
                ? 'Stop listening' 
                : 'Start voice input'
            }
            disabled={!voiceEnabled}
          >
            🎤
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}