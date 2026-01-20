'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  Settings, 
  Check, 
  X,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  User,
  CreditCard,
  Shield,
  Mail,
  MessageSquare,
  Zap,
  Gift,
  TrendingUp,
  Users,
  Key,
  Globe,
  Archive,
  MoreVertical,
  Volume2,
  VolumeX,
  ChevronRight
} from 'lucide-react';
import './notifications.css';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  category: 'security' | 'billing' | 'team' | 'updates' | 'mentions' | 'promotions';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, string>;
}

interface NotificationPreference {
  id: string;
  category: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export default function NotificationsCenterPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived' | 'settings'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'warning',
      category: 'security',
      title: 'Unusual Login Activity Detected',
      message: 'A login attempt was made from a new location: Moscow, Russia. If this was you, you can ignore this message.',
      timestamp: '2 minutes ago',
      read: false,
      actionUrl: '/security/center',
      actionLabel: 'Review Activity'
    },
    {
      id: '2',
      type: 'success',
      category: 'billing',
      title: 'Payment Successful',
      message: 'Your payment of $499.00 for the Enterprise plan has been processed successfully.',
      timestamp: '15 minutes ago',
      read: false,
      metadata: { invoiceId: 'INV-2026-0142' }
    },
    {
      id: '3',
      type: 'info',
      category: 'team',
      title: 'New Team Member Joined',
      message: 'Sarah Connor has accepted your invitation and joined your team as a Developer.',
      timestamp: '1 hour ago',
      read: false,
      actionUrl: '/settings/team',
      actionLabel: 'View Team'
    },
    {
      id: '4',
      type: 'system',
      category: 'updates',
      title: 'System Update Completed',
      message: 'CUBE Elite has been updated to version 6.2.1. Check out the new features!',
      timestamp: '3 hours ago',
      read: true,
      actionUrl: '/changelog',
      actionLabel: 'View Changelog'
    },
    {
      id: '5',
      type: 'info',
      category: 'mentions',
      title: 'You were mentioned in a comment',
      message: '@john mentioned you in the Automation Flow "Customer Onboarding"',
      timestamp: '5 hours ago',
      read: true,
      actionUrl: '/automation/flows/123',
      actionLabel: 'View Comment'
    },
    {
      id: '6',
      type: 'success',
      category: 'promotions',
      title: 'Special Offer: 20% Off Annual Plans',
      message: 'Upgrade to an annual plan and save 20%. Offer valid until February 15, 2026.',
      timestamp: '1 day ago',
      read: true,
      actionUrl: '/settings/subscription',
      actionLabel: 'Upgrade Now'
    },
    {
      id: '7',
      type: 'error',
      category: 'security',
      title: 'API Key Expiring Soon',
      message: 'Your production API key "prod_main" will expire in 7 days. Please generate a new key.',
      timestamp: '1 day ago',
      read: false,
      actionUrl: '/settings/api-keys',
      actionLabel: 'Manage Keys'
    },
    {
      id: '8',
      type: 'info',
      category: 'updates',
      title: 'Weekly Analytics Report Ready',
      message: 'Your weekly performance report for January 20-26 is now available.',
      timestamp: '2 days ago',
      read: true,
      actionUrl: '/analytics',
      actionLabel: 'View Report'
    },
    {
      id: '9',
      type: 'warning',
      category: 'billing',
      title: 'Storage Limit Warning',
      message: 'You have used 85% of your storage quota. Consider upgrading your plan.',
      timestamp: '3 days ago',
      read: true,
      actionUrl: '/settings/billing',
      actionLabel: 'Upgrade Storage'
    },
    {
      id: '10',
      type: 'success',
      category: 'team',
      title: 'Project Milestone Achieved',
      message: 'Congratulations! Your team completed 1,000 automation runs this month.',
      timestamp: '4 days ago',
      read: true
    }
  ]);

  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    { id: 'security', category: 'Security', label: 'Security Alerts', description: 'Login attempts, password changes, and security events', email: true, push: true, inApp: true },
    { id: 'billing', category: 'Billing', label: 'Billing & Payments', description: 'Invoices, payment confirmations, and subscription changes', email: true, push: true, inApp: true },
    { id: 'team', category: 'Team', label: 'Team Activity', description: 'New members, role changes, and team updates', email: true, push: false, inApp: true },
    { id: 'updates', category: 'Updates', label: 'Product Updates', description: 'New features, improvements, and system maintenance', email: true, push: false, inApp: true },
    { id: 'mentions', category: 'Mentions', label: 'Mentions & Comments', description: 'When someone mentions you or replies to your comments', email: true, push: true, inApp: true },
    { id: 'promotions', category: 'Promotions', label: 'Offers & Promotions', description: 'Special offers, discounts, and promotional content', email: false, push: false, inApp: true }
  ]);

  const categories = [
    { id: 'all', label: 'All', icon: <Bell size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={16} /> },
    { id: 'team', label: 'Team', icon: <Users size={16} /> },
    { id: 'updates', label: 'Updates', icon: <Zap size={16} /> },
    { id: 'mentions', label: 'Mentions', icon: <MessageSquare size={16} /> },
    { id: 'promotions', label: 'Offers', icon: <Gift size={16} /> }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      case 'error': return <XCircle size={20} />;
      case 'system': return <Zap size={20} />;
      default: return <Info size={20} />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield size={16} />;
      case 'billing': return <CreditCard size={16} />;
      case 'team': return <Users size={16} />;
      case 'updates': return <Zap size={16} />;
      case 'mentions': return <MessageSquare size={16} />;
      case 'promotions': return <Gift size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleTogglePreference = (prefId: string, channel: 'email' | 'push' | 'inApp') => {
    setPreferences(prev => 
      prev.map(p => p.id === prefId ? { ...p, [channel]: !p[channel] } : p)
    );
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'unread' && !n.read);
    
    return matchesCategory && matchesSearch && matchesTab;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-center">
      <header className="notifications-center__header">
        <div className="notifications-center__title-section">
          <div className="notifications-center__icon">
            <Bell size={28} />
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <div>
            <h1>Notifications</h1>
            <p>Stay updated with your account activity</p>
          </div>
        </div>
        <div className="notifications-center__actions">
          <button 
            className="mark-all-btn"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={18} />
            Mark All Read
          </button>
          <button className="settings-btn" onClick={() => setActiveTab('settings')}>
            <Settings size={18} />
          </button>
        </div>
      </header>

      <nav className="notifications-center__tabs">
        {[
          { id: 'all', label: 'All', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          { id: 'archived', label: 'Archived', count: 0 },
          { id: 'settings', label: 'Settings', icon: <Settings size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            className={`notifications-center__tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="notifications-center__content">
        {activeTab !== 'settings' ? (
          <>
            <div className="notifications-center__filters">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="category-filters">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="notifications-center__list">
              {filteredNotifications.length === 0 ? (
                <div className="empty-state">
                  <Bell size={48} />
                  <h3>No notifications</h3>
                  <p>You're all caught up! New notifications will appear here.</p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}`}
                  >
                    <div className="notification-icon">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-header">
                        <h4>{notification.title}</h4>
                        <div className="notification-meta">
                          <span className={`category-tag ${notification.category}`}>
                            {getCategoryIcon(notification.category)}
                            {notification.category}
                          </span>
                          <span className="timestamp">
                            <Clock size={14} />
                            {notification.timestamp}
                          </span>
                        </div>
                      </div>
                      <p className="notification-message">{notification.message}</p>
                      {notification.metadata && (
                        <div className="notification-metadata">
                          {Object.entries(notification.metadata).map(([key, value]) => (
                            <span key={key} className="metadata-item">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                      {notification.actionUrl && (
                        <a href={notification.actionUrl} className="notification-action">
                          {notification.actionLabel}
                          <ChevronRight size={16} />
                        </a>
                      )}
                    </div>
                    <div className="notification-actions">
                      {!notification.read && (
                        <button 
                          className="action-btn mark-read"
                          onClick={() => handleMarkAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button 
                        className="action-btn archive"
                        title="Archive"
                      >
                        <Archive size={16} />
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(notification.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="notifications-center__settings">
            <div className="settings-section">
              <h3>Notification Preferences</h3>
              <p className="settings-description">
                Choose how you want to receive notifications for different types of activity.
              </p>
              
              <div className="preferences-header">
                <span className="header-label">Category</span>
                <span className="header-channel">
                  <Mail size={16} />
                  Email
                </span>
                <span className="header-channel">
                  <Bell size={16} />
                  Push
                </span>
                <span className="header-channel">
                  <Globe size={16} />
                  In-App
                </span>
              </div>

              <div className="preferences-list">
                {preferences.map(pref => (
                  <div key={pref.id} className="preference-item">
                    <div className="preference-info">
                      <span className="preference-label">{pref.label}</span>
                      <span className="preference-description">{pref.description}</span>
                    </div>
                    <div className="preference-toggles">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={pref.email}
                          onChange={() => handleTogglePreference(pref.id, 'email')}
                        />
                        <span className="toggle-slider" />
                      </label>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={pref.push}
                          onChange={() => handleTogglePreference(pref.id, 'push')}
                        />
                        <span className="toggle-slider" />
                      </label>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={pref.inApp}
                          onChange={() => handleTogglePreference(pref.id, 'inApp')}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <h3>Notification Schedule</h3>
              <p className="settings-description">
                Set quiet hours when you don't want to receive push notifications.
              </p>
              
              <div className="schedule-settings">
                <div className="schedule-toggle">
                  <div className="schedule-info">
                    <VolumeX size={20} />
                    <div>
                      <span className="schedule-label">Do Not Disturb</span>
                      <span className="schedule-description">Pause all push notifications</span>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider" />
                  </label>
                </div>
                
                <div className="quiet-hours">
                  <div className="quiet-hours-header">
                    <span>Quiet Hours</span>
                    <label className="toggle-switch small">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="quiet-hours-inputs">
                    <div className="time-input">
                      <label>From</label>
                      <input type="time" defaultValue="22:00" />
                    </div>
                    <div className="time-input">
                      <label>To</label>
                      <input type="time" defaultValue="07:00" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Email Digest</h3>
              <p className="settings-description">
                Receive a summary of your notifications instead of individual emails.
              </p>
              
              <div className="digest-options">
                {['Immediately', 'Daily Digest', 'Weekly Digest', 'Never'].map(option => (
                  <label key={option} className="digest-radio">
                    <input 
                      type="radio" 
                      name="digest" 
                      defaultChecked={option === 'Daily Digest'} 
                    />
                    <span className="radio-custom" />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="settings-actions">
              <button className="save-btn">
                <Check size={18} />
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
