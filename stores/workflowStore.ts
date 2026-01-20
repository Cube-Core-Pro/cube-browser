import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: string;
  completedAt?: string;
  error?: string;
  currentNodeId?: string;
  progress: number;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    nodeId?: string;
  }>;
}

export interface WorkflowState {
  workflows: Workflow[];
  activeWorkflowId: string | null;
  executions: WorkflowExecution[];
  
  // Workflow CRUD
  addWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  duplicateWorkflow: (id: string) => string;
  setActiveWorkflow: (id: string | null) => void;
  
  // Execution management
  startExecution: (workflowId: string) => string;
  pauseExecution: (executionId: string) => void;
  resumeExecution: (executionId: string) => void;
  stopExecution: (executionId: string) => void;
  updateExecution: (executionId: string, updates: Partial<WorkflowExecution>) => void;
  clearExecutions: () => void;
  
  // Helpers
  getWorkflow: (id: string) => Workflow | undefined;
  getExecution: (id: string) => WorkflowExecution | undefined;
  getWorkflowExecutions: (workflowId: string) => WorkflowExecution[];
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      workflows: [],
      activeWorkflowId: null,
      executions: [],

      addWorkflow: (workflow) => {
        const id = Date.now().toString();
        const now = new Date().toISOString();
        
        const newWorkflow: Workflow = {
          ...workflow,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          workflows: [...state.workflows, newWorkflow],
          activeWorkflowId: id,
        }));

        return id;
      },

      updateWorkflow: (id, updates) => {
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === id
              ? { ...workflow, ...updates, updatedAt: new Date().toISOString() }
              : workflow
          ),
        }));
      },

      deleteWorkflow: (id) => {
        set((state) => ({
          workflows: state.workflows.filter((workflow) => workflow.id !== id),
          activeWorkflowId: state.activeWorkflowId === id ? null : state.activeWorkflowId,
          executions: state.executions.filter((execution) => execution.workflowId !== id),
        }));
      },

      duplicateWorkflow: (id) => {
        const workflow = get().getWorkflow(id);
        if (!workflow) return '';

        const newId = Date.now().toString();
        const now = new Date().toISOString();

        const duplicatedWorkflow: Workflow = {
          ...workflow,
          id: newId,
          name: `${workflow.name} (Copy)`,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          workflows: [...state.workflows, duplicatedWorkflow],
        }));

        return newId;
      },

      setActiveWorkflow: (id) => {
        set({ activeWorkflowId: id });
      },

      startExecution: (workflowId) => {
        const id = Date.now().toString();
        const now = new Date().toISOString();

        const execution: WorkflowExecution = {
          id,
          workflowId,
          status: 'running',
          startedAt: now,
          progress: 0,
          logs: [
            {
              timestamp: now,
              level: 'info',
              message: 'Workflow execution started',
            },
          ],
        };

        set((state) => ({
          executions: [...state.executions, execution],
        }));

        return id;
      },

      pauseExecution: (executionId) => {
        set((state) => ({
          executions: state.executions.map((execution) =>
            execution.id === executionId
              ? { ...execution, status: 'paused' as const }
              : execution
          ),
        }));
      },

      resumeExecution: (executionId) => {
        set((state) => ({
          executions: state.executions.map((execution) =>
            execution.id === executionId
              ? { ...execution, status: 'running' as const }
              : execution
          ),
        }));
      },

      stopExecution: (executionId) => {
        set((state) => ({
          executions: state.executions.map((execution) =>
            execution.id === executionId
              ? {
                  ...execution,
                  status: 'failed' as const,
                  completedAt: new Date().toISOString(),
                  error: 'Stopped by user',
                }
              : execution
          ),
        }));
      },

      updateExecution: (executionId, updates) => {
        set((state) => ({
          executions: state.executions.map((execution) =>
            execution.id === executionId
              ? { ...execution, ...updates }
              : execution
          ),
        }));
      },

      clearExecutions: () => {
        set({ executions: [] });
      },

      getWorkflow: (id) => {
        return get().workflows.find((workflow) => workflow.id === id);
      },

      getExecution: (id) => {
        return get().executions.find((execution) => execution.id === id);
      },

      getWorkflowExecutions: (workflowId) => {
        return get().executions.filter((execution) => execution.workflowId === workflowId);
      },
    }),
    {
      name: 'workflow-storage',
      partialize: (state) => ({
        workflows: state.workflows,
        activeWorkflowId: state.activeWorkflowId,
      }),
    }
  )
);
