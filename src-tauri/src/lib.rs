// CUBE Nexum v1.0.0 - Complete Enterprise Browser Platform
// Migrated from CUBE Elite v6.0.0
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(dead_code)]
#![allow(unused_imports)]

use log::{error, info, warn};
use std::sync::Arc;
use tauri::Manager;

// Core modules
mod autofill;
#[cfg(feature = "cef-browser")]
mod cef;
mod commands;
mod database;
mod database_schema;
mod document;
mod models;
mod ocr;
mod remote;
mod services;

// Application State with Complete Enterprise Architecture  
pub struct AppState {
    pub tab_manager: Arc<services::browser_tab_manager::BrowserTabManager>,
    pub database: Arc<database::Database>,
}

impl AppState {
    fn new(app_handle: tauri::AppHandle) -> anyhow::Result<Self> {
        info!("Initializing CUBE Nexum v1.0.0 - Enterprise Platform");

        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data directory");

        std::fs::create_dir_all(&app_data_dir)?;
        let db = database::Database::new(app_data_dir)?;

        Ok(Self {
            tab_manager: Arc::new(services::browser_tab_manager::BrowserTabManager::new(app_handle.clone())),
            database: Arc::new(db),
        })
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    info!("Starting CUBE Nexum v1.0.0");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            // === WINDOW MANAGEMENT ===
            commands::window::minimize_window,
            commands::window::maximize_window,
            commands::window::unmaximize_window,
            commands::window::close_window,
            commands::window::is_window_maximized,
            commands::window::toggle_fullscreen,
            commands::window::set_window_title,
            commands::window::get_window_size,
            commands::window::set_window_size,
            commands::window::center_window,
            commands::window::show_window,
            commands::window::hide_window,
            commands::window::open_external_url,

            // === FILESYSTEM OPERATIONS ===
            commands::filesystem::read_file,
            commands::filesystem::read_file_binary,
            commands::filesystem::write_file,
            commands::filesystem::write_file_binary,
            commands::filesystem::delete_file,
            commands::filesystem::create_directory,
            commands::filesystem::delete_directory,
            commands::filesystem::list_directory,
            commands::filesystem::file_exists,
            commands::filesystem::get_file_info,
            commands::filesystem::copy_file,
            commands::filesystem::move_file,

            // === NOTES & TASKS ===
            commands::notes::get_all_notes,
            commands::notes::create_note,
            commands::notes::update_note,
            commands::notes::delete_note,
            commands::notes::get_all_tasks,
            commands::notes::create_task,
            commands::notes::update_task,
            commands::notes::get_all_categories,
            commands::notes::get_notes_stats,

            // === AI SERVICE (OpenAI Integration) ===
            commands::services::set_ai_api_key,
            commands::services::has_ai_api_key,
            commands::services::send_ai_request,
            commands::services::generate_selector,
            commands::services::improve_selector,
            commands::services::generate_workflow,

            // === STORAGE SERVICE ===
            commands::services::storage_set,
            commands::services::storage_get,
            commands::services::storage_remove,
            commands::services::storage_clear,
            commands::services::storage_keys,
            commands::services::storage_has,

            // === ENCRYPTION SERVICE ===
            commands::services::encrypt_data,
            commands::services::decrypt_data,
            commands::services::hash_data,
            commands::services::generate_random_string,

            // === STRIPE PAYMENT SERVICE ===
            commands::stripe::create_stripe_checkout_session,
            commands::stripe::get_stripe_subscription,
            commands::stripe::cancel_stripe_subscription,
            commands::stripe::resume_stripe_subscription,
            commands::stripe::create_stripe_portal_session,
            commands::stripe::verify_stripe_webhook,
            commands::stripe::set_stripe_config,

            // === LICENSE MANAGEMENT ===
            commands::license::validate_license,
            commands::license::activate_license,
            commands::license::deactivate_license,
            commands::license::get_license_status,
            commands::license::get_license_tier,
            commands::license::get_device_id,
            commands::license::start_trial,
            commands::license::get_trial_status,
            commands::license::get_license_info,
            commands::license::is_trial_active,
            commands::license::check_feature_access,
            commands::license::check_features_access,
            commands::license::set_license_config,
            commands::license::create_license_from_stripe,

            // === BROWSER TAB MANAGEMENT ===
            commands::browser::create_browser_tab,
            commands::browser::close_browser_tab,
            commands::browser::navigate_tab,
            commands::browser::reload_tab,
            commands::browser::tab_go_back,
            commands::browser::tab_go_forward,
            commands::browser::tab_stop,
            commands::browser::activate_tab,
            commands::browser::execute_js_in_tab,
            commands::browser::get_tab_info,
            commands::browser::get_all_tabs,
            commands::browser::get_active_tab,
            commands::browser::set_tab_pinned,
            commands::browser::set_tab_muted,
            commands::browser::update_tab_title,
            commands::browser::update_tab_url,
            commands::browser::set_tab_loading,

            // === TAB GROUPS ===
            commands::browser::create_tab_group,
            commands::browser::add_tab_to_group,
            commands::browser::remove_tab_from_group,
            commands::browser::rename_tab_group,
            commands::browser::change_tab_group_color,
            commands::browser::toggle_tab_group_collapsed,
            commands::browser::delete_tab_group,
            commands::browser::get_all_tab_groups,
            commands::browser::get_tab_group,

            // === READING LIST ===
            commands::reading_list::get_all_articles,
            commands::reading_list::get_article,
            commands::reading_list::add_article,
            commands::reading_list::update_article,
            commands::reading_list::delete_article,
            commands::reading_list::mark_article_as_read,
            commands::reading_list::mark_article_as_unread,
            commands::reading_list::update_article_progress,
            commands::reading_list::toggle_article_favorite,
            commands::reading_list::search_reading_list,
            commands::reading_list::get_reading_list_stats,
            commands::reading_list::get_reading_list_tags,

            // === MEDIA PLAYER ===
            commands::media::get_all_media,
            commands::media::get_media_item,
            commands::media::add_media_item,
            commands::media::update_media_item,
            commands::media::delete_media_item,
            commands::media::increment_play_count,
            commands::media::toggle_favorite_media,
            commands::media::get_all_playlists,
            commands::media::create_playlist,
            commands::media::add_to_playlist,
            commands::media::remove_from_playlist,
            commands::media::get_media_stats,

            // === TERMINAL EMULATOR ===
            commands::terminal::create_terminal_session,
            commands::terminal::get_all_terminal_sessions,
            commands::terminal::get_active_terminal_sessions,
            commands::terminal::update_terminal_session_activity,
            commands::terminal::close_terminal_session,
            commands::terminal::delete_terminal_session,
            commands::terminal::add_terminal_command_history,
            commands::terminal::get_terminal_session_history,
            commands::terminal::search_terminal_history,
            commands::terminal::clear_terminal_session_history,
            commands::terminal::get_terminal_config,
            commands::terminal::update_terminal_config,
            commands::terminal::get_terminal_stats,

            // === COLLECTIONS (Hierarchical Bookmarks) ===
            commands::collections::get_all_collections,
            commands::collections::get_collection,
            commands::collections::get_root_collections,
            commands::collections::get_child_collections,
            commands::collections::create_collection,
            commands::collections::update_collection,
            commands::collections::delete_collection,
            commands::collections::move_collection,
            commands::collections::update_collection_position,
            commands::collections::get_favorite_collections,
            commands::collections::get_collection_pages,
            commands::collections::get_page,
            commands::collections::add_page,
            commands::collections::update_page,
            commands::collections::delete_page,
            commands::collections::move_page,
            commands::collections::update_page_position,
            commands::collections::track_page_visit,
            commands::collections::get_favorite_pages,
            commands::collections::get_recent_pages,
            commands::collections::create_share,
            commands::collections::get_share_by_token,
            commands::collections::get_collection_shares,
            commands::collections::increment_share_views,
            commands::collections::revoke_share,
            commands::collections::delete_share,
            commands::collections::search_pages,
            commands::collections::get_collections_stats,
            commands::collections::bulk_add_pages,
            commands::collections::bulk_delete_pages,
            commands::collections::bulk_move_pages,

            // === PASSWORD MANAGER (AES-256-GCM Encryption) ===
            commands::passwords_new::setup_master_password,
            commands::passwords_new::verify_master_password,
            commands::passwords_new::get_master_password_config,
            commands::passwords_new::change_master_password,
            commands::passwords_new::get_all_passwords,
            commands::passwords_new::save_password,
            commands::passwords_new::update_password_entry,
            commands::passwords_new::delete_password,
            commands::passwords_new::decrypt_password,
            commands::passwords_new::update_password_last_used,
            commands::passwords_new::get_password_categories,
            commands::passwords_new::get_password_stats,
            commands::passwords_new::generate_password,
            commands::passwords_new::analyze_password_strength,
            commands::passwords_new::search_passwords,
            commands::passwords_new::export_passwords,
            commands::passwords_new::import_passwords,

            // === SESSION PERSISTENCE ===
            commands::session_persistence::save_browser_session,
            commands::session_persistence::load_browser_session,
            commands::session_persistence::get_session_info,
            commands::session_persistence::clear_browser_session,
            commands::session_persistence::auto_save_session,
            commands::session_persistence::save_recovery_state,
            commands::session_persistence::load_recovery_state,

            // === EXPORT/IMPORT & BACKUPS ===
            commands::export_import::export_workspaces,
            commands::export_import::import_workspaces_file,
            commands::export_import::create_backup,
            commands::export_import::read_backup_file,
            commands::export_import::get_backup_history,
            commands::export_import::delete_backup,

            // === DOWNLOADS MANAGEMENT ===
            commands::downloads::start_download,
            commands::downloads::get_downloads,
            commands::downloads::get_download,
            commands::downloads::pause_download,
            commands::downloads::resume_download,
            commands::downloads::cancel_download,
            commands::downloads::remove_download,
            commands::downloads::clear_completed_downloads,
            commands::downloads::open_download_location,
            commands::downloads::open_downloaded_file,

            // === MACRO SYSTEM ===
            commands::macro_system::start_recording,
            commands::macro_system::stop_recording,
            commands::macro_system::add_macro_step,
            commands::macro_system::play_macro,
            commands::macro_system::get_macros,
            commands::macro_system::get_macro,
            commands::macro_system::delete_macro,
            commands::macro_system::save_macro,
            commands::macro_system::get_recording_status,
            commands::macro_system::get_step_count,

            // === AI COMMANDS ===
            commands::ai::openai_completion,
            commands::ai::claude_completion,
            commands::ai::gemini_completion,

            // === AI SERVICE (Smart Selectors & NLP) ===
            commands::ai_commands::ai_suggest_selectors,
            commands::ai_commands::ai_natural_language_to_workflow,
            commands::ai_commands::ai_improve_selector,
            commands::ai_commands::ai_suggest_extraction_schema,

            // === SCREEN COMMANDS ===
            commands::screen::get_available_screens,
            commands::screen::capture_screenshot,
            commands::screen::start_screen_recording,
            commands::screen::stop_screen_recording,

            // === OCR COMMANDS ===
            commands::ocr_system::ocr_extract_from_file,
            commands::ocr_system::ocr_extract_from_base64,
            commands::ocr_system::ocr_extract_from_region,
            commands::ocr_system::ocr_get_available_languages,
            commands::ocr_system::ocr_get_installed_languages,
            commands::ocr_system::ocr_is_language_available,
            commands::ocr_system::ocr_detect_language,
            commands::ocr_system::ocr_get_default_config,
            commands::ocr_system::ocr_validate_config,
            commands::ocr_system::ocr_get_version,
            commands::ocr_system::ocr_preprocess_image,

            // === LENDINGPAD AUTOMATION ===
            commands::lendingpad::detect_lendingpad_documents,
            commands::lendingpad::start_batch_download,
            commands::lendingpad::get_batch_status,
            commands::lendingpad::cancel_batch_download,
            commands::lendingpad::extract_document_data,
            commands::lendingpad::get_extracted_data,
            commands::lendingpad::autofill_form,
            commands::lendingpad::validate_extracted_data,
            commands::lendingpad::list_lendingpad_documents,
            commands::lendingpad::clear_lendingpad_state,

            // === LENDINGPAD AUTH ===
            commands::lendingpad_auth::lendingpad_login_credentials,
            commands::lendingpad_auth::lendingpad_get_session,
            commands::lendingpad_auth::lendingpad_logout,
            commands::lendingpad_auth::lendingpad_check_session,

            // === SCREENSHOT SYSTEM ===
            commands::screenshot::screenshot_capture,
            commands::screenshot::screenshot_copy_to_clipboard,
            commands::screenshot::screenshot_save,
            commands::screenshot::screenshot_share,

            // === SCREEN RECORDING SYSTEM ===
            commands::screen_recording::screen_recording_start,
            commands::screen_recording::screen_recording_stop,
            commands::screen_recording::screen_recording_pause,
            commands::screen_recording::screen_recording_resume,
            commands::screen_recording::get_recording_session,
            commands::screen_recording::list_recording_sessions,
            commands::screen_recording::delete_recording,
            commands::screen_recording::check_ffmpeg_available,
            commands::screen_recording::get_default_recording_dir,

            // === P2P FILE SHARING ===
            commands::p2p_commands::p2p_create_room,
            commands::p2p_commands::p2p_join_room,
            commands::p2p_commands::p2p_leave_room,
            commands::p2p_commands::p2p_send_file,
            commands::p2p_commands::p2p_receive_file,
            commands::p2p_commands::p2p_cancel_transfer,
            commands::p2p_commands::p2p_get_transfer,
            commands::p2p_commands::p2p_list_transfers,
            commands::p2p_commands::p2p_get_room,
            commands::p2p_commands::p2p_list_rooms,
            commands::p2p_commands::p2p_get_ice_servers,
            commands::p2p_commands::get_downloads_dir,

            // === VIDEO CONFERENCING ===
            commands::video_conference_commands::conference_create_room,
            commands::video_conference_commands::conference_join_room,
            commands::video_conference_commands::conference_leave_room,
            commands::video_conference_commands::conference_toggle_audio,
            commands::video_conference_commands::conference_toggle_video,
            commands::video_conference_commands::conference_start_screen_share,
            commands::video_conference_commands::conference_stop_screen_share,
            commands::video_conference_commands::conference_toggle_hand,
            commands::video_conference_commands::conference_start_recording,
            commands::video_conference_commands::conference_stop_recording,
            commands::video_conference_commands::conference_get_room,
            commands::video_conference_commands::conference_list_rooms,
            commands::video_conference_commands::conference_get_participants,
            commands::video_conference_commands::conference_get_streams,
            commands::video_conference_commands::conference_update_stats,
            commands::video_conference_commands::conference_get_ice_servers,

            // === NATIVE CHAT SYSTEM ===
            commands::chat_commands::chat_create_room,
            commands::chat_commands::chat_join_room,
            commands::chat_commands::chat_leave_room,
            commands::chat_commands::chat_send_message,
            commands::chat_commands::chat_get_messages,
            commands::chat_commands::chat_mark_as_read,
            commands::chat_commands::chat_add_reaction,
            commands::chat_commands::chat_remove_reaction,
            commands::chat_commands::chat_edit_message,
            commands::chat_commands::chat_delete_message,
            commands::chat_commands::chat_set_typing,
            commands::chat_commands::chat_get_typing_indicators,
            commands::chat_commands::chat_get_room,
            commands::chat_commands::chat_list_rooms,
            commands::chat_commands::chat_search_messages,
            commands::chat_commands::chat_update_status,

            // === SECURITY LAB ===
            commands::security_lab_commands::security_lab_get_config,
            commands::security_lab_commands::security_lab_update_config,
            commands::security_lab_commands::security_lab_verify_domain,
            commands::security_lab_commands::security_lab_check_verification,
            commands::security_lab_commands::security_lab_start_scan,
            commands::security_lab_commands::security_lab_get_scan,
            commands::security_lab_commands::security_lab_list_scans,
            commands::security_lab_commands::security_lab_cancel_scan,
            commands::security_lab_commands::security_lab_get_findings,
            commands::security_lab_commands::security_lab_get_finding,
            commands::security_lab_commands::security_lab_mark_false_positive,
            commands::security_lab_commands::security_lab_verify_finding,
            commands::security_lab_commands::security_lab_start_exploit,
            commands::security_lab_commands::security_lab_execute_exploit_command,
            commands::security_lab_commands::security_lab_get_ai_suggestions,
            commands::security_lab_commands::security_lab_get_exploit_session,
            commands::security_lab_commands::security_lab_list_exploit_sessions,
            commands::security_lab_commands::security_lab_close_exploit,

            // === AI TRAINING SYSTEM ===
            commands::ai_trainer::start_ai_recording,
            commands::ai_trainer::add_recording_step,
            commands::ai_trainer::stop_ai_recording,
            commands::ai_trainer::pause_ai_recording,
            commands::ai_trainer::resume_ai_recording,
            commands::ai_trainer::get_current_ai_recording,
            commands::ai_trainer::clear_ai_recording,
            commands::ai_trainer::save_workflow,
            commands::ai_trainer::list_workflows,
            commands::ai_trainer::get_workflow,
            commands::ai_trainer::update_workflow,
            commands::ai_trainer::delete_workflow,
            commands::ai_trainer::execute_workflow,
            commands::ai_trainer::analyze_workflow_with_ai,
            commands::ai_trainer::get_execution_history,

            // === AI CHAT SYSTEM ===
            commands::ai_chat::start_chat_session,
            commands::ai_chat::send_chat_message,
            commands::ai_chat::get_chat_history,
            commands::ai_chat::clear_chat_history,
            commands::ai_chat::update_browser_context,
            commands::ai_chat::get_browser_context,
            commands::ai_chat::get_command_suggestions,
            commands::ai_chat::execute_voice_command,
            commands::ai_chat::set_openai_api_key,
            commands::ai_chat::get_available_models,
            commands::ai_chat::set_selected_model,
            commands::ai_chat::get_selected_model,

            // === WORKFLOW BUILDER - ELITE (BEATS ZAPIER) ===
            commands::workflow_commands::execute_workflow_node,
            commands::workflow_commands::workflow_save,
            commands::workflow_commands::workflow_load_all,
            commands::workflow_commands::workflow_load,
            commands::workflow_commands::workflow_delete,
            commands::workflow_commands::optimize_workflow_with_ai,
            commands::workflow_commands::generate_workflow_from_description,

            // === AUTOMATION STUDIO ===
            commands::automation::automation_execute_flow,
            commands::automation::automation_save_flow,
            commands::automation::automation_load_flows,
            commands::automation::automation_delete_flow,
            commands::automation::automation_start_recording,
            commands::automation::automation_stop_recording,
            commands::automation::automation_record_action,

            // === DATA EXTRACTOR ===
            commands::extractor::extractor_load_schemas,
            commands::extractor::extractor_save_schema,
            commands::extractor::extractor_delete_schema,
            commands::extractor::extractor_preview,
            commands::extractor::extractor_extract,
            commands::extractor::extractor_suggest_selectors,
            commands::extractor::extractor_analyze_page,
            commands::extractor::extractor_export,

            // === DATA SOURCES ===
            commands::data_sources::create_data_source,
            commands::data_sources::list_data_sources,
            commands::data_sources::get_data_source,
            commands::data_sources::update_data_source,
            commands::data_sources::delete_data_source,
            commands::data_sources::test_data_source_connection,
            commands::data_sources::get_data_sources_status,
            commands::data_sources::execute_data_source_query,
            commands::data_sources::fetch_from_api_source,

            // === VPN SYSTEM ===
            commands::vpn::get_vpn_servers,
            commands::vpn::get_vpn_status,
            commands::vpn::connect_vpn,
            commands::vpn::disconnect_vpn,
            commands::vpn::get_vpn_config,
            commands::vpn::update_vpn_config,
            commands::vpn::toggle_kill_switch,
            commands::vpn::configure_split_tunnel,
            commands::vpn::get_current_ip,
            commands::vpn::get_vpn_logs,
            commands::vpn::refresh_vpn_servers,

            // === AD BLOCKER ===
            commands::vpn::get_adblocker_config,
            commands::vpn::update_adblocker_config,
            commands::vpn::toggle_adblocker,
            commands::vpn::toggle_adblocker_category,
            commands::vpn::add_whitelist_domain,
            commands::vpn::remove_whitelist_domain,
            commands::vpn::get_adblocker_stats,

            // === KILL SWITCH ===
            commands::vpn::get_killswitch_config,
            commands::vpn::update_killswitch_config,
            commands::vpn::toggle_killswitch_mode,
            commands::vpn::add_killswitch_allowed_app,
            commands::vpn::remove_killswitch_allowed_app,
            commands::vpn::get_killswitch_events,

            // === SPLIT TUNNELING ===
            commands::vpn::get_split_tunneling_config,
            commands::vpn::update_split_tunneling_config,
            commands::vpn::toggle_split_tunneling,
            commands::vpn::set_split_tunneling_mode,
            commands::vpn::toggle_split_tunneling_app,
            commands::vpn::add_split_tunneling_website,
            commands::vpn::remove_split_tunneling_website,
            commands::vpn::add_split_tunneling_ip_range,
            commands::vpn::remove_split_tunneling_ip_range,
            commands::vpn::get_split_tunneling_apps,

            // === DEDICATED IP ===
            commands::vpn::get_dedicated_ip_config,
            commands::vpn::activate_dedicated_ip,

            // === DOUBLE VPN ===
            commands::vpn::get_double_vpn_config,
            commands::vpn::set_double_vpn_route,
            commands::vpn::toggle_double_vpn,

            // === MESHNET ===
            commands::vpn::get_meshnet_config,
            commands::vpn::toggle_meshnet,
            commands::vpn::send_meshnet_invitation,

            // === THREAT PROTECTION ===
            commands::vpn::get_threat_protection_config,
            commands::vpn::toggle_threat_protection,
            commands::vpn::toggle_dns_category,
            commands::vpn::get_threat_stats,
            commands::vpn::get_threat_events,

            // ================================================================
            // PASSWORD ADVANCED COMMANDS
            // ================================================================
            
            // === CLI ACCESS ===
            commands::password_advanced::get_cli_access_config,
            commands::password_advanced::revoke_cli_session,
            commands::password_advanced::create_api_token,
            commands::password_advanced::revoke_api_token,

            // === DARK WEB MONITOR ===
            commands::password_advanced::get_darkweb_monitor_config,
            commands::password_advanced::toggle_darkweb_monitor,
            commands::password_advanced::add_monitored_email,
            commands::password_advanced::resolve_breach,

            // === SSH KEY MANAGER ===
            commands::password_advanced::get_vault_ssh_keys,
            commands::password_advanced::delete_vault_ssh_key,

            // === PASSKEY MANAGER ===
            commands::password_advanced::get_passkeys,
            commands::password_advanced::delete_passkey,

            // === VAULT HEALTH ===
            commands::password_advanced::get_vault_health,

            // === WATCHTOWER ===
            commands::password_advanced::get_watchtower_config,
            commands::password_advanced::dismiss_watchtower_alert,

            // === FAMILY VAULTS ===
            commands::password_advanced::get_family_vaults,

            // === SECURE SEND ===
            commands::password_advanced::get_secure_sends,
            commands::password_advanced::delete_secure_send,

            // === USERNAME GENERATOR ===
            commands::password_advanced::get_username_generator_config,
            commands::password_advanced::generate_username,

            // ================================================================
            // FILE TRANSFER ADVANCED COMMANDS
            // ================================================================
            
            // === P2P SYNC ===
            commands::file_transfer_advanced::get_p2p_sync_config,
            commands::file_transfer_advanced::remove_p2p_peer,
            commands::file_transfer_advanced::delete_shareable_link,

            // === BANDWIDTH CONTROL ===
            commands::file_transfer_advanced::get_bandwidth_config,
            commands::file_transfer_advanced::toggle_bandwidth_rule,

            // === VERSION HISTORY ===
            commands::file_transfer_advanced::get_version_history,
            commands::file_transfer_advanced::restore_version,

            // === LAN TRANSFER ===
            commands::file_transfer_advanced::get_lan_transfer_config,
            commands::file_transfer_advanced::toggle_lan_device_trust,

            // === SELECTIVE SYNC ===
            commands::file_transfer_advanced::get_selective_sync_config,
            commands::file_transfer_advanced::toggle_folder_sync,

            // ================================================================
            // KNOWLEDGE MODULE ADVANCED COMMANDS
            // ================================================================

            // === TEMPLATES ===
            commands::knowledge_advanced::get_templates_config,
            commands::knowledge_advanced::delete_template,

            // === AI AGENTS ===
            commands::knowledge_advanced::get_ai_agents_config,
            commands::knowledge_advanced::toggle_ai_agent,

            // === GRAPH VIEW ===
            commands::knowledge_advanced::get_graph_view_config,

            // === WEB CLIPPER ===
            commands::knowledge_advanced::get_web_clipper_config,
            commands::knowledge_advanced::delete_web_clip,

            // === CANVAS ===
            commands::knowledge_advanced::get_canvas_config,
            commands::knowledge_advanced::delete_canvas_element,

            // ================================================================
            // CRM MODULE ADVANCED COMMANDS
            // ================================================================

            // === EMAIL WRITER ===
            commands::crm_advanced::get_email_writer_config,
            commands::crm_advanced::delete_email_template,

            // === LEAD SCORING ===
            commands::crm_advanced::get_lead_scoring_config,
            commands::crm_advanced::toggle_scoring_rule,

            // === PIPELINE ===
            commands::crm_advanced::get_pipeline_config,
            commands::crm_advanced::move_deal_stage,

            // === AI SALES ASSISTANT ===
            commands::crm_advanced::get_ai_sales_assistant_config,
            commands::crm_advanced::dismiss_ai_suggestion,

            // ================================================================
            // REMOTE MODULE ADVANCED COMMANDS
            // ================================================================

            // === PRIVACY MODE ===
            commands::remote_advanced::get_privacy_mode_config,
            commands::remote_advanced::toggle_privacy_mode,
            commands::remote_advanced::toggle_privacy_rule,

            // === WHITEBOARD ===
            commands::remote_advanced::get_whiteboard_config,
            commands::remote_advanced::clear_whiteboard,

            // === SESSION RECORDING ===
            commands::remote_advanced::get_session_recording_config,
            commands::remote_advanced::toggle_recording,
            commands::remote_advanced::delete_session_recording,

            // === MULTI-MONITOR ===
            commands::remote_advanced::get_multi_monitor_config,
            commands::remote_advanced::toggle_monitor_sharing,

            // ================================================================
            // EXTRACTOR MODULE ADVANCED COMMANDS
            // ================================================================

            // === MULTIPAGE EXTRACTOR ===
            commands::extractor_advanced::get_multipage_extractor_config,
            commands::extractor_advanced::toggle_extraction_job,

            // === CAPTCHA HANDLER ===
            commands::extractor_advanced::get_captcha_handler_config,
            commands::extractor_advanced::toggle_captcha_provider,

            // === AI AUTO DETECTOR ===
            commands::extractor_advanced::get_ai_auto_detector_config,
            commands::extractor_advanced::start_ai_scan,

            // === SELF-HEALING SELECTORS ===
            commands::extractor_advanced::get_self_healing_selectors_config,
            commands::extractor_advanced::heal_selector,

            // === EXTRACTION TEMPLATES ===
            commands::extractor_advanced::get_extraction_templates_config,
            commands::extractor_advanced::delete_extraction_template,

            // ================================================================
            // ENTERPRISE MODULE ADVANCED COMMANDS
            // ================================================================

            // === PIPELINE BUILDER ===
            commands::enterprise_advanced::get_pipeline_builder_config,
            commands::enterprise_advanced::delete_enterprise_pipeline,
            commands::enterprise_advanced::toggle_enterprise_pipeline,

            // === CUSTOM VPN MANAGEMENT ===
            commands::vpn_custom::import_vpn_config,
            commands::vpn_custom::create_vpn_config,
            commands::vpn_custom::connect_custom_vpn,
            commands::vpn_custom::disconnect_custom_vpn,
            commands::vpn_custom::get_custom_vpn_configs,
            commands::vpn_custom::get_custom_vpn_status,
            commands::vpn_custom::get_custom_vpn_stats,
            commands::vpn_custom::delete_custom_vpn_config,
            commands::vpn_custom::update_custom_vpn_config,
            commands::vpn_custom::test_custom_vpn_connection,
            commands::vpn_custom::export_custom_vpn_config,

            // === RDP NATIVE CLIENT ===
            commands::rdp_commands::create_rdp_config,
            commands::rdp_commands::connect_rdp,
            commands::rdp_commands::disconnect_rdp,
            commands::rdp_commands::get_rdp_configs,
            commands::rdp_commands::get_active_rdp_sessions,
            commands::rdp_commands::delete_rdp_config,
            commands::rdp_commands::update_rdp_display,
            commands::rdp_commands::test_rdp_connection,

            // === DOCKER DATABASE MANAGER ===
            commands::docker_commands::docker_get_info,
            commands::docker_commands::docker_test_connection,
            commands::docker_commands::docker_create_database,
            commands::docker_commands::docker_get_container,
            commands::docker_commands::docker_list_containers,
            commands::docker_commands::docker_start_container,
            commands::docker_commands::docker_stop_container,
            commands::docker_commands::docker_restart_container,
            commands::docker_commands::docker_remove_container,
            commands::docker_commands::docker_get_stats,
            commands::docker_commands::docker_start_stats_monitoring,
            commands::docker_commands::docker_get_logs,
            commands::docker_commands::docker_stream_logs,
            commands::docker_commands::docker_list_images,
            commands::docker_commands::docker_list_volumes,
            commands::docker_commands::docker_remove_volume,

            // === FTP/SFTP CLIENT & SERVER ===
            commands::ftp_commands::create_ftp_site,
            commands::ftp_commands::get_ftp_sites,
            commands::ftp_commands::delete_ftp_site,
            commands::ftp_commands::list_ftp_directory,
            commands::ftp_commands::upload_ftp_file,
            commands::ftp_commands::download_ftp_file,
            commands::ftp_commands::get_ftp_transfer_queue,
            commands::ftp_commands::pause_ftp_transfer,
            commands::ftp_commands::resume_ftp_transfer,
            commands::ftp_commands::cancel_ftp_transfer,
            commands::ftp_commands::start_ftp_server,
            commands::ftp_commands::stop_ftp_server,
            commands::ftp_commands::get_ftp_server_status,
            commands::ftp_commands::test_ftp_connection,
            commands::ftp_commands::update_ftp_site,
            commands::ftp_commands::ftp_chmod,
            commands::ftp_commands::ftp_delete,
            commands::ftp_commands::ftp_rename,
            commands::ftp_commands::ftp_mkdir,

            // === SSH TERMINAL ===
            commands::ssh_commands::create_ssh_config,
            commands::ssh_commands::connect_ssh,
            commands::ssh_commands::execute_ssh_command,
            commands::ssh_commands::disconnect_ssh,
            commands::ssh_commands::get_ssh_configs,
            commands::ssh_commands::get_active_ssh_sessions,
            commands::ssh_commands::delete_ssh_config,
            commands::ssh_commands::generate_ssh_key,
            commands::ssh_commands::get_ssh_keys,
            commands::ssh_commands::delete_ssh_key,
            commands::ssh_commands::get_ssh_command_history,
            commands::ssh_commands::clear_ssh_command_history,
            commands::ssh_commands::setup_ssh_port_forward,

            // === VPN FREEMIUM API ===
            commands::vpn_provider_commands::get_vpn_pricing_tiers,
            commands::vpn_provider_commands::get_vpn_tiers,
            commands::vpn_provider_commands::fetch_free_vpn_servers,
            commands::vpn_provider_commands::fetch_premium_vpn_servers,
            commands::vpn_provider_commands::get_vpn_purchase_link,
            commands::vpn_provider_commands::track_vpn_subscription,
            commands::vpn_provider_commands::get_vpn_total_commission,

            // === VULNERABILITY SCANNER ===
            commands::vulnerability_commands::start_vulnerability_scan,
            commands::vulnerability_commands::get_scan_report,
            commands::vulnerability_commands::get_all_scans,
            commands::vulnerability_commands::stop_scan,
            commands::vulnerability_commands::delete_scan,
            commands::vulnerability_commands::export_scan_report,

            // === BROWSER AUTOMATION ===
            commands::browser_commands::browser_launch,
            commands::browser_commands::browser_is_running,
            commands::browser_commands::browser_close,
            commands::browser_commands::browser_new_tab,
            commands::browser_commands::browser_close_tab,
            commands::browser_commands::browser_get_tabs,
            commands::browser_commands::browser_navigate,
            commands::browser_commands::browser_reload,
            commands::browser_commands::browser_go_back,
            commands::browser_commands::browser_go_forward,
            commands::browser_commands::browser_wait_for_element,
            commands::browser_commands::browser_click,
            commands::browser_commands::browser_type,
            commands::browser_commands::browser_get_text,
            commands::browser_commands::browser_get_attribute,
            commands::browser_commands::browser_get_element_info,
            commands::browser_commands::browser_screenshot,
            commands::browser_commands::browser_screenshot_element,
            commands::browser_commands::browser_evaluate,
            commands::browser_commands::browser_get_html,
            commands::browser_commands::browser_get_title,
            commands::browser_commands::browser_get_url,
            commands::browser_commands::browser_find_elements,
            commands::browser_commands::browser_count_elements,
            commands::browser_commands::get_page_html,

            // === AI EXPLOIT SHELL ===
            commands::exploit_commands::get_exploits_for_vulnerability,
            commands::exploit_commands::auto_exploit_vulnerability,
            commands::exploit_commands::get_exploit_history,
            commands::exploit_commands::get_ai_exploit_commands,
            commands::exploit_commands::execute_exploit_command,

            // === VOIP/VIDEO CALLS ===
            commands::voip::voip_initialize,
            commands::voip::voip_initialize_with_provider,
            commands::voip::voip_create_offer,
            commands::voip::voip_create_answer,
            commands::voip::voip_set_remote_description,
            commands::voip::voip_add_ice_candidate,
            commands::voip::voip_get_ice_candidates,
            commands::voip::voip_clear_candidates,
            commands::voip::voip_set_audio_muted,
            commands::voip::voip_set_video_enabled,
            commands::voip::voip_get_call_state,
            commands::voip::voip_get_stats,
            commands::voip::voip_get_call_stats,
            commands::voip::voip_has_turn_servers,
            commands::voip::voip_close,
            commands::voip::voip_quick_start,
            commands::voip::voip_quick_start_twilio,
            commands::voip::voip_quick_start_metered,
            // VoIP Contacts
            commands::voip::voip_get_contacts,
            commands::voip::voip_add_contact,
            commands::voip::voip_delete_contact,
            commands::voip::voip_update_contact,
            // VoIP Call History
            commands::voip::voip_get_call_history,
            commands::voip::voip_add_call_history,
            commands::voip::voip_clear_call_history,
            commands::voip::voip_delete_call_history_entry,
            // VoIP Audio Devices
            commands::voip::voip_get_audio_devices,
            commands::voip::voip_set_input_device,
            commands::voip::voip_set_output_device,
            commands::voip::voip_get_input_device,
            commands::voip::voip_get_output_device,

            // === NATIVE MESSAGING ===
            commands::native_messaging::native_messaging_init,
            commands::native_messaging::native_messaging_start,
            commands::native_messaging::native_messaging_send,
            commands::native_messaging::native_messaging_test,
            commands::native_messaging::native_messaging_status,
            commands::native_messaging::native_messaging_process,

            // === WORKSPACE MANAGEMENT ===
            commands::workspace::workspace_list,
            commands::workspace::workspace_create,
            commands::workspace::workspace_update,
            commands::workspace::workspace_delete,
            commands::workspace::workspace_switch,
            commands::workspace::workspace_duplicate,
            commands::workspace::workspace_tab_add,
            commands::workspace::workspace_tab_remove,
            commands::workspace::workspace_tab_update,
            commands::workspace::workspace_tab_move,
            commands::workspace::workspace_tab_pin,
            commands::workspace::workspace_tab_switch,
            commands::workspace::workspace_layout_set,
            commands::workspace::workspace_panel_add,
            commands::workspace::workspace_panel_remove,
            commands::workspace::workspace_focus_mode_toggle,
            commands::workspace::workspace_auto_archive_set,
            commands::workspace::workspace_auto_archive_check,

            // === LAYOUT TEMPLATES ===
            commands::layout_templates::list_layout_templates,
            commands::layout_templates::save_layout_template,
            commands::layout_templates::update_layout_template,
            commands::layout_templates::update_template_usage,
            commands::layout_templates::delete_layout_template,
            commands::layout_templates::get_current_layout_mode,
            commands::layout_templates::set_workspace_layout,

            // === VIDEO PROCESSING ===
            commands::video_processing::get_video_info,
            commands::video_processing::extract_video_frames,
            commands::video_processing::cleanup_video_frames,
            commands::video_processing::get_video_temp_dir,
            commands::video_processing::analyze_video_frames,

            // === TRAINING DATA MANAGEMENT ===
            commands::training_data::create_training_session,
            commands::training_data::get_training_session,
            commands::training_data::list_training_sessions,
            commands::training_data::update_session_status,
            commands::training_data::delete_training_session,
            commands::training_data::add_training_frame,
            commands::training_data::get_session_frames,
            commands::training_data::search_frames_by_features,
            commands::training_data::save_frame_analysis,
            commands::training_data::get_frame_analysis,
            commands::training_data::add_frame_label,
            commands::training_data::get_frame_labels,
            commands::training_data::create_training_dataset,
            commands::training_data::list_training_datasets,
            commands::training_data::mark_dataset_exported,
            commands::training_data::get_training_statistics,

            // === DATASET EXPORT ===
            commands::export_dataset::export_dataset_coco,
            commands::export_dataset::export_dataset_yolo,
            commands::export_dataset::export_dataset_tensorflow,
            commands::export_dataset::export_dataset_pytorch,

            // === BATCH VIDEO PROCESSING ===
            commands::batch_processing::batch_add_to_queue,
            commands::batch_processing::batch_remove_from_queue,
            commands::batch_processing::batch_clear_queue,
            commands::batch_processing::batch_start_processing,
            commands::batch_processing::batch_pause_processing,
            commands::batch_processing::batch_resume_processing,
            commands::batch_processing::batch_stop_processing,
            commands::batch_processing::batch_get_status,
            commands::batch_processing::batch_get_all_items,
            commands::batch_processing::batch_get_item,
            commands::batch_processing::batch_get_results,

            // === REMOTE DESKTOP SYSTEM v2 (DISABLED - missing src/remote/* submodules) ===
            // commands::remote_system_v2::get_remote_connections,
            // commands::remote_system_v2::get_connected_remotes,
            // commands::remote_system_v2::add_remote_connection,
            // commands::remote_system_v2::create_remote_session,
            // commands::remote_system_v2::get_remote_session,
            // commands::remote_system_v2::list_remote_sessions,
            // commands::remote_system_v2::close_remote_session,
            // commands::remote_system_v2::remote_get_available_screens,
            // commands::remote_system_v2::start_screen_streaming,
            // commands::remote_system_v2::stop_screen_streaming,
            // commands::remote_system_v2::execute_remote_input,
            // commands::remote_system_v2::set_remote_input_enabled,
            // commands::remote_system_v2::generate_encryption_keypair,
            // commands::remote_system_v2::exchange_encryption_keys,
            // commands::remote_system_v2::create_webrtc_offer,
            // commands::remote_system_v2::create_webrtc_answer,
            // commands::remote_system_v2::set_remote_description,
            // commands::remote_system_v2::add_ice_candidate,

            // === DOCUMENT SYSTEM ===
            commands::document_system::document_download,
            commands::document_system::document_download_file,
            commands::document_system::document_download_url,
            commands::document_system::document_validate,
            commands::document_system::document_validate_any,
            commands::document_system::document_detect_type,
            commands::document_system::document_parse,
            commands::document_system::document_extract_text,
            commands::document_system::document_get_info,
            commands::document_system::document_clear_expired_cache,
            commands::document_system::document_clear_cache,
            commands::document_system::document_get_cache_stats,

            // === AUTOFILL SYSTEM v2 ===
            commands::autofill_system_v2::autofill_create_profile,
            commands::autofill_system_v2::autofill_get_profile,
            commands::autofill_system_v2::autofill_get_all_profiles,
            commands::autofill_system_v2::autofill_update_profile,
            commands::autofill_system_v2::autofill_delete_profile,
            commands::autofill_system_v2::autofill_add_profile,
            commands::autofill_system_v2::autofill_detect_fields,
            commands::autofill_system_v2::autofill_detect_field_type,
            commands::autofill_system_v2::autofill_validate_field,
            commands::autofill_system_v2::autofill_validate_email,
            commands::autofill_system_v2::autofill_validate_phone,
            commands::autofill_system_v2::autofill_validate_url,
            commands::autofill_system_v2::autofill_validate_postal_code,
            commands::autofill_system_v2::autofill_format_field,
            commands::autofill_system_v2::autofill_format_phone,
            commands::autofill_system_v2::autofill_format_name,
            commands::autofill_system_v2::autofill_format_postal_code,
            commands::autofill_system_v2::autofill_execute,
            commands::autofill_system_v2::autofill_quick_fill,
            commands::autofill_system_v2::autofill_field_type_to_string,
            commands::autofill_system_v2::autofill_get_profile_stats,
            commands::autofill_system_v2::autofill_get_system_stats,
            commands::autofill_system_v2::autofill_import_profiles,
            commands::autofill_system_v2::autofill_export_profiles,
            commands::autofill_system_v2::autofill_batch_validate,
            commands::autofill_system_v2::autofill_batch_format,

            // === AUTOFILL COMMANDS ===
            commands::autofill_commands::af2_create_profile,
            commands::autofill_commands::af2_get_profile,
            commands::autofill_commands::af2_get_all_profiles,
            commands::autofill_commands::af2_update_profile,
            commands::autofill_commands::af2_delete_profile,
            commands::autofill_commands::af2_add_profile_field,
            commands::autofill_commands::af2_remove_profile_field,
            commands::autofill_commands::af2_get_profile_field,
            commands::autofill_commands::af2_detect_fields,
            commands::autofill_commands::af2_detect_field_type,
            commands::autofill_commands::af2_validate_field,
            commands::autofill_commands::af2_validate_email,
            commands::autofill_commands::af2_validate_phone,
            commands::autofill_commands::af2_validate_url,
            commands::autofill_commands::af2_validate_postal_code,
            commands::autofill_commands::af2_validate_date,
            commands::autofill_commands::af2_format_field,
            commands::autofill_commands::af2_format_phone,
            commands::autofill_commands::af2_format_postal_code,
            commands::autofill_commands::af2_format_currency,
            commands::autofill_commands::af2_format_date,
            commands::autofill_commands::af2_format_name,
            commands::autofill_commands::af2_execute,
            commands::autofill_commands::af2_smart_execute,
            commands::autofill_commands::af2_preview,
            commands::autofill_commands::af2_get_statistics,
            commands::autofill_commands::af2_get_profile_usage,
            commands::autofill_commands::af2_get_field_types,
            commands::autofill_commands::af2_export_profile,
            commands::autofill_commands::af2_import_profile,
            commands::autofill_commands::af2_clear_all_profiles,

            // === CHROME EXTENSION MANAGEMENT ===
            commands::extension_commands::install_extension_unpacked,
            commands::extension_commands::install_extension_from_web_store,
            commands::extension_commands::install_extension_from_crx,
            commands::extension_commands::enable_extension,
            commands::extension_commands::disable_extension,
            commands::extension_commands::uninstall_extension,
            commands::extension_commands::update_extension,
            commands::extension_commands::get_extension_info,
            commands::extension_commands::get_all_extensions,
            commands::extension_commands::get_enabled_extensions,

            // === CHROME EXTENSION BRIDGE ===
            commands::chrome_extension_bridge::chrome_extension_runtime_send_message,
            commands::chrome_extension_bridge::chrome_extension_storage_get,
            commands::chrome_extension_bridge::chrome_extension_storage_set,
            commands::chrome_extension_bridge::chrome_extension_storage_clear,

            // === INTEGRATION COMMANDS ===
            commands::integration_commands::whatsapp_connect,
            commands::integration_commands::whatsapp_send_text,
            commands::integration_commands::whatsapp_send_media,
            commands::integration_commands::whatsapp_process_webhook,
            commands::integration_commands::whatsapp_get_message_history,
            commands::integration_commands::whatsapp_get_pending_commands,
            commands::integration_commands::monday_connect,
            commands::integration_commands::monday_get_boards,
            commands::integration_commands::monday_create_item,
            commands::integration_commands::monday_update_item,
            commands::integration_commands::planius_analyze_project,
            commands::integration_commands::detect_files_from_html,
            commands::integration_commands::queue_file_download,
            commands::integration_commands::download_file,
            commands::integration_commands::get_download_status,
            commands::integration_commands::get_all_downloads,
            commands::integration_commands::get_detected_files,
            commands::integration_commands::create_profile_from_data,
            commands::integration_commands::auto_process_document,

            // === DATABASE COMMANDS ===
            commands::database::db_get_setting,
            commands::database::db_set_setting,
            commands::database::db_save_api_key,
            commands::database::db_get_api_key,
            commands::database::db_save_workflow,
            commands::database::db_get_workflows,
            commands::database::db_add_history,
            commands::database::db_get_history,
            commands::database::db_clear_old_history,

            // === ADVANCED SELECTOR BUILDER (beats Selenium IDE, Katalon, Playwright Inspector) ===
            commands::advanced_selector::test_selector,
            commands::advanced_selector::generate_ai_selector_alternatives,
            commands::advanced_selector::generate_auto_healing_selector,
            commands::advanced_selector::start_visual_selector_picker,
            commands::advanced_selector::wait_for_element_selection,

            // === MULTI-FORMAT DATA EXPORT (beats Apify, Octoparse, ParseHub) ===
            commands::data_export::export_to_json,
            commands::data_export::export_to_csv,
            commands::data_export::export_to_sql,
            commands::data_export::export_to_xml,

            // === VISUAL WORKFLOW CANVAS (React Flow backend) ===
            commands::workflow_canvas::canvas_save_workflow,
            commands::workflow_canvas::canvas_load_workflow,
            commands::workflow_canvas::canvas_list_workflows,
            commands::workflow_canvas::canvas_delete_workflow,
            commands::workflow_canvas::canvas_execute_workflow,
            commands::workflow_canvas::canvas_validate_workflow,

            // === WORKFLOW SCHEDULER (Cron + Queue Management) ===
            commands::scheduler::scheduler_add_schedule,
            commands::scheduler::scheduler_remove_schedule,
            commands::scheduler::scheduler_toggle_schedule,
            commands::scheduler::scheduler_get_schedules,
            commands::scheduler::scheduler_get_queue,
            commands::scheduler::scheduler_start,
            commands::scheduler::scheduler_stop,
            commands::scheduler::scheduler_clear_completed,
            commands::scheduler::scheduler_cancel_execution,
            commands::scheduler::scheduler_validate_cron,

            // === MONITORING & OBSERVABILITY (Metrics, Logs, Alerts) ===
            // Metrics Commands
            commands::monitoring::metrics_get_execution,
            commands::monitoring::metrics_get_active_executions,
            commands::monitoring::metrics_get_workflow_stats,
            commands::monitoring::metrics_get_system_stats,
            commands::monitoring::metrics_cleanup,
            // Logs Commands
            commands::monitoring::logs_add,
            commands::monitoring::logs_get,
            commands::monitoring::logs_get_recent,
            commands::monitoring::logs_export_json,
            commands::monitoring::logs_export_csv,
            commands::monitoring::logs_export_txt,
            commands::monitoring::logs_clear,
            commands::monitoring::logs_get_stats,
            // Alerts Commands
            commands::monitoring::alerts_add_rule,
            commands::monitoring::alerts_remove_rule,
            commands::monitoring::alerts_toggle_rule,
            commands::monitoring::alerts_get_rules,
            commands::monitoring::alerts_get_history,
            commands::monitoring::alerts_clear_history,
            commands::monitoring::alerts_test_channel,

            // === API SERVER COMMANDS ===
            commands::api_server::api_server_start,
            commands::api_server::api_server_stop,
            commands::api_server::api_server_get_status,
            commands::api_server::api_server_configure,
            commands::api_server::api_server_test_endpoint,

            // === GOOGLE SHEETS COMMANDS ===
            commands::google_sheets::google_sheets_configure,
            commands::google_sheets::google_sheets_get_auth_url,
            commands::google_sheets::google_sheets_exchange_code,
            commands::google_sheets::google_sheets_read_range,
            commands::google_sheets::google_sheets_write_range,
            commands::google_sheets::google_sheets_append_rows,
            commands::google_sheets::google_sheets_create_spreadsheet,
            commands::google_sheets::google_sheets_get_info,
            commands::google_sheets::google_sheets_clear_range,

            // === SLACK/DISCORD INTEGRATION COMMANDS ===
            commands::integrations::slack_send_message,
            commands::integrations::slack_send_message_full,
            commands::integrations::slack_send_notification,
            commands::integrations::slack_send_fields,
            commands::integrations::slack_upload_file,
            commands::integrations::slack_send_blocks,
            commands::integrations::discord_send_message,
            commands::integrations::discord_send_message_full,
            commands::integrations::discord_send_embed,
            commands::integrations::discord_send_notification,
            commands::integrations::discord_send_fields,
            commands::integrations::discord_upload_file,
            commands::integrations::discord_send_rich_embed,
            commands::integrations::discord_send_multiple_embeds,

            // === ANTI-DETECTION COMMANDS ===
            // Stealth (6 commands)
            commands::stealth::stealth_set_config,
            commands::stealth::stealth_get_config,
            commands::stealth::stealth_generate_fingerprint,
            commands::stealth::stealth_get_fingerprint,
            commands::stealth::stealth_get_script,
            commands::stealth::stealth_get_user_agent,
            // Proxy (10 commands)
            commands::stealth::proxy_add,
            commands::stealth::proxy_remove,
            commands::stealth::proxy_list,
            commands::stealth::proxy_set_strategy,
            commands::stealth::proxy_get_next,
            commands::stealth::proxy_check_health,
            commands::stealth::proxy_toggle,
            commands::stealth::proxy_get_stats,
            commands::stealth::proxy_clear,
            // CAPTCHA (6 commands)
            commands::stealth::captcha_configure,
            commands::stealth::captcha_solve_recaptcha_v2,
            commands::stealth::captcha_solve_recaptcha_v3,
            commands::stealth::captcha_solve_hcaptcha,
            commands::stealth::captcha_solve_image,
            commands::stealth::captcha_get_balance,
            // Rate Limiter (6 commands)
            commands::stealth::rate_limiter_set_config,
            commands::stealth::rate_limiter_get_config,
            commands::stealth::rate_limiter_wait,
            commands::stealth::rate_limiter_complete,
            commands::stealth::rate_limiter_get_stats,
            commands::stealth::rate_limiter_clear_stats,

            // === WEBVIEW COMMANDS ===
            commands::webview_commands::webview_create,
            commands::webview_commands::webview_navigate,
            commands::webview_commands::webview_get_url,
            commands::webview_commands::webview_close,
            commands::webview_commands::webview_go_back,
            commands::webview_commands::webview_go_forward,
            commands::webview_commands::webview_reload,
            commands::webview_commands::webview_resize,
            commands::webview_commands::webview_move,
            commands::webview_commands::position_browser_tab_window,
            commands::webview_commands::webview_set_visible,
            commands::webview_commands::webview_get_all,
            commands::webview_commands::webview_eval_js,

            // === EMBEDDED WEBVIEW COMMANDS (NATIVE BROWSER) ===
            commands::embedded_webview::embedded_webview_create,
            commands::embedded_webview::embedded_webview_navigate,
            commands::embedded_webview::embedded_webview_close,
            commands::embedded_webview::embedded_webview_back,
            commands::embedded_webview::embedded_webview_forward,
            commands::embedded_webview::embedded_webview_reload,
            commands::embedded_webview::embedded_webview_set_bounds,
            commands::embedded_webview::embedded_webview_set_visible,
            commands::embedded_webview::embedded_webview_eval,
            commands::embedded_webview::embedded_webview_get_url,
            commands::embedded_webview::embedded_webview_get_title,
            commands::embedded_webview::embedded_webview_list,
            commands::embedded_webview::embedded_webview_get_active,
            commands::embedded_webview::embedded_webview_inject_css,
            commands::embedded_webview::embedded_webview_screenshot,
            commands::embedded_webview::cube_devtools_get_dom,
            commands::embedded_webview::cube_devtools_get_styles,
            commands::embedded_webview::cube_devtools_get_network,
            commands::embedded_webview::cube_devtools_inject_network_monitor,
            commands::embedded_webview::cube_devtools_get_console,
            commands::embedded_webview::cube_devtools_inject_console_monitor,
            commands::embedded_webview::cube_devtools_get_performance,
            commands::embedded_webview::cube_devtools_highlight_element,
            commands::embedded_webview::cube_devtools_execute_console,

            // === DEVTOOLS COMMANDS ===
            commands::devtools::devtools_get_console,
            commands::devtools::devtools_get_network,
            commands::devtools::devtools_get_dom,
            commands::devtools::devtools_get_localstorage,
            commands::devtools::devtools_get_sessionstorage,
            commands::devtools::devtools_execute_script,
            commands::devtools::devtools_clear_console,
            commands::devtools::devtools_clear_network,

            // === BROWSER PROXY (BYPASS X-FRAME-OPTIONS) ===
            commands::browser_proxy::browser_proxy_start,
            commands::browser_proxy::browser_proxy_stop,
            commands::browser_proxy::browser_proxy_get_url,

            // === CUBE BROWSER ENGINE - REAL CHROMIUM INTEGRATION ===
            commands::cube_browser_commands::cube_engine_init,
            commands::cube_browser_commands::cube_engine_shutdown,
            commands::cube_browser_commands::cube_create_tab,
            commands::cube_browser_commands::cube_navigate,
            commands::cube_browser_commands::cube_close_tab,
            commands::cube_browser_commands::cube_go_back,
            commands::cube_browser_commands::cube_go_forward,
            commands::cube_browser_commands::cube_reload,
            commands::cube_browser_commands::cube_get_url,
            commands::cube_browser_commands::cube_get_title,
            commands::cube_browser_commands::cube_execute_script,
            commands::cube_browser_commands::cube_query_selector,
            commands::cube_browser_commands::cube_query_selector_all,
            commands::cube_browser_commands::cube_get_page_html,
            commands::cube_browser_commands::cube_get_inner_html,
            commands::cube_browser_commands::cube_set_value,
            commands::cube_browser_commands::cube_click,
            commands::cube_browser_commands::cube_type_text,
            commands::cube_browser_commands::cube_focus,
            commands::cube_browser_commands::cube_scroll_to,
            commands::cube_browser_commands::cube_screenshot,
            commands::cube_browser_commands::cube_capture_frame,
            commands::cube_browser_commands::cube_get_cookies,
            commands::cube_browser_commands::cube_set_cookie,
            commands::cube_browser_commands::cube_get_local_storage,
            commands::cube_browser_commands::cube_set_local_storage,
            commands::cube_browser_commands::cube_get_session_storage,
            commands::cube_browser_commands::cube_set_session_storage,
            commands::cube_browser_commands::cube_get_form_fields,
            commands::cube_browser_commands::cube_fill_form,
            commands::cube_browser_commands::cube_submit_form,
            commands::cube_browser_commands::cube_extract_data,
            commands::cube_browser_commands::cube_extract_table,
            commands::cube_browser_commands::cube_print_to_pdf,

            // === CUBE SHIELD - AD/TRACKER BLOCKER (SUPERIOR TO BRAVE SHIELDS) ===
            commands::browser_shield_commands::shield_get_config,
            commands::browser_shield_commands::shield_set_config,
            commands::browser_shield_commands::shield_set_enabled,
            commands::browser_shield_commands::shield_set_level,
            commands::browser_shield_commands::shield_toggle_feature,
            commands::browser_shield_commands::shield_set_cookie_blocking,
            commands::browser_shield_commands::shield_set_site_config,
            commands::browser_shield_commands::shield_get_site_config,
            commands::browser_shield_commands::shield_whitelist_add,
            commands::browser_shield_commands::shield_whitelist_remove,
            commands::browser_shield_commands::shield_whitelist_get,
            commands::browser_shield_commands::shield_blacklist_add,
            commands::browser_shield_commands::shield_blacklist_get,
            commands::browser_shield_commands::shield_add_custom_rule,
            commands::browser_shield_commands::shield_remove_custom_rule,
            commands::browser_shield_commands::shield_get_custom_rules,
            commands::browser_shield_commands::shield_toggle_custom_rule,
            commands::browser_shield_commands::shield_get_stats,
            commands::browser_shield_commands::shield_reset_stats,
            commands::browser_shield_commands::shield_should_block,
            commands::browser_shield_commands::shield_should_block_cookie,
            commands::browser_shield_commands::shield_get_fingerprint_script,
            commands::browser_shield_commands::shield_get_cosmetic_css,
            commands::browser_shield_commands::shield_upgrade_https,
            commands::browser_shield_commands::shield_apply_preset,
            commands::browser_shield_commands::shield_export_config,
            commands::browser_shield_commands::shield_import_config,

            // === CUBE TAB GROUPS - AI-POWERED TAB MANAGEMENT (SUPERIOR TO CHROME/OPERA/VIVALDI) ===
            commands::browser_tab_groups_commands::tab_groups_get_config,
            commands::browser_tab_groups_commands::tab_groups_set_config,
            commands::browser_tab_groups_commands::tab_groups_set_enabled,
            commands::browser_tab_groups_commands::tab_groups_set_auto_group,
            commands::browser_tab_groups_commands::tab_groups_set_vertical_tabs,
            commands::browser_tab_groups_commands::tab_groups_set_stacking,
            commands::browser_tab_groups_commands::tab_groups_create,
            commands::browser_tab_groups_commands::tab_groups_get,
            commands::browser_tab_groups_commands::tab_groups_get_all,
            commands::browser_tab_groups_commands::tab_groups_delete,
            commands::browser_tab_groups_commands::tab_groups_rename,
            commands::browser_tab_groups_commands::tab_groups_set_color,
            commands::browser_tab_groups_commands::tab_groups_toggle_collapsed,
            commands::browser_tab_groups_commands::tab_groups_pin,
            commands::browser_tab_groups_commands::tab_groups_register_tab,
            commands::browser_tab_groups_commands::tab_groups_unregister_tab,
            commands::browser_tab_groups_commands::tab_groups_get_tab,
            commands::browser_tab_groups_commands::tab_groups_update_tab,
            commands::browser_tab_groups_commands::tab_groups_move_tab,
            commands::browser_tab_groups_commands::tab_groups_ungroup_tab,
            commands::browser_tab_groups_commands::tab_groups_get_ungrouped,
            commands::browser_tab_groups_commands::tab_groups_stack_tabs,
            commands::browser_tab_groups_commands::tab_groups_unstack_tabs,
            commands::browser_tab_groups_commands::tab_groups_add_to_stack,
            commands::browser_tab_groups_commands::tab_groups_get_suggestions,
            commands::browser_tab_groups_commands::tab_groups_apply_suggestion,
            commands::browser_tab_groups_commands::tab_groups_add_rule,
            commands::browser_tab_groups_commands::tab_groups_remove_rule,
            commands::browser_tab_groups_commands::tab_groups_update_rule,
            commands::browser_tab_groups_commands::tab_groups_get_stats,

            // === NATIVE BROWSER (FULL WEBVIEW - YOUTUBE, NETFLIX, AUTH SITES) ===
            commands::native_browser::native_browser_create,
            commands::native_browser::native_browser_navigate,
            commands::native_browser::native_browser_close,
            commands::native_browser::native_browser_back,
            commands::native_browser::native_browser_forward,
            commands::native_browser::native_browser_reload,
            commands::native_browser::native_browser_set_bounds,
            commands::native_browser::native_browser_set_visible,
            commands::native_browser::native_browser_get_url,
            commands::native_browser::native_browser_get_title,
            commands::native_browser::native_browser_eval,
            commands::native_browser::native_browser_focus,
            commands::native_browser::native_browser_list,
            commands::native_browser::native_browser_close_all,

            // === EMBEDDED BROWSER (TABBED WEBVIEWS IN MAIN WINDOW) ===
            commands::embedded_browser::embedded_create_tab,
            commands::embedded_browser::embedded_navigate,
            commands::embedded_browser::embedded_close_tab,
            commands::embedded_browser::embedded_switch_tab,
            commands::embedded_browser::embedded_update_bounds,
            commands::embedded_browser::embedded_go_back,
            commands::embedded_browser::embedded_go_forward,
            commands::embedded_browser::embedded_reload,
            commands::embedded_browser::embedded_stop,
            commands::embedded_browser::embedded_get_tabs,
            commands::embedded_browser::embedded_get_active_tab,
            commands::embedded_browser::embedded_execute_script,
            commands::embedded_browser::embedded_get_url,
            commands::embedded_browser::embedded_update_tab_info,
            commands::embedded_browser::embedded_close_all_tabs,

            // === CUBE WEB ENGINE (TRUE EMBEDDED BROWSER - NO EXTERNAL WINDOWS) ===
            commands::cube_web_engine_commands::cube_engine_create_tab,
            commands::cube_web_engine_commands::cube_engine_close_tab,
            commands::cube_web_engine_commands::cube_engine_close_all_tabs,
            commands::cube_web_engine_commands::cube_engine_get_tabs,
            commands::cube_web_engine_commands::cube_engine_get_tab,
            commands::cube_web_engine_commands::cube_engine_set_active_tab,
            commands::cube_web_engine_commands::cube_engine_get_active_tab,
            commands::cube_web_engine_commands::cube_engine_update_bounds,
            commands::cube_web_engine_commands::cube_engine_navigate,
            commands::cube_web_engine_commands::cube_engine_fetch_url,
            commands::cube_web_engine_commands::cube_engine_fetch_page,
            commands::cube_web_engine_commands::cube_engine_go_back,
            commands::cube_web_engine_commands::cube_engine_go_forward,
            commands::cube_web_engine_commands::cube_engine_reload,
            commands::cube_web_engine_commands::cube_engine_stop,
            commands::cube_web_engine_commands::cube_engine_execute_script,
            commands::cube_web_engine_commands::cube_engine_dom_command,
            commands::cube_web_engine_commands::cube_engine_get_page_source,
            commands::cube_web_engine_commands::cube_engine_update_tab_info,
            commands::cube_web_engine_commands::cube_engine_get_config,
            commands::cube_web_engine_commands::cube_engine_set_config,
            commands::cube_web_engine_commands::cube_engine_set_headers,
            commands::cube_web_engine_commands::cube_engine_set_user_agent,
            commands::cube_web_engine_commands::cube_engine_set_zoom,
            commands::cube_web_engine_commands::cube_engine_get_zoom,
            commands::cube_web_engine_commands::cube_engine_get_history,
            commands::cube_web_engine_commands::cube_engine_clear_history,
            commands::cube_web_engine_commands::cube_engine_screenshot,
            commands::cube_web_engine_commands::cube_engine_print_to_pdf,
            commands::cube_web_engine_commands::cube_engine_devtools_get_dom,
            commands::cube_web_engine_commands::cube_engine_devtools_get_network,
            commands::cube_web_engine_commands::cube_engine_devtools_get_console,

            // === CUBE ENGINE RENDERING (PHASE 1) ===
            commands::cube_engine_rendering::webgl_create_context,
            commands::cube_engine_rendering::webgl_get_context,
            commands::cube_engine_rendering::webgl_destroy_context,
            commands::cube_engine_rendering::webgl_get_capabilities,
            commands::cube_engine_rendering::webgl_get_extension,
            commands::cube_engine_rendering::canvas_create_context,
            commands::cube_engine_rendering::canvas_get_context,
            commands::cube_engine_rendering::canvas_resize,
            commands::cube_engine_rendering::canvas_destroy_context,
            commands::cube_engine_rendering::css_parse_stylesheet,
            commands::cube_engine_rendering::css_get_cached,
            commands::cube_engine_rendering::css_clear_cache,
            commands::cube_engine_rendering::css_compute_style,
            commands::cube_engine_rendering::layout_compute,
            commands::cube_engine_rendering::layout_get_element_bounds,
            commands::cube_engine_rendering::layout_invalidate,
            commands::cube_engine_rendering::font_load,
            commands::cube_engine_rendering::font_get_loaded,
            commands::cube_engine_rendering::font_unload,
            commands::cube_engine_rendering::image_cache_store,
            commands::cube_engine_rendering::image_cache_get,
            commands::cube_engine_rendering::image_cache_clear,
            commands::cube_engine_rendering::image_cache_stats,
            commands::cube_engine_rendering::render_get_config,
            commands::cube_engine_rendering::render_set_config,

            // === CUBE ENGINE TAB MANAGEMENT (PHASE 2) ===
            commands::cube_engine_tab_management::tab_hibernate,
            commands::cube_engine_tab_management::tab_wake,
            commands::cube_engine_tab_management::tab_get_hibernated,
            commands::cube_engine_tab_management::tab_is_hibernated,
            commands::cube_engine_tab_management::tab_auto_hibernate_check,
            commands::cube_engine_tab_management::tab_group_create,
            commands::cube_engine_tab_management::tab_group_get,
            commands::cube_engine_tab_management::tab_group_list,
            commands::cube_engine_tab_management::tab_group_update,
            commands::cube_engine_tab_management::tab_group_delete,
            commands::cube_engine_tab_management::tab_group_add_tab,
            commands::cube_engine_tab_management::tab_group_remove_tab,
            commands::cube_engine_tab_management::tab_group_toggle_collapse,
            commands::cube_engine_tab_management::pip_create,
            commands::cube_engine_tab_management::pip_close,
            commands::cube_engine_tab_management::engine_pip_update_position,
            commands::cube_engine_tab_management::engine_pip_update_size,
            commands::cube_engine_tab_management::pip_toggle_play,
            commands::cube_engine_tab_management::engine_pip_set_volume,
            commands::cube_engine_tab_management::pip_get_all,
            commands::cube_engine_tab_management::engine_tab_preview_capture,
            commands::cube_engine_tab_management::engine_tab_preview_get,
            commands::cube_engine_tab_management::tab_preview_invalidate,
            commands::cube_engine_tab_management::tab_preview_clear_all,
            commands::cube_engine_tab_management::tab_session_save,
            commands::cube_engine_tab_management::tab_session_get,
            commands::cube_engine_tab_management::tab_session_list,
            commands::cube_engine_tab_management::tab_session_delete,
            commands::cube_engine_tab_management::tab_session_update,
            commands::cube_engine_tab_management::tab_mgmt_get_config,
            commands::cube_engine_tab_management::tab_mgmt_set_config,

            // === CUBE ENGINE SECURITY (PHASE 3) ===
            commands::cube_engine_security::csp_set_policy,
            commands::cube_engine_security::csp_get_policy,
            commands::cube_engine_security::csp_check_request,
            commands::cube_engine_security::csp_report_violation,
            commands::cube_engine_security::cert_get_info,
            commands::cube_engine_security::cert_store_info,
            commands::cube_engine_security::cert_verify,
            commands::cube_engine_security::cert_add_exception,
            commands::cube_engine_security::tracker_check_url,
            commands::cube_engine_security::tracker_block_request,
            commands::cube_engine_security::tracker_get_blocked,
            commands::cube_engine_security::tracker_get_stats,
            commands::cube_engine_security::tracker_update_database,
            commands::cube_engine_security::fingerprint_get_config,
            commands::cube_engine_security::fingerprint_set_config,
            commands::cube_engine_security::fingerprint_set_level,
            commands::cube_engine_security::fingerprint_get_noise_value,
            commands::cube_engine_security::permission_get,
            commands::cube_engine_security::permission_set,
            commands::cube_engine_security::permission_reset,
            commands::cube_engine_security::permission_get_all,
            commands::cube_engine_security::security_get_config,
            commands::cube_engine_security::security_set_config,
            commands::cube_engine_security::security_set_https_only,
            commands::cube_engine_security::security_set_dnt,
            commands::cube_engine_security::security_check_safe_browsing,

            // === CUBE ENGINE PERFORMANCE (PHASE 4) ===
            commands::cube_engine_performance::cache_store,
            commands::cube_engine_performance::cache_get,
            commands::cube_engine_performance::cache_remove,
            commands::cube_engine_performance::cache_clear,
            commands::cube_engine_performance::cache_get_stats,
            commands::cube_engine_performance::cache_evict_lru,
            commands::cube_engine_performance::prefetch_add,
            commands::cube_engine_performance::prefetch_get_queue,
            commands::cube_engine_performance::prefetch_clear_queue,
            commands::cube_engine_performance::prefetch_update_status,
            commands::cube_engine_performance::memory_get_stats,
            commands::cube_engine_performance::memory_update_stats,
            commands::cube_engine_performance::memory_update_tab,
            commands::cube_engine_performance::memory_trigger_gc,
            commands::cube_engine_performance::memory_report_pressure,
            commands::cube_engine_performance::process_get_all,
            commands::cube_engine_performance::process_get,
            commands::cube_engine_performance::process_register,
            commands::cube_engine_performance::process_update_stats,
            commands::cube_engine_performance::process_terminate,
            commands::cube_engine_performance::perf_record_metrics,
            commands::cube_engine_performance::perf_get_metrics,
            commands::cube_engine_performance::perf_get_web_vitals,
            commands::cube_engine_performance::perf_clear_metrics,
            commands::cube_engine_performance::perf_get_config,
            commands::cube_engine_performance::perf_set_config,
            commands::cube_engine_performance::perf_set_memory_saver,
            commands::cube_engine_performance::perf_set_hardware_acceleration,

            // === CUBE ENGINE DEVTOOLS (PHASE 5) ===
            commands::cube_engine_devtools::network_log_request,
            commands::cube_engine_devtools::network_get_logs,
            commands::cube_engine_devtools::network_clear_logs,
            commands::cube_engine_devtools::network_get_request,
            commands::cube_engine_devtools::console_log_message,
            commands::cube_engine_devtools::console_get_logs,
            commands::cube_engine_devtools::console_clear,
            commands::cube_engine_devtools::console_execute,
            commands::cube_engine_devtools::dom_capture_snapshot,
            commands::cube_engine_devtools::dom_get_snapshot,
            commands::cube_engine_devtools::dom_get_node,
            commands::cube_engine_devtools::dom_highlight_node,
            commands::cube_engine_devtools::dom_set_attribute,
            commands::cube_engine_devtools::profiler_start,
            commands::cube_engine_devtools::profiler_stop,
            commands::cube_engine_devtools::profiler_add_sample,
            commands::cube_engine_devtools::profiler_get_session,
            commands::cube_engine_devtools::debugger_set_breakpoint,
            commands::cube_engine_devtools::debugger_remove_breakpoint,
            commands::cube_engine_devtools::debugger_get_breakpoints,
            commands::cube_engine_devtools::debugger_add_watch,
            commands::cube_engine_devtools::debugger_remove_watch,
            commands::cube_engine_devtools::debugger_resume,
            commands::cube_engine_devtools::debugger_step_over,
            commands::cube_engine_devtools::debugger_step_into,
            commands::cube_engine_devtools::debugger_step_out,
            commands::cube_engine_devtools::devtools_get_config,
            commands::cube_engine_devtools::devtools_set_config,
            commands::cube_engine_devtools::devtools_set_throttling,

            // === CUBE ENGINE EXTENSIONS (PHASE 6) ===
            commands::cube_engine_extensions::extension_install,
            commands::cube_engine_extensions::extension_uninstall,
            commands::cube_engine_extensions::extension_enable,
            commands::cube_engine_extensions::extension_disable,
            commands::cube_engine_extensions::extension_get,
            commands::cube_engine_extensions::extension_list,
            commands::cube_engine_extensions::content_script_inject,
            commands::cube_engine_extensions::content_script_remove,
            commands::cube_engine_extensions::content_script_list,
            commands::cube_engine_extensions::background_start,
            commands::cube_engine_extensions::background_stop,
            commands::cube_engine_extensions::background_get,
            commands::cube_engine_extensions::ext_storage_get,
            commands::cube_engine_extensions::ext_storage_set,
            commands::cube_engine_extensions::ext_storage_remove,
            commands::cube_engine_extensions::ext_storage_clear,
            commands::cube_engine_extensions::permission_request,
            commands::cube_engine_extensions::permission_grant,
            commands::cube_engine_extensions::permission_revoke,
            commands::cube_engine_extensions::permission_check,
            commands::cube_engine_extensions::message_send,
            commands::cube_engine_extensions::port_connect,
            commands::cube_engine_extensions::port_disconnect,
            commands::cube_engine_extensions::extensions_get_config,
            commands::cube_engine_extensions::extensions_set_config,
            commands::cube_engine_extensions::extensions_set_developer_mode,

            // === CUBE ENGINE MEDIA (PHASE 7) ===
            commands::cube_engine_media::media_create_session,
            commands::cube_engine_media::media_play,
            commands::cube_engine_media::media_pause,
            commands::cube_engine_media::media_seek,
            commands::cube_engine_media::media_set_volume,
            commands::cube_engine_media::media_set_playback_rate,
            commands::cube_engine_media::media_toggle_pip,
            commands::cube_engine_media::media_get_session,
            commands::cube_engine_media::media_destroy_session,
            commands::cube_engine_media::media_download_start,
            commands::cube_engine_media::media_download_pause,
            commands::cube_engine_media::media_download_resume,
            commands::cube_engine_media::media_download_cancel,
            commands::cube_engine_media::media_download_update_progress,
            commands::cube_engine_media::media_download_complete,
            commands::cube_engine_media::media_download_get,
            commands::cube_engine_media::media_download_list,
            commands::cube_engine_media::media_download_remove,
            commands::cube_engine_media::pdf_open,
            commands::cube_engine_media::pdf_go_to_page,
            commands::cube_engine_media::pdf_set_zoom,
            commands::cube_engine_media::pdf_set_fit_mode,
            commands::cube_engine_media::pdf_rotate,
            commands::cube_engine_media::pdf_add_annotation,
            commands::cube_engine_media::pdf_get,
            commands::cube_engine_media::pdf_close,
            commands::cube_engine_media::print_start,
            commands::cube_engine_media::print_cancel,
            commands::cube_engine_media::print_get_job,
            commands::cube_engine_media::media_get_config,
            commands::cube_engine_media::media_set_config,
            commands::cube_engine_media::download_get_config,
            commands::cube_engine_media::download_set_config,

            // === SMART SELECTOR - AI POWERED (ELITE LEVEL) ===
            commands::smart_selector::generate_smart_selector,
            commands::smart_selector::validate_selector,
            commands::smart_selector::record_selector_usage,
            commands::smart_selector::get_selector_suggestions,

            // === COLLABORATION SYSTEM - BEATS ZOOM/ANYVIEWER ===
            commands::collaboration::create_collaboration_session,
            commands::collaboration::join_collaboration_session,
            commands::collaboration::update_cursor_position,
            commands::collaboration::start_screen_sharing,
            commands::collaboration::stop_screen_sharing,
            commands::collaboration::share_workflow_in_session,
            commands::collaboration::apply_collaborative_edit,
            commands::collaboration::get_session_edits,
            commands::collaboration::send_collaboration_chat,
            commands::collaboration::start_session_recording,
            commands::collaboration::stop_session_recording,
            commands::collaboration::grant_participant_permission,
            commands::collaboration::leave_collaboration_session,
            commands::collaboration::get_active_sessions,
            commands::collaboration::get_session_details,

            // === TOOLBAR TOOLS - FLOATING TOOLBAR BACKEND ===
            commands::toolbar_tools::toolbar_take_screenshot,
            commands::toolbar_tools::toolbar_start_recording,
            commands::toolbar_tools::toolbar_stop_recording,
            commands::toolbar_tools::toolbar_pick_color,
            commands::toolbar_tools::toolbar_inspect_element,
            commands::toolbar_tools::toolbar_measure_distance,
            commands::toolbar_tools::toolbar_list_layers,
            commands::toolbar_tools::toolbar_detect_files,
            commands::toolbar_tools::toolbar_parse_page,
            commands::toolbar_tools::toolbar_trigger_autofill,
            commands::toolbar_tools::toolbar_lendingpad_login,
            commands::toolbar_tools::toolbar_execute_quick_action,
            commands::toolbar_tools::toolbar_download_file,
            commands::toolbar_tools::toolbar_start_screen_share,
            commands::toolbar_tools::toolbar_stop_screen_share,
            commands::toolbar_tools::toolbar_start_remote_desktop,
            commands::toolbar_tools::toolbar_stop_remote_desktop,
            commands::toolbar_tools::toolbar_record_macro,
            commands::toolbar_tools::toolbar_stop_macro_recording,
            commands::toolbar_tools::toolbar_play_macro,
            commands::toolbar_tools::toolbar_list_macros,

            // === UPDATES SYSTEM (Auto/Manual updates from admin server) ===
            commands::updates::check_for_updates,
            commands::updates::get_current_version,
            commands::updates::get_cached_update_info,
            commands::updates::download_update,
            commands::updates::get_download_progress,
            commands::updates::install_update,
            commands::updates::get_update_settings,
            commands::updates::set_update_settings,
            commands::updates::set_auto_update,
            commands::updates::set_update_channel,
            commands::updates::get_release_notes,
            commands::updates::get_version_release_notes,
            commands::updates::check_extension_updates,
            commands::updates::download_extension_update,
            commands::updates::get_rollback_versions,
            commands::updates::rollback_to_version,

            // === CLOUD SYNC (Settings, billing, devices, backups) ===
            commands::cloud_sync::cloud_authenticate,
            commands::cloud_sync::cloud_authenticate_oauth,
            commands::cloud_sync::cloud_logout,
            commands::cloud_sync::cloud_is_authenticated,
            commands::cloud_sync::get_user_profile,
            commands::cloud_sync::update_user_profile,
            commands::cloud_sync::get_billing_info,
            commands::cloud_sync::get_subscription_plans,
            commands::cloud_sync::update_subscription,
            commands::cloud_sync::cancel_subscription,
            commands::cloud_sync::sync_to_cloud,
            commands::cloud_sync::sync_from_cloud,
            commands::cloud_sync::get_sync_config,
            commands::cloud_sync::set_sync_config,
            commands::cloud_sync::get_synced_devices,
            commands::cloud_sync::register_device,
            commands::cloud_sync::remove_device,
            commands::cloud_sync::get_cloud_backups,
            commands::cloud_sync::create_cloud_backup,
            commands::cloud_sync::restore_cloud_backup,
            commands::cloud_sync::delete_cloud_backup,

            // === ADMIN PANEL (Real backend for admin functionality) ===
            commands::admin::admin_create_user,
            commands::admin::admin_get_users,
            commands::admin::admin_get_user,
            commands::admin::admin_update_user,
            commands::admin::admin_delete_user,
            commands::admin::admin_suspend_user,
            commands::admin::admin_reactivate_user,
            commands::admin::admin_create_license,
            commands::admin::admin_get_licenses,
            commands::admin::admin_revoke_license,
            commands::admin::admin_extend_license,
            commands::admin::admin_record_sale,
            commands::admin::admin_get_sales,
            commands::admin::admin_refund_sale,
            commands::admin::admin_get_downloads,
            commands::admin::admin_record_download,
            commands::admin::admin_create_api_key,
            commands::admin::admin_get_api_keys,
            commands::admin::admin_revoke_api_key,
            commands::admin::admin_get_metrics,
            commands::admin::admin_get_server_stats,
            commands::admin::admin_get_services,
            commands::admin::admin_update_service_status,
            commands::admin::admin_get_audit_logs,
            commands::admin::admin_bulk_suspend_users,
            commands::admin::admin_bulk_delete_users,
            commands::admin::admin_export_data,

            // === ADMIN RELEASES (Update Manager) ===
            commands::admin_releases::admin_create_release,
            commands::admin_releases::admin_get_releases,
            commands::admin_releases::admin_get_release,
            commands::admin_releases::admin_publish_release,
            commands::admin_releases::admin_recall_release,
            commands::admin_releases::admin_update_rollout,
            commands::admin_releases::admin_delete_release,
            commands::admin_releases::admin_add_platform_binary,
            commands::admin_releases::admin_get_release_stats,
            commands::admin_releases::admin_get_update_settings,
            commands::admin_releases::admin_update_settings,
            commands::admin_releases::release_record_download,

            // === ADMIN AFFILIATES ===
            commands::admin_affiliates::admin_create_affiliate,
            commands::admin_affiliates::admin_get_affiliates,
            commands::admin_affiliates::admin_get_affiliate,
            commands::admin_affiliates::admin_approve_affiliate,
            commands::admin_affiliates::admin_suspend_affiliate,
            commands::admin_affiliates::admin_update_affiliate_tier,
            commands::admin_affiliates::admin_update_affiliate_payment,
            commands::admin_affiliates::admin_create_payout,
            commands::admin_affiliates::admin_process_payout,
            commands::admin_affiliates::admin_get_payouts,
            commands::admin_affiliates::admin_get_affiliate_stats,
            commands::admin_affiliates::admin_record_referral,

            // === ADMIN HELPDESK ===
            commands::admin_helpdesk::helpdesk_create_ticket,
            commands::admin_helpdesk::helpdesk_get_tickets,
            commands::admin_helpdesk::helpdesk_get_ticket,
            commands::admin_helpdesk::helpdesk_assign_ticket,
            commands::admin_helpdesk::helpdesk_add_reply,
            commands::admin_helpdesk::helpdesk_update_status,
            commands::admin_helpdesk::helpdesk_update_priority,
            commands::admin_helpdesk::helpdesk_get_agents,
            commands::admin_helpdesk::helpdesk_get_canned_responses,
            commands::admin_helpdesk::helpdesk_create_canned_response,
            commands::admin_helpdesk::helpdesk_use_canned_response,
            commands::admin_helpdesk::helpdesk_get_stats,
            commands::admin_helpdesk::helpdesk_merge_tickets,

            // === ADMIN FILES (File Manager) ===
            commands::admin_files::files_list,
            commands::admin_files::files_get,
            commands::admin_files::files_create_folder,
            commands::admin_files::files_upload,
            commands::admin_files::files_delete,
            commands::admin_files::files_rename,
            commands::admin_files::files_move,
            commands::admin_files::files_copy,
            commands::admin_files::files_toggle_star,
            commands::admin_files::files_update_permissions,
            commands::admin_files::files_create_share_link,
            commands::admin_files::files_get_share_links,
            commands::admin_files::files_delete_share_link,
            commands::admin_files::files_get_versions,
            commands::admin_files::files_get_stats,
            commands::admin_files::files_search,
            commands::admin_files::files_get_starred,
            commands::admin_files::files_get_recent,
            commands::admin_files::files_record_download,

            // === CRM COMMANDS ===
            commands::crm::crm_create_contact,
            commands::crm::crm_get_contacts,
            commands::crm::crm_get_contact,
            commands::crm::crm_update_contact,
            commands::crm::crm_delete_contact,
            commands::crm::crm_toggle_favorite,
            commands::crm::crm_log_contact,
            commands::crm::crm_create_company,
            commands::crm::crm_get_companies,
            commands::crm::crm_get_company,
            commands::crm::crm_delete_company,
            commands::crm::crm_create_deal,
            commands::crm::crm_get_deals,
            commands::crm::crm_get_deal,
            commands::crm::crm_update_deal_stage,
            commands::crm::crm_delete_deal,
            commands::crm::crm_create_activity,
            commands::crm::crm_get_activities,
            commands::crm::crm_complete_activity,
            commands::crm::crm_delete_activity,
            commands::crm::crm_get_pipelines,
            commands::crm::crm_get_pipeline_deals,
            commands::crm::crm_get_stats,
            commands::crm::crm_get_insights,
            commands::crm::crm_export_contacts,
            commands::crm::crm_export_deals,
            commands::crm::crm_get_quick_stats,
            commands::crm::crm_get_notifications,

            // === WORKSPACE MANAGER COMMANDS ===
            commands::workspace_manager::ws_mgr_create,
            commands::workspace_manager::ws_mgr_get_all,
            commands::workspace_manager::ws_mgr_get,
            commands::workspace_manager::ws_mgr_get_active,
            commands::workspace_manager::ws_mgr_set_active,
            commands::workspace_manager::ws_mgr_update,
            commands::workspace_manager::ws_mgr_delete,
            commands::workspace_manager::ws_mgr_create_tab,
            commands::workspace_manager::ws_mgr_get_tabs,
            commands::workspace_manager::ws_mgr_activate_tab,
            commands::workspace_manager::ws_mgr_update_tab,
            commands::workspace_manager::ws_mgr_close_tab,
            commands::workspace_manager::ws_mgr_reorder_tabs,
            commands::workspace_manager::ws_mgr_update_layout,
            commands::workspace_manager::ws_mgr_create_note,
            commands::workspace_manager::ws_mgr_get_notes,
            commands::workspace_manager::ws_mgr_update_note,
            commands::workspace_manager::ws_mgr_delete_note,
            commands::workspace_manager::ws_mgr_create_task,
            commands::workspace_manager::ws_mgr_get_tasks,
            commands::workspace_manager::ws_mgr_update_task,
            commands::workspace_manager::ws_mgr_delete_task,
            commands::workspace_manager::ws_mgr_add_subtask,
            commands::workspace_manager::ws_mgr_toggle_subtask,
            commands::workspace_manager::ws_mgr_save_session,
            commands::workspace_manager::ws_mgr_get_sessions,
            commands::workspace_manager::ws_mgr_restore_session,
            commands::workspace_manager::ws_mgr_delete_session,
            commands::workspace_manager::ws_mgr_export,
            commands::workspace_manager::ws_mgr_import,

            // === MARKETING COMMANDS ===
            commands::marketing::marketing_create_campaign,
            commands::marketing::marketing_get_campaigns,
            commands::marketing::marketing_get_campaign,
            commands::marketing::marketing_update_campaign,
            commands::marketing::marketing_delete_campaign,
            commands::marketing::marketing_send_campaign,
            commands::marketing::marketing_schedule_campaign,
            commands::marketing::marketing_create_funnel,
            commands::marketing::marketing_get_funnels,
            commands::marketing::marketing_get_funnel,
            commands::marketing::marketing_update_funnel,
            commands::marketing::marketing_delete_funnel,
            commands::marketing::marketing_add_funnel_stage,
            commands::marketing::marketing_create_lead,
            commands::marketing::marketing_get_leads,
            commands::marketing::marketing_update_lead_score,
            commands::marketing::marketing_move_lead_stage,
            commands::marketing::marketing_create_template,
            commands::marketing::marketing_get_templates,
            commands::marketing::marketing_delete_template,
            commands::marketing::marketing_get_analytics,
            commands::marketing::marketing_get_notifications,

            // === EMAIL SERVICE COMMANDS (SMTP + SendGrid) ===
            commands::email::email_get_config,
            commands::email::email_set_active_provider,
            commands::email::email_configure_smtp,
            commands::email::email_configure_sendgrid,
            commands::email::email_set_rate_limits,
            commands::email::email_set_retry_settings,
            commands::email::email_test_connection,
            commands::email::email_send_test,
            commands::email::email_send,
            commands::email::email_send_batch,
            commands::email::email_send_simple,
            commands::email::email_send_campaign,
            commands::email::email_get_status,
            commands::email::email_reset_rate_counters,

            // === CONTACT MANAGEMENT COMMANDS ===
            commands::contacts::contacts_get_all,
            commands::contacts::contacts_get,
            commands::contacts::contacts_get_by_email,
            commands::contacts::contacts_create,
            commands::contacts::contacts_update,
            commands::contacts::contacts_delete,
            commands::contacts::contacts_delete_bulk,
            commands::contacts::contacts_add_tags,
            commands::contacts::contacts_remove_tags,
            commands::contacts::contacts_add_to_lists,
            commands::contacts::contacts_remove_from_lists,
            commands::contacts::contacts_update_engagement,
            commands::contacts::contacts_get_lists,
            commands::contacts::contacts_get_list,
            commands::contacts::contacts_create_list,
            commands::contacts::contacts_update_list,
            commands::contacts::contacts_delete_list,
            commands::contacts::contacts_get_segments,
            commands::contacts::contacts_create_segment,
            commands::contacts::contacts_get_segment_contacts,
            commands::contacts::contacts_import_csv,
            commands::contacts::contacts_export_csv,
            commands::contacts::contacts_get_stats,
            commands::contacts::contacts_get_tags,

            // === SOCIAL MEDIA COMMANDS ===
            commands::social::social_connect_account,
            commands::social::social_get_accounts,
            commands::social::social_disconnect_account,
            commands::social::social_sync_account,
            commands::social::social_create_post,
            commands::social::social_get_posts,
            commands::social::social_get_post,
            commands::social::social_update_post,
            commands::social::social_delete_post,
            commands::social::social_schedule_post,
            commands::social::social_publish_post,
            commands::social::social_create_video_project,
            commands::social::social_get_video_projects,
            commands::social::social_get_video_project,
            commands::social::social_add_video_scene,
            commands::social::social_render_video,
            commands::social::social_delete_video_project,
            commands::social::social_get_analytics,
            commands::social::social_get_stats,
            commands::social::social_get_trending,
            commands::social::social_get_content_suggestions,
            commands::social::social_get_notifications,

            // === RESEARCH COMMANDS ===
            commands::research::research_create_project,
            commands::research::research_get_projects,
            commands::research::research_get_project,
            commands::research::research_update_project,
            commands::research::research_delete_project,
            commands::research::research_run_project,
            commands::research::research_add_source,
            commands::research::research_remove_source,
            commands::research::research_add_competitor,
            commands::research::research_get_competitors,
            commands::research::research_analyze_competitor,
            commands::research::research_remove_competitor,
            commands::research::research_generate_report,
            commands::research::research_get_reports,
            commands::research::research_get_trends,
            commands::research::research_search,
            commands::research::research_get_stats,
            commands::research::research_get_quick_stats,
            commands::research::research_get_notifications,

            // === SEARCH ENGINE COMMANDS ===
            commands::search::search_query,
            commands::search::search_suggestions,
            commands::search::search_get_history,
            commands::search::search_clear_history,
            commands::search::search_delete_history_item,
            commands::search::search_get_preferences,
            commands::search::search_update_preferences,
            commands::search::search_add_blocked_domain,
            commands::search::search_remove_blocked_domain,
            commands::search::search_get_trending,
            commands::search::search_get_stats,
            commands::search::search_images,
            commands::search::search_videos,
            commands::search::search_get_quick_stats,
            commands::search::search_get_notifications,

            // === INTEGRATION LAYER COMMANDS ===
            commands::integration_layer::integration_emit_event,
            commands::integration_layer::integration_get_events,
            commands::integration_layer::integration_get_rules,
            commands::integration_layer::integration_create_rule,
            commands::integration_layer::integration_update_rule,
            commands::integration_layer::integration_delete_rule,
            commands::integration_layer::integration_get_mappings,
            commands::integration_layer::integration_create_mapping,
            commands::integration_layer::integration_get_sync_status,
            commands::integration_layer::integration_sync_modules,
            commands::integration_layer::integration_get_unified_contacts,
            commands::integration_layer::integration_upsert_unified_contact,
            commands::integration_layer::integration_merge_contacts,
            commands::integration_layer::integration_crm_to_marketing,
            commands::integration_layer::integration_marketing_to_crm,
            commands::integration_layer::integration_social_to_crm,
            commands::integration_layer::integration_enrich_with_social,
            commands::integration_layer::integration_research_to_crm,
            commands::integration_layer::integration_research_to_marketing,
            commands::integration_layer::integration_unified_search,
            commands::integration_layer::integration_trigger_workflow,
            commands::integration_layer::integration_get_automations,
            commands::integration_layer::integration_get_dashboard_stats,

            // === ENTERPRISE COMMANDS (SSO, LDAP, Organization) ===
            commands::enterprise::organization_create,
            commands::enterprise::organization_get,
            commands::enterprise::organization_get_by_slug,
            commands::enterprise::organization_update,
            commands::enterprise::organization_delete,
            commands::enterprise::organization_get_children,
            commands::enterprise::organization_update_settings,
            commands::enterprise::organization_update_branding,
            commands::enterprise::organization_get_stats,
            commands::enterprise::organization_suspend,
            commands::enterprise::organization_reactivate,
            commands::enterprise::sso_configure,
            commands::enterprise::sso_get_config,
            commands::enterprise::sso_enable,
            commands::enterprise::sso_disable,
            commands::enterprise::sso_test,
            commands::enterprise::sso_get_saml_metadata,
            commands::enterprise::sso_initiate_login,
            commands::enterprise::sso_complete_login,
            commands::enterprise::sso_sync_users,
            commands::enterprise::ldap_configure,
            commands::enterprise::ldap_get_config,
            commands::enterprise::ldap_test_connection,
            commands::enterprise::ldap_sync_users,
            commands::enterprise::ldap_get_sync_history,
            commands::enterprise::ldap_search_users,
            commands::enterprise::ldap_search_groups,
            commands::enterprise::ldap_enable,
            commands::enterprise::ldap_disable,

            // === ENTERPRISE COMMANDS PART 2 (Tenant, Role, License, Audit, WhiteLabel) ===
            commands::enterprise_part2::tenant_create,
            commands::enterprise_part2::tenant_get,
            commands::enterprise_part2::tenant_get_by_slug,
            commands::enterprise_part2::tenant_list,
            commands::enterprise_part2::tenant_update,
            commands::enterprise_part2::tenant_delete,
            commands::enterprise_part2::tenant_suspend,
            commands::enterprise_part2::tenant_reactivate,
            commands::enterprise_part2::tenant_update_settings,
            commands::enterprise_part2::tenant_update_limits,
            commands::enterprise_part2::tenant_get_usage,
            commands::enterprise_part2::role_create,
            commands::enterprise_part2::role_get,
            commands::enterprise_part2::role_list,
            commands::enterprise_part2::role_update,
            commands::enterprise_part2::role_delete,
            commands::enterprise_part2::role_assign,
            commands::enterprise_part2::role_unassign,
            commands::enterprise_part2::role_get_user_roles,
            commands::enterprise_part2::role_get_effective_permissions,
            commands::enterprise_part2::role_check_permission,
            commands::enterprise_part2::license_create,
            commands::enterprise_part2::license_get,
            commands::enterprise_part2::license_get_by_key,
            commands::enterprise_part2::license_get_for_organization,
            commands::enterprise_part2::license_activate,
            commands::enterprise_part2::license_deactivate,
            commands::enterprise_part2::license_validate,
            commands::enterprise_part2::license_check_feature,
            commands::enterprise_part2::license_increment_usage,
            commands::enterprise_part2::license_get_usage_report,
            commands::enterprise_part2::audit_log,
            commands::enterprise_part2::audit_query,
            commands::enterprise_part2::audit_get_by_resource,
            commands::enterprise_part2::audit_get_by_user,
            commands::enterprise_part2::audit_export,
            commands::enterprise_part2::audit_get_summary,
            commands::enterprise_part2::whitelabel_get_config,
            commands::enterprise_part2::whitelabel_update_config,
            commands::enterprise_part2::whitelabel_enable,
            commands::enterprise_part2::whitelabel_disable,
            commands::enterprise_part2::whitelabel_update_branding,
            commands::enterprise_part2::whitelabel_update_customization,
            commands::enterprise_part2::whitelabel_add_domain,
            commands::enterprise_part2::whitelabel_remove_domain,
            commands::enterprise_part2::whitelabel_verify_domain,
            commands::enterprise_part2::whitelabel_set_primary_domain,
            commands::enterprise_part2::whitelabel_update_email_settings,
            commands::enterprise_part2::whitelabel_test_email,
            commands::enterprise_part2::whitelabel_update_legal,
            commands::enterprise_part2::whitelabel_preview,

            // === ANALYTICS COMMANDS (Dashboards, Reports, Metrics, Alerts) ===
            commands::analytics::dashboard_create,
            commands::analytics::dashboard_get,
            commands::analytics::dashboard_list,
            commands::analytics::dashboard_update,
            commands::analytics::dashboard_delete,
            commands::analytics::dashboard_clone,
            commands::analytics::dashboard_set_default,
            commands::analytics::dashboard_add_widget,
            commands::analytics::dashboard_update_widget,
            commands::analytics::dashboard_remove_widget,
            commands::analytics::dashboard_reorder_widgets,
            commands::analytics::dashboard_get_widget_data,
            commands::analytics::report_create,
            commands::analytics::report_get,
            commands::analytics::report_list,
            commands::analytics::report_update,
            commands::analytics::report_delete,
            commands::analytics::report_run,
            commands::analytics::report_get_run,
            commands::analytics::report_list_runs,
            commands::analytics::report_download,
            commands::analytics::report_schedule,
            commands::analytics::report_unschedule,
            commands::analytics::metric_create,
            commands::analytics::metric_get,
            commands::analytics::metric_list,
            commands::analytics::metric_update,
            commands::analytics::metric_delete,
            commands::analytics::metric_record,
            commands::analytics::metric_record_batch,
            commands::analytics::metric_query,
            commands::analytics::metric_get_latest,
            commands::analytics::alert_create,
            commands::analytics::alert_get,
            commands::analytics::alert_list,
            commands::analytics::alert_update,
            commands::analytics::alert_delete,
            commands::analytics::alert_enable,
            commands::analytics::alert_disable,
            commands::analytics::alert_test,
            commands::analytics::alert_get_events,
            commands::analytics::alert_acknowledge,
            commands::analytics::alert_get_active,
            commands::analytics::export_create,
            commands::analytics::export_get,
            commands::analytics::export_list,
            commands::analytics::export_cancel,
            commands::analytics::export_download,
            commands::analytics::export_delete,
            commands::analytics::analytics_track_event,
            commands::analytics::analytics_get_usage,
            commands::analytics::analytics_get_funnel,
            commands::analytics::analytics_get_retention,

            // === NOTIFICATION COMMANDS (Multi-channel, Templates, Queue) ===
            commands::notifications::notification_send,
            commands::notifications::notification_send_bulk,
            commands::notifications::notification_send_from_template,
            commands::notifications::notification_get,
            commands::notifications::notification_list,
            commands::notifications::notification_mark_read,
            commands::notifications::notification_mark_all_read,
            commands::notifications::notification_delete,
            commands::notifications::notification_delete_all_read,
            commands::notifications::notification_get_unread_count,
            commands::notifications::notification_template_create,
            commands::notifications::notification_template_get,
            commands::notifications::notification_template_list,
            commands::notifications::notification_template_update,
            commands::notifications::notification_template_delete,
            commands::notifications::notification_template_preview,
            commands::notifications::notification_template_test,
            commands::notifications::notification_preferences_get,
            commands::notifications::notification_preferences_update,
            commands::notifications::notification_preferences_update_category,
            commands::notifications::notification_preferences_set_quiet_hours,
            commands::notifications::notification_preferences_clear_quiet_hours,
            commands::notifications::notification_preferences_set_digest,
            commands::notifications::notification_queue_get_stats,
            commands::notifications::notification_queue_list,
            commands::notifications::notification_queue_retry,
            commands::notifications::notification_queue_retry_all_failed,
            commands::notifications::notification_queue_cancel,
            commands::notifications::notification_queue_purge,
            commands::notifications::push_subscribe,
            commands::notifications::push_unsubscribe,
            commands::notifications::push_unsubscribe_device,
            commands::notifications::push_get_subscriptions,
            commands::notifications::push_send,
            commands::notifications::push_send_to_device,
            commands::notifications::push_send_broadcast,
            commands::notifications::notification_email_send,
            commands::notifications::notification_email_send_bulk,
            commands::notifications::notification_email_send_from_template,
            commands::notifications::email_verify_address,
            commands::notifications::email_get_delivery_status,
            commands::notifications::sms_send,
            commands::notifications::sms_send_bulk,
            commands::notifications::sms_get_delivery_status,

            // === CUBE MAIL COMMANDS (Full Email Client) ===
            commands::cube_mail_commands::cube_mail_add_account,
            commands::cube_mail_commands::cube_mail_add_account_oauth,
            commands::cube_mail_commands::cube_mail_get_accounts,
            commands::cube_mail_commands::cube_mail_get_account,
            commands::cube_mail_commands::cube_mail_remove_account,
            commands::cube_mail_commands::cube_mail_test_connection,
            commands::cube_mail_commands::cube_mail_fetch_emails,
            commands::cube_mail_commands::cube_mail_get_email,
            commands::cube_mail_commands::cube_mail_mark_as_read,
            commands::cube_mail_commands::cube_mail_set_starred,
            commands::cube_mail_commands::cube_mail_move_to_folder,
            commands::cube_mail_commands::cube_mail_archive_emails,
            commands::cube_mail_commands::cube_mail_delete_emails,
            commands::cube_mail_commands::cube_mail_send_email,
            commands::cube_mail_commands::cube_mail_get_screener_config,
            commands::cube_mail_commands::cube_mail_update_screener_config,
            commands::cube_mail_commands::cube_mail_get_screener_pending,
            commands::cube_mail_commands::cube_mail_screener_decision,
            commands::cube_mail_commands::cube_mail_get_labels,
            commands::cube_mail_commands::cube_mail_create_label,
            commands::cube_mail_commands::cube_mail_apply_labels,
            commands::cube_mail_commands::cube_mail_sync_account,
            commands::cube_mail_commands::cube_mail_get_sync_status,
            commands::cube_mail_commands::cube_mail_search_emails,
            commands::cube_mail_commands::cube_mail_ai_suggest_reply,
            commands::cube_mail_commands::cube_mail_ai_summarize,
            // OAuth2 Commands
            commands::cube_mail_commands::cube_mail_oauth2_register,
            commands::cube_mail_commands::cube_mail_oauth2_get_auth_url,
            commands::cube_mail_commands::cube_mail_oauth2_exchange_code,
            commands::cube_mail_commands::cube_mail_oauth2_refresh,
            commands::cube_mail_commands::cube_mail_add_account_with_oauth,
            // Database Search Commands
            commands::cube_mail_commands::cube_mail_search_fts,
            commands::cube_mail_commands::cube_mail_search_advanced,
            commands::cube_mail_commands::cube_mail_get_statistics,
            commands::cube_mail_commands::cube_mail_batch_mark_read,
            commands::cube_mail_commands::cube_mail_batch_move,
            commands::cube_mail_commands::cube_mail_batch_delete,
            commands::cube_mail_commands::cube_mail_batch_add_labels,
            commands::cube_mail_commands::cube_mail_batch_remove_labels,

            // === GAMIFICATION SYSTEM (Viral Growth Engine) ===
            commands::gamification_commands::gamification_get_stats,
            commands::gamification_commands::gamification_get_level,
            commands::gamification_commands::gamification_add_xp,
            commands::gamification_commands::gamification_get_achievements,
            commands::gamification_commands::gamification_unlock_achievement,
            commands::gamification_commands::gamification_update_achievement_progress,
            commands::gamification_commands::gamification_get_streak,
            commands::gamification_commands::gamification_check_in,
            commands::gamification_commands::gamification_get_challenges,
            commands::gamification_commands::gamification_update_challenge_progress,
            commands::gamification_commands::gamification_get_leaderboard,
            commands::gamification_commands::gamification_get_rewards,
            commands::gamification_commands::gamification_claim_reward,
            commands::gamification_commands::gamification_get_badges,
            commands::gamification_commands::gamification_is_following,
            commands::gamification_commands::gamification_get_followers,
            commands::gamification_commands::gamification_get_following,
            commands::gamification_commands::gamification_get_activity,
            commands::gamification_commands::gamification_follow_user,
            commands::gamification_commands::gamification_unfollow_user,

            // === REFERRAL SYSTEM (Viral Growth Engine) ===
            commands::referral_commands::referral_generate_code,
            commands::referral_commands::referral_get_code,
            commands::referral_commands::referral_validate_code,
            commands::referral_commands::referral_apply_code,
            commands::referral_commands::referral_complete,
            commands::referral_commands::referral_claim_reward,
            commands::referral_commands::referral_get_stats,
            commands::referral_commands::referral_get_referrals,
            commands::referral_commands::referral_get_campaigns,
            commands::referral_commands::referral_get_leaderboard,
            commands::referral_commands::referral_get_share_content,

            // ================================================================
            // CUBE BROWSER ELITE - ADVANCED FEATURES
            // Superior to Chrome, Firefox, Safari, Brave, Opera, Vivaldi
            // ================================================================

            // === CUBE PIP ELITE - Multi Picture-in-Picture (SUPERIOR TO ALL) ===
            commands::browser_pip_commands::pip_get_settings,
            commands::browser_pip_commands::pip_update_settings,
            commands::browser_pip_commands::pip_set_enabled,
            commands::browser_pip_commands::pip_set_max_windows,
            commands::browser_pip_commands::pip_set_default_position,
            commands::browser_pip_commands::pip_set_default_size,
            commands::browser_pip_commands::pip_set_auto_pip,
            commands::browser_pip_commands::pip_set_snap_zones_enabled,
            commands::browser_pip_commands::pip_create_window,
            commands::browser_pip_commands::pip_close_window,
            commands::browser_pip_commands::pip_close_all_windows,
            commands::browser_pip_commands::pip_close_windows_for_tab,
            commands::browser_pip_commands::pip_get_window,
            commands::browser_pip_commands::pip_get_all_windows,
            commands::browser_pip_commands::pip_get_windows_for_tab,
            commands::browser_pip_commands::pip_update_position,
            commands::browser_pip_commands::pip_update_size,
            commands::browser_pip_commands::pip_set_opacity,
            commands::browser_pip_commands::pip_set_always_on_top,
            commands::browser_pip_commands::pip_minimize_window,
            commands::browser_pip_commands::pip_restore_window,
            commands::browser_pip_commands::pip_toggle_fullscreen,
            commands::browser_pip_commands::pip_play,
            commands::browser_pip_commands::pip_pause,
            commands::browser_pip_commands::pip_toggle_playback,
            commands::browser_pip_commands::pip_mute,
            commands::browser_pip_commands::pip_unmute,
            commands::browser_pip_commands::pip_toggle_mute,
            commands::browser_pip_commands::pip_set_volume,
            commands::browser_pip_commands::pip_set_playback_rate,
            commands::browser_pip_commands::pip_seek,
            commands::browser_pip_commands::pip_seek_relative,
            commands::browser_pip_commands::pip_toggle_loop,
            commands::browser_pip_commands::pip_update_playback_state,
            commands::browser_pip_commands::pip_mute_all,
            commands::browser_pip_commands::pip_mute_all_except,
            commands::browser_pip_commands::pip_pause_all,
            commands::browser_pip_commands::pip_play_all,
            commands::browser_pip_commands::pip_sync_playback_to,
            commands::browser_pip_commands::pip_get_snap_zones,
            commands::browser_pip_commands::pip_update_snap_zones,
            commands::browser_pip_commands::pip_set_snap_zone_active,
            commands::browser_pip_commands::pip_get_stats,
            commands::browser_pip_commands::pip_reset_stats,
            commands::browser_pip_commands::pip_add_watch_time,
            commands::browser_pip_commands::pip_clear_position_memory,
            commands::browser_pip_commands::pip_get_remembered_position,

            // === CUBE SPLIT VIEW - Multi-Panel Browsing (SUPERIOR TO VIVALDI/ARC) ===
            commands::browser_split_view_commands::split_view_get_settings,
            commands::browser_split_view_commands::split_view_update_settings,
            commands::browser_split_view_commands::split_view_set_enabled,
            commands::browser_split_view_commands::split_view_set_default_layout,
            commands::browser_split_view_commands::split_view_set_default_sync_mode,
            commands::browser_split_view_commands::split_view_set_show_panel_headers,
            commands::browser_split_view_commands::split_view_create_session,
            commands::browser_split_view_commands::split_view_close_session,
            commands::browser_split_view_commands::split_view_close_all_sessions,
            commands::browser_split_view_commands::split_view_get_session,
            commands::browser_split_view_commands::split_view_get_all_sessions,
            commands::browser_split_view_commands::split_view_get_active_session,
            commands::browser_split_view_commands::split_view_set_active_session,
            commands::browser_split_view_commands::split_view_set_layout,
            commands::browser_split_view_commands::split_view_set_divider_position,
            commands::browser_split_view_commands::split_view_toggle_divider_lock,
            commands::browser_split_view_commands::split_view_get_layout_presets,
            commands::browser_split_view_commands::split_view_add_panel,
            commands::browser_split_view_commands::split_view_remove_panel,
            commands::browser_split_view_commands::split_view_set_active_panel,
            commands::browser_split_view_commands::split_view_update_panel,
            commands::browser_split_view_commands::split_view_swap_panels,
            commands::browser_split_view_commands::split_view_set_sync_mode,
            commands::browser_split_view_commands::split_view_sync_scroll,
            commands::browser_split_view_commands::split_view_sync_navigation,
            commands::browser_split_view_commands::split_view_save_layout,
            commands::browser_split_view_commands::split_view_load_saved_layout,
            commands::browser_split_view_commands::split_view_get_saved_layouts,
            commands::browser_split_view_commands::split_view_delete_saved_layout,
            commands::browser_split_view_commands::split_view_get_stats,
            commands::browser_split_view_commands::split_view_reset_stats,

            // === CUBE SIDEBAR - Messaging & Productivity Panels (SUPERIOR TO OPERA/VIVALDI) ===
            commands::browser_sidebar_commands::sidebar_get_settings,
            commands::browser_sidebar_commands::sidebar_update_settings,
            commands::browser_sidebar_commands::sidebar_set_position,
            commands::browser_sidebar_commands::sidebar_set_width,
            commands::browser_sidebar_commands::sidebar_set_auto_hide,
            commands::browser_sidebar_commands::sidebar_toggle_compact_mode,
            commands::browser_sidebar_commands::sidebar_get_state,
            commands::browser_sidebar_commands::sidebar_toggle,
            commands::browser_sidebar_commands::sidebar_expand,
            commands::browser_sidebar_commands::sidebar_collapse,
            commands::browser_sidebar_commands::sidebar_set_visible,
            commands::browser_sidebar_commands::sidebar_get_all_panels,
            commands::browser_sidebar_commands::sidebar_get_panel,
            commands::browser_sidebar_commands::sidebar_get_active_panel,
            commands::browser_sidebar_commands::sidebar_set_active_panel,
            commands::browser_sidebar_commands::sidebar_add_panel,
            commands::browser_sidebar_commands::sidebar_add_custom_panel,
            commands::browser_sidebar_commands::sidebar_remove_panel,
            commands::browser_sidebar_commands::sidebar_update_panel,
            commands::browser_sidebar_commands::sidebar_toggle_panel_pin,
            commands::browser_sidebar_commands::sidebar_set_panel_status,
            commands::browser_sidebar_commands::sidebar_update_badge_count,
            commands::browser_sidebar_commands::sidebar_reorder_panels,
            commands::browser_sidebar_commands::sidebar_get_messaging_panels,
            commands::browser_sidebar_commands::sidebar_get_music_panels,
            commands::browser_sidebar_commands::sidebar_get_productivity_panels,
            commands::browser_sidebar_commands::sidebar_get_web_panels,
            commands::browser_sidebar_commands::sidebar_get_total_badge_count,
            commands::browser_sidebar_commands::sidebar_get_all_notes,
            commands::browser_sidebar_commands::sidebar_get_note,
            commands::browser_sidebar_commands::sidebar_create_note,
            commands::browser_sidebar_commands::sidebar_update_note,
            commands::browser_sidebar_commands::sidebar_delete_note,
            commands::browser_sidebar_commands::sidebar_toggle_note_pin,
            commands::browser_sidebar_commands::sidebar_set_note_color,
            commands::browser_sidebar_commands::sidebar_link_note_to_url,
            commands::browser_sidebar_commands::sidebar_get_all_tasks,
            commands::browser_sidebar_commands::sidebar_get_task,
            commands::browser_sidebar_commands::sidebar_create_task,
            commands::browser_sidebar_commands::sidebar_update_task,
            commands::browser_sidebar_commands::sidebar_toggle_task_complete,
            commands::browser_sidebar_commands::sidebar_delete_task,
            commands::browser_sidebar_commands::sidebar_clear_completed_tasks,
            commands::browser_sidebar_commands::sidebar_get_stats,
            commands::browser_sidebar_commands::sidebar_reset_stats,

            // === CUBE AI ASSISTANT - Smart Browser AI (SUPERIOR TO EDGE COPILOT) ===
            commands::browser_ai_assistant_commands::ai_get_settings,
            commands::browser_ai_assistant_commands::ai_update_settings,
            commands::browser_ai_assistant_commands::ai_set_api_key,
            commands::browser_ai_assistant_commands::ai_set_default_model,
            commands::browser_ai_assistant_commands::ai_set_default_language,
            commands::browser_ai_assistant_commands::ai_summarize_page,
            commands::browser_ai_assistant_commands::ai_summarize_brief,
            commands::browser_ai_assistant_commands::ai_summarize_detailed,
            commands::browser_ai_assistant_commands::ai_get_key_points,
            commands::browser_ai_assistant_commands::ai_translate_text,
            commands::browser_ai_assistant_commands::ai_translate_page,
            commands::browser_ai_assistant_commands::ai_translate_to_english,
            commands::browser_ai_assistant_commands::ai_translate_to_spanish,
            commands::browser_ai_assistant_commands::ai_translate_to_french,
            commands::browser_ai_assistant_commands::ai_translate_to_german,
            commands::browser_ai_assistant_commands::ai_translate_to_chinese,
            commands::browser_ai_assistant_commands::ai_translate_to_japanese,
            commands::browser_ai_assistant_commands::ai_analyze_form,
            commands::browser_ai_assistant_commands::ai_suggest_form_values,
            commands::browser_ai_assistant_commands::ai_enhance_search,
            commands::browser_ai_assistant_commands::ai_answer_question,
            commands::browser_ai_assistant_commands::ai_analyze_content,
            commands::browser_ai_assistant_commands::ai_rewrite_text,
            commands::browser_ai_assistant_commands::ai_make_formal,
            commands::browser_ai_assistant_commands::ai_make_casual,
            commands::browser_ai_assistant_commands::ai_make_concise,
            commands::browser_ai_assistant_commands::ai_explain_code,
            commands::browser_ai_assistant_commands::ai_get_history,
            commands::browser_ai_assistant_commands::ai_clear_history,
            commands::browser_ai_assistant_commands::ai_get_stats,
            commands::browser_ai_assistant_commands::ai_reset_stats,
            commands::browser_ai_assistant_commands::ai_clear_cache,
            commands::browser_ai_assistant_commands::ai_get_cache_size,
            commands::browser_ai_assistant_commands::ai_quick_summarize,
            commands::browser_ai_assistant_commands::ai_quick_translate,
            commands::browser_ai_assistant_commands::ai_quick_answer,
            commands::browser_ai_assistant_commands::ai_get_available_languages,
            commands::browser_ai_assistant_commands::ai_get_available_models,
            commands::browser_ai_assistant_commands::ai_get_summary_levels,

            // === CUBE READER MODE - Clean Reading View (SUPERIOR TO SAFARI/FIREFOX) ===
            commands::browser_reader_commands::reader_get_settings,
            commands::browser_reader_commands::reader_update_settings,
            commands::browser_reader_commands::reader_set_theme,
            commands::browser_reader_commands::reader_set_font,
            commands::browser_reader_commands::reader_set_font_size,
            commands::browser_reader_commands::reader_increase_font_size,
            commands::browser_reader_commands::reader_decrease_font_size,
            commands::browser_reader_commands::reader_set_line_height,
            commands::browser_reader_commands::reader_set_content_width,
            commands::browser_reader_commands::reader_set_text_alignment,
            commands::browser_reader_commands::reader_toggle_images,
            commands::browser_reader_commands::reader_toggle_links,
            commands::browser_reader_commands::reader_get_tts_settings,
            commands::browser_reader_commands::reader_update_tts_settings,
            commands::browser_reader_commands::reader_set_tts_speed,
            commands::browser_reader_commands::reader_set_tts_voice,
            commands::browser_reader_commands::reader_set_tts_volume,
            commands::browser_reader_commands::reader_get_themes,
            commands::browser_reader_commands::reader_get_theme,
            commands::browser_reader_commands::reader_add_theme,
            commands::browser_reader_commands::reader_remove_theme,
            commands::browser_reader_commands::reader_parse_article,
            commands::browser_reader_commands::reader_get_article,
            commands::browser_reader_commands::reader_get_recent_articles,
            commands::browser_reader_commands::reader_get_session,
            commands::browser_reader_commands::reader_update_progress,
            commands::browser_reader_commands::reader_get_history,
            commands::browser_reader_commands::reader_get_in_progress,
            commands::browser_reader_commands::reader_create_annotation,
            commands::browser_reader_commands::reader_update_annotation,
            commands::browser_reader_commands::reader_delete_annotation,
            commands::browser_reader_commands::reader_get_annotations,
            commands::browser_reader_commands::reader_get_all_annotations,
            commands::browser_reader_commands::reader_export_annotations,
            commands::browser_reader_commands::reader_start_tts,
            commands::browser_reader_commands::reader_pause_tts,
            commands::browser_reader_commands::reader_resume_tts,
            commands::browser_reader_commands::reader_stop_tts,
            commands::browser_reader_commands::reader_get_tts_state,
            commands::browser_reader_commands::reader_skip_to_paragraph,
            commands::browser_reader_commands::reader_get_stats,
            commands::browser_reader_commands::reader_reset_stats,
            commands::browser_reader_commands::reader_generate_css,
            commands::browser_reader_commands::reader_estimate_reading_time,
            commands::browser_reader_commands::reader_format_reading_time,
            commands::browser_reader_commands::reader_get_available_themes,
            commands::browser_reader_commands::reader_get_available_fonts,
            commands::browser_reader_commands::reader_get_highlight_colors,
            commands::browser_reader_commands::reader_get_tts_speeds,

            // === CUBE WORKSPACES - Project-Based Tab Organization (SUPERIOR TO ARC/CHROME) ===
            commands::browser_workspaces_commands::workspaces_get_settings,
            commands::browser_workspaces_commands::workspaces_update_settings,
            commands::browser_workspaces_commands::workspaces_set_enabled,
            commands::browser_workspaces_commands::workspaces_set_bar_position,
            commands::browser_workspaces_commands::workspaces_set_default_layout,
            commands::browser_workspaces_commands::workspaces_set_switch_animation,
            commands::browser_workspaces_commands::workspaces_set_auto_sleep,
            commands::browser_workspaces_commands::workspaces_set_isolation,
            commands::browser_workspaces_commands::workspaces_create,
            commands::browser_workspaces_commands::workspaces_create_from_template,
            commands::browser_workspaces_commands::workspaces_get,
            commands::browser_workspaces_commands::workspaces_get_all,
            commands::browser_workspaces_commands::workspaces_get_active,
            commands::browser_workspaces_commands::workspaces_get_active_id,
            commands::browser_workspaces_commands::workspaces_switch,
            commands::browser_workspaces_commands::workspaces_update,
            commands::browser_workspaces_commands::workspaces_delete,
            commands::browser_workspaces_commands::workspaces_archive,
            commands::browser_workspaces_commands::workspaces_unarchive,
            commands::browser_workspaces_commands::workspaces_pin,
            commands::browser_workspaces_commands::workspaces_lock,
            commands::browser_workspaces_commands::workspaces_set_layout,
            commands::browser_workspaces_commands::workspaces_set_shortcut,
            commands::browser_workspaces_commands::workspaces_reorder,
            commands::browser_workspaces_commands::workspaces_add_tab,
            commands::browser_workspaces_commands::workspaces_remove_tab,
            commands::browser_workspaces_commands::workspaces_update_tab,
            commands::browser_workspaces_commands::workspaces_move_tab,
            commands::browser_workspaces_commands::workspaces_set_active_tab,
            commands::browser_workspaces_commands::workspaces_pin_tab,
            commands::browser_workspaces_commands::workspaces_mute_tab,
            commands::browser_workspaces_commands::workspaces_add_allowed_domain,
            commands::browser_workspaces_commands::workspaces_remove_allowed_domain,
            commands::browser_workspaces_commands::workspaces_add_blocked_domain,
            commands::browser_workspaces_commands::workspaces_remove_blocked_domain,
            commands::browser_workspaces_commands::workspaces_is_domain_allowed,
            commands::browser_workspaces_commands::workspaces_create_snapshot,
            commands::browser_workspaces_commands::workspaces_get_snapshots,
            commands::browser_workspaces_commands::workspaces_restore_snapshot,
            commands::browser_workspaces_commands::workspaces_delete_snapshot,
            commands::browser_workspaces_commands::workspaces_get_templates,
            commands::browser_workspaces_commands::workspaces_create_template,
            commands::browser_workspaces_commands::workspaces_delete_template,
            commands::browser_workspaces_commands::workspaces_get_quick_switch_items,
            commands::browser_workspaces_commands::workspaces_quick_switch_next,
            commands::browser_workspaces_commands::workspaces_quick_switch_previous,
            commands::browser_workspaces_commands::workspaces_get_stats,
            commands::browser_workspaces_commands::workspaces_reset_daily_stats,
            commands::browser_workspaces_commands::workspaces_add_time,
            commands::browser_workspaces_commands::workspaces_export,
            commands::browser_workspaces_commands::workspaces_import,
            commands::browser_workspaces_commands::workspaces_get_icons,
            commands::browser_workspaces_commands::workspaces_get_colors,
            commands::browser_workspaces_commands::workspaces_get_layouts,
            commands::browser_workspaces_commands::workspaces_get_animations,

            // === CUBE SCREENSHOT ELITE - Advanced Capture & Annotations (SUPERIOR TO ALL) ===
            commands::browser_screenshot_commands::browser_screenshot_get_settings,
            commands::browser_screenshot_commands::browser_screenshot_update_settings,
            commands::browser_screenshot_commands::browser_screenshot_set_default_format,
            commands::browser_screenshot_commands::browser_screenshot_set_save_directory,
            commands::browser_screenshot_commands::browser_screenshot_set_quality,
            commands::browser_screenshot_commands::browser_screenshot_set_keyboard_shortcuts,
            commands::browser_screenshot_commands::browser_screenshot_get_keyboard_shortcuts,
            commands::browser_screenshot_commands::browser_screenshot_get_recording_settings,
            commands::browser_screenshot_commands::browser_screenshot_update_recording_settings,
            commands::browser_screenshot_commands::browser_screenshot_capture_visible,
            commands::browser_screenshot_commands::browser_screenshot_capture_full_page,
            commands::browser_screenshot_commands::browser_screenshot_capture_region,
            commands::browser_screenshot_commands::browser_screenshot_capture_element,
            commands::browser_screenshot_commands::browser_screenshot_start_capture,
            commands::browser_screenshot_commands::browser_screenshot_cancel_capture,
            commands::browser_screenshot_commands::browser_screenshot_is_capturing,
            commands::browser_screenshot_commands::browser_screenshot_get,
            commands::browser_screenshot_commands::browser_screenshot_get_all,
            commands::browser_screenshot_commands::browser_screenshot_get_recent,
            commands::browser_screenshot_commands::browser_screenshot_delete,
            commands::browser_screenshot_commands::browser_screenshot_delete_all,
            commands::browser_screenshot_commands::browser_screenshot_toggle_favorite,
            commands::browser_screenshot_commands::browser_screenshot_add_tag,
            commands::browser_screenshot_commands::browser_screenshot_remove_tag,
            commands::browser_screenshot_commands::browser_screenshot_search,
            commands::browser_screenshot_commands::browser_screenshot_get_favorites,
            commands::browser_screenshot_commands::browser_screenshot_open_editor,
            commands::browser_screenshot_commands::browser_screenshot_close_editor,
            commands::browser_screenshot_commands::browser_screenshot_get_editor_state,
            commands::browser_screenshot_commands::browser_screenshot_set_editor_tool,
            commands::browser_screenshot_commands::browser_screenshot_set_editor_color,
            commands::browser_screenshot_commands::browser_screenshot_set_editor_stroke_width,
            commands::browser_screenshot_commands::browser_screenshot_set_editor_font_size,
            commands::browser_screenshot_commands::browser_screenshot_set_editor_zoom,
            commands::browser_screenshot_commands::browser_screenshot_set_editor_pan,
            commands::browser_screenshot_commands::browser_screenshot_add_annotation,
            commands::browser_screenshot_commands::browser_screenshot_update_annotation,
            commands::browser_screenshot_commands::browser_screenshot_delete_annotation,
            commands::browser_screenshot_commands::browser_screenshot_clear_annotations,
            commands::browser_screenshot_commands::browser_screenshot_get_annotations,
            commands::browser_screenshot_commands::browser_screenshot_undo,
            commands::browser_screenshot_commands::browser_screenshot_redo,
            commands::browser_screenshot_commands::browser_screenshot_add_to_history,
            commands::browser_screenshot_commands::browser_screenshot_save_to_file,
            commands::browser_screenshot_commands::browser_screenshot_copy_to_clipboard,
            commands::browser_screenshot_commands::browser_screenshot_export_as_format,
            commands::browser_screenshot_commands::browser_screenshot_upload,
            commands::browser_screenshot_commands::browser_screenshot_print,
            commands::browser_screenshot_commands::browser_screenshot_start_recording,
            commands::browser_screenshot_commands::browser_screenshot_stop_recording,
            commands::browser_screenshot_commands::browser_screenshot_pause_recording,
            commands::browser_screenshot_commands::browser_screenshot_resume_recording,
            commands::browser_screenshot_commands::browser_screenshot_is_recording,
            commands::browser_screenshot_commands::browser_screenshot_get_recording,
            commands::browser_screenshot_commands::browser_screenshot_get_all_recordings,
            commands::browser_screenshot_commands::browser_screenshot_delete_recording,
            commands::browser_screenshot_commands::browser_screenshot_get_stats,
            commands::browser_screenshot_commands::browser_screenshot_get_capture_modes,
            commands::browser_screenshot_commands::browser_screenshot_get_image_formats,
            commands::browser_screenshot_commands::browser_screenshot_get_annotation_types,
            commands::browser_screenshot_commands::browser_screenshot_get_preset_colors,

            // === CUBE DOWNLOADS MANAGER ELITE (SUPERIOR TO ALL BROWSER DOWNLOAD MANAGERS) ===
            commands::browser_downloads_commands::download_get_settings,
            commands::browser_downloads_commands::download_update_settings,
            commands::browser_downloads_commands::download_set_default_directory,
            commands::browser_downloads_commands::download_set_max_concurrent,
            commands::browser_downloads_commands::download_set_bandwidth_limit,
            commands::browser_downloads_commands::download_set_category_folder,
            commands::browser_downloads_commands::download_add_blocked_extension,
            commands::browser_downloads_commands::download_remove_blocked_extension,
            commands::browser_downloads_commands::download_create,
            commands::browser_downloads_commands::download_start,
            commands::browser_downloads_commands::download_pause,
            commands::browser_downloads_commands::download_resume,
            commands::browser_downloads_commands::download_cancel,
            commands::browser_downloads_commands::download_retry,
            commands::browser_downloads_commands::download_delete,
            commands::browser_downloads_commands::download_update_progress,
            commands::browser_downloads_commands::download_set_failed,
            commands::browser_downloads_commands::download_get,
            commands::browser_downloads_commands::download_get_all,
            commands::browser_downloads_commands::download_get_active,
            commands::browser_downloads_commands::download_get_by_status,
            commands::browser_downloads_commands::download_get_by_category,
            commands::browser_downloads_commands::download_filter,
            commands::browser_downloads_commands::download_search,
            commands::browser_downloads_commands::download_set_priority,
            commands::browser_downloads_commands::download_schedule,
            commands::browser_downloads_commands::download_add_tag,
            commands::browser_downloads_commands::download_remove_tag,
            commands::browser_downloads_commands::download_create_queue,
            commands::browser_downloads_commands::download_add_to_queue,
            commands::browser_downloads_commands::download_remove_from_queue,
            commands::browser_downloads_commands::download_get_queue,
            commands::browser_downloads_commands::download_get_all_queues,
            commands::browser_downloads_commands::download_delete_queue,
            commands::browser_downloads_commands::download_pause_queue,
            commands::browser_downloads_commands::download_resume_queue,
            commands::browser_downloads_commands::download_set_bandwidth_schedule,
            commands::browser_downloads_commands::download_get_bandwidth_schedule,
            commands::browser_downloads_commands::download_get_current_bandwidth_limit,
            commands::browser_downloads_commands::download_get_stats,
            commands::browser_downloads_commands::download_get_total_speed,
            commands::browser_downloads_commands::download_get_category_stats,
            commands::browser_downloads_commands::download_pause_all,
            commands::browser_downloads_commands::download_resume_all,
            commands::browser_downloads_commands::download_cancel_all,
            commands::browser_downloads_commands::download_clear_completed,
            commands::browser_downloads_commands::download_clear_failed,
            commands::browser_downloads_commands::download_open_file,
            commands::browser_downloads_commands::download_open_folder,
            commands::browser_downloads_commands::download_rename_file,
            commands::browser_downloads_commands::download_move_to_category,
            commands::browser_downloads_commands::download_scan,
            commands::browser_downloads_commands::download_export_list,
            commands::browser_downloads_commands::download_import_list,

            // === CUBE HISTORY ELITE - Advanced Browsing History (SUPERIOR TO ALL BROWSERS) ===
            commands::browser_history_commands::history_get_settings,
            commands::browser_history_commands::history_update_settings,
            commands::browser_history_commands::history_add_excluded_domain,
            commands::browser_history_commands::history_remove_excluded_domain,
            commands::browser_history_commands::history_set_retention_days,
            commands::browser_history_commands::history_add_entry,
            commands::browser_history_commands::history_update_entry,
            commands::browser_history_commands::history_update_duration,
            commands::browser_history_commands::history_update_scroll_position,
            commands::browser_history_commands::history_delete_entry,
            commands::browser_history_commands::history_delete_entries,
            commands::browser_history_commands::history_get_entry,
            commands::browser_history_commands::history_get_entry_by_url,
            commands::browser_history_commands::history_get_all_entries,
            commands::browser_history_commands::history_get_recent_entries,
            commands::browser_history_commands::history_get_entries_by_domain,
            commands::browser_history_commands::history_get_entries_by_page_type,
            commands::browser_history_commands::history_get_starred_entries,
            commands::browser_history_commands::history_filter_entries,
            commands::browser_history_commands::history_search,
            commands::browser_history_commands::history_suggest,
            commands::browser_history_commands::history_add_tag,
            commands::browser_history_commands::history_remove_tag,
            commands::browser_history_commands::history_toggle_starred,
            commands::browser_history_commands::history_get_all_tags,
            commands::browser_history_commands::history_start_session,
            commands::browser_history_commands::history_end_session,
            commands::browser_history_commands::history_get_current_session,
            commands::browser_history_commands::history_get_session,
            commands::browser_history_commands::history_get_all_sessions,
            commands::browser_history_commands::history_get_recent_sessions,
            commands::browser_history_commands::history_restore_session,
            commands::browser_history_commands::history_rename_session,
            commands::browser_history_commands::history_delete_session,
            commands::browser_history_commands::history_add_recently_closed,
            commands::browser_history_commands::history_get_recently_closed,
            commands::browser_history_commands::history_restore_recently_closed,
            commands::browser_history_commands::history_clear_recently_closed,
            commands::browser_history_commands::history_get_frequent_sites,
            commands::browser_history_commands::history_get_stats,
            commands::browser_history_commands::history_get_domain_stats,
            commands::browser_history_commands::history_get_all_domains,
            commands::browser_history_commands::history_clear,
            commands::browser_history_commands::history_clear_domain,
            commands::browser_history_commands::history_cleanup_old_entries,
            commands::browser_history_commands::history_export,
            commands::browser_history_commands::history_import,

            // === CUBE BOOKMARKS ELITE (55 commands) ===
            commands::browser_bookmarks_commands::browser_bookmarks_get_settings,
            commands::browser_bookmarks_commands::browser_bookmarks_update_settings,
            commands::browser_bookmarks_commands::browser_bookmarks_create,
            commands::browser_bookmarks_commands::browser_bookmarks_create_folder,
            commands::browser_bookmarks_commands::browser_bookmarks_get,
            commands::browser_bookmarks_commands::browser_bookmarks_update,
            commands::browser_bookmarks_commands::browser_bookmarks_delete,
            commands::browser_bookmarks_commands::browser_bookmarks_get_all,
            commands::browser_bookmarks_commands::browser_bookmarks_move,
            commands::browser_bookmarks_commands::browser_bookmarks_reorder,
            commands::browser_bookmarks_commands::browser_bookmarks_move_to_bar,
            commands::browser_bookmarks_commands::browser_bookmarks_move_to_other,
            commands::browser_bookmarks_commands::browser_bookmarks_add_tag,
            commands::browser_bookmarks_commands::browser_bookmarks_remove_tag,
            commands::browser_bookmarks_commands::browser_bookmarks_get_all_tags,
            commands::browser_bookmarks_commands::browser_bookmarks_get_by_tag,
            commands::browser_bookmarks_commands::browser_bookmarks_set_tags,
            commands::browser_bookmarks_commands::browser_bookmarks_toggle_favorite,
            commands::browser_bookmarks_commands::browser_bookmarks_set_favorite,
            commands::browser_bookmarks_commands::browser_bookmarks_get_favorites,
            commands::browser_bookmarks_commands::browser_bookmarks_search,
            commands::browser_bookmarks_commands::browser_bookmarks_filter,
            commands::browser_bookmarks_commands::browser_bookmarks_search_by_url,
            commands::browser_bookmarks_commands::browser_bookmarks_search_in_folder,
            commands::browser_bookmarks_commands::browser_bookmarks_get_folder_contents,
            commands::browser_bookmarks_commands::browser_bookmarks_get_tree,
            commands::browser_bookmarks_commands::browser_bookmarks_get_all_folders,
            commands::browser_bookmarks_commands::browser_bookmarks_get_bar,
            commands::browser_bookmarks_commands::browser_bookmarks_get_other,
            commands::browser_bookmarks_commands::browser_bookmarks_get_mobile,
            commands::browser_bookmarks_commands::browser_bookmarks_record_visit,
            commands::browser_bookmarks_commands::browser_bookmarks_get_most_visited,
            commands::browser_bookmarks_commands::browser_bookmarks_get_recently_added,
            commands::browser_bookmarks_commands::browser_bookmarks_get_recently_used,
            commands::browser_bookmarks_commands::browser_bookmarks_get_stats,
            commands::browser_bookmarks_commands::browser_bookmarks_get_count,
            commands::browser_bookmarks_commands::browser_bookmarks_get_folder_count,
            commands::browser_bookmarks_commands::browser_bookmarks_export_json,
            commands::browser_bookmarks_commands::browser_bookmarks_export_html,
            commands::browser_bookmarks_commands::browser_bookmarks_import_json,
            commands::browser_bookmarks_commands::browser_bookmarks_import_from_file,
            commands::browser_bookmarks_commands::browser_bookmarks_export_to_file,
            commands::browser_bookmarks_commands::browser_bookmarks_check_url_exists,
            commands::browser_bookmarks_commands::browser_bookmarks_find_duplicates,
            commands::browser_bookmarks_commands::browser_bookmarks_cleanup_orphaned,
            commands::browser_bookmarks_commands::browser_bookmarks_quick_add,
            commands::browser_bookmarks_commands::browser_bookmarks_quick_add_to_folder,
            commands::browser_bookmarks_commands::browser_bookmarks_batch_delete,
            commands::browser_bookmarks_commands::browser_bookmarks_batch_move,
            commands::browser_bookmarks_commands::browser_bookmarks_batch_add_tag,
            commands::browser_bookmarks_commands::browser_bookmarks_batch_set_favorite,

            // === CUBE EXTENSIONS MANAGER ELITE (40 commands) ===
            commands::browser_extensions_commands::extensions_get_settings,
            commands::browser_extensions_commands::extensions_update_settings,
            commands::browser_extensions_commands::extensions_toggle_developer_mode,
            commands::browser_extensions_commands::extensions_install,
            commands::browser_extensions_commands::extensions_install_from_store,
            commands::browser_extensions_commands::extensions_uninstall,
            commands::browser_extensions_commands::extensions_enable,
            commands::browser_extensions_commands::extensions_disable,
            commands::browser_extensions_commands::extensions_toggle,
            commands::browser_extensions_commands::extensions_get,
            commands::browser_extensions_commands::extensions_get_all,
            commands::browser_extensions_commands::extensions_get_enabled,
            commands::browser_extensions_commands::extensions_get_disabled,
            commands::browser_extensions_commands::extensions_get_recommended,
            commands::browser_extensions_commands::extensions_search,
            commands::browser_extensions_commands::extensions_get_permissions,
            commands::browser_extensions_commands::extensions_grant_permission,
            commands::browser_extensions_commands::extensions_revoke_permission,
            commands::browser_extensions_commands::extensions_set_incognito_access,
            commands::browser_extensions_commands::extensions_set_file_access,
            commands::browser_extensions_commands::extensions_toggle_pin,
            commands::browser_extensions_commands::extensions_get_pinned,
            commands::browser_extensions_commands::extensions_check_updates,
            commands::browser_extensions_commands::extensions_update,
            commands::browser_extensions_commands::extensions_update_all,
            commands::browser_extensions_commands::extensions_get_stats,
            commands::browser_extensions_commands::extensions_get_count,
            commands::browser_extensions_commands::extensions_get_enabled_count,
            commands::browser_extensions_commands::extensions_export,
            commands::browser_extensions_commands::extensions_import,
            commands::browser_extensions_commands::extensions_get_list,
            commands::browser_extensions_commands::extensions_batch_enable,
            commands::browser_extensions_commands::extensions_batch_disable,
            commands::browser_extensions_commands::extensions_batch_uninstall,
            commands::browser_extensions_commands::extensions_search_store,
            commands::browser_extensions_commands::extensions_get_store_details,

            // === CUBE PRIVACY DASHBOARD (45 commands) ===
            commands::browser_privacy_commands::privacy_get_settings,
            commands::browser_privacy_commands::privacy_update_settings,
            commands::browser_privacy_commands::privacy_set_level,
            commands::browser_privacy_commands::privacy_get_protection_score,
            commands::browser_privacy_commands::privacy_record_blocked_tracker,
            commands::browser_privacy_commands::privacy_get_blocked_trackers,
            commands::browser_privacy_commands::privacy_get_blocked_trackers_by_type,
            commands::browser_privacy_commands::privacy_clear_blocked_trackers,
            commands::browser_privacy_commands::privacy_add_cookie,
            commands::browser_privacy_commands::privacy_get_cookies,
            commands::browser_privacy_commands::privacy_get_cookies_for_domain,
            commands::browser_privacy_commands::privacy_get_third_party_cookies,
            commands::browser_privacy_commands::privacy_delete_cookie,
            commands::browser_privacy_commands::privacy_delete_cookies_for_domain,
            commands::browser_privacy_commands::privacy_clear_all_cookies,
            commands::browser_privacy_commands::privacy_clear_third_party_cookies,
            commands::browser_privacy_commands::privacy_get_cookie_stats,
            commands::browser_privacy_commands::privacy_get_fingerprint_protection,
            commands::browser_privacy_commands::privacy_rotate_fingerprint,
            commands::browser_privacy_commands::privacy_set_spoofed_user_agent,
            commands::browser_privacy_commands::privacy_set_spoofed_timezone,
            commands::browser_privacy_commands::privacy_set_spoofed_resolution,
            commands::browser_privacy_commands::privacy_get_site_permissions,
            commands::browser_privacy_commands::privacy_set_site_permission,
            commands::browser_privacy_commands::privacy_get_all_site_permissions,
            commands::browser_privacy_commands::privacy_clear_site_permissions,
            commands::browser_privacy_commands::privacy_clear_all_site_permissions,
            commands::browser_privacy_commands::privacy_add_to_whitelist,
            commands::browser_privacy_commands::privacy_remove_from_whitelist,
            commands::browser_privacy_commands::privacy_add_to_blacklist,
            commands::browser_privacy_commands::privacy_remove_from_blacklist,
            commands::browser_privacy_commands::privacy_is_whitelisted,
            commands::browser_privacy_commands::privacy_is_blacklisted,
            commands::browser_privacy_commands::privacy_get_stats,
            commands::browser_privacy_commands::privacy_reset_daily_stats,
            commands::browser_privacy_commands::privacy_reset_weekly_stats,
            commands::browser_privacy_commands::privacy_reset_monthly_stats,
            commands::browser_privacy_commands::privacy_generate_report,
            commands::browser_privacy_commands::privacy_get_doh_providers,
            commands::browser_privacy_commands::privacy_set_doh_provider,
            commands::browser_privacy_commands::privacy_clear_browsing_data,

            // === CUBE SYNC SERVICE (50 commands) ===
            commands::browser_sync_commands::sync_get_settings,
            commands::browser_sync_commands::sync_update_settings,
            commands::browser_sync_commands::sync_toggle,
            commands::browser_sync_commands::sync_set_data_type,
            commands::browser_sync_commands::sync_get_status,
            commands::browser_sync_commands::sync_is_syncing,
            commands::browser_sync_commands::sync_login,
            commands::browser_sync_commands::sync_logout,
            commands::browser_sync_commands::sync_get_account,
            commands::browser_sync_commands::sync_is_logged_in,
            commands::browser_sync_commands::sync_get_devices,
            commands::browser_sync_commands::sync_get_current_device,
            commands::browser_sync_commands::sync_get_device,
            commands::browser_sync_commands::sync_rename_device,
            commands::browser_sync_commands::sync_remove_device,
            commands::browser_sync_commands::sync_toggle_device,
            commands::browser_sync_commands::sync_queue_item,
            commands::browser_sync_commands::sync_get_queue,
            commands::browser_sync_commands::sync_clear_queue,
            commands::browser_sync_commands::sync_start,
            commands::browser_sync_commands::sync_complete,
            commands::browser_sync_commands::sync_cancel,
            commands::browser_sync_commands::sync_data_type,
            commands::browser_sync_commands::sync_get_conflicts,
            commands::browser_sync_commands::sync_get_unresolved_conflicts,
            commands::browser_sync_commands::sync_resolve_conflict,
            commands::browser_sync_commands::sync_resolve_with_local,
            commands::browser_sync_commands::sync_resolve_with_server,
            commands::browser_sync_commands::sync_get_history,
            commands::browser_sync_commands::sync_get_last,
            commands::browser_sync_commands::sync_clear_history,
            commands::browser_sync_commands::sync_generate_key,
            commands::browser_sync_commands::sync_get_keys,
            commands::browser_sync_commands::sync_get_active_key,
            commands::browser_sync_commands::sync_rotate_key,
            commands::browser_sync_commands::sync_create_recovery_key,
            commands::browser_sync_commands::sync_get_stats,
            commands::browser_sync_commands::sync_get_storage_usage,
            commands::browser_sync_commands::sync_reset_stats,
            commands::browser_sync_commands::sync_export,
            commands::browser_sync_commands::sync_import,

            // === CUBE SEARCH ENGINE (30 commands) ===
            commands::browser_search_commands::search_get_settings,
            commands::browser_search_commands::search_update_settings,
            commands::browser_search_commands::search_add_engine,
            commands::browser_search_commands::search_update_engine,
            commands::browser_search_commands::search_delete_engine,
            commands::browser_search_commands::search_get_engine,
            commands::browser_search_commands::search_get_all_engines,
            commands::browser_search_commands::search_get_enabled_engines,
            commands::browser_search_commands::search_get_default_engine,
            commands::browser_search_commands::search_set_default_engine,
            commands::browser_search_commands::search_toggle_engine,
            commands::browser_search_commands::search_get_engine_by_keyword,
            commands::browser_search_commands::search_get_engines_by_category,
            commands::browser_search_commands::search_build_url,
            commands::browser_search_commands::search_record,
            commands::browser_search_commands::search_process_omnibox,
            commands::browser_search_commands::search_add_quick_action,
            commands::browser_search_commands::search_get_quick_actions,
            commands::browser_search_commands::search_delete_quick_action,
            commands::browser_search_commands::search_engine_get_history,
            commands::browser_search_commands::search_engine_clear_history,
            commands::browser_search_commands::search_engine_delete_history_item,
            commands::browser_search_commands::search_engine_get_stats,
            commands::browser_search_commands::search_engine_reset_stats,
            commands::browser_search_commands::search_export_engines,
            commands::browser_search_commands::search_import_engines,

            // ================================================================
            // INVESTOR SYSTEM COMMANDS (37 commands)
            // ================================================================

            // === INVESTOR MANAGEMENT ===
            commands::investor_commands::create_investor,
            commands::investor_commands::get_investor,
            commands::investor_commands::get_investor_by_user,
            commands::investor_commands::update_investor,
            commands::investor_commands::delete_investor,
            commands::investor_commands::verify_investor_kyc,

            // === PORTFOLIO ===
            commands::investor_commands::get_portfolio_summary,
            commands::investor_commands::get_investment_analytics,

            // === INVESTMENTS ===
            commands::investor_commands::create_investment,
            commands::investor_commands::get_investment,
            commands::investor_commands::get_investor_investments,
            commands::investor_commands::activate_investment,
            commands::investor_commands::list_investment_opportunities,

            // === SMART CONTRACTS ===
            commands::investor_commands::create_smart_contract,
            commands::investor_commands::get_smart_contract,
            commands::investor_commands::get_investor_contracts,
            commands::investor_commands::sign_contract,
            commands::investor_commands::activate_contract,

            // === PAYOUTS ===
            commands::investor_commands::get_payout_schedule,
            commands::investor_commands::process_scheduled_payouts,
            commands::investor_commands::request_early_withdrawal,

            // === TOKENS ===
            commands::investor_commands::get_investor_token_balance,
            commands::investor_commands::issue_cube_tokens,
            commands::investor_commands::investor_stake_tokens,
            commands::investor_commands::investor_unstake_tokens,
            commands::investor_commands::transfer_tokens,
            commands::investor_commands::investor_claim_staking_rewards,

            // === LICENSES ===
            commands::investor_commands::get_investor_licenses,
            commands::investor_commands::activate_investor_license,

            // === NOTIFICATIONS ===
            commands::investor_commands::get_investor_notifications,
            commands::investor_commands::mark_notification_read,
            commands::investor_commands::mark_all_notifications_read,

            // === DOCUMENTS ===
            commands::investor_commands::generate_investment_agreement,
            commands::investor_commands::get_investor_documents,

            // ================================================================
            // AFFILIATE SYSTEM COMMANDS (25 commands)
            // ================================================================

            // === AFFILIATE MANAGEMENT ===
            commands::affiliate_commands::create_affiliate,
            commands::affiliate_commands::get_affiliate,
            commands::affiliate_commands::get_affiliate_by_code,
            commands::affiliate_commands::update_affiliate,
            commands::affiliate_commands::upgrade_affiliate_tier,
            commands::affiliate_commands::get_sub_affiliates,

            // === DASHBOARD & STATS ===
            commands::affiliate_commands::get_affiliate_dashboard_stats,
            commands::affiliate_commands::get_tier_commission_rates,

            // === REFERRALS & TRACKING ===
            commands::affiliate_commands::create_affiliate_link,
            commands::affiliate_commands::get_affiliate_links,
            commands::affiliate_commands::record_affiliate_click,
            commands::affiliate_commands::record_affiliate_conversion,
            commands::affiliate_commands::get_affiliate_referrals,

            // === COMMISSIONS ===
            commands::affiliate_commands::get_affiliate_commissions,
            commands::affiliate_commands::calculate_multi_level_commissions,

            // === PAYOUTS ===
            commands::affiliate_commands::request_affiliate_payout,
            commands::affiliate_commands::get_affiliate_payouts,
            commands::affiliate_commands::process_affiliate_payouts,

            // === WHITE-LABEL ===
            commands::affiliate_commands::get_white_label_config,
            commands::affiliate_commands::update_white_label_config,
            commands::affiliate_commands::verify_white_label_domain,
            commands::affiliate_commands::get_white_label_branding,

            // === MARKETING MATERIALS ===
            commands::affiliate_commands::get_marketing_materials,

            // ================================================================
            // SSO/LDAP ENTERPRISE AUTHENTICATION (28 commands)
            // ================================================================
            
            // === SSO PROVIDER MANAGEMENT ===
            commands::sso_commands::create_saml_provider,
            commands::sso_commands::create_oidc_provider,
            commands::sso_commands::get_sso_provider,
            commands::sso_commands::get_tenant_sso_providers,
            commands::sso_commands::update_sso_provider,
            commands::sso_commands::delete_sso_provider,
            commands::sso_commands::test_sso_provider,
            commands::sso_commands::get_sp_metadata,

            // === SSO AUTHENTICATION ===
            commands::sso_commands::initiate_sso,
            commands::sso_commands::complete_sso,
            commands::sso_commands::initiate_sso_logout,
            commands::sso_commands::get_sso_session,
            commands::sso_commands::invalidate_sso_session,

            // === LDAP CONFIGURATION ===
            commands::sso_commands::create_ldap_config,
            commands::sso_commands::get_ldap_config,
            commands::sso_commands::get_tenant_ldap_configs,
            commands::sso_commands::update_ldap_config,
            commands::sso_commands::delete_ldap_config,
            commands::sso_commands::test_ldap_connection,

            // === LDAP SYNC & AUTH ===
            commands::sso_commands::ldap_authenticate,
            commands::sso_commands::sync_ldap_users,
            commands::sso_commands::sync_ldap_groups,
            commands::sso_commands::get_ldap_groups,
            commands::sso_commands::map_ldap_group_role,
            commands::sso_commands::get_ldap_users,

            // === SSO AUDIT ===
            commands::sso_commands::log_sso_event,
            commands::sso_commands::get_sso_audit_log,

            // ================================================================
            // MULTI-TENANT SYSTEM (34 commands)
            // ================================================================
            
            // === TENANT MANAGEMENT ===
            commands::tenant_commands::create_tenant,
            commands::tenant_commands::get_tenant,
            commands::tenant_commands::get_all_tenants,
            commands::tenant_commands::get_user_tenants,
            commands::tenant_commands::update_tenant,
            commands::tenant_commands::update_tenant_settings,
            commands::tenant_commands::delete_tenant,
            commands::tenant_commands::suspend_tenant,
            commands::tenant_commands::reactivate_tenant,
            commands::tenant_commands::upgrade_tenant_plan,

            // === USER MANAGEMENT ===
            commands::tenant_commands::get_tenant_users,
            commands::tenant_commands::get_tenant_user,
            commands::tenant_commands::update_user_role,
            commands::tenant_commands::remove_tenant_user,
            commands::tenant_commands::deactivate_tenant_user,

            // === INVITATIONS ===
            commands::tenant_commands::invite_user,
            commands::tenant_commands::get_tenant_invitations,
            commands::tenant_commands::accept_invitation,
            commands::tenant_commands::revoke_invitation,
            commands::tenant_commands::resend_invitation,

            // === ROLES ===
            commands::tenant_commands::create_role,
            commands::tenant_commands::get_tenant_roles,
            commands::tenant_commands::update_role,
            commands::tenant_commands::delete_role,
            commands::tenant_commands::get_available_permissions,

            // === AUDIT ===
            commands::tenant_commands::log_tenant_event,
            commands::tenant_commands::get_tenant_audit_log,

            // === USAGE & BILLING ===
            commands::tenant_commands::get_tenant_usage,
            commands::tenant_commands::get_tenant_usage_history,
            commands::tenant_commands::check_tenant_limits,

            // === WHITE LABEL ===
            commands::tenant_commands::configure_white_label,
            commands::tenant_commands::get_tenant_white_label_config,
            commands::tenant_commands::update_tenant_white_label_config,
            commands::tenant_commands::disable_white_label,

            // ================================================================
            // BROWSER PROFILE MANAGEMENT (35 commands)
            // ================================================================
            
            // === PROFILE MANAGEMENT ===
            commands::browser_profile_commands::create_browser_profile,
            commands::browser_profile_commands::get_browser_profile,
            commands::browser_profile_commands::get_user_profiles,
            commands::browser_profile_commands::get_tenant_profiles,
            commands::browser_profile_commands::update_browser_profile,
            commands::browser_profile_commands::delete_browser_profile,
            commands::browser_profile_commands::archive_browser_profile,
            commands::browser_profile_commands::clone_browser_profile,

            // === LAUNCH & SESSIONS ===
            commands::browser_profile_commands::launch_browser_profile,
            commands::browser_profile_commands::end_browser_session,
            commands::browser_profile_commands::get_profile_sessions,
            commands::browser_profile_commands::get_profile_active_sessions,

            // === FINGERPRINT ===
            commands::browser_profile_commands::update_profile_fingerprint,
            commands::browser_profile_commands::generate_random_fingerprint,
            commands::browser_profile_commands::get_fingerprint_templates,

            // === PROXY ===
            commands::browser_profile_commands::set_profile_proxy,
            commands::browser_profile_commands::remove_profile_proxy,
            commands::browser_profile_commands::test_profile_proxy,

            // === COOKIES ===
            commands::browser_profile_commands::get_profile_cookies,
            commands::browser_profile_commands::import_profile_cookies,
            commands::browser_profile_commands::export_profile_cookies,
            commands::browser_profile_commands::clear_profile_cookies,

            // === STORAGE ===
            commands::browser_profile_commands::get_profile_storage,
            commands::browser_profile_commands::clear_profile_storage,

            // === GROUPS ===
            commands::browser_profile_commands::create_profile_group,
            commands::browser_profile_commands::get_profile_groups,
            commands::browser_profile_commands::update_profile_group,
            commands::browser_profile_commands::delete_profile_group,
            commands::browser_profile_commands::move_profiles_to_group,

            // === IMPORT/EXPORT ===
            commands::browser_profile_commands::export_browser_profile,
            commands::browser_profile_commands::import_browser_profile,

            // === SYNC ===
            commands::browser_profile_commands::sync_browser_profile,
            commands::browser_profile_commands::get_profile_sync_status,
            commands::browser_profile_commands::toggle_profile_sync,

            // ================================================================
            // AUTOMATION EXTENDED (22 commands)
            // ================================================================
            
            // === EXECUTION CONTROL ===
            commands::automation_extended::automation_cancel_execution,
            commands::automation_extended::automation_is_execution_cancelled,

            // === RECORDING CONTROL ===
            commands::automation_extended::automation_pause_recording,
            commands::automation_extended::automation_resume_recording,
            commands::automation_extended::automation_is_recording_paused,

            // === PDD MANAGEMENT ===
            commands::automation_extended::automation_save_pdd,
            commands::automation_extended::automation_get_pdd,
            commands::automation_extended::automation_list_pdds,
            commands::automation_extended::automation_delete_pdd,
            commands::automation_extended::automation_update_pdd_metadata,

            // === PROCESS MODEL ===
            commands::automation_extended::automation_save_process_model,
            commands::automation_extended::automation_get_process_model,
            commands::automation_extended::automation_list_process_models,
            commands::automation_extended::automation_delete_process_model,

            // === SELECTOR MANAGEMENT ===
            commands::automation_extended::automation_save_selector,
            commands::automation_extended::automation_get_selector,
            commands::automation_extended::automation_list_selectors,
            commands::automation_extended::automation_delete_selector,
            commands::automation_extended::automation_record_selector_result,

            // === TEMPLATE MANAGEMENT ===
            commands::automation_extended::automation_save_as_template,
            commands::automation_extended::automation_get_template,
            commands::automation_extended::automation_list_templates,
            commands::automation_extended::automation_update_template,
            commands::automation_extended::automation_delete_template,
            commands::automation_extended::automation_rate_template,
            commands::automation_extended::automation_download_template,

            // ================================================================
            // PROXY POOL & ANTI-BAN (35 commands)
            // ================================================================
            
            // === PROXY POOL ===
            commands::proxy_pool_commands::proxy_pool_create,
            commands::proxy_pool_commands::proxy_pool_get,
            commands::proxy_pool_commands::proxy_pool_list,
            commands::proxy_pool_commands::proxy_pool_update,
            commands::proxy_pool_commands::proxy_pool_delete,
            commands::proxy_pool_commands::proxy_check_pool_health,
            commands::proxy_pool_commands::proxy_add_multiple,
            commands::proxy_pool_commands::proxy_delete_multiple,
            commands::proxy_pool_commands::proxy_import_from_text,
            commands::proxy_pool_commands::proxy_reset_stats,

            // === PROXY SESSIONS ===
            commands::proxy_pool_commands::proxy_session_start,
            commands::proxy_pool_commands::proxy_session_end,
            commands::proxy_pool_commands::proxy_session_end_all,
            commands::proxy_pool_commands::proxy_session_list,

            // === PROXY PROVIDERS ===
            commands::proxy_pool_commands::proxy_provider_add,
            commands::proxy_pool_commands::proxy_provider_get,
            commands::proxy_pool_commands::proxy_provider_list,
            commands::proxy_pool_commands::proxy_provider_update,
            commands::proxy_pool_commands::proxy_provider_delete,
            commands::proxy_pool_commands::proxy_provider_refresh,

            // === ANTI-BAN ===
            commands::proxy_pool_commands::antiban_create_config,
            commands::proxy_pool_commands::antiban_get_config,
            commands::proxy_pool_commands::antiban_list_configs,
            commands::proxy_pool_commands::antiban_apply_config,
            commands::proxy_pool_commands::antiban_delete_config,
            commands::proxy_pool_commands::antiban_report_ban,
            commands::proxy_pool_commands::antiban_get_rate_limit_status,
            commands::proxy_pool_commands::proxy_clear_ban,

            // ================================================================
            // SECURITY & COMPLIANCE (45 commands)
            // ================================================================
            
            // === SECURITY ALERTS ===
            commands::security_compliance_commands::security_create_alert,
            commands::security_compliance_commands::security_get_alert,
            commands::security_compliance_commands::security_list_alerts,
            commands::security_compliance_commands::security_acknowledge_alert,
            commands::security_compliance_commands::security_add_alert_note,

            // === SECURITY EVENTS ===
            commands::security_compliance_commands::security_acknowledge_event,

            // === SECURITY INCIDENTS ===
            commands::security_compliance_commands::security_create_incident,
            commands::security_compliance_commands::security_get_incident,
            commands::security_compliance_commands::security_assign_incident,
            commands::security_compliance_commands::security_close_incident,
            commands::security_compliance_commands::security_add_timeline_entry,

            // === DETECTION RULES ===
            commands::security_compliance_commands::security_create_detection_rule,
            commands::security_compliance_commands::security_get_detection_rule,
            commands::security_compliance_commands::security_list_detection_rules,
            commands::security_compliance_commands::security_delete_detection_rule,
            commands::security_compliance_commands::security_import_rules,

            // === PLAYBOOKS ===
            commands::security_compliance_commands::security_create_playbook,
            commands::security_compliance_commands::security_get_playbook,
            commands::security_compliance_commands::security_list_playbooks,
            commands::security_compliance_commands::security_delete_playbook,
            commands::security_compliance_commands::security_execute_playbook,
            commands::security_compliance_commands::security_approve_step,
            commands::security_compliance_commands::security_cancel_execution,

            // === SIEM INTEGRATIONS ===
            commands::security_compliance_commands::security_create_siem_integration,
            commands::security_compliance_commands::security_get_siem_integration,
            commands::security_compliance_commands::security_list_siem_integrations,
            commands::security_compliance_commands::security_delete_siem_integration,

            // === COMPLIANCE FRAMEWORKS ===
            commands::security_compliance_commands::compliance_create_framework,
            commands::security_compliance_commands::compliance_get_framework,
            commands::security_compliance_commands::compliance_list_frameworks,
            commands::security_compliance_commands::compliance_set_framework_enabled,
            commands::security_compliance_commands::compliance_update_requirement_status,

            // === COMPLIANCE EVIDENCE ===
            commands::security_compliance_commands::compliance_add_evidence,
            commands::security_compliance_commands::compliance_get_evidence,
            commands::security_compliance_commands::compliance_list_evidence,
            commands::security_compliance_commands::compliance_remove_evidence,

            // === SITE CONFIGURATION (SUPERADMIN) ===
            commands::site_config_commands::site_config_load,
            commands::site_config_commands::site_config_save,
            commands::site_config_commands::site_config_get_version,
            commands::site_config_commands::site_config_get_history,
            commands::site_config_commands::site_config_rollback,
            commands::site_config_commands::site_config_export,
            commands::site_config_commands::site_config_import,

            // === AI VIRTUAL CALL CENTER (compete with RingCentral, Aircall, Five9) ===
            commands::call_center_commands::call_center_load_config,
            commands::call_center_commands::call_center_update_config,
            commands::call_center_commands::call_center_get_conversations,
            commands::call_center_commands::call_center_get_conversation,
            commands::call_center_commands::call_center_start_conversation,
            commands::call_center_commands::call_center_update_conversation_status,
            commands::call_center_commands::call_center_assign_conversation,
            commands::call_center_commands::call_center_escalate_conversation,
            commands::call_center_commands::call_center_send_message,
            commands::call_center_commands::call_center_generate_ai_response,
            commands::call_center_commands::call_center_get_agents,
            commands::call_center_commands::call_center_update_agent_status,
            commands::call_center_commands::call_center_create_ai_agent,
            commands::call_center_commands::call_center_update_ai_agent,
            commands::call_center_commands::call_center_get_queues,
            commands::call_center_commands::call_center_create_queue,
            commands::call_center_commands::call_center_update_queue,
            commands::call_center_commands::call_center_queue_stats,
            commands::call_center_commands::call_center_get_analytics,
            commands::call_center_commands::call_center_agent_performance,
            commands::call_center_commands::call_center_realtime_dashboard,
            commands::call_center_commands::call_center_analyze_message,
            commands::call_center_commands::call_center_sentiment_trend,
            commands::call_center_commands::call_center_initiate_call,
            commands::call_center_commands::call_center_answer_call,
            commands::call_center_commands::call_center_end_call,
            commands::call_center_commands::call_center_transfer_call,
            commands::call_center_commands::call_center_call_transcription,
            commands::call_center_commands::call_center_send_whatsapp_template,
            commands::call_center_commands::call_center_get_whatsapp_templates,
            commands::call_center_commands::call_center_search_knowledge,
            commands::call_center_commands::call_center_suggested_responses,
            commands::call_center_commands::call_center_upload_attachment,
            // ═══════════════════════════════════════════════════════════════════════
            // SUPERADMIN COMMANDS - ABSOLUTE CONTROL (76 Commands)
            // ═══════════════════════════════════════════════════════════════════════
            // User Management (14 commands)
            commands::superadmin_users::sa_get_users,
            commands::superadmin_users::sa_get_user,
            commands::superadmin_users::sa_create_user,
            commands::superadmin_users::sa_update_user,
            commands::superadmin_users::sa_delete_user,
            commands::superadmin_users::sa_suspend_user,
            commands::superadmin_users::sa_reactivate_user,
            commands::superadmin_users::sa_impersonate_user,
            commands::superadmin_users::sa_force_password_reset,
            commands::superadmin_users::sa_get_user_sessions,
            commands::superadmin_users::sa_terminate_sessions,
            commands::superadmin_users::sa_bulk_update_users,
            commands::superadmin_users::sa_assign_role,
            commands::superadmin_users::sa_remove_role,
            // Teams & Roles (13 commands)
            commands::superadmin_teams::sa_get_teams,
            commands::superadmin_teams::sa_get_team,
            commands::superadmin_teams::sa_create_team,
            commands::superadmin_teams::sa_update_team,
            commands::superadmin_teams::sa_delete_team,
            commands::superadmin_teams::sa_add_team_member,
            commands::superadmin_teams::sa_remove_team_member,
            commands::superadmin_teams::sa_get_roles,
            commands::superadmin_teams::sa_get_role,
            commands::superadmin_teams::sa_create_role,
            commands::superadmin_teams::sa_update_role,
            commands::superadmin_teams::sa_delete_role,
            commands::superadmin_teams::sa_get_permissions,
            // Security Settings (12 commands)
            commands::superadmin_security::sa_get_security_settings,
            commands::superadmin_security::sa_update_security_settings,
            commands::superadmin_security::sa_get_ip_whitelist,
            commands::superadmin_security::sa_add_ip_whitelist,
            commands::superadmin_security::sa_remove_ip_whitelist,
            commands::superadmin_security::sa_get_sso_providers,
            commands::superadmin_security::sa_configure_sso,
            commands::superadmin_security::sa_disable_sso,
            commands::superadmin_security::sa_delete_sso_provider,
            commands::superadmin_security::sa_enforce_mfa,
            commands::superadmin_security::sa_add_dlp_rule,
            commands::superadmin_security::sa_remove_dlp_rule,
            // Audit & Compliance (12 commands)
            commands::superadmin_audit::sa_get_audit_logs,
            commands::superadmin_audit::sa_export_audit_logs,
            commands::superadmin_audit::sa_get_compliance_settings,
            commands::superadmin_audit::sa_enable_compliance_framework,
            commands::superadmin_audit::sa_disable_compliance_framework,
            commands::superadmin_audit::sa_run_compliance_assessment,
            commands::superadmin_audit::sa_get_legal_holds,
            commands::superadmin_audit::sa_create_legal_hold,
            commands::superadmin_audit::sa_release_legal_hold,
            commands::superadmin_audit::sa_get_data_requests,
            commands::superadmin_audit::sa_create_data_request,
            commands::superadmin_audit::sa_complete_data_request,
            // Billing & API (14 commands)
            commands::superadmin_billing::sa_get_subscription,
            commands::superadmin_billing::sa_update_subscription,
            commands::superadmin_billing::sa_cancel_subscription,
            commands::superadmin_billing::sa_get_invoices,
            commands::superadmin_billing::sa_get_all_invoices,
            commands::superadmin_billing::sa_get_api_keys,
            commands::superadmin_billing::sa_create_api_key,
            commands::superadmin_billing::sa_revoke_api_key,
            commands::superadmin_billing::sa_delete_api_key,
            commands::superadmin_billing::sa_get_webhooks,
            commands::superadmin_billing::sa_create_webhook,
            commands::superadmin_billing::sa_update_webhook,
            commands::superadmin_billing::sa_delete_webhook,
            commands::superadmin_billing::sa_test_webhook,
            // System & Monitoring (13 commands)
            commands::superadmin_system::sa_get_system_health,
            commands::superadmin_system::sa_get_realtime_metrics,
            commands::superadmin_system::sa_get_alerts,
            commands::superadmin_system::sa_acknowledge_alert,
            commands::superadmin_system::sa_resolve_alert,
            commands::superadmin_system::sa_get_pending_actions,
            commands::superadmin_system::sa_approve_action,
            commands::superadmin_system::sa_reject_action,
            commands::superadmin_system::sa_enable_maintenance_mode,
            commands::superadmin_system::sa_disable_maintenance_mode,
            commands::superadmin_system::sa_is_maintenance_mode,
            commands::superadmin_system::sa_broadcast_announcement,
            commands::superadmin_system::sa_get_dashboard,

            // ================================================================
            // CEF (CHROMIUM EMBEDDED FRAMEWORK) - FULL BROWSER ENGINE
            // Superior to WebView: Full DRM, all codecs, Chrome extensions
            // ================================================================
            cef::commands::cef_initialize,
            cef::commands::cef_create_tab,
            cef::commands::cef_close_tab,
            cef::commands::cef_get_tab_info,
            cef::commands::cef_get_tab_ids,
            cef::commands::cef_get_all_tabs,
            cef::commands::cef_navigate,
            cef::commands::cef_get_url,
            cef::commands::cef_go_back,
            cef::commands::cef_go_forward,
            cef::commands::cef_reload,
            cef::commands::cef_stop,
            cef::commands::cef_execute_script,
            cef::commands::cef_get_cookies,
            cef::commands::cef_set_cookie,
            cef::commands::cef_delete_cookies,
            cef::commands::cef_set_zoom,
            cef::commands::cef_toggle_mute,
            cef::commands::cef_find,
            cef::commands::cef_stop_finding,
            cef::commands::cef_open_devtools,
            cef::commands::cef_close_devtools,
            cef::commands::cef_take_screenshot,
            cef::commands::cef_print_to_pdf,
            cef::commands::cef_get_settings,
            cef::commands::cef_update_settings,
        ])
        .setup(|app| {
            info!("Setting up CUBE Nexum Enterprise Platform...");

            // Initialize AppState
            let app_state = match AppState::new(app.handle().clone()) {
                Ok(state) => state,
                Err(e) => {
                    error!("Failed to initialize application: {}", e);
                    std::process::exit(1);
                }
            };
            app.manage(app_state);
            info!("✅ Application state registered");

            // Initialize Core Services (AI, Storage, Encryption)
            let ai_service = services::AIService::new();
            app.manage(ai_service);
            info!("🧠 AI Service initialized");

            let storage_service = services::StorageService::new();
            app.manage(storage_service);
            info!("💾 Storage Service initialized");

            let encryption_service = services::EncryptionService::new();
            app.manage(encryption_service);
            info!("🔐 Encryption Service initialized");

            // Initialize Stripe Service
            // Configuration loaded from environment variables for security
            // In production, these should be set via:
            //   - Environment variables (STRIPE_SECRET_KEY, etc.)
            //   - Tauri's app config
            //   - Secure credential storage
            // 
            // Environment Variables:
            //   STRIPE_SECRET_KEY      - Stripe API secret key (sk_live_... or sk_test_...)
            //   STRIPE_WEBHOOK_SECRET  - Webhook endpoint signing secret (whsec_...)
            //   STRIPE_PRICE_PRO_MONTHLY  - Price ID for Pro monthly plan
            //   STRIPE_PRICE_PRO_YEARLY   - Price ID for Pro yearly plan
            //   STRIPE_PRICE_ELITE_MONTHLY - Price ID for Elite monthly plan
            //   STRIPE_PRICE_ELITE_YEARLY  - Price ID for Elite yearly plan
            let stripe_config = services::stripe_service::StripeConfig {
                secret_key: std::env::var("STRIPE_SECRET_KEY").unwrap_or_default(),
                webhook_secret: std::env::var("STRIPE_WEBHOOK_SECRET").unwrap_or_default(),
                price_pro_monthly: std::env::var("STRIPE_PRICE_PRO_MONTHLY").unwrap_or_default(),
                price_pro_yearly: std::env::var("STRIPE_PRICE_PRO_YEARLY").unwrap_or_default(),
                price_elite_monthly: std::env::var("STRIPE_PRICE_ELITE_MONTHLY").unwrap_or_default(),
                price_elite_yearly: std::env::var("STRIPE_PRICE_ELITE_YEARLY").unwrap_or_default(),
            };
            
            // Log whether Stripe is configured (without revealing secrets)
            let stripe_configured = !stripe_config.secret_key.is_empty();
            if stripe_configured {
                info!("💳 Stripe credentials loaded from environment");
            } else {
                warn!("⚠️ Stripe not configured - payment features disabled");
                warn!("   Set STRIPE_SECRET_KEY environment variable to enable payments");
            }
            
            let stripe_service = match services::StripeService::new(stripe_config) {
                Ok(service) => service,
                Err(e) => {
                    // Create a disabled Stripe service for graceful degradation
                    // The service will return appropriate errors when payment
                    // methods are called without valid configuration
                    warn!("Stripe service initialization warning: {}", e);
                    warn!("Creating disabled Stripe service - payment features unavailable");
                    match services::StripeService::new(services::stripe_service::StripeConfig {
                        secret_key: String::new(), // Empty = disabled mode
                        webhook_secret: String::new(),
                        price_pro_monthly: String::new(),
                        price_pro_yearly: String::new(),
                        price_elite_monthly: String::new(),
                        price_elite_yearly: String::new(),
                    }) {
                        Ok(s) => s,
                        Err(e) => {
                            // Graceful degradation: create a minimal disabled service
                            // Payment features will return appropriate errors when called
                            error!("Critical: Stripe service unavailable - payments disabled: {}", e);
                            // Return minimal disabled service without crashing
                            services::StripeService::disabled()
                        }
                    }
                }
            };
            app.manage(stripe_service);
            info!("💳 Stripe Payment Service initialized");

            // Initialize AI Chat State
            let ai_chat_state = commands::ai_chat::AIChatState::new();
            app.manage(ai_chat_state);
            info!("💬 AI Chat Service initialized");

            // Initialize CEF (Chromium Embedded Framework) State
            // This provides full browser engine capabilities: DRM, codecs, extensions
            let cef_state = cef::commands::CEFState::new();
            app.manage(cef_state);
            info!("🌐 CEF Browser Engine State initialized");

            // Initialize Notes & Tasks State
            let app_data_dir = app.path().app_data_dir().expect("Failed to get app data directory");
            
            // Initialize License Service (Fortune 500 Grade Security)
            let license_service = services::license_service::LicenseService::new(app_data_dir.clone());
            app.manage(license_service);
            info!("🔑 License Service initialized (Ed25519 + ChaCha20 encryption)");
            
            let notes_db_path = app_data_dir.join("notes.db");
            let notes_db_path_str = notes_db_path.to_str()
                .ok_or_else(|| "Invalid path encoding for notes.db")
                .expect("Notes DB path must be valid UTF-8");
            let notes_service = services::notes_service::NotesService::new(
                notes_db_path_str
            ).expect("Failed to initialize Notes service");
            let notes_state = commands::notes::NotesState {
                service: std::sync::Mutex::new(notes_service),
            };
            app.manage(notes_state);
            info!("📝 Notes & Tasks Service initialized");

            // Initialize Password Manager State
            let passwords_db_path = app_data_dir.join("passwords.db");
            let passwords_db_path_str = passwords_db_path.to_str()
                .ok_or_else(|| "Invalid path encoding for passwords.db")
                .expect("Passwords DB path must be valid UTF-8");
            let password_service = services::password_service::PasswordService::new(
                passwords_db_path_str
            ).expect("Failed to initialize Password Manager service");
            let password_state = commands::passwords_new::PasswordState {
                service: std::sync::Mutex::new(password_service),
            };
            app.manage(password_state);
            info!("🔐 Password Manager Service initialized (AES-256-GCM)");

            // Initialize Collections State
            let collections_db_path = app_data_dir.join("collections.db");
            let collections_db_path_str = collections_db_path.to_str()
                .ok_or_else(|| "Invalid path encoding for collections.db")
                .expect("Collections DB path must be valid UTF-8");
            let collections_service = services::collections_service::CollectionsService::new(
                collections_db_path_str
            ).expect("Failed to initialize Collections service");
            let collections_state = commands::collections::CollectionsState {
                service: std::sync::Mutex::new(collections_service),
            };
            app.manage(collections_state);
            info!("📚 Collections Service initialized (hierarchical bookmarks with sharing)");

            // Initialize Reading List State
            let reading_list_db_path = app_data_dir.join("reading_list.db");
            let reading_list_db_path_str = reading_list_db_path.to_str()
                .ok_or_else(|| "Invalid path encoding for reading_list.db")
                .expect("Reading List DB path must be valid UTF-8");
            let reading_list_service = services::reading_list_service::ReadingListService::new(
                reading_list_db_path_str
            ).expect("Failed to initialize Reading List service");
            app.manage(reading_list_service);
            info!("📚 Reading List Service initialized");

            // Initialize Media Player State
            let media_db_path = app_data_dir.join("media.db");
            let media_db_path_str = media_db_path.to_str()
                .ok_or_else(|| "Invalid path encoding for media.db")
                .expect("Media DB path must be valid UTF-8");
            let media_service = services::media_service::MediaService::new(
                media_db_path_str
            ).expect("Failed to initialize Media Player service");
            app.manage(media_service);
            info!("🎵 Media Player Service initialized");

            // === Initialize Video Conference Service ===
            let video_conference_service = Arc::new(services::video_conference_service::VideoConferenceService::new(app.handle().clone()));
            app.manage(video_conference_service);
            info!("📹 Video Conference Service initialized (WebRTC multi-party)");

            // Initialize Terminal State
            let terminal_db_path = app_data_dir.join("terminal.db");
            let terminal_db_path_str = terminal_db_path.to_str()
                .ok_or_else(|| "Invalid path encoding for terminal.db")
                .expect("Terminal DB path must be valid UTF-8");
            let terminal_service = services::terminal_service::TerminalService::new(
                terminal_db_path_str
            ).expect("Failed to initialize Terminal service");
            app.manage(terminal_service);
            info!("💻 Terminal Emulator Service initialized");

            // Initialize Collaboration State
            let collaboration_state = Arc::new(commands::collaboration::CollaborationState::new());
            app.manage(collaboration_state);
            info!("🤝 Collaboration System initialized (beats Zoom/AnyViewer)");

            // Initialize Remote Desktop v2 State (DISABLED - missing src/remote/* submodules)
            // let remote_desktop_state = commands::remote_system_v2::RemoteDesktopState::new();
            // app.manage(remote_desktop_state);
            // info!("🖥️ Remote Desktop v2 initialized (WebRTC + encryption)");

            // Initialize Workflow State
            let workflow_state = commands::workflow_commands::WorkflowState::new();
            app.manage(workflow_state);
            info!("⚡ Workflow Builder initialized (beats Zapier)");

            // Initialize VPN State
            let vpn_state = commands::vpn::VPNState::default();
            app.manage(vpn_state);
            info!("🔐 VPN Manager initialized");

            // Initialize AdBlocker State
            let adblocker_state = commands::vpn::AdBlockerState::default();
            app.manage(adblocker_state);
            info!("🛡️ AdBlocker initialized");

            // Initialize Kill Switch State
            let killswitch_state = commands::vpn::KillSwitchState::default();
            app.manage(killswitch_state);
            info!("🔒 Kill Switch initialized");

            // Initialize Split Tunneling State
            let split_tunnel_state = commands::vpn::SplitTunnelState::default();
            app.manage(split_tunnel_state);
            info!("🔀 Split Tunneling initialized");

            // Initialize Dedicated IP State
            let dedicated_ip_state = commands::vpn::DedicatedIPState::default();
            app.manage(dedicated_ip_state);
            info!("🌐 Dedicated IP initialized");

            // Initialize Double VPN State
            let double_vpn_state = commands::vpn::DoubleVPNState::default();
            app.manage(double_vpn_state);
            info!("🔐 Double VPN initialized");

            // Initialize Meshnet State
            let meshnet_state = commands::vpn::MeshnetState::default();
            app.manage(meshnet_state);
            info!("🕸️ Meshnet initialized");

            // Initialize Threat Protection State
            let threat_protection_state = commands::vpn::ThreatProtectionState::default();
            app.manage(threat_protection_state);
            info!("🛡️ Threat Protection initialized");

            // ========================================================================
            // INITIALIZE CUBE DOWNLOADS MANAGER ELITE
            // ========================================================================
            
            // Initialize Downloads Manager State
            let downloads_service = services::browser_downloads::BrowserDownloadsService::new();
            app.manage(downloads_service);
            info!("📥 Downloads Manager Elite initialized (queues, categories, bandwidth control)");

            // ========================================================================
            // INITIALIZE CUBE HISTORY ELITE
            // ========================================================================
            
            // Initialize History Service State
            let history_service = services::browser_history::BrowserHistoryService::new();
            app.manage(history_service);
            info!("📜 History Elite initialized (sessions, analytics, smart search)");

            // ========================================================================
            // INITIALIZE CUBE BOOKMARKS ELITE
            // ========================================================================
            
            // Initialize Bookmarks Service State
            let bookmarks_service = services::browser_bookmarks::BrowserBookmarksService::new();
            app.manage(bookmarks_service);
            info!("⭐ Bookmarks Elite initialized (folders, tags, import/export, 55 commands)");

            // ========================================================================
            // INITIALIZE CUBE EXTENSIONS MANAGER ELITE
            // ========================================================================
            
            // Initialize Extensions Manager Service State
            let extensions_service = services::browser_extensions::ExtensionsManagerService::new();
            app.manage(extensions_service);
            info!("🧩 Extensions Manager Elite initialized (Chrome compatibility, 40 commands)");

            // ========================================================================
            // INITIALIZE CUBE PRIVACY DASHBOARD
            // ========================================================================
            
            // Initialize Privacy Dashboard Service State
            let privacy_service = services::browser_privacy::PrivacyDashboardService::new();
            app.manage(privacy_service);
            info!("🔒 Privacy Dashboard initialized (trackers, cookies, fingerprinting, 45 commands)");

            // ========================================================================
            // INITIALIZE CUBE SYNC SERVICE
            // ========================================================================
            
            // Initialize Sync Service State
            let sync_service = services::browser_sync::SyncService::new();
            app.manage(sync_service);
            info!("🔄 Sync Service initialized (E2E encryption, cross-device, 50 commands)");

            // ========================================================================
            // INITIALIZE CUBE SEARCH ENGINE
            // ========================================================================
            
            // Initialize Search Engine Service State
            let search_service = services::browser_search::SearchEngineService::new();
            app.manage(search_service);
            info!("🔎 Search Engine initialized (15 engines, quick keywords, omnibox, 30 commands)");

            // ========================================================================
            // INITIALIZE CUBE TAB GROUPS (AI-POWERED TAB MANAGEMENT)
            // ========================================================================
            
            // Initialize Tab Groups State
            let tab_groups_state = commands::browser_tab_groups_commands::TabGroupsState(
                std::sync::Mutex::new(services::browser_tab_groups::CubeTabGroups::new())
            );
            app.manage(tab_groups_state);
            info!("📑 Tab Groups initialized (AI-powered, superior to Chrome/Opera/Vivaldi)");

            // ========================================================================
            // INITIALIZE CUBE WEB ENGINE (TRUE EMBEDDED BROWSER)
            // ========================================================================
            
            // Initialize CUBE Web Engine Global State
            let cube_web_engine_state = commands::cube_web_engine_commands::CubeWebEngineGlobalState::default();
            app.manage(cube_web_engine_state);
            info!("🌐 CUBE Web Engine initialized (true embedded browser, no external windows, CORS bypass)");

            // ========================================================================
            // INITIALIZE AI VIRTUAL CALL CENTER (compete with RingCentral, Aircall, Five9)
            // ========================================================================
            
            // Initialize Call Center State
            let call_center_state = commands::call_center_commands::CallCenterState::default();
            app.manage(call_center_state);
            info!("📞 AI Virtual Call Center initialized (voice, WhatsApp, AI agents, analytics)");

            // ========================================================================
            // INITIALIZE SUPERADMIN SYSTEM - ABSOLUTE CONTROL (6 States)
            // ========================================================================
            
            // SuperAdmin Users State
            let superadmin_users_state = commands::superadmin_users::SuperAdminUsersState::default();
            app.manage(superadmin_users_state);
            info!("👤 SuperAdmin Users initialized (impersonate, suspend, bulk ops)");
            
            // SuperAdmin Teams State
            let superadmin_teams_state = commands::superadmin_teams::SuperAdminTeamsState::default();
            app.manage(superadmin_teams_state);
            info!("👥 SuperAdmin Teams initialized (teams, roles, permissions)");
            
            // SuperAdmin Security State
            let superadmin_security_state = commands::superadmin_security::SuperAdminSecurityState::default();
            app.manage(superadmin_security_state);
            info!("🛡️ SuperAdmin Security initialized (MFA, SSO, DLP, IP whitelist)");
            
            // SuperAdmin Audit State
            let superadmin_audit_state = commands::superadmin_audit::SuperAdminAuditState::default();
            app.manage(superadmin_audit_state);
            info!("📋 SuperAdmin Audit initialized (logs, GDPR, SOC2, legal holds)");
            
            // SuperAdmin Billing State
            let superadmin_billing_state = commands::superadmin_billing::SuperAdminBillingState::default();
            app.manage(superadmin_billing_state);
            info!("💰 SuperAdmin Billing initialized (subscriptions, API keys, webhooks)");
            
            // SuperAdmin System State
            let superadmin_system_state = commands::superadmin_system::SuperAdminSystemState::default();
            app.manage(superadmin_system_state);
            info!("🖥️ SuperAdmin System initialized (health, alerts, maintenance mode)");

            // ========================================================================
            // INITIALIZE PASSWORD ADVANCED STATES
            // ========================================================================
            
            // Initialize CLI Access State
            let cli_access_state = commands::password_advanced::CLIAccessState::default();
            app.manage(cli_access_state);
            info!("💻 CLI Access initialized (sessions, tokens, command history)");

            // Initialize Dark Web Monitor State
            let darkweb_monitor_state = commands::password_advanced::DarkWebMonitorState::default();
            app.manage(darkweb_monitor_state);
            info!("🌑 Dark Web Monitor initialized (breach detection)");

            // Initialize SSH Key Manager State
            let ssh_key_state = commands::password_advanced::SSHKeyState::default();
            app.manage(ssh_key_state);
            info!("🔑 SSH Key Manager initialized");

            // Initialize Passkey Manager State
            let passkey_state = commands::password_advanced::PasskeyState::default();
            app.manage(passkey_state);
            info!("🔐 Passkey Manager initialized (WebAuthn/FIDO2)");

            // Initialize Vault Health State
            let vault_health_state = commands::password_advanced::VaultHealthState::default();
            app.manage(vault_health_state);
            info!("🏥 Vault Health Dashboard initialized");

            // Initialize Watchtower State
            let watchtower_state = commands::password_advanced::WatchtowerState::default();
            app.manage(watchtower_state);
            info!("🗼 Watchtower initialized (security alerts)");

            // Initialize Family Vaults State
            let family_vaults_state = commands::password_advanced::FamilyVaultsState::default();
            app.manage(family_vaults_state);
            info!("👨‍👩‍👧‍👦 Family Vaults initialized (shared passwords)");

            // Initialize Secure Send State
            let secure_send_state = commands::password_advanced::SecureSendState::default();
            app.manage(secure_send_state);
            info!("📤 Secure Send initialized (encrypted sharing)");

            // Initialize Username Generator State
            let username_gen_state = commands::password_advanced::UsernameGeneratorState::default();
            app.manage(username_gen_state);
            info!("🎭 Username Generator initialized");

            // ========================================================================
            // INITIALIZE FILE TRANSFER ADVANCED STATES
            // ========================================================================
            
            // Initialize P2P Sync State
            let p2p_sync_state = commands::file_transfer_advanced::P2PSyncState::default();
            app.manage(p2p_sync_state);
            info!("🔗 P2P Sync initialized (peer-to-peer file sharing)");

            // Initialize Bandwidth Control State
            let bandwidth_state = commands::file_transfer_advanced::BandwidthControlState::default();
            app.manage(bandwidth_state);
            info!("📊 Bandwidth Control initialized");

            // Initialize Version History State
            let version_history_state = commands::file_transfer_advanced::VersionHistoryState::default();
            app.manage(version_history_state);
            info!("📜 Version History initialized");

            // Initialize LAN Transfer State
            let lan_transfer_state = commands::file_transfer_advanced::LANTransferState::default();
            app.manage(lan_transfer_state);
            info!("🌐 LAN Transfer initialized");

            // Initialize Selective Sync State
            let selective_sync_state = commands::file_transfer_advanced::SelectiveSyncState::default();
            app.manage(selective_sync_state);
            info!("🔄 Selective Sync initialized");

            // ========================================================================
            // INITIALIZE KNOWLEDGE ADVANCED STATES
            // ========================================================================

            // Initialize Templates State
            let templates_state = commands::knowledge_advanced::TemplatesState::default();
            app.manage(templates_state);
            info!("📝 Knowledge Templates initialized");

            // Initialize AI Agents State
            let ai_agents_state = commands::knowledge_advanced::AIAgentsState::default();
            app.manage(ai_agents_state);
            info!("🤖 AI Agents initialized");

            // Initialize Graph View State
            let graph_view_state = commands::knowledge_advanced::GraphViewState::default();
            app.manage(graph_view_state);
            info!("🕸️ Graph View initialized");

            // Initialize Web Clipper State
            let web_clipper_state = commands::knowledge_advanced::WebClipperState::default();
            app.manage(web_clipper_state);
            info!("📎 Web Clipper initialized");

            // Initialize Canvas State
            let canvas_state = commands::knowledge_advanced::CanvasState::default();
            app.manage(canvas_state);
            info!("🎨 Canvas initialized");

            // ========================================================================
            // INITIALIZE CRM ADVANCED STATES
            // ========================================================================

            // Initialize Email Writer State
            let email_writer_state = commands::crm_advanced::EmailWriterState::default();
            app.manage(email_writer_state);
            info!("✉️ Email Writer initialized");

            // Initialize Lead Scoring State
            let lead_scoring_state = commands::crm_advanced::LeadScoringState::default();
            app.manage(lead_scoring_state);
            info!("📊 Lead Scoring initialized");

            // Initialize Pipeline State
            let crm_pipeline_state = commands::crm_advanced::PipelineState::default();
            app.manage(crm_pipeline_state);
            info!("📈 CRM Pipeline initialized");

            // Initialize AI Sales Assistant State
            let ai_sales_state = commands::crm_advanced::AISalesAssistantState::default();
            app.manage(ai_sales_state);
            info!("🤖 AI Sales Assistant initialized");

            // ========================================================================
            // INITIALIZE REMOTE ADVANCED STATES
            // ========================================================================

            // Initialize Privacy Mode State
            let privacy_mode_state = commands::remote_advanced::PrivacyModeState::default();
            app.manage(privacy_mode_state);
            info!("🔒 Privacy Mode initialized");

            // Initialize Whiteboard State
            let whiteboard_state = commands::remote_advanced::WhiteboardState::default();
            app.manage(whiteboard_state);
            info!("🎨 Whiteboard initialized");

            // Initialize Session Recording State
            let session_recording_state = commands::remote_advanced::SessionRecordingState::default();
            app.manage(session_recording_state);
            info!("🎥 Session Recording initialized");

            // Initialize Multi-Monitor State
            let multi_monitor_state = commands::remote_advanced::MultiMonitorState::default();
            app.manage(multi_monitor_state);
            info!("🖥️ Multi-Monitor initialized");

            // ========================================================================
            // INITIALIZE EXTRACTOR ADVANCED STATES
            // ========================================================================

            // Initialize MultiPage Extractor State
            let multipage_extractor_state = commands::extractor_advanced::MultiPageExtractorState::default();
            app.manage(multipage_extractor_state);
            info!("📄 MultiPage Extractor initialized");

            // Initialize Captcha Handler State
            let captcha_handler_state = commands::extractor_advanced::CaptchaHandlerState::default();
            app.manage(captcha_handler_state);
            info!("🔐 Captcha Handler initialized");

            // Initialize AI Auto Detector State
            let ai_auto_detector_state = commands::extractor_advanced::AIAutoDetectorState::default();
            app.manage(ai_auto_detector_state);
            info!("🤖 AI Auto Detector initialized");

            // Initialize Self-Healing Selectors State
            let self_healing_state = commands::extractor_advanced::SelfHealingSelectorsState::default();
            app.manage(self_healing_state);
            info!("🩹 Self-Healing Selectors initialized");

            // Initialize Extraction Templates State
            let extraction_templates_state = commands::extractor_advanced::ExtractionTemplatesState::default();
            app.manage(extraction_templates_state);
            info!("📋 Extraction Templates initialized");

            // ========================================================================
            // INITIALIZE ENTERPRISE ADVANCED STATES
            // ========================================================================

            // Initialize Pipeline Builder State
            let pipeline_builder_state = commands::enterprise_advanced::PipelineBuilderState::default();
            app.manage(pipeline_builder_state);
            info!("🏗️ Enterprise Pipeline Builder initialized");

            // Initialize VPN Provider API (PureVPN Integration)
            let vpn_provider_api = services::vpn_provider_api::VpnProviderAPI::new()
                .expect("Failed to initialize VPN Provider API");
            app.manage(vpn_provider_api);
            info!("🌐 VPN Provider API initialized (CUBE Elite VPN)");

            // === Initialize VoIP States ===
            let voip_state = commands::voip::VoIPState::new();
            app.manage(voip_state);
            let voip_contacts_state = commands::voip::VoIPContactsState::new();
            app.manage(voip_contacts_state);
            let voip_call_history_state = commands::voip::VoIPCallHistoryState::new();
            app.manage(voip_call_history_state);
            let voip_audio_devices_state = commands::voip::VoIPAudioDevicesState::new();
            app.manage(voip_audio_devices_state);
            info!("📞 VoIP Service initialized (WebRTC with TURN/STUN support)");

            // === Initialize Workflow Scheduler ===
            let scheduler = services::scheduler::WorkflowScheduler::new();
            let scheduler_state = commands::scheduler::SchedulerState(Arc::new(scheduler));
            app.manage(scheduler_state);
            info!("⏰ Workflow Scheduler initialized");

            // === Initialize Monitoring Services ===
            let metrics = Arc::new(services::metrics::MetricsService::new());
            let logs = Arc::new(services::logs::LogsService::new());
            let alerts = Arc::new(services::alerts::AlertsService::new());
            let monitoring_state = commands::monitoring::MonitoringState {
                metrics,
                logs,
                alerts,
            };
            app.manage(monitoring_state);
            info!("📊 Monitoring Services initialized (metrics, logs, alerts)");

            // === Initialize Security Lab Service ===
            let security_lab_service = Arc::new(services::security_lab_service::SecurityLabService::new(app.handle().clone()));
            app.manage(security_lab_service);
            info!("🔐 Security Lab Service initialized (vulnerability scanner & exploit framework)");

            // === Initialize API Server ===
            let api_server_state = commands::api_server::ApiServerState::new();
            app.manage(api_server_state);
            info!("🌐 API Server initialized (not started, use api_server_start command)");

            // === Initialize Google Sheets ===
            let google_sheets_state = commands::google_sheets::GoogleSheetsState::new();
            app.manage(google_sheets_state);
            info!("📊 Google Sheets integration initialized (configure OAuth2 first)");

            // === Initialize Slack/Discord Integrations ===
            let integration_state = commands::integrations::IntegrationState::new();
            app.manage(integration_state);
            info!("💬 Slack/Discord integrations initialized (webhook-based)");

            // === Initialize Anti-Detection Services ===
            let stealth_state = commands::stealth::StealthState {
                stealth: Arc::new(services::stealth::StealthService::new()),
                proxy: Arc::new(services::proxy::ProxyService::new()),
                captcha: Arc::new(services::captcha::CaptchaService::new(services::captcha::CaptchaConfig {
                    api_key: String::new(),
                    service_url: "https://2captcha.com".to_string(),
                })),
                rate_limiter: Arc::new(services::rate_limiter::RateLimiterService::new()),
            };
            app.manage(stealth_state);
            info!("🕵️ Anti-Detection Services initialized (stealth, proxy, captcha, rate limiter)");

            // === Initialize Docker Service ===
            match services::docker_service::DockerService::new(app.handle().clone()) {
                Ok(docker_service) => {
                    app.manage(Arc::new(docker_service));
                    info!("🐳 Docker Service initialized (container management)");
                }
                Err(e) => {
                    error!("⚠️ Docker Service unavailable: {}", e);
                    error!("   Make sure Docker Desktop is installed and running.");
                }
            }

            // === Initialize SSH Manager ===
            match services::ssh_manager::SshManager::new(app.handle().clone()) {
                Ok(ssh_manager) => {
                    app.manage(ssh_manager);
                    info!("🔐 SSH Manager initialized (terminal connections)");
                }
                Err(e) => {
                    error!("⚠️ SSH Manager initialization failed: {}", e);
                }
            }

            // === Initialize FTP Manager ===
            match services::ftp_manager::FtpManager::new(app.handle().clone()) {
                Ok(ftp_manager) => {
                    app.manage(ftp_manager);
                    info!("📁 FTP Manager initialized (FTP/SFTP client & server)");
                }
                Err(e) => {
                    error!("⚠️ FTP Manager initialization failed: {}", e);
                }
            }

            // === Initialize LendingPad State ===
            let lendingpad_state = commands::lendingpad::LendingPadState::new();
            app.manage(lendingpad_state);
            info!("🏦 LendingPad State initialized (document automation)");

            // === Initialize Data Sources State ===
            let data_sources_state = commands::data_sources::DataSourcesState::default();
            app.manage(data_sources_state);
            info!("📊 Data Sources State initialized (database, API, file connections)");

            // === Initialize Automation State ===
            let automation_state = commands::automation::AutomationState::new();
            app.manage(automation_state);
            info!("🤖 Automation State initialized (workflow engine)");

            // === Initialize Browser Service (Headless Chrome for Automation) ===
            let browser_service = Arc::new(services::browser_service::BrowserService::new(app.handle().clone()));
            app.manage(browser_service);
            info!("🌐 Browser Service initialized (headless Chrome automation)");

            // === Initialize Chat Service ===
            let chat_service = Arc::new(services::chat_service::ChatService::new(app.handle().clone()));
            app.manage(chat_service);
            info!("💬 Chat Service initialized (native chat rooms)");

            // === Initialize Webview State (for native browser webviews) ===
            let webview_state = commands::webview_commands::WebviewState::default();
            app.manage(webview_state);
            info!("🌐 Webview State initialized (native browser engine)");

            // === Initialize Embedded Webview State (for CUBE DevTools) ===
            let embedded_webview_state = commands::embedded_webview::EmbeddedWebviewState::default();
            app.manage(embedded_webview_state);
            info!("🔧 Embedded Webview State initialized (CUBE DevTools)");

            // === Initialize Browser Proxy State (Full Page Access) ===
            let browser_proxy_state = services::browser_proxy::BrowserProxyState::default();
            app.manage(browser_proxy_state);
            info!("🌐 Browser Proxy State initialized (unrestricted browsing)");

            // === Initialize Native Browser State (Full WebviewWindow Browser) ===
            let native_browser_state = commands::native_browser::NativeBrowserState::default();
            app.manage(native_browser_state);
            info!("🌐 Native Browser State initialized (YouTube, Netflix, auth sites)");

            // === Initialize Embedded Browser State (Tabbed Webviews in Main Window) ===
            let embedded_browser_state = commands::embedded_browser::EmbeddedBrowserState::new();
            app.manage(embedded_browser_state);
            info!("🌐 Embedded Browser State initialized (tabbed browsing)");

            // === Initialize Updates State ===
            let update_state = commands::updates::UpdateState::default();
            app.manage(update_state);
            info!("🔄 Update Service initialized (auto/manual updates from admin server)");

            // === Initialize Cloud Sync State ===
            let cloud_sync_state = commands::cloud_sync::CloudSyncState::default();
            app.manage(cloud_sync_state);
            info!("☁️ Cloud Sync Service initialized (settings, billing, devices, backups)");

            // === Initialize Admin State (Admin Panel Backend) ===
            let admin_state = commands::admin::AdminState::default();
            app.manage(admin_state);
            info!("👤 Admin State initialized (users, licenses, sales, analytics)");

            // === Initialize Admin Extended States ===
            let release_state = commands::admin_releases::ReleaseState::default();
            app.manage(release_state);
            info!("📦 Release State initialized (versions, rollout, platforms)");

            let affiliate_state = commands::admin_affiliates::AffiliateState::default();
            app.manage(affiliate_state);
            info!("🤝 Affiliate State initialized (commissions, payouts, tracking)");

            let helpdesk_state = commands::admin_helpdesk::HelpdeskState::default();
            app.manage(helpdesk_state);
            info!("🎫 Helpdesk State initialized (tickets, agents, SLA)");

            let file_manager_state = commands::admin_files::FileManagerState::default();
            app.manage(file_manager_state);
            info!("📁 File Manager State initialized (storage, sharing, versions)");

            // === Initialize CRM State ===
            let crm_state = commands::crm::CRMState::default();
            app.manage(crm_state);
            info!("📊 CRM State initialized (contacts, companies, deals, pipeline)");

            // === Initialize Workspace State ===
            let workspace_state = commands::workspace_manager::WorkspaceState::default();
            app.manage(workspace_state);
            info!("🗂️ Workspace State initialized (layouts, tabs, panels, notes, tasks)");

            // === Initialize Marketing State ===
            let marketing_state = commands::marketing::MarketingState::default();
            app.manage(marketing_state);
            info!("📧 Marketing State initialized (campaigns, emails, funnels, leads)");

            // === Initialize Email Service State ===
            let email_service_state = services::EmailServiceState::new();
            app.manage(email_service_state);
            info!("📨 Email Service initialized (SMTP + SendGrid dual provider)");

            // === Initialize Contact Service State ===
            let contact_service_state = services::ContactServiceState::new();
            app.manage(contact_service_state);
            info!("📇 Contact Service initialized (lists, segments, import/export)");

            // === Initialize CUBE Mail Service State ===
            let cube_mail_state = services::CubeMailServiceState::new();
            app.manage(cube_mail_state);
            info!("📬 CUBE Mail Service initialized (IMAP/SMTP, encryption, AI features)");

            // === Initialize OAuth2 Service State ===
            let oauth2_state = services::OAuth2ServiceState::new();
            app.manage(oauth2_state);
            info!("🔐 OAuth2 Service initialized (Google, Microsoft, Yahoo)");

            // === Initialize Social Media State ===
            let social_state = commands::social::SocialState::default();
            app.manage(social_state);
            info!("📱 Social Media State initialized (accounts, posts, scheduling, analytics)");

            // === Initialize Research State ===
            let research_state = commands::research::ResearchState::default();
            app.manage(research_state);
            info!("🔬 Research State initialized (projects, competitors, trends, reports)");

            // === Initialize Search State ===
            let search_state = commands::search::SearchState::new();
            app.manage(search_state);
            info!("🔍 Search State initialized (AI-powered search engine)");

            // === Initialize Integration Layer State ===
            let integration_layer_state = commands::integration_layer::IntegrationLayerState::new();
            app.manage(integration_layer_state);
            info!("🔗 Integration Layer initialized (CRM ↔ Marketing ↔ Social ↔ Research ↔ Search)");

            // === Initialize Automation Extended State ===
            let automation_extended_state = commands::automation_extended::AutomationExtendedState::new();
            app.manage(automation_extended_state);
            info!("🔧 Automation Extended State initialized (PDD, Process Models, Selectors, Templates)");

            // === Initialize Proxy Pool State ===
            let proxy_pool_state = commands::proxy_pool_commands::ProxyPoolState::new();
            app.manage(proxy_pool_state);
            info!("🌐 Proxy Pool State initialized (pools, providers, anti-ban, sessions)");

            // === Initialize Security & Compliance State ===
            let security_compliance_state = commands::security_compliance_commands::SecurityComplianceState::new();
            app.manage(security_compliance_state);
            info!("🛡️ Security & Compliance State initialized (alerts, incidents, playbooks, SIEM, frameworks)");

            #[cfg(feature = "cef-browser")]
            {
                // ========================================================================
                // CEF BROWSER ENGINE - CHROMIUM EMBEDDED FRAMEWORK
                // ========================================================================
                
                // Initialize CEF integration for real browser functionality
                // Note: CEF requires specific environment setup:
                //   - CEF_PATH environment variable pointing to CEF binaries
                //   - On macOS: ~/.local/share/cef with framework files
                {
                    use tokio::sync::mpsc;
                    
                    // Create event channel for CEF browser events
                    let (event_tx, mut event_rx) = mpsc::unbounded_channel::<cef::types::BrowserEvent>();
                    
                    // Initialize CEF integration
                    let cef_integration = cef::cef_integration::CefIntegration::new(event_tx);
                    
                    // Try to initialize CEF (may fail if CEF binaries not installed)
                    match cef_integration.initialize_cef() {
                        Ok(()) => {
                            info!("🌐 CEF Browser Engine initialized successfully");
                            info!("   - Chromium version: 143.0.7499.193");
                            info!("   - DRM/Widevine: Enabled");
                            info!("   - DevTools: Port 9222");
                        }
                        Err(e) => {
                            warn!("⚠️ CEF Browser Engine initialization failed: {}", e);
                            warn!("   Browser features will use fallback WebView implementation");
                            warn!("   To enable CEF, set CEF_PATH environment variable");
                        }
                    }
                    
                    // Store CEF integration for use by browser commands
                    app.manage(std::sync::Arc::new(std::sync::RwLock::new(Some(cef_integration))));
                    
                    // Spawn background task to handle CEF events and emit to frontend
                    let app_handle = app.handle().clone();
                    tauri::async_runtime::spawn(async move {
                        while let Some(event) = event_rx.recv().await {
                            // Create event handler and emit to frontend
                            let handler = cef::handlers::EventHandler::new();
                            let mut handler_with_app = handler;
                            handler_with_app.set_app_handle(app_handle.clone());
                            handler_with_app.emit(event);
                        }
                    });
                    
                    // Spawn CEF message loop worker for macOS
                    #[cfg(target_os = "macos")]
                    {
                        use std::time::Duration;
                        tauri::async_runtime::spawn(async {
                            loop {
                                cef::cef_integration::CefIntegration::do_message_loop_work();
                                tokio::time::sleep(Duration::from_millis(16)).await; // ~60fps
                            }
                        });
                    }
                }
    
            }

            // ========================================================================
            // CUBE WEB ENGINE - PRODUCTION BROWSER (7 PHASES)
            // ========================================================================
            
            // Phase 1: Core Rendering Engine
            let rendering_state = commands::cube_engine_rendering::CubeRenderingState::default();
            app.manage(rendering_state);
            info!("🎨 CUBE Rendering Engine initialized (WebGL, Canvas, CSS, Layout)");

            // Phase 2: Advanced Tab Management
            let tab_mgmt_state = commands::cube_engine_tab_management::CubeTabManagementState::default();
            app.manage(tab_mgmt_state);
            info!("📑 CUBE Tab Management initialized (Hibernate, Groups, PiP, Sessions)");

            // Phase 3: Security & Privacy
            let security_state = commands::cube_engine_security::CubeSecurityState::default();
            app.manage(security_state);
            info!("🔐 CUBE Security Engine initialized (CSP, Certs, Trackers, Fingerprint)");

            // Phase 4: Performance Optimization
            let performance_state = commands::cube_engine_performance::CubePerformanceState::default();
            app.manage(performance_state);
            info!("⚡ CUBE Performance Engine initialized (Cache, Prefetch, Memory, Processes)");

            // Phase 5: DevTools Complete
            let devtools_state = commands::cube_engine_devtools::CubeDevToolsState::default();
            app.manage(devtools_state);
            info!("🔧 CUBE DevTools initialized (Network, Console, Elements, Profiler)");

            // Phase 6: Extensions Support
            let extensions_state = commands::cube_engine_extensions::CubeExtensionsState::default();
            app.manage(extensions_state);
            info!("🧩 CUBE Extensions Engine initialized (Manifest, Scripts, Storage)");

            // Phase 7: Media & Download
            let media_state = commands::cube_engine_media::CubeMediaState::default();
            app.manage(media_state);
            info!("🎬 CUBE Media Engine initialized (Playback, Downloads, PDF, Print)");

            // ========================================================================
            // PROGRESSIVE SERVICE INITIALIZATION STRATEGY
            // ========================================================================
            // Services are initialized on-demand or lazily to:
            // 1. Reduce startup time - core UI loads immediately
            // 2. Minimize memory footprint - services loaded when needed
            // 3. Handle dependencies gracefully - services can check prerequisites
            // 4. Allow graceful degradation - app works even if service fails
            //
            // Services initialized above are essential for core functionality.
            // Additional services (AI, Email, P2P, Security Lab, etc.) are 
            // initialized when first accessed via their respective commands.
            //
            // This architecture follows the CUBE Elite principle:
            // "Fast startup, progressive enhancement"
            // ========================================================================

            info!("✅ CUBE Nexum initialized successfully");
            info!("🚀 Core Features Active - Enterprise Services Pending");

            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                    info!("🔧 DevTools opened");
                } else {
                    error!("⚠️ Main window not found - DevTools not opened");
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
