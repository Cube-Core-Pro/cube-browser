"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Shield as _Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  ShieldX as _ShieldX,
  AlertTriangle,
  Ban,
  Eye,
  EyeOff as _EyeOff,
  Bug,
  Fingerprint,
  Globe,
  Clock,
  Search,
  RefreshCw as _RefreshCw,
  Settings,
  Plus,
  Minus as _Minus,
  X as _X,
  Check,
  ChevronRight as _ChevronRight,
  ChevronDown as _ChevronDown,
  Download as _Download,
  Upload as _Upload,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as _PieChart,
  Filter as _Filter,
  Trash2,
  FileWarning as _FileWarning,
  Link2 as _Link2,
  Unlink2 as _Unlink2,
  Wifi as _Wifi,
  WifiOff as _WifiOff,
  Radio,
  Zap as _Zap,
  Loader2,
} from 'lucide-react';
import {
  ThreatProtection as _ThreatProtection,
  ThreatEvent,
  ThreatType,
  ThreatSeverity,
  ThreatStats,
  DNSFilteringCategory,
} from '@/types/vpn-elite';
import { logger } from '@/lib/services/logger-service';
import './ThreatProtectionDashboard.css';

const log = logger.scope('ThreatProtectionDashboard');

// ============================================================================
// TYPES FROM BACKEND
// ============================================================================

interface BackendThreatEvent {
  id: string;
  threatType: string;
  severity: string;
  domain: string;
  url: string;
  timestamp: number;
  blockedAt: number;
  source: string;
  action: string;
  actionTaken: string;
  category: string;
  description: string;
}

interface BackendThreatStats {
  malwareBlocked: number;
  trackersBlocked: number;
  adsBlocked: number;
  phishingBlocked: number;
  cryptoMinersBlocked: number;
  totalThreatsBlocked: number;
  lastUpdated: number;
  periodStart: number;
  periodEnd: number;
}

interface BackendDNSCategory {
  id: string;
  label: string;
  description: string;
  blocked: boolean;
}

interface BackendThreatConfig {
  enabled: boolean;
  events: BackendThreatEvent[];
  stats: BackendThreatStats;
  dnsCategories: BackendDNSCategory[];
  whitelist: string[];
}

// Helper to convert backend event to frontend type
const toThreatEvent = (e: BackendThreatEvent): ThreatEvent => ({
  id: e.id,
  type: e.threatType as ThreatType,
  severity: e.severity as ThreatSeverity,
  domain: e.domain,
  url: e.url,
  timestamp: new Date(e.timestamp * 1000),
  blockedAt: new Date(e.blockedAt * 1000),
  source: e.source,
  action: e.action as 'blocked' | 'warned' | 'allowed',
  actionTaken: e.actionTaken,
  category: e.category,
  description: e.description,
});

