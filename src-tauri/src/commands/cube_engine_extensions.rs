// CUBE Engine Extensions Support
// Extension API, content scripts, background scripts, storage API

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use tauri::{AppHandle, Emitter, State};

// ============================================
// Extensions State
// ============================================

pub struct CubeExtensionsState {
    pub extensions: RwLock<HashMap<String, Extension>>,
    pub content_scripts: RwLock<HashMap<String, Vec<ContentScript>>>,
    pub background_scripts: RwLock<HashMap<String, BackgroundContext>>,
    pub extension_storage: RwLock<HashMap<String, ExtensionStorage>>,
    pub permissions: RwLock<HashMap<String, ExtensionPermissions>>,
    pub message_handlers: RwLock<HashMap<String, Vec<MessageHandler>>>,
    pub config: RwLock<ExtensionsConfig>,
}

impl Default for CubeExtensionsState {
    fn default() -> Self {
        Self {
            extensions: RwLock::new(HashMap::new()),
            content_scripts: RwLock::new(HashMap::new()),
            background_scripts: RwLock::new(HashMap::new()),
            extension_storage: RwLock::new(HashMap::new()),
            permissions: RwLock::new(HashMap::new()),
            message_handlers: RwLock::new(HashMap::new()),
            config: RwLock::new(ExtensionsConfig::default()),
        }
    }
}

