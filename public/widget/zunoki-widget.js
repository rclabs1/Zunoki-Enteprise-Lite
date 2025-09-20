/**
 * Zunoki Intelligent Chat Widget
 * A production-ready customer support widget with AI integration
 *
 * Usage:
 * window.ZunokiWidget = {
 *   orgId: 'your-org-id',
 *   widgetId: 'your-widget-id',
 *   apiUrl: 'https://yourapp.com/api/webhooks/chat-widget',
 *   config: { ... }
 * };
 */

(function() {
  'use strict';

  // Check if widget is already loaded
  if (window.ZunokiWidgetLoaded) {
    return;
  }
  window.ZunokiWidgetLoaded = true;

  // Default configuration
  const defaultConfig = {
    widgetName: 'Customer Support',
    primaryColor: '#3b82f6',
    position: 'bottom-right',
    welcomeMessage: 'Hi! How can I help you today?',
    businessType: 'support',
    features: {}
  };

  // Merge user config with defaults
  const config = Object.assign({}, defaultConfig, window.ZunokiWidget?.config || {});
  const orgId = window.ZunokiWidget?.orgId;
  const widgetId = window.ZunokiWidget?.widgetId;
  const apiUrl = window.ZunokiWidget?.apiUrl;

  if (!orgId || !apiUrl) {
    console.error('Zunoki Widget: Missing required configuration (orgId, apiUrl)');
    return;
  }

  // Generate unique visitor ID
  function generateVisitorId() {
    let visitorId = localStorage.getItem('zunoki_visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
      localStorage.setItem('zunoki_visitor_id', visitorId);
    }
    return visitorId;
  }

  // Widget state
  let isOpen = false;
  let isMinimized = false;
  let messages = [];
  let visitorId = generateVisitorId();
  let visitorInfo = {
    id: visitorId,
    name: localStorage.getItem('zunoki_visitor_name') || null,
    email: localStorage.getItem('zunoki_visitor_email') || null,
    user_agent: navigator.userAgent,
    page_url: window.location.href,
    referrer: document.referrer,
    ip_address: null // Will be detected server-side
  };

  // CSS styles
  const styles = `
    .zunoki-widget {
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }

    .zunoki-widget-button {
      position: fixed;
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      bottom: 20px;
      width: 60px;
      height: 60px;
      background: ${config.primaryColor};
      border: none;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      z-index: 1000000;
    }

    .zunoki-widget-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }

    .zunoki-widget-button svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    .zunoki-widget-chat {
      position: fixed;
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      bottom: 90px;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 1000000;
    }

    .zunoki-widget-chat.open {
      display: flex;
    }

    .zunoki-widget-header {
      background: ${config.primaryColor};
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .zunoki-widget-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .zunoki-widget-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .zunoki-widget-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f9fafb;
    }

    .zunoki-message {
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
    }

    .zunoki-message.user {
      align-items: flex-end;
    }

    .zunoki-message.assistant {
      align-items: flex-start;
    }

    .zunoki-message-content {
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 12px;
      word-wrap: break-word;
    }

    .zunoki-message.user .zunoki-message-content {
      background: ${config.primaryColor};
      color: white;
    }

    .zunoki-message.assistant .zunoki-message-content {
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .zunoki-quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .zunoki-quick-action {
      background: white;
      border: 1px solid ${config.primaryColor};
      color: ${config.primaryColor};
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .zunoki-quick-action:hover {
      background: ${config.primaryColor};
      color: white;
    }

    .zunoki-widget-input {
      border-top: 1px solid #e5e7eb;
      padding: 16px;
      background: white;
    }

    .zunoki-input-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .zunoki-input {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      padding: 10px 16px;
      outline: none;
      resize: none;
      font-family: inherit;
      font-size: 14px;
      max-height: 100px;
      min-height: 20px;
    }

    .zunoki-send-button {
      background: ${config.primaryColor};
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.2s ease;
    }

    .zunoki-send-button:hover {
      transform: scale(1.05);
    }

    .zunoki-send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .zunoki-typing {
      display: none;
      padding: 8px 12px;
      color: #6b7280;
      font-style: italic;
      font-size: 12px;
    }

    .zunoki-powered-by {
      text-align: center;
      padding: 8px;
      font-size: 10px;
      color: #9ca3af;
      border-top: 1px solid #f3f4f6;
    }

    @media (max-width: 480px) {
      .zunoki-widget-chat {
        width: calc(100vw - 40px);
        height: calc(100vh - 40px);
        bottom: 20px;
        ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      }
    }
  `;

  // Add styles to page
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Create widget HTML
  function createWidget() {
    const widget = document.createElement('div');
    widget.className = 'zunoki-widget';
    widget.innerHTML = `
      <button class="zunoki-widget-button" id="zunoki-toggle">
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04 1.05 4.4L1 23l6.6-2.05c1.36.69 2.86 1.05 4.4 1.05 5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.4 0-2.72-.35-3.88-.98L7 19.5l-4.5 1.4 1.4-4.5-.52-1.12C2.35 14.72 2 13.4 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10z"/>
        </svg>
      </button>

      <div class="zunoki-widget-chat" id="zunoki-chat">
        <div class="zunoki-widget-header">
          <h3>${config.widgetName}</h3>
          <button class="zunoki-widget-close" id="zunoki-close">×</button>
        </div>

        <div class="zunoki-widget-messages" id="zunoki-messages">
          <div class="zunoki-message assistant">
            <div class="zunoki-message-content">
              ${config.welcomeMessage}
            </div>
          </div>
        </div>

        <div class="zunoki-typing" id="zunoki-typing">
          AI is typing...
        </div>

        <div class="zunoki-widget-input">
          <div class="zunoki-input-row">
            <textarea
              class="zunoki-input"
              id="zunoki-input"
              placeholder="Type your message..."
              rows="1"
            ></textarea>
            <button class="zunoki-send-button" id="zunoki-send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="zunoki-powered-by">
          Powered by Zunoki
        </div>
      </div>
    `;

    document.body.appendChild(widget);

    // Add event listeners
    document.getElementById('zunoki-toggle').addEventListener('click', toggleWidget);
    document.getElementById('zunoki-close').addEventListener('click', closeWidget);
    document.getElementById('zunoki-send').addEventListener('click', sendMessage);
    document.getElementById('zunoki-input').addEventListener('keypress', handleKeyPress);
    document.getElementById('zunoki-input').addEventListener('input', autoResize);
  }

  // Widget functionality
  function toggleWidget() {
    const chat = document.getElementById('zunoki-chat');
    isOpen = !isOpen;

    if (isOpen) {
      chat.classList.add('open');
      document.getElementById('zunoki-input').focus();
    } else {
      chat.classList.remove('open');
    }
  }

  function closeWidget() {
    isOpen = false;
    document.getElementById('zunoki-chat').classList.remove('open');
  }

  function autoResize() {
    const input = document.getElementById('zunoki-input');
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function addMessage(content, role = 'user', quickActions = null) {
    const messagesContainer = document.getElementById('zunoki-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `zunoki-message ${role}`;

    let messageHtml = `<div class="zunoki-message-content">${content}</div>`;

    if (quickActions && quickActions.length > 0) {
      messageHtml += '<div class="zunoki-quick-actions">';
      quickActions.forEach(action => {
        messageHtml += `<button class="zunoki-quick-action" onclick="handleQuickAction('${action.action}')">${action.text}</button>`;
      });
      messageHtml += '</div>';
    }

    messageEl.innerHTML = messageHtml;
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    messages.push({ content, role, timestamp: new Date().toISOString() });
  }

  function showTyping() {
    document.getElementById('zunoki-typing').style.display = 'block';
    const messagesContainer = document.getElementById('zunoki-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('zunoki-typing').style.display = 'none';
  }

  async function sendMessage() {
    const input = document.getElementById('zunoki-input');
    const sendButton = document.getElementById('zunoki-send');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    addMessage(message, 'user');

    // Clear input and disable send button
    input.value = '';
    autoResize();
    sendButton.disabled = true;

    // Show typing indicator
    showTyping();

    try {
      // Send to webhook
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            id: 'msg_' + Date.now(),
            content: message,
            type: 'text',
            timestamp: new Date().toISOString()
          },
          visitor: visitorInfo,
          widget_id: widgetId
        })
      });

      const result = await response.json();

      hideTyping();

      if (result.ok && result.response) {
        // Add AI response
        addMessage(
          result.response.message,
          'assistant',
          result.response.quick_actions
        );

        // Handle seamless handoff options
        if (result.response.seamless_handoff) {
          window.ZunokiHandoff = result.response.seamless_handoff;
        }
      } else {
        addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
      }

    } catch (error) {
      console.error('Zunoki Widget: Error sending message:', error);
      hideTyping();
      addMessage('Sorry, I\'m having trouble connecting. Please try again.', 'assistant');
    } finally {
      sendButton.disabled = false;
    }
  }

  // Quick action handler
  window.handleQuickAction = function(action) {
    switch (action) {
      case 'handoff_whatsapp':
        if (window.ZunokiHandoff) {
          window.open(`https://wa.me/?text=Hi, I was chatting on your website and would like to continue here.`, '_blank');
        }
        break;
      case 'handoff_email':
        if (window.ZunokiHandoff) {
          window.open(`mailto:support@example.com?subject=Website Chat Follow-up&body=Hi, I was chatting on your website and would like to continue via email.`, '_blank');
        }
        break;
      case 'send_catalogue':
        addMessage('📋 I\'d be happy to send you our catalogue! Please provide your email address.', 'assistant');
        break;
      default:
        addMessage(`You selected: ${action}`, 'user');
        showTyping();
        setTimeout(() => {
          hideTyping();
          addMessage('Thanks for your selection! How else can I help you?', 'assistant');
        }, 1000);
    }
  };

  // Visitor info collection
  function collectVisitorInfo() {
    // Try to get visitor name and email from common form fields
    const emailFields = document.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"]');
    const nameFields = document.querySelectorAll('input[name*="name"], input[id*="name"], input[name*="first"], input[name*="last"]');

    if (emailFields.length > 0 && emailFields[0].value) {
      visitorInfo.email = emailFields[0].value;
      localStorage.setItem('zunoki_visitor_email', visitorInfo.email);
    }

    if (nameFields.length > 0 && nameFields[0].value) {
      visitorInfo.name = nameFields[0].value;
      localStorage.setItem('zunoki_visitor_name', visitorInfo.name);
    }
  }

  // Initialize widget when DOM is ready
  function initWidget() {
    createWidget();

    // Collect visitor info periodically
    setInterval(collectVisitorInfo, 5000);

    console.log('Zunoki Intelligent Chat Widget loaded successfully');
  }

  // Load widget
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

})();