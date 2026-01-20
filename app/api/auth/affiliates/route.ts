import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

/**
 * CUBE AI - Affiliate Authentication API
 * 
 * Dedicated login for affiliate partners.
 * Separate from user, investor, and admin authentication.
 */

interface AffiliateLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface Affiliate {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  tier: 'starter' | 'professional' | 'elite' | 'enterprise';
  commissionRate: number;
  referralCode: string;
  status: 'active' | 'pending' | 'suspended';
  totalEarnings: number;
  pendingPayout: number;
  createdAt: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cube-ai-default-secret-change-in-production-2026'
);

async function createAffiliateToken(affiliate: Affiliate, rememberMe: boolean): Promise<string> {
  const expirationTime = rememberMe ? '30d' : '24h';
  
  const token = await new SignJWT({
    sub: affiliate.id,
    email: affiliate.email,
    name: affiliate.name,
    tier: affiliate.tier,
    referralCode: affiliate.referralCode,
    type: 'affiliate',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .setIssuer('cube-ai')
    .setAudience('cube-ai-affiliates')
    .sign(JWT_SECRET);

  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body: AffiliateLoginRequest = await request.json();
    const { email, password, rememberMe = false } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // In production, verify against affiliate database
    // Mock affiliate for development
    const mockAffiliates: Record<string, { password: string; affiliate: Affiliate }> = {
      'affiliate@example.com': {
        password: 'affiliate123',
        affiliate: {
          id: 'aff_001',
          email: 'affiliate@example.com',
          name: 'John Partner',
          companyName: 'Partner Marketing LLC',
          tier: 'professional',
          commissionRate: 30,
          referralCode: 'PARTNER30',
          status: 'active',
          totalEarnings: 12450.75,
          pendingPayout: 1875.50,
          createdAt: '2025-03-15T00:00:00Z',
        },
      },
    };

    const affiliateRecord = mockAffiliates[email.toLowerCase()];
    
    if (!affiliateRecord || affiliateRecord.password !== password) {
      console.log('Failed affiliate login:', {
        email,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const affiliate = affiliateRecord.affiliate;
    
    if (affiliate.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your affiliate account has been suspended. Contact support.' },
        { status: 403 }
      );
    }

    if (affiliate.status === 'pending') {
      return NextResponse.json(
        { error: 'Your affiliate application is pending review.' },
        { status: 403 }
      );
    }

    const token = await createAffiliateToken(affiliate, rememberMe);

    console.log('Successful affiliate login:', {
      affiliateId: affiliate.id,
      email: affiliate.email,
      tier: affiliate.tier,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        email: affiliate.email,
        name: affiliate.name,
        companyName: affiliate.companyName,
        tier: affiliate.tier,
        commissionRate: affiliate.commissionRate,
        referralCode: affiliate.referralCode,
        totalEarnings: affiliate.totalEarnings,
        pendingPayout: affiliate.pendingPayout,
      },
      token,
      redirectTo: '/affiliates/dashboard',
    });

    response.cookies.set('cube_affiliate_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Affiliate login error:', error);
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  
  response.cookies.set('cube_affiliate_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
