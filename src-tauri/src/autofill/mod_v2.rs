// Autofill Module v2 - Production Implementation
// Complete intelligent form filling system with AI assistance
//
// Features:
// - Smart field detection and mapping
// - Multiple profile management
// - Field validation and formatting
// - Confidence scoring
// - Thread-safe operations
// - Comprehensive error handling

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

// ============================================================================
// TYPES & ENUMS
// ============================================================================

/// Field type classification
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum FieldType {
    // Text inputs
    Text,
    Email,
    Password,
    Phone,
    Tel,
    Url,
    Search,

    // Address fields
    Address,
    AddressLine1,
    AddressLine2,
    City,
    State,
    ZipCode,
    PostalCode,
    Country,

    // Name fields
    FullName,
    FirstName,
    MiddleName,
    LastName,

    // Date/Time
    Date,
    Time,
    DateTime,
    Month,
    Year,

    // Numeric
    Number,
    Currency,
    Percentage,

    // Selection
    Select,
    Checkbox,
    Radio,

    // Other
    Textarea,
    File,
    Color,
    Range,

    // Custom
    Custom(String),
}

/// Field metadata extracted from HTML elements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldMetadata {
    pub selector: String,
    pub element_type: String,
    pub name: Option<String>,
    pub id: Option<String>,
    pub placeholder: Option<String>,
    pub label: Option<String>,
    pub aria_label: Option<String>,
    pub autocomplete: Option<String>,
    pub required: bool,
    pub pattern: Option<String>,
    pub min_length: Option<usize>,
    pub max_length: Option<usize>,
}

/// Field mapping with confidence scoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldMapping {
    pub selector: String,
    pub field_type: FieldType,
    pub profile_key: String,
    pub confidence: f32,
    pub metadata: FieldMetadata,
}

/// Autofill profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutofillProfile {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub fields: HashMap<String, String>,
    pub tags: Vec<String>,
    pub created_at: u64,
    pub updated_at: u64,
    pub last_used: Option<u64>,
    pub use_count: usize,
}

/// Autofill result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutofillResult {
    pub success: bool,
    pub profile_id: String,
    pub fields_filled: usize,
    pub fields_failed: usize,
    pub total_fields: usize,
    pub duration_ms: u64,
    pub errors: Vec<String>,
    pub filled_fields: Vec<FilledField>,
}

/// Information about a filled field
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilledField {
    pub selector: String,
    pub field_type: FieldType,
    pub value_preview: String,
    pub success: bool,
    pub error: Option<String>,
}

/// Field detection result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectionResult {
    pub total_fields: usize,
    pub detected_fields: Vec<FieldMapping>,
    pub unrecognized_fields: Vec<FieldMetadata>,
    pub confidence_average: f32,
}

/// Validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub field_type: FieldType,
    pub errors: Vec<String>,
    pub suggestions: Vec<String>,
}

/// Formatter result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormatterResult {
    pub formatted_value: String,
    pub original_value: String,
    pub field_type: FieldType,
    pub changes_made: Vec<String>,
}

// ============================================================================
// FIELD DETECTOR
// ============================================================================

/// Smart field detector that analyzes HTML elements
pub struct FieldDetector {
    confidence_threshold: f32,
}

impl FieldDetector {
    pub fn new() -> Self {
        Self {
            confidence_threshold: 0.6,
        }
    }

    pub fn with_threshold(confidence_threshold: f32) -> Self {
        Self {
            confidence_threshold,
        }
    }

