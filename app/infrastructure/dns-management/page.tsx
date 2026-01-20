'use client';

import React, { useState } from 'react';
import { 
  Globe,
  Server,
  Shield,
  Clock,
  RefreshCw,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Settings,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Network,
  MapPin,
  Lock,
  Unlock,
  Copy,
  Edit,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Link2,
  ExternalLink,
  FileText,
  Mail,
  Hash,
  Target
} from 'lucide-react';
import './dns-management.css';

interface DNSZone {
  id: string;
  domain: string;
  status: 'active' | 'pending' | 'suspended' | 'error';
  type: 'primary' | 'secondary';
  records: number;
  nameservers: string[];
  dnssec: boolean;
  ttl: number;
  created: string;
  updated: string;
  queryCount: number;
  propagationStatus: 'complete' | 'propagating' | 'pending';
}

interface DNSRecord {
  id: string;
  zoneId: string;
  name: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA' | 'PTR' | 'SOA';
  value: string;
  ttl: number;
  priority?: number;
  weight?: number;
  port?: number;
  proxied: boolean;
  status: 'active' | 'pending' | 'error';
  created: string;
  modified: string;
}

interface HealthCheck {
  id: string;
  name: string;
  zoneId: string;
  recordId: string;
  type: 'HTTP' | 'HTTPS' | 'TCP' | 'ICMP';
  endpoint: string;
  interval: number;
  timeout: number;
  retries: number;
  status: 'healthy' | 'unhealthy' | 'degraded';
  uptime: number;
  lastCheck: string;
  responseTime: number;
}

interface TrafficPolicy {
  id: string;
  name: string;
  zoneId: string;
  type: 'geolocation' | 'latency' | 'weighted' | 'failover' | 'multivalue';
  description: string;
  rules: number;
  enabled: boolean;
  created: string;
}

const DNS_ZONES: DNSZone[] = [
  {
    id: 'zone-1',
    domain: 'cube.io',
    status: 'active',
    type: 'primary',
    records: 48,
    nameservers: ['ns1.cubedns.io', 'ns2.cubedns.io', 'ns3.cubedns.io', 'ns4.cubedns.io'],
    dnssec: true,
    ttl: 3600,
    created: '2024-01-15T08:00:00Z',
    updated: '2025-01-28T14:30:00Z',
    queryCount: 15420000,
    propagationStatus: 'complete'
  },
  {
    id: 'zone-2',
    domain: 'cubeelite.com',
    status: 'active',
    type: 'primary',
    records: 32,
    nameservers: ['ns1.cubedns.io', 'ns2.cubedns.io'],
    dnssec: true,
    ttl: 3600,
    created: '2024-03-20T10:00:00Z',
    updated: '2025-01-27T09:15:00Z',
    queryCount: 8920000,
    propagationStatus: 'complete'
  },
  {
    id: 'zone-3',
    domain: 'cube-staging.io',
    status: 'active',
    type: 'primary',
    records: 24,
    nameservers: ['ns1.cubedns.io', 'ns2.cubedns.io'],
    dnssec: false,
    ttl: 300,
    created: '2024-06-01T14:00:00Z',
    updated: '2025-01-28T12:00:00Z',
    queryCount: 1250000,
    propagationStatus: 'complete'
  },
  {
    id: 'zone-4',
    domain: 'cube-api.dev',
    status: 'pending',
    type: 'primary',
    records: 8,
    nameservers: ['ns1.cubedns.io', 'ns2.cubedns.io'],
    dnssec: false,
    ttl: 300,
    created: '2025-01-28T10:00:00Z',
    updated: '2025-01-28T10:00:00Z',
    queryCount: 0,
    propagationStatus: 'propagating'
  },
  {
    id: 'zone-5',
    domain: 'cube-internal.net',
    status: 'active',
    type: 'secondary',
    records: 156,
    nameservers: ['ns1.cubedns.io', 'ns2.cubedns.io', 'ns-internal.cube.io'],
    dnssec: true,
    ttl: 900,
    created: '2024-02-10T08:00:00Z',
    updated: '2025-01-28T14:00:00Z',
    queryCount: 45670000,
    propagationStatus: 'complete'
  }
];

