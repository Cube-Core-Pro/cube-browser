"use client";

import React, { useState, useCallback, useRef as _useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch as _Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import {
  Terminal,
  Copy,
  Check,
  RefreshCw as _RefreshCw,
  Plus,
  Trash2 as _Trash2,
  Key,
  Lock as _Lock,
  Shield,
  History,
  Settings as _Settings,
  Eye,
  EyeOff,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Laptop,
  Smartphone,
  Globe,
  Command,
  Code as _Code,
  Play as _Play,
  Square as _Square,
  ChevronRight,
  Download,
  Upload as _Upload,
  FileCode as _FileCode,
  Zap,
  Info as _Info,
  Loader2,
} from 'lucide-react';
import {
  CLIAccess as _CLIAccessType,
  CLISession,
  APIToken,
  CLICommand,
} from '@/types/password-manager-pro';
import { logger } from '@/lib/services/logger-service';
import './CLIAccess.css';

const log = logger.scope('CLIAccess');

// ============================================================================
// BACKEND TYPES
// ============================================================================

interface BackendCLISession {
  id: string;
  name: string;
  deviceType: string;
  deviceName: string;
  ipAddress: string;
  location: string;
  lastActiveAt: number;
  createdAt: number;
  status: string;
  commandCount: number;
}

interface BackendAPIToken {
  id: string;
  name: string;
  token: string;
  permissions: string[];
  createdAt: number;
  lastUsedAt: number | null;
  expiresAt: number;
  usageCount: number;
  isActive: boolean;
}

interface BackendCLICommand {
  id: string;
  command: string;
  timestamp: number;
  success: boolean;
  output: string;
}

interface CLIAccessConfig {
  sessions: BackendCLISession[];
  tokens: BackendAPIToken[];
  commandHistory: BackendCLICommand[];
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

const toSession = (b: BackendCLISession): CLISession => ({
  id: b.id,
  name: b.name,
  deviceType: b.deviceType as CLISession['deviceType'],
  deviceName: b.deviceName,
  ipAddress: b.ipAddress,
  location: b.location,
  lastActiveAt: new Date(b.lastActiveAt * 1000),
  createdAt: new Date(b.createdAt * 1000),
  status: b.status as CLISession['status'],
  commandCount: b.commandCount,
});

const toToken = (b: BackendAPIToken): APIToken => ({
  id: b.id,
  name: b.name,
  token: b.token,
  permissions: b.permissions as APIToken['permissions'],
  createdAt: new Date(b.createdAt * 1000),
  lastUsedAt: b.lastUsedAt ? new Date(b.lastUsedAt * 1000) : undefined,
  expiresAt: new Date(b.expiresAt * 1000),
  usageCount: b.usageCount,
  isActive: b.isActive,
});

const toCommand = (b: BackendCLICommand): CLICommand => ({
  id: b.id,
  command: b.command,
  timestamp: new Date(b.timestamp * 1000),
  success: b.success,
  output: b.output,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const getDeviceIcon = (type: CLISession['deviceType']) => {
  switch (type) {
    case 'desktop':
      return <Laptop className="h-5 w-5" />;
    case 'mobile':
      return <Smartphone className="h-5 w-5" />;
    case 'server':
      return <Globe className="h-5 w-5" />;
    default:
      return <Terminal className="h-5 w-5" />;
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SessionCardProps {
  session: CLISession;
  isCurrentSession: boolean;
  onRevoke: (session: CLISession) => void;
}

function SessionCard({ session, isCurrentSession, onRevoke }: SessionCardProps) {
  return (
    <Card className={`session-card ${session.status} ${isCurrentSession ? 'current' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`session-icon ${session.status}`}>
            {getDeviceIcon(session.deviceType)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{session.name}</h4>
              {isCurrentSession && (
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                  Current
                </Badge>
              )}
              <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                {session.status}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              {session.deviceName}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {session.ipAddress}
              </span>
              {session.lastActiveAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(session.lastActiveAt)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Command className="h-3 w-3" />
                {session.commandCount} commands
              </span>
            </div>
          </div>

          {!isCurrentSession && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRevoke(session)}
              className="text-red-600 hover:bg-red-50"
            >
              Revoke
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TokenCardProps {
  token: APIToken;
  onRevoke: (token: APIToken) => void;
  onCopy: (token: string) => void;
  copiedToken: string | null;
}

function TokenCard({ token, onRevoke, onCopy, copiedToken }: TokenCardProps) {
  const [showToken, setShowToken] = useState(false);
  const isCopied = copiedToken === token.token;
  const isExpiringSoon = token.expiresAt && (token.expiresAt.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;

  return (
    <Card className={`token-card ${!token.isActive ? 'inactive' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`token-icon ${token.isActive ? 'active' : 'inactive'}`}>
            <Key className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{token.name}</h4>
              {!token.isActive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
              {isExpiringSoon && token.isActive && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                  Expiring Soon
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {showToken ? token.token : '••••••••••••••••••••••••'}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowToken(!showToken)}
                className="h-6 w-6 p-0"
              >
                {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCopy(token.token)}
                className={`h-6 w-6 p-0 ${isCopied ? 'text-green-600' : ''}`}
              >
                {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {token.permissions.join(', ')}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {token.usageCount} uses
              </span>
              {token.expiresAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expires {formatDate(token.expiresAt)}
                </span>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onRevoke(token)}
            className="text-red-600 hover:bg-red-50"
          >
            Revoke
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface CommandHistoryItemProps {
  command: CLICommand;
}

function CommandHistoryItem({ command }: CommandHistoryItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`command-item ${command.success ? 'success' : 'error'}`}>
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className={`command-status ${command.success ? 'success' : 'error'}`}>
          {command.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <code className="text-sm font-mono">{command.command}</code>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(command.timestamp)}
        </span>
        <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </div>
      
      {expanded && command.output && (
        <div className="mt-2 p-3 bg-muted rounded-lg">
          <pre className="text-xs font-mono whitespace-pre-wrap">{command.output}</pre>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface CLIAccessProps {
  onClose?: () => void;
}

export function CLIAccess({ onClose: _onClose }: CLIAccessProps) {
  const [sessions, setSessions] = useState<CLISession[]>([]);
  const [tokens, setTokens] = useState<APIToken[]>([]);
  const [commandHistory, setCommandHistory] = useState<CLICommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTokenDialog, setShowNewTokenDialog] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenPermissions, setNewTokenPermissions] = useState<string[]>(['read']);
  const [newTokenExpiry, setNewTokenExpiry] = useState('90');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const { toast } = useToast();

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const config = await invoke<CLIAccessConfig>('get_cli_access_config');
        setSessions(config.sessions.map(toSession));
        setTokens(config.tokens.map(toToken));
        setCommandHistory(config.commandHistory.map(toCommand));
      } catch (error) {
        log.error('Failed to load CLI access config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load CLI access data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

  const handleRevokeSession = useCallback(async (session: CLISession) => {
    try {
      await invoke('revoke_cli_session', { sessionId: session.id });
      setSessions(prev => prev.filter(s => s.id !== session.id));
      toast({
        title: 'Session Revoked',
        description: `${session.name} has been revoked`,
      });
    } catch (error) {
      log.error('Failed to revoke session:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke session',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleRevokeToken = useCallback(async (token: APIToken) => {
    try {
      await invoke('revoke_api_token', { tokenId: token.id });
      setTokens(prev => prev.map(t => 
        t.id === token.id ? { ...t, isActive: false } : t
      ));
      toast({
        title: 'Token Revoked',
        description: `${token.name} has been revoked`,
      });
    } catch (error) {
      log.error('Failed to revoke token:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke token',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleCopyToken = useCallback((token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast({
      title: 'Copied!',
      description: 'Token copied to clipboard',
    });
  }, [toast]);

  const handleCopyCommand = useCallback((command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
    toast({
      title: 'Copied!',
      description: 'Command copied to clipboard',
    });
  }, [toast]);

  const handleCreateToken = useCallback(async () => {
    if (!newTokenName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a token name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const createdToken = await invoke<BackendAPIToken>('create_api_token', {
        name: newTokenName,
        permissions: newTokenPermissions,
      });

      setTokens(prev => [toToken(createdToken), ...prev]);
      setShowNewTokenDialog(false);
      setNewTokenName('');
      setNewTokenPermissions(['read']);
      setNewTokenExpiry('90');

      toast({
        title: 'Token Created',
        description: 'New API token has been created. Copy it now - you won\'t be able to see it again.',
      });
    } catch (error) {
      log.error('Failed to create token:', error);
      toast({
        title: 'Error',
        description: 'Failed to create API token',
        variant: 'destructive',
      });
    }
  }, [newTokenName, newTokenPermissions, toast]);

  const quickCommands = [
    { cmd: 'cube vault list', desc: 'List all items in vault' },
    { cmd: 'cube item get <name>', desc: 'Get a specific item' },
    { cmd: 'cube generate password', desc: 'Generate a secure password' },
    { cmd: 'cube sync', desc: 'Sync vault with server' },
    { cmd: 'cube item create login', desc: 'Create a new login item' },
    { cmd: 'cube export --format json', desc: 'Export vault data' },
  ];

  if (loading) {
    return (
      <div className="cli-access flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="cli-access">
      {/* Header */}
      <div className="cli-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Terminal className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">CLI & API Access</h2>
            <p className="text-sm text-muted-foreground">
              Manage sessions, tokens, and command history
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download CLI
          </Button>
          <Button onClick={() => setShowNewTokenDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Token
          </Button>
        </div>
      </div>

      {/* Quick Reference */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {quickCommands.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-between h-auto py-2 px-3"
                onClick={() => handleCopyCommand(item.cmd)}
              >
                <div className="text-left">
                  <code className="text-xs font-mono">{item.cmd}</code>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {copiedCommand === item.cmd ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">
            <Laptop className="h-4 w-4 mr-2" />
            Sessions ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="tokens">
            <Key className="h-4 w-4 mr-2" />
            API Tokens ({tokens.filter(t => t.isActive).length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Command History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Sessions</CardTitle>
              <CardDescription>
                Manage CLI sessions across your devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.map((session, index) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        isCurrentSession={index === 0}
                        onRevoke={handleRevokeSession}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Terminal className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Active Sessions</h3>
                    <p className="text-muted-foreground">
                      Install the CUBE CLI to get started
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">API Tokens</CardTitle>
                <CardDescription>
                  Create and manage API tokens for scripts and integrations
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {tokens.length > 0 ? (
                  <div className="space-y-3">
                    {tokens.map(token => (
                      <TokenCard
                        key={token.id}
                        token={token}
                        onRevoke={handleRevokeToken}
                        onCopy={handleCopyToken}
                        copiedToken={copiedToken}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Key className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No API Tokens</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a token to access CUBE via API
                    </p>
                    <Button onClick={() => setShowNewTokenDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Token
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Command History</CardTitle>
              <CardDescription>
                Recent CLI commands and their outputs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {commandHistory.length > 0 ? (
                  <div className="space-y-2">
                    {commandHistory.map(cmd => (
                      <CommandHistoryItem key={cmd.id} command={cmd} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Command History</h3>
                    <p className="text-muted-foreground">
                      Commands executed via CLI will appear here
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Token Dialog */}
      <Dialog open={showNewTokenDialog} onOpenChange={setShowNewTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Token</DialogTitle>
            <DialogDescription>
              Generate a new token for CLI or API access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="token-name">Token Name</Label>
              <Input
                id="token-name"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                placeholder="e.g., CI/CD Pipeline"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['read', 'write', 'delete'].map(perm => (
                  <Button
                    key={perm}
                    size="sm"
                    variant={newTokenPermissions.includes(perm) ? 'default' : 'outline'}
                    onClick={() => {
                      if (newTokenPermissions.includes(perm)) {
                        setNewTokenPermissions(prev => prev.filter(p => p !== perm));
                      } else {
                        setNewTokenPermissions(prev => [...prev, perm]);
                      }
                    }}
                    className="capitalize"
                  >
                    {perm}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="token-expiry">Expires In</Label>
              <Select value={newTokenExpiry} onValueChange={setNewTokenExpiry}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Important</p>
                <p className="text-yellow-700">
                  The token will only be shown once after creation. Make sure to copy it immediately.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTokenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateToken}>
              <Key className="h-4 w-4 mr-2" />
              Create Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CLIAccess;
