/**
 * CUBE Nexum - AI Virtual Call Center Service
 * 
 * Enterprise-grade virtual call center service with AI agents
 * that compete with RingCentral, Aircall, Five9, and Zendesk Talk.
 * 
 * Features:
 * - Multi-channel conversation management
 * - AI-powered response generation with OpenAI/Claude
 * - Real-time sentiment analysis and emotion detection
 * - Smart routing and queue management
 * - Human handoff with context preservation
 * - Analytics and reporting
 */

import { invoke } from '@tauri-apps/api/core';
import {
  CallCenterConfig,
  Conversation,
  Message,
  AIAgent,
  Queue,
  Customer,
  ChannelType,
  ConversationStatus,
  MessageType,
  SentimentAnalysis,
  EmotionDetection,
  IntentDetection,
  CallCenterAnalytics,
  AnalyticsPeriod,
  Priority,
  AgentStatus,
  DEFAULT_CALL_CENTER_CONFIG,
} from '@/lib/types/call-center';

// =============================================================================
// CALL CENTER SERVICE CLASS
// =============================================================================

export class CallCenterService {
  private static instance: CallCenterService;
  private config: CallCenterConfig | null = null;
  private conversations: Map<string, Conversation> = new Map();
  private agents: Map<string, AIAgent> = new Map();
  private queues: Map<string, Queue> = new Map();
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private wsConnection: WebSocket | null = null;

  private constructor() {
    this.initializeEventListeners();
  }

