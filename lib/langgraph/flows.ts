// lib/langgraph/flows.ts
// This file will define the LangGraph nodes and edge logic.
// It will manage long-term user context, human approval steps, scheduling, and parallel execution.

import { StateGraph, END } from "@langchain/langgraph";
import { initializeMayaAgent } from "../agents/mayaAgent";
import { AgentExecutor } from "langchain/agents";
import { SupabaseService } from "../supabase-campaign-service"; // Import SupabaseService

// Define the state of our graph
interface AgentState {
  userId: string; // User ID for multi-user isolation
  input: string;
  chat_history: Array<string>;
  // Additional state for human approval
  requiresHumanApproval: boolean;
  actionToApprove?: string; // Description of the action requiring approval
  approvalCallbackId?: string; // Unique ID for this approval request
  isApproved: boolean; // Flag set by external approval mechanism
  // State for tool execution
  toolOutput: any;
  agentOutcome?: any; // To store the output of the agent
  // Long-term context
  campaignHistory?: any[];
  lastAction?: string;
  preferences?: any;
}

// Node to fetch user context from Supabase
async function fetchUserContext(state: AgentState) {
  console.log("Fetching user context for user:", state.userId);
  const supabaseService = new SupabaseService(state.userId);
  try {
    const userContext = await supabaseService.getUserContext();
    if (userContext) {
      return {
        campaignHistory: userContext.campaign_history,
        preferences: userContext.preferences,
        lastAction: userContext.last_action,
      };
    }
  } catch (error) {
    console.error("Error fetching user context:", error);
  }
  return {}; // Return empty object if no context or error
}

// Agent node: Invokes the LangChain agent
async function callAgent(state: AgentState) {
  console.log("Calling agent with state:", state);
  const mayaAgent = await initializeMayaAgent(state.userId);
  const result = await mayaAgent.invoke({ input: state.input, chat_history: state.chat_history });

  // Update lastAction based on agent's output
  const newLastAction = `Agent processed: "${state.input}" and responded with: ${result.output}`;

  return { agentOutcome: result.output, toolOutput: result.output, lastAction: newLastAction };
}

// Node to save user context to Supabase
async function saveUserContext(state: AgentState) {
  console.log("Saving user context for user:", state.userId);
  const supabaseService = new SupabaseService(state.userId);
  try {
    await supabaseService.saveUserContext({
      campaign_history: state.campaignHistory,
      preferences: state.preferences,
      last_action: state.lastAction,
    });
    console.log("User context saved successfully.");
  } catch (error) {
    console.error("Error saving user context:", error);
  }
  return {}; // No state change from saving
}

// Human approval node: Sets state to require human approval and stores request persistently
async function requestHumanApproval(state: AgentState) {
  console.log("Requesting human approval for state:", state);
  const actionDescription = `User requested to: ${state.input}. This action requires approval.`;
  const callbackId = `approval_${Date.now()}_${state.userId}`; // Simple unique ID

  const supabaseService = new SupabaseService(state.userId);
  try {
    await supabaseService.createApprovalRequest(actionDescription, callbackId);
    console.log(`Approval request created with ID: ${callbackId}`);
  } catch (error) {
    console.error("Error creating approval request:", error);
  }

  return {
    requiresHumanApproval: true,
    actionToApprove: actionDescription,
    approvalCallbackId: callbackId,
    isApproved: false, // Reset approval status
  };
}

// Decision node: Decides the next step based on the state
function decideNextStep(state: AgentState) {
  console.log("Deciding next step with state:", state);

  // If human approval is required and not yet approved, check persistent status
  if (state.requiresHumanApproval && !state.isApproved) {
    // This part will be handled by the external re-invocation of the graph
    // with `isApproved: true` once the user approves.
    console.log("Human approval pending. Waiting for external approval.");
    return "requestHumanApproval"; // Stay in this node or transition to a 'pending' node
  }

  // If human approval was required and now approved, proceed with the agent
  if (state.requiresHumanApproval && state.isApproved) {
    console.log("Human approval granted. Proceeding with agent.");
    return "callAgent";
  }

  // Example condition for when to request human approval (e.g., sensitive actions)
  const sensitiveActionKeywords = ["pause", "delete", "reduce budget"];
  const inputLower = state.input.toLowerCase();
  const mightNeedApproval = sensitiveActionKeywords.some(keyword => inputLower.includes(keyword));

  if (mightNeedApproval) {
    return "requestHumanApproval";
  }

  // If agent has an outcome, it means it has either used a tool or provided a direct answer
  if (state.agentOutcome) {
    return END;
  }

  // Default to calling the agent if no specific condition is met
  return "callAgent";
}

// Build the graph
export function buildAgentGraph() {
  const workflow = new StateGraph<AgentState>()
    .addNode("fetchUserContext", fetchUserContext)
    .addNode("callAgent", callAgent)
    .addNode("saveUserContext", saveUserContext)
    .addNode("requestHumanApproval", requestHumanApproval);

  // Define edges
  workflow.addEdge("fetchUserContext", "decideNextStep"); // After fetching context, decide next step
  workflow.addEdge("callAgent", "saveUserContext"); // After agent, save context
  workflow.addEdge("saveUserContext", END); // After saving, end for now
  workflow.addEdge("requestHumanApproval", END); // Temporarily ends, waiting for external approval

  // Set the entry point to fetch user context
  workflow.setEntryPoint("fetchUserContext");

  // Define conditional edges for internal decisions (from decideNextStep)
  workflow.addConditionalEdges(
    "decideNextStep",
    decideNextStep,
    {
      callAgent: "callAgent",
      requestHumanApproval: "requestHumanApproval",
      END: END,
    }
  );

  const app = workflow.compile();
  return app;
}