/**
 * CUBE Elite v6 - Visual Workflow Builder Types
 * 
 * Enterprise-grade visual automation workflow builder.
 * Competes with: n8n, Make (Integromat), Zapier, Power Automate
 * 
 * Features:
 * - React Flow integration types
 * - Node-based workflow design
 * - 200+ integration triggers and actions
 * - Conditional logic and branching
 * - Data transformation nodes
 * - Error handling and retry logic
 * - Workflow templates
 * - Real-time execution monitoring
 * 
 * @module workflow-builder-types
 * @version 1.0.0
 */

// ============================================================================
// Core Node Types
// ============================================================================

/**
 * Node categories for organization
 */
export type NodeCategory =
  | 'trigger'        // Events that start workflow
  | 'action'         // Perform operations
  | 'logic'          // Control flow
  | 'transform'      // Data manipulation
  | 'integration'    // External services
  | 'utility'        // Helper functions
  | 'ai'             // AI-powered nodes
  | 'custom';        // User-defined

/**
 * Base node data structure for React Flow
 */
export interface WorkflowNodeData {
  /** Node label/name */
  label: string;
  /** Node description */
  description?: string;
  /** Node category */
  category: NodeCategory;
  /** Node type identifier */
  nodeType: string;
  /** Icon name or component */
  icon: string;
  /** Brand color for visual styling */
  color?: string;
  /** Node configuration */
  config: Record<string, unknown>;
  /** Input schema for validation */
  inputSchema?: JSONSchema;
  /** Output schema for validation */
  outputSchema?: JSONSchema;
  /** Credentials reference */
  credentialsId?: string;
  /** Error handling config */
  errorHandling?: ErrorHandlingConfig;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Node is disabled */
  disabled?: boolean;
  /** Node notes/documentation */
  notes?: string;
  /** Execution stats */
  stats?: NodeExecutionStats;
}

/**
 * JSON Schema subset for validation
 */
export interface JSONSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: (string | number | boolean)[];
  default?: unknown;
  description?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  /** What to do on error */
  onError: 'stop' | 'continue' | 'retry' | 'fallback';
  /** Fallback node to execute */
  fallbackNodeId?: string;
  /** Max retries before giving up */
  maxRetries?: number;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Max retry attempts */
  maxAttempts: number;
  /** Initial delay in ms */
  initialDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Max delay in ms */
  maxDelay: number;
}

/**
 * Node execution statistics
 */
export interface NodeExecutionStats {
  /** Total executions */
  totalExecutions: number;
  /** Successful executions */
  successCount: number;
  /** Failed executions */
  errorCount: number;
  /** Average execution time in ms */
  avgExecutionTime: number;
  /** Last execution time */
  lastExecuted?: Date;
}

// ============================================================================
// Trigger Node Types
// ============================================================================

/**
 * Manual trigger (webhook/button)
 */
export interface ManualTriggerConfig {
  /** Webhook URL (auto-generated) */
  webhookUrl?: string;
  /** HTTP method to accept */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ANY';
  /** Authentication required */
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'apiKey';
    credentials?: string;
  };
  /** Response to send */
  responseMode: 'immediate' | 'lastNode';
}

/**
 * Schedule trigger (cron)
 */
export interface ScheduleTriggerConfig {
  /** Cron expression */
  cronExpression: string;
  /** Timezone */
  timezone: string;
  /** Human-readable schedule */
  scheduleDescription?: string;
  /** Active/inactive */
  active: boolean;
}

/**
 * File watch trigger
 */
export interface FileWatchTriggerConfig {
  /** Directory to watch */
  watchPath: string;
  /** File patterns to match */
  patterns: string[];
  /** Events to trigger on */
  events: ('created' | 'modified' | 'deleted' | 'renamed')[];
  /** Recursive watch */
  recursive: boolean;
  /** Debounce time in ms */
  debounceMs: number;
}

/**
 * Email trigger (IMAP)
 */
