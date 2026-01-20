'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  User,
  Activity,
  Shield,
  Settings,
  Database,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Monitor,
  RefreshCw,
  Trash2,
  Edit,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  CreditCard,
  Mail,
  LogIn,
  LogOut
} from 'lucide-react';
import './logs.css';

interface AuditLog {
  id: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  action: string;
  category: 'auth' | 'data' | 'security' | 'admin' | 'billing' | 'api' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  resource: string;
  resourceId?: string;
  ip: string;
  location: string;
  userAgent: string;
  details: Record<string, string | number | boolean>;
  status: 'success' | 'failed' | 'pending';
}

interface LogStats {
  total: number;
  today: number;
  warnings: number;
  errors: number;
}

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d' | 'custom'>('7d');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const stats: LogStats = {
    total: 24847,
    today: 342,
    warnings: 89,
    errors: 12
  };

  const logs: AuditLog[] = [
    {
      id: '1',
      timestamp: '2026-01-29T14:35:22Z',
      user: { name: 'John Smith', email: 'john@company.com' },
      action: 'User Login',
      category: 'auth',
      severity: 'info',
      resource: 'Authentication',
      ip: '192.168.1.100',
      location: 'San Francisco, USA',
      userAgent: 'Chrome 120 / macOS',
      details: { method: '2FA', device: 'MacBook Pro' },
      status: 'success'
    },
    {
      id: '2',
      timestamp: '2026-01-29T14:32:15Z',
      user: { name: 'Sarah Connor', email: 'sarah@company.com' },
      action: 'API Key Created',
      category: 'api',
      severity: 'warning',
      resource: 'API Keys',
      resourceId: 'key_prod_xyz123',
      ip: '10.0.0.55',
      location: 'New York, USA',
      userAgent: 'Firefox 121 / Windows',
      details: { keyType: 'production', permissions: 'full-access', expiresIn: '90 days' },
      status: 'success'
    },
    {
      id: '3',
      timestamp: '2026-01-29T14:28:44Z',
      user: { name: 'Admin System', email: 'system@cube.ai' },
      action: 'Security Scan Completed',
      category: 'security',
      severity: 'info',
      resource: 'Security',
      ip: '127.0.0.1',
      location: 'Server',
      userAgent: 'CUBE Security Scanner',
      details: { threatsFound: 0, vulnerabilities: 2, scanDuration: '4m 32s' },
      status: 'success'
    },
    {
      id: '4',
      timestamp: '2026-01-29T14:22:08Z',
      user: { name: 'Mike Johnson', email: 'mike@company.com' },
      action: 'Failed Login Attempt',
      category: 'auth',
      severity: 'error',
      resource: 'Authentication',
      ip: '203.0.113.42',
      location: 'Unknown',
      userAgent: 'Unknown Browser',
      details: { attempts: 5, reason: 'Invalid password', accountLocked: true },
      status: 'failed'
    },
    {
      id: '5',
      timestamp: '2026-01-29T14:18:33Z',
      user: { name: 'Emily Davis', email: 'emily@company.com' },
      action: 'Data Export Requested',
      category: 'data',
      severity: 'warning',
      resource: 'User Data',
      resourceId: 'export_req_456',
      ip: '172.16.0.22',
      location: 'Los Angeles, USA',
      userAgent: 'Safari / iOS',
      details: { dataType: 'full-account', format: 'JSON', estimatedSize: '2.4 GB' },
      status: 'pending'
    },
    {
      id: '6',
      timestamp: '2026-01-29T14:15:19Z',
      user: { name: 'Admin User', email: 'admin@cube.ai' },
      action: 'User Role Modified',
      category: 'admin',
      severity: 'warning',
      resource: 'User Management',
      resourceId: 'user_789',
      ip: '192.168.1.101',
      location: 'San Francisco, USA',
      userAgent: 'Chrome 120 / macOS',
      details: { previousRole: 'member', newRole: 'admin', modifiedBy: 'super_admin' },
      status: 'success'
    },
    {
      id: '7',
      timestamp: '2026-01-29T14:10:55Z',
      user: { name: 'Billing System', email: 'billing@cube.ai' },
      action: 'Subscription Renewed',
      category: 'billing',
      severity: 'info',
      resource: 'Subscriptions',
      resourceId: 'sub_enterprise_123',
      ip: '127.0.0.1',
      location: 'Server',
      userAgent: 'CUBE Billing Service',
      details: { plan: 'Enterprise', amount: '$499.00', period: 'monthly', nextBilling: '2026-02-29' },
      status: 'success'
    },
    {
      id: '8',
      timestamp: '2026-01-29T14:05:11Z',
      user: { name: 'Security Bot', email: 'security@cube.ai' },
      action: 'Brute Force Attack Detected',
      category: 'security',
      severity: 'critical',
      resource: 'Firewall',
      ip: '45.33.32.156',
      location: 'Russia',
      userAgent: 'Unknown',
      details: { attempts: 150, timeWindow: '5 minutes', action: 'IP blocked', blockedUntil: '24 hours' },
      status: 'success'
    },
    {
      id: '9',
      timestamp: '2026-01-29T14:00:00Z',
      user: { name: 'System', email: 'system@cube.ai' },
      action: 'Database Backup Completed',
      category: 'system',
      severity: 'info',
      resource: 'Database',
      ip: '127.0.0.1',
      location: 'Server',
      userAgent: 'CUBE Backup Service',
      details: { backupSize: '45.2 GB', duration: '12m 45s', compression: 'gzip', encryption: 'AES-256' },
      status: 'success'
    },
    {
      id: '10',
      timestamp: '2026-01-29T13:55:28Z',
      user: { name: 'Alex Wilson', email: 'alex@company.com' },
      action: 'Password Changed',
      category: 'auth',
      severity: 'info',
      resource: 'Authentication',
      ip: '192.168.1.102',
      location: 'Chicago, USA',
      userAgent: 'Edge 120 / Windows',
      details: { method: 'self-service', triggered: 'user-initiated', force2FA: true },
      status: 'success'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Categories', icon: <Activity size={16} /> },
    { id: 'auth', label: 'Authentication', icon: <LogIn size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'data', label: 'Data', icon: <Database size={16} /> },
    { id: 'admin', label: 'Admin', icon: <Settings size={16} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={16} /> },
    { id: 'api', label: 'API', icon: <Key size={16} /> },
    { id: 'system', label: 'System', icon: <Monitor size={16} /> }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return <LogIn size={16} />;
      case 'security': return <Shield size={16} />;
      case 'data': return <Database size={16} />;
      case 'admin': return <Settings size={16} />;
      case 'billing': return <CreditCard size={16} />;
      case 'api': return <Key size={16} />;
      case 'system': return <Monitor size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} />;
      case 'failed': return <XCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  const handleExport = () => {
    console.log('Export audit logs');
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div className="audit-logs">
      <header className="audit-logs__header">
        <div className="audit-logs__title-section">
          <div className="audit-logs__icon">
            <FileText size={28} />
          </div>
          <div>
            <h1>Audit Logs</h1>
            <p>Complete activity trail for your organization</p>
          </div>
        </div>
        <div className="audit-logs__actions">
          <button className="audit-logs__refresh-btn">
            <RefreshCw size={18} />
            Refresh
          </button>
          <button className="audit-logs__export-btn" onClick={handleExport}>
            <Download size={18} />
            Export Logs
          </button>
        </div>
      </header>

      <div className="audit-logs__stats">
        <div className="stat-card total">
          <Activity size={24} />
          <div className="stat-content">
            <span className="stat-value">{stats.total.toLocaleString()}</span>
            <span className="stat-label">Total Events</span>
          </div>
        </div>
        <div className="stat-card today">
          <Calendar size={24} />
          <div className="stat-content">
            <span className="stat-value">{stats.today}</span>
            <span className="stat-label">Today</span>
          </div>
        </div>
        <div className="stat-card warnings">
          <AlertTriangle size={24} />
          <div className="stat-content">
            <span className="stat-value">{stats.warnings}</span>
            <span className="stat-label">Warnings</span>
          </div>
        </div>
        <div className="stat-card errors">
          <XCircle size={24} />
          <div className="stat-content">
            <span className="stat-value">{stats.errors}</span>
            <span className="stat-label">Errors</span>
          </div>
        </div>
      </div>

      <div className="audit-logs__controls">
        <div className="audit-logs__search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search logs by action, user, or resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="audit-logs__filters">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          
          <select 
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
          
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="filter-select"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="custom">Custom Range</option>
          </select>
          
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            More Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="audit-logs__advanced-filters">
          <div className="filter-group">
            <label>User</label>
            <input type="text" placeholder="Filter by user..." />
          </div>
          <div className="filter-group">
            <label>IP Address</label>
            <input type="text" placeholder="Filter by IP..." />
          </div>
          <div className="filter-group">
            <label>Resource</label>
            <input type="text" placeholder="Filter by resource..." />
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select>
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      )}

      <div className="audit-logs__table-container">
        <table className="audit-logs__table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Status</th>
              <th>IP / Location</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => {
              const { date, time } = formatTimestamp(log.timestamp);
              return (
                <tr 
                  key={log.id} 
                  className={`log-row ${log.severity}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="timestamp-cell">
                    <span className="date">{date}</span>
                    <span className="time">{time}</span>
                  </td>
                  <td className="user-cell">
                    <div className="user-avatar">
                      {log.user.name.charAt(0)}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{log.user.name}</span>
                      <span className="user-email">{log.user.email}</span>
                    </div>
                  </td>
                  <td className="action-cell">
                    <span className="action-text">{log.action}</span>
                    {log.resourceId && (
                      <span className="resource-id">{log.resourceId}</span>
                    )}
                  </td>
                  <td className="category-cell">
                    <span className={`category-badge ${log.category}`}>
                      {getCategoryIcon(log.category)}
                      {log.category}
                    </span>
                  </td>
                  <td className="severity-cell">
                    <span className={`severity-badge ${log.severity}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${log.status}`}>
                      {getStatusIcon(log.status)}
                      {log.status}
                    </span>
                  </td>
                  <td className="location-cell">
                    <span className="ip">{log.ip}</span>
                    <span className="location">{log.location}</span>
                  </td>
                  <td className="details-cell">
                    <button className="view-details-btn">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="audit-logs__pagination">
        <div className="pagination-info">
          Showing <strong>1-10</strong> of <strong>{stats.total.toLocaleString()}</strong> events
        </div>
        <div className="pagination-controls">
          <button 
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          {[1, 2, 3, 4, 5].map(page => (
            <button
              key={page}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <span className="pagination-ellipsis">...</span>
          <button className="pagination-btn" onClick={() => setCurrentPage(100)}>
            100
          </button>
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(p => p + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {selectedLog && (
        <div className="audit-logs__modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="audit-logs__modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Event Details</h3>
              <button className="close-btn" onClick={() => setSelectedLog(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div className="detail-section">
                <h4>Event Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Event ID</span>
                    <span className="detail-value">{selectedLog.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Timestamp</span>
                    <span className="detail-value">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Action</span>
                    <span className="detail-value">{selectedLog.action}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Category</span>
                    <span className={`category-badge ${selectedLog.category}`}>
                      {getCategoryIcon(selectedLog.category)}
                      {selectedLog.category}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Severity</span>
                    <span className={`severity-badge ${selectedLog.severity}`}>{selectedLog.severity}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge ${selectedLog.status}`}>
                      {getStatusIcon(selectedLog.status)}
                      {selectedLog.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>User Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{selectedLog.user.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{selectedLog.user.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Request Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">IP Address</span>
                    <span className="detail-value">{selectedLog.ip}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{selectedLog.location}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">User Agent</span>
                    <span className="detail-value">{selectedLog.userAgent}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Additional Details</h4>
                <div className="detail-json">
                  <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
