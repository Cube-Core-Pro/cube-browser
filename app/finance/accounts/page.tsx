'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
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
  Calendar,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  Plus,
  X,
  Mail,
  Phone,
  FileText,
  CreditCard,
  Banknote,
  Receipt,
  AlertTriangle,
  Send,
  History,
  Target,
  PieChart
} from 'lucide-react';
import './accounts.css';

interface Invoice {
  id: string;
  type: 'receivable' | 'payable';
  number: string;
  entity: string;
  entityType: 'customer' | 'vendor';
  amount: number;
  dueDate: string;
  issueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partial' | 'cancelled';
  paidAmount: number;
  category: string;
  description: string;
  paymentTerms: string;
}

interface Account {
  id: string;
  name: string;
  type: 'customer' | 'vendor';
  email: string;
  phone: string;
  balance: number;
  totalTransactions: number;
  paymentTerms: string;
  status: 'active' | 'inactive' | 'on-hold';
  lastTransaction?: string;
}

interface Transaction {
  id: string;
  invoiceId: string;
  type: 'payment' | 'credit' | 'adjustment';
  amount: number;
  date: string;
  method: 'check' | 'ach' | 'wire' | 'credit_card' | 'cash';
  reference?: string;
  status: 'completed' | 'pending' | 'failed';
}

interface AgingBucket {
  label: string;
  days: string;
  receivable: number;
  payable: number;
  count: number;
}

interface AccountsMetrics {
  totalReceivable: number;
  totalPayable: number;
  netPosition: number;
  overdueReceivable: number;
  overduePayable: number;
  dsodays: number;
  dpodays: number;
  collectionRate: number;
}

const sampleInvoices: Invoice[] = [
  {
    id: 'INV-001',
    type: 'receivable',
    number: 'AR-2025-0001',
    entity: 'Acme Corporation',
    entityType: 'customer',
    amount: 45000,
    dueDate: '2025-02-15',
    issueDate: '2025-01-15',
    status: 'sent',
    paidAmount: 0,
    category: 'Software Services',
    description: 'Enterprise license Q1 2025',
    paymentTerms: 'Net 30'
  },
  {
    id: 'INV-002',
    type: 'receivable',
    number: 'AR-2025-0002',
    entity: 'TechStart Inc',
    entityType: 'customer',
    amount: 28500,
    dueDate: '2025-01-25',
    issueDate: '2024-12-25',
    status: 'overdue',
    paidAmount: 0,
    category: 'Consulting',
    description: 'Implementation services',
    paymentTerms: 'Net 30'
  },
  {
    id: 'INV-003',
    type: 'receivable',
    number: 'AR-2025-0003',
    entity: 'Global Enterprises',
    entityType: 'customer',
    amount: 125000,
    dueDate: '2025-02-28',
    issueDate: '2025-01-28',
    status: 'partial',
    paidAmount: 75000,
    category: 'Software Services',
    description: 'Annual subscription renewal',
    paymentTerms: 'Net 30'
  },
  {
    id: 'INV-004',
    type: 'payable',
    number: 'AP-2025-0001',
    entity: 'Cloud Hosting Pro',
    entityType: 'vendor',
    amount: 18500,
    dueDate: '2025-02-10',
    issueDate: '2025-01-10',
    status: 'sent',
    paidAmount: 0,
    category: 'Infrastructure',
    description: 'Cloud hosting services January',
    paymentTerms: 'Net 30'
  },
  {
    id: 'INV-005',
    type: 'payable',
    number: 'AP-2025-0002',
    entity: 'Office Supplies Co',
    entityType: 'vendor',
    amount: 3200,
    dueDate: '2025-01-20',
    issueDate: '2025-01-05',
    status: 'paid',
    paidAmount: 3200,
    category: 'Office',
    description: 'Q1 office supplies',
    paymentTerms: 'Net 15'
  },
  {
    id: 'INV-006',
    type: 'payable',
    number: 'AP-2025-0003',
    entity: 'Legal Partners LLP',
    entityType: 'vendor',
    amount: 12500,
    dueDate: '2025-02-05',
    issueDate: '2025-01-05',
    status: 'sent',
    paidAmount: 0,
    category: 'Professional Services',
    description: 'Legal consultation January',
    paymentTerms: 'Net 30'
  },
  {
    id: 'INV-007',
    type: 'receivable',
    number: 'AR-2025-0004',
    entity: 'Innovate Labs',
    entityType: 'customer',
    amount: 67500,
    dueDate: '2025-03-01',
    issueDate: '2025-02-01',
    status: 'draft',
    paidAmount: 0,
    category: 'Development',
    description: 'Custom development project',
    paymentTerms: 'Net 30'
  },
  {
    id: 'INV-008',
    type: 'payable',
    number: 'AP-2025-0004',
    entity: 'Marketing Agency X',
    entityType: 'vendor',
    amount: 25000,
    dueDate: '2025-01-15',
    issueDate: '2024-12-15',
    status: 'overdue',
    paidAmount: 0,
    category: 'Marketing',
    description: 'Q4 2024 marketing campaign',
    paymentTerms: 'Net 30'
  }
];

