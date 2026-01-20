'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  FileText,
  Calendar,
  AlertTriangle,
  Building2,
  Users,
  Download,
  Upload,
  RefreshCcw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  AlertCircle,
  BadgeCheck,
  ChevronRight,
  MoreHorizontal,
  Plus,
  X,
  Mail,
  Phone,
  Globe,
  Landmark,
  CreditCard,
  Percent,
  PiggyBank,
  Scale
} from 'lucide-react';
import './taxes.css';

interface TaxObligation {
  id: string;
  type: 'federal' | 'state' | 'local' | 'payroll' | 'sales' | 'property';
  name: string;
  authority: string;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'semi-annual';
  nextDueDate: string;
  amount: number;
  estimatedAmount?: number;
  status: 'pending' | 'filed' | 'paid' | 'overdue';
  lastFiledDate?: string;
  accountNumber?: string;
}

interface TaxPayment {
  id: string;
  obligationId: string;
  type: string;
  amount: number;
  paymentDate: string;
  period: string;
  method: 'ach' | 'wire' | 'check' | 'credit_card';
  confirmationNumber?: string;
  status: 'completed' | 'processing' | 'failed' | 'scheduled';
}

interface TaxDocument {
  id: string;
  name: string;
  type: 'form' | 'receipt' | 'notice' | 'filing';
  taxType: string;
  year: number;
  uploadDate: string;
  size: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
}

interface TaxDeduction {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  documented: boolean;
  recurring: boolean;
}

interface TaxMetrics {
  totalTaxLiability: number;
  totalPaid: number;
  pendingPayments: number;
  upcomingDeadlines: number;
  estimatedRefund: number;
  effectiveTaxRate: number;
}

const sampleObligations: TaxObligation[] = [
  {
    id: 'OBL-001',
    type: 'federal',
    name: 'Federal Income Tax',
    authority: 'IRS',
    frequency: 'quarterly',
    nextDueDate: '2025-04-15',
    amount: 45000,
    estimatedAmount: 48500,
    status: 'pending',
    lastFiledDate: '2025-01-15',
    accountNumber: '12-3456789'
  },
  {
    id: 'OBL-002',
    type: 'state',
    name: 'State Income Tax',
    authority: 'California FTB',
    frequency: 'quarterly',
    nextDueDate: '2025-04-15',
    amount: 12500,
    status: 'pending',
    lastFiledDate: '2025-01-15',
    accountNumber: 'CA-987654321'
  },
  {
    id: 'OBL-003',
    type: 'payroll',
    name: 'Federal Payroll Tax (941)',
    authority: 'IRS',
    frequency: 'quarterly',
    nextDueDate: '2025-01-31',
    amount: 28750,
    status: 'filed',
    lastFiledDate: '2025-01-28'
  },
  {
    id: 'OBL-004',
    type: 'sales',
    name: 'State Sales Tax',
    authority: 'CDTFA',
    frequency: 'monthly',
    nextDueDate: '2025-02-28',
    amount: 8450,
    status: 'pending',
    lastFiledDate: '2025-01-31'
  },
  {
    id: 'OBL-005',
    type: 'property',
    name: 'Property Tax',
    authority: 'County Assessor',
    frequency: 'semi-annual',
    nextDueDate: '2025-04-10',
    amount: 15200,
    status: 'paid',
    lastFiledDate: '2024-12-10'
  },
  {
    id: 'OBL-006',
    type: 'local',
    name: 'City Business Tax',
    authority: 'SF Tax Collector',
    frequency: 'annual',
    nextDueDate: '2025-02-28',
    amount: 3500,
    status: 'overdue',
    lastFiledDate: '2024-02-28'
  }
];

