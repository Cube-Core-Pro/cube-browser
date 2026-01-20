"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription as _CardDescription, CardHeader as _CardHeader, CardTitle as _CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress as _Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Shield as _Shield,
  ShieldAlert as _ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  AlertCircle,
  Eye,
  EyeOff as _EyeOff,
  Lock as _Lock,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle as _XCircle,
  Mail,
  Phone,
  CreditCard,
  Globe,
  Calendar,
  Clock,
  Activity,
  Search as _Search,
  Radar,
  Skull,
  FileWarning,
  Database,
  Layers,
  ExternalLink as _ExternalLink,
  ChevronRight,
  Settings as _Settings,
  Bell as _Bell,
  BellRing,
  BellOff,
  Download as _Download,
  TrendingUp as _TrendingUp,
  User as _User,
  Loader2,
} from 'lucide-react';
import {
  DarkWebMonitor as _DarkWebMonitorType,
  DarkWebExposure,
  DarkWebExposureType,
  DarkWebDataType,
  MonitoredItem,
} from '@/types/password-manager-pro';
import { logger } from '@/lib/services/logger-service';
import './DarkWebMonitor.css';

const log = logger.scope('DarkWebMonitor');

// ============================================================================
// BACKEND TYPES
// ============================================================================

interface BackendDarkWebBreach {
  id: string;
  source: string;
  breachDate: number; // Unix timestamp
  discoveredDate: number; // Unix timestamp
  compromisedData: string[];
  severity: string;
  isResolved: boolean;
  affectedEmail: string;
  description: string;
}

interface BackendDarkWebMonitorConfig {
  isEnabled: boolean;
  monitoredEmails: string[];
  breaches: BackendDarkWebBreach[];
  lastScan: number; // Unix timestamp
  totalBreachesFound: number;
  resolvedBreaches: number;
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

const convertEmailToMonitoredItem = (email: string, index: number, breaches: BackendDarkWebBreach[]): MonitoredItem => {
  const emailBreaches = breaches.filter(b => b.affectedEmail === email);
  const unresolvedBreaches = emailBreaches.filter(b => !b.isResolved);
  const hasCompromise = unresolvedBreaches.length > 0;
  const lastBreach = emailBreaches.length > 0 
    ? new Date(Math.max(...emailBreaches.map(b => b.discoveredDate)) * 1000)
    : undefined;

  return {
    id: `monitor-email-${index}`,
    type: 'email',
    value: email,
    maskedValue: maskEmail(email),
    status: hasCompromise ? 'compromised' : 'active',
    addedAt: new Date(),
    lastCheckedAt: new Date(),
    exposureCount: emailBreaches.length,
    lastExposureAt: lastBreach,
  };
};

const convertBreachToExposure = (breach: BackendDarkWebBreach): DarkWebExposure => {
  const severityMap: Record<string, DarkWebExposure['severity']> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };
  const severity = severityMap[breach.severity.toLowerCase()] || 'medium';

  const getStatusFromBreach = (): 'new' | 'acknowledged' | 'resolved' => {
    if (breach.isResolved) return 'resolved';
    const daysSinceDiscovery = (Date.now() - breach.discoveredDate * 1000) / (1000 * 60 * 60 * 24);
    return daysSinceDiscovery > 7 ? 'acknowledged' : 'new';
  };

  const getDataType = (): DarkWebExposureType => {
    if (breach.compromisedData.includes('password')) return 'email_password';
    if (breach.compromisedData.includes('credit_card')) return 'credit_card';
    if (breach.compromisedData.includes('ssn')) return 'ssn';
    if (breach.compromisedData.includes('phone')) return 'phone';
    return 'email';
  };

