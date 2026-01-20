"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { Suspense } from 'react';
import { AppLayout } from '@/components/layout';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '@/hooks/use-toast';
import PipelineBuilder from '@/components/enterprise/PipelineBuilder';
import { DataPipeline, PipelineNode } from '@/types/data-pipeline';
import { useTranslation } from '@/hooks/useTranslation';
import './pipelines.css';

/**
 * Enterprise Data Pipelines Page
 * 
 * Full-page implementation of the PipelineBuilder component
 * for creating and managing ETL/data integration pipelines.
 * 
 * Features:
 * - Visual pipeline builder with drag-and-drop
 * - Data source connectors (databases, APIs, files)
 * - Transformation rules and mapping
 * - Real-time execution monitoring
 * - Scheduling and orchestration
 */

interface PipelinesPageState {
  activePipeline: DataPipeline | null;
  selectedNode: PipelineNode | null;
  isLoading: boolean;
  error: string | null;
  executionStatus: 'idle' | 'running' | 'completed' | 'failed';
}

export default function PipelinesPage(): React.JSX.Element {
  const { t: _t } = useTranslation();
  const { toast } = useToast();
  const [state, setState] = React.useState<PipelinesPageState>({
    activePipeline: null,
    selectedNode: null,
    isLoading: false,
    error: null,
    executionStatus: 'idle'
  });

  const handleSavePipeline = React.useCallback(async (pipeline: DataPipeline) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug('Saving pipeline:', pipeline);
      
      // Call backend when available
      await invoke('pipeline_save', { pipeline });
      
      toast({
        title: 'Pipeline Saved',
        description: `Pipeline "${pipeline.name || 'Untitled'}" saved successfully`,
      });
      
      setState(prev => ({
        ...prev,
        activePipeline: pipeline,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save pipeline';
      toast({
        title: 'Save Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, [toast]);

  const handleExecutePipeline = React.useCallback(async (pipelineId: string) => {
    setState(prev => ({ ...prev, executionStatus: 'running', error: null }));
    
    try {
      log.debug('Executing pipeline:', pipelineId);
      
      // Call backend when available
      await invoke('pipeline_execute', { pipelineId });
      
      toast({
        title: 'Pipeline Completed',
        description: 'Pipeline execution finished successfully',
      });
      
      setState(prev => ({ ...prev, executionStatus: 'completed' }));
      
      // Reset status after showing completion
      setTimeout(() => {
        setState(prev => ({ ...prev, executionStatus: 'idle' }));
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Pipeline execution failed';
      toast({
        title: 'Execution Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setState(prev => ({
        ...prev,
        executionStatus: 'failed',
        error: errorMessage
      }));
    }
  }, [toast]);

  const handleNodeSelect = React.useCallback((node: PipelineNode | null) => {
    setState(prev => ({ ...prev, selectedNode: node }));
  }, []);

  return (
    <AppLayout>
    <div className="pipelines-page">
      <header className="pipelines-header">
        <div className="header-left">
          <a href="/enterprise" className="back-link">← Enterprise Suite</a>
          <h1>Data Pipelines</h1>
        </div>
        <div className="header-right">
          <div className="pipeline-stats">
            <span className={`execution-status ${state.executionStatus}`}>
              {state.executionStatus === 'running' && '🔄 Running...'}
              {state.executionStatus === 'completed' && '✅ Completed'}
              {state.executionStatus === 'failed' && '❌ Failed'}
              {state.executionStatus === 'idle' && '⏸️ Idle'}
            </span>
          </div>
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

      <main className="pipelines-main">
        <Suspense fallback={<PipelinesLoadingSkeleton />}>
          <PipelineBuilder
            pipeline={state.activePipeline || undefined}
            onSave={handleSavePipeline}
            onExecute={handleExecutePipeline}
            onNodeSelect={handleNodeSelect}
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

function PipelinesLoadingSkeleton(): React.JSX.Element {
  return (
    <div className="pipelines-skeleton">
      <div className="skeleton-sidebar">
        <div className="skeleton-search" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-pipeline-item" />
        ))}
      </div>
      <div className="skeleton-canvas">
        <div className="skeleton-toolbar" />
        <div className="skeleton-flow">
          <div className="skeleton-node skeleton-node--left" />
          <div className="skeleton-node skeleton-node--center" />
          <div className="skeleton-node skeleton-node--right" />
        </div>
      </div>
    </div>
  );
}
