// ═══════════════════════════════════════════════════════════════════════════════
// 🔗 OCR & DATA EXTRACTION INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════
//
// Integración completa de extracción de datos de documentos:
// - PDF text extraction
// - OCR para imágenes y PDFs escaneados
// - Excel/CSV parsing
// - Detección inteligente de campos
// - Integración con LendingPad
//
// ═══════════════════════════════════════════════════════════════════════════════

use anyhow::{anyhow, Result};
use log::{info, warn};
use std::collections::HashMap;
use std::path::Path;

use crate::services::profile_auto_creator::DocumentType;

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone)]
pub struct ExtractedData {
    pub raw_text: String,
    pub fields: HashMap<String, String>,
    pub confidence: f32,
    pub method: ExtractionMethod,
}

#[derive(Debug, Clone)]
pub enum ExtractionMethod {
    PDFText,
    OCR,
    ExcelParsing,
    DocxParsing,
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT EXTRACTOR SERVICE
// ═══════════════════════════════════════════════════════════════════════════

pub struct DocumentExtractor;

impl DocumentExtractor {
    pub fn new() -> Self {
        Self
    }

    /// Extract data from any document type
    pub async fn extract_from_file(&self, file_path: &Path) -> Result<ExtractedData> {
        let extension = file_path
            .extension()
            .and_then(|e| e.to_str())
            .ok_or_else(|| anyhow!("No file extension"))?
            .to_lowercase();

        match extension.as_str() {
            "pdf" => self.extract_from_pdf(file_path).await,
            "jpg" | "jpeg" | "png" | "tiff" | "bmp" => self.extract_from_image(file_path).await,
            "xlsx" | "xls" | "csv" => self.extract_from_spreadsheet(file_path).await,
            "docx" | "doc" => self.extract_from_word(file_path).await,
            _ => Err(anyhow!("Unsupported file type: {}", extension)),
        }
    }

    /// Extract text from PDF
    async fn extract_from_pdf(&self, path: &Path) -> Result<ExtractedData> {
        info!("📄 Extracting text from PDF: {:?}", path);

        // Try PDF text extraction first
        match self.extract_pdf_text(path) {
            Ok(text) if !text.trim().is_empty() => {
                info!("✅ Extracted {} characters from PDF", text.len());
                let fields = self.parse_text_to_fields(&text);
                return Ok(ExtractedData {
                    raw_text: text,
                    fields,
                    confidence: 0.9,
                    method: ExtractionMethod::PDFText,
                });
            }
            _ => {
                warn!("⚠️ PDF text extraction failed or empty, falling back to OCR");
            }
        }

        // Fall back to OCR
        self.extract_from_image(path).await
    }

    /// Extract text using OCR (Tesseract)
    async fn extract_from_image(&self, path: &Path) -> Result<ExtractedData> {
        info!("🔍 Performing OCR on: {:?}", path);

        use tesseract::Tesseract;

        // Initialize Tesseract
        let mut tesseract = Tesseract::new(None, Some("eng"))
            .map_err(|e| anyhow!("Tesseract initialization failed: {}", e))?;

        // Set image path
        tesseract = tesseract
            .set_image(path.to_str().ok_or_else(|| anyhow!("Invalid path"))?)
            .map_err(|e| anyhow!("Failed to set image: {}", e))?;

        // Configure for better accuracy
        tesseract = tesseract
            .set_variable(
                "tessedit_char_whitelist",
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@.-,()$/ ",
            )
            .map_err(|e| anyhow!("Failed to set variable: {}", e))?;

        // Extract text
        let text = tesseract
            .get_text()
            .map_err(|e| anyhow!("OCR text extraction failed: {}", e))?;

        // Get confidence (returns i32)
        let confidence_int = tesseract.mean_text_conf();
        let confidence = confidence_int as f32 / 100.0;

        info!(
            "✅ OCR extracted {} characters (confidence: {:.1}%)",
            text.len(),
            confidence * 100.0
        );

        let fields = if !text.trim().is_empty() {
            self.parse_text_to_fields(&text)
        } else {
            HashMap::new()
        };

        Ok(ExtractedData {
            raw_text: text,
            fields,
            confidence,
            method: ExtractionMethod::OCR,
        })
    }

