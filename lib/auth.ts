/**
 * CUBE Elite v7 - Authentication Middleware
 * 
 * Provides JWT-based authentication and session validation.
 * Supports multiple authentication strategies.
 * 
 * Features:
 * - JWT token validation
 * - Session management
 * - API key authentication
 * - Role-based access control
 * - Tenant isolation (multi-tenancy)
 * 
 * @module lib/auth
 */

import { jwtVerify, SignJWT, JWTPayload } from 'jose';
import db from '@/lib/database';
import crypto from 'crypto';

// =============================================================================
// Types
// =============================================================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer' | 'api';
  organizationId: string;
  tenantId?: string;
  permissions: string[];
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: Date;
  refreshToken?: string;
}

export interface JWTCustomPayload extends JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  tenantId?: string;
  permissions: string[];
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  code?: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'MISSING_TOKEN' | 'INVALID_API_KEY' | 'UNAUTHORIZED';
}

export interface ApiKeyConfig {
  prefix: string;
  organizationId: string;
  permissions: string[];
  rateLimit?: number;
  expiresAt?: Date;
}

// =============================================================================
// Configuration
// =============================================================================

const JWT_SECRET = process.env.JWT_SECRET || process.env.APP_SECRET || 'cube-elite-dev-secret-change-in-production';
const JWT_ISSUER = 'cube-elite';
const JWT_AUDIENCE = 'cube-elite-api';
const TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

// Encode the secret for jose library
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

// =============================================================================
// JWT Functions
// =============================================================================

/**
 * Generate a JWT token for a user
 */
export async function generateToken(user: AuthUser): Promise<string> {
  const payload: JWTCustomPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    tenantId: user.tenantId,
    permissions: user.permissions,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(TOKEN_EXPIRY)
    .setSubject(user.id)
    .sign(getSecretKey());

  return token;
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setSubject(userId)
    .sign(getSecretKey());

  return token;
}

/**
 * Verify a JWT token and extract the payload
 */
export async function verifyToken(token: string): Promise<AuthResult> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    const customPayload = payload as JWTCustomPayload;

    const user: AuthUser = {
      id: customPayload.userId,
      email: customPayload.email,
      name: customPayload.name,
      role: customPayload.role as AuthUser['role'],
      organizationId: customPayload.organizationId,
      tenantId: customPayload.tenantId,
      permissions: customPayload.permissions || [],
    };

    return { success: true, user };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return { success: false, error: 'Token has expired', code: 'EXPIRED_TOKEN' };
      }
      if (error.message.includes('invalid')) {
        return { success: false, error: 'Invalid token', code: 'INVALID_TOKEN' };
      }
    }
    return { success: false, error: 'Token verification failed', code: 'INVALID_TOKEN' };
  }
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (payload.type !== 'refresh') {
      return { success: false, error: 'Not a refresh token' };
    }

    return { success: true, userId: payload.sub };
  } catch (_error) {
    return { success: false, error: 'Invalid refresh token' };
  }
}

// =============================================================================
// API Key Functions
// =============================================================================

/**
 * Validate an API key
 */
