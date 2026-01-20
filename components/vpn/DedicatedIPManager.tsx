"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription as _CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input as _Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress as _Progress } from '@/components/ui/progress';
import { ScrollArea as _ScrollArea } from '@/components/ui/scroll-area';
import { Tabs as _Tabs, TabsContent as _TabsContent, TabsList as _TabsList, TabsTrigger as _TabsTrigger } from '@/components/ui/tabs';
import { Switch as _Switch } from '@/components/ui/switch';
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
  MapPin,
  Globe,
  Server as _Server,
  Shield,
  ShieldCheck,
  Lock,
  Key,
  Copy,
  RefreshCw,
  Settings as _Settings,
  Plus,
  Trash2,
  CheckCircle,
  XCircle as _XCircle,
  Clock as _Clock,
  Activity as _Activity,
  TrendingUp as _TrendingUp,
  BarChart3 as _BarChart3,
  Eye,
  EyeOff,
  Link2,
  Unlink2,
  AlertCircle as _AlertCircle,
  Info,
  HelpCircle as _HelpCircle,
  Zap as _Zap,
  Star,
  Loader2,
} from 'lucide-react';
import { DedicatedIP } from '@/types/vpn-elite';
import { logger } from '@/lib/services/logger-service';
import './DedicatedIPManager.css';

const log = logger.scope('DedicatedIPManager');

// ============================================================================
// TYPES FROM BACKEND
// ============================================================================

interface DedicatedIPLocation {
  country: string;
  countryCode: string;
  cities: string[];
}

