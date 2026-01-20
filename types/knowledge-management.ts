// ============================================================================
// KNOWLEDGE MANAGEMENT - Type Definitions
// Advanced knowledge management with AI-powered features
// ============================================================================

// ============================================================================
// AI AGENTS TYPES
// ============================================================================

export type AgentType = 'research' | 'writer' | 'analyst' | 'assistant' | 'custom';
export type AgentStatus = 'idle' | 'working' | 'paused' | 'completed' | 'error';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AIAgent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  avatar?: string;
  model: string;
  systemPrompt: string;
  capabilities: string[];
  status: AgentStatus;
  currentTask?: AgentTask;
  tasksCompleted: number;
  tokensUsed: number;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface AgentTask {
  id: string;
  agentId: string;
  title: string;
  description: string;
  type: 'research' | 'write' | 'analyze' | 'summarize' | 'extract' | 'custom';
  priority: TaskPriority;
  status: AgentStatus;
  input: string;
  output?: string;
  sources?: string[];
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface AgentConversation {
  id: string;
  agentId: string;
  messages: {
    role: 'user' | 'agent' | 'system';
    content: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }[];
  context: string[];
  createdAt: Date;
}

export interface AIAgentsConfig {
  enabled: boolean;
  maxConcurrentTasks: number;
  defaultModel: string;
  autoSaveOutputs: boolean;
  enableStreaming: boolean;
  contextWindow: number;
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

// ============================================================================
// GRAPH VIEW TYPES
// ============================================================================

export type NodeType = 'note' | 'document' | 'tag' | 'person' | 'project' | 'concept' | 'external' | 'link' | 'folder' | 'date' | 'image';
export type LinkType = 'reference' | 'parent' | 'related' | 'mentions' | 'tagged' | 'hierarchy' | 'mention' | 'author' | 'similar';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  content?: string;
  title?: string;
  preview?: string;
  tags?: string[];
  connections?: number;
  color?: string;
  x?: number;
  y?: number;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    wordCount?: number;
    linkCount?: number;
    backlinks?: number;
    tags?: string[];
    color?: string;
  };
  position?: { x: number; y: number };
  size?: number;
  visible: boolean;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: LinkType;
  label?: string;
  strength: number;
  bidirectional?: boolean;
}

export interface GraphFilter {
  nodeTypes: NodeType[];
  linkTypes: LinkType[];
  tags: string[];
  dateRange?: { start: Date; end: Date };
  searchQuery?: string;
  minLinks?: number;
  showOrphans?: boolean;
}

export type GraphLayout = 'force' | 'hierarchical' | 'radial' | 'grid' | 'circular';

export interface GraphLayoutConfig {
  type: GraphLayout;
  spacing: number;
  linkDistance: number;
  nodeRepulsion: number;
  centerStrength: number;
}

export interface GraphViewConfig {
  enabled: boolean;
  layout: GraphLayout;
  filters: GraphFilter;
  showLabels?: boolean;
  linkStrengthThreshold?: number;
  display: {
    showLabels: boolean;
    showLinkLabels: boolean;
    showNodeSize: boolean;
    colorByType: boolean;
    highlightConnected: boolean;
    animateLayout: boolean;
  };
  physics: {
    enabled: boolean;
    gravity?: number;
    friction?: number;
    repulsion?: number;
    springLength?: number;
    springStrength?: number;
  };
}

// ============================================================================
// CANVAS TYPES
// ============================================================================

export type CanvasItemType = 'note' | 'card' | 'image' | 'embed' | 'file' | 'group' | 'link' | 'text' | 'shape' | 'drawing';
export type CanvasConnectionType = 'arrow' | 'line' | 'dashed';

export interface CanvasItem {
  id: string;
  type: CanvasItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color?: string;
  file?: string;
  url?: string;
  children?: string[];
  collapsed?: boolean;
  locked?: boolean;
  zIndex: number;
  createdAt?: Date;
  updatedAt?: Date;
  style?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fontSize?: number;
    fontWeight?: string;
    opacity?: number;
    borderRadius?: number;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    textAlign?: string;
  };
}

export interface CanvasConnection {
  id: string;
  sourceId?: string;
  targetId?: string;
  fromId?: string;
  toId?: string;
  sourceAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  targetAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  type: CanvasConnectionType;
  color?: string;
  label?: string;
}

