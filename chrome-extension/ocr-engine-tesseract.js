// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 OCR ENGINE v1.0 - Tesseract.js Integration
// ═══════════════════════════════════════════════════════════════════════════════
//
// FEATURES:
// - Multi-language OCR (English, Spanish, French)
// - Image pre-processing for better accuracy
// - Confidence scoring
// - Automatic language detection
// - Batch processing
// - Progress tracking
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const CONFIG = {
    TESSERACT_CDN: 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js',
    DEFAULT_LANG: 'eng',
    SUPPORTED_LANGS: ['eng', 'spa', 'fra'],
    CONFIDENCE_THRESHOLD: 60,
    ENABLE_PREPROCESSING: true,
    DEBUG: false
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TESSERACT LOADER
  // ═══════════════════════════════════════════════════════════════════════════

  class TesseractLoader {
    static async load() {
      if (window.Tesseract) {
        log('✅ Tesseract already loaded');
        return window.Tesseract;
      }

      log('📦 Loading Tesseract.js from CDN...');

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = CONFIG.TESSERACT_CDN;
        script.async = true;

        script.onload = () => {
          if (window.Tesseract) {
            log('✅ Tesseract.js loaded successfully');
            resolve(window.Tesseract);
          } else {
            reject(new Error('Tesseract loaded but not available'));
          }
        };

        script.onerror = () => {
          reject(new Error('Failed to load Tesseract.js from CDN'));
        };

        document.head.appendChild(script);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE PREPROCESSOR
  // ═══════════════════════════════════════════════════════════════════════════

  class ImagePreprocessor {
    static async preprocess(imageSource) {
      if (!CONFIG.ENABLE_PREPROCESSING) {
        return imageSource;
      }

      log('🎨 Preprocessing image for better OCR...');

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Load image
        const img = await this.loadImage(imageSource);
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply preprocessing filters
        this.grayscale(data);
        this.increaseContrast(data, 20);
        this.sharpen(imageData);

        // Put processed data back
        ctx.putImageData(imageData, 0, 0);

        return canvas;
      } catch (error) {
        log('⚠️ Preprocessing failed, using original image:', error.message);
        return imageSource;
      }
    }

    static async loadImage(source) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => resolve(img);
        img.onerror = reject;

        if (source instanceof HTMLImageElement) {
          resolve(source);
        } else if (source instanceof HTMLCanvasElement) {
          img.src = source.toDataURL();
        } else if (typeof source === 'string') {
          img.src = source;
        } else {
          reject(new Error('Invalid image source'));
        }
      });
    }

    static grayscale(data) {
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // Red
        data[i + 1] = avg; // Green
        data[i + 2] = avg; // Blue
      }
    }

    static increaseContrast(data, contrast) {
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;       // Red
        data[i + 1] = factor * (data[i + 1] - 128) + 128; // Green
        data[i + 2] = factor * (data[i + 2] - 128) + 128; // Blue
      }
    }

    static sharpen(imageData) {
      const weights = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];

      const side = Math.round(Math.sqrt(weights.length));
      const halfSide = Math.floor(side / 2);
      const src = imageData.data;
      const w = imageData.width;
      const h = imageData.height;
      const output = new Uint8ClampedArray(src.length);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const dstOff = (y * w + x) * 4;
          let r = 0, g = 0, b = 0;

          for (let cy = 0; cy < side; cy++) {
            for (let cx = 0; cx < side; cx++) {
              const scy = y + cy - halfSide;
              const scx = x + cx - halfSide;

              if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
                const srcOff = (scy * w + scx) * 4;
                const wt = weights[cy * side + cx];

                r += src[srcOff] * wt;
                g += src[srcOff + 1] * wt;
                b += src[srcOff + 2] * wt;
              }
            }
          }

          output[dstOff] = r;
          output[dstOff + 1] = g;
          output[dstOff + 2] = b;
          output[dstOff + 3] = src[dstOff + 3]; // Alpha
        }
      }

      imageData.data.set(output);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OCR ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  class OCREngine {
    constructor() {
      this.worker = null;
      this.initialized = false;
      this.stats = {
        total: 0,
        successful: 0,
        failed: 0,
        averageConfidence: 0
      };
    }

    async initialize(lang = CONFIG.DEFAULT_LANG) {
      if (this.initialized) {
        log('✅ OCR Engine already initialized');
        return;
      }

      log('🚀 Initializing OCR Engine...');

      try {
        // Load Tesseract
        const Tesseract = await TesseractLoader.load();

        // Create worker
        this.worker = await Tesseract.createWorker(lang, 1, {
          logger: (m) => {
            if (CONFIG.DEBUG && m.status === 'recognizing text') {
              log(`📊 OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });

        this.initialized = true;
        log('✅ OCR Engine initialized with language:', lang);

      } catch (error) {
        log('❌ OCR Engine initialization failed:', error);
        throw error;
      }
    }

    async recognize(imageSource, options = {}) {
      if (!this.initialized) {
        await this.initialize(options.lang || CONFIG.DEFAULT_LANG);
      }

      this.stats.total++;

      log('🔍 Starting OCR recognition...');

      try {
        // Preprocess image
        const processedImage = await ImagePreprocessor.preprocess(imageSource);

        // Perform OCR
        const result = await this.worker.recognize(processedImage);

        // Process result
        const text = result.data.text;
        const confidence = result.data.confidence;

        log('✅ OCR completed:', {
          confidence: confidence.toFixed(2) + '%',
          textLength: text.length
        });

        if (confidence < CONFIG.CONFIDENCE_THRESHOLD) {
          log('⚠️ Low confidence result');
        }

        this.stats.successful++;
        this.updateAverageConfidence(confidence);

        return {
          success: true,
          text: text,
          confidence: confidence,
          words: result.data.words,
          lines: result.data.lines,
          paragraphs: result.data.paragraphs,
          metadata: {
            language: options.lang || CONFIG.DEFAULT_LANG,
            processingTime: result.data.processingTime
          }
        };

      } catch (error) {
        log('❌ OCR recognition failed:', error);
        this.stats.failed++;

        return {
          success: false,
          error: error.message,
          text: '',
          confidence: 0
        };
      }
    }

    async recognizeBatch(images, options = {}) {
      log(`📦 Starting batch OCR for ${images.length} images...`);

      const results = [];
      let completed = 0;

      for (const image of images) {
        const result = await this.recognize(image, options);
        results.push(result);
        
        completed++;
        log(`✓ Completed ${completed}/${images.length}`);

        // Callback for progress
        if (options.onProgress) {
          options.onProgress(completed, images.length);
        }
      }

      const successCount = results.filter(r => r.success).length;
      log(`✅ Batch OCR completed: ${successCount}/${images.length} successful`);

      return {
        success: true,
        results: results,
        summary: {
          total: images.length,
          successful: successCount,
          failed: images.length - successCount
        }
      };
    }

    updateAverageConfidence(confidence) {
      const total = this.stats.total;
      const current = this.stats.averageConfidence;
      this.stats.averageConfidence = (current * (total - 1) + confidence) / total;
    }

    getStats() {
      return {
        ...this.stats,
        successRate: this.stats.total > 0 
          ? ((this.stats.successful / this.stats.total) * 100).toFixed(1) + '%'
          : '0%'
      };
    }

    async terminate() {
      if (this.worker) {
        await this.worker.terminate();
        this.worker = null;
        this.initialized = false;
        log('✅ OCR Engine terminated');
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE EXTRACTOR - Extrae imágenes de la página
  // ═══════════════════════════════════════════════════════════════════════════

  class ImageExtractor {
    static async extractFromPage(options = {}) {
      log('🖼️ Extracting images from page...');

      const images = [];
      const selectors = options.selectors || ['img', 'canvas', 'svg'];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        
        for (const element of elements) {
          try {
            const imageData = await this.extractFromElement(element);
            if (imageData) {
              images.push(imageData);
            }
          } catch (error) {
            log('⚠️ Failed to extract image:', error.message);
          }
        }
      }

      log(`✅ Extracted ${images.length} images`);
      return images;
    }

    static async extractFromElement(element) {
      if (element.tagName === 'IMG') {
        return {
          element: element,
          source: element.src,
          width: element.naturalWidth,
          height: element.naturalHeight,
          alt: element.alt || ''
        };
      }

      if (element.tagName === 'CANVAS') {
        return {
          element: element,
          source: element.toDataURL(),
          width: element.width,
          height: element.height,
          alt: ''
        };
      }

      if (element.tagName === 'SVG') {
        const canvas = await this.svgToCanvas(element);
        return {
          element: element,
          source: canvas.toDataURL(),
          width: canvas.width,
          height: canvas.height,
          alt: ''
        };
      }

      return null;
    }

    static async svgToCanvas(svg) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgString = new XMLSerializer().serializeToString(svg);
      const img = new Image();

      return new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve(canvas);
        };
        img.onerror = reject;
        img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log('[OCREngine]', ...args);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL API
  // ═══════════════════════════════════════════════════════════════════════════

  const engine = new OCREngine();

  window.OCREngine = {
    initialize: (lang) => engine.initialize(lang),
    recognize: (image, options) => engine.recognize(image, options),
    recognizeBatch: (images, options) => engine.recognizeBatch(images, options),
    getStats: () => engine.getStats(),
    terminate: () => engine.terminate(),
    
    // Helper utilities
    ImageExtractor: ImageExtractor,
    ImagePreprocessor: ImagePreprocessor,
    
    version: '1.0.0'
  };

  log('═'.repeat(80));
  log('✅ OCR ENGINE v1.0 LOADED');
  log('═'.repeat(80));
  log('🎯 Supported languages:', CONFIG.SUPPORTED_LANGS.join(', '));
  log('🔍 Tesseract CDN:', CONFIG.TESSERACT_CDN);
  log('═'.repeat(80));

})(window);
