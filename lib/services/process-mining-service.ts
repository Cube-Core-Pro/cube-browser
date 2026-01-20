/**
 * Process Mining Service - Business Process Discovery and Analysis
 *
 * Provides automated discovery of business processes from user actions,
 * process optimization suggestions, and Process Definition Document (PDD) generation.
 *
 * M5 Features:
 * - Automatic process discovery from recordings
 * - Process mining algorithms (Alpha, Heuristic, Inductive)
 * - Bottleneck detection and optimization
 * - Conformance checking
 * - PDD generation in multiple formats
 * - Process simulation
 *
 * @module ProcessMiningService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService, SpanKind } from './telemetry-service';
import type { RecordedAction, Flow, FlowNode as _FlowNode } from './automation-studio-service';

// Re-export for potential future use
export type { _FlowNode };

// ============================================================================
// Types
// ============================================================================

export interface ProcessModel {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Process name
   */
  name: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Activities in the process
   */
  activities: ProcessActivity[];

  /**
   * Transitions between activities
   */
  transitions: ProcessTransition[];

  /**
   * Start activities
   */
  startActivities: string[];

  /**
   * End activities
   */
  endActivities: string[];

  /**
   * Process metadata
   */
  metadata: ProcessMetadata;

  /**
   * Process variants discovered
   */
  variants: ProcessVariant[];

  /**
   * Performance metrics
   */
  performance: ProcessPerformance;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last update timestamp
   */
  updatedAt: number;
}

export interface ProcessActivity {
  /**
   * Activity ID
   */
  id: string;

  /**
   * Activity name
   */
  name: string;

  /**
   * Activity type
   */
  type: ActivityType;

  /**
   * Frequency count
   */
  frequency: number;

  /**
   * Average duration (ms)
   */
  avgDuration: number;

  /**
   * Min duration
   */
  minDuration: number;

  /**
   * Max duration
   */
  maxDuration: number;

  /**
   * Associated selector or action
   */
  action?: string;

  /**
   * Target element/URL
   */
  target?: string;

  /**
   * Activity properties
   */
  properties: Record<string, unknown>;
}

export type ActivityType =
  | 'click'
  | 'input'
  | 'navigation'
  | 'wait'
  | 'validation'
  | 'decision'
  | 'loop'
  | 'api-call'
  | 'data-entry'
  | 'document'
  | 'custom';

export interface ProcessTransition {
  /**
   * Source activity ID
   */
  source: string;

  /**
   * Target activity ID
   */
  target: string;

  /**
   * Transition frequency
   */
  frequency: number;

  /**
   * Probability (0-1)
   */
  probability: number;

  /**
   * Average time between activities (ms)
   */
  avgTime: number;

  /**
   * Condition for transition (if any)
   */
  condition?: string;
}

export interface ProcessMetadata {
  /**
   * Mining algorithm used
   */
  algorithm: MiningAlgorithm;

  /**
   * Number of traces analyzed
   */
  tracesAnalyzed: number;

  /**
   * Total events processed
   */
  eventsProcessed: number;

  /**
   * Date range of data
   */
  dateRange: {
    start: number;
    end: number;
  };

  /**
   * Fitness score (0-1)
   */
  fitness: number;

  /**
   * Precision score (0-1)
   */
  precision: number;

  /**
   * Simplicity score (0-1)
   */
  simplicity: number;

  /**
   * Generalization score (0-1)
   */
  generalization: number;
}

export type MiningAlgorithm =
  | 'alpha'
  | 'alpha-plus'
  | 'heuristic'
  | 'inductive'
  | 'fuzzy'
  | 'genetic';

export interface ProcessVariant {
  /**
   * Variant ID
   */
  id: string;

  /**
   * Variant name/description
   */
  name: string;

  /**
   * Activity sequence
   */
  sequence: string[];

  /**
   * Number of cases following this variant
   */
  caseCount: number;

  /**
   * Percentage of total cases
   */
  percentage: number;

