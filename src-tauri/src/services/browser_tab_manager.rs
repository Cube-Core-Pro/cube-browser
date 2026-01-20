use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserTab {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    pub is_loading: bool,
    pub can_go_back: bool,
    pub can_go_forward: bool,
    pub is_pinned: bool,
    pub is_muted: bool,
    pub created_at: i64,
    pub last_accessed: i64,
    pub group_id: Option<String>, // NEW: Tab Groups support
}

pub struct BrowserTabManager {
    tabs: Arc<Mutex<HashMap<String, BrowserTab>>>,
    active_tab_id: Arc<Mutex<Option<String>>>, // Track active tab
    groups: Arc<Mutex<HashMap<String, crate::commands::browser::TabGroup>>>, // Tab Groups support
    reading_list: Arc<Mutex<HashMap<String, crate::commands::reading_list::ReadingListItem>>>, // Reading list
    // 
    // ═══════════════════════════════════════════════════════════════════════════
    // ARCHITECTURAL NOTE: Dedicated Services
    // ═══════════════════════════════════════════════════════════════════════════
    // 
    // The following features have been migrated to dedicated services for better
    // separation of concerns and maintainability:
    // 
    // ┌─────────────────────────┬─────────────────────────────────────────────┐
    // │ Feature                 │ Service Location                            │
    // ├─────────────────────────┼─────────────────────────────────────────────┤
    // │ Collections             │ services/collections_service.rs             │
    // │                         │ - CollectionsState in lib.rs                │
    // │                         │ - Commands: collections_* in commands/      │
    // ├─────────────────────────┼─────────────────────────────────────────────┤
    // │ Password Manager        │ commands/password_manager.rs                │
    // │                         │ - PasswordManagerState                      │
    // │                         │ - AES-256-GCM encryption                    │
    // │                         │ - Argon2 key derivation                     │
    // └─────────────────────────┴─────────────────────────────────────────────┘
    // 
    // The BrowserTabManager now focuses solely on tab management:
    // - Tab lifecycle (create, update, close)
    // - Tab groups and pinning
    // - Reading list integration
    // - Navigation state
    // 
    // ═══════════════════════════════════════════════════════════════════════════
    //
    app_handle: AppHandle,
}

