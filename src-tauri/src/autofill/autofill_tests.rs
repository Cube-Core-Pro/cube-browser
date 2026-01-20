// src-tauri/src/autofill/autofill_tests.rs
// Comprehensive test suite for Autofill Module v2
// 15+ integration tests covering all features

#[cfg(test)]
mod autofill_tests {
    use super::super::{
        AutofillEngine, FieldDetector, FieldValidator, ProfileManager,
        FormField, FieldType, ValidationRule, AutofillProfile, FormData,
        FieldMapping, ValidationResult, DetectionResult,
    };
    use std::collections::HashMap;

    // ==================== Field Detection Tests ====================

    #[test]
    fn test_detect_name_fields() {
        let detector = FieldDetector::new();
        
        let html = r#"
            <input name="first_name" id="fname" placeholder="First Name" />
            <input name="last_name" id="lname" placeholder="Last Name" />
            <input name="full_name" id="fullname" placeholder="Full Name" />
        "#;
        
        let result = detector.detect_fields(html);
        
        assert!(result.success);
        assert!(result.fields.len() >= 3);
        
        // Verify first name detection
        let first_name_field = result.fields.iter()
            .find(|f| f.field_type == FieldType::FirstName);
        assert!(first_name_field.is_some());
        assert!(first_name_field.unwrap().confidence >= 0.8);
        
        // Verify last name detection
        let last_name_field = result.fields.iter()
            .find(|f| f.field_type == FieldType::LastName);
        assert!(last_name_field.is_some());
        
        // Verify full name detection
        let full_name_field = result.fields.iter()
            .find(|f| f.field_type == FieldType::FullName);
        assert!(full_name_field.is_some());
    }

    #[test]
    fn test_detect_email_fields() {
        let detector = FieldDetector::new();
        
        let html = r#"
            <input type="email" name="email" id="user_email" />
            <input name="email_address" placeholder="Enter email" />
            <input name="contact_email" autocomplete="email" />
        "#;
        
        let result = detector.detect_fields(html);
        
        assert!(result.success);
        let email_fields: Vec<_> = result.fields.iter()
            .filter(|f| f.field_type == FieldType::Email)
            .collect();
        
        assert!(email_fields.len() >= 2);
        
        for field in email_fields {
            assert!(field.confidence >= 0.7);
        }
    }

    #[test]
    fn test_detect_phone_fields() {
        let detector = FieldDetector::new();
        
        let html = r#"
            <input type="tel" name="phone" placeholder="Phone Number" />
            <input name="mobile" id="mobile_number" />
            <input name="telephone" placeholder="(555) 123-4567" />
        "#;
        
        let result = detector.detect_fields(html);
        
        assert!(result.success);
        let phone_fields: Vec<_> = result.fields.iter()
            .filter(|f| f.field_type == FieldType::Phone)
            .collect();
        
        assert!(phone_fields.len() >= 2);
    }

    #[test]
    fn test_detect_address_fields() {
        let detector = FieldDetector::new();
        
        let html = r#"
            <input name="street_address" placeholder="Street Address" />
            <input name="address_line2" placeholder="Apt, Suite, etc." />
            <input name="city" id="city" />
            <input name="state" id="state" />
            <input name="zip" id="postal_code" placeholder="ZIP Code" />
            <input name="country" id="country" />
        "#;
        
        let result = detector.detect_fields(html);
        
        assert!(result.success);
        assert!(result.fields.len() >= 5);
        
        // Verify address components
        let has_street = result.fields.iter().any(|f| f.field_type == FieldType::StreetAddress);
        let has_city = result.fields.iter().any(|f| f.field_type == FieldType::City);
        let has_state = result.fields.iter().any(|f| f.field_type == FieldType::State);
        let has_zip = result.fields.iter().any(|f| f.field_type == FieldType::ZipCode);
        
        assert!(has_street);
        assert!(has_city);
        assert!(has_state);
        assert!(has_zip);
    }