    /// Detect field type from metadata
    pub fn detect_field_type(&self, metadata: &FieldMetadata) -> (FieldType, f32) {
        let mut confidence = 0.5;
        let mut field_type = FieldType::Text;

        // Check input type
        match metadata.element_type.to_lowercase().as_str() {
            "email" => {
                field_type = FieldType::Email;
                confidence = 0.95;
            }
            "password" => {
                field_type = FieldType::Password;
                confidence = 0.95;
            }
            "tel" | "phone" => {
                field_type = FieldType::Phone;
                confidence = 0.95;
            }
            "url" => {
                field_type = FieldType::Url;
                confidence = 0.95;
            }
            "date" => {
                field_type = FieldType::Date;
                confidence = 0.95;
            }
            "number" => {
                field_type = FieldType::Number;
                confidence = 0.95;
            }
            "textarea" => {
                field_type = FieldType::Textarea;
                confidence = 0.95;
            }
            "select" | "select-one" | "select-multiple" => {
                field_type = FieldType::Select;
                confidence = 0.95;
            }
            "checkbox" => {
                field_type = FieldType::Checkbox;
                confidence = 0.95;
            }
            "radio" => {
                field_type = FieldType::Radio;
                confidence = 0.95;
            }
            _ => {}
        }

        // Check autocomplete attribute
        if let Some(autocomplete) = &metadata.autocomplete {
            let (detected_type, auto_confidence) = self.detect_from_autocomplete(autocomplete);
            if auto_confidence > confidence {
                field_type = detected_type;
                confidence = auto_confidence;
            }
        }

        // Check name, id, placeholder, label
        let text_hints = [
            metadata.name.as_deref().unwrap_or(""),
            metadata.id.as_deref().unwrap_or(""),
            metadata.placeholder.as_deref().unwrap_or(""),
            metadata.label.as_deref().unwrap_or(""),
            metadata.aria_label.as_deref().unwrap_or(""),
        ]
        .join(" ")
        .to_lowercase();

        let (detected_type, text_confidence) = self.detect_from_text_hints(&text_hints);
        if text_confidence > confidence {
            field_type = detected_type;
            confidence = text_confidence;
        }

        (field_type, confidence)
    }

    fn detect_from_autocomplete(&self, autocomplete: &str) -> (FieldType, f32) {
        let ac = autocomplete.to_lowercase();
        match ac.as_str() {
            "email" => (FieldType::Email, 0.98),
            "tel" | "tel-national" | "tel-country-code" => (FieldType::Phone, 0.98),
            "street-address" | "address-line1" => (FieldType::AddressLine1, 0.98),
            "address-line2" => (FieldType::AddressLine2, 0.98),
            "address-level2" => (FieldType::City, 0.98),
            "address-level1" => (FieldType::State, 0.98),
            "postal-code" => (FieldType::PostalCode, 0.98),
            "country" | "country-name" => (FieldType::Country, 0.98),
            "name" => (FieldType::FullName, 0.98),
            "given-name" => (FieldType::FirstName, 0.98),
            "additional-name" => (FieldType::MiddleName, 0.98),
            "family-name" => (FieldType::LastName, 0.98),
            "bday" | "bday-day" | "bday-month" | "bday-year" => (FieldType::Date, 0.98),
            "url" => (FieldType::Url, 0.98),
            "current-password" | "new-password" => (FieldType::Password, 0.98),
            _ => (FieldType::Text, 0.5),
        }
    }

    fn detect_from_text_hints(&self, text: &str) -> (FieldType, f32) {
        let keywords = [
            (vec!["email", "e-mail", "mail"], FieldType::Email, 0.85),
            (vec!["password", "passwd", "pwd"], FieldType::Password, 0.85),
            (
                vec!["phone", "telephone", "mobile", "cell"],
                FieldType::Phone,
                0.85,
            ),
            (
                vec!["first name", "firstname", "given name"],
                FieldType::FirstName,
                0.85,
            ),
            (
                vec!["last name", "lastname", "surname", "family name"],
                FieldType::LastName,
                0.85,
            ),
            (
                vec!["full name", "name", "your name"],
                FieldType::FullName,
                0.80,
            ),
            (vec!["address", "street"], FieldType::Address, 0.80),
            (vec!["city", "town"], FieldType::City, 0.85),
            (vec!["state", "province", "region"], FieldType::State, 0.85),
            (
                vec!["zip", "postal", "postcode"],
                FieldType::PostalCode,
                0.85,
            ),
            (vec!["country"], FieldType::Country, 0.85),
            (vec!["url", "website", "web site"], FieldType::Url, 0.80),
            (vec!["date", "birth", "birthday"], FieldType::Date, 0.75),
        ];

        for (words, field_type, confidence) in keywords {
            for word in words {
                if text.contains(word) {
                    return (field_type.clone(), confidence);
                }
            }
        }

        (FieldType::Text, 0.5)
    }

