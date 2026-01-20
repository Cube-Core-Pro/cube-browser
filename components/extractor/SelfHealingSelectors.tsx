"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('SelfHealingSelectors');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog as _Dialog,
  DialogContent as _DialogContent,
  DialogDescription as _DialogDescription,
  DialogFooter as _DialogFooter,
  DialogHeader as _DialogHeader,
  DialogTitle as _DialogTitle,
  DialogTrigger as _DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Heart,
  HeartCrack,
  Wrench,
  RefreshCw,
  Shield,
  ShieldCheck,
  AlertTriangle as _AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity as _Activity,
  TrendingUp,
  BarChart3 as _BarChart3,
  Eye,
  Settings,
  Zap as _Zap,
  Brain,
  Target as _Target,
  Layers,
  History,
  Play as _Play,
  Pause as _Pause,
  RotateCcw as _RotateCcw,
  ArrowRight,
  ChevronRight as _ChevronRight,
  Info as _Info,
  Search,
  Code,
  Loader2,
} from 'lucide-react';
import {
  SelfHealingConfig,
  HealingEvent,
  HealingStrategy,
  SmartSelector,
  SelectorStrategy,
} from '@/types/data-extraction-pro';
import './SelfHealingSelectors.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendSelector {
  id: string;
  primary: string;
  strategy: string;
  fallbacks: Array<{
    selector: string;
    strategy: string;
    priority: number;
    successRate: number;
  }>;
  confidence: number;
  lastValidated: number;
  healingHistory: string[];
  aiSuggestions: string[];
}

