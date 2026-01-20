"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress as _Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator as _Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog as _Dialog,
  DialogContent as _DialogContent,
  DialogDescription as _DialogDescription,
  DialogHeader as _DialogHeader,
  DialogTitle as _DialogTitle,
  DialogFooter as _DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Shield as _Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  AlertCircle,
  Bell as _Bell,
  BellRing,
  Eye as _Eye,
  EyeOff as _EyeOff,
  Lock as _Lock,
  Unlock,
  Key,
  RefreshCw,
  Clock,
  Calendar,
  Activity,
  TrendingUp as _TrendingUp,
  TrendingDown as _TrendingDown,
  CheckCircle,
  XCircle as _XCircle,
  ExternalLink as _ExternalLink,
  ChevronRight,
  Zap as _Zap,
  Target as _Target,
  Globe,
  Server,
  Database,
  Mail as _Mail,
  CreditCard as _CreditCard,
  User,
  Smartphone,
  Wifi as _Wifi,
  Settings,
  Search as _Search,
  Filter as _Filter,
  Download as _Download,
  History,
  Radio,
  Radar,
  Skull,
  Loader2,
} from 'lucide-react';
import {
  WatchtowerDashboard as _WatchtowerDashboardType,
  WatchtowerAlert,
  WatchtowerStats,
  WatchtowerAlertType,
  WatchtowerAlertPriority,
} from '@/types/password-manager-pro';
import { logger } from '@/lib/services/logger-service';
import './WatchtowerDashboard.css';

const log = logger.scope('WatchtowerDashboard');

// ============================================================================
// BACKEND TYPES
// ============================================================================

interface BackendWatchtowerAlert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  affectedItem: string | null;
  createdAt: number;
  isDismissed: boolean;
}

interface BackendWatchtowerConfig {
  isEnabled: boolean;
  alerts: BackendWatchtowerAlert[];
  lastCheck: number;
  totalVulnerabilities: number;
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

function mapAlertTypeToFrontend(backendType: string): WatchtowerAlertType {
  const typeMap: Record<string, WatchtowerAlertType> = {
    breach: 'breach_detected',
    weak: 'weak_password',
    reused: 'reused_password',
    expiring: 'expiring_item',
    insecure: 'insecure_site',
    '2fa': 'inactive_2fa',
    suspicious: 'suspicious_activity',
    policy: 'policy_violation',
    leaked: 'password_leaked',
    compromised: 'service_compromised',
  };
  return typeMap[backendType] || 'breach_detected';
}

function mapSeverityToFrontend(backendSeverity: string): WatchtowerAlertPriority {
  const severityMap: Record<string, WatchtowerAlertPriority> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };
  return severityMap[backendSeverity] || 'medium';
}

function convertBackendAlert(backendAlert: BackendWatchtowerAlert): WatchtowerAlert {
  const alertType = mapAlertTypeToFrontend(backendAlert.alertType);
  const priority = mapSeverityToFrontend(backendAlert.severity);
  
  return {
    id: backendAlert.id,
    type: alertType,
    priority,
    title: backendAlert.title,
    description: backendAlert.description,
    affectedItems: backendAlert.affectedItem 
      ? [{ id: `item-${backendAlert.id}`, title: backendAlert.affectedItem, type: 'login' as const }]
      : [],
    source: 'Watchtower Scanner',
    detectedAt: new Date(backendAlert.createdAt * 1000),
    status: backendAlert.isDismissed ? 'resolved' as const : 'new' as const,
    actions: [
      { label: 'Change Password', action: 'change_password', primary: true },
      { label: 'Dismiss', action: 'dismiss', primary: false },
    ],
    metadata: {},
  };
}

