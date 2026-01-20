pub mod ai;
pub mod services; // NEW: Service wrappers (AI, Storage, Encryption)
pub mod stripe; // NEW: Stripe payment integration
pub mod license; // NEW: License management commands
pub mod window; // NEW: Window management commands
pub mod filesystem; // NEW: Filesystem operations
pub mod ai_commands; // NEW: AI-powered automation commands
pub mod cube_browser_commands; // 🚀 CUBE Browser Engine - Real Chromium integration
pub mod browser_shield_commands; // 🛡️ CUBE Shield - Ad/Tracker Blocker Commands
pub mod browser_tab_groups_commands; // 📑 CUBE Tab Groups - AI-powered tab management
pub mod browser_pip_commands; // 🖼️ CUBE PiP Elite - Multi-PiP Commands
pub mod browser_split_view_commands; // 🪟 CUBE Split View - Sync scrolling Commands
pub mod browser_sidebar_commands; // 📚 CUBE Sidebar - Messaging, music, web panels
pub mod browser_ai_assistant_commands; // 🤖 CUBE AI Assistant - Page summary, translation, form fill
pub mod browser_reader_commands; // 📖 CUBE Reader Mode - Clean view, TTS, annotations
pub mod browser_workspaces_commands; // 🗂️ CUBE Workspaces - Project-based tab organization
pub mod browser_screenshot_commands; // 📸 CUBE Screenshot Elite - Full-page capture & annotations
pub mod browser_downloads_commands; // 📥 CUBE Downloads Manager Elite - Advanced download management
pub mod browser_history_commands; // 📜 CUBE History Elite - Sessions, analytics, smart search
pub mod browser_bookmarks_commands; // ⭐ CUBE Bookmarks Elite - Hierarchical folders, tags, import/export
pub mod browser_extensions_commands; // 🧩 CUBE Extensions Manager Elite - Chrome compatibility, permissions
pub mod browser_privacy_commands; // 🔒 CUBE Privacy Dashboard - Unified privacy controls
pub mod browser_sync_commands; // 🔄 CUBE Sync Service - Cross-device sync
pub mod browser_search_commands; // 🔎 CUBE Search Engine - Custom engines, omnibox
pub mod browser_gestures_commands; // 🖱️ CUBE Gestures - Mouse, trackpad, touch gestures
pub mod browser_quick_commands_commands; // ⌨️ CUBE Quick Commands - Command palette
pub mod browser_speed_dial_commands; // 🚀 CUBE Speed Dial - Visual bookmarks
pub mod browser_tab_stacks_commands; // 📚 CUBE Tab Stacks - Vivaldi-style grouping
pub mod browser_smart_sessions_commands; // 💾 CUBE Smart Sessions - Crash recovery & context
pub mod browser_themes_commands; // 🎨 CUBE Themes - Custom themes & visual editor
pub mod browser_vertical_tabs_commands; // 📐 CUBE Vertical Tabs - Space-efficient tabs
pub mod browser_tab_preview_commands; // 👁️ CUBE Tab Preview - Live thumbnails & hover
pub mod browser_collections_commands; // 📂 CUBE Collections - Curated web content
pub mod browser_web_apps_commands; // 🌐 CUBE Web Apps - PWA management
pub mod browser_focus_mode_commands; // 🎯 CUBE Focus Mode - Distraction-free browsing
pub mod browser_smart_clipboard_commands; // 📋 CUBE Smart Clipboard - AI-enhanced clipboard
pub mod browser_tab_suspender_commands; // 💤 CUBE Tab Suspender - Memory optimization
pub mod browser_reading_mode_commands; // 📖 CUBE Reading Mode - Advanced reader
pub mod browser_workspace_profiles_commands; // 👤 CUBE Workspace Profiles - Context-based browsing
pub mod browser_web_annotations_commands; // ✏️ CUBE Web Annotations - Highlights & notes
pub mod browser_page_translator_commands; // 🌍 CUBE Page Translator - Multi-engine translation
pub mod browser_rss_reader_commands; // 📰 CUBE RSS Reader - Built-in feed reader
pub mod browser_site_permissions_commands; // 🔐 CUBE Site Permissions - Granular permissions
pub mod browser_password_generator_commands; // 🔑 CUBE Password Generator - Secure passwords
pub mod browser_web_scraper_commands; // 🕷️ CUBE Web Scraper - Data extraction
pub mod macro_system;
pub mod screen;
pub mod toolbar_tools; // NEW: FloatingToolbar backend commands
pub mod notes; // NEW: Notes & Tasks management
pub mod passwords_new; // NEW: Password Manager backend
pub mod collections; // NEW: Collections backend (hierarchical bookmarks)
// pub mod remote_system; // ⏸️ OLD: Placeholder version (replaced by v2)
pub mod ai_chat; // AI Chat System
pub mod ai_trainer; // AI Training System
pub mod automation; // NEW: Automation Studio (Zapier-like workflows)
pub mod workflow_commands; // 🚀 ELITE: Visual Workflow Builder (beats Zapier)
pub mod smart_selector; // 🚀 ELITE: AI-powered selector generation (beats all competitors)
pub mod collaboration; // 🚀 ELITE: Real-time collaboration (beats Zoom/AnyViewer)
pub mod extractor;
pub mod lendingpad; // LendingPad automation
pub mod lendingpad_auth; // LendingPad credential login (username/password)
pub mod ocr_system; // OCR functionality
pub mod p2p_commands; // NEW: P2P file sharing commands
// pub mod remote_system_v2; // ⏸️ DISABLED: Missing src/remote/* submodules (desktop, encryption, input, streaming)
pub mod screen_recording; // NEW: Cross-platform screen recording with ffmpeg
pub mod screenshot; // Screenshot capture & annotation // NEW: Data Extractor (Visual web scraping)
                                                       // pub mod autofill_system; // ⏸️ OLD: Placeholder version (replaced by v2)
