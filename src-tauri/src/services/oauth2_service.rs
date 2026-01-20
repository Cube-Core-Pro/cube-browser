// ═══════════════════════════════════════════════════════════════════════════════
// CUBE MAIL - OAUTH2 SERVICE MODULE
// ═══════════════════════════════════════════════════════════════════════════════
//
// OAuth2 authentication flow implementation for:
// - Google/Gmail (XOAUTH2)
// - Microsoft/Outlook (XOAUTH2)
// - Yahoo Mail (XOAUTH2)
//
// Provides:
// - OAuth2 authorization URL generation
// - Token exchange
// - Token refresh
// - Secure token storage integration
//
// ═══════════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use log::{info, error, debug};
use chrono::{DateTime, Utc, Duration};
use uuid::Uuid;
use std::collections::HashMap;
use reqwest::Client;
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH2 PROVIDER CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/// OAuth2 Provider types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum OAuth2Provider {
    Google,
    Microsoft,
    Yahoo,
}

/// OAuth2 configuration for a provider
#[derive(Debug, Clone)]
pub struct OAuth2Config {
    pub provider: OAuth2Provider,
    pub client_id: String,
    pub client_secret: String,
    pub auth_url: String,
    pub token_url: String,
    pub scopes: Vec<String>,
    pub redirect_uri: String,
}

impl OAuth2Config {
    /// Create Google OAuth2 configuration
    pub fn google(client_id: String, client_secret: String, redirect_uri: String) -> Self {
        Self {
            provider: OAuth2Provider::Google,
            client_id,
            client_secret,
            auth_url: "https://accounts.google.com/o/oauth2/v2/auth".to_string(),
            token_url: "https://oauth2.googleapis.com/token".to_string(),
            scopes: vec![
                "https://mail.google.com/".to_string(),
                "email".to_string(),
                "profile".to_string(),
            ],
            redirect_uri,
        }
    }

    /// Create Microsoft OAuth2 configuration
    pub fn microsoft(client_id: String, client_secret: String, redirect_uri: String) -> Self {
        Self {
            provider: OAuth2Provider::Microsoft,
            client_id,
            client_secret,
            auth_url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize".to_string(),
            token_url: "https://login.microsoftonline.com/common/oauth2/v2.0/token".to_string(),
            scopes: vec![
                "https://outlook.office.com/IMAP.AccessAsUser.All".to_string(),
                "https://outlook.office.com/SMTP.Send".to_string(),
                "offline_access".to_string(),
                "openid".to_string(),
                "email".to_string(),
                "profile".to_string(),
            ],
            redirect_uri,
        }
    }

    /// Create Yahoo OAuth2 configuration
    pub fn yahoo(client_id: String, client_secret: String, redirect_uri: String) -> Self {
        Self {
            provider: OAuth2Provider::Yahoo,
            client_id,
            client_secret,
            auth_url: "https://api.login.yahoo.com/oauth2/request_auth".to_string(),
            token_url: "https://api.login.yahoo.com/oauth2/get_token".to_string(),
            scopes: vec![
                "mail-r".to_string(),
                "mail-w".to_string(),
                "profile".to_string(),
            ],
            redirect_uri,
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH2 TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

/// OAuth2 token response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuth2Tokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub token_type: String,
    pub expires_in: Option<i64>,
    pub expires_at: Option<DateTime<Utc>>,
    pub scope: Option<String>,
    pub id_token: Option<String>,
}

impl OAuth2Tokens {
    /// Check if token is expired (or will expire in the next 5 minutes)
    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            let buffer = Duration::minutes(5);
            Utc::now() + buffer >= expires_at
        } else if let Some(expires_in) = self.expires_in {
            // If we don't have expires_at, assume it's nearly expired
            expires_in < 300
        } else {
            false
        }
    }

    /// Get XOAUTH2 string for IMAP authentication
    pub fn xoauth2_string(&self, email: &str) -> String {
        format!(
            "user={}\x01auth=Bearer {}\x01\x01",
            email,
            self.access_token
        )
    }

    /// Get base64-encoded XOAUTH2 string
    pub fn xoauth2_base64(&self, email: &str) -> String {
        URL_SAFE_NO_PAD.encode(self.xoauth2_string(email))
    }
}

/// Token response from OAuth2 provider
#[derive(Debug, Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    token_type: String,
    expires_in: Option<i64>,
    scope: Option<String>,
    id_token: Option<String>,
}

