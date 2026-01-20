'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('PipelineBuilder');

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Loader2 } from 'lucide-react';
import {
  DataPipeline,
  PipelineNode,
  PipelineConnection,
  PipelineExecution,
  PipelineNodeType,
} from '../../types/data-pipeline';
import './PipelineBuilder.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendPipelineNode {
  id: string;
  nodeType: string;
  name: string;
  config: Record<string, unknown>;
  positionX: number;
  positionY: number;
}

interface BackendPipelineConnection {
  id: string;
  sourceNodeId: string;
  sourcePort: string;
  targetNodeId: string;
  targetPort: string;
}

interface BackendPipeline {
  id: string;
  name: string;
  description: string;
  nodes: BackendPipelineNode[];
  connections: BackendPipelineConnection[];
  status: string;
  createdAt: number;
  lastRunAt: number | null;
  runCount: number;
}

interface BackendPipelineBuilderConfig {
  pipelines: BackendPipeline[];
  availableNodeTypes: string[];
}

// ============================================================================
// TYPES
// ============================================================================

interface PipelineBuilderProps {
  pipeline?: DataPipeline;
  onSave?: (pipeline: DataPipeline) => void;
  onExecute?: (pipelineId: string) => void;
  onNodeSelect?: (node: PipelineNode | null) => void;
}

type CanvasMode = 'select' | 'pan' | 'connect';
type PanelType = 'nodes' | 'properties' | 'executions' | 'lineage';

