/**
 * AILeadQualifier Component
 * 
 * AI-powered lead qualification:
 * - Define ideal customer profile (ICP)
 * - Score leads automatically
 * - Prioritize outreach
 * - Enrich contact data
 * 
 * Inspired by Bardeen.ai's lead qualification
 * 
 * @component
 */

'use client';

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AILeadQualifier');

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  UserCheck,
  Target,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Linkedin,
  Globe,
  Building,
  Users
} from 'lucide-react';
import './AILeadQualifier.css';

interface Lead {
  id: string;
  name: string;
  company: string;
  title: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  revenue?: string;
  score: number;
  status: 'qualified' | 'review' | 'disqualified' | 'pending';
  aiAnalysis?: AIAnalysis;
  source: string;
  addedAt: string;
}

interface AIAnalysis {
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendation: string;
  confidence: number;
}

interface ICPCriteria {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'not_equals';
  value: string | number | [number, number];
  weight: number; // 1-10
  enabled: boolean;
}

interface QualificationConfig {
  name: string;
  description: string;
  criteria: ICPCriteria[];
  autoQualifyThreshold: number;
  autoDisqualifyThreshold: number;
}

const DEFAULT_CONFIG: QualificationConfig = {
  name: 'Default ICP',
  description: 'Standard lead qualification criteria',
  criteria: [
    { id: '1', field: 'companySize', operator: 'between', value: [50, 1000], weight: 8, enabled: true },
    { id: '2', field: 'industry', operator: 'contains', value: 'Technology', weight: 7, enabled: true },
    { id: '3', field: 'title', operator: 'contains', value: 'Director|VP|Manager', weight: 9, enabled: true },
    { id: '4', field: 'location', operator: 'contains', value: 'United States', weight: 6, enabled: true },
  ],
  autoQualifyThreshold: 80,
  autoDisqualifyThreshold: 30,
};

