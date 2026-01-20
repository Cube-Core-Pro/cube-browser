import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

/**
 * CUBE AI - User Authentication API
 * 
 * Handles standard user login for the main platform.
 * Separate from affiliate, investor, and admin logins.
 */

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'superadmin' | 'investor';
  tier: 'free' | 'pro' | 'elite' | 'enterprise';
  createdAt: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cube-ai-default-secret-change-in-production-2026'
);

async function createToken(user: User, rememberMe: boolean): Promise<string> {
  const expirationTime = rememberMe ? '30d' : '24h';
  
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tier: user.tier,
    type: 'user',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .setIssuer('cube-ai')
    .setAudience('cube-ai-users')
    .sign(JWT_SECRET);

  return token;
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = await new SignJWT({
    sub: userId,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('90d')
    .setIssuer('cube-ai')
    .sign(JWT_SECRET);

  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password, rememberMe = false } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // In production, verify against database
    // Demo accounts for testing - synchronized with login page demo buttons
    const mockUsers: Record<string, { password: string; user: User }> = {
      // SuperAdmin Account - Full platform access
      'superadmin@cube.ai': {
        password: 'CubeSuper@2026!',
        user: {
          id: 'usr_superadmin_001',
          email: 'superadmin@cube.ai',
          name: 'Super Administrator',
          role: 'superadmin',
          tier: 'enterprise',
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      // Admin Account - Dashboard and user management
      'admin@cube.ai': {
        password: 'CubeAdmin@2026!',
        user: {
          id: 'usr_admin_001',
          email: 'admin@cube.ai',
          name: 'Admin User',
          role: 'admin',
          tier: 'enterprise',
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      // Investor Account - Financial dashboards
      'investor@cube.ai': {
        password: 'CubeInvest@2026!',
        user: {
          id: 'usr_investor_001',
          email: 'investor@cube.ai',
          name: 'Investor Demo',
          role: 'investor',
          tier: 'enterprise',
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      // Standard Demo User
      'demo@cube.ai': {
        password: 'CubeDemo@2026!',
        user: {
          id: 'usr_demo_001',
          email: 'demo@cube.ai',
          name: 'Demo User',
          role: 'user',
          tier: 'pro',
          createdAt: '2025-06-15T00:00:00Z',
        },
      },
      // Legacy accounts for backwards compatibility
      'admin@cubeai.tools': {
        password: 'admin123',
        user: {
          id: 'usr_legacy_admin',
          email: 'admin@cubeai.tools',
          name: 'Legacy Admin',
          role: 'superadmin',
          tier: 'enterprise',
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      'user@example.com': {
        password: 'user123',
        user: {
          id: 'usr_test_001',
          email: 'user@example.com',
          name: 'Test User',
          role: 'user',
          tier: 'pro',
          createdAt: '2025-06-15T00:00:00Z',
        },
      },
    };

    const userRecord = mockUsers[email.toLowerCase()];
    
    if (!userRecord || userRecord.password !== password) {
      // Log failed attempt for security monitoring
      console.log('Failed login attempt:', {
        email,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = userRecord.user;
    const token = await createToken(user, rememberMe);
    const refreshToken = await createRefreshToken(user.id);

    // Log successful login
    console.log('Successful login:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier,
      },
      token,
      refreshToken,
      expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // seconds
    });

    // Set HTTP-only cookies for additional security
    response.cookies.set('cube_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login API error:', error);
    
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Logout - clear cookies
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  response.cookies.set('cube_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
