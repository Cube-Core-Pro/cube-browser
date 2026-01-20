"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('VPNElite');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress as _Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider as _Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label as _Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Globe,
  Server,
  Wifi as _Wifi,
  WifiOff as _WifiOff,
  Lock,
  Unlock as _Unlock,
  Zap,
  Activity,
  Download,
  Upload,
  MapPin as _MapPin,
  Star,
  StarOff,
  Search,
  RefreshCw,
  Settings,
  ChevronRight as _ChevronRight,
  ChevronDown as _ChevronDown,
  Clock as _Clock,
  AlertTriangle as _AlertTriangle,
  CheckCircle as _CheckCircle,
  XCircle as _XCircle,
  Ban,
  Eye,
  EyeOff,
  Network,
  Layers,
  Filter as _Filter,
  SplitSquareHorizontal,
  Link2 as _Link2,
  Unlink2 as _Unlink2,
  Power,
  PowerOff,
  TrendingUp as _TrendingUp,
  TrendingDown as _TrendingDown,
  MonitorSmartphone,
  Router,
} from 'lucide-react';
import {
  VPNServer,
  VPNConnection,
  VPNConnectionStatus as _VPNConnectionStatus,
  VPNProtocol as _VPNProtocol,
  ThreatProtection as _ThreatProtection,
  ThreatStats as _ThreatStats,
  KillSwitch as _KillSwitch,
  VPNStats,
} from '@/types/vpn-elite';
import './VPNElite.css';

// ============================================================================
// BACKEND TYPES
// ============================================================================

interface BackendVPNServer {
  id: string;
  name: string;
  country: string;
  city: string;
  ip: string;
  protocol: string;
  load: number;
  ping: number;
  premium: boolean;
}

