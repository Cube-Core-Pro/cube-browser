/**
 * 🎓 CUBE Nexum v7.0.0 - Interactive Tour System
 * 
 * GUIDED ONBOARDING FOR EVERY FEATURE
 * 
 * Features:
 * - Step-by-step interactive tutorials
 * - Tooltips with animations
 * - Progress tracking
 * - Skip/Resume functionality
 * - Multi-language support ready
 * - Accessibility compliant
 * 
 * @version 1.0.0
 * @license CUBE Nexum Enterprise
 */

class TourService {
  constructor() {
    this.currentTour = null;
    this.currentStep = 0;
    this.overlay = null;
    this.tooltip = null;
    this.highlight = null;
    this.isActive = false;
    this.completedTours = new Set();
    
    // Tour definitions
    this.tours = {
      welcome: this.getWelcomeTour(),
      dashboard: this.getDashboardTour(),
      macros: this.getMacrosTour(),
      automation: this.getAutomationTour(),
      aiNexus: this.getAINexusTour(),
      p2p: this.getP2PTour(),
      remote: this.getRemoteTour(),
      screenshot: this.getScreenshotTour()
    };
    
    this.loadProgress();
    console.log('🎓 Tour Service v1.0.0 initialized');
  }

  // ============================================================================
  // TOUR DEFINITIONS
  // ============================================================================

  getWelcomeTour() {
    return {
      id: 'welcome',
      name: 'Welcome to CUBE Nexum',
      description: 'Get started with the basics',
      steps: [
        {
          title: '👋 Welcome to CUBE Nexum!',
          content: 'CUBE Nexum is your all-in-one browser automation platform. Let me show you around!',
          target: null, // No target = center screen
          position: 'center',
          emoji: '🚀'
        },
        {
          title: '📊 Command Dashboard',
          content: 'This is your home base. See real-time stats, quick actions, and system status at a glance.',
          target: '#tab-dashboard',
          position: 'right',
          emoji: '📊'
        },
        {
          title: '🎬 Macro Studio',
          content: 'Record your actions and replay them anytime. Perfect for repetitive tasks!',
          target: '[data-target="tab-macro"]',
          position: 'right',
          emoji: '🎬'
        },
        {
          title: '🤖 AI Nexus',
          content: 'Your AI assistant that can generate code, create workflows, and optimize selectors.',
          target: '[data-target="tab-ai-nexus"]',
          position: 'right',
          emoji: '🤖'
        },
        {
          title: '🎉 You\'re Ready!',
          content: 'Explore each feature by clicking on the tabs. Click the ? button anytime for help on a specific feature.',
          target: null,
          position: 'center',
          emoji: '🎉'
        }
      ]
    };
  }

  getDashboardTour() {
    return {
      id: 'dashboard',
      name: 'Dashboard Tour',
      description: 'Learn about the Command Dashboard',
      steps: [
        {
          title: '📊 Statistics Cards',
          content: 'These cards show your activity: forms filled, macros saved, screenshots taken, and time saved.',
          target: '.stat-card',
          position: 'bottom',
          emoji: '📈'
        },
        {
          title: '⚡ Quick Actions',
          content: 'One-click access to common tasks. Autofill, record macro, or take a screenshot instantly.',
          target: '.quick-actions',
          position: 'top',
          emoji: '⚡'
        },
        {
          title: '🛡️ System Health',
          content: 'Monitor which services are running and their status. Green = healthy!',
          target: '.system-health',
          position: 'left',
          emoji: '🛡️'
        }
      ]
    };
  }

  getMacrosTour() {
    return {
      id: 'macros',
      name: 'Macro Studio Tour',
      description: 'Learn to record and play macros',
      steps: [
        {
          title: '🎬 What are Macros?',
          content: 'Macros record your mouse clicks and keyboard inputs so you can replay them automatically.',
          target: null,
          position: 'center',
          emoji: '🎬'
        },
        {
          title: '⏺️ Record Button',
          content: 'Click to start recording. Everything you do in the browser will be saved.',
          target: '#btnRecordMacro',
          position: 'bottom',
          emoji: '⏺️'
        },
        {
          title: '▶️ Play Button',
          content: 'Select a saved macro and click Play to run it automatically.',
          target: '#btnPlayMacro',
          position: 'bottom',
          emoji: '▶️'
        },
        {
          title: '📝 Macro List',
          content: 'All your saved macros appear here. Click one to select it.',
          target: '#macroList',
          position: 'right',
          emoji: '📝'
        },
        {
          title: '💡 Pro Tip',
          content: 'Use keyboard shortcut Ctrl+Shift+M (Cmd+Shift+M on Mac) to quickly toggle recording!',
          target: null,
          position: 'center',
          emoji: '💡'
        }
      ]
    };
  }

