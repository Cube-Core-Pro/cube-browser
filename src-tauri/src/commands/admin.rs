// CUBE Nexum Elite - Admin Commands
// Provides real backend functionality for the Admin Panel
// Features: User management, license management, sales tracking, downloads, analytics

use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration};
use uuid::Uuid;

// ============================================================
// TYPES - Admin Data Structures
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdminUser {
    pub id: String,
    pub email: String,
    pub name: String,
    pub plan: UserPlan,
    pub status: UserStatus,
    pub created_at: DateTime<Utc>,
    pub last_login: Option<DateTime<Utc>>,
    pub api_calls: u64,
    pub features: Vec<String>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum UserPlan {
    Free,
    Pro,
    Elite,
    Enterprise,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum UserStatus {
    Active,
    Suspended,
    Pending,
    Deactivated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdminLicense {
    pub id: String,
    pub key: String,
    pub user_id: String,
    pub user_name: String,
    pub user_email: String,
    pub plan: UserPlan,
    pub status: LicenseStatus,
    pub activated_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub devices_used: u32,
    pub max_devices: u32,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LicenseStatus {
    Active,
    Expired,
    Revoked,
    Suspended,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaleRecord {
    pub id: String,
    pub customer_id: String,
    pub customer_name: String,
    pub customer_email: String,
    pub plan: UserPlan,
    pub amount: u64,  // in cents
    pub currency: String,
    pub status: SaleStatus,
    pub date: DateTime<Utc>,
    pub payment_method: String,
    pub invoice_id: String,
    pub stripe_payment_id: Option<String>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SaleStatus {
    Completed,
    Pending,
    Refunded,
    Failed,
    Disputed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadRecord {
    pub id: String,
    pub user_id: String,
    pub user_name: String,
    pub platform: Platform,
    pub version: String,
    pub date: DateTime<Utc>,
    pub ip_address: String,
    pub country: String,
    pub user_agent: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Platform {
    Windows,
    MacOS,
    Linux,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct APIKey {
    pub id: String,
    pub name: String,
    pub key_hash: String,
    pub key_preview: String,  // First 8 chars + "..."
    pub user_id: String,
    pub permissions: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub last_used: Option<DateTime<Utc>>,
    pub requests: u64,
    pub status: APIKeyStatus,
    pub rate_limit: u32,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum APIKeyStatus {
    Active,
    Revoked,
    Expired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceStatus {
    pub name: String,
    pub status: HealthStatus,
    pub latency_ms: u32,
    pub uptime_percent: f64,
    pub last_check: DateTime<Utc>,
    pub error_count: u32,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum HealthStatus {
    Healthy,
    Degraded,
    Down,
    Maintenance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessMetrics {
    pub total_revenue: u64,
    pub monthly_revenue: u64,
    pub total_sales: u64,
    pub monthly_sales: u64,
    pub total_downloads: u64,
    pub monthly_downloads: u64,
    pub active_licenses: u64,
    pub churn_rate: f64,
    pub avg_revenue_per_user: f64,
    pub conversion_rate: f64,
    pub mrr: u64,  // Monthly Recurring Revenue
    pub arr: u64,  // Annual Recurring Revenue
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerStats {
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub disk_usage: f64,
    pub network_in: u64,
    pub network_out: u64,
    pub uptime_percent: f64,
    pub total_requests: u64,
    pub error_count: u64,
    pub avg_latency_ms: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub action: String,
    pub actor_id: String,
    pub actor_email: String,
    pub resource_type: String,
    pub resource_id: String,
    pub details: HashMap<String, String>,
    pub ip_address: String,
    pub user_agent: String,
}

// ============================================================
// STATE - Admin State Management
// ============================================================

pub struct AdminState {
    pub users: Mutex<HashMap<String, AdminUser>>,
    pub licenses: Mutex<HashMap<String, AdminLicense>>,
    pub sales: Mutex<HashMap<String, SaleRecord>>,
    pub downloads: Mutex<HashMap<String, DownloadRecord>>,
    pub api_keys: Mutex<HashMap<String, APIKey>>,
    pub services: Mutex<HashMap<String, ServiceStatus>>,
    pub audit_logs: Mutex<Vec<AuditLog>>,
    pub metrics: Mutex<BusinessMetrics>,
    pub server_stats: Mutex<ServerStats>,
}

impl Default for AdminState {
    fn default() -> Self {
        let mut services = HashMap::new();
        
        // Initialize default services
        let default_services = vec![
            ("ai-search", "AI Search API"),
            ("intelligence", "Intelligence Engine"),
            ("auth", "Authentication"),
            ("db-primary", "Database Primary"),
            ("db-replica", "Database Replica"),
            ("cache", "Cache Layer"),
            ("cdn", "CDN"),
            ("websocket", "WebSocket Server"),
        ];
        
        for (id, name) in default_services {
            services.insert(id.to_string(), ServiceStatus {
                name: name.to_string(),
                status: HealthStatus::Healthy,
                latency_ms: 25,
                uptime_percent: 99.99,
                last_check: Utc::now(),
                error_count: 0,
                metadata: HashMap::new(),
            });
        }
        
        Self {
            users: Mutex::new(HashMap::new()),
            licenses: Mutex::new(HashMap::new()),
            sales: Mutex::new(HashMap::new()),
            downloads: Mutex::new(HashMap::new()),
            api_keys: Mutex::new(HashMap::new()),
            services: Mutex::new(services),
            audit_logs: Mutex::new(Vec::new()),
            metrics: Mutex::new(BusinessMetrics {
                total_revenue: 0,
                monthly_revenue: 0,
                total_sales: 0,
                monthly_sales: 0,
                total_downloads: 0,
                monthly_downloads: 0,
                active_licenses: 0,
                churn_rate: 0.0,
                avg_revenue_per_user: 0.0,
                conversion_rate: 0.0,
                mrr: 0,
                arr: 0,
            }),
            server_stats: Mutex::new(ServerStats {
                cpu_usage: 0.0,
                memory_usage: 0.0,
                disk_usage: 0.0,
                network_in: 0,
                network_out: 0,
                uptime_percent: 100.0,
                total_requests: 0,
                error_count: 0,
                avg_latency_ms: 0,
            }),
        }
    }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

fn generate_license_key(plan: &UserPlan) -> String {
    let prefix = match plan {
        UserPlan::Free => "CUBE-FREE",
        UserPlan::Pro => "CUBE-PRO",
        UserPlan::Elite => "CUBE-ELITE",
        UserPlan::Enterprise => "CUBE-ENT",
    };
    
    let random_part: String = (0..4)
        .map(|_| {
            let chars: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let idx = rand::random::<usize>() % chars.len();
            chars[idx] as char
        })
        .collect::<String>();
    
    let random_part2: String = (0..4)
        .map(|_| {
            let chars: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let idx = rand::random::<usize>() % chars.len();
            chars[idx] as char
        })
        .collect::<String>();
    
    let random_part3: String = (0..4)
        .map(|_| {
            let chars: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let idx = rand::random::<usize>() % chars.len();
            chars[idx] as char
        })
        .collect::<String>();
    
    format!("{}-{}-{}-{}", prefix, random_part, random_part2, random_part3)
}

fn generate_api_key() -> String {
    let prefix = "cube_live_sk_";
    let random_part: String = (0..32)
        .map(|_| {
            let chars: &[u8] = b"abcdefghijklmnopqrstuvwxyz0123456789";
            let idx = rand::random::<usize>() % chars.len();
            chars[idx] as char
        })
        .collect();
    
    format!("{}{}", prefix, random_part)
}

fn hash_api_key(key: &str) -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(key.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn log_audit(
    state: &AdminState,
    action: &str,
    actor_id: &str,
    actor_email: &str,
    resource_type: &str,
    resource_id: &str,
    details: HashMap<String, String>,
) {
    let audit = AuditLog {
        id: Uuid::new_v4().to_string(),
        timestamp: Utc::now(),
        action: action.to_string(),
        actor_id: actor_id.to_string(),
        actor_email: actor_email.to_string(),
        resource_type: resource_type.to_string(),
        resource_id: resource_id.to_string(),
        details,
        ip_address: "127.0.0.1".to_string(),
        user_agent: "CUBE Admin Panel".to_string(),
    };
    
    if let Ok(mut logs) = state.audit_logs.lock() {
        logs.push(audit);
        // Keep only last 10000 logs
        if logs.len() > 10000 {
            logs.drain(0..1000);
        }
    }
}

fn recalculate_metrics(state: &AdminState) {
    let users = state.users.lock().unwrap();
    let licenses = state.licenses.lock().unwrap();
    let sales = state.sales.lock().unwrap();
    let downloads = state.downloads.lock().unwrap();
    
    let now = Utc::now();
    let month_ago = now - Duration::days(30);
    
    let total_revenue: u64 = sales.values()
        .filter(|s| s.status == SaleStatus::Completed)
        .map(|s| s.amount)
        .sum();
    
    let monthly_revenue: u64 = sales.values()
        .filter(|s| s.status == SaleStatus::Completed && s.date > month_ago)
        .map(|s| s.amount)
        .sum();
    
    let total_sales = sales.values()
        .filter(|s| s.status == SaleStatus::Completed)
        .count() as u64;
    
    let monthly_sales = sales.values()
        .filter(|s| s.status == SaleStatus::Completed && s.date > month_ago)
        .count() as u64;
    
    let total_downloads = downloads.len() as u64;
    let monthly_downloads = downloads.values()
        .filter(|d| d.date > month_ago)
        .count() as u64;
    
    let active_licenses = licenses.values()
        .filter(|l| l.status == LicenseStatus::Active)
        .count() as u64;
    
    let active_users = users.values()
        .filter(|u| u.status == UserStatus::Active)
        .count() as u64;
    
    let avg_revenue_per_user = if active_users > 0 {
        (total_revenue as f64 / 100.0) / active_users as f64
    } else {
        0.0
    };
    
    let conversion_rate = if total_downloads > 0 {
        (active_licenses as f64 / total_downloads as f64) * 100.0
    } else {
        0.0
    };
    
    drop(users);
    drop(licenses);
    drop(sales);
    drop(downloads);
    
    if let Ok(mut metrics) = state.metrics.lock() {
        metrics.total_revenue = total_revenue;
        metrics.monthly_revenue = monthly_revenue;
        metrics.total_sales = total_sales;
        metrics.monthly_sales = monthly_sales;
        metrics.total_downloads = total_downloads;
        metrics.monthly_downloads = monthly_downloads;
        metrics.active_licenses = active_licenses;
        metrics.avg_revenue_per_user = avg_revenue_per_user;
        metrics.conversion_rate = conversion_rate;
        metrics.mrr = monthly_revenue;
        metrics.arr = monthly_revenue * 12;
    }
}

// ============================================================
// USER MANAGEMENT COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub name: String,
    pub plan: UserPlan,
    pub features: Vec<String>,
}

#[tauri::command]
pub async fn admin_create_user(
    state: State<'_, AdminState>,
    request: CreateUserRequest,
) -> Result<AdminUser, String> {
    let user = AdminUser {
        id: Uuid::new_v4().to_string(),
        email: request.email.clone(),
        name: request.name.clone(),
        plan: request.plan,
        status: UserStatus::Active,
        created_at: Utc::now(),
        last_login: None,
        api_calls: 0,
        features: request.features,
        metadata: HashMap::new(),
    };
    
    let mut users = state.users.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    // Check for duplicate email
    if users.values().any(|u| u.email == request.email) {
        return Err("User with this email already exists".to_string());
    }
    
    users.insert(user.id.clone(), user.clone());
    
    log_audit(
        &state,
        "user.created",
        "admin",
        "admin@cube-elite.com",
        "user",
        &user.id,
        [("email".to_string(), request.email)].into_iter().collect(),
    );
    
    recalculate_metrics(&state);
    
    Ok(user)
}

#[tauri::command]
pub async fn admin_get_users(
    state: State<'_, AdminState>,
    plan_filter: Option<String>,
    status_filter: Option<String>,
    search_query: Option<String>,
) -> Result<Vec<AdminUser>, String> {
    let users = state.users.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut result: Vec<AdminUser> = users.values()
        .filter(|u| {
            let plan_match = plan_filter.as_ref().map_or(true, |p| {
                p == "all" || format!("{:?}", u.plan).to_lowercase() == p.to_lowercase()
            });
            
            let status_match = status_filter.as_ref().map_or(true, |s| {
                s == "all" || format!("{:?}", u.status).to_lowercase() == s.to_lowercase()
            });
            
            let search_match = search_query.as_ref().map_or(true, |q| {
                let q = q.to_lowercase();
                u.email.to_lowercase().contains(&q) ||
                u.name.to_lowercase().contains(&q) ||
                u.id.to_lowercase().contains(&q)
            });
            
            plan_match && status_match && search_match
        })
        .cloned()
        .collect();
    
    result.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    Ok(result)
}

#[tauri::command]
pub async fn admin_get_user(
    state: State<'_, AdminState>,
    user_id: String,
) -> Result<AdminUser, String> {
    let users = state.users.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    users.get(&user_id)
        .cloned()
        .ok_or_else(|| "User not found".to_string())
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub name: Option<String>,
    pub plan: Option<UserPlan>,
    pub status: Option<UserStatus>,
    pub features: Option<Vec<String>>,
}

#[tauri::command]
pub async fn admin_update_user(
    state: State<'_, AdminState>,
    user_id: String,
    request: UpdateUserRequest,
) -> Result<AdminUser, String> {
    let mut users = state.users.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let user = users.get_mut(&user_id)
        .ok_or_else(|| "User not found".to_string())?;
    
    if let Some(name) = request.name {
        user.name = name;
    }
    if let Some(plan) = request.plan {
        user.plan = plan;
    }
    if let Some(status) = request.status {
        user.status = status;
    }
    if let Some(features) = request.features {
        user.features = features;
    }
    
    let updated_user = user.clone();
    
    log_audit(
        &state,
        "user.updated",
        "admin",
        "admin@cube-elite.com",
        "user",
        &user_id,
        HashMap::new(),
    );
    
    recalculate_metrics(&state);
    
    Ok(updated_user)
}

#[tauri::command]
pub async fn admin_delete_user(
    state: State<'_, AdminState>,
    user_id: String,
) -> Result<bool, String> {
    let mut users = state.users.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if users.remove(&user_id).is_some() {
        log_audit(
            &state,
            "user.deleted",
            "admin",
            "admin@cube-elite.com",
            "user",
            &user_id,
            HashMap::new(),
        );
        
        recalculate_metrics(&state);
        Ok(true)
    } else {
        Err("User not found".to_string())
    }
}

#[tauri::command]
pub async fn admin_suspend_user(
    state: State<'_, AdminState>,
    user_id: String,
    reason: Option<String>,
) -> Result<AdminUser, String> {
    let mut users = state.users.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let user = users.get_mut(&user_id)
        .ok_or_else(|| "User not found".to_string())?;
    
    user.status = UserStatus::Suspended;
    if let Some(r) = &reason {
        user.metadata.insert("suspension_reason".to_string(), r.clone());
    }
    user.metadata.insert("suspended_at".to_string(), Utc::now().to_rfc3339());
    
    let updated_user = user.clone();
    
    log_audit(
        &state,
        "user.suspended",
        "admin",
        "admin@cube-elite.com",
        "user",
        &user_id,
        [("reason".to_string(), reason.unwrap_or_default())].into_iter().collect(),
    );
    
    recalculate_metrics(&state);
    
    Ok(updated_user)
}

#[tauri::command]
pub async fn admin_reactivate_user(
    state: State<'_, AdminState>,
    user_id: String,
) -> Result<AdminUser, String> {
    let mut users = state.users.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let user = users.get_mut(&user_id)
        .ok_or_else(|| "User not found".to_string())?;
    
    user.status = UserStatus::Active;
    user.metadata.remove("suspension_reason");
    user.metadata.remove("suspended_at");
    
    let updated_user = user.clone();
    
    log_audit(
        &state,
        "user.reactivated",
        "admin",
        "admin@cube-elite.com",
        "user",
        &user_id,
        HashMap::new(),
    );
    
    recalculate_metrics(&state);
    
    Ok(updated_user)
}

// ============================================================
// LICENSE MANAGEMENT COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateLicenseRequest {
    pub user_id: String,
    pub plan: UserPlan,
    pub duration_days: u32,
    pub max_devices: u32,
}

#[tauri::command]
pub async fn admin_create_license(
    state: State<'_, AdminState>,
    request: CreateLicenseRequest,
) -> Result<AdminLicense, String> {
    let users = state.users.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let user = users.get(&request.user_id)
        .ok_or_else(|| "User not found".to_string())?;
    
    let license = AdminLicense {
        id: Uuid::new_v4().to_string(),
        key: generate_license_key(&request.plan),
        user_id: user.id.clone(),
        user_name: user.name.clone(),
        user_email: user.email.clone(),
        plan: request.plan,
        status: LicenseStatus::Active,
        activated_at: Utc::now(),
        expires_at: Utc::now() + Duration::days(request.duration_days as i64),
        devices_used: 0,
        max_devices: request.max_devices,
        metadata: HashMap::new(),
    };
    
    drop(users);
    
    let mut licenses = state.licenses.lock().map_err(|e| format!("Lock error: {}", e))?;
    licenses.insert(license.id.clone(), license.clone());
    
    log_audit(
        &state,
        "license.created",
        "admin",
        "admin@cube-elite.com",
        "license",
        &license.id,
        [
            ("user_id".to_string(), request.user_id),
            ("key".to_string(), license.key.clone()),
        ].into_iter().collect(),
    );
    
    recalculate_metrics(&state);
    
    Ok(license)
}

#[tauri::command]
pub async fn admin_get_licenses(
    state: State<'_, AdminState>,
    status_filter: Option<String>,
    plan_filter: Option<String>,
    search_query: Option<String>,
) -> Result<Vec<AdminLicense>, String> {
    let licenses = state.licenses.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut result: Vec<AdminLicense> = licenses.values()
        .filter(|l| {
            let status_match = status_filter.as_ref().map_or(true, |s| {
                s == "all" || format!("{:?}", l.status).to_lowercase() == s.to_lowercase()
            });
            
            let plan_match = plan_filter.as_ref().map_or(true, |p| {
                p == "all" || format!("{:?}", l.plan).to_lowercase() == p.to_lowercase()
            });
            
            let search_match = search_query.as_ref().map_or(true, |q| {
                let q = q.to_lowercase();
                l.user_email.to_lowercase().contains(&q) ||
                l.user_name.to_lowercase().contains(&q) ||
                l.key.to_lowercase().contains(&q)
            });
            
            status_match && plan_match && search_match
        })
        .cloned()
        .collect();
    
    result.sort_by(|a, b| b.activated_at.cmp(&a.activated_at));
    
    Ok(result)
}

#[tauri::command]
pub async fn admin_revoke_license(
    state: State<'_, AdminState>,
    license_id: String,
    reason: Option<String>,
) -> Result<AdminLicense, String> {
    let mut licenses = state.licenses.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let license = licenses.get_mut(&license_id)
        .ok_or_else(|| "License not found".to_string())?;
    
    license.status = LicenseStatus::Revoked;
    if let Some(r) = &reason {
        license.metadata.insert("revocation_reason".to_string(), r.clone());
    }
    license.metadata.insert("revoked_at".to_string(), Utc::now().to_rfc3339());
    
    let updated_license = license.clone();
    
    log_audit(
        &state,
        "license.revoked",
        "admin",
        "admin@cube-elite.com",
        "license",
        &license_id,
        [("reason".to_string(), reason.unwrap_or_default())].into_iter().collect(),
    );
    
    recalculate_metrics(&state);
    
    Ok(updated_license)
}

#[tauri::command]
pub async fn admin_extend_license(
    state: State<'_, AdminState>,
    license_id: String,
    additional_days: u32,
) -> Result<AdminLicense, String> {
    let mut licenses = state.licenses.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let license = licenses.get_mut(&license_id)
        .ok_or_else(|| "License not found".to_string())?;
    
    license.expires_at = license.expires_at + Duration::days(additional_days as i64);
    
    // If expired, reactivate
    if license.status == LicenseStatus::Expired {
        license.status = LicenseStatus::Active;
    }
    
    let updated_license = license.clone();
    
    log_audit(
        &state,
        "license.extended",
        "admin",
        "admin@cube-elite.com",
        "license",
        &license_id,
        [("additional_days".to_string(), additional_days.to_string())].into_iter().collect(),
    );
    
    Ok(updated_license)
}

// ============================================================
// SALES MANAGEMENT COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct RecordSaleRequest {
    pub customer_id: String,
    pub customer_name: String,
    pub customer_email: String,
    pub plan: UserPlan,
    pub amount: u64,
    pub currency: String,
    pub payment_method: String,
    pub stripe_payment_id: Option<String>,
}

#[tauri::command]
pub async fn admin_record_sale(
    state: State<'_, AdminState>,
    request: RecordSaleRequest,
) -> Result<SaleRecord, String> {
    let sale = SaleRecord {
        id: Uuid::new_v4().to_string(),
        customer_id: request.customer_id,
        customer_name: request.customer_name,
        customer_email: request.customer_email,
        plan: request.plan,
        amount: request.amount,
        currency: request.currency,
        status: SaleStatus::Completed,
        date: Utc::now(),
        payment_method: request.payment_method,
        invoice_id: format!("INV-{}", Utc::now().format("%Y-%m%d%H%M")),
        stripe_payment_id: request.stripe_payment_id,
        metadata: HashMap::new(),
    };
    
    let mut sales = state.sales.lock().map_err(|e| format!("Lock error: {}", e))?;
    sales.insert(sale.id.clone(), sale.clone());
    
    log_audit(
        &state,
        "sale.recorded",
        "admin",
        "admin@cube-elite.com",
        "sale",
        &sale.id,
        [
            ("amount".to_string(), sale.amount.to_string()),
            ("customer".to_string(), sale.customer_email.clone()),
        ].into_iter().collect(),
    );
    
    recalculate_metrics(&state);
    
    Ok(sale)
}

#[tauri::command]
pub async fn admin_get_sales(
    state: State<'_, AdminState>,
    status_filter: Option<String>,
    plan_filter: Option<String>,
    date_from: Option<String>,
    date_to: Option<String>,
) -> Result<Vec<SaleRecord>, String> {
    let sales = state.sales.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let date_from = date_from.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|d| d.with_timezone(&Utc)));
    let date_to = date_to.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|d| d.with_timezone(&Utc)));
    
    let mut result: Vec<SaleRecord> = sales.values()
        .filter(|s| {
            let status_match = status_filter.as_ref().map_or(true, |st| {
                st == "all" || format!("{:?}", s.status).to_lowercase() == st.to_lowercase()
            });
            
            let plan_match = plan_filter.as_ref().map_or(true, |p| {
                p == "all" || format!("{:?}", s.plan).to_lowercase() == p.to_lowercase()
            });
            
            let date_match = date_from.map_or(true, |from| s.date >= from) &&
                            date_to.map_or(true, |to| s.date <= to);
            
            status_match && plan_match && date_match
        })
        .cloned()
        .collect();
    
    result.sort_by(|a, b| b.date.cmp(&a.date));
    
    Ok(result)
}

#[tauri::command]
pub async fn admin_refund_sale(
    state: State<'_, AdminState>,
    sale_id: String,
    reason: Option<String>,
) -> Result<SaleRecord, String> {
    let mut sales = state.sales.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let sale = sales.get_mut(&sale_id)
        .ok_or_else(|| "Sale not found".to_string())?;
    
    sale.status = SaleStatus::Refunded;
    if let Some(r) = &reason {
        sale.metadata.insert("refund_reason".to_string(), r.clone());
    }
    sale.metadata.insert("refunded_at".to_string(), Utc::now().to_rfc3339());
    
    let updated_sale = sale.clone();
    
    log_audit(
        &state,
        "sale.refunded",
        "admin",
        "admin@cube-elite.com",
        "sale",
        &sale_id,
        [("reason".to_string(), reason.unwrap_or_default())].into_iter().collect(),
    );
    
    recalculate_metrics(&state);
    
    Ok(updated_sale)
}

// ============================================================
// DOWNLOADS TRACKING COMMANDS
// ============================================================

#[tauri::command]
pub async fn admin_get_downloads(
    state: State<'_, AdminState>,
    platform_filter: Option<String>,
    date_from: Option<String>,
    date_to: Option<String>,
) -> Result<Vec<DownloadRecord>, String> {
    let downloads = state.downloads.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let date_from = date_from.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|d| d.with_timezone(&Utc)));
    let date_to = date_to.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|d| d.with_timezone(&Utc)));
    
    let mut result: Vec<DownloadRecord> = downloads.values()
        .filter(|d| {
            let platform_match = platform_filter.as_ref().map_or(true, |p| {
                p == "all" || format!("{:?}", d.platform).to_lowercase() == p.to_lowercase()
            });
            
            let date_match = date_from.map_or(true, |from| d.date >= from) &&
                            date_to.map_or(true, |to| d.date <= to);
            
            platform_match && date_match
        })
        .cloned()
        .collect();
    
    result.sort_by(|a, b| b.date.cmp(&a.date));
    
    Ok(result)
}

#[derive(Debug, Deserialize)]
pub struct RecordDownloadRequest {
    pub user_id: String,
    pub user_name: String,
    pub platform: Platform,
    pub version: String,
    pub ip_address: String,
    pub country: String,
    pub user_agent: String,
}

#[tauri::command]
pub async fn admin_record_download(
    state: State<'_, AdminState>,
    request: RecordDownloadRequest,
) -> Result<DownloadRecord, String> {
    let download = DownloadRecord {
        id: Uuid::new_v4().to_string(),
        user_id: request.user_id,
        user_name: request.user_name,
        platform: request.platform,
        version: request.version,
        date: Utc::now(),
        ip_address: request.ip_address,
        country: request.country,
        user_agent: request.user_agent,
    };
    
    let mut downloads = state.downloads.lock().map_err(|e| format!("Lock error: {}", e))?;
    downloads.insert(download.id.clone(), download.clone());
    
    recalculate_metrics(&state);
    
    Ok(download)
}

// ============================================================
// API KEY MANAGEMENT COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateAPIKeyRequest {
    pub user_id: String,
    pub name: String,
    pub permissions: Vec<String>,
    pub rate_limit: u32,
    pub expires_in_days: Option<u32>,
}

#[tauri::command]
pub async fn admin_create_api_key(
    state: State<'_, AdminState>,
    request: CreateAPIKeyRequest,
) -> Result<(APIKey, String), String> {
    let users = state.users.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if !users.contains_key(&request.user_id) {
        return Err("User not found".to_string());
    }
    
    drop(users);
    
    let raw_key = generate_api_key();
    let key_hash = hash_api_key(&raw_key);
    let key_preview = format!("{}...{}", &raw_key[..12], &raw_key[raw_key.len()-4..]);
    
    let api_key = APIKey {
        id: Uuid::new_v4().to_string(),
        name: request.name,
        key_hash,
        key_preview,
        user_id: request.user_id.clone(),
        permissions: request.permissions,
        created_at: Utc::now(),
        last_used: None,
        requests: 0,
        status: APIKeyStatus::Active,
        rate_limit: request.rate_limit,
        expires_at: request.expires_in_days.map(|d| Utc::now() + Duration::days(d as i64)),
    };
    
    let mut keys = state.api_keys.lock().map_err(|e| format!("Lock error: {}", e))?;
    keys.insert(api_key.id.clone(), api_key.clone());
    
    log_audit(
        &state,
        "api_key.created",
        "admin",
        "admin@cube-elite.com",
        "api_key",
        &api_key.id,
        [("user_id".to_string(), request.user_id)].into_iter().collect(),
    );
    
    // Return the full key only on creation
    Ok((api_key, raw_key))
}

#[tauri::command]
pub async fn admin_get_api_keys(
    state: State<'_, AdminState>,
    user_id: Option<String>,
) -> Result<Vec<APIKey>, String> {
    let keys = state.api_keys.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut result: Vec<APIKey> = keys.values()
        .filter(|k| user_id.as_ref().map_or(true, |uid| &k.user_id == uid))
        .cloned()
        .collect();
    
    result.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    Ok(result)
}

#[tauri::command]
pub async fn admin_revoke_api_key(
    state: State<'_, AdminState>,
    key_id: String,
) -> Result<APIKey, String> {
    let mut keys = state.api_keys.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let key = keys.get_mut(&key_id)
        .ok_or_else(|| "API key not found".to_string())?;
    
    key.status = APIKeyStatus::Revoked;
    
    let updated_key = key.clone();
    
    log_audit(
        &state,
        "api_key.revoked",
        "admin",
        "admin@cube-elite.com",
        "api_key",
        &key_id,
        HashMap::new(),
    );
    
    Ok(updated_key)
}

// ============================================================
// METRICS & ANALYTICS COMMANDS
// ============================================================

#[tauri::command]
pub async fn admin_get_metrics(
    state: State<'_, AdminState>,
) -> Result<BusinessMetrics, String> {
    recalculate_metrics(&state);
    
    let metrics = state.metrics.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(metrics.clone())
}

#[tauri::command]
pub async fn admin_get_server_stats(
    state: State<'_, AdminState>,
) -> Result<ServerStats, String> {
    // In production, this would fetch real server stats
    let stats = state.server_stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(stats.clone())
}

#[tauri::command]
pub async fn admin_get_services(
    state: State<'_, AdminState>,
) -> Result<Vec<ServiceStatus>, String> {
    let services = state.services.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(services.values().cloned().collect())
}

#[tauri::command]
pub async fn admin_update_service_status(
    state: State<'_, AdminState>,
    service_name: String,
    status: HealthStatus,
) -> Result<ServiceStatus, String> {
    let mut services = state.services.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let service = services.get_mut(&service_name)
        .ok_or_else(|| "Service not found".to_string())?;
    
    service.status = status;
    service.last_check = Utc::now();
    
    let updated_service = service.clone();
    
    log_audit(
        &state,
        "service.status_updated",
        "admin",
        "admin@cube-elite.com",
        "service",
        &service_name,
        [("status".to_string(), format!("{:?}", updated_service.status))].into_iter().collect(),
    );
    
    Ok(updated_service)
}

// ============================================================
// AUDIT LOG COMMANDS
// ============================================================

#[tauri::command]
pub async fn admin_get_audit_logs(
    state: State<'_, AdminState>,
    action_filter: Option<String>,
    resource_filter: Option<String>,
    limit: Option<usize>,
) -> Result<Vec<AuditLog>, String> {
    let logs = state.audit_logs.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut result: Vec<AuditLog> = logs.iter()
        .filter(|log| {
            let action_match = action_filter.as_ref().map_or(true, |a| {
                log.action.contains(a)
            });
            
            let resource_match = resource_filter.as_ref().map_or(true, |r| {
                log.resource_type.contains(r)
            });
            
            action_match && resource_match
        })
        .rev()
        .take(limit.unwrap_or(100))
        .cloned()
        .collect();
    
    result.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    
    Ok(result)
}

// ============================================================
// BULK OPERATIONS
// ============================================================

#[tauri::command]
pub async fn admin_bulk_suspend_users(
    state: State<'_, AdminState>,
    user_ids: Vec<String>,
    reason: Option<String>,
) -> Result<u32, String> {
    let mut users = state.users.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut count = 0;
    
    for user_id in user_ids {
        if let Some(user) = users.get_mut(&user_id) {
            user.status = UserStatus::Suspended;
            if let Some(r) = &reason {
                user.metadata.insert("suspension_reason".to_string(), r.clone());
            }
            user.metadata.insert("suspended_at".to_string(), Utc::now().to_rfc3339());
            count += 1;
        }
    }
    
    recalculate_metrics(&state);
    
    Ok(count)
}

#[tauri::command]
pub async fn admin_bulk_delete_users(
    state: State<'_, AdminState>,
    user_ids: Vec<String>,
) -> Result<u32, String> {
    let mut users = state.users.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut count = 0;
    
    for user_id in user_ids {
        if users.remove(&user_id).is_some() {
            count += 1;
        }
    }
    
    recalculate_metrics(&state);
    
    Ok(count)
}

#[tauri::command]
pub async fn admin_export_data(
    state: State<'_, AdminState>,
    data_type: String,
    format: String,
) -> Result<String, String> {
    match data_type.as_str() {
        "users" => {
            let users = state.users.lock().map_err(|e| format!("Lock error: {}", e))?;
            let data: Vec<&AdminUser> = users.values().collect();
            match format.as_str() {
                "json" => serde_json::to_string_pretty(&data).map_err(|e| e.to_string()),
                "csv" => {
                    let mut csv = String::from("id,email,name,plan,status,created_at,api_calls\n");
                    for user in data {
                        csv.push_str(&format!(
                            "{},{},{},{:?},{:?},{},{}\n",
                            user.id, user.email, user.name, user.plan, user.status,
                            user.created_at.to_rfc3339(), user.api_calls
                        ));
                    }
                    Ok(csv)
                }
                _ => Err("Unsupported format".to_string())
            }
        }
        "licenses" => {
            let licenses = state.licenses.lock().map_err(|e| format!("Lock error: {}", e))?;
            let data: Vec<&AdminLicense> = licenses.values().collect();
            match format.as_str() {
                "json" => serde_json::to_string_pretty(&data).map_err(|e| e.to_string()),
                _ => Err("Unsupported format".to_string())
            }
        }
        "sales" => {
            let sales = state.sales.lock().map_err(|e| format!("Lock error: {}", e))?;
            let data: Vec<&SaleRecord> = sales.values().collect();
            match format.as_str() {
                "json" => serde_json::to_string_pretty(&data).map_err(|e| e.to_string()),
                _ => Err("Unsupported format".to_string())
            }
        }
        "audit_logs" => {
            let logs = state.audit_logs.lock().map_err(|e| format!("Lock error: {}", e))?;
            match format.as_str() {
                "json" => serde_json::to_string_pretty(&*logs).map_err(|e| e.to_string()),
                _ => Err("Unsupported format".to_string())
            }
        }
        _ => Err("Unknown data type".to_string())
    }
}
