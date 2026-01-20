'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FolderOpen, File, Upload, Download, Trash2, Edit, Copy, Move as _Move,
  Search, Grid, List, ChevronRight, Home,
  Image, FileText, Film, Music, Archive, Code, Database, Settings as _Settings,
  MoreVertical, RefreshCw, Eye, Share2, Lock,
  HardDrive, Star, AlertCircle, CheckCircle,
  FolderPlus, Clipboard, Scissors, Globe, XCircle
} from 'lucide-react';
import {
  FileManagerService,
  FileItem as _BackendFileItem,
  StorageStats as _StorageStats
} from '@/lib/services/admin-service';
import { logger } from '@/lib/services/logger-service';
import './FileManager.css';

const log = logger.scope('FileManager');

// ===== Types =====
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  mimeType?: string;
  extension?: string;
  createdAt: Date;
  modifiedAt: Date;
  owner: string;
  permissions: 'private' | 'public' | 'team';
  starred?: boolean;
  thumbnail?: string;
  downloads?: number;
  shared?: SharedWith[];
}

interface SharedWith {
  userId: string;
  name: string;
  email: string;
  permission: 'view' | 'edit' | 'admin';
}

interface Breadcrumb {
  id: string;
  name: string;
  path: string;
}

interface StorageQuota {
  used: number;
  total: number;
  byType: {
    images: number;
    documents: number;
    videos: number;
    audio: number;
    archives: number;
    other: number;
  };
}

