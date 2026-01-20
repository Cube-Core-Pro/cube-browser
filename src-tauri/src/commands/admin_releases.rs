// CUBE Nexum Elite - Admin Release Management Commands
// Provides backend functionality for the Update Manager
// Features: Release creation, publishing, rollout, analytics

use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration};
use uuid::Uuid;

// ============================================================
// TYPES - Release Data Structures
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Release {
    pub id: String,
    pub version: String,
    pub name: String,
    pub description: String,
    pub release_notes: String,
    pub channel: ReleaseChannel,
    pub status: ReleaseStatus,
    pub platforms: Vec<PlatformRelease>,
    pub created_at: DateTime<Utc>,
    pub published_at: Option<DateTime<Utc>>,
    pub downloads: u64,
    pub active_installs: u64,
    pub rollout_percentage: u8,
    pub min_system_requirements: SystemRequirements,
    pub changelog: Vec<ChangelogEntry>,
    pub signature: String,
    pub is_critical: bool,
    pub is_forced: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ReleaseChannel {
    Stable,
    Beta,
    Alpha,
    Canary,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ReleaseStatus {
    Draft,
    Published,
    Deprecated,
    Recalled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformRelease {
    pub platform: Platform,
    pub architecture: String,
    pub file_url: String,
    pub file_name: String,
    pub file_size: u64,
    pub checksum: String,
    pub signature: String,
    pub download_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Platform {
    Windows,
    MacOS,
    Linux,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemRequirements {
    pub min_os_version: String,
    pub min_ram: u32,
    pub min_disk: u32,
    pub required_features: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangelogEntry {
    #[serde(rename = "type")]
    pub change_type: ChangeType,
    pub title: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ChangeType {
    Feature,
    Improvement,
    Fix,
    Security,
    Breaking,
    Deprecated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReleaseStats {
    pub total_releases: u64,
    pub published_releases: u64,
    pub total_downloads: u64,
    pub active_installs: u64,
    pub avg_adoption_rate: f64,
    pub update_success_rate: f64,
    pub downloads_by_platform: HashMap<String, u64>,
    pub downloads_by_channel: HashMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSettings {
    pub auto_update_enabled: bool,
    pub update_channel: ReleaseChannel,
    pub notify_on_update: bool,
    pub download_on_metered: bool,
    pub rollout_strategy: String,
    pub maintenance_window: Option<String>,
}

// ============================================================
// STATE
// ============================================================

pub struct ReleaseState {
    pub releases: Mutex<HashMap<String, Release>>,
    pub settings: Mutex<UpdateSettings>,
    pub stats: Mutex<ReleaseStats>,
}

impl Default for ReleaseState {
    fn default() -> Self {
        let mut releases = HashMap::new();
        
        // Add sample release
        let release = Release {
            id: Uuid::new_v4().to_string(),
            version: "7.2.0".to_string(),
            name: "CUBE Nexum 7.2 - AI Enhancement".to_string(),
            description: "Major AI improvements and new automation features".to_string(),
            release_notes: "## What's New\n\n### AI Enhancements\n- Improved GPT-5.2 integration\n- New Claude 3 Opus support\n- Smart selector suggestions".to_string(),
            channel: ReleaseChannel::Stable,
            status: ReleaseStatus::Published,
            platforms: vec![
                PlatformRelease {
                    platform: Platform::Windows,
                    architecture: "x64".to_string(),
                    file_url: "/releases/v7.2.0/cube-7.2.0-win-x64.exe".to_string(),
                    file_name: "cube-7.2.0-win-x64.exe".to_string(),
                    file_size: 125_000_000,
                    checksum: "sha256:abc123...".to_string(),
                    signature: "sig:xyz789...".to_string(),
                    download_count: 15420,
                },
                PlatformRelease {
                    platform: Platform::MacOS,
                    architecture: "universal".to_string(),
                    file_url: "/releases/v7.2.0/cube-7.2.0-mac-universal.dmg".to_string(),
                    file_name: "cube-7.2.0-mac-universal.dmg".to_string(),
                    file_size: 140_000_000,
                    checksum: "sha256:def456...".to_string(),
                    signature: "sig:uvw012...".to_string(),
                    download_count: 8930,
                },
                PlatformRelease {
                    platform: Platform::Linux,
                    architecture: "x64".to_string(),
                    file_url: "/releases/v7.2.0/cube-7.2.0-linux-x64.AppImage".to_string(),
                    file_name: "cube-7.2.0-linux-x64.AppImage".to_string(),
                    file_size: 118_000_000,
                    checksum: "sha256:ghi789...".to_string(),
                    signature: "sig:rst345...".to_string(),
                    download_count: 3210,
                },
            ],
            created_at: Utc::now() - Duration::days(7),
            published_at: Some(Utc::now() - Duration::days(6)),
            downloads: 27560,
            active_installs: 24890,
            rollout_percentage: 100,
            min_system_requirements: SystemRequirements {
                min_os_version: "Windows 10 / macOS 11 / Ubuntu 20.04".to_string(),
                min_ram: 4,
                min_disk: 500,
                required_features: vec!["WebGL2".to_string()],
            },
            changelog: vec![
                ChangelogEntry {
                    change_type: ChangeType::Feature,
                    title: "GPT-5.2 Integration".to_string(),
                    description: "Full support for GPT-5.2 with extended context window".to_string(),
                },
                ChangelogEntry {
                    change_type: ChangeType::Feature,
                    title: "Claude 3 Opus Support".to_string(),
                    description: "Added Claude 3 Opus for advanced reasoning tasks".to_string(),
                },
                ChangelogEntry {
                    change_type: ChangeType::Fix,
                    title: "Memory Leak Fixed".to_string(),
                    description: "Resolved memory leak in long-running automations".to_string(),
                },
            ],
            signature: "sig:release_abc123".to_string(),
            is_critical: false,
            is_forced: false,
        };
        releases.insert(release.id.clone(), release);
        
        Self {
            releases: Mutex::new(releases),
            settings: Mutex::new(UpdateSettings {
                auto_update_enabled: true,
                update_channel: ReleaseChannel::Stable,
                notify_on_update: true,
                download_on_metered: false,
                rollout_strategy: "gradual".to_string(),
                maintenance_window: None,
            }),
            stats: Mutex::new(ReleaseStats {
                total_releases: 1,
                published_releases: 1,
                total_downloads: 27560,
                active_installs: 24890,
                avg_adoption_rate: 90.3,
                update_success_rate: 99.2,
                downloads_by_platform: {
                    let mut m = HashMap::new();
                    m.insert("windows".to_string(), 15420);
                    m.insert("macos".to_string(), 8930);
                    m.insert("linux".to_string(), 3210);
                    m
                },
                downloads_by_channel: {
                    let mut m = HashMap::new();
                    m.insert("stable".to_string(), 27560);
                    m
                },
            }),
        }
    }
}

// ============================================================
// COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateReleaseRequest {
    pub version: String,
    pub name: String,
    pub description: String,
    pub release_notes: String,
    pub channel: ReleaseChannel,
    pub changelog: Vec<ChangelogEntry>,
    pub is_critical: bool,
    pub is_forced: bool,
    pub rollout_percentage: u8,
    pub min_system_requirements: SystemRequirements,
}

#[tauri::command]
pub async fn admin_create_release(
    state: State<'_, ReleaseState>,
    request: CreateReleaseRequest,
) -> Result<Release, String> {
    let release = Release {
        id: Uuid::new_v4().to_string(),
        version: request.version,
        name: request.name,
        description: request.description,
        release_notes: request.release_notes,
        channel: request.channel,
        status: ReleaseStatus::Draft,
        platforms: Vec::new(),
        created_at: Utc::now(),
        published_at: None,
        downloads: 0,
        active_installs: 0,
        rollout_percentage: request.rollout_percentage,
        min_system_requirements: request.min_system_requirements,
        changelog: request.changelog,
        signature: format!("sig:release_{}", Uuid::new_v4().to_string().split('-').next().unwrap_or("0")),
        is_critical: request.is_critical,
        is_forced: request.is_forced,
    };
    
    let mut releases = state.releases.lock().map_err(|e| format!("Lock error: {}", e))?;
    let release_clone = release.clone();
    releases.insert(release.id.clone(), release);
    
    // Update stats
    let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    stats.total_releases += 1;
    
    Ok(release_clone)
}

#[tauri::command]
pub async fn admin_get_releases(
    state: State<'_, ReleaseState>,
    channel_filter: Option<String>,
    status_filter: Option<String>,
) -> Result<Vec<Release>, String> {
    let releases = state.releases.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let filtered: Vec<Release> = releases.values()
        .filter(|r| {
            let channel_match = channel_filter.as_ref()
                .map(|c| c == "all" || format!("{:?}", r.channel).to_lowercase() == c.to_lowercase())
                .unwrap_or(true);
            let status_match = status_filter.as_ref()
                .map(|s| s == "all" || format!("{:?}", r.status).to_lowercase() == s.to_lowercase())
                .unwrap_or(true);
            channel_match && status_match
        })
        .cloned()
        .collect();
    
    Ok(filtered)
}

#[tauri::command]
pub async fn admin_get_release(
    state: State<'_, ReleaseState>,
    release_id: String,
) -> Result<Option<Release>, String> {
    let releases = state.releases.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(releases.get(&release_id).cloned())
}

#[tauri::command]
pub async fn admin_publish_release(
    state: State<'_, ReleaseState>,
    release_id: String,
) -> Result<Release, String> {
    let mut releases = state.releases.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let release = releases.get_mut(&release_id)
        .ok_or_else(|| "Release not found".to_string())?;
    
    if release.platforms.is_empty() {
        return Err("Cannot publish release without platform binaries".to_string());
    }
    
    release.status = ReleaseStatus::Published;
    release.published_at = Some(Utc::now());
    
    let release_clone = release.clone();
    
    // Update stats
    drop(releases);
    let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    stats.published_releases += 1;
    
    Ok(release_clone)
}

#[tauri::command]
pub async fn admin_recall_release(
    state: State<'_, ReleaseState>,
    release_id: String,
    reason: String,
) -> Result<Release, String> {
    let mut releases = state.releases.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let release = releases.get_mut(&release_id)
        .ok_or_else(|| "Release not found".to_string())?;
    
    release.status = ReleaseStatus::Recalled;
    release.description = format!("{}\n\n**RECALLED**: {}", release.description, reason);
    
    let release_clone = release.clone();
    
    // Update stats
    drop(releases);
    let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    if stats.published_releases > 0 {
        stats.published_releases -= 1;
    }
    
    Ok(release_clone)
}

#[tauri::command]
pub async fn admin_update_rollout(
    state: State<'_, ReleaseState>,
    release_id: String,
    percentage: u8,
) -> Result<Release, String> {
    let mut releases = state.releases.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let release = releases.get_mut(&release_id)
        .ok_or_else(|| "Release not found".to_string())?;
    
    if percentage > 100 {
        return Err("Rollout percentage cannot exceed 100%".to_string());
    }
    
    release.rollout_percentage = percentage;
    
    Ok(release.clone())
}

#[tauri::command]
pub async fn admin_delete_release(
    state: State<'_, ReleaseState>,
    release_id: String,
) -> Result<bool, String> {
    let mut releases = state.releases.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(release) = releases.get(&release_id) {
        if release.status == ReleaseStatus::Published {
            return Err("Cannot delete a published release. Recall it first.".to_string());
        }
    }
    
    let removed = releases.remove(&release_id).is_some();
    
    if removed {
        drop(releases);
        let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
        if stats.total_releases > 0 {
            stats.total_releases -= 1;
        }
    }
    
    Ok(removed)
}

#[tauri::command]
pub async fn admin_add_platform_binary(
    state: State<'_, ReleaseState>,
    release_id: String,
    platform: Platform,
    architecture: String,
    file_name: String,
    file_size: u64,
    checksum: String,
) -> Result<Release, String> {
    let mut releases = state.releases.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let release = releases.get_mut(&release_id)
        .ok_or_else(|| "Release not found".to_string())?;
    
    // Remove existing platform binary if present
    release.platforms.retain(|p| p.platform != platform || p.architecture != architecture);
    
    // Add new platform binary
    let platform_release = PlatformRelease {
        platform: platform.clone(),
        architecture: architecture.clone(),
        file_url: format!("/releases/v{}/cube-{}-{}-{}.{}", 
            release.version,
            release.version,
            format!("{:?}", platform).to_lowercase(),
            architecture,
            match platform {
                Platform::Windows => "exe",
                Platform::MacOS => "dmg",
                Platform::Linux => "AppImage",
            }
        ),
        file_name,
        file_size,
        checksum,
        signature: format!("sig:platform_{}", Uuid::new_v4().to_string().split('-').next().unwrap_or("0")),
        download_count: 0,
    };
    
    release.platforms.push(platform_release);
    
    Ok(release.clone())
}

#[tauri::command]
pub async fn admin_get_release_stats(
    state: State<'_, ReleaseState>,
) -> Result<ReleaseStats, String> {
    let stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(stats.clone())
}

#[tauri::command]
pub async fn admin_get_update_settings(
    state: State<'_, ReleaseState>,
) -> Result<UpdateSettings, String> {
    let settings = state.settings.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(settings.clone())
}

#[tauri::command]
pub async fn admin_update_settings(
    state: State<'_, ReleaseState>,
    settings: UpdateSettings,
) -> Result<UpdateSettings, String> {
    let mut current = state.settings.lock().map_err(|e| format!("Lock error: {}", e))?;
    *current = settings.clone();
    Ok(settings)
}

#[tauri::command]
pub async fn release_record_download(
    state: State<'_, ReleaseState>,
    release_id: String,
    platform: Platform,
) -> Result<(), String> {
    let mut releases = state.releases.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(release) = releases.get_mut(&release_id) {
        release.downloads += 1;
        
        for p in &mut release.platforms {
            if p.platform == platform {
                p.download_count += 1;
                break;
            }
        }
    }
    
    // Update global stats
    drop(releases);
    let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    stats.total_downloads += 1;
    
    let platform_key = format!("{:?}", platform).to_lowercase();
    *stats.downloads_by_platform.entry(platform_key).or_insert(0) += 1;
    
    Ok(())
}