const toThreatStats = (s: BackendThreatStats): ThreatStats => ({
  malwareBlocked: s.malwareBlocked,
  trackersBlocked: s.trackersBlocked,
  adsBlocked: s.adsBlocked,
  phishingBlocked: s.phishingBlocked,
  cryptoMinersBlocked: s.cryptoMinersBlocked,
  totalThreatsBlocked: s.totalThreatsBlocked,
  lastUpdated: new Date(s.lastUpdated * 1000),
  periodStart: new Date(s.periodStart * 1000),
  periodEnd: new Date(s.periodEnd * 1000),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getThreatIcon = (type: ThreatType) => {
  switch (type) {
    case 'malware': return Bug;
    case 'tracker': return Eye;
    case 'ad': return Ban;
    case 'phishing': return Fingerprint;
    case 'crypto_miner': return Radio;
    default: return ShieldAlert;
  }
};

const getThreatColor = (type: ThreatType): string => {
  switch (type) {
    case 'malware': return 'red';
    case 'tracker': return 'orange';
    case 'ad': return 'blue';
    case 'phishing': return 'purple';
    case 'crypto_miner': return 'pink';
    default: return 'gray';
  }
};

const getSeverityColor = (severity: ThreatSeverity): string => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-100 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
    default: return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ThreatEventCardProps {
  event: ThreatEvent;
  onWhitelist: (event: ThreatEvent) => void;
}

function ThreatEventCard({ event, onWhitelist }: ThreatEventCardProps) {
  const ThreatIcon = getThreatIcon(event.type);
  const color = getThreatColor(event.type);
  
  return (
    <Card className={`threat-event-card severity-${event.severity}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`threat-icon threat-icon-${color}`}>
            <ThreatIcon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium capitalize">{event.type.replace('_', ' ')}</span>
              <Badge variant="outline" className={getSeverityColor(event.severity)}>
                {event.severity}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {event.blockedAt ? formatTimeAgo(event.blockedAt) : 'Unknown'}
              </span>
            </div>
            
            <p className="text-sm font-mono text-muted-foreground truncate">
              {event.domain}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Blocked
              </Badge>
              <Badge variant="outline" className="text-xs">
                {event.source}
              </Badge>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onWhitelist(event)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  trend?: number;
}

function StatCard({ icon: Icon, label, value, color, trend }: StatCardProps) {
  return (
    <Card className="stat-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`stat-icon stat-icon-${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface ThreatProtectionDashboardProps {
  onClose?: () => void;
}

export function ThreatProtectionDashboard({ onClose: _onClose }: ThreatProtectionDashboardProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [stats, setStats] = useState<ThreatStats>({
    malwareBlocked: 0,
    trackersBlocked: 0,
    adsBlocked: 0,
    phishingBlocked: 0,
    cryptoMinersBlocked: 0,
    totalThreatsBlocked: 0,
    lastUpdated: new Date(),
    periodStart: new Date(),
    periodEnd: new Date(),
  });
  const [categories, setCategories] = useState<{ id: DNSFilteringCategory; label: string; description: string; blocked: boolean }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ThreatType | 'all'>('all');
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newWhitelistDomain, setNewWhitelistDomain] = useState('');
  const [showAddWhitelist, setShowAddWhitelist] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await invoke<BackendThreatConfig>('get_threat_protection_config');
        setIsEnabled(config.enabled);
        setEvents(config.events.map(toThreatEvent));
        setStats(toThreatStats(config.stats));
        setCategories(config.dnsCategories.map(c => ({
          id: c.id as DNSFilteringCategory,
          label: c.label,
          description: c.description,
          blocked: c.blocked,
        })));
        setWhitelist(config.whitelist);
      } catch (error) {
        log.error('Failed to load Threat Protection config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load Threat Protection configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [toast]);

  const handleToggleProtection = useCallback(async (enabled: boolean) => {
    try {
      await invoke('toggle_threat_protection', { enabled });
      setIsEnabled(enabled);
      toast({
        title: enabled ? 'Protection Enabled' : 'Protection Disabled',
        description: enabled ? 'Threat Protection is now active' : 'Threat Protection has been disabled',
      });
    } catch (error) {
      log.error('Failed to toggle protection:', error);
    }
  }, [toast]);

  const handleToggleCategory = useCallback(async (categoryId: DNSFilteringCategory) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    try {
      await invoke('toggle_dns_category', { 
        categoryId, 
        blocked: !category.blocked 
      });
      setCategories(prev => prev.map(cat =>
        cat.id === categoryId ? { ...cat, blocked: !cat.blocked } : cat
      ));
      toast({
        title: 'Category Updated',
        description: `DNS filtering category has been updated.`,
      });
    } catch (error) {
      log.error('Failed to toggle category:', error);
    }
  }, [categories, toast]);

  const handleWhitelist = useCallback((event: ThreatEvent) => {
    setWhitelist(prev => [...prev, event.domain]);
    toast({
      title: 'Domain Whitelisted',
      description: `${event.domain} has been added to whitelist.`,
    });
  }, [toast]);

  const handleRemoveFromWhitelist = useCallback((domain: string) => {
    setWhitelist(prev => prev.filter(d => d !== domain));
    toast({
      title: 'Domain Removed',
      description: `${domain} has been removed from whitelist.`,
    });
  }, [toast]);

  const handleAddToWhitelist = useCallback(() => {
    if (newWhitelistDomain.trim()) {
      setWhitelist(prev => [...prev, newWhitelistDomain.trim()]);
      setNewWhitelistDomain('');
      setShowAddWhitelist(false);
      toast({
        title: 'Domain Added',
        description: `${newWhitelistDomain} has been whitelisted.`,
      });
    }
  }, [newWhitelistDomain, toast]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || event.type === filterType;
    return matchesSearch && matchesType;
  });

  const threatTypeStats = [
    { type: 'malware' as ThreatType, count: stats.malwareBlocked },
    { type: 'tracker' as ThreatType, count: stats.trackersBlocked },
    { type: 'ad' as ThreatType, count: stats.adsBlocked },
    { type: 'phishing' as ThreatType, count: stats.phishingBlocked },
    { type: 'crypto_miner' as ThreatType, count: stats.cryptoMinersBlocked },
  ];

  if (loading) {
    return (
      <div className="threat-protection-dashboard flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="threat-protection-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="flex items-center gap-3">
          <div className={`header-icon ${isEnabled ? 'enabled' : 'disabled'}`}>
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Threat Protection</h2>
            <p className="text-sm text-muted-foreground">
              Block malware, trackers, ads, and malicious websites
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="protection-toggle" className="text-sm font-medium">
              {isEnabled ? 'Protection Active' : 'Protection Disabled'}
            </Label>
            <Switch
              id="protection-toggle"
              checked={isEnabled}
              onCheckedChange={handleToggleProtection}
            />
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Protection Status Banner */}
      {!isEnabled && (
        <Card className="border-yellow-200 bg-yellow-50 mb-6">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">Protection Disabled</p>
              <p className="text-sm text-yellow-700">
                Your browsing is not protected from threats
              </p>
            </div>
            <Button onClick={() => setIsEnabled(true)}>
              Enable Protection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard icon={ShieldAlert} label="Total Blocked" value={stats.totalThreatsBlocked} color="blue" trend={12} />
        <StatCard icon={Bug} label="Malware" value={stats.malwareBlocked} color="red" />
        <StatCard icon={Eye} label="Trackers" value={stats.trackersBlocked} color="orange" />
        <StatCard icon={Ban} label="Ads" value={stats.adsBlocked} color="blue" />
        <StatCard icon={Fingerprint} label="Phishing" value={stats.phishingBlocked} color="purple" />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="dns">
            <Globe className="h-4 w-4 mr-2" />
            DNS Filtering
          </TabsTrigger>
          <TabsTrigger value="whitelist">
            <Check className="h-4 w-4 mr-2" />
            Whitelist
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Blocked Threats</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search domains..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as ThreatType | 'all')}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="malware">Malware</option>
                    <option value="tracker">Trackers</option>
                    <option value="ad">Ads</option>
                    <option value="phishing">Phishing</option>
                    <option value="crypto_miner">Crypto Miners</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredEvents.map(event => (
                    <ThreatEventCard
                      key={event.id}
                      event={event}
                      onWhitelist={handleWhitelist}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dns">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">DNS Filtering Categories</CardTitle>
              <CardDescription>
                Choose which types of content to block at the DNS level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className={`dns-category-card ${category.blocked ? 'blocked' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`category-icon ${category.blocked ? 'active' : ''}`}>
                        {category.blocked ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : (
                          <ShieldOff className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{category.label}</p>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <Switch
                        checked={category.blocked}
                        onCheckedChange={() => handleToggleCategory(category.id)}
                        disabled={!isEnabled}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelist">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Whitelisted Domains</CardTitle>
                  <CardDescription>
                    These domains will bypass threat protection
                  </CardDescription>
                </div>
                <Dialog open={showAddWhitelist} onOpenChange={setShowAddWhitelist}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Domain
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Domain to Whitelist</DialogTitle>
                      <DialogDescription>
                        This domain will bypass all threat protection checks.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="domain">Domain</Label>
                      <Input
                        id="domain"
                        placeholder="example.com"
                        value={newWhitelistDomain}
                        onChange={(e) => setNewWhitelistDomain(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddWhitelist(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddToWhitelist}>
                        Add to Whitelist
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {whitelist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No whitelisted domains</p>
                  <p className="text-sm">Domains you trust will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {whitelist.map(domain => (
                    <div key={domain} className="whitelist-item">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 font-mono text-sm">{domain}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveFromWhitelist(domain)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Threats by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {threatTypeStats.map(stat => {
                    const Icon = getThreatIcon(stat.type);
                    const percentage = (stat.count / stats.totalThreatsBlocked) * 100;
                    return (
                      <div key={stat.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="capitalize">{stat.type.replace('_', ' ')}</span>
                          </div>
                          <span className="font-medium">{stat.count.toLocaleString()}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Protection Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-700">
                          {stats.totalThreatsBlocked.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600">Total threats blocked this month</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-lg font-bold">{categories.filter(c => c.blocked).length}</p>
                      <p className="text-xs text-muted-foreground">Active filters</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-lg font-bold">{whitelist.length}</p>
                      <p className="text-xs text-muted-foreground">Whitelisted</p>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Last updated: {stats.lastUpdated.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ThreatProtectionDashboard;
