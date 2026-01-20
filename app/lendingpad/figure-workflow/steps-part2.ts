/**
 * 🏢 FIGURE WORKFLOW STEPS - PART 2 (Steps 33-64)
 * 
 * 64-step workflow for FIGURE LendingPad Compensation Request
 * Split into parts to avoid response limits
 */

import { WorkflowStep } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// STEPS 33-46: LOAN APPLICATION - REO & DEMOGRAPHICS
// ═══════════════════════════════════════════════════════════════════════════

export const STEPS_LOAN_APPLICATION_PART2: WorkflowStep[] = [
  {
    id: 33,
    category: 'loan-application',
    title: 'Save Income',
    description: 'Click "Save" to save income entry',
    action: 'click',
    selector: 'button:contains("Save"), .save-income-btn',
    dependencies: [32]
  },
  {
    id: 34,
    category: 'loan-application',
    title: 'Save Income Confirmation',
    description: 'Click "Save" again to confirm',
    action: 'click',
    selector: 'button:contains("Save"), .confirm-save-btn',
    dependencies: [33]
  },
  {
    id: 35,
    category: 'loan-application',
    title: 'Edit REO',
    description: 'Under REO (Real Estate Owned), click "Edit"',
    action: 'click',
    selector: '.reo-section button:contains("Edit"), .edit-reo-btn',
    dependencies: [34]
  },
  {
    id: 36,
    category: 'loan-application',
    title: 'Add New REO',
    description: 'Click "Add New REO"',
    action: 'click',
    selector: 'button:contains("Add New REO"), .add-reo-btn',
    dependencies: [35]
  },
  {
    id: 37,
    category: 'loan-application',
    title: 'Select Occupancy Type',
    description: 'Select correct Occupancy: Primary, Secondary, or Investment',
    action: 'select',
    selector: 'select[name="occupancy"], #occupancyType',
    dependencies: [36]
  },
  {
    id: 38,
    category: 'loan-application',
    title: 'Get AVM Value',
    description: 'Copy the AVM Value from the AVM_Appraisal PDF',
    action: 'copy',
    sourceDocument: 'AVM_Appraisal',
    sourceField: 'AVM Value',
    dependencies: [37]
  },
  {
    id: 39,
    category: 'loan-application',
    title: 'Enter Market Value',
    description: 'Paste AVM Value in the Market Value field and Save',
    action: 'type',
    selector: 'input[name="marketValue"], #marketValue',
    dependencies: [38]
  },
  {
    id: 40,
    category: 'loan-application',
    title: 'Save REO',
    description: 'Save the REO entry',
    action: 'click',
    selector: 'button:contains("Save"), .save-reo-btn',
    dependencies: [39]
  },
  {
    id: 41,
    category: 'loan-application',
    title: 'Edit Demographics',
    description: 'Under DEMOGRAPHICS, click "Edit"',
    action: 'click',
    selector: '.demographics-section button:contains("Edit"), .edit-demographics-btn',
    dependencies: [40]
  },
  {
    id: 42,
    category: 'loan-application',
    title: 'Complete Demographics',
    description: 'Complete according to info in Application Summary Disclosure (bottom of page)',
    action: 'verify',
    sourceDocument: 'Signed-Application_Summary_Disclosure',
    sourceField: 'Home Equity Line Application - Demographics',
    dependencies: [41]
  },
  {
    id: 43,
    category: 'loan-application',
    title: 'Match Fields',
    description: 'Match the demographics fields accordingly',
    action: 'type',
    dependencies: [42]
  },
  {
    id: 44,
    category: 'loan-application',
    title: 'Set Info Not Provided',
    description: 'Click "Information Not Provided" if demographics not available',
    action: 'click',
    selector: 'button:contains("Information Not Provided"), .info-not-provided',
    dependencies: [43],
    isOptional: true
  },
  {
    id: 45,
    category: 'loan-application',
    title: 'Set Demographic Info Type',
    description: 'Click "Demographic Information Provided Type" and select "Internet Or Email"',
    action: 'select',
    selector: 'select[name="demographicInfoType"], #demographicInfoType',
    value: 'Internet Or Email',
    dependencies: [44]
  },
  {
    id: 46,
    category: 'loan-application',
    title: 'Enter Application Date',
    description: 'Enter the Application Date as the Application Signed Date',
    action: 'type',
    selector: 'input[name="applicationDate"], #applicationSignedDate',
    sourceDocument: 'Signed-Application_Summary_Disclosure',
    sourceField: 'Application Signed Date',
    dependencies: [45]
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// STEPS 47-57: OVERVIEW TAB - TERMS & COMPENSATION
// ═══════════════════════════════════════════════════════════════════════════

export const STEPS_OVERVIEW_TERMS: WorkflowStep[] = [
  {
    id: 47,
    category: 'loan-application',
    title: 'Save Demographics',
    description: 'Click "Save" to save demographics',
    action: 'click',
    selector: 'button:contains("Save"), .save-demographics-btn',
    dependencies: [46]
  },
  {
    id: 48,
    category: 'overview-terms',
    title: 'Go to Overview Tab',
    description: 'Click "Overview" tab',
    action: 'click',
    selector: 'a[href*="overview"], button[data-tab="overview"], .overview-tab'
  },
  {
    id: 49,
    category: 'overview-terms',
    title: 'Edit Terms and Mortgage',
    description: 'Under Terms and Mortgage window, click "Edit"',
    action: 'click',
    selector: '.terms-mortgage button:contains("Edit"), .edit-terms-btn',
    dependencies: [48]
  },
  {
    id: 50,
    category: 'overview-terms',
    title: 'Reference HELOC Agreement',
    description: 'Reference the Signed-Heloc_Agreement PDF for loan terms',
    action: 'verify',
    sourceDocument: 'Signed-Heloc_Agreement',
    dependencies: [49],
    notes: 'ALERT: When requesting Comp in WCL portal, use the Credit Limit as the Loan Amount'
  },
  {
    id: 51,
    category: 'overview-terms',
    title: 'Enter Cash-Out Amount',
    description: 'Under Cash-out, insert the Initial Draw amount',
    action: 'type',
    selector: 'input[name="cashOut"], #cashOutAmount',
    sourceDocument: 'Signed-Heloc_Agreement',
    sourceField: 'Initial Draw',
    dependencies: [50],
    notes: 'If debts being paid off, add: Funds disbursed + debt payoff'
  },
  {
    id: 52,
    category: 'overview-terms',
    title: 'Enter Note Rate',
    description: 'Enter the Note Rate from "Initial ANNUAL PERCENTAGE RATE" in HELOC Agreement',
    action: 'type',
    selector: 'input[name="noteRate"], #noteRate',
    sourceDocument: 'Signed-Heloc_Agreement',
    sourceField: 'Initial ANNUAL PERCENTAGE RATE',
    dependencies: [51]
  },
  {
    id: 53,
    category: 'overview-terms',
    title: 'Save Terms',
    description: 'Click "Save" to save terms',
    action: 'click',
    selector: 'button:contains("Save"), .save-terms-btn',
    dependencies: [52]
  },
  {
    id: 54,
    category: 'overview-terms',
    title: 'Enter APR From CD',
    description: 'Enter the APR From CD (same as Note Rate)',
    action: 'type',
    selector: 'input[name="aprFromCD"], #aprFromCD',
    dependencies: [53],
    notes: 'Use the same value as the Note Rate'
  },
  {
    id: 55,
    category: 'overview-terms',
    title: 'Calculate Compensation',
    description: 'Calculate compensation: (Initial Draw or Funds disbursed + debt payoff) × 2%',
    action: 'calculate',
    dependencies: [54],
    notes: 'Current Figure comp plan is 2%. Example: $300,280 × 0.02 = $6,005.60'
  },
  {
    id: 56,
    category: 'overview-terms',
    title: 'Enter Incoming Wire Amount',
    description: 'Enter the compensation amount as Incoming Wire Amount',
    action: 'type',
    selector: 'input[name="incomingWireAmount"], #incomingWireAmount',
    dependencies: [55]
  },
  {
    id: 57,
    category: 'overview-terms',
    title: 'Enter Broker Compensation',
    description: 'Enter same amount for Total Broker Compensations Amount (if allowed)',
    action: 'type',
    selector: 'input[name="totalBrokerComp"], #totalBrokerCompensation',
    dependencies: [56],
    isOptional: true,
    notes: 'May require LPad Admin account'
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// STEPS 58-64: CRITICAL DATES & COMPLETION
// ═══════════════════════════════════════════════════════════════════════════

export const STEPS_CRITICAL_DATES: WorkflowStep[] = [
  {
    id: 58,
    category: 'overview-terms',
    title: 'Save Compensation',
    description: 'Click "Save" to save compensation details',
    action: 'click',
    selector: 'button:contains("Save"), .save-compensation-btn',
    dependencies: [57]
  },
  {
    id: 59,
    category: 'critical-dates',
    title: 'Edit Dates',
    description: 'Under Dates, click "Edit"',
    action: 'click',
    selector: '.dates-section button:contains("Edit"), .edit-dates-btn'
  },
  {
    id: 60,
    category: 'critical-dates',
    title: 'Click Critical Dates',
    description: 'Click "Critical Dates" section',
    action: 'click',
    selector: 'button:contains("Critical Dates"), .critical-dates-section',
    dependencies: [59]
  },
  {
    id: 61,
    category: 'critical-dates',
    title: 'Find Account Opening Date',
    description: 'Find Right-To-Cancel PDF and locate "the opening date of your account, which is XX/XX/20XX"',
    action: 'copy',
    sourceDocument: 'Right_To_Cancel',
    sourceField: 'Account Opening Date',
    dependencies: [60]
  },
  {
    id: 62,
    category: 'critical-dates',
    title: 'Enter Closed Date',
    description: 'Click calendar icon on Closed field and choose matching date',
    action: 'type',
    selector: 'input[name="closedDate"], #closedDate',
    dependencies: [61]
  },
  {
    id: 63,
    category: 'critical-dates',
    title: 'Calculate Funded Date',
    description: 'Count 4 days from Closed date to find Funded date',
    action: 'calculate',
    dependencies: [62],
    notes: 'Count Saturdays (never Sundays or Fed Holidays). If Funded falls on weekend, move to Monday. If uncertain, QC will handle it.'
  },
  {
    id: 64,
    category: 'completion',
    title: 'Save and Complete',
    description: 'Click "Save" - LendingPad file is now complete and ready for compensation request submission',
    action: 'click',
    selector: 'button:contains("Save"), .final-save-btn',
    dependencies: [63],
    notes: '🎉 The LendingPad file is now complete and ready for compensation request submission!'
  }
];
