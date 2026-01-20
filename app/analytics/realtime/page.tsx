'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  Globe,
  TrendingUp,
  TrendingDown,
  Clock,
  MousePointer,
  Eye,
  ShoppingCart,
  DollarSign,
  Map,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Download,
  Filter,
  Maximize2,
  Zap,
  Target,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  XCircle,
  Radio,
  Wifi,
  Server
} from 'lucide-react';
import './realtime-analytics.css';

interface LiveUser {
  id: string;
  country: string;
  city: string;
  page: string;
  device: string;
  browser: string;
  duration: number;
  referrer: string;
  events: number;
}

interface LiveEvent {
  id: string;
  type: 'pageview' | 'click' | 'conversion' | 'scroll' | 'form' | 'error';
  page: string;
  element?: string;
  value?: number;
  timestamp: Date;
  userId: string;
  country: string;
}

interface RealtimeMetric {
  name: string;
  value: number;
  previousValue: number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
}

interface GeoData {
  country: string;
  countryCode: string;
  users: number;
  percentage: number;
}

interface PageData {
  path: string;
  title: string;
  activeUsers: number;
  avgTime: number;
  bounceRate: number;
}

interface TrafficSource {
  source: string;
  users: number;
  percentage: number;
  type: 'organic' | 'direct' | 'referral' | 'social' | 'paid';
}

const SAMPLE_LIVE_USERS: LiveUser[] = [
  { id: '1', country: 'United States', city: 'New York', page: '/dashboard', device: 'desktop', browser: 'Chrome', duration: 245, referrer: 'google.com', events: 12 },
  { id: '2', country: 'Germany', city: 'Berlin', page: '/pricing', device: 'mobile', browser: 'Safari', duration: 89, referrer: 'twitter.com', events: 5 },
  { id: '3', country: 'Japan', city: 'Tokyo', page: '/features/ai', device: 'desktop', browser: 'Firefox', duration: 432, referrer: 'direct', events: 18 },
  { id: '4', country: 'Brazil', city: 'São Paulo', page: '/checkout', device: 'tablet', browser: 'Chrome', duration: 67, referrer: 'facebook.com', events: 8 },
  { id: '5', country: 'United Kingdom', city: 'London', page: '/blog/security', device: 'desktop', browser: 'Edge', duration: 156, referrer: 'linkedin.com', events: 7 },
  { id: '6', country: 'Australia', city: 'Sydney', page: '/dashboard/analytics', device: 'mobile', browser: 'Safari', duration: 321, referrer: 'google.com', events: 14 },
  { id: '7', country: 'Canada', city: 'Toronto', page: '/signup', device: 'desktop', browser: 'Chrome', duration: 45, referrer: 'reddit.com', events: 3 },
  { id: '8', country: 'France', city: 'Paris', page: '/docs/api', device: 'desktop', browser: 'Chrome', duration: 567, referrer: 'github.com', events: 22 },
];

const SAMPLE_LIVE_EVENTS: LiveEvent[] = [
  { id: 'e1', type: 'pageview', page: '/dashboard', timestamp: new Date(), userId: '1', country: 'United States' },
  { id: 'e2', type: 'click', page: '/pricing', element: 'CTA Button', timestamp: new Date(Date.now() - 5000), userId: '2', country: 'Germany' },
  { id: 'e3', type: 'conversion', page: '/checkout', value: 299, timestamp: new Date(Date.now() - 12000), userId: '4', country: 'Brazil' },
  { id: 'e4', type: 'scroll', page: '/features/ai', element: '75%', timestamp: new Date(Date.now() - 18000), userId: '3', country: 'Japan' },
  { id: 'e5', type: 'form', page: '/signup', element: 'Registration Form', timestamp: new Date(Date.now() - 25000), userId: '7', country: 'Canada' },
  { id: 'e6', type: 'pageview', page: '/blog/security', timestamp: new Date(Date.now() - 32000), userId: '5', country: 'United Kingdom' },
  { id: 'e7', type: 'error', page: '/dashboard/reports', element: 'Chart Load Error', timestamp: new Date(Date.now() - 45000), userId: '6', country: 'Australia' },
  { id: 'e8', type: 'click', page: '/docs/api', element: 'Code Copy', timestamp: new Date(Date.now() - 58000), userId: '8', country: 'France' },
];

