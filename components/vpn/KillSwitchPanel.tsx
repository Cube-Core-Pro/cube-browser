"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input as _Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Lock,
  Unlock as _Unlock,
  Shield as _Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Wifi as _Wifi,
  WifiOff as _WifiOff,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  Settings as _Settings,
  Power as _Power,
  PowerOff as _PowerOff,
  Globe as _Globe,
  Network as _Network,
  AppWindow,
  Laptop as _Laptop,
  Clock as _Clock,
  Activity as _Activity,
  RefreshCw,
  Plus,
  Minus as _Minus,
  X,
  Check as _Check,
  Search as _Search,
  ChevronRight as _ChevronRight,
  ChevronDown as _ChevronDown,
  Zap as _Zap,
  History,
  Loader2,
} from 'lucide-react';
import { KillSwitch as _KillSwitch, KillSwitchMode, SplitTunnelingApp } from '@/types/vpn-elite';
import { logger } from '@/lib/services/logger-service';
import './KillSwitchPanel.css';

const log = logger.scope('KillSwitchPanel');

// ============================================================================
// TYPES (matching backend)
// ============================================================================

interface KillSwitchEvent {
  id: string;
  eventType: string;
  timestamp: number;
  reason: string;
  appBlocked?: string;
}

interface KillSwitchConfig {
  enabled: boolean;
  mode: string;
  triggered: boolean;
  allowedApps: SplitTunnelingApp[];
  events: KillSwitchEvent[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface KillSwitchStatusProps {
  isActive: boolean;
  isTriggered: boolean;
  mode: KillSwitchMode;
}

function KillSwitchStatus({ isActive, isTriggered, mode }: KillSwitchStatusProps) {
  return (
    <Card className={`status-card ${isTriggered ? 'triggered' : isActive ? 'active' : 'inactive'}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`status-icon ${isTriggered ? 'triggered' : isActive ? 'active' : 'inactive'}`}>
              {isTriggered ? (
                <ShieldAlert className="h-10 w-10" />
              ) : isActive ? (
                <ShieldCheck className="h-10 w-10" />
              ) : (
                <ShieldOff className="h-10 w-10" />
              )}
            </div>
            
            <div>
              <h3 className={`text-xl font-semibold ${
                isTriggered ? 'text-red-600' : isActive ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                {isTriggered ? 'Kill Switch Triggered' : isActive ? 'Kill Switch Active' : 'Kill Switch Disabled'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isTriggered ? (
                  'Internet traffic is blocked until VPN reconnects'
                ) : isActive ? (
                  mode === 'strict' 
                    ? 'All internet blocked if VPN disconnects' 
                    : 'App-level protection enabled'
                ) : (
                  'Your traffic may be exposed if VPN disconnects'
                )}
              </p>
            </div>
          </div>

          <div className={`status-badge ${isTriggered ? 'triggered' : isActive ? 'active' : 'inactive'}`}>
            {isTriggered ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                Triggered
              </>
            ) : isActive ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Protected
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Unprotected
              </>
            )}
          </div>
        </div>

        {isTriggered && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">VPN Connection Lost</p>
              <p className="text-xs text-red-600">All internet traffic has been blocked to protect your privacy</p>
            </div>
            <Button size="sm" variant="destructive">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect VPN
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EventItemProps {
  event: KillSwitchEvent;
}

function EventItem({ event }: EventItemProps) {
  const getEventIcon = () => {
    switch (event.eventType) {
      case 'activated': return ShieldAlert;
      case 'deactivated': return ShieldCheck;
      case 'blocked': return XCircle;
      default: return Info;
    }
  };
  
  const getEventColor = () => {
    switch (event.eventType) {
      case 'activated': return 'text-red-500';
      case 'deactivated': return 'text-green-500';
      case 'blocked': return 'text-orange-500';
      default: return 'text-blue-500';
    }
  };

  const EventIcon = getEventIcon();

  return (
    <div className="event-item">
      <div className={`event-icon ${getEventColor()}`}>
        <EventIcon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm capitalize">{event.eventType}</p>
        <p className="text-xs text-muted-foreground">
          {event.reason}
          {event.appBlocked && <span> (blocked: {event.appBlocked})</span>}
        </p>
      </div>
      <span className="text-xs text-muted-foreground">
        {formatTimeAgo(event.timestamp)}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface KillSwitchPanelProps {
  onClose?: () => void;
}

export function KillSwitchPanel({ onClose: _onClose }: KillSwitchPanelProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isTriggered, setIsTriggered] = useState(false);
  const [mode, setMode] = useState<KillSwitchMode>('strict');
  const [allowedApps, setAllowedApps] = useState<SplitTunnelingApp[]>([]);
  const [events, setEvents] = useState<KillSwitchEvent[]>([]);
  const [showAddApp, setShowAddApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load config from backend
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const config = await invoke<KillSwitchConfig>('get_killswitch_config');
        setIsEnabled(config.enabled);
        setIsTriggered(config.triggered);
        setMode(config.mode as KillSwitchMode);
        setAllowedApps(config.allowedApps);
        setEvents(config.events);
      } catch (error) {
        log.error('Failed to load kill switch config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load kill switch configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [toast]);

  // Toggle kill switch
  const handleToggleKillSwitch = useCallback(async (enabled: boolean) => {
    try {
      await invoke('toggle_kill_switch', { enabled });
      setIsEnabled(enabled);
      if (!enabled) {
        setIsTriggered(false);
      }
      toast({
        title: enabled ? 'Kill Switch Enabled' : 'Kill Switch Disabled',
        description: enabled 
          ? 'Your traffic will be blocked if VPN disconnects' 
          : 'Warning: Your traffic may be exposed if VPN disconnects',
        variant: enabled ? 'default' : 'destructive',
      });
    } catch (error) {
      log.error('Failed to toggle kill switch:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle kill switch',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Change mode
  const handleModeChange = useCallback(async (newMode: KillSwitchMode) => {
    try {
      await invoke('toggle_killswitch_mode', { mode: newMode });
      setMode(newMode);
      toast({
        title: 'Mode Changed',
        description: newMode === 'strict' 
          ? 'Strict mode: All traffic blocked when VPN is off'
          : 'App mode: Only selected apps are protected',
      });
    } catch (error) {
      log.error('Failed to change mode:', error);
      toast({
        title: 'Error',
        description: 'Failed to change mode',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Remove allowed app
  const handleRemoveApp = useCallback(async (appId: string) => {
    try {
      await invoke('remove_killswitch_allowed_app', { appId });
      setAllowedApps(prev => prev.filter(a => a.id !== appId));
    } catch (error) {
      log.error('Failed to remove app:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove app',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Simulate kill switch trigger for demo
  const simulateTrigger = useCallback(() => {
    setIsTriggered(true);
    toast({
      title: 'Kill Switch Triggered',
      description: 'VPN disconnected - internet traffic blocked',
      variant: 'destructive',
    });
  }, [toast]);

  const simulateReconnect = useCallback(() => {
    setIsTriggered(false);
    toast({
      title: 'VPN Reconnected',
      description: 'Internet traffic restored',
    });
  }, [toast]);

  if (loading) {
    return (
      <div className="kill-switch-panel flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="kill-switch-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-3">
          <div className={`header-icon ${isEnabled ? (isTriggered ? 'triggered' : 'enabled') : 'disabled'}`}>
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Kill Switch</h2>
            <p className="text-sm text-muted-foreground">
              Block all internet if VPN disconnects
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="killswitch-toggle" className="text-sm font-medium">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Label>
            <Switch
              id="killswitch-toggle"
              checked={isEnabled}
              onCheckedChange={handleToggleKillSwitch}
            />
          </div>
          {/* Demo buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={isTriggered ? simulateReconnect : simulateTrigger}
              disabled={!isEnabled}
            >
              {isTriggered ? 'Simulate Reconnect' : 'Simulate Disconnect'}
            </Button>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <KillSwitchStatus
        isActive={isEnabled}
        isTriggered={isTriggered}
        mode={mode}
      />

      {/* Warning if disabled */}
      {!isEnabled && (
        <Card className="border-yellow-200 bg-yellow-50 mt-4">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">Kill Switch Disabled</p>
              <p className="text-sm text-yellow-700">
                Your internet traffic may be exposed if VPN connection drops
              </p>
            </div>
            <Button onClick={() => handleToggleKillSwitch(true)}>
              Enable Protection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mode Selection */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Kill Switch Mode</CardTitle>
          <CardDescription>
            Choose how the kill switch should protect your traffic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={mode} onValueChange={(v) => handleModeChange(v as KillSwitchMode)} className="space-y-3">
            <div className={`mode-card ${mode === 'strict' ? 'selected' : ''}`}>
              <RadioGroupItem value="strict" id="strict" />
              <div className="flex-1">
                <Label htmlFor="strict" className="font-medium cursor-pointer flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Strict Mode
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Block all internet traffic when VPN is disconnected. Most secure option.
                </p>
              </div>
              <Badge variant={mode === 'strict' ? 'default' : 'outline'}>Recommended</Badge>
            </div>
            
            <div className={`mode-card ${mode === 'app' ? 'selected' : ''}`}>
              <RadioGroupItem value="app" id="app" />
              <div className="flex-1">
                <Label htmlFor="app" className="font-medium cursor-pointer flex items-center gap-2">
                  <AppWindow className="h-4 w-4 text-blue-500" />
                  App Mode
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Only block traffic for selected apps. Other apps can bypass the kill switch.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Allowed Apps (only in app mode) */}
      {mode === 'app' && (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Allowed Apps</CardTitle>
                <CardDescription>
                  These apps can access the internet even when kill switch is triggered
                </CardDescription>
              </div>
              <Dialog open={showAddApp} onOpenChange={setShowAddApp}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add App
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Allowed App</DialogTitle>
                    <DialogDescription>
                      This app will bypass the kill switch when triggered
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      App selection coming soon...
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddApp(false)}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {allowedApps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AppWindow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No apps allowed</p>
                <p className="text-sm">All apps will be blocked when kill switch triggers</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allowedApps.map(app => (
                  <div key={app.id} className="allowed-app-item">
                    <AppWindow className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{app.name}</span>
                      {app.isSystem && (
                        <Badge variant="outline" className="ml-2 text-xs">System</Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveApp(app.id)}
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
      )}

      {/* Event History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Event History
          </CardTitle>
          <CardDescription>
            Recent kill switch activations and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <div className="space-y-2">
              {events.map(event => (
                <EventItem key={event.id} event={event} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            How Kill Switch Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="how-it-works-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4 className="font-medium">VPN Disconnects</h4>
                <p className="text-sm text-muted-foreground">
                  Network change or server issue causes VPN to drop
                </p>
              </div>
            </div>
            <div className="how-it-works-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4 className="font-medium">Kill Switch Activates</h4>
                <p className="text-sm text-muted-foreground">
                  Immediately blocks all internet traffic
                </p>
              </div>
            </div>
            <div className="how-it-works-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4 className="font-medium">VPN Reconnects</h4>
                <p className="text-sm text-muted-foreground">
                  Traffic resumes through encrypted VPN tunnel
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default KillSwitchPanel;
