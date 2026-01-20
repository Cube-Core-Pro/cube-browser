/**
 * Automation Studio - Visual Flow Builder
 * Canvas tipo Zapier/n8n con React Flow
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './AutomationStudio.css';
import { invoke } from '@tauri-apps/api/core';

import { Flow, NodeTemplate, FlowExecution, ExecutionStep } from '../types/automation';
import { CustomNode, NodePalette, FlowToolbar, ExecutionPanel } from './automation';
import { AIAssistant } from './ai/AIAssistant';
import { FlowManagementService } from '@/lib/services/automation-studio-service';
import { logger } from '@/lib/services/logger-service';
import { AppLayout } from '@/components/layout';
import {
  TourProvider,
  TourTooltip,
  TourOverlay,
  TourLauncher,
  TourWelcomeModal,
  TourCompletionModal,
  TourFeature,
  TourNextStep
} from '@/components/tour';
import { getTourStorageKey, getTourSettingsKey } from '@/components/tour/types';
import { allAutomationTourSections, allAutomationTourSteps, automationTourStats as _automationTourStats } from './automation/tour';
import { 
  Zap, Keyboard,
  Play, Clock, Globe, Compass, MousePointer, 
  BarChart2, Camera, GitBranch, Repeat, Timer,
  Wrench, Save, Bell
} from 'lucide-react';

const log = logger.scope('AutomationStudio');

// Automation-specific tour content
const automationTourFeatures: TourFeature[] = [
  { icon: '📦', label: 'Paleta de nodos drag & drop' },
  { icon: '🔗', label: 'Conexiones visuales intuitivas' },
  { icon: '🤖', label: 'AI Assistant integrado' },
  { icon: '📊', label: 'Ejecución en tiempo real' }
];

const automationNextSteps: TourNextStep[] = [
  { text: 'Arrastra tu primer trigger al canvas' },
  { text: 'Conecta una acción al trigger' },
  { text: 'Configura los parámetros de cada nodo' },
  { text: 'Ejecuta y monitorea tu primer flujo' }
];

// ============================================================================
// Skeleton Loader Component
// ============================================================================

const AutomationStudioSkeleton: React.FC = () => {
  return (
    <div className="automation-studio-skeleton">
      {/* Skeleton Toolbar */}
      <div className="skeleton-toolbar">
        <div className="skeleton-shimmer skeleton-toolbar-input" />
        <div className="skeleton-toolbar-divider" />
        <div className="skeleton-shimmer skeleton-toolbar-button" />
        <div className="skeleton-shimmer skeleton-toolbar-button" />
        <div className="skeleton-shimmer skeleton-toolbar-button" />
        <div className="skeleton-toolbar-divider" />
        <div className="skeleton-shimmer skeleton-toolbar-button--wide" />
        <div className="skeleton-shimmer skeleton-toolbar-button" />
      </div>

      <div className="skeleton-content">
        {/* Skeleton Palette */}
        <div className="skeleton-palette">
          <div className="skeleton-shimmer skeleton-palette-search" />
          
          {[1, 2, 3].map((section) => (
            <div key={section} className="skeleton-palette-section">
              <div className="skeleton-shimmer skeleton-palette-title" />
              {[1, 2, 3].map((item) => (
                <div key={item} className="skeleton-palette-item">
                  <div className="skeleton-shimmer skeleton-palette-icon" />
                  <div className="skeleton-palette-text">
                    <div className="skeleton-shimmer skeleton-palette-text-line" />
                    <div className="skeleton-shimmer skeleton-palette-text-line" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Skeleton Canvas */}
        <div className="skeleton-canvas">
          <div className="skeleton-canvas-grid" />
          
          <div className="skeleton-canvas-nodes">
            {/* First flow row */}
            <div className="skeleton-flow-row">
              <div className="skeleton-node">
                <div className="skeleton-node-header">
                  <div className="skeleton-shimmer skeleton-node-icon" />
                  <div className="skeleton-shimmer skeleton-node-title" />
                </div>
                <div className="skeleton-shimmer skeleton-node-description" />
              </div>
              <div className="skeleton-connection" />
              <div className="skeleton-node">
                <div className="skeleton-node-header">
                  <div className="skeleton-shimmer skeleton-node-icon" />
                  <div className="skeleton-shimmer skeleton-node-title" />
                </div>
                <div className="skeleton-shimmer skeleton-node-description" />
              </div>
              <div className="skeleton-connection" />
              <div className="skeleton-node">
                <div className="skeleton-node-header">
                  <div className="skeleton-shimmer skeleton-node-icon" />
                  <div className="skeleton-shimmer skeleton-node-title" />
                </div>
                <div className="skeleton-shimmer skeleton-node-description" />
              </div>
            </div>

            {/* Second flow row */}
            <div className="skeleton-flow-row">
              <div className="skeleton-node">
                <div className="skeleton-node-header">
                  <div className="skeleton-shimmer skeleton-node-icon" />
                  <div className="skeleton-shimmer skeleton-node-title" />
                </div>
                <div className="skeleton-shimmer skeleton-node-description" />
              </div>
              <div className="skeleton-connection" />
              <div className="skeleton-node">
                <div className="skeleton-node-header">
                  <div className="skeleton-shimmer skeleton-node-icon" />
                  <div className="skeleton-shimmer skeleton-node-title" />
                </div>
                <div className="skeleton-shimmer skeleton-node-description" />
              </div>
            </div>
          </div>

          {/* Skeleton Controls */}
          <div className="skeleton-controls">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-shimmer skeleton-control-button" />
            ))}
          </div>

          {/* Skeleton Minimap */}
          <div className="skeleton-minimap">
            <div className="skeleton-shimmer skeleton-minimap-content" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Node types personalizados
const nodeTypes = {
  custom: CustomNode,
};

// Plantillas de nodos predefinidas
const nodeTemplates: NodeTemplate[] = [
  // Triggers
  {
    type: 'trigger',
    label: 'Manual Trigger',
    description: 'Start flow manually',
    icon: <Play size={10} />,
    category: 'trigger',
    defaultConfig: { triggerType: 'manual' },
  },
  {
    type: 'trigger',
    label: 'Schedule',
    description: 'Run on schedule (cron)',
    icon: <Clock size={10} />,
    category: 'trigger',
    defaultConfig: { triggerType: 'schedule', schedule: '0 9 * * *' },
  },
  {
    type: 'trigger',
    label: 'Webhook',
    description: 'Trigger via HTTP webhook',
    icon: <Globe size={10} />,
    category: 'trigger',
    defaultConfig: { triggerType: 'webhook' },
  },
  
  // Actions
  {
    type: 'action',
    label: 'Navigate',
    description: 'Navigate to URL',
    icon: <Compass size={10} />,
    category: 'action',
    defaultConfig: { actionType: 'navigate', url: 'https://example.com' },
  },
  {
    type: 'action',
    label: 'Click',
    description: 'Click on element',
    icon: <MousePointer size={10} />,
    category: 'action',
    defaultConfig: { actionType: 'click', selector: '' },
  },
  {
    type: 'action',
    label: 'Type Text',
    description: 'Type text into input',
    icon: <Keyboard size={10} />,
    category: 'action',
    defaultConfig: { actionType: 'type', selector: '', value: '' },
  },
  {
    type: 'action',
    label: 'Extract Data',
    description: 'Extract data from page',
    icon: <BarChart2 size={10} />,
    category: 'action',
    defaultConfig: { actionType: 'extract', selector: '' },
  },
  {
    type: 'action',
    label: 'Screenshot',
    description: 'Take screenshot',
    icon: <Camera size={10} />,
    category: 'action',
    defaultConfig: { actionType: 'screenshot' },
  },
  
  // Logic
  {
    type: 'condition',
    label: 'Condition',
    description: 'If/Else logic',
    icon: <GitBranch size={10} />,
    category: 'logic',
    defaultConfig: { condition: { left: '', operator: '==', right: '' } },
  },
  {
    type: 'loop',
    label: 'Loop',
    description: 'Iterate over items',
    icon: <Repeat size={10} />,
    category: 'logic',
    defaultConfig: { loop: { items: '', maxIterations: 100 } },
  },
  {
    type: 'wait',
    label: 'Wait',
    description: 'Wait for element or delay',
    icon: <Timer size={10} />,
    category: 'logic',
    defaultConfig: { timeout: 5000 },
  },
  
  // Data
  {
    type: 'data',
    label: 'Transform',
    description: 'Transform data',
    icon: <Wrench size={10} />,
    category: 'data',
    defaultConfig: { dataTransform: { input: '', operation: 'map', code: '' } },
  },
  {
    type: 'storage',
    label: 'Storage',
    description: 'Save/Load data',
    icon: <Save size={10} />,
    category: 'data',
    defaultConfig: { storage: { operation: 'save', key: '', value: '' } },
  },
  
  // Integration
  {
    type: 'api',
    label: 'HTTP Request',
    description: 'Call external API',
    icon: <Globe size={10} />,
    category: 'integration',
    defaultConfig: { api: { method: 'GET', url: '' } },
  },
  {
    type: 'notification',
    label: 'Notification',
    description: 'Send notification',
    icon: <Bell size={10} />,
    category: 'integration',
    defaultConfig: { notification: { type: 'desktop', message: '' } },
  },
];

export const AutomationStudio: React.FC = () => {
  // Loading state - simulate initial data fetch
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);
  
  // Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // UI state
  const [showPalette, setShowPalette] = useState(true);
  const [showExecution, setShowExecution] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<FlowExecution | null>(null);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [isRecording, setIsRecording] = useState(false);

  // Tour state
  const [showTourWelcome, setShowTourWelcome] = useState(false);
  const [showTourCompletion, setShowTourCompletion] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Simulate loading saved flows on mount
  useEffect(() => {
    const loadFlows = async () => {
      try {
        // Load saved flows from backend using AutomationStudioService
        const savedFlows = await FlowManagementService.getFlows();
        
        // If there are saved flows, could restore the last one
        if (savedFlows && savedFlows.length > 0) {
          const lastFlow = savedFlows[0];
          setFlowName(lastFlow.name || 'Untitled Flow');
          // Nodes and edges would be restored from lastFlow.nodes, lastFlow.edges
        }
        
        setIsLoading(false);
      } catch (error) {
        log.error('Failed to load flows:', error);
        // Still allow usage even if backend fails
        setIsLoading(false);
      }
    };
    loadFlows();
  }, []);

  // Clean up legacy tour storage keys that might interfere
  useEffect(() => {
    // Remove legacy/incorrect tour keys that might cause wrong tour to display
    const legacyKeys = [
      'cube-automation-tour-seen',           // Old format
      'cube_email_tour_progress',            // Email marketing tour
      'cube_email_tour_settings',            // Email marketing settings
      'cube-email-tour-seen',                // Old email format
      'cube_tour_progress',                  // Generic tour
      'cube_tour_settings',                  // Generic settings
    ];
    
    legacyKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
    });
  }, []);

  // Check if user should see tour welcome
  useEffect(() => {
    // Use the proper tour storage key for automation module
    const tourSeenKey = `cube_automation_tour_seen`;
    const hasSeenTour = localStorage.getItem(tourSeenKey);
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setShowTourWelcome(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Tour handlers
  const handleStartTour = useCallback(() => {
    // Use proper storage keys for automation module
    const tourSeenKey = `cube_automation_tour_seen`;
    const storageKey = getTourStorageKey('automation');
    const settingsKey = getTourSettingsKey('automation');
    
    localStorage.setItem(tourSeenKey, 'true');
    // Clear any previous tour progress for fresh start
    localStorage.removeItem(storageKey);
    localStorage.removeItem(settingsKey);
    setShowTourWelcome(false);
  }, []);

  const handleSkipTour = useCallback(() => {
    const tourSeenKey = `cube_automation_tour_seen`;
    localStorage.setItem(tourSeenKey, 'true');
    setShowTourWelcome(false);
  }, []);

  const handleRestartTour = useCallback(() => {
    const storageKey = getTourStorageKey('automation');
    const settingsKey = getTourSettingsKey('automation');
    localStorage.removeItem(storageKey);
    localStorage.removeItem(settingsKey);
    setShowTourCompletion(false);
  }, []);

  // Connect nodes (MUST be before any conditional returns - hooks rule)
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          eds
        )
      ),
    [setEdges]
  );

  // Add node from palette
  const onAddNode = useCallback(
    (template: NodeTemplate) => {
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        },
        data: {
          label: template.label,
          description: template.description,
          icon: template.icon,
          nodeType: template.type,
          config: template.defaultConfig,
          status: 'idle',
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  // Delete node
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [selectedNode, setNodes, setEdges]
  );

  // Run flow
  const onRunFlow = useCallback(async () => {
    try {
      setShowExecution(true);
      
      // Preparar flow para ejecución
      const flow: Flow = {
        id: `flow-${Date.now()}`,
        name: flowName,
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data.nodeType,
          position: n.position,
          data: {
            label: n.data.label,
            description: n.data.description,
            icon: n.data.icon,
            config: n.data.config,
          },
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle || undefined,
          targetHandle: e.targetHandle || undefined,
        })),
        variables: [],
        secrets: [],
        settings: {
          maxRetries: 3,
          retryDelay: 1000,
          timeout: 30000,
          errorHandling: 'stop',
          logging: 'all',
          notifications: {
            onSuccess: false,
            onError: true,
          },
        },
        status: 'active',
      };

      // Ejecutar en backend
      const execution = await invoke<FlowExecution>('automation_execute_flow', { flow });
      setCurrentExecution(execution);
      
      // Actualizar estados de nodos
      execution.steps.forEach((step: ExecutionStep) => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === step.nodeId
              ? { ...n, data: { ...n.data, status: step.status, output: step.output } }
              : n
          )
        );
      });
    } catch (error) {
      log.error('Flow execution failed:', error);
    }
  }, [nodes, edges, flowName, setNodes]);

  // Save flow
  const onSaveFlow = useCallback(async () => {
    try {
      const flow: Flow = {
        id: `flow-${Date.now()}`,
        name: flowName,
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data.nodeType,
          position: n.position,
          data: n.data,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        })),
        variables: [],
        secrets: [],
        settings: {
          maxRetries: 3,
          retryDelay: 1000,
          timeout: 30000,
          errorHandling: 'stop',
          logging: 'all',
          notifications: {
            onSuccess: false,
            onError: true,
          },
        },
        status: 'draft',
      };

      await invoke('automation_save_flow', { flow });
      log.debug('✅ Flow saved');
    } catch (error) {
      log.error('Failed to save flow:', error);
    }
  }, [nodes, edges, flowName]);

  // Toggle recorder
  const onToggleRecorder = useCallback(async () => {
    try {
      if (isRecording) {
        const actions = await invoke('automation_stop_recording');
        log.debug('📹 Recording stopped:', actions);
      } else {
        await invoke('automation_start_recording');
        log.debug('🔴 Recording started');
      }
      setIsRecording(!isRecording);
    } catch (error) {
      log.error('Recorder error:', error);
    }
  }, [isRecording]);

  return (
    <AppLayout tier="elite">
      <TourProvider
        tourId="automation"
        steps={allAutomationTourSteps}
        sections={allAutomationTourSections}
        onComplete={() => setShowTourCompletion(true)}
      >
        <div className="automation-studio" data-tour="automation-container">
          {/* Toolbar */}
          <FlowToolbar
            flowName={flowName}
            onFlowNameChange={setFlowName}
            onRun={onRunFlow}
            onSave={onSaveFlow}
            onToggleRecorder={onToggleRecorder}
            isRecording={isRecording}
            onTogglePalette={() => setShowPalette(!showPalette)}
            onToggleExecution={() => setShowExecution(!showExecution)}
            onToggleAI={() => setShowAI(!showAI)}
          />

          <div className="automation-studio-content">
            {/* Node Palette */}
            {showPalette && (
              <div data-tour="node-palette">
                <NodePalette
                  templates={nodeTemplates}
                  onAddNode={onAddNode}
                  onClose={() => setShowPalette(false)}
                />
              </div>
            )}

            {/* Canvas */}
            <div ref={reactFlowWrapper} className="automation-canvas" data-tour="automation-canvas">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, node) => setSelectedNode(node)}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid={true}
                snapGrid={[15, 15]}
                deleteKeyCode={['Backspace', 'Delete']}
                attributionPosition="bottom-left"
              >
                <Background 
                  variant={BackgroundVariant.Dots} 
                  gap={15} 
                  size={1} 
                  color="var(--border-primary)"
                />
                <Controls />
                <MiniMap
                  nodeColor={(node) => {
                    switch (node.data.status) {
                      case 'running': return '#3b82f6';
                      case 'success': return '#10b981';
                      case 'error': return '#ef4444';
                      default: return '#94a3b8';
                    }
                  }}
                  position="bottom-right"
                  data-tour="minimap"
                />
                
                {/* Empty state */}
                {nodes.length === 0 && (
                  <Panel position="top-center" className="empty-state-panel">
                    <div className="automation-empty-state">
                      <Zap size={64} className="empty-icon" />
                      <h3>Start Building Your Automation</h3>
                      <p>Add nodes from the palette (N) or start recording (Shift+R)</p>
                      <button 
                        className="btn-link"
                        onClick={() => setShowKeyboardHints(true)}
                      >
                        <Keyboard size={16} />
                        <span>View keyboard shortcuts</span>
                      </button>
                    </div>
                  </Panel>
                )}

                {/* Keyboard Hints Overlay */}
                {showKeyboardHints && (
                  <Panel position="top-center" className="keyboard-hints-panel">
                    <div className="keyboard-hints-overlay">
                      <div className="keyboard-hints-header">
                        <div className="keyboard-hints-title">
                          <Keyboard size={20} />
                          <h3>Keyboard Shortcuts</h3>
                        </div>
                        <button 
                          className="btn-icon-close"
                          onClick={() => setShowKeyboardHints(false)}
                          title="Close (Esc or ?)"
                        >
                          ×
                        </button>
                      </div>
                      <div className="keyboard-hints-grid">
                        <div className="keyboard-hint">
                          <kbd>N</kbd>
                          <span>Toggle node palette</span>
                        </div>
                        <div className="keyboard-hint">
                          <kbd>Shift</kbd> + <kbd>R</kbd>
                          <span>Start/Stop recording</span>
                        </div>
                        <div className="keyboard-hint">
                          <kbd>Cmd/Ctrl</kbd> + <kbd>K</kbd>
                          <span>Open AI Assistant</span>
                        </div>
                        <div className="keyboard-hint">
                          <kbd>Cmd/Ctrl</kbd> + <kbd>Enter</kbd>
                          <span>Run flow</span>
                        </div>
                        <div className="keyboard-hint">
                          <kbd>Cmd/Ctrl</kbd> + <kbd>S</kbd>
                          <span>Save flow</span>
                        </div>
                        <div className="keyboard-hint">
                          <kbd>Delete</kbd> / <kbd>Backspace</kbd>
                          <span>Delete selected node</span>
                        </div>
                        <div className="keyboard-hint">
                          <kbd>Space</kbd> + <span className="muted">drag</span>
                          <span>Pan canvas</span>
                        </div>
                        <div className="keyboard-hint">
                          <kbd>Scroll</kbd>
                          <span>Zoom in/out</span>
                        </div>
                        <div className="keyboard-hint">
                          <kbd>?</kbd>
                          <span>Toggle this help</span>
                        </div>
                      </div>
                    </div>
                  </Panel>
                )}
              </ReactFlow>
            </div>

            {/* Execution Panel */}
            {showExecution && (
              <ExecutionPanel
                execution={currentExecution}
                onClose={() => setShowExecution(false)}
              />
            )}

            {/* AI Assistant */}
            {showAI && (
              <AIAssistant
                onClose={() => setShowAI(false)}
              />
            )}
          </div>

          {/* Tour Components */}
          <TourTooltip />
          <TourOverlay />
          <TourLauncher variant="fab" showProgress moduleTitle="Tour de Automation Studio" />
          
          <TourWelcomeModal
            isOpen={showTourWelcome}
            onClose={() => setShowTourWelcome(false)}
            onStartTour={handleStartTour}
            onSkip={handleSkipTour}
            title="¡Bienvenido a Automation Studio! 🤖"
            subtitle="Construye flujos de trabajo visuales como un profesional"
            features={automationTourFeatures}
          />
          
          <TourCompletionModal
            isOpen={showTourCompletion}
            onClose={() => setShowTourCompletion(false)}
            onRestart={handleRestartTour}
            title="¡Eres un Automation Master! 🎉"
            subtitle="Ahora dominas el constructor visual de workflows"
            badgeName="Automation Pro"
            nextSteps={automationNextSteps}
            primaryActionText="¡Crear Mi Primer Flujo!"
          />
        </div>
      </TourProvider>
    </AppLayout>
  );
};

export { AutomationStudioSkeleton };
export default AutomationStudio;