pub mod autofill_commands; // ✅ NEW: Complete autofill command interface (32 commands)
pub mod autofill_system_v2; // ✅ Production-ready intelligent form filling
pub mod browser; // NEW: Browser tab management
pub mod browser_commands; // NEW: Headless Chrome automation
pub mod document_system; // ✅ Document processing module
pub mod webview_commands; // NEW: Tauri WebviewWindow rendering (replaces iframe)
pub mod embedded_webview; // NEW: Embedded webview for native browser tabs + DevTools
pub mod embedded_browser; // 🌐 EMBEDDED BROWSER: Tabbed webviews within main window
                          // pub mod browser_webview; // 🚧 EXPERIMENTAL: Native Chromium (needs Tauri 2.1+ stable APIs)
pub mod downloads; // NEW: Downloads management
pub mod export_import;
// pub mod password_manager; // ⏸️ OLD: Replaced by passwords_new with SQLite backend
pub mod reading_list; // NEW: Reading List (Chrome feature)
pub mod media; // NEW: Media Player backend
pub mod terminal; // NEW: Terminal Emulator backend
pub mod pty_commands; // NEW: PTY real command execution
pub mod session_persistence; // NEW: Session save/restore
pub mod vpn; // NEW: VPN Integration // NEW: Workspace export/import & backups

// Media & Communication - FASE 1
pub mod chat_commands; // NEW: Native chat system commands
pub mod devtools;
pub mod native_messaging; // NEW: Chrome Extension ↔ Tauri bridge
pub mod security_lab_commands; // NEW: Security Lab (OWASP ZAP + Nuclei + Exploit Shell)
pub mod video_conference_commands; // NEW: Enterprise multi-party video conferencing
pub mod voip; // NEW: WebRTC VoIP/Video calls // NEW: Browser DevTools integration

// Workspace Management - UI Modernization
pub mod layout_templates;
pub mod workspace; // NEW: Workspace/Tab/Panel management // NEW: Layout template management

// Enterprise Commands - Fortune 500 Level
pub mod ftp_commands; // NEW: Enterprise FTP/SFTP Client & Server
pub mod rdp_commands; // NEW: Native RDP Client
pub mod ssh_commands;
pub mod vpn_custom; // NEW: Custom VPN with 7 protocols
pub mod vpn_provider_commands; // NEW: VPN Freemium API commands // NEW: SSH Terminal with port forwarding
pub mod docker_commands; // NEW: Docker database management

// Security & Penetration Testing - Elite Level
pub mod exploit_commands;
pub mod vulnerability_commands; // NEW: Vulnerability scanner commands // NEW: AI exploit shell commands

// Video Analysis & AI Training
pub mod batch_processing;
pub mod export_dataset; // NEW: Export datasets to multiple formats
pub mod training_data; // NEW: Training data management commands
pub mod video_processing; // NEW: Video analysis for AI training // NEW: Batch video processing queue commands

// Chrome Extension Management - ELITE Level
pub mod chrome_extension_bridge;
pub mod extension_commands; // NEW: Chrome extension install/manage/update // NEW: Runtime/storage bridge for embedded extension

// Integration Commands - Phase 3
pub mod integration_commands; // NEW: WhatsApp, Monday.com, Planius.ia, File Detection, Auto-Profiles

