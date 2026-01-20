import { NextRequest, NextResponse } from 'next/server';

interface ForgotPasswordRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json();
    
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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
    // 1. Check if email exists in database
    // 2. Generate secure reset token
    // 3. Store token with expiration (e.g., 1 hour)
    // 4. Send email with reset link
    // 5. Log the attempt for security
    
    // For security, always return success even if email doesn't exist
    // This prevents email enumeration attacks
    
    console.log('Password reset requested:', {
      email,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    
    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, you will receive a password reset link shortly.',
    });
    
  } catch (error) {
    console.error('Forgot password API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