export interface EmailTriggerConfig {
  /** IMAP server */
  server: string;
  /** Port */
  port: number;
  /** Use SSL */
  ssl: boolean;
  /** Credentials ID */
  credentialsId: string;
  /** Folder to watch */
  folder: string;
  /** From filter */
  fromFilter?: string;
  /** Subject filter */
  subjectFilter?: string;
  /** Mark as read after processing */
  markAsRead: boolean;
  /** Poll interval in seconds */
  pollInterval: number;
}

/**
 * Database trigger (changes)
 */
export interface DatabaseTriggerConfig {
  /** Database type */
  databaseType: 'postgres' | 'mysql' | 'mongodb' | 'sqlite';
  /** Connection credentials */
  credentialsId: string;
  /** Table/collection to watch */
  table: string;
  /** Operations to trigger on */
  operations: ('INSERT' | 'UPDATE' | 'DELETE')[];
  /** Column to track changes */
  trackingColumn?: string;
  /** Poll interval */
  pollInterval: number;
}

/**
 * Webhook trigger
 */
export interface WebhookTriggerConfig {
  /** Webhook path */
  path: string;
  /** HTTP methods */
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
  /** Response mode */
  responseMode: 'immediate' | 'lastNode' | 'custom';
  /** Custom response code */
  responseCode?: number;
  /** Headers to include in response */
  responseHeaders?: Record<string, string>;
  /** Authentication */
  authentication?: {
    type: 'none' | 'basic' | 'header' | 'query';
    headerName?: string;
    queryParam?: string;
    credentials?: string;
  };
}

// ============================================================================
// Action Node Types
// ============================================================================

/**
 * HTTP Request action
 */
export interface HttpRequestConfig {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  /** URL (supports variables) */
  url: string;
  /** Authentication */
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'apiKey' | 'oauth2';
    credentialsId?: string;
    headerName?: string;
    headerValue?: string;
  };
  /** Request headers */
  headers?: Record<string, string>;
  /** Query parameters */
  queryParams?: Record<string, string>;
  /** Request body */
  body?: {
    contentType: 'json' | 'form' | 'multipart' | 'raw' | 'binary';
    data: unknown;
  };
  /** Response format */
  responseFormat: 'json' | 'text' | 'binary' | 'auto';
  /** Timeout in ms */
  timeout: number;
  /** Follow redirects */
  followRedirects: boolean;
  /** Ignore SSL errors */
  ignoreSslErrors: boolean;
}

/**
 * Database query action
 */
export interface DatabaseQueryConfig {
  /** Database type */
  databaseType: 'postgres' | 'mysql' | 'mongodb' | 'sqlite' | 'mssql' | 'oracle';
  /** Credentials */
  credentialsId: string;
  /** Query type */
  operation: 'select' | 'insert' | 'update' | 'delete' | 'raw';
  /** Table/collection */
  table?: string;
  /** Columns to select */
  columns?: string[];
  /** Where conditions */
  where?: QueryCondition[];
  /** Raw query */
  rawQuery?: string;
  /** Parameters */
  parameters?: Record<string, unknown>;
  /** Return inserted/updated rows */
  returnRows: boolean;
}

/**
 * Query condition
 */
export interface QueryCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL';
  value: unknown;
  logicalOperator?: 'AND' | 'OR';
}

/**
 * Email send action
 */
export interface EmailSendConfig {
  /** SMTP credentials */
  credentialsId: string;
  /** From address */
  from: string;
  /** To addresses (comma-separated or array) */
  to: string | string[];
  /** CC addresses */
  cc?: string | string[];
  /** BCC addresses */
  bcc?: string | string[];
  /** Email subject */
  subject: string;
  /** Email body */
  body: {
    type: 'text' | 'html';
    content: string;
  };
  /** Attachments */
  attachments?: EmailAttachment[];
  /** Reply-to address */
  replyTo?: string;
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  encoding?: 'base64' | 'utf8';
}

/**
 * File operation action
 */
