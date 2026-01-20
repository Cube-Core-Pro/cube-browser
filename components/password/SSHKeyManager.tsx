"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('SSHKeyManager');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch as _Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  MoreVertical,
  Server,
  Terminal,
  Lock,
  Unlock as _Unlock,
  RefreshCw,
  Shield as _Shield,
  ShieldCheck,
  CheckCircle,
  AlertCircle as _AlertCircle,
  Clock,
  Activity,
  Settings,
  Play,
  Pause,
  FolderOpen as _FolderOpen,
  FileText as _FileText,
  Link,
  Unlink,
  Fingerprint,
  Hash as _Hash,
  Calendar as _Calendar,
  Globe,
  Cpu as _Cpu,
  HardDrive as _HardDrive,
  Edit,
  ExternalLink as _ExternalLink,
  Zap as _Zap,
  Loader2,
} from 'lucide-react';
import {
  SSHKey,
  SSHHost,
  SSHAgent,
  SSHKeyType,
  SSHKeyBits,
  SSHKeyGenerationOptions,
} from '@/types/password-manager-pro';
import './SSHKeyManager.css';

// ============================================================================
// BACKEND TYPES
// ============================================================================

interface BackendSSHKey {
  id: string;
  name: string;
  keyType: string;
  fingerprint: string;
  publicKey: string;
  createdAt: number;
  lastUsed: number | null;
  servers: string[];
  isDefault: boolean;
}

