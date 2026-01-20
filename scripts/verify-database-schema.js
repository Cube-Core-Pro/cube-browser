#!/usr/bin/env node
/**
 * Database Schema Verification Script
 * 
 * This script verifies that all 32 enterprise tables are created correctly
 * in the SQLite database.
 * 
 * Run with: node scripts/verify-database-schema.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Expected tables from database_schema.rs
const EXPECTED_TABLES = {
  // Core tables (from database.rs)
  core: [
    'settings',
    'api_keys', 
    'workflows',
    'profiles',
    'history',
    'selectors',
    'notes',
    'tasks',
    'note_categories'
  ],
  
  // Investor tables (8)
  investor: [
    'investors',
    'investments',
    'smart_contracts',
    'payout_schedule',
    'token_transactions',
    'investor_licenses',
    'investor_notifications',
    'investment_opportunities'
  ],
  
  // Affiliate tables (7)
  affiliate: [
    'affiliates',
    'affiliate_links',
    'referrals',
    'commissions',
    'affiliate_payouts',
    'white_label_configs',
    'marketing_materials'
  ],
  
  // SSO tables (6)
  sso: [
    'sso_providers',
    'sso_sessions',
    'ldap_configs',
    'ldap_groups',
    'ldap_users',
    'sso_audit_log'
  ],
  
  // Tenant tables (6)
  tenant: [
    'tenants',
    'tenant_users',
    'tenant_invitations',
    'tenant_roles',
    'tenant_audit_log',
    'tenant_usage'
  ],
  
  // Browser profile tables (5)
  browser_profile: [
    'browser_profiles',
    'browser_profile_sessions',
    'browser_profile_cookies',
    'browser_profile_storage',
    'browser_profile_sync'
  ]
};

// Get all expected tables as flat array
const ALL_TABLES = Object.values(EXPECTED_TABLES).flat();

// Database path
const getDbPath = () => {
  const platform = os.platform();
  const home = os.homedir();
  
  if (platform === 'darwin') {
    return path.join(home, 'Library/Application Support/com.cube-nexum.app/cubeelite.db');
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'com.cube-nexum.app/cubeelite.db');
  } else {
    return path.join(home, '.local/share/com.cube-nexum.app/cubeelite.db');
  }
};

const verifySchema = () => {
  console.log('🔍 CUBE Elite v6 - Database Schema Verification\n');
  console.log('=' .repeat(60));
  
  const dbPath = getDbPath();
  console.log(`\n📁 Database path: ${dbPath}\n`);
  
  // Check if database exists
  if (!fs.existsSync(dbPath)) {
    console.log('⚠️  Database file not found.');
    console.log('   The database will be created when the app starts.\n');
    console.log('   Expected tables to be created:\n');
    
    for (const [category, tables] of Object.entries(EXPECTED_TABLES)) {
      console.log(`   📦 ${category.toUpperCase()} (${tables.length} tables)`);
      tables.forEach(t => console.log(`      - ${t}`));
      console.log('');
    }
    
    console.log(`\n   Total: ${ALL_TABLES.length} tables\n`);
    return;
  }
  
  // Get existing tables using sqlite3
  try {
    const result = execSync(`sqlite3 "${dbPath}" ".tables"`, { encoding: 'utf8' });
    const existingTables = result.trim().split(/\s+/).filter(t => t.length > 0);
    
    console.log(`📊 Found ${existingTables.length} tables in database\n`);
    
    // Check each category
    let totalMissing = 0;
    let totalFound = 0;
    
    for (const [category, tables] of Object.entries(EXPECTED_TABLES)) {
      console.log(`📦 ${category.toUpperCase()}`);
      
      tables.forEach(table => {
        const exists = existingTables.includes(table);
        if (exists) {
          console.log(`   ✅ ${table}`);
          totalFound++;
        } else {
          console.log(`   ❌ ${table} (MISSING)`);
          totalMissing++;
        }
      });
      console.log('');
    }
    
    // Summary
    console.log('=' .repeat(60));
    console.log('\n📈 SUMMARY\n');
    console.log(`   Tables found:   ${totalFound}/${ALL_TABLES.length}`);
    console.log(`   Tables missing: ${totalMissing}`);
    
    if (totalMissing === 0) {
      console.log('\n✅ All tables verified successfully!\n');
    } else {
      console.log('\n⚠️  Some tables are missing. Please restart the app to create them.\n');
    }
    
    // Check indexes
    console.log('🔑 Checking indexes...\n');
    const indexes = execSync(`sqlite3 "${dbPath}" ".indexes"`, { encoding: 'utf8' });
    const indexList = indexes.trim().split('\n').filter(i => i.length > 0);
    console.log(`   Found ${indexList.length} indexes\n`);
    
    // Sample some important indexes
    const importantIndexes = [
      'idx_investments_investor',
      'idx_referrals_affiliate',
      'idx_sso_sessions_provider',
      'idx_tenant_users_tenant',
      'idx_browser_profiles_user'
    ];
    
    importantIndexes.forEach(idx => {
      const exists = indexList.includes(idx);
      console.log(`   ${exists ? '✅' : '❌'} ${idx}`);
    });
    
  } catch (error) {
    console.error('❌ Error reading database:', error.message);
    console.log('\n   Make sure sqlite3 is installed and the database is not locked.\n');
  }
};

// Check for foreign key constraints
const verifyForeignKeys = () => {
  const dbPath = getDbPath();
  
  if (!fs.existsSync(dbPath)) return;
  
  console.log('\n🔗 Checking foreign key constraints...\n');
  
  try {
    const fkStatus = execSync(`sqlite3 "${dbPath}" "PRAGMA foreign_keys;"`, { encoding: 'utf8' });
    const enabled = fkStatus.trim() === '1';
    console.log(`   Foreign keys: ${enabled ? '✅ Enabled' : '❌ Disabled'}\n`);
    
    // Check for FK violations
    const violations = execSync(`sqlite3 "${dbPath}" "PRAGMA foreign_key_check;"`, { encoding: 'utf8' });
    if (violations.trim()) {
      console.log('   ⚠️  Foreign key violations found:\n');
      console.log(violations);
    } else {
      console.log('   ✅ No foreign key violations\n');
    }
  } catch (error) {
    console.error('   ❌ Error checking foreign keys:', error.message);
  }
};

// Generate SQL to create missing tables
const generateMissingSql = () => {
  console.log('\n📝 To manually create tables, run the app or use:\n');
  console.log('   cargo run -- --init-db\n');
};

// Main
console.log('');
verifySchema();
verifyForeignKeys();
generateMissingSql();