interface DragState {
  isDragging: boolean;
  nodeType: PipelineNodeType | null;
  startPos: { x: number; y: number };
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

const toFrontendNode = (backendNode: BackendPipelineNode): PipelineNode => ({
  id: backendNode.id,
  type: backendNode.nodeType as PipelineNodeType,
  name: backendNode.name,
  position: { x: backendNode.positionX, y: backendNode.positionY },
  config: backendNode.config,
  inputs: backendNode.nodeType !== 'source' ? [{ id: `input-${backendNode.id}`, name: 'input', type: 'default' }] : [],
  outputs: backendNode.nodeType !== 'destination' ? [{ id: `output-${backendNode.id}`, name: 'output', type: 'default' }] : [],
});

const toFrontendConnection = (backendConn: BackendPipelineConnection): PipelineConnection => ({
  id: backendConn.id,
  sourceId: backendConn.sourceNodeId,
  sourceNodeId: backendConn.sourceNodeId,
  sourcePort: backendConn.sourcePort,
  targetId: backendConn.targetNodeId,
  targetNodeId: backendConn.targetNodeId,
  targetPort: backendConn.targetPort,
});

const toFrontendPipeline = (backendPipeline: BackendPipeline): DataPipeline => ({
  id: backendPipeline.id,
  name: backendPipeline.name,
  description: backendPipeline.description,
  nodes: backendPipeline.nodes.map(toFrontendNode),
  connections: backendPipeline.connections.map(toFrontendConnection),
  status: backendPipeline.status as DataPipeline['status'],
  version: '1.0',
  sources: [],
  transformations: [],
  destinations: [],
  flow: { nodes: [], edges: [], errorHandlers: [] },
  schedule: { enabled: false, type: 'manual' },
  monitoring: { enabled: false, metricsInterval: 60, logLevel: 'info', tracing: false, profiling: false, customMetrics: [] },
  alerting: { enabled: false, rules: [], channels: [], escalation: { enabled: false, levels: [] } },
  compliance: { 
    enabled: false, 
    dataRetention: { enabled: false, days: 90 }, 
    dataLineage: { enabled: false, trackChanges: false }, 
    piiHandling: { enabled: false, maskFields: [], encryptFields: [], anonymizeFields: [] }, 
    auditLog: { enabled: false, logAccess: false, logChanges: false, retention: 90 } 
  },
  metadata: { 
    createdAt: new Date(backendPipeline.createdAt).toISOString(), 
    updatedAt: new Date().toISOString(), 
    createdBy: 'current-user', 
    updatedBy: 'current-user', 
    tags: [],
    category: 'data-pipeline',
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    avgDuration: 0,
    labels: {} 
  },
});

// ============================================================================
// NODE TEMPLATES
// ============================================================================

const NODE_TEMPLATES: Array<{
  type: PipelineNodeType;
  name: string;
  icon: string;
  description: string;
  category: 'source' | 'transform' | 'destination' | 'control';
}> = [
  // Sources
  { type: 'source', name: 'Database', icon: '🗄️', description: 'Connect to SQL/NoSQL databases', category: 'source' },
  { type: 'source', name: 'REST API', icon: '🌐', description: 'Fetch data from APIs', category: 'source' },
  { type: 'source', name: 'File Upload', icon: '📁', description: 'CSV, JSON, Excel files', category: 'source' },
  { type: 'source', name: 'Stream', icon: '📡', description: 'Kafka, RabbitMQ, etc.', category: 'source' },
  // Transforms
  { type: 'transform', name: 'Filter', icon: '🔍', description: 'Filter rows by condition', category: 'transform' },
  { type: 'transform', name: 'Map', icon: '🔄', description: 'Transform field values', category: 'transform' },
  { type: 'transform', name: 'Aggregate', icon: '📊', description: 'Group and aggregate data', category: 'transform' },
  { type: 'transform', name: 'Join', icon: '🔗', description: 'Merge datasets', category: 'transform' },
  { type: 'transform', name: 'Sort', icon: '📋', description: 'Order by fields', category: 'transform' },
  { type: 'transform', name: 'Dedupe', icon: '✨', description: 'Remove duplicates', category: 'transform' },
  { type: 'transform', name: 'Enrich', icon: '💡', description: 'Add computed fields', category: 'transform' },
  { type: 'transform', name: 'AI Transform', icon: '🤖', description: 'AI-powered transformation', category: 'transform' },
  // Destinations
  { type: 'destination', name: 'Database', icon: '🗃️', description: 'Write to database', category: 'destination' },
  { type: 'destination', name: 'Data Warehouse', icon: '🏭', description: 'Snowflake, BigQuery, etc.', category: 'destination' },
  { type: 'destination', name: 'File Export', icon: '📤', description: 'Export to file', category: 'destination' },
  { type: 'destination', name: 'API Push', icon: '📨', description: 'POST to API endpoint', category: 'destination' },
  // Control
  { type: 'branch', name: 'Condition', icon: '⚡', description: 'Branch by condition', category: 'control' },
  { type: 'merge', name: 'Merge', icon: '🔀', description: 'Merge branches', category: 'control' },
  { type: 'loop', name: 'Loop', icon: '🔁', description: 'Iterate over items', category: 'control' },
  { type: 'error_handler', name: 'Error Handler', icon: '🛡️', description: 'Handle errors', category: 'control' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PipelineBuilder: React.FC<PipelineBuilderProps> = ({
  pipeline,
  onSave,
  onExecute,
  onNodeSelect,
}) => {
  // State
  const [nodes, setNodes] = useState<PipelineNode[]>(pipeline?.nodes || []);
  const [connections, setConnections] = useState<PipelineConnection[]>(pipeline?.connections || []);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('select');
  const [activePanel, setActivePanel] = useState<PanelType>('nodes');
  const [nodeCategory, setNodeCategory] = useState<'source' | 'transform' | 'destination' | 'control'>('source');
  const [zoom, setZoom] = useState(100);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [pipelineName, setPipelineName] = useState(pipeline?.name || 'Untitled Pipeline');
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [executions, setExecutions] = useState<Partial<PipelineExecution>[]>([]);
  const [savedPipelines, setSavedPipelines] = useState<DataPipeline[]>([]);
  const [_availableNodeTypes, setAvailableNodeTypes] = useState<string[]>([]);

  // Drag state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeType: null,
    startPos: { x: 0, y: 0 },
  });

  // Load pipeline builder config and execution data from backend
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch pipeline builder configuration
        const config = await invoke<BackendPipelineBuilderConfig>('get_pipeline_builder_config');
        setSavedPipelines(config.pipelines.map(toFrontendPipeline));
        setAvailableNodeTypes(config.availableNodeTypes);

        // Get active executions from monitoring service
        const activeExecutions = await invoke<Array<{
          execution_id: string;
          workflow_id: string;
          status: string;
          started_at: number;
          ended_at?: number;
          records_processed: number;
          errors: number;
        }>>('metrics_get_active_executions');

        // Transform to PipelineExecution format
        const loadedExecutions: Partial<PipelineExecution>[] = activeExecutions.map(exec => ({
          id: exec.execution_id,
          status: exec.status as PipelineExecution['status'],
          startTime: new Date(exec.started_at).toISOString(),
          endTime: exec.ended_at ? new Date(exec.ended_at).toISOString() : undefined,
          recordsProcessed: exec.records_processed
        }));

        setExecutions(loadedExecutions);
      } catch (err) {
        log.error('Failed to load pipeline data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load pipeline data');
        setExecutions([]);
        setSavedPipelines([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle delete pipeline
  const handleDeletePipeline = async (id: string) => {
    try {
      await invoke('delete_enterprise_pipeline', { pipelineId: id });
      setSavedPipelines(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      log.error('Failed to delete pipeline:', err);
    }
  };

  // Handle toggle pipeline status
  const handleTogglePipelineStatus = async (id: string, status: string) => {
    try {
      await invoke('toggle_enterprise_pipeline', { pipelineId: id, status });
      setSavedPipelines(prev => prev.map(p => 
        p.id === id ? { ...p, status: status as DataPipeline['status'] } : p
      ));
    } catch (err) {
      log.error('Failed to toggle pipeline status:', err);
    }
  };

  // Filter nodes by category
  const filteredTemplates = useMemo(() => {
    return NODE_TEMPLATES.filter(t => t.category === nodeCategory);
  }, [nodeCategory]);

  // Get selected node data
  const selectedNodeData = useMemo(() => {
    return nodes.find(n => n.id === selectedNode);
  }, [nodes, selectedNode]);

  // Format duration
  const formatDuration = (start: string, end?: string): string => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Format number
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNode(nodeId);
    setSelectedConnection(null);
    const node = nodeId ? nodes.find(n => n.id === nodeId) || null : null;
    onNodeSelect?.(node);
  }, [nodes, onNodeSelect]);

  // Handle node drag from palette
  const handleNodeDragStart = useCallback((e: React.DragEvent, nodeType: PipelineNodeType) => {
    e.dataTransfer.setData('nodeType', nodeType);
    setDragState({
      isDragging: true,
      nodeType,
      startPos: { x: e.clientX, y: e.clientY },
    });
  }, []);

  // Handle drop on canvas
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType') as PipelineNodeType;
    if (!nodeType) return;

    const canvas = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - canvas.left - canvasOffset.x) / (zoom / 100);
    const y = (e.clientY - canvas.top - canvasOffset.y) / (zoom / 100);

    const template = NODE_TEMPLATES.find(t => t.type === nodeType);
    const newNode: PipelineNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      name: template?.name || 'New Node',
      position: { x, y },
      config: {},
      inputs: nodeType !== 'source' ? [{ id: `input-${Date.now()}`, name: 'input', type: 'default' }] : [],
      outputs: nodeType !== 'destination' ? [{ id: `output-${Date.now()}`, name: 'output', type: 'default' }] : [],
    };

