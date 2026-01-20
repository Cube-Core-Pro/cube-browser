/**
 * CUBE Elite v7 - useAutomation Hook
 * 
 * Centralized React hook for Automation functionality.
 * Combines automationService (macros/autofill) and automation-studio-service (visual flows).
 * 
 * Features:
 * - Flow management (CRUD, import/export, templates)
 * - Flow execution with history
 * - Action recording and playback
 * - Macro management
 * - Autofill profiles
 * - AI flow generation
 * - Real-time execution updates
 * 
 * @module hooks/useAutomation
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { logger } from '@/lib/services/logger-service';
import {
  FlowManagementService,
  FlowExecutionService,
  RecordingService,
  TemplateService,
  AIFlowBuilderService,
  Flow,
  FlowNode,
  FlowEdge,
  FlowExecution,
  ExecutionStatus,
  NodeResult,
  RecordingSession,
  RecordedAction,
} from '@/lib/services/automation-studio-service';
import {
  AutofillProfile,
  Macro,
  MacroStep,
  getProfiles,
  saveProfile,
  deleteProfile,
  getMacros,
  createMacro,
  deleteMacro,
  executeMacro,
  recordMacro,
  stopMacroRecording,
  fillForm,
  detectFields,
  FieldMetadata,
  DetectionResult,
} from '@/lib/services/automationService';

const log = logger.scope('useAutomation');

// =============================================================================
// Types
// =============================================================================

export interface UseAutomationOptions {
  /** Auto-refresh interval in milliseconds */
  autoRefresh?: number;
  /** Enable real-time updates */
  realtime?: boolean;
  /** Initial flow to load */
  initialFlowId?: string;
}

export interface AutomationState {
  // Flows
  flows: Flow[];
  currentFlow: Flow | null;
  templates: Flow[];
  
  // Executions
  executions: FlowExecution[];
  currentExecution: FlowExecution | null;
  
  // Recording
  recordingSession: RecordingSession | null;
  recordedActions: RecordedAction[];
  
  // Macros
  macros: Macro[];
  macroRecordingId: string | null;
  
  // Autofill
  profiles: AutofillProfile[];
}

export interface AutomationLoadingState {
  flows: boolean;
  templates: boolean;
  executions: boolean;
  macros: boolean;
  profiles: boolean;
  executing: boolean;
  recording: boolean;
  aiGenerating: boolean;
  global: boolean;
}

export interface AutomationErrorState {
  flows: string | null;
  executions: string | null;
  macros: string | null;
  profiles: string | null;
  execution: string | null;
  ai: string | null;
}

export interface UseAutomationReturn {
  // State
  data: AutomationState;
  loading: AutomationLoadingState;
  errors: AutomationErrorState;
  
  // Flow Management
  createFlow: (name: string, nodes?: FlowNode[], edges?: FlowEdge[]) => Promise<Flow>;
  updateFlow: (flow: Flow) => Promise<void>;
  deleteFlow: (flowId: string) => Promise<void>;
  duplicateFlow: (flowId: string) => Promise<Flow>;
  loadFlow: (flowId: string) => Promise<Flow>;
  importFlow: (json: string) => Promise<Flow>;
  exportFlow: (flowId: string) => Promise<string>;
  
  // Flow Execution
  executeFlow: (flow?: Flow, variables?: Record<string, unknown>) => Promise<FlowExecution>;
  executeNode: (node: FlowNode, context: Record<string, unknown>) => Promise<NodeResult>;
  cancelExecution: (executionId: string) => Promise<void>;
  retryExecution: (executionId: string) => Promise<FlowExecution>;
  getExecutionHistory: (flowId: string, limit?: number) => Promise<FlowExecution[]>;
  
  // Recording
  startRecording: () => Promise<RecordingSession>;
  stopRecording: () => Promise<RecordedAction[]>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  convertToFlow: (name: string) => Promise<Flow>;
  
