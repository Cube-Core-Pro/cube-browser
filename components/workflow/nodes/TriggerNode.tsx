/**
 * TriggerNode Component
 * 
 * Visual node for workflow triggers (Manual, Schedule, Webhook, File Watcher).
 * Green color scheme to indicate entry points.
 * 
 * @component
 */

'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Clock, Webhook, FileSearch, Play } from 'lucide-react';
import './TriggerNode.css';

interface TriggerNodeData {
  label: string;
  config: Record<string, string | number | boolean | null>;
  tier?: string;
}

export const TriggerNode = memo<NodeProps<TriggerNodeData>>(({ data, selected }) => {
  const getIcon = () => {
    if (data.label.includes('Schedule')) return <Clock className="node-icon" />;
    if (data.label.includes('Webhook')) return <Webhook className="node-icon" />;
    if (data.label.includes('File')) return <FileSearch className="node-icon" />;
    return <Play className="node-icon" />;
  };

  return (
    <div className={`trigger-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        {getIcon()}
        <span className="node-label">{data.label}</span>
        {data.tier && data.tier !== 'free' && (
          <span className={`node-tier tier-${data.tier}`}>{data.tier.toUpperCase()}</span>
        )}
      </div>
      
      <div className="node-body">
        {data.config.schedule && (
          <div className="config-item">
            <span className="config-label">Schedule:</span>
            <span className="config-value">{data.config.schedule}</span>
          </div>
        )}
        {data.config.url && (
          <div className="config-item">
            <span className="config-label">URL:</span>
            <span className="config-value">{data.config.url}</span>
          </div>
        )}
        {data.config.path && (
          <div className="config-item">
            <span className="config-label">Path:</span>
            <span className="config-value">{data.config.path}</span>
          </div>
        )}
      </div>

      {/* Only output handle (triggers are entry points) */}
      <Handle type="source" position={Position.Bottom} className="trigger-handle" />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';