    setNodes(prev => [...prev, newNode]);
    setDragState({ isDragging: false, nodeType: null, startPos: { x: 0, y: 0 } });
  }, [canvasOffset, zoom]);

  // Handle canvas drag over
  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Delete selected node
  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes(prev => prev.filter(n => n.id !== selectedNode));
    setConnections(prev => prev.filter(c => c.sourceNodeId !== selectedNode && c.targetNodeId !== selectedNode));
    setSelectedNode(null);
  }, [selectedNode]);

  // Save pipeline
  const handleSave = useCallback(() => {
    const updatedPipeline = {
      ...(pipeline || {
        id: `pipeline-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user',
        version: '1.0',
        status: 'draft' as const,
        description: '',
        sources: [],
        transformations: [],
        destinations: [],
        flow: { nodes: [], edges: [], errorHandlers: [] },
        schedule: { enabled: false, type: 'manual' as const },
        monitoring: { enabled: false, metricsInterval: 60, logLevel: 'info' as const, tracing: false, profiling: false, customMetrics: [] },
        alerting: { enabled: false, rules: [], channels: [], escalation: { enabled: false, levels: [] } },
        compliance: { enabled: false, dataRetention: { enabled: false, days: 90 }, dataLineage: { enabled: false, trackChanges: false }, piiHandling: { enabled: false, maskFields: [], encryptFields: [], anonymizeFields: [] }, auditLog: { enabled: false, logAccess: false, logChanges: false, retention: 90 } },
        metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'current-user', updatedBy: 'current-user', tags: [], labels: {} },
      }),
      name: pipelineName,
      nodes,
      connections,
      metadata: {
        createdAt: pipeline?.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: pipeline?.metadata?.createdBy || 'current-user',
        updatedBy: 'current-user',
        tags: pipeline?.metadata?.tags || [],
        labels: pipeline?.metadata?.labels || {},
      },
    } as DataPipeline;
    onSave?.(updatedPipeline);
  }, [pipeline, pipelineName, nodes, connections, onSave]);

  // Execute pipeline
  const handleExecute = useCallback(() => {
    if (pipeline?.id) {
      onExecute?.(pipeline.id);
    }
    setShowExecuteModal(false);
  }, [pipeline, onExecute]);

  // Render node on canvas
  const renderCanvasNode = (node: PipelineNode) => {
    const template = NODE_TEMPLATES.find(t => t.type === node.type);
    const isSelected = selectedNode === node.id;

    return (
      <div
        key={node.id}
        className={`canvas-node ${isSelected ? 'selected' : ''} node-${node.type}`}
        style={{
          left: node.position.x,
          top: node.position.y,
          transform: `scale(${zoom / 100})`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleNodeSelect(node.id);
        }}
      >
        <div className="node-header">
          <span className="node-icon">{template?.icon}</span>
          <span className="node-name">{node.name}</span>
        </div>
        <div className="node-ports">
          {node.inputs?.map(input => (
            <div key={input.id} className="port input-port" title={input.name}>
              <span className="port-dot" />
            </div>
          ))}
          {node.outputs?.map(output => (
            <div key={output.id} className="port output-port" title={output.name}>
              <span className="port-dot" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pipeline-builder">
      {/* Header */}
      <header className="builder-header">
        <div className="header-left">
          <input
            type="text"
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            className="pipeline-name-input"
            placeholder="Pipeline Name"
          />
          <span className="pipeline-status draft">Draft</span>
        </div>
        <div className="header-center">
          <div className="canvas-tools">
            <button
              className={`tool-btn ${canvasMode === 'select' ? 'active' : ''}`}
              onClick={() => setCanvasMode('select')}
              title="Select (V)"
            >
              ↖️
            </button>
            <button
              className={`tool-btn ${canvasMode === 'pan' ? 'active' : ''}`}
              onClick={() => setCanvasMode('pan')}
              title="Pan (H)"
            >
              ✋
            </button>
            <button
              className={`tool-btn ${canvasMode === 'connect' ? 'active' : ''}`}
              onClick={() => setCanvasMode('connect')}
              title="Connect (C)"
            >
              🔗
            </button>
            <div className="tool-divider" />
            <button
              className="tool-btn"
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              title="Zoom Out"
            >
              ➖
            </button>
            <span className="zoom-level">{zoom}%</span>
            <button
              className="tool-btn"
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              title="Zoom In"
            >
              ➕
            </button>
            <button
              className="tool-btn"
              onClick={() => setZoom(100)}
              title="Reset Zoom"
            >
              🎯
            </button>
          </div>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary" onClick={handleSave}>
            💾 Save
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowExecuteModal(true)}
            disabled={nodes.length === 0}
          >
            ▶️ Execute
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="builder-content">
        {/* Left Panel - Node Palette */}
        <aside className="left-panel">
          <div className="panel-tabs">
            <button
              className={`panel-tab ${activePanel === 'nodes' ? 'active' : ''}`}
              onClick={() => setActivePanel('nodes')}
            >
              Nodes
            </button>
            <button
              className={`panel-tab ${activePanel === 'executions' ? 'active' : ''}`}
              onClick={() => setActivePanel('executions')}
            >
              History
            </button>
          </div>

          {activePanel === 'nodes' && (
            <div className="node-palette">
              <div className="category-tabs">
                {(['source', 'transform', 'destination', 'control'] as const).map(cat => (
                  <button
                    key={cat}
                    className={`category-tab ${nodeCategory === cat ? 'active' : ''}`}
                    onClick={() => setNodeCategory(cat)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
              <div className="node-list">
                {filteredTemplates.map(template => (
                  <div
                    key={`${template.type}-${template.name}`}
                    className="node-template"
                    draggable
                    onDragStart={(e) => handleNodeDragStart(e, template.type)}
                  >
                    <span className="template-icon">{template.icon}</span>
                    <div className="template-info">
                      <span className="template-name">{template.name}</span>
                      <span className="template-desc">{template.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePanel === 'executions' && (
            <div className="executions-panel">
              <div className="executions-list">
                {executions.length === 0 && !loading && (
                  <div className="empty-executions">
                    <p>No executions yet</p>
                  </div>
                )}
                {executions.map(exec => (
                  <div key={exec.id} className={`execution-item status-${exec.status}`}>
                    <div className="exec-header">
                      <span className={`exec-status ${exec.status}`}>
                        {exec.status === 'completed' && '✅'}
                        {exec.status === 'running' && '🔄'}
                        {exec.status === 'failed' && '❌'}
                        {exec.status}
                      </span>
                      <span className="exec-duration">
                        {formatDuration(exec.startTime!, exec.endTime)}
                      </span>
                    </div>
                    <div className="exec-details">
                      <span className="exec-records">
                        {formatNumber(exec.recordsProcessed || 0)} records
                      </span>
                      <span className="exec-time">
                        {new Date(exec.startTime!).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Canvas */}
        <main
          className={`canvas-area mode-${canvasMode}`}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
          onClick={() => handleNodeSelect(null)}
        >
          <div
            className="canvas-content"
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
            }}
          >
            {/* Grid Background */}
            <div className="canvas-grid" />

            {/* Connections */}
            <svg className="connections-layer">
              {connections.map(conn => {
                const sourceNode = nodes.find(n => n.id === conn.sourceNodeId);
                const targetNode = nodes.find(n => n.id === conn.targetNodeId);
                if (!sourceNode || !targetNode) return null;

                const startX = sourceNode.position.x + 200;
                const startY = sourceNode.position.y + 40;
                const endX = targetNode.position.x;
                const endY = targetNode.position.y + 40;
                const midX = (startX + endX) / 2;

                return (
      <g key={conn.id}>
        <path
          d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
          className={`connection ${selectedConnection === conn.id ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedConnection(conn.id);
            setSelectedNode(null);
          }}
        />
      </g>
    );
  })}