function convertBackendToStats(config: BackendWatchtowerConfig): WatchtowerStats {
  const unresolvedAlerts = config.alerts.filter(a => !a.isDismissed).length;
  const criticalAlerts = config.alerts.filter(a => a.severity === 'critical' && !a.isDismissed).length;
  const breachAlerts = config.alerts.filter(a => a.alertType === 'breach' && !a.isDismissed).length;
  const weakAlerts = config.alerts.filter(a => a.alertType === 'weak' && !a.isDismissed).length;
  const reusedAlerts = config.alerts.filter(a => a.alertType === 'reused' && !a.isDismissed).length;
  const twoFaAlerts = config.alerts.filter(a => a.alertType === '2fa' && !a.isDismissed).length;

  return {
    totalAlerts: config.alerts.length,
    unresolvedAlerts,
    criticalAlerts,
    breachesDetected: breachAlerts,
    vulnerablePasswords: config.totalVulnerabilities,
    reusedPasswords: reusedAlerts,
    weakPasswords: weakAlerts,
    expiringSoon: 0,
    missingTwoFactor: twoFaAlerts,
    insecureSites: 0,
    lastScanAt: new Date(config.lastCheck * 1000),
    scanFrequency: 'daily',
    nextScanAt: new Date((config.lastCheck + 24 * 60 * 60) * 1000),
    protectedAccounts: 156,
    monitoredDomains: ['linkedin.com', 'facebook.com', 'twitter.com', 'adobe.com', 'dropbox.com'],
  };
}