    /// Detect all fields from metadata list
    pub fn detect_fields(&self, fields_metadata: Vec<FieldMetadata>) -> DetectionResult {
        let mut detected_fields = Vec::new();
        let mut unrecognized_fields = Vec::new();
        let mut total_confidence = 0.0;

        for metadata in fields_metadata {
            let (field_type, confidence) = self.detect_field_type(&metadata);

            if confidence >= self.confidence_threshold {
                let profile_key = self.generate_profile_key(&field_type);
                detected_fields.push(FieldMapping {
                    selector: metadata.selector.clone(),
                    field_type,
                    profile_key,
                    confidence,
                    metadata: metadata.clone(),
                });
                total_confidence += confidence;
            } else {
                unrecognized_fields.push(metadata);
            }
        }

        let confidence_average = if detected_fields.is_empty() {
            0.0
        } else {
            total_confidence / detected_fields.len() as f32
        };

        DetectionResult {
            total_fields: detected_fields.len() + unrecognized_fields.len(),
            detected_fields,
            unrecognized_fields,
            confidence_average,
        }
    }

    fn generate_profile_key(&self, field_type: &FieldType) -> String {
        match field_type {
            FieldType::Email => "email".to_string(),
            FieldType::Phone | FieldType::Tel => "phone".to_string(),
            FieldType::FirstName => "first_name".to_string(),
            FieldType::LastName => "last_name".to_string(),
            FieldType::FullName => "full_name".to_string(),
            FieldType::AddressLine1 | FieldType::Address => "address_line1".to_string(),
            FieldType::AddressLine2 => "address_line2".to_string(),
            FieldType::City => "city".to_string(),
            FieldType::State => "state".to_string(),
            FieldType::PostalCode | FieldType::ZipCode => "postal_code".to_string(),
            FieldType::Country => "country".to_string(),
            FieldType::Url => "url".to_string(),
            FieldType::Date => "date".to_string(),
            FieldType::Password => "password".to_string(),
            FieldType::Custom(name) => name.to_lowercase().replace(' ', "_"),
            _ => "text".to_string(),
        }
    }
}

impl Default for FieldDetector {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// FIELD VALIDATOR
// ============================================================================

/// Validates field values according to their type
pub struct FieldValidator;

impl FieldValidator {
    pub fn new() -> Self {
        Self
    }

    /// Validate a field value
    pub fn validate(&self, value: &str, field_type: &FieldType) -> ValidationResult {
        let mut errors = Vec::new();
        let mut suggestions = Vec::new();

        let valid = match field_type {
            FieldType::Email => self.validate_email(value, &mut errors, &mut suggestions),
            FieldType::Phone | FieldType::Tel => {
                self.validate_phone(value, &mut errors, &mut suggestions)
            }
            FieldType::Url => self.validate_url(value, &mut errors, &mut suggestions),
            FieldType::PostalCode | FieldType::ZipCode => {
                self.validate_postal_code(value, &mut errors, &mut suggestions)
            }
            FieldType::Number | FieldType::Currency | FieldType::Percentage => {
                self.validate_number(value, &mut errors, &mut suggestions)
            }
            FieldType::Date => self.validate_date(value, &mut errors, &mut suggestions),
            _ => true, // No specific validation for other types
        };

        ValidationResult {
            valid,
            field_type: field_type.clone(),
            errors,
            suggestions,
        }
    }

