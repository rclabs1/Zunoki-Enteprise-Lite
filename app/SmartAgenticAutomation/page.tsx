
"use client";

import SmartAutomation from "@/components/SmartAutomation";

export default function SmartAgenticAutomationPage() {
  return (
    <div className="min-h-screen netflix-bg netflix-scrollbar">
      {/* Netflix-inspired background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#141414] via-[#1a1a1a] to-[#0d0d0d] pointer-events-none" />
      
      <div className="relative z-10 p-6 space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] rounded-xl shadow-2xl">
            <span className="text-2xl">🤖</span>
          </div>
          <h1 className="text-4xl font-bold netflix-text-gradient">Smart Agentic Automation</h1>
        </div>
        <SmartAutomation />
      </div>
    </div>
  );
}