const SAMPLE_GEO_DATA: GeoData[] = [
  { country: 'United States', countryCode: 'US', users: 342, percentage: 38.2 },
  { country: 'Germany', countryCode: 'DE', users: 128, percentage: 14.3 },
  { country: 'United Kingdom', countryCode: 'GB', users: 98, percentage: 10.9 },
  { country: 'Japan', countryCode: 'JP', users: 87, percentage: 9.7 },
  { country: 'Canada', countryCode: 'CA', users: 76, percentage: 8.5 },
  { country: 'Brazil', countryCode: 'BR', users: 65, percentage: 7.3 },
  { country: 'Australia', countryCode: 'AU', users: 54, percentage: 6.0 },
  { country: 'France', countryCode: 'FR', users: 46, percentage: 5.1 },
];

const SAMPLE_PAGES: PageData[] = [
  { path: '/dashboard', title: 'Dashboard', activeUsers: 145, avgTime: 234, bounceRate: 23.5 },
  { path: '/pricing', title: 'Pricing', activeUsers: 98, avgTime: 156, bounceRate: 45.2 },
  { path: '/features/ai', title: 'AI Features', activeUsers: 87, avgTime: 312, bounceRate: 18.7 },
  { path: '/docs/api', title: 'API Documentation', activeUsers: 76, avgTime: 445, bounceRate: 12.3 },
  { path: '/blog/security', title: 'Security Blog', activeUsers: 65, avgTime: 267, bounceRate: 34.8 },
  { path: '/checkout', title: 'Checkout', activeUsers: 43, avgTime: 89, bounceRate: 67.2 },
  { path: '/signup', title: 'Sign Up', activeUsers: 38, avgTime: 78, bounceRate: 52.1 },
];

const SAMPLE_SOURCES: TrafficSource[] = [
  { source: 'Google', users: 287, percentage: 32.1, type: 'organic' },
  { source: 'Direct', users: 234, percentage: 26.2, type: 'direct' },
  { source: 'Twitter', users: 123, percentage: 13.8, type: 'social' },
  { source: 'LinkedIn', users: 98, percentage: 11.0, type: 'social' },
  { source: 'GitHub', users: 76, percentage: 8.5, type: 'referral' },
  { source: 'Google Ads', users: 54, percentage: 6.0, type: 'paid' },
  { source: 'Reddit', users: 22, percentage: 2.4, type: 'referral' },
];

