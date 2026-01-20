"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('MultiMonitor');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Monitor,
  Maximize2,
  Settings,
  Eye,
  EyeOff,
  Grid3X3,
  Layers,
  RefreshCcw,
  Check,
  Tv,
  Smartphone,
  Layout,
  LayoutGrid,
  PictureInPicture2,
  Split,
  Zap,
  Save,
  Loader2,
} from 'lucide-react';
import {
  MultiMonitorConfig,
  MonitorInfo,
  MonitorLayout,
  RemoteMonitorConfig,
} from '@/types/remote-desktop-pro';
import './MultiMonitor.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendMonitor {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  scaleFactor: number;
  isPrimary: boolean;
  isActive: boolean;
  isShared: boolean;
}

interface BackendMultiMonitorConfig {
  monitors: BackendMonitor[];
  shareAll: boolean;
  followMouse: boolean;
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

function convertBackendMonitor(mon: BackendMonitor): MonitorInfo {
  return {
    id: mon.id,
    name: mon.name,
    width: mon.width,
    height: mon.height,
    x: mon.x,
    y: mon.y,
    scaleFactor: mon.scaleFactor,
    isPrimary: mon.isPrimary,
    isActive: mon.isActive,
    isShared: mon.isShared,
    orientation: mon.height > mon.width ? 'portrait' : 'landscape',
    refreshRate: 60,
    colorDepth: 32,
  };
}

const defaultLayouts: MonitorLayout[] = [
  {
    id: 'layout-1',
    name: 'Default Layout',
    monitors: [],
    isDefault: true,
    createdAt: new Date(),
  },
];

const defaultRemoteConfigs: RemoteMonitorConfig[] = [];

const presetLayouts: { id: string; name: string; icon: React.ElementType; description: string }[] = [
  { id: 'single', name: 'Single', icon: Monitor, description: 'One monitor at a time' },
  { id: 'side-by-side', name: 'Side by Side', icon: Split, description: 'Two monitors horizontal' },
  { id: 'stacked', name: 'Stacked', icon: Layers, description: 'Two monitors vertical' },
  { id: 'span', name: 'Span All', icon: Maximize2, description: 'Stretch across all' },
  { id: 'pip', name: 'Picture in Picture', icon: PictureInPicture2, description: 'Small overlay' },
  { id: 'grid', name: 'Grid', icon: LayoutGrid, description: 'All in grid view' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatResolution = (width: number, height: number): string => {
  if (width === 3840 && height === 2160) return '4K UHD';
  if (width === 2560 && height === 1440) return '1440p QHD';
  if (width === 1920 && height === 1080) return '1080p FHD';
  if (width === 1280 && height === 720) return '720p HD';
  return `${width}×${height}`;
};

const getOrientationIcon = (orientation: 'landscape' | 'portrait') => {
  return orientation === 'landscape' ? Monitor : Smartphone;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MonitorCardProps {
  monitor: MonitorInfo;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}

function MonitorCard({ monitor, isSelected, onSelect, onToggle }: MonitorCardProps) {
  const OrientationIcon = getOrientationIcon(monitor.orientation ?? 'landscape');
  const aspectRatio = (monitor.width ?? 1920) / (monitor.height ?? 1080);
  
  return (
    <div 
      className={`monitor-card ${isSelected ? 'selected' : ''} ${!monitor.isActive ? 'inactive' : ''}`}
      onClick={onSelect}
    >
      <div 
        className="monitor-preview"
        style={{
          aspectRatio: aspectRatio,
          maxWidth: monitor.orientation === 'portrait' ? '60px' : '100px',
        }}
      >
        <OrientationIcon className="h-6 w-6" />
        {monitor.isPrimary && (
          <Badge variant="secondary" className="primary-badge">
            Primary
          </Badge>
        )}
      </div>
      <div className="monitor-details">
        <span className="monitor-name">{monitor.name}</span>
        <span className="monitor-resolution">
          {formatResolution(monitor.width ?? 1920, monitor.height ?? 1080)}
        </span>
        <div className="monitor-specs">
          <span>{monitor.refreshRate ?? 60}Hz</span>
          <span>{Math.round((monitor.scaleFactor ?? 1) * 100)}% scale</span>
        </div>
      </div>
      <div className="monitor-actions" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          variant={monitor.isActive ? 'outline' : 'secondary'}
          onClick={onToggle}
        >
          {monitor.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

interface LayoutPreviewProps {
  monitors: MonitorInfo[];
  selectedId: string | null;
  onSelectMonitor: (id: string) => void;
}

function LayoutPreview({ monitors, selectedId, onSelectMonitor }: LayoutPreviewProps) {
  const activeMonitors = monitors.filter(m => m.isActive);
  
  // Calculate bounds with fallbacks for undefined values
  const minX = Math.min(...activeMonitors.map(m => m.x ?? 0));
  const maxX = Math.max(...activeMonitors.map(m => (m.x ?? 0) + (m.width ?? 1920)));
  const minY = Math.min(...activeMonitors.map(m => m.y ?? 0));
  const maxY = Math.max(...activeMonitors.map(m => (m.y ?? 0) + (m.height ?? 1080)));
  
  const totalWidth = maxX - minX;
  const totalHeight = maxY - minY;
  const scale = Math.min(500 / totalWidth, 300 / totalHeight) * 0.8;

  return (
    <div className="layout-preview">
      <div 
        className="layout-canvas"
        style={{
          width: totalWidth * scale,
          height: totalHeight * scale,
        }}
      >
        {activeMonitors.map(monitor => {
          const monitorX = monitor.x ?? 0;
          const monitorY = monitor.y ?? 0;
          const monitorWidth = monitor.width ?? 1920;
          const monitorHeight = monitor.height ?? 1080;
          
          const left = (monitorX - minX) * scale;
          const top = (monitorY - minY) * scale;
          const width = monitorWidth * scale;
          const height = monitorHeight * scale;
          
          return (
            <div
              key={monitor.id}
              className={`layout-monitor ${selectedId === monitor.id ? 'selected' : ''} ${monitor.isPrimary ? 'primary' : ''}`}
              style={{
                left,
                top,
                width,
                height,
              }}
              onClick={() => onSelectMonitor(monitor.id)}
            >
              <span className="layout-monitor-label">{monitor.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface MultiMonitorProps {
  onClose?: () => void;
}

export function MultiMonitor({ onClose: _onClose }: MultiMonitorProps) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<MultiMonitorConfig>({
    enabled: true,
    seamlessMode: true,
    sharedClipboard: true,
    cursorWrapping: true,
    monitors: [],
    remoteMonitors: [],
    layouts: defaultLayouts,
    activeLayout: 'layout-1',
    remoteConfigs: defaultRemoteConfigs,
    hotkeys: {
      switchMonitor: 'Ctrl+Alt+Arrow',
      toggleFullscreen: 'Ctrl+Alt+Enter',
      toggleLayout: 'Ctrl+Alt+L',
      fullscreen: 'F11',
    },
    performance: {
      quality: 'auto',
      frameRate: 60,
      colorDepth: 32,
      compression: 50,
    },
  });
  const [selectedMonitor, setSelectedMonitor] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState('span');
  const [activeTab, setActiveTab] = useState('monitors');
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const fetchMonitorConfig = async () => {
      try {
        const backendConfig = await invoke<BackendMultiMonitorConfig>('get_multi_monitor_config');
        
        if (mounted) {
          const convertedMonitors = backendConfig.monitors.map(convertBackendMonitor);
          const remoteMonitors = convertedMonitors.filter(m => m.isShared);
          
          setConfig(prev => ({
            ...prev,
            monitors: convertedMonitors,
            remoteMonitors: remoteMonitors,
            seamlessMode: backendConfig.followMouse,
          }));
          
          if (convertedMonitors.length > 0) {
            setSelectedMonitor(convertedMonitors[0].id);
          }
        }
      } catch (error) {
        log.error('Failed to fetch monitor config:', error);
        if (mounted) {
          toast({
            title: 'Error',
            description: 'Failed to load monitor configuration',
            variant: 'destructive',
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMonitorConfig();
    return () => { mounted = false; };
  }, [toast]);

  const handleToggleMonitor = useCallback(async (id: string) => {
    const monitor = config.monitors.find(m => m.id === id);
    if (!monitor) return;

    const newShared = !monitor.isActive;
    try {
      await invoke('toggle_monitor_sharing', { monitorId: id, shared: newShared });
      setConfig(prev => ({
        ...prev,
        monitors: prev.monitors.map(m => 
          m.id === id ? { ...m, isActive: newShared } : m
        ),
      }));
      toast({
        title: 'Monitor Updated',
        description: 'Display configuration changed',
      });
    } catch (error) {
      log.error('Failed to toggle monitor:', error);
      toast({
        title: 'Error',
        description: 'Failed to update monitor configuration',
        variant: 'destructive',
      });
    }
  }, [config.monitors, toast]);

  const handleApplyLayout = useCallback((layoutId: string) => {
    setSelectedLayout(layoutId);
    toast({
      title: 'Layout Applied',
      description: `Switched to ${presetLayouts.find(l => l.id === layoutId)?.name} layout`,
    });
  }, [toast]);

  const handleSaveConfiguration = useCallback(() => {
    toast({
      title: 'Configuration Saved',
      description: 'Monitor settings have been saved',
    });
  }, [toast]);

  const activeMonitors = config.monitors.filter(m => m.isActive);
  const totalPixels = activeMonitors.reduce((acc, m) => acc + ((m.width ?? 0) * (m.height ?? 0)), 0);

  if (loading) {
    return (
      <div className="multi-monitor">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="multi-monitor">
      {/* Header */}
      <div className="multi-monitor-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Monitor className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Multi-Monitor Control</h2>
            <p className="text-sm text-muted-foreground">
              Configure display layout and remote monitors
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveConfiguration}>
            <Save className="h-4 w-4 mr-2" />
            Save Config
          </Button>
          <Button onClick={() => toast({ title: 'Detecting monitors...' })}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Detect Displays
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="monitor-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{activeMonitors.length}</span>
            <span className="stat-label">Active Displays</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Grid3X3 className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{(totalPixels / 1000000).toFixed(1)}MP</span>
            <span className="stat-label">Total Resolution</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <Tv className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{(config.remoteMonitors ?? []).filter(m => m.isShared).length}</span>
            <span className="stat-label">Remote Monitors</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{config.performance?.frameRate ?? 60}fps</span>
            <span className="stat-label">Max Frame Rate</span>
          </div>
        </div>
      </div>

      {/* Layout Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Display Arrangement
          </CardTitle>
          <CardDescription>
            Click and drag monitors to rearrange (visual preview)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LayoutPreview
            monitors={config.monitors}
            selectedId={selectedMonitor}
            onSelectMonitor={setSelectedMonitor}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="monitors">
            <Monitor className="h-4 w-4 mr-2" />
            Local Monitors
          </TabsTrigger>
          <TabsTrigger value="remote">
            <Tv className="h-4 w-4 mr-2" />
            Remote Displays
          </TabsTrigger>
          <TabsTrigger value="layouts">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Preset Layouts
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitors">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Local Displays</CardTitle>
              <CardDescription>
                Configure your local monitor arrangement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="monitors-list">
                {config.monitors.map(monitor => (
                  <MonitorCard
                    key={monitor.id}
                    monitor={monitor}
                    isSelected={selectedMonitor === monitor.id}
                    onSelect={() => setSelectedMonitor(monitor.id)}
                    onToggle={() => handleToggleMonitor(monitor.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remote">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Remote Displays</CardTitle>
              <CardDescription>
                Monitors available from the remote machine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="remote-monitors-grid">
                {(config.remoteMonitors ?? []).map(monitor => (
                  <div key={monitor.id} className="remote-monitor-card">
                    <div className="remote-monitor-preview">
                      <Tv className="h-8 w-8" />
                    </div>
                    <div className="remote-monitor-info">
                      <span className="font-medium">{monitor.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatResolution(monitor.width ?? 1920, monitor.height ?? 1080)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={monitor.isShared ? 'default' : 'secondary'}>
                        {monitor.isShared ? 'Sharing' : 'Hidden'}
                      </Badge>
                      <Select defaultValue={monitor.quality ?? 'medium'}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layouts">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preset Layouts</CardTitle>
              <CardDescription>
                Quick layout configurations for multi-monitor setups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="layouts-grid">
                {presetLayouts.map(layout => {
                  const LayoutIcon = layout.icon;
                  return (
                    <div
                      key={layout.id}
                      className={`layout-option ${selectedLayout === layout.id ? 'selected' : ''}`}
                      onClick={() => handleApplyLayout(layout.id)}
                    >
                      <div className="layout-option-icon">
                        <LayoutIcon className="h-6 w-6" />
                      </div>
                      <div className="layout-option-info">
                        <span className="font-medium">{layout.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {layout.description}
                        </span>
                      </div>
                      {selectedLayout === layout.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Multi-Monitor Settings</CardTitle>
              <CardDescription>
                Configure display behavior and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Seamless Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Smooth mouse transition between monitors
                  </p>
                </div>
                <Switch
                  checked={config.seamlessMode}
                  onCheckedChange={(seamlessMode) => 
                    setConfig(prev => ({ ...prev, seamlessMode }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Adaptive Quality</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-adjust quality based on network
                  </p>
                </div>
                <Switch
                  checked={config.performance?.quality === 'auto'}
                  onCheckedChange={(isAuto) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      performance: { 
                        ...prev.performance ?? { frameRate: 60, colorDepth: 32, compression: 50 }, 
                        quality: isAuto ? 'auto' : 'high'
                      }
                    }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Max Frame Rate</Label>
                  <p className="text-sm text-muted-foreground">
                    Limit FPS for bandwidth savings
                  </p>
                </div>
                <Select 
                  value={(config.performance?.frameRate ?? 60).toString()}
                  onValueChange={(value) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      performance: { 
                        ...prev.performance ?? { quality: 'auto', colorDepth: 32, compression: 50 }, 
                        frameRate: parseInt(value) 
                      }
                    }))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 fps</SelectItem>
                    <SelectItem value="60">60 fps</SelectItem>
                    <SelectItem value="120">120 fps</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="setting-row">
                <div>
                  <Label>Color Depth</Label>
                  <p className="text-sm text-muted-foreground">
                    Display color accuracy
                  </p>
                </div>
                <Select 
                  value={(config.performance?.colorDepth ?? 32).toString()}
                  onValueChange={(value) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      performance: { 
                        ...prev.performance ?? { quality: 'auto', frameRate: 60, compression: 50 }, 
                        colorDepth: parseInt(value) 
                      }
                    }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16">16-bit</SelectItem>
                    <SelectItem value="24">24-bit</SelectItem>
                    <SelectItem value="32">32-bit (Full)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="setting-row">
                <div>
                  <Label>Compression</Label>
                  <p className="text-sm text-muted-foreground">
                    Balance between quality and bandwidth
                  </p>
                </div>
                <Select 
                  value={(config.performance?.compression ?? 50).toString()}
                  onValueChange={(value) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      performance: { 
                        ...prev.performance ?? { quality: 'auto', frameRate: 60, colorDepth: 32 }, 
                        compression: parseInt(value) 
                      }
                    }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    <SelectItem value="25">Light</SelectItem>
                    <SelectItem value="50">Balanced</SelectItem>
                    <SelectItem value="75">Aggressive</SelectItem>
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

export default MultiMonitor;