const sampleAccounts: Account[] = [
  {
    id: 'ACC-001',
    name: 'Acme Corporation',
    type: 'customer',
    email: 'billing@acme.com',
    phone: '+1 (555) 123-4567',
    balance: 45000,
    totalTransactions: 24,
    paymentTerms: 'Net 30',
    status: 'active',
    lastTransaction: '2025-01-15'
  },
  {
    id: 'ACC-002',
    name: 'TechStart Inc',
    type: 'customer',
    email: 'ap@techstart.io',
    phone: '+1 (555) 234-5678',
    balance: 28500,
    totalTransactions: 12,
    paymentTerms: 'Net 30',
    status: 'on-hold',
    lastTransaction: '2024-12-25'
  },
  {
    id: 'ACC-003',
    name: 'Global Enterprises',
    type: 'customer',
    email: 'finance@global-ent.com',
    phone: '+1 (555) 345-6789',
    balance: 50000,
    totalTransactions: 36,
    paymentTerms: 'Net 30',
    status: 'active',
    lastTransaction: '2025-01-28'
  },
  {
    id: 'ACC-004',
    name: 'Cloud Hosting Pro',
    type: 'vendor',
    email: 'billing@cloudhostingpro.com',
    phone: '+1 (555) 456-7890',
    balance: -18500,
    totalTransactions: 18,
    paymentTerms: 'Net 30',
    status: 'active',
    lastTransaction: '2025-01-10'
  },
  {
    id: 'ACC-005',
    name: 'Legal Partners LLP',
    type: 'vendor',
    email: 'accounts@legalpartners.com',
    phone: '+1 (555) 567-8901',
    balance: -12500,
    totalTransactions: 8,
    paymentTerms: 'Net 30',
    status: 'active',
    lastTransaction: '2025-01-05'
  }
];

const sampleTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    invoiceId: 'INV-003',
    type: 'payment',
    amount: 75000,
    date: '2025-01-28',
    method: 'wire',
    reference: 'WIR-2025-001',
    status: 'completed'
  },
  {
    id: 'TXN-002',
    invoiceId: 'INV-005',
    type: 'payment',
    amount: 3200,
    date: '2025-01-20',
    method: 'ach',
    reference: 'ACH-2025-015',
    status: 'completed'
  },
  {
    id: 'TXN-003',
    invoiceId: 'INV-002',
    type: 'payment',
    amount: 10000,
    date: '2025-01-30',
    method: 'ach',
    status: 'pending'
  }
];