  // Templates
  createFromTemplate: (templateId: string, name: string) => Promise<Flow>;
  saveAsTemplate: (flow: Flow, category?: string) => Promise<void>;
  
  // AI
  generateFlowFromDescription: (description: string) => Promise<Flow>;
  getAISuggestions: (flow?: Flow) => Promise<string[]>;
  optimizeFlow: (flow?: Flow) => Promise<Flow>;
  explainFlow: (flow?: Flow) => Promise<string>;
  
  // Macros
  createMacroAction: (name: string, steps: MacroStep[]) => Promise<string>;
  deleteMacroAction: (macroId: string) => Promise<void>;
  executeMacroAction: (macroId: string) => Promise<void>;
  startMacroRecording: (name: string) => Promise<string>;
  stopMacroRecording: (name: string, description?: string) => Promise<Macro>;
  
  // Autofill Profiles
  createProfile: (name: string, data: Record<string, string>, category?: 'personal' | 'business' | 'shipping' | 'payment') => Promise<string>;
  deleteProfileAction: (profileId: string) => Promise<void>;
  fillFormAction: (profileId: string) => Promise<void>;
  detectFormFields: (fieldsMetadata: FieldMetadata[]) => Promise<DetectionResult>;
  
  // Refresh
  refresh: () => Promise<void>;
  refreshFlows: () => Promise<void>;
  refreshMacros: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  
  // Computed
  activeFlows: Flow[];
  recentExecutions: FlowExecution[];
  failedExecutions: FlowExecution[];
  runningExecutions: FlowExecution[];
  isRecording: boolean;
  isExecuting: boolean;
  profilesByCategory: Record<string, AutofillProfile[]>;
}