    #[test]
    fn test_detect_credit_card_fields() {
        let detector = FieldDetector::new();
        
        let html = r#"
            <input name="card_number" autocomplete="cc-number" maxlength="19" />
            <input name="cardholder_name" autocomplete="cc-name" />
            <input name="expiry" placeholder="MM/YY" autocomplete="cc-exp" />
            <input name="cvv" autocomplete="cc-csc" maxlength="4" />
        "#;
        
        let result = detector.detect_fields(html);
        
        assert!(result.success);
        
        let has_card_number = result.fields.iter()
            .any(|f| f.field_type == FieldType::CreditCardNumber);
        let has_cardholder = result.fields.iter()
            .any(|f| f.field_type == FieldType::CreditCardName);
        let has_expiry = result.fields.iter()
            .any(|f| f.field_type == FieldType::CreditCardExpiry);
        let has_cvv = result.fields.iter()
            .any(|f| f.field_type == FieldType::CreditCardCVV);
        
        assert!(has_card_number);
        assert!(has_cardholder);
        assert!(has_expiry);
        assert!(has_cvv);
    }

    #[test]
    fn test_detect_complex_forms() {
        let detector = FieldDetector::new();
        
        let html = r#"
            <form id="registration">
                <input name="username" required />
                <input type="email" name="email" required />
                <input type="password" name="password" required />
                <input type="password" name="confirm_password" required />
                <input name="first_name" />
                <input name="last_name" />
                <input type="date" name="dob" />
                <input type="tel" name="phone" />
                <textarea name="bio"></textarea>
                <select name="country">
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                </select>
            </form>
        "#;
        
        let result = detector.detect_fields(html);
        
        assert!(result.success);
        assert!(result.fields.len() >= 8);
        
        // Verify required fields are marked
        let required_fields: Vec<_> = result.fields.iter()
            .filter(|f| f.is_required)
            .collect();
        assert!(required_fields.len() >= 4);
    }

    // ==================== Field Validation Tests ====================

    #[test]
    fn test_validate_email() {
        let validator = FieldValidator::new();
        
        // Valid emails
        assert!(validator.validate_email("user@example.com").is_valid);
        assert!(validator.validate_email("test.user@domain.co.uk").is_valid);
        assert!(validator.validate_email("user+tag@example.com").is_valid);
        
        // Invalid emails
        assert!(!validator.validate_email("invalid").is_valid);
        assert!(!validator.validate_email("@example.com").is_valid);
        assert!(!validator.validate_email("user@").is_valid);
        assert!(!validator.validate_email("user @example.com").is_valid);
    }

    #[test]
    fn test_validate_phone() {
        let validator = FieldValidator::new();
        
        // Valid phone numbers (US format)
        assert!(validator.validate_phone("(555) 123-4567").is_valid);
        assert!(validator.validate_phone("555-123-4567").is_valid);
        assert!(validator.validate_phone("5551234567").is_valid);
        assert!(validator.validate_phone("+1 555 123 4567").is_valid);
        
        // Invalid phone numbers
        assert!(!validator.validate_phone("123").is_valid);
        assert!(!validator.validate_phone("abc-def-ghij").is_valid);
    }

    #[test]
    fn test_validate_zip_code() {
        let validator = FieldValidator::new();
        
        // Valid ZIP codes
        assert!(validator.validate_zip_code("12345").is_valid);
        assert!(validator.validate_zip_code("12345-6789").is_valid);
        
        // Invalid ZIP codes
        assert!(!validator.validate_zip_code("1234").is_valid);
        assert!(!validator.validate_zip_code("abcde").is_valid);
        assert!(!validator.validate_zip_code("12345-678").is_valid);
    }

