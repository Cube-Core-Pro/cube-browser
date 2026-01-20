'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Star,
  StarOff,
  Tag,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  DollarSign,
  Target,
  Users,
  Zap,
  ChevronRight,
  ChevronDown,
  BarChart3,
  RefreshCw,
  Upload,
  Download,
  Grid3X3,
  List,
  Briefcase,
  Globe,
  Linkedin,
  Twitter,
  Award,
  Flame
} from 'lucide-react';
import './leads.css';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  industry: string;
  location: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  score: number;
  value: number;
  assignedTo: string;
  createdAt: string;
  lastActivity: string;
  tags: string[];
  isStarred: boolean;
  engagement: 'hot' | 'warm' | 'cold';
  website?: string;
  linkedin?: string;
  notes?: string;
}

interface LeadSource {
  name: string;
  count: number;
  conversion: number;
  icon: React.ReactNode;
}

interface LeadStats {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
}

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const leads: Lead[] = [
    {
      id: 'lead-001',
      firstName: 'Michael',
      lastName: 'Thompson',
      email: 'michael.thompson@techcorp.com',
      phone: '+1 (555) 123-4567',
      company: 'TechCorp Industries',
      jobTitle: 'VP of Engineering',
      industry: 'Technology',
      location: 'San Francisco, CA',
      source: 'LinkedIn',
      status: 'qualified',
      score: 92,
      value: 85000,
      assignedTo: 'Sarah Johnson',
      createdAt: '2026-01-05',
      lastActivity: '2 hours ago',
      tags: ['enterprise', 'high-value', 'tech'],
      isStarred: true,
      engagement: 'hot',
      website: 'techcorp.com',
      linkedin: 'michael-thompson-tech'
    },
    {
      id: 'lead-002',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.r@globalfinance.com',
      phone: '+1 (555) 234-5678',
      company: 'Global Finance Ltd',
      jobTitle: 'Director of Operations',
      industry: 'Finance',
      location: 'New York, NY',
      source: 'Website',
      status: 'proposal',
      score: 88,
      value: 120000,
      assignedTo: 'Mike Chen',
      createdAt: '2026-01-03',
      lastActivity: '1 day ago',
      tags: ['finance', 'enterprise'],
      isStarred: true,
      engagement: 'hot',
      website: 'globalfinance.com'
    },
    {
      id: 'lead-003',
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@startupxyz.io',
      phone: '+1 (555) 345-6789',
      company: 'StartupXYZ',
      jobTitle: 'CEO',
      industry: 'SaaS',
      location: 'Austin, TX',
      source: 'Referral',
      status: 'contacted',
      score: 75,
      value: 45000,
      assignedTo: 'Lisa Brown',
      createdAt: '2026-01-07',
      lastActivity: '3 hours ago',
      tags: ['startup', 'saas', 'growth'],
      isStarred: false,
      engagement: 'warm',
      linkedin: 'davidkim-ceo'
    },
    {
      id: 'lead-004',
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'swilliams@healthcare-plus.org',
      phone: '+1 (555) 456-7890',
      company: 'Healthcare Plus',
      jobTitle: 'CTO',
      industry: 'Healthcare',
      location: 'Boston, MA',
      source: 'Webinar',
      status: 'new',
      score: 68,
      value: 75000,
      assignedTo: 'James Wilson',
      createdAt: '2026-01-08',
      lastActivity: '5 hours ago',
      tags: ['healthcare', 'compliance'],
      isStarred: false,
      engagement: 'warm'
    },
    {
      id: 'lead-005',
      firstName: 'Robert',
      lastName: 'Johnson',
      email: 'rjohnson@manufacturing-co.com',
      phone: '+1 (555) 567-8901',
      company: 'Manufacturing Co',
      jobTitle: 'Plant Manager',
      industry: 'Manufacturing',
      location: 'Detroit, MI',
      source: 'Trade Show',
      status: 'negotiation',
      score: 85,
      value: 95000,
      assignedTo: 'Sarah Johnson',
      createdAt: '2025-12-20',
      lastActivity: '1 hour ago',
      tags: ['manufacturing', 'enterprise'],
      isStarred: true,
      engagement: 'hot'
    },
    {
      id: 'lead-006',
      firstName: 'Jennifer',
      lastName: 'Martinez',
      email: 'jmartinez@retail-giant.com',
      phone: '+1 (555) 678-9012',
      company: 'Retail Giant Inc',
      jobTitle: 'Head of Digital',
      industry: 'Retail',
      location: 'Chicago, IL',
      source: 'Google Ads',
      status: 'qualified',
      score: 79,
      value: 65000,
      assignedTo: 'Emily Davis',
      createdAt: '2026-01-02',
      lastActivity: '1 day ago',
      tags: ['retail', 'digital-transformation'],
      isStarred: false,
      engagement: 'warm'
    },
    {
      id: 'lead-007',
      firstName: 'Alex',
      lastName: 'Brown',
      email: 'alex.b@consulting-firm.com',
      phone: '+1 (555) 789-0123',
      company: 'Strategic Consulting',
      jobTitle: 'Partner',
      industry: 'Consulting',
      location: 'Washington, DC',
      source: 'Email Campaign',
      status: 'contacted',
      score: 62,
      value: 35000,
      assignedTo: 'Mike Chen',
      createdAt: '2026-01-06',
      lastActivity: '2 days ago',
      tags: ['consulting', 'b2b'],
      isStarred: false,
      engagement: 'cold'
    },
    {
      id: 'lead-008',
      firstName: 'Amanda',
      lastName: 'Davis',
      email: 'amanda.davis@edu-solutions.edu',
      phone: '+1 (555) 890-1234',
      company: 'EduSolutions',
      jobTitle: 'Director of IT',
      industry: 'Education',
      location: 'Seattle, WA',
      source: 'Content Download',
      status: 'won',
      score: 95,
      value: 110000,
      assignedTo: 'Lisa Brown',
      createdAt: '2025-12-15',
      lastActivity: '3 days ago',
      tags: ['education', 'government'],
      isStarred: false,
      engagement: 'hot'
    }
  ];

  const stats: LeadStats[] = [
    { label: 'Total Leads', value: '2,847', change: 12.5, trend: 'up' },
    { label: 'Qualified', value: '892', change: 8.3, trend: 'up' },
    { label: 'Conversion Rate', value: '24.3%', change: 2.1, trend: 'up' },
    { label: 'Avg. Lead Score', value: '72', change: -1.5, trend: 'down' },
    { label: 'Pipeline Value', value: '$4.2M', change: 15.8, trend: 'up' },
    { label: 'Avg. Response Time', value: '2.4h', change: -18.2, trend: 'up' }
  ];

  const leadSources: LeadSource[] = [
    { name: 'LinkedIn', count: 456, conversion: 32.5, icon: <Linkedin className="w-4 h-4" /> },
    { name: 'Website', count: 892, conversion: 28.4, icon: <Globe className="w-4 h-4" /> },
    { name: 'Referral', count: 234, conversion: 45.2, icon: <Users className="w-4 h-4" /> },
    { name: 'Google Ads', count: 567, conversion: 18.7, icon: <Target className="w-4 h-4" /> },
    { name: 'Email Campaign', count: 345, conversion: 22.1, icon: <Mail className="w-4 h-4" /> },
    { name: 'Events', count: 189, conversion: 35.8, icon: <Calendar className="w-4 h-4" /> }
  ];

  const statusStages = [
    { key: 'all', label: 'All Leads', count: leads.length },
    { key: 'new', label: 'New', count: leads.filter(l => l.status === 'new').length },
    { key: 'contacted', label: 'Contacted', count: leads.filter(l => l.status === 'contacted').length },
    { key: 'qualified', label: 'Qualified', count: leads.filter(l => l.status === 'qualified').length },
    { key: 'proposal', label: 'Proposal', count: leads.filter(l => l.status === 'proposal').length },
    { key: 'negotiation', label: 'Negotiation', count: leads.filter(l => l.status === 'negotiation').length },
    { key: 'won', label: 'Won', count: leads.filter(l => l.status === 'won').length },
    { key: 'lost', label: 'Lost', count: leads.filter(l => l.status === 'lost').length }
  ];

  const getEngagementIcon = (engagement: Lead['engagement']) => {
    switch (engagement) {
      case 'hot': return <Flame className="w-4 h-4" />;
      case 'warm': return <TrendingUp className="w-4 h-4" />;
      case 'cold': return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = activeStatus === 'all' || lead.status === activeStatus;
    return matchesSearch && matchesStatus;
  });

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  return (
    <div className="leads-container">
      {/* Header */}
      <header className="leads-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <h1>Lead Management</h1>
              <p>Track, nurture, and convert your leads into customers</p>
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
              Add Lead
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-header">
                <span className="stat-label">{stat.label}</span>
                <span className={`stat-change ${stat.trend}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(stat.change)}%
                </span>
              </div>
              <div className="stat-value">{stat.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="leads-content">
        {/* Sidebar - Lead Sources */}
        <aside className="leads-sidebar">
          <div className="sidebar-section">
            <h3>Lead Sources</h3>
            <div className="sources-list">
              {leadSources.map((source, index) => (
                <div key={index} className="source-item">
                  <div className="source-icon">{source.icon}</div>
                  <div className="source-info">
                    <span className="source-name">{source.name}</span>
                    <span className="source-stats">{source.count} leads • {source.conversion}% conv.</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Quick Filters</h3>
            <div className="quick-filters">
              <button className="filter-btn active">
                <Star className="w-4 h-4" />
                Starred ({leads.filter(l => l.isStarred).length})
              </button>
              <button className="filter-btn">
                <Flame className="w-4 h-4" />
                Hot Leads ({leads.filter(l => l.engagement === 'hot').length})
              </button>
              <button className="filter-btn">
                <Clock className="w-4 h-4" />
                Needs Follow-up (12)
              </button>
              <button className="filter-btn">
                <AlertCircle className="w-4 h-4" />
                At Risk (5)
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Team Performance</h3>
            <div className="team-performance">
              <div className="team-member">
                <div className="member-avatar">SJ</div>
                <div className="member-info">
                  <span className="member-name">Sarah Johnson</span>
                  <span className="member-stats">45 leads • 32% conv.</span>
                </div>
              </div>
              <div className="team-member">
                <div className="member-avatar">MC</div>
                <div className="member-info">
                  <span className="member-name">Mike Chen</span>
                  <span className="member-stats">38 leads • 28% conv.</span>
                </div>
              </div>
              <div className="team-member">
                <div className="member-avatar">LB</div>
                <div className="member-info">
                  <span className="member-name">Lisa Brown</span>
                  <span className="member-stats">42 leads • 35% conv.</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Lead List */}
        <main className="leads-main">
          {/* Pipeline Status */}
          <div className="pipeline-status">
            {statusStages.map((stage) => (
              <button
                key={stage.key}
                className={`pipeline-stage ${activeStatus === stage.key ? 'active' : ''}`}
                onClick={() => setActiveStatus(stage.key)}
              >
                <span className="stage-label">{stage.label}</span>
                <span className="stage-count">{stage.count}</span>
              </button>
            ))}
          </div>

          {/* Filters Bar */}
          <div className="filters-bar">
            <div className="search-box">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Search leads by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-actions">
              <button className="btn-filter">
                <Filter className="w-4 h-4" />
                Filters
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

          {/* Bulk Actions */}
          {selectedLeads.length > 0 && (
            <div className="bulk-actions">
              <span className="selected-count">{selectedLeads.length} selected</span>
              <div className="bulk-buttons">
                <button className="bulk-btn">
                  <Tag className="w-4 h-4" />
                  Add Tags
                </button>
                <button className="bulk-btn">
                  <Users className="w-4 h-4" />
                  Assign
                </button>
                <button className="bulk-btn">
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
                <button className="bulk-btn danger">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Leads List */}
          {viewMode === 'list' ? (
            <div className="leads-list">
              <div className="list-header">
                <div className="col-checkbox">
                  <input type="checkbox" />
                </div>
                <div className="col-lead">Lead</div>
                <div className="col-company">Company</div>
                <div className="col-score">Score</div>
                <div className="col-value">Value</div>
                <div className="col-status">Status</div>
                <div className="col-activity">Last Activity</div>
                <div className="col-actions">Actions</div>
              </div>
              {filteredLeads.map((lead) => (
                <div 
                  key={lead.id} 
                  className={`lead-row ${selectedLeads.includes(lead.id) ? 'selected' : ''} ${expandedLead === lead.id ? 'expanded' : ''}`}
                >
                  <div className="lead-row-main" onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}>
                    <div className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                      />
                    </div>
                    <div className="col-lead">
                      <div className="lead-info">
                        <div className="lead-avatar">
                          {lead.firstName[0]}{lead.lastName[0]}
                        </div>
                        <div className="lead-details">
                          <div className="lead-name-row">
                            <h4>{lead.firstName} {lead.lastName}</h4>
                            <button 
                              className={`star-btn ${lead.isStarred ? 'starred' : ''}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {lead.isStarred ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                            </button>
                            <span className={`engagement-badge ${lead.engagement}`}>
                              {getEngagementIcon(lead.engagement)}
                              {lead.engagement}
                            </span>
                          </div>
                          <span className="lead-title">{lead.jobTitle}</span>
                          <span className="lead-email">{lead.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-company">
                      <div className="company-info">
                        <Building2 className="w-4 h-4" />
                        <div>
                          <span className="company-name">{lead.company}</span>
                          <span className="company-industry">{lead.industry}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-score">
                      <div className={`score-badge ${getScoreColor(lead.score)}`}>
                        <span className="score-value">{lead.score}</span>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${lead.score}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="col-value">
                      <span className="value-amount">{formatCurrency(lead.value)}</span>
                    </div>
                    <div className="col-status">
                      <span className={`status-badge status-${lead.status}`}>
                        {lead.status}
                      </span>
                    </div>
                    <div className="col-activity">
                      <span className="activity-time">{lead.lastActivity}</span>
                    </div>
                    <div className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button className="action-btn" title="Email">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="action-btn" title="Call">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="action-btn" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="action-btn more">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {expandedLead === lead.id && (
                    <div className="lead-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h5>Contact Information</h5>
                          <div className="info-list">
                            <div className="info-item">
                              <Mail className="w-4 h-4" />
                              <span>{lead.email}</span>
                            </div>
                            <div className="info-item">
                              <Phone className="w-4 h-4" />
                              <span>{lead.phone}</span>
                            </div>
                            <div className="info-item">
                              <MapPin className="w-4 h-4" />
                              <span>{lead.location}</span>
                            </div>
                            {lead.linkedin && (
                              <div className="info-item">
                                <Linkedin className="w-4 h-4" />
                                <span>{lead.linkedin}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="expanded-section">
                          <h5>Lead Details</h5>
                          <div className="info-list">
                            <div className="info-item">
                              <Target className="w-4 h-4" />
                              <span>Source: {lead.source}</span>
                            </div>
                            <div className="info-item">
                              <Users className="w-4 h-4" />
                              <span>Assigned: {lead.assignedTo}</span>
                            </div>
                            <div className="info-item">
                              <Calendar className="w-4 h-4" />
                              <span>Created: {lead.createdAt}</span>
                            </div>
                          </div>
                        </div>
                        <div className="expanded-section">
                          <h5>Tags</h5>
                          <div className="tags-list">
                            {lead.tags.map((tag, i) => (
                              <span key={i} className="tag">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="expanded-actions">
                          <button className="btn-action">
                            <Edit className="w-4 h-4" />
                            Edit Lead
                          </button>
                          <button className="btn-action">
                            <MessageSquare className="w-4 h-4" />
                            Add Note
                          </button>
                          <button className="btn-action primary">
                            <Zap className="w-4 h-4" />
                            Convert to Deal
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="leads-grid">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="lead-card">
                  <div className="card-header">
                    <div className="lead-avatar">
                      {lead.firstName[0]}{lead.lastName[0]}
                    </div>
                    <button className={`star-btn ${lead.isStarred ? 'starred' : ''}`}>
                      {lead.isStarred ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="card-body">
                    <h4 className="lead-name">{lead.firstName} {lead.lastName}</h4>
                    <span className="lead-title">{lead.jobTitle}</span>
                    <div className="company-row">
                      <Building2 className="w-4 h-4" />
                      <span>{lead.company}</span>
                    </div>
                    <div className="card-meta">
                      <div className={`score-mini ${getScoreColor(lead.score)}`}>
                        <Award className="w-3 h-3" />
                        {lead.score}
                      </div>
                      <span className={`engagement-badge ${lead.engagement}`}>
                        {getEngagementIcon(lead.engagement)}
                      </span>
                      <span className="value-mini">{formatCurrency(lead.value)}</span>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className={`status-badge status-${lead.status}`}>{lead.status}</span>
                    <div className="card-actions">
                      <button className="action-btn"><Mail className="w-4 h-4" /></button>
                      <button className="action-btn"><Phone className="w-4 h-4" /></button>
                      <button className="action-btn"><Eye className="w-4 h-4" /></button>
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
