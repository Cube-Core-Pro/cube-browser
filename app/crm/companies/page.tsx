'use client';

import React, { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  Globe,
  MapPin,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit,
  Trash2,
  Star,
  StarOff,
  Link2,
  Briefcase,
  Activity,
  Target,
  FileText,
  ChevronRight,
  ChevronDown,
  Grid3X3,
  List,
  BarChart3,
  PieChart,
  Layers,
  Tag,
  Clock,
  Award,
  Zap,
  UserPlus,
  Settings,
  Download,
  Upload,
  RefreshCw,
  MessageSquare,
  Linkedin,
  Twitter
} from 'lucide-react';
import './companies.css';

interface Company {
  id: string;
  name: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  type: 'prospect' | 'customer' | 'partner' | 'vendor' | 'competitor';
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  revenue: number;
  employees: number;
  founded: number;
  owner: string;
  contacts: number;
  deals: number;
  totalValue: number;
  lastActivity: string;
  healthScore: number;
  tags: string[];
  isStarred: boolean;
  logo?: string;
  linkedin?: string;
  twitter?: string;
  description?: string;
}

interface CompanyStats {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}

interface RecentActivity {
  id: string;
  companyId: string;
  companyName: string;
  type: 'deal' | 'contact' | 'email' | 'call' | 'meeting' | 'note';
  description: string;
  timestamp: string;
  user: string;
}

