// ═══════════════════════════════════════════════════════════════════════════
// CUBE Chrome Extension - Field Validation
// ═══════════════════════════════════════════════════════════════════════════
// Comprehensive validation for form fields

/**
 * Validates email address
 * @param {string} email - Email to validate
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
function validateEmail(email) {
  const errors = [];
  const warnings = [];

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  if (email.length > 254) {
    errors.push('Email too long (max 254 characters)');
  }

  const [local, domain] = email.split('@');
  if (local && local.length > 64) {
    warnings.push('Local part is unusually long');
  }

  if (domain && !domain.includes('.')) {
    warnings.push('Domain should have a TLD');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates phone number (US and international)
 * @param {string} phone - Phone number to validate
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
function validatePhone(phone) {
  const errors = [];
  const warnings = [];

  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  if (!phoneRegex.test(phone)) {
    errors.push('Invalid phone format');
  }

  if (cleaned.length < 10) {
    errors.push('Phone number too short');
  }

  if (cleaned.length > 15) {
    errors.push('Phone number too long');
  }

  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    warnings.push('Consider adding country code');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates US Social Security Number
 * @param {string} ssn - SSN to validate
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
function validateSSN(ssn) {
  const errors = [];
  const warnings = [];

  const ssnRegex = /^(?:\d{3}-?\d{2}-?\d{4}|\d{9})$/;

  if (!ssnRegex.test(ssn)) {
    errors.push('Invalid SSN format (should be XXX-XX-XXXX)');
  }

  const cleaned = ssn.replace(/[-\s]/g, '');

  // Invalid SSN patterns
  if (cleaned.startsWith('000') || cleaned.startsWith('666') || cleaned.startsWith('9')) {
    errors.push('Invalid SSN number');
  }

  const middle = cleaned.substring(3, 5);
  if (middle === '00') {
    errors.push('Invalid SSN (middle section cannot be 00)');
  }

  const last = cleaned.substring(5);
  if (last === '0000') {
    errors.push('Invalid SSN (last section cannot be 0000)');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates US ZIP code
 * @param {string} zip - ZIP code to validate
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
function validateZipCode(zip) {
  const errors = [];
  const warnings = [];

  const zipRegex = /^[0-9]{5}(?:-[0-9]{4})?$/;

  if (!zipRegex.test(zip)) {
    errors.push('Invalid ZIP code format');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates URL
 * @param {string} url - URL to validate
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
function validateUrl(url) {
  const errors = [];
  const warnings = [];

  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

  if (!urlRegex.test(url)) {
    errors.push('Invalid URL format');
  }

  if (!url.startsWith('https://')) {
    warnings.push('Consider using HTTPS for security');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates credit card number using Luhn algorithm
 * @param {string} cardNumber - Credit card number
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
function validateCreditCard(cardNumber) {
  const errors = [];
  const warnings = [];

  const cleaned = cardNumber.replace(/[\s\-]/g, '');

  if (!/^\d{13,19}$/.test(cleaned)) {
    errors.push('Invalid card number length');
    return { valid: false, errors, warnings };
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    errors.push('Invalid card number (failed Luhn check)');
  }

  // Card type detection
  if (cleaned.startsWith('4')) {
    warnings.push('Detected: Visa');
  } else if (cleaned.startsWith('5')) {
    warnings.push('Detected: Mastercard');
  } else if (cleaned.startsWith('3')) {
    warnings.push('Detected: American Express');
  } else if (cleaned.startsWith('6')) {
    warnings.push('Detected: Discover');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates currency amount
 * @param {string} value - Currency value to validate
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
function validateCurrency(value) {
  const errors = [];
  const warnings = [];

  const cleaned = value.replace(/[$,\s]/g, '');

  if (isNaN(Number(cleaned))) {
    errors.push('Invalid currency amount');
  }

  const num = Number(cleaned);
  if (num < 0) {
    warnings.push('Negative amount');
  }

  if (cleaned.includes('.')) {
    const decimals = cleaned.split('.')[1];
    if (decimals && decimals.length > 2) {
      warnings.push('More than 2 decimal places');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates date
 * @param {string} value - Date string to validate
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
function validateDate(value) {
  const errors = [];
  const warnings = [];

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push('Invalid date format');
  } else {
    // Check if date is in the future
    if (date > new Date()) {
      warnings.push('Date is in the future');
    }

    // Check if date is too old (more than 150 years)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 150);
    if (date < minDate) {
      warnings.push('Date is more than 150 years ago');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates number
 * @param {string} value - Number string to validate
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
function validateNumber(value) {
  const errors = [];
  const warnings = [];

  if (isNaN(Number(value))) {
    errors.push('Invalid number');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Generic validator that routes to specific validators
 * @param {string} type - Field type
 * @param {string} value - Value to validate
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
function validate(type, value) {
  if (!value || value.trim() === '') {
    return { valid: true, errors: [], warnings: [] };
  }

  switch (type.toLowerCase()) {
    case 'email':
      return validateEmail(value);
    case 'phone':
    case 'tel':
      return validatePhone(value);
    case 'ssn':
      return validateSSN(value);
    case 'zip':
    case 'zipcode':
      return validateZipCode(value);
    case 'url':
      return validateUrl(value);
    case 'creditcard':
    case 'cc':
      return validateCreditCard(value);
    case 'currency':
    case 'money':
      return validateCurrency(value);
    case 'date':
      return validateDate(value);
    case 'number':
      return validateNumber(value);
    default:
      return { valid: true, errors: [], warnings: [] };
  }
}

/**
 * Checks if value passes all validation rules
 * @param {string} value - Value to validate
 * @param {string[]} rules - Validation rules
 * @returns {boolean} - True if valid
 */
function isValid(value, rules) {
  for (const rule of rules) {
    const result = validate(rule, value);
    if (!result.valid) return false;
  }
  return true;
}