  /**
   * Average throughput time (ms)
   */
  avgThroughputTime: number;
}

export interface ProcessPerformance {
  /**
   * Average case duration (ms)
   */
  avgCaseDuration: number;

  /**
   * Median case duration
   */
  medianCaseDuration: number;

  /**
   * 90th percentile duration
   */
  p90Duration: number;

  /**
   * Throughput (cases per hour)
   */
  throughput: number;

  /**
   * Bottleneck activities
   */
  bottlenecks: Bottleneck[];

  /**
   * Rework rate
   */
  reworkRate: number;

  /**
   * Automation potential score (0-100)
   */
  automationPotential: number;
}

export interface Bottleneck {
  /**
   * Activity ID
   */
  activityId: string;

  /**
   * Bottleneck severity (0-100)
   */
  severity: number;

  /**
   * Average wait time
   */
  avgWaitTime: number;

  /**
   * Queue length (average)
   */
  avgQueueLength: number;

  /**
   * Suggested improvements
   */
  suggestions: string[];
}

export interface ProcessTrace {
  /**
   * Trace ID
   */
  id: string;

  /**
   * Case ID
   */
  caseId: string;

  /**
   * Events in the trace
   */
  events: ProcessEvent[];

  /**
   * Trace start time
   */
  startTime: number;

  /**
   * Trace end time
   */
  endTime: number;

  /**
   * Total duration
   */
  duration: number;

  /**
   * Variant ID
   */
  variantId?: string;
}

export interface ProcessEvent {
  /**
   * Event ID
   */
  id: string;

  /**
   * Activity name
   */
  activity: string;

  /**
   * Timestamp
   */
  timestamp: number;

  /**
   * Resource/user who performed
   */
  resource?: string;

  /**
   * Additional attributes
   */
  attributes: Record<string, unknown>;
}

export interface ConformanceResult {
  /**
   * Overall conformance score (0-1)
   */
  score: number;

  /**
   * Fitness value
   */
  fitness: number;

  /**
   * Precision value
   */
  precision: number;

  /**
   * Number of deviations found
   */
  deviationCount: number;

  /**
   * Detailed deviations
   */
  deviations: ProcessDeviation[];

  /**
   * Traces that deviate
   */
  deviatingTraces: string[];
}

export interface ProcessDeviation {
  /**
   * Deviation type
   */
  type: 'missing' | 'additional' | 'wrong-order' | 'wrong-resource';

  /**
   * Activity involved
   */
  activity: string;

  /**
   * Expected behavior
   */
  expected?: string;

  /**
   * Actual behavior
   */
  actual?: string;

  /**
   * Frequency of this deviation
   */
  frequency: number;

  /**
   * Impact assessment
   */
  impact: 'low' | 'medium' | 'high';
}

export interface PDDDocument {
  /**
   * Document metadata
   */
  metadata: PDDMetadata;

  /**
   * Process overview
   */
  overview: PDDOverview;

  /**
   * Detailed steps
   */
  steps: PDDStep[];

  /**
   * Business rules
   */
  businessRules: PDDBusinessRule[];

  /**
   * Exceptions and error handling
   */
  exceptions: PDDException[];

  /**
   * Data requirements
   */
  dataRequirements: PDDDataRequirement[];

  /**
   * System interactions
   */
  systemInteractions: PDDSystemInteraction[];

  /**
   * Appendices
   */
  appendices: PDDAppendix[];
}

export interface PDDMetadata {
  title: string;
  version: string;
  author: string;
  department?: string;
  createdDate: string;
  lastModified: string;
  status: 'draft' | 'review' | 'approved';
  approvedBy?: string;
  approvalDate?: string;
}

export interface PDDOverview {
  processName: string;
  processId: string;
  businessOwner: string;
  processDescription: string;
  scope: string;
  objectives: string[];
  stakeholders: string[];
  triggerEvents: string[];
  outputs: string[];
  kpis: PDDKpi[];
}