const samplePayments: TaxPayment[] = [
  {
    id: 'PAY-001',
    obligationId: 'OBL-001',
    type: 'Federal Income Tax',
    amount: 45000,
    paymentDate: '2025-01-15',
    period: 'Q4 2024',
    method: 'ach',
    confirmationNumber: 'FED-2025-1234567',
    status: 'completed'
  },
  {
    id: 'PAY-002',
    obligationId: 'OBL-002',
    type: 'State Income Tax',
    amount: 12500,
    paymentDate: '2025-01-15',
    period: 'Q4 2024',
    method: 'ach',
    confirmationNumber: 'CA-2025-7654321',
    status: 'completed'
  },
  {
    id: 'PAY-003',
    obligationId: 'OBL-003',
    type: 'Federal Payroll Tax',
    amount: 28750,
    paymentDate: '2025-01-28',
    period: 'Q4 2024',
    method: 'ach',
    confirmationNumber: 'EFTPS-2025-9876543',
    status: 'completed'
  },
  {
    id: 'PAY-004',
    obligationId: 'OBL-004',
    type: 'State Sales Tax',
    amount: 8450,
    paymentDate: '2025-02-28',
    period: 'January 2025',
    method: 'ach',
    status: 'scheduled'
  },
  {
    id: 'PAY-005',
    obligationId: 'OBL-005',
    type: 'Property Tax',
    amount: 15200,
    paymentDate: '2024-12-10',
    period: '2024-2025 H1',
    method: 'check',
    confirmationNumber: 'CHK-2024-5678',
    status: 'completed'
  }
];

const sampleDocuments: TaxDocument[] = [
  {
    id: 'DOC-001',
    name: 'Form 941 Q4 2024',
    type: 'form',
    taxType: 'Payroll Tax',
    year: 2024,
    uploadDate: '2025-01-28',
    size: '245 KB',
    status: 'submitted'
  },
  {
    id: 'DOC-002',
    name: 'Form 1120 Draft',
    type: 'form',
    taxType: 'Corporate Income Tax',
    year: 2024,
    uploadDate: '2025-01-15',
    size: '1.2 MB',
    status: 'draft'
  },
  {
    id: 'DOC-003',
    name: 'CA Form 100 2024',
    type: 'form',
    taxType: 'State Income Tax',
    year: 2024,
    uploadDate: '2025-01-20',
    size: '890 KB',
    status: 'draft'
  },
  {
    id: 'DOC-004',
    name: 'IRS Notice CP2000',
    type: 'notice',
    taxType: 'Federal Income Tax',
    year: 2023,
    uploadDate: '2025-01-10',
    size: '156 KB',
    status: 'accepted'
  },
  {
    id: 'DOC-005',
    name: 'Property Tax Receipt',
    type: 'receipt',
    taxType: 'Property Tax',
    year: 2024,
    uploadDate: '2024-12-10',
    size: '98 KB',
    status: 'accepted'
  }
];

const sampleDeductions: TaxDeduction[] = [
  {
    id: 'DED-001',
    category: 'Office Expenses',
    description: 'Office supplies and equipment',
    amount: 15600,
    date: '2024-12-31',
    documented: true,
    recurring: true
  },
  {
    id: 'DED-002',
    category: 'Professional Services',
    description: 'Legal and accounting fees',
    amount: 45000,
    date: '2024-12-31',
    documented: true,
    recurring: true
  },
  {
    id: 'DED-003',
    category: 'Employee Benefits',
    description: 'Health insurance premiums',
    amount: 89000,
    date: '2024-12-31',
    documented: true,
    recurring: true
  },
  {
    id: 'DED-004',
    category: 'Depreciation',
    description: 'Equipment depreciation',
    amount: 32500,
    date: '2024-12-31',
    documented: true,
    recurring: true
  },
  {
    id: 'DED-005',
    category: 'Travel & Entertainment',
    description: 'Business travel expenses',
    amount: 12800,
    date: '2024-12-31',
    documented: true,
    recurring: false
  },
  {
    id: 'DED-006',
    category: 'R&D Credit',
    description: 'Research and development activities',
    amount: 75000,
    date: '2024-12-31',
    documented: true,
    recurring: true
  }
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getDaysUntil = (dateString: string): number => {
  const today = new Date();
  const targetDate = new Date(dateString);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getTypeIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'federal': return <Landmark size={16} />;
    case 'state': return <Building2 size={16} />;
    case 'local': return <Globe size={16} />;
    case 'payroll': return <Users size={16} />;
    case 'sales': return <Receipt size={16} />;
    case 'property': return <Building2 size={16} />;
    default: return <FileText size={16} />;
  }
};

