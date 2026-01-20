use crate::services::vpn_provider_api::{get_pricing_plans, VpnProvider, VpnProviderAPI};
use tauri::State;

/// Get VPN pricing tiers (CUBE Elite Branded)
#[tauri::command]
pub async fn get_vpn_pricing_tiers() -> Result<Vec<serde_json::Value>, String> {
    Ok(get_pricing_plans())
}

/// Get VPN tiers with affiliate links
#[tauri::command]
pub async fn get_vpn_tiers(
    vpn_provider_api: State<'_, VpnProviderAPI>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(vpn_provider_api
        .get_tiers()
        .into_iter()
        .map(|(provider, tier)| {
            serde_json::json!({
                "provider": provider,
                "tier": tier
            })
        })
        .collect())
}

/// Fetch free VPN servers (Community tier)
#[tauri::command]
pub async fn fetch_free_vpn_servers(
    vpn_provider_api: State<'_, VpnProviderAPI>,
) -> Result<Vec<serde_json::Value>, String> {
    vpn_provider_api
        .fetch_free_servers()
        .await
        .map(|servers| {
            servers
                .into_iter()
                .map(|s| serde_json::to_value(s).unwrap())
                .collect()
        })
        .map_err(|e| e.to_string())
}

/// Fetch CUBE Elite premium servers
#[tauri::command]
pub async fn fetch_premium_vpn_servers(
    vpn_provider_api: State<'_, VpnProviderAPI>,
) -> Result<Vec<serde_json::Value>, String> {
    vpn_provider_api
        .fetch_premium_servers()
        .await
        .map(|servers| {
            servers
                .into_iter()
                .map(|s| serde_json::to_value(s).unwrap())
                .collect()
        })
        .map_err(|e| e.to_string())
}

/// Get purchase link for VPN provider (CUBE Elite only)
#[tauri::command]
pub async fn get_vpn_purchase_link(
    provider: String,
    tier: String,
    vpn_provider_api: State<'_, VpnProviderAPI>,
) -> Result<String, String> {
    let provider_enum = match provider.to_lowercase().as_str() {
        "cubeelite" | "cube" | "premium" => VpnProvider::CubeElitePremium,
        "protonvpn" | "proton" => VpnProvider::ProtonVPNFree,
        "windscribe" => VpnProvider::WindscribeFree,
        _ => return Err("Unknown provider. Use 'cubeelite' for premium service".to_string()),
    };

    Ok(vpn_provider_api.get_purchase_link(provider_enum, &tier))
}

/// Track VPN subscription (for commission tracking)
#[tauri::command]
pub async fn track_vpn_subscription(
    user_id: String,
    provider: String,
    tier: String,
    price: f64,
    vpn_provider_api: State<'_, VpnProviderAPI>,
) -> Result<serde_json::Value, String> {
    let provider_enum = match provider.to_lowercase().as_str() {
        "cubeelite" | "cube" | "premium" => VpnProvider::CubeElitePremium,
        _ => return Err("Only CUBE Elite VPN subscriptions are tracked".to_string()),
    };

    vpn_provider_api
        .track_subscription(user_id, provider_enum, tier, price)
        .map(|sub| serde_json::to_value(sub).unwrap())
        .map_err(|e| e.to_string())
}

/// Get total commission earned
#[tauri::command]
pub async fn get_vpn_total_commission(
    vpn_provider_api: State<'_, VpnProviderAPI>,
) -> Result<f64, String> {
    Ok(vpn_provider_api.get_total_commission())
}
