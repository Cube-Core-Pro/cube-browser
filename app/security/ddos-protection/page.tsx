'use client';

import React, { useState } from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Globe,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  Settings,
  Eye,
  Ban,
  Filter,
  Zap,
  Server,
  MapPin,
  BarChart3,
  Lock,
  Unlock,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Plus,
  Search,
  Download,
  Target,
  Layers,
  Wifi,
  WifiOff
} from 'lucide-react';
import './ddos-protection.css';

interface AttackEvent {
  id: string;
  type: 'volumetric' | 'protocol' | 'application' | 'amplification';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'mitigated' | 'blocked';
  sourceIPs: number;
  peakTraffic: string;
  duration: string;
  startTime: string;
  targetService: string;
  mitigationRule: string | null;
}

interface ProtectionRule {
  id: string;
  name: string;
  type: 'rate-limit' | 'geo-block' | 'ip-reputation' | 'challenge' | 'custom';
  status: 'active' | 'inactive' | 'testing';
  triggeredCount24h: number;
  action: 'block' | 'challenge' | 'log' | 'rate-limit';
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  lastTriggered: string | null;
  description: string;
}

interface TrafficMetric {
  label: string;
  current: string;
  peak: string;
  baseline: string;
  status: 'normal' | 'elevated' | 'attack';
}

const ATTACK_EVENTS: AttackEvent[] = [
  {
    id: '1',
    type: 'volumetric',
    severity: 'critical',
    status: 'mitigated',
    sourceIPs: 45892,
    peakTraffic: '128 Gbps',
    duration: '2h 34m',
    startTime: '14:23 UTC',
    targetService: 'api.cube-elite.com',
    mitigationRule: 'Auto-Scale + Rate Limit'
  },
  {
    id: '2',
    type: 'application',
    severity: 'high',
    status: 'active',
    sourceIPs: 1234,
    peakTraffic: '2.4M req/s',
    duration: '12m',
    startTime: '16:45 UTC',
    targetService: '/api/v1/auth/login',
    mitigationRule: 'JS Challenge Active'
  },
  {
    id: '3',
    type: 'protocol',
    severity: 'medium',
    status: 'blocked',
    sourceIPs: 567,
    peakTraffic: '45 Gbps',
    duration: '5m',
    startTime: '09:12 UTC',
    targetService: 'TCP/443',
    mitigationRule: 'SYN Flood Protection'
  },
  {
    id: '4',
    type: 'amplification',
    severity: 'high',
    status: 'mitigated',
    sourceIPs: 8923,
    peakTraffic: '89 Gbps',
    duration: '45m',
    startTime: 'Yesterday 22:15',
    targetService: 'DNS/UDP',
    mitigationRule: 'Reflection Filter'
  }
];

const PROTECTION_RULES: ProtectionRule[] = [
  {
    id: '1',
    name: 'Global Rate Limiting',
    type: 'rate-limit',
    status: 'active',
    triggeredCount24h: 15234,
    action: 'rate-limit',
    sensitivity: 'medium',
    lastTriggered: '2 min ago',
    description: 'Limits requests per IP to 1000/min globally'
  },
  {
    id: '2',
    name: 'Bot Challenge',
    type: 'challenge',
    status: 'active',
    triggeredCount24h: 8945,
    action: 'challenge',
    sensitivity: 'high',
    lastTriggered: '30 sec ago',
    description: 'JavaScript challenge for suspicious traffic patterns'
  },
  {
    id: '3',
    name: 'High-Risk Countries',
    type: 'geo-block',
    status: 'active',
    triggeredCount24h: 4521,
    action: 'block',
    sensitivity: 'high',
    lastTriggered: '5 min ago',
    description: 'Blocks traffic from sanctioned regions'
  },
  {
    id: '4',
    name: 'IP Reputation Filter',
    type: 'ip-reputation',
    status: 'active',
    triggeredCount24h: 23456,
    action: 'block',
    sensitivity: 'critical',
    lastTriggered: '10 sec ago',
    description: 'Blocks known malicious IPs and botnets'
  },
  {
    id: '5',
    name: 'Login Endpoint Protection',
    type: 'rate-limit',
    status: 'active',
    triggeredCount24h: 3421,
    action: 'challenge',
    sensitivity: 'critical',
    lastTriggered: '1 min ago',
    description: 'Extra protection for /auth/login endpoint'
  },
  {
    id: '6',
    name: 'Tor Exit Node Filter',
    type: 'custom',
    status: 'testing',
    triggeredCount24h: 234,
    action: 'log',
    sensitivity: 'medium',
    lastTriggered: '15 min ago',
    description: 'Monitors traffic from Tor exit nodes'
  }
];

