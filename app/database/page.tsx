"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  Database, 
  Plus, 
  Play, 
  Square, 
  RefreshCw, 
  Trash2,
  Server,
  Cpu,
  HardDrive,
  Network,
  AlertCircle,
  CheckCircle,
  Clock,
  Terminal,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import * as dockerService from '@/lib/services/dockerService';
import type { DatabaseContainer, DockerInfo, CreateDatabaseRequest, ContainerStatus, DatabaseType } from '@/lib/services/dockerService';
import './database.css';

// Database type configurations
const DATABASE_CONFIGS = {
  postgresql: {
    name: 'PostgreSQL',
    icon: '🐘',
    description: 'Advanced open-source relational database',
    versions: ['16', '15', '14', '13', '12'],
    defaultPort: 5432,
    color: '#336791',
  },
  mysql: {
    name: 'MySQL',
    icon: '🐬',
    description: 'Popular open-source relational database',
    versions: ['8.0', '8.1', '5.7'],
    defaultPort: 3306,
    color: '#4479A1',
  },
  mongodb: {
    name: 'MongoDB',
    icon: '🍃',
    description: 'Document-oriented NoSQL database',
    versions: ['7.0', '6.0', '5.0', '4.4'],
    defaultPort: 27017,
    color: '#47A248',
  },
  redis: {
    name: 'Redis',
    icon: '📦',
    description: 'In-memory data structure store',
    versions: ['7.2', '7.0', '6.2', '6.0'],
    defaultPort: 6379,
    color: '#DC382D',
  },
} as const;

