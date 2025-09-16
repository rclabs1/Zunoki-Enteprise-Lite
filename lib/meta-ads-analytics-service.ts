// lib/meta-ads-analytics-service.ts
import axios from 'axios'
import { supabase } from './supabase-campaign-service'

interface MetaTokens {
  access_token: string
  expires_at?: string
}

interface AudienceInsight {
  platform: string
  segment_name: string
  segment_type?: string
  description?: string
  size?: number
  data?: any
}

export const metaAdsAnalyticsService = {
  async getAccessToken(userId: string): Promise<MetaTokens> {
    const { data: tokens, error } = await supabase
      .from('user_tokens')
      .select('access_token, expires_at')
      .eq('user_id', userId)
      .eq('platform', 'meta')
      .single()

    if (error || !tokens) {
      throw new Error('Meta tokens not found for user')
    }

    // Implement token refresh logic here if token is expired or expiring soon
    // Meta long-lived tokens can be refreshed by exchanging them again
    // for a new long-lived token before they expire.
    if (tokens.expires_at && new Date(tokens.expires_at).getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000) { // Refresh if expiring within 7 days
      console.log('Meta token expiring soon, attempting to refresh for user:', userId)
      try {
        const { data: refreshedTokenData } = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            fb_exchange_token: tokens.access_token,
          },
        })

        const newLongLivedAccessToken = refreshedTokenData.access_token
        const newLongLivedExpiresIn = refreshedTokenData.expires_in
        const newExpiresAt = new Date(Date.now() + newLongLivedExpiresIn * 1000).toISOString()

        const { error: updateError } = await supabase
          .from('user_tokens')
          .update({
            access_token: newLongLivedAccessToken,
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('platform', 'meta')

        if (updateError) {
          console.error('Error updating refreshed Meta tokens in Supabase:', updateError)
          throw updateError
        }
        console.log('Meta access token refreshed and updated for user:', userId)
        return { access_token: newLongLivedAccessToken, expires_at: newExpiresAt }
      } catch (refreshError: any) {
        console.error('Error refreshing Meta access token for user:', userId, refreshError.response?.data || refreshError.message)
        // If refresh fails, invalidate the token and force re-authentication
        await supabase.from('user_tokens').delete().eq('user_id', userId).eq('platform', 'meta')
        throw new Error('Failed to refresh Meta token. Please re-authenticate.')
      }
    }

    return tokens
  },

  async fetchMetaAdsAudienceInsights(userId: string): Promise<AudienceInsight[]> {
    const { access_token } = await this.getAccessToken(userId)

    console.log('Fetching Meta Ads audience insights for user:', userId)

    const insights: AudienceInsight[] = []

    try {
      // First, get the ad accounts accessible by the user
      const { data: adAccountsResponse } = await axios.get(
        `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name&access_token=${access_token}`,
      )

      if (adAccountsResponse.data && adAccountsResponse.data.length > 0) {
        for (const account of adAccountsResponse.data) {
          // Fetch custom audiences for each ad account
          try {
            const { data: customAudiencesResponse } = await axios.get(
              `https://graph.facebook.com/v19.0/${account.id}/customaudiences?fields=id,name,description,approximate_count&access_token=${access_token}`,
            )

            if (customAudiencesResponse.data) {
              for (const audience of customAudiencesResponse.data) {
                insights.push({
                  platform: 'meta_ads',
                  segment_name: audience.name,
                  segment_type: 'Custom Audience',
                  description: audience.description || `Custom Audience for Ad Account: ${account.name}`,
                  size: audience.approximate_count || null,
                  data: { adAccountId: account.id, audienceId: audience.id, raw: audience },
                })
              }
            }
          } catch (audienceError: any) {
            console.warn(
              `Could not fetch custom audiences for ad account ${account.id}:`,
              audienceError.response?.data || audienceError.message,
            )
          }
        }
      } else {
        console.log('No accessible Meta Ad Accounts found for user:', userId)
      }
      return insights
    } catch (error: any) {
      console.error('Error fetching Meta Ads audience insights:', error.response?.data || error.message)
      return []
    }
  },

  async storeAudienceInsights(userId: string, insights: AudienceInsight[]): Promise<void> {
    const insightsToStore = insights.map(insight => ({
      user_id: userId,
      platform: insight.platform,
      segment_name: insight.segment_name,
      segment_type: insight.segment_type,
      description: insight.description,
      size: insight.size,
      data: insight.data,
    }))

    const { error } = await supabase.from('user_audience_insights').upsert(insightsToStore, { onConflict: 'user_id, platform, segment_name' })

    if (error) {
      console.error('Error storing audience insights:', error)
      throw error
    }
    console.log('Audience insights stored successfully for user:', userId)
  },

  async syncMetaData(userId: string): Promise<void> {
    console.log('Starting Meta data sync for user:', userId)
    try {
      // Check if a Meta token already exists for this user
      const { data: existingToken, error: tokenError } = await supabase
        .from('user_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('platform', 'meta')
        .single()

      // If no existing token, it's a first-time connection, so delete any dummy data
      // PGRST116 is the error code for "no rows found" from Supabase postgrest
      if (!existingToken && tokenError && tokenError.code === 'PGRST116') {
        console.log('First-time Meta connection for user:', userId, '. Deleting existing dummy insights.')
        const { error: deleteMetaError } = await supabase
          .from('user_audience_insights')
          .delete()
          .eq('user_id', userId)
          .eq('platform', 'meta_ads')
        if (deleteMetaError) {
          console.error('Error deleting old Meta Ads insights:', deleteMetaError)
          throw deleteMetaError
        }
      } else if (tokenError) {
        // Handle other potential errors when checking for token
        console.error('Error checking for existing Meta token:', tokenError)
        throw tokenError
      }

      const adsInsights = await this.fetchMetaAdsAudienceInsights(userId)
      await this.storeAudienceInsights(userId, adsInsights)
      console.log('Meta data sync completed for user:', userId)
    } catch (error) {
      console.error('Error during Meta data sync for user:', userId, error)
      throw error
    }
  },
}
