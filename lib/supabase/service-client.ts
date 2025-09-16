import { createClient } from '@supabase/supabase-js';
import { getSupabaseAuthClient } from './client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

// Service role client - fallback to regular client if service key not available
export const supabaseServiceRole = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-application-name': 'admolabs-messaging-service',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : getSupabaseAuthClient(); // Fallback to regular authenticated client

// Helper function to set user context for RLS isolation
export async function setUserContext(userId: string) {
  try {
    await supabaseServiceRole.rpc('set_current_user_id', { user_id: userId });
    console.log('User context set for:', userId);
  } catch (error) {
    console.error('Failed to set user context:', error);
    throw new Error('Unable to set user context for database operations');
  }
}

export default supabaseServiceRole;