interface DedicatedIPConfig {
  dedicatedIps: DedicatedIP[];
  availableLocations: DedicatedIPLocation[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getCountryFlag = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const formatDaysRemaining = (expiresAt: number | Date): number => {
  const expireTime = typeof expiresAt === 'number' ? expiresAt * 1000 : new Date(expiresAt).getTime();
  return Math.floor((expireTime - Date.now()) / (24 * 60 * 60 * 1000));
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface DedicatedIPCardProps {
  ip: DedicatedIP;
  onConnect: (ip: DedicatedIP) => void;
  onRefresh: (ip: DedicatedIP) => void;
  onDelete: (ip: DedicatedIP) => void;
}

function DedicatedIPCard({ ip, onConnect, onRefresh, onDelete }: DedicatedIPCardProps) {
  const [showIP, setShowIP] = useState(false);
  const daysRemaining = formatDaysRemaining(ip.expiresAt);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(ip.ip);
  };

  return (
    <Card className={`dedicated-ip-card ${ip.isActive ? 'active' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="ip-flag">
            <span className="text-3xl">{getCountryFlag(ip.countryCode)}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">{ip.city}, {ip.country}</span>
              {ip.isActive && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
            
            <div className="ip-address-row">
              <div className="ip-display">
                <Key className="h-4 w-4 text-muted-foreground" />
                <code className="font-mono text-sm">
                  {showIP ? ip.ip : '•••.•••.•••.•••'}
                </code>
                <Button size="sm" variant="ghost" onClick={() => setShowIP(!showIP)}>
                  {showIP ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="stat-mini">
                <span className="text-lg font-semibold">{ip.usageStats.totalConnections}</span>
                <span className="text-xs text-muted-foreground">Connections</span>
              </div>
              <div className="stat-mini">
                <span className="text-lg font-semibold">{formatBytes(ip.usageStats.totalDataTransferred ?? 0)}</span>
                <span className="text-xs text-muted-foreground">Data</span>
              </div>
              <div className="stat-mini">
                <span className="text-lg font-semibold">{formatDuration(ip.usageStats.averageSessionDuration ?? 0)}</span>
                <span className="text-xs text-muted-foreground">Avg Session</span>
              </div>
              <div className="stat-mini">
                <span className={`text-lg font-semibold ${daysRemaining < 30 ? 'text-orange-500' : ''}`}>
                  {daysRemaining}
                </span>
                <span className="text-xs text-muted-foreground">Days Left</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => onConnect(ip)}
              variant={ip.isActive ? 'outline' : 'default'}
            >
              {ip.isActive ? (
                <>
                  <Unlink2 className="h-4 w-4 mr-2" />
                  Disconnect
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => onRefresh(ip)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDelete(ip)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface DedicatedIPManagerProps {
  onClose?: () => void;
}

export function DedicatedIPManager({ onClose: _onClose }: DedicatedIPManagerProps) {
  const [dedicatedIPs, setDedicatedIPs] = useState<DedicatedIP[]>([]);
  const [availableLocations, setAvailableLocations] = useState<DedicatedIPLocation[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await invoke<DedicatedIPConfig>('get_dedicated_ip_config');
        setDedicatedIPs(config.dedicatedIps);
        setAvailableLocations(config.availableLocations);
      } catch (error) {
        log.error('Failed to load Dedicated IP config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load Dedicated IP configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [toast]);

  const handleConnect = useCallback(async (ip: DedicatedIP) => {
    try {
      const updated = await invoke<DedicatedIP>('activate_dedicated_ip', { ipId: ip.id });
      setDedicatedIPs(prev => prev.map(i => ({
        ...i,
        isActive: i.id === updated.id ? updated.isActive : false,
      })));
      
      toast({
        title: updated.isActive ? 'Connected' : 'Disconnected',
        description: updated.isActive 
          ? `Connected to ${ip.ip}`
          : 'Dedicated IP disconnected',
      });
    } catch (error) {
      log.error('Failed to toggle connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle connection',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleRefresh = useCallback(async (_ip: DedicatedIP) => {
    try {
      const config = await invoke<DedicatedIPConfig>('get_dedicated_ip_config');
      setDedicatedIPs(config.dedicatedIps);
      toast({
        title: 'IP Refreshed',
        description: 'Your dedicated IP statistics have been updated',
      });
    } catch (error) {
      log.error('Failed to refresh:', error);
    }
  }, [toast]);

  const handleDelete = useCallback((ip: DedicatedIP) => {
    setDedicatedIPs(prev => prev.filter(i => i.id !== ip.id));
    toast({
      title: 'IP Removed',
      description: 'Dedicated IP has been released',
    });
  }, [toast]);

  const handleAddIP = useCallback(() => {
    if (!selectedCountry || !selectedCity) {
      toast({
        title: 'Select Location',
        description: 'Please select a country and city',
        variant: 'destructive',
      });
      return;
    }

    const location = availableLocations.find(l => l.countryCode === selectedCountry);
    if (!location) return;

    const newIP: DedicatedIP = {
      id: `dip-${Date.now()}`,
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      country: location.country,
      countryCode: location.countryCode,
      city: selectedCity,
      server: `${location.countryCode.toLowerCase()}-${selectedCity.toLowerCase().replace(/\s/g, '-')}-1.vpn.cube.io`,
      status: 'active',
      isActive: false,
      assignedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      usageStats: {
        totalConnections: 0,
        bytesTransferred: 0,
        totalDataTransferred: 0,
        averageSessionDuration: 0,
        lastUsed: new Date(),
      },
    };

    setDedicatedIPs(prev => [...prev, newIP]);
    setShowAddDialog(false);
    setSelectedCountry('');
    setSelectedCity('');
    
    toast({
      title: 'Dedicated IP Added',
      description: `New IP assigned in ${selectedCity}, ${location.country}`,
    });
  }, [selectedCountry, selectedCity, availableLocations, toast]);

  if (loading) {
    return (
      <div className="dedicated-ip-manager flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const activeIP = dedicatedIPs.find(ip => ip.isActive);
  const selectedLocation = availableLocations.find(l => l.countryCode === selectedCountry);

  return (
    <div className="dedicated-ip-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Dedicated IP</h2>
            <p className="text-sm text-muted-foreground">
              Your personal static IP address
            </p>
          </div>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Get New IP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Get Dedicated IP</DialogTitle>
              <DialogDescription>
                Select a location for your new dedicated IP address
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedCity('');
                  }}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select country...</option>
                  {availableLocations.map(loc => (
                    <option key={loc.countryCode} value={loc.countryCode}>
                      {getCountryFlag(loc.countryCode)} {loc.country}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedLocation && (
                <div className="space-y-2">
                  <Label>City</Label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Select city...</option>
                    {selectedLocation.cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddIP}>
                Get IP
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Dedicated IP</strong> gives you a unique IP address that only you use. 
              Perfect for accessing IP-restricted services, avoiding CAPTCHAs, and maintaining 
              consistent online identity.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Connection */}
      {activeIP && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="active-indicator">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-800">Connected to Dedicated IP</p>
              <p className="text-sm text-green-700">
                {activeIP.city}, {activeIP.country} • {activeIP.ip}
              </p>
            </div>
            <Button variant="outline" onClick={() => handleConnect(activeIP)}>
              Disconnect
            </Button>
          </CardContent>
        </Card>
      )}

      {/* IP List */}
      <div className="space-y-4">
        <h3 className="font-medium">Your Dedicated IPs</h3>
        {dedicatedIPs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Dedicated IPs</h3>
              <p className="text-muted-foreground mb-4">
                Get a dedicated IP for a consistent online presence
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Get Your First IP
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {dedicatedIPs.map(ip => (
              <DedicatedIPCard
                key={ip.id}
                ip={ip}
                onConnect={handleConnect}
                onRefresh={handleRefresh}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Benefits */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Dedicated IP Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="benefit-card">
              <Lock className="h-8 w-8 text-blue-500 mb-2" />
              <h4 className="font-medium">IP Whitelisting</h4>
              <p className="text-sm text-muted-foreground">
                Access services that require IP-based authentication
              </p>
            </div>
            <div className="benefit-card">
              <Shield className="h-8 w-8 text-green-500 mb-2" />
              <h4 className="font-medium">No CAPTCHAs</h4>
              <p className="text-sm text-muted-foreground">
                Avoid verification challenges on websites
              </p>
            </div>
            <div className="benefit-card">
              <Globe className="h-8 w-8 text-purple-500 mb-2" />
              <h4 className="font-medium">Consistent Identity</h4>
              <p className="text-sm text-muted-foreground">
                Same IP address every time you connect
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DedicatedIPManager;
