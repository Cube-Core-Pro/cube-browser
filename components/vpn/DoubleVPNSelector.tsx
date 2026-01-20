"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label as _Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch as _Switch } from '@/components/ui/switch';
import {
  Select as _Select,
  SelectContent as _SelectContent,
  SelectItem as _SelectItem,
  SelectTrigger as _SelectTrigger,
  SelectValue as _SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Layers,
  Shield as _Shield,
  ShieldCheck,
  ShieldAlert as _ShieldAlert,
  Server,
  Globe,
  MapPin as _MapPin,
  ArrowRight,
  ArrowDown as _ArrowDown,
  Lock as _Lock,
  Unlock as _Unlock,
  Activity as _Activity,
  Clock as _Clock,
  Zap,
  Star as _Star,
  StarOff as _StarOff,
  Search,
  RefreshCw as _RefreshCw,
  Settings,
  ChevronRight as _ChevronRight,
  ChevronDown as _ChevronDown,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle as _AlertTriangle,
  Network,
  Route,
  Link2,
  Loader2,
} from 'lucide-react';
import { VPNServer, DoubleVPN as _DoubleVPN, MultiHopServer as _MultiHopServer } from '@/types/vpn-elite';
import { logger } from '@/lib/services/logger-service';
import './DoubleVPNSelector.css';

const log = logger.scope('DoubleVPNSelector');

// ============================================================================
// TYPES FROM BACKEND
// ============================================================================

interface DoubleVPNServer {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  city: string;
  hostname: string;
  ip: string;
  load: number;
  latency: number;
  features: string[];
  groups: string[];
  isFavorite: boolean;
  isRecommended: boolean;
}

interface DoubleVPNPresetRoute {
  id: string;
  name: string;
  entryCountry: string;
  exitCountry: string;
  description: string;
}

