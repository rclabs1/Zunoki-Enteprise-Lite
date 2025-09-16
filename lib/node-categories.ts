// Node Categories and Types for Workflow Builder
export const nodeCategories = {
  triggers: {
    name: 'Triggers',
    icon: '🚀',
    color: '#0ea5e9',
    nodes: [
      { id: 'manual-trigger', name: 'Manual Trigger', icon: '▶️', description: 'Start workflow manually' },
      { id: 'webhook-trigger', name: 'Webhook', icon: '🔗', description: 'HTTP webhook endpoint' },
      { id: 'schedule-trigger', name: 'Schedule', icon: '⏰', description: 'Time-based trigger' },
      { id: 'chat-message', name: 'Chat Message', icon: '💬', description: 'When message received' },
      { id: 'form-submission', name: 'Form Submit', icon: '📝', description: 'Form submission trigger' },
      { id: 'file-upload', name: 'File Upload', icon: '📁', description: 'When file uploaded' }
    ]
  },
  ai: {
    name: 'AI & ML',
    icon: '🤖',
    color: '#22c55e',
    nodes: [
      { id: 'llm-agent', name: 'LLM Agent', icon: '🧠', description: 'OpenAI, Claude, etc.' },
      { id: 'summarizer', name: 'Text Summarizer', icon: '📄', description: 'Summarize content' },
      { id: 'embeddings', name: 'Embeddings', icon: '🔢', description: 'Vector embeddings' },
      { id: 'sentiment', name: 'Sentiment Analysis', icon: '😊', description: 'Analyze sentiment' },
      { id: 'image-ai', name: 'Image AI', icon: '🖼️', description: 'DALL-E, Midjourney' },
      { id: 'speech-to-text', name: 'Speech to Text', icon: '👂', description: 'Transcribe audio' },
      { id: 'text-to-speech', name: 'Text to Speech', icon: '🗣️', description: 'Generate speech' }
    ]
  },
  apps: {
    name: 'App Actions',
    icon: '📱',
    color: '#f97316',
    nodes: [
      { id: 'google-sheets', name: 'Google Sheets', icon: '📊', description: 'Read/write sheets' },
      { id: 'slack', name: 'Slack', icon: '💼', description: 'Send messages' },
      { id: 'notion', name: 'Notion', icon: '📝', description: 'Create/update pages' },
      { id: 'airtable', name: 'Airtable', icon: '🗄️', description: 'Database operations' },
      { id: 'gmail', name: 'Gmail', icon: '📧', description: 'Send/read emails' },
      { id: 'hubspot', name: 'HubSpot', icon: '🎯', description: 'CRM operations' },
      { id: 'salesforce', name: 'Salesforce', icon: '☁️', description: 'CRM integration' },
      { id: 'http-request', name: 'HTTP Request', icon: '🌐', description: 'API calls' }
    ]
  },
  data: {
    name: 'Data Transform',
    icon: '🔄',
    color: '#a855f7',
    nodes: [
      { id: 'filter', name: 'Filter', icon: '🔍', description: 'Filter data' },
      { id: 'merge', name: 'Merge', icon: '🔗', description: 'Combine data' },
      { id: 'split', name: 'Split', icon: '✂️', description: 'Split arrays' },
      { id: 'format', name: 'Format', icon: '📐', description: 'Transform data' },
      { id: 'aggregate', name: 'Aggregate', icon: '📊', description: 'Sum, count, etc.' },
      { id: 'sort', name: 'Sort', icon: '🔢', description: 'Sort data' }
    ]
  },
  flow: {
    name: 'Flow Control',
    icon: '🔀',
    color: '#eab308',
    nodes: [
      { id: 'if-else', name: 'If/Else', icon: '❓', description: 'Conditional logic' },
      { id: 'loop', name: 'Loop', icon: '🔄', description: 'Iterate over data' },
      { id: 'wait', name: 'Wait', icon: '⏳', description: 'Add delays' },
      { id: 'parallel', name: 'Parallel', icon: '⚡', description: 'Run in parallel' },
      { id: 'stop', name: 'Stop', icon: '⛔', description: 'Stop execution' },
      { id: 'error-handler', name: 'Error Handler', icon: '🚨', description: 'Handle errors' }
    ]
  },
  human: {
    name: 'Human in Loop',
    icon: '👤',
    color: '#ef4444',
    nodes: [
      { id: 'approval', name: 'Approval', icon: '✅', description: 'Require approval' },
      { id: 'input-request', name: 'Input Request', icon: '📝', description: 'Ask for input' },
      { id: 'review', name: 'Review', icon: '👀', description: 'Human review' },
      { id: 'escalation', name: 'Escalation', icon: '📢', description: 'Escalate to human' }
    ]
  }
}