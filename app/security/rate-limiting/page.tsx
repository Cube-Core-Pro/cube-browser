'use client';

import React, { useState } from 'react';
import { 
  Gauge, 
  Plus, 
  Search, 
  RefreshCw,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  Eye,
  MoreVertical,
  Globe,
  Users,
  Key,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Ban,
  Edit2,
  Trash2,
  ToggleLeft,
  ArrowUp,
  ArrowDown,
  Server,
  Filter
} from 'lucide-react';
import './rate-limiting.css';

interface RateLimitRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: 'global' | 'endpoint' | 'user' | 'ip' | 'api-key';
  target: string;
  limit: number;
  window: string;
  burst?: number;
  action: 'reject' | 'throttle' | 'queue' | 'delay';
  priority: number;
  currentUsage: number;
  blocked24h: number;
  createdAt: string;
  updatedAt: string;
}

interface RateLimitStats {
  totalRequests24h: number;
  blockedRequests24h: number;
  throttledRequests24h: number;
  avgResponseTime: number;
  peakRps: number;
  currentRps: number;
}

const RATE_LIMIT_RULES: RateLimitRule[] = [
  {
    id: 'rl-001',
    name: 'Global API Rate Limit',
    description: 'Default rate limit for all API endpoints',
    enabled: true,
    scope: 'global',
    target: '/api/*',
    limit: 1000,
    window: '1m',
    burst: 100,
    action: 'reject',
    priority: 1,
    currentUsage: 456,
    blocked24h: 234,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-27T10:00:00Z'
  },
  {
    id: 'rl-002',
    name: 'Authentication Endpoints',
    description: 'Strict rate limit for login and auth endpoints',
    enabled: true,
    scope: 'endpoint',
    target: '/api/auth/*',
    limit: 10,
    window: '1m',
    burst: 5,
    action: 'reject',
    priority: 10,
    currentUsage: 3,
    blocked24h: 89,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-27T09:00:00Z'
  },
  {
    id: 'rl-003',
    name: 'Free Tier User Limit',
    description: 'Rate limit for free tier users',
    enabled: true,
    scope: 'user',
    target: 'tier:free',
    limit: 100,
    window: '1h',
    action: 'throttle',
    priority: 5,
    currentUsage: 67,
    blocked24h: 156,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-26T15:00:00Z'
  },
  {
    id: 'rl-004',
    name: 'Premium API Keys',
    description: 'Higher rate limit for premium API keys',
    enabled: true,
    scope: 'api-key',
    target: 'plan:premium',
    limit: 10000,
    window: '1h',
    burst: 500,
    action: 'queue',
    priority: 3,
    currentUsage: 2345,
    blocked24h: 12,
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-27T08:00:00Z'
  },
  {
    id: 'rl-005',
    name: 'IP-Based Protection',
    description: 'Rate limit suspicious IP addresses',
    enabled: true,
    scope: 'ip',
    target: 'suspicious:true',
    limit: 50,
    window: '10m',
    action: 'reject',
    priority: 15,
    currentUsage: 23,
    blocked24h: 567,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-27T11:00:00Z'
  },
  {
    id: 'rl-006',
    name: 'Export API Limit',
    description: 'Rate limit for data export endpoints',
    enabled: false,
    scope: 'endpoint',
    target: '/api/export/*',
    limit: 5,
    window: '1h',
    action: 'delay',
    priority: 8,
    currentUsage: 0,
    blocked24h: 0,
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-25T12:00:00Z'
  },
  {
    id: 'rl-007',
    name: 'Webhook Delivery',
    description: 'Rate limit outgoing webhook requests',
    enabled: true,
    scope: 'endpoint',
    target: '/webhooks/*',
    limit: 100,
    window: '1m',
    burst: 20,
    action: 'queue',
    priority: 6,
    currentUsage: 45,
    blocked24h: 23,
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-27T07:00:00Z'
  }
];

const STATS: RateLimitStats = {
  totalRequests24h: 1245678,
  blockedRequests24h: 1081,
  throttledRequests24h: 3456,
  avgResponseTime: 145,
  peakRps: 2345,
  currentRps: 876
};

const SCOPE_CONFIG = {
  'global': { icon: Globe, color: 'primary', label: 'Global' },
  'endpoint': { icon: Server, color: 'info', label: 'Endpoint' },
  'user': { icon: Users, color: 'success', label: 'User' },
  'ip': { icon: Shield, color: 'warning', label: 'IP Address' },
  'api-key': { icon: Key, color: 'purple', label: 'API Key' }
};

const ACTION_CONFIG = {
  'reject': { color: 'danger', label: 'Reject (429)' },
  'throttle': { color: 'warning', label: 'Throttle' },
  'queue': { color: 'info', label: 'Queue' },
  'delay': { color: 'muted', label: 'Delay' }
};

