/**
 * DataNode Component
 * 
 * Visual node for data operations (Scraping, Transform, AI, Export).
 * Orange color scheme for data processing.
 * 
 * @component
 */

'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, Filter, Brain, FileDown } from 'lucide-react';
import './DataNode.css';

interface DataNodeData {
  label: string;
  config: Record<string, string | number | boolean | null>;
  tier?: string;
}

export const DataNode = memo<NodeProps<DataNodeData>>(({ data, selected }) => {
  const getIcon = () => {
    if (data.label.includes('Scrape') || data.label.includes('Extract')) return <Database className="node-icon" />;
    if (data.label.includes('Transform') || data.label.includes('Filter')) return <Filter className="node-icon" />;
    if (data.label.includes('AI')) return <Brain className="node-icon" />;
    if (data.label.includes('Export')) return <FileDown className="node-icon" />;
    return <Database className="node-icon" />;
  };

  return (
    <div className={`data-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        {getIcon()}
        <span className="node-label">{data.label}</span>
        {data.tier && data.tier !== 'free' && (
          <span className={`node-tier tier-${data.tier}`}>{data.tier.toUpperCase()}</span>
        )}
      </div>
      
      <div className="node-body">
        {data.config.selector && (
          <div className="config-item">
            <span className="config-label">Selector:</span>
            <span className="config-value">{data.config.selector}</span>
          </div>
        )}
        {data.config.format && (
          <div className="config-item">
            <span className="config-label">Format:</span>
            <span className="config-value">{data.config.format}</span>
          </div>
        )}
        {data.config.path && (
          <div className="config-item">
            <span className="config-label">Path:</span>
            <span className="config-value">{data.config.path}</span>
          </div>
        )}
        {data.config.prompt && (
          <div className="config-item">
            <span className="config-label">Prompt:</span>
            <span className="config-value">{String(data.config.prompt).substring(0, 50)}...</span>
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="data-handle-input" />
      <Handle type="source" position={Position.Bottom} className="data-handle-output" />
    </div>
  );
});

DataNode.displayName = 'DataNode';
