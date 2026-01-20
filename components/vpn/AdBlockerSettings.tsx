"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label as _Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/services/logger-service';
import {
  Shield,
  ShieldOff,
  ShieldCheck,
  Ban,
  Eye as _Eye,
  EyeOff as _EyeOff,
  Globe,
  Trash2,
  Plus,
  Settings as _Settings,
  BarChart3,
  TrendingUp as _TrendingUp,
  Activity as _Activity,
  Clock,
  CheckCircle,
  XCircle as _XCircle,
  AlertTriangle as _AlertTriangle,
  Info as _Info,
  Zap,
  MonitorSmartphone,
  Tv as _Tv,
  Video,
  ShoppingCart as _ShoppingCart,
  MessageSquare,
  Users,
  Target,
  Cookie,
  Fingerprint,
  RefreshCw as _RefreshCw,
  Download,
  Loader2,
} from 'lucide-react';
import './AdBlockerSettings.css';

const log = logger.scope('AdBlockerSettings');

// ============================================================================
// TYPES (matching backend)
// ============================================================================

interface BlockCategory {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  blockedCount: number;
}

interface WhitelistEntry {
  id: string;
  domain: string;
  addedAt: number;
  reason?: string;
}

interface BlockingStats {
  totalBlocked: number;
  adsBlocked: number;
  trackersBlocked: number;
  cookieNoticesBlocked: number;
  socialWidgetsBlocked: number;
  dataSaved: number;
  timesSaved: number;
}