export async function validateApiKey(apiKey: string): Promise<AuthResult> {
  if (!apiKey || !apiKey.startsWith('cube_')) {
    return { success: false, error: 'Invalid API key format', code: 'INVALID_API_KEY' };
  }

  try {
    // Look up API key in database
    const row = await db.queryOne<{
      id: string;
      organization_id: string;
      name: string;
      permissions: string[];
      expires_at: Date | null;
      revoked: boolean;
      last_used_at: Date | null;
    }>(
      `SELECT * FROM api_keys WHERE key_hash = $1 AND revoked = false`,
      [hashApiKey(apiKey)]
    );

    if (!row) {
      // For development, allow test API keys
      if (process.env.NODE_ENV === 'development' && apiKey === 'cube_test_dev_key') {
        return {
          success: true,
          user: {
            id: 'api-dev',
            email: 'api@dev.local',
            name: 'Development API',
            role: 'api',
            organizationId: 'org-1',
            permissions: ['read', 'write'],
          },
        };
      }
      return { success: false, error: 'API key not found', code: 'INVALID_API_KEY' };
    }

    // Check expiration
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return { success: false, error: 'API key has expired', code: 'INVALID_API_KEY' };
    }

    // Update last used timestamp
    await db.query(
      `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
      [row.id]
    ).catch(() => { /* ignore update errors */ });

    return {
      success: true,
      user: {
        id: `api-${row.id}`,
        email: `api-${row.name}@cube.local`,
        name: row.name,
        role: 'api',
        organizationId: row.organization_id,
        permissions: row.permissions || ['read'],
      },
    };
  } catch (_error) {
    // If database is not available, allow dev key in development
    if (process.env.NODE_ENV === 'development' && apiKey === 'cube_test_dev_key') {
      return {
        success: true,
        user: {
          id: 'api-dev',
          email: 'api@dev.local',
          name: 'Development API',
          role: 'api',
          organizationId: 'org-1',
          permissions: ['read', 'write'],
        },
      };
    }
    return { success: false, error: 'Failed to validate API key', code: 'INVALID_API_KEY' };
  }
}

/**
 * Hash an API key for storage
 */
function hashApiKey(apiKey: string): string {
  // Simple hash for now - in production use crypto.subtle or bcrypt
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// =============================================================================
// Request Authentication
// =============================================================================

/**
 * Extract token from request headers
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check for token in cookie
  const cookies = request.headers.get('cookie');
  if (cookies) {
    const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('cube_token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1].trim();
    }
  }
  
  return null;
}

/**
 * Extract API key from request headers
 */
export function extractApiKey(request: Request): string | null {
  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }
  
  // Check Authorization with ApiKey scheme
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('ApiKey ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Authenticate a request using any available method
 */
export async function authenticateRequest(request: Request): Promise<AuthResult> {
  // Try API key first (for machine-to-machine auth)
  const apiKey = extractApiKey(request);
  if (apiKey) {
    return validateApiKey(apiKey);
  }
  
  // Try JWT token
  const token = extractToken(request);
  if (token) {
    return verifyToken(token);
  }
  
  return { success: false, error: 'No authentication provided', code: 'MISSING_TOKEN' };
}

// =============================================================================
// Permission Checking
// =============================================================================

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: AuthUser, permission: string): boolean {
  // Admin has all permissions
  if (user.role === 'admin') {
    return true;
  }
  
  return user.permissions.includes(permission) || user.permissions.includes('*');
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: AuthUser, permissions: string[]): boolean {
  if (user.role === 'admin') {
    return true;
  }
  
  return permissions.some(p => user.permissions.includes(p) || user.permissions.includes('*'));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: AuthUser, permissions: string[]): boolean {
  if (user.role === 'admin') {
    return true;
  }
  
  if (user.permissions.includes('*')) {
    return true;
  }
  
  return permissions.every(p => user.permissions.includes(p));
}

/**
 * Check if a user can access a resource in a specific organization
 */
export function canAccessOrganization(user: AuthUser, organizationId: string): boolean {
  // Admin can access any org in development
  if (process.env.NODE_ENV === 'development' && user.role === 'admin') {
    return true;
  }
  
  return user.organizationId === organizationId;
}

/**
 * Check if a user can access a specific tenant
 */
export function canAccessTenant(user: AuthUser, tenantId: string): boolean {
  // If user has no tenant restriction, they can access any tenant in their org
  if (!user.tenantId) {
    return true;
  }
  
  return user.tenantId === tenantId;
}

// =============================================================================
// Role Definitions
// =============================================================================

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  user: [
    'read', 'write',
    'notifications:read', 'notifications:write',
    'analytics:read',
    'workflows:read', 'workflows:write',
    'data:read', 'data:write',
  ],
  viewer: [
    'read',
    'notifications:read',
    'analytics:read',
    'workflows:read',
    'data:read',
  ],
  api: [
    'read', 'write',
    'api:access',
  ],
};

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: AuthUser['role']): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

// =============================================================================
// Session Helpers
// =============================================================================

/**
 * Create a new session for a user
 */
export async function createSession(user: AuthUser): Promise<AuthSession> {
  const token = await generateToken(user);
  const refreshToken = await generateRefreshToken(user.id);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return {
    user,
    token,
    expiresAt,
    refreshToken,
  };
}

/**
 * Refresh a session using a refresh token
 */
export async function refreshSession(refreshToken: string): Promise<AuthSession | null> {
  const result = await verifyRefreshToken(refreshToken);
  
  if (!result.success || !result.userId) {
    return null;
  }
  
  // Look up user from database
  try {
    const userRow = await db.queryOne<{
      id: string;
      email: string;
      name: string;
      role: string;
      organization_id: string;
      tenant_id: string | null;
      permissions: string[];
    }>(
      `SELECT * FROM users WHERE id = $1`,
      [result.userId]
    );
    
    if (!userRow) {
      return null;
    }
    
    const user: AuthUser = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role as AuthUser['role'],
      organizationId: userRow.organization_id,
      tenantId: userRow.tenant_id || undefined,
      permissions: userRow.permissions || getDefaultPermissions(userRow.role as AuthUser['role']),
    };
    
    return createSession(user);
  } catch (error) {
    console.error('Failed to refresh session:', error);
    return null;
  }
}

// =============================================================================
// Export types
// =============================================================================

export type { JWTPayload };

// =============================================================================
// Compatibility aliases
// =============================================================================

/**
 * Alias for AuthUser - used by some API routes
 */
export type AuthenticatedUser = AuthUser;

/**
 * Verify authentication for a request
 * @param request - The incoming request
 * @returns Authentication result with user if authenticated
 */
export async function verifyAuth(request: Request): Promise<{ authenticated: boolean; user?: AuthUser; error?: string }> {
  const result = await authenticateRequest(request);
  
  return {
    authenticated: result.success,
    user: result.user,
    error: result.error,
  };
}