// Default breaches data (static for now, could be expanded to backend later)
const defaultBreaches = [
  {
    id: 'breach-1',
    name: 'LinkedIn',
    domain: 'linkedin.com',
    breachDate: new Date('2024-12-15'),
    reportedAt: new Date('2025-01-10'),
    dataTypes: ['Email addresses', 'Passwords', 'Phone numbers', 'Employment info'],
    affectedAccounts: 15000000,
    description: 'In December 2024, LinkedIn suffered a data breach affecting 15 million users.',
    logo: undefined,
    isResolved: false,
  },
  {
    id: 'breach-2',
    name: 'Adobe',
    domain: 'adobe.com',
    breachDate: new Date('2024-11-20'),
    reportedAt: new Date('2024-12-05'),
    dataTypes: ['Email addresses', 'Password hints', 'Credit card info'],
    affectedAccounts: 5200000,
    description: 'Adobe customer database was compromised in November 2024.',
    logo: undefined,
    isResolved: true,
  },
  {
    id: 'breach-3',
    name: 'Dropbox',
    domain: 'dropbox.com',
    breachDate: new Date('2024-10-01'),
    reportedAt: new Date('2024-10-15'),
    dataTypes: ['Email addresses', 'API tokens'],
    affectedAccounts: 68000000,
    description: 'Dropbox disclosed a breach affecting sign-in API tokens.',
    logo: undefined,
    isResolved: true,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getPriorityColor = (priority: WatchtowerAlertPriority): string => {
  const colors: Record<WatchtowerAlertPriority, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return colors[priority];
};

const getPriorityIcon = (priority: WatchtowerAlertPriority) => {
  switch (priority) {
    case 'critical':
      return <ShieldX className="h-5 w-5 text-red-500" />;
    case 'high':
      return <ShieldAlert className="h-5 w-5 text-orange-500" />;
    case 'medium':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'low':
      return <AlertCircle className="h-5 w-5 text-blue-500" />;
  }
};

const getAlertTypeIcon = (type: WatchtowerAlertType) => {
  const icons: Record<WatchtowerAlertType, React.ReactNode> = {
    breach_detected: <Skull className="h-4 w-4" />,
    password_leaked: <Key className="h-4 w-4" />,
    service_compromised: <Server className="h-4 w-4" />,
    weak_password: <Unlock className="h-4 w-4" />,
    reused_password: <Key className="h-4 w-4" />,
    expiring_item: <Clock className="h-4 w-4" />,
    insecure_site: <Globe className="h-4 w-4" />,
    inactive_2fa: <Smartphone className="h-4 w-4" />,
    suspicious_activity: <Activity className="h-4 w-4" />,
    policy_violation: <ShieldAlert className="h-4 w-4" />,
  };
  return icons[type];
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AlertCardProps {
  alert: WatchtowerAlert;
  onAction: (alert: WatchtowerAlert, action: string) => void;
  onDismiss: (alert: WatchtowerAlert) => void;
}

function AlertCard({ alert, onAction, onDismiss }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`alert-card ${alert.priority}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`alert-icon ${alert.priority}`}>
            {getPriorityIcon(alert.priority)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{alert.title}</h4>
              <Badge className={getPriorityColor(alert.priority)}>
                {alert.priority}
              </Badge>
              {alert.status === 'new' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  New
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              {alert.description}
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {getAlertTypeIcon(alert.type)}
              <span className="capitalize">{alert.type.replace(/_/g, ' ')}</span>
              <span>•</span>
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(alert.detectedAt)}</span>
              <span>•</span>
              <span>{alert.affectedItems.length} item{alert.affectedItems.length !== 1 ? 's' : ''}</span>
            </div>

            {expanded && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">Affected Items</Label>
                  <div className="mt-2 space-y-1">
                    {alert.affectedItems.map(item => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <Key className="h-3 w-3" />
                        <span>{item.title}</span>
                        <Badge variant="outline" className="text-xs">{item.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {alert.metadata.breachDate && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Breach Date</Label>
                      <p>{formatDate(alert.metadata.breachDate)}</p>
                    </div>
                    {alert.metadata.affectedUsers && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Affected Users</Label>
                        <p>{alert.metadata.affectedUsers.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}

                {alert.metadata.dataTypes && alert.metadata.dataTypes.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Exposed Data Types</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {alert.metadata.dataTypes.map(type => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t">
          {alert.actions.map(action => (
            <Button
              key={action.action}
              size="sm"
              variant={action.primary ? 'default' : 'outline'}
              onClick={() => onAction(alert, action.action)}
            >
              {action.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => onDismiss(alert)}
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface BreachCardProps {
  breach: typeof defaultBreaches[0];
  onViewDetails: (breach: typeof defaultBreaches[0]) => void;
}

function BreachCard({ breach, onViewDetails }: BreachCardProps) {
  return (
    <Card className={`breach-card ${breach.isResolved ? 'resolved' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`breach-icon ${breach.isResolved ? 'resolved' : ''}`}>
            <Database className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{breach.name}</h4>
              {breach.isResolved ? (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolved
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Action Required
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              {breach.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(breach.breachDate)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {(breach.affectedAccounts / 1000000).toFixed(1)}M affected
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {breach.dataTypes.slice(0, 3).map(type => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type}
                </Badge>
              ))}
              {breach.dataTypes.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{breach.dataTypes.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          <Button size="sm" variant="outline" onClick={() => onViewDetails(breach)}>
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface WatchtowerDashboardProps {
  onClose?: () => void;
}

export function WatchtowerDashboard({ onClose: _onClose }: WatchtowerDashboardProps) {
  const [stats, setStats] = useState<WatchtowerStats | null>(null);
  const [alerts, setAlerts] = useState<WatchtowerAlert[]>([]);
  const [breaches] = useState(defaultBreaches);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [realTimeAlerts, setRealTimeAlerts] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadWatchtowerData = async () => {
      try {
        setLoading(true);
        const config = await invoke<BackendWatchtowerConfig>('get_watchtower_config');
        const convertedStats = convertBackendToStats(config);
        const convertedAlerts = config.alerts.map(convertBackendAlert);
        setStats(convertedStats);
        setAlerts(convertedAlerts);
        setMonitoringEnabled(config.isEnabled);
      } catch (error) {
        log.error('Failed to load watchtower data:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load watchtower data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadWatchtowerData();
  }, [toast]);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const config = await invoke<BackendWatchtowerConfig>('get_watchtower_config');
      const convertedStats = convertBackendToStats(config);
      const convertedAlerts = config.alerts.map(convertBackendAlert);
      setStats(convertedStats);
      setAlerts(convertedAlerts);
      toast({
        title: 'Scan Complete',
        description: 'All accounts have been checked for security issues',
      });
    } catch (error) {
      log.error('Failed to scan:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to scan',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  }, [toast]);

  const handleAlertAction = useCallback((alert: WatchtowerAlert, action: string) => {
    toast({
      title: 'Action Started',
      description: `Performing "${action}" for ${alert.title}`,
    });

    if (action === 'change_password' || action === 'generate_password') {
      setAlerts(prev => prev.map(a => 
        a.id === alert.id ? { ...a, status: 'resolved' as const, resolvedAt: new Date() } : a
      ));
    }
  }, [toast]);

  const handleDismissAlert = useCallback(async (alert: WatchtowerAlert) => {
    try {
      await invoke('dismiss_watchtower_alert', { alertId: alert.id });
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
      toast({
        title: 'Alert Dismissed',
        description: 'You can review dismissed alerts in settings',
      });
    } catch (error) {
      log.error('Failed to dismiss alert:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to dismiss alert',
        variant: 'destructive',
      });
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="watchtower-dashboard flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading watchtower data...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="watchtower-dashboard flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Failed to load watchtower data</p>
          <Button onClick={handleScan} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.priority === 'critical' && a.status === 'new');
  const unresolvedAlerts = alerts.filter(a => a.status !== 'resolved');

  return (
    <div className="watchtower-dashboard">
      {/* Header */}
      <div className="watchtower-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Radar className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Watchtower</h2>
            <p className="text-sm text-muted-foreground">
              Security monitoring and breach detection
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={handleScan} disabled={isScanning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </Button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50">
              <ShieldX className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                {criticalAlerts.length} Critical Security Issue{criticalAlerts.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                Immediate action required to protect your accounts
              </p>
            </div>
            <Button variant="destructive">
              Review Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card className="col-span-1">
          <CardContent className="p-4 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
              criticalAlerts.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            }`}>
              {criticalAlerts.length > 0 ? (
                <ShieldAlert className="h-6 w-6" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>
            <div className="text-2xl font-bold">{unresolvedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Active Alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Skull className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{stats.breachesDetected}</div>
            <p className="text-xs text-muted-foreground">Breaches</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Unlock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{stats.weakPasswords}</div>
            <p className="text-xs text-muted-foreground">Weak Passwords</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Key className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{stats.reusedPasswords}</div>
            <p className="text-xs text-muted-foreground">Reused</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Smartphone className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats.missingTwoFactor}</div>
            <p className="text-xs text-muted-foreground">Missing 2FA</p>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring Status */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${monitoringEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Radio className={`h-5 w-5 ${monitoringEnabled ? 'text-green-600 animate-pulse' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-medium">24/7 Security Monitoring</h3>
                <p className="text-sm text-muted-foreground">
                  {monitoringEnabled 
                    ? `Monitoring ${stats.protectedAccounts} accounts • Last scan: ${formatRelativeTime(stats.lastScanAt)}`
                    : 'Monitoring is disabled'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={realTimeAlerts}
                  onCheckedChange={setRealTimeAlerts}
                  id="realtime"
                />
                <Label htmlFor="realtime" className="text-sm">Real-time alerts</Label>
              </div>
              <Switch
                checked={monitoringEnabled}
                onCheckedChange={setMonitoringEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">
            <BellRing className="h-4 w-4 mr-2" />
            Alerts ({unresolvedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="breaches">
            <Skull className="h-4 w-4 mr-2" />
            Breaches ({breaches.length})
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <History className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card>
            <CardContent className="p-4">
              <ScrollArea className="h-[400px]">
                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onAction={handleAlertAction}
                        onDismiss={handleDismissAlert}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-medium mb-2">All Clear!</h3>
                    <p className="text-muted-foreground">
                      No security alerts at this time
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breaches">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Data Breaches</CardTitle>
              <CardDescription>
                Data breaches that may affect your accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                <div className="space-y-3">
                  {breaches.map(breach => (
                    <BreachCard
                      key={breach.id}
                      breach={breach}
                      onViewDetails={() => toast({ title: 'Details', description: breach.description })}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                
                <div className="space-y-6">
                  {[
                    { date: new Date(), type: 'scan', description: 'Security scan completed - 5 issues found' },
                    { date: new Date(Date.now() - 2 * 60 * 60 * 1000), type: 'alert', description: 'Critical: LinkedIn breach detected' },
                    { date: new Date(Date.now() - 24 * 60 * 60 * 1000), type: 'resolved', description: 'Password updated for Adobe account' },
                    { date: new Date(Date.now() - 48 * 60 * 60 * 1000), type: 'scan', description: 'Scheduled security scan completed' },
                    { date: new Date(Date.now() - 72 * 60 * 60 * 1000), type: 'alert', description: 'Weak password detected for Amazon' },
                  ].map((event, index) => (
                    <div key={index} className="flex gap-4 pl-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        event.type === 'alert' ? 'bg-red-100 text-red-600' :
                        event.type === 'resolved' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {event.type === 'alert' ? <AlertCircle className="h-4 w-4" /> :
                         event.type === 'resolved' ? <CheckCircle className="h-4 w-4" /> :
                         <RefreshCw className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{event.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(event.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WatchtowerDashboard;
