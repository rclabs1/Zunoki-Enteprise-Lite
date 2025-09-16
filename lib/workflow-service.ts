import { supabase } from "./supabase/client";
import { auth } from "./firebase";

interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  trigger_type: 'schedule' | 'performance' | 'webhook' | 'manual';
  schedule_details?: any;
  performance_thresholds?: any;
  last_run_at?: string;
  execution_count?: number;
  created_at: string;
  updated_at: string;
}

const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
};

export const workflowService = {
  async getWorkflows(): Promise<Workflow[]> {
    const userId = getCurrentUserId();
    
    const { data, error } = await supabase
      .from("user_workflows")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Workflow[];
  },

  async createWorkflow(workflowData: Omit<Workflow, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Workflow> {
    const userId = getCurrentUserId();
    
    const { data, error } = await supabase
      .from("user_workflows")
      .insert({
        ...workflowData,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Workflow;
  },

  async updateWorkflow(workflowId: string, updates: Partial<Omit<Workflow, 'id' | 'user_id' | 'created_at'>>): Promise<Workflow> {
    const userId = getCurrentUserId();
    
    const { data, error } = await supabase
      .from("user_workflows")
      .update(updates)
      .eq("id", workflowId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as Workflow;
  },

  async deleteWorkflow(workflowId: string): Promise<void> {
    const userId = getCurrentUserId();
    
    const { error } = await supabase
      .from("user_workflows")
      .delete()
      .eq("id", workflowId)
      .eq("user_id", userId);

    if (error) throw error;
  },
};
