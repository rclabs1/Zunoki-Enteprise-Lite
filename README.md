# Zunoki Enterprise Chat Lite

**Transform your website visitors into WhatsApp conversations and drive payments with AI-powered agent management.**

A focused enterprise solution for seamless website-to-WhatsApp-to-payment customer journeys, featuring intelligent agent assignment, real-time chat management, and automated payment processing.

## ✨ Features

- **🌐 Website Chat Widget**: Embeddable chat widget for any website
- **📱 WhatsApp Integration**: Seamless transfer to WhatsApp Business
- **🤖 AI Agent Routing**: Intelligent conversation assignment
- **👥 Team Management**: Role-based access and workload balancing
- **💳 Payment Automation**: Stripe/PayPal payment link generation
- **📊 Analytics Dashboard**: Conversation metrics and team performance
- **🎨 White-label Ready**: Custom branding and deployment options
- **🔒 Enterprise Security**: SOC2 compliant with audit logging

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- WhatsApp Business API access (Meta or Twilio)
- Payment provider account (Stripe/PayPal)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/rclabs1/Zunoki-Enteprise-Lite.git
cd zunoki-enterprise-lite
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Set up database**
```bash
# Run the schema.sql in your Supabase dashboard
# Or use the Supabase CLI:
supabase db reset --db-url "your-supabase-url"
```

5. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Website Widget │───▶│  WhatsApp Chat   │───▶│  Payment Link   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Lead Capture  │    │  Agent Assignment│    │   Transaction   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
zunoki-enterprise-lite/
├── app/
│   ├── (marketing)/           # Landing page
│   ├── (app)/                 # Dashboard app
│   │   ├── conversations/     # Chat interface
│   │   ├── agents/           # Team management
│   │   └── analytics/        # Metrics dashboard
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # UI components
│   ├── chat/                 # Chat components
│   └── branding/             # White-label theming
├── lib/
│   ├── integrations/         # WhatsApp, payments
│   ├── chat/                 # Chat logic
│   └── utils/                # Utilities
└── database/                 # Database schema
```

## 🔧 Configuration

### WhatsApp Setup

1. **Meta WhatsApp Business API**
   - Create a Meta Developer account
   - Set up WhatsApp Business API
   - Configure webhook endpoints

2. **Twilio WhatsApp (Alternative)**
   - Create Twilio account
   - Enable WhatsApp Business API
   - Configure phone number

### Payment Integration

1. **Stripe**
   - Create Stripe account
   - Get API keys from dashboard
   - Set up webhook endpoints

2. **PayPal**
   - Create PayPal Business account
   - Get API credentials
   - Configure IPN settings

### White-label Deployment

```bash
# Set environment variables for branding
NEXT_PUBLIC_BRAND_NAME="Your Company Chat"
NEXT_PUBLIC_PRIMARY_COLOR="#your-brand-color"
NEXT_PUBLIC_WHITE_LABEL=true
NEXT_PUBLIC_CUSTOM_DOMAIN=chat.yourcompany.com
```

## 🤖 AI Agent Configuration

Agents are automatically assigned based on:
- **Keywords**: Route by conversation topic
- **Workload**: Balance across available agents
- **Skills**: Match agent expertise to inquiry type
- **Languages**: Route based on customer language
- **Working Hours**: Assign to agents currently online

## 📊 Analytics & Reporting

Track key metrics:
- **Conversion Rate**: Website → WhatsApp → Payment
- **Response Time**: Agent performance metrics
- **Customer Satisfaction**: Post-conversation ratings
- **Revenue Attribution**: Payment tracking per agent
- **Team Performance**: Workload and efficiency metrics

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Docker
```bash
docker build -t zunoki-enterprise-lite .
docker run -p 3000:3000 zunoki-enterprise-lite
```

### Custom Deployment
The application is a standard Next.js app and can be deployed to any platform that supports Node.js.

## 🔒 Security

- **Row Level Security**: Database-level tenant isolation
- **API Authentication**: NextAuth.js with Google OAuth
- **Webhook Validation**: Cryptographic signature verification
- **Data Encryption**: Sensitive data encrypted at rest
- **Audit Logging**: Comprehensive activity tracking

## 🛠️ Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

- **Documentation**: [docs.zunoki.com](https://docs.zunoki.com)
- **Email**: support@zunoki.com
- **Chat**: Available in the dashboard
- **Enterprise Support**: priority@zunoki.com

## 🗺️ Roadmap

- [ ] **Mobile Apps**: Native iOS/Android apps
- [ ] **Voice Integration**: Voice message support
- [ ] **CRM Integration**: Salesforce, HubSpot connectors
- [ ] **Advanced Analytics**: Predictive insights
- [ ] **Multi-language**: Automatic translation
- [ ] **Video Chat**: In-app video calling

---

**Built with ❤️ by the Zunoki team**