'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  WorkflowDefinition,
  WorkflowTrigger,
  WorkflowAction,
  WorkflowVariable,
  WorkflowStatus,
  WorkflowExecution,
} from '../../types/automation-enterprise';
import './WorkflowDesigner.css';

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'loop' | 'delay';
  name: string;
  position: { x: number; y: number };
  data: WorkflowTrigger | WorkflowAction | ConditionNode | LoopNode | DelayNode;
  connections: string[];
}

interface ConditionNode {
  id: string;
  expression: string;
  trueBranch: string;
  falseBranch: string;
}

interface LoopNode {
  id: string;
  type: 'for_each' | 'while' | 'count';
  config: Record<string, unknown>;
  body: string[];
}

interface DelayNode {
  id: string;
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}

interface Connection {
  id: string;
  from: string;
  to: string;
  condition?: string;
}

export interface WorkflowDesignerProps {
  workflow?: WorkflowDefinition;
  onSave?: (workflow: WorkflowDefinition) => void;
  onExecute?: (workflowId: string) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

// ============================================================================
// NODE TEMPLATES
// ============================================================================

const TRIGGER_TEMPLATES: Partial<WorkflowTrigger>[] = [
  { id: 'manual', type: 'manual', name: 'Manual Trigger', enabled: true },
  { id: 'schedule', type: 'cron', name: 'Schedule', config: { expression: '0 9 * * *' }, enabled: true },
  { id: 'webhook', type: 'webhook', name: 'Webhook', config: { path: '/webhook', method: 'POST' }, enabled: true },
  { id: 'event', type: 'event', name: 'Event Listener', config: { eventType: 'data.created' }, enabled: true },
];

const ACTION_TEMPLATES: Partial<WorkflowAction>[] = [
  { id: 'api_call', type: 'api_call', name: 'API Request', config: { method: 'GET', url: '' } },
  { id: 'browser', type: 'browser', name: 'Browser Action', config: { action: 'navigate' } },
  { id: 'data_transform', type: 'data_transform', name: 'Transform Data', config: { transformations: [] } },
  { id: 'db_query', type: 'db_query', name: 'Database Query', config: { query: '' } },
  { id: 'email', type: 'email', name: 'Send Email', config: { to: '', subject: '', body: '' } },
  { id: 'file', type: 'file', name: 'File Operation', config: { operation: 'read' } },
  { id: 'code', type: 'code', name: 'Run Code', config: { language: 'javascript', code: '' } },
  { id: 'integration', type: 'integration', name: 'Integration', config: { integration: '' } },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  workflow: initialWorkflow,
  onSave,
  onExecute,
  onClose,
  readOnly = false,
}) => {
  // State
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || 'New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState(initialWorkflow?.description || '');
  const [variables, setVariables] = useState<WorkflowVariable[]>(initialWorkflow?.variables || []);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showPalette, setShowPalette] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showProperties, setShowProperties] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [showExecutions, setShowExecutions] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'variables' | 'settings' | 'history'>('design');

  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize from workflow
  useEffect(() => {
    if (initialWorkflow) {
      const initialNodes: WorkflowNode[] = [];
      
      // Add trigger nodes
      initialWorkflow.triggers.forEach((trigger, index) => {
        initialNodes.push({
          id: trigger.id,
          type: 'trigger',
          name: trigger.name || `Trigger ${index + 1}`,
          position: { x: 100, y: 100 + index * 120 },
          data: trigger,
          connections: [],
        });
      });

      // Add action nodes
      initialWorkflow.actions.forEach((action, index) => {
        initialNodes.push({
          id: action.id,
          type: 'action',
          name: action.name,
          position: { x: 400, y: 100 + index * 120 },
          data: action,
          connections: [],
        });
      });

      setNodes(initialNodes);
      setVariables(initialWorkflow.variables);
    }
  }, [initialWorkflow]);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }, []);

  // Add node from palette
  const handleAddNode = useCallback((template: Partial<WorkflowTrigger | WorkflowAction>, type: 'trigger' | 'action') => {
    const newNode: WorkflowNode = {
      id: generateId(),
      type,
      name: template.name || 'New Node',
      position: { x: 250 + Math.random() * 100, y: 200 + Math.random() * 100 },
      data: { ...template, id: generateId() } as WorkflowTrigger | WorkflowAction,
      connections: [],
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
  }, [generateId]);

  // Add logic node (condition, loop, delay)
  const handleAddLogicNode = useCallback((nodeType: 'condition' | 'loop' | 'delay') => {
    const nodeId = generateId();
    let nodeData: ConditionNode | LoopNode | DelayNode;
    let nodeName: string;

    switch (nodeType) {
      case 'condition':
        nodeData = {
          id: nodeId,
          expression: '',
          trueBranch: '',
          falseBranch: '',
        } as ConditionNode;
        nodeName = 'Condition';
        break;
      case 'loop':
        nodeData = {
          id: nodeId,
          type: 'for_each',
          config: {},
          body: [],
        } as LoopNode;
        nodeName = 'Loop';
        break;
      case 'delay':
        nodeData = {
          id: nodeId,
          duration: 5,
          unit: 'seconds',
        } as DelayNode;
        nodeName = 'Delay';
        break;
    }

    const newNode: WorkflowNode = {
      id: nodeId,
      type: nodeType,
      name: nodeName,
      position: { x: 250 + Math.random() * 100, y: 200 + Math.random() * 100 },
      data: nodeData,
      connections: [],
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
  }, [generateId]);

  // Delete node
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // Handle node drag
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = (e.target as HTMLElement).closest('.workflow-node')?.getBoundingClientRect();
    if (!rect) return;

    setDragNode(nodeId);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setSelectedNode(nodeId);
  }, [nodes, readOnly]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragNode || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = (e.clientX - canvasRect.left - dragOffset.x - pan.x) / zoom;
    const newY = (e.clientY - canvasRect.top - dragOffset.y - pan.y) / zoom;

    setNodes(prev => prev.map(node => 
      node.id === dragNode
        ? { ...node, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
        : node
    ));
  }, [isDragging, dragNode, dragOffset, pan, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragNode(null);
  }, []);

  // Handle connection
  const handleStartConnection = useCallback((nodeId: string) => {
    if (readOnly) return;
    setIsConnecting(true);
    setConnectFrom(nodeId);
  }, [readOnly]);

  const handleEndConnection = useCallback((nodeId: string) => {
    if (!isConnecting || !connectFrom || connectFrom === nodeId) {
      setIsConnecting(false);
      setConnectFrom(null);
      return;
    }

    const newConnection: Connection = {
      id: generateId(),
      from: connectFrom,
      to: nodeId,
    };

    setConnections(prev => [...prev, newConnection]);
    setIsConnecting(false);
    setConnectFrom(null);
  }, [isConnecting, connectFrom, generateId]);

  // Delete connection
  const handleDeleteConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  }, []);

  // Build workflow definition
  const buildWorkflowDefinition = useCallback((): WorkflowDefinition => {
    const triggers = nodes
      .filter(n => n.type === 'trigger')
      .map(n => n.data as WorkflowTrigger);
    
    const actions = nodes
      .filter(n => n.type === 'action')
      .map(n => n.data as WorkflowAction);

    return {
      id: initialWorkflow?.id || generateId(),
      name: workflowName,
      description: workflowDescription,
      version: initialWorkflow?.version || '1.0.0',
      category: initialWorkflow?.category || 'automation',
      tags: initialWorkflow?.tags || [],
      status: 'draft' as WorkflowStatus,
      triggers,
      actions,
      variables,
      settings: initialWorkflow?.settings || {
        timeout: 300000,
        maxRetries: 3,
        continueOnError: false,
        logging: { enabled: true, level: 'info', destination: 'console' },
        notifications: { onSuccess: false, onFailure: true, channels: [] },
        security: { requireAuth: true, allowedRoles: [], encryption: true },
      },
      metadata: {
        createdAt: initialWorkflow?.metadata?.createdAt || new Date().toISOString(),
        createdBy: initialWorkflow?.metadata?.createdBy || 'current_user',
        updatedAt: new Date().toISOString(),
        updatedBy: 'current_user',
        runCount: initialWorkflow?.metadata?.runCount ?? 0,
        successCount: initialWorkflow?.metadata?.successCount ?? 0,
        failureCount: initialWorkflow?.metadata?.failureCount ?? 0,
        averageRunTime: initialWorkflow?.metadata?.averageRunTime ?? 0,
        tags: initialWorkflow?.metadata?.tags || [],
        category: initialWorkflow?.metadata?.category || 'automation',
      },
    };
  }, [nodes, workflowName, workflowDescription, variables, initialWorkflow, generateId]);

  // Save workflow
  const handleSave = useCallback(() => {
    const definition = buildWorkflowDefinition();
    onSave?.(definition);
  }, [buildWorkflowDefinition, onSave]);

  // Execute workflow
  const handleExecute = useCallback(() => {
    const definition = buildWorkflowDefinition();
    onExecute?.(definition.id);
  }, [buildWorkflowDefinition, onExecute]);

  // Add variable
  const handleAddVariable = useCallback(() => {
    const newVariable: WorkflowVariable = {
      name: `variable_${variables.length + 1}`,
      type: 'string',
      value: '',
      description: '',
      required: false,
      sensitive: false,
    };
    setVariables(prev => [...prev, newVariable]);
  }, [variables.length]);

  // Update variable
  const handleUpdateVariable = useCallback((index: number, updates: Partial<WorkflowVariable>) => {
    setVariables(prev => prev.map((v, i) => i === index ? { ...v, ...updates } : v));
  }, []);

  // Delete variable
  const handleDeleteVariable = useCallback((index: number) => {
    setVariables(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Render node
  const renderNode = (node: WorkflowNode) => {
    const isSelected = selectedNode === node.id;
    const nodeTypeClass = `node-type-${node.type}`;

    return (
      // eslint-disable-next-line react/forbid-component-props
      <div
        key={node.id}
        className={`workflow-node ${nodeTypeClass} ${isSelected ? 'selected' : ''}`}
        style={{
          '--node-x': `${node.position.x}px`,
          '--node-y': `${node.position.y}px`,
        } as React.CSSProperties}
        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
        onClick={() => setSelectedNode(node.id)}
      >
        <div className="node-header">
          <span className="node-icon">
            {node.type === 'trigger' && '⚡'}
            {node.type === 'action' && '▶️'}
            {node.type === 'condition' && '❓'}
            {node.type === 'loop' && '🔄'}
            {node.type === 'delay' && '⏱️'}
          </span>
          <span className="node-name">{node.name}</span>
          {!readOnly && (
            <button
              className="node-delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNode(node.id);
              }}
              aria-label={`Delete ${node.name}`}
            >
              ×
            </button>
          )}
        </div>
        <div className="node-body">
          <span className="node-type-label">{node.type}</span>
          {'type' in node.data && (
            <span className="node-subtype">{(node.data as WorkflowTrigger | WorkflowAction).type}</span>
          )}
        </div>
        <div className="node-ports">
          <div
            className="port input-port"
            onClick={(e) => {
              e.stopPropagation();
              handleEndConnection(node.id);
            }}
            title="Connect here"
          />
          <div
            className="port output-port"
            onClick={(e) => {
              e.stopPropagation();
              handleStartConnection(node.id);
            }}
            title="Drag to connect"
          />
        </div>
      </div>
    );
  };

  // Render connection lines
  const renderConnections = () => {
    return connections.map(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      
      if (!fromNode || !toNode) return null;

      const x1 = fromNode.position.x + 200;
      const y1 = fromNode.position.y + 40;
      const x2 = toNode.position.x;
      const y2 = toNode.position.y + 40;

      const midX = (x1 + x2) / 2;

      return (
        <g key={conn.id} className="connection">
          <path
            d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            className="connection-path"
          />
          {!readOnly && (
            <circle
              cx={midX}
              cy={(y1 + y2) / 2}
              r="8"
              fill="var(--bg-tertiary)"
              stroke="var(--color-accent)"
              className="connection-delete"
              onClick={() => handleDeleteConnection(conn.id)}
            >
              <title>Delete connection</title>
            </circle>
          )}
        </g>
      );
    });
  };

  // Selected node details
  const selectedNodeData = useMemo(() => {
    return nodes.find(n => n.id === selectedNode);
  }, [nodes, selectedNode]);

  return (
    <div className="workflow-designer">
      {/* Header */}
      <header className="designer-header">
        <div className="header-left">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="workflow-name-input"
            placeholder="Workflow name"
            disabled={readOnly}
          />
          <span className="workflow-status">Draft</span>
        </div>
        <div className="header-tabs">
          <button
            className={`tab ${activeTab === 'design' ? 'active' : ''}`}
            onClick={() => setActiveTab('design')}
          >
            Design
          </button>
          <button
            className={`tab ${activeTab === 'variables' ? 'active' : ''}`}
            onClick={() => setActiveTab('variables')}
          >
            Variables
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowExecutions(!showExecutions)}
          >
            Executions
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={nodes.length === 0}
          >
            Run
          </button>
          <button
            className="btn btn-success"
            onClick={handleSave}
            disabled={readOnly}
          >
            Save
          </button>
          {onClose && (
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="designer-content">
        {/* Node Palette */}
        {showPalette && activeTab === 'design' && (
          <aside className="node-palette">
            <div className="palette-section">
              <h3>Triggers</h3>
              <div className="palette-items">
                {TRIGGER_TEMPLATES.map(trigger => (
                  <div
                    key={trigger.id}
                    className="palette-item"
                    onClick={() => handleAddNode(trigger, 'trigger')}
                    draggable
                  >
                    <span className="item-icon">⚡</span>
                    <span className="item-name">{trigger.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="palette-section">
              <h3>Actions</h3>
              <div className="palette-items">
                {ACTION_TEMPLATES.map(action => (
                  <div
                    key={action.id}
                    className="palette-item"
                    onClick={() => handleAddNode(action, 'action')}
                    draggable
                  >
                    <span className="item-icon">▶️</span>
                    <span className="item-name">{action.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="palette-section">
              <h3>Logic</h3>
              <div className="palette-items">
                <div 
                  className="palette-item" 
                  onClick={() => handleAddLogicNode('condition')}
                  draggable
                >
                  <span className="item-icon">❓</span>
                  <span className="item-name">Condition</span>
                </div>
                <div 
                  className="palette-item" 
                  onClick={() => handleAddLogicNode('loop')}
                  draggable
                >
                  <span className="item-icon">🔄</span>
                  <span className="item-name">Loop</span>
                </div>
                <div 
                  className="palette-item" 
                  onClick={() => handleAddLogicNode('delay')}
                  draggable
                >
                  <span className="item-icon">⏱️</span>
                  <span className="item-name">Delay</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Canvas */}
        {activeTab === 'design' && (
          <div
            ref={canvasRef}
            className="workflow-canvas"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* eslint-disable-next-line react/forbid-component-props */}
            <div
              className="canvas-content"
              style={{
                '--pan-x': `${pan.x}px`,
                '--pan-y': `${pan.y}px`,
                '--zoom': zoom,
              } as React.CSSProperties}
            >
              {/* Connections SVG */}
              <svg className="connections-layer">
                {renderConnections()}
              </svg>

              {/* Nodes */}
              <div className="nodes-layer">
                {nodes.map(renderNode)}
              </div>

              {/* Empty state */}
              {nodes.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon">🔧</span>
                  <h3>Build your workflow</h3>
                  <p>Drag triggers and actions from the palette to get started</p>
                </div>
              )}
            </div>

            {/* Zoom controls */}
            <div className="zoom-controls">
              <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} aria-label="Zoom in">+</button>
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} aria-label="Zoom out">−</button>
              <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} aria-label="Reset zoom">⟲</button>
            </div>
          </div>
        )}

        {/* Variables Tab */}
        {activeTab === 'variables' && (
          <div className="variables-panel">
            <div className="panel-header">
              <h3>Workflow Variables</h3>
              <button className="btn btn-primary" onClick={handleAddVariable}>
                Add Variable
              </button>
            </div>
            <div className="variables-list">
              {variables.map((variable, index) => (
                <div key={index} className="variable-item">
                  <input
                    type="text"
                    value={variable.name}
                    onChange={(e) => handleUpdateVariable(index, { name: e.target.value })}
                    placeholder="Variable name"
                    className="variable-name"
                  />
                  <select
                    value={variable.type}
                    onChange={(e) => handleUpdateVariable(index, { type: e.target.value as WorkflowVariable['type'] })}
                    className="variable-type"
                    aria-label="Variable type"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="object">Object</option>
                    <option value="array">Array</option>
                  </select>
                  <input
                    type="text"
                    value={String(variable.value || '')}
                    onChange={(e) => handleUpdateVariable(index, { value: e.target.value })}
                    placeholder="Default value"
                    className="variable-value"
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={variable.required}
                      onChange={(e) => handleUpdateVariable(index, { required: e.target.checked })}
                    />
                    Required
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={variable.sensitive}
                      onChange={(e) => handleUpdateVariable(index, { sensitive: e.target.checked })}
                    />
                    Sensitive
                  </label>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteVariable(index)}
                    aria-label="Delete variable"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {variables.length === 0 && (
                <div className="empty-state">
                  <p>No variables defined. Add variables to use dynamic values in your workflow.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-panel">
            <div className="settings-group">
              <h3>General</h3>
              <div className="form-field">
                <label>Description</label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Describe what this workflow does"
                  rows={3}
                />
              </div>
            </div>
            <div className="settings-group">
              <h3>Execution</h3>
              <div className="form-field">
                <label htmlFor="timeout-input">Timeout (ms)</label>
                <input 
                  id="timeout-input"
                  type="number" 
                  defaultValue={300000} 
                  aria-label="Timeout in milliseconds"
                />
              </div>
              <div className="form-field">
                <label htmlFor="retries-input">Max Retries</label>
                <input 
                  id="retries-input"
                  type="number" 
                  defaultValue={3} 
                  aria-label="Maximum number of retries"
                />
              </div>
              <div className="form-field checkbox">
                <label>
                  <input type="checkbox" defaultChecked={false} />
                  Continue on error
                </label>
              </div>
            </div>
            <div className="settings-group">
              <h3>Notifications</h3>
              <div className="form-field checkbox">
                <label>
                  <input type="checkbox" defaultChecked={false} />
                  Notify on success
                </label>
              </div>
              <div className="form-field checkbox">
                <label>
                  <input type="checkbox" defaultChecked={true} />
                  Notify on failure
                </label>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-panel">
            <div className="panel-header">
              <h3>Execution History</h3>
            </div>
            <div className="executions-list">
              {executions.length === 0 ? (
                <div className="empty-state">
                  <p>No executions yet. Run the workflow to see history here.</p>
                </div>
              ) : (
                executions.map(exec => (
                  <div key={exec.executionId || exec.id} className={`execution-item status-${exec.status}`}>
                    <span className="exec-id">{(exec.executionId || exec.id).slice(0, 8)}...</span>
                    <span className="exec-status">{exec.status}</span>
                    <span className="exec-time">{new Date(exec.startedAt).toLocaleString()}</span>
                    <span className="exec-duration">{exec.metrics?.totalDuration || 0}ms</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Properties Panel */}
        {showProperties && activeTab === 'design' && selectedNodeData && (
          <aside className="properties-panel">
            <div className="panel-header">
              <h3>Node Properties</h3>
              <button
                className="btn btn-ghost"
                onClick={() => setSelectedNode(null)}
                aria-label="Close properties"
              >
                ×
              </button>
            </div>
            <div className="properties-content">
              <div className="form-field">
                <label>Name</label>
                <input
                  type="text"
                  value={selectedNodeData.name}
                  onChange={(e) => {
                    setNodes(prev => prev.map(n =>
                      n.id === selectedNode ? { ...n, name: e.target.value } : n
                    ));
                  }}
                  disabled={readOnly}
                />
              </div>
              <div className="form-field">
                <label htmlFor="node-type">Type</label>
                <input 
                  id="node-type"
                  type="text" 
                  value={selectedNodeData.type} 
                  disabled 
                  title="Node type"
                  aria-label="Node type"
                />
              </div>
              {'type' in selectedNodeData.data && (
                <div className="form-field">
                  <label htmlFor="node-subtype">Subtype</label>
                  <input
                    id="node-subtype"
                    type="text"
                    value={(selectedNodeData.data as WorkflowTrigger | WorkflowAction).type}
                    disabled
                    title="Node subtype"
                    aria-label="Node subtype"
                  />
                </div>
              )}
              <div className="form-field">
                <label htmlFor="node-config">Configuration</label>
                <textarea
                  id="node-config"
                  value={JSON.stringify((selectedNodeData.data as WorkflowAction).config || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value);
                      setNodes(prev => prev.map(n =>
                        n.id === selectedNode
                          ? { ...n, data: { ...n.data, config } }
                          : n
                      ));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={8}
                  disabled={readOnly}
                  title="Node configuration in JSON format"
                  aria-label="Node configuration"
                />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default WorkflowDesigner;
