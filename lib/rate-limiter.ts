/**
 * CUBE Elite v7 - Rate Limiter
 * 
 * In-memory rate limiting with sliding window algorithm.
 * Supports per-IP, per-user, and per-endpoint limits.
 * 
 * Features:
 * - Sliding window rate limiting
 * - Multiple limit tiers (global, per-endpoint, per-user)
 * - Configurable burst protection
 * - Redis-ready interface (can be extended)
 * 
 * Based on patterns from src-tauri/src/services/rate_limiter.rs
 * 
 * @module lib/rate-limiter
 */

export interface RateLimitConfig {
  /** Enable/disable rate limiting */
  enabled: boolean;
  /** Requests allowed per window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Max burst requests allowed in 1 second */
  burstLimit: number;
  /** Skip rate limiting for these IPs */
  whitelist: string[];
  /** Custom limits for specific endpoints */
  endpointLimits: Record<string, { maxRequests: number; windowSeconds: number }>;
}

interface RequestRecord {
  timestamps: number[];
  blocked: boolean;
  blockedUntil?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
  limit: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  enabled: true,
  maxRequests: 100,
  windowSeconds: 60,
  burstLimit: 10,
  whitelist: ['127.0.0.1', '::1', 'localhost'],
  endpointLimits: {
    '/api/openai': { maxRequests: 20, windowSeconds: 60 },
    '/api/ai': { maxRequests: 30, windowSeconds: 60 },
    '/api/enterprise': { maxRequests: 50, windowSeconds: 60 },
    '/api/analytics/export': { maxRequests: 10, windowSeconds: 60 },
    '/api/notifications/send-bulk': { maxRequests: 5, windowSeconds: 60 },
  },
};

