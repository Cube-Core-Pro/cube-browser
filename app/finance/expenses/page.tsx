'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Building,
  CreditCard,
  Tag,
  FileText,
  Upload,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  PieChart,
  BarChart2,
  Briefcase,
  Plane,
  Car,
  Utensils,
  Monitor,
  Phone,
  Wifi,
  Home,
  Gift,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import './expenses.css';

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  submittedBy: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  merchant: string;
  date: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  receiptUrl?: string;
  paymentMethod: string;
  project?: string;
  notes?: string;
  approvedBy?: string;
  approvedDate?: string;
  reimbursedDate?: string;
  tags: string[];
}

type ExpenseCategory = 
  | 'travel'
  | 'meals'
  | 'office'
  | 'software'
  | 'hardware'
  | 'communication'
  | 'utilities'
  | 'marketing'
  | 'entertainment'
  | 'other';

interface ExpensePolicy {
  id: string;
  name: string;
  category: ExpenseCategory;
  maxAmount: number;
  requiresApproval: boolean;
  approvalThreshold: number;
  description: string;
  isActive: boolean;
}

interface ExpenseReport {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'draft' | 'submitted' | 'approved' | 'paid';
  expenseCount: number;
  submittedBy: string;
}

interface ExpenseMetrics {
  totalExpenses: number;
  pendingApproval: number;
  thisMonth: number;
  lastMonth: number;
  monthlyChange: number;
  topCategory: string;
  averageExpense: number;
  reimbursementPending: number;
}

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  travel: <Plane size={16} />,
  meals: <Utensils size={16} />,
  office: <Briefcase size={16} />,
  software: <Monitor size={16} />,
  hardware: <Monitor size={16} />,
  communication: <Phone size={16} />,
  utilities: <Wifi size={16} />,
  marketing: <Star size={16} />,
  entertainment: <Gift size={16} />,
  other: <Tag size={16} />
};

const categoryColors: Record<ExpenseCategory, string> = {
  travel: '#3b82f6',
  meals: '#f59e0b',
  office: '#10b981',
  software: '#8b5cf6',
  hardware: '#ec4899',
  communication: '#06b6d4',
  utilities: '#6366f1',
  marketing: '#ef4444',
  entertainment: '#14b8a6',
  other: '#6b7280'
};

