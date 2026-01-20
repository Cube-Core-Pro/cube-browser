/**
 * Proxy Rotation Service - Enterprise Proxy Management
 *
 * Provides intelligent proxy rotation, health checking, and management
 * for professional web automation.
 *
 * M5 Features:
 * - Multi-provider proxy support
 * - Intelligent rotation strategies
 * - Health monitoring
 * - Geolocation targeting
 * - Session persistence
 * - Automatic failover
 * - Usage analytics
 *
 * @module ProxyRotationService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService, SpanKind } from './telemetry-service';

// ============================================================================
// Types
// ============================================================================

export interface Proxy {
  /**
   * Unique proxy identifier
   */
  id: string;

  /**
   * Proxy name/label
   */
  name?: string;

  /**
   * Proxy type
   */
  type: ProxyType;

  /**
   * Host address
   */
  host: string;

  /**
   * Port number
   */
  port: number;

  /**
   * Authentication username
   */
  username?: string;

  /**
   * Authentication password
   */
  password?: string;

  /**
   * Provider name
   */
  provider?: string;

  /**
   * Country code (ISO 3166-1 alpha-2)
   */
  country?: string;

  /**
   * City
   */
  city?: string;

  /**
   * ISP information
   */
  isp?: string;

  /**
   * Proxy status
   */
  status: ProxyStatus;

  /**
   * Last health check timestamp
   */
  lastHealthCheck?: number;

  /**
   * Health check result
   */
  healthResult?: ProxyHealthResult;

  /**
   * Usage statistics
   */
  stats: ProxyStats;

  /**
   * Tags for organization
   */
  tags: string[];

  /**
   * Is proxy active
   */
  isActive: boolean;

  /**
   * Priority (1-100, lower = higher priority)
   */
  priority: number;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Notes
   */
  notes?: string;
}

export type ProxyType =
  | 'http'
  | 'https'
  | 'socks4'
  | 'socks5'
  | 'residential'
  | 'datacenter'
  | 'mobile';

export type ProxyStatus =
  | 'unknown'
  | 'healthy'
  | 'degraded'
  | 'unhealthy'
  | 'banned'
  | 'offline';

export interface ProxyStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalBytesTransferred: number;
  averageLatency: number;
  lastUsed?: number;
  successRate: number;
  banCount: number;
}

export interface ProxyHealthResult {
  isHealthy: boolean;
  latency: number;
  detectedIP: string;
  detectedCountry?: string;
  detectedCity?: string;
  detectedISP?: string;
  error?: string;
  checkedAt: number;
}

export interface ProxyPool {
  /**
   * Pool ID
   */
  id: string;

  /**
   * Pool name
   */
  name: string;

  /**
   * Pool description
   */
  description?: string;

  /**
   * Proxies in this pool
   */
  proxyIds: string[];

  /**
   * Rotation strategy
   */
  rotationStrategy: RotationStrategy;

  /**
   * Target countries (filter)
   */
  targetCountries?: string[];

  /**
   * Minimum success rate threshold
   */
  minSuccessRate: number;

  /**
   * Maximum latency threshold (ms)
   */
  maxLatency: number;

  /**
   * Ban detection settings
   */
  banDetection: BanDetectionSettings;

  /**
   * Is pool active
   */
  isActive: boolean;

  /**
   * Creation timestamp
   */
  createdAt: number;
}

export type RotationStrategy =
  | 'round-robin'
  | 'random'
  | 'weighted'
  | 'least-used'
  | 'lowest-latency'
  | 'highest-success'
  | 'geographic'
  | 'sticky-session';

export interface BanDetectionSettings {
  /**
   * Enable ban detection
   */
  enabled: boolean;

  /**
   * Consecutive failure threshold
   */
  failureThreshold: number;

  /**
   * Keywords that indicate a ban
   */
  banKeywords: string[];

  /**
   * Status codes that indicate a ban
   */
  banStatusCodes: number[];

  /**
   * Cooldown period after ban (ms)
   */
  cooldownPeriod: number;

  /**
   * Auto-remove banned proxies
   */
  autoRemove: boolean;
}

export interface ProxyProvider {
  /**
   * Provider ID
   */
  id: string;

  /**
   * Provider name
   */
  name: string;

  /**
   * Provider type
   */
  type: 'api' | 'list' | 'manual';

  /**
   * API endpoint (for API providers)
   */
  apiEndpoint?: string;

  /**
   * API key
   */
  apiKey?: string;