interface BackendVPNStatus {
  connected: boolean;
  server: BackendVPNServer | null;
  publicIp: string;
  connectionTime: number | null;
  bytesSent: number;
  bytesReceived: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSec: number): string => {
  return formatBytes(bytesPerSec) + '/s';
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

const getLoadColor = (load: number): string => {
  if (load < 50) return 'text-green-500';
  if (load < 75) return 'text-yellow-500';
  return 'text-red-500';
};

const getCountryFlag = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ServerCardProps {
  server: VPNServer;
  isConnected: boolean;
  onConnect: (server: VPNServer) => void;
  onToggleFavorite: (server: VPNServer) => void;
}

function ServerCard({ server, isConnected, onConnect, onToggleFavorite }: ServerCardProps) {
  return (
    <Card className={`server-card ${isConnected ? 'connected' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getCountryFlag(server.countryCode)}</span>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{server.name}</span>
              {server.isRecommended && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                  <Zap className="h-3 w-3 mr-1" />
                  Fast
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{server.city}</span>
              <span className={getLoadColor(server.load)}>{server.load}% load</span>
              <span>{server.latency}ms</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(server); }}
              className={server.isFavorite ? 'text-yellow-500' : 'text-muted-foreground'}
            >
              {server.isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              onClick={() => onConnect(server)}
              variant={isConnected ? 'secondary' : 'default'}
            >
              {isConnected ? 'Connected' : 'Connect'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ConnectionStatusProps {
  connection: VPNConnection | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

function ConnectionStatus({ connection, onConnect, onDisconnect }: ConnectionStatusProps) {
  const isConnected = connection?.status === 'connected';
  const isConnecting = connection?.status === 'connecting';
  
  const connectedDuration = connection?.connectedAt 
    ? Math.floor((Date.now() - connection.connectedAt.getTime()) / 1000)
    : 0;

  return (
    <Card className={`connection-status-card ${isConnected ? 'connected' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`status-icon ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? (
                <ShieldCheck className="h-10 w-10" />
              ) : (
                <ShieldOff className="h-10 w-10" />
              )}
            </div>
            
            <div>
              <h3 className={`text-xl font-semibold ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`}>
                {isConnected ? 'Protected' : 'Not Protected'}
              </h3>
              {isConnected && connection ? (
                <div className="text-sm text-muted-foreground">
                  <span>{connection.server.name}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDuration(connectedDuration)}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Connect to a server to protect your connection
                </p>
              )}
            </div>
          </div>

          <Button
            size="lg"
            onClick={isConnected ? onDisconnect : onConnect}
            variant={isConnected ? 'outline' : 'default'}
            disabled={isConnecting}
            className="min-w-[120px]"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : isConnected ? (
              <>
                <PowerOff className="h-4 w-4 mr-2" />
                Disconnect
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Quick Connect
              </>
            )}
          </Button>
        </div>

        {isConnected && connection && (
          <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t">
            <div className="text-center">
              <Download className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-sm font-medium">{formatSpeed(connection.downloadSpeed)}</p>
              <p className="text-xs text-muted-foreground">Download</p>
            </div>
            <div className="text-center">
              <Upload className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-sm font-medium">{formatSpeed(connection.uploadSpeed)}</p>
              <p className="text-xs text-muted-foreground">Upload</p>
            </div>
            <div className="text-center">
              <Activity className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <p className="text-sm font-medium">{formatBytes(connection.bytesReceived + connection.bytesSent)}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <Globe className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-sm font-medium font-mono">{connection.publicIP}</p>
              <p className="text-xs text-muted-foreground">Public IP</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COUNTRY CODE MAPPING
// ============================================================================

const countryCodeMap: Record<string, string> = {
  'United States': 'US',
  'United Kingdom': 'GB',
  'Germany': 'DE',
  'Japan': 'JP',
  'Australia': 'AU',
  'Canada': 'CA',
  'France': 'FR',
  'Netherlands': 'NL',
  'Singapore': 'SG',
  'Switzerland': 'CH',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Ireland': 'IE',
  'Spain': 'ES',
  'Italy': 'IT',
  'Brazil': 'BR',
  'Mexico': 'MX',
  'South Korea': 'KR',
  'India': 'IN',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface VPNEliteProps {
  onClose?: () => void;
}

export function VPNElite({ onClose: _onClose }: VPNEliteProps) {
  const [servers, setServers] = useState<VPNServer[]>([]);
  const [connection, setConnection] = useState<VPNConnection | null>(null);
  const [stats, _setStats] = useState<VPNStats>({
    totalDataTransferred: 0,
    totalConnectionTime: 0,
    averageSpeed: 0,
    serversUsed: 0,
    countriesConnected: [],
    threatStats: {
      malwareBlocked: 0,
      trackersBlocked: 0,
      adsBlocked: 0,
      phishingBlocked: 0,
      cryptoMinersBlocked: 0,
      totalThreatsBlocked: 0,
      lastUpdated: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
    },
    lastConnectionAt: new Date(),
    currentSession: undefined,
  });
  const [_loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [threatProtectionEnabled, setThreatProtectionEnabled] = useState(true);
  const [killSwitchEnabled, setKillSwitchEnabled] = useState(true);
  const [splitTunnelingEnabled, setSplitTunnelingEnabled] = useState(false);
  const { toast } = useToast();

  // Load data from backend on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load servers from backend
        const backendServers = await invoke<BackendVPNServer[]>('get_vpn_servers');
        const transformedServers: VPNServer[] = backendServers.map(s => ({
          id: s.id,
          name: s.name,
          country: s.country,
          countryCode: countryCodeMap[s.country] || s.country.slice(0, 2).toUpperCase(),
          city: s.city,
          hostname: `${s.id}.cube.vpn`,
          ip: s.ip,
          load: s.load,
          latency: s.ping,
          features: s.premium ? ['dedicated_ip' as const] : ['streaming' as const],
          groups: s.premium ? ['Premium'] : ['Standard'],
          isFavorite: false,
          isRecommended: s.load < 40,
        }));
        setServers(transformedServers);

        // Load current status
        const status = await invoke<BackendVPNStatus>('get_vpn_status');
        if (status.connected && status.server) {
          setConnection({
            id: `conn-${Date.now()}`,
            server: {
              id: status.server.id,
              name: status.server.name,
              country: status.server.country,
              countryCode: countryCodeMap[status.server.country] || 'US',
              city: status.server.city,
              hostname: `${status.server.id}.cube.vpn`,
              ip: status.server.ip,
              load: status.server.load,
              latency: status.server.ping,
              features: [],
              groups: ['Standard'],
              isFavorite: false,
              isRecommended: false,
            },
            protocol: 'wireguard',
            status: 'connected',
            connectedAt: status.connectionTime ? new Date(Date.now() - status.connectionTime * 1000) : new Date(),
            bytesReceived: status.bytesReceived,
            bytesSent: status.bytesSent,
            downloadSpeed: 0,
            uploadSpeed: 0,
            publicIP: status.publicIp,
            virtualIP: '10.8.0.2',
          });
        }
      } catch (error) {
        log.error('Failed to load VPN data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load VPN servers',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleConnect = useCallback(async (server: VPNServer) => {
    try {
      const status = await invoke<BackendVPNStatus>('connect_vpn', { serverId: server.id });
      setConnection({
        id: `conn-${Date.now()}`,
        server,
        protocol: 'wireguard',
        status: 'connected',
        connectedAt: new Date(),
        bytesReceived: status.bytesReceived,
        bytesSent: status.bytesSent,
        downloadSpeed: 0,
        uploadSpeed: 0,
        publicIP: status.publicIp,
        virtualIP: '10.8.0.2',
      });
      
      toast({
        title: 'Connected',
        description: `Connected to ${server.name}`,
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect to VPN',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleDisconnect = useCallback(async () => {
    try {
      await invoke('disconnect_vpn');
      setConnection(null);
      toast({
        title: 'Disconnected',
        description: 'VPN connection closed',
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleQuickConnect = useCallback(async () => {
    const recommendedServer = servers.find(s => s.isRecommended) || servers[0];
    if (recommendedServer) {
      await handleConnect(recommendedServer);
    }
  }, [servers, handleConnect]);

  const handleToggleFavorite = useCallback((server: VPNServer) => {
    setServers(prev => prev.map(s => 
      s.id === server.id ? { ...s, isFavorite: !s.isFavorite } : s
    ));
  }, []);

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          server.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          server.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || server.groups.includes(selectedGroup);
    return matchesSearch && matchesGroup;
  });

  const favoriteServers = servers.filter(s => s.isFavorite);
  const serverGroups = ['all', 'Standard', 'P2P', 'Double VPN', 'Obfuscated', 'Dedicated IP'];

  return (
    <div className="vpn-elite">
      {/* Header */}
      <div className="vpn-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">VPN Elite</h2>
            <p className="text-sm text-muted-foreground">
              Secure your connection with enterprise-grade protection
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <ConnectionStatus
        connection={connection}
        onConnect={handleQuickConnect}
        onDisconnect={handleDisconnect}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 my-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.threatStats.totalThreatsBlocked.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Threats Blocked</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <Ban className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.threatStats.adsBlocked.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Ads Blocked</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatBytes(stats.totalDataTransferred)}</p>
              <p className="text-xs text-muted-foreground">Data Protected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.countriesConnected.length}</p>
              <p className="text-xs text-muted-foreground">Countries Used</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="servers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="servers">
            <Server className="h-4 w-4 mr-2" />
            Servers
          </TabsTrigger>
          <TabsTrigger value="features">
            <Zap className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="protection">
            <ShieldAlert className="h-4 w-4 mr-2" />
            Threat Protection
          </TabsTrigger>
          <TabsTrigger value="meshnet">
            <Network className="h-4 w-4 mr-2" />
            Meshnet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servers">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search servers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All servers" />
                    </SelectTrigger>
                    <SelectContent>
                      {serverGroups.map(group => (
                        <SelectItem key={group} value={group}>
                          {group === 'all' ? 'All Servers' : group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Favorites Section */}
              {favoriteServers.length > 0 && selectedGroup === 'all' && !searchQuery && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Favorites</h4>
                  <div className="space-y-2">
                    {favoriteServers.map(server => (
                      <ServerCard
                        key={server.id}
                        server={server}
                        isConnected={connection?.server.id === server.id}
                        onConnect={handleConnect}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Servers */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredServers.map(server => (
                    <ServerCard
                      key={server.id}
                      server={server}
                      isConnected={connection?.server.id === server.id}
                      onConnect={handleConnect}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-500" />
                  Kill Switch
                </CardTitle>
                <CardDescription>
                  Block internet if VPN disconnects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      {killSwitchEnabled ? 'Your traffic is protected' : 'Protection disabled'}
                    </p>
                  </div>
                  <Switch checked={killSwitchEnabled} onCheckedChange={setKillSwitchEnabled} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <SplitSquareHorizontal className="h-5 w-5 text-blue-500" />
                  Split Tunneling
                </CardTitle>
                <CardDescription>
                  Choose which apps use VPN
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      {splitTunnelingEnabled ? '3 apps excluded' : 'All traffic via VPN'}
                    </p>
                  </div>
                  <Switch checked={splitTunnelingEnabled} onCheckedChange={setSplitTunnelingEnabled} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-500" />
                  Double VPN
                </CardTitle>
                <CardDescription>
                  Route through two servers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Configure Double VPN
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <EyeOff className="h-5 w-5 text-orange-500" />
                  Obfuscated Servers
                </CardTitle>
                <CardDescription>
                  Bypass VPN blocks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Obfuscated Servers
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="protection">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Threat Protection</CardTitle>
                  <CardDescription>
                    Block malware, trackers, and ads
                  </CardDescription>
                </div>
                <Switch checked={threatProtectionEnabled} onCheckedChange={setThreatProtectionEnabled} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted text-center">
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">{stats.threatStats.malwareBlocked}</p>
                  <p className="text-xs text-muted-foreground">Malware Blocked</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold">{stats.threatStats.trackersBlocked}</p>
                  <p className="text-xs text-muted-foreground">Trackers Blocked</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <Ban className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{stats.threatStats.adsBlocked}</p>
                  <p className="text-xs text-muted-foreground">Ads Blocked</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Block Malware', desc: 'Prevent malicious downloads', enabled: true },
                  { label: 'Block Trackers', desc: 'Stop online tracking', enabled: true },
                  { label: 'Block Ads', desc: 'Remove intrusive advertisements', enabled: true },
                  { label: 'Block Phishing', desc: 'Protect against fake websites', enabled: true },
                  { label: 'Block Crypto Miners', desc: 'Stop browser mining scripts', enabled: true },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.enabled} disabled={!threatProtectionEnabled} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meshnet">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-5 w-5 text-cyan-500" />
                Meshnet
              </CardTitle>
              <CardDescription>
                Create secure private networks between your devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Router className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Devices in Meshnet</h3>
                <p className="text-muted-foreground mb-4">
                  Add devices to create your own private network
                </p>
                <Button>
                  <MonitorSmartphone className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default VPNElite;