    #[test]
    fn test_validate_credit_card() {
        let validator = FieldValidator::new();
        
        // Valid test card numbers (Luhn algorithm)
        assert!(validator.validate_credit_card("4532015112830366").is_valid); // Visa
        assert!(validator.validate_credit_card("5425233430109903").is_valid); // Mastercard
        assert!(validator.validate_credit_card("374245455400126").is_valid);  // Amex
        
        // Invalid card numbers
        assert!(!validator.validate_credit_card("1234567890123456").is_valid);
        assert!(!validator.validate_credit_card("4532-0151-1283-0366").is_valid); // With dashes
        assert!(!validator.validate_credit_card("123").is_valid);
    }

    #[test]
    fn test_validate_date_formats() {
        let validator = FieldValidator::new();
        
        // Valid dates
        assert!(validator.validate_date("2024-01-15").is_valid); // ISO format
        assert!(validator.validate_date("01/15/2024").is_valid); // US format
        assert!(validator.validate_date("15-01-2024").is_valid); // EU format
        
        // Invalid dates
        assert!(!validator.validate_date("2024-13-01").is_valid); // Invalid month
        assert!(!validator.validate_date("2024-01-32").is_valid); // Invalid day
        assert!(!validator.validate_date("invalid").is_valid);
    }

    #[test]
    fn test_validate_ssn() {
        let validator = FieldValidator::new();
        
        // Valid SSN formats
        assert!(validator.validate_ssn("123-45-6789").is_valid);
        assert!(validator.validate_ssn("123456789").is_valid);
        
        // Invalid SSN
        assert!(!validator.validate_ssn("000-00-0000").is_valid);
        assert!(!validator.validate_ssn("123-45-678").is_valid);
        assert!(!validator.validate_ssn("abc-de-fghi").is_valid);
    }

    #[test]
    fn test_custom_validation_rules() {
        let validator = FieldValidator::new();
        
        let mut rules = HashMap::new();
        rules.insert("username".to_string(), ValidationRule {
            pattern: Some(r"^[a-zA-Z0-9_]{3,20}$".to_string()),
            min_length: Some(3),
            max_length: Some(20),
            required: true,
            custom_validator: None,
        });
        
        // Valid username
        let result = validator.validate_field("username", "john_doe", &rules);
        assert!(result.is_valid);
        
        // Invalid usernames
        let result = validator.validate_field("username", "ab", &rules); // Too short
        assert!(!result.is_valid);
        
        let result = validator.validate_field("username", "user@name", &rules); // Invalid char
        assert!(!result.is_valid);
    }

    // ==================== Profile Management Tests ====================

    #[test]
    fn test_create_profile() {
        let mut manager = ProfileManager::new();
        
        let mut profile_data = HashMap::new();
        profile_data.insert("first_name".to_string(), "John".to_string());
        profile_data.insert("last_name".to_string(), "Doe".to_string());
        profile_data.insert("email".to_string(), "john.doe@example.com".to_string());
        profile_data.insert("phone".to_string(), "(555) 123-4567".to_string());
        
        let result = manager.create_profile("personal", profile_data);
        
        assert!(result.success);
        assert_eq!(result.profile_id, Some("personal".to_string()));
    }

    #[test]
    fn test_update_profile() {
        let mut manager = ProfileManager::new();
        
        // Create initial profile
        let mut profile_data = HashMap::new();
        profile_data.insert("first_name".to_string(), "John".to_string());
        profile_data.insert("email".to_string(), "john@example.com".to_string());
        
        manager.create_profile("test", profile_data.clone());
        
        // Update profile
        profile_data.insert("phone".to_string(), "(555) 123-4567".to_string());
        let result = manager.update_profile("test", profile_data);
        
        assert!(result.success);
        
        // Verify update
        let profile = manager.get_profile("test");
        assert!(profile.is_some());
        assert_eq!(profile.unwrap().data.get("phone").unwrap(), "(555) 123-4567");
    }

    #[test]
    fn test_delete_profile() {
        let mut manager = ProfileManager::new();
        
        let profile_data = HashMap::new();
        manager.create_profile("to_delete", profile_data);
        
        let result = manager.delete_profile("to_delete");
        assert!(result.success);
        
        let profile = manager.get_profile("to_delete");
        assert!(profile.is_none());
    }

