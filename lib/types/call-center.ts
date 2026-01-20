/**
 * CUBE Nexum - AI Virtual Call Center Types
 * 
 * Complete type definitions for AI-powered virtual call center
 * competing with RingCentral, Aircall, and similar solutions.
 * 
 * Features:
 * - Multi-channel support (Voice, WhatsApp, SMS, Social Media, Web Chat)
 * - AI agents with human-like conversation capabilities
 * - Emotion detection and sentiment analysis
 * - Natural language understanding with OpenAI/Claude
 * - Real-time transcription and translation
 * - Intelligent call routing and queuing
 * - CRM integration
 */

// =============================================================================
// CHANNEL TYPES
// =============================================================================

export type ChannelType = 
  | 'voice'           // Traditional phone calls via Twilio
  | 'sms'             // SMS messages via Twilio
  | 'whatsapp'        // WhatsApp Business API
  | 'webchat'         // Website live chat widget
  | 'email'           // Email-to-ticket
  | 'facebook'        // Facebook Messenger
  | 'instagram'       // Instagram DMs
  | 'twitter'         // Twitter DMs
  | 'telegram'        // Telegram Bot
  | 'slack'           // Slack integration
  | 'teams'           // Microsoft Teams
  | 'video';          // Video calls

export type ChannelStatus = 'online' | 'offline' | 'busy' | 'maintenance';

export interface ChannelConfig {
  id: string;
  type: ChannelType;
  name: string;
  enabled: boolean;
  status: ChannelStatus;
  credentials: ChannelCredentials;
  settings: ChannelSettings;
  aiEnabled: boolean;
  humanFallbackEnabled: boolean;
  workingHours?: WorkingHours;
  greeting?: string;
  farewell?: string;
}

export interface ChannelCredentials {
  // Twilio
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  // WhatsApp Business API
  whatsappBusinessId?: string;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  // Facebook/Instagram
  facebookPageId?: string;
  facebookAccessToken?: string;
  // Generic OAuth
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  // API Keys
  apiKey?: string;
  webhookSecret?: string;
}

export interface ChannelSettings {
  maxConcurrentConversations: number;
  autoResponderDelay: number;    // ms before AI responds
  humanTakeoverKeywords: string[];
  language: string;
  timezone: string;
  recordCalls: boolean;
  transcribeCalls: boolean;
  sentimentAnalysis: boolean;
}

export interface WorkingHours {
  enabled: boolean;
  timezone: string;
  schedule: WeeklySchedule;
  holidayCalendar: Holiday[];
  outsideHoursMessage: string;
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  shifts: TimeRange[];
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface Holiday {
  date: string;    // YYYY-MM-DD
  name: string;
  message?: string;
}

// =============================================================================
// AI AGENT TYPES
// =============================================================================

export type AgentType = 'ai' | 'human' | 'hybrid';
export type AgentStatus = 'available' | 'busy' | 'away' | 'offline' | 'dnd';
export type AIPersonality = 'professional' | 'friendly' | 'casual' | 'formal' | 'empathetic' | 'technical';

export interface AIAgent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  avatar?: string;
  
  // AI Configuration
  aiConfig: AIAgentConfig;
  
  // Skills & Knowledge
  skills: AgentSkill[];
  knowledgeBase: string[];      // IDs of knowledge base articles
  
  // Performance
  metrics: AgentMetrics;
  
  // Assignment
  assignedChannels: ChannelType[];
  assignedQueues: string[];
  maxConcurrentChats: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface AIAgentConfig {
  enabled: boolean;
  provider: 'openai' | 'anthropic' | 'google' | 'azure';
  model: string;                // gpt-4-turbo, claude-3-opus, etc.
  
  // Personality
  personality: AIPersonality;
  customPersonality?: string;   // Custom system prompt
  
  // Voice Settings (for phone calls)
  voice: VoiceConfig;
  
  // Behavior
  temperature: number;          // 0.0 - 1.0
  maxTokens: number;
  responseDelay: number;        // ms to simulate "typing"
  typingIndicator: boolean;
  
  // Emotion & Sentiment
  emotionDetection: boolean;
  sentimentAdjustment: boolean; // Adjust tone based on sentiment
  
  // Escalation
  escalationThreshold: number;  // Sentiment score to escalate
  escalationKeywords: string[];
  autoEscalateOnRequest: boolean;
  
  // Language
  primaryLanguage: string;
  supportedLanguages: string[];
  autoDetectLanguage: boolean;
  autoTranslate: boolean;
  
  // Safety
  contentFiltering: boolean;
  sensitiveTopicHandling: 'escalate' | 'decline' | 'redirect';
  maxConversationLength: number; // Auto-close after N messages
}

export interface VoiceConfig {
  enabled: boolean;
  provider: 'twilio' | 'elevenlabs' | 'azure' | 'google';
  voiceId: string;
  
