"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  ArrowLeft, Upload, Download, Server, Plus, Trash2, 
  RefreshCw, Folder, File, HardDrive, Globe, Lock, Key, X,
  Pause, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';
import { open, save } from '@tauri-apps/plugin-dialog';
import * as ftpService from '@/lib/services/ftpService';
import type { FTPSite, FTPTransfer } from '@/lib/services/ftpService';

// FTP Entry UI type (extends service type with UI-specific fields)
interface FtpEntryUI {
  name: string;
  is_dir: boolean;
  size: number;
  modified: string;
  permissions: string;
}

// New site form state
interface NewSiteForm {
  name: string;
  protocol: 'FTP' | 'SFTP' | 'FTPS';
  host: string;
  port: number;
  username: string;
  password: string;
  sshKeyPath: string;
}

export default function FTPPage() {
  const { t: _t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [sites, setSites] = useState<FTPSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<FTPSite | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [entries, setEntries] = useState<FtpEntryUI[]>([]);
  const [transfers, setTransfers] = useState<FTPTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewSite, setShowNewSite] = useState(false);
  
  // New site form
  const [newSite, setNewSite] = useState<NewSiteForm>({
    name: '',
    protocol: 'SFTP',
    host: '',
    port: 22,
    username: '',
    password: '',
    sshKeyPath: ''
  });

  useEffect(() => {
    loadSites();
    const interval = setInterval(loadTransfers, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSites = useCallback(async () => {
    try {
      const result = await ftpService.getSites();
      setSites(result);
    } catch (err) {
      log.error('Failed to load sites:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load sites',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const loadTransfers = useCallback(async () => {
    try {
      const result = await ftpService.getTransferQueue();
      setTransfers(result);
    } catch (err) {
      log.error('Failed to load transfers:', err);
    }
  }, []);

  const loadDirectory = useCallback(async (path: string) => {
    if (!selectedSite) return;
    setLoading(true);
    setError(null);
    try {
      const result = await ftpService.listDirectory(selectedSite.id, path);
      // Convert service FTPEntry to UI FtpEntryUI
      const uiEntries: FtpEntryUI[] = result.map(entry => ({
        name: entry.name,
        is_dir: entry.isDirectory,
        size: entry.size,
        modified: new Date(entry.modified * 1000).toISOString(),
        permissions: entry.permissions || '',
      }));
      setEntries(uiEntries);
      setCurrentPath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load directory');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load directory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedSite, toast]);

  const handleCreateSite = async () => {
    if (!newSite.name || !newSite.host || !newSite.username) {
      setError('Name, host, and username are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await ftpService.createSite({
        name: newSite.name,
        host: newSite.host,
        port: newSite.port,
        username: newSite.username,
        password: newSite.password,
        protocol: newSite.protocol,
        passive: true,
        sshKeyPath: newSite.sshKeyPath || undefined,
      });
      await loadSites();
      setShowNewSite(false);
      setNewSite({
        name: '', protocol: 'SFTP', host: '', port: 22,
        username: '', password: '', sshKeyPath: ''
      });
      toast({
        title: 'Success',
        description: 'Site created successfully',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create site');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create site',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    try {
      await ftpService.deleteSite(siteId);
      await loadSites();
      if (selectedSite?.id === siteId) setSelectedSite(null);
      toast({
        title: 'Success',
        description: 'Site deleted successfully',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete site');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete site',
        variant: 'destructive',
      });
    }
  };

  const handleUploadFile = async () => {
    if (!selectedSite) return;
    try {
      const selected = await open({
        multiple: false,
        title: 'Select file to upload',
      });
      if (selected && typeof selected === 'string') {
        await ftpService.uploadFile(selectedSite.id, selected, currentPath);
        loadTransfers();
        toast({
          title: 'Upload Started',
          description: `Uploading file to ${currentPath}`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to upload file',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadFile = async (fileName: string) => {
    if (!selectedSite) return;
    try {
      const savePath = await save({
        title: 'Save file as',
        defaultPath: fileName,
      });
      if (savePath) {
        const remotePath = `${currentPath}/${fileName}`.replace('//', '/');
        await ftpService.downloadFile(selectedSite.id, remotePath, savePath);
        loadTransfers();
        toast({
          title: 'Download Started',
          description: `Downloading ${fileName}`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handlePauseTransfer = async (transferId: string) => {
    try {
      await ftpService.pauseTransfer(transferId);
      loadTransfers();
      toast({
        title: 'Transfer Paused',
        description: 'File transfer has been paused',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause transfer');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to pause transfer',
        variant: 'destructive',
      });
    }
  };

  const handleResumeTransfer = async (transferId: string) => {
    try {
      await ftpService.resumeTransfer(transferId);
      loadTransfers();
      toast({
        title: 'Transfer Resumed',
        description: 'File transfer has been resumed',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume transfer');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to resume transfer',
        variant: 'destructive',
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
      <div className="p-6 space-y-6">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">FTP Client</h1>
                <p className="text-sm text-muted-foreground">Enterprise File Transfer</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex justify-between items-center">
              <p className="text-red-400 text-sm">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300" aria-label="Dismiss error">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Sites Panel */}
            <Card className="p-4 bg-card border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Sites</h2>
                <Button
                  onClick={() => setShowNewSite(!showNewSite)}
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {showNewSite && (
                <div className="mb-4 p-3 bg-muted rounded-lg space-y-2">
                  <Input
                    placeholder="Site Name"
                    value={newSite.name}
                    onChange={(e) => setNewSite({...newSite, name: e.target.value})}
                    className="bg-background border text-sm"
                  />
                  <select
                    value={newSite.protocol}
                    onChange={(e) => setNewSite({...newSite, protocol: e.target.value as 'FTP' | 'SFTP' | 'FTPS'})}
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm"
                    aria-label="Protocol"
                  >
                    <option value="SFTP">SFTP (SSH)</option>
                    <option value="FTPS">FTPS (TLS)</option>
                    <option value="FTP">FTP</option>
                  </select>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Host"
                      value={newSite.host}
                      onChange={(e) => setNewSite({...newSite, host: e.target.value})}
                      className="bg-background border text-sm flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Port"
                      value={newSite.port}
                      onChange={(e) => setNewSite({...newSite, port: parseInt(e.target.value) || 22})}
                      className="bg-background border text-sm w-20"
                    />
                  </div>
                  <Input
                    placeholder="Username"
                    value={newSite.username}
                    onChange={(e) => setNewSite({...newSite, username: e.target.value})}
                    className="bg-background border text-sm"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={newSite.password}
                    onChange={(e) => setNewSite({...newSite, password: e.target.value})}
                    className="bg-background border text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateSite}
                      disabled={loading}
                      size="sm"
                      className="flex-1 bg-green-600"
                    >
                      Create
                    </Button>
                    <Button
                      onClick={() => setShowNewSite(false)}
                      size="sm"
                      variant="outline"
                      className="border"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sites.map((site) => (
                  <div
                    key={site.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedSite?.id === site.id
                        ? 'bg-cyan-500/20 border-cyan-500/50'
                        : 'bg-muted border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedSite(site);
                      loadDirectory('/');
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getProtocolIcon(site.protocol)}
                          <span className="font-medium text-sm">{site.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {site.username}@{site.host}:{site.port}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSite(site.id);
                        }}
                        className="p-1 hover:bg-red-500/20 rounded"
                        aria-label="Delete site"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* File Browser */}
            <Card className="lg:col-span-2 p-4 bg-card border">
              {selectedSite ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-cyan-400" />
                      <span className="font-mono text-sm">{currentPath}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUploadFile}
                        size="sm"
                        className="bg-gradient-to-r from-green-500 to-emerald-500"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                      <Button
                        onClick={() => loadDirectory(currentPath)}
                        size="sm"
                        variant="outline"
                        className="border"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {currentPath !== '/' && (
                      <button
                        onClick={() => {
                          const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
                          loadDirectory(parent);
                        }}
                        className="w-full p-2 text-left hover:bg-muted rounded flex items-center gap-2"
                      >
                        <Folder className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">..</span>
                      </button>
                    )}
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : (
                      entries.map((entry, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (entry.is_dir) {
                              loadDirectory(`${currentPath}/${entry.name}`.replace('//', '/'));
                            } else {
                              handleDownloadFile(entry.name);
                            }
                          }}
                          className="w-full p-2 text-left hover:bg-muted rounded flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {entry.is_dir ? (
                              <Folder className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            ) : (
                              <File className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">{entry.name}</span>
                          </div>
                          {!entry.is_dir && (
                            <span className="text-xs text-muted-foreground">{formatBytes(entry.size)}</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a site to browse files</p>
                </div>
              )}
            </Card>
          </div>

          {/* Transfer Queue */}
          {transfers.length > 0 && (
            <Card className="p-4 bg-card border">
              <h2 className="font-semibold mb-3">Active Transfers</h2>
              <div className="space-y-2">
                {transfers.map((transfer) => {
                  const progress = transfer.size > 0 
                    ? Math.round((transfer.transferred / transfer.size) * 100) 
                    : 0;
                  return (
                    <div
                      key={transfer.id}
                      className="p-3 bg-muted rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          {transfer.direction === 'upload' ? (
                            <Upload className="w-4 h-4 text-green-500 dark:text-green-400" />
                          ) : (
                            <Download className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          )}
                          <span className="text-sm font-medium">{transfer.localPath.split('/').pop()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            transfer.status === 'completed' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                            transfer.status === 'active' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                            transfer.status === 'failed' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {transfer.status}
                          </span>
                          {transfer.status === 'active' && (
                            <button
                              onClick={() => handlePauseTransfer(transfer.id)}
                              className="p-1 hover:bg-muted rounded"
                              aria-label="Pause transfer"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          )}
                          {transfer.status === 'paused' && (
                            <button
                              onClick={() => handleResumeTransfer(transfer.id)}
                              className="p-1 hover:bg-muted rounded"
                              aria-label="Resume transfer"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{progress}%</span>
                        {transfer.status === 'active' && (
                          <span>• {formatBytes(transfer.speed)}/s</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Protocol Info */}
          {!selectedSite && sites.length === 0 && (
            <div className="grid md:grid-cols-4 gap-3">
              <Card className="p-4 bg-card border text-center">
                <Globe className="w-6 h-6 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
                <div className="font-mono text-xs font-semibold text-blue-500 dark:text-blue-400">FTP</div>
                <div className="text-xs text-muted-foreground">Port 21</div>
              </Card>
              <Card className="p-4 bg-card border text-center">
                <Key className="w-6 h-6 text-green-500 dark:text-green-400 mx-auto mb-2" />
                <div className="font-mono text-xs font-semibold text-green-500 dark:text-green-400">SFTP</div>
                <div className="text-xs text-muted-foreground">Port 22</div>
              </Card>
              <Card className="p-4 bg-card border text-center">
                <Lock className="w-6 h-6 text-purple-500 dark:text-purple-400 mx-auto mb-2" />
                <div className="font-mono text-xs font-semibold text-purple-500 dark:text-purple-400">FTPS</div>
                <div className="text-xs text-muted-foreground">Port 990</div>
              </Card>
              <Card className="p-4 bg-card border text-center">
                <Lock className="w-6 h-6 text-orange-500 dark:text-orange-400 mx-auto mb-2" />
                <div className="font-mono text-xs font-semibold text-orange-500 dark:text-orange-400">FTPES</div>
                <div className="text-xs text-muted-foreground">Port 21</div>
              </Card>
            </div>
          )}
        </div>
      </main>
      </div>
    </AppLayout>
  );
}
