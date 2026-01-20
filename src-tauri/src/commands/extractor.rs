// Data Extractor System - Backend Commands
// Web scraping, selector generation, AI analysis, export

use crate::services::browser_service::BrowserService;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// TYPES (matching TypeScript frontend)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SelectorType {
    Css,
    Xpath,
    Text,
    Attribute,
    Smart,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SelectorStrategy {
    Single,
    Multiple,
    Table,
    List,
    Nested,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Selector {
    pub id: String,
    #[serde(rename = "type")]
    pub selector_type: SelectorType,
    pub value: String,
    pub strategy: SelectorStrategy,
    pub label: String,
    pub description: Option<String>,
    pub confidence: Option<f32>,
    pub fallback: Option<Box<Selector>>,
    pub validation: Option<SelectorValidation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectorValidation {
    pub required: bool,
    #[serde(rename = "minMatches")]
    pub min_matches: Option<u32>,
    #[serde(rename = "maxMatches")]
    pub max_matches: Option<u32>,
    pub pattern: Option<String>,
    #[serde(rename = "dataType")]
    pub data_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionField {
    pub id: String,
    pub name: String,
    pub selector: Selector,
    pub transform: Option<Vec<DataTransform>>,
    pub validation: Option<FieldValidation>,
    pub children: Option<Vec<ExtractionField>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionSchema {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub url: String,
    pub fields: Vec<ExtractionField>,
    pub pagination: Option<PaginationConfig>,
    pub schedule: Option<ScheduleConfig>,
    pub created: String,
    pub modified: String,
    pub version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginationConfig {
    pub enabled: bool,
    #[serde(rename = "type")]
    pub pagination_type: String,
    pub selector: Option<String>,
    #[serde(rename = "urlPattern")]
    pub url_pattern: Option<String>,
    #[serde(rename = "maxPages")]
    pub max_pages: Option<u32>,
    #[serde(rename = "stopCondition")]
    pub stop_condition: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduleConfig {
    pub enabled: bool,
    pub frequency: String,
    #[serde(rename = "cronExpression")]
    pub cron_expression: Option<String>,
    pub timezone: Option<String>,
    pub notifications: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TransformType {
    Trim,
    Lowercase,
    Uppercase,
    Replace,
    Extract,
    ParseNumber,
    ParseDate,
    Split,
    Join,
    Format,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataTransform {
    #[serde(rename = "type")]
    pub transform_type: TransformType,
    pub params: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldValidation {
    pub required: bool,
    #[serde(rename = "minLength")]
    pub min_length: Option<usize>,
    #[serde(rename = "maxLength")]
    pub max_length: Option<usize>,
    pub pattern: Option<String>,
    pub custom: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionResult {
    pub schema: String,
    #[serde(rename = "extractedAt")]
    pub extracted_at: String,
    pub url: String,
    pub data: Vec<ExtractedData>,
    pub stats: ExtractionStats,
    pub warnings: Option<Vec<String>>,
}

pub type ExtractedData = HashMap<String, serde_json::Value>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionStats {
    #[serde(rename = "totalRecords")]
    pub total_records: usize,
    #[serde(rename = "totalFields")]
    pub total_fields: usize,
    #[serde(rename = "pagesProcessed")]
    pub pages_processed: u32,
    pub duration: u64,
    #[serde(rename = "successRate")]
    pub success_rate: f32,
    #[serde(rename = "failedFields")]
    pub failed_fields: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectorSuggestion {
    pub selector: Selector,
    pub reasoning: String,
    pub examples: Vec<String>,
    pub alternatives: Vec<Selector>,
    pub score: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIAnalysis {
    #[serde(rename = "pageType")]
    pub page_type: String,
    pub structure: PageStructure,
    pub suggestions: Vec<SelectorSuggestion>,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageStructure {
    #[serde(rename = "hasTable")]
    pub has_table: bool,
    #[serde(rename = "hasList")]
    pub has_list: bool,
    #[serde(rename = "hasForm")]
    pub has_form: bool,
    #[serde(rename = "hasPagination")]
    pub has_pagination: bool,
    #[serde(rename = "repeatingElements")]
    pub repeating_elements: Vec<RepeatingElement>,
    #[serde(rename = "semanticBlocks")]
    pub semantic_blocks: Vec<SemanticBlock>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepeatingElement {
    pub selector: String,
    pub count: u32,
    pub fields: Vec<String>,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticBlock {
    #[serde(rename = "type")]
    pub block_type: String,
    pub selector: String,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportConfig {
    pub format: ExportFormat,
    pub filename: Option<String>,
    #[serde(rename = "includeHeaders")]
    pub include_headers: Option<bool>,
    pub delimiter: Option<String>,
    #[serde(rename = "sheetName")]
    pub sheet_name: Option<String>,
    #[serde(rename = "tableName")]
    pub table_name: Option<String>,
    pub pretty: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    Json,
    Csv,
    Excel,
    Xml,
    Sql,
}

// ============================================================================
// STATE
// ============================================================================

pub struct ExtractorState {
    pub schemas: Arc<Mutex<HashMap<String, ExtractionSchema>>>,
}

impl ExtractorState {
    pub fn new() -> Self {
        Self {
            schemas: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

// ============================================================================
// STORAGE
// ============================================================================

use std::fs;
use std::path::PathBuf;
use std::io::Write;

fn get_schemas_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let schemas_dir = home
        .join(".cube_omnifill")
        .join("extractor")
        .join("schemas");

    if !schemas_dir.exists() {
        fs::create_dir_all(&schemas_dir)
            .map_err(|e| format!("Failed to create schemas directory: {}", e))?;
    }

    Ok(schemas_dir)
}

fn save_schema_to_disk(schema: &ExtractionSchema) -> Result<(), String> {
    let schemas_dir = get_schemas_dir()?;
    let file_path = schemas_dir.join(format!("{}.json", schema.id));

    let json = serde_json::to_string_pretty(schema)
        .map_err(|e| format!("Failed to serialize schema: {}", e))?;

    fs::write(&file_path, json).map_err(|e| format!("Failed to write schema file: {}", e))?;

    Ok(())
}

fn load_schemas_from_disk() -> Result<Vec<ExtractionSchema>, String> {
    let schemas_dir = get_schemas_dir()?;
    let mut schemas = Vec::new();

    if !schemas_dir.exists() {
        return Ok(schemas);
    }

    let entries = fs::read_dir(&schemas_dir)
        .map_err(|e| format!("Failed to read schemas directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read schema file: {}", e))?;

            let schema: ExtractionSchema = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse schema: {}", e))?;

            schemas.push(schema);
        }
    }

    Ok(schemas)
}

fn delete_schema_from_disk(schema_id: &str) -> Result<(), String> {
    let schemas_dir = get_schemas_dir()?;
    let file_path = schemas_dir.join(format!("{}.json", schema_id));

    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| format!("Failed to delete schema file: {}", e))?;
    }

    Ok(())
}

// ============================================================================
// EXTRACTION ENGINE
// ============================================================================

async fn extract_with_schema(
    schema: &ExtractionSchema,
    browser: Option<&BrowserService>,
    tab_id: Option<&str>,
) -> Result<ExtractionResult, String> {
    let start_time = std::time::Instant::now();
    let mut data: Vec<ExtractedData> = Vec::new();
    let mut warnings: Vec<String> = Vec::new();
    let mut failed_fields: Vec<String> = Vec::new();

    // Try to use real browser if available
    if let (Some(browser), Some(tab_id)) = (browser, tab_id) {
        // Navigate to URL
        browser
            .navigate(tab_id, &schema.url)
            .map_err(|e| format!("Failed to navigate: {}", e))?;

        // Wait for page to load
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

        let mut record = HashMap::new();
        for field in &schema.fields {
            match extract_field_with_browser(browser, tab_id, field).await {
                Ok(value) => {
                    // Apply transformations if specified
                    let transformed = if let Some(transforms) = &field.transform {
                        apply_transforms(value, transforms)?
                    } else {
                        value
                    };
                    record.insert(field.name.clone(), transformed);
                }
                Err(e) => {
                    warnings.push(format!("Failed to extract field '{}': {}", field.name, e));

                    // Try fallback selector if available
                    if let Some(fallback) = &field.selector.fallback {
                        warnings.push(format!("Trying fallback selector for '{}'", field.name));
                        
                        // Create a temporary field with the fallback selector
                        let fallback_field = ExtractionField {
                            id: field.id.clone(),
                            name: field.name.clone(),
                            selector: (**fallback).clone(),
                            transform: field.transform.clone(),
                            validation: field.validation.clone(),
                            children: field.children.clone(),
                        };
                        
                        match extract_field_with_browser(browser, tab_id, &fallback_field).await {
                            Ok(fallback_value) => {
                                // Apply transformations to fallback result
                                let transformed = if let Some(transforms) = &field.transform {
                                    apply_transforms(fallback_value, transforms)?
                                } else {
                                    fallback_value
                                };
                                record.insert(field.name.clone(), transformed);
                                warnings.push(format!("Fallback selector succeeded for '{}'", field.name));
                            }
                            Err(fallback_err) => {
                                warnings.push(format!("Fallback selector also failed for '{}': {}", field.name, fallback_err));
                                failed_fields.push(field.name.clone());
                            }
                        }
                    } else {
                        failed_fields.push(field.name.clone());
                    }
                }
            }
        }
        data.push(record);
    } else {
        // Fallback to mock data if browser not available
        let mut record = HashMap::new();
        for field in &schema.fields {
            let value = match field.selector.strategy {
                SelectorStrategy::Single => serde_json::json!("mock_extracted_value"),
                SelectorStrategy::Multiple => serde_json::json!(["mock1", "mock2", "mock3"]),
                SelectorStrategy::Table => serde_json::json!([
                    {"col1": "mock_val1", "col2": "mock_val2"},
                    {"col1": "mock_val3", "col2": "mock_val4"}
                ]),
                _ => serde_json::json!("mock_data"),
            };
            record.insert(field.name.clone(), value);
        }
        data.push(record);
        warnings.push("Using mock data - browser not available".to_string());
    }

    let duration = start_time.elapsed().as_millis() as u64;
    let success_rate = if schema.fields.is_empty() {
        0.0
    } else {
        ((schema.fields.len() - failed_fields.len()) as f32 / schema.fields.len() as f32) * 100.0
    };

    let total_records = data.len();

    Ok(ExtractionResult {
        schema: schema.name.clone(),
        extracted_at: chrono::Utc::now().to_rfc3339(),
        url: schema.url.clone(),
        data,
        stats: ExtractionStats {
            total_records,
            total_fields: schema.fields.len(),
            pages_processed: 1,
            duration,
            success_rate,
            failed_fields,
        },
        warnings: if warnings.is_empty() {
            None
        } else {
            Some(warnings)
        },
    })
}

fn extract_field_with_browser<'a>(
    browser: &'a BrowserService,
    tab_id: &'a str,
    field: &'a ExtractionField,
) -> std::pin::Pin<
    Box<dyn std::future::Future<Output = Result<serde_json::Value, String>> + Send + 'a>,
> {
    Box::pin(async move {
        match field.selector.strategy {
            SelectorStrategy::Single => {
                // Extract single element
                let text = browser
                    .get_text(tab_id, &field.selector.value)
                    .map_err(|e| format!("Selector error: {}", e))?;
                Ok(serde_json::json!(text))
            }
            SelectorStrategy::Multiple => {
                // Extract multiple elements
                let elements = browser
                    .find_elements(tab_id, &field.selector.value)
                    .map_err(|e| format!("Selector error: {}", e))?;

                let mut values = Vec::new();
                for element_selector in elements {
                    if let Ok(text) = browser.get_text(tab_id, &element_selector) {
                        values.push(text);
                    }
                }
                Ok(serde_json::json!(values))
            }
            SelectorStrategy::Table => {
                // Extract table data using JavaScript
                let script = format!(
                    r#"
                    (function() {{
                        const table = document.querySelector('{}');
                        if (!table) return [];
                        
                        const rows = Array.from(table.querySelectorAll('tr'));
                        const headers = Array.from(rows[0]?.querySelectorAll('th, td') || [])
                            .map(h => h.textContent.trim());
                        
                        return rows.slice(1).map(row => {{
                            const cells = Array.from(row.querySelectorAll('td'));
                            const obj = {{}};
                            cells.forEach((cell, i) => {{
                                obj[headers[i] || `col${{i}}`] = cell.textContent.trim();
                            }});
                            return obj;
                        }});
                    }})()
                "#,
                    field.selector.value
                );

                browser
                    .evaluate(tab_id, &script)
                    .map_err(|e| format!("Table extraction error: {}", e))
            }
            SelectorStrategy::List => {
                // Extract list items
                let elements = browser
                    .find_elements(tab_id, &field.selector.value)
                    .map_err(|e| format!("List selector error: {}", e))?;

                let mut items = Vec::new();
                for element_selector in elements {
                    if let Ok(text) = browser.get_text(tab_id, &element_selector) {
                        items.push(text);
                    }
                }
                Ok(serde_json::json!(items))
            }
            SelectorStrategy::Nested => {
                // Extract nested structure
                if let Some(children) = &field.children {
                    let mut nested_data = HashMap::new();
                    for child in children {
                        match extract_field_with_browser(browser, tab_id, child).await {
                            Ok(value) => {
                                nested_data.insert(child.name.clone(), value);
                            }
                            Err(e) => {
                                return Err(format!("Nested field '{}' failed: {}", child.name, e));
                            }
                        }
                    }
                    Ok(serde_json::json!(nested_data))
                } else {
                    Err("Nested strategy requires children fields".to_string())
                }
            }
        }
    })
}

fn apply_transforms(
    value: serde_json::Value,
    transforms: &[DataTransform],
) -> Result<serde_json::Value, String> {
    let mut result = value;

    for transform in transforms {
        result = match transform.transform_type {
            TransformType::Trim => {
                if let Some(s) = result.as_str() {
                    serde_json::json!(s.trim())
                } else {
                    result
                }
            }
            TransformType::Lowercase => {
                if let Some(s) = result.as_str() {
                    serde_json::json!(s.to_lowercase())
                } else {
                    result
                }
            }
            TransformType::Uppercase => {
                if let Some(s) = result.as_str() {
                    serde_json::json!(s.to_uppercase())
                } else {
                    result
                }
            }
            TransformType::Replace => {
                if let Some(s) = result.as_str() {
                    let params = transform.params.as_ref();
                    let pattern = params
                        .and_then(|p| p.get("pattern"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    let replacement = params
                        .and_then(|p| p.get("replacement"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    let use_regex = params
                        .and_then(|p| p.get("regex"))
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);

                    if use_regex {
                        if let Ok(re) = regex::Regex::new(pattern) {
                            serde_json::json!(re.replace_all(s, replacement).to_string())
                        } else {
                            serde_json::json!(s.replace(pattern, replacement))
                        }
                    } else {
                        serde_json::json!(s.replace(pattern, replacement))
                    }
                } else {
                    result
                }
            }
            TransformType::Extract => {
                if let Some(s) = result.as_str() {
                    let params = transform.params.as_ref();
                    let pattern = params
                        .and_then(|p| p.get("pattern"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("(.*)");
                    let group = params
                        .and_then(|p| p.get("group"))
                        .and_then(|v| v.as_u64())
                        .unwrap_or(1) as usize;

                    if let Ok(re) = regex::Regex::new(pattern) {
                        if let Some(caps) = re.captures(s) {
                            if let Some(m) = caps.get(group) {
                                serde_json::json!(m.as_str())
                            } else {
                                result
                            }
                        } else {
                            result
                        }
                    } else {
                        result
                    }
                } else {
                    result
                }
            }
            TransformType::ParseNumber => {
                if let Some(s) = result.as_str() {
                    // Remove common non-numeric characters except decimal point and negative sign
                    let cleaned: String = s
                        .chars()
                        .filter(|c| c.is_ascii_digit() || *c == '.' || *c == '-')
                        .collect();
                    
                    if cleaned.contains('.') {
                        if let Ok(f) = cleaned.parse::<f64>() {
                            serde_json::json!(f)
                        } else {
                            result
                        }
                    } else if let Ok(i) = cleaned.parse::<i64>() {
                        serde_json::json!(i)
                    } else {
                        result
                    }
                } else {
                    result
                }
            }
            TransformType::ParseDate => {
                if let Some(s) = result.as_str() {
                    let params = transform.params.as_ref();
                    let input_format = params
                        .and_then(|p| p.get("inputFormat"))
                        .and_then(|v| v.as_str());
                    let output_format = params
                        .and_then(|p| p.get("outputFormat"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("%Y-%m-%d");

                    // Try common date formats if no input format specified
                    let formats = if let Some(fmt) = input_format {
                        vec![fmt]
                    } else {
                        vec![
                            "%Y-%m-%d",
                            "%m/%d/%Y",
                            "%d/%m/%Y",
                            "%Y/%m/%d",
                            "%B %d, %Y",
                            "%b %d, %Y",
                            "%d %B %Y",
                            "%d %b %Y",
                            "%m-%d-%Y",
                            "%d-%m-%Y",
                        ]
                    };

                    for fmt in formats {
                        if let Ok(dt) = chrono::NaiveDate::parse_from_str(s.trim(), fmt) {
                            return Ok(serde_json::json!(dt.format(output_format).to_string()));
                        }
                    }
                    result
                } else {
                    result
                }
            }
            TransformType::Split => {
                if let Some(s) = result.as_str() {
                    let params = transform.params.as_ref();
                    let delimiter = params
                        .and_then(|p| p.get("delimiter"))
                        .and_then(|v| v.as_str())
                        .unwrap_or(",");
                    let trim = params
                        .and_then(|p| p.get("trim"))
                        .and_then(|v| v.as_bool())
                        .unwrap_or(true);

                    let parts: Vec<&str> = s.split(delimiter).collect();
                    let parts: Vec<String> = if trim {
                        parts.iter().map(|p| p.trim().to_string()).collect()
                    } else {
                        parts.iter().map(|p| p.to_string()).collect()
                    };
                    serde_json::json!(parts)
                } else {
                    result
                }
            }
            TransformType::Join => {
                if let Some(arr) = result.as_array() {
                    let params = transform.params.as_ref();
                    let delimiter = params
                        .and_then(|p| p.get("delimiter"))
                        .and_then(|v| v.as_str())
                        .unwrap_or(", ");

                    let strings: Vec<String> = arr
                        .iter()
                        .filter_map(|v| {
                            if let Some(s) = v.as_str() {
                                Some(s.to_string())
                            } else {
                                Some(v.to_string())
                            }
                        })
                        .collect();
                    serde_json::json!(strings.join(delimiter))
                } else {
                    result
                }
            }
            TransformType::Format => {
                let params = transform.params.as_ref();
                let template = params
                    .and_then(|p| p.get("template"))
                    .and_then(|v| v.as_str())
                    .unwrap_or("{value}");

                let value_str = if let Some(s) = result.as_str() {
                    s.to_string()
                } else {
                    result.to_string()
                };

                serde_json::json!(template.replace("{value}", &value_str))
            }
        };
    }

    Ok(result)
}

// ============================================================================
// AI SELECTOR SUGGESTIONS
// ============================================================================

async fn generate_selector_suggestions(
    element: serde_json::Value,
) -> Result<Vec<SelectorSuggestion>, String> {
    // Extract element information
    let tag = element.get("tagName").and_then(|v| v.as_str()).unwrap_or("div");
    let id = element.get("id").and_then(|v| v.as_str()).unwrap_or("");
    let classes = element.get("classes").and_then(|v| v.as_str()).unwrap_or("");
    let text = element.get("text").and_then(|v| v.as_str()).unwrap_or("");
    let _html = element.get("html").and_then(|v| v.as_str()).unwrap_or(""); // Reserved for future XPath generation
    
    let mut suggestions = Vec::new();
    let timestamp = chrono::Utc::now().timestamp_millis();

    // 1. ID selector (highest priority if available)
    if !id.is_empty() {
        suggestions.push(SelectorSuggestion {
            selector: Selector {
                id: format!("suggestion_id_{}", timestamp),
                selector_type: SelectorType::Css,
                value: format!("#{}", id),
                strategy: SelectorStrategy::Single,
                label: "ID Selector".to_string(),
                description: Some("Most reliable - uses unique element ID".to_string()),
                confidence: Some(0.98),
                fallback: None,
                validation: None,
            },
            reasoning: "ID selectors are unique and most reliable for element selection".to_string(),
            examples: vec![format!("document.querySelector('#{}')", id)],
            alternatives: vec![],
            score: 98,
        });
    }

    // 2. Data attribute selector
    let data_attrs: Vec<(&str, &serde_json::Value)> = element
        .as_object()
        .map(|obj| {
            obj.iter()
                .filter(|(k, _)| k.starts_with("data-"))
                .map(|(k, v)| (k.as_str(), v))
                .collect()
        })
        .unwrap_or_default();

    for (attr, value) in data_attrs {
        if let Some(v) = value.as_str() {
            suggestions.push(SelectorSuggestion {
                selector: Selector {
                    id: format!("suggestion_data_{}", timestamp),
                    selector_type: SelectorType::Css,
                    value: format!("[{}=\"{}\"]", attr, v),
                    strategy: SelectorStrategy::Single,
                    label: "Data Attribute Selector".to_string(),
                    description: Some("Uses data attribute - stable for dynamic apps".to_string()),
                    confidence: Some(0.92),
                    fallback: None,
                    validation: None,
                },
                reasoning: "Data attributes are often used specifically for automation and testing".to_string(),
                examples: vec![format!("document.querySelector('[{}=\"{}\"]')", attr, v)],
                alternatives: vec![],
                score: 92,
            });
        }
    }

    // 3. Class-based selector
    if !classes.is_empty() {
        let class_list: Vec<&str> = classes.split_whitespace().collect();
        if !class_list.is_empty() {
            // Use most specific class combination
            let class_selector = class_list
                .iter()
                .filter(|c| !c.contains("active") && !c.contains("hover") && !c.contains("ng-"))
                .take(2)
                .map(|c| format!(".{}", c))
                .collect::<Vec<_>>()
                .join("");

            if !class_selector.is_empty() {
                suggestions.push(SelectorSuggestion {
                    selector: Selector {
                        id: format!("suggestion_class_{}", timestamp),
                        selector_type: SelectorType::Css,
                        value: format!("{}{}", tag.to_lowercase(), class_selector),
                        strategy: SelectorStrategy::Single,
                        label: "Class Selector".to_string(),
                        description: Some("Combines tag and class for specificity".to_string()),
                        confidence: Some(0.85),
                        fallback: None,
                        validation: None,
                    },
                    reasoning: "Class selectors provide good balance of specificity and maintainability".to_string(),
                    examples: vec![format!("document.querySelector('{}{}')", tag.to_lowercase(), class_selector)],
                    alternatives: vec![],
                    score: 85,
                });
            }
        }
    }

    // 4. Text-based XPath selector
    if !text.is_empty() && text.len() < 50 {
        let clean_text = text.trim();
        suggestions.push(SelectorSuggestion {
            selector: Selector {
                id: format!("suggestion_xpath_{}", timestamp),
                selector_type: SelectorType::Xpath,
                value: format!("//{}[contains(text(),'{}')]", tag.to_lowercase(), clean_text),
                strategy: SelectorStrategy::Single,
                label: "XPath Text Selector".to_string(),
                description: Some("Finds element by visible text content".to_string()),
                confidence: Some(0.75),
                fallback: None,
                validation: None,
            },
            reasoning: "Text-based selectors are readable and work well for static content".to_string(),
            examples: vec![format!("document.evaluate(\"//{}[contains(text(),'{}')]\", ...)", tag.to_lowercase(), clean_text)],
            alternatives: vec![],
            score: 75,
        });
    }

    // 5. Aria label selector (accessibility-based)
    if let Some(aria_label) = element.get("aria-label").and_then(|v| v.as_str()) {
        suggestions.push(SelectorSuggestion {
            selector: Selector {
                id: format!("suggestion_aria_{}", timestamp),
                selector_type: SelectorType::Css,
                value: format!("[aria-label=\"{}\"]", aria_label),
                strategy: SelectorStrategy::Single,
                label: "Aria Label Selector".to_string(),
                description: Some("Uses accessibility attribute - stable and semantic".to_string()),
                confidence: Some(0.90),
                fallback: None,
                validation: None,
            },
            reasoning: "Aria labels are semantic and stable across UI changes".to_string(),
            examples: vec![format!("document.querySelector('[aria-label=\"{}\"]')", aria_label)],
            alternatives: vec![],
            score: 90,
        });
    }

    // 6. Try to use OpenAI for smarter suggestions if API key is available
    if let Ok(api_key) = std::env::var("OPENAI_API_KEY") {
        if let Ok(ai_suggestions) = generate_ai_selector_suggestions(&element, &api_key).await {
            for suggestion in ai_suggestions {
                suggestions.push(suggestion);
            }
        }
    }

    // Sort by score descending
    suggestions.sort_by(|a, b| b.score.cmp(&a.score));

    Ok(suggestions)
}

/// Generate AI-powered selector suggestions using OpenAI
async fn generate_ai_selector_suggestions(
    element: &serde_json::Value,
    api_key: &str,
) -> Result<Vec<SelectorSuggestion>, String> {
    let prompt = format!(
        r#"Analyze this HTML element and suggest the best CSS/XPath selectors for automated testing and scraping.

Element data:
{}

Provide 2-3 selector suggestions in JSON format:
[
  {{
    "selector": "the CSS or XPath selector",
    "type": "css" or "xpath",
    "confidence": 0.0-1.0,
    "reasoning": "why this selector is good"
  }}
]

Focus on:
1. Stability across page changes
2. Uniqueness
3. Readability
4. Best practices for web scraping"#,
        serde_json::to_string_pretty(element).unwrap_or_default()
    );

    let client = reqwest::Client::new();
    let request_body = serde_json::json!({
        "model": "gpt-4-turbo-preview",
        "messages": [
            {
                "role": "system",
                "content": "You are an expert in web scraping and DOM selectors. Provide practical, stable selectors."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.3,
        "max_tokens": 1000,
        "response_format": { "type": "json_object" }
    });

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("OpenAI API error: {}", e))?;

    if !response.status().is_success() {
        return Err("OpenAI API request failed".to_string());
    }

    let response_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let content = response_json
        .get("choices")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .ok_or("Invalid response format")?;

    let ai_suggestions: serde_json::Value = serde_json::from_str(content)
        .map_err(|_| "Failed to parse AI suggestions")?;

    let mut suggestions = Vec::new();
    let timestamp = chrono::Utc::now().timestamp_millis();

    if let Some(arr) = ai_suggestions.as_array() {
        for (i, item) in arr.iter().enumerate() {
            let selector_value = item.get("selector").and_then(|v| v.as_str()).unwrap_or("");
            let selector_type_str = item.get("type").and_then(|v| v.as_str()).unwrap_or("css");
            let confidence = item.get("confidence").and_then(|v| v.as_f64()).unwrap_or(0.8) as f32;
            let reasoning = item.get("reasoning").and_then(|v| v.as_str()).unwrap_or("");

            let selector_type = match selector_type_str {
                "xpath" => SelectorType::Xpath,
                _ => SelectorType::Css,
            };

            suggestions.push(SelectorSuggestion {
                selector: Selector {
                    id: format!("ai_suggestion_{}_{}", timestamp, i),
                    selector_type,
                    value: selector_value.to_string(),
                    strategy: SelectorStrategy::Single,
                    label: "AI Suggested Selector".to_string(),
                    description: Some(reasoning.to_string()),
                    confidence: Some(confidence),
                    fallback: None,
                    validation: None,
                },
                reasoning: reasoning.to_string(),
                examples: vec![],
                alternatives: vec![],
                score: (confidence * 100.0) as u32,
            });
        }
    }

    Ok(suggestions)
}

// ============================================================================
// EXPORT
// ============================================================================

fn export_data(
    data: &[ExtractedData],
    config: &ExportConfig,
    file_path: &str,
) -> Result<(), String> {
    match config.format {
        ExportFormat::Json => export_json(data, config, file_path),
        ExportFormat::Csv => export_csv(data, config, file_path),
        ExportFormat::Excel => export_excel(data, config, file_path),
        ExportFormat::Xml => export_xml(data, config, file_path),
        ExportFormat::Sql => export_sql(data, config, file_path),
    }
}

fn export_json(
    data: &[ExtractedData],
    config: &ExportConfig,
    file_path: &str,
) -> Result<(), String> {
    let json = if config.pretty.unwrap_or(true) {
        serde_json::to_string_pretty(data)
    } else {
        serde_json::to_string(data)
    }
    .map_err(|e| format!("Failed to serialize data: {}", e))?;

    fs::write(file_path, json).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

fn export_csv(
    data: &[ExtractedData],
    config: &ExportConfig,
    file_path: &str,
) -> Result<(), String> {
    if data.is_empty() {
        return Err("No data to export".to_string());
    }

    let mut csv = String::new();
    let first_record = &data[0];
    let headers: Vec<String> = first_record.keys().cloned().collect();

    // Write headers
    if config.include_headers.unwrap_or(true) {
        csv.push_str(&headers.join(config.delimiter.as_deref().unwrap_or(",")));
        csv.push('\n');
    }

    // Write data
    for record in data {
        let values: Vec<String> = headers
            .iter()
            .map(|key| {
                record
                    .get(key)
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string()
            })
            .collect();
        csv.push_str(&values.join(config.delimiter.as_deref().unwrap_or(",")));
        csv.push('\n');
    }

    fs::write(file_path, csv).map_err(|e| format!("Failed to write CSV file: {}", e))?;

    Ok(())
}

fn export_excel(
    data: &[ExtractedData],
    config: &ExportConfig,
    file_path: &str,
) -> Result<(), String> {
    // Export as XLSX-compatible XML (SpreadsheetML)
    // This creates a file that Excel can open directly
    if data.is_empty() {
        return Err("No data to export".to_string());
    }

    let first_record = &data[0];
    let headers: Vec<String> = first_record.keys().cloned().collect();
    let table_name = config.table_name.as_deref().unwrap_or("Sheet1");

    let mut xml = String::new();
    xml.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    xml.push_str("<?mso-application progid=\"Excel.Sheet\"?>\n");
    xml.push_str("<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\"\n");
    xml.push_str(" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\">\n");
    xml.push_str(&format!("<Worksheet ss:Name=\"{}\">\n", escape_xml(table_name)));
    xml.push_str("<Table>\n");

    // Header row
    if config.include_headers.unwrap_or(true) {
        xml.push_str("<Row>\n");
        for header in &headers {
            xml.push_str(&format!(
                "<Cell><Data ss:Type=\"String\">{}</Data></Cell>\n",
                escape_xml(header)
            ));
        }
        xml.push_str("</Row>\n");
    }

    // Data rows
    for record in data {
        xml.push_str("<Row>\n");
        for header in &headers {
            let value = record
                .get(header)
                .and_then(|v| v.as_str())
                .unwrap_or("");
            
            // Detect numeric values
            let (data_type, formatted_value) = if value.parse::<f64>().is_ok() {
                ("Number", value.to_string())
            } else {
                ("String", escape_xml(value))
            };
            
            xml.push_str(&format!(
                "<Cell><Data ss:Type=\"{}\">{}</Data></Cell>\n",
                data_type, formatted_value
            ));
        }
        xml.push_str("</Row>\n");
    }

    xml.push_str("</Table>\n");
    xml.push_str("</Worksheet>\n");
    xml.push_str("</Workbook>");

    // Write with .xls extension hint for Excel compatibility
    let final_path = if !file_path.ends_with(".xls") && !file_path.ends_with(".xlsx") {
        format!("{}.xls", file_path)
    } else {
        file_path.to_string()
    };

    fs::write(&final_path, xml).map_err(|e| format!("Failed to write Excel file: {}", e))?;

    Ok(())
}

fn export_xml(
    data: &[ExtractedData],
    config: &ExportConfig,
    file_path: &str,
) -> Result<(), String> {
    if data.is_empty() {
        return Err("No data to export".to_string());
    }

    let root_element = config.table_name.as_deref().unwrap_or("data");
    let pretty = config.pretty.unwrap_or(true);
    let indent = if pretty { "  " } else { "" };
    let newline = if pretty { "\n" } else { "" };

    let mut xml = String::new();
    xml.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    xml.push_str(newline);
    xml.push_str(&format!("<{}>", root_element));
    xml.push_str(newline);

    for (idx, record) in data.iter().enumerate() {
        xml.push_str(&format!("{}<record id=\"{}\">", indent, idx + 1));
        xml.push_str(newline);
        
        for (key, value) in record.iter() {
            let str_value = match value {
                serde_json::Value::String(s) => s.clone(),
                serde_json::Value::Number(n) => n.to_string(),
                serde_json::Value::Bool(b) => b.to_string(),
                serde_json::Value::Null => String::new(),
                _ => value.to_string(),
            };
            
            xml.push_str(&format!(
                "{}{}<{}>{}</{}>",
                indent, indent,
                escape_xml_tag(key),
                escape_xml(&str_value),
                escape_xml_tag(key)
            ));
            xml.push_str(newline);
        }
        
        xml.push_str(&format!("{}</record>", indent));
        xml.push_str(newline);
    }

    xml.push_str(&format!("</{}>", root_element));

    fs::write(file_path, xml).map_err(|e| format!("Failed to write XML file: {}", e))?;

    Ok(())
}

fn export_sql(
    data: &[ExtractedData],
    config: &ExportConfig,
    file_path: &str,
) -> Result<(), String> {
    if data.is_empty() {
        return Err("No data to export".to_string());
    }

    let first_record = &data[0];
    let headers: Vec<String> = first_record.keys().cloned().collect();
    let table_name = config.table_name.as_deref().unwrap_or("extracted_data");

    let mut sql = String::new();
    
    // Create table statement
    sql.push_str(&format!("-- Auto-generated SQL export from CUBE Extractor\n"));
    sql.push_str(&format!("-- Generated: {}\n\n", chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")));
    
    sql.push_str(&format!("CREATE TABLE IF NOT EXISTS {} (\n", escape_sql_identifier(table_name)));
    sql.push_str("  id INTEGER PRIMARY KEY AUTOINCREMENT,\n");
    
    for (idx, header) in headers.iter().enumerate() {
        let column_name = escape_sql_identifier(header);
        let comma = if idx < headers.len() - 1 { "," } else { "" };
        sql.push_str(&format!("  {} TEXT{}\n", column_name, comma));
    }
    sql.push_str(");\n\n");

    // Insert statements
    for record in data {
        let columns: Vec<String> = headers.iter().map(|h| escape_sql_identifier(h)).collect();
        let values: Vec<String> = headers
            .iter()
            .map(|key| {
                let value = record
                    .get(key)
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                format!("'{}'", escape_sql_string(value))
            })
            .collect();

        sql.push_str(&format!(
            "INSERT INTO {} ({}) VALUES ({});\n",
            escape_sql_identifier(table_name),
            columns.join(", "),
            values.join(", ")
        ));
    }

    fs::write(file_path, sql).map_err(|e| format!("Failed to write SQL file: {}", e))?;

    Ok(())
}

// XML escape helpers
fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

fn escape_xml_tag(s: &str) -> String {
    // XML tag names must start with letter or underscore, contain only letters, digits, hyphens, underscores, periods
    let mut result = String::new();
    for (i, c) in s.chars().enumerate() {
        if i == 0 {
            if c.is_ascii_alphabetic() || c == '_' {
                result.push(c);
            } else {
                result.push('_');
                if c.is_ascii_alphanumeric() {
                    result.push(c);
                }
            }
        } else if c.is_ascii_alphanumeric() || c == '_' || c == '-' || c == '.' {
            result.push(c);
        } else {
            result.push('_');
        }
    }
    if result.is_empty() {
        result = "field".to_string();
    }
    result
}

// SQL escape helpers
fn escape_sql_identifier(s: &str) -> String {
    // Convert to snake_case and remove invalid characters
    let mut result = String::new();
    for c in s.chars() {
        if c.is_ascii_alphanumeric() {
            result.push(c.to_ascii_lowercase());
        } else if c == ' ' || c == '-' {
            result.push('_');
        }
    }
    if result.is_empty() || result.chars().next().unwrap().is_ascii_digit() {
        result = format!("col_{}", result);
    }
    result
}

fn escape_sql_string(s: &str) -> String {
    s.replace('\'', "''")
}

// ============================================================================
// COMMANDS
// ============================================================================

#[tauri::command]
pub async fn extractor_load_schemas(
    state: State<'_, ExtractorState>,
) -> Result<Vec<ExtractionSchema>, String> {
    let schemas = load_schemas_from_disk()?;

    // Update in-memory state
    {
        let mut schemas_map = state.schemas.lock().unwrap();
        schemas_map.clear();
        for schema in schemas.iter() {
            schemas_map.insert(schema.id.clone(), schema.clone());
        }
    }

    Ok(schemas)
}

#[tauri::command]
pub async fn extractor_save_schema(
    schema: ExtractionSchema,
    state: State<'_, ExtractorState>,
) -> Result<String, String> {
    // Save to disk
    save_schema_to_disk(&schema)?;

    // Update in-memory state
    {
        let mut schemas = state.schemas.lock().unwrap();
        schemas.insert(schema.id.clone(), schema.clone());
    }

    Ok(schema.id)
}

#[tauri::command]
pub async fn extractor_delete_schema(
    schema_id: String,
    state: State<'_, ExtractorState>,
) -> Result<(), String> {
    // Delete from disk
    delete_schema_from_disk(&schema_id)?;

    // Remove from in-memory state
    {
        let mut schemas = state.schemas.lock().unwrap();
        schemas.remove(&schema_id);
    }

    Ok(())
}

#[tauri::command]
pub async fn extractor_preview(
    schema: ExtractionSchema,
    browser: State<'_, Arc<BrowserService>>,
) -> Result<Vec<ExtractedData>, String> {
    // Create a temporary tab for preview
    let tab_id = browser
        .new_tab()
        .map_err(|e| format!("Failed to create browser tab: {}", e))?;

    let result = extract_with_schema(&schema, Some(&browser), Some(&tab_id)).await?;

    // Cleanup tab
    let _ = browser.close_tab(&tab_id);

    Ok(result.data)
}

#[tauri::command]
pub async fn extractor_extract(
    schema: ExtractionSchema,
    browser: State<'_, Arc<BrowserService>>,
) -> Result<ExtractionResult, String> {
    // Create a tab for extraction
    let tab_id = browser
        .new_tab()
        .map_err(|e| format!("Failed to create browser tab: {}", e))?;

    let result = extract_with_schema(&schema, Some(&browser), Some(&tab_id)).await?;

    // Cleanup tab
    let _ = browser.close_tab(&tab_id);

    Ok(result)
}

#[tauri::command]
pub async fn extractor_suggest_selectors(
    element: serde_json::Value,
) -> Result<Vec<SelectorSuggestion>, String> {
    generate_selector_suggestions(element).await
}

#[tauri::command]
pub async fn extractor_analyze_page(
    url: String,
    browser: State<'_, Arc<BrowserService>>,
) -> Result<AIAnalysis, String> {
    // Create tab and navigate
    let tab_id = browser
        .new_tab()
        .map_err(|e| format!("Failed to create browser tab: {}", e))?;

    browser
        .navigate(&tab_id, &url)
        .map_err(|e| format!("Failed to navigate: {}", e))?;

    // Wait for page to load
    tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;

    // Analyze page structure using JavaScript
    let analysis_script = r#"
        (function() {
            const analysis = {
                has_table: document.querySelectorAll('table').length > 0,
                has_list: document.querySelectorAll('ul, ol').length > 0,
                has_form: document.querySelectorAll('form').length > 0,
                has_pagination: document.querySelectorAll('[class*="paginat"], [class*="next"], [class*="prev"]').length > 0,
                repeating_elements: [],
                semantic_blocks: []
            };
            
            // Find repeating elements (common class patterns)
            const allElements = document.querySelectorAll('*[class]');
            const classCounts = {};
            allElements.forEach(el => {
                const classes = Array.from(el.classList);
                classes.forEach(cls => {
                    classCounts[cls] = (classCounts[cls] || 0) + 1;
                });
            });
            
            // Find classes that appear multiple times (potential repeating patterns)
            Object.entries(classCounts)
                .filter(([_, count]) => count >= 3 && count <= 100)
                .slice(0, 5)
                .forEach(([cls, count]) => {
                    analysis.repeating_elements.push({
                        selector: '.' + cls,
                        count: count
                    });
                });
            
            // Detect semantic blocks
            ['article', 'section', 'main', 'aside', 'nav', 'header', 'footer'].forEach(tag => {
                const elements = document.querySelectorAll(tag);
                if (elements.length > 0) {
                    analysis.semantic_blocks.push({
                        tag: tag,
                        count: elements.length
                    });
                }
            });
            
            return analysis;
        })()
    "#;

    let structure_data = browser
        .evaluate(&tab_id, analysis_script)
        .map_err(|e| format!("Failed to analyze page: {}", e))?;

    // Parse the structure
    let has_table = structure_data["has_table"].as_bool().unwrap_or(false);
    let has_list = structure_data["has_list"].as_bool().unwrap_or(false);
    let has_form = structure_data["has_form"].as_bool().unwrap_or(false);
    let has_pagination = structure_data["has_pagination"].as_bool().unwrap_or(false);

    let repeating_elements: Vec<RepeatingElement> = structure_data["repeating_elements"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|item| {
            Some(RepeatingElement {
                selector: item["selector"].as_str()?.to_string(),
                count: item["count"].as_u64()? as u32,
                fields: vec![],
                confidence: 0.8,
            })
        })
        .collect();

    let semantic_blocks: Vec<SemanticBlock> = structure_data["semantic_blocks"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|item| {
            Some(SemanticBlock {
                block_type: item["tag"].as_str()?.to_string(),
                selector: item["tag"].as_str()?.to_string(),
                confidence: 0.8,
            })
        })
        .collect();

    // Generate suggestions based on structure
    let mut suggestions = vec![];

    if has_table {
        suggestions.push(SelectorSuggestion {
            selector: Selector {
                id: "table_1".to_string(),
                selector_type: SelectorType::Css,
                value: "table".to_string(),
                strategy: SelectorStrategy::Table,
                label: "Table Data".to_string(),
                description: Some("Detected table structure".to_string()),
                confidence: Some(0.9),
                fallback: None,
                validation: None,
            },
            reasoning: "Table data detected - use table extraction strategy".to_string(),
            examples: vec!["table".to_string()],
            alternatives: vec![],
            score: 90,
        });
    }

    if !repeating_elements.is_empty() {
        let top_repeating = &repeating_elements[0];
        suggestions.push(SelectorSuggestion {
            selector: Selector {
                id: "repeating_1".to_string(),
                selector_type: SelectorType::Css,
                value: top_repeating.selector.clone(),
                strategy: SelectorStrategy::Multiple,
                label: "Repeating Elements".to_string(),
                description: Some(format!("Found {} repeating elements", top_repeating.count)),
                confidence: Some(0.85),
                fallback: None,
                validation: None,
            },
            reasoning: format!(
                "Found {} repeating elements with same class",
                top_repeating.count
            ),
            examples: vec![top_repeating.selector.clone()],
            alternatives: vec![],
            score: 85,
        });
    }

    // Determine page type
    let page_type = if has_table {
        "data_table"
    } else if !repeating_elements.is_empty() {
        "list_page"
    } else if has_form {
        "form_page"
    } else {
        "article"
    }
    .to_string();

    // Cleanup tab
    let _ = browser.close_tab(&tab_id);

    Ok(AIAnalysis {
        page_type,
        structure: PageStructure {
            has_table,
            has_list,
            has_form,
            has_pagination,
            repeating_elements,
            semantic_blocks,
        },
        suggestions,
        confidence: 0.85,
    })
}

#[tauri::command]
pub async fn extractor_export(
    data: Vec<ExtractedData>,
    config: ExportConfig,
    file_path: String,
) -> Result<(), String> {
    export_data(&data, &config, &file_path)
}
