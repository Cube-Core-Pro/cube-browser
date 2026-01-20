// ============================================================================
// PASSWORD MANAGER - Advanced Features
// ============================================================================
// CLI Access, Dark Web Monitor, Family Vaults, Passkeys, SSH Keys,
// Secure Send, Username Generator, Vault Health, Watchtower

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ============================================================================
// CLI ACCESS TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CLISession {
    pub id: String,
    pub name: String,
    pub device_type: String,
    pub device_name: String,
    pub ip_address: String,
    pub location: String,
    pub last_active_at: u64,
    pub created_at: u64,
    pub status: String,
    pub command_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct APIToken {
    pub id: String,
    pub name: String,
    pub token: String,
    pub permissions: Vec<String>,
    pub created_at: u64,
    pub last_used_at: Option<u64>,
    pub expires_at: u64,
    pub usage_count: u32,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CLICommand {
    pub id: String,
    pub command: String,
    pub timestamp: u64,
    pub success: bool,
    pub output: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CLIAccessConfig {
    pub sessions: Vec<CLISession>,
    pub tokens: Vec<APIToken>,
    pub command_history: Vec<CLICommand>,
}

pub struct CLIAccessState {
    config: Mutex<CLIAccessConfig>,
}

impl Default for CLIAccessState {
    fn default() -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        Self {
            config: Mutex::new(CLIAccessConfig {
                sessions: vec![
                    CLISession { id: String::from("session-1"), name: String::from("MacBook Pro - Terminal"), device_type: String::from("desktop"), device_name: String::from("MacBook Pro 16\""), ip_address: String::from("192.168.1.100"), location: String::from("San Francisco, CA"), last_active_at: now, created_at: now - 10 * 24 * 60 * 60, status: String::from("active"), command_count: 156 },
                    CLISession { id: String::from("session-2"), name: String::from("Linux Server - SSH"), device_type: String::from("server"), device_name: String::from("AWS EC2 Instance"), ip_address: String::from("54.123.45.67"), location: String::from("us-west-2"), last_active_at: now - 30 * 60, created_at: now - 15 * 24 * 60 * 60, status: String::from("active"), command_count: 89 },
                ],
                tokens: vec![
                    APIToken { id: String::from("token-1"), name: String::from("CI/CD Pipeline"), token: String::from("cube_token_xxxxxxxxxxxxxxxxxxxx"), permissions: vec![String::from("read"), String::from("write")], created_at: now - 15 * 24 * 60 * 60, last_used_at: Some(now), expires_at: now + 180 * 24 * 60 * 60, usage_count: 1234, is_active: true },
                    APIToken { id: String::from("token-2"), name: String::from("Backup Script"), token: String::from("cube_token_yyyyyyyyyyyyyyyyyyyy"), permissions: vec![String::from("read")], created_at: now - 20 * 24 * 60 * 60, last_used_at: Some(now - 24 * 60 * 60), expires_at: now + 90 * 24 * 60 * 60, usage_count: 567, is_active: true },
                ],
                command_history: vec![
                    CLICommand { id: String::from("cmd-1"), command: String::from("cube vault list"), timestamp: now, success: true, output: String::from("Found 156 items in vault") },
                    CLICommand { id: String::from("cmd-2"), command: String::from("cube item get login/github"), timestamp: now - 5 * 60, success: true, output: String::from("Item retrieved successfully") },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_cli_access_config(state: State<'_, CLIAccessState>) -> Result<CLIAccessConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn revoke_cli_session(session_id: String, state: State<'_, CLIAccessState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.sessions.retain(|s| s.id != session_id);
    Ok(())
}

#[tauri::command]
pub async fn create_api_token(name: String, permissions: Vec<String>, state: State<'_, CLIAccessState>) -> Result<APIToken, String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
    let token = APIToken {
        id: format!("token-{}", now),
        name,
        token: format!("cube_token_{}", uuid::Uuid::new_v4().to_string().replace("-", "")),
        permissions,
        created_at: now,
        last_used_at: None,
        expires_at: now + 90 * 24 * 60 * 60,
        usage_count: 0,
        is_active: true,
    };
    config.tokens.push(token.clone());
    Ok(token)
}

#[tauri::command]
pub async fn revoke_api_token(token_id: String, state: State<'_, CLIAccessState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    for token in &mut config.tokens {
        if token.id == token_id {
            token.is_active = false;
            return Ok(());
        }
    }
    Err(String::from("Token not found"))
}

// ============================================================================
// DARK WEB MONITOR TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DarkWebBreach {
    pub id: String,
    pub source: String,
    pub breach_date: u64,
    pub discovered_date: u64,
    pub compromised_data: Vec<String>,
    pub severity: String,
    pub is_resolved: bool,
    pub affected_email: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DarkWebMonitorConfig {
    pub is_enabled: bool,
    pub monitored_emails: Vec<String>,
    pub breaches: Vec<DarkWebBreach>,
    pub last_scan: u64,
    pub total_breaches_found: u32,
    pub resolved_breaches: u32,
}

pub struct DarkWebMonitorState {
    config: Mutex<DarkWebMonitorConfig>,
}

impl Default for DarkWebMonitorState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(DarkWebMonitorConfig {
                is_enabled: true,
                monitored_emails: vec![String::from("user@example.com"), String::from("work@company.com")],
                breaches: vec![
                    DarkWebBreach { id: String::from("breach-1"), source: String::from("LinkedInData2024"), breach_date: now - 180 * 24 * 60 * 60, discovered_date: now - 30 * 24 * 60 * 60, compromised_data: vec![String::from("email"), String::from("password"), String::from("name")], severity: String::from("high"), is_resolved: false, affected_email: String::from("user@example.com"), description: String::from("Large-scale data breach affecting millions of users") },
                    DarkWebBreach { id: String::from("breach-2"), source: String::from("DropboxHack2024"), breach_date: now - 365 * 24 * 60 * 60, discovered_date: now - 300 * 24 * 60 * 60, compromised_data: vec![String::from("email"), String::from("password")], severity: String::from("critical"), is_resolved: true, affected_email: String::from("user@example.com"), description: String::from("Cloud storage credentials exposed") },
                ],
                last_scan: now - 60 * 60,
                total_breaches_found: 5,
                resolved_breaches: 3,
            }),
        }
    }
}

#[tauri::command]
pub async fn get_darkweb_monitor_config(state: State<'_, DarkWebMonitorState>) -> Result<DarkWebMonitorConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_darkweb_monitor(enabled: bool, state: State<'_, DarkWebMonitorState>) -> Result<bool, String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.is_enabled = enabled;
    Ok(enabled)
}

#[tauri::command]
pub async fn add_monitored_email(email: String, state: State<'_, DarkWebMonitorState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if !config.monitored_emails.contains(&email) {
        config.monitored_emails.push(email);
    }
    Ok(())
}

#[tauri::command]
pub async fn resolve_breach(breach_id: String, state: State<'_, DarkWebMonitorState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    for breach in &mut config.breaches {
        if breach.id == breach_id {
            breach.is_resolved = true;
            config.resolved_breaches += 1;
            return Ok(());
        }
    }
    Err(String::from("Breach not found"))
}