    fn validate_email(
        &self,
        value: &str,
        errors: &mut Vec<String>,
        suggestions: &mut Vec<String>,
    ) -> bool {
        if value.is_empty() {
            errors.push("Email cannot be empty".to_string());
            return false;
        }

        let email_regex = regex::Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();

        if !email_regex.is_match(value) {
            errors.push("Invalid email format".to_string());
            suggestions.push("Email should be in format: user@example.com".to_string());
            return false;
        }

        // Check for common typos
        if value.contains("..") {
            errors.push("Email contains consecutive dots".to_string());
            return false;
        }

        if value.starts_with('.') || value.ends_with('.') {
            errors.push("Email cannot start or end with a dot".to_string());
            return false;
        }

        true
    }

    fn validate_phone(
        &self,
        value: &str,
        errors: &mut Vec<String>,
        suggestions: &mut Vec<String>,
    ) -> bool {
        if value.is_empty() {
            errors.push("Phone number cannot be empty".to_string());
            return false;
        }

        // Remove common formatting characters
        let digits: String = value.chars().filter(|c| c.is_ascii_digit()).collect();

        if digits.len() < 10 {
            errors.push("Phone number too short".to_string());
            suggestions.push("Phone number should have at least 10 digits".to_string());
            return false;
        }

        if digits.len() > 15 {
            errors.push("Phone number too long".to_string());
            suggestions.push("Phone number should have at most 15 digits".to_string());
            return false;
        }

        true
    }

    fn validate_url(
        &self,
        value: &str,
        errors: &mut Vec<String>,
        suggestions: &mut Vec<String>,
    ) -> bool {
        if value.is_empty() {
            errors.push("URL cannot be empty".to_string());
            return false;
        }

        if !value.starts_with("http://") && !value.starts_with("https://") {
            suggestions.push("URL should start with http:// or https://".to_string());
        }

        if !value.contains('.') {
            errors.push("URL should contain a domain with TLD".to_string());
            return false;
        }

        true
    }

    fn validate_postal_code(
        &self,
        value: &str,
        errors: &mut Vec<String>,
        _suggestions: &mut Vec<String>,
    ) -> bool {
        if value.is_empty() {
            errors.push("Postal code cannot be empty".to_string());
            return false;
        }

        // US ZIP: 5 digits or 5+4 format
        let us_zip = regex::Regex::new(r"^\d{5}(-\d{4})?$").unwrap();

        // Canada: A1A 1A1 format
        let canada_postal = regex::Regex::new(r"^[A-Z]\d[A-Z] \d[A-Z]\d$").unwrap();

        // UK: Various formats
        let uk_postal = regex::Regex::new(r"^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$").unwrap();

        if !us_zip.is_match(value) && !canada_postal.is_match(value) && !uk_postal.is_match(value) {
            errors.push("Invalid postal code format".to_string());
            return false;
        }

        true
    }

    fn validate_number(
        &self,
        value: &str,
        errors: &mut Vec<String>,
        _suggestions: &mut Vec<String>,
    ) -> bool {
        if value.is_empty() {
            errors.push("Number cannot be empty".to_string());
            return false;
        }

        if value.parse::<f64>().is_err() {
            errors.push("Invalid number format".to_string());
            return false;
        }

        true
    }

