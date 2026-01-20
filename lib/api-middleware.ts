/**
 * CUBE Elite v7 - API Route Middleware
 * 
 * Wrapper functions to easily add authentication, rate limiting,
 * and audit logging to Next.js API routes.
 * 
 * @module lib/api-middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthUser, AuthResult, hasPermission } from '@/lib/auth';
import { getRateLimiter, RateLimiter } from '@/lib/rate-limiter';

// Get the singleton rate limiter instance
const rateLimiter: RateLimiter = getRateLimiter();

// =============================================================================
// Types
// =============================================================================

export interface ApiContext {
  user: AuthUser;
  request: NextRequest;
  clientIp: string;
}

export type ApiHandler = (
  request: NextRequest,
  context: ApiContext
) => Promise<NextResponse>;

export interface MiddlewareOptions {
  /** Require authentication (default: true) */
  requireAuth?: boolean;
  /** Required permissions (checked with OR logic) */
  permissions?: string[];
  /** Required role (admin, user, viewer, api) */
  requiredRole?: 'admin' | 'user' | 'viewer' | 'api';
  /** Enable rate limiting (default: true) */
  rateLimit?: boolean;
  /** Custom rate limit key prefix */
  rateLimitKey?: string;
  /** Enable audit logging (default: true for write operations) */
  auditLog?: boolean;
  /** Allow public access (overrides requireAuth) */
  public?: boolean;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extract client IP from request
 */
function getClientIp(request: NextRequest): string {
  // Try various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback
  return '127.0.0.1';
}

/**
 * Create a JSON error response
 */
function errorResponse(
  message: string,
  status: number,
  code?: string,
  headers?: Record<string, string>
): NextResponse {
  const body = {
    success: false,
    error: message,
    code: code || 'ERROR',
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Log audit event
 */
async function logAuditEvent(
  action: string,
  user: AuthUser | null,
  request: NextRequest,
  result: 'success' | 'failure',
  details?: Record<string, unknown>
): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId: user?.id || 'anonymous',
    userEmail: user?.email || 'anonymous',
    organizationId: user?.organizationId || 'none',
    method: request.method,
    path: request.nextUrl.pathname,
    clientIp: getClientIp(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    result,
    details,
  };
  
  // Log to console in development, could be sent to external service in production
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', JSON.stringify(logEntry, null, 2));
  } else {
    // In production, send to logging service
    console.log('[AUDIT]', JSON.stringify(logEntry));
  }
}

// =============================================================================
// Main Middleware Wrapper
// =============================================================================

/**
 * Wrap an API route handler with authentication, rate limiting, and audit logging
 * 
 * @example
 * ```typescript
 * export const GET = withApiMiddleware(
 *   async (request, context) => {
 *     const { user } = context;
 *     return NextResponse.json({ data: 'protected data' });
 *   },
 *   { requireAuth: true, permissions: ['read'] }
 * );
 * ```
 */
export function withApiMiddleware(
  handler: ApiHandler,
  options: MiddlewareOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  const {
    requireAuth = true,
    permissions = [],
    requiredRole,
    rateLimit: enableRateLimit = true,
    rateLimitKey,
    auditLog = true,
    public: isPublic = false,
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    const clientIp = getClientIp(request);
    const endpoint = request.nextUrl.pathname;

    // 1. Rate Limiting Check
    if (enableRateLimit) {
      const key = rateLimitKey || clientIp;
      const rateLimitResult = rateLimiter.check(key, endpoint);

      if (!rateLimitResult.allowed) {
        if (auditLog) {
          await logAuditEvent('rate_limit_exceeded', null, request, 'failure', {
            identifier: key,
            retryAfter: rateLimitResult.retryAfter,
          });
        }

        return errorResponse(
          'Too many requests. Please try again later.',
          429,
          'RATE_LIMIT_EXCEEDED',
          {
            'Retry-After': String(Math.ceil((rateLimitResult.retryAfter || 60000) / 1000)),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetAt),
          }
        );
      }

      // Record the request
      rateLimiter.consume(key, endpoint);
    }

    // 2. Authentication Check (skip for public endpoints)
    let user: AuthUser | null = null;
    
    if (!isPublic && requireAuth) {
      const authResult: AuthResult = await authenticateRequest(request);

      if (!authResult.success) {
        if (auditLog) {
          await logAuditEvent('auth_failure', null, request, 'failure', {
            code: authResult.code,
            error: authResult.error,
          });
        }

        const status = authResult.code === 'EXPIRED_TOKEN' ? 401 : 
                       authResult.code === 'MISSING_TOKEN' ? 401 : 401;
        
        return errorResponse(
          authResult.error || 'Authentication required',
          status,
          authResult.code
        );
      }

      user = authResult.user!;

      // 3. Role Check
      if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        if (auditLog) {
          await logAuditEvent('authorization_failure', user, request, 'failure', {
            requiredRole,
            actualRole: user.role,
          });
        }

        return errorResponse(
          `Insufficient role. Required: ${requiredRole}`,
          403,
          'INSUFFICIENT_ROLE'
        );
      }

      // 4. Permission Check
      if (permissions.length > 0) {
        const hasRequiredPermission = permissions.some(p => hasPermission(user!, p));
        
        if (!hasRequiredPermission) {
          if (auditLog) {
            await logAuditEvent('permission_denied', user, request, 'failure', {
              requiredPermissions: permissions,
              userPermissions: user.permissions,
            });
          }

          return errorResponse(
            'Insufficient permissions',
            403,
            'INSUFFICIENT_PERMISSIONS'
          );
        }
      }
    }

    // 5. Execute Handler
    try {
      const context: ApiContext = {
        user: user || {
          id: 'anonymous',
          email: 'anonymous',
          name: 'Anonymous',
          role: 'viewer',
          organizationId: 'public',
          permissions: [],
        },
        request,
        clientIp,
      };

      const response = await handler(request, context);

      // Log successful write operations
      if (auditLog && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        await logAuditEvent(
          `${request.method.toLowerCase()}_${endpoint.replace(/\//g, '_')}`,
          user,
          request,
          'success'
        );
      }

      // Add rate limit headers to response
      if (enableRateLimit) {
        const key = rateLimitKey || clientIp;
        const status = rateLimiter.getStatus(key, endpoint);
        const resetTime = status.blockedUntil || (Date.now() + 60000);
        
        response.headers.set('X-RateLimit-Limit', String(status.limit));
        response.headers.set('X-RateLimit-Remaining', String(status.remaining));
        response.headers.set('X-RateLimit-Reset', String(resetTime));
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (auditLog) {
        await logAuditEvent('handler_error', user, request, 'failure', {
          error: errorMessage,
        });
      }

      console.error(`[API Error] ${endpoint}:`, error);
      
      return errorResponse(
        process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
        500,
        'INTERNAL_ERROR'
      );
    }
  };
}

