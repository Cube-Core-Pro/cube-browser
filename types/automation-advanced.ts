/**
 * Advanced Automation Types - CUBE Elite v6
 * Características avanzadas inspiradas en n8n, Zapier, Axiom
 */

// ============================================================================
// LANGCHAIN INTEGRATION TYPES
// ============================================================================

export interface LangChainNode {
  id: string;
  type: 'langchain';
  subType: LangChainNodeType;
  position: { x: number; y: number };
  data: LangChainNodeData;
}

export type LangChainNodeType =
  | 'llm'           // Language Model (GPT-4, Claude, etc.)
  | 'prompt'        // Prompt Template
  | 'chain'         // Chain (Sequential, Router, etc.)
  | 'memory'        // Conversation Memory
  | 'retriever'     // Vector Store Retriever
  | 'agent'         // AI Agent
  | 'tool'          // Custom Tool
  | 'parser'        // Output Parser
  | 'embeddings'    // Text Embeddings
  | 'splitter';     // Text Splitter

export interface LangChainNodeData {
  label: string;
  description?: string;
  config: LangChainConfig;
  status?: 'idle' | 'running' | 'success' | 'error';
  output?: unknown;
}

export interface LangChainConfig {
  // LLM Config
  llm?: {
    provider?: 'openai' | 'anthropic' | 'google' | 'azure' | 'ollama' | 'custom';
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    systemPrompt?: string;
    streaming?: boolean;
  };

  // Prompt Config
  prompt?: {
    template?: string;
    inputVariables?: string[];
    partialVariables?: Record<string, string>;
    outputParser?: 'json' | 'list' | 'markdown' | 'structured';
  };

  // Chain Config
  chain?: {
    type?: 'sequential' | 'router' | 'map_reduce' | 'refine' | 'stuff';
    steps?: string[]; // Node IDs
    routingFunction?: string;
  };

  // Memory Config
  memory?: {
    type?: 'buffer' | 'summary' | 'entity' | 'conversation' | 'vector';
    k?: number; // Number of messages to keep
    returnMessages?: boolean;
    humanPrefix?: string;
    aiPrefix?: string;
  };

  // Retriever Config
  retriever?: {
    vectorStore?: 'pinecone' | 'chroma' | 'weaviate' | 'supabase' | 'local';
    searchType?: 'similarity' | 'mmr' | 'threshold';
    k?: number;
    scoreThreshold?: number;
  };

  // Agent Config
  agent?: {
    type?: 'zero_shot' | 'react' | 'structured' | 'openai_functions' | 'plan_execute';
    tools?: string[]; // Tool IDs
    maxIterations?: number;
    returnIntermediateSteps?: boolean;
  };

  // Tool Config
  tool?: {
    name?: string;
    description?: string;
    schema?: Record<string, unknown>;
    function?: string; // JavaScript code
  };

  // Parser Config
  parser?: {
    type?: 'json' | 'list' | 'regex' | 'structured' | 'enum';
    schema?: Record<string, unknown>;
    regex?: string;
    enumValues?: string[];
  };

  // Embeddings Config
  embeddings?: {
    provider?: 'openai' | 'cohere' | 'huggingface' | 'local';
    model?: string;
    dimensions?: number;
  };

  // Splitter Config
  splitter?: {
    type?: 'character' | 'token' | 'recursive' | 'markdown' | 'code';
    chunkSize?: number;
    chunkOverlap?: number;
    separators?: string[];
    language?: string;
  };
}

// ============================================================================
// CODE NODE TYPES (JavaScript/Python)
// ============================================================================

export interface CodeNode {
  id: string;
  type: 'code';
  language: 'javascript' | 'python' | 'typescript';
  position: { x: number; y: number };
  data: CodeNodeData;
}

export interface CodeNodeData {
  label: string;
  description?: string;
  code: string;
  language: 'javascript' | 'python' | 'typescript';
  inputMapping?: Record<string, string>; // Map workflow variables to code inputs
  outputMapping?: Record<string, string>; // Map code outputs to workflow variables
  timeout?: number;
  sandbox?: boolean;
  packages?: string[]; // npm/pip packages
  status?: 'idle' | 'running' | 'success' | 'error';
  output?: unknown;
  executionTime?: number;
  logs?: string[];
}

export interface CodeExecutionResult {
  success: boolean;
  output: unknown;
  logs: string[];
  executionTime: number;
  error?: string;
  memoryUsage?: number;
}

// ============================================================================
// VISUAL WEBHOOK BUILDER TYPES
// ============================================================================

export interface WebhookConfig {
  id: string;
  name: string;
  description?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ANY';
  path: string;
  authentication: WebhookAuth;
  headers?: WebhookHeader[];
  queryParams?: WebhookParam[];
  bodySchema?: WebhookBodySchema;
  responseConfig: WebhookResponse;
  rateLimit?: WebhookRateLimit;
  cors?: WebhookCORS;
  status: 'active' | 'inactive' | 'testing';
  createdAt: number;
  updatedAt: number;
  stats: WebhookStats;
}

