'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('CompaniesManager');

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { CRMService } from '@/lib/services/crm-service';
import {
  Building2,
  Plus,
  Search,
  Globe,
  Mail,
  MapPin,
  Users,
  DollarSign,
  Trash2,
  Eye,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Target
} from 'lucide-react';
import './CompaniesManager.css';

interface Company {
  id: string;
  name: string;
  industry: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  annual_revenue?: number;
  employees?: number;
  description?: string;
  logo?: string;
  tags: string[];
  assigned_to: string;
  total_contacts: number;
  total_deals: number;
  total_value: number;
  created_at: string;
  updated_at: string;
}

interface CreateCompanyInput {
  name: string;
  industry: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  size?: string;
  annual_revenue?: number;
  employees?: number;
  description?: string;
  tags?: string[];
  assigned_to?: string;
}

const CompaniesManager: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'total_value'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [newCompany, setNewCompany] = useState<CreateCompanyInput>({
    name: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: '',
    size: 'small',
    description: '',
    tags: [],
    assigned_to: ''
  });

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CRMService.companies.getAll();
      setCompanies(data as unknown as Company[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
      log.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name.trim() || !newCompany.industry.trim()) return;

    try {
      const company = await CRMService.companies.create({
        name: newCompany.name.trim(),
        industry: newCompany.industry.trim(),
        website: newCompany.website || undefined,
        address: newCompany.address || undefined,
        size: (newCompany.size || 'Small') as 'Startup' | 'Small' | 'Medium' | 'Enterprise',
      });

      // Extend with local form data for UI display
      const extendedCompany: Company = {
        ...(company as unknown as Company),
        phone: newCompany.phone || undefined,
        email: newCompany.email || undefined,
        city: newCompany.city || undefined,
        state: newCompany.state || undefined,
        country: newCompany.country || undefined,
        postal_code: newCompany.postal_code || undefined,
        annual_revenue: newCompany.annual_revenue || undefined,
        employees: newCompany.employees || undefined,
        description: newCompany.description || undefined,
        tags: newCompany.tags || [],
        assigned_to: newCompany.assigned_to || 'Unassigned',
        total_contacts: 0,
        total_deals: 0,
        total_value: 0,
      };

      setCompanies(prev => [...prev, extendedCompany]);
      setNewCompany({
        name: '',
        industry: '',
        website: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        country: '',
        size: 'small',
        description: '',
        tags: [],
        assigned_to: ''
      });
      setShowNewCompany(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This will also affect associated contacts and deals.')) return;

    try {
      await CRMService.companies.delete(companyId);
      setCompanies(prev => prev.filter(c => c.id !== companyId));
      setSelectedCompany(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company');
    }
  };

  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(company =>
        company.name.toLowerCase().includes(query) ||
        company.industry.toLowerCase().includes(query) ||
        (company.email && company.email.toLowerCase().includes(query)) ||
        (company.city && company.city.toLowerCase().includes(query))
      );
    }

    if (selectedSize) {
      result = result.filter(company => company.size === selectedSize);
    }

    if (selectedIndustry) {
      result = result.filter(company => company.industry === selectedIndustry);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'total_value':
          comparison = a.total_value - b.total_value;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [companies, searchQuery, selectedSize, selectedIndustry, sortBy, sortOrder]);

  const industries = useMemo(() => {
    const set = new Set(companies.map(c => c.industry));
    return Array.from(set).sort();
  }, [companies]);

  const stats = useMemo(() => {
    const totalRevenue = companies.reduce((sum, c) => sum + (c.total_value || 0), 0);
    const totalContacts = companies.reduce((sum, c) => sum + (c.total_contacts || 0), 0);
    const totalDeals = companies.reduce((sum, c) => sum + (c.total_deals || 0), 0);

    const bySize: Record<string, number> = {};
    const byIndustry: Record<string, number> = {};

    companies.forEach(c => {
      bySize[c.size] = (bySize[c.size] || 0) + 1;
      byIndustry[c.industry] = (byIndustry[c.industry] || 0) + 1;
    });

    return {
      total: companies.length,
      totalRevenue,
      totalContacts,
      totalDeals,
      bySize,
      byIndustry
    };
  }, [companies]);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'N/A';
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateStr));
  };

  const getSizeLabel = (size: string): string => {
    const labels: Record<string, string> = {
      startup: 'Startup',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      enterprise: 'Enterprise'
    };
    return labels[size] || size;
  };

  const getSizeColor = (size: string): string => {
    const colors: Record<string, string> = {
      startup: '#10b981',
      small: '#3b82f6',
      medium: '#8b5cf6',
      large: '#f59e0b',
      enterprise: '#ef4444'
    };
    return colors[size] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="companies-manager loading">
        <div className="loading-spinner">
          <RefreshCw className="animate-spin" size={32} />
          <p>Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="companies-manager">
      {/* Header */}
      <div className="companies-header">
        <div className="header-left">
          <h2>
            <Building2 size={24} />
            Companies
          </h2>
          <span className="company-count">{filteredCompanies.length} companies</span>
        </div>
        <div className="header-actions">
          <button
            className="btn-refresh"
            onClick={loadCompanies}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowNewCompany(true)}
          >
            <Plus size={18} />
            Add Company
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="companies-stats">
        <div className="stat-card">
          <div className="stat-icon companies">
            <Building2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Companies</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon contacts">
            <Users size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalContacts}</span>
            <span className="stat-label">Total Contacts</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon deals">
            <Target size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalDeals}</span>
            <span className="stat-label">Active Deals</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon revenue">
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="companies-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="filter-select"
          >
            <option value="">All Sizes</option>
            <option value="startup">Startup</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="filter-select"
          >
            <option value="">All Industries</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as 'name' | 'created_at' | 'total_value');
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="filter-select"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="total_value-desc">Highest Value</option>
            <option value="total_value-asc">Lowest Value</option>
          </select>
        </div>
      </div>

      {/* New Company Form */}
      {showNewCompany && (
        <div className="new-company-form">
          <form onSubmit={handleCreateCompany}>
            <h3>Add New Company</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Industry *</label>
                <input
                  type="text"
                  value={newCompany.industry}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Technology, Healthcare"
                  required
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={newCompany.website}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@company.com"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newCompany.phone}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="form-group">
                <label>Company Size</label>
                <select
                  value={newCompany.size}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, size: e.target.value }))}
                >
                  <option value="startup">Startup (1-10)</option>
                  <option value="small">Small (11-50)</option>
                  <option value="medium">Medium (51-200)</option>
                  <option value="large">Large (201-1000)</option>
                  <option value="enterprise">Enterprise (1000+)</option>
                </select>
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={newCompany.city}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  value={newCompany.country}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={newCompany.description}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the company..."
                  rows={3}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Create Company</button>
              <button type="button" className="btn-secondary" onClick={() => setShowNewCompany(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Companies Grid/List */}
      {filteredCompanies.length === 0 ? (
        <div className="empty-state">
          <Building2 size={48} />
          <h3>No companies found</h3>
          <p>Add your first company to get started</p>
          <button className="btn-primary" onClick={() => setShowNewCompany(true)}>
            <Plus size={18} />
            Add Company
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="companies-grid">
          {filteredCompanies.map(company => (
            <div
              key={company.id}
              className="company-card"
              onClick={() => setSelectedCompany(company)}
            >
              <div className="card-header">
                <div className="company-logo">
                  {company.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={company.logo} alt={company.name} />
                  ) : (
                    <Building2 size={24} />
                  )}
                </div>
                <div className="company-info">
                  <h4>{company.name}</h4>
                  <span className="industry">{company.industry}</span>
                </div>
                <span
                  className="size-badge"
                  style={{ backgroundColor: getSizeColor(company.size) }}
                >
                  {getSizeLabel(company.size)}
                </span>
              </div>

              <div className="card-body">
                {company.website && (
                  <div className="info-row">
                    <Globe size={14} />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {company.email && (
                  <div className="info-row">
                    <Mail size={14} />
                    <span>{company.email}</span>
                  </div>
                )}
                {(company.city || company.country) && (
                  <div className="info-row">
                    <MapPin size={14} />
                    <span>{[company.city, company.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <div className="stat">
                  <Users size={14} />
                  <span>{company.total_contacts} contacts</span>
                </div>
                <div className="stat">
                  <Target size={14} />
                  <span>{company.total_deals} deals</span>
                </div>
                <div className="stat">
                  <DollarSign size={14} />
                  <span>{formatCurrency(company.total_value)}</span>
                </div>
              </div>

              <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn-icon"
                  onClick={() => setSelectedCompany(company)}
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
                <button
                  className="btn-icon danger"
                  onClick={() => handleDeleteCompany(company.id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="companies-list">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Industry</th>
                <th>Size</th>
                <th>Location</th>
                <th>Contacts</th>
                <th>Deals</th>
                <th>Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map(company => (
                <tr key={company.id} onClick={() => setSelectedCompany(company)}>
                  <td className="company-cell">
                    <div className="company-logo small">
                      {company.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={company.logo} alt={company.name} />
                      ) : (
                        <Building2 size={16} />
                      )}
                    </div>
                    <div>
                      <span className="name">{company.name}</span>
                      {company.website && (
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="website"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {company.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                  </td>
                  <td>{company.industry}</td>
                  <td>
                    <span
                      className="size-badge small"
                      style={{ backgroundColor: getSizeColor(company.size) }}
                    >
                      {getSizeLabel(company.size)}
                    </span>
                  </td>
                  <td>{[company.city, company.country].filter(Boolean).join(', ') || '-'}</td>
                  <td>{company.total_contacts}</td>
                  <td>{company.total_deals}</td>
                  <td>{formatCurrency(company.total_value)}</td>
                  <td className="actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-icon"
                      onClick={() => setSelectedCompany(company)}
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDeleteCompany(company.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div className="company-modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="company-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="company-header">
                <div className="company-logo large">
                  {selectedCompany.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedCompany.logo} alt={selectedCompany.name} />
                  ) : (
                    <Building2 size={32} />
                  )}
                </div>
                <div>
                  <h3>{selectedCompany.name}</h3>
                  <span className="industry">{selectedCompany.industry}</span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedCompany(null)}>×</button>
            </div>
            <div className="modal-content">
              <div className="company-details">
                <div className="detail-section">
                  <h4>Company Information</h4>
                  <div className="detail-grid">
                    <div className="detail-row">
                      <span className="label">Size</span>
                      <span
                        className="size-badge"
                        style={{ backgroundColor: getSizeColor(selectedCompany.size) }}
                      >
                        {getSizeLabel(selectedCompany.size)}
                      </span>
                    </div>
                    {selectedCompany.website && (
                      <div className="detail-row">
                        <span className="label">Website</span>
                        <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer">
                          {selectedCompany.website} <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                    {selectedCompany.email && (
                      <div className="detail-row">
                        <span className="label">Email</span>
                        <span>{selectedCompany.email}</span>
                      </div>
                    )}
                    {selectedCompany.phone && (
                      <div className="detail-row">
                        <span className="label">Phone</span>
                        <span>{selectedCompany.phone}</span>
                      </div>
                    )}
                    {selectedCompany.employees && (
                      <div className="detail-row">
                        <span className="label">Employees</span>
                        <span>{selectedCompany.employees.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedCompany.annual_revenue && (
                      <div className="detail-row">
                        <span className="label">Annual Revenue</span>
                        <span>{formatCurrency(selectedCompany.annual_revenue)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedCompany.address || selectedCompany.city || selectedCompany.country) && (
                  <div className="detail-section">
                    <h4>Location</h4>
                    <div className="detail-grid">
                      {selectedCompany.address && (
                        <div className="detail-row">
                          <span className="label">Address</span>
                          <span>{selectedCompany.address}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="label">City/Country</span>
                        <span>
                          {[selectedCompany.city, selectedCompany.state, selectedCompany.country]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                      {selectedCompany.postal_code && (
                        <div className="detail-row">
                          <span className="label">Postal Code</span>
                          <span>{selectedCompany.postal_code}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Business Metrics</h4>
                  <div className="metrics-grid">
                    <div className="metric">
                      <Users size={20} />
                      <span className="value">{selectedCompany.total_contacts}</span>
                      <span className="label">Contacts</span>
                    </div>
                    <div className="metric">
                      <Target size={20} />
                      <span className="value">{selectedCompany.total_deals}</span>
                      <span className="label">Deals</span>
                    </div>
                    <div className="metric">
                      <DollarSign size={20} />
                      <span className="value">{formatCurrency(selectedCompany.total_value)}</span>
                      <span className="label">Total Value</span>
                    </div>
                  </div>
                </div>

                {selectedCompany.description && (
                  <div className="detail-section">
                    <h4>Description</h4>
                    <p className="description">{selectedCompany.description}</p>
                  </div>
                )}

                {selectedCompany.tags.length > 0 && (
                  <div className="detail-section">
                    <h4>Tags</h4>
                    <div className="tags">
                      {selectedCompany.tags.map((tag, i) => (
                        <span key={i} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Activity</h4>
                  <div className="detail-grid">
                    <div className="detail-row">
                      <span className="label">Created</span>
                      <span>{formatDate(selectedCompany.created_at)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Last Updated</span>
                      <span>{formatDate(selectedCompany.updated_at)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Assigned To</span>
                      <span>{selectedCompany.assigned_to || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => handleDeleteCompany(selectedCompany.id)}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesManager;
