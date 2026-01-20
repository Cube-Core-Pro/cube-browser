'use client';

import React, { useState } from 'react';
import { 
  Container,
  Package,
  Tag,
  Download,
  Upload,
  Shield,
  Clock,
  HardDrive,
  RefreshCw,
  Search,
  Plus,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Eye,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Layers,
  Box,
  Globe,
  Settings,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import './container-registry.css';

interface RegistryImage {
  id: string;
  name: string;
  repository: string;
  tags: string[];
  size: number;
  layers: number;
  created: string;
  pushed: string;
  pulls: number;
  visibility: 'public' | 'private';
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  scanned: string | null;
  digest: string;
  architecture: string[];
  os: string[];
}

interface Repository {
  id: string;
  name: string;
  description: string;
  images: number;
  totalSize: number;
  pulls: number;
  stars: number;
  visibility: 'public' | 'private';
  created: string;
  lastPush: string;
  retentionPolicy: string | null;
}

interface ScanResult {
  id: string;
  imageId: string;
  imageName: string;
  tag: string;
  status: 'completed' | 'in-progress' | 'failed' | 'pending';
  startedAt: string;
  completedAt: string | null;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  packages: number;
  baseImage: string;
}

interface AccessPolicy {
  id: string;
  name: string;
  type: 'push' | 'pull' | 'admin' | 'readonly';
  scope: 'global' | 'repository' | 'image';
  target: string;
  principals: string[];
  enabled: boolean;
  created: string;
}

const REPOSITORIES: Repository[] = [
  {
    id: 'repo-1',
    name: 'cube-elite/frontend',
    description: 'CUBE Elite frontend React application',
    images: 48,
    totalSize: 2457600000,
    pulls: 15420,
    stars: 156,
    visibility: 'private',
    created: '2024-06-15T08:00:00Z',
    lastPush: '2025-01-28T14:30:00Z',
    retentionPolicy: 'Keep last 20 tags'
  },
  {
    id: 'repo-2',
    name: 'cube-elite/backend',
    description: 'Rust backend API service',
    images: 62,
    totalSize: 1843200000,
    pulls: 23150,
    stars: 189,
    visibility: 'private',
    created: '2024-06-15T08:00:00Z',
    lastPush: '2025-01-28T12:15:00Z',
    retentionPolicy: 'Keep last 30 tags'
  },
  {
    id: 'repo-3',
    name: 'cube-elite/ai-service',
    description: 'AI processing and inference service',
    images: 35,
    totalSize: 4915200000,
    pulls: 8750,
    stars: 134,
    visibility: 'private',
    created: '2024-09-01T10:00:00Z',
    lastPush: '2025-01-27T18:45:00Z',
    retentionPolicy: 'Keep last 15 tags'
  },
  {
    id: 'repo-4',
    name: 'cube-elite/proxy',
    description: 'Edge proxy and load balancer',
    images: 28,
    totalSize: 512000000,
    pulls: 45230,
    stars: 212,
    visibility: 'public',
    created: '2024-07-20T14:00:00Z',
    lastPush: '2025-01-26T09:30:00Z',
    retentionPolicy: null
  },
  {
    id: 'repo-5',
    name: 'cube-elite/worker',
    description: 'Background job processor',
    images: 41,
    totalSize: 1024000000,
    pulls: 12680,
    stars: 98,
    visibility: 'private',
    created: '2024-08-10T11:00:00Z',
    lastPush: '2025-01-28T08:00:00Z',
    retentionPolicy: 'Keep last 25 tags'
  }
];

const IMAGES: RegistryImage[] = [
  {
    id: 'img-1',
    name: 'cube-elite/frontend',
    repository: 'cube-elite/frontend',
    tags: ['latest', 'v2.5.0', 'stable'],
    size: 245760000,
    layers: 12,
    created: '2025-01-28T14:30:00Z',
    pushed: '2025-01-28T14:32:00Z',
    pulls: 1250,
    visibility: 'private',
    vulnerabilities: { critical: 0, high: 1, medium: 4, low: 12 },
    scanned: '2025-01-28T14:35:00Z',
    digest: 'sha256:a1b2c3d4e5f6...',
    architecture: ['amd64', 'arm64'],
    os: ['linux']
  },
  {
    id: 'img-2',
    name: 'cube-elite/backend',
    repository: 'cube-elite/backend',
    tags: ['latest', 'v3.1.2'],
    size: 184320000,
    layers: 8,
    created: '2025-01-28T12:15:00Z',
    pushed: '2025-01-28T12:18:00Z',
    pulls: 2340,
    visibility: 'private',
    vulnerabilities: { critical: 0, high: 0, medium: 2, low: 8 },
    scanned: '2025-01-28T12:20:00Z',
    digest: 'sha256:b2c3d4e5f6a7...',
    architecture: ['amd64'],
    os: ['linux']
  },
  {
    id: 'img-3',
    name: 'cube-elite/ai-service',
    repository: 'cube-elite/ai-service',
    tags: ['latest', 'v1.8.0', 'gpu'],
    size: 4915200000,
    layers: 24,
    created: '2025-01-27T18:45:00Z',
    pushed: '2025-01-27T18:52:00Z',
    pulls: 890,
    visibility: 'private',
    vulnerabilities: { critical: 2, high: 5, medium: 12, low: 23 },
    scanned: '2025-01-27T19:00:00Z',
    digest: 'sha256:c3d4e5f6a7b8...',
    architecture: ['amd64'],
    os: ['linux']
  },
  {
    id: 'img-4',
    name: 'cube-elite/proxy',
    repository: 'cube-elite/proxy',
    tags: ['latest', 'v1.2.1', 'edge'],
    size: 51200000,
    layers: 5,
    created: '2025-01-26T09:30:00Z',
    pushed: '2025-01-26T09:31:00Z',
    pulls: 8920,
    visibility: 'public',
    vulnerabilities: { critical: 0, high: 0, medium: 1, low: 3 },
    scanned: '2025-01-26T09:33:00Z',
    digest: 'sha256:d4e5f6a7b8c9...',
    architecture: ['amd64', 'arm64', 'arm/v7'],
    os: ['linux', 'windows']
  },
  {
    id: 'img-5',
    name: 'cube-elite/worker',
    repository: 'cube-elite/worker',
    tags: ['latest', 'v2.0.3'],
    size: 102400000,
    layers: 10,
    created: '2025-01-28T08:00:00Z',
    pushed: '2025-01-28T08:03:00Z',
    pulls: 1560,
    visibility: 'private',
    vulnerabilities: { critical: 0, high: 2, medium: 6, low: 15 },
    scanned: '2025-01-28T08:05:00Z',
    digest: 'sha256:e5f6a7b8c9d0...',
    architecture: ['amd64'],
    os: ['linux']
  }
];

const SCAN_RESULTS: ScanResult[] = [
  {
    id: 'scan-1',
    imageId: 'img-1',
    imageName: 'cube-elite/frontend',
    tag: 'v2.5.0',
    status: 'completed',
    startedAt: '2025-01-28T14:33:00Z',
    completedAt: '2025-01-28T14:35:00Z',
    vulnerabilities: { critical: 0, high: 1, medium: 4, low: 12 },
    packages: 245,
    baseImage: 'node:20-alpine'
  },
  {
    id: 'scan-2',
    imageId: 'img-3',
    imageName: 'cube-elite/ai-service',
    tag: 'v1.8.0',
    status: 'completed',
    startedAt: '2025-01-27T18:55:00Z',
    completedAt: '2025-01-27T19:00:00Z',
    vulnerabilities: { critical: 2, high: 5, medium: 12, low: 23 },
    packages: 512,
    baseImage: 'nvidia/cuda:12.0-runtime'
  },
  {
    id: 'scan-3',
    imageId: 'img-new',
    imageName: 'cube-elite/backend',
    tag: 'v3.1.3-dev',
    status: 'in-progress',
    startedAt: '2025-01-28T15:00:00Z',
    completedAt: null,
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
    packages: 0,
    baseImage: 'rust:1.75-slim'
  },
  {
    id: 'scan-4',
    imageId: 'img-old',
    imageName: 'cube-elite/legacy-api',
    tag: 'v1.0.0',
    status: 'failed',
    startedAt: '2025-01-28T10:00:00Z',
    completedAt: '2025-01-28T10:02:00Z',
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
    packages: 0,
    baseImage: 'node:14-alpine'
  }
];

const ACCESS_POLICIES: AccessPolicy[] = [
  {
    id: 'policy-1',
    name: 'CI/CD Pipeline Access',
    type: 'push',
    scope: 'global',
    target: '*',
    principals: ['service:github-actions', 'service:gitlab-ci'],
    enabled: true,
    created: '2024-06-15T08:00:00Z'
  },
  {
    id: 'policy-2',
    name: 'Development Team Pull',
    type: 'pull',
    scope: 'repository',
    target: 'cube-elite/*',
    principals: ['team:developers', 'team:qa'],
    enabled: true,
    created: '2024-06-15T08:00:00Z'
  },
  {
    id: 'policy-3',
    name: 'Production Admin',
    type: 'admin',
    scope: 'repository',
    target: 'cube-elite/production-*',
    principals: ['team:platform', 'user:admin@cube.io'],
    enabled: true,
    created: '2024-07-01T10:00:00Z'
  },
  {
    id: 'policy-4',
    name: 'External Partners',
    type: 'readonly',
    scope: 'image',
    target: 'cube-elite/proxy:stable',
    principals: ['org:partner-acme', 'org:partner-beta'],
    enabled: true,
    created: '2024-09-15T14:00:00Z'
  }
];

const SCAN_STATUS_CONFIG = {
  completed: { color: 'success', icon: CheckCircle, label: 'Completed' },
  'in-progress': { color: 'info', icon: RefreshCw, label: 'Scanning' },
  failed: { color: 'danger', icon: XCircle, label: 'Failed' },
  pending: { color: 'muted', icon: Clock, label: 'Pending' }
};

const POLICY_TYPE_CONFIG = {
  push: { color: 'primary', icon: Upload },
  pull: { color: 'info', icon: Download },
  admin: { color: 'danger', icon: Shield },
  readonly: { color: 'muted', icon: Eye }
};

export default function ContainerRegistryPage() {
  const [activeTab, setActiveTab] = useState<'repositories' | 'images' | 'security' | 'policies'>('repositories');
  const [expandedRepo, setExpandedRepo] = useState<string | null>('repo-1');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [scanStatusFilter, setScanStatusFilter] = useState<string>('all');

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getTotalVulnerabilities = (vuln: RegistryImage['vulnerabilities']) => {
    return vuln.critical + vuln.high + vuln.medium + vuln.low;
  };

  const totalImages = REPOSITORIES.reduce((acc, r) => acc + r.images, 0);
  const totalPulls = REPOSITORIES.reduce((acc, r) => acc + r.pulls, 0);
  const totalStorage = REPOSITORIES.reduce((acc, r) => acc + r.totalSize, 0);
  const criticalVulns = IMAGES.reduce((acc, i) => acc + i.vulnerabilities.critical, 0);

  return (
    <div className="container-registry">
      <div className="container-registry__header">
        <div className="container-registry__title-section">
          <div className="container-registry__icon">
            <Container size={28} />
          </div>
          <div>
            <h1>Container Registry</h1>
            <p>Manage container images, repositories, and security scanning</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Repository
          </button>
        </div>
      </div>

      <div className="container-registry__stats">
        <div className="stat-card">
          <div className="stat-icon repos">
            <Box size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{REPOSITORIES.length}</span>
            <span className="stat-label">Repositories</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon images">
            <Layers size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalImages}</span>
            <span className="stat-label">Total Images</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pulls">
            <Download size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(totalPulls)}</span>
            <span className="stat-label">Total Pulls</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon storage">
            <HardDrive size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatBytes(totalStorage)}</span>
            <span className="stat-label">Total Storage</span>
          </div>
        </div>
      </div>

      <div className="container-registry__tabs">
        <button 
          className={`tab-btn ${activeTab === 'repositories' ? 'active' : ''}`}
          onClick={() => setActiveTab('repositories')}
        >
          <Box size={16} />
          Repositories
        </button>
        <button 
          className={`tab-btn ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          <Layers size={16} />
          Images
        </button>
        <button 
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={16} />
          Security
          {criticalVulns > 0 && <span className="tab-badge danger">{criticalVulns}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <Lock size={16} />
          Access Policies
        </button>
      </div>

      {activeTab === 'repositories' && (
        <div className="repos-section">
          <div className="repos-header">
            <h3>Repositories ({REPOSITORIES.length})</h3>
            <div className="repos-filters">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search repositories..." />
              </div>
              <select 
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
              >
                <option value="all">All Visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <div className="repos-list">
            {REPOSITORIES.filter(r => visibilityFilter === 'all' || r.visibility === visibilityFilter)
              .map(repo => (
              <div 
                key={repo.id}
                className={`repo-card ${repo.visibility}`}
              >
                <div className="repo-main">
                  <div className="repo-icon">
                    <Package size={20} />
                  </div>
                  <div className="repo-info">
                    <div className="repo-header">
                      <h4>{repo.name}</h4>
                      <span className={`visibility-badge ${repo.visibility}`}>
                        {repo.visibility === 'public' ? <Globe size={12} /> : <Lock size={12} />}
                        {repo.visibility}
                      </span>
                      {repo.retentionPolicy && (
                        <span className="retention-badge">
                          <Clock size={12} />
                          {repo.retentionPolicy}
                        </span>
                      )}
                    </div>
                    <p className="repo-description">{repo.description}</p>
                    <div className="repo-meta">
                      <span><Layers size={12} /> {repo.images} images</span>
                      <span><HardDrive size={12} /> {formatBytes(repo.totalSize)}</span>
                      <span><Download size={12} /> {formatNumber(repo.pulls)} pulls</span>
                      <span><Clock size={12} /> Updated {formatDate(repo.lastPush)}</span>
                    </div>
                  </div>
                  <div className="repo-stats">
                    <div className="repo-stat">
                      <span className="stat-value">{repo.images}</span>
                      <span className="stat-label">Images</span>
                    </div>
                    <div className="repo-stat">
                      <span className="stat-value">{formatNumber(repo.pulls)}</span>
                      <span className="stat-label">Pulls</span>
                    </div>
                  </div>
                  <div className="repo-actions">
                    <button className="action-btn" title="Copy pull command">
                      <Copy size={14} />
                    </button>
                    <button className="action-btn" title="Settings">
                      <Settings size={14} />
                    </button>
                    <button 
                      className="expand-btn"
                      onClick={() => setExpandedRepo(expandedRepo === repo.id ? null : repo.id)}
                    >
                      {expandedRepo === repo.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {expandedRepo === repo.id && (
                  <div className="repo-expanded">
                    <div className="expanded-grid">
                      <div className="expanded-section">
                        <h5>Quick Commands</h5>
                        <div className="command-box">
                          <code>docker pull registry.cube.io/{repo.name}:latest</code>
                          <button className="copy-btn">
                            <Copy size={14} />
                          </button>
                        </div>
                        <div className="command-box">
                          <code>docker push registry.cube.io/{repo.name}:&lt;tag&gt;</code>
                          <button className="copy-btn">
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="expanded-section">
                        <h5>Recent Tags</h5>
                        <div className="tags-list">
                          {IMAGES.filter(i => i.repository === repo.name)
                            .flatMap(i => i.tags)
                            .slice(0, 5)
                            .map((tag, idx) => (
                              <span key={idx} className="tag-chip">
                                <Tag size={12} />
                                {tag}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="expanded-actions">
                      <button className="btn-sm">
                        <Eye size={14} />
                        View All Images
                      </button>
                      <button className="btn-sm">
                        <Shield size={14} />
                        Security Scan
                      </button>
                      <button className="btn-sm danger">
                        <Trash2 size={14} />
                        Delete Repository
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'images' && (
        <div className="images-section">
          <div className="images-header">
            <h3>Container Images ({IMAGES.length})</h3>
            <div className="images-filters">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search images..." />
              </div>
              <select defaultValue="all">
                <option value="all">All Repositories</option>
                {REPOSITORIES.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="images-list">
            {IMAGES.map(image => {
              const totalVulns = getTotalVulnerabilities(image.vulnerabilities);
              const hasIssues = image.vulnerabilities.critical > 0 || image.vulnerabilities.high > 0;
              
              return (
                <div 
                  key={image.id}
                  className={`image-card ${hasIssues ? 'has-issues' : ''}`}
                >
                  <div className="image-main">
                    <div className={`image-icon ${hasIssues ? 'warning' : 'success'}`}>
                      <Layers size={20} />
                    </div>
                    <div className="image-info">
                      <div className="image-header">
                        <h4>{image.name}</h4>
                        <div className="tags-inline">
                          {image.tags.map((tag, idx) => (
                            <span key={idx} className="tag-badge">
                              <Tag size={10} />
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className={`visibility-badge ${image.visibility}`}>
                          {image.visibility === 'public' ? <Unlock size={12} /> : <Lock size={12} />}
                        </span>
                      </div>
                      <div className="image-meta">
                        <span><HardDrive size={12} /> {formatBytes(image.size)}</span>
                        <span><Layers size={12} /> {image.layers} layers</span>
                        <span><Download size={12} /> {formatNumber(image.pulls)} pulls</span>
                        <span><Clock size={12} /> Pushed {formatDate(image.pushed)}</span>
                        <span className="arch-info">
                          {image.architecture.join(', ')}
                        </span>
                      </div>
                    </div>
                    <div className="image-vulns">
                      {image.vulnerabilities.critical > 0 && (
                        <span className="vuln-badge critical">
                          {image.vulnerabilities.critical} Critical
                        </span>
                      )}
                      {image.vulnerabilities.high > 0 && (
                        <span className="vuln-badge high">
                          {image.vulnerabilities.high} High
                        </span>
                      )}
                      {totalVulns > 0 && (
                        <span className="vuln-total">
                          {totalVulns} total
                        </span>
                      )}
                      {totalVulns === 0 && (
                        <span className="vuln-clean">
                          <CheckCircle size={14} />
                          No issues
                        </span>
                      )}
                    </div>
                    <div className="image-actions">
                      <button className="action-btn" title="Copy digest">
                        <Copy size={14} />
                      </button>
                      <button className="action-btn" title="Scan">
                        <Shield size={14} />
                      </button>
                      <button 
                        className="expand-btn"
                        onClick={() => setExpandedImage(expandedImage === image.id ? null : image.id)}
                      >
                        {expandedImage === image.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {expandedImage === image.id && (
                    <div className="image-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h5>Image Details</h5>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span className="label">Digest</span>
                              <span className="value mono">{image.digest}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Created</span>
                              <span className="value">{new Date(image.created).toLocaleString()}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Architecture</span>
                              <span className="value">{image.architecture.join(', ')}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">OS</span>
                              <span className="value">{image.os.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="expanded-section">
                          <h5>Vulnerabilities</h5>
                          <div className="vuln-breakdown">
                            <div className="vuln-row">
                              <span className="vuln-label critical">Critical</span>
                              <div className="vuln-bar">
                                <div 
                                  className="vuln-fill critical" 
                                  style={{width: `${(image.vulnerabilities.critical / Math.max(totalVulns, 1)) * 100}%`}}
                                />
                              </div>
                              <span className="vuln-count">{image.vulnerabilities.critical}</span>
                            </div>
                            <div className="vuln-row">
                              <span className="vuln-label high">High</span>
                              <div className="vuln-bar">
                                <div 
                                  className="vuln-fill high" 
                                  style={{width: `${(image.vulnerabilities.high / Math.max(totalVulns, 1)) * 100}%`}}
                                />
                              </div>
                              <span className="vuln-count">{image.vulnerabilities.high}</span>
                            </div>
                            <div className="vuln-row">
                              <span className="vuln-label medium">Medium</span>
                              <div className="vuln-bar">
                                <div 
                                  className="vuln-fill medium" 
                                  style={{width: `${(image.vulnerabilities.medium / Math.max(totalVulns, 1)) * 100}%`}}
                                />
                              </div>
                              <span className="vuln-count">{image.vulnerabilities.medium}</span>
                            </div>
                            <div className="vuln-row">
                              <span className="vuln-label low">Low</span>
                              <div className="vuln-bar">
                                <div 
                                  className="vuln-fill low" 
                                  style={{width: `${(image.vulnerabilities.low / Math.max(totalVulns, 1)) * 100}%`}}
                                />
                              </div>
                              <span className="vuln-count">{image.vulnerabilities.low}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="expanded-actions">
                        <button className="btn-sm">
                          <Download size={14} />
                          Pull Image
                        </button>
                        <button className="btn-sm">
                          <Tag size={14} />
                          Add Tag
                        </button>
                        <button className="btn-sm danger">
                          <Trash2 size={14} />
                          Delete Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="security-section">
          <div className="security-header">
            <h3>Security Scans</h3>
            <div className="security-filters">
              <select 
                value={scanStatusFilter}
                onChange={(e) => setScanStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="failed">Failed</option>
              </select>
              <button className="btn-outline">
                <RefreshCw size={16} />
                Scan All
              </button>
            </div>
          </div>

          <div className="security-summary">
            <div className="summary-card critical">
              <div className="summary-icon">
                <AlertTriangle size={20} />
              </div>
              <div className="summary-content">
                <span className="summary-value">{criticalVulns}</span>
                <span className="summary-label">Critical</span>
              </div>
            </div>
            <div className="summary-card high">
              <div className="summary-icon">
                <AlertTriangle size={20} />
              </div>
              <div className="summary-content">
                <span className="summary-value">
                  {IMAGES.reduce((acc, i) => acc + i.vulnerabilities.high, 0)}
                </span>
                <span className="summary-label">High</span>
              </div>
            </div>
            <div className="summary-card medium">
              <div className="summary-icon">
                <AlertTriangle size={20} />
              </div>
              <div className="summary-content">
                <span className="summary-value">
                  {IMAGES.reduce((acc, i) => acc + i.vulnerabilities.medium, 0)}
                </span>
                <span className="summary-label">Medium</span>
              </div>
            </div>
            <div className="summary-card low">
              <div className="summary-icon">
                <AlertTriangle size={20} />
              </div>
              <div className="summary-content">
                <span className="summary-value">
                  {IMAGES.reduce((acc, i) => acc + i.vulnerabilities.low, 0)}
                </span>
                <span className="summary-label">Low</span>
              </div>
            </div>
          </div>

          <div className="scans-table">
            <div className="st-header">
              <span className="st-th">Image</span>
              <span className="st-th">Tag</span>
              <span className="st-th">Status</span>
              <span className="st-th">Vulnerabilities</span>
              <span className="st-th">Packages</span>
              <span className="st-th">Base Image</span>
              <span className="st-th">Scanned</span>
              <span className="st-th">Actions</span>
            </div>
            <div className="st-body">
              {SCAN_RESULTS.filter(s => scanStatusFilter === 'all' || s.status === scanStatusFilter)
                .map(scan => {
                const StatusConfig = SCAN_STATUS_CONFIG[scan.status];
                const StatusIcon = StatusConfig.icon;
                const totalVulns = scan.vulnerabilities.critical + scan.vulnerabilities.high + 
                                  scan.vulnerabilities.medium + scan.vulnerabilities.low;
                
                return (
                  <div key={scan.id} className="st-row">
                    <span className="st-td name">
                      <Layers size={14} />
                      {scan.imageName}
                    </span>
                    <span className="st-td tag">
                      <Tag size={12} />
                      {scan.tag}
                    </span>
                    <span className={`st-td status ${StatusConfig.color}`}>
                      <StatusIcon size={14} className={scan.status === 'in-progress' ? 'spinning' : ''} />
                      {StatusConfig.label}
                    </span>
                    <span className="st-td vulns">
                      {scan.status === 'completed' ? (
                        <div className="vulns-mini">
                          {scan.vulnerabilities.critical > 0 && (
                            <span className="vuln-mini critical">{scan.vulnerabilities.critical}C</span>
                          )}
                          {scan.vulnerabilities.high > 0 && (
                            <span className="vuln-mini high">{scan.vulnerabilities.high}H</span>
                          )}
                          {totalVulns === 0 && <span className="vuln-clean-mini">Clean</span>}
                          {totalVulns > 0 && scan.vulnerabilities.critical === 0 && scan.vulnerabilities.high === 0 && (
                            <span className="vuln-mini low">{totalVulns}</span>
                          )}
                        </div>
                      ) : '-'}
                    </span>
                    <span className="st-td">{scan.packages || '-'}</span>
                    <span className="st-td base">{scan.baseImage}</span>
                    <span className="st-td">
                      {scan.completedAt ? formatDate(scan.completedAt) : '-'}
                    </span>
                    <span className="st-td actions">
                      <button className="action-btn-sm" title="View Details">
                        <Eye size={12} />
                      </button>
                      <button className="action-btn-sm" title="Re-scan">
                        <RefreshCw size={12} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="policies-section">
          <div className="policies-header">
            <h3>Access Policies ({ACCESS_POLICIES.length})</h3>
            <button className="btn-primary">
              <Plus size={16} />
              New Policy
            </button>
          </div>

          <div className="policies-grid">
            {ACCESS_POLICIES.map(policy => {
              const TypeConfig = POLICY_TYPE_CONFIG[policy.type];
              const TypeIcon = TypeConfig.icon;
              
              return (
                <div key={policy.id} className={`policy-card ${policy.enabled ? 'enabled' : 'disabled'}`}>
                  <div className="policy-header">
                    <div className={`policy-icon ${TypeConfig.color}`}>
                      <TypeIcon size={18} />
                    </div>
                    <div className="policy-title">
                      <h4>{policy.name}</h4>
                      <span className={`policy-type ${TypeConfig.color}`}>{policy.type}</span>
                    </div>
                    <div className="policy-toggle">
                      <label className="switch">
                        <input type="checkbox" checked={policy.enabled} readOnly />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                  <div className="policy-details">
                    <div className="policy-detail">
                      <span className="label">Scope</span>
                      <span className="value">{policy.scope}</span>
                    </div>
                    <div className="policy-detail">
                      <span className="label">Target</span>
                      <span className="value mono">{policy.target}</span>
                    </div>
                  </div>
                  <div className="policy-principals">
                    <span className="label">Principals:</span>
                    <div className="principals-list">
                      {policy.principals.map((p, idx) => (
                        <span key={idx} className="principal-chip">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="policy-footer">
                    <span className="created">Created {formatDate(policy.created)}</span>
                    <div className="policy-actions">
                      <button className="action-btn-sm" title="Edit">
                        <Settings size={12} />
                      </button>
                      <button className="action-btn-sm" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
