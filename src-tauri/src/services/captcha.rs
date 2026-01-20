/**
 * CAPTCHA Solver Service
 * 
 * Integrates with 2Captcha API to solve:
 * - reCAPTCHA v2 (image challenge)
 * - reCAPTCHA v3 (score-based)
 * - hCaptcha
 * - Image CAPTCHA
 * 
 * Provides async polling for solutions with configurable timeout.
 */

use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};
use std::time::Duration;
use tokio::time::sleep;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptchaConfig {
    pub api_key: String,
    pub service_url: String,
}

impl Default for CaptchaConfig {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            service_url: "https://2captcha.com".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecaptchaV2Request {
    pub sitekey: String,
    pub page_url: String,
    pub invisible: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecaptchaV3Request {
    pub sitekey: String,
    pub page_url: String,
    pub action: String,
    pub min_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HCaptchaRequest {
    pub sitekey: String,
    pub page_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageCaptchaRequest {
    pub image_base64: String,
    pub case_sensitive: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptchaSolution {
    pub solution: String,
    pub cost: f64,
    pub solve_time_seconds: u64,
}

pub struct CaptchaService {
    config: Arc<RwLock<CaptchaConfig>>,
    client: reqwest::Client,
}

impl CaptchaService {
    pub fn new(config: CaptchaConfig) -> Self {
        Self {
            config: Arc::new(RwLock::new(config)),
            client: reqwest::Client::new(),
        }
    }

    /// Update API configuration
    pub fn set_config(&self, config: CaptchaConfig) {
        if let Ok(mut cfg) = self.config.write() {
            *cfg = config;
        }
    }

    /// Get current config (thread-safe)
    fn get_config(&self) -> CaptchaConfig {
        self.config.read().unwrap().clone()
    }

    /// Solve reCAPTCHA v2
    pub async fn solve_recaptcha_v2(&self, request: RecaptchaV2Request) -> Result<CaptchaSolution, String> {
        let config = self.get_config();
        if config.api_key.is_empty() {
            return Err("2Captcha API key not configured".to_string());
        }

        // Submit CAPTCHA
        let submit_url = format!("{}/in.php", config.service_url);
        let mut params = vec![
            ("key", config.api_key.as_str()),
            ("method", "userrecaptcha"),
            ("googlekey", request.sitekey.as_str()),
            ("pageurl", request.page_url.as_str()),
            ("json", "1"),
        ];

        if request.invisible {
            params.push(("invisible", "1"));
        }

        let start_time = std::time::Instant::now();

        let response = self.client
            .post(&submit_url)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to submit CAPTCHA: {}", e))?;

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if json["status"].as_i64() != Some(1) {
            let error = json["request"].as_str().unwrap_or("Unknown error");
            return Err(format!("2Captcha error: {}", error));
        }

        let captcha_id = json["request"].as_str()
            .ok_or("Missing captcha ID")?;

        // Poll for solution
        let solution = self.poll_solution(captcha_id).await?;
        
        let solve_time = start_time.elapsed().as_secs();

        Ok(CaptchaSolution {
            solution,
            cost: 0.003, // Approximate cost per CAPTCHA
            solve_time_seconds: solve_time,
        })
    }

    /// Solve reCAPTCHA v3
    pub async fn solve_recaptcha_v3(&self, request: RecaptchaV3Request) -> Result<CaptchaSolution, String> {
        let config = self.get_config();
        if config.api_key.is_empty() {
            return Err("2Captcha API key not configured".to_string());
        }

        let submit_url = format!("{}/in.php", config.service_url);
        let min_score_str = request.min_score.to_string();
        let params = vec![
            ("key", config.api_key.as_str()),
            ("method", "userrecaptcha"),
            ("version", "v3"),
            ("googlekey", request.sitekey.as_str()),
            ("pageurl", request.page_url.as_str()),
            ("action", request.action.as_str()),
            ("min_score", min_score_str.as_str()),
            ("json", "1"),
        ];

        let start_time = std::time::Instant::now();

        let response = self.client
            .post(&submit_url)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to submit CAPTCHA: {}", e))?;

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if json["status"].as_i64() != Some(1) {
            let error = json["request"].as_str().unwrap_or("Unknown error");
            return Err(format!("2Captcha error: {}", error));
        }

        let captcha_id = json["request"].as_str()
            .ok_or("Missing captcha ID")?;

        let solution = self.poll_solution(captcha_id).await?;
        let solve_time = start_time.elapsed().as_secs();

        Ok(CaptchaSolution {
            solution,
            cost: 0.003,
            solve_time_seconds: solve_time,
        })
    }

    /// Solve hCaptcha
    pub async fn solve_hcaptcha(&self, request: HCaptchaRequest) -> Result<CaptchaSolution, String> {
        let config = self.get_config();
        if config.api_key.is_empty() {
            return Err("2Captcha API key not configured".to_string());
        }

        let submit_url = format!("{}/in.php", config.service_url);
        let params = vec![
            ("key", config.api_key.as_str()),
            ("method", "hcaptcha"),
            ("sitekey", request.sitekey.as_str()),
            ("pageurl", request.page_url.as_str()),
            ("json", "1"),
        ];

        let start_time = std::time::Instant::now();

        let response = self.client
            .post(&submit_url)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to submit CAPTCHA: {}", e))?;

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if json["status"].as_i64() != Some(1) {
            let error = json["request"].as_str().unwrap_or("Unknown error");
            return Err(format!("2Captcha error: {}", error));
        }

        let captcha_id = json["request"].as_str()
            .ok_or("Missing captcha ID")?;

        let solution = self.poll_solution(captcha_id).await?;
        let solve_time = start_time.elapsed().as_secs();

        Ok(CaptchaSolution {
            solution,
            cost: 0.003,
            solve_time_seconds: solve_time,
        })
    }

    /// Solve image CAPTCHA
    pub async fn solve_image_captcha(&self, request: ImageCaptchaRequest) -> Result<CaptchaSolution, String> {
        let config = self.get_config();
        if config.api_key.is_empty() {
            return Err("2Captcha API key not configured".to_string());
        }

        let submit_url = format!("{}/in.php", config.service_url);
        let mut params = vec![
            ("key", config.api_key.as_str()),
            ("method", "base64"),
            ("body", request.image_base64.as_str()),
            ("json", "1"),
        ];

        if request.case_sensitive {
            params.push(("regsense", "1"));
        }

        let start_time = std::time::Instant::now();

        let response = self.client
            .post(&submit_url)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to submit CAPTCHA: {}", e))?;

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if json["status"].as_i64() != Some(1) {
            let error = json["request"].as_str().unwrap_or("Unknown error");
            return Err(format!("2Captcha error: {}", error));
        }

        let captcha_id = json["request"].as_str()
            .ok_or("Missing captcha ID")?;

        let solution = self.poll_solution(captcha_id).await?;
        let solve_time = start_time.elapsed().as_secs();

        Ok(CaptchaSolution {
            solution,
            cost: 0.001, // Image CAPTCHAs are cheaper
            solve_time_seconds: solve_time,
        })
    }

    /// Poll for CAPTCHA solution
    async fn poll_solution(&self, captcha_id: &str) -> Result<String, String> {
        let config = self.get_config();
        let result_url = format!("{}/res.php", config.service_url);
        let max_attempts = 60; // 60 attempts * 5 seconds = 5 minutes timeout
        
        for _attempt in 0..max_attempts {
            sleep(Duration::from_secs(5)).await;

            let params = vec![
                ("key", config.api_key.as_str()),
                ("action", "get"),
                ("id", captcha_id),
                ("json", "1"),
            ];

            let response = self.client
                .get(&result_url)
                .query(&params)
                .send()
                .await
                .map_err(|e| format!("Failed to poll solution: {}", e))?;

            let json: serde_json::Value = response.json().await
                .map_err(|e| format!("Failed to parse response: {}", e))?;

            if json["status"].as_i64() == Some(1) {
                return json["request"].as_str()
                    .map(|s| s.to_string())
                    .ok_or_else(|| "Missing solution".to_string());
            }

            let error = json["request"].as_str().unwrap_or("");
            if error != "CAPCHA_NOT_READY" {
                return Err(format!("2Captcha error: {}", error));
            }

            // Continue polling if CAPTCHA_NOT_READY
        }

        Err("CAPTCHA solving timeout (5 minutes exceeded)".to_string())
    }

    /// Get account balance
    pub async fn get_balance(&self) -> Result<f64, String> {
        let config = self.get_config();
        if config.api_key.is_empty() {
            return Err("2Captcha API key not configured".to_string());
        }

        let url = format!("{}/res.php", config.service_url);
        let params = vec![
            ("key", config.api_key.as_str()),
            ("action", "getbalance"),
            ("json", "1"),
        ];

        let response = self.client
            .get(&url)
            .query(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to get balance: {}", e))?;

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if json["status"].as_i64() == Some(1) {
            json["request"].as_f64()
                .ok_or("Invalid balance format".to_string())
        } else {
            let error = json["request"].as_str().unwrap_or("Unknown error");
            Err(format!("2Captcha error: {}", error))
        }
    }

    /// Report bad CAPTCHA solution
    pub async fn report_bad(&self, captcha_id: String) -> Result<(), String> {
        let config = self.get_config();
        if config.api_key.is_empty() {
            return Err("2Captcha API key not configured".to_string());
        }

        let url = format!("{}/res.php", config.service_url);
        let params = vec![
            ("key", config.api_key.as_str()),
            ("action", "reportbad"),
            ("id", captcha_id.as_str()),
            ("json", "1"),
        ];

        let response = self.client
            .get(&url)
            .query(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to report bad CAPTCHA: {}", e))?;

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if json["status"].as_i64() == Some(1) {
            Ok(())
        } else {
            let error = json["request"].as_str().unwrap_or("Unknown error");
            Err(format!("2Captcha error: {}", error))
        }
    }
}
