import { supabase } from "./supabase-campaign-service";

export const userService = {
  async getUsers() {
    const { data, error } = await supabase.from("user_profiles").select("*");
    if (error) throw error;
    return data;
  },

  async updateUserRole(userId: string, role: string) {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({ role })
      .eq("user_id", userId)
      .select();
    if (error) throw error;
    return data;
  },
};