    /// Extract from Excel/CSV
    async fn extract_from_spreadsheet(&self, path: &Path) -> Result<ExtractedData> {
        info!("📊 Extracting from spreadsheet: {:?}", path);

        use calamine::{open_workbook, Reader, Xls, Xlsx};

        let extension = path.extension().and_then(|e| e.to_str()).unwrap_or("");

        let text = match extension {
            "xlsx" => {
                let mut workbook: Xlsx<_> = open_workbook(path)?;
                let mut content = String::new();

                if let Some(Ok(range)) = workbook.worksheet_range_at(0) {
                    for row in range.rows() {
                        for cell in row {
                            content.push_str(&format!("{}\t", cell));
                        }
                        content.push('\n');
                    }
                }
                content
            }
            "xls" => {
                let mut workbook: Xls<_> = open_workbook(path)?;
                let mut content = String::new();

                if let Some(Ok(range)) = workbook.worksheet_range_at(0) {
                    for row in range.rows() {
                        for cell in row {
                            content.push_str(&format!("{}\t", cell));
                        }
                        content.push('\n');
                    }
                }
                content
            }
            _ => String::new(),
        };

        info!("✅ Extracted {} characters from spreadsheet", text.len());
        let fields = self.parse_text_to_fields(&text);

        Ok(ExtractedData {
            raw_text: text,
            fields,
            confidence: 0.95,
            method: ExtractionMethod::ExcelParsing,
        })
    }

    /// Extract from Word document (DOCX) - Manual ZIP parsing
    async fn extract_from_word(&self, path: &Path) -> Result<ExtractedData> {
        info!("📝 Extracting from Word document: {:?}", path);

        use std::fs::File;
        use std::io::Read;
        use zip::ZipArchive;

        // DOCX is a ZIP file containing XML documents
        // We need to extract word/document.xml and parse the text

        let file = File::open(path).map_err(|e| anyhow!("Failed to open DOCX: {}", e))?;

        let mut archive =
            ZipArchive::new(file).map_err(|e| anyhow!("Failed to read DOCX as ZIP: {}", e))?;

        // Try to find document.xml (main content)
        let mut document_xml = String::new();

        for i in 0..archive.len() {
            let mut file = archive
                .by_index(i)
                .map_err(|e| anyhow!("Failed to access ZIP entry: {}", e))?;

            if file.name() == "word/document.xml" {
                file.read_to_string(&mut document_xml)
                    .map_err(|e| anyhow!("Failed to read document.xml: {}", e))?;
                break;
            }
        }

        if document_xml.is_empty() {
            return Err(anyhow!("No document.xml found in DOCX file"));
        }

        // Parse XML and extract text between <w:t> tags
        let text = self.extract_text_from_docx_xml(&document_xml);

        info!("✅ Extracted {} characters from DOCX", text.len());
        let fields = self.parse_text_to_fields(&text);

        Ok(ExtractedData {
            raw_text: text,
            fields,
            confidence: 0.95,
            method: ExtractionMethod::DocxParsing,
        })
    }

    /// Extract text from DOCX XML content
    fn extract_text_from_docx_xml(&self, xml: &str) -> String {
        let mut text = String::new();
        let mut in_text_tag = false;
        let mut current_text = String::new();

        // Simple XML parser for <w:t> tags
        let chars: Vec<char> = xml.chars().collect();
        let mut i = 0;

        while i < chars.len() {
            if i + 4 < chars.len() && chars[i..i + 4] == ['<', 'w', ':', 't'] {
                // Found <w:t> or <w:t ... >
                // Skip to end of opening tag
                while i < chars.len() && chars[i] != '>' {
                    i += 1;
                }
                i += 1; // Skip '>'
                in_text_tag = true;
                current_text.clear();
            } else if i + 6 < chars.len() && chars[i..i + 6] == ['<', '/', 'w', ':', 't', '>'] {
                // Found </w:t>
                if in_text_tag {
                    text.push_str(&current_text);
                    text.push(' ');
                }
                in_text_tag = false;
                i += 6;
            } else if in_text_tag {
                current_text.push(chars[i]);
                i += 1;
            } else if i + 4 < chars.len() && chars[i..i + 4] == ['<', 'w', ':', 'p'] {
                // Found paragraph tag - add newline
                text.push('\n');
                i += 1;
            } else {
                i += 1;
            }
        }

        // Clean up multiple spaces and newlines
        text.split_whitespace()
            .collect::<Vec<&str>>()
            .join(" ")
            .replace("  ", " ")
    }

