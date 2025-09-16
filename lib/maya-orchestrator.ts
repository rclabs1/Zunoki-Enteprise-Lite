import { supabase } from '@/lib/supabase/client';
import voiceService, { VoiceConfig, VoiceResponse } from './voice-service';
import messageClassifier from './message-classifier';
import { whatsappService } from './whatsapp-service';
import { teamManagementService } from './team-management-service';

export interface MayaSession {
  id: string;
  userId: string;
  conversationId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  mode: 'voice' | 'chat' | 'hybrid';
  status: 'active' | 'paused' | 'ended';
  language: string;
  voiceConfig: VoiceConfig;
  context: any;
  startedAt: Date;
  endedAt?: Date;
  totalDuration?: number;
  messageCount: number;
  voiceMessageCount: number;
}

export interface MayaCommand {
  type: 'voice_response' | 'text_response' | 'transfer_agent' | 'create_task' | 'schedule_callback' | 'end_session';
  payload: any;
  priority: 'high' | 'medium' | 'low';
  executeAt?: Date;
}

export interface MayaCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  config: any;
}

class MayaOrchestrator {
  private static instance: MayaOrchestrator;
  private activeSessions: Map<string, MayaSession> = new Map();
  private commandQueue: Map<string, MayaCommand[]> = new Map();

  static getInstance(): MayaOrchestrator {
    if (!MayaOrchestrator.instance) {
      MayaOrchestrator.instance = new MayaOrchestrator();
    }
    return MayaOrchestrator.instance;
  }