class RateLimiter {
  private config: RateLimitConfig;
  private records: Map<string, RequestRecord>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.records = new Map();
    this.cleanupInterval = null;
    
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check if a request should be allowed
   */
  check(identifier: string, endpoint?: string): RateLimitResult {
    if (!this.config.enabled) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetAt: Date.now() + this.config.windowSeconds * 1000,
        limit: this.config.maxRequests,
      };
    }

    // Check whitelist
    if (this.config.whitelist.includes(identifier)) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: Date.now() + this.config.windowSeconds * 1000,
        limit: Infinity,
      };
    }

    const key = endpoint ? `${identifier}:${endpoint}` : identifier;
    const now = Date.now();
    
    // Get endpoint-specific limits or use defaults
    const limits = endpoint && this.config.endpointLimits[endpoint]
      ? this.config.endpointLimits[endpoint]
      : { maxRequests: this.config.maxRequests, windowSeconds: this.config.windowSeconds };
    
    const windowMs = limits.windowSeconds * 1000;
    const windowStart = now - windowMs;

    let record = this.records.get(key);
    
    if (!record) {
      record = { timestamps: [], blocked: false };
      this.records.set(key, record);
    }

    // Check if currently blocked
    if (record.blocked && record.blockedUntil) {
      if (now < record.blockedUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: record.blockedUntil,
          retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
          limit: limits.maxRequests,
        };
      } else {
        // Unblock
        record.blocked = false;
        record.blockedUntil = undefined;
        record.timestamps = [];
      }
    }

    // Clean old timestamps
    record.timestamps = record.timestamps.filter(ts => ts > windowStart);

    // Check burst limit (requests in last second)
    const lastSecond = now - 1000;
    const recentRequests = record.timestamps.filter(ts => ts > lastSecond);
    if (recentRequests.length >= this.config.burstLimit) {
      // Block for 10 seconds due to burst
      record.blocked = true;
      record.blockedUntil = now + 10000;
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.blockedUntil,
        retryAfter: 10,
        limit: limits.maxRequests,
      };
    }

    // Check window limit
    if (record.timestamps.length >= limits.maxRequests) {
      const oldestInWindow = record.timestamps[0];
      const resetAt = oldestInWindow + windowMs;
      
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt - now) / 1000),
        limit: limits.maxRequests,
      };
    }

    // Allow and record
    record.timestamps.push(now);
    
    return {
      allowed: true,
      remaining: limits.maxRequests - record.timestamps.length,
      resetAt: now + windowMs,
      limit: limits.maxRequests,
    };
  }

  /**
   * Consume a rate limit token (for successful requests)
   */
  consume(identifier: string, endpoint?: string): RateLimitResult {
    return this.check(identifier, endpoint);
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    // Remove all keys for this identifier
    for (const key of this.records.keys()) {
      if (key === identifier || key.startsWith(`${identifier}:`)) {
        this.records.delete(key);
      }
    }
  }

  /**
   * Block an identifier for a duration
   */
  block(identifier: string, durationSeconds: number): void {
    const record: RequestRecord = {
      timestamps: [],
      blocked: true,
      blockedUntil: Date.now() + durationSeconds * 1000,
    };
    this.records.set(identifier, record);
  }

  /**
   * Check if an identifier is blocked
   */
  isBlocked(identifier: string): boolean {
    const record = this.records.get(identifier);
    if (!record) return false;
    
    if (record.blocked && record.blockedUntil) {
      if (Date.now() < record.blockedUntil) {
        return true;
      }
      // Unblock if time has passed
      record.blocked = false;
      record.blockedUntil = undefined;
    }
    
    return false;
  }

  /**
   * Get current status for an identifier
   */
  getStatus(identifier: string, endpoint?: string): {
    requestsInWindow: number;
    limit: number;
    remaining: number;
    blocked: boolean;
    blockedUntil?: number;
  } {
    const key = endpoint ? `${identifier}:${endpoint}` : identifier;
    const record = this.records.get(key);
    
    const limits = endpoint && this.config.endpointLimits[endpoint]
      ? this.config.endpointLimits[endpoint]
      : { maxRequests: this.config.maxRequests, windowSeconds: this.config.windowSeconds };
    
    if (!record) {
      return {
        requestsInWindow: 0,
        limit: limits.maxRequests,
        remaining: limits.maxRequests,
        blocked: false,
      };
    }

    const windowStart = Date.now() - limits.windowSeconds * 1000;
    const validTimestamps = record.timestamps.filter(ts => ts > windowStart);

    return {
      requestsInWindow: validTimestamps.length,
      limit: limits.maxRequests,
      remaining: Math.max(0, limits.maxRequests - validTimestamps.length),
      blocked: record.blocked,
      blockedUntil: record.blockedUntil,
    };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Clean up expired records
   */
  private cleanup(): void {
    const now = Date.now();
    const maxWindow = Math.max(
      this.config.windowSeconds,
      ...Object.values(this.config.endpointLimits).map(l => l.windowSeconds)
    ) * 1000;

    for (const [key, record] of this.records.entries()) {
      // Remove if no recent activity and not blocked
      if (record.timestamps.length === 0 && !record.blocked) {
        this.records.delete(key);
        continue;
      }

      // Remove if all timestamps are expired
      const newestTimestamp = Math.max(...record.timestamps, 0);
      if (now - newestTimestamp > maxWindow * 2 && !record.blocked) {
        this.records.delete(key);
        continue;
      }

      // Unblock if block time has passed
      if (record.blocked && record.blockedUntil && now > record.blockedUntil) {
        record.blocked = false;
        record.blockedUntil = undefined;
      }
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Clean up every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Stop the rate limiter and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.records.clear();
  }

  /**
   * Get stats for monitoring
   */
  getStats(): {
    totalIdentifiers: number;
    blockedIdentifiers: number;
    memoryEstimate: string;
  } {
    let blocked = 0;
    let totalTimestamps = 0;

    for (const record of this.records.values()) {
      if (record.blocked) blocked++;
      totalTimestamps += record.timestamps.length;
    }

    // Rough memory estimate: ~8 bytes per timestamp + overhead
    const memoryBytes = (totalTimestamps * 8) + (this.records.size * 100);
    const memoryEstimate = memoryBytes < 1024 
      ? `${memoryBytes} B`
      : memoryBytes < 1024 * 1024
        ? `${(memoryBytes / 1024).toFixed(2)} KB`
        : `${(memoryBytes / 1024 / 1024).toFixed(2)} MB`;

    return {
      totalIdentifiers: this.records.size,
      blockedIdentifiers: blocked,
      memoryEstimate,
    };
  }
}

// Singleton instance
let instance: RateLimiter | null = null;

/**
 * Get the rate limiter singleton
 */
export function getRateLimiter(): RateLimiter {
  if (!instance) {
    instance = new RateLimiter();
  }
  return instance;
}

/**
 * Create a new rate limiter with custom config
 */
export function createRateLimiter(config?: Partial<RateLimitConfig>): RateLimiter {
  return new RateLimiter(config);
}

export { RateLimiter };
export default getRateLimiter;
