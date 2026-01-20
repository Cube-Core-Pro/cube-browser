use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use stripe::{
    Client, CreateCheckoutSession, CreateCheckoutSessionLineItems,
    CreateCustomer, Customer, EventObject, EventType, 
    Expandable, Subscription, Webhook,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StripeConfig {
    pub secret_key: String,
    pub webhook_secret: String,
    pub price_pro_monthly: String,
    pub price_pro_yearly: String,
    pub price_elite_monthly: String,
    pub price_elite_yearly: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckoutSessionRequest {
    pub tier: String,
    pub billing_period: String, // "monthly" or "yearly"
    pub user_id: String,
    pub user_email: String,
    pub success_url: String,
    pub cancel_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckoutSessionResponse {
    pub session_id: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionInfo {
    pub id: String,
    pub customer_id: String,
    pub status: String,
    pub current_period_start: i64,
    pub current_period_end: i64,
    pub cancel_at_period_end: bool,
    pub tier: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookEvent {
    pub event_type: String,
    pub subscription_id: Option<String>,
    pub customer_id: Option<String>,
    pub status: Option<String>,
}

pub struct StripeService {
    client: Arc<Mutex<Client>>,
    config: Arc<Mutex<StripeConfig>>,
}

impl StripeService {
    pub fn new(config: StripeConfig) -> Result<Self, String> {
        let client = Client::new(config.secret_key.clone());
        
        Ok(Self {
            client: Arc::new(Mutex::new(client)),
            config: Arc::new(Mutex::new(config)),
        })
    }

    /// Create a disabled Stripe service for graceful degradation when initialization fails
    pub fn disabled() -> Self {
        Self {
            client: Arc::new(Mutex::new(Client::new(String::new()))),
            config: Arc::new(Mutex::new(StripeConfig {
                secret_key: String::new(),
                webhook_secret: String::new(),
                price_pro_monthly: String::new(),
                price_pro_yearly: String::new(),
                price_elite_monthly: String::new(),
                price_elite_yearly: String::new(),
            })),
        }
    }

    pub async fn create_checkout_session(
        &self,
        request: CheckoutSessionRequest,
    ) -> Result<CheckoutSessionResponse, String> {
        let client = self.client.lock().await;
        let config = self.config.lock().await;

        // Determine price ID based on tier and billing period
        let price_id = match (request.tier.as_str(), request.billing_period.as_str()) {
            ("pro", "monthly") => config.price_pro_monthly.clone(),
            ("pro", "yearly") => config.price_pro_yearly.clone(),
            ("elite", "monthly") => config.price_elite_monthly.clone(),
            ("elite", "yearly") => config.price_elite_yearly.clone(),
            _ => return Err("Invalid tier or billing period".to_string()),
        };

        // Create or retrieve customer
        let customer = match self.get_or_create_customer(&client, &request.user_email).await {
            Ok(c) => c,
            Err(e) => return Err(format!("Failed to create customer: {}", e)),
        };

        // Create checkout session
        let mut params = CreateCheckoutSession::new();
        params.mode = Some(stripe::CheckoutSessionMode::Subscription);
        params.customer = Some(customer.id.clone());
        params.success_url = Some(&request.success_url);
        params.cancel_url = Some(&request.cancel_url);
        params.line_items = Some(vec![CreateCheckoutSessionLineItems {
            price: Some(price_id),
            quantity: Some(1),
            ..Default::default()
        }]);
        
        // Add metadata
        params.metadata = Some(
            vec![
                ("user_id".to_string(), request.user_id.clone()),
                ("tier".to_string(), request.tier.clone()),
                ("billing_period".to_string(), request.billing_period.clone()),
            ]
            .into_iter()
            .collect(),
        );

        // Allow promotion codes
        params.allow_promotion_codes = Some(true);

        match stripe::CheckoutSession::create(&client, params).await {
            Ok(session) => Ok(CheckoutSessionResponse {
                session_id: session.id.to_string(),
                url: session.url.unwrap_or_default(),
            }),
            Err(e) => Err(format!("Failed to create checkout session: {}", e)),
        }
    }

    pub async fn get_subscription(
        &self,
        subscription_id: &str,
    ) -> Result<SubscriptionInfo, String> {
        let client = self.client.lock().await;

        let subscription_id = subscription_id
            .parse()
            .map_err(|_| "Invalid subscription ID".to_string())?;

        match Subscription::retrieve(&client, &subscription_id, &[]).await {
            Ok(sub) => {
                let tier = sub
                    .metadata
                    .get("tier")
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| "unknown".to_string());

                let customer_id = match &sub.customer {
                    Expandable::Id(id) => id.to_string(),
                    Expandable::Object(obj) => obj.id.to_string(),
                };

                Ok(SubscriptionInfo {
                    id: sub.id.to_string(),
                    customer_id,
                    status: format!("{:?}", sub.status),
                    current_period_start: sub.current_period_start,
                    current_period_end: sub.current_period_end,
                    cancel_at_period_end: sub.cancel_at_period_end,
                    tier,
                })
            }
            Err(e) => Err(format!("Failed to retrieve subscription: {}", e)),
        }
    }

    pub async fn cancel_subscription(
        &self,
        subscription_id: &str,
    ) -> Result<SubscriptionInfo, String> {
        let client = self.client.lock().await;

        let subscription_id = subscription_id
            .parse()
            .map_err(|_| "Invalid subscription ID".to_string())?;

        // Cancel at period end
        let mut params = stripe::UpdateSubscription::default();
        params.cancel_at_period_end = Some(true);

        match Subscription::update(&client, &subscription_id, params).await {
            Ok(sub) => {
                let tier = sub
                    .metadata
                    .get("tier")
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| "unknown".to_string());

                let customer_id = match &sub.customer {
                    Expandable::Id(id) => id.to_string(),
                    Expandable::Object(obj) => obj.id.to_string(),
                };

                Ok(SubscriptionInfo {
                    id: sub.id.to_string(),
                    customer_id,
                    status: format!("{:?}", sub.status),
                    current_period_start: sub.current_period_start,
                    current_period_end: sub.current_period_end,
                    cancel_at_period_end: sub.cancel_at_period_end,
                    tier,
                })
            }
            Err(e) => Err(format!("Failed to cancel subscription: {}", e)),
        }
    }

    pub async fn resume_subscription(
        &self,
        subscription_id: &str,
    ) -> Result<SubscriptionInfo, String> {
        let client = self.client.lock().await;

        let subscription_id = subscription_id
            .parse()
            .map_err(|_| "Invalid subscription ID".to_string())?;

        // Remove cancel at period end
        let mut params = stripe::UpdateSubscription::default();
        params.cancel_at_period_end = Some(false);

        match Subscription::update(&client, &subscription_id, params).await {
            Ok(sub) => {
                let tier = sub
                    .metadata
                    .get("tier")
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| "unknown".to_string());

                let customer_id = match &sub.customer {
                    Expandable::Id(id) => id.to_string(),
                    Expandable::Object(obj) => obj.id.to_string(),
                };

                Ok(SubscriptionInfo {
                    id: sub.id.to_string(),
                    customer_id,
                    status: format!("{:?}", sub.status),
                    current_period_start: sub.current_period_start,
                    current_period_end: sub.current_period_end,
                    cancel_at_period_end: sub.cancel_at_period_end,
                    tier,
                })
            }
            Err(e) => Err(format!("Failed to resume subscription: {}", e)),
        }
    }

    pub async fn create_customer_portal_session(
        &self,
        customer_id: &str,
        return_url: &str,
    ) -> Result<String, String> {
        let client = self.client.lock().await;

        let customer_id = customer_id
            .parse()
            .map_err(|_| "Invalid customer ID".to_string())?;

        let mut params = stripe::CreateBillingPortalSession::new(customer_id);
        params.return_url = Some(return_url);

        match stripe::BillingPortalSession::create(&client, params).await {
            Ok(session) => Ok(session.url),
            Err(e) => Err(format!("Failed to create portal session: {}", e)),
        }
    }

    pub async fn verify_webhook(
        &self,
        payload: &str,
        signature: &str,
    ) -> Result<WebhookEvent, String> {
        let config = self.config.lock().await;

        let event = Webhook::construct_event(
            payload,
            signature,
            &config.webhook_secret,
        )
        .map_err(|e| format!("Webhook verification failed: {}", e))?;

        let event_type = format!("{:?}", event.type_);
        let mut webhook_event = WebhookEvent {
            event_type: event_type.clone(),
            subscription_id: None,
            customer_id: None,
            status: None,
        };

        match event.type_ {
            EventType::CheckoutSessionCompleted => {
                if let EventObject::CheckoutSession(session) = event.data.object {
                    webhook_event.subscription_id = session.subscription
                        .map(|s| match s {
                            Expandable::Id(id) => id.to_string(),
                            Expandable::Object(obj) => obj.id.to_string(),
                        });
                    webhook_event.customer_id = session.customer
                        .map(|c| match c {
                            Expandable::Id(id) => id.to_string(),
                            Expandable::Object(obj) => obj.id.to_string(),
                        });
                }
            }
            EventType::CustomerSubscriptionUpdated
            | EventType::CustomerSubscriptionDeleted => {
                if let EventObject::Subscription(sub) = event.data.object {
                    webhook_event.subscription_id = Some(sub.id.to_string());
                    let customer_id = match sub.customer {
                        Expandable::Id(id) => id.to_string(),
                        Expandable::Object(obj) => obj.id.to_string(),
                    };
                    webhook_event.customer_id = Some(customer_id);
                    webhook_event.status = Some(format!("{:?}", sub.status));
                }
            }
            EventType::InvoicePaymentSucceeded
            | EventType::InvoicePaymentFailed => {
                if let EventObject::Invoice(invoice) = event.data.object {
                    webhook_event.customer_id = invoice.customer
                        .map(|c| match c {
                            Expandable::Id(id) => id.to_string(),
                            Expandable::Object(obj) => obj.id.to_string(),
                        });
                    webhook_event.subscription_id = invoice.subscription
                        .map(|s| match s {
                            Expandable::Id(id) => id.to_string(),
                            Expandable::Object(obj) => obj.id.to_string(),
                        });
                }
            }
            _ => {}
        }

        Ok(webhook_event)
    }

    async fn get_or_create_customer(
        &self,
        client: &Client,
        email: &str,
    ) -> Result<Customer, String> {
        // Search for existing customer
        let mut params = stripe::ListCustomers::new();
        params.email = Some(email);

        match Customer::list(client, &params).await {
            Ok(list) => {
                if let Some(customer) = list.data.first() {
                    return Ok(customer.clone());
                }
            }
            Err(e) => {
                return Err(format!("Failed to search customers: {}", e));
            }
        }

        // Create new customer
        let mut params = CreateCustomer::new();
        params.email = Some(email);

        match Customer::create(client, params).await {
            Ok(customer) => Ok(customer),
            Err(e) => Err(format!("Failed to create customer: {}", e)),
        }
    }

    pub async fn set_config(&self, config: StripeConfig) {
        let mut current_config = self.config.lock().await;
        *current_config = config.clone();

        let mut client = self.client.lock().await;
        *client = Client::new(config.secret_key);
    }
}