// Database Commands - Phase 3
pub mod database; // NEW: SQLite database operations (settings, API keys, workflows, history)
pub mod data_sources; // NEW: Data sources management (databases, APIs, files, cloud)

// Advanced Automation - CUBE Nexum Competitive Edge
pub mod advanced_selector; // NEW: Smart selector builder with AI (beats Selenium IDE, Katalon)
pub mod data_export; // NEW: Multi-format export (JSON, CSV, Excel, XML, SQL)
pub mod workflow_canvas; // NEW: React Flow canvas backend (save/load/execute workflows)
// Scheduling & Monitoring
pub mod scheduler; // NEW: Cron-based workflow scheduler with queue management
pub mod monitoring; // NEW: Execution monitoring, logs, and alerts

// Integration & API
pub mod api_server; // NEW: REST API server for external workflow triggers
pub mod google_sheets; // NEW: Google Sheets OAuth2 integration with CRUD operations
pub mod integrations; // NEW: Slack/Discord webhook integrations

// Anti-Detection
pub mod stealth; // NEW: Fingerprint randomization, proxy rotation, CAPTCHA solving, rate limiting

// Updates & Cloud Sync - Enterprise Features
pub mod updates; // NEW: Application update system (auto/manual updates from admin server)
pub mod cloud_sync; // NEW: Cloud synchronization (settings, billing, devices, backups)

// Browser Proxy - Full Page Access (bypasses X-Frame-Options)
pub mod browser_proxy; // NEW: Local proxy server for unrestricted browsing

// Native Browser - Full WebviewWindow Browser (YouTube, Netflix, auth sites)
pub mod native_browser; // NEW: Native browser with full cookie/DRM support

// CUBE Web Engine - True Embedded Browser (No external windows)
pub mod cube_web_engine_commands; // NEW: Embedded browser with iframe rendering, CORS bypass, tab management

// Admin Panel - Real Backend
pub mod admin; // NEW: Admin panel backend (users, licenses, sales, downloads, analytics)

// CRM Module - Full Backend
pub mod crm; // NEW: CRM backend (contacts, companies, deals, activities, pipeline)

// Workspace Manager - Full Backend
pub mod workspace_manager; // NEW: Workspace management (layouts, tabs, panels, notes, tasks)

// Marketing Module - Full Backend
pub mod marketing; // NEW: Marketing campaigns, email, funnels, leads, A/B testing

// Email Service - Production-Ready (SMTP + SendGrid)
pub mod email; // NEW: Email sending service with dual provider support

// Contact Management - Full Backend
pub mod contacts; // NEW: Contact management (lists, segments, import/export, engagement)

// Social Media Module - Full Backend
pub mod social; // NEW: Social media management (accounts, posts, scheduling, analytics)

// Research Module - Full Backend
pub mod research; // NEW: Competitive intelligence, market research, reports

// Search Module - Full Backend
pub mod search; // NEW: AI-powered search engine (multi-engine, suggestions, history)

// Integration Layer - Cross-Module Communication Hub
pub mod integration_layer; // NEW: CRM ↔ Marketing ↔ Social ↔ Research ↔ Search ↔ Automation

// Enterprise Module - M5 Level (SSO, LDAP, Multi-tenant, White-label)
pub mod enterprise; // NEW: Organization, SSO (SAML/OIDC), LDAP sync
pub mod enterprise_part2; // NEW: Tenant, Role, License, Audit, WhiteLabel

// Analytics Module - M5 Level (Dashboards, Reports, Metrics, Alerts)
pub mod analytics; // NEW: Dashboard widgets, reports, metrics, alerts, exports

// Notifications Module - M5 Level (Multi-channel, Templates, Queue)
pub mod notifications; // NEW: In-app, Email, Push, SMS, Templates, Preferences

// CUBE Mail - Full Email Client (competes with Gmail, Outlook, ProtonMail, HEY)
pub mod cube_mail_commands; // NEW: IMAP/SMTP, E2E encryption, The Screener, AI categorization

// Admin Extended - Release Management, Affiliates, Helpdesk, File Manager
pub mod admin_releases; // NEW: Release/update management (versions, rollout, platforms)
pub mod admin_affiliates; // NEW: Affiliate program management (commissions, payouts, tracking)
pub mod admin_helpdesk; // NEW: Helpdesk/ticketing system (tickets, agents, SLA)
pub mod admin_files; // NEW: Admin file manager (storage, sharing, versions)

// Viral Growth System - World Record Strategy
pub mod gamification_commands; // NEW: XP, levels, achievements, streaks, challenges, leaderboards
pub mod referral_commands; // NEW: Multi-tier referrals, campaigns, rewards, sharing