export default function TaxManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'obligations' | 'payments' | 'documents' | 'deductions'>('overview');
  const [selectedObligation, setSelectedObligation] = useState<TaxObligation | null>(null);
  const [obligations, setObligations] = useState<TaxObligation[]>(sampleObligations);
  const [payments, setPayments] = useState<TaxPayment[]>(samplePayments);
  const [documents, setDocuments] = useState<TaxDocument[]>(sampleDocuments);
  const [deductions, setDeductions] = useState<TaxDeduction[]>(sampleDeductions);
  const [filterType, setFilterType] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const metrics: TaxMetrics = {
    totalTaxLiability: obligations.reduce((sum, o) => sum + o.amount, 0),
    totalPaid: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: obligations.filter(o => o.status === 'pending').length,
    upcomingDeadlines: obligations.filter(o => getDaysUntil(o.nextDueDate) <= 30 && o.status !== 'paid').length,
    estimatedRefund: 12500,
    effectiveTaxRate: 24.5
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const upcomingDeadlines = obligations
    .filter(o => o.status !== 'paid')
    .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
    .slice(0, 4);

  const taxByType = [
    { type: 'Federal', amount: obligations.filter(o => o.type === 'federal').reduce((s, o) => s + o.amount, 0), color: '#3b82f6' },
    { type: 'State', amount: obligations.filter(o => o.type === 'state').reduce((s, o) => s + o.amount, 0), color: '#8b5cf6' },
    { type: 'Payroll', amount: obligations.filter(o => o.type === 'payroll').reduce((s, o) => s + o.amount, 0), color: '#ec4899' },
    { type: 'Sales', amount: obligations.filter(o => o.type === 'sales').reduce((s, o) => s + o.amount, 0), color: '#f59e0b' },
    { type: 'Property', amount: obligations.filter(o => o.type === 'property').reduce((s, o) => s + o.amount, 0), color: '#10b981' },
    { type: 'Local', amount: obligations.filter(o => o.type === 'local').reduce((s, o) => s + o.amount, 0), color: '#06b6d4' }
  ];

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

  const renderOverviewTab = () => {
    const total = taxByType.reduce((sum, t) => sum + t.amount, 0);
    let cumulativePercent = 0;

    return (
      <div className="overview-grid">
        <div className="overview-card span-2">
          <h3>Tax Liability by Type</h3>
          <div className="tax-distribution">
            <div className="donut-chart">
              <svg viewBox="0 0 100 100">
                {taxByType.map((item, index) => {
                  const percent = (item.amount / total) * 100;
                  const startAngle = cumulativePercent * 3.6;
                  const endAngle = (cumulativePercent + percent) * 3.6;
                  cumulativePercent += percent;
                  
                  const largeArcFlag = percent > 50 ? 1 : 0;
                  const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                  
                  return (
                    <path
                      key={index}
                      d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={item.color}
                      opacity={0.85}
                    />
                  );
                })}
                <circle cx="50" cy="50" r="24" fill="#12121a" />
              </svg>
              <div className="donut-center">
                <span className="total-label">Total</span>
                <span className="total-value">{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="distribution-legend">
              {taxByType.map((item, index) => (
                <div key={index} className="legend-item">
                  <span className="legend-color" style={{ background: item.color }} />
                  <span className="legend-label">{item.type}</span>
                  <span className="legend-value">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>Compliance Status</h3>
          <div className="compliance-stats">
            <div className="compliance-item">
              <div className="compliance-icon filed">
                <CheckCircle size={20} />
              </div>
              <div className="compliance-info">
                <span className="compliance-value">{obligations.filter(o => o.status === 'filed' || o.status === 'paid').length}</span>
                <span className="compliance-label">Filed/Paid</span>
              </div>
            </div>
            <div className="compliance-item">
              <div className="compliance-icon pending">
                <Clock size={20} />
              </div>
              <div className="compliance-info">
                <span className="compliance-value">{obligations.filter(o => o.status === 'pending').length}</span>
                <span className="compliance-label">Pending</span>
              </div>
            </div>
            <div className="compliance-item">
              <div className="compliance-icon overdue">
                <AlertTriangle size={20} />
              </div>
              <div className="compliance-info">
                <span className="compliance-value">{obligations.filter(o => o.status === 'overdue').length}</span>
                <span className="compliance-label">Overdue</span>
              </div>
            </div>
          </div>
          <div className="compliance-meter">
            <div className="meter-bar">
              <div 
                className="meter-fill" 
                style={{ 
                  width: `${((obligations.filter(o => o.status === 'filed' || o.status === 'paid').length) / obligations.length) * 100}%` 
                }} 
              />
            </div>
            <span className="meter-label">
              {Math.round(((obligations.filter(o => o.status === 'filed' || o.status === 'paid').length) / obligations.length) * 100)}% Compliance Rate
            </span>
          </div>
        </div>

        <div className="overview-card">
          <h3>Upcoming Deadlines</h3>
          <div className="deadlines-list">
            {upcomingDeadlines.map((obligation) => {
              const daysUntil = getDaysUntil(obligation.nextDueDate);
              return (
                <div 
                  key={obligation.id} 
                  className={`deadline-item ${daysUntil < 7 ? 'urgent' : daysUntil < 14 ? 'warning' : ''}`}
                >
                  <div className="deadline-icon">
                    {getTypeIcon(obligation.type)}
                  </div>
                  <div className="deadline-info">
                    <span className="deadline-name">{obligation.name}</span>
                    <span className="deadline-amount">{formatCurrency(obligation.amount)}</span>
                  </div>
                  <div className="deadline-date">
                    <Calendar size={12} />
                    <span>{daysUntil} days</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overview-card">
          <h3>Deductions Summary</h3>
          <div className="deductions-overview">
            <div className="deductions-total">
              <span className="deductions-amount">{formatCurrency(totalDeductions)}</span>
              <span className="deductions-label">Total Deductions YTD</span>
            </div>
            <div className="deductions-breakdown">
              {deductions.slice(0, 4).map((deduction) => (
                <div key={deduction.id} className="deduction-bar">
                  <div className="deduction-header">
                    <span className="deduction-category">{deduction.category}</span>
                    <span className="deduction-amount">{formatCurrency(deduction.amount)}</span>
                  </div>
                  <div className="deduction-progress">
                    <div 
                      className="deduction-fill"
                      style={{ width: `${(deduction.amount / totalDeductions) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>Tax Rate Analysis</h3>
          <div className="rate-analysis">
            <div className="rate-main">
              <div className="rate-circle">
                <svg viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#2a2a3a"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#rateGradient)"
                    strokeWidth="8"
                    strokeDasharray={`${metrics.effectiveTaxRate * 2.51} 251`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="rateGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="rate-value">
                  <span className="rate-number">{metrics.effectiveTaxRate}%</span>
                  <span className="rate-label">Effective Rate</span>
                </div>
              </div>
            </div>
            <div className="rate-comparison">
              <div className="rate-item">
                <span className="rate-item-label">Federal Rate</span>
                <span className="rate-item-value">21%</span>
              </div>
              <div className="rate-item">
                <span className="rate-item-label">State Rate</span>
                <span className="rate-item-value">8.84%</span>
              </div>
              <div className="rate-item">
                <span className="rate-item-label">Combined</span>
                <span className="rate-item-value">29.84%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderObligationsTab = () => (
    <div className="obligations-content">
      <div className="obligations-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search obligations..." />
          </div>
          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="federal">Federal</option>
            <option value="state">State</option>
            <option value="payroll">Payroll</option>
            <option value="sales">Sales</option>
            <option value="property">Property</option>
            <option value="local">Local</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline small">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary small">
            <Plus size={16} />
            Add Obligation
          </button>
        </div>
      </div>

      <div className="obligations-layout">
        <div className="obligations-table">
          <div className="table-header">
            <span>Obligation</span>
            <span>Authority</span>
            <span>Frequency</span>
            <span>Due Date</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {obligations
            .filter(o => filterType === 'all' || o.type === filterType)
            .map((obligation) => {
              const daysUntil = getDaysUntil(obligation.nextDueDate);
              return (
                <div 
                  key={obligation.id}
                  className={`table-row ${selectedObligation?.id === obligation.id ? 'selected' : ''}`}
                  onClick={() => setSelectedObligation(obligation)}
                >
                  <div className="obligation-cell">
                    <div className={`type-icon ${obligation.type}`}>
                      {getTypeIcon(obligation.type)}
                    </div>
                    <div className="obligation-info">
                      <span className="obligation-name">{obligation.name}</span>
                      <span className="obligation-type">{obligation.type}</span>
                    </div>
                  </div>
                  <div className="authority-cell">{obligation.authority}</div>
                  <div className="frequency-cell capitalize">{obligation.frequency}</div>
                  <div className={`date-cell ${daysUntil < 7 && obligation.status !== 'paid' ? 'urgent' : ''}`}>
                    <Calendar size={12} />
                    {formatDate(obligation.nextDueDate)}
                    {daysUntil < 14 && obligation.status !== 'paid' && (
                      <span className="days-badge">{daysUntil}d</span>
                    )}
                  </div>
                  <div className="amount-cell">{formatCurrency(obligation.amount)}</div>
                  <div className={`status-cell ${obligation.status}`}>
                    {obligation.status === 'filed' && <CheckCircle size={14} />}
                    {obligation.status === 'paid' && <BadgeCheck size={14} />}
                    {obligation.status === 'pending' && <Clock size={14} />}
                    {obligation.status === 'overdue' && <AlertTriangle size={14} />}
                    {obligation.status}
                  </div>
                  <div className="actions-cell">
                    <button className="btn-icon small" title="View details">
                      <Eye size={14} />
                    </button>
                    <button className="btn-icon small" title="More actions">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {selectedObligation && (
          <div className="obligation-detail-panel">
            <div className="panel-header">
              <div className="panel-title">
                <div className={`type-icon large ${selectedObligation.type}`}>
                  {getTypeIcon(selectedObligation.type)}
                </div>
                <div>
                  <h3>{selectedObligation.name}</h3>
                  <span className={`status-badge ${selectedObligation.status}`}>
                    {selectedObligation.status}
                  </span>
                </div>
              </div>
              <button className="btn-icon small" onClick={() => setSelectedObligation(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="panel-content">
              <div className="detail-section">
                <h4>Tax Authority</h4>
                <div className="authority-details">
                  <div className="authority-item">
                    <Building2 size={14} />
                    <span>{selectedObligation.authority}</span>
                  </div>
                  {selectedObligation.accountNumber && (
                    <div className="authority-item">
                      <CreditCard size={14} />
                      <span>Account: {selectedObligation.accountNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h4>Payment Schedule</h4>
                <div className="schedule-grid">
                  <div className="schedule-item">
                    <span className="schedule-label">Frequency</span>
                    <span className="schedule-value capitalize">{selectedObligation.frequency}</span>
                  </div>
                  <div className="schedule-item">
                    <span className="schedule-label">Next Due</span>
                    <span className="schedule-value">{formatDate(selectedObligation.nextDueDate)}</span>
                  </div>
                  <div className="schedule-item">
                    <span className="schedule-label">Amount Due</span>
                    <span className="schedule-value">{formatCurrency(selectedObligation.amount)}</span>
                  </div>
                  {selectedObligation.lastFiledDate && (
                    <div className="schedule-item">
                      <span className="schedule-label">Last Filed</span>
                      <span className="schedule-value">{formatDate(selectedObligation.lastFiledDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedObligation.estimatedAmount && (
                <div className="detail-section">
                  <h4>Estimate vs Actual</h4>
                  <div className="estimate-comparison">
                    <div className="estimate-bar">
                      <div className="bar-label">Estimated</div>
                      <div className="bar-fill estimated" style={{ width: '100%' }} />
                      <div className="bar-value">{formatCurrency(selectedObligation.estimatedAmount)}</div>
                    </div>
                    <div className="estimate-bar">
                      <div className="bar-label">Actual</div>
                      <div 
                        className="bar-fill actual" 
                        style={{ width: `${(selectedObligation.amount / selectedObligation.estimatedAmount) * 100}%` }} 
                      />
                      <div className="bar-value">{formatCurrency(selectedObligation.amount)}</div>
                    </div>
                    <div className="estimate-diff">
                      {selectedObligation.amount < selectedObligation.estimatedAmount ? (
                        <span className="diff-positive">
                          <ArrowDownRight size={14} />
                          {formatCurrency(selectedObligation.estimatedAmount - selectedObligation.amount)} under estimate
                        </span>
                      ) : (
                        <span className="diff-negative">
                          <ArrowUpRight size={14} />
                          {formatCurrency(selectedObligation.amount - selectedObligation.estimatedAmount)} over estimate
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="related-payments">
                <h4>Related Payments</h4>
                <div className="payments-mini-list">
                  {payments
                    .filter(p => p.obligationId === selectedObligation.id)
                    .slice(0, 3)
                    .map((payment) => (
                      <div key={payment.id} className="payment-mini-item">
                        <div className="payment-mini-info">
                          <span className="payment-period">{payment.period}</span>
                          <span className="payment-date">{formatDate(payment.paymentDate)}</span>
                        </div>
                        <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-outline">
                <FileText size={16} />
                View Forms
              </button>
              <button className="btn-primary">
                <DollarSign size={16} />
                Make Payment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="payments-content">
      <div className="payments-header">
        <h3>Payment History</h3>
        <div className="header-actions">
          <button className="btn-outline small">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary small">
            <Plus size={16} />
            Schedule Payment
          </button>
        </div>
      </div>

      <div className="payments-summary">
        <div className="payment-stat">
          <div className="stat-icon completed">
            <CheckCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {formatCurrency(payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0))}
            </span>
            <span className="stat-label">Completed Payments</span>
          </div>
        </div>
        <div className="payment-stat">
          <div className="stat-icon scheduled">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {formatCurrency(payments.filter(p => p.status === 'scheduled').reduce((s, p) => s + p.amount, 0))}
            </span>
            <span className="stat-label">Scheduled Payments</span>
          </div>
        </div>
        <div className="payment-stat">
          <div className="stat-icon processing">
            <RefreshCcw size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{payments.filter(p => p.status === 'processing').length}</span>
            <span className="stat-label">Processing</span>
          </div>
        </div>
      </div>

      <div className="payments-table">
        <div className="table-header">
          <span>Payment ID</span>
          <span>Tax Type</span>
          <span>Period</span>
          <span>Amount</span>
          <span>Method</span>
          <span>Date</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {payments.map((payment) => (
          <div key={payment.id} className="table-row">
            <div className="id-cell">{payment.id}</div>
            <div className="type-cell">{payment.type}</div>
            <div className="period-cell">{payment.period}</div>
            <div className="amount-cell">{formatCurrency(payment.amount)}</div>
            <div className="method-cell uppercase">{payment.method}</div>
            <div className="date-cell">
              <Calendar size={12} />
              {formatDate(payment.paymentDate)}
            </div>
            <div className={`status-cell ${payment.status}`}>
              {payment.status === 'completed' && <CheckCircle size={14} />}
              {payment.status === 'scheduled' && <Clock size={14} />}
              {payment.status === 'processing' && <RefreshCcw size={14} />}
              {payment.status === 'failed' && <XCircle size={14} />}
              {payment.status}
            </div>
            <div className="actions-cell">
              <button className="btn-icon small" title="View receipt">
                <FileText size={14} />
              </button>
              <button className="btn-icon small" title="Download">
                <Download size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="documents-content">
      <div className="documents-header">
        <h3>Tax Documents</h3>
        <div className="header-actions">
          <button className="btn-outline small">
            <Filter size={16} />
            Filter
          </button>
          <button className="btn-primary small">
            <Upload size={16} />
            Upload Document
          </button>
        </div>
      </div>

      <div className="documents-grid">
        {documents.map((doc) => (
          <div key={doc.id} className="document-card">
            <div className="doc-icon">
              <FileSpreadsheet size={24} />
            </div>
            <div className="doc-info">
              <span className="doc-name">{doc.name}</span>
              <div className="doc-meta">
                <span className="doc-type">{doc.taxType}</span>
                <span className="doc-year">{doc.year}</span>
              </div>
            </div>
            <div className="doc-footer">
              <span className={`doc-status ${doc.status}`}>{doc.status}</span>
              <div className="doc-actions">
                <button className="btn-icon small" title="Preview">
                  <Eye size={14} />
                </button>
                <button className="btn-icon small" title="Download">
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDeductionsTab = () => (
    <div className="deductions-content">
      <div className="deductions-header">
        <h3>Tax Deductions & Credits</h3>
        <div className="header-actions">
          <button className="btn-outline small">
            <Calculator size={16} />
            Calculate Savings
          </button>
          <button className="btn-primary small">
            <Plus size={16} />
            Add Deduction
          </button>
        </div>
      </div>

      <div className="deductions-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <PiggyBank size={24} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(totalDeductions)}</span>
            <span className="summary-label">Total Deductions</span>
          </div>
        </div>
        <div className="summary-savings">
          <Scale size={16} />
          <span>Estimated Tax Savings: <strong>{formatCurrency(totalDeductions * 0.245)}</strong></span>
        </div>
      </div>

      <div className="deductions-table">
        <div className="table-header">
          <span>Category</span>
          <span>Description</span>
          <span>Amount</span>
          <span>Date</span>
          <span>Documented</span>
          <span>Recurring</span>
          <span>Actions</span>
        </div>
        {deductions.map((deduction) => (
          <div key={deduction.id} className="table-row">
            <div className="category-cell">{deduction.category}</div>
            <div className="description-cell">{deduction.description}</div>
            <div className="amount-cell">{formatCurrency(deduction.amount)}</div>
            <div className="date-cell">
              <Calendar size={12} />
              {formatDate(deduction.date)}
            </div>
            <div className={`documented-cell ${deduction.documented ? 'yes' : 'no'}`}>
              {deduction.documented ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {deduction.documented ? 'Yes' : 'No'}
            </div>
            <div className={`recurring-cell ${deduction.recurring ? 'yes' : 'no'}`}>
              {deduction.recurring ? 'Yes' : 'No'}
            </div>
            <div className="actions-cell">
              <button className="btn-icon small" title="Edit">
                <Eye size={14} />
              </button>
              <button className="btn-icon small" title="Attach document">
                <FileText size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="tax-management">
      <div className="tax__header">
        <div className="tax__title-section">
          <div className="tax__icon">
            <Receipt size={28} />
          </div>
          <div>
            <h1>Tax Management</h1>
            <p>Track obligations, payments, and maximize deductions</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCcw size={16} className={isRefreshing ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary">
            <Calculator size={16} />
            Tax Calculator
          </button>
        </div>
      </div>

      <div className="tax-summary">
        <div className="summary-card liability">
          <div className="summary-icon">
            <DollarSign size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.totalTaxLiability)}</span>
            <span className="summary-label">Total Tax Liability</span>
          </div>
        </div>
        <div className="summary-card paid">
          <div className="summary-icon">
            <CheckCircle size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.totalPaid)}</span>
            <span className="summary-label">Total Paid YTD</span>
          </div>
        </div>
        <div className="summary-card pending">
          <div className="summary-icon">
            <Clock size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{metrics.pendingPayments}</span>
            <span className="summary-label">Pending Filings</span>
          </div>
        </div>
        <div className="summary-card deadlines">
          <div className="summary-icon">
            <AlertCircle size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{metrics.upcomingDeadlines}</span>
            <span className="summary-label">Upcoming Deadlines</span>
          </div>
        </div>
        <div className="summary-card rate">
          <div className="summary-icon">
            <Percent size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{metrics.effectiveTaxRate}%</span>
            <span className="summary-label">Effective Tax Rate</span>
          </div>
        </div>
      </div>

      <div className="tax__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'obligations' ? 'active' : ''}`}
          onClick={() => setActiveTab('obligations')}
        >
          <FileText size={16} />
          Obligations
          <span className="tab-badge">{obligations.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <CreditCard size={16} />
          Payments
          <span className="tab-badge">{payments.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileSpreadsheet size={16} />
          Documents
          <span className="tab-badge">{documents.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'deductions' ? 'active' : ''}`}
          onClick={() => setActiveTab('deductions')}
        >
          <PiggyBank size={16} />
          Deductions
          <span className="tab-badge">{deductions.length}</span>
        </button>
      </div>

      <div className="tax__content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'obligations' && renderObligationsTab()}
        {activeTab === 'payments' && renderPaymentsTab()}
        {activeTab === 'documents' && renderDocumentsTab()}
        {activeTab === 'deductions' && renderDeductionsTab()}
      </div>
    </div>
  );
}