const DNS_RECORDS: DNSRecord[] = [
  { id: 'rec-1', zoneId: 'zone-1', name: '@', type: 'A', value: '104.21.45.67', ttl: 300, proxied: true, status: 'active', created: '2024-01-15T08:00:00Z', modified: '2025-01-28T14:30:00Z' },
  { id: 'rec-2', zoneId: 'zone-1', name: '@', type: 'AAAA', value: '2606:4700:3033::ac43:8e3f', ttl: 300, proxied: true, status: 'active', created: '2024-01-15T08:00:00Z', modified: '2025-01-28T14:30:00Z' },
  { id: 'rec-3', zoneId: 'zone-1', name: 'www', type: 'CNAME', value: 'cube.io', ttl: 3600, proxied: true, status: 'active', created: '2024-01-15T08:00:00Z', modified: '2024-06-15T10:00:00Z' },
  { id: 'rec-4', zoneId: 'zone-1', name: 'api', type: 'A', value: '104.21.45.68', ttl: 300, proxied: true, status: 'active', created: '2024-01-15T08:00:00Z', modified: '2025-01-27T16:00:00Z' },
  { id: 'rec-5', zoneId: 'zone-1', name: '@', type: 'MX', value: 'mail.cube.io', ttl: 3600, priority: 10, proxied: false, status: 'active', created: '2024-01-15T08:00:00Z', modified: '2024-03-20T09:00:00Z' },
  { id: 'rec-6', zoneId: 'zone-1', name: '@', type: 'TXT', value: 'v=spf1 include:_spf.cube.io ~all', ttl: 3600, proxied: false, status: 'active', created: '2024-01-15T08:00:00Z', modified: '2024-03-20T09:00:00Z' },
  { id: 'rec-7', zoneId: 'zone-1', name: '_dmarc', type: 'TXT', value: 'v=DMARC1; p=reject; rua=mailto:dmarc@cube.io', ttl: 3600, proxied: false, status: 'active', created: '2024-01-15T08:00:00Z', modified: '2024-03-20T09:00:00Z' },
  { id: 'rec-8', zoneId: 'zone-1', name: 'cdn', type: 'CNAME', value: 'd1234567890.cloudfront.net', ttl: 3600, proxied: false, status: 'active', created: '2024-06-01T10:00:00Z', modified: '2024-06-01T10:00:00Z' },
  { id: 'rec-9', zoneId: 'zone-1', name: 'staging', type: 'A', value: '10.0.1.100', ttl: 300, proxied: false, status: 'pending', created: '2025-01-28T14:00:00Z', modified: '2025-01-28T14:00:00Z' },
  { id: 'rec-10', zoneId: 'zone-1', name: '@', type: 'CAA', value: '0 issue "letsencrypt.org"', ttl: 3600, proxied: false, status: 'active', created: '2024-01-15T08:00:00Z', modified: '2024-01-15T08:00:00Z' }
];