  // Voice Characteristics
  speed: number;      // 0.5 - 2.0
  pitch: number;      // 0.5 - 2.0
  stability: number;  // 0.0 - 1.0 (ElevenLabs)
  
  // Phone Settings
  ringTimeout: number;        // seconds
  voicemailEnabled: boolean;
  voicemailGreeting?: string;
  callRecording: boolean;
  realTimeTranscription: boolean;
}

export interface AgentSkill {
  id: string;
  name: string;
  category: string;
  proficiencyLevel: number;  // 1-5
  description: string;
}

export interface AgentMetrics {
  totalConversations: number;
  resolvedConversations: number;
  escalatedConversations: number;
  averageResponseTime: number;      // ms
  averageHandleTime: number;        // ms
  customerSatisfaction: number;     // 1-5
  sentimentScore: number;           // -1 to 1
  firstContactResolution: number;   // percentage
  conversionsGenerated: number;
  revenueGenerated: number;
}

// =============================================================================
// CONVERSATION TYPES
// =============================================================================

export type ConversationStatus = 
  | 'waiting'       // In queue
  | 'active'        // Ongoing conversation
  | 'on_hold'       // Customer on hold
  | 'transferred'   // Being transferred
  | 'escalated'     // Escalated to human
  | 'resolved'      // Successfully closed
  | 'abandoned'     // Customer left
  | 'spam';         // Marked as spam

export type MessageType = 
  | 'text'
  | 'image'
  | 'file'
  | 'audio'
  | 'video'
  | 'location'
  | 'contact'
  | 'sticker'
  | 'template'      // WhatsApp templates
  | 'interactive'   // Buttons, lists
  | 'system';       // System messages

export interface Conversation {
  id: string;
  channel: ChannelType;
  channelId: string;          // External channel conversation ID
  
  // Participants
  customer: Customer;
  agent: AIAgent | null;
  previousAgents: string[];   // Agent IDs who handled this
  
  // Status
  status: ConversationStatus;
  priority: Priority;
  tags: string[];
  labels: string[];
  
  // Queue Info
  queueId: string | null;
  queuePosition: number | null;
  waitTime: number;           // ms
  
  // Messages
  messages: Message[];
  unreadCount: number;
  
  // Context
  context: ConversationContext;
  
  // CRM Integration
  crmContactId?: string;
  crmTicketId?: string;
  crmDealId?: string;
  
  // Analysis
  sentiment: SentimentAnalysis;
  intent: IntentDetection;
  summary?: string;
  
  // Timestamps
  startedAt: string;
  lastMessageAt: string;
  resolvedAt?: string;
  
  // Metadata
  metadata: Record<string, unknown>;
}

export interface Customer {
  id: string;
  externalId?: string;        // WhatsApp number, email, etc.
  
  // Identity
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  
  // Profile
  language: string;
  timezone?: string;
  location?: CustomerLocation;
  
  // History
  totalConversations: number;
  averageSentiment: number;
  lastContactAt?: string;
  
  // CRM Link
  crmId?: string;
  
  // Custom Fields
  customFields: Record<string, unknown>;
}

export interface CustomerLocation {
  country?: string;
  city?: string;
  region?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  
  // Sender
  senderId: string;
  senderType: 'customer' | 'agent' | 'system';
  senderName: string;
  
  // Content
  type: MessageType;
  content: string;
  attachments: Attachment[];
  
  // Interactive Elements
  buttons?: MessageButton[];
  quickReplies?: QuickReply[];
  
  // Delivery
  status: MessageStatus;
  deliveredAt?: string;
  readAt?: string;
  
  // AI Generation
  aiGenerated: boolean;
  aiConfidence?: number;
  aiSuggestions?: string[];
  
  // Analysis
  sentiment?: number;          // -1 to 1
  emotion?: EmotionDetection;
  intent?: string;
  entities?: ExtractedEntity[];
  
