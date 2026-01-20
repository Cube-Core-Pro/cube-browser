'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('ROIDashboard');

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  TrendingUp, DollarSign, Clock, Zap, Calendar,
  BarChart3, ArrowUpRight,
  Workflow, Bot, Key, Globe, Monitor, Database,
  ChevronRight, Download, RefreshCw, Info,
  AlertTriangle, CheckCircle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// =============================================================================
// Types
// =============================================================================

interface UsageMetrics {
  automations: {
    total: number;
    thisMonth: number;
    timeSavedMinutes: number;
  };
  ai: {
    messagesTotal: number;
    messagesThisMonth: number;
    tokensUsed: number;
  };
  passwords: {
    stored: number;
    autofills: number;
    breachesBlocked: number;
  };
  vpn: {
    sessionsTotal: number;
    dataProtectedGB: number;
    countriesUsed: number;
  };
  browser: {
    tabsOpened: number;
    adsBlocked: number;
    trackersBlocked: number;
  };
  remote: {
    sessionsTotal: number;
    hoursConnected: number;
  };
}

interface SavingsBreakdown {
  category: string;
  icon: React.ReactNode;
  alternative: string;
  alternativePrice: number;
  usage: string;
  savingsMonthly: number;
  color: string;
}

interface ROIDashboardProps {
  compact?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const ALTERNATIVE_PRICES = {
  automation: { name: 'Zapier Pro', monthly: 49 },
  ai: { name: 'ChatGPT Plus', monthly: 20 },
  passwords: { name: '1Password Teams', monthly: 8 },
  vpn: { name: 'NordVPN', monthly: 12 },
  browser: { name: 'Arc + Extensions', monthly: 0 },
  remote: { name: 'TeamViewer', monthly: 30 },
  database: { name: 'TablePlus', monthly: 8 },
  communication: { name: 'Zoom Pro', monthly: 15 }
};

const HOURLY_RATE = 50;

// =============================================================================
// Component
// =============================================================================

export const ROIDashboard: React.FC<ROIDashboardProps> = ({ compact = false }) => {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast notification helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Load usage metrics
  useEffect(() => {
    const loadMetrics = async () => {
      setError(null);
      try {
        const data = await invoke<UsageMetrics>('get_usage_metrics', { timeRange });
        setMetrics(data);
      } catch (err) {
        log.error('Failed to load metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load usage metrics');
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [timeRange]);

  // Calculate savings breakdown
  const savingsBreakdown = useMemo<SavingsBreakdown[]>(() => {
    if (!metrics) return [];

    return [
      {
        category: 'Automation',
        icon: <Workflow className="w-5 h-5" />,
        alternative: ALTERNATIVE_PRICES.automation.name,
        alternativePrice: ALTERNATIVE_PRICES.automation.monthly,
        usage: `${metrics.automations.thisMonth} workflows run`,
        savingsMonthly: metrics.automations.thisMonth > 10 ? ALTERNATIVE_PRICES.automation.monthly : 0,
        color: 'blue'
      },
      {
        category: 'AI Assistant',
        icon: <Bot className="w-5 h-5" />,
        alternative: ALTERNATIVE_PRICES.ai.name,
        alternativePrice: ALTERNATIVE_PRICES.ai.monthly,
        usage: `${metrics.ai.messagesThisMonth} messages`,
        savingsMonthly: metrics.ai.messagesThisMonth > 50 ? ALTERNATIVE_PRICES.ai.monthly : 0,
        color: 'purple'
      },
      {
        category: 'Password Manager',
        icon: <Key className="w-5 h-5" />,
        alternative: ALTERNATIVE_PRICES.passwords.name,
        alternativePrice: ALTERNATIVE_PRICES.passwords.monthly,
        usage: `${metrics.passwords.stored} passwords`,
        savingsMonthly: metrics.passwords.stored > 10 ? ALTERNATIVE_PRICES.passwords.monthly : 0,
        color: 'green'
      },
      {
        category: 'VPN',
        icon: <Globe className="w-5 h-5" />,
        alternative: ALTERNATIVE_PRICES.vpn.name,
        alternativePrice: ALTERNATIVE_PRICES.vpn.monthly,
        usage: `${metrics.vpn.dataProtectedGB.toFixed(1)} GB protected`,
        savingsMonthly: metrics.vpn.sessionsTotal > 5 ? ALTERNATIVE_PRICES.vpn.monthly : 0,
        color: 'cyan'
      },
      {
        category: 'Remote Desktop',
        icon: <Monitor className="w-5 h-5" />,
        alternative: ALTERNATIVE_PRICES.remote.name,
        alternativePrice: ALTERNATIVE_PRICES.remote.monthly,
        usage: `${metrics.remote.hoursConnected.toFixed(1)} hours`,
        savingsMonthly: metrics.remote.sessionsTotal > 2 ? ALTERNATIVE_PRICES.remote.monthly : 0,
        color: 'red'
      },
      {
        category: 'Database Tools',
        icon: <Database className="w-5 h-5" />,
        alternative: ALTERNATIVE_PRICES.database.name,
        alternativePrice: ALTERNATIVE_PRICES.database.monthly,
        usage: 'Included',
        savingsMonthly: ALTERNATIVE_PRICES.database.monthly,
        color: 'orange'
      }
    ];
  }, [metrics]);

  // Calculate totals
  const totalMonthlySavings = useMemo(() => {
    return savingsBreakdown.reduce((sum, item) => sum + item.savingsMonthly, 0);
  }, [savingsBreakdown]);

  const timeSavedValue = useMemo(() => {
    if (!metrics) return 0;
    const hours = metrics.automations.timeSavedMinutes / 60;
    return hours * HOURLY_RATE;
  }, [metrics]);

  const totalValue = totalMonthlySavings + timeSavedValue;

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoke<UsageMetrics>('get_usage_metrics', { timeRange });
      setMetrics(data);
      showToast('success', 'Metrics refreshed successfully');
    } catch (err) {
      log.error('Refresh failed:', err);
      showToast('error', `Failed to refresh: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      await invoke('export_roi_report', { 
        metrics, 
        savings: savingsBreakdown,
        totalValue 
      });
      showToast('success', 'ROI report exported successfully');
    } catch (err) {
      log.error('Export failed:', err);
      showToast('error', `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getColorClasses = (color: string) => {
    const classes: Record<string, string> = {
      blue: 'bg-blue-500/20 text-blue-500',
      purple: 'bg-purple-500/20 text-purple-500',
      green: 'bg-green-500/20 text-green-500',
      cyan: 'bg-cyan-500/20 text-cyan-500',
      red: 'bg-red-500/20 text-red-500',
      orange: 'bg-orange-500/20 text-orange-500'
    };
    return classes[color] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Calculating your savings...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Info className="w-8 h-8 text-muted-foreground" />
          <p className="text-muted-foreground">No usage metrics available yet</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Monthly Savings</p>
            <p className="text-xl font-bold text-green-500">${totalValue.toFixed(0)}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-green-500" />
          <div>
            <h2 className="text-2xl font-bold">Your ROI Dashboard</h2>
            <p className="text-sm text-muted-foreground">Track your savings and productivity gains</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-3xl font-bold">${totalValue.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Total Monthly Value</p>
              </div>
              <Badge className="bg-green-500/20 text-green-500 border-0">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +12%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">
              {metrics ? Math.round(metrics.automations.timeSavedMinutes / 60) : 0}h
            </p>
            <p className="text-sm text-muted-foreground">Time Saved</p>
            <p className="text-xs text-primary mt-1">= ${timeSavedValue.toFixed(0)} value</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">${totalMonthlySavings}</p>
            <p className="text-sm text-muted-foreground">Tools Replaced</p>
            <p className="text-xs text-muted-foreground mt-1">6 subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">${(totalValue * 12).toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Annual Savings</p>
            <Badge variant="outline" className="mt-1 text-[10px]">Projected</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Savings Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Savings Breakdown</CardTitle>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              Based on your actual usage
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {savingsBreakdown.map((item) => (
            <div key={item.category} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", getColorClasses(item.color))}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.category}</p>
                <p className="text-xs text-muted-foreground">{item.usage}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">vs {item.alternative}</p>
                <p className="text-xs">${item.alternativePrice}/mo</p>
              </div>
              <div className="w-20 text-right">
                {item.savingsMonthly > 0 ? (
                  <span className="text-sm font-semibold text-green-500">+${item.savingsMonthly}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex items-center justify-between pt-3 mt-3 border-t">
            <span className="text-sm text-muted-foreground">Total Monthly Savings from Replaced Tools</span>
            <span className="text-lg font-bold text-green-500">${totalMonthlySavings}/mo</span>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { icon: <Workflow className="w-4 h-4" />, value: metrics?.automations.total || 0, label: 'Automations', color: 'blue' },
              { icon: <Bot className="w-4 h-4" />, value: metrics?.ai.messagesTotal || 0, label: 'AI Messages', color: 'purple' },
              { icon: <Key className="w-4 h-4" />, value: metrics?.passwords.autofills || 0, label: 'Autofills', color: 'green' },
              { icon: <Globe className="w-4 h-4" />, value: `${metrics?.vpn.dataProtectedGB.toFixed(0) || 0} GB`, label: 'Protected', color: 'cyan' },
              { icon: <BarChart3 className="w-4 h-4" />, value: metrics?.browser.adsBlocked || 0, label: 'Ads Blocked', color: 'orange' },
              { icon: <Monitor className="w-4 h-4" />, value: metrics?.remote.sessionsTotal || 0, label: 'Remote Sessions', color: 'red' }
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                <div className={cn("w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center", getColorClasses(stat.color))}>
                  {stat.icon}
                </div>
                <p className="text-lg font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold">Want to save even more?</p>
            <p className="text-sm text-muted-foreground">
              Upgrade to Elite for unlimited features and maximum ROI
            </p>
          </div>
          <Button>
            Upgrade Now
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(toast => (
            <div 
              key={toast.id} 
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg min-w-[280px] animate-in slide-in-from-right",
                toast.type === 'success' && "bg-green-500/90 text-white",
                toast.type === 'error' && "bg-destructive/90 text-destructive-foreground",
                toast.type === 'info' && "bg-primary/90 text-primary-foreground"
              )}
            >
              {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {toast.type === 'error' && <AlertTriangle className="w-4 h-4" />}
              {toast.type === 'info' && <Info className="w-4 h-4" />}
              <span className="flex-1 text-sm">{toast.message}</span>
              <button 
                onClick={() => dismissToast(toast.id)} 
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ROIDashboard;
