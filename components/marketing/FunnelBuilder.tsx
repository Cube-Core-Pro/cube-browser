'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Trash2,
  Edit,
  Eye,
  BarChart2,
  Users,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Settings,
  Download,
  DollarSign,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  X,
  Video,
  Clock,
  ArrowRight,
  Grip,
  Square,
  Mail,
  CreditCard,
  Tag,
  Globe,
  Smartphone,
  Monitor,
  Layout
} from 'lucide-react';
import './FunnelBuilder.css';

interface FunnelStep {
  id: string;
  type: 'landing' | 'optin' | 'sales' | 'checkout' | 'upsell' | 'downsell' | 'thankyou' | 'webinar' | 'membership';
  name: string;
  url: string;
  visitors: number;
  conversions: number;
  revenue: number;
  isActive: boolean;
}

interface Funnel {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'paused' | 'archived';
  type: 'sales' | 'lead' | 'webinar' | 'membership' | 'product-launch';
  steps: FunnelStep[];
  totalVisitors: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}

interface FunnelTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  steps: number;
  thumbnail: string;
  isPopular: boolean;
}

interface FunnelBuilderProps {
  onBack?: () => void;
}

export const FunnelBuilder: React.FC<FunnelBuilderProps> = ({
  onBack
}) => {
  const [view, setView] = useState<'list' | 'builder' | 'analytics'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedStep, setSelectedStep] = useState<FunnelStep | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const [funnels, setFunnels] = useState<Funnel[]>([
    {
      id: '1',
      name: 'Product Launch Funnel',
      status: 'active',
      type: 'product-launch',
      steps: [
        { id: 's1', type: 'landing', name: 'Landing Page', url: '/launch', visitors: 15420, conversions: 3856, revenue: 0, isActive: true },
        { id: 's2', type: 'optin', name: 'Email Capture', url: '/launch/signup', visitors: 3856, conversions: 2314, revenue: 0, isActive: true },
        { id: 's3', type: 'sales', name: 'Sales Page', url: '/launch/offer', visitors: 2314, conversions: 578, revenue: 28900, isActive: true },
        { id: 's4', type: 'checkout', name: 'Checkout', url: '/launch/checkout', visitors: 578, conversions: 462, revenue: 23100, isActive: true },
        { id: 's5', type: 'upsell', name: 'VIP Upsell', url: '/launch/vip', visitors: 462, conversions: 138, revenue: 13800, isActive: true },
        { id: 's6', type: 'thankyou', name: 'Thank You', url: '/launch/thanks', visitors: 462, conversions: 462, revenue: 0, isActive: true }
      ],
      totalVisitors: 15420,
      totalConversions: 462,
      totalRevenue: 65800,
      conversionRate: 3.0,
      createdAt: '2024-10-15',
      updatedAt: '2024-12-08'
    },
    {
      id: '2',
      name: 'Lead Magnet Funnel',
      status: 'active',
      type: 'lead',
      steps: [
        { id: 's1', type: 'landing', name: 'Free Guide Landing', url: '/guide', visitors: 28340, conversions: 8502, revenue: 0, isActive: true },
        { id: 's2', type: 'optin', name: 'Download Form', url: '/guide/download', visitors: 8502, conversions: 6802, revenue: 0, isActive: true },
        { id: 's3', type: 'thankyou', name: 'Thank You + Offer', url: '/guide/thanks', visitors: 6802, conversions: 680, revenue: 34000, isActive: true }
      ],
      totalVisitors: 28340,
      totalConversions: 6802,
      totalRevenue: 34000,
      conversionRate: 24.0,
      createdAt: '2024-08-20',
      updatedAt: '2024-12-07'
    },
    {
      id: '3',
      name: 'Webinar Registration',
      status: 'active',
      type: 'webinar',
      steps: [
        { id: 's1', type: 'landing', name: 'Webinar Landing', url: '/webinar', visitors: 12450, conversions: 4980, revenue: 0, isActive: true },
        { id: 's2', type: 'optin', name: 'Registration', url: '/webinar/register', visitors: 4980, conversions: 3486, revenue: 0, isActive: true },
        { id: 's3', type: 'webinar', name: 'Live Room', url: '/webinar/live', visitors: 2090, conversions: 627, revenue: 0, isActive: true },
        { id: 's4', type: 'sales', name: 'Replay Offer', url: '/webinar/offer', visitors: 627, conversions: 188, revenue: 18800, isActive: true }
      ],
      totalVisitors: 12450,
      totalConversions: 3486,
      totalRevenue: 18800,
      conversionRate: 28.0,
      createdAt: '2024-11-01',
      updatedAt: '2024-12-06'
    },
    {
      id: '4',
      name: 'Black Friday Sales Funnel',
      status: 'paused',
      type: 'sales',
      steps: [
        { id: 's1', type: 'landing', name: 'BF Landing', url: '/bf-sale', visitors: 45000, conversions: 18000, revenue: 0, isActive: false },
        { id: 's2', type: 'sales', name: 'Deal Page', url: '/bf-sale/deals', visitors: 18000, conversions: 5400, revenue: 162000, isActive: false },
        { id: 's3', type: 'checkout', name: 'Checkout', url: '/bf-sale/buy', visitors: 5400, conversions: 4320, revenue: 129600, isActive: false },
        { id: 's4', type: 'upsell', name: 'Bundle Upsell', url: '/bf-sale/bundle', visitors: 4320, conversions: 1296, revenue: 64800, isActive: false }
      ],
      totalVisitors: 45000,
      totalConversions: 4320,
      totalRevenue: 356400,
      conversionRate: 9.6,
      createdAt: '2024-11-15',
      updatedAt: '2024-11-30'
    },
    {
      id: '5',
      name: 'Membership Funnel',
      status: 'draft',
      type: 'membership',
      steps: [
        { id: 's1', type: 'landing', name: 'Membership Landing', url: '/members', visitors: 0, conversions: 0, revenue: 0, isActive: false },
        { id: 's2', type: 'sales', name: 'Pricing Page', url: '/members/pricing', visitors: 0, conversions: 0, revenue: 0, isActive: false },
        { id: 's3', type: 'checkout', name: 'Subscription', url: '/members/subscribe', visitors: 0, conversions: 0, revenue: 0, isActive: false },
        { id: 's4', type: 'membership', name: 'Member Area', url: '/members/dashboard', visitors: 0, conversions: 0, revenue: 0, isActive: false }
      ],
      totalVisitors: 0,
      totalConversions: 0,
      totalRevenue: 0,
      conversionRate: 0,
      createdAt: '2024-12-05',
      updatedAt: '2024-12-08'
    }
  ]);

  const [templates] = useState<FunnelTemplate[]>([
    { id: '1', name: 'Product Launch', description: 'Complete funnel for product launches with upsells', type: 'product-launch', steps: 6, thumbnail: '🚀', isPopular: true },
    { id: '2', name: 'Lead Magnet', description: 'Capture leads with a free resource offer', type: 'lead', steps: 3, thumbnail: '🎁', isPopular: true },
    { id: '3', name: 'Webinar Registration', description: 'Register and convert attendees to customers', type: 'webinar', steps: 4, thumbnail: '🎥', isPopular: true },
    { id: '4', name: 'E-commerce Sales', description: 'Direct sales funnel with cart abandonment', type: 'sales', steps: 5, thumbnail: '🛒', isPopular: false },
    { id: '5', name: 'Membership Site', description: 'Subscription-based membership funnel', type: 'membership', steps: 4, thumbnail: '👥', isPopular: false },
    { id: '6', name: 'Book Funnel', description: 'Sell books with tripwire and upsell sequence', type: 'sales', steps: 5, thumbnail: '📚', isPopular: false },
    { id: '7', name: 'Coaching Application', description: 'High-ticket coaching application funnel', type: 'lead', steps: 4, thumbnail: '💼', isPopular: false },
    { id: '8', name: 'Start from Scratch', description: 'Build your custom funnel step by step', type: 'custom', steps: 0, thumbnail: '✨', isPopular: false }
  ]);

  const stepTypes = [
    { type: 'landing', icon: <Globe size={18} />, label: 'Landing Page', color: '#3b82f6' },
    { type: 'optin', icon: <Mail size={18} />, label: 'Opt-in Page', color: '#8b5cf6' },
    { type: 'sales', icon: <DollarSign size={18} />, label: 'Sales Page', color: '#10b981' },
    { type: 'checkout', icon: <CreditCard size={18} />, label: 'Checkout', color: '#f59e0b' },
    { type: 'upsell', icon: <TrendingUp size={18} />, label: 'Upsell', color: '#ec4899' },
    { type: 'downsell', icon: <Tag size={18} />, label: 'Downsell', color: '#06b6d4' },
    { type: 'thankyou', icon: <CheckCircle size={18} />, label: 'Thank You', color: '#84cc16' },
    { type: 'webinar', icon: <Video size={18} />, label: 'Webinar', color: '#f97316' },
    { type: 'membership', icon: <Users size={18} />, label: 'Membership', color: '#a855f7' }
  ];

  const filteredFunnels = useMemo(() => {
    return funnels.filter(funnel => {
      const matchesSearch = funnel.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || funnel.status === statusFilter;
      const matchesType = typeFilter === 'all' || funnel.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [funnels, searchQuery, statusFilter, typeFilter]);

  const totalStats = useMemo(() => {
    const activeFunnels = funnels.filter(f => f.status === 'active');
    return {
      activeFunnels: activeFunnels.length,
      totalVisitors: funnels.reduce((sum, f) => sum + f.totalVisitors, 0),
      totalConversions: funnels.reduce((sum, f) => sum + f.totalConversions, 0),
      totalRevenue: funnels.reduce((sum, f) => sum + f.totalRevenue, 0),
      avgConversionRate: activeFunnels.length > 0
        ? activeFunnels.reduce((sum, f) => sum + f.conversionRate, 0) / activeFunnels.length
        : 0
    };
  }, [funnels]);

  const handleEditFunnel = useCallback((funnel: Funnel) => {
    setSelectedFunnel(funnel);
    setView('builder');
  }, []);

  const handleViewAnalytics = useCallback((funnel: Funnel) => {
    setSelectedFunnel(funnel);
    setView('analytics');
  }, []);

  const handleUpdateFunnelName = useCallback((name: string) => {
    if (!selectedFunnel) return;
    const updated = { ...selectedFunnel, name, updatedAt: new Date().toISOString() };
    setSelectedFunnel(updated);
    setFunnels(prev => prev.map(f => f.id === updated.id ? updated : f));
  }, [selectedFunnel]);

  const handleUpdateStepProperty = useCallback(<K extends keyof FunnelStep>(property: K, value: FunnelStep[K]) => {
    if (!selectedStep || !selectedFunnel) return;
    const updatedStep = { ...selectedStep, [property]: value };
    setSelectedStep(updatedStep);
    const updatedFunnel = {
      ...selectedFunnel,
      steps: selectedFunnel.steps.map(s => s.id === updatedStep.id ? updatedStep : s),
      updatedAt: new Date().toISOString()
    };
    setSelectedFunnel(updatedFunnel);
    setFunnels(prev => prev.map(f => f.id === updatedFunnel.id ? updatedFunnel : f));
  }, [selectedStep, selectedFunnel]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStepIcon = (type: string) => {
    const stepType = stepTypes.find(s => s.type === type);
    return stepType ? stepType.icon : <Square size={18} />;
  };

  const getStepColor = (type: string) => {
    const stepType = stepTypes.find(s => s.type === type);
    return stepType ? stepType.color : '#6b7280';
  };

  const renderListView = () => (
    <>
      <div className="funnel-header">
        <div className="header-left">
          {onBack && (
            <button className="btn-back" onClick={onBack}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1><Layers size={24} /> Funnel Builder</h1>
            <p className="header-subtitle">Create and optimize high-converting sales funnels</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-ai">
            <Sparkles size={16} />
            AI Funnel Wizard
          </button>
          <button className="btn-primary" onClick={() => setShowTemplates(true)}>
            <Plus size={16} />
            New Funnel
          </button>
        </div>
      </div>

      <div className="funnel-stats">
        <div className="stat-card">
          <div className="stat-icon funnels">
            <Layers size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalStats.activeFunnels}</span>
            <span className="stat-label">Active Funnels</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon visitors">
            <Users size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatNumber(totalStats.totalVisitors)}</span>
            <span className="stat-label">Total Visitors</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon conversions">
            <Target size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalStats.avgConversionRate.toFixed(1)}%</span>
            <span className="stat-label">Avg Conversion</span>
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-icon revenue">
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(totalStats.totalRevenue)}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>
      </div>

      <div className="funnel-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search funnels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={`btn-filter ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="sales">Sales Funnel</option>
              <option value="lead">Lead Generation</option>
              <option value="webinar">Webinar</option>
              <option value="membership">Membership</option>
              <option value="product-launch">Product Launch</option>
            </select>
          </div>
          <button className="btn-text" onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}>
            Clear Filters
          </button>
        </div>
      )}

      <div className="funnels-grid">
        {filteredFunnels.map(funnel => (
          <div key={funnel.id} className={`funnel-card ${funnel.status}`}>
            <div className="funnel-card-header">
              <div className="funnel-info">
                <span className={`status-indicator ${funnel.status}`} />
                <div>
                  <h3>{funnel.name}</h3>
                  <span className="funnel-type">{funnel.type.replace('-', ' ')}</span>
                </div>
              </div>
              <button className="btn-icon">
                <MoreVertical size={18} />
              </button>
            </div>

            <div className="funnel-steps-preview">
              {funnel.steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div
                    className="step-preview"
                    style={{ borderColor: getStepColor(step.type) }}
                    title={step.name}
                  >
                    <span style={{ color: getStepColor(step.type) }}>
                      {getStepIcon(step.type)}
                    </span>
                  </div>
                  {index < funnel.steps.length - 1 && (
                    <ArrowRight size={14} className="step-arrow" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="funnel-metrics">
              <div className="metric">
                <span className="metric-value">{formatNumber(funnel.totalVisitors)}</span>
                <span className="metric-label">Visitors</span>
              </div>
              <div className="metric">
                <span className="metric-value">{funnel.conversionRate}%</span>
                <span className="metric-label">Conv. Rate</span>
              </div>
              <div className="metric highlight">
                <span className="metric-value">{formatCurrency(funnel.totalRevenue)}</span>
                <span className="metric-label">Revenue</span>
              </div>
            </div>

            <div className="funnel-card-footer">
              <span className="updated-date">
                <Clock size={12} />
                Updated {funnel.updatedAt}
              </span>
              <div className="funnel-actions">
                <button className="btn-icon" title="Analytics" onClick={() => handleViewAnalytics(funnel)}>
                  <BarChart2 size={16} />
                </button>
                <button className="btn-icon" title="Edit" onClick={() => handleEditFunnel(funnel)}>
                  <Edit size={16} />
                </button>
                <button className="btn-icon" title="Preview">
                  <Eye size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showTemplates && (
        <div className="templates-modal">
          <div className="templates-modal-content">
            <div className="modal-header">
              <h2>Choose a Funnel Template</h2>
              <button className="btn-close" onClick={() => setShowTemplates(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="templates-grid">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`template-card ${template.isPopular ? 'popular' : ''}`}
                  onClick={() => {
                    setShowTemplates(false);
                    setView('builder');
                  }}
                >
                  {template.isPopular && <span className="popular-badge">Popular</span>}
                  <div className="template-icon">{template.thumbnail}</div>
                  <div className="template-info">
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                    <span className="template-steps">{template.steps} steps</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderBuilderView = () => {
    const funnel = selectedFunnel || {
      id: 'new',
      name: 'New Funnel',
      status: 'draft' as const,
      type: 'sales' as const,
      steps: [],
      totalVisitors: 0,
      totalConversions: 0,
      totalRevenue: 0,
      conversionRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return (
      <div className="builder-container">
        <div className="builder-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => { setView('list'); setSelectedFunnel(null); }}>
              <ArrowLeft size={18} />
            </button>
            <div className="funnel-name-input">
              <input
                type="text"
                value={funnel.name}
                onChange={(e) => handleUpdateFunnelName(e.target.value)}
                placeholder="Funnel Name"
              />
              <span className={`status-badge ${funnel.status}`}>{funnel.status}</span>
            </div>
          </div>
          <div className="header-center">
            <div className="device-switcher">
              <button
                className={previewDevice === 'desktop' ? 'active' : ''}
                onClick={() => setPreviewDevice('desktop')}
                title="Desktop"
              >
                <Monitor size={18} />
              </button>
              <button
                className={previewDevice === 'tablet' ? 'active' : ''}
                onClick={() => setPreviewDevice('tablet')}
                title="Tablet"
              >
                <Layout size={18} />
              </button>
              <button
                className={previewDevice === 'mobile' ? 'active' : ''}
                onClick={() => setPreviewDevice('mobile')}
                title="Mobile"
              >
                <Smartphone size={18} />
              </button>
            </div>
          </div>
          <div className="header-right">
            <button className="btn-secondary">
              <Eye size={16} />
              Preview
            </button>
            <button className="btn-primary">
              <CheckCircle size={16} />
              Publish
            </button>
          </div>
        </div>

        <div className="builder-workspace">
          <div className="steps-sidebar">
            <div className="sidebar-section">
              <h3>Add Step</h3>
              <div className="step-types">
                {stepTypes.map(stepType => (
                  <div
                    key={stepType.type}
                    className="step-type-item"
                    draggable
                    style={{ '--step-color': stepType.color } as React.CSSProperties}
                  >
                    <span className="step-type-icon" style={{ color: stepType.color }}>
                      {stepType.icon}
                    </span>
                    <span className="step-type-label">{stepType.label}</span>
                    <Grip size={14} className="drag-handle" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="funnel-canvas">
            <div className="canvas-content">
              {funnel.steps.length === 0 ? (
                <div className="empty-canvas">
                  <div className="empty-icon">
                    <Layers size={48} />
                  </div>
                  <h3>Start Building Your Funnel</h3>
                  <p>Drag steps from the sidebar or click to add your first page</p>
                  <button className="btn-primary">
                    <Plus size={16} />
                    Add First Step
                  </button>
                </div>
              ) : (
                <div className="funnel-flow">
                  {funnel.steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <div
                        className={`funnel-step ${selectedStep?.id === step.id ? 'selected' : ''}`}
                        onClick={() => setSelectedStep(step)}
                        style={{ '--step-color': getStepColor(step.type) } as React.CSSProperties}
                      >
                        <div className="step-header">
                          <span className="step-icon" style={{ background: getStepColor(step.type) }}>
                            {getStepIcon(step.type)}
                          </span>
                          <div className="step-info">
                            <span className="step-name">{step.name}</span>
                            <span className="step-url">{step.url}</span>
                          </div>
                          <button className="btn-icon">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                        <div className="step-stats">
                          <div className="step-stat">
                            <span className="stat-value">{formatNumber(step.visitors)}</span>
                            <span className="stat-label">Visitors</span>
                          </div>
                          <div className="step-stat">
                            <span className="stat-value">
                              {step.visitors > 0 ? ((step.conversions / step.visitors) * 100).toFixed(1) : 0}%
                            </span>
                            <span className="stat-label">Conv.</span>
                          </div>
                          <div className="step-stat">
                            <span className="stat-value">{formatCurrency(step.revenue)}</span>
                            <span className="stat-label">Revenue</span>
                          </div>
                        </div>
                        <div className="step-actions">
                          <button className="btn-sm">
                            <Edit size={14} />
                            Edit Page
                          </button>
                          <button className="btn-sm">
                            <Settings size={14} />
                            Settings
                          </button>
                        </div>
                      </div>
                      {index < funnel.steps.length - 1 && (
                        <div className="step-connector">
                          <div className="connector-line" />
                          <div className="connector-arrow">
                            <ArrowRight size={16} />
                          </div>
                          <div className="connector-stats">
                            <span>{((funnel.steps[index + 1].visitors / step.visitors) * 100 || 0).toFixed(0)}%</span>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                  <div className="add-step-btn">
                    <button className="btn-add-step">
                      <Plus size={18} />
                      Add Step
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedStep && (
            <div className="step-editor">
              <div className="editor-header">
                <h3>Step Settings</h3>
                <button className="btn-close" onClick={() => setSelectedStep(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="editor-content">
                <div className="form-group">
                  <label>Page Name</label>
                  <input type="text" value={selectedStep.name} onChange={(e) => handleUpdateStepProperty('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>URL Path</label>
                  <input type="text" value={selectedStep.url} onChange={(e) => handleUpdateStepProperty('url', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Step Type</label>
                  <select value={selectedStep.type} onChange={(e) => handleUpdateStepProperty('type', e.target.value as FunnelStep['type'])}>
                    {stepTypes.map(type => (
                      <option key={type.type} value={type.type}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="editor-section">
                  <h4>Actions</h4>
                  <div className="editor-actions">
                    <button className="btn-editor">
                      <Edit size={16} />
                      Edit Page Design
                    </button>
                    <button className="btn-editor">
                      <Copy size={16} />
                      Duplicate Step
                    </button>
                    <button className="btn-editor danger">
                      <Trash2 size={16} />
                      Delete Step
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAnalyticsView = () => {
    if (!selectedFunnel) return null;

    return (
      <>
        <div className="funnel-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => { setView('list'); setSelectedFunnel(null); }}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1><BarChart2 size={24} /> Funnel Analytics</h1>
              <p className="header-subtitle">{selectedFunnel.name}</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary">
              <Download size={16} />
              Export Report
            </button>
            <button className="btn-primary" onClick={() => handleEditFunnel(selectedFunnel)}>
              <Edit size={16} />
              Edit Funnel
            </button>
          </div>
        </div>

        <div className="analytics-overview">
          <div className="analytics-card main">
            <h3>Funnel Performance</h3>
            <div className="funnel-visualization">
              {selectedFunnel.steps.map((step, index) => {
                const prevVisitors = index > 0 ? selectedFunnel.steps[index - 1].visitors : step.visitors;
                const dropOff = prevVisitors > 0 ? ((prevVisitors - step.visitors) / prevVisitors * 100) : 0;
                const width = selectedFunnel.steps[0].visitors > 0
                  ? (step.visitors / selectedFunnel.steps[0].visitors) * 100
                  : 100;

                return (
                  <div key={step.id} className="funnel-stage">
                    <div className="stage-bar-container">
                      <div
                        className="stage-bar"
                        style={{
                          width: `${Math.max(width, 10)}%`,
                          background: getStepColor(step.type)
                        }}
                      >
                        <span className="stage-count">{formatNumber(step.visitors)}</span>
                      </div>
                    </div>
                    <div className="stage-info">
                      <span className="stage-name">{step.name}</span>
                      {index > 0 && (
                        <span className="stage-dropoff">-{dropOff.toFixed(1)}% drop</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="analytics-card">
            <h3>Key Metrics</h3>
            <div className="key-metrics">
              <div className="key-metric">
                <span className="metric-label">Total Visitors</span>
                <span className="metric-value">{formatNumber(selectedFunnel.totalVisitors)}</span>
              </div>
              <div className="key-metric">
                <span className="metric-label">Total Conversions</span>
                <span className="metric-value">{formatNumber(selectedFunnel.totalConversions)}</span>
              </div>
              <div className="key-metric">
                <span className="metric-label">Conversion Rate</span>
                <span className="metric-value">{selectedFunnel.conversionRate}%</span>
              </div>
              <div className="key-metric highlight">
                <span className="metric-label">Total Revenue</span>
                <span className="metric-value">{formatCurrency(selectedFunnel.totalRevenue)}</span>
              </div>
              <div className="key-metric">
                <span className="metric-label">Revenue per Visitor</span>
                <span className="metric-value">
                  {formatCurrency(selectedFunnel.totalVisitors > 0
                    ? selectedFunnel.totalRevenue / selectedFunnel.totalVisitors
                    : 0
                  )}
                </span>
              </div>
              <div className="key-metric">
                <span className="metric-label">Avg Order Value</span>
                <span className="metric-value">
                  {formatCurrency(selectedFunnel.totalConversions > 0
                    ? selectedFunnel.totalRevenue / selectedFunnel.totalConversions
                    : 0
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="step-analytics">
          <h3>Step-by-Step Analysis</h3>
          <div className="steps-table">
            <table>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Visitors</th>
                  <th>Conversions</th>
                  <th>Conv. Rate</th>
                  <th>Drop-off</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {selectedFunnel.steps.map((step, index) => {
                  const prevVisitors = index > 0 ? selectedFunnel.steps[index - 1].visitors : step.visitors;
                  const convRate = step.visitors > 0 ? (step.conversions / step.visitors * 100) : 0;
                  const dropOff = index > 0 && prevVisitors > 0
                    ? ((prevVisitors - step.visitors) / prevVisitors * 100)
                    : 0;

                  return (
                    <tr key={step.id}>
                      <td>
                        <div className="step-cell">
                          <span className="step-icon-sm" style={{ background: getStepColor(step.type) }}>
                            {getStepIcon(step.type)}
                          </span>
                          <div>
                            <span className="step-name">{step.name}</span>
                            <span className="step-url">{step.url}</span>
                          </div>
                        </div>
                      </td>
                      <td>{formatNumber(step.visitors)}</td>
                      <td>{formatNumber(step.conversions)}</td>
                      <td>
                        <span className={`rate ${convRate > 50 ? 'high' : convRate > 20 ? 'medium' : 'low'}`}>
                          {convRate.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        {index > 0 ? (
                          <span className={`dropoff ${dropOff > 50 ? 'high' : dropOff > 30 ? 'medium' : 'low'}`}>
                            -{dropOff.toFixed(1)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="revenue">{formatCurrency(step.revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ai-recommendations">
          <h3><Sparkles size={18} /> AI Optimization Suggestions</h3>
          <div className="recommendations-grid">
            <div className="recommendation-card opportunity">
              <div className="recommendation-icon">
                <TrendingUp size={20} />
              </div>
              <div className="recommendation-content">
                <h4>Improve Sales Page Conversion</h4>
                <p>Your sales page has a 25% conversion rate. Adding social proof and urgency elements could increase conversions by 15-20%.</p>
                <button className="btn-action">Apply Suggestions</button>
              </div>
            </div>
            <div className="recommendation-card warning">
              <div className="recommendation-icon">
                <AlertCircle size={20} />
              </div>
              <div className="recommendation-content">
                <h4>High Drop-off at Checkout</h4>
                <p>60% of visitors abandon at checkout. Consider adding trust badges, reducing form fields, or offering multiple payment options.</p>
                <button className="btn-action">View Solutions</button>
              </div>
            </div>
            <div className="recommendation-card insight">
              <div className="recommendation-icon">
                <Zap size={20} />
              </div>
              <div className="recommendation-content">
                <h4>A/B Test Opportunity</h4>
                <p>Test different headline variations on your landing page. Our AI predicts a potential 12% lift in opt-ins.</p>
                <button className="btn-action">Create A/B Test</button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="funnel-builder">
      {view === 'list' && renderListView()}
      {view === 'builder' && renderBuilderView()}
      {view === 'analytics' && renderAnalyticsView()}
    </div>
  );
};

export default FunnelBuilder;
