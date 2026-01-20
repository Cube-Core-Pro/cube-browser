// ═══════════════════════════════════════════════════════════════════════════════
// 📋 Document Validator v1.0 - Enhanced Validation with HTML Detection
// Ported from TypeScript to Rust for CUBE Elite Browser
// ═══════════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use log::{info, warn, error};
use std::collections::HashMap;
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationTest {
    pub name: String,
    pub passed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub confidence: u8,
    pub format: String,
    pub detected_format: Option<String>,
    pub size: usize,
    pub tests: Vec<ValidationTest>,
    pub reason: String,
}

pub struct DocumentValidator {
    // Configuration can be added here if needed
}

impl DocumentValidator {
    pub fn new_sync() -> Result<Self> {
        info!("DocumentValidator initialized (sync)");
        Ok(Self {})
    }

    pub async fn new() -> Result<Self> {
        info!("DocumentValidator initialized");
        Ok(Self {})
    }

    pub async fn shutdown(&mut self) -> Result<()> {
        info!("DocumentValidator shutdown");
        Ok(())
    }

    /// Validates a downloaded document against the expected format
    /// Includes enhanced HTML and error page detection
    pub async fn validate_document(
        &self,
        bytes: &[u8],
        expected_format: &str,
    ) -> Result<ValidationResult> {
        let size = bytes.len();
        info!("[Validator] Validating {}, size: {} bytes", expected_format, size);

        let mut result = ValidationResult {
            valid: false,
            confidence: 0,
            format: expected_format.to_string(),
            detected_format: None,
            size,
            tests: Vec::new(),
            reason: String::new(),
        };

        // ═══════════════════════════════════════════════════════════════════════════
        // Test 1: Minimum Size
        // ═══════════════════════════════════════════════════════════════════════════

        let min_sizes: HashMap<&str, usize> = [
            ("pdf", 2048),
            ("xlsx", 2048),
            ("docx", 2048),
            ("csv", 100),
            ("json", 10),
            ("txt", 1),
        ].iter().cloned().collect();

        let min_size = min_sizes.get(expected_format).unwrap_or(&512);

        if size < *min_size {
            result.reason = format!("File too small: {} bytes (minimum: {})", size, min_size);
            result.tests.push(ValidationTest {
                name: "size".to_string(),
                passed: false,
                details: None,
            });
            warn!("[Validator] ❌ Size check failed: {} < {}", size, min_size);
            return Ok(result);
        }

        result.tests.push(ValidationTest {
            name: "size".to_string(),
            passed: true,
            details: None,
        });
        result.confidence += 10;
        info!("[Validator] ✅ Size check passed");

        // ═══════════════════════════════════════════════════════════════════════════
        // Test 2: Magic Bytes Detection
        // ═══════════════════════════════════════════════════════════════════════════

        let magic_bytes: HashMap<&str, Vec<Vec<u8>>> = [
            ("pdf", vec![vec![0x25, 0x50, 0x44, 0x46]]), // %PDF
            ("xlsx", vec![vec![0x50, 0x4B, 0x03, 0x04]]), // ZIP (PK)
            ("docx", vec![vec![0x50, 0x4B, 0x03, 0x04]]), // ZIP (PK)
            ("pptx", vec![vec![0x50, 0x4B, 0x03, 0x04]]), // ZIP (PK)
            ("png", vec![vec![0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]]), // PNG
            ("jpg", vec![vec![0xFF, 0xD8, 0xFF]]), // JPEG
            ("gif", vec![vec![0x47, 0x49, 0x46, 0x38]]), // GIF
            ("zip", vec![vec![0x50, 0x4B, 0x03, 0x04]]), // ZIP
            ("rar", vec![vec![0x52, 0x61, 0x72, 0x21]]), // RAR
        ].iter().map(|(k, v)| (*k, v.clone())).collect();

        if let Some(magic_patterns) = magic_bytes.get(expected_format) {
            let mut magic_found = false;
            for magic in magic_patterns {
                if Self::match_bytes(bytes, magic, 0) {
                    magic_found = true;
                    break;
                }
            }

            result.tests.push(ValidationTest {
                name: "magic-bytes".to_string(),
                passed: magic_found,
                details: Some(if magic_found {
                    "Magic bytes match".to_string()
                } else {
                    "Magic bytes mismatch".to_string()
                }),
            });

            if magic_found {
                result.confidence += 40;
                info!("[Validator] ✅ Magic bytes match for {}", expected_format);
            } else {
                warn!("[Validator] ⚠️ Magic bytes mismatch for {}", expected_format);
            }
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // Test 3: HTML Detection - ENHANCED
        // ═══════════════════════════════════════════════════════════════════════════

        let html_patterns: Vec<Vec<u8>> = vec![
            vec![0x3C, 0x21, 0x44, 0x4F, 0x43, 0x54, 0x59, 0x50, 0x45], // <!DOCTYPE
            vec![0x3C, 0x68, 0x74, 0x6D, 0x6C], // <html
            vec![0x3C, 0x48, 0x54, 0x4D, 0x4C], // <HTML
            vec![0x3C, 0x3F, 0x78, 0x6D, 0x6C], // <?xml
            vec![0x3C, 0x62, 0x6F, 0x64, 0x79], // <body
            vec![0x3C, 0x42, 0x4F, 0x44, 0x59], // <BODY
            vec![0x3C, 0x68, 0x65, 0x61, 0x64], // <head
            vec![0x3C, 0x48, 0x45, 0x41, 0x44], // <HEAD
        ];

        let mut is_html = false;
        let search_area = std::cmp::min(8192, size);

        for pattern in &html_patterns {
            if Self::search_bytes(bytes, pattern, 0, search_area) {
                is_html = true;
                warn!("[Validator] ⚠️ HTML pattern detected");
                break;
            }
        }

        // Detect common error pages
        let error_keywords = vec![
            "Error 404",
            "Page Not Found",
            "page not found",
            "Access Denied",
            "access denied",
            "Login Required",
            "login required",
            "Sign in",
            "sign in",
            "Authentication Required",
            "File not found",
            "file not found",
            "Permission denied",
            "Forbidden",
            "403 Forbidden",
            "401 Unauthorized",
            "500 Internal Server Error",
            "Service Unavailable",
            "Bad Gateway",
            "Gateway Timeout",
        ];

        let text = String::from_utf8_lossy(&bytes[..search_area]);

        for keyword in &error_keywords {
            if text.contains(keyword) {
                is_html = true;
                result.reason = format!("Error page detected: \"{}\"", keyword);
                warn!("[Validator] ❌ Error page detected: \"{}\"", keyword);
                break;
            }
        }

        // Detect Cloudflare and other proxies
        let proxy_keywords = vec![
            "Cloudflare",
            "cloudflare",
            "Just a moment...",
            "Checking your browser",
            "Ray ID:",
            "cf-ray",
        ];

        for keyword in &proxy_keywords {
            if text.contains(keyword) {
                is_html = true;
                if result.reason.is_empty() {
                    result.reason = format!("Proxy/Security page detected: \"{}\"", keyword);
                }
                warn!("[Validator] ❌ Proxy page detected: \"{}\"", keyword);
                break;
            }
        }

        if is_html {
            result.detected_format = Some("html".to_string());
            if result.reason.is_empty() {
                result.reason = "HTML content detected - expected binary document".to_string();
            }
            result.tests.push(ValidationTest {
                name: "html-detection".to_string(),
                passed: false,
                details: None,
            });
            error!("[Validator] ❌ HTML rejection: {}", result.reason);
            return Ok(result);
        }

        result.tests.push(ValidationTest {
            name: "html-detection".to_string(),
            passed: true,
            details: None,
        });
        result.confidence += 20;
        info!("[Validator] ✅ No HTML detected");

        // ═══════════════════════════════════════════════════════════════════════════
        // Test 4: Format-Specific Validation
        // ═══════════════════════════════════════════════════════════════════════════

        match expected_format {
            "pdf" => {
                // PDF EOF marker
                let eof_marker = vec![0x25, 0x25, 0x45, 0x4F, 0x46]; // %%EOF
                let has_eof = Self::search_bytes(
                    bytes,
                    &eof_marker,
                    size.saturating_sub(1024),
                    size,
                );

                result.tests.push(ValidationTest {
                    name: "pdf-eof".to_string(),
                    passed: has_eof,
                    details: Some(if has_eof {
                        "EOF marker found".to_string()
                    } else {
                        "EOF marker not found".to_string()
                    }),
                });

                if has_eof {
                    result.confidence += 20;
                    info!("[Validator] ✅ PDF EOF marker found");
                } else {
                    warn!("[Validator] ⚠️ PDF EOF marker not found");
                }

                // PDF keywords
                let keywords = ["/Type", "/Catalog", "/Pages", "/Root", "/Info"];
                let found_keywords: Vec<&str> = keywords
                    .iter()
                    .filter(|kw| text.contains(*kw))
                    .copied()
                    .collect();

                result.tests.push(ValidationTest {
                    name: "pdf-keywords".to_string(),
                    passed: found_keywords.len() >= 2,
                    details: Some(format!(
                        "{}/{} keywords found: {}",
                        found_keywords.len(),
                        keywords.len(),
                        found_keywords.join(", ")
                    )),
                });

                if found_keywords.len() >= 2 {
                    result.confidence += 10;
                    info!("[Validator] ✅ PDF keywords: {}", found_keywords.join(", "));
                } else {
                    warn!("[Validator] ⚠️ Insufficient PDF keywords");
                }
            }
            "xlsx" | "docx" | "pptx" => {
                // ZIP-based Office formats
                let office_keywords: HashMap<&str, Vec<&str>> = [
                    ("xlsx", vec!["xl/workbook.xml", "xl/worksheets", "xl/sharedStrings"]),
                    ("docx", vec!["word/document.xml", "word/_rels"]),
                    ("pptx", vec!["ppt/presentation.xml", "ppt/slides"]),
                ]
                .iter()
                .cloned()
                .collect();

                if let Some(keywords) = office_keywords.get(expected_format) {
                    let found_keywords: Vec<&str> = keywords
                        .iter()
                        .filter(|kw| text.contains(*kw))
                        .copied()
                        .collect();

                    result.tests.push(ValidationTest {
                        name: "office-structure".to_string(),
                        passed: !found_keywords.is_empty(),
                        details: Some(format!(
                            "{}/{} Office structures found",
                            found_keywords.len(),
                            keywords.len()
                        )),
                    });

                    if !found_keywords.is_empty() {
                        result.confidence += 15;
                        info!("[Validator] ✅ Office format structure detected");
                    }
                }
            }
            "csv" => {
                // CSV validation - check for delimiters
                let lines: Vec<&str> = text.lines().take(10).collect();
                let has_commas = lines.iter().any(|line| line.contains(','));
                let has_semicolons = lines.iter().any(|line| line.contains(';'));
                let has_tabs = lines.iter().any(|line| line.contains('\t'));

                let has_delimiters = has_commas || has_semicolons || has_tabs;

                let delimiters: Vec<&str> = vec![
                    if has_commas { Some("comma") } else { None },
                    if has_semicolons { Some("semicolon") } else { None },
                    if has_tabs { Some("tab") } else { None },
                ]
                .into_iter()
                .flatten()
                .collect();

                result.tests.push(ValidationTest {
                    name: "csv-delimiters".to_string(),
                    passed: has_delimiters,
                    details: Some(format!(
                        "Delimiters found: {}",
                        if delimiters.is_empty() {
                            "none".to_string()
                        } else {
                            delimiters.join(", ")
                        }
                    )),
                });

                if has_delimiters {
                    result.confidence += 30;
                    info!("[Validator] ✅ CSV delimiters detected");
                }
            }
            _ => {}
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // Final Decision
        // ═══════════════════════════════════════════════════════════════════════════

        result.valid = result.confidence >= 70;

        if !result.valid && result.reason.is_empty() {
            result.reason = format!("Low confidence: {}% (minimum: 70%)", result.confidence);
        }

        if result.valid {
            info!("[Validator] ✅ VALID - Confidence: {}%", result.confidence);
        } else {
            error!(
                "[Validator] ❌ INVALID - {} (Confidence: {}%)",
                result.reason, result.confidence
            );
        }

        Ok(result)
    }

    /// Checks if bytes match a pattern at a specific offset
    fn match_bytes(bytes: &[u8], pattern: &[u8], offset: usize) -> bool {
        if offset + pattern.len() > bytes.len() {
            return false;
        }
        bytes[offset..offset + pattern.len()] == *pattern
    }

    /// Searches for a byte pattern in a range
    fn search_bytes(bytes: &[u8], pattern: &[u8], start_offset: usize, end_offset: usize) -> bool {
        if pattern.is_empty() {
            return false;
        }

        let end = std::cmp::min(end_offset, bytes.len());
        if start_offset >= end || start_offset + pattern.len() > end {
            return false;
        }

        for i in start_offset..=(end - pattern.len()) {
            if Self::match_bytes(bytes, pattern, i) {
                return true;
            }
        }
        false
    }

    /// Gets a human-readable summary of validation results
    pub fn get_validation_summary(result: &ValidationResult) -> String {
        let mut lines = vec![
            format!("Format: {}", result.format),
            format!("Size: {} bytes", result.size),
            format!("Valid: {}", if result.valid { "✅" } else { "❌" }),
            format!("Confidence: {}%", result.confidence),
        ];

        if let Some(ref detected) = result.detected_format {
            lines.push(format!("Detected: {}", detected));
        }

        if !result.reason.is_empty() {
            lines.push(format!("Reason: {}", result.reason));
        }

        lines.push("\nTests:".to_string());

        for test in &result.tests {
            let status = if test.passed { "✅" } else { "❌" };
            let details = if let Some(ref d) = test.details {
                format!(" - {}", d)
            } else {
                String::new()
            };
            lines.push(format!("  {} {}{}", status, test.name, details));
        }

        lines.join("\n")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_pdf_validation() {
        let validator = DocumentValidator::new().await.unwrap();
        
        // Valid PDF header
        let mut pdf_bytes = vec![0x25, 0x50, 0x44, 0x46, 0x2D]; // %PDF-
        pdf_bytes.extend_from_slice(b"1.4\n");
        pdf_bytes.extend(vec![0; 3000]); // Padding
        pdf_bytes.extend_from_slice(b"%%EOF");

        let result = validator.validate_document(&pdf_bytes, "pdf").await.unwrap();
        assert!(result.valid, "PDF should be valid");
        assert!(result.confidence >= 70);
    }

    #[tokio::test]
    async fn test_html_rejection() {
        let validator = DocumentValidator::new().await.unwrap();
        
        let html_bytes = b"<!DOCTYPE html><html><body>Error 404</body></html>";
        let result = validator.validate_document(html_bytes, "pdf").await.unwrap();
        
        assert!(!result.valid, "HTML should be rejected");
        assert_eq!(result.detected_format, Some("html".to_string()));
    }

    #[tokio::test]
    async fn test_size_rejection() {
        let validator = DocumentValidator::new().await.unwrap();
        
        let small_bytes = vec![0x25, 0x50, 0x44, 0x46]; // Too small
        let result = validator.validate_document(&small_bytes, "pdf").await.unwrap();
        
        assert!(!result.valid, "Small file should be rejected");
        assert!(result.reason.contains("too small"));
    }
}
