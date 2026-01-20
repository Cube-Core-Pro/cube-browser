#!/usr/bin/env node
// ============================================================================
// CSS Theme Migration Script for CUBE Nexum
// ============================================================================
// Converts hardcoded hex colors to CSS variables
// Preserves fallback values where already present
// 
// Usage: node scripts/migrate-css-colors.js [--dry-run] [--file=path]
// ============================================================================

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Color to variable mappings based on globals.css
const COLOR_MAPPINGS = {
  // Backgrounds
  '#f8fafc': 'var(--bg-primary, #f8fafc)',
  '#ffffff': 'var(--bg-secondary, #ffffff)',
  '#f1f5f9': 'var(--bg-tertiary, #f1f5f9)',
  '#e2e8f0': 'var(--bg-hover, #e2e8f0)',
  '#0f0f12': 'var(--bg-primary, #0f0f12)',
  '#1a1a24': 'var(--bg-secondary, #1a1a24)',
  '#252532': 'var(--bg-tertiary, #252532)',
  '#0a0a0f': 'var(--bg-primary, #0a0a0f)',
  '#18181b': 'var(--bg-secondary, #18181b)',
  '#1e293b': 'var(--bg-elevated, #1e293b)',
  
  // Text colors
  '#0f172a': 'var(--text-primary, #0f172a)',
  '#1f2937': 'var(--text-primary, #1f2937)',
  '#475569': 'var(--text-secondary, #475569)',
  '#4b5563': 'var(--text-secondary, #4b5563)',
  '#64748b': 'var(--text-tertiary, #64748b)',
  '#6b7280': 'var(--text-muted, #6b7280)',
  '#94a3b8': 'var(--text-muted, #94a3b8)',
  '#9ca3af': 'var(--text-secondary, #9ca3af)',
  '#71717a': 'var(--text-muted, #71717a)',
  '#a1a1aa': 'var(--text-secondary, #a1a1aa)',
  '#fafafa': 'var(--text-primary, #fafafa)',
  '#f3f4f6': 'var(--bg-tertiary, #f3f4f6)',
  
  // Border colors
  '#e5e7eb': 'var(--border-primary, #e5e7eb)',
  '#cbd5e1': 'var(--border-secondary, #cbd5e1)',
  '#d1d5db': 'var(--border-primary, #d1d5db)',
  '#374151': 'var(--border-primary, #374151)',
  '#4b5563': 'var(--border-secondary, #4b5563)',
  '#27272a': 'var(--border-primary, #27272a)',
  
  // Brand/Accent colors
  '#6366f1': 'var(--color-accent, #6366f1)',
  '#818cf8': 'var(--color-accent-400, #818cf8)',
  '#4f46e5': 'var(--color-accent-hover, #4f46e5)',
  '#8b5cf6': 'var(--brand-secondary, #8b5cf6)',
  '#a855f7': 'var(--purple-500, #a855f7)',
  
  // Semantic colors - Success
  '#059669': 'var(--color-success, #059669)',
  '#10b981': 'var(--color-success, #10b981)',
  '#22c55e': 'var(--color-success, #22c55e)',
  '#065f46': 'var(--color-success-dark, #065f46)',
  '#16a34a': 'var(--color-success, #16a34a)',
  
  // Semantic colors - Error/Danger
  '#dc2626': 'var(--color-error, #dc2626)',
  '#ef4444': 'var(--color-error, #ef4444)',
  '#f87171': 'var(--color-error-light, #f87171)',
  '#b91c1c': 'var(--color-error-dark, #b91c1c)',
  
  // Semantic colors - Warning
  '#d97706': 'var(--color-warning, #d97706)',
  '#f59e0b': 'var(--color-warning, #f59e0b)',
  '#eab308': 'var(--color-warning, #eab308)',
  '#f97316': 'var(--color-warning-bright, #f97316)',
  
  // Semantic colors - Info
  '#3b82f6': 'var(--color-info, #3b82f6)',
  '#60a5fa': 'var(--color-info-light, #60a5fa)',
  '#2563eb': 'var(--color-info-dark, #2563eb)',
  '#1d4ed8': 'var(--color-info-darker, #1d4ed8)',
};

