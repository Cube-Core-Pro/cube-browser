'use client';

import React, { useState } from 'react';
import {
  FileText,
  Tag,
  Calendar,
  ChevronRight,
  Search,
  Filter,
  Star,
  Zap,
  Bug,
  Shield,
  Wrench,
  AlertTriangle,
  Package,
  Clock,
  GitBranch,
  ExternalLink,
  ArrowUp,
  Check,
  Bell,
  BookOpen
} from 'lucide-react';
import './changelog.css';

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  title: string;
  description: string;
  breaking?: boolean;
  categories: ChangeCategory[];
}

interface ChangeCategory {
  type: 'feature' | 'improvement' | 'bugfix' | 'security' | 'deprecation';
  items: ChangeItem[];
}

interface ChangeItem {
  title: string;
  description?: string;
  issueId?: string;
  breaking?: boolean;
}

const changelog: ChangelogEntry[] = [
  {
    version: '3.2.0',
    date: '2025-01-28',
    type: 'minor',
    title: 'AI-Powered Features & Performance',
    description: 'Major AI enhancements with GPT-5.2 integration and significant performance improvements.',
    categories: [
      {
        type: 'feature',
        items: [
          { title: 'AI Smart Selector', description: 'Automatic element detection using machine learning', issueId: '#1247' },
          { title: 'Natural Language Workflows', description: 'Create automations using plain English', issueId: '#1251' },
          { title: 'Predictive Data Extraction', description: 'AI suggests extraction patterns based on page structure' },
          { title: 'Multi-model Support', description: 'Support for GPT-4, GPT-5.2, Claude, and local models' }
        ]
      },
      {
        type: 'improvement',
        items: [
          { title: 'Reduced memory usage by 40%', description: 'Optimized data structures and caching' },
          { title: 'Faster workflow execution', description: 'Up to 3x faster on complex workflows' },
          { title: 'Improved TypeScript types', description: 'Better type inference and exports' }
        ]
      },
      {
        type: 'bugfix',
        items: [
          { title: 'Fixed iframe selector stability', issueId: '#1198' },
          { title: 'Resolved memory leak in long-running tasks', issueId: '#1203' },
          { title: 'Fixed OAuth token refresh race condition', issueId: '#1215' }
        ]
      }
    ]
  },
  {
    version: '3.1.5',
    date: '2025-01-20',
    type: 'patch',
    title: 'Security Patch & Bug Fixes',
    description: 'Important security updates and critical bug fixes.',
    breaking: false,
    categories: [
      {
        type: 'security',
        items: [
          { title: 'Updated dependencies to patch CVE-2025-1234', description: 'Critical vulnerability in JSON parser' },
          { title: 'Enhanced API key encryption', description: 'Now using AES-256-GCM' }
        ]
      },
      {
        type: 'bugfix',
        items: [
          { title: 'Fixed CSV export encoding issues', issueId: '#1189' },
          { title: 'Resolved scheduler timezone handling', issueId: '#1192' },
          { title: 'Fixed webhook retry logic', issueId: '#1195' }
        ]
      }
    ]
  },
  {
    version: '3.1.0',
    date: '2025-01-10',
    type: 'minor',
    title: 'Collaboration Features',
    description: 'New team collaboration tools and shared workspaces.',
    categories: [
      {
        type: 'feature',
        items: [
          { title: 'Team Workspaces', description: 'Shared spaces for team collaboration', issueId: '#1102' },
          { title: 'Real-time Collaboration', description: 'Edit workflows simultaneously with team members' },
          { title: 'Role-based Access Control', description: 'Granular permissions for team members' },
          { title: 'Audit Logs', description: 'Track all actions across your organization' }
        ]
      },
      {
        type: 'improvement',
        items: [
          { title: 'New dashboard design', description: 'Cleaner UI with better information hierarchy' },
          { title: 'Faster search', description: 'Indexed search across all resources' }
        ]
      }
    ]
  },
  {
    version: '3.0.0',
    date: '2024-12-15',
    type: 'major',
    title: 'CUBE Elite v3 - Complete Rewrite',
    description: 'Major version with new architecture, Rust backend, and enterprise features.',
    breaking: true,
    categories: [
      {
        type: 'feature',
        items: [
          { title: 'New Rust/Tauri Backend', description: 'Blazing fast native performance', breaking: true },
          { title: 'Visual Workflow Builder', description: 'Drag-and-drop automation designer' },
          { title: 'Enterprise SSO', description: 'SAML 2.0 and OIDC support' },
          { title: 'Multi-browser Support', description: 'Chrome, Firefox, Edge, and Safari' },
          { title: 'Cloud Execution', description: 'Run workflows in the cloud' }
        ]
      },
      {
        type: 'deprecation',
        items: [
          { title: 'Legacy REST API v1', description: 'Migrated to v2, v1 sunset in 6 months', breaking: true },
          { title: 'Old plugin format', description: 'New plugin SDK required', breaking: true }
        ]
      },
      {
        type: 'security',
        items: [
          { title: 'End-to-end encryption', description: 'All data encrypted at rest and in transit' },
          { title: 'SOC 2 Type II Compliance', description: 'Enterprise security certification' }
        ]
      }
    ]
  },
  {
    version: '2.9.8',
    date: '2024-11-20',
    type: 'patch',
    title: 'Stability Improvements',
    description: 'Bug fixes and stability improvements for the legacy version.',
    categories: [
      {
        type: 'bugfix',
        items: [
          { title: 'Fixed data export timeout', issueId: '#987' },
          { title: 'Resolved Chrome extension crash', issueId: '#991' },
          { title: 'Fixed scheduler DST handling', issueId: '#995' }
        ]
      },
      {
        type: 'improvement',
        items: [
          { title: 'Better error messages', description: 'More descriptive error handling' }
        ]
      }
    ]
  }
];