    fn validate_date(
        &self,
        value: &str,
        errors: &mut Vec<String>,
        suggestions: &mut Vec<String>,
    ) -> bool {
        if value.is_empty() {
            errors.push("Date cannot be empty".to_string());
            return false;
        }

        // Check common date formats
        let formats = [
            r"^\d{4}-\d{2}-\d{2}$", // YYYY-MM-DD
            r"^\d{2}/\d{2}/\d{4}$", // MM/DD/YYYY
            r"^\d{2}-\d{2}-\d{4}$", // MM-DD-YYYY
        ];

        let mut valid = false;
        for format in &formats {
            let regex = regex::Regex::new(format).unwrap();
            if regex.is_match(value) {
                valid = true;
                break;
            }
        }

        if !valid {
            errors.push("Invalid date format".to_string());
            suggestions.push(
                "Date should be in format: YYYY-MM-DD, MM/DD/YYYY, or MM-DD-YYYY".to_string(),
            );
            return false;
        }

        true
    }
}

impl Default for FieldValidator {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// FIELD FORMATTER
// ============================================================================

/// Formats field values according to their type
pub struct FieldFormatter;

impl FieldFormatter {
    pub fn new() -> Self {
        Self
    }

    /// Format a field value
    pub fn format(&self, value: &str, field_type: &FieldType) -> FormatterResult {
        let original_value = value.to_string();
        let mut changes_made = Vec::new();

        let formatted_value = match field_type {
            FieldType::Email => {
                let formatted = value.trim().to_lowercase();
                if formatted != value {
                    changes_made.push("Trimmed whitespace and converted to lowercase".to_string());
                }
                formatted
            }
            FieldType::Phone | FieldType::Tel => {
                
                self.format_phone(value, &mut changes_made)
            }
            FieldType::PostalCode | FieldType::ZipCode => {
                
                self.format_postal_code(value, &mut changes_made)
            }
            FieldType::FullName | FieldType::FirstName | FieldType::LastName => {
                
                self.format_name(value, &mut changes_made)
            }
            FieldType::City | FieldType::State | FieldType::Country => {
                
                self.format_name(value, &mut changes_made)
            }
            _ => {
                let formatted = value.trim().to_string();
                if formatted != value {
                    changes_made.push("Trimmed whitespace".to_string());
                }
                formatted
            }
        };

        FormatterResult {
            formatted_value,
            original_value,
            field_type: field_type.clone(),
            changes_made,
        }
    }

    fn format_phone(&self, value: &str, changes_made: &mut Vec<String>) -> String {
        // Extract only digits
        let digits: String = value.chars().filter(|c| c.is_ascii_digit()).collect();

        if digits.len() == 10 {
            // Format as (XXX) XXX-XXXX
            changes_made.push("Formatted as (XXX) XXX-XXXX".to_string());
            format!("({}) {}-{}", &digits[0..3], &digits[3..6], &digits[6..10])
        } else if digits.len() == 11 && digits.starts_with('1') {
            // Format as +1 (XXX) XXX-XXXX
            changes_made.push("Formatted as +1 (XXX) XXX-XXXX".to_string());
            format!(
                "+1 ({}) {}-{}",
                &digits[1..4],
                &digits[4..7],
                &digits[7..11]
            )
        } else {
            changes_made.push("Removed non-digit characters".to_string());
            digits
        }
    }

    fn format_postal_code(&self, value: &str, changes_made: &mut Vec<String>) -> String {
        let trimmed = value.trim().to_uppercase();

        // US ZIP code
        let digits: String = trimmed.chars().filter(|c| c.is_ascii_digit()).collect();
        if digits.len() == 9 {
            changes_made.push("Formatted as XXXXX-XXXX".to_string());
            return format!("{}-{}", &digits[0..5], &digits[5..9]);
        } else if digits.len() == 5 {
            return digits;
        }

        // Canada postal code
        if trimmed.len() == 6 {
            let formatted = format!("{} {}", &trimmed[0..3], &trimmed[3..6]);
            changes_made.push("Formatted as A1A 1A1".to_string());
            return formatted;
        }

        if trimmed != value {
            changes_made.push("Trimmed and converted to uppercase".to_string());
        }

        trimmed
    }