const TRAFFIC_METRICS: TrafficMetric[] = [
  { label: 'Requests/sec', current: '45,234', peak: '128,456', baseline: '42,000', status: 'elevated' },
  { label: 'Bandwidth', current: '12.4 Gbps', peak: '128 Gbps', baseline: '8.5 Gbps', status: 'normal' },
  { label: 'Connections', current: '89,234', peak: '245,000', baseline: '75,000', status: 'normal' },
  { label: 'Error Rate', current: '0.08%', peak: '2.4%', baseline: '0.02%', status: 'elevated' }
];

const ATTACK_TYPE_CONFIG = {
  volumetric: { color: 'danger', label: 'Volumetric', icon: Wifi },
  protocol: { color: 'warning', label: 'Protocol', icon: Server },
  application: { color: 'purple', label: 'Application', icon: Globe },
  amplification: { color: 'info', label: 'Amplification', icon: TrendingUp }
};

const SEVERITY_CONFIG = {
  critical: { color: 'danger', label: 'Critical' },
  high: { color: 'warning', label: 'High' },
  medium: { color: 'info', label: 'Medium' },
  low: { color: 'muted', label: 'Low' }
};

const STATUS_CONFIG = {
  active: { color: 'danger', label: 'Active', icon: AlertCircle },
  mitigated: { color: 'success', label: 'Mitigated', icon: CheckCircle },
  blocked: { color: 'info', label: 'Blocked', icon: Ban }
};

const RULE_TYPE_CONFIG = {
  'rate-limit': { color: 'warning', label: 'Rate Limit' },
  'geo-block': { color: 'info', label: 'Geo Block' },
  'ip-reputation': { color: 'danger', label: 'IP Reputation' },
  'challenge': { color: 'purple', label: 'Challenge' },
  'custom': { color: 'cyan', label: 'Custom' }
};