  getAutomationTour() {
    return {
      id: 'automation',
      name: 'Automation Shell Tour',
      description: 'Learn to run automation commands',
      steps: [
        {
          title: '🖥️ Automation Shell',
          content: 'This is like a command line for browser automation. Type commands to control the page.',
          target: null,
          position: 'center',
          emoji: '🖥️'
        },
        {
          title: '📝 Command Input',
          content: 'Type your automation command here. Try "click #button" or "type #input Hello".',
          target: '#automationInput',
          position: 'top',
          emoji: '📝'
        },
        {
          title: '📚 Available Commands',
          content: 'click, type, scroll, wait, screenshot, extract - and many more! Type "help" to see all.',
          target: '.command-list',
          position: 'left',
          emoji: '📚'
        },
        {
          title: '📋 Output Panel',
          content: 'Results and extracted data appear here. You can copy or export them.',
          target: '#automationOutput',
          position: 'top',
          emoji: '📋'
        }
      ]
    };
  }

  getAINexusTour() {
    return {
      id: 'aiNexus',
      name: 'AI Nexus Tour',
      description: 'Learn about AI-powered features',
      steps: [
        {
          title: '🤖 Meet AI Nexus',
          content: 'Your intelligent assistant for automation. It can generate code, optimize selectors, and create workflows.',
          target: null,
          position: 'center',
          emoji: '🤖'
        },
        {
          title: '🔮 AI Personalities',
          content: 'Choose between CIPHER (analysis), NEXUS (code), SENTINEL (security), or FORGE (creative).',
          target: '#btnChangePersonality',
          position: 'left',
          emoji: '🔮'
        },
        {
          title: '💬 Chat Mode',
          content: 'Ask questions in natural language. "How do I extract all emails from this page?"',
          target: '[data-mode="assistant"]',
          position: 'bottom',
          emoji: '💬'
        },
        {
          title: '💻 Code Mode',
          content: 'Describe what you need and AI generates production-ready code.',
          target: '[data-mode="code"]',
          position: 'bottom',
          emoji: '💻'
        },
        {
          title: '⚡ Workflow Mode',
          content: 'Describe a task and AI creates a step-by-step automation workflow.',
          target: '[data-mode="workflow"]',
          position: 'bottom',
          emoji: '⚡'
        },
        {
          title: '🎯 Selector Mode',
          content: 'Describe an element and AI generates robust CSS selectors and XPath.',
          target: '[data-mode="selector"]',
          position: 'bottom',
          emoji: '🎯'
        },
        {
          title: '⚙️ API Key Required',
          content: 'To use AI features, add your OpenAI or Gemini API key in Settings.',
          target: null,
          position: 'center',
          emoji: '🔑'
        }
      ]
    };
  }

  getP2PTour() {
    return {
      id: 'p2p',
      name: 'P2P File Sharing Tour',
      description: 'Learn to share files directly between computers',
      steps: [
        {
          title: '🔗 Peer-to-Peer Sharing',
          content: 'Send files directly to another computer. No server, no cloud, no limits!',
          target: null,
          position: 'center',
          emoji: '🔗'
        },
        {
          title: '📤 Send Files',
          content: 'Click "Generate Code" to create a connection code. Share this with the receiver.',
          target: '#btnGenerateP2PCode',
          position: 'bottom',
          emoji: '📤'
        },
        {
          title: '📥 Receive Files',
          content: 'Enter the sender\'s code and click Connect to receive files.',
          target: '#p2pCodeInput',
          position: 'top',
          emoji: '📥'
        },
        {
          title: '📋 Connection Code',
          content: 'This code contains everything needed to connect. Copy and share it securely.',
          target: '#p2pConnectionCode',
          position: 'bottom',
          emoji: '📋'
        },
        {
          title: '🔒 Secure Transfer',
          content: 'All transfers are encrypted end-to-end. No one else can see your files.',
          target: null,
          position: 'center',
          emoji: '🔒'
        }
      ]
    };
  }

