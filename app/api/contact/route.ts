import { NextRequest, NextResponse } from 'next/server';

interface ContactRequest {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  plan?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactRequest = await request.json();
    
    const { name, email, subject, message } = body;
    
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    if (message.length < 10) {
      return NextResponse.json(
        { error: 'Message is too short' },
        { status: 400 }
      );
    }
    
    // In production, this would:
    // 1. Save to database
    // 2. Send notification to support team
    // 3. Send confirmation email to user
    // 4. Create ticket in support system
    // 5. Route based on subject (sales, support, etc.)
    
    console.log('New contact message:', {
      name,
      email,
      company: body.company,
      subject,
      message: message.substring(0, 200),
      plan: body.plan,
      timestamp: new Date().toISOString(),
    });
    
    // Generate ticket ID
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Thank you for contacting us. We will respond within 24 hours.',
      estimatedResponse: '24 hours',
    });
    
  } catch (error) {
    console.error('Contact API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'CUBE Contact API',
    subjects: [
      { value: 'general', label: 'General Inquiry' },
      { value: 'sales', label: 'Sales & Pricing' },
      { value: 'support', label: 'Technical Support' },
      { value: 'partnerships', label: 'Partnerships' },
      { value: 'press', label: 'Press & Media' },
      { value: 'careers', label: 'Careers' },
    ],
  });
}
