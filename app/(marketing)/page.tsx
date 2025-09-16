"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowRight, 
  Zap, 
  BrainCircuit, 
  ArrowUpCircle, 
  Sparkles, 
  TrendingUp, 
  Bot, 
  MessageSquare,
  BarChart3,
  Globe,
  Shield,
  Users,
  User,
  Rocket,
  Star,
  CheckCircle,
  Play,
  ChevronRight
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import dynamic from "next/dynamic"
import { LandingHeader } from "@/components/landing-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const AnimatedBackground = dynamic(() => import("@/components/animated-background"), {
  ssr: false,
  loading: () => null,
})

export default function LandingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isAnnual, setIsAnnual] = useState(true) // Default to annual

  useEffect(() => {
    setMounted(true)
  }, [])

  

  const handleGetStarted = () => {
    console.log("🔍 Dashboard clicked - User:", user ? "authenticated" : "not authenticated")
    console.log("🔍 Redirecting to:", user ? "/shell" : "/signup")
    router.push(user ? "/shell" : "/signup")
  }

  // Pricing configuration
  const pricingPlans = {
    starter: {
      annual: { price: 49, total: 588 },
      monthly: { price: 59, total: 708 }
    },
    business: {
      annual: { price: 129, total: 1548 },
      monthly: { price: 159, total: 1908 }
    },
    enterprise: {
      annual: { price: 299, total: 3588 },
      monthly: { price: 369, total: 4428 }
    }
  }

  const getPricing = (plan: keyof typeof pricingPlans) => {
    return isAnnual ? pricingPlans[plan].annual : pricingPlans[plan].monthly
  }

  const getSavings = (plan: keyof typeof pricingPlans) => {
    const annual = pricingPlans[plan].annual.total
    const monthly = pricingPlans[plan].monthly.total
    return monthly - annual
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="landing-page relative overflow-hidden">
      <LandingHeader />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-chart-3/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <main className="relative">
        {/* Hero Section - Unified Growth Platform */}
        <section className="min-h-screen flex items-center px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Side - Content */}
              <div>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange/10 to-primary/10 border border-orange/20 mb-8 backdrop-blur-sm">
                  <Zap className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-700">
                    Next-Gen Ads
                  </span>
                </div>
                
                {/* Problem Statement */}
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 max-w-xl">
                  Stop juggling between Ad platforms and CX and sales enablement without guidance
                </p>
                
                {/* Main Headline */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-2 leading-tight">
                  <span className="block bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    ONE PLATFORM
                  </span>
                </h1>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-2 leading-tight">
                  <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    UNIFIED GROWTH
                  </span>
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground font-medium mb-8">
                  powered by Agentic Intelligence
                </p>
                
                {/* Value Proposition */}
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl">
                  Unified smart agentic AI platform + AI partner that talks back, takes action, and continuously optimizes — like having a growth strategist on demand.
                </p>
                
                {/* Key Differentiators */}
                <div className="flex flex-wrap gap-4 mb-10">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 px-3 py-1 font-medium">
                    🎯 Multi-Channel Ads
                  </Badge>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 px-3 py-1 font-medium">
                    🤖 Auto-Optimization
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 px-3 py-1 font-medium">
                    🎙️ Voice AI Partner
                  </Badge>
                </div>
                
                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    Start Growing Today
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-primary/20 hover:bg-primary/5 font-semibold px-8 py-4 text-lg transition-all duration-300 group"
                    onClick={() => window.open('https://www.youtube.com/shorts/Dqr9Crf_pmQ', '_blank')}
                  >
                    <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    See It In Action
                  </Button>
                </div>
                
                {/* Trust Signals */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">7-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">Setup in minutes</span>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Interactive Demo */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* User conversation bubble */}
                  <div className="absolute -left-20 top-20 z-10 max-w-[200px]">
                    <div className="bg-white rounded-2xl shadow-lg p-4 animate-fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">You</span>
                      </div>
                      <p className="text-sm text-gray-800">"Hey Zunoki. Show me my ad campaigns"</p>
                    </div>
                  </div>
                  
                  {/* Phone with Video */}
                  <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-3 shadow-2xl max-w-xs">
                    <div className="bg-black rounded-2xl overflow-hidden aspect-[9/16]">
                      <iframe
                        src="https://www.youtube.com/embed/Dqr9Crf_pmQ"
                        title="Zunoki Growth Platform Demo"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    {/* Phone frame details */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-600 rounded-full"></div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-600 rounded-full"></div>
                  </div>
                  
                  {/* Zunoki response bubble */}
                  <div className="absolute -right-16 top-52 z-10 max-w-[180px]">
                    <div className="bg-gradient-to-r from-primary/90 to-accent/90 text-white rounded-2xl shadow-lg p-4 animate-fade-in animation-delay-1000">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4" />
                        <span className="text-xs font-medium">Zunoki</span>
                      </div>
                      <p className="text-sm">"Your Google Ads spent $2,400 with 3.2x ROAS this week. I found 3 keywords that need optimization - shall I adjust the bids?"</p>
                    </div>
                  </div>
                  
                  {/* Auto Actions indicator */}
                  <div className="absolute -bottom-6 -left-8 bg-green-50 border border-green-200 rounded-xl shadow-lg p-3 animate-pulse animation-delay-2000">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700">Auto Actions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ad Platforms Section */}
        <section id="platform" className="py-24 px-6 bg-gradient-to-b from-background to-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-6 px-4 py-2 text-sm font-semibold bg-primary/10 text-primary border-primary/20">
                Unified Growth Platform
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Ad Platforms • Messaging • Agents
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Unified platform for ads, cross-platform messaging, and agentic AI workflows powered by intelligent automation.
              </p>
            </div>
            
            {/* Ad Platform Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {[
                { 
                  icon: BarChart3, 
                  name: "Ad Platform", 
                  color: "text-blue-600", 
                  bg: "bg-blue-50", 
                  description: "Search, Display & YouTube campaigns",
                  features: ["Smart bidding", "Keyword optimization", "Performance insights"]
                },
                { 
                  icon: MessageSquare, 
                  name: "Unified Messaging", 
                  color: "text-green-600", 
                  bg: "bg-green-50", 
                  description: "WhatsApp, Telegram and Gmail",
                  features: ["Cross-platform messaging", "Automated responses", "Conversation management"]
                },
                { 
                  icon: Bot, 
                  name: "Agents", 
                  color: "text-purple-600", 
                  bg: "bg-purple-50", 
                  description: "Agentic AI workflows",
                  features: ["Autonomous actions", "Task automation", "Intelligent decision making"]
                }
              ].map((platform, idx) => (
                <Card key={idx} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 bg-white">
                  <CardContent className="p-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${platform.bg} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <platform.icon className={`h-8 w-8 ${platform.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{platform.name}</h3>
                    <p className="text-muted-foreground mb-4">{platform.description}</p>
                    <ul className="space-y-2">
                      {platform.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Growth Partner Preview */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl p-8 md:p-12 border border-primary/10">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  <Bot className="h-4 w-4" />
                  Your AI Growth Partner
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  "Hey Zunoki, optimize my campaigns for better ROAS"
                </h3>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                  Unlike static dashboards, Zunoki talks back, analyzes performance, and takes action. 
                  Get voice-powered insights and automated optimizations across all your ad channels.
                </p>
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Try Voice AI Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-6 bg-gradient-to-r from-blue-50/30 via-white to-orange-50/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-6 px-4 py-2 text-sm font-semibold bg-orange-100 text-orange-800 border-orange-300">
                🎁 Limited Time: Special Launch Offer
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-8">
                Choose the perfect plan for your business growth. Start free, scale as you grow.
              </p>
              
              {/* Pricing Toggle */}
              <div className="flex items-center justify-center mb-8">
                <div className="bg-muted p-1 rounded-full inline-flex">
                  <button
                    onClick={() => setIsAnnual(false)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      !isAnnual
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    📅 Monthly
                  </button>
                  <button
                    onClick={() => setIsAnnual(true)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 relative ${
                      isAnnual
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🏷️ Annual
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {/* Starter Plan */}
              <Card className="relative hover:shadow-2xl transition-all duration-300 border-2">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-foreground mb-2">Starter</h3>
                    <p className="text-muted-foreground mb-6">Perfect for growing teams</p>
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-4xl font-bold text-blue-600">${getPricing('starter').price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isAnnual ? (
                          `billed annually ($${getPricing('starter').total}/year)`
                        ) : (
                          <>Save ${getSavings('starter')} with annual billing</>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {[
                      'WhatsApp Business integration',
                      'Gmail & Telegram support', 
                      'SMS messaging included',
                      'Zunoki Agentic AI assistant',
                      'Basic voice features',
                      'Credit-based messaging per month',
                      'Email support'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300" onClick={handleGetStarted}>
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Business Plan - Most Popular */}
              <Card className="relative hover:shadow-2xl transition-all duration-300 border-2 border-orange-400 bg-gradient-to-b from-orange-50/50 to-white">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white px-6 py-2 font-bold shadow-lg">
                  💡 Most Popular
                </Badge>
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <Zap className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-foreground mb-2">Business</h3>
                    <p className="text-muted-foreground mb-6">Most popular for growing businesses</p>
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-4xl font-bold text-orange-600">${getPricing('business').price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isAnnual ? (
                          `billed annually ($${getPricing('business').total}/year)`
                        ) : (
                          <>Save ${getSavings('business')} with annual billing</>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {[
                      'All Starter features',
                      'Google Ads integration',
                      'Google Analytics tracking',
                      'Mixpanel insights',
                      'Premium voice synthesis',
                      'Natural language business intelligence',
                      'AI agents',
                      '2x-3x Starter messaging credits',
                      'Priority chat support'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300" onClick={handleGetStarted}>
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="relative hover:shadow-2xl transition-all duration-300 border-2">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-foreground mb-2">Enterprise</h3>
                    <p className="text-muted-foreground mb-6">Custom solutions for enterprises</p>
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-lg text-muted-foreground">Custom Pricing from</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-bold text-purple-600">${getPricing('enterprise').price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {isAnnual ? (
                          `billed annually ($${getPricing('enterprise').total}/year)`
                        ) : (
                          <>Save ${getSavings('enterprise')} with annual billing</>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {[
                      'All Business features',
                      'Custom platform connections',
                      'Meta (Facebook/Instagram) integration',
                      'Custom voice training',
                      'Voice-narrated chart insights (industry first!)',
                      'Custom AI agents',
                      'Custom messaging limits',
                      'Dedicated success manager',
                      'White-glove onboarding',
                      'SLA support'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300" onClick={handleGetStarted}>
                    Contact Sales
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                All plans include: 7 days trial • Cancel anytime • 24/7 support
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {isAnnual ? (
                  <>💰 Save $120-$840 yearly • Monthly billing available at premium</>
                ) : (
                  <>💳 Monthly billing • Switch to annual and save $120-$840</>
                )}
              </p>
              <Button variant="outline" size="lg" onClick={handleGetStarted}>
                Compare All Features
              </Button>
            </div>
          </div>
        </section>

        {/* Video & Features Section */}
        <section className="py-24 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-6 px-4 py-2 text-sm font-semibold bg-primary/10 text-primary border-primary/20">
                See Zunoki in Action
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 text-foreground">
                Watch How Agentic AI Works
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Experience the power of autonomous AI agents managing your campaigns and conversations in real-time.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Video - Mobile Phone Style */}
              <div className="flex justify-center lg:justify-start">
                <div className="relative bg-gray-900 rounded-3xl p-3 shadow-2xl max-w-xs">
                  <div className="bg-black rounded-2xl overflow-hidden aspect-[9/16]">
                    <iframe
                      src="https://www.youtube.com/embed/Dqr9Crf_pmQ"
                      title="Zunoki Agentic AI Demo"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  {/* Phone frame details */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full"></div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-700 rounded-full"></div>
                </div>
              </div>
              
              {/* Key Features */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-foreground">Why Choose Zunoki?</h3>
                  <p className="text-lg text-muted-foreground mb-8">
                    Everything you need to build, deploy, and scale Agentic AI marketing campaigns.
                  </p>
                </div>
                
                <div className="space-y-6">
                  {[
                    {
                      icon: BrainCircuit,
                      title: "Autonomous AI Agents",
                      description: "Deploy intelligent agents that optimize campaigns, manage budgets, and drive conversions 24/7 without human intervention."
                    },
                    {
                      icon: Zap,
                      title: "Cross-Channel Marketing",
                      description: "Orchestrate campaigns across all channels with unified attribution, real-time optimization, and seamless integration."
                    },
                    {
                      icon: ArrowUpCircle,
                      title: "Voice-Enabled Analytics",
                      description: "Industry-first voice AI narration of your charts and insights with predictive analytics and actionable recommendations."
                    }
                  ].map((feature, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                          <feature.icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-foreground mb-2">{feature.title}</h4>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4">
                  <Button 
                    size="lg" 
                    onClick={handleGetStarted}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Try Zunoki Free
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section className="py-24 px-6 bg-gradient-to-r from-primary/5 via-accent/5 to-chart-3/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Ready to Transform Your Marketing?
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
              Join thousands of marketers who've already revolutionized their campaigns with AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold px-12 py-6 text-xl rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 group"
              >
                <Rocket className="h-6 w-6 mr-3 group-hover:translate-y-[-2px] transition-transform duration-200" />
                Start Your Free Trial
                <ChevronRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • 7-day free trial • Cancel anytime
            </p>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-b from-background to-muted/30 border-t border-border/20">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="font-black text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Zunoki.
                  </span>
                  <p className="text-sm text-muted-foreground font-medium">
                    Agentic Intelligence Platform
                  </p>
                </div>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mb-8">
                Unified smart agentic AI platform + AI partner that talks back, takes action, and continuously optimizes — like having a growth strategist on demand.
              </p>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="px-3 py-1">
                  <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                  4.9/5 Rating
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <Shield className="h-3 w-3 mr-1 text-green-500" />
                  SOC 2 Compliant
                </Badge>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-6 text-foreground">Platform</h3>
              <ul className="space-y-4">
                <li><Link href="/features" className="text-muted-foreground hover:text-primary transition-colors duration-200">Features</Link></li>
                <li><Link href="/integrations" className="text-muted-foreground hover:text-primary transition-colors duration-200">Integrations</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors duration-200">Pricing</Link></li>
                <li><Link href="/security" className="text-muted-foreground hover:text-primary transition-colors duration-200">Security</Link></li>
              </ul>
            </div>
            
            {/* Company Links */}
            <div>
              <h3 className="font-bold text-lg mb-6 text-foreground">Company</h3>
              <ul className="space-y-4">
                <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors duration-200">About Us</Link></li>
                <li><Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors duration-200">Blog</Link></li>
                <li><Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors duration-200">Careers</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors duration-200">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-border/20 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              &copy; 2024 Zunoki. All rights reserved. Transforming marketing with intelligent automation.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors duration-200">Privacy Policy</Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors duration-200">Terms of Service</Link>
              <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors duration-200">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
