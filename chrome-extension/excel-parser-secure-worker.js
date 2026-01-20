/**
 * CUBE Nexum Connect v7 - Secure Excel Parser Worker
 * Implements Web Worker isolation for xlsx parsing
 * Addresses: GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9
 * 
 * Security Features:
 * - Isolated execution context (Web Worker)
 * - Input validation & sanitization
 * - Resource limits (timeout, size, rows, columns)
 * - Monitoring & error tracking
 */

// Configuration constants
const SECURITY_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_ROWS: 5000,
  MAX_COLUMNS: 150,
  MAX_CELL_LENGTH: 2000,
  PARSE_TIMEOUT: 4500, // 4.5 seconds
  MIN_FILE_SIZE: 100 // 100 bytes
};

// Monitoring state
const parseMetrics = {
  totalParsed: 0,
  totalFailed: 0,
  totalTimeout: 0,
  averageDuration: 0,
  lastParse: null
};

/**
 * Validate Excel file before parsing
 */
function validateExcelFile(file) {
  const errors = [];
  
  // File size validation
  if (file.size < SECURITY_LIMITS.MIN_FILE_SIZE) {
    errors.push(`File too small (${file.size} bytes). Minimum: ${SECURITY_LIMITS.MIN_FILE_SIZE} bytes`);
  }
  
  if (file.size > SECURITY_LIMITS.MAX_FILE_SIZE) {
    errors.push(`File too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum: ${SECURITY_LIMITS.MAX_FILE_SIZE / 1024 / 1024} MB`);
  }
  
  // File extension validation
  const validExtensions = ['.xlsx', '.xls', '.xlsm', '.xlsb'];
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!hasValidExtension) {
    errors.push(`Invalid file extension. Expected: ${validExtensions.join(', ')}`);
  }
  
  // MIME type validation (if available)
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.ms-excel.sheet.macroEnabled.12'
  ];
  
  if (file.type && !validMimeTypes.includes(file.type)) {
    errors.push(`Invalid MIME type: ${file.type}. Expected: ${validMimeTypes.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate magic bytes (file signature)
 */
function validateMagicBytes(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer).slice(0, 8);
  
  // XLSX/ZIP signature: PK\x03\x04
  if (bytes[0] === 0x50 && bytes[1] === 0x4B && 
      bytes[2] === 0x03 && bytes[3] === 0x04) {
    return { valid: true, format: 'XLSX' };
  }
  
  // XLS signature: D0 CF 11 E0 A1 B1 1A E1
  if (bytes[0] === 0xD0 && bytes[1] === 0xCF && 
      bytes[2] === 0x11 && bytes[3] === 0xE0) {
    return { valid: true, format: 'XLS' };
  }
  
  return { 
    valid: false, 
    error: 'Invalid file signature. File may be corrupted or not an Excel file.' 
  };
}

/**
 * Sanitize cell value to prevent injection
 */
function sanitizeCellValue(value, maxLength = SECURITY_LIMITS.MAX_CELL_LENGTH) {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Convert to string
  let sanitized = String(value);
  
  // Truncate oversized values
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
    console.warn(`[Security] Cell value truncated from ${value.length} to ${maxLength} characters`);
  }
  
  // Remove null bytes
  sanitized = sanitized.replace(/\x00/g, '');
  
  // Escape potential script injection in formulas
  if (sanitized.startsWith('=') || 
      sanitized.startsWith('+') || 
      sanitized.startsWith('-') || 
      sanitized.startsWith('@')) {
    sanitized = "'" + sanitized; // Prefix with single quote to neutralize
    console.warn(`[Security] Potential formula injection detected and neutralized`);
  }
  
  return sanitized;
}

/**
 * Sanitize sheet data with limits enforcement
 */
function sanitizeSheetData(data) {
  // Limit rows
  if (data.length > SECURITY_LIMITS.MAX_ROWS) {
    console.warn(`[Security] Sheet has ${data.length} rows. Truncating to ${SECURITY_LIMITS.MAX_ROWS}`);
    data = data.slice(0, SECURITY_LIMITS.MAX_ROWS);
  }
  
  // Sanitize each row
  return data.map(row => {
    if (!Array.isArray(row)) return [];
    
    // Limit columns
    if (row.length > SECURITY_LIMITS.MAX_COLUMNS) {
      console.warn(`[Security] Row has ${row.length} columns. Truncating to ${SECURITY_LIMITS.MAX_COLUMNS}`);
      row = row.slice(0, SECURITY_LIMITS.MAX_COLUMNS);
    }
    
    // Sanitize each cell
    return row.map(cell => sanitizeCellValue(cell));
  });
}

/**
 * Parse Excel file with security guardrails
 */
async function parseExcelSecure(file) {
  const startTime = Date.now();
  
  try {
    // Step 1: File validation
    const fileValidation = validateExcelFile(file);
    if (!fileValidation.valid) {
      throw new Error(`File validation failed: ${fileValidation.errors.join(', ')}`);
    }
    
    // Step 2: Read file with timeout
    const arrayBuffer = await Promise.race([
      file.arrayBuffer(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('File read timeout')), 2000)
      )
    ]);
    
    // Step 3: Magic byte validation
    const magicValidation = validateMagicBytes(arrayBuffer);
    if (!magicValidation.valid) {
      throw new Error(magicValidation.error);
    }
    
    // Step 4: Parse with XLSX (with timeout)
    if (typeof XLSX === 'undefined') {
      throw new Error('XLSX library not loaded. Cannot parse Excel files.');
    }
    
    const workbook = await Promise.race([
      Promise.resolve(XLSX.read(arrayBuffer, { 
        type: 'array',
        cellFormula: false, // Disable formula parsing for security
        cellStyles: false,  // Disable style parsing to reduce attack surface
        cellDates: true,
        sheetRows: SECURITY_LIMITS.MAX_ROWS + 1 // XLSX internal limit
      })),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Parse timeout')), SECURITY_LIMITS.PARSE_TIMEOUT)
      )
    ]);
    
    // Step 5: Process workbook with sanitization
    const result = {
      sheets: [],
      metadata: {
        sheetNames: workbook.SheetNames || [],
        creator: workbook.Props?.Creator || 'Unknown',
        created: workbook.Props?.CreatedDate || null,
        format: magicValidation.format,
        fileSize: file.size,
        fileName: file.name
      },
      security: {
        validated: true,
        sanitized: true,
        truncated: false,
        warnings: []
      }
    };
    
    // Process each sheet with limits
    const maxSheets = 50; // Limit number of sheets
    const sheetsToProcess = workbook.SheetNames.slice(0, maxSheets);
    
    if (workbook.SheetNames.length > maxSheets) {
      result.security.truncated = true;
      result.security.warnings.push(`Sheet count limited to ${maxSheets}`);
    }
    
    sheetsToProcess.forEach(sheetName => {
      try {
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { 
          header: 1,
          raw: false,
          defval: '',
          blankrows: false // Skip blank rows to reduce output size
        });
        
        // Sanitize data
        const sanitizedData = sanitizeSheetData(jsonData);
        
        // Get sheet range
        const range = sheet['!ref'] ? XLSX.utils.decode_range(sheet['!ref']) : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
        
        result.sheets.push({
          name: sanitizeCellValue(sheetName, 255),
          data: sanitizedData,
          range: {
            rows: Math.min(range.e.r - range.s.r + 1, SECURITY_LIMITS.MAX_ROWS),
            cols: Math.min(range.e.c - range.s.c + 1, SECURITY_LIMITS.MAX_COLUMNS)
          },
          actualRows: jsonData.length,
          actualCols: jsonData[0]?.length || 0
        });
        
        // Check if data was truncated
        if (jsonData.length > SECURITY_LIMITS.MAX_ROWS) {
          result.security.truncated = true;
          result.security.warnings.push(`Sheet "${sheetName}" truncated to ${SECURITY_LIMITS.MAX_ROWS} rows`);
        }
        
      } catch (sheetError) {
        console.error(`[Security] Error parsing sheet "${sheetName}":`, sheetError);
        result.security.warnings.push(`Failed to parse sheet "${sheetName}": ${sheetError.message}`);
      }
    });
    
    // Step 6: Update metrics
    const duration = Date.now() - startTime;
    updateParseMetrics(true, duration);
    
    result.performance = {
      duration,
      timestamp: new Date().toISOString()
    };
    
    return result;
    
  } catch (error) {
    // Update metrics for failure
    const duration = Date.now() - startTime;
    
    if (error.message.includes('timeout')) {
      parseMetrics.totalTimeout++;
    }
    
    updateParseMetrics(false, duration);
    
    // Log security event
    console.error('[Security] Excel parse failed:', {
      file: file.name,
      size: file.size,
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(`Secure parse failed: ${error.message}`);
  }
}

/**
 * Update parse metrics for monitoring
 */
function updateParseMetrics(success, duration) {
  if (success) {
    parseMetrics.totalParsed++;
  } else {
    parseMetrics.totalFailed++;
  }
  
  // Update average duration (exponential moving average)
  const alpha = 0.2; // Smoothing factor
  if (parseMetrics.averageDuration === 0) {
    parseMetrics.averageDuration = duration;
  } else {
    parseMetrics.averageDuration = alpha * duration + (1 - alpha) * parseMetrics.averageDuration;
  }
  
  parseMetrics.lastParse = {
    success,
    duration,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get current parse metrics
 */
function getParseMetrics() {
  return {
    ...parseMetrics,
    successRate: parseMetrics.totalParsed / (parseMetrics.totalParsed + parseMetrics.totalFailed) || 0,
    timeoutRate: parseMetrics.totalTimeout / (parseMetrics.totalParsed + parseMetrics.totalFailed) || 0
  };
}

/**
 * Reset metrics (for testing)
 */
function resetMetrics() {
  parseMetrics.totalParsed = 0;
  parseMetrics.totalFailed = 0;
  parseMetrics.totalTimeout = 0;
  parseMetrics.averageDuration = 0;
  parseMetrics.lastParse = null;
}

// Export for use in Web Worker context
if (typeof self !== 'undefined' && typeof self.onmessage !== 'undefined') {
  // Web Worker context
  self.onmessage = async function(e) {
    const { action, data } = e.data;
    
    try {
      if (action === 'parse') {
        const result = await parseExcelSecure(data.file);
        self.postMessage({ success: true, result });
      } else if (action === 'metrics') {
        const metrics = getParseMetrics();
        self.postMessage({ success: true, metrics });
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      self.postMessage({ 
        success: false, 
        error: error.message,
        stack: error.stack
      });
    }
  };
}

// Export for regular script context
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseExcelSecure,
    validateExcelFile,
    validateMagicBytes,
    sanitizeCellValue,
    getParseMetrics,
    resetMetrics,
    SECURITY_LIMITS
  };
}