// =============================================================================
// Cache
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 60000; // 60 seconds
const cache: Map<string, CacheEntry<unknown>> = new Map();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAutomation(options: UseAutomationOptions = {}): UseAutomationReturn {
  const { autoRefresh, realtime = true, initialFlowId } = options;
  
  // State
  const [data, setData] = useState<AutomationState>({
    flows: [],
    currentFlow: null,
    templates: [],
    executions: [],
    currentExecution: null,
    recordingSession: null,
    recordedActions: [],
    macros: [],
    macroRecordingId: null,
    profiles: [],
  });
  
  const [loading, setLoading] = useState<AutomationLoadingState>({
    flows: false,
    templates: false,
    executions: false,
    macros: false,
    profiles: false,
    executing: false,
    recording: false,
    aiGenerating: false,
    global: true,
  });
  
  const [errors, setErrors] = useState<AutomationErrorState>({
    flows: null,
    executions: null,
    macros: null,
    profiles: null,
    execution: null,
    ai: null,
  });
  
  // Refs
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==========================================================================
  // Data Fetching
  // ==========================================================================
  
  const fetchFlows = useCallback(async () => {
    const cached = getCached<Flow[]>('flows');
    
    if (cached) {
      setData(prev => ({ ...prev, flows: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, flows: true }));
    setErrors(prev => ({ ...prev, flows: null }));
    
    try {
      const flows = await FlowManagementService.getFlows();
      setData(prev => ({ ...prev, flows }));
      setCache('flows', flows);
      
      // Load initial flow if specified
      if (initialFlowId && !data.currentFlow) {
        const initialFlow = flows.find(f => f.id === initialFlowId);
        if (initialFlow) {
          setData(prev => ({ ...prev, currentFlow: initialFlow }));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch flows';
      setErrors(prev => ({ ...prev, flows: message }));
      log.error('useAutomation: Failed to fetch flows:', error);
    } finally {
      setLoading(prev => ({ ...prev, flows: false }));
    }
  }, [initialFlowId, data.currentFlow]);
  
  const fetchTemplates = useCallback(async () => {
    const cached = getCached<Flow[]>('templates');
    
    if (cached) {
      setData(prev => ({ ...prev, templates: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, templates: true }));
    
    try {
      const templates = await TemplateService.getTemplates();
      setData(prev => ({ ...prev, templates }));
      setCache('templates', templates);
    } catch (error) {
      log.error('useAutomation: Failed to fetch templates:', error);
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
    }
  }, []);
  
  const fetchMacros = useCallback(async () => {
    const cached = getCached<Macro[]>('macros');
    
    if (cached) {
      setData(prev => ({ ...prev, macros: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, macros: true }));
    setErrors(prev => ({ ...prev, macros: null }));
    
    try {
      const macros = await getMacros();
      setData(prev => ({ ...prev, macros }));
      setCache('macros', macros);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch macros';
      setErrors(prev => ({ ...prev, macros: message }));
      log.error('useAutomation: Failed to fetch macros:', error);
    } finally {
      setLoading(prev => ({ ...prev, macros: false }));
    }
  }, []);
  
  const fetchProfiles = useCallback(async () => {
    const cached = getCached<AutofillProfile[]>('profiles');
    
    if (cached) {
      setData(prev => ({ ...prev, profiles: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, profiles: true }));
    setErrors(prev => ({ ...prev, profiles: null }));
    
    try {
      const profiles = await getProfiles();
      setData(prev => ({ ...prev, profiles }));
      setCache('profiles', profiles);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profiles';
      setErrors(prev => ({ ...prev, profiles: message }));
      log.error('useAutomation: Failed to fetch profiles:', error);
    } finally {
      setLoading(prev => ({ ...prev, profiles: false }));
    }
  }, []);
  
  // ==========================================================================
  // Refresh Functions
  // ==========================================================================
  
  const refresh = useCallback(async () => {
    invalidateCache();
    setLoading(prev => ({ ...prev, global: true }));
    
    await Promise.all([
      fetchFlows(),
      fetchTemplates(),
      fetchMacros(),
      fetchProfiles(),
    ]);
    
    setLoading(prev => ({ ...prev, global: false }));
  }, [fetchFlows, fetchTemplates, fetchMacros, fetchProfiles]);
  
  const refreshFlows = useCallback(async () => {
    invalidateCache('flows');
    await fetchFlows();
  }, [fetchFlows]);
  
  const refreshMacros = useCallback(async () => {
    invalidateCache('macros');
    await fetchMacros();
  }, [fetchMacros]);
  
  const refreshProfiles = useCallback(async () => {
    invalidateCache('profiles');
    await fetchProfiles();
  }, [fetchProfiles]);
  
  const refreshTemplates = useCallback(async () => {
    invalidateCache('templates');
    await fetchTemplates();
  }, [fetchTemplates]);
  
  // ==========================================================================
  // Flow Management Actions
  // ==========================================================================
  
  const createFlow = useCallback(async (name: string, nodes: FlowNode[] = [], edges: FlowEdge[] = []) => {
    const flow: Flow = {
      id: crypto.randomUUID(),
      name,
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes,
      edges,
      variables: [],
      settings: {},
    };
    
    await FlowManagementService.saveFlow(flow);
    
    setData(prev => ({
      ...prev,
      flows: [flow, ...prev.flows],
      currentFlow: flow,
    }));
    
    invalidateCache('flows');
    return flow;
  }, []);
  
  const updateFlow = useCallback(async (flow: Flow) => {
    const updatedFlow = { ...flow, updatedAt: Date.now() };
    await FlowManagementService.saveFlow(updatedFlow);
    
    setData(prev => ({
      ...prev,
      flows: prev.flows.map(f => f.id === flow.id ? updatedFlow : f),
      currentFlow: prev.currentFlow?.id === flow.id ? updatedFlow : prev.currentFlow,
    }));
    
    invalidateCache('flows');
  }, []);
  
  const deleteFlowAction = useCallback(async (flowId: string) => {
    await FlowManagementService.deleteFlow(flowId);
    
    setData(prev => ({
      ...prev,
      flows: prev.flows.filter(f => f.id !== flowId),
      currentFlow: prev.currentFlow?.id === flowId ? null : prev.currentFlow,
    }));
    
    invalidateCache('flows');
  }, []);
  
  const duplicateFlow = useCallback(async (flowId: string) => {
    const flow = await FlowManagementService.duplicateFlow(flowId);
    
    setData(prev => ({
      ...prev,
      flows: [flow, ...prev.flows],
    }));
    
    invalidateCache('flows');
    return flow;
  }, []);
  
  const loadFlow = useCallback(async (flowId: string) => {
    const flow = await FlowManagementService.getFlow(flowId);
    
    setData(prev => ({ ...prev, currentFlow: flow }));
    return flow;
  }, []);
  
  const importFlowAction = useCallback(async (json: string) => {
    const flow = await FlowManagementService.importFlow(json);
    
    setData(prev => ({
      ...prev,
      flows: [flow, ...prev.flows],
    }));
    
    invalidateCache('flows');
    return flow;
  }, []);
  
  const exportFlowAction = useCallback(async (flowId: string) => {
    return FlowManagementService.exportFlow(flowId);
  }, []);
  
  // ==========================================================================
  // Flow Execution Actions
  // ==========================================================================
  
  const executeFlowAction = useCallback(async (flow?: Flow, variables?: Record<string, unknown>) => {
    const flowToExecute = flow || data.currentFlow;
    if (!flowToExecute) {
      throw new Error('No flow to execute');
    }
    
    setLoading(prev => ({ ...prev, executing: true }));
    setErrors(prev => ({ ...prev, execution: null }));
    
    try {
      const execution = await FlowExecutionService.executeFlow(flowToExecute, variables);
      
      setData(prev => ({
        ...prev,
        currentExecution: execution,
        executions: [execution, ...prev.executions],
      }));
      
      return execution;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Flow execution failed';
      setErrors(prev => ({ ...prev, execution: message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, executing: false }));
    }
  }, [data.currentFlow]);
  
  const executeNode = useCallback(async (node: FlowNode, context: Record<string, unknown>) => {
    return FlowExecutionService.executeNode(node, context);
  }, []);
  
  const cancelExecution = useCallback(async (executionId: string) => {
    await FlowExecutionService.cancelExecution(executionId);
    
    setData(prev => ({
      ...prev,
      currentExecution: prev.currentExecution?.id === executionId 
        ? { ...prev.currentExecution, status: 'cancelled' as ExecutionStatus }
        : prev.currentExecution,
      executions: prev.executions.map(e => 
        e.id === executionId ? { ...e, status: 'cancelled' as ExecutionStatus } : e
      ),
    }));
  }, []);
  
  const retryExecution = useCallback(async (executionId: string) => {
    setLoading(prev => ({ ...prev, executing: true }));
    
    try {
      const execution = await FlowExecutionService.retryExecution(executionId);
      
      setData(prev => ({
        ...prev,
        currentExecution: execution,
        executions: [execution, ...prev.executions],
      }));
      
      return execution;
    } finally {
      setLoading(prev => ({ ...prev, executing: false }));
    }
  }, []);
  
  const getExecutionHistory = useCallback(async (flowId: string, limit?: number) => {
    const executions = await FlowExecutionService.getExecutionHistory(flowId, limit);
    
    setData(prev => ({ ...prev, executions }));
    return executions;
  }, []);
  
  // ==========================================================================
  // Recording Actions
  // ==========================================================================
  
  const startRecordingAction = useCallback(async () => {
    setLoading(prev => ({ ...prev, recording: true }));
    
    try {
      const session = await RecordingService.startRecording();
      
      setData(prev => ({
        ...prev,
        recordingSession: session,
        recordedActions: [],
      }));
      
      return session;
    } finally {
      setLoading(prev => ({ ...prev, recording: false }));
    }
  }, []);
  
  const stopRecordingAction = useCallback(async () => {
    if (!data.recordingSession) {
      throw new Error('No active recording session');
    }
    
    const actions = await RecordingService.stopRecording(data.recordingSession.id);
    
    setData(prev => ({
      ...prev,
      recordingSession: null,
      recordedActions: actions,
    }));
    
    return actions;
  }, [data.recordingSession]);
  
  const pauseRecording = useCallback(async () => {
    if (!data.recordingSession) {
      throw new Error('No active recording session');
    }
    
    await RecordingService.pauseRecording(data.recordingSession.id);
    
    setData(prev => ({
      ...prev,
      recordingSession: prev.recordingSession 
        ? { ...prev.recordingSession, status: 'paused' as const }
        : null,
    }));
  }, [data.recordingSession]);
  
  const resumeRecording = useCallback(async () => {
    if (!data.recordingSession) {
      throw new Error('No active recording session');
    }
    
    await RecordingService.resumeRecording(data.recordingSession.id);
    
    setData(prev => ({
      ...prev,
      recordingSession: prev.recordingSession 
        ? { ...prev.recordingSession, status: 'recording' as const }
        : null,
    }));
  }, [data.recordingSession]);
  
  const convertToFlow = useCallback(async (name: string) => {
    if (data.recordedActions.length === 0) {
      throw new Error('No recorded actions to convert');
    }
    
    const flow = await RecordingService.convertToFlow(data.recordedActions, name);
    
    setData(prev => ({
      ...prev,
      flows: [flow, ...prev.flows],
      currentFlow: flow,
      recordedActions: [],
    }));
    
    invalidateCache('flows');
    return flow;
  }, [data.recordedActions]);
  
  // ==========================================================================
  // Template Actions
  // ==========================================================================
  
  const createFromTemplate = useCallback(async (templateId: string, name: string) => {
    const flow = await TemplateService.createFromTemplate(templateId, name);
    
    setData(prev => ({
      ...prev,
      flows: [flow, ...prev.flows],
      currentFlow: flow,
    }));
    
    invalidateCache('flows');
    return flow;
  }, []);
  
  const saveAsTemplate = useCallback(async (flow: Flow, category?: string) => {
    await TemplateService.saveAsTemplate(flow, category);
    
    invalidateCache('templates');
    await fetchTemplates();
  }, [fetchTemplates]);
  
  // ==========================================================================
  // AI Actions
  // ==========================================================================
  
  const generateFlowFromDescription = useCallback(async (description: string) => {
    setLoading(prev => ({ ...prev, aiGenerating: true }));
    setErrors(prev => ({ ...prev, ai: null }));
    
    try {
      const flow = await AIFlowBuilderService.generateFlow(description);
      
      setData(prev => ({
        ...prev,
        flows: [flow, ...prev.flows],
        currentFlow: flow,
      }));
      
      invalidateCache('flows');
      return flow;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI generation failed';
      setErrors(prev => ({ ...prev, ai: message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, aiGenerating: false }));
    }
  }, []);
  
  const getAISuggestions = useCallback(async (flow?: Flow) => {
    const flowToAnalyze = flow || data.currentFlow;
    if (!flowToAnalyze) {
      throw new Error('No flow to analyze');
    }
    
    return AIFlowBuilderService.getSuggestions(flowToAnalyze);
  }, [data.currentFlow]);
  
  const optimizeFlow = useCallback(async (flow?: Flow) => {
    const flowToOptimize = flow || data.currentFlow;
    if (!flowToOptimize) {
      throw new Error('No flow to optimize');
    }
    
    setLoading(prev => ({ ...prev, aiGenerating: true }));
    
    try {
      const optimized = await AIFlowBuilderService.optimizeFlow(flowToOptimize);
      
      setData(prev => ({
        ...prev,
        currentFlow: prev.currentFlow?.id === optimized.id ? optimized : prev.currentFlow,
        flows: prev.flows.map(f => f.id === optimized.id ? optimized : f),
      }));
      
      return optimized;
    } finally {
      setLoading(prev => ({ ...prev, aiGenerating: false }));
    }
  }, [data.currentFlow]);
  
  const explainFlow = useCallback(async (flow?: Flow) => {
    const flowToExplain = flow || data.currentFlow;
    if (!flowToExplain) {
      throw new Error('No flow to explain');
    }
    
    return AIFlowBuilderService.explainFlow(flowToExplain);
  }, [data.currentFlow]);
  
  // ==========================================================================
  // Macro Actions
  // ==========================================================================
  
  const createMacroAction = useCallback(async (name: string, steps: MacroStep[]) => {
    const macroId = await createMacro(name, steps);
    
    invalidateCache('macros');
    await fetchMacros();
    return macroId;
  }, [fetchMacros]);
  
  const deleteMacroAction = useCallback(async (macroId: string) => {
    await deleteMacro(macroId);
    
    setData(prev => ({
      ...prev,
      macros: prev.macros.filter(m => m.id !== macroId),
    }));
    
    invalidateCache('macros');
  }, []);
  
  const executeMacroAction = useCallback(async (macroId: string) => {
    await executeMacro(macroId);
  }, []);
  
  const startMacroRecordingAction = useCallback(async (name: string) => {
    const recordingId = await recordMacro(name);
    
    setData(prev => ({ ...prev, macroRecordingId: recordingId }));
    return recordingId;
  }, []);
  
  const stopMacroRecordingAction = useCallback(async (name: string, description: string = '') => {
    if (!data.macroRecordingId) {
      throw new Error('No active macro recording');
    }
    
    const macro = await stopMacroRecording(name, description);
    
    setData(prev => ({
      ...prev,
      macros: [macro, ...prev.macros],
      macroRecordingId: null,
    }));
    
    invalidateCache('macros');
    return macro;
  }, [data.macroRecordingId]);
  
  // ==========================================================================
  // Autofill Profile Actions
  // ==========================================================================
  
  const createProfileAction = useCallback(async (
    name: string, 
    profileData: Record<string, string>, 
    category?: 'personal' | 'business' | 'shipping' | 'payment'
  ) => {
    const profile = await saveProfile(name, profileData, category);
    
    invalidateCache('profiles');
    await fetchProfiles();
    return profile.id;
  }, [fetchProfiles]);
  
  const deleteProfileAction = useCallback(async (profileId: string) => {
    await deleteProfile(profileId);
    
    setData(prev => ({
      ...prev,
      profiles: prev.profiles.filter(p => p.id !== profileId),
    }));
    
    invalidateCache('profiles');
  }, []);
  
  const fillFormAction = useCallback(async (profileId: string) => {
    await fillForm(profileId);
  }, []);
  
  const detectFormFields = useCallback(async (fieldsMetadata: FieldMetadata[]) => {
    return detectFields(fieldsMetadata);
  }, []);
  
  // ==========================================================================
  // Computed Values
  // ==========================================================================
  
  const activeFlows = useMemo(() => 
    data.flows.filter(f => f.nodes.length > 0),
    [data.flows]
  );
  
  const recentExecutions = useMemo(() => 
    data.executions.slice(0, 10),
    [data.executions]
  );
  
  const failedExecutions = useMemo(() => 
    data.executions.filter(e => e.status === 'failed'),
    [data.executions]
  );
  
  const runningExecutions = useMemo(() => 
    data.executions.filter(e => e.status === 'running'),
    [data.executions]
  );
  
  const isRecording = useMemo(() => 
    data.recordingSession?.status === 'recording' || data.macroRecordingId !== null,
    [data.recordingSession, data.macroRecordingId]
  );
  
  const isExecuting = useMemo(() => 
    loading.executing || runningExecutions.length > 0,
    [loading.executing, runningExecutions]
  );
  
  const profilesByCategory = useMemo(() => {
    const grouped: Record<string, AutofillProfile[]> = {};
    
    data.profiles.forEach(profile => {
      const category = profile.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(profile);
    });
    
    return grouped;
  }, [data.profiles]);
  
  // ==========================================================================
  // Effects
  // ==========================================================================
  
  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh && autoRefresh > 0) {
      refreshIntervalRef.current = setInterval(refresh, autoRefresh);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refresh]);
  
  // Real-time updates
  useEffect(() => {
    if (!realtime) return;
    
    const setupListeners = async () => {
      try {
        const unlistenExecution = await listen<FlowExecution>('automation:execution:update', (event) => {
          setData(prev => ({
            ...prev,
            currentExecution: prev.currentExecution?.id === event.payload.id 
              ? event.payload 
              : prev.currentExecution,
            executions: prev.executions.map(e => 
              e.id === event.payload.id ? event.payload : e
            ),
          }));
          
          // Update loading state if execution completed
          if (['completed', 'failed', 'cancelled'].includes(event.payload.status)) {
            setLoading(prev => ({ ...prev, executing: false }));
          }
        });
        
        const unlistenRecording = await listen<RecordedAction>('automation:recording:action', (event) => {
          setData(prev => ({
            ...prev,
            recordedActions: [...prev.recordedActions, event.payload],
          }));
        });
        
        const unlistenNode = await listen<NodeResult>('automation:node:update', (event) => {
          setData(prev => {
            if (!prev.currentExecution) return prev;
            
            return {
              ...prev,
              currentExecution: {
                ...prev.currentExecution,
                nodeResults: prev.currentExecution.nodeResults.map(nr => 
                  nr.nodeId === event.payload.nodeId ? event.payload : nr
                ),
              },
            };
          });
        });
        
        const unlistenRefresh = await listen('automation:refresh', () => {
          refresh();
        });
        
        unlistenRefs.current = [unlistenExecution, unlistenRecording, unlistenNode, unlistenRefresh];
      } catch (error) {
        log.warn('useAutomation: Failed to setup Tauri event listeners:', error);
      }
    };
    
    setupListeners();
    
    return () => {
      unlistenRefs.current.forEach(unlisten => unlisten());
      unlistenRefs.current = [];
    };
  }, [realtime, refresh]);
  
  // ==========================================================================
  // Return
  // ==========================================================================
  
  return {
    // State
    data,
    loading,
    errors,
    
    // Flow Management
    createFlow,
    updateFlow,
    deleteFlow: deleteFlowAction,
    duplicateFlow,
    loadFlow,
    importFlow: importFlowAction,
    exportFlow: exportFlowAction,
    
    // Flow Execution
    executeFlow: executeFlowAction,
    executeNode,
    cancelExecution,
    retryExecution,
    getExecutionHistory,
    
    // Recording
    startRecording: startRecordingAction,
    stopRecording: stopRecordingAction,
    pauseRecording,
    resumeRecording,
    convertToFlow,
    
    // Templates
    createFromTemplate,
    saveAsTemplate,
    
    // AI
    generateFlowFromDescription,
    getAISuggestions,
    optimizeFlow,
    explainFlow,
    
    // Macros
    createMacroAction,
    deleteMacroAction,
    executeMacroAction,
    startMacroRecording: startMacroRecordingAction,
    stopMacroRecording: stopMacroRecordingAction,
    
    // Autofill Profiles
    createProfile: createProfileAction,
    deleteProfileAction,
    fillFormAction,
    detectFormFields,
    
    // Refresh
    refresh,
    refreshFlows,
    refreshMacros,
    refreshProfiles,
    refreshTemplates,
    
    // Computed
    activeFlows,
    recentExecutions,
    failedExecutions,
    runningExecutions,
    isRecording,
    isExecuting,
    profilesByCategory,
  };
}

export default useAutomation;
