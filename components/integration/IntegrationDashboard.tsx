/**
 * Integration Dashboard Component
 * CUBE Elite v6 - Cross-Module Integration Hub
 * 
 * Manages integrations between: CRM ↔ Marketing ↔ Social ↔ Research ↔ Search
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Link2, 
  RefreshCw, 
  Settings, 
  Activity, 
  Users, 
  Zap, 
  Database,
  ArrowRight,
  CheckCircle,
  Clock,
  Play,
  Pause,
  Search,
  Plus,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import { integrationLayerService } from '@/lib/services';
import type { 
  UnifiedContact, 
  CrossModuleEvent, 
  IntegrationRule, 
  SyncStatus, 
  DashboardStats
} from '@/lib/services/integrationLayerService';
import { logger } from '@/lib/services/logger-service';
import './IntegrationDashboard.css';

const log = logger.scope('IntegrationDashboard');

// Module icons and colors
const MODULE_CONFIG: Record<string, { icon: React.ReactNode; color: string; name: string }> = {
  crm: { icon: <Users size={18} />, color: '#6366f1', name: 'CRM' },
  marketing: { icon: <Zap size={18} />, color: '#8b5cf6', name: 'Marketing' },
  social: { icon: <Activity size={18} />, color: '#ec4899', name: 'Social' },
  research: { icon: <Search size={18} />, color: '#14b8a6', name: 'Research' },
  search: { icon: <Database size={18} />, color: '#f59e0b', name: 'Search' },
  automation: { icon: <Settings size={18} />, color: '#10b981', name: 'Automation' },
};

interface IntegrationDashboardProps {
  onClose?: () => void;
}

const IntegrationDashboard: React.FC<IntegrationDashboardProps> = ({ onClose }) => {
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'mappings' | 'contacts' | 'events'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rules, setRules] = useState<IntegrationRule[]>([]);
  const [events, setEvents] = useState<CrossModuleEvent[]>([]);
  const [contacts, setContacts] = useState<UnifiedContact[]>([]);
  const [syncStatus, setSyncStatus] = useState<Record<string, SyncStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showRuleModal, setShowRuleModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingRule, setEditingRule] = useState<IntegrationRule | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, rulesData, eventsData, contactsData, statusData] = await Promise.all([
        integrationLayerService.getDashboardStats(),
        integrationLayerService.getRules(),
        integrationLayerService.getEvents(50),
        integrationLayerService.getUnifiedContacts(100),
        integrationLayerService.getSyncStatus(),
      ]);

      setStats(statsData);
      setRules(rulesData);
      setEvents(eventsData);
      setContacts(contactsData);
      setSyncStatus(statusData);
    } catch (err) {
      log.error('Failed to load integration data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load integration data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Sync modules
  const handleSync = async (sourceModule: string, targetModule: string) => {
    setSyncing(`${sourceModule}-${targetModule}`);
    try {
      await integrationLayerService.syncModules(sourceModule, targetModule);
      // Emit sync event
      await integrationLayerService.emitEvent('data_synced', sourceModule, [targetModule], {
        source: sourceModule,
        target: targetModule,
        timestamp: new Date().toISOString(),
      });
      // Refresh data
      await loadData();
    } catch (error) {
      log.error('Sync failed:', error);
    } finally {
      setSyncing(null);
    }
  };

  // Toggle rule
  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await integrationLayerService.updateRule(ruleId, { enabled: !enabled });
      setRules(rules.map(r => r.id === ruleId ? { ...r, enabled: !enabled } : r));
    } catch (error) {
      log.error('Failed to toggle rule:', error);
    }
  };

  // Delete rule
  const handleDeleteRule = async (ruleId: string) => {
    try {
      await integrationLayerService.deleteRule(ruleId);
      setRules(rules.filter(r => r.id !== ruleId));
    } catch (error) {
      log.error('Failed to delete rule:', error);
    }
  };

  // Render overview tab
  const renderOverview = () => (
    <div className="integration-overview">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.overview.total_events || 0}</div>
            <div className="stat-label">Total Events</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}>
            <Settings size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.overview.active_rules || 0}</div>
            <div className="stat-label">Active Rules</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.overview.unified_contacts || 0}</div>
            <div className="stat-label">Unified Contacts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)' }}>
            <Database size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.overview.total_records_synced || 0}</div>
            <div className="stat-label">Records Synced</div>
          </div>
        </div>
      </div>

      {/* Module Connections */}
      <div className="module-connections">
        <h3>Module Connections</h3>
        <div className="connections-grid">
          {Object.entries(MODULE_CONFIG).map(([key, config]) => {
            const status = syncStatus[key];
            return (
              <div key={key} className="module-card">
                <div className="module-header">
                  <div className="module-icon" style={{ background: config.color }}>
                    {config.icon}
                  </div>
                  <div className="module-info">
                    <span className="module-name">{config.name}</span>
                    <span className={`module-status ${status?.status || 'idle'}`}>
                      {status?.status === 'completed' ? (
                        <><CheckCircle size={12} /> Connected</>
                      ) : status?.status === 'syncing' ? (
                        <><RefreshCw size={12} className="spinning" /> Syncing</>
                      ) : (
                        <><Clock size={12} /> Idle</>
                      )}
                    </span>
                  </div>
                </div>
                <div className="module-stats">
                  <span>{status?.records_synced || 0} records</span>
                  {status?.last_sync && (
                    <span className="last-sync">
                      Last: {new Date(status.last_sync).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button 
            className="action-button"
            onClick={() => handleSync('crm', 'marketing')}
            disabled={syncing !== null}
          >
            <Link2 size={18} />
            <span>Sync CRM → Marketing</span>
            {syncing === 'crm-marketing' && <RefreshCw size={14} className="spinning" />}
          </button>

          <button 
            className="action-button"
            onClick={() => handleSync('social', 'crm')}
            disabled={syncing !== null}
          >
            <Link2 size={18} />
            <span>Sync Social → CRM</span>
            {syncing === 'social-crm' && <RefreshCw size={14} className="spinning" />}
          </button>

          <button 
            className="action-button"
            onClick={() => handleSync('research', 'marketing')}
            disabled={syncing !== null}
          >
            <Link2 size={18} />
            <span>Sync Research → Marketing</span>
            {syncing === 'research-marketing' && <RefreshCw size={14} className="spinning" />}
          </button>

          <button 
            className="action-button"
            onClick={async () => {
              setSyncing('all');
              await integrationLayerService.syncAllModules();
              await loadData();
              setSyncing(null);
            }}
            disabled={syncing !== null}
          >
            <RefreshCw size={18} />
            <span>Sync All Modules</span>
            {syncing === 'all' && <RefreshCw size={14} className="spinning" />}
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {events.slice(0, 5).map((event) => (
            <div key={event.id} className="activity-item">
              <div className="activity-icon">
                {event.processed ? (
                  <CheckCircle size={16} className="success" />
                ) : (
                  <Clock size={16} className="pending" />
                )}
              </div>
              <div className="activity-content">
                <span className="activity-type">{event.event_type.replace(/_/g, ' ')}</span>
                <span className="activity-modules">
                  {event.source_module} <ArrowRight size={12} /> {event.target_modules.join(', ')}
                </span>
              </div>
              <span className="activity-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render rules tab
  const renderRules = () => (
    <div className="integration-rules">
      <div className="rules-header">
        <h3>Integration Rules</h3>
        <button className="btn-primary" onClick={() => setShowRuleModal(true)}>
          <Plus size={16} />
          <span>New Rule</span>
        </button>
      </div>

      <div className="rules-list">
        {rules.map((rule) => (
          <div key={rule.id} className={`rule-card ${rule.enabled ? 'enabled' : 'disabled'}`}>
            <div className="rule-header">
              <div className="rule-info">
                <span className="rule-name">{rule.name}</span>
                <div className="rule-flow">
                  <span className="module-badge" style={{ background: MODULE_CONFIG[rule.source_module]?.color }}>
                    {rule.source_module}
                  </span>
                  <ArrowRight size={14} />
                  <span className="module-badge" style={{ background: MODULE_CONFIG[rule.target_module]?.color }}>
                    {rule.target_module}
                  </span>
                </div>
              </div>
              <div className="rule-actions">
                <button
                  className={`toggle-btn ${rule.enabled ? 'active' : ''}`}
                  onClick={() => handleToggleRule(rule.id, rule.enabled)}
                >
                  {rule.enabled ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  className="edit-btn"
                  onClick={() => {
                    setEditingRule(rule);
                    setShowRuleModal(true);
                  }}
                >
                  <Edit size={14} />
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="rule-details">
              <span className="rule-trigger">
                Trigger: <strong>{rule.trigger_event.toString().replace(/_/g, ' ')}</strong>
              </span>
              {rule.conditions.length > 0 && (
                <span className="rule-conditions">
                  {rule.conditions.length} condition(s)
                </span>
              )}
              <span className="rule-created">
                Created: {new Date(rule.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="empty-state">
            <Settings size={48} />
            <h4>No Integration Rules</h4>
            <p>Create your first rule to automate data flow between modules.</p>
            <button className="btn-primary" onClick={() => setShowRuleModal(true)}>
              <Plus size={16} />
              Create Rule
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Render contacts tab
  const renderContacts = () => (
    <div className="unified-contacts">
      <div className="contacts-header">
        <h3>Unified Contacts</h3>
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="contacts-list">
        {contacts
          .filter(c => 
            searchQuery === '' ||
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.company?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((contact) => (
            <div key={contact.id} className="contact-card">
              <div className="contact-avatar">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div className="contact-info">
                <span className="contact-name">{contact.name}</span>
                {contact.email && <span className="contact-email">{contact.email}</span>}
                {contact.company && <span className="contact-company">{contact.company}</span>}
              </div>
              <div className="contact-meta">
                <span className="contact-source" style={{ background: MODULE_CONFIG[contact.source]?.color }}>
                  {contact.source}
                </span>
                <span className="contact-score">
                  Score: {contact.score}
                </span>
              </div>
              <div className="contact-social">
                {contact.social_profiles.slice(0, 3).map((profile, idx) => (
                  <span key={idx} className="social-badge" title={profile.platform}>
                    {profile.platform.charAt(0).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          ))}

        {contacts.length === 0 && (
          <div className="empty-state">
            <Users size={48} />
            <h4>No Unified Contacts</h4>
            <p>Contacts will appear here as they are synced across modules.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render events tab
  const renderEvents = () => (
    <div className="integration-events">
      <div className="events-header">
        <h3>Cross-Module Events</h3>
        <button className="btn-secondary" onClick={loadData}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="events-timeline">
        {events.map((event) => (
          <div key={event.id} className={`event-item ${event.processed ? 'processed' : 'pending'}`}>
            <div className="event-marker">
              {event.processed ? (
                <CheckCircle size={16} />
              ) : (
                <Clock size={16} />
              )}
            </div>
            <div className="event-content">
              <div className="event-header">
                <span className="event-type">{event.event_type.replace(/_/g, ' ')}</span>
                <span className="event-time">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="event-flow">
                <span className="source" style={{ borderColor: MODULE_CONFIG[event.source_module]?.color }}>
                  {event.source_module}
                </span>
                <ArrowRight size={14} />
                <span className="targets">
                  {event.target_modules.join(', ')}
                </span>
              </div>
              <div className="event-payload">
                <code>{JSON.stringify(event.payload, null, 2).slice(0, 100)}...</code>
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="empty-state">
            <Activity size={48} />
            <h4>No Events Yet</h4>
            <p>Events will appear here as modules interact with each other.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="integration-dashboard loading">
        <RefreshCw size={32} className="spinning" />
        <span>Loading integration data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="integration-dashboard error-state">
        <div className="error-container">
          <div className="error-icon">
            <X size={32} />
          </div>
          <h3>Failed to Load Integration Data</h3>
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={loadData}>
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="integration-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <Link2 size={24} />
          <h1>Integration Hub</h1>
          <span className="badge">Enterprise</span>
        </div>
        <div className="header-right">
          <button className="btn-icon" onClick={loadData}>
            <RefreshCw size={18} />
          </button>
          {onClose && (
            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        {(['overview', 'rules', 'contacts', 'events'] as const).map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'rules' && renderRules()}
        {activeTab === 'contacts' && renderContacts()}
        {activeTab === 'events' && renderEvents()}
      </div>
    </div>
  );
};

export default IntegrationDashboard;