  // Initialize Maya session
  async initializeSession(
    userId: string,
    customerId: string,
    customerPhone: string,
    mode: MayaSession['mode'] = 'hybrid',
    voiceConfig?: Partial<VoiceConfig>
  ): Promise<MayaSession | null> {
    try {
      // Get customer info
      const { data: customer } = await supabase
        .from('customers')
        .select('name, language, metadata')
        .eq('id', customerId)
        .single();

      if (!customer) {
        throw new Error('Customer not found');
      }

      const defaultVoiceConfig: VoiceConfig = {
        provider: 'elevenlabs',
        language: customer.language || 'en-US',
        speed: 1.0,
        pitch: 1.0,
        stability: 0.5,
        similarity: 0.75,
        ...voiceConfig
      };

      // Create session
      const { data: sessionData, error } = await supabase
        .from('maya_sessions')
        .insert({
          user_id: userId,
          customer_id: customerId,
          customer_phone: customerPhone,
          mode,
          status: 'active',
          language: customer.language || 'en-US',
          voice_config: defaultVoiceConfig,
          context: customer.metadata || {},
          message_count: 0,
          voice_message_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      const session: MayaSession = {
        ...sessionData,
        userId: sessionData.user_id,
        conversationId: sessionData.conversation_id,
        customerId: sessionData.customer_id,
        customerName: customer.name || 'Customer',
        customerPhone: sessionData.customer_phone,
        voiceConfig: sessionData.voice_config,
        startedAt: new Date(sessionData.created_at),
        endedAt: sessionData.ended_at ? new Date(sessionData.ended_at) : undefined,
        totalDuration: sessionData.total_duration,
        messageCount: sessionData.message_count,
        voiceMessageCount: sessionData.voice_message_count
      };

      this.activeSessions.set(session.id, session);
      this.commandQueue.set(session.id, []);

      // Send welcome message based on mode
      await this.sendWelcomeMessage(session);

      return session;
    } catch (error) {
      console.error('Error initializing Maya session:', error);
      return null;
    }
  }

  // Process incoming message (voice or text)
  async processMessage(
    sessionId: string,
    content: string,
    type: 'voice' | 'text',
    audioData?: ArrayBuffer
  ): Promise<{ success: boolean; response?: any; commands?: MayaCommand[] }> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session || session.status !== 'active') {
        return { success: false };
      }

      // Classify the message
      const classification = await messageClassifier.classifyMessage(content, {
        customerHistory: session.context,
        conversationId: session.conversationId
      });

      // Determine response strategy based on classification and session mode
      const strategy = this.determineResponseStrategy(session, classification);
      
      // Generate appropriate response
      const response = await this.generateResponse(session, content, classification, strategy);
      
      // Create commands based on classification
      const commands = await this.generateCommands(session, classification, response);

      // Update session metrics
      await this.updateSessionMetrics(sessionId, type);

      // Execute high-priority commands immediately
      const immediateCommands = commands.filter(cmd => cmd.priority === 'high');
      for (const command of immediateCommands) {
        await this.executeCommand(sessionId, command);
      }

      // Queue other commands
      const queuedCommands = commands.filter(cmd => cmd.priority !== 'high');
      const existingQueue = this.commandQueue.get(sessionId) || [];
      this.commandQueue.set(sessionId, [...existingQueue, ...queuedCommands]);

      return {
        success: true,
        response,
        commands: immediateCommands
      };

    } catch (error) {
      console.error('Error processing Maya message:', error);
      return { success: false };
    }
  }

  // Determine response strategy based on session and classification
  private determineResponseStrategy(
    session: MayaSession,
    classification: any
  ): 'voice_only' | 'text_only' | 'voice_with_text' | 'escalate' {
    // High urgency or complex issues might need human escalation
    if (classification.urgency_score >= 8 || classification.intent === 'complaint') {
      return 'escalate';
    }

    // Voice-first mode preferences
    if (session.mode === 'voice') {
      return 'voice_only';
    }

    // Chat mode preferences
    if (session.mode === 'chat') {
      return 'text_only';
    }

    // Hybrid mode - use both voice and text for better understanding
    return 'voice_with_text';
  }

  // Generate response based on strategy
  private async generateResponse(
    session: MayaSession,
    content: string,
    classification: any,
    strategy: string
  ): Promise<any> {
    try {
      // Get context-aware prompt
      const systemPrompt = this.buildSystemPrompt(session, classification);

      // Generate text response using OpenAI
      const textResponse = await this.generateTextResponse(content, systemPrompt);

      const response: any = {
        text: textResponse,
        classification,
        strategy,
        timestamp: new Date().toISOString()
      };

      // Generate voice response if needed
      if (strategy === 'voice_only' || strategy === 'voice_with_text') {
        const voiceResult = await voiceService.generateSpeech(textResponse, session.voiceConfig);
        if (voiceResult.success) {
          response.voice = {
            audioUrl: voiceResult.audioUrl,
            duration: voiceResult.duration,
            provider: voiceResult.provider
          };
        }
      }

      return response;
    } catch (error) {
      console.error('Error generating response:', error);
      return {
        text: "I apologize, but I'm having trouble processing your request right now. Let me connect you with a human agent.",
        error: true
      };
    }
  }

  // Generate text response using AI
  private async generateTextResponse(content: string, systemPrompt: string): Promise<string> {
    try {
      const response = await fetch('/api/agents/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getCurrentUserToken()}`
        },
        body: JSON.stringify({
          message: content,
          agentConfig: {
            systemPrompt,
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 300
          }
        })
      });

      const data = await response.json();
      return data.response || "I'm here to help you with your inquiry.";
    } catch (error) {
      console.error('Error generating text response:', error);
      return "I'm here to assist you. How can I help?";
    }
  }

  // Build context-aware system prompt
  private buildSystemPrompt(session: MayaSession, classification: any): string {
    const basePrompt = `You are Agent Zunoki, a sophisticated AI assistant for WhatsApp customer service. You are currently helping ${session.customerName}.

Customer Context:
- Name: ${session.customerName}
- Phone: ${session.customerPhone}
- Language: ${session.language}
- Conversation Mode: ${session.mode}
- Previous Interactions: ${session.messageCount} messages

Current Message Analysis:
- Priority: ${classification.priority}
- Sentiment: ${classification.sentiment}
- Intent: ${classification.intent}
- Urgency Score: ${classification.urgency_score}/10

Guidelines:
1. Be conversational, empathetic, and helpful
2. Keep responses concise and actionable for ${session.mode} mode
3. Use the customer's preferred language: ${session.language}
4. Address their specific intent: ${classification.intent}
5. Match their emotional tone while staying professional
6. If urgency is high (8+), prioritize quick resolution or escalation

Remember: You're representing the brand through WhatsApp, so maintain a balance of being helpful, professional, and human-like.`;

    return basePrompt;
  }

  // Generate commands based on classification
  private async generateCommands(
    session: MayaSession,
    classification: any,
    response: any
  ): Promise<MayaCommand[]> {
    const commands: MayaCommand[] = [];

    // High urgency - escalate to human agent
    if (classification.urgency_score >= 8) {
      commands.push({
        type: 'transfer_agent',
        payload: {
          reason: 'High urgency issue',
          specialization: [classification.category],
          priority: 'high'
        },
        priority: 'high'
      });
    }

    // Create follow-up tasks for certain intents
    if (['order_inquiry', 'shipping_issue', 'product_support'].includes(classification.intent)) {
      commands.push({
        type: 'create_task',
        payload: {
          title: `Follow up on ${classification.intent}`,
          description: `Customer ${session.customerName} needs follow-up on: ${classification.intent}`,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          customerId: session.customerId
        },
        priority: 'medium'
      });
    }

    // Schedule callback for complex issues
    if (classification.urgency_score >= 6 && classification.category === 'support') {
      commands.push({
        type: 'schedule_callback',
        payload: {
          customerId: session.customerId,
          reason: 'Complex support issue follow-up',
          preferredTime: 'business_hours'
        },
        priority: 'medium'
      });
    }

    return commands;
  }

  // Execute command
  private async executeCommand(sessionId: string, command: MayaCommand): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) return false;

      switch (command.type) {
        case 'transfer_agent':
          return await this.transferToAgent(session, command.payload);
        
        case 'create_task':
          return await this.createTask(session, command.payload);
        
        case 'schedule_callback':
          return await this.scheduleCallback(session, command.payload);
        
        case 'voice_response':
          return await this.sendVoiceResponse(session, command.payload);
        
        case 'text_response':
          return await this.sendTextResponse(session, command.payload);
        
        case 'end_session':
          return await this.endSession(sessionId, command.payload);
        
        default:
          console.warn('Unknown command type:', command.type);
          return false;
      }
    } catch (error) {
      console.error('Error executing command:', error);
      return false;
    }
  }

  // Transfer to human agent
  private async transferToAgent(session: MayaSession, payload: any): Promise<boolean> {
    try {
      if (!session.conversationId) return false;

      const assignment = await teamManagementService.autoAssignConversation(
        session.conversationId,
        undefined,
        payload.specialization
      );

      if (assignment.success) {
        // Update session status
        await supabase
          .from('maya_sessions')
          .update({ status: 'paused' })
          .eq('id', session.id);

        session.status = 'paused';
        
        // Send transfer message
        await this.sendTextResponse(session, {
          message: `I'm connecting you with ${assignment.agentName} who can better assist you with this issue. They'll be with you shortly.`
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error transferring to agent:', error);
      return false;
    }
  }

  // Create task
  private async createTask(session: MayaSession, payload: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: session.userId,
          customer_id: session.customerId,
          title: payload.title,
          description: payload.description,
          due_date: payload.dueDate?.toISOString(),
          status: 'pending',
          priority: 'medium'
        });

      return !error;
    } catch (error) {
      console.error('Error creating task:', error);
      return false;
    }
  }

  // Schedule callback
  private async scheduleCallback(session: MayaSession, payload: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('callbacks')
        .insert({
          user_id: session.userId,
          customer_id: session.customerId,
          phone: session.customerPhone,
          reason: payload.reason,
          preferred_time: payload.preferredTime,
          status: 'scheduled'
        });

      return !error;
    } catch (error) {
      console.error('Error scheduling callback:', error);
      return false;
    }
  }

  // Send voice response
  private async sendVoiceResponse(session: MayaSession, payload: any): Promise<boolean> {
    try {
      const voiceResult = await voiceService.generateSpeech(payload.message, session.voiceConfig);
      
      if (voiceResult.success && voiceResult.audioUrl) {
        // Save voice message
        await voiceService.saveVoiceMessage(
          session.conversationId || session.id,
          voiceResult.audioUrl,
          payload.message,
          voiceResult.duration
        );

        // In a real implementation, you'd send the audio via WhatsApp
        // For now, we'll log it
        console.log('Voice response generated:', voiceResult.audioUrl);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending voice response:', error);
      return false;
    }
  }

  // Send text response
  private async sendTextResponse(session: MayaSession, payload: any): Promise<boolean> {
    try {
      if (session.conversationId) {
        // Send via WhatsApp service
        const result = await whatsappService.sendMessage({
          conversationId: session.conversationId,
          to: session.customerPhone,
          content: payload.message,
          fromAgentId: 'maya-ai',
          fromAgentName: 'Agent Zunoki'
        });

        return result.success;
      }

      return false;
    } catch (error) {
      console.error('Error sending text response:', error);
      return false;
    }
  }

  // End session
  async endSession(sessionId: string, reason?: string): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) return false;

      const endTime = new Date();
      const duration = endTime.getTime() - session.startedAt.getTime();

      // Update session in database
      const { error } = await supabase
        .from('maya_sessions')
        .update({
          status: 'ended',
          ended_at: endTime.toISOString(),
          total_duration: Math.floor(duration / 1000), // in seconds
          end_reason: reason
        })
        .eq('id', sessionId);

      if (!error) {
        // Remove from active sessions
        this.activeSessions.delete(sessionId);
        this.commandQueue.delete(sessionId);

        // Send farewell message
        await this.sendTextResponse(session, {
          message: "Thank you for using our service! If you need further assistance, feel free to reach out anytime. Have a great day! 😊"
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error ending session:', error);
      return false;
    }
  }

  // Send welcome message
  private async sendWelcomeMessage(session: MayaSession): Promise<void> {
    const welcomeMessage = `Hello ${session.customerName}! 👋 I'm Agent Zunoki, your AI assistant. I'm here to help you with any questions or concerns you might have. You can chat with me via text or voice - whatever works best for you!`;

    if (session.mode === 'voice' || session.mode === 'hybrid') {
      await this.sendVoiceResponse(session, { message: welcomeMessage });
    }

    if (session.mode === 'chat' || session.mode === 'hybrid') {
      await this.sendTextResponse(session, { message: welcomeMessage });
    }
  }

  // Update session metrics
  private async updateSessionMetrics(sessionId: string, messageType: 'voice' | 'text'): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) return;

      const updates: any = {
        message_count: session.messageCount + 1,
        updated_at: new Date().toISOString()
      };

      if (messageType === 'voice') {
        updates.voice_message_count = session.voiceMessageCount + 1;
        session.voiceMessageCount++;
      }

      session.messageCount++;

      await supabase
        .from('maya_sessions')
        .update(updates)
        .eq('id', sessionId);

    } catch (error) {
      console.error('Error updating session metrics:', error);
    }
  }

  // Get current user token (placeholder)
  private async getCurrentUserToken(): Promise<string> {
    // In a real implementation, you'd get this from your auth context
    return 'placeholder-token';
  }

  // Get session by ID
  getSession(sessionId: string): MayaSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  // Get all active sessions for user
  getActiveSessions(userId: string): MayaSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId);
  }

  // Process queued commands
  async processQueuedCommands(sessionId: string): Promise<void> {
    const commands = this.commandQueue.get(sessionId) || [];
    const now = new Date();

    const readyCommands = commands.filter(cmd => 
      !cmd.executeAt || cmd.executeAt <= now
    );

    for (const command of readyCommands) {
      await this.executeCommand(sessionId, command);
    }

    // Remove executed commands from queue
    const remainingCommands = commands.filter(cmd => 
      cmd.executeAt && cmd.executeAt > now
    );
    
    this.commandQueue.set(sessionId, remainingCommands);
  }
}

export const mayaOrchestrator = MayaOrchestrator.getInstance();
export default mayaOrchestrator;