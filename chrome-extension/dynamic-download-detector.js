// ═══════════════════════════════════════════════════════════════════════════════
// 🔗 DYNAMIC DOWNLOAD LINK DETECTOR v1.0 - Invisible Background Processing
// ═══════════════════════════════════════════════════════════════════════════════
//
// FEATURES:
// - Detects links that generate files on click (dynamic downloads)
// - Silently downloads files in background
// - Extracts data from downloaded files
// - Automatically cleans up temporary files
// - User never sees the download process
// - Supports PDF, Excel, CSV, Word, Images
// - Handles blob URLs, data URLs, and server-generated files
// - Intercepts XHR/Fetch responses with file content
//
// USE CASES:
// - "Generate PDF" buttons
// - "Export to Excel" links
// - "Download Report" buttons that create files dynamically
// - API endpoints that return file streams
// - Blob-based file generation
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const CONFIG = {
    // Detection
    SCAN_INTERVAL: 2000,
    MAX_DOWNLOAD_SIZE: 50 * 1024 * 1024, // 50MB max
    DOWNLOAD_TIMEOUT: 30000, // 30 seconds
    
    // Link patterns to detect
    DOWNLOAD_PATTERNS: [
      /download/i,
      /export/i,
      /generate/i,
      /get.*pdf/i,
      /get.*excel/i,
      /get.*report/i,
      /crear.*pdf/i,
      /descargar/i,
      /exportar/i,
      /generar/i
    ],
    
    // File extensions to intercept
    FILE_EXTENSIONS: [
      'pdf', 'xls', 'xlsx', 'csv', 'doc', 'docx',
      'png', 'jpg', 'jpeg', 'gif', 'tiff', 'bmp'
    ],
    
    // MIME types to intercept
    FILE_MIME_TYPES: [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/gif'
    ],
    
    // Cleanup
    AUTO_CLEANUP: true,
    CLEANUP_DELAY: 5000, // 5 seconds after processing
    
    DEBUG: false
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DOWNLOAD LINK DETECTOR
  // ═══════════════════════════════════════════════════════════════════════════

  class DynamicDownloadDetector {
    constructor() {
      this.detectedLinks = new Map();
      this.pendingDownloads = new Map();
      this.processedFiles = new Map();
      this.interceptedBlobs = new Map();
      this.observers = [];
      this.stats = {
        linksDetected: 0,
        filesDownloaded: 0,
        filesProcessed: 0,
        dataExtracted: 0
      };
      
      this.onDataExtracted = null; // Callback for extracted data
      this.initialize();
    }

    async initialize() {
      log('🔗 Dynamic Download Detector initializing...');
      
      // Setup interceptors
      this.setupBlobInterceptor();
      this.setupFetchInterceptor();
      this.setupXHRInterceptor();
      this.setupClickInterceptor();
      
      // Initial scan
      this.scanForDownloadLinks();
      
      // Setup mutation observer for dynamic content
      this.setupMutationObserver();
      
      log('✅ Dynamic Download Detector ready');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LINK DETECTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Scan page for potential download links
     */
    scanForDownloadLinks() {
      log('🔍 Scanning for download links...');
      
      const links = [];
      
      // Scan <a> tags
      const anchors = document.querySelectorAll('a[href], a[data-href], a[ng-click], a[onclick]');
      anchors.forEach(anchor => {
        if (this.isDownloadLink(anchor)) {
          links.push({
            element: anchor,
            type: 'anchor',
            text: anchor.textContent.trim(),
            href: anchor.href || anchor.getAttribute('data-href'),
            attributes: this.getRelevantAttributes(anchor)
          });
        }
      });
      
      // Scan buttons
      const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');
      buttons.forEach(button => {
        if (this.isDownloadButton(button)) {
          links.push({
            element: button,
            type: 'button',
            text: button.textContent?.trim() || button.value,
            attributes: this.getRelevantAttributes(button)
          });
        }
      });
      
      // Scan elements with download-related classes/ids
      const downloadElements = document.querySelectorAll('[class*="download"], [class*="export"], [id*="download"], [id*="export"]');
      downloadElements.forEach(el => {
        if (!links.some(l => l.element === el) && this.isClickable(el)) {
          links.push({
            element: el,
            type: 'element',
            text: el.textContent?.trim().substring(0, 100),
            attributes: this.getRelevantAttributes(el)
          });
        }
      });
      
      // Store detected links
      links.forEach(link => {
        const id = this.generateLinkId(link);
        if (!this.detectedLinks.has(id)) {
          this.detectedLinks.set(id, link);
          this.stats.linksDetected++;
          log(`  ✓ Detected: "${link.text?.substring(0, 50)}..." (${link.type})`);
        }
      });
      
      log(`📊 Total download links detected: ${this.detectedLinks.size}`);
      return Array.from(this.detectedLinks.values());
    }

    /**
     * Check if element is a download link
     */
    isDownloadLink(element) {
      const href = element.href || element.getAttribute('data-href') || '';
      const text = element.textContent?.toLowerCase() || '';
      const download = element.hasAttribute('download');
      const onclick = element.getAttribute('onclick') || '';
      const ngClick = element.getAttribute('ng-click') || '';
      
      // Has download attribute
      if (download) return true;
      
      // Href points to file
      if (this.hasFileExtension(href)) return true;
      
      // Text matches download patterns
      if (CONFIG.DOWNLOAD_PATTERNS.some(p => p.test(text))) return true;
      
      // onclick/ng-click contains download logic
      if (/download|export|generate|blob|file/i.test(onclick + ngClick)) return true;
      
      return false;
    }

    /**
     * Check if element is a download button
     */
    isDownloadButton(element) {
      const text = element.textContent?.toLowerCase() || element.value?.toLowerCase() || '';
      const onclick = element.getAttribute('onclick') || '';
      const ngClick = element.getAttribute('ng-click') || '';
      const className = element.className?.toLowerCase() || '';
      const id = element.id?.toLowerCase() || '';
      
      // Text matches download patterns
      if (CONFIG.DOWNLOAD_PATTERNS.some(p => p.test(text))) return true;
      
      // Class/ID contains download keywords
      if (/download|export|generate/i.test(className + id)) return true;
      
      // onclick/ng-click contains download logic
      if (/download|export|generate|blob|file|pdf|excel/i.test(onclick + ngClick)) return true;
      
      return false;
    }

    /**
     * Check if element is clickable
     */
    isClickable(element) {
      const style = window.getComputedStyle(element);
      return (
        style.cursor === 'pointer' ||
        element.onclick ||
        element.getAttribute('onclick') ||
        element.getAttribute('ng-click') ||
        element.getAttribute('data-action') ||
        element.tagName === 'BUTTON' ||
        element.tagName === 'A'
      );
    }

    /**
     * Check if URL has file extension
     */
    hasFileExtension(url) {
      if (!url) return false;
      const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
      return CONFIG.FILE_EXTENSIONS.includes(ext);
    }

    /**
     * Get relevant attributes from element
     */
    getRelevantAttributes(element) {
      const attrs = {};
      const relevant = ['href', 'data-href', 'data-url', 'data-file', 'onclick', 'ng-click', 'download', 'target'];
      relevant.forEach(attr => {
        const val = element.getAttribute(attr);
        if (val) attrs[attr] = val;
      });
      return attrs;
    }

    /**
     * Generate unique ID for link
     */
    generateLinkId(link) {
      const text = link.text?.substring(0, 50) || '';
      const href = link.attributes?.href || '';
      return btoa(encodeURIComponent(text + href)).substring(0, 32);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INTERCEPTORS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Intercept Blob URL creation
     */
    setupBlobInterceptor() {
      const originalCreateObjectURL = URL.createObjectURL;
      const isFileBlob = this.isFileBlob.bind(this);
      const interceptedBlobs = this.interceptedBlobs;
      const processInterceptedBlob = this.processInterceptedBlob.bind(this);
      
      URL.createObjectURL = function(blob) {
        const url = originalCreateObjectURL.call(URL, blob);
        
        // Check if it's a file blob
        if (blob instanceof Blob && isFileBlob(blob)) {
          log(`🎯 Intercepted Blob: ${blob.type}, ${formatBytes(blob.size)}`);
          
          interceptedBlobs.set(url, {
            blob: blob,
            type: blob.type,
            size: blob.size,
            timestamp: Date.now()
          });
          
          // Process in background
          processInterceptedBlob(url, blob);
        }
        
        return url;
      };
      
      // Also intercept revokeObjectURL for cleanup tracking
      const originalRevokeObjectURL = URL.revokeObjectURL;
      URL.revokeObjectURL = function(url) {
        interceptedBlobs.delete(url);
        return originalRevokeObjectURL.call(URL, url);
      };
      
      log('  ✓ Blob interceptor active');
    }

    /**
     * Intercept Fetch API responses
     */
    setupFetchInterceptor() {
      const originalFetch = window.fetch;
      const isFileResponse = this.isFileResponse.bind(this);
      const processFetchResponse = this.processFetchResponse.bind(this);
      
      window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        
        // Clone response to read it without consuming
        const clone = response.clone();
        
        // Check content type
        const contentType = clone.headers.get('content-type') || '';
        const contentDisposition = clone.headers.get('content-disposition') || '';
        
        if (isFileResponse(contentType, contentDisposition)) {
          log(`🎯 Intercepted Fetch response: ${contentType}`);
          
          // Process in background without blocking
          processFetchResponse(clone, args[0]);
        }
        
        return response;
      };
      
      log('  ✓ Fetch interceptor active');
    }

    /**
     * Intercept XHR responses
     */
    setupXHRInterceptor() {
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;
      const isFileResponse = this.isFileResponse.bind(this);
      const processXHRResponse = this.processXHRResponse.bind(this);
      
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._cubeUrl = url;
        this._cubeMethod = method;
        return originalOpen.apply(this, [method, url, ...rest]);
      };
      
      XMLHttpRequest.prototype.send = function(body) {
        // Use arrow function to access outer scope while keeping XHR instance via this
        this.addEventListener('load', () => {
          const contentType = this.getResponseHeader('content-type') || '';
          const contentDisposition = this.getResponseHeader('content-disposition') || '';
          
          if (isFileResponse(contentType, contentDisposition)) {
            log(`🎯 Intercepted XHR response: ${contentType}`);
            processXHRResponse(this);
          }
        });
        
        return originalSend.apply(this, [body]);
      };
      
      log('  ✓ XHR interceptor active');
    }

    /**
     * Intercept clicks on download links
     */
    setupClickInterceptor() {
      const generateLinkId = this.generateLinkId.bind(this);
      const getRelevantAttributes = this.getRelevantAttributes.bind(this);
      const detectedLinks = this.detectedLinks;
      const pendingDownloads = this.pendingDownloads;
      const tryDirectFetch = this.tryDirectFetch.bind(this);
      
      document.addEventListener('click', async (event) => {
        const target = event.target.closest('a, button, [role="button"]');
        if (!target) return;
        
        // Check if this is a detected download link
        const linkId = generateLinkId({
          element: target,
          text: target.textContent?.trim(),
          attributes: getRelevantAttributes(target)
        });
        
        if (detectedLinks.has(linkId)) {
          log(`🖱️ Click detected on download link: "${target.textContent?.substring(0, 30)}..."`);
          
          // Mark as pending
          pendingDownloads.set(linkId, {
            element: target,
            timestamp: Date.now(),
            status: 'waiting'
          });
          
          // Wait for blob/fetch intercept or timeout
          setTimeout(() => {
            const pending = pendingDownloads.get(linkId);
            if (pending && pending.status === 'waiting') {
              log(`⏰ Download link click timed out, trying direct fetch`);
              tryDirectFetch(target);
            }
          }, 3000);
        }
      }, true);
      
      log('  ✓ Click interceptor active');
    }

    /**
     * Setup mutation observer for dynamic content
     */
    setupMutationObserver() {
      const observer = new MutationObserver((mutations) => {
        let shouldScan = false;
        
        for (const mutation of mutations) {
          if (mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'A' || node.tagName === 'BUTTON' ||
                    node.querySelector?.('a, button, [role="button"]')) {
                  shouldScan = true;
                  break;
                }
              }
            }
          }
          if (shouldScan) break;
        }
        
        if (shouldScan) {
          // Debounce scan
          clearTimeout(this._scanTimeout);
          this._scanTimeout = setTimeout(() => this.scanForDownloadLinks(), 500);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      this.observers.push(observer);
      log('  ✓ Mutation observer active');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PROCESSING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Check if blob is a file type we want
     */
    isFileBlob(blob) {
      return CONFIG.FILE_MIME_TYPES.some(type => blob.type.includes(type.split('/')[1]));
    }

    /**
     * Check if response is a file
     */
    isFileResponse(contentType, contentDisposition) {
      // Check MIME type
      if (CONFIG.FILE_MIME_TYPES.some(type => contentType.includes(type))) {
        return true;
      }
      
      // Check content-disposition
      if (/attachment|filename/i.test(contentDisposition)) {
        return true;
      }
      
      return false;
    }

    /**
     * Process intercepted blob
     */
    async processInterceptedBlob(url, blob) {
      try {
        log(`📦 Processing intercepted blob: ${formatBytes(blob.size)}`);
        
        // Convert to array buffer
        const arrayBuffer = await blob.arrayBuffer();
        
        // Detect file type from magic bytes
        const fileType = this.detectFileType(arrayBuffer);
        log(`  File type detected: ${fileType}`);
        
        // Parse the file
        const data = await this.parseFile(arrayBuffer, fileType, blob.type);
        
        if (data && Object.keys(data).length > 0) {
          this.stats.filesProcessed++;
          this.stats.dataExtracted++;
          
          // Store processed data
          this.processedFiles.set(url, {
            type: fileType,
            mimeType: blob.type,
            size: blob.size,
            data: data,
            timestamp: Date.now()
          });
          
          // Trigger callback
          if (this.onDataExtracted) {
            this.onDataExtracted({
              source: 'blob',
              url: url,
              type: fileType,
              data: data
            });
          }
          
          log(`✅ Data extracted from blob: ${Object.keys(data).length} fields`);
          
          // Broadcast to extension
          this.broadcastExtractedData(data, fileType);
        }
        
        // Cleanup after delay
        if (CONFIG.AUTO_CLEANUP) {
          setTimeout(() => {
            this.processedFiles.delete(url);
            log(`🗑️ Cleaned up processed file: ${url.substring(0, 30)}...`);
          }, CONFIG.CLEANUP_DELAY);
        }
        
      } catch (error) {
        console.error('❌ Error processing blob:', error);
      }
    }

    /**
     * Process fetch response
     */
    async processFetchResponse(response, _url) {
      try {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        await this.processInterceptedBlob(blobUrl, blob);
        URL.revokeObjectURL(blobUrl);
        this.stats.filesDownloaded++;
      } catch (error) {
        console.error('❌ Error processing fetch response:', error);
      }
    }

    /**
     * Process XHR response
     */
    async processXHRResponse(xhr) {
      try {
        let blob;
        
        if (xhr.responseType === 'blob') {
          blob = xhr.response;
        } else if (xhr.responseType === 'arraybuffer') {
          const contentType = xhr.getResponseHeader('content-type') || 'application/octet-stream';
          blob = new Blob([xhr.response], { type: contentType });
        } else {
          // Try to create blob from response
          const contentType = xhr.getResponseHeader('content-type') || 'application/octet-stream';
          blob = new Blob([xhr.response], { type: contentType });
        }
        
        if (blob && blob.size > 0) {
          const blobUrl = URL.createObjectURL(blob);
          await this.processInterceptedBlob(blobUrl, blob);
          URL.revokeObjectURL(blobUrl);
          this.stats.filesDownloaded++;
        }
      } catch (error) {
        console.error('❌ Error processing XHR response:', error);
      }
    }

    /**
     * Try direct fetch when click doesn't trigger interceptors
     */
    async tryDirectFetch(element) {
      try {
        const href = element.href || element.getAttribute('data-href') || element.getAttribute('data-url');
        
        if (!href || href.startsWith('javascript:')) {
          log('⚠️ No valid URL for direct fetch');
          return;
        }
        
        log(`📥 Attempting direct fetch: ${href.substring(0, 50)}...`);
        
        const response = await fetch(href, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        
        if (this.isFileResponse(contentType, '')) {
          await this.processFetchResponse(response.clone(), href);
        }
        
      } catch (error) {
        console.error('❌ Direct fetch failed:', error);
      }
    }

    /**
     * Detect file type from magic bytes
     */
    detectFileType(arrayBuffer) {
      const bytes = new Uint8Array(arrayBuffer).slice(0, 8);
      
      // PDF: %PDF-
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        return 'pdf';
      }
      
      // ZIP (XLSX, DOCX): PK
      if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
        // Could be XLSX or DOCX, check further
        return 'xlsx'; // Default to Excel, parser will handle both
      }
      
      // XLS: D0 CF 11 E0
      if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) {
        return 'xls';
      }
      
      // PNG: 89 50 4E 47
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return 'png';
      }
      
      // JPEG: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return 'jpg';
      }
      
      // GIF: GIF8
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        return 'gif';
      }
      
      // CSV/Text: Check if printable ASCII
      let isText = true;
      for (let i = 0; i < Math.min(100, bytes.length); i++) {
        if (bytes[i] > 127 || (bytes[i] < 32 && bytes[i] !== 9 && bytes[i] !== 10 && bytes[i] !== 13)) {
          isText = false;
          break;
        }
      }
      if (isText) return 'csv';
      
      return 'unknown';
    }

    /**
     * Parse file and extract data
     */
    async parseFile(arrayBuffer, fileType, _mimeType) {
      log(`📄 Parsing ${fileType} file...`);
      
      try {
        switch (fileType) {
          case 'pdf':
            return await this.parsePDF(arrayBuffer);
          case 'xlsx':
          case 'xls':
            return await this.parseExcel(arrayBuffer);
          case 'csv':
            return await this.parseCSV(arrayBuffer);
          case 'png':
          case 'jpg':
          case 'gif':
            return await this.parseImage(arrayBuffer, fileType);
          default:
            log(`⚠️ Unknown file type: ${fileType}`);
            return null;
        }
      } catch (error) {
        console.error(`❌ Error parsing ${fileType}:`, error);
        return null;
      }
    }

    /**
     * Parse PDF file
     */
    async parsePDF(arrayBuffer) {
      // Use existing PDF parser if available
      if (window.pdfjsLib) {
        try {
          const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let text = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
          }
          
          // Extract structured data from text
          return this.extractStructuredData(text);
        } catch (error) {
          console.error('PDF parsing error:', error);
          return { rawText: 'PDF parsing failed' };
        }
      }
      
      return { rawText: 'PDF.js not available' };
    }

    /**
     * Parse Excel file
     */
    async parseExcel(arrayBuffer) {
      // Use existing XLSX parser if available
      if (window.XLSX) {
        try {
          const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
          const result = {};
          
          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const data = window.XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // Extract as key-value pairs if 2 columns
            if (data.length > 0 && data[0].length === 2) {
              data.forEach(row => {
                if (row[0] && row[1]) {
                  const key = String(row[0]).toLowerCase().replace(/\s+/g, '_');
                  result[key] = row[1];
                }
              });
            } else {
              result[`sheet_${sheetName}`] = data;
            }
          });
          
          return result;
        } catch (error) {
          console.error('Excel parsing error:', error);
          return { error: 'Excel parsing failed' };
        }
      }
      
      return { error: 'XLSX library not available' };
    }

    /**
     * Parse CSV file
     */
    async parseCSV(arrayBuffer) {
      try {
        const text = new TextDecoder().decode(arrayBuffer);
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length === 0) return {};
        
        // Detect delimiter
        const delimiter = text.includes('\t') ? '\t' : ',';
        
        // Parse header and data
        const header = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
        const result = {};
        
        // If 2 columns, treat as key-value
        if (header.length === 2) {
          lines.slice(1).forEach(line => {
            const [key, value] = line.split(delimiter);
            if (key && value) {
              result[key.trim().toLowerCase().replace(/\s+/g, '_')] = value.trim();
            }
          });
        } else {
          // Multiple columns - return as array
          result.rows = lines.slice(1).map(line => {
            const values = line.split(delimiter);
            const row = {};
            header.forEach((h, i) => {
              row[h] = values[i]?.trim() || '';
            });
            return row;
          });
        }
        
        return result;
      } catch (error) {
        console.error('CSV parsing error:', error);
        return { error: 'CSV parsing failed' };
      }
    }

    /**
     * Parse image file (attempt OCR if available)
     */
    async parseImage(arrayBuffer, fileType) {
      // If OCR engine is available
      if (window.OCREngine) {
        try {
          const blob = new Blob([arrayBuffer], { type: `image/${fileType}` });
          const result = await window.OCREngine.recognize(blob);
          
          if (result.success && result.text) {
            return this.extractStructuredData(result.text);
          }
        } catch (error) {
          console.error('Image OCR error:', error);
        }
      }
      
      return { type: 'image', format: fileType, size: arrayBuffer.byteLength };
    }

    /**
     * Extract structured data from text
     */
    extractStructuredData(text) {
      const data = {};
      
      // Common patterns
      const patterns = {
        email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
        phone: /(\+?[\d\s\-\(\)]{10,})/g,
        date: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
        ssn: /(\d{3}[-\s]?\d{2}[-\s]?\d{4})/g,
        money: /(\$[\d,]+\.?\d*)/g,
        name: /(?:name|nombre)[:\s]*([A-Za-z\s]+)/gi,
        address: /(?:address|direccion|dirección)[:\s]*([^\n]+)/gi
      };
      
      // Extract each pattern
      for (const [key, pattern] of Object.entries(patterns)) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          data[key] = matches.length === 1 ? matches[0] : matches;
        }
      }
      
      // Key-value extraction
      const kvPattern = /([A-Za-z\s]+)[:\s]+([^\n]+)/g;
      let match;
      while ((match = kvPattern.exec(text)) !== null) {
        const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
        const value = match[2].trim();
        if (key.length > 2 && key.length < 50 && value.length > 0 && value.length < 200) {
          if (!data[key]) {
            data[key] = value;
          }
        }
      }
      
      data._rawText = text.substring(0, 5000);
      
      return data;
    }

    /**
     * Broadcast extracted data to extension
     */
    broadcastExtractedData(data, fileType) {
      // Send to background script
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'DYNAMIC_DOWNLOAD_DATA_EXTRACTED',
          payload: {
            data: data,
            fileType: fileType,
            timestamp: Date.now(),
            url: window.location.href
          }
        }).catch(() => {
          // Extension context may not be available
        });
      }
      
      // Dispatch custom event for page scripts
      window.dispatchEvent(new CustomEvent('cubeDataExtracted', {
        detail: { data, fileType }
      }));
      
      log(`📡 Broadcasted extracted data: ${Object.keys(data).length} fields`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get all detected download links
     */
    getDetectedLinks() {
      return Array.from(this.detectedLinks.values());
    }

    /**
     * Get all processed files
     */
    getProcessedFiles() {
      return Array.from(this.processedFiles.entries()).map(([url, data]) => ({
        url,
        ...data
      }));
    }

    /**
     * Get latest extracted data
     */
    getLatestExtractedData() {
      const files = this.getProcessedFiles();
      if (files.length === 0) return null;
      
      // Return most recent
      return files.sort((a, b) => b.timestamp - a.timestamp)[0];
    }

    /**
     * Manually trigger processing of a link
     */
    async processLink(linkId) {
      const link = this.detectedLinks.get(linkId);
      if (!link) {
        throw new Error('Link not found');
      }
      
      // Simulate click
      link.element.click();
      
      // Wait for interception
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const data = this.getLatestExtractedData();
          if (data && data.timestamp > Date.now() - 5000) {
            clearInterval(checkInterval);
            resolve(data);
          }
        }, 500);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 10000);
      });
    }

    /**
     * Set callback for data extraction
     */
    setOnDataExtracted(callback) {
      this.onDataExtracted = callback;
    }

    /**
     * Get statistics
     */
    getStats() {
      return { ...this.stats };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
      this.observers.forEach(obs => obs.disconnect());
      this.detectedLinks.clear();
      this.pendingDownloads.clear();
      this.processedFiles.clear();
      this.interceptedBlobs.clear();
      log('🗑️ Dynamic Download Detector destroyed');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log('[DynamicDownload]', ...args);
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL API
  // ═══════════════════════════════════════════════════════════════════════════

  const detector = new DynamicDownloadDetector();

  window.DynamicDownloadDetector = DynamicDownloadDetector;
  window.dynamicDownloadDetector = detector;

  log('═'.repeat(80));
  log('✅ DYNAMIC DOWNLOAD LINK DETECTOR v1.0 LOADED');
  log('═'.repeat(80));
  log('🎯 Features: Blob Intercept, Fetch Intercept, XHR Intercept, Auto Parse');
  log('═'.repeat(80));

})(window);
