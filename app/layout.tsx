import type { ReactNode } from "react"
import ClientLayout from "./client-layout"
import "./globals.css"

export const metadata = {
  title: "Zunoki Enterprise Lite – Agentic AI Ad Platform & Messaging Platform for Unified Growth",
  description:
    "Zunoki Enterprise Lite combines Agentic AI advertising platform with voice-enabled messaging automation for unified business growth. Deploy autonomous AI agents across Google Ads, WhatsApp, Gmail, and multi-platform campaigns. Voice AI analytics and intelligent conversation management. Start free trial.",
  alternates: {
    canonical: "https://app.zunoki.com",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>
}
