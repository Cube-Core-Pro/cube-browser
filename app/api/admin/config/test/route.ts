import { NextRequest, NextResponse } from 'next/server';

// Test connection endpoint for various services
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    switch (type) {
      case 'ai':
        return await testOpenAI();
      case 'stripe':
        return await testStripe();
      case 'email':
        return await testEmail();
      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Test failed' 
    }, { status: 500 });
  }
}

async function testOpenAI(): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      success: false, 
      error: 'OPENAI_API_KEY is not configured' 
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'OpenAI API connection successful' 
      });
    } else {
      const error = await response.json();
      return NextResponse.json({ 
        success: false, 
        error: error.error?.message || 'API authentication failed' 
      });
    }
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect to OpenAI API' 
    });
  }
}

async function testStripe(): Promise<NextResponse> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    return NextResponse.json({ 
      success: false, 
      error: 'STRIPE_SECRET_KEY is not configured' 
    });
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        'Authorization': `Bearer ${secretKey}`
      }
    });

    if (response.ok) {
      const balance = await response.json();
      return NextResponse.json({ 
        success: true, 
        message: `Stripe connection successful. Mode: ${secretKey.startsWith('sk_live_PLACEHOLDER') ? 'LIVE' : 'TEST'}`,
        data: {
          mode: secretKey.startsWith('sk_live_PLACEHOLDER') ? 'live' : 'test',
          currency: balance.available?.[0]?.currency || 'usd'
        }
      });
    } else {
      const error = await response.json();
      return NextResponse.json({ 
        success: false, 
        error: error.error?.message || 'Stripe API authentication failed' 
      });
    }
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect to Stripe API' 
    });
  }
}

async function testEmail(): Promise<NextResponse> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  
  if (!host) {
    return NextResponse.json({ 
      success: false, 
      error: 'SMTP_HOST is not configured' 
    });
  }

  if (!user || !password) {
    return NextResponse.json({ 
      success: false, 
      error: 'SMTP credentials are not fully configured' 
    });
  }

  // Since we can't actually test SMTP without a library, we'll just validate the config
  // In production, you would use nodemailer or similar to test
  const configValid = host && port && user && password;

  if (configValid) {
    return NextResponse.json({ 
      success: true, 
      message: `SMTP configuration appears valid. Host: ${host}:${port}`,
      data: {
        host,
        port,
        user: user.substring(0, 3) + '***'
      }
    });
  }

  return NextResponse.json({ 
    success: false, 
    error: 'SMTP configuration is incomplete' 
  });
}