    fn format_name(&self, value: &str, changes_made: &mut Vec<String>) -> String {
        let words: Vec<String> = value
            .split_whitespace()
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first
                        .to_uppercase()
                        .chain(chars.as_str().to_lowercase().chars())
                        .collect(),
                }
            })
            .collect();

        let formatted = words.join(" ");

        if formatted != value {
            changes_made.push("Capitalized each word".to_string());
        }

        formatted
    }
}

impl Default for FieldFormatter {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// AUTOFILL ENGINE
// ============================================================================

/// Main autofill engine with profile management
pub struct AutofillEngine {
    profiles: Arc<Mutex<HashMap<String, AutofillProfile>>>,
    detector: FieldDetector,
    validator: FieldValidator,
    formatter: FieldFormatter,
}

impl AutofillEngine {
    pub fn new() -> Self {
        Self {
            profiles: Arc::new(Mutex::new(HashMap::new())),
            detector: FieldDetector::new(),
            validator: FieldValidator::new(),
            formatter: FieldFormatter::new(),
        }
    }

    // ========================================================================
    // PROFILE MANAGEMENT
    // ========================================================================

    /// Create a new profile
    pub fn create_profile(
        &self,
        name: String,
        description: Option<String>,
    ) -> Result<AutofillProfile, String> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| format!("Failed to get timestamp: {}", e))?
            .as_secs();

        let profile = AutofillProfile {
            id: id.clone(),
            name,
            description,
            fields: HashMap::new(),
            tags: Vec::new(),
            created_at: now,
            updated_at: now,
            last_used: None,
            use_count: 0,
        };

        let mut profiles = self
            .profiles
            .lock()
            .map_err(|e| format!("Failed to lock profiles: {}", e))?;

        profiles.insert(id.clone(), profile.clone());

