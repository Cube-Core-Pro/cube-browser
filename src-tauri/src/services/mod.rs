pub mod ai_service;
pub mod storage_service;
pub mod encryption_service;

// CUBE Browser Engine - Real Chromium Browser
pub mod cube_browser_engine;
pub mod browser_shield; // 🛡️ CUBE Shield - Ad/Tracker Blocker (superior to Brave Shields)
pub mod browser_tab_groups; // 📑 CUBE Tab Groups - AI-powered tab management (superior to Chrome/Opera/Vivaldi)
pub mod browser_pip; // 🖼️ CUBE PiP Elite - Multi-PiP system (superior to Opera)
pub mod browser_split_view; // 🪟 CUBE Split View - Sync scrolling & layouts (superior to Vivaldi)
pub mod browser_sidebar; // 📚 CUBE Sidebar - Messaging, music, web panels (superior to Opera/Vivaldi)
pub mod browser_ai_assistant; // 🤖 CUBE AI Assistant - Page summary, translation, form fill (superior to all)
pub mod browser_reader; // 📖 CUBE Reader Mode - Clean view, TTS, annotations (superior to Safari/Firefox)
pub mod browser_workspaces; // 🗂️ CUBE Workspaces - Project-based tab organization (superior to Arc/Chrome profiles)
pub mod browser_screenshot; // 📸 CUBE Screenshot Elite - Full-page capture & annotations (superior to all)
pub mod browser_downloads; // 📥 CUBE Downloads Manager Elite - Advanced download management (superior to all)
pub mod browser_history; // 📜 CUBE History Elite - Sessions, analytics, smart search (superior to all)
pub mod browser_bookmarks; // ⭐ CUBE Bookmarks Elite - Hierarchical folders, tags, import/export (superior to all)
pub mod browser_extensions; // 🧩 CUBE Extensions Manager Elite - Chrome compatibility, permissions (superior to all)
pub mod browser_privacy; // 🔒 CUBE Privacy Dashboard - Unified privacy controls (superior to Brave/Firefox)
pub mod browser_sync; // 🔄 CUBE Sync Service - Cross-device sync with E2E encryption (superior to all)
pub mod browser_search; // 🔎 CUBE Search Engine - Custom engines, smart omnibox, quick keywords (superior to all)
pub mod browser_gestures; // 🖱️ CUBE Gestures - Mouse, trackpad, touch, rocker gestures (superior to Vivaldi/Opera)
pub mod browser_quick_commands; // ⌨️ CUBE Quick Commands - Command palette with fuzzy search (superior to Arc)
pub mod browser_speed_dial; // 🚀 CUBE Speed Dial - Visual bookmarks with live thumbnails (superior to Opera)
pub mod browser_tab_stacks; // 📚 CUBE Tab Stacks - Vivaldi-style tab grouping with auto-stack (superior to all)
pub mod browser_smart_sessions; // 💾 CUBE Smart Sessions - AI-powered session management with crash recovery (superior to all)
pub mod browser_themes; // 🎨 CUBE Themes - Custom themes with visual editor and presets (superior to all)
pub mod browser_vertical_tabs; // 📐 CUBE Vertical Tabs - Space-efficient tab management (superior to Edge/Vivaldi)
pub mod browser_tab_preview; // 👁️ CUBE Tab Preview - Live thumbnails & hover preview (superior to Edge)
pub mod browser_collections; // 📂 CUBE Collections - Curated web content organization (superior to Edge)
pub mod browser_web_apps; // 🌐 CUBE Web Apps - PWA installation & management (superior to Chrome)
pub mod browser_focus_mode; // 🎯 CUBE Focus Mode - Distraction-free browsing (unique feature)
pub mod browser_smart_clipboard; // 📋 CUBE Smart Clipboard - AI-enhanced clipboard manager (unique feature)
pub mod browser_tab_suspender; // 💤 CUBE Tab Suspender - Memory optimization (superior to The Great Suspender)
pub mod browser_reading_mode; // 📖 CUBE Reading Mode - Advanced reader with customization (superior to Safari)
pub mod browser_workspace_profiles; // 👤 CUBE Workspace Profiles - Context-based browsing (superior to Arc)
pub mod browser_web_annotations; // ✏️ CUBE Web Annotations - Highlights & collaborative notes (superior to Hypothesis)
pub mod browser_page_translator; // 🌍 CUBE Page Translator - Multi-engine real-time translation (superior to Chrome)
pub mod browser_rss_reader; // 📰 CUBE RSS Reader - Built-in feed reader with smart folders (superior to Vivaldi)
pub mod browser_site_permissions; // 🔐 CUBE Site Permissions - Granular permission control (superior to all)
pub mod browser_password_generator; // 🔑 CUBE Password Generator - Secure password creation (superior to 1Password)
pub mod browser_web_scraper; // 🕷️ CUBE Web Scraper - Data extraction engine (unique feature)