const sampleExpenses: Expense[] = [
  {
    id: 'EXP-001',
    title: 'Flight to NYC Client Meeting',
    description: 'Round trip flight for quarterly client review',
    amount: 850.00,
    currency: 'USD',
    category: 'travel',
    submittedBy: { id: '1', name: 'John Smith', email: 'john@cube.com', department: 'Sales' },
    merchant: 'American Airlines',
    date: '2025-01-15',
    submittedDate: '2025-01-16',
    status: 'approved',
    paymentMethod: 'Corporate Card',
    project: 'Enterprise Client Q1',
    approvedBy: 'Sarah Manager',
    approvedDate: '2025-01-17',
    tags: ['client', 'q1', 'travel']
  },
  {
    id: 'EXP-002',
    title: 'Team Lunch - Project Kickoff',
    description: 'Team lunch for new project kickoff celebration',
    amount: 245.50,
    currency: 'USD',
    category: 'meals',
    submittedBy: { id: '2', name: 'Emily Davis', email: 'emily@cube.com', department: 'Engineering' },
    merchant: 'The Capital Grille',
    date: '2025-01-20',
    submittedDate: '2025-01-21',
    status: 'pending',
    paymentMethod: 'Personal Card',
    project: 'Platform V3 Launch',
    tags: ['team', 'celebration']
  },
  {
    id: 'EXP-003',
    title: 'Adobe Creative Cloud Annual',
    description: 'Annual subscription for design team',
    amount: 599.88,
    currency: 'USD',
    category: 'software',
    submittedBy: { id: '3', name: 'Michael Chen', email: 'michael@cube.com', department: 'Design' },
    merchant: 'Adobe Inc.',
    date: '2025-01-10',
    submittedDate: '2025-01-11',
    status: 'reimbursed',
    paymentMethod: 'Personal Card',
    reimbursedDate: '2025-01-18',
    tags: ['software', 'subscription', 'design']
  },
  {
    id: 'EXP-004',
    title: 'Office Supplies - Q1',
    description: 'Notebooks, pens, and desk accessories',
    amount: 156.75,
    currency: 'USD',
    category: 'office',
    submittedBy: { id: '4', name: 'Lisa Wong', email: 'lisa@cube.com', department: 'Operations' },
    merchant: 'Staples',
    date: '2025-01-22',
    submittedDate: '2025-01-22',
    status: 'pending',
    paymentMethod: 'Corporate Card',
    tags: ['office', 'supplies']
  },
  {
    id: 'EXP-005',
    title: 'Conference Registration - TechSummit',
    description: 'Registration fee for annual tech conference',
    amount: 1250.00,
    currency: 'USD',
    category: 'travel',
    submittedBy: { id: '5', name: 'David Park', email: 'david@cube.com', department: 'Engineering' },
    merchant: 'TechSummit 2025',
    date: '2025-01-05',
    submittedDate: '2025-01-06',
    status: 'approved',
    paymentMethod: 'Corporate Card',
    project: 'Team Development',
    approvedBy: 'Sarah Manager',
    approvedDate: '2025-01-08',
    tags: ['conference', 'learning']
  },
  {
    id: 'EXP-006',
    title: 'Uber - Client Meetings',
    description: 'Transportation for multiple client meetings',
    amount: 89.40,
    currency: 'USD',
    category: 'travel',
    submittedBy: { id: '1', name: 'John Smith', email: 'john@cube.com', department: 'Sales' },
    merchant: 'Uber',
    date: '2025-01-18',
    submittedDate: '2025-01-19',
    status: 'rejected',
    paymentMethod: 'Personal Card',
    notes: 'Missing itemized receipt',
    tags: ['transport', 'client']
  },
  {
    id: 'EXP-007',
    title: 'AWS Monthly Services',
    description: 'Cloud infrastructure costs for January',
    amount: 3420.00,
    currency: 'USD',
    category: 'software',
    submittedBy: { id: '6', name: 'Alex Turner', email: 'alex@cube.com', department: 'DevOps' },
    merchant: 'Amazon Web Services',
    date: '2025-01-31',
    submittedDate: '2025-02-01',
    status: 'approved',
    paymentMethod: 'Corporate Card',
    project: 'Infrastructure',
    approvedBy: 'CTO Office',
    approvedDate: '2025-02-02',
    tags: ['cloud', 'infrastructure', 'monthly']
  },
  {
    id: 'EXP-008',
    title: 'Marketing Collateral Print',
    description: 'Brochures and business cards for trade show',
    amount: 675.00,
    currency: 'USD',
    category: 'marketing',
    submittedBy: { id: '7', name: 'Jennifer Lee', email: 'jennifer@cube.com', department: 'Marketing' },
    merchant: 'PrintPro Solutions',
    date: '2025-01-25',
    submittedDate: '2025-01-26',
    status: 'pending',
    paymentMethod: 'Corporate Card',
    project: 'Trade Show Q1',
    tags: ['marketing', 'print', 'tradeshow']
  }
];

const samplePolicies: ExpensePolicy[] = [
  {
    id: 'POL-001',
    name: 'Travel Expenses',
    category: 'travel',
    maxAmount: 5000,
    requiresApproval: true,
    approvalThreshold: 500,
    description: 'Covers flights, hotels, and ground transportation',
    isActive: true
  },
  {
    id: 'POL-002',
    name: 'Meals & Entertainment',
    category: 'meals',
    maxAmount: 150,
    requiresApproval: true,
    approvalThreshold: 75,
    description: 'Business meals and client entertainment',
    isActive: true
  },
  {
    id: 'POL-003',
    name: 'Software Subscriptions',
    category: 'software',
    maxAmount: 1000,
    requiresApproval: true,
    approvalThreshold: 200,
    description: 'SaaS tools and software licenses',
    isActive: true
  },
  {
    id: 'POL-004',
    name: 'Office Supplies',
    category: 'office',
    maxAmount: 250,
    requiresApproval: false,
    approvalThreshold: 250,
    description: 'General office supplies and equipment',
    isActive: true
  }
];