// ============================================================================
// SSH KEY MANAGER TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SSHKey {
    pub id: String,
    pub name: String,
    pub key_type: String,
    pub fingerprint: String,
    pub public_key: String,
    pub created_at: u64,
    pub last_used: Option<u64>,
    pub servers: Vec<String>,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SSHKeyConfig {
    pub keys: Vec<SSHKey>,
}

pub struct SSHKeyState {
    config: Mutex<SSHKeyConfig>,
}

impl Default for SSHKeyState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(SSHKeyConfig {
                keys: vec![
                    SSHKey { id: String::from("ssh-1"), name: String::from("Personal Key"), key_type: String::from("ed25519"), fingerprint: String::from("SHA256:xxxxxxxxxxxxxxxxxxx"), public_key: String::from("ssh-ed25519 AAAA..."), created_at: now - 180 * 24 * 60 * 60, last_used: Some(now - 2 * 60 * 60), servers: vec![String::from("github.com"), String::from("gitlab.com")], is_default: true },
                    SSHKey { id: String::from("ssh-2"), name: String::from("Work Key"), key_type: String::from("rsa-4096"), fingerprint: String::from("SHA256:yyyyyyyyyyyyyyyyyyy"), public_key: String::from("ssh-rsa AAAA..."), created_at: now - 90 * 24 * 60 * 60, last_used: Some(now - 24 * 60 * 60), servers: vec![String::from("aws.amazon.com"), String::from("internal.company.com")], is_default: false },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_vault_ssh_keys(state: State<'_, SSHKeyState>) -> Result<SSHKeyConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn delete_vault_ssh_key(key_id: String, state: State<'_, SSHKeyState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.keys.retain(|k| k.id != key_id);
    Ok(())
}

// ============================================================================
// PASSKEY MANAGER TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Passkey {
    pub id: String,
    pub name: String,
    pub relying_party: String,
    pub relying_party_id: String,
    pub username: String,
    pub user_display_name: String,
    pub created_at: u64,
    pub last_used: Option<u64>,
    pub credential_id: String,
    pub public_key_algorithm: String,
    pub is_discoverable: bool,
    pub is_synced: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyConfig {
    pub passkeys: Vec<Passkey>,
}

pub struct PasskeyState {
    config: Mutex<PasskeyConfig>,
}

impl Default for PasskeyState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(PasskeyConfig {
                passkeys: vec![
                    Passkey { id: String::from("pk-1"), name: String::from("GitHub Account"), relying_party: String::from("GitHub"), relying_party_id: String::from("github.com"), username: String::from("user@example.com"), user_display_name: String::from("John Doe"), created_at: now - 30 * 24 * 60 * 60, last_used: Some(now - 2 * 60 * 60), credential_id: String::from("cred_xxxxxxxxxxxx"), public_key_algorithm: String::from("ES256"), is_discoverable: true, is_synced: true },
                    Passkey { id: String::from("pk-2"), name: String::from("Google Account"), relying_party: String::from("Google"), relying_party_id: String::from("google.com"), username: String::from("user@gmail.com"), user_display_name: String::from("John Doe"), created_at: now - 60 * 24 * 60 * 60, last_used: Some(now - 24 * 60 * 60), credential_id: String::from("cred_yyyyyyyyyyyy"), public_key_algorithm: String::from("ES256"), is_discoverable: true, is_synced: true },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_passkeys(state: State<'_, PasskeyState>) -> Result<PasskeyConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn delete_passkey(passkey_id: String, state: State<'_, PasskeyState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.passkeys.retain(|p| p.id != passkey_id);
    Ok(())
}

// ============================================================================
// VAULT HEALTH TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultHealthStats {
    pub total_items: u32,
    pub weak_passwords: u32,
    pub reused_passwords: u32,
    pub old_passwords: u32,
    pub compromised_passwords: u32,
    pub missing_2fa: u32,
    pub overall_score: u32,
    pub last_audit: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultHealthConfig {
    pub stats: VaultHealthStats,
}

pub struct VaultHealthState {
    config: Mutex<VaultHealthConfig>,
}

impl Default for VaultHealthState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(VaultHealthConfig {
                stats: VaultHealthStats {
                    total_items: 156,
                    weak_passwords: 12,
                    reused_passwords: 8,
                    old_passwords: 24,
                    compromised_passwords: 3,
                    missing_2fa: 15,
                    overall_score: 78,
                    last_audit: now - 60 * 60,
                },
            }),
        }
    }
}

#[tauri::command]
pub async fn get_vault_health(state: State<'_, VaultHealthState>) -> Result<VaultHealthConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

// ============================================================================
// WATCHTOWER TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchtowerAlert {
    pub id: String,
    pub alert_type: String,
    pub severity: String,
    pub title: String,
    pub description: String,
    pub affected_item: Option<String>,
    pub created_at: u64,
    pub is_dismissed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchtowerConfig {
    pub is_enabled: bool,
    pub alerts: Vec<WatchtowerAlert>,
    pub last_check: u64,
    pub total_vulnerabilities: u32,
}

pub struct WatchtowerState {
    config: Mutex<WatchtowerConfig>,
}

impl Default for WatchtowerState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(WatchtowerConfig {
                is_enabled: true,
                alerts: vec![
                    WatchtowerAlert { id: String::from("alert-1"), alert_type: String::from("breach"), severity: String::from("critical"), title: String::from("Password Compromised"), description: String::from("Your password for example.com was found in a data breach"), affected_item: Some(String::from("example.com")), created_at: now - 2 * 60 * 60, is_dismissed: false },
                    WatchtowerAlert { id: String::from("alert-2"), alert_type: String::from("weak"), severity: String::from("medium"), title: String::from("Weak Password Detected"), description: String::from("Your password for oldsite.com is considered weak"), affected_item: Some(String::from("oldsite.com")), created_at: now - 24 * 60 * 60, is_dismissed: false },
                    WatchtowerAlert { id: String::from("alert-3"), alert_type: String::from("reused"), severity: String::from("high"), title: String::from("Reused Password"), description: String::from("This password is used on 3 other sites"), affected_item: Some(String::from("forum.example.com")), created_at: now - 3 * 24 * 60 * 60, is_dismissed: true },
                ],
                last_check: now - 30 * 60,
                total_vulnerabilities: 15,
            }),
        }
    }
}

#[tauri::command]
pub async fn get_watchtower_config(state: State<'_, WatchtowerState>) -> Result<WatchtowerConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn dismiss_watchtower_alert(alert_id: String, state: State<'_, WatchtowerState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    for alert in &mut config.alerts {
        if alert.id == alert_id {
            alert.is_dismissed = true;
            return Ok(());
        }
    }
    Err(String::from("Alert not found"))
}

// ============================================================================
// FAMILY VAULTS TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FamilyMember {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: String,
    pub avatar: Option<String>,
    pub joined_at: u64,
    pub last_active: u64,
    pub items_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SharedVault {
    pub id: String,
    pub name: String,
    pub description: String,
    pub members: Vec<String>,
    pub items_count: u32,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FamilyVaultsConfig {
    pub members: Vec<FamilyMember>,
    pub shared_vaults: Vec<SharedVault>,
    pub family_name: String,
}

pub struct FamilyVaultsState {
    config: Mutex<FamilyVaultsConfig>,
}

impl Default for FamilyVaultsState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(FamilyVaultsConfig {
                family_name: String::from("Doe Family"),
                members: vec![
                    FamilyMember { id: String::from("member-1"), name: String::from("John Doe"), email: String::from("john@example.com"), role: String::from("admin"), avatar: None, joined_at: now - 365 * 24 * 60 * 60, last_active: now, items_count: 156 },
                    FamilyMember { id: String::from("member-2"), name: String::from("Jane Doe"), email: String::from("jane@example.com"), role: String::from("member"), avatar: None, joined_at: now - 300 * 24 * 60 * 60, last_active: now - 2 * 60 * 60, items_count: 89 },
                ],
                shared_vaults: vec![
                    SharedVault { id: String::from("vault-1"), name: String::from("Family Streaming"), description: String::from("Shared streaming service passwords"), members: vec![String::from("member-1"), String::from("member-2")], items_count: 12, created_at: now - 180 * 24 * 60 * 60 },
                    SharedVault { id: String::from("vault-2"), name: String::from("Home Utilities"), description: String::from("Bills and home accounts"), members: vec![String::from("member-1"), String::from("member-2")], items_count: 8, created_at: now - 90 * 24 * 60 * 60 },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_family_vaults(state: State<'_, FamilyVaultsState>) -> Result<FamilyVaultsConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

// ============================================================================
// SECURE SEND TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecureSendItem {
    pub id: String,
    pub name: String,
    pub item_type: String,
    pub content_preview: String,
    pub created_at: u64,
    pub expires_at: u64,
    pub max_access_count: Option<u32>,
    pub current_access_count: u32,
    pub is_password_protected: bool,
    pub share_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecureSendConfig {
    pub items: Vec<SecureSendItem>,
}

pub struct SecureSendState {
    config: Mutex<SecureSendConfig>,
}

impl Default for SecureSendState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(SecureSendConfig {
                items: vec![
                    SecureSendItem { id: String::from("send-1"), name: String::from("API Credentials"), item_type: String::from("text"), content_preview: String::from("API_KEY=xxxxx..."), created_at: now - 2 * 24 * 60 * 60, expires_at: now + 5 * 24 * 60 * 60, max_access_count: Some(3), current_access_count: 1, is_password_protected: true, share_url: String::from("https://cube.app/send/abc123") },
                    SecureSendItem { id: String::from("send-2"), name: String::from("SSH Key"), item_type: String::from("file"), content_preview: String::from("id_rsa.pub"), created_at: now - 5 * 24 * 60 * 60, expires_at: now + 2 * 24 * 60 * 60, max_access_count: Some(1), current_access_count: 0, is_password_protected: false, share_url: String::from("https://cube.app/send/def456") },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_secure_sends(state: State<'_, SecureSendState>) -> Result<SecureSendConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn delete_secure_send(send_id: String, state: State<'_, SecureSendState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.items.retain(|i| i.id != send_id);
    Ok(())
}

// ============================================================================
// USERNAME GENERATOR TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsernameGeneratorConfig {
    pub word_list: Vec<String>,
    pub separators: Vec<String>,
    pub include_numbers: bool,
    pub capitalize: bool,
}

pub struct UsernameGeneratorState {
    config: Mutex<UsernameGeneratorConfig>,
}

impl Default for UsernameGeneratorState {
    fn default() -> Self {
        Self {
            config: Mutex::new(UsernameGeneratorConfig {
                word_list: vec![
                    String::from("alpha"), String::from("beta"), String::from("cyber"), String::from("data"),
                    String::from("eagle"), String::from("falcon"), String::from("ghost"), String::from("hawk"),
                    String::from("iron"), String::from("jade"), String::from("knight"), String::from("lunar"),
                ],
                separators: vec![String::from("_"), String::from("-"), String::from(".")],
                include_numbers: true,
                capitalize: true,
            }),
        }
    }
}

#[tauri::command]
pub async fn get_username_generator_config(state: State<'_, UsernameGeneratorState>) -> Result<UsernameGeneratorConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn generate_username(state: State<'_, UsernameGeneratorState>) -> Result<String, String> {
    let config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let default_word1 = String::from("user");
    let default_word2 = String::from("name");
    let default_sep = String::from("_");
    
    let word1 = config.word_list.get(rand::random::<usize>() % config.word_list.len()).unwrap_or(&default_word1);
    let word2 = config.word_list.get(rand::random::<usize>() % config.word_list.len()).unwrap_or(&default_word2);
    let sep = config.separators.get(rand::random::<usize>() % config.separators.len()).unwrap_or(&default_sep);
    let num = if config.include_numbers { format!("{}", rand::random::<u16>() % 1000) } else { String::new() };
    
    let mut username = format!("{}{}{}{}", word1, sep, word2, num);
    if config.capitalize {
        username = username.chars().enumerate().map(|(i, c)| if i == 0 { c.to_ascii_uppercase() } else { c }).collect();
    }
    Ok(username)
}
