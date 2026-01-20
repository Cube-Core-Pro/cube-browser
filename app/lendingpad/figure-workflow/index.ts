/**
 * 🏢 FIGURE WORKFLOW - MAIN INDEX
 * 
 * Combines all workflow steps and exports everything needed
 * for the FIGURE LendingPad Compensation Request automation.
 */

// Export types
export * from './types';

// Import all step groups
import { 
  STEPS_FIGURE_PORTAL,
  STEPS_LOAN_ADDITIONAL,
  STEPS_LOAN_APPLICATION_PART1
} from './steps-part1';

import {
  STEPS_LOAN_APPLICATION_PART2,
  STEPS_OVERVIEW_TERMS,
  STEPS_CRITICAL_DATES
} from './steps-part2';

import { WorkflowStep, StepCategory } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// COMBINED WORKFLOW STEPS (ALL 64)
// ═══════════════════════════════════════════════════════════════════════════

export const FIGURE_WORKFLOW_STEPS: WorkflowStep[] = [
  ...STEPS_FIGURE_PORTAL,
  ...STEPS_LOAN_ADDITIONAL,
  ...STEPS_LOAN_APPLICATION_PART1,
  ...STEPS_LOAN_APPLICATION_PART2,
  ...STEPS_OVERVIEW_TERMS,
  ...STEPS_CRITICAL_DATES
];

// ═══════════════════════════════════════════════════════════════════════════
// STEP GROUPS BY CATEGORY
// ═══════════════════════════════════════════════════════════════════════════

export const STEP_GROUPS: Record<StepCategory, { label: string; icon: string; steps: number[] }> = {
  'figure-portal': {
    label: 'FIGURE Portal',
    icon: '🏢',
    steps: [1, 2]
  },
  'document-download': {
    label: 'Document Download',
    icon: '📥',
    steps: [3, 4]
  },
  'document-upload': {
    label: 'Document Upload',
    icon: '📤',
    steps: [5, 6, 7, 8, 9, 10]
  },
  'loan-additional': {
    label: 'Loan Additional',
    icon: '📋',
    steps: [11, 12, 13, 14, 15, 16]
  },
  'loan-application': {
    label: 'Loan Application',
    icon: '📝',
    steps: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47]
  },
  'overview-terms': {
    label: 'Overview & Terms',
    icon: '💰',
    steps: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58]
  },
  'critical-dates': {
    label: 'Critical Dates',
    icon: '📅',
    steps: [59, 60, 61, 62, 63]
  },
  'completion': {
    label: 'Completion',
    icon: '✅',
    steps: [64]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getStepById(stepId: number): WorkflowStep | undefined {
  return FIGURE_WORKFLOW_STEPS.find(step => step.id === stepId);
}

export function getStepsByCategory(category: StepCategory): WorkflowStep[] {
  return FIGURE_WORKFLOW_STEPS.filter(step => step.category === category);
}

export function getStepProgress(completedSteps: number[]): number {
  return Math.round((completedSteps.length / FIGURE_WORKFLOW_STEPS.length) * 100);
}

export function getNextStep(currentStepId: number): WorkflowStep | undefined {
  const currentIndex = FIGURE_WORKFLOW_STEPS.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1 || currentIndex === FIGURE_WORKFLOW_STEPS.length - 1) {
    return undefined;
  }
  return FIGURE_WORKFLOW_STEPS[currentIndex + 1];
}

export function getPreviousStep(currentStepId: number): WorkflowStep | undefined {
  const currentIndex = FIGURE_WORKFLOW_STEPS.findIndex(step => step.id === currentStepId);
  if (currentIndex <= 0) {
    return undefined;
  }
  return FIGURE_WORKFLOW_STEPS[currentIndex - 1];
}

export function canExecuteStep(stepId: number, completedSteps: number[]): boolean {
  const step = getStepById(stepId);
  if (!step) return false;
  if (!step.dependencies || step.dependencies.length === 0) return true;
  return step.dependencies.every(depId => completedSteps.includes(depId));
}

export function getRequiredDocumentsForStep(stepId: number): string[] {
  const step = getStepById(stepId);
  if (!step || !step.sourceDocument) return [];
  return [step.sourceDocument];
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

export const WORKFLOW_STATS = {
  totalSteps: FIGURE_WORKFLOW_STEPS.length,
  categories: Object.keys(STEP_GROUPS).length,
  requiredDocs: 4,
  optionalSteps: FIGURE_WORKFLOW_STEPS.filter(s => s.isOptional).length,
  estimatedTime: '15-20 minutes'
};

// Re-export step groups for direct access
export {
  STEPS_FIGURE_PORTAL,
  STEPS_LOAN_ADDITIONAL,
  STEPS_LOAN_APPLICATION_PART1,
  STEPS_LOAN_APPLICATION_PART2,
  STEPS_OVERVIEW_TERMS,
  STEPS_CRITICAL_DATES
};
