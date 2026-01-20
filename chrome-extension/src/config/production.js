/**
 * CUBE AI Tools Production Configuration
 * 
 * This file configures endpoints for production deployment.
 * The extension can work in multiple modes:
 * 1. Standalone (Server Only) - connects to CUBE cloud servers
 * 2. Tauri Desktop (Local) - connects to local Tauri app
 * 3. Hybrid - uses both, with Tauri as primary when available
 * 
 * @version 2.0.0
 * @domain cubeai.tools
 */

const CubeConfig = {
  // ═══════════════════════════════════════════════════════════════════════════
  // ENVIRONMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  ENV: 'production', // 'development' | 'staging' | 'production'
  DEBUG: false,
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SERVER ENDPOINTS (Cloud Infrastructure)
  // ═══════════════════════════════════════════════════════════════════════════
  
  SERVER: {
    // Main API server
    API_BASE: 'https://api.cubeai.tools',
    
    // WebSocket endpoints
    WS_BASE: 'wss://ws.cubeai.tools',
    
    // Specific services
    AUTH: 'https://auth.cubeai.tools',
    AI_PROXY: 'https://ai.cubeai.tools',
    SIGNALING: 'wss://signaling.cubeai.tools',
    SYNC: 'https://sync.cubeai.tools',
    ANALYTICS: 'https://analytics.cubeai.tools',
    UPDATES: 'https://updates.cubeai.tools',
    LICENSE: 'https://license.cubeai.tools',
    
    // CDN for static assets
    CDN: 'https://cdn.cubeai.tools',
    
    // Health check endpoint
    HEALTH: 'https://api.cubeai.tools/health',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TAURI LOCAL ENDPOINTS (Desktop App)
  // ═══════════════════════════════════════════════════════════════════════════
  
  TAURI: {
    // Native messaging host name
    NATIVE_HOST: 'com.cube.elite.native',
    
    // Local HTTP API (when Tauri runs local server)
    LOCAL_API: 'http://localhost:23847',
    LOCAL_WS: 'ws://localhost:23848',
    
    // Timeout for checking Tauri availability
    DETECTION_TIMEOUT: 2000,
    
    // Reconnection settings
    RECONNECT_DELAY: 3000,
    MAX_RECONNECT_ATTEMPTS: 5,
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // AI SERVICE CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  AI: {
    // Use server proxy for AI calls (hides API keys from extension)
    USE_PROXY: true,
    PROXY_ENDPOINT: 'https://ai.cubeai.tools/v1',
    
    // Fallback to direct calls if user provides their own key
    ALLOW_DIRECT: true,
    
    // Supported providers
    PROVIDERS: {
      OPENAI: {
        endpoint: 'https://api.openai.com/v1',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        defaultModel: 'gpt-4o-mini',
      },
      ANTHROPIC: {
        endpoint: 'https://api.anthropic.com/v1',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
        defaultModel: 'claude-3-5-sonnet-20241022',
      },
      GOOGLE: {
        endpoint: 'https://generativelanguage.googleapis.com/v1beta',
        models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
        defaultModel: 'gemini-1.5-flash',
      },
    },
    
    // Rate limits (requests per minute)
    RATE_LIMITS: {
      free: 10,
      pro: 100,
      elite: 500,
      enterprise: -1, // unlimited
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // P2P & SIGNALING
  // ═══════════════════════════════════════════════════════════════════════════
  
  P2P: {
    // Signaling server
    SIGNALING_SERVER: 'wss://signaling.cubeai.tools',
    
    // ICE Servers for WebRTC
    ICE_SERVERS: [
      // STUN servers (free)
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.mozilla.org:3478' },
      
      // TURN servers (requires credentials from server)
      {
        urls: 'turn:turn.cubeai.tools:3478',
        username: 'DYNAMIC', // Fetched from auth server
        credential: 'DYNAMIC',
      },
      {
        urls: 'turn:turn.cubeai.tools:443?transport=tcp',
        username: 'DYNAMIC',
        credential: 'DYNAMIC',
      },
    ],
    
    // Room settings
    MAX_PEERS_PER_ROOM: 10,
    ROOM_EXPIRY_HOURS: 24,
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LICENSING & MONETIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  LICENSE: {
    // License validation endpoint
    VALIDATION_ENDPOINT: 'https://license.cubeai.tools/validate',
    
    // Stripe integration
    STRIPE: {
      PUBLISHABLE_KEY: 'pk_live_XXXXXXXXXXXXXXXXXXXXXXXX', // Set in env
      PRICING_TABLE_ID: 'prctbl_XXXXXXXXXXXXXXXX',
      CUSTOMER_PORTAL: 'https://billing.stripe.com/p/login/XXXXXXXX',
    },
    
    // Subscription tiers
    TIERS: {
      FREE: {
        name: 'Free',
        price: 0,
        features: [
          'basic_autofill',
          'document_parsing_5_per_day',
          'ai_calls_10_per_day',
        ],
        limits: {
          documents_per_day: 5,
          ai_calls_per_day: 10,
          macros: 3,
          storage_mb: 50,
        },
      },
      PRO: {
        name: 'Pro',
        price_monthly: 9.99,
        price_yearly: 99.99,
        features: [
          'unlimited_autofill',
          'unlimited_documents',
          'ai_calls_100_per_day',
          'macros_unlimited',
          'cloud_sync',
          'priority_support',
          'vpn_basic',
        ],
        limits: {
          documents_per_day: -1,
          ai_calls_per_day: 100,
          macros: -1,
          storage_mb: 500,
        },
      },
      ELITE: {
        name: 'Elite',
        price_monthly: 29.99,
        price_yearly: 299.99,
        features: [
          'all_pro_features',
          'ai_calls_500_per_day',
          'p2p_file_sharing',
          'video_conferencing',
          'screen_sharing',
          'vpn_premium',
          'api_access',
          'webhook_integrations',
          'custom_branding',
        ],
        limits: {
          documents_per_day: -1,
          ai_calls_per_day: 500,
          macros: -1,
          storage_mb: 5000,
        },
      },
      ENTERPRISE: {
        name: 'Enterprise',
        price: 'custom',
        features: [
          'all_elite_features',
          'sso_saml',
          'sso_oidc',
          'admin_console',
          'audit_logs',
          'custom_integrations',
          'dedicated_support',
          'sla_guarantee',
          'on_premise_option',
        ],
        limits: {
          documents_per_day: -1,
          ai_calls_per_day: -1,
          macros: -1,
          storage_mb: -1,
        },
      },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS & TELEMETRY
  // ═══════════════════════════════════════════════════════════════════════════
  
  ANALYTICS: {
    ENABLED: true,
    ENDPOINT: 'https://analytics.cubeai.tools/events',
    
    // What to track
    TRACK: {
      page_views: true,
      feature_usage: true,
      errors: true,
      performance: true,
    },
    
    // Privacy settings (GDPR compliant)
    ANONYMIZE_IP: true,
    RESPECT_DNT: true,
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATES & VERSIONING
  // ═══════════════════════════════════════════════════════════════════════════
  
  UPDATES: {
    // Check for updates endpoint
    CHECK_ENDPOINT: 'https://updates.cubeai.tools/check',
    
    // Auto-update settings
    AUTO_UPDATE: true,
    CHECK_INTERVAL_HOURS: 24,
    
    // Channels
    CHANNEL: 'stable', // 'stable' | 'beta' | 'canary'
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FEATURE FLAGS
  // ═══════════════════════════════════════════════════════════════════════════
  
  FEATURES: {
    // Core features
    AUTOFILL: true,
    DOCUMENT_PARSING: true,
    AI_ASSISTANCE: true,
    MACROS: true,
    
    // Premium features
    P2P_SHARING: true,
    VIDEO_CONFERENCE: true,
    SCREEN_SHARING: true,
    VPN: true,
    
    // Enterprise features
    SSO: true,
    ADMIN_CONSOLE: true,
    AUDIT_LOGS: true,
    
    // Beta features
    AI_WORKFLOW_BUILDER: true,
    VISUAL_AUTOMATION: true,
    
    // Coming soon
    MOBILE_APP: false,
    BROWSER_SYNC: false,
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════════════════════════════════════════
  
  SECURITY: {
    // Content Security Policy additions
    CSP_REPORT_URI: 'https://security.cubeai.tools/csp-report',
    
    // Certificate pinning for critical endpoints
    PINNED_CERTS: {
      'api.cubeai.tools': ['sha256/XXXXXXXXXX'],
      'license.cubeai.tools': ['sha256/XXXXXXXXXX'],
    },
    
    // Encryption settings
    ENCRYPTION: {
      ALGORITHM: 'AES-256-GCM',
      KEY_DERIVATION: 'PBKDF2',
      ITERATIONS: 100000,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT OVERRIDES
// ═══════════════════════════════════════════════════════════════════════════════

// Development overrides
if (CubeConfig.ENV === 'development') {
  CubeConfig.DEBUG = true;
  CubeConfig.SERVER.API_BASE = 'http://localhost:3000';
  CubeConfig.SERVER.WS_BASE = 'ws://localhost:3001';
  CubeConfig.SERVER.SIGNALING = 'ws://localhost:3002';
  CubeConfig.AI.USE_PROXY = false;
  CubeConfig.ANALYTICS.ENABLED = false;
}

// Staging overrides
if (CubeConfig.ENV === 'staging') {
  CubeConfig.SERVER.API_BASE = 'https://staging-api.cubeai.tools';
  CubeConfig.SERVER.WS_BASE = 'wss://staging-ws.cubeai.tools';
  CubeConfig.UPDATES.CHANNEL = 'beta';
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// For use in Chrome Extension (global)
if (typeof globalThis !== 'undefined') {
  globalThis.CubeConfig = CubeConfig;
}

// For use in Node.js/bundlers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CubeConfig;
}