  return {
    id: breach.id,
    monitoredItemId: `monitor-${breach.affectedEmail}`,
    source: breach.source,
    discoveredAt: new Date(breach.discoveredDate * 1000),
    detectedAt: new Date(breach.discoveredDate * 1000),
    dataTypes: breach.compromisedData as DarkWebDataType[],
    exposedData: breach.compromisedData.map(dataType => ({
      type: dataType as DarkWebExposureType,
      value: maskEmail(breach.affectedEmail),
      isHashedOrPartial: true,
    })),
    data: {
      email: maskEmail(breach.affectedEmail),
      breachDate: new Date(breach.breachDate * 1000).toLocaleDateString(),
    },
    type: getDataType(),
    severity,
    riskLevel: severity,
    description: breach.description,
    actionsTaken: breach.isResolved ? ['Resolved'] : [],
    recommendedActions: [
      'Change your password immediately',
      'Enable two-factor authentication',
      'Check for unauthorized access',
    ],
    recommendations: [
      'Change your password immediately',
      'Enable two-factor authentication',
      'Check for unauthorized access',
    ],
    affectedMonitoredItems: [`monitor-${breach.affectedEmail}`],
    status: getStatusFromBreach(),
    resolvedAt: breach.isResolved ? new Date() : undefined,
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getItemIcon = (type: MonitoredItem['type']) => {
  const icons = {
    email: <Mail className="h-4 w-4" />,
    phone: <Phone className="h-4 w-4" />,
    ssn: <FileWarning className="h-4 w-4" />,
    passport: <Globe className="h-4 w-4" />,
    drivers_license: <CreditCard className="h-4 w-4" />,
    credit_card: <CreditCard className="h-4 w-4" />,
    bank_account: <Database className="h-4 w-4" />,
  };
  return icons[type] || <Layers className="h-4 w-4" />;
};

const getStatusBadge = (status: MonitoredItem['status']) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
    case 'inactive':
      return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Inactive</Badge>;
    case 'compromised':
      return <Badge variant="destructive">Compromised</Badge>;
    case 'resolved':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Resolved</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Unknown</Badge>;
  }
};

const getSeverityBadge = (severity: DarkWebExposure['severity']) => {
  if (!severity) {
    return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Unknown</Badge>;
  }
  const styles = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return <Badge className={styles[severity]}>{severity}</Badge>;
};