  getRemoteTour() {
    return {
      id: 'remote',
      name: 'Remote Desktop Tour',
      description: 'Learn to share your screen',
      steps: [
        {
          title: '🛰️ Remote Operations',
          content: 'Share your screen or connect to another computer - better than TeamViewer!',
          target: null,
          position: 'center',
          emoji: '🛰️'
        },
        {
          title: '🖥️ Host Mode',
          content: 'Click to share your screen. You\'ll get a 6-digit code to share.',
          target: '#btnStartHost',
          position: 'bottom',
          emoji: '🖥️'
        },
        {
          title: '👁️ Viewer Mode',
          content: 'Enter a host\'s code to view their screen.',
          target: '#remoteCodeInput',
          position: 'top',
          emoji: '👁️'
        },
        {
          title: '🖱️ Remote Control',
          content: 'With permission, you can control the mouse and keyboard remotely.',
          target: '#btnEnableControl',
          position: 'bottom',
          emoji: '🖱️'
        },
        {
          title: '⚡ Low Latency',
          content: 'WebRTC provides under 20ms latency for smooth control!',
          target: null,
          position: 'center',
          emoji: '⚡'
        }
      ]
    };
  }

  getScreenshotTour() {
    return {
      id: 'screenshot',
      name: 'Screen Capture Tour',
      description: 'Learn about capture options',
      steps: [
        {
          title: '📸 Screen Capture',
          content: 'Capture screenshots, record video, and even use OCR to extract text!',
          target: null,
          position: 'center',
          emoji: '📸'
        },
        {
          title: '🖼️ Capture Modes',
          content: 'Full page, visible area, or select a region - choose what works best.',
          target: '.capture-mode-selector',
          position: 'bottom',
          emoji: '🖼️'
        },
        {
          title: '🎥 Screen Recording',
          content: 'Record your screen with or without audio. Great for tutorials!',
          target: '#btnStartScreenRecording',
          position: 'bottom',
          emoji: '🎥'
        },
        {
          title: '🔤 OCR Extract',
          content: 'Click to extract text from images using OCR. Works offline!',
          target: '#btnOCRExtract',
          position: 'bottom',
          emoji: '🔤'
        },
        {
          title: '⌨️ Keyboard Shortcut',
          content: 'Use Ctrl+Shift+S (Cmd+Shift+S on Mac) for quick capture!',
          target: null,
          position: 'center',
          emoji: '⌨️'
        }
      ]
    };
  }

  // ============================================================================
  // TOUR ENGINE
  // ============================================================================

  /**
   * Start a tour
   * @param {string} tourId - ID of the tour to start
   */
  async startTour(tourId) {
    const tour = this.tours[tourId];
    if (!tour) {
      console.error('Tour not found:', tourId);
      return;
    }
    
    this.currentTour = tour;
    this.currentStep = 0;
    this.isActive = true;
    
    this.createOverlay();
    this.showStep(0);
    
    console.log(`🎓 Starting tour: ${tour.name}`);
  }

