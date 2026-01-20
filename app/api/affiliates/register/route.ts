import { NextRequest, NextResponse } from 'next/server';

interface AffiliateRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company?: string;
  website?: string;
  socialMedia?: string;
  audienceSize: string;
  niche: string;
  promotionMethods: string[];
  tier: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AffiliateRegisterRequest = await request.json();
    
    const { firstName, lastName, email, password, niche, audienceSize, promotionMethods, tier } = body;
    
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'First name, last name, email, and password are required' },
        { status: 400 }
      );
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    if (!niche || !audienceSize || !promotionMethods || promotionMethods.length === 0) {
      return NextResponse.json(
        { error: 'Please complete all required profile information' },
        { status: 400 }
      );
    }
    
    // In production, this would:
    // 1. Check if email already exists
    // 2. Hash password
    // 3. Create user in database
    // 4. Generate affiliate referral code
    // 5. Send welcome email with referral link
    // 6. Set up Stripe Connect for payouts
    
    console.log('New affiliate registration:', {
      name: `${firstName} ${lastName}`,
      email,
      company: body.company,
      website: body.website,
      niche,
      audienceSize,
      promotionMethods,
      tier,
      timestamp: new Date().toISOString(),
    });
    
    // Generate affiliate code
    const affiliateCode = `CUBE-${firstName.substring(0, 3).toUpperCase()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const affiliateId = `AFF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine commission rate based on tier
    const commissionRates: Record<string, number> = {
      starter: 20,
      professional: 30,
      elite: 40,
      enterprise: 50,
    };
    
    return NextResponse.json({
      success: true,
      affiliateId,
      affiliateCode,
      referralLink: `https://cube.ai/ref/${affiliateCode}`,
      commissionRate: commissionRates[tier] || 20,
      message: 'Welcome to the CUBE Affiliate Program!',
      nextSteps: [
        'Check your email for login credentials',
        'Access your affiliate dashboard',
        'Get your unique referral links',
        'Start sharing and earning!',
      ],
    });
    
  } catch (error) {
    console.error('Affiliate registration API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'CUBE Affiliate Registration API',
    tiers: [
      { id: 'starter', name: 'Starter', commission: '20%' },
      { id: 'professional', name: 'Professional', commission: '30%' },
      { id: 'elite', name: 'Elite', commission: '40%' },
      { id: 'enterprise', name: 'Enterprise', commission: '50%' },
    ],
  });
}