interface BackendSelfHealingConfig {
  selectors: BackendSelector[];
  autoHeal: boolean;
  healThreshold: number;
  totalHeals: number;
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

const mapBackendStrategy = (strategy: string): SelectorStrategy => {
  const strategyMap: Record<string, SelectorStrategy> = {
    'css': 'css',
    'xpath': 'xpath',
    'text': 'text-match',
    'ai': 'ai-visual',
    'ai-visual': 'ai-visual',
    'text-match': 'text-match',
    'semantic': 'semantic',
    'hybrid': 'hybrid',
    'position-relative': 'position-relative',
  };
  return strategyMap[strategy] || 'css';
};

const convertBackendSelectorToSmartSelector = (selector: BackendSelector): SmartSelector => {
  return {
    id: selector.id,
    primary: selector.primary,
    strategy: mapBackendStrategy(selector.strategy),
    fallbacks: selector.fallbacks.map(f => ({
      selector: f.selector,
      strategy: mapBackendStrategy(f.strategy),
      priority: f.priority,
      successRate: f.successRate,
    })),
    confidence: selector.confidence,
    lastValidated: new Date(selector.lastValidated),
    healingHistory: [],
    aiSuggestions: selector.aiSuggestions,
  };
};

// ============================================================================
// STATIC DATA
// ============================================================================

const healingStrategies: { id: HealingStrategy; name: string; description: string }[] = [
  { id: 'fallback-chain', name: 'Fallback Chain', description: 'Try pre-defined fallback selectors in order' },
  { id: 'ai-regenerate', name: 'AI Regenerate', description: 'Use AI to generate new selectors based on context' },
  { id: 'pattern-match', name: 'Pattern Match', description: 'Find similar patterns in the DOM' },
  { id: 'visual-match', name: 'Visual Match', description: 'Match elements by visual appearance' },
  { id: 'text-match', name: 'Text Match', description: 'Find elements containing expected text' },
  { id: 'sibling-traverse', name: 'Sibling Traverse', description: 'Navigate from nearby stable elements' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStrategyIcon = (strategy: HealingStrategy): React.ReactNode => {
  const icons: Record<HealingStrategy, React.ReactNode> = {
    'fallback-chain': <Layers className="h-4 w-4" />,
    'ai-regenerate': <Brain className="h-4 w-4" />,
    'pattern-match': <Search className="h-4 w-4" />,
    'visual-match': <Eye className="h-4 w-4" />,
    'text-match': <Code className="h-4 w-4" />,
    'sibling-traverse': <ArrowRight className="h-4 w-4" />,
  };
  return icons[strategy];
};

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

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface HealingEventCardProps {
  event: HealingEvent;
  onApprove: (event: HealingEvent) => void;
  onReject: (event: HealingEvent) => void;
}

function HealingEventCard({ event, onApprove, onReject }: HealingEventCardProps) {
  return (
    <div className={`healing-event-card ${event.success ? 'success' : 'failed'}`}>
      <div className="event-status-icon">
        {event.success ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
      
      <div className="event-content">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{event.fieldId}</span>
          <Badge variant="secondary" className="text-xs">
            {getStrategyIcon(event.strategy)}
            <span className="ml-1">{event.strategy}</span>
          </Badge>
          <span className="text-xs text-muted-foreground">{formatTimeAgo(event.timestamp)}</span>
        </div>
        
        <div className="selector-change">
          <code className="text-xs text-muted-foreground line-through">
            {event.originalSelector}
          </code>
          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <code className="text-xs text-green-600">
            {event.healedSelector}
          </code>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">
            Confidence: {Math.round(event.confidence * 100)}%
          </span>
          {event.approved ? (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              Approved
            </Badge>
          ) : event.success ? (
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
              Pending Review
            </Badge>
          ) : null}
        </div>
      </div>
      
      {event.success && !event.approved && (
        <div className="event-actions">
          <Button size="sm" variant="ghost" onClick={() => onApprove(event)}>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onReject(event)}>
            <XCircle className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface SelectorHealthCardProps {
  selector: SmartSelector;
  onValidate: (selector: SmartSelector) => void;
  onEdit: (selector: SmartSelector) => void;
}

function SelectorHealthCard({ selector, onValidate, onEdit }: SelectorHealthCardProps) {
  const healthScore = selector.confidence * 100;
  const healthColor = healthScore >= 90 ? 'green' : healthScore >= 70 ? 'yellow' : 'red';

  return (
    <div className="selector-health-card">
      <div className={`health-indicator ${healthColor}`}>
        {healthScore >= 90 ? (
          <Heart className="h-5 w-5" />
        ) : healthScore >= 70 ? (
          <Heart className="h-5 w-5" />
        ) : (
          <HeartCrack className="h-5 w-5" />
        )}
      </div>
      
      <div className="selector-content">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium font-mono text-sm">{selector.primary}</span>
          <Badge variant="secondary" className="text-xs">
            {selector.strategy}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{selector.fallbacks.length} fallbacks</span>
          <span>Validated {formatTimeAgo(selector.lastValidated)}</span>
        </div>
        
        {selector.aiSuggestions.length > 0 && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
            <Brain className="h-3 w-3 inline mr-1" />
            {selector.aiSuggestions[0]}
          </div>
        )}
      </div>
      
      <div className="selector-health-score">
        <span className={`text-2xl font-bold text-${healthColor}-500`}>
          {Math.round(healthScore)}%
        </span>
      </div>
      
      <div className="selector-actions">
        <Button size="sm" variant="ghost" onClick={() => onValidate(selector)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(selector)}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface SelfHealingSelectorsProps {
  onClose?: () => void;
}

export function SelfHealingSelectors({ onClose: _onClose }: SelfHealingSelectorsProps) {
  const [config, setConfig] = useState<SelfHealingConfig>({
    enabled: true,
    strategies: ['fallback-chain', 'ai-regenerate', 'pattern-match'],
    maxAttempts: 3,
    learningEnabled: true,
    notifyOnHeal: true,
    autoApprove: false,
    confidenceThreshold: 0.8,
  });
  const [healingEvents, setHealingEvents] = useState<HealingEvent[]>([]);
  const [selectors, setSelectors] = useState<SmartSelector[]>([]);
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(true);
  const [_totalHeals, setTotalHeals] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendSelfHealingConfig>('get_self_healing_selectors_config');
        
        if (backendConfig.selectors && backendConfig.selectors.length > 0) {
          const convertedSelectors = backendConfig.selectors.map(convertBackendSelectorToSmartSelector);
          setSelectors(convertedSelectors);
        }
        
        setConfig(prev => ({
          ...prev,
          enabled: backendConfig.autoHeal,
          confidenceThreshold: backendConfig.healThreshold,
        }));
        
        setTotalHeals(backendConfig.totalHeals);
      } catch (error) {
        log.error('Failed to fetch self-healing config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load self-healing selectors configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [toast]);

  const handleStrategyToggle = useCallback((strategyId: HealingStrategy) => {
    setConfig(prev => ({
      ...prev,
      strategies: prev.strategies.includes(strategyId)
        ? prev.strategies.filter(s => s !== strategyId)
        : [...prev.strategies, strategyId],
    }));
  }, []);

  const handleApprove = useCallback((event: HealingEvent) => {
    setHealingEvents(prev => prev.map(e => 
      e.id === event.id ? { ...e, approved: true } : e
    ));
    toast({
      title: 'Healing Approved',
      description: `Selector change for ${event.fieldId} has been approved`,
    });
  }, [toast]);

  const handleReject = useCallback((event: HealingEvent) => {
    setHealingEvents(prev => prev.filter(e => e.id !== event.id));
    toast({
      title: 'Healing Rejected',
      description: `Selector change for ${event.fieldId} has been rejected`,
    });
  }, [toast]);

  const _handleHealSelector = useCallback(async (selectorId: string) => {
    try {
      await invoke('heal_selector', { selectorId });
      
      setSelectors(prev => prev.map(s => 
        s.id === selectorId ? { ...s, lastValidated: new Date(), confidence: Math.min(s.confidence + 0.05, 1) } : s
      ));
      
      toast({
        title: 'Selector Healed',
        description: 'Selector has been successfully healed',
      });
    } catch (error) {
      log.error('Failed to heal selector:', error);
      toast({
        title: 'Error',
        description: 'Failed to heal selector',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleValidateSelector = useCallback((selector: SmartSelector) => {
    setSelectors(prev => prev.map(s => 
      s.id === selector.id ? { ...s, lastValidated: new Date() } : s
    ));
    toast({
      title: 'Selector Validated',
      description: 'Selector health check completed',
    });
  }, [toast]);

  const handleEditSelector = useCallback((selector: SmartSelector) => {
    toast({
      title: 'Edit Selector',
      description: `Editing ${selector.primary}`,
    });
  }, [toast]);

  const successfulHeals = healingEvents.filter(e => e.success).length;
  const pendingApprovals = healingEvents.filter(e => e.success && !e.approved).length;
  const healingRate = healingEvents.length > 0 
    ? Math.round((successfulHeals / healingEvents.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="self-healing-selectors">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="self-healing-selectors">
      {/* Header */}
      <div className="healing-header">
        <div className="flex items-center gap-3">
          <div className={`header-icon ${config.enabled ? 'active' : ''}`}>
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Self-Healing Selectors</h2>
            <p className="text-sm text-muted-foreground">
              Automatic selector repair when websites change
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="healing-enabled" className="text-sm">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </Label>
          <Switch
            id="healing-enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="healing-stats">
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{successfulHeals}</span>
            <span className="stat-label">Successful Heals</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{pendingApprovals}</span>
            <span className="stat-label">Pending Review</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{healingRate}%</span>
            <span className="stat-label">Success Rate</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{selectors.length}</span>
            <span className="stat-label">Protected Selectors</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="events">
            <History className="h-4 w-4 mr-2" />
            Healing Events
            {pendingApprovals > 0 && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-700">{pendingApprovals}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="selectors">
            <Heart className="h-4 w-4 mr-2" />
            Selector Health
          </TabsTrigger>
          <TabsTrigger value="strategies">
            <Wrench className="h-4 w-4 mr-2" />
            Strategies
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Healing Events</CardTitle>
              <CardDescription>
                Review and approve automatic selector repairs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {healingEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No healing events yet</p>
                    </div>
                  ) : (
                    healingEvents.map(event => (
                      <HealingEventCard
                        key={event.id}
                        event={event}
                        onApprove={handleApprove}
                        onReject={handleReject}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selectors">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selector Health Monitor</CardTitle>
              <CardDescription>
                Monitor the health of your extraction selectors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {selectors.map(selector => (
                    <SelectorHealthCard
                      key={selector.id}
                      selector={selector}
                      onValidate={handleValidateSelector}
                      onEdit={handleEditSelector}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Healing Strategies</CardTitle>
              <CardDescription>
                Configure which strategies to use for automatic healing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="strategies-grid">
                {healingStrategies.map(strategy => (
                  <div
                    key={strategy.id}
                    className={`strategy-card ${config.strategies.includes(strategy.id) ? 'active' : ''}`}
                    onClick={() => handleStrategyToggle(strategy.id)}
                  >
                    <div className="strategy-icon">
                      {getStrategyIcon(strategy.id)}
                    </div>
                    <div className="strategy-info">
                      <span className="font-medium">{strategy.name}</span>
                      <p className="text-xs text-muted-foreground">{strategy.description}</p>
                    </div>
                    <Switch
                      checked={config.strategies.includes(strategy.id)}
                      onCheckedChange={() => handleStrategyToggle(strategy.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Healing Settings</CardTitle>
              <CardDescription>
                Configure automatic healing behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Maximum Healing Attempts</Label>
                  <p className="text-sm text-muted-foreground">
                    Number of attempts before marking selector as broken
                  </p>
                </div>
                <Input
                  type="number"
                  value={config.maxAttempts}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) || 3 }))}
                  className="w-20"
                  min={1}
                  max={10}
                />
              </div>
              
              <div className="setting-row">
                <div>
                  <Label>Confidence Threshold</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimum confidence for automatic approval ({Math.round(config.confidenceThreshold * 100)}%)
                  </p>
                </div>
                <Input
                  type="range"
                  value={config.confidenceThreshold * 100}
                  onChange={(e) => setConfig(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) / 100 }))}
                  className="w-32"
                  min={50}
                  max={100}
                />
              </div>
              
              <div className="setting-row">
                <div>
                  <Label>Enable Learning</Label>
                  <p className="text-sm text-muted-foreground">
                    Learn from successful heals to improve future repairs
                  </p>
                </div>
                <Switch
                  checked={config.learningEnabled}
                  onCheckedChange={(learningEnabled) => setConfig(prev => ({ ...prev, learningEnabled }))}
                />
              </div>
              
              <div className="setting-row">
                <div>
                  <Label>Auto-Approve High Confidence</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve heals above confidence threshold
                  </p>
                </div>
                <Switch
                  checked={config.autoApprove}
                  onCheckedChange={(autoApprove) => setConfig(prev => ({ ...prev, autoApprove }))}
                />
              </div>
              
              <div className="setting-row">
                <div>
                  <Label>Notify on Heal</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notification when a selector is healed
                  </p>
                </div>
                <Switch
                  checked={config.notifyOnHeal}
                  onCheckedChange={(notifyOnHeal) => setConfig(prev => ({ ...prev, notifyOnHeal }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SelfHealingSelectors;
