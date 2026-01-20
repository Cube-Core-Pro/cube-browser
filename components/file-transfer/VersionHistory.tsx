"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('VersionHistory');

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  History,
  RotateCcw,
  Settings,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Download,
  GitCompare,
  Calendar,
  HardDrive,
  ChevronRight,
  Search,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import {
  VersionHistoryConfig,
  VersionHistoryEntry,
} from '@/types/file-transfer-elite';
import './VersionHistory.css';

// ============================================================================
// BACKEND TYPES (matching Rust structs)
// ============================================================================

interface BackendFileVersion {
  id: string;
  fileId: string;
  fileName: string;
  versionNumber: number;
  sizeBytes: number;
  modifiedAt: number; // Unix timestamp seconds
  modifiedBy: string;
  hash: string;
  isCurrent: boolean;
}

interface BackendVersionHistoryConfig {
  versions: BackendFileVersion[];
  retentionDays: number;
  maxVersionsPerFile: number;
}

// ============================================================================
// TYPES
// ============================================================================

interface FileVersion {
  id: string;
  fileName: string;
  filePath: string;
  fileType: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'other';
  versions: VersionHistoryEntry[];
  currentVersion: string;
  totalSize: number;
}

// ============================================================================
// CONVERTERS (Backend → Frontend)
// ============================================================================

const getFileType = (fileName: string): 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'other' => {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['doc', 'docx', 'pdf', 'txt', 'rtf', 'odt'].includes(ext)) return 'document';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'psd'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return 'audio';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'rs', 'java', 'cpp', 'c', 'go'].includes(ext)) return 'code';
  return 'other';
};

const convertBackendVersion = (backend: BackendFileVersion): VersionHistoryEntry => ({
  id: backend.id,
  fileId: backend.fileId,
  versionNumber: backend.versionNumber,
  size: backend.sizeBytes,
  hash: backend.hash,
  createdAt: new Date(backend.modifiedAt * 1000),
  modifiedBy: backend.modifiedBy,
  changeDescription: backend.isCurrent ? 'Current version' : `Version ${backend.versionNumber}`,
  isAutoSave: false,
});

const groupVersionsByFile = (versions: BackendFileVersion[]): FileVersion[] => {
  const fileMap = new Map<string, BackendFileVersion[]>();
  
  versions.forEach(v => {
    const existing = fileMap.get(v.fileId) ?? [];
    existing.push(v);
    fileMap.set(v.fileId, existing);
  });
  
  return Array.from(fileMap.entries()).map(([fileId, fileVersions]) => {
    const sorted = fileVersions.sort((a, b) => b.versionNumber - a.versionNumber);
    const current = sorted.find(v => v.isCurrent) ?? sorted[0];
    const totalSize = sorted.reduce((sum, v) => sum + v.sizeBytes, 0);
    
    return {
      id: fileId,
      fileName: current.fileName,
      filePath: `/Files/${current.fileName}`,
      fileType: getFileType(current.fileName),
      versions: sorted.map(convertBackendVersion),
      currentVersion: `v${current.versionNumber}`,
      totalSize,
    };
  });
};

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

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

const getFileTypeIcon = (type: string) => {
  switch (type) {
    case 'document':
      return FileText;
    case 'image':
      return Image;
    case 'video':
      return Video;
    case 'audio':
      return Music;
    case 'archive':
      return Archive;
    case 'code':
      return Code;
    default:
      return FileText;
  }
};

