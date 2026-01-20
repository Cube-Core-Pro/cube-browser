#!/usr/bin/env node
/**
 * CUBE Nexum Elite - Translation Utility Script
 * 
 * This script helps manage translations for the application.
 * 
 * Usage:
 *   node scripts/translate.js check          - Check all translation files for completeness
 *   node scripts/translate.js generate <lang> - Generate a translation template
 *   node scripts/translate.js compare <lang>  - Compare translation with English
 * 
 * Supported languages: en, es, de, fr, it, pt, ja, ko, zh, ar, ru, tr
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const SUPPORTED_LANGUAGES = ['en', 'es', 'de', 'fr', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'ru', 'tr'];

// Language display names
const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish (Español)',
  de: 'German (Deutsch)',
  fr: 'French (Français)',
  it: 'Italian (Italiano)',
  pt: 'Portuguese (Português)',
  ja: 'Japanese (日本語)',
  ko: 'Korean (한국어)',
  zh: 'Chinese (中文)',
  ar: 'Arabic (العربية)',
  ru: 'Russian (Русский)',
  tr: 'Turkish (Türkçe)'
};

/**
 * Get all keys from a nested object
 */
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Check all translation files for completeness
 */
function checkTranslations() {
  console.log('\\n📊 Translation Status Report\\n');
  console.log('='.repeat(60));

  // Load English as reference
  const enPath = path.join(LOCALES_DIR, 'en.json');
  if (!fs.existsSync(enPath)) {
    console.error('❌ Error: English translation (en.json) not found!');
    process.exit(1);
  }

  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const enKeys = getAllKeys(enData);
  const enKeyCount = enKeys.length;

  console.log(`Reference: English (${enKeyCount} keys)\\n`);

  const results = [];

  for (const lang of SUPPORTED_LANGUAGES) {
    const filePath = path.join(LOCALES_DIR, `${lang}.json`);
    
    if (!fs.existsSync(filePath)) {
      results.push({
        lang,
        name: LANGUAGE_NAMES[lang],
        status: '❌ Missing',
        keys: 0,
        percentage: 0
      });
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const keys = getAllKeys(data);
      const percentage = Math.round((keys.length / enKeyCount) * 100);

      let status;
      if (percentage >= 100) {
        status = '✅ Complete';
      } else if (percentage >= 75) {
        status = '🟡 Mostly Complete';
      } else if (percentage >= 50) {
        status = '🟠 Partial';
      } else {
        status = '🔴 Incomplete';
      }

      results.push({
        lang,
        name: LANGUAGE_NAMES[lang],
        status,
        keys: keys.length,
        percentage
      });
    } catch (error) {
      results.push({
        lang,
        name: LANGUAGE_NAMES[lang],
        status: '❌ Invalid JSON',
        keys: 0,
        percentage: 0
      });
    }
  }

  // Print results
  for (const result of results) {
    console.log(`${result.status} ${result.name}`);
    console.log(`   File: ${result.lang}.json`);
    console.log(`   Keys: ${result.keys}/${enKeyCount} (${result.percentage}%)`);
    console.log('');
  }

  // Summary
  const complete = results.filter(r => r.percentage >= 100).length;
  const partial = results.filter(r => r.percentage > 0 && r.percentage < 100).length;
  const missing = results.filter(r => r.percentage === 0).length;

  console.log('='.repeat(60));
  console.log(`\\n📈 Summary:`);
  console.log(`   ✅ Complete: ${complete}/${SUPPORTED_LANGUAGES.length}`);
  console.log(`   🟡 Partial: ${partial}/${SUPPORTED_LANGUAGES.length}`);
  console.log(`   ❌ Missing: ${missing}/${SUPPORTED_LANGUAGES.length}`);
  console.log('');
}

/**
 * Find missing keys in a translation
 */
function compareTranslation(lang) {
  const enPath = path.join(LOCALES_DIR, 'en.json');
  const langPath = path.join(LOCALES_DIR, `${lang}.json`);

  if (!fs.existsSync(enPath)) {
    console.error('❌ Error: English translation not found!');
    process.exit(1);
  }

  if (!fs.existsSync(langPath)) {
    console.error(`❌ Error: Translation file ${lang}.json not found!`);
    process.exit(1);
  }

  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));

  const enKeys = getAllKeys(enData);
  const langKeys = new Set(getAllKeys(langData));

  const missingKeys = enKeys.filter(key => !langKeys.has(key));
  const extraKeys = [...langKeys].filter(key => !enKeys.includes(key));

  console.log(`\\n📊 Comparison: ${LANGUAGE_NAMES[lang]} vs English\\n`);
  console.log('='.repeat(60));

  if (missingKeys.length === 0) {
    console.log('✅ No missing keys!');
  } else {
    console.log(`\\n❌ Missing keys (${missingKeys.length}):\\n`);
    for (const key of missingKeys.slice(0, 20)) {
      console.log(`   - ${key}`);
    }
    if (missingKeys.length > 20) {
      console.log(`   ... and ${missingKeys.length - 20} more`);
    }
  }

  if (extraKeys.length > 0) {
    console.log(`\\n⚠️  Extra keys (${extraKeys.length}):\\n`);
    for (const key of extraKeys.slice(0, 10)) {
      console.log(`   + ${key}`);
    }
    if (extraKeys.length > 10) {
      console.log(`   ... and ${extraKeys.length - 10} more`);
    }
  }

  console.log('');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    console.log(`
CUBE Nexum Elite - Translation Utility

Commands:
  check              Check all translation files for completeness
  compare <lang>     Compare a translation with English
  
Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}
`);
    return;
  }

  switch (command) {
    case 'check':
      checkTranslations();
      break;
    case 'compare':
      const lang = args[1];
      if (!lang || !SUPPORTED_LANGUAGES.includes(lang)) {
        console.error(`Error: Please specify a valid language (${SUPPORTED_LANGUAGES.join(', ')})`);
        process.exit(1);
      }
      compareTranslation(lang);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run with "help" for available commands');
      process.exit(1);
  }
}

main();
