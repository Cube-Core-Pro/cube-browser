"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('BandwidthControl');

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
  Gauge,
  Clock,
  Calendar,
  Upload,
  Download,
  Settings,
  Plus,
  Trash2,
  BarChart3,
  Zap,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import {
  BandwidthConfig,
  BandwidthSchedule,
  BandwidthPriorityRule,
} from '@/types/file-transfer-elite';
import './BandwidthControl.css';

// ============================================================================
// BACKEND TYPES (matching Rust structs)
// ============================================================================

interface BackendBandwidthRule {
  id: string;
  name: string;
  uploadLimitMbps: number | null;
  downloadLimitMbps: number | null;
  scheduleEnabled: boolean;
  scheduleStart: string;
  scheduleEnd: string;
  days: string[];
  isActive: boolean;
}

interface BackendBandwidthStats {
  currentUploadMbps: number;
  currentDownloadMbps: number;
  totalUploadedGb: number;
  totalDownloadedGb: number;
  peakUploadMbps: number;
  peakDownloadMbps: number;
}

interface BackendBandwidthConfig {
  rules: BackendBandwidthRule[];
  stats: BackendBandwidthStats;
  globalUploadLimit: number | null;
  globalDownloadLimit: number | null;
}

// ============================================================================
// CONVERTERS (Backend → Frontend)
// ============================================================================

const convertBackendRule = (backend: BackendBandwidthRule): BandwidthSchedule => ({
  id: backend.id,
  name: backend.name,
  enabled: backend.isActive,
  days: backend.days,
  startTime: backend.scheduleStart,
  endTime: backend.scheduleEnd,
  uploadLimit: backend.uploadLimitMbps ? backend.uploadLimitMbps * 1024 * 1024 : 0,
  downloadLimit: backend.downloadLimitMbps ? backend.downloadLimitMbps * 1024 * 1024 : 0,
});

interface UsageStats {
  currentUpload: number;
  currentDownload: number;
  peakUpload: number;
  peakDownload: number;
  todayUpload: number;
  todayDownload: number;
  monthUpload: number;
  monthDownload: number;
}

const convertBackendStats = (backend: BackendBandwidthStats): UsageStats => ({
  currentUpload: backend.currentUploadMbps * 1024 * 1024,
  currentDownload: backend.currentDownloadMbps * 1024 * 1024,
  peakUpload: backend.peakUploadMbps * 1024 * 1024,
  peakDownload: backend.peakDownloadMbps * 1024 * 1024,
  todayUpload: backend.totalUploadedGb * 1024 * 1024 * 1024 * 0.1, // Estimated daily
  todayDownload: backend.totalDownloadedGb * 1024 * 1024 * 1024 * 0.1, // Estimated daily
  monthUpload: backend.totalUploadedGb * 1024 * 1024 * 1024,
  monthDownload: backend.totalDownloadedGb * 1024 * 1024 * 1024,
});

// ============================================================================
// STATIC DATA - Priority Rules (feature expansion - no backend yet)
// ============================================================================