  public static getInstance(): CallCenterService {
    if (!CallCenterService.instance) {
      CallCenterService.instance = new CallCenterService();
    }
    return CallCenterService.instance;
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  async initialize(organizationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await invoke<CallCenterConfig>('call_center_load_config', { organizationId });
      this.config = config;
      
      // Load agents
      for (const agent of config.agents) {
        this.agents.set(agent.id, agent);
      }
      
      // Load queues
      for (const queue of config.queues) {
        this.queues.set(queue.id, queue);
      }
      
      // Connect to real-time service
      await this.connectRealtime();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize call center' 
      };
    }
  }

  private async connectRealtime(): Promise<void> {
    // WebSocket connection for real-time updates
    const wsUrl = this.config?.integrations?.find(i => i.type === 'custom')?.config?.wsUrl as string;
    if (!wsUrl) return;

    this.wsConnection = new WebSocket(wsUrl);
    
    this.wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleRealtimeEvent(data);
    };

    this.wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.wsConnection.onclose = () => {
      // Reconnect after delay
      setTimeout(() => this.connectRealtime(), 5000);
    };
  }

  private handleRealtimeEvent(event: { type: string; data: unknown }): void {
    this.emit(event.type, event.data);

    switch (event.type) {
      case 'conversation.message':
        this.handleIncomingMessage(event.data as Message);
        break;
      case 'conversation.created':
        this.handleNewConversation(event.data as Conversation);
        break;
      case 'agent.status_changed':
        this.handleAgentStatusChange(event.data as { agentId: string; status: AgentStatus });
        break;
      default:
        break;
    }
  }

  private initializeEventListeners(): void {
    // Initialize listener sets for common events
    const events = [
      'conversation.created',
      'conversation.updated',
      'conversation.resolved',
      'message.received',
      'message.sent',
      'agent.assigned',
      'agent.status_changed',
      'queue.updated',
    ];
    
    events.forEach(event => {
      this.listeners.set(event, new Set());
    });
  }

  // ===========================================================================
  // EVENT HANDLING
  // ===========================================================================

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // ===========================================================================
  // CONVERSATION MANAGEMENT
  // ===========================================================================

  async getConversations(
    filters?: {
      channel?: ChannelType;
      status?: ConversationStatus;
      agentId?: string;
      queueId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    pagination?: { page: number; limit: number }
  ): Promise<{ conversations: Conversation[]; total: number }> {
    try {
      const result = await invoke<{ conversations: Conversation[]; total: number }>(
        'call_center_get_conversations',
        { filters, pagination }
      );
      
      // Update local cache
      result.conversations.forEach(conv => {
        this.conversations.set(conv.id, conv);
      });
      
      return result;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return { conversations: [], total: 0 };
    }
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    // Check cache first
    if (this.conversations.has(conversationId)) {
      return this.conversations.get(conversationId)!;
    }

    try {
      const conversation = await invoke<Conversation>('call_center_get_conversation', { conversationId });
      this.conversations.set(conversationId, conversation);
      return conversation;
    } catch {
      return null;
    }
  }

  async startConversation(
    channel: ChannelType,
    customer: Partial<Customer>,
    initialMessage?: string,
    context?: Record<string, unknown>
  ): Promise<Conversation | null> {
    try {
      const conversation = await invoke<Conversation>('call_center_start_conversation', {
        channel,
        customer,
        initialMessage,
        context,
      });
      
      this.conversations.set(conversation.id, conversation);
      this.emit('conversation.created', conversation);
      
      return conversation;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      return null;
    }
  }

  async updateConversationStatus(
    conversationId: string,
    status: ConversationStatus,
    resolution?: string
  ): Promise<boolean> {
    try {
      await invoke('call_center_update_conversation_status', {
        conversationId,
        status,
        resolution,
      });
      
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.status = status;
        this.emit('conversation.updated', conversation);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  async assignConversation(conversationId: string, agentId: string): Promise<boolean> {
    try {
      await invoke('call_center_assign_conversation', { conversationId, agentId });
      
      const conversation = this.conversations.get(conversationId);
      const agent = this.agents.get(agentId);
      
      if (conversation && agent) {
        conversation.agent = agent;
        this.emit('agent.assigned', { conversation, agent });
      }
      
      return true;
    } catch {
      return false;
    }
  }

  async escalateConversation(conversationId: string, reason: string): Promise<boolean> {
    try {
      await invoke('call_center_escalate_conversation', { conversationId, reason });
      
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.status = 'escalated';
        this.emit('conversation.updated', conversation);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // MESSAGE HANDLING
  // ===========================================================================

  async sendMessage(
    conversationId: string,
    content: string,
    type: MessageType = 'text',
    attachments?: File[],
    metadata?: Record<string, unknown>
  ): Promise<Message | null> {
    try {
      // Upload attachments first if any
      let uploadedAttachments: { url: string; filename: string; mimeType: string; size: number }[] = [];
      if (attachments && attachments.length > 0) {
        uploadedAttachments = await this.uploadAttachments(attachments);
      }

      const message = await invoke<Message>('call_center_send_message', {
        conversationId,
        content,
        type,
        attachments: uploadedAttachments,
        metadata,
      });
      
      // Update local conversation
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.messages.push(message);
        conversation.lastMessageAt = message.timestamp;
      }
      
      this.emit('message.sent', message);
      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }

  async generateAIResponse(
    conversationId: string,
    autoSend: boolean = false
  ): Promise<{ response: string; confidence: number; suggestions: string[] } | null> {
    try {
      const result = await invoke<{ response: string; confidence: number; suggestions: string[] }>(
        'call_center_generate_ai_response',
        { conversationId, autoSend }
      );
      
      if (autoSend) {
        // Message was auto-sent, update local state
        const conversation = this.conversations.get(conversationId);
        if (conversation) {
          const aiMessage: Message = {
            id: crypto.randomUUID(),
            conversationId,
            senderId: conversation.agent?.id || 'ai',
            senderType: 'agent',
            senderName: conversation.agent?.name || 'AI Assistant',
            type: 'text',
            content: result.response,
            attachments: [],
            status: 'sent',
            aiGenerated: true,
            aiConfidence: result.confidence,
            timestamp: new Date().toISOString(),
            metadata: {},
          };
          conversation.messages.push(aiMessage);
          this.emit('message.sent', aiMessage);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      return null;
    }
  }

  private async uploadAttachments(
    files: File[]
  ): Promise<{ url: string; filename: string; mimeType: string; size: number }[]> {
    const uploaded = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const result = await invoke<{ url: string }>('call_center_upload_attachment', {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });
        
        uploaded.push({
          url: result.url,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }
    
    return uploaded;
  }

  private handleIncomingMessage(message: Message): void {
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      conversation.messages.push(message);
      conversation.lastMessageAt = message.timestamp;
      conversation.unreadCount++;
      
      // Auto-generate AI response if enabled
      if (conversation.agent?.type === 'ai' && conversation.status === 'active') {
        this.generateAIResponse(message.conversationId, true);
      }
    }
    
    this.emit('message.received', message);
  }

  private handleNewConversation(conversation: Conversation): void {
    this.conversations.set(conversation.id, conversation);
    
    // Auto-assign to AI agent if queue has AI enabled
    if (conversation.queueId) {
      const queue = this.queues.get(conversation.queueId);
      if (queue?.aiAgentId) {
        this.assignConversation(conversation.id, queue.aiAgentId);
      }
    }
  }

  // ===========================================================================
  // SENTIMENT & EMOTION ANALYSIS
  // ===========================================================================

  async analyzeMessage(message: string): Promise<{
    sentiment: SentimentAnalysis;
    emotion: EmotionDetection;
    intent: IntentDetection;
  } | null> {
    try {
      return await invoke('call_center_analyze_message', { message });
    } catch {
      return null;
    }
  }

  async getConversationSentimentTrend(conversationId: string): Promise<{
    trend: { timestamp: string; sentiment: number }[];
    average: number;
    label: string;
  } | null> {
    try {
      return await invoke('call_center_sentiment_trend', { conversationId });
    } catch {
      return null;
    }
  }

  // ===========================================================================
  // AGENT MANAGEMENT
  // ===========================================================================

  async getAgents(filters?: {
    type?: 'ai' | 'human';
    status?: AgentStatus;
    channel?: ChannelType;
  }): Promise<AIAgent[]> {
    try {
      const agents = await invoke<AIAgent[]>('call_center_get_agents', { filters });
      agents.forEach(agent => this.agents.set(agent.id, agent));
      return agents;
    } catch {
      return [];
    }
  }

  async updateAgentStatus(agentId: string, status: AgentStatus): Promise<boolean> {
    try {
      await invoke('call_center_update_agent_status', { agentId, status });
      
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.status = status;
        this.emit('agent.status_changed', { agentId, status });
      }
      
      return true;
    } catch {
      return false;
    }
  }

  private handleAgentStatusChange(data: { agentId: string; status: AgentStatus }): void {
    const agent = this.agents.get(data.agentId);
    if (agent) {
      agent.status = data.status;
    }
  }

  async createAIAgent(config: Partial<AIAgent>): Promise<AIAgent | null> {
    try {
      const agent = await invoke<AIAgent>('call_center_create_ai_agent', { config });
      this.agents.set(agent.id, agent);
      return agent;
    } catch {
      return null;
    }
  }

  async updateAIAgent(agentId: string, updates: Partial<AIAgent>): Promise<boolean> {
    try {
      await invoke('call_center_update_ai_agent', { agentId, updates });
      
      const agent = this.agents.get(agentId);
      if (agent) {
        Object.assign(agent, updates);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // QUEUE MANAGEMENT
  // ===========================================================================

  async getQueues(): Promise<Queue[]> {
    try {
      const queues = await invoke<Queue[]>('call_center_get_queues');
      queues.forEach(queue => this.queues.set(queue.id, queue));
      return queues;
    } catch {
      return [];
    }
  }

  async createQueue(config: Partial<Queue>): Promise<Queue | null> {
    try {
      const queue = await invoke<Queue>('call_center_create_queue', { config });
      this.queues.set(queue.id, queue);
      return queue;
    } catch {
      return null;
    }
  }

  async updateQueue(queueId: string, updates: Partial<Queue>): Promise<boolean> {
    try {
      await invoke('call_center_update_queue', { queueId, updates });
      
      const queue = this.queues.get(queueId);
      if (queue) {
        Object.assign(queue, updates);
        this.emit('queue.updated', queue);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  async getQueueStats(queueId: string): Promise<{
    waiting: number;
    active: number;
    averageWaitTime: number;
    slaCompliance: number;
  } | null> {
    try {
      return await invoke('call_center_queue_stats', { queueId });
    } catch {
      return null;
    }
  }

  // ===========================================================================
  // VOICE CALLS (TWILIO INTEGRATION)
  // ===========================================================================

  async initiateCall(phoneNumber: string, agentId?: string): Promise<{
    callSid: string;
    status: string;
  } | null> {
    try {
      return await invoke('call_center_initiate_call', { phoneNumber, agentId });
    } catch {
      return null;
    }
  }

  async answerCall(callSid: string, agentId: string): Promise<boolean> {
    try {
      await invoke('call_center_answer_call', { callSid, agentId });
      return true;
    } catch {
      return false;
    }
  }

  async endCall(callSid: string): Promise<boolean> {
    try {
      await invoke('call_center_end_call', { callSid });
      return true;
    } catch {
      return false;
    }
  }

  async transferCall(callSid: string, targetAgentId: string): Promise<boolean> {
    try {
      await invoke('call_center_transfer_call', { callSid, targetAgentId });
      return true;
    } catch {
      return false;
    }
  }

  async getCallTranscription(callSid: string): Promise<{
    transcript: string;
    segments: { speaker: string; text: string; timestamp: number }[];
  } | null> {
    try {
      return await invoke('call_center_call_transcription', { callSid });
    } catch {
      return null;
    }
  }

  // ===========================================================================
  // WHATSAPP INTEGRATION
  // ===========================================================================

  async sendWhatsAppTemplate(
    to: string,
    templateName: string,
    templateParams: Record<string, string>,
    language: string = 'en'
  ): Promise<{ messageId: string } | null> {
    try {
      return await invoke('call_center_send_whatsapp_template', {
        to,
        templateName,
        templateParams,
        language,
      });
    } catch {
      return null;
    }
  }

  async getWhatsAppTemplates(): Promise<{
    name: string;
    language: string;
    status: string;
    category: string;
    components: unknown[];
  }[]> {
    try {
      return await invoke('call_center_get_whatsapp_templates');
    } catch {
      return [];
    }
  }

  // ===========================================================================
  // ANALYTICS
  // ===========================================================================

  async getAnalytics(
    period: AnalyticsPeriod,
    startDate?: string,
    endDate?: string
  ): Promise<CallCenterAnalytics | null> {
    try {
      return await invoke('call_center_get_analytics', { period, startDate, endDate });
    } catch {
      return null;
    }
  }

  async getAgentPerformance(
    agentId: string,
    period: AnalyticsPeriod
  ): Promise<{
    conversations: number;
    resolutionRate: number;
    averageHandleTime: number;
    customerSatisfaction: number;
    sentimentScore: number;
  } | null> {
    try {
      return await invoke('call_center_agent_performance', { agentId, period });
    } catch {
      return null;
    }
  }

  async getRealtimeDashboard(): Promise<{
    activeConversations: number;
    waitingInQueue: number;
    onlineAgents: number;
    averageWaitTime: number;
    currentSentiment: number;
  } | null> {
    try {
      return await invoke('call_center_realtime_dashboard');
    } catch {
      return null;
    }
  }

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  async getConfig(): Promise<CallCenterConfig | null> {
    return this.config;
  }

  async updateConfig(updates: Partial<CallCenterConfig>): Promise<boolean> {
    try {
      await invoke('call_center_update_config', { updates });
      
      if (this.config) {
        Object.assign(this.config, updates);
      }
      
      return true;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // KNOWLEDGE BASE
  // ===========================================================================

  async searchKnowledgeBase(query: string, limit: number = 5): Promise<{
    id: string;
    title: string;
    content: string;
    relevance: number;
  }[]> {
    try {
      return await invoke('call_center_search_knowledge', { query, limit });
    } catch {
      return [];
    }
  }

  async getSuggestedResponses(conversationId: string): Promise<{
    response: string;
    confidence: number;
    source: 'ai' | 'knowledge_base' | 'template';
  }[]> {
    try {
      return await invoke('call_center_suggested_responses', { conversationId });
    } catch {
      return [];
    }
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    
    this.conversations.clear();
    this.agents.clear();
    this.queues.clear();
    this.listeners.clear();
  }
}

// =============================================================================
// REACT HOOKS
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';

const service = CallCenterService.getInstance();

export function useCallCenter() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async (organizationId: string) => {
    setLoading(true);
    setError(null);
    
    const result = await service.initialize(organizationId);
    
    if (result.success) {
      setInitialized(true);
    } else {
      setError(result.error || 'Failed to initialize');
    }
    
    setLoading(false);
  }, []);

  return {
    service,
    initialized,
    loading,
    error,
    initialize,
  };
}

export function useConversations(filters?: {
  channel?: ChannelType;
  status?: ConversationStatus;
  agentId?: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await service.getConversations(filters);
    setConversations(result.conversations);
    setTotal(result.total);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    refresh();

    const unsubscribeCreated = service.on('conversation.created', (conv) => {
      setConversations(prev => [conv as Conversation, ...prev]);
      setTotal(prev => prev + 1);
    });

    const unsubscribeUpdated = service.on('conversation.updated', (conv) => {
      setConversations(prev => 
        prev.map(c => c.id === (conv as Conversation).id ? conv as Conversation : c)
      );
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [refresh]);

  return { conversations, loading, total, refresh };
}

export function useConversation(conversationId: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    service.getConversation(conversationId).then(conv => {
      setConversation(conv);
      setLoading(false);
    });

    const unsubscribeMessage = service.on('message.received', (message) => {
      if ((message as Message).conversationId === conversationId) {
        setConversation(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, message as Message],
            lastMessageAt: (message as Message).timestamp,
          };
        });
      }
    });

    return () => {
      unsubscribeMessage();
    };
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string, type: MessageType = 'text') => {
    if (!conversationId) return null;
    return service.sendMessage(conversationId, content, type);
  }, [conversationId]);

  const generateResponse = useCallback(async (autoSend: boolean = false) => {
    if (!conversationId) return null;
    return service.generateAIResponse(conversationId, autoSend);
  }, [conversationId]);

  return {
    conversation,
    loading,
    sendMessage,
    generateResponse,
  };
}

export function useAgents(filters?: { type?: 'ai' | 'human'; status?: AgentStatus }) {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    service.getAgents(filters).then(result => {
      setAgents(result);
      setLoading(false);
    });

    const unsubscribe = service.on('agent.status_changed', (data) => {
      const { agentId, status } = data as { agentId: string; status: AgentStatus };
      setAgents(prev => 
        prev.map(a => a.id === agentId ? { ...a, status } : a)
      );
    });

    return unsubscribe;
  }, [filters]);

  return { agents, loading };
}

export function useRealtimeDashboard() {
  const [stats, setStats] = useState<{
    activeConversations: number;
    waitingInQueue: number;
    onlineAgents: number;
    averageWaitTime: number;
    currentSentiment: number;
  } | null>(null);

  useEffect(() => {
    const refresh = async () => {
      const result = await service.getRealtimeDashboard();
      setStats(result);
    };

    refresh();
    const interval = setInterval(refresh, 10000); // Refresh every 10s

    return () => clearInterval(interval);
  }, []);

  return stats;
}

// =============================================================================
// EXPORTS
// =============================================================================

// CallCenterService is already exported at class declaration (line 41)
export default CallCenterService.getInstance();
