// CUBE Nexum - SuperAdmin Security Commands
// Part 3: Security Settings Backend

use serde::{Deserialize, Serialize};
use std::sync::RwLock;
use tauri::State;

// =============================================================================
// STATE
// =============================================================================

pub struct SuperAdminSecurityState {
    pub settings: RwLock<SecuritySettings>,
    pub ip_whitelist: RwLock<Vec<IpWhitelistEntry>>,
    pub sso_providers: RwLock<Vec<SSOProvider>>,
}

impl Default for SuperAdminSecurityState {
    fn default() -> Self {
        let settings = SecuritySettings {
            id: "sec-settings-1".to_string(),
            organization_id: "org-1".to_string(),
            authentication: AuthenticationSettings {
                password_policy: PasswordPolicy {
                    min_length: 12,
                    require_uppercase: true,
                    require_lowercase: true,
                    require_numbers: true,
                    require_symbols: true,
                    max_age_days: 90,
                    prevent_reuse: 5,
                    min_strength: 3,
                },
                mfa_required: true,
                mfa_methods: vec![
                    "totp".to_string(),
                    "sms".to_string(),
                    "email".to_string(),
                    "webauthn".to_string(),
                ],
                sso_enabled: true,
                sso_providers: vec!["google".to_string(), "okta".to_string()],
                session_timeout: 30,
                max_concurrent_sessions: 5,
                remember_device_days: 30,
            },
            access_control: AccessControlSettings {
                ip_whitelist_enabled: false,
                ip_whitelist: vec![],
                geo_restrictions_enabled: false,
                allowed_countries: vec![],
                blocked_countries: vec![],
                time_based_access_enabled: false,
                allowed_hours_start: 0,
                allowed_hours_end: 24,
                allowed_days: vec![0, 1, 2, 3, 4, 5, 6],
            },
            data_protection: DataProtectionSettings {
                encryption_at_rest_enabled: true,
                encryption_algorithm: "AES-256-GCM".to_string(),
                encryption_key_rotation_days: 90,
                dlp_enabled: true,
                dlp_rules: vec![
                    DLPRule {
                        id: "dlp-1".to_string(),
                        name: "Credit Card Detection".to_string(),
                        pattern: r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b".to_string(),
                        action: "block".to_string(),
                        enabled: true,
                    },
                    DLPRule {
                        id: "dlp-2".to_string(),
                        name: "SSN Detection".to_string(),
                        pattern: r"\b\d{3}-\d{2}-\d{4}\b".to_string(),
                        action: "warn".to_string(),
                        enabled: true,
                    },
                ],
                data_retention_days: 365,
                auto_delete_enabled: false,
            },
            threat_protection: ThreatProtectionSettings {
                brute_force_protection_enabled: true,
                max_login_attempts: 5,
                lockout_duration_minutes: 30,
                rate_limiting_enabled: true,
                requests_per_minute: 100,
                ddos_protection_enabled: true,
                bot_protection_enabled: true,
            },
            updated_at: "2026-01-13T00:00:00Z".to_string(),
            updated_by: "user-1".to_string(),
        };

        let ip_whitelist = vec![
            IpWhitelistEntry {
                id: "ip-1".to_string(),
                ip_address: "192.168.1.0/24".to_string(),
                description: "Office Network".to_string(),
                created_at: "2025-01-01T00:00:00Z".to_string(),
                created_by: "user-1".to_string(),
            },
            IpWhitelistEntry {
                id: "ip-2".to_string(),
                ip_address: "10.0.0.0/8".to_string(),
                description: "VPN Network".to_string(),
                created_at: "2025-06-01T00:00:00Z".to_string(),
                created_by: "user-1".to_string(),
            },
        ];

        let sso_providers = vec![
            SSOProvider {
                id: "sso-google".to_string(),
                name: "Google Workspace".to_string(),
                provider_type: "google".to_string(),
                enabled: true,
                client_id: "google-client-id".to_string(),
                client_secret_set: true,
                domain: Some("cubenexum.com".to_string()),
                auto_provision_users: true,
                default_role: "member".to_string(),
                attribute_mapping: AttributeMapping {
                    email: "email".to_string(),
                    first_name: "given_name".to_string(),
                    last_name: "family_name".to_string(),
                    groups: Some("groups".to_string()),
                },
                created_at: "2025-01-01T00:00:00Z".to_string(),
                updated_at: "2025-12-01T00:00:00Z".to_string(),
            },
            SSOProvider {
                id: "sso-okta".to_string(),
                name: "Okta".to_string(),
                provider_type: "okta".to_string(),
                enabled: true,
                client_id: "okta-client-id".to_string(),
                client_secret_set: true,
                domain: Some("cubenexum.okta.com".to_string()),
                auto_provision_users: true,
                default_role: "member".to_string(),
                attribute_mapping: AttributeMapping {
                    email: "email".to_string(),
                    first_name: "firstName".to_string(),
                    last_name: "lastName".to_string(),
                    groups: Some("groups".to_string()),
                },
                created_at: "2025-03-01T00:00:00Z".to_string(),
                updated_at: "2025-11-01T00:00:00Z".to_string(),
            },
        ];

        Self {
            settings: RwLock::new(settings),
            ip_whitelist: RwLock::new(ip_whitelist),
            sso_providers: RwLock::new(sso_providers),
        }
    }
}