// ============================================
// Extension Manifest
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Extension {
    pub id: String,
    pub manifest: ExtensionManifest,
    pub status: ExtensionStatus,
    pub install_path: String,
    pub installed_at: i64,
    pub updated_at: i64,
    pub is_enabled: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionManifest {
    pub manifest_version: u8,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub homepage_url: Option<String>,
    pub icons: Option<HashMap<String, String>>,
    pub permissions: Vec<String>,
    pub optional_permissions: Vec<String>,
    pub host_permissions: Vec<String>,
    pub background: Option<BackgroundConfig>,
    pub content_scripts: Vec<ContentScriptConfig>,
    pub browser_action: Option<BrowserAction>,
    pub page_action: Option<PageAction>,
    pub options_page: Option<String>,
    pub options_ui: Option<OptionsUI>,
    pub web_accessible_resources: Vec<WebAccessibleResource>,
    pub content_security_policy: Option<ContentSecurityPolicyConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ExtensionStatus {
    #[default]
    Disabled,
    Enabled,
    Loading,
    Error,
    Uninstalling,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackgroundConfig {
    pub service_worker: Option<String>,
    pub scripts: Option<Vec<String>>,
    pub page: Option<String>,
    pub persistent: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentScriptConfig {
    pub matches: Vec<String>,
    pub exclude_matches: Option<Vec<String>>,
    pub include_globs: Option<Vec<String>>,
    pub exclude_globs: Option<Vec<String>>,
    pub js: Option<Vec<String>>,
    pub css: Option<Vec<String>>,
    pub run_at: Option<RunAt>,
    pub all_frames: Option<bool>,
    pub match_about_blank: Option<bool>,
    pub world: Option<ScriptWorld>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum RunAt {
    #[default]
    DocumentIdle,
    DocumentStart,
    DocumentEnd,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ScriptWorld {
    #[default]
    Isolated,
    Main,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserAction {
    pub default_icon: Option<HashMap<String, String>>,
    pub default_title: Option<String>,
    pub default_popup: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageAction {
    pub default_icon: Option<HashMap<String, String>>,
    pub default_title: Option<String>,
    pub default_popup: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptionsUI {
    pub page: String,
    pub open_in_tab: Option<bool>,
    pub browser_style: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAccessibleResource {
    pub resources: Vec<String>,
    pub matches: Option<Vec<String>>,
    pub extension_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentSecurityPolicyConfig {
    pub extension_pages: Option<String>,
    pub sandbox: Option<String>,
}

// ============================================
// Content Scripts
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentScript {
    pub id: String,
    pub extension_id: String,
    pub tab_id: String,
    pub frame_id: u32,
    pub url: String,
    pub js_files: Vec<String>,
    pub css_files: Vec<String>,
    pub run_at: RunAt,
    pub world: ScriptWorld,
    pub injected_at: i64,
    pub is_active: bool,
}

// ============================================
// Background Scripts
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackgroundContext {
    pub extension_id: String,
    pub context_id: String,
    pub script_type: BackgroundScriptType,
    pub status: BackgroundStatus,
    pub started_at: i64,
    pub last_active: i64,
    pub memory_usage: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum BackgroundScriptType {
    #[default]
    ServiceWorker,
    PersistentPage,
    EventPage,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum BackgroundStatus {
    #[default]
    Stopped,
    Starting,
    Running,
    Suspended,
    Error,
}

// ============================================
// Extension Storage
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionStorage {
    pub extension_id: String,
    pub local: HashMap<String, serde_json::Value>,
    pub sync: HashMap<String, serde_json::Value>,
    pub session: HashMap<String, serde_json::Value>,
    pub quota_bytes_local: u64,
    pub quota_bytes_sync: u64,
    pub bytes_used_local: u64,
    pub bytes_used_sync: u64,
}

impl ExtensionStorage {
    pub fn new(extension_id: String) -> Self {
        Self {
            extension_id,
            local: HashMap::new(),
            sync: HashMap::new(),
            session: HashMap::new(),
            quota_bytes_local: 10_485_760,
            quota_bytes_sync: 102_400,
            bytes_used_local: 0,
            bytes_used_sync: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum StorageArea {
    #[default]
    Local,
    Sync,
    Session,
}

// ============================================
// Extension Permissions
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionPermissions {
    pub extension_id: String,
    pub granted: Vec<String>,
    pub denied: Vec<String>,
    pub host_permissions: Vec<String>,
    pub granted_host_permissions: Vec<String>,
}

impl ExtensionPermissions {
    pub fn new(extension_id: String) -> Self {
        Self {
            extension_id,
            granted: Vec::new(),
            denied: Vec::new(),
            host_permissions: Vec::new(),
            granted_host_permissions: Vec::new(),
        }
    }
}

// ============================================
// Extension Messaging
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageHandler {
    pub id: String,
    pub extension_id: String,
    pub handler_type: MessageHandlerType,
    pub pattern: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum MessageHandlerType {
    #[default]
    Runtime,
    External,
    Port,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionMessage {
    pub id: String,
    pub source_extension_id: String,
    pub target_extension_id: Option<String>,
    pub tab_id: Option<String>,
    pub frame_id: Option<u32>,
    pub message: serde_json::Value,
    pub response_callback_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessagePort {
    pub id: String,
    pub name: String,
    pub extension_id: String,
    pub tab_id: Option<String>,
    pub frame_id: Option<u32>,
    pub sender: MessageSender,
    pub created_at: i64,
    pub is_connected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageSender {
    pub tab: Option<TabInfo>,
    pub frame_id: Option<u32>,
    pub id: Option<String>,
    pub url: Option<String>,
    pub origin: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabInfo {
    pub id: String,
    pub index: u32,
    pub url: String,
    pub title: String,
    pub active: bool,
}

// ============================================
// Extensions Config
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionsConfig {
    pub enabled: bool,
    pub developer_mode: bool,
    pub auto_update: bool,
    pub update_interval_hours: u32,
    pub max_extensions: u32,
    pub allow_external_extensions: bool,
    pub quarantine_suspicious: bool,
}

impl Default for ExtensionsConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            developer_mode: false,
            auto_update: true,
            update_interval_hours: 24,
            max_extensions: 100,
            allow_external_extensions: false,
            quarantine_suspicious: true,
        }
    }
}

// ============================================
// Tauri Commands - Extension Management
// ============================================

#[tauri::command]
pub async fn extension_install(
    state: State<'_, CubeExtensionsState>,
    app: AppHandle,
    manifest: ExtensionManifest,
    install_path: String,
) -> Result<String, String> {
    let now = chrono::Utc::now().timestamp_millis();
    let ext_id = uuid::Uuid::new_v4().to_string();
    
    let extension = Extension {
        id: ext_id.clone(),
        manifest: manifest.clone(),
        status: ExtensionStatus::Loading,
        install_path,
        installed_at: now,
        updated_at: now,
        is_enabled: true,
        error: None,
    };
    
    let mut extensions = state.extensions.write().map_err(|e| format!("Lock error: {}", e))?;
    extensions.insert(ext_id.clone(), extension.clone());
    
    let permissions = ExtensionPermissions {
        extension_id: ext_id.clone(),
        granted: manifest.permissions.clone(),
        denied: Vec::new(),
        host_permissions: manifest.host_permissions.clone(),
        granted_host_permissions: Vec::new(),
    };
    
    let mut perms = state.permissions.write().map_err(|e| format!("Lock error: {}", e))?;
    perms.insert(ext_id.clone(), permissions);
    
    let storage = ExtensionStorage::new(ext_id.clone());
    let mut storages = state.extension_storage.write().map_err(|e| format!("Lock error: {}", e))?;
    storages.insert(ext_id.clone(), storage);
    
    let _ = app.emit("extension-installed", &extension);
    
    Ok(ext_id)
}

#[tauri::command]
pub async fn extension_uninstall(
    state: State<'_, CubeExtensionsState>,
    app: AppHandle,
    extension_id: String,
) -> Result<(), String> {
    let mut extensions = state.extensions.write().map_err(|e| format!("Lock error: {}", e))?;
    extensions.remove(&extension_id);
    
    let mut storages = state.extension_storage.write().map_err(|e| format!("Lock error: {}", e))?;
    storages.remove(&extension_id);
    
    let mut perms = state.permissions.write().map_err(|e| format!("Lock error: {}", e))?;
    perms.remove(&extension_id);
    
    let mut content = state.content_scripts.write().map_err(|e| format!("Lock error: {}", e))?;
    content.remove(&extension_id);
    
    let mut background = state.background_scripts.write().map_err(|e| format!("Lock error: {}", e))?;
    background.remove(&extension_id);
    
    let _ = app.emit("extension-uninstalled", serde_json::json!({ "extensionId": extension_id }));
    
    Ok(())
}

#[tauri::command]
pub async fn extension_enable(
    state: State<'_, CubeExtensionsState>,
    app: AppHandle,
    extension_id: String,
) -> Result<(), String> {
    let mut extensions = state.extensions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(ext) = extensions.get_mut(&extension_id) {
        ext.is_enabled = true;
        ext.status = ExtensionStatus::Enabled;
        
        let _ = app.emit("extension-enabled", serde_json::json!({ "extensionId": extension_id }));
    }
    
    Ok(())
}

#[tauri::command]
pub async fn extension_disable(
    state: State<'_, CubeExtensionsState>,
    app: AppHandle,
    extension_id: String,
) -> Result<(), String> {
    let mut extensions = state.extensions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(ext) = extensions.get_mut(&extension_id) {
        ext.is_enabled = false;
        ext.status = ExtensionStatus::Disabled;
        
        let _ = app.emit("extension-disabled", serde_json::json!({ "extensionId": extension_id }));
    }
    
    Ok(())
}

#[tauri::command]
pub async fn extension_get(
    state: State<'_, CubeExtensionsState>,
    extension_id: String,
) -> Result<Option<Extension>, String> {
    let extensions = state.extensions.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(extensions.get(&extension_id).cloned())
}

#[tauri::command]
pub async fn extension_list(
    state: State<'_, CubeExtensionsState>,
) -> Result<Vec<Extension>, String> {
    let extensions = state.extensions.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(extensions.values().cloned().collect())
}

// ============================================
// Tauri Commands - Content Scripts
// ============================================

#[tauri::command]
pub async fn content_script_inject(
    state: State<'_, CubeExtensionsState>,
    app: AppHandle,
    extension_id: String,
    tab_id: String,
    frame_id: u32,
    url: String,
    js_files: Vec<String>,
    css_files: Vec<String>,
    run_at: Option<RunAt>,
    world: Option<ScriptWorld>,
) -> Result<String, String> {
    let script_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    
    let script = ContentScript {
        id: script_id.clone(),
        extension_id: extension_id.clone(),
        tab_id,
        frame_id,
        url,
        js_files,
        css_files,
        run_at: run_at.unwrap_or_default(),
        world: world.unwrap_or_default(),
        injected_at: now,
        is_active: true,
    };
    
    let mut scripts = state.content_scripts.write().map_err(|e| format!("Lock error: {}", e))?;
    let ext_scripts = scripts.entry(extension_id).or_insert_with(Vec::new);
    ext_scripts.push(script.clone());
    
    let _ = app.emit("content-script-injected", &script);
    
    Ok(script_id)
}

#[tauri::command]
pub async fn content_script_remove(
    state: State<'_, CubeExtensionsState>,
    extension_id: String,
    script_id: String,
) -> Result<(), String> {
    let mut scripts = state.content_scripts.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(ext_scripts) = scripts.get_mut(&extension_id) {
        ext_scripts.retain(|s| s.id != script_id);
    }
    
    Ok(())
}

#[tauri::command]
pub async fn content_script_list(
    state: State<'_, CubeExtensionsState>,
    extension_id: String,
) -> Result<Vec<ContentScript>, String> {
    let scripts = state.content_scripts.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(scripts.get(&extension_id).cloned().unwrap_or_default())
}

// ============================================
// Tauri Commands - Background Scripts
// ============================================

#[tauri::command]
pub async fn background_start(
    state: State<'_, CubeExtensionsState>,
    app: AppHandle,
    extension_id: String,
    script_type: Option<BackgroundScriptType>,
) -> Result<String, String> {
    let context_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    
    let context = BackgroundContext {
        extension_id: extension_id.clone(),
        context_id: context_id.clone(),
        script_type: script_type.unwrap_or_default(),
        status: BackgroundStatus::Running,
        started_at: now,
        last_active: now,
        memory_usage: 0,
    };
    
    let mut backgrounds = state.background_scripts.write().map_err(|e| format!("Lock error: {}", e))?;
    backgrounds.insert(extension_id.clone(), context.clone());
    
    let _ = app.emit("background-started", &context);
    
    Ok(context_id)
}

#[tauri::command]
pub async fn background_stop(
    state: State<'_, CubeExtensionsState>,
    app: AppHandle,
    extension_id: String,
) -> Result<(), String> {
    let mut backgrounds = state.background_scripts.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(ctx) = backgrounds.get_mut(&extension_id) {
        ctx.status = BackgroundStatus::Stopped;
        
        let _ = app.emit("background-stopped", serde_json::json!({ "extensionId": extension_id }));
    }
    
    Ok(())
}

#[tauri::command]
pub async fn background_get(
    state: State<'_, CubeExtensionsState>,
    extension_id: String,
) -> Result<Option<BackgroundContext>, String> {
    let backgrounds = state.background_scripts.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(backgrounds.get(&extension_id).cloned())
}

// ============================================
// Tauri Commands - Extension Storage
// ============================================

#[tauri::command]
pub async fn ext_storage_get(
    state: State<'_, CubeExtensionsState>,
    extension_id: String,
    area: StorageArea,
    keys: Option<Vec<String>>,
) -> Result<HashMap<String, serde_json::Value>, String> {
    let storages = state.extension_storage.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let storage = storages.get(&extension_id).ok_or("Extension storage not found")?;
    
    let data = match area {
        StorageArea::Local => &storage.local,
        StorageArea::Sync => &storage.sync,
        StorageArea::Session => &storage.session,
    };
    
    if let Some(k) = keys {
        let mut result = HashMap::new();
        for key in k {
            if let Some(value) = data.get(&key) {
                result.insert(key, value.clone());
            }
        }
        return Ok(result);
    }
    
    Ok(data.clone())
}

#[tauri::command]
pub async fn ext_storage_set(
    state: State<'_, CubeExtensionsState>,
    app: AppHandle,
    extension_id: String,
    area: StorageArea,
    items: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    let mut storages = state.extension_storage.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let storage = storages.get_mut(&extension_id).ok_or("Extension storage not found")?;
    
    let data = match area {
        StorageArea::Local => &mut storage.local,
        StorageArea::Sync => &mut storage.sync,
        StorageArea::Session => &mut storage.session,
    };
    
    for (key, value) in items.iter() {
        data.insert(key.clone(), value.clone());
    }
    
    let _ = app.emit("storage-changed", serde_json::json!({
        "extensionId": extension_id,
        "area": area,
        "changes": items
    }));
    
    Ok(())
}

#[tauri::command]
pub async fn ext_storage_remove(
    state: State<'_, CubeExtensionsState>,
    extension_id: String,
    area: StorageArea,
    keys: Vec<String>,
) -> Result<(), String> {
    let mut storages = state.extension_storage.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let storage = storages.get_mut(&extension_id).ok_or("Extension storage not found")?;
    
    let data = match area {
        StorageArea::Local => &mut storage.local,
        StorageArea::Sync => &mut storage.sync,
        StorageArea::Session => &mut storage.session,
    };
    
    for key in keys {
        data.remove(&key);
    }
    
    Ok(())
}

#[tauri::command]
pub async fn ext_storage_clear(
    state: State<'_, CubeExtensionsState>,
    extension_id: String,
    area: StorageArea,
) -> Result<(), String> {
    let mut storages = state.extension_storage.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let storage = storages.get_mut(&extension_id).ok_or("Extension storage not found")?;
    
    match area {
        StorageArea::Local => storage.local.clear(),
        StorageArea::Sync => storage.sync.clear(),
        StorageArea::Session => storage.session.clear(),
    }
    
    Ok(())
}

// ============================================
// Tauri Commands - Extension Permissions
// ============================================

#[tauri::command]
pub async fn permission_request(
    _state: State<'_, CubeExtensionsState>,
    app: AppHandle,
    extension_id: String,
    permissions: Vec<String>,
) -> Result<bool, String> {
    let _ = app.emit("permission-request", serde_json::json!({
        "extensionId": extension_id,
        "permissions": permissions
    }));
    
    Ok(true)
}

#[tauri::command]
pub async fn permission_grant(
    state: State<'_, CubeExtensionsState>,
    extension_id: String,
    permissions: Vec<String>,
) -> Result<(), String> {
    let mut perms = state.permissions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(ext_perms) = perms.get_mut(&extension_id) {
        for perm in permissions {
            if !ext_perms.granted.contains(&perm) {
                ext_perms.granted.push(perm);
            }
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn permission_revoke(
    state: State<'_, CubeExtensionsState>,
    extension_id: String,
    permissions: Vec<String>,
) -> Result<(), String> {
    let mut perms = state.permissions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(ext_perms) = perms.get_mut(&extension_id) {
        ext_perms.granted.retain(|p| !permissions.contains(p));
    }
    
    Ok(())
}

#[tauri::command]
pub async fn permission_check(
    state: State<'_, CubeExtensionsState>,
    extension_id: String,
    permission: String,
) -> Result<bool, String> {
    let perms = state.permissions.read().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(ext_perms) = perms.get(&extension_id) {
        return Ok(ext_perms.granted.contains(&permission));
    }
    
    Ok(false)
}

// ============================================
// Tauri Commands - Extension Messaging
// ============================================

#[tauri::command]
pub async fn message_send(
    _state: State<'_, CubeExtensionsState>,
    app: AppHandle,
    message: ExtensionMessage,
) -> Result<String, String> {
    let _ = app.emit("extension-message", &message);
    Ok(message.id)
}

#[tauri::command]
pub async fn port_connect(
    _state: State<'_, CubeExtensionsState>,
    app: AppHandle,
    name: String,
    extension_id: String,
    tab_id: Option<String>,
    frame_id: Option<u32>,
) -> Result<String, String> {
    let port_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    
    let port = MessagePort {
        id: port_id.clone(),
        name,
        extension_id,
        tab_id,
        frame_id,
        sender: MessageSender {
            tab: None,
            frame_id,
            id: None,
            url: None,
            origin: None,
        },
        created_at: now,
        is_connected: true,
    };
    
    let _ = app.emit("port-connected", &port);
    
    Ok(port_id)
}

#[tauri::command]
pub async fn port_disconnect(
    _state: State<'_, CubeExtensionsState>,
    app: AppHandle,
    port_id: String,
) -> Result<(), String> {
    let _ = app.emit("port-disconnected", serde_json::json!({ "portId": port_id }));
    Ok(())
}

// ============================================
// Tauri Commands - Extensions Config
// ============================================

#[tauri::command]
pub async fn extensions_get_config(
    state: State<'_, CubeExtensionsState>,
) -> Result<ExtensionsConfig, String> {
    let config = state.config.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(config.clone())
}

#[tauri::command]
pub async fn extensions_set_config(
    state: State<'_, CubeExtensionsState>,
    config: ExtensionsConfig,
) -> Result<(), String> {
    let mut current = state.config.write().map_err(|e| format!("Lock error: {}", e))?;
    *current = config;
    Ok(())
}

#[tauri::command]
pub async fn extensions_set_developer_mode(
    state: State<'_, CubeExtensionsState>,
    enabled: bool,
) -> Result<(), String> {
    let mut config = state.config.write().map_err(|e| format!("Lock error: {}", e))?;
    config.developer_mode = enabled;
    Ok(())
}
