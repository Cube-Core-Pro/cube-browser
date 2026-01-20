// CUBE Nexum - SuperAdmin Billing & API Commands
// Part 5: Billing, Subscriptions, and API Management Backend

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use tauri::State;

// =============================================================================
// STATE
// =============================================================================

pub struct SuperAdminBillingState {
    pub subscriptions: RwLock<HashMap<String, Subscription>>,
    pub invoices: RwLock<Vec<Invoice>>,
    pub api_keys: RwLock<Vec<APIKey>>,
    pub webhooks: RwLock<Vec<WebhookConfig>>,
}

impl Default for SuperAdminBillingState {
    fn default() -> Self {
        let mut subscriptions = HashMap::new();
        
        subscriptions.insert("org-1".to_string(), Subscription {
            id: "sub-1".to_string(),
            organization_id: "org-1".to_string(),
            plan: Plan {
                id: "enterprise".to_string(),
                name: "Enterprise".to_string(),
                tier: "enterprise".to_string(),
                price_monthly: 499.0,
                price_yearly: 4990.0,
                features: vec![
                    "Unlimited users".to_string(),
                    "Unlimited storage".to_string(),
                    "Priority support".to_string(),
                    "Custom integrations".to_string(),
                    "SLA guarantee".to_string(),
                    "Dedicated account manager".to_string(),
                ],
                limits: PlanLimits {
                    max_users: 0,
                    max_storage_gb: 0,
                    max_api_calls: 0,
                    max_integrations: 0,
                },
            },
            status: "active".to_string(),
            billing_cycle: "yearly".to_string(),
            current_period_start: "2026-01-01T00:00:00Z".to_string(),
            current_period_end: "2027-01-01T00:00:00Z".to_string(),
            seats: SubscriptionSeats {
                total: 100,
                used: 4,
                price_per_seat: 25.0,
            },
            payment_method: Some(PaymentMethod {
                id: "pm-1".to_string(),
                method_type: "card".to_string(),
                last_four: "4242".to_string(),
                brand: Some("Visa".to_string()),
                expiry_month: Some(12),
                expiry_year: Some(2027),
                is_default: true,
            }),
            auto_renew: true,
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2026-01-01T00:00:00Z".to_string(),
        });

        let invoices = vec![
            Invoice {
                id: "inv-1".to_string(),
                organization_id: "org-1".to_string(),
                subscription_id: "sub-1".to_string(),
                number: "INV-2026-001".to_string(),
                status: "paid".to_string(),
                amount: 4990.0,
                currency: "USD".to_string(),
                tax: 0.0,
                total: 4990.0,
                period_start: "2026-01-01T00:00:00Z".to_string(),
                period_end: "2027-01-01T00:00:00Z".to_string(),
                due_date: "2026-01-15T00:00:00Z".to_string(),
                paid_at: Some("2026-01-02T00:00:00Z".to_string()),
                pdf_url: Some("/invoices/INV-2026-001.pdf".to_string()),
                line_items: vec![
                    InvoiceLineItem {
                        description: "Enterprise Plan (Yearly)".to_string(),
                        quantity: 1,
                        unit_price: 4990.0,
                        total: 4990.0,
                    },
                ],
                created_at: "2026-01-01T00:00:00Z".to_string(),
            },
            Invoice {
                id: "inv-0".to_string(),
                organization_id: "org-1".to_string(),
                subscription_id: "sub-1".to_string(),
                number: "INV-2025-012".to_string(),
                status: "paid".to_string(),
                amount: 4990.0,
                currency: "USD".to_string(),
                tax: 0.0,
                total: 4990.0,
                period_start: "2025-01-01T00:00:00Z".to_string(),
                period_end: "2026-01-01T00:00:00Z".to_string(),
                due_date: "2025-01-15T00:00:00Z".to_string(),
                paid_at: Some("2025-01-03T00:00:00Z".to_string()),
                pdf_url: Some("/invoices/INV-2025-012.pdf".to_string()),
                line_items: vec![
                    InvoiceLineItem {
                        description: "Enterprise Plan (Yearly)".to_string(),
                        quantity: 1,
                        unit_price: 4990.0,
                        total: 4990.0,
                    },
                ],
                created_at: "2025-01-01T00:00:00Z".to_string(),
            },
        ];

        let api_keys = vec![
            APIKey {
                id: "key-1".to_string(),
                name: "Production API Key".to_string(),
                key_prefix: "sk_live_".to_string(),
                key_hash: "***************".to_string(),
                scopes: vec![
                    "users:read".to_string(),
                    "teams:read".to_string(),
                    "data:read".to_string(),
                ],
                rate_limit: 1000,
                ip_restrictions: vec![],
                expires_at: None,
                last_used_at: Some("2026-01-13T10:00:00Z".to_string()),
                created_at: "2025-06-01T00:00:00Z".to_string(),
                created_by: "user-1".to_string(),
                status: "active".to_string(),
            },
            APIKey {
                id: "key-2".to_string(),
                name: "Development API Key".to_string(),
                key_prefix: "sk_test_".to_string(),
                key_hash: "***************".to_string(),
                scopes: vec!["*".to_string()],
                rate_limit: 100,
                ip_restrictions: vec![],
                expires_at: Some("2026-12-31T23:59:59Z".to_string()),
                last_used_at: Some("2026-01-12T15:00:00Z".to_string()),
                created_at: "2025-01-01T00:00:00Z".to_string(),
                created_by: "user-1".to_string(),
                status: "active".to_string(),
            },
        ];

        let webhooks = vec![
            WebhookConfig {
                id: "wh-1".to_string(),
                name: "User Events Webhook".to_string(),
                url: "https://api.example.com/webhooks/users".to_string(),
                events: vec![
                    "user.created".to_string(),
                    "user.updated".to_string(),
                    "user.deleted".to_string(),
                ],
                secret_set: true,
                enabled: true,
                retry_policy: RetryPolicy {
                    max_retries: 3,
                    initial_delay_ms: 1000,
                    max_delay_ms: 60000,
                },
                last_triggered_at: Some("2026-01-13T09:00:00Z".to_string()),
                last_status: Some("success".to_string()),
                created_at: "2025-03-01T00:00:00Z".to_string(),
            },
            WebhookConfig {
                id: "wh-2".to_string(),
                name: "Billing Events Webhook".to_string(),
                url: "https://api.example.com/webhooks/billing".to_string(),
                events: vec![
                    "subscription.created".to_string(),
                    "subscription.updated".to_string(),
                    "invoice.paid".to_string(),
                    "invoice.failed".to_string(),
                ],
                secret_set: true,
                enabled: true,
                retry_policy: RetryPolicy {
                    max_retries: 5,
                    initial_delay_ms: 2000,
                    max_delay_ms: 120000,
                },
                last_triggered_at: Some("2026-01-02T00:00:00Z".to_string()),
                last_status: Some("success".to_string()),
                created_at: "2025-06-01T00:00:00Z".to_string(),
            },
        ];

        Self {
            subscriptions: RwLock::new(subscriptions),
            invoices: RwLock::new(invoices),
            api_keys: RwLock::new(api_keys),
            webhooks: RwLock::new(webhooks),
        }
    }
}

