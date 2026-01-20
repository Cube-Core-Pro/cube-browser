/**
 * 🏢 FIGURE WORKFLOW PANEL - COMPONENT
 * 
 * React component for the FIGURE LendingPad Compensation Request
 * workflow automation panel.
 */

"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Check,
  X,
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  FIGURE_WORKFLOW_STEPS,
  STEP_GROUPS,
  WORKFLOW_STATS,
  getStepById,
  getStepProgress,
  canExecuteStep,
  FigureWorkflowState,
  WorkflowStep,
  StepCategory,
  StepStatus,
  REQUIRED_COMP_DOCUMENTS
} from './index';
import './FigureWorkflowPanel.css';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface FigureWorkflowPanelProps {
  onStepExecute?: (step: WorkflowStep) => Promise<boolean>;
  onWorkflowComplete?: () => void;
  onError?: (error: string, stepId: number) => void;
  initialDocuments?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const FigureWorkflowPanel: React.FC<FigureWorkflowPanelProps> = ({
  onStepExecute,
  onWorkflowComplete,
  onError,
  initialDocuments = []
}) => {
  // State
  const [workflowState, setWorkflowState] = useState<FigureWorkflowState>({
    currentStep: 1,
    totalSteps: WORKFLOW_STATS.totalSteps,
    completedSteps: [],
    skippedSteps: [],
    errorSteps: [],
    status: 'idle'
  });
  
  const [activeCategory, setActiveCategory] = useState<StepCategory>('figure-portal');
  const [selectedStep, setSelectedStep] = useState<number>(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [foundDocuments, _setFoundDocuments] = useState<Set<string>>(new Set(initialDocuments));

  // Computed values
  const progress = useMemo(() => 
    getStepProgress(workflowState.completedSteps), 
    [workflowState.completedSteps]
  );

  const _currentStepData = useMemo(() => 
    getStepById(workflowState.currentStep), 
    [workflowState.currentStep]
  );

  const selectedStepData = useMemo(() => 
    getStepById(selectedStep), 
    [selectedStep]
  );

  const categorySteps = useMemo(() => 
    FIGURE_WORKFLOW_STEPS.filter(s => s.category === activeCategory),
    [activeCategory]
  );

  // Get step status
  const getStepStatus = useCallback((stepId: number): StepStatus => {
    if (workflowState.completedSteps.includes(stepId)) return 'completed';
    if (workflowState.errorSteps.includes(stepId)) return 'error';
    if (workflowState.skippedSteps.includes(stepId)) return 'skipped';
    if (workflowState.currentStep === stepId && workflowState.status === 'running') return 'in-progress';
    return 'pending';
  }, [workflowState]);

  // Check if category is complete
  const isCategoryComplete = useCallback((category: StepCategory): boolean => {
    const categoryStepIds = STEP_GROUPS[category].steps;
    return categoryStepIds.every(id => 
      workflowState.completedSteps.includes(id) || workflowState.skippedSteps.includes(id)
    );
  }, [workflowState]);

  // Execute single step
  const executeStep = useCallback(async (stepId: number) => {
    const step = getStepById(stepId);
    if (!step) return;

    if (!canExecuteStep(stepId, workflowState.completedSteps)) {
      onError?.('Cannot execute step: dependencies not met', stepId);
      return;
    }

    setIsExecuting(true);
    setWorkflowState(prev => ({
      ...prev,
      currentStep: stepId,
      status: 'running'
    }));

    try {
      const success = onStepExecute ? await onStepExecute(step) : true;
      
      if (success) {
        setWorkflowState(prev => ({
          ...prev,
          completedSteps: [...prev.completedSteps, stepId],
          currentStep: stepId < prev.totalSteps ? stepId + 1 : stepId,
          status: stepId >= prev.totalSteps ? 'completed' : 'paused'
        }));

        if (stepId >= WORKFLOW_STATS.totalSteps) {
          onWorkflowComplete?.();
        }
      } else {
        setWorkflowState(prev => ({
          ...prev,
          errorSteps: [...prev.errorSteps, stepId],
          status: 'error'
        }));
      }
    } catch (error) {
      setWorkflowState(prev => ({
        ...prev,
        errorSteps: [...prev.errorSteps, stepId],
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }));
      onError?.(error instanceof Error ? error.message : 'Unknown error', stepId);
    } finally {
      setIsExecuting(false);
    }
  }, [workflowState, onStepExecute, onWorkflowComplete, onError]);

  // Skip step
  const skipStep = useCallback((stepId: number) => {
    const step = getStepById(stepId);
    if (!step?.isOptional) return;

    setWorkflowState(prev => ({
      ...prev,
      skippedSteps: [...prev.skippedSteps, stepId],
      currentStep: stepId < prev.totalSteps ? stepId + 1 : stepId
    }));
  }, []);

  // Reset workflow
  const resetWorkflow = useCallback(() => {
    setWorkflowState({
      currentStep: 1,
      totalSteps: WORKFLOW_STATS.totalSteps,
      completedSteps: [],
      skippedSteps: [],
      errorSteps: [],
      status: 'idle'
    });
    setSelectedStep(1);
    setActiveCategory('figure-portal');
  }, []);

  // Run all steps
  const runAllSteps = useCallback(async () => {
    setWorkflowState(prev => ({ ...prev, status: 'running', startedAt: new Date().toISOString() }));
    
    for (let i = workflowState.currentStep; i <= WORKFLOW_STATS.totalSteps; i++) {
      if (workflowState.status === 'paused') break;
      await executeStep(i);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between steps
    }
  }, [workflowState.currentStep, workflowState.status, executeStep]);

  // Pause workflow
  const pauseWorkflow = useCallback(() => {
    setWorkflowState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="figure-workflow-panel">
      {/* Header */}
      <div className="figure-workflow-header">
        <div>
          <h2>🏢 FIGURE Compensation Request</h2>
          <p>64-Step LendingPad Automation Workflow</p>
        </div>
        <div className="workflow-status">
          {workflowState.status === 'running' && <Clock className="w-5 h-5 animate-spin" />}
          {workflowState.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-300" />}
          {workflowState.status === 'error' && <AlertCircle className="w-5 h-5 text-red-300" />}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="workflow-progress">
        <div className="progress-stats">
          <span className="progress-label">Progress</span>
          <span className="progress-value">
            {workflowState.completedSteps.length} / {WORKFLOW_STATS.totalSteps} steps ({progress}%)
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill progress-dynamic" style={{ '--progress-width': `${progress}%` } as React.CSSProperties} />
        </div>
      </div>

      {/* Category Navigation */}
      <div className="category-nav">
        {(Object.keys(STEP_GROUPS) as StepCategory[]).map(category => {
          const group = STEP_GROUPS[category];
          const isComplete = isCategoryComplete(category);
          return (
            <button
              key={category}
              className={`category-btn ${activeCategory === category ? 'active' : ''} ${isComplete ? 'completed' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              <span className="category-icon">{group.icon}</span>
              <span>{group.label}</span>
              <span className="category-badge">{group.steps.length}</span>
            </button>
          );
        })}
      </div>

      {/* Steps List */}
      <div className="steps-container">
        {categorySteps.map(step => {
          const status = getStepStatus(step.id);
          return (
            <div
              key={step.id}
              className={`step-item ${status} ${selectedStep === step.id ? 'active' : ''}`}
              onClick={() => setSelectedStep(step.id)}
            >
              <div className="step-number">
                {status === 'completed' ? <Check className="w-4 h-4" /> :
                 status === 'error' ? <X className="w-4 h-4" /> :
                 step.id}
              </div>
              <div className="step-content">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
                <div className="step-meta">
                  <span className="step-tag action">{step.action}</span>
                  {step.sourceDocument && (
                    <span className="step-tag document">📄 {step.sourceDocument}</span>
                  )}
                  {step.isOptional && (
                    <span className="step-tag optional">Optional</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          );
        })}
      </div>

      {/* Step Details */}
      {selectedStepData && (
        <div className="step-details">
          <div className="step-details-header">
            <span className="step-details-title">
              Step {selectedStepData.id}: {selectedStepData.title}
            </span>
            <div className="step-details-actions">
              {selectedStepData.isOptional && (
                <button 
                  className="btn-workflow secondary"
                  onClick={() => skipStep(selectedStepData.id)}
                  disabled={getStepStatus(selectedStepData.id) !== 'pending'}
                >
                  Skip
                </button>
              )}
              <button
                className="btn-workflow primary"
                onClick={() => executeStep(selectedStepData.id)}
                disabled={isExecuting || getStepStatus(selectedStepData.id) === 'completed'}
              >
                {isExecuting ? 'Executing...' : 'Execute'}
              </button>
            </div>
          </div>
          {selectedStepData.notes && (
            <div className="step-notes">
              <div className="step-notes-label">💡 Notes</div>
              <div className="step-notes-text">{selectedStepData.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* Document Checklist */}
      <div className="document-checklist">
        <div className="document-checklist-title">
          <FileText className="w-4 h-4" />
          Required Documents for COMP Request
        </div>
        <div className="document-list">
          {REQUIRED_COMP_DOCUMENTS.map(doc => (
            <div 
              key={doc} 
              className={`document-item required ${foundDocuments.has(doc) ? 'found' : ''}`}
            >
              <div className={`document-check ${foundDocuments.has(doc) ? 'found' : 'pending'}`}>
                {foundDocuments.has(doc) ? <Check className="w-3 h-3" /> : '?'}
              </div>
              <span className="document-name">{doc}</span>
              {!foundDocuments.has(doc) && (
                <span className="document-badge">Required</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="workflow-actions">
        <button 
          className="btn-workflow secondary"
          onClick={resetWorkflow}
          disabled={isExecuting}
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        {workflowState.status === 'running' ? (
          <button 
            className="btn-workflow danger"
            onClick={pauseWorkflow}
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        ) : (
          <button 
            className="btn-workflow success"
            onClick={runAllSteps}
            disabled={isExecuting || workflowState.status === 'completed'}
          >
            <Play className="w-4 h-4" />
            {workflowState.status === 'paused' ? 'Resume' : 'Run All'}
          </button>
        )}
        <button 
          className="btn-workflow primary"
          onClick={() => executeStep(workflowState.currentStep)}
          disabled={isExecuting || workflowState.status === 'completed'}
        >
          <SkipForward className="w-4 h-4" />
          Next Step
        </button>
      </div>
    </div>
  );
};

export default FigureWorkflowPanel;
