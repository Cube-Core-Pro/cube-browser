// ═══════════════════════════════════════════════════════════════════════════════
// 🏦 LENDINGPAD DOCUMENT DETECTOR v2.0 - ENTERPRISE GRADE
// ═══════════════════════════════════════════════════════════════════════════════
//
// FEATURES:
// - Detecta documentos en panel de LendingPad
// - Soporte para dropdowns con múltiples archivos
// - Extracción desde Angular scope
// - Descarga directa de archivos
// - Integración con FIGURE Algorithm
// - Retry automático con exponential backoff
// - Validación de datos completa
// - Error recovery robusto
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const CONFIG = {
    SELECTORS: {
      // Document Panel
      documentPanel: '[data-collapse="panelLoanDocuments"]',
      documentPanelAlt: '.panel-loan-documents, #loanDocuments, [id*="documents"]',
      
      // Download Buttons
      downloadButtons: '.document-list__button button[title*="Download"]',
      downloadButtonsAlt: 'button[title*="download"], .btn-download, .download-btn',
      
      // Dropdowns
      dropdownMenus: '.dropdown-menu.pull-right',
      dropdownMenusAlt: '.dropdown-menu, ul[role="menu"]',
      dropdowns: '.document-list__button .dropdown',
      dropdownsAlt: '.dropdown, .btn-group',
      
      // File Links
      fileLinks: 'a[ng-click*="downloadFile"]',
      fileLinksAlt: 'a[ng-click*="download"], a[onclick*="download"]',
      
      // Document Items
      documentItems: 'li[ng-repeat*="file"]',
      documentItemsAlt: 'li[ng-repeat], .file-item, .document-item',
      
      // Angular Controllers
      angularController: '[ng-controller*="panelLoanDocuments"]',
      angularControllerAlt: '[ng-controller*="documents"], [ng-controller*="loan"]',
      
      // Document Names/Titles
      documentName: '.document-name, .document-title, .doc-title',
      documentType: '.document-type, .doc-type',
      
      // FIGURE-specific (from algorithm)
      figureZipUpload: 'input[type="file"][accept*=".zip"]',
      figureDocList: '.figure-documents, .uploaded-documents'
    },
    
    // Retry Configuration
    RETRY: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      exponentialBase: 2
    },
    
    // Timeouts
    TIMEOUTS: {
      angularWait: 500,
      dropdownExpand: 200,
      downloadClick: 1000,
      documentLoad: 3000
    },
    
    DEBUG: false,
    VERSION: '2.0.0'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LENDINGPAD DETECTOR - ENTERPRISE GRADE
  // ═══════════════════════════════════════════════════════════════════════════

  class LendingPadDetector {
    
    static async detectDocuments() {
      log('🏦 Starting LendingPad document detection v2.0...');
      
      // Wait for page to be ready
      await this.waitForPageReady();

      const documents = [];
      const errors = [];

      try {
        // Método 1: Desde botones de descarga visibles (CON RETRY)
        try {
          const fromButtons = await this.withRetry(() => this.detectFromDownloadButtons());
          documents.push(...fromButtons);
          log(`✅ Method 1: Found ${fromButtons.length} documents from buttons`);
        } catch (error) {
          errors.push({ method: 'buttons', error: error.message });
          log('⚠️ Method 1 failed:', error.message);
        }

        // Método 2: Desde Angular scope (CON RETRY)
        try {
          const fromAngular = await this.withRetry(() => this.detectFromAngularScope());
          documents.push(...fromAngular);
          log(`✅ Method 2: Found ${fromAngular.length} documents from Angular scope`);
        } catch (error) {
          errors.push({ method: 'angular', error: error.message });
          log('⚠️ Method 2 failed:', error.message);
        }

        // Método 3: Desde dropdowns expandidos (CON RETRY)
        try {
          const fromDropdowns = await this.withRetry(() => this.detectFromDropdowns());
          documents.push(...fromDropdowns);
          log(`✅ Method 3: Found ${fromDropdowns.length} documents from dropdowns`);
        } catch (error) {
          errors.push({ method: 'dropdowns', error: error.message });
          log('⚠️ Method 3 failed:', error.message);
        }

        // Método 4: FIGURE ZIP Integration (NUEVO)
        try {
          const fromFIGURE = await this.detectFromFIGURE();
          documents.push(...fromFIGURE);
          log(`✅ Method 4: Found ${fromFIGURE.length} documents from FIGURE`);
        } catch (error) {
          errors.push({ method: 'figure', error: error.message });
          log('⚠️ Method 4 failed:', error.message);
        }

        // Validar y limpiar documentos
        const validDocs = this.validateDocuments(documents);
        const uniqueDocs = this.removeDuplicates(validDocs);

        log(`✅ LendingPad detection complete: ${uniqueDocs.length} valid documents`);
        log(`   - Total detected: ${documents.length}`);
        log(`   - Valid: ${validDocs.length}`);
        log(`   - Unique: ${uniqueDocs.length}`);
        log(`   - Errors: ${errors.length}`);

        return {
          success: uniqueDocs.length > 0,
          documents: uniqueDocs,
          source: 'lendingpad',
          timestamp: Date.now(),
          stats: {
            total: documents.length,
            valid: validDocs.length,
            unique: uniqueDocs.length,
            errors: errors.length,
            methods: {
              buttons: documents.filter(d => d.source === 'buttons').length,
              angular: documents.filter(d => d.source === 'angular').length,
              dropdowns: documents.filter(d => d.source === 'dropdowns').length,
              figure: documents.filter(d => d.source === 'figure').length
            }
          },
          errors: errors.length > 0 ? errors : undefined
        };

      } catch (error) {
        log('❌ LendingPad detection failed catastrophically:', error);
        return {
          success: false,
          documents: [],
          error: error.message,
          errors: errors
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WAIT FOR PAGE READY
    // ─────────────────────────────────────────────────────────────────────────

    static async waitForPageReady() {
      // Wait for Angular to be ready
      if (typeof angular !== 'undefined') {
        await sleep(CONFIG.TIMEOUTS.angularWait);
      }
      
      // Wait for document panel to exist
      let attempts = 0;
      while (attempts < 10) {
        const panel = document.querySelector(CONFIG.SELECTORS.documentPanel) ||
                      document.querySelector(CONFIG.SELECTORS.documentPanelAlt);
        if (panel) {
          log('✅ Document panel found');
          return;
        }
        await sleep(300);
        attempts++;
      }
      
      log('⚠️ Document panel not found, continuing anyway...');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RETRY WRAPPER WITH EXPONENTIAL BACKOFF
    // ─────────────────────────────────────────────────────────────────────────

    static async withRetry(fn, context = 'operation') {
      let lastError;
      
      for (let attempt = 0; attempt < CONFIG.RETRY.maxAttempts; attempt++) {
        try {
          if (attempt > 0) {
            const delay = Math.min(
              CONFIG.RETRY.initialDelay * Math.pow(CONFIG.RETRY.exponentialBase, attempt - 1),
              CONFIG.RETRY.maxDelay
            );
            log(`🔄 Retry attempt ${attempt + 1}/${CONFIG.RETRY.maxAttempts} for ${context} (waiting ${delay}ms)`);
            await sleep(delay);
          }
          
          return await fn();
        } catch (error) {
          lastError = error;
          log(`⚠️ Attempt ${attempt + 1} failed:`, error.message);
        }
      }
      
      throw lastError || new Error(`${context} failed after ${CONFIG.RETRY.maxAttempts} attempts`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Método 1: Detectar desde botones de descarga (MEJORADO)
    // ─────────────────────────────────────────────────────────────────────────

    static async detectFromDownloadButtons() {
      const documents = [];
      
      // Try primary selectors first
      let buttons = document.querySelectorAll(CONFIG.SELECTORS.downloadButtons);
      
      // Fallback to alternative selectors
      if (buttons.length === 0) {
        buttons = document.querySelectorAll(CONFIG.SELECTORS.downloadButtonsAlt);
      }

      log(`🔍 Found ${buttons.length} download buttons`);

      for (const button of buttons) {
        try {
          // Buscar el dropdown asociado
          const dropdown = button.closest('.dropdown') || 
                          button.closest('.btn-group') ||
                          button.closest(CONFIG.SELECTORS.dropdownsAlt);
          
          if (!dropdown) {
            log('⚠️ No dropdown found for button');
            continue;
          }

          // Buscar el menú del dropdown
          const menu = dropdown.querySelector(CONFIG.SELECTORS.dropdownMenus) ||
                      dropdown.querySelector(CONFIG.SELECTORS.dropdownMenusAlt);
          
          if (!menu) {
            // Single file button (no dropdown)
            const docName = this.getDocumentName(button);
            documents.push({
              type: 'lendingpad-document',
              name: docName,
              files: [{
                name: docName,
                element: button,
                type: 'pdf',
                downloadMethod: 'click'
              }],
              element: button,
              hasMultipleFiles: false,
              format: 'pdf',
              source: 'buttons',
              confidence: 0.9
            });
            continue;
          }

          // Extraer archivos del dropdown
          const files = this.extractFilesFromDropdown(menu);
          
          if (files.length > 0) {
            const docName = this.getDocumentName(button);
            documents.push({
              type: 'lendingpad-document',
              name: docName,
              files: files,
              element: button,
              dropdown: dropdown,
              menu: menu,
              hasMultipleFiles: files.length > 1,
              format: files[0].type,
              source: 'buttons',
              confidence: 0.95
            });
          }

        } catch (error) {
          log('⚠️ Error processing button:', error);
        }
      }

      return documents;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Método 2: Detectar desde Angular scope (MEJORADO)
    // ─────────────────────────────────────────────────────────────────────────

    static async detectFromAngularScope() {
      const documents = [];

      try {
        // Verificar si Angular está disponible
        if (typeof angular === 'undefined') {
          log('ℹ️ Angular not available');
          return documents;
        }

        // Buscar elemento con ng-controller (primary + fallback)
        const controller = document.querySelector(CONFIG.SELECTORS.angularController) ||
                          document.querySelector(CONFIG.SELECTORS.angularControllerAlt);
        
        if (!controller) {
          log('ℹ️ Angular controller not found');
          return documents;
        }

        // Intentar acceder al scope de Angular
        const element = angular.element(controller);
        if (!element || !element.scope) {
          log('ℹ️ Angular element or scope not available');
          return documents;
        }

        const scope = element.scope();
        if (!scope) {
          log('ℹ️ Could not access Angular scope');
          return documents;
        }

        // Try different possible data structures
        const loanDocs = scope.loan?.documents?.loanDocuments || 
                        scope.documents?.loanDocuments ||
                        scope.loanDocuments ||
                        scope.documents ||
                        [];
        
        if (!Array.isArray(loanDocs)) {
          log('ℹ️ No document array found in Angular scope');
          return documents;
        }

        log(`📊 Found ${loanDocs.length} documents in Angular scope`);

        for (const doc of loanDocs) {
          try {
            // Validate document structure
            if (!doc) continue;

            const files = this.extractFilesFromAngularDoc(doc);
            
            if (files.length > 0) {
              documents.push({
                type: 'lendingpad-document',
                name: doc.name || doc.documentName || doc.title || 'Untitled Document',
                url: doc.url || doc.documentUrl || this.constructDocumentUrl(doc),
                files: files,
                metadata: {
                  documentId: doc.id || doc.documentId,
                  category: doc.category || doc.type,
                  status: doc.status,
                  uploadedDate: doc.uploadedDate || doc.createdDate,
                  fromAngularScope: true
                },
                format: files[0].type,
                hasMultipleFiles: files.length > 1,
                source: 'angular',
                confidence: 1.0 // Highest confidence
              });
            }
          } catch (error) {
            log('⚠️ Error processing Angular document:', error);
          }
        }

      } catch (error) {
        log('⚠️ Angular scope extraction failed:', error.message);
      }

      return documents;
    }

    // Helper: Extract files from Angular document object
    static extractFilesFromAngularDoc(doc) {
      const files = [];

      // Try different file structures
      const fileArray = doc.files?.files || 
                       doc.files || 
                       doc.attachments ||
                       (doc.file ? [doc.file] : []);

      if (!Array.isArray(fileArray)) {
        return files;
      }

      for (const file of fileArray) {
        if (!file) continue;

        const fileName = file.name || file.fileName || file.title || 'Untitled';
        const fileType = file.type || 
                        file.fileType || 
                        this.detectFileType(fileName);

        files.push({
          name: fileName,
          url: file.url || file.downloadUrl || file.fileUrl,
          size: file.size || file.fileSize,
          type: fileType,
          id: file.id || file.fileId,
          uploadedDate: file.uploadedDate || file.createdDate,
          downloadMethod: file.url ? 'url' : 'api'
        });
      }

      return files;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Método 3: Detectar desde dropdowns expandidos (MEJORADO)
    // ─────────────────────────────────────────────────────────────────────────

    static async detectFromDropdowns() {
      const documents = [];
      
      // Try primary selectors
      let dropdowns = document.querySelectorAll(CONFIG.SELECTORS.dropdowns);
      
      // Fallback to alternatives
      if (dropdowns.length === 0) {
        dropdowns = document.querySelectorAll(CONFIG.SELECTORS.dropdownsAlt);
      }

      log(`🔍 Found ${dropdowns.length} dropdowns`);

      for (const dropdown of dropdowns) {
        try {
          // Expandir dropdown temporalmente si está cerrado
          const wasOpen = dropdown.classList.contains('open') || 
                         dropdown.classList.contains('show');
          
          if (!wasOpen) {
            dropdown.classList.add('open', 'show');
            await sleep(CONFIG.TIMEOUTS.dropdownExpand);
          }

          // Buscar menú
          const menu = dropdown.querySelector(CONFIG.SELECTORS.dropdownMenus) ||
                      dropdown.querySelector(CONFIG.SELECTORS.dropdownMenusAlt);
          
          if (menu) {
            const files = this.extractFilesFromDropdown(menu);
            
            if (files.length > 0) {
              const button = dropdown.querySelector('button');
              const docName = this.getDocumentName(button || dropdown);
              
              documents.push({
                type: 'lendingpad-document',
                name: docName,
                files: files,
                element: dropdown,
                hasMultipleFiles: files.length > 1,
                format: files[0].type,
                source: 'dropdowns',
                confidence: 0.85
              });
            }
          }

          // Cerrar dropdown si estaba cerrado
          if (!wasOpen) {
            dropdown.classList.remove('open', 'show');
          }

        } catch (error) {
          log('⚠️ Error processing dropdown:', error);
        }
      }

      return documents;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Método 4: Detectar desde FIGURE ZIP (NUEVO - Integración con Algorithm)
    // ─────────────────────────────────────────────────────────────────────────

    static async detectFromFIGURE() {
      const documents = [];

      try {
        // Check if FIGURE Algorithm is available
        if (!window.LendingPadAlgorithm) {
          log('ℹ️ FIGURE Algorithm not available');
          return documents;
        }

        // Check for FIGURE document list in the page
        const figureDocList = document.querySelector(CONFIG.SELECTORS.figureDocList);
        if (!figureDocList) {
          log('ℹ️ No FIGURE documents found in page');
          return documents;
        }

        // Look for uploaded ZIP or documents from FIGURE
        const figureItems = figureDocList.querySelectorAll('.document-item, .file-item, li');
        
        log(`📦 Found ${figureItems.length} FIGURE document items`);

        for (const item of figureItems) {
          try {
            const fileName = item.textContent.trim();
            const downloadLink = item.querySelector('a[href], button[data-url]');
            
            if (!fileName || !downloadLink) continue;

            // Categorize FIGURE documents based on algorithm requirements
            const category = this.categorizeFIGUREDocument(fileName);
            
            if (category) {
              documents.push({
                type: 'lendingpad-document',
                name: fileName,
                files: [{
                  name: fileName,
                  url: downloadLink.href || downloadLink.dataset.url,
                  type: this.detectFileType(fileName),
                  element: downloadLink,
                  downloadMethod: downloadLink.href ? 'url' : 'click'
                }],
                element: item,
                hasMultipleFiles: false,
                format: this.detectFileType(fileName),
                source: 'figure',
                figureCategory: category,
                confidence: 0.98
              });
            }
          } catch (error) {
            log('⚠️ Error processing FIGURE item:', error);
          }
        }

      } catch (error) {
        log('⚠️ FIGURE detection failed:', error.message);
      }

      return documents;
    }

    // Helper: Categorize FIGURE documents based on algorithm requirements
    static categorizeFIGUREDocument(fileName) {
      const nameLower = fileName.toLowerCase();
      
      const categories = {
        'Avm_Appraisal': /avm|appraisal|residential_evaluation|broker_price/i,
        'Signed-Application_Summary_Disclosure': /signed.*application|summary.*disclosure/i,
        'Signed-Heloc_Agreement': /heloc.*agreement|esigned.*heloc/i,
        'Right_To_Cancel': /right.*cancel|rescission/i
      };

      for (const [category, pattern] of Object.entries(categories)) {
        if (pattern.test(nameLower)) {
          return category;
        }
      }

      return null; // Not a required FIGURE document
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILIDADES MEJORADAS
    // ─────────────────────────────────────────────────────────────────────────

    static extractFilesFromDropdown(menu) {
      const files = [];
      
      // Try primary selector
      let items = menu.querySelectorAll('li');
      
      // Fallback to alternatives
      if (items.length === 0) {
        items = menu.querySelectorAll(CONFIG.SELECTORS.documentItemsAlt);
      }

      for (const item of items) {
        try {
          // Primary file link selector
          const link = item.querySelector(CONFIG.SELECTORS.fileLinks) ||
                      item.querySelector(CONFIG.SELECTORS.fileLinksAlt) ||
                      item.querySelector('a');
          
          if (!link) continue;

          const fileName = (link.textContent || link.title || link.getAttribute('data-name') || '').trim();
          if (!fileName) continue;

          const ngClick = link.getAttribute('ng-click') || 
                         link.getAttribute('onclick') || 
                         '';
          
          // Extract file ID from ng-click or onclick
          const fileId = this.extractFileIdFromNgClick(ngClick);

          // Extract URL if available
          const url = link.href || 
                     link.getAttribute('data-url') ||
                     link.getAttribute('data-download-url');

          files.push({
            name: fileName,
            element: link,
            fileId: fileId,
            url: url,
            type: this.detectFileType(fileName),
            size: this.extractFileSizeFromElement(item),
            downloadMethod: url ? 'url' : (fileId ? 'api' : 'click')
          });
        } catch (error) {
          log('⚠️ Error extracting file from dropdown item:', error);
        }
      }

      return files;
    }

    static extractFileIdFromNgClick(ngClick) {
      if (!ngClick) return null;
      
      // Try multiple patterns
      const patterns = [
        /downloadFile\(.*?['"]*(\d+)['"]*.*?\)/,  // downloadFile(123)
        /download\(.*?['"]*(\d+)['"]*.*?\)/,      // download(123)
        /file[Ii]d[:\s]*['"]*(\d+)['"]/,          // fileId: 123
        /id[:\s]*['"]*(\d+)['"]/                  // id: 123
      ];

      for (const pattern of patterns) {
        const match = ngClick.match(pattern);
        if (match) return match[1];
      }

      return null;
    }

    static extractFileSizeFromElement(element) {
      // Look for file size in element or siblings
      const sizeElement = element.querySelector('.file-size, .size, [data-size]');
      if (!sizeElement) return null;

      const sizeText = sizeElement.textContent || sizeElement.getAttribute('data-size');
      if (!sizeText) return null;

      // Parse size (e.g., "1.5 MB", "250 KB")
      const match = sizeText.match(/([\d.]+)\s*(KB|MB|GB)/i);
      if (!match) return null;

      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();

      const multipliers = { KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
      return Math.round(value * (multipliers[unit] || 1));
    }

    static getDocumentName(element) {
      if (!element) return 'LendingPad Document';

      // Try multiple strategies to find document name
      const strategies = [
        // 1. Look for specific name elements
        () => {
          const nameEl = element.querySelector(CONFIG.SELECTORS.documentName);
          return nameEl?.textContent.trim();
        },
        
        // 2. Look for type elements
        () => {
          const typeEl = element.querySelector(CONFIG.SELECTORS.documentType);
          return typeEl?.textContent.trim();
        },
        
        // 3. Look in parent hierarchy
        () => {
          let current = element;
          for (let i = 0; i < 5; i++) {
            current = current.parentElement;
            if (!current) break;

            const nameEl = current.querySelector(CONFIG.SELECTORS.documentName);
            if (nameEl) {
              const name = nameEl.textContent.trim();
              if (name && name.length > 0 && name.length < 100) {
                return name;
              }
            }
          }
          return null;
        },
        
        // 4. Look for title attribute
        () => element.title || element.getAttribute('aria-label'),
        
        // 5. Look for data attributes
        () => element.getAttribute('data-document-name') || 
              element.getAttribute('data-name') ||
              element.getAttribute('data-title'),
        
        // 6. Extract from button text
        () => {
          const text = element.textContent.trim();
          // Remove "Download" and other button text
          return text.replace(/download/gi, '').trim();
        }
      ];

      // Try each strategy
      for (const strategy of strategies) {
        try {
          const name = strategy();
          if (name && name.length > 0 && name.length < 100 && !/download|button/i.test(name)) {
            return name;
          }
        } catch (error) {
          // Continue to next strategy
        }
      }

      return 'LendingPad Document';
    }

    static detectFileType(fileName) {
      if (!fileName) return 'pdf'; // Default a PDF
      
      const ext = fileName.split('.').pop().toLowerCase();
      const typeMap = {
        // Documents
        'pdf': 'pdf',
        'docx': 'docx',
        'doc': 'doc',
        'xlsx': 'xlsx',
        'xls': 'xls',
        'csv': 'csv',
        'txt': 'txt',
        
        // Images
        'png': 'image',
        'jpg': 'image',
        'jpeg': 'image',
        'gif': 'image',
        'bmp': 'image',
        'svg': 'image',
        'webp': 'image',
        
        // Archives
        'zip': 'archive',
        'rar': 'archive',
        'tar': 'archive',
        'gz': 'archive',
        '7z': 'archive',
        
        // Other
        'xml': 'xml',
        'json': 'json',
        'html': 'html'
      };

      return typeMap[ext] || 'pdf';
    }

    static constructDocumentUrl(doc) {
      // Construct URL del documento si no está disponible
      if (!doc) return null;

      if (doc.id) {
        const baseUrl = window.location.origin;
        const paths = [
          `/documents/${doc.id}`,
          `/api/documents/${doc.id}/download`,
          `/loan/documents/${doc.id}`,
          `/files/${doc.id}`
        ];

        // Try to determine the correct path based on page structure
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/api/')) {
          return `${baseUrl}/api/documents/${doc.id}/download`;
        } else if (currentPath.includes('/loan/')) {
          return `${baseUrl}/loan/documents/${doc.id}`;
        } else {
          return `${baseUrl}/documents/${doc.id}`;
        }
      }
      
      return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDACIÓN Y LIMPIEZA
    // ─────────────────────────────────────────────────────────────────────────

    static validateDocuments(documents) {
      const valid = [];

      for (const doc of documents) {
        try {
          // Validar estructura básica
          if (!doc || typeof doc !== 'object') {
            log('⚠️ Invalid document: not an object');
            continue;
          }

          // Validar nombre
          if (!doc.name || typeof doc.name !== 'string' || doc.name.trim().length === 0) {
            log('⚠️ Invalid document: no name');
            continue;
          }

          // Validar archivos
          if (!doc.files || !Array.isArray(doc.files) || doc.files.length === 0) {
            log('⚠️ Invalid document: no files');
            continue;
          }

          // Validar cada archivo
          const validFiles = [];
          for (const file of doc.files) {
            if (this.validateFile(file)) {
              validFiles.push(file);
            }
          }

          if (validFiles.length === 0) {
            log('⚠️ Invalid document: no valid files');
            continue;
          }

          // Update document with valid files only
          doc.files = validFiles;
          doc.hasMultipleFiles = validFiles.length > 1;
          doc.validated = true;
          
          valid.push(doc);
        } catch (error) {
          log('⚠️ Error validating document:', error);
        }
      }

      return valid;
    }

    static validateFile(file) {
      if (!file || typeof file !== 'object') return false;
      
      // Must have at least a name
      if (!file.name || typeof file.name !== 'string') return false;
      
      // Must have at least one download method
      if (!file.url && !file.element && !file.fileId) {
        log('⚠️ Invalid file: no download method');
        return false;
      }

      return true;
    }

    static removeDuplicates(documents) {
      const seen = new Map();
      const unique = [];

      for (const doc of documents) {
        // Create composite key from multiple properties
        const fileNames = doc.files.map(f => f.name).sort().join('|');
        const key = `${doc.name}::${fileNames}::${doc.files.length}`;
        
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(doc);
        } else {
          // If duplicate, keep the one with higher confidence
          const existing = seen.get(key);
          if (doc.confidence > (existing.confidence || 0)) {
            // Replace with higher confidence version
            const index = unique.indexOf(existing);
            if (index !== -1) {
              unique[index] = doc;
              seen.set(key, doc);
            }
          }
        }
      }

      return unique;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOWNLOAD HANDLER - ENTERPRISE GRADE
  // ═══════════════════════════════════════════════════════════════════════════

  class LendingPadDownloader {
    
    static async downloadFile(file, options = {}) {
      log('💾 Downloading LendingPad file:', file.name);

      const defaultOptions = {
        retry: true,
        maxRetries: CONFIG.RETRY.maxAttempts,
        validateDownload: true,
        timeout: 30000 // 30 seconds
      };

      const opts = { ...defaultOptions, ...options };

      try {
        let result;

        // Priority order: URL -> Element click -> FileId API
        if (file.url) {
          result = await this.downloadWithRetry(
            () => this.downloadFromUrl(file.url, file.name, opts),
            opts.retry ? opts.maxRetries : 1,
            'URL download'
          );
        }
        else if (file.element) {
          result = await this.downloadWithRetry(
            () => this.downloadViaClick(file.element, file.name, opts),
            opts.retry ? opts.maxRetries : 1,
            'Click download'
          );
        }
        else if (file.fileId) {
          result = await this.downloadWithRetry(
            () => this.downloadFromFileId(file.fileId, file.name, opts),
            opts.retry ? opts.maxRetries : 1,
            'API download'
          );
        }
        else {
          throw new Error('No download method available');
        }

        // Validate if requested
        if (opts.validateDownload && result.success) {
          const isValid = await this.validateDownload(result);
          if (!isValid) {
            log('⚠️ Downloaded file validation failed');
            result.warning = 'File validation failed';
          }
        }

        return result;

      } catch (error) {
        log('❌ Download failed after all retries:', error);
        return {
          success: false,
          error: error.message,
          fileName: file.name
        };
      }
    }

    static async downloadWithRetry(fn, maxRetries, context) {
      let lastError;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            const delay = Math.min(
              CONFIG.RETRY.initialDelay * Math.pow(CONFIG.RETRY.exponentialBase, attempt - 1),
              CONFIG.RETRY.maxDelay
            );
            log(`🔄 Retry ${context} attempt ${attempt + 1}/${maxRetries} (waiting ${delay}ms)`);
            await sleep(delay);
          }
          
          return await fn();
        } catch (error) {
          lastError = error;
          log(`⚠️ ${context} attempt ${attempt + 1} failed:`, error.message);
        }
      }
      
      throw lastError || new Error(`${context} failed after ${maxRetries} attempts`);
    }

    static async downloadFromUrl(url, fileName, opts) {
      log('📥 Downloading from URL:', url);

      try {
        // Create timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

        const response = await fetch(url, {
          credentials: 'include', // Include cookies for auth
          headers: {
            'Accept': '*/*',
            'X-Requested-With': 'XMLHttpRequest'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Received HTML instead of file (possible login page)');
        }

        const blob = await response.blob();
        
        // Validate blob size
        if (blob.size === 0) {
          throw new Error('Downloaded file is empty');
        }

        // Get actual filename from headers if available
        const disposition = response.headers.get('content-disposition');
        let actualFileName = fileName;
        
        if (disposition) {
          const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (matches && matches[1]) {
            actualFileName = matches[1].replace(/['"]/g, '');
          }
        }

        // Trigger download
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = actualFileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
        }, 100);

        return {
          success: true,
          fileName: actualFileName,
          size: blob.size,
          method: 'url',
          contentType: contentType
        };

      } catch (error) {
        log('❌ Download from URL failed:', error);
        throw error;
      }
    }

    static async downloadViaClick(element, fileName, opts) {
      log('👆 Triggering click on element');

      try {
        if (!element || !element.click) {
          throw new Error('Invalid element for click');
        }

        // Check if element is visible and enabled
        if (element.disabled || element.style.display === 'none') {
          throw new Error('Element is disabled or hidden');
        }

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(100);

        // Trigger multiple event types for compatibility
        element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        element.click();

        // Wait for download to initiate
        await sleep(CONFIG.TIMEOUTS.downloadClick);

        return {
          success: true,
          fileName: fileName,
          method: 'click',
          note: 'Download triggered via click - actual success depends on browser'
        };

      } catch (error) {
        log('❌ Click download failed:', error);
        throw error;
      }
    }

    static async downloadFromFileId(fileId, fileName, opts) {
      log('🆔 Downloading via File ID:', fileId);

      try {
        // Try multiple API endpoint patterns
        const baseUrl = window.location.origin;
        const endpoints = [
          `${baseUrl}/api/files/${fileId}/download`,
          `${baseUrl}/api/documents/${fileId}/download`,
          `${baseUrl}/documents/${fileId}/download`,
          `${baseUrl}/files/${fileId}`,
          `${baseUrl}/api/loan/documents/${fileId}/download`
        ];

        let lastError;

        for (const endpoint of endpoints) {
          try {
            log(`  Trying endpoint: ${endpoint}`);
            return await this.downloadFromUrl(endpoint, fileName, opts);
          } catch (error) {
            lastError = error;
            log(`  ❌ Endpoint failed: ${error.message}`);
          }
        }

        throw lastError || new Error('All API endpoints failed');

      } catch (error) {
        log('❌ API download failed:', error);
        throw error;
      }
    }

    static async validateDownload(result) {
      // Basic validation of download result
      if (!result || !result.success) return false;

      // Check if we have size info
      if (result.size !== undefined) {
        // Files smaller than 100 bytes are suspicious
        if (result.size < 100) {
          log('⚠️ Downloaded file suspiciously small:', result.size, 'bytes');
          return false;
        }
      }

      // Check content type (avoid HTML error pages)
      if (result.contentType) {
        if (result.contentType.includes('text/html')) {
          log('⚠️ Downloaded file appears to be HTML');
          return false;
        }
      }

      return true;
    }

    // Batch download multiple files
    static async downloadMultipleFiles(files, options = {}) {
      log(`📦 Starting batch download of ${files.length} files`);

      const results = [];
      const opts = {
        concurrent: options.concurrent || 3, // Download 3 at a time
        delay: options.delay || 500, // 500ms delay between downloads
        ...options
      };

      // Download in batches
      for (let i = 0; i < files.length; i += opts.concurrent) {
        const batch = files.slice(i, i + opts.concurrent);
        
        log(`  Downloading batch ${Math.floor(i / opts.concurrent) + 1}/${Math.ceil(files.length / opts.concurrent)}`);

        const batchPromises = batch.map(file => 
          this.downloadFile(file, options).catch(error => ({
            success: false,
            error: error.message,
            fileName: file.name
          }))
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Delay before next batch
        if (i + opts.concurrent < files.length) {
          await sleep(opts.delay);
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      log(`✅ Batch download complete: ${successful} successful, ${failed} failed`);

      return {
        success: failed === 0,
        total: files.length,
        successful,
        failed,
        results
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log('[LendingPad]', ...args);
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL API - ENTERPRISE GRADE
  // ═══════════════════════════════════════════════════════════════════════════

  window.LendingPadDetector = {
    // Core methods
    detectDocuments: () => LendingPadDetector.detectDocuments(),
    downloadFile: (file, options) => LendingPadDownloader.downloadFile(file, options),
    downloadMultiple: (files, options) => LendingPadDownloader.downloadMultipleFiles(files, options),
    
    // Individual detection methods (for advanced use)
    detectFromButtons: () => LendingPadDetector.detectFromDownloadButtons(),
    detectFromAngular: () => LendingPadDetector.detectFromAngularScope(),
    detectFromDropdowns: () => LendingPadDetector.detectFromDropdowns(),
    detectFromFIGURE: () => LendingPadDetector.detectFromFIGURE(),
    
    // Utility methods
    validateDocuments: (docs) => LendingPadDetector.validateDocuments(docs),
    removeDuplicates: (docs) => LendingPadDetector.removeDuplicates(docs),
    
    // Configuration
    config: CONFIG,
    version: CONFIG.VERSION,
    
    // Status check
    isReady: () => {
      return {
        pageReady: document.readyState === 'complete',
        angularAvailable: typeof angular !== 'undefined',
        figureAlgorithmAvailable: typeof window.LendingPadAlgorithm !== 'undefined',
        documentPanelExists: !!(
          document.querySelector(CONFIG.SELECTORS.documentPanel) ||
          document.querySelector(CONFIG.SELECTORS.documentPanelAlt)
        )
      };
    },
    
    // Debug helper
    debug: {
      enableLogs: () => { CONFIG.DEBUG = true; },
      disableLogs: () => { CONFIG.DEBUG = false; },
      getSelectors: () => CONFIG.SELECTORS,
      testSelectors: () => {
        const results = {};
        for (const [key, selector] of Object.entries(CONFIG.SELECTORS)) {
          const elements = document.querySelectorAll(selector);
          results[key] = {
            selector,
            count: elements.length,
            found: elements.length > 0
          };
        }
        return results;
      }
    }
  };

  log('═'.repeat(80));
  log(`✅ LENDINGPAD DETECTOR v${CONFIG.VERSION} LOADED - ENTERPRISE GRADE`);
  log('═'.repeat(80));
  log('Features:');
  log('  - 4 detection methods (buttons, Angular, dropdowns, FIGURE)');
  log('  - Automatic retry with exponential backoff');
  log('  - Robust validation and error recovery');
  log('  - Batch download support');
  log('  - FIGURE Algorithm integration');
  log('═'.repeat(80));

})(window);