export interface PDDKpi {
  name: string;
  description: string;
  target: string;
  currentValue?: string;
  unit: string;
}

export interface PDDStep {
  stepNumber: number;
  name: string;
  description: string;
  actor: string;
  system?: string;
  inputs: string[];
  outputs: string[];
  businessRules: string[];
  screenShot?: string;
  notes?: string;
  estimatedTime?: string;
}

export interface PDDBusinessRule {
  id: string;
  name: string;
  description: string;
  type: 'validation' | 'calculation' | 'decision' | 'constraint';
  appliesTo: string[];
}

export interface PDDException {
  id: string;
  name: string;
  description: string;
  trigger: string;
  handling: string;
  escalation?: string;
}

export interface PDDDataRequirement {
  field: string;
  description: string;
  dataType: string;
  source: string;
  required: boolean;
  validationRules?: string[];
}

export interface PDDSystemInteraction {
  system: string;
  type: 'input' | 'output' | 'bidirectional';
  description: string;
  frequency: string;
  dataElements: string[];
}

export interface PDDAppendix {
  title: string;
  type: 'screenshot' | 'diagram' | 'table' | 'reference';
  content: string;
}

export type PDDFormat = 'markdown' | 'html' | 'docx' | 'pdf' | 'json';

// ============================================================================
// Process Mining Service
// ============================================================================

export const ProcessMiningService = {
  /**
   * Discover process model from recorded actions
   */
  discoverProcess: async (
    actions: RecordedAction[],
    options?: {
      algorithm?: MiningAlgorithm;
      name?: string;
      minFrequency?: number;
    }
  ): Promise<ProcessModel> => {
    const spanId = TelemetryService.startSpan('processmining.discover', {
      kind: SpanKind.CLIENT,
      attributes: {
        'mining.algorithm': options?.algorithm || 'heuristic',
        'mining.actionCount': actions.length,
      },
    });

    try {
      const result = await invoke<ProcessModel>('automation_discover_process', {
        actions,
        algorithm: options?.algorithm || 'heuristic',
        name: options?.name || 'Discovered Process',
        minFrequency: options?.minFrequency || 1,
      });

      TelemetryService.trackEvent('process_discovered', {
        algorithm: options?.algorithm || 'heuristic',
        activityCount: result.activities.length,
        variantCount: result.variants.length,
      });

      TelemetryService.endSpan(spanId);
      return result;
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) });
      throw error;
    }
  },

  /**
   * Import event log for process mining
   */
  importEventLog: async (
    data: string,
    format: 'csv' | 'xes' | 'json'
  ): Promise<ProcessTrace[]> => {
    return invoke<ProcessTrace[]>('automation_import_event_log', {
      data,
      format,
    });
  },

  /**
   * Export event log
   */
  exportEventLog: async (
    traces: ProcessTrace[],
    format: 'csv' | 'xes' | 'json'
  ): Promise<string> => {
    return invoke<string>('automation_export_event_log', { traces, format });
  },

  /**
   * Analyze process performance
   */
  analyzePerformance: async (
    processId: string
  ): Promise<ProcessPerformance> => {
    return invoke<ProcessPerformance>('automation_analyze_process_performance', {
      processId,
    });
  },

  /**
   * Detect bottlenecks in a process
   */
  detectBottlenecks: async (processId: string): Promise<Bottleneck[]> => {
    return invoke<Bottleneck[]>('automation_detect_bottlenecks', { processId });
  },

  /**
   * Check conformance of traces against a process model
   */
  checkConformance: async (
    processId: string,
    traces: ProcessTrace[]
  ): Promise<ConformanceResult> => {
    return invoke<ConformanceResult>('automation_check_conformance', {
      processId,
      traces,
    });
  },

  /**
   * Get process variants
   */
  getVariants: async (processId: string): Promise<ProcessVariant[]> => {
    return invoke<ProcessVariant[]>('automation_get_process_variants', {
      processId,
    });
  },

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions: async (
    processId: string
  ): Promise<OptimizationSuggestion[]> => {
    return invoke<OptimizationSuggestion[]>(
      'automation_get_optimization_suggestions',
      { processId }
    );
  },

  /**
   * Save process model
   */
  saveProcess: async (process: ProcessModel): Promise<void> => {
    return invoke('automation_save_process_model', { process });
  },

  /**
   * Get process model
   */
  getProcess: async (processId: string): Promise<ProcessModel | null> => {
    return invoke<ProcessModel | null>('automation_get_process_model', {
      processId,
    });
  },

  /**
   * Get all process models
   */
  getAllProcesses: async (): Promise<ProcessModel[]> => {
    return invoke<ProcessModel[]>('automation_get_all_process_models');
  },

  /**
   * Delete process model
   */
  deleteProcess: async (processId: string): Promise<void> => {
    return invoke('automation_delete_process_model', { processId });
  },

  /**
   * Convert process to automation flow
   */
  convertToFlow: async (processId: string): Promise<Flow> => {
    return invoke<Flow>('automation_convert_process_to_flow', { processId });
  },

  /**
   * Simulate process execution
   */
  simulate: async (
    processId: string,
    parameters: {
      caseCount: number;
      duration: number;
      resourceConfig?: Record<string, number>;
    }
  ): Promise<SimulationResult> => {
    return invoke<SimulationResult>('automation_simulate_process', {
      processId,
      ...parameters,
    });
  },
};

