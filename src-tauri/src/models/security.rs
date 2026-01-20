use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityScan {
    pub id: String,
    pub scan_type: String, // "port", "ssl", "headers", "malware"
    pub target: String, // URL or IP address
    pub status: String, // "pending", "running", "completed", "failed"
    pub started_at: i64,
    pub completed_at: Option<i64>,
    pub duration_ms: i64,
    pub findings: Vec<SecurityFinding>,
    pub risk_score: i32, // 0-100
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityFinding {
    pub severity: String, // "low", "medium", "high", "critical"
    pub category: String,
    pub title: String,
    pub description: String,
    pub recommendation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Certificate {
    pub domain: String,
    pub issuer: String,
    pub valid_from: i64,
    pub valid_to: i64,
    pub is_valid: bool,
    pub is_expired: bool,
    pub days_until_expiry: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordStrength {
    pub password: String, // Hashed, never stored in plain text
    pub score: i32, // 0-4
    pub feedback: Vec<String>,
    pub crack_time: String, // "instant", "seconds", "minutes", "hours", "days", "years", "centuries"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityStats {
    pub total_scans: i32,
    pub critical_findings: i32,
    pub high_findings: i32,
    pub medium_findings: i32,
    pub low_findings: i32,
    pub average_risk_score: f64,
}