const HEALTH_CHECKS: HealthCheck[] = [
  {
    id: 'hc-1',
    name: 'Primary API Health',
    zoneId: 'zone-1',
    recordId: 'rec-4',
    type: 'HTTPS',
    endpoint: 'https://api.cube.io/health',
    interval: 30,
    timeout: 10,
    retries: 3,
    status: 'healthy',
    uptime: 99.98,
    lastCheck: '2025-01-28T14:33:00Z',
    responseTime: 45
  },
  {
    id: 'hc-2',
    name: 'CDN Endpoint',
    zoneId: 'zone-1',
    recordId: 'rec-8',
    type: 'HTTPS',
    endpoint: 'https://cdn.cube.io/health',
    interval: 60,
    timeout: 15,
    retries: 2,
    status: 'healthy',
    uptime: 99.99,
    lastCheck: '2025-01-28T14:32:00Z',
    responseTime: 12
  },
  {
    id: 'hc-3',
    name: 'Mail Server',
    zoneId: 'zone-1',
    recordId: 'rec-5',
    type: 'TCP',
    endpoint: 'mail.cube.io:25',
    interval: 120,
    timeout: 30,
    retries: 3,
    status: 'healthy',
    uptime: 99.95,
    lastCheck: '2025-01-28T14:30:00Z',
    responseTime: 85
  },
  {
    id: 'hc-4',
    name: 'Staging Environment',
    zoneId: 'zone-1',
    recordId: 'rec-9',
    type: 'HTTP',
    endpoint: 'http://staging.cube.io/health',
    interval: 60,
    timeout: 10,
    retries: 2,
    status: 'unhealthy',
    uptime: 85.50,
    lastCheck: '2025-01-28T14:33:00Z',
    responseTime: 0
  }
];

const TRAFFIC_POLICIES: TrafficPolicy[] = [
  {
    id: 'tp-1',
    name: 'Global Load Balancing',
    zoneId: 'zone-1',
    type: 'geolocation',
    description: 'Route users to nearest data center based on geographic location',
    rules: 8,
    enabled: true,
    created: '2024-06-01T10:00:00Z'
  },
  {
    id: 'tp-2',
    name: 'API Failover',
    zoneId: 'zone-1',
    type: 'failover',
    description: 'Automatic failover to secondary API endpoints',
    rules: 4,
    enabled: true,
    created: '2024-06-15T14:00:00Z'
  },
  {
    id: 'tp-3',
    name: 'Weighted Distribution',
    zoneId: 'zone-1',
    type: 'weighted',
    description: 'Distribute traffic across multiple origins by weight',
    rules: 3,
    enabled: true,
    created: '2024-08-01T09:00:00Z'
  },
  {
    id: 'tp-4',
    name: 'Latency-Based Routing',
    zoneId: 'zone-2',
    type: 'latency',
    description: 'Route to lowest latency endpoint',
    rules: 6,
    enabled: false,
    created: '2024-09-15T11:00:00Z'
  }
];

const RECORD_TYPE_CONFIG = {
  'A': { color: 'primary', icon: Server, description: 'IPv4 Address' },
  'AAAA': { color: 'info', icon: Server, description: 'IPv6 Address' },
  'CNAME': { color: 'purple', icon: Link2, description: 'Canonical Name' },
  'MX': { color: 'warning', icon: Mail, description: 'Mail Exchange' },
  'TXT': { color: 'muted', icon: FileText, description: 'Text Record' },
  'NS': { color: 'success', icon: Globe, description: 'Name Server' },
  'SRV': { color: 'cyan', icon: Network, description: 'Service Record' },
  'CAA': { color: 'danger', icon: Shield, description: 'CA Authorization' },
  'PTR': { color: 'orange', icon: Hash, description: 'Pointer Record' },
  'SOA': { color: 'muted', icon: FileText, description: 'Start of Authority' }
};

const ZONE_STATUS_CONFIG = {
  active: { color: 'success', icon: CheckCircle, label: 'Active' },
  pending: { color: 'warning', icon: Clock, label: 'Pending' },
  suspended: { color: 'danger', icon: XCircle, label: 'Suspended' },
  error: { color: 'danger', icon: AlertTriangle, label: 'Error' }
};

const POLICY_TYPE_CONFIG = {
  geolocation: { color: 'primary', icon: MapPin },
  latency: { color: 'info', icon: Zap },
  weighted: { color: 'purple', icon: BarChart3 },
  failover: { color: 'warning', icon: RefreshCw },
  multivalue: { color: 'success', icon: Network }
};

