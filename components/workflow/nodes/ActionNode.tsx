/**
 * ActionNode Component
 * 
 * Visual node for browser actions (Navigate, Click, Fill, Screenshot).
 * Blue color scheme for action steps.
 * 
 * @component
 */

'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MousePointer, Type, Camera, Navigation } from 'lucide-react';
import './ActionNode.css';

interface ActionNodeData {
  label: string;
  config: Record<string, string | number | boolean>;
  tier?: string;
}

export const ActionNode = memo<NodeProps<ActionNodeData>>(({ data, selected }) => {
  const getIcon = () => {
    if (data.label.includes('Navigate')) return <Navigation className="node-icon" />;
    if (data.label.includes('Click')) return <MousePointer className="node-icon" />;
    if (data.label.includes('Fill')) return <Type className="node-icon" />;
    if (data.label.includes('Screenshot')) return <Camera className="node-icon" />;
    return <MousePointer className="node-icon" />;
  };

  return (
    <div className={`action-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        {getIcon()}
        <span className="node-label">{data.label}</span>
        {data.tier && data.tier !== 'free' && (
          <span className={`node-tier tier-${data.tier}`}>{data.tier.toUpperCase()}</span>
        )}
      </div>
      
      <div className="node-body">
        {data.config.url && (
          <div className="config-item">
            <span className="config-label">URL:</span>
            <span className="config-value">{data.config.url}</span>
          </div>
        )}
        {data.config.selector && (
          <div className="config-item">
            <span className="config-label">Selector:</span>
            <span className="config-value">{data.config.selector}</span>
          </div>
        )}
        {data.config.value && (
          <div className="config-item">
            <span className="config-label">Value:</span>
            <span className="config-value">{data.config.value}</span>
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="action-handle-input" />
      <Handle type="source" position={Position.Bottom} className="action-handle-output" />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
