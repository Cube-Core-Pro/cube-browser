import { NextRequest, NextResponse } from 'next/server';
import { setConfig, getConfig, clearConfig, clearAllConfigs } from '@/lib/config/config-service';

// Mask sensitive values for display
const maskSensitiveValue = (key: string, value: string): string => {
  const sensitiveKeys = ['KEY', 'SECRET', 'PASSWORD', 'TOKEN'];
  const isSensitive = sensitiveKeys.some(sk => key.toUpperCase().includes(sk));
  
  if (isSensitive && value) {
    if (value.length <= 8) return '••••••••';
    return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
  }
  return value;
};

// Configuration keys and their defaults
const CONFIG_KEYS = {
  // AI Configuration
  OPENAI_API_KEY: '',
  OPENAI_MODEL: 'gpt-4-turbo-preview',
  
  // Stripe Configuration
  STRIPE_SECRET_KEY: '',
  STRIPE_PUBLISHABLE_KEY: '',
  STRIPE_WEBHOOK_SECRET: '',
  STRIPE_PRICE_PRO_MONTHLY: '',
  STRIPE_PRICE_PRO_YEARLY: '',
  STRIPE_PRICE_ELITE_MONTHLY: '',
  STRIPE_PRICE_ELITE_YEARLY: '',
  
  // Email Configuration
  SMTP_HOST: '',
  SMTP_PORT: '587',
  SMTP_USER: '',
  SMTP_PASSWORD: '',
  SMTP_FROM: '',
  SMTP_FROM_NAME: 'CUBE AI',
  
  // General
  SITE_URL: '',
  SITE_NAME: 'CUBE AI Tools',
  
  // Analytics
  GOOGLE_ANALYTICS_ID: '',
  
  // Feature Flags
  ENABLE_AI_CHAT: 'true',
  ENABLE_STRIPE: 'true',
  ENABLE_EMAIL: 'true',
  MAINTENANCE_MODE: 'false',
};

// GET - Retrieve current configuration
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check for superadmin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get configuration from centralized service
    const maskedConfig: Record<string, { value: string; masked: string; isSet: boolean }> = {};
    
    for (const [key, defaultValue] of Object.entries(CONFIG_KEYS)) {
      const value = getConfig(key, defaultValue);
      maskedConfig[key] = {
        value: '', // Never send actual value to frontend
        masked: maskSensitiveValue(key, value),
        isSet: !!value && value.length > 0 && !value.includes('...')
      };
    }

    return NextResponse.json({
      success: true,
      config: maskedConfig,
      groups: {
        ai: ['OPENAI_API_KEY', 'OPENAI_MODEL'],
        stripe: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET', 
                 'STRIPE_PRICE_PRO_MONTHLY', 'STRIPE_PRICE_PRO_YEARLY',
                 'STRIPE_PRICE_ELITE_MONTHLY', 'STRIPE_PRICE_ELITE_YEARLY'],
        email: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM', 'SMTP_FROM_NAME'],
        general: ['SITE_URL', 'SITE_NAME', 'GOOGLE_ANALYTICS_ID'],
        features: ['ENABLE_AI_CHAT', 'ENABLE_STRIPE', 'ENABLE_EMAIL', 'MAINTENANCE_MODE']
      }
    });
  } catch (error) {
    console.error('Config GET error:', error);
    return NextResponse.json({ error: 'Failed to get configuration' }, { status: 500 });
  }
}

// POST - Update configuration
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check for superadmin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Validate key is allowed
    if (!(key in CONFIG_KEYS)) {
      return NextResponse.json({ error: 'Invalid configuration key' }, { status: 400 });
    }

    // Update configuration using centralized service
    setConfig(key, value);

    console.log(`[Config] Updated ${key} via SuperAdmin`);

    return NextResponse.json({
      success: true,
      message: `Configuration ${key} updated successfully`,
      masked: maskSensitiveValue(key, value)
    });
  } catch (error) {
    console.error('Config POST error:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}

// PUT - Bulk update configuration
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Check for superadmin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body;

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Updates object is required' }, { status: 400 });
    }

    const results: { key: string; success: boolean; error?: string }[] = [];

    for (const [key, value] of Object.entries(updates)) {
      try {
        setConfig(key, value as string);
        results.push({ key, success: true });
      } catch (err) {
        results.push({ key, success: false, error: String(err) });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bulk configuration update completed',
      results
    });
  } catch (error) {
    console.error('Config PUT error:', error);
    return NextResponse.json({ error: 'Failed to bulk update configuration' }, { status: 500 });
  }
}

// DELETE - Reset configuration to default
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Check for superadmin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Reset single key
      clearConfig(key);
      return NextResponse.json({
        success: true,
        message: `Configuration ${key} reset to default`
      });
    } else {
      // Reset all
      clearAllConfigs();
      return NextResponse.json({
        success: true,
        message: 'All configurations reset to defaults'
      });
    }
  } catch (error) {
    console.error('Config DELETE error:', error);
    return NextResponse.json({ error: 'Failed to reset configuration' }, { status: 500 });
  }
}