const getFileTypeColor = (type: string): string => {
  switch (type) {
    case 'document':
      return '#3b82f6';
    case 'image':
      return '#ec4899';
    case 'video':
      return '#8b5cf6';
    case 'audio':
      return '#f59e0b';
    case 'archive':
      return '#6b7280';
    case 'code':
      return '#22c55e';
    default:
      return '#6b7280';
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FileVersionCardProps {
  file: FileVersion;
  onSelect: (file: FileVersion) => void;
}

function FileVersionCard({ file, onSelect }: FileVersionCardProps) {
  const FileIcon = getFileTypeIcon(file.fileType);
  const latestVersion = file.versions[0];
  
  return (
    <div className="file-version-card" onClick={() => onSelect(file)}>
      <div 
        className="file-icon"
        style={{ backgroundColor: `${getFileTypeColor(file.fileType)}15`, color: getFileTypeColor(file.fileType) }}
      >
        <FileIcon className="h-5 w-5" />
      </div>
      
      <div className="file-info">
        <div className="flex items-center gap-2">
          <span className="font-medium">{file.fileName}</span>
          <Badge variant="secondary" className="text-xs">
            {file.versions.length} versions
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{file.filePath}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>Current: {file.currentVersion}</span>
          <span>Total: {formatBytes(file.totalSize)}</span>
          {latestVersion?.createdAt && <span>{formatTimeAgo(latestVersion.createdAt)}</span>}
        </div>
      </div>
      
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

interface VersionEntryProps {
  entry: VersionHistoryEntry;
  isCurrent: boolean;
  onRestore: (entry: VersionHistoryEntry) => void;
  onDownload: (entry: VersionHistoryEntry) => void;
  onCompare: (entry: VersionHistoryEntry) => void;
}

function VersionEntry({ entry, isCurrent, onRestore, onDownload, onCompare }: VersionEntryProps) {
  return (
    <div className={`version-entry ${isCurrent ? 'current' : ''}`}>
      <div className="version-timeline">
        <div className={`timeline-dot ${isCurrent ? 'current' : ''}`} />
        <div className="timeline-line" />
      </div>
      
      <div className="version-content">
        <div className="flex items-center gap-2">
          <span className="font-medium">Version {entry.versionNumber}</span>
          {isCurrent && (
            <Badge className="bg-green-100 text-green-700 text-xs">Current</Badge>
          )}
          {entry.isAutoSave && (
            <Badge variant="secondary" className="text-xs">Auto-saved</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{entry.changeDescription}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {entry.createdAt && <span>{formatDate(entry.createdAt)}</span>}
          <span>{entry.modifiedBy}</span>
          <span>{formatBytes(entry.size ?? 0)}</span>
        </div>
      </div>
      
      <div className="version-actions">
        {!isCurrent && (
          <Button size="sm" variant="outline" onClick={() => onRestore(entry)}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Restore
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onDownload(entry)}>
          <Download className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onCompare(entry)}>
          <GitCompare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface VersionHistoryProps {
  onClose?: () => void;
}

export function VersionHistory({ onClose: _onClose }: VersionHistoryProps) {
  const [config, setConfig] = useState<VersionHistoryConfig>({
    enabled: true,
    maxVersions: 50,
    retentionDays: 90,
    autoCleanup: true,
    includePatterns: ['*'],
    excludePatterns: ['*.tmp', '*.temp', 'node_modules/**'],
    compressionEnabled: true,
  });
  const [files, setFiles] = useState<FileVersion[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const { toast } = useToast();

  // Load data from backend on mount
  useEffect(() => {
    const loadVersionHistory = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendVersionHistoryConfig>('get_version_history');
        const groupedFiles = groupVersionsByFile(backendConfig.versions);
        setFiles(groupedFiles);
        setConfig(prev => ({
          ...prev,
          maxVersions: backendConfig.maxVersionsPerFile,
          retentionDays: backendConfig.retentionDays,
        }));
      } catch (error) {
        log.error('Failed to load version history:', error);
        toast({
          title: 'Error',
          description: 'Failed to load version history',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadVersionHistory();
  }, [toast]);

  // Stats
  const totalVersions = files.reduce((acc, f) => acc + f.versions.length, 0);
  const totalSize = files.reduce((acc, f) => acc + f.totalSize, 0);

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           f.filePath.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || f.fileType === filterType;
      return matchesSearch && matchesType;
    });
  }, [files, searchQuery, filterType]);

  const handleSelectFile = useCallback((file: FileVersion) => {
    setSelectedFile(file);
  }, []);

  const handleRestore = useCallback(async (entry: VersionHistoryEntry) => {
    try {
      await invoke('restore_version', { versionId: entry.id });
      toast({
        title: 'Version Restored',
        description: `Restored to version ${entry.versionNumber}`,
      });
      // Refresh the data
      const backendConfig = await invoke<BackendVersionHistoryConfig>('get_version_history');
      const groupedFiles = groupVersionsByFile(backendConfig.versions);
      setFiles(groupedFiles);
      if (selectedFile) {
        const updatedFile = groupedFiles.find(f => f.id === selectedFile.id);
        setSelectedFile(updatedFile ?? null);
      }
    } catch (error) {
      log.error('Failed to restore version:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore version',
        variant: 'destructive',
      });
    }
  }, [selectedFile, toast]);

  const handleDownload = useCallback((entry: VersionHistoryEntry) => {
    toast({
      title: 'Downloading',
      description: `Downloading version ${entry.versionNumber}`,
    });
  }, [toast]);

  const handleCompare = useCallback((entry: VersionHistoryEntry) => {
    toast({
      title: 'Compare',
      description: `Comparing version ${entry.versionNumber} with current`,
    });
  }, [toast]);

  if (loading) {
    return (
      <div className="version-history flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Version History...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="version-history">
      {/* Header */}
      <div className="history-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Version History</h2>
            <p className="text-sm text-muted-foreground">
              Track and restore file versions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="vh-enabled" className="text-sm">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </Label>
          <Switch
            id="vh-enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{files.length}</span>
            <span className="stat-label">Files</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <History className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{totalVersions}</span>
            <span className="stat-label">Versions</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{formatBytes(totalSize)}</span>
            <span className="stat-label">Storage</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{config.retentionDays}d</span>
            <span className="stat-label">Retention</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {selectedFile ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <div>
                  <CardTitle className="text-lg">{selectedFile.fileName}</CardTitle>
                  <CardDescription>{selectedFile.filePath}</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">
                {selectedFile.versions.length} versions
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px]">
              <div className="version-list">
                {selectedFile.versions.map((entry, index) => (
                  <VersionEntry
                    key={entry.id}
                    entry={entry}
                    isCurrent={index === 0}
                    onRestore={handleRestore}
                    onDownload={handleDownload}
                    onCompare={handleCompare}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="files">
              <FileText className="h-4 w-4 mr-2" />
              Files ({files.length})
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Version History</CardTitle>
                    <CardDescription>
                      Files with version history enabled
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                        <SelectItem value="image">Images</SelectItem>
                        <SelectItem value="video">Videos</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="archive">Archives</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredFiles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No files with version history</p>
                      </div>
                    ) : (
                      filteredFiles.map(file => (
                        <FileVersionCard
                          key={file.id}
                          file={file}
                          onSelect={handleSelectFile}
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
                <CardTitle className="text-lg">Version History Settings</CardTitle>
                <CardDescription>
                  Configure version retention and cleanup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="setting-row">
                  <div>
                    <Label>Max Versions Per File</Label>
                    <p className="text-sm text-muted-foreground">
                      Maximum versions to keep per file
                    </p>
                  </div>
                  <Input
                    type="number"
                    value={config.maxVersions}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      maxVersions: parseInt(e.target.value) || 50 
                    }))}
                    className="w-24"
                    min={1}
                    max={1000}
                  />
                </div>

                <div className="setting-row">
                  <div>
                    <Label>Retention Period (days)</Label>
                    <p className="text-sm text-muted-foreground">
                      Days to keep old versions
                    </p>
                  </div>
                  <Input
                    type="number"
                    value={config.retentionDays}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      retentionDays: parseInt(e.target.value) || 90 
                    }))}
                    className="w-24"
                    min={1}
                    max={365}
                  />
                </div>

                <div className="setting-row">
                  <div>
                    <Label>Auto Cleanup</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically remove old versions
                    </p>
                  </div>
                  <Switch
                    checked={config.autoCleanup}
                    onCheckedChange={(autoCleanup) => 
                      setConfig(prev => ({ ...prev, autoCleanup }))}
                  />
                </div>

                <div className="setting-row">
                  <div>
                    <Label>Compression</Label>
                    <p className="text-sm text-muted-foreground">
                      Compress stored versions to save space
                    </p>
                  </div>
                  <Switch
                    checked={config.compressionEnabled}
                    onCheckedChange={(compressionEnabled) => 
                      setConfig(prev => ({ ...prev, compressionEnabled }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default VersionHistory;
