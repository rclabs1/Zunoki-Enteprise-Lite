import { supabase } from '@/lib/supabase-campaign-service'
import { IntegrationCredentials, ApiKeyCredentials } from './oauth-providers'

export interface EncryptedCredentials {
  id: string
  user_id: string
  provider: string
  encrypted_data: string
  account_id?: string
  account_name?: string
  provider_type: 'oauth' | 'api_key'
  is_active: boolean
  last_synced_at?: Date
  expires_at?: Date
  created_at: Date
  updated_at: Date
}

export class CredentialManager {
  private encryption_key: string

  constructor() {
    // In production, this should come from environment variables or Supabase Edge functions
    this.encryption_key = process.env.CREDENTIAL_ENCRYPTION_KEY || 'default-dev-key'
  }

  // Encrypt sensitive data before storing
  private encrypt(data: string): string {
    // Simple encryption for demo - use proper encryption in production
    // Consider using Web Crypto API or a library like node-forge
    return Buffer.from(data).toString('base64')
  }

  // Decrypt stored data
  private decrypt(encryptedData: string): string {
    try {
      return Buffer.from(encryptedData, 'base64').toString('utf-8')
    } catch (error) {
      throw new Error('Failed to decrypt credentials')
    }
  }

  // Store OAuth credentials securely
  async storeOAuthCredentials(
    userId: string,
    provider: string,
    credentials: {
      access_token: string
      refresh_token?: string
      expires_at?: Date
      scope?: string
      account_id?: string
      account_name?: string
    }
  ): Promise<boolean> {
    try {
      const encryptedData = this.encrypt(JSON.stringify({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        scope: credentials.scope
      }))

      const { error } = await supabase
        .from('integration_credentials')
        .upsert({
          user_id: userId,
          provider,
          encrypted_data: encryptedData,
          account_id: credentials.account_id,
          account_name: credentials.account_name,
          provider_type: 'oauth',
          expires_at: credentials.expires_at,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider' })

      if (error) {
        console.error('Failed to store OAuth credentials:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error storing OAuth credentials:', error)
      return false
    }
  }

  // Store API key credentials securely
  async storeApiKeyCredentials(
    userId: string,
    provider: string,
    credentials: Record<string, string>,
    accountInfo?: { account_id?: string; account_name?: string }
  ): Promise<boolean> {
    try {
      const encryptedData = this.encrypt(JSON.stringify(credentials))

      const { error } = await supabase
        .from('integration_credentials')
        .upsert({
          user_id: userId,
          provider,
          encrypted_data: encryptedData,
          account_id: accountInfo?.account_id,
          account_name: accountInfo?.account_name,
          provider_type: 'api_key',
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider' })

      if (error) {
        console.error('Failed to store API key credentials:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error storing API key credentials:', error)
      return false
    }
  }

  // Retrieve and decrypt credentials
  async getCredentials(userId: string, provider: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('integration_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return null
      }

      const decryptedData = this.decrypt(data.encrypted_data)
      return {
        ...JSON.parse(decryptedData),
        account_id: data.account_id,
        account_name: data.account_name,
        last_synced_at: data.last_synced_at,
        expires_at: data.expires_at
      }
    } catch (error) {
      console.error('Error retrieving credentials:', error)
      return null
    }
  }

  // Get all user integrations with masked credentials
  async getUserIntegrations(userId: string): Promise<EncryptedCredentials[]> {
    try {
      const { data, error } = await supabase
        .from('integration_credentials')
        .select('id, user_id, provider, account_id, account_name, provider_type, is_active, last_synced_at, expires_at, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch user integrations:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching user integrations:', error)
      return []
    }
  }

  // Update last sync timestamp
  async updateLastSync(userId: string, provider: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('integration_credentials')
        .update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', provider)

      return !error
    } catch (error) {
      console.error('Error updating last sync:', error)
      return false
    }
  }

  // Disable/remove integration
  async removeIntegration(userId: string, provider: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('integration_credentials')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', provider)

      return !error
    } catch (error) {
      console.error('Error removing integration:', error)
      return false
    }
  }

  // Check if credentials are expired (for OAuth)
  isCredentialExpired(credential: EncryptedCredentials): boolean {
    if (!credential.expires_at) return false
    return new Date(credential.expires_at) <= new Date()
  }

  // Get credentials that need refresh
  async getExpiredCredentials(userId: string): Promise<EncryptedCredentials[]> {
    try {
      const { data, error } = await supabase
        .from('integration_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('provider_type', 'oauth')
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString())

      if (error) {
        console.error('Failed to fetch expired credentials:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching expired credentials:', error)
      return []
    }
  }

  // Refresh OAuth token
  async refreshOAuthToken(userId: string, provider: string, newTokenData: {
    access_token: string
    refresh_token?: string
    expires_at?: Date
  }): Promise<boolean> {
    try {
      // Get existing credentials to preserve other data
      const existing = await this.getCredentials(userId, provider)
      if (!existing) return false

      // Update with new token data
      const updatedCredentials = {
        ...existing,
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token || existing.refresh_token
      }

      const encryptedData = this.encrypt(JSON.stringify(updatedCredentials))

      const { error } = await supabase
        .from('integration_credentials')
        .update({
          encrypted_data: encryptedData,
          expires_at: newTokenData.expires_at?.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', provider)

      return !error
    } catch (error) {
      console.error('Error refreshing OAuth token:', error)
      return false
    }
  }

  // Validate credentials by making a test API call
  async validateCredentials(userId: string, provider: string): Promise<boolean> {
    try {
      const credentials = await this.getCredentials(userId, provider)
      if (!credentials) return false

      // Make a simple API call to validate credentials
      const response = await fetch('/api/integrations/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          credentials
        })
      })

      return response.ok
    } catch (error) {
      console.error('Error validating credentials:', error)
      return false
    }
  }
}