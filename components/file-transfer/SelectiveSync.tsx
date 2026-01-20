"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('SelectiveSync');

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Folder,
  FolderOpen,
  FolderCheck,
  Cloud,
  HardDrive,
  Settings,
  Plus,
  Search,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Trash2,
  RefreshCw,
  Zap,
  Loader2,
} from 'lucide-react';
import {
  SelectiveSyncConfig,
  SmartFolder,
  FolderSyncState,
} from '@/types/file-transfer-elite';
import './SelectiveSync.css';

// ============================================================================
// BACKEND TYPES (matching Rust structs)
// ============================================================================

interface BackendSyncFolder {
  id: string;
  path: string;
  name: string;
  sizeBytes: number;
  fileCount: number;
  isSynced: boolean;
  syncStatus: string;
  lastSync: number | null; // Unix timestamp seconds
}

interface BackendSelectiveSyncConfig {
  folders: BackendSyncFolder[];
  totalLocalSizeGb: number;
  totalCloudSizeGb: number;
  syncAllByDefault: boolean;
}

// ============================================================================
// TYPES
// ============================================================================

interface FolderNode {
  id: string;
  name: string;
  path: string;
  size: number;
  syncState: FolderSyncState;
  children?: FolderNode[];
  fileCount: number;
  expanded?: boolean;
}

// ============================================================================
// CONVERTERS (Backend → Frontend)
// ============================================================================

const mapSyncStatus = (status: string, isSynced: boolean): FolderSyncState => {
  if (!isSynced) return 'online-only';
  switch (status.toLowerCase()) {
    case 'synced': return 'synced';
    case 'syncing': return 'syncing';
    case 'cloud_only': return 'online-only';
    case 'local_only': return 'local-only';
    case 'excluded': return 'excluded';
    default: return isSynced ? 'synced' : 'online-only';
  }
};

const convertBackendFolder = (backend: BackendSyncFolder): FolderNode => ({
  id: backend.id,
  name: backend.name,
  path: backend.path,
  size: backend.sizeBytes,
  syncState: mapSyncStatus(backend.syncStatus, backend.isSynced),
  fileCount: backend.fileCount,
  expanded: false,
});

// ============================================================================
// STATIC DATA - Smart Folders (advanced feature - no backend yet)
// ============================================================================

