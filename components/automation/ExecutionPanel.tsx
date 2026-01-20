/**
 * Execution Panel - Panel de ejecución y logs
 */

import React from 'react';
import { FlowExecution } from '@/types/automation';
import './ExecutionPanel.css';

interface ExecutionPanelProps {
  execution: FlowExecution | null;
  onClose: () => void;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ execution, onClose }) => {
  if (!execution) {
    return (
      <div className="execution-panel">
        <div className="execution-panel-header">
          <h3>Execution Logs</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="execution-empty">
          <p>No execution yet. Click &quot;Run&quot; to start.</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '⏳';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      default: return '⚪';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="execution-panel">
      <div className="execution-panel-header">
        <div>
          <h3>Execution Logs</h3>
          <div className="execution-status">
            <span className={`status-badge ${execution.status}`}>
              {getStatusIcon(execution.status)} {execution.status}
            </span>
            <span className="execution-duration">
              {formatDuration(execution.duration)}
            </span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="execution-steps">
        {execution.steps.map((step, index) => (
          <div key={step.nodeId} className={`execution-step ${step.status}`}>
            <div className="step-header">
              <span className="step-number">{index + 1}</span>
              <span className="step-status">{getStatusIcon(step.status)}</span>
              <span className="step-type">{step.nodeType}</span>
              <span className="step-duration">{formatDuration(step.duration)}</span>
            </div>

            {step.output && (
              <div className="step-output">
                <div className="output-label">Output:</div>
                <pre>{JSON.stringify(step.output, null, 2)}</pre>
              </div>
            )}

            {step.error && (
              <div className="step-error">
                <div className="error-label">Error:</div>
                <div className="error-message">{step.error.message}</div>
                {step.error.stack && (
                  <details className="error-stack">
                    <summary>Stack trace</summary>
                    <pre>{step.error.stack}</pre>
                  </details>
                )}
              </div>
            )}

            {step.retries > 0 && (
              <div className="step-retries">
                Retried {step.retries} {step.retries === 1 ? 'time' : 'times'}
              </div>
            )}
          </div>
        ))}
      </div>

      {execution.error && (
        <div className="execution-error">
          <h4>Execution Failed</h4>
          <p>{execution.error.message}</p>
        </div>
      )}
    </div>
  );
};