export default function DDoSProtectionPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'attacks' | 'rules' | 'analytics'>('overview');
  const [protectionLevel, setProtectionLevel] = useState<'standard' | 'high' | 'under-attack'>('high');
  const [expandedAttack, setExpandedAttack] = useState<string | null>(null);

  const activeAttacks = ATTACK_EVENTS.filter(a => a.status === 'active').length;
  const mitigatedToday = ATTACK_EVENTS.filter(a => a.status === 'mitigated').length;
  const blockedRequests24h = '2.4M';
  const threatScore = activeAttacks > 0 ? 'Elevated' : 'Normal';

  const renderOverview = () => (
    <div className="overview-section">
      <div className="protection-status">
        <div className="status-card main-status">
          <div className="status-indicator-large">
            <Shield size={48} />
            <div className="pulse-ring"></div>
          </div>
          <div className="status-info">
            <h2>Protection Active</h2>
            <p>All systems monitored and protected</p>
            <div className="protection-level">
              <span>Protection Level:</span>
              <div className="level-selector">
                <button 
                  className={`level-btn ${protectionLevel === 'standard' ? 'active' : ''}`}
                  onClick={() => setProtectionLevel('standard')}
                >
                  Standard
                </button>
                <button 
                  className={`level-btn ${protectionLevel === 'high' ? 'active' : ''}`}
                  onClick={() => setProtectionLevel('high')}
                >
                  High
                </button>
                <button 
                  className={`level-btn under-attack ${protectionLevel === 'under-attack' ? 'active' : ''}`}
                  onClick={() => setProtectionLevel('under-attack')}
                >
                  Under Attack
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="quick-stats">
          <div className={`quick-stat ${activeAttacks > 0 ? 'alert' : ''}`}>
            <AlertTriangle size={20} />
            <div className="quick-stat-info">
              <span className="quick-stat-value">{activeAttacks}</span>
              <span className="quick-stat-label">Active Threats</span>
            </div>
          </div>
          <div className="quick-stat">
            <CheckCircle size={20} />
            <div className="quick-stat-info">
              <span className="quick-stat-value">{mitigatedToday}</span>
              <span className="quick-stat-label">Mitigated Today</span>
            </div>
          </div>
          <div className="quick-stat">
            <Ban size={20} />
            <div className="quick-stat-info">
              <span className="quick-stat-value">{blockedRequests24h}</span>
              <span className="quick-stat-label">Blocked (24h)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="traffic-overview">
        <h3>Traffic Metrics</h3>
        <div className="metrics-grid">
          {TRAFFIC_METRICS.map((metric, i) => (
            <div key={i} className={`metric-card ${metric.status}`}>
              <div className="metric-header">
                <span className="metric-label">{metric.label}</span>
                <span className={`metric-status ${metric.status}`}>
                  {metric.status === 'normal' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  {metric.status}
                </span>
              </div>
              <div className="metric-value">{metric.current}</div>
              <div className="metric-details">
                <span>Peak: {metric.peak}</span>
                <span>Baseline: {metric.baseline}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeAttacks > 0 && (
        <div className="active-attack-alert">
          <div className="alert-header">
            <AlertCircle size={24} />
            <h3>Active Attack Detected</h3>
          </div>
          <div className="alert-content">
            {ATTACK_EVENTS.filter(a => a.status === 'active').map(attack => (
              <div key={attack.id} className="attack-summary">
                <span className="attack-type">{ATTACK_TYPE_CONFIG[attack.type].label}</span>
                <span className="attack-target">{attack.targetService}</span>
                <span className="attack-traffic">{attack.peakTraffic}</span>
                <span className="attack-duration">{attack.duration}</span>
                <button className="btn-sm danger">
                  <Eye size={14} />
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {ATTACK_EVENTS.slice(0, 3).map(attack => {
            const statusConfig = STATUS_CONFIG[attack.status];
            const StatusIcon = statusConfig.icon;
            
            return (
              <div key={attack.id} className={`activity-item ${attack.status}`}>
                <div className="activity-icon">
                  <StatusIcon size={18} />
                </div>
                <div className="activity-info">
                  <span className="activity-title">
                    {ATTACK_TYPE_CONFIG[attack.type].label} attack on {attack.targetService}
                  </span>
                  <span className="activity-time">{attack.startTime} - {attack.duration}</span>
                </div>
                <span className={`activity-status ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderAttacks = () => (
    <div className="attacks-section">
      <div className="attacks-header">
        <h3>Attack History</h3>
        <div className="attacks-filters">
          <select defaultValue="all">
            <option value="all">All Types</option>
            <option value="volumetric">Volumetric</option>
            <option value="protocol">Protocol</option>
            <option value="application">Application</option>
            <option value="amplification">Amplification</option>
          </select>
          <select defaultValue="24h">
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="attacks-list">
        {ATTACK_EVENTS.map(attack => {
          const typeConfig = ATTACK_TYPE_CONFIG[attack.type];
          const TypeIcon = typeConfig.icon;
          const severityConfig = SEVERITY_CONFIG[attack.severity];
          const statusConfig = STATUS_CONFIG[attack.status];
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedAttack === attack.id;

          return (
            <div key={attack.id} className={`attack-card ${attack.status}`}>
              <div className="attack-main">
                <div className="attack-type-indicator">
                  <div className={`type-icon ${typeConfig.color}`}>
                    <TypeIcon size={20} />
                  </div>
                </div>

                <div className="attack-info">
                  <div className="attack-header">
                    <h4>{typeConfig.label} Attack</h4>
                    <span className={`severity-badge ${severityConfig.color}`}>
                      {severityConfig.label}
                    </span>
                    <span className={`status-badge ${statusConfig.color}`}>
                      <StatusIcon size={12} />
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="attack-meta">
                    <span className="target">
                      <Target size={12} />
                      {attack.targetService}
                    </span>
                    <span className="time">
                      <Clock size={12} />
                      {attack.startTime}
                    </span>
                    <span className="duration">
                      Duration: {attack.duration}
                    </span>
                  </div>
                </div>

                <div className="attack-metrics">
                  <div className="metric">
                    <span className="metric-value">{attack.peakTraffic}</span>
                    <span className="metric-label">Peak Traffic</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{attack.sourceIPs.toLocaleString()}</span>
                    <span className="metric-label">Source IPs</span>
                  </div>
                </div>

                <div className="attack-actions">
                  <button 
                    className="expand-btn"
                    onClick={() => setExpandedAttack(isExpanded ? null : attack.id)}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="attack-expanded">
                  <div className="expanded-grid">
                    <div className="expanded-section">
                      <h5>Mitigation Applied</h5>
                      <p>{attack.mitigationRule || 'Automatic detection'}</p>
                    </div>
                    <div className="expanded-section">
                      <h5>Attack Vector</h5>
                      <p>
                        {attack.type === 'volumetric' && 'High volume UDP/TCP flood from distributed sources'}
                        {attack.type === 'application' && 'Layer 7 HTTP/HTTPS request flood'}
                        {attack.type === 'protocol' && 'TCP SYN/ACK flood or ICMP attacks'}
                        {attack.type === 'amplification' && 'DNS/NTP/Memcached reflection attack'}
                      </p>
                    </div>
                  </div>
                  <div className="expanded-actions">
                    <button className="btn-sm">
                      <BarChart3 size={14} />
                      View Analytics
                    </button>
                    <button className="btn-sm">
                      <MapPin size={14} />
                      Source Map
                    </button>
                    <button className="btn-sm">
                      <Download size={14} />
                      Export Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRules = () => (
    <div className="rules-section">
      <div className="rules-header">
        <h3>Protection Rules</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Add Rule
        </button>
      </div>

      <div className="rules-list">
        {PROTECTION_RULES.map(rule => {
          const typeConfig = RULE_TYPE_CONFIG[rule.type];

          return (
            <div key={rule.id} className={`rule-card ${rule.status}`}>
              <div className="rule-main">
                <div className="rule-toggle">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={rule.status === 'active'}
                      onChange={() => {}}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="rule-info">
                  <div className="rule-header">
                    <h4>{rule.name}</h4>
                    <span className={`type-badge ${typeConfig.color}`}>{typeConfig.label}</span>
                    {rule.status === 'testing' && (
                      <span className="testing-badge">Testing</span>
                    )}
                  </div>
                  <p className="rule-description">{rule.description}</p>
                </div>

                <div className="rule-stats">
                  <div className="rule-stat">
                    <span className="stat-value">{rule.triggeredCount24h.toLocaleString()}</span>
                    <span className="stat-label">Triggered (24h)</span>
                  </div>
                  <div className="rule-stat">
                    <span className="stat-value capitalize">{rule.action}</span>
                    <span className="stat-label">Action</span>
                  </div>
                  <div className="rule-stat">
                    <span className={`stat-value sensitivity-${rule.sensitivity}`}>
                      {rule.sensitivity}
                    </span>
                    <span className="stat-label">Sensitivity</span>
                  </div>
                </div>

                <div className="rule-last-triggered">
                  {rule.lastTriggered ? (
                    <span className="triggered">{rule.lastTriggered}</span>
                  ) : (
                    <span className="never">Never triggered</span>
                  )}
                </div>

                <div className="rule-actions">
                  <button className="action-btn" title="Configure">
                    <Settings size={16} />
                  </button>
                  <button className="action-btn" title="More">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-header">
        <h3>Attack Analytics</h3>
        <select defaultValue="7d">
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Attack Distribution by Type</h4>
          <div className="chart-placeholder">
            <BarChart3 size={48} />
            <p>Attack type distribution chart</p>
          </div>
          <div className="legend-list">
            {Object.entries(ATTACK_TYPE_CONFIG).map(([key, config]) => (
              <div key={key} className="legend-item">
                <span className={`legend-color ${config.color}`}></span>
                <span className="legend-label">{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h4>Geographic Attack Sources</h4>
          <div className="chart-placeholder">
            <Globe size={48} />
            <p>World map visualization</p>
          </div>
          <div className="top-countries">
            {[
              { country: 'China', percentage: 32 },
              { country: 'Russia', percentage: 24 },
              { country: 'United States', percentage: 15 },
              { country: 'Brazil', percentage: 12 },
              { country: 'India', percentage: 8 }
            ].map((item, i) => (
              <div key={i} className="country-item">
                <span className="country-rank">{i + 1}</span>
                <span className="country-name">{item.country}</span>
                <div className="country-bar">
                  <div className="country-fill" style={{ width: `${item.percentage}%` }}></div>
                </div>
                <span className="country-percentage">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="summary-stats">
        <div className="summary-card">
          <div className="summary-icon attacks">
            <AlertTriangle size={24} />
          </div>
          <div className="summary-info">
            <span className="summary-value">47</span>
            <span className="summary-label">Total Attacks</span>
          </div>
          <div className="summary-trend positive">
            <TrendingDown size={14} />
            -12% vs prev period
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon blocked">
            <Ban size={24} />
          </div>
          <div className="summary-info">
            <span className="summary-value">18.5M</span>
            <span className="summary-label">Requests Blocked</span>
          </div>
          <div className="summary-trend negative">
            <TrendingUp size={14} />
            +8% vs prev period
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon mitigated">
            <Shield size={24} />
          </div>
          <div className="summary-info">
            <span className="summary-value">99.97%</span>
            <span className="summary-label">Mitigation Rate</span>
          </div>
          <div className="summary-trend neutral">
            Stable
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon response">
            <Clock size={24} />
          </div>
          <div className="summary-info">
            <span className="summary-value">2.3s</span>
            <span className="summary-label">Avg Response Time</span>
          </div>
          <div className="summary-trend positive">
            <TrendingDown size={14} />
            -0.5s vs prev period
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ddos-protection">
      <div className="ddos-protection__header">
        <div className="ddos-protection__title-section">
          <div className="ddos-protection__icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>DDoS Protection</h1>
            <p>Real-time threat detection and mitigation</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      <div className="ddos-protection__stats">
        <div className={`stat-card ${activeAttacks > 0 ? 'alert' : 'safe'}`}>
          <div className="stat-icon">
            {activeAttacks > 0 ? <AlertCircle size={24} /> : <Shield size={24} />}
          </div>
          <div className="stat-content">
            <span className="stat-value">{threatScore}</span>
            <span className="stat-label">Threat Level</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon attacks">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeAttacks}</span>
            <span className="stat-label">Active Attacks</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon mitigated">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{mitigatedToday}</span>
            <span className="stat-label">Mitigated Today</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blocked">
            <Ban size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{blockedRequests24h}</span>
            <span className="stat-label">Blocked (24h)</span>
          </div>
        </div>
      </div>

      <div className="ddos-protection__tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'attacks' ? 'active' : ''}`}
          onClick={() => setActiveTab('attacks')}
        >
          <AlertTriangle size={16} />
          Attacks
        </button>
        <button
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Filter size={16} />
          Rules
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          Analytics
        </button>
      </div>

      <div className="ddos-protection__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'attacks' && renderAttacks()}
        {activeTab === 'rules' && renderRules()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
}
