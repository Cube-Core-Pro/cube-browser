/**
 * 🏢 FIGURE WORKFLOW TYPES
 * 
 * Type definitions for the 64-step FIGURE LendingPad 
 * Compensation Request automation workflow.
 * 
 * Based on: FIGURE-UpdatingLendingPadloanforCompensationRequest-v1.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW STEP TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type StepCategory = 
  | 'figure-portal'      // Steps 1-3: FIGURE Portal search
  | 'document-download'  // Steps 4-6: Download documents
  | 'document-upload'    // Steps 7-10: Upload to LendingPad
  | 'loan-additional'    // Steps 11-16: Lien position
  | 'loan-application'   // Steps 17-46: Personal info, address, income, REO, demographics
  | 'overview-terms'     // Steps 47-57: Terms, mortgage, compensation
  | 'critical-dates'     // Steps 58-63: Closed/Funded dates
  | 'completion';        // Step 64: Final

export type StepStatus = 
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'skipped'
  | 'error';

export type StepAction =
  | 'search'
  | 'click'
  | 'type'
  | 'select'
  | 'upload'
  | 'download'
  | 'copy'
  | 'paste'
  | 'verify'
  | 'calculate'
  | 'navigate';

export interface WorkflowStep {
  id: number;
  category: StepCategory;
  title: string;
  description: string;
  action: StepAction;
  selector?: string;
  value?: string;
  sourceDocument?: string;
  sourceField?: string;
  validation?: StepValidation;
  dependencies?: number[];
  isOptional?: boolean;
  notes?: string;
}

export interface StepValidation {
  type: 'required' | 'format' | 'range' | 'custom';
  pattern?: string;
  min?: number;
  max?: number;
  customValidator?: string;
  errorMessage: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type FigureDocumentType =
  | 'AVM_Appraisal'
  | 'Residential_Evaluation'
  | 'Broker_Price_Opinion'
  | 'Signed-Application_Summary_Disclosure'
  | 'Signed-Heloc_Agreement'
  | 'Esigned_HELOC_TX'
  | 'Right_To_Cancel'
  | 'Recorded-Deed'
  | 'Transfer_Servicing_Rights'
  | 'Signed-Credit_Disclosure'
  | 'Loan_Sale_Disclosure'
  | 'Liens_Breakdown';

export interface FigureDocument {
  type: FigureDocumentType;
  fileName: string;
  isRequired: boolean;
  isForCompRequest: boolean;
  extractedData?: Record<string, string>;
}

export const REQUIRED_COMP_DOCUMENTS: FigureDocumentType[] = [
  'AVM_Appraisal',
  'Signed-Application_Summary_Disclosure',
  'Signed-Heloc_Agreement',
  'Right_To_Cancel'
];

export const ALTERNATE_DOCUMENTS: Record<FigureDocumentType, FigureDocumentType[]> = {
  'AVM_Appraisal': ['Residential_Evaluation', 'Broker_Price_Opinion'],
  'Signed-Heloc_Agreement': ['Esigned_HELOC_TX'],
  'Signed-Application_Summary_Disclosure': [],
  'Right_To_Cancel': [],
  'Residential_Evaluation': [],
  'Broker_Price_Opinion': [],
  'Esigned_HELOC_TX': [],
  'Recorded-Deed': [],
  'Transfer_Servicing_Rights': [],
  'Signed-Credit_Disclosure': [],
  'Loan_Sale_Disclosure': [],
  'Liens_Breakdown': []
};

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW STATE
// ═══════════════════════════════════════════════════════════════════════════

export interface FigureWorkflowState {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  skippedSteps: number[];
  errorSteps: number[];
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  startedAt?: string;
  completedAt?: string;
  lastError?: string;
}

export interface FigureLoanData {
  // Client Info
  clientName: string;
  clientEmail: string;
  helocAppNumber: string;
  
  // Personal Information
  ssn: string;
  ssnLast4: string;
  dob: string;
  email: string;
  phone: string;
  
  // Address
  currentAddress: string;
  ownershipType: 'Own' | 'Rent' | 'Other';
  
  // Income
  statedIncome: number;
  monthlyIncome: number;
  
  // REO (Real Estate Owned)
  occupancy: 'Primary' | 'Secondary' | 'Investment';
  avmValue: number;
  marketValue: number;
  
  // Demographics
  ethnicity?: string;
  race?: string;
  sex?: string;
  demographicInfoProvided: boolean;
  applicationDate: string;
  
  // Lien Position
  figureLienCount: number;
  lienPosition: 'First Lien' | 'Second Lien' | 'Third Lien';
  
  // Terms
  creditLimit: number;
  initialDraw: number;
  cashOut: number;
  debtPayoff: number;
  noteRate: number;
  aprFromCD: number;
  
  // Compensation
  compensationRate: number;
  compensationAmount: number;
  incomingWireAmount: number;
  totalBrokerCompensation: number;
  
  // Dates
  closedDate: string;
  fundedDate: string;
  rightToCancelDate: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// LIEN POSITION MAPPING
// ═══════════════════════════════════════════════════════════════════════════

export const LIEN_POSITION_MAP: Record<number, FigureLoanData['lienPosition']> = {
  0: 'First Lien',
  1: 'Second Lien',
  2: 'Third Lien'
};

export function calculateLienPosition(figureLienCount: number): FigureLoanData['lienPosition'] {
  if (figureLienCount === 0) return 'First Lien';
  if (figureLienCount === 1) return 'Second Lien';
  return 'Third Lien';
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPENSATION CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

export const FIGURE_COMP_RATE = 0.02; // 2% current Figure comp plan

export function calculateCompensation(
  initialDraw: number,
  debtPayoff: number = 0,
  compRate: number = FIGURE_COMP_RATE
): number {
  const totalAmount = initialDraw + debtPayoff;
  return Number((totalAmount * compRate).toFixed(2));
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNDED DATE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

export function calculateFundedDate(closedDate: Date): Date {
  const funded = new Date(closedDate);
  let daysAdded = 0;
  
  while (daysAdded < 4) {
    funded.setDate(funded.getDate() + 1);
    const day = funded.getDay();
    
    // Count Saturdays (6) but never Sundays (0)
    if (day !== 0) {
      daysAdded++;
    }
  }
  
  // If funded falls on weekend, move to Monday
  const fundedDay = funded.getDay();
  if (fundedDay === 0) {
    funded.setDate(funded.getDate() + 1); // Sunday -> Monday
  } else if (fundedDay === 6) {
    funded.setDate(funded.getDate() + 2); // Saturday -> Monday
  }
  
  return funded;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// SSN MASKING
// ═══════════════════════════════════════════════════════════════════════════

export function maskSSN(last4: string): string {
  // First 6 as 1s or 0s + last 4
  return `111-11-${last4}`;
}

export function maskSSNWithZeros(last4: string): string {
  return `000-00-${last4}`;
}