export interface FileOperationConfig {
  /** Operation type */
  operation: 'read' | 'write' | 'append' | 'delete' | 'copy' | 'move' | 'list' | 'exists';
  /** File/directory path */
  path: string;
  /** Destination (for copy/move) */
  destination?: string;
  /** Content to write */
  content?: string | Buffer;
  /** Encoding */
  encoding?: 'utf8' | 'base64' | 'binary';
  /** Create directories if needed */
  createDirectories?: boolean;
  /** File pattern for list */
  pattern?: string;
  /** Recursive for list */
  recursive?: boolean;
}

/**
 * Shell command action
 */
export interface ShellCommandConfig {
  /** Command to execute */
  command: string;
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Timeout in ms */
  timeout: number;
  /** Shell to use */
  shell?: 'bash' | 'sh' | 'zsh' | 'powershell' | 'cmd';
  /** Capture stderr */
  captureStderr: boolean;
}

// ============================================================================
// Logic Node Types
// ============================================================================

/**
 * If/Else condition node
 */
export interface IfElseConfig {
  /** Conditions to evaluate */
  conditions: ConditionGroup[];
  /** Combine conditions with */
  combineWith: 'AND' | 'OR';
  /** Output on true */
  trueBranch: string;
  /** Output on false */
  falseBranch: string;
}

/**
 * Condition group
 */
export interface ConditionGroup {
  /** Field/value to check */
  value1: string;
  /** Comparison operator */
  operator: 
    | 'equals' | 'notEquals'
    | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
    | 'greaterThan' | 'lessThan' | 'greaterOrEqual' | 'lessOrEqual'
    | 'isEmpty' | 'isNotEmpty'
    | 'isTrue' | 'isFalse'
    | 'regex' | 'notRegex'
    | 'isType' | 'exists';
  /** Value to compare against */
  value2?: string;
  /** Data type for comparison */
  dataType?: 'string' | 'number' | 'boolean' | 'date';
}

/**
 * Switch/Case node
 */
export interface SwitchCaseConfig {
  /** Value to switch on */
  value: string;
  /** Case rules */
  cases: SwitchCase[];
  /** Default output */
  defaultOutput: string;
  /** Comparison mode */
  mode: 'strict' | 'loose' | 'regex';
}

/**
 * Switch case rule
 */
export interface SwitchCase {
  /** Value to match */
  value: string;
  /** Output name */
  output: string;
}

/**
 * Loop node
 */
export interface LoopConfig {
  /** Loop type */
  type: 'forEach' | 'while' | 'times';
  /** Items to iterate (forEach) */
  items?: string;
  /** Condition (while) */
  condition?: ConditionGroup;
  /** Number of iterations (times) */
  count?: number;
  /** Max iterations (safety limit) */
  maxIterations: number;
  /** Variable name for current item */
  itemVariable: string;
  /** Variable name for index */
  indexVariable: string;
  /** Parallel execution */
  parallel: boolean;
  /** Batch size for parallel */
  batchSize?: number;
}

/**
 * Merge/Join node
 */
export interface MergeConfig {
  /** Merge mode */
  mode: 'append' | 'merge' | 'passthrough' | 'wait';
  /** For merge mode - which output to use */
  propertyName?: string;
  /** Wait mode - how many inputs to wait for */
  waitFor?: 'all' | number;
}

/**
 * Split/Branch node
 */
export interface SplitConfig {
  /** Split mode */
  mode: 'items' | 'property' | 'percentage' | 'round-robin';
  /** Property to split on */
  property?: string;
  /** Percentages for each output */
  percentages?: number[];
  /** Number of outputs */
  outputCount: number;
}

/**
 * Wait/Delay node
 */
export interface WaitConfig {
  /** Wait type */
  type: 'fixed' | 'random' | 'until' | 'webhook';
  /** Fixed delay in ms */
  delay?: number;
  /** Random min delay */
  minDelay?: number;
  /** Random max delay */
  maxDelay?: number;
  /** Wait until datetime */
  until?: string;
  /** Resume on webhook */
  webhookId?: string;
}

// ============================================================================
// Transform Node Types
// ============================================================================

/**
 * Set/Assign values node
 */