// =============================================================================
// TYPES
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subscription {
    pub id: String,
    pub organization_id: String,
    pub plan: Plan,
    pub status: String,
    pub billing_cycle: String,
    pub current_period_start: String,
    pub current_period_end: String,
    pub seats: SubscriptionSeats,
    pub payment_method: Option<PaymentMethod>,
    pub auto_renew: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plan {
    pub id: String,
    pub name: String,
    pub tier: String,
    pub price_monthly: f64,
    pub price_yearly: f64,
    pub features: Vec<String>,
    pub limits: PlanLimits,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanLimits {
    pub max_users: u32,
    pub max_storage_gb: u32,
    pub max_api_calls: u32,
    pub max_integrations: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionSeats {
    pub total: u32,
    pub used: u32,
    pub price_per_seat: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentMethod {
    pub id: String,
    #[serde(rename = "type")]
    pub method_type: String,
    pub last_four: String,
    pub brand: Option<String>,
    pub expiry_month: Option<u32>,
    pub expiry_year: Option<u32>,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub id: String,
    pub organization_id: String,
    pub subscription_id: String,
    pub number: String,
    pub status: String,
    pub amount: f64,
    pub currency: String,
    pub tax: f64,
    pub total: f64,
    pub period_start: String,
    pub period_end: String,
    pub due_date: String,
    pub paid_at: Option<String>,
    pub pdf_url: Option<String>,
    pub line_items: Vec<InvoiceLineItem>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvoiceLineItem {
    pub description: String,
    pub quantity: u32,
    pub unit_price: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct APIKey {
    pub id: String,
    pub name: String,
    pub key_prefix: String,
    pub key_hash: String,
    pub scopes: Vec<String>,
    pub rate_limit: u32,
    pub ip_restrictions: Vec<String>,
    pub expires_at: Option<String>,
    pub last_used_at: Option<String>,
    pub created_at: String,
    pub created_by: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookConfig {
    pub id: String,
    pub name: String,
    pub url: String,
    pub events: Vec<String>,
    pub secret_set: bool,
    pub enabled: bool,
    pub retry_policy: RetryPolicy,
    pub last_triggered_at: Option<String>,
    pub last_status: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryPolicy {
    pub max_retries: u32,
    pub initial_delay_ms: u32,
    pub max_delay_ms: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAPIKeyResult {
    pub api_key: APIKey,
    pub secret: String,
}

// =============================================================================
// BILLING COMMANDS
// =============================================================================

#[tauri::command]
pub async fn sa_get_subscription(
    state: State<'_, SuperAdminBillingState>,
    organization_id: String,
) -> Result<Subscription, String> {
    let subs_lock = state.subscriptions.read().map_err(|e| format!("Lock error: {}", e))?;
    
    subs_lock.get(&organization_id)
        .cloned()
        .ok_or_else(|| format!("Subscription not found for org: {}", organization_id))
}

#[tauri::command]
pub async fn sa_update_subscription(
    state: State<'_, SuperAdminBillingState>,
    organization_id: String,
    plan_id: Option<String>,
    billing_cycle: Option<String>,
    seats: Option<u32>,
    auto_renew: Option<bool>,
) -> Result<Subscription, String> {
    let mut subs_lock = state.subscriptions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let sub = subs_lock.get_mut(&organization_id)
        .ok_or_else(|| format!("Subscription not found for org: {}", organization_id))?;
    
    if let Some(plan) = plan_id {
        sub.plan.id = plan.clone();
        sub.plan.name = match plan.as_str() {
            "starter" => "Starter".to_string(),
            "pro" => "Professional".to_string(),
            "enterprise" => "Enterprise".to_string(),
            _ => plan,
        };
    }
    if let Some(cycle) = billing_cycle {
        sub.billing_cycle = cycle;
    }
    if let Some(total_seats) = seats {
        sub.seats.total = total_seats;
    }
    if let Some(renew) = auto_renew {
        sub.auto_renew = renew;
    }
    
    sub.updated_at = chrono::Utc::now().to_rfc3339();
    
    Ok(sub.clone())
}

#[tauri::command]
pub async fn sa_cancel_subscription(
    state: State<'_, SuperAdminBillingState>,
    organization_id: String,
    reason: Option<String>,
    immediate: bool,
) -> Result<Subscription, String> {
    let mut subs_lock = state.subscriptions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let sub = subs_lock.get_mut(&organization_id)
        .ok_or_else(|| format!("Subscription not found for org: {}", organization_id))?;
    
    if immediate {
        sub.status = "cancelled".to_string();
    } else {
        sub.status = "cancelling".to_string();
        sub.auto_renew = false;
    }
    
    let _ = reason;
    sub.updated_at = chrono::Utc::now().to_rfc3339();
    
    Ok(sub.clone())
}

#[tauri::command]
pub async fn sa_get_invoices(
    state: State<'_, SuperAdminBillingState>,
    organization_id: String,
    status: Option<String>,
) -> Result<Vec<Invoice>, String> {
    let invoices_lock = state.invoices.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut filtered: Vec<Invoice> = invoices_lock
        .iter()
        .filter(|i| i.organization_id == organization_id)
        .cloned()
        .collect();
    
    if let Some(s) = status {
        filtered.retain(|i| i.status == s);
    }
    
    filtered.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    Ok(filtered)
}

#[tauri::command]
pub async fn sa_get_all_invoices(
    state: State<'_, SuperAdminBillingState>,
    status: Option<String>,
    page: Option<u32>,
    limit: Option<u32>,
) -> Result<Vec<Invoice>, String> {
    let invoices_lock = state.invoices.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(20);
    
    let mut filtered: Vec<Invoice> = invoices_lock.clone();
    
    if let Some(s) = status {
        filtered.retain(|i| i.status == s);
    }
    
    filtered.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    let start = ((page - 1) * limit) as usize;
    let end = std::cmp::min(start + limit as usize, filtered.len());
    
    if start < filtered.len() {
        Ok(filtered[start..end].to_vec())
    } else {
        Ok(vec![])
    }
}

// =============================================================================
// API KEY COMMANDS
// =============================================================================

#[tauri::command]
pub async fn sa_get_api_keys(
    state: State<'_, SuperAdminBillingState>,
) -> Result<Vec<APIKey>, String> {
    let keys_lock = state.api_keys.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(keys_lock.clone())
}

#[tauri::command]
pub async fn sa_create_api_key(
    state: State<'_, SuperAdminBillingState>,
    name: String,
    scopes: Vec<String>,
    rate_limit: Option<u32>,
    expires_at: Option<String>,
) -> Result<CreateAPIKeyResult, String> {
    let mut keys_lock = state.api_keys.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let secret = format!("sk_live_{}", uuid::Uuid::new_v4().to_string().replace("-", ""));
    
    let key = APIKey {
        id: format!("key-{}", uuid::Uuid::new_v4()),
        name,
        key_prefix: "sk_live_".to_string(),
        key_hash: "***************".to_string(),
        scopes,
        rate_limit: rate_limit.unwrap_or(1000),
        ip_restrictions: vec![],
        expires_at,
        last_used_at: None,
        created_at: chrono::Utc::now().to_rfc3339(),
        created_by: "admin".to_string(),
        status: "active".to_string(),
    };
    
    keys_lock.push(key.clone());
    
    Ok(CreateAPIKeyResult {
        api_key: key,
        secret,
    })
}

#[tauri::command]
pub async fn sa_revoke_api_key(
    state: State<'_, SuperAdminBillingState>,
    key_id: String,
) -> Result<bool, String> {
    let mut keys_lock = state.api_keys.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(key) = keys_lock.iter_mut().find(|k| k.id == key_id) {
        key.status = "revoked".to_string();
        Ok(true)
    } else {
        Err(format!("API key not found: {}", key_id))
    }
}

#[tauri::command]
pub async fn sa_delete_api_key(
    state: State<'_, SuperAdminBillingState>,
    key_id: String,
) -> Result<bool, String> {
    let mut keys_lock = state.api_keys.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let before = keys_lock.len();
    keys_lock.retain(|k| k.id != key_id);
    
    if keys_lock.len() < before {
        Ok(true)
    } else {
        Err(format!("API key not found: {}", key_id))
    }
}

// =============================================================================
// WEBHOOK COMMANDS
// =============================================================================

#[tauri::command]
pub async fn sa_get_webhooks(
    state: State<'_, SuperAdminBillingState>,
) -> Result<Vec<WebhookConfig>, String> {
    let webhooks_lock = state.webhooks.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(webhooks_lock.clone())
}

#[tauri::command]
pub async fn sa_create_webhook(
    state: State<'_, SuperAdminBillingState>,
    name: String,
    url: String,
    events: Vec<String>,
    secret: String,
) -> Result<WebhookConfig, String> {
    let mut webhooks_lock = state.webhooks.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let webhook = WebhookConfig {
        id: format!("wh-{}", uuid::Uuid::new_v4()),
        name,
        url,
        events,
        secret_set: !secret.is_empty(),
        enabled: true,
        retry_policy: RetryPolicy {
            max_retries: 3,
            initial_delay_ms: 1000,
            max_delay_ms: 60000,
        },
        last_triggered_at: None,
        last_status: None,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    
    webhooks_lock.push(webhook.clone());
    
    Ok(webhook)
}

#[tauri::command]
pub async fn sa_update_webhook(
    state: State<'_, SuperAdminBillingState>,
    webhook_id: String,
    name: Option<String>,
    url: Option<String>,
    events: Option<Vec<String>>,
    enabled: Option<bool>,
) -> Result<WebhookConfig, String> {
    let mut webhooks_lock = state.webhooks.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(webhook) = webhooks_lock.iter_mut().find(|w| w.id == webhook_id) {
        if let Some(n) = name {
            webhook.name = n;
        }
        if let Some(u) = url {
            webhook.url = u;
        }
        if let Some(e) = events {
            webhook.events = e;
        }
        if let Some(en) = enabled {
            webhook.enabled = en;
        }
        Ok(webhook.clone())
    } else {
        Err(format!("Webhook not found: {}", webhook_id))
    }
}

#[tauri::command]
pub async fn sa_delete_webhook(
    state: State<'_, SuperAdminBillingState>,
    webhook_id: String,
) -> Result<bool, String> {
    let mut webhooks_lock = state.webhooks.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let before = webhooks_lock.len();
    webhooks_lock.retain(|w| w.id != webhook_id);
    
    if webhooks_lock.len() < before {
        Ok(true)
    } else {
        Err(format!("Webhook not found: {}", webhook_id))
    }
}

#[tauri::command]
pub async fn sa_test_webhook(
    state: State<'_, SuperAdminBillingState>,
    webhook_id: String,
) -> Result<bool, String> {
    let webhooks_lock = state.webhooks.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let _webhook = webhooks_lock.iter().find(|w| w.id == webhook_id)
        .ok_or_else(|| format!("Webhook not found: {}", webhook_id))?;
    
    // In production, this would send a test event
    Ok(true)
}
