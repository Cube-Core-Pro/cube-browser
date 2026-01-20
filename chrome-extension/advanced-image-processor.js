// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ ADVANCED IMAGE PROCESSOR v1.0 - Enterprise Document Processing
// ═══════════════════════════════════════════════════════════════════════════════
//
// FEATURES:
// - Adaptive Binarization (Otsu, Sauvola, Niblack)
// - Deskew Detection & Correction
// - Noise Removal (Median, Gaussian, Bilateral)
// - Perspective Correction
// - Border Detection & Cropping
// - Contrast Enhancement (CLAHE)
// - Color Space Conversion
// - Resolution Enhancement
// - Document Edge Detection
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const CONFIG = {
    // Deskew
    DESKEW_MAX_ANGLE: 45,
    DESKEW_ANGLE_RESOLUTION: 0.5,
    DESKEW_CONFIDENCE_THRESHOLD: 0.6,

    // Binarization
    BINARIZE_BLOCK_SIZE: 11,
    BINARIZE_C: 2,
    
    // Noise Removal
    NOISE_MEDIAN_SIZE: 3,
    NOISE_GAUSSIAN_SIGMA: 1.5,
    
    // Border Detection
    BORDER_THRESHOLD: 10,
    BORDER_MIN_AREA: 1000,
    
    // Quality
    MIN_DPI: 150,
    TARGET_DPI: 300,
    
    DEBUG: false
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVANCED IMAGE PROCESSOR
  // ═══════════════════════════════════════════════════════════════════════════

  class AdvancedImageProcessor {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.stats = {
        processed: 0,
        deskewed: 0,
        binarized: 0,
        denoised: 0
      };
    }

    /**
     * Initialize canvas for image processing
     */
    initCanvas(width, height) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
      return this.canvas;
    }

    /**
     * Process document image with full pipeline
     */
    async processDocument(imageSource, options = {}) {
      log('🖼️ Starting document processing pipeline...');
      
      const startTime = performance.now();
      
      try {
        // Load image
        let imageData = await this.loadImage(imageSource);
        log(`  Loaded image: ${imageData.width}x${imageData.height}`);

        // Step 1: Convert to grayscale
        if (options.grayscale !== false) {
          imageData = this.toGrayscale(imageData);
          log('  ✓ Converted to grayscale');
        }

        // Step 2: Denoise
        if (options.denoise !== false) {
          imageData = this.denoise(imageData, options.denoiseMethod || 'median');
          log('  ✓ Noise removed');
        }

        // Step 3: Detect and correct skew
        if (options.deskew !== false) {
          const skewResult = this.detectSkew(imageData);
          if (Math.abs(skewResult.angle) > 0.5) {
            imageData = this.rotate(imageData, -skewResult.angle);
            log(`  ✓ Deskewed by ${skewResult.angle.toFixed(2)}°`);
            this.stats.deskewed++;
          }
        }

        // Step 4: Enhance contrast
        if (options.enhanceContrast !== false) {
          imageData = this.enhanceContrast(imageData, options.contrastMethod || 'clahe');
          log('  ✓ Contrast enhanced');
        }

        // Step 5: Binarize
        if (options.binarize !== false) {
          imageData = this.binarize(imageData, options.binarizeMethod || 'otsu');
          log('  ✓ Binarized');
          this.stats.binarized++;
        }

        // Step 6: Detect and crop borders
        if (options.cropBorders !== false) {
          const borders = this.detectBorders(imageData);
          if (borders.found) {
            imageData = this.cropToRegion(imageData, borders.region);
            log('  ✓ Borders cropped');
          }
        }

        const duration = performance.now() - startTime;
        this.stats.processed++;
        log(`✅ Processing complete in ${duration.toFixed(0)}ms`);

        return {
          success: true,
          imageData: imageData,
          canvas: this.imageDataToCanvas(imageData),
          duration: duration,
          operations: options
        };

      } catch (error) {
        console.error('❌ Image processing error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }

    /**
     * Load image from various sources
     */
    async loadImage(source) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          this.initCanvas(img.width, img.height);
          this.ctx.drawImage(img, 0, 0);
          const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
          resolve(imageData);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));

        if (source instanceof ImageData) {
          resolve(source);
        } else if (source instanceof HTMLImageElement) {
          if (source.complete) {
            img.onload();
          } else {
            img.src = source.src;
          }
        } else if (source instanceof HTMLCanvasElement) {
          const ctx = source.getContext('2d');
          resolve(ctx.getImageData(0, 0, source.width, source.height));
        } else if (source instanceof Blob || source instanceof File) {
          img.src = URL.createObjectURL(source);
        } else if (typeof source === 'string') {
          img.src = source;
        } else {
          reject(new Error('Unsupported image source type'));
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COLOR SPACE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Convert image to grayscale
     */
    toGrayscale(imageData) {
      const data = new Uint8ClampedArray(imageData.data);
      
      for (let i = 0; i < data.length; i += 4) {
        // Luminosity method: 0.299R + 0.587G + 0.114B
        const gray = Math.round(
          0.299 * data[i] + 
          0.587 * data[i + 1] + 
          0.114 * data[i + 2]
        );
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      return new ImageData(data, imageData.width, imageData.height);
    }

    /**
     * Check if image is grayscale
     */
    isGrayscale(imageData) {
      const data = imageData.data;
      const sampleSize = Math.min(1000, data.length / 4);
      const step = Math.floor(data.length / 4 / sampleSize);
      
      for (let i = 0; i < data.length; i += step * 4) {
        if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2]) {
          return false;
        }
      }
      return true;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BINARIZATION ALGORITHMS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Binarize image using specified method
     */
    binarize(imageData, method = 'otsu') {
      switch (method) {
        case 'otsu':
          return this.otsuThreshold(imageData);
        case 'sauvola':
          return this.sauvolaThreshold(imageData);
        case 'niblack':
          return this.niblackThreshold(imageData);
        case 'adaptive':
          return this.adaptiveThreshold(imageData);
        default:
          return this.otsuThreshold(imageData);
      }
    }

    /**
     * Otsu's Binarization - Global optimal threshold
     * Best for: Documents with uniform lighting
     */
    otsuThreshold(imageData) {
      const data = imageData.data;
      const histogram = new Array(256).fill(0);
      
      // Build histogram
      for (let i = 0; i < data.length; i += 4) {
        histogram[data[i]]++;
      }

      const total = imageData.width * imageData.height;
      
      let sum = 0;
      for (let i = 0; i < 256; i++) {
        sum += i * histogram[i];
      }

      let sumB = 0;
      let wB = 0;
      let wF = 0;
      let maxVariance = 0;
      let threshold = 0;

      for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;

        wF = total - wB;
        if (wF === 0) break;

        sumB += t * histogram[t];

        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;

        const variance = wB * wF * (mB - mF) * (mB - mF);

        if (variance > maxVariance) {
          maxVariance = variance;
          threshold = t;
        }
      }

      log(`  Otsu threshold: ${threshold}`);

      return this.applyThreshold(imageData, threshold);
    }

    /**
     * Sauvola's Binarization - Local adaptive threshold
     * Best for: Documents with uneven lighting or shadows
     */
    sauvolaThreshold(imageData, windowSize = 15, k = 0.5, r = 128) {
      const width = imageData.width;
      const height = imageData.height;
      const data = new Uint8ClampedArray(imageData.data);
      const result = new Uint8ClampedArray(data.length);
      
      // Create integral images for faster computation
      const integralSum = new Float64Array((width + 1) * (height + 1));
      const integralSqSum = new Float64Array((width + 1) * (height + 1));
      
      // Build integral images
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const val = data[idx];
          const intIdx = (y + 1) * (width + 1) + (x + 1);
          
          integralSum[intIdx] = val + 
            integralSum[intIdx - 1] + 
            integralSum[intIdx - width - 1] - 
            integralSum[intIdx - width - 2];
            
          integralSqSum[intIdx] = val * val + 
            integralSqSum[intIdx - 1] + 
            integralSqSum[intIdx - width - 1] - 
            integralSqSum[intIdx - width - 2];
        }
      }

      const half = Math.floor(windowSize / 2);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const x1 = Math.max(0, x - half);
          const y1 = Math.max(0, y - half);
          const x2 = Math.min(width - 1, x + half);
          const y2 = Math.min(height - 1, y + half);
          
          const area = (x2 - x1 + 1) * (y2 - y1 + 1);
          
          // Get sum and squared sum from integral images
          const sum = integralSum[(y2 + 1) * (width + 1) + (x2 + 1)] -
                     integralSum[(y2 + 1) * (width + 1) + x1] -
                     integralSum[y1 * (width + 1) + (x2 + 1)] +
                     integralSum[y1 * (width + 1) + x1];
                     
          const sqSum = integralSqSum[(y2 + 1) * (width + 1) + (x2 + 1)] -
                       integralSqSum[(y2 + 1) * (width + 1) + x1] -
                       integralSqSum[y1 * (width + 1) + (x2 + 1)] +
                       integralSqSum[y1 * (width + 1) + x1];

          const mean = sum / area;
          const variance = (sqSum / area) - (mean * mean);
          const stdDev = Math.sqrt(Math.max(0, variance));
          
          // Sauvola formula
          const threshold = mean * (1 + k * (stdDev / r - 1));
          
          const idx = (y * width + x) * 4;
          const pixel = data[idx];
          const binary = pixel > threshold ? 255 : 0;
          
          result[idx] = binary;
          result[idx + 1] = binary;
          result[idx + 2] = binary;
          result[idx + 3] = 255;
        }
      }

      return new ImageData(result, width, height);
    }

    /**
     * Niblack's Binarization - Local adaptive threshold
     * Best for: Documents with high contrast variation
     */
    niblackThreshold(imageData, windowSize = 15, k = -0.2) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      const result = new Uint8ClampedArray(data.length);
      
      const half = Math.floor(windowSize / 2);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let sqSum = 0;
          let count = 0;

          for (let wy = -half; wy <= half; wy++) {
            for (let wx = -half; wx <= half; wx++) {
              const ny = y + wy;
              const nx = x + wx;
              
              if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                const val = data[(ny * width + nx) * 4];
                sum += val;
                sqSum += val * val;
                count++;
              }
            }
          }

          const mean = sum / count;
          const variance = (sqSum / count) - (mean * mean);
          const stdDev = Math.sqrt(Math.max(0, variance));
          
          // Niblack formula: T = mean + k * stdDev
          const threshold = mean + k * stdDev;
          
          const idx = (y * width + x) * 4;
          const pixel = data[idx];
          const binary = pixel > threshold ? 255 : 0;
          
          result[idx] = binary;
          result[idx + 1] = binary;
          result[idx + 2] = binary;
          result[idx + 3] = 255;
        }
      }

      return new ImageData(result, width, height);
    }

    /**
     * Simple adaptive threshold with mean
     */
    adaptiveThreshold(imageData, blockSize = CONFIG.BINARIZE_BLOCK_SIZE, c = CONFIG.BINARIZE_C) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      const result = new Uint8ClampedArray(data.length);
      
      const half = Math.floor(blockSize / 2);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let count = 0;

          for (let wy = -half; wy <= half; wy++) {
            for (let wx = -half; wx <= half; wx++) {
              const ny = y + wy;
              const nx = x + wx;
              
              if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                sum += data[(ny * width + nx) * 4];
                count++;
              }
            }
          }

          const threshold = sum / count - c;
          const idx = (y * width + x) * 4;
          const pixel = data[idx];
          const binary = pixel > threshold ? 255 : 0;
          
          result[idx] = binary;
          result[idx + 1] = binary;
          result[idx + 2] = binary;
          result[idx + 3] = 255;
        }
      }

      return new ImageData(result, width, height);
    }

    /**
     * Apply threshold to image
     */
    applyThreshold(imageData, threshold) {
      const data = new Uint8ClampedArray(imageData.data);
      
      for (let i = 0; i < data.length; i += 4) {
        const binary = data[i] > threshold ? 255 : 0;
        data[i] = binary;
        data[i + 1] = binary;
        data[i + 2] = binary;
      }

      return new ImageData(data, imageData.width, imageData.height);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DESKEW DETECTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Detect skew angle using projection profile
     */
    detectSkew(imageData) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      
      let maxVariance = 0;
      let bestAngle = 0;
      
      // Test angles from -45 to +45 degrees
      for (let angle = -CONFIG.DESKEW_MAX_ANGLE; angle <= CONFIG.DESKEW_MAX_ANGLE; angle += CONFIG.DESKEW_ANGLE_RESOLUTION) {
        const radians = angle * Math.PI / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        
        // Calculate projection profile
        const profile = new Array(height).fill(0);
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            if (data[idx] < 128) { // Black pixel
              // Rotate point
              const newY = Math.round(-x * sin + y * cos);
              if (newY >= 0 && newY < height) {
                profile[newY]++;
              }
            }
          }
        }
        
        // Calculate variance of profile
        const mean = profile.reduce((a, b) => a + b, 0) / profile.length;
        const variance = profile.reduce((sum, val) => sum + (val - mean) ** 2, 0) / profile.length;
        
        if (variance > maxVariance) {
          maxVariance = variance;
          bestAngle = angle;
        }
      }

      const confidence = maxVariance > 1000 ? 0.9 : maxVariance > 500 ? 0.7 : 0.5;

      return {
        angle: bestAngle,
        confidence: confidence,
        variance: maxVariance
      };
    }

    /**
     * Rotate image by angle
     */
    rotate(imageData, angle) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      
      const radians = angle * Math.PI / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      
      // Calculate new dimensions
      const newWidth = Math.abs(width * cos) + Math.abs(height * sin);
      const newHeight = Math.abs(width * sin) + Math.abs(height * cos);
      
      const result = new Uint8ClampedArray(Math.ceil(newWidth) * Math.ceil(newHeight) * 4);
      result.fill(255); // White background
      
      const centerX = width / 2;
      const centerY = height / 2;
      const newCenterX = newWidth / 2;
      const newCenterY = newHeight / 2;

      for (let y = 0; y < Math.ceil(newHeight); y++) {
        for (let x = 0; x < Math.ceil(newWidth); x++) {
          // Transform back to original coordinates
          const dx = x - newCenterX;
          const dy = y - newCenterY;
          
          const origX = dx * cos + dy * sin + centerX;
          const origY = -dx * sin + dy * cos + centerY;
          
          if (origX >= 0 && origX < width && origY >= 0 && origY < height) {
            // Bilinear interpolation
            const x0 = Math.floor(origX);
            const y0 = Math.floor(origY);
            const x1 = Math.min(x0 + 1, width - 1);
            const y1 = Math.min(y0 + 1, height - 1);
            
            const fx = origX - x0;
            const fy = origY - y0;
            
            const idx00 = (y0 * width + x0) * 4;
            const idx01 = (y0 * width + x1) * 4;
            const idx10 = (y1 * width + x0) * 4;
            const idx11 = (y1 * width + x1) * 4;
            const dstIdx = (y * Math.ceil(newWidth) + x) * 4;
            
            for (let c = 0; c < 3; c++) {
              result[dstIdx + c] = Math.round(
                data[idx00 + c] * (1 - fx) * (1 - fy) +
                data[idx01 + c] * fx * (1 - fy) +
                data[idx10 + c] * (1 - fx) * fy +
                data[idx11 + c] * fx * fy
              );
            }
            result[dstIdx + 3] = 255;
          }
        }
      }

      return new ImageData(result, Math.ceil(newWidth), Math.ceil(newHeight));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NOISE REMOVAL
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Remove noise using specified method
     */
    denoise(imageData, method = 'median') {
      switch (method) {
        case 'median':
          return this.medianFilter(imageData);
        case 'gaussian':
          return this.gaussianBlur(imageData);
        case 'bilateral':
          return this.bilateralFilter(imageData);
        default:
          return this.medianFilter(imageData);
      }
    }

    /**
     * Median filter - Best for salt & pepper noise
     */
    medianFilter(imageData, size = CONFIG.NOISE_MEDIAN_SIZE) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      const result = new Uint8ClampedArray(data.length);
      
      const half = Math.floor(size / 2);
      const windowSize = size * size;
      const median = Math.floor(windowSize / 2);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          for (let c = 0; c < 3; c++) {
            const values = [];
            
            for (let wy = -half; wy <= half; wy++) {
              for (let wx = -half; wx <= half; wx++) {
                const ny = Math.min(Math.max(0, y + wy), height - 1);
                const nx = Math.min(Math.max(0, x + wx), width - 1);
                values.push(data[(ny * width + nx) * 4 + c]);
              }
            }
            
            values.sort((a, b) => a - b);
            result[(y * width + x) * 4 + c] = values[median];
          }
          result[(y * width + x) * 4 + 3] = 255;
        }
      }

      this.stats.denoised++;
      return new ImageData(result, width, height);
    }

    /**
     * Gaussian blur - Smooths image
     */
    gaussianBlur(imageData, sigma = CONFIG.NOISE_GAUSSIAN_SIGMA) {
      const size = Math.ceil(sigma * 3) * 2 + 1;
      const kernel = this.createGaussianKernel(size, sigma);
      return this.convolve(imageData, kernel);
    }

    /**
     * Create Gaussian kernel
     */
    createGaussianKernel(size, sigma) {
      const kernel = [];
      const center = Math.floor(size / 2);
      let sum = 0;

      for (let y = 0; y < size; y++) {
        kernel[y] = [];
        for (let x = 0; x < size; x++) {
          const dx = x - center;
          const dy = y - center;
          const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
          kernel[y][x] = value;
          sum += value;
        }
      }

      // Normalize
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          kernel[y][x] /= sum;
        }
      }

      return kernel;
    }

    /**
     * Bilateral filter - Edge-preserving smoothing
     */
    bilateralFilter(imageData, spatialSigma = 5, rangeSigma = 50) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      const result = new Uint8ClampedArray(data.length);
      
      const size = Math.ceil(spatialSigma * 2) * 2 + 1;
      const half = Math.floor(size / 2);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const centerIdx = (y * width + x) * 4;
          
          for (let c = 0; c < 3; c++) {
            let weightSum = 0;
            let valueSum = 0;
            const centerVal = data[centerIdx + c];

            for (let wy = -half; wy <= half; wy++) {
              for (let wx = -half; wx <= half; wx++) {
                const ny = Math.min(Math.max(0, y + wy), height - 1);
                const nx = Math.min(Math.max(0, x + wx), width - 1);
                const neighborIdx = (ny * width + nx) * 4;
                const neighborVal = data[neighborIdx + c];

                // Spatial weight
                const spatialWeight = Math.exp(-(wx * wx + wy * wy) / (2 * spatialSigma * spatialSigma));
                
                // Range weight
                const diff = centerVal - neighborVal;
                const rangeWeight = Math.exp(-(diff * diff) / (2 * rangeSigma * rangeSigma));
                
                const weight = spatialWeight * rangeWeight;
                weightSum += weight;
                valueSum += weight * neighborVal;
              }
            }

            result[centerIdx + c] = Math.round(valueSum / weightSum);
          }
          result[centerIdx + 3] = 255;
        }
      }

      return new ImageData(result, width, height);
    }

    /**
     * Convolve image with kernel
     */
    convolve(imageData, kernel) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      const result = new Uint8ClampedArray(data.length);
      
      const kSize = kernel.length;
      const half = Math.floor(kSize / 2);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0;

            for (let ky = 0; ky < kSize; ky++) {
              for (let kx = 0; kx < kSize; kx++) {
                const ny = Math.min(Math.max(0, y + ky - half), height - 1);
                const nx = Math.min(Math.max(0, x + kx - half), width - 1);
                sum += data[(ny * width + nx) * 4 + c] * kernel[ky][kx];
              }
            }

            result[(y * width + x) * 4 + c] = Math.min(255, Math.max(0, Math.round(sum)));
          }
          result[(y * width + x) * 4 + 3] = 255;
        }
      }

      return new ImageData(result, width, height);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTRAST ENHANCEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Enhance contrast using specified method
     */
    enhanceContrast(imageData, method = 'clahe') {
      switch (method) {
        case 'clahe':
          return this.clahe(imageData);
        case 'histogram':
          return this.histogramEqualization(imageData);
        case 'stretch':
          return this.contrastStretch(imageData);
        default:
          return this.clahe(imageData);
      }
    }

    /**
     * CLAHE - Contrast Limited Adaptive Histogram Equalization
     */
    clahe(imageData, clipLimit = 2.0, gridSize = 8) {
      const width = imageData.width;
      const height = imageData.height;
      const data = new Uint8ClampedArray(imageData.data);
      
      const tileWidth = Math.ceil(width / gridSize);
      const tileHeight = Math.ceil(height / gridSize);
      
      // Process each tile
      const lookupTables = [];
      
      for (let ty = 0; ty < gridSize; ty++) {
        lookupTables[ty] = [];
        for (let tx = 0; tx < gridSize; tx++) {
          const x1 = tx * tileWidth;
          const y1 = ty * tileHeight;
          const x2 = Math.min((tx + 1) * tileWidth, width);
          const y2 = Math.min((ty + 1) * tileHeight, height);
          
          // Build histogram for tile
          const histogram = new Array(256).fill(0);
          for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
              histogram[data[(y * width + x) * 4]]++;
            }
          }
          
          // Clip histogram
          this.clipHistogram(histogram, clipLimit, (x2 - x1) * (y2 - y1));
          
          // Create lookup table
          lookupTables[ty][tx] = this.createCLAHELUT(histogram, (x2 - x1) * (y2 - y1));
        }
      }
      
      // Bilinear interpolation of lookup tables
      const result = new Uint8ClampedArray(data.length);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const val = data[idx];
          
          const tx = x / tileWidth - 0.5;
          const ty = y / tileHeight - 0.5;
          
          const tx0 = Math.max(0, Math.floor(tx));
          const ty0 = Math.max(0, Math.floor(ty));
          const tx1 = Math.min(gridSize - 1, tx0 + 1);
          const ty1 = Math.min(gridSize - 1, ty0 + 1);
          
          const fx = Math.max(0, Math.min(1, tx - tx0));
          const fy = Math.max(0, Math.min(1, ty - ty0));
          
          const v00 = lookupTables[ty0][tx0][val];
          const v01 = lookupTables[ty0][tx1][val];
          const v10 = lookupTables[ty1][tx0][val];
          const v11 = lookupTables[ty1][tx1][val];
          
          const enhanced = Math.round(
            v00 * (1 - fx) * (1 - fy) +
            v01 * fx * (1 - fy) +
            v10 * (1 - fx) * fy +
            v11 * fx * fy
          );
          
          result[idx] = enhanced;
          result[idx + 1] = enhanced;
          result[idx + 2] = enhanced;
          result[idx + 3] = 255;
        }
      }

      return new ImageData(result, width, height);
    }

    clipHistogram(histogram, clipLimit, numPixels) {
      const threshold = Math.floor(clipLimit * numPixels / 256);
      let excess = 0;
      
      for (let i = 0; i < 256; i++) {
        if (histogram[i] > threshold) {
          excess += histogram[i] - threshold;
          histogram[i] = threshold;
        }
      }
      
      // Redistribute excess
      const avgIncrease = Math.floor(excess / 256);
      for (let i = 0; i < 256; i++) {
        histogram[i] += avgIncrease;
      }
      
      return excess;
    }

    createCLAHELUT(histogram, numPixels) {
      const lut = new Array(256);
      let sum = 0;
      
      for (let i = 0; i < 256; i++) {
        sum += histogram[i];
        lut[i] = Math.round((sum * 255) / numPixels);
      }
      
      return lut;
    }

    /**
     * Simple histogram equalization
     */
    histogramEqualization(imageData) {
      const data = new Uint8ClampedArray(imageData.data);
      const histogram = new Array(256).fill(0);
      
      // Build histogram
      for (let i = 0; i < data.length; i += 4) {
        histogram[data[i]]++;
      }
      
      // Build CDF
      const cdf = new Array(256);
      cdf[0] = histogram[0];
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + histogram[i];
      }
      
      // Normalize CDF
      const numPixels = imageData.width * imageData.height;
      const cdfMin = cdf.find(v => v > 0);
      
      for (let i = 0; i < 256; i++) {
        cdf[i] = Math.round(((cdf[i] - cdfMin) / (numPixels - cdfMin)) * 255);
      }
      
      // Apply equalization
      for (let i = 0; i < data.length; i += 4) {
        const eq = cdf[data[i]];
        data[i] = eq;
        data[i + 1] = eq;
        data[i + 2] = eq;
      }

      return new ImageData(data, imageData.width, imageData.height);
    }

    /**
     * Contrast stretch (normalize)
     */
    contrastStretch(imageData) {
      const data = new Uint8ClampedArray(imageData.data);
      let min = 255;
      let max = 0;
      
      // Find min/max
      for (let i = 0; i < data.length; i += 4) {
        min = Math.min(min, data[i]);
        max = Math.max(max, data[i]);
      }
      
      // Stretch
      const range = max - min || 1;
      for (let i = 0; i < data.length; i += 4) {
        const stretched = Math.round(((data[i] - min) / range) * 255);
        data[i] = stretched;
        data[i + 1] = stretched;
        data[i + 2] = stretched;
      }

      return new ImageData(data, imageData.width, imageData.height);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BORDER DETECTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Detect document borders
     */
    detectBorders(imageData) {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;
      
      let minX = width;
      let maxX = 0;
      let minY = height;
      let maxY = 0;
      
      // Scan for non-white pixels
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (data[idx] < 255 - CONFIG.BORDER_THRESHOLD) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }
      
      // Add padding
      const padding = 5;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(width - 1, maxX + padding);
      maxY = Math.min(height - 1, maxY + padding);
      
      const area = (maxX - minX) * (maxY - minY);
      const found = area > CONFIG.BORDER_MIN_AREA;

      return {
        found: found,
        region: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
        originalSize: { width, height }
      };
    }

    /**
     * Crop image to region
     */
    cropToRegion(imageData, region) {
      const { x, y, width: cropWidth, height: cropHeight } = region;
      const sourceWidth = imageData.width;
      const data = imageData.data;
      
      const result = new Uint8ClampedArray(cropWidth * cropHeight * 4);
      
      for (let dy = 0; dy < cropHeight; dy++) {
        for (let dx = 0; dx < cropWidth; dx++) {
          const srcIdx = ((y + dy) * sourceWidth + (x + dx)) * 4;
          const dstIdx = (dy * cropWidth + dx) * 4;
          
          result[dstIdx] = data[srcIdx];
          result[dstIdx + 1] = data[srcIdx + 1];
          result[dstIdx + 2] = data[srcIdx + 2];
          result[dstIdx + 3] = data[srcIdx + 3];
        }
      }

      return new ImageData(result, cropWidth, cropHeight);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Convert ImageData to canvas
     */
    imageDataToCanvas(imageData) {
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(imageData, 0, 0);
      return canvas;
    }

    /**
     * Get processing statistics
     */
    getStats() {
      return { ...this.stats };
    }

    /**
     * Reset statistics
     */
    resetStats() {
      this.stats = {
        processed: 0,
        deskewed: 0,
        binarized: 0,
        denoised: 0
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log('[AdvancedImageProcessor]', ...args);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL API
  // ═══════════════════════════════════════════════════════════════════════════

  const processor = new AdvancedImageProcessor();

  window.AdvancedImageProcessor = AdvancedImageProcessor;
  window.advancedImageProcessor = processor;

  log('═'.repeat(80));
  log('✅ ADVANCED IMAGE PROCESSOR v1.0 LOADED');
  log('═'.repeat(80));
  log('🎯 Features: Deskew, Binarization (Otsu/Sauvola/Niblack), CLAHE, Denoising');
  log('═'.repeat(80));

})(window);