  /**
   * Refresh interval (ms)
   */
  refreshInterval?: number;

  /**
   * Last refresh timestamp
   */
  lastRefresh?: number;

  /**
   * Is provider active
   */
  isActive: boolean;

  /**
   * Creation timestamp
   */
  createdAt: number;
}

export interface ProxySession {
  /**
   * Session ID
   */
  id: string;

  /**
   * Associated proxy ID
   */
  proxyId: string;

  /**
   * Target domain
   */
  domain: string;

  /**
   * Session start time
   */
  startedAt: number;

  /**
   * Session end time
   */
  endedAt?: number;

  /**
   * Request count
   */
  requestCount: number;

  /**
   * Is session active
   */
  isActive: boolean;
}

// ============================================================================
// Proxy Rotation Service
// ============================================================================

export const ProxyRotationService = {
  /**
   * Add a new proxy
   */
  addProxy: async (proxy: Omit<Proxy, 'id' | 'stats' | 'createdAt'>): Promise<Proxy> => {
    TelemetryService.trackEvent('proxy_added');

    return invoke<Proxy>('proxy_add', { proxy });
  },

  /**
   * Add multiple proxies
   */
  addProxies: async (
    proxies: Omit<Proxy, 'id' | 'stats' | 'createdAt'>[]
  ): Promise<{ added: number; errors: string[] }> => {
    return invoke('proxy_add_multiple', { proxies });
  },

  /**
   * Get all proxies
   */
  getProxies: async (filters?: ProxyFilters): Promise<Proxy[]> => {
    return invoke<Proxy[]>('proxy_get_all', { filters });
  },

  /**
   * Get proxy by ID
   */
  getProxy: async (proxyId: string): Promise<Proxy | null> => {
    return invoke<Proxy | null>('proxy_get', { proxyId });
  },

  /**
   * Update proxy
   */
  updateProxy: async (
    proxyId: string,
    updates: Partial<Proxy>
  ): Promise<Proxy> => {
    return invoke<Proxy>('proxy_update', { proxyId, updates });
  },

  /**
   * Delete proxy
   */
  deleteProxy: async (proxyId: string): Promise<void> => {
    return invoke('proxy_delete', { proxyId });
  },

  /**
   * Delete multiple proxies
   */
  deleteProxies: async (proxyIds: string[]): Promise<void> => {
    return invoke('proxy_delete_multiple', { proxyIds });
  },

  /**
   * Get next proxy from pool
   */
  getNextProxy: async (
    poolId: string,
    options?: {
      domain?: string;
      stickySession?: boolean;
      excludeIds?: string[];
    }
  ): Promise<Proxy | null> => {
    const spanId = TelemetryService.startSpan('proxy.rotation.get_next', {
      kind: SpanKind.CLIENT,
    });

    try {
      const proxy = await invoke<Proxy | null>('proxy_get_next', {
        poolId,
        options,
      });
      TelemetryService.endSpan(spanId);
      return proxy;
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) });
      throw error;
    }
  },

  /**
   * Check proxy health
   */
  checkHealth: async (proxyId: string): Promise<ProxyHealthResult> => {
    return invoke<ProxyHealthResult>('proxy_check_health', { proxyId });
  },

  /**
   * Check health of all proxies in pool
   */
  checkPoolHealth: async (poolId: string): Promise<{
    total: number;
    healthy: number;
    unhealthy: number;
    results: { proxyId: string; result: ProxyHealthResult }[];
  }> => {
    return invoke('proxy_check_pool_health', { poolId });
  },

  /**
   * Report proxy ban
   */
  reportBan: async (
    proxyId: string,
    domain: string,
    reason?: string
  ): Promise<void> => {
    TelemetryService.trackEvent('proxy_ban_reported', { proxyId, domain });

    return invoke('proxy_report_ban', { proxyId, domain, reason });
  },

  /**
   * Clear proxy ban
   */
  clearBan: async (proxyId: string, domain?: string): Promise<void> => {
    return invoke('proxy_clear_ban', { proxyId, domain });
  },

  /**
   * Get proxy statistics
   */
  getStats: async (proxyId: string): Promise<ProxyStats> => {
    return invoke<ProxyStats>('proxy_get_stats', { proxyId });
  },

  /**
   * Reset proxy statistics
   */
  resetStats: async (proxyId: string): Promise<void> => {
    return invoke('proxy_reset_stats', { proxyId });
  },

  /**
   * Import proxies from text
   */
  importFromText: async (
    text: string,
    format: 'ip:port' | 'ip:port:user:pass' | 'url'
  ): Promise<{ imported: number; errors: string[] }> => {
    return invoke('proxy_import_from_text', { text, format });
  },

  /**
   * Export proxies
   */
  exportProxies: async (
    proxyIds: string[],
    format: 'json' | 'txt' | 'csv'
  ): Promise<string> => {
    return invoke<string>('proxy_export', { proxyIds, format });
  },

  /**
   * Test proxy with URL
   */
  testProxy: async (
    proxyId: string,
    testUrl: string
  ): Promise<ProxyTestResult> => {
    return invoke<ProxyTestResult>('proxy_test', { proxyId, testUrl });
  },
};

