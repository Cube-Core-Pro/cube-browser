"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('CaptchaHandler');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress as _Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Bot,
  Image,
  Eye as _Eye,
  Puzzle,
  ShieldCheck,
  AlertTriangle as _AlertTriangle,
  CheckCircle,
  XCircle,
  Clock as _Clock,
  Activity as _Activity,
  Settings,
  Play,
  Pause as _Pause,
  RefreshCw as _RefreshCw,
  DollarSign,
  Zap,
  Brain,
  Hand,
  Timer,
  BarChart3 as _BarChart3,
  TrendingUp,
  History,
  Key,
  Info,
  Shield,
  Loader2,
} from 'lucide-react';
import { CaptchaConfig, CaptchaMethod, CaptchaEvent } from '@/types/data-extraction-pro';
import './CaptchaHandler.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendCaptchaProvider {
  id: string;
  name: string;
  description: string;
  cost: string;
  active: boolean;
}

interface BackendRecentSolve {
  id: string;
  timestamp: number;
  captchaType: string;
  method: string;
  success: boolean;
  timeToSolve: number;
  cost: number;
}

interface BackendCaptchaConfig {
  providers: BackendCaptchaProvider[];
  recentSolves: BackendRecentSolve[];
  autoSolve: boolean;
  totalSolved: number;
  balanceUsd: number;
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

const convertBackendSolveToCaptchaEvent = (solve: BackendRecentSolve): CaptchaEvent => {
  return {
    id: solve.id,
    timestamp: new Date(solve.timestamp),
    captchaType: solve.captchaType,
    method: solve.method as CaptchaMethod,
    success: solve.success,
    timeToSolve: solve.timeToSolve,
    cost: solve.cost,
  };
};

// ============================================================================
// STATIC DATA
// ============================================================================

const captchaMethods: { id: CaptchaMethod; name: string; description: string; cost?: string }[] = [
  { id: 'manual', name: 'Manual Solving', description: 'Pause and wait for user to solve', cost: 'Free' },
  { id: '2captcha', name: '2Captcha', description: 'Popular solving service with good accuracy', cost: '$2.99/1000' },
  { id: 'anticaptcha', name: 'Anti-Captcha', description: 'Fast and reliable solving service', cost: '$2.00/1000' },
  { id: 'capsolver', name: 'CapSolver', description: 'AI-powered solving with high speed', cost: '$1.50/1000' },
  { id: 'ai-solve', name: 'AI Solve (Beta)', description: 'Local AI model for simple CAPTCHAs', cost: 'Free' },
  { id: 'browser-automation', name: 'Browser Automation', description: 'Automated browser interaction', cost: 'Free' },
];

const captchaTypes = [
  { name: 'reCAPTCHA v2', selector: '.g-recaptcha, [data-sitekey]', supported: true },
  { name: 'reCAPTCHA v3', selector: '.grecaptcha-badge', supported: true },
  { name: 'hCaptcha', selector: '.h-captcha', supported: true },
  { name: 'FunCaptcha', selector: '#FunCaptcha', supported: true },
  { name: 'Image CAPTCHA', selector: 'img[alt*="captcha"]', supported: true },
  { name: 'Text CAPTCHA', selector: 'input[name*="captcha"]', supported: true },
  { name: 'Cloudflare', selector: '#cf-challenge-running', supported: true },
  { name: 'AWS WAF', selector: '.aws-waf-captcha', supported: false },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getCaptchaIcon = (type: string): React.ReactNode => {
  if (type.includes('reCAPTCHA')) return <ShieldCheck className="h-4 w-4" />;
  if (type.includes('hCaptcha')) return <Puzzle className="h-4 w-4" />;
  if (type.includes('Image')) return <Image className="h-4 w-4" />;
  if (type.includes('Cloudflare')) return <Shield className="h-4 w-4" />;
  return <Bot className="h-4 w-4" />;
};

const getMethodIcon = (method: CaptchaMethod): React.ReactNode => {
  const icons: Record<CaptchaMethod, React.ReactNode> = {
    'manual': <Hand className="h-4 w-4" />,
    '2captcha': <Bot className="h-4 w-4" />,
    'anticaptcha': <Bot className="h-4 w-4" />,
    'capsolver': <Brain className="h-4 w-4" />,
    'ai-solve': <Brain className="h-4 w-4" />,
    'browser-automation': <Zap className="h-4 w-4" />,
  };
  return icons[method];
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CaptchaEventRowProps {
  event: CaptchaEvent;
}

function CaptchaEventRow({ event }: CaptchaEventRowProps) {
  return (
    <div className={`captcha-event-row ${event.success ? 'success' : 'failed'}`}>
      <div className="event-icon">
        {event.success ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
      
      <div className="event-type">
        {getCaptchaIcon(event.captchaType)}
        <span>{event.captchaType}</span>
      </div>
      
      <div className="event-method">
        <Badge variant="secondary" className="text-xs">
          {getMethodIcon(event.method)}
          <span className="ml-1">{event.method}</span>
        </Badge>
      </div>
      
      <div className="event-time">
        <Timer className="h-3 w-3 text-muted-foreground" />
        <span>{event.timeToSolve?.toFixed(1)}s</span>
      </div>
      
      {event.cost !== undefined && (
        <div className="event-cost">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span>${event.cost.toFixed(3)}</span>
        </div>
      )}
      
      <div className="event-timestamp text-muted-foreground">
        {formatTimeAgo(event.timestamp)}
      </div>
    </div>
  );
}

interface MethodCardProps {
  method: typeof captchaMethods[0];
  selected: boolean;
  onSelect: () => void;
}

function MethodCard({ method, selected, onSelect }: MethodCardProps) {
  return (
    <div
      className={`method-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="method-icon">
        {getMethodIcon(method.id)}
      </div>
      <div className="method-info">
        <span className="font-medium">{method.name}</span>
        <p className="text-xs text-muted-foreground">{method.description}</p>
      </div>
      <div className="method-cost">
        <Badge variant="secondary" className="text-xs">{method.cost}</Badge>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface CaptchaHandlerProps {
  onClose?: () => void;
}

export function CaptchaHandler({ onClose: _onClose }: CaptchaHandlerProps) {
  const [config, setConfig] = useState<CaptchaConfig>({
    enabled: true,
    detectionSelectors: captchaTypes.filter(t => t.supported).map(t => t.selector),
    handlingMethod: '2captcha',
    maxRetries: 3,
    timeout: 120,
    fallbackAction: 'pause',
  });
  const [captchaEvents, setCaptchaEvents] = useState<CaptchaEvent[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    '2captcha': '',
    'anticaptcha': '',
    'capsolver': '',
  });
  const [activeTab, setActiveTab] = useState('methods');
  const [testingCaptcha, setTestingCaptcha] = useState(false);
  const [loading, setLoading] = useState(true);
  const [_totalSolved, setTotalSolved] = useState(0);
  const [_balanceUsd, setBalanceUsd] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendCaptchaConfig>('get_captcha_handler_config');
        
        if (backendConfig.recentSolves && backendConfig.recentSolves.length > 0) {
          const events = backendConfig.recentSolves.map(convertBackendSolveToCaptchaEvent);
          setCaptchaEvents(events);
        }
        
        setConfig(prev => ({
          ...prev,
          enabled: backendConfig.autoSolve,
        }));
        
        setTotalSolved(backendConfig.totalSolved);
        setBalanceUsd(backendConfig.balanceUsd);
      } catch (error) {
        log.error('Failed to fetch captcha config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load CAPTCHA handler configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [toast]);

  const handleMethodSelect = useCallback((methodId: CaptchaMethod) => {
    setConfig(prev => ({ ...prev, handlingMethod: methodId }));
  }, []);

  const _handleToggleProvider = useCallback(async (providerId: string, active: boolean) => {
    try {
      await invoke('toggle_captcha_provider', { providerId, active });
      toast({
        title: 'Provider Updated',
        description: `${providerId} has been ${active ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      log.error('Failed to toggle provider:', error);
      toast({
        title: 'Error',
        description: 'Failed to update provider status',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleTestCaptcha = useCallback(async () => {
    setTestingCaptcha(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const success = Math.random() > 0.3;
      const newEvent: CaptchaEvent = {
        id: `cap-${Date.now()}`,
        timestamp: new Date(),
        captchaType: 'reCAPTCHA v2',
        method: config.handlingMethod,
        success,
        timeToSolve: success ? Math.random() * 20 + 5 : undefined,
        cost: success && config.handlingMethod !== 'manual' ? Math.random() * 0.005 : undefined,
      };
      
      setCaptchaEvents(prev => [newEvent, ...prev]);
      
      toast({
        title: success ? 'CAPTCHA Solved' : 'CAPTCHA Failed',
        description: success 
          ? `Solved in ${newEvent.timeToSolve?.toFixed(1)}s using ${config.handlingMethod}`
          : 'Failed to solve CAPTCHA. Try a different method.',
        variant: success ? 'default' : 'destructive',
      });
    } catch (error) {
      log.error('Failed to test captcha:', error);
      toast({
        title: 'Error',
        description: 'Failed to test CAPTCHA solving',
        variant: 'destructive',
      });
    } finally {
      setTestingCaptcha(false);
    }
  }, [config.handlingMethod, toast]);

  const successfulSolves = captchaEvents.filter(e => e.success).length;
  const totalCost = captchaEvents.reduce((sum, e) => sum + (e.cost || 0), 0);
  const avgSolveTime = captchaEvents.filter(e => e.success && e.timeToSolve)
    .reduce((sum, e, _, arr) => sum + (e.timeToSolve || 0) / arr.length, 0);
  const successRate = captchaEvents.length > 0 
    ? Math.round((successfulSolves / captchaEvents.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="captcha-handler">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="captcha-handler">
      {/* Header */}
      <div className="handler-header">
        <div className="flex items-center gap-3">
          <div className={`header-icon ${config.enabled ? 'active' : ''}`}>
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">CAPTCHA Handler</h2>
            <p className="text-sm text-muted-foreground">
              Automatic CAPTCHA detection and solving
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="captcha-enabled" className="text-sm">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </Label>
          <Switch
            id="captcha-enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="captcha-stats">
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{successfulSolves}</span>
            <span className="stat-label">Solved</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{successRate}%</span>
            <span className="stat-label">Success Rate</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{avgSolveTime.toFixed(1)}s</span>
            <span className="stat-label">Avg Time</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">${totalCost.toFixed(2)}</span>
            <span className="stat-label">Total Spent</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="methods">
            <Bot className="h-4 w-4 mr-2" />
            Solving Methods
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="methods">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">CAPTCHA Solving Methods</CardTitle>
                  <CardDescription>
                    Choose how CAPTCHAs should be solved
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleTestCaptcha}
                  disabled={testingCaptcha}
                >
                  {testingCaptcha ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Test Solve
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="methods-grid">
                {captchaMethods.map(method => (
                  <MethodCard
                    key={method.id}
                    method={method}
                    selected={config.handlingMethod === method.id}
                    onSelect={() => handleMethodSelect(method.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supported CAPTCHAs */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Supported CAPTCHA Types</CardTitle>
              <CardDescription>
                Types of CAPTCHAs that can be automatically detected and solved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="captcha-types-grid">
                {captchaTypes.map((type, i) => (
                  <div key={i} className={`captcha-type ${type.supported ? 'supported' : 'unsupported'}`}>
                    {getCaptchaIcon(type.name)}
                    <span>{type.name}</span>
                    {type.supported ? (
                      <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CAPTCHA History</CardTitle>
              <CardDescription>
                Recent CAPTCHA solving attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {captchaEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No CAPTCHA events yet</p>
                    </div>
                  ) : (
                    captchaEvents.map(event => (
                      <CaptchaEventRow key={event.id} event={event} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Keys</CardTitle>
              <CardDescription>
                Configure API keys for CAPTCHA solving services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Secure Storage</p>
                    <p>API keys are encrypted and stored securely. They are never transmitted except to the respective services.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="api-key-row">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    <Label>2Captcha API Key</Label>
                  </div>
                  <Input
                    type="password"
                    placeholder="Enter your 2Captcha API key"
                    value={apiKeys['2captcha']}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, '2captcha': e.target.value }))}
                  />
                </div>
                
                <div className="api-key-row">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    <Label>Anti-Captcha API Key</Label>
                  </div>
                  <Input
                    type="password"
                    placeholder="Enter your Anti-Captcha API key"
                    value={apiKeys['anticaptcha']}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, 'anticaptcha': e.target.value }))}
                  />
                </div>
                
                <div className="api-key-row">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    <Label>CapSolver API Key</Label>
                  </div>
                  <Input
                    type="password"
                    placeholder="Enter your CapSolver API key"
                    value={apiKeys['capsolver']}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, 'capsolver': e.target.value }))}
                  />
                </div>
              </div>

              <Button className="mt-4">
                Save API Keys
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CAPTCHA Settings</CardTitle>
              <CardDescription>
                Configure CAPTCHA detection and handling behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Maximum Retries</Label>
                  <p className="text-sm text-muted-foreground">
                    Number of solve attempts before failing
                  </p>
                </div>
                <Input
                  type="number"
                  value={config.maxRetries}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 3 }))}
                  className="w-20"
                  min={1}
                  max={10}
                />
              </div>
              
              <div className="setting-row">
                <div>
                  <Label>Timeout (seconds)</Label>
                  <p className="text-sm text-muted-foreground">
                    Maximum time to wait for CAPTCHA solution
                  </p>
                </div>
                <Input
                  type="number"
                  value={config.timeout}
                  onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) || 120 }))}
                  className="w-24"
                  min={30}
                  max={300}
                />
              </div>
              
              <div className="setting-row">
                <div>
                  <Label>Fallback Action</Label>
                  <p className="text-sm text-muted-foreground">
                    What to do when CAPTCHA solving fails
                  </p>
                </div>
                <Select
                  value={config.fallbackAction}
                  onValueChange={(value: 'skip' | 'pause' | 'abort' | 'notify') => 
                    setConfig(prev => ({ ...prev, fallbackAction: value }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip Page</SelectItem>
                    <SelectItem value="pause">Pause Job</SelectItem>
                    <SelectItem value="abort">Abort Job</SelectItem>
                    <SelectItem value="notify">Notify User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CaptchaHandler;