// Patterns to skip (already using variables or special cases)
const SKIP_PATTERNS = [
  /var\(--[^)]+\)/,  // Already using CSS variables
  /url\([^)]+\)/,     // URLs
  /linear-gradient/,  // Gradients (partial skip)
  /radial-gradient/,  // Gradients
];

// Stats for reporting
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  colorsReplaced: 0,
  errors: [],
};

// Check if a line should be skipped
function shouldSkipLine(line) {
  // If line already has var() for this color, skip
  if (line.includes('var(--') && line.includes('#')) {
    // Check if it's a fallback value (already correct)
    const varMatch = line.match(/var\(--[^,]+,\s*#[0-9a-fA-F]{3,6}\)/);
    if (varMatch) return true;
  }
  return false;
}

// Process a single CSS file
function processCSSFile(filePath, dryRun = false) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = content;
    let changeCount = 0;
    
    // Process each color mapping
    for (const [hexColor, cssVar] of Object.entries(COLOR_MAPPINGS)) {
      // Create regex for the hex color (case insensitive, word boundary)
      const hexRegex = new RegExp(
        `(?<!var\\([^)]*)(${hexColor})(?![0-9a-fA-F])`,
        'gi'
      );
      
      // Count matches before replacement
      const matches = modified.match(hexRegex);
      if (matches) {
        // Only replace if not already inside a var() with this as fallback
        const lines = modified.split('\n');
        const newLines = lines.map(line => {
          if (shouldSkipLine(line)) return line;
          
          // Replace the color with the variable
          const newLine = line.replace(hexRegex, cssVar);
          if (newLine !== line) changeCount++;
          return newLine;
        });
        modified = newLines.join('\n');
      }
    }
    
    // Additional: Convert standalone colors in known patterns
    // e.g., "color: #abc123;" -> "color: var(--some-var, #abc123);"
    // This is a more aggressive replacement for unmapped colors
    
    if (changeCount > 0) {
      stats.colorsReplaced += changeCount;
      stats.filesModified++;
      
      if (!dryRun) {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log(`✓ ${filePath}: ${changeCount} replacements`);
      } else {
        console.log(`[DRY RUN] ${filePath}: ${changeCount} would be replaced`);
      }
    }
    
    stats.filesProcessed++;
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`✗ Error processing ${filePath}: ${error.message}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const singleFile = args.find(a => a.startsWith('--file='));
  
  console.log('============================================');
  console.log('CUBE Nexum CSS Theme Migration');
  console.log('============================================');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');
  
  if (singleFile) {
    // Process single file
    const filePath = singleFile.replace('--file=', '');
    processCSSFile(filePath, dryRun);
  } else {
    // Process all CSS files
    const patterns = [
      'app/**/*.css',
      'components/**/*.css',
      'src/**/*.css',
      'chrome-extension/**/*.css',
    ];
    
    for (const pattern of patterns) {
      const files = await glob(pattern, { 
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        nodir: true 
      });
      
      console.log(`Processing pattern: ${pattern} (${files.length} files)`);
      
      for (const file of files) {
        processCSSFile(file, dryRun);
      }
    }
  }
  
  // Print summary
  console.log('');
  console.log('============================================');
  console.log('Migration Summary');
  console.log('============================================');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Colors replaced: ${stats.colorsReplaced}`);
  
  if (stats.errors.length > 0) {
    console.log(`Errors: ${stats.errors.length}`);
    stats.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }
  
  if (dryRun) {
    console.log('');
    console.log('This was a dry run. Run without --dry-run to apply changes.');
  }
}

main().catch(console.error);