interface SSHKeyConfig {
  keys: BackendSSHKey[];
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

const toSSHKey = (backendKey: BackendSSHKey): SSHKey => ({
  id: backendKey.id,
  name: backendKey.name,
  type: backendKey.keyType as SSHKeyType,
  privateKey: '',
  publicKey: backendKey.publicKey,
  fingerprint: backendKey.fingerprint,
  comment: backendKey.name,
  hasPassphrase: false,
  createdAt: new Date(backendKey.createdAt * 1000),
  lastUsedAt: backendKey.lastUsed ? new Date(backendKey.lastUsed * 1000) : undefined,
  usageCount: 0,
  tags: backendKey.servers,
  associatedHosts: backendKey.servers.map((server, idx) => ({
    id: `host-${idx}`,
    hostname: server,
    port: 22,
    username: 'user',
    keyId: backendKey.id,
    forwardAgent: false,
    compression: false,
    keepAlive: true,
    serverAliveInterval: 60,
    connectTimeout: 30,
    customOptions: {},
    connectionCount: 0,
    tags: [],
  })),
});

// ============================================================================
// DEFAULT HOSTS DATA (loaded locally as backend only has keys)
// ============================================================================

const defaultSSHHosts: SSHHost[] = [
  {
    id: 'host-1',
    hostname: 'prod-web-01.example.com',
    port: 22,
    username: 'deploy',
    keyId: 'ssh-1',
    alias: 'prod-web',
    forwardAgent: false,
    compression: true,
    keepAlive: true,
    serverAliveInterval: 60,
    connectTimeout: 30,
    customOptions: {},
    lastConnected: new Date('2025-01-27'),
    connectionCount: 156,
    tags: ['production', 'web'],
    notes: 'Main production web server',
  },
  {
    id: 'host-2',
    hostname: 'github.com',
    port: 22,
    username: 'git',
    keyId: 'ssh-2',
    alias: 'github',
    forwardAgent: false,
    compression: false,
    keepAlive: true,
    serverAliveInterval: 120,
    connectTimeout: 15,
    customOptions: {},
    lastConnected: new Date('2025-01-26'),
    connectionCount: 892,
    tags: ['github', 'scm'],
  },
];

const defaultSSHAgent: SSHAgent = {
  isRunning: true,
  socketPath: '/tmp/ssh-XXXXXX/agent.XXXXX',
  loadedKeys: [],
  confirmedIdentities: [],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getKeyTypeLabel = (type: SSHKeyType): string => {
  const labels: Record<SSHKeyType, string> = {
    rsa: 'RSA',
    ed25519: 'Ed25519',
    ecdsa: 'ECDSA',
    dsa: 'DSA (Deprecated)',
  };
  return labels[type];
};

const getKeyTypeColor = (type: SSHKeyType): string => {
  const colors: Record<SSHKeyType, string> = {
    ed25519: 'bg-green-100 text-green-700',
    rsa: 'bg-blue-100 text-blue-700',
    ecdsa: 'bg-purple-100 text-purple-700',
    dsa: 'bg-red-100 text-red-700',
  };
  return colors[type];
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (days > 30) return formatDate(date);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface GenerateKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (options: SSHKeyGenerationOptions, name: string) => void;
}

function GenerateKeyDialog({ open, onOpenChange, onGenerate }: GenerateKeyDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<SSHKeyType>('ed25519');
  const [bits, setBits] = useState<SSHKeyBits>(4096);
  const [comment, setComment] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Please enter a key name', variant: 'destructive' });
      return;
    }

    if (passphrase && passphrase !== confirmPassphrase) {
      toast({ title: 'Error', description: 'Passphrases do not match', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    
    // Simulate key generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    onGenerate({
      type,
      bits: type === 'rsa' ? bits : undefined,
      comment: comment || undefined,
      passphrase: passphrase || undefined,
    }, name);

    setIsGenerating(false);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setName('');
    setType('ed25519');
    setBits(4096);
    setComment('');
    setPassphrase('');
    setConfirmPassphrase('');
    setShowPassphrase(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Generate SSH Key
          </DialogTitle>
          <DialogDescription>
            Create a new SSH key pair for secure authentication
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Key Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Server Key"
            />
          </div>

          <div className="space-y-2">
            <Label>Key Type</Label>
            <Select value={type} onValueChange={(v: SSHKeyType) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ed25519">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 text-xs">Recommended</Badge>
                    Ed25519
                  </div>
                </SelectItem>
                <SelectItem value="rsa">RSA</SelectItem>
                <SelectItem value="ecdsa">ECDSA</SelectItem>
                <SelectItem value="dsa">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">Deprecated</Badge>
                    DSA
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Ed25519 is recommended for best security and performance
            </p>
          </div>

          {type === 'rsa' && (
            <div className="space-y-2">
              <Label>Key Size (bits)</Label>
              <Select value={bits.toString()} onValueChange={(v) => setBits(parseInt(v) as SSHKeyBits)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2048">2048 bits</SelectItem>
                  <SelectItem value="3072">3072 bits</SelectItem>
                  <SelectItem value="4096">4096 bits (Recommended)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Comment (optional)</Label>
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g., user@hostname"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Passphrase (optional but recommended)</Label>
            <div className="relative">
              <Input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1"
                onClick={() => setShowPassphrase(!showPassphrase)}
              >
                {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {passphrase && (
            <div className="space-y-2">
              <Label>Confirm Passphrase</Label>
              <Input
                type={showPassphrase ? 'text' : 'password'}
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Confirm passphrase"
              />
              {confirmPassphrase && passphrase !== confirmPassphrase && (
                <p className="text-xs text-red-500">Passphrases do not match</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Generate Key
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SSHKeyCardProps {
  sshKey: SSHKey;
  isInAgent: boolean;
  onAddToAgent: (key: SSHKey) => void;
  onRemoveFromAgent: (key: SSHKey) => void;
  onCopyPublic: (key: SSHKey) => void;
  onExport: (key: SSHKey) => void;
  onDelete: (id: string) => void;
  onEdit: (key: SSHKey) => void;
}

function SSHKeyCard({ 
  sshKey, 
  isInAgent, 
  onAddToAgent, 
  onRemoveFromAgent, 
  onCopyPublic, 
  onExport, 
  onDelete,
  onEdit 
}: SSHKeyCardProps) {
  const [showPublicKey, setShowPublicKey] = useState(false);

  return (
    <Card className="ssh-key-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`key-icon ${isInAgent ? 'in-agent' : ''}`}>
            <Key className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{sshKey.name}</h4>
              <Badge className={getKeyTypeColor(sshKey.type)}>
                {getKeyTypeLabel(sshKey.type)}
                {sshKey.bits && ` ${sshKey.bits}`}
              </Badge>
              {sshKey.hasPassphrase && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Protected
                </Badge>
              )}
              {isInAgent && (
                <Badge className="bg-green-100 text-green-700 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  In Agent
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Fingerprint className="h-3 w-3" />
                {sshKey.fingerprint.substring(7, 19)}...
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {sshKey.usageCount} uses
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {sshKey.lastUsedAt ? formatRelativeTime(sshKey.lastUsedAt) : 'Never used'}
              </span>
            </div>

            {sshKey.tags.length > 0 && (
              <div className="flex items-center gap-1 mb-2">
                {sshKey.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {showPublicKey && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">Public Key</Label>
                  <Button size="sm" variant="ghost" onClick={() => onCopyPublic(sshKey)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <code className="text-xs break-all">{sshKey.publicKey}</code>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setShowPublicKey(!showPublicKey)}
            >
              {showPublicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isInAgent ? (
                  <DropdownMenuItem onClick={() => onRemoveFromAgent(sshKey)}>
                    <Unlink className="h-4 w-4 mr-2" />
                    Remove from Agent
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onAddToAgent(sshKey)}>
                    <Link className="h-4 w-4 mr-2" />
                    Add to Agent
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onCopyPublic(sshKey)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Public Key
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(sshKey)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Key
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(sshKey)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => onDelete(sshKey.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SSHHostCardProps {
  host: SSHHost;
  keyName: string;
  onConnect: (host: SSHHost) => void;
  onCopyCommand: (host: SSHHost) => void;
  onEdit: (host: SSHHost) => void;
  onDelete: (id: string) => void;
}

function SSHHostCard({ host, keyName, onConnect, onCopyCommand, onEdit, onDelete }: SSHHostCardProps) {
  return (
    <Card className="ssh-host-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="host-icon">
            <Server className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{host.alias || host.hostname}</h4>
              {host.jumpHost && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Globe className="h-3 w-3" />
                  Via Bastion
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              {host.username}@{host.hostname}:{host.port}
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Key className="h-3 w-3" />
                {keyName}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {host.connectionCount} connections
              </span>
              {host.lastConnected && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(host.lastConnected)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => onConnect(host)}>
              <Terminal className="h-4 w-4 mr-2" />
              Connect
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onCopyCommand(host)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy SSH Command
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(host)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Host
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => onDelete(host.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface SSHKeyManagerProps {
  onClose?: () => void;
}

export function SSHKeyManager({ onClose: _onClose }: SSHKeyManagerProps) {
  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [hosts, setHosts] = useState<SSHHost[]>(defaultSSHHosts);
  const [agent, setAgent] = useState<SSHAgent>(defaultSSHAgent);
  const [loading, setLoading] = useState(true);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'key' | 'host'>('key');
  const { toast } = useToast();

  // Load SSH keys from backend
  useEffect(() => {
    const loadSSHKeys = async () => {
      try {
        setLoading(true);
        const config = await invoke<SSHKeyConfig>('get_vault_ssh_keys');
        const convertedKeys = config.keys.map(toSSHKey);
        setKeys(convertedKeys);
        
        // Update agent with loaded keys
        setAgent(prev => ({
          ...prev,
          loadedKeys: convertedKeys.slice(0, 2).map(key => ({
            fingerprint: key.fingerprint,
            comment: key.comment || key.name,
            type: key.type,
            addedAt: new Date(),
          })),
        }));
      } catch (error) {
        log.error('Failed to load SSH keys:', error);
        toast({
          title: 'Error',
          description: 'Failed to load SSH keys from backend',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadSSHKeys();
  }, [toast]);

  const handleGenerateKey = useCallback((options: SSHKeyGenerationOptions, name: string) => {
    const newKey: SSHKey = {
      id: `key-${Date.now()}`,
      name,
      type: options.type,
      bits: options.bits,
      privateKey: '-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----',
      publicKey: `ssh-${options.type} AAAA... ${options.comment || 'user@cube'}`,
      fingerprint: `SHA256:${Math.random().toString(36).substring(2, 14).toUpperCase()}`,
      comment: options.comment,
      hasPassphrase: !!options.passphrase,
      createdAt: new Date(),
      usageCount: 0,
      tags: [],
      associatedHosts: [],
    };

    setKeys(prev => [newKey, ...prev]);
    toast({
      title: 'Key Generated',
      description: `SSH key "${name}" has been created`,
    });
  }, [toast]);

  const handleCopyPublicKey = useCallback(async (key: SSHKey) => {
    await navigator.clipboard.writeText(key.publicKey);
    toast({ title: 'Copied!', description: 'Public key copied to clipboard' });
  }, [toast]);

  const handleAddToAgent = useCallback((key: SSHKey) => {
    setAgent(prev => ({
      ...prev,
      loadedKeys: [
        ...prev.loadedKeys,
        {
          fingerprint: key.fingerprint,
          comment: key.comment || key.name,
          type: key.type,
          addedAt: new Date(),
        },
      ],
    }));
    toast({ title: 'Added to Agent', description: `"${key.name}" added to SSH agent` });
  }, [toast]);

  const handleRemoveFromAgent = useCallback((key: SSHKey) => {
    setAgent(prev => ({
      ...prev,
      loadedKeys: prev.loadedKeys.filter(k => k.fingerprint !== key.fingerprint),
    }));
    toast({ title: 'Removed from Agent', description: `"${key.name}" removed from SSH agent` });
  }, [toast]);

  const handleConnect = useCallback((host: SSHHost) => {
    toast({ 
      title: 'Connecting...', 
      description: `Opening SSH connection to ${host.hostname}` 
    });
  }, [toast]);

  const handleCopyCommand = useCallback(async (host: SSHHost) => {
    const command = `ssh ${host.username}@${host.hostname} -p ${host.port}`;
    await navigator.clipboard.writeText(command);
    toast({ title: 'Copied!', description: 'SSH command copied to clipboard' });
  }, [toast]);

  const handleDelete = useCallback(async (id: string, type: 'key' | 'host') => {
    if (type === 'key') {
      try {
        await invoke('delete_vault_ssh_key', { keyId: id });
        setKeys(prev => prev.filter(k => k.id !== id));
        toast({ title: 'Deleted', description: 'SSH key has been deleted' });
      } catch (error) {
        log.error('Failed to delete SSH key:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete SSH key',
          variant: 'destructive',
        });
      }
    } else {
      setHosts(prev => prev.filter(h => h.id !== id));
      toast({ title: 'Deleted', description: 'SSH host has been deleted' });
    }
    setDeleteConfirmId(null);
  }, [toast]);

  const isKeyInAgent = useCallback((fingerprint: string) => {
    return agent.loadedKeys.some(k => k.fingerprint === fingerprint);
  }, [agent.loadedKeys]);

  const getKeyName = useCallback((keyId: string) => {
    return keys.find(k => k.id === keyId)?.name || 'Unknown Key';
  }, [keys]);

  if (loading) {
    return (
      <div className="ssh-key-manager flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading SSH keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ssh-key-manager">
      {/* Header */}
      <div className="ssh-manager-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Key className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">SSH Key Manager</h2>
            <p className="text-sm text-muted-foreground">
              Manage your SSH keys and server connections
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast({ title: 'Import', description: 'Import key dialog' })}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowGenerateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Key
          </Button>
        </div>
      </div>

      {/* Agent Status */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${agent.isRunning ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {agent.isRunning ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-medium">SSH Agent</h3>
                <p className="text-sm text-muted-foreground">
                  {agent.isRunning ? `${agent.loadedKeys.length} keys loaded` : 'Agent not running'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {agent.loadedKeys.map(k => (
                <Badge key={k.fingerprint} variant="secondary" className="text-xs">
                  {k.comment}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Key className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{keys.length}</div>
            <p className="text-xs text-muted-foreground">SSH Keys</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Server className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{hosts.length}</div>
            <p className="text-xs text-muted-foreground">Hosts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{keys.filter(k => k.hasPassphrase).length}</div>
            <p className="text-xs text-muted-foreground">Protected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">
              {keys.reduce((sum, k) => sum + k.usageCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Uses</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">
            <Key className="h-4 w-4 mr-2" />
            SSH Keys ({keys.length})
          </TabsTrigger>
          <TabsTrigger value="hosts">
            <Server className="h-4 w-4 mr-2" />
            Hosts ({hosts.length})
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <Card>
            <CardContent className="p-4">
              <ScrollArea className="h-[400px]">
                {keys.length > 0 ? (
                  <div className="space-y-3">
                    {keys.map(key => (
                      <SSHKeyCard
                        key={key.id}
                        sshKey={key}
                        isInAgent={isKeyInAgent(key.fingerprint)}
                        onAddToAgent={handleAddToAgent}
                        onRemoveFromAgent={handleRemoveFromAgent}
                        onCopyPublic={handleCopyPublicKey}
                        onExport={() => toast({ title: 'Export', description: 'Exporting key...' })}
                        onDelete={(id) => { setDeleteConfirmId(id); setDeleteType('key'); }}
                        onEdit={() => toast({ title: 'Edit', description: 'Edit dialog...' })}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No SSH Keys</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate or import an SSH key to get started
                    </p>
                    <Button onClick={() => setShowGenerateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Key
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hosts">
          <Card>
            <CardContent className="p-4">
              <ScrollArea className="h-[400px]">
                {hosts.length > 0 ? (
                  <div className="space-y-3">
                    {hosts.map(host => (
                      <SSHHostCard
                        key={host.id}
                        host={host}
                        keyName={getKeyName(host.keyId)}
                        onConnect={handleConnect}
                        onCopyCommand={handleCopyCommand}
                        onEdit={() => toast({ title: 'Edit', description: 'Edit host dialog...' })}
                        onDelete={(id) => { setDeleteConfirmId(id); setDeleteType('host'); }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Hosts Configured</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first host to manage SSH connections
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Host
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>SSH Config</CardTitle>
              <CardDescription>
                Manage your SSH configuration file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label>~/.ssh/config</Label>
                    <Button size="sm" variant="ghost">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    className="font-mono text-sm"
                    rows={10}
                    value={hosts.map(h => `Host ${h.alias || h.hostname}
    HostName ${h.hostname}
    User ${h.username}
    Port ${h.port}
    IdentityFile ~/.ssh/${keys.find(k => k.id === h.keyId)?.name.toLowerCase().replace(/\s/g, '_') || 'id_rsa'}
`).join('\n')}
                    readOnly
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Config
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Config
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Dialog */}
      <GenerateKeyDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onGenerate={handleGenerateKey}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SSH {deleteType === 'key' ? 'Key' : 'Host'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. {deleteType === 'key' 
                ? 'You will lose access to any servers using this key.'
                : 'The host configuration will be removed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId, deleteType)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SSHKeyManager;
