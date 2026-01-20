// Security Lab Commands - Tauri Interface
// CUBE Elite v6 - Enterprise Vulnerability Scanner

use crate::services::security_lab_service::{
    DomainVerification, ExploitCommand, ExploitSession, ExploitType, ScanType, Scanner,
    SecurityLabConfig, SecurityLabService, VerificationMethod, VulnerabilityFinding,
    VulnerabilityScan,
};
use std::sync::Arc;
use tauri::State;

// ============ Configuration ============

#[tauri::command]
pub async fn security_lab_get_config(
    state: State<'_, Arc<SecurityLabService>>,
) -> Result<SecurityLabConfig, String> {
    state.get_config().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lab_update_config(
    state: State<'_, Arc<SecurityLabService>>,
    config: SecurityLabConfig,
) -> Result<(), String> {
    state.update_config(config).await.map_err(|e| e.to_string())
}

// ============ Domain Verification ============

#[tauri::command]
pub async fn security_lab_verify_domain(
    state: State<'_, Arc<SecurityLabService>>,
    domain: String,
    method: VerificationMethod,
) -> Result<DomainVerification, String> {
    state
        .verify_domain(domain, method)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lab_check_verification(
    state: State<'_, Arc<SecurityLabService>>,
    domain: String,
    token: String,
    method: VerificationMethod,
) -> Result<bool, String> {
    state
        .check_domain_verification(domain, token, method)
        .await
        .map_err(|e| e.to_string())
}

// ============ Scanning ============

#[tauri::command]
pub async fn security_lab_start_scan(
    state: State<'_, Arc<SecurityLabService>>,
    #[allow(non_snake_case)]
    targetUrl: String,
    #[allow(non_snake_case)]
    scanType: ScanType,
    scanner: Scanner,
) -> Result<VulnerabilityScan, String> {
    log::info!("🔍 Starting scan - URL: {}, Type: {:?}, Scanner: {:?}", targetUrl, scanType, scanner);
    state
        .start_scan(targetUrl, scanType, scanner)
        .await
        .map_err(|e| {
            log::error!("❌ Scan failed: {}", e);
            e.to_string()
        })
}

#[tauri::command]
pub async fn security_lab_get_scan(
    state: State<'_, Arc<SecurityLabService>>,
    scan_id: String,
) -> Result<VulnerabilityScan, String> {
    state.get_scan(scan_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lab_list_scans(
    state: State<'_, Arc<SecurityLabService>>,
) -> Result<Vec<VulnerabilityScan>, String> {
    state.list_scans().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lab_cancel_scan(
    state: State<'_, Arc<SecurityLabService>>,
    scan_id: String,
) -> Result<(), String> {
    state.cancel_scan(scan_id).await.map_err(|e| e.to_string())
}

// ============ Findings ============

#[tauri::command]
pub async fn security_lab_get_findings(
    state: State<'_, Arc<SecurityLabService>>,
    scan_id: String,
) -> Result<Vec<VulnerabilityFinding>, String> {
    state.get_findings(scan_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lab_get_finding(
    state: State<'_, Arc<SecurityLabService>>,
    finding_id: String,
) -> Result<VulnerabilityFinding, String> {
    state
        .get_finding(finding_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lab_mark_false_positive(
    state: State<'_, Arc<SecurityLabService>>,
    finding_id: String,
) -> Result<(), String> {
    state
        .mark_false_positive(finding_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lab_verify_finding(
    state: State<'_, Arc<SecurityLabService>>,
    finding_id: String,
) -> Result<(), String> {
    state
        .verify_finding(finding_id)
        .await
        .map_err(|e| e.to_string())
}

// ============ Exploit Shell ============

#[tauri::command]
pub async fn security_lab_start_exploit(
    state: State<'_, Arc<SecurityLabService>>,
    finding_id: String,
    exploit_type: ExploitType,
    ai_assistance: bool,
) -> Result<ExploitSession, String> {
    state
        .start_exploit_session(finding_id, exploit_type, ai_assistance)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lab_execute_exploit_command(
    state: State<'_, Arc<SecurityLabService>>,
    session_id: String,
    command: String,
    payload: String,
) -> Result<ExploitCommand, String> {
    state
        .execute_exploit_command(session_id, command, payload)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lab_get_ai_suggestions(
    state: State<'_, Arc<SecurityLabService>>,
    session_id: String,
) -> Result<Vec<String>, String> {
    state
        .get_ai_suggestions(session_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lab_get_exploit_session(
    state: State<'_, Arc<SecurityLabService>>,
    session_id: String,
) -> Result<ExploitSession, String> {
    state
        .get_exploit_session(session_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lab_list_exploit_sessions(
    state: State<'_, Arc<SecurityLabService>>,
) -> Result<Vec<ExploitSession>, String> {
    state
        .list_exploit_sessions()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lab_close_exploit(
    state: State<'_, Arc<SecurityLabService>>,
    session_id: String,
) -> Result<(), String> {
    state
        .close_exploit_session(session_id)
        .await
        .map_err(|e| e.to_string())
}