export interface WebhookAuth {
  type: 'none' | 'basic' | 'bearer' | 'api_key' | 'hmac' | 'oauth2';
  config?: {
    username?: string;
    password?: string;
    token?: string;
    apiKeyHeader?: string;
    apiKeyValue?: string;
    hmacSecret?: string;
    hmacHeader?: string;
    oauth2Config?: {
      clientId: string;
      clientSecret: string;
      tokenUrl: string;
      scopes: string[];
    };
  };
}

export interface WebhookHeader {
  name: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  validation?: {
    type: 'string' | 'number' | 'regex';
    pattern?: string;
  };
}

export interface WebhookParam {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array';
  description?: string;
  defaultValue?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export interface WebhookBodySchema {
  type: 'json' | 'form' | 'xml' | 'raw';
  schema?: Record<string, unknown>; // JSON Schema
  example?: string;
  required?: boolean;
}

export interface WebhookResponse {
  successCode: number;
  successBody?: string | Record<string, unknown>;
  errorResponses: {
    code: number;
    condition: string;
    body: string | Record<string, unknown>;
  }[];
  transformResponse?: string; // JavaScript code to transform response
}

export interface WebhookRateLimit {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export interface WebhookCORS {
  enabled: boolean;
  origins: string[];
  methods: string[];
  headers: string[];
  credentials?: boolean;
}

export interface WebhookStats {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  avgResponseTime: number;
  lastRequest?: number;
  requestsByDay: { date: string; count: number }[];
}

export interface WebhookTest {
  id: string;
  webhookId: string;
  method: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body?: string;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
    time: number;
  };
  timestamp: number;
}

// ============================================================================
// AUTOMATION TEMPLATES
// ============================================================================

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  color?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  useCase?: string;
  // Template can use either 'flow' or 'config' for node/edge configuration
  flow?: {
    nodes: unknown[]; // FlowNode[]
    edges: unknown[]; // FlowEdge[]
    variables: unknown[]; // FlowVariable[]
  };
  config?: {
    nodes: TemplateNode[];
    edges: TemplateEdge[];
    variables: Record<string, unknown>;
  };
  requiredIntegrations?: string[];
  requiredPermissions?: string[];
  documentation?: string;
  examples?: TemplateExample[];
  stats?: {
    uses: number;
    rating: number;
    reviews: number;
  };
  author: string;
  usageCount: number;
  popularity: number;
  requirements: string[];
  createdAt: number;
  updatedAt: number;
  version: string;
}

export interface TemplateNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface TemplateEdge {
  source: string;
  target: string;
}

export interface TemplateStats {
  totalTemplates: number;
  totalUses?: number;
  totalUsage?: number;
  avgRating?: number;
  byCategory?: Record<TemplateCategory, number>;
  categoryBreakdown?: Record<TemplateCategory, number>;
}

export type TemplateCategory =
  | 'web_scraping'
  | 'data_entry'
  | 'data_processing'
  | 'social_media'
  | 'ecommerce'
  | 'lead_generation'
  | 'email_automation'
  | 'file_processing'
  | 'api_integration'
  | 'integration'
  | 'monitoring'
  | 'notifications'
  | 'reporting'
  | 'ai_workflows'
  | 'ai_automation'
  | 'custom'
  | string; // Allow additional categories

export interface TemplateExample {
  title: string;
  description: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

// ============================================================================
// CONDITIONAL PATHS/BRANCHING
// ============================================================================

export interface ConditionalPath {
  id: string;
  name: string;
  conditions?: PathCondition[];
  conditionGroups?: ConditionGroup[];
  logic?: 'and' | 'or';
  defaultPath?: string; // Node ID for else case
  branches?: PathBranch[];
  enabled: boolean;
  priority: number;
  action?: PathAction;
}

export interface ConditionGroup {
  id: string;
  conditions: PathCondition[] | unknown[];
  logic: 'and' | 'or';
}

export interface PathCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean | null;
  valueType: 'static' | 'variable' | 'expression' | 'string' | 'number' | 'boolean';
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'matches_regex'
  | 'is_empty'
  | 'is_not_empty'
  | 'is_null'
  | 'is_not_null'
  | 'is_true'
  | 'is_false'
  | 'in_array'
  | 'not_in_array';

export interface PathBranch {
  id: string;
  name: string;
  conditionIds: string[];
  targetNodeId: string;
  priority: number;
}

export interface PathAction {
  id?: string;
  type: 'goto' | 'stop' | 'retry' | 'skip' | 'branch' | 'continue' | 'loop' | 'wait' | 'error';
  targetNodeId?: string;
  config?: Record<string, unknown>;
  delay?: number;
  maxIterations?: number;
  errorMessage?: string;
}

// ============================================================================
// SCHEDULE TRIGGERS (CRON)
// ============================================================================

export type ScheduleFrequency = 
  | 'once'
  | 'minutely'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

export interface TriggerCondition {
  id: string;
  type: 'variable' | 'time' | 'date' | 'custom';
  field?: string;
  operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains' | 'is_empty' | 'between';
  value?: string | number | boolean;
  valueEnd?: string | number; // For 'between' operator
  enabled: boolean;
}

export interface ScheduleTrigger {
  id: string;
  name: string;
  description?: string;
  cronExpression?: string;
  cron?: string;
  timezone: string;
  enabled: boolean;
  frequency?: ScheduleFrequency;
  // Specific schedule fields
  hour?: number;
  minute?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
  specificDateTime?: number | string;
  // Range and limits
  startDate?: number | string;
  endDate?: number | string;
  maxRuns?: number;
  maxExecutions?: number;
  currentRuns?: number;
  runCount?: number;
  lastRun?: number;
  nextRun?: number;
  payload?: Record<string, unknown>;
  // Retry configuration
  retryOnFailure?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  // Conditions
  conditions?: TriggerCondition[];
  // Metadata
  createdAt?: number;
  updatedAt?: number;
}

export interface CronPreset {
  name: string;
  expression: string;
  description: string;
  category: 'common' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
}

// ============================================================================
// CHATGPT INTEGRATION FOR DATA PROCESSING
// ============================================================================

export interface ChatGPTDataProcessor {
  id: string;
  name: string;
  description?: string;
  model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo';
  systemPrompt: string;
  userPromptTemplate: string;
  inputFields: DataField[];
  outputFields: DataField[];
  examples: {
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  }[];
  temperature: number;
  maxTokens: number;
  jsonMode: boolean;
  batchProcessing: {
    enabled: boolean;
    batchSize: number;
    delayBetweenBatches: number;
  };
  caching: {
    enabled: boolean;
    ttl: number;
  };
  fallback?: {
    enabled: boolean;
    model: string;
    maxRetries: number;
  };
}

export interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: unknown[];
  };
}

