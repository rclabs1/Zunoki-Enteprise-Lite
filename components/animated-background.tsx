// components/animated-background.tsx
import React from "react"

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)",
        }}
      >
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            background: "rgba(229, 9, 20, 0.1)",
          }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            background: "rgba(59, 130, 246, 0.1)",
            animationDelay: "1s",
          }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            background: "rgba(147, 51, 234, 0.1)",
            transform: "translate(-50%, -50%)",
            animationDelay: "2s",
          }}
        ></div>
      </div>
    </div>
  )
}