'use client';

import React, { useState } from 'react';
import { 
  Search,
  Filter,
  Clock,
  Calendar,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  Zap,
  Database,
  Settings,
  Shield,
  Activity,
  Tag,
  Folder,
  Star,
  Bookmark,
  MoreHorizontal,
  ArrowUpRight,
  Eye,
  Edit3,
  Trash2,
  Download,
  Share2,
  RefreshCw,
  Sliders,
  Hash,
  CheckCircle,
  AlertCircle,
  XCircle,
  Save,
  History
} from 'lucide-react';
import './advanced-search.css';

interface SearchResult {
  id: string;
  type: 'automation' | 'user' | 'document' | 'workflow' | 'log' | 'setting';
  title: string;
  description: string;
  path?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  author?: string;
  status?: 'active' | 'inactive' | 'draft' | 'error';
  relevanceScore: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, unknown>;
  createdAt: string;
}

interface SearchFilter {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'toggle';
  options?: { value: string; label: string }[];
  value: unknown;
}

const SEARCH_RESULTS: SearchResult[] = [
  {
    id: 'res-001',
    type: 'automation',
    title: 'Email Campaign Automation',
    description: 'Automated email sequences for customer onboarding with personalized content',
    path: '/automations/email-campaigns',
    tags: ['email', 'marketing', 'onboarding'],
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-29T14:00:00Z',
    author: 'Sarah Johnson',
    status: 'active',
    relevanceScore: 98,
  },
  {
    id: 'res-002',
    type: 'workflow',
    title: 'Data Pipeline Workflow',
    description: 'ETL workflow for processing and transforming customer data from multiple sources',
    path: '/workflows/data-pipeline',
    tags: ['data', 'etl', 'pipeline'],
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-01-28T16:00:00Z',
    author: 'Mike Chen',
    status: 'active',
    relevanceScore: 92,
  },
  {
    id: 'res-003',
    type: 'user',
    title: 'John Smith',
    description: 'Administrator with full system access, managing automation infrastructure',
    tags: ['admin', 'team-lead'],
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2025-01-29T08:00:00Z',
    status: 'active',
    relevanceScore: 85,
  },
  {
    id: 'res-004',
    type: 'document',
    title: 'API Integration Guide',
    description: 'Comprehensive documentation for integrating with the CUBE API',
    path: '/docs/api-guide',
    tags: ['documentation', 'api', 'integration'],
    createdAt: '2024-12-10T11:00:00Z',
    updatedAt: '2025-01-25T14:00:00Z',
    author: 'Emily Brown',
    relevanceScore: 78,
  },
  {
    id: 'res-005',
    type: 'automation',
    title: 'Slack Notification Bot',
    description: 'Sends automated notifications to Slack channels based on system events',
    path: '/automations/slack-bot',
    tags: ['slack', 'notifications', 'alerts'],
    createdAt: '2025-01-10T15:00:00Z',
    updatedAt: '2025-01-29T10:00:00Z',
    author: 'Mike Chen',
    status: 'active',
    relevanceScore: 75,
  },
  {
    id: 'res-006',
    type: 'log',
    title: 'Authentication Error Log',
    description: 'Log entry showing failed authentication attempts from IP 192.168.1.100',
    path: '/logs/auth-errors',
    tags: ['security', 'authentication', 'error'],
    createdAt: '2025-01-29T06:00:00Z',
    updatedAt: '2025-01-29T06:00:00Z',
    status: 'error',
    relevanceScore: 72,
  },
  {
    id: 'res-007',
    type: 'setting',
    title: 'Email SMTP Configuration',
    description: 'SMTP settings for outgoing email notifications and campaigns',
    path: '/settings/email',
    tags: ['email', 'configuration', 'smtp'],
    createdAt: '2024-08-20T09:00:00Z',
    updatedAt: '2025-01-20T11:00:00Z',
    relevanceScore: 68,
  },
  {
    id: 'res-008',
    type: 'workflow',
    title: 'Customer Support Triage',
    description: 'Workflow for automatically categorizing and routing support tickets',
    path: '/workflows/support-triage',
    tags: ['support', 'tickets', 'automation'],
    createdAt: '2025-01-05T14:00:00Z',
    updatedAt: '2025-01-27T09:00:00Z',
    author: 'Sarah Johnson',
    status: 'draft',
    relevanceScore: 65,
  },
];

const SAVED_SEARCHES: SavedSearch[] = [
  {
    id: 'ss-001',
    name: 'Active Automations',
    query: 'type:automation status:active',
    filters: { type: 'automation', status: 'active' },
    createdAt: '2025-01-25T10:00:00Z',
  },
  {
    id: 'ss-002',
    name: 'Recent Documents',
    query: 'type:document updated:7d',
    filters: { type: 'document', dateRange: '7d' },
    createdAt: '2025-01-20T14:00:00Z',
  },
  {
    id: 'ss-003',
    name: 'Error Logs',
    query: 'type:log status:error',
    filters: { type: 'log', status: 'error' },
    createdAt: '2025-01-18T09:00:00Z',
  },
];

const RECENT_SEARCHES = [
  'email automation',
  'data pipeline',
  'api integration',
  'authentication error',
  'slack notification',
];

const getTypeIcon = (type: SearchResult['type']): React.ReactNode => {
  switch (type) {
    case 'automation': return <Zap size={18} />;
    case 'user': return <Users size={18} />;
    case 'document': return <FileText size={18} />;
    case 'workflow': return <Activity size={18} />;
    case 'log': return <Database size={18} />;
    case 'setting': return <Settings size={18} />;
    default: return <FileText size={18} />;
  }
};