export interface ProxyFilters {
  type?: ProxyType;
  status?: ProxyStatus;
  country?: string;
  provider?: string;
  tags?: string[];
  minSuccessRate?: number;
  maxLatency?: number;
  isActive?: boolean;
}

export interface ProxyTestResult {
  success: boolean;
  statusCode?: number;
  latency?: number;
  responseSize?: number;
  detectedIP?: string;
  headers?: Record<string, string>;
  error?: string;
}

// ============================================================================
// Proxy Pool Service
// ============================================================================

export const ProxyPoolService = {
  /**
   * Create a new proxy pool
   */
  createPool: async (
    name: string,
    options?: Partial<ProxyPool>
  ): Promise<ProxyPool> => {
    TelemetryService.trackEvent('proxy_pool_created');

    return invoke<ProxyPool>('proxy_pool_create', { name, options });
  },

  /**
   * Get all pools
   */
  getPools: async (): Promise<ProxyPool[]> => {
    return invoke<ProxyPool[]>('proxy_pool_get_all');
  },

  /**
   * Get pool by ID
   */
  getPool: async (poolId: string): Promise<ProxyPool | null> => {
    return invoke<ProxyPool | null>('proxy_pool_get', { poolId });
  },

  /**
   * Update pool
   */
  updatePool: async (
    poolId: string,
    updates: Partial<ProxyPool>
  ): Promise<ProxyPool> => {
    return invoke<ProxyPool>('proxy_pool_update', { poolId, updates });
  },

  /**
   * Delete pool
   */
  deletePool: async (poolId: string): Promise<void> => {
    return invoke('proxy_pool_delete', { poolId });
  },

  /**
   * Add proxies to pool
   */
  addProxiesToPool: async (
    poolId: string,
    proxyIds: string[]
  ): Promise<void> => {
    return invoke('proxy_pool_add_proxies', { poolId, proxyIds });
  },

  /**
   * Remove proxies from pool
   */
  removeProxiesFromPool: async (
    poolId: string,
    proxyIds: string[]
  ): Promise<void> => {
    return invoke('proxy_pool_remove_proxies', { poolId, proxyIds });
  },

  /**
   * Get pool statistics
   */
  getPoolStats: async (poolId: string): Promise<ProxyPoolStats> => {
    return invoke<ProxyPoolStats>('proxy_pool_get_stats', { poolId });
  },

  /**
   * Set rotation strategy
   */
  setRotationStrategy: async (
    poolId: string,
    strategy: RotationStrategy
  ): Promise<void> => {
    return invoke('proxy_pool_set_strategy', { poolId, strategy });
  },
};

export interface ProxyPoolStats {
  totalProxies: number;
  activeProxies: number;
  healthyProxies: number;
  totalRequests: number;
  successfulRequests: number;
  averageLatency: number;
  averageSuccessRate: number;
  countryCoverage: { country: string; count: number }[];
}

// ============================================================================
// Proxy Provider Service
// ============================================================================

