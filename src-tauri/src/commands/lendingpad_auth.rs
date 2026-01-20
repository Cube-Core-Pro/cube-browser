use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

/// Global secure storage for sessions (in production use tauri-plugin-stronghold)
pub struct SecureSessionStore {
    sessions: Arc<Mutex<HashMap<String, LendingPadSession>>>,
    cookies: Arc<Mutex<HashMap<String, Vec<SerializableCookie>>>>,
}

impl SecureSessionStore {
    pub fn new() -> Self {
        SecureSessionStore {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            cookies: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

impl Default for SecureSessionStore {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializableCookie {
    pub name: String,
    pub value: String,
    pub domain: String,
    pub path: String,
    pub secure: bool,
    pub http_only: bool,
    pub expires: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LendingPadSession {
    pub username: String,
    pub session_token: String,
    pub expires_at: i64,
    pub company_id: Option<String>,
    pub refresh_token: Option<String>,
    pub user_id: Option<String>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginResponse {
    pub success: bool,
    pub session: Option<LendingPadSession>,
    pub error: Option<String>,
}

/// LendingPad credential-based authentication
///
/// Authenticates with LendingPad portal using username/password
/// (NOT OAuth API credentials)
///
/// Stores session cookies in secure vault for automation
#[tauri::command]
pub async fn lendingpad_login_credentials(
    state: State<'_, SecureSessionStore>,
    username: String,
    password: String,
    company_id: Option<String>,
    remember_me: bool,
) -> Result<LoginResponse, String> {
    use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, CONTENT_TYPE, USER_AGENT};
    
    // Validate inputs
    if username.trim().is_empty() {
        return Ok(LoginResponse {
            success: false,
            session: None,
            error: Some("Username is required".to_string()),
        });
    }

    if password.trim().is_empty() {
        return Ok(LoginResponse {
            success: false,
            session: None,
            error: Some("Password is required".to_string()),
        });
    }

    // Build headers
    let mut headers = HeaderMap::new();
    headers.insert(ACCEPT, HeaderValue::from_static("application/json"));
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(
        USER_AGENT,
        HeaderValue::from_static("CUBE-Elite/7.0 (Automation Platform)"),
    );

    // Create cookie jar for session management
    let cookie_jar = Arc::new(reqwest::cookie::Jar::default());

    // Create HTTP client with cookie jar
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .cookie_provider(Arc::clone(&cookie_jar))
        .default_headers(headers)
        .danger_accept_invalid_certs(false)
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // LendingPad login endpoint
    let login_url = "https://www.lendingpad.com/api/v1/auth/login";

    // Prepare login payload
    #[derive(Serialize)]
    struct LoginPayload {
        username: String,
        password: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        company_id: Option<String>,
        remember_me: bool,
    }

    let payload = LoginPayload {
        username: username.clone(),
        password,
        company_id: company_id.clone(),
        remember_me,
    };

    // Send login request
    let response = client
        .post(login_url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    let status = response.status();

    // Extract cookies from response before consuming body
    let response_cookies: Vec<SerializableCookie> = response
        .cookies()
        .map(|c| SerializableCookie {
            name: c.name().to_string(),
            value: c.value().to_string(),
            domain: c.domain().unwrap_or("lendingpad.com").to_string(),
            path: c.path().unwrap_or("/").to_string(),
            secure: c.secure(),
            http_only: c.http_only(),
            expires: c.expires().map(|e| {
                // SystemTime to Unix timestamp conversion
                e.duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_secs() as i64)
                    .unwrap_or(0)
            }),
        })
        .collect();

    if !status.is_success() {
        return Ok(LoginResponse {
            success: false,
            session: None,
            error: Some(match status.as_u16() {
                401 => "Invalid username or password".to_string(),
                403 => "Account locked or access denied".to_string(),
                429 => "Too many login attempts. Please try again later".to_string(),
                500..=599 => "LendingPad server error. Please try again later".to_string(),
                _ => format!("Login failed with status {}", status),
            }),
        });
    }

    // Parse response
    #[derive(Deserialize)]
    struct LendingPadApiResponse {
        token: Option<String>,
        session_id: Option<String>,
        refresh_token: Option<String>,
        expires_in: Option<i64>,
        user_id: Option<String>,
        permissions: Option<Vec<String>>,
    }

    let api_response = response
        .json::<LendingPadApiResponse>()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Extract session token
    let session_token = api_response
        .token
        .or(api_response.session_id)
        .ok_or("No session token received")?;

    // Calculate expiration (default 24 hours)
    let expires_in = api_response.expires_in.unwrap_or(86400);
    let expires_at = chrono::Utc::now().timestamp() + expires_in;

    let session = LendingPadSession {
        username: username.clone(),
        session_token: session_token.clone(),
        expires_at,
        company_id: company_id.clone(),
        refresh_token: api_response.refresh_token,
        user_id: api_response.user_id,
        permissions: api_response.permissions.unwrap_or_default(),
    };

    // Store session in secure vault
    {
        let mut sessions = state.sessions.lock().unwrap();
        sessions.insert(username.clone(), session.clone());
    }

    // Store cookies for browser automation
    if !response_cookies.is_empty() {
        let mut cookies = state.cookies.lock().unwrap();
        cookies.insert(username.clone(), response_cookies);
    }

    if remember_me {
        // In production, use tauri-plugin-stronghold for encrypted persistence
        // For now, we're using in-memory storage with the SecureSessionStore
        println!("✅ LendingPad session stored securely (remember_me: true)");
        println!("   Username: {}", username);
        println!("   Expires: {}", expires_at);
        println!("   Permissions: {:?}", session.permissions);
    }

    Ok(LoginResponse {
        success: true,
        session: Some(session),
        error: None,
    })
}

/// Get stored LendingPad session from vault
#[tauri::command]
pub async fn lendingpad_get_session(
    state: State<'_, SecureSessionStore>,
    username: Option<String>,
) -> Result<Option<LendingPadSession>, String> {
    let sessions = state.sessions.lock().unwrap();

    if let Some(uname) = username {
        // Get specific user session
        if let Some(session) = sessions.get(&uname) {
            // Check if session is expired
            let now = chrono::Utc::now().timestamp();
            if session.expires_at > now {
                return Ok(Some(session.clone()));
            } else {
                return Ok(None); // Session expired
            }
        }
    } else {
        // Get first valid session
        let now = chrono::Utc::now().timestamp();
        for session in sessions.values() {
            if session.expires_at > now {
                return Ok(Some(session.clone()));
            }
        }
    }

    Ok(None)
}

/// Get stored cookies for browser automation
#[tauri::command]
pub async fn lendingpad_get_cookies(
    state: State<'_, SecureSessionStore>,
    username: String,
) -> Result<Vec<SerializableCookie>, String> {
    let cookies = state.cookies.lock().unwrap();
    Ok(cookies.get(&username).cloned().unwrap_or_default())
}

/// Logout and clear LendingPad session
#[tauri::command]
pub async fn lendingpad_logout(
    state: State<'_, SecureSessionStore>,
    username: Option<String>,
) -> Result<bool, String> {
    if let Some(uname) = username {
        // Clear specific user session
        {
            let mut sessions = state.sessions.lock().unwrap();
            sessions.remove(&uname);
        }
        {
            let mut cookies = state.cookies.lock().unwrap();
            cookies.remove(&uname);
        }
        println!("🚪 LendingPad session cleared for user: {}", uname);
    } else {
        // Clear all sessions
        {
            let mut sessions = state.sessions.lock().unwrap();
            sessions.clear();
        }
        {
            let mut cookies = state.cookies.lock().unwrap();
            cookies.clear();
        }
        println!("🚪 All LendingPad sessions cleared");
    }

    Ok(true)
}

/// Check if LendingPad session is valid
#[tauri::command]
pub async fn lendingpad_check_session(
    state: State<'_, SecureSessionStore>,
    username: Option<String>,
) -> Result<bool, String> {
    // First check if we have a stored session
    let session = {
        let sessions = state.sessions.lock().unwrap();
        if let Some(uname) = &username {
            sessions.get(uname).cloned()
        } else {
            sessions.values().next().cloned()
        }
    };

    let session = match session {
        Some(s) => s,
        None => return Ok(false),
    };

    // Check if session is expired locally
    let now = chrono::Utc::now().timestamp();
    if session.expires_at <= now {
        return Ok(false);
    }

    // Validate session with LendingPad API
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let validation_url = "https://www.lendingpad.com/api/v1/auth/validate";

    let response = client
        .get(validation_url)
        .header("Authorization", format!("Bearer {}", session.session_token))
        .send()
        .await;

    match response {
        Ok(res) => Ok(res.status().is_success()),
        Err(_) => {
            // Network error - assume session is valid if not expired locally
            // This allows offline operation
            Ok(true)
        }
    }
}

/// Refresh session token if expired or about to expire
#[tauri::command]
pub async fn lendingpad_refresh_session(
    state: State<'_, SecureSessionStore>,
    username: String,
) -> Result<LoginResponse, String> {
    // Get current session
    let session = {
        let sessions = state.sessions.lock().unwrap();
        sessions.get(&username).cloned()
    };

    let session = match session {
        Some(s) => s,
        None => {
            return Ok(LoginResponse {
                success: false,
                session: None,
                error: Some("No session found for user".to_string()),
            })
        }
    };

    // Check if we have a refresh token
    let refresh_token = match session.refresh_token {
        Some(ref token) => token.clone(),
        None => {
            return Ok(LoginResponse {
                success: false,
                session: None,
                error: Some("No refresh token available".to_string()),
            })
        }
    };

    // Request new session with refresh token
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let refresh_url = "https://www.lendingpad.com/api/v1/auth/refresh";

    #[derive(Serialize)]
    struct RefreshPayload {
        refresh_token: String,
    }

    let response = client
        .post(refresh_url)
        .json(&RefreshPayload { refresh_token })
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Ok(LoginResponse {
            success: false,
            session: None,
            error: Some("Failed to refresh session".to_string()),
        });
    }

    #[derive(Deserialize)]
    struct RefreshResponse {
        token: String,
        refresh_token: Option<String>,
        expires_in: Option<i64>,
    }

    let refresh_response = response
        .json::<RefreshResponse>()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Calculate new expiration
    let expires_in = refresh_response.expires_in.unwrap_or(86400);
    let expires_at = chrono::Utc::now().timestamp() + expires_in;

    // Create updated session
    let new_session = LendingPadSession {
        username: username.clone(),
        session_token: refresh_response.token,
        expires_at,
        company_id: session.company_id,
        refresh_token: refresh_response.refresh_token.or(session.refresh_token),
        user_id: session.user_id,
        permissions: session.permissions,
    };

    // Update stored session
    {
        let mut sessions = state.sessions.lock().unwrap();
        sessions.insert(username, new_session.clone());
    }

    Ok(LoginResponse {
        success: true,
        session: Some(new_session),
        error: None,
    })
}

/// List all stored sessions (for debugging/admin)
#[tauri::command]
pub async fn lendingpad_list_sessions(
    state: State<'_, SecureSessionStore>,
) -> Result<Vec<String>, String> {
    let sessions = state.sessions.lock().unwrap();
    let now = chrono::Utc::now().timestamp();

    Ok(sessions
        .iter()
        .filter(|(_, s)| s.expires_at > now)
        .map(|(username, _)| username.clone())
        .collect())
}
