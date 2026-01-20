'use client';

import React, { useState } from 'react';
import { 
  Webhook,
  Plus,
  Search,
  Settings,
  Trash2,
  Edit,
  Copy,
  Eye,
  EyeOff,
  Check,
  X,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Code,
  Key,
  Globe,
  MoreVertical,
  Zap,
  Shield
} from 'lucide-react';
import './webhooks.css';

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'paused' | 'error';
  secret: string;
  createdAt: string;
  lastTriggered?: string;
  successRate: number;
  totalCalls: number;
  failedCalls: number;
}

interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  responseCode?: number;
  responseTime?: number;
  payload?: string;
}

export default function WebhooksManagementPage() {
  const [activeTab, setActiveTab] = useState<'webhooks' | 'events' | 'logs'>('webhooks');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookItem | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const webhooks: WebhookItem[] = [
    {
      id: 'wh-001',
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXX',
      events: ['automation.completed', 'automation.failed', 'user.login'],
      status: 'active',
      secret: 'whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      createdAt: '2 weeks ago',
      lastTriggered: '5 minutes ago',
      successRate: 98.5,
      totalCalls: 1542,
      failedCalls: 23
    },
    {
      id: 'wh-002',
      name: 'CRM Integration',
      url: 'https://api.mycrm.com/webhooks/cube',
      events: ['data.exported', 'data.imported', 'contact.created'],
      status: 'active',
      secret: 'whsec_q9w8e7r6t5y4u3i2o1p0a9s8d7f6g5h4',
      createdAt: '1 month ago',
      lastTriggered: '2 hours ago',
      successRate: 100,
      totalCalls: 847,
      failedCalls: 0
    },
    {
      id: 'wh-003',
      name: 'Analytics Tracker',
      url: 'https://analytics.company.com/ingest',
      events: ['page.viewed', 'automation.started', 'automation.completed'],
      status: 'paused',
      secret: 'whsec_z0x9c8v7b6n5m4k3j2h1g0f9e8d7c6b5',
      createdAt: '3 weeks ago',
      lastTriggered: '1 week ago',
      successRate: 95.2,
      totalCalls: 3421,
      failedCalls: 164
    },
    {
      id: 'wh-004',
      name: 'Error Monitor',
      url: 'https://sentry.io/api/webhooks/cube',
      events: ['error.occurred', 'automation.failed'],
      status: 'error',
      secret: 'whsec_m1n2b3v4c5x6z7a8s9d0f1g2h3j4k5l6',
      createdAt: '5 days ago',
      lastTriggered: '1 hour ago',
      successRate: 72.3,
      totalCalls: 156,
      failedCalls: 43
    }
  ];

  const recentEvents: WebhookEvent[] = [
    {
      id: 'evt-001',
      webhookId: 'wh-001',
      event: 'automation.completed',
      status: 'success',
      timestamp: '5 minutes ago',
      responseCode: 200,
      responseTime: 124
    },
    {
      id: 'evt-002',
      webhookId: 'wh-002',
      event: 'contact.created',
      status: 'success',
      timestamp: '15 minutes ago',
      responseCode: 201,
      responseTime: 342
    },
    {
      id: 'evt-003',
      webhookId: 'wh-004',
      event: 'error.occurred',
      status: 'failed',
      timestamp: '1 hour ago',
      responseCode: 500,
      responseTime: 5000
    },
    {
      id: 'evt-004',
      webhookId: 'wh-001',
      event: 'user.login',
      status: 'success',
      timestamp: '2 hours ago',
      responseCode: 200,
      responseTime: 89
    },
    {
      id: 'evt-005',
      webhookId: 'wh-003',
      event: 'automation.started',
      status: 'pending',
      timestamp: '3 hours ago'
    }
  ];

  const availableEvents = [
    { category: 'Automation', events: ['automation.started', 'automation.completed', 'automation.failed', 'automation.paused'] },
    { category: 'Data', events: ['data.exported', 'data.imported', 'data.deleted'] },
    { category: 'User', events: ['user.login', 'user.logout', 'user.created', 'user.updated'] },
    { category: 'Contact', events: ['contact.created', 'contact.updated', 'contact.deleted'] },
    { category: 'Team', events: ['team.member_added', 'team.member_removed', 'team.role_changed'] },
    { category: 'System', events: ['error.occurred', 'page.viewed', 'api.called'] }
  ];

  const toggleSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} />;
      case 'paused': return <Pause size={16} />;
      case 'error': return <XCircle size={16} />;
      case 'success': return <CheckCircle size={14} />;
      case 'failed': return <XCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  const filteredWebhooks = webhooks.filter(wh =>
    wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wh.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: webhooks.length,
    active: webhooks.filter(w => w.status === 'active').length,
    totalCalls: webhooks.reduce((acc, w) => acc + w.totalCalls, 0),
    avgSuccessRate: (webhooks.reduce((acc, w) => acc + w.successRate, 0) / webhooks.length).toFixed(1)
  };

  return (
    <div className="webhooks-management">
      <header className="webhooks-management__header">
        <div className="webhooks-management__title-section">
          <div className="webhooks-management__icon">
            <Webhook size={28} />
          </div>
          <div>
            <h1>Webhooks</h1>
            <p>Manage webhook integrations and event subscriptions</p>
          </div>
        </div>
        <button 
          className="create-webhook-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} />
          Create Webhook
        </button>
      </header>

      <div className="webhooks-management__stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Webhook size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Webhooks</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon calls">
            <Zap size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalCalls.toLocaleString()}</span>
            <span className="stat-label">Total Calls</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.avgSuccessRate}%</span>
            <span className="stat-label">Avg Success Rate</span>
          </div>
        </div>
      </div>

      <nav className="webhooks-management__tabs">
        {[
          { id: 'webhooks', label: 'Webhooks', count: webhooks.length },
          { id: 'events', label: 'Recent Events', count: recentEvents.length },
          { id: 'logs', label: 'Delivery Logs' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="webhooks-management__content">
        {activeTab === 'webhooks' && (
          <>
            <div className="content-filters">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search webhooks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="webhooks-list">
              {filteredWebhooks.map(webhook => (
                <div key={webhook.id} className={`webhook-card ${webhook.status}`}>
                  <div className="webhook-header">
                    <div className="webhook-info">
                      <h3>{webhook.name}</h3>
                      <div className="webhook-url">
                        <Globe size={14} />
                        <span>{webhook.url}</span>
                        <button 
                          className="copy-btn"
                          onClick={() => copyToClipboard(webhook.url)}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="webhook-actions">
                      <span className={`status-badge ${webhook.status}`}>
                        {getStatusIcon(webhook.status)}
                        {webhook.status}
                      </span>
                      <button className="action-btn">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="webhook-events">
                    <span className="events-label">Events:</span>
                    <div className="events-tags">
                      {webhook.events.slice(0, 3).map(event => (
                        <span key={event} className="event-tag">{event}</span>
                      ))}
                      {webhook.events.length > 3 && (
                        <span className="event-tag more">
                          +{webhook.events.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="webhook-secret">
                    <div className="secret-label">
                      <Key size={14} />
                      <span>Signing Secret:</span>
                    </div>
                    <div className="secret-value">
                      <code>
                        {showSecrets[webhook.id] 
                          ? webhook.secret 
                          : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <button 
                        className="toggle-secret"
                        onClick={() => toggleSecret(webhook.id)}
                      >
                        {showSecrets[webhook.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(webhook.secret)}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="webhook-stats">
                    <div className="stat">
                      <span className="stat-label">Last Triggered</span>
                      <span className="stat-value">{webhook.lastTriggered || 'Never'}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Success Rate</span>
                      <span className={`stat-value ${webhook.successRate >= 95 ? 'success' : webhook.successRate >= 80 ? 'warning' : 'error'}`}>
                        {webhook.successRate}%
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Total Calls</span>
                      <span className="stat-value">{webhook.totalCalls.toLocaleString()}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Failed</span>
                      <span className="stat-value error">{webhook.failedCalls}</span>
                    </div>
                  </div>

                  <div className="webhook-footer">
                    <span className="created-at">
                      <Clock size={14} />
                      Created {webhook.createdAt}
                    </span>
                    <div className="footer-actions">
                      <button className="btn-secondary">
                        <RefreshCw size={14} />
                        Test
                      </button>
                      <button className="btn-secondary">
                        <Edit size={14} />
                        Edit
                      </button>
                      {webhook.status === 'active' ? (
                        <button className="btn-secondary">
                          <Pause size={14} />
                          Pause
                        </button>
                      ) : (
                        <button className="btn-secondary">
                          <Play size={14} />
                          Activate
                        </button>
                      )}
                      <button className="btn-danger">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'events' && (
          <div className="events-section">
            <div className="events-list">
              {recentEvents.map(event => (
                <div key={event.id} className={`event-item ${event.status}`}>
                  <div className="event-status">
                    {getStatusIcon(event.status)}
                  </div>
                  <div className="event-content">
                    <div className="event-header">
                      <span className="event-name">{event.event}</span>
                      <span className="event-webhook">
                        → {webhooks.find(w => w.id === event.webhookId)?.name}
                      </span>
                    </div>
                    <div className="event-meta">
                      <span className="event-time">
                        <Clock size={12} />
                        {event.timestamp}
                      </span>
                      {event.responseCode && (
                        <span className={`event-code ${event.responseCode >= 200 && event.responseCode < 300 ? 'success' : 'error'}`}>
                          {event.responseCode}
                        </span>
                      )}
                      {event.responseTime && (
                        <span className="event-duration">
                          {event.responseTime}ms
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="view-details">
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs-section">
            <div className="logs-empty">
              <Activity size={48} />
              <h3>Delivery Logs</h3>
              <p>Detailed webhook delivery logs will appear here</p>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Webhook</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Slack Notifications"
                />
              </div>
              
              <div className="form-group">
                <label>Endpoint URL</label>
                <input 
                  type="url" 
                  placeholder="https://your-server.com/webhook"
                />
              </div>

              <div className="form-group">
                <label>Events</label>
                <p className="form-hint">Select the events that will trigger this webhook</p>
                <div className="events-selector">
                  {availableEvents.map(category => (
                    <div key={category.category} className="event-category">
                      <div className="category-header">
                        <ChevronDown size={16} />
                        <span>{category.category}</span>
                      </div>
                      <div className="category-events">
                        {category.events.map(event => (
                          <label key={event} className="event-checkbox">
                            <input type="checkbox" />
                            <span className="checkbox-custom" />
                            <span>{event}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <Shield size={16} />
                  Signing Secret
                </label>
                <p className="form-hint">Use this secret to verify webhook authenticity</p>
                <div className="secret-generator">
                  <input 
                    type="text" 
                    value="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    readOnly
                  />
                  <button className="regenerate-btn">
                    <RefreshCw size={14} />
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button className="create-btn">
                <Check size={16} />
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