export interface SetValuesConfig {
  /** Values to set */
  values: SetValue[];
  /** Keep only set values or merge */
  mode: 'replace' | 'merge';
}

/**
 * Value assignment
 */
export interface SetValue {
  /** Property name */
  name: string;
  /** Value (can include expressions) */
  value: string;
  /** Value type */
  type: 'string' | 'number' | 'boolean' | 'json' | 'expression';
}

/**
 * Code/Function node
 */
export interface CodeNodeConfig {
  /** Language */
  language: 'javascript' | 'python';
  /** Code to execute */
  code: string;
  /** Input items mode */
  inputMode: 'all' | 'each';
  /** Output mode */
  outputMode: 'single' | 'multiple';
  /** Max execution time */
  timeout: number;
}

/**
 * JSON transform node
 */
export interface JsonTransformConfig {
  /** Operation */
  operation: 'parse' | 'stringify' | 'dot' | 'flatten' | 'unflatten' | 'query';
  /** Property to transform */
  property: string;
  /** JSONPath query */
  query?: string;
  /** Output property */
  outputProperty?: string;
  /** Flatten separator */
  separator?: string;
}

/**
 * Text manipulation node
 */
export interface TextManipulationConfig {
  /** Operation */
  operation: 
    | 'uppercase' | 'lowercase' | 'capitalize' | 'titleCase'
    | 'trim' | 'trimStart' | 'trimEnd'
    | 'replace' | 'replaceAll' | 'split' | 'join'
    | 'substring' | 'pad' | 'repeat'
    | 'encode' | 'decode'
    | 'regex';
  /** Input value */
  value: string;
  /** Search pattern (for replace/regex) */
  pattern?: string;
  /** Replacement value */
  replacement?: string;
  /** Separator (for split/join) */
  separator?: string;
  /** Start index (for substring) */
  start?: number;
  /** End index (for substring) */
  end?: number;
  /** Encoding type */
  encoding?: 'base64' | 'url' | 'html' | 'json';
  /** Output property */
  outputProperty: string;
}

/**
 * Date/Time manipulation node
 */
export interface DateTimeConfig {
  /** Operation */
  operation: 
    | 'format' | 'parse' | 'now'
    | 'add' | 'subtract' | 'diff'
    | 'startOf' | 'endOf'
    | 'isBefore' | 'isAfter' | 'isBetween';
  /** Input value */
  value?: string;
  /** Format string */
  format?: string;
  /** Amount to add/subtract */
  amount?: number;
  /** Unit for add/subtract/diff */
  unit?: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds';
  /** Timezone */
  timezone?: string;
  /** Output property */
  outputProperty: string;
}

/**
 * Aggregate/Summarize node
 */
export interface AggregateConfig {
  /** Operation */
  operation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'first' | 'last' | 'concat' | 'unique';
  /** Property to aggregate */
  property: string;
  /** Group by property */
  groupBy?: string;
  /** Output property */
  outputProperty: string;
}

/**
 * Filter node
 */
export interface FilterConfig {
  /** Conditions */
  conditions: ConditionGroup[];
  /** Combine conditions */
  combineWith: 'AND' | 'OR';
  /** Keep or remove matching items */
  mode: 'keep' | 'remove';
}

/**
 * Sort node
 */
export interface SortConfig {
  /** Sort rules */
  sortBy: SortRule[];
}

/**
 * Sort rule
 */
export interface SortRule {
  property: string;
  direction: 'asc' | 'desc';
  type?: 'string' | 'number' | 'date';
}

// ============================================================================
// Integration Node Types
// ============================================================================

/**
 * OAuth2 configuration
 */
export interface OAuth2Config {
  /** Client ID */
  clientId: string;
  /** Client Secret */
  clientSecret: string;
  /** Authorization URL */
  authorizationUrl: string;
  /** Token URL */
  tokenUrl: string;
  /** Scopes */
  scopes: string[];
  /** Redirect URL */
  redirectUrl: string;
  /** Access token */
  accessToken?: string;
  /** Refresh token */
  refreshToken?: string;
  /** Token expiry */
  expiresAt?: number;
}