export default function CompaniesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  const companies: Company[] = [
    {
      id: 'comp-001',
      name: 'TechCorp Industries',
      industry: 'Technology',
      size: 'enterprise',
      type: 'customer',
      website: 'techcorp.com',
      phone: '+1 (555) 100-0001',
      email: 'contact@techcorp.com',
      address: '100 Innovation Drive',
      city: 'San Francisco',
      country: 'USA',
      revenue: 500000000,
      employees: 5000,
      founded: 2005,
      owner: 'Sarah Johnson',
      contacts: 24,
      deals: 8,
      totalValue: 450000,
      lastActivity: '2 hours ago',
      healthScore: 92,
      tags: ['enterprise', 'tech', 'priority'],
      isStarred: true,
      linkedin: 'techcorp-industries',
      description: 'Leading technology solutions provider'
    },
    {
      id: 'comp-002',
      name: 'Global Finance Ltd',
      industry: 'Finance',
      size: 'enterprise',
      type: 'customer',
      website: 'globalfinance.com',
      phone: '+1 (555) 200-0002',
      email: 'info@globalfinance.com',
      address: '200 Wall Street',
      city: 'New York',
      country: 'USA',
      revenue: 2000000000,
      employees: 12000,
      founded: 1985,
      owner: 'Mike Chen',
      contacts: 42,
      deals: 12,
      totalValue: 890000,
      lastActivity: '1 day ago',
      healthScore: 88,
      tags: ['finance', 'enterprise', 'regulated'],
      isStarred: true,
      linkedin: 'global-finance-ltd'
    },
    {
      id: 'comp-003',
      name: 'StartupXYZ',
      industry: 'SaaS',
      size: 'startup',
      type: 'prospect',
      website: 'startupxyz.io',
      phone: '+1 (555) 300-0003',
      email: 'hello@startupxyz.io',
      address: '50 Tech Lane',
      city: 'Austin',
      country: 'USA',
      revenue: 5000000,
      employees: 45,
      founded: 2021,
      owner: 'Lisa Brown',
      contacts: 5,
      deals: 2,
      totalValue: 75000,
      lastActivity: '3 hours ago',
      healthScore: 75,
      tags: ['startup', 'saas', 'growth'],
      isStarred: false,
      twitter: 'startupxyz'
    },
    {
      id: 'comp-004',
      name: 'Healthcare Plus',
      industry: 'Healthcare',
      size: 'medium',
      type: 'customer',
      website: 'healthcareplus.org',
      phone: '+1 (555) 400-0004',
      email: 'contact@healthcareplus.org',
      address: '300 Medical Center Blvd',
      city: 'Boston',
      country: 'USA',
      revenue: 150000000,
      employees: 1200,
      founded: 2010,
      owner: 'James Wilson',
      contacts: 18,
      deals: 5,
      totalValue: 280000,
      lastActivity: '5 hours ago',
      healthScore: 85,
      tags: ['healthcare', 'compliance', 'mid-market'],
      isStarred: false
    },
    {
      id: 'comp-005',
      name: 'Manufacturing Co',
      industry: 'Manufacturing',
      size: 'enterprise',
      type: 'customer',
      website: 'manufacturingco.com',
      phone: '+1 (555) 500-0005',
      email: 'sales@manufacturingco.com',
      address: '500 Industrial Park',
      city: 'Detroit',
      country: 'USA',
      revenue: 800000000,
      employees: 8500,
      founded: 1975,
      owner: 'Sarah Johnson',
      contacts: 35,
      deals: 6,
      totalValue: 520000,
      lastActivity: '1 hour ago',
      healthScore: 78,
      tags: ['manufacturing', 'enterprise', 'legacy'],
      isStarred: true
    },
    {
      id: 'comp-006',
      name: 'Retail Giant Inc',
      industry: 'Retail',
      size: 'enterprise',
      type: 'prospect',
      website: 'retailgiant.com',
      phone: '+1 (555) 600-0006',
      email: 'partnerships@retailgiant.com',
      address: '600 Commerce Way',
      city: 'Chicago',
      country: 'USA',
      revenue: 3000000000,
      employees: 25000,
      founded: 1990,
      owner: 'Emily Davis',
      contacts: 12,
      deals: 3,
      totalValue: 180000,
      lastActivity: '2 days ago',
      healthScore: 65,
      tags: ['retail', 'enterprise', 'expansion'],
      isStarred: false
    },
    {
      id: 'comp-007',
      name: 'Strategic Partners',
      industry: 'Consulting',
      size: 'small',
      type: 'partner',
      website: 'strategicpartners.com',
      phone: '+1 (555) 700-0007',
      email: 'alliance@strategicpartners.com',
      address: '75 Consulting Row',
      city: 'Washington',
      country: 'USA',
      revenue: 25000000,
      employees: 120,
      founded: 2015,
      owner: 'Mike Chen',
      contacts: 8,
      deals: 4,
      totalValue: 95000,
      lastActivity: '6 hours ago',
      healthScore: 90,
      tags: ['partner', 'consulting', 'alliance'],
      isStarred: false
    },
    {
      id: 'comp-008',
      name: 'EduSolutions',
      industry: 'Education',
      size: 'medium',
      type: 'customer',
      website: 'edusolutions.edu',
      phone: '+1 (555) 800-0008',
      email: 'info@edusolutions.edu',
      address: '800 Learning Lane',
      city: 'Seattle',
      country: 'USA',
      revenue: 75000000,
      employees: 450,
      founded: 2012,
      owner: 'Lisa Brown',
      contacts: 15,
      deals: 7,
      totalValue: 320000,
      lastActivity: '4 hours ago',
      healthScore: 95,
      tags: ['education', 'government', 'expansion'],
      isStarred: true
    }
  ];

  const stats: CompanyStats[] = [
    { label: 'Total Companies', value: '1,284', change: 8.5, trend: 'up', icon: <Building2 className="w-5 h-5" /> },
    { label: 'Active Customers', value: '847', change: 12.3, trend: 'up', icon: <Users className="w-5 h-5" /> },
    { label: 'Total Revenue', value: '$12.4M', change: 18.7, trend: 'up', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Avg Deal Size', value: '$45.2K', change: -2.4, trend: 'down', icon: <Target className="w-5 h-5" /> },
    { label: 'Health Score', value: '82%', change: 3.2, trend: 'up', icon: <Activity className="w-5 h-5" /> }
  ];

  const recentActivities: RecentActivity[] = [
    { id: 'act-1', companyId: 'comp-001', companyName: 'TechCorp Industries', type: 'deal', description: 'New deal created: Enterprise License', timestamp: '2 hours ago', user: 'Sarah J.' },
    { id: 'act-2', companyId: 'comp-005', companyName: 'Manufacturing Co', type: 'meeting', description: 'Quarterly review meeting scheduled', timestamp: '3 hours ago', user: 'Mike C.' },
    { id: 'act-3', companyId: 'comp-008', companyName: 'EduSolutions', type: 'email', description: 'Contract renewal email sent', timestamp: '4 hours ago', user: 'Lisa B.' },
    { id: 'act-4', companyId: 'comp-003', companyName: 'StartupXYZ', type: 'call', description: 'Discovery call completed', timestamp: '5 hours ago', user: 'James W.' },
    { id: 'act-5', companyId: 'comp-002', companyName: 'Global Finance Ltd', type: 'note', description: 'Added compliance requirements note', timestamp: '6 hours ago', user: 'Emily D.' }
  ];

  const industryBreakdown = [
    { industry: 'Technology', count: 342, percentage: 26.6 },
    { industry: 'Finance', count: 256, percentage: 19.9 },
    { industry: 'Healthcare', count: 198, percentage: 15.4 },
    { industry: 'Manufacturing', count: 175, percentage: 13.6 },
    { industry: 'Retail', count: 156, percentage: 12.2 },
    { industry: 'Other', count: 157, percentage: 12.3 }
  ];

  const filterOptions = [
    { key: 'all', label: 'All Companies', count: companies.length },
    { key: 'customer', label: 'Customers', count: companies.filter(c => c.type === 'customer').length },
    { key: 'prospect', label: 'Prospects', count: companies.filter(c => c.type === 'prospect').length },
    { key: 'partner', label: 'Partners', count: companies.filter(c => c.type === 'partner').length },
    { key: 'starred', label: 'Starred', count: companies.filter(c => c.isStarred).length }
  ];

  const getSizeLabel = (size: Company['size']): string => {
    switch (size) {
      case 'startup': return '1-50';
      case 'small': return '51-200';
      case 'medium': return '201-1000';
      case 'enterprise': return '1000+';
    }
  };

  const getHealthColor = (score: number): string => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const formatRevenue = (amount: number): string => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || 
                         company.type === activeFilter ||
                         (activeFilter === 'starred' && company.isStarred);
    return matchesSearch && matchesFilter;
  });

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'deal': return <DollarSign className="w-4 h-4" />;
      case 'contact': return <UserPlus className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="companies-container">
      {/* Header */}
      <header className="companies-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1>Companies & Accounts</h1>
              <p>Manage your business relationships and accounts</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button className="btn-secondary">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Company
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon-wrapper">
                {stat.icon}
              </div>
              <div className="stat-content">
                <span className="stat-label">{stat.label}</span>
                <div className="stat-row">
                  <span className="stat-value">{stat.value}</span>
                  <span className={`stat-change ${stat.trend}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {Math.abs(stat.change)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="companies-content">
        {/* Sidebar */}
        <aside className="companies-sidebar">
          {/* Industry Breakdown */}
          <div className="sidebar-section">
            <h3>Industry Breakdown</h3>
            <div className="industry-list">
              {industryBreakdown.map((item, index) => (
                <div key={index} className="industry-item">
                  <div className="industry-info">
                    <span className="industry-name">{item.industry}</span>
                    <span className="industry-count">{item.count}</span>
                  </div>
                  <div className="industry-bar">
                    <div 
                      className="industry-fill" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="sidebar-section">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon type-${activity.type}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-content">
                    <span className="activity-company">{activity.companyName}</span>
                    <span className="activity-desc">{activity.description}</span>
                    <span className="activity-meta">
                      {activity.user} • {activity.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="sidebar-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <button className="quick-action-btn">
                <Zap className="w-4 h-4" />
                Enrich Data
              </button>
              <button className="quick-action-btn">
                <RefreshCw className="w-4 h-4" />
                Sync CRM
              </button>
              <button className="quick-action-btn">
                <BarChart3 className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </div>
        </aside>

        {/* Main List */}
        <main className="companies-main">
          {/* Filter Tabs */}
          <div className="filter-tabs">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                className={`filter-tab ${activeFilter === option.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(option.key)}
              >
                {option.label}
                <span className="tab-count">{option.count}</span>
              </button>
            ))}
          </div>

          {/* Search and View Toggle */}
          <div className="search-bar">
            <div className="search-input-wrapper">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Search companies by name, industry, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="search-actions">
              <button className="btn-filter">
                <Filter className="w-4 h-4" />
                More Filters
              </button>
              <div className="view-toggle">
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Companies List */}
          {viewMode === 'list' ? (
            <div className="companies-list">
              <div className="list-header">
                <div className="col-checkbox">
                  <input type="checkbox" />
                </div>
                <div className="col-company">Company</div>
                <div className="col-industry">Industry</div>
                <div className="col-contacts">Contacts</div>
                <div className="col-deals">Deals</div>
                <div className="col-value">Total Value</div>
                <div className="col-health">Health</div>
                <div className="col-actions">Actions</div>
              </div>
              {filteredCompanies.map((company) => (
                <div 
                  key={company.id} 
                  className={`company-row ${expandedCompany === company.id ? 'expanded' : ''}`}
                >
                  <div 
                    className="company-row-main"
                    onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}
                  >
                    <div className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" />
                    </div>
                    <div className="col-company">
                      <div className="company-info">
                        <div className="company-logo">
                          {company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="company-details">
                          <div className="company-name-row">
                            <h4>{company.name}</h4>
                            <button 
                              className={`star-btn ${company.isStarred ? 'starred' : ''}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {company.isStarred ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                            </button>
                            <span className={`type-badge type-${company.type}`}>{company.type}</span>
                          </div>
                          <div className="company-meta">
                            <span><Globe className="w-3 h-3" /> {company.website}</span>
                            <span><MapPin className="w-3 h-3" /> {company.city}, {company.country}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-industry">
                      <span className="industry-badge">{company.industry}</span>
                      <span className="size-info">
                        <Users className="w-3 h-3" />
                        {getSizeLabel(company.size)} employees
                      </span>
                    </div>
                    <div className="col-contacts">
                      <span className="count-value">{company.contacts}</span>
                      <span className="count-label">contacts</span>
                    </div>
                    <div className="col-deals">
                      <span className="count-value">{company.deals}</span>
                      <span className="count-label">active deals</span>
                    </div>
                    <div className="col-value">
                      <span className="value-amount">{formatCurrency(company.totalValue)}</span>
                      <span className="value-label">pipeline</span>
                    </div>
                    <div className="col-health">
                      <div className={`health-score ${getHealthColor(company.healthScore)}`}>
                        <div className="health-ring">
                          <svg viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeOpacity="0.2"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeDasharray={`${company.healthScore}, 100`}
                            />
                          </svg>
                          <span className="health-value">{company.healthScore}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button className="action-btn" title="View"><Eye className="w-4 h-4" /></button>
                        <button className="action-btn" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button className="action-btn"><MoreVertical className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                  {expandedCompany === company.id && (
                    <div className="company-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h5>Contact Information</h5>
                          <div className="info-list">
                            <div className="info-item">
                              <Phone className="w-4 h-4" />
                              <span>{company.phone}</span>
                            </div>
                            <div className="info-item">
                              <Mail className="w-4 h-4" />
                              <span>{company.email}</span>
                            </div>
                            <div className="info-item">
                              <MapPin className="w-4 h-4" />
                              <span>{company.address}, {company.city}</span>
                            </div>
                            {company.linkedin && (
                              <div className="info-item">
                                <Linkedin className="w-4 h-4" />
                                <span>{company.linkedin}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="expanded-section">
                          <h5>Company Details</h5>
                          <div className="info-list">
                            <div className="info-item">
                              <DollarSign className="w-4 h-4" />
                              <span>Revenue: {formatRevenue(company.revenue)}</span>
                            </div>
                            <div className="info-item">
                              <Users className="w-4 h-4" />
                              <span>Employees: {company.employees.toLocaleString()}</span>
                            </div>
                            <div className="info-item">
                              <Calendar className="w-4 h-4" />
                              <span>Founded: {company.founded}</span>
                            </div>
                            <div className="info-item">
                              <Briefcase className="w-4 h-4" />
                              <span>Owner: {company.owner}</span>
                            </div>
                          </div>
                        </div>
                        <div className="expanded-section">
                          <h5>Tags</h5>
                          <div className="tags-list">
                            {company.tags.map((tag, i) => (
                              <span key={i} className="tag">{tag}</span>
                            ))}
                          </div>
                          <p className="last-activity">
                            <Clock className="w-3 h-3" />
                            Last activity: {company.lastActivity}
                          </p>
                        </div>
                        <div className="expanded-actions">
                          <button className="btn-action">
                            <UserPlus className="w-4 h-4" />
                            Add Contact
                          </button>
                          <button className="btn-action">
                            <DollarSign className="w-4 h-4" />
                            Create Deal
                          </button>
                          <button className="btn-action primary">
                            <MessageSquare className="w-4 h-4" />
                            Send Message
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="companies-grid">
              {filteredCompanies.map((company) => (
                <div key={company.id} className="company-card">
                  <div className="card-header">
                    <div className="company-logo large">
                      {company.name.substring(0, 2).toUpperCase()}
                    </div>
                    <button className={`star-btn ${company.isStarred ? 'starred' : ''}`}>
                      {company.isStarred ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="card-body">
                    <h4>{company.name}</h4>
                    <span className={`type-badge type-${company.type}`}>{company.type}</span>
                    <div className="card-info">
                      <span className="industry-badge">{company.industry}</span>
                      <span className="location">
                        <MapPin className="w-3 h-3" />
                        {company.city}
                      </span>
                    </div>
                    <div className="card-stats">
                      <div className="stat-item">
                        <Users className="w-4 h-4" />
                        <span>{company.contacts}</span>
                      </div>
                      <div className="stat-item">
                        <Target className="w-4 h-4" />
                        <span>{company.deals}</span>
                      </div>
                      <div className="stat-item">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatCurrency(company.totalValue)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <div className={`health-mini ${getHealthColor(company.healthScore)}`}>
                      <Activity className="w-3 h-3" />
                      {company.healthScore}%
                    </div>
                    <div className="card-actions">
                      <button className="action-btn"><Eye className="w-4 h-4" /></button>
                      <button className="action-btn"><Edit className="w-4 h-4" /></button>
                      <button className="action-btn"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