interface DoubleVPNConfig {
  enabled: boolean;
  entryServers: DoubleVPNServer[];
  exitServers: DoubleVPNServer[];
  presetRoutes: DoubleVPNPresetRoute[];
  selectedEntry: string | null;
  selectedExit: string | null;
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

const getLoadColor = (load: number): string => {
  if (load < 50) return 'text-green-500';
  if (load < 75) return 'text-yellow-500';
  return 'text-red-500';
};

// Convert backend server to VPNServer type for component compatibility
const toVPNServer = (server: DoubleVPNServer): VPNServer => ({
  id: server.id,
  name: server.name,
  country: server.country,
  countryCode: server.countryCode,
  city: server.city,
  hostname: server.hostname,
  ip: server.ip,
  load: server.load,
  latency: server.latency,
  features: server.features as VPNServer['features'],
  groups: server.groups,
  isFavorite: server.isFavorite,
  isRecommended: server.isRecommended,
});

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ServerSelectCardProps {
  server: VPNServer;
  isSelected: boolean;
  onSelect: (server: VPNServer) => void;
  type: 'entry' | 'exit';
}

function ServerSelectCard({ server, isSelected, onSelect, type }: ServerSelectCardProps) {
  return (
    <Card 
      className={`server-select-card ${isSelected ? 'selected' : ''} ${type}`}
      onClick={() => onSelect(server)}
    >
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

          {isSelected && (
            <div className="selected-indicator">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ConnectionChainProps {
  entryServer: VPNServer | null;
  exitServer: VPNServer | null;
  isConnected: boolean;
}

function ConnectionChain({ entryServer, exitServer, isConnected }: ConnectionChainProps) {
  return (
    <Card className={`connection-chain-card ${isConnected ? 'connected' : ''}`}>
      <CardContent className="p-6">
        <div className="chain-container">
          {/* Your Device */}
          <div className="chain-node">
            <div className="node-icon your-device">
              <Server className="h-5 w-5" />
            </div>
            <span className="node-label">Your Device</span>
          </div>

          {/* Arrow */}
          <div className="chain-arrow">
            <ArrowRight className="h-5 w-5" />
            <span className="arrow-label">Encrypted</span>
          </div>

          {/* Entry Server */}
          <div className="chain-node">
            <div className={`node-icon entry ${entryServer ? 'active' : ''}`}>
              {entryServer ? (
                <span className="text-xl">{getCountryFlag(entryServer.countryCode)}</span>
              ) : (
                <Globe className="h-5 w-5" />
              )}
            </div>
            <span className="node-label">
              {entryServer ? entryServer.name : 'Entry Server'}
            </span>
          </div>

          {/* Arrow */}
          <div className="chain-arrow">
            <ArrowRight className="h-5 w-5" />
            <span className="arrow-label">Re-encrypted</span>
          </div>

          {/* Exit Server */}
          <div className="chain-node">
            <div className={`node-icon exit ${exitServer ? 'active' : ''}`}>
              {exitServer ? (
                <span className="text-xl">{getCountryFlag(exitServer.countryCode)}</span>
              ) : (
                <Globe className="h-5 w-5" />
              )}
            </div>
            <span className="node-label">
              {exitServer ? exitServer.name : 'Exit Server'}
            </span>
          </div>

          {/* Arrow */}
          <div className="chain-arrow">
            <ArrowRight className="h-5 w-5" />
            <span className="arrow-label">To Internet</span>
          </div>

          {/* Internet */}
          <div className="chain-node">
            <div className="node-icon internet">
              <Network className="h-5 w-5" />
            </div>
            <span className="node-label">Internet</span>
          </div>
        </div>

        {isConnected && (
          <div className="connection-status">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <span className="text-green-600 font-medium">Double VPN Active</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface DoubleVPNSelectorProps {
  onClose?: () => void;
}

export function DoubleVPNSelector({ onClose: _onClose }: DoubleVPNSelectorProps) {
  const [entryServers, setEntryServers] = useState<VPNServer[]>([]);
  const [exitServers, setExitServers] = useState<VPNServer[]>([]);
  const [presetRoutes, setPresetRoutes] = useState<DoubleVPNPresetRoute[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<VPNServer | null>(null);
  const [selectedExit, setSelectedExit] = useState<VPNServer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchEntry, setSearchEntry] = useState('');
  const [searchExit, setSearchExit] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await invoke<DoubleVPNConfig>('get_double_vpn_config');
        setEntryServers(config.entryServers.map(toVPNServer));
        setExitServers(config.exitServers.map(toVPNServer));
        setPresetRoutes(config.presetRoutes);
        setIsConnected(config.enabled);
        
        if (config.selectedEntry) {
          const entry = config.entryServers.find(s => s.id === config.selectedEntry);
          if (entry) setSelectedEntry(toVPNServer(entry));
        }
        if (config.selectedExit) {
          const exit = config.exitServers.find(s => s.id === config.selectedExit);
          if (exit) setSelectedExit(toVPNServer(exit));
        }
      } catch (error) {
        log.error('Failed to load Double VPN config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load Double VPN configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [toast]);

  const handleConnect = useCallback(async () => {
    if (!selectedEntry || !selectedExit) {
      toast({
        title: 'Select Servers',
        description: 'Please select both entry and exit servers',
        variant: 'destructive',
      });
      return;
    }

    try {
      await invoke('set_double_vpn_route', { 
        entryId: selectedEntry.id, 
        exitId: selectedExit.id 
      });
      await invoke('toggle_double_vpn', { enabled: true });
      setIsConnected(true);
      toast({
        title: 'Double VPN Connected',
        description: `${selectedEntry.name} → ${selectedExit.name}`,
      });
    } catch (error) {
      log.error('Failed to connect:', error);
      toast({
        title: 'Connection Failed',
        description: 'Could not establish Double VPN connection',
        variant: 'destructive',
      });
    }
  }, [selectedEntry, selectedExit, toast]);

  const handleDisconnect = useCallback(async () => {
    try {
      await invoke('toggle_double_vpn', { enabled: false });
      setIsConnected(false);
      toast({
        title: 'Disconnected',
        description: 'Double VPN connection closed',
      });
    } catch (error) {
      log.error('Failed to disconnect:', error);
    }
  }, [toast]);

  const handleApplyPreset = useCallback((preset: DoubleVPNPresetRoute) => {
    const entry = entryServers.find(s => s.countryCode === preset.entryCountry);
    const exit = exitServers.find(s => s.countryCode === preset.exitCountry);
    
    if (entry) setSelectedEntry(entry);
    if (exit) setSelectedExit(exit);
    
    toast({
      title: 'Preset Applied',
      description: preset.name,
    });
  }, [entryServers, exitServers, toast]);

  if (loading) {
    return (
      <div className="double-vpn-selector flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const filteredEntryServers = entryServers.filter(s => 
    s.name.toLowerCase().includes(searchEntry.toLowerCase()) ||
    s.country.toLowerCase().includes(searchEntry.toLowerCase())
  );

  const filteredExitServers = exitServers.filter(s => 
    s.name.toLowerCase().includes(searchExit.toLowerCase()) ||
    s.country.toLowerCase().includes(searchExit.toLowerCase())
  );

  return (
    <div className="double-vpn-selector">
      {/* Header */}
      <div className="selector-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Double VPN</h2>
            <p className="text-sm text-muted-foreground">
              Route through two VPN servers for extra privacy
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Double VPN</strong> encrypts your traffic twice by routing it through two servers. 
              This adds an extra layer of security but may reduce speed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Connection Chain Visualization */}
      <ConnectionChain
        entryServer={selectedEntry}
        exitServer={selectedExit}
        isConnected={isConnected}
      />

      {/* Preset Routes */}
      <Card className="my-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="h-5 w-5" />
            Preset Routes
          </CardTitle>
          <CardDescription>
            Pre-configured server combinations for different needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {presetRoutes.map(preset => (
              <Card 
                key={preset.id}
                className="preset-card cursor-pointer"
                onClick={() => handleApplyPreset(preset)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="preset-flags">
                      <span>{getCountryFlag(preset.entryCountry)}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span>{getCountryFlag(preset.exitCountry)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Server Selection */}
      <div className="grid grid-cols-2 gap-6">
        {/* Entry Server */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Entry Server
            </CardTitle>
            <CardDescription>
              First hop - your traffic enters the VPN here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entry servers..."
                value={searchEntry}
                onChange={(e) => setSearchEntry(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {filteredEntryServers.map(server => (
                  <ServerSelectCard
                    key={server.id}
                    server={server}
                    isSelected={selectedEntry?.id === server.id}
                    onSelect={setSelectedEntry}
                    type="entry"
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Exit Server */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Network className="h-5 w-5 text-green-500" />
              Exit Server
            </CardTitle>
            <CardDescription>
              Second hop - your traffic exits to the internet here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exit servers..."
                value={searchExit}
                onChange={(e) => setSearchExit(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {filteredExitServers.map(server => (
                  <ServerSelectCard
                    key={server.id}
                    server={server}
                    isSelected={selectedExit?.id === server.id}
                    onSelect={setSelectedExit}
                    type="exit"
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Connect Button */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedEntry && selectedExit ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCountryFlag(selectedEntry.countryCode)}</span>
                    <span className="font-medium">{selectedEntry.name}</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCountryFlag(selectedExit.countryCode)}</span>
                    <span className="font-medium">{selectedExit.name}</span>
                  </div>
                </>
              ) : (
                <span className="text-muted-foreground">Select entry and exit servers</span>
              )}
            </div>
            
            <Button
              size="lg"
              onClick={isConnected ? handleDisconnect : handleConnect}
              disabled={!selectedEntry || !selectedExit}
              variant={isConnected ? 'outline' : 'default'}
            >
              {isConnected ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Disconnect
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Double VPN
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DoubleVPNSelector;