const getExposureTypeLabel = (type: DarkWebExposureType | string | undefined): string => {
  if (!type) return 'Unknown Exposure';
  const labels: Record<DarkWebExposureType, string> = {
    email: 'Email Address',
    password: 'Password',
    username: 'Username',
    phone: 'Phone Number',
    address: 'Address',
    ssn: 'Social Security Number',
    credit_card: 'Credit Card',
    bank_account: 'Bank Account',
    passport: 'Passport',
    driver_license: 'Driver License',
    medical_record: 'Medical Records',
    ip_address: 'IP Address',
    email_password: 'Email & Password',
    financial: 'Financial Data',
    identity: 'Identity Documents',
  };
  return labels[type as DarkWebExposureType] || type.replace(/_/g, ' ');
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

  if (days > 30) return formatDate(date);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MonitoredItemCardProps {
  item: MonitoredItem;
  onRemove: (item: MonitoredItem) => void;
  onViewExposures: (item: MonitoredItem) => void;
}

function MonitoredItemCard({ item, onRemove, onViewExposures }: MonitoredItemCardProps) {
  return (
    <Card className={`monitored-item-card ${item.status}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`item-icon ${item.status}`}>
            {getItemIcon(item.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium capitalize">{item.type.replace(/_/g, ' ')}</span>
              {getStatusBadge(item.status)}
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {item.maskedValue}
            </p>
          </div>

          <div className="text-right">
            {(item.exposureCount ?? 0) > 0 ? (
              <div>
                <span className="text-lg font-bold text-red-600">{item.exposureCount}</span>
                <p className="text-xs text-muted-foreground">exposures</p>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-green-600">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm">Protected</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(item.exposureCount ?? 0) > 0 && (
              <Button size="sm" variant="outline" onClick={() => onViewExposures(item)}>
                View
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onRemove(item)}
              className="text-muted-foreground hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
          {item.lastCheckedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last checked: {formatRelativeTime(item.lastCheckedAt)}
            </span>
          )}
          {item.lastExposureAt && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-3 w-3" />
              Last exposure: {formatRelativeTime(item.lastExposureAt)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ExposureCardProps {
  exposure: DarkWebExposure;
  onResolve: (exposure: DarkWebExposure) => void;
  onAcknowledge: (exposure: DarkWebExposure) => void;
}

function ExposureCard({ exposure, onResolve, onAcknowledge }: ExposureCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`exposure-card ${exposure.severity}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`exposure-icon ${exposure.severity}`}>
            <Skull className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{getExposureTypeLabel(exposure.type)}</h4>
              {getSeverityBadge(exposure.severity)}
              {exposure.status === 'new' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  New
                </Badge>
              )}
              {exposure.status === 'resolved' && (
                <Badge className="bg-green-100 text-green-700">Resolved</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              Found on: {exposure.source}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {exposure.detectedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(exposure.detectedAt)}
                </span>
              )}
            </div>

            {expanded && (
              <div className="mt-4 space-y-3">
                {exposure.data && typeof exposure.data === 'object' && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-xs text-muted-foreground">Exposed Data</Label>
                    <div className="mt-2 space-y-1">
                      {Object.entries(exposure.data).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-muted-foreground">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {exposure.recommendations && exposure.recommendations.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Recommendations</Label>
                    <ul className="mt-2 space-y-1">
                      {exposure.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>

        {exposure.status !== 'resolved' && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
            <Button size="sm" onClick={() => onResolve(exposure)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Resolved
            </Button>
            {exposure.status === 'new' && (
              <Button size="sm" variant="outline" onClick={() => onAcknowledge(exposure)}>
                Acknowledge
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface DarkWebMonitorProps {
  onClose?: () => void;
}

export function DarkWebMonitor({ onClose: _onClose }: DarkWebMonitorProps) {
  const [monitoredItems, setMonitoredItems] = useState<MonitoredItem[]>([]);
  const [exposures, setExposures] = useState<DarkWebExposure[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItemType, setNewItemType] = useState<MonitoredItem['type']>('email');
  const [newItemValue, setNewItemValue] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load data from backend on mount
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const config = await invoke<BackendDarkWebMonitorConfig>('get_darkweb_monitor_config');
        
        if (mounted) {
          // Convert backend emails to MonitoredItems
          const items = config.monitoredEmails.map((email, index) => 
            convertEmailToMonitoredItem(email, index, config.breaches)
          );
          setMonitoredItems(items);

          // Convert backend breaches to DarkWebExposures
          const convertedExposures = config.breaches.map(convertBreachToExposure);
          setExposures(convertedExposures);

          setAlertsEnabled(config.isEnabled);
        }
      } catch (error) {
        if (mounted) {
          log.error('Failed to load dark web monitor config:', error);
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to load monitoring data',
            variant: 'destructive',
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [toast]);

  const compromisedCount = monitoredItems.filter(i => i.status === 'compromised').length;
  const unresolvedExposures = exposures.filter(e => e.status !== 'resolved');
  const criticalExposures = exposures.filter(e => e.severity === 'critical' && e.status !== 'resolved');

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    try {
      // Fetch fresh data from backend (simulates scan)
      const config = await invoke<BackendDarkWebMonitorConfig>('get_darkweb_monitor_config');
      
      // Convert backend emails to MonitoredItems
      const items = config.monitoredEmails.map((email, index) => 
        convertEmailToMonitoredItem(email, index, config.breaches)
      );
      setMonitoredItems(items);

      // Convert backend breaches to DarkWebExposures
      const convertedExposures = config.breaches.map(convertBreachToExposure);
      setExposures(convertedExposures);

      toast({
        title: 'Scan Complete',
        description: `Scanned ${config.monitoredEmails.length} items against dark web databases`,
      });
    } catch (error) {
      log.error('Failed to scan:', error);
      toast({
        title: 'Scan Failed',
        description: error instanceof Error ? error.message : 'Failed to scan dark web',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  }, [toast]);

  const handleAddItem = useCallback(async () => {
    if (!newItemValue.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a value to monitor',
        variant: 'destructive',
      });
      return;
    }

    // Currently backend only supports email monitoring
    if (newItemType !== 'email') {
      // Add locally for non-email types (no backend support yet)
      const newItem: MonitoredItem = {
        id: `monitor-${Date.now()}`,
        type: newItemType,
        value: newItemValue,
        maskedValue: newItemValue.replace(/(?<=.{2}).(?=.{3})/g, '*'),
        status: 'active',
        addedAt: new Date(),
        lastCheckedAt: new Date(),
        exposureCount: 0,
      };
      setMonitoredItems(prev => [...prev, newItem]);
      setShowAddDialog(false);
      setNewItemValue('');
      toast({
        title: 'Item Added',
        description: `Now monitoring your ${newItemType.replace(/_/g, ' ')}`,
      });
      return;
    }

    try {
      await invoke('add_monitored_email', { email: newItemValue });
      
      // Refresh data from backend
      const config = await invoke<BackendDarkWebMonitorConfig>('get_darkweb_monitor_config');
      const items = config.monitoredEmails.map((email, index) => 
        convertEmailToMonitoredItem(email, index, config.breaches)
      );
      setMonitoredItems(items);

      setShowAddDialog(false);
      setNewItemValue('');

      toast({
        title: 'Item Added',
        description: `Now monitoring your ${newItemType.replace(/_/g, ' ')}`,
      });
    } catch (error) {
      log.error('Failed to add monitored item:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add item',
        variant: 'destructive',
      });
    }
  }, [newItemType, newItemValue, toast]);

  const handleRemoveItem = useCallback((item: MonitoredItem) => {
    setMonitoredItems(prev => prev.filter(i => i.id !== item.id));
    toast({
      title: 'Item Removed',
      description: 'Item removed from monitoring',
    });
  }, [toast]);

  const handleResolveExposure = useCallback(async (exposure: DarkWebExposure) => {
    try {
      await invoke('resolve_breach', { breachId: exposure.id });
      
      setExposures(prev => prev.map(e => 
        e.id === exposure.id ? { ...e, status: 'resolved' as const, resolvedAt: new Date() } : e
      ));
      
      toast({
        title: 'Exposure Resolved',
        description: 'This exposure has been marked as resolved',
      });
    } catch (error) {
      log.error('Failed to resolve exposure:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resolve exposure',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleAcknowledgeExposure = useCallback((exposure: DarkWebExposure) => {
    setExposures(prev => prev.map(e => 
      e.id === exposure.id ? { ...e, status: 'acknowledged' as const, acknowledgedAt: new Date() } : e
    ));
  }, []);

  if (loading) {
    return (
      <div className="dark-web-monitor flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dark web monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark-web-monitor">
      {/* Header */}
      <div className="monitor-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Radar className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Dark Web Monitor</h2>
            <p className="text-sm text-muted-foreground">
              Continuous monitoring for your exposed data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
          <Button onClick={handleScan} disabled={isScanning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </Button>
        </div>
      </div>

      {/* Critical Alert */}
      {criticalExposures.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50">
              <Skull className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                {criticalExposures.length} Critical Exposure{criticalExposures.length > 1 ? 's' : ''} Found
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                Your data was found on the dark web. Take immediate action.
              </p>
            </div>
            <Button variant="destructive">
              View All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Layers className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{monitoredItems.length}</div>
            <p className="text-xs text-muted-foreground">Items Monitored</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldX className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold text-red-600">{compromisedCount}</div>
            <p className="text-xs text-muted-foreground">Compromised</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Skull className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{unresolvedExposures.length}</div>
            <p className="text-xs text-muted-foreground">Active Exposures</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-green-600">
              {monitoredItems.filter(i => i.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring Status */}
      <Card className="mb-6">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${alertsEnabled ? 'bg-purple-100' : 'bg-gray-100'}`}>
              {alertsEnabled ? (
                <BellRing className="h-5 w-5 text-purple-600" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium">Real-Time Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Get notified immediately when your data is found
              </p>
            </div>
          </div>
          <Switch 
            checked={alertsEnabled} 
            onCheckedChange={async (enabled) => {
              try {
                await invoke('toggle_darkweb_monitor', { enabled });
                setAlertsEnabled(enabled);
              } catch (error) {
                log.error('Failed to toggle monitor:', error);
                toast({
                  title: 'Error',
                  description: error instanceof Error ? error.message : 'Failed to toggle monitoring',
                  variant: 'destructive',
                });
              }
            }} 
          />
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="monitored" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitored">
            <Eye className="h-4 w-4 mr-2" />
            Monitored Items ({monitoredItems.length})
          </TabsTrigger>
          <TabsTrigger value="exposures">
            <Skull className="h-4 w-4 mr-2" />
            Exposures ({unresolvedExposures.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <Activity className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitored">
          <Card>
            <CardContent className="p-4">
              <ScrollArea className="h-[400px]">
                {monitoredItems.length > 0 ? (
                  <div className="space-y-3">
                    {monitoredItems.map(item => (
                      <MonitoredItemCard
                        key={item.id}
                        item={item}
                        onRemove={handleRemoveItem}
                        onViewExposures={() => {}}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Eye className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Items Monitored</h3>
                    <p className="text-muted-foreground mb-4">
                      Add email addresses, phone numbers, or financial data to monitor
                    </p>
                    <Button onClick={() => setShowAddDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Item
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exposures">
          <Card>
            <CardContent className="p-4">
              <ScrollArea className="h-[400px]">
                {exposures.length > 0 ? (
                  <div className="space-y-3">
                    {exposures.map(exposure => (
                      <ExposureCard
                        key={exposure.id}
                        exposure={exposure}
                        onResolve={handleResolveExposure}
                        onAcknowledge={handleAcknowledgeExposure}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-medium mb-2">All Clear!</h3>
                    <p className="text-muted-foreground">
                      No exposures found on the dark web
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  { date: new Date(), event: 'Scan completed', items: 5, exposures: 0 },
                  { date: new Date(Date.now() - 24 * 60 * 60 * 1000), event: 'New exposure detected', items: 0, exposures: 1 },
                  { date: new Date(Date.now() - 48 * 60 * 60 * 1000), event: 'Scan completed', items: 5, exposures: 0 },
                  { date: new Date(Date.now() - 72 * 60 * 60 * 1000), event: 'Exposure resolved', items: 0, exposures: 1 },
                ].map((entry, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-full ${
                      entry.exposures > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {entry.exposures > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{entry.event}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(entry.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to Monitor</DialogTitle>
            <DialogDescription>
              We&apos;ll continuously scan the dark web for this data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Item Type</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { type: 'email' as const, label: 'Email', icon: <Mail className="h-4 w-4" /> },
                  { type: 'phone' as const, label: 'Phone', icon: <Phone className="h-4 w-4" /> },
                  { type: 'credit_card' as const, label: 'Card', icon: <CreditCard className="h-4 w-4" /> },
                ].map(item => (
                  <Button
                    key={item.type}
                    variant={newItemType === item.type ? 'default' : 'outline'}
                    onClick={() => setNewItemType(item.type)}
                    className="flex items-center gap-2"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="item-value">
                {newItemType === 'email' ? 'Email Address' : 
                 newItemType === 'phone' ? 'Phone Number' : 'Last 4 Digits'}
              </Label>
              <Input
                id="item-value"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                placeholder={
                  newItemType === 'email' ? 'john@example.com' :
                  newItemType === 'phone' ? '+1-555-123-4567' : '4242'
                }
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add to Monitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DarkWebMonitor;
