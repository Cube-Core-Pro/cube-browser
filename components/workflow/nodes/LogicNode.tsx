/**
 * LogicNode Component
 * 
 * Visual node for logic operations (If/Else, Loop, Switch, Wait, Parallel).
 * Purple color scheme for control flow.
 * 
 * @component
 */

'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, Repeat, Clock, Layers } from 'lucide-react';
import './LogicNode.css';

interface LogicNodeData {
  label: string;
  config: Record<string, string | number | boolean | null>;
  tier?: string;
}

export const LogicNode = memo<NodeProps<LogicNodeData>>(({ data, selected }) => {
  const getIcon = () => {
    if (data.label.includes('If') || data.label.includes('Switch')) return <GitBranch className="node-icon" />;
    if (data.label.includes('Loop')) return <Repeat className="node-icon" />;
    if (data.label.includes('Wait')) return <Clock className="node-icon" />;
    if (data.label.includes('Parallel')) return <Layers className="node-icon" />;
    return <GitBranch className="node-icon" />;
  };

  return (
    <div className={`logic-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        {getIcon()}
        <span className="node-label">{data.label}</span>
        {data.tier && data.tier !== 'free' && (
          <span className={`node-tier tier-${data.tier}`}>{data.tier.toUpperCase()}</span>
        )}
      </div>
      
      <div className="node-body">
        {data.config.condition && (
          <div className="config-item">
            <span className="config-label">Condition:</span>
            <span className="config-value">{data.config.condition}</span>
          </div>
        )}
        {data.config.iterations && (
          <div className="config-item">
            <span className="config-label">Iterations:</span>
            <span className="config-value">{data.config.iterations}</span>
          </div>
        )}
        {data.config.delay && (
          <div className="config-item">
            <span className="config-label">Delay:</span>
            <span className="config-value">{data.config.delay}ms</span>
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="logic-handle-input" />
      
      {/* Multiple outputs for branching logic */}
      {data.label.includes('If') && (
        <>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="true" 
            className="logic-handle-output-true"
            style={{ left: '30%' }}
          />
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="false" 
            className="logic-handle-output-false"
            style={{ left: '70%' }}
          />
        </>
      )}
      
      {!data.label.includes('If') && (
        <Handle type="source" position={Position.Bottom} className="logic-handle-output" />
      )}
    </div>
  );
});

LogicNode.displayName = 'LogicNode';