// ============================================================================
// INTEGRATION CONNECTORS (400+ Integrations)
// ============================================================================

export type ConnectorCategory = 
  | 'crm'
  | 'communication'
  | 'email'
  | 'ecommerce'
  | 'storage'
  | 'database'
  | 'social'
  | 'project'
  | 'development'
  | 'developer'
  | 'ai'
  | 'marketing'
  | 'analytics'
  | 'finance'
  | 'hr'
  | 'support'
  | 'automation'
  | 'forms'
  | 'calendar'
  | 'productivity'
  | 'other';

export type ConnectorAuth = 'oauth2' | 'api_key' | 'basic' | 'custom' | 'none';

export interface IntegrationConnector {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ConnectorCategory | IntegrationCategory;
  authType: ConnectorAuth;
  status?: 'available' | 'coming_soon' | 'beta' | 'deprecated';
  popular?: boolean;
  triggers: string[] | IntegrationTrigger[];
  actions: string[] | IntegrationAction[];
  connection?: IntegrationConnection;
  documentation?: string;
  version?: string;
}

export type IntegrationCategory =
  | 'communication'      // Slack, Discord, Teams, Email
  | 'productivity'       // Google Workspace, Notion, Asana
  | 'crm'               // Salesforce, HubSpot, Pipedrive
  | 'marketing'         // Mailchimp, ActiveCampaign, Marketo
  | 'ecommerce'         // Shopify, WooCommerce, Stripe
  | 'social_media'      // Twitter, LinkedIn, Facebook, Instagram
  | 'development'       // GitHub, GitLab, Jira, Linear
  | 'analytics'         // Google Analytics, Mixpanel, Amplitude
  | 'storage'           // Google Drive, Dropbox, S3, OneDrive
  | 'database'          // PostgreSQL, MySQL, MongoDB, Airtable
  | 'ai'                // OpenAI, Claude, Gemini, Replicate
  | 'automation'        // Zapier, Make, n8n, IFTTT
  | 'finance'           // QuickBooks, Xero, Plaid
  | 'hr'                // BambooHR, Workday, Gusto
  | 'support'           // Zendesk, Intercom, Freshdesk
  | 'other';

export interface IntegrationTrigger {
  id: string;
  name: string;
  description: string;
  event: string;
  outputSchema: Record<string, unknown>;
  polling?: {
    interval: number;
    minInterval: number;
  };
  webhook?: {
    path: string;
    method: string;
  };
}

export interface IntegrationAction {
  id: string;
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  rateLimit?: {
    requests: number;
    window: number;
  };
}

export interface IntegrationConnection {
  id: string;
  integrationId: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'expired';
  credentials: Record<string, string>; // Encrypted
  metadata?: Record<string, unknown>;
  createdAt: number;
  lastUsed?: number;
  expiresAt?: number;
}

// ============================================================================
// WORKFLOW EXECUTION CONTEXT
// ============================================================================

export interface WorkflowExecutionContext {
  executionId: string;
  workflowId: string;
  startTime: number;
  variables: Map<string, unknown>;
  secrets: Map<string, string>;
  nodeOutputs: Map<string, unknown>;
  currentNodeId?: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  logs: ExecutionLog[];
  metrics: ExecutionMetrics;
}

export interface ExecutionLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  nodeId?: string;
  message: string;
  data?: unknown;
}

export interface ExecutionMetrics {
  totalNodes: number;
  executedNodes: number;
  failedNodes: number;
  totalDuration: number;
  nodeDurations: Map<string, number>;
  memoryUsage: number;
  apiCalls: number;
}