export default function DatabasePage() {
  const { t } = useTranslation();
  
  // State
  const [containers, setContainers] = useState<DatabaseContainer[]>([]);
  const [dockerInfo, setDockerInfo] = useState<DockerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dockerConnected, setDockerConnected] = useState(false);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<DatabaseContainer | null>(null);
  const [containerLogs, setContainerLogs] = useState<string>('');
  
  // Create form state
  const [createForm, setCreateForm] = useState<CreateDatabaseRequest>({
    name: '',
    db_type: 'postgresql',
    version: '16',
    port: 5432,
    password: '',
    auto_restart: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load Docker info and containers
  const loadDockerData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const connected = await dockerService.testDockerConnection();
      setDockerConnected(connected);
      
      if (connected) {
        const info = await dockerService.getDockerInfo();
        setDockerInfo(info);
        
        const containerList = await dockerService.listContainers();
        setContainers(containerList);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
      setDockerConnected(false);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    loadDockerData();
  }, [loadDockerData]);

  useEffect(() => {
    loadDockerData();
  }, [loadDockerData]);

  // Refresh stats periodically
  useEffect(() => {
    if (!dockerConnected) return;
    
    const interval = setInterval(async () => {
      try {
        const containerList = await dockerService.listContainers();
        setContainers(containerList);
      } catch (err) {
        log.error('Failed to refresh containers:', err);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [dockerConnected]);

  // Create container handler
  const handleCreateContainer = async () => {
    if (!createForm.name || !createForm.password) {
      setError('Name and password are required');
      return;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      const container = await dockerService.createDatabase(createForm);
      setContainers(prev => [...prev, container]);
      setShowCreateDialog(false);
      setCreateForm({
        name: '',
        db_type: 'postgresql',
        version: '16',
        port: 5432,
        password: '',
        auto_restart: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create container';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  // Container actions
  const handleStartContainer = async (id: string) => {
    try {
      await dockerService.startContainer(id);
      await loadDockerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start container');
    }
  };

  const handleStopContainer = async (id: string) => {
    try {
      await dockerService.stopContainer(id);
      await loadDockerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop container');
    }
  };

  const handleRestartContainer = async (id: string) => {
    try {
      await dockerService.restartContainer(id);
      await loadDockerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restart container');
    }
  };

  const handleDeleteContainer = async () => {
    if (!selectedContainer) return;
    
    try {
      await dockerService.removeContainer(selectedContainer.id, true);
      setContainers(prev => prev.filter(c => c.id !== selectedContainer.id));
      setShowDeleteDialog(false);
      setSelectedContainer(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete container');
    }
  };

  const handleViewLogs = async (container: DatabaseContainer) => {
    setSelectedContainer(container);
    setShowLogsDialog(true);
    
    try {
      const logs = await dockerService.getContainerLogs(container.id, 500);
      setContainerLogs(logs.join('\n'));
    } catch (_err) {
      setContainerLogs('Failed to load logs');
    }
  };

  const handleDbTypeChange = (dbType: DatabaseType) => {
    const config = DATABASE_CONFIGS[dbType];
    setCreateForm(prev => ({
      ...prev,
      db_type: dbType,
      version: config.versions[0],
      port: config.defaultPort,
    }));
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm(prev => ({ ...prev, password }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusBadge = (status: ContainerStatus) => {
    const statusStyles: Record<ContainerStatus, string> = {
      running: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      created: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      restarting: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      removing: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      exited: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      dead: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };
    
    return <Badge className={statusStyles[status] || statusStyles.unknown}>{status}</Badge>;
  };

  return (
    <AppLayout>
      {/* M5: Loading State */}
      {isLoading && (
        <LoadingState
          title={t('database.loading.title')}
          description={t('database.loading.description')}
          className="min-h-[60vh]"
        />
      )}

      {/* M5: Error State (critical errors only) */}
      {!isLoading && error && !dockerConnected && (
        <ErrorState
          title={t('database.errors.title')}
          message={error}
          onRetry={handleRetry}
          className="min-h-[60vh]"
        />
      )}

      {/* M5: Main Content */}
      {!isLoading && (dockerConnected || !error) && (
    <div className="database-page">
      {/* Header */}
      <div className="database-page__header">
        <div className="database-page__header-content">
          <div className="database-page__icon">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <h1 className="database-page__title">{t('database.title')}</h1>
            <p className="database-page__subtitle">{t('database.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {dockerConnected ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Docker Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                <AlertCircle className="w-3 h-3 mr-1" />
                Docker Not Connected
              </Badge>
            )}
          </div>
          <Button onClick={() => loadDockerData()} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('database.actions.refresh')}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} variant="default" disabled={!dockerConnected}>
            <Plus className="w-4 h-4 mr-2" />
            {t('database.actions.newContainer')}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">Dismiss</Button>
          </div>
        </div>
      )}

      <FeatureGate feature="databaseServer" upgradeMessage="Database server management is available on Pro and Elite plans.">
        {/* Docker Info Stats */}
        {dockerInfo && dockerConnected && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Docker Version</p>
                  <p className="text-lg font-semibold">{dockerInfo.version || 'N/A'}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Play className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Running</p>
                  <p className="text-lg font-semibold">{dockerInfo.containers_running}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900/30">
                  <Square className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stopped</p>
                  <p className="text-lg font-semibold">{dockerInfo.containers_stopped}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <HardDrive className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Images</p>
                  <p className="text-lg font-semibold">{dockerInfo.images}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Not Connected State */}
        {!isLoading && !dockerConnected && (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Docker Not Running</h3>
            <p className="text-muted-foreground mb-4">Please start Docker Desktop to manage database containers.</p>
            <Button onClick={() => loadDockerData()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
          </Card>
        )}

        {/* Containers List */}
        {!isLoading && dockerConnected && (
          <>
            {containers.length > 0 ? (
              <div className="space-y-4 mb-8">
                <h2 className="text-lg font-semibold">Database Containers</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {containers.map((container) => {
                    const config = DATABASE_CONFIGS[container.db_type as keyof typeof DATABASE_CONFIGS];
                    
                    return (
                      <Card key={container.id} className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl p-2 rounded-lg" style={{ backgroundColor: `${config?.color}20` }}>
                              {config?.icon || '📦'}
                            </div>
                            <div>
                              <h3 className="font-semibold">{container.name}</h3>
                              <p className="text-sm text-muted-foreground">{config?.name || container.db_type} {container.version}</p>
                            </div>
                          </div>
                          {getStatusBadge(container.status)}
                        </div>
                        
                        {/* Container Stats */}
                        <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
                          <div className="text-center p-2 rounded-lg bg-muted">
                            <Cpu className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="font-medium">{container.stats?.cpu_percentage.toFixed(1) || '0'}%</p>
                            <p className="text-xs text-muted-foreground">CPU</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-muted">
                            <HardDrive className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="font-medium">{container.stats ? `${(container.stats.memory_usage / 1024 / 1024).toFixed(0)}MB` : '0MB'}</p>
                            <p className="text-xs text-muted-foreground">Memory</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-muted">
                            <Network className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="font-medium">{container.host_port}</p>
                            <p className="text-xs text-muted-foreground">Port</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-muted">
                            <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="font-medium">{container.started_at ? new Date(container.started_at * 1000).toLocaleDateString() : '-'}</p>
                            <p className="text-xs text-muted-foreground">Started</p>
                          </div>
                        </div>

                        {/* Connection String */}
                        <div className="mb-4 p-2 rounded-lg bg-muted text-xs font-mono break-all">
                          <span className="text-muted-foreground">Connection: </span>
                          localhost:{container.host_port}
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2" onClick={() => copyToClipboard(`localhost:${container.host_port}`)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {container.status === 'running' ? (
                            <Button variant="outline" size="sm" onClick={() => handleStopContainer(container.id)}>
                              <Square className="w-4 h-4 mr-1" />Stop
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleStartContainer(container.id)}>
                              <Play className="w-4 h-4 mr-1" />Start
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleRestartContainer(container.id)}>
                            <RefreshCw className="w-4 h-4 mr-1" />Restart
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleViewLogs(container)}>
                            <Terminal className="w-4 h-4 mr-1" />Logs
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 ml-auto" onClick={() => { setSelectedContainer(container); setShowDeleteDialog(true); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card className="p-8 text-center mb-8">
                <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No containers yet</h3>
                <p className="text-muted-foreground mb-4">Create your first database container to get started</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />Create Container
                </Button>
              </Card>
            )}

            {/* Database Types */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Supported Databases</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(DATABASE_CONFIGS).map(([key, config]) => (
                  <Card key={key} className="p-4 hover:border-primary transition-colors cursor-pointer" onClick={() => { handleDbTypeChange(key as DatabaseType); setShowCreateDialog(true); }}>
                    <div className="text-3xl mb-2">{config.icon}</div>
                    <h3 className="font-semibold">{config.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {config.versions.slice(0, 3).map((version) => (
                        <Badge key={version} variant="secondary" className="text-xs">v{version}</Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </FeatureGate>

      {/* Create Container Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Database Container</DialogTitle>
            <DialogDescription>Configure and launch a new database container</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="db_type">Database Type</Label>
              <Select value={createForm.db_type} onValueChange={(value) => handleDbTypeChange(value as DatabaseType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DATABASE_CONFIGS).map(([key, config]) => (
                    <SelectItem key={key} value={key}><span className="mr-2">{config.icon}</span>{config.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Container Name</Label>
              <Input id="name" placeholder="my-database" value={createForm.name} onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Select value={createForm.version} onValueChange={(value) => setCreateForm(prev => ({ ...prev, version: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATABASE_CONFIGS[createForm.db_type]?.versions.map((version) => (
                    <SelectItem key={version} value={version}>{version}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Host Port</Label>
              <Input id="port" type="number" value={createForm.port} onChange={(e) => setCreateForm(prev => ({ ...prev, port: parseInt(e.target.value) || 0 }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={createForm.password} onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Enter password" />
                  <Button variant="ghost" size="sm" type="button" className="absolute right-1 top-1 h-7 w-7 p-0" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button variant="outline" type="button" onClick={generatePassword}>Generate</Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_restart">Auto-restart</Label>
                <p className="text-sm text-muted-foreground">Restart container automatically on failure</p>
              </div>
              <Switch id="auto_restart" checked={createForm.auto_restart} onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, auto_restart: checked }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateContainer} disabled={isCreating}>
              {isCreating ? (<><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Creating...</>) : (<><Plus className="w-4 h-4 mr-2" />Create Container</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Container Logs: {selectedContainer?.name}</DialogTitle>
            <DialogDescription>Last 500 lines of container output</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] w-full rounded-md border bg-black p-4">
            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{containerLogs || 'Loading logs...'}</pre>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={async () => { if (selectedContainer) { const logs = await dockerService.getContainerLogs(selectedContainer.id, 500); setContainerLogs(logs.join('\n')); } }}>
              <RefreshCw className="w-4 h-4 mr-2" />Refresh
            </Button>
            <Button onClick={() => setShowLogsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('database.dialogs.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('database.dialogs.deleteDescription', 'Are you sure you want to delete this container?', { name: selectedContainer?.name ?? '' })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteContainer}><Trash2 className="w-4 h-4 mr-2" />{t('database.actions.deleteContainer')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
      )}
    </AppLayout>
  );
}