  // Metadata
  timestamp: string;
  editedAt?: string;
  deletedAt?: string;
  metadata: Record<string, unknown>;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  thumbnail?: string;
}

export interface MessageButton {
  id: string;
  type: 'reply' | 'url' | 'call' | 'postback';
  text: string;
  value: string;
}

export interface QuickReply {
  id: string;
  text: string;
  payload: string;
  imageUrl?: string;
}

// =============================================================================
// ANALYSIS TYPES
// =============================================================================

export interface SentimentAnalysis {
  score: number;              // -1 to 1
  magnitude: number;          // 0 to 1
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface EmotionDetection {
  primary: Emotion;
  secondary?: Emotion;
  confidence: number;
}

export type Emotion = 
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'surprised'
  | 'disgusted'
  | 'neutral'
  | 'frustrated'
  | 'confused'
  | 'excited'
  | 'grateful'
  | 'anxious';

export interface IntentDetection {
  primary: string;
  confidence: number;
  alternatives: IntentAlternative[];
}

export interface IntentAlternative {
  intent: string;
  confidence: number;
}

export interface ExtractedEntity {
  type: string;               // person, organization, date, money, etc.
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface ConversationContext {
  // Customer Journey
  pageUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  
  // Device Info
  device?: string;
  os?: string;
  browser?: string;
  
  // Previous Interactions
  previousTickets: string[];
  purchaseHistory: string[];
  
  // Custom Context
  variables: Record<string, unknown>;
}

// =============================================================================
// QUEUE TYPES
// =============================================================================

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface Queue {
  id: string;
  name: string;
  description: string;
  
  // Routing
  channels: ChannelType[];
  routingStrategy: RoutingStrategy;
  skillRequirements: SkillRequirement[];
  
  // Assignment
  assignedAgents: string[];
  aiAgentId?: string;         // Primary AI agent for this queue
  
  // SLA
  sla: QueueSLA;
  
  // Overflow
  overflowQueueId?: string;
  maxWaitTime: number;        // ms before overflow
  
  // Working Hours
  workingHours?: WorkingHours;
  
  // Status
  status: 'active' | 'paused' | 'closed';
  currentSize: number;
  averageWaitTime: number;
  
  // Metrics
  metrics: QueueMetrics;
  
  createdAt: string;
  updatedAt: string;
}

export type RoutingStrategy = 
  | 'round_robin'       // Equal distribution
  | 'least_busy'        // Agent with fewest active chats
  | 'skill_based'       // Best skill match
  | 'priority_based'    // VIP customers first
  | 'ai_first'          // Try AI, then human
  | 'hybrid';           // AI + Human collaboration

export interface SkillRequirement {
  skillId: string;
  minimumLevel: number;
  required: boolean;
}

export interface QueueSLA {
  firstResponseTime: number;  // ms
  resolutionTime: number;     // ms
  warningThreshold: number;   // percentage of SLA time
}

export interface QueueMetrics {
  totalConversations: number;
  activeConversations: number;
  waitingConversations: number;
  averageWaitTime: number;
  averageHandleTime: number;
  slaCompliance: number;      // percentage
  abandonmentRate: number;    // percentage
  customerSatisfaction: number;
}

// =============================================================================
// CALL CENTER CONFIG
// =============================================================================

export interface CallCenterConfig {
  id: string;
  name: string;
  organizationId: string;
  
  // General Settings
  defaultLanguage: string;
  supportedLanguages: string[];
  timezone: string;
  
  // AI Settings
  aiSettings: CallCenterAISettings;
  
  // Channels
  channels: ChannelConfig[];
  
  // Queues
  queues: Queue[];
  
  // Agents
  agents: AIAgent[];
  
  // Knowledge Base
  knowledgeBaseId?: string;
  
  // Integrations
  integrations: Integration[];
  
  // Webhooks
  webhooks: Webhook[];
  
  // Branding
  branding: CallCenterBranding;
  
  createdAt: string;
  updatedAt: string;
}

export interface CallCenterAISettings {
  enabled: boolean;
  defaultProvider: 'openai' | 'anthropic' | 'google' | 'azure';
  defaultModel: string;
  
  // Behavior
  responseStyle: 'concise' | 'detailed' | 'conversational';
  maxResponseLength: number;
  
  // Handoff
  humanHandoffEnabled: boolean;
  handoffTriggers: string[];
  
  // Learning
  feedbackLearningEnabled: boolean;
  conversationAnalysis: boolean;
  
  // Safety
  contentModeration: boolean;
  piiRedaction: boolean;
  
