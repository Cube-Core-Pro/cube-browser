use tauri::State;
use std::sync::Arc;

use crate::services::google_sheets::{
    GoogleSheetsService, GoogleSheetsConfig, GoogleSheetsToken,
    SpreadsheetData, CellRange,
};

/// State for Google Sheets integration
pub struct GoogleSheetsState(pub Arc<GoogleSheetsService>);

impl GoogleSheetsState {
    pub fn new() -> Self {
        Self(Arc::new(GoogleSheetsService::new()))
    }
}

/// Configure Google Sheets OAuth2 credentials
#[tauri::command]
pub async fn google_sheets_configure(
    config: GoogleSheetsConfig,
    state: State<'_, GoogleSheetsState>,
) -> Result<(), String> {
    state.0.set_config(config)
}

/// Get OAuth2 authorization URL for user consent
#[tauri::command]
pub async fn google_sheets_get_auth_url(
    state: State<'_, GoogleSheetsState>,
) -> Result<(String, String), String> {
    state.0.get_auth_url()
}

/// Exchange authorization code for access token
#[tauri::command]
pub async fn google_sheets_exchange_code(
    code: String,
    state: State<'_, GoogleSheetsState>,
) -> Result<GoogleSheetsToken, String> {
    state.0.exchange_code(code).await
}

/// Read data from a spreadsheet range
#[tauri::command]
pub async fn google_sheets_read_range(
    spreadsheet_id: String,
    range: String,
    state: State<'_, GoogleSheetsState>,
) -> Result<CellRange, String> {
    state.0.read_range(spreadsheet_id, range).await
}

/// Write data to a spreadsheet range
#[tauri::command]
pub async fn google_sheets_write_range(
    spreadsheet_id: String,
    range: String,
    values: Vec<Vec<String>>,
    state: State<'_, GoogleSheetsState>,
) -> Result<(), String> {
    state.0.write_range(spreadsheet_id, range, values).await
}

/// Append rows to a spreadsheet
#[tauri::command]
pub async fn google_sheets_append_rows(
    spreadsheet_id: String,
    range: String,
    values: Vec<Vec<String>>,
    state: State<'_, GoogleSheetsState>,
) -> Result<(), String> {
    state.0.append_rows(spreadsheet_id, range, values).await
}

/// Create a new spreadsheet
#[tauri::command]
pub async fn google_sheets_create_spreadsheet(
    title: String,
    state: State<'_, GoogleSheetsState>,
) -> Result<SpreadsheetData, String> {
    state.0.create_spreadsheet(title).await
}

/// Get spreadsheet metadata
#[tauri::command]
pub async fn google_sheets_get_info(
    spreadsheet_id: String,
    state: State<'_, GoogleSheetsState>,
) -> Result<SpreadsheetData, String> {
    state.0.get_spreadsheet_info(spreadsheet_id).await
}

/// Clear a range in a spreadsheet
#[tauri::command]
pub async fn google_sheets_clear_range(
    spreadsheet_id: String,
    range: String,
    state: State<'_, GoogleSheetsState>,
) -> Result<(), String> {
    state.0.clear_range(spreadsheet_id, range).await
}