/**
 * Google Sheets action
 */
export interface GoogleSheetsConfig {
  /** Credentials */
  credentialsId: string;
  /** Operation */
  operation: 'read' | 'append' | 'update' | 'clear' | 'create';
  /** Spreadsheet ID */
  spreadsheetId: string;
  /** Sheet name */
  sheetName: string;
  /** Range (A1 notation) */
  range?: string;
  /** Data to write */
  data?: unknown[][];
  /** Include headers */
  includeHeaders: boolean;
}

/**
 * Slack action
 */
export interface SlackConfig {
  /** Credentials */
  credentialsId: string;
  /** Operation */
  operation: 'sendMessage' | 'uploadFile' | 'updateMessage' | 'addReaction';
  /** Channel ID */
  channel: string;
  /** Message text */
  text?: string;
  /** Message blocks (rich formatting) */
  blocks?: SlackBlock[];
  /** File to upload */
  file?: {
    content: string | Buffer;
    filename: string;
    title?: string;
  };
  /** Thread timestamp */
  threadTs?: string;
  /** Emoji for reaction */
  emoji?: string;
}

/**
 * Slack block element
 */
export interface SlackBlock {
  type: 'section' | 'divider' | 'image' | 'actions' | 'context' | 'header';
  text?: {
    type: 'plain_text' | 'mrkdwn';
    text: string;
    emoji?: boolean;
  };
  accessory?: unknown;
  elements?: unknown[];
  image_url?: string;
  alt_text?: string;
}

/**
 * GitHub action
 */
export interface GitHubConfig {
  /** Credentials */
  credentialsId: string;
  /** Operation */
  operation: 
    | 'createIssue' | 'updateIssue' | 'closeIssue' | 'addComment'
    | 'createPR' | 'mergePR'
    | 'getFile' | 'createFile' | 'updateFile'
    | 'createRelease' | 'triggerWorkflow';
  /** Repository owner */
  owner: string;
  /** Repository name */
  repo: string;
  /** Issue/PR number */
  number?: number;
  /** Title */
  title?: string;
  /** Body content */
  body?: string;
  /** Labels */
  labels?: string[];
  /** Assignees */
  assignees?: string[];
  /** File path */
  filePath?: string;
  /** File content */
  fileContent?: string;
  /** Branch */
  branch?: string;
  /** Commit message */
  commitMessage?: string;
}

/**
 * Notion action
 */
export interface NotionConfig {
  /** Credentials */
  credentialsId: string;
  /** Operation */
  operation: 
    | 'getDatabase' | 'queryDatabase' | 'createPage' | 'updatePage'
    | 'getPage' | 'appendBlock' | 'getBlocks';
  /** Database ID */
  databaseId?: string;
  /** Page ID */
  pageId?: string;
  /** Filter for query */
  filter?: NotionFilter;
  /** Sorts for query */
  sorts?: NotionSort[];
  /** Page properties */
  properties?: Record<string, unknown>;
  /** Blocks to append */
  blocks?: NotionBlock[];
}

/**
 * Notion filter
 */
export interface NotionFilter {
  property: string;
  type: 'title' | 'rich_text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox';
  condition: string;
  value: unknown;
}

/**
 * Notion sort
 */
export interface NotionSort {
  property: string;
  direction: 'ascending' | 'descending';
}

/**
 * Notion block
 */
export interface NotionBlock {
  type: 'paragraph' | 'heading_1' | 'heading_2' | 'heading_3' | 'bulleted_list_item' | 'numbered_list_item' | 'code' | 'quote' | 'divider';
  content?: string;
  language?: string;
}

/**
 * AWS S3 action
 */
export interface AwsS3Config {
  /** Credentials */
  credentialsId: string;
  /** Operation */
  operation: 'upload' | 'download' | 'delete' | 'list' | 'getMetadata' | 'generatePresignedUrl';
  /** Bucket name */
  bucket: string;
  /** Object key */
  key?: string;
  /** Prefix for listing */
  prefix?: string;
  /** File content */
  content?: string | Buffer;
  /** Content type */
  contentType?: string;
  /** Presigned URL expiry */
  expiresIn?: number;
  /** ACL */
  acl?: 'private' | 'public-read' | 'authenticated-read';
}