const getStatusIcon = (status?: SearchResult['status']): React.ReactNode => {
  switch (status) {
    case 'active': return <CheckCircle size={12} />;
    case 'inactive': return <XCircle size={12} />;
    case 'draft': return <Edit3 size={12} />;
    case 'error': return <AlertCircle size={12} />;
    default: return null;
  }
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function AdvancedSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>(SEARCH_RESULTS);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<SearchResult['type'][]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'name'>('relevance');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const types: SearchResult['type'][] = ['automation', 'workflow', 'user', 'document', 'log', 'setting'];
  const statuses = ['all', 'active', 'inactive', 'draft', 'error'];
  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];

  const toggleType = (type: SearchResult['type']) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const filteredResults = results.filter(result => {
    const matchesQuery = !query || 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase());
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(result.type);
    const matchesStatus = selectedStatus === 'all' || result.status === selectedStatus;
    return matchesQuery && matchesType && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'relevance') return b.relevanceScore - a.relevanceScore;
    if (sortBy === 'date') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    return a.title.localeCompare(b.title);
  });

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedStatus('all');
    setDateRange('all');
    setQuery('');
  };

  return (
    <div className="advanced-search">
      {/* Header */}
      <header className="advanced-search__header">
        <div className="advanced-search__title-section">
          <div className="advanced-search__icon">
            <Search size={28} />
          </div>
          <div>
            <h1>Advanced Search</h1>
            <p>Search across all your data and resources</p>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={22} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search automations, workflows, users, documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="clear-search" onClick={() => setQuery('')}>
                <X size={18} />
              </button>
            )}
          </div>
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Sliders size={18} />
            Filters
            {(selectedTypes.length > 0 || selectedStatus !== 'all' || dateRange !== 'all') && (
              <span className="filter-count">
                {selectedTypes.length + (selectedStatus !== 'all' ? 1 : 0) + (dateRange !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Quick Searches */}
        {!query && (
          <div className="quick-searches">
            <div className="recent-searches">
              <History size={14} />
              <span>Recent:</span>
              {RECENT_SEARCHES.map((search, i) => (
                <button key={i} className="quick-search-tag" onClick={() => setQuery(search)}>
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="search-layout">
        {/* Filters Sidebar */}
        {showFilters && (
          <aside className="filters-sidebar">
            <div className="filters-header">
              <h3>Filters</h3>
              <button className="clear-btn" onClick={clearFilters}>
                Clear All
              </button>
            </div>

            {/* Type Filter */}
            <div className="filter-group">
              <label>Type</label>
              <div className="type-filters">
                {types.map(type => (
                  <button
                    key={type}
                    className={`type-filter ${selectedTypes.includes(type) ? 'selected' : ''}`}
                    onClick={() => toggleType(type)}
                  >
                    {getTypeIcon(type)}
                    <span>{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label>Status</label>
              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="filter-group">
              <label>Updated</label>
              <div className="date-filters">
                {dateRanges.map(range => (
                  <button
                    key={range.value}
                    className={`date-filter ${dateRange === range.value ? 'selected' : ''}`}
                    onClick={() => setDateRange(range.value)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Searches */}
            <div className="filter-group">
              <label>Saved Searches</label>
              <div className="saved-searches">
                {SAVED_SEARCHES.map(search => (
                  <button key={search.id} className="saved-search-item">
                    <Bookmark size={14} />
                    <span>{search.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Results Section */}
        <main className="results-section">
          {/* Results Header */}
          <div className="results-header">
            <span className="results-count">
              {filteredResults.length} results
              {query && <span> for "{query}"</span>}
            </span>
            <div className="results-actions">
              <div className="sort-select">
                <span>Sort by:</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
                  <option value="relevance">Relevance</option>
                  <option value="date">Date Modified</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <button className="save-search-btn">
                <Save size={16} />
                Save Search
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className={`results-list ${viewMode}`}>
            {filteredResults.map(result => (
              <div key={result.id} className={`result-card ${result.type}`}>
                <div className="result-icon-wrapper">
                  <div className={`result-icon ${result.type}`}>
                    {getTypeIcon(result.type)}
                  </div>
                </div>
                <div className="result-content">
                  <div className="result-header">
                    <h3 className="result-title">{result.title}</h3>
                    {result.status && (
                      <span className={`status-badge ${result.status}`}>
                        {getStatusIcon(result.status)}
                        {result.status}
                      </span>
                    )}
                    <span className="relevance-score">{result.relevanceScore}%</span>
                  </div>
                  <p className="result-description">{result.description}</p>
                  {result.path && (
                    <span className="result-path">
                      <Folder size={12} />
                      {result.path}
                    </span>
                  )}
                  <div className="result-meta">
                    <span className={`type-badge ${result.type}`}>{result.type}</span>
                    {result.tags && result.tags.map((tag, i) => (
                      <span key={i} className="tag">
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                    {result.author && (
                      <span className="author">
                        <Users size={12} />
                        {result.author}
                      </span>
                    )}
                    <span className="date">
                      <Clock size={12} />
                      {formatDate(result.updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="result-actions">
                  <button className="action-btn">
                    <Eye size={16} />
                  </button>
                  <button className="action-btn">
                    <Star size={16} />
                  </button>
                  <button className="action-btn">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredResults.length === 0 && (
            <div className="no-results">
              <Search size={48} />
              <h3>No results found</h3>
              <p>Try adjusting your search query or filters</p>
              <button className="btn-outline" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