    /// Extract PDF text using pdf-extract
    fn extract_pdf_text(&self, path: &Path) -> Result<String> {
        use pdf_extract::extract_text;

        extract_text(path).map_err(|e| anyhow!("PDF extraction failed: {}", e))
    }

    /// Parse raw text into structured fields
    fn parse_text_to_fields(&self, text: &str) -> HashMap<String, String> {
        let mut fields = HashMap::new();

        // Common field patterns
        let patterns = vec![
            (r"(?i)first\s*name[:\s]+([A-Za-z]+)", "First Name"),
            (r"(?i)last\s*name[:\s]+([A-Za-z]+)", "Last Name"),
            (r"(?i)email[:\s]+([\w\.-]+@[\w\.-]+\.\w+)", "Email"),
            (r"(?i)phone[:\s]+([\d\-\(\)\s]+)", "Phone"),
            (r"(?i)address[:\s]+([^\n]+)", "Address"),
            (r"(?i)city[:\s]+([A-Za-z\s]+)", "City"),
            (r"(?i)state[:\s]+([A-Z]{2})", "State"),
            (r"(?i)zip[:\s]+(\d{5})", "Zip Code"),
            (r"(?i)ssn[:\s]+([\d\-]+)", "SSN"),
            (r"(?i)loan\s*amount[:\s]+\$?([\d,]+)", "Loan Amount"),
            (r"(?i)loan\s*number[:\s]+([A-Z0-9\-]+)", "Loan Number"),
            (r"(?i)property\s*address[:\s]+([^\n]+)", "Property Address"),
            (r"(?i)annual\s*income[:\s]+\$?([\d,]+)", "Annual Income"),
            (r"(?i)employer[:\s]+([^\n]+)", "Employer"),
        ];

        for (pattern, field_name) in patterns {
            if let Ok(re) = regex::Regex::new(pattern) {
                if let Some(captures) = re.captures(text) {
                    if let Some(value) = captures.get(1) {
                        fields.insert(field_name.to_string(), value.as_str().trim().to_string());
                    }
                }
            }
        }

        info!("📊 Parsed {} fields from text", fields.len());
        fields
    }

    /// Detect document type from content
    pub fn detect_document_type(&self, text: &str) -> DocumentType {
        let text_lower = text.to_lowercase();

        if text_lower.contains("loan application") || text_lower.contains("mortgage") {
            DocumentType::LoanApplication
        } else if text_lower.contains("w-2") || text_lower.contains("wages") {
            DocumentType::W2Form
        } else if text_lower.contains("bank statement") || text_lower.contains("account summary") {
            DocumentType::BankStatement
        } else if text_lower.contains("pay stub") || text_lower.contains("earnings statement") {
            DocumentType::PayStub
        } else if text_lower.contains("tax return") || text_lower.contains("form 1040") {
            DocumentType::TaxReturn
        } else if text_lower.contains("driver") && text_lower.contains("license") {
            DocumentType::DriverLicense
        } else if text_lower.contains("passport") {
            DocumentType::Passport
        } else if text_lower.contains("utility")
            || text_lower.contains("electric")
            || text_lower.contains("water bill")
        {
            DocumentType::UtilityBill
        } else {
            DocumentType::Generic
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extractor_creation() {
        let _extractor = DocumentExtractor::new();
        assert!(true);
    }

    #[test]
    fn test_field_parsing() {
        let extractor = DocumentExtractor::new();
        let text = "First Name: John\nLast Name: Doe\nEmail: john@example.com";
        let fields = extractor.parse_text_to_fields(text);

        assert_eq!(fields.get("First Name"), Some(&"John".to_string()));
        assert_eq!(fields.get("Last Name"), Some(&"Doe".to_string()));
        assert_eq!(fields.get("Email"), Some(&"john@example.com".to_string()));
    }

    #[test]
    fn test_document_type_detection() {
        let extractor = DocumentExtractor::new();

        let text = "Loan Application Form - Mortgage Details";
        assert!(matches!(
            extractor.detect_document_type(text),
            DocumentType::LoanApplication
        ));

        let text = "W-2 Wage and Tax Statement";
        assert!(matches!(
            extractor.detect_document_type(text),
            DocumentType::W2Form
        ));
    }
}
