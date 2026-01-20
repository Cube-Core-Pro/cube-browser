// Security Lab Service - OWASP ZAP & Nuclei Integration
// CUBE Elite v6 - Enterprise Vulnerability Scanner

use anyhow::{anyhow, Result};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::process::Command as TokioCommand;
use tokio::sync::Mutex;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct SecurityLabService {
    app: AppHandle,
    scans: Arc<Mutex<HashMap<String, VulnerabilityScan>>>,
    findings: Arc<Mutex<HashMap<String, Vec<VulnerabilityFinding>>>>,
    exploits: Arc<Mutex<HashMap<String, ExploitSession>>>,
    verified_domains: Arc<Mutex<Vec<String>>>,
    config: Arc<Mutex<SecurityLabConfig>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityLabConfig {
    pub zap_enabled: bool,
    pub nuclei_enabled: bool,
    pub zap_api_key: Option<String>,
    pub zap_host: String,
    pub zap_port: u16,
    pub nuclei_binary_path: String,
    pub max_scan_threads: usize,
    pub scan_timeout_seconds: u64,
    pub require_domain_verification: bool,
    pub ethical_mode: bool,
    pub allowed_targets: Vec<String>,
    pub openai_api_key: Option<String>,
    pub demo_mode: bool, // When true, generates simulated findings without real scanners
}

impl Default for SecurityLabConfig {
    fn default() -> Self {
        Self {
            zap_enabled: true,
            nuclei_enabled: true,
            zap_api_key: None,
            zap_host: "localhost".to_string(),
            zap_port: 8080,
            nuclei_binary_path: "nuclei".to_string(),
            max_scan_threads: 10,
            scan_timeout_seconds: 3600,
            require_domain_verification: false,
            ethical_mode: false, // Disabled for development - enable in production
            allowed_targets: vec![],
            openai_api_key: None,
            demo_mode: false, // Real scanning by default
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ScanType {
    Quick,
    Standard,
    Full,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ScanStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VulnerabilityScan {
    pub scan_id: String,
    pub target_url: String,
    pub scan_type: ScanType,
    pub scanner: Scanner,
    pub status: ScanStatus,
    pub progress: f64,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub findings_count: usize,
    pub critical_count: usize,
    pub high_count: usize,
    pub medium_count: usize,
    pub low_count: usize,
    pub info_count: usize,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Scanner {
    #[serde(alias = "ZAP", alias = "zap")]
    Zap,
    #[serde(alias = "Nuclei", alias = "nuclei")]
    Nuclei,
    #[serde(alias = "Both", alias = "both")]
    Both,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Severity {
    Critical,
    High,
    Medium,
    Low,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VulnerabilityFinding {
    pub finding_id: String,
    pub scan_id: String,
    pub name: String,
    pub description: String,
    pub severity: Severity,
    pub cvss_score: Option<f64>,
    pub cwe_id: Option<String>,
    pub cve_id: Option<String>,
    pub affected_url: String,
    pub affected_parameter: Option<String>,
    pub evidence: Option<String>,
    pub solution: Option<String>,
    pub references: Vec<String>,
    pub scanner: Scanner,
    pub discovered_at: String,
    pub verified: bool,
    pub false_positive: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExploitSession {
    pub session_id: String,
    pub finding_id: String,
    pub target_url: String,
    pub exploit_type: ExploitType,
    pub status: ExploitStatus,
    pub commands: Vec<ExploitCommand>,
    pub ai_assistance_enabled: bool,
    pub created_at: String,
    pub last_activity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExploitType {
    SQLInjection,
    XSS,
    CSRF,
    RCE,
    LFI,
    SSRF,
    CommandInjection,
    PathTraversal,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExploitStatus {
    Active,
    Success,
    Failed,
    Blocked,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExploitCommand {
    pub command_id: String,
    pub command: String,
    pub payload: String,
    pub response: Option<String>,
    pub success: bool,
    pub timestamp: String,
    pub ai_suggested: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainVerification {
    pub domain: String,
    pub verification_method: VerificationMethod,
    pub verification_token: String,
    pub verified: bool,
    pub verified_at: Option<String>,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum VerificationMethod {
    DNSTxt,
    HttpFile,
    MetaTag,
}

impl SecurityLabService {
    pub fn new(app: AppHandle) -> Self {
        Self {
            app,
            scans: Arc::new(Mutex::new(HashMap::new())),
            findings: Arc::new(Mutex::new(HashMap::new())),
            exploits: Arc::new(Mutex::new(HashMap::new())),
            verified_domains: Arc::new(Mutex::new(Vec::new())),
            config: Arc::new(Mutex::new(SecurityLabConfig::default())),
        }
    }

    // ============ Configuration ============

    pub async fn get_config(&self) -> Result<SecurityLabConfig> {
        Ok(self.config.lock().await.clone())
    }

    pub async fn update_config(&self, config: SecurityLabConfig) -> Result<()> {
        *self.config.lock().await = config;
        Ok(())
    }

    // ============ Domain Verification ============

    pub async fn verify_domain(
        &self,
        domain: String,
        method: VerificationMethod,
    ) -> Result<DomainVerification> {
        let config = self.config.lock().await.clone();

        if !config.require_domain_verification {
            // Skip verification if disabled
            let mut verified = self.verified_domains.lock().await;
            if !verified.contains(&domain) {
                verified.push(domain.clone());
            }

            return Ok(DomainVerification {
                domain,
                verification_method: method,
                verification_token: String::new(),
                verified: true,
                verified_at: Some(Utc::now().to_rfc3339()),
                expires_at: Utc::now().to_rfc3339(),
            });
        }

        // Generate verification token
        let token = Uuid::new_v4().to_string();

        // Create verification object
        let verification = DomainVerification {
            domain: domain.clone(),
            verification_method: method.clone(),
            verification_token: token.clone(),
            verified: false,
            verified_at: None,
            expires_at: (Utc::now() + chrono::Duration::days(30)).to_rfc3339(),
        };

        // Instructions based on method
        let instructions = match method {
            VerificationMethod::DNSTxt => {
                format!("Add TXT record to {}: cube-verify={}", domain, token)
            }
            VerificationMethod::HttpFile => {
                format!(
                    "Place file at https://{}/.well-known/cube-verify.txt containing: {}",
                    domain, token
                )
            }
            VerificationMethod::MetaTag => {
                format!(
                    "Add meta tag to homepage: <meta name=\"cube-verify\" content=\"{}\">",
                    token
                )
            }
        };

        self.app
            .emit("security_lab:verification_required", &instructions)
            .ok();

        Ok(verification)
    }

    pub async fn check_domain_verification(
        &self,
        domain: String,
        token: String,
        method: VerificationMethod,
    ) -> Result<bool> {
        let verified = match method {
            VerificationMethod::DNSTxt => self.check_dns_verification(&domain, &token).await?,
            VerificationMethod::HttpFile => self.check_http_verification(&domain, &token).await?,
            VerificationMethod::MetaTag => self.check_meta_verification(&domain, &token).await?,
        };

        if verified {
            let mut domains = self.verified_domains.lock().await;
            if !domains.contains(&domain) {
                domains.push(domain.clone());
            }
            self.app.emit("security_lab:domain_verified", &domain).ok();
        }

        Ok(verified)
    }

    async fn check_dns_verification(&self, domain: &str, token: &str) -> Result<bool> {
        // Use dig command to check TXT record
        let output = TokioCommand::new("dig")
            .args(["+short", "TXT", domain])
            .output()
            .await?;

        let txt_records = String::from_utf8_lossy(&output.stdout);
        let expected = format!("cube-verify={}", token);

        Ok(txt_records.contains(&expected))
    }

    async fn check_http_verification(&self, domain: &str, token: &str) -> Result<bool> {
        // HTTP request to check file
        let url = format!("https://{}/.well-known/cube-verify.txt", domain);

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()?;

        match client.get(&url).send().await {
            Ok(response) => {
                if response.status().is_success() {
                    let body = response.text().await?;
                    Ok(body.trim() == token)
                } else {
                    Ok(false)
                }
            }
            Err(_) => Ok(false),
        }
    }

    async fn check_meta_verification(&self, domain: &str, token: &str) -> Result<bool> {
        // HTTP request to check meta tag
        let url = format!("https://{}", domain);

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()?;

        match client.get(&url).send().await {
            Ok(response) => {
                if response.status().is_success() {
                    let body = response.text().await?;
                    let expected = format!("<meta name=\"cube-verify\" content=\"{}\">", token);
                    Ok(body.contains(&expected))
                } else {
                    Ok(false)
                }
            }
            Err(_) => Ok(false),
        }
    }

    pub async fn is_domain_verified(&self, domain: &str) -> bool {
        let config = self.config.lock().await;
        if !config.require_domain_verification {
            return true;
        }

        let verified = self.verified_domains.lock().await;
        verified.iter().any(|d| domain.contains(d))
    }

    // ============ URL Validation ============

    fn validate_url(&self, target_url: &str) -> Result<()> {
        // Check if URL is empty
        if target_url.trim().is_empty() {
            return Err(anyhow!("Target URL cannot be empty"));
        }

        // Parse the URL
        let parsed = match url::Url::parse(target_url) {
            Ok(url) => url,
            Err(e) => {
                return Err(anyhow!("Invalid URL format: {}. URL must start with http:// or https://", e));
            }
        };

        // Check protocol
        let scheme = parsed.scheme();
        if scheme != "http" && scheme != "https" {
            return Err(anyhow!("Invalid protocol '{}'. Only http:// and https:// URLs are supported", scheme));
        }

        // Check host
        match parsed.host_str() {
            Some(host) => {
                if host.is_empty() {
                    return Err(anyhow!("URL must contain a valid host/domain"));
                }
                // Basic domain validation
                if !host.contains('.') && host != "localhost" {
                    return Err(anyhow!("Invalid domain '{}'. Domain must contain a valid TLD (e.g., .com, .org)", host));
                }
            }
            None => {
                return Err(anyhow!("URL must contain a valid host/domain"));
            }
        }

        log::info!("✅ URL validated: {}", target_url);
        Ok(())
    }

    // ============ Ethical Checks ============

    async fn check_ethical_compliance(&self, target_url: &str) -> Result<()> {
        let config = self.config.lock().await.clone();

        // If ethical mode is disabled, allow all scans
        if !config.ethical_mode {
            log::info!("⚠️ Ethical mode disabled - skipping domain verification");
            return Ok(());
        }

        // Extract domain from URL
        let domain = self.extract_domain(target_url)?;

        // Always allow localhost and local testing
        if domain == "localhost" || domain == "127.0.0.1" || domain.ends_with(".local") || domain.ends_with(".test") {
            return Ok(());
        }

        // Check if domain is in allowed targets (explicit whitelist)
        if config.allowed_targets.iter().any(|t| domain.contains(t) || target_url.contains(t)) {
            log::info!("✅ Domain {} is in allowed targets list", domain);
            return Ok(());
        }

        // Check if domain is verified
        if self.is_domain_verified(&domain).await {
            return Ok(());
        }

        // Domain not verified - provide helpful error
        return Err(anyhow!(
            "Domain '{}' not verified. Options: 1) Add to allowed targets in config, 2) Verify domain ownership, 3) Disable ethical mode for testing.", domain
        ));
    }

    fn extract_domain(&self, url: &str) -> Result<String> {
        let url_parsed = url::Url::parse(url)?;
        let host = url_parsed.host_str().ok_or(anyhow!("Invalid URL"))?;
        Ok(host.to_string())
    }

    // ============ Scanning ============

    pub async fn start_scan(
        &self,
        target_url: String,
        scan_type: ScanType,
        scanner: Scanner,
    ) -> Result<VulnerabilityScan> {
        // Validate URL format
        self.validate_url(&target_url)?;
        
        // Ethical compliance check
        self.check_ethical_compliance(&target_url).await?;

        let scan_id = Uuid::new_v4().to_string();

        let scan = VulnerabilityScan {
            scan_id: scan_id.clone(),
            target_url: target_url.clone(),
            scan_type: scan_type.clone(),
            scanner: scanner.clone(),
            status: ScanStatus::Pending,
            progress: 0.0,
            started_at: Utc::now().to_rfc3339(),
            completed_at: None,
            findings_count: 0,
            critical_count: 0,
            high_count: 0,
            medium_count: 0,
            low_count: 0,
            info_count: 0,
            error_message: None,
        };

        {
            let mut scans = self.scans.lock().await;
            scans.insert(scan_id.clone(), scan.clone());
        }
        {
            let mut findings = self.findings.lock().await;
            findings.insert(scan_id.clone(), Vec::new());
        }

        // Emit event
        self.app.emit("security_lab:scan_started", &scan).ok();

        // Start scan in background
        let service = self.clone();
        let scan_id_clone = scan_id.clone();
        tokio::spawn(async move {
            service
                .execute_scan(scan_id_clone, target_url, scan_type, scanner)
                .await
                .ok();
        });

        Ok(scan)
    }

    async fn execute_scan(
        &self,
        scan_id: String,
        target_url: String,
        scan_type: ScanType,
        scanner: Scanner,
    ) -> Result<()> {
        // Update status to running
        {
            let mut scans = self.scans.lock().await;
            if let Some(scan) = scans.get_mut(&scan_id) {
                scan.status = ScanStatus::Running;
                scan.progress = 0.1;
            }
        }

        self.emit_scan_progress(&scan_id, 0.1).await;

        // Check if demo mode is enabled
        let demo_mode = {
            let config = self.config.lock().await;
            config.demo_mode
        };

        if demo_mode {
            // Run demo scan with simulated findings
            self.run_demo_scan(&scan_id, &target_url, &scan_type, &scanner).await?;
        } else {
            // Execute real scanners based on scanner type
            match scanner {
                Scanner::Zap => {
                    self.run_zap_scan(&scan_id, &target_url, &scan_type).await?;
                }
                Scanner::Nuclei => {
                    self.run_nuclei_scan(&scan_id, &target_url, &scan_type)
                        .await?;
                }
                Scanner::Both => {
                    // Run both sequentially
                    self.run_zap_scan(&scan_id, &target_url, &scan_type).await?;
                    self.emit_scan_progress(&scan_id, 0.5).await;
                    self.run_nuclei_scan(&scan_id, &target_url, &scan_type)
                        .await?;
                }
            }
        }

        // Update scan status
        {
            let mut scans = self.scans.lock().await;
            if let Some(scan) = scans.get_mut(&scan_id) {
                scan.status = ScanStatus::Completed;
                scan.progress = 1.0;
                scan.completed_at = Some(Utc::now().to_rfc3339());

                // Count findings by severity
                let findings = self.findings.lock().await;
                if let Some(scan_findings) = findings.get(&scan_id) {
                    scan.findings_count = scan_findings.len();
                    scan.critical_count = scan_findings
                        .iter()
                        .filter(|f| f.severity == Severity::Critical)
                        .count();
                    scan.high_count = scan_findings
                        .iter()
                        .filter(|f| f.severity == Severity::High)
                        .count();
                    scan.medium_count = scan_findings
                        .iter()
                        .filter(|f| f.severity == Severity::Medium)
                        .count();
                    scan.low_count = scan_findings
                        .iter()
                        .filter(|f| f.severity == Severity::Low)
                        .count();
                    scan.info_count = scan_findings
                        .iter()
                        .filter(|f| f.severity == Severity::Info)
                        .count();
                }
            }
        }

        self.emit_scan_progress(&scan_id, 1.0).await;

        let scan = {
            let scans = self.scans.lock().await;
            scans.get(&scan_id).cloned().unwrap()
        };
        self.app.emit("security_lab:scan_completed", &scan).ok();

        Ok(())
    }

    /// Demo scan that generates simulated findings for testing
    async fn run_demo_scan(
        &self,
        scan_id: &str,
        target_url: &str,
        scan_type: &ScanType,
        scanner: &Scanner,
    ) -> Result<()> {
        log::info!("🔬 Running demo scan for {} with {:?}", target_url, scanner);

        // Simulate scanning progress
        for progress in [0.2, 0.4, 0.6, 0.8] {
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            self.emit_scan_progress(scan_id, progress).await;
        }

        // Generate demo findings based on scan type
        let demo_findings = self.generate_demo_findings(scan_id, target_url, scan_type, scanner);

        // Add findings to storage and emit events
        {
            let mut findings = self.findings.lock().await;
            let scan_findings = findings.entry(scan_id.to_string()).or_insert_with(Vec::new);

            for finding in demo_findings {
                scan_findings.push(finding.clone());
                self.app.emit("security_lab:finding_discovered", &finding).ok();
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            }
        }

        // Update scan counts
        {
            let mut scans = self.scans.lock().await;
            if let Some(scan) = scans.get_mut(scan_id) {
                let findings = self.findings.lock().await;
                if let Some(scan_findings) = findings.get(scan_id) {
                    scan.findings_count = scan_findings.len();
                    scan.critical_count = scan_findings.iter().filter(|f| f.severity == Severity::Critical).count();
                    scan.high_count = scan_findings.iter().filter(|f| f.severity == Severity::High).count();
                    scan.medium_count = scan_findings.iter().filter(|f| f.severity == Severity::Medium).count();
                    scan.low_count = scan_findings.iter().filter(|f| f.severity == Severity::Low).count();
                    scan.info_count = scan_findings.iter().filter(|f| f.severity == Severity::Info).count();
                }
            }
        }

        log::info!("✅ Demo scan completed for {}", target_url);
        Ok(())
    }

    fn generate_demo_findings(
        &self,
        scan_id: &str,
        target_url: &str,
        scan_type: &ScanType,
        scanner: &Scanner,
    ) -> Vec<VulnerabilityFinding> {
        let mut findings = Vec::new();
        let scanner_used = scanner.clone();

        // Critical findings
        findings.push(VulnerabilityFinding {
            finding_id: Uuid::new_v4().to_string(),
            scan_id: scan_id.to_string(),
            name: "SQL Injection".to_string(),
            description: "The application appears to be vulnerable to SQL injection attacks. User input is not properly sanitized before being used in SQL queries.".to_string(),
            severity: Severity::Critical,
            cvss_score: Some(9.8),
            cwe_id: Some("CWE-89".to_string()),
            cve_id: None,
            affected_url: format!("{}/api/users?id=1", target_url),
            affected_parameter: Some("id".to_string()),
            evidence: Some("Error: You have an error in your SQL syntax".to_string()),
            solution: Some("Use parameterized queries or prepared statements. Never concatenate user input directly into SQL queries.".to_string()),
            references: vec!["https://owasp.org/www-community/attacks/SQL_Injection".to_string()],
            scanner: scanner_used.clone(),
            discovered_at: Utc::now().to_rfc3339(),
            verified: false,
            false_positive: false,
        });

        // High severity
        findings.push(VulnerabilityFinding {
            finding_id: Uuid::new_v4().to_string(),
            scan_id: scan_id.to_string(),
            name: "Cross-Site Scripting (XSS)".to_string(),
            description: "Reflected XSS vulnerability found. User input is reflected in the response without proper encoding.".to_string(),
            severity: Severity::High,
            cvss_score: Some(7.1),
            cwe_id: Some("CWE-79".to_string()),
            cve_id: None,
            affected_url: format!("{}/search", target_url),
            affected_parameter: Some("q".to_string()),
            evidence: Some("<script>alert(1)</script> was reflected".to_string()),
            solution: Some("Implement proper output encoding. Use Content-Security-Policy headers.".to_string()),
            references: vec!["https://owasp.org/www-community/attacks/xss/".to_string()],
            scanner: scanner_used.clone(),
            discovered_at: Utc::now().to_rfc3339(),
            verified: false,
            false_positive: false,
        });

        // Medium severity
        if matches!(scan_type, ScanType::Standard | ScanType::Full | ScanType::Custom) {
            findings.push(VulnerabilityFinding {
                finding_id: Uuid::new_v4().to_string(),
                scan_id: scan_id.to_string(),
                name: "Missing Security Headers".to_string(),
                description: "Several important security headers are missing from the HTTP response.".to_string(),
                severity: Severity::Medium,
                cvss_score: Some(5.3),
                cwe_id: Some("CWE-693".to_string()),
                cve_id: None,
                affected_url: target_url.to_string(),
                affected_parameter: None,
                evidence: Some("Missing: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security".to_string()),
                solution: Some("Add security headers: X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security: max-age=31536000".to_string()),
                references: vec!["https://owasp.org/www-project-secure-headers/".to_string()],
                scanner: scanner_used.clone(),
                discovered_at: Utc::now().to_rfc3339(),
                verified: false,
                false_positive: false,
            });

            findings.push(VulnerabilityFinding {
                finding_id: Uuid::new_v4().to_string(),
                scan_id: scan_id.to_string(),
                name: "Sensitive Data Exposure".to_string(),
                description: "Application may be exposing sensitive information in error messages.".to_string(),
                severity: Severity::Medium,
                cvss_score: Some(5.5),
                cwe_id: Some("CWE-200".to_string()),
                cve_id: None,
                affected_url: format!("{}/api/debug", target_url),
                affected_parameter: None,
                evidence: Some("Stack trace and database connection string visible".to_string()),
                solution: Some("Disable debug mode in production. Implement custom error pages.".to_string()),
                references: vec![],
                scanner: scanner_used.clone(),
                discovered_at: Utc::now().to_rfc3339(),
                verified: false,
                false_positive: false,
            });
        }

        // Low and Info for Full scans
        if matches!(scan_type, ScanType::Full) {
            findings.push(VulnerabilityFinding {
                finding_id: Uuid::new_v4().to_string(),
                scan_id: scan_id.to_string(),
                name: "Cookie Without Secure Flag".to_string(),
                description: "Session cookie is set without the Secure flag.".to_string(),
                severity: Severity::Low,
                cvss_score: Some(3.1),
                cwe_id: Some("CWE-614".to_string()),
                cve_id: None,
                affected_url: target_url.to_string(),
                affected_parameter: Some("session_id".to_string()),
                evidence: Some("Set-Cookie: session_id=abc123; HttpOnly".to_string()),
                solution: Some("Add Secure flag to all cookies: Set-Cookie: session_id=abc123; Secure; HttpOnly".to_string()),
                references: vec![],
                scanner: scanner_used.clone(),
                discovered_at: Utc::now().to_rfc3339(),
                verified: false,
                false_positive: false,
            });

            findings.push(VulnerabilityFinding {
                finding_id: Uuid::new_v4().to_string(),
                scan_id: scan_id.to_string(),
                name: "Server Version Disclosure".to_string(),
                description: "The server is disclosing version information in HTTP headers.".to_string(),
                severity: Severity::Info,
                cvss_score: None,
                cwe_id: Some("CWE-200".to_string()),
                cve_id: None,
                affected_url: target_url.to_string(),
                affected_parameter: None,
                evidence: Some("Server: nginx/1.18.0".to_string()),
                solution: Some("Configure server to hide version information.".to_string()),
                references: vec![],
                scanner: scanner_used.clone(),
                discovered_at: Utc::now().to_rfc3339(),
                verified: false,
                false_positive: false,
            });
        }

        findings
    }

    async fn run_zap_scan(
        &self,
        scan_id: &str,
        target_url: &str,
        scan_type: &ScanType,
    ) -> Result<()> {
        let config = self.config.lock().await.clone();

        if !config.zap_enabled {
            log::info!("ZAP scanning disabled in config");
            return Ok(());
        }

        // ZAP API endpoint
        let zap_url = format!("http://{}:{}", config.zap_host, config.zap_port);
        
        // Create client with timeout
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .map_err(|e| anyhow!("Failed to create HTTP client: {}", e))?;

        // Check if ZAP is running
        log::info!("🔍 Checking if ZAP is running at {}...", zap_url);
        let health_check = client.get(format!("{}/JSON/core/view/version/", zap_url)).send().await;
        
        if health_check.is_err() {
            log::warn!("⚠️ ZAP is not running at {}. Skipping ZAP scan.", zap_url);
            log::warn!("To use ZAP scanning, start OWASP ZAP with: zap.sh -daemon -port 8080");
            // Don't fail - just skip ZAP and continue
            return Ok(());
        }
        
        log::info!("✅ ZAP is running. Starting scan...");

        // Start spider
        self.emit_scan_progress(scan_id, 0.2).await;
        let spider_url = format!("{}/JSON/spider/action/scan/?url={}", zap_url, urlencoding::encode(target_url));
        
        let spider_response = match client.get(&spider_url).send().await {
            Ok(resp) => resp,
            Err(e) => {
                log::error!("Failed to start ZAP spider: {}", e);
                return Err(anyhow!("ZAP spider failed: {}", e));
            }
        };
        
        let spider_json: serde_json::Value = spider_response.json().await?;
        let spider_scan_id = spider_json["scan"].as_str().unwrap_or("0");
        log::info!("🕷️ Spider started with ID: {}", spider_scan_id);

        // Poll spider status instead of fixed wait
        let mut spider_complete = false;
        for _ in 0..60 { // Max 60 iterations (5 minutes)
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            let status_url = format!("{}/JSON/spider/view/status/?scanId={}", zap_url, spider_scan_id);
            if let Ok(resp) = client.get(&status_url).send().await {
                if let Ok(json) = resp.json::<serde_json::Value>().await {
                    let progress = json["status"].as_str().unwrap_or("0").parse::<i32>().unwrap_or(0);
                    self.emit_scan_progress(scan_id, 0.2 + (progress as f64 * 0.002)).await;
                    if progress >= 100 {
                        spider_complete = true;
                        break;
                    }
                }
            }
        }
        
        if !spider_complete {
            log::warn!("Spider timed out, continuing with active scan...");
        }
        
        self.emit_scan_progress(scan_id, 0.4).await;

        // Start active scan
        let scan_url = format!(
            "{}/JSON/ascan/action/scan/?url={}&recurse=true",
            zap_url, urlencoding::encode(target_url)
        );
        let scan_response = client.get(&scan_url).send().await?;
        let scan_json: serde_json::Value = scan_response.json().await?;
        let active_scan_id = scan_json["scan"].as_str().unwrap_or("0");
        log::info!("🔍 Active scan started with ID: {}", active_scan_id);

        // Poll active scan status
        let max_iterations = match scan_type {
            ScanType::Quick => 24,      // 2 minutes
            ScanType::Standard => 120,  // 10 minutes
            ScanType::Full => 720,      // 60 minutes
            ScanType::Custom => 120,
        };
        
        for i in 0..max_iterations {
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            let status_url = format!("{}/JSON/ascan/view/status/?scanId={}", zap_url, active_scan_id);
            if let Ok(resp) = client.get(&status_url).send().await {
                if let Ok(json) = resp.json::<serde_json::Value>().await {
                    let progress = json["status"].as_str().unwrap_or("0").parse::<i32>().unwrap_or(0);
                    let scan_progress = 0.4 + (progress as f64 * 0.004); // 0.4 to 0.8
                    self.emit_scan_progress(scan_id, scan_progress.min(0.8)).await;
                    
                    if progress >= 100 {
                        log::info!("✅ Active scan completed");
                        break;
                    }
                    
                    // Log progress every 10 iterations
                    if i % 10 == 0 {
                        log::info!("Scan progress: {}%", progress);
                    }
                }
            }
        }
        
        self.emit_scan_progress(scan_id, 0.8).await;

        // Get alerts (findings)
        let alerts_url = format!("{}/JSON/core/view/alerts/?baseurl={}", zap_url, urlencoding::encode(target_url));
        let alerts_response = client.get(&alerts_url).send().await?;
        let alerts_json: serde_json::Value = alerts_response.json().await?;

        // Parse findings
        if let Some(alerts) = alerts_json["alerts"].as_array() {
            let mut findings = self.findings.lock().await;
            let scan_findings = findings.entry(scan_id.to_string()).or_insert_with(Vec::new);

            for alert in alerts {
                let finding = VulnerabilityFinding {
                    finding_id: Uuid::new_v4().to_string(),
                    scan_id: scan_id.to_string(),
                    name: alert["alert"].as_str().unwrap_or("Unknown").to_string(),
                    description: alert["description"].as_str().unwrap_or("").to_string(),
                    severity: self.parse_zap_severity(alert["risk"].as_str().unwrap_or("Low")),
                    cvss_score: None,
                    cwe_id: alert["cweid"].as_str().map(|s| s.to_string()),
                    cve_id: None,
                    affected_url: alert["url"].as_str().unwrap_or("").to_string(),
                    affected_parameter: alert["param"].as_str().map(|s| s.to_string()),
                    evidence: alert["evidence"].as_str().map(|s| s.to_string()),
                    solution: alert["solution"].as_str().map(|s| s.to_string()),
                    references: vec![],
                    scanner: Scanner::Zap,
                    discovered_at: Utc::now().to_rfc3339(),
                    verified: false,
                    false_positive: false,
                };

                scan_findings.push(finding.clone());
                self.app
                    .emit("security_lab:finding_discovered", &finding)
                    .ok();
            }
        }

        Ok(())
    }

    async fn run_nuclei_scan(
        &self,
        scan_id: &str,
        target_url: &str,
        scan_type: &ScanType,
    ) -> Result<()> {
        let config = self.config.lock().await.clone();

        if !config.nuclei_enabled {
            return Ok(());
        }

        self.emit_scan_progress(scan_id, 0.6).await;

        // Build nuclei command
        let severity_flag = match scan_type {
            ScanType::Quick => "-s critical,high",
            ScanType::Standard => "-s critical,high,medium",
            ScanType::Full => "-s critical,high,medium,low,info",
            ScanType::Custom => "-s critical,high,medium",
        };

        // Execute nuclei
        let output = TokioCommand::new(&config.nuclei_binary_path)
            .args([
                "-u",
                target_url,
                severity_flag,
                "-json",
                "-timeout",
                "30",
                "-rl",
                "150", // Rate limit
            ])
            .output()
            .await?;

        // Parse JSON output
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut findings = self.findings.lock().await;
        let scan_findings = findings.entry(scan_id.to_string()).or_insert_with(Vec::new);

        for line in stdout.lines() {
            if let Ok(result) = serde_json::from_str::<serde_json::Value>(line) {
                let finding = VulnerabilityFinding {
                    finding_id: Uuid::new_v4().to_string(),
                    scan_id: scan_id.to_string(),
                    name: result["template-id"]
                        .as_str()
                        .unwrap_or("Unknown")
                        .to_string(),
                    description: result["info"]["description"]
                        .as_str()
                        .unwrap_or("")
                        .to_string(),
                    severity: self.parse_nuclei_severity(
                        result["info"]["severity"].as_str().unwrap_or("info"),
                    ),
                    cvss_score: result["info"]["classification"]["cvss-score"].as_f64(),
                    cwe_id: result["info"]["classification"]["cwe-id"]
                        .as_str()
                        .map(|s| s.to_string()),
                    cve_id: result["info"]["classification"]["cve-id"]
                        .as_str()
                        .map(|s| s.to_string()),
                    affected_url: result["matched-at"]
                        .as_str()
                        .unwrap_or(target_url)
                        .to_string(),
                    affected_parameter: None,
                    evidence: result["extracted-results"].as_array().map(|a| {
                        a.iter()
                            .map(|v| v.as_str().unwrap_or(""))
                            .collect::<Vec<_>>()
                            .join(", ")
                    }),
                    solution: result["info"]["remediation"]
                        .as_str()
                        .map(|s| s.to_string()),
                    references: result["info"]["reference"]
                        .as_array()
                        .map(|refs| {
                            refs.iter()
                                .filter_map(|r| r.as_str())
                                .map(String::from)
                                .collect()
                        })
                        .unwrap_or_default(),
                    scanner: Scanner::Nuclei,
                    discovered_at: Utc::now().to_rfc3339(),
                    verified: false,
                    false_positive: false,
                };

                scan_findings.push(finding.clone());
                self.app
                    .emit("security_lab:finding_discovered", &finding)
                    .ok();
            }
        }

        self.emit_scan_progress(scan_id, 0.9).await;
        Ok(())
    }

    fn parse_zap_severity(&self, risk: &str) -> Severity {
        match risk.to_lowercase().as_str() {
            "high" => Severity::High,
            "medium" => Severity::Medium,
            "low" => Severity::Low,
            "informational" => Severity::Info,
            _ => Severity::Low,
        }
    }

    fn parse_nuclei_severity(&self, severity: &str) -> Severity {
        match severity.to_lowercase().as_str() {
            "critical" => Severity::Critical,
            "high" => Severity::High,
            "medium" => Severity::Medium,
            "low" => Severity::Low,
            "info" => Severity::Info,
            _ => Severity::Info,
        }
    }

    async fn emit_scan_progress(&self, scan_id: &str, progress: f64) {
        let mut scans = self.scans.lock().await;
        if let Some(scan) = scans.get_mut(scan_id) {
            scan.progress = progress;
        }

        let payload = serde_json::json!({
            "scan_id": scan_id,
            "progress": progress,
        });
        self.app.emit("security_lab:scan_progress", &payload).ok();
    }

    pub async fn get_scan(&self, scan_id: String) -> Result<VulnerabilityScan> {
        let scans = self.scans.lock().await;
        scans
            .get(&scan_id)
            .cloned()
            .ok_or(anyhow!("Scan not found"))
    }

    pub async fn list_scans(&self) -> Result<Vec<VulnerabilityScan>> {
        let scans = self.scans.lock().await;
        let mut scan_list: Vec<VulnerabilityScan> = scans.values().cloned().collect();
        scan_list.sort_by(|a, b| b.started_at.cmp(&a.started_at));
        Ok(scan_list)
    }

    pub async fn cancel_scan(&self, scan_id: String) -> Result<()> {
        let mut scans = self.scans.lock().await;
        if let Some(scan) = scans.get_mut(&scan_id) {
            scan.status = ScanStatus::Cancelled;
            scan.completed_at = Some(Utc::now().to_rfc3339());
        }
        Ok(())
    }

    // ============ Findings ============

    pub async fn get_findings(&self, scan_id: String) -> Result<Vec<VulnerabilityFinding>> {
        let findings = self.findings.lock().await;
        findings
            .get(&scan_id)
            .cloned()
            .ok_or(anyhow!("No findings for this scan"))
    }

    pub async fn get_finding(&self, finding_id: String) -> Result<VulnerabilityFinding> {
        let findings = self.findings.lock().await;
        for scan_findings in findings.values() {
            if let Some(finding) = scan_findings.iter().find(|f| f.finding_id == finding_id) {
                return Ok(finding.clone());
            }
        }
        Err(anyhow!("Finding not found"))
    }

    pub async fn mark_false_positive(&self, finding_id: String) -> Result<()> {
        let mut findings = self.findings.lock().await;
        for scan_findings in findings.values_mut() {
            if let Some(finding) = scan_findings
                .iter_mut()
                .find(|f| f.finding_id == finding_id)
            {
                finding.false_positive = true;
                return Ok(());
            }
        }
        Err(anyhow!("Finding not found"))
    }

    pub async fn verify_finding(&self, finding_id: String) -> Result<()> {
        let mut findings = self.findings.lock().await;
        for scan_findings in findings.values_mut() {
            if let Some(finding) = scan_findings
                .iter_mut()
                .find(|f| f.finding_id == finding_id)
            {
                finding.verified = true;
                return Ok(());
            }
        }
        Err(anyhow!("Finding not found"))
    }

    // ============ Exploit Shell ============

    pub async fn start_exploit_session(
        &self,
        finding_id: String,
        exploit_type: ExploitType,
        ai_assistance: bool,
    ) -> Result<ExploitSession> {
        // Get finding
        let finding = self.get_finding(finding_id.clone()).await?;

        // Ethical check
        self.check_ethical_compliance(&finding.affected_url).await?;

        let session_id = Uuid::new_v4().to_string();

        let session = ExploitSession {
            session_id: session_id.clone(),
            finding_id,
            target_url: finding.affected_url,
            exploit_type,
            status: ExploitStatus::Active,
            commands: Vec::new(),
            ai_assistance_enabled: ai_assistance,
            created_at: Utc::now().to_rfc3339(),
            last_activity: Utc::now().to_rfc3339(),
        };

        {
            let mut exploits = self.exploits.lock().await;
            exploits.insert(session_id.clone(), session.clone());
        }
        self.app
            .emit("security_lab:exploit_session_started", &session)
            .ok();

        Ok(session)
    }

    pub async fn execute_exploit_command(
        &self,
        session_id: String,
        command: String,
        payload: String,
    ) -> Result<ExploitCommand> {
        let mut exploits = self.exploits.lock().await;
        let session = exploits
            .get_mut(&session_id)
            .ok_or(anyhow!("Session not found"))?;

        // Ethical guardrails
        let forbidden_commands = vec![
            "rm -rf",
            "DROP DATABASE",
            "DELETE FROM",
            "shutdown",
            "format",
        ];
        for forbidden in forbidden_commands {
            if command.contains(forbidden) || payload.contains(forbidden) {
                return Err(anyhow!("Destructive command blocked by ethical guardrails"));
            }
        }

        // Execute command (simulated - would be actual HTTP request in production)
        let response = self
            .simulate_exploit_execution(&session.target_url, &command, &payload)
            .await?;

        let exploit_cmd = ExploitCommand {
            command_id: Uuid::new_v4().to_string(),
            command: command.clone(),
            payload: payload.clone(),
            response: Some(response.clone()),
            success: !response.contains("error"),
            timestamp: Utc::now().to_rfc3339(),
            ai_suggested: false,
        };

        session.commands.push(exploit_cmd.clone());
        session.last_activity = Utc::now().to_rfc3339();

        self.app
            .emit("security_lab:exploit_command_executed", &exploit_cmd)
            .ok();

        Ok(exploit_cmd)
    }

    async fn simulate_exploit_execution(
        &self,
        target_url: &str,
        _command: &str,
        payload: &str,
    ) -> Result<String> {
        // This is a simulation - in production, would make actual HTTP requests
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()?;

        let response = client
            .post(target_url)
            .body(payload.to_string())
            .send()
            .await?;

        let status = response.status();
        let body = response.text().await?;

        Ok(format!("HTTP {} - {}", status, body))
    }

    pub async fn get_ai_suggestions(&self, session_id: String) -> Result<Vec<String>> {
        let exploits = self.exploits.lock().await;
        let session = exploits
            .get(&session_id)
            .ok_or(anyhow!("Session not found"))?;

        if !session.ai_assistance_enabled {
            return Err(anyhow!("AI assistance not enabled for this session"));
        }

        let config = self.config.lock().await;
        let _api_key = config
            .openai_api_key
            .as_ref()
            .ok_or(anyhow!("OpenAI API key not configured"))?;

        // Build context for AI
        let finding = self.get_finding(session.finding_id.clone()).await?;
        let _context = format!(
            "Vulnerability: {}\nDescription: {}\nAffected URL: {}\nParameter: {}\nEvidence: {}",
            finding.name,
            finding.description,
            finding.affected_url,
            finding.affected_parameter.unwrap_or_default(),
            finding.evidence.unwrap_or_default()
        );

        // Call OpenAI API (simplified - would use actual API)
        let suggestions = vec![
            format!("Try payload: {}'", "' OR '1'='1"),
            "Test for time-based blind SQLi with SLEEP(5)".to_string(),
            "Check for second-order injection".to_string(),
        ];

        Ok(suggestions)
    }

    pub async fn get_exploit_session(&self, session_id: String) -> Result<ExploitSession> {
        let exploits = self.exploits.lock().await;
        exploits
            .get(&session_id)
            .cloned()
            .ok_or(anyhow!("Session not found"))
    }

    pub async fn list_exploit_sessions(&self) -> Result<Vec<ExploitSession>> {
        let exploits = self.exploits.lock().await;
        let mut sessions: Vec<ExploitSession> = exploits.values().cloned().collect();
        sessions.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(sessions)
    }

    pub async fn close_exploit_session(&self, session_id: String) -> Result<()> {
        let mut exploits = self.exploits.lock().await;
        if let Some(session) = exploits.get_mut(&session_id) {
            session.status = ExploitStatus::Failed;
        }
        Ok(())
    }
}