// ============================================================================
// AI Node Types
// ============================================================================

/**
 * OpenAI/GPT action
 */
export interface OpenAIConfig {
  /** Credentials */
  credentialsId: string;
  /** Operation */
  operation: 'chat' | 'completion' | 'embedding' | 'image' | 'audio' | 'moderation';
  /** Model */
  model: string;
  /** System prompt */
  systemPrompt?: string;
  /** User prompt/message */
  prompt: string;
  /** Temperature */
  temperature?: number;
  /** Max tokens */
  maxTokens?: number;
  /** Top P */
  topP?: number;
  /** Frequency penalty */
  frequencyPenalty?: number;
  /** Presence penalty */
  presencePenalty?: number;
  /** Response format */
  responseFormat?: 'text' | 'json';
  /** JSON schema (for json mode) */
  jsonSchema?: JSONSchema;
  /** Function/tool definitions */
  functions?: OpenAIFunction[];
  /** Image size (for image generation) */
  imageSize?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  /** Audio language (for transcription) */
  language?: string;
}

/**
 * OpenAI function definition
 */
export interface OpenAIFunction {
  name: string;
  description: string;
  parameters: JSONSchema;
}

/**
 * Text analysis (sentiment, NER, etc.)
 */
export interface TextAnalysisConfig {
  /** Analysis type */
  type: 'sentiment' | 'entities' | 'keywords' | 'summary' | 'translation' | 'classification';
  /** Input text */
  text: string;
  /** Target language (for translation) */
  targetLanguage?: string;
  /** Categories (for classification) */
  categories?: string[];
  /** Summary length */
  summaryLength?: 'short' | 'medium' | 'long';
  /** Output property */
  outputProperty: string;
}

/**
 * AI Agent/Assistant node
 */
export interface AIAgentConfig {
  /** Credentials */
  credentialsId: string;
  /** Agent name */
  name: string;
  /** Agent instructions/persona */
  instructions: string;
  /** Available tools */
  tools: AIAgentTool[];
  /** Memory enabled */
  memory: boolean;
  /** Max iterations */
  maxIterations: number;
  /** User input */
  input: string;
}

/**
 * AI Agent tool
 */
export interface AIAgentTool {
  type: 'function' | 'retrieval' | 'code_interpreter' | 'workflow';
  name: string;
  description: string;
  /** For workflow tools - workflow ID to call */
  workflowId?: string;
  /** Function parameters */
  parameters?: JSONSchema;
}

// ============================================================================
// Workflow Types
// ============================================================================

/**
 * Workflow definition
 */
export interface Workflow {
  /** Unique identifier */
  id: string;
  /** Workflow name */
  name: string;
  /** Description */
  description?: string;
  /** Tags for organization */
  tags: string[];
  /** Active status */
  active: boolean;
  /** Nodes in workflow */
  nodes: WorkflowNode[];
  /** Edges/connections */
  edges: WorkflowEdge[];
  /** Workflow settings */
  settings: WorkflowSettings;
  /** Variable definitions */
  variables: WorkflowVariable[];
  /** Credentials used */
  credentials: CredentialReference[];
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
  /** Last executed */
  lastExecutedAt?: Date;
  /** Execution count */
  executionCount: number;
  /** Version number */
  version: number;
}

/**
 * Workflow node (React Flow node)
 */
export interface WorkflowNode {
  /** Unique ID */
  id: string;
  /** Node type identifier */
  type: string;
  /** Position */
  position: { x: number; y: number };
  /** Node data */
  data: WorkflowNodeData;
  /** Width */
  width?: number;
  /** Height */
  height?: number;
  /** Selected state */
  selected?: boolean;
  /** Dragging state */
  dragging?: boolean;
}

/**
 * Workflow edge (React Flow edge)
 */
