'use client';

import React, { useState } from 'react';
import {
  Globe,
  Shield,
  MapPin,
  Ban,
  CheckCircle,
  AlertTriangle,
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  Upload,
  ChevronDown,
  ChevronRight,
  Activity,
  Clock,
  Users,
  Filter,
  X,
  Settings
} from 'lucide-react';
import './geo-blocking.css';

interface GeoRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'allow' | 'block';
  countries: string[];
  regions?: string[];
  exceptions: string[];
  action: 'block' | 'challenge' | 'monitor' | 'redirect';
  redirectUrl?: string;
  blockedRequests24h: number;
  lastTriggered: string | null;
  createdAt: string;
}

interface CountryData {
  code: string;
  name: string;
  region: string;
  status: 'allowed' | 'blocked' | 'monitored';
  requests24h: number;
  blockedRequests24h: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const COUNTRIES: CountryData[] = [
  { code: 'US', name: 'United States', region: 'North America', status: 'allowed', requests24h: 125430, blockedRequests24h: 234, riskLevel: 'low' },
  { code: 'GB', name: 'United Kingdom', region: 'Europe', status: 'allowed', requests24h: 45678, blockedRequests24h: 89, riskLevel: 'low' },
  { code: 'DE', name: 'Germany', region: 'Europe', status: 'allowed', requests24h: 38920, blockedRequests24h: 156, riskLevel: 'low' },
  { code: 'FR', name: 'France', region: 'Europe', status: 'allowed', requests24h: 28340, blockedRequests24h: 112, riskLevel: 'low' },
  { code: 'JP', name: 'Japan', region: 'Asia', status: 'allowed', requests24h: 34560, blockedRequests24h: 78, riskLevel: 'low' },
  { code: 'CN', name: 'China', region: 'Asia', status: 'monitored', requests24h: 156780, blockedRequests24h: 12340, riskLevel: 'high' },
  { code: 'RU', name: 'Russia', region: 'Europe', status: 'blocked', requests24h: 89450, blockedRequests24h: 87230, riskLevel: 'critical' },
  { code: 'KP', name: 'North Korea', region: 'Asia', status: 'blocked', requests24h: 1234, blockedRequests24h: 1234, riskLevel: 'critical' },
  { code: 'IR', name: 'Iran', region: 'Middle East', status: 'blocked', requests24h: 23450, blockedRequests24h: 23450, riskLevel: 'critical' },
  { code: 'BR', name: 'Brazil', region: 'South America', status: 'allowed', requests24h: 19870, blockedRequests24h: 345, riskLevel: 'medium' },
  { code: 'IN', name: 'India', region: 'Asia', status: 'allowed', requests24h: 67890, blockedRequests24h: 1230, riskLevel: 'medium' },
  { code: 'AU', name: 'Australia', region: 'Oceania', status: 'allowed', requests24h: 15670, blockedRequests24h: 45, riskLevel: 'low' },
];

const GEO_RULES: GeoRule[] = [
  {
    id: 'geo-1',
    name: 'OFAC Sanctions Compliance',
    description: 'Block traffic from OFAC sanctioned countries for regulatory compliance',
    enabled: true,
    type: 'block',
    countries: ['KP', 'IR', 'SY', 'CU'],
    exceptions: [],
    action: 'block',
    blockedRequests24h: 24567,
    lastTriggered: '2 minutes ago',
    createdAt: '2024-01-15'
  },
  {
    id: 'geo-2',
    name: 'High Risk Countries',
    description: 'Challenge traffic from high-risk countries with elevated threat levels',
    enabled: true,
    type: 'block',
    countries: ['RU', 'CN'],
    exceptions: ['verified-partners'],
    action: 'challenge',
    blockedRequests24h: 89340,
    lastTriggered: '30 seconds ago',
    createdAt: '2024-02-01'
  },
  {
    id: 'geo-3',
    name: 'EU Data Residency',
    description: 'Allow only EU countries for GDPR-compliant data processing',
    enabled: false,
    type: 'allow',
    countries: ['DE', 'FR', 'GB', 'IT', 'ES', 'NL', 'BE', 'AT', 'SE', 'DK', 'FI', 'IE', 'PT', 'GR', 'PL', 'CZ', 'RO', 'HU'],
    exceptions: ['internal-admins'],
    action: 'block',
    blockedRequests24h: 0,
    lastTriggered: null,
    createdAt: '2024-03-10'
  },
  {
    id: 'geo-4',
    name: 'Tor Exit Nodes',
    description: 'Monitor and log traffic from known Tor exit node countries',
    enabled: true,
    type: 'block',
    countries: ['XX'],
    regions: ['tor-network'],
    exceptions: [],
    action: 'monitor',
    blockedRequests24h: 3456,
    lastTriggered: '5 minutes ago',
    createdAt: '2024-01-20'
  },
];

const ACTION_CONFIG: Record<string, { color: string; label: string }> = {
  block: { color: 'danger', label: 'Block' },
  challenge: { color: 'warning', label: 'Challenge' },
  monitor: { color: 'info', label: 'Monitor' },
  redirect: { color: 'muted', label: 'Redirect' }
};

const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: 'success', label: 'Low' },
  medium: { color: 'warning', label: 'Medium' },
  high: { color: 'danger', label: 'High' },
  critical: { color: 'critical', label: 'Critical' }
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  allowed: { color: 'success', label: 'Allowed' },
  blocked: { color: 'danger', label: 'Blocked' },
  monitored: { color: 'warning', label: 'Monitored' }
};

