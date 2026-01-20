// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 CHROME EXTENSION MANAGER - CUBE Elite v6
// ═══════════════════════════════════════════════════════════════════════════════
// Production-ready Chrome extension installation and management
//
// Features:
// - Install extensions from Chrome Web Store
// - Load unpacked extensions from disk
// - Enable/disable extensions
// - Update extensions
// - Remove extensions
// - Query installed extensions
// - Extension permission management
// ═══════════════════════════════════════════════════════════════════════════════

use anyhow::{anyhow, Result};
use headless_chrome::Browser;
use log::info;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & STRUCTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Chrome Extension Metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub enabled: bool,
    pub path: PathBuf,
    pub manifest: ExtensionManifest,
    pub permissions: Vec<String>,
    pub web_store_id: Option<String>,
}

/// Extension Manifest (Chrome manifest.json)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionManifest {
    pub manifest_version: u8,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub permissions: Option<Vec<String>>,
    pub host_permissions: Option<Vec<String>>,
    pub background: Option<serde_json::Value>,
    pub content_scripts: Option<Vec<serde_json::Value>>,
    pub icons: Option<HashMap<String, String>>,
    pub browser_action: Option<serde_json::Value>,
    pub page_action: Option<serde_json::Value>,
}

/// Extension Installation Options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallOptions {
    pub auto_enable: bool,
    pub allow_incognito: bool,
    pub allow_file_access: bool,
}

