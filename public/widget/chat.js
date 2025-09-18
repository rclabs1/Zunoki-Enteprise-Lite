(function() {
  'use strict';

  // Check if widget is already loaded
  if (window.ZunokiWidget) {
    return;
  }

  // Default configuration
  const defaultConfig = {
    primaryColor: '#22c55e',
    position: 'bottom-right',
    welcomeMessage: 'Hi! How can we help you today?',
    subtitle: 'We typically reply in a few minutes',
    placeholder: 'Type your message...',
    sendButtonText: 'Send',
    offlineMessage: 'We are currently offline. Leave us a message!',
    apiEndpoint: '/api/widget/message'
  };

  // Merge user config with defaults
  const config = Object.assign({}, defaultConfig, window.ZunokiConfig || {});

  if (!config.apiKey) {
    console.error('Zunoki Chat Widget: API key is required');
    return;
  }

  // Widget state
  let isOpen = false;
  let isMinimized = true;
  let hasUnreadMessages = false;

  // Create widget HTML
  function createWidget() {
    const widgetHTML = `
      <div id="zunoki-chat-widget" style="
        position: fixed;
        ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        ${config.position.includes('top') ? 'top: 20px;' : 'bottom: 20px;'}
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Chat Button -->
        <div id="zunoki-chat-button" style="
          width: 60px;
          height: 60px;
          background-color: ${config.primaryColor};
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          border: none;
          color: white;
          font-size: 24px;
          font-weight: bold;
        ">
          💬
          <div id="zunoki-unread-badge" style="
            display: none;
            position: absolute;
            top: -5px;
            right: -5px;
            background-color: #ef4444;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
          ">!</div>
        </div>

        <!-- Chat Window -->
        <div id="zunoki-chat-window" style="
          display: none;
          position: absolute;
          ${config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
          ${config.position.includes('top') ? 'top: 70px;' : 'bottom: 70px;'}
          width: 350px;
          height: 450px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="
            background-color: ${config.primaryColor};
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div>
              <div style="font-weight: bold; font-size: 16px;">${config.welcomeMessage}</div>
              <div style="font-size: 12px; opacity: 0.9;">${config.subtitle}</div>
            </div>
            <button id="zunoki-close-button" style="
              background: none;
              border: none;
              color: white;
              font-size: 18px;
              cursor: pointer;
              padding: 4px;
            ">×</button>
          </div>

          <!-- Messages -->
          <div id="zunoki-messages" style="
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          ">
            <div style="
              background-color: #f3f4f6;
              padding: 12px;
              border-radius: 8px;
              font-size: 14px;
              color: #374151;
            ">${config.welcomeMessage}</div>
          </div>

          <!-- Contact Form (initially shown) -->
          <div id="zunoki-contact-form" style="
            padding: 16px;
            border-top: 1px solid #e5e7eb;
          ">
            <div style="margin-bottom: 12px; font-size: 14px; color: #374151; font-weight: 500;">
              Let us know how to reach you:
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <input
                id="zunoki-contact-name"
                type="text"
                placeholder="Your Name"
                style="
                  padding: 8px 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  font-size: 14px;
                  outline: none;
                "
              />
              <input
                id="zunoki-contact-email"
                type="email"
                placeholder="Your Email"
                style="
                  padding: 8px 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  font-size: 14px;
                  outline: none;
                "
              />
              <button id="zunoki-start-chat" style="
                background-color: ${config.primaryColor};
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
              ">Start Chat</button>
            </div>
          </div>

          <!-- Message Input (initially hidden) -->
          <div id="zunoki-message-input" style="
            display: none;
            padding: 16px;
            border-top: 1px solid #e5e7eb;
          ">
            <div style="display: flex; gap: 8px;">
              <input
                id="zunoki-message-text"
                type="text"
                placeholder="${config.placeholder}"
                style="
                  flex: 1;
                  padding: 10px 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  font-size: 14px;
                  outline: none;
                "
              />
              <button id="zunoki-send-button" style="
                background-color: ${config.primaryColor};
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
              ">Send</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
  }

  // Contact information
  let contactInfo = null;

  // Add message to chat
  function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('zunoki-messages');
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      max-width: 80%;
      word-wrap: break-word;
      ${isUser ?
        `background-color: ${config.primaryColor}; color: white; align-self: flex-end; margin-left: auto;` :
        'background-color: #f3f4f6; color: #374151;'
      }
    `;
    messageDiv.textContent = content;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Send message to API
  async function sendMessage(message) {
    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: config.apiKey,
          message: message,
          contact: contactInfo,
          page: window.location.href
        })
      });

      const data = await response.json();

      if (data.success && data.response) {
        // Add bot response
        setTimeout(() => {
          addMessage(data.response.text, false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Sorry, there was an error sending your message. Please try again.', false);
    }
  }

  // Initialize widget
  function initWidget() {
    createWidget();

    // Add event listeners
    const chatButton = document.getElementById('zunoki-chat-button');
    const chatWindow = document.getElementById('zunoki-chat-window');
    const closeButton = document.getElementById('zunoki-close-button');
    const startChatButton = document.getElementById('zunoki-start-chat');
    const sendButton = document.getElementById('zunoki-send-button');
    const messageInput = document.getElementById('zunoki-message-text');

    // Toggle chat window
    chatButton.addEventListener('click', () => {
      isOpen = !isOpen;
      chatWindow.style.display = isOpen ? 'flex' : 'none';

      if (isOpen && hasUnreadMessages) {
        hasUnreadMessages = false;
        document.getElementById('zunoki-unread-badge').style.display = 'none';
      }
    });

    // Close chat window
    closeButton.addEventListener('click', () => {
      isOpen = false;
      chatWindow.style.display = 'none';
    });

    // Start chat after contact info
    startChatButton.addEventListener('click', () => {
      const name = document.getElementById('zunoki-contact-name').value.trim();
      const email = document.getElementById('zunoki-contact-email').value.trim();

      if (!email) {
        alert('Please provide your email address');
        return;
      }

      contactInfo = { name, email };

      // Hide contact form, show message input
      document.getElementById('zunoki-contact-form').style.display = 'none';
      document.getElementById('zunoki-message-input').style.display = 'flex';

      // Add welcome message
      addMessage(\`Hi \${name || 'there'}! Thanks for reaching out. How can we help you?\`, false);
    });

    // Send message
    function handleSendMessage() {
      const messageText = messageInput.value.trim();
      if (!messageText || !contactInfo) return;

      // Add user message to chat
      addMessage(messageText, true);

      // Send to API
      sendMessage(messageText);

      // Clear input
      messageInput.value = '';
    }

    sendButton.addEventListener('click', handleSendMessage);

    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    });

    // Add hover effects
    chatButton.addEventListener('mouseenter', () => {
      chatButton.style.transform = 'scale(1.1)';
    });

    chatButton.addEventListener('mouseleave', () => {
      chatButton.style.transform = 'scale(1)';
    });
  }

  // Load widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  // Expose widget API
  window.ZunokiWidget = {
    open: () => {
      document.getElementById('zunoki-chat-window').style.display = 'flex';
      isOpen = true;
    },
    close: () => {
      document.getElementById('zunoki-chat-window').style.display = 'none';
      isOpen = false;
    },
    showUnread: () => {
      hasUnreadMessages = true;
      document.getElementById('zunoki-unread-badge').style.display = 'flex';
    }
  };

})();