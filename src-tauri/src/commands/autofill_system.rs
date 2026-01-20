// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 AUTOFILL SYSTEM COMMANDS - Tauri Commands for Form Autofill
// ═══════════════════════════════════════════════════════════════════════════════

use crate::autofill::*;
use tauri::State;
use std::sync::Mutex;

// Type alias to avoid conflicts
type CommandResult<T> = std::result::Result<T, String>;

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════════════

pub struct AutofillState {
    engine: Mutex<AutofillEngine>,
}

impl Default for AutofillState {
    fn default() -> Self {
        Self {
            engine: Mutex::new(create_engine()),
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/// Detect form type from HTML and field names
#[tauri::command]
pub async fn autofill_detect_form(
    html: String,
    field_names: Vec<String>,
    state: State<'_, AutofillState>,
) -> CommandResult<(String, f32)> {
    let detector = state.detector.lock()
        .map_err(|e| format!("Failed to lock detector: {}", e))?;
    
    let (form_type, confidence) = detector.detect_form_type(&html, &field_names);
    
    let form_type_str = match form_type {
        FormType::LoanApplication => "loanApplication",
        FormType::PersonalInfo => "personalInfo",
        FormType::Employment => "employment",
        FormType::Financial => "financial",
        FormType::Contact => "contact",
        FormType::Registration => "registration",
        FormType::Property => "property",
        FormType::Tax => "tax",
        FormType::Unknown => "unknown",
    };
    
    Ok((form_type_str.to_string(), confidence))
}

/// Extract keywords from HTML
#[tauri::command]
pub async fn autofill_extract_keywords(
    html: String,
    state: State<'_, AutofillState>,
) -> CommandResult<Vec<String>> {
    let detector = state.detector.lock()
        .map_err(|e| format!("Failed to lock detector: {}", e))?;
    
    Ok(detector.extract_keywords(&html))
}

/// Validate if structure looks like a form
#[tauri::command]
pub async fn autofill_is_valid_form(
    field_count: usize,
    html: String,
    state: State<'_, AutofillState>,
) -> CommandResult<bool> {
    let detector = state.detector.lock()
        .map_err(|e| format!("Failed to lock detector: {}", e))?;
    
    Ok(detector.is_valid_form(field_count, &html))
}

/// Map a field name to standard field
#[tauri::command]
pub async fn autofill_map_field(
    field_name: String,
    state: State<'_, AutofillState>,
) -> CommandResult<Option<(String, f32)>> {
    let mapper = state.mapper.lock()
        .map_err(|e| format!("Failed to lock mapper: {}", e))?;
    
    Ok(mapper.map_field(&field_name))
}

/// Calculate similarity between two strings
#[tauri::command]
pub async fn autofill_calculate_similarity(
    a: String,
    b: String,
    state: State<'_, AutofillState>,
) -> CommandResult<f32> {
    let mapper = state.mapper.lock()
        .map_err(|e| format!("Failed to lock mapper: {}", e))?;
    
    Ok(mapper.calculate_similarity(&a, &b))
}

/// Map data to form fields
#[tauri::command]
pub async fn autofill_map_data_to_fields(
    data: AutofillData,
    detected_fields: Vec<DetectedField>,
    state: State<'_, AutofillState>,
) -> CommandResult<Vec<FilledField>> {
    let mapper = state.mapper.lock()
        .map_err(|e| format!("Failed to lock mapper: {}", e))?;
    
    Ok(mapper.map_data_to_fields(&data, &detected_fields))
}

/// Validate a value against a field type
#[tauri::command]
pub async fn autofill_validate_field(
    value: String,
    field_type: String,
) -> CommandResult<bool> {
    let validator = create_validator();
    
    let field_type_enum = match field_type.as_str() {
        "text" => FieldType::Text,
        "email" => FieldType::Email,
        "phone" | "tel" => FieldType::Tel,
        "number" => FieldType::Number,
        "date" => FieldType::Date,
        "url" => FieldType::Url,
        _ => FieldType::Text,
    };
    
    match validator.validate(&value, &field_type_enum) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Check if value is a valid email
#[tauri::command]
pub async fn autofill_is_valid_email(
    email: String,
) -> CommandResult<bool> {
    let validator = create_validator();
    Ok(validator.is_valid_email(&email))
}

/// Check if value is a valid phone number
#[tauri::command]
pub async fn autofill_is_valid_phone(
    phone: String,
) -> CommandResult<bool> {
    let validator = create_validator();
    Ok(validator.is_valid_phone(&phone))
}

/// Format a value using a specific formatter
#[tauri::command]
pub async fn autofill_format_value(
    value: String,
    formatter: String,
) -> CommandResult<String> {
    Ok(FieldFormatter::apply_formatter(&value, &formatter))
}

/// Format phone number
#[tauri::command]
pub async fn autofill_format_phone(
    phone: String,
) -> CommandResult<String> {
    Ok(FieldFormatter::format_phone(&phone))
}

/// Format ZIP code
#[tauri::command]
pub async fn autofill_format_zip_code(
    zip: String,
) -> CommandResult<String> {
    Ok(FieldFormatter::format_zip_code(&zip))
}

/// Format SSN
#[tauri::command]
pub async fn autofill_format_ssn(
    ssn: String,
) -> CommandResult<String> {
    Ok(FieldFormatter::format_ssn(&ssn))
}

/// Format currency
#[tauri::command]
pub async fn autofill_format_currency(
    amount: String,
) -> CommandResult<String> {
    Ok(FieldFormatter::format_currency(&amount))
}

/// Format date
#[tauri::command]
pub async fn autofill_format_date(
    date: String,
) -> CommandResult<String> {
    Ok(FieldFormatter::format_date(&date))
}

/// Get all field mappings
#[tauri::command]
pub async fn autofill_get_all_mappings(
    state: State<'_, AutofillState>,
) -> CommandResult<Vec<String>> {
    let mapper = state.mapper.lock()
        .map_err(|e| format!("Failed to lock mapper: {}", e))?;
    
    let db = FieldMappingDatabase::new();
    Ok(db.all_mappings().keys().cloned().collect())
}

/// Get form patterns
#[tauri::command]
pub async fn autofill_get_form_patterns(
    state: State<'_, AutofillState>,
) -> CommandResult<Vec<String>> {
    let _detector = state.detector.lock()
        .map_err(|e| format!("Failed to lock detector: {}", e))?;
    
    Ok(vec![
        "loanApplication".to_string(),
        "personalInfo".to_string(),
        "employment".to_string(),
        "financial".to_string(),
        "contact".to_string(),
        "registration".to_string(),
        "property".to_string(),
        "tax".to_string(),
    ])
}
