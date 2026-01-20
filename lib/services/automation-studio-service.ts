/**
 * Automation Studio Service - Visual Flow Builder Integration Layer
 * CUBE Nexum v7 - Complete Automation Studio Operations Service
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types
// ============================================================================

export interface Flow {
  id: string;
  name: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
  variables?: FlowVariable[];
  settings?: FlowSettings;
}

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
}

export type NodeType = 
  | 'trigger' 
  | 'action' 
  | 'condition' 
  | 'loop' 
  | 'wait' 
  | 'data' 
  | 'storage' 
  | 'api' 
  | 'notification';

export interface NodeData {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  nodeType: NodeType;
  config: Record<string, unknown>;
  status: NodeStatus;
  error?: string;
  output?: unknown;
}

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped';

export interface FlowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: unknown;
  description?: string;
}

export interface FlowSettings {
  timeout?: number;
  retryOnError?: boolean;
  maxRetries?: number;
  parallelExecution?: boolean;
}

export interface FlowExecution {
  id: string;
  flowId: string;
  status: ExecutionStatus;
  startedAt: number;
  completedAt?: number;
  nodeResults: NodeResult[];
  error?: string;
  variables?: Record<string, unknown>;
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface NodeResult {
  nodeId: string;
  status: NodeStatus;
  startedAt: number;
  completedAt?: number;
  output?: unknown;
  error?: string;
}

export interface RecordingSession {
  id: string;
  flowId?: string;
  actions: RecordedAction[];
  startedAt: number;
  status: 'recording' | 'paused' | 'stopped';
}

export interface RecordedAction {
  id: string;
  type: string;
  target?: string;
  value?: string;
  timestamp: number;
  screenshot?: string;
}

// ============================================================================
// Flow Management Service
// ============================================================================

export const FlowManagementService = {
  /**
   * Get all saved flows
   */
  getFlows: async (): Promise<Flow[]> => {
    return invoke<Flow[]>('automation_get_flows');
  },

  /**
   * Get a specific flow by ID
   */
  getFlow: async (flowId: string): Promise<Flow> => {
    return invoke<Flow>('automation_get_flow', { flowId });
  },

  /**
   * Save a flow
   */
  saveFlow: async (flow: Flow): Promise<void> => {
    return invoke('automation_save_flow', { flow });
  },

  /**
   * Delete a flow
   */
  deleteFlow: async (flowId: string): Promise<void> => {
    return invoke('automation_delete_flow', { flowId });
  },

  /**
   * Duplicate a flow
   */
  duplicateFlow: async (flowId: string): Promise<Flow> => {
    return invoke<Flow>('automation_duplicate_flow', { flowId });
  },

  /**
   * Import flow from JSON
   */
  importFlow: async (json: string): Promise<Flow> => {
    return invoke<Flow>('automation_import_flow', { json });
  },

  /**
   * Export flow to JSON
   */
  exportFlow: async (flowId: string): Promise<string> => {
    return invoke<string>('automation_export_flow', { flowId });
  },
};

// ============================================================================
// Flow Execution Service
// ============================================================================

export const FlowExecutionService = {
  /**
   * Execute a flow
   */
  executeFlow: async (flow: Flow, variables?: Record<string, unknown>): Promise<FlowExecution> => {
    return invoke<FlowExecution>('automation_execute_flow', { flow, variables });
  },

  /**
   * Execute a single node
   */
  executeNode: async (
    node: FlowNode, 
    context: Record<string, unknown>
  ): Promise<NodeResult> => {
    return invoke<NodeResult>('automation_execute_node', { node, context });
  },

  /**
   * Get execution status
   */
  getExecutionStatus: async (executionId: string): Promise<FlowExecution> => {
    return invoke<FlowExecution>('automation_get_execution_status', { executionId });
  },

  /**
   * Cancel a running execution
   */
  cancelExecution: async (executionId: string): Promise<void> => {
    return invoke('automation_cancel_execution', { executionId });
  },

  /**
   * Get execution history for a flow
   */
  getExecutionHistory: async (flowId: string, limit?: number): Promise<FlowExecution[]> => {
    return invoke<FlowExecution[]>('automation_get_execution_history', { flowId, limit });
  },

  /**
   * Retry a failed execution
   */
  retryExecution: async (executionId: string): Promise<FlowExecution> => {
    return invoke<FlowExecution>('automation_retry_execution', { executionId });
  },
};

// ============================================================================
// Recording Service
// ============================================================================

export const RecordingService = {
  /**
   * Start recording actions
   */
  startRecording: async (): Promise<RecordingSession> => {
    return invoke<RecordingSession>('automation_start_recording');
  },

  /**
   * Stop recording
   */
  stopRecording: async (sessionId: string): Promise<RecordedAction[]> => {
    return invoke<RecordedAction[]>('automation_stop_recording', { sessionId });
  },

  /**
   * Pause recording
   */
  pauseRecording: async (sessionId: string): Promise<void> => {
    return invoke('automation_pause_recording', { sessionId });
  },

  /**
   * Resume recording
   */
  resumeRecording: async (sessionId: string): Promise<void> => {
    return invoke('automation_resume_recording', { sessionId });
  },

  /**
   * Convert recorded actions to flow
   */
  convertToFlow: async (actions: RecordedAction[], name: string): Promise<Flow> => {
    return invoke<Flow>('automation_convert_recording_to_flow', { actions, name });
  },

  /**
   * Get recording status
   */
  getRecordingStatus: async (sessionId: string): Promise<RecordingSession> => {
    return invoke<RecordingSession>('automation_get_recording_status', { sessionId });
  },
};

// ============================================================================
// Template Service
// ============================================================================

export const TemplateService = {
  /**
   * Get available flow templates
   */
  getTemplates: async (): Promise<Flow[]> => {
    return invoke<Flow[]>('automation_get_templates');
  },

  /**
   * Create flow from template
   */
  createFromTemplate: async (templateId: string, name: string): Promise<Flow> => {
    return invoke<Flow>('automation_create_from_template', { templateId, name });
  },

  /**
   * Save flow as template
   */
  saveAsTemplate: async (flow: Flow, category?: string): Promise<void> => {
    return invoke('automation_save_as_template', { flow, category });
  },
};

// ============================================================================
// AI Flow Builder Service
// ============================================================================

export const AIFlowBuilderService = {
  /**
   * Generate flow from natural language description
   */
  generateFlow: async (description: string): Promise<Flow> => {
    return invoke<Flow>('automation_ai_generate_flow', { description });
  },

  /**
   * Get AI suggestions for improving a flow
   */
  getSuggestions: async (flow: Flow): Promise<string[]> => {
    return invoke<string[]>('automation_ai_get_suggestions', { flow });
  },

  /**
   * Optimize a flow with AI
   */
  optimizeFlow: async (flow: Flow): Promise<Flow> => {
    return invoke<Flow>('automation_ai_optimize_flow', { flow });
  },

  /**
   * Explain what a flow does
   */
  explainFlow: async (flow: Flow): Promise<string> => {
    return invoke<string>('automation_ai_explain_flow', { flow });
  },
};

// ============================================================================
// Main Automation Studio Service Export
// ============================================================================

export const AutomationStudioService = {
  Flow: FlowManagementService,
  Execution: FlowExecutionService,
  Recording: RecordingService,
  Template: TemplateService,
  AI: AIFlowBuilderService,
};

export default AutomationStudioService;
