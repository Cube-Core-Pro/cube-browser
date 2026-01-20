// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AUTOMATIC AUTOFILL PROFILE CREATOR
// ═══════════════════════════════════════════════════════════════════════════════
//
// Sistema inteligente que extrae datos de documentos y crea perfiles de autofill:
// - Extracción de PDFs, DOCs, XLS, imágenes (OCR)
// - Mapeo inteligente a tipos de campo (40+ field types)
// - Validación y normalización automática
// - Detección de tipo de perfil (personal, business, loan, etc.)
// - Integración con Autofill System v2
//
// ═══════════════════════════════════════════════════════════════════════════════

use anyhow::Result;
use chrono::{DateTime, Utc};
use log::info;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE TYPES
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutofillProfile {
    pub id: String,
    pub name: String,
    pub profile_type: ProfileType,
    pub fields: HashMap<String, FieldValue>,
    pub confidence: f32, // 0.0 - 1.0
    pub source_document: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub metadata: ProfileMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProfileType {
    Personal,
    Business,
    LoanApplication,
    Employment,
    Financial,
    Property,
    Contact,
    Generic,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldValue {
    pub value: String,
    pub field_type: FieldType,
    pub confidence: f32,
    pub validation_status: ValidationStatus,
    pub formatted_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FieldType {
    // Personal
    FirstName,
    LastName,
    MiddleName,
    FullName,
    Email,
    Phone,
    DateOfBirth,
    SSN,

    // Address
    Street,
    City,
    State,
    ZipCode,
    Country,
    FullAddress,

    // Employment
    CompanyName,
    JobTitle,
    EmploymentStatus,
    AnnualIncome,
    StartDate,

    // Financial
    BankName,
    AccountNumber,
    RoutingNumber,
    CreditScore,
    Assets,
    Liabilities,

    // Property
    PropertyAddress,
    PropertyType,
    PropertyValue,
    PurchasePrice,
    YearBuilt,

    // Loan
    LoanAmount,
    LoanType,
    LoanNumber,
    InterestRate,
    LoanTerm,

    // Other
    Generic(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ValidationStatus {
    Valid,
    Invalid,
    NeedsReview,
    NotValidated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileMetadata {
    pub extraction_method: ExtractionMethod,
    pub document_type: DocumentType,
    pub pages_processed: i32,
    pub fields_extracted: i32,
    pub validation_errors: Vec<String>,
    pub suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExtractionMethod {
    OCR,
    PDFText,
    DocxParsing,
    ExcelParsing,
    FormData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DocumentType {
    LoanApplication,
    W2Form,
    BankStatement,
    PayStub,
    TaxReturn,
    DriverLicense,
    Passport,
    UtilityBill,
    Generic,
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD MAPPING RULES
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone)]
pub struct FieldMapping {
    pub keywords: Vec<String>,
    pub field_type: FieldType,
    pub validation_regex: Option<String>,
    pub formatter: Option<fn(&str) -> String>,
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE AUTO-CREATOR SERVICE
// ═══════════════════════════════════════════════════════════════════════════

pub struct ProfileAutoCreator {
    field_mappings: Vec<FieldMapping>,
}

impl ProfileAutoCreator {
    pub fn new() -> Self {
        Self {
            field_mappings: Self::init_field_mappings(),
        }
    }

    /// Initialize field mapping rules
    fn init_field_mappings() -> Vec<FieldMapping> {
        vec![
            // Personal Information
            FieldMapping {
                keywords: vec![
                    "first name".to_string(),
                    "firstname".to_string(),
                    "given name".to_string(),
                ],
                field_type: FieldType::FirstName,
                validation_regex: Some(r"^[A-Za-z\s\-']{1,50}$".to_string()),
                formatter: Some(|s| s.trim().to_string()),
            },
            FieldMapping {
                keywords: vec![
                    "last name".to_string(),
                    "lastname".to_string(),
                    "surname".to_string(),
                    "family name".to_string(),
                ],
                field_type: FieldType::LastName,
                validation_regex: Some(r"^[A-Za-z\s\-']{1,50}$".to_string()),
                formatter: Some(|s| s.trim().to_string()),
            },
            FieldMapping {
                keywords: vec![
                    "email".to_string(),
                    "e-mail".to_string(),
                    "email address".to_string(),
                ],
                field_type: FieldType::Email,
                validation_regex: Some(r"^[^\s@]+@[^\s@]+\.[^\s@]+$".to_string()),
                formatter: Some(|s| s.trim().to_lowercase()),
            },
            FieldMapping {
                keywords: vec![
                    "phone".to_string(),
                    "telephone".to_string(),
                    "mobile".to_string(),
                    "cell".to_string(),
                ],
                field_type: FieldType::Phone,
                validation_regex: Some(r"^\+?[\d\s\-\(\)]{10,15}$".to_string()),
                formatter: Some(Self::format_phone),
            },
            FieldMapping {
                keywords: vec![
                    "ssn".to_string(),
                    "social security".to_string(),
                    "social security number".to_string(),
                ],
                field_type: FieldType::SSN,
                validation_regex: Some(r"^\d{3}-?\d{2}-?\d{4}$".to_string()),
                formatter: Some(Self::format_ssn),
            },
            // Address
            FieldMapping {
                keywords: vec![
                    "street".to_string(),
                    "address line 1".to_string(),
                    "street address".to_string(),
                ],
                field_type: FieldType::Street,
                validation_regex: None,
                formatter: Some(|s| s.trim().to_string()),
            },
            FieldMapping {
                keywords: vec!["city".to_string()],
                field_type: FieldType::City,
                validation_regex: Some(r"^[A-Za-z\s\-']{1,50}$".to_string()),
                formatter: Some(|s| s.trim().to_string()),
            },
            FieldMapping {
                keywords: vec!["state".to_string(), "province".to_string()],
                field_type: FieldType::State,
                validation_regex: Some(r"^[A-Z]{2}$".to_string()),
                formatter: Some(|s| s.trim().to_uppercase()),
            },
            FieldMapping {
                keywords: vec![
                    "zip".to_string(),
                    "zip code".to_string(),
                    "postal code".to_string(),
                ],
                field_type: FieldType::ZipCode,
                validation_regex: Some(r"^\d{5}(-\d{4})?$".to_string()),
                formatter: Some(|s| s.trim().to_string()),
            },
            // Employment
            FieldMapping {
                keywords: vec![
                    "employer".to_string(),
                    "company name".to_string(),
                    "company".to_string(),
                ],
                field_type: FieldType::CompanyName,
                validation_regex: None,
                formatter: Some(|s| s.trim().to_string()),
            },
            FieldMapping {
                keywords: vec![
                    "job title".to_string(),
                    "position".to_string(),
                    "occupation".to_string(),
                ],
                field_type: FieldType::JobTitle,
                validation_regex: None,
                formatter: Some(|s| s.trim().to_string()),
            },
            FieldMapping {
                keywords: vec![
                    "annual income".to_string(),
                    "yearly income".to_string(),
                    "salary".to_string(),
                ],
                field_type: FieldType::AnnualIncome,
                validation_regex: Some(r"^\$?\d{1,3}(,?\d{3})*(\.\d{2})?$".to_string()),
                formatter: Some(Self::format_currency),
            },
            // Financial
            FieldMapping {
                keywords: vec!["bank name".to_string(), "financial institution".to_string()],
                field_type: FieldType::BankName,
                validation_regex: None,
                formatter: Some(|s| s.trim().to_string()),
            },
            FieldMapping {
                keywords: vec!["account number".to_string(), "account #".to_string()],
                field_type: FieldType::AccountNumber,
                validation_regex: Some(r"^\d{8,17}$".to_string()),
                formatter: Some(|s| s.chars().filter(|c| c.is_numeric()).collect()),
            },
            FieldMapping {
                keywords: vec![
                    "routing number".to_string(),
                    "routing #".to_string(),
                    "aba".to_string(),
                ],
                field_type: FieldType::RoutingNumber,
                validation_regex: Some(r"^\d{9}$".to_string()),
                formatter: Some(|s| s.chars().filter(|c| c.is_numeric()).collect()),
            },
            // Property
            FieldMapping {
                keywords: vec![
                    "property address".to_string(),
                    "property location".to_string(),
                ],
                field_type: FieldType::PropertyAddress,
                validation_regex: None,
                formatter: Some(|s| s.trim().to_string()),
            },
            FieldMapping {
                keywords: vec!["property value".to_string(), "home value".to_string()],
                field_type: FieldType::PropertyValue,
                validation_regex: Some(r"^\$?\d{1,3}(,?\d{3})*(\.\d{2})?$".to_string()),
                formatter: Some(Self::format_currency),
            },
            // Loan
            FieldMapping {
                keywords: vec!["loan amount".to_string(), "principal".to_string()],
                field_type: FieldType::LoanAmount,
                validation_regex: Some(r"^\$?\d{1,3}(,?\d{3})*(\.\d{2})?$".to_string()),
                formatter: Some(Self::format_currency),
            },
            FieldMapping {
                keywords: vec!["loan number".to_string(), "loan #".to_string()],
                field_type: FieldType::LoanNumber,
                validation_regex: None,
                formatter: Some(|s| s.trim().to_string()),
            },
        ]
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PROFILE CREATION FROM EXTRACTED DATA
    // ═══════════════════════════════════════════════════════════════════════

    /// Create profile from extracted document data
    pub fn create_profile_from_data(
        &self,
        extracted_data: HashMap<String, String>,
        document_path: Option<PathBuf>,
        document_type: DocumentType,
    ) -> Result<AutofillProfile> {
        info!(
            "🤖 Creating autofill profile from extracted data ({} fields)",
            extracted_data.len()
        );

        let mut fields = HashMap::new();
        let mut total_confidence = 0.0;
        let mut validation_errors = Vec::new();
        let mut suggestions = Vec::new();

        // Map extracted data to field types
        for (key, value) in extracted_data.iter() {
            if let Some(field_mapping) = self.find_field_mapping(key) {
                // Format value
                let formatted_value = if let Some(formatter) = field_mapping.formatter {
                    formatter(value)
                } else {
                    value.clone()
                };

                // Validate
                let validation_status = if let Some(regex) = &field_mapping.validation_regex {
                    if Self::validate_with_regex(&formatted_value, regex) {
                        ValidationStatus::Valid
                    } else {
                        validation_errors.push(format!(
                            "Field '{}' failed validation: {}",
                            key, formatted_value
                        ));
                        ValidationStatus::Invalid
                    }
                } else {
                    ValidationStatus::NotValidated
                };

                // Calculate confidence
                let confidence = self.calculate_field_confidence(
                    &formatted_value,
                    &field_mapping.field_type,
                    &validation_status,
                );
                total_confidence += confidence;

                // Create field value
                let field_value = FieldValue {
                    value: value.clone(),
                    field_type: field_mapping.field_type.clone(),
                    confidence,
                    validation_status,
                    formatted_value: Some(formatted_value),
                };

                fields.insert(key.clone(), field_value);
            } else {
                // Unknown field
                suggestions.push(format!(
                    "Field '{}' could not be mapped to known field type",
                    key
                ));
            }
        }

        // Determine profile type
        let profile_type = self.detect_profile_type(&fields, &document_type);

        // Generate profile name
        let profile_name = self.generate_profile_name(&fields, &profile_type);

        // Calculate overall confidence
        let overall_confidence = if !fields.is_empty() {
            total_confidence / fields.len() as f32
        } else {
            0.0
        };

        let profile = AutofillProfile {
            id: uuid::Uuid::new_v4().to_string(),
            name: profile_name,
            profile_type,
            fields,
            confidence: overall_confidence,
            source_document: document_path.and_then(|p| p.to_str().map(|s| s.to_string())),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            metadata: ProfileMetadata {
                extraction_method: ExtractionMethod::PDFText,
                document_type,
                pages_processed: 1,
                fields_extracted: extracted_data.len() as i32,
                validation_errors,
                suggestions,
            },
        };

        info!(
            "✅ Created profile '{}' with {} fields (confidence: {:.1}%)",
            profile.name,
            profile.fields.len(),
            profile.confidence * 100.0
        );

        Ok(profile)
    }

    /// Find field mapping for key
    fn find_field_mapping(&self, key: &str) -> Option<&FieldMapping> {
        let key_lower = key.to_lowercase();
        self.field_mappings.iter().find(|mapping| {
            mapping
                .keywords
                .iter()
                .any(|keyword| key_lower.contains(&keyword.to_lowercase()))
        })
    }

    /// Validate value with regex
    fn validate_with_regex(value: &str, regex: &str) -> bool {
        regex::Regex::new(regex)
            .map(|re| re.is_match(value))
            .unwrap_or(false)
    }

    /// Calculate field confidence score
    fn calculate_field_confidence(
        &self,
        value: &str,
        field_type: &FieldType,
        validation_status: &ValidationStatus,
    ) -> f32 {
        let mut confidence: f32 = 0.5; // Base confidence

        // Validation boost
        match validation_status {
            ValidationStatus::Valid => confidence += 0.3,
            ValidationStatus::Invalid => confidence -= 0.3,
            _ => {}
        }

        // Value quality boost
        if !value.is_empty() && value.len() > 2 {
            confidence += 0.1;
        }

        // Type-specific checks
        match field_type {
            FieldType::Email => {
                if value.contains('@') && value.contains('.') {
                    confidence += 0.1;
                }
            }
            FieldType::Phone => {
                let digits: String = value.chars().filter(|c| c.is_numeric()).collect();
                if digits.len() >= 10 {
                    confidence += 0.1;
                }
            }
            _ => {}
        }

        confidence.clamp(0.0, 1.0)
    }

    /// Detect profile type from fields
    fn detect_profile_type(
        &self,
        fields: &HashMap<String, FieldValue>,
        document_type: &DocumentType,
    ) -> ProfileType {
        // Check document type first
        match document_type {
            DocumentType::LoanApplication => return ProfileType::LoanApplication,
            DocumentType::W2Form | DocumentType::PayStub => return ProfileType::Employment,
            DocumentType::BankStatement => return ProfileType::Financial,
            _ => {}
        }

        // Check field types
        let has_loan_fields = fields.values().any(|f| {
            matches!(
                f.field_type,
                FieldType::LoanAmount | FieldType::LoanNumber | FieldType::LoanType
            )
        });
        if has_loan_fields {
            return ProfileType::LoanApplication;
        }

        let has_employment_fields = fields.values().any(|f| {
            matches!(
                f.field_type,
                FieldType::CompanyName | FieldType::JobTitle | FieldType::AnnualIncome
            )
        });
        if has_employment_fields {
            return ProfileType::Employment;
        }

        let has_financial_fields = fields.values().any(|f| {
            matches!(
                f.field_type,
                FieldType::BankName | FieldType::AccountNumber | FieldType::RoutingNumber
            )
        });
        if has_financial_fields {
            return ProfileType::Financial;
        }

        ProfileType::Generic
    }

    /// Generate profile name
    fn generate_profile_name(
        &self,
        fields: &HashMap<String, FieldValue>,
        profile_type: &ProfileType,
    ) -> String {
        // Try to use first + last name
        let first_name = fields
            .iter()
            .find(|(_, v)| v.field_type == FieldType::FirstName)
            .map(|(_, v)| v.value.as_str());

        let last_name = fields
            .iter()
            .find(|(_, v)| v.field_type == FieldType::LastName)
            .map(|(_, v)| v.value.as_str());

        if let (Some(first), Some(last)) = (first_name, last_name) {
            return format!("{} {} - {:?}", first, last, profile_type);
        }

        // Fallback to profile type + timestamp
        format!(
            "{:?} Profile - {}",
            profile_type,
            Utc::now().format("%Y-%m-%d")
        )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FORMATTERS
    // ═══════════════════════════════════════════════════════════════════════

    fn format_phone(phone: &str) -> String {
        let digits: String = phone.chars().filter(|c| c.is_numeric()).collect();
        if digits.len() == 10 {
            format!("({}) {}-{}", &digits[0..3], &digits[3..6], &digits[6..10])
        } else if digits.len() == 11 && digits.starts_with('1') {
            format!(
                "+1 ({}) {}-{}",
                &digits[1..4],
                &digits[4..7],
                &digits[7..11]
            )
        } else {
            phone.to_string()
        }
    }

    fn format_ssn(ssn: &str) -> String {
        let digits: String = ssn.chars().filter(|c| c.is_numeric()).collect();
        if digits.len() == 9 {
            format!("{}-{}-{}", &digits[0..3], &digits[3..5], &digits[5..9])
        } else {
            ssn.to_string()
        }
    }

    fn format_currency(value: &str) -> String {
        let digits: String = value
            .chars()
            .filter(|c| c.is_numeric() || *c == '.')
            .collect();

        if let Ok(amount) = digits.parse::<f64>() {
            format!("${:.2}", amount)
        } else {
            value.to_string()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_creator_initialization() {
        let creator = ProfileAutoCreator::new();
        assert!(!creator.field_mappings.is_empty());
    }

    #[test]
    fn test_profile_creation() {
        let creator = ProfileAutoCreator::new();

        let mut data = HashMap::new();
        data.insert("First Name".to_string(), "John".to_string());
        data.insert("Last Name".to_string(), "Doe".to_string());
        data.insert("Email".to_string(), "john@example.com".to_string());

        let profile = creator.create_profile_from_data(data, None, DocumentType::Generic);

        assert!(profile.is_ok());
        let profile = profile.unwrap();
        assert_eq!(profile.fields.len(), 3);
    }
}
