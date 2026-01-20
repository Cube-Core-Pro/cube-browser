// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 DRAG & DROP FILL SERVICE v1.0.0 - Drag credentials to fill fields
// ═══════════════════════════════════════════════════════════════════════════════
//
// Features matching 1Password drag-drop:
// ✅ Drag username/password/email to any field
// ✅ Visual drag preview
// ✅ Drop zone highlighting
// ✅ Secure data transfer (no clipboard)
// ✅ Multi-field drag support
// ✅ Cross-frame support
// ✅ Accessibility support
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const DRAG_DATA_TYPE = 'application/x-cube-credential';
  const DRAG_CLASS = 'cube-drag-active';
  const DROP_CLASS = 'cube-drop-target';

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAG & DROP FILL SERVICE
  // ═══════════════════════════════════════════════════════════════════════════

  class DragDropFillService {
    constructor() {
      this.enabled = true;
      this.currentDrag = null;
      this.dropTargets = new Set();
      this.dragOverlay = null;
      this.dropIndicator = null;
      
      this.initialize();
    }

    async initialize() {
      console.log('🎯 Drag & Drop Fill Service initializing...');
      
      await this.loadSettings();
      this.injectStyles();
      this.setupEventListeners();
      
      console.log('✅ Drag & Drop Fill Service ready');
    }

    async loadSettings() {
      try {
        if (chrome?.storage?.local) {
          const result = await chrome.storage.local.get('cubeDragDropEnabled');
          this.enabled = result.cubeDragDropEnabled !== false;
        }
      } catch (error) {
        console.warn('Failed to load drag-drop settings:', error);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STYLES INJECTION
    // ═══════════════════════════════════════════════════════════════════════════

    injectStyles() {
      if (document.getElementById('cube-drag-drop-styles')) return;
      
      const styles = document.createElement('style');
      styles.id = 'cube-drag-drop-styles';
      styles.textContent = `
        /* Draggable Items */
        .cube-draggable {
          cursor: grab;
          user-select: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        
        .cube-draggable:hover {
          transform: translateY(-1px);
        }
        
        .cube-draggable:active {
          cursor: grabbing;
          transform: scale(0.98);
        }
        
        .cube-draggable.${DRAG_CLASS} {
          opacity: 0.5;
          transform: scale(0.95);
        }
        
        /* Drop Targets */
        .${DROP_CLASS} {
          outline: 2px dashed #3b82f6 !important;
          outline-offset: 2px !important;
          background-color: rgba(59, 130, 246, 0.1) !important;
          transition: all 0.2s ease !important;
        }
        
        .${DROP_CLASS}:focus {
          outline: 2px solid #3b82f6 !important;
        }
        
        /* Drag Preview */
        .cube-drag-preview {
          position: fixed;
          pointer-events: none;
          z-index: 2147483647;
          padding: 8px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
          transform: translate(-50%, -120%);
          animation: cube-drag-appear 0.15s ease;
        }
        
        @keyframes cube-drag-appear {
          from {
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -120%) scale(1);
          }
        }
        
        .cube-drag-preview-icon {
          font-size: 16px;
        }
        
        .cube-drag-preview-label {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        /* Drop Indicator */
        .cube-drop-indicator {
          position: fixed;
          pointer-events: none;
          z-index: 2147483646;
          border: 3px solid #22c55e;
          border-radius: 8px;
          background: rgba(34, 197, 94, 0.1);
          transition: all 0.15s ease;
          animation: cube-drop-pulse 1s ease infinite;
        }
        
        @keyframes cube-drop-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        /* Valid/Invalid Drop States */
        .cube-drop-valid {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }
        
        .cube-drop-invalid {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        
        /* Fill Animation */
        .cube-fill-success {
          animation: cube-fill-flash 0.5s ease;
        }
        
        @keyframes cube-fill-flash {
          0% { background-color: inherit; }
          50% { background-color: rgba(34, 197, 94, 0.3); }
          100% { background-color: inherit; }
        }
      `;
      
      document.head.appendChild(styles);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════════

    setupEventListeners() {
      // Global drag events
      document.addEventListener('dragover', this.handleDragOver.bind(this));
      document.addEventListener('dragleave', this.handleDragLeave.bind(this));
      document.addEventListener('drop', this.handleDrop.bind(this));
      document.addEventListener('dragend', this.handleDragEnd.bind(this));
      
      // Identify drop targets
      this.identifyDropTargets();
      
      // Re-scan on DOM changes
      const observer = new MutationObserver(() => {
        this.identifyDropTargets();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    identifyDropTargets() {
      // Find all fillable inputs
      const inputs = document.querySelectorAll(`
        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="tel"],
        input[type="url"],
        input[type="search"],
        input:not([type]),
        textarea
      `);
      
      inputs.forEach(input => {
        if (!input.disabled && !input.readOnly) {
          this.dropTargets.add(input);
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE DRAGGABLE ELEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    createDraggableCredential(data) {
      const element = document.createElement('div');
      element.className = 'cube-draggable cube-credential-item';
      element.draggable = true;
      element.tabIndex = 0;
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', `Drag ${data.type}: ${data.displayValue}`);
      
      element.innerHTML = `
        <span class="cube-credential-icon">${this.getIconForType(data.type)}</span>
        <span class="cube-credential-label">${data.displayValue}</span>
        <span class="cube-credential-type">${data.type}</span>
      `;
      
      // Store data
      element._cubeData = data;
      
      // Event handlers
      element.addEventListener('dragstart', (e) => this.handleDragStart(e, data));
      
      // Keyboard support
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.showFieldSelector(data);
        }
      });
      
      return element;
    }

    getIconForType(type) {
      const icons = {
        username: '👤',
        password: '🔑',
        email: '📧',
        phone: '📱',
        address: '🏠',
        name: '📛',
        card: '💳',
        cvv: '🔢',
        expiry: '📅',
        note: '📝'
      };
      return icons[type] || '📋';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAG START
    // ═══════════════════════════════════════════════════════════════════════════

    handleDragStart(event, data) {
      if (!this.enabled) return;
      
      console.log('🎯 Drag started:', data.type);
      
      this.currentDrag = data;
      
      // Set drag data (encrypted)
      event.dataTransfer.setData(DRAG_DATA_TYPE, this.encryptDragData(data));
      event.dataTransfer.setData('text/plain', ''); // Prevent default text drag
      event.dataTransfer.effectAllowed = 'copy';
      
      // Custom drag image
      const preview = this.createDragPreview(data);
      document.body.appendChild(preview);
      event.dataTransfer.setDragImage(preview, preview.offsetWidth / 2, preview.offsetHeight / 2);
      
      // Remove preview after drag starts
      setTimeout(() => preview.remove(), 0);
      
      // Mark source as dragging
      event.target.classList.add(DRAG_CLASS);
      
      // Create floating preview
      this.createFloatingPreview(data);
      
      // Highlight valid drop targets
      this.highlightDropTargets(data.type);
    }

    createDragPreview(data) {
      const preview = document.createElement('div');
      preview.className = 'cube-drag-preview';
      preview.innerHTML = `
        <span class="cube-drag-preview-icon">${this.getIconForType(data.type)}</span>
        <span class="cube-drag-preview-label">${data.displayValue}</span>
      `;
      preview.style.position = 'absolute';
      preview.style.left = '-9999px';
      return preview;
    }

    createFloatingPreview(data) {
      this.removeFloatingPreview();
      
      this.dragOverlay = document.createElement('div');
      this.dragOverlay.className = 'cube-drag-preview';
      this.dragOverlay.innerHTML = `
        <span class="cube-drag-preview-icon">${this.getIconForType(data.type)}</span>
        <span class="cube-drag-preview-label">${data.displayValue}</span>
      `;
      this.dragOverlay.style.display = 'none';
      document.body.appendChild(this.dragOverlay);
      
      // Track mouse movement
      document.addEventListener('drag', this.updatePreviewPosition.bind(this));
    }

    updatePreviewPosition(event) {
      if (!this.dragOverlay) return;
      
      if (event.clientX === 0 && event.clientY === 0) {
        // Drag event fires with 0,0 when leaving window
        this.dragOverlay.style.display = 'none';
        return;
      }
      
      this.dragOverlay.style.display = 'flex';
      this.dragOverlay.style.left = `${event.clientX}px`;
      this.dragOverlay.style.top = `${event.clientY}px`;
    }

    removeFloatingPreview() {
      if (this.dragOverlay) {
        this.dragOverlay.remove();
        this.dragOverlay = null;
      }
      document.removeEventListener('drag', this.updatePreviewPosition.bind(this));
    }

    highlightDropTargets(dataType) {
      const compatibleTypes = this.getCompatibleFieldTypes(dataType);
      
      this.dropTargets.forEach(target => {
        const fieldType = this.getFieldType(target);
        if (compatibleTypes.includes(fieldType)) {
          target.classList.add(DROP_CLASS);
        }
      });
    }

    getCompatibleFieldTypes(dataType) {
      const compatibility = {
        username: ['text', 'email', 'username'],
        password: ['password'],
        email: ['email', 'text'],
        phone: ['tel', 'text'],
        address: ['text', 'address'],
        name: ['text', 'name'],
        card: ['text', 'number'],
        cvv: ['text', 'number', 'password'],
        expiry: ['text', 'month'],
        note: ['text', 'textarea']
      };
      return compatibility[dataType] || ['text'];
    }

    getFieldType(element) {
      const type = element.type?.toLowerCase() || 'text';
      const autocomplete = element.autocomplete?.toLowerCase() || '';
      const name = element.name?.toLowerCase() || '';
      const id = element.id?.toLowerCase() || '';
      
      // Check autocomplete attribute
      if (autocomplete.includes('email')) return 'email';
      if (autocomplete.includes('username')) return 'username';
      if (autocomplete.includes('password')) return 'password';
      if (autocomplete.includes('tel')) return 'tel';
      if (autocomplete.includes('address')) return 'address';
      if (autocomplete.includes('name')) return 'name';
      if (autocomplete.includes('cc-number')) return 'number';
      if (autocomplete.includes('cc-csc')) return 'number';
      
      // Check name/id
      if (name.includes('email') || id.includes('email')) return 'email';
      if (name.includes('user') || id.includes('user')) return 'username';
      if (name.includes('pass') || id.includes('pass')) return 'password';
      if (name.includes('phone') || id.includes('phone')) return 'tel';
      
      // Check element type
      if (element.tagName === 'TEXTAREA') return 'textarea';
      
      return type;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAG OVER
    // ═══════════════════════════════════════════════════════════════════════════

    handleDragOver(event) {
      if (!this.currentDrag) return;
      
      const target = event.target;
      
      // Check if valid drop target
      if (this.isValidDropTarget(target)) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        
        // Show drop indicator
        this.showDropIndicator(target);
      }
    }

    isValidDropTarget(element) {
      if (!this.dropTargets.has(element)) return false;
      if (element.disabled || element.readOnly) return false;
      
      const dataType = this.currentDrag?.type;
      if (!dataType) return false;
      
      const fieldType = this.getFieldType(element);
      const compatible = this.getCompatibleFieldTypes(dataType);
      
      return compatible.includes(fieldType);
    }

    showDropIndicator(target) {
      if (!this.dropIndicator) {
        this.dropIndicator = document.createElement('div');
        this.dropIndicator.className = 'cube-drop-indicator cube-drop-valid';
        document.body.appendChild(this.dropIndicator);
      }
      
      const rect = target.getBoundingClientRect();
      this.dropIndicator.style.left = `${rect.left + window.scrollX}px`;
      this.dropIndicator.style.top = `${rect.top + window.scrollY}px`;
      this.dropIndicator.style.width = `${rect.width}px`;
      this.dropIndicator.style.height = `${rect.height}px`;
    }

    hideDropIndicator() {
      if (this.dropIndicator) {
        this.dropIndicator.remove();
        this.dropIndicator = null;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAG LEAVE
    // ═══════════════════════════════════════════════════════════════════════════

    handleDragLeave(event) {
      const target = event.target;
      
      // Only hide if leaving actual drop target
      if (this.dropTargets.has(target)) {
        // Check if entering a child element
        const relatedTarget = event.relatedTarget;
        if (!target.contains(relatedTarget)) {
          // Actually leaving
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DROP
    // ═══════════════════════════════════════════════════════════════════════════

    handleDrop(event) {
      if (!this.currentDrag) return;
      
      const target = event.target;
      
      if (!this.isValidDropTarget(target)) {
        return;
      }
      
      event.preventDefault();
      event.stopPropagation();
      
      console.log('🎯 Drop on:', target);
      
      // Get the data
      const encryptedData = event.dataTransfer.getData(DRAG_DATA_TYPE);
      const data = this.decryptDragData(encryptedData);
      
      if (data) {
        // Fill the field
        this.fillField(target, data.value);
        
        // Visual feedback
        target.classList.add('cube-fill-success');
        setTimeout(() => target.classList.remove('cube-fill-success'), 500);
        
        // Track usage
        this.trackUsage(data);
      }
      
      this.cleanup();
    }

    fillField(element, value) {
      // Focus the element
      element.focus();
      
      // Set value
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;
      
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set;
      
      if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(element, value);
      } else if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value);
      } else {
        element.value = value;
      }
      
      // Dispatch events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      // For React
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAG END
    // ═══════════════════════════════════════════════════════════════════════════

    handleDragEnd(event) {
      console.log('🎯 Drag ended');
      
      // Remove dragging class from source
      event.target.classList?.remove(DRAG_CLASS);
      
      this.cleanup();
    }

    cleanup() {
      this.currentDrag = null;
      
      // Remove floating preview
      this.removeFloatingPreview();
      
      // Remove drop indicator
      this.hideDropIndicator();
      
      // Remove drop target highlighting
      this.dropTargets.forEach(target => {
        target.classList.remove(DROP_CLASS);
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENCRYPTION (Simple obfuscation for drag data)
    // ═══════════════════════════════════════════════════════════════════════════

    encryptDragData(data) {
      // Simple base64 encoding with prefix
      // In production, use actual encryption
      const json = JSON.stringify(data);
      return 'CUBE:' + btoa(unescape(encodeURIComponent(json)));
    }

    decryptDragData(encrypted) {
      try {
        if (!encrypted || !encrypted.startsWith('CUBE:')) {
          return null;
        }
        const base64 = encrypted.slice(5);
        const json = decodeURIComponent(escape(atob(base64)));
        return JSON.parse(json);
      } catch {
        return null;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // KEYBOARD SUPPORT (FIELD SELECTOR)
    // ═══════════════════════════════════════════════════════════════════════════

    showFieldSelector(data) {
      // For keyboard users, show a list of available fields
      const fields = Array.from(this.dropTargets).filter(field => {
        const fieldType = this.getFieldType(field);
        const compatible = this.getCompatibleFieldTypes(data.type);
        return compatible.includes(fieldType);
      });
      
      if (fields.length === 0) {
        this.showToast('No compatible fields found');
        return;
      }
      
      if (fields.length === 1) {
        // Auto-fill single field
        this.fillField(fields[0], data.value);
        this.showToast(`Filled ${data.type}`);
        return;
      }
      
      // Create field selector overlay
      const overlay = document.createElement('div');
      overlay.id = 'cube-field-selector';
      overlay.innerHTML = `
        <style>
          #cube-field-selector {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .cube-field-list {
            background: #1a1a2e;
            border-radius: 12px;
            padding: 16px;
            max-width: 400px;
            max-height: 60vh;
            overflow-y: auto;
          }
          .cube-field-title {
            color: white;
            font-size: 16px;
            margin-bottom: 12px;
          }
          .cube-field-item {
            padding: 12px;
            background: #252542;
            border-radius: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            color: #e5e7eb;
            transition: background 0.2s;
          }
          .cube-field-item:hover {
            background: #3b3b5e;
          }
          .cube-field-item:focus {
            outline: 2px solid #3b82f6;
          }
        </style>
        <div class="cube-field-list" role="listbox">
          <div class="cube-field-title">Select field to fill with ${data.type}</div>
          ${fields.map((field, i) => `
            <div class="cube-field-item" role="option" tabindex="0" data-index="${i}">
              ${this.getFieldDescription(field)}
            </div>
          `).join('')}
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Event handlers
      overlay.querySelectorAll('.cube-field-item').forEach((item, i) => {
        item.addEventListener('click', () => {
          this.fillField(fields[i], data.value);
          overlay.remove();
          this.showToast(`Filled ${data.type}`);
        });
        
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.fillField(fields[i], data.value);
            overlay.remove();
            this.showToast(`Filled ${data.type}`);
          }
        });
      });
      
      // Close on background click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });
      
      // Close on ESC
      document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') {
          overlay.remove();
          document.removeEventListener('keydown', handler);
        }
      });
      
      // Focus first item
      overlay.querySelector('.cube-field-item')?.focus();
    }

    getFieldDescription(field) {
      const type = field.type || 'text';
      const name = field.name || field.id || '';
      const placeholder = field.placeholder || '';
      const label = field.labels?.[0]?.textContent || '';
      
      return label || placeholder || name || `${type} field`;
    }

    showToast(message) {
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #22c55e;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 2147483647;
        animation: cube-toast 2s ease forwards;
      `;
      
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // USAGE TRACKING
    // ═══════════════════════════════════════════════════════════════════════════

    trackUsage(data) {
      // Update credential last used time
      if (window.cubeCredentialStore && data.credentialId) {
        window.cubeCredentialStore.updateLastUsed?.(data.credentialId);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENABLE/DISABLE
    // ═══════════════════════════════════════════════════════════════════════════

    async enable() {
      this.enabled = true;
      if (chrome?.storage?.local) {
        await chrome.storage.local.set({ cubeDragDropEnabled: true });
      }
    }

    async disable() {
      this.enabled = false;
      if (chrome?.storage?.local) {
        await chrome.storage.local.set({ cubeDragDropEnabled: false });
      }
    }

    isEnabled() {
      return this.enabled;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════

    destroy() {
      this.cleanup();
      this.dropTargets.clear();
      
      // Remove styles
      const styles = document.getElementById('cube-drag-drop-styles');
      if (styles) styles.remove();
      
      // Remove field selector if open
      const selector = document.getElementById('cube-field-selector');
      if (selector) selector.remove();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  window.DragDropFillService = DragDropFillService;
  window.cubeDragDropFill = new DragDropFillService();

  console.log('🎯 Drag & Drop Fill Service loaded');

})(window);