export default function DNSManagementPage() {
  const [activeTab, setActiveTab] = useState<'zones' | 'records' | 'health' | 'policies'>('zones');
  const [expandedZone, setExpandedZone] = useState<string | null>('zone-1');
  const [selectedZone, setSelectedZone] = useState<string>('zone-1');
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
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

  const totalZones = DNS_ZONES.length;
  const totalRecords = DNS_ZONES.reduce((acc, z) => acc + z.records, 0);
  const totalQueries = DNS_ZONES.reduce((acc, z) => acc + z.queryCount, 0);
  const healthyChecks = HEALTH_CHECKS.filter(h => h.status === 'healthy').length;

  return (
    <div className="dns-management">
      <div className="dns-management__header">
        <div className="dns-management__title-section">
          <div className="dns-management__icon">
            <Globe size={28} />
          </div>
          <div>
            <h1>DNS Management</h1>
            <p>Domain zones, records, and traffic routing policies</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Add Zone
          </button>
        </div>
      </div>

      <div className="dns-management__stats">
        <div className="stat-card">
          <div className="stat-icon zones">
            <Globe size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalZones}</span>
            <span className="stat-label">DNS Zones</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon records">
            <FileText size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalRecords}</span>
            <span className="stat-label">Total Records</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon queries">
            <Activity size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(totalQueries)}</span>
            <span className="stat-label">Total Queries</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon health">
            <Shield size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{healthyChecks}/{HEALTH_CHECKS.length}</span>
            <span className="stat-label">Healthy Checks</span>
          </div>
        </div>
      </div>

      <div className="dns-management__tabs">
        <button 
          className={`tab-btn ${activeTab === 'zones' ? 'active' : ''}`}
          onClick={() => setActiveTab('zones')}
        >
          <Globe size={16} />
          Zones
        </button>
        <button 
          className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <FileText size={16} />
          Records
        </button>
        <button 
          className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          <Activity size={16} />
          Health Checks
        </button>
        <button 
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <Network size={16} />
          Traffic Policies
        </button>
      </div>

      {activeTab === 'zones' && (
        <div className="zones-section">
          <div className="zones-header">
            <h3>DNS Zones ({DNS_ZONES.length})</h3>
            <div className="zones-filters">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search zones..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="zones-list">
            {DNS_ZONES.filter(z => 
              searchQuery === '' || z.domain.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(zone => {
              const StatusConfig = ZONE_STATUS_CONFIG[zone.status];
              const StatusIcon = StatusConfig.icon;
              
              return (
                <div 
                  key={zone.id}
                  className={`zone-card ${zone.status}`}
                >
                  <div className="zone-main">
                    <div className={`zone-icon ${StatusConfig.color}`}>
                      <Globe size={20} />
                    </div>
                    <div className="zone-info">
                      <div className="zone-header">
                        <h4>{zone.domain}</h4>
                        <span className={`status-badge ${StatusConfig.color}`}>
                          <StatusIcon size={12} />
                          {StatusConfig.label}
                        </span>
                        <span className="type-badge">{zone.type}</span>
                        {zone.dnssec && (
                          <span className="dnssec-badge">
                            <Lock size={10} />
                            DNSSEC
                          </span>
                        )}
                      </div>
                      <div className="zone-meta">
                        <span><FileText size={12} /> {zone.records} records</span>
                        <span><Activity size={12} /> {formatNumber(zone.queryCount)} queries</span>
                        <span><Clock size={12} /> TTL: {zone.ttl}s</span>
                        <span>Updated {formatDate(zone.updated)}</span>
                      </div>
                    </div>
                    <div className="zone-propagation">
                      {zone.propagationStatus === 'complete' && (
                        <span className="propagation-status complete">
                          <CheckCircle size={14} />
                          Propagated
                        </span>
                      )}
                      {zone.propagationStatus === 'propagating' && (
                        <span className="propagation-status propagating">
                          <RefreshCw size={14} className="spinning" />
                          Propagating
                        </span>
                      )}
                      {zone.propagationStatus === 'pending' && (
                        <span className="propagation-status pending">
                          <Clock size={14} />
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="zone-actions">
                      <button className="action-btn" title="Copy Nameservers">
                        <Copy size={14} />
                      </button>
                      <button className="action-btn" title="Settings">
                        <Settings size={14} />
                      </button>
                      <button 
                        className="expand-btn"
                        onClick={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
                      >
                        {expandedZone === zone.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {expandedZone === zone.id && (
                    <div className="zone-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h5>Nameservers</h5>
                          <div className="nameservers-list">
                            {zone.nameservers.map((ns, idx) => (
                              <div key={idx} className="nameserver-item">
                                <Server size={14} />
                                <code>{ns}</code>
                                <button className="copy-btn">
                                  <Copy size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="expanded-section">
                          <h5>Zone Statistics</h5>
                          <div className="stats-grid">
                            <div className="stat-item">
                              <span className="stat-label">Total Queries (24h)</span>
                              <span className="stat-value">{formatNumber(zone.queryCount / 30)}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Records</span>
                              <span className="stat-value">{zone.records}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">DNSSEC</span>
                              <span className="stat-value">{zone.dnssec ? 'Enabled' : 'Disabled'}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Default TTL</span>
                              <span className="stat-value">{zone.ttl}s</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="expanded-actions">
                        <button className="btn-sm" onClick={() => { setSelectedZone(zone.id); setActiveTab('records'); }}>
                          <FileText size={14} />
                          View Records
                        </button>
                        <button className="btn-sm">
                          <Shield size={14} />
                          {zone.dnssec ? 'Configure DNSSEC' : 'Enable DNSSEC'}
                        </button>
                        <button className="btn-sm">
                          <ExternalLink size={14} />
                          Export Zone
                        </button>
                        <button className="btn-sm danger">
                          <Trash2 size={14} />
                          Delete Zone
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

      {activeTab === 'records' && (
        <div className="records-section">
          <div className="records-header">
            <h3>DNS Records</h3>
            <div className="records-filters">
              <select 
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                {DNS_ZONES.map(z => (
                  <option key={z.id} value={z.id}>{z.domain}</option>
                ))}
              </select>
              <select 
                value={recordTypeFilter}
                onChange={(e) => setRecordTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="A">A</option>
                <option value="AAAA">AAAA</option>
                <option value="CNAME">CNAME</option>
                <option value="MX">MX</option>
                <option value="TXT">TXT</option>
                <option value="NS">NS</option>
              </select>
              <button className="btn-primary">
                <Plus size={16} />
                Add Record
              </button>
            </div>
          </div>

          <div className="records-table">
            <div className="rt-header">
              <span className="rt-th">Type</span>
              <span className="rt-th">Name</span>
              <span className="rt-th">Value</span>
              <span className="rt-th">TTL</span>
              <span className="rt-th">Proxy</span>
              <span className="rt-th">Status</span>
              <span className="rt-th">Modified</span>
              <span className="rt-th">Actions</span>
            </div>
            <div className="rt-body">
              {DNS_RECORDS.filter(r => 
                r.zoneId === selectedZone &&
                (recordTypeFilter === 'all' || r.type === recordTypeFilter)
              ).map(record => {
                const TypeConfig = RECORD_TYPE_CONFIG[record.type];
                const TypeIcon = TypeConfig.icon;
                
                return (
                  <div key={record.id} className="rt-row">
                    <span className="rt-td type">
                      <span className={`type-chip ${TypeConfig.color}`}>
                        <TypeIcon size={12} />
                        {record.type}
                      </span>
                    </span>
                    <span className="rt-td name">
                      <code>{record.name}</code>
                    </span>
                    <span className="rt-td value">
                      <code className="value-code">{record.value}</code>
                      {record.priority !== undefined && (
                        <span className="priority">Pri: {record.priority}</span>
                      )}
                    </span>
                    <span className="rt-td ttl">{record.ttl}s</span>
                    <span className="rt-td proxy">
                      {record.proxied ? (
                        <span className="proxy-badge enabled">
                          <Shield size={12} />
                          On
                        </span>
                      ) : (
                        <span className="proxy-badge disabled">
                          Off
                        </span>
                      )}
                    </span>
                    <span className={`rt-td status ${record.status}`}>
                      {record.status === 'active' && <CheckCircle size={14} />}
                      {record.status === 'pending' && <Clock size={14} />}
                      {record.status === 'error' && <AlertTriangle size={14} />}
                      {record.status}
                    </span>
                    <span className="rt-td modified">{formatDate(record.modified)}</span>
                    <span className="rt-td actions">
                      <button className="action-btn-sm" title="Edit">
                        <Edit size={12} />
                      </button>
                      <button className="action-btn-sm" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="health-section">
          <div className="health-header">
            <h3>Health Checks ({HEALTH_CHECKS.length})</h3>
            <button className="btn-primary">
              <Plus size={16} />
              New Health Check
            </button>
          </div>

          <div className="health-grid">
            {HEALTH_CHECKS.map(check => (
              <div key={check.id} className={`health-card ${check.status}`}>
                <div className="health-card-header">
                  <div className={`health-icon ${check.status}`}>
                    {check.status === 'healthy' && <CheckCircle size={20} />}
                    {check.status === 'unhealthy' && <XCircle size={20} />}
                    {check.status === 'degraded' && <AlertTriangle size={20} />}
                  </div>
                  <div className="health-title">
                    <h4>{check.name}</h4>
                    <span className={`status-badge ${check.status}`}>
                      {check.status}
                    </span>
                  </div>
                  <button className="action-btn">
                    <Settings size={14} />
                  </button>
                </div>
                <div className="health-details">
                  <div className="health-detail">
                    <span className="label">Endpoint</span>
                    <code className="value">{check.endpoint}</code>
                  </div>
                  <div className="health-stats">
                    <div className="health-stat">
                      <span className="stat-value">{check.uptime}%</span>
                      <span className="stat-label">Uptime</span>
                    </div>
                    <div className="health-stat">
                      <span className="stat-value">
                        {check.responseTime > 0 ? `${check.responseTime}ms` : '-'}
                      </span>
                      <span className="stat-label">Response</span>
                    </div>
                    <div className="health-stat">
                      <span className="stat-value">{check.interval}s</span>
                      <span className="stat-label">Interval</span>
                    </div>
                  </div>
                </div>
                <div className="health-footer">
                  <span className="last-check">Last check: {formatDate(check.lastCheck)}</span>
                  <span className="protocol-badge">{check.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="policies-section">
          <div className="policies-header">
            <h3>Traffic Policies ({TRAFFIC_POLICIES.length})</h3>
            <button className="btn-primary">
              <Plus size={16} />
              New Policy
            </button>
          </div>

          <div className="policies-grid">
            {TRAFFIC_POLICIES.map(policy => {
              const TypeConfig = POLICY_TYPE_CONFIG[policy.type];
              const TypeIcon = TypeConfig.icon;
              
              return (
                <div key={policy.id} className={`policy-card ${!policy.enabled ? 'disabled' : ''}`}>
                  <div className="policy-card-header">
                    <div className={`policy-icon ${TypeConfig.color}`}>
                      <TypeIcon size={20} />
                    </div>
                    <div className="policy-title">
                      <h4>{policy.name}</h4>
                      <span className={`type-badge ${TypeConfig.color}`}>{policy.type}</span>
                    </div>
                    <div className="policy-toggle">
                      <label className="switch">
                        <input type="checkbox" checked={policy.enabled} readOnly />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                  <p className="policy-description">{policy.description}</p>
                  <div className="policy-meta">
                    <span>
                      <Target size={12} />
                      {policy.rules} rules
                    </span>
                    <span>
                      <Globe size={12} />
                      {DNS_ZONES.find(z => z.id === policy.zoneId)?.domain}
                    </span>
                  </div>
                  <div className="policy-footer">
                    <span className="created">Created {formatDate(policy.created)}</span>
                    <div className="policy-actions">
                      <button className="action-btn-sm" title="Edit">
                        <Edit size={12} />
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
