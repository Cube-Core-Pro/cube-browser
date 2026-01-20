'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  Calendar,
  ChevronRight,
  MoreVertical,
  FileCheck,
  Shield,
  BookOpen,
  Scale,
  Bell,
  Send,
  Copy,
  ExternalLink,
  History,
  Lock,
  Unlock,
  Archive,
  RefreshCw
} from 'lucide-react';
import './policies.css';

interface Policy {
  id: string;
  title: string;
  category: string;
  version: string;
  status: 'active' | 'draft' | 'review' | 'archived';
  effectiveDate: string;
  lastReviewed: string;
  nextReview: string;
  owner: string;
  department: string;
  acknowledgements: number;
  totalEmployees: number;
  description: string;
  mandatory: boolean;
}

interface PolicyCategory {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface AcknowledgementRecord {
  id: string;
  policyId: string;
  policyName: string;
  employeeName: string;
  acknowledgedAt: string;
  version: string;
}

const policyCategories: PolicyCategory[] = [
  { id: 'conduct', name: 'Code of Conduct', count: 5, icon: <Scale size={18} />, color: '#3b82f6' },
  { id: 'hr', name: 'HR Policies', count: 12, icon: <Users size={18} />, color: '#8b5cf6' },
  { id: 'it', name: 'IT & Security', count: 8, icon: <Shield size={18} />, color: '#10b981' },
  { id: 'health', name: 'Health & Safety', count: 6, icon: <FileCheck size={18} />, color: '#f59e0b' },
  { id: 'finance', name: 'Finance', count: 4, icon: <FileText size={18} />, color: '#ec4899' },
  { id: 'compliance', name: 'Compliance', count: 7, icon: <BookOpen size={18} />, color: '#06b6d4' },
];

const policies: Policy[] = [
  {
    id: 'POL001',
    title: 'Employee Code of Conduct',
    category: 'conduct',
    version: '3.2',
    status: 'active',
    effectiveDate: '2024-01-01',
    lastReviewed: '2023-12-15',
    nextReview: '2024-12-15',
    owner: 'Amanda Torres',
    department: 'Human Resources',
    acknowledgements: 421,
    totalEmployees: 435,
    description: 'Defines expected behavior, ethics, and professional standards for all employees',
    mandatory: true
  },
  {
    id: 'POL002',
    title: 'Remote Work Policy',
    category: 'hr',
    version: '2.1',
    status: 'active',
    effectiveDate: '2023-06-01',
    lastReviewed: '2023-11-20',
    nextReview: '2024-06-01',
    owner: 'Lisa Anderson',
    department: 'Human Resources',
    acknowledgements: 398,
    totalEmployees: 435,
    description: 'Guidelines for remote work arrangements, expectations, and equipment',
    mandatory: true
  },
  {
    id: 'POL003',
    title: 'Information Security Policy',
    category: 'it',
    version: '4.0',
    status: 'active',
    effectiveDate: '2024-01-15',
    lastReviewed: '2024-01-10',
    nextReview: '2025-01-10',
    owner: 'James Liu',
    department: 'IT Security',
    acknowledgements: 405,
    totalEmployees: 435,
    description: 'Data protection, access controls, and security protocols for all systems',
    mandatory: true
  },
  {
    id: 'POL004',
    title: 'Anti-Harassment Policy',
    category: 'conduct',
    version: '2.5',
    status: 'active',
    effectiveDate: '2023-03-01',
    lastReviewed: '2023-09-15',
    nextReview: '2024-03-01',
    owner: 'Amanda Torres',
    department: 'Human Resources',
    acknowledgements: 430,
    totalEmployees: 435,
    description: 'Zero tolerance policy for harassment with reporting procedures',
    mandatory: true
  },
  {
    id: 'POL005',
    title: 'Travel & Expense Policy',
    category: 'finance',
    version: '1.8',
    status: 'review',
    effectiveDate: '2023-01-01',
    lastReviewed: '2023-12-01',
    nextReview: '2024-01-15',
    owner: 'Robert Brown',
    department: 'Finance',
    acknowledgements: 312,
    totalEmployees: 435,
    description: 'Guidelines for business travel, expense submission and reimbursement',
    mandatory: false
  },
  {
    id: 'POL006',
    title: 'Leave & Time Off Policy',
    category: 'hr',
    version: '2.3',
    status: 'active',
    effectiveDate: '2024-01-01',
    lastReviewed: '2023-12-20',
    nextReview: '2024-12-20',
    owner: 'Lisa Anderson',
    department: 'Human Resources',
    acknowledgements: 425,
    totalEmployees: 435,
    description: 'PTO, sick leave, parental leave, and other time off policies',
    mandatory: true
  },
  {
    id: 'POL007',
    title: 'Workplace Safety Guidelines',
    category: 'health',
    version: '3.0',
    status: 'active',
    effectiveDate: '2023-07-01',
    lastReviewed: '2023-06-15',
    nextReview: '2024-06-15',
    owner: 'Michael Ross',
    department: 'Operations',
    acknowledgements: 380,
    totalEmployees: 435,
    description: 'Safety procedures, emergency protocols, and hazard reporting',
    mandatory: true
  },
  {
    id: 'POL008',
    title: 'Social Media Policy',
    category: 'compliance',
    version: '1.5',
    status: 'draft',
    effectiveDate: '',
    lastReviewed: '2024-01-20',
    nextReview: '',
    owner: 'David Kim',
    department: 'Marketing',
    acknowledgements: 0,
    totalEmployees: 435,
    description: 'Guidelines for company representation on social media platforms',
    mandatory: false
  },
  {
    id: 'POL009',
    title: 'Data Privacy Policy',
    category: 'compliance',
    version: '2.8',
    status: 'active',
    effectiveDate: '2023-05-25',
    lastReviewed: '2023-11-10',
    nextReview: '2024-05-25',
    owner: 'Patricia Davis',
    department: 'Legal',
    acknowledgements: 418,
    totalEmployees: 435,
    description: 'GDPR compliance, data handling, and privacy protection procedures',
    mandatory: true
  },
  {
    id: 'POL010',
    title: 'Equipment Usage Policy',
    category: 'it',
    version: '2.0',
    status: 'archived',
    effectiveDate: '2022-01-01',
    lastReviewed: '2023-12-31',
    nextReview: '',
    owner: 'James Liu',
    department: 'IT',
    acknowledgements: 420,
    totalEmployees: 435,
    description: 'Use of company-provided devices and software (replaced by v3.0)',
    mandatory: false
  },
];

const recentAcknowledgements: AcknowledgementRecord[] = [
  { id: 'ACK001', policyId: 'POL001', policyName: 'Employee Code of Conduct', employeeName: 'John Smith', acknowledgedAt: '2024-01-28 14:32', version: '3.2' },
  { id: 'ACK002', policyId: 'POL003', policyName: 'Information Security Policy', employeeName: 'Sarah Johnson', acknowledgedAt: '2024-01-28 13:45', version: '4.0' },
  { id: 'ACK003', policyId: 'POL006', policyName: 'Leave & Time Off Policy', employeeName: 'Michael Chen', acknowledgedAt: '2024-01-28 11:20', version: '2.3' },
  { id: 'ACK004', policyId: 'POL002', policyName: 'Remote Work Policy', employeeName: 'Emily Davis', acknowledgedAt: '2024-01-28 10:15', version: '2.1' },
  { id: 'ACK005', policyId: 'POL004', policyName: 'Anti-Harassment Policy', employeeName: 'Robert Wilson', acknowledgedAt: '2024-01-27 16:50', version: '2.5' },
];

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState<'policies' | 'acknowledgements' | 'reports'>('policies');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || policy.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || policy.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: Policy['status']) => {
    switch (status) {
      case 'active':
        return <span className="status-badge active"><CheckCircle size={12} /> Active</span>;
      case 'draft':
        return <span className="status-badge draft"><Edit size={12} /> Draft</span>;
      case 'review':
        return <span className="status-badge review"><Clock size={12} /> Under Review</span>;
      case 'archived':
        return <span className="status-badge archived"><Archive size={12} /> Archived</span>;
      default:
        return null;
    }
  };

  const getAcknowledgementProgress = (acknowledged: number, total: number) => {
    const percentage = Math.round((acknowledged / total) * 100);
    let colorClass = 'good';
    if (percentage < 80) colorClass = 'warning';
    if (percentage < 60) colorClass = 'danger';
    
    return (
      <div className="progress-container">
        <div className="progress-bar">
          <div className={`progress-fill ${colorClass}`} style={{ width: `${percentage}%` }} />
        </div>
        <span className="progress-text">{percentage}%</span>
      </div>
    );
  };

  const renderPoliciesContent = () => (
    <div className="policies-content">
      {/* Categories */}
      <div className="categories-section">
        <div className="categories-grid">
          <button 
            className={`category-card ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <div className="category-icon all">
              <FileText size={20} />
            </div>
            <div className="category-info">
              <span className="category-name">All Policies</span>
              <span className="category-count">{policies.length} total</span>
            </div>
          </button>
          {policyCategories.map(category => (
            <button 
              key={category.id}
              className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className="category-icon" style={{ background: `${category.color}20`, color: category.color }}>
                {category.icon}
              </div>
              <div className="category-info">
                <span className="category-name">{category.name}</span>
                <span className="category-count">{category.count} policies</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="content-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input 
            type="text"
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select 
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="review">Under Review</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Create Policy
        </button>
      </div>

      {/* Policies Table */}
      <div className="policies-table">
        <div className="table-header">
          <span>Policy</span>
          <span>Category</span>
          <span>Version</span>
          <span>Status</span>
          <span>Acknowledgements</span>
          <span>Next Review</span>
          <span>Actions</span>
        </div>
        {filteredPolicies.map(policy => (
          <div 
            key={policy.id} 
            className="table-row"
            onClick={() => setSelectedPolicy(policy)}
          >
            <div className="col-policy">
              <div className="policy-info">
                <span className="policy-title">
                  {policy.mandatory && <Lock size={12} className="mandatory-icon" />}
                  {policy.title}
                </span>
                <span className="policy-owner">Owner: {policy.owner}</span>
              </div>
            </div>
            <span className="col-category">
              <span className="category-badge">{policyCategories.find(c => c.id === policy.category)?.name}</span>
            </span>
            <span className="col-version">v{policy.version}</span>
            <span className="col-status">{getStatusBadge(policy.status)}</span>
            <span className="col-acknowledgements">
              {policy.status === 'active' ? (
                getAcknowledgementProgress(policy.acknowledgements, policy.totalEmployees)
              ) : (
                <span className="na-text">N/A</span>
              )}
            </span>
            <span className="col-review">
              {policy.nextReview ? policy.nextReview : <span className="na-text">N/A</span>}
            </span>
            <div className="col-actions">
              <button className="action-btn" title="View">
                <Eye size={14} />
              </button>
              <button className="action-btn" title="Edit">
                <Edit size={14} />
              </button>
              <button className="action-btn" title="More">
                <MoreVertical size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAcknowledgementsContent = () => (
    <div className="acknowledgements-content">
      <div className="ack-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">96%</span>
            <span className="stat-label">Overall Compliance</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">47</span>
            <span className="stat-label">Pending Acknowledgements</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon overdue">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">12</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon total">
            <FileCheck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">3,842</span>
            <span className="stat-label">Total This Year</span>
          </div>
        </div>
      </div>

      <div className="ack-grid">
        <div className="ack-section">
          <div className="section-header">
            <h3>Recent Acknowledgements</h3>
            <button className="view-all-btn">View All <ChevronRight size={14} /></button>
          </div>
          <div className="ack-list">
            {recentAcknowledgements.map(ack => (
              <div key={ack.id} className="ack-item">
                <div className="ack-icon">
                  <CheckCircle size={16} />
                </div>
                <div className="ack-info">
                  <span className="ack-employee">{ack.employeeName}</span>
                  <span className="ack-policy">{ack.policyName} (v{ack.version})</span>
                </div>
                <span className="ack-time">{ack.acknowledgedAt}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ack-section">
          <div className="section-header">
            <h3>Pending Actions</h3>
            <button className="btn-outline small">
              <Bell size={14} />
              Send Reminders
            </button>
          </div>
          <div className="pending-list">
            <div className="pending-item">
              <div className="pending-info">
                <span className="pending-policy">Information Security Policy v4.0</span>
                <span className="pending-count">30 employees pending</span>
              </div>
              <button className="action-btn">
                <Send size={14} />
              </button>
            </div>
            <div className="pending-item">
              <div className="pending-info">
                <span className="pending-policy">Code of Conduct v3.2</span>
                <span className="pending-count">14 employees pending</span>
              </div>
              <button className="action-btn">
                <Send size={14} />
              </button>
            </div>
            <div className="pending-item overdue">
              <div className="pending-info">
                <span className="pending-policy">Anti-Harassment Policy v2.5</span>
                <span className="pending-count">5 employees overdue</span>
              </div>
              <button className="action-btn">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportsContent = () => (
    <div className="reports-content">
      <div className="reports-grid">
        <div className="report-card">
          <div className="report-icon">
            <FileCheck size={24} />
          </div>
          <h4>Compliance Summary</h4>
          <p>Overall policy acknowledgement rates by department</p>
          <button className="btn-outline">
            <Download size={14} />
            Generate Report
          </button>
        </div>
        <div className="report-card">
          <div className="report-icon">
            <History size={24} />
          </div>
          <h4>Version History</h4>
          <p>Track all policy changes and updates over time</p>
          <button className="btn-outline">
            <Download size={14} />
            Generate Report
          </button>
        </div>
        <div className="report-card">
          <div className="report-icon">
            <Users size={24} />
          </div>
          <h4>Employee Acknowledgements</h4>
          <p>Detailed acknowledgement records by employee</p>
          <button className="btn-outline">
            <Download size={14} />
            Generate Report
          </button>
        </div>
        <div className="report-card">
          <div className="report-icon">
            <AlertTriangle size={24} />
          </div>
          <h4>Overdue Report</h4>
          <p>List of employees with pending acknowledgements</p>
          <button className="btn-outline">
            <Download size={14} />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="policies-page">
      <header className="policies__header">
        <div className="policies__title-section">
          <div className="policies__icon">
            <FileText size={28} />
          </div>
          <div>
            <h1>Policy Management</h1>
            <p>Create, manage, and track policy acknowledgements</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Upload size={16} />
            Import
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Policy
          </button>
        </div>
      </header>

      <nav className="policies__tabs">
        <button 
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <FileText size={16} />
          Policies
        </button>
        <button 
          className={`tab-btn ${activeTab === 'acknowledgements' ? 'active' : ''}`}
          onClick={() => setActiveTab('acknowledgements')}
        >
          <CheckCircle size={16} />
          Acknowledgements
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <History size={16} />
          Reports
        </button>
      </nav>

      <div className="policies__content">
        {activeTab === 'policies' && renderPoliciesContent()}
        {activeTab === 'acknowledgements' && renderAcknowledgementsContent()}
        {activeTab === 'reports' && renderReportsContent()}
      </div>
    </div>
  );
}