    #[test]
    fn test_list_profiles() {
        let mut manager = ProfileManager::new();
        
        // Create multiple profiles
        manager.create_profile("personal", HashMap::new());
        manager.create_profile("work", HashMap::new());
        manager.create_profile("test", HashMap::new());
        
        let profiles = manager.list_profiles();
        
        assert!(profiles.len() >= 3);
        assert!(profiles.contains(&"personal".to_string()));
        assert!(profiles.contains(&"work".to_string()));
        assert!(profiles.contains(&"test".to_string()));
    }

    #[test]
    fn test_profile_encryption() {
        let manager = ProfileManager::new();
        
        let sensitive_data = "4532015112830366"; // Credit card number
        
        let encrypted = manager.encrypt_field(sensitive_data);
        assert_ne!(encrypted, sensitive_data);
        
        let decrypted = manager.decrypt_field(&encrypted);
        assert_eq!(decrypted, sensitive_data);
    }

    // ==================== Autofill Engine Tests ====================

    #[test]
    fn test_autofill_simple_form() {
        let mut engine = AutofillEngine::new();
        
        let mut profile_data = HashMap::new();
        profile_data.insert("first_name".to_string(), "John".to_string());
        profile_data.insert("last_name".to_string(), "Doe".to_string());
        profile_data.insert("email".to_string(), "john.doe@example.com".to_string());
        
        let html = r#"
            <input name="first_name" id="fname" />
            <input name="last_name" id="lname" />
            <input type="email" name="email" id="email" />
        "#;
        
        let result = engine.autofill_form(html, &profile_data);
        
        assert!(result.success);
        assert!(result.filled_fields >= 3);
        assert!(result.mapping.len() >= 3);
    }

    #[test]
    fn test_autofill_partial_match() {
        let mut engine = AutofillEngine::new();
        
        let mut profile_data = HashMap::new();
        profile_data.insert("first_name".to_string(), "John".to_string());
        profile_data.insert("email".to_string(), "john@example.com".to_string());
        
        let html = r#"
            <input name="first_name" />
            <input name="last_name" />
            <input name="email" />
            <input name="phone" />
        "#;
        
        let result = engine.autofill_form(html, &profile_data);
        
        assert!(result.success);
        assert_eq!(result.filled_fields, 2); // Only first_name and email
        assert_eq!(result.unfilled_fields, 2); // last_name and phone
    }

    #[test]
    fn test_autofill_with_formatting() {
        let mut engine = AutofillEngine::new();
        
        let mut profile_data = HashMap::new();
        profile_data.insert("phone".to_string(), "5551234567".to_string());
        profile_data.insert("zip".to_string(), "12345".to_string());
        
        let html = r#"
            <input name="phone" placeholder="(555) 123-4567" />
            <input name="zip" placeholder="12345-6789" />
        "#;
        
        let result = engine.autofill_form(html, &profile_data);
        
        assert!(result.success);
        
        // Verify formatted values
        let phone_mapping = result.mapping.iter()
            .find(|m| m.field_name == "phone");
        assert!(phone_mapping.is_some());
        assert!(phone_mapping.unwrap().filled_value.contains("(555)"));
    }

    #[test]
    fn test_autofill_address_fields() {
        let mut engine = AutofillEngine::new();
        
        let mut profile_data = HashMap::new();
        profile_data.insert("street_address".to_string(), "123 Main St".to_string());
        profile_data.insert("city".to_string(), "Springfield".to_string());
        profile_data.insert("state".to_string(), "IL".to_string());
        profile_data.insert("zip".to_string(), "62701".to_string());
        profile_data.insert("country".to_string(), "US".to_string());
        
        let html = r#"
            <input name="street_address" />
            <input name="city" />
            <input name="state" />
            <input name="zip" />
            <input name="country" />
        "#;
        
        let result = engine.autofill_form(html, &profile_data);
        
        assert!(result.success);
        assert_eq!(result.filled_fields, 5);
    }