  // Cost Management
  maxTokensPerDay: number;
  budgetAlertThreshold: number;
}

export interface Integration {
  id: string;
  type: 'crm' | 'helpdesk' | 'analytics' | 'calendar' | 'payment' | 'custom';
  provider: string;           // salesforce, hubspot, zendesk, etc.
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  credentials: Record<string, string>;
  syncSettings: SyncSettings;
}

export interface SyncSettings {
  syncContacts: boolean;
  syncConversations: boolean;
  syncTickets: boolean;
  syncInterval: number;       // minutes
  lastSyncAt?: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  enabled: boolean;
  retries: number;
  timeoutMs: number;
}

export type WebhookEvent = 
  | 'conversation.created'
  | 'conversation.updated'
  | 'conversation.resolved'
  | 'message.received'
  | 'message.sent'
  | 'agent.assigned'
  | 'customer.created'
  | 'sla.warning'
  | 'sla.breach';

export interface CallCenterBranding {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily?: string;
  chatWidgetTitle: string;
  chatWidgetSubtitle: string;
  welcomeMessage: string;
  offlineMessage: string;
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

export interface CallCenterAnalytics {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  
  // Overview
  overview: AnalyticsOverview;
  
  // Channel Performance
  channelMetrics: Record<ChannelType, ChannelMetrics>;
  
  // Agent Performance
  agentMetrics: AgentPerformanceMetrics[];
  
  // Queue Performance
  queueMetrics: QueuePerformanceMetrics[];
  
  // Conversation Analysis
  sentimentDistribution: SentimentDistribution;
  topIntents: IntentCount[];
  topTopics: TopicCount[];
  
  // Time Analysis
  hourlyVolume: HourlyVolume[];
  dailyVolume: DailyVolume[];
  
  // SLA & Quality
  slaMetrics: SLAMetrics;
  qualityMetrics: QualityMetrics;
}

export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface AnalyticsOverview {
  totalConversations: number;
  totalMessages: number;
  uniqueCustomers: number;
  
  // Resolution
  resolvedConversations: number;
  escalatedConversations: number;
  abandonedConversations: number;
  
  // Response Times
  averageFirstResponseTime: number;
  averageHandleTime: number;
  averageWaitTime: number;
  
  // AI Performance
  aiHandledConversations: number;
  aiResolutionRate: number;
  aiAccuracyScore: number;
  
  // Customer Satisfaction
  csat: number;                // 1-5
  nps: number;                 // -100 to 100
  sentiment: number;           // -1 to 1
  
  // Business Impact
  conversions: number;
  revenue: number;
  costSavings: number;
}

export interface ChannelMetrics {
  channel: ChannelType;
  conversations: number;
  messages: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  aiResolutionRate: number;
}

export interface AgentPerformanceMetrics {
  agentId: string;
  agentName: string;
  agentType: AgentType;
  conversations: number;
  messagesHandled: number;
  averageResponseTime: number;
  averageHandleTime: number;
  customerSatisfaction: number;
  resolutionRate: number;
}

export interface QueuePerformanceMetrics {
  queueId: string;
  queueName: string;
  conversations: number;
  averageWaitTime: number;
  slaCompliance: number;
  abandonmentRate: number;
}

export interface SentimentDistribution {
  veryNegative: number;
  negative: number;
  neutral: number;
  positive: number;
  veryPositive: number;
}

export interface IntentCount {
  intent: string;
  count: number;
  percentage: number;
}

export interface TopicCount {
  topic: string;
  count: number;
  sentiment: number;
}

export interface HourlyVolume {
  hour: number;               // 0-23
  conversations: number;
  messages: number;
}

export interface DailyVolume {
  date: string;
  conversations: number;
  messages: number;
  uniqueCustomers: number;
}

export interface SLAMetrics {
  firstResponseCompliance: number;
  resolutionCompliance: number;
  averageResponseTime: number;
  slaBreaches: number;
}

export interface QualityMetrics {
  qualityScore: number;       // 0-100
  accuracyRate: number;       // AI response accuracy
  relevanceScore: number;     // Response relevance
  completenessScore: number;  // Issue resolution completeness
}

// =============================================================================
// EXPORTS
// =============================================================================

export const DEFAULT_CALL_CENTER_CONFIG: Partial<CallCenterConfig> = {
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'pt', 'fr', 'de'],
  timezone: 'UTC',
  aiSettings: {
    enabled: true,
    defaultProvider: 'openai',
    defaultModel: 'gpt-4-turbo',
    responseStyle: 'conversational',
    maxResponseLength: 500,
    humanHandoffEnabled: true,
    handoffTriggers: ['speak to human', 'agent please', 'real person', 'supervisor'],
    feedbackLearningEnabled: true,
    conversationAnalysis: true,
    contentModeration: true,
    piiRedaction: true,
    maxTokensPerDay: 100000,
    budgetAlertThreshold: 80,
  },
  branding: {
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    chatWidgetTitle: 'How can we help?',
    chatWidgetSubtitle: 'We typically reply within minutes',
    welcomeMessage: 'Hello! How can I assist you today?',
    offlineMessage: 'We\'re currently offline. Leave a message and we\'ll get back to you.',
  },
};