/// Error response from OAuth2 provider
#[derive(Debug, Deserialize)]
struct TokenError {
    error: String,
    error_description: Option<String>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH2 STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/// OAuth2 authorization state for PKCE
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuth2State {
    pub state: String,
    pub code_verifier: Option<String>,
    pub provider: OAuth2Provider,
    pub created_at: DateTime<Utc>,
}

impl OAuth2State {
    /// Create new OAuth2 state with PKCE code verifier
    pub fn new(provider: OAuth2Provider) -> Self {
        Self {
            state: Uuid::new_v4().to_string(),
            code_verifier: Some(Self::generate_code_verifier()),
            provider,
            created_at: Utc::now(),
        }
    }

    /// Generate PKCE code verifier (43-128 characters)
    fn generate_code_verifier() -> String {
        let random_bytes: [u8; 32] = rand::random();
        URL_SAFE_NO_PAD.encode(random_bytes)
    }

    /// Generate PKCE code challenge (SHA256 hash of verifier)
    pub fn code_challenge(&self) -> Option<String> {
        self.code_verifier.as_ref().map(|verifier| {
            use sha2::{Sha256, Digest};
            let mut hasher = Sha256::new();
            hasher.update(verifier.as_bytes());
            let hash = hasher.finalize();
            URL_SAFE_NO_PAD.encode(hash)
        })
    }