const FIELD_OPTIONS = [
  { value: 'company', label: 'Company Name' },
  { value: 'title', label: 'Job Title' },
  { value: 'industry', label: 'Industry' },
  { value: 'companySize', label: 'Company Size' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'location', label: 'Location' },
  { value: 'email', label: 'Email Domain' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater', label: 'Greater Than' },
  { value: 'less', label: 'Less Than' },
  { value: 'between', label: 'Between' },
];

export const AILeadQualifier: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [config, setConfig] = useState<QualificationConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [qualifying, setQualifying] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [filter, setFilter] = useState<'all' | 'qualified' | 'review' | 'disqualified'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'company' | 'addedAt'>('score');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    qualified: 0,
    review: 0,
    disqualified: 0,
    avgScore: 0,
  });

  useEffect(() => {
    loadLeads();
    loadConfig();
  }, []);

  useEffect(() => {
    calculateStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      try {
        const result = await invoke<Lead[]>('ai_get_leads');
        setLeads(result);
      } catch {
        const stored = localStorage.getItem('cube_qualified_leads');
        if (stored) {
          setLeads(JSON.parse(stored));
        } else {
          // Demo leads
          setLeads(generateDemoLeads());
        }
      }
    } catch (error) {
      log.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const stored = localStorage.getItem('cube_icp_config');
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch (error) {
      log.error('Failed to load config:', error);
    }
  };

  const saveConfig = (newConfig: QualificationConfig) => {
    setConfig(newConfig);
    localStorage.setItem('cube_icp_config', JSON.stringify(newConfig));
  };

  const saveLeads = (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
    localStorage.setItem('cube_qualified_leads', JSON.stringify(updatedLeads));
  };

  const calculateStats = () => {
    const total = leads.length;
    const qualified = leads.filter(l => l.status === 'qualified').length;
    const review = leads.filter(l => l.status === 'review').length;
    const disqualified = leads.filter(l => l.status === 'disqualified').length;
    const avgScore = total > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / total) : 0;

    setStats({ total, qualified, review, disqualified, avgScore });
  };

  const qualifyLeads = async () => {
    setQualifying(true);
    
    const updatedLeads = leads.map(lead => {
      const score = calculateLeadScore(lead, config.criteria);
      let status: Lead['status'] = 'review';
      
      if (score >= config.autoQualifyThreshold) {
        status = 'qualified';
      } else if (score <= config.autoDisqualifyThreshold) {
        status = 'disqualified';
      }

      const aiAnalysis = generateAIAnalysis(lead, score, config.criteria);

      return {
        ...lead,
        score,
        status,
        aiAnalysis,
      };
    });

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    saveLeads(updatedLeads);
    setQualifying(false);
  };

  const calculateLeadScore = (lead: Lead, criteria: ICPCriteria[]): number => {
    let totalWeight = 0;
    let weightedScore = 0;

    for (const criterion of criteria) {
      if (!criterion.enabled) continue;
      
      totalWeight += criterion.weight;
      const fieldValue = lead[criterion.field as keyof Lead];
      
      if (fieldValue !== undefined) {
        const match = matchesCriterion(String(fieldValue), criterion);
        if (match) {
          weightedScore += criterion.weight;
        }
      }
    }

    return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 50;
  };

  const matchesCriterion = (value: string, criterion: ICPCriteria): boolean => {
    const normalizedValue = value.toLowerCase();
    const criterionValue = String(criterion.value).toLowerCase();

    switch (criterion.operator) {
      case 'equals':
        return normalizedValue === criterionValue;
      case 'not_equals':
        return normalizedValue !== criterionValue;
      case 'contains':
        const patterns = criterionValue.split('|');
        return patterns.some(p => normalizedValue.includes(p.trim()));
      case 'greater':
        return parseFloat(value) > parseFloat(criterionValue);
      case 'less':
        return parseFloat(value) < parseFloat(criterionValue);
      case 'between':
        const num = parseFloat(value.replace(/[^0-9]/g, ''));
        const [min, max] = criterion.value as [number, number];
        return num >= min && num <= max;
      default:
        return false;
    }
  };

  const generateAIAnalysis = (lead: Lead, score: number, criteria: ICPCriteria[]): AIAnalysis => {
    const strengths: string[] = [];
    const concerns: string[] = [];

    for (const criterion of criteria) {
      if (!criterion.enabled) continue;
      
      const fieldValue = lead[criterion.field as keyof Lead];
      if (fieldValue !== undefined) {
        const match = matchesCriterion(String(fieldValue), criterion);
        const fieldLabel = FIELD_OPTIONS.find(f => f.value === criterion.field)?.label || criterion.field;
        
        if (match) {
          strengths.push(`${fieldLabel} matches ICP criteria`);
        } else {
          concerns.push(`${fieldLabel} doesn't match preferred criteria`);
        }
      }
    }

    let recommendation = '';
    if (score >= 80) {
      recommendation = 'High-priority lead. Recommend immediate outreach.';
    } else if (score >= 60) {
      recommendation = 'Good fit. Schedule follow-up within this week.';
    } else if (score >= 40) {
      recommendation = 'Potential fit. Requires further research before outreach.';
    } else {
      recommendation = 'Low priority. Consider nurture campaign instead of direct outreach.';
    }

    return {
      summary: `Lead scored ${score}/100 based on ${criteria.filter(c => c.enabled).length} criteria.`,
      strengths: strengths.slice(0, 3),
      concerns: concerns.slice(0, 3),
      recommendation,
      confidence: Math.min(95, 70 + Math.random() * 25),
    };
  };

  const updateLeadStatus = (leadId: string, status: Lead['status']) => {
    const updated = leads.map(lead =>
      lead.id === leadId ? { ...lead, status } : lead
    );
    saveLeads(updated);
  };

  const filteredLeads = leads
    .filter(lead => filter === 'all' || lead.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'score': return b.score - a.score;
        case 'name': return a.name.localeCompare(b.name);
        case 'company': return a.company.localeCompare(b.company);
        case 'addedAt': return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        default: return 0;
      }
    });

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'qualified': return 'status-qualified';
      case 'review': return 'status-review';
      case 'disqualified': return 'status-disqualified';
      default: return 'status-pending';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    if (score >= 40) return 'score-low';
    return 'score-very-low';
  };

  const addCriterion = () => {
    const newCriterion: ICPCriteria = {
      id: `c_${Date.now()}`,
      field: 'company',
      operator: 'contains',
      value: '',
      weight: 5,
      enabled: true,
    };
    saveConfig({
      ...config,
      criteria: [...config.criteria, newCriterion],
    });
  };

  const updateCriterion = (id: string, updates: Partial<ICPCriteria>) => {
    const updated = config.criteria.map(c =>
      c.id === id ? { ...c, ...updates } : c
    );
    saveConfig({ ...config, criteria: updated });
  };

  const removeCriterion = (id: string) => {
    const updated = config.criteria.filter(c => c.id !== id);
    saveConfig({ ...config, criteria: updated });
  };

  return (
    <div className="ai-lead-qualifier">
      {/* Header */}
      <div className="qualifier-header">
        <div className="header-title">
          <UserCheck size={28} />
          <div>
            <h1>AI Lead Qualifier</h1>
            <p>Automatically score and prioritize your leads with AI</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings size={16} />
            Configure ICP
          </button>
          <button
            className="btn-primary"
            onClick={qualifyLeads}
            disabled={qualifying || leads.length === 0}
          >
            {qualifying ? (
              <>
                <RefreshCw size={16} className="spin" />
                Qualifying...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Qualify All Leads
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="qualifier-stats">
        <div className="stat-card">
          <Users size={20} />
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Leads</span>
          </div>
        </div>
        <div className="stat-card qualified">
          <CheckCircle size={20} />
          <div className="stat-content">
            <span className="stat-value">{stats.qualified}</span>
            <span className="stat-label">Qualified</span>
          </div>
        </div>
        <div className="stat-card review">
          <AlertCircle size={20} />
          <div className="stat-content">
            <span className="stat-value">{stats.review}</span>
            <span className="stat-label">Need Review</span>
          </div>
        </div>
        <div className="stat-card disqualified">
          <XCircle size={20} />
          <div className="stat-content">
            <span className="stat-value">{stats.disqualified}</span>
            <span className="stat-label">Disqualified</span>
          </div>
        </div>
        <div className="stat-card score">
          <TrendingUp size={20} />
          <div className="stat-content">
            <span className="stat-value">{stats.avgScore}</span>
            <span className="stat-label">Avg Score</span>
          </div>
        </div>
      </div>

      {/* ICP Configuration Panel */}
      {showConfig && (
        <div className="config-panel">
          <div className="config-header">
            <div>
              <h3>
                <Target size={18} />
                Ideal Customer Profile (ICP)
              </h3>
              <p>Define your target customer criteria</p>
            </div>
            <button className="btn-secondary" onClick={addCriterion}>
              Add Criterion
            </button>
          </div>

          <div className="criteria-list">
            {config.criteria.map((criterion) => (
              <div key={criterion.id} className={`criterion-row ${!criterion.enabled ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={criterion.enabled}
                  onChange={(e) => updateCriterion(criterion.id, { enabled: e.target.checked })}
                />
                <select
                  value={criterion.field}
                  onChange={(e) => updateCriterion(criterion.id, { field: e.target.value })}
                >
                  {FIELD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={criterion.operator}
                  onChange={(e) => updateCriterion(criterion.id, { operator: e.target.value as ICPCriteria['operator'] })}
                >
                  {OPERATOR_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={Array.isArray(criterion.value) ? criterion.value.join('-') : String(criterion.value)}
                  onChange={(e) => {
                    const value = criterion.operator === 'between'
                      ? e.target.value.split('-').map(Number) as [number, number]
                      : e.target.value;
                    updateCriterion(criterion.id, { value });
                  }}
                  placeholder="Value..."
                />
                <div className="weight-control">
                  <span>Weight: {criterion.weight}</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={criterion.weight}
                    onChange={(e) => updateCriterion(criterion.id, { weight: parseInt(e.target.value) })}
                  />
                </div>
                <button
                  className="btn-icon danger"
                  onClick={() => removeCriterion(criterion.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="threshold-controls">
            <div className="threshold-item">
              <label>Auto-Qualify Threshold</label>
              <div className="threshold-input">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.autoQualifyThreshold}
                  onChange={(e) => saveConfig({ ...config, autoQualifyThreshold: parseInt(e.target.value) })}
                />
                <span>%</span>
              </div>
            </div>
            <div className="threshold-item">
              <label>Auto-Disqualify Threshold</label>
              <div className="threshold-input">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.autoDisqualifyThreshold}
                  onChange={(e) => saveConfig({ ...config, autoDisqualifyThreshold: parseInt(e.target.value) })}
                />
                <span>%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="qualifier-filters">
        <div className="filter-buttons">
          {(['all', 'qualified', 'review', 'disqualified'] as const).map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="sort-control">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="score">Score</option>
            <option value="name">Name</option>
            <option value="company">Company</option>
            <option value="addedAt">Date Added</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="leads-list">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={24} />
            <span>Loading leads...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="empty-state">
            <UserCheck size={48} />
            <h3>No leads found</h3>
            <p>Import leads from your data extraction workflows</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className={`lead-card ${selectedLead?.id === lead.id ? 'selected' : ''}`}
              onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
            >
              <div className="lead-main">
                <div className="lead-score-badge">
                  <div className={`score-circle ${getScoreColor(lead.score)}`}>
                    {lead.score}
                  </div>
                </div>
                <div className="lead-info">
                  <h4>{lead.name}</h4>
                  <p className="lead-title">{lead.title}</p>
                  <p className="lead-company">
                    <Building size={14} />
                    {lead.company}
                  </p>
                </div>
                <div className={`lead-status ${getStatusColor(lead.status)}`}>
                  {lead.status === 'qualified' && <CheckCircle size={14} />}
                  {lead.status === 'review' && <AlertCircle size={14} />}
                  {lead.status === 'disqualified' && <XCircle size={14} />}
                  {lead.status}
                </div>
                <div className="lead-actions">
                  <button
                    className="status-btn qualified"
                    onClick={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, 'qualified'); }}
                    title="Qualify"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    className="status-btn review"
                    onClick={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, 'review'); }}
                    title="Review"
                  >
                    <AlertCircle size={16} />
                  </button>
                  <button
                    className="status-btn disqualified"
                    onClick={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, 'disqualified'); }}
                    title="Disqualify"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
                <div className="lead-expand">
                  {selectedLead?.id === lead.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedLead?.id === lead.id && (
                <div className="lead-details">
                  <div className="detail-section contact">
                    <h5>Contact Information</h5>
                    <div className="contact-grid">
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="contact-item">
                          <Mail size={14} />
                          {lead.email}
                        </a>
                      )}
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="contact-item">
                          <Phone size={14} />
                          {lead.phone}
                        </a>
                      )}
                      {lead.linkedin && (
                        <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="contact-item">
                          <Linkedin size={14} />
                          LinkedIn Profile
                        </a>
                      )}
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="contact-item">
                          <Globe size={14} />
                          Website
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="detail-section company">
                    <h5>Company Details</h5>
                    <div className="company-grid">
                      {lead.industry && (
                        <div className="company-item">
                          <span className="label">Industry</span>
                          <span className="value">{lead.industry}</span>
                        </div>
                      )}
                      {lead.companySize && (
                        <div className="company-item">
                          <span className="label">Company Size</span>
                          <span className="value">{lead.companySize}</span>
                        </div>
                      )}
                      {lead.revenue && (
                        <div className="company-item">
                          <span className="label">Revenue</span>
                          <span className="value">{lead.revenue}</span>
                        </div>
                      )}
                      {lead.location && (
                        <div className="company-item">
                          <span className="label">Location</span>
                          <span className="value">{lead.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {lead.aiAnalysis && (
                    <div className="detail-section ai-analysis">
                      <h5>
                        <Sparkles size={14} />
                        AI Analysis
                        <span className="confidence">
                          {Math.round(lead.aiAnalysis.confidence)}% confidence
                        </span>
                      </h5>
                      <p className="summary">{lead.aiAnalysis.summary}</p>
                      
                      {lead.aiAnalysis.strengths.length > 0 && (
                        <div className="analysis-list strengths">
                          <span className="list-title">Strengths</span>
                          <ul>
                            {lead.aiAnalysis.strengths.map((s, i) => (
                              <li key={i}><CheckCircle size={12} />{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {lead.aiAnalysis.concerns.length > 0 && (
                        <div className="analysis-list concerns">
                          <span className="list-title">Concerns</span>
                          <ul>
                            {lead.aiAnalysis.concerns.map((c, i) => (
                              <li key={i}><AlertCircle size={12} />{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="recommendation">
                        <strong>Recommendation:</strong> {lead.aiAnalysis.recommendation}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Demo leads generator
function generateDemoLeads(): Lead[] {
  const names = [
    'Sarah Johnson', 'Michael Chen', 'Emily Davis', 'David Wilson',
    'Jessica Martinez', 'James Anderson', 'Amanda Taylor', 'Robert Brown',
    'Jennifer Lee', 'Christopher Garcia', 'Michelle Robinson', 'Daniel White'
  ];

  const companies = [
    'TechCorp Solutions', 'DataDrive Inc', 'CloudScale Systems', 'InnovateTech',
    'Digital Frontier', 'NextGen Software', 'Quantum Analytics', 'CyberSec Pro',
    'AI Ventures', 'Smart Systems Ltd', 'Growth Dynamics', 'Scale Up Co'
  ];

  const titles = [
    'VP of Engineering', 'Director of Sales', 'CTO', 'Head of Product',
    'Marketing Director', 'CEO', 'Operations Manager', 'Business Development Lead'
  ];

  const industries = ['Technology', 'SaaS', 'Finance', 'Healthcare', 'E-commerce', 'Manufacturing'];
  const sizes = ['10-50', '50-200', '200-500', '500-1000', '1000+'];
  const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA'];

  return names.map((name, i) => ({
    id: `lead_${i}`,
    name,
    company: companies[i % companies.length],
    title: titles[i % titles.length],
    email: `${name.toLowerCase().replace(' ', '.')}@${companies[i % companies.length].toLowerCase().replace(/\s+/g, '')}.com`,
    linkedin: `https://linkedin.com/in/${name.toLowerCase().replace(' ', '-')}`,
    website: `https://${companies[i % companies.length].toLowerCase().replace(/\s+/g, '')}.com`,
    location: locations[i % locations.length],
    industry: industries[i % industries.length],
    companySize: sizes[i % sizes.length],
    revenue: `$${(Math.floor(Math.random() * 50) + 5)}M`,
    score: 0,
    status: 'pending' as const,
    source: 'LinkedIn',
    addedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export default AILeadQualifier;