// Notes & Tasks
pub mod notes_service;

// Password Manager
pub mod password_service;

// Collections
pub mod collections_service;

// Reading List
pub mod reading_list_service;

// Media Player
pub mod media_service;

// Terminal Emulator
pub mod terminal_service;
pub mod pty_service;

// Payments
pub mod stripe_service;

// License Management
pub mod license_service;

// Browser & Core
pub mod browser_service;
pub mod browser_tab_manager;
pub mod session_manager;
pub mod chrome_extension_bridge;
pub mod chrome_extension_manager;
pub mod native_messaging_bridge;
pub mod download_service;
pub mod devtools_service;

// Communication
pub mod p2p_service;
pub mod chat_service;
pub mod video_conference_service;
pub mod media_voip_service;

// Enterprise
pub mod vpn_manager;
pub mod vpn_provider_api;
pub mod ftp_manager;
pub mod ssh_manager;
pub mod rdp_manager;
pub mod docker_service;

// Security
pub mod security_lab_service;
pub mod vulnerability_scanner;
pub mod exploit_shell;

// Documents
pub mod document_extractor;
pub mod universal_file_detector;
pub mod document_validator;

// Media & Recording
pub mod screen_recorder;
pub mod training_data_manager;
pub mod video_processing;
pub mod export_service;
pub mod batch_queue_service;

// Workspace & Integration
pub mod workspace_service;
pub mod layout_template_service;
pub mod project_management_service;
pub mod whatsapp_service;
pub mod profile_auto_creator;

// AI & Mock
pub mod mock_ai_service;

// Email Service (SMTP + SendGrid)
pub mod email_service;

// CUBE Mail - Full Email Client
pub mod cube_mail_service;
pub mod imap_client;
pub mod oauth2_service;
pub mod mail_database;

// Contact Management
pub mod contact_service;

// Automation & Scheduling
pub mod scheduler;

// Monitoring & Observability
pub mod metrics;
pub mod logs;
pub mod alerts;

// Enterprise Services
pub mod enterprise_service;
pub mod analytics_service;
pub mod notifications_service;

// Integration & External APIs
pub mod api_server;
pub mod google_sheets;
pub mod slack;
pub mod discord;

// Anti-Detection Features
pub mod stealth;
pub mod proxy;
pub mod captcha;
pub mod rate_limiter;

// Browser Proxy (Full Page Access)
pub mod browser_proxy;

// CUBE Web Engine - True Embedded Browser
pub mod cube_web_engine;

// Enterprise Authentication
pub mod sso_service;

// Multi-Tenant System
pub mod multi_tenant_service;

// Payment Processing
pub mod payment_service;

// Audit Logging (SOC2/GDPR/HIPAA)
pub mod audit_logging_service;

// Utilities
pub mod time_utils;

// Site Configuration (SuperAdmin)
pub mod site_config;

// Re-exports
pub use ai_service::AIService;
pub use storage_service::StorageService;
pub use encryption_service::EncryptionService;
pub use stripe_service::StripeService;
pub use browser_proxy::BrowserProxyState;
pub use email_service::EmailServiceState;
pub use contact_service::ContactServiceState;
pub use cube_mail_service::CubeMailServiceState;
pub use oauth2_service::OAuth2ServiceState;
pub use enterprise_service::EnterpriseService;
pub use analytics_service::AnalyticsService;
pub use notifications_service::NotificationsService;
