'use client';

import React, { useState } from 'react';
import { 
  Flag, 
  Plus, 
  Search, 
  Filter,
  ToggleLeft,
  ToggleRight,
  Users,
  Percent,
  Calendar,
  Globe,
  Code,
  Target,
  Clock,
  Edit2,
  Trash2,
  Copy,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Shield,
  Zap,
  Settings,
  History,
  BarChart3
} from 'lucide-react';
import './feature-flags.css';

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  type: 'boolean' | 'percentage' | 'user-segment' | 'scheduled' | 'geo';
  environment: 'production' | 'staging' | 'development' | 'all';
  rolloutPercentage?: number;
  targetUsers?: number;
  schedule?: {
    startDate: string;
    endDate?: string;
  };
  regions?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  variants?: {
    name: string;
    value: string;
    weight: number;
  }[];
}

const FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: 'flag-001',
    name: 'AI Workflow Builder',
    key: 'ai_workflow_builder',
    description: 'Enable AI-powered workflow creation from natural language',
    enabled: true,
    type: 'percentage',
    environment: 'production',
    rolloutPercentage: 75,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-27T14:30:00Z',
    createdBy: 'Sarah Chen',
    tags: ['ai', 'core-feature', 'premium']
  },
  {
    id: 'flag-002',
    name: 'New Dashboard UI',
    key: 'new_dashboard_ui',
    description: 'Redesigned dashboard with enhanced analytics',
    enabled: true,
    type: 'user-segment',
    environment: 'staging',
    targetUsers: 1250,
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-26T11:00:00Z',
    createdBy: 'Mike Johnson',
    tags: ['ui', 'beta']
  },
  {
    id: 'flag-003',
    name: 'Dark Mode V2',
    key: 'dark_mode_v2',
    description: 'Enhanced dark mode with OLED support',
    enabled: false,
    type: 'boolean',
    environment: 'development',
    createdAt: '2024-01-22T14:00:00Z',
    updatedAt: '2024-01-22T14:00:00Z',
    createdBy: 'Emma Wilson',
    tags: ['ui', 'accessibility']
  },
  {
    id: 'flag-004',
    name: 'Holiday Promotion',
    key: 'holiday_promo_2024',
    description: 'Special holiday pricing and features',
    enabled: true,
    type: 'scheduled',
    environment: 'production',
    schedule: {
      startDate: '2024-02-01T00:00:00Z',
      endDate: '2024-02-14T23:59:59Z'
    },
    createdAt: '2024-01-10T16:00:00Z',
    updatedAt: '2024-01-25T09:00:00Z',
    createdBy: 'David Park',
    tags: ['marketing', 'seasonal']
  },
  {
    id: 'flag-005',
    name: 'EU Data Residency',
    key: 'eu_data_residency',
    description: 'Store user data in EU-based servers for compliance',
    enabled: true,
    type: 'geo',
    environment: 'production',
    regions: ['EU', 'UK', 'CH'],
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-27T10:00:00Z',
    createdBy: 'Lisa Kim',
    tags: ['compliance', 'gdpr', 'infrastructure']
  },
  {
    id: 'flag-006',
    name: 'Beta API v3',
    key: 'api_v3_beta',
    description: 'Access to v3 API endpoints with improved performance',
    enabled: true,
    type: 'percentage',
    environment: 'all',
    rolloutPercentage: 25,
    createdAt: '2024-01-18T11:00:00Z',
    updatedAt: '2024-01-27T16:00:00Z',
    createdBy: 'Alex Rodriguez',
    tags: ['api', 'beta', 'performance']
  },
  {
    id: 'flag-007',
    name: 'A/B Test: Onboarding Flow',
    key: 'ab_onboarding_flow',
    description: 'Test new onboarding flow against control',
    enabled: true,
    type: 'percentage',
    environment: 'production',
    rolloutPercentage: 50,
    variants: [
      { name: 'Control', value: 'original', weight: 50 },
      { name: 'Variant A', value: 'simplified', weight: 25 },
      { name: 'Variant B', value: 'guided', weight: 25 }
    ],
    createdAt: '2024-01-24T13:00:00Z',
    updatedAt: '2024-01-27T08:00:00Z',
    createdBy: 'Sarah Chen',
    tags: ['experiment', 'onboarding', 'conversion']
  },
  {
    id: 'flag-008',
    name: 'Premium Analytics',
    key: 'premium_analytics',
    description: 'Advanced analytics features for enterprise users',
    enabled: true,
    type: 'user-segment',
    environment: 'production',
    targetUsers: 450,
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-26T15:00:00Z',
    createdBy: 'Mike Johnson',
    tags: ['premium', 'analytics', 'enterprise']
  }
];