    #[test]
    fn test_smart_field_mapping() {
        let mut engine = AutofillEngine::new();
        
        let mut profile_data = HashMap::new();
        profile_data.insert("full_name".to_string(), "John Doe".to_string());
        
        // Form expects first_name and last_name separately
        let html = r#"
            <input name="first_name" />
            <input name="last_name" />
        "#;
        
        let result = engine.autofill_form(html, &profile_data);
        
        assert!(result.success);
        
        // Engine should split full_name into first_name and last_name
        let first_name = result.mapping.iter()
            .find(|m| m.field_name == "first_name");
        let last_name = result.mapping.iter()
            .find(|m| m.field_name == "last_name");
        
        assert!(first_name.is_some());
        assert!(last_name.is_some());
        assert_eq!(first_name.unwrap().filled_value, "John");
        assert_eq!(last_name.unwrap().filled_value, "Doe");
    }

    #[test]
    fn test_autofill_with_validation() {
        let mut engine = AutofillEngine::new();
        
        let mut profile_data = HashMap::new();
        profile_data.insert("email".to_string(), "invalid-email".to_string());
        profile_data.insert("phone".to_string(), "123".to_string());
        
        let html = r#"
            <input type="email" name="email" required />
            <input type="tel" name="phone" pattern="[0-9]{10}" required />
        "#;
        
        let result = engine.autofill_form(html, &profile_data);
        
        // Should detect validation errors
        assert!(!result.success || result.validation_errors > 0);
    }

    // ==================== Integration Tests ====================

    #[test]
    fn test_end_to_end_autofill_workflow() {
        // 1. Create profile
        let mut manager = ProfileManager::new();
        let mut profile_data = HashMap::new();
        profile_data.insert("first_name".to_string(), "Jane".to_string());
        profile_data.insert("last_name".to_string(), "Smith".to_string());
        profile_data.insert("email".to_string(), "jane.smith@example.com".to_string());
        profile_data.insert("phone".to_string(), "(555) 987-6543".to_string());
        
        manager.create_profile("jane_profile", profile_data.clone());
        
        // 2. Detect form fields
        let detector = FieldDetector::new();
        let html = r#"
            <form id="contact">
                <input name="first_name" required />
                <input name="last_name" required />
                <input type="email" name="email" required />
                <input type="tel" name="phone" />
            </form>
        "#;
        
        let detection = detector.detect_fields(html);
        assert!(detection.success);
        
        // 3. Validate profile data
        let validator = FieldValidator::new();
        let email_valid = validator.validate_email(profile_data.get("email").unwrap());
        let phone_valid = validator.validate_phone(profile_data.get("phone").unwrap());
        
        assert!(email_valid.is_valid);
        assert!(phone_valid.is_valid);
        
        // 4. Autofill form
        let mut engine = AutofillEngine::new();
        let result = engine.autofill_form(html, &profile_data);
        
        assert!(result.success);
        assert_eq!(result.filled_fields, 4);
        assert_eq!(result.validation_errors, 0);
    }

    #[test]
    fn test_multi_profile_management() {
        let mut manager = ProfileManager::new();
        
        // Create multiple profiles
        let mut personal = HashMap::new();
        personal.insert("email".to_string(), "personal@example.com".to_string());
        manager.create_profile("personal", personal);
        
        let mut work = HashMap::new();
        work.insert("email".to_string(), "work@company.com".to_string());
        manager.create_profile("work", work);
        
        let mut test = HashMap::new();
        test.insert("email".to_string(), "test@example.com".to_string());
        manager.create_profile("test", test);
        
        // Verify all profiles exist
        let profiles = manager.list_profiles();
        assert_eq!(profiles.len(), 3);
        
        // Verify profile data
        let personal_profile = manager.get_profile("personal").unwrap();
        assert_eq!(personal_profile.data.get("email").unwrap(), "personal@example.com");
        
        let work_profile = manager.get_profile("work").unwrap();
        assert_eq!(work_profile.data.get("email").unwrap(), "work@company.com");
    }

