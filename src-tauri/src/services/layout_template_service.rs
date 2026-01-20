/**
 * Layout Template Service (Rust Backend)
 *
 * Manages layout templates storage and retrieval using JSON files.
 * Templates are stored in app_data_dir/layout_templates/
 */
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LayoutTemplate {
    pub id: String,
    pub name: String,
    pub mode: String, // "single", "1:1", "2:1", "1:2", "2x2"
    pub panel_count: u32,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub is_builtin: bool,
    pub created_at: String,
    pub last_used: Option<String>,
    pub use_count: u32,
}

pub struct LayoutTemplateService {
    app_handle: AppHandle,
}

impl LayoutTemplateService {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    /// Get templates directory path
    fn templates_dir(&self) -> Result<PathBuf, String> {
        let app_data_dir = self
            .app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))?;

        let templates_dir = app_data_dir.join("layout_templates");

        // Create directory if it doesn't exist
        if !templates_dir.exists() {
            fs::create_dir_all(&templates_dir)
                .map_err(|e| format!("Failed to create templates dir: {}", e))?;
        }

        Ok(templates_dir)
    }

    /// Get path to template file
    fn template_file_path(&self, template_id: &str) -> Result<PathBuf, String> {
        Ok(self.templates_dir()?.join(format!("{}.json", template_id)))
    }

    /// List all custom templates
    pub fn list_templates(&self) -> Result<Vec<LayoutTemplate>, String> {
        let templates_dir = self.templates_dir()?;

        let mut templates = Vec::new();

        // Read all JSON files in templates directory
        if let Ok(entries) = fs::read_dir(&templates_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("json") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Ok(template) = serde_json::from_str::<LayoutTemplate>(&content) {
                            templates.push(template);
                        }
                    }
                }
            }
        }

        // Sort by use_count (descending), then by last_used (descending)
        templates.sort_by(|a, b| {
            match b.use_count.cmp(&a.use_count) {
                std::cmp::Ordering::Equal => {
                    // If use_count is equal, sort by last_used
                    match (&b.last_used, &a.last_used) {
                        (Some(b_used), Some(a_used)) => b_used.cmp(a_used),
                        (Some(_), None) => std::cmp::Ordering::Less,
                        (None, Some(_)) => std::cmp::Ordering::Greater,
                        (None, None) => std::cmp::Ordering::Equal,
                    }
                }
                other => other,
            }
        });

        Ok(templates)
    }

    /// Save a new template
    pub fn save_template(&self, mut template: LayoutTemplate) -> Result<LayoutTemplate, String> {
        // Generate ID if not provided
        if template.id.is_empty() {
            template.id = Uuid::new_v4().to_string();
        }

        // Set created_at if not provided
        if template.created_at.is_empty() {
            template.created_at = chrono::Utc::now().to_rfc3339();
        }

        // Ensure is_builtin is false for user templates
        template.is_builtin = false;

        // Serialize to JSON
        let json = serde_json::to_string_pretty(&template)
            .map_err(|e| format!("Failed to serialize template: {}", e))?;

        // Write to file
        let file_path = self.template_file_path(&template.id)?;
        fs::write(&file_path, json).map_err(|e| format!("Failed to write template file: {}", e))?;

        Ok(template)
    }

    /// Update template metadata
    pub fn update_template(
        &self,
        template_id: &str,
        updates: serde_json::Value,
    ) -> Result<LayoutTemplate, String> {
        // Load existing template
        let file_path = self.template_file_path(template_id)?;
        let content =
            fs::read_to_string(&file_path).map_err(|e| format!("Template not found: {}", e))?;

        let mut template: LayoutTemplate =
            serde_json::from_str(&content).map_err(|e| format!("Invalid template data: {}", e))?;

        // Check if it's a built-in template
        if template.is_builtin {
            return Err("Cannot update built-in template".to_string());
        }

        // Apply updates
        if let Some(name) = updates.get("name").and_then(|v| v.as_str()) {
            template.name = name.to_string();
        }
        if let Some(description) = updates.get("description").and_then(|v| v.as_str()) {
            template.description = Some(description.to_string());
        }
        if let Some(icon) = updates.get("icon").and_then(|v| v.as_str()) {
            template.icon = Some(icon.to_string());
        }

        // Save updated template
        self.save_template(template)
    }

    /// Update template usage (increment use_count, update last_used)
    pub fn update_template_usage(&self, template_id: &str) -> Result<LayoutTemplate, String> {
        // Load existing template
        let file_path = self.template_file_path(template_id)?;
        let content =
            fs::read_to_string(&file_path).map_err(|e| format!("Template not found: {}", e))?;

        let mut template: LayoutTemplate =
            serde_json::from_str(&content).map_err(|e| format!("Invalid template data: {}", e))?;

        // Update usage
        template.use_count += 1;
        template.last_used = Some(chrono::Utc::now().to_rfc3339());

        // Save updated template
        self.save_template(template)
    }

    /// Delete a template
    pub fn delete_template(&self, template_id: &str) -> Result<(), String> {
        // Load template to check if it's built-in
        let file_path = self.template_file_path(template_id)?;
        let content =
            fs::read_to_string(&file_path).map_err(|e| format!("Template not found: {}", e))?;

        let template: LayoutTemplate =
            serde_json::from_str(&content).map_err(|e| format!("Invalid template data: {}", e))?;

        // Check if it's a built-in template
        if template.is_builtin {
            return Err("Cannot delete built-in template".to_string());
        }

        // Delete file
        fs::remove_file(&file_path).map_err(|e| format!("Failed to delete template: {}", e))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_layout_template_serialization() {
        let template = LayoutTemplate {
            id: "test-1".to_string(),
            name: "Test Template".to_string(),
            mode: "1:1".to_string(),
            panel_count: 2,
            description: Some("Test description".to_string()),
            icon: Some("📋".to_string()),
            is_builtin: false,
            created_at: "2025-01-01T00:00:00Z".to_string(),
            last_used: None,
            use_count: 0,
        };

        let json = serde_json::to_string(&template).unwrap();
        let deserialized: LayoutTemplate = serde_json::from_str(&json).unwrap();

        assert_eq!(template.id, deserialized.id);
        assert_eq!(template.name, deserialized.name);
        assert_eq!(template.mode, deserialized.mode);
        assert_eq!(template.panel_count, deserialized.panel_count);
    }
}
