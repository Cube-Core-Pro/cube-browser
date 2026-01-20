"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  SplitSquareHorizontal,
  AppWindow,
  Globe,
  Network,
  Shield,
  ShieldOff,
  Plus,
  Minus as _Minus,
  X,
  Check as _Check,
  Search,
  RefreshCw,
  Settings,
  ChevronRight as _ChevronRight,
  AlertCircle as _AlertCircle,
  Info,
  HelpCircle as _HelpCircle,
  Laptop as _Laptop,
  Chrome,
  Mail as _Mail,
  MessageCircle,
  Video,
  Music,
  FileText as _FileText,
  Cloud,
  Database as _Database,
  Terminal,
  Code,
  Gamepad2,
  Camera as _Camera,
  Download,
  Upload as _Upload,
  MonitorPlay,
  Loader2,
} from 'lucide-react';
import { logger } from '@/lib/services/logger-service';
import { SplitTunneling as _SplitTunneling, SplitTunnelingMode, SplitTunnelingApp } from '@/types/vpn-elite';
import './SplitTunnelingConfig.css';

const log = logger.scope('SplitTunnelingConfig');

// ============================================================================
// TYPES (matching backend)
// ============================================================================

interface SplitTunnelingConfig {
  enabled: boolean;
  mode: string;
  apps: SplitTunnelingApp[];
  websites: string[];
  ipRanges: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getAppIcon = (iconName: string) => {
  switch (iconName) {
    case 'chrome': return Chrome;
    case 'safari': return Globe;
    case 'firefox': return Globe;
    case 'slack': return MessageCircle;
    case 'teams': return Video;
    case 'zoom': return Video;
    case 'spotify': return Music;
    case 'netflix': return MonitorPlay;
    case 'steam': return Gamepad2;
    case 'discord': return MessageCircle;
    case 'vscode': return Code;
    case 'terminal': return Terminal;
    case 'dropbox': return Cloud;
    case 'onedrive': return Cloud;
    case 'transmission': return Download;
    default: return AppWindow;
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AppCardProps {
  app: SplitTunnelingApp;
  mode: SplitTunnelingMode;
  onToggle: (app: SplitTunnelingApp) => void;
}

function AppCard({ app, mode, onToggle }: AppCardProps) {
  const AppIcon = getAppIcon(app.icon || 'default');
  const isVPNProtected = mode === 'exclude' ? app.isIncluded : !app.isIncluded;
  
  return (
    <Card className={`app-card ${isVPNProtected ? 'protected' : 'bypassed'}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`app-icon-wrapper ${isVPNProtected ? 'protected' : 'bypassed'}`}>
            <AppIcon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{app.name}</span>
              {app.isSystem && (
                <Badge variant="outline" className="text-xs">System</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground capitalize">{app.category}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isVPNProtected ? 'default' : 'secondary'} className="text-xs">
              {isVPNProtected ? (
                <>
                  <Shield className="h-3 w-3 mr-1" />
                  VPN
                </>
              ) : (
                <>
                  <ShieldOff className="h-3 w-3 mr-1" />
                  Direct
                </>
              )}
            </Badge>
            <Switch
              checked={app.isIncluded}
              onCheckedChange={() => onToggle(app)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface SplitTunnelingConfigProps {
  onClose?: () => void;
}

export function SplitTunnelingConfigComponent({ onClose: _onClose }: SplitTunnelingConfigProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [mode, setMode] = useState<SplitTunnelingMode>('exclude');
  const [apps, setApps] = useState<SplitTunnelingApp[]>([]);
  const [websites, setWebsites] = useState<string[]>([]);
  const [ipRanges, setIPRanges] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [showAddIP, setShowAddIP] = useState(false);
  const [newWebsite, setNewWebsite] = useState('');
  const [newIPRange, setNewIPRange] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load config from backend
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const config = await invoke<SplitTunnelingConfig>('get_split_tunneling_config');
        setIsEnabled(config.enabled);
        setMode(config.mode as SplitTunnelingMode);
        setApps(config.apps);
        setWebsites(config.websites);
        setIPRanges(config.ipRanges);
      } catch (error) {
        log.error('Failed to load split tunneling config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load split tunneling configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [toast]);

  // Toggle enabled state
  const handleToggleEnabled = useCallback(async (enabled: boolean) => {
    try {
      await invoke('toggle_split_tunneling', { enabled });
      setIsEnabled(enabled);
    } catch (error) {
      log.error('Failed to toggle split tunneling:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle split tunneling',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Change mode
  const handleModeChange = useCallback(async (newMode: SplitTunnelingMode) => {
    try {
      await invoke('set_split_tunneling_mode', { mode: newMode });
      setMode(newMode);
    } catch (error) {
      log.error('Failed to set mode:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mode',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Toggle app
  const handleToggleApp = useCallback(async (app: SplitTunnelingApp) => {
    try {
      const updated = await invoke<SplitTunnelingApp>('toggle_split_tunneling_app', { 
        appId: app.id, 
        isIncluded: !app.isIncluded 
      });
      setApps(prev => prev.map(a => 
        a.id === app.id ? { ...a, isIncluded: updated.isIncluded } : a
      ));
    } catch (error) {
      log.error('Failed to toggle app:', error);
      toast({
        title: 'Error',
        description: 'Failed to update app setting',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Add website
  const handleAddWebsite = useCallback(async () => {
    if (newWebsite.trim()) {
      try {
        await invoke('add_split_tunneling_website', { website: newWebsite.trim() });
        setWebsites(prev => [...prev, newWebsite.trim()]);
        setNewWebsite('');
        setShowAddWebsite(false);
        toast({
          title: 'Website Added',
          description: `${newWebsite} will ${mode === 'exclude' ? 'bypass' : 'use'} the VPN`,
        });
      } catch (error) {
        log.error('Failed to add website:', error);
        toast({
          title: 'Error',
          description: 'Failed to add website',
          variant: 'destructive',
        });
      }
    }
  }, [newWebsite, mode, toast]);

  // Remove website
  const handleRemoveWebsite = useCallback(async (website: string) => {
    try {
      await invoke('remove_split_tunneling_website', { website });
      setWebsites(prev => prev.filter(w => w !== website));
      toast({
        title: 'Website Removed',
        description: `${website} removed from split tunneling`,
      });
    } catch (error) {
      log.error('Failed to remove website:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove website',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Add IP range
  const handleAddIPRange = useCallback(async () => {
    if (newIPRange.trim()) {
      try {
        await invoke('add_split_tunneling_ip_range', { ipRange: newIPRange.trim() });
        setIPRanges(prev => [...prev, newIPRange.trim()]);
        setNewIPRange('');
        setShowAddIP(false);
        toast({
          title: 'IP Range Added',
          description: `${newIPRange} will ${mode === 'exclude' ? 'bypass' : 'use'} the VPN`,
        });
      } catch (error) {
        log.error('Failed to add IP range:', error);
        toast({
          title: 'Error',
          description: 'Failed to add IP range',
          variant: 'destructive',
        });
      }
    }
  }, [newIPRange, mode, toast]);

  // Remove IP range
  const handleRemoveIPRange = useCallback(async (ip: string) => {
    try {
      await invoke('remove_split_tunneling_ip_range', { ipRange: ip });
      setIPRanges(prev => prev.filter(i => i !== ip));
      toast({
        title: 'IP Range Removed',
        description: `${ip} removed from split tunneling`,
      });
    } catch (error) {
      log.error('Failed to remove IP range:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove IP range',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(apps.map(a => a.category))];
  const includedApps = apps.filter(a => a.isIncluded);
  const excludedApps = apps.filter(a => !a.isIncluded);

  if (loading) {
    return (
      <div className="split-tunneling-config flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="split-tunneling-config">
      {/* Header */}
      <div className="config-header">
        <div className="flex items-center gap-3">
          <div className={`header-icon ${isEnabled ? 'enabled' : 'disabled'}`}>
            <SplitSquareHorizontal className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Split Tunneling</h2>
            <p className="text-sm text-muted-foreground">
              Choose which apps and websites use the VPN
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="split-toggle" className="text-sm font-medium">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Label>
            <Switch
              id="split-toggle"
              checked={isEnabled}
              onCheckedChange={handleToggleEnabled}
            />
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Tunneling Mode</CardTitle>
          <CardDescription>
            Choose how split tunneling should work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={mode} onValueChange={(v) => handleModeChange(v as SplitTunnelingMode)}>
            <div className={`mode-option ${mode === 'exclude' ? 'selected' : ''}`}>
              <RadioGroupItem value="exclude" id="exclude" />
              <div className="flex-1">
                <Label htmlFor="exclude" className="font-medium cursor-pointer">
                  Exclude Selected Apps
                </Label>
                <p className="text-sm text-muted-foreground">
                  All traffic uses VPN except selected apps
                </p>
              </div>
              <Badge variant={mode === 'exclude' ? 'default' : 'outline'}>
                <ShieldOff className="h-3 w-3 mr-1" />
                {excludedApps.length} bypassed
              </Badge>
            </div>
            
            <div className={`mode-option ${mode === 'include' ? 'selected' : ''}`}>
              <RadioGroupItem value="include" id="include" />
              <div className="flex-1">
                <Label htmlFor="include" className="font-medium cursor-pointer">
                  Include Only Selected Apps
                </Label>
                <p className="text-sm text-muted-foreground">
                  Only selected apps use VPN, rest goes direct
                </p>
              </div>
              <Badge variant={mode === 'include' ? 'default' : 'outline'}>
                <Shield className="h-3 w-3 mr-1" />
                {includedApps.length} protected
              </Badge>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              {mode === 'exclude' ? (
                <>Apps marked as <strong>excluded</strong> will bypass the VPN and connect directly to the internet.</>
              ) : (
                <>Only apps marked as <strong>included</strong> will use the VPN. All other traffic goes direct.</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="apps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="apps">
            <AppWindow className="h-4 w-4 mr-2" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="websites">
            <Globe className="h-4 w-4 mr-2" />
            Websites
          </TabsTrigger>
          <TabsTrigger value="ip">
            <Network className="h-4 w-4 mr-2" />
            IP Addresses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apps">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search apps..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat ?? 'unknown'} value={cat ?? ''}>
                        {cat === 'all' ? 'All Categories' : cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredApps.map(app => (
                    <AppCard
                      key={app.id}
                      app={app}
                      mode={mode}
                      onToggle={handleToggleApp}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="websites">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Website Rules</CardTitle>
                  <CardDescription>
                    {mode === 'exclude' 
                      ? 'These websites will bypass the VPN' 
                      : 'Only these websites will use the VPN'}
                  </CardDescription>
                </div>
                <Dialog open={showAddWebsite} onOpenChange={setShowAddWebsite}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Website
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Website</DialogTitle>
                      <DialogDescription>
                        Enter a domain to {mode === 'exclude' ? 'bypass' : 'route through'} the VPN
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="website">Domain</Label>
                      <Input
                        id="website"
                        placeholder="example.com"
                        value={newWebsite}
                        onChange={(e) => setNewWebsite(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddWebsite(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddWebsite}>
                        Add Website
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {websites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No website rules configured</p>
                  <p className="text-sm">Add websites to customize their VPN behavior</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {websites.map(website => (
                    <div key={website} className="website-item">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 font-mono text-sm">{website}</span>
                      <Badge variant={mode === 'exclude' ? 'secondary' : 'default'} className="text-xs">
                        {mode === 'exclude' ? (
                          <>
                            <ShieldOff className="h-3 w-3 mr-1" />
                            Bypassed
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            VPN
                          </>
                        )}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveWebsite(website)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ip">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">IP Address Rules</CardTitle>
                  <CardDescription>
                    {mode === 'exclude' 
                      ? 'Traffic to these IPs will bypass the VPN' 
                      : 'Only traffic to these IPs will use the VPN'}
                  </CardDescription>
                </div>
                <Dialog open={showAddIP} onOpenChange={setShowAddIP}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add IP Range
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add IP Range</DialogTitle>
                      <DialogDescription>
                        Enter an IP address or CIDR range
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="iprange">IP Address / CIDR</Label>
                      <Input
                        id="iprange"
                        placeholder="192.168.1.0/24"
                        value={newIPRange}
                        onChange={(e) => setNewIPRange(e.target.value)}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Examples: 192.168.1.1, 10.0.0.0/8, 172.16.0.0/12
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddIP(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddIPRange}>
                        Add IP Range
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {ipRanges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No IP rules configured</p>
                  <p className="text-sm">Add IP ranges to customize their VPN behavior</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ipRanges.map(ip => (
                    <div key={ip} className="ip-item">
                      <Network className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 font-mono text-sm">{ip}</span>
                      <Badge variant={mode === 'exclude' ? 'secondary' : 'default'} className="text-xs">
                        {mode === 'exclude' ? (
                          <>
                            <ShieldOff className="h-3 w-3 mr-1" />
                            Bypassed
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            VPN
                          </>
                        )}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveIPRange(ip)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm">
                  <strong>{mode === 'exclude' ? includedApps.length : excludedApps.length}</strong> apps via VPN
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldOff className="h-5 w-5 text-gray-400" />
                <span className="text-sm">
                  <strong>{mode === 'exclude' ? excludedApps.length : includedApps.length}</strong> apps direct
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <span className="text-sm">
                  <strong>{websites.length}</strong> website rules
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Network className="h-5 w-5 text-purple-500" />
                <span className="text-sm">
                  <strong>{ipRanges.length}</strong> IP rules
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Advanced
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { SplitTunnelingConfigComponent as SplitTunnelingConfig };
export default SplitTunnelingConfigComponent;