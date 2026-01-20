// Autofill System Commands v2 - Production Implementation
// Tauri commands for the Autofill Engine

use crate::autofill::*;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;

// Type alias to avoid conflicts
type CommandResult<T> = std::result::Result<T, String>;

// ============================================================================
// GLOBAL STATE
// ============================================================================

pub struct AutofillSystemState {
    engine: Arc<AutofillEngine>,
}

impl Default for AutofillSystemState {
    fn default() -> Self {
        Self {
            engine: Arc::new(create_engine()),
        }
    }
}

// ============================================================================
// PROFILE MANAGEMENT COMMANDS
// ============================================================================

/// Create a new autofill profile
#[tauri::command]
pub async fn autofill_create_profile(
    name: String,
    description: Option<String>,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<AutofillProfile> {
    state.engine.create_profile(name, description)
}

/// Get a profile by ID
#[tauri::command]
pub async fn autofill_get_profile(
    id: String,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<Option<AutofillProfile>> {
    state.engine.get_profile(&id)
}

/// Get all profiles
#[tauri::command]
pub async fn autofill_get_all_profiles(
    state: State<'_, AutofillSystemState>,
) -> CommandResult<Vec<AutofillProfile>> {
    state.engine.get_all_profiles()
}

/// Update a profile's fields
#[tauri::command]
pub async fn autofill_update_profile(
    id: String,
    fields: HashMap<String, String>,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<()> {
    state.engine.update_profile(&id, fields)
}

/// Delete a profile
#[tauri::command]
pub async fn autofill_delete_profile(
    id: String,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<bool> {
    state.engine.delete_profile(&id)
}

/// Add a profile directly (for imports)
#[tauri::command]
pub async fn autofill_add_profile(
    profile: AutofillProfile,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<()> {
    state.engine.add_profile(profile)
}

// ============================================================================
// FIELD DETECTION COMMANDS
// ============================================================================

/// Detect fields from form metadata
#[tauri::command]
pub async fn autofill_detect_fields(
    fields_metadata: Vec<FieldMetadata>,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<DetectionResult> {
    Ok(state.engine.detect_fields(fields_metadata))
}

/// Detect a single field type from metadata
#[tauri::command]
pub async fn autofill_detect_field_type(
    metadata: FieldMetadata,
    _state: State<'_, AutofillSystemState>,
) -> CommandResult<(FieldType, f32)> {
    let detector = create_detector();
    Ok(detector.detect_field_type(&metadata))
}

// ============================================================================
// VALIDATION COMMANDS
// ============================================================================

/// Validate a field value
#[tauri::command]
pub async fn autofill_validate_field(
    value: String,
    field_type: FieldType,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<ValidationResult> {
    Ok(state.engine.validate_field(&value, &field_type))
}

/// Validate email
#[tauri::command]
pub async fn autofill_validate_email(
    email: String,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<ValidationResult> {
    Ok(state.engine.validate_field(&email, &FieldType::Email))
}

/// Validate phone
#[tauri::command]
pub async fn autofill_validate_phone(
    phone: String,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<ValidationResult> {
    Ok(state.engine.validate_field(&phone, &FieldType::Phone))
}

/// Validate URL
#[tauri::command]
pub async fn autofill_validate_url(
    url: String,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<ValidationResult> {
    Ok(state.engine.validate_field(&url, &FieldType::Url))
}

/// Validate postal code
#[tauri::command]
pub async fn autofill_validate_postal_code(
    postal_code: String,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<ValidationResult> {
    Ok(state
        .engine
        .validate_field(&postal_code, &FieldType::PostalCode))
}

// ============================================================================
// FORMATTING COMMANDS
// ============================================================================

/// Format a field value
#[tauri::command]
pub async fn autofill_format_field(
    value: String,
    field_type: FieldType,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<FormatterResult> {
    Ok(state.engine.format_field(&value, &field_type))
}

/// Format phone number
#[tauri::command]
pub async fn autofill_format_phone(
    phone: String,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<FormatterResult> {
    Ok(state.engine.format_field(&phone, &FieldType::Phone))
}

/// Format name
#[tauri::command]
pub async fn autofill_format_name(
    name: String,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<FormatterResult> {
    Ok(state.engine.format_field(&name, &FieldType::FullName))
}

/// Format postal code
#[tauri::command]
pub async fn autofill_format_postal_code(
    postal_code: String,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<FormatterResult> {
    Ok(state
        .engine
        .format_field(&postal_code, &FieldType::PostalCode))
}

// ============================================================================
// AUTOFILL EXECUTION COMMANDS
// ============================================================================

/// Perform autofill operation
#[tauri::command]
pub async fn autofill_execute(
    profile_id: String,
    field_mappings: Vec<FieldMapping>,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<AutofillResult> {
    state.engine.autofill(&profile_id, field_mappings)
}

/// Quick autofill with profile ID (auto-detect fields)
#[tauri::command]
pub async fn autofill_quick_fill(
    profile_id: String,
    fields_metadata: Vec<FieldMetadata>,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<AutofillResult> {
    // First detect fields
    let detection = state.engine.detect_fields(fields_metadata);

    // Then perform autofill
    state
        .engine
        .autofill(&profile_id, detection.detected_fields)
}

// ============================================================================
// UTILITY COMMANDS
// ============================================================================

/// Get field type as string (for debugging)
#[tauri::command]
pub async fn autofill_field_type_to_string(field_type: FieldType) -> CommandResult<String> {
    Ok(format!("{:?}", field_type))
}

/// Get profile usage statistics
#[tauri::command]
pub async fn autofill_get_profile_stats(
    id: String,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<HashMap<String, serde_json::Value>> {
    let profile = state
        .engine
        .get_profile(&id)?
        .ok_or_else(|| format!("Profile not found: {}", id))?;

    let mut stats = HashMap::new();
    stats.insert("id".to_string(), serde_json::json!(profile.id));
    stats.insert("name".to_string(), serde_json::json!(profile.name));
    stats.insert(
        "use_count".to_string(),
        serde_json::json!(profile.use_count),
    );
    stats.insert(
        "last_used".to_string(),
        serde_json::json!(profile.last_used),
    );
    stats.insert(
        "created_at".to_string(),
        serde_json::json!(profile.created_at),
    );
    stats.insert(
        "updated_at".to_string(),
        serde_json::json!(profile.updated_at),
    );
    stats.insert(
        "field_count".to_string(),
        serde_json::json!(profile.fields.len()),
    );

    Ok(stats)
}

/// Get system statistics
#[tauri::command]
pub async fn autofill_get_system_stats(
    state: State<'_, AutofillSystemState>,
) -> CommandResult<HashMap<String, serde_json::Value>> {
    let profiles = state.engine.get_all_profiles()?;

    let total_profiles = profiles.len();
    let total_use_count: usize = profiles.iter().map(|p| p.use_count).sum();
    let most_used = profiles
        .iter()
        .max_by_key(|p| p.use_count)
        .map(|p| p.name.clone())
        .unwrap_or_else(|| "None".to_string());

    let mut stats = HashMap::new();
    stats.insert(
        "total_profiles".to_string(),
        serde_json::json!(total_profiles),
    );
    stats.insert(
        "total_use_count".to_string(),
        serde_json::json!(total_use_count),
    );
    stats.insert(
        "most_used_profile".to_string(),
        serde_json::json!(most_used),
    );

    Ok(stats)
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/// Import multiple profiles at once
#[tauri::command]
pub async fn autofill_import_profiles(
    profiles: Vec<AutofillProfile>,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<usize> {
    let mut imported = 0;
    for profile in profiles {
        if state.engine.add_profile(profile).is_ok() {
            imported += 1;
        }
    }
    Ok(imported)
}

/// Export all profiles
#[tauri::command]
pub async fn autofill_export_profiles(
    state: State<'_, AutofillSystemState>,
) -> CommandResult<Vec<AutofillProfile>> {
    state.engine.get_all_profiles()
}

/// Batch validate fields
#[tauri::command]
pub async fn autofill_batch_validate(
    fields: Vec<(String, FieldType)>,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<Vec<ValidationResult>> {
    let mut results = Vec::new();
    for (value, field_type) in fields {
        let result = state.engine.validate_field(&value, &field_type);
        results.push(result);
    }
    Ok(results)
}

/// Batch format fields
#[tauri::command]
pub async fn autofill_batch_format(
    fields: Vec<(String, FieldType)>,
    state: State<'_, AutofillSystemState>,
) -> CommandResult<Vec<FormatterResult>> {
    let mut results = Vec::new();
    for (value, field_type) in fields {
        let result = state.engine.format_field(&value, &field_type);
        results.push(result);
    }
    Ok(results)
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // NOTE: These tests are disabled because Tauri's State<'_, T> cannot be
    // constructed directly with State::from(&state). The State type is designed
    // to work only within Tauri's dependency injection system.
    // To properly test these commands, use Tauri's test utilities or integration tests.

    #[test]
    fn test_autofill_system_state_default() {
        let state = AutofillSystemState::default();
        // Just verify the state can be created - engine is Arc wrapped
        assert!(Arc::strong_count(&state.engine) > 0);
    }

    // #[tokio::test]
    // async fn test_create_profile_command() {
    //     let state = AutofillSystemState::default();
    //     let result = autofill_create_profile(
    //         "Test".to_string(),
    //         Some("Description".to_string()),
    //         State::from(&state),
    //     )
    //     .await;
    //
    //     assert!(result.is_ok());
    // }

    // #[tokio::test]
    // async fn test_get_all_profiles_command() {
    //     let state = AutofillSystemState::default();
    //     let result = autofill_get_all_profiles(State::from(&state)).await;
    //
    //     assert!(result.is_ok());
    //     assert_eq!(result.unwrap().len(), 0);
    // }
}