export interface Canvas {
  id: string;
  name: string;
  description?: string;
  items: CanvasItem[];
  connections: CanvasConnection[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  background?: string;
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
  createdAt: Date;
  updatedAt: Date;
  settings?: CanvasConfig;
}

export interface CanvasConfig {
  enabled: boolean;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  gridEnabled: boolean;
  enableGrid?: boolean;
  snapToGrid: boolean;
  gridSize: number;
  autoSave: boolean;
  saveInterval: number;
  defaultCardColor: string;
  showMinimap: boolean;
  showRulers?: boolean;
  defaultItemStyle?: Record<string, unknown>;
}

// ============================================================================
// TEMPLATES TYPES
// ============================================================================

export type TemplateCategory = 'note' | 'project' | 'meeting' | 'research' | 'journal' | 'custom' | 'work' | 'personal' | 'education';

export interface TemplateVariable {
  id?: string;
  name: string;
  type: 'text' | 'date' | 'select' | 'multiselect' | 'number' | 'checkbox' | 'textarea' | 'list';
  label: string;
  description?: string;
  defaultValue?: string | number | boolean;
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  content: string;
  variables: TemplateVariable[];
  frontmatter?: Record<string, unknown>;
  tags?: string[];
  icon?: string;
  color?: string;
  usageCount?: number;
  isBuiltIn?: boolean;
  isFavorite?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateInstance {
  id: string;
  templateId: string;
  name: string;
  values: Record<string, string | number | boolean>;
  content: string;
  createdAt: Date;
}

export interface TemplatesConfig {
  enabled: boolean;
  defaultFolder: string;
  dateFormat: string;
  autoInsertDate: boolean;
  showCategoryIcons: boolean;
  sortBy: 'name' | 'usage' | 'created' | 'updated';
}

// ============================================================================
// WEB CLIPPER TYPES
// ============================================================================

export type ClipType = 'full' | 'article' | 'selection' | 'screenshot' | 'bookmark' | 'page' | 'image' | 'video';
export type ClipFormat = 'markdown' | 'html' | 'text' | 'pdf' | 'screenshot';

export interface WebClip {
  id: string;
  type: ClipType;
  format: ClipFormat;
  title: string;
  url: string;
  domain?: string;
  content: string;
  excerpt?: string;
  thumbnail?: string;
  author?: string;
  publishedAt?: Date;
  images?: string[];
  tags: string[];
  highlights?: {
    id: string;
    text: string;
    color: string;
    note?: string;
    position?: number | { x: number; y: number };
  }[];
  annotations?: Array<string | { id: string; type: string; content: string; position?: { x: number; y: number } }>;
  folder?: string;
  status?: 'inbox' | 'reading' | 'archive' | 'favorite';
  isFavorite?: boolean;
  isArchived?: boolean;
  readProgress?: number;
  createdAt: Date;
  updatedAt?: Date;
  readAt?: Date;
}

export interface ClipperRule {
  id: string;
  name: string;
  pattern?: string;
  urlPattern?: string;
  isRegex?: boolean;
  clipType?: ClipType;
  clipFormat?: ClipFormat;
  autoTag?: string[];
  autoFolder?: string;
  removeSelectors?: string[];
  action?: {
    format: ClipFormat;
    folder: string;
    tags: string[];
    template?: string;
  };
  isActive?: boolean;
  isEnabled?: boolean;
}

export interface WebClipperConfig {
  enabled: boolean;
  defaultFormat: ClipFormat;
  defaultClipType: ClipType;
  defaultFolder: string;
  autoTagFromDomain: boolean;
  autoExtractMetadata: boolean;
  extractMetadata?: boolean;
  saveImages: boolean;
  imageQuality: 'low' | 'medium' | 'high' | 'original';
  cleanContent: boolean;
  cleanupContent?: boolean;
  removeAds: boolean;
  simplifyLayout: boolean;
  rules: ClipperRule[];
  hotkey: string;
  autoSave?: boolean;
  saveHighlights?: boolean;
}

// ============================================================================
// SEARCH & QUERY TYPES
// ============================================================================

export interface SearchResult {
  id: string;
  type: 'note' | 'document' | 'clip' | 'canvas' | 'template';
  title: string;
  excerpt: string;
  path: string;
  score: number;
  matches: {
    field: string;
    positions: [number, number][];
  }[];
  metadata: Record<string, unknown>;
}

export interface SearchQuery {
  text: string;
  filters: {
    types?: string[];
    tags?: string[];
    folders?: string[];
    dateRange?: { start: Date; end: Date };
  };
  options: {
    fuzzy: boolean;
    caseSensitive: boolean;
    wholeWord: boolean;
    limit: number;
  };
}

// ============================================================================
// SYNC & EXPORT TYPES
// ============================================================================

export interface SyncProvider {
  id: string;
  name: string;
  type: 'git' | 'cloud' | 'webdav' | 's3';
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync?: Date;
  config: Record<string, unknown>;
}

export interface ExportOptions {
  format: 'markdown' | 'html' | 'pdf' | 'docx' | 'json';
  includeMetadata: boolean;
  includeImages: boolean;
  flattenStructure: boolean;
  customTemplate?: string;
}
