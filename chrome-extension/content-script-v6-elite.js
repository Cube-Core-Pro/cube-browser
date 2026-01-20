// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 CONTENT SCRIPT v7.1 ELITE - Advanced Orchestration Layer
// ═══════════════════════════════════════════════════════════════════════════════
//
// ELITE FEATURES:
// ✨ Advanced Context Awareness
// ✨ Intelligent Service Coordination
// ✨ Performance Monitoring & Auto-Optimization
// ✨ Enhanced Error Recovery
// ✨ Real-time Analytics & Telemetry
// ✨ Cross-tab Communication
// ✨ Enterprise Security Features
// ✨ Enterprise SSO Integration (v7.1)
// ✨ Smart Notification Triggers (v7.1)
// ✨ Advanced Analytics Events (v7.1)
//
// This elite layer provides advanced orchestration on top of content-script-v6.js
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  console.log('🏆 CUBE Nexum Connect v7.1 - Elite Orchestration Layer loading...');

  // ═══════════════════════════════════════════════════════════════════════════
  // ELITE STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  const ELITE_STATE = {
    version: '7.1.0',
    
    performance: {
      pageLoadTime: performance.now(),
      interactions: 0,
      apiCalls: 0,
      errors: 0,
      lastOptimization: Date.now()
    },
    
    context: {
      pageType: null,
      contentType: null,
      formDetected: false,
      tablesDetected: false,
      imagesDetected: false,
      videosDetected: false
    },
    
    analytics: {
      sessionStart: Date.now(),
      actionsPerformed: [],
      hotkeys: {},
      serviceUsage: {}
    },
    
    optimization: {
      autoOptimize: true,
      optimizationThreshold: 1000, // ms
      resourceMonitoring: true
    },
    
    security: {
      sandboxMode: false,
      rateLimiting: true,
      maxRequestsPerMinute: 60
    },
    
    // Enterprise integration (v7.1)
    enterprise: {
      initialized: false,
      organizationId: null,
      features: [],
      ssoProvider: null,
      branding: null,
      auditEnabled: false
    },
    
    // Notification integration (v7.1)
    notifications: {
      initialized: false,
      enabled: true,
      quietHoursActive: false,
      pendingCount: 0,
      lastNotification: null
    },
    
    // Analytics integration (v7.1)
    analyticsService: {
      initialized: false,
      consentGiven: false,
      sessionId: null,
      activeExperiments: [],
      featureUsage: {}
    }
  };

  const FLOATING_AI_STATE_KEY = 'cubeFloatingAssistantState';
  const FLOATING_AI_THEME_KEY = 'cubeEliteTheme';
  const FLOATING_AI_STREAM_DELAY = 30;
  const FLOATING_AI_REQUEST_TIMEOUT = 12000;

  class FloatingAssistant {
    constructor() {
      this.storageKey = FLOATING_AI_STATE_KEY;
      this.themeKey = FLOATING_AI_THEME_KEY;
      this.state = {
        open: false,
        position: null,
        theme: 'dark',
        attachments: {
          includeDom: true,
          includeMacros: false,
          includeContext: true
        }
      };
      this.host = null;
      this.shadow = null;
      this.launcher = null;
      this.panel = null;
      this.transcript = null;
      this.input = null;
      this.dragHandle = null;
      this.dragging = false;
      this.dragOffset = { x: 0, y: 0 };
      this.streaming = false;
      this.abortController = null;
      this.handlePointerMove = this.onPointerMove.bind(this);
      this.handlePointerUp = this.onPointerUp.bind(this);
      this.readyPromise = this.initialize();
      this.watchThemeChanges();
    }

    async initialize() {
      await this.restoreState();
      this.createHost();
      this.render();
      this.cacheElements();
      this.applyTheme(this.state.theme);
      this.bindEvents();
      this.updateContextBadges();
      if (this.state.open) {
        this.openPanel();
      } else {
        this.closePanel(false);
      }
      setInterval(() => this.updateContextBadges(), 8000);
      return this;
    }

    async restoreState() {
      if (!chrome?.storage?.local) {
        return;
      }

      try {
        const stored = await chrome.storage.local.get([this.storageKey, this.themeKey]);
        if (stored[this.storageKey]) {
          this.state = {
            ...this.state,
            ...stored[this.storageKey],
            attachments: {
              ...this.state.attachments,
              ...(stored[this.storageKey].attachments || {})
            }
          };
        }
        if (stored[this.themeKey]) {
          this.state.theme = stored[this.themeKey];
        }
      } catch (error) {
        console.warn('Floating assistant state unavailable:', error);
      }
    }

    createHost() {
      if (this.host) {
        return;
      }

      this.host = document.createElement('div');
      this.host.id = 'cube-floating-assistant';
      this.host.style.position = 'fixed';
      this.host.style.top = '0';
      this.host.style.left = '0';
      this.host.style.width = '0';
      this.host.style.height = '0';
      this.host.style.overflow = 'visible';
      this.host.style.pointerEvents = 'none';
      this.host.style.zIndex = '2147480000';
      document.documentElement.appendChild(this.host);
      this.shadow = this.host.attachShadow({ mode: 'open' });
    }

    render() {
      if (!this.shadow) {
        return;
      }

      this.shadow.innerHTML = `
        <style>
          :host {
            all: initial;
          }

          *, *::before, *::after {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }

          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.15); opacity: 0.4; }
            100% { transform: scale(1); opacity: 0.8; }
          }

          @keyframes gentle-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }

          .cube-launcher {
            position: fixed;
            right: 24px;
            bottom: 24px;
            width: 64px;
            height: 64px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.3);
            background: linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #8b5cf6 100%);
            box-shadow: 
              0 8px 24px rgba(124, 58, 237, 0.45),
              0 0 0 4px rgba(124, 58, 237, 0.15),
              inset 0 2px 4px rgba(255, 255, 255, 0.25);
            color: #fff;
            font-size: 28px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            animation: gentle-bounce 3s ease-in-out infinite;
          }

          .cube-launcher::before {
            content: '';
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.4), rgba(99, 102, 241, 0.3));
            animation: pulse-ring 2.5s ease-in-out infinite;
            z-index: -1;
          }

          .cube-launcher:hover {
            transform: scale(1.1);
            box-shadow: 
              0 12px 32px rgba(124, 58, 237, 0.55),
              0 0 0 6px rgba(124, 58, 237, 0.25),
              inset 0 2px 4px rgba(255, 255, 255, 0.3);
            animation: none;
          }

          .cube-launcher[data-open='true'] {
            transform: scale(1.05) rotate(5deg);
            box-shadow: 
              0 16px 40px rgba(124, 58, 237, 0.6),
              0 0 0 8px rgba(124, 58, 237, 0.2);
            animation: none;
          }

          .cube-launcher[data-open='true']::before {
            animation: none;
            opacity: 0;
          }

          .cube-launcher:focus-visible {
            outline: 3px solid rgba(255, 255, 255, 0.8);
            outline-offset: 6px;
          }

          .cube-launcher-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #10b981;
            color: white;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.9);
          }

          .cube-panel {
            position: fixed;
            width: min(400px, 92vw);
            max-height: min(600px, 85vh);
            background: linear-gradient(180deg, rgba(15, 15, 25, 0.98) 0%, rgba(10, 10, 18, 0.99) 100%);
            border: 1px solid rgba(124, 58, 237, 0.4);
            border-radius: 20px;
            padding: 20px;
            color: #f8fafc;
            display: flex;
            flex-direction: column;
            gap: 14px;
            backdrop-filter: blur(20px) saturate(180%);
            box-shadow: 
              0 24px 48px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(255, 255, 255, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            pointer-events: auto;
            bottom: 100px;
            right: 24px;
            opacity: 0;
            transform: translateY(16px) scale(0.95);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .cube-panel[data-open='true'] {
            opacity: 1;
            transform: translateY(0) scale(1);
          }

          .cube-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            cursor: move;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(124, 58, 237, 0.2);
          }

          .cube-panel-title {
            font-size: 18px;
            font-weight: 700;
            background: linear-gradient(135deg, #a78bfa, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .cube-panel-subtitle {
            font-size: 12px;
            color: #a5b4fc;
            margin-top: 2px;
          }

          .cube-panel-actions {
            display: inline-flex;
            gap: 8px;
          }

          .cube-icon-btn {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            border: 1px solid rgba(124, 58, 237, 0.3);
            background: rgba(124, 58, 237, 0.1);
            color: inherit;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .cube-icon-btn:hover {
            background: rgba(124, 58, 237, 0.25);
            border-color: rgba(124, 58, 237, 0.5);
            transform: translateY(-1px);
          }

          .cube-context-row {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .cube-context-chip {
            padding: 10px;
            border-radius: 12px;
            border: 1px solid rgba(124, 58, 237, 0.25);
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%);
            text-align: center;
            transition: all 0.2s ease;
          }

          .cube-context-chip:hover {
            border-color: rgba(124, 58, 237, 0.4);
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(99, 102, 241, 0.12) 100%);
          }

          .cube-chip-label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #a5b4fc;
            margin-bottom: 4px;
          }

          .cube-chip-value {
            font-size: 18px;
            font-weight: 700;
            color: #e0e7ff;
          }

          .cube-transcript {
            flex: 1;
            overflow-y: auto;
            border-radius: 14px;
            border: 1px solid rgba(124, 58, 237, 0.15);
            background: linear-gradient(180deg, rgba(5, 5, 12, 0.9) 0%, rgba(10, 10, 20, 0.85) 100%);
            padding: 14px;
            min-height: 180px;
          }

          .cube-transcript::-webkit-scrollbar {
            width: 6px;
          }

          .cube-transcript::-webkit-scrollbar-track {
            background: rgba(124, 58, 237, 0.05);
            border-radius: 3px;
          }

          .cube-transcript::-webkit-scrollbar-thumb {
            background: rgba(124, 58, 237, 0.3);
            border-radius: 3px;
          }

          .cube-transcript::-webkit-scrollbar-thumb:hover {
            background: rgba(124, 58, 237, 0.5);
          }

          .cube-message {
            display: flex;
            gap: 12px;
            margin-bottom: 14px;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .cube-message:last-child {
            margin-bottom: 0;
          }

          .cube-message-icon {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(99, 102, 241, 0.15));
            font-size: 16px;
            flex-shrink: 0;
          }

          .cube-message-body {
            flex: 1;
            min-width: 0;
          }

          .cube-message-role {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #a5b4fc;
            margin-bottom: 4px;
            font-weight: 600;
          }

          .cube-message-text {
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .cube-attachments {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .cube-attachment {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-radius: 20px;
            border: 1px solid rgba(124, 58, 237, 0.3);
            font-size: 12px;
            cursor: pointer;
            background: rgba(124, 58, 237, 0.08);
            transition: all 0.2s ease;
            user-select: none;
          }

          .cube-attachment:hover {
            background: rgba(124, 58, 237, 0.15);
            border-color: rgba(124, 58, 237, 0.5);
          }

          .cube-attachment:has(input:checked) {
            background: rgba(124, 58, 237, 0.2);
            border-color: rgba(124, 58, 237, 0.6);
          }

          .cube-attachment input {
            accent-color: #7c3aed;
            cursor: pointer;
          }

          .cube-input-row {
            display: flex;
            gap: 10px;
            align-items: flex-end;
          }

          .cube-textarea {
            flex: 1;
            min-height: 70px;
            resize: none;
            border-radius: 14px;
            border: 1px solid rgba(124, 58, 237, 0.25);
            background: rgba(5, 5, 15, 0.8);
            color: inherit;
            padding: 12px 14px;
            font-size: 13px;
            transition: all 0.2s ease;
          }

          .cube-textarea:focus {
            outline: none;
            border-color: rgba(124, 58, 237, 0.6);
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
            background: rgba(5, 5, 15, 0.95);
          }

          .cube-textarea::placeholder {
            color: #6b7280;
          }

          .cube-send-btn {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            border: none;
            background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
            color: #fff;
            font-size: 22px;
            cursor: pointer;
            box-shadow: 
              0 8px 20px rgba(124, 58, 237, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .cube-send-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 
              0 12px 28px rgba(124, 58, 237, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.25);
          }

          .cube-send-btn:active:not(:disabled) {
            transform: translateY(0);
          }

          .cube-send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .cube-quick-row {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .cube-quick-btn {
            border: 1px solid rgba(124, 58, 237, 0.25);
            border-radius: 12px;
            padding: 10px 8px;
            background: rgba(124, 58, 237, 0.06);
            color: #e0e7ff;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s ease;
            text-align: center;
          }

          .cube-quick-btn:hover {
            background: rgba(124, 58, 237, 0.15);
            border-color: rgba(124, 58, 237, 0.5);
            transform: translateY(-1px);
          }

          .cube-url-row {
            font-size: 11px;
            color: #6b7280;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 6px 10px;
            background: rgba(124, 58, 237, 0.05);
            border-radius: 8px;
          }

          @media (max-width: 600px) {
            .cube-launcher {
              right: 16px;
              bottom: 16px;
              width: 56px;
              height: 56px;
              font-size: 24px;
            }

            .cube-panel {
              right: 12px;
              left: 12px;
              width: auto;
              bottom: 88px;
            }
          }

          :host([data-theme='light']) .cube-panel {
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.99) 0%, rgba(248, 250, 252, 0.98) 100%);
            border-color: rgba(124, 58, 237, 0.25);
            color: #0f172a;
            box-shadow: 
              0 24px 48px rgba(15, 23, 42, 0.12),
              0 0 0 1px rgba(124, 58, 237, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
          }

          :host([data-theme='light']) .cube-panel-header {
            border-bottom-color: rgba(124, 58, 237, 0.15);
          }

          :host([data-theme='light']) .cube-panel-title {
            background: linear-gradient(135deg, #7c3aed, #6366f1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          :host([data-theme='light']) .cube-panel-subtitle {
            color: #6366f1;
          }

          :host([data-theme='light']) .cube-transcript {
            background: linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%);
            border-color: rgba(124, 58, 237, 0.15);
            color: #0f172a;
          }

          :host([data-theme='light']) .cube-message-role {
            color: #7c3aed;
          }

          :host([data-theme='light']) .cube-message-text {
            color: #1e293b;
          }

          :host([data-theme='light']) .cube-message-icon {
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(99, 102, 241, 0.1));
          }

          :host([data-theme='light']) .cube-context-chip {
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%);
            border-color: rgba(124, 58, 237, 0.2);
            color: #1e293b;
          }

          :host([data-theme='light']) .cube-chip-label {
            color: #7c3aed;
          }

          :host([data-theme='light']) .cube-chip-value {
            color: #3730a3;
          }

          :host([data-theme='light']) .cube-icon-btn {
            background: rgba(124, 58, 237, 0.08);
            border-color: rgba(124, 58, 237, 0.2);
            color: #4f46e5;
          }

          :host([data-theme='light']) .cube-icon-btn:hover {
            background: rgba(124, 58, 237, 0.15);
            border-color: rgba(124, 58, 237, 0.4);
          }

          :host([data-theme='light']) .cube-textarea {
            background: rgba(248, 250, 252, 0.95);
            border-color: rgba(124, 58, 237, 0.2);
            color: #0f172a;
          }

          :host([data-theme='light']) .cube-textarea:focus {
            border-color: rgba(124, 58, 237, 0.5);
            background: #fff;
          }

          :host([data-theme='light']) .cube-textarea::placeholder {
            color: #94a3b8;
          }

          :host([data-theme='light']) .cube-attachment {
            background: rgba(124, 58, 237, 0.08);
            border-color: rgba(124, 58, 237, 0.25);
            color: #4f46e5;
          }

          :host([data-theme='light']) .cube-attachment:hover {
            background: rgba(124, 58, 237, 0.12);
            border-color: rgba(124, 58, 237, 0.4);
          }

          :host([data-theme='light']) .cube-quick-btn {
            background: rgba(124, 58, 237, 0.06);
            border-color: rgba(124, 58, 237, 0.2);
            color: #4f46e5;
          }

          :host([data-theme='light']) .cube-quick-btn:hover {
            background: rgba(124, 58, 237, 0.12);
            border-color: rgba(124, 58, 237, 0.4);
          }

          :host([data-theme='light']) .cube-url-row {
            background: rgba(124, 58, 237, 0.05);
            color: #64748b;
          }

          :host([data-theme='light']) .cube-launcher {
            box-shadow: 
              0 8px 24px rgba(124, 58, 237, 0.3),
              0 0 0 4px rgba(124, 58, 237, 0.1),
              inset 0 2px 4px rgba(255, 255, 255, 0.3);
          }

          :host([data-theme='light']) .cube-launcher:hover {
            box-shadow: 
              0 12px 32px rgba(124, 58, 237, 0.4),
              0 0 0 6px rgba(124, 58, 237, 0.15),
              inset 0 2px 4px rgba(255, 255, 255, 0.35);
          }
        </style>
        <button id="cubeFloatingLauncher" class="cube-launcher" type="button" aria-label="Open CUBE AI Assistant">
          <span>✨</span>
          <span class="cube-launcher-badge">AI</span>
        </button>
        <section id="cubeFloatingPanel" class="cube-panel" role="dialog" aria-label="Floating AI Assistant" data-open="false">
          <header class="cube-panel-header" id="cubeFloatingDragHandle">
            <div>
              <div class="cube-panel-title">Floating Nexus</div>
              <div class="cube-panel-subtitle">Always-on automation assistant</div>
            </div>
            <div class="cube-panel-actions">
              <button id="cubeFloatingRefresh" class="cube-icon-btn" type="button" title="Refresh context">🔄</button>
              <button id="cubeFloatingClear" class="cube-icon-btn" type="button" title="Clear chat">🗑️</button>
              <button id="cubeFloatingClose" class="cube-icon-btn" type="button" title="Close assistant">✕</button>
            </div>
          </header>
          <div class="cube-url-row" id="cubeFloatingUrl"></div>
          <div class="cube-context-row">
            <div class="cube-context-chip">
              <span class="cube-chip-label">Forms</span>
              <span class="cube-chip-value" id="cubeContextForms">0</span>
            </div>
            <div class="cube-context-chip">
              <span class="cube-chip-label">Selectors</span>
              <span class="cube-chip-value" id="cubeContextSelectors">0</span>
            </div>
            <div class="cube-context-chip">
              <span class="cube-chip-label">Macros</span>
              <span class="cube-chip-value" id="cubeContextFloatingMacros">0</span>
            </div>
          </div>
          <div class="cube-attachments">
            <label class="cube-attachment">
              <input type="checkbox" id="cubeAttachDom" checked>
              <span>📄 DOM</span>
            </label>
            <label class="cube-attachment">
              <input type="checkbox" id="cubeAttachMacros">
              <span>🎬 Macro</span>
            </label>
            <label class="cube-attachment">
              <input type="checkbox" id="cubeAttachContext" checked>
              <span>🧩 Context</span>
            </label>
          </div>
          <div class="cube-transcript" id="cubeFloatingTranscript" role="log" aria-live="polite">
            <div class="cube-message">
              <div class="cube-message-icon">🤖</div>
              <div class="cube-message-body">
                <div class="cube-message-role">Assistant</div>
                <div class="cube-message-text">Hello! I'm ready to help you automate anything on this page. Ask for workflows, selectors, macros, or insights.</div>
              </div>
            </div>
          </div>
          <div class="cube-input-row">
            <textarea id="cubeFloatingInput" class="cube-textarea" placeholder="Ask Nexus to automate this page..." rows="2"></textarea>
            <button id="cubeFloatingSend" class="cube-send-btn" type="button" aria-label="Send message">➤</button>
          </div>
          <div class="cube-quick-row">
            <button class="cube-quick-btn" data-prompt="workflow" type="button">✨ Workflow</button>
            <button class="cube-quick-btn" data-prompt="selectors" type="button">🎯 Selector Fix</button>
            <button class="cube-quick-btn" data-prompt="schema" type="button">📋 Schema</button>
          </div>
        </section>
      `;
    }

    cacheElements() {
      if (!this.shadow) {
        return;
      }

      this.launcher = this.shadow.getElementById('cubeFloatingLauncher');
      this.panel = this.shadow.getElementById('cubeFloatingPanel');
      this.transcript = this.shadow.getElementById('cubeFloatingTranscript');
      this.input = this.shadow.getElementById('cubeFloatingInput');
      this.dragHandle = this.shadow.getElementById('cubeFloatingDragHandle');
      this.attachDom = this.shadow.getElementById('cubeAttachDom');
      this.attachMacros = this.shadow.getElementById('cubeAttachMacros');
      this.attachContext = this.shadow.getElementById('cubeAttachContext');
      this.formsValue = this.shadow.getElementById('cubeContextForms');
      this.selectorsValue = this.shadow.getElementById('cubeContextSelectors');
      this.macrosValue = this.shadow.getElementById('cubeContextFloatingMacros');
      this.urlValue = this.shadow.getElementById('cubeFloatingUrl');
      this.sendButton = this.shadow.getElementById('cubeFloatingSend');

      if (this.urlValue) {
        this.urlValue.textContent = this.truncateUrl(window.location.href);
      }
    }

    watchThemeChanges() {
      if (!chrome?.storage?.onChanged) {
        return;
      }

      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local' || !changes[this.themeKey]) {
          return;
        }
        const nextTheme = changes[this.themeKey].newValue || 'dark';
        this.state.theme = nextTheme;
        this.applyTheme(nextTheme);
      });
    }

    applyTheme(theme) {
      if (this.host) {
        this.host.setAttribute('data-theme', theme);
      }
    }

    bindEvents() {
      this.launcher?.addEventListener('click', () => this.togglePanel());
      this.shadow.getElementById('cubeFloatingClose')?.addEventListener('click', () => this.closePanel());
      this.shadow.getElementById('cubeFloatingClear')?.addEventListener('click', () => this.clearTranscript());
      this.shadow.getElementById('cubeFloatingRefresh')?.addEventListener('click', () => {
        this.updateContextBadges(true);
        this.appendSystemMessage('Context refreshed.');
      });

      this.sendButton?.addEventListener('click', () => this.sendMessage());

      this.input?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          this.sendMessage();
        }
      });

      this.shadow.querySelectorAll('.cube-quick-btn').forEach((button) => {
        button.addEventListener('click', () => {
          const promptType = button.getAttribute('data-prompt');
          this.applyQuickPrompt(promptType);
        });
      });

      this.attachDom?.addEventListener('change', (event) => {
        this.state.attachments.includeDom = event.target.checked;
        this.persistState();
      });
      this.attachMacros?.addEventListener('change', (event) => {
        this.state.attachments.includeMacros = event.target.checked;
        this.persistState();
      });
      this.attachContext?.addEventListener('change', (event) => {
        this.state.attachments.includeContext = event.target.checked;
        this.persistState();
      });

      if (this.dragHandle) {
        this.dragHandle.addEventListener('mousedown', (event) => this.onPointerDown(event));
        this.dragHandle.addEventListener('touchstart', (event) => this.onPointerDown(event));
      }

      if (this.state.attachments) {
        if (this.attachDom) this.attachDom.checked = this.state.attachments.includeDom;
        if (this.attachMacros) this.attachMacros.checked = this.state.attachments.includeMacros;
        if (this.attachContext) this.attachContext.checked = this.state.attachments.includeContext;
      }
    }

    togglePanel(prompt) {
      if (this.state.open) {
        this.closePanel();
      } else {
        this.openPanel(prompt);
      }
      return this.state.open;
    }

    openPanel(prompt) {
      this.state.open = true;
      this.panel?.setAttribute('data-open', 'true');
      this.launcher?.setAttribute('data-open', 'true');
      this.host?.setAttribute('aria-hidden', 'false');
      this.updatePanelPosition();
      if (prompt && this.input) {
        this.input.value = prompt;
      }
      this.focusInput();
      this.persistState();
    }

    closePanel(persist = true) {
      this.state.open = false;
      this.panel?.setAttribute('data-open', 'false');
      this.launcher?.setAttribute('data-open', 'false');
      if (persist) {
        this.persistState();
      }
    }

    focusInput() {
      requestAnimationFrame(() => {
        this.input?.focus();
      });
    }

    clearTranscript() {
      if (!this.transcript) {
        return;
      }

      this.transcript.innerHTML = `
        <div class="cube-message">
          <div class="cube-message-icon">🤖</div>
          <div class="cube-message-body">
            <div class="cube-message-role">Assistant</div>
            <div class="cube-message-text">Chat cleared. How can I assist you now?</div>
          </div>
        </div>
      `;
    }

    applyQuickPrompt(type) {
      if (!this.input) {
        return;
      }

      const prompts = {
        workflow: 'Design an automation workflow for the current page, including form parsing and submission steps.',
        selectors: 'Audit the DOM of this page and suggest reliable selectors for the primary form fields.',
        schema: 'Generate a JSON schema for the detected forms including validation rules and field metadata.'
      };

      this.input.value = prompts[type] || '';
      this.focusInput();
    }

    appendMessage(role, text) {
      if (!this.transcript) {
        return null;
      }

      const message = document.createElement('div');
      message.className = 'cube-message';
      const icon = role === 'user' ? '👤' : role === 'system' ? 'ℹ️' : '🤖';
      const label = role === 'user' ? 'You' : role === 'system' ? 'System' : 'Assistant';

      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'cube-message-icon';
      iconWrapper.textContent = icon;

      const body = document.createElement('div');
      body.className = 'cube-message-body';

      const roleEl = document.createElement('div');
      roleEl.className = 'cube-message-role';
      roleEl.textContent = label;

      const textEl = document.createElement('div');
      textEl.className = 'cube-message-text';
      textEl.textContent = text;

      body.appendChild(roleEl);
      body.appendChild(textEl);
      message.appendChild(iconWrapper);
      message.appendChild(body);

      this.transcript.appendChild(message);
      this.transcript.scrollTop = this.transcript.scrollHeight;
      return message;
    }

    appendSystemMessage(text) {
      this.appendMessage('system', text);
    }

    async sendMessage() {
      if (!this.input || this.streaming) {
        return;
      }

      const value = this.input.value.trim();
      if (!value) {
        return;
      }

      this.input.value = '';
      this.appendMessage('user', value);
      this.streaming = true;
      if (this.sendButton) {
        this.sendButton.disabled = true;
      }
      this.abortController = new AbortController();

      try {
        const response = await this.requestAIResponse(value);
        await this.streamAssistantResponse(response);
      } catch (error) {
        console.warn('Floating assistant using mock reply:', error);
        const fallback = this.generateMockResponse(value);
        await this.streamAssistantResponse(fallback);
      } finally {
        this.streaming = false;
        this.abortController = null;
        if (this.sendButton) {
          this.sendButton.disabled = false;
        }
      }
    }

    async requestAIResponse(message) {
      const payload = {
        type: 'AI_NEXUS_REQUEST',
        source: 'floating-assistant',
        message,
        context: this.buildContext(),
        attachments: this.state.attachments
      };

      if (!chrome?.runtime?.sendMessage) {
        throw new Error('Runtime messaging unavailable');
      }

      const result = await Promise.race([
        chrome.runtime.sendMessage(payload),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI request timed out')), FLOATING_AI_REQUEST_TIMEOUT))
      ]);

      if (result?.success && result.reply) {
        return result.reply;
      }

      if (result?.reply) {
        return result.reply;
      }

      throw new Error(result?.error || 'AI provider did not respond');
    }

    async streamAssistantResponse(text) {
      const message = this.appendMessage('assistant', '');
      const textContainer = message?.querySelector('.cube-message-text');
      if (!textContainer) {
        return;
      }

      const parts = text.split(' ');
      let buffer = '';

      for (const part of parts) {
        buffer += (buffer ? ' ' : '') + part;
        textContainer.textContent = buffer;
        await new Promise((resolve) => setTimeout(resolve, FLOATING_AI_STREAM_DELAY));
      }
    }

    buildContext() {
      const forms = ELITE_STATE?.context?.formFields?.count || 0;
      const selectors = ELITE_STATE?.context?.automationOpportunities?.length || 0;
      const macros = ELITE_STATE?.analytics?.actionsPerformed?.filter(event => event.action === 'macro').length || 0;

      return {
        url: window.location.href,
        forms,
        selectors,
        macros,
        pageType: ELITE_STATE?.context?.pageType || 'unknown'
      };
    }

    updateContextBadges(refreshUrl = false) {
      const forms = ELITE_STATE?.context?.formFields?.count || 0;
      const selectors = ELITE_STATE?.context?.automationOpportunities?.length || 0;
      const macros = ELITE_STATE?.analytics?.actionsPerformed?.filter(event => event.action === 'macro').length || 0;

      if (this.formsValue) this.formsValue.textContent = String(forms);
      if (this.selectorsValue) this.selectorsValue.textContent = selectors > 0 ? String(selectors) : '—';
      if (this.macrosValue) this.macrosValue.textContent = macros > 0 ? String(macros) : '0';
      if (refreshUrl && this.urlValue) this.urlValue.textContent = this.truncateUrl(window.location.href);
    }

    truncateUrl(url) {
      if (!url) return '';
      return url.length > 60 ? `${url.slice(0, 57)}...` : url;
    }

    async persistState() {
      if (!chrome?.storage?.local) {
        return;
      }

      try {
        await chrome.storage.local.set({
          [this.storageKey]: {
            open: this.state.open,
            position: this.state.position,
            attachments: this.state.attachments
          }
        });
      } catch (error) {
        console.warn('Failed to persist floating assistant state:', error);
      }
    }

    onPointerDown(event) {
      if (!this.panel) {
        return;
      }
      event.preventDefault();
      this.dragging = true;
      const rect = this.panel.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      this.dragOffset.x = clientX - rect.left;
      this.dragOffset.y = clientY - rect.top;
      document.addEventListener('mousemove', this.handlePointerMove);
      document.addEventListener('touchmove', this.handlePointerMove, { passive: false });
      document.addEventListener('mouseup', this.handlePointerUp);
      document.addEventListener('touchend', this.handlePointerUp);
    }

    onPointerMove(event) {
      if (!this.dragging) {
        return;
      }

      event.preventDefault();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;

      let left = clientX - this.dragOffset.x;
      let top = clientY - this.dragOffset.y;

      left = Math.max(16, Math.min(left, window.innerWidth - this.panel.offsetWidth - 16));
      top = Math.max(16, Math.min(top, window.innerHeight - this.panel.offsetHeight - 16));

      this.panel.style.left = `${left}px`;
      this.panel.style.top = `${top}px`;
      this.panel.style.right = 'auto';
      this.panel.style.bottom = 'auto';

      this.state.position = { left, top };
    }

    onPointerUp() {
      this.dragging = false;
      document.removeEventListener('mousemove', this.handlePointerMove);
      document.removeEventListener('touchmove', this.handlePointerMove);
      document.removeEventListener('mouseup', this.handlePointerUp);
      document.removeEventListener('touchend', this.handlePointerUp);
      this.persistState();
    }

    updatePanelPosition() {
      if (!this.panel) {
        return;
      }

      if (this.state.position && typeof this.state.position.left === 'number') {
        this.panel.style.left = `${this.state.position.left}px`;
        this.panel.style.top = `${this.state.position.top || 80}px`;
        this.panel.style.right = 'auto';
        this.panel.style.bottom = 'auto';
      } else {
        this.panel.style.left = 'auto';
        this.panel.style.top = 'auto';
        this.panel.style.right = '24px';
        this.panel.style.bottom = '96px';
      }
    }

    handleCommand(command, payload = {}) {
      switch (command) {
        case 'toggle':
          return { open: this.togglePanel(payload.prompt) };
        case 'open':
          this.openPanel(payload.prompt);
          return { open: true };
        case 'close':
          this.closePanel();
          return { open: false };
        case 'prompt':
          this.openPanel(payload.prompt);
          if (payload.prompt && this.input) {
            this.input.value = payload.prompt;
          }
          return { open: true };
        case 'status':
        default:
          return { open: this.state.open };
      }
    }

    generateMockResponse(message) {
      const normalized = message.toLowerCase();
      if (normalized.includes('workflow')) {
        return 'Here is a quick workflow outline: 1) Scan forms and capture metadata, 2) Map selectors with fallback strategies, 3) Record macro steps, 4) Validate and export. Let me know if you want me to expand any step.';
      }
      if (normalized.includes('selector')) {
        return 'Use data attributes or aria-labels for resilient selectors. Prefer `.form-container input[name="email"]` over positional selectors, and add fallback queries for dynamic components.';
      }
      if (normalized.includes('schema')) {
        return 'A schema example: { "form": "contact", "fields": [{ "name": "fullName", "type": "text", "required": true }] }. I can list every field with validation rules if needed.';
      }
      return 'Here is what I can do right now: generate workflows, optimize selectors, summarize DOM context, or draft macros. Tell me which direction you want to explore and I will take it from there.';
    }
  }

  let floatingAssistantInstance = null;

  function ensureFloatingAssistant() {
    if (!floatingAssistantInstance) {
      floatingAssistantInstance = new FloatingAssistant();
      window.CubeFloatingAssistant = floatingAssistantInstance;
    }
    return floatingAssistantInstance.readyPromise.then(() => floatingAssistantInstance);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT ANALYZER - Advanced page intelligence
  // ═══════════════════════════════════════════════════════════════════════════

  class ContextAnalyzer {
    constructor() {
      this.cache = new Map();
      this.observers = [];
    }

    /**
     * Analyze page context for intelligent service activation
     */
    analyze() {
      const context = {
        pageType: this.detectPageType(),
        contentType: this.detectContentType(),
        formFields: this.analyzeFormFields(),
        dataExtractable: this.analyzeExtractableData(),
        automationOpportunities: this.detectAutomationOpportunities(),
        aiCapabilities: this.detectAICapabilities()
      };

      ELITE_STATE.context = { ...ELITE_STATE.context, ...context };
      
      console.log('📊 Context Analysis:', context);
      return context;
    }

    detectPageType() {
      const url = window.location.href;
      const title = document.title.toLowerCase();
      
      // E-commerce detection
      if (url.includes('cart') || url.includes('checkout') || 
          document.querySelector('[class*="cart"], [id*="cart"]')) {
        return 'ecommerce';
      }
      
      // Form-heavy page
      if (document.querySelectorAll('form').length > 2) {
        return 'form-intensive';
      }
      
      // Data table page
      if (document.querySelectorAll('table').length > 3) {
        return 'data-table';
      }
      
      // Dashboard
      if (title.includes('dashboard') || url.includes('dashboard')) {
        return 'dashboard';
      }
      
      // Admin panel
      if (title.includes('admin') || url.includes('admin')) {
        return 'admin-panel';
      }
      
      // Social media
      if (url.includes('facebook.com') || url.includes('twitter.com') || 
          url.includes('linkedin.com') || url.includes('instagram.com')) {
        return 'social-media';
      }
      
      return 'general';
    }

    detectContentType() {
      const types = [];
      
      if (document.querySelectorAll('form').length > 0) types.push('forms');
      if (document.querySelectorAll('table').length > 0) types.push('tables');
      if (document.querySelectorAll('img').length > 10) types.push('image-heavy');
      if (document.querySelectorAll('video').length > 0) types.push('video');
      if (document.querySelectorAll('canvas').length > 0) types.push('canvas');
      if (document.querySelectorAll('[contenteditable]').length > 0) types.push('editable');
      
      return types;
    }

    analyzeFormFields() {
      const forms = document.querySelectorAll('form');
      const analysis = {
        count: forms.length,
        fields: 0,
        types: new Set(),
        autofillable: false
      };

      forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        analysis.fields += inputs.length;
        
        inputs.forEach(input => {
          analysis.types.add(input.type || input.tagName.toLowerCase());
          
          // Check if autofillable
          if (input.name || input.id || input.autocomplete) {
            analysis.autofillable = true;
          }
        });
      });

      return analysis;
    }

    analyzeExtractableData() {
      const extractable = {
        tables: false,
        lists: false,
        articles: false,
        products: false,
        contacts: false
      };

      // Tables
      if (document.querySelectorAll('table').length > 0) {
        extractable.tables = true;
      }

      // Lists (ul, ol)
      if (document.querySelectorAll('ul, ol').length > 3) {
        extractable.lists = true;
      }

      // Articles
      if (document.querySelectorAll('article, [role="article"]').length > 0) {
        extractable.articles = true;
      }

      // Products (common e-commerce selectors)
      if (document.querySelectorAll('[class*="product"], [class*="item"]').length > 5) {
        extractable.products = true;
      }

      // Contacts
      if (document.body.textContent.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi)) {
        extractable.contacts = true;
      }

      return extractable;
    }

    detectAutomationOpportunities() {
      const opportunities = [];

      // Repetitive forms
      if (document.querySelectorAll('form').length > 1) {
        opportunities.push({
          type: 'form-filling',
          priority: 'high',
          description: 'Multiple forms detected - autofill can save time'
        });
      }

      // Data entry fields
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
      if (inputs.length > 10) {
        opportunities.push({
          type: 'data-entry',
          priority: 'medium',
          description: `${inputs.length} input fields - macro recording recommended`
        });
      }

      // Pagination
      if (document.querySelector('[class*="pagination"], [class*="next"], [class*="prev"]')) {
        opportunities.push({
          type: 'pagination',
          priority: 'medium',
          description: 'Pagination detected - batch processing available'
        });
      }

      // Search functionality
      if (document.querySelector('input[type="search"], [role="search"]')) {
        opportunities.push({
          type: 'search',
          priority: 'low',
          description: 'Search functionality - automation possible'
        });
      }

      return opportunities;
    }

    detectAICapabilities() {
      const capabilities = {
        documentProcessing: false,
        imageAnalysis: false,
        textGeneration: false,
        translation: false,
        summarization: false
      };

      // Check for documents
      if (document.querySelector('iframe[src$=".pdf"]') || 
          window.location.href.includes('.pdf')) {
        capabilities.documentProcessing = true;
      }

      // Check for images
      if (document.querySelectorAll('img').length > 5) {
        capabilities.imageAnalysis = true;
      }

      // Check for text content
      const textContent = document.body.textContent.trim();
      if (textContent.length > 1000) {
        capabilities.summarization = true;
      }

      // Check for multi-language
      if (document.querySelector('[lang]:not([lang="en"])')) {
        capabilities.translation = true;
      }

      return capabilities;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE MONITOR - Real-time optimization
  // ═══════════════════════════════════════════════════════════════════════════

  class PerformanceMonitor {
    constructor() {
      this.metrics = {
        fps: [],
        memory: [],
        apiLatency: [],
        domOperations: []
      };
      this.monitoring = false;
    }

    start() {
      if (this.monitoring) return;
      
      this.monitoring = true;
      console.log('📈 Performance monitoring started (optimized mode)');

      // FPS monitoring - less aggressive
      this.monitorFPS();

      // Memory monitoring (if available) - reduced frequency
      if (performance.memory) {
        this.monitorMemory();
      }

      // Long task monitoring - throttled logging
      this.monitorLongTasks();
    }

    monitorFPS() {
      let lastTime = performance.now();
      let frames = 0;
      let logThrottle = 0;

      const measureFPS = () => {
        if (!this.monitoring) return;

        frames++;
        const currentTime = performance.now();

        if (currentTime >= lastTime + 1000) {
          const fps = Math.round((frames * 1000) / (currentTime - lastTime));
          this.metrics.fps.push(fps);
          
          // Keep only last 60 samples
          if (this.metrics.fps.length > 60) {
            this.metrics.fps.shift();
          }

          // Only log FPS warnings every 10 seconds, and only if critically low
          logThrottle++;
          if (fps < 20 && logThrottle >= 10) {
            console.warn('⚠️ Low FPS detected:', fps);
            this.optimizePerformance();
            logThrottle = 0;
          }

          frames = 0;
          lastTime = currentTime;
        }

        requestAnimationFrame(measureFPS);
      };

      requestAnimationFrame(measureFPS);
    }

    monitorMemory() {
      setInterval(() => {
        if (!this.monitoring) return;

        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        
        this.metrics.memory.push({ used: usedMB, total: totalMB });

        // Keep only last 60 samples
        if (this.metrics.memory.length > 60) {
          this.metrics.memory.shift();
        }

        // Only log if memory usage is critically high (> 800MB)
        if (usedMB > 800) {
          console.warn('⚠️ High memory usage:', usedMB, 'MB');
          this.optimizeMemory();
        }
      }, 30000); // Check every 30 seconds instead of 5
    }

    monitorLongTasks() {
      if (!window.PerformanceObserver) return;

      try {
        let taskCount = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Only log tasks longer than 200ms and throttle logging
            if (entry.duration > 200) {
              taskCount++;
              if (taskCount % 10 === 0) { // Log every 10th long task
                console.warn('⚠️ Long task detected:', entry.duration.toFixed(2), 'ms');
              }
            }
          }
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task monitoring not supported - silent fail
      }
    }

    optimizePerformance() {
      console.log('🔧 Auto-optimizing performance...');

      // Reduce animation complexity
      document.querySelectorAll('*').forEach(el => {
        const computed = window.getComputedStyle(el);
        if (computed.willChange !== 'auto') {
          el.style.willChange = 'auto';
        }
      });

      // Throttle observers
      // Implementation depends on specific observers

      ELITE_STATE.performance.lastOptimization = Date.now();
    }

    optimizeMemory() {
      console.log('🧹 Cleaning up memory...');

      // Clear old cache entries
      if (window.caches) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('old') || name.includes('temp')) {
              caches.delete(name);
            }
          });
        });
      }

      // Force garbage collection (if available - dev tools only)
      if (window.gc) {
        window.gc();
      }
    }

    getReport() {
      const avgFPS = this.metrics.fps.length > 0 
        ? Math.round(this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length)
        : 0;

      const lastMemory = this.metrics.memory[this.metrics.memory.length - 1] || { used: 0, total: 0 };

      return {
        averageFPS: avgFPS,
        currentMemory: lastMemory,
        interactions: ELITE_STATE.performance.interactions,
        apiCalls: ELITE_STATE.performance.apiCalls,
        errors: ELITE_STATE.performance.errors,
        uptime: Date.now() - ELITE_STATE.analytics.sessionStart
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS TRACKER - Usage patterns and insights
  // ═══════════════════════════════════════════════════════════════════════════

  class AnalyticsTracker {
    constructor() {
      this.events = [];
      this.maxEvents = 1000;
    }

    trackAction(action, details = {}) {
      const event = {
        timestamp: Date.now(),
        action: action,
        details: details,
        url: window.location.href,
        pageTitle: document.title
      };

      this.events.push(event);
      ELITE_STATE.analytics.actionsPerformed.push(event);

      // Keep events within limit
      if (this.events.length > this.maxEvents) {
        this.events.shift();
      }

      // Track service usage
      if (details.service) {
        ELITE_STATE.analytics.serviceUsage[details.service] = 
          (ELITE_STATE.analytics.serviceUsage[details.service] || 0) + 1;
      }

      console.log('📊 Action tracked:', action, details);
    }

    trackHotkey(key, action) {
      if (!ELITE_STATE.analytics.hotkeys[key]) {
        ELITE_STATE.analytics.hotkeys[key] = 0;
      }
      ELITE_STATE.analytics.hotkeys[key]++;

      this.trackAction('hotkey', { key, action });
    }

    getUsageReport() {
      const sessionDuration = Date.now() - ELITE_STATE.analytics.sessionStart;
      
      return {
        sessionDuration: Math.round(sessionDuration / 1000), // seconds
        totalActions: this.events.length,
        serviceUsage: ELITE_STATE.analytics.serviceUsage,
        mostUsedHotkeys: this.getMostUsedHotkeys(),
        actionsPerMinute: Math.round((this.events.length / sessionDuration) * 60000)
      };
    }

    getMostUsedHotkeys() {
      return Object.entries(ELITE_STATE.analytics.hotkeys)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, count]) => ({ key, count }));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ELITE COORDINATOR - Main orchestration
  // ═══════════════════════════════════════════════════════════════════════════

  class EliteCoordinator {
    constructor() {
      this.contextAnalyzer = new ContextAnalyzer();
      this.performanceMonitor = new PerformanceMonitor();
      this.analyticsTracker = new AnalyticsTracker();
      
      // New v7.1 integrations
      this.enterpriseIntegration = new EnterpriseIntegration();
      this.notificationIntegration = new NotificationIntegration();
      this.analyticsIntegration = new AnalyticsIntegration();
      
      this.initialized = false;
    }

    async initialize() {
      if (this.initialized) return;

      console.log('🏆 Initializing Elite Coordinator v7.1...');

      try {
        // Analyze page context
        const context = this.contextAnalyzer.analyze();

        // Start performance monitoring
        if (ELITE_STATE.optimization.resourceMonitoring) {
          this.performanceMonitor.start();
        }

        // Initialize v7.1 integrations in parallel
        await Promise.allSettled([
          this.enterpriseIntegration.initialize(),
          this.notificationIntegration.initialize(),
          this.analyticsIntegration.initialize()
        ]);

        // Setup cross-tab communication
        this.setupCrossTabCommunication();

        // Setup advanced error handling
        this.setupErrorHandling();

        // Setup intelligent service suggestions
        this.setupServiceSuggestions(context);

        // Setup message handlers for v7.1 features
        this.setupMessageHandlers();

        this.initialized = true;
        console.log('✅ Elite Coordinator v7.1 initialized');

        // Send telemetry
        this.sendTelemetry({
          event: 'elite_initialized',
          context: context,
          enterprise: ELITE_STATE.enterprise.initialized,
          notifications: ELITE_STATE.notifications.initialized,
          analytics: ELITE_STATE.analyticsService.initialized
        });

        // Track feature usage
        this.analyticsIntegration.trackFeatureUsage('elite_coordinator');

      } catch (error) {
        console.error('❌ Elite Coordinator initialization failed:', error);
        this.handleError(error);
      }
    }

    setupMessageHandlers() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // Handle automation events for notifications
        if (message.type === 'AUTOMATION_STARTED') {
          this.notificationIntegration.notifyAutomationStart(
            message.name,
            message.details
          );
          this.analyticsIntegration.trackEvent('AUTOMATION_STARTED', {
            name: message.name,
            ...message.details
          });
          this.enterpriseIntegration.logAuditEvent('AUTOMATION_STARTED', {
            name: message.name,
            ...message.details
          });
          sendResponse({ received: true });
          return true;
        }

        if (message.type === 'AUTOMATION_COMPLETED') {
          this.notificationIntegration.notifyAutomationComplete(
            message.name,
            message.result
          );
          this.analyticsIntegration.trackAutomation(message.name, message.result);
          this.enterpriseIntegration.logAuditEvent('AUTOMATION_COMPLETED', {
            name: message.name,
            ...message.result
          });
          sendResponse({ received: true });
          return true;
        }

        if (message.type === 'DOCUMENT_PROCESSED') {
          this.notificationIntegration.notifyDocumentProcessed(
            message.documentType,
            message.details
          );
          this.analyticsIntegration.trackEvent('DOCUMENT_PROCESSED', {
            type: message.documentType,
            ...message.details
          });
          this.enterpriseIntegration.logAuditEvent('DOCUMENT_PROCESSED', {
            type: message.documentType,
            ...message.details
          });
          sendResponse({ received: true });
          return true;
        }

        if (message.type === 'AUTOFILL_EXECUTED') {
          this.analyticsIntegration.trackFeatureUsage('autofill');
          this.analyticsIntegration.trackEvent('AUTOFILL_EXECUTED', {
            fieldsFilled: message.fieldCount,
            formId: message.formId,
            ...message.details
          });
          this.enterpriseIntegration.logAuditEvent('AUTOFILL_EXECUTED', {
            fieldsFilled: message.fieldCount,
            formId: message.formId
          });
          sendResponse({ received: true });
          return true;
        }

        if (message.type === 'MACRO_RECORDED') {
          this.analyticsIntegration.trackFeatureUsage('macro_recorder');
          this.analyticsIntegration.trackEvent('MACRO_RECORDED', {
            stepCount: message.stepCount,
            macroName: message.name,
            ...message.details
          });
          this.enterpriseIntegration.logAuditEvent('MACRO_RECORDED', {
            stepCount: message.stepCount,
            macroName: message.name
          });
          sendResponse({ received: true });
          return true;
        }

        if (message.type === 'AI_REQUEST_MADE') {
          this.analyticsIntegration.trackFeatureUsage('ai_assistant');
          this.analyticsIntegration.trackEvent('AI_REQUEST', {
            provider: message.provider,
            requestType: message.requestType,
            ...message.details
          });
          sendResponse({ received: true });
          return true;
        }

        if (message.type === 'GET_ELITE_STATUS') {
          sendResponse({
            success: true,
            status: this.getStatus()
          });
          return true;
        }

        if (message.type === 'GET_ENTERPRISE_CONTEXT') {
          sendResponse({
            success: true,
            context: this.enterpriseIntegration.getContext()
          });
          return true;
        }

        if (message.type === 'GET_ANALYTICS_METRICS') {
          sendResponse({
            success: true,
            metrics: this.analyticsIntegration.getMetrics()
          });
          return true;
        }

        if (message.type === 'CHECK_FEATURE_FLAG') {
          const enabled = this.enterpriseIntegration.isFeatureEnabled(message.feature);
          sendResponse({ success: true, enabled });
          return true;
        }

        return false;
      });
    }

    setupCrossTabCommunication() {
      // Broadcast channel for cross-tab sync
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('cube-elite-sync');
        
        channel.onmessage = (event) => {
          console.log('📡 Cross-tab message:', event.data);
          this.handleCrossTabMessage(event.data);
        };

        window.cubeEliteChannel = channel;
      }
    }

    handleCrossTabMessage(data) {
      switch (data.type) {
        case 'macro-recorded':
          console.log('📹 Macro recorded in another tab:', data.macro);
          break;
        
        case 'profile-updated':
          console.log('👤 Profile updated in another tab');
          break;
        
        case 'settings-changed':
          console.log('⚙️ Settings changed in another tab');
          break;
      }
    }

    setupErrorHandling() {
      // Advanced error recovery
      window.addEventListener('error', (event) => {
        this.handleError(event.error || event.message);
        ELITE_STATE.performance.errors++;
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason);
        ELITE_STATE.performance.errors++;
      });
    }

    handleError(error) {
      console.error('🚨 Elite Error Handler:', error);

      // Track error
      this.analyticsTracker.trackAction('error', {
        message: error.message || error,
        stack: error.stack,
        context: ELITE_STATE.context
      });

      // Attempt recovery
      this.attemptRecovery(error);
    }

    attemptRecovery(error) {
      console.log('🔧 Attempting error recovery...');

      // Reload affected services
      const errorMsg = error.message || error.toString();
      
      if (errorMsg.includes('macro')) {
        console.log('Reloading macro services...');
        // Reinitialize macro services
      } else if (errorMsg.includes('AI') || errorMsg.includes('GPT')) {
        console.log('Reloading AI services...');
        // Reinitialize AI services
      }
    }

    setupServiceSuggestions(context) {
      // Suggest services based on page context
      const suggestions = [];

      if (context.formFields.count > 0 && context.formFields.autofillable) {
        suggestions.push({
          service: 'autofill',
          message: `${context.formFields.fields} form fields detected - Smart Autofill can help`,
          priority: 'high'
        });
      }

      if (context.dataExtractable.tables) {
        suggestions.push({
          service: 'data-extraction',
          message: 'Tables detected - Extract data to Excel/CSV',
          priority: 'medium'
        });
      }

      if (context.automationOpportunities.length > 0) {
        context.automationOpportunities.forEach(opp => {
          suggestions.push({
            service: 'macro-recording',
            message: opp.description,
            priority: opp.priority
          });
        });
      }

      // Show suggestions to user (via popup or notification)
      if (suggestions.length > 0) {
        console.log('💡 Service suggestions:', suggestions);
        this.showSuggestions(suggestions);
      }
    }

    showSuggestions(suggestions) {
      // Send suggestions to side panel or show notification
      chrome.runtime.sendMessage({
        type: 'elite-suggestions',
        suggestions: suggestions
      }).catch(() => {
        // Side panel might not be open
      });
    }

    sendTelemetry(data) {
      // Send anonymous usage data to background script
      chrome.runtime.sendMessage({
        type: 'elite-telemetry',
        data: {
          ...data,
          timestamp: Date.now(),
          performance: this.performanceMonitor.getReport(),
          usage: this.analyticsTracker.getUsageReport()
        }
      }).catch(() => {
        // Background script might not be ready
      });
    }

    getStatus() {
      return {
        initialized: this.initialized,
        version: ELITE_STATE.version,
        context: ELITE_STATE.context,
        performance: this.performanceMonitor.getReport(),
        analytics: this.analyticsTracker.getUsageReport(),
        enterprise: {
          initialized: ELITE_STATE.enterprise.initialized,
          organizationId: ELITE_STATE.enterprise.organizationId,
          features: ELITE_STATE.enterprise.features.length,
          auditEnabled: ELITE_STATE.enterprise.auditEnabled
        },
        notifications: {
          initialized: ELITE_STATE.notifications.initialized,
          enabled: ELITE_STATE.notifications.enabled,
          pendingCount: ELITE_STATE.notifications.pendingCount,
          quietHoursActive: ELITE_STATE.notifications.quietHoursActive
        },
        analyticsService: {
          initialized: ELITE_STATE.analyticsService.initialized,
          consentGiven: ELITE_STATE.analyticsService.consentGiven,
          experimentsActive: ELITE_STATE.analyticsService.activeExperiments.length
        }
      };
    }

    // Additional helper methods for v7.1 features
    async checkEnterpriseFeature(featureName) {
      return this.enterpriseIntegration.isFeatureEnabled(featureName);
    }

    async sendNotification(options) {
      return this.notificationIntegration.notify(options);
    }

    trackAnalyticsEvent(eventName, properties) {
      this.analyticsIntegration.trackEvent(eventName, properties);
    }

    trackFeatureUsage(featureName, duration) {
      this.analyticsIntegration.trackFeatureUsage(featureName, duration);
    }

    logAuditEvent(action, data) {
      this.enterpriseIntegration.logAuditEvent(action, data);
    }

    getExperimentVariant(experimentId) {
      return this.analyticsIntegration.getExperimentVariant(experimentId);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENTERPRISE INTEGRATION (v7.1) - SSO Context & Audit Tracking
  // ═══════════════════════════════════════════════════════════════════════════

  class EnterpriseIntegration {
    constructor() {
      this.organizationContext = null;
      this.userContext = null;
      this.featureFlags = new Map();
      this.auditQueue = [];
      this.initialized = false;
    }

    async initialize() {
      if (this.initialized) return;

      try {
        console.log('🏢 Initializing Enterprise Integration...');

        // Request enterprise state from background service
        const response = await this.sendBackgroundMessage({
          type: 'GET_ENTERPRISE_STATE'
        });

        if (response && response.success) {
          this.organizationContext = response.organization || null;
          this.userContext = response.user || null;
          
          if (response.features) {
            response.features.forEach(feature => {
              this.featureFlags.set(feature.name, feature.enabled);
            });
          }

          ELITE_STATE.enterprise = {
            initialized: true,
            organizationId: this.organizationContext?.id || null,
            features: response.features || [],
            ssoProvider: response.ssoProvider || null,
            branding: response.branding || null,
            auditEnabled: response.auditEnabled || false
          };

          // Apply branding if available
          if (response.branding) {
            this.applyBranding(response.branding);
          }

          console.log('✅ Enterprise Integration initialized:', {
            orgId: this.organizationContext?.id,
            ssoProvider: response.ssoProvider,
            featuresCount: this.featureFlags.size
          });
        }

        this.initialized = true;

        // Setup enterprise event listeners
        this.setupEventListeners();

        // Log initialization audit event
        this.logAuditEvent('CONTENT_SCRIPT_INITIALIZED', {
          url: window.location.href,
          timestamp: Date.now()
        });

      } catch (error) {
        console.warn('Enterprise Integration initialization failed:', error);
        ELITE_STATE.enterprise.initialized = false;
      }
    }

    setupEventListeners() {
      // Listen for enterprise state updates from background
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'ENTERPRISE_STATE_UPDATE') {
          this.handleStateUpdate(message.payload);
          sendResponse({ received: true });
          return true;
        }

        if (message.type === 'ENTERPRISE_FEATURE_FLAG_UPDATE') {
          this.updateFeatureFlag(message.feature, message.enabled);
          sendResponse({ received: true });
          return true;
        }

        if (message.type === 'ENTERPRISE_SESSION_EXPIRED') {
          this.handleSessionExpired();
          sendResponse({ received: true });
          return true;
        }

        return false;
      });
    }

    handleStateUpdate(payload) {
      console.log('🏢 Enterprise state updated:', payload);
      
      if (payload.organization) {
        this.organizationContext = payload.organization;
        ELITE_STATE.enterprise.organizationId = payload.organization.id;
      }

      if (payload.user) {
        this.userContext = payload.user;
      }

      if (payload.branding) {
        ELITE_STATE.enterprise.branding = payload.branding;
        this.applyBranding(payload.branding);
      }

      if (payload.features) {
        ELITE_STATE.enterprise.features = payload.features;
        payload.features.forEach(feature => {
          this.featureFlags.set(feature.name, feature.enabled);
        });
      }
    }

    updateFeatureFlag(feature, enabled) {
      this.featureFlags.set(feature, enabled);
      console.log(`🏢 Feature flag updated: ${feature} = ${enabled}`);
    }

    handleSessionExpired() {
      console.warn('🏢 Enterprise session expired');
      
      ELITE_STATE.enterprise.initialized = false;
      this.organizationContext = null;
      this.userContext = null;

      // Notify user
      this.showSessionExpiredNotification();
    }

    showSessionExpiredNotification() {
      // Send notification request to background
      this.sendBackgroundMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title: 'Session Expired',
          message: 'Your enterprise session has expired. Please sign in again.',
          category: 'SYSTEM',
          priority: 'high',
          actions: [
            { id: 'reauth', title: 'Sign In', action: 'ENTERPRISE_REAUTH' }
          ]
        }
      });
    }

    applyBranding(branding) {
      if (!branding) return;

      console.log('🎨 Applying enterprise branding:', branding);

      // Apply CSS variables for branding
      const style = document.createElement('style');
      style.id = 'cube-enterprise-branding';
      style.textContent = `
        :root {
          --cube-enterprise-primary: ${branding.primaryColor || '#7c3aed'};
          --cube-enterprise-secondary: ${branding.secondaryColor || '#6366f1'};
          --cube-enterprise-accent: ${branding.accentColor || '#8b5cf6'};
        }

        /* Apply to CUBE floating assistant if present */
        #cube-floating-assistant .cube-launcher {
          background: linear-gradient(135deg, 
            var(--cube-enterprise-primary) 0%, 
            var(--cube-enterprise-secondary) 50%, 
            var(--cube-enterprise-accent) 100%) !important;
        }

        #cube-floating-assistant .cube-panel-title {
          background: linear-gradient(135deg, 
            var(--cube-enterprise-primary), 
            var(--cube-enterprise-secondary)) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }
      `;

      // Remove existing branding style if present
      const existingStyle = document.getElementById('cube-enterprise-branding');
      if (existingStyle) {
        existingStyle.remove();
      }

      document.head.appendChild(style);
    }

    isFeatureEnabled(featureName) {
      return this.featureFlags.get(featureName) === true;
    }

    requireEnterprise() {
      return ELITE_STATE.enterprise.initialized && ELITE_STATE.enterprise.organizationId;
    }

    async logAuditEvent(action, data = {}) {
      if (!ELITE_STATE.enterprise.auditEnabled) return;

      const auditEvent = {
        action,
        data,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        organizationId: ELITE_STATE.enterprise.organizationId
      };

      this.auditQueue.push(auditEvent);

      // Batch send audit events
      if (this.auditQueue.length >= 10) {
        await this.flushAuditQueue();
      }
    }

    async flushAuditQueue() {
      if (this.auditQueue.length === 0) return;

      const events = [...this.auditQueue];
      this.auditQueue = [];

      try {
        await this.sendBackgroundMessage({
          type: 'BATCH_AUDIT_EVENTS',
          events
        });
      } catch (error) {
        console.warn('Failed to flush audit queue:', error);
        // Re-queue events
        this.auditQueue = [...events, ...this.auditQueue];
      }
    }

    async sendBackgroundMessage(message) {
      return new Promise((resolve, reject) => {
        if (!chrome?.runtime?.sendMessage) {
          reject(new Error('Runtime messaging unavailable'));
          return;
        }

        chrome.runtime.sendMessage(message, response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    }

    getContext() {
      return {
        organization: this.organizationContext,
        user: this.userContext,
        features: Object.fromEntries(this.featureFlags),
        initialized: this.initialized
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION INTEGRATION (v7.1) - Smart Notification Triggers
  // ═══════════════════════════════════════════════════════════════════════════

  class NotificationIntegration {
    constructor() {
      this.preferences = {
        enabled: true,
        channels: {
          automation: true,
          document: true,
          system: true,
          marketing: false
        },
        quietHours: null
      };
      this.pendingNotifications = [];
      this.initialized = false;
    }

    async initialize() {
      if (this.initialized) return;

      try {
        console.log('🔔 Initializing Notification Integration...');

        // Get notification preferences from background
        const response = await this.sendBackgroundMessage({
          type: 'GET_NOTIFICATION_PREFERENCES'
        });

        if (response && response.success) {
          this.preferences = {
            ...this.preferences,
            ...response.preferences
          };

          ELITE_STATE.notifications = {
            initialized: true,
            enabled: this.preferences.enabled,
            quietHoursActive: this.isQuietHoursActive(),
            pendingCount: response.pendingCount || 0,
            lastNotification: response.lastNotification || null
          };

          console.log('✅ Notification Integration initialized');
        }

        this.initialized = true;

        // Setup notification listeners
        this.setupEventListeners();

      } catch (error) {
        console.warn('Notification Integration initialization failed:', error);
        ELITE_STATE.notifications.initialized = false;
      }
    }

    setupEventListeners() {
      // Listen for notification updates from background
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'NOTIFICATION_UPDATE') {
          this.handleNotificationUpdate(message.payload);
          sendResponse({ received: true });
          return true;
        }

        if (message.type === 'NOTIFICATION_PREFERENCES_UPDATE') {
          this.updatePreferences(message.preferences);
          sendResponse({ received: true });
          return true;
        }

        return false;
      });
    }

    handleNotificationUpdate(payload) {
      ELITE_STATE.notifications.pendingCount = payload.pendingCount || 0;
      ELITE_STATE.notifications.lastNotification = payload.lastNotification || null;

      // Update UI if floating assistant is open
      this.updateNotificationBadge();
    }

    updatePreferences(newPreferences) {
      this.preferences = {
        ...this.preferences,
        ...newPreferences
      };

      ELITE_STATE.notifications.enabled = this.preferences.enabled;
      ELITE_STATE.notifications.quietHoursActive = this.isQuietHoursActive();
    }

    isQuietHoursActive() {
      if (!this.preferences.quietHours) return false;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinutes;

      const { start, end } = this.preferences.quietHours;
      const startTime = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
      const endTime = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);

      if (startTime <= endTime) {
        return currentTime >= startTime && currentTime <= endTime;
      } else {
        // Quiet hours span midnight
        return currentTime >= startTime || currentTime <= endTime;
      }
    }

    updateNotificationBadge() {
      // Update the floating assistant badge if present
      const badge = document.querySelector('#cube-floating-assistant .cube-launcher-badge');
      if (badge && ELITE_STATE.notifications.pendingCount > 0) {
        badge.textContent = ELITE_STATE.notifications.pendingCount;
        badge.style.display = 'block';
      } else if (badge) {
        badge.textContent = 'AI';
      }
    }

    async notify(options) {
      if (!this.preferences.enabled || this.isQuietHoursActive()) {
        console.log('🔔 Notification suppressed (disabled or quiet hours)');
        return false;
      }

      // Check channel preference
      if (options.category && !this.preferences.channels[options.category.toLowerCase()]) {
        console.log(`🔔 Notification suppressed (channel ${options.category} disabled)`);
        return false;
      }

      try {
        const response = await this.sendBackgroundMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title: options.title,
            message: options.message,
            category: options.category || 'SYSTEM',
            priority: options.priority || 'default',
            data: options.data || {},
            actions: options.actions || []
          }
        });

        return response?.success || false;
      } catch (error) {
        console.warn('Failed to show notification:', error);
        return false;
      }
    }

    // Convenience methods for common notification types
    async notifyAutomationStart(automationName, details = {}) {
      return this.notify({
        title: '🎬 Automation Started',
        message: `Running: ${automationName}`,
        category: 'AUTOMATION',
        priority: 'default',
        data: { automationName, ...details }
      });
    }

    async notifyAutomationComplete(automationName, result = {}) {
      const success = result.success !== false;
      return this.notify({
        title: success ? '✅ Automation Complete' : '❌ Automation Failed',
        message: success 
          ? `${automationName} completed successfully` 
          : `${automationName} failed: ${result.error || 'Unknown error'}`,
        category: 'AUTOMATION',
        priority: success ? 'default' : 'high',
        data: { automationName, ...result }
      });
    }

    async notifyDocumentProcessed(documentType, details = {}) {
      return this.notify({
        title: '📄 Document Processed',
        message: `${documentType} processed successfully`,
        category: 'DOCUMENT',
        priority: 'default',
        data: { documentType, ...details }
      });
    }

    async notifyError(errorMessage, context = {}) {
      return this.notify({
        title: '⚠️ Error Occurred',
        message: errorMessage,
        category: 'SYSTEM',
        priority: 'high',
        data: context
      });
    }

    async sendBackgroundMessage(message) {
      return new Promise((resolve, reject) => {
        if (!chrome?.runtime?.sendMessage) {
          reject(new Error('Runtime messaging unavailable'));
          return;
        }

        chrome.runtime.sendMessage(message, response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    }

    getPreferences() {
      return { ...this.preferences };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS INTEGRATION (v7.1) - Advanced Event Tracking
  // ═══════════════════════════════════════════════════════════════════════════

  class AnalyticsIntegration {
    constructor() {
      this.sessionId = null;
      this.consentGiven = false;
      this.eventQueue = [];
      this.experiments = new Map();
      this.featureUsage = new Map();
      this.initialized = false;
      this.flushInterval = null;
    }

    async initialize() {
      if (this.initialized) return;

      try {
        console.log('📊 Initializing Analytics Integration...');

        // Get analytics state from background
        const response = await this.sendBackgroundMessage({
          type: 'GET_ANALYTICS_STATE'
        });

        if (response && response.success) {
          this.sessionId = response.sessionId;
          this.consentGiven = response.consentGiven || false;

          if (response.experiments) {
            response.experiments.forEach(exp => {
              this.experiments.set(exp.id, exp);
            });
          }

          ELITE_STATE.analyticsService = {
            initialized: true,
            consentGiven: this.consentGiven,
            sessionId: this.sessionId,
            activeExperiments: Array.from(this.experiments.keys()),
            featureUsage: Object.fromEntries(this.featureUsage)
          };

          console.log('✅ Analytics Integration initialized:', {
            sessionId: this.sessionId,
            consentGiven: this.consentGiven,
            experimentsCount: this.experiments.size
          });
        }

        this.initialized = true;

        // Setup analytics listeners
        this.setupEventListeners();

        // Start flush interval
        this.startFlushInterval();

        // Track page view
        this.trackPageView();

      } catch (error) {
        console.warn('Analytics Integration initialization failed:', error);
        ELITE_STATE.analyticsService.initialized = false;
      }
    }

    setupEventListeners() {
      // Listen for analytics updates from background
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'ANALYTICS_CONSENT_UPDATE') {
          this.consentGiven = message.consentGiven;
          ELITE_STATE.analyticsService.consentGiven = message.consentGiven;
          sendResponse({ received: true });
          return true;
        }

        if (message.type === 'ANALYTICS_EXPERIMENT_UPDATE') {
          this.updateExperiment(message.experiment);
          sendResponse({ received: true });
          return true;
        }

        return false;
      });

      // Track user interactions
      this.setupInteractionTracking();
    }

    setupInteractionTracking() {
      // Track form submissions
      document.addEventListener('submit', (e) => {
        if (e.target.tagName === 'FORM') {
          this.trackEvent('FORM_SUBMIT', {
            formId: e.target.id,
            formAction: e.target.action,
            fieldCount: e.target.querySelectorAll('input, select, textarea').length
          });
        }
      }, true);

      // Track clicks on interactive elements
      document.addEventListener('click', (e) => {
        const target = e.target.closest('button, a, [role="button"]');
        if (target) {
          this.trackEvent('USER_CLICK', {
            element: target.tagName,
            id: target.id,
            className: target.className,
            text: target.textContent?.substring(0, 50)
          });
        }
      }, true);

      // Track scroll depth
      let maxScrollDepth = 0;
      let scrollThrottled = false;
      document.addEventListener('scroll', () => {
        if (scrollThrottled) return;
        scrollThrottled = true;

        setTimeout(() => {
          const scrollPercent = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
          );
          
          if (scrollPercent > maxScrollDepth) {
            maxScrollDepth = scrollPercent;
            
            // Track milestone depths
            if ([25, 50, 75, 100].includes(maxScrollDepth)) {
              this.trackEvent('SCROLL_DEPTH', { depth: maxScrollDepth });
            }
          }

          scrollThrottled = false;
        }, 500);
      });

      // Track page unload
      window.addEventListener('beforeunload', () => {
        this.trackEvent('PAGE_UNLOAD', {
          timeOnPage: Date.now() - ELITE_STATE.analytics.sessionStart,
          maxScrollDepth
        });
        this.flushEvents(true);
      });
    }

    updateExperiment(experiment) {
      this.experiments.set(experiment.id, experiment);
      ELITE_STATE.analyticsService.activeExperiments = Array.from(this.experiments.keys());
    }

    startFlushInterval() {
      // Flush events every 30 seconds
      this.flushInterval = setInterval(() => {
        this.flushEvents();
      }, 30000);
    }

    trackPageView() {
      this.trackEvent('PAGE_VIEW', {
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
        pageType: ELITE_STATE.context.pageType
      });
    }

    trackEvent(eventName, properties = {}) {
      if (!this.consentGiven) {
        console.log('📊 Event not tracked (no consent):', eventName);
        return;
      }

      const event = {
        name: eventName,
        properties: {
          ...properties,
          url: window.location.href,
          timestamp: Date.now(),
          sessionId: this.sessionId
        }
      };

      this.eventQueue.push(event);
      ELITE_STATE.performance.interactions++;

      // Auto-flush if queue is large
      if (this.eventQueue.length >= 20) {
        this.flushEvents();
      }
    }

    trackFeatureUsage(featureName, duration = 0) {
      const usage = this.featureUsage.get(featureName) || { count: 0, totalDuration: 0 };
      usage.count++;
      usage.totalDuration += duration;
      this.featureUsage.set(featureName, usage);

      ELITE_STATE.analyticsService.featureUsage = Object.fromEntries(this.featureUsage);

      this.trackEvent('FEATURE_USAGE', {
        feature: featureName,
        duration,
        usageCount: usage.count
      });
    }

    trackAutomation(automationName, result) {
      this.trackEvent('AUTOMATION_RUN', {
        name: automationName,
        success: result.success !== false,
        duration: result.duration || 0,
        stepsCompleted: result.stepsCompleted || 0,
        error: result.error || null
      });
    }

    trackError(errorMessage, context = {}) {
      this.trackEvent('ERROR', {
        message: errorMessage,
        context,
        stack: context.stack || null
      });
    }

    trackPerformance(metricName, value, unit = 'ms') {
      this.trackEvent('PERFORMANCE', {
        metric: metricName,
        value,
        unit
      });
    }

    getExperimentVariant(experimentId) {
      const experiment = this.experiments.get(experimentId);
      if (!experiment) return null;

      return experiment.variant || experiment.control;
    }

    async flushEvents(sync = false) {
      if (this.eventQueue.length === 0) return;

      const events = [...this.eventQueue];
      this.eventQueue = [];

      try {
        if (sync && navigator.sendBeacon) {
          // Use sendBeacon for synchronous flush (on unload)
          const blob = new Blob([JSON.stringify({
            type: 'BATCH_ANALYTICS_EVENTS',
            events
          })], { type: 'application/json' });
          navigator.sendBeacon(
            `chrome-extension://${chrome.runtime.id}/analytics`,
            blob
          );
        } else {
          await this.sendBackgroundMessage({
            type: 'BATCH_ANALYTICS_EVENTS',
            events
          });
        }
      } catch (error) {
        console.warn('Failed to flush analytics events:', error);
        // Re-queue events
        this.eventQueue = [...events, ...this.eventQueue];
      }
    }

    async sendBackgroundMessage(message) {
      return new Promise((resolve, reject) => {
        if (!chrome?.runtime?.sendMessage) {
          reject(new Error('Runtime messaging unavailable'));
          return;
        }

        chrome.runtime.sendMessage(message, response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    }

    getMetrics() {
      return {
        sessionId: this.sessionId,
        eventsTracked: ELITE_STATE.performance.interactions,
        featureUsage: Object.fromEntries(this.featureUsage),
        experiments: Array.from(this.experiments.values())
      };
    }

    destroy() {
      if (this.flushInterval) {
        clearInterval(this.flushInterval);
      }
      this.flushEvents(true);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Wait for DOM and base content script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureFloatingAssistant();
      initializeElite();
    });
  } else {
    ensureFloatingAssistant();
    // DOM already loaded
    setTimeout(initializeElite, 100);
  }

  async function initializeElite() {
    try {
      console.log('🏆 Starting Elite initialization...');

      // Create global elite coordinator
      window.CubeEliteCoordinator = new EliteCoordinator();
      
      // Initialize after a short delay to ensure base services are ready
      setTimeout(() => {
        window.CubeEliteCoordinator.initialize();
      }, 500);

      console.log('✅ Elite layer loaded successfully');
    } catch (error) {
      console.error('❌ Elite initialization failed:', error);
    }
  }

  // Export utilities
  window.EliteUtils = {
    getContext: () => ELITE_STATE.context,
    getPerformance: () => ELITE_STATE.performance,
    getAnalytics: () => ELITE_STATE.analytics,
    trackAction: (action, details) => {
      if (window.CubeEliteCoordinator?.analyticsTracker) {
        window.CubeEliteCoordinator.analyticsTracker.trackAction(action, details);
      }
    },
    
    // v7.1 utilities
    getEnterpriseState: () => ELITE_STATE.enterprise,
    getNotificationState: () => ELITE_STATE.notifications,
    getAnalyticsState: () => ELITE_STATE.analyticsService,
    
    isEnterpriseEnabled: () => ELITE_STATE.enterprise.initialized,
    isFeatureEnabled: (feature) => {
      if (window.CubeEliteCoordinator?.enterpriseIntegration) {
        return window.CubeEliteCoordinator.enterpriseIntegration.isFeatureEnabled(feature);
      }
      return false;
    },
    
    sendNotification: async (options) => {
      if (window.CubeEliteCoordinator?.notificationIntegration) {
        return window.CubeEliteCoordinator.notificationIntegration.notify(options);
      }
      return false;
    },
    
    trackEvent: (eventName, properties) => {
      if (window.CubeEliteCoordinator?.analyticsIntegration) {
        window.CubeEliteCoordinator.analyticsIntegration.trackEvent(eventName, properties);
      }
    },
    
    trackFeatureUsage: (featureName, duration = 0) => {
      if (window.CubeEliteCoordinator?.analyticsIntegration) {
        window.CubeEliteCoordinator.analyticsIntegration.trackFeatureUsage(featureName, duration);
      }
    },
    
    getExperimentVariant: (experimentId) => {
      if (window.CubeEliteCoordinator?.analyticsIntegration) {
        return window.CubeEliteCoordinator.analyticsIntegration.getExperimentVariant(experimentId);
      }
      return null;
    },
    
    logAuditEvent: (action, data) => {
      if (window.CubeEliteCoordinator?.enterpriseIntegration) {
        window.CubeEliteCoordinator.enterpriseIntegration.logAuditEvent(action, data);
      }
    },
    
    getFullStatus: () => {
      if (window.CubeEliteCoordinator) {
        return window.CubeEliteCoordinator.getStatus();
      }
      return null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT SCRIPT READY SIGNAL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Send ready signal to background service
   * This notifies the background that all content scripts are loaded and ready
   */
  function sendReadySignal() {
    // Collect loaded services
    const services = [];
    if (window.MacroRecorder) services.push('MacroRecorder');
    if (window.MacroPlayer) services.push('MacroPlayer');
    if (window.MacroAI) services.push('MacroAI');
    if (window.OpenAIService) services.push('OpenAIService');
    if (window.ClaudeService) services.push('ClaudeService');
    if (window.GeminiService) services.push('GeminiService');
    if (window.ScreenCaptureService) services.push('ScreenCaptureService');
    if (window.RemoteControlService) services.push('RemoteControlService');
    if (window.P2PFileService) services.push('P2PFileService');
    if (window.universalDocumentEngineV6) services.push('UniversalDocumentEngine');
    if (window.UniversalParsers) services.push('UniversalParsers');
    if (window.SmartAutofillEngine) services.push('SmartAutofillEngine');
    if (window.CubeEliteCoordinator) services.push('EliteCoordinator');
    
    // v7.1 integrations
    if (ELITE_STATE.enterprise.initialized) services.push('EnterpriseIntegration');
    if (ELITE_STATE.notifications.initialized) services.push('NotificationIntegration');
    if (ELITE_STATE.analyticsService.initialized) services.push('AnalyticsIntegration');

    chrome.runtime.sendMessage({
      type: 'CONTENT_SCRIPT_READY',
      version: ELITE_STATE.version,
      services: services,
      url: window.location.href,
      timestamp: Date.now(),
      enterprise: ELITE_STATE.enterprise.initialized,
      notifications: ELITE_STATE.notifications.initialized,
      analytics: ELITE_STATE.analyticsService.initialized
    }).then(response => {
      console.log('✅ Ready signal sent to background service', response);
    }).catch(error => {
      console.warn('⚠️ Failed to send ready signal:', error.message);
      // Retry after 1 second
      setTimeout(sendReadySignal, 1000);
    });
  }

  // Send ready signal after initialization
  setTimeout(sendReadySignal, 1000);

  // Re-send signal on page visibility change (tab becomes active)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      sendReadySignal();
    }
  });

  console.log('🏆 CUBE Nexum Connect v7.1 - Elite Orchestration Layer ready');

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message?.type) {
      return false;
    }

    if (message.type === 'FLOATING_AI_COMMAND') {
      ensureFloatingAssistant()
        .then((assistant) => {
          const result = assistant.handleCommand(message.command, message.payload || {});
          sendResponse({ success: true, ...result });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    // Handle elite status request
    if (message.type === 'GET_ELITE_STATUS') {
      const status = window.CubeEliteCoordinator?.getStatus() || {
        initialized: false,
        version: ELITE_STATE.version
      };
      sendResponse({ success: true, status });
      return true;
    }

    // Handle notification preferences request
    if (message.type === 'GET_CONTENT_NOTIFICATION_PREFS') {
      const prefs = window.CubeEliteCoordinator?.notificationIntegration?.getPreferences() || {};
      sendResponse({ success: true, preferences: prefs });
      return true;
    }

    // Handle analytics metrics request
    if (message.type === 'GET_CONTENT_ANALYTICS_METRICS') {
      const metrics = window.CubeEliteCoordinator?.analyticsIntegration?.getMetrics() || {};
      sendResponse({ success: true, metrics });
      return true;
    }

    // Handle enterprise context request
    if (message.type === 'GET_CONTENT_ENTERPRISE_CONTEXT') {
      const context = window.CubeEliteCoordinator?.enterpriseIntegration?.getContext() || {};
      sendResponse({ success: true, context });
      return true;
    }

    return false;
  });

})();
