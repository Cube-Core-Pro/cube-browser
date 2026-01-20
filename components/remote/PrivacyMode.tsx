"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  EyeOff,
  Eye,
  Shield,
  Lock,
  Unlock,
  Settings,
  Plus,
  Trash2,
  Edit,
  Square,
  AppWindow,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Zap,
  X,
  Loader2,
} from 'lucide-react';
import {
  PrivacyModeConfig,
  PrivacyZone,
  PrivacyLevel,
  PrivacyScope,
} from '@/types/remote-desktop-pro';
import { logger } from '@/lib/services/logger-service';
import './PrivacyMode.css';

const log = logger.scope('PrivacyMode');

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendPrivacyRule {
  id: string;
  name: string;
  type: string;
  applicationName: string | null;
  windowTitle: string | null;
  bounds: { x: number; y: number; width: number; height: number } | null;
  effect: string;
  active: boolean;
}

interface BackendPrivacyConfig {
  isEnabled: boolean;
  rules: BackendPrivacyRule[];
  blurSensitive: boolean;
  hideNotifications: boolean;
  blockScreenshots: boolean;
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

function convertBackendRule(rule: BackendPrivacyRule): PrivacyZone {
  return {
    id: rule.id,
    name: rule.name,
    type: rule.type as 'rectangle' | 'window' | 'application',
    applicationName: rule.applicationName ?? undefined,
    windowTitle: rule.windowTitle ?? undefined,
    bounds: rule.bounds ?? undefined,
    effect: rule.effect as PrivacyLevel,
    enabled: rule.active,
  };
}

const defaultSensitivePatterns = [
  'password',
  'credit card',
  'ssn',
  'social security',
  'bank account',
  'api key',
  'secret',
  'token',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getEffectLabel = (effect: PrivacyLevel): string => {
  switch (effect) {
    case 'none':
      return 'None';
    case 'blur':
      return 'Blur';
    case 'blackout':
      return 'Blackout';
    case 'custom':
      return 'Custom';
    default:
      return 'Unknown';
  }
};

const getEffectColor = (effect: PrivacyLevel): string => {
  switch (effect) {
    case 'none':
      return '#6b7280';
    case 'blur':
      return '#3b82f6';
    case 'blackout':
      return '#1f2937';
    case 'custom':
      return '#8b5cf6';
    default:
      return '#6b7280';
  }
};

const getZoneTypeIcon = (type: string) => {
  switch (type) {
    case 'rectangle':
      return Square;
    case 'window':
      return AppWindow;
    case 'application':
      return Monitor;
    default:
      return Square;
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ZoneCardProps {
  zone: PrivacyZone;
  onToggle: (id: string) => void;
  onEdit: (zone: PrivacyZone) => void;
  onDelete: (id: string) => void;
}

function ZoneCard({ zone, onToggle, onEdit, onDelete }: ZoneCardProps) {
  const ZoneIcon = getZoneTypeIcon(zone.type);
  
  return (
    <div className={`zone-card ${!zone.enabled ? 'disabled' : ''}`}>
      <div 
        className="zone-effect-indicator"
        style={{ backgroundColor: getEffectColor(zone.effect) }}
      />
      
      <div className="zone-icon">
        <ZoneIcon className="h-5 w-5" />
      </div>
      
      <div className="zone-info">
        <div className="flex items-center gap-2">
          <span className="font-medium">{zone.name}</span>
          <Badge variant="secondary" className="text-xs capitalize">
            {zone.type}
          </Badge>
          <Badge 
            className="text-xs"
            style={{ 
              backgroundColor: `${getEffectColor(zone.effect)}20`,
              color: getEffectColor(zone.effect),
              border: `1px solid ${getEffectColor(zone.effect)}40`
            }}
          >
            {getEffectLabel(zone.effect)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {zone.applicationName || zone.windowTitle || 
           (zone.bounds && `${zone.bounds.width}x${zone.bounds.height}`)}
        </p>
      </div>
      
      <div className="zone-actions">
        <Switch
          checked={zone.enabled}
          onCheckedChange={() => onToggle(zone.id)}
        />
        <Button size="sm" variant="ghost" onClick={() => onEdit(zone)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(zone.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

interface TriggerToggleProps {
  trigger: string;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function TriggerToggle({ trigger: _trigger, label, description, enabled, onToggle }: TriggerToggleProps) {
  return (
    <div className="trigger-toggle">
      <div className="trigger-info">
        <span className="font-medium">{label}</span>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface PrivacyModeProps {
  onClose?: () => void;
}

export function PrivacyMode({ onClose: _onClose }: PrivacyModeProps) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<PrivacyModeConfig>({
    enabled: false,
    level: 'blur',
    scope: 'sensitive',
    zones: [],
    hideNotifications: true,
    hideTaskbar: false,
    hideDesktopIcons: true,
    blurIntensity: 15,
    autoActivate: {
      enabled: true,
      triggers: ['screen-share', 'presentation'],
    },
    sensitivePatterns: defaultSensitivePatterns,
    passwordFields: true,
  });
  const [zones, setZones] = useState<PrivacyZone[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const activeZones = zones.filter(z => z.enabled).length;

  useEffect(() => {
    let mounted = true;

    const fetchPrivacyConfig = async () => {
      try {
        const backendConfig = await invoke<BackendPrivacyConfig>('get_privacy_mode_config');
        
        if (mounted) {
          const convertedZones = backendConfig.rules.map(convertBackendRule);
          setZones(convertedZones);
          setConfig(prev => ({
            ...prev,
            enabled: backendConfig.isEnabled,
            hideNotifications: backendConfig.hideNotifications,
            passwordFields: backendConfig.blurSensitive,
            zones: convertedZones,
          }));
        }
      } catch (error) {
        log.error('Failed to fetch privacy config:', error);
        if (mounted) {
          toast({
            title: 'Error',
            description: 'Failed to load privacy configuration',
            variant: 'destructive',
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPrivacyConfig();
    return () => { mounted = false; };
  }, [toast]);

  const handleTogglePrivacy = useCallback(async () => {
    const newEnabled = !config.enabled;
    try {
      await invoke('toggle_privacy_mode', { enabled: newEnabled });
      setConfig(prev => ({ ...prev, enabled: newEnabled }));
      toast({
        title: newEnabled ? 'Privacy Mode Enabled' : 'Privacy Mode Disabled',
        description: newEnabled 
          ? 'Sensitive content is now hidden' 
          : 'Your screen is now visible',
      });
    } catch (error) {
      log.error('Failed to toggle privacy mode:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle privacy mode',
        variant: 'destructive',
      });
    }
  }, [config.enabled, toast]);

  const handleToggleZone = useCallback(async (id: string) => {
    const zone = zones.find(z => z.id === id);
    if (!zone) return;

    const newActive = !zone.enabled;
    try {
      await invoke('toggle_privacy_rule', { ruleId: id, active: newActive });
      setZones(prev => prev.map(z =>
        z.id === id ? { ...z, enabled: newActive } : z
      ));
    } catch (error) {
      log.error('Failed to toggle privacy rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update privacy zone',
        variant: 'destructive',
      });
    }
  }, [zones, toast]);

  const handleEditZone = useCallback((zone: PrivacyZone) => {
    toast({
      title: 'Edit Zone',
      description: `Editing ${zone.name}`,
    });
  }, [toast]);

  const handleDeleteZone = useCallback((id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
    toast({
      title: 'Zone Deleted',
      description: 'Privacy zone has been removed',
    });
  }, [toast]);

  const handleToggleTrigger = useCallback((trigger: string) => {
    setConfig(prev => {
      const triggers = prev.autoActivate.triggers;
      const typedTrigger = trigger as 'screen-share' | 'recording' | 'presentation' | 'guest-mode';
      const newTriggers = triggers.includes(typedTrigger)
        ? triggers.filter(t => t !== trigger)
        : [...triggers, typedTrigger];
      return {
        ...prev,
        autoActivate: { ...prev.autoActivate, triggers: newTriggers }
      };
    });
  }, []);

  return (
    <div className="privacy-mode">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && (
        <>
          {/* Header */}
          <div className={`privacy-header ${config.enabled ? 'active' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="header-icon">
            {config.enabled ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
          </div>
          <div>
            <h2 className="text-xl font-semibold">Privacy Mode</h2>
            <p className="text-sm text-muted-foreground">
              Hide sensitive content during screen sharing
            </p>
          </div>
        </div>
        <Button
          size="lg"
          variant={config.enabled ? 'destructive' : 'default'}
          onClick={handleTogglePrivacy}
        >
          {config.enabled ? (
            <>
              <Unlock className="h-4 w-4 mr-2" />
              Disable
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Enable
            </>
          )}
        </Button>
      </div>

      {/* Status Banner */}
      {config.enabled && (
        <div className="privacy-status-banner">
          <Shield className="h-5 w-5" />
          <span>Privacy Mode is active. {activeZones} zones are hidden.</span>
          <Badge variant="secondary">{getEffectLabel(config.level)}</Badge>
        </div>
      )}

      {/* Stats */}
      <div className="privacy-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Square className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{zones.length}</span>
            <span className="stat-label">Total Zones</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{activeZones}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{config.autoActivate.triggers.length}</span>
            <span className="stat-label">Triggers</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{config.sensitivePatterns.length}</span>
            <span className="stat-label">Patterns</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <Shield className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="zones">
            <Square className="h-4 w-4 mr-2" />
            Zones ({zones.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Settings</CardTitle>
                <CardDescription>
                  Configure privacy behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="setting-row">
                  <div>
                    <Label>Privacy Level</Label>
                    <p className="text-sm text-muted-foreground">
                      How sensitive content is hidden
                    </p>
                  </div>
                  <Select 
                    value={config.level} 
                    onValueChange={(level: PrivacyLevel) => setConfig(prev => ({ ...prev, level }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blur">Blur</SelectItem>
                      <SelectItem value="blackout">Blackout</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.level === 'blur' && (
                  <div className="setting-row">
                    <div>
                      <Label>Blur Intensity: {config.blurIntensity}px</Label>
                      <p className="text-sm text-muted-foreground">
                        Amount of blur applied
                      </p>
                    </div>
                    <Slider
                      value={[config.blurIntensity]}
                      onValueChange={([value]) => setConfig(prev => ({ ...prev, blurIntensity: value }))}
                      min={5}
                      max={30}
                      step={1}
                      className="w-32"
                    />
                  </div>
                )}

                <div className="setting-row">
                  <div>
                    <Label>Scope</Label>
                    <p className="text-sm text-muted-foreground">
                      What content to hide
                    </p>
                  </div>
                  <Select 
                    value={config.scope} 
                    onValueChange={(scope: PrivacyScope) => setConfig(prev => ({ ...prev, scope }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Screen</SelectItem>
                      <SelectItem value="selected">Selected Zones</SelectItem>
                      <SelectItem value="sensitive">Sensitive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Auto-Activate Triggers</CardTitle>
                <CardDescription>
                  Automatically enable privacy mode
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <TriggerToggle
                  trigger="screen-share"
                  label="Screen Sharing"
                  description="When sharing screen in any application"
                  enabled={config.autoActivate.triggers.includes('screen-share')}
                  onToggle={() => handleToggleTrigger('screen-share')}
                />
                <TriggerToggle
                  trigger="recording"
                  label="Recording"
                  description="When recording screen"
                  enabled={config.autoActivate.triggers.includes('recording')}
                  onToggle={() => handleToggleTrigger('recording')}
                />
                <TriggerToggle
                  trigger="presentation"
                  label="Presentation Mode"
                  description="During presentations"
                  enabled={config.autoActivate.triggers.includes('presentation')}
                  onToggle={() => handleToggleTrigger('presentation')}
                />
                <TriggerToggle
                  trigger="guest-mode"
                  label="Guest Mode"
                  description="When guest is controlling remotely"
                  enabled={config.autoActivate.triggers.includes('guest-mode')}
                  onToggle={() => handleToggleTrigger('guest-mode')}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Privacy Zones</CardTitle>
                  <CardDescription>
                    Define areas to hide
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Zone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {zones.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Square className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No privacy zones defined</p>
                    </div>
                  ) : (
                    zones.map(zone => (
                      <ZoneCard
                        key={zone.id}
                        zone={zone}
                        onToggle={handleToggleZone}
                        onEdit={handleEditZone}
                        onDelete={handleDeleteZone}
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
              <CardTitle className="text-lg">Privacy Settings</CardTitle>
              <CardDescription>
                Advanced privacy configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Hide Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide system notifications during privacy mode
                  </p>
                </div>
                <Switch
                  checked={config.hideNotifications}
                  onCheckedChange={(hideNotifications) => 
                    setConfig(prev => ({ ...prev, hideNotifications }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Hide Taskbar</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide the taskbar during privacy mode
                  </p>
                </div>
                <Switch
                  checked={config.hideTaskbar}
                  onCheckedChange={(hideTaskbar) => 
                    setConfig(prev => ({ ...prev, hideTaskbar }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Hide Desktop Icons</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide all desktop icons
                  </p>
                </div>
                <Switch
                  checked={config.hideDesktopIcons}
                  onCheckedChange={(hideDesktopIcons) => 
                    setConfig(prev => ({ ...prev, hideDesktopIcons }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Auto-hide Password Fields</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically blur password input fields
                  </p>
                </div>
                <Switch
                  checked={config.passwordFields}
                  onCheckedChange={(passwordFields) => 
                    setConfig(prev => ({ ...prev, passwordFields }))}
                />
              </div>

              <div>
                <Label>Sensitive Patterns</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Words that trigger automatic hiding
                </p>
                <div className="flex flex-wrap gap-2">
                  {config.sensitivePatterns.map((pattern, index) => (
                    <Badge key={index} variant="secondary">
                      {pattern}
                      <button
                        className="ml-1"
                        onClick={() => {
                          const newPatterns = [...config.sensitivePatterns];
                          newPatterns.splice(index, 1);
                          setConfig(prev => ({ ...prev, sensitivePatterns: newPatterns }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}

export default PrivacyMode;