// =============================================================================
// TYPES
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecuritySettings {
    pub id: String,
    pub organization_id: String,
    pub authentication: AuthenticationSettings,
    pub access_control: AccessControlSettings,
    pub data_protection: DataProtectionSettings,
    pub threat_protection: ThreatProtectionSettings,
    pub updated_at: String,
    pub updated_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthenticationSettings {
    pub password_policy: PasswordPolicy,
    pub mfa_required: bool,
    pub mfa_methods: Vec<String>,
    pub sso_enabled: bool,
    pub sso_providers: Vec<String>,
    pub session_timeout: u32,
    pub max_concurrent_sessions: u32,
    pub remember_device_days: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordPolicy {
    pub min_length: u32,
    pub require_uppercase: bool,
    pub require_lowercase: bool,
    pub require_numbers: bool,
    pub require_symbols: bool,
    pub max_age_days: u32,
    pub prevent_reuse: u32,
    pub min_strength: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessControlSettings {
    pub ip_whitelist_enabled: bool,
    pub ip_whitelist: Vec<String>,
    pub geo_restrictions_enabled: bool,
    pub allowed_countries: Vec<String>,
    pub blocked_countries: Vec<String>,
    pub time_based_access_enabled: bool,
    pub allowed_hours_start: u32,
    pub allowed_hours_end: u32,
    pub allowed_days: Vec<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataProtectionSettings {
    pub encryption_at_rest_enabled: bool,
    pub encryption_algorithm: String,
    pub encryption_key_rotation_days: u32,
    pub dlp_enabled: bool,
    pub dlp_rules: Vec<DLPRule>,
    pub data_retention_days: u32,
    pub auto_delete_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DLPRule {
    pub id: String,
    pub name: String,
    pub pattern: String,
    pub action: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreatProtectionSettings {
    pub brute_force_protection_enabled: bool,
    pub max_login_attempts: u32,
    pub lockout_duration_minutes: u32,
    pub rate_limiting_enabled: bool,
    pub requests_per_minute: u32,
    pub ddos_protection_enabled: bool,
    pub bot_protection_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpWhitelistEntry {
    pub id: String,
    pub ip_address: String,
    pub description: String,
    pub created_at: String,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSOProvider {
    pub id: String,
    pub name: String,
    pub provider_type: String,
    pub enabled: bool,
    pub client_id: String,
    pub client_secret_set: bool,
    pub domain: Option<String>,
    pub auto_provision_users: bool,
    pub default_role: String,
    pub attribute_mapping: AttributeMapping,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttributeMapping {
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub groups: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSecuritySettingsRequest {
    pub authentication: Option<AuthenticationSettings>,
    pub access_control: Option<AccessControlSettings>,
    pub data_protection: Option<DataProtectionSettings>,
    pub threat_protection: Option<ThreatProtectionSettings>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigureSSORequest {
    pub name: String,
    pub provider_type: String,
    pub client_id: String,
    pub client_secret: String,
    pub domain: Option<String>,
    pub auto_provision_users: bool,
    pub default_role: String,
}

// =============================================================================
// COMMANDS
// =============================================================================

#[tauri::command]
pub async fn sa_get_security_settings(
    state: State<'_, SuperAdminSecurityState>,
) -> Result<SecuritySettings, String> {
    let settings_lock = state.settings.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(settings_lock.clone())
}

#[tauri::command]
pub async fn sa_update_security_settings(
    state: State<'_, SuperAdminSecurityState>,
    updates: UpdateSecuritySettingsRequest,
) -> Result<SecuritySettings, String> {
    let mut settings_lock = state.settings.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(auth) = updates.authentication {
        settings_lock.authentication = auth;
    }
    if let Some(access) = updates.access_control {
        settings_lock.access_control = access;
    }
    if let Some(data) = updates.data_protection {
        settings_lock.data_protection = data;
    }
    if let Some(threat) = updates.threat_protection {
        settings_lock.threat_protection = threat;
    }
    
    settings_lock.updated_at = chrono::Utc::now().to_rfc3339();
    settings_lock.updated_by = "admin".to_string();
    
    Ok(settings_lock.clone())
}

#[tauri::command]
pub async fn sa_get_ip_whitelist(
    state: State<'_, SuperAdminSecurityState>,
) -> Result<Vec<IpWhitelistEntry>, String> {
    let whitelist_lock = state.ip_whitelist.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(whitelist_lock.clone())
}

#[tauri::command]
pub async fn sa_add_ip_whitelist(
    state: State<'_, SuperAdminSecurityState>,
    ip_address: String,
    description: String,
) -> Result<IpWhitelistEntry, String> {
    let mut whitelist_lock = state.ip_whitelist.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let entry = IpWhitelistEntry {
        id: format!("ip-{}", uuid::Uuid::new_v4()),
        ip_address,
        description,
        created_at: chrono::Utc::now().to_rfc3339(),
        created_by: "admin".to_string(),
    };
    
    whitelist_lock.push(entry.clone());
    
    Ok(entry)
}

#[tauri::command]
pub async fn sa_remove_ip_whitelist(
    state: State<'_, SuperAdminSecurityState>,
    entry_id: String,
) -> Result<bool, String> {
    let mut whitelist_lock = state.ip_whitelist.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let before = whitelist_lock.len();
    whitelist_lock.retain(|e| e.id != entry_id);
    
    if whitelist_lock.len() < before {
        Ok(true)
    } else {
        Err(format!("Entry not found: {}", entry_id))
    }
}

#[tauri::command]
pub async fn sa_get_sso_providers(
    state: State<'_, SuperAdminSecurityState>,
) -> Result<Vec<SSOProvider>, String> {
    let providers_lock = state.sso_providers.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(providers_lock.clone())
}

#[tauri::command]
pub async fn sa_configure_sso(
    state: State<'_, SuperAdminSecurityState>,
    request: ConfigureSSORequest,
) -> Result<SSOProvider, String> {
    let mut providers_lock = state.sso_providers.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let now = chrono::Utc::now().to_rfc3339();
    
    let provider = SSOProvider {
        id: format!("sso-{}", uuid::Uuid::new_v4()),
        name: request.name,
        provider_type: request.provider_type,
        enabled: true,
        client_id: request.client_id,
        client_secret_set: !request.client_secret.is_empty(),
        domain: request.domain,
        auto_provision_users: request.auto_provision_users,
        default_role: request.default_role,
        attribute_mapping: AttributeMapping {
            email: "email".to_string(),
            first_name: "firstName".to_string(),
            last_name: "lastName".to_string(),
            groups: Some("groups".to_string()),
        },
        created_at: now.clone(),
        updated_at: now,
    };
    
    providers_lock.push(provider.clone());
    
    Ok(provider)
}

#[tauri::command]
pub async fn sa_disable_sso(
    state: State<'_, SuperAdminSecurityState>,
    provider_id: String,
) -> Result<bool, String> {
    let mut providers_lock = state.sso_providers.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(provider) = providers_lock.iter_mut().find(|p| p.id == provider_id) {
        provider.enabled = false;
        provider.updated_at = chrono::Utc::now().to_rfc3339();
        Ok(true)
    } else {
        Err(format!("Provider not found: {}", provider_id))
    }
}

#[tauri::command]
pub async fn sa_delete_sso_provider(
    state: State<'_, SuperAdminSecurityState>,
    provider_id: String,
) -> Result<bool, String> {
    let mut providers_lock = state.sso_providers.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let before = providers_lock.len();
    providers_lock.retain(|p| p.id != provider_id);
    
    if providers_lock.len() < before {
        Ok(true)
    } else {
        Err(format!("Provider not found: {}", provider_id))
    }
}

#[tauri::command]
pub async fn sa_enforce_mfa(
    state: State<'_, SuperAdminSecurityState>,
    user_ids: Option<Vec<String>>,
) -> Result<u32, String> {
    let mut settings_lock = state.settings.write().map_err(|e| format!("Lock error: {}", e))?;
    
    settings_lock.authentication.mfa_required = true;
    settings_lock.updated_at = chrono::Utc::now().to_rfc3339();
    
    // In production, this would enforce MFA for specific users or all users
    Ok(user_ids.map(|ids| ids.len() as u32).unwrap_or(0))
}

#[tauri::command]
pub async fn sa_add_dlp_rule(
    state: State<'_, SuperAdminSecurityState>,
    name: String,
    pattern: String,
    action: String,
) -> Result<DLPRule, String> {
    let mut settings_lock = state.settings.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let rule = DLPRule {
        id: format!("dlp-{}", uuid::Uuid::new_v4()),
        name,
        pattern,
        action,
        enabled: true,
    };
    
    settings_lock.data_protection.dlp_rules.push(rule.clone());
    settings_lock.updated_at = chrono::Utc::now().to_rfc3339();
    
    Ok(rule)
}

#[tauri::command]
pub async fn sa_remove_dlp_rule(
    state: State<'_, SuperAdminSecurityState>,
    rule_id: String,
) -> Result<bool, String> {
    let mut settings_lock = state.settings.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let before = settings_lock.data_protection.dlp_rules.len();
    settings_lock.data_protection.dlp_rules.retain(|r| r.id != rule_id);
    
    if settings_lock.data_protection.dlp_rules.len() < before {
        settings_lock.updated_at = chrono::Utc::now().to_rfc3339();
        Ok(true)
    } else {
        Err(format!("Rule not found: {}", rule_id))
    }
}
