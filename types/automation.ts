/**
 * Automation Studio - Types & Interfaces
 * Sistema de automatización visual tipo Zapier/n8n
 */

// ============================================================================
// FLOW TYPES
// ============================================================================

export type NodeType = 
  | 'trigger'       // Inicia el flujo (manual, schedule, webhook, event)
  | 'action'        // Ejecuta acción (click, type, navigate, extract)
  | 'condition'     // Decisión (if/else)
  | 'loop'          // Iteración (for each)
  | 'data'          // Transformación de datos
  | 'api'           // Llamada API externa
  | 'wait'          // Espera (delay, wait for element)
  | 'notification'  // Notificación (email, slack, webhook)
  | 'storage';      // Guardar/cargar datos

export type TriggerType =
  | 'manual'        // Click en "Run"
  | 'schedule'      // Cron schedule
  | 'webhook'       // HTTP webhook
  | 'browser_event' // Browser event (page load, element visible)
  | 'file_watch';   // File system watch

export type ActionType =
  | 'navigate'      // Navegar a URL
  | 'click'         // Click en elemento
  | 'type'          // Escribir texto
  | 'select'        // Select dropdown
  | 'extract'       // Extraer datos
  | 'screenshot'    // Tomar screenshot
  | 'upload'        // Upload file
  | 'download'      // Download file
  | 'execute_js'    // Ejecutar JavaScript
  | 'wait_element'  // Esperar elemento
  | 'scroll';       // Scroll page

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: FlowNodeData;
  selected?: boolean;
  dragging?: boolean;
}

export interface FlowNodeData {
  label: string;
  description?: string;
  icon?: string;
  config: NodeConfig;
  status?: 'idle' | 'running' | 'success' | 'error';
  error?: string;
  output?: string | number | boolean | Record<string, unknown> | Array<unknown> | null;
}

export interface NodeConfig {
  // Trigger config
  triggerType?: TriggerType;
  schedule?: string; // cron expression
  webhookUrl?: string;
  browserEvent?: {
    type: 'load' | 'domready' | 'element_visible';
    selector?: string;
  };

  // Action config
  actionType?: ActionType;
  selector?: string;
  value?: string;
  url?: string;
  javascript?: string;
  timeout?: number;
  waitFor?: 'load' | 'networkidle' | 'domcontentloaded';

  // Condition config
  condition?: {
    left: string;
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'matches';
    right: string;
  };

  // Loop config
  loop?: {
    items: string; // Variable name or array
    maxIterations?: number;
  };

  // Data config
  dataTransform?: {
    input: string;
    operation: 'map' | 'filter' | 'reduce' | 'parse' | 'stringify';
    code: string;
  };

  // API config
  api?: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    headers?: Record<string, string>;
    body?: string | Record<string, unknown> | null;
    auth?: {
      type: 'bearer' | 'basic' | 'api_key';
      token?: string;
      username?: string;
      password?: string;
    };
  };

  // Notification config
  notification?: {
    type: 'email' | 'slack' | 'webhook' | 'desktop';
    recipient?: string;
    message: string;
    webhookUrl?: string;
  };

  // Storage config
  storage?: {
    operation: 'save' | 'load' | 'delete';
    key: string;
    value?: string;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier';
  animated?: boolean;
  label?: string;
  data?: {
    condition?: 'success' | 'error' | 'always';
  };
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
  variables: FlowVariable[];
  secrets: string[]; // IDs de secretos en Vault
  settings: FlowSettings;
  status: 'draft' | 'active' | 'paused' | 'archived';
  stats?: FlowStats;
}

export interface FlowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: string | number | boolean | Record<string, unknown> | Array<unknown>;
  description?: string;
  isSecret?: boolean;
}

export interface FlowSettings {
  maxRetries: number;
  retryDelay: number; // ms
  timeout: number; // ms
  errorHandling: 'stop' | 'continue' | 'retry';
  logging: 'none' | 'errors' | 'all';
  notifications: {
    onSuccess: boolean;
    onError: boolean;
  };
}

