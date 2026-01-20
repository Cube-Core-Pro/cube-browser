// ============================================
// CUBE Elite v6 - Enterprise Services Commands
// Fortune 500 Ready - Tauri Commands Layer
// ============================================

use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Arc;
use tokio::sync::RwLock;

// ============================================
// SSO Service Commands
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSOProviderConfig {
    pub provider_type: String, // "saml" | "oidc" | "ldap"
    pub name: String,
    pub client_id: Option<String>,
    pub client_secret: Option<String>,
    pub issuer_url: Option<String>,
    pub authorization_endpoint: Option<String>,
    pub token_endpoint: Option<String>,
    pub userinfo_endpoint: Option<String>,
    pub jwks_uri: Option<String>,
    pub redirect_uri: String,
    pub scopes: Vec<String>,
    pub entity_id: Option<String>,
    pub sso_url: Option<String>,
    pub certificate: Option<String>,
    pub ldap_url: Option<String>,
    pub ldap_base_dn: Option<String>,
    pub ldap_bind_dn: Option<String>,
    pub ldap_bind_password: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSOSession {
    pub id: String,
    pub user_id: String,
    pub provider_id: String,
    pub email: String,
    pub name: String,
    pub roles: Vec<String>,
    pub groups: Vec<String>,
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: i64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSOAuthResult {
    pub success: bool,
    pub session: Option<SSOSession>,
    pub error: Option<String>,
    pub redirect_url: Option<String>,
}

/// State for SSO service
pub struct SSOServiceState {
    pub providers: Arc<RwLock<Vec<SSOProviderConfig>>>,
    pub sessions: Arc<RwLock<Vec<SSOSession>>>,
}

impl Default for SSOServiceState {
    fn default() -> Self {
        Self {
            providers: Arc::new(RwLock::new(Vec::new())),
            sessions: Arc::new(RwLock::new(Vec::new())),
        }
    }
}

/// Register a new SSO provider
#[tauri::command]
pub async fn sso_register_provider(
    state: State<'_, SSOServiceState>,
    config: SSOProviderConfig,
) -> Result<String, String> {
    println!("🔐 [SSO] Registering provider: {}", config.name);
    
    let provider_id = format!("sso_{}", uuid::Uuid::new_v4());
    let mut providers = state.providers.write().await;
    providers.push(config);
    
    Ok(provider_id)
}

/// List all SSO providers
#[tauri::command]
pub async fn sso_list_providers(
    state: State<'_, SSOServiceState>,
) -> Result<Vec<SSOProviderConfig>, String> {
    let providers = state.providers.read().await;
    Ok(providers.clone())
}

/// Initiate SSO authentication flow
#[tauri::command]
pub async fn sso_initiate_auth(
    state: State<'_, SSOServiceState>,
    provider_id: String,
    redirect_uri: String,
) -> Result<SSOAuthResult, String> {
    println!("🔐 [SSO] Initiating auth for provider: {}", provider_id);
    
    let providers = state.providers.read().await;
    let _provider = providers.iter()
        .find(|p| p.name == provider_id)
        .ok_or("Provider not found")?;
    
    // Generate authorization URL based on provider type
    let auth_url = format!(
        "https://auth.example.com/authorize?client_id={}&redirect_uri={}&response_type=code&scope=openid%20profile%20email",
        provider_id,
        urlencoding::encode(&redirect_uri)
    );
    
    Ok(SSOAuthResult {
        success: true,
        session: None,
        error: None,
        redirect_url: Some(auth_url),
    })
}

/// Handle SSO callback
#[tauri::command]
pub async fn sso_handle_callback(
    state: State<'_, SSOServiceState>,
    provider_id: String,
    _code: String,
    _state_param: Option<String>,
) -> Result<SSOAuthResult, String> {
    println!("🔐 [SSO] Handling callback for provider: {}", provider_id);
    
    // Exchange code for tokens (placeholder - would call actual OAuth endpoints)
    let session = SSOSession {
        id: format!("sess_{}", uuid::Uuid::new_v4()),
        user_id: format!("user_{}", uuid::Uuid::new_v4()),
        provider_id: provider_id.clone(),
        email: "user@enterprise.com".to_string(),
        name: "Enterprise User".to_string(),
        roles: vec!["admin".to_string(), "user".to_string()],
        groups: vec!["engineering".to_string()],
        access_token: format!("at_{}", uuid::Uuid::new_v4()),
        refresh_token: Some(format!("rt_{}", uuid::Uuid::new_v4())),
        expires_at: chrono::Utc::now().timestamp() + 3600,
        created_at: chrono::Utc::now().timestamp(),
    };
    
    // Store session
    let mut sessions = state.sessions.write().await;
    sessions.push(session.clone());
    
    Ok(SSOAuthResult {
        success: true,
        session: Some(session),
        error: None,
        redirect_url: None,
    })
}

/// Validate SSO session
#[tauri::command]
pub async fn sso_validate_session(
    state: State<'_, SSOServiceState>,
    session_id: String,
) -> Result<bool, String> {
    let sessions = state.sessions.read().await;
    let session = sessions.iter().find(|s| s.id == session_id);
    
    match session {
        Some(s) => {
            let now = chrono::Utc::now().timestamp();
            Ok(s.expires_at > now)
        }
        None => Ok(false),
    }
}

/// Logout from SSO
#[tauri::command]
pub async fn sso_logout(
    state: State<'_, SSOServiceState>,
    session_id: String,
) -> Result<(), String> {
    println!("🔐 [SSO] Logging out session: {}", session_id);
    
    let mut sessions = state.sessions.write().await;
    sessions.retain(|s| s.id != session_id);
    
    Ok(())
}

// ============================================
// Multi-Tenant Service Commands
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tenant {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub plan: String, // "starter" | "professional" | "enterprise" | "unlimited"
    pub status: String, // "active" | "suspended" | "pending"
    pub owner_id: String,
    pub settings: TenantSettings,
    pub limits: TenantLimits,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantSettings {
    pub custom_domain: Option<String>,
    pub logo_url: Option<String>,
    pub primary_color: Option<String>,
    pub sso_enabled: bool,
    pub mfa_required: bool,
    pub ip_whitelist: Vec<String>,
    pub allowed_email_domains: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantLimits {
    pub max_users: i32,
    pub max_storage_gb: i32,
    pub max_api_calls_per_month: i64,
    pub max_workflows: i32,
    pub max_automations: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantMember {
    pub id: String,
    pub tenant_id: String,
    pub user_id: String,
    pub email: String,
    pub role: String, // "owner" | "admin" | "member" | "viewer"
    pub status: String, // "active" | "pending" | "suspended"
    pub joined_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantInvitation {
    pub id: String,
    pub tenant_id: String,
    pub email: String,
    pub role: String,
    pub token: String,
    pub expires_at: i64,
    pub created_at: i64,
}

/// State for Multi-Tenant service
pub struct MultiTenantServiceState {
    pub tenants: Arc<RwLock<Vec<Tenant>>>,
    pub members: Arc<RwLock<Vec<TenantMember>>>,
    pub invitations: Arc<RwLock<Vec<TenantInvitation>>>,
}

impl Default for MultiTenantServiceState {
    fn default() -> Self {
        Self {
            tenants: Arc::new(RwLock::new(Vec::new())),
            members: Arc::new(RwLock::new(Vec::new())),
            invitations: Arc::new(RwLock::new(Vec::new())),
        }
    }
}

/// Create a new tenant (Enterprise Services)
#[tauri::command]
pub async fn enterprise_tenant_create(
    state: State<'_, MultiTenantServiceState>,
    name: String,
    slug: String,
    owner_id: String,
    plan: String,
) -> Result<Tenant, String> {
    println!("🏢 [TENANT] Creating tenant: {}", name);
    
    let tenant = Tenant {
        id: format!("tenant_{}", uuid::Uuid::new_v4()),
        name,
        slug,
        plan: plan.clone(),
        status: "active".to_string(),
        owner_id: owner_id.clone(),
        settings: TenantSettings {
            custom_domain: None,
            logo_url: None,
            primary_color: None,
            sso_enabled: plan == "enterprise" || plan == "unlimited",
            mfa_required: false,
            ip_whitelist: Vec::new(),
            allowed_email_domains: Vec::new(),
        },
        limits: get_plan_limits(&plan),
        created_at: chrono::Utc::now().timestamp(),
        updated_at: chrono::Utc::now().timestamp(),
    };
    
    let mut tenants = state.tenants.write().await;
    tenants.push(tenant.clone());
    
    // Auto-add owner as member
    let member = TenantMember {
        id: format!("member_{}", uuid::Uuid::new_v4()),
        tenant_id: tenant.id.clone(),
        user_id: owner_id,
        email: "owner@company.com".to_string(),
        role: "owner".to_string(),
        status: "active".to_string(),
        joined_at: chrono::Utc::now().timestamp(),
    };
    
    let mut members = state.members.write().await;
    members.push(member);
    
    Ok(tenant)
}

fn get_plan_limits(plan: &str) -> TenantLimits {
    match plan {
        "starter" => TenantLimits {
            max_users: 5,
            max_storage_gb: 10,
            max_api_calls_per_month: 10000,
            max_workflows: 10,
            max_automations: 50,
        },
        "professional" => TenantLimits {
            max_users: 25,
            max_storage_gb: 100,
            max_api_calls_per_month: 100000,
            max_workflows: 100,
            max_automations: 500,
        },
        "enterprise" => TenantLimits {
            max_users: 500,
            max_storage_gb: 1000,
            max_api_calls_per_month: 1000000,
            max_workflows: 1000,
            max_automations: 5000,
        },
        "unlimited" => TenantLimits {
            max_users: -1,
            max_storage_gb: -1,
            max_api_calls_per_month: -1,
            max_workflows: -1,
            max_automations: -1,
        },
        _ => TenantLimits {
            max_users: 1,
            max_storage_gb: 1,
            max_api_calls_per_month: 1000,
            max_workflows: 5,
            max_automations: 10,
        },
    }
}

/// Get tenant by ID (Enterprise Services)
#[tauri::command]
pub async fn enterprise_tenant_get(
    state: State<'_, MultiTenantServiceState>,
    tenant_id: String,
) -> Result<Tenant, String> {
    let tenants = state.tenants.read().await;
    tenants.iter()
        .find(|t| t.id == tenant_id)
        .cloned()
        .ok_or("Tenant not found".to_string())
}

/// List all tenants for a user
#[tauri::command]
pub async fn tenant_list_for_user(
    state: State<'_, MultiTenantServiceState>,
    user_id: String,
) -> Result<Vec<Tenant>, String> {
    let members = state.members.read().await;
    let user_tenant_ids: Vec<String> = members.iter()
        .filter(|m| m.user_id == user_id && m.status == "active")
        .map(|m| m.tenant_id.clone())
        .collect();
    
    let tenants = state.tenants.read().await;
    let user_tenants: Vec<Tenant> = tenants.iter()
        .filter(|t| user_tenant_ids.contains(&t.id))
        .cloned()
        .collect();
    
    Ok(user_tenants)
}

/// Update tenant settings (Enterprise Services)
#[tauri::command]
pub async fn enterprise_tenant_update_settings(
    state: State<'_, MultiTenantServiceState>,
    tenant_id: String,
    settings: TenantSettings,
) -> Result<Tenant, String> {
    println!("🏢 [TENANT] Updating settings for: {}", tenant_id);
    
    let mut tenants = state.tenants.write().await;
    let tenant = tenants.iter_mut()
        .find(|t| t.id == tenant_id)
        .ok_or("Tenant not found")?;
    
    tenant.settings = settings;
    tenant.updated_at = chrono::Utc::now().timestamp();
    
    Ok(tenant.clone())
}

/// Invite user to tenant
#[tauri::command]
pub async fn tenant_invite_user(
    state: State<'_, MultiTenantServiceState>,
    tenant_id: String,
    email: String,
    role: String,
) -> Result<TenantInvitation, String> {
    println!("🏢 [TENANT] Inviting {} to tenant {}", email, tenant_id);
    
    let invitation = TenantInvitation {
        id: format!("inv_{}", uuid::Uuid::new_v4()),
        tenant_id,
        email,
        role,
        token: format!("token_{}", uuid::Uuid::new_v4()),
        expires_at: chrono::Utc::now().timestamp() + 604800, // 7 days
        created_at: chrono::Utc::now().timestamp(),
    };
    
    let mut invitations = state.invitations.write().await;
    invitations.push(invitation.clone());
    
    Ok(invitation)
}

/// Accept tenant invitation
#[tauri::command]
pub async fn tenant_accept_invitation(
    state: State<'_, MultiTenantServiceState>,
    token: String,
    user_id: String,
) -> Result<TenantMember, String> {
    println!("🏢 [TENANT] Accepting invitation with token");
    
    let mut invitations = state.invitations.write().await;
    let invitation_idx = invitations.iter()
        .position(|i| i.token == token && i.expires_at > chrono::Utc::now().timestamp())
        .ok_or("Invalid or expired invitation")?;
    
    let invitation = invitations.remove(invitation_idx);
    
    let member = TenantMember {
        id: format!("member_{}", uuid::Uuid::new_v4()),
        tenant_id: invitation.tenant_id,
        user_id,
        email: invitation.email,
        role: invitation.role,
        status: "active".to_string(),
        joined_at: chrono::Utc::now().timestamp(),
    };
    
    let mut members = state.members.write().await;
    members.push(member.clone());
    
    Ok(member)
}

/// List tenant members
#[tauri::command]
pub async fn tenant_list_members(
    state: State<'_, MultiTenantServiceState>,
    tenant_id: String,
) -> Result<Vec<TenantMember>, String> {
    let members = state.members.read().await;
    let tenant_members: Vec<TenantMember> = members.iter()
        .filter(|m| m.tenant_id == tenant_id)
        .cloned()
        .collect();
    
    Ok(tenant_members)
}

/// Remove member from tenant
#[tauri::command]
pub async fn tenant_remove_member(
    state: State<'_, MultiTenantServiceState>,
    tenant_id: String,
    user_id: String,
) -> Result<(), String> {
    println!("🏢 [TENANT] Removing member {} from tenant {}", user_id, tenant_id);
    
    let mut members = state.members.write().await;
    members.retain(|m| !(m.tenant_id == tenant_id && m.user_id == user_id));
    
    Ok(())
}

// ============================================
// Payment Service Commands
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentCustomer {
    pub id: String,
    pub user_id: String,
    pub email: String,
    pub name: String,
    pub stripe_customer_id: Option<String>,
    pub default_payment_method: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subscription {
    pub id: String,
    pub customer_id: String,
    pub plan_id: String,
    pub status: String, // "active" | "past_due" | "canceled" | "trialing"
    pub current_period_start: i64,
    pub current_period_end: i64,
    pub cancel_at_period_end: bool,
    pub trial_end: Option<i64>,
    pub stripe_subscription_id: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentPlan {
    pub id: String,
    pub name: String,
    pub description: String,
    pub amount: i64, // In cents
    pub currency: String,
    pub interval: String, // "month" | "year"
    pub features: Vec<String>,
    pub stripe_price_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub id: String,
    pub customer_id: String,
    pub subscription_id: Option<String>,
    pub amount: i64,
    pub currency: String,
    pub status: String, // "draft" | "open" | "paid" | "void" | "uncollectible"
    pub due_date: Option<i64>,
    pub paid_at: Option<i64>,
    pub stripe_invoice_id: Option<String>,
    pub pdf_url: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentMethod {
    pub id: String,
    pub customer_id: String,
    pub method_type: String, // "card" | "bank_account" | "paypal"
    pub last_four: Option<String>,
    pub brand: Option<String>,
    pub exp_month: Option<i32>,
    pub exp_year: Option<i32>,
    pub is_default: bool,
    pub stripe_payment_method_id: Option<String>,
}

/// State for Payment service
pub struct PaymentServiceState {
    pub customers: Arc<RwLock<Vec<PaymentCustomer>>>,
    pub subscriptions: Arc<RwLock<Vec<Subscription>>>,
    pub plans: Arc<RwLock<Vec<PaymentPlan>>>,
    pub invoices: Arc<RwLock<Vec<Invoice>>>,
    pub payment_methods: Arc<RwLock<Vec<PaymentMethod>>>,
}

impl Default for PaymentServiceState {
    fn default() -> Self {
        let default_plans = vec![
            PaymentPlan {
                id: "plan_starter".to_string(),
                name: "Starter".to_string(),
                description: "For individuals and small teams".to_string(),
                amount: 2900, // $29/month
                currency: "usd".to_string(),
                interval: "month".to_string(),
                features: vec![
                    "5 team members".to_string(),
                    "10 GB storage".to_string(),
                    "10,000 API calls/month".to_string(),
                    "Email support".to_string(),
                ],
                stripe_price_id: None,
            },
            PaymentPlan {
                id: "plan_professional".to_string(),
                name: "Professional".to_string(),
                description: "For growing businesses".to_string(),
                amount: 9900, // $99/month
                currency: "usd".to_string(),
                interval: "month".to_string(),
                features: vec![
                    "25 team members".to_string(),
                    "100 GB storage".to_string(),
                    "100,000 API calls/month".to_string(),
                    "Priority support".to_string(),
                    "SSO integration".to_string(),
                ],
                stripe_price_id: None,
            },
            PaymentPlan {
                id: "plan_enterprise".to_string(),
                name: "Enterprise".to_string(),
                description: "For large organizations".to_string(),
                amount: 49900, // $499/month
                currency: "usd".to_string(),
                interval: "month".to_string(),
                features: vec![
                    "Unlimited team members".to_string(),
                    "1 TB storage".to_string(),
                    "Unlimited API calls".to_string(),
                    "24/7 dedicated support".to_string(),
                    "SSO & LDAP".to_string(),
                    "Custom integrations".to_string(),
                    "SLA guarantee".to_string(),
                ],
                stripe_price_id: None,
            },
        ];
        
        Self {
            customers: Arc::new(RwLock::new(Vec::new())),
            subscriptions: Arc::new(RwLock::new(Vec::new())),
            plans: Arc::new(RwLock::new(default_plans)),
            invoices: Arc::new(RwLock::new(Vec::new())),
            payment_methods: Arc::new(RwLock::new(Vec::new())),
        }
    }
}

/// Create a payment customer
#[tauri::command]
pub async fn payment_create_customer(
    state: State<'_, PaymentServiceState>,
    user_id: String,
    email: String,
    name: String,
) -> Result<PaymentCustomer, String> {
    println!("💳 [PAYMENT] Creating customer for: {}", email);
    
    let customer = PaymentCustomer {
        id: format!("cus_{}", uuid::Uuid::new_v4()),
        user_id,
        email,
        name,
        stripe_customer_id: None,
        default_payment_method: None,
        created_at: chrono::Utc::now().timestamp(),
    };
    
    let mut customers = state.customers.write().await;
    customers.push(customer.clone());
    
    Ok(customer)
}

/// Get customer by user ID
#[tauri::command]
pub async fn payment_get_customer(
    state: State<'_, PaymentServiceState>,
    user_id: String,
) -> Result<PaymentCustomer, String> {
    let customers = state.customers.read().await;
    customers.iter()
        .find(|c| c.user_id == user_id)
        .cloned()
        .ok_or("Customer not found".to_string())
}

/// List available plans
#[tauri::command]
pub async fn payment_list_plans(
    state: State<'_, PaymentServiceState>,
) -> Result<Vec<PaymentPlan>, String> {
    let plans = state.plans.read().await;
    Ok(plans.clone())
}

/// Create a subscription
#[tauri::command]
pub async fn payment_create_subscription(
    state: State<'_, PaymentServiceState>,
    customer_id: String,
    plan_id: String,
    trial_days: Option<i32>,
) -> Result<Subscription, String> {
    println!("💳 [PAYMENT] Creating subscription for customer: {}", customer_id);
    
    let now = chrono::Utc::now().timestamp();
    let trial_end = trial_days.map(|days| now + (days as i64 * 86400));
    
    let subscription = Subscription {
        id: format!("sub_{}", uuid::Uuid::new_v4()),
        customer_id,
        plan_id,
        status: if trial_end.is_some() { "trialing".to_string() } else { "active".to_string() },
        current_period_start: now,
        current_period_end: now + 2592000, // 30 days
        cancel_at_period_end: false,
        trial_end,
        stripe_subscription_id: None,
        created_at: now,
    };
    
    let mut subscriptions = state.subscriptions.write().await;
    subscriptions.push(subscription.clone());
    
    Ok(subscription)
}

/// Get subscription by customer ID
#[tauri::command]
pub async fn payment_get_subscription(
    state: State<'_, PaymentServiceState>,
    customer_id: String,
) -> Result<Subscription, String> {
    let subscriptions = state.subscriptions.read().await;
    subscriptions.iter()
        .find(|s| s.customer_id == customer_id && s.status != "canceled")
        .cloned()
        .ok_or("No active subscription found".to_string())
}

/// Cancel subscription
#[tauri::command]
pub async fn payment_cancel_subscription(
    state: State<'_, PaymentServiceState>,
    subscription_id: String,
    immediate: bool,
) -> Result<Subscription, String> {
    println!("💳 [PAYMENT] Canceling subscription: {}", subscription_id);
    
    let mut subscriptions = state.subscriptions.write().await;
    let subscription = subscriptions.iter_mut()
        .find(|s| s.id == subscription_id)
        .ok_or("Subscription not found")?;
    
    if immediate {
        subscription.status = "canceled".to_string();
    } else {
        subscription.cancel_at_period_end = true;
    }
    
    Ok(subscription.clone())
}

/// Add payment method
#[tauri::command]
pub async fn payment_add_method(
    state: State<'_, PaymentServiceState>,
    customer_id: String,
    method_type: String,
    last_four: Option<String>,
    brand: Option<String>,
    exp_month: Option<i32>,
    exp_year: Option<i32>,
) -> Result<PaymentMethod, String> {
    println!("💳 [PAYMENT] Adding payment method for customer: {}", customer_id);
    
    let methods = state.payment_methods.read().await;
    let is_first = !methods.iter().any(|m| m.customer_id == customer_id);
    drop(methods);
    
    let method = PaymentMethod {
        id: format!("pm_{}", uuid::Uuid::new_v4()),
        customer_id,
        method_type,
        last_four,
        brand,
        exp_month,
        exp_year,
        is_default: is_first,
        stripe_payment_method_id: None,
    };
    
    let mut methods = state.payment_methods.write().await;
    methods.push(method.clone());
    
    Ok(method)
}

/// List payment methods
#[tauri::command]
pub async fn payment_list_methods(
    state: State<'_, PaymentServiceState>,
    customer_id: String,
) -> Result<Vec<PaymentMethod>, String> {
    let methods = state.payment_methods.read().await;
    let customer_methods: Vec<PaymentMethod> = methods.iter()
        .filter(|m| m.customer_id == customer_id)
        .cloned()
        .collect();
    
    Ok(customer_methods)
}

/// List invoices
#[tauri::command]
pub async fn payment_list_invoices(
    state: State<'_, PaymentServiceState>,
    customer_id: String,
) -> Result<Vec<Invoice>, String> {
    let invoices = state.invoices.read().await;
    let customer_invoices: Vec<Invoice> = invoices.iter()
        .filter(|i| i.customer_id == customer_id)
        .cloned()
        .collect();
    
    Ok(customer_invoices)
}

// ============================================
// Audit Logging Service Commands
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEvent {
    pub id: String,
    pub tenant_id: Option<String>,
    pub user_id: String,
    pub action: String,
    pub resource_type: String,
    pub resource_id: Option<String>,
    pub category: String, // "authentication" | "data_access" | "security" | "admin" | "billing"
    pub severity: String, // "info" | "warning" | "critical"
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub details: serde_json::Value,
    pub compliance_tags: Vec<String>, // ["SOC2", "GDPR", "HIPAA", "PCI_DSS"]
    pub hash: String,
    pub previous_hash: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditQuery {
    pub tenant_id: Option<String>,
    pub user_id: Option<String>,
    pub action: Option<String>,
    pub resource_type: Option<String>,
    pub category: Option<String>,
    pub severity: Option<String>,
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub compliance_tag: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditReport {
    pub id: String,
    pub name: String,
    pub description: String,
    pub query: AuditQuery,
    pub generated_at: i64,
    pub total_events: i64,
    pub events_by_category: serde_json::Value,
    pub events_by_severity: serde_json::Value,
    pub top_users: Vec<(String, i64)>,
    pub top_actions: Vec<(String, i64)>,
}

/// State for Audit Logging service
pub struct AuditServiceState {
    pub events: Arc<RwLock<Vec<AuditEvent>>>,
    pub last_hash: Arc<RwLock<Option<String>>>,
}

impl Default for AuditServiceState {
    fn default() -> Self {
        Self {
            events: Arc::new(RwLock::new(Vec::new())),
            last_hash: Arc::new(RwLock::new(None)),
        }
    }
}

/// Log an audit event
#[tauri::command]
pub async fn audit_log_event(
    state: State<'_, AuditServiceState>,
    tenant_id: Option<String>,
    user_id: String,
    action: String,
    resource_type: String,
    resource_id: Option<String>,
    category: String,
    severity: String,
    ip_address: Option<String>,
    user_agent: Option<String>,
    details: serde_json::Value,
    compliance_tags: Vec<String>,
) -> Result<AuditEvent, String> {
    println!("📋 [AUDIT] Logging event: {} by user {}", action, user_id);
    
    let mut last_hash = state.last_hash.write().await;
    let previous_hash = last_hash.clone();
    
    let event_data = format!(
        "{}:{}:{}:{}:{}:{}",
        user_id, action, resource_type, category, 
        chrono::Utc::now().timestamp(),
        previous_hash.clone().unwrap_or_default()
    );
    
    let hash = format!("{:x}", md5::compute(event_data.as_bytes()));
    *last_hash = Some(hash.clone());
    
    let event = AuditEvent {
        id: format!("audit_{}", uuid::Uuid::new_v4()),
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        category,
        severity,
        ip_address,
        user_agent,
        details,
        compliance_tags,
        hash,
        previous_hash,
        created_at: chrono::Utc::now().timestamp(),
    };
    
    let mut events = state.events.write().await;
    events.push(event.clone());
    
    Ok(event)
}

/// Query audit events
#[tauri::command]
pub async fn audit_query_events(
    state: State<'_, AuditServiceState>,
    query: AuditQuery,
) -> Result<Vec<AuditEvent>, String> {
    let events = state.events.read().await;
    
    let filtered: Vec<AuditEvent> = events.iter()
        .filter(|e| {
            if let Some(ref tenant_id) = query.tenant_id {
                if e.tenant_id.as_ref() != Some(tenant_id) {
                    return false;
                }
            }
            if let Some(ref user_id) = query.user_id {
                if &e.user_id != user_id {
                    return false;
                }
            }
            if let Some(ref action) = query.action {
                if &e.action != action {
                    return false;
                }
            }
            if let Some(ref category) = query.category {
                if &e.category != category {
                    return false;
                }
            }
            if let Some(ref severity) = query.severity {
                if &e.severity != severity {
                    return false;
                }
            }
            if let Some(start) = query.start_date {
                if e.created_at < start {
                    return false;
                }
            }
            if let Some(end) = query.end_date {
                if e.created_at > end {
                    return false;
                }
            }
            if let Some(ref tag) = query.compliance_tag {
                if !e.compliance_tags.contains(tag) {
                    return false;
                }
            }
            true
        })
        .cloned()
        .collect();
    
    let offset = query.offset.unwrap_or(0) as usize;
    let limit = query.limit.unwrap_or(100) as usize;
    
    Ok(filtered.into_iter().skip(offset).take(limit).collect())
}

/// Verify audit chain integrity
#[tauri::command]
pub async fn audit_verify_chain(
    state: State<'_, AuditServiceState>,
    start_id: Option<String>,
    end_id: Option<String>,
) -> Result<bool, String> {
    println!("📋 [AUDIT] Verifying chain integrity");
    
    let events = state.events.read().await;
    
    let start_idx = if let Some(ref id) = start_id {
        events.iter().position(|e| e.id == *id).unwrap_or(0)
    } else {
        0
    };
    
    let end_idx = if let Some(ref id) = end_id {
        events.iter().position(|e| e.id == *id).unwrap_or(events.len())
    } else {
        events.len()
    };
    
    for i in (start_idx + 1)..end_idx {
        let current = &events[i];
        let previous = &events[i - 1];
        
        if current.previous_hash.as_ref() != Some(&previous.hash) {
            println!("📋 [AUDIT] Chain broken at event: {}", current.id);
            return Ok(false);
        }
    }
    
    Ok(true)
}

/// Generate audit report
#[tauri::command]
pub async fn audit_generate_report(
    state: State<'_, AuditServiceState>,
    name: String,
    description: String,
    query: AuditQuery,
) -> Result<AuditReport, String> {
    println!("📋 [AUDIT] Generating report: {}", name);
    
    let events = state.events.read().await;
    
    // Filter events based on query
    let filtered: Vec<&AuditEvent> = events.iter()
        .filter(|e| {
            if let Some(ref tenant_id) = query.tenant_id {
                if e.tenant_id.as_ref() != Some(tenant_id) {
                    return false;
                }
            }
            if let Some(start) = query.start_date {
                if e.created_at < start {
                    return false;
                }
            }
            if let Some(end) = query.end_date {
                if e.created_at > end {
                    return false;
                }
            }
            true
        })
        .collect();
    
    // Count by category
    let mut by_category: std::collections::HashMap<String, i64> = std::collections::HashMap::new();
    let mut by_severity: std::collections::HashMap<String, i64> = std::collections::HashMap::new();
    let mut by_user: std::collections::HashMap<String, i64> = std::collections::HashMap::new();
    let mut by_action: std::collections::HashMap<String, i64> = std::collections::HashMap::new();
    
    for event in &filtered {
        *by_category.entry(event.category.clone()).or_insert(0) += 1;
        *by_severity.entry(event.severity.clone()).or_insert(0) += 1;
        *by_user.entry(event.user_id.clone()).or_insert(0) += 1;
        *by_action.entry(event.action.clone()).or_insert(0) += 1;
    }
    
    let mut top_users: Vec<(String, i64)> = by_user.into_iter().collect();
    top_users.sort_by(|a, b| b.1.cmp(&a.1));
    top_users.truncate(10);
    
    let mut top_actions: Vec<(String, i64)> = by_action.into_iter().collect();
    top_actions.sort_by(|a, b| b.1.cmp(&a.1));
    top_actions.truncate(10);
    
    let report = AuditReport {
        id: format!("report_{}", uuid::Uuid::new_v4()),
        name,
        description,
        query,
        generated_at: chrono::Utc::now().timestamp(),
        total_events: filtered.len() as i64,
        events_by_category: serde_json::to_value(by_category).unwrap_or_default(),
        events_by_severity: serde_json::to_value(by_severity).unwrap_or_default(),
        top_users,
        top_actions,
    };
    
    Ok(report)
}

/// Export audit events (for compliance)
#[tauri::command]
pub async fn audit_export_events(
    state: State<'_, AuditServiceState>,
    query: AuditQuery,
    format: String, // "json" | "csv"
) -> Result<String, String> {
    println!("📋 [AUDIT] Exporting events in {} format", format);
    
    let events = state.events.read().await;
    
    let filtered: Vec<&AuditEvent> = events.iter()
        .filter(|e| {
            if let Some(ref tenant_id) = query.tenant_id {
                if e.tenant_id.as_ref() != Some(tenant_id) {
                    return false;
                }
            }
            if let Some(start) = query.start_date {
                if e.created_at < start {
                    return false;
                }
            }
            if let Some(end) = query.end_date {
                if e.created_at > end {
                    return false;
                }
            }
            true
        })
        .collect();
    
    match format.as_str() {
        "json" => {
            serde_json::to_string_pretty(&filtered)
                .map_err(|e| format!("JSON serialization error: {}", e))
        }
        "csv" => {
            let mut csv = String::from("id,tenant_id,user_id,action,resource_type,category,severity,created_at\n");
            for event in filtered {
                csv.push_str(&format!(
                    "{},{},{},{},{},{},{},{}\n",
                    event.id,
                    event.tenant_id.clone().unwrap_or_default(),
                    event.user_id,
                    event.action,
                    event.resource_type,
                    event.category,
                    event.severity,
                    event.created_at
                ));
            }
            Ok(csv)
        }
        _ => Err("Unsupported format. Use 'json' or 'csv'".to_string()),
    }
}