// ============================================================================
// PDD Generation Service
// ============================================================================

export const PDDGenerationService = {
  /**
   * Generate PDD from process model
   */
  generatePDD: async (
    processId: string,
    options?: {
      format?: PDDFormat;
      includeScreenshots?: boolean;
      author?: string;
      department?: string;
    }
  ): Promise<PDDDocument> => {
    const spanId = TelemetryService.startSpan('pdd.generate', {
      kind: SpanKind.CLIENT,
      attributes: {
        'pdd.format': options?.format || 'markdown',
      },
    });

    try {
      const result = await invoke<PDDDocument>('automation_generate_pdd', {
        processId,
        format: options?.format || 'markdown',
        includeScreenshots: options?.includeScreenshots ?? true,
        author: options?.author || 'System',
        department: options?.department,
      });

      TelemetryService.trackEvent('pdd_generated', {
        format: options?.format || 'markdown',
        stepCount: result.steps.length,
      });

      TelemetryService.endSpan(spanId);
      return result;
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) });
      throw error;
    }
  },

  /**
   * Generate PDD from recorded actions
   */
  generatePDDFromRecording: async (
    actions: RecordedAction[],
    metadata: Partial<PDDMetadata>
  ): Promise<PDDDocument> => {
    return invoke<PDDDocument>('automation_generate_pdd_from_recording', {
      actions,
      metadata,
    });
  },

  /**
   * Export PDD to specific format
   */
  exportPDD: async (
    pdd: PDDDocument,
    format: PDDFormat
  ): Promise<string | Blob> => {
    if (format === 'json') {
      return JSON.stringify(pdd, null, 2);
    }
    return invoke<string>('automation_export_pdd', { pdd, format });
  },

  /**
   * Update PDD metadata
   */
  updatePDDMetadata: async (
    pddId: string,
    metadata: Partial<PDDMetadata>
  ): Promise<void> => {
    return invoke('automation_update_pdd_metadata', { pddId, metadata });
  },

  /**
   * Add step to PDD
   */
  addPDDStep: async (
    pddId: string,
    step: Omit<PDDStep, 'stepNumber'>,
    afterStep?: number
  ): Promise<PDDDocument> => {
    return invoke<PDDDocument>('automation_add_pdd_step', {
      pddId,
      step,
      afterStep,
    });
  },

  /**
   * Update PDD step
   */
  updatePDDStep: async (
    pddId: string,
    stepNumber: number,
    updates: Partial<PDDStep>
  ): Promise<PDDDocument> => {
    return invoke<PDDDocument>('automation_update_pdd_step', {
      pddId,
      stepNumber,
      updates,
    });
  },

  /**
   * Delete PDD step
   */
  deletePDDStep: async (
    pddId: string,
    stepNumber: number
  ): Promise<PDDDocument> => {
    return invoke<PDDDocument>('automation_delete_pdd_step', {
      pddId,
      stepNumber,
    });
  },

  /**
   * Add business rule to PDD
   */
  addBusinessRule: async (
    pddId: string,
    rule: Omit<PDDBusinessRule, 'id'>
  ): Promise<PDDDocument> => {
    return invoke<PDDDocument>('automation_add_pdd_business_rule', {
      pddId,
      rule,
    });
  },

  /**
   * Add exception to PDD
   */
  addException: async (
    pddId: string,
    exception: Omit<PDDException, 'id'>
  ): Promise<PDDDocument> => {
    return invoke<PDDDocument>('automation_add_pdd_exception', {
      pddId,
      exception,
    });
  },

  /**
   * Use AI to enhance PDD
   */
  aiEnhancePDD: async (pdd: PDDDocument): Promise<PDDDocument> => {
    return invoke<PDDDocument>('automation_ai_enhance_pdd', { pdd });
  },

  /**
   * Use AI to generate business rules from process
   */
  aiGenerateBusinessRules: async (
    processId: string
  ): Promise<PDDBusinessRule[]> => {
    return invoke<PDDBusinessRule[]>('automation_ai_generate_business_rules', {
      processId,
    });
  },

  /**
   * Validate PDD completeness
   */
  validatePDD: async (pdd: PDDDocument): Promise<PDDValidationResult> => {
    return invoke<PDDValidationResult>('automation_validate_pdd', { pdd });
  },

  /**
   * Get all saved PDDs
   */
  getAllPDDs: async (): Promise<PDDDocument[]> => {
    return invoke<PDDDocument[]>('automation_get_all_pdds');
  },

  /**
   * Get PDD by ID
   */
  getPDD: async (pddId: string): Promise<PDDDocument | null> => {
    return invoke<PDDDocument | null>('automation_get_pdd', { pddId });
  },

  /**
   * Save PDD
   */
  savePDD: async (pdd: PDDDocument): Promise<void> => {
    return invoke('automation_save_pdd', { pdd });
  },

  /**
   * Delete PDD
   */
  deletePDD: async (pddId: string): Promise<void> => {
    return invoke('automation_delete_pdd', { pddId });
  },
};

