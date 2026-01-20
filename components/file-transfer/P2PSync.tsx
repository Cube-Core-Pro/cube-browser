"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('P2PSync');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Link2,
  Share2,
  Copy,
  Trash2,
  Settings,
  Plus,
  Lock,
  Clock,
  Download,
  Eye,
  EyeOff,
  Shield,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import {
  P2PSyncConfig,
  P2PPeer,
  ShareableLink,
} from '@/types/file-transfer-elite';
import './P2PSync.css';

// ============================================================================
// BACKEND TYPES (matching Rust structs)
// ============================================================================

interface BackendP2PPeer {
  id: string;
  name: string;
  publicKey: string;
  addresses: string[];
  isOnline: boolean;
  lastSeen: number; // Unix timestamp seconds
  sharedFolders: string[];
  bandwidthUpload: number;
  bandwidthDownload: number;
}

interface BackendShareableLink {
  id: string;
  fileId: string;
  fileName: string;
  url: string;
  shortUrl: string;
  password: string | null;
  expiresAt: number; // Unix timestamp seconds
  downloadCount: number;
  downloadLimit: number | null;
  createdAt: number; // Unix timestamp seconds
  isActive: boolean;
}

interface BackendP2PSyncConfig {
  peers: BackendP2PPeer[];
  links: BackendShareableLink[];
  isP2pEnabled: boolean;
}

// ============================================================================
// CONVERTERS (Backend → Frontend)
// ============================================================================

const convertBackendPeer = (backend: BackendP2PPeer): P2PPeer => ({
  id: backend.id,
  name: backend.name,
  publicKey: backend.publicKey,
  addresses: backend.addresses,
  isOnline: backend.isOnline,
  lastSeen: new Date(backend.lastSeen * 1000),
  sharedFolders: backend.sharedFolders,
  bandwidth: {
    upload: backend.bandwidthUpload,
    download: backend.bandwidthDownload,
  },
});

