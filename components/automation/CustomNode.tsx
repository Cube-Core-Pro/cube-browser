/**
 * Custom Node Component - Nodo visual personalizado con acciones
 * Enterprise-grade node with smart action buttons
 */

import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Loader2, CheckCircle, XCircle, Settings, AlertTriangle, Trash2, Edit2 } from 'lucide-react';
import './CustomNode.css';

export const CustomNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const [showActions, setShowActions] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { deleteElements, setNodes } = useReactFlow();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const hoverTimeout = hoverTimeoutRef.current;
    const tooltipTimeout = tooltipTimeoutRef.current;
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      if (tooltipTimeout) clearTimeout(tooltipTimeout);
    };
  }, []);

  const getStatusIcon = () => {
    switch (data.status) {
      case 'running': return <Loader2 size={10} className="animate-spin" />;
      case 'success': return <CheckCircle size={10} />;
      case 'error': return <XCircle size={10} />;
      default: return data.icon || <Settings size={10} />;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    deleteElements({ nodes: [{ id }] });
    setShowActions(false);
    setShowTooltip(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, isEditing: !node.data.isEditing } }
          : node
      )
    );
    setShowActions(false);
    setShowTooltip(false);
  };

  const handleMouseEnter = () => {
    // Show actions immediately
    setShowActions(true);
    // Show tooltip after a delay (only if there's a description)
    if (data.description) {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 800); // 800ms delay before showing tooltip
    }
  };

  const handleMouseLeave = () => {
    setShowActions(false);
    setShowTooltip(false);
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
  };

  return (
    <div 
      className={`custom-node ${selected ? 'selected' : ''} ${data.status || ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Input handle */}
      {data.nodeType !== 'trigger' && (
        <Handle type="target" position={Position.Top} />
      )}

      {/* Node actions - visible on hover or when selected */}
      <div className={`node-actions ${showActions || selected ? 'visible' : ''}`}>
        <button 
          className="node-action-btn edit" 
          onClick={handleEdit}
          onMouseEnter={() => setShowTooltip(false)}
          aria-label="Edit node"
        >
          <Edit2 size={10} />
        </button>
        <button 
          className="node-action-btn delete" 
          onClick={handleDelete}
          onMouseEnter={() => setShowTooltip(false)}
          aria-label="Delete node"
        >
          <Trash2 size={10} />
        </button>
      </div>

      {/* Node content */}
      <div className="node-header">
        <span className="node-icon">{getStatusIcon()}</span>
        <span className="node-label">{data.label}</span>
      </div>

      {/* Smart tooltip - shows BELOW node after delay, hides when hovering actions */}
      {data.description && showTooltip && !selected && (
        <div className="node-tooltip">
          <span className="node-tooltip-arrow" />
          {data.description}
        </div>
      )}

      {data.error && (
        <div className="node-error" title={data.error}>
          <AlertTriangle size={10} /> Error
        </div>
      )}

      {/* Output handle */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
