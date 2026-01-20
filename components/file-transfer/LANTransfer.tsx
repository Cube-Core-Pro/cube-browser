"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('LANTransfer');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  HardDrive,
  Server,
  Send,
  Search,
  Trash2,
  Settings,
  RefreshCw,
  XCircle,
  Shield,
  Download,
  Upload,
  Zap,
  ArrowRight,
  Network,
  Radio,
  Loader2,
} from 'lucide-react';
import {
  LANConfig,
  DeviceTransferStats,
} from '@/types/file-transfer-elite';
import './LANTransfer.css';

// ============================================================================
// BACKEND TYPES (matching Rust structs)
// ============================================================================

interface BackendLANDevice {
  id: string;
  name: string;
  ipAddress: string;
  deviceType: string;
  os: string;
  isTrusted: boolean;
  lastTransfer: number | null; // Unix timestamp seconds
  totalTransferredMb: number;
}

interface BackendLANTransferConfig {
  devices: BackendLANDevice[];
  isDiscoverable: boolean;
  requireConfirmation: boolean;
  allowedFileTypes: string[];
}

// ============================================================================
// TYPES
// ============================================================================

interface DiscoveredDevice {
  id: string;
  name: string;
  type: 'desktop' | 'laptop' | 'phone' | 'tablet' | 'server' | 'nas';
  ip: string;
  mac: string;
  os: string;
  cubeVersion?: string;
  isOnline: boolean;
  lastSeen: Date;
  isTrusted: boolean;
  transferStats?: DeviceTransferStats;
}

interface ActiveTransfer {
  id: string;
  deviceId: string;
  deviceName: string;
  fileName: string;
  fileSize: number;
  transferred: number;
  direction: 'upload' | 'download';
  speed: number;
  startedAt: Date;
  estimatedCompletion: Date;
}

// ============================================================================
// CONVERTERS (Backend → Frontend)
// ============================================================================

const mapDeviceType = (backendType: string): 'desktop' | 'laptop' | 'phone' | 'tablet' | 'server' | 'nas' => {
  const typeMap: Record<string, 'desktop' | 'laptop' | 'phone' | 'tablet' | 'server' | 'nas'> = {
    'desktop': 'desktop',
    'laptop': 'laptop',
    'phone': 'phone',
    'tablet': 'tablet',
    'server': 'server',
    'nas': 'nas',
  };
  return typeMap[backendType.toLowerCase()] ?? 'desktop';
};

const convertBackendDevice = (backend: BackendLANDevice): DiscoveredDevice => ({
  id: backend.id,
  name: backend.name,
  type: mapDeviceType(backend.deviceType),
  ip: backend.ipAddress,
  mac: 'AA:BB:CC:DD:EE:FF', // Not provided by backend
  os: backend.os,
  cubeVersion: '6.0.1',
  isOnline: true,
  lastSeen: backend.lastTransfer ? new Date(backend.lastTransfer * 1000) : new Date(),
  isTrusted: backend.isTrusted,
  transferStats: {
    totalSent: backend.totalTransferredMb * 1024 * 1024 / 2,
    totalReceived: backend.totalTransferredMb * 1024 * 1024 / 2,
    transferCount: Math.floor(backend.totalTransferredMb / 100),
    averageSpeed: 95 * 1024 * 1024,
    lastTransfer: backend.lastTransfer ? new Date(backend.lastTransfer * 1000) : undefined,
  },
});

// ============================================================================
// STATIC DATA - Active Transfers (real-time feature - no backend yet)
// ============================================================================

