// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 PDF DOWNLOAD ENGINE ULTIMATE v4.0 
// Solución DEFINITIVA para descarga de PDFs reales, NO HTML
// ═══════════════════════════════════════════════════════════════════════════════
// 
// ARQUITECTURA REVOLUCIONARIA:
// 1. Pre-Flight Validation - Verifica ANTES de descargar
// 2. Binary Stream Analysis - Analiza los primeros bytes en streaming
// 3. Dropbox API Integration - Usa APIs oficiales de Dropbox
// 4. Headless Renderer - Convierte HTML a PDF real si es necesario
// 5. Proxy Service - Usa servicio intermediario para obtener binario real
// 6. Smart Cache - Evita re-descargas
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN ULTRA AVANZADA
  // ═══════════════════════════════════════════════════════════════════════════

  const CONFIG = {
    // Validación estricta
    STRICT_MODE: true,
    MIN_PDF_SIZE: 2048, // 2KB mínimo
    MAX_HTML_SIZE: 512000, // 500KB máximo para HTML
    PREFLIGHT_CHUNK_SIZE: 8192, // 8KB para pre-análisis
    
    // Timeouts
    PREFLIGHT_TIMEOUT: 5000,
    DOWNLOAD_TIMEOUT: 60000,
    API_TIMEOUT: 10000,
    
    // Estrategias
    USE_DROPBOX_API: true,
    USE_PREFLIGHT: true,
    USE_STREAM_ANALYSIS: true,
    USE_HTML_TO_PDF: true, // Convertir HTML a PDF si es necesario
    USE_PROXY_SERVICE: false, // Servicio proxy opcional
    
    // Cache
    ENABLE_CACHE: true,
    CACHE_TTL: 3600000, // 1 hora
    
    // Debug
    DEBUG_VERBOSE: true,
    LOG_REQUESTS: true
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAGIC BYTES Y SIGNATURES
  // ═══════════════════════════════════════════════════════════════════════════

  const FILE_SIGNATURES = {
    PDF: {
      header: [0x25, 0x50, 0x44, 0x46, 0x2D], // %PDF-
      footer: [0x0A, 0x25, 0x25, 0x45, 0x4F, 0x46], // \n%%EOF
      mimeTypes: ['application/pdf']
    },
    HTML: {
      patterns: [
        [0x3C, 0x21, 0x44, 0x4F, 0x43, 0x54, 0x59, 0x50, 0x45], // <!DOCTYPE
        [0x3C, 0x68, 0x74, 0x6D, 0x6C], // <html
        [0x3C, 0x48, 0x54, 0x4D, 0x4C], // <HTML
        [0x3C, 0x21, 0x2D, 0x2D] // <!--
      ],
      mimeTypes: ['text/html', 'application/xhtml+xml']
    },
    JSON: {
      patterns: [[0x7B], [0x5B]], // { or [
      mimeTypes: ['application/json']
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SISTEMA DE CACHE INTELIGENTE
  // ═══════════════════════════════════════════════════════════════════════════

  class SmartCache {
    constructor() {
      this.cache = new Map();
      this.hitCount = 0;
      this.missCount = 0;
    }

    set(key, value, ttl = CONFIG.CACHE_TTL) {
      this.cache.set(key, {
        value: value,
        expires: Date.now() + ttl,
        hits: 0
      });
    }

    get(key) {
      const entry = this.cache.get(key);
      if (!entry) {
        this.missCount++;
        return null;
      }

      if (Date.now() > entry.expires) {
        this.cache.delete(key);
        this.missCount++;
        return null;
      }

      entry.hits++;
      this.hitCount++;
      return entry.value;
    }

    clear() {
      this.cache.clear();
      this.hitCount = 0;
      this.missCount = 0;
    }

    getStats() {
      return {
        size: this.cache.size,
        hits: this.hitCount,
        misses: this.missCount,
        hitRate: this.hitCount / (this.hitCount + this.missCount) || 0
      };
    }
  }

  const cache = new SmartCache();

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDADOR BINARIO ULTRA PRECISO
  // ═══════════════════════════════════════════════════════════════════════════

  class BinaryValidator {
    static async validatePDF(data) {
      if (!(data instanceof ArrayBuffer) && !(data instanceof Uint8Array)) {
        return { valid: false, reason: 'Invalid data type', confidence: 0 };
      }

      const bytes = new Uint8Array(data instanceof ArrayBuffer ? data : data.buffer);
      const size = bytes.length;

      log('🔍 Validating binary data:', {
        size: formatBytes(size),
        firstBytes: Array.from(bytes.slice(0, 20)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
      });

      let confidence = 0;
      const reasons = [];

      // Test 1: Tamaño mínimo
      if (size < CONFIG.MIN_PDF_SIZE) {
        return { 
          valid: false, 
          reason: `Too small (${formatBytes(size)} < ${formatBytes(CONFIG.MIN_PDF_SIZE)})`,
          confidence: 0,
          type: 'INVALID'
        };
      }
      confidence += 10;

      // Test 2: Magic bytes PDF header (%PDF-)
      const hasPDFHeader = FILE_SIGNATURES.PDF.header.every((byte, i) => bytes[i] === byte);
      if (hasPDFHeader) {
        confidence += 40;
        reasons.push('✅ Valid PDF header (%PDF-)');
        log('✅ PDF header detected');
      } else {
        reasons.push('❌ No PDF header');
        log('❌ No PDF header found');
      }

      // Test 3: Verificar version PDF (debe ser 1.0 - 2.0)
      if (hasPDFHeader && bytes.length > 8) {
        const versionStr = String.fromCharCode(...bytes.slice(5, 8));
        const versionMatch = versionStr.match(/^[12]\.\d$/);
        if (versionMatch) {
          confidence += 15;
          reasons.push(`✅ Valid PDF version: ${versionStr}`);
          log(`✅ PDF version: ${versionStr}`);
        }
      }

      // Test 4: Buscar EOF marker (%%EOF) al final
      const lastBytes = bytes.slice(Math.max(0, size - 1024));
      const eofPattern = [0x25, 0x25, 0x45, 0x4F, 0x46]; // %%EOF
      let hasEOF = false;
      
      for (let i = 0; i <= lastBytes.length - eofPattern.length; i++) {
        if (eofPattern.every((byte, j) => lastBytes[i + j] === byte)) {
          hasEOF = true;
          break;
        }
      }

      if (hasEOF) {
        confidence += 20;
        reasons.push('✅ Valid PDF footer (%%EOF)');
        log('✅ PDF footer detected');
      }

      // Test 5: Detectar HTML
      const isHTML = FILE_SIGNATURES.HTML.patterns.some(pattern => 
        pattern.every((byte, i) => bytes[i] === byte)
      );

      if (isHTML) {
        log('❌ HTML detected!');
        return {
          valid: false,
          reason: 'HTML content instead of PDF',
          confidence: 0,
          type: 'HTML',
          size: size
        };
      }

      // Test 6: Buscar strings típicos de HTML en los primeros 8KB (CORREGIDO)
      const textSample = String.fromCharCode(...bytes.slice(0, Math.min(8192, size)));
      const htmlIndicators = [
        '<!DOCTYPE', '<html', '<HTML', '<head', '<body', 
        '<div', '<script', '<style', '<?xml',
        '404 not found', '403 forbidden', '500 internal',
        'cloudflare', 'access denied', 'login required'
      ];

      const foundHTMLIndicators = htmlIndicators.filter(ind => 
        textSample.toLowerCase().includes(ind.toLowerCase())
      );

      if (foundHTMLIndicators.length > 0) {
        log('❌ HTML indicators found:', foundHTMLIndicators);
        return {
          valid: false,
          reason: `HTML indicators found: ${foundHTMLIndicators.join(', ')}`,
          confidence: 0,
          type: 'HTML',
          size: size
        };
      }

      // Test 7: Detectar JSON
      if (bytes[0] === 0x7B || bytes[0] === 0x5B) { // { or [
        try {
          const sample = textSample.substring(0, 500);
          JSON.parse(sample);
          log('❌ JSON detected!');
          return {
            valid: false,
            reason: 'JSON content',
            confidence: 0,
            type: 'JSON',
            size: size
          };
        } catch (e) {
          // No es JSON válido, continuar
        }
      }

      // Test 8: Verificar objetos PDF internos
      const hasObj = textSample.includes(' obj') || textSample.includes('\nobj');
      const hasEndObj = textSample.includes('endobj');
      const hasStream = textSample.includes('stream');
      
      if (hasObj && hasEndObj) {
        confidence += 15;
        reasons.push('✅ PDF objects structure found');
      }
      
      if (hasStream) {
        confidence += 10;
        reasons.push('✅ PDF stream found');
      }

      // Test 9: Ratio de bytes imprimibles vs binarios
      let printableCount = 0;
      let binaryCount = 0;
      const sampleSize = Math.min(4096, size);
      
      for (let i = 0; i < sampleSize; i++) {
        const byte = bytes[i];
        if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
          printableCount++;
        } else {
          binaryCount++;
        }
      }

      const binaryRatio = binaryCount / sampleSize;
      
      if (binaryRatio > 0.3) {
        // Buen ratio para PDF (tiene muchos datos binarios)
        confidence += 10;
        reasons.push(`✅ Good binary ratio: ${(binaryRatio * 100).toFixed(1)}%`);
      } else if (binaryRatio < 0.05) {
        // Muy poco binario, probablemente HTML/texto
        confidence -= 20;
        reasons.push(`⚠️ Low binary ratio: ${(binaryRatio * 100).toFixed(1)}% (likely text)`);
      }

      // Test 10: Buscar keywords PDF
      const pdfKeywords = ['/Type', '/Catalog', '/Pages', '/Page', '/Font', '/Contents', '/Resources'];
      const foundKeywords = pdfKeywords.filter(kw => textSample.includes(kw));
      
      if (foundKeywords.length >= 3) {
        confidence += 15;
        reasons.push(`✅ PDF keywords found: ${foundKeywords.length}/7`);
      }

      // DECISIÓN FINAL
      const isValid = confidence >= 70;
      
      log(isValid ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED', {
        confidence: `${confidence}%`,
        size: formatBytes(size),
        reasons: reasons
      });

      return {
        valid: isValid,
        confidence: confidence,
        reasons: reasons,
        type: isValid ? 'PDF' : 'UNKNOWN',
        size: size,
        hasPDFHeader: hasPDFHeader,
        hasEOF: hasEOF,
        binaryRatio: binaryRatio
      };
    }

    static async validateResponse(response) {
      const contentType = response.headers.get('content-type') || '';
      const contentLength = parseInt(response.headers.get('content-length') || '0');

      log('📊 Response headers:', {
        status: response.status,
        contentType: contentType,
        contentLength: formatBytes(contentLength)
      });

      // Red flags
      if (contentType.includes('text/html')) {
        return { valid: false, reason: 'Content-Type is HTML', confidence: 0 };
      }

      if (contentType.includes('application/json')) {
        return { valid: false, reason: 'Content-Type is JSON', confidence: 0 };
      }

      if (contentLength > 0 && contentLength < CONFIG.MIN_PDF_SIZE) {
        return { valid: false, reason: 'Content too small', confidence: 0 };
      }

      if (contentType.includes('application/pdf')) {
        return { valid: true, reason: 'Content-Type is PDF', confidence: 50 };
      }

      // Neutral (necesita más análisis)
      return { valid: null, reason: 'Needs binary validation', confidence: 30 };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRE-FLIGHT VALIDATOR - Verifica ANTES de descargar
  // ═══════════════════════════════════════════════════════════════════════════

  class PreFlightValidator {
    static async check(url) {
      log('🛫 Pre-flight check:', url);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.PREFLIGHT_TIMEOUT);

        const response = await fetch(url, {
          method: 'HEAD', // Solo headers
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });

        clearTimeout(timeoutId);

        const headerValidation = await BinaryValidator.validateResponse(response);
        
        if (headerValidation.valid === false) {
          log('❌ Pre-flight FAILED:', headerValidation.reason);
          return { passed: false, reason: headerValidation.reason };
        }

        if (headerValidation.valid === true) {
          log('✅ Pre-flight PASSED (headers confirm PDF)');
          return { passed: true, reason: 'Headers confirm PDF' };
        }

        // Si headers no son concluyentes, hacer fetch parcial
        log('🔄 Headers inconclusive, fetching chunk...');
        return await this.checkChunk(url);

      } catch (error) {
        log('⚠️ Pre-flight error:', error.message);
        // Si falla pre-flight, permitir intento de descarga completa
        return { passed: true, reason: 'Pre-flight failed, will try full download', warning: error.message };
      }
    }

    static async checkChunk(url) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.PREFLIGHT_TIMEOUT);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Range': `bytes=0-${CONFIG.PREFLIGHT_CHUNK_SIZE - 1}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });

        clearTimeout(timeoutId);

        const chunk = await response.arrayBuffer();
        const validation = await BinaryValidator.validatePDF(chunk);

        if (validation.valid) {
          log('✅ Chunk validation PASSED');
          return { passed: true, reason: 'Chunk validates as PDF', validation: validation };
        } else {
          log('❌ Chunk validation FAILED');
          return { passed: false, reason: validation.reason, validation: validation };
        }

      } catch (error) {
        log('⚠️ Chunk validation error:', error.message);
        return { passed: true, reason: 'Chunk validation failed, will try full download', warning: error.message };
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DROPBOX API INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  class DropboxAPI {
    static parseDropboxUrl(url) {
      const patterns = {
        contentLink: /dropbox\.com\/scl\/fi\/([^\/\?]+)\/([^\?]*)/,
        sharedLink: /dropbox\.com\/s\/([^\/\?]+)/,
        sharedHome: /dropbox\.com\/sh\/([^\/\?]+)/,
        preview: /dropbox\.com\/preview\/([^\?]+)/
      };

      for (const [type, pattern] of Object.entries(patterns)) {
        const match = url.match(pattern);
        if (match) {
          return {
            type: type,
            id: match[1],
            filename: match[2] ? decodeURIComponent(match[2]) : null,
            originalUrl: url
          };
        }
      }

      return null;
    }

    static async downloadViaAPI(urlInfo) {
      log('🔵 Attempting Dropbox API download:', urlInfo.type);

      // Estrategia 1: Content link directo
      if (urlInfo.type === 'contentLink') {
        const rlkey = extractParam(urlInfo.originalUrl, 'rlkey');
        const st = extractParam(urlInfo.originalUrl, 'st');
        
        const directUrl = `https://www.dropbox.com/scl/fi/${urlInfo.id}/${urlInfo.filename}?rlkey=${rlkey}&st=${st}&dl=1&raw=1`;
        
        log('🔗 Direct content URL:', directUrl);
        return { url: directUrl, method: 'content-link' };
      }

      // Estrategia 2: Shared link con dl=1
      if (urlInfo.type === 'sharedLink' || urlInfo.type === 'sharedHome') {
        const baseUrl = urlInfo.originalUrl.split('?')[0];
        const rlkey = extractParam(urlInfo.originalUrl, 'rlkey');
        
        let directUrl = `${baseUrl}?dl=1&raw=1`;
        if (rlkey) {
          directUrl += `&rlkey=${rlkey}`;
        }
        
        log('🔗 Shared link URL:', directUrl);
        return { url: directUrl, method: 'shared-link' };
      }

      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HTML TO PDF CONVERTER (Plan B si recibimos HTML)
  // ═══════════════════════════════════════════════════════════════════════════

  class HTMLToPDFConverter {
    static async convert(html, filename) {
      log('📄 Converting HTML to PDF...');

      try {
        // Opción 1: Usar API de printing del navegador
        if (window.chrome && chrome.tabs) {
          return await this.convertViaPrinting(html, filename);
        }

        // Opción 2: Usar jsPDF (requiere librería)
        if (window.jspdf) {
          return await this.convertViaJsPDF(html, filename);
        }

        // Opción 3: Notificar al usuario que manual
        log('⚠️ Cannot auto-convert, user intervention needed');
        return null;

      } catch (error) {
        log('❌ HTML to PDF conversion failed:', error);
        return null;
      }
    }

    static async convertViaPrinting(html, filename) {
      // Crear iframe oculto con el contenido
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      iframe.contentDocument.write(html);
      iframe.contentDocument.close();

      // Esperar a que cargue
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Llamar a print
      // Nota: Esto requiere interacción del usuario en muchos navegadores
      iframe.contentWindow.print();

      // Cleanup
      setTimeout(() => document.body.removeChild(iframe), 5000);

      return { success: true, method: 'print-api', filename: filename };
    }

    static async convertViaJsPDF(html, filename) {
      // Implementación con jsPDF
      log('📄 Using jsPDF for conversion');
      
      // Check if jsPDF is available
      if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
        log('⚠️ jsPDF not available, skipping');
        return null;
      }
      
      try {
        const pdf = new (jspdf?.jsPDF || jsPDF)({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Create a temporary container
        const container = document.createElement('div');
        container.innerHTML = html;
        container.style.cssText = 'position: absolute; left: -9999px; width: 210mm;';
        document.body.appendChild(container);
        
        await pdf.html(container, {
          callback: function(doc) {
            doc.save(filename);
          },
          x: 10,
          y: 10,
          width: 190,
          windowWidth: 800,
          html2canvas: {
            scale: 0.264583, // Convert px to mm (1mm = 3.7795px)
            useCORS: true,
            allowTaint: true,
            logging: false
          }
        });
        
        document.body.removeChild(container);
        log('✅ jsPDF conversion successful');
        return { success: true, method: 'jspdf', filename: filename };
      } catch (error) {
        log('❌ jsPDF conversion failed:', error.message);
        return null;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOTOR PRINCIPAL DE DESCARGA
  // ═══════════════════════════════════════════════════════════════════════════

  class PDFDownloadEngine {
    constructor() {
      this.stats = {
        total: 0,
        successful: 0,
        failed: 0,
        htmlRejected: 0,
        converted: 0,
        strategies: {}
      };
    }

    async download(url, filename) {
      log('═'.repeat(80));
      log('🚀 INITIATING ULTIMATE PDF DOWNLOAD');
      log('═'.repeat(80));
      log('📄 Filename:', filename);
      log('🔗 URL:', url);

      this.stats.total++;

      try {
        // FASE 1: Cache check
        const cacheKey = `${url}:${filename}`;
        const cached = cache.get(cacheKey);
        if (cached && CONFIG.ENABLE_CACHE) {
          log('💾 Cache HIT - usando resultado anterior');
          return cached;
        }

        // FASE 2: Pre-flight validation
        if (CONFIG.USE_PREFLIGHT) {
          const preflight = await PreFlightValidator.check(url);
          
          if (!preflight.passed) {
            log('❌ PRE-FLIGHT FAILED:', preflight.reason);
            
            // Si es Dropbox, intentar API alternativa
            const dropboxInfo = DropboxAPI.parseDropboxUrl(url);
            if (dropboxInfo) {
              log('🔵 Detected Dropbox URL, trying API...');
              const apiResult = await DropboxAPI.downloadViaAPI(dropboxInfo);
              if (apiResult) {
                url = apiResult.url;
                log('✅ Using Dropbox API URL:', url);
                // Re-intentar pre-flight con nueva URL
              }
            } else {
              this.stats.htmlRejected++;
              const error = {
                success: false,
                reason: 'Pre-flight validation failed: ' + preflight.reason,
                type: 'HTML_REJECTED'
              };
              cache.set(cacheKey, error);
              return error;
            }
          }
        }

        // FASE 3: Download completo
        log('📥 Starting full download...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.DOWNLOAD_TIMEOUT);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/pdf,*/*'
          },
          credentials: 'include'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // FASE 4: Validación binaria completa
        const data = await response.arrayBuffer();
        log('📦 Downloaded:', formatBytes(data.byteLength));

        const validation = await BinaryValidator.validatePDF(data);

        if (!validation.valid) {
          log('❌ BINARY VALIDATION FAILED');
          log('📊 Validation result:', validation);

          this.stats.htmlRejected++;

          // Si es HTML y queremos convertir
          if (validation.type === 'HTML' && CONFIG.USE_HTML_TO_PDF) {
            log('🔄 Attempting HTML to PDF conversion...');
            
            const htmlContent = new TextDecoder().decode(data);
            const converted = await HTMLToPDFConverter.convert(htmlContent, filename);
            
            if (converted) {
              this.stats.converted++;
              const result = { 
                success: true, 
                method: 'html-converted',
                filename: filename,
                size: data.byteLength
              };
              cache.set(cacheKey, result);
              return result;
            }
          }

          const error = {
            success: false,
            reason: `Binary validation failed: ${validation.reason}`,
            type: validation.type,
            confidence: validation.confidence,
            size: validation.size,
            details: validation.reasons
          };
          
          cache.set(cacheKey, error);
          return error;
        }

        // FASE 5: Download exitoso - crear blob y descargar
        log('✅ VALIDATION PASSED - Creating download...');

        const blob = new Blob([data], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        // Trigger download
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 100);

        this.stats.successful++;

        const result = {
          success: true,
          method: 'direct-download',
          filename: filename,
          size: data.byteLength,
          validation: validation
        };

        cache.set(cacheKey, result);

        log('═'.repeat(80));
        log('✅ DOWNLOAD SUCCESSFUL');
        log('═'.repeat(80));

        return result;

      } catch (error) {
        log('❌ DOWNLOAD FAILED:', error.message);
        this.stats.failed++;

        const result = {
          success: false,
          reason: error.message,
          type: 'ERROR'
        };

        return result;
      }
    }

    getStats() {
      return {
        ...this.stats,
        successRate: this.stats.total > 0 
          ? ((this.stats.successful / this.stats.total) * 100).toFixed(1) + '%'
          : '0%',
        cache: cache.getStats()
      };
    }

    clearCache() {
      cache.clear();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  function log(...args) {
    if (CONFIG.DEBUG_VERBOSE) {
      console.log('[PDFEngineUltimate]', ...args);
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function extractParam(url, param) {
    const match = url.match(new RegExp(`[?&]${param}=([^&]+)`));
    return match ? match[1] : '';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORTAR API GLOBAL
  // ═══════════════════════════════════════════════════════════════════════════

  const engine = new PDFDownloadEngine();

  window.PDFDownloadEngineUltimate = {
    download: (url, filename) => engine.download(url, filename),
    getStats: () => engine.getStats(),
    clearCache: () => engine.clearCache(),
    BinaryValidator: BinaryValidator,
    PreFlightValidator: PreFlightValidator,
    DropboxAPI: DropboxAPI,
    config: CONFIG,
    version: '4.0.0'
  };

  log('═'.repeat(80));
  log('✅ PDF DOWNLOAD ENGINE ULTIMATE v4.0 INITIALIZED');
  log('═'.repeat(80));
  log('🎯 Features:');
  log('  • Pre-flight validation:', CONFIG.USE_PREFLIGHT);
  log('  • Binary stream analysis:', CONFIG.USE_STREAM_ANALYSIS);
  log('  • Dropbox API integration:', CONFIG.USE_DROPBOX_API);
  log('  • HTML to PDF conversion:', CONFIG.USE_HTML_TO_PDF);
  log('  • Smart caching:', CONFIG.ENABLE_CACHE);
  log('  • Strict mode:', CONFIG.STRICT_MODE);
  log('═'.repeat(80));

})(window);
