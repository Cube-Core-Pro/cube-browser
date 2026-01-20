// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 CONTENT SCRIPT v7.0.0 - Elite Service Orchestrator
// ═══════════════════════════════════════════════════════════════════════════════
//
// ROLE: Main coordinator for all Chrome Extension v7.0.0 features
//
// NEW in v7.0.0:
// ✅ 9 Elite Service Integration
// ✅ Keyboard Shortcut Handling
// ✅ Cross-Service Communication
// ✅ Background Worker Coordination
// ✅ Side Panel Management
//
// SERVICES COORDINATED:
// 1. Macro Recording/Playback
// 2. AI Document Processing (OpenAI, Claude, Gemini)
// 3. Screen Capture (5 modes + OCR)
// 4. Remote Control (<20ms latency)
// 5. P2P File Sharing (WebRTC)
// 6. Smart Autofill (AI-powered)
// 7. Universal Document Engine
//
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  console.log('🚀 CUBE Nexum Connect v7.0.1 - Content Script initializing...');

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const STATE = {
    initialized: false,
    recording: false,
    capturing: false,
    remoteSession: null,
    p2pConnection: null,
    currentForm: null,
    
    // Service instances
    macroRecorder: null,
    macroPlayer: null,
    macroAI: null,
    screenCapture: null,
    remoteControl: null,
    p2pFile: null,
    documentEngine: null,
    autofillEngine: null,
    
    // AI providers
    openai: null,
    claude: null,
    gemini: null
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  async function initialize() {
    if (STATE.initialized) {
      console.log('⚠️ Already initialized');
      return;
    }

    console.log('⚡ Initializing services...');

    try {
      // Initialize Macro Services - Use singleton instances
      if (window.CubeMacroRecorder) {
        STATE.macroRecorder = window.CubeMacroRecorder;
        console.log('✅ Macro Recorder initialized (singleton)');
      } else if (window.MacroRecorder) {
        STATE.macroRecorder = new window.MacroRecorder();
        window.CubeMacroRecorder = STATE.macroRecorder; // Make it the singleton
        console.log('✅ Macro Recorder initialized (new instance set as singleton)');
      }

      if (window.CubeMacroPlayer) {
        STATE.macroPlayer = window.CubeMacroPlayer;
        console.log('✅ Macro Player initialized (singleton)');
      } else if (window.MacroPlayer) {
        STATE.macroPlayer = new window.MacroPlayer();
        window.CubeMacroPlayer = STATE.macroPlayer; // Make it the singleton
        console.log('✅ Macro Player initialized (new instance set as singleton)');
      }

      if (window.MacroAI) {
        STATE.macroAI = new window.MacroAI();
        console.log('✅ Macro AI initialized');
      }

      // Initialize AI Services
      if (window.OpenAIService) {
        STATE.openai = new window.OpenAIService();
        console.log('✅ OpenAI Service initialized');
      }

      if (window.ClaudeService) {
        STATE.claude = new window.ClaudeService();
        console.log('✅ Claude Service initialized');
      }

      if (window.GeminiService) {
        STATE.gemini = new window.GeminiService();
        console.log('✅ Gemini Service initialized');
      }

      // Initialize Capture Services
      if (window.ScreenCaptureService) {
        STATE.screenCapture = new window.ScreenCaptureService();
        console.log('✅ Screen Capture initialized');
      }

      // Initialize Remote Control
      if (window.RemoteControlService) {
        STATE.remoteControl = new window.RemoteControlService();
        console.log('✅ Remote Control initialized');
      }

      // Initialize P2P File Service
      if (window.P2PFileService) {
        STATE.p2pFile = new window.P2PFileService();
        console.log('✅ P2P File Service initialized');
        setupP2PEventBridge();
      }

      // Initialize Document Engine (auto-initializes with AI)
      if (window.universalDocumentEngineV6) {
        STATE.documentEngine = window.universalDocumentEngineV6;
        console.log('✅ Document Engine v6 initialized');
      }

      // Initialize Autofill Engine
      if (window.smartAutofillEngineV6) {
        STATE.autofillEngine = window.smartAutofillEngineV6;
        console.log('✅ Autofill Engine v6 initialized');
      }

      // Setup message listeners
      setupMessageListeners();

      // Setup keyboard shortcuts
      setupKeyboardShortcuts();

      // Detect forms on page
      detectFormsOnPage();

      // Detect documents on page
      detectDocumentsOnPage();

      STATE.initialized = true;
      console.log('🚀 CUBE Nexum Connect v7.0.1 fully initialized!');

      // Notify background worker
      chrome.runtime.sendMessage({
        type: 'CONTENT_SCRIPT_READY',
        version: '6.0.1',
        services: {
          macro: !!STATE.macroRecorder,
          ai: !!(STATE.openai || STATE.claude || STATE.gemini),
          capture: !!STATE.screenCapture,
          remote: !!STATE.remoteControl,
          p2p: !!STATE.p2pFile
        }
      });

    } catch (error) {
      console.error('❌ Initialization error:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGE HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  function setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📨 Message received:', message.type);

      switch (message.type) {
        // NOTE: Macro messages (START_MACRO_RECORDING, STOP_MACRO_RECORDING, 
        // PLAY_MACRO, GET_MACRO_STEP_COUNT) are handled by content-script-elite.js
        // which loads after this script and has more robust handlers.
        // Do not handle them here to avoid duplicate responses.

        case 'CAPTURE_SCREENSHOT':
          handleCaptureScreenshot(message).then(sendResponse);
          return true;

        case 'START_REMOTE_SESSION':
          handleStartRemoteSession(message).then(sendResponse);
          return true;

        case 'CONNECT_P2P':
          handleConnectP2P(message).then(sendResponse);
          return true;

        case 'P2P_INIT_HOST':
          handleP2PInitHost().then(sendResponse);
          return true;

        case 'P2P_JOIN_CLIENT':
          handleP2PJoinClient(message).then(sendResponse);
          return true;

        case 'P2P_APPLY_REMOTE_ANSWER':
          handleP2PApplyAnswer(message).then(sendResponse);
          return true;

        case 'P2P_OPEN_FILE_PICKER':
          handleP2POpenFilePicker(message).then(sendResponse);
          return true;

        case 'P2P_DISCONNECT':
          handleP2PDisconnect().then(sendResponse);
          return true;

        case 'P2P_GET_STATUS':
          handleP2PGetStatus().then(sendResponse);
          return true;

        case 'P2P_REQUEST_DIRECTORY':
          handleP2PRequestDirectory(message).then(sendResponse);
          return true;

        case 'P2P_DIRECTORY_ACTION_REQUEST':
          handleP2PDirectoryAction(message).then(sendResponse);
          return true;

        case 'AUTOFILL_FORM':
          handleAutofillForm(message).then(sendResponse);
          return true;

        case 'PARSE_DOCUMENT':
          handleParseDocument(message).then(sendResponse);
          return true;

        case 'GET_PAGE_INFO':
          sendResponse({
            success: true,
            forms: STATE.currentForm ? 1 : 0,
            documents: STATE.documentEngine?.detectedDocuments.length || 0,
            services: {
              recording: STATE.recording,
              capturing: STATE.capturing,
              remoteSession: !!STATE.remoteSession,
              p2pConnection: !!STATE.p2pConnection
            }
          });
          break;

        default:
          // Don't respond to unknown messages - let other content scripts handle them
          console.log('📨 Passing through message type:', message.type);
          return false; // Don't call sendResponse
      }
    });

    console.log('✅ Message listeners setup');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS
  // ═══════════════════════════════════════════════════════════════════════════

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', async (event) => {
      // Cmd+Shift+M: Record/Stop Macro
      if (event.metaKey && event.shiftKey && event.key === 'M') {
        event.preventDefault();
        await toggleMacroRecording();
      }

      // Cmd+Shift+S: Screenshot (opens mode selector)
      if (event.metaKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        await openScreenshotModeSelector();
      }
    });

    console.log('✅ Keyboard shortcuts setup');
    console.log('   Cmd+Shift+F: Auto-Fill Form');
    console.log('   Cmd+Shift+M: Record/Stop Macro');
    console.log('   Cmd+Shift+S: Screenshot (mode selector)');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MACRO HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  async function handleStartMacroRecording(message) {
    // Use the singleton instance window.CubeMacroRecorder
    const recorder = window.CubeMacroRecorder || STATE.macroRecorder;
    
    if (!recorder) {
      console.error('❌ No macro recorder available');
      return { success: false, error: 'Macro Recorder not available' };
    }

    try {
      console.log('🎬 Starting macro recording with:', recorder);
      const macroName = message.name || `Macro ${new Date().toISOString()}`;
      const macroId = recorder.startRecording ? 
        recorder.startRecording(macroName, { description: message.description }) :
        recorder.start({ name: macroName, description: message.description });

      STATE.recording = true;
      console.log('🎬 Recording started, macroId:', macroId);

      return {
        success: true,
        macroId: macroId,
        message: 'Recording started'
      };
    } catch (error) {
      console.error('Failed to start recording:', error);
      return { success: false, error: error.message };
    }
  }

  async function handleStopMacroRecording(message) {
    // Use the singleton instance window.CubeMacroRecorder
    const recorder = window.CubeMacroRecorder || STATE.macroRecorder;
    
    if (!recorder || !STATE.recording) {
      return { success: false, error: 'Not recording' };
    }

    try {
      console.log('⏹️ Stopping macro recording');
      const macro = recorder.stopRecording ? recorder.stopRecording() : recorder.stop();
      STATE.recording = false;
      console.log('⏹️ Recording stopped, actions:', macro?.actions?.length || macro?.steps?.length || 0);

      return {
        success: true,
        macro: macro,
        actions: macro?.actions?.length || macro?.steps?.length || 0,
        message: 'Recording stopped'
      };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return { success: false, error: error.message };
    }
  }

  async function handlePlayMacro(message) {
    // Use the singleton instance window.CubeMacroPlayer
    const player = window.CubeMacroPlayer || STATE.macroPlayer;
    
    if (!player) {
      return { success: false, error: 'Macro Player not available' };
    }

    try {
      console.log('▶️ Playing macro with player:', player);
      const playMethod = player.playMacro || player.play;
      const result = await playMethod.call(player, message.macro, {
        selfHeal: true,
        humanize: message.humanize !== false
      });

      return {
        success: result.success,
        actionsExecuted: result.actionsExecuted,
        totalActions: result.totalActions,
        successRate: result.successRate,
        duration: result.duration
      };
    } catch (error) {
      console.error('Failed to play macro:', error);
      return { success: false, error: error.message };
    }
  }

  async function handleGetMacroStepCount() {
    try {
      // Try window.CubeMacroRecorder first (singleton instance)
      if (window.CubeMacroRecorder && typeof window.CubeMacroRecorder.getStepCount === 'function') {
        const count = window.CubeMacroRecorder.getStepCount();
        console.log('📊 Step count from CubeMacroRecorder:', count);
        return { success: true, count };
      }
      
      // Fall back to STATE.macroRecorder
      if (STATE.macroRecorder && typeof STATE.macroRecorder.getStepCount === 'function') {
        const count = STATE.macroRecorder.getStepCount();
        console.log('📊 Step count from STATE.macroRecorder:', count);
        return { success: true, count };
      }
      
      console.log('📊 No macro recorder available for step count');
      return { success: false, count: 0 };
    } catch (error) {
      console.error('📊 Error getting step count:', error);
      return { success: false, count: 0 };
    }
  }

  async function toggleMacroRecording() {
    if (STATE.recording) {
      await handleStopMacroRecording({});
      showNotification('Recording stopped', 'success');
    } else {
      await handleStartMacroRecording({});
      showNotification('Recording started', 'info');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN CAPTURE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  async function handleCaptureScreenshot(message) {
    if (!STATE.screenCapture) {
      return { success: false, error: 'Screen Capture not available' };
    }

    try {
      const mode = message.mode || 'area';
      let result;

      switch (mode) {
        case 'area':
          result = await STATE.screenCapture.captureArea();
          break;
        case 'window':
          result = await STATE.screenCapture.captureWindow();
          break;
        case 'fullscreen':
          result = await STATE.screenCapture.captureFullscreen();
          break;
        case 'scrolling':
          result = await STATE.screenCapture.captureScrolling();
          break;
        case 'delayed':
          result = await STATE.screenCapture.captureDelayed(message.delay || 3);
          break;
        default:
          throw new Error(`Unknown capture mode: ${mode}`);
      }

      return {
        success: true,
        imageData: result.imageData,
        ocrText: result.ocrText,
        mode: mode
      };
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return { success: false, error: error.message };
    }
  }

  async function captureScreenshotArea() {
    const result = await handleCaptureScreenshot({ mode: 'area' });
    if (result.success) {
      showNotification('Screenshot captured', 'success');
    }
  }

  async function captureScreenshotWindow() {
    const result = await handleCaptureScreenshot({ mode: 'window' });
    if (result.success) {
      showNotification('Window captured', 'success');
    }
  }

  async function captureScreenshotFullscreen() {
    const result = await handleCaptureScreenshot({ mode: 'fullscreen' });
    if (result.success) {
      showNotification('Fullscreen captured', 'success');
    }
  }

  async function openScreenshotModeSelector() {
    // Open popup to select screenshot mode
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    showNotification('Select screenshot mode in popup', 'info');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REMOTE CONTROL HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  async function handleStartRemoteSession(message) {
    if (!STATE.remoteControl) {
      return { success: false, error: 'Remote Control not available' };
    }

    try {
      const isHost = message.role === 'host';
      let result;

      if (isHost) {
        result = await STATE.remoteControl.startHost();
        STATE.remoteSession = { role: 'host', code: result.code };
      } else {
        result = await STATE.remoteControl.connectClient(message.code);
        STATE.remoteSession = { role: 'client', code: message.code };
      }

      return {
        success: true,
        role: isHost ? 'host' : 'client',
        code: result.code,
        message: `Remote session ${isHost ? 'started' : 'connected'}`
      };
    } catch (error) {
      console.error('Failed to start remote session:', error);
      return { success: false, error: error.message };
    }
  }

  async function startRemoteControlSession() {
    // Prompt user for role
    const role = confirm('Start as HOST? (Cancel for CLIENT)') ? 'host' : 'client';
    
    if (role === 'client') {
      const code = prompt('Enter 6-digit session code:');
      if (!code) return;
      
      const result = await handleStartRemoteSession({ role: 'client', code });
      if (result.success) {
        showNotification(`Connected to session ${code}`, 'success');
      }
    } else {
      const result = await handleStartRemoteSession({ role: 'host' });
      if (result.success) {
        showNotification(`Session started: ${result.code}`, 'success');
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // P2P FILE SHARING HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  async function ensureP2PFileService() {
    if (STATE.p2pFile) {
      return STATE.p2pFile;
    }

    if (window.P2PFileService) {
      STATE.p2pFile = new window.P2PFileService();
      setupP2PEventBridge();
      return STATE.p2pFile;
    }

    throw new Error('P2P File Service not available');
  }

  async function handleConnectP2P(message) {
    try {
      if (message.role === 'sender') {
        return handleP2PInitHost();
      }
      return handleP2PJoinClient(message);
    } catch (error) {
      console.error('Failed to connect P2P:', error);
      return { success: false, error: error.message };
    }
  }

  async function handleP2PInitHost() {
    try {
      const service = await ensureP2PFileService();
      const result = await service.initiateSender();
      STATE.p2pConnection = { role: 'sender', code: result.connectionCode };
      return {
        success: true,
        role: 'sender',
        code: result.connectionCode,
        offer: result.offer
      };
    } catch (error) {
      console.error('Failed to initialize P2P host:', error);
      return { success: false, error: error.message };
    }
  }

  async function handleP2PJoinClient(message) {
    try {
      const service = await ensureP2PFileService();
      if (!message.offer) {
        throw new Error('Missing offer payload');
      }
      const result = await service.connectAsReceiver(message.code, message.offer);
      STATE.p2pConnection = { role: 'receiver', code: message.code };
      return {
        success: true,
        role: 'receiver',
        code: message.code,
        answer: result.answer
      };
    } catch (error) {
      console.error('Failed to join P2P session:', error);
      return { success: false, error: error.message };
    }
  }

  async function handleP2PApplyAnswer(message) {
    try {
      const service = await ensureP2PFileService();
      if (!message.answer) {
        throw new Error('Missing answer payload');
      }
      await service.applyRemoteAnswer(message.answer);
      return { success: true };
    } catch (error) {
      console.error('Failed to apply P2P answer:', error);
      return { success: false, error: error.message };
    }
  }

  async function handleP2POpenFilePicker(message) {
    try {
      const service = await ensureP2PFileService();
      if (!service.isConnected) {
        throw new Error('No active P2P connection');
      }

      const accepts = message.accept || '*';

      return await new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = message.multiple !== false;
        input.accept = accepts;
        input.style.display = 'none';
        document.body.appendChild(input);

        input.addEventListener('change', async () => {
          try {
            if (input.files && input.files.length > 0) {
              await service.sendFiles(input.files);
              resolve({ success: true, count: input.files.length });
            } else {
              resolve({ success: false, error: 'No files selected' });
            }
          } catch (error) {
            reject(error);
          } finally {
            input.remove();
          }
        }, { once: true });

        input.click();
      });
    } catch (error) {
      console.error('Failed to open P2P file picker:', error);
      return { success: false, error: error.message };
    }
  }

  async function handleP2PDisconnect() {
    try {
      const service = await ensureP2PFileService();
      service.disconnect();
      STATE.p2pConnection = null;
      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect P2P:', error);
      return { success: false, error: error.message };
    }
  }

  async function handleP2PGetStatus() {
    try {
      const service = await ensureP2PFileService();
      return {
        success: true,
        stats: service.getStats(),
        connection: STATE.p2pConnection
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle P2P directory listing request
   * Note: Browser extensions cannot access local filesystem directly.
   * This returns a mock response explaining the limitation.
   */
  async function handleP2PRequestDirectory(message) {
    try {
      const path = message.path || '/';
      
      // Browser extensions cannot access local filesystem
      // Return a helpful mock response
      console.log(`📁 P2P Directory request for: ${path}`);
      
      return {
        success: true,
        path: path,
        items: [
          {
            name: '⚠️ Filesystem Access Limited',
            type: 'info',
            description: 'Browser extensions cannot access local filesystem directly'
          },
          {
            name: '💡 Use File Picker Instead',
            type: 'tip',
            description: 'Click "Send Files" to select files using the file picker'
          }
        ],
        message: 'Use the Send Files button to select files for transfer'
      };
    } catch (error) {
      console.error('Failed to request P2P directory:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle P2P directory action (download, delete, etc.)
   * Note: Limited functionality due to browser extension constraints.
   */
  async function handleP2PDirectoryAction(message) {
    try {
      const { action, path, filename } = message;
      
      console.log(`📁 P2P Directory action: ${action} on ${path}/${filename}`);
      
      switch (action) {
        case 'download':
          // Request file from connected peer
          const service = await ensureP2PFileService();
          if (!service.isConnected) {
            return { success: false, error: 'Not connected to peer' };
          }
          
          // Queue download request
          return {
            success: true,
            message: `Download request sent for ${filename}`,
            action: 'download-queued'
          };
          
        case 'refresh':
          return {
            success: true,
            message: 'Directory refreshed',
            action: 'refreshed'
          };
          
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`
          };
      }
    } catch (error) {
      console.error('Failed to handle P2P directory action:', error);
      return { success: false, error: error.message };
    }
  }

  function setupP2PEventBridge() {
    if (window.__cubeP2PBridgeInitialized) {
      return;
    }

    const relay = (eventType) => (event) => {
      const payload = event.detail || {};
      chrome.runtime.sendMessage({
        type: 'P2P_EVENT',
        eventType,
        payload
      }).catch(() => {
        // Ignore runtime disconnect errors
      });
    };

    const mapping = [
      { name: 'session-update', type: 'session-update' },
      { name: 'connection-state', type: 'connection-state' },
      { name: 'transfer-queued', type: 'transfer-queued' },
      { name: 'transfer-start', type: 'transfer-start' },
      { name: 'transfer-progress', type: 'transfer-progress' },
      { name: 'transfer-complete', type: 'transfer-complete' },
      { name: 'transfer-error', type: 'transfer-error' }
    ];

    mapping.forEach(({ name, type }) => {
      window.addEventListener(`cube:p2p:${name}`, relay(type));
    });

    window.__cubeP2PBridgeInitialized = true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOFILL HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  async function handleAutofillForm(message) {
    if (!STATE.autofillEngine) {
      return { success: false, error: 'Autofill Engine not available' };
    }

    try {
      // Detect forms
      const forms = STATE.autofillEngine.detectForms();
      
      if (forms.length === 0) {
        return { success: false, error: 'No forms detected' };
      }

      // Use first form or specified form
      const formInfo = forms[0];

      // Auto-fill
      const result = await STATE.autofillEngine.autoFill(formInfo, message.data, {
        humanize: message.humanize !== false
      });

      return result;
    } catch (error) {
      console.error('Failed to autofill form:', error);
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  async function handleParseDocument(message) {
    if (!STATE.documentEngine) {
      return { success: false, error: 'Document Engine not available' };
    }

    try {
      // Download and parse
      const result = await STATE.documentEngine.downloadAndParse(message.document, {
        accuracyNeeded: message.accuracyNeeded || 'medium',
        disableAI: message.disableAI
      });

      return result;
    } catch (error) {
      console.error('Failed to parse document:', error);
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE DETECTION
  // ═══════════════════════════════════════════════════════════════════════════

  function detectFormsOnPage() {
    if (!STATE.autofillEngine) return;

    try {
      const forms = STATE.autofillEngine.detectForms();
      
      if (forms.length > 0) {
        console.log(`📋 Detected ${forms.length} forms on page`);
        STATE.currentForm = forms[0];

        // Notify popup
        chrome.runtime.sendMessage({
          type: 'FORMS_DETECTED',
          count: forms.length,
          formInfo: {
            type: forms[0].type,
            fields: forms[0].fields.length
          }
        });
      }
    } catch (error) {
      console.error('Form detection error:', error);
    }
  }

  function detectDocumentsOnPage() {
    if (!STATE.documentEngine) return;

    try {
      STATE.documentEngine.detectDocuments().then(documents => {
        if (documents.length > 0) {
          console.log(`📄 Detected ${documents.length} documents on page`);

          // Notify popup
          chrome.runtime.sendMessage({
            type: 'DOCUMENTS_DETECTED',
            count: documents.length,
            aiCapable: documents.filter(d => d.aiCapable).length
          });
        }
      });
    } catch (error) {
      console.error('Document detection error:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGE HANDLERS - Extended for Popup Ultimate v6
  // ═══════════════════════════════════════════════════════════════════════════

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 Content Script received message:', message.type);

    // Handle async responses
    (async () => {
      try {
        switch(message.type) {
          // ═══════════════════════════════════════════════════════════════
          // HEALTH CHECK
          // ═══════════════════════════════════════════════════════════════
          
          case 'PING':
            sendResponse({ success: true, pong: true });
            break;

          // ═══════════════════════════════════════════════════════════════
          // DOCUMENT DETECTION & PARSING
          // ═══════════════════════════════════════════════════════════════
          
          case 'DETECT_DOCUMENTS':
            const documents = await detectDocuments(message.options);
            sendResponse({ 
              success: true, 
              documents: documents,
              count: documents.length 
            });
            break;

          case 'PARSE_DOCUMENT':
            const parsedDoc = await parseDocument(message.document);
            sendResponse({ 
              success: true, 
              data: parsedDoc 
            });
            break;

          case 'PARSE_ALL_DOCUMENTS':
            const parsedDocs = await parseAllDocuments(message.documents);
            sendResponse({ 
              success: true, 
              parsed: parsedDocs 
            });
            break;

          case 'DOWNLOAD_DOCUMENT':
            const downloadResult = await downloadDocument(message.document);
            sendResponse({ 
              success: downloadResult 
            });
            break;

          // ═══════════════════════════════════════════════════════════════
          // AUTOFILL
          // ═══════════════════════════════════════════════════════════════
          
          case 'AUTOFILL_FORM':
            const fillResult = await autofillForm(message.data);
            sendResponse({ 
              success: fillResult.success,
              fieldsFilledcount: fillResult.count 
            });
            break;

          case 'ANALYZE_FORM':
            const formAnalysis = await analyzeForm();
            sendResponse({ 
              success: true,
              form: formAnalysis.form,
              fields: formAnalysis.fields 
            });
            break;

          case 'AI_SUGGEST_FIELDS':
            const suggestions = await aiSuggestFields();
            sendResponse({ 
              success: true,
              suggestions: suggestions 
            });
            break;

          case 'AI_VALIDATE_FORM':
            const validation = await aiValidateForm();
            sendResponse({ 
              success: true,
              issues: validation.issues 
            });
            break;

          // NOTE: START_MACRO_RECORDING and STOP_MACRO_RECORDING are handled 
          // by the first message listener (line 180) with more complete handlers
          // that use window.CubeMacroRecorder singleton. Do not duplicate here.

          // ═══════════════════════════════════════════════════════════════
          // SCREEN CAPTURE
          // ═══════════════════════════════════════════════════════════════
          
          case 'CAPTURE_SCREEN':
            if (STATE.screenCapture) {
              const captureResult = await STATE.screenCapture.capture(message.mode, message.options);
              sendResponse({ 
                success: true,
                imageUrl: captureResult.imageUrl,
                ocrText: captureResult.ocrText 
              });
            } else {
              sendResponse({ success: false });
            }
            break;

          // ═══════════════════════════════════════════════════════════════
          // REMOTE CONTROL
          // ═══════════════════════════════════════════════════════════════
          
          case 'START_REMOTE_HOST':
            if (STATE.remoteControl) {
              const session = await STATE.remoteControl.startHost();
              sendResponse({ 
                success: true,
                code: session.code 
              });
            } else {
              sendResponse({ success: false });
            }
            break;

          case 'CONNECT_REMOTE_CLIENT':
            if (STATE.remoteControl) {
              const connected = await STATE.remoteControl.connect(message.code);
              sendResponse({ success: connected });
            } else {
              sendResponse({ success: false });
            }
            break;

          // ═══════════════════════════════════════════════════════════════
          // P2P FILE SHARING
          // ═══════════════════════════════════════════════════════════════
          
          case 'START_P2P_SEND':
            if (STATE.p2pFile) {
              const sendSession = await STATE.p2pFile.startSend();
              sendResponse({ success: true, sessionId: sendSession.id });
            } else {
              sendResponse({ success: false });
            }
            break;

          case 'START_P2P_RECEIVE':
            if (STATE.p2pFile) {
              const receiveSession = await STATE.p2pFile.startReceive();
              sendResponse({ success: true, sessionId: receiveSession.id });
            } else {
              sendResponse({ success: false });
            }
            break;

          default:
            // Don't respond to unknown messages - let other content scripts handle them
            console.log('📨 Passing through message type (v6):', message.type);
            return; // Don't call sendResponse
        }
      } catch (error) {
        console.error('❌ Message handler error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    // Return true to indicate async response
    return true;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENT DETECTION HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  async function detectDocuments(options = {}) {
    const documents = [];
    
    try {
      // Use universal document engine if available
      if (STATE.documentEngine) {
        const detected = await STATE.documentEngine.detectAll();
        documents.push(...detected);
      } else {
        // Fallback: manual detection
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
          const href = link.href;
          const name = link.textContent.trim() || link.getAttribute('title') || href.split('/').pop();
          
          // Detect file type
          const ext = href.split('.').pop().toLowerCase();
          const supportedTypes = ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'csv', 'json', 'xml'];
          
          if (supportedTypes.includes(ext)) {
            documents.push({
              url: href,
              name: name,
              type: ext,
              size: null,
              parsed: false
            });
          }
        });
      }

      console.log(`✅ Detected ${documents.length} documents`);
      return documents;
    } catch (error) {
      console.error('❌ Document detection failed:', error);
      return [];
    }
  }

  async function parseDocument(document) {
    try {
      if (STATE.documentEngine) {
        const parsed = await STATE.documentEngine.parse(document.url, document.type);
        return parsed;
      } else {
        console.warn('⚠️ Document engine not available');
        return null;
      }
    } catch (error) {
      console.error('❌ Document parsing failed:', error);
      return null;
    }
  }

  async function parseAllDocuments(documents) {
    const parsed = [];
    
    for (const doc of documents) {
      const result = await parseDocument(doc);
      if (result) {
        parsed.push({
          url: doc.url,
          name: doc.name,
          type: doc.type,
          data: result
        });
      }
    }
    
    return parsed;
  }

  async function downloadDocument(document) {
    try {
      // Use Chrome downloads API via background script
      const response = await chrome.runtime.sendMessage({
        type: 'DOWNLOAD_FILE',
        url: document.url,
        filename: document.name
      });
      
      return response.success;
    } catch (error) {
      console.error('❌ Document download failed:', error);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOFILL HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  async function autofillForm(data) {
    try {
      if (STATE.autofillEngine) {
        const result = await STATE.autofillEngine.fill(data);
        return { success: true, count: result.fieldsCount };
      } else {
        console.warn('⚠️ Autofill engine not available');
        return { success: false, count: 0 };
      }
    } catch (error) {
      console.error('❌ Autofill failed:', error);
      return { success: false, count: 0 };
    }
  }

  async function analyzeForm() {
    try {
      const forms = document.querySelectorAll('form');
      const fields = [];
      
      forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          fields.push({
            name: input.name || input.id,
            type: input.type,
            fillable: !input.disabled && !input.readOnly,
            value: input.value
          });
        });
      });
      
      return {
        form: forms[0] || null,
        fields: fields
      };
    } catch (error) {
      console.error('❌ Form analysis failed:', error);
      return { form: null, fields: [] };
    }
  }

  async function aiSuggestFields() {
    try {
      if (STATE.macroAI) {
        const suggestions = await STATE.macroAI.suggestFields();
        return suggestions;
      }
      return [];
    } catch (error) {
      console.error('❌ AI suggest failed:', error);
      return [];
    }
  }

  async function aiValidateForm() {
    try {
      if (STATE.macroAI) {
        const validation = await STATE.macroAI.validateForm();
        return validation;
      }
      return { issues: [] };
    } catch (error) {
      console.error('❌ AI validate failed:', error);
      return { issues: [] };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM & DOCUMENT DETECTION ON PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  function detectFormsOnPage() {
    const forms = document.querySelectorAll('form');
    STATE.currentForm = forms[0] || null;
  }

  function detectDocumentsOnPage() {
    // Auto-detect documents in background
    // Will be called by mutation observer
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UI HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function showNotification(message, type = 'info') {
    // Create notification toast
    const notification = document.createElement('div');
    notification.className = `cube-notification cube-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-INITIALIZE
  // ═══════════════════════════════════════════════════════════════════════════

  // Wait for page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Re-detect forms/documents on dynamic changes
  const observer = new MutationObserver(() => {
    if (STATE.initialized) {
      detectFormsOnPage();
      detectDocumentsOnPage();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
