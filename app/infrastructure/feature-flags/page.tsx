'use client';

import React, { useState } from 'react';
import {
  Flag,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Settings,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Users,
  Target,
  BarChart3,
  Percent,
  Globe,
  Smartphone,
  Monitor,
  Hash,
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Code,
  Zap,
  Shield,
  Beaker,
  Rocket,
  Layers,
  GitBranch,
  ToggleLeft,
  ToggleRight,
  Activity
} from 'lucide-react';
import './feature-flags.css';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: 'all' | 'production' | 'staging' | 'development';
  type: 'boolean' | 'percentage' | 'user-segment' | 'multivariate';
  rolloutPercentage?: number;
  targetUsers?: string[];
  targetSegments?: string[];
  variants?: { name: string; value: string; weight: number }[];
  category: 'feature' | 'experiment' | 'ops' | 'release';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  impressions: number;
  conversions: number;
  tags: string[];
}

interface Segment {
  id: string;
  name: string;
  description: string;
  conditions: SegmentCondition[];
  userCount: number;
  createdAt: string;
}

interface SegmentCondition {
  attribute: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than' | 'in';
  value: string | number | boolean | string[];
}

interface AuditLog {
  id: string;
  action: 'created' | 'updated' | 'enabled' | 'disabled' | 'deleted';
  flagKey: string;
  user: string;
  timestamp: string;
  changes?: string;
}