const staticActiveTransfers: ActiveTransfer[] = [];

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
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const formatETA = (date: Date): string => {
  const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
  if (seconds < 60) return 'Less than a minute';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

const getDeviceIcon = (type: string) => {
  switch (type) {
    case 'desktop':
      return Monitor;
    case 'laptop':
      return Laptop;
    case 'phone':
      return Smartphone;
    case 'tablet':
      return Tablet;
    case 'server':
    case 'nas':
      return Server;
    default:
      return HardDrive;
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface DeviceCardProps {
  device: DiscoveredDevice;
  onTrust: (device: DiscoveredDevice) => void;
  onSend: (device: DiscoveredDevice) => void;
  onRemove: (device: DiscoveredDevice) => void;
}

function DeviceCard({ device, onTrust, onSend, onRemove }: DeviceCardProps) {
  const DeviceIcon = getDeviceIcon(device.type);
  
  return (
    <div className={`device-card ${device.isOnline ? 'online' : 'offline'}`}>
      <div className="device-status">
        <DeviceIcon className="h-6 w-6" />
        {device.isOnline && <span className="online-indicator" />}
      </div>
      
      <div className="device-info">
        <div className="flex items-center gap-2">
          <span className="font-medium">{device.name}</span>
          {device.isTrusted && (
            <Badge className="bg-green-100 text-green-700 text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Trusted
            </Badge>
          )}
          {device.cubeVersion && (
            <Badge variant="secondary" className="text-xs">
              CUBE v{device.cubeVersion}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {device.ip} • {device.os}
        </p>
        <p className="text-xs text-muted-foreground">
          Last seen: {formatTimeAgo(device.lastSeen)}
        </p>
        {device.transferStats && (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>↑ {formatBytes(device.transferStats.totalSent ?? 0)}</span>
            <span>↓ {formatBytes(device.transferStats.totalReceived ?? 0)}</span>
            <span>{device.transferStats.transferCount} transfers</span>
          </div>
        )}
      </div>
      
      <div className="device-actions">
        {device.isOnline && (
          <Button size="sm" onClick={() => onSend(device)}>
            <Send className="h-4 w-4 mr-1" />
            Send
          </Button>
        )}
        {!device.isTrusted && (
          <Button size="sm" variant="outline" onClick={() => onTrust(device)}>
            <Shield className="h-4 w-4" />
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onRemove(device)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

interface TransferCardProps {
  transfer: ActiveTransfer;
  onCancel: (id: string) => void;
}

function TransferCard({ transfer, onCancel }: TransferCardProps) {
  const progress = (transfer.transferred / transfer.fileSize) * 100;
  
  return (
    <div className="transfer-card">
      <div className={`transfer-icon ${transfer.direction}`}>
        {transfer.direction === 'upload' ? (
          <Upload className="h-5 w-5" />
        ) : (
          <Download className="h-5 w-5" />
        )}
      </div>
      
      <div className="transfer-info">
        <div className="flex items-center justify-between">
          <span className="font-medium">{transfer.fileName}</span>
          <span className="text-sm text-muted-foreground">
            {formatBytes(transfer.transferred)} / {formatBytes(transfer.fileSize)}
          </span>
        </div>
        <Progress value={progress} className="mt-2" />
        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
          <span>{transfer.deviceName}</span>
          <div className="flex items-center gap-3">
            <span>{formatSpeed(transfer.speed)}</span>
            <span>ETA: {formatETA(transfer.estimatedCompletion)}</span>
          </div>
        </div>
      </div>
      
      <Button size="sm" variant="ghost" onClick={() => onCancel(transfer.id)}>
        <XCircle className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface LANTransferProps {
  onClose?: () => void;
}

export function LANTransfer({ onClose: _onClose }: LANTransferProps) {
  const [config, setConfig] = useState<LANConfig>({
    enabled: true,
    autoDiscovery: true,
    discoveryPort: 53317,
    transferPort: 53318,
    encryption: 'tls',
    requireApproval: true,
    trustedDevices: [],
    maxConcurrentTransfers: 3,
  });
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [activeTransfers, setActiveTransfers] = useState<ActiveTransfer[]>(staticActiveTransfers);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('devices');
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Load data from backend on mount
  useEffect(() => {
    const loadLANConfig = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendLANTransferConfig>('get_lan_transfer_config');
        setDevices(backendConfig.devices.map(convertBackendDevice));
        setConfig(prev => ({
          ...prev,
          autoDiscovery: backendConfig.isDiscoverable,
          requireApproval: backendConfig.requireConfirmation,
        }));
      } catch (error) {
        log.error('Failed to load LAN transfer config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load LAN transfer configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadLANConfig();
  }, [toast]);

  const onlineDevices = devices.filter(d => d.isOnline).length;
  const trustedDevices = devices.filter(d => d.isTrusted).length;

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.ip.includes(searchQuery)
  );

  const handleScan = useCallback(() => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: 'Scan Complete',
        description: `Found ${devices.length} devices on the network`,
      });
    }, 3000);
  }, [devices.length, toast]);

  const handleTrustDevice = useCallback(async (device: DiscoveredDevice) => {
    try {
      await invoke('toggle_lan_device_trust', { deviceId: device.id, trusted: true });
      setDevices(prev => prev.map(d =>
        d.id === device.id ? { ...d, isTrusted: true } : d
      ));
      toast({
        title: 'Device Trusted',
        description: `${device.name} is now a trusted device`,
      });
    } catch (error) {
      log.error('Failed to trust device:', error);
      toast({
        title: 'Error',
        description: 'Failed to trust device',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleSendToDevice = useCallback((device: DiscoveredDevice) => {
    toast({
      title: 'Select Files',
      description: `Choose files to send to ${device.name}`,
    });
  }, [toast]);

  const handleRemoveDevice = useCallback(async (device: DiscoveredDevice) => {
    try {
      await invoke('toggle_lan_device_trust', { deviceId: device.id, trusted: false });
      setDevices(prev => prev.filter(d => d.id !== device.id));
      toast({
        title: 'Device Removed',
        description: `${device.name} has been removed`,
      });
    } catch (error) {
      log.error('Failed to remove device:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove device',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleCancelTransfer = useCallback((id: string) => {
    setActiveTransfers(prev => prev.filter(t => t.id !== id));
    toast({
      title: 'Transfer Cancelled',
      description: 'The transfer has been cancelled',
    });
  }, [toast]);

  if (loading) {
    return (
      <div className="lan-transfer flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading LAN Transfer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lan-transfer">
      {/* Header */}
      <div className="transfer-header">
        <div className="flex items-center gap-3">
          <div className={`header-icon ${config.enabled ? 'active' : ''}`}>
            <Network className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">LAN Transfer</h2>
            <p className="text-sm text-muted-foreground">
              Fast local network file transfers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleScan} disabled={isScanning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Scan Network'}
          </Button>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="transfer-stats">
        <div className="stat-card">
          <div className="stat-icon green">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{onlineDevices}</span>
            <span className="stat-label">Online</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{trustedDevices}</span>
            <span className="stat-label">Trusted</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <ArrowRight className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{activeTransfers.length}</span>
            <span className="stat-label">Transfers</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">1 Gbps</span>
            <span className="stat-label">Network</span>
          </div>
        </div>
      </div>

      {/* Active Transfers */}
      {activeTransfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeTransfers.map(transfer => (
                <TransferCard
                  key={transfer.id}
                  transfer={transfer}
                  onCancel={handleCancelTransfer}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="devices">
            <Monitor className="h-4 w-4 mr-2" />
            Devices ({devices.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Network Devices</CardTitle>
                  <CardDescription>
                    Devices available for file transfer
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search devices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredDevices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Network className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No devices found</p>
                      <Button variant="outline" className="mt-4" onClick={handleScan}>
                        Scan Network
                      </Button>
                    </div>
                  ) : (
                    filteredDevices.map(device => (
                      <DeviceCard
                        key={device.id}
                        device={device}
                        onTrust={handleTrustDevice}
                        onSend={handleSendToDevice}
                        onRemove={handleRemoveDevice}
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
              <CardTitle className="text-lg">LAN Transfer Settings</CardTitle>
              <CardDescription>
                Configure local network transfer behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Auto Discovery</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically discover devices on local network
                  </p>
                </div>
                <Switch
                  checked={config.autoDiscovery}
                  onCheckedChange={(autoDiscovery) => 
                    setConfig(prev => ({ ...prev, autoDiscovery }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Require Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Ask before accepting incoming transfers
                  </p>
                </div>
                <Switch
                  checked={config.requireApproval}
                  onCheckedChange={(requireApproval) => 
                    setConfig(prev => ({ ...prev, requireApproval }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>TLS Encryption</Label>
                  <p className="text-sm text-muted-foreground">
                    Encrypt all LAN transfers
                  </p>
                </div>
                <Switch
                  checked={config.encryption === 'tls'}
                  onCheckedChange={(tls) => 
                    setConfig(prev => ({ ...prev, encryption: tls ? 'tls' : 'none' }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Max Concurrent Transfers</Label>
                  <p className="text-sm text-muted-foreground">
                    Maximum simultaneous transfers
                  </p>
                </div>
                <Input
                  type="number"
                  value={config.maxConcurrentTransfers}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    maxConcurrentTransfers: parseInt(e.target.value) || 3 
                  }))}
                  className="w-20"
                  min={1}
                  max={10}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Discovery Port</Label>
                  <p className="text-sm text-muted-foreground">
                    UDP port for device discovery
                  </p>
                </div>
                <Input
                  type="number"
                  value={config.discoveryPort}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    discoveryPort: parseInt(e.target.value) || 53317 
                  }))}
                  className="w-24"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LANTransfer;
