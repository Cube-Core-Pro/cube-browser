// 🧪 Automated Chrome Extension Testing with Playwright
// Version: 5.2.0
// Date: October 19, 2025

import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

// Extension path
const EXTENSION_PATH = path.join(__dirname, '../chrome-extension');

// Test data files
const TEST_DATA_DIR = path.join(__dirname, 'test-data');

test.describe('CUBE OmniFill v5.2 - Automated Tests', () => {
  let browser;
  let context;
  let page;

  test.beforeAll(async () => {
    // Launch Chrome with extension loaded
    browser = await chromium.launchPersistentContext('', {
      headless: false, // Extension requires headed mode
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
      ],
    });

    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  // ====================
  // Test 1: Extension Loaded
  // ====================
  test('Extension loads successfully', async () => {
    // Navigate to extension page
    await page.goto('chrome://extensions');
    
    // Verify extension is loaded
    const extensions = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('extensions-item')).map(ext => ({
        name: ext.getAttribute('name'),
        version: ext.getAttribute('version'),
      }));
    });

    const cubeExtension = extensions.find(ext => ext.name.includes('CUBE'));
    expect(cubeExtension).toBeDefined();
    expect(cubeExtension.version).toBe('5.2.0');

    console.log('✅ Extension loaded:', cubeExtension);
  });

  // ====================
  // Test 2: Modules Loaded
  // ====================
  test('All JavaScript modules load correctly', async () => {
    // Navigate to test page
    await page.goto('https://docs.google.com/forms/create');
    await page.waitForLoadState('networkidle');

    // Check if modules are loaded in content script context
    const modules = await page.evaluate(() => {
      return {
        XLSX: typeof window.XLSX !== 'undefined',
        pdfjsLib: typeof window.pdfjsLib !== 'undefined',
        SimilarityModule: typeof window.SimilarityModule !== 'undefined',
        ValidationModule: typeof window.ValidationModule !== 'undefined',
        DocumentParser: typeof window.DocumentParser !== 'undefined',
        CUBEExtensions: typeof window.CUBEExtensions !== 'undefined',
      };
    });

    console.log('📦 Modules loaded:', modules);

    expect(modules.XLSX).toBeTruthy();
    expect(modules.pdfjsLib).toBeTruthy();
    expect(modules.SimilarityModule).toBeTruthy();
    expect(modules.ValidationModule).toBeTruthy();
    expect(modules.DocumentParser).toBeTruthy();
    expect(modules.CUBEExtensions).toBeTruthy();
  });

  // ====================
  // Test 3: Excel Parsing
  // ====================
  test('Parse Excel file correctly', async () => {
    await page.goto('about:blank');

    // Create test Excel data
    const testData = await page.evaluate(() => {
      // Create simple workbook
      const wb = window.XLSX.utils.book_new();
      const data = [
        ['First Name', 'John'],
        ['Last Name', 'Smith'],
        ['Email', 'john.smith@example.com'],
        ['Phone', '555-123-4567'],
        ['SSN', '123-45-6789'],
      ];
      const ws = window.XLSX.utils.aoa_to_sheet(data);
      window.XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      // Convert to binary string
      const wbout = window.XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
      
      // Convert to Uint8Array
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
      }

      // Create File object
      const blob = new Blob([view], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file = new File([blob], 'test-data.xlsx', { type: blob.type });

      // Parse with DocumentParser
      return window.DocumentParser.parseDocument(file);
    });

    expect(testData.success).toBeTruthy();
    expect(testData.format).toBe('XLSX');
    expect(testData.data).toBeDefined();
    expect(testData.data['First Name']).toBe('John');
    expect(testData.data['Email']).toBe('john.smith@example.com');

    console.log('✅ Excel parsed:', testData);
  });

  // ====================
  // Test 4: Field Matching (Levenshtein)
  // ====================
  test('Field matching works with variations', async () => {
    await page.goto('about:blank');

    const matchTests = await page.evaluate(() => {
      const results = [];

      // Test exact match
      const exact = window.SimilarityModule.similarity('firstName', 'firstName');
      results.push({ test: 'exact', score: exact, expected: 1.0 });

      // Test case insensitive
      const caseInsensitive = window.SimilarityModule.similarity('firstName', 'FIRSTNAME');
      results.push({ test: 'case-insensitive', score: caseInsensitive, expected: 1.0 });

      // Test underscore
      const underscore = window.SimilarityModule.similarity('firstName', 'first_name');
      results.push({ test: 'underscore', score: underscore, expected: 0.85 });

      // Test typo
      const typo = window.SimilarityModule.similarity('firstName', 'fristName');
      results.push({ test: 'typo', score: typo, expected: 0.70 });

      // Test unrelated
      const unrelated = window.SimilarityModule.similarity('firstName', 'emailAddress');
      results.push({ test: 'unrelated', score: unrelated, expected: 0.30 });

      return results;
    });

    console.log('🔍 Field matching results:', matchTests);

    // Verify results
    const exact = matchTests.find(t => t.test === 'exact');
    expect(exact.score).toBe(1.0);

    const caseInsensitive = matchTests.find(t => t.test === 'case-insensitive');
    expect(caseInsensitive.score).toBe(1.0);

    const underscore = matchTests.find(t => t.test === 'underscore');
    expect(underscore.score).toBeGreaterThanOrEqual(0.80);

    const typo = matchTests.find(t => t.test === 'typo');
    expect(typo.score).toBeGreaterThanOrEqual(0.60);

    const unrelated = matchTests.find(t => t.test === 'unrelated');
    expect(unrelated.score).toBeLessThan(0.40);
  });

  // ====================
  // Test 5: Email Validation
  // ====================
  test('Email validation works correctly', async () => {
    await page.goto('about:blank');

    const validationTests = await page.evaluate(() => {
      return {
        valid: window.ValidationModule.validate('email', 'test@example.com'),
        invalid: window.ValidationModule.validate('email', 'invalid-email'),
        missingAt: window.ValidationModule.validate('email', 'testexample.com'),
        missingDomain: window.ValidationModule.validate('email', 'test@'),
      };
    });

    console.log('📧 Email validation:', validationTests);

    expect(validationTests.valid.valid).toBeTruthy();
    expect(validationTests.invalid.valid).toBeFalsy();
    expect(validationTests.missingAt.valid).toBeFalsy();
    expect(validationTests.missingDomain.valid).toBeFalsy();
  });

  // ====================
  // Test 6: Phone Validation
  // ====================
  test('Phone validation works correctly', async () => {
    await page.goto('about:blank');

    const phoneTests = await page.evaluate(() => {
      return {
        formatted: window.ValidationModule.validate('phone', '(555) 123-4567'),
        plain: window.ValidationModule.validate('phone', '5551234567'),
        dashes: window.ValidationModule.validate('phone', '555-123-4567'),
        invalid: window.ValidationModule.validate('phone', '12345'),
      };
    });

    console.log('📱 Phone validation:', phoneTests);

    expect(phoneTests.formatted.valid).toBeTruthy();
    expect(phoneTests.plain.valid).toBeTruthy();
    expect(phoneTests.dashes.valid).toBeTruthy();
    expect(phoneTests.invalid.valid).toBeFalsy();
  });

  // ====================
  // Test 7: Credit Card (Luhn Algorithm)
  // ====================
  test('Luhn algorithm validates credit cards', async () => {
    await page.goto('about:blank');

    const luhnTests = await page.evaluate(() => {
      return {
        visa: window.ValidationModule.validate('creditCard', '4532015112830366'),
        mastercard: window.ValidationModule.validate('creditCard', '5425233430109903'),
        amex: window.ValidationModule.validate('creditCard', '374245455400126'),
        invalid: window.ValidationModule.validate('creditCard', '4532015112830367'),
        tooShort: window.ValidationModule.validate('creditCard', '1234'),
      };
    });

    console.log('💳 Luhn validation:', luhnTests);

    expect(luhnTests.visa.valid).toBeTruthy();
    expect(luhnTests.mastercard.valid).toBeTruthy();
    expect(luhnTests.amex.valid).toBeTruthy();
    expect(luhnTests.invalid.valid).toBeFalsy();
    expect(luhnTests.tooShort.valid).toBeFalsy();
  });

  // ====================
  // Test 8: SSN Validation
  // ====================
  test('SSN validation works correctly', async () => {
    await page.goto('about:blank');

    const ssnTests = await page.evaluate(() => {
      return {
        valid: window.ValidationModule.validate('ssn', '123-45-6789'),
        validNoHyphens: window.ValidationModule.validate('ssn', '123456789'),
        invalid: window.ValidationModule.validate('ssn', '123-45-678'),
        invalidChars: window.ValidationModule.validate('ssn', '12a-45-6789'),
      };
    });

    console.log('🔢 SSN validation:', ssnTests);

    expect(ssnTests.valid.valid).toBeTruthy();
    expect(ssnTests.validNoHyphens.valid).toBeTruthy();
    expect(ssnTests.invalid.valid).toBeFalsy();
    expect(ssnTests.invalidChars.valid).toBeFalsy();
  });

  // ====================
  // Test 9: CSV Parsing
  // ====================
  test('Parse CSV file correctly', async () => {
    await page.goto('about:blank');

    const csvData = await page.evaluate(() => {
      const csvContent = 'Name,Email,Phone\nJohn Smith,john@example.com,555-1234';
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });

      return window.DocumentParser.parseDocument(file);
    });

    expect(csvData.success).toBeTruthy();
    expect(csvData.format).toBe('CSV');
    expect(csvData.data).toBeDefined();

    console.log('✅ CSV parsed:', csvData);
  });

  // ====================
  // Test 10: Error Handling
  // ====================
  test('Handle invalid file gracefully', async () => {
    await page.goto('about:blank');

    const errorTest = await page.evaluate(async () => {
      try {
        const blob = new Blob(['invalid data'], { type: 'text/plain' });
        const file = new File([blob], 'test.txt', { type: 'text/plain' });

        const result = await window.DocumentParser.parseDocument(file);
        return { error: false, result };
      } catch (error) {
        return { error: true, message: error.message };
      }
    });

    console.log('❌ Error handling:', errorTest);

    // Should either return success: false or throw error
    if (errorTest.error) {
      expect(errorTest.message).toBeDefined();
    } else {
      expect(errorTest.result.success).toBeFalsy();
    }
  });

  // ====================
  // Test 11: Performance
  // ====================
  test('Parse large Excel file in <5 seconds', async () => {
    await page.goto('about:blank');

    const performanceTest = await page.evaluate(() => {
      // Create large workbook (1000 rows)
      const wb = window.XLSX.utils.book_new();
      const data = [['Name', 'Email', 'Phone']];
      
      for (let i = 0; i < 1000; i++) {
        data.push([`User ${i}`, `user${i}@example.com`, `555-${i.toString().padStart(4, '0')}`]);
      }

      const ws = window.XLSX.utils.aoa_to_sheet(data);
      window.XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      const wbout = window.XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
      }

      const blob = new Blob([view], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file = new File([blob], 'large-data.xlsx', { type: blob.type });

      // Measure parse time
      const startTime = performance.now();
      const result = window.DocumentParser.parseDocument(file);
      const endTime = performance.now();

      return {
        success: result.success,
        parseTime: endTime - startTime,
        rowCount: Object.keys(result.data || {}).length,
      };
    });

    console.log('⚡ Performance:', performanceTest);

    expect(performanceTest.success).toBeTruthy();
    expect(performanceTest.parseTime).toBeLessThan(5000); // <5 seconds
    expect(performanceTest.rowCount).toBeGreaterThan(0);
  });

  // ====================
  // Test 12: Memory Usage
  // ====================
  test('Memory usage stays reasonable', async () => {
    await page.goto('about:blank');

    const memoryTest = await page.evaluate(() => {
      const before = performance.memory ? performance.memory.usedJSHeapSize : 0;

      // Create multiple large workbooks
      for (let i = 0; i < 10; i++) {
        const wb = window.XLSX.utils.book_new();
        const data = Array.from({ length: 100 }, (_, j) => [`Row ${j}`, `Data ${j}`]);
        const ws = window.XLSX.utils.aoa_to_sheet(data);
        window.XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      }

      const after = performance.memory ? performance.memory.usedJSHeapSize : 0;

      return {
        before: Math.round(before / 1024 / 1024), // MB
        after: Math.round(after / 1024 / 1024), // MB
        increase: Math.round((after - before) / 1024 / 1024), // MB
      };
    });

    console.log('💾 Memory usage:', memoryTest);

    expect(memoryTest.increase).toBeLessThan(100); // <100 MB increase
  });
});

// ====================
// Test Summary
// ====================
test.afterAll(async ({ }, testInfo) => {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testInfo.workerIndex + 1}`);
  console.log(`Status: ${testInfo.status}`);
  console.log(`Duration: ${testInfo.duration}ms`);
  console.log('='.repeat(60));
});
