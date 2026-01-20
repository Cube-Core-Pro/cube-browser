// CUBE Nexum - Web Annotations Commands
// Tauri commands for web annotations service

use tauri::State;
use crate::services::browser_web_annotations::{
    BrowserWebAnnotationsService, AnnotationSettings, PageAnnotation, AnnotationType,
    AnnotationContent, AnnotationPosition, AnnotationUpdate, AnnotationCollection,
    AnnotationSearch, AnnotationStats, ExportFormat, AnnotationExport, AnnotationReply,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn get_annotation_settings(
    service: State<'_, BrowserWebAnnotationsService>
) -> AnnotationSettings {
    service.get_settings()
}

#[tauri::command]
pub fn update_annotation_settings(
    service: State<'_, BrowserWebAnnotationsService>,
    settings: AnnotationSettings
) {
    service.update_settings(settings);
}

// ==================== Annotation Commands ====================

#[tauri::command]
pub fn create_annotation(
    service: State<'_, BrowserWebAnnotationsService>,
    url: String,
    page_title: String,
    annotation_type: AnnotationType,
    content: AnnotationContent,
    position: AnnotationPosition
) -> PageAnnotation {
    service.create_annotation(&url, &page_title, annotation_type, content, position)
}

#[tauri::command]
pub fn get_annotation(
    service: State<'_, BrowserWebAnnotationsService>,
    annotation_id: String
) -> Option<PageAnnotation> {
    service.get_annotation(&annotation_id)
}

#[tauri::command]
pub fn get_annotations_for_url(
    service: State<'_, BrowserWebAnnotationsService>,
    url: String
) -> Vec<PageAnnotation> {
    service.get_annotations_for_url(&url)
}

#[tauri::command]
pub fn get_all_annotations(
    service: State<'_, BrowserWebAnnotationsService>
) -> Vec<PageAnnotation> {
    service.get_all_annotations()
}

#[tauri::command]
pub fn update_annotation(
    service: State<'_, BrowserWebAnnotationsService>,
    annotation_id: String,
    updates: AnnotationUpdate
) -> Result<PageAnnotation, String> {
    service.update_annotation(&annotation_id, updates)
}

#[tauri::command]
pub fn delete_annotation(
    service: State<'_, BrowserWebAnnotationsService>,
    annotation_id: String
) -> Result<(), String> {
    service.delete_annotation(&annotation_id)
}

#[tauri::command]
pub fn add_annotation_tag(
    service: State<'_, BrowserWebAnnotationsService>,
    annotation_id: String,
    tag: String
) -> Result<PageAnnotation, String> {
    service.add_tag(&annotation_id, &tag)
}

#[tauri::command]
pub fn remove_annotation_tag(
    service: State<'_, BrowserWebAnnotationsService>,
    annotation_id: String,
    tag: String
) -> Result<PageAnnotation, String> {
    service.remove_tag(&annotation_id, &tag)
}

#[tauri::command]
pub fn add_annotation_reply(
    service: State<'_, BrowserWebAnnotationsService>,
    annotation_id: String,
    user_id: String,
    text: String
) -> Result<AnnotationReply, String> {
    service.add_reply(&annotation_id, &user_id, &text)
}

#[tauri::command]
pub fn add_annotation_reaction(
    service: State<'_, BrowserWebAnnotationsService>,
    annotation_id: String,
    user_id: String,
    emoji: String
) -> Result<PageAnnotation, String> {
    service.add_reaction(&annotation_id, &user_id, &emoji)
}

// ==================== Collection Commands ====================

#[tauri::command]
pub fn create_annotation_collection(
    service: State<'_, BrowserWebAnnotationsService>,
    name: String,
    description: Option<String>
) -> AnnotationCollection {
    service.create_collection(name, description)
}

#[tauri::command]
pub fn get_annotation_collection(
    service: State<'_, BrowserWebAnnotationsService>,
    collection_id: String
) -> Option<AnnotationCollection> {
    service.get_collection(&collection_id)
}

#[tauri::command]
pub fn get_all_annotation_collections(
    service: State<'_, BrowserWebAnnotationsService>
) -> Vec<AnnotationCollection> {
    service.get_all_collections()
}

#[tauri::command]
pub fn add_annotation_to_collection(
    service: State<'_, BrowserWebAnnotationsService>,
    collection_id: String,
    annotation_id: String
) -> Result<AnnotationCollection, String> {
    service.add_to_collection(&collection_id, &annotation_id)
}

#[tauri::command]
pub fn remove_annotation_from_collection(
    service: State<'_, BrowserWebAnnotationsService>,
    collection_id: String,
    annotation_id: String
) -> Result<AnnotationCollection, String> {
    service.remove_from_collection(&collection_id, &annotation_id)
}

#[tauri::command]
pub fn delete_annotation_collection(
    service: State<'_, BrowserWebAnnotationsService>,
    collection_id: String
) -> Result<(), String> {
    service.delete_collection(&collection_id)
}

// ==================== Search Commands ====================

#[tauri::command]
pub fn search_annotations(
    service: State<'_, BrowserWebAnnotationsService>,
    search: AnnotationSearch
) -> Vec<PageAnnotation> {
    service.search(search)
}

#[tauri::command]
pub fn get_annotations_by_tag(
    service: State<'_, BrowserWebAnnotationsService>,
    tag: String
) -> Vec<PageAnnotation> {
    service.get_annotations_by_tag(&tag)
}

#[tauri::command]
pub fn get_all_annotation_tags(
    service: State<'_, BrowserWebAnnotationsService>
) -> Vec<String> {
    service.get_all_tags()
}

// ==================== Export/Import Commands ====================

#[tauri::command]
pub fn export_annotations(
    service: State<'_, BrowserWebAnnotationsService>,
    format: ExportFormat,
    annotation_ids: Option<Vec<String>>
) -> AnnotationExport {
    service.export(format, annotation_ids)
}

#[tauri::command]
pub fn import_annotations(
    service: State<'_, BrowserWebAnnotationsService>,
    export: AnnotationExport
) -> (u32, u32) {
    service.import(export)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn get_annotation_stats(
    service: State<'_, BrowserWebAnnotationsService>
) -> AnnotationStats {
    service.get_stats()
}
