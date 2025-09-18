# Zunoki Chat Widget Integration

## 🌐 Website Traffic Capture Strategy

### Method 1: Embedded Chat Widget (Primary)

#### Customer Implementation
```html
<!-- Customer adds this to their website -->
<script>
  window.ZunokiConfig = {
    orgId: 'customer-org-123',
    apiKey: 'zk_live_abc123...',
    position: 'bottom-right',
    primaryColor: '#10B981',
    greeting: 'Hi! How can we help you today?'
  };

  (function() {
    const script = document.createElement('script');
    script.src = 'https://widget.zunoki.com/embed.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
```

#### Widget Features
- **Floating chat bubble** on customer's website
- **Real-time messaging** with AI agents
- **Seamless WhatsApp handoff**
- **Lead capture forms**
- **File uploads** and media sharing
- **Mobile responsive**

#### Technical Implementation

**Widget Backend (Your API):**
```javascript
// /api/widget/conversations
export async function POST(request) {
  const { orgId, contact, message } = await request.json()

  // Validate org and create/find contact
  const organization = await getOrganization(orgId)
  const contactRecord = await findOrCreateContact(organization.id, contact)

  // Create conversation
  const conversation = await createConversation({
    organization_id: organization.id,
    contact_id: contactRecord.id,
    channel: 'web',
    status: 'active'
  })

  // Store message
  const messageRecord = await createMessage({
    organization_id: organization.id,
    conversation_id: conversation.id,
    content: message.text,
    role: 'user',
    message_type: 'text'
  })

  // Trigger AI response
  await triggerAIAgent(conversation.id, organization.id)

  return NextResponse.json({ conversationId: conversation.id })
}
```

**Real-time Updates:**
```javascript
// Widget connects via WebSocket or SSE
const eventSource = new EventSource(
  `https://api.zunoki.com/v1/conversations/${conversationId}/stream`
)

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data)
  appendMessageToChat(message)
}
```

### Method 2: Zunoki-Hosted Landing Pages

#### Setup Process
1. **Customer creates landing page** in Zunoki dashboard
2. **Gets custom URL:** `mycorp.zunoki.com` or `chat.mycorp.com`
3. **Drives traffic** to that page via ads, email, social
4. **Full chat experience** hosted on Zunoki

#### Benefits
- **No technical integration** required
- **Full control** over chat experience
- **Built-in analytics** and tracking
- **Mobile-optimized** automatically

### Method 3: API-First Integration

#### For Existing Chat Systems
```javascript
// Customer's existing chat calls Zunoki API
class ZunokiIntegration {
  constructor(apiKey, orgId) {
    this.apiKey = apiKey
    this.orgId = orgId
    this.baseUrl = 'https://api.zunoki.com/v1'
  }

  async sendMessage(contact, message) {
    const response = await fetch(`${this.baseUrl}/conversations/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        org_id: this.orgId,
        contact,
        message
      })
    })

    return response.json() // AI response
  }

  async getConversationHistory(contactId) {
    const response = await fetch(
      `${this.baseUrl}/conversations/history/${contactId}`,
      { headers: { 'Authorization': `Bearer ${this.apiKey}` }}
    )

    return response.json()
  }
}
```

## 🎯 Customer Onboarding Flow

### Step 1: Setup in Zunoki Dashboard
```
Customer logs into Zunoki →
├── Creates organization
├── Configures AI agent (Maya)
├── Sets up WhatsApp integration
├── Customizes chat widget appearance
└── Gets embed code
```

### Step 2: Website Integration
```
Customer copies embed code →
├── Adds to website header/footer
├── Tests chat functionality
├── Configures lead capture forms
└── Sets up notification preferences
```

### Step 3: Go Live
```
Widget goes live →
├── Visitors see chat bubble
├── AI agent responds automatically
├── Conversations stored in Supabase
└── WhatsApp handoff when ready
```

## 📊 Implementation in Your App

### Widget Generator Component
```tsx
// app/dashboard/integrations/widget/page.tsx
export default function WidgetSetup() {
  const { organization } = useAuth()
  const [config, setConfig] = useState({
    position: 'bottom-right',
    primaryColor: '#10B981',
    greeting: 'Hi! How can we help?'
  })

  const embedCode = generateEmbedCode(organization.id, config)

  return (
    <div>
      <h1>Website Chat Widget</h1>

      {/* Configuration Form */}
      <WidgetConfigForm config={config} onChange={setConfig} />

      {/* Generated Embed Code */}
      <CodeBlock language="html" code={embedCode} />

      {/* Live Preview */}
      <WidgetPreview config={config} />

      {/* Analytics */}
      <WidgetAnalytics orgId={organization.id} />
    </div>
  )
}
```

### API Routes for Widget
```typescript
// app/api/widget/conversations/route.ts
export async function POST(request: Request) {
  const { orgId, contact, message, widgetConfig } = await request.json()

  // Authenticate widget request
  const isValidWidget = await validateWidgetRequest(orgId, request)
  if (!isValidWidget) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Process conversation...
  return NextResponse.json({ success: true, conversationId })
}
```

## 🚀 Traffic Capture Strategy

### Primary: Embedded Widget
- **80% of enterprise customers** prefer this
- **Easy integration** with existing websites
- **Full feature set** available
- **Real-time performance**

### Secondary: Hosted Pages
- **20% of customers** who want no-code solution
- **Great for campaigns** and specific funnels
- **Quick setup** and deployment

### Advanced: API Integration
- **Large enterprises** with existing systems
- **Custom implementations**
- **White-label solutions**

## 📈 Expected Results

### Traffic Capture Rates
- **Widget visibility:** 60-80% of visitors see widget
- **Engagement rate:** 3-8% of visitors start chat
- **Conversion to WhatsApp:** 40-60% continue conversation
- **Lead qualification:** 25-40% become qualified leads

This gives your customers multiple ways to capture and convert their website traffic into qualified leads through your AI agents!