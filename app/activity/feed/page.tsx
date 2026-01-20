'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Filter,
  Search,
  Calendar,
  Clock,
  User,
  Settings,
  Code,
  Database,
  Shield,
  CreditCard,
  Users,
  FileText,
  Zap,
  Globe,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Eye,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  Upload,
  Key,
  Mail,
  MessageSquare,
  Play,
  Pause,
  Plus
} from 'lucide-react';
import './activity.css';

interface ActivityEvent {
  id: string;
  type: 'auth' | 'data' | 'automation' | 'team' | 'settings' | 'api' | 'billing' | 'security';
  action: string;
  description: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  timestamp: string;
  details?: Record<string, string | number>;
  status: 'success' | 'warning' | 'error' | 'pending';
  icon: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'export' | 'import' | 'run' | 'stop' | 'key' | 'email' | 'payment';
}

export default function ActivityFeedPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const activities: ActivityEvent[] = [
    {
      id: '1',
      type: 'auth',
      action: 'User Login',
      description: 'Logged in from Chrome on macOS',
      user: { name: 'John Doe', email: 'john@cube.app' },
      timestamp: '2 minutes ago',
      details: { IP: '192.168.1.100', Location: 'New York, US', Device: 'MacBook Pro' },
      status: 'success',
      icon: 'login'
    },
    {
      id: '2',
      type: 'automation',
      action: 'Workflow Executed',
      description: 'Customer Onboarding workflow completed successfully',
      user: { name: 'Sarah Connor', email: 'sarah@cube.app' },
      timestamp: '15 minutes ago',
      details: { 'Workflow ID': 'WF-001', Duration: '2.3s', 'Steps Completed': 12 },
      status: 'success',
      icon: 'run'
    },
    {
      id: '3',
      type: 'team',
      action: 'Member Invited',
      description: 'Invited mike@company.com to join the team',
      user: { name: 'John Doe', email: 'john@cube.app' },
      timestamp: '1 hour ago',
      details: { Email: 'mike@company.com', Role: 'Developer', 'Invite Expires': '7 days' },
      status: 'pending',
      icon: 'email'
    },
    {
      id: '4',
      type: 'api',
      action: 'API Key Generated',
      description: 'Created new production API key "prod_main_v2"',
      user: { name: 'Tech Admin', email: 'admin@cube.app' },
      timestamp: '2 hours ago',
      details: { 'Key Name': 'prod_main_v2', Permissions: 'Full Access', Expires: 'Never' },
      status: 'success',
      icon: 'key'
    },
    {
      id: '5',
      type: 'data',
      action: 'Export Created',
      description: 'Exported 5,420 records from Customer database',
      user: { name: 'Sarah Connor', email: 'sarah@cube.app' },
      timestamp: '3 hours ago',
      details: { Records: '5,420', Format: 'CSV', Size: '2.4 MB' },
      status: 'success',
      icon: 'export'
    },
    {
      id: '6',
      type: 'security',
      action: 'Failed Login Attempt',
      description: 'Multiple failed login attempts detected',
      user: { name: 'Unknown', email: 'attacker@suspicious.com' },
      timestamp: '4 hours ago',
      details: { Attempts: '5', IP: '185.143.223.12', Location: 'Unknown', Action: 'Blocked' },
      status: 'error',
      icon: 'login'
    },
    {
      id: '7',
      type: 'billing',
      action: 'Payment Processed',
      description: 'Monthly subscription payment completed',
      user: { name: 'Billing System', email: 'system@cube.app' },
      timestamp: '5 hours ago',
      details: { Amount: '$499.00', Plan: 'Enterprise', Invoice: 'INV-2026-0142' },
      status: 'success',
      icon: 'payment'
    },
    {
      id: '8',
      type: 'automation',
      action: 'Workflow Created',
      description: 'New workflow "Lead Nurturing" created',
      user: { name: 'John Doe', email: 'john@cube.app' },
      timestamp: '6 hours ago',
      details: { 'Workflow Name': 'Lead Nurturing', Steps: 8, Trigger: 'Webhook' },
      status: 'success',
      icon: 'create'
    },
    {
      id: '9',
      type: 'settings',
      action: 'Settings Updated',
      description: 'Two-factor authentication enabled for all users',
      user: { name: 'Tech Admin', email: 'admin@cube.app' },
      timestamp: '8 hours ago',
      details: { Setting: '2FA Required', 'Previous Value': 'Disabled', 'New Value': 'Enabled' },
      status: 'success',
      icon: 'update'
    },
    {
      id: '10',
      type: 'team',
      action: 'Role Changed',
      description: 'Updated role for sarah@cube.app to Admin',
      user: { name: 'John Doe', email: 'john@cube.app' },
      timestamp: '1 day ago',
      details: { User: 'sarah@cube.app', 'Previous Role': 'Developer', 'New Role': 'Admin' },
      status: 'success',
      icon: 'update'
    },
    {
      id: '11',
      type: 'automation',
      action: 'Workflow Failed',
      description: 'Data Sync workflow failed due to timeout',
      user: { name: 'System', email: 'system@cube.app' },
      timestamp: '1 day ago',
      details: { 'Workflow ID': 'WF-003', Error: 'Connection Timeout', Duration: '30s' },
      status: 'error',
      icon: 'stop'
    },
    {
      id: '12',
      type: 'data',
      action: 'Import Completed',
      description: 'Imported 12,500 contacts from Salesforce',
      user: { name: 'Sarah Connor', email: 'sarah@cube.app' },
      timestamp: '2 days ago',
      details: { Records: '12,500', Source: 'Salesforce', Duration: '45s' },
      status: 'success',
      icon: 'import'
    }
  ];

  const activityTypes = [
    { id: 'all', label: 'All Activity', icon: <Activity size={16} /> },
    { id: 'auth', label: 'Authentication', icon: <LogIn size={16} /> },
    { id: 'automation', label: 'Automation', icon: <Zap size={16} /> },
    { id: 'data', label: 'Data', icon: <Database size={16} /> },
    { id: 'team', label: 'Team', icon: <Users size={16} /> },
    { id: 'api', label: 'API', icon: <Code size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> }
  ];

  const getEventIcon = (iconType: string) => {
    const icons: Record<string, React.ReactNode> = {
      login: <LogIn size={18} />,
      logout: <LogOut size={18} />,
      create: <Plus size={18} />,
      update: <Edit size={18} />,
      delete: <Trash2 size={18} />,
      view: <Eye size={18} />,
      export: <Download size={18} />,
      import: <Upload size={18} />,
      run: <Play size={18} />,
      stop: <Pause size={18} />,
      key: <Key size={18} />,
      email: <Mail size={18} />,
      payment: <CreditCard size={18} />
    };
    return icons[iconType] || <Activity size={18} />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'error': return <XCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      default: return <Info size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      auth: '#3b82f6',
      automation: '#8b5cf6',
      data: '#06b6d4',
      team: '#ec4899',
      api: '#f97316',
      security: '#22c55e',
      billing: '#0ea5e9',
      settings: '#6b7280'
    };
    return colors[type] || '#6b7280';
  };

  const filteredActivities = activities.filter(activity => {
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesSearch = 
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const stats = {
    total: activities.length,
    success: activities.filter(a => a.status === 'success').length,
    warnings: activities.filter(a => a.status === 'warning').length,
    errors: activities.filter(a => a.status === 'error').length
  };

  return (
    <div className="activity-feed">
      <header className="activity-feed__header">
        <div className="activity-feed__title-section">
          <div className="activity-feed__icon">
            <Activity size={28} />
          </div>
          <div>
            <h1>Activity Feed</h1>
            <p>Monitor all account and system activity in real-time</p>
          </div>
        </div>
        <div className="activity-feed__actions">
          <button className="export-btn">
            <Download size={18} />
            Export
          </button>
          <button className="refresh-btn">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <div className="activity-feed__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Events</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.success}</span>
            <span className="stat-label">Successful</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.warnings}</span>
            <span className="stat-label">Warnings</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon error">
            <XCircle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.errors}</span>
            <span className="stat-label">Errors</span>
          </div>
        </div>
      </div>

      <div className="activity-feed__filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <div className="type-filters">
            {activityTypes.map(type => (
              <button
                key={type.id}
                className={`type-btn ${filterType === type.id ? 'active' : ''}`}
                onClick={() => setFilterType(type.id)}
              >
                {type.icon}
                <span>{type.label}</span>
              </button>
            ))}
          </div>
          
          <div className="date-filter">
            <Calendar size={16} />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      <div className="activity-feed__timeline">
        <div className="timeline-line" />
        
        {filteredActivities.map((event, index) => (
          <div 
            key={event.id} 
            className={`timeline-event ${event.status}`}
            style={{ '--type-color': getTypeColor(event.type) } as React.CSSProperties}
          >
            <div className="event-marker">
              <div className="marker-dot" />
            </div>
            
            <div 
              className="event-card"
              onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
            >
              <div className="event-icon">
                {getEventIcon(event.icon)}
              </div>
              
              <div className="event-content">
                <div className="event-header">
                  <div className="event-title">
                    <h4>{event.action}</h4>
                    <span className={`status-badge ${event.status}`}>
                      {getStatusIcon(event.status)}
                      {event.status}
                    </span>
                  </div>
                  <span className={`type-badge ${event.type}`}>
                    {event.type}
                  </span>
                </div>
                
                <p className="event-description">{event.description}</p>
                
                <div className="event-meta">
                  <div className="event-user">
                    <div className="user-avatar">
                      {event.user.name.charAt(0)}
                    </div>
                    <span>{event.user.name}</span>
                  </div>
                  <span className="event-time">
                    <Clock size={14} />
                    {event.timestamp}
                  </span>
                </div>

                {expandedEvent === event.id && event.details && (
                  <div className="event-details">
                    <div className="details-header">
                      <span>Event Details</span>
                    </div>
                    <div className="details-grid">
                      {Object.entries(event.details).map(([key, value]) => (
                        <div key={key} className="detail-item">
                          <span className="detail-label">{key}</span>
                          <span className="detail-value">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="event-expand">
                <ChevronRight 
                  size={18} 
                  style={{ 
                    transform: expandedEvent === event.id ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s'
                  }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="activity-feed__load-more">
        <button className="load-more-btn">
          Load More Activity
          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  );
}
