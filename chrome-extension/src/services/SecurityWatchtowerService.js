// ═══════════════════════════════════════════════════════════════════════════════
// 🗼 SECURITY WATCHTOWER SERVICE v1.0.0 - Password health & breach monitoring
// ═══════════════════════════════════════════════════════════════════════════════
//
// Features matching 1Password Watchtower / Bitwarden Reports:
// ✅ Password strength analysis
// ✅ Duplicate password detection
// ✅ Weak password identification
// ✅ Reused passwords across sites
// ✅ Data breach monitoring (HIBP integration)
// ✅ Exposed passwords check
// ✅ 2FA availability check
// ✅ Security score dashboard
// ✅ Actionable recommendations
//
// ═══════════════════════════════════════════════════════════════════════════════

(function(window) {
  'use strict';

  const STORAGE_KEY = 'cubeWatchtowerData';
  const HIBP_API = 'https://api.pwnedpasswords.com/range/';

  // Password strength criteria
  const STRENGTH_CRITERIA = {
    minLength: 12,
    goodLength: 16,
    strongLength: 20,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true
  };

  // Common weak passwords patterns
  const WEAK_PATTERNS = [
    /^123456/,
    /^password/i,
    /^qwerty/i,
    /^abc123/i,
    /^letmein/i,
    /^welcome/i,
    /^admin/i,
    /^login/i,
    /^master/i,
    /^dragon/i,
    /^monkey/i,
    /^shadow/i,
    /^sunshine/i,
    /^princess/i,
    /^football/i,
    /^baseball/i,
    /^iloveyou/i,
    /^trustno1/i,
    /^superman/i,
    /^batman/i,
    /^michael/i,
    /^ashley/i,
    /^jennifer/i,
    /^thomas/i,
    /^charlie/i
  ];

  // Services known to support 2FA
  const SERVICES_WITH_2FA = new Set([
    'google.com', 'accounts.google.com',
    'microsoft.com', 'live.com', 'outlook.com',
    'apple.com', 'icloud.com',
    'amazon.com',
    'facebook.com', 'fb.com',
    'twitter.com', 'x.com',
    'github.com',
    'dropbox.com',
    'slack.com',
    'discord.com',
    'linkedin.com',
    'instagram.com',
    'reddit.com',
    'twitch.tv',
    'steam.com', 'steampowered.com',
    'paypal.com',
    'ebay.com',
    'stripe.com',
    'aws.amazon.com',
    'digitalocean.com',
    'cloudflare.com',
    'godaddy.com',
    'namecheap.com',
    'zoom.us',
    'notion.so',
    'figma.com',
    'adobe.com',
    'spotify.com',
    'netflix.com',
    'coinbase.com',
    'binance.com',
    'kraken.com'
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY WATCHTOWER SERVICE
  // ═══════════════════════════════════════════════════════════════════════════

  class SecurityWatchtowerService {
    constructor() {
      this.cache = new Map();
      this.lastScan = null;
      this.scanResults = null;
      
      this.initialize();
    }

    async initialize() {
      console.log('🗼 Security Watchtower Service initializing...');
      
      await this.loadCache();
      
      console.log('✅ Security Watchtower ready');
    }

    async loadCache() {
      try {
        if (chrome?.storage?.local) {
          const result = await chrome.storage.local.get(STORAGE_KEY);
          const data = result[STORAGE_KEY] || {};
          this.lastScan = data.lastScan;
          this.scanResults = data.scanResults;
        }
      } catch (error) {
        console.warn('Failed to load watchtower cache:', error);
      }
    }

    async saveCache() {
      try {
        if (chrome?.storage?.local) {
          await chrome.storage.local.set({
            [STORAGE_KEY]: {
              lastScan: this.lastScan,
              scanResults: this.scanResults
            }
          });
        }
      } catch (error) {
        console.warn('Failed to save watchtower cache:', error);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FULL SECURITY SCAN
    // ═══════════════════════════════════════════════════════════════════════════

    async runFullScan(credentials, options = {}) {
      console.log('🔍 Running full security scan...');
      
      const results = {
        timestamp: Date.now(),
        totalItems: credentials.length,
        score: 0,
        issues: {
          critical: [],
          warning: [],
          info: []
        },
        stats: {
          weak: 0,
          reused: 0,
          old: 0,
          breached: 0,
          no2FA: 0,
          short: 0
        },
        recommendations: []
      };
      
      // Analyze each credential
      const passwordMap = new Map(); // For duplicate detection
      
      for (const credential of credentials) {
        // Password strength check
        const strength = this.analyzePasswordStrength(credential.password);
        
        if (strength.score < 40) {
          results.issues.critical.push({
            type: 'weak_password',
            credentialId: credential.id,
            site: credential.domain,
            username: credential.username,
            message: `Weak password (score: ${strength.score})`,
            details: strength.feedback
          });
          results.stats.weak++;
        }
        
        // Short password check
        if (credential.password.length < STRENGTH_CRITERIA.minLength) {
          results.issues.warning.push({
            type: 'short_password',
            credentialId: credential.id,
            site: credential.domain,
            message: `Password is too short (${credential.password.length} chars, min ${STRENGTH_CRITERIA.minLength})`,
            details: ['Use at least 12 characters']
          });
          results.stats.short++;
        }
        
        // Duplicate detection
        const passwordHash = await this.hashPassword(credential.password);
        if (passwordMap.has(passwordHash)) {
          const existing = passwordMap.get(passwordHash);
          existing.push(credential);
          
          results.issues.critical.push({
            type: 'reused_password',
            credentialId: credential.id,
            site: credential.domain,
            message: `Password reused across ${existing.length} sites`,
            details: existing.map(c => c.domain)
          });
          results.stats.reused++;
        } else {
          passwordMap.set(passwordHash, [credential]);
        }
        
        // Old password check (if lastModified available)
        if (credential.lastModified) {
          const age = Date.now() - credential.lastModified;
          const daysOld = Math.floor(age / (1000 * 60 * 60 * 24));
          
          if (daysOld > 365) {
            results.issues.warning.push({
              type: 'old_password',
              credentialId: credential.id,
              site: credential.domain,
              message: `Password is ${daysOld} days old`,
              details: ['Consider updating passwords annually']
            });
            results.stats.old++;
          }
        }
        
        // 2FA check
        const domain = this.extractDomain(credential.domain);
        if (SERVICES_WITH_2FA.has(domain) && !credential.has2FA) {
          results.issues.info.push({
            type: 'no_2fa',
            credentialId: credential.id,
            site: credential.domain,
            message: '2FA is available but not enabled',
            details: ['Enable two-factor authentication for better security']
          });
          results.stats.no2FA++;
        }
        
        // Breach check (if enabled)
        if (options.checkBreaches !== false) {
          const breached = await this.checkPasswordBreach(credential.password);
          if (breached.exposed) {
            results.issues.critical.push({
              type: 'breached_password',
              credentialId: credential.id,
              site: credential.domain,
              message: `Password found in ${breached.count.toLocaleString()} data breaches`,
              details: ['This password has been exposed and should be changed immediately']
            });
            results.stats.breached++;
          }
        }
      }
      
      // Calculate overall score
      results.score = this.calculateSecurityScore(results, credentials.length);
      
      // Generate recommendations
      results.recommendations = this.generateRecommendations(results);
      
      // Save results
      this.lastScan = results.timestamp;
      this.scanResults = results;
      await this.saveCache();
      
      console.log(`✅ Security scan complete. Score: ${results.score}/100`);
      
      return results;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PASSWORD STRENGTH ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════

    analyzePasswordStrength(password) {
      if (!password) {
        return { score: 0, level: 'none', feedback: ['No password provided'] };
      }
      
      let score = 0;
      const feedback = [];
      
      // Length scoring (up to 30 points)
      const length = password.length;
      if (length >= STRENGTH_CRITERIA.strongLength) {
        score += 30;
      } else if (length >= STRENGTH_CRITERIA.goodLength) {
        score += 25;
      } else if (length >= STRENGTH_CRITERIA.minLength) {
        score += 20;
      } else if (length >= 8) {
        score += 10;
        feedback.push('Use at least 12 characters');
      } else {
        score += 5;
        feedback.push('Password is too short');
      }
      
      // Character variety (up to 40 points)
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);
      const hasSymbols = /[^A-Za-z0-9]/.test(password);
      
      if (hasUppercase) score += 10;
      else feedback.push('Add uppercase letters');
      
      if (hasLowercase) score += 10;
      else feedback.push('Add lowercase letters');
      
      if (hasNumbers) score += 10;
      else feedback.push('Add numbers');
      
      if (hasSymbols) score += 10;
      else feedback.push('Add special characters (!@#$%^&*)');
      
      // Pattern penalties (up to -30 points)
      
      // Common patterns
      for (const pattern of WEAK_PATTERNS) {
        if (pattern.test(password)) {
          score -= 20;
          feedback.push('Avoid common password patterns');
          break;
        }
      }
      
      // Sequential characters
      if (/(.)\1{2,}/.test(password)) {
        score -= 10;
        feedback.push('Avoid repeated characters');
      }
      
      // Sequential numbers
      if (/012|123|234|345|456|567|678|789|890/.test(password)) {
        score -= 10;
        feedback.push('Avoid sequential numbers');
      }
      
      // Keyboard patterns
      if (/qwert|asdf|zxcv|qazwsx/i.test(password)) {
        score -= 10;
        feedback.push('Avoid keyboard patterns');
      }
      
      // Entropy bonus (up to 30 points)
      const entropy = this.calculateEntropy(password);
      if (entropy >= 80) score += 30;
      else if (entropy >= 60) score += 20;
      else if (entropy >= 40) score += 10;
      
      // Normalize score
      score = Math.max(0, Math.min(100, score));
      
      // Determine level
      let level;
      if (score >= 80) level = 'strong';
      else if (score >= 60) level = 'good';
      else if (score >= 40) level = 'fair';
      else if (score >= 20) level = 'weak';
      else level = 'critical';
      
      return {
        score: score,
        level: level,
        length: length,
        hasUppercase: hasUppercase,
        hasLowercase: hasLowercase,
        hasNumbers: hasNumbers,
        hasSymbols: hasSymbols,
        entropy: entropy,
        feedback: feedback
      };
    }

    calculateEntropy(password) {
      const charsetSize = this.getCharsetSize(password);
      return Math.log2(Math.pow(charsetSize, password.length));
    }

    getCharsetSize(password) {
      let size = 0;
      if (/[a-z]/.test(password)) size += 26;
      if (/[A-Z]/.test(password)) size += 26;
      if (/[0-9]/.test(password)) size += 10;
      if (/[^A-Za-z0-9]/.test(password)) size += 32;
      return size;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BREACH CHECK (HIBP)
    // ═══════════════════════════════════════════════════════════════════════════

    async checkPasswordBreach(password) {
      try {
        // Hash password with SHA-1
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        
        // k-Anonymity: Only send first 5 chars
        const prefix = hashHex.substring(0, 5);
        const suffix = hashHex.substring(5);
        
        // Check cache
        const cacheKey = `breach_${prefix}`;
        const cached = this.cache.get(cacheKey);
        
        let response;
        if (cached && cached.timestamp > Date.now() - 3600000) { // 1 hour cache
          response = cached.data;
        } else {
          // Query HIBP API
          const res = await fetch(`${HIBP_API}${prefix}`, {
            headers: {
              'Add-Padding': 'true'
            }
          });
          
          if (!res.ok) {
            throw new Error(`HIBP API error: ${res.status}`);
          }
          
          response = await res.text();
          
          // Cache response
          this.cache.set(cacheKey, {
            data: response,
            timestamp: Date.now()
          });
        }
        
        // Check if suffix exists in response
        const lines = response.split('\n');
        for (const line of lines) {
          const [hash, count] = line.split(':');
          if (hash.trim() === suffix) {
            return {
              exposed: true,
              count: parseInt(count.trim(), 10)
            };
          }
        }
        
        return { exposed: false, count: 0 };
        
      } catch (error) {
        console.warn('Breach check failed:', error);
        return { exposed: false, count: 0, error: error.message };
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECURITY SCORE
    // ═══════════════════════════════════════════════════════════════════════════

    calculateSecurityScore(results, totalItems) {
      if (totalItems === 0) return 100;
      
      let score = 100;
      
      // Critical issues (-15 each, max -60)
      const criticalPenalty = Math.min(60, results.issues.critical.length * 15);
      score -= criticalPenalty;
      
      // Warnings (-5 each, max -25)
      const warningPenalty = Math.min(25, results.issues.warning.length * 5);
      score -= warningPenalty;
      
      // Info (-2 each, max -15)
      const infoPenalty = Math.min(15, results.issues.info.length * 2);
      score -= infoPenalty;
      
      // Bonus for no issues
      if (results.issues.critical.length === 0 && results.issues.warning.length === 0) {
        score = Math.min(100, score + 10);
      }
      
      return Math.max(0, Math.round(score));
    }

    getScoreLevel(score) {
      if (score >= 90) return { level: 'excellent', color: '#22c55e', icon: '🛡️' };
      if (score >= 70) return { level: 'good', color: '#84cc16', icon: '✅' };
      if (score >= 50) return { level: 'fair', color: '#eab308', icon: '⚠️' };
      if (score >= 30) return { level: 'poor', color: '#f97316', icon: '🔶' };
      return { level: 'critical', color: '#ef4444', icon: '🚨' };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RECOMMENDATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    generateRecommendations(results) {
      const recommendations = [];
      
      if (results.stats.breached > 0) {
        recommendations.push({
          priority: 'critical',
          title: 'Change Breached Passwords',
          description: `${results.stats.breached} password(s) have been found in data breaches. Change them immediately.`,
          action: 'view_breached'
        });
      }
      
      if (results.stats.reused > 0) {
        recommendations.push({
          priority: 'critical',
          title: 'Stop Reusing Passwords',
          description: `${results.stats.reused} password(s) are reused across multiple sites. Use unique passwords everywhere.`,
          action: 'view_reused'
        });
      }
      
      if (results.stats.weak > 0) {
        recommendations.push({
          priority: 'high',
          title: 'Strengthen Weak Passwords',
          description: `${results.stats.weak} password(s) are weak. Generate strong passwords with the password generator.`,
          action: 'view_weak'
        });
      }
      
      if (results.stats.short > 0) {
        recommendations.push({
          priority: 'high',
          title: 'Use Longer Passwords',
          description: `${results.stats.short} password(s) are shorter than 12 characters. Longer passwords are more secure.`,
          action: 'view_short'
        });
      }
      
      if (results.stats.no2FA > 0) {
        recommendations.push({
          priority: 'medium',
          title: 'Enable Two-Factor Authentication',
          description: `${results.stats.no2FA} account(s) support 2FA but don't have it enabled.`,
          action: 'view_no2fa'
        });
      }
      
      if (results.stats.old > 0) {
        recommendations.push({
          priority: 'low',
          title: 'Update Old Passwords',
          description: `${results.stats.old} password(s) haven't been changed in over a year.`,
          action: 'view_old'
        });
      }
      
      // Sort by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      
      return recommendations;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    async hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    extractDomain(url) {
      try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return urlObj.hostname.replace(/^www\./, '');
      } catch {
        return url;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUICK CHECKS
    // ═══════════════════════════════════════════════════════════════════════════

    async quickPasswordCheck(password) {
      const strength = this.analyzePasswordStrength(password);
      const breach = await this.checkPasswordBreach(password);
      
      return {
        strength: strength,
        breach: breach,
        safe: strength.score >= 60 && !breach.exposed
      };
    }

    supports2FA(domain) {
      const normalized = this.extractDomain(domain);
      return SERVICES_WITH_2FA.has(normalized);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DASHBOARD DATA
    // ═══════════════════════════════════════════════════════════════════════════

    getDashboardData() {
      if (!this.scanResults) {
        return {
          needsScan: true,
          lastScan: null
        };
      }
      
      const scoreInfo = this.getScoreLevel(this.scanResults.score);
      
      return {
        needsScan: false,
        lastScan: this.lastScan,
        score: this.scanResults.score,
        scoreLevel: scoreInfo.level,
        scoreColor: scoreInfo.color,
        scoreIcon: scoreInfo.icon,
        totalItems: this.scanResults.totalItems,
        issueCount: {
          critical: this.scanResults.issues.critical.length,
          warning: this.scanResults.issues.warning.length,
          info: this.scanResults.issues.info.length
        },
        stats: this.scanResults.stats,
        recommendations: this.scanResults.recommendations.slice(0, 3)
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FILTERED RESULTS
    // ═══════════════════════════════════════════════════════════════════════════

    getBreachedPasswords() {
      return this.scanResults?.issues.critical.filter(i => i.type === 'breached_password') || [];
    }

    getReusedPasswords() {
      return this.scanResults?.issues.critical.filter(i => i.type === 'reused_password') || [];
    }

    getWeakPasswords() {
      return this.scanResults?.issues.critical.filter(i => i.type === 'weak_password') || [];
    }

    getOldPasswords() {
      return this.scanResults?.issues.warning.filter(i => i.type === 'old_password') || [];
    }

    getAccountsWithout2FA() {
      return this.scanResults?.issues.info.filter(i => i.type === 'no_2fa') || [];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════

    clearCache() {
      this.cache.clear();
      this.scanResults = null;
      this.lastScan = null;
    }

    destroy() {
      this.clearCache();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  window.SecurityWatchtowerService = SecurityWatchtowerService;
  window.cubeWatchtower = new SecurityWatchtowerService();

  console.log('🗼 Security Watchtower Service loaded');

})(window);