const convertBackendLink = (backend: BackendShareableLink): ShareableLink => ({
  id: backend.id,
  fileId: backend.fileId,
  fileName: backend.fileName,
  url: backend.url,
  shortUrl: backend.shortUrl,
  password: backend.password ?? undefined,
  expiresAt: new Date(backend.expiresAt * 1000),
  downloadCount: backend.downloadCount,
  downloadLimit: backend.downloadLimit ?? undefined,
  createdAt: new Date(backend.createdAt * 1000),
  createdBy: 'me',
  isActive: backend.isActive,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatSpeed = (mbps: number): string => {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`;
  return `${mbps} Mbps`;
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

const formatDaysRemaining = (date: Date): string => {
  const days = Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface PeerCardProps {
  peer: P2PPeer;
  onConnect: (peer: P2PPeer) => void;
  onRemove: (peer: P2PPeer) => void;
}

function PeerCard({ peer, onConnect, onRemove }: PeerCardProps) {
  return (
    <div className={`peer-card ${peer.isOnline ? 'online' : 'offline'}`}>
      <div className="peer-status">
        {peer.isOnline ? (
          <Wifi className="h-5 w-5 text-green-500" />
        ) : (
          <WifiOff className="h-5 w-5 text-gray-400" />
        )}
      </div>
      
      <div className="peer-info">
        <div className="flex items-center gap-2">
          <span className="font-medium">{peer.name}</span>
          {peer.isOnline && (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              Online
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {peer.sharedFolders.length} shared folders • Last seen {formatTimeAgo(peer.lastSeen)}
        </p>
        {peer.isOnline && (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>↑ {formatSpeed(peer.bandwidth.upload)}</span>
            <span>↓ {formatSpeed(peer.bandwidth.download)}</span>
          </div>
        )}
      </div>
      
      <div className="peer-actions">
        <Button size="sm" variant="outline" onClick={() => onConnect(peer)}>
          <Share2 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onRemove(peer)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

interface LinkCardProps {
  link: ShareableLink;
  onCopy: (link: ShareableLink) => void;
  onToggle: (link: ShareableLink) => void;
  onDelete: (link: ShareableLink) => void;
}

function LinkCard({ link, onCopy, onToggle, onDelete }: LinkCardProps) {
  return (
    <div className={`link-card ${!link.isActive ? 'inactive' : ''}`}>
      <div className="link-icon">
        <Link2 className="h-5 w-5" />
      </div>
      
      <div className="link-info">
        <span className="font-medium">{link.fileName}</span>
        <div className="flex items-center gap-2 mt-1">
          <code className="text-xs text-muted-foreground">{link.shortUrl}</code>
          {link.password && (
            <Badge variant="secondary" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Protected
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            {link.downloadCount}
            {link.downloadLimit && ` / ${link.downloadLimit}`}
          </span>
          {link.expiresAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDaysRemaining(link.expiresAt)}
            </span>
          )}
        </div>
      </div>
      
      <div className="link-actions">
        <Button size="sm" variant="ghost" onClick={() => onCopy(link)}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onToggle(link)}>
          {link.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(link)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface P2PSyncProps {
  onClose?: () => void;
}

export function P2PSync({ onClose: _onClose }: P2PSyncProps) {
  const [config, setConfig] = useState<P2PSyncConfig>({
    enabled: true,
    maxPeers: 10,
    dhtEnabled: true,
    relayServers: ['relay.cube.io:4001'],
    encryption: 'e2e',
    peerDiscovery: { mdns: true, dht: true, tracker: false, manual: true },
    shareableLinks: {
      enabled: true,
      defaultExpiry: 7,
      passwordProtection: false,
      requireAuth: false,
    },
  });
  const [peers, setPeers] = useState<P2PPeer[]>([]);
  const [links, setLinks] = useState<ShareableLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('peers');
  const { toast } = useToast();

  // Load data from backend on mount
  useEffect(() => {
    const loadP2PSyncConfig = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendP2PSyncConfig>('get_p2p_sync_config');
        setPeers(backendConfig.peers.map(convertBackendPeer));
        setLinks(backendConfig.links.map(convertBackendLink));
        setConfig(prev => ({ ...prev, enabled: backendConfig.isP2pEnabled }));
      } catch (error) {
        log.error('Failed to load P2P sync config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load P2P sync configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadP2PSyncConfig();
  }, [toast]);

  const onlinePeers = peers.filter(p => p.isOnline).length;
  const activeLinks = links.filter(l => l.isActive).length;
  const totalDownloads = links.reduce((sum, l) => sum + l.downloadCount, 0);

  const handleConnectPeer = useCallback((peer: P2PPeer) => {
    toast({
      title: 'Connecting to Peer',
      description: `Establishing connection with ${peer.name}`,
    });
  }, [toast]);

  const handleRemovePeer = useCallback(async (peer: P2PPeer) => {
    try {
      await invoke('remove_p2p_peer', { peerId: peer.id });
      setPeers(prev => prev.filter(p => p.id !== peer.id));
      toast({
        title: 'Peer Removed',
        description: `${peer.name} has been removed`,
      });
    } catch (error) {
      log.error('Failed to remove peer:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove peer',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleCopyLink = useCallback((link: ShareableLink) => {
    navigator.clipboard.writeText(link.url);
    toast({
      title: 'Link Copied',
      description: 'Share link copied to clipboard',
    });
  }, [toast]);

  const handleToggleLink = useCallback((link: ShareableLink) => {
    setLinks(prev => prev.map(l => 
      l.id === link.id ? { ...l, isActive: !l.isActive } : l
    ));
  }, []);

  const handleDeleteLink = useCallback(async (link: ShareableLink) => {
    try {
      await invoke('delete_shareable_link', { linkId: link.id });
      setLinks(prev => prev.filter(l => l.id !== link.id));
      toast({
        title: 'Link Deleted',
        description: 'Share link has been deleted',
      });
    } catch (error) {
      log.error('Failed to delete link:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete share link',
        variant: 'destructive',
      });
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="p2p-sync flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading P2P Sync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p2p-sync">
      {/* Header */}
      <div className="sync-header">
        <div className="flex items-center gap-3">
          <div className={`header-icon ${config.enabled ? 'active' : ''}`}>
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">P2P Sync</h2>
            <p className="text-sm text-muted-foreground">
              Peer-to-peer file synchronization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="p2p-enabled" className="text-sm">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </Label>
          <Switch
            id="p2p-enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="sync-stats">
        <div className="stat-card">
          <div className="stat-icon green">
            <Wifi className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{onlinePeers}</span>
            <span className="stat-label">Online Peers</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{activeLinks}</span>
            <span className="stat-label">Active Links</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{totalDownloads}</span>
            <span className="stat-label">Total Downloads</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">E2E</span>
            <span className="stat-label">Encryption</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="peers">
            <Users className="h-4 w-4 mr-2" />
            Peers ({peers.length})
          </TabsTrigger>
          <TabsTrigger value="links">
            <Link2 className="h-4 w-4 mr-2" />
            Share Links ({links.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="peers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Connected Peers</CardTitle>
                  <CardDescription>
                    Devices syncing with your files
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Peer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {peers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No peers connected</p>
                    </div>
                  ) : (
                    peers.map(peer => (
                      <PeerCard
                        key={peer.id}
                        peer={peer}
                        onConnect={handleConnectPeer}
                        onRemove={handleRemovePeer}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Shareable Links</CardTitle>
                  <CardDescription>
                    Links you&apos;ve created to share files
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Link
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {links.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No share links created</p>
                    </div>
                  ) : (
                    links.map(link => (
                      <LinkCard
                        key={link.id}
                        link={link}
                        onCopy={handleCopyLink}
                        onToggle={handleToggleLink}
                        onDelete={handleDeleteLink}
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
              <CardTitle className="text-lg">P2P Settings</CardTitle>
              <CardDescription>
                Configure peer-to-peer synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Maximum Peers</Label>
                  <p className="text-sm text-muted-foreground">
                    Maximum number of simultaneous peer connections
                  </p>
                </div>
                <Input
                  type="number"
                  value={config.maxPeers}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxPeers: parseInt(e.target.value) || 10 }))}
                  className="w-20"
                  min={1}
                  max={50}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>DHT Discovery</Label>
                  <p className="text-sm text-muted-foreground">
                    Use distributed hash table for peer discovery
                  </p>
                </div>
                <Switch
                  checked={config.dhtEnabled}
                  onCheckedChange={(dhtEnabled) => setConfig(prev => ({ ...prev, dhtEnabled }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Local Network Discovery</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically discover peers on local network
                  </p>
                </div>
                <Switch
                  checked={config.peerDiscovery.mdns}
                  onCheckedChange={(mdns) => setConfig(prev => ({
                    ...prev,
                    peerDiscovery: { ...prev.peerDiscovery, mdns }
                  }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>End-to-End Encryption</Label>
                  <p className="text-sm text-muted-foreground">
                    Encrypt all peer-to-peer transfers
                  </p>
                </div>
                <Switch
                  checked={config.encryption === 'e2e'}
                  onCheckedChange={(e2e) => setConfig(prev => ({
                    ...prev,
                    encryption: e2e ? 'e2e' : 'tls'
                  }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Default Link Expiry (days)</Label>
                  <p className="text-sm text-muted-foreground">
                    Default expiration time for share links
                  </p>
                </div>
                <Input
                  type="number"
                  value={config.shareableLinks.defaultExpiry}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    shareableLinks: { ...prev.shareableLinks, defaultExpiry: parseInt(e.target.value) || 7 }
                  }))}
                  className="w-20"
                  min={1}
                  max={365}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default P2PSync;
