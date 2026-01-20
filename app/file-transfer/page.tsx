"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { open, save } from '@tauri-apps/plugin-dialog';
import * as ftpService from '@/lib/services/ftpService';
import type { FTPSite, FTPTransfer } from '@/lib/services/ftpService';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Server,
  Upload,
  Download,
  Folder,
  File,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Lock,
  CheckCircle2,
  Sparkles,
  Globe,
  Key,
  Bookmark,
  Settings,
  X
} from 'lucide-react';

// ==================== Types ====================

interface FileItemUI {
  name: string;
  size: number;
  type: 'file' | 'directory';
  modified: string;
  permissions?: string;
  selected?: boolean;
}

interface LocalFile {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  modified: string;
}

interface Bookmark {
  id: string;
  name: string;
  localPath: string;
  remotePath: string;
  siteId: string;
}

interface TransferQueueItem {
  id: string;
  localPath: string;
  remotePath: string;
  direction: 'upload' | 'download';
  size: number;
  progress: number;
  status: 'queued' | 'transferring' | 'completed' | 'failed' | 'paused';
  speed: number;
  siteId: string;
}

export default function FileTransferPage() {
  const { t: _t } = useTranslation();
  const { toast } = useToast();

  const [sites, setSites] = useState<FTPSite[]>([]);
  const [activeSite, setActiveSite] = useState<FTPSite | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItemUI[]>([]);
  const [transfers, setTransfers] = useState<FTPTransfer[]>([]);
  const [_loading, setLoading] = useState(false);
  
  // Dual Pane State
  const [localPath, setLocalPath] = useState<string>('~');
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [selectedLocalFiles, setSelectedLocalFiles] = useState<Set<string>>(new Set());
  const [selectedRemoteFiles, setSelectedRemoteFiles] = useState<Set<string>>(new Set());
  
  // View Options
  const [_viewMode, _setViewMode] = useState<'list' | 'grid'>('list');
  const [_showHiddenFiles, _setShowHiddenFiles] = useState(false);
  const [sortBy, _setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortAsc, _setSortAsc] = useState(true);
  
  // Bookmarks
  const [_bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [_showBookmarks, _setShowBookmarks] = useState(false);
  
  // Quick Connect
  const [_showQuickConnect, setShowQuickConnect] = useState(false);
  const [quickHost, _setQuickHost] = useState('');
  const [quickUser, _setQuickUser] = useState('');
  const [quickPass, _setQuickPass] = useState('');
  const [quickPort, _setQuickPort] = useState('22');
  
  // Transfer Queue
  const [_transferQueue, setTransferQueue] = useState<TransferQueueItem[]>([]);
  const [_showTransferQueue, _setShowTransferQueue] = useState(true);

  // Connection form state
  const [showNewConnection, setShowNewConnection] = useState(false);
  const [newConnName, setNewConnName] = useState('');
  const [connType, setConnType] = useState<'FTP' | 'SFTP' | 'FTPS'>('SFTP');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadSites();
    loadLocalDirectory(localPath);
    const interval = setInterval(loadTransfers, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // ==================== Local File Operations ====================
  
  const loadLocalDirectory = useCallback(async (path: string) => {
    // Mock local files - in production, use Tauri file system API
    const mockFiles: LocalFile[] = [
      { name: '..', path: path, size: 0, type: 'directory', modified: '' },
      { name: 'Documents', path: `${path}/Documents`, size: 0, type: 'directory', modified: '2024-01-15' },
      { name: 'Downloads', path: `${path}/Downloads`, size: 0, type: 'directory', modified: '2024-01-14' },
      { name: 'Desktop', path: `${path}/Desktop`, size: 0, type: 'directory', modified: '2024-01-13' },
      { name: 'project.zip', path: `${path}/project.zip`, size: 15360000, type: 'file', modified: '2024-01-10' },
      { name: 'notes.txt', path: `${path}/notes.txt`, size: 2048, type: 'file', modified: '2024-01-09' },
    ];
    setLocalFiles(mockFiles);
    setLocalPath(path);
  }, []);
  
  const _navigateLocalUp = () => {
    const parent = localPath.split('/').slice(0, -1).join('/') || '~';
    loadLocalDirectory(parent);
  };
  
  const _toggleLocalFileSelection = (fileName: string) => {
    setSelectedLocalFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  };
  
  const _toggleRemoteFileSelection = (fileName: string) => {
    setSelectedRemoteFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  };
  
  // ==================== Transfer Queue Operations ====================
  
  const _uploadSelectedFiles = () => {
    if (selectedLocalFiles.size === 0 || !activeSite) return;
    
    const newTransfers: TransferQueueItem[] = Array.from(selectedLocalFiles).map(fileName => ({
      id: Date.now().toString() + Math.random(),
      localPath: `${localPath}/${fileName}`,
      remotePath: `${currentPath}/${fileName}`,
      direction: 'upload',
      size: localFiles.find(f => f.name === fileName)?.size || 0,
      progress: 0,
      status: 'queued',
      speed: 0,
      siteId: activeSite.id,
    }));
    
    setTransferQueue(prev => [...prev, ...newTransfers]);
    setSelectedLocalFiles(new Set());
    toast({ title: 'Upload Queued', description: `${newTransfers.length} file(s) added to queue` });
  };
  
  const _downloadSelectedFiles = () => {
    if (selectedRemoteFiles.size === 0 || !activeSite) return;
    
    const newTransfers: TransferQueueItem[] = Array.from(selectedRemoteFiles).map(fileName => ({
      id: Date.now().toString() + Math.random(),
      localPath: `${localPath}/${fileName}`,
      remotePath: `${currentPath}/${fileName}`,
      direction: 'download',
      size: files.find(f => f.name === fileName)?.size || 0,
      progress: 0,
      status: 'queued',
      speed: 0,
      siteId: activeSite.id,
    }));
    
    setTransferQueue(prev => [...prev, ...newTransfers]);
    setSelectedRemoteFiles(new Set());
    toast({ title: 'Download Queued', description: `${newTransfers.length} file(s) added to queue` });
  };
  
  const _removeFromQueue = (id: string) => {
    setTransferQueue(prev => prev.filter(t => t.id !== id));
  };
  
  const _clearCompletedTransfers = () => {
    setTransferQueue(prev => prev.filter(t => t.status !== 'completed'));
  };
  
  const _pauseTransfer = (id: string) => {
    setTransferQueue(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'paused' as const } : t
    ));
  };
  
  const _resumeTransfer = (id: string) => {
    setTransferQueue(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'queued' as const } : t
    ));
  };
  
  // ==================== Bookmarks ====================
  
  const _addBookmark = () => {
    if (!activeSite) return;
    
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      name: `${activeSite.name} - ${currentPath}`,
      localPath,
      remotePath: currentPath,
      siteId: activeSite.id,
    };
    
    setBookmarks(prev => [...prev, newBookmark]);
    toast({ title: 'Bookmark Added' });
  };
  
  const _loadBookmark = (bookmark: Bookmark) => {
    const site = sites.find(s => s.id === bookmark.siteId);
    if (site) {
      handleConnect(site);
      loadLocalDirectory(bookmark.localPath);
      // loadDirectory will be called with bookmark.remotePath after connect
    }
  };
  
  const _removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };
  
  // ==================== Quick Connect ====================
  
  const _handleQuickConnect = async () => {
    if (!quickHost || !quickUser) {
      toast({ title: 'Error', description: 'Host and username required', variant: 'destructive' });
      return;
    }
    
    try {
      // Create temporary site
      const tempSite: FTPSite = {
        id: 'quick-' + Date.now(),
        name: `Quick: ${quickHost}`,
        host: quickHost,
        port: parseInt(quickPort),
        username: quickUser,
        password: quickPass,
        protocol: 'SFTP',
        passive: true,
        lastConnected: Date.now(),
      };
      
      await handleConnect(tempSite);
      setShowQuickConnect(false);
    } catch (error) {
      toast({ title: 'Quick Connect Failed', description: String(error), variant: 'destructive' });
    }
  };
  
  // ==================== Sort Files ====================
  
  const _sortedLocalFiles = [...localFiles].sort((a, b) => {
    // Directories first
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'date':
        comparison = a.modified.localeCompare(b.modified);
        break;
    }
    return sortAsc ? comparison : -comparison;
  });
  
  const _sortedRemoteFiles = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'date':
        comparison = a.modified.localeCompare(b.modified);
        break;
    }
    return sortAsc ? comparison : -comparison;
  });

  const loadSites = useCallback(async () => {
    try {
      const allSites = await ftpService.getSites();
      setSites(allSites);
    } catch (error) {
      log.error('Failed to load sites:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load connections',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const loadTransfers = useCallback(async () => {
    try {
      const queue = await ftpService.getTransferQueue();
      setTransfers(queue);
    } catch (error) {
      log.error('Failed to load transfers:', error);
    }
  }, []);

  const loadDirectory = useCallback(async (path: string) => {
    if (!activeSite) return;
    
    setLoading(true);
    try {
      const entries = await ftpService.listDirectory(activeSite.id, path);
      
      // Convert service FTPEntry to UI FileItemUI
      const uiFiles: FileItemUI[] = entries.map(entry => ({
        name: entry.name,
        size: entry.size,
        type: entry.isDirectory ? 'directory' : 'file',
        modified: new Date(entry.modified * 1000).toISOString().split('T')[0],
        permissions: entry.permissions,
      }));
      
      setFiles(uiFiles);
      setCurrentPath(path);
    } catch (error) {
      log.error('Failed to load directory:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load directory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [activeSite, toast]);

  const handleConnect = async (site: FTPSite) => {
    setLoading(true);
    try {
      toast({
        title: 'Connecting',
        description: `Connecting to ${site.name}...`,
      });

      // Test connection
      await ftpService.testConnection(site.id);
      
      setActiveSite(site);
      await loadDirectory('/');

      toast({
        title: 'Connected',
        description: `Connected to ${site.name} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setActiveSite(null);
    setFiles([]);
    setCurrentPath('/');

    toast({
      title: 'Disconnected',
      description: 'Connection closed',
    });
  };

  const handleCreateConnection = async () => {
    if (!newConnName || !host || !username) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await ftpService.createSite({
        name: newConnName,
        host,
        port: parseInt(port),
        username,
        password,
        protocol: connType,
        passive: true,
      });

      await loadSites();
      setShowNewConnection(false);

      // Reset form
      setNewConnName('');
      setHost('');
      setPort('22');
      setUsername('');
      setPassword('');

      toast({
        title: 'Connection Saved',
        description: `${newConnName} added successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create connection',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    try {
      await ftpService.deleteSite(siteId);
      await loadSites();
      
      if (activeSite?.id === siteId) {
        handleDisconnect();
      }

      toast({
        title: 'Success',
        description: 'Connection deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete connection',
        variant: 'destructive',
      });
    }
  };

  const handleUploadFile = async () => {
    if (!activeSite) return;

    try {
      const selected = await open({
        multiple: false,
        title: 'Select file to upload',
      });

      if (selected && typeof selected === 'string') {
        await ftpService.uploadFile(activeSite.id, selected, currentPath);
        await loadTransfers();
        
        toast({
          title: 'Upload Started',
          description: `Uploading file to ${currentPath}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start upload',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadFile = async (fileName: string) => {
    if (!activeSite) return;

    try {
      const savePath = await save({
        title: 'Save file as',
        defaultPath: fileName,
      });

      if (savePath) {
        const remotePath = `${currentPath}/${fileName}`.replace('//', '/');
        await ftpService.downloadFile(activeSite.id, remotePath, savePath);
        await loadTransfers();
        
        toast({
          title: 'Download Started',
          description: `Downloading ${fileName}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start download',
        variant: 'destructive',
      });
    }
  };

  const handlePauseTransfer = async (transferId: string) => {
    try {
      await ftpService.pauseTransfer(transferId);
      await loadTransfers();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to pause transfer',
        variant: 'destructive',
      });
    }
  };

  const handleResumeTransfer = async (transferId: string) => {
    try {
      await ftpService.resumeTransfer(transferId);
      await loadTransfers();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to resume transfer',
        variant: 'destructive',
      });
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    try {
      await ftpService.cancelTransfer(transferId);
      await loadTransfers();
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel transfer',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const _formatSpeed = (bytesPerSecond: number) => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const _getProgress = (transfer: FTPTransfer) => {
    return transfer.size > 0 ? (transfer.transferred / transfer.size) * 100 : 0;
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol) {
      case 'SFTP': return <Key className="w-4 h-4" />;
      case 'FTPS': return <Lock className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <AppLayout tier="elite">
      <div className="h-full w-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Enterprise File Transfer</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Superior to FileZilla - FTP/SFTP/P2P with AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                ELITE
              </Badge>
              {activeSite && (
                <Badge className="bg-green-500 text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Connections Sidebar */}
          <Card className="w-80 rounded-none border-r border-t-0">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Connections</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowNewConnection(!showNewConnection)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  New
                </Button>
              </div>
            </CardHeader>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <CardContent className="p-4 space-y-3">
                {showNewConnection && (
                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">New Connection</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={newConnName}
                          onChange={(e) => setNewConnName(e.target.value)}
                          placeholder="My Server"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={connType}
                          onValueChange={(v: 'FTP' | 'SFTP' | 'FTPS') => {
                            setConnType(v);
                            setPort(v === 'SFTP' ? '22' : '21');
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SFTP">SFTP (Secure)</SelectItem>
                            <SelectItem value="FTP">FTP</SelectItem>
                            <SelectItem value="FTPS">FTPS (TLS)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Host</Label>
                          <Input
                            value={host}
                            onChange={(e) => setHost(e.target.value)}
                            placeholder="example.com"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Port</Label>
                          <Input
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            placeholder="22"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Username</Label>
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="user"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Password</Label>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateConnection}
                          size="sm"
                          className="flex-1"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => setShowNewConnection(false)}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {sites.map((site) => (
                  <Card
                    key={site.id}
                    className={`cursor-pointer transition-all ${
                      activeSite?.id === site.id
                        ? 'border-2 border-blue-500 shadow-lg'
                        : 'hover:border-blue-300'
                    }`}
                    onClick={() => handleConnect(site)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getProtocolIcon(site.protocol)}
                          <span className="font-semibold text-sm">{site.name}</span>
                        </div>
                        {activeSite?.id === site.id && (
                          <Badge className="bg-green-500 text-white text-xs">
                            Active
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Server className="w-3 h-3" />
                          <span className="uppercase font-semibold">{site.protocol}</span>
                        </div>
                        <div>{site.host}:{site.port}</div>
                        <div>User: {site.username}</div>
                      </div>

                      <div className="flex gap-2">
                        {activeSite?.id === site.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisconnect();
                            }}
                          >
                            Disconnect
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSite(site.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </ScrollArea>
          </Card>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <Tabs defaultValue="browser" className="flex-1 flex flex-col">
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="browser" className="flex-1">
                  <Folder className="w-4 h-4 mr-2" />
                  File Browser
                </TabsTrigger>
                <TabsTrigger value="transfers" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Transfers ({transfers.filter((t) => t.status === 'active').length})
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="browser" className="flex-1 m-0 p-4">
                {!activeSite ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Server className="w-16 h-16 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Select a connection to browse files
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={handleUploadFile}>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => loadDirectory(currentPath)}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>

                      <Badge variant="outline" className="text-xs">
                        {files.length} items
                      </Badge>
                    </div>

                    {/* File List */}
                    <Card>
                      <ScrollArea className="h-[calc(100vh-350px)]">
                        <table className="w-full">
                          <thead className="bg-muted/50 border-b sticky top-0">
                            <tr>
                              <th className="text-left p-3 text-xs font-semibold text-foreground">
                                Name
                              </th>
                              <th className="text-left p-3 text-xs font-semibold text-foreground">
                                Size
                              </th>
                              <th className="text-left p-3 text-xs font-semibold text-foreground">
                                Modified
                              </th>
                              <th className="text-right p-3 text-xs font-semibold text-foreground">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {files.map((file, idx) => (
                              <tr
                                key={idx}
                                className="border-b hover:bg-muted/50 cursor-pointer"
                                onClick={() => {
                                  if (file.type === 'directory') {
                                    const newPath = `${currentPath}/${file.name}`.replace('//', '/');
                                    loadDirectory(newPath);
                                  }
                                }}
                              >
                                <td className="p-3 flex items-center gap-2">
                                  {file.type === 'directory' ? (
                                    <Folder className="w-4 h-4 text-blue-500" />
                                  ) : (
                                    <File className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  <span className="text-sm font-medium text-foreground">
                                    {file.name}
                                  </span>
                                </td>
                                <td className="p-3 text-sm text-muted-foreground">
                                  {formatFileSize(file.size)}
                                </td>
                                <td className="p-3 text-sm text-muted-foreground">
                                  {file.modified}
                                </td>
                                <td className="p-3 text-right">
                                  {file.type === 'file' && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadFile(file.name);
                                      }}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </ScrollArea>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transfers" className="flex-1 m-0 p-4">
                <div className="space-y-4">
                  {transfers.map((transfer) => {
                    const fileName = transfer.localPath.split('/').pop() || transfer.localPath;
                    const progressPercent = transfer.size > 0 
                      ? Math.round((transfer.transferred / transfer.size) * 100) 
                      : 0;

                    return (
                      <Card key={transfer.id}>
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {transfer.direction === 'upload' ? (
                                <Upload className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Download className="w-4 h-4 text-green-500" />
                              )}
                              <span className="font-semibold text-sm">
                                {fileName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge
                                className={`${
                                  transfer.status === 'completed'
                                    ? 'bg-green-500'
                                    : transfer.status === 'failed'
                                    ? 'bg-red-500'
                                    : transfer.status === 'paused'
                                    ? 'bg-yellow-500'
                                    : 'bg-blue-500'
                                } text-white`}
                              >
                                {transfer.status === 'active' ? 'Active' : transfer.status}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 pt-2 space-y-3">
                          <Progress value={progressPercent} />

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {formatFileSize(transfer.transferred)} /{' '}
                              {formatFileSize(transfer.size)}
                            </span>
                            <span>{progressPercent}%</span>
                          </div>

                          {transfer.status === 'active' && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {transfer.speed || '0 KB/s'}
                              </span>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handlePauseTransfer(transfer.id)}
                                >
                                  <Pause className="w-3 h-3 mr-1" />
                                  Pause
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleCancelTransfer(transfer.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {transfer.status === 'paused' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleResumeTransfer(transfer.id)}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Resume
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleCancelTransfer(transfer.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}

                          {transfer.status === 'failed' && transfer.error && (
                            <div className="text-xs text-red-500">
                              Error: {transfer.error}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {transfers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Download className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p>No active transfers</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="flex-1 m-0 p-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Transfer Settings</CardTitle>
                    <CardDescription>
                      Configure encryption, bandwidth, and resume options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Bandwidth Limit</Label>
                      <Select defaultValue="unlimited">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                          <SelectItem value="1mb">1 MB/s</SelectItem>
                          <SelectItem value="5mb">5 MB/s</SelectItem>
                          <SelectItem value="10mb">10 MB/s</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Enable Resume</Label>
                      <Badge className="bg-green-500">Enabled</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Encryption</Label>
                      <Badge className="bg-green-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        AES-256
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>AI File Organization</Label>
                      <Badge className="bg-purple-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Active
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
