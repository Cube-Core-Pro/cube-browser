'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('CRMHub');

import React, { useState, useEffect, useCallback } from 'react';
import { CRMService, type GlobalSearchResult } from '@/lib/services/crm-service';
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  Kanban,
  Activity,
  Settings,
  Plus,
  Search,
  Bell,
  Brain,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  Calendar,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react';
import CRMDashboard from './CRMDashboard';
import ContactsManager from './ContactsManager';
import CompaniesManager from './CompaniesManager';
import DealsManager from './DealsManager';
import PipelineKanban from './PipelineKanban';
import ActivitiesManager from './ActivitiesManager';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useTranslation } from '@/hooks/useTranslation';
import './CRMHub.css';

type CRMView = 'dashboard' | 'contacts' | 'companies' | 'deals' | 'pipeline' | 'activities' | 'reports' | 'settings';

interface QuickStats {
  total_contacts: number;
  total_companies: number;
  open_deals: number;
  pipeline_value: number;
  activities_due_today: number;
}

interface Notification {
  id: string;
  type: 'deal' | 'activity' | 'contact' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const CRMHub: React.FC = () => {
  // i18n
  const { t } = useTranslation();
  
  const [activeView, setActiveView] = useState<CRMView>('dashboard');
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // M5 Error State
  const [error, setError] = useState<string | null>(null);

  // Navigation items configuration
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: '⌘1' },
    { id: 'contacts', label: 'Contacts', icon: Users, shortcut: '⌘2', badge: quickStats?.total_contacts },
    { id: 'companies', label: 'Companies', icon: Building2, shortcut: '⌘3', badge: quickStats?.total_companies },
    { id: 'deals', label: 'Deals', icon: Target, shortcut: '⌘4', badge: quickStats?.open_deals },
    { id: 'pipeline', label: 'Pipeline', icon: Kanban, shortcut: '⌘5' },
    { id: 'activities', label: 'Activities', icon: Activity, shortcut: '⌘6', badge: quickStats?.activities_due_today },
  ];

  const secondaryNavItems = [
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Quick add options
  const quickAddOptions = [
    { id: 'contact', label: 'New Contact', icon: Users, color: '#3b82f6' },
    { id: 'company', label: 'New Company', icon: Building2, color: '#10b981' },
    { id: 'deal', label: 'New Deal', icon: Target, color: '#f59e0b' },
    { id: 'activity', label: 'New Activity', icon: Calendar, color: '#8b5cf6' },
    { id: 'email', label: 'Send Email', icon: Mail, color: '#ec4899' },
    { id: 'call', label: 'Log Call', icon: Phone, color: '#06b6d4' },
  ];

  // Load quick stats
  const loadQuickStats = useCallback(async () => {
    const stats = await CRMService.analytics.getQuickStats();
    // Map service stats to local interface
    setQuickStats({
      total_contacts: stats.contacts,
      total_companies: 0, // Not in service response
      open_deals: stats.deals,
      pipeline_value: stats.revenue,
      activities_due_today: stats.tasks,
    });
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    const notifs = await CRMService.analytics.getNotifications();
    // Map service notifications to local interface
    setNotifications(notifs.map(n => ({
      id: n.id,
      type: n.notification_type as 'deal' | 'activity' | 'contact' | 'system',
      title: n.title,
      message: n.message,
      timestamp: n.timestamp,
      read: n.read,
    })));
  }, []);

  // Global search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const results = await CRMService.analytics.globalSearch(query);
      setSearchResults(results);
    } catch (error) {
      log.error('Search failed:', error);
      setSearchResults([]);
    }
  }, []);

  // Quick add handler
  const handleQuickAdd = useCallback(async (type: string) => {
    setShowQuickAdd(false);
    // Navigate to the appropriate section with create modal open
    switch (type) {
      case 'contact':
        setActiveView('contacts');
        // Emit event to open create modal
        window.dispatchEvent(new CustomEvent('crm:create', { detail: { type: 'contact' } }));
        break;
      case 'company':
        setActiveView('companies');
        window.dispatchEvent(new CustomEvent('crm:create', { detail: { type: 'company' } }));
        break;
      case 'deal':
        setActiveView('deals');
        window.dispatchEvent(new CustomEvent('crm:create', { detail: { type: 'deal' } }));
        break;
      case 'activity':
        setActiveView('activities');
        window.dispatchEvent(new CustomEvent('crm:create', { detail: { type: 'activity' } }));
        break;
      default:
        break;
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1': e.preventDefault(); setActiveView('dashboard'); break;
          case '2': e.preventDefault(); setActiveView('contacts'); break;
          case '3': e.preventDefault(); setActiveView('companies'); break;
          case '4': e.preventDefault(); setActiveView('deals'); break;
          case '5': e.preventDefault(); setActiveView('pipeline'); break;
          case '6': e.preventDefault(); setActiveView('activities'); break;
          case 'k': e.preventDefault(); setShowSearch(true); break;
          case 'n': e.preventDefault(); setShowQuickAdd(true); break;
        }
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowQuickAdd(false);
        setShowNotifications(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([loadQuickStats(), loadNotifications()]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('crm.errors.loadFailed', 'Failed to load CRM data');
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [loadQuickStats, loadNotifications, t]);

  // M5 Retry Handler
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    Promise.all([loadQuickStats(), loadNotifications()])
      .catch(err => {
        const errorMessage = err instanceof Error ? err.message : t('crm.errors.loadFailed', 'Failed to load CRM data');
        setError(errorMessage);
      })
      .finally(() => setIsLoading(false));
  }, [loadQuickStats, loadNotifications, t]);

  // Format currency
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Render active view
  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <CRMDashboard />;
      case 'contacts':
        return <ContactsManager />;
      case 'companies':
        return <CompaniesManager />;
      case 'deals':
        return <DealsManager />;
      case 'pipeline':
        return <PipelineKanban />;
      case 'activities':
        return <ActivitiesManager />;
      case 'reports':
        return (
          <div className="coming-soon">
            <BarChart3 size={48} />
            <h2>Reports & Analytics</h2>
            <p>Advanced reporting coming soon</p>
          </div>
        );
      case 'settings':
        return (
          <div className="coming-soon">
            <Settings size={48} />
            <h2>{t('crm.settings.title', 'CRM Settings')}</h2>
            <p>{t('crm.settings.comingSoon', 'Configuration options coming soon')}</p>
          </div>
        );
      default:
        return <CRMDashboard />;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // M5 Loading State
  if (isLoading) {
    return (
      <div className="crm-hub crm-loading">
        <LoadingState
          variant="spinner"
          size="lg"
          title={t('crm.loading.hub', 'Loading CRM...')}
          description={t('crm.loading.preparing', 'Preparing your contacts and deals')}
          testId="crm-loading"
        />
      </div>
    );
  }

  // M5 Error State
  if (error) {
    return (
      <div className="crm-hub crm-error">
        <ErrorState
          preset="server"
          title={t('crm.errors.title', 'Failed to Load CRM')}
          message={error}
          onRetry={handleRetry}
          retryLabel={t('common.retry', 'Try Again')}
          testId="crm-error"
        />
      </div>
    );
  }

  return (
    <div className="crm-hub">
      {/* Sidebar Navigation */}
      <aside className="crm-sidebar">
        <div className="sidebar-header">
          <div className="crm-logo">
            <Target size={24} />
            <span>{t('crm.title', 'CRM')}</span>
          </div>
          <button 
            className="btn-quick-add"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            title={t('crm.actions.quickAdd', 'Quick Add (⌘N)')}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="quick-stats-bar">
          <div className="stat-item">
            <span className="stat-value">{quickStats?.open_deals || 0}</span>
            <span className="stat-label">Open Deals</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{formatCurrency(quickStats?.pipeline_value || 0)}</span>
            <span className="stat-label">Pipeline</span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">Main</span>
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id as CRMView)}
                title={item.shortcut}
              >
                <item.icon size={18} />
                <span className="nav-label">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="nav-badge">{item.badge > 999 ? '999+' : item.badge}</span>
                )}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <span className="nav-section-title">Tools</span>
            {secondaryNavItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id as CRMView)}
              >
                <item.icon size={18} />
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* AI Assistant Teaser */}
        <div className="ai-teaser">
          <div className="ai-teaser-icon">
            <Brain size={20} />
          </div>
          <div className="ai-teaser-content">
            <span className="ai-teaser-title">AI Assistant</span>
            <span className="ai-teaser-subtitle">Get insights & suggestions</span>
          </div>
          <Sparkles size={16} className="ai-sparkle" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="crm-main">
        {/* Top Bar */}
        <header className="crm-topbar">
          <div className="topbar-left">
            <button 
              className="search-trigger"
              onClick={() => setShowSearch(true)}
            >
              <Search size={16} />
              <span>Search CRM...</span>
              <kbd>⌘K</kbd>
            </button>
          </div>

          <div className="topbar-right">
            <button className="btn-icon" title="Import">
              <Upload size={18} />
            </button>
            <button className="btn-icon" title="Export">
              <Download size={18} />
            </button>
            <button className="btn-icon" onClick={loadQuickStats} title="Refresh">
              <RefreshCw size={18} />
            </button>
            <div className="notification-wrapper">
              <button 
                className={`btn-icon ${unreadNotifications > 0 ? 'has-notifications' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadNotifications > 0 && (
                  <span className="notification-badge">{unreadNotifications}</span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <span>Notifications</span>
                    <button className="btn-text">Mark all read</button>
                  </div>
                  <div className="notifications-list">
                    {notifications.length > 0 ? notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                      >
                        <div className={`notification-icon ${notif.type}`}>
                          {notif.type === 'deal' && <Target size={14} />}
                          {notif.type === 'activity' && <Calendar size={14} />}
                          {notif.type === 'contact' && <Users size={14} />}
                          {notif.type === 'system' && <Bell size={14} />}
                        </div>
                        <div className="notification-content">
                          <span className="notification-title">{notif.title}</span>
                          <span className="notification-message">{notif.message}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="empty-notifications">
                        <Bell size={24} />
                        <span>No notifications</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="crm-content">
          {renderActiveView()}
        </div>
      </main>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="modal-overlay" onClick={() => setShowQuickAdd(false)}>
          <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quick Add</h3>
              <kbd>ESC</kbd>
            </div>
            <div className="quick-add-grid">
              {quickAddOptions.map((option) => (
                <button
                  key={option.id}
                  className="quick-add-option"
                  onClick={() => handleQuickAdd(option.id)}
                  style={{ '--option-color': option.color } as React.CSSProperties}
                >
                  <div className="option-icon">
                    <option.icon size={24} />
                  </div>
                  <span className="option-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      {showSearch && (
        <div className="modal-overlay" onClick={() => setShowSearch(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-input-wrapper">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search contacts, companies, deals..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
              <kbd>ESC</kbd>
            </div>
            {searchResults.length > 0 && (
              <div className="search-results">
                {/* Search results would be rendered here */}
                <div className="search-section">
                  <span className="search-section-title">Results</span>
                  {/* Render search results */}
                </div>
              </div>
            )}
            {searchQuery.length === 0 && (
              <div className="search-hints">
                <span className="hint">Type to search across all CRM data</span>
                <div className="search-shortcuts">
                  <div className="shortcut">
                    <kbd>@</kbd>
                    <span>Search contacts</span>
                  </div>
                  <div className="shortcut">
                    <kbd>#</kbd>
                    <span>Search deals</span>
                  </div>
                  <div className="shortcut">
                    <kbd>!</kbd>
                    <span>Search companies</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMHub;
