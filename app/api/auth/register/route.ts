import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import crypto from 'crypto';

/**
 * CUBE AI - User Registration API
 * 
 * Handles new user registration for the main platform.
 */

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  company?: string;
  referralCode?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: 'user';
  tier: 'free';
  createdAt: string;
  referredBy?: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cube-ai-default-secret-change-in-production-2026'
);

function generateUserId(): string {
  return `usr_${crypto.randomBytes(12).toString('hex')}`;
}

function hashPassword(password: string): string {
  // In production, use bcrypt or argon2
  return crypto.createHash('sha256').update(password + 'cube-salt').digest('hex');
}

async function createToken(user: User): Promise<string> {
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
    .setExpirationTime('24h')
    .setIssuer('cube-ai')
    .setAudience('cube-ai-users')
    .sign(JWT_SECRET);

  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { name, email, password, company, referralCode } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check password strength
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return NextResponse.json(
        { error: 'Password must contain uppercase, lowercase, and numbers' },
        { status: 400 }
      );
    }

    // In production, check if email already exists in database
    // For now, simulate registration
    
    const newUser: User = {
      id: generateUserId(),
      email: email.toLowerCase().trim(),
      name: name.trim(),
      company: company?.trim(),
      role: 'user',
      tier: 'free',
      createdAt: new Date().toISOString(),
      referredBy: referralCode,
    };

    // Hash password (in production, store in database)
    const hashedPassword = hashPassword(password);
    
    // Log registration
    console.log('New user registration:', {
      userId: newUser.id,
      email: newUser.email,
      referralCode: referralCode || 'none',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString(),
    });

    // If referral code provided, credit the referrer
    if (referralCode) {
      console.log('Referral credit:', {
        referralCode,
        newUserId: newUser.id,
        timestamp: new Date().toISOString(),
      });
    }

    // Create token for auto-login after registration
    const token = await createToken(newUser);

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        tier: newUser.tier,
      },
      token,
    });

    // Set HTTP-only cookie
    response.cookies.set('cube_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Registration API error:', error);
    
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
