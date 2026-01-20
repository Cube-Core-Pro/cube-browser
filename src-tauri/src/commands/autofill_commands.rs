// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 AUTOFILL COMMANDS - Complete Tauri Command Interface for Autofill Module
// ═══════════════════════════════════════════════════════════════════════════════
//
// This file provides a comprehensive set of Tauri commands for the autofill system:
// - Profile management (create, read, update, delete)
// - Field detection and mapping
// - Field validation and formatting
// - Autofill operations
// - Statistics and analytics
//
// All commands are production-ready with proper error handling and type safety.

use crate::autofill::{
    create_detector, create_engine, create_formatter, create_validator, AutofillEngine,
    AutofillProfile, AutofillResult, DetectionResult, FieldMapping, FieldMetadata, FieldType,
    FilledField, FormatterResult, ValidationResult,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

// ═══════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/// Global autofill state
pub struct AutofillCommandState {
    engine: Mutex<AutofillEngine>,
}

impl Default for AutofillCommandState {
    fn default() -> Self {
        Self {
            engine: Mutex::new(create_engine()),
        }
    }
}

impl AutofillCommandState {
    pub fn new() -> Self {
        Self::default()
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE MANAGEMENT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/// Create a new autofill profile
#[tauri::command]
pub async fn af2_create_profile(
    name: String,
    description: Option<String>,
    state: State<'_, AutofillCommandState>,
) -> Result<AutofillProfile, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    engine.create_profile(name, description)
}

/// Get a profile by ID
#[tauri::command]
pub async fn af2_get_profile(
    profile_id: String,
    state: State<'_, AutofillCommandState>,
) -> Result<Option<AutofillProfile>, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    engine.get_profile(&profile_id)
}

/// Get all profiles
#[tauri::command]
pub async fn af2_get_all_profiles(
    state: State<'_, AutofillCommandState>,
) -> Result<Vec<AutofillProfile>, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    engine.get_all_profiles()
}

/// Update a profile
#[tauri::command]
pub async fn af2_update_profile(
    profile_id: String,
    updates: HashMap<String, String>,
    state: State<'_, AutofillCommandState>,
) -> Result<(), String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    engine.update_profile(&profile_id, updates)
}

/// Delete a profile
#[tauri::command]
pub async fn af2_delete_profile(
    profile_id: String,
    state: State<'_, AutofillCommandState>,
) -> Result<bool, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    engine.delete_profile(&profile_id)
}

/// Add a field to a profile
#[tauri::command]
pub async fn af2_add_profile_field(
    profile_id: String,
    key: String,
    value: String,
    state: State<'_, AutofillCommandState>,
) -> Result<(), String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    let mut updates = HashMap::new();
    updates.insert(key, value);
    engine.update_profile(&profile_id, updates)
}

/// Remove a field from a profile
#[tauri::command]
pub async fn af2_remove_profile_field(
    profile_id: String,
    key: String,
    state: State<'_, AutofillCommandState>,
) -> Result<(), String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    // Get profile and remove field by updating with empty HashMap
    let profile = engine
        .get_profile(&profile_id)?
        .ok_or_else(|| format!("Profile not found: {}", profile_id))?;

    let mut updates = HashMap::new();
    for (field_key, field_value) in profile.fields {
        if field_key != key {
            updates.insert(field_key, field_value);
        }
    }
    engine.update_profile(&profile_id, updates)
}

/// Get profile field value
#[tauri::command]
pub async fn af2_get_profile_field(
    profile_id: String,
    key: String,
    state: State<'_, AutofillCommandState>,
) -> Result<Option<String>, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    let profile = engine.get_profile(&profile_id)?;
    Ok(profile.and_then(|p| p.fields.get(&key).cloned()))
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD DETECTION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/// Detect fields from metadata
#[tauri::command]
pub async fn af2_detect_fields(
    fields_metadata: Vec<FieldMetadata>,
    state: State<'_, AutofillCommandState>,
) -> Result<DetectionResult, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    Ok(engine.detect_fields(fields_metadata))
}