interface UploadProgress {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

// ===== Component =====
export const FileManager: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem | null } | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [clipboard, setClipboard] = useState<{ files: FileItem[]; action: 'copy' | 'cut' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files
  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load data from backend
      const [backendFiles, backendStats] = await Promise.all([
        FileManagerService.list(currentPath === '/' ? undefined : currentPath),
        FileManagerService.getStats()
      ]);

      // Convert backend files to frontend format
      const convertedFiles: FileItem[] = backendFiles.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        path: f.path,
        size: f.size || undefined,
        mimeType: f.mime_type || undefined,
        extension: f.extension || undefined,
        createdAt: new Date(f.created_at),
        modifiedAt: new Date(f.modified_at),
        owner: f.owner,
        permissions: f.permissions,
        starred: f.starred,
        thumbnail: f.thumbnail_url || undefined,
        downloads: f.downloads
      }));

      // Convert backend stats to storage quota
      const convertedQuota: StorageQuota = {
        used: backendStats.used_space,
        total: backendStats.total_space,
        byType: {
          images: backendStats.usage_by_type['image'] || 0,
          documents: backendStats.usage_by_type['document'] || 0,
          videos: backendStats.usage_by_type['video'] || 0,
          audio: backendStats.usage_by_type['audio'] || 0,
          archives: backendStats.usage_by_type['archive'] || 0,
          other: backendStats.usage_by_type['other'] || 0
        }
      };

      setFiles(convertedFiles);
      setStorageQuota(convertedQuota);
      
      // Update breadcrumbs based on current path
      const pathParts = currentPath.split('/').filter(Boolean);
      const newBreadcrumbs: Breadcrumb[] = [{ id: 'root', name: 'Files', path: '/' }];
      let accPath = '';
      for (const part of pathParts) {
        accPath += '/' + part;
        newBreadcrumbs.push({
          id: `path_${accPath}`,
          name: part,
          path: accPath
        });
      }
      setBreadcrumbs(newBreadcrumbs);
    } catch (err) {
      log.error('Failed to load files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Close context menu on click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (file: FileItem): React.ReactNode => {
    if (file.type === 'folder') {
      return <FolderOpen className="w-10 h-10 text-yellow-500" />;
    }

    const ext = file.extension?.toLowerCase();
    switch (ext) {
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return <Image className="w-10 h-10 text-purple-500" />;
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className="w-10 h-10 text-blue-500" />;
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'mkv':
        return <Film className="w-10 h-10 text-red-500" />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music className="w-10 h-10 text-pink-500" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <Archive className="w-10 h-10 text-orange-500" />;
      case 'js':
      case 'ts':
      case 'py':
      case 'html':
      case 'css':
      case 'json':
      case 'md':
        return <Code className="w-10 h-10 text-green-500" />;
      case 'sql':
      case 'db':
        return <Database className="w-10 h-10 text-cyan-500" />;
      default:
        return <File className="w-10 h-10 text-gray-500" />;
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    const newUploads: UploadProgress[] = Array.from(uploadedFiles).map(file => ({
      id: `upload_${Date.now()}_${file.name}`,
      name: file.name,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Simulate upload progress
    for (const upload of newUploads) {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploads(prev => prev.map(u =>
          u.id === upload.id ? { ...u, progress: i } : u
        ));
      }
      setUploads(prev => prev.map(u =>
        u.id === upload.id ? { ...u, status: 'completed' } : u
      ));
    }

    // Clear completed uploads after delay
    setTimeout(() => {
      setUploads(prev => prev.filter(u => u.status !== 'completed'));
      loadFiles();
    }, 2000);
  };

  // Handle folder navigation
  const navigateToFolder = (folder: FileItem) => {
    if (folder.type !== 'folder') return;
    setCurrentPath(folder.path);
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name, path: folder.path }]);
    setSelectedFiles(new Set());
  };

  // Handle breadcrumb navigation
  const navigateToBreadcrumb = (crumb: Breadcrumb, index: number) => {
    setCurrentPath(crumb.path);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setSelectedFiles(new Set());
  };

  // Handle file selection
  const toggleSelection = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedFiles);
    if (e.ctrlKey || e.metaKey) {
      if (newSelection.has(file.id)) {
        newSelection.delete(file.id);
      } else {
        newSelection.add(file.id);
      }
    } else {
      newSelection.clear();
      newSelection.add(file.id);
    }
    setSelectedFiles(newSelection);
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  // Create new folder
  const createNewFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await FileManagerService.createFolder(newFolderName, currentPath);
      setNewFolderName('');
      setShowNewFolderModal(false);
      await loadFiles();
    } catch (err) {
      log.error('Failed to create folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  // Copy/Cut files
  const handleCopy = () => {
    const selectedItems = files.filter(f => selectedFiles.has(f.id));
    setClipboard({ files: selectedItems, action: 'copy' });
    setContextMenu(null);
  };

  const handleCut = () => {
    const selectedItems = files.filter(f => selectedFiles.has(f.id));
    setClipboard({ files: selectedItems, action: 'cut' });
    setContextMenu(null);
  };

  // Delete files
  const handleDelete = async () => {
    try {
      for (const fileId of selectedFiles) {
        await FileManagerService.delete(fileId);
      }
      setSelectedFiles(new Set());
      setContextMenu(null);
      await loadFiles();
    } catch (err) {
      log.error('Failed to delete files:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete files');
    }
  };

  // Toggle star
  const toggleStar = async (file: FileItem) => {
    try {
      await FileManagerService.toggleStar(file.id);
      await loadFiles();
    } catch (err) {
      log.error('Failed to toggle star:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle star');
    }
  };

  // Rename file
  const _handleRename = async (_fileId: string, _newName: string) => {
    try {
      await FileManagerService.rename(_fileId, _newName);
      await loadFiles();
    } catch (err) {
      log.error('Failed to rename file:', err);
      setError(err instanceof Error ? err.message : 'Failed to rename file');
    }
  };

  // Move file
  const _handleMove = async (_fileId: string, _newPath: string) => {
    try {
      await FileManagerService.move(_fileId, _newPath);
      await loadFiles();
    } catch (err) {
      log.error('Failed to move file:', err);
      setError(err instanceof Error ? err.message : 'Failed to move file');
    }
  };

  // Sort and filter files
  const filteredFiles = files
    .filter(f => {
      if (filterType !== 'all') {
        if (filterType === 'folders' && f.type !== 'folder') return false;
        if (filterType === 'images' && !['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(f.extension || '')) return false;
        if (filterType === 'documents' && !['pdf', 'doc', 'docx', 'txt', 'md'].includes(f.extension || '')) return false;
        if (filterType === 'videos' && !['mp4', 'mov', 'avi', 'mkv'].includes(f.extension || '')) return false;
        if (filterType === 'archives' && !['zip', 'rar', '7z', 'tar', 'gz'].includes(f.extension || '')) return false;
      }
      if (searchQuery) {
        return f.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      // Folders first
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = b.modifiedAt.getTime() - a.modifiedAt.getTime();
          break;
        case 'size':
          comparison = (b.size || 0) - (a.size || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="file-manager-loading">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span>Loading files...</span>
      </div>
    );
  }

  return (
    <div className="file-manager">
      {/* Header */}
      <div className="file-manager-header">
        <div className="header-title">
          <HardDrive className="w-6 h-6" />
          <h2>File Manager</h2>
        </div>
        <div className="header-actions">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <button className="btn-secondary" onClick={() => setShowNewFolderModal(true)}>
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
          <button className="btn-refresh" onClick={loadFiles}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px'
        }}>
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>Error:</strong> {error}
            <button 
              onClick={() => setError(null)} 
              style={{ marginLeft: '12px', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: 'white' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Storage Quota */}
      {storageQuota && (
        <div className="storage-quota">
          <div className="quota-info">
            <span className="quota-used">{formatSize(storageQuota.used)}</span>
            <span className="quota-divider">/</span>
            <span className="quota-total">{formatSize(storageQuota.total)}</span>
          </div>
          <div className="quota-bar">
            <div 
              className="quota-fill"
              style={{ width: `${(storageQuota.used / storageQuota.total) * 100}%` }}
            />
          </div>
          <div className="quota-breakdown">
            <span className="quota-item images">
              <Image className="w-3 h-3" />
              {formatSize(storageQuota.byType.images)}
            </span>
            <span className="quota-item documents">
              <FileText className="w-3 h-3" />
              {formatSize(storageQuota.byType.documents)}
            </span>
            <span className="quota-item videos">
              <Film className="w-3 h-3" />
              {formatSize(storageQuota.byType.videos)}
            </span>
            <span className="quota-item archives">
              <Archive className="w-3 h-3" />
              {formatSize(storageQuota.byType.archives)}
            </span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="file-toolbar">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <button className="home-btn" onClick={() => navigateToBreadcrumb(breadcrumbs[0], 0)}>
            <Home className="w-4 h-4" />
          </button>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <button 
                className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                onClick={() => navigateToBreadcrumb(crumb, index)}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Actions */}
        <div className="toolbar-actions">
          {selectedFiles.size > 0 && (
            <div className="selection-actions">
              <button className="btn-icon" onClick={handleCopy} title="Copy">
                <Copy className="w-4 h-4" />
              </button>
              <button className="btn-icon" onClick={handleCut} title="Cut">
                <Scissors className="w-4 h-4" />
              </button>
              <button className="btn-icon delete" onClick={handleDelete} title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
              <span className="selection-count">{selectedFiles.size} selected</span>
            </div>
          )}

          <div className="search-box">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Files</option>
            <option value="folders">Folders</option>
            <option value="images">Images</option>
            <option value="documents">Documents</option>
            <option value="videos">Videos</option>
            <option value="archives">Archives</option>
          </select>

          <div className="sort-controls">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="name">Name</option>
              <option value="date">Date</option>
              <option value="size">Size</option>
            </select>
            <button 
              className="btn-icon"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div className="view-toggle">
            <button 
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="upload-progress-container">
          {uploads.map(upload => (
            <div key={upload.id} className={`upload-item ${upload.status}`}>
              <div className="upload-info">
                <span className="upload-name">{upload.name}</span>
                <span className="upload-status">
                  {upload.status === 'uploading' && `${upload.progress}%`}
                  {upload.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {upload.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                </span>
              </div>
              {upload.status === 'uploading' && (
                <div className="upload-bar">
                  <div className="upload-fill" style={{ width: `${upload.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Files Content */}
      <div className={`files-content ${viewMode}`}>
        {filteredFiles.length === 0 ? (
          <div className="empty-state">
            <FolderOpen className="w-16 h-16 text-gray-300" />
            <p>No files found</p>
            <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="files-grid">
            {filteredFiles.map(file => (
              <div
                key={file.id}
                className={`file-card ${selectedFiles.has(file.id) ? 'selected' : ''}`}
                onClick={(e) => toggleSelection(file, e)}
                onDoubleClick={() => file.type === 'folder' ? navigateToFolder(file) : setPreviewFile(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
              >
                <div className="file-icon">
                  {file.thumbnail ? (
                    <img src={file.thumbnail} alt={file.name} className="file-thumbnail" />
                  ) : (
                    getFileIcon(file)
                  )}
                  {file.starred && <Star className="star-icon" />}
                </div>
                <div className="file-info">
                  <span className="file-name" title={file.name}>{file.name}</span>
                  {file.type === 'file' && (
                    <span className="file-meta">
                      {formatSize(file.size || 0)}
                      {file.downloads !== undefined && <span className="downloads"> · {file.downloads} downloads</span>}
                    </span>
                  )}
                </div>
                <div className="file-badges">
                  {file.permissions === 'public' && (
                    <span className="badge public" title="Public">
                      <Globe className="w-3 h-3" />
                    </span>
                  )}
                  {file.permissions === 'private' && (
                    <span className="badge private" title="Private">
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="files-list">
            <div className="list-header">
              <span className="col-name">Name</span>
              <span className="col-modified">Modified</span>
              <span className="col-size">Size</span>
              <span className="col-owner">Owner</span>
              <span className="col-actions"></span>
            </div>
            {filteredFiles.map(file => (
              <div
                key={file.id}
                className={`list-row ${selectedFiles.has(file.id) ? 'selected' : ''}`}
                onClick={(e) => toggleSelection(file, e)}
                onDoubleClick={() => file.type === 'folder' ? navigateToFolder(file) : setPreviewFile(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
              >
                <div className="col-name">
                  {getFileIcon(file)}
                  <span className="name-text">{file.name}</span>
                  {file.starred && <Star className="w-4 h-4 star-icon" />}
                </div>
                <div className="col-modified">
                  {file.modifiedAt.toLocaleDateString()}
                </div>
                <div className="col-size">
                  {file.type === 'file' ? formatSize(file.size || 0) : '--'}
                </div>
                <div className="col-owner">
                  {file.owner}
                </div>
                <div className="col-actions">
                  <button className="btn-icon" onClick={(e) => { e.stopPropagation(); toggleStar(file); }}>
                    <Star className={`w-4 h-4 ${file.starred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </button>
                  <button className="btn-icon">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="btn-icon">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.file?.type === 'folder' ? (
            <>
              <button onClick={() => { navigateToFolder(contextMenu.file!); setContextMenu(null); }}>
                <FolderOpen className="w-4 h-4" />
                Open
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setPreviewFile(contextMenu.file); setContextMenu(null); }}>
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button>
                <Download className="w-4 h-4" />
                Download
              </button>
            </>
          )}
          <div className="context-divider" />
          <button onClick={handleCopy}>
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button onClick={handleCut}>
            <Scissors className="w-4 h-4" />
            Cut
          </button>
          <button>
            <Edit className="w-4 h-4" />
            Rename
          </button>
          <div className="context-divider" />
          <button>
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button onClick={() => { toggleStar(contextMenu.file!); setContextMenu(null); }}>
            <Star className="w-4 h-4" />
            {contextMenu.file?.starred ? 'Unstar' : 'Star'}
          </button>
          <div className="context-divider" />
          <button className="danger" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Folder</h3>
              <button className="close-btn" onClick={() => setShowNewFolderModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowNewFolderModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={createNewFolder}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="modal-overlay preview" onClick={() => setPreviewFile(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <div className="preview-info">
                {getFileIcon(previewFile)}
                <div className="preview-details">
                  <h3>{previewFile.name}</h3>
                  <span>{formatSize(previewFile.size || 0)} · {previewFile.modifiedAt.toLocaleDateString()}</span>
                </div>
              </div>
              <div className="preview-actions">
                <button className="btn-secondary">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button className="btn-secondary">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button className="close-btn" onClick={() => setPreviewFile(null)}>×</button>
              </div>
            </div>
            <div className="preview-content">
              {['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(previewFile.extension || '') ? (
                <div className="image-preview">
                  <Image className="w-24 h-24 text-gray-300" />
                  <span>Image Preview</span>
                </div>
              ) : ['mp4', 'mov', 'avi'].includes(previewFile.extension || '') ? (
                <div className="video-preview">
                  <Film className="w-24 h-24 text-gray-300" />
                  <span>Video Preview</span>
                </div>
              ) : (
                <div className="file-preview">
                  {getFileIcon(previewFile)}
                  <span>Preview not available</span>
                </div>
              )}
            </div>
            <div className="preview-metadata">
              <div className="metadata-row">
                <span className="label">Type</span>
                <span className="value">{previewFile.mimeType || 'Unknown'}</span>
              </div>
              <div className="metadata-row">
                <span className="label">Size</span>
                <span className="value">{formatSize(previewFile.size || 0)}</span>
              </div>
              <div className="metadata-row">
                <span className="label">Created</span>
                <span className="value">{previewFile.createdAt.toLocaleString()}</span>
              </div>
              <div className="metadata-row">
                <span className="label">Modified</span>
                <span className="value">{previewFile.modifiedAt.toLocaleString()}</span>
              </div>
              <div className="metadata-row">
                <span className="label">Owner</span>
                <span className="value">{previewFile.owner}</span>
              </div>
              <div className="metadata-row">
                <span className="label">Downloads</span>
                <span className="value">{previewFile.downloads || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clipboard Indicator */}
      {clipboard && (
        <div className="clipboard-indicator">
          <Clipboard className="w-4 h-4" />
          <span>{clipboard.files.length} item(s) in clipboard ({clipboard.action})</span>
          <button onClick={() => setClipboard(null)}>Clear</button>
        </div>
      )}
    </div>
  );
};

export default FileManager;
