/**
 * Workflow Designer Tour Steps
 * CUBE Elite v7.0.0 - Visual Workflow Builder
 * 
 * Comprehensive guided tour for workflow automation
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for Workflow module
 * Covers: Canvas, Nodes, Connections, Execution
 */
export const workflowTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'workflow-welcome',
    target: '[data-tour="workflow-module"]',
    title: '🔄 Workflow Designer',
    content: `Welcome to CUBE Workflow Designer!

**Key Features:**
• Visual node-based builder
• Drag & drop interface
• AI-powered nodes
• Browser automation
• Data extraction
• Conditional logic

Build powerful automations visually.`,
    placement: 'center',
    position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Canvas
  // ============================================================================
  {
    id: 'workflow-canvas',
    target: '[data-tour="workflow-canvas"]',
    title: '🎨 Workflow Canvas',
    content: `The main design area:

**Canvas Features:**
• Infinite scrolling
• Zoom in/out
• Grid snapping
• MiniMap navigation

Drag nodes here to build.`,
    placement: 'center',
    position: 'center',
    category: 'canvas',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'workflow-controls',
    target: '[data-tour="canvas-controls"]',
    title: '🎛️ Canvas Controls',
    content: `Navigate the canvas:

**Controls:**
• ➕ Zoom in
• ➖ Zoom out
• ⬜ Fit view
• 🔒 Lock

Pan: Click & drag background`,
    placement: 'left',
    position: 'left',
    category: 'canvas',
    showProgress: true
  },
  {
    id: 'workflow-minimap',
    target: '[data-tour="minimap"]',
    title: '🗺️ MiniMap',
    content: `Overview navigation:

**MiniMap Shows:**
• All nodes
• Current viewport
• Click to navigate

Great for large workflows!`,
    placement: 'left',
    position: 'left',
    category: 'canvas',
    showProgress: true
  },

  // ============================================================================
  // SECTION 3: Node Palette
  // ============================================================================
  {
    id: 'workflow-palette',
    target: '[data-tour="node-palette"]',
    title: '📦 Node Palette',
    content: `Available node types:

**Node Categories:**
• 🌐 Browser Actions
• 📊 Data Extraction
• 🤖 AI Processing
• ❓ Conditions
• 🔄 Loops

Drag nodes to canvas.`,
    placement: 'right',
    position: 'right',
    category: 'nodes',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'workflow-browser-nodes',
    target: '[data-tour="browser-nodes"]',
    title: '🌐 Browser Nodes',
    content: `Web automation:

**Browser Actions:**
• Navigate to URL
• Click element
• Fill form
• Screenshot
• Wait for element

Automate any website!`,
    placement: 'right',
    position: 'right',
    category: 'nodes',
    showProgress: true
  },
  {
    id: 'workflow-data-nodes',
    target: '[data-tour="data-nodes"]',
    title: '📊 Data Nodes',
    content: `Extract & transform:

**Data Actions:**
• Extract text
• Extract table
• Parse JSON
• Transform data
• Export results

Process web data easily.`,
    placement: 'right',
    position: 'right',
    category: 'nodes',
    showProgress: true
  },
  {
    id: 'workflow-ai-nodes',
    target: '[data-tour="ai-nodes"]',
    title: '🤖 AI Nodes',
    content: `AI-powered processing:

**AI Actions:**
• Analyze content
• Generate text
• Classify data
• Extract entities
• Summarize

Add intelligence to workflows!`,
    placement: 'right',
    position: 'right',
    category: 'nodes',
    showProgress: true
  },
  {
    id: 'workflow-logic-nodes',
    target: '[data-tour="logic-nodes"]',
    title: '🔀 Logic Nodes',
    content: `Control flow:

**Logic Types:**
• **Condition**: If/then branching
• **Loop**: Repeat actions
• **Switch**: Multiple paths
• **Delay**: Wait time

Build complex logic.`,
    placement: 'right',
    position: 'right',
    category: 'nodes',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: Connections
  // ============================================================================
  {
    id: 'workflow-connections',
    target: '[data-tour="node-connections"]',
    title: '🔗 Connections',
    content: `Link nodes together:

**How to Connect:**
1. Click output port (right)
2. Drag to input port (left)
3. Release to connect

**Data Flow:**
Left → Right direction`,
    placement: 'top',
    position: 'top',
    category: 'connections',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'workflow-start-end',
    target: '[data-tour="start-end-nodes"]',
    title: '▶️ Start & End',
    content: `Required nodes:

**Start Node:**
• Entry point
• Triggers workflow
• Green indicator

**End Node:**
• Exit point
• Completes workflow
• Red indicator

Every workflow needs both!`,
    placement: 'bottom',
    position: 'bottom',
    category: 'connections',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: Node Configuration
  // ============================================================================
  {
    id: 'workflow-config',
    target: '[data-tour="node-config"]',
    title: '⚙️ Node Configuration',
    content: `Configure node settings:

**Click Node to Open:**
• Node properties
• Input parameters
• Output mapping
• Advanced options

Customize each step.`,
    placement: 'left',
    position: 'left',
    category: 'config',
    showProgress: true
  },
  {
    id: 'workflow-selectors',
    target: '[data-tour="selector-builder"]',
    title: '🎯 Smart Selectors',
    content: `Target elements:

**Selector Types:**
• CSS selectors
• XPath
• AI-generated
• Visual picker

Point & click to select!`,
    placement: 'left',
    position: 'left',
    category: 'config',
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: Execution
  // ============================================================================
  {
    id: 'workflow-execute',
    target: '[data-tour="execute-btn"]',
    title: '▶️ Run Workflow',
    content: `Execute your workflow:

**Run Options:**
• ▶️ Run (full execution)
• ⏸️ Pause
• ⏹️ Stop

Watch nodes highlight as they run!`,
    placement: 'bottom',
    position: 'bottom',
    category: 'execution',
    isRequired: true,
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'workflow-preview',
    target: '[data-tour="execution-preview"]',
    title: '👁️ Execution Preview',
    content: `Monitor execution:

**Preview Shows:**
• Current node
• Node results
• Execution time
• Errors (if any)

Debug in real-time!`,
    placement: 'left',
    position: 'left',
    category: 'execution',
    showProgress: true
  },
  {
    id: 'workflow-schedule',
    target: '[data-tour="schedule-btn"]',
    title: '📅 Schedule Workflow',
    content: `Automate execution:

**Schedule Options:**
• One-time
• Recurring (cron)
• Event-triggered

Set it and forget it!`,
    placement: 'bottom',
    position: 'bottom',
    category: 'execution',
    showProgress: true
  },

  // ============================================================================
  // SECTION 7: Save & Export
  // ============================================================================
  {
    id: 'workflow-save',
    target: '[data-tour="save-btn"]',
    title: '💾 Save Workflow',
    content: `Save your work:

**Save Options:**
• Save (Ctrl+S)
• Save As (new name)
• Auto-save enabled

Never lose your progress!`,
    placement: 'bottom',
    position: 'bottom',
    category: 'save',
    showProgress: true
  },
  {
    id: 'workflow-export',
    target: '[data-tour="export-btn"]',
    title: '📤 Export/Import',
    content: `Share workflows:

**Export:**
• Download as JSON
• Share with team

**Import:**
• Load from file
• Import templates

Portable workflows!`,
    placement: 'bottom',
    position: 'bottom',
    category: 'save',
    showProgress: true
  },

  // ============================================================================
  // SECTION 8: Tour Completion
  // ============================================================================
  {
    id: 'workflow-complete',
    target: '[data-tour="workflow-module"]',
    title: '✅ Workflow Tour Complete!',
    content: `You've mastered CUBE Workflows!

**Topics Covered:**
✓ Canvas navigation
✓ Node palette
✓ Creating connections
✓ Node configuration
✓ Running workflows
✓ Scheduling
✓ Saving & exporting

**Pro Tips:**
• Start simple, add complexity
• Use AI nodes for smart processing
• Test frequently with preview
• Schedule recurring tasks
• Export for backup

**Quick Reference:**
• Add node: Drag from palette
• Connect: Drag port to port
• Run: ▶️ button
• Save: Ctrl+S

Build amazing automations!`,
    placement: 'center',
    position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for Workflow
 */
export const workflowTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '🔄' },
  { id: 'canvas', title: 'Canvas', icon: '🎨' },
  { id: 'nodes', title: 'Nodes', icon: '📦' },
  { id: 'connections', title: 'Connections', icon: '🔗' },
  { id: 'config', title: 'Configuration', icon: '⚙️' },
  { id: 'execution', title: 'Execution', icon: '▶️' },
  { id: 'save', title: 'Save/Export', icon: '💾' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getWorkflowStepsBySection = (sectionId: string): TourStep[] => {
  return workflowTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getWorkflowRequiredSteps = (): TourStep[] => {
  return workflowTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const workflowTourConfig = {
  id: 'workflow-tour',
  name: 'Workflow Designer Tour',
  description: 'Build visual automations with node-based editor',
  version: '1.0.0',
  totalSteps: workflowTourSteps.length,
  estimatedTime: '6 minutes',
  sections: workflowTourSections,
  features: [
    'Visual node editor',
    'Browser automation',
    'AI processing',
    'Data extraction',
    'Conditional logic',
    'Scheduling'
  ]
};

export default workflowTourSteps;
