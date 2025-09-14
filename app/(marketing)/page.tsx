"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  Zap,
  Shield,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Users,
  Bot,
  CreditCard,
  Globe,
  Smartphone,
  HeartHandshake
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [email, setEmail] = useState("")

  const features = [
    {
      icon: MessageCircle,
      title: "Website to WhatsApp",
      description: "Seamlessly transfer website visitors to WhatsApp Business for personal conversations."
    },
    {
      icon: Bot,
      title: "AI Agent Assignment",
      description: "Intelligent routing to the right human or AI agent based on inquiry type and context."
    },
    {
      icon: CreditCard,
      title: "Automated Payments",
      description: "Generate and send payment links directly in chat. Stripe & PayPal integration included."
    },
    {
      icon: BarChart3,
      title: "Conversation Analytics",
      description: "Track conversion rates, response times, and agent performance with detailed insights."
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Role-based access, workload balancing, and real-time team status monitoring."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC2 compliant infrastructure with end-to-end encryption and audit logging."
    }
  ]

  const pricing = [
    {
      name: "Starter",
      price: "$99",
      period: "/month",
      description: "Perfect for small businesses",
      features: [
        "Up to 3 agents",
        "500 conversations/month",
        "WhatsApp Business API",
        "Basic analytics",
        "Email support"
      ]
    },
    {
      name: "Professional",
      price: "$299",
      period: "/month",
      description: "Growing teams and businesses",
      features: [
        "Up to 10 agents",
        "2,000 conversations/month",
        "Advanced AI routing",
        "Payment integration",
        "Custom branding",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "Large organizations",
      features: [
        "Unlimited agents",
        "Unlimited conversations",
        "White-label deployment",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">Zunoki Enterprise Chat</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-slate-600 hover:text-emerald-600 transition-colors">Features</Link>
            <Link href="#pricing" className="text-slate-600 hover:text-emerald-600 transition-colors">Pricing</Link>
            <Link href="#demo" className="text-slate-600 hover:text-emerald-600 transition-colors">Demo</Link>
            <Button variant="outline" size="sm">Login</Button>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">Get Started</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-4 bg-emerald-100 text-emerald-800 border-emerald-200">
            🚀 Transform Your Customer Conversations
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Website to WhatsApp to
            <span className="text-emerald-500 block">Payment in Minutes</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            The complete enterprise solution for seamless customer journeys.
            AI-powered chat routing, agent management, and automated payments - all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Input
              placeholder="Enter your business email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-xs"
            />
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-slate-500">
            ✅ 14-day free trial • ✅ No credit card required • ✅ Setup in 10 minutes
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need for Enterprise Chat
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              From initial website contact to final payment - streamline your entire customer journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600">Simple, seamless, and powerful</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Website Chat",
                  description: "Customer starts conversation on your website",
                  icon: Globe
                },
                {
                  step: "2",
                  title: "WhatsApp Transfer",
                  description: "Seamlessly moves to WhatsApp for personal touch",
                  icon: Smartphone
                },
                {
                  step: "3",
                  title: "Payment & Close",
                  description: "AI sends payment link and completes transaction",
                  icon: HeartHandshake
                }
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricing.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-emerald-200 shadow-lg scale-105' : 'border-slate-200'}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-600">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'}`}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-emerald-500">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Customer Experience?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join hundreds of businesses already using Zunoki Enterprise Chat to boost conversions and customer satisfaction.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary">
              Schedule Demo
            </Button>
            <Button size="lg" variant="outline" className="bg-white text-emerald-600 border-white hover:bg-emerald-50">
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Zunoki Enterprise Chat</span>
          </div>
          <p className="text-slate-400 mb-4">
            Transforming customer conversations into business success.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-slate-400">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Support</Link>
            <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}