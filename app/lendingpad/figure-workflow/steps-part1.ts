/**
 * 🏢 FIGURE WORKFLOW STEPS - PART 1 (Steps 1-32)
 * 
 * 64-step workflow for FIGURE LendingPad Compensation Request
 * Split into parts to avoid response limits
 */

import { WorkflowStep } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// STEPS 1-10: FIGURE PORTAL & DOCUMENT HANDLING
// ═══════════════════════════════════════════════════════════════════════════

export const STEPS_FIGURE_PORTAL: WorkflowStep[] = [
  {
    id: 1,
    category: 'figure-portal',
    title: 'Search FIGURE Portal',
    description: 'Start by searching FIGURE Portal by client name, email, or Heloc App #',
    action: 'search',
    selector: 'input[placeholder*="Search"], input[name="search"]',
    notes: 'Can search by client name, email address, or HELOC Application Number'
  },
  {
    id: 2,
    category: 'figure-portal',
    title: 'Click Documents Tab',
    description: 'Navigate to the Documents tab in FIGURE Portal',
    action: 'click',
    selector: 'button[data-tab="documents"], a[href*="documents"], .tab-documents',
    dependencies: [1]
  },
  {
    id: 3,
    category: 'document-download',
    title: 'Download All Documents',
    description: 'Click "Download All" to get Zip folder with all documents',
    action: 'download',
    selector: 'button:contains("Download All"), .download-all-btn',
    dependencies: [2],
    notes: 'Will download as ZIP file'
  },
  {
    id: 4,
    category: 'document-download',
    title: 'Extract ZIP to Desktop',
    description: 'Extract the downloaded ZIP folder to Desktop',
    action: 'click',
    notes: 'Typical folder contains 40-60 files'
  },
  {
    id: 5,
    category: 'document-upload',
    title: 'Go to LendingPad Documents',
    description: 'In LendingPad, click the "Documents" tab',
    action: 'click',
    selector: 'a[href*="documents"], button[data-tab="documents"], .documents-tab'
  },
  {
    id: 6,
    category: 'document-upload',
    title: 'Add New Documents',
    description: 'Click "Add New Documents" button',
    action: 'click',
    selector: 'button:contains("Add New Documents"), .add-documents-btn',
    dependencies: [5]
  },
  {
    id: 7,
    category: 'document-upload',
    title: 'Select Files from Computer',
    description: 'Click "Select files from your computer"',
    action: 'click',
    selector: 'input[type="file"], button:contains("Select files")',
    dependencies: [6]
  },
  {
    id: 8,
    category: 'document-upload',
    title: 'Select All Files',
    description: 'Select all files from the extracted folder (typically 40-60 files)',
    action: 'upload',
    dependencies: [7],
    notes: 'Important documents: AVM_Appraisal, Signed-Application_Summary_Disclosure, Signed-Heloc_Agreement, Right_to_cancel, Recorded-Deed, Transfer_Servicing_Rights, Signed-Credit_Disclosure, Loan_Sale_Disclosure, Liens_Breakdown'
  },
  {
    id: 9,
    category: 'document-upload',
    title: 'Verify Key Documents',
    description: 'Verify all 4 key documents for COMP Request are uploaded',
    action: 'verify',
    dependencies: [8],
    validation: {
      type: 'custom',
      customValidator: 'verifyCompDocuments',
      errorMessage: 'Missing required documents for compensation request'
    },
    notes: 'Required: AVM_Appraisal (or Residential_Evaluation/Broker_Price_Opinion), Signed-Application_Summary_Disclosure, Signed-Heloc_Agreement (or Esigned HELOC for TX), Right_To_Cancel'
  },
  {
    id: 10,
    category: 'document-upload',
    title: 'Upload Documents',
    description: 'Confirm and upload all selected documents',
    action: 'click',
    selector: 'button:contains("Upload"), .upload-btn, button[type="submit"]',
    dependencies: [9]
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// STEPS 11-16: LOAN ADDITIONAL - LIEN POSITION
// ═══════════════════════════════════════════════════════════════════════════

export const STEPS_LOAN_ADDITIONAL: WorkflowStep[] = [
  {
    id: 11,
    category: 'loan-additional',
    title: 'Go to Loan Additional Tab',
    description: 'Click "Loan Additional" tab in LendingPad',
    action: 'click',
    selector: 'a[href*="loan-additional"], button[data-tab="loan-additional"], .loan-additional-tab'
  },
  {
    id: 12,
    category: 'loan-additional',
    title: 'Edit General Tracking',
    description: 'Click Edit on General Tracking section',
    action: 'click',
    selector: '.general-tracking button:contains("Edit"), .edit-general-tracking',
    dependencies: [11]
  },
  {
    id: 13,
    category: 'loan-additional',
    title: 'Check FIGURE Lien Count',
    description: 'Review the lien count from FIGURE documents',
    action: 'verify',
    sourceDocument: 'Liens_Breakdown',
    dependencies: [12],
    notes: '0 liens = First Lien, 1 lien = Second Lien, 2 liens = Third Lien'
  },
  {
    id: 14,
    category: 'loan-additional',
    title: 'Set Lien Position',
    description: 'Select the correct Lien Position based on FIGURE lien count',
    action: 'select',
    selector: 'select[name="lienPosition"], #lienPosition',
    dependencies: [13]
  },
  {
    id: 15,
    category: 'loan-additional',
    title: 'Save General Tracking',
    description: 'Save the General Tracking changes',
    action: 'click',
    selector: 'button:contains("Save"), .save-btn',
    dependencies: [14]
  },
  {
    id: 16,
    category: 'loan-additional',
    title: 'Verify Lien Position Saved',
    description: 'Verify the lien position was saved correctly',
    action: 'verify',
    dependencies: [15]
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// STEPS 17-32: LOAN APPLICATION - PERSONAL INFO & ADDRESS
// ═══════════════════════════════════════════════════════════════════════════

export const STEPS_LOAN_APPLICATION_PART1: WorkflowStep[] = [
  {
    id: 17,
    category: 'loan-application',
    title: 'Go to Loan Application Tab',
    description: 'Click "Loan Application" tab in LendingPad',
    action: 'click',
    selector: 'a[href*="loan-application"], button[data-tab="loan-application"]'
  },
  {
    id: 18,
    category: 'loan-application',
    title: 'Reference Application Summary',
    description: 'Use Signed-Application_Summary_Disclosure to match/complete Loan Application tab',
    action: 'verify',
    sourceDocument: 'Signed-Application_Summary_Disclosure',
    dependencies: [17]
  },
  {
    id: 19,
    category: 'loan-application',
    title: 'Enter Social Security Number',
    description: 'Enter first six numbers as 1s or 0s followed by actual last 4 of SSN',
    action: 'type',
    selector: 'input[name="ssn"], #ssn',
    dependencies: [18],
    notes: 'Format: 111-11-XXXX or 000-00-XXXX where XXXX is actual last 4'
  },
  {
    id: 20,
    category: 'loan-application',
    title: 'Enter Date of Birth',
    description: 'Enter DOB if missing',
    action: 'type',
    selector: 'input[name="dob"], #dateOfBirth',
    sourceDocument: 'Signed-Application_Summary_Disclosure',
    isOptional: true
  },
  {
    id: 21,
    category: 'loan-application',
    title: 'Enter Email',
    description: 'Enter email if missing',
    action: 'type',
    selector: 'input[name="email"], #email',
    sourceDocument: 'Signed-Application_Summary_Disclosure',
    isOptional: true
  },
  {
    id: 22,
    category: 'loan-application',
    title: 'Enter Phone Number',
    description: 'Enter phone number if missing',
    action: 'type',
    selector: 'input[name="phone"], #phone',
    sourceDocument: 'Signed-Application_Summary_Disclosure',
    isOptional: true
  },
  {
    id: 23,
    category: 'loan-application',
    title: 'Click Edit Address',
    description: 'Under ADDRESSES, click "Edit"',
    action: 'click',
    selector: '.addresses-section button:contains("Edit"), .edit-address-btn'
  },
  {
    id: 24,
    category: 'loan-application',
    title: 'Click Address Field',
    description: 'Click on the "Address" field',
    action: 'click',
    selector: 'input[name="address"], #currentAddress',
    dependencies: [23]
  },
  {
    id: 25,
    category: 'loan-application',
    title: 'Enter Current Address',
    description: 'Type or paste the current borrower\'s address',
    action: 'type',
    selector: 'input[name="address"], #currentAddress',
    sourceDocument: 'Signed-Application_Summary_Disclosure',
    dependencies: [24]
  },
  {
    id: 26,
    category: 'loan-application',
    title: 'Select Own',
    description: 'Click "Own" for ownership type',
    action: 'click',
    selector: 'button:contains("Own"), input[value="Own"], .ownership-own',
    dependencies: [25]
  },
  {
    id: 27,
    category: 'loan-application',
    title: 'Save Address',
    description: 'Click "Save" to save address',
    action: 'click',
    selector: 'button:contains("Save"), .save-address-btn',
    dependencies: [26]
  },
  {
    id: 28,
    category: 'loan-application',
    title: 'Add Other Income',
    description: 'Under Income, click "Add Other Income"',
    action: 'click',
    selector: 'button:contains("Add Other Income"), .add-income-btn',
    dependencies: [27]
  },
  {
    id: 29,
    category: 'loan-application',
    title: 'Add New Income',
    description: 'Click "+ Add New Income"',
    action: 'click',
    selector: 'button:contains("Add New Income"), .add-new-income-btn',
    dependencies: [28]
  },
  {
    id: 30,
    category: 'loan-application',
    title: 'Select Other Income Type',
    description: 'Click "Other" for income type',
    action: 'click',
    selector: 'button:contains("Other"), input[value="Other"], .income-type-other',
    dependencies: [29]
  },
  {
    id: 31,
    category: 'loan-application',
    title: 'Type Stated Income Label',
    description: 'Type "stated" in income source and click Calculator icon',
    action: 'type',
    selector: 'input[name="incomeSource"], #incomeSource',
    value: 'stated',
    dependencies: [30]
  },
  {
    id: 32,
    category: 'loan-application',
    title: 'Enter Annual Income',
    description: 'Copy Stated Income from Application Summary Disclosure and enter in Annual field',
    action: 'type',
    selector: 'input[name="annualIncome"], #annualIncome',
    sourceDocument: 'Signed-Application_Summary_Disclosure',
    sourceField: 'Stated Income',
    dependencies: [31],
    notes: 'Press Enter to auto-calculate monthly amount'
  }
];
