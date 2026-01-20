// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 CONTENT SCRIPT v6 ELITE - Advanced Orchestration Layer
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
//
// This elite layer provides advanced orchestration on top of content-script-v6.js
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  console.log('🏆 CUBE Nexum Connect v7 - Elite Orchestration Layer loading...');

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTENSION CONTEXT HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if extension context is still valid
   * Context becomes invalid when extension is reloaded/updated
   */
  function isExtensionContextValid() {
    try {
      return !!(chrome?.runtime?.id && chrome?.runtime?.sendMessage);
    } catch (e) {
      return false;
    }
  }

  /**
   * Safe wrapper for chrome.runtime.sendMessage
   * Returns null if context is invalid instead of throwing
   */
  async function safeSendMessage(message) {
    if (!isExtensionContextValid()) {
      console.debug('Extension context invalidated, message not sent:', message.type);
      return null;
    }
    
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      if (error?.message?.includes('Extension context invalidated')) {
        console.debug('Extension context invalidated during send');
        return null;
      }
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ELITE STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  const ELITE_STATE = {
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
        launcherPosition: null,
        theme: 'dark',
        sidePanelOpen: false,
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
      this.launcherDragging = false;
      this.dragOffset = { x: 0, y: 0 };
      this.launcherDragOffset = { x: 0, y: 0 };
      this.launcherDragStartTime = 0;
      this.launcherDragMoved = false;
      this.launcherAnimationFrame = null;
      this.panelAnimationFrame = null;
      this.sidePanelOffset = 0;
      this.streaming = false;
      this.abortController = null;
      this.handlePointerMove = this.onPointerMove.bind(this);
      this.handlePointerUp = this.onPointerUp.bind(this);
      this.handleLauncherPointerMove = this.onLauncherPointerMove.bind(this);
      this.handleLauncherPointerUp = this.onLauncherPointerUp.bind(this);
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
      this.updateLauncherPosition();
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
          const storedState = stored[this.storageKey];
          
          let validPosition = null;
          if (storedState.launcherPosition && 
              typeof storedState.launcherPosition.left === 'number' &&
              typeof storedState.launcherPosition.top === 'number' &&
              !isNaN(storedState.launcherPosition.left) &&
              !isNaN(storedState.launcherPosition.top)) {
            validPosition = storedState.launcherPosition;
          }
          
          this.state = {
            ...this.state,
            ...storedState,
            attachments: {
              ...this.state.attachments,
              ...(storedState.attachments || {})
            },
            launcherPosition: validPosition
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
      this.host.style.inset = '0';
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
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          }

          @keyframes pulse-subtle {
            0%, 100% { box-shadow: 0 4px 20px rgba(124, 58, 237, 0.25); }
            50% { box-shadow: 0 4px 24px rgba(124, 58, 237, 0.35); }
          }

          .cube-launcher {
            position: fixed;
            right: 20px;
            bottom: 20px;
            width: 52px;
            height: 52px;
            border-radius: 16px;
            border: none;
            background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
            box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
            color: #fff;
            cursor: pointer;
            display: inline-flex;
            z-index: 2147483647;
            align-items: center;
            justify-content: center;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            animation: pulse-subtle 3s ease-in-out infinite;
            user-select: none;
            touch-action: none;
          }

          .cube-launcher[data-dragging='true'] {
            cursor: grabbing;
            animation: none;
            transform: scale(1.08);
            box-shadow: 0 8px 28px rgba(124, 58, 237, 0.45);
            z-index: 2147480001;
          }

          .cube-launcher:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(124, 58, 237, 0.4);
            animation: none;
          }

          .cube-launcher[data-open='true'] {
            transform: scale(0.95);
            box-shadow: 0 4px 16px rgba(124, 58, 237, 0.35);
            animation: none;
          }

          .cube-launcher:focus-visible {
            outline: 2px solid white;
            outline-offset: 3px;
          }

          .cube-launcher-badge {
            position: absolute;
            top: -6px;
            right: -6px;
            background: #22c55e;
            color: white;
            font-size: 9px;
            font-weight: 600;
            padding: 2px 5px;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
            letter-spacing: 0.5px;
          }

          .cube-panel {
            position: fixed;
            width: min(380px, 90vw);
            max-height: min(520px, 80vh);
            background: rgba(10, 10, 15, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 16px;
            color: #f4f4f5;
            display: flex;
            flex-direction: column;
            gap: 10px;
            backdrop-filter: blur(24px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            pointer-events: auto;
            bottom: 84px;
            right: 20px;
            opacity: 0;
            transform: translateY(12px) scale(0.96);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 2147483647;
            overflow: hidden;
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
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }

          .cube-panel-title {
            font-size: 15px;
            font-weight: 600;
            color: #f4f4f5;
          }

          .cube-panel-subtitle {
            font-size: 11px;
            color: #71717a;
            margin-top: 2px;
          }

          .cube-panel-actions {
            display: inline-flex;
            gap: 4px;
          }

          .cube-icon-btn {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            border: none;
            background: rgba(255, 255, 255, 0.06);
            color: #a1a1aa;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .cube-icon-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #f4f4f5;
          }

          .cube-context-row {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
            flex-shrink: 0;
          }

          .cube-context-chip {
            padding: 6px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(255, 255, 255, 0.03);
            text-align: center;
            transition: all 0.15s ease;
          }

          .cube-context-chip:hover {
            border-color: rgba(124, 58, 237, 0.3);
            background: rgba(124, 58, 237, 0.08);
          }

          .cube-chip-label {
            display: block;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #71717a;
            margin-bottom: 2px;
          }

          .cube-chip-value {
            font-size: 14px;
            font-weight: 600;
            color: #8b5cf6;
          }

          .cube-transcript {
            flex: 1;
            overflow-y: auto;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(0, 0, 0, 0.2);
            padding: 12px;
            min-height: 100px;
            max-height: 200px;
          }

          .cube-transcript::-webkit-scrollbar {
            width: 4px;
          }

          .cube-transcript::-webkit-scrollbar-track {
            background: transparent;
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
            gap: 8px;
            flex-wrap: wrap;
            flex-shrink: 0;
          }

          .cube-attachment {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 6px 10px;
            border-radius: 16px;
            border: 1px solid rgba(124, 58, 237, 0.3);
            font-size: 11px;
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
            accent-color: #8b5cf6;
            cursor: pointer;
          }

          .cube-input-row {
            display: flex;
            gap: 8px;
            align-items: flex-end;
            flex-shrink: 0;
          }

          .cube-textarea {
            flex: 1;
            min-height: 60px;
            max-height: 100px;
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
            width: 48px;
            height: 48px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            flex-shrink: 0;
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
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
            flex-shrink: 0;
          }

          .cube-quick-btn {
            border: 1px solid rgba(124, 58, 237, 0.25);
            border-radius: 10px;
            padding: 8px 4px;
            background: rgba(124, 58, 237, 0.06);
            color: #e0e7ff;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s ease;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .cube-quick-btn:hover {
            background: rgba(124, 58, 237, 0.15);
            border-color: rgba(124, 58, 237, 0.5);
            transform: translateY(-1px);
          }

          /* ========== NEW ENHANCED STYLES ========== */
          
          /* Header with personality */
          .cube-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .cube-personality-btn {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            border: 2px solid rgba(124, 58, 237, 0.3);
            background: rgba(124, 58, 237, 0.1);
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }
          
          .cube-personality-btn:hover {
            border-color: rgba(124, 58, 237, 0.6);
            transform: scale(1.05);
          }
          
          /* Personality Dropdown */
          .cube-personality-dropdown {
            padding: 8px;
            background: #1f2937;
            border-radius: 12px;
            margin-bottom: 8px;
            animation: slideDown 0.2s ease;
          }
          
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .cube-personality-option {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            background: transparent;
            border: 2px solid transparent;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 4px;
          }
          
          .cube-personality-option:last-child {
            margin-bottom: 0;
          }
          
          .cube-personality-option:hover {
            background: rgba(124, 58, 237, 0.1);
          }
          
          .cube-personality-option.active {
            background: rgba(124, 58, 237, 0.15);
            border-color: rgba(124, 58, 237, 0.5);
          }
          
          .cube-p-avatar {
            font-size: 24px;
          }
          
          .cube-p-info {
            text-align: left;
          }
          
          .cube-p-name {
            font-weight: 700;
            font-size: 13px;
            color: #f9fafb;
          }
          
          .cube-p-desc {
            font-size: 11px;
            color: #9ca3af;
          }
          
          /* Mode Tabs */
          .cube-mode-tabs {
            display: flex;
            gap: 4px;
            padding: 4px;
            background: rgba(30, 41, 59, 0.8);
            border-radius: 10px;
            margin-bottom: 10px;
          }
          
          .cube-mode-tab {
            flex: 1;
            padding: 8px 10px;
            background: transparent;
            border: none;
            border-radius: 8px;
            color: #9ca3af;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .cube-mode-tab:hover {
            color: #e5e7eb;
            background: rgba(124, 58, 237, 0.1);
          }
          
          .cube-mode-tab.active {
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white;
          }
          
          .cube-mode-content {
            display: none;
            flex-direction: column;
            gap: 10px;
            flex: 1;
            min-height: 0;
            overflow: hidden;
          }
          
          .cube-mode-content.active {
            display: flex;
          }
          
          /* Typing Indicator */
          .cube-typing-indicator {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            color: #9ca3af;
            font-size: 12px;
          }
          
          .cube-typing-indicator span:not(.cube-typing-text) {
            width: 6px;
            height: 6px;
            background: #8b5cf6;
            border-radius: 50%;
            animation: typingBounce 1.4s infinite ease-in-out;
          }
          
          .cube-typing-indicator span:nth-child(1) { animation-delay: 0s; }
          .cube-typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
          .cube-typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
          
          @keyframes typingBounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
          }
          
          .cube-typing-text {
            margin-left: 8px;
          }
          
          /* Voice & Emoji Buttons */
          .cube-voice-btn, .cube-emoji-btn {
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 10px;
            background: rgba(124, 58, 237, 0.1);
            cursor: pointer;
            font-size: 18px;
            transition: all 0.2s;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .cube-voice-btn:hover, .cube-emoji-btn:hover {
            background: rgba(124, 58, 237, 0.2);
            transform: scale(1.05);
          }
          
          .cube-voice-btn.recording {
            background: #ef4444;
            animation: pulse 1s infinite;
          }
          
          /* Message Reactions */
          .cube-message-reactions {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 6px;
          }
          
          .cube-reaction {
            padding: 2px 8px;
            background: rgba(124, 58, 237, 0.1);
            border-radius: 12px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .cube-reaction:hover {
            background: rgba(124, 58, 237, 0.2);
            transform: scale(1.1);
          }
          
          /* Code Mode */
          .cube-code-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .cube-form-label {
            font-size: 12px;
            font-weight: 600;
            color: #d1d5db;
            margin-bottom: 4px;
          }
          
          .cube-code-options {
            display: flex;
            gap: 8px;
          }
          
          .cube-select {
            flex: 1;
            padding: 8px 12px;
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(124, 58, 237, 0.2);
            border-radius: 8px;
            color: #e5e7eb;
            font-size: 13px;
          }
          
          .cube-btn-primary {
            padding: 8px 16px;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            border: none;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .cube-btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
          }
          
          .cube-code-output {
            background: #0f172a;
            border-radius: 10px;
            overflow: hidden;
          }
          
          .cube-code-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: rgba(124, 58, 237, 0.1);
            font-size: 12px;
            color: #9ca3af;
          }
          
          .cube-code-block {
            padding: 12px;
            margin: 0;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 12px;
            color: #e5e7eb;
            white-space: pre-wrap;
            overflow-x: auto;
          }
          
          /* Tools Grid */
          .cube-tools-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          
          .cube-tool-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            padding: 16px 12px;
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid rgba(124, 58, 237, 0.2);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .cube-tool-card:hover {
            background: rgba(124, 58, 237, 0.1);
            border-color: rgba(124, 58, 237, 0.4);
            transform: translateY(-2px);
          }
          
          .cube-tool-icon {
            font-size: 24px;
          }
          
          .cube-tool-name {
            font-size: 12px;
            font-weight: 600;
            color: #f9fafb;
          }
          
          .cube-tool-desc {
            font-size: 10px;
            color: #9ca3af;
            text-align: center;
          }
          
          /* Nudge/Zumbido Animation */
          @keyframes nudgeShake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          
          .cube-panel.nudge {
            animation: nudgeShake 0.5s ease-in-out;
          }
          
          /* ========== END NEW STYLES ========== */

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
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
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
            color: #8b5cf6;
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
            color: #8b5cf6;
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

          /* ========== ADDITIONAL LIGHT THEME STYLES ========== */
          
          /* Personality Dropdown - Light */
          :host([data-theme='light']) .cube-personality-dropdown {
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
            border-color: rgba(124, 58, 237, 0.2);
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
          }

          :host([data-theme='light']) .cube-personality-option {
            background: transparent;
            border-bottom-color: rgba(124, 58, 237, 0.1);
            color: #1e293b;
          }

          :host([data-theme='light']) .cube-personality-option:hover {
            background: rgba(124, 58, 237, 0.08);
          }

          :host([data-theme='light']) .cube-personality-option.active {
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%);
            border-left: 3px solid #8b5cf6;
          }

          :host([data-theme='light']) .cube-p-name {
            color: #1e293b;
          }

          :host([data-theme='light']) .cube-p-desc {
            color: #64748b;
          }

          /* Mode Tabs - Light */
          :host([data-theme='light']) .cube-mode-tabs {
            background: rgba(124, 58, 237, 0.05);
            border-color: rgba(124, 58, 237, 0.15);
          }

          :host([data-theme='light']) .cube-mode-tab {
            color: #64748b;
            background: transparent;
          }

          :host([data-theme='light']) .cube-mode-tab:hover {
            background: rgba(124, 58, 237, 0.08);
            color: #4f46e5;
          }

          :host([data-theme='light']) .cube-mode-tab.active {
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white;
            box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
          }

          /* Typing Indicator - Light */
          :host([data-theme='light']) .cube-typing-indicator {
            color: #64748b;
          }

          :host([data-theme='light']) .cube-typing-indicator span:not(.cube-typing-text) {
            background: #8b5cf6;
          }

          :host([data-theme='light']) .cube-typing-text {
            color: #475569;
          }

          /* Voice & Emoji Buttons - Light */
          :host([data-theme='light']) .cube-voice-btn,
          :host([data-theme='light']) .cube-emoji-btn {
            background: rgba(124, 58, 237, 0.08);
            color: #4f46e5;
            border: 1px solid rgba(124, 58, 237, 0.15);
          }

          :host([data-theme='light']) .cube-voice-btn:hover,
          :host([data-theme='light']) .cube-emoji-btn:hover {
            background: rgba(124, 58, 237, 0.15);
            border-color: rgba(124, 58, 237, 0.3);
          }

          :host([data-theme='light']) .cube-voice-btn.recording {
            background: #ef4444;
            color: white;
            border-color: transparent;
          }

          /* Send Button - Light */
          :host([data-theme='light']) .cube-send-btn {
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
          }

          :host([data-theme='light']) .cube-send-btn:hover:not(:disabled) {
            box-shadow: 0 6px 16px rgba(124, 58, 237, 0.35);
          }

          /* Form Elements - Light */
          :host([data-theme='light']) .cube-form-label {
            color: #374151;
          }

          :host([data-theme='light']) .cube-select {
            background: rgba(248, 250, 252, 0.95);
            border-color: rgba(124, 58, 237, 0.2);
            color: #1e293b;
          }

          :host([data-theme='light']) .cube-select:focus {
            border-color: rgba(124, 58, 237, 0.5);
            background: #fff;
          }

          /* Code Output - Light */
          :host([data-theme='light']) .cube-code-output {
            background: #f8fafc;
            border: 1px solid rgba(124, 58, 237, 0.15);
          }

          :host([data-theme='light']) .cube-code-header {
            background: rgba(124, 58, 237, 0.08);
            color: #64748b;
            border-bottom: 1px solid rgba(124, 58, 237, 0.1);
          }

          :host([data-theme='light']) .cube-code-block {
            color: #1e293b;
            background: #fff;
          }

          /* Tool Cards - Light */
          :host([data-theme='light']) .cube-tool-card {
            background: rgba(248, 250, 252, 0.9);
            border-color: rgba(124, 58, 237, 0.15);
          }

          :host([data-theme='light']) .cube-tool-card:hover {
            background: rgba(124, 58, 237, 0.08);
            border-color: rgba(124, 58, 237, 0.3);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
          }

          :host([data-theme='light']) .cube-tool-name {
            color: #1e293b;
          }

          :host([data-theme='light']) .cube-tool-desc {
            color: #64748b;
          }

          /* Message Reactions - Light */
          :host([data-theme='light']) .cube-reaction {
            background: rgba(124, 58, 237, 0.08);
            color: #4f46e5;
          }

          :host([data-theme='light']) .cube-reaction:hover {
            background: rgba(124, 58, 237, 0.15);
          }

          /* Context Row - Light */
          :host([data-theme='light']) .cube-context-row {
            background: rgba(124, 58, 237, 0.03);
            border-color: rgba(124, 58, 237, 0.1);
          }

          /* Input Row - Light */
          :host([data-theme='light']) .cube-input-row {
            background: rgba(248, 250, 252, 0.95);
            border-color: rgba(124, 58, 237, 0.15);
          }

          /* Primary Button - Light */
          :host([data-theme='light']) .cube-btn-primary {
            box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25);
          }

          :host([data-theme='light']) .cube-btn-primary:hover {
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);
          }

          /* Tools Grid - Light */
          :host([data-theme='light']) .cube-tools-grid {
            background: transparent;
          }

          /* Personality Button - Light */
          :host([data-theme='light']) .cube-personality-btn {
            background: rgba(124, 58, 237, 0.08);
            border-color: rgba(124, 58, 237, 0.2);
          }

          :host([data-theme='light']) .cube-personality-btn:hover {
            background: rgba(124, 58, 237, 0.15);
            border-color: rgba(124, 58, 237, 0.4);
          }

          /* Code Options - Light */
          :host([data-theme='light']) .cube-code-options {
            border-color: rgba(124, 58, 237, 0.1);
          }

          /* Mode Content - Light */
          :host([data-theme='light']) .cube-mode-content {
            background: transparent;
          }

          /* Launcher Badge - Light */
          :host([data-theme='light']) .cube-launcher-badge {
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
          }

          /* ========== END ADDITIONAL LIGHT THEME STYLES ========== */
        </style>
        <button id="cubeFloatingLauncher" class="cube-launcher" type="button" aria-label="Open CUBE AI Assistant">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <rect x="8" y="8" width="8" height="8" rx="1"/>
              <line x1="4" y1="4" x2="8" y2="8"/>
              <line x1="20" y1="4" x2="16" y2="8"/>
              <line x1="4" y1="20" x2="8" y2="16"/>
              <line x1="20" y1="20" x2="16" y2="16"/>
            </svg>
          <span class="cube-launcher-badge">AI</span>
        </button>
        <section id="cubeFloatingPanel" class="cube-panel" role="dialog" aria-label="Floating AI Assistant" data-open="false">
          <header class="cube-panel-header" id="cubeFloatingDragHandle">
            <div class="cube-header-left">
              <button id="cubePersonalityBtn" class="cube-personality-btn" type="button" title="Change AI Personality">
                <span id="cubePersonalityAvatar">🔮</span>
              </button>
              <div>
                <div class="cube-panel-title" id="cubePersonalityName">CIPHER</div>
                <div class="cube-panel-subtitle" id="cubePersonalityDesc">Main Assistant</div>
              </div>
            </div>
            <div class="cube-panel-actions">
              <button id="cubeFloatingNudge" class="cube-icon-btn" type="button" title="Send Nudge 💥">💥</button>
              <button id="cubeFloatingTour" class="cube-icon-btn" type="button" title="Start Tour">❓</button>
              <button id="cubeFloatingRefresh" class="cube-icon-btn" type="button" title="Refresh">↻</button>
              <button id="cubeFloatingClear" class="cube-icon-btn" type="button" title="Clear">⌫</button>
              <button id="cubeFloatingClose" class="cube-icon-btn" type="button" title="Close">×</button>
            </div>
          </header>
          
          <!-- Personality Selector Dropdown -->
          <div id="cubePersonalityDropdown" class="cube-personality-dropdown" style="display: none;">
            <button class="cube-personality-option active" data-personality="cipher">
              <span class="cube-p-avatar">🔮</span>
              <div class="cube-p-info">
                <div class="cube-p-name">CIPHER</div>
                <div class="cube-p-desc">Automation & Analysis</div>
              </div>
            </button>
            <button class="cube-personality-option" data-personality="nexus">
              <span class="cube-p-avatar">⚡</span>
              <div class="cube-p-info">
                <div class="cube-p-name">NEXUS</div>
                <div class="cube-p-desc">Code & Architecture</div>
              </div>
            </button>
            <button class="cube-personality-option" data-personality="sentinel">
              <span class="cube-p-avatar">🛡️</span>
              <div class="cube-p-info">
                <div class="cube-p-name">SENTINEL</div>
                <div class="cube-p-desc">Data & Security</div>
              </div>
            </button>
            <button class="cube-personality-option" data-personality="forge">
              <span class="cube-p-avatar">🔥</span>
              <div class="cube-p-info">
                <div class="cube-p-name">FORGE</div>
                <div class="cube-p-desc">Design & Workflows</div>
              </div>
            </button>
          </div>
          
          <!-- Mode Tabs -->
          <div class="cube-mode-tabs">
            <button class="cube-mode-tab active" data-mode="chat" type="button">💬 Chat</button>
            <button class="cube-mode-tab" data-mode="code" type="button">💻 Code</button>
            <button class="cube-mode-tab" data-mode="tools" type="button">🛠️ Tools</button>
          </div>
          
          <!-- Chat Mode -->
          <div class="cube-mode-content active" id="cubeModeChat">
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
                <span>DOM</span>
              </label>
              <label class="cube-attachment">
                <input type="checkbox" id="cubeAttachMacros">
                <span>Macro</span>
              </label>
              <label class="cube-attachment">
                <input type="checkbox" id="cubeAttachContext" checked>
                <span>Context</span>
              </label>
            </div>
            <div class="cube-transcript" id="cubeFloatingTranscript" role="log" aria-live="polite">
              <div class="cube-message">
                <div class="cube-message-icon">🔮</div>
                <div class="cube-message-body">
                  <div class="cube-message-role">CIPHER</div>
                  <div class="cube-message-text">CIPHER system active. I am your main AI assistant. How can I optimize your workflow today?</div>
                  <div class="cube-message-reactions" id="cubeReactions0"></div>
                </div>
              </div>
            </div>
            <div class="cube-typing-indicator" id="cubeTypingIndicator" style="display: none;">
              <span></span><span></span><span></span>
              <span class="cube-typing-text">AI is typing...</span>
            </div>
            <div class="cube-input-row">
              <button id="cubeVoiceBtn" class="cube-voice-btn" type="button" title="Voice message">🎤</button>
              <textarea id="cubeFloatingInput" class="cube-textarea" placeholder="Ask anything..." rows="2"></textarea>
              <button id="cubeEmojiBtn" class="cube-emoji-btn" type="button" title="Add emoji">😊</button>
              <button id="cubeFloatingSend" class="cube-send-btn" type="button" aria-label="Send message">→</button>
            </div>
            <div class="cube-quick-row">
              <button class="cube-quick-btn" data-prompt="workflow" type="button">⚡ Workflow</button>
              <button class="cube-quick-btn" data-prompt="selectors" type="button">🎯 Selectors</button>
              <button class="cube-quick-btn" data-prompt="schema" type="button">📋 Schema</button>
              <button class="cube-quick-btn" data-prompt="analyze" type="button">🔍 Analyze</button>
            </div>
          </div>
          
          <!-- Code Mode -->
          <div class="cube-mode-content" id="cubeModeCode">
            <div class="cube-code-container">
              <label class="cube-form-label">Describe what code you need:</label>
              <textarea id="cubeCodePrompt" class="cube-textarea" rows="3" placeholder="e.g., Create a function to extract all email addresses from this page..."></textarea>
              <div class="cube-code-options">
                <select id="cubeCodeLang" class="cube-select">
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="css">CSS Selector</option>
                </select>
                <button id="cubeGenerateCode" class="cube-btn-primary" type="button">✨ Generate</button>
              </div>
              <div id="cubeCodeOutput" class="cube-code-output" style="display: none;">
                <div class="cube-code-header">
                  <span>Generated Code</span>
                  <button id="cubeCopyCode" class="cube-icon-btn" type="button" title="Copy">📋</button>
                </div>
                <pre id="cubeGeneratedCode" class="cube-code-block"></pre>
              </div>
            </div>
          </div>
          
          <!-- Tools Mode -->
          <div class="cube-mode-content" id="cubeModeTools">
            <div class="cube-tools-grid">
              <button class="cube-tool-card" id="cubeToolSelector" type="button">
                <span class="cube-tool-icon">🎯</span>
                <span class="cube-tool-name">Selector Generator</span>
                <span class="cube-tool-desc">Create CSS/XPath selectors</span>
              </button>
              <button class="cube-tool-card" id="cubeToolWorkflow" type="button">
                <span class="cube-tool-icon">⚡</span>
                <span class="cube-tool-name">Workflow Builder</span>
                <span class="cube-tool-desc">Create automation workflows</span>
              </button>
              <button class="cube-tool-card" id="cubeToolSchema" type="button">
                <span class="cube-tool-icon">📋</span>
                <span class="cube-tool-name">Form Schema</span>
                <span class="cube-tool-desc">Generate form schemas</span>
              </button>
              <button class="cube-tool-card" id="cubeToolAnalyze" type="button">
                <span class="cube-tool-icon">🔍</span>
                <span class="cube-tool-name">Page Analyzer</span>
                <span class="cube-tool-desc">Analyze page structure</span>
              </button>
              <button class="cube-tool-card" id="cubeToolMacro" type="button">
                <span class="cube-tool-icon">🎬</span>
                <span class="cube-tool-name">Record Macro</span>
                <span class="cube-tool-desc">Record your actions</span>
              </button>
              <button class="cube-tool-card" id="cubeToolScreenshot" type="button">
                <span class="cube-tool-icon">📸</span>
                <span class="cube-tool-name">Screenshot</span>
                <span class="cube-tool-desc">Capture page/element</span>
              </button>
            </div>
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
      // Launcher events - click and drag
      if (this.launcher) {
        // Click event for quick taps
        this.launcher.addEventListener('click', (event) => {
          if (!this.launcherDragMoved) {
            event.stopPropagation();
            this.togglePanel();
          }
        });
        
        // Drag events
        this.launcher.addEventListener('mousedown', (event) => this.onLauncherPointerDown(event));
        this.launcher.addEventListener('touchstart', (event) => this.onLauncherPointerDown(event), { passive: false });
      }
      
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
      
      // ========== NEW EVENT BINDINGS ==========
      
      // Personality selector
      this.shadow.getElementById('cubePersonalityBtn')?.addEventListener('click', () => {
        this.togglePersonalityDropdown();
      });
      
      this.shadow.querySelectorAll('.cube-personality-option').forEach(option => {
        option.addEventListener('click', () => {
          const personalityId = option.getAttribute('data-personality');
          this.selectPersonality(personalityId);
        });
      });
      
      // Mode tabs
      this.shadow.querySelectorAll('.cube-mode-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const mode = tab.getAttribute('data-mode');
          this.switchMode(mode);
        });
      });
      
      // Nudge button
      this.shadow.getElementById('cubeFloatingNudge')?.addEventListener('click', () => {
        this.sendNudge();
      });
      
      // Tour button
      this.shadow.getElementById('cubeFloatingTour')?.addEventListener('click', () => {
        this.startTour();
      });
      
      // Voice button
      this.shadow.getElementById('cubeVoiceBtn')?.addEventListener('click', () => {
        this.toggleVoiceRecording();
      });
      
      // Emoji button
      this.shadow.getElementById('cubeEmojiBtn')?.addEventListener('click', () => {
        this.toggleEmojiPicker();
      });
      
      // Code generation
      this.shadow.getElementById('cubeGenerateCode')?.addEventListener('click', () => {
        this.generateCode();
      });
      
      this.shadow.getElementById('cubeCopyCode')?.addEventListener('click', () => {
        this.copyGeneratedCode();
      });
      
      // Tool cards
      this.shadow.getElementById('cubeToolSelector')?.addEventListener('click', () => {
        this.switchMode('chat');
        this.applyQuickPrompt('selectors');
      });
      
      this.shadow.getElementById('cubeToolWorkflow')?.addEventListener('click', () => {
        this.switchMode('chat');
        this.applyQuickPrompt('workflow');
      });
      
      this.shadow.getElementById('cubeToolSchema')?.addEventListener('click', () => {
        this.switchMode('chat');
        this.applyQuickPrompt('schema');
      });
      
      this.shadow.getElementById('cubeToolAnalyze')?.addEventListener('click', () => {
        this.switchMode('chat');
        this.applyQuickPrompt('analyze');
      });
      
      this.shadow.getElementById('cubeToolMacro')?.addEventListener('click', () => {
        this.startMacroRecording();
      });
      
      this.shadow.getElementById('cubeToolScreenshot')?.addEventListener('click', () => {
        this.takeScreenshot();
      });
      
      // Load saved personality
      this.loadSavedPersonality();
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

      if (!isExtensionContextValid()) {
        throw new Error('Extension context invalidated');
      }

      const result = await Promise.race([
        safeSendMessage(payload),
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
            launcherPosition: this.state.launcherPosition,
            attachments: this.state.attachments
          }
        });
      } catch (error) {
        console.warn('Failed to persist floating assistant state:', error);
      }
    }

    onLauncherPointerDown(event) {
      if (!this.launcher) {
        return;
      }
      
      event.preventDefault();
      this.launcherDragging = true;
      this.launcherDragMoved = false;
      this.launcherDragStartTime = Date.now();
      
      const rect = this.launcher.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      
      this.launcherDragOffset.x = clientX - rect.left;
      this.launcherDragOffset.y = clientY - rect.top;
      
      // Enable GPU acceleration during drag
      this.launcher.style.willChange = 'transform';
      this.launcher.style.transition = 'none';
      this.launcher.setAttribute('data-dragging', 'true');
      
      document.addEventListener('mousemove', this.handleLauncherPointerMove);
      document.addEventListener('touchmove', this.handleLauncherPointerMove, { passive: false });
      document.addEventListener('mouseup', this.handleLauncherPointerUp);
      document.addEventListener('touchend', this.handleLauncherPointerUp);
    }

    onLauncherPointerMove(event) {
      if (!this.launcherDragging || !this.launcher) {
        return;
      }

      event.preventDefault();
      this.launcherDragMoved = true;
      
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;

      // Use requestAnimationFrame for smooth 60fps updates
      if (this.launcherAnimationFrame) {
        cancelAnimationFrame(this.launcherAnimationFrame);
      }
      
      this.launcherAnimationFrame = requestAnimationFrame(() => {
        if (!this.launcher) return;
        
        let left = clientX - this.launcherDragOffset.x;
        let top = clientY - this.launcherDragOffset.y;

        const launcherWidth = this.launcher.offsetWidth;
        const launcherHeight = this.launcher.offsetHeight;
        const sidePanelOffset = this.sidePanelOffset || 0;
        
        left = Math.max(8, Math.min(left, window.innerWidth - launcherWidth - 8 - sidePanelOffset));
        top = Math.max(8, Math.min(top, window.innerHeight - launcherHeight - 8));

        // Use transform for GPU-accelerated movement during drag
        this.launcher.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        this.launcher.style.left = '0';
        this.launcher.style.top = '0';
        this.launcher.style.right = 'auto';
        this.launcher.style.bottom = 'auto';

        this.state.launcherPosition = { left, top };
      });
    }

    onLauncherPointerUp() {
      if (!this.launcher) {
        return;
      }
      
      // Cancel any pending animation frame
      if (this.launcherAnimationFrame) {
        cancelAnimationFrame(this.launcherAnimationFrame);
        this.launcherAnimationFrame = null;
      }
      
      this.launcher.setAttribute('data-dragging', 'false');
      
      document.removeEventListener('mousemove', this.handleLauncherPointerMove);
      document.removeEventListener('touchmove', this.handleLauncherPointerMove);
      document.removeEventListener('mouseup', this.handleLauncherPointerUp);
      document.removeEventListener('touchend', this.handleLauncherPointerUp);
      
      // Convert transform position to absolute position
      if (this.launcherDragMoved && this.state.launcherPosition) {
        const { left, top } = this.state.launcherPosition;
        this.launcher.style.transform = 'none';
        this.launcher.style.left = `${left}px`;
        this.launcher.style.top = `${top}px`;
        this.launcher.style.willChange = 'auto';
        this.persistState();
      } else {
        this.launcher.style.willChange = 'auto';
      }
      
      this.launcherDragging = false;
      // Reset dragMoved after a tiny delay to let click handler check it
      setTimeout(() => {
        this.launcherDragMoved = false;
      }, 50);
    }

    updateLauncherPosition() {
      if (!this.launcher) {
        return;
      }

      const hasValidPosition = this.state.launcherPosition && 
        typeof this.state.launcherPosition.left === 'number' &&
        !isNaN(this.state.launcherPosition.left) &&
        typeof this.state.launcherPosition.top === 'number' &&
        !isNaN(this.state.launcherPosition.top) &&
        this.state.launcherPosition.left >= 0 &&
        this.state.launcherPosition.top >= 0 &&
        this.state.launcherPosition.left < window.innerWidth &&
        this.state.launcherPosition.top < window.innerHeight;

      if (hasValidPosition) {
        const left = Math.max(8, Math.min(this.state.launcherPosition.left, window.innerWidth - 60));
        const top = Math.max(8, Math.min(this.state.launcherPosition.top, window.innerHeight - 60));
        this.launcher.style.left = `${left}px`;
        this.launcher.style.top = `${top}px`;
        this.launcher.style.right = 'auto';
        this.launcher.style.bottom = 'auto';
      } else {
        this.launcher.style.left = 'auto';
        this.launcher.style.top = 'auto';
        this.launcher.style.right = '24px';
        this.launcher.style.bottom = '24px';
        this.state.launcherPosition = null;
      }
    }

    setSidePanelOffset(isOpen) {
      this.state.sidePanelOpen = isOpen;
      
      if (!this.launcher) {
        return;
      }
      
      // Chrome side panel is typically 400px wide
      const sidePanelWidth = 420;
      const viewportWidth = window.innerWidth;
      const launcherWidth = this.launcher.offsetWidth || 52;
      const panelWidth = this.panel?.offsetWidth || 380;
      
      // Add CSS transition
      const transition = 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), left 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      this.launcher.style.transition = transition;
      if (this.panel) {
        this.panel.style.transition = transition;
      }
      
      if (isOpen) {
        // Calculate new position - ensure launcher stays visible
        const currentRight = viewportWidth - this.launcher.getBoundingClientRect().right;
        const newRight = Math.max(sidePanelWidth + 20, currentRight + sidePanelWidth);
        
        // Use right positioning for launcher
        this.launcher.style.left = 'auto';
        this.launcher.style.right = `${newRight}px`;
        
        // Position panel to the left of side panel
        if (this.panel) {
          const panelRight = Math.max(sidePanelWidth + 20, viewportWidth - this.panel.getBoundingClientRect().left - panelWidth + sidePanelWidth);
          this.panel.style.left = 'auto';
          this.panel.style.right = `${panelRight}px`;
        }
        
        // Store offset for drag calculations
        this.sidePanelOffset = sidePanelWidth;
      } else {
        // Reset to normal position (right side)
        if (!this.state.launcherPosition) {
          this.launcher.style.left = 'auto';
          this.launcher.style.right = '24px';
        } else {
          // Keep custom position but adjust for side panel closing
          const currentLeft = this.launcher.getBoundingClientRect().left;
          const maxLeft = viewportWidth - launcherWidth - 24;
          this.launcher.style.left = `${Math.min(currentLeft, maxLeft)}px`;
          this.launcher.style.right = 'auto';
        }
        
        if (this.panel) {
          if (!this.state.position) {
            this.panel.style.left = 'auto';
            this.panel.style.right = '20px';
          } else {
            const currentPanelLeft = this.panel.getBoundingClientRect().left;
            const maxPanelLeft = viewportWidth - panelWidth - 20;
            this.panel.style.left = `${Math.min(currentPanelLeft, maxPanelLeft)}px`;
            this.panel.style.right = 'auto';
          }
        }
        
        this.sidePanelOffset = 0;
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
      
      // Enable GPU acceleration during drag
      this.panel.style.willChange = 'transform';
      this.panel.style.transition = 'none';
      
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

      // Use requestAnimationFrame for smooth updates
      if (this.panelAnimationFrame) {
        cancelAnimationFrame(this.panelAnimationFrame);
      }
      
      this.panelAnimationFrame = requestAnimationFrame(() => {
        if (!this.panel) return;
        
        let left = clientX - this.dragOffset.x;
        let top = clientY - this.dragOffset.y;
        
        const sidePanelOffset = this.sidePanelOffset || 0;

        left = Math.max(16, Math.min(left, window.innerWidth - this.panel.offsetWidth - 16 - sidePanelOffset));
        top = Math.max(16, Math.min(top, window.innerHeight - this.panel.offsetHeight - 16));

        // Use transform for GPU-accelerated movement
        this.panel.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        this.panel.style.left = '0';
        this.panel.style.top = '0';
        this.panel.style.right = 'auto';
        this.panel.style.bottom = 'auto';

        this.state.position = { left, top };
      });
    }

    onPointerUp() {
      // Cancel any pending animation frame
      if (this.panelAnimationFrame) {
        cancelAnimationFrame(this.panelAnimationFrame);
        this.panelAnimationFrame = null;
      }
      
      this.dragging = false;
      document.removeEventListener('mousemove', this.handlePointerMove);
      document.removeEventListener('touchmove', this.handlePointerMove);
      document.removeEventListener('mouseup', this.handlePointerUp);
      document.removeEventListener('touchend', this.handlePointerUp);
      
      // Convert transform position to absolute position
      if (this.panel && this.state.position) {
        const { left, top } = this.state.position;
        this.panel.style.transform = 'none';
        this.panel.style.left = `${left}px`;
        this.panel.style.top = `${top}px`;
        this.panel.style.willChange = 'auto';
      }
      
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

    // ========== AI PERSONALITIES ==========
    
    personalities = {
      cipher: {
        id: 'cipher',
        name: 'CIPHER',
        avatar: '🔮',
        greeting: 'CIPHER system active. I am your main AI assistant. How can I optimize your workflow today?',
        style: 'professional'
      },
      nexus: {
        id: 'nexus',
        name: 'NEXUS',
        avatar: '⚡',
        greeting: 'NEXUS online. Code and systems architecture specialist. Give me a technical problem!',
        style: 'enthusiastic'
      },
      sentinel: {
        id: 'sentinel',
        name: 'SENTINEL',
        avatar: '🛡️',
        greeting: 'SENTINEL activated. Data protection and analysis at your service.',
        style: 'methodical'
      },
      forge: {
        id: 'forge',
        name: 'FORGE',
        avatar: '🔥',
        greeting: 'FORGE ready to create. Design, content, automation - let\'s build something epic!',
        style: 'casual'
      }
    };
    
    currentPersonality = this.personalities.cipher;
    
    togglePersonalityDropdown() {
      const dropdown = this.shadow.getElementById('cubePersonalityDropdown');
      if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      }
    }
    
    selectPersonality(personalityId) {
      const personality = this.personalities[personalityId];
      if (!personality) return;
      
      this.currentPersonality = personality;
      
      // Update UI
      const avatar = this.shadow.getElementById('cubePersonalityAvatar');
      const name = this.shadow.getElementById('cubePersonalityName');
      const desc = this.shadow.getElementById('cubePersonalityDesc');
      
      if (avatar) avatar.textContent = personality.avatar;
      if (name) name.textContent = personality.name;
      if (desc) desc.textContent = personality.style;
      
      // Update active state
      this.shadow.querySelectorAll('.cube-personality-option').forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('data-personality') === personalityId);
      });
      
      // Hide dropdown
      const dropdown = this.shadow.getElementById('cubePersonalityDropdown');
      if (dropdown) dropdown.style.display = 'none';
      
      // Show greeting
      this.appendMessage('assistant', personality.greeting);
      
      // Save preference
      try {
        chrome.storage.local.set({ cube_ai_personality: personalityId });
      } catch (e) { /* Storage unavailable */ }
    }
    
    async loadSavedPersonality() {
      try {
        const result = await chrome.storage.local.get(['cube_ai_personality']);
        if (result.cube_ai_personality && this.personalities[result.cube_ai_personality]) {
          const p = this.personalities[result.cube_ai_personality];
          this.currentPersonality = p;
          
          const avatar = this.shadow.getElementById('cubePersonalityAvatar');
          const name = this.shadow.getElementById('cubePersonalityName');
          
          if (avatar) avatar.textContent = p.avatar;
          if (name) name.textContent = p.name;
          
          this.shadow.querySelectorAll('.cube-personality-option').forEach(opt => {
            opt.classList.toggle('active', opt.getAttribute('data-personality') === result.cube_ai_personality);
          });
        }
      } catch (e) { /* Storage unavailable */ }
    }
    
    // ========== MODE SWITCHING ==========
    
    switchMode(mode) {
      // Update tabs
      this.shadow.querySelectorAll('.cube-mode-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-mode') === mode);
      });
      
      // Update content
      const modeMap = {
        'chat': 'cubeModeChat',
        'code': 'cubeModeCode',
        'tools': 'cubeModeTools'
      };
      
      Object.entries(modeMap).forEach(([m, id]) => {
        const el = this.shadow.getElementById(id);
        if (el) el.classList.toggle('active', m === mode);
      });
    }
    
    // ========== NUDGE/ZUMBIDO (MSN STYLE) ==========
    
    sendNudge() {
      // Play sound
      this.playNudgeSound();
      
      // Shake animation
      if (this.panel) {
        this.panel.classList.add('nudge');
        setTimeout(() => this.panel.classList.remove('nudge'), 500);
      }
      
      // Show message
      this.appendSystemMessage('💥 You sent a nudge!');
      
      // Send to peer if connected
      this.broadcastNudge();
    }
    
    receiveNudge(fromUser) {
      this.playNudgeSound();
      if (this.panel) {
        this.panel.classList.add('nudge');
        setTimeout(() => this.panel.classList.remove('nudge'), 500);
      }
      this.appendSystemMessage(`💥 ${fromUser || 'Someone'} sent you a nudge!`);
    }
    
    playNudgeSound() {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (e) { /* Audio unavailable */ }
    }
    
    broadcastNudge() {
      if (!isExtensionContextValid()) return;
      safeSendMessage({
        type: 'BROADCAST_NUDGE',
        source: 'floating-assistant'
      }).catch(() => { /* No connection */ });
    }
    
    // ========== VOICE RECORDING ==========
    
    isRecordingVoice = false;
    mediaRecorder = null;
    audioChunks = [];
    
    async toggleVoiceRecording() {
      const voiceBtn = this.shadow.getElementById('cubeVoiceBtn');
      
      if (this.isRecordingVoice) {
        this.stopVoiceRecording();
        if (voiceBtn) voiceBtn.classList.remove('recording');
      } else {
        try {
          await this.startVoiceRecording();
          if (voiceBtn) voiceBtn.classList.add('recording');
        } catch (e) {
          this.appendSystemMessage('🎤 Microphone access denied');
        }
      }
    }
    
    async startVoiceRecording() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (e) => {
        this.audioChunks.push(e.data);
      };
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.processVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      this.mediaRecorder.start();
      this.isRecordingVoice = true;
      this.appendSystemMessage('🎤 Recording... Click again to stop');
    }
    
    stopVoiceRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.isRecordingVoice = false;
    }
    
    async processVoiceMessage(audioBlob) {
      // For now, just indicate voice was recorded
      // In production, this would go to speech-to-text
      this.appendMessage('user', '🎤 [Voice message recorded]');
      this.appendSystemMessage('Voice transcription coming soon...');
    }
    
    // ========== EMOJI PICKER ==========
    
    toggleEmojiPicker() {
      // Simple emoji insertion for now
      const emojis = ['😊', '👍', '❤️', '🎉', '🔥', '⚡', '🚀', '💯', '✨', '🤖'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      
      if (this.input) {
        this.input.value += randomEmoji;
        this.input.focus();
      }
    }
    
    // ========== CODE GENERATION ==========
    
    async generateCode() {
      const prompt = this.shadow.getElementById('cubeCodePrompt')?.value.trim();
      const lang = this.shadow.getElementById('cubeCodeLang')?.value || 'javascript';
      
      if (!prompt) {
        this.appendSystemMessage('Please describe what code you need');
        return;
      }
      
      const btn = this.shadow.getElementById('cubeGenerateCode');
      const output = this.shadow.getElementById('cubeCodeOutput');
      const codeBlock = this.shadow.getElementById('cubeGeneratedCode');
      
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Generating...';
      }
      
      try {
        const code = await this.requestCodeGeneration(prompt, lang);
        if (codeBlock) codeBlock.textContent = code;
        if (output) output.style.display = 'block';
      } catch (e) {
        // Fallback template
        const template = this.getCodeTemplate(prompt, lang);
        if (codeBlock) codeBlock.textContent = template;
        if (output) output.style.display = 'block';
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '✨ Generate';
        }
      }
    }
    
    async requestCodeGeneration(prompt, language) {
      if (!isExtensionContextValid()) {
        throw new Error('Extension context invalidated');
      }
      
      const result = await safeSendMessage({
        type: 'AI_CODE_REQUEST',
        prompt,
        language
      });
      
      if (result?.code) return result.code;
      throw new Error('No code generated');
    }
    
    getCodeTemplate(prompt, lang) {
      const templates = {
        javascript: `// Task: ${prompt}
// Generated by CUBE Nexum AI

async function automationTask() {
  try {
    const elements = document.querySelectorAll('[data-testid], [id], [name]');
    console.log(\`Found \${elements.length} elements\`);
    return { success: true, count: elements.length };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

automationTask();`,
        python: `# Task: ${prompt}
# Generated by CUBE Nexum AI

from selenium import webdriver
from selenium.webdriver.common.by import By

def automation_task(driver):
    try:
        elements = driver.find_elements(By.CSS_SELECTOR, '[data-testid], [id], [name]')
        print(f"Found {len(elements)} elements")
        return {"success": True, "count": len(elements)}
    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "error": str(e)}`,
        css: `/* Selector for: ${prompt} */
.target-element,
[data-testid="target"],
#target-id {
  /* Add your styles here */
}`
      };
      
      return templates[lang] || templates.javascript;
    }
    
    copyGeneratedCode() {
      const code = this.shadow.getElementById('cubeGeneratedCode')?.textContent;
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          this.appendSystemMessage('📋 Code copied to clipboard');
        });
      }
    }
    
    // ========== TOOLS ==========
    
    startMacroRecording() {
      if (!isExtensionContextValid()) {
        this.appendSystemMessage('Extension needs refresh');
        return;
      }
      safeSendMessage({ type: 'START_MACRO_RECORDING' })
        .then(() => this.appendSystemMessage('🎬 Macro recording started...'))
        .catch(() => this.appendSystemMessage('Could not start recording'));
    }
    
    takeScreenshot() {
      if (!isExtensionContextValid()) {
        this.appendSystemMessage('Extension needs refresh');
        return;
      }
      safeSendMessage({ type: 'TAKE_SCREENSHOT' })
        .then(() => this.appendSystemMessage('📸 Screenshot captured!'))
        .catch(() => this.appendSystemMessage('Could not take screenshot'));
    }
    
    startTour() {
      this.appendSystemMessage('🎓 Starting guided tour...');
      
      // Create floating tour menu
      const existingMenu = this.shadow.querySelector('.cube-tour-menu');
      if (existingMenu) {
        existingMenu.remove();
        return;
      }
      
      const menu = document.createElement('div');
      menu.className = 'cube-tour-menu';
      menu.innerHTML = `
        <div style="
          background: var(--cube-bg-card, #1e293b);
          border: 1px solid rgba(124, 58, 237, 0.3);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          max-width: 280px;
          position: absolute;
          top: 60px;
          left: 12px;
          right: 12px;
          z-index: 100;
        ">
          <div style="font-size: 14px; font-weight: 600; color: #f9fafb; margin-bottom: 12px;">
            🎓 Quick Guides
          </div>
          <button class="cube-tour-item" data-tour="basics" style="
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 10px 12px;
            background: rgba(124, 58, 237, 0.1);
            border: 1px solid rgba(124, 58, 237, 0.2);
            border-radius: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            color: #e5e7eb;
            font-size: 13px;
            text-align: left;
          ">
            <span>💬</span>
            <div>
              <div style="font-weight: 500;">Chat Basics</div>
              <div style="font-size: 11px; color: #9ca3af;">Learn to use the AI assistant</div>
            </div>
          </button>
          <button class="cube-tour-item" data-tour="tools" style="
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 10px 12px;
            background: rgba(124, 58, 237, 0.1);
            border: 1px solid rgba(124, 58, 237, 0.2);
            border-radius: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            color: #e5e7eb;
            font-size: 13px;
            text-align: left;
          ">
            <span>🛠️</span>
            <div>
              <div style="font-weight: 500;">Tools & Actions</div>
              <div style="font-size: 11px; color: #9ca3af;">Explore automation tools</div>
            </div>
          </button>
          <button class="cube-tour-item" data-tour="personalities" style="
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 10px 12px;
            background: rgba(124, 58, 237, 0.1);
            border: 1px solid rgba(124, 58, 237, 0.2);
            border-radius: 8px;
            cursor: pointer;
            color: #e5e7eb;
            font-size: 13px;
            text-align: left;
          ">
            <span>🎭</span>
            <div>
              <div style="font-weight: 500;">AI Personalities</div>
              <div style="font-size: 11px; color: #9ca3af;">Choose your AI assistant</div>
            </div>
          </button>
        </div>
      `;
      
      this.panel.appendChild(menu);
      
      // Handle tour item clicks
      menu.querySelectorAll('.cube-tour-item').forEach(item => {
        item.addEventListener('click', () => {
          const tourType = item.getAttribute('data-tour');
          menu.remove();
          this.showTourSteps(tourType);
        });
      });
      
      // Close when clicking outside
      setTimeout(() => {
        const closeHandler = (e) => {
          if (!menu.contains(e.target)) {
            menu.remove();
            this.shadow.removeEventListener('click', closeHandler);
          }
        };
        this.shadow.addEventListener('click', closeHandler);
      }, 100);
    }
    
    showTourSteps(tourType) {
      const tours = {
        basics: [
          '1️⃣ Type your question in the input box below',
          '2️⃣ Use quick prompts like "Analyze" or "Explain"',
          '3️⃣ Toggle dark/light theme with the header controls',
          '4️⃣ Drag the panel by the header to reposition'
        ],
        tools: [
          '1️⃣ Switch to "Tools" tab for quick actions',
          '2️⃣ "Selector" generates CSS selectors for elements',
          '3️⃣ "Workflow" creates automation sequences',
          '4️⃣ "Screenshot" captures the current page'
        ],
        personalities: [
          '1️⃣ Click the avatar button to see AI personalities',
          '2️⃣ CIPHER - Best for automation & analysis',
          '3️⃣ NEXUS - Specialized in code & architecture',
          '4️⃣ SENTINEL - Focus on data & security'
        ]
      };
      
      const steps = tours[tourType] || tours.basics;
      const message = `**${tourType.charAt(0).toUpperCase() + tourType.slice(1)} Guide:**\n\n${steps.join('\n\n')}`;
      this.appendAssistantMessage(message);
    }

    generateMockResponse(message) {
      const normalized = message.toLowerCase();
      const personality = this.personalities[this.currentPersonality] || this.personalities.cipher;
      
      // Workflow-related queries
      if (normalized.includes('workflow') || normalized.includes('automate') || normalized.includes('automatizar')) {
        return `${personality.avatar} Here's a workflow outline:\n\n` +
               `1️⃣ **Scan** - Detect all forms and capture metadata\n` +
               `2️⃣ **Map** - Create selectors with fallback strategies\n` +
               `3️⃣ **Record** - Capture macro steps for replay\n` +
               `4️⃣ **Validate** - Test and verify the automation\n` +
               `5️⃣ **Export** - Save for reuse\n\n` +
               `Which step would you like me to expand?`;
      }
      
      // Selector-related queries
      if (normalized.includes('selector') || normalized.includes('css') || normalized.includes('xpath')) {
        return `${personality.avatar} **Selector Best Practices:**\n\n` +
               `✅ Use data attributes: \`[data-testid="email"]\`\n` +
               `✅ Use aria-labels: \`[aria-label="Email input"]\`\n` +
               `✅ Prefer semantic: \`form.contact input[name="email"]\`\n` +
               `❌ Avoid positional: \`div > div:nth-child(3)\`\n\n` +
               `Want me to analyze the current page for optimal selectors?`;
      }
      
      // Schema-related queries
      if (normalized.includes('schema') || normalized.includes('json') || normalized.includes('structure')) {
        return `${personality.avatar} **Schema Example:**\n\n` +
               `\`\`\`json\n` +
               `{\n` +
               `  "form": "contact",\n` +
               `  "fields": [\n` +
               `    { "name": "fullName", "type": "text", "required": true },\n` +
               `    { "name": "email", "type": "email", "required": true },\n` +
               `    { "name": "message", "type": "textarea", "required": false }\n` +
               `  ]\n` +
               `}\n` +
               `\`\`\`\n\n` +
               `Should I generate a schema for this page?`;
      }
      
      // Code-related queries
      if (normalized.includes('code') || normalized.includes('script') || normalized.includes('function')) {
        return `${personality.avatar} I can generate code for:\n\n` +
               `🔹 **JavaScript** - DOM manipulation, automation\n` +
               `🔹 **CSS Selectors** - Element targeting\n` +
               `🔹 **XPath** - Complex path expressions\n` +
               `🔹 **Python** - Scraping scripts\n\n` +
               `What would you like me to create?`;
      }
      
      // Help/capabilities queries
      if (normalized.includes('help') || normalized.includes('ayuda') || normalized.includes('what can')) {
        return `${personality.avatar} **${personality.name} Capabilities:**\n\n` +
               `🔮 Generate workflows from descriptions\n` +
               `🎯 Create optimized selectors\n` +
               `📊 Analyze page structure & forms\n` +
               `💻 Generate automation code\n` +
               `📋 Create JSON schemas\n` +
               `🔍 Detect automation opportunities\n\n` +
               `Just describe what you need!`;
      }
      
      // Greeting
      if (normalized.includes('hello') || normalized.includes('hi') || normalized.includes('hola')) {
        return personality.greeting;
      }
      
      // Default contextual response
      return `${personality.avatar} I can help you with:\n\n` +
             `• **"workflow"** - Create automation workflows\n` +
             `• **"selector"** - Generate CSS/XPath selectors\n` +
             `• **"schema"** - Create JSON schemas\n` +
             `• **"code"** - Generate scripts\n` +
             `• **"help"** - See all capabilities\n\n` +
             `What would you like to explore?`;
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
      let consecutiveLowFPS = 0;

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

          // Only warn if FPS is consistently low (not just initial measurements)
          // Skip first 5 seconds to allow page to stabilize
          logThrottle++;
          if (logThrottle > 5) {
            if (fps < 10) {
              consecutiveLowFPS++;
              // Only optimize after 3 consecutive low FPS readings (serious issue)
              if (consecutiveLowFPS >= 3) {
                // Silent optimization - no console spam
                this.optimizePerformance();
                consecutiveLowFPS = 0;
              }
            } else {
              consecutiveLowFPS = 0;
            }
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
        const observer = new PerformanceObserver((list) => {
          // Monitor long tasks silently - no console spam
          // Data is available in this.metrics if needed for debugging
          for (const entry of list.getEntries()) {
            if (entry.duration > 500) {
              // Only track very long tasks (>500ms)
              this.metrics.longTasks = (this.metrics.longTasks || 0) + 1;
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
      this.initialized = false;
    }

    async initialize() {
      if (this.initialized) return;

      console.log('🏆 Initializing Elite Coordinator...');

      try {
        // Analyze page context
        const context = this.contextAnalyzer.analyze();

        // Start performance monitoring
        if (ELITE_STATE.optimization.resourceMonitoring) {
          this.performanceMonitor.start();
        }

        // Setup cross-tab communication
        this.setupCrossTabCommunication();

        // Setup advanced error handling
        this.setupErrorHandling();

        // Setup intelligent service suggestions
        this.setupServiceSuggestions(context);

        this.initialized = true;
        console.log('✅ Elite Coordinator initialized');

        // Send telemetry
        this.sendTelemetry({
          event: 'elite_initialized',
          context: context
        });
      } catch (error) {
        console.error('❌ Elite Coordinator initialization failed:', error);
        this.handleError(error);
      }
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
        // Ignore extension context invalidation errors
        const errorMsg = event.error?.message || event.message || '';
        if (errorMsg.includes('Extension context invalidated')) {
          return;
        }
        this.handleError(event.error || event.message);
        ELITE_STATE.performance.errors++;
      });

      window.addEventListener('unhandledrejection', (event) => {
        // Ignore extension context invalidation errors
        const errorMsg = event.reason?.message || String(event.reason) || '';
        if (errorMsg.includes('Extension context invalidated')) {
          return;
        }
        this.handleError(event.reason);
        ELITE_STATE.performance.errors++;
      });
    }

    handleError(error) {
      // Skip if extension context is invalidated
      const errorMsg = error?.message || String(error) || '';
      if (errorMsg.includes('Extension context invalidated')) {
        console.debug('Extension context invalidated - skipping error handler');
        return;
      }
      
      console.error('🚨 Elite Error Handler:', error);

      // Track error (only if context is valid)
      if (isExtensionContextValid()) {
        this.analyticsTracker.trackAction('error', {
          message: error.message || error,
          stack: error.stack,
          context: ELITE_STATE.context
        });
      }

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
      if (!isExtensionContextValid()) {
        return;
      }
      
      safeSendMessage({
        type: 'elite-suggestions',
        suggestions: suggestions
      }).catch(() => {
        // Side panel might not be open
      });
    }

    sendTelemetry(data) {
      // Send anonymous usage data to background script
      if (!isExtensionContextValid()) {
        return;
      }
      
      safeSendMessage({
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
        context: ELITE_STATE.context,
        performance: this.performanceMonitor.getReport(),
        analytics: this.analyticsTracker.getUsageReport()
      };
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

    // Check if extension context is still valid
    if (!isExtensionContextValid()) {
      return;
    }

    safeSendMessage({
      type: 'CONTENT_SCRIPT_READY',
      version: '6.0.1-elite',
      services: services,
      url: window.location.href,
      timestamp: Date.now()
    }).then(response => {
      if (response !== null) {
        console.log('✅ Ready signal sent to background service', response);
      }
    }).catch(error => {
      // Don't retry if context is invalidated
      if (!isExtensionContextValid()) {
        return;
      }
      console.warn('⚠️ Failed to send ready signal:', error?.message);
      // Retry after 1 second
      setTimeout(sendReadySignal, 1000);
    });
  }

  // Send ready signal after initialization
  setTimeout(sendReadySignal, 1000);

  // Re-send signal on page visibility change (tab becomes active)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isExtensionContextValid()) {
      sendReadySignal();
    }
  });

  // Pre-initialize floating assistant so it's ready for sidepanel messages
  setTimeout(() => {
    ensureFloatingAssistant().catch(err => {
      console.debug('Floating assistant pre-init deferred:', err.message);
    });
  }, 500);

  console.log('🏆 CUBE Nexum Connect v7 - Elite Orchestration Layer ready');

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

    if (message.type === 'SIDEPANEL_TOGGLED') {
      console.log('📱 Sidepanel toggled:', message.isOpen ? 'OPEN' : 'CLOSED');
      ensureFloatingAssistant()
        .then((assistant) => {
          assistant.setSidePanelOffset(message.isOpen);
          console.log('✅ Floating assistant offset applied');
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error('❌ Failed to set sidepanel offset:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    if (message.type === 'DETECT_DOCUMENTS') {
      try {
        const documents = detectDocumentsOnPage(message.options || {});
        sendResponse({ success: true, documents });
      } catch (error) {
        sendResponse({ success: false, error: error.message, documents: [] });
      }
      return true;
    }

    if (message.type === 'GET_PAGE_INFO') {
      try {
        const pageInfo = getPageInfo();
        sendResponse({ success: true, pageInfo });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    if (message.type === 'LENDINGPAD_BATCH_DOWNLOAD') {
      try {
        const documents = detectDocumentsOnPage({ types: ['pdf', 'excel', 'word', 'csv'] });
        const downloadableUrls = documents
          .filter(doc => doc.url && doc.url.startsWith('http'))
          .map(doc => doc.url);
        
        sendResponse({ 
          success: true, 
          count: downloadableUrls.length,
          urls: downloadableUrls 
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    if (message.type === 'LENDINGPAD_EXTRACT_DATA') {
      try {
        const data = extractLoanDataFromPage();
        sendResponse({ success: true, data });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    if (message.type === 'EXECUTE_AUTOMATION') {
      try {
        const result = executeAutomationCommand(message.command);
        sendResponse({ success: true, output: result });
      } catch (error) {
        sendResponse({ success: false, error: error.message, output: `Error: ${error.message}` });
      }
      return true;
    }

    // DETECT_FORMS handler
    if (message.type === 'DETECT_FORMS') {
      try {
        const forms = detectFormsOnPage();
        sendResponse({ 
          success: true, 
          count: forms.length,
          forms: forms
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message, count: 0, forms: [] });
      }
      return true;
    }

    // AUTOFILL_FORM handler
    if (message.type === 'AUTOFILL_FORM') {
      try {
        const result = autofillForm(message.data || {});
        sendResponse({ 
          success: true, 
          fieldsFound: result.fieldsFound,
          fieldsFilled: result.fieldsFilled
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // START_MACRO_RECORDING handler
    if (message.type === 'START_MACRO_RECORDING') {
      try {
        console.log('🎬 START_MACRO_RECORDING received');
        console.log('🎬 CubeMacroRecorder available:', !!window.CubeMacroRecorder);
        if (window.CubeMacroRecorder) {
          window.CubeMacroRecorder.start();
          console.log('🎬 Recording started successfully');
          sendResponse({ success: true });
        } else {
          console.log('🎬 ERROR: Macro recorder not available');
          sendResponse({ success: false, error: 'Macro recorder not available' });
        }
      } catch (error) {
        console.error('🎬 ERROR starting recording:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // STOP_MACRO_RECORDING handler
    if (message.type === 'STOP_MACRO_RECORDING') {
      try {
        console.log('⏹️ STOP_MACRO_RECORDING received');
        if (window.CubeMacroRecorder) {
          const macro = window.CubeMacroRecorder.stop();
          console.log('⏹️ Recording stopped, steps:', macro?.steps?.length || 0);
          sendResponse({ success: true, macro });
        } else {
          sendResponse({ success: false, error: 'Macro recorder not available' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // GET_MACRO_STEP_COUNT handler - for real-time step count updates
    if (message.type === 'GET_MACRO_STEP_COUNT') {
      try {
        console.log('📊 GET_MACRO_STEP_COUNT received');
        if (window.CubeMacroRecorder) {
          const count = window.CubeMacroRecorder.getStepCount();
          console.log('📊 Returning step count:', count);
          sendResponse({ success: true, count });
        } else {
          console.log('📊 CubeMacroRecorder not available');
          sendResponse({ success: false, count: 0 });
        }
      } catch (error) {
        console.error('📊 Error getting step count:', error);
        sendResponse({ success: false, count: 0 });
      }
      return true;
    }

    // PLAY_MACRO handler
    if (message.type === 'PLAY_MACRO') {
      try {
        console.log('▶️ PLAY_MACRO received:', message.macro?.name);
        if (window.CubeMacroPlayer && message.macro) {
          // Handle async play properly
          window.CubeMacroPlayer.play(message.macro).then(result => {
            console.log('▶️ Macro playback result:', result);
            sendResponse({ success: result.success, ...result });
          }).catch(error => {
            console.error('▶️ Macro playback error:', error);
            sendResponse({ success: false, error: error.message });
          });
          return true; // Keep channel open for async response
        } else {
          const error = !window.CubeMacroPlayer 
            ? 'Macro player not available' 
            : 'No macro provided';
          console.error('▶️ PLAY_MACRO error:', error);
          sendResponse({ success: false, error });
        }
      } catch (error) {
        console.error('▶️ PLAY_MACRO exception:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // CAPTURE_SCREENSHOT handler
    if (message.type === 'CAPTURE_SCREENSHOT') {
      try {
        if (window.CubeScreenCapture) {
          window.CubeScreenCapture.capture(message.mode || 'visible').then(result => {
            sendResponse({ success: true, ...result });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
        } else {
          sendResponse({ success: false, error: 'Screen capture not available' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // START_SCREEN_RECORDING handler
    if (message.type === 'START_SCREEN_RECORDING') {
      try {
        if (window.CubeScreenCapture) {
          window.CubeScreenCapture.startRecording({ audio: message.audio || false }).then(() => {
            sendResponse({ success: true });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true;
        } else {
          sendResponse({ success: false, error: 'Screen capture not available' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // STOP_SCREEN_RECORDING handler
    if (message.type === 'STOP_SCREEN_RECORDING') {
      try {
        if (window.CubeScreenCapture) {
          window.CubeScreenCapture.stopRecording();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Screen capture not available' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // POPUP COMPATIBILITY HANDLERS (lowercase message types)
    // These handlers support the popup-enterprise.js message format
    // ═══════════════════════════════════════════════════════════════════════════

    // detect-forms (popup format)
    if (message.type === 'detect-forms') {
      try {
        const forms = detectFormsOnPage();
        sendResponse({ 
          success: true, 
          count: forms.length,
          forms: forms
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message, count: 0, forms: [] });
      }
      return true;
    }

    // detect-pdfs handler
    if (message.type === 'detect-pdfs') {
      try {
        const documents = detectDocumentsOnPage({ types: ['pdf'] });
        const pdfs = documents.filter(doc => doc.type === 'pdf' || doc.extension === 'pdf');
        sendResponse({ 
          success: true, 
          count: pdfs.length,
          pdfs: pdfs.map(pdf => ({
            url: pdf.url || pdf.href,
            name: pdf.name || pdf.title || 'Unnamed PDF',
            size: pdf.size || 'Unknown',
            extension: 'pdf'
          }))
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message, count: 0, pdfs: [] });
      }
      return true;
    }

    // detect-documents handler (popup format)
    if (message.type === 'detect-documents') {
      try {
        const documents = detectDocumentsOnPage(message.options || {});
        sendResponse({ 
          success: true, 
          count: documents.length,
          documents: documents
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message, count: 0, documents: [] });
      }
      return true;
    }

    // run-autofill handler
    if (message.type === 'run-autofill') {
      try {
        const result = autofillForm(message.data || message.profile || {});
        sendResponse({ 
          success: true, 
          fieldsFound: result.fieldsFound,
          fieldsFilled: result.fieldsFilled,
          filled: result.fieldsFilled,
          total: result.fieldsFound
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // run-intelligent-autofill handler
    if (message.type === 'run-intelligent-autofill') {
      try {
        const forms = detectFormsOnPage();
        const targetForm = forms.length > 0 ? forms[0] : null;
        
        if (!targetForm) {
          sendResponse({ 
            success: false, 
            error: 'No forms detected on page',
            results: { filled: 0, total: 0, confidence: 0 }
          });
          return true;
        }

        // Use smart autofill engine if available
        let result;
        if (window.smartAutofillEngineV6) {
          result = window.smartAutofillEngineV6.intelligentFill({
            formType: message.formType || 'auto',
            confidence: true
          });
        } else {
          result = autofillForm({
            formType: message.formType || 'auto'
          });
        }
        
        sendResponse({ 
          success: true, 
          results: {
            filled: result.fieldsFilled || result.filled || 0,
            total: result.fieldsFound || result.total || 0,
            confidence: result.confidence || 0.85
          }
        });
      } catch (error) {
        sendResponse({ 
          success: false, 
          error: error.message,
          results: { filled: 0, total: 0, confidence: 0 }
        });
      }
      return true;
    }

    // run-ocr handler
    if (message.type === 'run-ocr') {
      try {
        const language = message.language || 'eng';
        
        // Use OCR engine if available
        if (window.ocrEngineTesseract || window.TesseractOCR) {
          const ocrEngine = window.ocrEngineTesseract || window.TesseractOCR;
          ocrEngine.recognizePage({ language }).then(ocrResult => {
            sendResponse({ 
              success: true, 
              results: ocrResult.results || [],
              summary: `Extracted ${ocrResult.results?.length || 0} text blocks`,
              text: ocrResult.text || ''
            });
          }).catch(err => {
            sendResponse({ success: false, error: err.message });
          });
          return true;
        } else {
          // Fallback: extract visible text from page
          const pageText = document.body.innerText.substring(0, 5000);
          sendResponse({ 
            success: true, 
            results: [{ text: pageText, confidence: 0.7 }],
            summary: 'Extracted visible text (OCR engine not available)',
            text: pageText
          });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // parse-pdf handler
    if (message.type === 'parse-pdf') {
      try {
        const pdfUrl = message.url || message.pdfUrl;
        
        if (!pdfUrl) {
          sendResponse({ success: false, error: 'No PDF URL provided' });
          return true;
        }

        // Use universal document engine if available
        if (window.universalDocumentEngineV6) {
          window.universalDocumentEngineV6.parseDocument(pdfUrl).then(parseResult => {
            sendResponse({ 
              success: true, 
              data: parseResult.data || {},
              fields: parseResult.fields || [],
              text: parseResult.text || '',
              metadata: parseResult.metadata || {}
            });
          }).catch(err => {
            sendResponse({ success: false, error: err.message });
          });
          return true;
        } else {
          sendResponse({ 
            success: false, 
            error: 'PDF parser not available',
            data: {},
            fields: []
          });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // upload-figure-zip handler
    if (message.type === 'upload-figure-zip') {
      try {
        if (window.universalDocumentEngineV6 && message.zipData) {
          window.universalDocumentEngineV6.processZipBundle(message.zipData).then(result => {
            sendResponse({ 
              success: true, 
              result: result
            });
          }).catch(err => {
            sendResponse({ success: false, error: err.message });
          });
          return true;
        } else {
          sendResponse({ 
            success: false, 
            error: 'Document engine not available or no ZIP data provided'
          });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // ping handler for content script status check
    if (message.type === 'ping') {
      sendResponse({ 
        success: true, 
        status: 'ready',
        version: '7.0.1',
        services: {
          macroRecorder: !!window.CubeMacroRecorder,
          macroPlayer: !!window.CubeMacroPlayer,
          screenCapture: !!window.CubeScreenCapture,
          documentEngine: !!window.universalDocumentEngineV6,
          autofillEngine: !!window.smartAutofillEngineV6,
          ocrEngine: !!(window.ocrEngineTesseract || window.TesseractOCR)
        }
      });
      return true;
    }

    // start-voice handler
    if (message.type === 'start-voice') {
      try {
        if (window.CubeVoiceControl) {
          window.CubeVoiceControl.start();
          sendResponse({ success: true, status: 'listening' });
        } else {
          sendResponse({ success: false, error: 'Voice control not available' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // stop-voice handler
    if (message.type === 'stop-voice') {
      try {
        if (window.CubeVoiceControl) {
          window.CubeVoiceControl.stop();
          sendResponse({ success: true, status: 'stopped' });
        } else {
          sendResponse({ success: false, error: 'Voice control not available' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // update-ai-config handler
    if (message.type === 'update-ai-config') {
      try {
        // Store AI configuration
        chrome.storage.local.set({
          aiConfig: {
            apiKey: message.config?.apiKey,
            model: message.config?.model,
            smartMapping: message.config?.smartMapping
          }
        });
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    // update-autofill-profile handler
    if (message.type === 'update-autofill-profile') {
      try {
        chrome.storage.local.set({
          autofillProfile: message.profile
        });
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    return false;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM DETECTION - Advanced form field detection
  // ═══════════════════════════════════════════════════════════════════════════

  function detectFormsOnPage() {
    const forms = [];
    const allForms = document.querySelectorAll('form');
    
    allForms.forEach((form, index) => {
      const fields = [];
      const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
      
      inputs.forEach(input => {
        const label = getFieldLabel(input);
        fields.push({
          type: input.tagName.toLowerCase(),
          inputType: input.type || 'text',
          name: input.name || input.id || '',
          label: label,
          required: input.required,
          value: input.value || ''
        });
      });
      
      forms.push({
        index,
        id: form.id || '',
        name: form.name || '',
        action: form.action || '',
        method: form.method || 'get',
        fields: fields,
        fieldCount: fields.length
      });
    });
    
    // Also detect orphan inputs (not in forms)
    const orphanInputs = document.querySelectorAll('input:not(form input), select:not(form select), textarea:not(form textarea)');
    if (orphanInputs.length > 0) {
      const fields = [];
      orphanInputs.forEach(input => {
        if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return;
        const label = getFieldLabel(input);
        fields.push({
          type: input.tagName.toLowerCase(),
          inputType: input.type || 'text',
          name: input.name || input.id || '',
          label: label,
          required: input.required,
          value: input.value || ''
        });
      });
      
      if (fields.length > 0) {
        forms.push({
          index: forms.length,
          id: '_orphan_fields',
          name: 'Standalone Fields',
          action: '',
          method: '',
          fields: fields,
          fieldCount: fields.length
        });
      }
    }
    
    return forms;
  }

  function getFieldLabel(input) {
    // Check for associated label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label.textContent.trim();
    }
    
    // Check for wrapping label
    const parentLabel = input.closest('label');
    if (parentLabel) {
      const text = parentLabel.textContent.replace(input.value, '').trim();
      if (text) return text;
    }
    
    // Check aria-label
    if (input.getAttribute('aria-label')) {
      return input.getAttribute('aria-label');
    }
    
    // Check placeholder
    if (input.placeholder) {
      return input.placeholder;
    }
    
    // Use name or id
    return input.name || input.id || 'Unknown field';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOFILL - Smart form filling
  // ═══════════════════════════════════════════════════════════════════════════

  function autofillForm(customData = {}) {
    const sampleData = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '555-123-4567',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'United States',
      company: 'Acme Corporation',
      title: 'Software Engineer',
      ...customData
    };
    
    const fieldMappings = {
      // First name patterns
      'first_name|firstname|fname|given_name|givenname': sampleData.firstName,
      // Last name patterns
      'last_name|lastname|lname|surname|family_name|familyname': sampleData.lastName,
      // Email patterns
      'email|e-mail|mail|emailaddress': sampleData.email,
      // Phone patterns
      'phone|telephone|tel|mobile|cell|phonenumber': sampleData.phone,
      // Address patterns
      'address|street|address1|streetaddress': sampleData.address,
      // City patterns
      'city|town|locality': sampleData.city,
      // State patterns
      'state|province|region': sampleData.state,
      // Zip patterns
      'zip|zipcode|postal|postalcode|postcode': sampleData.zip,
      // Country patterns
      'country|nation': sampleData.country,
      // Company patterns
      'company|organization|org|employer': sampleData.company,
      // Title patterns
      'title|jobtitle|position|role': sampleData.title
    };
    
    let fieldsFound = 0;
    let fieldsFilled = 0;
    
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), select, textarea');
    
    inputs.forEach(input => {
      fieldsFound++;
      const fieldIdentifier = (input.name + ' ' + input.id + ' ' + (input.placeholder || '')).toLowerCase();
      
      for (const [patterns, value] of Object.entries(fieldMappings)) {
        const patternList = patterns.split('|');
        for (const pattern of patternList) {
          if (fieldIdentifier.includes(pattern)) {
            if (input.tagName === 'SELECT') {
              // Try to find matching option
              const option = Array.from(input.options).find(opt => 
                opt.text.toLowerCase().includes(value.toLowerCase()) ||
                opt.value.toLowerCase().includes(value.toLowerCase())
              );
              if (option) {
                input.value = option.value;
                fieldsFilled++;
              }
            } else {
              input.value = value;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              fieldsFilled++;
            }
            break;
          }
        }
      }
    });
    
    return { fieldsFound, fieldsFilled };
  }

  function extractLoanDataFromPage() {
    const data = {};
    
    // Common loan field patterns
    const fieldPatterns = [
      { name: 'loan_number', patterns: [/loan\s*#?\s*:?\s*(\S+)/i, /loan\s*number\s*:?\s*(\S+)/i] },
      { name: 'borrower_name', patterns: [/borrower\s*:?\s*([^,\n]+)/i, /applicant\s*:?\s*([^,\n]+)/i] },
      { name: 'property_address', patterns: [/property\s*address\s*:?\s*([^,\n]+)/i, /subject\s*property\s*:?\s*([^,\n]+)/i] },
      { name: 'loan_amount', patterns: [/loan\s*amount\s*:?\s*\$?([\d,\.]+)/i, /amount\s*:?\s*\$?([\d,\.]+)/i] },
      { name: 'interest_rate', patterns: [/interest\s*rate\s*:?\s*([\d\.]+)%?/i, /rate\s*:?\s*([\d\.]+)%?/i] },
      { name: 'loan_type', patterns: [/loan\s*type\s*:?\s*(\S+)/i, /product\s*:?\s*(\S+)/i] },
      { name: 'closing_date', patterns: [/closing\s*date\s*:?\s*(\S+)/i, /close\s*date\s*:?\s*(\S+)/i] }
    ];
    
    const pageText = document.body.innerText;
    
    fieldPatterns.forEach(({ name, patterns }) => {
      for (const pattern of patterns) {
        const match = pageText.match(pattern);
        if (match && match[1]) {
          data[name] = match[1].trim();
          break;
        }
      }
    });
    
    // Also extract from form inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const name = input.name || input.id || '';
      const value = input.value || '';
      
      if (name && value && !data[name]) {
        const normalizedName = name.toLowerCase().replace(/[-_]/g, '_');
        if (normalizedName.includes('loan') || 
            normalizedName.includes('borrower') || 
            normalizedName.includes('amount') ||
            normalizedName.includes('rate') ||
            normalizedName.includes('property')) {
          data[normalizedName] = value;
        }
      }
    });
    
    return data;
  }

  function executeAutomationCommand(command) {
    if (!command) return 'No command provided';
    
    const cmd = command.toLowerCase().trim();
    
    if (cmd.startsWith('click ')) {
      const selector = command.substring(6).trim();
      const element = document.querySelector(selector);
      if (element) {
        element.click();
        return `Clicked element: ${selector}`;
      }
      return `Element not found: ${selector}`;
    }
    
    if (cmd.startsWith('fill ')) {
      const parts = command.substring(5).match(/(.+?)\s+"(.+)"$/);
      if (parts) {
        const selector = parts[1].trim();
        const value = parts[2];
        const element = document.querySelector(selector);
        if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          return `Filled ${selector} with "${value}"`;
        }
        return `Input element not found: ${selector}`;
      }
      return 'Invalid fill command. Use: fill SELECTOR "VALUE"';
    }
    
    if (cmd.startsWith('select ')) {
      const parts = command.substring(7).match(/(.+?)\s+"(.+)"$/);
      if (parts) {
        const selector = parts[1].trim();
        const value = parts[2];
        const element = document.querySelector(selector);
        if (element && element.tagName === 'SELECT') {
          element.value = value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return `Selected ${value} in ${selector}`;
        }
        return `Select element not found: ${selector}`;
      }
      return 'Invalid select command. Use: select SELECTOR "VALUE"';
    }
    
    if (cmd === 'forms') {
      return `Found ${document.forms.length} forms on page`;
    }
    
    if (cmd === 'inputs') {
      const inputs = document.querySelectorAll('input, select, textarea');
      return `Found ${inputs.length} input elements on page`;
    }
    
    if (cmd === 'links') {
      return `Found ${document.links.length} links on page`;
    }
    
    return `Unknown command: ${command}. Available: click, fill, select, forms, inputs, links`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVANCED DOCUMENT DETECTION - Enterprise-grade file discovery
  // ═══════════════════════════════════════════════════════════════════════════

  function detectDocumentsOnPage(options = {}) {
    const documents = [];
    const types = options.types || ['pdf', 'excel', 'word', 'csv', 'image', 'archive'];
    const includeLinks = options.includeLinks !== false;
    const includeEmbedded = options.includeEmbedded !== false;
    const includeDataUrls = options.includeDataUrls !== false;
    const includeAjaxUrls = options.includeAjaxUrls !== false;

    const documentExtensions = {
      pdf: ['.pdf'],
      excel: ['.xlsx', '.xls', '.xlsm', '.xlsb', '.ods'],
      word: ['.docx', '.doc', '.docm', '.odt', '.rtf'],
      csv: ['.csv', '.tsv'],
      image: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff'],
      archive: ['.zip', '.rar', '.7z', '.tar', '.gz']
    };

    const mimeTypes = {
      pdf: ['application/pdf', 'application/x-pdf'],
      excel: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.oasis.opendocument.spreadsheet'
      ],
      word: [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.oasis.opendocument.text',
        'application/rtf'
      ],
      csv: ['text/csv', 'text/tab-separated-values', 'application/csv'],
      image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
      archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
    };

    const allowedExtensions = types.flatMap(type => documentExtensions[type] || []);
    const allowedMimeTypes = types.flatMap(type => mimeTypes[type] || []);

    // 1. Find document links (standard <a> tags)
    if (includeLinks) {
      const links = document.querySelectorAll('a[href]');
      links.forEach((link, index) => {
        const href = link.href || '';
        const hrefLower = href.toLowerCase();
        
        // Skip empty, javascript:, and anchor links
        if (!href || href.startsWith('javascript:') || href === '#') return;
        
        const extension = allowedExtensions.find(ext => hrefLower.includes(ext));
        if (extension) {
          const type = Object.entries(documentExtensions)
            .find(([, exts]) => exts.includes(extension))?.[0] || 'unknown';
          
          documents.push({
            id: `link-${index}`,
            type,
            extension,
            name: extractFileName(href, link.textContent),
            url: href,
            source: 'link',
            element: getElementSelector(link),
            size: null,
            confidence: 0.9
          });
        }
      });
    }

    // 2. Find embedded objects (iframes, embeds, objects)
    if (includeEmbedded) {
      // PDF embeds
      const pdfEmbeds = document.querySelectorAll(
        'embed[type="application/pdf"], ' +
        'embed[src*=".pdf"], ' +
        'object[type="application/pdf"], ' +
        'object[data*=".pdf"], ' +
        'iframe[src*=".pdf"], ' +
        'iframe[src*="viewer.html"]'
      );
      pdfEmbeds.forEach((embed, index) => {
        const src = embed.src || embed.data || '';
        if (src) {
          documents.push({
            id: `embed-pdf-${index}`,
            type: 'pdf',
            extension: '.pdf',
            name: extractFileName(src, 'Embedded PDF'),
            url: src,
            source: 'embedded',
            element: getElementSelector(embed),
            size: null,
            confidence: 0.95
          });
        }
      });

      // Google Docs/Sheets/Slides embeds
      const googleEmbeds = document.querySelectorAll(
        'iframe[src*="docs.google.com"], ' +
        'iframe[src*="sheets.google.com"], ' +
        'iframe[src*="slides.google.com"], ' +
        'iframe[src*="drive.google.com"]'
      );
      googleEmbeds.forEach((iframe, index) => {
        const src = iframe.src;
        let type = 'word';
        let name = 'Google Document';
        
        if (src.includes('sheets.google.com') || src.includes('/spreadsheets/')) {
          type = 'excel';
          name = 'Google Sheet';
        } else if (src.includes('slides.google.com') || src.includes('/presentation/')) {
          type = 'pdf';
          name = 'Google Slides';
        } else if (src.includes('/file/')) {
          name = 'Google Drive File';
        }
        
        documents.push({
          id: `google-${index}`,
          type,
          extension: null,
          name,
          url: src,
          source: 'google-embed',
          element: getElementSelector(iframe),
          size: null,
          confidence: 0.85
        });
      });

      // Office Online embeds
      const officeEmbeds = document.querySelectorAll(
        'iframe[src*="office.com"], ' +
        'iframe[src*="sharepoint.com"], ' +
        'iframe[src*="onedrive.live.com"]'
      );
      officeEmbeds.forEach((iframe, index) => {
        const src = iframe.src;
        let type = 'word';
        
        if (src.includes('excel') || src.includes('xlsx')) {
          type = 'excel';
        } else if (src.includes('powerpoint') || src.includes('pptx')) {
          type = 'pdf';
        }
        
        documents.push({
          id: `office-${index}`,
          type,
          extension: null,
          name: 'Microsoft Office Document',
          url: src,
          source: 'office-embed',
          element: getElementSelector(iframe),
          size: null,
          confidence: 0.85
        });
      });

      // Dropbox embeds
      const dropboxEmbeds = document.querySelectorAll(
        'iframe[src*="dropbox.com"], a[href*="dropbox.com/s/"]'
      );
      dropboxEmbeds.forEach((el, index) => {
        const url = el.src || el.href || '';
        const extension = allowedExtensions.find(ext => url.toLowerCase().includes(ext));
        
        documents.push({
          id: `dropbox-${index}`,
          type: extension ? Object.entries(documentExtensions).find(([, exts]) => exts.includes(extension))?.[0] : 'unknown',
          extension,
          name: extractFileName(url, 'Dropbox File'),
          url,
          source: 'dropbox',
          element: getElementSelector(el),
          size: null,
          confidence: 0.8
        });
      });
    }

    // 3. Find download buttons and links with download attributes
    const downloadElements = document.querySelectorAll(
      '[download], ' +
      '[data-download-url], ' +
      '[data-file-url], ' +
      '[data-href], ' +
      'button[onclick*="download"], ' +
      'a[onclick*="download"]'
    );
    downloadElements.forEach((el, index) => {
      const downloadAttr = el.getAttribute('download') || '';
      const href = el.href || el.getAttribute('data-download-url') || 
                   el.getAttribute('data-file-url') || el.getAttribute('data-href') || '';
      
      if (!href && !downloadAttr) return;
      
      const checkUrl = (downloadAttr + ' ' + href).toLowerCase();
      const extension = allowedExtensions.find(ext => checkUrl.includes(ext));
      
      if (extension || downloadAttr) {
        const type = extension ? 
          Object.entries(documentExtensions).find(([, exts]) => exts.includes(extension))?.[0] : 'unknown';
        
        documents.push({
          id: `download-${index}`,
          type: type || 'unknown',
          extension,
          name: downloadAttr || extractFileName(href, el.textContent),
          url: href || window.location.href,
          source: 'download-button',
          element: getElementSelector(el),
          size: null,
          confidence: 0.85
        });
      }
    });

    // 4. Scan for hidden/dynamic document URLs in scripts and data attributes
    if (includeAjaxUrls) {
      // Check data attributes for URLs
      const elementsWithData = document.querySelectorAll('[data-url], [data-src], [data-file], [data-document]');
      elementsWithData.forEach((el, index) => {
        const dataUrl = el.getAttribute('data-url') || el.getAttribute('data-src') || 
                        el.getAttribute('data-file') || el.getAttribute('data-document') || '';
        
        const extension = allowedExtensions.find(ext => dataUrl.toLowerCase().includes(ext));
        if (extension) {
          const type = Object.entries(documentExtensions)
            .find(([, exts]) => exts.includes(extension))?.[0] || 'unknown';
          
          documents.push({
            id: `data-attr-${index}`,
            type,
            extension,
            name: extractFileName(dataUrl, 'Dynamic Document'),
            url: resolveUrl(dataUrl),
            source: 'data-attribute',
            element: getElementSelector(el),
            size: null,
            confidence: 0.7
          });
        }
      });

      // Scan inline scripts for document URLs
      const urlPattern = /["'](https?:\/\/[^"']+\.(pdf|xlsx?|docx?|csv|tsv)[^"']*)/gi;
      const scripts = document.querySelectorAll('script:not([src])');
      const seenScriptUrls = new Set();
      
      scripts.forEach(script => {
        const content = script.textContent || '';
        let match;
        while ((match = urlPattern.exec(content)) !== null) {
          const url = match[1];
          if (!seenScriptUrls.has(url)) {
            seenScriptUrls.add(url);
            const extension = '.' + match[2].toLowerCase();
            const type = Object.entries(documentExtensions)
              .find(([, exts]) => exts.includes(extension))?.[0] || 'unknown';
            
            documents.push({
              id: `script-url-${seenScriptUrls.size}`,
              type,
              extension,
              name: extractFileName(url, 'Script-referenced Document'),
              url,
              source: 'script',
              element: null,
              size: null,
              confidence: 0.6
            });
          }
        }
      });
    }

    // 5. Check for blob URLs and data URLs
    if (includeDataUrls) {
      const blobLinks = document.querySelectorAll('a[href^="blob:"], img[src^="blob:"]');
      blobLinks.forEach((el, index) => {
        const url = el.href || el.src;
        documents.push({
          id: `blob-${index}`,
          type: 'unknown',
          extension: null,
          name: 'Blob Document',
          url,
          source: 'blob',
          element: getElementSelector(el),
          size: null,
          confidence: 0.5
        });
      });
    }

    // 6. LendingPad-specific detection (common mortgage platform)
    const lendingPadDocs = detectLendingPadDocuments();
    documents.push(...lendingPadDocs);

    // 7. Common banking/financial portal detection
    const financialDocs = detectFinancialPortalDocuments();
    documents.push(...financialDocs);

    // Deduplicate by URL
    const uniqueDocuments = [];
    const seenUrls = new Set();
    documents.forEach(doc => {
      const normalizedUrl = normalizeUrl(doc.url);
      if (!seenUrls.has(normalizedUrl) && doc.url) {
        seenUrls.add(normalizedUrl);
        uniqueDocuments.push(doc);
      }
    });

    // Sort by confidence
    uniqueDocuments.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    console.log(`📄 Document detection found ${uniqueDocuments.length} documents`);
    return uniqueDocuments;
  }

  function detectLendingPadDocuments() {
    const documents = [];
    
    // Document extensions for reference
    const docExtensions = ['.pdf', '.xlsx', '.xls', '.docx', '.doc', '.csv'];
    
    // LendingPad-specific selectors
    const lendingPadSelectors = [
      '.document-row', '.doc-item', '.file-item',
      '[data-document-id]', '[data-file-id]',
      '.loan-document', '.disclosure-doc',
      'tr.document', 'li.document'
    ];
    
    lendingPadSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el, index) => {
        const link = el.querySelector('a[href]');
        const nameEl = el.querySelector('.document-name, .file-name, .doc-title, td:first-child');
        
        if (link || nameEl) {
          const url = link?.href || '';
          const name = nameEl?.textContent?.trim() || link?.textContent?.trim() || 'Document';
          const extension = docExtensions.find(ext => url.toLowerCase().includes(ext)) || 
                           docExtensions.find(ext => name.toLowerCase().includes(ext));
          
          let type = 'pdf';
          if (extension) {
            if (['.xlsx', '.xls'].includes(extension)) type = 'excel';
            else if (['.docx', '.doc'].includes(extension)) type = 'word';
            else if (extension === '.csv') type = 'csv';
          }
          
          documents.push({
            id: `lendingpad-${index}`,
            type,
            extension: extension || '.pdf',
            name,
            url: url || '',
            source: 'lendingpad',
            element: getElementSelector(el),
            size: null,
            confidence: 0.9
          });
        }
      });
    });
    
    return documents;
  }

  function detectFinancialPortalDocuments() {
    const documents = [];
    
    // Common financial portal patterns
    const statementSelectors = [
      '.statement-row', '.statement-item',
      '.tax-document', '.tax-form',
      '.account-statement', '.transaction-export',
      '[data-statement-id]', '[data-form-id]'
    ];
    
    statementSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el, index) => {
        const link = el.querySelector('a[href], button[data-url]');
        const nameEl = el.querySelector('.statement-name, .form-name, .document-title');
        
        if (link || nameEl) {
          const url = link?.href || link?.getAttribute('data-url') || '';
          const name = nameEl?.textContent?.trim() || link?.textContent?.trim() || 'Financial Document';
          
          documents.push({
            id: `financial-${index}`,
            type: 'pdf',
            extension: '.pdf',
            name,
            url,
            source: 'financial-portal',
            element: getElementSelector(el),
            size: null,
            confidence: 0.85
          });
        }
      });
    });
    
    return documents;
  }

  function extractFileName(url, fallback = 'Document') {
    if (!url) return fallback;
    
    try {
      const urlObj = new URL(url, window.location.origin);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      
      if (filename && filename.includes('.')) {
        return decodeURIComponent(filename);
      }
      
      // Check query params for filename
      const filenameParam = urlObj.searchParams.get('filename') || 
                           urlObj.searchParams.get('file') ||
                           urlObj.searchParams.get('name');
      if (filenameParam) {
        return decodeURIComponent(filenameParam);
      }
    } catch (e) {
      // Invalid URL
    }
    
    return fallback?.trim()?.substring(0, 100) || 'Document';
  }

  function resolveUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    try {
      return new URL(url, window.location.origin).href;
    } catch (e) {
      return url;
    }
  }

  function normalizeUrl(url) {
    if (!url) return '';
    try {
      const urlObj = new URL(url, window.location.origin);
      // Remove tracking params
      ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source'].forEach(param => {
        urlObj.searchParams.delete(param);
      });
      return urlObj.href.toLowerCase();
    } catch (e) {
      return url.toLowerCase();
    }
  }

  function getElementSelector(element) {
    if (!element) return '';
    
    if (element.id) {
      return `#${element.id}`;
    }
    
    const path = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).slice(0, 2);
        if (classes.length > 0 && classes[0]) {
          selector += '.' + classes.join('.');
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
      
      if (path.length >= 3) break;
    }
    
    return path.join(' > ');
  }

  function getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      forms: document.forms.length,
      inputs: document.querySelectorAll('input, select, textarea').length,
      links: document.querySelectorAll('a[href]').length,
      images: document.images.length
    };
  }

})();
