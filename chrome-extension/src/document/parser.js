// ═══════════════════════════════════════════════════════════════════════════
// CUBE Chrome Extension - Document Parser
// ═══════════════════════════════════════════════════════════════════════════
// PDF, Excel, CSV parsing for Chrome Extension
// Note: Requires SheetJS (xlsx) and PDF.js to be loaded

/**
 * Parses Excel file (XLSX/XLS)
 * Requires SheetJS library: https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js
 * @param {File|Blob|ArrayBuffer} file - Excel file
 * @returns {Promise<Object>} - Parsed data
 */
async function parseExcel(file) {
  try {
    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS library not loaded');
    }

    let data;
    if (file instanceof ArrayBuffer) {
      data = file;
    } else {
      data = await file.arrayBuffer();
    }

    const workbook = XLSX.read(data, { type: 'array' });
    const sheets = {};
    const tables = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length === 0) continue;

      const headers = jsonData[0].map(h => String(h || ''));
      const rows = jsonData.slice(1);

      const table = {
        sheetName,
        headers,
        rows,
        rowCount: rows.length,
        columnCount: headers.length
      };

      sheets[sheetName] = table;
      tables.push(table);
    }

    // Convert to text
    let fullText = '';
    for (const table of tables) {
      fullText += `Sheet: ${table.sheetName}\n`;
      fullText += table.headers.join('\t') + '\n';
      for (const row of table.rows) {
        fullText += row.join('\t') + '\n';
      }
      fullText += '\n';
    }

    return {
      success: true,
      format: 'xlsx',
      text: fullText.trim(),
      sheets,
      tables,
      sheetNames: workbook.SheetNames
    };
  } catch (error) {
    return {
      success: false,
      format: 'xlsx',
      error: error.message
    };
  }
}

/**
 * Parses CSV file
 * @param {File|Blob|string} file - CSV file or text
 * @returns {Promise<Object>} - Parsed data
 */
async function parseCSV(file) {
  try {
    let text;
    if (typeof file === 'string') {
      text = file;
    } else {
      text = await file.text();
    }

    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }

    // Simple CSV parser (handles basic cases)
    const rows = lines.map(line => {
      const cells = [];
      let cell = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(cell.trim());
          cell = '';
        } else {
          cell += char;
        }
      }
      cells.push(cell.trim());
      return cells;
    });

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const table = {
      sheetName: 'CSV',
      headers,
      rows: dataRows,
      rowCount: dataRows.length,
      columnCount: headers.length
    };

    const fullText = rows.map(row => row.join(',')).join('\n');

    return {
      success: true,
      format: 'csv',
      text: fullText,
      table,
      headers,
      rows: dataRows
    };
  } catch (error) {
    return {
      success: false,
      format: 'csv',
      error: error.message
    };
  }
}

/**
 * Parses PDF file (basic text extraction)
 * Requires PDF.js library
 * @param {File|Blob|ArrayBuffer} file - PDF file
 * @returns {Promise<Object>} - Parsed data
 */
async function parsePDF(file) {
  try {
    // Check if PDF.js is loaded
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js library not loaded');
    }

    let data;
    if (file instanceof ArrayBuffer) {
      data = new Uint8Array(file);
    } else {
      const buffer = await file.arrayBuffer();
      data = new Uint8Array(buffer);
    }

    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    const pages = [];
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .trim();

      pages.push({
        pageNumber: i,
        text: pageText
      });

      fullText += pageText + '\n\n';
    }

    return {
      success: true,
      format: 'pdf',
      text: fullText.trim(),
      pages,
      pageCount: pdf.numPages
    };
  } catch (error) {
    return {
      success: false,
      format: 'pdf',
      error: error.message
    };
  }
}

/**
 * Parses JSON file
 * @param {File|Blob|string} file - JSON file or text
 * @returns {Promise<Object>} - Parsed data
 */
async function parseJSON(file) {
  try {
    let text;
    if (typeof file === 'string') {
      text = file;
    } else {
      text = await file.text();
    }

    const json = JSON.parse(text);
    const prettyText = JSON.stringify(json, null, 2);

    return {
      success: true,
      format: 'json',
      text: prettyText,
      data: json
    };
  } catch (error) {
    return {
      success: false,
      format: 'json',
      error: error.message
    };
  }
}

