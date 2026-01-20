use tauri::State;
use crate::services::stripe_service::{
    StripeService, CheckoutSessionRequest, CheckoutSessionResponse,
    SubscriptionInfo, WebhookEvent, StripeConfig,
};

#[tauri::command]
pub async fn create_stripe_checkout_session(
    tier: String,
    billing_period: String,
    user_id: String,
    user_email: String,
    success_url: String,
    cancel_url: String,
    stripe_service: State<'_, StripeService>,
) -> Result<CheckoutSessionResponse, String> {
    let request = CheckoutSessionRequest {
        tier,
        billing_period,
        user_id,
        user_email,
        success_url,
        cancel_url,
    };

    stripe_service.create_checkout_session(request).await
}

#[tauri::command]
pub async fn get_stripe_subscription(
    subscription_id: String,
    stripe_service: State<'_, StripeService>,
) -> Result<SubscriptionInfo, String> {
    stripe_service.get_subscription(&subscription_id).await
}

#[tauri::command]
pub async fn cancel_stripe_subscription(
    subscription_id: String,
    stripe_service: State<'_, StripeService>,
) -> Result<SubscriptionInfo, String> {
    stripe_service.cancel_subscription(&subscription_id).await
}

#[tauri::command]
pub async fn resume_stripe_subscription(
    subscription_id: String,
    stripe_service: State<'_, StripeService>,
) -> Result<SubscriptionInfo, String> {
    stripe_service.resume_subscription(&subscription_id).await
}

#[tauri::command]
pub async fn create_stripe_portal_session(
    customer_id: String,
    return_url: String,
    stripe_service: State<'_, StripeService>,
) -> Result<String, String> {
    stripe_service.create_customer_portal_session(&customer_id, &return_url).await
}

#[tauri::command]
pub async fn verify_stripe_webhook(
    payload: String,
    signature: String,
    stripe_service: State<'_, StripeService>,
) -> Result<WebhookEvent, String> {
    stripe_service.verify_webhook(&payload, &signature).await
}

#[tauri::command]
pub async fn set_stripe_config(
    secret_key: String,
    webhook_secret: String,
    price_pro_monthly: String,
    price_pro_yearly: String,
    price_elite_monthly: String,
    price_elite_yearly: String,
    stripe_service: State<'_, StripeService>,
) -> Result<(), String> {
    let config = StripeConfig {
        secret_key,
        webhook_secret,
        price_pro_monthly,
        price_pro_yearly,
        price_elite_monthly,
        price_elite_yearly,
    };

    stripe_service.set_config(config).await;
    Ok(())
}
