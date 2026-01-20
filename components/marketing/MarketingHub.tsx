'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MarketingService } from '@/lib/services/marketing-service';
import {
  LayoutDashboard,
  Mail,
  GitBranch,
  Users,
  FileText,
  Zap,
  BarChart3,
  Settings,
  Plus,
  Search,
  Bell,
  Brain,
  Sparkles,
  RefreshCw,
  Download,
  Upload,
  Target,
  Globe,
  Calendar,
  TrendingUp,
  Megaphone
} from 'lucide-react';
import MarketingDashboard from './MarketingDashboard';
import EmailCampaigns from './EmailCampaigns';
import FunnelBuilder from './FunnelBuilder';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState as _EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useTranslation } from '@/hooks/useTranslation';
import './MarketingHub.css';

type MarketingView = 'dashboard' | 'campaigns' | 'email' | 'funnels' | 'leads' | 'automations' | 'landing-pages' | 'analytics' | 'settings';

interface QuickStats {
  active_campaigns: number;
  total_leads: number;
  emails_sent_today: number;
  conversion_rate: number;
  revenue_this_month: number;
}

interface Notification {
  id: string;
  type: 'campaign' | 'lead' | 'automation' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Placeholder components for sections not yet implemented
const LeadsManager: React.FC = () => (
  <div className="placeholder-view">
    <Users size={48} />
    <h2>Leads Management</h2>
    <p>Track and manage your leads throughout the funnel</p>
    <div className="placeholder-features">
      <div className="feature">
        <Target size={20} />
        <span>Lead Scoring</span>
      </div>
      <div className="feature">
        <TrendingUp size={20} />
        <span>Conversion Tracking</span>
      </div>
      <div className="feature">
        <Zap size={20} />
        <span>Auto-assignment</span>
      </div>
    </div>
  </div>
);

const AutomationsManager: React.FC = () => (
  <div className="placeholder-view">
    <Zap size={48} />
    <h2>Marketing Automations</h2>
    <p>Create powerful automated workflows</p>
    <div className="placeholder-features">
      <div className="feature">
        <Mail size={20} />
        <span>Email Sequences</span>
      </div>
      <div className="feature">
        <Calendar size={20} />
        <span>Scheduled Actions</span>
      </div>
      <div className="feature">
        <GitBranch size={20} />
        <span>Conditional Logic</span>
      </div>
    </div>
  </div>
);

const LandingPagesManager: React.FC = () => (
  <div className="placeholder-view">
    <FileText size={48} />
    <h2>Landing Pages</h2>
    <p>Design high-converting landing pages</p>
    <div className="placeholder-features">
      <div className="feature">
        <Globe size={20} />
        <span>Drag & Drop Builder</span>
      </div>
      <div className="feature">
        <Target size={20} />
        <span>A/B Testing</span>
      </div>
      <div className="feature">
        <BarChart3 size={20} />
        <span>Conversion Analytics</span>
      </div>
    </div>
  </div>
);

const AnalyticsView: React.FC = () => (
  <div className="placeholder-view">
    <BarChart3 size={48} />
    <h2>Marketing Analytics</h2>
    <p>Deep insights into your marketing performance</p>
    <div className="placeholder-features">
      <div className="feature">
        <TrendingUp size={20} />
        <span>ROI Tracking</span>
      </div>
      <div className="feature">
        <Target size={20} />
        <span>Attribution</span>
      </div>
      <div className="feature">
        <Brain size={20} />
        <span>AI Insights</span>
      </div>
    </div>
  </div>
);

const MarketingHub: React.FC = () => {
  // i18n
  const { t } = useTranslation();
  
  const [activeView, setActiveView] = useState<MarketingView>('dashboard');
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // M5 Error State
  const [error, setError] = useState<string | null>(null);

  // Navigation items configuration
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: '⌘1' },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone, shortcut: '⌘2', badge: quickStats?.active_campaigns },
    { id: 'email', label: 'Email Marketing', icon: Mail, shortcut: '⌘3' },
    { id: 'funnels', label: 'Funnels', icon: GitBranch, shortcut: '⌘4' },
    { id: 'leads', label: 'Leads', icon: Users, shortcut: '⌘5', badge: quickStats?.total_leads },
    { id: 'automations', label: 'Automations', icon: Zap, shortcut: '⌘6' },
    { id: 'landing-pages', label: 'Landing Pages', icon: FileText, shortcut: '⌘7' },
  ];

  const secondaryNavItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Quick add options
  const quickAddOptions = [
    { id: 'campaign', label: 'New Campaign', icon: Megaphone, color: '#3b82f6' },
    { id: 'email', label: 'Email Blast', icon: Mail, color: '#10b981' },
    { id: 'funnel', label: 'New Funnel', icon: GitBranch, color: '#f59e0b' },
    { id: 'landing', label: 'Landing Page', icon: FileText, color: '#8b5cf6' },
    { id: 'automation', label: 'Automation', icon: Zap, color: '#ec4899' },
    { id: 'lead', label: 'Add Lead', icon: Users, color: '#06b6d4' },
  ];

  // Load quick stats
  const loadQuickStats = useCallback(async () => {
    const analytics = await MarketingService.analytics.getAnalytics('month');
    setQuickStats({
      active_campaigns: analytics?.campaigns?.total_sent || 0,
      total_leads: analytics?.leads?.total_leads || 0,
      emails_sent_today: analytics?.campaigns?.total_delivered || 0,
      conversion_rate: analytics?.campaigns?.avg_click_rate || 0,
      revenue_this_month: analytics?.funnels?.total_conversions || 0,
    });
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    const notifs = await MarketingService.analytics.getNotifications();
    setNotifications((notifs || []).map(n => ({
      id: n.id,
      type: n.notification_type as 'campaign' | 'lead' | 'automation' | 'system',
      title: n.title,
      message: n.message,
      timestamp: n.timestamp,
      read: n.read
    })));
  }, []);

  // Quick add handler
  const handleQuickAdd = useCallback((type: string) => {
    setShowQuickAdd(false);
    switch (type) {
      case 'campaign':
        setActiveView('campaigns');
        window.dispatchEvent(new CustomEvent('marketing:create', { detail: { type: 'campaign' } }));
        break;
      case 'email':
        setActiveView('email');
        window.dispatchEvent(new CustomEvent('marketing:create', { detail: { type: 'email' } }));
        break;
      case 'funnel':
        setActiveView('funnels');
        window.dispatchEvent(new CustomEvent('marketing:create', { detail: { type: 'funnel' } }));
        break;
      case 'landing':
        setActiveView('landing-pages');
        window.dispatchEvent(new CustomEvent('marketing:create', { detail: { type: 'landing' } }));
        break;
      case 'automation':
        setActiveView('automations');
        window.dispatchEvent(new CustomEvent('marketing:create', { detail: { type: 'automation' } }));
        break;
      case 'lead':
        setActiveView('leads');
        window.dispatchEvent(new CustomEvent('marketing:create', { detail: { type: 'lead' } }));
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
          case '2': e.preventDefault(); setActiveView('campaigns'); break;
          case '3': e.preventDefault(); setActiveView('email'); break;
          case '4': e.preventDefault(); setActiveView('funnels'); break;
          case '5': e.preventDefault(); setActiveView('leads'); break;
          case '6': e.preventDefault(); setActiveView('automations'); break;
          case '7': e.preventDefault(); setActiveView('landing-pages'); break;
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
        const errorMessage = err instanceof Error ? err.message : t('marketing.errors.loadFailed', 'Failed to load marketing data');
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
        const errorMessage = err instanceof Error ? err.message : t('marketing.errors.loadFailed', 'Failed to load marketing data');
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

  // Format number
  const formatNumber = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  // Render active view
  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <MarketingDashboard />;
      case 'campaigns':
        return <MarketingDashboard />;
      case 'email':
        return <EmailCampaigns />;
      case 'funnels':
        return <FunnelBuilder />;
      case 'leads':
        return <LeadsManager />;
      case 'automations':
        return <AutomationsManager />;
      case 'landing-pages':
        return <LandingPagesManager />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return (
          <div className="coming-soon">
            <Settings size={48} />
            <h2>{t('marketing.settings.title', 'Marketing Settings')}</h2>
            <p>{t('marketing.settings.comingSoon', 'Configuration options coming soon')}</p>
          </div>
        );
      default:
        return <MarketingDashboard />;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // M5 Loading State
  if (isLoading) {
    return (
      <div className="marketing-hub marketing-loading">
        <LoadingState
          variant="spinner"
          size="lg"
          title={t('marketing.loading.hub', 'Loading Marketing Hub...')}
          description={t('marketing.loading.preparing', 'Preparing your campaigns')}
          testId="marketing-loading"
        />
      </div>
    );
  }

  // M5 Error State
  if (error) {
    return (
      <div className="marketing-hub marketing-error">
        <ErrorState
          preset="server"
          title={t('marketing.errors.title', 'Failed to Load Marketing Hub')}
          message={error}
          onRetry={handleRetry}
          retryLabel={t('common.retry', 'Try Again')}
          testId="marketing-error"
        />
      </div>
    );
  }

  return (
    <div className="marketing-hub">
      {/* Sidebar Navigation */}
      <aside className="marketing-sidebar">
        <div className="sidebar-header">
          <div className="marketing-logo">
            <Megaphone size={24} />
            <span>{t('marketing.title', 'Marketing')}</span>
          </div>
          <button 
            className="btn-quick-add"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            title="Quick Add (⌘N)"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="quick-stats-bar">
          <div className="stat-item">
            <span className="stat-value">{quickStats?.active_campaigns || 0}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{formatNumber(quickStats?.total_leads || 0)}</span>
            <span className="stat-label">Leads</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{quickStats?.conversion_rate || 0}%</span>
            <span className="stat-label">CVR</span>
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
                onClick={() => setActiveView(item.id as MarketingView)}
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
                onClick={() => setActiveView(item.id as MarketingView)}
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
            <span className="ai-teaser-title">AI Marketing</span>
            <span className="ai-teaser-subtitle">Generate campaigns & copy</span>
          </div>
          <Sparkles size={16} className="ai-sparkle" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="marketing-main">
        {/* Top Bar */}
        <header className="marketing-topbar">
          <div className="topbar-left">
            <button 
              className="search-trigger"
              onClick={() => setShowSearch(true)}
            >
              <Search size={16} />
              <span>Search marketing...</span>
              <kbd>⌘K</kbd>
            </button>
          </div>

          <div className="topbar-center">
            <div className="revenue-indicator">
              <TrendingUp size={16} />
              <span className="revenue-label">Revenue this month:</span>
              <span className="revenue-value">{formatCurrency(quickStats?.revenue_this_month || 0)}</span>
            </div>
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
                          {notif.type === 'campaign' && <Megaphone size={14} />}
                          {notif.type === 'lead' && <Users size={14} />}
                          {notif.type === 'automation' && <Zap size={14} />}
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
        <div className="marketing-content">
          {renderActiveView()}
        </div>
      </main>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="modal-overlay" onClick={() => setShowQuickAdd(false)}>
          <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quick Create</h3>
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
                placeholder="Search campaigns, leads, funnels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <kbd>ESC</kbd>
            </div>
            {searchQuery.length === 0 && (
              <div className="search-hints">
                <span className="hint">Type to search across all marketing data</span>
                <div className="search-shortcuts">
                  <div className="shortcut">
                    <kbd>@</kbd>
                    <span>Search campaigns</span>
                  </div>
                  <div className="shortcut">
                    <kbd>#</kbd>
                    <span>Search leads</span>
                  </div>
                  <div className="shortcut">
                    <kbd>!</kbd>
                    <span>Search funnels</span>
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

export default MarketingHub;