const agingBuckets: AgingBucket[] = [
  { label: 'Current', days: '0-30', receivable: 237500, payable: 56200, count: 8 },
  { label: '31-60', days: '31-60', receivable: 28500, payable: 25000, count: 3 },
  { label: '61-90', days: '61-90', receivable: 0, payable: 0, count: 0 },
  { label: '90+', days: '90+', receivable: 0, payable: 0, count: 0 }
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

const getDaysOverdue = (dueDate: string): number => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today.getTime() - due.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

const getDaysUntil = (dateString: string): number => {
  const today = new Date();
  const targetDate = new Date(dateString);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'receivable' | 'payable' | 'accounts' | 'aging'>('overview');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>(sampleInvoices);
  const [accounts, setAccounts] = useState<Account[]>(sampleAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const metrics: AccountsMetrics = {
    totalReceivable: invoices.filter(i => i.type === 'receivable' && i.status !== 'paid').reduce((s, i) => s + (i.amount - i.paidAmount), 0),
    totalPayable: invoices.filter(i => i.type === 'payable' && i.status !== 'paid').reduce((s, i) => s + (i.amount - i.paidAmount), 0),
    netPosition: 0,
    overdueReceivable: invoices.filter(i => i.type === 'receivable' && i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
    overduePayable: invoices.filter(i => i.type === 'payable' && i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
    dsodays: 32,
    dpodays: 28,
    collectionRate: 94.5
  };
  
  metrics.netPosition = metrics.totalReceivable - metrics.totalPayable;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const receivableInvoices = invoices.filter(i => i.type === 'receivable');
  const payableInvoices = invoices.filter(i => i.type === 'payable');

  const renderOverviewTab = () => {
    const totalAR = agingBuckets.reduce((s, b) => s + b.receivable, 0);
    const totalAP = agingBuckets.reduce((s, b) => s + b.payable, 0);

    return (
      <div className="overview-grid">
        <div className="overview-card cash-position">
          <h3>Cash Position</h3>
          <div className="position-summary">
            <div className="position-item receivable">
              <div className="position-icon">
                <ArrowDownLeft size={20} />
              </div>
              <div className="position-info">
                <span className="position-label">Receivable</span>
                <span className="position-value">{formatCurrency(metrics.totalReceivable)}</span>
              </div>
            </div>
            <div className="position-divider">
              <span className="vs-label">vs</span>
            </div>
            <div className="position-item payable">
              <div className="position-icon">
                <ArrowUpRight size={20} />
              </div>
              <div className="position-info">
                <span className="position-label">Payable</span>
                <span className="position-value">{formatCurrency(metrics.totalPayable)}</span>
              </div>
            </div>
          </div>
          <div className="net-position">
            <span className="net-label">Net Position</span>
            <span className={`net-value ${metrics.netPosition >= 0 ? 'positive' : 'negative'}`}>
              {metrics.netPosition >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {formatCurrency(Math.abs(metrics.netPosition))}
            </span>
          </div>
        </div>

        <div className="overview-card aging-summary">
          <h3>Aging Summary</h3>
          <div className="aging-bars">
            {agingBuckets.map((bucket, index) => (
              <div key={index} className="aging-bar-group">
                <div className="aging-label">{bucket.label}</div>
                <div className="aging-bars-container">
                  <div className="aging-bar receivable">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${(bucket.receivable / totalAR) * 100}%` }}
                    />
                    <span className="bar-value">{formatCurrency(bucket.receivable)}</span>
                  </div>
                  <div className="aging-bar payable">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${(bucket.payable / totalAP) * 100}%` }}
                    />
                    <span className="bar-value">{formatCurrency(bucket.payable)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="aging-legend">
            <span className="legend-item receivable"><span className="dot" /> Receivable</span>
            <span className="legend-item payable"><span className="dot" /> Payable</span>
          </div>
        </div>

        <div className="overview-card performance-metrics">
          <h3>Performance Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a3a" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="url(#dsoGradient)" 
                    strokeWidth="8"
                    strokeDasharray={`${(metrics.dsodays / 45) * 251} 251`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="dsoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="metric-value">{metrics.dsodays}</div>
              </div>
              <span className="metric-label">DSO (Days)</span>
            </div>
            <div className="metric-item">
              <div className="metric-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a3a" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="url(#dpoGradient)" 
                    strokeWidth="8"
                    strokeDasharray={`${(metrics.dpodays / 45) * 251} 251`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="dpoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="metric-value">{metrics.dpodays}</div>
              </div>
              <span className="metric-label">DPO (Days)</span>
            </div>
            <div className="metric-item">
              <div className="metric-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a3a" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="url(#collectionGradient)" 
                    strokeWidth="8"
                    strokeDasharray={`${(metrics.collectionRate / 100) * 251} 251`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="collectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="metric-value">{metrics.collectionRate}%</div>
              </div>
              <span className="metric-label">Collection Rate</span>
            </div>
          </div>
        </div>

        <div className="overview-card recent-activity">
          <h3>Recent Transactions</h3>
          <div className="activity-list">
            {transactions.slice(0, 4).map((txn) => (
              <div key={txn.id} className="activity-item">
                <div className={`activity-icon ${txn.type}`}>
                  {txn.type === 'payment' ? <Banknote size={16} /> : <Receipt size={16} />}
                </div>
                <div className="activity-info">
                  <span className="activity-desc">{txn.invoiceId}</span>
                  <span className="activity-date">{formatDate(txn.date)}</span>
                </div>
                <div className="activity-amount">
                  <span className={txn.type === 'payment' ? 'positive' : ''}>{formatCurrency(txn.amount)}</span>
                  <span className={`activity-status ${txn.status}`}>{txn.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card overdue-alerts">
          <h3>Overdue Alerts</h3>
          <div className="alerts-list">
            {invoices.filter(i => i.status === 'overdue').map((invoice) => (
              <div key={invoice.id} className={`alert-item ${invoice.type}`}>
                <div className="alert-icon">
                  <AlertTriangle size={16} />
                </div>
                <div className="alert-info">
                  <span className="alert-entity">{invoice.entity}</span>
                  <span className="alert-details">
                    {invoice.number} • {getDaysOverdue(invoice.dueDate)} days overdue
                  </span>
                </div>
                <span className="alert-amount">{formatCurrency(invoice.amount)}</span>
              </div>
            ))}
            {invoices.filter(i => i.status === 'overdue').length === 0 && (
              <div className="no-alerts">
                <CheckCircle size={24} />
                <span>No overdue invoices</span>
              </div>
            )}
          </div>
        </div>

        <div className="overview-card top-accounts">
          <h3>Top Accounts by Balance</h3>
          <div className="accounts-preview">
            {accounts
              .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
              .slice(0, 4)
              .map((account) => (
                <div key={account.id} className="account-preview-item">
                  <div className={`account-avatar ${account.type}`}>
                    {account.type === 'customer' ? <Users size={16} /> : <Building2 size={16} />}
                  </div>
                  <div className="account-preview-info">
                    <span className="account-name">{account.name}</span>
                    <span className="account-type">{account.type}</span>
                  </div>
                  <span className={`account-balance ${account.balance >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(Math.abs(account.balance))}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const renderInvoicesTab = (type: 'receivable' | 'payable') => {
    const filteredInvoices = invoices.filter(i => 
      i.type === type && (filterStatus === 'all' || i.status === filterStatus)
    );

    return (
      <div className="invoices-content">
        <div className="invoices-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <Search size={16} />
              <input type="text" placeholder={`Search ${type === 'receivable' ? 'AR' : 'AP'} invoices...`} />
            </div>
            <select 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="toolbar-right">
            <button className="btn-outline small">
              <Download size={16} />
              Export
            </button>
            <button className="btn-primary small">
              <Plus size={16} />
              New {type === 'receivable' ? 'Invoice' : 'Bill'}
            </button>
          </div>
        </div>

        <div className="invoices-layout">
          <div className="invoices-table">
            <div className="table-header">
              <span>Invoice</span>
              <span>{type === 'receivable' ? 'Customer' : 'Vendor'}</span>
              <span>Amount</span>
              <span>Due Date</span>
              <span>Balance</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {filteredInvoices.map((invoice) => {
              const balance = invoice.amount - invoice.paidAmount;
              const daysUntil = getDaysUntil(invoice.dueDate);
              return (
                <div 
                  key={invoice.id}
                  className={`table-row ${selectedInvoice?.id === invoice.id ? 'selected' : ''}`}
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <div className="invoice-cell">
                    <div className={`invoice-icon ${type}`}>
                      {type === 'receivable' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="invoice-info">
                      <span className="invoice-number">{invoice.number}</span>
                      <span className="invoice-category">{invoice.category}</span>
                    </div>
                  </div>
                  <div className="entity-cell">{invoice.entity}</div>
                  <div className="amount-cell">{formatCurrency(invoice.amount)}</div>
                  <div className={`date-cell ${daysUntil < 0 ? 'overdue' : daysUntil < 7 ? 'warning' : ''}`}>
                    <Calendar size={12} />
                    {formatDate(invoice.dueDate)}
                  </div>
                  <div className="balance-cell">
                    {invoice.status === 'paid' ? (
                      <span className="paid-badge">Paid</span>
                    ) : (
                      formatCurrency(balance)
                    )}
                  </div>
                  <div className={`status-cell ${invoice.status}`}>
                    {invoice.status === 'paid' && <CheckCircle size={14} />}
                    {invoice.status === 'sent' && <Send size={14} />}
                    {invoice.status === 'partial' && <Clock size={14} />}
                    {invoice.status === 'overdue' && <AlertTriangle size={14} />}
                    {invoice.status === 'draft' && <FileText size={14} />}
                    {invoice.status}
                  </div>
                  <div className="actions-cell">
                    <button className="btn-icon small" title="View">
                      <Eye size={14} />
                    </button>
                    <button className="btn-icon small" title="More">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedInvoice && (
            <div className="invoice-detail-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <div className={`invoice-icon large ${selectedInvoice.type}`}>
                    {selectedInvoice.type === 'receivable' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <h3>{selectedInvoice.number}</h3>
                    <span className={`status-badge ${selectedInvoice.status}`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>
                <button className="btn-icon small" onClick={() => setSelectedInvoice(null)}>
                  <X size={16} />
                </button>
              </div>

              <div className="panel-content">
                <div className="detail-section">
                  <h4>{selectedInvoice.type === 'receivable' ? 'Customer' : 'Vendor'}</h4>
                  <div className="entity-details">
                    <div className="entity-name">{selectedInvoice.entity}</div>
                    <div className="entity-contact">
                      <Mail size={12} />
                      <span>billing@{selectedInvoice.entity.toLowerCase().replace(/\s+/g, '')}.com</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Invoice Details</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Issue Date</span>
                      <span className="detail-value">{formatDate(selectedInvoice.issueDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Due Date</span>
                      <span className="detail-value">{formatDate(selectedInvoice.dueDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Terms</span>
                      <span className="detail-value">{selectedInvoice.paymentTerms}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Category</span>
                      <span className="detail-value">{selectedInvoice.category}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Amount Summary</h4>
                  <div className="amount-summary">
                    <div className="amount-row">
                      <span>Invoice Amount</span>
                      <span className="amount">{formatCurrency(selectedInvoice.amount)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Paid Amount</span>
                      <span className="amount paid">{formatCurrency(selectedInvoice.paidAmount)}</span>
                    </div>
                    <div className="amount-row total">
                      <span>Balance Due</span>
                      <span className="amount">{formatCurrency(selectedInvoice.amount - selectedInvoice.paidAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Description</h4>
                  <p className="description">{selectedInvoice.description}</p>
                </div>

                <div className="detail-section">
                  <h4>Payment History</h4>
                  <div className="payment-history">
                    {transactions
                      .filter(t => t.invoiceId === selectedInvoice.id)
                      .map((txn) => (
                        <div key={txn.id} className="payment-history-item">
                          <div className="payment-icon">
                            <Banknote size={14} />
                          </div>
                          <div className="payment-info">
                            <span className="payment-method">{txn.method.toUpperCase()}</span>
                            <span className="payment-date">{formatDate(txn.date)}</span>
                          </div>
                          <span className="payment-amount">{formatCurrency(txn.amount)}</span>
                        </div>
                      ))}
                    {transactions.filter(t => t.invoiceId === selectedInvoice.id).length === 0 && (
                      <div className="no-payments">No payments recorded</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="panel-actions">
                {selectedInvoice.type === 'receivable' ? (
                  <>
                    <button className="btn-outline">
                      <Send size={16} />
                      Send Reminder
                    </button>
                    <button className="btn-primary">
                      <Banknote size={16} />
                      Record Payment
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-outline">
                      <FileText size={16} />
                      View Bill
                    </button>
                    <button className="btn-primary">
                      <DollarSign size={16} />
                      Pay Now
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAccountsTab = () => (
    <div className="accounts-content">
      <div className="accounts-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search accounts..." />
          </div>
          <select className="filter-select">
            <option value="all">All Types</option>
            <option value="customer">Customers</option>
            <option value="vendor">Vendors</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline small">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary small">
            <Plus size={16} />
            Add Account
          </button>
        </div>
      </div>

      <div className="accounts-table">
        <div className="table-header">
          <span>Account</span>
          <span>Type</span>
          <span>Balance</span>
          <span>Transactions</span>
          <span>Terms</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {accounts.map((account) => (
          <div key={account.id} className="table-row">
            <div className="account-cell">
              <div className={`account-avatar ${account.type}`}>
                {account.type === 'customer' ? <Users size={16} /> : <Building2 size={16} />}
              </div>
              <div className="account-info">
                <span className="account-name">{account.name}</span>
                <span className="account-email">{account.email}</span>
              </div>
            </div>
            <div className={`type-cell ${account.type}`}>
              {account.type}
            </div>
            <div className={`balance-cell ${account.balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(Math.abs(account.balance))}
              {account.balance < 0 && <span className="balance-label">owed</span>}
            </div>
            <div className="transactions-cell">
              {account.totalTransactions}
            </div>
            <div className="terms-cell">{account.paymentTerms}</div>
            <div className={`status-cell ${account.status}`}>
              {account.status === 'active' && <CheckCircle size={14} />}
              {account.status === 'inactive' && <XCircle size={14} />}
              {account.status === 'on-hold' && <AlertCircle size={14} />}
              {account.status}
            </div>
            <div className="actions-cell">
              <button className="btn-icon small" title="View account">
                <Eye size={14} />
              </button>
              <button className="btn-icon small" title="Transaction history">
                <History size={14} />
              </button>
              <button className="btn-icon small" title="More">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAgingTab = () => {
    const totalAR = agingBuckets.reduce((s, b) => s + b.receivable, 0);
    const totalAP = agingBuckets.reduce((s, b) => s + b.payable, 0);

    return (
      <div className="aging-content">
        <div className="aging-header">
          <h3>Aging Analysis</h3>
          <div className="header-actions">
            <button className="btn-outline small">
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>

        <div className="aging-grid">
          <div className="aging-section">
            <div className="section-header receivable">
              <ArrowDownLeft size={20} />
              <h4>Accounts Receivable</h4>
              <span className="section-total">{formatCurrency(totalAR)}</span>
            </div>
            <div className="aging-table">
              <div className="aging-table-header">
                <span>Aging Period</span>
                <span>Amount</span>
                <span>% of Total</span>
                <span>Count</span>
              </div>
              {agingBuckets.map((bucket, index) => (
                <div key={index} className="aging-table-row">
                  <div className="period-cell">
                    <span className="period-label">{bucket.label}</span>
                    <span className="period-days">{bucket.days} days</span>
                  </div>
                  <div className="amount-cell">{formatCurrency(bucket.receivable)}</div>
                  <div className="percent-cell">
                    <div className="percent-bar">
                      <div 
                        className="percent-fill receivable" 
                        style={{ width: `${(bucket.receivable / totalAR) * 100}%` }}
                      />
                    </div>
                    <span>{totalAR > 0 ? ((bucket.receivable / totalAR) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="count-cell">{bucket.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="aging-section">
            <div className="section-header payable">
              <ArrowUpRight size={20} />
              <h4>Accounts Payable</h4>
              <span className="section-total">{formatCurrency(totalAP)}</span>
            </div>
            <div className="aging-table">
              <div className="aging-table-header">
                <span>Aging Period</span>
                <span>Amount</span>
                <span>% of Total</span>
                <span>Count</span>
              </div>
              {agingBuckets.map((bucket, index) => (
                <div key={index} className="aging-table-row">
                  <div className="period-cell">
                    <span className="period-label">{bucket.label}</span>
                    <span className="period-days">{bucket.days} days</span>
                  </div>
                  <div className="amount-cell">{formatCurrency(bucket.payable)}</div>
                  <div className="percent-cell">
                    <div className="percent-bar">
                      <div 
                        className="percent-fill payable" 
                        style={{ width: `${totalAP > 0 ? (bucket.payable / totalAP) * 100 : 0}%` }}
                      />
                    </div>
                    <span>{totalAP > 0 ? ((bucket.payable / totalAP) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="count-cell">{bucket.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="accounts-management">
      <div className="acc__header">
        <div className="acc__title-section">
          <div className="acc__icon">
            <Wallet size={28} />
          </div>
          <div>
            <h1>Accounts Receivable & Payable</h1>
            <p>Manage invoices, bills, and account balances</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCcw size={16} className={isRefreshing ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary">
            <PieChart size={16} />
            Reports
          </button>
        </div>
      </div>

      <div className="accounts-summary">
        <div className="summary-card receivable">
          <div className="summary-icon">
            <ArrowDownLeft size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.totalReceivable)}</span>
            <span className="summary-label">Total Receivable</span>
          </div>
        </div>
        <div className="summary-card payable">
          <div className="summary-icon">
            <ArrowUpRight size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.totalPayable)}</span>
            <span className="summary-label">Total Payable</span>
          </div>
        </div>
        <div className="summary-card overdue-ar">
          <div className="summary-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.overdueReceivable)}</span>
            <span className="summary-label">Overdue AR</span>
          </div>
        </div>
        <div className="summary-card overdue-ap">
          <div className="summary-icon">
            <AlertCircle size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.overduePayable)}</span>
            <span className="summary-label">Overdue AP</span>
          </div>
        </div>
        <div className="summary-card dso">
          <div className="summary-icon">
            <Target size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{metrics.dsodays} days</span>
            <span className="summary-label">Days Sales Outstanding</span>
          </div>
        </div>
      </div>

      <div className="acc__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => { setActiveTab('overview'); setSelectedInvoice(null); }}
        >
          <TrendingUp size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'receivable' ? 'active' : ''}`}
          onClick={() => { setActiveTab('receivable'); setSelectedInvoice(null); }}
        >
          <ArrowDownLeft size={16} />
          Receivable
          <span className="tab-badge">{receivableInvoices.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'payable' ? 'active' : ''}`}
          onClick={() => { setActiveTab('payable'); setSelectedInvoice(null); }}
        >
          <ArrowUpRight size={16} />
          Payable
          <span className="tab-badge">{payableInvoices.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => { setActiveTab('accounts'); setSelectedInvoice(null); }}
        >
          <Users size={16} />
          Accounts
          <span className="tab-badge">{accounts.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'aging' ? 'active' : ''}`}
          onClick={() => { setActiveTab('aging'); setSelectedInvoice(null); }}
        >
          <Clock size={16} />
          Aging
        </button>
      </div>

      <div className="acc__content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'receivable' && renderInvoicesTab('receivable')}
        {activeTab === 'payable' && renderInvoicesTab('payable')}
        {activeTab === 'accounts' && renderAccountsTab()}
        {activeTab === 'aging' && renderAgingTab()}
      </div>
    </div>
  );
}
