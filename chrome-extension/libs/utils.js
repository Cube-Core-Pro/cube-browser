/**
 * Utils - Funciones auxiliares compartidas
 * Versión JavaScript optimizada para Chrome Extension
 * 
 * @version 1.0.0
 * @enterprise
 */

// Namespace para evitar colisiones
window.LPAuditor = window.LPAuditor || {};
window.LPAuditor.Utils = (function() {
  'use strict';

  // ===== UTILIDADES GENERALES =====

  /**
   * Espera asíncrona
   * @param {number} ms - Milisegundos a esperar
   * @returns {Promise<void>}
   */
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Normaliza texto para comparaciones
   * @param {string} text - Texto a normalizar
   * @returns {string}
   */
  function normalizeText(text) {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Normaliza valores de APR
   * @param {string} value - Valor APR en cualquier formato
   * @returns {string} - APR normalizado
   */
  function normalizeAPR(value) {
    if (!value) return '';
    
    const cleaned = value.replace(/[^\d.]/g, '');
    let num = parseFloat(cleaned);
    
    if (isNaN(num)) return cleaned;
    
    // Si está en forma decimal (0.075), convertir a porcentaje
    if (num < 1) {
      num = num * 100;
    }
    
    // Redondear a 3 decimales y remover trailing zeros
    return num.toFixed(3).replace(/\.?0+$/, '');
  }

  // ===== DIRECCIONES =====

  /**
   * Parsea una dirección en componentes
   * @param {string} text - Texto de dirección
   * @returns {Object} - Objeto con componentes de dirección
   */
  function parseAddress(text) {
    if (!text) {
      return { full: '' };
    }

    const address = { full: text.trim() };
    
    // Regex para dirección típica: "123 Main St, City, ST 12345"
    const match = text.match(/(\d+)\s+([^,]+),?\s*([^,]+),?\s*([A-Z]{2})\s*(\d{5})/i);
    
    if (match) {
      address.streetNumber = match[1];
      address.streetName = match[2].trim();
      address.city = match[3].trim();
      address.state = match[4].toUpperCase();
      address.zipCode = match[5];
    }
    
    return address;
  }

  /**
   * Compara dos direcciones con fuzzy matching
   * @param {Object} addr1 - Primera dirección
   * @param {Object} addr2 - Segunda dirección
   * @returns {number} - Score de 0 a 1
   */
  function fuzzyMatchAddress(addr1, addr2) {
    if (!addr1 || !addr2) return 0;

    const weights = {
      streetNumber: 0.4,
      streetName: 0.4,
      zipCode: 0.2
    };
    
    let score = 0;
    
    // Street number (exact match)
    if (addr1.streetNumber && addr2.streetNumber) {
      if (addr1.streetNumber === addr2.streetNumber) {
        score += weights.streetNumber;
      }
    }
    
    // Street name (fuzzy)
    if (addr1.streetName && addr2.streetName) {
      const name1 = normalizeText(addr1.streetName)
        .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|boulevard|blvd)\b/g, '');
      const name2 = normalizeText(addr2.streetName)
        .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|boulevard|blvd)\b/g, '');
      
      const similarity = stringSimilarity(name1, name2);
      score += similarity * weights.streetName;
    }
    
    // ZIP code (exact match)
    if (addr1.zipCode && addr2.zipCode) {
      if (addr1.zipCode === addr2.zipCode) {
        score += weights.zipCode;
      }
    }
    
    return score;
  }

  // ===== STRING SIMILARITY =====

  /**
   * Calcula similitud entre dos strings
   * @param {string} str1 
   * @param {string} str2 
   * @returns {number} - Similitud de 0 a 1
   */
  function stringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calcula distancia de Levenshtein
   * @param {string} str1 
   * @param {string} str2 
   * @returns {number}
   */
  function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    // Inicializar matriz
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    // Calcular distancia
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,      // insertion
            matrix[i - 1][j] + 1       // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // ===== MONEY & NUMBERS =====

  /**
   * Extrae valor monetario de texto
   * @param {string} text - Texto con valor monetario
   * @returns {number|null}
   */
  function extractMoneyValue(text) {
    if (!text) return null;
    
    const match = text.match(/\$?[\d,]+\.?\d*/);
    if (!match) return null;
    
    const cleaned = match[0].replace(/[$,]/g, '');
    const value = parseFloat(cleaned);
    
    return isNaN(value) ? null : value;
  }

  /**
   * Formatea número como dinero
   * @param {number} value 
   * @returns {string}
   */
  function formatMoney(value) {
    if (typeof value !== 'number') return '$0.00';
    
    return '$' + value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Extrae números de texto
   * @param {string} text 
   * @returns {number|null}
   */
  function extractNumber(text) {
    if (!text) return null;
    
    const cleaned = text.replace(/[^\d.-]/g, '');
    const value = parseFloat(cleaned);
    
    return isNaN(value) ? null : value;
  }

  // ===== LOGGING SEGURO =====

  /**
   * Log con nivel y formato consistente
   * @param {string} level - 'info', 'warn', 'error', 'debug'
   * @param {...any} args - Argumentos a loguear
   */
  function log(level, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[LPAuditor:${level}] ${timestamp}`;
    
    switch (level) {
      case 'error':
        console.error(prefix, ...args);
        break;
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'debug':
        // Solo en desarrollo
        if (window.LPAuditor.DEBUG) {
          console.log(prefix, ...args);
        }
        break;
      default:
        console.log(prefix, ...args);
    }
    
    // Enviar a background para persistencia (opcional)
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: 'log',
        level: level,
        message: args.join(' '),
        timestamp: timestamp
      }).catch(() => {
        // Ignorar si falla (background no disponible)
      });
    }
  }

  // ===== VALIDACIÓN =====

  /**
   * Valida SSN (Social Security Number)
   * @param {string} ssn 
   * @returns {boolean}
   */
  function isValidSSN(ssn) {
    if (!ssn) return false;
    
    // Remover guiones y espacios
    const cleaned = ssn.replace(/[-\s]/g, '');
    
    // Debe tener 9 dígitos
    if (!/^\d{9}$/.test(cleaned)) return false;
    
    // No puede ser todos ceros o números secuenciales
    if (/^0{9}$/.test(cleaned)) return false;
    if (/^1{9}$/.test(cleaned)) return false;
    
    return true;
  }

  /**
   * Valida formato de teléfono
   * @param {string} phone 
   * @returns {boolean}
   */
  function isValidPhone(phone) {
    if (!phone) return false;
    
    const cleaned = phone.replace(/[\s()-]/g, '');
    
    // 10 dígitos
    return /^\d{10}$/.test(cleaned);
  }

  /**
   * Valida ZIP code
   * @param {string} zip 
   * @returns {boolean}
   */
  function isValidZip(zip) {
    if (!zip) return false;
    
    // 5 dígitos o 5+4
    return /^\d{5}(-\d{4})?$/.test(zip);
  }

  /**
   * Valida email
   * @param {string} email 
   * @returns {boolean}
   */
  function isValidEmail(email) {
    if (!email) return false;
    
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ===== FORMATEO =====

  /**
   * Formatea SSN con guiones
   * @param {string} ssn 
   * @returns {string}
   */
  function formatSSN(ssn) {
    if (!ssn) return '';
    
    const cleaned = ssn.replace(/\D/g, '');
    
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    
    return ssn;
  }

  /**
   * Formatea teléfono con guiones
   * @param {string} phone 
   * @returns {string}
   */
  function formatPhone(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  }

  /**
   * Formatea fecha a MM/DD/YYYY
   * @param {Date|string} date 
   * @returns {string}
   */
  function formatDate(date) {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    
    if (isNaN(d.getTime())) return '';
    
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${month}/${day}/${year}`;
  }

  // ===== SANITIZACIÓN (SEGURIDAD) =====

  /**
   * Escapa HTML para prevenir XSS
   * @param {string} text 
   * @returns {string}
   */
  function escapeHTML(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sanitiza input para prevenir injection
   * @param {string} input 
   * @returns {string}
   */
  function sanitizeInput(input) {
    if (!input) return '';
    
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // ===== DEBOUNCE & THROTTLE =====

  /**
   * Debounce function
   * @param {Function} func 
   * @param {number} wait 
   * @returns {Function}
   */
  function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   * @param {Function} func 
   * @param {number} limit 
   * @returns {Function}
   */
  function throttle(func, limit) {
    let inThrottle;
    
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ===== CRYPTO (SEGURIDAD) =====

  /**
   * Genera ID único seguro
   * @returns {string}
   */
  function generateSecureId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    const cryptoPart = window.crypto ?
      window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36) :
      Math.random().toString(36).substr(2, 9);
    
    return `${timestamp}-${randomPart}-${cryptoPart}`;
  }

  /**
   * Hash simple para comparaciones (NO PARA SEGURIDAD CRÍTICA)
   * @param {string} str 
   * @returns {string}
   */
  function simpleHash(str) {
    if (!str) return '';
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // ===== API PÚBLICA =====

  return {
    // General
    wait,
    normalizeText,
    normalizeAPR,
    log,
    
    // Direcciones
    parseAddress,
    fuzzyMatchAddress,
    
    // String
    stringSimilarity,
    levenshteinDistance,
    
    // Money & Numbers
    extractMoneyValue,
    formatMoney,
    extractNumber,
    
    // Validación
    isValidSSN,
    isValidPhone,
    isValidZip,
    isValidEmail,
    
    // Formateo
    formatSSN,
    formatPhone,
    formatDate,
    
    // Seguridad
    escapeHTML,
    sanitizeInput,
    generateSecureId,
    simpleHash,
    
    // Performance
    debounce,
    throttle
  };

})();

// Log de inicialización
console.log('[LPAuditor] Utils cargadas correctamente');