    /// Check if state is expired (10 minute window)
    pub fn is_expired(&self) -> bool {
        Utc::now() > self.created_at + Duration::minutes(10)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH2 SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

/// OAuth2 service for handling authentication flows
pub struct OAuth2Service {
    http_client: Client,
    pending_states: HashMap<String, OAuth2State>,
}

impl OAuth2Service {
    /// Create new OAuth2 service
    pub fn new() -> Self {
        Self {
            http_client: Client::new(),
            pending_states: HashMap::new(),
        }
    }

    /// Generate authorization URL for OAuth2 flow
    pub fn generate_auth_url(&mut self, config: &OAuth2Config) -> (String, OAuth2State) {
        let state = OAuth2State::new(config.provider.clone());
        
        let mut params = vec![
            ("client_id", config.client_id.clone()),
            ("redirect_uri", config.redirect_uri.clone()),
            ("response_type", "code".to_string()),
            ("state", state.state.clone()),
            ("scope", config.scopes.join(" ")),
            ("access_type", "offline".to_string()),
            ("prompt", "consent".to_string()),
        ];

        // Add PKCE parameters
        if let Some(challenge) = state.code_challenge() {
            params.push(("code_challenge", challenge));
            params.push(("code_challenge_method", "S256".to_string()));
        }

        let query = params
            .iter()
            .map(|(k, v)| format!("{}={}", k, urlencoding::encode(v)))
            .collect::<Vec<_>>()
            .join("&");

        let url = format!("{}?{}", config.auth_url, query);
        
        // Store state for validation
        self.pending_states.insert(state.state.clone(), state.clone());
        
        info!("Generated OAuth2 authorization URL for {:?}", config.provider);
        (url, state)
    }

    /// Exchange authorization code for tokens
    pub async fn exchange_code(
        &mut self,
        config: &OAuth2Config,
        code: &str,
        state: &str,
    ) -> Result<OAuth2Tokens, String> {
        // Validate state
        let pending_state = self.pending_states.remove(state)
            .ok_or_else(|| "Invalid or expired state".to_string())?;

        if pending_state.is_expired() {
            return Err("Authorization state has expired".to_string());
        }

        if pending_state.provider != config.provider {
            return Err("Provider mismatch".to_string());
        }

        info!("Exchanging authorization code for {:?}", config.provider);

        let mut params = vec![
            ("client_id", config.client_id.clone()),
            ("client_secret", config.client_secret.clone()),
            ("code", code.to_string()),
            ("redirect_uri", config.redirect_uri.clone()),
            ("grant_type", "authorization_code".to_string()),
        ];

        // Add PKCE verifier
        if let Some(verifier) = pending_state.code_verifier {
            params.push(("code_verifier", verifier));
        }

        let response = self.http_client
            .post(&config.token_url)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Token request failed: {}", e))?;

        if !response.status().is_success() {
            let error: TokenError = response.json().await
                .unwrap_or_else(|_| TokenError {
                    error: "unknown".to_string(),
                    error_description: None,
                });
            return Err(format!(
                "Token exchange failed: {} - {}",
                error.error,
                error.error_description.unwrap_or_default()
            ));
        }

        let token_response: TokenResponse = response.json().await
            .map_err(|e| format!("Failed to parse token response: {}", e))?;

        let expires_at = token_response.expires_in.map(|secs| {
            Utc::now() + Duration::seconds(secs)
        });

        let tokens = OAuth2Tokens {
            access_token: token_response.access_token,
            refresh_token: token_response.refresh_token,
            token_type: token_response.token_type,
            expires_in: token_response.expires_in,
            expires_at,
            scope: token_response.scope,
            id_token: token_response.id_token,
        };

        info!("✅ Successfully obtained OAuth2 tokens for {:?}", config.provider);
        Ok(tokens)
    }

    /// Refresh access token using refresh token
    pub async fn refresh_tokens(
        &self,
        config: &OAuth2Config,
        refresh_token: &str,
    ) -> Result<OAuth2Tokens, String> {
        info!("Refreshing OAuth2 tokens for {:?}", config.provider);

        let params = [
            ("client_id", config.client_id.as_str()),
            ("client_secret", config.client_secret.as_str()),
            ("refresh_token", refresh_token),
            ("grant_type", "refresh_token"),
        ];

        let response = self.http_client
            .post(&config.token_url)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Token refresh request failed: {}", e))?;

        if !response.status().is_success() {
            let error: TokenError = response.json().await
                .unwrap_or_else(|_| TokenError {
                    error: "unknown".to_string(),
                    error_description: None,
                });
            return Err(format!(
                "Token refresh failed: {} - {}",
                error.error,
                error.error_description.unwrap_or_default()
            ));
        }

        let token_response: TokenResponse = response.json().await
            .map_err(|e| format!("Failed to parse token response: {}", e))?;

        let expires_at = token_response.expires_in.map(|secs| {
            Utc::now() + Duration::seconds(secs)
        });

        let tokens = OAuth2Tokens {
            access_token: token_response.access_token,
            refresh_token: token_response.refresh_token.or_else(|| Some(refresh_token.to_string())),
            token_type: token_response.token_type,
            expires_in: token_response.expires_in,
            expires_at,
            scope: token_response.scope,
            id_token: token_response.id_token,
        };

        info!("✅ Successfully refreshed OAuth2 tokens for {:?}", config.provider);
        Ok(tokens)
    }

    /// Get user info from ID token (JWT)
    pub fn parse_id_token(&self, id_token: &str) -> Result<UserInfo, String> {
        let parts: Vec<&str> = id_token.split('.').collect();
        if parts.len() != 3 {
            return Err("Invalid ID token format".to_string());
        }

        let payload = URL_SAFE_NO_PAD
            .decode(parts[1])
            .map_err(|e| format!("Failed to decode ID token payload: {}", e))?;

        let claims: IdTokenClaims = serde_json::from_slice(&payload)
            .map_err(|e| format!("Failed to parse ID token claims: {}", e))?;

        Ok(UserInfo {
            email: claims.email,
            name: claims.name,
            picture: claims.picture,
            email_verified: claims.email_verified,
        })
    }

    /// Clean up expired pending states
    pub fn cleanup_expired_states(&mut self) {
        self.pending_states.retain(|_, state| !state.is_expired());
    }
}

impl Default for OAuth2Service {
    fn default() -> Self {
        Self::new()
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER INFO
// ═══════════════════════════════════════════════════════════════════════════════

/// User information extracted from OAuth2
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub email: Option<String>,
    pub name: Option<String>,
    pub picture: Option<String>,
    pub email_verified: Option<bool>,
}

/// ID token claims (JWT payload)
#[derive(Debug, Deserialize)]
struct IdTokenClaims {
    email: Option<String>,
    name: Option<String>,
    picture: Option<String>,
    email_verified: Option<bool>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH2 STATE WRAPPER FOR TAURI
// ═══════════════════════════════════════════════════════════════════════════════

use std::sync::Arc;
use tokio::sync::RwLock;

/// Thread-safe OAuth2 state for Tauri
pub struct OAuth2ServiceState {
    inner: Arc<RwLock<OAuth2Service>>,
    configs: Arc<RwLock<HashMap<String, OAuth2Config>>>,
}

impl OAuth2ServiceState {
    /// Create new OAuth2 service state
    pub fn new() -> Self {
        Self {
            inner: Arc::new(RwLock::new(OAuth2Service::new())),
            configs: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register OAuth2 configuration for a provider
    pub async fn register_config(&self, key: &str, config: OAuth2Config) {
        let mut configs = self.configs.write().await;
        configs.insert(key.to_string(), config);
    }

    /// Get OAuth2 configuration
    pub async fn get_config(&self, key: &str) -> Option<OAuth2Config> {
        let configs = self.configs.read().await;
        configs.get(key).cloned()
    }

    /// Generate authorization URL
    pub async fn generate_auth_url(&self, key: &str) -> Result<(String, String), String> {
        let config = self.get_config(key).await
            .ok_or_else(|| format!("No OAuth2 config found for '{}'", key))?;
        
        let mut service = self.inner.write().await;
        let (url, state) = service.generate_auth_url(&config);
        Ok((url, state.state))
    }

    /// Exchange authorization code for tokens
    pub async fn exchange_code(
        &self,
        key: &str,
        code: &str,
        state: &str,
    ) -> Result<OAuth2Tokens, String> {
        let config = self.get_config(key).await
            .ok_or_else(|| format!("No OAuth2 config found for '{}'", key))?;
        
        let mut service = self.inner.write().await;
        service.exchange_code(&config, code, state).await
    }

    /// Refresh tokens
    pub async fn refresh_tokens(
        &self,
        key: &str,
        refresh_token: &str,
    ) -> Result<OAuth2Tokens, String> {
        let config = self.get_config(key).await
            .ok_or_else(|| format!("No OAuth2 config found for '{}'", key))?;
        
        let service = self.inner.read().await;
        service.refresh_tokens(&config, refresh_token).await
    }

    /// Parse user info from ID token
    pub async fn parse_id_token(&self, id_token: &str) -> Result<UserInfo, String> {
        let service = self.inner.read().await;
        service.parse_id_token(id_token)
    }

    /// Cleanup expired states
    pub async fn cleanup(&self) {
        let mut service = self.inner.write().await;
        service.cleanup_expired_states();
    }
}

impl Default for OAuth2ServiceState {
    fn default() -> Self {
        Self::new()
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_oauth2_state_creation() {
        let state = OAuth2State::new(OAuth2Provider::Google);
        assert!(!state.state.is_empty());
        assert!(state.code_verifier.is_some());
        assert!(state.code_challenge().is_some());
        assert!(!state.is_expired());
    }

    #[test]
    fn test_oauth2_tokens_xoauth2() {
        let tokens = OAuth2Tokens {
            access_token: "test_token".to_string(),
            refresh_token: Some("refresh_token".to_string()),
            token_type: "Bearer".to_string(),
            expires_in: Some(3600),
            expires_at: Some(Utc::now() + Duration::hours(1)),
            scope: None,
            id_token: None,
        };

        let xoauth2 = tokens.xoauth2_string("test@example.com");
        assert!(xoauth2.contains("user=test@example.com"));
        assert!(xoauth2.contains("auth=Bearer test_token"));
    }

    #[test]
    fn test_oauth2_tokens_expiry() {
        // Not expired
        let tokens = OAuth2Tokens {
            access_token: "test".to_string(),
            refresh_token: None,
            token_type: "Bearer".to_string(),
            expires_in: Some(3600),
            expires_at: Some(Utc::now() + Duration::hours(1)),
            scope: None,
            id_token: None,
        };
        assert!(!tokens.is_expired());

        // Expired
        let expired_tokens = OAuth2Tokens {
            access_token: "test".to_string(),
            refresh_token: None,
            token_type: "Bearer".to_string(),
            expires_in: Some(60),
            expires_at: Some(Utc::now() - Duration::minutes(10)),
            scope: None,
            id_token: None,
        };
        assert!(expired_tokens.is_expired());
    }

    #[test]
    fn test_google_oauth2_config() {
        let config = OAuth2Config::google(
            "client_id".to_string(),
            "client_secret".to_string(),
            "http://localhost:8080/callback".to_string(),
        );
        
        assert_eq!(config.provider, OAuth2Provider::Google);
        assert!(config.scopes.contains(&"https://mail.google.com/".to_string()));
    }

    #[test]
    fn test_microsoft_oauth2_config() {
        let config = OAuth2Config::microsoft(
            "client_id".to_string(),
            "client_secret".to_string(),
            "http://localhost:8080/callback".to_string(),
        );
        
        assert_eq!(config.provider, OAuth2Provider::Microsoft);
        assert!(config.scopes.contains(&"https://outlook.office.com/IMAP.AccessAsUser.All".to_string()));
    }
}
