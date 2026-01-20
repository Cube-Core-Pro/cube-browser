/**
 * PDFParser - Parseo local de PDFs con PDF.js
 * Versión JavaScript optimizada para Chrome Extension
 * 
 * @version 1.0.0
 * @enterprise
 */

window.LPAuditor = window.LPAuditor || {};
window.LPAuditor.PDFParser = (function() {
  'use strict';

  const Utils = window.LPAuditor.Utils;
  const FieldMapper = window.LPAuditor.FieldMapper;

  let pdfjsLib = null;
  let isInitialized = false;

  // ===== INICIALIZACIÓN =====

  /**
   * Carga PDF.js library
   * @returns {Promise<void>}
   */
  async function initialize() {
    if (isInitialized && pdfjsLib) {
      return;
    }

    try {
      // Cargar PDF.js desde extensión
      const pdfjsPath = chrome.runtime.getURL('pdfjs/pdf.min.js');
      
      await loadScript(pdfjsPath);
      
      // PDF.js se carga en el scope global como pdfjsLib
      pdfjsLib = window['pdfjs-dist/build/pdf'];
      
      if (!pdfjsLib) {
        throw new Error('PDF.js not loaded correctly');
      }

      // Configurar worker
      const workerPath = chrome.runtime.getURL('pdfjs/pdf.worker.min.js');
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
      
      isInitialized = true;
      Utils.log('info', 'PDF.js initialized successfully');
      
    } catch (error) {
      Utils.log('error', 'Failed to initialize PDF.js:', error);
      throw error;
    }
  }

  /**
   * Carga script dinámicamente
   * @param {string} url 
   * @returns {Promise<void>}
   */
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load: ${url}`));
      document.head.appendChild(script);
    });
  }

  // ===== PARSEO PRINCIPAL =====

  /**
   * Parsea PDF desde URL
   * @param {string} url - URL del PDF
   * @param {string} filename - Nombre del archivo
   * @returns {Promise<Object>} - Datos extraídos
   */
  async function parsePDF(url, filename) {
    Utils.log('info', `Starting PDF parse: ${filename}`);
    
    try {
      // Inicializar si no está listo
      await initialize();

      // Descargar PDF
      const arrayBuffer = await downloadPDF(url);
      
      // Cargar con PDF.js
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      Utils.log('info', `PDF loaded: ${pdf.numPages} pages`);
      
      // Extraer texto de todas las páginas
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      Utils.log('info', `Extracted ${fullText.length} characters from PDF`);
      
      // Clasificar y parsear según tipo
      const pdfType = FieldMapper.classifyPDF(filename);
      Utils.log('info', `PDF classified as: ${pdfType}`);
      
      let parsedData = {};
      
      switch (pdfType) {
        case 'appraisal':
          parsedData = parseAppraisal(fullText);
          break;
        case 'closing-disclosure':
          parsedData = parseClosingDisclosure(fullText);
          break;
        case 'demographic':
          parsedData = parseDemographic(fullText);
          break;
        default:
          parsedData = parseGenericPDF(fullText);
      }
      
      // Agregar metadata
      parsedData._metadata = {
        filename,
        pdfType,
        pageCount: pdf.numPages,
        textLength: fullText.length,
        parsedAt: new Date().toISOString()
      };
      
      Utils.log('info', 'PDF parsing complete', parsedData);
      return parsedData;
      
    } catch (error) {
      Utils.log('error', 'PDF parsing failed:', error);
      throw error;
    }
  }

  /**
   * Descarga PDF como ArrayBuffer
   * @param {string} url 
   * @returns {Promise<ArrayBuffer>}
   */
  async function downloadPDF(url) {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.arrayBuffer();
      
    } catch (error) {
      Utils.log('error', 'Failed to download PDF:', error);
      throw error;
    }
  }

  // ===== PARSERS ESPECÍFICOS =====

  /**
   * Parsea PDF de Appraisal/Evaluation
   * @param {string} text 
   * @returns {Object}
   */
  function parseAppraisal(text) {
    const data = {};
    
    // Market Value / Appraised Value
    const marketValuePatterns = [
      /(?:Market Value|Appraised Value|As-is Value)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
      /Opinion of Market Value[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
      /Property Value[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
      /Final Value Opinion[:\s]*\$?([\d,]+(?:\.\d{2})?)/i
    ];
    
    for (const pattern of marketValuePatterns) {
      const match = text.match(pattern);
      if (match) {
        const value = Utils.extractMoneyValue(match[1]);
        if (value && value > 0) {
          data.marketValue = value;
          Utils.log('info', `Extracted Market Value: $${value}`);
          break;
        }
      }
    }
    
    // Subject Property Address
    const addressPatterns = [
      /(?:Subject Property|Property Address|Subject)[:\s]*\n?\s*([0-9]+\s+[^\n]+?(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Boulevard|Blvd)[^\n]*)/i,
      /Property Location[:\s]*\n?\s*([0-9]+[^\n]+)/i,
      /Address[:\s]*\n?\s*([0-9]+\s+[A-Za-z\s]+)/i
    ];
    
    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match) {
        const addressStr = match[1].trim();
        data.propertyAddress = Utils.parseAddress(addressStr);
        Utils.log('info', `Extracted Property Address: ${addressStr}`);
        break;
      }
    }
    
    // Borrower Information
    const borrowerPattern = /(?:Borrower|Owner|Name)[:\s]*([A-Z][a-zA-Z\s]+)/;
    const borrowerMatch = text.match(borrowerPattern);
    if (borrowerMatch) {
      data.borrowerName = borrowerMatch[1].trim();
      Utils.log('info', `Extracted Borrower: ${data.borrowerName}`);
    }
    
    return data;
  }

  /**
   * Parsea Closing Disclosure
   * @param {string} text 
   * @returns {Object}
   */
  function parseClosingDisclosure(text) {
    const data = {};
    
    // APR
    const aprPatterns = [
      /Annual Percentage Rate[:\s]*([\d.]+)%?/i,
      /APR[:\s]*([\d.]+)%?/i,
      /(?:Your\s+)?APR[:\s]*([\d.]+)%?/i
    ];
    
    for (const pattern of aprPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.apr = Utils.normalizeAPR(match[1]);
        Utils.log('info', `Extracted APR: ${data.apr}%`);
        break;
      }
    }
    
    // Initial Draw / Cash to Borrower
    const drawPatterns = [
      /Funds to be applied to debt payoff[:\s]*\$?([\d,]+\.?\d*)/i,
      /Funds disbursed to you[:\s]*\$?([\d,]+\.?\d*)/i,
      /Initial Draw[:\s]*\$?([\d,]+\.?\d*)/i,
      /Cash to Borrower[:\s]*\$?([\d,]+\.?\d*)/i,
      /Cash Out[:\s]*\$?([\d,]+\.?\d*)/i,
      /Estimated Cash to Close[:\s]*\$?([\d,]+\.?\d*)/i
    ];
    
    const drawAmounts = [];
    
    for (const pattern of drawPatterns) {
      // Buscar TODAS las ocurrencias, no solo la primera
      const regex = new RegExp(pattern.source, pattern.flags + 'g');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const value = Utils.extractMoneyValue(match[1]);
        if (value && value > 0 && !drawAmounts.includes(value)) {
          drawAmounts.push(value);
          Utils.log('info', `Found draw amount: $${value}`);
        }
      }
    }
    
    if (drawAmounts.length > 0) {
      // Si hay múltiples montos, sumarlos
      const totalDraw = drawAmounts.reduce((sum, val) => sum + val, 0);
      data.initialDraw = totalDraw;
      
      if (drawAmounts.length > 1) {
        Utils.log('info', `Summed ${drawAmounts.length} draw amounts: $${totalDraw}`);
      } else {
        Utils.log('info', `Initial Draw: $${totalDraw}`);
      }
    }
    
    // Loan Amount
    const loanAmountPatterns = [
      /Loan Amount[:\s]*\$?([\d,]+\.?\d*)/i,
      /Total Loan Amount[:\s]*\$?([\d,]+\.?\d*)/i,
      /Principal Amount[:\s]*\$?([\d,]+\.?\d*)/i
    ];
    
    for (const pattern of loanAmountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const value = Utils.extractMoneyValue(match[1]);
        if (value && value > 0) {
          data.loanAmount = value;
          Utils.log('info', `Extracted Loan Amount: $${value}`);
          break;
        }
      }
    }
    
    // Interest Rate
    const interestRatePattern = /Interest Rate[:\s]*([\d.]+)%?/i;
    const rateMatch = text.match(interestRatePattern);
    if (rateMatch) {
      data.interestRate = Utils.normalizeAPR(rateMatch[1]);
      Utils.log('info', `Extracted Interest Rate: ${data.interestRate}%`);
    }
    
    return data;
  }

  /**
   * Parsea documento demográfico
   * @param {string} text 
   * @returns {Object}
   */
  function parseDemographic(text) {
    const data = {};
    
    // Ethnicity
    data.ethnicity = extractDemographics(text, 'ethnicity');
    
    // Race
    data.race = extractDemographics(text, 'race');
    
    // Gender
    data.gender = extractDemographics(text, 'gender');
    
    // Hispanic Origin (condicional)
    if (data.ethnicity && data.ethnicity.toLowerCase().includes('hispanic')) {
      const hispanicPattern = /Hispanic Origin[:\s]*(Yes|No|Mexican|Puerto Rican|Cuban|Other)/i;
      const match = text.match(hispanicPattern);
      if (match) {
        data.hispanicOrigin = match[1];
        Utils.log('info', `Extracted Hispanic Origin: ${data.hispanicOrigin}`);
      }
    }
    
    return data;
  }

  /**
   * Parsea PDF genérico
   * @param {string} text 
   * @returns {Object}
   */
  function parseGenericPDF(text) {
    const data = {};
    
    // Intentar extraer todo lo posible
    
    // Demographics
    data.ethnicity = extractDemographics(text, 'ethnicity');
    data.race = extractDemographics(text, 'race');
    data.gender = extractDemographics(text, 'gender');
    
    // Personal Information
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = text.match(emailPattern);
    if (emailMatch) {
      data.email = emailMatch[0];
      Utils.log('info', `Extracted Email: ${data.email}`);
    }
    
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
    const ssnMatch = text.match(ssnPattern);
    if (ssnMatch) {
      data.ssn = ssnMatch[0];
      Utils.log('info', 'Extracted SSN');
    }
    
    const dobPattern = /(?:Date of Birth|DOB|Birth Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i;
    const dobMatch = text.match(dobPattern);
    if (dobMatch) {
      data.dob = dobMatch[1];
      Utils.log('info', `Extracted DOB: ${data.dob}`);
    }
    
    // APR
    const aprPattern = /(?:APR|Annual Percentage Rate)[:\s]*([\d.]+)%?/i;
    const aprMatch = text.match(aprPattern);
    if (aprMatch) {
      data.apr = Utils.normalizeAPR(aprMatch[1]);
      Utils.log('info', `Extracted APR: ${data.apr}%`);
    }
    
    // Address
    const addressPattern = /(?:Current Address|Mailing Address|Address)[:\s]*\n?\s*([0-9]+\s+[^\n]+)/i;
    const addressMatch = text.match(addressPattern);
    if (addressMatch) {
      data.currentAddress = Utils.parseAddress(addressMatch[1]);
      Utils.log('info', `Extracted Address: ${addressMatch[1].trim()}`);
    }
    
    return data;
  }

  /**
   * Extrae datos demográficos
   * @param {string} text 
   * @param {string} field - 'ethnicity', 'race', 'gender'
   * @returns {string|null}
   */
  function extractDemographics(text, field) {
    const patterns = {
      ethnicity: [
        /Ethnicity[:\s]*(Hispanic or Latino|Not Hispanic or Latino)/i,
        /Hispanic Origin[:\s]*(Yes|No)/i,
        /Ethnicity[:\s]*([^\n]{5,50})/i
      ],
      race: [
        /Race[:\s]*(American Indian or Alaska Native|Asian|Black or African American|Native Hawaiian or Other Pacific Islander|White)/i,
        /Race[:\s]*([^\n]{5,50})/i
      ],
      gender: [
        /Gender[:\s]*(Male|Female|Non-binary|I do not wish to provide)/i,
        /Sex[:\s]*(M|F|Male|Female)/i
      ]
    };
    
    const fieldPatterns = patterns[field];
    if (!fieldPatterns) return null;
    
    for (const pattern of fieldPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let value = match[1].trim();
        
        // Normalizar valores
        if (field === 'gender') {
          if (value === 'M') value = 'Male';
          if (value === 'F') value = 'Female';
        }
        
        // Validar longitud razonable
        if (value.length > 5 && value.length < 100) {
          Utils.log('info', `Extracted ${field}: ${value}`);
          return value;
        }
      }
    }
    
    return null;
  }

  // ===== UTILIDADES =====

  /**
   * Verifica si PDF.js está inicializado
   * @returns {boolean}
   */
  function isReady() {
    return isInitialized && pdfjsLib !== null;
  }

  /**
   * Obtiene versión de PDF.js
   * @returns {string|null}
   */
  function getVersion() {
    if (pdfjsLib && pdfjsLib.version) {
      return pdfjsLib.version;
    }
    return null;
  }

  // ===== API PÚBLICA =====

  return {
    initialize,
    parsePDF,
    isReady,
    getVersion
  };

})();

console.log('[LPAuditor] PDFParser cargado correctamente');