// =============================================================================
// Convenience Wrappers
// =============================================================================

/**
 * Wrapper for public endpoints (no auth required)
 */
export function withPublicApi(handler: ApiHandler): (request: NextRequest) => Promise<NextResponse> {
  return withApiMiddleware(handler, { public: true, requireAuth: false });
}

/**
 * Wrapper for admin-only endpoints
 */
export function withAdminApi(handler: ApiHandler): (request: NextRequest) => Promise<NextResponse> {
  return withApiMiddleware(handler, { requiredRole: 'admin' });
}

/**
 * Wrapper for read-only endpoints
 */
export function withReadApi(handler: ApiHandler): (request: NextRequest) => Promise<NextResponse> {
  return withApiMiddleware(handler, { permissions: ['read'] });
}

/**
 * Wrapper for write endpoints
 */
export function withWriteApi(handler: ApiHandler): (request: NextRequest) => Promise<NextResponse> {
  return withApiMiddleware(handler, { permissions: ['write'] });
}

// =============================================================================
// Export Rate Limiter for direct access
// =============================================================================

export { rateLimiter };

// =============================================================================
// CORS Utilities
// =============================================================================

/**
 * Allowed origins for CORS requests.
 * Configured via ALLOWED_ORIGINS environment variable (comma-separated).
 * Defaults to localhost origins for development.
 */
const ALLOWED_ORIGINS: string[] = (() => {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim()).filter(Boolean);
  }
  // Default development origins
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'tauri://localhost',
    'https://tauri.localhost',
  ];
})();

/**
 * Check if an origin is allowed for CORS
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    // Allow same-origin requests (no Origin header)
    return true;
  }
  
  // Check exact match
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // In production, strictly enforce allowlist
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  
  // In development, also allow localhost with any port
  const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  return localhostPattern.test(origin);
}

/**
 * Get CORS headers for a request with origin validation.
 * Returns headers with validated origin or rejects invalid origins.
 * 
 * @param request - The incoming request
 * @returns CORS headers object with validated origin
 * 
 * @example
 * ```typescript
 * const corsHeaders = getCorsHeaders(request);
 * return NextResponse.json(data, { headers: corsHeaders });
 * ```
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  
  // Validate origin against allowlist
  const allowedOrigin = isOriginAllowed(origin) ? (origin || '*') : '';
  
  if (!allowedOrigin) {
    // Return minimal headers for rejected origins
    return {
      'Vary': 'Origin',
    };
  }
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Request-ID',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

/**
 * Handle CORS preflight OPTIONS request
 * 
 * @param request - The incoming OPTIONS request
 * @returns NextResponse for preflight request
 * 
 * @example
 * ```typescript
 * export function OPTIONS(request: NextRequest) {
 *   return handleCorsOptions(request);
 * }
 * ```
 */
export function handleCorsOptions(request: NextRequest): NextResponse {
  const corsHeaders = getCorsHeaders(request);
  
  if (!corsHeaders['Access-Control-Allow-Origin']) {
    return new NextResponse(null, { status: 403, headers: corsHeaders });
  }
  
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// =============================================================================
// Compatibility exports
// =============================================================================

/**
 * Log an audit event (exported wrapper for logAuditEvent)
 * @param organizationId - Organization ID
 * @param userId - User ID
 * @param action - Action being audited
 * @param resource - Resource type being accessed
 * @param resourceId - Resource ID
 * @param details - Additional details
 * @param request - The request object
 */
export async function logAudit(
  organizationId: string,
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  details: Record<string, unknown>,
  request: NextRequest
): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    organizationId,
    userId,
    action,
    resource,
    resourceId,
    method: request.method,
    path: request.nextUrl.pathname,
    clientIp: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    details,
  };
  
  // Log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', JSON.stringify(logEntry, null, 2));
  } else {
    console.log('[AUDIT]', JSON.stringify(logEntry));
  }
}
