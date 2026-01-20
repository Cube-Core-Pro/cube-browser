// Autofill Module - Clean Integration Layer
// Re-exports production implementation from mod_v2

// Import production implementation
mod mod_v2;

// Import tests
#[cfg(test)]
mod tests;

// Re-export all types from mod_v2
pub use mod_v2::{
    // Main engine
    AutofillEngine,

    // Types
    AutofillProfile,
    AutofillResult,
    // Results
    DetectionResult,
    // Components
    FieldDetector,
    FieldFormatter,
    FieldMapping,
    FieldMetadata,
    FieldType,

    FieldValidator,
    FilledField,

    FormatterResult,
    ValidationResult,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Create a new autofill engine
pub fn create_engine() -> AutofillEngine {
    AutofillEngine::new()
}

/// Create a field detector with default threshold
pub fn create_detector() -> FieldDetector {
    FieldDetector::new()
}

/// Create a field validator
pub fn create_validator() -> FieldValidator {
    FieldValidator::new()
}

/// Create a field formatter
pub fn create_formatter() -> FieldFormatter {
    FieldFormatter::new()
}