// ============================================================================
// Additional Types
// ============================================================================

export interface OptimizationSuggestion {
  id: string;
  type: 'eliminate' | 'automate' | 'simplify' | 'parallelize' | 'outsource';
  activity?: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  estimatedSavings?: {
    time: number;
    cost: number;
  };
  priority: number;
}

export interface SimulationResult {
  totalCases: number;
  completedCases: number;
  avgThroughputTime: number;
  resourceUtilization: Record<string, number>;
  bottlenecks: Bottleneck[];
  queueStats: QueueStats[];
  costAnalysis?: CostAnalysis;
}

export interface QueueStats {
  activityId: string;
  avgWaitTime: number;
  maxWaitTime: number;
  avgQueueLength: number;
  maxQueueLength: number;
}

export interface CostAnalysis {
  totalCost: number;
  costPerCase: number;
  laborCost: number;
  resourceCost: number;
  breakdown: Record<string, number>;
}

export interface PDDValidationResult {
  isValid: boolean;
  completeness: number;
  issues: PDDValidationIssue[];
  suggestions: string[];
}

export interface PDDValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  suggestion?: string;
}

// ============================================================================
// Export
// ============================================================================

export const ProcessAutomationService = {
  Mining: ProcessMiningService,
  PDD: PDDGenerationService,
};

export default ProcessAutomationService;