const staticSmartFolders: SmartFolder[] = [
  {
    id: 'smart-1',
    name: 'Recent Files',
    rules: [{ field: 'modifiedDate', operator: 'greaterThan', value: 'last7days' }],
    action: 'keep-local',
    priority: 1,
    enabled: true,
  },
  {
    id: 'smart-2',
    name: 'Large Videos',
    rules: [
      { field: 'extension', operator: 'equals', value: 'mp4,mov,avi' },
      { field: 'size', operator: 'greaterThan', value: '500MB' },
    ],
    action: 'online-only',
    priority: 2,
    enabled: true,
  },
  {
    id: 'smart-3',
    name: 'Old Archives',
    rules: [
      { field: 'extension', operator: 'equals', value: 'zip,rar,7z' },
      { field: 'modifiedDate', operator: 'lessThan', value: 'last90days' },
    ],
    action: 'online-only',
    priority: 3,
    enabled: false,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getSyncStateIcon = (state: FolderSyncState) => {
  switch (state) {
    case 'synced':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'syncing':
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'online-only':
      return <Cloud className="h-4 w-4 text-purple-500" />;
    case 'local-only':
      return <HardDrive className="h-4 w-4 text-orange-500" />;
    case 'excluded':
      return <X className="h-4 w-4 text-gray-400" />;
    default:
      return <Cloud className="h-4 w-4" />;
  }
};

const getSyncStateLabel = (state: FolderSyncState): string => {
  switch (state) {
    case 'synced':
      return 'Synced';
    case 'syncing':
      return 'Syncing...';
    case 'online-only':
      return 'Online Only';
    case 'local-only':
      return 'Local Only';
    case 'excluded':
      return 'Excluded';
    default:
      return 'Unknown';
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FolderTreeItemProps {
  folder: FolderNode;
  level: number;
  onToggleExpand: (id: string) => void;
  onToggleSync: (folder: FolderNode) => void;
}

function FolderTreeItem({ folder, level, onToggleExpand, onToggleSync }: FolderTreeItemProps) {
  const hasChildren = folder.children && folder.children.length > 0;
  const isExpanded = folder.expanded;

  return (
    <div className="folder-tree-item">
      <div
        className="folder-row"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button
            className="expand-btn"
            onClick={() => onToggleExpand(folder.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="expand-spacer" />
        )}

        <Checkbox
          checked={folder.syncState !== 'excluded' && folder.syncState !== 'online-only'}
          onCheckedChange={() => onToggleSync(folder)}
          className="folder-checkbox"
        />

        <div className="folder-icon">
          {isExpanded ? (
            <FolderOpen className="h-5 w-5 text-blue-500" />
          ) : (
            <Folder className="h-5 w-5 text-blue-500" />
          )}
        </div>

        <div className="folder-info">
          <span className="folder-name">{folder.name}</span>
          <span className="folder-meta">
            {formatBytes(folder.size)} • {folder.fileCount.toLocaleString()} files
          </span>
        </div>

        <div className="folder-sync-state">
          {getSyncStateIcon(folder.syncState)}
          <span className="text-xs">{getSyncStateLabel(folder.syncState)}</span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="folder-children">
          {folder.children!.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              onToggleExpand={onToggleExpand}
              onToggleSync={onToggleSync}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SmartFolderCardProps {
  folder: SmartFolder;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function SmartFolderCard({ folder, onToggle, onDelete }: SmartFolderCardProps) {
  return (
    <div className={`smart-folder-card ${!folder.enabled ? 'disabled' : ''}`}>
      <div className="smart-folder-icon">
        <Zap className="h-5 w-5" />
      </div>
      <div className="smart-folder-info">
        <div className="flex items-center gap-2">
          <span className="font-medium">{folder.name}</span>
          <Badge variant="secondary" className="text-xs">
            {folder.rules.length} rule{folder.rules.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Action: {folder.action === 'keep-local' ? 'Keep Local' : 
                   folder.action === 'online-only' ? 'Online Only' : 
                   folder.action === 'exclude' ? 'Exclude' : 'Default'}
        </p>
      </div>
      <div className="smart-folder-actions">
        <Switch
          checked={folder.enabled}
          onCheckedChange={() => onToggle(folder.id)}
        />
        <Button size="sm" variant="ghost" onClick={() => onDelete(folder.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface SelectiveSyncProps {
  onClose?: () => void;
}

export function SelectiveSync({ onClose: _onClose }: SelectiveSyncProps) {
  const [config, setConfig] = useState<SelectiveSyncConfig>({
    enabled: true,
    mode: 'smart',
    selectedFolders: [],
    smartFolders: staticSmartFolders,
    virtualDrive: { enabled: false, driveLetter: 'Z', showPlaceholders: true },
    placeholderEnabled: true,
    autoDownloadRecent: true,
    recentDays: 7,
    freeSpaceThreshold: 10,
    offlineAccess: { enabled: true, maxSize: 10 * 1024 * 1024 * 1024, priorityFolders: [] },
    excludePatterns: ['*.tmp', '*.temp', '.DS_Store', 'Thumbs.db'],
  });
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [smartFolders, setSmartFolders] = useState<SmartFolder[]>(staticSmartFolders);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('folders');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Load data from backend on mount
  useEffect(() => {
    const loadSelectiveSyncConfig = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendSelectiveSyncConfig>('get_selective_sync_config');
        setFolders(backendConfig.folders.map(convertBackendFolder));
      } catch (error) {
        log.error('Failed to load selective sync config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load selective sync configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadSelectiveSyncConfig();
  }, [toast]);

  // Calculate storage stats
  const storageStats = useMemo(() => {
    const calculateSize = (nodes: FolderNode[], state: FolderSyncState): number => {
      return nodes.reduce((acc, node) => {
        let size = node.syncState === state ? node.size : 0;
        if (node.children) {
          size += calculateSize(node.children, state);
        }
        return acc + size;
      }, 0);
    };

    const totalSize = folders.reduce((acc, f) => {
      return acc + f.size;
    }, 0);

    const syncedSize = calculateSize(folders, 'synced');
    const onlineOnlySize = calculateSize(folders, 'online-only');

    return { totalSize, syncedSize, onlineOnlySize };
  }, [folders]);

  const handleToggleExpand = useCallback((id: string) => {
    const toggleExpanded = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.map((node) => {
        if (node.id === id) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: toggleExpanded(node.children) };
        }
        return node;
      });
    };
    setFolders(toggleExpanded(folders));
  }, [folders]);

  const handleToggleSync = useCallback(async (folder: FolderNode) => {
    const newSynced = folder.syncState !== 'synced';
    const newState: FolderSyncState = newSynced ? 'synced' : 'online-only';
    
    try {
      await invoke('toggle_folder_sync', { folderId: folder.id, synced: newSynced });
      
      const updateState = (nodes: FolderNode[]): FolderNode[] => {
        return nodes.map((node) => {
          if (node.id === folder.id) {
            return { ...node, syncState: newState };
          }
          if (node.children) {
            return { ...node, children: updateState(node.children) };
          }
          return node;
        });
      };
      
      setFolders(updateState(folders));
      toast({
        title: 'Sync Updated',
        description: `${folder.name} is now ${getSyncStateLabel(newState)}`,
      });
    } catch (error) {
      log.error('Failed to toggle folder sync:', error);
      toast({
        title: 'Error',
        description: 'Failed to update folder sync status',
        variant: 'destructive',
      });
    }
  }, [folders, toast]);

  const handleToggleSmartFolder = useCallback((id: string) => {
    setSmartFolders(prev => prev.map(f =>
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
  }, []);

  const handleDeleteSmartFolder = useCallback((id: string) => {
    setSmartFolders(prev => prev.filter(f => f.id !== id));
    toast({
      title: 'Smart Folder Deleted',
      description: 'The smart folder rule has been removed',
    });
  }, [toast]);

  if (loading) {
    return (
      <div className="selective-sync flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Selective Sync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="selective-sync">
      {/* Header */}
      <div className="sync-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <FolderCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Selective Sync</h2>
            <p className="text-sm text-muted-foreground">
              Choose which folders to sync locally
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="sync-enabled" className="text-sm">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </Label>
          <Switch
            id="sync-enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
          />
        </div>
      </div>

      {/* Storage Overview */}
      <div className="storage-overview">
        <div className="storage-bar-container">
          <div className="storage-bar">
            <div 
              className="storage-bar-synced"
              style={{ width: `${(storageStats.syncedSize / storageStats.totalSize) * 100}%` }}
            />
            <div 
              className="storage-bar-online"
              style={{ width: `${(storageStats.onlineOnlySize / storageStats.totalSize) * 100}%` }}
            />
          </div>
          <div className="storage-legend">
            <div className="legend-item">
              <span className="legend-color synced" />
              <span>Synced: {formatBytes(storageStats.syncedSize)}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color online" />
              <span>Online Only: {formatBytes(storageStats.onlineOnlySize)}</span>
            </div>
            <div className="legend-item total">
              <span>Total: {formatBytes(storageStats.totalSize)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="folders">
            <Folder className="h-4 w-4 mr-2" />
            Folders
          </TabsTrigger>
          <TabsTrigger value="smart">
            <Zap className="h-4 w-4 mr-2" />
            Smart Folders
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="folders">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Folder Selection</CardTitle>
                  <CardDescription>
                    Select folders to keep synced on this device
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search folders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="folder-tree">
                  {folders.map((folder) => (
                    <FolderTreeItem
                      key={folder.id}
                      folder={folder}
                      level={0}
                      onToggleExpand={handleToggleExpand}
                      onToggleSync={handleToggleSync}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smart">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Smart Folder Rules</CardTitle>
                  <CardDescription>
                    Automatically manage sync based on rules
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {smartFolders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No smart folder rules</p>
                    </div>
                  ) : (
                    smartFolders.map((folder) => (
                      <SmartFolderCard
                        key={folder.id}
                        folder={folder}
                        onToggle={handleToggleSmartFolder}
                        onDelete={handleDeleteSmartFolder}
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
              <CardTitle className="text-lg">Sync Settings</CardTitle>
              <CardDescription>
                Configure selective sync behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Virtual Drive</Label>
                  <p className="text-sm text-muted-foreground">
                    Mount cloud files as a virtual drive
                  </p>
                </div>
                <Switch
                  checked={config.virtualDrive.enabled}
                  onCheckedChange={(enabled) => setConfig(prev => ({
                    ...prev,
                    virtualDrive: { ...prev.virtualDrive, enabled }
                  }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Show Placeholder Files</Label>
                  <p className="text-sm text-muted-foreground">
                    Show online-only files in file explorer
                  </p>
                </div>
                <Switch
                  checked={config.virtualDrive.showPlaceholders}
                  onCheckedChange={(showPlaceholders) => setConfig(prev => ({
                    ...prev,
                    virtualDrive: { ...prev.virtualDrive, showPlaceholders }
                  }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Offline Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep recent files available offline
                  </p>
                </div>
                <Switch
                  checked={typeof config.offlineAccess === 'object' ? config.offlineAccess.enabled : !!config.offlineAccess}
                  onCheckedChange={(enabled) => setConfig(prev => ({
                    ...prev,
                    offlineAccess: typeof prev.offlineAccess === 'object' 
                      ? { ...prev.offlineAccess, enabled }
                      : { enabled, maxSize: 10 * 1024 * 1024 * 1024, priorityFolders: [] }
                  }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Max Offline Cache Size</Label>
                  <p className="text-sm text-muted-foreground">
                    Maximum space for offline files
                  </p>
                </div>
                <Input
                  type="number"
                  value={typeof config.offlineAccess === 'object' ? config.offlineAccess.maxSize / (1024 * 1024 * 1024) : 10}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    offlineAccess: typeof prev.offlineAccess === 'object'
                      ? { ...prev.offlineAccess, maxSize: parseFloat(e.target.value) * 1024 * 1024 * 1024 }
                      : { enabled: true, maxSize: parseFloat(e.target.value) * 1024 * 1024 * 1024, priorityFolders: [] }
                  }))}
                  className="w-24"
                  min={1}
                  max={100}
                />
                <span className="text-sm text-muted-foreground">GB</span>
              </div>

              <div>
                <Label>Exclude Patterns</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  File patterns to always exclude from sync
                </p>
                <div className="exclude-patterns">
                  {(config.excludePatterns ?? []).map((pattern, index) => (
                    <Badge key={index} variant="secondary" className="mr-2 mb-2">
                      {pattern}
                      <button
                        className="ml-1"
                        onClick={() => {
                          const newPatterns = [...(config.excludePatterns ?? [])];
                          newPatterns.splice(index, 1);
                          setConfig(prev => ({ ...prev, excludePatterns: newPatterns }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SelectiveSync;