        Ok(profile)
    }

    /// Add a profile
    pub fn add_profile(&self, profile: AutofillProfile) -> Result<(), String> {
        let mut profiles = self
            .profiles
            .lock()
            .map_err(|e| format!("Failed to lock profiles: {}", e))?;

        profiles.insert(profile.id.clone(), profile);
        Ok(())
    }

    /// Get a profile by ID
    pub fn get_profile(&self, id: &str) -> Result<Option<AutofillProfile>, String> {
        let profiles = self
            .profiles
            .lock()
            .map_err(|e| format!("Failed to lock profiles: {}", e))?;

        Ok(profiles.get(id).cloned())
    }

    /// Get all profiles
    pub fn get_all_profiles(&self) -> Result<Vec<AutofillProfile>, String> {
        let profiles = self
            .profiles
            .lock()
            .map_err(|e| format!("Failed to lock profiles: {}", e))?;

        Ok(profiles.values().cloned().collect())
    }

    /// Update a profile
    pub fn update_profile(&self, id: &str, updates: HashMap<String, String>) -> Result<(), String> {
        let mut profiles = self
            .profiles
            .lock()
            .map_err(|e| format!("Failed to lock profiles: {}", e))?;

        let profile = profiles
            .get_mut(id)
            .ok_or_else(|| format!("Profile not found: {}", id))?;

        for (key, value) in updates {
            profile.fields.insert(key, value);
        }

        profile.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| format!("Failed to get timestamp: {}", e))?
            .as_secs();

        Ok(())
    }

    /// Delete a profile
    pub fn delete_profile(&self, id: &str) -> Result<bool, String> {
        let mut profiles = self
            .profiles
            .lock()
            .map_err(|e| format!("Failed to lock profiles: {}", e))?;

        Ok(profiles.remove(id).is_some())
    }

    /// Update profile usage stats
    fn update_usage_stats(&self, id: &str) -> Result<(), String> {
        let mut profiles = self
            .profiles
            .lock()
            .map_err(|e| format!("Failed to lock profiles: {}", e))?;

        if let Some(profile) = profiles.get_mut(id) {
            profile.use_count += 1;
            profile.last_used = Some(
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map_err(|e| format!("Failed to get timestamp: {}", e))?
                    .as_secs(),
            );
        }

        Ok(())
    }

    // ========================================================================
    // FIELD OPERATIONS
    // ========================================================================

    /// Detect fields from metadata
    pub fn detect_fields(&self, fields_metadata: Vec<FieldMetadata>) -> DetectionResult {
        self.detector.detect_fields(fields_metadata)
    }

    /// Validate a field value
    pub fn validate_field(&self, value: &str, field_type: &FieldType) -> ValidationResult {
        self.validator.validate(value, field_type)
    }

    /// Format a field value
    pub fn format_field(&self, value: &str, field_type: &FieldType) -> FormatterResult {
        self.formatter.format(value, field_type)
    }

    // ========================================================================
    // AUTOFILL OPERATIONS
    // ========================================================================

    /// Perform autofill with a profile
    pub fn autofill(
        &self,
        profile_id: &str,
        field_mappings: Vec<FieldMapping>,
    ) -> Result<AutofillResult, String> {
        let start_time = std::time::Instant::now();

        let profile = self
            .get_profile(profile_id)?
            .ok_or_else(|| format!("Profile not found: {}", profile_id))?;

        let mut fields_filled = 0;
        let mut fields_failed = 0;
        let mut errors = Vec::new();
        let mut filled_fields = Vec::new();

        for mapping in &field_mappings {
            if let Some(value) = profile.fields.get(&mapping.profile_key) {
                // Validate the value
                let validation = self.validate_field(value, &mapping.field_type);

                if validation.valid {
                    // Format the value
                    let formatted = self.format_field(value, &mapping.field_type);

                    fields_filled += 1;
                    filled_fields.push(FilledField {
                        selector: mapping.selector.clone(),
                        field_type: mapping.field_type.clone(),
                        value_preview: self.preview_value(&formatted.formatted_value),
                        success: true,
                        error: None,
                    });
                } else {
                    fields_failed += 1;
                    let error_msg = validation.errors.join(", ");
                    errors.push(format!(
                        "Validation failed for {}: {}",
                        mapping.selector, error_msg
                    ));
                    filled_fields.push(FilledField {
                        selector: mapping.selector.clone(),
                        field_type: mapping.field_type.clone(),
                        value_preview: String::new(),
                        success: false,
                        error: Some(error_msg),
                    });
                }
            } else {
                fields_failed += 1;
                let error_msg = format!("No value for field: {}", mapping.profile_key);
                errors.push(error_msg.clone());
                filled_fields.push(FilledField {
                    selector: mapping.selector.clone(),
                    field_type: mapping.field_type.clone(),
                    value_preview: String::new(),
                    success: false,
                    error: Some(error_msg),
                });
            }
        }

        let duration = start_time.elapsed();

        // Update usage stats
        self.update_usage_stats(profile_id)?;

        Ok(AutofillResult {
            success: fields_filled > 0,
            profile_id: profile_id.to_string(),
            fields_filled,
            fields_failed,
            total_fields: field_mappings.len(),
            duration_ms: duration.as_millis() as u64,
            errors,
            filled_fields,
        })
    }

    fn preview_value(&self, value: &str) -> String {
        if value.len() <= 20 {
            value.to_string()
        } else {
            format!("{}...", &value[..17])
        }
    }
}