const REGIONS = ['All Regions', 'North America', 'South America', 'Europe', 'Asia', 'Middle East', 'Africa', 'Oceania'];

export default function GeoBlockingPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'countries' | 'analytics'>('rules');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [rules, setRules] = useState<GeoRule[]>(GEO_RULES);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const totalBlocked24h = COUNTRIES.reduce((acc, c) => acc + c.blockedRequests24h, 0);
  const totalRequests24h = COUNTRIES.reduce((acc, c) => acc + c.requests24h, 0);
  const blockedCountries = COUNTRIES.filter(c => c.status === 'blocked').length;
  const activeRules = rules.filter(r => r.enabled).length;

  const filteredCountries = COUNTRIES.filter(country => {
    const matchesSearch = country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         country.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'All Regions' || country.region === selectedRegion;
    const matchesStatus = selectedStatus === 'all' || country.status === selectedStatus;
    return matchesSearch && matchesRegion && matchesStatus;
  });

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="geo-blocking">
      <header className="geo-blocking__header">
        <div className="geo-blocking__title-section">
          <div className="geo-blocking__icon">
            <Globe size={28} />
          </div>
          <div>
            <h1>Geo-Blocking</h1>
            <p>Geographic access control and regional traffic management</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export Rules
          </button>
          <button className="btn-outline">
            <Upload size={16} />
            Import
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create Rule
          </button>
        </div>
      </header>

      <div className="geo-blocking__stats">
        <div className="stat-card">
          <div className="stat-icon blocked">
            <Ban size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(totalBlocked24h)}</span>
            <span className="stat-label">Blocked Requests (24h)</span>
          </div>
          <span className="stat-trend up">+12.4%</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon total">
            <Activity size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(totalRequests24h)}</span>
            <span className="stat-label">Total Requests (24h)</span>
          </div>
          <span className="stat-trend up">+8.2%</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon countries">
            <MapPin size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{blockedCountries}</span>
            <span className="stat-label">Blocked Countries</span>
          </div>
          <span className="stat-secondary">of {COUNTRIES.length} monitored</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon rules">
            <Shield size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeRules}</span>
            <span className="stat-label">Active Rules</span>
          </div>
          <span className="stat-secondary">{rules.length} total rules</span>
        </div>
      </div>

      <div className="geo-blocking__tabs">
        <button
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Shield size={16} />
          Geo Rules
        </button>
        <button
          className={`tab-btn ${activeTab === 'countries' ? 'active' : ''}`}
          onClick={() => setActiveTab('countries')}
        >
          <Globe size={16} />
          Countries
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <Activity size={16} />
          Analytics
        </button>
      </div>

      {activeTab === 'rules' && (
        <div className="rules-section">
          <div className="rules-list">
            {rules.map(rule => (
              <div key={rule.id} className={`rule-card ${!rule.enabled ? 'disabled' : ''}`}>
                <div className="rule-main">
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
                  <div className={`rule-type-icon ${rule.type}`}>
                    {rule.type === 'allow' ? <CheckCircle size={20} /> : <Ban size={20} />}
                  </div>
                  <div className="rule-info">
                    <div className="rule-header">
                      <h3>{rule.name}</h3>
                      <div className="rule-badges">
                        <span className={`type-badge ${rule.type}`}>
                          {rule.type === 'allow' ? 'Allow List' : 'Block List'}
                        </span>
                        <span className={`action-badge ${ACTION_CONFIG[rule.action].color}`}>
                          {ACTION_CONFIG[rule.action].label}
                        </span>
                      </div>
                    </div>
                    <p className="rule-description">{rule.description}</p>
                    <div className="rule-meta">
                      <span className="countries-count">
                        <MapPin size={12} />
                        {rule.countries.length} countries
                      </span>
                      {rule.exceptions.length > 0 && (
                        <span className="exceptions-count">
                          <Users size={12} />
                          {rule.exceptions.length} exceptions
                        </span>
                      )}
                      <span className="last-triggered">
                        <Clock size={12} />
                        {rule.lastTriggered || 'Never triggered'}
                      </span>
                    </div>
                  </div>
                  <div className="rule-stats">
                    <div className="blocked-stat">
                      <span className="blocked-value">{formatNumber(rule.blockedRequests24h)}</span>
                      <span className="blocked-label">Blocked (24h)</span>
                    </div>
                  </div>
                  <div className="rule-actions">
                    <button
                      className="expand-btn"
                      onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                    >
                      {expandedRule === rule.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    <button className="action-btn">
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {expandedRule === rule.id && (
                  <div className="rule-expanded">
                    <div className="expanded-section">
                      <h4>Countries</h4>
                      <div className="country-tags">
                        {rule.countries.map(code => (
                          <span key={code} className="country-tag">{code}</span>
                        ))}
                      </div>
                    </div>
                    {rule.exceptions.length > 0 && (
                      <div className="expanded-section">
                        <h4>Exceptions</h4>
                        <div className="exception-tags">
                          {rule.exceptions.map(exc => (
                            <span key={exc} className="exception-tag">{exc}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="expanded-section">
                      <h4>Created</h4>
                      <span className="created-date">{rule.createdAt}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'countries' && (
        <div className="countries-section">
          <div className="countries-filters">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                className="region-select"
              >
                {REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div className="status-filter">
              {['all', 'allowed', 'blocked', 'monitored'].map(status => (
                <button
                  key={status}
                  className={`status-btn ${selectedStatus === status ? 'active' : ''}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status === 'all' ? 'All' : STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
          </div>

          <div className="countries-table">
            <div className="table-header">
              <div className="col-country">Country</div>
              <div className="col-region">Region</div>
              <div className="col-status">Status</div>
              <div className="col-requests">Requests (24h)</div>
              <div className="col-blocked">Blocked</div>
              <div className="col-risk">Risk Level</div>
              <div className="col-actions">Actions</div>
            </div>
            <div className="table-body">
              {filteredCountries.map(country => (
                <div key={country.code} className="table-row">
                  <div className="col-country">
                    <span className="country-flag">{country.code}</span>
                    <span className="country-name">{country.name}</span>
                  </div>
                  <div className="col-region">{country.region}</div>
                  <div className="col-status">
                    <span className={`status-badge ${STATUS_CONFIG[country.status].color}`}>
                      {STATUS_CONFIG[country.status].label}
                    </span>
                  </div>
                  <div className="col-requests">{formatNumber(country.requests24h)}</div>
                  <div className="col-blocked">
                    <span className="blocked-count">{formatNumber(country.blockedRequests24h)}</span>
                  </div>
                  <div className="col-risk">
                    <span className={`risk-badge ${RISK_CONFIG[country.riskLevel].color}`}>
                      {RISK_CONFIG[country.riskLevel].label}
                    </span>
                  </div>
                  <div className="col-actions">
                    <button className="action-btn" title="Settings">
                      <Settings size={14} />
                    </button>
                    <button className="action-btn" title="Block">
                      <Ban size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <div className="analytics-grid">
            <div className="analytics-card large">
              <div className="analytics-header">
                <h3>Geographic Traffic Distribution</h3>
                <div className="time-range">
                  {['1h', '24h', '7d', '30d'].map(range => (
                    <button key={range} className={`time-btn ${range === '24h' ? 'active' : ''}`}>
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <div className="map-placeholder">
                <Globe size={48} />
                <p>Interactive World Map</p>
                <span>Geographic traffic visualization with heat maps</span>
              </div>
            </div>
            <div className="analytics-card">
              <h3>Top Blocked Countries</h3>
              <div className="blocked-list">
                {COUNTRIES
                  .filter(c => c.status === 'blocked')
                  .sort((a, b) => b.blockedRequests24h - a.blockedRequests24h)
                  .slice(0, 5)
                  .map((country, idx) => (
                    <div key={country.code} className="blocked-item">
                      <span className="rank">#{idx + 1}</span>
                      <span className="country-code">{country.code}</span>
                      <span className="country-name">{country.name}</span>
                      <span className="blocked-value">{formatNumber(country.blockedRequests24h)}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="analytics-card">
              <h3>Regional Breakdown</h3>
              <div className="region-list">
                {['North America', 'Europe', 'Asia', 'South America', 'Oceania'].map(region => {
                  const regionCountries = COUNTRIES.filter(c => c.region === region);
                  const regionRequests = regionCountries.reduce((acc, c) => acc + c.requests24h, 0);
                  const percentage = ((regionRequests / totalRequests24h) * 100).toFixed(1);
                  return (
                    <div key={region} className="region-item">
                      <div className="region-info">
                        <span className="region-name">{region}</span>
                        <span className="region-percent">{percentage}%</span>
                      </div>
                      <div className="region-bar">
                        <div
                          className="region-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="region-count">{formatNumber(regionRequests)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Geo Rule</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Rule Name</label>
                <input type="text" placeholder="e.g., EU Only Access" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Describe the purpose of this rule..." rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Rule Type</label>
                  <select>
                    <option value="block">Block List</option>
                    <option value="allow">Allow List</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Action</label>
                  <select>
                    <option value="block">Block</option>
                    <option value="challenge">Challenge</option>
                    <option value="monitor">Monitor Only</option>
                    <option value="redirect">Redirect</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Countries</label>
                <input type="text" placeholder="Enter country codes (e.g., US, GB, DE)" />
                <span className="form-hint">Comma-separated ISO 3166-1 alpha-2 country codes</span>
              </div>
              <div className="form-group">
                <label>Exceptions (Optional)</label>
                <input type="text" placeholder="e.g., admin-users, verified-partners" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
