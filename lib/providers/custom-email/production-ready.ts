import crypto from 'crypto';

interface CustomEmailConfig {
  email: string;
  appPassword: string;
  displayName?: string;
  userId?: string;
  smtpHost: string;
  smtpPort: string;
  imapHost?: string;
  imapPort?: string;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface TestConnectionResult {
  success: boolean;
  error?: string;
  info?: any;
}

export class CustomEmailProviderProduction {
  // Common email provider presets
  private static readonly COMMON_PROVIDERS = {
    yahoo: {
      smtp: { host: 'smtp.mail.yahoo.com', port: 587 },
      imap: { host: 'imap.mail.yahoo.com', port: 993 }
    },
    protonmail: {
      smtp: { host: 'mail.protonmail.ch', port: 587 },
      imap: { host: 'mail.protonmail.ch', port: 993 }
    },
    zoho: {
      smtp: { host: 'smtp.zoho.com', port: 587 },
      imap: { host: 'imap.zoho.com', port: 993 }
    },
    icloud: {
      smtp: { host: 'smtp.mail.me.com', port: 587 },
      imap: { host: 'imap.mail.me.com', port: 993 }
    }
  };

  private detectProvider(email: string): string | null {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;
    
    if (domain.includes('yahoo')) return 'yahoo';
    if (domain.includes('protonmail') || domain.includes('pm.me')) return 'protonmail';
    if (domain.includes('zoho')) return 'zoho';
    if (domain.includes('icloud') || domain.includes('me.com')) return 'icloud';
    
    return null;
  }

  async sendMessage(config: CustomEmailConfig, message: any): Promise<SendMessageResult> {
    try {
      console.log('🔍 Custom Email sendMessage called');
      
      if (!config.email || !config.appPassword || !config.smtpHost || !config.smtpPort) {
        return {
          success: false,
          error: 'Email, password, SMTP host and port are required'
        };
      }

      // Dynamic import of nodemailer
      const nodemailer = await import('nodemailer');
      
      // Parse port as number
      const port = parseInt(config.smtpPort, 10);
      if (isNaN(port)) {
        return {
          success: false,
          error: 'Invalid SMTP port number'
        };
      }

      console.log('🔗 Using custom SMTP config:', {
        host: config.smtpHost,
        port: port
      });

      // Create nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: port,
        secure: port === 465, // Use SSL for port 465, TLS for others
        auth: {
          user: config.email,
          pass: config.appPassword,
        },
      });

      const mailOptions = {
        from: config.displayName ? 
          `"${config.displayName}" <${config.email}>` : 
          config.email,
        to: message.to,
        subject: message.subject || 'Message from your business',
        text: message.content,
        html: message.html || `<p>${message.content}</p>`,
      };

      console.log('📧 Sending custom email...');
      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Custom email sent successfully:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error('❌ Custom email send message failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async processWebhook(payload: any, integration: any): Promise<void> {
    try {
      console.log('📨 Processing Custom Email webhook:', payload);
      
      // Webhook processing will be handled by the same Gmail webhook system
      // since all email providers use SendGrid forwarding
      
      // This method exists for interface compatibility
      console.log('✅ Custom Email webhook processed (forwarded via Gmail system)');
    } catch (error: any) {
      console.error('❌ Custom Email webhook processing failed:', error);
      throw error;
    }
  }

  // Test custom email SMTP connection
  async testConnection(config: CustomEmailConfig & { userId?: string }): Promise<TestConnectionResult> {
    try {
      console.log('🔍 Custom Email testConnection called with config:', { 
        email: config.email, 
        hasAppPassword: !!config.appPassword,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort
      });
      
      if (!config.email || !config.appPassword) {
        return {
          success: false,
          error: 'Email and password are required',
        };
      }

      if (!config.smtpHost || !config.smtpPort) {
        return {
          success: false,
          error: 'SMTP host and port are required',
        };
      }

      // Dynamic import of nodemailer
      const nodemailer = await import('nodemailer');
      
      // Parse port as number
      const port = parseInt(config.smtpPort, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        return {
          success: false,
          error: 'Invalid SMTP port number (must be 1-65535)',
        };
      }

      // Auto-detect common provider settings if available
      const detectedProvider = this.detectProvider(config.email);
      let providerInfo = '';
      
      if (detectedProvider && CustomEmailProviderProduction.COMMON_PROVIDERS[detectedProvider]) {
        const preset = CustomEmailProviderProduction.COMMON_PROVIDERS[detectedProvider];
        providerInfo = ` (detected: ${detectedProvider.charAt(0).toUpperCase() + detectedProvider.slice(1)})`;
        
        // If user didn't specify host/port, suggest the preset values
        if (!config.smtpHost || config.smtpHost === preset.smtp.host) {
          console.log(`🔧 Using preset for ${detectedProvider}`);
        }
      }

      // Create nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: port,
        secure: port === 465, // Use SSL for port 465, TLS for others
        auth: {
          user: config.email,
          pass: config.appPassword,
        },
      });

      console.log('🔗 Testing custom email SMTP connection...');
      await transporter.verify();
      console.log('✅ Custom email SMTP connection successful');

      // Generate unique forwarding address for this user
      let forwardingAddress = '';
      if (config.userId) {
        const userHash = crypto.createHash('md5').update(config.userId).digest('hex').substring(0, 8);
        const forwardingDomain = process.env.GMAIL_FORWARDING_DOMAIN || 'mail.admolabs.com';
        forwardingAddress = `user-${userHash}@${forwardingDomain}`;
        console.log('📧 Generated forwarding address:', forwardingAddress);
      }

      return {
        success: true,
        info: {
          email: config.email,
          smtp: `Connected to custom SMTP server${providerInfo}`,
          host: config.smtpHost,
          port: port,
          security: port === 465 ? 'SSL' : 'TLS',
          provider: detectedProvider || 'Custom',
          forwardingAddress: forwardingAddress,
          imapSupport: config.imapHost ? 'Configured' : 'Not configured',
        },
      };

    } catch (error: any) {
      console.error('❌ Custom email connection test failed:', error);
      
      // Provide helpful error messages for common issues
      let errorMessage = error.message;
      
      if (error.code === 'ENOTFOUND') {
        errorMessage = 'SMTP server not found. Please check the server address.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused. Please check the port number and server availability.';
      } else if (error.code === 'EAUTH') {
        errorMessage = 'Authentication failed. Please check your email and password.';
      } else if (error.responseCode === 535) {
        errorMessage = 'Authentication failed. You may need to enable "Less secure apps" or use an app password.';
      }
      
      return {
        success: false,
        error: `Connection failed: ${errorMessage}`,
      };
    }
  }
}