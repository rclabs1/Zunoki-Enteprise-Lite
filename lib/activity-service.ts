import { getSupabaseAuthClient } from "./supabase/client";

interface ActivityDetails {
  [key: string]: any;
}

export const activityService = {
  async logActivity(
    userId: string,
    activityType: string,
    details?: ActivityDetails,
  ) {
    try {
      const supabase = getSupabaseAuthClient();
      
      // Set RLS context for the user before making database calls
      const { error: contextError } = await supabase.rpc('set_current_user_id', {
        user_id: userId
      });
      
      if (contextError) {
        console.error("Error setting user context:", contextError);
        return { success: false, error: contextError };
      }
      
      const { data, error } = await supabase.from("user_activities").insert({
        user_id: userId,
        action: activityType,
        details: details || {},
      });

      if (error) {
        console.error("Error logging activity:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error("Exception logging activity:", err);
      return { success: false, error: err };
    }
  },
};