/// Detect a single field type
#[tauri::command]
pub async fn af2_detect_field_type(metadata: FieldMetadata) -> Result<(String, f32), String> {
    let detector = create_detector();
    let (field_type, confidence) = detector.detect_field_type(&metadata);

    let field_type_str = match field_type {
        FieldType::Text => "text",
        FieldType::Email => "email",
        FieldType::Password => "password",
        FieldType::Phone | FieldType::Tel => "phone",
        FieldType::Url => "url",
        FieldType::Search => "search",
        FieldType::Address => "address",
        FieldType::AddressLine1 => "address_line1",
        FieldType::AddressLine2 => "address_line2",
        FieldType::City => "city",
        FieldType::State => "state",
        FieldType::ZipCode | FieldType::PostalCode => "postal_code",
        FieldType::Country => "country",
        FieldType::FullName => "full_name",
        FieldType::FirstName => "first_name",
        FieldType::MiddleName => "middle_name",
        FieldType::LastName => "last_name",
        FieldType::Date => "date",
        FieldType::Time => "time",
        FieldType::DateTime => "datetime",
        FieldType::Month => "month",
        FieldType::Year => "year",
        FieldType::Number => "number",
        FieldType::Currency => "currency",
        FieldType::Percentage => "percentage",
        FieldType::Select => "select",
        FieldType::Checkbox => "checkbox",
        FieldType::Radio => "radio",
        FieldType::Textarea => "textarea",
        FieldType::File => "file",
        FieldType::Color => "color",
        FieldType::Range => "range",
        FieldType::Custom(name) => return Ok((name, confidence)),
    };

    Ok((field_type_str.to_string(), confidence))
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD VALIDATION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/// Validate a field value
#[tauri::command]
pub async fn af2_validate_field(
    value: String,
    field_type: String,
    state: State<'_, AutofillCommandState>,
) -> Result<ValidationResult, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    let field_type_enum = parse_field_type(&field_type)?;
    Ok(engine.validate_field(&value, &field_type_enum))
}

/// Validate email address
#[tauri::command]
pub async fn af2_validate_email(email: String) -> Result<ValidationResult, String> {
    let validator = create_validator();
    Ok(validator.validate(&email, &FieldType::Email))
}

/// Validate phone number
#[tauri::command]
pub async fn af2_validate_phone(phone: String) -> Result<ValidationResult, String> {
    let validator = create_validator();
    Ok(validator.validate(&phone, &FieldType::Phone))
}

/// Validate URL
#[tauri::command]
pub async fn af2_validate_url(url: String) -> Result<ValidationResult, String> {
    let validator = create_validator();
    Ok(validator.validate(&url, &FieldType::Url))
}

/// Validate postal code
#[tauri::command]
pub async fn af2_validate_postal_code(postal_code: String) -> Result<ValidationResult, String> {
    let validator = create_validator();
    Ok(validator.validate(&postal_code, &FieldType::PostalCode))
}

/// Validate date
#[tauri::command]
pub async fn af2_validate_date(date: String) -> Result<ValidationResult, String> {
    let validator = create_validator();
    Ok(validator.validate(&date, &FieldType::Date))
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD FORMATTING COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/// Format a field value
#[tauri::command]
pub async fn af2_format_field(
    value: String,
    field_type: String,
    state: State<'_, AutofillCommandState>,
) -> Result<FormatterResult, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    let field_type_enum = parse_field_type(&field_type)?;
    Ok(engine.format_field(&value, &field_type_enum))
}

/// Format phone number
#[tauri::command]
pub async fn af2_format_phone(phone: String) -> Result<FormatterResult, String> {
    let formatter = create_formatter();
    Ok(formatter.format(&phone, &FieldType::Phone))
}

/// Format postal code
#[tauri::command]
pub async fn af2_format_postal_code(postal_code: String) -> Result<FormatterResult, String> {
    let formatter = create_formatter();
    Ok(formatter.format(&postal_code, &FieldType::PostalCode))
}

/// Format currency
#[tauri::command]
pub async fn af2_format_currency(amount: String) -> Result<FormatterResult, String> {
    let formatter = create_formatter();
    Ok(formatter.format(&amount, &FieldType::Currency))
}

/// Format date
#[tauri::command]
pub async fn af2_format_date(date: String) -> Result<FormatterResult, String> {
    let formatter = create_formatter();
    Ok(formatter.format(&date, &FieldType::Date))
}

