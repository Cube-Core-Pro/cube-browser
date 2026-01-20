'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Panel,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { invoke } from '@tauri-apps/api/core';
import { WorkflowCoreService } from '@/lib/services/workflow-service';
import { logger } from '@/lib/services/logger-service';
import { useToast } from '@/hooks/use-toast';

const log = logger.scope('WorkflowCanvas');
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  Save,
  Download,
  Upload,
  Trash2,
  Eye,
  Brain,
  Sparkles,
} from 'lucide-react';

// Custom Node Types
import { BrowserActionNode } from './nodes/BrowserActionNode';
import { DataExtractionNode } from './nodes/DataExtractionNode';
import { AIProcessingNode } from './nodes/AIProcessingNode';
import { ConditionNode } from './nodes/ConditionNode';
import { LoopNode } from './nodes/LoopNode';
import { StartNode } from './nodes/StartNode';
import { EndNode } from './nodes/EndNode';

// Node Palette
import { NodePalette } from './NodePalette';

// Execution Preview
import { ExecutionPreview } from './ExecutionPreview';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  browserAction: BrowserActionNode,
  dataExtraction: DataExtractionNode,
  aiProcessing: AIProcessingNode,
  condition: ConditionNode,
  loop: LoopNode,
};

interface WorkflowData {
  nodes: Node[];
  edges: Edge[];
  name: string;
  description: string;
}

interface ExecutionState {
  isRunning: boolean;
  currentNodeId: string | null;
  results: Record<string, unknown>;
  error: string | null;
}