impl BrowserTabManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            tabs: Arc::new(Mutex::new(HashMap::new())),
            groups: Arc::new(Mutex::new(HashMap::new())),
            reading_list: Arc::new(Mutex::new(HashMap::new())),
            app_handle,
            active_tab_id: Arc::new(Mutex::new(None)),
        }
    }

    /// Creates a new browser tab with WebView
    pub fn create_tab(&self, url: String) -> Result<String> {
        let tab_id = format!("tab-{}", uuid::Uuid::new_v4());
        let now = chrono::Utc::now().timestamp();

        // Create tab record
        let tab = BrowserTab {
            id: tab_id.clone(),
            url: url.clone(),
            title: "Loading...".to_string(),
            favicon: None,
            is_loading: true,
            can_go_back: false,
            can_go_forward: false,
            is_pinned: false,
            is_muted: false,
            created_at: now,
            last_accessed: now,
            group_id: None, // NEW: Initialize as ungrouped
        };

        // Store tab
        {
            let mut tabs = self.tabs.lock().unwrap();
            tabs.insert(tab_id.clone(), tab.clone());
        }

        // FIXED: Don't create new window - emit tab creation event to main window
        // Main window will handle rendering tabs in a single window

        // Set as active tab if it's the first one or if requested
        {
            let mut active = self.active_tab_id.lock().unwrap();
            if active.is_none() {
                *active = Some(tab_id.clone());
            }
        }

        // Emit tab creation event to main window
        let _ = self.app_handle.emit("tab-created", tab.clone());

        // Schedule script injection after page loads
        self.schedule_script_injection(&tab_id);

        // Emit event
        let _ = self.app_handle.emit("tab-created", &tab);

        Ok(tab_id)
    }

    /// Navigate tab to URL
    pub fn navigate(&self, tab_id: &str, url: String) -> Result<()> {
        // Update tab state
        {
            let mut tabs = self.tabs.lock().unwrap();
            if let Some(tab) = tabs.get_mut(tab_id) {
                tab.url = url.clone();
                tab.is_loading = true;
                tab.last_accessed = chrono::Utc::now().timestamp();
            }
        }

        // Navigate window
        let window_label = format!("browser-tab-{}", tab_id);
        if let Some(window) = self.app_handle.get_webview_window(&window_label) {
            // Note: Tauri 1.x doesn't have direct URL navigation for existing windows
            // Need to use eval to navigate
            let js = format!(r#"window.location.href = "{}";"#, url);
            let _ = window.eval(&js);
        }

        Ok(())
    }

    /// Reload tab
    pub fn reload(&self, tab_id: &str) -> Result<()> {
        let window_label = format!("browser-tab-{}", tab_id);
        if let Some(window) = self.app_handle.get_webview_window(&window_label) {
            let _ = window.eval("window.location.reload();");
        }
        Ok(())
    }

    /// Go back
    pub fn go_back(&self, tab_id: &str) -> Result<()> {
        let window_label = format!("browser-tab-{}", tab_id);
        if let Some(window) = self.app_handle.get_webview_window(&window_label) {
            let _ = window.eval("window.history.back();");
        }
        Ok(())
    }

    /// Go forward
    pub fn go_forward(&self, tab_id: &str) -> Result<()> {
        let window_label = format!("browser-tab-{}", tab_id);
        if let Some(window) = self.app_handle.get_webview_window(&window_label) {
            let _ = window.eval("window.history.forward();");
        }
        Ok(())
    }

    /// Stop loading
    pub fn stop(&self, tab_id: &str) -> Result<()> {
        let window_label = format!("browser-tab-{}", tab_id);
        if let Some(window) = self.app_handle.get_webview_window(&window_label) {
            let _ = window.eval("window.stop();");
        }
        Ok(())
    }

    /// Close tab
    pub fn close_tab(&self, tab_id: &str) -> Result<()> {
        // Remove from tabs
        {
            let mut tabs = self.tabs.lock().unwrap();
            tabs.remove(tab_id);
        }

        // FIXED: Don't close window - emit close event to main window
        let _ = self.app_handle.emit("tab-closed", tab_id);

        // If this was active tab, activate another
        {
            let mut active = self.active_tab_id.lock().unwrap();
            if active.as_ref() == Some(&tab_id.to_string()) {
                *active = None;
                // Get first available tab ID before activating
                let next_tab_id = {
                    let tabs = self.tabs.lock().unwrap();
                    tabs.iter().next().map(|(id, _)| id.clone())
                };

                // Activate if found
                if let Some(next_id) = next_tab_id {
                    let _ = self.activate_tab(&next_id);
                }
            }
        }

        Ok(())
    }

    /// Activate tab (switch to tab in main window)
    pub fn activate_tab(&self, tab_id: &str) -> Result<()> {
        // FIXED: No window switching - emit event to main window

        // Update active tab
        {
            let mut active = self.active_tab_id.lock().unwrap();
            *active = Some(tab_id.to_string());
        }

        // Update last accessed time
        {
            let mut tabs = self.tabs.lock().unwrap();
            if let Some(tab) = tabs.get_mut(tab_id) {
                tab.last_accessed = chrono::Utc::now().timestamp();
            }
        }

        // Emit tab activation event to main window
        let _ = self.app_handle.emit("tab-activated", tab_id);

        Ok(())
    }

    /// Execute JavaScript in tab
    pub fn execute_js(&self, tab_id: &str, code: &str) -> Result<()> {
        let window_label = format!("browser-tab-{}", tab_id);
        if let Some(window) = self.app_handle.get_webview_window(&window_label) {
            let _ = window.eval(code);
        }
        Ok(())
    }

    /// Get tab info
    pub fn get_tab(&self, tab_id: &str) -> Option<BrowserTab> {
        let tabs = self.tabs.lock().unwrap();
        tabs.get(tab_id).cloned()
    }

    /// Get all tabs
    pub fn get_all_tabs(&self) -> Vec<BrowserTab> {
        let tabs = self.tabs.lock().unwrap();
        tabs.values().cloned().collect()
    }

    /// Get active tab ID
    pub fn get_active_tab_id(&self) -> Option<String> {
        let active = self.active_tab_id.lock().unwrap();
        active.clone()
    }

    /// Set tab pinned state
    pub fn set_pinned(&self, tab_id: &str, pinned: bool) -> Result<()> {
        let mut tabs = self.tabs.lock().unwrap();
        if let Some(tab) = tabs.get_mut(tab_id) {
            tab.is_pinned = pinned;
        }
        Ok(())
    }

    /// Set tab muted state
    pub fn set_muted(&self, tab_id: &str, muted: bool) -> Result<()> {
        let mut tabs = self.tabs.lock().unwrap();
        if let Some(tab) = tabs.get_mut(tab_id) {
            tab.is_muted = muted;
        }
        Ok(())
    }

    /// Update tab title (called from webview)
    pub fn update_title(&self, tab_id: &str, title: String) -> Result<()> {
        let mut tabs = self.tabs.lock().unwrap();
        if let Some(tab) = tabs.get_mut(tab_id) {
            tab.title = title;
        }
        Ok(())
    }

    /// Update tab URL (called from webview)
    pub fn update_url(&self, tab_id: &str, url: String) -> Result<()> {
        let mut tabs = self.tabs.lock().unwrap();
        if let Some(tab) = tabs.get_mut(tab_id) {
            tab.url = url;
        }
        Ok(())
    }

    /// Set loading state
    pub fn set_loading(&self, tab_id: &str, loading: bool) -> Result<()> {
        let mut tabs = self.tabs.lock().unwrap();
        if let Some(tab) = tabs.get_mut(tab_id) {
            tab.is_loading = loading;
        }
        Ok(())
    }

    /// Schedule script injection after page load
    fn schedule_script_injection(&self, tab_id: &str) {
        let app_handle = self.app_handle.clone();
        let tab_id = tab_id.to_string();

        std::thread::spawn(move || {
            // Wait for page to load
            std::thread::sleep(std::time::Duration::from_millis(1500));

            let window_label = format!("browser-tab-{}", tab_id);
            if let Some(window) = app_handle.get_webview_window(&window_label) {
                // Inject Chrome extension scripts
                let scripts = vec![
                    include_str!("../../../chrome-extension/smart-autofill-engine-v6.js"),
                    include_str!("../../../chrome-extension/universal-parsers-v6.js"),
                    include_str!("../../../chrome-extension/universal-document-engine-v6.js"),
                    include_str!("../../../chrome-extension/advanced-detection-algorithms.js"),
                    include_str!("../../../chrome-extension/pdf-download-engine-ultimate.js"),
                    include_str!("../../../chrome-extension/ocr-engine-tesseract.js"),
                    include_str!("../../../chrome-extension/lendingpad-detector.js"),
                    include_str!("../../../chrome-extension/content-script-v6.js"),
                    include_str!("../../../chrome-extension/content-script-v6-elite.js"),
                ];

                // Create CUBE API bridge for Chrome compatibility
                let api_bridge = r#"
                    (function() {
                        if (window.__CUBE_EXTENSION_BRIDGE__) {
                            return;
                        }

                        const ensureInvoke = () => {
                            if (!window.__TAURI__ || typeof window.__TAURI__.invoke !== 'function') {
                                throw new Error('Tauri invoke API is not available');
                            }
                            return window.__TAURI__.invoke;
                        };

                        const invoke = (command, payload) => {
                            try {
                                return ensureInvoke()(command, payload || {});
                            } catch (error) {
                                return Promise.reject(error);
                            }
                        };

                        const runtimeListeners = new Set();

                        const runtime = {
                            sendMessage(message, responseCallback) {
                                return invoke('chrome_extension_runtime_send_message', { message })
                                    .then((response) => {
                                        if (typeof responseCallback === 'function') {
                                            responseCallback(response);
                                        }
                                        return response;
                                    })
                                    .catch((error) => {
                                        console.error('[CUBE] runtime.sendMessage failed', error);
                                        const fallback = { success: false, error: error?.message || String(error) };
                                        if (typeof responseCallback === 'function') {
                                            responseCallback(fallback);
                                        }
                                        return fallback;
                                    });
                            },
                            onMessage: {
                                addListener(handler) {
                                    if (typeof handler === 'function') {
                                        runtimeListeners.add(handler);
                                    }
                                },
                                removeListener(handler) {
                                    runtimeListeners.delete(handler);
                                },
                                hasListener(handler) {
                                    return runtimeListeners.has(handler);
                                }
                            },
                            getManifest: () => ({ name: 'cube-elite-bridge', version: '6.0.1' }),
                            getURL: (path) => path || ''
                        };

                        window.addEventListener('cube-extension-runtime-message', (event) => {
                            runtimeListeners.forEach((handler) => {
                                try {
                                    handler(event.detail, {}, () => {});
                                } catch (listenerError) {
                                    console.error('[CUBE] runtime listener failed', listenerError);
                                }
                            });
                        });

                        const storage = {
                            local: {
                                get(query, callback) {
                                    return invoke('chrome_extension_storage_get', { query: query ?? null })
                                        .then((result) => {
                                            if (typeof callback === 'function') {
                                                callback(result);
                                            }
                                            return result;
                                        })
                                        .catch((error) => {
                                            console.error('[CUBE] storage.get failed', error);
                                            if (typeof callback === 'function') {
                                                callback({});
                                            }
                                            return {};
                                        });
                                },
                                set(items, callback) {
                                    return invoke('chrome_extension_storage_set', { items })
                                        .then((result) => {
                                            if (typeof callback === 'function') {
                                                callback(result);
                                            }
                                            return result;
                                        })
                                        .catch((error) => {
                                            console.error('[CUBE] storage.set failed', error);
                                            const fallback = { success: false };
                                            if (typeof callback === 'function') {
                                                callback(fallback);
                                            }
                                            return fallback;
                                        });
                                },
                                clear(callback) {
                                    return invoke('chrome_extension_storage_clear')
                                        .then((result) => {
                                            if (typeof callback === 'function') {
                                                callback(result);
                                            }
                                            return result;
                                        })
                                        .catch((error) => {
                                            console.error('[CUBE] storage.clear failed', error);
                                            const fallback = { success: false };
                                            if (typeof callback === 'function') {
                                                callback(fallback);
                                            }
                                            return fallback;
                                        });
                                }
                            }
                        };

                        const noopAsync = () => Promise.resolve();

                        const action = {
                            setBadgeText: noopAsync,
                            setBadgeBackgroundColor: noopAsync,
                            setTitle: noopAsync
                        };

                        const sidePanel = {
                            open: noopAsync,
                            setPanelBehavior: noopAsync
                        };

                        const notifications = {
                            create: noopAsync
                        };

                        window.__CUBE_EXTENSION_BRIDGE__ = {
                            runtime,
                            storage,
                            action,
                            sidePanel,
                            notifications
                        };

                        window.chrome = Object.assign({}, window.chrome || {}, window.__CUBE_EXTENSION_BRIDGE__);
                    })();
                "#;

                let _ = window.eval(api_bridge);

                // Inject all scripts
                for script in scripts {
                    let _ = window.eval(script);
                }
            }
        });
    }

    // ========================================================================
    // TAB GROUPS SUPPORT - REAL IMPLEMENTATION
    // ========================================================================

    pub fn add_group(&self, group: crate::commands::browser::TabGroup) -> Result<()> {
        let mut groups = self.groups.lock().unwrap();
        groups.insert(group.id.clone(), group);
        Ok(())
    }

    pub fn add_tab_to_group(&self, tab_id: &str, group_id: &str) -> Result<()> {
        // Update tab's group_id
        let mut tabs = self.tabs.lock().unwrap();
        if let Some(tab) = tabs.get_mut(tab_id) {
            tab.group_id = Some(group_id.to_string());
        } else {
            return Err(anyhow::anyhow!("Tab not found"));
        }

        // Add tab_id to group's tab_ids
        let mut groups = self.groups.lock().unwrap();
        if let Some(group) = groups.get_mut(group_id) {
            if !group.tab_ids.contains(&tab_id.to_string()) {
                group.tab_ids.push(tab_id.to_string());
            }
        } else {
            return Err(anyhow::anyhow!("Group not found"));
        }

        Ok(())
    }

    pub fn remove_tab_from_group(&self, tab_id: &str) -> Result<()> {
        // Get tab's group_id before clearing it
        let group_id = {
            let tabs = self.tabs.lock().unwrap();
            tabs.get(tab_id).and_then(|t| t.group_id.clone())
        };

        // Clear tab's group_id
        let mut tabs = self.tabs.lock().unwrap();
        if let Some(tab) = tabs.get_mut(tab_id) {
            tab.group_id = None;
        }

        // Remove tab_id from group's tab_ids
        if let Some(gid) = group_id {
            let mut groups = self.groups.lock().unwrap();
            if let Some(group) = groups.get_mut(&gid) {
                group.tab_ids.retain(|id| id != tab_id);
            }
        }

        Ok(())
    }

    pub fn rename_group(&self, group_id: &str, new_title: String) -> Result<()> {
        let mut groups = self.groups.lock().unwrap();
        if let Some(group) = groups.get_mut(group_id) {
            group.title = new_title;
            Ok(())
        } else {
            Err(anyhow::anyhow!("Group not found"))
        }
    }

    pub fn change_group_color(&self, group_id: &str, new_color: String) -> Result<()> {
        let mut groups = self.groups.lock().unwrap();
        if let Some(group) = groups.get_mut(group_id) {
            group.color = new_color;
            Ok(())
        } else {
            Err(anyhow::anyhow!("Group not found"))
        }
    }

    pub fn toggle_group_collapsed(&self, group_id: &str) -> Result<()> {
        let mut groups = self.groups.lock().unwrap();
        if let Some(group) = groups.get_mut(group_id) {
            group.collapsed = !group.collapsed;
            Ok(())
        } else {
            Err(anyhow::anyhow!("Group not found"))
        }
    }

    pub fn delete_group(&self, group_id: &str) -> Result<()> {
        // Remove group_id from all tabs in the group
        let tab_ids = {
            let groups = self.groups.lock().unwrap();
            groups.get(group_id).map(|g| g.tab_ids.clone())
        };

        if let Some(tab_ids) = tab_ids {
            let mut tabs = self.tabs.lock().unwrap();
            for tab_id in tab_ids {
                if let Some(tab) = tabs.get_mut(&tab_id) {
                    tab.group_id = None;
                }
            }
        }

        // Delete the group
        let mut groups = self.groups.lock().unwrap();
        groups.remove(group_id);

        Ok(())
    }

    pub fn get_all_groups(&self) -> Result<Vec<crate::commands::browser::TabGroup>> {
        let groups = self.groups.lock().unwrap();
        Ok(groups.values().cloned().collect())
    }

    pub fn get_group(&self, group_id: &str) -> Option<crate::commands::browser::TabGroup> {
        let groups = self.groups.lock().unwrap();
        groups.get(group_id).cloned()
    }

    // ========================================================================
    // READING LIST SUPPORT
    // ========================================================================

    pub fn add_reading_list_item(
        &self,
        item: crate::commands::reading_list::ReadingListItem,
    ) -> Result<()> {
        let mut reading_list = self.reading_list.lock().unwrap();
        reading_list.insert(item.id.clone(), item);
        Ok(())
    }

    pub fn remove_reading_list_item(&self, item_id: &str) -> Result<()> {
        let mut reading_list = self.reading_list.lock().unwrap();
        reading_list.remove(item_id);
        Ok(())
    }

    pub fn mark_reading_list_item_read(&self, item_id: &str, is_read: bool) -> Result<()> {
        let mut reading_list = self.reading_list.lock().unwrap();
        if let Some(item) = reading_list.get_mut(item_id) {
            item.is_read = is_read;
            if is_read {
                item.read_at = Some(
                    std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_secs() as i64,
                );
            } else {
                item.read_at = None;
            }
            Ok(())
        } else {
            Err(anyhow::anyhow!("Reading list item not found"))
        }
    }

    pub fn get_reading_list(&self) -> Result<Vec<crate::commands::reading_list::ReadingListItem>> {
        let reading_list = self.reading_list.lock().unwrap();
        let mut items: Vec<_> = reading_list.values().cloned().collect();
        // Sort by date added (newest first)
        items.sort_by(|a, b| b.added_at.cmp(&a.added_at));
        Ok(items)
    }

    pub fn get_reading_list_item(
        &self,
        item_id: &str,
    ) -> Option<crate::commands::reading_list::ReadingListItem> {
        let reading_list = self.reading_list.lock().unwrap();
        reading_list.get(item_id).cloned()
    }

    pub fn add_tags_to_reading_item(&self, item_id: &str, tags: Vec<String>) -> Result<()> {
        let mut reading_list = self.reading_list.lock().unwrap();
        if let Some(item) = reading_list.get_mut(item_id) {
            for tag in tags {
                if !item.tags.contains(&tag) {
                    item.tags.push(tag);
                }
            }
            Ok(())
        } else {
            Err(anyhow::anyhow!("Reading list item not found"))
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LEGACY CODE MIGRATION NOTICE
    // ═══════════════════════════════════════════════════════════════════════════
    // 
    // Collections and Password Manager functionality has been migrated to
    // dedicated services for better separation of concerns:
    // 
    // COLLECTIONS:
    //   - Service: services/collections_service.rs
    //   - State: CollectionsState (managed in lib.rs)
    //   - Commands: commands/collections.rs
    //     - collection_create, collection_get, collection_update
    //     - collection_delete, collection_add_page, collection_remove_page
    //     - collection_share, collection_unshare
    // 
    // PASSWORD MANAGER:
    //   - Service: commands/password_manager.rs
    //   - State: PasswordManagerState (managed in lib.rs)
    //   - Security: AES-256-GCM encryption, Argon2 key derivation
    //   - Commands: 
    //     - password_manager_set_master_password
    //     - password_manager_add_entry, password_manager_get_entries
    //     - password_manager_update_entry, password_manager_delete_entry
    //     - password_manager_search_by_url, password_manager_generate
    // 
    // This separation improves:
    //   1. Code maintainability and testing
    //   2. Security isolation for sensitive operations
    //   3. Single responsibility principle
    //   4. Independent service lifecycle management
    // 
    // ═══════════════════════════════════════════════════════════════════════════

    // === ASYNC WRAPPERS FOR SESSION PERSISTENCE ===

    pub async fn get_all_tab_groups(
        &self,
    ) -> Result<Vec<crate::commands::browser::TabGroup>, String> {
        self.get_all_groups().map_err(|e| e.to_string())
    }

    pub async fn add_tab_group(
        &self,
        group: crate::commands::browser::TabGroup,
    ) -> Result<(), String> {
        self.add_group(group).map_err(|e| e.to_string())
    }

    pub async fn add_tab_to_group_async(
        &self,
        tab_id: String,
        group_id: String,
    ) -> Result<(), String> {
        self.add_tab_to_group(&tab_id, &group_id)
            .map_err(|e| e.to_string())
    }

    pub async fn remove_tab_from_group_async(&self, tab_id: String) -> Result<(), String> {
        self.remove_tab_from_group(&tab_id)
            .map_err(|e| e.to_string())
    }

    pub async fn toggle_group_collapsed_async(&self, group_id: String) -> Result<(), String> {
        self.toggle_group_collapsed(&group_id)
            .map_err(|e| e.to_string())
    }

    pub async fn rename_tab_group_async(
        &self,
        group_id: String,
        new_title: String,
    ) -> Result<(), String> {
        self.rename_group(&group_id, new_title)
            .map_err(|e| e.to_string())
    }

    pub async fn change_group_color_async(
        &self,
        group_id: String,
        new_color: String,
    ) -> Result<(), String> {
        self.change_group_color(&group_id, new_color)
            .map_err(|e| e.to_string())
    }

    pub async fn delete_tab_group_async(&self, group_id: String) -> Result<(), String> {
        self.delete_group(&group_id).map_err(|e| e.to_string())
    }

    pub async fn get_group_tabs_async(&self, group_id: String) -> Result<Vec<String>, String> {
        if let Some(group) = self.get_group(&group_id) {
            Ok(group.tab_ids)
        } else {
            Err("Group not found".to_string())
        }
    }

    pub async fn get_reading_list_items(
        &self,
    ) -> Result<Vec<crate::commands::reading_list::ReadingListItem>, String> {
        self.get_reading_list().map_err(|e| e.to_string())
    }

    pub async fn add_reading_list_item_async(
        &self,
        item: crate::commands::reading_list::ReadingListItem,
    ) -> Result<(), String> {
        self.add_reading_list_item(item).map_err(|e| e.to_string())
    }

    // ========================================================================
    // DEPRECATED: Collections Integration (Migrated to CollectionsService)
    // ========================================================================
    // These methods have been moved to the dedicated CollectionsService module
    // which provides full CRUD operations, hierarchical organization, and
    // PostgreSQL-backed persistence. The methods below were removed during
    // CUBE Elite v6 architecture refactoring.
    // 
    // For collections functionality, use:
    // - commands/collections.rs - Tauri commands
    // - services/collections_service.rs - Backend service
    // - lib/services/collection-service.ts - Frontend service
    // ========================================================================

    // ========================================================================
    // DEPRECATED: Password Integration (Migrated to PasswordService)
    // ========================================================================
    // Password management has been migrated to the dedicated PasswordService
    // which provides secure AES-256-GCM encryption, autofill integration,
    // and breach monitoring. The methods below were removed during the
    // CUBE Elite v6 security hardening refactoring.
    //
    // For password functionality, use:
    // - commands/password_manager.rs - Tauri commands
    // - services/password_service.rs - Backend service
    // - lib/services/password-manager-service.ts - Frontend service
    // ========================================================================
}
