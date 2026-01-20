// CUBE Nexum - SuperAdmin Users Commands
// Part 1: User Management Backend

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use tauri::State;

// =============================================================================
// STATE
// =============================================================================

pub struct SuperAdminUsersState {
    pub users: RwLock<HashMap<String, User>>,
    pub sessions: RwLock<HashMap<String, Vec<UserSession>>>,
}

impl Default for SuperAdminUsersState {
    fn default() -> Self {
        let mut users = HashMap::new();
        
        // Add demo users
        users.insert("user-1".to_string(), User {
            id: "user-1".to_string(),
            email: "admin@cubenexum.com".to_string(),
            first_name: "Admin".to_string(),
            last_name: "Principal".to_string(),
            display_name: "Admin Principal".to_string(),
            avatar: None,
            phone: Some("+1 555 0100".to_string()),
            job_title: Some("System Administrator".to_string()),
            department: Some("IT".to_string()),
            location: Some("New York, USA".to_string()),
            timezone: "America/New_York".to_string(),
            locale: "en-US".to_string(),
            status: "active".to_string(),
            user_type: "admin".to_string(),
            roles: vec!["super_admin".to_string(), "system_admin".to_string()],
            permissions: vec!["*".to_string()],
            organization_id: Some("org-1".to_string()),
            team_ids: vec!["team-1".to_string()],
            manager_id: None,
            mfa_enabled: true,
            mfa_methods: vec![MfaMethod {
                method_type: "totp".to_string(),
                enabled: true,
                primary: true,
                verified_at: Some("2025-01-01T00:00:00Z".to_string()),
            }],
            sso_enabled: false,
            sso_provider: None,
            password_changed_at: Some("2025-12-01T00:00:00Z".to_string()),
            failed_login_attempts: 0,
            locked_until: None,
            last_login_at: Some("2026-01-13T08:00:00Z".to_string()),
            last_activity_at: Some("2026-01-13T10:30:00Z".to_string()),
            email_verified: true,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-13T10:30:00Z".to_string(),
            created_by: "system".to_string(),
            metadata: UserMetadata {
                login_count: 1250,
                total_session_duration: 3600000,
                last_password_change: Some("2025-12-01T00:00:00Z".to_string()),
                risk_score: 5,
                trusted_devices: vec!["device-1".to_string()],
                known_ips: vec!["192.168.1.100".to_string()],
            },
        });

        users.insert("user-2".to_string(), User {
            id: "user-2".to_string(),
            email: "john.doe@cubenexum.com".to_string(),
            first_name: "John".to_string(),
            last_name: "Doe".to_string(),
            display_name: "John Doe".to_string(),
            avatar: None,
            phone: Some("+1 555 0101".to_string()),
            job_title: Some("Sales Manager".to_string()),
            department: Some("Sales".to_string()),
            location: Some("Los Angeles, USA".to_string()),
            timezone: "America/Los_Angeles".to_string(),
            locale: "en-US".to_string(),
            status: "active".to_string(),
            user_type: "member".to_string(),
            roles: vec!["team_lead".to_string()],
            permissions: vec!["users:read".to_string(), "teams:manage".to_string()],
            organization_id: Some("org-1".to_string()),
            team_ids: vec!["team-2".to_string()],
            manager_id: Some("user-1".to_string()),
            mfa_enabled: true,
            mfa_methods: vec![MfaMethod {
                method_type: "sms".to_string(),
                enabled: true,
                primary: true,
                verified_at: Some("2025-06-01T00:00:00Z".to_string()),
            }],
            sso_enabled: false,
            sso_provider: None,
            password_changed_at: Some("2025-11-15T00:00:00Z".to_string()),
            failed_login_attempts: 0,
            locked_until: None,
            last_login_at: Some("2026-01-13T09:00:00Z".to_string()),
            last_activity_at: Some("2026-01-13T11:00:00Z".to_string()),
            email_verified: true,
            created_at: "2025-03-15T00:00:00Z".to_string(),
            updated_at: "2026-01-13T11:00:00Z".to_string(),
            created_by: "user-1".to_string(),
            metadata: UserMetadata {
                login_count: 450,
                total_session_duration: 1800000,
                last_password_change: Some("2025-11-15T00:00:00Z".to_string()),
                risk_score: 10,
                trusted_devices: vec!["device-2".to_string()],
                known_ips: vec!["192.168.1.101".to_string()],
            },
        });

        users.insert("user-3".to_string(), User {
            id: "user-3".to_string(),
            email: "jane.smith@cubenexum.com".to_string(),
            first_name: "Jane".to_string(),
            last_name: "Smith".to_string(),
            display_name: "Jane Smith".to_string(),
            avatar: None,
            phone: Some("+1 555 0102".to_string()),
            job_title: Some("Support Specialist".to_string()),
            department: Some("Support".to_string()),
            location: Some("Chicago, USA".to_string()),
            timezone: "America/Chicago".to_string(),
            locale: "en-US".to_string(),
            status: "active".to_string(),
            user_type: "member".to_string(),
            roles: vec!["support_agent".to_string()],
            permissions: vec!["tickets:manage".to_string()],
            organization_id: Some("org-1".to_string()),
            team_ids: vec!["team-3".to_string()],
            manager_id: Some("user-2".to_string()),
            mfa_enabled: false,
            mfa_methods: vec![],
            sso_enabled: false,
            sso_provider: None,
            password_changed_at: Some("2025-10-01T00:00:00Z".to_string()),
            failed_login_attempts: 1,
            locked_until: None,
            last_login_at: Some("2026-01-12T14:00:00Z".to_string()),
            last_activity_at: Some("2026-01-12T18:00:00Z".to_string()),
            email_verified: true,
            created_at: "2025-06-01T00:00:00Z".to_string(),
            updated_at: "2026-01-12T18:00:00Z".to_string(),
            created_by: "user-1".to_string(),
            metadata: UserMetadata {
                login_count: 200,
                total_session_duration: 900000,
                last_password_change: Some("2025-10-01T00:00:00Z".to_string()),
                risk_score: 25,
                trusted_devices: vec![],
                known_ips: vec!["192.168.1.102".to_string()],
            },
        });

        users.insert("user-4".to_string(), User {
            id: "user-4".to_string(),
            email: "suspended@cubenexum.com".to_string(),
            first_name: "Suspended".to_string(),
            last_name: "User".to_string(),
            display_name: "Suspended User".to_string(),
            avatar: None,
            phone: None,
            job_title: None,
            department: None,
            location: None,
            timezone: "UTC".to_string(),
            locale: "en-US".to_string(),
            status: "suspended".to_string(),
            user_type: "member".to_string(),
            roles: vec![],
            permissions: vec![],
            organization_id: Some("org-1".to_string()),
            team_ids: vec![],
            manager_id: None,
            mfa_enabled: false,
            mfa_methods: vec![],
            sso_enabled: false,
            sso_provider: None,
            password_changed_at: None,
            failed_login_attempts: 10,
            locked_until: Some("2026-02-01T00:00:00Z".to_string()),
            last_login_at: None,
            last_activity_at: None,
            email_verified: false,
            created_at: "2025-09-01T00:00:00Z".to_string(),
            updated_at: "2026-01-10T00:00:00Z".to_string(),
            created_by: "user-1".to_string(),
            metadata: UserMetadata {
                login_count: 5,
                total_session_duration: 60000,
                last_password_change: None,
                risk_score: 85,
                trusted_devices: vec![],
                known_ips: vec![],
            },
        });

        let mut sessions = HashMap::new();
        sessions.insert("user-1".to_string(), vec![
            UserSession {
                id: "session-1".to_string(),
                device: "MacBook Pro - Chrome".to_string(),
                location: "New York, USA".to_string(),
                ip_address: "192.168.1.100".to_string(),
                last_active: "2026-01-13T10:30:00Z".to_string(),
            },
            UserSession {
                id: "session-2".to_string(),
                device: "iPhone 15 Pro - Safari".to_string(),
                location: "New York, USA".to_string(),
                ip_address: "192.168.1.105".to_string(),
                last_active: "2026-01-13T08:00:00Z".to_string(),
            },
        ]);
        sessions.insert("user-2".to_string(), vec![
            UserSession {
                id: "session-3".to_string(),
                device: "Windows PC - Edge".to_string(),
                location: "Los Angeles, USA".to_string(),
                ip_address: "192.168.1.101".to_string(),
                last_active: "2026-01-13T11:00:00Z".to_string(),
            },
        ]);

        Self {
            users: RwLock::new(users),
            sessions: RwLock::new(sessions),
        }
    }
}