  /**
   * Show a specific step
   * @param {number} stepIndex - Step index to show
   */
  showStep(stepIndex) {
    if (!this.currentTour || stepIndex >= this.currentTour.steps.length) {
      this.endTour();
      return;
    }
    
    this.currentStep = stepIndex;
    const step = this.currentTour.steps[stepIndex];
    const totalSteps = this.currentTour.steps.length;
    
    // Find target element
    let targetEl = null;
    if (step.target) {
      targetEl = document.querySelector(step.target);
    }
    
    // Update highlight
    this.updateHighlight(targetEl);
    
    // Update tooltip
    this.updateTooltip(step, stepIndex, totalSteps, targetEl);
    
    // Scroll target into view
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Create overlay elements
   */
  createOverlay() {
    // Remove existing
    this.removeOverlay();
    
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'cube-tour-overlay';
    this.overlay.innerHTML = `
      <style>
        .cube-tour-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 999998;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        
        .cube-tour-highlight {
          position: fixed;
          box-shadow: 0 0 0 4px #8b5cf6, 0 0 0 8px rgba(124, 58, 237, 0.3);
          border-radius: 8px;
          z-index: 999999;
          pointer-events: none;
          transition: all 0.3s ease;
          animation: cube-tour-pulse 2s infinite;
        }
        
        @keyframes cube-tour-pulse {
          0%, 100% { box-shadow: 0 0 0 4px #8b5cf6, 0 0 0 8px rgba(124, 58, 237, 0.3); }
          50% { box-shadow: 0 0 0 4px #8b5cf6, 0 0 0 16px rgba(124, 58, 237, 0.1); }
        }
        
        .cube-tour-tooltip {
          position: fixed;
          max-width: 360px;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          border: 1px solid rgba(124, 58, 237, 0.5);
          border-radius: 16px;
          padding: 20px;
          z-index: 1000000;
          pointer-events: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          animation: cube-tour-appear 0.3s ease;
        }
        
        @keyframes cube-tour-appear {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .cube-tour-tooltip-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .cube-tour-emoji {
          font-size: 32px;
          line-height: 1;
        }
        
        .cube-tour-title {
          font-size: 18px;
          font-weight: 700;
          color: white;
        }
        
        .cube-tour-content {
          color: #9ca3af;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        
        .cube-tour-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        
        .cube-tour-progress {
          display: flex;
          gap: 4px;
        }
        
        .cube-tour-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #374151;
          transition: all 0.3s ease;
        }
        
        .cube-tour-dot.active {
          background: #8b5cf6;
          width: 24px;
          border-radius: 4px;
        }
        
        .cube-tour-dot.completed {
          background: #10b981;
        }
        
        .cube-tour-buttons {
          display: flex;
          gap: 8px;
        }
        
        .cube-tour-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        
        .cube-tour-btn-secondary {
          background: #374151;
          color: #9ca3af;
        }
        
        .cube-tour-btn-secondary:hover {
          background: #4b5563;
          color: white;
        }
        
        .cube-tour-btn-primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          color: white;
        }
        
        .cube-tour-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        
        .cube-tour-skip {
          position: fixed;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          border: none;
          z-index: 1000001;
          pointer-events: auto;
        }
        
        .cube-tour-skip:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      </style>
    `;
    
    document.body.appendChild(this.overlay);
    
    // Create highlight
    this.highlight = document.createElement('div');
    this.highlight.className = 'cube-tour-highlight';
    this.highlight.style.display = 'none';
    document.body.appendChild(this.highlight);
    
    // Create tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'cube-tour-tooltip';
    document.body.appendChild(this.tooltip);
    
    // Create skip button
    const skipBtn = document.createElement('button');
    skipBtn.className = 'cube-tour-skip';
    skipBtn.textContent = '✕ Skip Tour';
    skipBtn.onclick = () => this.endTour();
    document.body.appendChild(skipBtn);
    this.skipBtn = skipBtn;
  }

  /**
   * Update highlight position
   * @param {Element} targetEl - Target element to highlight
   */
  updateHighlight(targetEl) {
    if (!targetEl) {
      this.highlight.style.display = 'none';
      return;
    }
    
    const rect = targetEl.getBoundingClientRect();
    const padding = 8;
    
    this.highlight.style.display = 'block';
    this.highlight.style.left = `${rect.left - padding}px`;
    this.highlight.style.top = `${rect.top - padding}px`;
    this.highlight.style.width = `${rect.width + padding * 2}px`;
    this.highlight.style.height = `${rect.height + padding * 2}px`;
  }

  /**
   * Update tooltip content and position
   */
  updateTooltip(step, stepIndex, totalSteps, targetEl) {
    // Generate progress dots
    let dotsHtml = '';
    for (let i = 0; i < totalSteps; i++) {
      const classes = ['cube-tour-dot'];
      if (i < stepIndex) classes.push('completed');
      if (i === stepIndex) classes.push('active');
      dotsHtml += `<div class="${classes.join(' ')}"></div>`;
    }
    
    // Generate buttons
    const isFirst = stepIndex === 0;
    const isLast = stepIndex === totalSteps - 1;
    
    this.tooltip.innerHTML = `
      <div class="cube-tour-tooltip-header">
        <span class="cube-tour-emoji">${step.emoji || '💡'}</span>
        <span class="cube-tour-title">${step.title}</span>
      </div>
      <div class="cube-tour-content">${step.content}</div>
      <div class="cube-tour-footer">
        <div class="cube-tour-progress">${dotsHtml}</div>
        <div class="cube-tour-buttons">
          ${!isFirst ? '<button class="cube-tour-btn cube-tour-btn-secondary" data-action="prev">← Back</button>' : ''}
          <button class="cube-tour-btn cube-tour-btn-primary" data-action="${isLast ? 'finish' : 'next'}">
            ${isLast ? '✓ Finish' : 'Next →'}
          </button>
        </div>
      </div>
    `;
    
    // Bind button events
    this.tooltip.querySelectorAll('[data-action]').forEach(btn => {
      btn.onclick = () => {
        const action = btn.dataset.action;
        if (action === 'prev') this.prevStep();
        else if (action === 'next') this.nextStep();
        else if (action === 'finish') this.endTour(true);
      };
    });
    
    // Position tooltip
    this.positionTooltip(step.position, targetEl);
  }

  /**
   * Position tooltip relative to target
   */
  positionTooltip(position, targetEl) {
    const tooltip = this.tooltip;
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 16;
    
    let left, top;
    
    if (!targetEl || position === 'center') {
      // Center on screen
      left = (window.innerWidth - tooltipRect.width) / 2;
      top = (window.innerHeight - tooltipRect.height) / 2;
    } else {
      const targetRect = targetEl.getBoundingClientRect();
      
      switch (position) {
        case 'top':
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          top = targetRect.top - tooltipRect.height - padding;
          break;
        case 'bottom':
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          top = targetRect.bottom + padding;
          break;
        case 'left':
          left = targetRect.left - tooltipRect.width - padding;
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          break;
        case 'right':
          left = targetRect.right + padding;
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          break;
        default:
          left = targetRect.right + padding;
          top = targetRect.top;
      }
    }
    
    // Keep within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  /**
   * Go to next step
   */
  nextStep() {
    this.showStep(this.currentStep + 1);
  }

  /**
   * Go to previous step
   */
  prevStep() {
    this.showStep(this.currentStep - 1);
  }

  /**
   * End the current tour
   * @param {boolean} completed - Whether tour was completed
   */
  endTour(completed = false) {
    if (this.currentTour && completed) {
      this.completedTours.add(this.currentTour.id);
      this.saveProgress();
    }
    
    this.removeOverlay();
    this.currentTour = null;
    this.currentStep = 0;
    this.isActive = false;
    
    console.log('🎓 Tour ended');
  }

  /**
   * Remove overlay elements
   */
  removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.highlight) {
      this.highlight.remove();
      this.highlight = null;
    }
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    if (this.skipBtn) {
      this.skipBtn.remove();
      this.skipBtn = null;
    }
  }

