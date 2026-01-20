'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AICopilot');

import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Bot,
  Sparkles,
  Send,
  Lightbulb,
  Code,
  FileJson,
  Workflow,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Brain,
  Wand2,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'workflow' | 'suggestion' | 'code';
  data?: unknown;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
}

interface NexusProps {
  context?: 'workflow' | 'selector' | 'automation' | 'general' | 'password';
  onWorkflowGenerated?: (workflow: unknown) => void;
  onSelectorGenerated?: (selector: string) => void;
  onPasswordAction?: (action: PasswordAIAction) => void;
  onClose?: () => void;
}

/**
 * Password Manager AI Actions
 * These actions can be triggered by AI based on user prompts
 */
export interface PasswordAIAction {
  type: 
    | 'autofill_credentials'
    | 'generate_password'
    | 'add_totp'
    | 'security_scan'
    | 'check_breaches'
    | 'fill_passkey'
    | 'enable_phishing_protection'
    | 'auto_lock'
    | 'export_vault'
    | 'sync_devices'
    | 'enterprise_sso'
    | 'emergency_access';
  params?: Record<string, unknown>;
}

export const AINexus: React.FC<NexusProps> = ({
  context = 'general',
  onWorkflowGenerated,
  onSelectorGenerated,
  onPasswordAction,
  onClose,
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContextualSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContextualSuggestions = () => {
    const contextSuggestions: Record<string, Suggestion[]> = {
      password: [
        {
          id: 'p1',
          title: 'Fill Credentials',
          description: 'Auto-fill login form with saved credentials',
          action: 'Fill my credentials for this website',
          icon: <Wand2 className="w-4 h-4" />,
        },
        {
          id: 'p2',
          title: 'Generate Password',
          description: 'Create a strong, secure password',
          action: 'Generate a strong password with 20 characters including symbols',
          icon: <Sparkles className="w-4 h-4" />,
        },
        {
          id: 'p3',
          title: 'Security Scan',
          description: 'Scan all passwords for vulnerabilities',
          action: 'Run a complete security scan on all my passwords and find weak ones',
          icon: <AlertCircle className="w-4 h-4" />,
        },
        {
          id: 'p4',
          title: 'Check Breaches',
          description: 'Check if credentials were compromised',
          action: 'Check if any of my passwords have been exposed in data breaches',
          icon: <AlertCircle className="w-4 h-4" />,
        },
        {
          id: 'p5',
          title: 'TOTP Setup',
          description: 'Configure two-factor authentication',
          action: 'Set up TOTP authenticator for this website',
          icon: <CheckCircle2 className="w-4 h-4" />,
        },
        {
          id: 'p6',
          title: 'Passkey Authentication',
          description: 'Register a passkey for passwordless login',
          action: 'Register a new passkey for passwordless authentication on this site',
          icon: <Brain className="w-4 h-4" />,
        },
        {
          id: 'p7',
          title: 'Phishing Protection',
          description: 'Verify website authenticity',
          action: 'Check if this website is legitimate and not a phishing attempt',
          icon: <AlertCircle className="w-4 h-4" />,
        },
        {
          id: 'p8',
          title: 'Enterprise SSO',
          description: 'Connect with corporate identity provider',
          action: 'Connect my enterprise SSO with Okta or Azure AD',
          icon: <Workflow className="w-4 h-4" />,
        },
      ],
      workflow: [
        {
          id: '1',
          title: 'Create Login Flow',
          description: 'Automate login process with credentials',
          action: 'Create a workflow that navigates to a login page, fills credentials, and clicks submit',
          icon: <Workflow className="w-4 h-4" />,
        },
        {
          id: '2',
          title: 'Data Scraping',
          description: 'Extract product information from e-commerce',
          action: 'Create a workflow that scrapes product titles, prices, and images from an e-commerce site',
          icon: <FileJson className="w-4 h-4" />,
        },
        {
          id: '3',
          title: 'Form Automation',
          description: 'Fill and submit forms automatically',
          action: 'Create a workflow that fills a multi-step form with data and submits it',
          icon: <Code className="w-4 h-4" />,
        },
      ],
      selector: [
        {
          id: '1',
          title: 'Smart Selector',
          description: 'Generate robust CSS selector',
          action: 'Generate a CSS selector for the login button that works across page updates',
          icon: <Wand2 className="w-4 h-4" />,
        },
        {
          id: '2',
          title: 'XPath Alternative',
          description: 'Convert CSS to XPath',
          action: 'Convert this CSS selector to XPath: .btn-primary',
          icon: <Code className="w-4 h-4" />,
        },
      ],
      automation: [
        {
          id: '1',
          title: 'Optimize Workflow',
          description: 'Improve workflow performance',
          action: 'Analyze my current workflow and suggest optimizations',
          icon: <Lightbulb className="w-4 h-4" />,
        },
        {
          id: '2',
          title: 'Error Handling',
          description: 'Add retry logic and error handling',
          action: 'Add error handling and retry logic to my workflow',
          icon: <AlertCircle className="w-4 h-4" />,
        },
      ],
      general: [
        {
          id: '1',
          title: 'Getting Started',
          description: 'Learn how to use CUBE Nexum',
          action: 'How do I create my first automation workflow?',
          icon: <Sparkles className="w-4 h-4" />,
        },
        {
          id: '2',
          title: 'Best Practices',
          description: 'Learn automation best practices',
          action: 'What are the best practices for web automation?',
          icon: <Lightbulb className="w-4 h-4" />,
        },
      ],
    };

    setSuggestions(contextSuggestions[context] || contextSuggestions.general);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call AI service
      const response = await invoke<string>('send_ai_request', {
        message: input,
        context: {
          type: context,
          history: messages.slice(-5), // Last 5 messages for context
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: detectMessageType(response),
      };

      // Parse workflow if detected
      if (assistantMessage.type === 'workflow') {
        try {
          const workflowData = extractWorkflowFromResponse(response);
          assistantMessage.data = workflowData;

          if (onWorkflowGenerated && workflowData) {
            onWorkflowGenerated(workflowData);
          }
        } catch (error) {
          log.error('Failed to parse workflow:', error);
        }
      }

      // Parse selector if detected
      if (assistantMessage.type === 'code' && context === 'selector') {
        try {
          const selector = extractSelectorFromResponse(response);
          if (onSelectorGenerated && selector) {
            onSelectorGenerated(selector);
          }
        } catch (error) {
          log.error('Failed to parse selector:', error);
        }
      }

      // Parse password action if detected
      if (context === 'password') {
        try {
          const passwordAction = extractPasswordActionFromResponse(input, response);
          if (onPasswordAction && passwordAction) {
            onPasswordAction(passwordAction);
          }
        } catch (error) {
          log.error('Failed to parse password action:', error);
        }
      }

      setMessages((prev) => [...prev, assistantMessage]);

      toast({
        title: '✅ Response Generated',
        description: 'NEXUS AI has responded',
      });
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: '❌ Error',
        description: 'Failed to get AI response',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInput(suggestion.action);
  };

  const detectMessageType = (content: string): Message['type'] => {
    if (content.includes('```json') || content.includes('"nodes":')) {
      return 'workflow';
    }
    if (content.includes('```') || content.includes('selector:')) {
      return 'code';
    }
    if (content.includes('suggestion:') || content.includes('tip:')) {
      return 'suggestion';
    }
    return 'text';
  };

  const extractWorkflowFromResponse = (response: string): unknown => {
    // Extract JSON workflow from response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try to find JSON directly
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      return JSON.parse(response.substring(jsonStart, jsonEnd));
    }

    return null;
  };

  const extractSelectorFromResponse = (response: string): string | null => {
    // Extract selector from code block
    const codeMatch = response.match(/```(?:css)?\n([\s\S]*?)\n```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }

    // Look for selector: prefix
    const selectorMatch = response.match(/selector:\s*([^\n]+)/i);
    if (selectorMatch) {
      return selectorMatch[1].trim();
    }

    return null;
  };

  /**
   * Extract password action from user prompt and AI response
   * Maps natural language prompts to actionable Password Manager commands
   */
  const extractPasswordActionFromResponse = (
    userPrompt: string,
    _response: string
  ): PasswordAIAction | null => {
    const promptLower = userPrompt.toLowerCase();

    // Autofill/Fill credentials detection
    if (
      promptLower.includes('fill') && 
      (promptLower.includes('credential') || promptLower.includes('login') || promptLower.includes('password'))
    ) {
      return { type: 'autofill_credentials' };
    }

    // Generate password detection
    if (
      promptLower.includes('generate') && promptLower.includes('password')
    ) {
      const lengthMatch = promptLower.match(/(\d+)\s*character/);
      const includeSymbols = promptLower.includes('symbol') || promptLower.includes('special');
      return { 
        type: 'generate_password',
        params: {
          length: lengthMatch ? parseInt(lengthMatch[1], 10) : 16,
          includeSymbols,
          includeNumbers: true,
          includeUppercase: true,
        }
      };
    }

    // Security scan detection
    if (
      (promptLower.includes('scan') || promptLower.includes('check') || promptLower.includes('analyze')) &&
      (promptLower.includes('security') || promptLower.includes('weak') || promptLower.includes('password'))
    ) {
      return { type: 'security_scan' };
    }

    // Breach check detection
    if (
      promptLower.includes('breach') || 
      promptLower.includes('exposed') || 
      promptLower.includes('compromised') ||
      promptLower.includes('pwned')
    ) {
      return { type: 'check_breaches' };
    }

    // TOTP setup detection
    if (
      (promptLower.includes('totp') || promptLower.includes('authenticator') || promptLower.includes('2fa')) &&
      (promptLower.includes('set') || promptLower.includes('add') || promptLower.includes('configure'))
    ) {
      return { type: 'add_totp' };
    }

    // Passkey detection
    if (
      promptLower.includes('passkey') || 
      promptLower.includes('passwordless') ||
      promptLower.includes('biometric')
    ) {
      return { type: 'fill_passkey' };
    }

    // Phishing protection detection
    if (
      promptLower.includes('phishing') || 
      promptLower.includes('legitimate') ||
      (promptLower.includes('fake') && promptLower.includes('site'))
    ) {
      return { type: 'enable_phishing_protection' };
    }

    // Enterprise SSO detection
    if (
      promptLower.includes('sso') || 
      promptLower.includes('okta') ||
      promptLower.includes('azure ad') ||
      promptLower.includes('enterprise') ||
      promptLower.includes('saml')
    ) {
      return { type: 'enterprise_sso' };
    }

    // Auto-lock detection
    if (
      promptLower.includes('lock') && 
      (promptLower.includes('vault') || promptLower.includes('auto'))
    ) {
      return { type: 'auto_lock' };
    }

    // Export detection
    if (promptLower.includes('export')) {
      return { type: 'export_vault' };
    }

    // Sync detection
    if (promptLower.includes('sync')) {
      return { type: 'sync_devices' };
    }

    // Emergency access detection
    if (
      promptLower.includes('emergency') && promptLower.includes('access')
    ) {
      return { type: 'emergency_access' };
    }

    return null;
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
              : 'bg-muted text-foreground'
          }`}
        >
          {!isUser && (
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4" />
              <span className="font-semibold text-xs">NEXUS AI</span>
              {message.type === 'workflow' && (
                <Badge className="bg-purple-500 text-white text-xs">
                  <Workflow className="w-3 h-3 mr-1" />
                  Workflow
                </Badge>
              )}
              {message.type === 'code' && (
                <Badge className="bg-blue-500 text-white text-xs">
                  <Code className="w-3 h-3 mr-1" />
                  Code
                </Badge>
              )}
            </div>
          )}

          <div className="text-sm whitespace-pre-wrap">{message.content}</div>

          {message.data !== undefined && message.type === 'workflow' && (
            <Button
              size="sm"
              variant={isUser ? 'secondary' : 'default'}
              className="mt-2"
              onClick={() => onWorkflowGenerated?.(message.data as Record<string, unknown>)}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Apply Workflow
            </Button>
          )}

          <div
            className={`text-xs mt-2 ${isUser ? 'text-white/70' : 'text-muted-foreground'}`}
          >
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col shadow-2xl border-2 border-purple-200">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                NEXUS AI
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  GPT-4o
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Context: <span className="font-semibold capitalize">{context}</span>
              </p>
            </div>
          </div>

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Suggestions */}
        {messages.length === 0 && suggestions.length > 0 && (
          <div className="p-4 border-b bg-muted/50">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Suggested Actions
            </p>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((suggestion) => (
                <Card
                  key={suggestion.id}
                  className="cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 && suggestions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="w-16 h-16 mx-auto mb-3 text-muted-foreground" />
              <p className="font-semibold">NEXUS AI Ready</p>
              <p className="text-sm mt-2">
                Ask me anything about workflows, selectors, or automation!
              </p>
            </div>
          )}

          {messages.map(renderMessage)}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-card flex-shrink-0">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask NEXUS anything..."
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Press Enter to send • Shift+Enter for new line</span>
            <Badge variant="outline" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by GPT-4o
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
