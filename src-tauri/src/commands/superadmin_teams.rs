// CUBE Nexum - SuperAdmin Teams & Roles Commands
// Part 2: Team and Role Management Backend

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use tauri::State;

// =============================================================================
// STATE
// =============================================================================

pub struct SuperAdminTeamsState {
    pub teams: RwLock<HashMap<String, Team>>,
    pub roles: RwLock<HashMap<String, Role>>,
    pub permissions: RwLock<Vec<Permission>>,
}

impl Default for SuperAdminTeamsState {
    fn default() -> Self {
        let mut teams = HashMap::new();
        
        teams.insert("team-1".to_string(), Team {
            id: "team-1".to_string(),
            name: "Executive Team".to_string(),
            description: Some("C-level executives and leadership".to_string()),
            slug: "executive".to_string(),
            visibility: "private".to_string(),
            parent_team_id: None,
            owner_id: "user-1".to_string(),
            member_ids: vec!["user-1".to_string()],
            settings: TeamSettings {
                allow_member_invite: false,
                require_approval: true,
                default_role: "member".to_string(),
                notifications_enabled: true,
            },
            quotas: TeamQuotas {
                max_members: 50,
                max_storage_bytes: 107374182400,
                max_projects: 100,
                max_api_calls_per_day: 100000,
            },
            metrics: TeamMetrics {
                member_count: 1,
                active_members: 1,
                storage_used: 1073741824,
                api_calls_this_month: 5000,
            },
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-13T00:00:00Z".to_string(),
        });

        teams.insert("team-2".to_string(), Team {
            id: "team-2".to_string(),
            name: "Sales Department".to_string(),
            description: Some("Sales team members".to_string()),
            slug: "sales".to_string(),
            visibility: "public".to_string(),
            parent_team_id: None,
            owner_id: "user-2".to_string(),
            member_ids: vec!["user-2".to_string()],
            settings: TeamSettings {
                allow_member_invite: true,
                require_approval: false,
                default_role: "member".to_string(),
                notifications_enabled: true,
            },
            quotas: TeamQuotas {
                max_members: 100,
                max_storage_bytes: 53687091200,
                max_projects: 50,
                max_api_calls_per_day: 50000,
            },
            metrics: TeamMetrics {
                member_count: 1,
                active_members: 1,
                storage_used: 536870912,
                api_calls_this_month: 2500,
            },
            created_at: "2024-06-01T00:00:00Z".to_string(),
            updated_at: "2026-01-12T00:00:00Z".to_string(),
        });

        teams.insert("team-3".to_string(), Team {
            id: "team-3".to_string(),
            name: "Support Team".to_string(),
            description: Some("Customer support specialists".to_string()),
            slug: "support".to_string(),
            visibility: "public".to_string(),
            parent_team_id: None,
            owner_id: "user-1".to_string(),
            member_ids: vec!["user-3".to_string()],
            settings: TeamSettings {
                allow_member_invite: true,
                require_approval: true,
                default_role: "support_agent".to_string(),
                notifications_enabled: true,
            },
            quotas: TeamQuotas {
                max_members: 200,
                max_storage_bytes: 21474836480,
                max_projects: 25,
                max_api_calls_per_day: 25000,
            },
            metrics: TeamMetrics {
                member_count: 1,
                active_members: 1,
                storage_used: 214748364,
                api_calls_this_month: 1000,
            },
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-11T00:00:00Z".to_string(),
        });

        let mut roles = HashMap::new();
        
        // System roles
        roles.insert("super_admin".to_string(), Role {
            id: "super_admin".to_string(),
            name: "Super Admin".to_string(),
            description: "Full system access with all permissions".to_string(),
            role_type: "system".to_string(),
            permissions: vec!["*".to_string()],
            priority: 100,
            is_default: false,
            user_count: 1,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        });

        roles.insert("system_admin".to_string(), Role {
            id: "system_admin".to_string(),
            name: "System Administrator".to_string(),
            description: "System-level administration access".to_string(),
            role_type: "system".to_string(),
            permissions: vec![
                "users:*".to_string(),
                "teams:*".to_string(),
                "settings:*".to_string(),
                "audit:read".to_string(),
            ],
            priority: 90,
            is_default: false,
            user_count: 1,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        });

        roles.insert("org_admin".to_string(), Role {
            id: "org_admin".to_string(),
            name: "Organization Admin".to_string(),
            description: "Organization-level administration".to_string(),
            role_type: "system".to_string(),
            permissions: vec![
                "users:read".to_string(),
                "users:create".to_string(),
                "users:update".to_string(),
                "teams:*".to_string(),
                "billing:read".to_string(),
            ],
            priority: 80,
            is_default: false,
            user_count: 0,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        });

        roles.insert("team_lead".to_string(), Role {
            id: "team_lead".to_string(),
            name: "Team Lead".to_string(),
            description: "Team leadership and management".to_string(),
            role_type: "system".to_string(),
            permissions: vec![
                "users:read".to_string(),
                "teams:manage".to_string(),
                "projects:*".to_string(),
            ],
            priority: 70,
            is_default: false,
            user_count: 1,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        });

        roles.insert("member".to_string(), Role {
            id: "member".to_string(),
            name: "Member".to_string(),
            description: "Standard team member".to_string(),
            role_type: "system".to_string(),
            permissions: vec![
                "profile:*".to_string(),
                "projects:read".to_string(),
            ],
            priority: 10,
            is_default: true,
            user_count: 0,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        });

        roles.insert("support_agent".to_string(), Role {
            id: "support_agent".to_string(),
            name: "Support Agent".to_string(),
            description: "Customer support role".to_string(),
            role_type: "system".to_string(),
            permissions: vec![
                "tickets:*".to_string(),
                "customers:read".to_string(),
                "knowledge_base:read".to_string(),
            ],
            priority: 50,
            is_default: false,
            user_count: 1,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        });

        roles.insert("billing_admin".to_string(), Role {
            id: "billing_admin".to_string(),
            name: "Billing Administrator".to_string(),
            description: "Billing and subscription management".to_string(),
            role_type: "system".to_string(),
            permissions: vec![
                "billing:*".to_string(),
                "subscriptions:*".to_string(),
                "invoices:*".to_string(),
            ],
            priority: 75,
            is_default: false,
            user_count: 0,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        });

        roles.insert("security_admin".to_string(), Role {
            id: "security_admin".to_string(),
            name: "Security Administrator".to_string(),
            description: "Security settings and audit management".to_string(),
            role_type: "system".to_string(),
            permissions: vec![
                "security:*".to_string(),
                "audit:*".to_string(),
                "compliance:*".to_string(),
            ],
            priority: 85,
            is_default: false,
            user_count: 0,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        });

        // Custom roles
        roles.insert("custom-sales-manager".to_string(), Role {
            id: "custom-sales-manager".to_string(),
            name: "Sales Manager".to_string(),
            description: "Custom role for sales management".to_string(),
            role_type: "custom".to_string(),
            permissions: vec![
                "crm:*".to_string(),
                "reports:sales".to_string(),
                "teams:sales:manage".to_string(),
            ],
            priority: 60,
            is_default: false,
            user_count: 0,
            created_at: "2025-06-01T00:00:00Z".to_string(),
            updated_at: "2025-06-01T00:00:00Z".to_string(),
        });

        let permissions = vec![
            Permission {
                id: "users:read".to_string(),
                resource: "users".to_string(),
                action: "read".to_string(),
                description: "View user information".to_string(),
            },
            Permission {
                id: "users:create".to_string(),
                resource: "users".to_string(),
                action: "create".to_string(),
                description: "Create new users".to_string(),
            },
            Permission {
                id: "users:update".to_string(),
                resource: "users".to_string(),
                action: "update".to_string(),
                description: "Update user information".to_string(),
            },
            Permission {
                id: "users:delete".to_string(),
                resource: "users".to_string(),
                action: "delete".to_string(),
                description: "Delete users".to_string(),
            },
            Permission {
                id: "teams:read".to_string(),
                resource: "teams".to_string(),
                action: "read".to_string(),
                description: "View team information".to_string(),
            },
            Permission {
                id: "teams:manage".to_string(),
                resource: "teams".to_string(),
                action: "manage".to_string(),
                description: "Manage team settings and members".to_string(),
            },
            Permission {
                id: "billing:read".to_string(),
                resource: "billing".to_string(),
                action: "read".to_string(),
                description: "View billing information".to_string(),
            },
            Permission {
                id: "billing:manage".to_string(),
                resource: "billing".to_string(),
                action: "manage".to_string(),
                description: "Manage billing settings".to_string(),
            },
            Permission {
                id: "security:read".to_string(),
                resource: "security".to_string(),
                action: "read".to_string(),
                description: "View security settings".to_string(),
            },
            Permission {
                id: "security:manage".to_string(),
                resource: "security".to_string(),
                action: "manage".to_string(),
                description: "Manage security settings".to_string(),
            },
            Permission {
                id: "audit:read".to_string(),
                resource: "audit".to_string(),
                action: "read".to_string(),
                description: "View audit logs".to_string(),
            },
            Permission {
                id: "audit:export".to_string(),
                resource: "audit".to_string(),
                action: "export".to_string(),
                description: "Export audit logs".to_string(),
            },
        ];

        Self {
            teams: RwLock::new(teams),
            roles: RwLock::new(roles),
            permissions: RwLock::new(permissions),
        }
    }
}