export interface WorkflowEdge {
  /** Unique ID */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Source handle ID */
  sourceHandle?: string;
  /** Target handle ID */
  targetHandle?: string;
  /** Edge type */
  type?: 'default' | 'smoothstep' | 'step' | 'straight';
  /** Edge label */
  label?: string;
  /** Animated edge */
  animated?: boolean;
  /** Edge style */
  style?: React.CSSProperties;
  /** Edge data */
  data?: {
    condition?: string;
    dataPath?: string;
  };
}

/**
 * Workflow settings
 */
export interface WorkflowSettings {
  /** Timezone for scheduling */
  timezone: string;
  /** Error workflow ID */
  errorWorkflowId?: string;
  /** Retry on failure */
  retryOnFail: boolean;
  /** Max retries */
  maxRetries: number;
  /** Timeout in seconds */
  timeout: number;
  /** Save execution data */
  saveExecutions: 'all' | 'errors' | 'none';
  /** Data pruning days */
  pruneDataDays: number;
  /** Concurrent executions allowed */
  concurrentExecutions: number;
}

/**
 * Workflow variable
 */
export interface WorkflowVariable {
  /** Variable name */
  name: string;
  /** Default value */
  defaultValue: unknown;
  /** Variable type */
  type: 'string' | 'number' | 'boolean' | 'json';
  /** Description */
  description?: string;
  /** Is required */
  required: boolean;
}

/**
 * Credential reference
 */
export interface CredentialReference {
  /** Credential ID */
  id: string;
  /** Credential name */
  name: string;
  /** Credential type */
  type: string;
  /** Nodes using this credential */
  nodeIds: string[];
}

// ============================================================================
// Execution Types
// ============================================================================

/**
 * Workflow execution
 */
export interface WorkflowExecution {
  /** Execution ID */
  id: string;
  /** Workflow ID */
  workflowId: string;
  /** Workflow version at execution */
  workflowVersion: number;
  /** Execution status */
  status: ExecutionStatus;
  /** Started at */
  startedAt: Date;
  /** Finished at */
  finishedAt?: Date;
  /** Duration in ms */
  duration?: number;
  /** Input data */
  inputData?: unknown;
  /** Output data */
  outputData?: unknown;
  /** Node executions */
  nodeExecutions: NodeExecution[];
  /** Error if failed */
  error?: ExecutionError;
  /** Trigger info */
  trigger: {
    type: 'manual' | 'schedule' | 'webhook' | 'event';
    nodeId: string;
    data?: unknown;
  };
  /** Execution mode */
  mode: 'production' | 'test' | 'debug';
}

/**
 * Execution status
 */
export type ExecutionStatus = 
  | 'queued'
  | 'running'
  | 'success'
  | 'error'
  | 'cancelled'
  | 'waiting';

/**
 * Node execution data
 */
export interface NodeExecution {
  /** Node ID */
  nodeId: string;
  /** Node type */
  nodeType: string;
  /** Status */
  status: ExecutionStatus;
  /** Started at */
  startedAt?: Date;
  /** Finished at */
  finishedAt?: Date;
  /** Duration in ms */
  duration?: number;
  /** Input data */
  inputData?: unknown;
  /** Output data */
  outputData?: unknown;
  /** Error */
  error?: ExecutionError;
  /** Retries attempted */
  retries: number;
}

/**
 * Execution error
 */
export interface ExecutionError {
  /** Error message */
  message: string;
  /** Stack trace */
  stack?: string;
  /** Error code */
  code?: string;
  /** Context */
  context?: Record<string, unknown>;
}

// ============================================================================
// Node Registry Types
// ============================================================================

/**
 * Node type definition for registry
 */
export interface NodeTypeDefinition {
  /** Unique type identifier */
  type: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Category */
  category: NodeCategory;
  /** Icon */
  icon: string;
  /** Brand color */
  color: string;
  /** Number of inputs */
  inputs: number;
  /** Number of outputs */
  outputs: number;
  /** Output labels */
  outputLabels?: string[];
  /** Default configuration */
  defaultConfig: Record<string, unknown>;
  /** Configuration schema */
  configSchema: ConfigSchema[];
  /** Documentation URL */
  documentationUrl?: string;
  /** Version */
  version: string;
  /** Beta status */
  beta?: boolean;
  /** Credentials type */
  credentialsType?: string;
}

