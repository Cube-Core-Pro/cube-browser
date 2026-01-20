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
import { Avatar as _Avatar, AvatarFallback as _AvatarFallback, AvatarImage as _AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select as _Select,
  SelectContent as _SelectContent,
  SelectItem as _SelectItem,
  SelectTrigger as _SelectTrigger,
  SelectValue as _SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Network,
  Router as _Router,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Server,
  Wifi,
  WifiOff as _WifiOff,
  Globe,
  MapPin as _MapPin,
  Link2,
  Unlink2 as _Unlink2,
  Plus,
  Minus as _Minus,
  X,
  Check as _Check,
  Send,
  Mail,
  Copy,
  RefreshCw,
  Settings,
  Users,
  Share2,
  Shield as _Shield,
  ShieldCheck as _ShieldCheck,
  Lock as _Lock,
  Unlock as _Unlock,
  Eye as _Eye,
  EyeOff as _EyeOff,
  Activity as _Activity,
  Clock,
  ChevronRight as _ChevronRight,
  ChevronDown as _ChevronDown,
  MoreHorizontal as _MoreHorizontal,
  Trash2 as _Trash2,
  Edit as _Edit,
  Download,
  Upload as _Upload,
  FileText as _FileText,
  FolderOpen,
  Zap as _Zap,
  Loader2,
} from 'lucide-react';
import {
  MeshnetDevice,
  MeshnetInvitation,
  MeshnetPermissions,
  MeshnetConfig as _MeshnetConfig,
  DeviceType as _DeviceType,
} from '@/types/vpn-elite';
import { logger } from '@/lib/services/logger-service';
import './MeshnetManager.css';

const log = logger.scope('MeshnetManager');

// ============================================================================
// TYPES FROM BACKEND
// ============================================================================