// =============================================================================
// TYPES
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Team {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub slug: String,
    pub visibility: String,
    pub parent_team_id: Option<String>,
    pub owner_id: String,
    pub member_ids: Vec<String>,
    pub settings: TeamSettings,
    pub quotas: TeamQuotas,
    pub metrics: TeamMetrics,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamSettings {
    pub allow_member_invite: bool,
    pub require_approval: bool,
    pub default_role: String,
    pub notifications_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamQuotas {
    pub max_members: u32,
    pub max_storage_bytes: u64,
    pub max_projects: u32,
    pub max_api_calls_per_day: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamMetrics {
    pub member_count: u32,
    pub active_members: u32,
    pub storage_used: u64,
    pub api_calls_this_month: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Role {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub role_type: String,
    pub permissions: Vec<String>,
    pub priority: u32,
    pub is_default: bool,
    pub user_count: u32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    pub id: String,
    pub resource: String,
    pub action: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTeamRequest {
    pub name: String,
    pub description: Option<String>,
    pub visibility: String,
    pub owner_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTeamRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub visibility: Option<String>,
    pub settings: Option<TeamSettings>,
    pub quotas: Option<TeamQuotas>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRoleRequest {
    pub name: String,
    pub description: String,
    pub permissions: Vec<String>,
    pub priority: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamListResponse {
    pub teams: Vec<Team>,
    pub total: u32,
}

// =============================================================================
// TEAM COMMANDS
// =============================================================================

#[tauri::command]
pub async fn sa_get_teams(
    state: State<'_, SuperAdminTeamsState>,
    search: Option<String>,
    visibility: Option<String>,
) -> Result<TeamListResponse, String> {
    let teams_lock = state.teams.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut filtered: Vec<Team> = teams_lock.values().cloned().collect();
    
    if let Some(query) = search {
        let query_lower = query.to_lowercase();
        filtered.retain(|t| {
            t.name.to_lowercase().contains(&query_lower) ||
            t.description.as_ref().map(|d| d.to_lowercase().contains(&query_lower)).unwrap_or(false)
        });
    }
    
    if let Some(vis) = visibility {
        filtered.retain(|t| t.visibility == vis);
    }
    
    let total = filtered.len() as u32;
    
    Ok(TeamListResponse { teams: filtered, total })
}

#[tauri::command]
pub async fn sa_get_team(
    state: State<'_, SuperAdminTeamsState>,
    team_id: String,
) -> Result<Team, String> {
    let teams_lock = state.teams.read().map_err(|e| format!("Lock error: {}", e))?;
    
    teams_lock.get(&team_id)
        .cloned()
        .ok_or_else(|| format!("Team not found: {}", team_id))
}

#[tauri::command]
pub async fn sa_create_team(
    state: State<'_, SuperAdminTeamsState>,
    request: CreateTeamRequest,
) -> Result<Team, String> {
    let mut teams_lock = state.teams.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let id = format!("team-{}", uuid::Uuid::new_v4());
    let slug = request.name.to_lowercase().replace(' ', "-");
    let now = chrono::Utc::now().to_rfc3339();
    
    let team = Team {
        id: id.clone(),
        name: request.name,
        description: request.description,
        slug,
        visibility: request.visibility,
        parent_team_id: None,
        owner_id: request.owner_id.clone(),
        member_ids: vec![request.owner_id],
        settings: TeamSettings {
            allow_member_invite: true,
            require_approval: false,
            default_role: "member".to_string(),
            notifications_enabled: true,
        },
        quotas: TeamQuotas {
            max_members: 100,
            max_storage_bytes: 53687091200,
            max_projects: 50,
            max_api_calls_per_day: 50000,
        },
        metrics: TeamMetrics {
            member_count: 1,
            active_members: 1,
            storage_used: 0,
            api_calls_this_month: 0,
        },
        created_at: now.clone(),
        updated_at: now,
    };
    
    teams_lock.insert(id, team.clone());
    
    Ok(team)
}

#[tauri::command]
pub async fn sa_update_team(
    state: State<'_, SuperAdminTeamsState>,
    team_id: String,
    updates: UpdateTeamRequest,
) -> Result<Team, String> {
    let mut teams_lock = state.teams.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let team = teams_lock.get_mut(&team_id)
        .ok_or_else(|| format!("Team not found: {}", team_id))?;
    
    if let Some(name) = updates.name {
        team.name = name.clone();
        team.slug = name.to_lowercase().replace(' ', "-");
    }
    if let Some(description) = updates.description {
        team.description = Some(description);
    }
    if let Some(visibility) = updates.visibility {
        team.visibility = visibility;
    }
    if let Some(settings) = updates.settings {
        team.settings = settings;
    }
    if let Some(quotas) = updates.quotas {
        team.quotas = quotas;
    }
    
    team.updated_at = chrono::Utc::now().to_rfc3339();
    
    Ok(team.clone())
}

#[tauri::command]
pub async fn sa_delete_team(
    state: State<'_, SuperAdminTeamsState>,
    team_id: String,
) -> Result<bool, String> {
    let mut teams_lock = state.teams.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if teams_lock.remove(&team_id).is_some() {
        Ok(true)
    } else {
        Err(format!("Team not found: {}", team_id))
    }
}

#[tauri::command]
pub async fn sa_add_team_member(
    state: State<'_, SuperAdminTeamsState>,
    team_id: String,
    user_id: String,
) -> Result<Team, String> {
    let mut teams_lock = state.teams.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let team = teams_lock.get_mut(&team_id)
        .ok_or_else(|| format!("Team not found: {}", team_id))?;
    
    if !team.member_ids.contains(&user_id) {
        team.member_ids.push(user_id);
        team.metrics.member_count += 1;
    }
    team.updated_at = chrono::Utc::now().to_rfc3339();
    
    Ok(team.clone())
}

#[tauri::command]
pub async fn sa_remove_team_member(
    state: State<'_, SuperAdminTeamsState>,
    team_id: String,
    user_id: String,
) -> Result<Team, String> {
    let mut teams_lock = state.teams.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let team = teams_lock.get_mut(&team_id)
        .ok_or_else(|| format!("Team not found: {}", team_id))?;
    
    if team.member_ids.contains(&user_id) {
        team.member_ids.retain(|id| id != &user_id);
        team.metrics.member_count = team.metrics.member_count.saturating_sub(1);
    }
    team.updated_at = chrono::Utc::now().to_rfc3339();
    
    Ok(team.clone())
}

// =============================================================================
// ROLE COMMANDS
// =============================================================================

#[tauri::command]
pub async fn sa_get_roles(
    state: State<'_, SuperAdminTeamsState>,
) -> Result<Vec<Role>, String> {
    let roles_lock = state.roles.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut roles: Vec<Role> = roles_lock.values().cloned().collect();
    roles.sort_by(|a, b| b.priority.cmp(&a.priority));
    
    Ok(roles)
}

#[tauri::command]
pub async fn sa_get_role(
    state: State<'_, SuperAdminTeamsState>,
    role_id: String,
) -> Result<Role, String> {
    let roles_lock = state.roles.read().map_err(|e| format!("Lock error: {}", e))?;
    
    roles_lock.get(&role_id)
        .cloned()
        .ok_or_else(|| format!("Role not found: {}", role_id))
}

#[tauri::command]
pub async fn sa_create_role(
    state: State<'_, SuperAdminTeamsState>,
    request: CreateRoleRequest,
) -> Result<Role, String> {
    let mut roles_lock = state.roles.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let id = format!("custom-{}", uuid::Uuid::new_v4());
    let now = chrono::Utc::now().to_rfc3339();
    
    let role = Role {
        id: id.clone(),
        name: request.name,
        description: request.description,
        role_type: "custom".to_string(),
        permissions: request.permissions,
        priority: request.priority,
        is_default: false,
        user_count: 0,
        created_at: now.clone(),
        updated_at: now,
    };
    
    roles_lock.insert(id, role.clone());
    
    Ok(role)
}

#[tauri::command]
pub async fn sa_update_role(
    state: State<'_, SuperAdminTeamsState>,
    role_id: String,
    name: Option<String>,
    description: Option<String>,
    permissions: Option<Vec<String>>,
    priority: Option<u32>,
) -> Result<Role, String> {
    let mut roles_lock = state.roles.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let role = roles_lock.get_mut(&role_id)
        .ok_or_else(|| format!("Role not found: {}", role_id))?;
    
    if role.role_type == "system" {
        return Err("Cannot modify system roles".to_string());
    }
    
    if let Some(n) = name {
        role.name = n;
    }
    if let Some(d) = description {
        role.description = d;
    }
    if let Some(p) = permissions {
        role.permissions = p;
    }
    if let Some(pr) = priority {
        role.priority = pr;
    }
    
    role.updated_at = chrono::Utc::now().to_rfc3339();
    
    Ok(role.clone())
}

#[tauri::command]
pub async fn sa_delete_role(
    state: State<'_, SuperAdminTeamsState>,
    role_id: String,
    transfer_to: String,
) -> Result<bool, String> {
    let mut roles_lock = state.roles.write().map_err(|e| format!("Lock error: {}", e))?;
    
    // Check if role exists and is custom
    if let Some(role) = roles_lock.get(&role_id) {
        if role.role_type == "system" {
            return Err("Cannot delete system roles".to_string());
        }
    } else {
        return Err(format!("Role not found: {}", role_id));
    }
    
    // Verify transfer_to role exists
    if !roles_lock.contains_key(&transfer_to) {
        return Err(format!("Transfer role not found: {}", transfer_to));
    }
    
    roles_lock.remove(&role_id);
    
    Ok(true)
}

#[tauri::command]
pub async fn sa_get_permissions(
    state: State<'_, SuperAdminTeamsState>,
) -> Result<Vec<Permission>, String> {
    let permissions_lock = state.permissions.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(permissions_lock.clone())
}
