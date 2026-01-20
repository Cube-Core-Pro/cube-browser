import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

/**
 * CUBE AI - Admin Authentication API
 * 
 * Dedicated login for SuperAdmin and Admin users.
 * Highest security level with mandatory 2FA option.
 */

interface AdminLoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'superadmin';
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cube-ai-default-secret-change-in-production-2026'
);

const ADMIN_2FA_SECRET = process.env.ADMIN_2FA_SECRET || 'admin-2fa-secret';

async function createAdminToken(admin: Admin): Promise<string> {
  const token = await new SignJWT({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    permissions: admin.permissions,
    type: 'admin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('4h') // Short expiration for admin
    .setIssuer('cube-ai')
    .setAudience('cube-ai-admin')
    .sign(JWT_SECRET);

  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body: AdminLoginRequest = await request.json();
    const { email, password, twoFactorCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // In production, verify against admin database
    // Mock admins for development
    const mockAdmins: Record<string, { password: string; requires2FA: boolean; admin: Admin }> = {
      'superadmin@cubeai.tools': {
        password: 'SuperAdmin123!',
        requires2FA: true,
        admin: {
          id: 'adm_super_001',
          email: 'superadmin@cubeai.tools',
          name: 'Super Administrator',
          role: 'superadmin',
          permissions: ['*'], // All permissions
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      'admin@cubeai.tools': {
        password: 'Admin123!',
        requires2FA: false,
        admin: {
          id: 'adm_001',
          email: 'admin@cubeai.tools',
          name: 'Platform Admin',
          role: 'admin',
          permissions: [
            'users.read', 'users.write',
            'affiliates.read', 'affiliates.write',
            'licenses.read', 'licenses.write',
            'content.read', 'content.write',
          ],
          createdAt: '2024-06-15T00:00:00Z',
        },
      },
    };

    const adminRecord = mockAdmins[email.toLowerCase()];
    
    if (!adminRecord || adminRecord.password !== password) {
      // Log security event
      console.error('SECURITY: Failed admin login attempt', {
        email,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
        severity: 'critical',
      });
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check 2FA if required
    if (adminRecord.requires2FA) {
      if (!twoFactorCode) {
        return NextResponse.json({
          requires2FA: true,
          message: 'Please enter your 2FA code',
        }, { status: 200 });
      }
      
      // In production, verify TOTP code
      // For development, accept '123456'
      if (twoFactorCode !== '123456') {
        return NextResponse.json(
          { error: 'Invalid 2FA code' },
          { status: 401 }
        );
      }
    }

    const admin = adminRecord.admin;
    const token = await createAdminToken(admin);

    // Log successful admin login
    console.log('SECURITY: Admin login successful', {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
      },
      token,
      redirectTo: '/admin',
    });

    response.cookies.set('cube_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 60 * 60, // 4 hours
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Log admin logout
  console.log('SECURITY: Admin logout', {
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    timestamp: new Date().toISOString(),
  });

  const response = NextResponse.json({ success: true, message: 'Logged out' });
  
  response.cookies.set('cube_admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}
