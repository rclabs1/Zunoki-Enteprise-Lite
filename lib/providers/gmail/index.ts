import axios from 'axios';
import type { BaseMessage, MessagingIntegration } from '@/lib/messaging-service';

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
}

export interface GmailMessage extends BaseMessage {
  platform: 'gmail';
  threadId?: string;
  subject?: string;
}

class GmailProvider {
  private static readonly BASE_URL = 'https://gmail.googleapis.com/gmail/v1';

  async sendMessage(integration: MessagingIntegration, message: BaseMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { gmailProviderProduction } = await import('./production-ready');
      return await gmailProviderProduction.sendMessage(integration, message);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processWebhook(payload: any, integration: MessagingIntegration): Promise<void> {
    try {
      const { gmailProviderProduction } = await import('./production-ready');
      await gmailProviderProduction.processWebhook(payload, integration);
    } catch (error) {
      console.error('Error processing Gmail webhook:', error);
    }
  }

  async testConnection(config: GmailConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const { gmailProviderProduction } = await import('./production-ready');
      return await gmailProviderProduction.testConnection(config);
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async refreshAccessToken(config: GmailConfig): Promise<{ success: boolean; accessToken?: string; error?: string }> {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token'
      });

      return {
        success: true,
        accessToken: response.data.access_token
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error_description || error.message
      };
    }
  }
}

export const gmailProvider = new GmailProvider();
export default gmailProvider;