impl Default for AutofillEngine {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// AUTOFILL PROFILE IMPLEMENTATIONS
// ============================================================================

impl AutofillProfile {
    /// Create a new profile
    pub fn new(id: String, name: String) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            id,
            name,
            description: None,
            fields: HashMap::new(),
            tags: Vec::new(),
            created_at: now,
            updated_at: now,
            last_used: None,
            use_count: 0,
        }
    }

    /// Add a field to the profile
    pub fn add_field(&mut self, key: String, value: String) {
        self.fields.insert(key, value);
        self.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
    }

    /// Get a field value
    pub fn get_field(&self, key: &str) -> Option<&String> {
        self.fields.get(key)
    }

    /// Remove a field
    pub fn remove_field(&mut self, key: &str) -> Option<String> {
        self.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        self.fields.remove(key)
    }

    /// Add a tag
    pub fn add_tag(&mut self, tag: String) {
        if !self.tags.contains(&tag) {
            self.tags.push(tag);
        }
    }

    /// Remove a tag
    pub fn remove_tag(&mut self, tag: &str) {
        self.tags.retain(|t| t != tag);
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_field_detector_email() {
        let detector = FieldDetector::new();
        let metadata = FieldMetadata {
            selector: "#email".to_string(),
            element_type: "email".to_string(),
            name: Some("email".to_string()),
            id: Some("email".to_string()),
            placeholder: None,
            label: Some("Email".to_string()),
            aria_label: None,
            autocomplete: Some("email".to_string()),
            required: true,
            pattern: None,
            min_length: None,
            max_length: None,
        };

        let (field_type, confidence) = detector.detect_field_type(&metadata);
        assert_eq!(field_type, FieldType::Email);
        assert!(confidence > 0.9);
    }

    #[test]
    fn test_field_validator_email() {
        let validator = FieldValidator::new();

        let result = validator.validate("test@example.com", &FieldType::Email);
        assert!(result.valid);

        let result = validator.validate("invalid-email", &FieldType::Email);
        assert!(!result.valid);
    }

    #[test]
    fn test_field_formatter_phone() {
        let formatter = FieldFormatter::new();

        let result = formatter.format("1234567890", &FieldType::Phone);
        assert_eq!(result.formatted_value, "(123) 456-7890");
    }

    #[test]
    fn test_autofill_engine_create_profile() {
        let engine = AutofillEngine::new();
        let result = engine.create_profile("Test Profile".to_string(), None);
        assert!(result.is_ok());
    }

    #[test]
    fn test_autofill_profile_operations() {
        let mut profile = AutofillProfile::new("test".to_string(), "Test".to_string());

        profile.add_field("email".to_string(), "test@example.com".to_string());
        assert_eq!(profile.fields.len(), 1);

        assert_eq!(profile.get_field("email").unwrap(), "test@example.com");

        profile.add_tag("personal".to_string());
        assert_eq!(profile.tags.len(), 1);
    }

    #[test]
    fn test_field_detection_from_autocomplete() {
        let detector = FieldDetector::new();
        let (field_type, confidence) = detector.detect_from_autocomplete("given-name");
        assert_eq!(field_type, FieldType::FirstName);
        assert!(confidence > 0.9);
    }

    #[test]
    fn test_phone_validation() {
        let validator = FieldValidator::new();

        let result = validator.validate("1234567890", &FieldType::Phone);
        assert!(result.valid);

        let result = validator.validate("123", &FieldType::Phone);
        assert!(!result.valid);
    }

    #[test]
    fn test_postal_code_formatting() {
        let formatter = FieldFormatter::new();

        let result = formatter.format("123456789", &FieldType::PostalCode);
        assert_eq!(result.formatted_value, "12345-6789");
    }

    #[test]
    fn test_name_formatting() {
        let formatter = FieldFormatter::new();

        let result = formatter.format("john doe", &FieldType::FullName);
        assert_eq!(result.formatted_value, "John Doe");
    }

    #[test]
    fn test_engine_profile_management() {
        let engine = AutofillEngine::new();

        let profile = engine
            .create_profile("Test".to_string(), Some("Description".to_string()))
            .unwrap();

        let retrieved = engine.get_profile(&profile.id).unwrap();
        assert!(retrieved.is_some());

        let all_profiles = engine.get_all_profiles().unwrap();
        assert_eq!(all_profiles.len(), 1);

        let deleted = engine.delete_profile(&profile.id).unwrap();
        assert!(deleted);
    }
}