export default function RateLimitingPage() {
  const [rules, setRules] = useState(RATE_LIMIT_RULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rule.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScope = selectedScope === 'all' || rule.scope === selectedScope;
    return matchesSearch && matchesScope;
  }).sort((a, b) => b.priority - a.priority);

  const activeRules = rules.filter(r => r.enabled).length;
  const totalBlocked = rules.reduce((sum, r) => sum + r.blocked24h, 0);

  return (
    <div className="rate-limiting">
      <header className="rate-limiting__header">
        <div className="rate-limiting__title-section">
          <div className="rate-limiting__icon">
            <Gauge size={28} />
          </div>
          <div>
            <h1>Rate Limiting</h1>
            <p>Configure and monitor API rate limits and quotas</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create Rule
          </button>
        </div>
      </header>

      <div className="rate-limiting__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Activity size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{(STATS.totalRequests24h / 1000000).toFixed(2)}M</span>
            <span className="stat-label">Requests (24h)</span>
          </div>
          <div className="stat-trend up">
            <TrendingUp size={14} />
            +12.5%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blocked">
            <Ban size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalBlocked.toLocaleString()}</span>
            <span className="stat-label">Blocked (24h)</span>
          </div>
          <div className="stat-trend down">
            <TrendingDown size={14} />
            -8.3%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rps">
            <Zap size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{STATS.currentRps}</span>
            <span className="stat-label">Current RPS</span>
          </div>
          <div className="stat-secondary">
            Peak: {STATS.peakRps}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rules">
            <Shield size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeRules}/{rules.length}</span>
            <span className="stat-label">Active Rules</span>
          </div>
        </div>
      </div>

      <div className="rate-limiting__filters">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="scope-filter">
          {['all', 'global', 'endpoint', 'user', 'ip', 'api-key'].map(scope => (
            <button
              key={scope}
              className={`scope-btn ${selectedScope === scope ? 'active' : ''}`}
              onClick={() => setSelectedScope(scope)}
            >
              {scope === 'all' ? 'All Scopes' : SCOPE_CONFIG[scope as keyof typeof SCOPE_CONFIG].label}
            </button>
          ))}
        </div>
      </div>

      <div className="rules-list">
        {filteredRules.map(rule => {
          const ScopeIcon = SCOPE_CONFIG[rule.scope].icon;
          const scopeColor = SCOPE_CONFIG[rule.scope].color;
          const actionConfig = ACTION_CONFIG[rule.action];
          const usagePercent = (rule.currentUsage / rule.limit) * 100;

          return (
            <div key={rule.id} className={`rule-card ${!rule.enabled ? 'disabled' : ''}`}>
              <div className="rule-toggle">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleRule(rule.id)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className={`rule-scope-icon ${scopeColor}`}>
                <ScopeIcon size={20} />
              </div>

              <div className="rule-info">
                <div className="rule-header">
                  <h3>{rule.name}</h3>
                  <div className="rule-badges">
                    <span className={`scope-badge ${scopeColor}`}>
                      {SCOPE_CONFIG[rule.scope].label}
                    </span>
                    <span className={`action-badge ${actionConfig.color}`}>
                      {actionConfig.label}
                    </span>
                    <span className="priority-badge">
                      P{rule.priority}
                    </span>
                  </div>
                </div>
                <p className="rule-description">{rule.description}</p>
                <div className="rule-target">
                  <code>{rule.target}</code>
                </div>
              </div>

              <div className="rule-limits">
                <div className="limit-display">
                  <span className="limit-value">{rule.limit.toLocaleString()}</span>
                  <span className="limit-label">/{rule.window}</span>
                </div>
                {rule.burst && (
                  <div className="burst-display">
                    <Zap size={12} />
                    Burst: {rule.burst}
                  </div>
                )}
              </div>

              <div className="rule-usage">
                <div className="usage-header">
                  <span className="usage-label">Current Usage</span>
                  <span className="usage-value">
                    {rule.currentUsage}/{rule.limit}
                  </span>
                </div>
                <div className="usage-bar">
                  <div 
                    className={`usage-fill ${usagePercent > 90 ? 'danger' : usagePercent > 70 ? 'warning' : 'success'}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                <div className="blocked-count">
                  <Ban size={12} />
                  {rule.blocked24h} blocked (24h)
                </div>
              </div>

              <div className="rule-actions">
                <button className="action-btn" title="View Analytics">
                  <Eye size={16} />
                </button>
                <button className="action-btn" title="Edit Rule">
                  <Edit2 size={16} />
                </button>
                <button className="action-btn" title="More Options">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRules.length === 0 && (
        <div className="empty-state">
          <Gauge size={48} />
          <h3>No Rules Found</h3>
          <p>No rate limit rules match your search criteria</p>
        </div>
      )}

      <div className="traffic-overview">
        <div className="traffic-header">
          <h2>Traffic Overview</h2>
          <div className="time-range">
            <button className="time-btn active">1h</button>
            <button className="time-btn">6h</button>
            <button className="time-btn">24h</button>
            <button className="time-btn">7d</button>
          </div>
        </div>
        <div className="traffic-chart-placeholder">
          <Activity size={48} />
          <p>Real-time traffic visualization</p>
          <span>Request rates and blocked traffic over time</span>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Rate Limit Rule</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Rule Name</label>
                <input type="text" placeholder="e.g., API Rate Limit" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Describe the purpose of this rule..." rows={2} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Scope</label>
                  <select>
                    <option value="global">Global</option>
                    <option value="endpoint">Endpoint</option>
                    <option value="user">User</option>
                    <option value="ip">IP Address</option>
                    <option value="api-key">API Key</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Action</label>
                  <select>
                    <option value="reject">Reject (429)</option>
                    <option value="throttle">Throttle</option>
                    <option value="queue">Queue</option>
                    <option value="delay">Delay</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Target</label>
                <input type="text" placeholder="e.g., /api/v1/* or user:premium" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Request Limit</label>
                  <input type="number" placeholder="1000" />
                </div>
                <div className="form-group">
                  <label>Time Window</label>
                  <select>
                    <option value="1s">1 second</option>
                    <option value="1m">1 minute</option>
                    <option value="5m">5 minutes</option>
                    <option value="1h">1 hour</option>
                    <option value="1d">1 day</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Burst Limit (Optional)</label>
                  <input type="number" placeholder="100" />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <input type="number" placeholder="1" min="1" max="100" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <Plus size={16} />
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