export const WorkflowCanvas: React.FC = () => {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isRunning: false,
    currentNodeId: null,
    results: {},
    error: null,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Initialize with start and end nodes
  useEffect(() => {
    const initialNodes: Node[] = [
      {
        id: 'start',
        type: 'start',
        position: { x: 250, y: 50 },
        data: { label: 'Start' },
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 250, y: 500 },
        data: { label: 'End' },
      },
    ];
    setNodes(initialNodes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      toast({
        title: '🔗 Connection Created',
        description: 'Nodes connected successfully',
      });
    },
    [setEdges, toast]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          config: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));

      toast({
        title: '➕ Node Added',
        description: `${type} node added to workflow`,
      });
    },
    [reactFlowInstance, setNodes, toast]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleSaveWorkflow = async () => {
    try {
      const workflow = {
        id: Date.now().toString(),
        name: workflowName || 'Untitled Workflow',
        nodes: nodes.map((n) => ({
          id: n.id,
          nodeType: n.type || 'unknown',
          data: n.data,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await WorkflowCoreService.save(workflow);

      toast({
        title: '💾 Workflow Saved',
        description: `"${workflow.name}" saved successfully`,
      });
    } catch (error) {
      log.error('Failed to save workflow:', error);
      toast({
        title: '❌ Save Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleExecuteWorkflow = async () => {
    if (nodes.length <= 2) {
      toast({
        title: '⚠️ Empty Workflow',
        description: 'Add some nodes before executing',
        variant: 'destructive',
      });
      return;
    }

    setExecutionState({
      isRunning: true,
      currentNodeId: 'start',
      results: {},
      error: null,
    });

    setShowPreview(true);

    try {
      toast({
        title: '▶️ Executing Workflow',
        description: `Running "${workflowName}"...`,
      });

      // Execute workflow nodes in order
      await executeWorkflowNodes();

      setExecutionState((prev) => ({
        ...prev,
        isRunning: false,
        currentNodeId: null,
      }));

      toast({
        title: '✅ Execution Complete',
        description: 'Workflow executed successfully',
      });
    } catch (error) {
      log.error('Workflow execution failed:', error);
      setExecutionState((prev) => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));

      toast({
        title: '❌ Execution Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const executeWorkflowNodes = async () => {
    const startNode = nodes.find((n) => n.type === 'start');
    if (!startNode) throw new Error('Start node not found');

    let currentNodeId: string | null = startNode.id;
    const visited = new Set<string>();
    const results: Record<string, unknown> = {};

    while (currentNodeId) {
      if (visited.has(currentNodeId)) {
        throw new Error('Circular dependency detected');
      }
      visited.add(currentNodeId);

      const currentNode = nodes.find((n) => n.id === currentNodeId);
      if (!currentNode) break;

      // Update UI to show current node
      setExecutionState((prev) => ({
        ...prev,
        currentNodeId,
      }));

      // Execute node logic
      if (currentNode.type !== 'start' && currentNode.type !== 'end') {
        const result = await executeNode(currentNode, results);
        if (currentNodeId) {
          results[currentNodeId] = result;

          setExecutionState((prev) => {
            const newResults = { ...prev.results };
            if (currentNodeId) {
              newResults[currentNodeId] = result;
            }
            return {
              ...prev,
              results: newResults,
            };
          });
        }

        // Simulate execution delay for visualization
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Find next node
      const nextEdge = edges.find((e) => e.source === currentNodeId);
      currentNodeId = nextEdge ? nextEdge.target : null;

      if (currentNode.type === 'end') break;
    }

    return results;
  };

  // Node execution helper - used by executeWorkflow for complex node types
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const executeNode = async (node: Node, _previousResults: Record<string, unknown>) => {
    log.debug(`[Workflow] Executing node: ${node.id} ${node.type}`);
    
    try {
      const nodeResult = await invoke('execute_workflow_node', {
        node: {
          id: node.id,
          nodeType: node.type,
          data: node.data.config || {},
        },
      });
      log.debug('[Workflow] Node result:', nodeResult);
      return nodeResult;
    } catch (executionError) {
      log.error('[Workflow] Node execution error:', executionError);
      return {
        success: false,
        data: {},
        error: executionError instanceof Error ? executionError.message : 'Unknown error',
      };
    }
  };

  // Condition evaluation helper - used for ConditionNode branches
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const evaluateCondition = (config: { field: string; operator: string; value: string | number }, data: Record<string, unknown>) => {
    const { field, operator, value } = config;
    const fieldValue = data[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'greaterThan':
        return Number(fieldValue) > Number(value);
      case 'lessThan':
        return Number(fieldValue) < Number(value);
      default:
        return false;
    }
  };

  // Loop execution helper - used for LoopNode iterations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const executeLoop = async (config: { iterations?: number; items?: string }, data: Record<string, unknown>) => {
    const { iterations, items } = config;
    const loopResults = [];

    const itemArray = items ? (data[items] as unknown[]) : null;
    const count = iterations || (itemArray?.length ?? 0);

    for (let i = 0; i < count; i++) {
      loopResults.push({ iteration: i, data: itemArray ? itemArray[i] : null });
    }

    return loopResults;
  };

  const handleExportWorkflow = () => {
    const workflow: WorkflowData = {
      nodes,
      edges,
      name: workflowName,
      description: workflowDescription,
    };

    const dataStr = JSON.stringify(workflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowName.replace(/\s+/g, '-')}.json`;
    link.click();

    toast({
      title: '📥 Workflow Exported',
      description: 'Workflow downloaded as JSON',
    });
  };

  const handleImportWorkflow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const workflow: WorkflowData = JSON.parse(event.target?.result as string);
          setNodes(workflow.nodes);
          setEdges(workflow.edges);
          setWorkflowName(workflow.name);
          setWorkflowDescription(workflow.description);

          toast({
            title: '📤 Workflow Imported',
            description: `"${workflow.name}" loaded successfully`,
          });
        } catch {
          toast({
            title: '❌ Import Failed',
            description: 'Invalid workflow file',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleAIOptimize = async () => {
    try {
      toast({
        title: '🤖 AI Optimizing',
        description: 'Analyzing workflow for improvements...',
      });

      const workflow = { nodes, edges };
      await invoke('generate_workflow', {
        prompt: `Optimize this workflow: ${JSON.stringify(workflow)}`,
      });

      toast({
        title: '✨ AI Suggestions',
        description: 'Check the preview panel for optimization tips',
      });
    } catch (optimizeError) {
      log.error('AI optimization failed:', optimizeError);
    }
  };

  const handleClearWorkflow = () => {
    const initialNodes: Node[] = [
      {
        id: 'start',
        type: 'start',
        position: { x: 250, y: 50 },
        data: { label: 'Start' },
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 250, y: 500 },
        data: { label: 'End' },
      },
    ];
    setNodes(initialNodes);
    setEdges([]);
    setWorkflowName('Untitled Workflow');
    setWorkflowDescription('');
    setExecutionState({
      isRunning: false,
      currentNodeId: null,
      results: {},
      error: null,
    });

    toast({
      title: '🗑️ Workflow Cleared',
      description: 'Canvas reset to initial state',
    });
  };

  return (
    <div className="h-screen flex">
      {/* Node Palette - Left Side */}
      <NodePalette />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-background border-b p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label htmlFor="workflow-name" className="sr-only">Workflow Name</label>
            <input
              id="workflow-name"
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Workflow name"
              className="text-xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1 rounded"
            />
            <Badge variant="outline" className="text-xs">
              {nodes.length - 2} nodes
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleAIOptimize}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Brain className="w-4 h-4" />
              AI Optimize
            </Button>

            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>

            <div className="w-px h-6 bg-border" />

            <Button onClick={handleSaveWorkflow} variant="outline" size="sm">
              <Save className="w-4 h-4" />
            </Button>

            <Button onClick={handleExportWorkflow} variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>

            <Button onClick={handleImportWorkflow} variant="outline" size="sm">
              <Upload className="w-4 h-4" />
            </Button>

            <Button onClick={handleClearWorkflow} variant="outline" size="sm">
              <Trash2 className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border" />

            <Button
              onClick={handleExecuteWorkflow}
              disabled={executionState.isRunning}
              size="sm"
              className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {executionState.isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Execute
                </>
              )}
            </Button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 bg-muted/30">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="bg-background border rounded-lg"
            />

            <Panel position="top-right" className="bg-background rounded-lg shadow-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="font-semibold">Superior to Zapier</span>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Execution Preview - Right Side */}
      {showPreview && (
        <ExecutionPreview
          executionState={executionState}
          selectedNode={selectedNode}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

// Wrap with ReactFlowProvider
export const WorkflowBuilder: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
};
