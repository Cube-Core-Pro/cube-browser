use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExportConfig {
    pub format: String, // json, csv, excel, xml, sql
    pub path: String,
    pub options: ExportOptions,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExportOptions {
    // JSON options
    pub pretty: Option<bool>,
    pub compress: Option<bool>,
    
    // CSV options
    pub delimiter: Option<String>,
    pub include_headers: Option<bool>,
    pub quote_strings: Option<bool>,
    
    // Excel options
    pub sheet_name: Option<String>,
    pub auto_filter: Option<bool>,
    pub freeze_panes: Option<bool>,
    
    // SQL options
    pub table_name: Option<String>,
    pub batch_size: Option<usize>,
    pub on_conflict: Option<String>, // skip, replace, update
    
    // Data cleaning
    pub remove_duplicates: Option<bool>,
    pub dedupe_key: Option<String>,
    pub remove_empty: Option<bool>,
    pub trim_strings: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportResult {
    pub success: bool,
    pub file_path: String,
    pub rows_exported: usize,
    pub file_size_bytes: usize,
    pub duration_ms: u128,
}

/// Export data to JSON file
#[tauri::command]
pub async fn export_to_json(
    data: Vec<serde_json::Value>,
    config: ExportConfig,
) -> Result<ExportResult, String> {
    let start = std::time::Instant::now();
    
    log::info!("Exporting {} rows to JSON: {}", data.len(), config.path);

    // Clean data
    let cleaned_data = clean_data(data, &config.options)?;

    // Serialize
    let json_string = if config.options.pretty.unwrap_or(true) {
        serde_json::to_string_pretty(&cleaned_data)
            .map_err(|e| format!("JSON serialization failed: {}", e))?
    } else {
        serde_json::to_string(&cleaned_data)
            .map_err(|e| format!("JSON serialization failed: {}", e))?
    };

    // Write to file
    fs::write(&config.path, &json_string)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    let metadata = fs::metadata(&config.path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    Ok(ExportResult {
        success: true,
        file_path: config.path,
        rows_exported: cleaned_data.len(),
        file_size_bytes: metadata.len() as usize,
        duration_ms: start.elapsed().as_millis(),
    })
}

/// Export data to CSV file
#[tauri::command]
pub async fn export_to_csv(
    data: Vec<serde_json::Value>,
    config: ExportConfig,
) -> Result<ExportResult, String> {
    let start = std::time::Instant::now();
    
    log::info!("Exporting {} rows to CSV: {}", data.len(), config.path);

    let cleaned_data = clean_data(data, &config.options)?;
    
    if cleaned_data.is_empty() {
        return Err("No data to export".to_string());
    }

    let delimiter = config.options.delimiter.as_deref().unwrap_or(",");
    let include_headers = config.options.include_headers.unwrap_or(true);
    let quote_strings = config.options.quote_strings.unwrap_or(true);

    // Extract headers from first row
    let headers = extract_headers(&cleaned_data[0])?;

    let mut csv_content = String::new();

    // Write headers
    if include_headers {
        csv_content.push_str(&headers.join(delimiter));
        csv_content.push('\n');
    }

    // Write rows
    for row in &cleaned_data {
        let values = headers
            .iter()
            .map(|key| {
                let value_str = row.get(key)
                    .map(|v| {
                        if let Some(s) = v.as_str() {
                            s.to_string()
                        } else {
                            v.to_string()
                        }
                    })
                    .unwrap_or_default();
                
                if quote_strings && value_str.contains(delimiter) {
                    format!("\"{}\"", value_str.replace("\"", "\"\""))
                } else {
                    value_str
                }
            })
            .collect::<Vec<String>>();
        
        csv_content.push_str(&values.join(delimiter));
        csv_content.push('\n');
    }

    // Write to file
    fs::write(&config.path, csv_content)
        .map_err(|e| format!("Failed to write CSV: {}", e))?;

    let metadata = fs::metadata(&config.path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    Ok(ExportResult {
        success: true,
        file_path: config.path,
        rows_exported: cleaned_data.len(),
        file_size_bytes: metadata.len() as usize,
        duration_ms: start.elapsed().as_millis(),
    })
}

/// Export data to SQL INSERT statements
#[tauri::command]
pub async fn export_to_sql(
    data: Vec<serde_json::Value>,
    config: ExportConfig,
) -> Result<ExportResult, String> {
    let start = std::time::Instant::now();
    
    log::info!("Exporting {} rows to SQL: {}", data.len(), config.path);

    let cleaned_data = clean_data(data, &config.options)?;
    
    if cleaned_data.is_empty() {
        return Err("No data to export".to_string());
    }

    let table_name = config.options.table_name.as_deref().unwrap_or("data");
    let batch_size = config.options.batch_size.unwrap_or(100);
    let on_conflict = config.options.on_conflict.as_deref().unwrap_or("skip");

    let headers = extract_headers(&cleaned_data[0])?;
    
    let mut sql_content = String::new();

    // Add header comment
    sql_content.push_str(&format!(
        "-- SQL Export: {} rows\n",
        cleaned_data.len()
    ));
    sql_content.push_str(&format!("-- Generated: {}\n\n", chrono::Local::now().to_rfc3339()));

    // Create table statement
    sql_content.push_str(&format!("CREATE TABLE IF NOT EXISTS {} (\n", table_name));
    sql_content.push_str("  id SERIAL PRIMARY KEY,\n");
    for (i, header) in headers.iter().enumerate() {
        sql_content.push_str(&format!(
            "  {} TEXT{}",
            header,
            if i < headers.len() - 1 { "," } else { "" }
        ));
        sql_content.push('\n');
    }
    sql_content.push_str(");\n\n");

    // Insert statements in batches
    for chunk in cleaned_data.chunks(batch_size) {
        sql_content.push_str(&format!(
            "INSERT INTO {} ({}) VALUES\n",
            table_name,
            headers.join(", ")
        ));

        for (i, row) in chunk.iter().enumerate() {
            let values = headers
                .iter()
                .map(|key| {
                    let value = row.get(key)
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    
                    // Escape single quotes
                    format!("'{}'", value.replace("'", "''"))
                })
                .collect::<Vec<String>>();
            
            sql_content.push_str(&format!(
                "  ({}){}",
                values.join(", "),
                if i < chunk.len() - 1 { "," } else { "" }
            ));
            sql_content.push('\n');
        }

        // Handle conflicts
        match on_conflict {
            "replace" => sql_content.push_str("ON CONFLICT DO UPDATE SET id = EXCLUDED.id;\n\n"),
            "update" => {
                sql_content.push_str("ON CONFLICT (id) DO UPDATE SET ");
                let updates = headers
                    .iter()
                    .map(|h| format!("{} = EXCLUDED.{}", h, h))
                    .collect::<Vec<String>>()
                    .join(", ");
                sql_content.push_str(&updates);
                sql_content.push_str(";\n\n");
            }
            _ => sql_content.push_str(";\n\n"), // skip
        }
    }

    // Write to file
    fs::write(&config.path, sql_content)
        .map_err(|e| format!("Failed to write SQL: {}", e))?;

    let metadata = fs::metadata(&config.path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    Ok(ExportResult {
        success: true,
        file_path: config.path,
        rows_exported: cleaned_data.len(),
        file_size_bytes: metadata.len() as usize,
        duration_ms: start.elapsed().as_millis(),
    })
}

/// Export data to XML file
#[tauri::command]
pub async fn export_to_xml(
    data: Vec<serde_json::Value>,
    config: ExportConfig,
) -> Result<ExportResult, String> {
    let start = std::time::Instant::now();
    
    log::info!("Exporting {} rows to XML: {}", data.len(), config.path);

    let cleaned_data = clean_data(data, &config.options)?;

    let mut xml_content = String::new();
    xml_content.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    xml_content.push_str("<data>\n");

    for row in &cleaned_data {
        xml_content.push_str("  <record>\n");
        
        if let Some(obj) = row.as_object() {
            for (key, value) in obj {
                let val_str = value.as_str()
                    .unwrap_or(&value.to_string())
                    .replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&apos;");
                
                xml_content.push_str(&format!("    <{}>{}</{}>\n", key, val_str, key));
            }
        }
        
        xml_content.push_str("  </record>\n");
    }

    xml_content.push_str("</data>\n");

    // Write to file
    fs::write(&config.path, xml_content)
        .map_err(|e| format!("Failed to write XML: {}", e))?;

    let metadata = fs::metadata(&config.path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    Ok(ExportResult {
        success: true,
        file_path: config.path,
        rows_exported: cleaned_data.len(),
        file_size_bytes: metadata.len() as usize,
        duration_ms: start.elapsed().as_millis(),
    })
}

// ============================================================================
// DATA CLEANING FUNCTIONS
// ============================================================================

fn clean_data(
    mut data: Vec<serde_json::Value>,
    options: &ExportOptions,
) -> Result<Vec<serde_json::Value>, String> {
    // Remove empty rows
    if options.remove_empty.unwrap_or(false) {
        data.retain(|row| {
            row.as_object()
                .map(|obj| !obj.is_empty())
                .unwrap_or(true)
        });
    }

    // Trim strings
    if options.trim_strings.unwrap_or(false) {
        data = data
            .into_iter()
            .map(|mut row| {
                if let Some(obj) = row.as_object_mut() {
                    for (_key, value) in obj.iter_mut() {
                        if let Some(s) = value.as_str() {
                            *value = serde_json::Value::String(s.trim().to_string());
                        }
                    }
                }
                row
            })
            .collect();
    }

    // Remove duplicates
    if options.remove_duplicates.unwrap_or(false) {
        let dedupe_key = options.dedupe_key.as_deref();
        data = deduplicate_data(data, dedupe_key)?;
    }

    Ok(data)
}

fn deduplicate_data(
    data: Vec<serde_json::Value>,
    dedupe_key: Option<&str>,
) -> Result<Vec<serde_json::Value>, String> {
    use std::collections::HashSet;
    
    let mut seen = HashSet::new();
    let mut result = Vec::new();

    for row in data {
        let key = if let Some(key_field) = dedupe_key {
            row.get(key_field)
                .and_then(|v| v.as_str())
                .unwrap_or(&row.to_string())
                .to_string()
        } else {
            row.to_string()
        };

        if seen.insert(key) {
            result.push(row);
        }
    }

    Ok(result)
}

fn extract_headers(row: &serde_json::Value) -> Result<Vec<String>, String> {
    row.as_object()
        .map(|obj| obj.keys().cloned().collect())
        .ok_or_else(|| "Invalid row format".to_string())
}