const FEATURE_FLAGS: FeatureFlag[] = [
  { id: 'ff-1', key: 'ai_assistant_v2', name: 'AI Assistant V2', description: 'New AI-powered assistant with GPT-5.2 integration for workflow automation', enabled: true, environment: 'all', type: 'percentage', rolloutPercentage: 75, category: 'feature', createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-28T09:30:00Z', createdBy: 'john.smith', impressions: 245680, conversions: 12450, tags: ['ai', 'core-feature', 'premium'] },
  { id: 'ff-2', key: 'new_dashboard_layout', name: 'New Dashboard Layout', description: 'Redesigned dashboard with improved metrics visualization and customizable widgets', enabled: true, environment: 'staging', type: 'boolean', category: 'feature', createdAt: '2025-01-20T14:00:00Z', updatedAt: '2025-01-27T16:45:00Z', createdBy: 'sarah.johnson', impressions: 8520, conversions: 680, tags: ['ui', 'dashboard'] },
  { id: 'ff-3', key: 'dark_mode_v2', name: 'Dark Mode V2', description: 'Enhanced dark mode with better contrast and custom color themes', enabled: true, environment: 'all', type: 'boolean', category: 'feature', createdAt: '2025-01-10T08:00:00Z', updatedAt: '2025-01-25T11:20:00Z', createdBy: 'mike.wilson', impressions: 489200, conversions: 156800, tags: ['ui', 'accessibility'] },
  { id: 'ff-4', key: 'pricing_experiment_jan', name: 'Pricing Experiment Jan', description: 'A/B test for new pricing tiers with different discount structures', enabled: true, environment: 'production', type: 'multivariate', variants: [{ name: 'Control', value: 'original', weight: 40 }, { name: 'Variant A', value: 'discount_20', weight: 30 }, { name: 'Variant B', value: 'discount_30', weight: 30 }], category: 'experiment', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-28T12:00:00Z', createdBy: 'emma.brown', impressions: 125400, conversions: 8920, tags: ['pricing', 'experiment', 'critical'] },
  { id: 'ff-5', key: 'beta_api_v3', name: 'Beta API V3', description: 'New API version with improved performance and additional endpoints', enabled: true, environment: 'development', type: 'user-segment', targetSegments: ['beta-testers', 'internal-team'], category: 'release', createdAt: '2025-01-22T09:00:00Z', updatedAt: '2025-01-28T08:15:00Z', createdBy: 'david.chen', impressions: 4520, conversions: 890, tags: ['api', 'beta', 'v3'] },
  { id: 'ff-6', key: 'maintenance_mode', name: 'Maintenance Mode', description: 'Enable system-wide maintenance mode with user notifications', enabled: false, environment: 'all', type: 'boolean', category: 'ops', createdAt: '2024-12-01T00:00:00Z', updatedAt: '2025-01-15T03:00:00Z', createdBy: 'ops-team', impressions: 0, conversions: 0, tags: ['ops', 'emergency'] },
  { id: 'ff-7', key: 'enhanced_security', name: 'Enhanced Security', description: 'Additional security layers including 2FA prompts and session validation', enabled: true, environment: 'production', type: 'percentage', rolloutPercentage: 100, category: 'ops', createdAt: '2025-01-05T12:00:00Z', updatedAt: '2025-01-26T14:30:00Z', createdBy: 'security-team', impressions: 892400, conversions: 892400, tags: ['security', 'critical'] },
  { id: 'ff-8', key: 'onboarding_flow_v3', name: 'Onboarding Flow V3', description: 'New user onboarding with interactive tutorials and progress tracking', enabled: true, environment: 'production', type: 'percentage', rolloutPercentage: 50, category: 'experiment', createdAt: '2025-01-18T10:00:00Z', updatedAt: '2025-01-28T07:00:00Z', createdBy: 'product-team', impressions: 35600, conversions: 15800, tags: ['onboarding', 'experiment', 'ux'] }
];

const SEGMENTS: Segment[] = [
  { id: 'seg-1', name: 'Beta Testers', description: 'Users who have opted into beta testing program', conditions: [{ attribute: 'user.beta_tester', operator: 'equals', value: true }], userCount: 1250, createdAt: '2024-11-15T10:00:00Z' },
  { id: 'seg-2', name: 'Premium Users', description: 'Users with active premium subscription', conditions: [{ attribute: 'subscription.tier', operator: 'in', value: ['pro', 'enterprise'] }], userCount: 8420, createdAt: '2024-10-01T08:00:00Z' },
  { id: 'seg-3', name: 'Internal Team', description: 'CUBE internal employees and contractors', conditions: [{ attribute: 'user.email', operator: 'contains', value: '@cube.io' }], userCount: 85, createdAt: '2024-09-01T00:00:00Z' },
  { id: 'seg-4', name: 'High-Value Users', description: 'Users with high engagement scores', conditions: [{ attribute: 'engagement.score', operator: 'greater-than', value: 80 }], userCount: 4560, createdAt: '2024-12-10T14:00:00Z' },
  { id: 'seg-5', name: 'Mobile Users', description: 'Users primarily accessing from mobile devices', conditions: [{ attribute: 'device.type', operator: 'in', value: ['ios', 'android'] }], userCount: 15200, createdAt: '2025-01-05T09:00:00Z' }
];

const AUDIT_LOGS: AuditLog[] = [
  { id: 'log-1', action: 'updated', flagKey: 'ai_assistant_v2', user: 'john.smith', timestamp: '2025-01-28T09:30:00Z', changes: 'Rollout increased from 50% to 75%' },
  { id: 'log-2', action: 'enabled', flagKey: 'enhanced_security', user: 'security-team', timestamp: '2025-01-28T08:15:00Z' },
  { id: 'log-3', action: 'created', flagKey: 'beta_api_v3', user: 'david.chen', timestamp: '2025-01-27T16:45:00Z' },
  { id: 'log-4', action: 'updated', flagKey: 'pricing_experiment_jan', user: 'emma.brown', timestamp: '2025-01-27T14:20:00Z', changes: 'Updated variant weights' },
  { id: 'log-5', action: 'disabled', flagKey: 'maintenance_mode', user: 'ops-team', timestamp: '2025-01-27T12:00:00Z' },
  { id: 'log-6', action: 'updated', flagKey: 'onboarding_flow_v3', user: 'product-team', timestamp: '2025-01-27T10:30:00Z', changes: 'Rollout increased to 50%' }
];

const FLAG_TYPE_CONFIG = {
  boolean: { color: 'blue', icon: ToggleLeft, label: 'Boolean' },
  percentage: { color: 'purple', icon: Percent, label: 'Percentage Rollout' },
  'user-segment': { color: 'teal', icon: Users, label: 'User Segment' },
  multivariate: { color: 'orange', icon: GitBranch, label: 'Multivariate' }
};

const CATEGORY_CONFIG = {
  feature: { color: 'primary', icon: Rocket, label: 'Feature' },
  experiment: { color: 'purple', icon: Beaker, label: 'Experiment' },
  ops: { color: 'orange', icon: Settings, label: 'Ops' },
  release: { color: 'teal', icon: Layers, label: 'Release' }
};

const ENVIRONMENT_CONFIG = {
  all: { color: 'success', label: 'All Environments' },
  production: { color: 'danger', label: 'Production' },
  staging: { color: 'warning', label: 'Staging' },
  development: { color: 'info', label: 'Development' }
};

const ACTION_CONFIG = {
  created: { color: 'success', icon: Plus },
  updated: { color: 'info', icon: RefreshCw },
  enabled: { color: 'success', icon: CheckCircle },
  disabled: { color: 'warning', icon: XCircle },
  deleted: { color: 'danger', icon: Trash2 }
};

export default function FeatureFlagsPage() {
  const [activeTab, setActiveTab] = useState<'flags' | 'segments' | 'audit'>('flags');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [expandedFlags, setExpandedFlags] = useState<Set<string>>(new Set());
  const [flagStates, setFlagStates] = useState<Record<string, boolean>>(
    Object.fromEntries(FEATURE_FLAGS.map(f => [f.id, f.enabled]))
  );

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

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedFlags);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFlags(newExpanded);
  };

  const toggleFlag = (id: string) => {
    setFlagStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredFlags = FEATURE_FLAGS.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         flag.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || flag.category === categoryFilter;
    const matchesEnvironment = environmentFilter === 'all' || flag.environment === environmentFilter || flag.environment === 'all';
    return matchesSearch && matchesCategory && matchesEnvironment;
  });

  const enabledFlags = FEATURE_FLAGS.filter(f => f.enabled).length;
  const experimentFlags = FEATURE_FLAGS.filter(f => f.category === 'experiment').length;
  const totalImpressions = FEATURE_FLAGS.reduce((sum, f) => sum + f.impressions, 0);

  return (
    <div className="feature-flags">
      <div className="feature-flags__header">
        <div className="feature-flags__title-section">
          <div className="feature-flags__icon">
            <Flag size={28} />
          </div>
          <div>
            <h1>Feature Flags</h1>
            <p>Control feature rollouts and experiments</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Code size={16} />
            SDK Docs
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Create Flag
          </button>
        </div>
      </div>

      <div className="feature-flags__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Flag size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{FEATURE_FLAGS.length}</span>
            <span className="stat-label">Total Flags</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon enabled">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{enabledFlags}</span>
            <span className="stat-label">Enabled</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon experiments">
            <Beaker size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{experimentFlags}</span>
            <span className="stat-label">Active Experiments</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon impressions">
            <Activity size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{(totalImpressions / 1000000).toFixed(1)}M</span>
            <span className="stat-label">Impressions</span>
          </div>
        </div>
      </div>

      <div className="feature-flags__tabs">
        <button 
          className={`tab-btn ${activeTab === 'flags' ? 'active' : ''}`}
          onClick={() => setActiveTab('flags')}
        >
          <Flag size={16} />
          Feature Flags
          <span className="tab-count">{FEATURE_FLAGS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'segments' ? 'active' : ''}`}
          onClick={() => setActiveTab('segments')}
        >
          <Users size={16} />
          Segments
          <span className="tab-count">{SEGMENTS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <Clock size={16} />
          Audit Log
        </button>
      </div>

      {activeTab === 'flags' && (
        <div className="flags-section">
          <div className="section-filters">
            <div className="search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search flags..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="feature">Feature</option>
              <option value="experiment">Experiment</option>
              <option value="ops">Ops</option>
              <option value="release">Release</option>
            </select>
            <select 
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value)}
            >
              <option value="all">All Environments</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>

          <div className="flags-list">
            {filteredFlags.map(flag => {
              const TypeConfig = FLAG_TYPE_CONFIG[flag.type];
              const TypeIcon = TypeConfig.icon;
              const CategoryConfig = CATEGORY_CONFIG[flag.category];
              const CategoryIcon = CategoryConfig.icon;
              const EnvConfig = ENVIRONMENT_CONFIG[flag.environment];
              const isExpanded = expandedFlags.has(flag.id);
              const isEnabled = flagStates[flag.id];
              const conversionRate = flag.impressions > 0 ? ((flag.conversions / flag.impressions) * 100).toFixed(1) : '0';

              return (
                <div key={flag.id} className={`flag-card ${isEnabled ? 'enabled' : 'disabled'}`}>
                  <div className="flag-main">
                    <div className="flag-toggle-col">
                      <button 
                        className={`toggle-btn ${isEnabled ? 'on' : 'off'}`}
                        onClick={() => toggleFlag(flag.id)}
                        title={isEnabled ? 'Disable flag' : 'Enable flag'}
                      >
                        {isEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                    </div>
                    
                    <div className="flag-info">
                      <div className="flag-header">
                        <div className="flag-name-row">
                          <h4>{flag.name}</h4>
                          <code className="flag-key">{flag.key}</code>
                        </div>
                        <div className="flag-badges">
                          <span className={`category-badge ${CategoryConfig.color}`}>
                            <CategoryIcon size={12} />
                            {CategoryConfig.label}
                          </span>
                          <span className={`type-badge ${TypeConfig.color}`}>
                            <TypeIcon size={12} />
                            {TypeConfig.label}
                          </span>
                          <span className={`env-badge ${EnvConfig.color}`}>
                            <Globe size={12} />
                            {EnvConfig.label}
                          </span>
                        </div>
                      </div>
                      <p className="flag-description">{flag.description}</p>
                      <div className="flag-meta">
                        <span><Calendar size={12} /> Updated {formatDate(flag.updatedAt)}</span>
                        <span><Users size={12} /> {flag.createdBy}</span>
                        {flag.tags.map(tag => (
                          <span key={tag} className="tag-chip">{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flag-stats">
                      {flag.type === 'percentage' && flag.rolloutPercentage !== undefined && (
                        <div className="rollout-indicator">
                          <div className="rollout-bar">
                            <div 
                              className="rollout-fill" 
                              style={{ width: `${flag.rolloutPercentage}%` }}
                            />
                          </div>
                          <span className="rollout-label">{flag.rolloutPercentage}% rollout</span>
                        </div>
                      )}
                      <div className="stat-mini">
                        <span className="stat-mini-value">{(flag.impressions / 1000).toFixed(0)}K</span>
                        <span className="stat-mini-label">Impressions</span>
                      </div>
                      <div className="stat-mini">
                        <span className="stat-mini-value">{conversionRate}%</span>
                        <span className="stat-mini-label">Conversion</span>
                      </div>
                    </div>

                    <div className="flag-actions">
                      <button 
                        className="expand-btn"
                        onClick={() => toggleExpanded(flag.id)}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <button className="action-btn" title="Copy Key">
                        <Copy size={14} />
                      </button>
                      <button className="action-btn" title="Settings">
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="flag-details">
                      <div className="details-grid">
                        <div className="detail-section">
                          <h5>Configuration</h5>
                          <div className="config-items">
                            <div className="config-item">
                              <span className="config-label">Flag Key:</span>
                              <code className="config-value">{flag.key}</code>
                            </div>
                            <div className="config-item">
                              <span className="config-label">Type:</span>
                              <span className="config-value">{TypeConfig.label}</span>
                            </div>
                            <div className="config-item">
                              <span className="config-label">Environment:</span>
                              <span className="config-value">{EnvConfig.label}</span>
                            </div>
                            {flag.rolloutPercentage !== undefined && (
                              <div className="config-item">
                                <span className="config-label">Rollout:</span>
                                <span className="config-value">{flag.rolloutPercentage}%</span>
                              </div>
                            )}
                            {flag.targetSegments && (
                              <div className="config-item">
                                <span className="config-label">Target Segments:</span>
                                <span className="config-value">{flag.targetSegments.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {flag.variants && (
                          <div className="detail-section">
                            <h5>Variants</h5>
                            <div className="variants-list">
                              {flag.variants.map((variant, idx) => (
                                <div key={idx} className="variant-item">
                                  <span className="variant-name">{variant.name}</span>
                                  <code className="variant-value">{variant.value}</code>
                                  <span className="variant-weight">{variant.weight}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="detail-section">
                          <h5>Performance</h5>
                          <div className="performance-stats">
                            <div className="perf-stat">
                              <span className="perf-value">{flag.impressions.toLocaleString()}</span>
                              <span className="perf-label">Total Impressions</span>
                            </div>
                            <div className="perf-stat">
                              <span className="perf-value">{flag.conversions.toLocaleString()}</span>
                              <span className="perf-label">Conversions</span>
                            </div>
                            <div className="perf-stat">
                              <span className="perf-value">{conversionRate}%</span>
                              <span className="perf-label">Conversion Rate</span>
                            </div>
                          </div>
                        </div>

                        <div className="detail-section">
                          <h5>Code Snippet</h5>
                          <div className="code-block">
                            <code>{`const isEnabled = await featureFlags.isEnabled('${flag.key}');

if (isEnabled) {
  // Feature enabled logic
}`}</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'segments' && (
        <div className="segments-section">
          <div className="section-header">
            <h3>User Segments ({SEGMENTS.length})</h3>
            <button className="btn-outline-sm">
              <Plus size={14} />
              Create Segment
            </button>
          </div>

          <div className="segments-grid">
            {SEGMENTS.map(segment => (
              <div key={segment.id} className="segment-card">
                <div className="segment-header">
                  <div className="segment-icon">
                    <Users size={20} />
                  </div>
                  <div className="segment-info">
                    <h4>{segment.name}</h4>
                    <p>{segment.description}</p>
                  </div>
                  <button className="action-btn">
                    <MoreHorizontal size={14} />
                  </button>
                </div>

                <div className="segment-conditions">
                  <h5>Conditions</h5>
                  <div className="conditions-list">
                    {segment.conditions.map((cond, idx) => (
                      <div key={idx} className="condition-item">
                        <code className="cond-attr">{cond.attribute}</code>
                        <span className="cond-op">{cond.operator.replace('-', ' ')}</span>
                        <code className="cond-value">
                          {Array.isArray(cond.value) ? cond.value.join(', ') : String(cond.value)}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="segment-footer">
                  <div className="segment-stat">
                    <Users size={14} />
                    <span>{segment.userCount.toLocaleString()} users</span>
                  </div>
                  <span className="segment-date">Created {formatDate(segment.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="audit-section">
          <div className="section-header">
            <h3>Audit Log</h3>
          </div>

          <div className="audit-table">
            <div className="at-header">
              <span className="at-th">Action</span>
              <span className="at-th">Flag</span>
              <span className="at-th">User</span>
              <span className="at-th">Changes</span>
              <span className="at-th">Time</span>
            </div>
            <div className="at-body">
              {AUDIT_LOGS.map(log => {
                const ActionConfig = ACTION_CONFIG[log.action];
                const ActionIcon = ActionConfig.icon;

                return (
                  <div key={log.id} className="at-row">
                    <span className="at-td action">
                      <span className={`action-chip ${ActionConfig.color}`}>
                        <ActionIcon size={12} />
                        {log.action}
                      </span>
                    </span>
                    <span className="at-td flag">
                      <code>{log.flagKey}</code>
                    </span>
                    <span className="at-td user">{log.user}</span>
                    <span className="at-td changes">{log.changes || '-'}</span>
                    <span className="at-td time">{formatDate(log.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
