/**
 * Workflow Service - CUBE Nexum
 * 
 * Unified service layer for workflow operations including:
 * - Workflow CRUD operations
 * - Workflow execution
 * - Scheduler management
 * - Selector testing and generation
 * 
 * @module WorkflowService
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================
// Types - Workflow
// ============================================

export interface WorkflowNode {
  id: string;
  nodeType: string;
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface NodeExecutionResult {
  nodeId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================
// Types - Scheduler
// ============================================

export interface ScheduledWorkflow {
  id: string;
  workflow_id: string;
  workflow_name: string;
  schedule_type: ScheduleType;
  cron_expression?: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  run_count: number;
  retry_policy: RetryPolicy;
}

export type ScheduleType =
  | { type: 'Cron'; expression?: string }
  | { type: 'Interval'; seconds?: number }
  | { type: 'Once'; at?: string }
  | { type: 'Event'; event_type?: string };

export interface RetryPolicy {
  max_retries: number;
  retry_delay_seconds: number;
  exponential_backoff: boolean;
}

export interface ExecutionQueueItem {
  id: string;
  workflow_id: string;
  scheduled_id: string;
  scheduled_time: string;
  status: 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Retrying' | 'Cancelled';
  retry_count: number;
  error?: string;
}

// ============================================
// Types - Selector
// ============================================

export interface SelectorResult {
  selector: string;
  type: 'css' | 'xpath' | 'text' | 'aria';
  score: number;
  matchCount: number;
  elements: string[];
  robustness: 'low' | 'medium' | 'high';
}

export interface AIAlternative {
  selector: string;
  reasoning: string;
  score: number;
  autoHealing: boolean;
}

export interface SelectorContext {
  domStructure: string[];
  currentScore: number;
}

export interface AutoHealingOptions {
  fallbackCount: number;
  includeXPath: boolean;
  includeCss: boolean;
  includeText: boolean;
}

export interface ElementSelection {
  selector: string;
  type: string;
}

// ============================================
// Workflow Service
// ============================================

export const WorkflowCoreService = {
  /**
   * Save a workflow
   */
  async save(workflow: Workflow): Promise<void> {
    return invoke<void>('workflow_save', { workflow });
  },

  /**
   * Load a workflow by ID
   */
  async load(workflowId: string): Promise<Workflow> {
    return invoke<Workflow>('workflow_load', { workflowId });
  },

  /**
   * List all workflows
   */
  async list(): Promise<Workflow[]> {
    return invoke<Workflow[]>('workflow_list');
  },

  /**
   * Delete a workflow
   */
  async delete(workflowId: string): Promise<void> {
    return invoke<void>('workflow_delete', { workflowId });
  },

  /**
   * Execute a workflow
   */
  async execute(workflowId: string): Promise<void> {
    return invoke<void>('workflow_execute', { workflowId });
  },

  /**
   * Execute a single node
   */
  async executeNode(nodeId: string, nodeType: string, data: Record<string, unknown>): Promise<NodeExecutionResult> {
    return invoke<NodeExecutionResult>('execute_node', { nodeId, nodeType, data });
  },
};

// ============================================
// Scheduler Service
// ============================================

export const SchedulerService = {
  /**
   * Get all scheduled workflows
   */
  async getSchedules(): Promise<ScheduledWorkflow[]> {
    return invoke<ScheduledWorkflow[]>('scheduler_get_schedules');
  },

  /**
   * Get execution queue
   */
  async getQueue(): Promise<ExecutionQueueItem[]> {
    return invoke<ExecutionQueueItem[]>('scheduler_get_queue');
  },

  /**
   * Add a new schedule
   */
  async addSchedule(schedule: ScheduledWorkflow): Promise<void> {
    return invoke<void>('scheduler_add_schedule', { schedule });
  },

  /**
   * Remove a schedule
   */
  async removeSchedule(scheduleId: string): Promise<void> {
    return invoke<void>('scheduler_remove_schedule', { scheduleId });
  },

  /**
   * Toggle schedule enabled status
   */
  async toggleSchedule(scheduleId: string, enabled: boolean): Promise<void> {
    return invoke<void>('scheduler_toggle_schedule', { scheduleId, enabled });
  },

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    return invoke<void>('scheduler_start');
  },

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    return invoke<void>('scheduler_stop');
  },

  /**
   * Validate a cron expression
   */
  async validateCron(cronExpression: string): Promise<string[]> {
    return invoke<string[]>('scheduler_validate_cron', { cronExpression });
  },

  /**
   * Cancel a queued or running execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    return invoke<void>('scheduler_cancel_execution', { executionId });
  },
};

// ============================================
// Selector Service
// ============================================

export const SelectorService = {
  /**
   * Test a selector against a page
   */
  async test(selector: string, selectorType: string, url: string): Promise<SelectorResult> {
    return invoke<SelectorResult>('test_selector', { selector, selectorType, url });
  },

  /**
   * Generate AI-powered selector alternatives
   */
  async generateAlternatives(
    currentSelector: string,
    pageUrl: string,
    context: SelectorContext
  ): Promise<AIAlternative[]> {
    return invoke<AIAlternative[]>('generate_ai_selector_alternatives', {
      currentSelector,
      pageUrl,
      context,
    });
  },

  /**
   * Start visual selector picker in browser
   */
  async startVisualPicker(url: string): Promise<void> {
    return invoke<void>('start_visual_selector_picker', { url });
  },

  /**
   * Wait for user element selection
   */
  async waitForElementSelection(): Promise<ElementSelection> {
    return invoke<ElementSelection>('wait_for_element_selection');
  },

  /**
   * Generate auto-healing selector
   */
  async generateAutoHealing(
    selector: string,
    pageUrl: string,
    options: AutoHealingOptions
  ): Promise<string> {
    return invoke<string>('generate_auto_healing_selector', {
      selector,
      pageUrl,
      options,
    });
  },
};

// ============================================
// Combined Workflow Service Export
// ============================================

export const WorkflowService = {
  Core: WorkflowCoreService,
  Scheduler: SchedulerService,
  Selector: SelectorService,
};

export default WorkflowService;
