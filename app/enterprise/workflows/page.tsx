"use client";

import React, { Suspense } from 'react';
import { AppLayout } from '@/components/layout';
import { invoke } from '@tauri-apps/api/core';
import { WorkflowDesigner } from '@/components/enterprise';
import { WorkflowDefinition } from '@/types/automation-enterprise';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import './workflows.css';

/**
 * Enterprise Workflows Page
 * 
 * Full-page implementation of the WorkflowDesigner component
 * for creating and managing enterprise-grade automation workflows.
 * 
 * Features:
 * - Visual workflow builder with drag-and-drop
 * - 50+ node types for various automation tasks
 * - Real-time collaboration support
 * - Version control integration
 * - Advanced debugging and monitoring
 */

interface WorkflowsPageState {
  activeWorkflow: WorkflowDefinition | null;
  isLoading: boolean;
  error: string | null;
}

export default function WorkflowsPage(): React.JSX.Element {
  const { t: _t } = useTranslation();
  const { toast } = useToast();
  const [state, setState] = React.useState<WorkflowsPageState>({
    activeWorkflow: null,
    isLoading: false,
    error: null
  });

  const handleSave = React.useCallback(async (workflow: WorkflowDefinition) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Backend command for saving workflow
      await invoke('workflow_save', {
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          actions: workflow.actions,
          triggers: workflow.triggers,
          version: workflow.version
        }
      });
      
      setState(prev => ({ 
        ...prev, 
        activeWorkflow: workflow,
        isLoading: false 
      }));
      
      toast({
        title: 'Workflow saved',
        description: `"${workflow.name}" has been saved successfully.`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save workflow';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isLoading: false 
      }));
      toast({
        title: 'Save failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const handleExecute = React.useCallback(async (workflowId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Backend command for executing workflow
      await invoke('workflow_execute', { workflowId });
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: 'Workflow started',
        description: `Workflow execution initiated successfully.`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute workflow';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isLoading: false 
      }));
      toast({
        title: 'Execution failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const handleClose = React.useCallback(() => {
    window.history.back();
  }, []);

  return (
    <AppLayout>
    <div className="workflows-page">
      <header className="workflows-header">
        <div className="header-left">
          <a href="/enterprise" className="back-link">← Enterprise Suite</a>
          <h1>Workflow Designer</h1>
        </div>
        <div className="header-right">
          <span className="status-indicator">
            <span className="status-dot online" />
            All Systems Operational
          </span>
        </div>
      </header>

      {state.error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{state.error}</span>
          <button 
            className="error-dismiss"
            onClick={() => setState(prev => ({ ...prev, error: null }))}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      <main className="workflows-main">
        <Suspense fallback={<WorkflowsLoadingSkeleton />}>
          <WorkflowDesigner
            workflow={state.activeWorkflow || undefined}
            onSave={handleSave}
            onExecute={handleExecute}
            onClose={handleClose}
            readOnly={state.isLoading}
          />
        </Suspense>
      </main>

      {state.isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <span className="loading-text">Processing...</span>
        </div>
      )}
    </div>
    </AppLayout>
  );
}

function WorkflowsLoadingSkeleton(): React.JSX.Element {
  return (
    <div className="workflows-skeleton">
      <div className="skeleton-toolbar">
        <div className="skeleton-button" />
        <div className="skeleton-button" />
        <div className="skeleton-button" />
      </div>
      <div className="skeleton-canvas">
        <div className="skeleton-node skeleton-node--left" />
        <div className="skeleton-node skeleton-node--center" />
        <div className="skeleton-node skeleton-node--right" />
      </div>
    </div>
  );
}
