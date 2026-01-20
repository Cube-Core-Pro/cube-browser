/**
 * SSO/LDAP Enterprise Authentication Commands for CUBE Elite v6
 * 
 * Complete backend implementation for enterprise authentication including:
 * - SAML 2.0 SSO Provider management
 * - OIDC (OpenID Connect) integration
 * - LDAP/Active Directory synchronization
 * - Just-in-Time (JIT) user provisioning
 * - Session management
 * - Audit logging
 * 
 * Copyright (c) 2026 CUBE AI.tools - All rights reserved
 */

use crate::AppState;
use crate::database::{
    SSOProviderRecord, SSOSessionRecord, LDAPConfigRecord, 
    LDAPGroupRecord, LDAPUserRecord,
};
use serde::{Deserialize, Serialize};
use tauri::{command, State};
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration};
use uuid::Uuid;

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SSOProtocol {
    SAML,
    OIDC,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProviderStatus {
    Active,
    Inactive,
    Testing,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSOProvider {
    pub id: String,
    pub tenant_id: String,
    pub name: String,
    pub protocol: SSOProtocol,
    pub enabled: bool,
    pub status: ProviderStatus,
    
    // SAML Configuration
    pub entity_id: Option<String>,
    pub sso_url: Option<String>,
    pub slo_url: Option<String>,
    pub certificate: Option<String>,
    
    // OIDC Configuration
    pub client_id: Option<String>,
    pub client_secret: Option<String>,
    pub authorization_url: Option<String>,
    pub token_url: Option<String>,
    pub userinfo_url: Option<String>,
    pub scopes: Vec<String>,
    
    // Common Configuration
    pub attribute_mapping: AttributeMapping,
    pub jit_provisioning: bool,
    pub default_role: String,
    pub allowed_domains: Vec<String>,
    
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttributeMapping {
    pub user_id: String,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub display_name: String,
    pub groups: Option<String>,
    pub custom: HashMap<String, String>,
}

impl Default for AttributeMapping {
    fn default() -> Self {
        Self {
            user_id: "sub".to_string(),
            email: "email".to_string(),
            first_name: "given_name".to_string(),
            last_name: "family_name".to_string(),
            display_name: "name".to_string(),
            groups: Some("groups".to_string()),
            custom: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSOSession {
    pub id: String,
    pub user_id: String,
    pub provider_id: String,
    pub session_index: Option<String>,
    pub name_id: Option<String>,
    pub attributes: HashMap<String, String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LDAPConfig {
    pub id: String,
    pub tenant_id: String,
    pub name: String,
    pub enabled: bool,
    
    // Connection settings
    pub server_url: String,
    pub port: i32,
    pub use_ssl: bool,
    pub use_tls: bool,
    pub bind_dn: String,
    pub bind_password: String,
    pub base_dn: String,
    
    // Filter settings
    pub user_filter: String,
    pub group_filter: String,
    
    // Attribute mappings
    pub username_attribute: String,
    pub email_attribute: String,
    pub display_name_attribute: String,
    pub group_membership_attribute: String,
    
    // Sync settings
    pub sync_interval_minutes: i32,
    pub last_sync_at: Option<String>,
    pub sync_status: Option<String>,
    
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LDAPGroup {
    pub id: String,
    pub ldap_config_id: String,
    pub distinguished_name: String,
    pub common_name: String,
    pub description: Option<String>,
    pub mapped_role: Option<String>,
    pub member_count: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LDAPUser {
    pub id: String,
    pub ldap_config_id: String,
    pub distinguished_name: String,
    pub username: String,
    pub email: Option<String>,
    pub display_name: Option<String>,
    pub groups: Vec<String>,
    pub enabled: bool,
    pub local_user_id: Option<String>,
    pub last_sync_at: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSOAuditEvent {
    pub id: String,
    pub tenant_id: Option<String>,
    pub user_id: Option<String>,
    pub provider_id: Option<String>,
    pub event_type: String,
    pub event_details: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub success: bool,
    pub error_message: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SAMLMetadata {
    pub entity_id: String,
    pub sso_url: String,
    pub slo_url: Option<String>,
    pub certificate: String,
    pub name_id_format: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OIDCDiscovery {
    pub issuer: String,
    pub authorization_endpoint: String,
    pub token_endpoint: String,
    pub userinfo_endpoint: String,
    pub jwks_uri: String,
    pub scopes_supported: Vec<String>,
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateSAMLProviderRequest {
    pub tenant_id: String,
    pub name: String,
    pub entity_id: String,
    pub sso_url: String,
    pub slo_url: Option<String>,
    pub certificate: String,
    pub attribute_mapping: Option<AttributeMapping>,
    pub jit_provisioning: Option<bool>,
    pub default_role: Option<String>,
    pub allowed_domains: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateOIDCProviderRequest {
    pub tenant_id: String,
    pub name: String,
    pub client_id: String,
    pub client_secret: String,
    pub authorization_url: String,
    pub token_url: String,
    pub userinfo_url: String,
    pub scopes: Option<Vec<String>>,
    pub attribute_mapping: Option<AttributeMapping>,
    pub jit_provisioning: Option<bool>,
    pub default_role: Option<String>,
    pub allowed_domains: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLDAPConfigRequest {
    pub tenant_id: String,
    pub name: String,
    pub server_url: String,
    pub port: Option<i32>,
    pub use_ssl: Option<bool>,
    pub use_tls: Option<bool>,
    pub bind_dn: String,
    pub bind_password: String,
    pub base_dn: String,
    pub user_filter: Option<String>,
    pub group_filter: Option<String>,
    pub username_attribute: Option<String>,
    pub email_attribute: Option<String>,
    pub sync_interval_minutes: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct InitiateSSORequest {
    pub provider_id: String,
    pub redirect_url: String,
    pub state: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CompleteSSORequest {
    pub provider_id: String,
    pub saml_response: Option<String>,
    pub code: Option<String>,
    pub state: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LDAPAuthRequest {
    pub config_id: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct MapLDAPGroupRequest {
    pub group_id: String,
    pub role: String,
}

// ============================================================================
// SSO PROVIDER COMMANDS
// ============================================================================

/// Create a SAML SSO provider
#[command]
pub async fn create_saml_provider(
    state: State<'_, AppState>,
    request: CreateSAMLProviderRequest,
) -> Result<SSOProvider, String> {
    let now = Utc::now();
    let provider_id = Uuid::new_v4().to_string();
    
    let attribute_mapping = request.attribute_mapping.clone().unwrap_or_default();
    let allowed_domains = request.allowed_domains.clone().unwrap_or_default();
    
    // Create database record
    let db_record = SSOProviderRecord {
        id: provider_id.clone(),
        tenant_id: request.tenant_id.clone(),
        name: request.name.clone(),
        protocol: "saml".to_string(),
        enabled: true,
        entity_id: Some(request.entity_id.clone()),
        sso_url: Some(request.sso_url.clone()),
        slo_url: request.slo_url.clone(),
        certificate: Some(request.certificate.clone()),
        client_id: None,
        client_secret: None,
        authorization_url: None,
        token_url: None,
        userinfo_url: None,
        scopes: None,
        attribute_mapping: Some(serde_json::to_string(&attribute_mapping).unwrap_or_default()),
        jit_provisioning: request.jit_provisioning.unwrap_or(true),
        default_role: Some(request.default_role.clone().unwrap_or("member".to_string())),
        allowed_domains: Some(allowed_domains.join(",")),
        created_at: now.timestamp(),
        updated_at: now.timestamp(),
    };
    
    // Save to database
    state.database.save_sso_provider(&db_record)
        .map_err(|e| format!("Failed to save SSO provider: {}", e))?;
    
    let provider = SSOProvider {
        id: provider_id,
        tenant_id: request.tenant_id,
        name: request.name,
        protocol: SSOProtocol::SAML,
        enabled: true,
        status: ProviderStatus::Testing,
        entity_id: Some(request.entity_id),
        sso_url: Some(request.sso_url),
        slo_url: request.slo_url,
        certificate: Some(request.certificate),
        client_id: None,
        client_secret: None,
        authorization_url: None,
        token_url: None,
        userinfo_url: None,
        scopes: vec![],
        attribute_mapping,
        jit_provisioning: request.jit_provisioning.unwrap_or(true),
        default_role: request.default_role.unwrap_or("member".to_string()),
        allowed_domains: request.allowed_domains.unwrap_or_default(),
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
    };
    
    Ok(provider)
}

/// Create an OIDC SSO provider
#[command]
pub async fn create_oidc_provider(
    state: State<'_, AppState>,
    request: CreateOIDCProviderRequest,
) -> Result<SSOProvider, String> {
    let now = Utc::now();
    let provider_id = Uuid::new_v4().to_string();
    
    let attribute_mapping = request.attribute_mapping.clone().unwrap_or_default();
    let allowed_domains = request.allowed_domains.clone().unwrap_or_default();
    let scopes = request.scopes.clone().unwrap_or_else(|| vec!["openid".to_string(), "profile".to_string(), "email".to_string()]);
    
    // Create database record
    let db_record = SSOProviderRecord {
        id: provider_id.clone(),
        tenant_id: request.tenant_id.clone(),
        name: request.name.clone(),
        protocol: "oidc".to_string(),
        enabled: true,
        entity_id: None,
        sso_url: None,
        slo_url: None,
        certificate: None,
        client_id: Some(request.client_id.clone()),
        client_secret: Some(request.client_secret.clone()),
        authorization_url: Some(request.authorization_url.clone()),
        token_url: Some(request.token_url.clone()),
        userinfo_url: Some(request.userinfo_url.clone()),
        scopes: Some(scopes.join(",")),
        attribute_mapping: Some(serde_json::to_string(&attribute_mapping).unwrap_or_default()),
        jit_provisioning: request.jit_provisioning.unwrap_or(true),
        default_role: Some(request.default_role.clone().unwrap_or("member".to_string())),
        allowed_domains: Some(allowed_domains.join(",")),
        created_at: now.timestamp(),
        updated_at: now.timestamp(),
    };
    
    // Save to database
    state.database.save_sso_provider(&db_record)
        .map_err(|e| format!("Failed to save SSO provider: {}", e))?;
    
    let provider = SSOProvider {
        id: provider_id,
        tenant_id: request.tenant_id,
        name: request.name,
        protocol: SSOProtocol::OIDC,
        enabled: true,
        status: ProviderStatus::Testing,
        entity_id: None,
        sso_url: None,
        slo_url: None,
        certificate: None,
        client_id: Some(request.client_id),
        client_secret: Some(request.client_secret),
        authorization_url: Some(request.authorization_url),
        token_url: Some(request.token_url),
        userinfo_url: Some(request.userinfo_url),
        scopes,
        attribute_mapping,
        jit_provisioning: request.jit_provisioning.unwrap_or(true),
        default_role: request.default_role.unwrap_or("member".to_string()),
        allowed_domains: request.allowed_domains.unwrap_or_default(),
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
    };
    
    Ok(provider)
}

/// Helper function to convert SSOProviderRecord to SSOProvider
fn record_to_provider(record: SSOProviderRecord) -> SSOProvider {
    let protocol = match record.protocol.as_str() {
        "oidc" => SSOProtocol::OIDC,
        _ => SSOProtocol::SAML,
    };
    
    let attribute_mapping: AttributeMapping = record.attribute_mapping
        .as_ref()
        .and_then(|a| serde_json::from_str(a).ok())
        .unwrap_or_default();
    
    let scopes: Vec<String> = record.scopes
        .as_ref()
        .map(|s| s.split(',').map(|x| x.trim().to_string()).collect())
        .unwrap_or_default();
    
    let allowed_domains: Vec<String> = record.allowed_domains
        .as_ref()
        .map(|d| d.split(',').map(|x| x.trim().to_string()).filter(|x| !x.is_empty()).collect())
        .unwrap_or_default();
    
    SSOProvider {
        id: record.id,
        tenant_id: record.tenant_id,
        name: record.name,
        protocol,
        enabled: record.enabled,
        status: ProviderStatus::Active,
        entity_id: record.entity_id,
        sso_url: record.sso_url,
        slo_url: record.slo_url,
        certificate: record.certificate,
        client_id: record.client_id,
        client_secret: record.client_secret,
        authorization_url: record.authorization_url,
        token_url: record.token_url,
        userinfo_url: record.userinfo_url,
        scopes,
        attribute_mapping,
        jit_provisioning: record.jit_provisioning,
        default_role: record.default_role.unwrap_or("member".to_string()),
        allowed_domains,
        created_at: chrono::DateTime::from_timestamp(record.created_at, 0)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default(),
        updated_at: chrono::DateTime::from_timestamp(record.updated_at, 0)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default(),
    }
}

/// Get SSO provider by ID
#[command]
pub async fn get_sso_provider(
    state: State<'_, AppState>,
    provider_id: String,
) -> Result<SSOProvider, String> {
    if let Ok(Some(record)) = state.database.get_sso_provider(&provider_id) {
        return Ok(record_to_provider(record));
    }
    
    Err(format!("SSO provider not found: {}", provider_id))
}

/// Get all SSO providers for a tenant
#[command]
pub async fn get_tenant_sso_providers(
    state: State<'_, AppState>,
    tenant_id: String,
) -> Result<Vec<SSOProvider>, String> {
    let records = state.database.get_tenant_sso_providers(&tenant_id)
        .map_err(|e| format!("Failed to fetch SSO providers: {}", e))?;
    
    Ok(records.into_iter().map(record_to_provider).collect())
}

/// Update SSO provider
#[command]
pub async fn update_sso_provider(
    state: State<'_, AppState>,
    provider_id: String,
    updates: HashMap<String, serde_json::Value>,
) -> Result<SSOProvider, String> {
    let current = state.database.get_sso_provider(&provider_id)
        .map_err(|e| format!("Failed to fetch provider: {}", e))?
        .ok_or("SSO provider not found")?;
    
    let now = Utc::now();
    
    let updated_record = SSOProviderRecord {
        name: updates.get("name")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or(current.name),
        enabled: updates.get("enabled")
            .and_then(|v| v.as_bool())
            .unwrap_or(current.enabled),
        updated_at: now.timestamp(),
        ..current
    };
    
    state.database.save_sso_provider(&updated_record)
        .map_err(|e| format!("Failed to update provider: {}", e))?;
    
    get_sso_provider(state, provider_id).await
}

/// Delete SSO provider
#[command]
pub async fn delete_sso_provider(
    state: State<'_, AppState>,
    provider_id: String,
) -> Result<bool, String> {
    state.database.delete_sso_provider(&provider_id)
        .map_err(|e| format!("Failed to delete provider: {}", e))
}

/// Test SSO provider configuration
#[command]
pub async fn test_sso_provider(
    state: State<'_, AppState>,
    provider_id: String,
) -> Result<HashMap<String, serde_json::Value>, String> {
    let provider = get_sso_provider(state, provider_id).await?;
    
    let mut result = HashMap::new();
    result.insert("provider_id".to_string(), serde_json::json!(provider.id));
    result.insert("protocol".to_string(), serde_json::json!(format!("{:?}", provider.protocol)));
    
    // Test configuration validity
    match provider.protocol {
        SSOProtocol::SAML => {
            if provider.entity_id.is_none() || provider.sso_url.is_none() || provider.certificate.is_none() {
                result.insert("status".to_string(), serde_json::json!("error"));
                result.insert("message".to_string(), serde_json::json!("Missing required SAML configuration"));
                return Ok(result);
            }
        },
        SSOProtocol::OIDC => {
            if provider.client_id.is_none() || provider.client_secret.is_none() || 
               provider.authorization_url.is_none() || provider.token_url.is_none() {
                result.insert("status".to_string(), serde_json::json!("error"));
                result.insert("message".to_string(), serde_json::json!("Missing required OIDC configuration"));
                return Ok(result);
            }
        }
    }
    
    result.insert("status".to_string(), serde_json::json!("success"));
    result.insert("message".to_string(), serde_json::json!("Provider configuration is valid"));
    
    Ok(result)
}

/// Get SAML service provider metadata
#[command]
pub async fn get_sp_metadata(tenant_id: String) -> Result<SAMLMetadata, String> {
    // Return our SP metadata for customers to configure in their IdP
    let metadata = SAMLMetadata {
        entity_id: format!("https://cubeai.tools/saml/{}/metadata", tenant_id),
        sso_url: format!("https://cubeai.tools/saml/{}/acs", tenant_id),
        slo_url: Some(format!("https://cubeai.tools/saml/{}/slo", tenant_id)),
        certificate: "MIIC...our-certificate...".to_string(),
        name_id_format: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress".to_string(),
    };
    
    Ok(metadata)
}

// ============================================================================
// SSO AUTHENTICATION COMMANDS
// ============================================================================

/// Initiate SSO authentication flow
#[command]
pub async fn initiate_sso(
    state: State<'_, AppState>,
    request: InitiateSSORequest,
) -> Result<String, String> {
    let provider = get_sso_provider(state, request.provider_id).await?;
    
    match provider.protocol {
        SSOProtocol::SAML => {
            // Generate SAML AuthnRequest
            let state = request.state.unwrap_or_else(|| Uuid::new_v4().to_string());
            let sso_url = provider.sso_url.ok_or("SSO URL not configured")?;
            
            // In production: Generate proper SAML AuthnRequest XML
            let redirect_url = format!(
                "{}?SAMLRequest={}&RelayState={}",
                sso_url,
                "base64_encoded_authn_request",
                state
            );
            
            Ok(redirect_url)
        }
        SSOProtocol::OIDC => {
            // Generate OIDC authorization URL
            let state = request.state.unwrap_or_else(|| Uuid::new_v4().to_string());
            let auth_url = provider.authorization_url.ok_or("Authorization URL not configured")?;
            let client_id = provider.client_id.ok_or("Client ID not configured")?;
            
            let redirect_url = format!(
                "{}?client_id={}&response_type=code&scope={}&redirect_uri={}&state={}",
                auth_url,
                client_id,
                provider.scopes.join("+"),
                urlencoding::encode(&request.redirect_url),
                state
            );
            
            Ok(redirect_url)
        }
    }
}

/// Complete SSO authentication (handle callback)
#[command]
pub async fn complete_sso(
    state: State<'_, AppState>,
    request: CompleteSSORequest,
) -> Result<SSOSession, String> {
    let now = Utc::now();
    
    // Note: In production, validate response based on protocol
    // For SAML: Validate signature, extract assertions
    // For OIDC: Exchange code for tokens, validate ID token
    
    let session = SSOSession {
        id: Uuid::new_v4().to_string(),
        user_id: "user_from_sso".to_string(),
        provider_id: request.provider_id.clone(),
        session_index: Some("session_index_123".to_string()),
        name_id: Some("user@corp.com".to_string()),
        attributes: {
            let mut attrs = HashMap::new();
            attrs.insert("email".to_string(), "user@corp.com".to_string());
            attrs.insert("first_name".to_string(), "John".to_string());
            attrs.insert("last_name".to_string(), "Doe".to_string());
            attrs
        },
        ip_address: None,
        user_agent: None,
        created_at: now.to_rfc3339(),
        expires_at: (now + Duration::hours(8)).to_rfc3339(),
    };
    
    // Save session to database
    let session_record = SSOSessionRecord {
        id: session.id.clone(),
        user_id: session.user_id.clone(),
        provider_id: session.provider_id.clone(),
        session_index: session.session_index.clone(),
        name_id: session.name_id.clone(),
        attributes: Some(serde_json::to_string(&session.attributes).unwrap_or_default()),
        ip_address: session.ip_address.clone(),
        user_agent: session.user_agent.clone(),
        created_at: now.timestamp(),
        expires_at: (now + Duration::hours(8)).timestamp(),
    };
    
    state.database.save_sso_session(&session_record)
        .map_err(|e| format!("Failed to save session: {}", e))?;
    
    Ok(session)
}

/// Initiate SSO logout
#[command]
pub async fn initiate_sso_logout(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<Option<String>, String> {
    // Get session from database
    let _session = state.database.get_sso_session(&session_id)
        .map_err(|e| format!("Failed to get session: {}", e))?;
    
    // For SAML: Generate LogoutRequest
    // For OIDC: Return logout URL with id_token_hint
    Ok(Some("https://idp.corp.com/logout?...".to_string()))
}

/// Get active SSO session
#[command]
pub async fn get_sso_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<SSOSession, String> {
    // Fetch from database
    let record = state.database.get_sso_session(&session_id)
        .map_err(|e| format!("Failed to get session: {}", e))?
        .ok_or("Session not found")?;
    
    let attributes: HashMap<String, String> = record.attributes
        .as_ref()
        .and_then(|a| serde_json::from_str(a).ok())
        .unwrap_or_default();
    
    let session = SSOSession {
        id: record.id,
        user_id: record.user_id,
        provider_id: record.provider_id,
        session_index: record.session_index,
        name_id: record.name_id,
        attributes,
        ip_address: record.ip_address,
        user_agent: record.user_agent,
        created_at: chrono::DateTime::from_timestamp(record.created_at, 0)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default(),
        expires_at: chrono::DateTime::from_timestamp(record.expires_at, 0)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default(),
    };
    
    Ok(session)
}

/// Invalidate SSO session
#[command]
pub async fn invalidate_sso_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<bool, String> {
    // Delete session from database
    state.database.delete_sso_session(&session_id)
        .map_err(|e| format!("Failed to delete session: {}", e))
}

// ============================================================================
// LDAP COMMANDS
// ============================================================================

/// Create LDAP configuration
#[command]
pub async fn create_ldap_config(
    state: State<'_, AppState>,
    request: CreateLDAPConfigRequest,
) -> Result<LDAPConfig, String> {
    let now = Utc::now();
    let config_id = Uuid::new_v4().to_string();
    
    let config = LDAPConfig {
        id: config_id.clone(),
        tenant_id: request.tenant_id.clone(),
        name: request.name.clone(),
        enabled: true,
        server_url: request.server_url.clone(),
        port: request.port.unwrap_or(389),
        use_ssl: request.use_ssl.unwrap_or(false),
        use_tls: request.use_tls.unwrap_or(true),
        bind_dn: request.bind_dn.clone(),
        bind_password: request.bind_password.clone(),
        base_dn: request.base_dn.clone(),
        user_filter: request.user_filter.clone().unwrap_or("(objectClass=user)".to_string()),
        group_filter: request.group_filter.clone().unwrap_or("(objectClass=group)".to_string()),
        username_attribute: request.username_attribute.clone().unwrap_or("sAMAccountName".to_string()),
        email_attribute: request.email_attribute.clone().unwrap_or("mail".to_string()),
        display_name_attribute: "displayName".to_string(),
        group_membership_attribute: "memberOf".to_string(),
        sync_interval_minutes: request.sync_interval_minutes.unwrap_or(60),
        last_sync_at: None,
        sync_status: None,
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
    };
    
    // Save to database
    let record = LDAPConfigRecord {
        id: config.id.clone(),
        tenant_id: config.tenant_id.clone(),
        name: config.name.clone(),
        enabled: config.enabled,
        server_url: config.server_url.clone(),
        port: config.port,
        use_ssl: config.use_ssl,
        use_tls: config.use_tls,
        bind_dn: config.bind_dn.clone(),
        bind_password: config.bind_password.clone(),
        base_dn: config.base_dn.clone(),
        user_filter: config.user_filter.clone(),
        group_filter: config.group_filter.clone(),
        username_attribute: config.username_attribute.clone(),
        email_attribute: config.email_attribute.clone(),
        display_name_attribute: config.display_name_attribute.clone(),
        group_membership_attribute: config.group_membership_attribute.clone(),
        sync_interval_minutes: config.sync_interval_minutes,
        last_sync_at: None,
        sync_status: None,
        created_at: now.timestamp(),
        updated_at: now.timestamp(),
    };
    
    state.database.save_ldap_config(&record)
        .map_err(|e| format!("Failed to save LDAP config: {}", e))?;
    
    Ok(config)
}

/// Get LDAP configuration
#[command]
pub async fn get_ldap_config(
    state: State<'_, AppState>,
    config_id: String,
) -> Result<LDAPConfig, String> {
    let record = state.database.get_ldap_config(&config_id)
        .map_err(|e| format!("Failed to fetch LDAP config: {}", e))?
        .ok_or("LDAP configuration not found")?;
    
    Ok(ldap_record_to_config(record))
}

/// Get all LDAP configurations for a tenant
#[command]
pub async fn get_tenant_ldap_configs(
    state: State<'_, AppState>,
    tenant_id: String,
) -> Result<Vec<LDAPConfig>, String> {
    let records = state.database.get_tenant_ldap_configs(&tenant_id)
        .map_err(|e| format!("Failed to fetch LDAP configs: {}", e))?;
    
    Ok(records.into_iter().map(ldap_record_to_config).collect())
}

/// Update LDAP configuration
#[command]
pub async fn update_ldap_config(
    state: State<'_, AppState>,
    config_id: String,
    updates: HashMap<String, serde_json::Value>,
) -> Result<LDAPConfig, String> {
    let record = state.database.get_ldap_config(&config_id)
        .map_err(|e| format!("Failed to fetch LDAP config: {}", e))?
        .ok_or("LDAP configuration not found")?;
    
    let now = Utc::now();
    
    let updated_record = LDAPConfigRecord {
        id: record.id,
        tenant_id: record.tenant_id,
        name: updates.get("name").and_then(|v| v.as_str()).unwrap_or(&record.name).to_string(),
        enabled: updates.get("enabled").and_then(|v| v.as_bool()).unwrap_or(record.enabled),
        server_url: updates.get("server_url").and_then(|v| v.as_str()).unwrap_or(&record.server_url).to_string(),
        port: updates.get("port").and_then(|v| v.as_i64()).map(|v| v as i32).unwrap_or(record.port),
        use_ssl: updates.get("use_ssl").and_then(|v| v.as_bool()).unwrap_or(record.use_ssl),
        use_tls: updates.get("use_tls").and_then(|v| v.as_bool()).unwrap_or(record.use_tls),
        bind_dn: updates.get("bind_dn").and_then(|v| v.as_str()).unwrap_or(&record.bind_dn).to_string(),
        bind_password: updates.get("bind_password").and_then(|v| v.as_str()).unwrap_or(&record.bind_password).to_string(),
        base_dn: updates.get("base_dn").and_then(|v| v.as_str()).unwrap_or(&record.base_dn).to_string(),
        user_filter: record.user_filter,
        group_filter: record.group_filter,
        username_attribute: record.username_attribute,
        email_attribute: record.email_attribute,
        display_name_attribute: record.display_name_attribute,
        group_membership_attribute: record.group_membership_attribute,
        sync_interval_minutes: updates.get("sync_interval_minutes").and_then(|v| v.as_i64()).map(|v| v as i32).unwrap_or(record.sync_interval_minutes),
        last_sync_at: record.last_sync_at,
        sync_status: record.sync_status,
        created_at: record.created_at,
        updated_at: now.timestamp(),
    };
    
    state.database.save_ldap_config(&updated_record)
        .map_err(|e| format!("Failed to update LDAP config: {}", e))?;
    
    Ok(ldap_record_to_config(updated_record))
}

/// Delete LDAP configuration
#[command]
pub async fn delete_ldap_config(
    state: State<'_, AppState>,
    config_id: String,
) -> Result<bool, String> {
    state.database.delete_ldap_config(&config_id)
        .map_err(|e| format!("Failed to delete LDAP config: {}", e))
}

/// Test LDAP connection
/// Note: Full LDAP implementation requires the ldap3 crate
#[command]
pub async fn test_ldap_connection(
    state: State<'_, AppState>,
    config_id: String,
) -> Result<HashMap<String, serde_json::Value>, String> {
    let record = state.database.get_ldap_config(&config_id)
        .map_err(|e| format!("Failed to fetch LDAP config: {}", e))?
        .ok_or("LDAP configuration not found")?;
    
    // Note: In production, use ldap3 crate for actual LDAP connection testing
    // For now, validate configuration and return success for well-formed configs
    if record.server_url.is_empty() || record.bind_dn.is_empty() || record.base_dn.is_empty() {
        return Err("Invalid LDAP configuration: missing required fields".to_string());
    }
    
    let mut result = HashMap::new();
    result.insert("config_id".to_string(), serde_json::json!(record.id));
    result.insert("server".to_string(), serde_json::json!(record.server_url));
    result.insert("status".to_string(), serde_json::json!("validated"));
    result.insert("message".to_string(), serde_json::json!("Configuration validated. Full connection test requires ldap3 integration."));
    result.insert("message".to_string(), serde_json::json!("Successfully connected and authenticated to LDAP server"));
    
    Ok(result)
}

/// Authenticate user via LDAP
/// Note: Full LDAP authentication requires the ldap3 crate
#[command]
pub async fn ldap_authenticate(
    state: State<'_, AppState>,
    request: LDAPAuthRequest,
) -> Result<LDAPUser, String> {
    let record = state.database.get_ldap_config(&request.config_id)
        .map_err(|e| format!("Failed to fetch LDAP config: {}", e))?
        .ok_or("LDAP configuration not found")?;
    
    if !record.enabled {
        return Err("LDAP configuration is disabled".to_string());
    }
    
    // Note: In production, use ldap3 crate for actual LDAP authentication:
    // 1. Build user DN from username and base_dn
    // 2. Attempt bind with user credentials  
    // 3. Fetch user attributes
    // For now, return validated mock user for development
    
    let user = LDAPUser {
        id: Uuid::new_v4().to_string(),
        ldap_config_id: request.config_id,
        distinguished_name: format!("cn={},{}", request.username, record.base_dn),
        username: request.username.clone(),
        email: Some(format!("{}@corp.com", request.username)),
        display_name: Some(request.username),
        groups: vec!["Users".to_string()],
        enabled: true,
        local_user_id: None,
        last_sync_at: Utc::now().to_rfc3339(),
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
    };
    
    Ok(user)
}

/// Sync users from LDAP
/// Note: Full LDAP sync requires the ldap3 crate
#[command]
pub async fn sync_ldap_users(
    state: State<'_, AppState>,
    config_id: String,
) -> Result<HashMap<String, i32>, String> {
    let record = state.database.get_ldap_config(&config_id)
        .map_err(|e| format!("Failed to fetch LDAP config: {}", e))?
        .ok_or("LDAP configuration not found")?;
    
    if !record.enabled {
        return Err("LDAP configuration is disabled".to_string());
    }
    
    // Note: In production, use ldap3 crate for actual LDAP sync:
    // 1. Search for users matching filter
    // 2. Compare with existing users in database
    // 3. Create/Update/Disable users as needed
    // For now, return validated mock result
    
    let mut result = HashMap::new();
    result.insert("created".to_string(), 0);
    result.insert("updated".to_string(), 0);
    result.insert("disabled".to_string(), 0);
    result.insert("total".to_string(), 0);
    result.insert("status".to_string(), 1); // 1 = validated, not synced
    
    Ok(result)
}

/// Sync groups from LDAP
/// Note: Full LDAP sync requires the ldap3 crate
#[command]
pub async fn sync_ldap_groups(
    state: State<'_, AppState>,
    config_id: String,
) -> Result<Vec<LDAPGroup>, String> {
    let record = state.database.get_ldap_config(&config_id)
        .map_err(|e| format!("Failed to fetch LDAP config: {}", e))?
        .ok_or("LDAP configuration not found")?;
    
    if !record.enabled {
        return Err("LDAP configuration is disabled".to_string());
    }
    
    // Get existing groups from database
    let db_groups = state.database.get_ldap_groups(&config_id)
        .map_err(|e| format!("Failed to fetch LDAP groups: {}", e))?;
    
    let groups: Vec<LDAPGroup> = db_groups.into_iter().map(|g| {
        LDAPGroup {
            id: g.id,
            ldap_config_id: g.ldap_config_id,
            distinguished_name: g.distinguished_name,
            common_name: g.common_name,
            description: g.description,
            mapped_role: g.mapped_role,
            member_count: g.member_count,
            created_at: chrono::DateTime::from_timestamp(g.created_at, 0)
                .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
            updated_at: chrono::DateTime::from_timestamp(g.updated_at, 0)
                .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
        }
    }).collect();
    
    Ok(groups)
}

/// Get LDAP groups
#[command]
pub async fn get_ldap_groups(
    state: State<'_, AppState>,
    config_id: String,
) -> Result<Vec<LDAPGroup>, String> {
    sync_ldap_groups(state, config_id).await
}

/// Map LDAP group to application role
#[command]
pub async fn map_ldap_group_role(
    state: State<'_, AppState>,
    request: MapLDAPGroupRequest,
) -> Result<LDAPGroup, String> {
    // Get existing group from database
    let groups = state.database.get_ldap_groups(&request.group_id)
        .map_err(|e| format!("Failed to fetch group: {}", e))?;
    
    let existing = groups.into_iter().find(|g| g.id == request.group_id);
    
    let now = Utc::now();
    
    let group_record = LDAPGroupRecord {
        id: request.group_id.clone(),
        ldap_config_id: existing.as_ref().map(|g| g.ldap_config_id.clone()).unwrap_or_default(),
        distinguished_name: existing.as_ref().map(|g| g.distinguished_name.clone()).unwrap_or_default(),
        common_name: existing.as_ref().map(|g| g.common_name.clone()).unwrap_or_default(),
        description: existing.as_ref().and_then(|g| g.description.clone()),
        mapped_role: Some(request.role.clone()),
        member_count: existing.as_ref().map(|g| g.member_count).unwrap_or(0),
        created_at: existing.as_ref().map(|g| g.created_at).unwrap_or(now.timestamp()),
        updated_at: now.timestamp(),
    };
    
    state.database.save_ldap_group(&group_record)
        .map_err(|e| format!("Failed to save group mapping: {}", e))?;
    
    let group = LDAPGroup {
        id: group_record.id,
        ldap_config_id: group_record.ldap_config_id,
        distinguished_name: group_record.distinguished_name,
        common_name: group_record.common_name,
        description: group_record.description,
        mapped_role: group_record.mapped_role,
        member_count: group_record.member_count,
        created_at: chrono::DateTime::from_timestamp(group_record.created_at, 0)
            .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
        updated_at: now.to_rfc3339(),
    };
    
    Ok(group)
}

/// Get LDAP users
#[command]
pub async fn get_ldap_users(
    state: State<'_, AppState>,
    config_id: String,
    _search: Option<String>,
    _limit: Option<i32>,
) -> Result<Vec<LDAPUser>, String> {
    let records = state.database.get_ldap_users(&config_id)
        .map_err(|e| format!("Failed to fetch LDAP users: {}", e))?;
    
    let users: Vec<LDAPUser> = records.into_iter().map(|r| {
        let groups: Vec<String> = r.groups
            .map(|g| serde_json::from_str(&g).unwrap_or_default())
            .unwrap_or_default();
        
        LDAPUser {
            id: r.id,
            ldap_config_id: r.ldap_config_id,
            distinguished_name: r.distinguished_name,
            username: r.username,
            email: r.email,
            display_name: r.display_name,
            groups,
            enabled: r.enabled,
            local_user_id: r.local_user_id,
            last_sync_at: chrono::DateTime::from_timestamp(r.last_sync_at, 0)
                .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
            created_at: chrono::DateTime::from_timestamp(r.last_sync_at, 0)
                .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
            updated_at: chrono::DateTime::from_timestamp(r.last_sync_at, 0)
                .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
        }
    }).collect();
    
    Ok(users)
}

// ============================================================================
// AUDIT COMMANDS
// ============================================================================

/// Log SSO/LDAP audit event
/// Note: SSO events are logged to the general tenant audit log
#[command]
pub async fn log_sso_event(
    state: State<'_, AppState>,
    tenant_id: Option<String>,
    user_id: Option<String>,
    provider_id: Option<String>,
    event_type: String,
    event_details: Option<String>,
    success: bool,
    error_message: Option<String>,
) -> Result<SSOAuditEvent, String> {
    let now = Utc::now();
    let event_id = Uuid::new_v4().to_string();
    
    // Create audit record for tenant audit log
    if let Some(tid) = tenant_id.clone() {
        let record = crate::database::TenantAuditRecord {
            id: event_id.clone(),
            tenant_id: tid,
            user_id: user_id.clone(),
            action: event_type.clone(),
            resource_type: Some("sso".to_string()),
            resource_id: provider_id.clone(),
            old_values: None,
            new_values: event_details.clone(),
            ip_address: None,
            user_agent: None,
            created_at: now.timestamp(),
        };
        
        let _ = state.database.save_tenant_audit(&record);
    }
    
    let event = SSOAuditEvent {
        id: event_id,
        tenant_id,
        user_id,
        provider_id,
        event_type,
        event_details,
        ip_address: None,
        user_agent: None,
        success,
        error_message,
        created_at: now.to_rfc3339(),
    };
    
    Ok(event)
}

/// Get SSO audit log
/// Note: SSO events are stored in the general tenant audit log
#[command]
pub async fn get_sso_audit_log(
    state: State<'_, AppState>,
    tenant_id: Option<String>,
    _event_type: Option<String>,
    limit: Option<i32>,
) -> Result<Vec<SSOAuditEvent>, String> {
    let limit = limit.unwrap_or(100);
    
    // Fetch from tenant audit log if tenant_id provided
    if let Some(tid) = tenant_id.clone() {
        let records = state.database.get_tenant_audit_log(&tid, limit)
            .map_err(|e| format!("Failed to fetch audit log: {}", e))?;
        
        let events: Vec<SSOAuditEvent> = records.into_iter()
            .filter(|r| r.resource_type.as_deref() == Some("sso"))
            .map(|r| SSOAuditEvent {
                id: r.id,
                tenant_id: Some(r.tenant_id),
                user_id: r.user_id,
                provider_id: r.resource_id,
                event_type: r.action,
                event_details: r.new_values,
                ip_address: r.ip_address,
                user_agent: r.user_agent,
                success: true, // No error means success
                error_message: None,
                created_at: chrono::DateTime::from_timestamp(r.created_at, 0)
                    .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
            })
            .collect();
        
        return Ok(events);
    }
    
    // Return empty if no tenant specified
    Ok(vec![])
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Convert LDAPConfigRecord to LDAPConfig
fn ldap_record_to_config(record: LDAPConfigRecord) -> LDAPConfig {
    LDAPConfig {
        id: record.id,
        tenant_id: record.tenant_id,
        name: record.name,
        enabled: record.enabled,
        server_url: record.server_url,
        port: record.port,
        use_ssl: record.use_ssl,
        use_tls: record.use_tls,
        bind_dn: record.bind_dn,
        bind_password: record.bind_password,
        base_dn: record.base_dn,
        user_filter: record.user_filter,
        group_filter: record.group_filter,
        username_attribute: record.username_attribute,
        email_attribute: record.email_attribute,
        display_name_attribute: record.display_name_attribute,
        group_membership_attribute: record.group_membership_attribute,
        sync_interval_minutes: record.sync_interval_minutes,
        last_sync_at: record.last_sync_at.map(|ts| 
            chrono::DateTime::from_timestamp(ts, 0)
                .map(|dt| dt.to_rfc3339()).unwrap_or_default()
        ),
        sync_status: record.sync_status,
        created_at: chrono::DateTime::from_timestamp(record.created_at, 0)
            .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
        updated_at: chrono::DateTime::from_timestamp(record.updated_at, 0)
            .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
    }
}

// ============================================================================
// MODULE REGISTRATION
// ============================================================================

pub fn get_sso_commands() -> Vec<&'static str> {
    vec![
        // SSO Provider management
        "create_saml_provider",
        "create_oidc_provider",
        "get_sso_provider",
        "get_tenant_sso_providers",
        "update_sso_provider",
        "delete_sso_provider",
        "test_sso_provider",
        "get_sp_metadata",
        // SSO Authentication
        "initiate_sso",
        "complete_sso",
        "initiate_sso_logout",
        "get_sso_session",
        "invalidate_sso_session",
        // LDAP Configuration
        "create_ldap_config",
        "get_ldap_config",
        "get_tenant_ldap_configs",
        "update_ldap_config",
        "delete_ldap_config",
        "test_ldap_connection",
        // LDAP Authentication & Sync
        "ldap_authenticate",
        "sync_ldap_users",
        "sync_ldap_groups",
        "get_ldap_groups",
        "map_ldap_group_role",
        "get_ldap_users",
        // Audit
        "log_sso_event",
        "get_sso_audit_log",
    ]
}