const staticPriorityRules: BandwidthPriorityRule[] = [
  {
    id: 'rule-1',
    name: 'Work Documents',
    pattern: '*.docx,*.xlsx,*.pptx,*.pdf',
    priority: 'high',
    maxBandwidth: 0,
  },
  {
    id: 'rule-2',
    name: 'Large Videos',
    pattern: '*.mp4,*.mov,*.avi',
    priority: 'low',
    maxBandwidth: 2 * 1024 * 1024,
  },
  {
    id: 'rule-3',
    name: 'Backup Files',
    pattern: '/Backup/**',
    priority: 'lowest',
    maxBandwidth: 1 * 1024 * 1024,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return 'Unlimited';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSec: number): string => {
  if (bytesPerSec === 0) return 'Unlimited';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDays = (days: string[]): string => {
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
    return 'Weekdays';
  }
  if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
    return 'Weekends';
  }
  return days.map(d => d.slice(0, 3)).join(', ');
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'highest':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'normal':
      return '#3b82f6';
    case 'low':
      return '#8b5cf6';
    case 'lowest':
      return '#6b7280';
    default:
      return '#3b82f6';
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ScheduleCardProps {
  schedule: BandwidthSchedule;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function ScheduleCard({ schedule, onToggle, onDelete }: ScheduleCardProps) {
  const isActive = useMemo(() => {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const time = now.toTimeString().slice(0, 5);
    
    if (!schedule.days.includes(day)) return false;
    return time >= schedule.startTime && time <= schedule.endTime;
  }, [schedule]);

  return (
    <div className={`schedule-card ${!schedule.enabled ? 'disabled' : ''} ${isActive ? 'active' : ''}`}>
      <div className="schedule-status">
        <Clock className="h-5 w-5" />
        {isActive && <span className="active-indicator" />}
      </div>
      
      <div className="schedule-info">
        <div className="flex items-center gap-2">
          <span className="font-medium">{schedule.name}</span>
          {isActive && (
            <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDays(schedule.days)} • {schedule.startTime} - {schedule.endTime}
        </p>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            {formatSpeed(schedule.uploadLimit)}
          </span>
          <span className="flex items-center gap-1">
            <ArrowDown className="h-3 w-3" />
            {formatSpeed(schedule.downloadLimit)}
          </span>
        </div>
      </div>
      
      <div className="schedule-actions">
        <Switch
          checked={schedule.enabled}
          onCheckedChange={() => onToggle(schedule.id)}
        />
        <Button size="sm" variant="ghost" onClick={() => onDelete(schedule.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

interface PriorityRuleCardProps {
  rule: BandwidthPriorityRule;
  onDelete: (id: string) => void;
}

function PriorityRuleCard({ rule, onDelete }: PriorityRuleCardProps) {
  return (
    <div className="priority-rule-card">
      <div 
        className="priority-indicator"
        style={{ backgroundColor: getPriorityColor(rule.priority) }}
      />
      
      <div className="rule-info">
        <div className="flex items-center gap-2">
          <span className="font-medium">{rule.name}</span>
          <Badge variant="secondary" className="text-xs capitalize">
            {rule.priority}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Pattern: <code>{rule.pattern}</code>
        </p>
        {(rule.maxBandwidth ?? 0) > 0 && (
          <p className="text-xs text-muted-foreground">
            Max: {formatSpeed(rule.maxBandwidth ?? 0)}
          </p>
        )}
      </div>
      
      <Button size="sm" variant="ghost" onClick={() => onDelete(rule.id)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface BandwidthControlProps {
  onClose?: () => void;
}

export function BandwidthControl({ onClose: _onClose }: BandwidthControlProps) {
  const [config, setConfig] = useState<BandwidthConfig>({
    enabled: true,
    uploadLimit: 0,
    downloadLimit: 0,
    schedules: [],
    priorityRules: staticPriorityRules,
    throttleOnNetwork: [],
    adaptiveBandwidth: true,
    reserveForOther: 0,
    pauseOnBattery: true,
    pauseOnMeteredConnection: true,
    throttleBackground: true,
  });
  const [schedules, setSchedules] = useState<BandwidthSchedule[]>([]);
  const [priorityRules, setPriorityRules] = useState<BandwidthPriorityRule[]>(staticPriorityRules);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    currentUpload: 0,
    currentDownload: 0,
    peakUpload: 0,
    peakDownload: 0,
    todayUpload: 0,
    todayDownload: 0,
    monthUpload: 0,
    monthDownload: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadLimit, setUploadLimit] = useState(0);
  const [downloadLimit, setDownloadLimit] = useState(0);
  const { toast } = useToast();

  // Load data from backend on mount
  useEffect(() => {
    const loadBandwidthConfig = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendBandwidthConfig>('get_bandwidth_config');
        setSchedules(backendConfig.rules.map(convertBackendRule));
        setUsageStats(convertBackendStats(backendConfig.stats));
        setUploadLimit(backendConfig.globalUploadLimit ?? 0);
        setDownloadLimit(backendConfig.globalDownloadLimit ?? 0);
        setConfig(prev => ({
          ...prev,
          uploadLimit: (backendConfig.globalUploadLimit ?? 0) * 1024 * 1024,
          downloadLimit: (backendConfig.globalDownloadLimit ?? 0) * 1024 * 1024,
        }));
      } catch (error) {
        log.error('Failed to load bandwidth config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load bandwidth configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadBandwidthConfig();
  }, [toast]);

  const handleToggleSchedule = useCallback(async (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;

    try {
      await invoke('toggle_bandwidth_rule', { ruleId: id, enabled: !schedule.enabled });
      setSchedules(prev => prev.map(s =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ));
    } catch (error) {
      log.error('Failed to toggle schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle bandwidth schedule',
        variant: 'destructive',
      });
    }
  }, [schedules, toast]);

  const handleDeleteSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast({
      title: 'Schedule Deleted',
      description: 'Bandwidth schedule has been removed',
    });
  }, [toast]);

  const handleDeleteRule = useCallback((id: string) => {
    setPriorityRules(prev => prev.filter(r => r.id !== id));
    toast({
      title: 'Rule Deleted',
      description: 'Priority rule has been removed',
    });
  }, [toast]);

  const handleApplyLimits = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      uploadLimit: uploadLimit * 1024 * 1024,
      downloadLimit: downloadLimit * 1024 * 1024,
    }));
    toast({
      title: 'Limits Applied',
      description: 'Bandwidth limits have been updated',
    });
  }, [uploadLimit, downloadLimit, toast]);

  if (loading) {
    return (
      <div className="bandwidth-control flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Bandwidth Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bandwidth-control">
      {/* Header */}
      <div className="control-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Gauge className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Bandwidth Control</h2>
            <p className="text-sm text-muted-foreground">
              Manage upload and download speeds
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="bw-enabled" className="text-sm">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </Label>
          <Switch
            id="bw-enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
          />
        </div>
      </div>

      {/* Current Usage */}
      <div className="usage-grid">
        <div className="usage-card upload">
          <div className="usage-icon">
            <Upload className="h-5 w-5" />
          </div>
          <div className="usage-content">
            <div className="usage-label">Current Upload</div>
            <div className="usage-value">{formatSpeed(usageStats.currentUpload)}</div>
            <div className="usage-bar">
              <div 
                className="usage-fill"
                style={{ width: `${config.uploadLimit > 0 ? (usageStats.currentUpload / config.uploadLimit) * 100 : 30}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="usage-card download">
          <div className="usage-icon">
            <Download className="h-5 w-5" />
          </div>
          <div className="usage-content">
            <div className="usage-label">Current Download</div>
            <div className="usage-value">{formatSpeed(usageStats.currentDownload)}</div>
            <div className="usage-bar">
              <div 
                className="usage-fill"
                style={{ width: `${config.downloadLimit > 0 ? (usageStats.currentDownload / config.downloadLimit) * 100 : 45}%` }}
              />
            </div>
          </div>
        </div>

        <div className="usage-card stats">
          <div className="usage-icon">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="usage-content">
            <div className="usage-label">Today&apos;s Usage</div>
            <div className="usage-stats-row">
              <span>↑ {formatBytes(usageStats.todayUpload)}</span>
              <span>↓ {formatBytes(usageStats.todayDownload)}</span>
            </div>
          </div>
        </div>

        <div className="usage-card stats">
          <div className="usage-icon">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="usage-content">
            <div className="usage-label">This Month</div>
            <div className="usage-stats-row">
              <span>↑ {formatBytes(usageStats.monthUpload)}</span>
              <span>↓ {formatBytes(usageStats.monthDownload)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <Gauge className="h-4 w-4 mr-2" />
            Limits
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Clock className="h-4 w-4 mr-2" />
            Schedules ({schedules.length})
          </TabsTrigger>
          <TabsTrigger value="priority">
            <Zap className="h-4 w-4 mr-2" />
            Priority ({priorityRules.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Global Bandwidth Limits</CardTitle>
              <CardDescription>
                Set maximum upload and download speeds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="limit-control">
                <div className="limit-header">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-500" />
                    <Label>Upload Limit</Label>
                  </div>
                  <span className="text-sm font-medium">
                    {uploadLimit === 0 ? 'Unlimited' : `${uploadLimit} MB/s`}
                  </span>
                </div>
                <Slider
                  value={[uploadLimit]}
                  onValueChange={([value]) => setUploadLimit(value)}
                  max={100}
                  step={1}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  0 = Unlimited
                </p>
              </div>

              <div className="limit-control">
                <div className="limit-header">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-green-500" />
                    <Label>Download Limit</Label>
                  </div>
                  <span className="text-sm font-medium">
                    {downloadLimit === 0 ? 'Unlimited' : `${downloadLimit} MB/s`}
                  </span>
                </div>
                <Slider
                  value={[downloadLimit]}
                  onValueChange={([value]) => setDownloadLimit(value)}
                  max={100}
                  step={1}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  0 = Unlimited
                </p>
              </div>

              <Button onClick={handleApplyLimits} className="w-full">
                Apply Limits
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Bandwidth Schedules</CardTitle>
                  <CardDescription>
                    Set different limits for different times
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                <div className="space-y-3">
                  {schedules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No bandwidth schedules</p>
                    </div>
                  ) : (
                    schedules.map(schedule => (
                      <ScheduleCard
                        key={schedule.id}
                        schedule={schedule}
                        onToggle={handleToggleSchedule}
                        onDelete={handleDeleteSchedule}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Priority Rules</CardTitle>
                  <CardDescription>
                    Prioritize bandwidth for specific files
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                <div className="space-y-3">
                  {priorityRules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No priority rules</p>
                    </div>
                  ) : (
                    priorityRules.map(rule => (
                      <PriorityRuleCard
                        key={rule.id}
                        rule={rule}
                        onDelete={handleDeleteRule}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bandwidth Settings</CardTitle>
              <CardDescription>
                Configure automatic bandwidth management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Pause on Battery</Label>
                  <p className="text-sm text-muted-foreground">
                    Pause sync when running on battery power
                  </p>
                </div>
                <Switch
                  checked={config.pauseOnBattery}
                  onCheckedChange={(pauseOnBattery) => 
                    setConfig(prev => ({ ...prev, pauseOnBattery }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Pause on Metered Connection</Label>
                  <p className="text-sm text-muted-foreground">
                    Pause sync on mobile data or metered WiFi
                  </p>
                </div>
                <Switch
                  checked={config.pauseOnMeteredConnection}
                  onCheckedChange={(pauseOnMeteredConnection) => 
                    setConfig(prev => ({ ...prev, pauseOnMeteredConnection }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Throttle Background Transfers</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce bandwidth when app is in background
                  </p>
                </div>
                <Switch
                  checked={config.throttleBackground}
                  onCheckedChange={(throttleBackground) => 
                    setConfig(prev => ({ ...prev, throttleBackground }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BandwidthControl;