export interface FlowStats {
  totalRuns: number;
  successRuns: number;
  errorRuns: number;
  avgDuration: number; // ms
  lastRun?: FlowExecution;
}

// ============================================================================
// EXECUTION TYPES
// ============================================================================

export interface FlowExecution {
  id: string;
  flowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: number;
  completedAt?: number;
  duration?: number; // ms
  trigger: {
    type: TriggerType;
    data?: Record<string, unknown>;
  };
  steps: ExecutionStep[];
  variables: Record<string, string | number | boolean | Record<string, unknown> | Array<unknown>>;
  error?: ExecutionError;
}

export interface ExecutionStep {
  nodeId: string;
  nodeType: NodeType;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: number;
  completedAt?: number;
  duration?: number;
  input?: string | number | boolean | Record<string, unknown> | Array<unknown> | null;
  output?: string | number | boolean | Record<string, unknown> | Array<unknown> | null;
  error?: ExecutionError;
  retries: number;
}

export interface ExecutionError {
  message: string;
  code?: string;
  stack?: string;
  nodeId?: string;
  timestamp: number;
}

// ============================================================================
// RECORDER TYPES
// ============================================================================

export interface RecordedAction {
  id: string;
  type: ActionType;
  timestamp: number;
  selector: string;
  selectorType: 'css' | 'xpath' | 'testid' | 'role';
  value?: string;
  url?: string;
  screenshot?: string; // base64
  context: {
    tagName: string;
    textContent?: string;
    attributes: Record<string, string>;
  };
}

export interface RecorderSession {
  id: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  actions: RecordedAction[];
  screenshots: string[];
}

// ============================================================================
// SKILL/PLUGIN TYPES
// ============================================================================

export interface Skill<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon?: string;
  category: 'browser' | 'data' | 'ai' | 'integration' | 'utility';
  permissions: SkillPermission[];
  inputs: SkillParameter[];
  outputs: SkillParameter[];
  run: (input: TInput, context: SkillContext) => Promise<TOutput>;
}

export type SkillPermission =
  | 'network'           // Hacer requests HTTP
  | 'dom_read'          // Leer DOM
  | 'dom_write'         // Modificar DOM
  | 'storage'           // Acceso a storage
  | 'clipboard'         // Acceso a clipboard
  | 'notifications'     // Mostrar notificaciones
  | 'file_system'       // Acceso a archivos
  | 'execute_code';     // Ejecutar código arbitrario

export interface SkillParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  description: string;
  required: boolean;
  default?: any;
  validation?: {
    pattern?: string; // regex
    min?: number;
    max?: number;
    enum?: any[];
  };
}

export interface SkillContext {
  flowId: string;
  executionId: string;
  nodeId: string;
  variables: Record<string, any>;
  browser: BrowserContext;
  storage: StorageContext;
  logger: Logger;
}

export interface BrowserContext {
  navigate: (url: string) => Promise<void>;
  click: (selector: string) => Promise<void>;
  type: (selector: string, text: string) => Promise<void>;
  extract: (selector: string) => Promise<any>;
  evaluate: (code: string) => Promise<any>;
  screenshot: (options?: ScreenshotOptions) => Promise<string>;
}

export interface StorageContext {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  list: () => Promise<string[]>;
}

export interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: Error) => void;
  debug: (message: string, data?: any) => void;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// ============================================================================
// UI TYPES
// ============================================================================

export interface NodeTemplate {
  type: NodeType;
  label: string;
  description: string;
  icon: string | React.ReactNode;
  category: 'trigger' | 'action' | 'logic' | 'data' | 'integration';
  defaultConfig: Partial<NodeConfig>;
}

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  flow: Omit<Flow, 'id' | 'createdAt' | 'updatedAt'>;
}

// ============================================================================
// EXPORT
// ============================================================================

export interface FlowExport {
  version: string;
  flow: Flow;
  skills: Skill[];
  exportedAt: number;
}
