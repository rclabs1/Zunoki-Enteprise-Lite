import crypto from 'crypto';

interface OutlookConfig {
  email: string;
  appPassword: string;
  displayName?: string;
  userId?: string;
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

export class OutlookProviderProduction {
  private static readonly SMTP_CONFIG = {
    host: 'smtp-mail.outlook.com', // Outlook/Hotmail SMTP
    port: 587,
    secure: false, // TLS
  };

  private static readonly OFFICE365_SMTP_CONFIG = {
    host: 'smtp.office365.com', // Office 365 SMTP
    port: 587,
    secure: false, // TLS
  };

  async sendMessage(config: OutlookConfig, message: any): Promise<SendMessageResult> {
    try {
      console.log('🔍 Outlook sendMessage called');
      
      if (!config.email || !config.appPassword) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      // Dynamic import of nodemailer
      const nodemailer = await import('nodemailer');
      
      // Determine SMTP config based on email domain
      const isOffice365 = config.email.includes('@') && 
        !config.email.toLowerCase().includes('@outlook.com') && 
        !config.email.toLowerCase().includes('@hotmail.com') &&
        !config.email.toLowerCase().includes('@live.com');
      
      const smtpConfig = isOffice365 
        ? OutlookProviderProduction.OFFICE365_SMTP_CONFIG 
        : OutlookProviderProduction.SMTP_CONFIG;

      console.log(`🔗 Using ${isOffice365 ? 'Office 365' : 'Outlook.com'} SMTP config:`, {
        host: smtpConfig.host,
        port: smtpConfig.port
      });

      // Create nodemailer transporter
      const transporter = nodemailer.createTransport({
        ...smtpConfig,
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

      console.log('📧 Sending Outlook email...');
      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Outlook email sent successfully:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error('❌ Outlook send message failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async processWebhook(payload: any, integration: any): Promise<void> {
    try {
      console.log('📨 Processing Outlook webhook:', payload);
      
      // Webhook processing will be handled by the same Gmail webhook
      // since both use SendGrid forwarding system
      
      // This method exists for interface compatibility
      console.log('✅ Outlook webhook processed (forwarded via Gmail system)');
    } catch (error: any) {
      console.error('❌ Outlook webhook processing failed:', error);
      throw error;
    }
  }

  // Test Outlook SMTP connection
  async testConnection(config: OutlookConfig & { userId?: string }): Promise<TestConnectionResult> {
    try {
      console.log('🔍 Outlook testConnection called with config:', { email: config.email, hasAppPassword: !!config.appPassword });
      
      if (!config.email || !config.appPassword) {
        return {
          success: false,
          error: 'Email and password are required',
        };
      }

      // Dynamic import of nodemailer
      const nodemailer = await import('nodemailer');
      
      // Determine SMTP config based on email domain
      const isOffice365 = config.email.includes('@') && 
        !config.email.toLowerCase().includes('@outlook.com') && 
        !config.email.toLowerCase().includes('@hotmail.com') &&
        !config.email.toLowerCase().includes('@live.com');
      
      const smtpConfig = isOffice365 
        ? OutlookProviderProduction.OFFICE365_SMTP_CONFIG 
        : OutlookProviderProduction.SMTP_CONFIG;

      // Create nodemailer transporter
      const transporter = nodemailer.createTransport({
        ...smtpConfig,
        auth: {
          user: config.email,
          pass: config.appPassword,
        },
      });

      console.log('🔗 Testing Outlook SMTP connection...');
      await transporter.verify();
      console.log('✅ Outlook SMTP connection successful');

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
          smtp: `Connected to ${isOffice365 ? 'Office 365' : 'Outlook.com'} SMTP`,
          host: smtpConfig.host,
          port: smtpConfig.port,
          accountType: isOffice365 ? 'Office 365' : 'Outlook.com',
          forwardingAddress: forwardingAddress,
        },
      };

    } catch (error: any) {
      console.error('❌ Outlook connection test failed:', error);
      return {
        success: false,
        error: `Connection failed: ${error.message}. Please check your email and password.`,
      };
    }
  }
}