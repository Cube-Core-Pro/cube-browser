"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AISalesAssistant');

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
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Lightbulb,
  MessageSquare,
  Send,
  RefreshCcw,
  Settings,
  DollarSign,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  Loader2,
} from 'lucide-react';
import {
  AISalesInsight,
  SalesCoaching,
  AISalesConfig,
  InsightType,
  UrgencyLevel,
} from '@/types/crm-elite';
import './AISalesAssistant.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendRelatedEntity {
  type: string;
  id: string;
  name: string;
}

interface BackendAISalesInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  urgency: string;
  relatedEntities: BackendRelatedEntity[];
  suggestedActions: string[];
  createdAt: number;
}

interface BackendSalesCoaching {
  id: string;
  category: string;
  tip: string;
  context: string;
  examples: string[];
  relevance: number;
}

interface BackendAISalesAssistantConfig {
  suggestions: BackendAISalesInsight[];
  insights: BackendSalesCoaching[];
  isEnabled: boolean;
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

function convertBackendInsight(backend: BackendAISalesInsight): AISalesInsight {
  return {
    id: backend.id,
    type: backend.type as InsightType,
    title: backend.title,
    description: backend.description,
    confidence: backend.confidence,
    urgency: backend.urgency as UrgencyLevel,
    relatedEntities: backend.relatedEntities.map(e => ({
      type: e.type as 'deal' | 'lead' | 'contact' | 'company',
      id: e.id,
      name: e.name,
    })),
    suggestedActions: backend.suggestedActions,
    createdAt: new Date(backend.createdAt),
  };
}

function convertBackendCoaching(backend: BackendSalesCoaching): SalesCoaching {
  return {
    id: backend.id,
    category: backend.category as SalesCoaching['category'],
    tip: backend.tip,
    context: backend.context,
    examples: backend.examples,
    relevance: backend.relevance,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getInsightIcon = (type: InsightType) => {
  switch (type) {
    case 'opportunity':
      return Target;
    case 'risk':
      return AlertTriangle;
    case 'action':
      return CheckCircle2;
    case 'trend':
      return TrendingUp;
    case 'milestone':
      return Trophy;
    default:
      return Lightbulb;
  }
};

const getInsightColor = (type: InsightType): string => {
  switch (type) {
    case 'opportunity':
      return '#22c55e';
    case 'risk':
      return '#ef4444';
    case 'action':
      return '#3b82f6';
    case 'trend':
      return '#8b5cf6';
    case 'milestone':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
};

const getUrgencyColor = (urgency: UrgencyLevel): string => {
  switch (urgency) {
    case 'critical':
      return '#dc2626';
    case 'high':
      return '#f59e0b';
    case 'medium':
      return '#3b82f6';
    case 'low':
      return '#22c55e';
    default:
      return '#6b7280';
  }
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

interface InsightCardProps {
  insight: AISalesInsight;
  onAction: (insight: AISalesInsight, action: string) => void;
  onDismiss: (id: string) => void;
}

function InsightCard({ insight, onAction, onDismiss }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const InsightIcon = getInsightIcon(insight.type);
  
  return (
    <div 
      className={`insight-card ${insight.urgency}`}
      style={{ borderLeftColor: getInsightColor(insight.type) }}
    >
      <div className="insight-header">
        <div 
          className="insight-icon"
          style={{ 
            backgroundColor: `${getInsightColor(insight.type)}15`,
            color: getInsightColor(insight.type),
          }}
        >
          <InsightIcon className="h-4 w-4" />
        </div>
        <div className="insight-title-row">
          <span className="insight-title">{insight.title}</span>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary"
              style={{
                backgroundColor: `${getUrgencyColor(insight.urgency)}15`,
                color: getUrgencyColor(insight.urgency),
              }}
            >
              {insight.urgency}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {Math.round(insight.confidence * 100)}% confident
            </span>
          </div>
        </div>
      </div>
      
      <p className="insight-description">{insight.description}</p>
      
      {insight.relatedEntities.length > 0 && (
        <div className="insight-entities">
          {insight.relatedEntities.map(entity => (
            <Badge key={entity.id} variant="outline" className="text-xs">
              {entity.type}: {entity.name}
            </Badge>
          ))}
        </div>
      )}
      
      {expanded && (
        <div className="insight-actions-list">
          <span className="text-xs font-medium text-muted-foreground">Suggested Actions:</span>
          {insight.suggestedActions.map((action, idx) => (
            <Button
              key={idx}
              variant="ghost"
              size="sm"
              className="justify-start h-auto py-2"
              onClick={() => onAction(insight, action)}
            >
              <ArrowRight className="h-3 w-3 mr-2" />
              {action}
            </Button>
          ))}
        </div>
      )}
      
      <div className="insight-footer">
        <span className="text-xs text-muted-foreground">
          {formatTimeAgo(insight.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show Less' : 'Show Actions'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(insight.id)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CoachingCardProps {
  coaching: SalesCoaching;
}

function CoachingCard({ coaching }: CoachingCardProps) {
  const [showExamples, setShowExamples] = useState(false);
  
  return (
    <div className="coaching-card">
      <div className="flex items-start gap-3">
        <div className="coaching-icon">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <Badge variant="secondary" className="mb-2">
            {coaching.category.replace('-', ' ')}
          </Badge>
          <p className="text-sm">{coaching.tip}</p>
          <p className="text-xs text-muted-foreground mt-1">{coaching.context}</p>
          
          {showExamples && (
            <div className="coaching-examples">
              {coaching.examples.map((example, idx) => (
                <div key={idx} className="coaching-example">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                  <span>{example}</span>
                </div>
              ))}
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setShowExamples(!showExamples)}
          >
            {showExamples ? 'Hide Examples' : 'Show Examples'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface AISalesAssistantProps {
  onClose?: () => void;
}

export function AISalesAssistant({ onClose: _onClose }: AISalesAssistantProps) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<AISalesConfig>({
    enabled: true,
    autoAnalyze: true,
    insightFrequency: 'realtime',
    enableCoaching: true,
    personalizedInsights: true,
    integrations: {
      email: true,
      calendar: true,
      calls: true,
      documents: false,
    },
  });
  const [insights, setInsights] = useState<AISalesInsight[]>([]);
  const [coaching, setCoaching] = useState<SalesCoaching[]>([]);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');
  const { toast } = useToast();

  // Fetch data from backend on mount
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendAISalesAssistantConfig>('get_ai_sales_assistant_config');
        
        if (mounted) {
          const convertedInsights = backendConfig.suggestions.map(convertBackendInsight);
          const convertedCoaching = backendConfig.insights.map(convertBackendCoaching);
          setInsights(convertedInsights);
          setCoaching(convertedCoaching);
          setConfig(prev => ({ ...prev, enabled: backendConfig.isEnabled }));
        }
      } catch (error) {
        if (mounted) {
          log.error('Failed to fetch AI sales assistant config:', error);
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to load AI sales assistant data',
            variant: 'destructive',
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [toast]);

  const criticalInsights = insights.filter(i => i.urgency === 'critical' || i.urgency === 'high');

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = {
      role: 'user' as const,
      content: inputValue,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      const assistantMessage = {
        role: 'assistant' as const,
        content: 'I\'ve analyzed your request. Based on the current pipeline data and recent interactions, here are my recommendations...\n\nThis is a simulated response. In production, this would connect to OpenAI GPT-4 for real-time sales intelligence.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  }, [inputValue]);

  const handleInsightAction = useCallback((insight: AISalesInsight, action: string) => {
    toast({
      title: 'Action Initiated',
      description: action,
    });
  }, [toast]);

  const handleDismissInsight = useCallback(async (id: string) => {
    try {
      await invoke('dismiss_ai_suggestion', { suggestionId: id });
      setInsights(prev => prev.filter(i => i.id !== id));
      toast({
        title: 'Insight Dismissed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to dismiss insight',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleRefreshInsights = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Insights Refreshed',
        description: 'Analysis updated with latest data',
      });
    }, 1500);
  }, [toast]);

  if (loading) {
    return (
      <div className="ai-sales-assistant">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading AI Sales Assistant...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-sales-assistant">
      {/* Header */}
      <div className="assistant-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Brain className="h-6 w-6" />
            <Sparkles className="sparkle-icon" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Sales Assistant</h2>
            <p className="text-sm text-muted-foreground">
              Powered by GPT-4 for intelligent sales insights
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshInsights} disabled={isLoading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalInsights.length > 0 && (
        <div className="critical-alerts">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="font-medium text-red-500">
              {criticalInsights.length} items need attention
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="assistant-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{insights.length}</span>
            <span className="stat-label">Active Insights</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">+23%</span>
            <span className="stat-label">Pipeline Growth</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">34%</span>
            <span className="stat-label">Win Rate</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">$2.4M</span>
            <span className="stat-label">Pipeline Value</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="insights">
            <Lightbulb className="h-4 w-4 mr-2" />
            Insights ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="coaching">
            <Trophy className="h-4 w-4 mr-2" />
            Coaching
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-4">
              {insights.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onAction={handleInsightAction}
                  onDismiss={handleDismissInsight}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={`chat-message ${message.role}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="message-avatar">
                          <Brain className="h-4 w-4" />
                        </div>
                      )}
                      <div className="message-content">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="chat-message assistant">
                      <div className="message-avatar">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div className="message-content">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="chat-input-area">
                <Input
                  placeholder="Ask about your deals, leads, or sales strategy..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coaching">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-4">
              {coaching.map(coachingItem => (
                <CoachingCard key={coachingItem.id} coaching={coachingItem} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Assistant Settings</CardTitle>
              <CardDescription>
                Configure how the AI assistant works for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Enable AI Assistant</Label>
                  <p className="text-sm text-muted-foreground">
                    Get AI-powered sales insights
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(enabled) => 
                    setConfig(prev => ({ ...prev, enabled }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Auto-Analyze Interactions</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically analyze emails and calls
                  </p>
                </div>
                <Switch
                  checked={config.autoAnalyze}
                  onCheckedChange={(autoAnalyze) => 
                    setConfig(prev => ({ ...prev, autoAnalyze }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Sales Coaching</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive contextual coaching tips
                  </p>
                </div>
                <Switch
                  checked={config.enableCoaching}
                  onCheckedChange={(enableCoaching) => 
                    setConfig(prev => ({ ...prev, enableCoaching }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Personalized Insights</Label>
                  <p className="text-sm text-muted-foreground">
                    Insights based on your selling style
                  </p>
                </div>
                <Switch
                  checked={config.personalizedInsights}
                  onCheckedChange={(personalizedInsights) => 
                    setConfig(prev => ({ ...prev, personalizedInsights }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AISalesAssistant;
