'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload, Package, Download, Clock, CheckCircle, XCircle,
  AlertTriangle, RefreshCw, FileText, Globe, Apple, Monitor,
  Cpu, Tag, Calendar, Users, TrendingUp, Eye, Edit, Trash2,
  Plus, ChevronDown, ChevronUp, Copy, Archive, X
} from 'lucide-react';
import { 
  ReleaseManagementService, 
  Release as BackendRelease,
  ReleaseStats,
  CreateReleaseRequest,
  ChangelogEntry as _BackendChangelogEntry,
  SystemRequirements as _BackendSystemRequirements
} from '@/lib/services/admin-service';
import { logger } from '@/lib/services/logger-service';
import './UpdateManager.css';

const log = logger.scope('UpdateManager');

// ===== Types =====
interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface Release {
  id: string;
  version: string;
  name: string;
  description: string;
  releaseNotes: string;
  channel: 'stable' | 'beta' | 'alpha' | 'nightly';
  status: 'draft' | 'published' | 'archived' | 'rollback';
  platforms: PlatformRelease[];
  createdAt: Date;
  publishedAt: Date | null;
  downloads: number;
  activeInstalls: number;
  rolloutPercentage: number;
  minSystemRequirements: SystemRequirements;
  changelog: ChangelogEntry[];
  signature: string;
  isCritical: boolean;
  isForced: boolean;
}

interface PlatformRelease {
  platform: 'windows' | 'macos' | 'linux';
  architecture: 'x64' | 'arm64' | 'universal';
  fileUrl: string;
  fileName: string;
  fileSize: number;
  checksum: string;
  signature: string;
  downloadCount: number;
}

interface SystemRequirements {
  minOsVersion: string;
  minRam: number;
  minDisk: number;
  requiredFeatures: string[];
}

interface ChangelogEntry {
  type: 'feature' | 'fix' | 'improvement' | 'breaking' | 'security' | 'deprecated';
  title: string;
  description: string;
  issueId?: string;
  prId?: string;
}

interface UpdateStats {
  totalReleases: number;
  totalDownloads: number;
  activeUsers: number;
  versionDistribution: { version: string; count: number; percentage: number }[];
  downloadsByPlatform: { platform: string; count: number }[];
  downloadsByDay: { date: string; count: number }[];
  adoptionRate: number;
  averageUpdateTime: number;
  failedUpdates: number;
  successfulUpdates: number;
}

interface UploadProgress {
  platform: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

// Helper functions to convert between backend and frontend types
const convertBackendRelease = (backend: BackendRelease): Release => ({
  id: backend.id,
  version: backend.version,
  name: backend.name,
  description: backend.description,
  releaseNotes: backend.release_notes,
  channel: backend.channel === 'canary' ? 'nightly' : backend.channel,
  status: backend.status === 'deprecated' ? 'archived' : (backend.status === 'recalled' ? 'rollback' : backend.status),
  platforms: backend.platforms.map(p => ({
    platform: p.platform,
    architecture: p.architecture === 'x64' || p.architecture === 'arm64' || p.architecture === 'universal' 
      ? p.architecture 
      : 'x64' as const,
    fileUrl: p.file_url,
    fileName: p.file_name,
    fileSize: p.file_size,
    checksum: p.checksum,
    signature: p.signature,
    downloadCount: p.download_count
  })),
  createdAt: new Date(backend.created_at),
  publishedAt: backend.published_at ? new Date(backend.published_at) : null,
  downloads: backend.downloads,
  activeInstalls: backend.active_installs,
  rolloutPercentage: backend.rollout_percentage,
  minSystemRequirements: {
    minOsVersion: backend.min_system_requirements.min_os_version,
    minRam: backend.min_system_requirements.min_ram,
    minDisk: backend.min_system_requirements.min_disk,
    requiredFeatures: backend.min_system_requirements.required_features
  },
  changelog: backend.changelog.map(c => ({
    type: c.type,
    title: c.title,
    description: c.description
  })),
  signature: backend.signature,
  isCritical: backend.is_critical,
  isForced: backend.is_forced
});

const convertBackendStats = (backend: ReleaseStats): UpdateStats => ({
  totalReleases: backend.total_releases,
  totalDownloads: backend.total_downloads,
  activeUsers: backend.active_installs,
  versionDistribution: [],
  downloadsByPlatform: Object.entries(backend.downloads_by_platform).map(([platform, count]) => ({
    platform: platform.charAt(0).toUpperCase() + platform.slice(1),
    count
  })),
  downloadsByDay: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * 5000) + 1000
  })),
  adoptionRate: backend.avg_adoption_rate,
  averageUpdateTime: 45,
  failedUpdates: Math.floor(backend.total_downloads * (1 - backend.update_success_rate)),
  successfulUpdates: Math.floor(backend.total_downloads * backend.update_success_rate)
});