interface AdBlockerConfig {
  enabled: boolean;
  categories: BlockCategory[];
  whitelist: WhitelistEntry[];
  stats: BlockingStats;
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const getCategoryIcon = (id: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    'ads': <Ban className="h-5 w-5" />,
    'trackers': <Target className="h-5 w-5" />,
    'cookies': <Cookie className="h-5 w-5" />,
    'social': <Users className="h-5 w-5" />,
    'fingerprinting': <Fingerprint className="h-5 w-5" />,
    'popups': <MonitorSmartphone className="h-5 w-5" />,
    'video': <Video className="h-5 w-5" />,
    'newsletter': <MessageSquare className="h-5 w-5" />,
  };
  return icons[id] || <Shield className="h-5 w-5" />;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CategoryToggleProps {
  category: BlockCategory;
  onToggle: (id: string, enabled: boolean) => void;
}

function CategoryToggle({ category, onToggle }: CategoryToggleProps) {
  return (
    <div className={`category-toggle ${category.enabled ? 'enabled' : 'disabled'}`}>
      <div className="category-icon">
        {getCategoryIcon(category.id)}
      </div>
      <div className="category-info">
        <div className="flex items-center gap-2">
          <span className="font-medium">{category.name}</span>
          <Badge variant="secondary" className="text-xs">
            {formatNumber(category.blockedCount)} blocked
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{category.description}</p>
      </div>
      <Switch
        checked={category.enabled}
        onCheckedChange={(checked) => onToggle(category.id, checked)}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subvalue?: string;
  color: string;
}

function StatCard({ icon, label, value, subvalue, color }: StatCardProps) {
  return (
    <div className="stat-card" style={{ '--stat-color': color } as React.CSSProperties}>
      <div className="stat-icon">
        {icon}
      </div>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {subvalue && <span className="stat-subvalue">{subvalue}</span>}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface AdBlockerSettingsProps {
  onClose?: () => void;
}

export function AdBlockerSettings({ onClose: _onClose }: AdBlockerSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [categories, setCategories] = useState<BlockCategory[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [stats, setStats] = useState<BlockingStats>({
    totalBlocked: 0,
    adsBlocked: 0,
    trackersBlocked: 0,
    cookieNoticesBlocked: 0,
    socialWidgetsBlocked: 0,
    dataSaved: 0,
    timesSaved: 0,
  });
  const [newDomain, setNewDomain] = useState('');
  const [activeTab, setActiveTab] = useState('categories');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load config from backend
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const config = await invoke<AdBlockerConfig>('get_adblocker_config');
        setIsEnabled(config.enabled);
        setCategories(config.categories);
        setWhitelist(config.whitelist);
        setStats(config.stats);
      } catch (error) {
        log.error('Failed to load ad blocker config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load ad blocker configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [toast]);

  // Toggle master switch
  const handleMasterToggle = useCallback(async (enabled: boolean) => {
    try {
      await invoke('toggle_adblocker', { enabled });
      setIsEnabled(enabled);
    } catch (error) {
      log.error('Failed to toggle ad blocker:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle ad blocker',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Toggle category
  const handleCategoryToggle = useCallback(async (id: string, enabled: boolean) => {
    try {
      const updated = await invoke<BlockCategory>('toggle_adblocker_category', { 
        categoryId: id, 
        enabled 
      });
      setCategories(prev => prev.map(cat => 
        cat.id === id ? { ...cat, enabled: updated.enabled } : cat
      ));
    } catch (error) {
      log.error('Failed to toggle category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Add whitelist domain
  const handleAddWhitelist = useCallback(async () => {
    if (!newDomain.trim()) {
      toast({
        title: 'Enter Domain',
        description: 'Please enter a domain to whitelist',
        variant: 'destructive',
      });
      return;
    }

    const domain = newDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    
    if (whitelist.some(w => w.domain === domain)) {
      toast({
        title: 'Already Whitelisted',
        description: 'This domain is already in your whitelist',
        variant: 'destructive',
      });
      return;
    }

    try {
      const entry = await invoke<WhitelistEntry>('add_whitelist_domain', { 
        domain, 
        reason: null 
      });
      setWhitelist(prev => [...prev, entry]);
      setNewDomain('');
      toast({
        title: 'Domain Whitelisted',
        description: `${domain} will no longer be blocked`,
      });
    } catch (error) {
      log.error('Failed to add whitelist domain:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add domain',
        variant: 'destructive',
      });
    }
  }, [newDomain, whitelist, toast]);

  // Remove whitelist domain
  const handleRemoveWhitelist = useCallback(async (id: string) => {
    try {
      await invoke('remove_whitelist_domain', { id });
      setWhitelist(prev => prev.filter(w => w.id !== id));
      toast({
        title: 'Domain Removed',
        description: 'Domain removed from whitelist',
      });
    } catch (error) {
      log.error('Failed to remove whitelist domain:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove domain',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const enabledCategories = categories.filter(c => c.enabled).length;

  if (loading) {
    return (
      <div className="adblocker-settings flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="adblocker-settings">
      {/* Master Toggle */}
      <Card className={`master-toggle ${isEnabled ? 'enabled' : 'disabled'}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`toggle-icon ${isEnabled ? 'active' : ''}`}>
              {isEnabled ? <ShieldCheck className="h-8 w-8" /> : <ShieldOff className="h-8 w-8" />}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {isEnabled ? 'Ad Blocker Active' : 'Ad Blocker Disabled'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isEnabled 
                  ? `${enabledCategories} protection categories enabled`
                  : 'Enable to block ads, trackers, and more'
                }
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleMasterToggle}
              className="scale-125"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={<Ban className="h-5 w-5" />}
          label="Total Blocked"
          value={formatNumber(stats.totalBlocked)}
          subvalue="All time"
          color="#ef4444"
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Trackers Stopped"
          value={formatNumber(stats.trackersBlocked)}
          subvalue="Privacy protected"
          color="#8b5cf6"
        />
        <StatCard
          icon={<Download className="h-5 w-5" />}
          label="Data Saved"
          value={formatBytes(stats.dataSaved)}
          subvalue="Bandwidth"
          color="#22c55e"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Time Saved"
          value={formatTime(stats.timesSaved)}
          subvalue="Faster browsing"
          color="#3b82f6"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="categories">
            <Shield className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="whitelist">
            <CheckCircle className="h-4 w-4 mr-2" />
            Whitelist ({whitelist.length})
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Blocking Categories</CardTitle>
              <CardDescription>
                Choose what types of content to block
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="categories-list">
                {categories.map(category => (
                  <CategoryToggle
                    key={category.id}
                    category={category}
                    onToggle={handleCategoryToggle}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelist">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Whitelisted Domains</CardTitle>
              <CardDescription>
                These sites won&apos;t have any content blocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="add-whitelist">
                <Input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="Enter domain (e.g., example.com)"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWhitelist()}
                />
                <Button onClick={handleAddWhitelist}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <ScrollArea className="h-[300px] mt-4">
                <div className="whitelist-entries">
                  {whitelist.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No whitelisted domains</p>
                    </div>
                  ) : (
                    whitelist.map(entry => (
                      <div key={entry.id} className="whitelist-entry">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <span className="font-medium">{entry.domain}</span>
                          {entry.reason && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({entry.reason})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.addedAt * 1000).toLocaleDateString()}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveWhitelist(entry.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Blocking Statistics</CardTitle>
              <CardDescription>
                Detailed breakdown of blocked content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="stats-breakdown">
                <div className="stat-row">
                  <div className="stat-label-row">
                    <Ban className="h-4 w-4 text-red-500" />
                    <span>Advertisements</span>
                  </div>
                  <span className="stat-number">{formatNumber(stats.adsBlocked)}</span>
                </div>
                <div className="stat-row">
                  <div className="stat-label-row">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span>Trackers</span>
                  </div>
                  <span className="stat-number">{formatNumber(stats.trackersBlocked)}</span>
                </div>
                <div className="stat-row">
                  <div className="stat-label-row">
                    <Cookie className="h-4 w-4 text-orange-500" />
                    <span>Cookie Notices</span>
                  </div>
                  <span className="stat-number">{formatNumber(stats.cookieNoticesBlocked)}</span>
                </div>
                <div className="stat-row">
                  <div className="stat-label-row">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Social Widgets</span>
                  </div>
                  <span className="stat-number">{formatNumber(stats.socialWidgetsBlocked)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Performance Impact</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  By blocking unwanted content, your pages load on average <strong>35% faster</strong> 
                  and you&apos;ve saved <strong>{formatBytes(stats.dataSaved)}</strong> of bandwidth.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdBlockerSettings;