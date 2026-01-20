'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('ContactsManager');

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CRMService } from '@/lib/services/crm-service';
import {
  Users,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  MoreVertical,
  Phone,
  Mail,
  Building2,
  Tag,
  Star,
  StarOff,
  Edit,
  Trash2,
  Eye,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Merge,
  UserPlus,
  Brain
} from 'lucide-react';
import './ContactsManager.css';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile?: string;
  company: string;
  company_id?: string;
  position: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  source: string;
  status: string;
  tags: string[];
  assigned_to: string;
  score: number;
  last_contact?: string;
  next_follow_up?: string;
  total_deals: number;
  total_value: number;
  notes: string;
  created_at: string;
  updated_at: string;
  favorite: boolean;
  avatar?: string;
  social_profiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  custom_fields?: Record<string, string>;
}

interface ContactFilter {
  status: string[];
  source: string[];
  tags: string[];
  assignedTo: string[];
  dateRange: { start: Date | null; end: Date | null };
  hasDeals: boolean | null;
  favorite: boolean | null;
}

interface AIInsight {
  type: 'suggestion' | 'warning' | 'opportunity';
  message: string;
  action?: string;
  contactId?: string;
}

const ContactsManager: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortField, setSortField] = useState<keyof Contact>('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showAddModal, setShowAddModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showDetailModal, setShowDetailModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filters, setFilters] = useState<ContactFilter>({
    status: [],
    source: [],
    tags: [],
    assignedTo: [],
    dateRange: { start: null, end: null },
    hasDeals: null,
    favorite: null
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);

  const statusOptions = ['lead', 'prospect', 'customer', 'churned'];
  const sourceOptions = ['Website', 'Referral', 'Trade Show', 'LinkedIn', 'Cold Email', 'Ads', 'Other'];
  const tagOptions = ['Enterprise', 'SMB', 'Startup', 'Tech', 'Decision Maker', 'C-Level', 'Growth', 'Active', 'New Lead'];

  // Load contacts from backend
  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await CRMService.contacts.getAll();
      setContacts(result as unknown as Contact[]);
    } catch (err) {
      log.error('Failed to load contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
      // Fallback demo data
      setContacts([
        {
          id: '1',
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@globalcorp.com',
          phone: '+1 (555) 123-4567',
          mobile: '+1 (555) 987-6543',
          company: 'Global Corp',
          company_id: 'c1',
          position: 'VP of Technology',
          address: '123 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postal_code: '94102',
          source: 'Website',
          status: 'customer',
          tags: ['Enterprise', 'Tech', 'Decision Maker'],
          assigned_to: 'Sarah Johnson',
          score: 92,
          last_contact: new Date(Date.now() - 86400000).toISOString(),
          next_follow_up: new Date(Date.now() + 172800000).toISOString(),
          total_deals: 3,
          total_value: 450000,
          notes: 'Key decision maker for enterprise deals',
          created_at: new Date('2024-01-15').toISOString(),
          updated_at: new Date().toISOString(),
          favorite: true,
          social_profiles: { linkedin: 'linkedin.com/in/johnsmith' }
        },
        {
          id: '2',
          first_name: 'Sarah',
          last_name: 'Chen',
          email: 'sarah.chen@techstart.io',
          phone: '+1 (555) 234-5678',
          company: 'TechStart Inc',
          company_id: 'c2',
          position: 'CEO',
          city: 'Austin',
          state: 'TX',
          country: 'USA',
          source: 'Referral',
          status: 'prospect',
          tags: ['Startup', 'Growth', 'C-Level'],
          assigned_to: 'Mike Brown',
          score: 78,
          last_contact: new Date(Date.now() - 259200000).toISOString(),
          next_follow_up: new Date(Date.now() + 86400000).toISOString(),
          total_deals: 1,
          total_value: 85000,
          notes: 'Interested in platform migration',
          created_at: new Date('2024-02-20').toISOString(),
          updated_at: new Date().toISOString(),
          favorite: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Filter and sort contacts
  useEffect(() => {
    let result = [...contacts];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(contact =>
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.company.toLowerCase().includes(query) ||
        contact.phone.includes(query) ||
        contact.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.status.length > 0) {
      result = result.filter(c => filters.status.includes(c.status));
    }
    if (filters.source.length > 0) {
      result = result.filter(c => filters.source.includes(c.source));
    }
    if (filters.tags.length > 0) {
      result = result.filter(c => c.tags.some(t => filters.tags.includes(t)));
    }
    if (filters.assignedTo.length > 0) {
      result = result.filter(c => filters.assignedTo.includes(c.assigned_to));
    }
    if (filters.hasDeals !== null) {
      result = result.filter(c => filters.hasDeals ? c.total_deals > 0 : c.total_deals === 0);
    }
    if (filters.favorite !== null) {
      result = result.filter(c => c.favorite === filters.favorite);
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredContacts(result);
  }, [contacts, searchQuery, filters, sortField, sortDirection]);

  const handleSort = useCallback((field: keyof Contact) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleSelectContact = useCallback((contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  }, [selectedContacts.length, filteredContacts]);

  const handleToggleFavorite = useCallback(async (contactId: string) => {
    try {
      await invoke('crm_toggle_favorite', { contactId });
      setContacts(prev => prev.map(c => 
        c.id === contactId ? { ...c, favorite: !c.favorite } : c
      ));
    } catch (err) {
      log.error('Failed to toggle favorite:', err);
      // Local fallback
      setContacts(prev => prev.map(c => 
        c.id === contactId ? { ...c, favorite: !c.favorite } : c
      ));
    }
  }, []);

  const handleViewContact = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
  }, []);

  const handleDeleteContacts = useCallback(async (contactIds: string[]) => {
    if (window.confirm(`Delete ${contactIds.length} contact(s)?`)) {
      try {
        // Delete each contact through backend
        for (const id of contactIds) {
          await invoke('crm_delete_contact', { contactId: id });
        }
        setContacts(prev => prev.filter(c => !contactIds.includes(c.id)));
        setSelectedContacts([]);
      } catch (err) {
        log.error('Failed to delete contacts:', err);
        // Local fallback
        setContacts(prev => prev.filter(c => !contactIds.includes(c.id)));
        setSelectedContacts([]);
      }
    }
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'lead': return 'status-lead';
      case 'prospect': return 'status-prospect';
      case 'customer': return 'status-customer';
      case 'churned': return 'status-churned';
      default: return '';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="contacts-manager">
      <header className="contacts-header">
        <div className="header-left">
          <h1>
            <Users size={24} />
            Contacts
          </h1>
          <span className="contact-count">{filteredContacts.length} contacts</span>
        </div>
        <div className="header-right">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className={`btn-filter ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
            {(filters.status.length + filters.source.length + filters.tags.length > 0) && (
              <span className="filter-badge">
                {filters.status.length + filters.source.length + filters.tags.length}
              </span>
            )}
          </button>
          <div className="view-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={18} />
            </button>
          </div>
          <button className="btn-secondary">
            <Download size={18} />
            Export
          </button>
          <button className="btn-secondary">
            <Upload size={18} />
            Import
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Add Contact
          </button>
        </div>
      </header>

      {/* AI Insights Bar */}
      {aiInsights.length > 0 && (
        <div className="ai-insights-bar">
          <div className="ai-insight-content">
            <Brain size={18} className="ai-icon" />
            <span className="ai-label">AI Insights:</span>
            {aiInsights.map((insight, index) => (
              <span key={index} className={`insight-item ${insight.type}`}>
                {insight.type === 'warning' && '⚠️'}
                {insight.type === 'opportunity' && '💡'}
                {insight.type === 'suggestion' && '✨'}
                {insight.message}
                {insight.action && (
                  <button className="insight-action">{insight.action}</button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-options">
              {statusOptions.map(status => (
                <button
                  key={status}
                  className={`filter-chip ${filters.status.includes(status) ? 'active' : ''}`}
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    status: prev.status.includes(status)
                      ? prev.status.filter(s => s !== status)
                      : [...prev.status, status]
                  }))}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Source</label>
            <div className="filter-options">
              {sourceOptions.map(source => (
                <button
                  key={source}
                  className={`filter-chip ${filters.source.includes(source) ? 'active' : ''}`}
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    source: prev.source.includes(source)
                      ? prev.source.filter(s => s !== source)
                      : [...prev.source, source]
                  }))}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Tags</label>
            <div className="filter-options">
              {tagOptions.map(tag => (
                <button
                  key={tag}
                  className={`filter-chip ${filters.tags.includes(tag) ? 'active' : ''}`}
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    tags: prev.tags.includes(tag)
                      ? prev.tags.filter(t => t !== tag)
                      : [...prev.tags, tag]
                  }))}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-actions">
            <button 
              className="btn-text"
              onClick={() => setFilters({
                status: [],
                source: [],
                tags: [],
                assignedTo: [],
                dateRange: { start: null, end: null },
                hasDeals: null,
                favorite: null
              })}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="selected-count">{selectedContacts.length} selected</span>
          <button className="btn-bulk">
            <Tag size={16} />
            Add Tags
          </button>
          <button className="btn-bulk">
            <Mail size={16} />
            Send Email
          </button>
          <button className="btn-bulk">
            <UserPlus size={16} />
            Assign
          </button>
          <button className="btn-bulk">
            <Merge size={16} />
            Merge
          </button>
          <button className="btn-bulk danger" onClick={() => handleDeleteContacts(selectedContacts)}>
            <Trash2 size={16} />
            Delete
          </button>
          <button className="btn-text" onClick={() => setSelectedContacts([])}>
            Cancel
          </button>
        </div>
      )}

      {/* Contacts Table/Grid */}
      <div className={`contacts-content ${viewMode}`}>
        {viewMode === 'list' ? (
          <table className="contacts-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="sortable" onClick={() => handleSort('last_name')}>
                  Name
                  {sortField === 'last_name' && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
                </th>
                <th className="sortable" onClick={() => handleSort('company')}>
                  Company
                  {sortField === 'company' && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
                </th>
                <th>Contact</th>
                <th className="sortable" onClick={() => handleSort('status')}>
                  Status
                  {sortField === 'status' && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
                </th>
                <th className="sortable" onClick={() => handleSort('score')}>
                  Score
                  {sortField === 'score' && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
                </th>
                <th className="sortable" onClick={() => handleSort('last_contact')}>
                  Last Contact
                  {sortField === 'last_contact' && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
                </th>
                <th className="sortable" onClick={() => handleSort('total_value')}>
                  Value
                  {sortField === 'total_value' && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(contact => (
                <tr 
                  key={contact.id}
                  className={selectedContacts.includes(contact.id) ? 'selected' : ''}
                >
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => handleSelectContact(contact.id)}
                    />
                  </td>
                  <td className="name-cell">
                    <div className="contact-name">
                      <button 
                        className="favorite-btn"
                        onClick={() => handleToggleFavorite(contact.id)}
                      >
                        {contact.favorite ? <Star size={14} className="favorited" /> : <StarOff size={14} />}
                      </button>
                      <div className="contact-avatar">
                        {contact.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={contact.avatar} alt="" />
                        ) : (
                          <span>{contact.first_name[0]}{contact.last_name[0]}</span>
                        )}
                      </div>
                      <div className="name-info">
                        <span className="full-name">{contact.first_name} {contact.last_name}</span>
                        <span className="position">{contact.position}</span>
                      </div>
                    </div>
                  </td>
                  <td className="company-cell">
                    <div className="company-info">
                      <Building2 size={14} />
                      <span>{contact.company}</span>
                    </div>
                  </td>
                  <td className="contact-cell">
                    <div className="contact-info">
                      <a href={`mailto:${contact.email}`} className="contact-link">
                        <Mail size={14} />
                        {contact.email}
                      </a>
                      <a href={`tel:${contact.phone}`} className="contact-link">
                        <Phone size={14} />
                        {contact.phone}
                      </a>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(contact.status)}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td>
                    <div className={`score-badge ${getScoreColor(contact.score)}`}>
                      {contact.score}
                    </div>
                  </td>
                  <td className="date-cell">
                    {formatDate(contact.last_contact)}
                  </td>
                  <td className="value-cell">
                    {contact.total_value > 0 ? formatCurrency(contact.total_value) : '-'}
                  </td>
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => handleViewContact(contact)} title="View">
                      <Eye size={14} />
                    </button>
                    <button className="btn-icon" title="Edit">
                      <Edit size={14} />
                    </button>
                    <button className="btn-icon" title="Email">
                      <Mail size={14} />
                    </button>
                    <button className="btn-icon" title="Call">
                      <Phone size={14} />
                    </button>
                    <button className="btn-icon" title="More">
                      <MoreVertical size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="contacts-grid">
            {filteredContacts.map(contact => (
              <div 
                key={contact.id}
                className={`contact-card ${selectedContacts.includes(contact.id) ? 'selected' : ''}`}
              >
                <div className="card-header">
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact.id)}
                    onChange={() => handleSelectContact(contact.id)}
                  />
                  <button 
                    className="favorite-btn"
                    onClick={() => handleToggleFavorite(contact.id)}
                  >
                    {contact.favorite ? <Star size={16} className="favorited" /> : <StarOff size={16} />}
                  </button>
                  <span className={`status-badge ${getStatusColor(contact.status)}`}>
                    {contact.status}
                  </span>
                </div>
                <div className="card-body">
                  <div className="contact-avatar large">
                    {contact.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={contact.avatar} alt="" />
                    ) : (
                      <span>{contact.first_name[0]}{contact.last_name[0]}</span>
                    )}
                  </div>
                  <h3 className="contact-name">{contact.first_name} {contact.last_name}</h3>
                  <p className="contact-position">{contact.position}</p>
                  <p className="contact-company">
                    <Building2 size={14} />
                    {contact.company}
                  </p>
                  <div className={`score-indicator ${getScoreColor(contact.score)}`}>
                    <span className="score-value">{contact.score}</span>
                    <span className="score-label">Lead Score</span>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="contact-tags">
                    {contact.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                    {contact.tags.length > 2 && (
                      <span className="tag more">+{contact.tags.length - 2}</span>
                    )}
                  </div>
                  <div className="card-actions">
                    <button className="btn-icon" onClick={() => handleViewContact(contact)}>
                      <Eye size={16} />
                    </button>
                    <button className="btn-icon">
                      <Mail size={16} />
                    </button>
                    <button className="btn-icon">
                      <Phone size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <h3>No contacts found</h3>
          <p>Try adjusting your search or filters</p>
          <button className="btn-primary" onClick={() => {
            setSearchQuery('');
            setFilters({
              status: [],
              source: [],
              tags: [],
              assignedTo: [],
              dateRange: { start: null, end: null },
              hasDeals: null,
              favorite: null
            });
          }}>
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactsManager;
