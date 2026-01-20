#!/usr/bin/env node

/**
 * CUBE Elite v6 - OpenAI API Test Script
 * Tests the OpenAI integration with real API key
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ============================================
// Configuration
// ============================================

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.DEFAULT_AI_MODEL || 'gpt-4o-mini';

if (!API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env file');
  process.exit(1);
}

if (!API_KEY.startsWith('sk-')) {
  console.error('❌ Invalid OPENAI_API_KEY format (should start with sk-)');
  process.exit(1);
}

// ============================================
// OpenAI Client
// ============================================

const openai = new OpenAI({
  apiKey: API_KEY,
});

// ============================================
// Test Functions
// ============================================

async function testConnection() {
  console.log('\n📡 Test 1: API Connection');
  console.log('─'.repeat(50));

  try {
    const models = await openai.models.list();
    console.log('✅ Successfully connected to OpenAI API');
    console.log(`📋 Available models: ${models.data.length}`);
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function testChatCompletion() {
  console.log('\n💬 Test 2: Chat Completion');
  console.log('─'.repeat(50));

  try {
    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for CUBE Elite v6, a professional browser automation tool.',
        },
        {
          role: 'user',
          content: 'What is 2+2? Answer in one word.',
        },
      ],
      max_tokens: 10,
    });

    const duration = Date.now() - startTime;
    const result = response.choices[0].message.content;

    console.log('✅ Chat completion successful');
    console.log(`📝 Response: "${result}"`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`🔢 Tokens used: ${response.usage?.total_tokens || 'N/A'}`);
    console.log(`💰 Est. cost: $${calculateCost(response.usage?.total_tokens || 0)}`);

    return true;
  } catch (error) {
    console.error('❌ Chat completion failed:', error.message);
    return false;
  }
}

async function testSelectorGeneration() {
  console.log('\n🎯 Test 3: CSS Selector Generation');
  console.log('─'.repeat(50));

  try {
    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert at generating CSS selectors for web scraping.
Return ONLY a valid CSS selector, nothing else.`,
        },
        {
          role: 'user',
          content: `Generate a CSS selector to find all product prices on an e-commerce page.
The prices are typically in elements with class "price" or data attribute "data-price".
Return only the selector.`,
        },
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    const duration = Date.now() - startTime;
    const selector = response.choices[0].message.content?.trim() || '';

    console.log('✅ Selector generation successful');
    console.log(`🎯 Generated selector: ${selector}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`🔢 Tokens used: ${response.usage?.total_tokens || 'N/A'}`);
    console.log(`💰 Est. cost: $${calculateCost(response.usage?.total_tokens || 0)}`);

    return true;
  } catch (error) {
    console.error('❌ Selector generation failed:', error.message);
    return false;
  }
}

async function testStreamingResponse() {
  console.log('\n🌊 Test 4: Streaming Response');
  console.log('─'.repeat(50));

  try {
    const startTime = Date.now();

    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: 'Count from 1 to 5, each number on a new line.',
        },
      ],
      max_tokens: 50,
      stream: true,
    });

    let fullResponse = '';
    process.stdout.write('📝 Response: ');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content);
      fullResponse += content;
    }

    const duration = Date.now() - startTime;

    console.log('\n✅ Streaming completed');
    console.log(`⏱️  Duration: ${duration}ms`);

    return true;
  } catch (error) {
    console.error('\n❌ Streaming failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🛡️  Test 5: Error Handling');
  console.log('─'.repeat(50));

  try {
    await openai.chat.completions.create({
      model: 'invalid-model-name',
      messages: [{ role: 'user', content: 'test' }],
    });

    console.log('❌ Error handling test failed - should have thrown error');
    return false;
  } catch (error) {
    if (error.status === 404 || error.message.includes('model')) {
      console.log('✅ Error handling works correctly');
      console.log(`📋 Error type: ${error.constructor.name}`);
      console.log(`📄 Error message: ${error.message.substring(0, 100)}...`);
      return true;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function testRateLimiting() {
  console.log('\n⚡ Test 6: Rate Limiting & Performance');
  console.log('─'.repeat(50));

  try {
    const requests = 3;
    const startTime = Date.now();

    const promises = Array(requests)
      .fill(null)
      .map((_, i) =>
        openai.chat.completions.create({
          model: MODEL,
          messages: [{ role: 'user', content: `Say "${i + 1}"` }],
          max_tokens: 5,
        })
      );

    const responses = await Promise.all(promises);
    const duration = Date.now() - startTime;
    const avgDuration = duration / requests;

    console.log(`✅ Processed ${requests} concurrent requests`);
    console.log(`⏱️  Total duration: ${duration}ms`);
    console.log(`📊 Average per request: ${avgDuration.toFixed(0)}ms`);
    console.log(`🔢 Total tokens: ${responses.reduce((sum, r) => sum + (r.usage?.total_tokens || 0), 0)}`);

    return true;
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error.message);
    return false;
  }
}

// ============================================
// Utility Functions
// ============================================

function calculateCost(tokens) {
  // GPT-4o-mini pricing (as of Dec 2024)
  // Input: $0.15 / 1M tokens
  // Output: $0.60 / 1M tokens
  // Simplified: average $0.30 / 1M tokens
  const costPerToken = 0.30 / 1_000_000;
  const cost = tokens * costPerToken;
  return cost.toFixed(6);
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('    CUBE Elite v6 - OpenAI API Test Suite');
  console.log('═'.repeat(50));
  console.log(`🔑 API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`🤖 Model: ${MODEL}`);
  console.log('═'.repeat(50));

  const results = {
    connection: false,
    chatCompletion: false,
    selectorGeneration: false,
    streaming: false,
    errorHandling: false,
    rateLimiting: false,
  };

  // Run tests sequentially to avoid rate limiting
  results.connection = await testConnection();

  if (results.connection) {
    results.chatCompletion = await testChatCompletion();
    results.selectorGeneration = await testSelectorGeneration();
    results.streaming = await testStreamingResponse();
    results.errorHandling = await testErrorHandling();
    results.rateLimiting = await testRateLimiting();
  }

  // Summary
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('                  Test Summary');
  console.log('═'.repeat(50));

  const tests = [
    ['API Connection', results.connection],
    ['Chat Completion', results.chatCompletion],
    ['Selector Generation', results.selectorGeneration],
    ['Streaming Response', results.streaming],
    ['Error Handling', results.errorHandling],
    ['Rate Limiting', results.rateLimiting],
  ];

  tests.forEach(([name, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${name}`);
  });

  const totalTests = tests.length;
  const passedTests = tests.filter(([, passed]) => passed).length;
  const percentage = ((passedTests / totalTests) * 100).toFixed(0);

  console.log('─'.repeat(50));
  console.log(`Result: ${passedTests}/${totalTests} tests passed (${percentage}%)`);
  console.log('═'.repeat(50));
  console.log('');

  // Exit code
  const allPassed = passedTests === totalTests;
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