  /**
   * Save progress to storage
   */
  async saveProgress() {
    try {
      await chrome.storage.local.set({
        cubeTourProgress: Array.from(this.completedTours)
      });
    } catch (error) {
      console.warn('Failed to save tour progress:', error);
    }
  }

  /**
   * Load progress from storage
   */
  async loadProgress() {
    try {
      const result = await chrome.storage.local.get(['cubeTourProgress']);
      if (result.cubeTourProgress) {
        this.completedTours = new Set(result.cubeTourProgress);
      }
    } catch (error) {
      console.warn('Failed to load tour progress:', error);
    }
  }

  /**
   * Check if a tour is completed
   * @param {string} tourId - Tour ID to check
   * @returns {boolean}
   */
  isTourCompleted(tourId) {
    return this.completedTours.has(tourId);
  }

  /**
   * Reset tour progress
   */
  async resetProgress() {
    this.completedTours.clear();
    await this.saveProgress();
  }

  /**
   * Get list of available tours
   * @returns {Array} - Array of tour info
   */
  getAvailableTours() {
    return Object.values(this.tours).map(tour => ({
      id: tour.id,
      name: tour.name,
      description: tour.description,
      steps: tour.steps.length,
      completed: this.completedTours.has(tour.id)
    }));
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.TourService = TourService;
  window.cubeTour = new TourService();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TourService;
}
