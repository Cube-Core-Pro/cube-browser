// CUBE Nexum Elite - Admin File Management Commands
// Provides backend functionality for the File Manager
// Features: File/folder management, uploads, previews, permissions

use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration};
use uuid::Uuid;

// ============================================================
// TYPES - File Management Data Structures
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileItem {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub file_type: FileType,
    pub path: String,
    pub size: Option<u64>,
    pub mime_type: Option<String>,
    pub extension: Option<String>,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub owner: String,
    pub permissions: FilePermission,
    pub starred: bool,
    pub downloads: u64,
    pub thumbnail_url: Option<String>,
    pub preview_url: Option<String>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum FileType {
    File,
    Folder,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum FilePermission {
    Private,
    Team,
    Public,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadProgress {
    pub id: String,
    pub filename: String,
    pub total_bytes: u64,
    pub uploaded_bytes: u64,
    pub status: UploadStatus,
    pub started_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum UploadStatus {
    Pending,
    Uploading,
    Processing,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileVersion {
    pub id: String,
    pub file_id: String,
    pub version_number: u32,
    pub size: u64,
    pub created_at: DateTime<Utc>,
    pub created_by: String,
    pub comment: Option<String>,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareLink {
    pub id: String,
    pub file_id: String,
    pub url: String,
    pub password: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub max_downloads: Option<u32>,
    pub download_count: u32,
    pub created_at: DateTime<Utc>,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub total_space: u64,
    pub used_space: u64,
    pub available_space: u64,
    pub file_count: u64,
    pub folder_count: u64,
    pub usage_by_type: HashMap<String, u64>,
}

// ============================================================
// STATE
// ============================================================

pub struct FileManagerState {
    pub files: Mutex<HashMap<String, FileItem>>,
    pub versions: Mutex<Vec<FileVersion>>,
    pub share_links: Mutex<Vec<ShareLink>>,
    pub uploads: Mutex<HashMap<String, UploadProgress>>,
    pub stats: Mutex<StorageStats>,
}

impl Default for FileManagerState {
    fn default() -> Self {
        let mut files = HashMap::new();
        
        // Add sample folders
        let folders = vec![
            ("Documentation", "/Documentation", "private"),
            ("Marketing Assets", "/Marketing Assets", "team"),
            ("Releases", "/Releases", "private"),
            ("Shared", "/Shared", "public"),
        ];
        
        for (name, path, perm) in folders {
            let id = Uuid::new_v4().to_string();
            files.insert(id.clone(), FileItem {
                id,
                name: name.to_string(),
                file_type: FileType::Folder,
                path: path.to_string(),
                size: None,
                mime_type: None,
                extension: None,
                created_at: Utc::now() - Duration::days(90),
                modified_at: Utc::now() - Duration::days(5),
                owner: "admin".to_string(),
                permissions: match perm {
                    "private" => FilePermission::Private,
                    "team" => FilePermission::Team,
                    _ => FilePermission::Public,
                },
                starred: false,
                downloads: 0,
                thumbnail_url: None,
                preview_url: None,
                metadata: HashMap::new(),
            });
        }
        
        // Add sample files
        let sample_files = vec![
            ("cube-nexum-logo.png", "/cube-nexum-logo.png", "image/png", 245760_u64, true),
            ("product-demo.mp4", "/product-demo.mp4", "video/mp4", 157286400, false),
            ("api-docs.pdf", "/Documentation/api-docs.pdf", "application/pdf", 2457600, false),
            ("changelog.md", "/Documentation/changelog.md", "text/markdown", 45000, false),
        ];
        
        for (name, path, mime, size, starred) in sample_files {
            let id = Uuid::new_v4().to_string();
            let ext = name.split('.').last().map(|s| s.to_string());
            files.insert(id.clone(), FileItem {
                id,
                name: name.to_string(),
                file_type: FileType::File,
                path: path.to_string(),
                size: Some(size),
                mime_type: Some(mime.to_string()),
                extension: ext,
                created_at: Utc::now() - Duration::days(30),
                modified_at: Utc::now() - Duration::days(2),
                owner: "admin".to_string(),
                permissions: FilePermission::Team,
                starred,
                downloads: 0,
                thumbnail_url: if mime.starts_with("image/") { Some(format!("/thumbs/{}", name)) } else { None },
                preview_url: Some(format!("/preview/{}", name)),
                metadata: HashMap::new(),
            });
        }
        
        Self {
            files: Mutex::new(files),
            versions: Mutex::new(Vec::new()),
            share_links: Mutex::new(Vec::new()),
            uploads: Mutex::new(HashMap::new()),
            stats: Mutex::new(StorageStats {
                total_space: 10_737_418_240, // 10 GB
                used_space: 160_034_360,
                available_space: 10_577_383_880,
                file_count: 4,
                folder_count: 4,
                usage_by_type: {
                    let mut m = HashMap::new();
                    m.insert("images".to_string(), 245760);
                    m.insert("videos".to_string(), 157286400);
                    m.insert("documents".to_string(), 2502600);
                    m
                },
            }),
        }
    }
}

// ============================================================
// COMMANDS
// ============================================================

#[tauri::command]
pub async fn files_list(
    state: State<'_, FileManagerState>,
    path: Option<String>,
    include_hidden: Option<bool>,
) -> Result<Vec<FileItem>, String> {
    let files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    let base_path = path.unwrap_or_else(|| "/".to_string());
    let show_hidden = include_hidden.unwrap_or(false);
    
    let filtered: Vec<FileItem> = files.values()
        .filter(|f| {
            // Get parent path
            let parent = if f.path == "/" {
                "/".to_string()
            } else {
                f.path.rsplit_once('/').map(|(p, _)| if p.is_empty() { "/" } else { p }).unwrap_or("/").to_string()
            };
            
            let path_match = parent == base_path || (base_path == "/" && !f.path.contains('/') || (f.path.starts_with(&base_path) && f.path != base_path));
            let hidden_match = show_hidden || !f.name.starts_with('.');
            
            // For root path, show items directly under root
            if base_path == "/" {
                let depth = f.path.matches('/').count();
                return depth <= 1 && hidden_match;
            }
            
            path_match && hidden_match
        })
        .cloned()
        .collect();
    
    Ok(filtered)
}

#[tauri::command]
pub async fn files_get(
    state: State<'_, FileManagerState>,
    file_id: String,
) -> Result<Option<FileItem>, String> {
    let files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(files.get(&file_id).cloned())
}

#[tauri::command]
pub async fn files_create_folder(
    state: State<'_, FileManagerState>,
    name: String,
    parent_path: String,
    permissions: Option<FilePermission>,
) -> Result<FileItem, String> {
    let path = if parent_path == "/" {
        format!("/{}", name)
    } else {
        format!("{}/{}", parent_path, name)
    };
    
    let folder = FileItem {
        id: Uuid::new_v4().to_string(),
        name,
        file_type: FileType::Folder,
        path,
        size: None,
        mime_type: None,
        extension: None,
        created_at: Utc::now(),
        modified_at: Utc::now(),
        owner: "admin".to_string(),
        permissions: permissions.unwrap_or(FilePermission::Private),
        starred: false,
        downloads: 0,
        thumbnail_url: None,
        preview_url: None,
        metadata: HashMap::new(),
    };
    
    let folder_clone = folder.clone();
    
    let mut files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    files.insert(folder.id.clone(), folder);
    
    // Update stats
    drop(files);
    let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    stats.folder_count += 1;
    
    Ok(folder_clone)
}

#[derive(Debug, Deserialize)]
pub struct UploadFileRequest {
    pub name: String,
    pub parent_path: String,
    pub size: u64,
    pub mime_type: String,
    pub content_base64: Option<String>,
}

#[tauri::command]
pub async fn files_upload(
    state: State<'_, FileManagerState>,
    request: UploadFileRequest,
) -> Result<FileItem, String> {
    let path = if request.parent_path == "/" {
        format!("/{}", request.name)
    } else {
        format!("{}/{}", request.parent_path, request.name)
    };
    
    let extension = request.name.split('.').last().map(|s| s.to_string());
    
    let file = FileItem {
        id: Uuid::new_v4().to_string(),
        name: request.name,
        file_type: FileType::File,
        path: path.clone(),
        size: Some(request.size),
        mime_type: Some(request.mime_type.clone()),
        extension,
        created_at: Utc::now(),
        modified_at: Utc::now(),
        owner: "admin".to_string(),
        permissions: FilePermission::Private,
        starred: false,
        downloads: 0,
        thumbnail_url: if request.mime_type.starts_with("image/") { 
            Some(format!("/thumbs{}", path)) 
        } else { 
            None 
        },
        preview_url: Some(format!("/preview{}", path)),
        metadata: HashMap::new(),
    };
    
    let file_clone = file.clone();
    
    let mut files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    files.insert(file.id.clone(), file);
    
    // Update stats
    drop(files);
    let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    stats.file_count += 1;
    stats.used_space += request.size;
    stats.available_space = stats.total_space.saturating_sub(stats.used_space);
    
    // Update usage by type
    let type_key = if request.mime_type.starts_with("image/") {
        "images"
    } else if request.mime_type.starts_with("video/") {
        "videos"
    } else if request.mime_type.starts_with("audio/") {
        "audio"
    } else {
        "documents"
    };
    *stats.usage_by_type.entry(type_key.to_string()).or_insert(0) += request.size;
    
    Ok(file_clone)
}

#[tauri::command]
pub async fn files_delete(
    state: State<'_, FileManagerState>,
    file_id: String,
) -> Result<bool, String> {
    let mut files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(file) = files.remove(&file_id) {
        // Update stats
        drop(files);
        let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
        
        if file.file_type == FileType::Folder {
            if stats.folder_count > 0 {
                stats.folder_count -= 1;
            }
        } else {
            if stats.file_count > 0 {
                stats.file_count -= 1;
            }
            if let Some(size) = file.size {
                stats.used_space = stats.used_space.saturating_sub(size);
                stats.available_space = stats.total_space.saturating_sub(stats.used_space);
            }
        }
        
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub async fn files_rename(
    state: State<'_, FileManagerState>,
    file_id: String,
    new_name: String,
) -> Result<FileItem, String> {
    let mut files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let file = files.get_mut(&file_id)
        .ok_or_else(|| "File not found".to_string())?;
    
    // Update path with new name
    let parent = file.path.rsplit_once('/').map(|(p, _)| p).unwrap_or("");
    let new_path = if parent.is_empty() {
        format!("/{}", new_name)
    } else {
        format!("{}/{}", parent, new_name)
    };
    
    file.name = new_name.clone();
    file.path = new_path;
    file.modified_at = Utc::now();
    
    if file.file_type == FileType::File {
        file.extension = new_name.split('.').last().map(|s| s.to_string());
    }
    
    Ok(file.clone())
}

#[tauri::command]
pub async fn files_move(
    state: State<'_, FileManagerState>,
    file_id: String,
    new_parent_path: String,
) -> Result<FileItem, String> {
    let mut files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let file = files.get_mut(&file_id)
        .ok_or_else(|| "File not found".to_string())?;
    
    let new_path = if new_parent_path == "/" {
        format!("/{}", file.name)
    } else {
        format!("{}/{}", new_parent_path, file.name)
    };
    
    file.path = new_path;
    file.modified_at = Utc::now();
    
    Ok(file.clone())
}

#[tauri::command]
pub async fn files_copy(
    state: State<'_, FileManagerState>,
    file_id: String,
    dest_path: String,
) -> Result<FileItem, String> {
    let files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let original = files.get(&file_id)
        .ok_or_else(|| "File not found".to_string())?
        .clone();
    
    drop(files);
    
    let new_path = if dest_path == "/" {
        format!("/{}", original.name)
    } else {
        format!("{}/{}", dest_path, original.name)
    };
    
    let copy = FileItem {
        id: Uuid::new_v4().to_string(),
        name: original.name,
        file_type: original.file_type,
        path: new_path,
        size: original.size,
        mime_type: original.mime_type,
        extension: original.extension,
        created_at: Utc::now(),
        modified_at: Utc::now(),
        owner: "admin".to_string(),
        permissions: original.permissions,
        starred: false,
        downloads: 0,
        thumbnail_url: original.thumbnail_url,
        preview_url: original.preview_url,
        metadata: original.metadata,
    };
    
    let copy_clone = copy.clone();
    
    let mut files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    files.insert(copy.id.clone(), copy);
    
    Ok(copy_clone)
}

#[tauri::command]
pub async fn files_toggle_star(
    state: State<'_, FileManagerState>,
    file_id: String,
) -> Result<FileItem, String> {
    let mut files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let file = files.get_mut(&file_id)
        .ok_or_else(|| "File not found".to_string())?;
    
    file.starred = !file.starred;
    
    Ok(file.clone())
}

#[tauri::command]
pub async fn files_update_permissions(
    state: State<'_, FileManagerState>,
    file_id: String,
    permissions: FilePermission,
) -> Result<FileItem, String> {
    let mut files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let file = files.get_mut(&file_id)
        .ok_or_else(|| "File not found".to_string())?;
    
    file.permissions = permissions;
    file.modified_at = Utc::now();
    
    Ok(file.clone())
}

#[tauri::command]
pub async fn files_create_share_link(
    state: State<'_, FileManagerState>,
    file_id: String,
    password: Option<String>,
    expires_in_days: Option<u32>,
    max_downloads: Option<u32>,
) -> Result<ShareLink, String> {
    let files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if !files.contains_key(&file_id) {
        return Err("File not found".to_string());
    }
    
    drop(files);
    
    let link_id = Uuid::new_v4().to_string();
    let share_link = ShareLink {
        id: link_id.clone(),
        file_id,
        url: format!("https://cubenexum.com/share/{}", link_id),
        password,
        expires_at: expires_in_days.map(|days| Utc::now() + Duration::days(days as i64)),
        max_downloads,
        download_count: 0,
        created_at: Utc::now(),
        created_by: "admin".to_string(),
    };
    
    let link_clone = share_link.clone();
    
    let mut links = state.share_links.lock().map_err(|e| format!("Lock error: {}", e))?;
    links.push(share_link);
    
    Ok(link_clone)
}

#[tauri::command]
pub async fn files_get_share_links(
    state: State<'_, FileManagerState>,
    file_id: String,
) -> Result<Vec<ShareLink>, String> {
    let links = state.share_links.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let filtered: Vec<ShareLink> = links.iter()
        .filter(|l| l.file_id == file_id)
        .cloned()
        .collect();
    
    Ok(filtered)
}

#[tauri::command]
pub async fn files_delete_share_link(
    state: State<'_, FileManagerState>,
    link_id: String,
) -> Result<bool, String> {
    let mut links = state.share_links.lock().map_err(|e| format!("Lock error: {}", e))?;
    let initial_len = links.len();
    links.retain(|l| l.id != link_id);
    Ok(links.len() < initial_len)
}

#[tauri::command]
pub async fn files_get_versions(
    state: State<'_, FileManagerState>,
    file_id: String,
) -> Result<Vec<FileVersion>, String> {
    let versions = state.versions.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let filtered: Vec<FileVersion> = versions.iter()
        .filter(|v| v.file_id == file_id)
        .cloned()
        .collect();
    
    Ok(filtered)
}

#[tauri::command]
pub async fn files_get_stats(
    state: State<'_, FileManagerState>,
) -> Result<StorageStats, String> {
    let stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(stats.clone())
}

#[tauri::command]
pub async fn files_search(
    state: State<'_, FileManagerState>,
    query: String,
    file_type: Option<String>,
) -> Result<Vec<FileItem>, String> {
    let files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    let query_lower = query.to_lowercase();
    
    let filtered: Vec<FileItem> = files.values()
        .filter(|f| {
            let name_match = f.name.to_lowercase().contains(&query_lower);
            let type_match = file_type.as_ref()
                .map(|t| t == "all" || format!("{:?}", f.file_type).to_lowercase() == t.to_lowercase())
                .unwrap_or(true);
            name_match && type_match
        })
        .cloned()
        .collect();
    
    Ok(filtered)
}

#[tauri::command]
pub async fn files_get_starred(
    state: State<'_, FileManagerState>,
) -> Result<Vec<FileItem>, String> {
    let files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let starred: Vec<FileItem> = files.values()
        .filter(|f| f.starred)
        .cloned()
        .collect();
    
    Ok(starred)
}

#[tauri::command]
pub async fn files_get_recent(
    state: State<'_, FileManagerState>,
    limit: Option<u32>,
) -> Result<Vec<FileItem>, String> {
    let files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    let max = limit.unwrap_or(20) as usize;
    
    let mut recent: Vec<FileItem> = files.values()
        .filter(|f| f.file_type == FileType::File)
        .cloned()
        .collect();
    
    recent.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));
    recent.truncate(max);
    
    Ok(recent)
}

#[tauri::command]
pub async fn files_record_download(
    state: State<'_, FileManagerState>,
    file_id: String,
) -> Result<(), String> {
    let mut files = state.files.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(file) = files.get_mut(&file_id) {
        file.downloads += 1;
    }
    
    Ok(())
}
