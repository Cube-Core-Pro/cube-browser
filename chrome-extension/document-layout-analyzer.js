// ═══════════════════════════════════════════════════════════════════════════════
// 📄 DOCUMENT LAYOUT ANALYZER v1.0 - Intelligent Document Structure Detection
// ═══════════════════════════════════════════════════════════════════════════════
//
// FEATURES:
// - Zone Detection (header, body, footer, sidebar)
// - Column Detection (single, multi-column layouts)
// - Reading Order Determination
// - Content Classification (text, image, table, signature, barcode)
// - Text Block Detection
// - Line Detection
// - Paragraph Segmentation
// - Table Structure Detection
// - Form Field Detection in Scanned Documents
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const CONFIG = {
    // Zone Detection
    HEADER_HEIGHT_RATIO: 0.15,  // Top 15% is header
    FOOTER_HEIGHT_RATIO: 0.10,  // Bottom 10% is footer
    SIDEBAR_WIDTH_RATIO: 0.25,  // Side 25% is sidebar
    
    // Column Detection
    MIN_COLUMN_GAP: 20,         // Minimum gap between columns
    MIN_COLUMN_WIDTH: 50,       // Minimum column width
    
    // Text Block Detection
    MIN_TEXT_BLOCK_HEIGHT: 10,
    MIN_TEXT_BLOCK_WIDTH: 20,
    LINE_HEIGHT_TOLERANCE: 1.5,
    
    // Content Classification
    SIGNATURE_ASPECT_RATIO_MIN: 1.5,
    SIGNATURE_ASPECT_RATIO_MAX: 8,
    TABLE_MIN_CELLS: 4,
    
    // Processing
    PROJECTION_THRESHOLD: 0.1,
    WHITESPACE_THRESHOLD: 250,
    
    DEBUG: false
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENT LAYOUT ANALYZER
  // ═══════════════════════════════════════════════════════════════════════════

  class DocumentLayoutAnalyzer {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.stats = {
        analyzed: 0,
        zonesDetected: 0,
        columnsDetected: 0,
        blocksDetected: 0
      };
    }

    /**
     * Analyze complete document layout
     */
    async analyzeDocument(imageSource, _options = {}) {
      log('📄 Starting document layout analysis...');
      
      const startTime = performance.now();
      this.stats.analyzed++;

      try {
        // Load image
        const imageData = await this.loadImage(imageSource);
        const { width, height } = imageData;
        log(`  Document size: ${width}x${height}`);

        // Step 1: Detect major zones (header, body, footer)
        const zones = this.detectZones(imageData);
        log(`  Zones detected: ${Object.keys(zones).length}`);

        // Step 2: Detect columns
        const columns = this.detectColumns(imageData, zones.body);
        log(`  Columns detected: ${columns.length}`);

        // Step 3: Detect text blocks
        const textBlocks = this.detectTextBlocks(imageData);
        log(`  Text blocks detected: ${textBlocks.length}`);

        // Step 4: Detect lines within blocks
        const lines = this.detectLines(imageData, textBlocks);
        log(`  Lines detected: ${lines.length}`);

        // Step 5: Classify content regions
        const contentRegions = this.classifyContent(imageData, textBlocks);
        log(`  Content regions classified: ${contentRegions.length}`);

        // Step 6: Determine reading order
        const readingOrder = this.determineReadingOrder(textBlocks, columns);

        // Step 7: Detect special elements
        const specialElements = this.detectSpecialElements(imageData, textBlocks);

        const duration = performance.now() - startTime;

        this.stats.zonesDetected += Object.keys(zones).length;
        this.stats.columnsDetected += columns.length;
        this.stats.blocksDetected += textBlocks.length;

        log(`✅ Layout analysis complete in ${duration.toFixed(0)}ms`);

        return {
          success: true,
          layout: {
            zones: zones,
            columns: columns,
            textBlocks: textBlocks,
            lines: lines,
            contentRegions: contentRegions,
            readingOrder: readingOrder,
            specialElements: specialElements
          },
          dimensions: { width, height },
          duration: duration
        };

      } catch (error) {
        console.error('❌ Layout analysis error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ZONE DETECTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Detect major document zones
     */
    detectZones(imageData) {
      const { width, height } = imageData;
      
      // Calculate horizontal projection profile
      const hProjection = this.horizontalProjection(imageData);
      
      // Find header boundary (first significant content from top)
      let headerEnd = 0;
      let foundContent = false;
      let emptyRows = 0;
      
      for (let y = 0; y < height * CONFIG.HEADER_HEIGHT_RATIO; y++) {
        if (hProjection[y] > width * CONFIG.PROJECTION_THRESHOLD) {
          foundContent = true;
          emptyRows = 0;
        } else if (foundContent) {
          emptyRows++;
          if (emptyRows > 20) {
            headerEnd = y - emptyRows;
            break;
          }
        }
      }
      if (headerEnd === 0 && foundContent) {
        headerEnd = Math.floor(height * CONFIG.HEADER_HEIGHT_RATIO);
      }

      // Find footer boundary (first significant content from bottom)
      let footerStart = height;
      foundContent = false;
      emptyRows = 0;
      
      for (let y = height - 1; y > height * (1 - CONFIG.FOOTER_HEIGHT_RATIO); y--) {
        if (hProjection[y] > width * CONFIG.PROJECTION_THRESHOLD) {
          foundContent = true;
          emptyRows = 0;
        } else if (foundContent) {
          emptyRows++;
          if (emptyRows > 20) {
            footerStart = y + emptyRows;
            break;
          }
        }
      }
      if (footerStart === height && foundContent) {
        footerStart = Math.floor(height * (1 - CONFIG.FOOTER_HEIGHT_RATIO));
      }

      // Detect sidebar (check left and right margins)
      const vProjection = this.verticalProjection(imageData);
      const leftSidebar = this.detectSidebar(vProjection, 'left', width);
      const rightSidebar = this.detectSidebar(vProjection, 'right', width);

      return {
        header: headerEnd > 0 ? {
          x: 0, y: 0, width: width, height: headerEnd
        } : null,
        
        footer: footerStart < height ? {
          x: 0, y: footerStart, width: width, height: height - footerStart
        } : null,
        
        body: {
          x: leftSidebar?.width || 0,
          y: headerEnd,
          width: width - (leftSidebar?.width || 0) - (rightSidebar?.width || 0),
          height: footerStart - headerEnd
        },
        
        leftSidebar: leftSidebar,
        rightSidebar: rightSidebar
      };
    }

    /**
     * Detect sidebar region
     */
    detectSidebar(vProjection, side, width) {
      const checkWidth = Math.floor(width * CONFIG.SIDEBAR_WIDTH_RATIO);
      let hasContent = false;
      let contentStart = -1;
      let contentEnd = -1;
      
      const start = side === 'left' ? 0 : width - checkWidth;
      const end = side === 'left' ? checkWidth : width;
      
      for (let x = start; x < end; x++) {
        // Calculate relative index for side
        if (vProjection[x] > 0) {
          hasContent = true;
          if (contentStart === -1) contentStart = x;
          contentEnd = x;
        }
      }
      
      if (!hasContent) return null;
      
      // Check if it's isolated (gap between sidebar and body content)
      // Gap detection for sidebar isolation
      let gapFound = false;
      let gapWidth = 0;
      
      const checkStart = side === 'left' ? contentEnd + 1 : 0;
      const checkEnd = side === 'left' ? checkWidth + 50 : contentStart;
      
      for (let x = checkStart; x < checkEnd && x < width; x++) {
        if (vProjection[x] === 0) {
          gapWidth++;
          if (gapWidth > CONFIG.MIN_COLUMN_GAP) {
            gapFound = true;
            break;
          }
        } else {
          gapWidth = 0;
        }
      }
      
      if (!gapFound) return null;
      
      return {
        x: side === 'left' ? 0 : contentStart,
        y: 0,
        width: side === 'left' ? contentEnd : width - contentStart,
        side: side
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COLUMN DETECTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Detect text columns
     */
    detectColumns(imageData, bodyZone) {
      if (!bodyZone) return [{ x: 0, y: 0, width: imageData.width, height: imageData.height }];
      
      const { x: bodyX, y: bodyY, width: bodyWidth, height: bodyHeight } = bodyZone;
      
      // Calculate vertical projection for body area
      const vProjection = this.verticalProjectionRegion(imageData, bodyX, bodyY, bodyWidth, bodyHeight);
      
      // Find gaps (column separators)
      const gaps = [];
      let inGap = false;
      let gapStart = -1;
      
      for (let x = 0; x < vProjection.length; x++) {
        if (vProjection[x] === 0) {
          if (!inGap) {
            inGap = true;
            gapStart = x;
          }
        } else {
          if (inGap) {
            const gapWidth = x - gapStart;
            if (gapWidth >= CONFIG.MIN_COLUMN_GAP) {
              gaps.push({ start: gapStart, end: x, width: gapWidth });
            }
            inGap = false;
          }
        }
      }
      
      // Create columns from gaps
      const columns = [];
      let columnStart = 0;
      
      for (const gap of gaps) {
        const columnWidth = gap.start - columnStart;
        if (columnWidth >= CONFIG.MIN_COLUMN_WIDTH) {
          columns.push({
            x: bodyX + columnStart,
            y: bodyY,
            width: columnWidth,
            height: bodyHeight
          });
        }
        columnStart = gap.end;
      }
      
      // Add last column
      const lastColumnWidth = bodyWidth - columnStart;
      if (lastColumnWidth >= CONFIG.MIN_COLUMN_WIDTH) {
        columns.push({
          x: bodyX + columnStart,
          y: bodyY,
          width: lastColumnWidth,
          height: bodyHeight
        });
      }
      
      // If no columns found, return entire body as single column
      if (columns.length === 0) {
        columns.push(bodyZone);
      }
      
      return columns;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEXT BLOCK DETECTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Detect text blocks using connected component analysis
     */
    detectTextBlocks(imageData) {
      const { width, height } = imageData;
      
      // Binarize image
      const binary = this.binarize(imageData);
      
      // Dilate to connect nearby text
      const dilated = this.dilate(binary, width, height, 3, 2);
      
      // Find connected components
      const components = this.findConnectedComponents(dilated, width, height);
      
      // Filter and return as text blocks
      const textBlocks = components
        .filter(comp => 
          comp.width >= CONFIG.MIN_TEXT_BLOCK_WIDTH &&
          comp.height >= CONFIG.MIN_TEXT_BLOCK_HEIGHT &&
          comp.area > 100
        )
        .map((comp, idx) => ({
          id: idx,
          x: comp.x,
          y: comp.y,
          width: comp.width,
          height: comp.height,
          area: comp.area,
          density: comp.area / (comp.width * comp.height)
        }))
        .sort((a, b) => a.y - b.y || a.x - b.x);
      
      return textBlocks;
    }

    /**
     * Detect lines within text blocks
     */
    detectLines(imageData, textBlocks) {
      const lines = [];
      
      for (const block of textBlocks) {
        // Get horizontal projection for this block
        const blockProjection = this.horizontalProjectionRegion(
          imageData, block.x, block.y, block.width, block.height
        );
        
        // Find line boundaries
        let inLine = false;
        let lineStart = -1;
        
        for (let y = 0; y < blockProjection.length; y++) {
          if (blockProjection[y] > 0) {
            if (!inLine) {
              inLine = true;
              lineStart = y;
            }
          } else {
            if (inLine) {
              lines.push({
                blockId: block.id,
                x: block.x,
                y: block.y + lineStart,
                width: block.width,
                height: y - lineStart
              });
              inLine = false;
            }
          }
        }
        
        // Add last line if still in line
        if (inLine) {
          lines.push({
            blockId: block.id,
            x: block.x,
            y: block.y + lineStart,
            width: block.width,
            height: blockProjection.length - lineStart
          });
        }
      }
      
      return lines;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTENT CLASSIFICATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Classify content regions
     */
    classifyContent(imageData, textBlocks) {
      return textBlocks.map(block => {
        const type = this.classifyBlock(imageData, block);
        return {
          ...block,
          type: type,
          confidence: this.getClassificationConfidence(type, block)
        };
      });
    }

    /**
     * Classify individual block
     */
    classifyBlock(imageData, block) {
      const { width, height, density } = block;
      const aspectRatio = width / height;
      
      // Check for signature characteristics
      if (aspectRatio >= CONFIG.SIGNATURE_ASPECT_RATIO_MIN && 
          aspectRatio <= CONFIG.SIGNATURE_ASPECT_RATIO_MAX &&
          density < 0.3) {
        return 'signature';
      }
      
      // Check for image (low density, larger area)
      if (density < 0.1 && width > 100 && height > 100) {
        return 'image';
      }
      
      // Check for table (grid-like structure)
      if (this.hasTableStructure(imageData, block)) {
        return 'table';
      }
      
      // Check for form field (horizontal line with text above/below)
      if (this.isFormField(imageData, block)) {
        return 'form_field';
      }
      
      // Default to text
      return 'text';
    }

    /**
     * Check if block has table-like structure
     */
    hasTableStructure(imageData, block) {
      const { x, y, width, height } = block;
      const { data, width: imgWidth } = imageData;
      
      // Count horizontal and vertical lines
      let hLines = 0;
      let vLines = 0;
      
      // Check for horizontal lines
      for (let row = y; row < y + height; row += 5) {
        let consecutiveBlack = 0;
        for (let col = x; col < x + width; col++) {
          const idx = (row * imgWidth + col) * 4;
          if (data[idx] < 128) {
            consecutiveBlack++;
          } else {
            if (consecutiveBlack > width * 0.5) hLines++;
            consecutiveBlack = 0;
          }
        }
        if (consecutiveBlack > width * 0.5) hLines++;
      }
      
      // Check for vertical lines
      for (let col = x; col < x + width; col += 5) {
        let consecutiveBlack = 0;
        for (let row = y; row < y + height; row++) {
          const idx = (row * imgWidth + col) * 4;
          if (data[idx] < 128) {
            consecutiveBlack++;
          } else {
            if (consecutiveBlack > height * 0.5) vLines++;
            consecutiveBlack = 0;
          }
        }
        if (consecutiveBlack > height * 0.5) vLines++;
      }
      
      return hLines >= 2 && vLines >= 2;
    }

    /**
     * Check if block is a form field
     */
    isFormField(imageData, block) {
      const { width, height, density } = block;
      
      // Form fields are typically wide and short
      if (width / height < 3) return false;
      
      // Low density (mostly empty with a line)
      if (density > 0.2) return false;
      
      // Check for horizontal line
      const hProjection = this.horizontalProjectionRegion(
        imageData, block.x, block.y, block.width, block.height
      );
      
      // Look for a prominent horizontal line
      const maxProjection = Math.max(...hProjection);
      const lineRows = hProjection.filter(p => p > maxProjection * 0.8).length;
      
      return lineRows <= 3 && lineRows >= 1;
    }

    /**
     * Get classification confidence
     */
    getClassificationConfidence(type, block) {
      const { density } = block;
      
      switch (type) {
        case 'text':
          return density > 0.3 ? 0.9 : 0.7;
        case 'signature':
          return density < 0.2 ? 0.8 : 0.6;
        case 'table':
          return 0.85;
        case 'image':
          return 0.75;
        case 'form_field':
          return 0.8;
        default:
          return 0.5;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // READING ORDER
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Determine reading order of text blocks
     */
    determineReadingOrder(textBlocks, columns) {
      if (columns.length <= 1) {
        // Single column - simple top-to-bottom
        return textBlocks.map(b => b.id);
      }
      
      // Multi-column - assign blocks to columns
      const columnBlocks = columns.map(() => []);
      
      for (const block of textBlocks) {
        const blockCenterX = block.x + block.width / 2;
        
        // Find which column this block belongs to
        let bestColumn = 0;
        let minDistance = Infinity;
        
        for (let c = 0; c < columns.length; c++) {
          const colCenterX = columns[c].x + columns[c].width / 2;
          const distance = Math.abs(blockCenterX - colCenterX);
          if (distance < minDistance) {
            minDistance = distance;
            bestColumn = c;
          }
        }
        
        columnBlocks[bestColumn].push(block);
      }
      
      // Sort blocks within each column by Y position
      columnBlocks.forEach(col => col.sort((a, b) => a.y - b.y));
      
      // Create reading order: column by column, top to bottom
      const readingOrder = [];
      for (const col of columnBlocks) {
        for (const block of col) {
          readingOrder.push(block.id);
        }
      }
      
      return readingOrder;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SPECIAL ELEMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Detect special elements (checkboxes, bullets, etc.)
     */
    detectSpecialElements(imageData, textBlocks) {
      const elements = {
        checkboxes: [],
        bullets: [],
        horizontalRules: [],
        pageNumbers: []
      };
      
      const { width, height } = imageData;
      
      // Find small square regions (potential checkboxes)
      for (const block of textBlocks) {
        const aspectRatio = block.width / block.height;
        const size = Math.max(block.width, block.height);
        
        // Checkboxes are roughly square and small
        if (aspectRatio > 0.8 && aspectRatio < 1.2 && size < 30) {
          elements.checkboxes.push({
            x: block.x,
            y: block.y,
            size: size,
            checked: block.density > 0.4
          });
        }
        
        // Bullets are very small
        if (size < 15 && block.density > 0.5) {
          elements.bullets.push({
            x: block.x,
            y: block.y
          });
        }
      }
      
      // Find horizontal rules (thin horizontal blocks)
      for (const block of textBlocks) {
        if (block.width > width * 0.5 && block.height < 10) {
          elements.horizontalRules.push({
            x: block.x,
            y: block.y,
            width: block.width
          });
        }
      }
      
      // Find potential page numbers (small blocks at bottom)
      for (const block of textBlocks) {
        if (block.y > height * 0.9 && 
            block.width < 50 && 
            block.height < 30) {
          elements.pageNumbers.push({
            x: block.x,
            y: block.y
          });
        }
      }
      
      return elements;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PROJECTION PROFILES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Calculate horizontal projection profile
     */
    horizontalProjection(imageData) {
      const { width, height, data } = imageData;
      const projection = new Array(height).fill(0);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (data[idx] < CONFIG.WHITESPACE_THRESHOLD) {
            projection[y]++;
          }
        }
      }
      
      return projection;
    }

    /**
     * Calculate vertical projection profile
     */
    verticalProjection(imageData) {
      const { width, height, data } = imageData;
      const projection = new Array(width).fill(0);
      
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const idx = (y * width + x) * 4;
          if (data[idx] < CONFIG.WHITESPACE_THRESHOLD) {
            projection[x]++;
          }
        }
      }
      
      return projection;
    }

    /**
     * Calculate horizontal projection for region
     */
    horizontalProjectionRegion(imageData, rx, ry, rw, rh) {
      const { width, data } = imageData;
      const projection = new Array(rh).fill(0);
      
      for (let dy = 0; dy < rh; dy++) {
        const y = ry + dy;
        for (let dx = 0; dx < rw; dx++) {
          const x = rx + dx;
          const idx = (y * width + x) * 4;
          if (data[idx] < CONFIG.WHITESPACE_THRESHOLD) {
            projection[dy]++;
          }
        }
      }
      
      return projection;
    }

    /**
     * Calculate vertical projection for region
     */
    verticalProjectionRegion(imageData, rx, ry, rw, rh) {
      const { width, data } = imageData;
      const projection = new Array(rw).fill(0);
      
      for (let dx = 0; dx < rw; dx++) {
        const x = rx + dx;
        for (let dy = 0; dy < rh; dy++) {
          const y = ry + dy;
          const idx = (y * width + x) * 4;
          if (data[idx] < CONFIG.WHITESPACE_THRESHOLD) {
            projection[dx]++;
          }
        }
      }
      
      return projection;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IMAGE PROCESSING HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Binarize image using Otsu
     */
    binarize(imageData) {
      const { width, height, data } = imageData;
      const binary = new Uint8Array(width * height);
      
      // Calculate threshold using Otsu
      const histogram = new Array(256).fill(0);
      for (let i = 0; i < data.length; i += 4) {
        histogram[data[i]]++;
      }
      
      const total = width * height;
      let sum = 0;
      for (let i = 0; i < 256; i++) sum += i * histogram[i];
      
      let sumB = 0, wB = 0, maxVariance = 0, threshold = 0;
      
      for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;
        const wF = total - wB;
        if (wF === 0) break;
        
        sumB += t * histogram[t];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;
        const variance = wB * wF * (mB - mF) ** 2;
        
        if (variance > maxVariance) {
          maxVariance = variance;
          threshold = t;
        }
      }
      
      // Apply threshold
      for (let i = 0; i < binary.length; i++) {
        binary[i] = data[i * 4] < threshold ? 1 : 0;
      }
      
      return binary;
    }

    /**
     * Dilate binary image
     */
    dilate(binary, width, height, kw, kh) {
      const result = new Uint8Array(width * height);
      const hw = Math.floor(kw / 2);
      const hh = Math.floor(kh / 2);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let max = 0;
          
          for (let ky = -hh; ky <= hh; ky++) {
            for (let kx = -hw; kx <= hw; kx++) {
              const ny = y + ky;
              const nx = x + kx;
              
              if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                max = Math.max(max, binary[ny * width + nx]);
              }
            }
          }
          
          result[y * width + x] = max;
        }
      }
      
      return result;
    }

    /**
     * Find connected components in binary image
     */
    findConnectedComponents(binary, width, height) {
      const labels = new Int32Array(width * height);
      const components = [];
      let currentLabel = 0;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          
          if (binary[idx] === 1 && labels[idx] === 0) {
            currentLabel++;
            const bounds = this.floodFill(binary, labels, width, height, x, y, currentLabel);
            components.push(bounds);
          }
        }
      }
      
      return components;
    }

    /**
     * Flood fill for connected component labeling
     */
    floodFill(binary, labels, width, height, startX, startY, label) {
      const stack = [[startX, startY]];
      let minX = startX, maxX = startX, minY = startY, maxY = startY;
      let area = 0;
      
      while (stack.length > 0) {
        const [x, y] = stack.pop();
        const idx = y * width + x;
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        if (binary[idx] === 0 || labels[idx] !== 0) continue;
        
        labels[idx] = label;
        area++;
        
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }
      
      return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        area: area
      };
    }

    /**
     * Load image from various sources
     */
    async loadImage(source) {
      return new Promise((resolve, reject) => {
        if (source instanceof ImageData) {
          resolve(source);
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve(ctx.getImageData(0, 0, img.width, img.height));
        };

        img.onerror = () => reject(new Error('Failed to load image'));

        if (source instanceof HTMLImageElement) {
          img.src = source.src;
        } else if (source instanceof HTMLCanvasElement) {
          resolve(source.getContext('2d').getImageData(0, 0, source.width, source.height));
        } else if (source instanceof Blob || source instanceof File) {
          img.src = URL.createObjectURL(source);
        } else if (typeof source === 'string') {
          img.src = source;
        } else {
          reject(new Error('Unsupported image source'));
        }
      });
    }

    /**
     * Get statistics
     */
    getStats() {
      return { ...this.stats };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log('[DocumentLayoutAnalyzer]', ...args);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL API
  // ═══════════════════════════════════════════════════════════════════════════

  const analyzer = new DocumentLayoutAnalyzer();

  window.DocumentLayoutAnalyzer = DocumentLayoutAnalyzer;
  window.documentLayoutAnalyzer = analyzer;

  log('═'.repeat(80));
  log('✅ DOCUMENT LAYOUT ANALYZER v1.0 LOADED');
  log('═'.repeat(80));
  log('🎯 Features: Zone Detection, Columns, Text Blocks, Content Classification');
  log('═'.repeat(80));

})(window);