// =============================================================================
// TYPES
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub display_name: String,
    pub avatar: Option<String>,
    pub phone: Option<String>,
    pub job_title: Option<String>,
    pub department: Option<String>,
    pub location: Option<String>,
    pub timezone: String,
    pub locale: String,
    pub status: String,
    pub user_type: String,
    pub roles: Vec<String>,
    pub permissions: Vec<String>,
    pub organization_id: Option<String>,
    pub team_ids: Vec<String>,
    pub manager_id: Option<String>,
    pub mfa_enabled: bool,
    pub mfa_methods: Vec<MfaMethod>,
    pub sso_enabled: bool,
    pub sso_provider: Option<String>,
    pub password_changed_at: Option<String>,
    pub failed_login_attempts: u32,
    pub locked_until: Option<String>,
    pub last_login_at: Option<String>,
    pub last_activity_at: Option<String>,
    pub email_verified: bool,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: String,
    pub metadata: UserMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MfaMethod {
    pub method_type: String,
    pub enabled: bool,
    pub primary: bool,
    pub verified_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserMetadata {
    pub login_count: u32,
    pub total_session_duration: u64,
    pub last_password_change: Option<String>,
    pub risk_score: u32,
    pub trusted_devices: Vec<String>,
    pub known_ips: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSession {
    pub id: String,
    pub device: String,
    pub location: String,
    pub ip_address: String,
    pub last_active: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
    pub job_title: Option<String>,
    pub department: Option<String>,
    pub roles: Vec<String>,
    pub send_invite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUserRequest {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub display_name: Option<String>,
    pub phone: Option<String>,
    pub job_title: Option<String>,
    pub department: Option<String>,
    pub location: Option<String>,
    pub timezone: Option<String>,
    pub status: Option<String>,
    pub roles: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserListResponse {
    pub users: Vec<User>,
    pub total: u32,
    pub page: u32,
    pub limit: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImpersonationResult {
    pub token: String,
    pub expires_at: String,
    pub user_id: String,
    pub impersonator_id: String,
}

// =============================================================================
// COMMANDS
// =============================================================================

#[tauri::command]
pub async fn sa_get_users(
    state: State<'_, SuperAdminUsersState>,
    status: Option<Vec<String>>,
    roles: Option<Vec<String>>,
    search: Option<String>,
    page: Option<u32>,
    limit: Option<u32>,
) -> Result<UserListResponse, String> {
    let users_lock = state.users.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(20);
    
    let mut filtered_users: Vec<User> = users_lock.values().cloned().collect();
    
    // Filter by status
    if let Some(statuses) = status {
        if !statuses.is_empty() {
            filtered_users.retain(|u| statuses.contains(&u.status));
        }
    }
    
    // Filter by roles
    if let Some(role_filter) = roles {
        if !role_filter.is_empty() {
            filtered_users.retain(|u| u.roles.iter().any(|r| role_filter.contains(r)));
        }
    }
    
    // Filter by search
    if let Some(query) = search {
        let query_lower = query.to_lowercase();
        filtered_users.retain(|u| {
            u.email.to_lowercase().contains(&query_lower) ||
            u.display_name.to_lowercase().contains(&query_lower) ||
            u.first_name.to_lowercase().contains(&query_lower) ||
            u.last_name.to_lowercase().contains(&query_lower)
        });
    }
    
    let total = filtered_users.len() as u32;
    
    // Paginate
    let start = ((page - 1) * limit) as usize;
    let end = std::cmp::min(start + limit as usize, filtered_users.len());
    let paginated = if start < filtered_users.len() {
        filtered_users[start..end].to_vec()
    } else {
        vec![]
    };
    
    Ok(UserListResponse {
        users: paginated,
        total,
        page,
        limit,
    })
}

#[tauri::command]
pub async fn sa_get_user(
    state: State<'_, SuperAdminUsersState>,
    user_id: String,
) -> Result<User, String> {
    let users_lock = state.users.read().map_err(|e| format!("Lock error: {}", e))?;
    
    users_lock.get(&user_id)
        .cloned()
        .ok_or_else(|| format!("User not found: {}", user_id))
}

#[tauri::command]
pub async fn sa_create_user(
    state: State<'_, SuperAdminUsersState>,
    request: CreateUserRequest,
) -> Result<User, String> {
    let mut users_lock = state.users.write().map_err(|e| format!("Lock error: {}", e))?;
    
    // Check if email already exists
    if users_lock.values().any(|u| u.email == request.email) {
        return Err("Email already exists".to_string());
    }
    
    let id = format!("user-{}", uuid::Uuid::new_v4());
    let now = chrono::Utc::now().to_rfc3339();
    
    let user = User {
        id: id.clone(),
        email: request.email,
        first_name: request.first_name.clone(),
        last_name: request.last_name.clone(),
        display_name: format!("{} {}", request.first_name, request.last_name),
        avatar: None,
        phone: request.phone,
        job_title: request.job_title,
        department: request.department,
        location: None,
        timezone: "UTC".to_string(),
        locale: "en-US".to_string(),
        status: if request.send_invite { "pending".to_string() } else { "active".to_string() },
        user_type: "member".to_string(),
        roles: request.roles,
        permissions: vec![],
        organization_id: Some("org-1".to_string()),
        team_ids: vec![],
        manager_id: None,
        mfa_enabled: false,
        mfa_methods: vec![],
        sso_enabled: false,
        sso_provider: None,
        password_changed_at: None,
        failed_login_attempts: 0,
        locked_until: None,
        last_login_at: None,
        last_activity_at: None,
        email_verified: false,
        created_at: now.clone(),
        updated_at: now,
        created_by: "admin".to_string(),
        metadata: UserMetadata {
            login_count: 0,
            total_session_duration: 0,
            last_password_change: None,
            risk_score: 0,
            trusted_devices: vec![],
            known_ips: vec![],
        },
    };
    
    users_lock.insert(id, user.clone());
    
    Ok(user)
}

#[tauri::command]
pub async fn sa_update_user(
    state: State<'_, SuperAdminUsersState>,
    user_id: String,
    updates: UpdateUserRequest,
) -> Result<User, String> {
    let mut users_lock = state.users.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let user = users_lock.get_mut(&user_id)
        .ok_or_else(|| format!("User not found: {}", user_id))?;
    
    if let Some(first_name) = updates.first_name {
        user.first_name = first_name;
    }
    if let Some(last_name) = updates.last_name {
        user.last_name = last_name;
    }
    if let Some(display_name) = updates.display_name {
        user.display_name = display_name;
    }
    if let Some(phone) = updates.phone {
        user.phone = Some(phone);
    }
    if let Some(job_title) = updates.job_title {
        user.job_title = Some(job_title);
    }
    if let Some(department) = updates.department {
        user.department = Some(department);
    }
    if let Some(location) = updates.location {
        user.location = Some(location);
    }
    if let Some(timezone) = updates.timezone {
        user.timezone = timezone;
    }
    if let Some(status) = updates.status {
        user.status = status;
    }
    if let Some(roles) = updates.roles {
        user.roles = roles;
    }
    
    user.updated_at = chrono::Utc::now().to_rfc3339();
    
    Ok(user.clone())
}

#[tauri::command]
pub async fn sa_delete_user(
    state: State<'_, SuperAdminUsersState>,
    user_id: String,
) -> Result<bool, String> {
    let mut users_lock = state.users.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if users_lock.remove(&user_id).is_some() {
        Ok(true)
    } else {
        Err(format!("User not found: {}", user_id))
    }
}

#[tauri::command]
pub async fn sa_suspend_user(
    state: State<'_, SuperAdminUsersState>,
    user_id: String,
    reason: String,
) -> Result<User, String> {
    let mut users_lock = state.users.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let user = users_lock.get_mut(&user_id)
        .ok_or_else(|| format!("User not found: {}", user_id))?;
    
    user.status = "suspended".to_string();
    user.updated_at = chrono::Utc::now().to_rfc3339();
    
    // Log would include reason in production
    let _ = reason;
    
    Ok(user.clone())
}

#[tauri::command]
pub async fn sa_reactivate_user(
    state: State<'_, SuperAdminUsersState>,
    user_id: String,
) -> Result<User, String> {
    let mut users_lock = state.users.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let user = users_lock.get_mut(&user_id)
        .ok_or_else(|| format!("User not found: {}", user_id))?;
    
    user.status = "active".to_string();
    user.failed_login_attempts = 0;
    user.locked_until = None;
    user.updated_at = chrono::Utc::now().to_rfc3339();
    
    Ok(user.clone())
}

#[tauri::command]
pub async fn sa_impersonate_user(
    state: State<'_, SuperAdminUsersState>,
    user_id: String,
) -> Result<ImpersonationResult, String> {
    let users_lock = state.users.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let _user = users_lock.get(&user_id)
        .ok_or_else(|| format!("User not found: {}", user_id))?;
    
    let token = format!("imp_{}", uuid::Uuid::new_v4());
    let expires_at = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(1))
        .unwrap()
        .to_rfc3339();
    
    Ok(ImpersonationResult {
        token,
        expires_at,
        user_id,
        impersonator_id: "admin".to_string(),
    })
}

#[tauri::command]
pub async fn sa_force_password_reset(
    state: State<'_, SuperAdminUsersState>,
    user_id: String,
) -> Result<bool, String> {
    let users_lock = state.users.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let _user = users_lock.get(&user_id)
        .ok_or_else(|| format!("User not found: {}", user_id))?;
    
    // In production, this would send a password reset email
    Ok(true)
}

#[tauri::command]
pub async fn sa_get_user_sessions(
    state: State<'_, SuperAdminUsersState>,
    user_id: String,
) -> Result<Vec<UserSession>, String> {
    let sessions_lock = state.sessions.read().map_err(|e| format!("Lock error: {}", e))?;
    
    Ok(sessions_lock.get(&user_id).cloned().unwrap_or_default())
}

#[tauri::command]
pub async fn sa_terminate_sessions(
    state: State<'_, SuperAdminUsersState>,
    user_id: String,
    session_ids: Option<Vec<String>>,
) -> Result<u32, String> {
    let mut sessions_lock = state.sessions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(user_sessions) = sessions_lock.get_mut(&user_id) {
        if let Some(ids) = session_ids {
            let before = user_sessions.len();
            user_sessions.retain(|s| !ids.contains(&s.id));
            Ok((before - user_sessions.len()) as u32)
        } else {
            let count = user_sessions.len() as u32;
            user_sessions.clear();
            Ok(count)
        }
    } else {
        Ok(0)
    }
}

#[tauri::command]
pub async fn sa_bulk_update_users(
    state: State<'_, SuperAdminUsersState>,
    user_ids: Vec<String>,
    updates: UpdateUserRequest,
) -> Result<u32, String> {
    let mut users_lock = state.users.write().map_err(|e| format!("Lock error: {}", e))?;
    let mut count = 0;
    
    for user_id in user_ids {
        if let Some(user) = users_lock.get_mut(&user_id) {
            if let Some(ref status) = updates.status {
                user.status = status.clone();
            }
            if let Some(ref roles) = updates.roles {
                user.roles = roles.clone();
            }
            user.updated_at = chrono::Utc::now().to_rfc3339();
            count += 1;
        }
    }
    
    Ok(count)
}

#[tauri::command]
pub async fn sa_assign_role(
    state: State<'_, SuperAdminUsersState>,
    user_id: String,
    role_id: String,
) -> Result<User, String> {
    let mut users_lock = state.users.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let user = users_lock.get_mut(&user_id)
        .ok_or_else(|| format!("User not found: {}", user_id))?;
    
    if !user.roles.contains(&role_id) {
        user.roles.push(role_id);
    }
    user.updated_at = chrono::Utc::now().to_rfc3339();
    
    Ok(user.clone())
}

#[tauri::command]
pub async fn sa_remove_role(
    state: State<'_, SuperAdminUsersState>,
    user_id: String,
    role_id: String,
) -> Result<User, String> {
    let mut users_lock = state.users.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let user = users_lock.get_mut(&user_id)
        .ok_or_else(|| format!("User not found: {}", user_id))?;
    
    user.roles.retain(|r| r != &role_id);
    user.updated_at = chrono::Utc::now().to_rfc3339();
    
    Ok(user.clone())
}
