/**
 * FieldMapper - Mapeo de selectores CSS y configuración de campos
 * Versión JavaScript optimizada para Chrome Extension
 * 
 * @version 1.0.0
 * @enterprise
 */

window.LPAuditor = window.LPAuditor || {};
window.LPAuditor.FieldMapper = (function() {
  'use strict';

  // ===== SELECTORES CSS =====

  const SELECTORS = {
    // Documents
    collapseAllButton: 'button:contains("Collapse all"), a:contains("Collapse all"), [aria-label*="Collapse"]',
    
    // Demographics section
    demographicsPane: '[data-section="demographics"], .demographics-section, [aria-label*="Demographics"]',
    demographicsEditButton: '[data-section="demographics"] button:contains("Edit"), .demographics-section button:contains("Edit")',
    
    ethnicityDropdown: 'select[name*="ethnicity"], #ethnicity, [aria-label*="Ethnicity"]',
    hispanicOriginDropdown: 'select[name*="hispanic"], select[name*="origin"], #hispanicOrigin',
    genderDropdown: 'select[name*="gender"], #gender, [aria-label*="Gender"]',
    raceDropdown: 'select[name*="race"], #race, [aria-label*="Race"]',
    demographicProvidedTypeDropdown: 'select[name*="provided"], select[name*="information"], #demographicProvidedType',
    
    // REO section
    reoPane: '[data-section="reo"], .reo-section, [aria-label*="REO"]',
    reoEditButton: '.reo-section button:contains("Edit"), [data-section="reo"] button:contains("Edit")',
    reoPropertyList: '.property-list, .reo-properties, [data-property-list]',
    reoPropertyItem: '.property-item, .reo-property, [data-property-id]',
    reoPropertyAddress: '.property-address, [data-field="address"]',
    reoMarketValueInput: 'input[name*="market"], input[name*="value"], #marketValue',
    
    // Personal Information section
    personalPane: '[data-section="personal"], .personal-information, [aria-label*="Personal"]',
    personalEditButton: '.personal-information button:contains("Edit"), [data-section="personal"] button:contains("Edit")',
    
    emailInput: 'input[name*="email"], input[type="email"], #email',
    ssnInput: 'input[name*="ssn"], input[name*="social"], #ssn',
    dobInput: 'input[name*="dob"], input[name*="birth"], input[type="date"], #dateOfBirth',
    
    // Address section
    addressPane: '[data-section="address"], .address-section, [aria-label*="Address"]',
    addressEditButton: '.address-section button:contains("Edit"), [data-section="address"] button:contains("Edit")',
    
    streetInput: 'input[name*="street"], input[name*="address1"], #street',
    cityInput: 'input[name*="city"], #city',
    stateInput: 'input[name*="state"], select[name*="state"], #state',
    zipInput: 'input[name*="zip"], input[name*="postal"], #zipCode',
    
    // HELOC section
    helocPane: '[data-section="heloc"], .heloc-section, [aria-label*="HELOC"]',
    
    // Note Rate (Overview → Terms and Mortgage)
    noteRateInput: 'input[name*="note"], input[name*="rate"], #noteRate, [aria-label*="Note Rate"]',
    
    // APR from CD (Custom Fields)
    aprFromCDInput: 'input[name*="apr"], input[name*="cd"], #aprFromCD, [aria-label*="APR"]',
    
    // Cash-out Amount (Terms and Mortgage)
    cashOutInput: 'input[name*="cash"], input[name*="cashout"], #cashOutAmount, [aria-label*="Cash"]'
  };

  // ===== CONFIGURACIÓN DE CAMPOS =====

  const FIELD_MAPPINGS = {
    // Demographics
    ethnicity: {
      selector: SELECTORS.ethnicityDropdown,
      type: 'select',
      waitAfter: 400,
      requiresEdit: true,
      editButtonSelector: SELECTORS.demographicsEditButton
    },
    hispanicOrigin: {
      selector: SELECTORS.hispanicOriginDropdown,
      type: 'select',
      waitAfter: 400
    },
    gender: {
      selector: SELECTORS.genderDropdown,
      type: 'select',
      waitAfter: 400
    },
    race: {
      selector: SELECTORS.raceDropdown,
      type: 'select',
      waitAfter: 400
    },
    demographicProvidedType: {
      selector: SELECTORS.demographicProvidedTypeDropdown,
      type: 'select',
      waitAfter: 400
    },
    
    // REO
    reoMarketValue: {
      selector: SELECTORS.reoMarketValueInput,
      type: 'input',
      waitAfter: 300,
      requiresEdit: true,
      editButtonSelector: SELECTORS.reoEditButton
    },
    
    // Personal
    email: {
      selector: SELECTORS.emailInput,
      type: 'input',
      waitAfter: 300,
      requiresEdit: true,
      editButtonSelector: SELECTORS.personalEditButton
    },
    ssn: {
      selector: SELECTORS.ssnInput,
      type: 'input',
      waitAfter: 300
    },
    dob: {
      selector: SELECTORS.dobInput,
      type: 'input',
      waitAfter: 300
    },
    
    // Address
    street: {
      selector: SELECTORS.streetInput,
      type: 'input',
      waitAfter: 300,
      requiresEdit: true,
      editButtonSelector: SELECTORS.addressEditButton
    },
    city: {
      selector: SELECTORS.cityInput,
      type: 'input',
      waitAfter: 300
    },
    state: {
      selector: SELECTORS.stateInput,
      type: 'select',
      waitAfter: 300
    },
    zip: {
      selector: SELECTORS.zipInput,
      type: 'input',
      waitAfter: 300
    },
    
    // HELOC
    noteRate: {
      selector: SELECTORS.noteRateInput,
      type: 'input',
      waitAfter: 300
    },
    aprFromCD: {
      selector: SELECTORS.aprFromCDInput,
      type: 'input',
      waitAfter: 300
    },
    cashOut: {
      selector: SELECTORS.cashOutInput,
      type: 'input',
      waitAfter: 300
    }
  };

  // ===== TIPOS DE DOCUMENTOS PDF =====

  const APPRAISAL_FILE_NAMES = [
    'AVM_Appraisal.pdf',
    'Residential_Evaluation.pdf',
    'Broker_Price_Opinion.pdf',
    'appraisal',
    'evaluation',
    'valuation',
    'BPO',
    'AVM'
  ];

  const CLOSING_DISCLOSURE_FILE_NAMES = [
    'Closing_Disclosure.pdf',
    'CD.pdf',
    'closing disclosure',
    'closing_disclosure',
    'closingdisclosure'
  ];

  const DEMOGRAPHIC_FILE_NAMES = [
    'Demographics.pdf',
    'Demographic_Information.pdf',
    'demographic',
    'demographics',
    'HMDA'
  ];

  // ===== FUNCIONES PÚBLICAS =====

  /**
   * Verifica si es un PDF de avalúo
   * @param {string} filename 
   * @returns {boolean}
   */
  function isAppraisalPDF(filename) {
    if (!filename) return false;
    
    const normalized = filename.toLowerCase();
    
    return APPRAISAL_FILE_NAMES.some(name => 
      normalized.includes(name.toLowerCase())
    );
  }

  /**
   * Verifica si es un Closing Disclosure
   * @param {string} filename 
   * @returns {boolean}
   */
  function isClosingDisclosurePDF(filename) {
    if (!filename) return false;
    
    const normalized = filename.toLowerCase();
    
    return CLOSING_DISCLOSURE_FILE_NAMES.some(name => 
      normalized.includes(name.toLowerCase())
    );
  }

  /**
   * Verifica si es un PDF demográfico
   * @param {string} filename 
   * @returns {boolean}
   */
  function isDemographicPDF(filename) {
    if (!filename) return false;
    
    const normalized = filename.toLowerCase();
    
    return DEMOGRAPHIC_FILE_NAMES.some(name => 
      normalized.includes(name.toLowerCase())
    );
  }

  /**
   * Clasifica tipo de PDF
   * @param {string} filename 
   * @returns {string} - 'appraisal', 'closing-disclosure', 'demographic', 'other'
   */
  function classifyPDF(filename) {
    if (isAppraisalPDF(filename)) return 'appraisal';
    if (isClosingDisclosurePDF(filename)) return 'closing-disclosure';
    if (isDemographicPDF(filename)) return 'demographic';
    return 'other';
  }

  /**
   * Obtiene configuración de campo por nombre
   * @param {string} fieldName 
   * @returns {Object|null}
   */
  function getFieldMapping(fieldName) {
    return FIELD_MAPPINGS[fieldName] || null;
  }

  /**
   * Obtiene selector por nombre
   * @param {string} selectorName 
   * @returns {string|null}
   */
  function getSelector(selectorName) {
    return SELECTORS[selectorName] || null;
  }

  /**
   * Obtiene todos los campos de una sección
   * @param {string} section - 'demographics', 'reo', 'personal', 'address', 'heloc'
   * @returns {Array}
   */
  function getFieldsBySection(section) {
    const sectionMap = {
      demographics: ['ethnicity', 'hispanicOrigin', 'gender', 'race', 'demographicProvidedType'],
      reo: ['reoMarketValue'],
      personal: ['email', 'ssn', 'dob'],
      address: ['street', 'city', 'state', 'zip'],
      heloc: ['noteRate', 'aprFromCD', 'cashOut']
    };
    
    const fieldNames = sectionMap[section] || [];
    
    return fieldNames.map(name => ({
      name,
      ...FIELD_MAPPINGS[name]
    }));
  }

  /**
   * Valida si un selector existe en el DOM
   * @param {string} selector 
   * @returns {boolean}
   */
  function selectorExists(selector) {
    try {
      // Manejar pseudo-selectores :contains()
      if (selector.includes(':contains(')) {
        const match = selector.match(/:contains\("([^"]+)"\)/);
        if (match) {
          const searchText = match[1];
          const baseSelector = selector.split(':contains')[0];
          const elements = document.querySelectorAll(baseSelector);
          
          for (const el of Array.from(elements)) {
            if (el.textContent && el.textContent.includes(searchText)) {
              return true;
            }
          }
          return false;
        }
      }
      
      // Intentar múltiples selectores separados por coma
      const selectors = selector.split(',').map(s => s.trim());
      
      for (const sel of selectors) {
        if (document.querySelector(sel)) {
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.warn('[FieldMapper] Error checking selector:', selector, error);
      return false;
    }
  }

  /**
   * Diagnóstico de selectores disponibles
   * @param {string} section 
   * @returns {Object}
   */
  function diagnoseSection(section) {
    const fields = getFieldsBySection(section);
    const results = {
      section,
      totalFields: fields.length,
      available: [],
      missing: []
    };
    
    fields.forEach(field => {
      if (selectorExists(field.selector)) {
        results.available.push(field.name);
      } else {
        results.missing.push(field.name);
      }
    });
    
    return results;
  }

  // ===== API PÚBLICA =====

  return {
    // Constantes
    SELECTORS,
    FIELD_MAPPINGS,
    APPRAISAL_FILE_NAMES,
    CLOSING_DISCLOSURE_FILE_NAMES,
    DEMOGRAPHIC_FILE_NAMES,
    
    // Funciones
    isAppraisalPDF,
    isClosingDisclosurePDF,
    isDemographicPDF,
    classifyPDF,
    getFieldMapping,
    getSelector,
    getFieldsBySection,
    selectorExists,
    diagnoseSection
  };

})();

console.log('[LPAuditor] FieldMapper cargado correctamente');
