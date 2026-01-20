import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  context?: 'sales' | 'support' | 'general';
  history?: ChatMessage[];
}

const SYSTEM_PROMPTS = {
  sales: `You are CUBE's friendly and knowledgeable AI sales assistant. Your goal is to help potential customers understand CUBE's browser automation platform and guide them towards making a purchase decision.

Key points about CUBE:
- CUBE is an enterprise-grade browser automation and data extraction platform
- Features include: AI-powered automation, cross-browser support, visual workflow builder, scheduling, and API access
- Pricing tiers: Free ($0), Pro ($29/mo), Business ($99/mo), Enterprise (custom)
- 14-day free trial available
- SOC 2 compliant, GDPR ready
- Used by Fortune 500 companies

Guidelines:
- Be helpful, friendly, and professional
- Focus on understanding the customer's needs
- Highlight relevant features based on their use case
- Offer to schedule a demo for complex questions
- Don't make promises about features that don't exist
- Keep responses concise but informative`,

  support: `You are CUBE's helpful AI support assistant. Your goal is to help users solve their technical issues and answer questions about using CUBE.

Guidelines:
- Be patient and empathetic
- Provide clear, step-by-step instructions when applicable
- Link to documentation when relevant
- Escalate to human support for complex issues
- Never share sensitive customer information`,

  general: `You are CUBE's AI assistant. Help users with general questions about CUBE and its capabilities. Be friendly, helpful, and professional.`,
};

const FALLBACK_RESPONSES: Record<string, string[]> = {
  pricing: [
    "CUBE offers flexible pricing to fit your needs:\n\n**Free**: $0/month - Perfect for getting started with 100 tasks/month\n\n**Pro**: $29/month - For professionals with 1,000 tasks/month\n\n**Business**: $99/month - For teams with 10,000 tasks/month\n\n**Enterprise**: Custom pricing - Unlimited tasks with dedicated support\n\nAll paid plans include a 14-day free trial. Would you like me to help you choose the right plan?",
  ],
  features: [
    "CUBE is packed with powerful features:\n\n🤖 **AI-Powered Automation** - Natural language workflow creation\n\n🌐 **Cross-Browser Support** - Works with Chrome, Firefox, Edge, and more\n\n📊 **Visual Workflow Builder** - No coding required\n\n⏰ **Smart Scheduling** - Run automations on your schedule\n\n🔌 **API Access** - Integrate with your existing tools\n\n📈 **Analytics Dashboard** - Track performance and results\n\n🔒 **Enterprise Security** - SOC 2 compliant, GDPR ready\n\nWould you like to know more about any specific feature?",
  ],
  demo: [
    "I'd be happy to help you schedule a demo! Our team can show you exactly how CUBE can help with your specific use case.\n\nYou can:\n1. **Book directly** at cube.ai/demo\n2. **Email us** at sales@cube.ai\n3. **Call us** at 1-800-CUBE-AI\n\nOr, tell me more about what you're looking to automate and I can help you prepare for the demo!",
  ],
  enterprise: [
    "CUBE Enterprise is designed for organizations with complex automation needs:\n\n✅ **Unlimited tasks** - No usage caps\n✅ **Dedicated support** - 24/7 priority assistance\n✅ **Custom integrations** - Connect with your existing tools\n✅ **On-premise option** - Full control over your data\n✅ **SLA guarantees** - 99.9% uptime commitment\n✅ **Team management** - Advanced access controls\n✅ **Compliance** - SOC 2, HIPAA, GDPR ready\n\nWould you like to speak with our enterprise team?",
  ],
};

function getKeywordResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('pricing') || lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('plan')) {
    return FALLBACK_RESPONSES.pricing[0];
  }
  
  if (lowerMessage.includes('feature') || lowerMessage.includes('what can') || lowerMessage.includes('capabilities') || lowerMessage.includes('what does')) {
    return FALLBACK_RESPONSES.features[0];
  }
  
  if (lowerMessage.includes('demo') || lowerMessage.includes('schedule') || lowerMessage.includes('call') || lowerMessage.includes('meeting')) {
    return FALLBACK_RESPONSES.demo[0];
  }
  
  if (lowerMessage.includes('enterprise') || lowerMessage.includes('large') || lowerMessage.includes('company') || lowerMessage.includes('organization')) {
    return FALLBACK_RESPONSES.enterprise[0];
  }
  
  return null;
}

async function callOpenAI(
  messages: ChatMessage[],
  context: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return getKeywordResponse(messages[messages.length - 1]?.content || '') 
      || "I'm happy to help! Could you tell me more about what you're looking for? I can provide information about CUBE's features, pricing, or help you schedule a demo.";
  }
  
  const systemMessage: ChatMessage = {
    role: 'system',
    content: SYSTEM_PROMPTS[context as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.general,
  };
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [systemMessage, ...messages],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      throw new Error('OpenAI API error');
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    return getKeywordResponse(messages[messages.length - 1]?.content || '')
      || "I'm experiencing some technical difficulties. Please try again or contact our team directly at sales@cube.ai.";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    
    const { message, context = 'general', history = [] } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message is too long' },
        { status: 400 }
      );
    }
    
    const messages: ChatMessage[] = [
      ...history.slice(-10),
      { role: 'user', content: message },
    ];
    
    const response = await callOpenAI(messages, context);
    
    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'CUBE AI Chat API',
    endpoints: {
      POST: '/api/ai/chat - Send a message to the AI assistant',
    },
  });
}