</svg>

{/* Nodes */}
{nodes.map(node => renderCanvasNode(node))}

{/* Empty State */}
{nodes.length === 0 && (
  <div className="canvas-empty">
    <span className="empty-icon">🔧</span>
    <h3>Start Building Your Pipeline</h3>
    <p>Drag nodes from the left panel to begin</p>
  </div>
)}
</div>
</main>

{/* Right Panel - Properties */}
<aside className="right-panel">
<div className="panel-header">
  <h3>
    {selectedNodeData ? 'Node Properties' : 'Pipeline Settings'}
  </h3>
</div>

{selectedNodeData ? (
  <div className="properties-panel">
    <div className="property-group">
      <label>Node Name</label>
      <input
        type="text"
        value={selectedNodeData.name}
        onChange={(e) => {
          setNodes(prev =>
            prev.map(n =>
              n.id === selectedNode ? { ...n, name: e.target.value } : n
            )
          );
        }}
      />
    </div>
    <div className="property-group">
      <label>Type</label>
      <span className="property-value">{selectedNodeData.type}</span>
    </div>
    <div className="property-group">
      <label>Position</label>
      <div className="position-inputs">
        <input
          type="number"
          value={Math.round(selectedNodeData.position.x)}
          onChange={(e) => {
            setNodes(prev =>
              prev.map(n =>
                n.id === selectedNode
                  ? { ...n, position: { ...n.position, x: parseInt(e.target.value) } }
                  : n
              )
            );
          }}
          aria-label="X position"
        />
        <input
          type="number"
          value={Math.round(selectedNodeData.position.y)}
          onChange={(e) => {
            setNodes(prev =>
              prev.map(n =>
                n.id === selectedNode
                  ? { ...n, position: { ...n.position, y: parseInt(e.target.value) } }
                  : n
              )
            );
          }}
          aria-label="Y position"
        />
      </div>
    </div>
    <div className="property-divider" />
    <div className="property-group">
      <label>Configuration</label>
      <div className="config-placeholder">
        <p>Configure {selectedNodeData.type} settings</p>
        <button className="btn btn-secondary btn-sm">
          Open Configuration
        </button>
      </div>
    </div>
    <div className="property-actions">
      <button className="btn btn-ghost btn-sm">Duplicate</button>
      <button
        className="btn btn-ghost btn-sm btn-danger"
        onClick={handleDeleteNode}
      >
        Delete
      </button>
    </div>
  </div>
) : (
  <div className="pipeline-settings">
    <div className="property-group">
      <label>Description</label>
      <textarea
        placeholder="Describe what this pipeline does..."
        rows={3}
      />
    </div>
    <div className="property-group">
      <label>Schedule</label>
      <select defaultValue="" aria-label="Pipeline schedule">
        <option value="">Manual execution</option>
        <option value="hourly">Every hour</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="cron">Custom (Cron)</option>
      </select>
    </div>
    <div className="property-group">
      <label>Error Handling</label>
      <select defaultValue="stop" aria-label="Error handling policy">
        <option value="stop">Stop on error</option>
        <option value="skip">Skip failed records</option>
        <option value="retry">Retry failed operations</option>
      </select>
    </div>
    <div className="property-group">
      <label>Notifications</label>
      <div className="checkbox-group">
        <label className="checkbox-label">
          <input type="checkbox" defaultChecked />
          <span>On completion</span>
        </label>
        <label className="checkbox-label">
          <input type="checkbox" defaultChecked />
          <span>On failure</span>
        </label>
        <label className="checkbox-label">
          <input type="checkbox" />
          <span>On start</span>
        </label>
      </div>
    </div>
    <div className="pipeline-stats">
      <div className="stat-item">
        <span className="stat-value">{nodes.length}</span>
        <span className="stat-label">Nodes</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{connections.length}</span>
        <span className="stat-label">Connections</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{executions.length}</span>
        <span className="stat-label">Executions</span>
      </div>
    </div>

    {/* Saved Pipelines Section */}
    {savedPipelines.length > 0 && (
      <div className="saved-pipelines-section">
        <h4>Saved Pipelines</h4>
        <div className="saved-pipelines-list">
          {savedPipelines.map(p => (
            <div key={p.id} className="saved-pipeline-item">
              <div className="saved-pipeline-info">
                <span className="saved-pipeline-name">{p.name}</span>
                <span className={`saved-pipeline-status status-${p.status}`}>{p.status}</span>
              </div>
              <div className="saved-pipeline-actions">
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleTogglePipelineStatus(p.id, p.status === 'active' ? 'paused' : 'active')}
                  title={p.status === 'active' ? 'Pause' : 'Activate'}
                >
                  {p.status === 'active' ? '⏸️' : '▶️'}
                </button>
                <button
                  className="btn btn-ghost btn-xs btn-danger"
                  onClick={() => handleDeletePipeline(p.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}
</aside>
</div>

      {/* Execute Modal */}
      {showExecuteModal && (
        <div className="modal-overlay" onClick={() => setShowExecuteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Execute Pipeline</h2>
              <button
                className="modal-close"
                onClick={() => setShowExecuteModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="execute-warning">
                You are about to execute <strong>{pipelineName}</strong>
              </p>
              <div className="execute-summary">
                <div className="summary-item">
                  <span className="summary-label">Nodes:</span>
                  <span className="summary-value">{nodes.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Mode:</span>
                  <span className="summary-value">Full execution</span>
                </div>
              </div>
              <div className="execute-options">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Enable logging</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Dry run (no writes)</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowExecuteModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleExecute}>
                ▶️ Execute Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineBuilder;
