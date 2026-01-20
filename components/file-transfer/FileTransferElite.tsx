'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  useFileTransfer,
  SiteConfig,
  FileEntry,
  Transfer,
  P2PDevice,
  formatBytes,
  formatSpeed,
  formatDuration,
  getFileType,
  PROTOCOL_NAMES,
  STATUS_NAMES,
} from '@/lib/services/file-transfer-elite-service';
import {
  Server,
  Upload,
  Download,
  Folder,
  File,
  FileText,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Lock,
  Key,
  Globe,
  CheckCircle2,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Smartphone,
  Laptop,
  Monitor,
  Star,
  StarOff,
  Plus,
  ChevronRight,
  MoreHorizontal,
  QrCode,
  Share2,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  History,
  BarChart3,
  Copy,
  Eye,
  EyeOff,
  FolderOpen,
  HardDrive,
  Send,
  Shield,
  X,
} from 'lucide-react';

// ============================================================================
// Sub-Components
// ============================================================================

interface SiteCardProps {
  site: SiteConfig;
  isActive: boolean;
  onConnect: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

function SiteCard({ site, isActive, onConnect, onDelete, onToggleFavorite }: SiteCardProps) {
  const getProtocolIcon = () => {
    switch (site.protocol) {
      case 'sftp': return <Key className="h-4 w-4" />;
      case 'ftps': return <Lock className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`transition-all ${isActive ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              className="text-muted-foreground hover:text-yellow-500"
            >
              {site.favorite ? (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </button>
            <div>
              <h4 className="font-medium flex items-center gap-2">
                {site.name}
                {isActive && (
                  <Badge className="bg-green-500/10 text-green-500">Connected</Badge>
                )}
              </h4>
              <p className="text-sm text-muted-foreground">{site.host}:{site.port}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onConnect}>
                <Play className="h-4 w-4 mr-2" />
                {isActive ? 'Reconnect' : 'Connect'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-500">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs">
            {getProtocolIcon()}
            <span className="ml-1">{PROTOCOL_NAMES[site.protocol]}</span>
          </Badge>
          <Badge variant="outline" className="text-xs">
            {site.username}
          </Badge>
        </div>

        {!isActive && (
          <Button className="w-full mt-3" size="sm" onClick={onConnect}>
            <Play className="h-4 w-4 mr-2" />
            Connect
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface FileRowProps {
  file: FileEntry;
  selected: boolean;
  onSelect: () => void;
  onNavigate: () => void;
  onDownload?: () => void;
}

function FileRow({ file, selected, onSelect, onNavigate, onDownload }: FileRowProps) {
  const getFileIcon = () => {
    if (file.isDirectory) return <Folder className="h-4 w-4 text-blue-500" />;
    
    const type = getFileType(file.name);
    switch (type) {
      case 'image': return <FileImage className="h-4 w-4 text-purple-500" />;
      case 'video': return <FileVideo className="h-4 w-4 text-pink-500" />;
      case 'audio': return <FileAudio className="h-4 w-4 text-green-500" />;
      case 'archive': return <FileArchive className="h-4 w-4 text-yellow-500" />;
      case 'code': return <FileCode className="h-4 w-4 text-blue-500" />;
      case 'document': return <FileText className="h-4 w-4 text-orange-500" />;
      default: return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <TableRow
      className={`cursor-pointer ${selected ? 'bg-primary/10' : ''} ${file.hidden ? 'opacity-60' : ''}`}
      onClick={file.isDirectory ? onNavigate : onSelect}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="rounded"
          />
          {getFileIcon()}
          <span className={`${file.isDirectory ? 'font-medium' : ''}`}>
            {file.name}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {file.isDirectory ? '-' : formatBytes(file.size)}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {new Date(file.modified).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        {!file.isDirectory && onDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        {file.isDirectory && file.name !== '..' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onNavigate(); }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

interface TransferItemProps {
  transfer: Transfer;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

function TransferItem({ transfer, onPause, onResume, onCancel, onRetry }: TransferItemProps) {
  const getStatusIcon = () => {
    switch (transfer.status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'transferring': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'verifying': return <Shield className="h-4 w-4 text-purple-500 animate-pulse" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (transfer.status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      case 'transferring': return 'bg-blue-500';
      case 'verifying': return 'bg-purple-500';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className={`h-1 ${getStatusColor()}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {transfer.direction === 'upload' ? (
              <ArrowUpRight className="h-4 w-4 text-blue-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-green-500" />
            )}
            <span className="font-medium truncate max-w-[200px]">{transfer.fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant="outline" className="capitalize text-xs">
              {STATUS_NAMES[transfer.status]}
            </Badge>
          </div>
        </div>

        <Progress value={transfer.progress} className="h-2 mb-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatBytes(transfer.transferredBytes)} / {formatBytes(transfer.totalSize)}</span>
          <span>{Math.round(transfer.progress)}%</span>
        </div>

        {transfer.status === 'transferring' && (
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-muted-foreground">
              {formatSpeed(transfer.currentSpeed)}
            </span>
            <span className="text-muted-foreground">
              ETA: {transfer.eta === Infinity ? '--' : formatDuration(transfer.eta)}
            </span>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          {transfer.status === 'transferring' && (
            <Button variant="outline" size="sm" onClick={onPause}>
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </Button>
          )}
          {transfer.status === 'paused' && (
            <Button variant="outline" size="sm" onClick={onResume}>
              <Play className="h-3 w-3 mr-1" />
              Resume
            </Button>
          )}
          {(transfer.status === 'failed' || transfer.status === 'cancelled') && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          {transfer.status !== 'completed' && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-red-500">
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {transfer.error && (
          <div className="text-xs text-red-500 mt-2 bg-red-500/10 p-2 rounded">
            {transfer.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DeviceCardProps {
  device: P2PDevice;
  onSend: () => void;
  onTrust: () => void;
}

function DeviceCard({ device, onSend, onTrust }: DeviceCardProps) {
  const getDeviceIcon = () => {
    switch (device.type) {
      case 'phone':
      case 'tablet':
        return <Smartphone className="h-8 w-8" />;
      case 'laptop':
        return <Laptop className="h-8 w-8" />;
      case 'desktop':
        return <Monitor className="h-8 w-8" />;
      case 'server':
        return <Server className="h-8 w-8" />;
      default:
        return <HardDrive className="h-8 w-8" />;
    }
  };

  return (
    <Card className={`transition-all ${!device.online ? 'opacity-50' : 'hover:shadow-md'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${device.online ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
            {getDeviceIcon()}
          </div>
          <div className="flex-1">
            <h4 className="font-medium flex items-center gap-2">
              {device.name}
              {device.trusted && (
                <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-500">
                  <Shield className="h-3 w-3 mr-1" />
                  Trusted
                </Badge>
              )}
            </h4>
            <p className="text-sm text-muted-foreground">{device.os}</p>
            <div className="flex items-center gap-2 mt-1">
              {device.online ? (
                <Badge className="bg-green-500/10 text-green-500 text-xs">
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              {device.signalStrength && (
                <span className="text-xs text-muted-foreground">
                  Signal: {Math.abs(device.signalStrength)}dB
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            className="flex-1"
            size="sm"
            disabled={!device.online}
            onClick={onSend}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Files
          </Button>
          {!device.trusted && (
            <Button variant="outline" size="sm" onClick={onTrust}>
              <Shield className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface NewSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: Omit<SiteConfig, 'id' | 'favorite' | 'lastConnected'>) => void;
}

function NewSiteDialog({ open, onOpenChange, onSave }: NewSiteDialogProps) {
  const [name, setName] = useState('');
  const [protocol, setProtocol] = useState<'ftp' | 'sftp' | 'ftps'>('sftp');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    if (!name || !host || !username) return;
    
    onSave({
      name,
      protocol,
      host,
      port: parseInt(port),
      username,
      password,
      passiveMode: true,
      timeout: 30000,
      maxRetries: 3,
      bandwidthLimit: 0,
    });

    // Reset form
    setName('');
    setHost('');
    setPort('22');
    setUsername('');
    setPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Connection</DialogTitle>
          <DialogDescription>
            Add a new FTP/SFTP server connection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Connection Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Server"
            />
          </div>

          <div className="space-y-2">
            <Label>Protocol</Label>
            <Select
              value={protocol}
              onValueChange={(v: 'ftp' | 'sftp' | 'ftps') => {
                setProtocol(v);
                setPort(v === 'sftp' ? '22' : '21');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sftp">SFTP (SSH) - Secure</SelectItem>
                <SelectItem value="ftps">FTPS (TLS) - Secure</SelectItem>
                <SelectItem value="ftp">FTP - Unencrypted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-2">
              <Label>Host</Label>
              <Input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="ftp.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name || !host || !username}>
            Save Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface FileTransferEliteProps {
  className?: string;
}

export function FileTransferElite({ className }: FileTransferEliteProps) {
  const { toast } = useToast();
  const {
    sites,
    activeSite,
    currentPath,
    files,
    transfers,
    devices,
    isLoading,
    createSite,
    deleteSite,
    toggleSiteFavorite,
    connect,
    navigateTo,
    downloadFile,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
    retryTransfer,
    clearCompleted,
    startP2PDiscovery,
    trustDevice,
    createQRSession,
    getStats,
    getHistory,
  } = useFileTransfer();

  const [activeTab, setActiveTab] = useState('browser');
  const [showNewSite, setShowNewSite] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrSession, setQRSession] = useState<{ qrCode: string; sessionCode: string } | null>(null);

  // Start P2P discovery on mount
  useEffect(() => {
    startP2PDiscovery();
  }, [startP2PDiscovery]);

  const handleCreateSite = async (config: Omit<SiteConfig, 'id' | 'favorite' | 'lastConnected'>) => {
    try {
      await createSite(config);
      toast({ title: "Connection Saved", description: `${config.name} added successfully` });
    } catch (_error) {
      toast({ title: "Error", description: "Failed to save connection", variant: "destructive" });
    }
  };

  const handleConnect = async (siteId: string) => {
    try {
      await connect(siteId);
      toast({ title: "Connected", description: "Successfully connected to server" });
    } catch (_error) {
      toast({ title: "Connection Failed", description: String(_error), variant: "destructive" });
    }
  };

  const handleNavigate = async (path: string) => {
    await navigateTo(path);
  };

  const handleDownload = async (file: FileEntry) => {
    if (!activeSite) return;
    try {
      await downloadFile(file.path, `/Downloads/${file.name}`);
      toast({ title: "Download Started", description: `Downloading ${file.name}` });
    } catch (_error) {
      toast({ title: "Error", description: "Failed to start download", variant: "destructive" });
    }
  };

  const handleCreateQRSession = async () => {
    const selectedFileEntries = files.filter(f => selectedFiles.has(f.id));
    if (selectedFileEntries.length === 0) {
      toast({ title: "No Files Selected", description: "Select files to share", variant: "destructive" });
      return;
    }

    try {
      const session = await createQRSession(selectedFileEntries);
      if (session) {
        setQRSession({ qrCode: session.qrCode, sessionCode: session.sessionCode });
        setShowQRDialog(true);
      }
    } catch (_error) {
      toast({ title: "Error", description: "Failed to create share link", variant: "destructive" });
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const stats = getStats();
  const activeTransfers = transfers.filter(t => t.status === 'transferring' || t.status === 'queued');

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <Server className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">File Transfer Elite</h1>
              <p className="text-sm text-muted-foreground">
                FTP/SFTP + P2P AirDrop + QR Share
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeSite && (
              <Badge className="bg-green-500/10 text-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {activeSite.name}
              </Badge>
            )}
            {activeTransfers.length > 0 && (
              <Badge variant="secondary">
                {activeTransfers.length} active transfers
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Sites */}
        <div className="w-72 border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Connections</h2>
              <Button size="sm" onClick={() => setShowNewSite(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {sites.map(site => (
                <SiteCard
                  key={site.id}
                  site={site}
                  isActive={activeSite?.id === site.id}
                  onConnect={() => handleConnect(site.id)}
                  onDelete={() => deleteSite(site.id)}
                  onToggleFavorite={() => toggleSiteFavorite(site.id)}
                />
              ))}
              {sites.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No connections yet</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setShowNewSite(true)}
                  >
                    Add your first connection
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-4 pt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="browser" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Browser
                </TabsTrigger>
                <TabsTrigger value="transfers" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Transfers
                  {activeTransfers.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {activeTransfers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="airdrop" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  AirDrop
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Stats
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Browser Tab */}
            <TabsContent value="browser" className="flex-1 p-4 pt-0 overflow-hidden">
              {!activeSite ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Server className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Connection</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select a connection from the sidebar to browse files
                    </p>
                    <Button onClick={() => setShowNewSite(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Connection
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigateTo(currentPath)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                      {selectedFiles.size > 0 && (
                        <>
                          <Button size="sm" variant="outline" onClick={handleCreateQRSession}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Share ({selectedFiles.size})
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FolderOpen className="h-4 w-4" />
                      <code className="bg-muted px-2 py-1 rounded">{currentPath}</code>
                    </div>
                  </div>

                  {/* File List */}
                  <Card className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Modified</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {files.map(file => (
                            <FileRow
                              key={file.id}
                              file={file}
                              selected={selectedFiles.has(file.id)}
                              onSelect={() => toggleFileSelection(file.id)}
                              onNavigate={() => handleNavigate(file.path)}
                              onDownload={!file.isDirectory ? () => handleDownload(file) : undefined}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Transfers Tab */}
            <TabsContent value="transfers" className="flex-1 p-4 pt-0 overflow-auto">
              <div className="flex items-center justify-between py-4">
                <h3 className="font-medium">Transfer Queue</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompleted}
                  disabled={!transfers.some(t => t.status === 'completed')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Completed
                </Button>
              </div>

              <div className="space-y-3">
                {transfers.map(transfer => (
                  <TransferItem
                    key={transfer.id}
                    transfer={transfer}
                    onPause={() => pauseTransfer(transfer.id)}
                    onResume={() => resumeTransfer(transfer.id)}
                    onCancel={() => cancelTransfer(transfer.id)}
                    onRetry={() => retryTransfer(transfer.id)}
                  />
                ))}
                {transfers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transfers in queue</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* AirDrop Tab */}
            <TabsContent value="airdrop" className="flex-1 p-4 pt-0 overflow-auto">
              <div className="py-4">
                <h3 className="font-medium mb-4">Nearby Devices</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {devices.map(device => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      onSend={() => toast({ title: "Coming Soon", description: "Select files first" })}
                      onTrust={() => trustDevice(device.id)}
                    />
                  ))}
                  {devices.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Searching for nearby devices...</p>
                      <p className="text-sm mt-2">Make sure other devices have CUBE installed</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="flex-1 p-4 pt-0 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {stats ? formatBytes(stats.todayTransferred) : '0 B'}
                      </p>
                      <p className="text-sm text-muted-foreground">Transferred Today</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {stats?.uploadsCount || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Uploads</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">
                        {stats?.downloadsCount || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Downloads</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {stats ? formatSpeed(stats.averageSpeed) : '0 B/s'}
                      </p>
                      <p className="text-sm text-muted-foreground">Average Speed</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Transfer History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {getHistory(10).map(entry => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            {entry.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{entry.transfer.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatBytes(entry.transfer.totalSize)} • {formatDuration(entry.duration / 1000)}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {entry.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                      {getHistory().length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No transfer history yet
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* New Site Dialog */}
      <NewSiteDialog
        open={showNewSite}
        onOpenChange={setShowNewSite}
        onSave={handleCreateSite}
      />

      {/* QR Share Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Share Files
            </DialogTitle>
            <DialogDescription>
              Scan this QR code or use the code below to receive files
            </DialogDescription>
          </DialogHeader>

          {qrSession && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSession.qrCode}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Or enter this code:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-3xl font-bold tracking-widest bg-muted px-4 py-2 rounded">
                    {qrSession.sessionCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(qrSession.sessionCode);
                      toast({ title: "Copied", description: "Code copied to clipboard" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQRDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FileTransferElite;