interface BackendMeshnetConfig {
  enabled: boolean;
  deviceName: string;
  deviceIp: string;
  devices: MeshnetDevice[];
  invitations: MeshnetInvitation[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getDeviceIcon = (type: 'desktop' | 'laptop' | 'mobile' | 'tablet' | 'server' | undefined) => {
  switch (type) {
    case 'laptop': return Laptop;
    case 'desktop': return Monitor;
    case 'mobile': return Smartphone;
    case 'tablet': return Tablet;
    case 'server': return Server;
    default: return Monitor;
  }
};

const formatLastSeen = (date: Date | number): string => {
  const timestamp = typeof date === 'number' ? date * 1000 : date.getTime();
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface DeviceCardProps {
  device: MeshnetDevice;
  onEdit: (device: MeshnetDevice) => void;
  onRemove: (device: MeshnetDevice) => void;
  onConnect: (device: MeshnetDevice) => void;
}

function DeviceCard({ device, onEdit, onRemove: _onRemove, onConnect }: DeviceCardProps) {
  const DeviceIcon = getDeviceIcon(device.type);
  
  return (
    <Card className={`device-card ${device.isOnline ? 'online' : 'offline'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`device-icon-wrapper ${device.isOnline ? 'online' : 'offline'}`}>
            <DeviceIcon className="h-6 w-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{device.name}</span>
              {device.isOwned ? (
                <Badge variant="outline" className="text-xs">Your device</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Linked</Badge>
              )}
              <div className={`status-dot ${device.isOnline ? 'online' : 'offline'}`} />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span className="font-mono">{device.ip}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{device.isOnline ? 'Online' : (device.lastSeen ? formatLastSeen(device.lastSeen) : 'Unknown')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                <span>{device.os}</span>
              </div>
              {device.ownerEmail && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{device.ownerEmail}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              {device.permissions.allowInbound && (
                <Badge variant="outline" className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Inbound
                </Badge>
              )}
              {device.permissions.allowRouting && (
                <Badge variant="outline" className="text-xs">
                  <Share2 className="h-3 w-3 mr-1" />
                  Routing
                </Badge>
              )}
              {device.permissions.allowFileSharing && (
                <Badge variant="outline" className="text-xs">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  Files
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {!device.isOwned && device.isOnline && (
              <Button size="sm" onClick={() => onConnect(device)}>
                <Link2 className="h-4 w-4 mr-1" />
                Route
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onEdit(device)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InvitationCardProps {
  invitation: MeshnetInvitation;
  onResend: (invitation: MeshnetInvitation) => void;
  onRevoke: (invitation: MeshnetInvitation) => void;
}

function InvitationCard({ invitation, onResend, onRevoke }: InvitationCardProps) {
  return (
    <Card className="invitation-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="invitation-icon">
            <Mail className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium">{invitation.email}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Sent {invitation.createdAt ? formatLastSeen(invitation.createdAt) : 'recently'}</span>
              {invitation.status === 'pending' && (
                <>
                  <span>•</span>
                  <span>Expires in {Math.floor((invitation.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days</span>
                </>
              )}
            </div>
          </div>

          <Badge
            variant={
              invitation.status === 'accepted' ? 'default' :
              invitation.status === 'pending' ? 'secondary' :
              'destructive'
            }
          >
            {invitation.status}
          </Badge>

          {invitation.status === 'pending' && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => onResend(invitation)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onRevoke(invitation)} className="text-red-500">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface MeshnetManagerProps {
  onClose?: () => void;
}

export function MeshnetManager({ onClose: _onClose }: MeshnetManagerProps) {
  const [devices, setDevices] = useState<MeshnetDevice[]>([]);
  const [invitations, setInvitations] = useState<MeshnetInvitation[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<MeshnetDevice | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitePermissions, setInvitePermissions] = useState<MeshnetPermissions>({
    canRouteTraffic: false,
    canAccessLocalNetwork: false,
    canSendFiles: false,
    canBeDiscovered: true,
    allowInbound: true,
    allowOutbound: true,
    allowRouting: false,
    allowLocalNetwork: false,
    allowFileSharing: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await invoke<BackendMeshnetConfig>('get_meshnet_config');
        setDevices(config.devices);
        setInvitations(config.invitations);
        setIsEnabled(config.enabled);
      } catch (error) {
        log.error('Failed to load Meshnet config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load Meshnet configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [toast]);

  const ownedDevices = devices.filter(d => d.isOwned);
  const linkedDevices = devices.filter(d => !d.isOwned);
  const onlineDevices = devices.filter(d => d.isOnline);

  const handleToggleMeshnet = useCallback(async (enabled: boolean) => {
    try {
      await invoke('toggle_meshnet', { enabled });
      setIsEnabled(enabled);
      toast({
        title: enabled ? 'Meshnet Enabled' : 'Meshnet Disabled',
        description: enabled ? 'Your devices are now connected' : 'Meshnet has been disabled',
      });
    } catch (error) {
      log.error('Failed to toggle Meshnet:', error);
    }
  }, [toast]);

  const handleInvite = useCallback(async () => {
    if (!inviteEmail.trim()) return;
    
    try {
      const newInvitation = await invoke<MeshnetInvitation>('send_meshnet_invitation', { 
        email: inviteEmail.trim() 
      });
      setInvitations(prev => [...prev, newInvitation]);
      setInviteEmail('');
      setShowInviteDialog(false);
      
      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${inviteEmail}`,
      });
    } catch (error) {
      log.error('Failed to send invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  }, [inviteEmail, toast]);

  const handleEditDevice = useCallback((device: MeshnetDevice) => {
    setSelectedDevice(device);
    setShowEditDialog(true);
  }, []);

  const handleRemoveDevice = useCallback((device: MeshnetDevice) => {
    setDevices(prev => prev.filter(d => d.id !== device.id));
    toast({
      title: 'Device Removed',
      description: `${device.name} has been removed from Meshnet`,
    });
  }, [toast]);

  const handleConnect = useCallback((device: MeshnetDevice) => {
    toast({
      title: 'Routing Enabled',
      description: `Traffic will be routed through ${device.name}`,
    });
  }, [toast]);

  const handleResendInvitation = useCallback((invitation: MeshnetInvitation) => {
    toast({
      title: 'Invitation Resent',
      description: `Invitation resent to ${invitation.email}`,
    });
  }, [toast]);

  const handleRevokeInvitation = useCallback((invitation: MeshnetInvitation) => {
    setInvitations(prev => prev.filter(i => i.id !== invitation.id));
    toast({
      title: 'Invitation Revoked',
      description: `Invitation to ${invitation.email} has been revoked`,
    });
  }, [toast]);

  const handleUpdatePermissions = useCallback((deviceId: string, permissions: Partial<MeshnetPermissions>) => {
    setDevices(prev => prev.map(d => 
      d.id === deviceId 
        ? { ...d, permissions: { ...d.permissions, ...permissions } }
        : d
    ));
    setShowEditDialog(false);
    toast({
      title: 'Permissions Updated',
      description: 'Device permissions have been updated',
    });
  }, [toast]);

  const copyMeshnetIP = useCallback((ip: string) => {
    navigator.clipboard.writeText(ip);
    toast({
      title: 'IP Copied',
      description: 'Meshnet IP address copied to clipboard',
    });
  }, [toast]);

  if (loading) {
    return (
      <div className="meshnet-manager flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="meshnet-manager">
      {/* Header */}
      <div className="meshnet-header">
        <div className="flex items-center gap-3">
          <div className={`header-icon ${isEnabled ? 'enabled' : 'disabled'}`}>
            <Network className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Meshnet</h2>
            <p className="text-sm text-muted-foreground">
              Create a secure private network between your devices
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="meshnet-toggle" className="text-sm font-medium">
              {isEnabled ? 'Meshnet Active' : 'Meshnet Disabled'}
            </Label>
            <Switch
              id="meshnet-toggle"
              checked={isEnabled}
              onCheckedChange={handleToggleMeshnet}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{devices.length}</p>
              <p className="text-xs text-muted-foreground">Total Devices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{onlineDevices.length}</p>
              <p className="text-xs text-muted-foreground">Online Now</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{linkedDevices.length}</p>
              <p className="text-xs text-muted-foreground">Linked Devices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{invitations.filter(i => i.status === 'pending').length}</p>
              <p className="text-xs text-muted-foreground">Pending Invites</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">
            <Monitor className="h-4 w-4 mr-2" />
            My Devices
          </TabsTrigger>
          <TabsTrigger value="linked">
            <Link2 className="h-4 w-4 mr-2" />
            Linked Devices
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Mail className="h-4 w-4 mr-2" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Your Devices</CardTitle>
                  <CardDescription>
                    Devices you own that are part of your Meshnet
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {ownedDevices.map(device => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      onEdit={handleEditDevice}
                      onRemove={handleRemoveDevice}
                      onConnect={handleConnect}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="linked">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Linked Devices</CardTitle>
                  <CardDescription>
                    Devices owned by others that you can access
                  </CardDescription>
                </div>
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite to Meshnet</DialogTitle>
                      <DialogDescription>
                        Send an invitation to link devices with another user
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Permissions</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="allowInbound"
                              checked={invitePermissions.allowInbound}
                              onCheckedChange={(checked) => 
                                setInvitePermissions(prev => ({ ...prev, allowInbound: !!checked }))
                              }
                            />
                            <Label htmlFor="allowInbound" className="text-sm font-normal">
                              Allow incoming connections
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="allowRouting"
                              checked={invitePermissions.allowRouting}
                              onCheckedChange={(checked) => 
                                setInvitePermissions(prev => ({ ...prev, allowRouting: !!checked }))
                              }
                            />
                            <Label htmlFor="allowRouting" className="text-sm font-normal">
                              Allow traffic routing
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="allowFileSharing"
                              checked={invitePermissions.allowFileSharing}
                              onCheckedChange={(checked) => 
                                setInvitePermissions(prev => ({ ...prev, allowFileSharing: !!checked }))
                              }
                            />
                            <Label htmlFor="allowFileSharing" className="text-sm font-normal">
                              Allow file sharing
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleInvite}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {linkedDevices.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Linked Devices</h3>
                  <p className="text-muted-foreground mb-4">
                    Invite other users to link their devices to your Meshnet
                  </p>
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {linkedDevices.map(device => (
                      <DeviceCard
                        key={device.id}
                        device={device}
                        onEdit={handleEditDevice}
                        onRemove={handleRemoveDevice}
                        onConnect={handleConnect}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invitations</CardTitle>
              <CardDescription>
                Manage your sent invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Invitations</h3>
                  <p className="text-muted-foreground">
                    You haven&apos;t sent any invitations yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map(invitation => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onResend={handleResendInvitation}
                      onRevoke={handleRevokeInvitation}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meshnet Settings</CardTitle>
              <CardDescription>
                Configure how your Meshnet works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Allow Incoming Connections</p>
                    <p className="text-sm text-muted-foreground">
                      Let other Meshnet devices connect to this device
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Traffic Routing</p>
                    <p className="text-sm text-muted-foreground">
                      Allow other devices to route traffic through this device
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Local Network Access</p>
                    <p className="text-sm text-muted-foreground">
                      Share access to your local network with linked devices
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">File Sharing</p>
                    <p className="text-sm text-muted-foreground">
                      Allow file transfers between Meshnet devices
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Your Meshnet Address</h4>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <code className="flex-1 font-mono text-sm">100.64.0.1</code>
                  <Button size="sm" variant="ghost" onClick={() => copyMeshnetIP('100.64.0.1')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Use this address to connect to this device from other Meshnet devices
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Device Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device Permissions</DialogTitle>
            <DialogDescription>
              Configure permissions for {selectedDevice?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-allowInbound"
                    checked={selectedDevice.permissions.allowInbound}
                    onCheckedChange={(checked) => 
                      setSelectedDevice(prev => prev ? { 
                        ...prev, 
                        permissions: { ...prev.permissions, allowInbound: !!checked } 
                      } : null)
                    }
                  />
                  <Label htmlFor="edit-allowInbound" className="text-sm font-normal">
                    Allow incoming connections
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-allowRouting"
                    checked={selectedDevice.permissions.allowRouting}
                    onCheckedChange={(checked) => 
                      setSelectedDevice(prev => prev ? { 
                        ...prev, 
                        permissions: { ...prev.permissions, allowRouting: !!checked } 
                      } : null)
                    }
                  />
                  <Label htmlFor="edit-allowRouting" className="text-sm font-normal">
                    Allow traffic routing
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-allowLocalNetwork"
                    checked={selectedDevice.permissions.allowLocalNetwork}
                    onCheckedChange={(checked) => 
                      setSelectedDevice(prev => prev ? { 
                        ...prev, 
                        permissions: { ...prev.permissions, allowLocalNetwork: !!checked } 
                      } : null)
                    }
                  />
                  <Label htmlFor="edit-allowLocalNetwork" className="text-sm font-normal">
                    Allow local network access
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-allowFileSharing"
                    checked={selectedDevice.permissions.allowFileSharing}
                    onCheckedChange={(checked) => 
                      setSelectedDevice(prev => prev ? { 
                        ...prev, 
                        permissions: { ...prev.permissions, allowFileSharing: !!checked } 
                      } : null)
                    }
                  />
                  <Label htmlFor="edit-allowFileSharing" className="text-sm font-normal">
                    Allow file sharing
                  </Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedDevice && handleUpdatePermissions(selectedDevice.id, selectedDevice.permissions)}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MeshnetManager;