/// Format name (capitalize)
#[tauri::command]
pub async fn af2_format_name(name: String) -> Result<FormatterResult, String> {
    let formatter = create_formatter();
    Ok(formatter.format(&name, &FieldType::FullName))
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTOFILL OPERATION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/// Perform autofill operation
#[tauri::command]
pub async fn af2_execute(
    profile_id: String,
    field_mappings: Vec<FieldMapping>,
    state: State<'_, AutofillCommandState>,
) -> Result<AutofillResult, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    engine.autofill(&profile_id, field_mappings)
}

/// Perform smart autofill with automatic field detection
#[tauri::command]
pub async fn af2_smart_execute(
    profile_id: String,
    fields_metadata: Vec<FieldMetadata>,
    state: State<'_, AutofillCommandState>,
) -> Result<AutofillResult, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    // First detect fields
    let detection = engine.detect_fields(fields_metadata);

    // Then perform autofill
    engine.autofill(&profile_id, detection.detected_fields)
}

/// Preview autofill without applying
#[tauri::command]
pub async fn af2_preview(
    profile_id: String,
    field_mappings: Vec<FieldMapping>,
    state: State<'_, AutofillCommandState>,
) -> Result<Vec<FilledField>, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    let result = engine.autofill(&profile_id, field_mappings)?;
    Ok(result.filled_fields)
}

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS & ANALYTICS COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutofillStatistics {
    pub total_profiles: usize,
    pub total_fields: usize,
    pub most_used_profile: Option<String>,
    pub recent_profiles: Vec<String>,
}

/// Get autofill statistics
#[tauri::command]
pub async fn af2_get_statistics(
    state: State<'_, AutofillCommandState>,
) -> Result<AutofillStatistics, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    let profiles = engine.get_all_profiles()?;
    let total_profiles = profiles.len();
    let total_fields: usize = profiles.iter().map(|p| p.fields.len()).sum();

    let most_used_profile = profiles
        .iter()
        .max_by_key(|p| p.use_count)
        .map(|p| p.name.clone());

    let mut recent_profiles: Vec<_> = profiles.iter().filter(|p| p.last_used.is_some()).collect();
    recent_profiles.sort_by_key(|p| p.last_used.unwrap());
    recent_profiles.reverse();
    let recent_profiles: Vec<String> = recent_profiles
        .iter()
        .take(5)
        .map(|p| p.name.clone())
        .collect();

    Ok(AutofillStatistics {
        total_profiles,
        total_fields,
        most_used_profile,
        recent_profiles,
    })
}

/// Get profile usage count
#[tauri::command]
pub async fn af2_get_profile_usage(
    profile_id: String,
    state: State<'_, AutofillCommandState>,
) -> Result<usize, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    let profile = engine
        .get_profile(&profile_id)?
        .ok_or_else(|| format!("Profile not found: {}", profile_id))?;

    Ok(profile.use_count)
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/// Get supported field types
#[tauri::command]
pub async fn af2_get_field_types() -> Result<Vec<String>, String> {
    Ok(vec![
        "text".to_string(),
        "email".to_string(),
        "password".to_string(),
        "phone".to_string(),
        "tel".to_string(),
        "url".to_string(),
        "search".to_string(),
        "address".to_string(),
        "address_line1".to_string(),
        "address_line2".to_string(),
        "city".to_string(),
        "state".to_string(),
        "postal_code".to_string(),
        "zip_code".to_string(),
        "country".to_string(),
        "full_name".to_string(),
        "first_name".to_string(),
        "middle_name".to_string(),
        "last_name".to_string(),
        "date".to_string(),
        "time".to_string(),
        "datetime".to_string(),
        "month".to_string(),
        "year".to_string(),
        "number".to_string(),
        "currency".to_string(),
        "percentage".to_string(),
        "select".to_string(),
        "checkbox".to_string(),
        "radio".to_string(),
        "textarea".to_string(),
        "file".to_string(),
        "color".to_string(),
        "range".to_string(),
    ])
}

/// Export profile as JSON
#[tauri::command]
pub async fn af2_export_profile(
    profile_id: String,
    state: State<'_, AutofillCommandState>,
) -> Result<String, String> {
    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    let profile = engine
        .get_profile(&profile_id)?
        .ok_or_else(|| format!("Profile not found: {}", profile_id))?;

    serde_json::to_string_pretty(&profile)
        .map_err(|e| format!("Failed to serialize profile: {}", e))
}