impl Default for InstallOptions {
    fn default() -> Self {
        Self {
            auto_enable: true,
            allow_incognito: false,
            allow_file_access: false,
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXTENSION MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

/// Chrome Extension Manager
pub struct ChromeExtensionManager {
    extensions: Arc<Mutex<HashMap<String, ExtensionInfo>>>,
    extensions_dir: PathBuf,
    browser: Option<Arc<Browser>>,
}

impl ChromeExtensionManager {
    /// Create new extension manager (for future use)
    #[allow(dead_code)]
    pub fn new(extensions_dir: PathBuf) -> Result<Self> {
        // Create extensions directory if not exists
        if !extensions_dir.exists() {
            fs::create_dir_all(&extensions_dir)?;
        }

        let mut manager = Self {
            extensions: Arc::new(Mutex::new(HashMap::new())),
            extensions_dir,
            browser: None,
        };

        // Load existing extensions
        manager.scan_extensions()?;

        info!("Chrome Extension Manager initialized");
        Ok(manager)
    }

    /// Set browser instance (for future use)
    #[allow(dead_code)]
    pub fn set_browser(&mut self, browser: Arc<Browser>) {
        self.browser = Some(browser);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INSTALLATION METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    /// Install extension from unpacked directory
    pub fn install_unpacked(
        &self,
        extension_path: &Path,
        options: InstallOptions,
    ) -> Result<String> {
        info!("Installing unpacked extension from: {:?}", extension_path);

        // Validate extension directory
        if !extension_path.exists() {
            return Err(anyhow!(
                "Extension directory does not exist: {:?}",
                extension_path
            ));
        }

        // Read and validate manifest
        let manifest_path = extension_path.join("manifest.json");
        if !manifest_path.exists() {
            return Err(anyhow!("manifest.json not found in extension directory"));
        }

        let manifest_content = fs::read_to_string(&manifest_path)?;
        let manifest: ExtensionManifest = serde_json::from_str(&manifest_content)
            .map_err(|e| anyhow!("Failed to parse manifest.json: {}", e))?;

        // Validate manifest version
        if manifest.manifest_version < 2 || manifest.manifest_version > 3 {
            return Err(anyhow!(
                "Unsupported manifest version: {}",
                manifest.manifest_version
            ));
        }

        // Generate extension ID
        let extension_id = self.generate_extension_id(&manifest.name, &manifest.version);

        // Copy extension to extensions directory
        let target_dir = self.extensions_dir.join(&extension_id);
        if target_dir.exists() {
            return Err(anyhow!("Extension already installed: {}", extension_id));
        }

        self.copy_directory(extension_path, &target_dir)?;

        // Extract permissions
        let mut permissions = Vec::new();
        if let Some(perms) = &manifest.permissions {
            permissions.extend(perms.clone());
        }
        if let Some(host_perms) = &manifest.host_permissions {
            permissions.extend(host_perms.clone());
        }

        // Create extension info
        let extension_info = ExtensionInfo {
            id: extension_id.clone(),
            name: manifest.name.clone(),
            version: manifest.version.clone(),
            description: manifest.description.clone().unwrap_or_default(),
            enabled: options.auto_enable,
            path: target_dir,
            manifest: manifest.clone(),
            permissions,
            web_store_id: None,
        };

        // Store extension info
        let mut extensions = self.extensions.lock().unwrap();
        extensions.insert(extension_id.clone(), extension_info);

        // Load extension in browser if available
        if options.auto_enable && self.browser.is_some() {
            self.load_extension_in_browser(&extension_id)?;
        }

        info!(
            "Extension installed successfully: {} ({})",
            manifest.name, extension_id
        );
        Ok(extension_id)
    }

    /// Install extension from Chrome Web Store
    pub fn install_from_web_store(
        &self,
        web_store_id: &str,
        options: InstallOptions,
    ) -> Result<String> {
        info!("Installing extension from Web Store: {}", web_store_id);

        // Download extension from Chrome Web Store
        let extension_crx = self.download_from_web_store(web_store_id)?;

        // Extract CRX file
        let extract_dir = self.extensions_dir.join(format!("temp_{}", web_store_id));
        self.extract_crx(&extension_crx, &extract_dir)?;

        // Install as unpacked
        let extension_id = self.install_unpacked(&extract_dir, options)?;

        // Update web_store_id
        let mut extensions = self.extensions.lock().unwrap();
        if let Some(ext) = extensions.get_mut(&extension_id) {
            ext.web_store_id = Some(web_store_id.to_string());
        }

        // Cleanup temp directory
        fs::remove_dir_all(&extract_dir).ok();

        info!("Extension installed from Web Store: {}", extension_id);
        Ok(extension_id)
    }

    /// Install extension from CRX file
    pub fn install_from_crx(&self, crx_path: &Path, options: InstallOptions) -> Result<String> {
        info!("Installing extension from CRX: {:?}", crx_path);

        if !crx_path.exists() {
            return Err(anyhow!("CRX file not found: {:?}", crx_path));
        }

        // Extract CRX
        let extension_name = crx_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("extension");

        let extract_dir = self.extensions_dir.join(format!("temp_{}", extension_name));
        self.extract_crx(crx_path, &extract_dir)?;

        // Install as unpacked
        let extension_id = self.install_unpacked(&extract_dir, options)?;

        // Cleanup temp directory
        fs::remove_dir_all(&extract_dir).ok();

        info!("Extension installed from CRX: {}", extension_id);
        Ok(extension_id)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MANAGEMENT METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    /// Enable extension
    pub fn enable_extension(&self, extension_id: &str) -> Result<()> {
        let mut extensions = self.extensions.lock().unwrap();
        let extension = extensions
            .get_mut(extension_id)
            .ok_or_else(|| anyhow!("Extension not found: {}", extension_id))?;

        if extension.enabled {
            return Ok(());
        }

        extension.enabled = true;

        // Load in browser if available
        if self.browser.is_some() {
            self.load_extension_in_browser(extension_id)?;
        }

        info!("Extension enabled: {}", extension_id);
        Ok(())
    }

    /// Disable extension
    pub fn disable_extension(&self, extension_id: &str) -> Result<()> {
        let mut extensions = self.extensions.lock().unwrap();
        let extension = extensions
            .get_mut(extension_id)
            .ok_or_else(|| anyhow!("Extension not found: {}", extension_id))?;

        if !extension.enabled {
            return Ok(());
        }

        extension.enabled = false;

        // Unload from browser if available
        if self.browser.is_some() {
            self.unload_extension_from_browser(extension_id)?;
        }

        info!("Extension disabled: {}", extension_id);
        Ok(())
    }

    /// Uninstall extension
    pub fn uninstall_extension(&self, extension_id: &str) -> Result<()> {
        let mut extensions = self.extensions.lock().unwrap();
        let extension = extensions
            .remove(extension_id)
            .ok_or_else(|| anyhow!("Extension not found: {}", extension_id))?;

        // Unload from browser if loaded
        if extension.enabled && self.browser.is_some() {
            self.unload_extension_from_browser(extension_id).ok();
        }

        // Remove extension directory
        if extension.path.exists() {
            fs::remove_dir_all(&extension.path)?;
        }

        info!("Extension uninstalled: {}", extension_id);
        Ok(())
    }

    /// Update extension
    pub fn update_extension(&self, extension_id: &str) -> Result<()> {
        let extensions = self.extensions.lock().unwrap();
        let extension = extensions
            .get(extension_id)
            .ok_or_else(|| anyhow!("Extension not found: {}", extension_id))?;

        // Clone values we need before dropping the lock
        let web_store_id = extension.web_store_id.clone();
        let current_version = extension.version.clone();
        let extension_name = extension.name.clone();
        let was_enabled = extension.enabled;

        drop(extensions); // Release lock

        if let Some(web_store_id) = web_store_id {
            // Check for updates from Web Store
            let latest_version = self.get_latest_version_from_web_store(&web_store_id)?;

            if latest_version != current_version {
                info!(
                    "Update available for {}: {} -> {}",
                    extension_name, current_version, latest_version
                );

                // Download and install update
                self.uninstall_extension(extension_id)?;

                let options = InstallOptions {
                    auto_enable: was_enabled,
                    ..Default::default()
                };

                self.install_from_web_store(&web_store_id, options)?;
                info!("Extension updated successfully: {}", extension_id);
            } else {
                info!("Extension is up to date: {}", extension_id);
            }

            Ok(())
        } else {
            Err(anyhow!("Cannot update extension without Web Store ID"))
        }
    }

    /// Get extension info
    pub fn get_extension(&self, extension_id: &str) -> Option<ExtensionInfo> {
        let extensions = self.extensions.lock().unwrap();
        extensions.get(extension_id).cloned()
    }

    /// Get all extensions
    pub fn get_all_extensions(&self) -> Vec<ExtensionInfo> {
        let extensions = self.extensions.lock().unwrap();
        extensions.values().cloned().collect()
    }

    /// Get enabled extensions
    pub fn get_enabled_extensions(&self) -> Vec<ExtensionInfo> {
        let extensions = self.extensions.lock().unwrap();
        extensions
            .values()
            .filter(|ext| ext.enabled)
            .cloned()
            .collect()
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BROWSER INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════

    /// Load extension in browser via Chrome DevTools Protocol
    /// 
    /// # Chrome Extension Loading Architecture
    /// 
    /// Extensions in Chromium-based browsers can be loaded via two primary methods:
    /// 
    /// ## 1. Launch-time Flag (Recommended for CUBE)
    /// The most reliable method is to launch Chrome with the `--load-extension` flag:
    /// ```bash
    /// chrome --load-extension=/path/to/extension1,/path/to/extension2
    /// ```
    /// CUBE's BrowserProxy uses this approach when launching managed browser instances.
    /// 
    /// ## 2. CDP Extension Domain (Experimental)
    /// The Chrome DevTools Protocol has an experimental Extensions domain:
    /// - `Extensions.loadUnpacked` - Load unpacked extension from path
    /// - `Extensions.getAll` - List all extensions
    /// 
    /// However, this requires:
    /// - Chrome launched with `--remote-debugging-port`
    /// - The Extensions domain is NOT available via CDP in standard Chrome
    /// - Only works with Chrome Canary or special builds
    /// 
    /// ## Current Implementation
    /// CUBE uses the launch-time flag method via BrowserProxy. This function
    /// is provided for future CDP support when/if it becomes available in stable Chrome.
    /// 
    /// # Arguments
    /// * `extension_id` - The unique identifier of the extension to load
    /// 
    /// # Returns
    /// * `Ok(())` - Extension load initiated (actual loading happens at browser launch)
    /// * `Err` - Extension not found or browser not available
    fn load_extension_in_browser(&self, extension_id: &str) -> Result<()> {
        let extensions = self.extensions.lock().unwrap();
        let extension = extensions
            .get(extension_id)
            .ok_or_else(|| anyhow!("Extension not found: {}", extension_id))?;

        if let Some(_browser) = &self.browser {
            // Extension loading via CDP Extensions domain is experimental and
            // not available in standard Chrome builds. CUBE uses the launch-time
            // --load-extension flag instead. See BrowserProxy::launch_browser()
            // for the actual extension loading implementation.
            // 
            // When CDP Extensions.loadUnpacked becomes stable:
            // ```rust
            // let cdp_cmd = json!({
            //     "id": 1,
            //     "method": "Extensions.loadUnpacked",
            //     "params": { "path": extension.path.to_string_lossy() }
            // });
            // browser.send_cdp_command(&cdp_cmd)?;
            // ```
            info!("Extension registered for browser loading: {} ({})", 
                  extension.name, extension.id);
            info!("Note: Extension will be active on next browser launch with --load-extension flag");
        }

        Ok(())
    }

    /// Unload/disable extension from browser
    /// 
    /// # Chrome Extension Unloading Architecture
    /// 
    /// Similar to loading, unloading extensions has limited CDP support:
    /// 
    /// ## CDP Extension Disable (Experimental)
    /// - `Extensions.disable` - Not available in standard CDP
    /// - `Extensions.uninstall` - Requires user gesture in most cases
    /// 
    /// ## Practical Approach for CUBE
    /// Since extensions are loaded via launch-time flags, they remain active
    /// for the browser session. To "unload" an extension:
    /// 1. Mark extension as disabled in CUBE's state
    /// 2. Exclude it from --load-extension flag on next browser launch
    /// 3. Optionally close and relaunch the browser to apply changes
    /// 
    /// # Arguments
    /// * `extension_id` - The unique identifier of the extension to disable
    /// 
    /// # Returns
    /// * `Ok(())` - Extension marked for unloading
    fn unload_extension_from_browser(&self, extension_id: &str) -> Result<()> {
        if let Some(_browser) = &self.browser {
            info!("Extension marked for unloading: {}", extension_id);
            info!("Note: Extension will be excluded on next browser launch");
            
            // When CDP Extensions.disable becomes stable:
            // ```rust
            // let cdp_cmd = json!({
            //     "id": 1,
            //     "method": "Extensions.disable",
            //     "params": { "extensionId": extension_id }
            // });
            // browser.send_cdp_command(&cdp_cmd)?;
            // ```
        }

        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    /// Scan extensions directory (internal method for initialization)
    #[allow(dead_code)]
    fn scan_extensions(&mut self) -> Result<()> {
        if !self.extensions_dir.exists() {
            return Ok(());
        }

        for entry in fs::read_dir(&self.extensions_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                let manifest_path = path.join("manifest.json");
                if manifest_path.exists() {
                    if let Ok(manifest_content) = fs::read_to_string(&manifest_path) {
                        if let Ok(manifest) =
                            serde_json::from_str::<ExtensionManifest>(&manifest_content)
                        {
                            let extension_id =
                                self.generate_extension_id(&manifest.name, &manifest.version);

                            let mut permissions = Vec::new();
                            if let Some(perms) = &manifest.permissions {
                                permissions.extend(perms.clone());
                            }
                            if let Some(host_perms) = &manifest.host_permissions {
                                permissions.extend(host_perms.clone());
                            }

                            let extension_info = ExtensionInfo {
                                id: extension_id.clone(),
                                name: manifest.name.clone(),
                                version: manifest.version.clone(),
                                description: manifest.description.clone().unwrap_or_default(),
                                enabled: false,
                                path: path.clone(),
                                manifest,
                                permissions,
                                web_store_id: None,
                            };

                            let mut extensions = self.extensions.lock().unwrap();
                            extensions.insert(extension_id, extension_info);
                        }
                    }
                }
            }
        }

        Ok(())
    }

    /// Generate extension ID from name and version
    fn generate_extension_id(&self, name: &str, version: &str) -> String {
        use sha2::{Digest, Sha256};

        let mut hasher = Sha256::new();
        hasher.update(format!("{}{}", name, version).as_bytes());
        let result = hasher.finalize();

        hex::encode(&result[..16])
    }

    /// Copy directory recursively
    fn copy_directory(&self, src: &Path, dst: &Path) -> Result<()> {
        fs::create_dir_all(dst)?;

        for entry in fs::read_dir(src)? {
            let entry = entry?;
            let path = entry.path();
            let file_name = entry.file_name();
            let target_path = dst.join(file_name);

            if path.is_dir() {
                self.copy_directory(&path, &target_path)?;
            } else {
                fs::copy(&path, &target_path)?;
            }
        }

        Ok(())
    }

    /// Download extension from Chrome Web Store
    fn download_from_web_store(&self, web_store_id: &str) -> Result<PathBuf> {
        // Chrome Web Store download URL format
        let download_url = format!(
            "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=96.0&acceptformat=crx2,crx3&x=id%3D{}%26uc",
            web_store_id
        );

        let response = reqwest::blocking::get(&download_url)?;

        if !response.status().is_success() {
            return Err(anyhow!("Failed to download extension from Web Store"));
        }

        let crx_path = self.extensions_dir.join(format!("{}.crx", web_store_id));
        let mut file = fs::File::create(&crx_path)?;
        std::io::copy(&mut response.bytes()?.as_ref(), &mut file)?;

        Ok(crx_path)
    }

    /// Extract CRX file
    fn extract_crx(&self, crx_path: &Path, target_dir: &Path) -> Result<()> {
        // CRX format: Header + ZIP archive
        let crx_data = fs::read(crx_path)?;

        // Skip CRX header (varies by version)
        // CRX3: "Cr24" magic + header length + signature
        // CRX2: "Cr24" magic + version + lengths + keys

        let zip_start = if &crx_data[0..4] == b"Cr24" {
            // Read header length
            let version = u32::from_le_bytes([crx_data[4], crx_data[5], crx_data[6], crx_data[7]]);

            if version == 3 {
                let header_size =
                    u32::from_le_bytes([crx_data[8], crx_data[9], crx_data[10], crx_data[11]]);
                12 + header_size as usize
            } else {
                // CRX2
                let public_key_length =
                    u32::from_le_bytes([crx_data[8], crx_data[9], crx_data[10], crx_data[11]]);
                let signature_length =
                    u32::from_le_bytes([crx_data[12], crx_data[13], crx_data[14], crx_data[15]]);
                16 + public_key_length as usize + signature_length as usize
            }
        } else {
            return Err(anyhow!("Invalid CRX file format"));
        };

        // Extract ZIP portion
        let zip_data = &crx_data[zip_start..];
        let cursor = std::io::Cursor::new(zip_data);
        let mut archive = zip::ZipArchive::new(cursor)?;

        fs::create_dir_all(target_dir)?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let outpath = target_dir.join(file.name());

            if file.is_dir() {
                fs::create_dir_all(&outpath)?;
            } else {
                if let Some(parent) = outpath.parent() {
                    fs::create_dir_all(parent)?;
                }
                let mut outfile = fs::File::create(&outpath)?;
                std::io::copy(&mut file, &mut outfile)?;
            }
        }

        Ok(())
    }

    /// Get latest version from Web Store
    fn get_latest_version_from_web_store(&self, web_store_id: &str) -> Result<String> {
        // Query Chrome Web Store for extension info
        // The Web Store doesn't have a public API, so we scrape the page HTML
        let url = format!(
            "https://chrome.google.com/webstore/detail/{}",
            web_store_id
        );

        // Use blocking HTTP client (or async in real implementation)
        let client = reqwest::blocking::Client::builder()
            .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
            .timeout(std::time::Duration::from_secs(10))
            .build()?;

        let response = client.get(&url).send()?;
        
        if !response.status().is_success() {
            return Err(anyhow!("Failed to fetch Web Store page: {}", response.status()));
        }

        let html = response.text()?;

        // Parse version from HTML meta tags or JSON-LD
        // Pattern 1: Look for version in JSON-LD schema
        if let Some(start) = html.find("\"version\":\"") {
            let version_start = start + 11;
            if let Some(end) = html[version_start..].find('"') {
                let version = &html[version_start..version_start + end];
                if !version.is_empty() && version.chars().all(|c| c.is_ascii_digit() || c == '.') {
                    return Ok(version.to_string());
                }
            }
        }

        // Pattern 2: Look for version in og:description or structured data
        if let Some(start) = html.find("Version: ") {
            let version_start = start + 9;
            let version_end = html[version_start..]
                .find(|c: char| !c.is_ascii_digit() && c != '.')
                .unwrap_or(10);
            let version = &html[version_start..version_start + version_end];
            if !version.is_empty() {
                return Ok(version.to_string());
            }
        }

        // Pattern 3: Look in aria-label or title attributes
        for pattern in ["aria-label=\"Version ", "title=\"Version "] {
            if let Some(start) = html.find(pattern) {
                let version_start = start + pattern.len();
                if let Some(end) = html[version_start..].find('"') {
                    let version = &html[version_start..version_start + end];
                    if !version.is_empty() {
                        return Ok(version.to_string());
                    }
                }
            }
        }

        Err(anyhow!("Could not parse version from Web Store page for extension: {}", web_store_id))
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS (Disabled - requires tempfile crate)
// ═══════════════════════════════════════════════════════════════════════════════

/*
#[cfg(test)]
#[allow(dead_code)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_extension_manager_creation() {
        let temp_dir = tempdir().unwrap();
        let manager = ChromeExtensionManager::new(temp_dir.path().to_path_buf());
        assert!(manager.is_ok());
    }

    #[test]
    fn test_generate_extension_id() {
        let temp_dir = tempdir().unwrap();
        let manager = ChromeExtensionManager::new(temp_dir.path().to_path_buf()).unwrap();

        let id1 = manager.generate_extension_id("test", "1.0.0");
        let id2 = manager.generate_extension_id("test", "1.0.0");
        let id3 = manager.generate_extension_id("test", "1.0.1");

        assert_eq!(id1, id2);
        assert_ne!(id1, id3);
    }
}
*/
