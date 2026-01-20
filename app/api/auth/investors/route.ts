import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

/**
 * CUBE AI - Investor Authentication API
 * 
 * Dedicated login for investors and stakeholders.
 * Separate from user, affiliate, and admin authentication.
 */

interface InvestorLoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

interface Investor {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  investmentTier: 'angel' | 'seed' | 'strategic';
  totalInvested: number;
  equityPercentage: number;
  cubexTokens: number;
  kycVerified: boolean;
  accreditedInvestor: boolean;
  portfolioValue: number;
  createdAt: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cube-ai-default-secret-change-in-production-2026'
);

async function createInvestorToken(investor: Investor): Promise<string> {
  const token = await new SignJWT({
    sub: investor.id,
    email: investor.email,
    name: investor.name,
    tier: investor.investmentTier,
    kycVerified: investor.kycVerified,
    type: 'investor',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // Shorter for investors due to sensitive data
    .setIssuer('cube-ai')
    .setAudience('cube-ai-investors')
    .sign(JWT_SECRET);

  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body: InvestorLoginRequest = await request.json();
    const { email, password, twoFactorCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // In production, verify against investor database
    // Mock investor for development
    const mockInvestors: Record<string, { password: string; requires2FA: boolean; investor: Investor }> = {
      'investor@example.com': {
        password: 'investor123',
        requires2FA: false,
        investor: {
          id: 'inv_001',
          email: 'investor@example.com',
          name: 'Sarah Investor',
          companyName: 'Strategic Ventures LLC',
          investmentTier: 'seed',
          totalInvested: 50000,
          equityPercentage: 0.5,
          cubexTokens: 50000,
          kycVerified: true,
          accreditedInvestor: true,
          portfolioValue: 62500,
          createdAt: '2025-01-15T00:00:00Z',
        },
      },
    };

    const investorRecord = mockInvestors[email.toLowerCase()];
    
    if (!investorRecord || investorRecord.password !== password) {
      console.log('Failed investor login:', {
        email,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        timestamp: new Date().toISOString(),
        severity: 'high', // Investor login failures are high priority
      });
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check 2FA if required
    if (investorRecord.requires2FA && !twoFactorCode) {
      return NextResponse.json({
        requires2FA: true,
        message: 'Please enter your 2FA code',
      }, { status: 200 });
    }

    const investor = investorRecord.investor;
    
    if (!investor.kycVerified) {
      return NextResponse.json({
        kycRequired: true,
        message: 'Please complete KYC verification to access your investor dashboard.',
        kycUrl: '/investors/kyc',
      }, { status: 403 });
    }

    const token = await createInvestorToken(investor);

    console.log('Successful investor login:', {
      investorId: investor.id,
      email: investor.email,
      tier: investor.investmentTier,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json({
      success: true,
      investor: {
        id: investor.id,
        email: investor.email,
        name: investor.name,
        companyName: investor.companyName,
        investmentTier: investor.investmentTier,
        totalInvested: investor.totalInvested,
        equityPercentage: investor.equityPercentage,
        cubexTokens: investor.cubexTokens,
        portfolioValue: investor.portfolioValue,
        kycVerified: investor.kycVerified,
      },
      token,
      redirectTo: '/investors/dashboard',
    });

    response.cookies.set('cube_investor_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Stricter for investors
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Investor login error:', error);
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  
  response.cookies.set('cube_investor_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}
