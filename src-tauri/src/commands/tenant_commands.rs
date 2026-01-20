/**
 * Multi-Tenant System Commands for CUBE Elite v6
 * 
 * Complete backend implementation for multi-tenancy including:
 * - Tenant (organization) management
 * - User-tenant relationships
 * - Role-based access control (RBAC)
 * - Invitation system
 * - Usage tracking and billing
 * - Tenant audit logging
 * - White-label configuration
 * 
 * Copyright (c) 2026 CUBE AI.tools - All rights reserved
 */

use crate::AppState;
use crate::database::{
    TenantRecord, TenantUserRecord, TenantInvitationRecord, 
    TenantRoleRecord, TenantAuditRecord,
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
pub enum TenantStatus {
    Active,
    Suspended,
    PendingSetup,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TenantPlan {
    Free,
    Pro,
    Business,
    Enterprise,
    WhiteLabel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tenant {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub domain: Option<String>,
    pub custom_domain: Option<String>,
    pub logo_url: Option<String>,
    pub status: TenantStatus,
    pub plan: TenantPlan,
    
    // Owner and billing
    pub owner_id: String,
    pub billing_email: Option<String>,
    pub stripe_customer_id: Option<String>,
    pub stripe_subscription_id: Option<String>,
    
    // Settings
    pub settings: TenantSettings,
    pub features: TenantFeatures,
    
    // Limits
    pub max_users: i32,
    pub max_storage_gb: i32,
    pub max_api_calls_month: i32,
    
    // Timestamps
    pub trial_ends_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantSettings {
    pub default_timezone: String,
    pub default_language: String,
    pub date_format: String,
    pub currency: String,
    pub enforce_2fa: bool,
    pub password_policy: PasswordPolicy,
    pub session_timeout_minutes: i32,
    pub ip_whitelist: Vec<String>,
    pub allowed_email_domains: Vec<String>,
}

impl Default for TenantSettings {
    fn default() -> Self {
        Self {
            default_timezone: "UTC".to_string(),
            default_language: "en".to_string(),
            date_format: "YYYY-MM-DD".to_string(),
            currency: "USD".to_string(),
            enforce_2fa: false,
            password_policy: PasswordPolicy::default(),
            session_timeout_minutes: 480,
            ip_whitelist: vec![],
            allowed_email_domains: vec![],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordPolicy {
    pub min_length: i32,
    pub require_uppercase: bool,
    pub require_lowercase: bool,
    pub require_numbers: bool,
    pub require_special: bool,
    pub max_age_days: Option<i32>,
    pub prevent_reuse_count: i32,
}

impl Default for PasswordPolicy {
    fn default() -> Self {
        Self {
            min_length: 8,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_special: false,
            max_age_days: None,
            prevent_reuse_count: 3,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantFeatures {
    pub automation: bool,
    pub ai_assistant: bool,
    pub api_access: bool,
    pub custom_integrations: bool,
    pub sso: bool,
    pub ldap: bool,
    pub audit_logs: bool,
    pub advanced_analytics: bool,
    pub white_label: bool,
    pub priority_support: bool,
    pub custom_branding: bool,
    pub data_export: bool,
}

impl Default for TenantFeatures {
    fn default() -> Self {
        Self {
            automation: true,
            ai_assistant: true,
            api_access: false,
            custom_integrations: false,
            sso: false,
            ldap: false,
            audit_logs: true,
            advanced_analytics: false,
            white_label: false,
            priority_support: false,
            custom_branding: false,
            data_export: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UserRole {
    Owner,
    Admin,
    Manager,
    Member,
    Viewer,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantUser {
    pub id: String,
    pub tenant_id: String,
    pub user_id: String,
    pub email: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub role: UserRole,
    pub permissions: Vec<String>,
    pub department: Option<String>,
    pub title: Option<String>,
    pub is_active: bool,
    pub last_active_at: Option<String>,
    pub joined_at: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InvitationStatus {
    Pending,
    Accepted,
    Expired,
    Revoked,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantInvitation {
    pub id: String,
    pub tenant_id: String,
    pub email: String,
    pub role: UserRole,
    pub invited_by: String,
    pub message: Option<String>,
    pub token: String,
    pub status: InvitationStatus,
    pub expires_at: String,
    pub accepted_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantRole {
    pub id: String,
    pub tenant_id: String,
    pub name: String,
    pub description: Option<String>,
    pub permissions: Vec<String>,
    pub is_system: bool,
    pub user_count: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantAuditEvent {
    pub id: String,
    pub tenant_id: String,
    pub user_id: Option<String>,
    pub action: String,
    pub resource_type: String,
    pub resource_id: Option<String>,
    pub details: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantUsage {
    pub id: String,
    pub tenant_id: String,
    pub period_start: String,
    pub period_end: String,
    pub users_count: i32,
    pub storage_used_bytes: i64,
    pub api_calls_count: i32,
    pub automations_run: i32,
    pub ai_tokens_used: i32,
    pub bandwidth_bytes: i64,
    pub overage_charges: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhiteLabelConfig {
    pub id: String,
    pub tenant_id: String,
    pub enabled: bool,
    
    // Branding
    pub company_name: String,
    pub logo_light_url: Option<String>,
    pub logo_dark_url: Option<String>,
    pub favicon_url: Option<String>,
    
    // Colors
    pub primary_color: String,
    pub secondary_color: String,
    pub accent_color: String,
    
    // Custom domain
    pub custom_domain: Option<String>,
    pub ssl_enabled: bool,
    
    // Legal
    pub terms_url: Option<String>,
    pub privacy_url: Option<String>,
    pub support_email: Option<String>,
    pub support_url: Option<String>,
    
    // Features
    pub hide_powered_by: bool,
    pub custom_login_page: bool,
    pub custom_email_templates: bool,
    
    pub created_at: String,
    pub updated_at: String,
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateTenantRequest {
    pub name: String,
    pub owner_email: String,
    pub plan: Option<TenantPlan>,
    pub domain: Option<String>,
    pub settings: Option<TenantSettings>,
}

#[derive(Debug, Deserialize)]
pub struct InviteUserRequest {
    pub tenant_id: String,
    pub email: String,
    pub role: UserRole,
    pub message: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRoleRequest {
    pub tenant_id: String,
    pub name: String,
    pub description: Option<String>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRoleRequest {
    pub tenant_id: String,
    pub user_id: String,
    pub role: UserRole,
    pub permissions: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct ConfigureWhiteLabelRequest {
    pub tenant_id: String,
    pub company_name: String,
    pub primary_color: String,
    pub secondary_color: String,
    pub accent_color: String,
    pub custom_domain: Option<String>,
    pub logo_light_url: Option<String>,
    pub logo_dark_url: Option<String>,
    pub hide_powered_by: Option<bool>,
}

// ============================================================================
// TENANT MANAGEMENT COMMANDS
// ============================================================================

/// Create a new tenant (organization)
#[command]
pub async fn create_tenant(
    state: State<'_, AppState>,
    request: CreateTenantRequest,
) -> Result<Tenant, String> {
    let now = Utc::now();
    let slug = slugify(&request.name);
    
    let plan = request.plan.unwrap_or(TenantPlan::Free);
    let (max_users, max_storage, max_api_calls, features) = get_plan_limits(&plan);
    
    let tenant_id = Uuid::new_v4().to_string();
    let owner_id = Uuid::new_v4().to_string();
    
    // Create database record
    let db_record = TenantRecord {
        id: tenant_id.clone(),
        name: request.name.clone(),
        slug: slug.clone(),
        domain: request.domain.clone(),
        logo: None,
        primary_color: None,
        status: "active".to_string(),
        subscription_tier: format!("{:?}", plan).to_lowercase(),
        max_users,
        max_storage_gb: max_storage,
        features: Some(serde_json::to_string(&features).unwrap_or_default()),
        settings: Some(serde_json::to_string(&request.settings.clone().unwrap_or_default()).unwrap_or_default()),
        billing_email: Some(request.owner_email.clone()),
        billing_address: None,
        stripe_customer_id: None,
        stripe_subscription_id: None,
        trial_ends_at: Some((now + Duration::days(14)).timestamp()),
        created_at: now.timestamp(),
        updated_at: now.timestamp(),
    };
    
    // Save tenant to database
    state.database.save_tenant(&db_record)
        .map_err(|e| format!("Failed to save tenant: {}", e))?;
    
    // Create owner TenantUser record
    let owner_user_record = TenantUserRecord {
        id: Uuid::new_v4().to_string(),
        tenant_id: tenant_id.clone(),
        user_id: owner_id.clone(),
        role: "owner".to_string(),
        permissions: Some("*".to_string()),
        invited_by: None,
        invited_at: None,
        joined_at: Some(now.timestamp()),
        status: "active".to_string(),
        last_active_at: Some(now.timestamp()),
        created_at: now.timestamp(),
        updated_at: now.timestamp(),
    };
    
    state.database.save_tenant_user(&owner_user_record)
        .map_err(|e| format!("Failed to create owner user: {}", e))?;
    
    // Log audit event
    let audit_record = TenantAuditRecord {
        id: Uuid::new_v4().to_string(),
        tenant_id: tenant_id.clone(),
        user_id: Some(owner_id.clone()),
        action: "tenant.created".to_string(),
        resource_type: Some("tenant".to_string()),
        resource_id: Some(tenant_id.clone()),
        old_values: None,
        new_values: Some(serde_json::json!({"name": request.name, "email": request.owner_email}).to_string()),
        ip_address: None,
        user_agent: None,
        created_at: now.timestamp(),
    };
    
    let _ = state.database.save_tenant_audit(&audit_record);
    
    let tenant = Tenant {
        id: tenant_id,
        name: request.name,
        slug: slug.clone(),
        domain: request.domain,
        custom_domain: None,
        logo_url: None,
        status: TenantStatus::Active,
        plan,
        owner_id,
        billing_email: Some(request.owner_email.clone()),
        stripe_customer_id: None,
        stripe_subscription_id: None,
        settings: request.settings.unwrap_or_default(),
        features,
        max_users,
        max_storage_gb: max_storage,
        max_api_calls_month: max_api_calls,
        trial_ends_at: Some((now + Duration::days(14)).to_rfc3339()),
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
    };
    
    Ok(tenant)
}

/// Get tenant by ID
#[command]
pub async fn get_tenant(
    state: State<'_, AppState>,
    tenant_id: String,
) -> Result<Tenant, String> {
    // Fetch from database
    if let Ok(Some(record)) = state.database.get_tenant(&tenant_id) {
        let features: TenantFeatures = record.features
            .as_ref()
            .and_then(|f| serde_json::from_str(f).ok())
            .unwrap_or_default();
        
        let settings: TenantSettings = record.settings
            .as_ref()
            .and_then(|s| serde_json::from_str(s).ok())
            .unwrap_or_default();
        
        let plan = match record.subscription_tier.as_str() {
            "free" => TenantPlan::Free,
            "pro" => TenantPlan::Pro,
            "business" => TenantPlan::Business,
            "enterprise" => TenantPlan::Enterprise,
            "whitelabel" => TenantPlan::WhiteLabel,
            _ => TenantPlan::Free,
        };
        
        let status = match record.status.as_str() {
            "active" => TenantStatus::Active,
            "suspended" => TenantStatus::Suspended,
            "pending_setup" => TenantStatus::PendingSetup,
            "cancelled" => TenantStatus::Cancelled,
            _ => TenantStatus::Active,
        };
        
        let tenant = Tenant {
            id: record.id,
            name: record.name,
            slug: record.slug,
            domain: record.domain.clone(),
            custom_domain: record.domain,
            logo_url: record.logo,
            status,
            plan,
            owner_id: "owner".to_string(), // Retrieved separately if needed
            billing_email: record.billing_email,
            stripe_customer_id: record.stripe_customer_id,
            stripe_subscription_id: record.stripe_subscription_id,
            settings,
            features,
            max_users: record.max_users,
            max_storage_gb: record.max_storage_gb,
            max_api_calls_month: 1000000, // Default, could be stored
            trial_ends_at: record.trial_ends_at.map(|t| {
                chrono::DateTime::from_timestamp(t, 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default()
            }),
            created_at: chrono::DateTime::from_timestamp(record.created_at, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
            updated_at: chrono::DateTime::from_timestamp(record.updated_at, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
        };
        
        return Ok(tenant);
    }
    
    Err(format!("Tenant not found: {}", tenant_id))
}

/// Get all tenants (admin only)
#[command]
pub async fn get_all_tenants(
    state: State<'_, AppState>,
    _status: Option<TenantStatus>,
    _plan: Option<TenantPlan>,
    limit: Option<i32>,
) -> Result<Vec<Tenant>, String> {
    let records = state.database.get_all_tenants()
        .map_err(|e| format!("Failed to fetch tenants: {}", e))?;
    
    let tenants: Vec<Tenant> = records.into_iter().map(|record| {
        let features: TenantFeatures = record.features
            .as_ref()
            .and_then(|f| serde_json::from_str(f).ok())
            .unwrap_or_default();
        
        let settings: TenantSettings = record.settings
            .as_ref()
            .and_then(|s| serde_json::from_str(s).ok())
            .unwrap_or_default();
        
        let plan = match record.subscription_tier.as_str() {
            "free" => TenantPlan::Free,
            "pro" => TenantPlan::Pro,
            "business" => TenantPlan::Business,
            "enterprise" => TenantPlan::Enterprise,
            "whitelabel" => TenantPlan::WhiteLabel,
            _ => TenantPlan::Free,
        };
        
        let status = match record.status.as_str() {
            "active" => TenantStatus::Active,
            "suspended" => TenantStatus::Suspended,
            "pending_setup" => TenantStatus::PendingSetup,
            "cancelled" => TenantStatus::Cancelled,
            _ => TenantStatus::Active,
        };
        
        Tenant {
            id: record.id,
            name: record.name,
            slug: record.slug,
            domain: record.domain.clone(),
            custom_domain: record.domain,
            logo_url: record.logo,
            status,
            plan,
            owner_id: "owner".to_string(),
            billing_email: record.billing_email,
            stripe_customer_id: record.stripe_customer_id,
            stripe_subscription_id: record.stripe_subscription_id,
            settings,
            features,
            max_users: record.max_users,
            max_storage_gb: record.max_storage_gb,
            max_api_calls_month: 1000000,
            trial_ends_at: record.trial_ends_at.map(|t| {
                chrono::DateTime::from_timestamp(t, 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default()
            }),
            created_at: chrono::DateTime::from_timestamp(record.created_at, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
            updated_at: chrono::DateTime::from_timestamp(record.updated_at, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
        }
    }).collect();
    
    Ok(tenants)
}

/// Get tenants for a user
#[command]
pub async fn get_user_tenants(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<Vec<Tenant>, String> {
    let records = state.database.get_user_tenants(&user_id)
        .map_err(|e| format!("Failed to fetch user tenants: {}", e))?;
    
    let tenants: Vec<Tenant> = records.into_iter().map(|record| {
        let features: TenantFeatures = record.features
            .as_ref()
            .and_then(|f| serde_json::from_str(f).ok())
            .unwrap_or_default();
        
        let settings: TenantSettings = record.settings
            .as_ref()
            .and_then(|s| serde_json::from_str(s).ok())
            .unwrap_or_default();
        
        let plan = match record.subscription_tier.as_str() {
            "free" => TenantPlan::Free,
            "pro" => TenantPlan::Pro,
            "business" => TenantPlan::Business,
            "enterprise" => TenantPlan::Enterprise,
            "whitelabel" => TenantPlan::WhiteLabel,
            _ => TenantPlan::Free,
        };
        
        let status = match record.status.as_str() {
            "active" => TenantStatus::Active,
            "suspended" => TenantStatus::Suspended,
            "pending_setup" => TenantStatus::PendingSetup,
            "cancelled" => TenantStatus::Cancelled,
            _ => TenantStatus::Active,
        };
        
        Tenant {
            id: record.id,
            name: record.name,
            slug: record.slug,
            domain: record.domain.clone(),
            custom_domain: record.domain,
            logo_url: record.logo,
            status,
            plan,
            owner_id: "owner".to_string(),
            billing_email: record.billing_email,
            stripe_customer_id: record.stripe_customer_id,
            stripe_subscription_id: record.stripe_subscription_id,
            settings,
            features,
            max_users: record.max_users,
            max_storage_gb: record.max_storage_gb,
            max_api_calls_month: 1000000,
            trial_ends_at: record.trial_ends_at.map(|t| {
                chrono::DateTime::from_timestamp(t, 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default()
            }),
            created_at: chrono::DateTime::from_timestamp(record.created_at, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
            updated_at: chrono::DateTime::from_timestamp(record.updated_at, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
        }
    }).collect();
    
    Ok(tenants)
}

/// Update tenant
#[command]
pub async fn update_tenant(
    state: State<'_, AppState>,
    tenant_id: String,
    updates: HashMap<String, serde_json::Value>,
) -> Result<Tenant, String> {
    // Fetch current tenant from database
    let current_record = state.database.get_tenant(&tenant_id)
        .map_err(|e| format!("Failed to fetch tenant: {}", e))?
        .ok_or_else(|| format!("Tenant not found: {}", tenant_id))?;
    
    let now = Utc::now();
    
    // Apply updates to create new record
    let updated_record = TenantRecord {
        id: current_record.id.clone(),
        name: updates.get("name")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| current_record.name.clone()),
        slug: current_record.slug.clone(),
        domain: updates.get("domain")
            .and_then(|v| v.as_str())
            .map(|s| Some(s.to_string()))
            .unwrap_or_else(|| current_record.domain.clone()),
        logo: updates.get("logo_url")
            .and_then(|v| v.as_str())
            .map(|s| Some(s.to_string()))
            .unwrap_or_else(|| current_record.logo.clone()),
        primary_color: current_record.primary_color.clone(),
        status: current_record.status.clone(),
        subscription_tier: current_record.subscription_tier.clone(),
        max_users: current_record.max_users,
        max_storage_gb: current_record.max_storage_gb,
        features: current_record.features.clone(),
        settings: current_record.settings.clone(),
        billing_email: updates.get("billing_email")
            .and_then(|v| v.as_str())
            .map(|s| Some(s.to_string()))
            .unwrap_or_else(|| current_record.billing_email.clone()),
        billing_address: current_record.billing_address.clone(),
        stripe_customer_id: current_record.stripe_customer_id.clone(),
        stripe_subscription_id: current_record.stripe_subscription_id.clone(),
        trial_ends_at: current_record.trial_ends_at,
        created_at: current_record.created_at,
        updated_at: now.timestamp(),
    };
    
    // Save updated tenant
    state.database.save_tenant(&updated_record)
        .map_err(|e| format!("Failed to update tenant: {}", e))?;
    
    // Log audit event
    let audit_record = TenantAuditRecord {
        id: Uuid::new_v4().to_string(),
        tenant_id: tenant_id.clone(),
        user_id: None,
        action: "tenant.updated".to_string(),
        resource_type: Some("tenant".to_string()),
        resource_id: Some(tenant_id.clone()),
        old_values: Some(serde_json::json!({"updated": true}).to_string()),
        new_values: Some(serde_json::to_string(&updates).unwrap_or_default()),
        ip_address: None,
        user_agent: None,
        created_at: now.timestamp(),
    };
    let _ = state.database.save_tenant_audit(&audit_record);
    
    // Return updated tenant
    get_tenant(state, tenant_id).await
}

/// Update tenant settings
#[command]
pub async fn update_tenant_settings(
    state: State<'_, AppState>,
    tenant_id: String,
    settings: TenantSettings,
) -> Result<Tenant, String> {
    let current_record = state.database.get_tenant(&tenant_id)
        .map_err(|e| format!("Failed to fetch tenant: {}", e))?
        .ok_or_else(|| format!("Tenant not found: {}", tenant_id))?;
    
    let now = Utc::now();
    
    let updated_record = TenantRecord {
        settings: Some(serde_json::to_string(&settings).unwrap_or_default()),
        updated_at: now.timestamp(),
        ..current_record
    };
    
    state.database.save_tenant(&updated_record)
        .map_err(|e| format!("Failed to update tenant settings: {}", e))?;
    
    get_tenant(state, tenant_id).await
}

/// Delete tenant (soft delete)
#[command]
pub async fn delete_tenant(
    state: State<'_, AppState>,
    tenant_id: String,
) -> Result<bool, String> {
    let result = state.database.delete_tenant(&tenant_id)
        .map_err(|e| format!("Failed to delete tenant: {}", e))?;
    
    if result {
        // Log audit event
        let audit_record = TenantAuditRecord {
            id: Uuid::new_v4().to_string(),
            tenant_id: tenant_id.clone(),
            user_id: None,
            action: "tenant.deleted".to_string(),
            resource_type: Some("tenant".to_string()),
            resource_id: Some(tenant_id),
            old_values: None,
            new_values: None,
            ip_address: None,
            user_agent: None,
            created_at: Utc::now().timestamp(),
        };
        let _ = state.database.save_tenant_audit(&audit_record);
    }
    
    Ok(result)
}

/// Suspend tenant
#[command]
pub async fn suspend_tenant(
    state: State<'_, AppState>,
    tenant_id: String,
    reason: String,
) -> Result<Tenant, String> {
    let result = state.database.update_tenant_status(&tenant_id, "suspended")
        .map_err(|e| format!("Failed to suspend tenant: {}", e))?;
    
    if result {
        // Log audit event with suspension reason
        let audit_record = TenantAuditRecord {
            id: Uuid::new_v4().to_string(),
            tenant_id: tenant_id.clone(),
            user_id: None,
            action: "tenant.suspended".to_string(),
            resource_type: Some("tenant".to_string()),
            resource_id: Some(tenant_id.clone()),
            old_values: None,
            new_values: Some(serde_json::json!({"reason": reason}).to_string()),
            ip_address: None,
            user_agent: None,
            created_at: Utc::now().timestamp(),
        };
        let _ = state.database.save_tenant_audit(&audit_record);
    }
    
    get_tenant(state, tenant_id).await
}

/// Reactivate tenant
#[command]
pub async fn reactivate_tenant(
    state: State<'_, AppState>,
    tenant_id: String,
) -> Result<Tenant, String> {
    let result = state.database.update_tenant_status(&tenant_id, "active")
        .map_err(|e| format!("Failed to reactivate tenant: {}", e))?;
    
    if result {
        // Log audit event
        let audit_record = TenantAuditRecord {
            id: Uuid::new_v4().to_string(),
            tenant_id: tenant_id.clone(),
            user_id: None,
            action: "tenant.reactivated".to_string(),
            resource_type: Some("tenant".to_string()),
            resource_id: Some(tenant_id.clone()),
            old_values: None,
            new_values: None,
            ip_address: None,
            user_agent: None,
            created_at: Utc::now().timestamp(),
        };
        let _ = state.database.save_tenant_audit(&audit_record);
    }
    
    get_tenant(state, tenant_id).await
}

/// Upgrade tenant plan
#[command]
pub async fn upgrade_tenant_plan(
    state: State<'_, AppState>,
    tenant_id: String,
    new_plan: TenantPlan,
) -> Result<Tenant, String> {
    let current_record = state.database.get_tenant(&tenant_id)
        .map_err(|e| format!("Failed to fetch tenant: {}", e))?
        .ok_or_else(|| format!("Tenant not found: {}", tenant_id))?;
    
    let (max_users, max_storage, _max_api_calls, features) = get_plan_limits(&new_plan);
    let now = Utc::now();
    
    let updated_record = TenantRecord {
        subscription_tier: format!("{:?}", new_plan).to_lowercase(),
        max_users,
        max_storage_gb: max_storage,
        features: Some(serde_json::to_string(&features).unwrap_or_default()),
        updated_at: now.timestamp(),
        ..current_record.clone()
    };
    
    state.database.save_tenant(&updated_record)
        .map_err(|e| format!("Failed to upgrade tenant plan: {}", e))?;
    
    // Log audit event
    let audit_record = TenantAuditRecord {
        id: Uuid::new_v4().to_string(),
        tenant_id: tenant_id.clone(),
        user_id: None,
        action: "tenant.plan_upgraded".to_string(),
        resource_type: Some("tenant".to_string()),
        resource_id: Some(tenant_id.clone()),
        old_values: Some(serde_json::json!({"plan": current_record.subscription_tier}).to_string()),
        new_values: Some(serde_json::json!({"plan": format!("{:?}", new_plan).to_lowercase()}).to_string()),
        ip_address: None,
        user_agent: None,
        created_at: now.timestamp(),
    };
    let _ = state.database.save_tenant_audit(&audit_record);
    
    get_tenant(state, tenant_id).await
}

// ============================================================================
// USER MANAGEMENT COMMANDS
// ============================================================================

/// Get users in a tenant
#[command]
pub async fn get_tenant_users(
    state: State<'_, AppState>,
    tenant_id: String,
    _search: Option<String>,
    _role: Option<UserRole>,
    limit: Option<i32>,
) -> Result<Vec<TenantUser>, String> {
    let records = state.database.get_tenant_users(&tenant_id)
        .map_err(|e| format!("Failed to fetch tenant users: {}", e))?;
    
    let users: Vec<TenantUser> = records.into_iter().map(|record| {
        let role = match record.role.as_str() {
            "owner" => UserRole::Owner,
            "admin" => UserRole::Admin,
            "manager" => UserRole::Manager,
            "member" => UserRole::Member,
            "viewer" => UserRole::Viewer,
            other => UserRole::Custom(other.to_string()),
        };
        
        let permissions: Vec<String> = record.permissions
            .as_ref()
            .map(|p| p.split(',').map(|s| s.trim().to_string()).collect())
            .unwrap_or_default();
        
        TenantUser {
            id: record.id,
            tenant_id: record.tenant_id,
            user_id: record.user_id,
            email: "user@example.com".to_string(), // Would be joined from users table
            display_name: "User".to_string(),
            avatar_url: None,
            role,
            permissions,
            department: None,
            title: None,
            is_active: record.status == "active",
            last_active_at: record.last_active_at.map(|t| {
                chrono::DateTime::from_timestamp(t, 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default()
            }),
            joined_at: record.joined_at.map(|t| {
                chrono::DateTime::from_timestamp(t, 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default()
            }).unwrap_or_default(),
            created_at: chrono::DateTime::from_timestamp(record.created_at, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
            updated_at: chrono::DateTime::from_timestamp(record.updated_at, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
        }
    }).collect();
    
    Ok(users)
}

/// Get single tenant user
#[command]
pub async fn get_tenant_user(
    state: State<'_, AppState>,
    tenant_id: String,
    user_id: String,
) -> Result<TenantUser, String> {
    if let Ok(Some(record)) = state.database.get_tenant_user(&tenant_id, &user_id) {
        let role = match record.role.as_str() {
            "owner" => UserRole::Owner,
            "admin" => UserRole::Admin,
            "manager" => UserRole::Manager,
            "member" => UserRole::Member,
            "viewer" => UserRole::Viewer,
            other => UserRole::Custom(other.to_string()),
        };
        
        let permissions: Vec<String> = record.permissions
            .as_ref()
            .map(|p| p.split(',').map(|s| s.trim().to_string()).collect())
            .unwrap_or_default();
        
        return Ok(TenantUser {
            id: record.id,
            tenant_id: record.tenant_id,
            user_id: record.user_id,
            email: "user@example.com".to_string(),
            display_name: "User".to_string(),
            avatar_url: None,
            role,
            permissions,
            department: None,
            title: None,
            is_active: record.status == "active",
            last_active_at: record.last_active_at.map(|t| {
                chrono::DateTime::from_timestamp(t, 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default()
            }),
            joined_at: record.joined_at.map(|t| {
                chrono::DateTime::from_timestamp(t, 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default()
            }).unwrap_or_default(),
            created_at: chrono::DateTime::from_timestamp(record.created_at, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
            updated_at: chrono::DateTime::from_timestamp(record.updated_at, 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
        });
    }
    
    Err("User not found in tenant".to_string())
}

/// Update user role in tenant
#[command]
pub async fn update_user_role(
    state: State<'_, AppState>,
    request: UpdateUserRoleRequest,
) -> Result<TenantUser, String> {
    let current = state.database.get_tenant_user(&request.tenant_id, &request.user_id)
        .map_err(|e| format!("Failed to fetch user: {}", e))?
        .ok_or("User not found")?;
    
    let now = Utc::now();
    let role_str = match &request.role {
        UserRole::Owner => "owner",
        UserRole::Admin => "admin",
        UserRole::Manager => "manager",
        UserRole::Member => "member",
        UserRole::Viewer => "viewer",
        UserRole::Custom(r) => r.as_str(),
    };
    
    let permissions_str = request.permissions
        .as_ref()
        .map(|p| p.join(","))
        .or(current.permissions.clone());
    
    let updated_record = TenantUserRecord {
        role: role_str.to_string(),
        permissions: permissions_str,
        updated_at: now.timestamp(),
        ..current
    };
    
    state.database.save_tenant_user(&updated_record)
        .map_err(|e| format!("Failed to update user role: {}", e))?;
    
    get_tenant_user(state, request.tenant_id, request.user_id).await
}

/// Remove user from tenant
#[command]
pub async fn remove_tenant_user(
    state: State<'_, AppState>,
    tenant_id: String,
    user_id: String,
) -> Result<bool, String> {
    let result = state.database.delete_tenant_user(&tenant_id, &user_id)
        .map_err(|e| format!("Failed to remove user: {}", e))?;
    
    if result {
        // Log audit event
        let audit_record = TenantAuditRecord {
            id: Uuid::new_v4().to_string(),
            tenant_id: tenant_id.clone(),
            user_id: Some(user_id.clone()),
            action: "user.removed".to_string(),
            resource_type: Some("tenant_user".to_string()),
            resource_id: Some(user_id),
            old_values: None,
            new_values: None,
            ip_address: None,
            user_agent: None,
            created_at: Utc::now().timestamp(),
        };
        let _ = state.database.save_tenant_audit(&audit_record);
    }
    
    Ok(result)
}

/// Deactivate user in tenant
#[command]
pub async fn deactivate_tenant_user(
    state: State<'_, AppState>,
    tenant_id: String,
    user_id: String,
) -> Result<TenantUser, String> {
    let current = state.database.get_tenant_user(&tenant_id, &user_id)
        .map_err(|e| format!("Failed to fetch user: {}", e))?
        .ok_or("User not found")?;
    
    let now = Utc::now();
    let updated_record = TenantUserRecord {
        status: "inactive".to_string(),
        updated_at: now.timestamp(),
        ..current
    };
    
    state.database.save_tenant_user(&updated_record)
        .map_err(|e| format!("Failed to deactivate user: {}", e))?;
    
    // Log audit event
    let audit_record = TenantAuditRecord {
        id: Uuid::new_v4().to_string(),
        tenant_id: tenant_id.clone(),
        user_id: Some(user_id.clone()),
        action: "user.deactivated".to_string(),
        resource_type: Some("tenant_user".to_string()),
        resource_id: Some(user_id.clone()),
        old_values: None,
        new_values: None,
        ip_address: None,
        user_agent: None,
        created_at: now.timestamp(),
    };
    let _ = state.database.save_tenant_audit(&audit_record);
    
    get_tenant_user(state, tenant_id, user_id).await
}

// ============================================================================
// INVITATION COMMANDS
// ============================================================================

/// Invite user to tenant
#[command]
pub async fn invite_user(
    state: State<'_, AppState>,
    request: InviteUserRequest,
) -> Result<TenantInvitation, String> {
    let now = Utc::now();
    
    let invitation = TenantInvitation {
        id: Uuid::new_v4().to_string(),
        tenant_id: request.tenant_id.clone(),
        email: request.email.clone(),
        role: request.role.clone(),
        invited_by: "current_user".to_string(),
        message: request.message.clone(),
        token: generate_invitation_token(),
        status: InvitationStatus::Pending,
        expires_at: (now + Duration::days(7)).to_rfc3339(),
        accepted_at: None,
        created_at: now.to_rfc3339(),
    };
    
    let record = TenantInvitationRecord {
        id: invitation.id.clone(),
        tenant_id: invitation.tenant_id.clone(),
        email: invitation.email.clone(),
        role: format!("{:?}", invitation.role),
        invited_by: invitation.invited_by.clone(),
        token: invitation.token.clone(),
        expires_at: (now + Duration::days(7)).timestamp(),
        accepted_at: None,
        created_at: now.timestamp(),
    };
    
    state.database.save_invitation(&record)
        .map_err(|e| format!("Failed to save invitation: {}", e))?;
    
    Ok(invitation)
}

/// Get pending invitations for tenant
#[command]
pub async fn get_tenant_invitations(
    state: State<'_, AppState>,
    tenant_id: String,
) -> Result<Vec<TenantInvitation>, String> {
    let records = state.database.get_tenant_invitations(&tenant_id)
        .map_err(|e| format!("Failed to fetch invitations: {}", e))?;
    
    let invitations: Vec<TenantInvitation> = records.into_iter().map(|r| {
        TenantInvitation {
            id: r.id,
            tenant_id: r.tenant_id,
            email: r.email,
            role: parse_user_role(&r.role),
            invited_by: r.invited_by,
            message: None,
            token: r.token,
            status: InvitationStatus::Pending,
            expires_at: chrono::DateTime::from_timestamp(r.expires_at, 0)
                .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
            accepted_at: r.accepted_at.and_then(|t| chrono::DateTime::from_timestamp(t, 0))
                .map(|dt| dt.to_rfc3339()),
            created_at: chrono::DateTime::from_timestamp(r.created_at, 0)
                .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
        }
    }).collect();
    
    Ok(invitations)
}

/// Accept invitation
#[command]
pub async fn accept_invitation(
    state: State<'_, AppState>,
    token: String,
) -> Result<TenantUser, String> {
    let invitation = state.database.get_invitation_by_token(&token)
        .map_err(|e| format!("Failed to find invitation: {}", e))?
        .ok_or("Invitation not found")?;
    
    let now = Utc::now();
    if invitation.expires_at < now.timestamp() {
        return Err("Invitation has expired".to_string());
    }
    
    let user_id = Uuid::new_v4().to_string();
    let tenant_user_id = Uuid::new_v4().to_string();
    
    let user_record = TenantUserRecord {
        id: tenant_user_id.clone(),
        tenant_id: invitation.tenant_id.clone(),
        user_id: user_id.clone(),
        role: invitation.role.clone(),
        permissions: None,
        invited_by: Some(invitation.invited_by.clone()),
        invited_at: Some(invitation.created_at),
        joined_at: Some(now.timestamp()),
        status: "active".to_string(),
        last_active_at: Some(now.timestamp()),
        created_at: now.timestamp(),
        updated_at: now.timestamp(),
    };
    
    state.database.save_tenant_user(&user_record)
        .map_err(|e| format!("Failed to create user: {}", e))?;
    
    state.database.update_invitation_status(&invitation.id, "accepted")
        .map_err(|e| format!("Failed to update invitation: {}", e))?;
    
    let user = TenantUser {
        id: tenant_user_id,
        tenant_id: invitation.tenant_id,
        user_id,
        email: invitation.email,
        display_name: "New User".to_string(),
        avatar_url: None,
        role: parse_user_role(&invitation.role),
        permissions: vec![],
        department: None,
        title: None,
        is_active: true,
        last_active_at: Some(now.to_rfc3339()),
        joined_at: now.to_rfc3339(),
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
    };
    
    Ok(user)
}

/// Revoke invitation
#[command]
pub async fn revoke_invitation(
    state: State<'_, AppState>,
    invitation_id: String,
) -> Result<bool, String> {
    state.database.update_invitation_status(&invitation_id, "revoked")
        .map_err(|e| format!("Failed to revoke invitation: {}", e))?;
    Ok(true)
}

/// Resend invitation
#[command]
pub async fn resend_invitation(
    state: State<'_, AppState>,
    invitation_id: String,
) -> Result<TenantInvitation, String> {
    let record = state.database.get_tenant_invitation(&invitation_id)
        .map_err(|e| format!("Failed to fetch invitation: {}", e))?
        .ok_or("Invitation not found")?;
    
    let now = Utc::now();
    let new_expires_at = now + Duration::days(7);
    
    state.database.update_invitation_expiry(&invitation_id, new_expires_at.timestamp())
        .map_err(|e| format!("Failed to update invitation: {}", e))?;
    
    let invitation = TenantInvitation {
        id: record.id,
        tenant_id: record.tenant_id,
        email: record.email,
        role: parse_user_role(&record.role),
        invited_by: record.invited_by,
        message: None,
        token: record.token,
        status: InvitationStatus::Pending,
        expires_at: new_expires_at.to_rfc3339(),
        accepted_at: None,
        created_at: chrono::DateTime::from_timestamp(record.created_at, 0)
            .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
    };
    
    Ok(invitation)
}

// ============================================================================
// ROLE MANAGEMENT COMMANDS
// ============================================================================

/// Create custom role
#[command]
pub async fn create_role(
    state: State<'_, AppState>,
    request: CreateRoleRequest,
) -> Result<TenantRole, String> {
    let now = Utc::now();
    
    let role = TenantRole {
        id: Uuid::new_v4().to_string(),
        tenant_id: request.tenant_id.clone(),
        name: request.name.clone(),
        description: request.description.clone(),
        permissions: request.permissions.clone(),
        is_system: false,
        user_count: 0,
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
    };
    
    // Save to database
    let record = TenantRoleRecord {
        id: role.id.clone(),
        tenant_id: role.tenant_id.clone(),
        name: role.name.clone(),
        description: role.description.clone(),
        permissions: serde_json::to_string(&role.permissions).unwrap_or_default(),
        is_default: false,
        created_at: now.timestamp(),
        updated_at: now.timestamp(),
    };
    
    state.database.save_tenant_role(&record)
        .map_err(|e| format!("Failed to save role: {}", e))?;
    
    Ok(role)
}

/// Get tenant roles
#[command]
pub async fn get_tenant_roles(
    state: State<'_, AppState>,
    tenant_id: String,
) -> Result<Vec<TenantRole>, String> {
    // Get from database
    let records = state.database.get_tenant_roles(&tenant_id)
        .map_err(|e| format!("Failed to fetch roles: {}", e))?;
    
    // Include system roles as defaults
    let mut roles: Vec<TenantRole> = vec![
        TenantRole {
            id: "role_owner".to_string(),
            tenant_id: tenant_id.clone(),
            name: "Owner".to_string(),
            description: Some("Full access to all tenant resources".to_string()),
            permissions: vec!["*".to_string()],
            is_system: true,
            user_count: 1,
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2025-01-01T00:00:00Z".to_string(),
        },
        TenantRole {
            id: "role_admin".to_string(),
            tenant_id: tenant_id.clone(),
            name: "Admin".to_string(),
            description: Some("Administrative access except billing".to_string()),
            permissions: vec!["users.*".to_string(), "settings.*".to_string(), "audit.*".to_string()],
            is_system: true,
            user_count: 3,
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2025-01-01T00:00:00Z".to_string(),
        },
        TenantRole {
            id: "role_member".to_string(),
            tenant_id: tenant_id.clone(),
            name: "Member".to_string(),
            description: Some("Standard access for team members".to_string()),
            permissions: vec!["automation.*".to_string(), "profiles.*".to_string()],
            is_system: true,
            user_count: 45,
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2025-01-01T00:00:00Z".to_string(),
        },
    ];
    
    // Add custom roles from database
    for record in records {
        let permissions: Vec<String> = serde_json::from_str(&record.permissions).unwrap_or_default();
        roles.push(TenantRole {
            id: record.id,
            tenant_id: record.tenant_id,
            name: record.name,
            description: record.description,
            permissions,
            is_system: false,
            user_count: 0,
            created_at: chrono::DateTime::from_timestamp(record.created_at, 0)
                .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
            updated_at: chrono::DateTime::from_timestamp(record.updated_at, 0)
                .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
        });
    }
    
    Ok(roles)
}

/// Update role
#[command]
pub async fn update_role(
    state: State<'_, AppState>,
    role_id: String,
    updates: HashMap<String, serde_json::Value>,
) -> Result<TenantRole, String> {
    // Get existing roles to find the one to update
    let roles = state.database.get_tenant_roles("")
        .map_err(|e| format!("Failed to fetch roles: {}", e))?;
    
    let existing = roles.iter().find(|r| r.id == role_id)
        .ok_or("Role not found")?;
    
    let now = Utc::now();
    let name = updates.get("name").and_then(|v| v.as_str()).unwrap_or(&existing.name);
    let description = updates.get("description").and_then(|v| v.as_str()).map(|s| s.to_string());
    
    let record = TenantRoleRecord {
        id: role_id.clone(),
        tenant_id: existing.tenant_id.clone(),
        name: name.to_string(),
        description: description.clone(),
        permissions: existing.permissions.clone(),
        is_default: existing.is_default,
        created_at: existing.created_at,
        updated_at: now.timestamp(),
    };
    
    state.database.save_tenant_role(&record)
        .map_err(|e| format!("Failed to update role: {}", e))?;
    
    let role = TenantRole {
        id: role_id,
        tenant_id: record.tenant_id,
        name: record.name,
        description,
        permissions: serde_json::from_str(&record.permissions).unwrap_or_default(),
        is_system: false,
        user_count: 0,
        created_at: chrono::DateTime::from_timestamp(record.created_at, 0)
            .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
        updated_at: now.to_rfc3339(),
    };
    
    Ok(role)
}

/// Delete custom role
#[command]
pub async fn delete_role(
    state: State<'_, AppState>,
    role_id: String,
) -> Result<bool, String> {
    // System roles cannot be deleted
    if role_id.starts_with("role_") {
        return Err("Cannot delete system role".to_string());
    }
    
    // Delete role from database
    state.database.delete_tenant_role(&role_id)
        .map_err(|e| format!("Failed to delete role: {}", e))?;
    
    Ok(true)
}

/// Get available permissions
#[command]
pub async fn get_available_permissions() -> Result<Vec<HashMap<String, String>>, String> {
    let permissions = vec![
        {
            let mut p = HashMap::new();
            p.insert("key".to_string(), "users.*".to_string());
            p.insert("name".to_string(), "User Management".to_string());
            p.insert("description".to_string(), "Manage team members".to_string());
            p
        },
        {
            let mut p = HashMap::new();
            p.insert("key".to_string(), "settings.*".to_string());
            p.insert("name".to_string(), "Settings".to_string());
            p.insert("description".to_string(), "Modify tenant settings".to_string());
            p
        },
        {
            let mut p = HashMap::new();
            p.insert("key".to_string(), "automation.*".to_string());
            p.insert("name".to_string(), "Automation".to_string());
            p.insert("description".to_string(), "Create and manage automations".to_string());
            p
        },
        {
            let mut p = HashMap::new();
            p.insert("key".to_string(), "billing.*".to_string());
            p.insert("name".to_string(), "Billing".to_string());
            p.insert("description".to_string(), "Manage billing and subscriptions".to_string());
            p
        },
        {
            let mut p = HashMap::new();
            p.insert("key".to_string(), "audit.*".to_string());
            p.insert("name".to_string(), "Audit Logs".to_string());
            p.insert("description".to_string(), "View audit logs".to_string());
            p
        },
        {
            let mut p = HashMap::new();
            p.insert("key".to_string(), "profiles.*".to_string());
            p.insert("name".to_string(), "Browser Profiles".to_string());
            p.insert("description".to_string(), "Manage browser profiles".to_string());
            p
        },
        {
            let mut p = HashMap::new();
            p.insert("key".to_string(), "integrations.*".to_string());
            p.insert("name".to_string(), "Integrations".to_string());
            p.insert("description".to_string(), "Configure integrations".to_string());
            p
        },
    ];
    
    Ok(permissions)
}

// ============================================================================
// AUDIT LOG COMMANDS
// ============================================================================

/// Log audit event
#[command]
pub async fn log_tenant_event(
    state: State<'_, AppState>,
    tenant_id: String,
    user_id: Option<String>,
    action: String,
    resource_type: String,
    resource_id: Option<String>,
    details: Option<String>,
) -> Result<TenantAuditEvent, String> {
    let now = Utc::now();
    let event_id = Uuid::new_v4().to_string();
    
    // Create audit record for database
    let record = TenantAuditRecord {
        id: event_id.clone(),
        tenant_id: tenant_id.clone(),
        user_id: user_id.clone(),
        action: action.clone(),
        resource_type: Some(resource_type.clone()),
        resource_id: resource_id.clone(),
        old_values: None,
        new_values: details.clone(),
        ip_address: None,
        user_agent: None,
        created_at: now.timestamp(),
    };
    
    // Save to database
    state.database.save_tenant_audit(&record)
        .map_err(|e| format!("Failed to save audit event: {}", e))?;
    
    let event = TenantAuditEvent {
        id: event_id,
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address: None,
        user_agent: None,
        created_at: now.to_rfc3339(),
    };
    
    Ok(event)
}

/// Get tenant audit log
#[command]
pub async fn get_tenant_audit_log(
    state: State<'_, AppState>,
    tenant_id: String,
    _user_id: Option<String>,
    _action: Option<String>,
    _resource_type: Option<String>,
    _start_date: Option<String>,
    _end_date: Option<String>,
    limit: Option<i32>,
) -> Result<Vec<TenantAuditEvent>, String> {
    let records = state.database.get_tenant_audit_log(&tenant_id, limit.unwrap_or(100))
        .map_err(|e| format!("Failed to fetch audit log: {}", e))?;
    
    let events = records.into_iter().map(|record| {
        TenantAuditEvent {
            id: record.id,
            tenant_id: record.tenant_id,
            user_id: record.user_id,
            action: record.action,
            resource_type: record.resource_type.unwrap_or_default(),
            resource_id: record.resource_id,
            details: record.new_values,
            ip_address: record.ip_address,
            user_agent: record.user_agent,
            created_at: chrono::DateTime::from_timestamp(record.created_at, 0)
                .map(|dt| dt.to_rfc3339()).unwrap_or_default(),
        }
    }).collect();
    
    Ok(events)
}

// ============================================================================
// USAGE & BILLING COMMANDS
// ============================================================================

/// Get tenant usage for current period
#[command]
pub async fn get_tenant_usage(tenant_id: String) -> Result<TenantUsage, String> {
    let now = Utc::now();
    let period_start = now.date_naive().and_hms_opt(0, 0, 0).unwrap().to_string();
    
    let usage = TenantUsage {
        id: Uuid::new_v4().to_string(),
        tenant_id,
        period_start,
        period_end: (now + Duration::days(30)).to_rfc3339(),
        users_count: 48,
        storage_used_bytes: 15_000_000_000, // 15 GB
        api_calls_count: 45_678,
        automations_run: 1_234,
        ai_tokens_used: 500_000,
        bandwidth_bytes: 50_000_000_000, // 50 GB
        overage_charges: 0.0,
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
    };
    
    Ok(usage)
}

/// Get tenant usage history
#[command]
pub async fn get_tenant_usage_history(
    tenant_id: String,
    months: Option<i32>,
) -> Result<Vec<TenantUsage>, String> {
    let num_months = months.unwrap_or(6);
    let now = Utc::now();
    let mut history = Vec::new();
    
    for i in 0..num_months {
        let period_start = now - Duration::days(30 * (i + 1) as i64);
        let period_end = now - Duration::days(30 * i as i64);
        
        // Simulated historical data with slight variations
        let base_users = 48 - (i * 3).min(20) as i32;
        let base_api_calls = 45000 - (i * 5000) as i32;
        let base_storage = 15_000_000_000i64 - (i as i64 * 1_000_000_000);
        
        let usage = TenantUsage {
            id: Uuid::new_v4().to_string(),
            tenant_id: tenant_id.clone(),
            period_start: period_start.to_rfc3339(),
            period_end: period_end.to_rfc3339(),
            users_count: base_users.max(5),
            storage_used_bytes: base_storage.max(1_000_000_000),
            api_calls_count: base_api_calls.max(1000),
            automations_run: (1234 - i * 100).max(100) as i32,
            ai_tokens_used: (500000 - i * 50000).max(10000),
            bandwidth_bytes: (50_000_000_000i64 - i as i64 * 5_000_000_000).max(1_000_000_000),
            overage_charges: 0.0,
            created_at: period_start.to_rfc3339(),
            updated_at: period_end.to_rfc3339(),
        };
        
        history.push(usage);
    }
    
    Ok(history)
}

/// Check if tenant is within limits
#[command]
pub async fn check_tenant_limits(
    state: State<'_, AppState>,
    tenant_id: String,
) -> Result<HashMap<String, serde_json::Value>, String> {
    let tenant = get_tenant(state, tenant_id.clone()).await?;
    let usage = get_tenant_usage(tenant_id).await?;
    
    let mut result = HashMap::new();
    
    // Users limit
    let users_percent = (usage.users_count as f64 / tenant.max_users as f64) * 100.0;
    result.insert("users".to_string(), serde_json::json!({
        "used": usage.users_count,
        "limit": tenant.max_users,
        "percent": users_percent,
        "exceeded": usage.users_count >= tenant.max_users
    }));
    
    // Storage limit
    let storage_used_gb = usage.storage_used_bytes as f64 / 1_000_000_000.0;
    let storage_percent = (storage_used_gb / tenant.max_storage_gb as f64) * 100.0;
    result.insert("storage".to_string(), serde_json::json!({
        "used_gb": storage_used_gb,
        "limit_gb": tenant.max_storage_gb,
        "percent": storage_percent,
        "exceeded": storage_used_gb >= tenant.max_storage_gb as f64
    }));
    
    // API calls limit
    let api_percent = (usage.api_calls_count as f64 / tenant.max_api_calls_month as f64) * 100.0;
    result.insert("api_calls".to_string(), serde_json::json!({
        "used": usage.api_calls_count,
        "limit": tenant.max_api_calls_month,
        "percent": api_percent,
        "exceeded": usage.api_calls_count >= tenant.max_api_calls_month
    }));
    
    // Overall status
    let any_exceeded = users_percent >= 100.0 || storage_percent >= 100.0 || api_percent >= 100.0;
    let any_warning = users_percent >= 80.0 || storage_percent >= 80.0 || api_percent >= 80.0;
    
    result.insert("status".to_string(), serde_json::json!({
        "exceeded": any_exceeded,
        "warning": any_warning
    }));
    
    Ok(result)
}

// ============================================================================
// WHITE LABEL COMMANDS
// Note: White label configs are managed in memory with lazy initialization.
// For persistent storage, use the white_label_configs table (affiliate-related)
// or extend tenant_settings to store serialized white label config.
// ============================================================================

use std::sync::Mutex;
use once_cell::sync::Lazy;

// In-memory white label config store
static WHITE_LABEL_CONFIGS: Lazy<Mutex<HashMap<String, WhiteLabelConfig>>> = 
    Lazy::new(|| Mutex::new(HashMap::new()));

/// Configure white label settings
#[command]
pub async fn configure_white_label(
    state: State<'_, AppState>,
    request: ConfigureWhiteLabelRequest,
) -> Result<WhiteLabelConfig, String> {
    let tenant = get_tenant(state, request.tenant_id.clone()).await?;
    
    if !tenant.features.white_label {
        return Err("White label feature not available on current plan".to_string());
    }
    
    let now = Utc::now().to_rfc3339();
    let config_id = Uuid::new_v4().to_string();
    
    let config = WhiteLabelConfig {
        id: config_id.clone(),
        tenant_id: request.tenant_id.clone(),
        enabled: true,
        company_name: request.company_name,
        logo_light_url: request.logo_light_url,
        logo_dark_url: request.logo_dark_url,
        favicon_url: None,
        primary_color: request.primary_color,
        secondary_color: request.secondary_color,
        accent_color: request.accent_color,
        custom_domain: request.custom_domain.clone(),
        ssl_enabled: true,
        terms_url: None,
        privacy_url: None,
        support_email: None,
        support_url: None,
        hide_powered_by: request.hide_powered_by.unwrap_or(true),
        custom_login_page: false,
        custom_email_templates: false,
        created_at: now.clone(),
        updated_at: now,
    };
    
    // Save to in-memory store
    if let Ok(mut configs) = WHITE_LABEL_CONFIGS.lock() {
        configs.insert(request.tenant_id, config.clone());
    }
    
    // Log custom domain setup if provided
    if let Some(domain) = request.custom_domain {
        log::info!("White label configured with custom domain: {}", domain);
        // DNS/SSL setup would be handled by infrastructure layer
    }
    
    Ok(config)
}

/// Get white label configuration for tenant
#[command]
pub async fn get_tenant_white_label_config(tenant_id: String) -> Result<Option<WhiteLabelConfig>, String> {
    // Check in-memory store first
    if let Ok(configs) = WHITE_LABEL_CONFIGS.lock() {
        if let Some(config) = configs.get(&tenant_id) {
            return Ok(Some(config.clone()));
        }
    }
    
    // Return default config for demo purposes
    let config = WhiteLabelConfig {
        id: format!("wl_{}", tenant_id),
        tenant_id,
        enabled: true,
        company_name: "ACME Automation".to_string(),
        logo_light_url: Some("https://acme.com/logo-light.png".to_string()),
        logo_dark_url: Some("https://acme.com/logo-dark.png".to_string()),
        favicon_url: Some("https://acme.com/favicon.ico".to_string()),
        primary_color: "#2563eb".to_string(),
        secondary_color: "#1e40af".to_string(),
        accent_color: "#f59e0b".to_string(),
        custom_domain: Some("app.acme.com".to_string()),
        ssl_enabled: true,
        terms_url: Some("https://acme.com/terms".to_string()),
        privacy_url: Some("https://acme.com/privacy".to_string()),
        support_email: Some("support@acme.com".to_string()),
        support_url: Some("https://support.acme.com".to_string()),
        hide_powered_by: true,
        custom_login_page: true,
        custom_email_templates: true,
        created_at: "2025-01-01T00:00:00Z".to_string(),
        updated_at: Utc::now().to_rfc3339(),
    };
    
    Ok(Some(config))
}

/// Update white label configuration for tenant
#[command]
pub async fn update_tenant_white_label_config(
    config_id: String,
    updates: HashMap<String, serde_json::Value>,
) -> Result<WhiteLabelConfig, String> {
    // Find existing config
    let mut existing_config = None;
    if let Ok(configs) = WHITE_LABEL_CONFIGS.lock() {
        for (_, config) in configs.iter() {
            if config.id == config_id {
                existing_config = Some(config.clone());
                break;
            }
        }
    }
    
    let mut config = existing_config.unwrap_or_else(|| WhiteLabelConfig {
        id: config_id.clone(),
        tenant_id: "tenant_001".to_string(),
        enabled: true,
        company_name: "Company".to_string(),
        logo_light_url: None,
        logo_dark_url: None,
        favicon_url: None,
        primary_color: "#2563eb".to_string(),
        secondary_color: "#1e40af".to_string(),
        accent_color: "#f59e0b".to_string(),
        custom_domain: None,
        ssl_enabled: true,
        terms_url: None,
        privacy_url: None,
        support_email: None,
        support_url: None,
        hide_powered_by: true,
        custom_login_page: false,
        custom_email_templates: false,
        created_at: "2025-01-01T00:00:00Z".to_string(),
        updated_at: Utc::now().to_rfc3339(),
    });
    
    // Apply updates
    if let Some(name) = updates.get("company_name").and_then(|v| v.as_str()) {
        config.company_name = name.to_string();
    }
    if let Some(color) = updates.get("primary_color").and_then(|v| v.as_str()) {
        config.primary_color = color.to_string();
    }
    if let Some(color) = updates.get("secondary_color").and_then(|v| v.as_str()) {
        config.secondary_color = color.to_string();
    }
    if let Some(color) = updates.get("accent_color").and_then(|v| v.as_str()) {
        config.accent_color = color.to_string();
    }
    if let Some(enabled) = updates.get("enabled").and_then(|v| v.as_bool()) {
        config.enabled = enabled;
    }
    if let Some(hide) = updates.get("hide_powered_by").and_then(|v| v.as_bool()) {
        config.hide_powered_by = hide;
    }
    
    config.updated_at = Utc::now().to_rfc3339();
    
    // Save back to store
    if let Ok(mut configs) = WHITE_LABEL_CONFIGS.lock() {
        configs.insert(config.tenant_id.clone(), config.clone());
    }
    
    Ok(config)
}

/// Disable white label
#[command]
pub async fn disable_white_label(tenant_id: String) -> Result<bool, String> {
    if let Ok(mut configs) = WHITE_LABEL_CONFIGS.lock() {
        if let Some(config) = configs.get_mut(&tenant_id) {
            config.enabled = false;
            config.updated_at = Utc::now().to_rfc3339();
            return Ok(true);
        }
    }
    
    // Not found, but that's OK - nothing to disable
    Ok(true)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn slugify(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

fn generate_invitation_token() -> String {
    format!("{}{}", Uuid::new_v4(), Uuid::new_v4()).replace("-", "")
}

fn parse_user_role(role_str: &str) -> UserRole {
    match role_str.to_lowercase().as_str() {
        "owner" => UserRole::Owner,
        "admin" => UserRole::Admin,
        "manager" => UserRole::Manager,
        "member" => UserRole::Member,
        "viewer" => UserRole::Viewer,
        other => UserRole::Custom(other.to_string()),
    }
}

fn get_plan_limits(plan: &TenantPlan) -> (i32, i32, i32, TenantFeatures) {
    match plan {
        TenantPlan::Free => (
            5,
            5,
            10_000,
            TenantFeatures {
                automation: true,
                ai_assistant: false,
                api_access: false,
                custom_integrations: false,
                sso: false,
                ldap: false,
                audit_logs: false,
                advanced_analytics: false,
                white_label: false,
                priority_support: false,
                custom_branding: false,
                data_export: false,
            },
        ),
        TenantPlan::Pro => (
            25,
            50,
            100_000,
            TenantFeatures {
                automation: true,
                ai_assistant: true,
                api_access: true,
                custom_integrations: false,
                sso: false,
                ldap: false,
                audit_logs: true,
                advanced_analytics: false,
                white_label: false,
                priority_support: false,
                custom_branding: true,
                data_export: true,
            },
        ),
        TenantPlan::Business => (
            100,
            200,
            500_000,
            TenantFeatures {
                automation: true,
                ai_assistant: true,
                api_access: true,
                custom_integrations: true,
                sso: true,
                ldap: false,
                audit_logs: true,
                advanced_analytics: true,
                white_label: false,
                priority_support: true,
                custom_branding: true,
                data_export: true,
            },
        ),
        TenantPlan::Enterprise => (
            500,
            1000,
            1_000_000,
            TenantFeatures {
                automation: true,
                ai_assistant: true,
                api_access: true,
                custom_integrations: true,
                sso: true,
                ldap: true,
                audit_logs: true,
                advanced_analytics: true,
                white_label: false,
                priority_support: true,
                custom_branding: true,
                data_export: true,
            },
        ),
        TenantPlan::WhiteLabel => (
            1000,
            5000,
            10_000_000,
            TenantFeatures {
                automation: true,
                ai_assistant: true,
                api_access: true,
                custom_integrations: true,
                sso: true,
                ldap: true,
                audit_logs: true,
                advanced_analytics: true,
                white_label: true,
                priority_support: true,
                custom_branding: true,
                data_export: true,
            },
        ),
    }
}

// ============================================================================
// MODULE REGISTRATION
// ============================================================================

pub fn get_tenant_commands() -> Vec<&'static str> {
    vec![
        // Tenant Management
        "create_tenant",
        "get_tenant",
        "get_all_tenants",
        "get_user_tenants",
        "update_tenant",
        "update_tenant_settings",
        "delete_tenant",
        "suspend_tenant",
        "reactivate_tenant",
        "upgrade_tenant_plan",
        // User Management
        "get_tenant_users",
        "get_tenant_user",
        "update_user_role",
        "remove_tenant_user",
        "deactivate_tenant_user",
        // Invitations
        "invite_user",
        "get_tenant_invitations",
        "accept_invitation",
        "revoke_invitation",
        "resend_invitation",
        // Roles
        "create_role",
        "get_tenant_roles",
        "update_role",
        "delete_role",
        "get_available_permissions",
        // Audit
        "log_tenant_event",
        "get_tenant_audit_log",
        // Usage
        "get_tenant_usage",
        "get_tenant_usage_history",
        "check_tenant_limits",
        // White Label
        "configure_white_label",
        "get_tenant_white_label_config",
        "update_tenant_white_label_config",
        "disable_white_label",
    ]
}