/**
 * Parses plain text file
 * @param {File|Blob|string} file - Text file
 * @returns {Promise<Object>} - Parsed data
 */
async function parseText(file) {
  try {
    let text;
    if (typeof file === 'string') {
      text = file;
    } else {
      text = await file.text();
    }

    return {
      success: true,
      format: 'txt',
      text: text
    };
  } catch (error) {
    return {
      success: false,
      format: 'txt',
      error: error.message
    };
  }
}

/**
 * Detects file format from filename or MIME type
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type (optional)
 * @returns {string} - Detected format
 */
function detectFormat(filename, mimeType = '') {
  const ext = filename.split('.').pop().toLowerCase();

  // Check extension first
  const extensionMap = {
    'pdf': 'pdf',
    'xlsx': 'xlsx',
    'xls': 'xls',
    'csv': 'csv',
    'txt': 'txt',
    'json': 'json',
    'xml': 'xml',
    'html': 'html',
    'htm': 'html'
  };

  if (extensionMap[ext]) {
    return extensionMap[ext];
  }

  // Check MIME type
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'xlsx';
  if (mimeType.includes('csv')) return 'csv';
  if (mimeType.includes('json')) return 'json';
  if (mimeType.includes('xml')) return 'xml';
  if (mimeType.includes('html')) return 'html';
  if (mimeType.includes('text')) return 'txt';

  return 'unknown';
}

/**
 * Universal document parser
 * @param {File|Blob} file - File to parse
 * @returns {Promise<Object>} - Parsed data
 */
async function parseDocument(file) {
  const format = detectFormat(file.name, file.type);

  switch (format) {
    case 'pdf':
      return await parsePDF(file);
    case 'xlsx':
    case 'xls':
      return await parseExcel(file);
    case 'csv':
      return await parseCSV(file);
    case 'json':
      return await parseJSON(file);
    case 'txt':
      return await parseText(file);
    default:
      return {
        success: false,
        format: 'unknown',
        error: `Unsupported format: ${format}`
      };
  }
}

/**
 * Validates document format using magic bytes
 * @param {ArrayBuffer} buffer - File buffer
 * @returns {string} - Detected format
 */
function validateFormat(buffer) {
  const bytes = new Uint8Array(buffer.slice(0, 512));

  // PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }

  // ZIP (Excel XLSX)
  if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return 'xlsx';
  }

  // OLE2 (Excel XLS)
  if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) {
    return 'xls';
  }

  // Check for text-based formats
  const text = new TextDecoder().decode(bytes);
  if (text.startsWith('{') || text.startsWith('[')) {
    return 'json';
  }

  return 'unknown';
}

/**
 * Extracts data from parsed document into autofill-friendly format
 * @param {Object} parsedDoc - Parsed document
 * @returns {Object} - Extracted data
 */
function extractAutofillData(parsedDoc) {
  if (!parsedDoc.success) return null;

  const data = {};

  // For Excel/CSV, try to extract key-value pairs
  if (parsedDoc.format === 'xlsx' || parsedDoc.format === 'csv') {
    const table = parsedDoc.table || parsedDoc.tables?.[0];
    if (table && table.headers && table.rows) {
      // Assume first column is keys, second is values
      for (const row of table.rows) {
        if (row.length >= 2) {
          const key = String(row[0]).toLowerCase().replace(/\s+/g, '');
          const value = row[1];
          if (key && value) {
            data[key] = value;
          }
        }
      }
    }
  }

  // For JSON, use directly
  if (parsedDoc.format === 'json' && parsedDoc.data) {
    return parsedDoc.data;
  }

  // For other formats, return text
  return { text: parsedDoc.text, ...data };
}

// Global access - all functions available on window.CUBEParser
const CUBEParser = {
  parseExcel,
  parseCSV,
  parsePDF,
  parseJSON,
  parseText,
  parseDocument,
  detectFormat,
  validateFormat,
  extractAutofillData
};

// Make available globally
if (typeof window !== 'undefined') {
  window.CUBEParser = CUBEParser;
}