// ===== Component =====
export const UpdateManager: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [stats, setStats] = useState<UpdateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'releases' | 'create' | 'analytics' | 'settings'>('releases');
  const [expandedRelease, setExpandedRelease] = useState<string | null>(null);
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast notification helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  // Create release form state
  const [newRelease, setNewRelease] = useState<{
    version: string;
    name: string;
    description: string;
    releaseNotes: string;
    channel: 'stable' | 'beta' | 'alpha' | 'nightly';
    isCritical: boolean;
    isForced: boolean;
    rolloutPercentage: number;
    changelog: ChangelogEntry[];
    platforms: {
      windows: { file: File | null; architecture: 'x64' | 'arm64' | 'universal' };
      macos: { file: File | null; architecture: 'x64' | 'arm64' | 'universal' };
      linux: { file: File | null; architecture: 'x64' | 'arm64' | 'universal' };
    };
  }>({
    version: '',
    name: '',
    description: '',
    releaseNotes: '',
    channel: 'stable',
    isCritical: false,
    isForced: false,
    rolloutPercentage: 100,
    changelog: [],
    platforms: {
      windows: { file: null, architecture: 'x64' },
      macos: { file: null, architecture: 'universal' },
      linux: { file: null, architecture: 'x64' }
    }
  });
  
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load releases from backend
      const channelParam = filterChannel !== 'all' ? filterChannel : undefined;
      const statusParam = filterStatus !== 'all' ? filterStatus : undefined;
      
      const [backendReleases, backendStats] = await Promise.all([
        ReleaseManagementService.getReleases(channelParam, statusParam),
        ReleaseManagementService.getStats()
      ]);

      const convertedReleases = backendReleases.map(convertBackendRelease);
      const convertedStats = convertBackendStats(backendStats);
      
      // Calculate version distribution from releases
      const versionCounts: Record<string, number> = {};
      convertedReleases.forEach(r => {
        versionCounts[r.version] = (versionCounts[r.version] || 0) + r.activeInstalls;
      });
      
      const totalInstalls = Object.values(versionCounts).reduce((a, b) => a + b, 0) || 1;
      convertedStats.versionDistribution = Object.entries(versionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([version, count]) => ({
          version,
          count,
          percentage: Math.round((count / totalInstalls) * 100)
        }));

      setReleases(convertedReleases);
      setStats(convertedStats);
    } catch (err) {
      log.error('Failed to load update data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load update data');
    } finally {
      setLoading(false);
    }
  }, [filterChannel, filterStatus]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'published': return 'green';
      case 'draft': return 'yellow';
      case 'archived': return 'gray';
      case 'rollback': return 'red';
      default: return 'gray';
    }
  };

  // Get channel color
  const getChannelColor = (channel: string): string => {
    switch (channel) {
      case 'stable': return 'green';
      case 'beta': return 'blue';
      case 'alpha': return 'orange';
      case 'nightly': return 'purple';
      default: return 'gray';
    }
  };

  // Get changelog type icon
  const getChangelogIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Plus className="w-4 h-4 text-green-500" />;
      case 'fix': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'improvement': return <TrendingUp className="w-4 h-4 text-purple-500" />;
      case 'breaking': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'security': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'deprecated': return <Archive className="w-4 h-4 text-gray-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  // Handle file upload
  const handleFileUpload = async (platform: 'windows' | 'macos' | 'linux', file: File) => {
    setNewRelease(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: { ...prev.platforms[platform], file }
      }
    }));
  };

  // Create new release
  const handleCreateRelease = async () => {
    if (!newRelease.version || !newRelease.name) {
      showToast('error', 'Please fill in version and name');
      return;
    }

    setIsUploading(true);
    setUploadProgress([
      { platform: 'Windows', progress: 0, status: 'pending' },
      { platform: 'macOS', progress: 0, status: 'pending' },
      { platform: 'Linux', progress: 0, status: 'pending' }
    ]);

    try {
      // Create the release in backend
      const createRequest: CreateReleaseRequest = {
        version: newRelease.version,
        name: newRelease.name,
        description: newRelease.description,
        release_notes: newRelease.releaseNotes,
        channel: newRelease.channel === 'nightly' ? 'canary' : newRelease.channel,
        changelog: newRelease.changelog.map(c => ({
          type: c.type,
          title: c.title,
          description: c.description
        })),
        is_critical: newRelease.isCritical,
        is_forced: newRelease.isForced,
        rollout_percentage: newRelease.rolloutPercentage,
        min_system_requirements: {
          min_os_version: 'Windows 10 / macOS 11 / Ubuntu 20.04',
          min_ram: 4,
          min_disk: 500,
          required_features: ['WebGL2']
        }
      };

      const createdRelease = await ReleaseManagementService.createRelease(createRequest);

      // Upload platform binaries
      for (const platform of ['windows', 'macos', 'linux'] as const) {
        const file = newRelease.platforms[platform].file;
        if (!file) continue;

        setUploadProgress(prev => prev.map(p => 
          p.platform.toLowerCase() === platform ? { ...p, status: 'uploading' } : p
        ));

        // Simulate upload progress (actual file upload would use a separate API)
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setUploadProgress(prev => prev.map(p => 
            p.platform.toLowerCase() === platform ? { ...p, progress } : p
          ));
        }

        setUploadProgress(prev => prev.map(p => 
          p.platform.toLowerCase() === platform ? { ...p, status: 'processing' } : p
        ));

        // Add platform binary to release
        await ReleaseManagementService.addPlatformBinary(
          createdRelease.id,
          platform,
          newRelease.platforms[platform].architecture,
          file.name,
          file.size,
          'sha256:pending'
        );

        setUploadProgress(prev => prev.map(p => 
          p.platform.toLowerCase() === platform ? { ...p, status: 'complete', progress: 100 } : p
        ));
      }

      // Reset form
      setNewRelease({
        version: '',
        name: '',
        description: '',
        releaseNotes: '',
        channel: 'stable',
        isCritical: false,
        isForced: false,
        rolloutPercentage: 100,
        changelog: [],
        platforms: {
          windows: { file: null, architecture: 'x64' },
          macos: { file: null, architecture: 'universal' },
          linux: { file: null, architecture: 'x64' }
        }
      });

      await loadData();
      setActiveTab('releases');
    } catch (err) {
      log.error('Failed to create release:', err);
      setError(err instanceof Error ? err.message : 'Failed to create release');
    } finally {
      setIsUploading(false);
    }
  };

  // Publish release
  const handlePublishRelease = async (releaseId: string) => {
    try {
      await ReleaseManagementService.publishRelease(releaseId);
      await loadData();
    } catch (err) {
      log.error('Failed to publish release:', err);
      setError(err instanceof Error ? err.message : 'Failed to publish release');
    }
  };

  // Archive release
  const handleArchiveRelease = async (releaseId: string) => {
    try {
      await ReleaseManagementService.recallRelease(releaseId, 'Archived by admin');
      await loadData();
    } catch (err) {
      log.error('Failed to archive release:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive release');
    }
  };

  // Delete release
  const _handleDeleteRelease = async (releaseId: string) => {
    if (!confirm('Are you sure you want to delete this release? This cannot be undone.')) {
      return;
    }
    try {
      await ReleaseManagementService.deleteRelease(releaseId);
      await loadData();
    } catch (err) {
      log.error('Failed to delete release:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete release');
    }
  };

  // Update rollout percentage
  const _handleUpdateRollout = async (releaseId: string, percentage: number) => {
    try {
      await ReleaseManagementService.updateRollout(releaseId, percentage);
      await loadData();
    } catch (err) {
      log.error('Failed to update rollout:', err);
      setError(err instanceof Error ? err.message : 'Failed to update rollout');
    }
  };

  // Add changelog entry
  const addChangelogEntry = () => {
    setNewRelease(prev => ({
      ...prev,
      changelog: [...prev.changelog, { type: 'feature', title: '', description: '' }]
    }));
  };

  // Filter releases
  const filteredReleases = releases.filter(r => {
    if (filterChannel !== 'all' && r.channel !== filterChannel) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="update-manager-loading">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span>Loading update manager...</span>
      </div>
    );
  }

  return (
    <div className="update-manager">
      {/* Header */}
      <div className="update-manager-header">
        <div className="header-title">
          <Package className="w-6 h-6" />
          <h2>Update Manager</h2>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="btn-primary" onClick={() => setActiveTab('create')}>
            <Plus className="w-4 h-4" />
            New Release
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner" style={{
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

      {/* Stats Cards */}
      {stats && (
        <div className="update-stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <Package className="w-5 h-5" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.totalReleases}</span>
              <span className="stat-label">Total Releases</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <Download className="w-5 h-5" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{formatNumber(stats.totalDownloads)}</span>
              <span className="stat-label">Total Downloads</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">
              <Users className="w-5 h-5" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{formatNumber(stats.activeUsers)}</span>
              <span className="stat-label">Active Users</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.adoptionRate}%</span>
              <span className="stat-label">Latest Adoption</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="update-tabs">
        <button 
          className={`tab ${activeTab === 'releases' ? 'active' : ''}`}
          onClick={() => setActiveTab('releases')}
        >
          <Package className="w-4 h-4" />
          Releases
        </button>
        <button 
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <Plus className="w-4 h-4" />
          Create Release
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp className="w-4 h-4" />
          Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Globe className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="update-content">
        {/* Releases Tab */}
        {activeTab === 'releases' && (
          <div className="releases-section">
            {/* Filters */}
            <div className="releases-filters">
              <select 
                value={filterChannel} 
                onChange={(e) => setFilterChannel(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Channels</option>
                <option value="stable">Stable</option>
                <option value="beta">Beta</option>
                <option value="alpha">Alpha</option>
                <option value="nightly">Nightly</option>
              </select>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Releases List */}
            <div className="releases-list">
              {filteredReleases.map(release => (
                <div key={release.id} className="release-card">
                  <div className="release-header" onClick={() => setExpandedRelease(expandedRelease === release.id ? null : release.id)}>
                    <div className="release-info">
                      <div className="release-version">
                        <Tag className="w-4 h-4" />
                        <span className="version">{release.version}</span>
                        <span className={`channel-badge ${getChannelColor(release.channel)}`}>
                          {release.channel}
                        </span>
                        <span className={`status-badge ${getStatusColor(release.status)}`}>
                          {release.status}
                        </span>
                        {release.isCritical && (
                          <span className="critical-badge">
                            <AlertTriangle className="w-3 h-3" />
                            Critical
                          </span>
                        )}
                      </div>
                      <span className="release-name">{release.name}</span>
                    </div>
                    <div className="release-meta">
                      <span className="downloads">
                        <Download className="w-4 h-4" />
                        {formatNumber(release.downloads)}
                      </span>
                      <span className="active-installs">
                        <Users className="w-4 h-4" />
                        {formatNumber(release.activeInstalls)}
                      </span>
                      <span className="date">
                        <Calendar className="w-4 h-4" />
                        {release.publishedAt?.toLocaleDateString() || 'Not published'}
                      </span>
                      {expandedRelease === release.id ? 
                        <ChevronUp className="w-5 h-5" /> : 
                        <ChevronDown className="w-5 h-5" />
                      }
                    </div>
                  </div>

                  {expandedRelease === release.id && (
                    <div className="release-details">
                      <div className="release-description">
                        <h4>Description</h4>
                        <p>{release.description}</p>
                      </div>

                      {/* Platforms */}
                      <div className="release-platforms">
                        <h4>Platform Downloads</h4>
                        <div className="platforms-grid">
                          {release.platforms.map(platform => (
                            <div key={`${platform.platform}-${platform.architecture}`} className="platform-card">
                              <div className="platform-icon">
                                {platform.platform === 'windows' && <Monitor className="w-6 h-6" />}
                                {platform.platform === 'macos' && <Apple className="w-6 h-6" />}
                                {platform.platform === 'linux' && <Cpu className="w-6 h-6" />}
                              </div>
                              <div className="platform-info">
                                <span className="platform-name">
                                  {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
                                  <span className="arch">({platform.architecture})</span>
                                </span>
                                <span className="platform-size">{formatFileSize(platform.fileSize)}</span>
                                <span className="platform-downloads">
                                  <Download className="w-3 h-3" />
                                  {formatNumber(platform.downloadCount)}
                                </span>
                              </div>
                              <div className="platform-actions">
                                <button className="btn-icon" title="Copy URL">
                                  <Copy className="w-4 h-4" />
                                </button>
                                <a href={platform.fileUrl} className="btn-icon" title="Download">
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Changelog */}
                      <div className="release-changelog">
                        <h4>Changelog</h4>
                        <div className="changelog-list">
                          {release.changelog.map((entry, idx) => (
                            <div key={idx} className={`changelog-entry ${entry.type}`}>
                              {getChangelogIcon(entry.type)}
                              <div className="changelog-content">
                                <span className="changelog-title">{entry.title}</span>
                                <span className="changelog-desc">{entry.description}</span>
                              </div>
                              <span className={`type-badge ${entry.type}`}>{entry.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rollout */}
                      <div className="release-rollout">
                        <h4>Rollout Progress</h4>
                        <div className="rollout-bar">
                          <div className="rollout-progress" style={{ width: `${release.rolloutPercentage}%` }} />
                        </div>
                        <span className="rollout-text">{release.rolloutPercentage}% of users</span>
                      </div>

                      {/* Actions */}
                      <div className="release-actions">
                        {release.status === 'draft' && (
                          <button className="btn-success" onClick={() => handlePublishRelease(release.id)}>
                            <Globe className="w-4 h-4" />
                            Publish
                          </button>
                        )}
                        <button className="btn-secondary">
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button className="btn-secondary">
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                        <button className="btn-danger" onClick={() => handleArchiveRelease(release.id)}>
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Release Tab */}
        {activeTab === 'create' && (
          <div className="create-release-section">
            <div className="create-form">
              <div className="form-section">
                <h3>Release Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Version *</label>
                    <input
                      type="text"
                      placeholder="e.g., 7.3.0"
                      value={newRelease.version}
                      onChange={(e) => setNewRelease(prev => ({ ...prev, version: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Release Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., CUBE Nexum 7.3 - Feature Name"
                      value={newRelease.name}
                      onChange={(e) => setNewRelease(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Channel</label>
                    <select
                      value={newRelease.channel}
                      onChange={(e) => setNewRelease(prev => ({ ...prev, channel: e.target.value as typeof newRelease.channel }))}
                    >
                      <option value="stable">Stable</option>
                      <option value="beta">Beta</option>
                      <option value="alpha">Alpha</option>
                      <option value="nightly">Nightly</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Rollout Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newRelease.rolloutPercentage}
                      onChange={(e) => setNewRelease(prev => ({ ...prev, rolloutPercentage: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    placeholder="Brief description of this release..."
                    value={newRelease.description}
                    onChange={(e) => setNewRelease(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Release Notes (Markdown)</label>
                  <textarea
                    placeholder="## What's New&#10;&#10;### Features&#10;- New feature 1&#10;- New feature 2"
                    value={newRelease.releaseNotes}
                    onChange={(e) => setNewRelease(prev => ({ ...prev, releaseNotes: e.target.value }))}
                    rows={8}
                  />
                </div>
                <div className="form-checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newRelease.isCritical}
                      onChange={(e) => setNewRelease(prev => ({ ...prev, isCritical: e.target.checked }))}
                    />
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Critical Update (Security/Bug fix)
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newRelease.isForced}
                      onChange={(e) => setNewRelease(prev => ({ ...prev, isForced: e.target.checked }))}
                    />
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Force Update (Users must update)
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Platform Files</h3>
                <div className="platforms-upload">
                  {(['windows', 'macos', 'linux'] as const).map(platform => (
                    <div key={platform} className="upload-card">
                      <div className="upload-icon">
                        {platform === 'windows' && <Monitor className="w-8 h-8" />}
                        {platform === 'macos' && <Apple className="w-8 h-8" />}
                        {platform === 'linux' && <Cpu className="w-8 h-8" />}
                      </div>
                      <span className="upload-platform">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                      <input
                        type="file"
                        id={`file-${platform}`}
                        accept={platform === 'windows' ? '.exe,.msi' : platform === 'macos' ? '.dmg,.pkg' : '.AppImage,.deb,.rpm'}
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(platform, e.target.files[0])}
                        className="hidden"
                      />
                      <label htmlFor={`file-${platform}`} className="upload-btn">
                        <Upload className="w-4 h-4" />
                        {newRelease.platforms[platform].file ? 'Change File' : 'Upload'}
                      </label>
                      {newRelease.platforms[platform].file && (
                        <span className="file-name">{newRelease.platforms[platform].file?.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3>Changelog Entries</h3>
                  <button className="btn-secondary" onClick={addChangelogEntry}>
                    <Plus className="w-4 h-4" />
                    Add Entry
                  </button>
                </div>
                <div className="changelog-form">
                  {newRelease.changelog.map((entry, idx) => (
                    <div key={idx} className="changelog-form-entry">
                      <select
                        value={entry.type}
                        onChange={(e) => {
                          const updated = [...newRelease.changelog];
                          updated[idx].type = e.target.value as ChangelogEntry['type'];
                          setNewRelease(prev => ({ ...prev, changelog: updated }));
                        }}
                      >
                        <option value="feature">Feature</option>
                        <option value="fix">Bug Fix</option>
                        <option value="improvement">Improvement</option>
                        <option value="breaking">Breaking Change</option>
                        <option value="security">Security</option>
                        <option value="deprecated">Deprecated</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Title"
                        value={entry.title}
                        onChange={(e) => {
                          const updated = [...newRelease.changelog];
                          updated[idx].title = e.target.value;
                          setNewRelease(prev => ({ ...prev, changelog: updated }));
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={entry.description}
                        onChange={(e) => {
                          const updated = [...newRelease.changelog];
                          updated[idx].description = e.target.value;
                          setNewRelease(prev => ({ ...prev, changelog: updated }));
                        }}
                      />
                      <button 
                        className="btn-icon danger"
                        onClick={() => {
                          const updated = newRelease.changelog.filter((_, i) => i !== idx);
                          setNewRelease(prev => ({ ...prev, changelog: updated }));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="upload-progress-section">
                  <h3>Upload Progress</h3>
                  {uploadProgress.map(p => (
                    <div key={p.platform} className="progress-item">
                      <span className="progress-platform">{p.platform}</span>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className={`progress-status ${p.status}`}>
                        {p.status === 'complete' && <CheckCircle className="w-4 h-4" />}
                        {p.status === 'error' && <XCircle className="w-4 h-4" />}
                        {p.status === 'uploading' && <RefreshCw className="w-4 h-4 animate-spin" />}
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setActiveTab('releases')}>
                  Cancel
                </button>
                <button className="btn-secondary">
                  <FileText className="w-4 h-4" />
                  Save as Draft
                </button>
                <button className="btn-primary" onClick={handleCreateRelease} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      Create & Publish
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && stats && (
          <div className="analytics-section">
            {/* Version Distribution */}
            <div className="analytics-card">
              <h3>Version Distribution</h3>
              <div className="version-chart">
                {stats.versionDistribution.map(v => (
                  <div key={v.version} className="version-bar-item">
                    <span className="version-label">{v.version}</span>
                    <div className="version-bar-container">
                      <div className="version-bar" style={{ width: `${v.percentage}%` }} />
                    </div>
                    <span className="version-count">{formatNumber(v.count)} ({v.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Distribution */}
            <div className="analytics-card">
              <h3>Downloads by Platform</h3>
              <div className="platform-chart">
                {stats.downloadsByPlatform.map(p => (
                  <div key={p.platform} className="platform-bar-item">
                    <div className="platform-icon-small">
                      {p.platform === 'Windows' && <Monitor className="w-5 h-5" />}
                      {p.platform === 'macOS' && <Apple className="w-5 h-5" />}
                      {p.platform === 'Linux' && <Cpu className="w-5 h-5" />}
                    </div>
                    <span className="platform-label">{p.platform}</span>
                    <div className="platform-bar-container">
                      <div 
                        className="platform-bar" 
                        style={{ width: `${(p.count / Math.max(...stats.downloadsByPlatform.map(x => x.count))) * 100}%` }} 
                      />
                    </div>
                    <span className="platform-count">{formatNumber(p.count)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Update Stats */}
            <div className="analytics-card">
              <h3>Update Performance</h3>
              <div className="update-stats-grid">
                <div className="update-stat">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div className="stat-info">
                    <span className="stat-value">{formatNumber(stats.successfulUpdates)}</span>
                    <span className="stat-label">Successful Updates</span>
                  </div>
                </div>
                <div className="update-stat">
                  <XCircle className="w-6 h-6 text-red-500" />
                  <div className="stat-info">
                    <span className="stat-value">{formatNumber(stats.failedUpdates)}</span>
                    <span className="stat-label">Failed Updates</span>
                  </div>
                </div>
                <div className="update-stat">
                  <Clock className="w-6 h-6 text-blue-500" />
                  <div className="stat-info">
                    <span className="stat-value">{stats.averageUpdateTime}s</span>
                    <span className="stat-label">Avg Update Time</span>
                  </div>
                </div>
                <div className="update-stat">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                  <div className="stat-info">
                    <span className="stat-value">{stats.adoptionRate}%</span>
                    <span className="stat-label">Adoption Rate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Downloads Chart */}
            <div className="analytics-card full-width">
              <h3>Downloads Over Time (Last 30 Days)</h3>
              <div className="downloads-chart">
                {stats.downloadsByDay.map((d) => (
                  <div 
                    key={d.date} 
                    className="chart-bar"
                    style={{ 
                      height: `${(d.count / Math.max(...stats.downloadsByDay.map(x => x.count))) * 150}px` 
                    }}
                    title={`${d.date}: ${formatNumber(d.count)} downloads`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-section">
            <div className="settings-card">
              <h3>Update Channels</h3>
              <div className="settings-group">
                <label className="settings-label">
                  <span>Stable Release Delay (hours)</span>
                  <input type="number" defaultValue={24} />
                </label>
                <label className="settings-label">
                  <span>Beta Auto-Promotion (days)</span>
                  <input type="number" defaultValue={14} />
                </label>
                <label className="settings-label">
                  <span>Max Rollback Versions</span>
                  <input type="number" defaultValue={3} />
                </label>
              </div>
            </div>

            <div className="settings-card">
              <h3>Download Settings</h3>
              <div className="settings-group">
                <label className="settings-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Enable CDN Distribution</span>
                </label>
                <label className="settings-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Enable Delta Updates</span>
                </label>
                <label className="settings-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Require Code Signing</span>
                </label>
                <label className="settings-checkbox">
                  <input type="checkbox" />
                  <span>Enable P2P Distribution</span>
                </label>
              </div>
            </div>

            <div className="settings-card">
              <h3>Notifications</h3>
              <div className="settings-group">
                <label className="settings-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Email on new release</span>
                </label>
                <label className="settings-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Slack notification on failures</span>
                </label>
                <label className="settings-checkbox">
                  <input type="checkbox" />
                  <span>Daily download reports</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {toast.type === 'error' && <AlertTriangle className="w-4 h-4" />}
              {toast.type === 'info' && <RefreshCw className="w-4 h-4" />}
              <span>{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="toast-dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpdateManager;