// Password Manager Advanced - Full Backend
pub mod password_advanced; // NEW: CLI Access, Dark Web Monitor, SSH Keys, Passkeys, Family Vaults, Secure Send

// File Transfer Advanced - Full Backend
pub mod file_transfer_advanced; // NEW: P2P Sync, Bandwidth Control, Version History, LAN Transfer, Selective Sync

// Knowledge Module Advanced - Full Backend
pub mod knowledge_advanced; // NEW: Templates, AI Agents, Graph View, Web Clipper, Canvas

// CRM Module Advanced - Full Backend
pub mod crm_advanced; // NEW: Email Writer, Lead Scoring, Pipeline, AI Sales Assistant

// Remote Module Advanced - Full Backend
pub mod remote_advanced; // NEW: Privacy Mode, Whiteboard, Session Recording, Multi-Monitor

// Data Extractor Module Advanced - Full Backend
pub mod extractor_advanced; // NEW: MultiPage, Captcha, AI Detector, Self-Healing, Templates

// Enterprise Module Advanced - Full Backend
pub mod enterprise_advanced; // NEW: Pipeline Builder

// Investor System - Complete Backend
pub mod investor_commands; // NEW: Investor management, investments, smart contracts, CUBEX tokens, payouts

// CUBEX Token System - Complete Backend
pub mod token_commands; // NEW: Token balance, staking, rewards, purchases, governance

// Affiliate System - Multi-Level Commission Backend
pub mod affiliate_commands; // NEW: Affiliates, multi-level commissions, white-label, payouts

// SSO/LDAP Enterprise Authentication - Full Backend
pub mod sso_commands; // NEW: SAML, OIDC, LDAP sync, JIT provisioning, audit logging

// Multi-Tenant System - Full Backend
pub mod tenant_commands; // NEW: Tenants, roles, invitations, usage tracking, audit

// Enterprise Services Commands - Fortune 500 Level
pub mod enterprise_services_commands; // NEW: SSO, Multi-Tenant, Payment, Audit unified commands

// Browser Profiles - Full Backend
pub mod browser_profile_commands; // NEW: Browser profiles, sessions, cookies, storage, sync
// Automation Extended - Missing Commands (PDD, Process Models, Selectors, Templates)
pub mod automation_extended; // NEW: Recording control, templates, selectors, PDD management

// Proxy Pool & Anti-Ban - Enterprise Proxy Management
pub mod proxy_pool_commands; // NEW: Proxy pools, providers, sessions, anti-ban, rate limiting

// Security & Compliance - SOC Commands
pub mod security_compliance_commands; // NEW: Alerts, incidents, detection rules, playbooks, SIEM, compliance

// CUBE Web Engine - Production Browser (7 Phases Complete)
pub mod cube_engine_rendering; // Phase 1: Core rendering engine (WebGL, Canvas, CSS, Layout)
pub mod cube_engine_tab_management; // Phase 2: Advanced tab management (Hibernate, Groups, PiP, Sessions)
pub mod cube_engine_security; // Phase 3: Security & privacy (CSP, Certs, Tracker blocking, Fingerprint)
pub mod cube_engine_performance; // Phase 4: Performance optimization (Cache, Prefetch, Memory, Processes)
pub mod cube_engine_devtools; // Phase 5: DevTools complete (Network, Console, Elements, Profiler)
pub mod cube_engine_extensions; // Phase 6: Extensions support (Manifest, Content scripts, Storage)
pub mod cube_engine_media; // Phase 7: Media & download (Playback, Downloads, PDF, Print)

// Site Configuration - SuperAdmin Panel
pub mod site_config_commands; // NEW: Centralized site configuration (contact, branding, legal, investors, careers)

// AI Virtual Call Center - Compete with RingCentral, Aircall, Five9
pub mod call_center_commands; // NEW: AI-powered call center (voice, WhatsApp, SMS, chat, AI agents, analytics)

// SuperAdmin System - ABSOLUTE CONTROL (76 Commands Total)
pub mod superadmin_users; // NEW: User management (impersonate, suspend, bulk update, sessions)
pub mod superadmin_teams; // NEW: Teams & Roles management (permissions, quotas, metrics)
pub mod superadmin_security; // NEW: Security settings (MFA, SSO, DLP, IP whitelist, threat protection)
pub mod superadmin_audit; // NEW: Audit & Compliance (logs, GDPR, SOC2, legal holds, DSR)
pub mod superadmin_billing; // NEW: Billing & API (subscriptions, invoices, API keys, webhooks)
pub mod superadmin_system; // NEW: System monitoring (health, alerts, metrics, maintenance mode)