/// Import profile from JSON
#[tauri::command]
pub async fn af2_import_profile(
    profile_json: String,
    state: State<'_, AutofillCommandState>,
) -> Result<AutofillProfile, String> {
    let profile: AutofillProfile = serde_json::from_str(&profile_json)
        .map_err(|e| format!("Failed to parse profile JSON: {}", e))?;

    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    engine.add_profile(profile.clone())?;
    Ok(profile)
}

/// Clear all profiles (with confirmation)
#[tauri::command]
pub async fn af2_clear_all_profiles(
    confirm: bool,
    state: State<'_, AutofillCommandState>,
) -> Result<usize, String> {
    if !confirm {
        return Err("Confirmation required to clear all profiles".to_string());
    }

    let engine = state
        .engine
        .lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;

    let profiles = engine.get_all_profiles()?;
    let count = profiles.len();

    for profile in profiles {
        engine.delete_profile(&profile.id)?;
    }

    Ok(count)
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/// Parse field type string to enum
fn parse_field_type(field_type: &str) -> Result<FieldType, String> {
    match field_type.to_lowercase().as_str() {
        "text" => Ok(FieldType::Text),
        "email" => Ok(FieldType::Email),
        "password" => Ok(FieldType::Password),
        "phone" | "tel" => Ok(FieldType::Phone),
        "url" => Ok(FieldType::Url),
        "search" => Ok(FieldType::Search),
        "address" => Ok(FieldType::Address),
        "address_line1" => Ok(FieldType::AddressLine1),
        "address_line2" => Ok(FieldType::AddressLine2),
        "city" => Ok(FieldType::City),
        "state" => Ok(FieldType::State),
        "postal_code" | "zip_code" => Ok(FieldType::PostalCode),
        "country" => Ok(FieldType::Country),
        "full_name" => Ok(FieldType::FullName),
        "first_name" => Ok(FieldType::FirstName),
        "middle_name" => Ok(FieldType::MiddleName),
        "last_name" => Ok(FieldType::LastName),
        "date" => Ok(FieldType::Date),
        "time" => Ok(FieldType::Time),
        "datetime" => Ok(FieldType::DateTime),
        "month" => Ok(FieldType::Month),
        "year" => Ok(FieldType::Year),
        "number" => Ok(FieldType::Number),
        "currency" => Ok(FieldType::Currency),
        "percentage" => Ok(FieldType::Percentage),
        "select" => Ok(FieldType::Select),
        "checkbox" => Ok(FieldType::Checkbox),
        "radio" => Ok(FieldType::Radio),
        "textarea" => Ok(FieldType::Textarea),
        "file" => Ok(FieldType::File),
        "color" => Ok(FieldType::Color),
        "range" => Ok(FieldType::Range),
        custom => Ok(FieldType::Custom(custom.to_string())),
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND LIST FOR REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════

/// Get list of all autofill commands for Tauri registration
pub fn get_autofill_commands() -> Vec<&'static str> {
    vec![
        // Profile management (8 commands)
        "autofill_create_profile",
        "autofill_get_profile",
        "autofill_get_all_profiles",
        "autofill_update_profile",
        "autofill_delete_profile",
        "autofill_add_profile_field",
        "autofill_remove_profile_field",
        "autofill_get_profile_field",
        // Field detection (2 commands)
        "autofill_detect_fields",
        "autofill_detect_field_type",
        // Field validation (6 commands)
        "autofill_validate_field",
        "autofill_validate_email",
        "autofill_validate_phone",
        "autofill_validate_url",
        "autofill_validate_postal_code",
        "autofill_validate_date",
        // Field formatting (6 commands)
        "autofill_format_field",
        "autofill_format_phone",
        "autofill_format_postal_code",
        "autofill_format_currency",
        "autofill_format_date",
        "autofill_format_name",
        // Autofill operations (3 commands)
        "autofill_execute",
        "autofill_smart_execute",
        "autofill_preview",
        // Statistics (2 commands)
        "autofill_get_statistics",
        "autofill_get_profile_usage",
        // Utilities (5 commands)
        "autofill_get_field_types",
        "autofill_export_profile",
        "autofill_import_profile",
        "autofill_clear_all_profiles",
    ]
}

// Total: 32 Tauri commands for complete autofill functionality