/**
 * Configuration schema field
 */
export interface ConfigSchema {
  /** Field name */
  name: string;
  /** Display label */
  label: string;
  /** Field type */
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiSelect' | 'code' | 'json' | 'expression' | 'credentials';
  /** Options for select */
  options?: { label: string; value: unknown }[];
  /** Default value */
  default?: unknown;
  /** Placeholder */
  placeholder?: string;
  /** Help text */
  helpText?: string;
  /** Required */
  required?: boolean;
  /** Validation */
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  /** Show condition */
  showIf?: {
    field: string;
    value: unknown;
  };
  /** Code language */
  codeLanguage?: string;
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * Workflow template
 */
export interface WorkflowTemplate {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Description */
  description: string;
  /** Category */
  category: string;
  /** Tags */
  tags: string[];
  /** Preview image */
  previewImage?: string;
  /** Author */
  author: string;
  /** Workflow data */
  workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>;
  /** Required credentials */
  requiredCredentials: string[];
  /** Use count */
  useCount: number;
  /** Rating */
  rating: number;
  /** Created at */
  createdAt: Date;
}

/**
 * Template category
 */
export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templateCount: number;
}

// ============================================================================
// Node Type Constants
// ============================================================================

/**
 * Built-in node types
 */
export const NODE_TYPES = {
  // Triggers
  MANUAL_TRIGGER: 'manual-trigger',
  SCHEDULE_TRIGGER: 'schedule-trigger',
  WEBHOOK_TRIGGER: 'webhook-trigger',
  FILE_WATCH_TRIGGER: 'file-watch-trigger',
  EMAIL_TRIGGER: 'email-trigger',
  DATABASE_TRIGGER: 'database-trigger',
  
  // Actions
  HTTP_REQUEST: 'http-request',
  DATABASE_QUERY: 'database-query',
  EMAIL_SEND: 'email-send',
  FILE_OPERATION: 'file-operation',
  SHELL_COMMAND: 'shell-command',
  
  // Logic
  IF_ELSE: 'if-else',
  SWITCH_CASE: 'switch-case',
  LOOP: 'loop',
  MERGE: 'merge',
  SPLIT: 'split',
  WAIT: 'wait',
  
  // Transform
  SET_VALUES: 'set-values',
  CODE: 'code',
  JSON_TRANSFORM: 'json-transform',
  TEXT_MANIPULATION: 'text-manipulation',
  DATE_TIME: 'date-time',
  AGGREGATE: 'aggregate',
  FILTER: 'filter',
  SORT: 'sort',
  
  // Integrations
  GOOGLE_SHEETS: 'google-sheets',
  SLACK: 'slack',
  GITHUB: 'github',
  NOTION: 'notion',
  AWS_S3: 'aws-s3',
  
  // AI
  OPENAI: 'openai',
  TEXT_ANALYSIS: 'text-analysis',
  AI_AGENT: 'ai-agent',
} as const;

/**
 * Node categories with metadata
 */
export const NODE_CATEGORIES: Record<NodeCategory, { name: string; icon: string; color: string }> = {
  trigger: { name: 'Triggers', icon: 'Zap', color: '#10b981' },
  action: { name: 'Actions', icon: 'Play', color: '#3b82f6' },
  logic: { name: 'Logic', icon: 'GitBranch', color: '#8b5cf6' },
  transform: { name: 'Transform', icon: 'Shuffle', color: '#f59e0b' },
  integration: { name: 'Integrations', icon: 'Puzzle', color: '#ec4899' },
  utility: { name: 'Utilities', icon: 'Wrench', color: '#6b7280' },
  ai: { name: 'AI', icon: 'Brain', color: '#14b8a6' },
  custom: { name: 'Custom', icon: 'Code', color: '#6366f1' },
};


