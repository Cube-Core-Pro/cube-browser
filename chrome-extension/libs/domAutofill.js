/**
 * DOMAutofill - Lógica de autofill en LendingPad
 * Versión JavaScript optimizada para Chrome Extension
 * 
 * @version 1.0.0
 * @enterprise
 */

window.LPAuditor = window.LPAuditor || {};
window.LPAuditor.DOMAutofill = (function() {
  'use strict';

  const Utils = window.LPAuditor.Utils;
  const FieldMapper = window.LPAuditor.FieldMapper;

  // ===== CONSTANTES =====

  const WAIT_AFTER_EDIT = 600;
  const WAIT_AFTER_SELECT = 300;
  const WAIT_AFTER_INPUT = 200;
  const MAX_RETRIES = 3;

  // ===== ESTADO =====

  let extractedData = {};

  /**
   * Establece datos extraídos
   * @param {Object} data 
   */
  function setExtractedData(data) {
    extractedData = { ...extractedData, ...data };
    Utils.log('info', 'Extracted data updated', extractedData);
  }

  /**
   * Obtiene datos extraídos
   * @returns {Object}
   */
  function getExtractedData() {
    return { ...extractedData };
  }

  /**
   * Limpia datos extraídos
   */
  function clearExtractedData() {
    extractedData = {};
    Utils.log('info', 'Extracted data cleared');
  }

  // ===== UTILIDADES DOM =====

  /**
   * Busca elemento en el DOM (con soporte para :contains)
   * @param {string} selector 
   * @param {number} retries 
   * @returns {HTMLElement|null}
   */
  async function findElement(selector, retries = 0) {
    // Intentar múltiples variantes del selector
    const selectors = selector.split(',').map(s => s.trim());
    
    for (const sel of selectors) {
      // Manejar pseudo-selectores como :contains()
      if (sel.includes(':contains(')) {
        const match = sel.match(/:contains\("([^"]+)"\)/);
        if (match) {
          const searchText = match[1];
          const baseSelector = sel.split(':contains')[0];
          const elements = document.querySelectorAll(baseSelector);
          
          for (const el of Array.from(elements)) {
            if (el.textContent && el.textContent.includes(searchText)) {
              return el;
            }
          }
        }
      } else {
        const el = document.querySelector(sel);
        if (el) return el;
      }
    }
    
    // Reintentar si no se encuentra
    if (retries < MAX_RETRIES) {
      Utils.log('debug', `Element not found, retrying... (${retries + 1}/${MAX_RETRIES})`);
      await Utils.wait(500);
      return findElement(selector, retries + 1);
    }
    
    return null;
  }

  /**
   * Click en botón Edit
   * @param {string} selector 
   * @returns {Promise<boolean>}
   */
  async function clickEditButton(selector) {
    try {
      const button = await findElement(selector);
      
      if (!button) {
        Utils.log('warn', `Edit button not found: ${selector}`);
        return false;
      }
      
      Utils.log('info', 'Clicking Edit button...');
      button.click();
      await Utils.wait(WAIT_AFTER_EDIT);
      return true;
      
    } catch (error) {
      Utils.log('error', 'Failed to click Edit button:', error);
      return false;
    }
  }

  /**
   * Establece valor de input
   * @param {string} selector 
   * @param {string} value 
   * @returns {Promise<boolean>}
   */
  async function setInputValue(selector, value) {
    try {
      const input = await findElement(selector);
      
      if (!input) {
        Utils.log('warn', `Input not found: ${selector}`);
        return false;
      }
      
      // Sanitizar input
      const sanitizedValue = Utils.sanitizeInput(value.toString());
      
      // Enfocar elemento
      input.focus();
      await Utils.wait(50);
      
      // Limpiar valor anterior
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await Utils.wait(50);
      
      // Establecer nuevo valor
      input.value = sanitizedValue;
      
      // Disparar eventos
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      
      await Utils.wait(WAIT_AFTER_INPUT);
      
      Utils.log('info', `Set input: ${sanitizedValue.substring(0, 30)}...`);
      return true;
      
    } catch (error) {
      Utils.log('error', 'Failed to set input value:', error);
      return false;
    }
  }

  /**
   * Establece valor de select
   * @param {string} selector 
   * @param {string} value 
   * @returns {Promise<boolean>}
   */
  async function setSelectValue(selector, value) {
    try {
      const select = await findElement(selector);
      
      if (!select || select.tagName !== 'SELECT') {
        Utils.log('warn', `Select not found: ${selector}`);
        return false;
      }
      
      // Normalizar valor de búsqueda
      const searchValue = Utils.normalizeText(value);
      
      // Buscar opción que coincida
      let optionToSelect = null;
      
      for (const option of Array.from(select.options)) {
        const optionText = Utils.normalizeText(option.textContent || '');
        const optionValue = Utils.normalizeText(option.value);
        
        // Coincidencia exacta
        if (optionText === searchValue || optionValue === searchValue) {
          optionToSelect = option;
          break;
        }
        
        // Coincidencia parcial
        if (optionText.includes(searchValue) || searchValue.includes(optionText)) {
          if (!optionToSelect) { // Primera coincidencia parcial
            optionToSelect = option;
          }
        }
      }
      
      if (!optionToSelect) {
        Utils.log('warn', `Option not found in select: ${value}`);
        return false;
      }
      
      // Seleccionar opción
      select.focus();
      await Utils.wait(50);
      
      select.value = optionToSelect.value;
      
      // Disparar eventos
      select.dispatchEvent(new Event('change', { bubbles: true }));
      select.dispatchEvent(new Event('blur', { bubbles: true }));
      
      await Utils.wait(WAIT_AFTER_SELECT);
      
      Utils.log('info', `Selected: ${optionToSelect.textContent}`);
      return true;
      
    } catch (error) {
      Utils.log('error', 'Failed to set select value:', error);
      return false;
    }
  }

  // ===== AUTOFILL DEMOGRAPHICS =====

  /**
   * Autofill Demographics section
   * @returns {Promise<Object>}
   */
  async function autofillDemographics() {
    Utils.log('info', '═══ Starting Demographics Autofill ═══');
    
    try {
      // Click Edit si es necesario
      const editClicked = await clickEditButton(FieldMapper.SELECTORS.demographicsEditButton);
      
      if (!editClicked) {
        Utils.log('warn', 'Could not click Edit button, attempting to fill anyway...');
      }
      
      let filled = 0;
      const results = {};
      
      // Ethnicity
      if (extractedData.ethnicity) {
        results.ethnicity = await setSelectValue(
          FieldMapper.SELECTORS.ethnicityDropdown,
          extractedData.ethnicity
        );
        if (results.ethnicity) filled++;
      }
      
      // Hispanic Origin (condicional)
      if (extractedData.ethnicity && 
          extractedData.ethnicity.toLowerCase().includes('hispanic')) {
        if (extractedData.hispanicOrigin) {
          results.hispanicOrigin = await setSelectValue(
            FieldMapper.SELECTORS.hispanicOriginDropdown,
            extractedData.hispanicOrigin
          );
          if (results.hispanicOrigin) filled++;
        }
      }
      
      // Gender
      if (extractedData.gender) {
        results.gender = await setSelectValue(
          FieldMapper.SELECTORS.genderDropdown,
          extractedData.gender
        );
        if (results.gender) filled++;
      }
      
      // Race
      if (extractedData.race) {
        results.race = await setSelectValue(
          FieldMapper.SELECTORS.raceDropdown,
          extractedData.race
        );
        if (results.race) filled++;
      }
      
      // Demographic Provided Type = "Internet Or Email" (por defecto)
      results.demographicProvidedType = await setSelectValue(
        FieldMapper.SELECTORS.demographicProvidedTypeDropdown,
        'Internet Or Email'
      );
      if (results.demographicProvidedType) filled++;
      
      Utils.log('info', `Demographics autofill complete: ${filled}/${Object.keys(results).length} fields`);
      
      return {
        success: filled > 0,
        section: 'demographics',
        filled,
        total: Object.keys(results).length,
        details: results
      };
      
    } catch (error) {
      Utils.log('error', 'Demographics autofill failed:', error);
      return {
        success: false,
        section: 'demographics',
        error: error.message
      };
    }
  }

  // ===== AUTOFILL REO =====

  /**
   * Autofill REO Market Value
   * @returns {Promise<Object>}
   */
  async function autofillREO() {
    Utils.log('info', '═══ Starting REO Autofill ═══');
    
    try {
      if (!extractedData.marketValue) {
        return {
          success: false,
          section: 'reo',
          error: 'No market value extracted'
        };
      }
      
      if (!extractedData.propertyAddress) {
        return {
          success: false,
          section: 'reo',
          error: 'No property address extracted'
        };
      }
      
      // Click Edit
      const editClicked = await clickEditButton(FieldMapper.SELECTORS.reoEditButton);
      if (!editClicked) {
        return {
          success: false,
          section: 'reo',
          error: 'Could not click REO Edit button'
        };
      }
      
      // Buscar lista de propiedades
      const propertyList = await findElement(FieldMapper.SELECTORS.reoPropertyList);
      if (!propertyList) {
        return {
          success: false,
          section: 'reo',
          error: 'Property list not found'
        };
      }
      
      const propertyItems = propertyList.querySelectorAll(FieldMapper.SELECTORS.reoPropertyItem);
      Utils.log('info', `Found ${propertyItems.length} REO properties`);
      
      let bestMatch = null;
      
      // Match por dirección
      for (const item of Array.from(propertyItems)) {
        const addressEl = item.querySelector(FieldMapper.SELECTORS.reoPropertyAddress);
        if (!addressEl) continue;
        
        const addressText = addressEl.textContent.trim();
        const itemAddress = Utils.parseAddress(addressText);
        
        const score = Utils.fuzzyMatchAddress(extractedData.propertyAddress, itemAddress);
        
        Utils.log('debug', `Property match score: ${score.toFixed(2)} for "${addressText}"`);
        
        if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = {
            element: item,
            score,
            address: itemAddress
          };
        }
      }
      
      if (!bestMatch) {
        return {
          success: false,
          section: 'reo',
          error: 'No matching property found (score < 0.6)'
        };
      }
      
      Utils.log('info', `Best match: score ${bestMatch.score.toFixed(2)}`);
      
      // Rellenar Market Value
      const marketValueInput = bestMatch.element.querySelector(
        FieldMapper.SELECTORS.reoMarketValueInput
      );
      
      if (!marketValueInput) {
        return {
          success: false,
          section: 'reo',
          error: 'Market value input not found in matched property'
        };
      }
      
      const formattedValue = Utils.formatMoney(extractedData.marketValue);
      
      marketValueInput.focus();
      await Utils.wait(50);
      
      marketValueInput.value = formattedValue;
      marketValueInput.dispatchEvent(new Event('input', { bubbles: true }));
      marketValueInput.dispatchEvent(new Event('change', { bubbles: true }));
      marketValueInput.dispatchEvent(new Event('blur', { bubbles: true }));
      
      await Utils.wait(WAIT_AFTER_INPUT);
      
      Utils.log('info', `REO Market Value set to: ${formattedValue}`);
      
      return {
        success: true,
        section: 'reo',
        filled: 1,
        total: 1,
        details: {
          marketValue: formattedValue,
          matchScore: bestMatch.score.toFixed(2)
        }
      };
      
    } catch (error) {
      Utils.log('error', 'REO autofill failed:', error);
      return {
        success: false,
        section: 'reo',
        error: error.message
      };
    }
  }

  // ===== AUTOFILL PERSONAL INFORMATION =====

  /**
   * Autofill Personal Information
   * @returns {Promise<Object>}
   */
  async function autofillPersonal() {
    Utils.log('info', '═══ Starting Personal Information Autofill ═══');
    
    try {
      // Click Edit
      const editClicked = await clickEditButton(FieldMapper.SELECTORS.personalEditButton);
      if (!editClicked) {
        Utils.log('warn', 'Could not click Edit button, attempting to fill anyway...');
      }
      
      let filled = 0;
      const results = {};
      
      // Email
      if (extractedData.email) {
        results.email = await setInputValue(
          FieldMapper.SELECTORS.emailInput,
          extractedData.email
        );
        if (results.email) filled++;
      }
      
      // SSN
      if (extractedData.ssn) {
        results.ssn = await setInputValue(
          FieldMapper.SELECTORS.ssnInput,
          extractedData.ssn
        );
        if (results.ssn) filled++;
      }
      
      // Date of Birth
      if (extractedData.dob) {
        results.dob = await setInputValue(
          FieldMapper.SELECTORS.dobInput,
          extractedData.dob
        );
        if (results.dob) filled++;
      }
      
      Utils.log('info', `Personal Information autofill complete: ${filled}/${Object.keys(results).length} fields`);
      
      return {
        success: filled > 0,
        section: 'personal',
        filled,
        total: Object.keys(results).length,
        details: results
      };
      
    } catch (error) {
      Utils.log('error', 'Personal Information autofill failed:', error);
      return {
        success: false,
        section: 'personal',
        error: error.message
      };
    }
  }

  // ===== AUTOFILL ADDRESS =====

  /**
   * Autofill Address
   * @returns {Promise<Object>}
   */
  async function autofillAddress() {
    Utils.log('info', '═══ Starting Address Autofill ═══');
    
    try {
      if (!extractedData.currentAddress) {
        return {
          success: false,
          section: 'address',
          error: 'No current address extracted'
        };
      }
      
      // Click Edit
      const editClicked = await clickEditButton(FieldMapper.SELECTORS.addressEditButton);
      if (!editClicked) {
        return {
          success: false,
          section: 'address',
          error: 'Could not click Address Edit button'
        };
      }
      
      const addr = extractedData.currentAddress;
      let filled = 0;
      const results = {};
      
      // Street
      if (addr.full || (addr.streetNumber && addr.streetName)) {
        const streetValue = addr.full || `${addr.streetNumber} ${addr.streetName}`;
        results.street = await setInputValue(
          FieldMapper.SELECTORS.streetInput,
          streetValue
        );
        if (results.street) filled++;
      }
      
      // City
      if (addr.city) {
        results.city = await setInputValue(
          FieldMapper.SELECTORS.cityInput,
          addr.city
        );
        if (results.city) filled++;
      }
      
      // State
      if (addr.state) {
        results.state = await setSelectValue(
          FieldMapper.SELECTORS.stateInput,
          addr.state
        );
        if (results.state) filled++;
      }
      
      // ZIP
      if (addr.zipCode) {
        results.zip = await setInputValue(
          FieldMapper.SELECTORS.zipInput,
          addr.zipCode
        );
        if (results.zip) filled++;
      }
      
      Utils.log('info', `Address autofill complete: ${filled}/${Object.keys(results).length} fields`);
      
      return {
        success: filled > 0,
        section: 'address',
        filled,
        total: Object.keys(results).length,
        details: results
      };
      
    } catch (error) {
      Utils.log('error', 'Address autofill failed:', error);
      return {
        success: false,
        section: 'address',
        error: error.message
      };
    }
  }

  // ===== AUTOFILL HELOC =====

  /**
   * Autofill HELOC fields
   * @returns {Promise<Object>}
   */
  async function autofillHELOC() {
    Utils.log('info', '═══ Starting HELOC Autofill ═══');
    
    try {
      let filled = 0;
      const results = {};
      
      // APR → Note Rate + APR from CD
      if (extractedData.apr) {
        const normalizedAPR = Utils.normalizeAPR(extractedData.apr);
        
        // Note Rate
        results.noteRate = await setInputValue(
          FieldMapper.SELECTORS.noteRateInput,
          normalizedAPR
        );
        if (results.noteRate) {
          filled++;
          Utils.log('info', `Note Rate set to: ${normalizedAPR}%`);
        }
        
        // APR from CD
        results.aprFromCD = await setInputValue(
          FieldMapper.SELECTORS.aprFromCDInput,
          normalizedAPR
        );
        if (results.aprFromCD) {
          filled++;
          Utils.log('info', `APR from CD set to: ${normalizedAPR}%`);
        }
      }
      
      // Initial Draw → Cash-out Amount
      if (extractedData.initialDraw) {
        const formattedDraw = Utils.formatMoney(extractedData.initialDraw);
        
        results.cashOut = await setInputValue(
          FieldMapper.SELECTORS.cashOutInput,
          formattedDraw
        );
        
        if (results.cashOut) {
          filled++;
          Utils.log('info', `Cash-out Amount set to: ${formattedDraw}`);
        }
      }
      
      if (filled === 0) {
        return {
          success: false,
          section: 'heloc',
          error: 'No HELOC data available'
        };
      }
      
      Utils.log('info', `HELOC autofill complete: ${filled}/${Object.keys(results).length} fields`);
      
      return {
        success: true,
        section: 'heloc',
        filled,
        total: Object.keys(results).length,
        details: results
      };
      
    } catch (error) {
      Utils.log('error', 'HELOC autofill failed:', error);
      return {
        success: false,
        section: 'heloc',
        error: error.message
      };
    }
  }

  // ===== AUTOFILL ALL =====

  /**
   * Autofill todas las secciones disponibles
   * @returns {Promise<Object>}
   */
  async function autofillAll() {
    Utils.log('info', '═════════════════════════════════');
    Utils.log('info', '    STARTING COMPLETE AUTOFILL    ');
    Utils.log('info', '═════════════════════════════════');
    
    const results = {
      success: false,
      timestamp: new Date().toISOString(),
      sections: {}
    };
    
    try {
      // Demographics
      results.sections.demographics = await autofillDemographics();
      await Utils.wait(500);
      
      // REO
      results.sections.reo = await autofillREO();
      await Utils.wait(500);
      
      // Personal
      results.sections.personal = await autofillPersonal();
      await Utils.wait(500);
      
      // Address
      results.sections.address = await autofillAddress();
      await Utils.wait(500);
      
      // HELOC
      results.sections.heloc = await autofillHELOC();
      
      // Calcular totales
      let totalFilled = 0;
      let totalSections = 0;
      
      for (const section of Object.values(results.sections)) {
        if (section.success) {
          totalSections++;
          totalFilled += section.filled || 0;
        }
      }
      
      results.success = totalSections > 0;
      results.totalFilled = totalFilled;
      results.totalSections = totalSections;
      
      Utils.log('info', '═════════════════════════════════');
      Utils.log('info', `  AUTOFILL COMPLETE: ${totalFilled} fields in ${totalSections} sections`);
      Utils.log('info', '═════════════════════════════════');
      
      return results;
      
    } catch (error) {
      Utils.log('error', 'Complete autofill failed:', error);
      results.error = error.message;
      return results;
    }
  }

  // ===== API PÚBLICA =====

  return {
    // Data management
    setExtractedData,
    getExtractedData,
    clearExtractedData,
    
    // Section autofill
    autofillDemographics,
    autofillREO,
    autofillPersonal,
    autofillAddress,
    autofillHELOC,
    
    // Complete autofill
    autofillAll,
    
    // Utilities
    findElement,
    setInputValue,
    setSelectValue
  };

})();

console.log('[LPAuditor] DOMAutofill cargado correctamente');