const TYPE_CONFIG = {
  'boolean': { icon: ToggleLeft, label: 'Boolean', color: 'primary' },
  'percentage': { icon: Percent, label: 'Percentage', color: 'warning' },
  'user-segment': { icon: Users, label: 'User Segment', color: 'info' },
  'scheduled': { icon: Calendar, label: 'Scheduled', color: 'success' },
  'geo': { icon: Globe, label: 'Geographic', color: 'cyan' }
};

const ENV_CONFIG = {
  'production': { color: 'production', label: 'Production' },
  'staging': { color: 'staging', label: 'Staging' },
  'development': { color: 'development', label: 'Development' },
  'all': { color: 'all', label: 'All Environments' }
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState(FEATURE_FLAGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'experiments'>('all');
  const [expandedFlags, setExpandedFlags] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          flag.key.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'active') return matchesSearch && flag.enabled;
    if (activeTab === 'inactive') return matchesSearch && !flag.enabled;
    if (activeTab === 'experiments') return matchesSearch && flag.variants && flag.variants.length > 0;
    return matchesSearch;
  });

  const toggleFlag = (flagId: string) => {
    setFlags(prev => prev.map(flag => 
      flag.id === flagId ? { ...flag, enabled: !flag.enabled } : flag
    ));
  };

  const toggleExpanded = (flagId: string) => {
    setExpandedFlags(prev => 
      prev.includes(flagId) 
        ? prev.filter(id => id !== flagId)
        : [...prev, flagId]
    );
  };

  const stats = {
    total: flags.length,
    active: flags.filter(f => f.enabled).length,
    experiments: flags.filter(f => f.variants && f.variants.length > 0).length,
    rollouts: flags.filter(f => f.type === 'percentage').length
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="feature-flags">
      <header className="feature-flags__header">
        <div className="feature-flags__title-section">
          <div className="feature-flags__icon">
            <Flag size={28} />
          </div>
          <div>
            <h1>Feature Flags</h1>
            <p>Manage feature rollouts and experiments across environments</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <History size={16} />
            Audit Log
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create Flag
          </button>
        </div>
      </header>

      <div className="feature-flags__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Flag size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Flags</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <Zap size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon experiments">
            <Sparkles size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.experiments}</span>
            <span className="stat-label">Experiments</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rollouts">
            <Target size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.rollouts}</span>
            <span className="stat-label">Rollouts</span>
          </div>
        </div>
      </div>

      <div className="feature-flags__toolbar">
        <div className="feature-flags__tabs">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Flags
            <span className="tab-badge">{flags.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
            <span className="tab-badge success">{stats.active}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'inactive' ? 'active' : ''}`}
            onClick={() => setActiveTab('inactive')}
          >
            Inactive
            <span className="tab-badge">{flags.length - stats.active}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'experiments' ? 'active' : ''}`}
            onClick={() => setActiveTab('experiments')}
          >
            <Sparkles size={14} />
            Experiments
            <span className="tab-badge experiments">{stats.experiments}</span>
          </button>
        </div>

        <div className="feature-flags__filters">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search flags by name or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn-outline">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      <div className="flags-list">
        {filteredFlags.map(flag => {
          const TypeIcon = TYPE_CONFIG[flag.type].icon;
          const typeColor = TYPE_CONFIG[flag.type].color;
          const envConfig = ENV_CONFIG[flag.environment];
          const isExpanded = expandedFlags.includes(flag.id);

          return (
            <div key={flag.id} className={`flag-card ${flag.enabled ? 'enabled' : 'disabled'}`}>
              <div className="flag-main">
                <button 
                  className="expand-btn"
                  onClick={() => toggleExpanded(flag.id)}
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                <div className="flag-toggle">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={flag.enabled}
                      onChange={() => toggleFlag(flag.id)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="flag-info">
                  <div className="flag-header">
                    <h3>{flag.name}</h3>
                    <div className="flag-badges">
                      <span className={`type-badge ${typeColor}`}>
                        <TypeIcon size={12} />
                        {TYPE_CONFIG[flag.type].label}
                      </span>
                      <span className={`env-badge ${envConfig.color}`}>
                        {envConfig.label}
                      </span>
                    </div>
                  </div>
                  <div className="flag-key">
                    <Code size={12} />
                    <code>{flag.key}</code>
                    <button className="copy-btn" title="Copy key">
                      <Copy size={12} />
                    </button>
                  </div>
                  <p className="flag-description">{flag.description}</p>
                </div>

                <div className="flag-meta">
                  {flag.type === 'percentage' && flag.rolloutPercentage !== undefined && (
                    <div className="rollout-indicator">
                      <div className="rollout-bar">
                        <div 
                          className="rollout-fill" 
                          style={{ width: `${flag.rolloutPercentage}%` }}
                        />
                      </div>
                      <span>{flag.rolloutPercentage}%</span>
                    </div>
                  )}
                  {flag.type === 'user-segment' && flag.targetUsers && (
                    <div className="segment-indicator">
                      <Users size={14} />
                      <span>{flag.targetUsers.toLocaleString()} users</span>
                    </div>
                  )}
                  {flag.type === 'scheduled' && flag.schedule && (
                    <div className="schedule-indicator">
                      <Calendar size={14} />
                      <span>{formatDate(flag.schedule.startDate)}</span>
                    </div>
                  )}
                  {flag.type === 'geo' && flag.regions && (
                    <div className="geo-indicator">
                      <Globe size={14} />
                      <span>{flag.regions.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="flag-actions">
                  <button className="action-btn" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="action-btn" title="Analytics">
                    <BarChart3 size={16} />
                  </button>
                  <button className="action-btn" title="More">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="flag-details">
                  <div className="details-grid">
                    <div className="detail-section">
                      <h4>Configuration</h4>
                      <div className="detail-item">
                        <span className="label">Type</span>
                        <span className="value">{TYPE_CONFIG[flag.type].label}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Environment</span>
                        <span className="value">{envConfig.label}</span>
                      </div>
                      {flag.rolloutPercentage !== undefined && (
                        <div className="detail-item">
                          <span className="label">Rollout</span>
                          <span className="value">{flag.rolloutPercentage}%</span>
                        </div>
                      )}
                    </div>

                    <div className="detail-section">
                      <h4>Metadata</h4>
                      <div className="detail-item">
                        <span className="label">Created</span>
                        <span className="value">{formatDate(flag.createdAt)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Updated</span>
                        <span className="value">{formatDate(flag.updatedAt)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Created By</span>
                        <span className="value">{flag.createdBy}</span>
                      </div>
                    </div>

                    {flag.variants && flag.variants.length > 0 && (
                      <div className="detail-section variants-section">
                        <h4>Variants</h4>
                        <div className="variants-list">
                          {flag.variants.map((variant, index) => (
                            <div key={index} className="variant-item">
                              <span className="variant-name">{variant.name}</span>
                              <code className="variant-value">{variant.value}</code>
                              <span className="variant-weight">{variant.weight}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="detail-section tags-section">
                      <h4>Tags</h4>
                      <div className="tags-list">
                        {flag.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="detail-actions">
                    <button className="btn-outline">
                      <Settings size={14} />
                      Configure Rules
                    </button>
                    <button className="btn-outline">
                      <History size={14} />
                      View History
                    </button>
                    <button className="btn-outline danger">
                      <Trash2 size={14} />
                      Delete Flag
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredFlags.length === 0 && (
        <div className="empty-state">
          <Flag size={48} />
          <h3>No Flags Found</h3>
          <p>No feature flags match your search criteria</p>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Feature Flag</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Flag Name</label>
                <input type="text" placeholder="e.g., New Dashboard UI" />
              </div>
              <div className="form-group">
                <label>Key</label>
                <input type="text" placeholder="e.g., new_dashboard_ui" />
                <span className="helper-text">Used in code to reference this flag</span>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Describe what this flag controls..." rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select>
                    <option value="boolean">Boolean (On/Off)</option>
                    <option value="percentage">Percentage Rollout</option>
                    <option value="user-segment">User Segment</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="geo">Geographic</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Environment</label>
                  <select>
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                    <option value="all">All Environments</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tags</label>
                <input type="text" placeholder="Add tags separated by commas" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <Plus size={16} />
                Create Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