export default function RealtimeAnalyticsPage() {
  const [isLive, setIsLive] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'geo' | 'pages'>('overview');
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>(SAMPLE_LIVE_USERS);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>(SAMPLE_LIVE_EVENTS);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState<LiveUser | null>(null);

  const metrics: RealtimeMetric[] = [
    { name: 'Active Users', value: 896, previousValue: 843, trend: 'up' },
    { name: 'Pages/Minute', value: 2340, previousValue: 2180, trend: 'up' },
    { name: 'Avg. Session', value: 4.5, previousValue: 4.2, unit: 'min', trend: 'up' },
    { name: 'Bounce Rate', value: 34.2, previousValue: 36.8, unit: '%', trend: 'down' },
    { name: 'Conversions/h', value: 47, previousValue: 42, trend: 'up' },
    { name: 'Revenue/h', value: 8420, previousValue: 7650, unit: '$', trend: 'up' },
  ];

  const deviceBreakdown = [
    { device: 'Desktop', percentage: 58, icon: Monitor },
    { device: 'Mobile', percentage: 34, icon: Smartphone },
    { device: 'Tablet', percentage: 8, icon: Tablet },
  ];

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setLiveUsers((prev) => {
        const shuffled = [...prev].sort(() => Math.random() - 0.5);
        return shuffled.map((user) => ({
          ...user,
          duration: user.duration + Math.floor(Math.random() * 10),
          events: user.events + (Math.random() > 0.7 ? 1 : 0),
        }));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'pageview':
        return <Eye size={14} />;
      case 'click':
        return <MousePointer size={14} />;
      case 'conversion':
        return <DollarSign size={14} />;
      case 'scroll':
        return <TrendingDown size={14} />;
      case 'form':
        return <Target size={14} />;
      case 'error':
        return <AlertCircle size={14} />;
      default:
        return <Activity size={14} />;
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'organic':
        return <Globe size={14} />;
      case 'direct':
        return <Target size={14} />;
      case 'social':
        return <Users size={14} />;
      case 'referral':
        return <Zap size={14} />;
      case 'paid':
        return <DollarSign size={14} />;
      default:
        return <Globe size={14} />;
    }
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="live-pulse-section">
        <div className="pulse-header">
          <div className="pulse-indicator">
            <Radio size={18} />
            <span>Live Activity Pulse</span>
          </div>
          <span className="pulse-count">{liveUsers.length} active sessions</span>
        </div>
        <div className="activity-bars">
          {Array.from({ length: 60 }, (_, i) => (
            <div
              key={i}
              className="activity-bar"
              style={{
                height: `${20 + Math.random() * 80}%`,
                opacity: i > 50 ? 0.3 + (i - 50) * 0.07 : 0.3,
              }}
            />
          ))}
        </div>
        <div className="pulse-timeline">
          <span>60 min ago</span>
          <span>Now</span>
        </div>
      </div>

      <div className="overview-grid">
        <div className="overview-card device-breakdown">
          <h4>
            <Monitor size={16} />
            Device Breakdown
          </h4>
          <div className="device-list">
            {deviceBreakdown.map((d) => (
              <div key={d.device} className="device-item">
                <div className="device-info">
                  <d.icon size={16} />
                  <span>{d.device}</span>
                </div>
                <div className="device-bar-wrap">
                  <div className="device-bar" style={{ width: `${d.percentage}%` }} />
                </div>
                <span className="device-pct">{d.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card top-pages">
          <h4>
            <Eye size={16} />
            Top Active Pages
          </h4>
          <div className="pages-mini-list">
            {SAMPLE_PAGES.slice(0, 5).map((page, idx) => (
              <div key={page.path} className="page-mini">
                <span className="page-rank">{idx + 1}</span>
                <div className="page-info">
                  <span className="page-path">{page.path}</span>
                  <span className="page-title">{page.title}</span>
                </div>
                <span className="page-users">{page.activeUsers} users</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card traffic-sources">
          <h4>
            <Globe size={16} />
            Traffic Sources
          </h4>
          <div className="sources-mini-list">
            {SAMPLE_SOURCES.slice(0, 5).map((source) => (
              <div key={source.source} className={`source-mini ${source.type}`}>
                <div className="source-info">
                  {getSourceIcon(source.type)}
                  <span>{source.source}</span>
                </div>
                <div className="source-bar-wrap">
                  <div className="source-bar" style={{ width: `${source.percentage * 3}%` }} />
                </div>
                <span className="source-users">{source.users}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card recent-events">
          <h4>
            <Zap size={16} />
            Recent Events
          </h4>
          <div className="events-mini-list">
            {liveEvents.slice(0, 6).map((event) => (
              <div key={event.id} className={`event-mini ${event.type}`}>
                <div className="event-icon">{getEventIcon(event.type)}</div>
                <div className="event-info">
                  <span className="event-type">{event.type}</span>
                  <span className="event-page">{event.page}</span>
                </div>
                <span className="event-time">{formatTimeAgo(event.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="geo-preview">
        <div className="geo-preview-header">
          <h4>
            <Map size={16} />
            Geographic Distribution
          </h4>
          <button className="btn-text" onClick={() => setActiveTab('geo')}>
            View Full Map <Maximize2 size={14} />
          </button>
        </div>
        <div className="geo-bars">
          {SAMPLE_GEO_DATA.map((geo) => (
            <div key={geo.countryCode} className="geo-bar-item">
              <div className="geo-flag">{geo.countryCode}</div>
              <div className="geo-name">{geo.country}</div>
              <div className="geo-bar-wrap">
                <div className="geo-bar" style={{ width: `${geo.percentage * 2.5}%` }} />
              </div>
              <div className="geo-value">{geo.users}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="users-content">
      <div className="users-toolbar">
        <div className="search-box">
          <Filter size={16} />
          <input type="text" placeholder="Filter by country, page, device..." />
        </div>
        <div className="user-filters">
          <select>
            <option>All Devices</option>
            <option>Desktop</option>
            <option>Mobile</option>
            <option>Tablet</option>
          </select>
          <select>
            <option>All Countries</option>
            <option>United States</option>
            <option>Germany</option>
            <option>Japan</option>
          </select>
        </div>
      </div>

      <div className="users-table">
        <div className="table-header">
          <span>User</span>
          <span>Location</span>
          <span>Current Page</span>
          <span>Device</span>
          <span>Duration</span>
          <span>Events</span>
          <span>Actions</span>
        </div>
        {liveUsers.map((user) => (
          <div
            key={user.id}
            className="table-row"
            onClick={() => setSelectedUser(user)}
          >
            <div className="user-cell">
              <div className="user-avatar">
                <Activity size={14} />
              </div>
              <span className="user-id">#{user.id}</span>
            </div>
            <div className="location-cell">
              <span className="city">{user.city}</span>
              <span className="country">{user.country}</span>
            </div>
            <div className="page-cell">
              <span className="current-page">{user.page}</span>
              <span className="referrer">via {user.referrer}</span>
            </div>
            <div className="device-cell">
              {user.device === 'desktop' && <Monitor size={14} />}
              {user.device === 'mobile' && <Smartphone size={14} />}
              {user.device === 'tablet' && <Tablet size={14} />}
              <span>{user.browser}</span>
            </div>
            <div className="duration-cell">{formatDuration(user.duration)}</div>
            <div className="events-cell">{user.events}</div>
            <div className="actions-cell">
              <button className="btn-icon small">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="events-content">
      <div className="events-toolbar">
        <div className="event-type-filters">
          {['all', 'pageview', 'click', 'conversion', 'form', 'error'].map((type) => (
            <button key={type} className={`filter-btn ${type === 'all' ? 'active' : ''}`}>
              {type === 'all' ? 'All Events' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn-outline small">
          <Download size={14} />
          Export
        </button>
      </div>

      <div className="events-stream">
        {liveEvents.map((event) => (
          <div key={event.id} className={`event-card ${event.type}`}>
            <div className="event-type-icon">{getEventIcon(event.type)}</div>
            <div className="event-details">
              <div className="event-main">
                <span className="event-type-label">{event.type.toUpperCase()}</span>
                <span className="event-page-label">{event.page}</span>
              </div>
              {event.element && (
                <span className="event-element">{event.element}</span>
              )}
              {event.value && (
                <span className="event-value">${event.value}</span>
              )}
            </div>
            <div className="event-meta">
              <span className="event-user">User #{event.userId}</span>
              <span className="event-country">{event.country}</span>
              <span className="event-timestamp">{formatTimeAgo(event.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGeo = () => (
    <div className="geo-content">
      <div className="geo-map-placeholder">
        <Globe size={64} />
        <span>Interactive World Map</span>
        <p>Real-time user distribution across 47 countries</p>
      </div>

      <div className="geo-table">
        <div className="geo-table-header">
          <span>Country</span>
          <span>Active Users</span>
          <span>% of Total</span>
          <span>Trend</span>
        </div>
        {SAMPLE_GEO_DATA.map((geo) => (
          <div key={geo.countryCode} className="geo-table-row">
            <div className="country-cell">
              <span className="country-code">{geo.countryCode}</span>
              <span className="country-name">{geo.country}</span>
            </div>
            <div className="users-value">{geo.users}</div>
            <div className="percentage-cell">
              <div className="pct-bar-wrap">
                <div className="pct-bar" style={{ width: `${geo.percentage * 2.5}%` }} />
              </div>
              <span>{geo.percentage}%</span>
            </div>
            <div className="trend-cell">
              {Math.random() > 0.5 ? (
                <span className="trend positive">
                  <ArrowUp size={12} /> +{Math.floor(Math.random() * 15)}%
                </span>
              ) : (
                <span className="trend negative">
                  <ArrowDown size={12} /> -{Math.floor(Math.random() * 10)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPages = () => (
    <div className="pages-content">
      <div className="pages-toolbar">
        <div className="search-box">
          <Filter size={16} />
          <input type="text" placeholder="Search pages..." />
        </div>
        <select>
          <option>Sort by Active Users</option>
          <option>Sort by Avg. Time</option>
          <option>Sort by Bounce Rate</option>
        </select>
      </div>

      <div className="pages-table">
        <div className="pages-table-header">
          <span>Page</span>
          <span>Active Users</span>
          <span>Avg. Time</span>
          <span>Bounce Rate</span>
          <span>User Flow</span>
        </div>
        {SAMPLE_PAGES.map((page) => (
          <div key={page.path} className="pages-table-row">
            <div className="page-info-cell">
              <span className="page-path">{page.path}</span>
              <span className="page-title">{page.title}</span>
            </div>
            <div className="active-users-cell">
              <div className="users-indicator">
                <span className="users-count">{page.activeUsers}</span>
                <div className="users-dots">
                  {Array.from({ length: Math.min(10, Math.ceil(page.activeUsers / 15)) }, (_, i) => (
                    <span key={i} className="user-dot" />
                  ))}
                </div>
              </div>
            </div>
            <div className="avg-time-cell">{formatDuration(page.avgTime)}</div>
            <div className={`bounce-rate-cell ${page.bounceRate > 50 ? 'high' : page.bounceRate > 30 ? 'medium' : 'low'}`}>
              {page.bounceRate}%
            </div>
            <div className="flow-cell">
              <button className="btn-text small">View Flow</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="realtime-analytics">
      <header className="ra__header">
        <div className="ra__title-section">
          <div className="ra__icon">
            <Activity size={28} />
          </div>
          <div>
            <h1>Real-time Analytics</h1>
            <p>Live visitor activity and engagement metrics</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="live-status">
            <Wifi size={16} className={isLive ? 'connected' : ''} />
            <span>Last update: {formatTimeAgo(lastUpdate)}</span>
          </div>
          <button
            className={`btn-outline ${isLive ? 'active' : ''}`}
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? <Pause size={16} /> : <Play size={16} />}
            {isLive ? 'Pause' : 'Resume'}
          </button>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Settings size={16} />
            Configure
          </button>
        </div>
      </header>

      <div className="ra__metrics">
        {metrics.map((metric) => (
          <div key={metric.name} className="metric-card">
            <div className="metric-header">
              <span className="metric-label">{metric.name}</span>
              <span className={`metric-trend ${metric.trend}`}>
                {metric.trend === 'up' ? <ArrowUp size={12} /> : metric.trend === 'down' ? <ArrowDown size={12} /> : null}
                {Math.abs(((metric.value - metric.previousValue) / metric.previousValue) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="metric-value">
              {metric.unit === '$' && '$'}
              {metric.value.toLocaleString()}
              {metric.unit && metric.unit !== '$' && <span className="unit">{metric.unit}</span>}
            </div>
            <div className="metric-comparison">
              vs {metric.previousValue.toLocaleString()} (1h ago)
            </div>
          </div>
        ))}
      </div>

      <nav className="ra__tabs">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: 'Active Users', icon: Users, count: liveUsers.length },
          { id: 'events', label: 'Live Events', icon: Zap, count: liveEvents.length },
          { id: 'geo', label: 'Geography', icon: Globe },
          { id: 'pages', label: 'Pages', icon: Eye },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && <span className="tab-badge">{tab.count}</span>}
          </button>
        ))}
      </nav>

      <main className="ra__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'geo' && renderGeo()}
        {activeTab === 'pages' && renderPages()}
      </main>

      {selectedUser && (
        <div className="user-detail-overlay" onClick={() => setSelectedUser(null)}>
          <div className="user-detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <div className="detail-title">
                <div className="user-avatar large">
                  <Activity size={20} />
                </div>
                <div>
                  <h3>Session #{selectedUser.id}</h3>
                  <p>{selectedUser.city}, {selectedUser.country}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedUser(null)}>
                <XCircle size={20} />
              </button>
            </div>

            <div className="detail-section">
              <h4>Session Info</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Device</span>
                  <span className="info-value">{selectedUser.device}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Browser</span>
                  <span className="info-value">{selectedUser.browser}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Duration</span>
                  <span className="info-value">{formatDuration(selectedUser.duration)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Events</span>
                  <span className="info-value">{selectedUser.events}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Current Page</h4>
              <div className="current-page-info">
                <span className="page-path">{selectedUser.page}</span>
                <span className="referrer">Referred by {selectedUser.referrer}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Page Journey</h4>
              <div className="journey-list">
                <div className="journey-item">
                  <CheckCircle size={14} />
                  <span>/</span>
                  <span className="journey-time">0:00</span>
                </div>
                <div className="journey-item">
                  <CheckCircle size={14} />
                  <span>/features</span>
                  <span className="journey-time">0:45</span>
                </div>
                <div className="journey-item active">
                  <Activity size={14} />
                  <span>{selectedUser.page}</span>
                  <span className="journey-time">Now</span>
                </div>
              </div>
            </div>

            <div className="detail-actions">
              <button className="btn-outline">View Full Session</button>
              <button className="btn-primary">Send Message</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