export default function ChangelogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set([changelog[0].version]));

  const types = ['all', 'major', 'minor', 'patch'];
  const categories = ['all', 'feature', 'improvement', 'bugfix', 'security', 'deprecation'];

  const filteredChangelog = changelog.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.version.includes(searchQuery);
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || 
                           entry.categories.some(cat => cat.type === categoryFilter);
    return matchesSearch && matchesType && matchesCategory;
  });

  const toggleVersion = (version: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedVersions(newExpanded);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'major': return 'type-major';
      case 'minor': return 'type-minor';
      case 'patch': return 'type-patch';
      default: return '';
    }
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Star size={14} />;
      case 'improvement': return <Zap size={14} />;
      case 'bugfix': return <Bug size={14} />;
      case 'security': return <Shield size={14} />;
      case 'deprecation': return <AlertTriangle size={14} />;
      default: return <Wrench size={14} />;
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'feature': return 'cat-feature';
      case 'improvement': return 'cat-improvement';
      case 'bugfix': return 'cat-bugfix';
      case 'security': return 'cat-security';
      case 'deprecation': return 'cat-deprecation';
      default: return '';
    }
  };

  const stats = {
    totalVersions: changelog.length,
    major: changelog.filter(c => c.type === 'major').length,
    features: changelog.reduce((sum, c) => sum + c.categories.filter(cat => cat.type === 'feature').reduce((s, cat) => s + cat.items.length, 0), 0),
    fixes: changelog.reduce((sum, c) => sum + c.categories.filter(cat => cat.type === 'bugfix').reduce((s, cat) => s + cat.items.length, 0), 0)
  };

  return (
    <div className="changelog-page">
      {/* Header */}
      <div className="changelog-page__header">
        <div className="changelog-page__title-section">
          <div className="changelog-page__icon">
            <FileText size={28} />
          </div>
          <div>
            <h1>Changelog</h1>
            <p>Track all updates, features, and improvements</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Bell size={18} />
            Subscribe
          </button>
          <a href="https://docs.cube.io/changelog" className="btn-outline" target="_blank" rel="noopener noreferrer">
            <BookOpen size={18} />
            Full Docs
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="changelog-page__stats">
        <div className="stat-card">
          <div className="stat-icon versions">
            <Tag size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalVersions}</span>
            <span className="stat-label">Releases</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon major">
            <ArrowUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.major}</span>
            <span className="stat-label">Major Updates</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon features">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.features}</span>
            <span className="stat-label">New Features</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon fixes">
            <Bug size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.fixes}</span>
            <span className="stat-label">Bug Fixes</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="changelog-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search changelog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <div className="filter-group">
            <label>Type:</label>
            <div className="filter-buttons">
              {types.map(type => (
                <button
                  key={type}
                  className={`filter-btn ${typeFilter === type ? 'active' : ''} ${getTypeColor(type)}`}
                  onClick={() => setTypeFilter(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Category:</label>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="category-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="changelog-timeline">
        {filteredChangelog.map((entry, index) => (
          <div key={entry.version} className={`timeline-entry ${expandedVersions.has(entry.version) ? 'expanded' : ''}`}>
            <div className="timeline-marker">
              <div className={`marker-dot ${getTypeColor(entry.type)}`}></div>
              {index < filteredChangelog.length - 1 && <div className="marker-line"></div>}
            </div>
            
            <div className="timeline-content">
              <div className="entry-header" onClick={() => toggleVersion(entry.version)}>
                <div className="entry-info">
                  <div className="entry-title-row">
                    <span className={`version-badge ${getTypeColor(entry.type)}`}>
                      v{entry.version}
                    </span>
                    <h3>{entry.title}</h3>
                    {entry.breaking && (
                      <span className="breaking-badge">
                        <AlertTriangle size={12} />
                        Breaking
                      </span>
                    )}
                  </div>
                  <div className="entry-meta">
                    <span className="date">
                      <Calendar size={14} />
                      {entry.date}
                    </span>
                    <span className={`type-tag ${getTypeColor(entry.type)}`}>
                      {entry.type}
                    </span>
                    <div className="category-tags">
                      {entry.categories.map((cat, idx) => (
                        <span key={idx} className={`category-tag ${getCategoryColor(cat.type)}`}>
                          {getCategoryIcon(cat.type)}
                          {cat.items.length}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="expand-btn">
                  <ChevronRight size={20} />
                </button>
              </div>

              {expandedVersions.has(entry.version) && (
                <div className="entry-details">
                  <p className="entry-description">{entry.description}</p>
                  
                  {entry.categories.map((category, catIdx) => (
                    <div key={catIdx} className={`change-category ${getCategoryColor(category.type)}`}>
                      <div className="category-header">
                        {getCategoryIcon(category.type)}
                        <h4>{category.type.charAt(0).toUpperCase() + category.type.slice(1)}s</h4>
                        <span className="count">{category.items.length}</span>
                      </div>
                      <ul className="change-list">
                        {category.items.map((item, itemIdx) => (
                          <li key={itemIdx} className={item.breaking ? 'breaking' : ''}>
                            <div className="item-header">
                              <Check size={14} />
                              <span className="item-title">{item.title}</span>
                              {item.issueId && (
                                <a href={`https://github.com/cube/issues/${item.issueId.replace('#', '')}`} 
                                   className="issue-link" 
                                   target="_blank" 
                                   rel="noopener noreferrer">
                                  {item.issueId}
                                </a>
                              )}
                              {item.breaking && (
                                <span className="breaking-tag">Breaking</span>
                              )}
                            </div>
                            {item.description && (
                              <p className="item-description">{item.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredChangelog.length === 0 && (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No entries found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Version Support */}
      <div className="version-support">
        <h2>Version Support</h2>
        <div className="support-grid">
          <div className="support-card current">
            <div className="support-header">
              <span className="support-badge current">Current</span>
              <h3>v3.x</h3>
            </div>
            <p>Active development and full support</p>
            <ul>
              <li><Check size={14} /> Security updates</li>
              <li><Check size={14} /> Bug fixes</li>
              <li><Check size={14} /> New features</li>
            </ul>
          </div>
          <div className="support-card maintenance">
            <div className="support-header">
              <span className="support-badge maintenance">Maintenance</span>
              <h3>v2.x</h3>
            </div>
            <p>Critical fixes only until March 2025</p>
            <ul>
              <li><Check size={14} /> Security updates</li>
              <li><Check size={14} /> Critical bugs</li>
            </ul>
          </div>
          <div className="support-card eol">
            <div className="support-header">
              <span className="support-badge eol">End of Life</span>
              <h3>v1.x</h3>
            </div>
            <p>No longer supported</p>
            <ul>
              <li className="disabled">No updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
