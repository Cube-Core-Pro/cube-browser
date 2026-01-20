// CUBE Nexum - Password Generator Commands
// Tauri commands for password generation service

use tauri::State;
use crate::services::browser_password_generator::{
    BrowserPasswordGeneratorService, PasswordGeneratorSettings, GeneratedPassword,
    GenerationOptions, PasswordAnalysis, PasswordHistory, PasswordTemplate,
    GenerationType, GeneratorStats,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn get_password_generator_settings(
    service: State<'_, BrowserPasswordGeneratorService>
) -> PasswordGeneratorSettings {
    service.get_settings()
}

#[tauri::command]
pub fn update_password_generator_settings(
    service: State<'_, BrowserPasswordGeneratorService>,
    settings: PasswordGeneratorSettings
) {
    service.update_settings(settings);
}

// ==================== Generation Commands ====================

#[tauri::command]
pub fn browser_generate_password(
    service: State<'_, BrowserPasswordGeneratorService>,
    options: GenerationOptions,
    domain: Option<String>
) -> GeneratedPassword {
    service.generate(options, domain)
}

#[tauri::command]
pub fn browser_generate_password_from_template(
    service: State<'_, BrowserPasswordGeneratorService>,
    template_id: String,
    domain: Option<String>
) -> Result<GeneratedPassword, String> {
    service.generate_from_template(&template_id, domain)
}

// ==================== Analysis Commands ====================

#[tauri::command]
pub fn analyze_password(
    service: State<'_, BrowserPasswordGeneratorService>,
    password: String
) -> PasswordAnalysis {
    service.analyze(&password)
}

// ==================== History Commands ====================

#[tauri::command]
pub fn get_password_generation_history(
    service: State<'_, BrowserPasswordGeneratorService>,
    limit: Option<u32>
) -> Vec<PasswordHistory> {
    service.get_history(limit)
}

#[tauri::command]
pub fn clear_password_generation_history(
    service: State<'_, BrowserPasswordGeneratorService>
) {
    service.clear_history();
}

// ==================== Template Commands ====================

#[tauri::command]
pub fn get_password_template(
    service: State<'_, BrowserPasswordGeneratorService>,
    template_id: String
) -> Option<PasswordTemplate> {
    service.get_template(&template_id)
}

#[tauri::command]
pub fn get_all_password_templates(
    service: State<'_, BrowserPasswordGeneratorService>
) -> Vec<PasswordTemplate> {
    service.get_all_templates()
}

#[tauri::command]
pub fn create_password_template(
    service: State<'_, BrowserPasswordGeneratorService>,
    name: String,
    description: String,
    generation_type: GenerationType,
    options: GenerationOptions
) -> PasswordTemplate {
    service.create_template(name, description, generation_type, options)
}

#[tauri::command]
pub fn delete_password_template(
    service: State<'_, BrowserPasswordGeneratorService>,
    template_id: String
) -> Result<(), String> {
    service.delete_template(&template_id)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn get_password_generator_stats(
    service: State<'_, BrowserPasswordGeneratorService>
) -> GeneratorStats {
    service.get_stats()
}
