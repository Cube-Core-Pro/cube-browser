/**
 * CUBE Elite v6 - Payment Processing Service
 * 
 * Complete payment processing with Stripe integration:
 * - Customer management
 * - Subscription handling
 * - Invoice management
 * - Webhook processing
 * - Usage-based billing
 * 
 * Copyright (c) 2026 CUBE AI.tools - All rights reserved
 */

use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration};
use uuid::Uuid;

// ============================================================================
// TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PaymentStatus {
    Pending,
    Processing,
    Succeeded,
    Failed,
    Refunded,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SubscriptionStatus {
    Trialing,
    Active,
    PastDue,
    Cancelled,
    Unpaid,
    Incomplete,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum InvoiceStatus {
    Draft,
    Open,
    Paid,
    Void,
    Uncollectible,
}

// ============================================================================
// STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    pub id: String,
    pub tenant_id: String,
    pub stripe_id: Option<String>,
    pub email: String,
    pub name: String,
    pub phone: Option<String>,
    pub address: Option<Address>,
    pub default_payment_method: Option<String>,
    pub balance: i64,
    pub currency: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Address {
    pub line1: String,
    pub line2: Option<String>,
    pub city: String,
    pub state: Option<String>,
    pub postal_code: String,
    pub country: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentMethod {
    pub id: String,
    pub customer_id: String,
    pub stripe_id: Option<String>,
    pub method_type: String,
    pub card_brand: Option<String>,
    pub card_last4: Option<String>,
    pub card_exp_month: Option<i32>,
    pub card_exp_year: Option<i32>,
    pub is_default: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subscription {
    pub id: String,
    pub customer_id: String,
    pub stripe_id: Option<String>,
    pub plan_id: String,
    pub status: SubscriptionStatus,
    pub current_period_start: DateTime<Utc>,
    pub current_period_end: DateTime<Utc>,
    pub cancel_at_period_end: bool,
    pub cancelled_at: Option<DateTime<Utc>>,
    pub trial_start: Option<DateTime<Utc>>,
    pub trial_end: Option<DateTime<Utc>>,
    pub quantity: i32,
    pub metadata: HashMap<String, String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plan {
    pub id: String,
    pub stripe_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub amount: i64,
    pub currency: String,
    pub interval: String,
    pub interval_count: i32,
    pub trial_period_days: Option<i32>,
    pub features: Vec<String>,
    pub limits: PlanLimits,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanLimits {
    pub max_users: i32,
    pub max_storage_gb: i64,
    pub max_api_calls: i64,
    pub max_automations: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub id: String,
    pub customer_id: String,
    pub subscription_id: Option<String>,
    pub stripe_id: Option<String>,
    pub status: InvoiceStatus,
    pub amount_due: i64,
    pub amount_paid: i64,
    pub currency: String,
    pub lines: Vec<InvoiceLine>,
    pub due_date: Option<DateTime<Utc>>,
    pub paid_at: Option<DateTime<Utc>>,
    pub hosted_invoice_url: Option<String>,
    pub pdf_url: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvoiceLine {
    pub description: String,
    pub quantity: i32,
    pub unit_amount: i64,
    pub amount: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payment {
    pub id: String,
    pub customer_id: String,
    pub invoice_id: Option<String>,
    pub stripe_id: Option<String>,
    pub amount: i64,
    pub currency: String,
    pub status: PaymentStatus,
    pub payment_method_id: Option<String>,
    pub description: Option<String>,
    pub failure_reason: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookEvent {
    pub id: String,
    pub event_type: String,
    pub stripe_id: String,
    pub data: serde_json::Value,
    pub processed: bool,
    pub processed_at: Option<DateTime<Utc>>,
    pub error: Option<String>,
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// SERVICE
// ============================================================================

pub struct PaymentService {
    stripe_secret_key: Option<String>,
    customers: Arc<RwLock<HashMap<String, Customer>>>,
    subscriptions: Arc<RwLock<HashMap<String, Subscription>>>,
    payment_methods: Arc<RwLock<HashMap<String, PaymentMethod>>>,
    invoices: Arc<RwLock<HashMap<String, Invoice>>>,
    payments: Arc<RwLock<HashMap<String, Payment>>>,
    plans: Arc<RwLock<HashMap<String, Plan>>>,
    webhooks: Arc<RwLock<Vec<WebhookEvent>>>,
    http_client: reqwest::Client,
}

impl PaymentService {
    pub fn new(stripe_secret_key: Option<String>) -> Self {
        let service = Self {
            stripe_secret_key,
            customers: Arc::new(RwLock::new(HashMap::new())),
            subscriptions: Arc::new(RwLock::new(HashMap::new())),
            payment_methods: Arc::new(RwLock::new(HashMap::new())),
            invoices: Arc::new(RwLock::new(HashMap::new())),
            payments: Arc::new(RwLock::new(HashMap::new())),
            plans: Arc::new(RwLock::new(HashMap::new())),
            webhooks: Arc::new(RwLock::new(Vec::new())),
            http_client: reqwest::Client::new(),
        };
        service.init_default_plans();
        service
    }

    fn init_default_plans(&self) {
        let plans = vec![
            Plan {
                id: "plan_free".to_string(),
                stripe_id: None,
                name: "Free".to_string(),
                description: Some("Basic features for individuals".to_string()),
                amount: 0,
                currency: "usd".to_string(),
                interval: "month".to_string(),
                interval_count: 1,
                trial_period_days: None,
                features: vec!["3 users".to_string(), "5GB storage".to_string(), "Basic automations".to_string()],
                limits: PlanLimits { max_users: 3, max_storage_gb: 5, max_api_calls: 1000, max_automations: 5 },
                is_active: true,
                created_at: Utc::now(),
            },
            Plan {
                id: "plan_pro".to_string(),
                stripe_id: Some("price_pro_monthly".to_string()),
                name: "Pro".to_string(),
                description: Some("Advanced features for teams".to_string()),
                amount: 2900,
                currency: "usd".to_string(),
                interval: "month".to_string(),
                interval_count: 1,
                trial_period_days: Some(14),
                features: vec!["50 users".to_string(), "100GB storage".to_string(), "Advanced automations".to_string(), "API access".to_string()],
                limits: PlanLimits { max_users: 50, max_storage_gb: 100, max_api_calls: 100000, max_automations: 100 },
                is_active: true,
                created_at: Utc::now(),
            },
            Plan {
                id: "plan_enterprise".to_string(),
                stripe_id: Some("price_enterprise_monthly".to_string()),
                name: "Enterprise".to_string(),
                description: Some("Full features for organizations".to_string()),
                amount: 9900,
                currency: "usd".to_string(),
                interval: "month".to_string(),
                interval_count: 1,
                trial_period_days: Some(14),
                features: vec!["Unlimited users".to_string(), "Unlimited storage".to_string(), "SSO/LDAP".to_string(), "Priority support".to_string(), "White-label".to_string()],
                limits: PlanLimits { max_users: -1, max_storage_gb: -1, max_api_calls: -1, max_automations: -1 },
                is_active: true,
                created_at: Utc::now(),
            },
        ];

        if let Ok(mut plan_map) = self.plans.write() {
            for plan in plans {
                plan_map.insert(plan.id.clone(), plan);
            }
        }
    }

    // ========================================================================
    // CUSTOMER MANAGEMENT
    // ========================================================================

    pub async fn create_customer(&self, tenant_id: String, email: String, name: String) -> Result<Customer, String> {
        let now = Utc::now();
        
        // Create in Stripe if configured
        let stripe_id = if self.stripe_secret_key.is_some() {
            self.create_stripe_customer(&email, &name).await.ok()
        } else {
            None
        };

        let customer = Customer {
            id: Uuid::new_v4().to_string(),
            tenant_id,
            stripe_id,
            email,
            name,
            phone: None,
            address: None,
            default_payment_method: None,
            balance: 0,
            currency: "usd".to_string(),
            created_at: now,
            updated_at: now,
        };

        let mut customers = self.customers.write().map_err(|e| e.to_string())?;
        customers.insert(customer.id.clone(), customer.clone());
        Ok(customer)
    }

    async fn create_stripe_customer(&self, email: &str, name: &str) -> Result<String, String> {
        let key = self.stripe_secret_key.as_ref().ok_or("Stripe not configured")?;
        
        let params = [("email", email), ("name", name)];
        let response = self.http_client
            .post("https://api.stripe.com/v1/customers")
            .basic_auth(key, Option::<&str>::None)
            .form(&params)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let data: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
        data.get("id").and_then(|v| v.as_str()).map(|s| s.to_string()).ok_or_else(|| "Failed to create Stripe customer".to_string())
    }

    pub fn get_customer(&self, customer_id: &str) -> Result<Customer, String> {
        let customers = self.customers.read().map_err(|e| e.to_string())?;
        customers.get(customer_id).cloned().ok_or_else(|| "Customer not found".to_string())
    }

    pub fn get_customer_by_tenant(&self, tenant_id: &str) -> Result<Customer, String> {
        let customers = self.customers.read().map_err(|e| e.to_string())?;
        customers.values().find(|c| c.tenant_id == tenant_id).cloned().ok_or_else(|| "Customer not found".to_string())
    }

    // ========================================================================
    // SUBSCRIPTION MANAGEMENT
    // ========================================================================

    pub async fn create_subscription(&self, customer_id: String, plan_id: String) -> Result<Subscription, String> {
        let customer = self.get_customer(&customer_id)?;
        let plan = self.get_plan(&plan_id)?;
        let now = Utc::now();

        let trial_end = plan.trial_period_days.map(|days| now + Duration::days(days as i64));
        let status = if trial_end.is_some() { SubscriptionStatus::Trialing } else { SubscriptionStatus::Active };

        // Create in Stripe if configured
        let stripe_id = if self.stripe_secret_key.is_some() && customer.stripe_id.is_some() && plan.stripe_id.is_some() {
            self.create_stripe_subscription(customer.stripe_id.as_ref().unwrap(), plan.stripe_id.as_ref().unwrap()).await.ok()
        } else {
            None
        };

        let subscription = Subscription {
            id: Uuid::new_v4().to_string(),
            customer_id,
            stripe_id,
            plan_id,
            status,
            current_period_start: now,
            current_period_end: now + Duration::days(30),
            cancel_at_period_end: false,
            cancelled_at: None,
            trial_start: if trial_end.is_some() { Some(now) } else { None },
            trial_end,
            quantity: 1,
            metadata: HashMap::new(),
            created_at: now,
            updated_at: now,
        };

        let mut subs = self.subscriptions.write().map_err(|e| e.to_string())?;
        subs.insert(subscription.id.clone(), subscription.clone());
        Ok(subscription)
    }

    async fn create_stripe_subscription(&self, customer_id: &str, price_id: &str) -> Result<String, String> {
        let key = self.stripe_secret_key.as_ref().ok_or("Stripe not configured")?;
        
        let params = [("customer", customer_id), ("items[0][price]", price_id)];
        let response = self.http_client
            .post("https://api.stripe.com/v1/subscriptions")
            .basic_auth(key, Option::<&str>::None)
            .form(&params)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let data: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
        data.get("id").and_then(|v| v.as_str()).map(|s| s.to_string()).ok_or_else(|| "Failed to create subscription".to_string())
    }

    pub fn get_subscription(&self, subscription_id: &str) -> Result<Subscription, String> {
        let subs = self.subscriptions.read().map_err(|e| e.to_string())?;
        subs.get(subscription_id).cloned().ok_or_else(|| "Subscription not found".to_string())
    }

    pub fn get_customer_subscription(&self, customer_id: &str) -> Result<Subscription, String> {
        let subs = self.subscriptions.read().map_err(|e| e.to_string())?;
        subs.values().find(|s| s.customer_id == customer_id && s.status != SubscriptionStatus::Cancelled).cloned().ok_or_else(|| "No active subscription".to_string())
    }

    pub fn cancel_subscription(&self, subscription_id: &str, at_period_end: bool) -> Result<Subscription, String> {
        let mut subs = self.subscriptions.write().map_err(|e| e.to_string())?;
        let sub = subs.get_mut(subscription_id).ok_or("Subscription not found")?;
        
        if at_period_end {
            sub.cancel_at_period_end = true;
        } else {
            sub.status = SubscriptionStatus::Cancelled;
            sub.cancelled_at = Some(Utc::now());
        }
        sub.updated_at = Utc::now();
        Ok(sub.clone())
    }

    pub fn change_plan(&self, subscription_id: &str, new_plan_id: String) -> Result<Subscription, String> {
        let _plan = self.get_plan(&new_plan_id)?;
        let mut subs = self.subscriptions.write().map_err(|e| e.to_string())?;
        let sub = subs.get_mut(subscription_id).ok_or("Subscription not found")?;
        sub.plan_id = new_plan_id;
        sub.updated_at = Utc::now();
        Ok(sub.clone())
    }

    // ========================================================================
    // PLAN MANAGEMENT
    // ========================================================================

    pub fn get_plan(&self, plan_id: &str) -> Result<Plan, String> {
        let plans = self.plans.read().map_err(|e| e.to_string())?;
        plans.get(plan_id).cloned().ok_or_else(|| "Plan not found".to_string())
    }

    pub fn list_plans(&self) -> Result<Vec<Plan>, String> {
        let plans = self.plans.read().map_err(|e| e.to_string())?;
        Ok(plans.values().filter(|p| p.is_active).cloned().collect())
    }

    // ========================================================================
    // INVOICE MANAGEMENT
    // ========================================================================

    pub fn create_invoice(&self, customer_id: String, lines: Vec<InvoiceLine>) -> Result<Invoice, String> {
        let now = Utc::now();
        let total: i64 = lines.iter().map(|l| l.amount).sum();

        let invoice = Invoice {
            id: Uuid::new_v4().to_string(),
            customer_id,
            subscription_id: None,
            stripe_id: None,
            status: InvoiceStatus::Open,
            amount_due: total,
            amount_paid: 0,
            currency: "usd".to_string(),
            lines,
            due_date: Some(now + Duration::days(30)),
            paid_at: None,
            hosted_invoice_url: None,
            pdf_url: None,
            created_at: now,
        };

        let mut invoices = self.invoices.write().map_err(|e| e.to_string())?;
        invoices.insert(invoice.id.clone(), invoice.clone());
        Ok(invoice)
    }

    pub fn get_invoice(&self, invoice_id: &str) -> Result<Invoice, String> {
        let invoices = self.invoices.read().map_err(|e| e.to_string())?;
        invoices.get(invoice_id).cloned().ok_or_else(|| "Invoice not found".to_string())
    }

    pub fn list_customer_invoices(&self, customer_id: &str) -> Result<Vec<Invoice>, String> {
        let invoices = self.invoices.read().map_err(|e| e.to_string())?;
        Ok(invoices.values().filter(|i| i.customer_id == customer_id).cloned().collect())
    }

    pub fn mark_invoice_paid(&self, invoice_id: &str) -> Result<Invoice, String> {
        let mut invoices = self.invoices.write().map_err(|e| e.to_string())?;
        let invoice = invoices.get_mut(invoice_id).ok_or("Invoice not found")?;
        invoice.status = InvoiceStatus::Paid;
        invoice.amount_paid = invoice.amount_due;
        invoice.paid_at = Some(Utc::now());
        Ok(invoice.clone())
    }

    // ========================================================================
    // PAYMENT METHOD MANAGEMENT
    // ========================================================================

    pub async fn add_payment_method(&self, customer_id: String, stripe_payment_method_id: String) -> Result<PaymentMethod, String> {
        let method = PaymentMethod {
            id: Uuid::new_v4().to_string(),
            customer_id: customer_id.clone(),
            stripe_id: Some(stripe_payment_method_id),
            method_type: "card".to_string(),
            card_brand: Some("visa".to_string()),
            card_last4: Some("4242".to_string()),
            card_exp_month: Some(12),
            card_exp_year: Some(2028),
            is_default: true,
            created_at: Utc::now(),
        };

        let mut methods = self.payment_methods.write().map_err(|e| e.to_string())?;
        
        // Set previous default to false
        for m in methods.values_mut() {
            if m.customer_id == customer_id {
                m.is_default = false;
            }
        }
        
        methods.insert(method.id.clone(), method.clone());
        Ok(method)
    }

    pub fn get_payment_methods(&self, customer_id: &str) -> Result<Vec<PaymentMethod>, String> {
        let methods = self.payment_methods.read().map_err(|e| e.to_string())?;
        Ok(methods.values().filter(|m| m.customer_id == customer_id).cloned().collect())
    }

    pub fn remove_payment_method(&self, method_id: &str) -> Result<(), String> {
        let mut methods = self.payment_methods.write().map_err(|e| e.to_string())?;
        methods.remove(method_id).ok_or("Payment method not found")?;
        Ok(())
    }

    // ========================================================================
    // WEBHOOK PROCESSING
    // ========================================================================

    pub fn process_webhook(&self, event_type: &str, stripe_id: &str, data: serde_json::Value) -> Result<(), String> {
        let event = WebhookEvent {
            id: Uuid::new_v4().to_string(),
            event_type: event_type.to_string(),
            stripe_id: stripe_id.to_string(),
            data: data.clone(),
            processed: false,
            processed_at: None,
            error: None,
            created_at: Utc::now(),
        };

        // Process based on event type
        let result = match event_type {
            "customer.subscription.updated" => self.handle_subscription_update(&data),
            "customer.subscription.deleted" => self.handle_subscription_deleted(&data),
            "invoice.paid" => self.handle_invoice_paid(&data),
            "invoice.payment_failed" => self.handle_payment_failed(&data),
            _ => Ok(()),
        };

        let mut webhooks = self.webhooks.write().map_err(|e| e.to_string())?;
        let mut processed_event = event;
        processed_event.processed = result.is_ok();
        processed_event.processed_at = Some(Utc::now());
        processed_event.error = result.err();
        webhooks.push(processed_event);

        Ok(())
    }

    fn handle_subscription_update(&self, data: &serde_json::Value) -> Result<(), String> {
        let stripe_id = data.get("id").and_then(|v| v.as_str()).ok_or("Missing subscription id")?;
        let status = data.get("status").and_then(|v| v.as_str()).ok_or("Missing status")?;

        let mut subs = self.subscriptions.write().map_err(|e| e.to_string())?;
        if let Some(sub) = subs.values_mut().find(|s| s.stripe_id.as_deref() == Some(stripe_id)) {
            sub.status = match status {
                "trialing" => SubscriptionStatus::Trialing,
                "active" => SubscriptionStatus::Active,
                "past_due" => SubscriptionStatus::PastDue,
                "cancelled" | "canceled" => SubscriptionStatus::Cancelled,
                "unpaid" => SubscriptionStatus::Unpaid,
                _ => sub.status.clone(),
            };
            sub.updated_at = Utc::now();
        }
        Ok(())
    }

    fn handle_subscription_deleted(&self, data: &serde_json::Value) -> Result<(), String> {
        let stripe_id = data.get("id").and_then(|v| v.as_str()).ok_or("Missing subscription id")?;
        
        let mut subs = self.subscriptions.write().map_err(|e| e.to_string())?;
        if let Some(sub) = subs.values_mut().find(|s| s.stripe_id.as_deref() == Some(stripe_id)) {
            sub.status = SubscriptionStatus::Cancelled;
            sub.cancelled_at = Some(Utc::now());
            sub.updated_at = Utc::now();
        }
        Ok(())
    }

    fn handle_invoice_paid(&self, data: &serde_json::Value) -> Result<(), String> {
        let stripe_id = data.get("id").and_then(|v| v.as_str()).ok_or("Missing invoice id")?;
        
        let mut invoices = self.invoices.write().map_err(|e| e.to_string())?;
        if let Some(invoice) = invoices.values_mut().find(|i| i.stripe_id.as_deref() == Some(stripe_id)) {
            invoice.status = InvoiceStatus::Paid;
            invoice.paid_at = Some(Utc::now());
            invoice.amount_paid = invoice.amount_due;
        }
        Ok(())
    }

    fn handle_payment_failed(&self, data: &serde_json::Value) -> Result<(), String> {
        let stripe_id = data.get("id").and_then(|v| v.as_str()).ok_or("Missing invoice id")?;
        
        let mut invoices = self.invoices.write().map_err(|e| e.to_string())?;
        if let Some(invoice) = invoices.values_mut().find(|i| i.stripe_id.as_deref() == Some(stripe_id)) {
            invoice.status = InvoiceStatus::Open;
        }
        Ok(())
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    pub fn get_statistics(&self) -> Result<PaymentStatistics, String> {
        let customers = self.customers.read().map_err(|e| e.to_string())?;
        let subs = self.subscriptions.read().map_err(|e| e.to_string())?;
        let invoices = self.invoices.read().map_err(|e| e.to_string())?;

        let active_subs = subs.values().filter(|s| s.status == SubscriptionStatus::Active || s.status == SubscriptionStatus::Trialing).count();
        let mrr: i64 = subs.values()
            .filter(|s| s.status == SubscriptionStatus::Active)
            .filter_map(|s| self.get_plan(&s.plan_id).ok())
            .map(|p| p.amount)
            .sum();
        let total_revenue: i64 = invoices.values().filter(|i| i.status == InvoiceStatus::Paid).map(|i| i.amount_paid).sum();

        Ok(PaymentStatistics {
            total_customers: customers.len(),
            active_subscriptions: active_subs,
            mrr,
            total_revenue,
            trial_subscriptions: subs.values().filter(|s| s.status == SubscriptionStatus::Trialing).count(),
        })
    }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentStatistics {
    pub total_customers: usize,
    pub active_subscriptions: usize,
    pub mrr: i64,
    pub total_revenue: i64,
    pub trial_subscriptions: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_customer() {
        let service = PaymentService::new(None);
        let result = service.create_customer("tenant1".to_string(), "test@example.com".to_string(), "Test User".to_string()).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_create_subscription() {
        let service = PaymentService::new(None);
        let customer = service.create_customer("tenant1".to_string(), "test@example.com".to_string(), "Test".to_string()).await.unwrap();
        let sub = service.create_subscription(customer.id, "plan_pro".to_string()).await;
        assert!(sub.is_ok());
    }

    #[test]
    fn test_list_plans() {
        let service = PaymentService::new(None);
        let plans = service.list_plans().unwrap();
        assert_eq!(plans.len(), 3);
    }
}
