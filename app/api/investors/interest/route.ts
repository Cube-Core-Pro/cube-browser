import { NextRequest, NextResponse } from 'next/server';

interface InvestorInterestRequest {
  name: string;
  email: string;
  company?: string;
  tier: string;
  investmentAmount?: number;
  message?: string;
  accreditedInvestor?: boolean;
  preferredContact?: 'email' | 'phone' | 'video';
}

export async function POST(request: NextRequest) {
  try {
    const body: InvestorInterestRequest = await request.json();
    
    const { name, email, tier } = body;
    
    if (!name || !email || !tier) {
      return NextResponse.json(
        { error: 'Name, email, and investment tier are required' },
        { status: 400 }
      );
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    // In production, this would:
    // 1. Save to database
    // 2. Send notification email to investors@cube.ai
    // 3. Add to CRM (e.g., HubSpot, Salesforce)
    // 4. Send confirmation email to the investor
    // 5. Trigger any automation workflows
    
    console.log('New investor interest:', {
      name,
      email,
      company: body.company,
      tier,
      investmentAmount: body.investmentAmount,
      accreditedInvestor: body.accreditedInvestor,
      preferredContact: body.preferredContact,
      timestamp: new Date().toISOString(),
    });
    
    // Simulate database save
    const investorId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({
      success: true,
      investorId,
      message: 'Thank you for your interest. Our team will contact you within 24 hours.',
      nextSteps: [
        'Check your email for a confirmation message',
        'Schedule a call with our team',
        'Review our investor deck (link will be sent via email)',
      ],
    });
    
  } catch (error) {
    console.error('Investor interest API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'CUBE Investor Interest API',
    tiers: [
      { id: 'angel', name: 'Angel', range: '$5,000 - $25,000', equity: '0.05% - 0.25%' },
      { id: 'seed', name: 'Seed', range: '$25,000 - $100,000', equity: '0.25% - 1%' },
      { id: 'strategic', name: 'Strategic', range: '$100,000 - $500,000', equity: '1% - 5%' },
    ],
  });
}
