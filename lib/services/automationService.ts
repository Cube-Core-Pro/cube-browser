/**
 * Automation Services - Autofill and macros
 * 
 * @module automationService
 * 
 * This service provides the frontend API for:
 * - Autofill profile management (uses autofill_system_v2 Tauri commands)
 * - Macro recording and playback (uses macro_system Tauri commands)
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// AUTOFILL TYPES
// ============================================================================

export interface AutofillProfile {
  id: string;
  name: string;
  description?: string;
  fields: Record<string, string>;
  category?: 'personal' | 'business' | 'shipping' | 'payment';
  createdAt?: string;
  updatedAt?: string;
}

export interface FormField {
  selector: string;
  value: string;
  type: string;
}

export interface FieldMetadata {
  name?: string;
  id?: string;
  type?: string;
  placeholder?: string;
  label?: string;
  autocomplete?: string;
}

export interface DetectionResult {
  fields: FieldMetadata[];
  confidence: number;
}

// ============================================================================
// AUTOFILL FUNCTIONS
// ============================================================================

/**
 * Create a new autofill profile.
 */
export async function createProfile(name: string, description?: string): Promise<AutofillProfile> {
  return await invoke<AutofillProfile>('autofill_create_profile', { name, description });
}

/**
 * Get an autofill profile by ID.
 */
export async function getProfile(id: string): Promise<AutofillProfile | null> {
  return await invoke<AutofillProfile | null>('autofill_get_profile', { id });
}

/**
 * Get all autofill profiles.
 */
export async function getProfiles(): Promise<AutofillProfile[]> {
  return await invoke<AutofillProfile[]>('autofill_get_all_profiles');
}

/**
 * Update an autofill profile's fields.
 */
export async function updateProfile(id: string, fields: Record<string, string>): Promise<void> {
  await invoke<void>('autofill_update_profile', { id, fields });
}

/**
 * Save a new autofill profile or update existing one.
 */
export async function saveProfile(
  name: string, 
  fields: Record<string, string>, 
  category?: 'personal' | 'business' | 'shipping' | 'payment'
): Promise<AutofillProfile> {
  return await invoke<AutofillProfile>('autofill_save_profile', { name, fields, category });
}

/**
 * Fill form fields on the current page with profile data.
 */
export async function fillForm(profileId: string): Promise<void> {
  await invoke<void>('autofill_fill_form', { profileId });
}

/**
 * Delete an autofill profile.
 */
export async function deleteProfile(profileId: string): Promise<boolean> {
  return await invoke<boolean>('autofill_delete_profile', { id: profileId });
}

/**
 * Detect form fields from metadata.
 */
export async function detectFields(fieldsMetadata: FieldMetadata[]): Promise<DetectionResult> {
  return await invoke<DetectionResult>('autofill_detect_fields', { fieldsMetadata });
}

/**
 * Detect form on a page (alias for detectFields with empty metadata).
 */
export async function detectForm(): Promise<DetectionResult> {
  return await invoke<DetectionResult>('autofill_detect_fields', { fieldsMetadata: [] });
}

// ============================================================================
// MACRO TYPES
// ============================================================================

export interface Macro {
  id: string;
  name: string;
  description?: string;
  steps: MacroStep[];
  createdAt: number;
}

export interface MacroStep {
  action: string;
  target?: string;
  value?: string;
  timestamp?: number;
  /** @deprecated Use target instead */
  selector?: string;
  /** @deprecated Use timestamp instead */
  delay?: number;
}

// ============================================================================
// MACRO FUNCTIONS
// ============================================================================

/**
 * Create and save a macro.
 * Uses save_macro Tauri command with a complete Macro object.
 */
export async function createMacro(name: string, steps: MacroStep[], description: string = ''): Promise<string> {
  const macroId = crypto.randomUUID();
  const macroData: Macro = {
    id: macroId,
    name,
    description,
    steps,
    createdAt: Date.now(),
  };
  await invoke<void>('save_macro', { macroData });
  return macroId;
}

export async function executeMacro(macroId: string): Promise<void> {
  await invoke<void>('play_macro', { macroId });
}

export async function getMacros(): Promise<Macro[]> {
  return await invoke<Macro[]>('get_macros');
}

export async function deleteMacro(macroId: string): Promise<void> {
  await invoke<void>('delete_macro', { macroId });
}

export async function recordMacro(_name: string): Promise<string> {
  return await invoke<string>('start_recording');
}

export async function stopMacroRecording(name: string, description: string = ''): Promise<Macro> {
  return await invoke<Macro>('stop_recording', { name, description });
}

export const automationService = {
  // Autofill functions
  createProfile,
  getProfile,
  getProfiles,
  updateProfile,
  saveProfile,
  fillForm,
  deleteProfile,
  detectFields,
  detectForm,
  // Macro functions
  createMacro,
  executeMacro,
  getMacros,
  deleteMacro,
  recordMacro,
  stopMacroRecording,
};

export default automationService;