const sampleReports: ExpenseReport[] = [
  {
    id: 'RPT-001',
    title: 'January 2025 Expenses',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    totalAmount: 8654.53,
    status: 'submitted',
    expenseCount: 12,
    submittedBy: 'John Smith'
  },
  {
    id: 'RPT-002',
    title: 'Q4 2024 Travel Report',
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    totalAmount: 15420.00,
    status: 'paid',
    expenseCount: 28,
    submittedBy: 'Sales Team'
  },
  {
    id: 'RPT-003',
    title: 'December Marketing',
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    totalAmount: 4230.00,
    status: 'approved',
    expenseCount: 8,
    submittedBy: 'Jennifer Lee'
  }
];

const sampleMetrics: ExpenseMetrics = {
  totalExpenses: 45678.90,
  pendingApproval: 8,
  thisMonth: 12450.00,
  lastMonth: 10890.00,
  monthlyChange: 14.3,
  topCategory: 'travel',
  averageExpense: 342.50,
  reimbursementPending: 3420.00
};

export default function ExpenseManagementPage(): React.JSX.Element {
  const [expenses, setExpenses] = useState<Expense[]>(sampleExpenses);
  const [policies, setPolicies] = useState<ExpensePolicy[]>(samplePolicies);
  const [reports, setReports] = useState<ExpenseReport[]>(sampleReports);
  const [metrics, setMetrics] = useState<ExpenseMetrics>(sampleMetrics);
  const [activeTab, setActiveTab] = useState<'expenses' | 'reports' | 'policies' | 'analytics'>('expenses');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredExpenses = expenses.filter(expense => {
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesSearch = expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.submittedBy.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: Expense['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'rejected': return <XCircle size={14} />;
      case 'reimbursed': return <DollarSign size={14} />;
      default: return null;
    }
  };

  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    expenses.forEach(exp => {
      stats[exp.category] = (stats[exp.category] || 0) + exp.amount;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  };

  return (
    <div className="expense-management">
      {/* Header */}
      <div className="exp__header">
        <div className="exp__title-section">
          <div className="exp__icon">
            <Receipt size={28} />
          </div>
          <div>
            <h1>Expense Management</h1>
            <p>Track, submit, and manage business expenses</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="expense-summary">
        <div className="summary-card total">
          <DollarSign className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.totalExpenses)}</span>
            <span className="summary-label">Total YTD Expenses</span>
          </div>
        </div>
        <div className="summary-card pending">
          <Clock className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{metrics.pendingApproval}</span>
            <span className="summary-label">Pending Approval</span>
          </div>
        </div>
        <div className="summary-card monthly">
          <Calendar className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.thisMonth)}</span>
            <span className="summary-label">This Month</span>
          </div>
        </div>
        <div className="summary-card change">
          {metrics.monthlyChange >= 0 ? (
            <TrendingUp className="summary-icon" size={24} />
          ) : (
            <TrendingDown className="summary-icon" size={24} />
          )}
          <div className="summary-info">
            <span className="summary-value">{metrics.monthlyChange >= 0 ? '+' : ''}{metrics.monthlyChange}%</span>
            <span className="summary-label">vs Last Month</span>
          </div>
        </div>
        <div className="summary-card reimbursement">
          <CreditCard className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.reimbursementPending)}</span>
            <span className="summary-label">Reimbursement Pending</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="exp__tabs">
        <button
          className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <Receipt size={16} />
          Expenses
          <span className="tab-badge">{expenses.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={16} />
          Reports
          <span className="tab-badge">{reports.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <Tag size={16} />
          Policies
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <PieChart size={16} />
          Analytics
        </button>
      </div>

      {/* Content */}
      <div className="exp__content">
        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="expenses-tab">
            <div className="expenses-toolbar">
              <div className="toolbar-left">
                <div className="search-box">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="reimbursed">Reimbursed</option>
                </select>
                <select
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="travel">Travel</option>
                  <option value="meals">Meals</option>
                  <option value="software">Software</option>
                  <option value="office">Office</option>
                  <option value="hardware">Hardware</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="toolbar-right">
                <button className="btn-outline small">
                  <Upload size={14} />
                  Bulk Import
                </button>
              </div>
            </div>

            <div className="expenses-layout">
              <div className="expenses-table">
                <div className="table-header">
                  <span>Expense</span>
                  <span>Category</span>
                  <span>Submitted By</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                {filteredExpenses.map(expense => (
                  <div
                    key={expense.id}
                    className={`table-row ${selectedExpense?.id === expense.id ? 'selected' : ''}`}
                    onClick={() => setSelectedExpense(expense)}
                  >
                    <div className="expense-cell">
                      <div 
                        className="expense-icon"
                        style={{ background: `${categoryColors[expense.category]}20`, color: categoryColors[expense.category] }}
                      >
                        {categoryIcons[expense.category]}
                      </div>
                      <div className="expense-info">
                        <span className="expense-title">{expense.title}</span>
                        <span className="expense-merchant">{expense.merchant} • {formatDate(expense.date)}</span>
                      </div>
                    </div>
                    <div className="category-cell">
                      <span 
                        className="category-badge"
                        style={{ background: `${categoryColors[expense.category]}20`, color: categoryColors[expense.category] }}
                      >
                        {expense.category}
                      </span>
                    </div>
                    <div className="submitter-cell">
                      <span className="submitter-name">{expense.submittedBy.name}</span>
                      <span className="submitter-dept">{expense.submittedBy.department}</span>
                    </div>
                    <div className="amount-cell">
                      <span className="amount">{formatCurrency(expense.amount, expense.currency)}</span>
                    </div>
                    <div className={`status-cell ${expense.status}`}>
                      {getStatusIcon(expense.status)}
                      {expense.status}
                    </div>
                    <div className="actions-cell">
                      <button className="btn-icon small">
                        <Eye size={14} />
                      </button>
                      <button className="btn-icon small">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedExpense && (
                <div className="expense-detail-panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <h3>{selectedExpense.id}</h3>
                      <span className={`status-badge ${selectedExpense.status}`}>
                        {getStatusIcon(selectedExpense.status)}
                        {selectedExpense.status}
                      </span>
                    </div>
                    <button 
                      className="btn-icon"
                      onClick={() => setSelectedExpense(null)}
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                  <div className="panel-content">
                    <div className="expense-header-info">
                      <div 
                        className="expense-category-icon"
                        style={{ background: `${categoryColors[selectedExpense.category]}20`, color: categoryColors[selectedExpense.category] }}
                      >
                        {categoryIcons[selectedExpense.category]}
                      </div>
                      <div>
                        <h4>{selectedExpense.title}</h4>
                        <p>{selectedExpense.description}</p>
                      </div>
                    </div>

                    <div className="expense-amount-display">
                      <span className="amount-label">Total Amount</span>
                      <span className="amount-value">{formatCurrency(selectedExpense.amount, selectedExpense.currency)}</span>
                    </div>

                    <div className="expense-details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Merchant</span>
                        <span className="detail-value">{selectedExpense.merchant}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Category</span>
                        <span className="detail-value capitalize">{selectedExpense.category}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Expense Date</span>
                        <span className="detail-value">{formatDate(selectedExpense.date)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Submitted</span>
                        <span className="detail-value">{formatDate(selectedExpense.submittedDate)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Payment Method</span>
                        <span className="detail-value">{selectedExpense.paymentMethod}</span>
                      </div>
                      {selectedExpense.project && (
                        <div className="detail-item">
                          <span className="detail-label">Project</span>
                          <span className="detail-value">{selectedExpense.project}</span>
                        </div>
                      )}
                    </div>

                    <div className="submitter-info">
                      <h5>Submitted By</h5>
                      <div className="submitter-card">
                        <div className="submitter-avatar">
                          {selectedExpense.submittedBy.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <span className="name">{selectedExpense.submittedBy.name}</span>
                          <span className="email">{selectedExpense.submittedBy.email}</span>
                          <span className="dept">{selectedExpense.submittedBy.department}</span>
                        </div>
                      </div>
                    </div>

                    {selectedExpense.tags.length > 0 && (
                      <div className="expense-tags">
                        <h5>Tags</h5>
                        <div className="tags-list">
                          {selectedExpense.tags.map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedExpense.notes && (
                      <div className="expense-notes">
                        <h5>Notes</h5>
                        <p>{selectedExpense.notes}</p>
                      </div>
                    )}

                    {selectedExpense.approvedBy && (
                      <div className="approval-info">
                        <h5>Approval</h5>
                        <div className="approval-details">
                          <span>Approved by {selectedExpense.approvedBy}</span>
                          {selectedExpense.approvedDate && (
                            <span className="approval-date">on {formatDate(selectedExpense.approvedDate)}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="panel-actions">
                    {selectedExpense.status === 'pending' && (
                      <>
                        <button className="btn-primary">
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button className="btn-outline">
                          <XCircle size={16} />
                          Reject
                        </button>
                      </>
                    )}
                    {selectedExpense.status === 'approved' && (
                      <button className="btn-primary">
                        <DollarSign size={16} />
                        Mark Reimbursed
                      </button>
                    )}
                    <button className="btn-outline">
                      <Edit size={16} />
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="reports-tab">
            <div className="reports-header">
              <h3>Expense Reports</h3>
              <button className="btn-primary">
                <Plus size={16} />
                Create Report
              </button>
            </div>
            <div className="reports-grid">
              {reports.map(report => (
                <div key={report.id} className="report-card">
                  <div className="report-header">
                    <div className="report-icon">
                      <FileText size={20} />
                    </div>
                    <div className="report-info">
                      <h4>{report.title}</h4>
                      <span className="report-period">
                        {formatDate(report.startDate)} - {formatDate(report.endDate)}
                      </span>
                    </div>
                    <span className={`report-status ${report.status}`}>
                      {report.status}
                    </span>
                  </div>
                  <div className="report-stats">
                    <div className="stat">
                      <span className="stat-value">{formatCurrency(report.totalAmount)}</span>
                      <span className="stat-label">Total Amount</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{report.expenseCount}</span>
                      <span className="stat-label">Expenses</span>
                    </div>
                  </div>
                  <div className="report-footer">
                    <span className="report-submitter">
                      <User size={14} />
                      {report.submittedBy}
                    </span>
                    <button className="btn-outline small">
                      <Eye size={14} />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="policies-tab">
            <div className="policies-header">
              <h3>Expense Policies</h3>
              <button className="btn-primary">
                <Plus size={16} />
                Add Policy
              </button>
            </div>
            <div className="policies-grid">
              {policies.map(policy => (
                <div key={policy.id} className={`policy-card ${!policy.isActive ? 'inactive' : ''}`}>
                  <div className="policy-header">
                    <div 
                      className="policy-icon"
                      style={{ background: `${categoryColors[policy.category]}20`, color: categoryColors[policy.category] }}
                    >
                      {categoryIcons[policy.category]}
                    </div>
                    <div className="policy-info">
                      <h4>{policy.name}</h4>
                      <span className="policy-category">{policy.category}</span>
                    </div>
                    <div className={`policy-status ${policy.isActive ? 'active' : 'inactive'}`}>
                      {policy.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <p className="policy-description">{policy.description}</p>
                  <div className="policy-limits">
                    <div className="limit-item">
                      <span className="limit-label">Max Amount</span>
                      <span className="limit-value">{formatCurrency(policy.maxAmount)}</span>
                    </div>
                    <div className="limit-item">
                      <span className="limit-label">Approval Threshold</span>
                      <span className="limit-value">{formatCurrency(policy.approvalThreshold)}</span>
                    </div>
                    <div className="limit-item">
                      <span className="limit-label">Requires Approval</span>
                      <span className="limit-value">{policy.requiresApproval ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  <div className="policy-actions">
                    <button className="btn-outline small">
                      <Edit size={14} />
                      Edit
                    </button>
                    <button className="btn-icon small">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <div className="analytics-header">
              <h3>Expense Analytics</h3>
              <select className="period-select">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Quarter</option>
                <option>This Year</option>
              </select>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card total-spent">
                <div className="card-icon">
                  <DollarSign size={22} />
                </div>
                <div className="card-content">
                  <span className="card-label">Total Spent</span>
                  <span className="card-value">{formatCurrency(metrics.thisMonth)}</span>
                  <span className={`card-change ${metrics.monthlyChange >= 0 ? 'positive' : 'negative'}`}>
                    {metrics.monthlyChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(metrics.monthlyChange)}% vs last month
                  </span>
                </div>
              </div>
              <div className="analytics-card avg-expense">
                <div className="card-icon">
                  <BarChart2 size={22} />
                </div>
                <div className="card-content">
                  <span className="card-label">Average Expense</span>
                  <span className="card-value">{formatCurrency(metrics.averageExpense)}</span>
                  <span className="card-sub">{expenses.length} total expenses</span>
                </div>
              </div>
              <div className="analytics-card top-category">
                <div className="card-icon" style={{ background: `${categoryColors[metrics.topCategory as ExpenseCategory]}20`, color: categoryColors[metrics.topCategory as ExpenseCategory] }}>
                  {categoryIcons[metrics.topCategory as ExpenseCategory]}
                </div>
                <div className="card-content">
                  <span className="card-label">Top Category</span>
                  <span className="card-value capitalize">{metrics.topCategory}</span>
                  <span className="card-sub">Most expenses this period</span>
                </div>
              </div>
              <div className="analytics-card pending-review">
                <div className="card-icon">
                  <Clock size={22} />
                </div>
                <div className="card-content">
                  <span className="card-label">Pending Review</span>
                  <span className="card-value">{metrics.pendingApproval}</span>
                  <span className="card-sub">Awaiting approval</span>
                </div>
              </div>
            </div>

            <div className="analytics-charts">
              <div className="chart-card">
                <h4>Expenses by Category</h4>
                <div className="category-breakdown">
                  {getCategoryStats().map(([category, amount]) => (
                    <div key={category} className="category-item">
                      <div className="category-info">
                        <div 
                          className="category-color"
                          style={{ background: categoryColors[category as ExpenseCategory] }}
                        />
                        <span className="category-name capitalize">{category}</span>
                      </div>
                      <div className="category-bar-container">
                        <div 
                          className="category-bar"
                          style={{ 
                            width: `${(amount / Math.max(...getCategoryStats().map(s => s[1]))) * 100}%`,
                            background: categoryColors[category as ExpenseCategory]
                          }}
                        />
                      </div>
                      <span className="category-amount">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="chart-card">
                <h4>Status Distribution</h4>
                <div className="status-breakdown">
                  {['approved', 'pending', 'reimbursed', 'rejected'].map(status => {
                    const count = expenses.filter(e => e.status === status).length;
                    const percentage = (count / expenses.length) * 100;
                    return (
                      <div key={status} className="status-item">
                        <div className="status-info">
                          <span className={`status-dot ${status}`} />
                          <span className="status-name capitalize">{status}</span>
                        </div>
                        <div className="status-bar-container">
                          <div 
                            className={`status-bar ${status}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="status-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="top-spenders">
              <h4>Top Spenders</h4>
              <div className="spenders-list">
                {Array.from(new Set(expenses.map(e => e.submittedBy.id))).map((userId, index) => {
                  const userExpenses = expenses.filter(e => e.submittedBy.id === userId);
                  const user = userExpenses[0].submittedBy;
                  const total = userExpenses.reduce((sum, e) => sum + e.amount, 0);
                  return (
                    <div key={userId} className="spender-item">
                      <span className="rank">{index + 1}</span>
                      <div className="spender-avatar">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="spender-info">
                        <span className="spender-name">{user.name}</span>
                        <span className="spender-dept">{user.department} • {userExpenses.length} expenses</span>
                      </div>
                      <span className="spender-total">{formatCurrency(total)}</span>
                    </div>
                  );
                }).slice(0, 5)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