export const ProxyProviderService = {
  /**
   * Add a proxy provider
   */
  addProvider: async (
    provider: Omit<ProxyProvider, 'id' | 'createdAt'>
  ): Promise<ProxyProvider> => {
    return invoke<ProxyProvider>('proxy_provider_add', { provider });
  },

  /**
   * Get all providers
   */
  getProviders: async (): Promise<ProxyProvider[]> => {
    return invoke<ProxyProvider[]>('proxy_provider_get_all');
  },

  /**
   * Get provider by ID
   */
  getProvider: async (providerId: string): Promise<ProxyProvider | null> => {
    return invoke<ProxyProvider | null>('proxy_provider_get', { providerId });
  },

  /**
   * Update provider
   */
  updateProvider: async (
    providerId: string,
    updates: Partial<ProxyProvider>
  ): Promise<ProxyProvider> => {
    return invoke<ProxyProvider>('proxy_provider_update', {
      providerId,
      updates,
    });
  },

  /**
   * Delete provider
   */
  deleteProvider: async (providerId: string): Promise<void> => {
    return invoke('proxy_provider_delete', { providerId });
  },

  /**
   * Refresh proxies from provider
   */
  refreshProxies: async (
    providerId: string
  ): Promise<{ added: number; updated: number; removed: number }> => {
    return invoke('proxy_provider_refresh', { providerId });
  },

  /**
   * Test provider connection
   */
  testConnection: async (providerId: string): Promise<{
    success: boolean;
    proxyCount?: number;
    error?: string;
  }> => {
    return invoke('proxy_provider_test', { providerId });
  },
};

// ============================================================================
// Proxy Session Service
// ============================================================================

export const ProxySessionService = {
  /**
   * Create a sticky session
   */
  createSession: async (
    proxyId: string,
    domain: string
  ): Promise<ProxySession> => {
    return invoke<ProxySession>('proxy_session_create', { proxyId, domain });
  },

  /**
   * Get active sessions
   */
  getActiveSessions: async (): Promise<ProxySession[]> => {
    return invoke<ProxySession[]>('proxy_session_get_active');
  },

  /**
   * Get session for domain
   */
  getSessionForDomain: async (
    domain: string
  ): Promise<ProxySession | null> => {
    return invoke<ProxySession | null>('proxy_session_get_for_domain', {
      domain,
    });
  },

  /**
   * End session
   */
  endSession: async (sessionId: string): Promise<void> => {
    return invoke('proxy_session_end', { sessionId });
  },

  /**
   * End all sessions
   */
  endAllSessions: async (): Promise<void> => {
    return invoke('proxy_session_end_all');
  },

  /**
   * Rotate session proxy
   */
  rotateSession: async (sessionId: string): Promise<ProxySession> => {
    return invoke<ProxySession>('proxy_session_rotate', { sessionId });
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

export const ProxyUtils = {
  /**
   * Parse proxy URL
   */
  parseProxyUrl: (url: string): Partial<Proxy> | null => {
    try {
      const parsed = new URL(url);
      return {
        type: parsed.protocol.replace(':', '') as ProxyType,
        host: parsed.hostname,
        port: parseInt(parsed.port, 10),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
      };
    } catch {
      return null;
    }
  },

  /**
   * Format proxy URL
   */
  formatProxyUrl: (proxy: Proxy): string => {
    const auth =
      proxy.username && proxy.password
        ? `${proxy.username}:${proxy.password}@`
        : '';
    return `${proxy.type}://${auth}${proxy.host}:${proxy.port}`;
  },

  /**
   * Validate proxy format
   */
  validateProxy: (proxy: Partial<Proxy>): string[] => {
    const errors: string[] = [];

    if (!proxy.host) {
      errors.push('Host is required');
    }

    if (!proxy.port || proxy.port < 1 || proxy.port > 65535) {
      errors.push('Port must be between 1 and 65535');
    }

    if (!proxy.type) {
      errors.push('Proxy type is required');
    }

    return errors;
  },

  /**
   * Parse proxy list
   */
  parseProxyList: (text: string): Partial<Proxy>[] => {
    const proxies: Partial<Proxy>[] = [];
    const lines = text.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      const trimmed = line.trim();

      // Try URL format
      if (trimmed.includes('://')) {
        const parsed = ProxyUtils.parseProxyUrl(trimmed);
        if (parsed) {
          proxies.push(parsed);
          continue;
        }
      }

      // Try ip:port:user:pass format
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        const proxy: Partial<Proxy> = {
          type: 'http',
          host: parts[0],
          port: parseInt(parts[1], 10),
        };

        if (parts.length >= 4) {
          proxy.username = parts[2];
          proxy.password = parts[3];
        }

        if (!isNaN(proxy.port!)) {
          proxies.push(proxy);
        }
      }
    }

    return proxies;
  },
};

// ============================================================================
// Export
// ============================================================================

export const ProxyServices = {
  Rotation: ProxyRotationService,
  Pool: ProxyPoolService,
  Provider: ProxyProviderService,
  Session: ProxySessionService,
  Utils: ProxyUtils,
};

export default ProxyServices;