    #[test]
    fn test_field_confidence_scoring() {
        let detector = FieldDetector::new();
        
        // High confidence - explicit type and name
        let html_high = r#"<input type="email" name="email" id="user_email" />"#;
        let result_high = detector.detect_fields(html_high);
        let field_high = &result_high.fields[0];
        assert!(field_high.confidence >= 0.9);
        
        // Medium confidence - only name attribute
        let html_medium = r#"<input name="email_address" />"#;
        let result_medium = detector.detect_fields(html_medium);
        let field_medium = &result_medium.fields[0];
        assert!(field_medium.confidence >= 0.6 && field_medium.confidence < 0.9);
        
        // Lower confidence - only placeholder
        let html_low = r#"<input placeholder="Enter email" />"#;
        let result_low = detector.detect_fields(html_low);
        if !result_low.fields.is_empty() {
            let field_low = &result_low.fields[0];
            assert!(field_low.confidence < 0.7);
        }
    }

    #[test]
    fn test_form_field_grouping() {
        let detector = FieldDetector::new();
        
        let html = r#"
            <fieldset id="personal_info">
                <input name="first_name" />
                <input name="last_name" />
                <input name="email" />
            </fieldset>
            <fieldset id="address_info">
                <input name="street" />
                <input name="city" />
                <input name="zip" />
            </fieldset>
        "#;
        
        let result = detector.detect_fields(html);
        
        assert!(result.success);
        assert!(result.fields.len() >= 6);
        
        // Verify fields can be grouped by section
        let personal_fields: Vec<_> = result.fields.iter()
            .filter(|f| matches!(f.field_type, 
                FieldType::FirstName | FieldType::LastName | FieldType::Email))
            .collect();
        assert_eq!(personal_fields.len(), 3);
        
        let address_fields: Vec<_> = result.fields.iter()
            .filter(|f| matches!(f.field_type, 
                FieldType::StreetAddress | FieldType::City | FieldType::ZipCode))
            .collect();
        assert_eq!(address_fields.len(), 3);
    }

    // ==================== Performance Tests ====================

    #[test]
    fn test_large_form_detection_performance() {
        let detector = FieldDetector::new();
        
        // Generate large form with 100 fields
        let mut html = String::from("<form>");
        for i in 0..100 {
            html.push_str(&format!(
                r#"<input name="field_{}" id="field_{}" placeholder="Field {}" />"#,
                i, i, i
            ));
        }
        html.push_str("</form>");
        
        let start = std::time::Instant::now();
        let result = detector.detect_fields(&html);
        let duration = start.elapsed();
        
        assert!(result.success);
        assert!(duration.as_millis() < 1000); // Should complete in under 1 second
    }

    #[test]
    fn test_concurrent_autofill_operations() {
        use std::sync::{Arc, Mutex};
        use std::thread;
        
        let manager = Arc::new(Mutex::new(ProfileManager::new()));
        let mut handles = vec![];
        
        // Create 10 profiles concurrently
        for i in 0..10 {
            let manager_clone = Arc::clone(&manager);
            let handle = thread::spawn(move || {
                let mut profile_data = HashMap::new();
                profile_data.insert("email".to_string(), format!("user{}@example.com", i));
                
                let mut mgr = manager_clone.lock().unwrap();
                mgr.create_profile(&format!("profile_{}", i), profile_data);
            });
            handles.push(handle);
        }
        
        // Wait for all threads
        for handle in handles {
            handle.join().unwrap();
        }
        
        // Verify all profiles created
        let mgr = manager.lock().unwrap();
        let profiles = mgr.list_profiles();
        assert_eq!(profiles.len(), 10);
    }
}
