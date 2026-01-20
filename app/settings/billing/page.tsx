'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Receipt,
  Download,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  RefreshCw,
  DollarSign,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Building,
  Eye,
  MoreVertical,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Banknote,
  PiggyBank,
  Mail,
  Printer,
  ExternalLink
} from 'lucide-react';
import './billing.css';

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  description: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  brand?: string;
  last4: string;
  expiry?: string;
  isDefault: boolean;
}

interface BillingStats {
  currentBalance: number;
  pendingCharges: number;
  lastPayment: number;
  nextBillingDate: string;
}

interface UsageData {
  month: string;
  amount: number;
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv_1',
    number: 'INV-2025-0127',
    date: '2025-01-27',
    dueDate: '2025-02-10',
    amount: 499.00,
    status: 'pending',
    description: 'Business Plan - Monthly',
    items: [
      { name: 'Business Plan Subscription', quantity: 1, unitPrice: 399.00, total: 399.00 },
      { name: 'Additional Team Members (5)', quantity: 5, unitPrice: 20.00, total: 100.00 }
    ]
  },
  {
    id: 'inv_2',
    number: 'INV-2025-0115',
    date: '2025-01-15',
    dueDate: '2025-01-29',
    amount: 149.00,
    status: 'paid',
    description: 'API Usage - Overage',
    items: [
      { name: 'API Requests Overage (149k)', quantity: 149, unitPrice: 1.00, total: 149.00 }
    ]
  },
  {
    id: 'inv_3',
    number: 'INV-2024-1227',
    date: '2024-12-27',
    dueDate: '2025-01-10',
    amount: 499.00,
    status: 'paid',
    description: 'Business Plan - Monthly',
    items: [
      { name: 'Business Plan Subscription', quantity: 1, unitPrice: 399.00, total: 399.00 },
      { name: 'Additional Team Members (5)', quantity: 5, unitPrice: 20.00, total: 100.00 }
    ]
  },
  {
    id: 'inv_4',
    number: 'INV-2024-1127',
    date: '2024-11-27',
    dueDate: '2024-12-11',
    amount: 499.00,
    status: 'paid',
    description: 'Business Plan - Monthly',
    items: [
      { name: 'Business Plan Subscription', quantity: 1, unitPrice: 399.00, total: 399.00 },
      { name: 'Additional Team Members (5)', quantity: 5, unitPrice: 20.00, total: 100.00 }
    ]
  },
  {
    id: 'inv_5',
    number: 'INV-2024-1027',
    date: '2024-10-27',
    dueDate: '2024-11-10',
    amount: 399.00,
    status: 'paid',
    description: 'Business Plan - Monthly',
    items: [
      { name: 'Business Plan Subscription', quantity: 1, unitPrice: 399.00, total: 399.00 }
    ]
  }
];

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'card',
    brand: 'Visa',
    last4: '4242',
    expiry: '12/26',
    isDefault: true
  },
  {
    id: 'pm_2',
    type: 'card',
    brand: 'Mastercard',
    last4: '8888',
    expiry: '09/25',
    isDefault: false
  },
  {
    id: 'pm_3',
    type: 'bank',
    last4: '6789',
    isDefault: false
  }
];

const MOCK_STATS: BillingStats = {
  currentBalance: 0,
  pendingCharges: 499.00,
  lastPayment: 149.00,
  nextBillingDate: '2025-02-01'
};

const MOCK_USAGE: UsageData[] = [
  { month: 'Aug', amount: 399 },
  { month: 'Sep', amount: 399 },
  { month: 'Oct', amount: 399 },
  { month: 'Nov', amount: 499 },
  { month: 'Dec', amount: 499 },
  { month: 'Jan', amount: 648 }
];

export default function BillingPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [stats, setStats] = useState<BillingStats>(MOCK_STATS);
  const [usage, setUsage] = useState<UsageData[]>(MOCK_USAGE);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('invoices');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
    };
    loadData();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'overdue': return <AlertTriangle size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return null;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          invoice.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const maxUsage = Math.max(...usage.map(u => u.amount));

  if (loading) {
    return (
      <div className="billing-page">
        <div className="loading-container">
          <RefreshCw size={32} className="spin" />
          <p>Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-page">
      {/* Header */}
      <header className="billing-header">
        <div className="header-title">
          <Receipt size={28} />
          <div>
            <h1>Billing & Invoices</h1>
            <p>Manage payments, invoices, and billing history</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <Download size={18} />
            Export All
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            Add Payment Method
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-icon balance">
            <Wallet size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Current Balance</span>
            <span className="stat-value">{formatCurrency(stats.currentBalance)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Pending Charges</span>
            <span className="stat-value">{formatCurrency(stats.pendingCharges)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon paid">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Last Payment</span>
            <span className="stat-value">{formatCurrency(stats.lastPayment)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon next">
            <Calendar size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Next Billing</span>
            <span className="stat-value">{formatDate(stats.nextBillingDate)}</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="billing-content">
        {/* Left Column - Invoices & Usage */}
        <div className="main-column">
          {/* Tabs */}
          <div className="tabs-nav">
            <button 
              className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}
              onClick={() => setActiveTab('invoices')}
            >
              <FileText size={18} />
              Invoices
            </button>
            <button 
              className={`tab ${activeTab === 'usage' ? 'active' : ''}`}
              onClick={() => setActiveTab('usage')}
            >
              <TrendingUp size={18} />
              Usage History
            </button>
          </div>

          {activeTab === 'invoices' && (
            <>
              {/* Filters */}
              <div className="filters-section">
                <div className="search-box">
                  <Search size={18} />
                  <input 
                    type="text"
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <ChevronDown size={16} className="select-arrow" />
                </div>
              </div>

              {/* Invoices Table */}
              <div className="invoices-table">
                <div className="table-header">
                  <span>Invoice</span>
                  <span>Date</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="table-row">
                    <div className="invoice-info">
                      <span className="invoice-number">{invoice.number}</span>
                      <span className="invoice-desc">{invoice.description}</span>
                    </div>
                    <div className="invoice-dates">
                      <span>{formatDate(invoice.date)}</span>
                      <span className="due-date">Due: {formatDate(invoice.dueDate)}</span>
                    </div>
                    <span className="invoice-amount">{formatCurrency(invoice.amount)}</span>
                    <span className={`invoice-status ${invoice.status}`}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </span>
                    <div className="invoice-actions">
                      <button 
                        className="icon-btn"
                        onClick={() => setSelectedInvoice(invoice)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button className="icon-btn" title="Download PDF">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'usage' && (
            <div className="usage-section">
              <div className="usage-header">
                <h3>Monthly Spending</h3>
                <span className="total-spent">
                  Total (6 months): {formatCurrency(usage.reduce((sum, u) => sum + u.amount, 0))}
                </span>
              </div>
              <div className="usage-chart">
                {usage.map((month, index) => (
                  <div key={index} className="usage-bar-wrapper">
                    <div className="usage-bar-container">
                      <div 
                        className="usage-bar"
                        style={{ height: `${(month.amount / maxUsage) * 100}%` }}
                      >
                        <span className="usage-value">{formatCurrency(month.amount)}</span>
                      </div>
                    </div>
                    <span className="usage-label">{month.month}</span>
                  </div>
                ))}
              </div>
              <div className="usage-summary">
                <div className="summary-item">
                  <span className="summary-label">Average Monthly</span>
                  <span className="summary-value">
                    {formatCurrency(usage.reduce((sum, u) => sum + u.amount, 0) / usage.length)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Highest Month</span>
                  <span className="summary-value">{formatCurrency(maxUsage)}</span>
                </div>
                <div className="summary-item trend-up">
                  <span className="summary-label">Trend</span>
                  <span className="summary-value">
                    <ArrowUpRight size={14} />
                    +12.5%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Payment Methods & Plan */}
        <div className="side-column">
          {/* Current Plan */}
          <div className="plan-card">
            <div className="plan-header">
              <h3>Current Plan</h3>
              <span className="plan-badge">Business</span>
            </div>
            <div className="plan-price">
              <span className="price">{formatCurrency(399)}</span>
              <span className="period">/month</span>
            </div>
            <ul className="plan-features">
              <li><CheckCircle size={14} /> Unlimited automations</li>
              <li><CheckCircle size={14} /> 10,000 API requests/month</li>
              <li><CheckCircle size={14} /> 10 Team members</li>
              <li><CheckCircle size={14} /> Priority support</li>
            </ul>
            <button className="btn-upgrade">
              <TrendingUp size={16} />
              Upgrade Plan
            </button>
          </div>

          {/* Payment Methods */}
          <div className="payment-methods-card">
            <div className="card-header">
              <h3>Payment Methods</h3>
              <button className="btn-link">
                <Plus size={14} />
                Add New
              </button>
            </div>
            <div className="payment-methods-list">
              {paymentMethods.map((method) => (
                <div key={method.id} className={`payment-method ${method.isDefault ? 'default' : ''}`}>
                  <div className="method-icon">
                    {method.type === 'card' && <CreditCard size={20} />}
                    {method.type === 'bank' && <Building size={20} />}
                    {method.type === 'paypal' && <Wallet size={20} />}
                  </div>
                  <div className="method-info">
                    <span className="method-name">
                      {method.brand || 'Bank Account'} •••• {method.last4}
                    </span>
                    {method.expiry && (
                      <span className="method-expiry">Expires {method.expiry}</span>
                    )}
                  </div>
                  {method.isDefault && (
                    <span className="default-badge">Default</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Billing Info */}
          <div className="billing-info-card">
            <div className="card-header">
              <h3>Billing Information</h3>
              <button className="btn-link">Edit</button>
            </div>
            <div className="billing-info">
              <div className="info-row">
                <span className="info-label">Company</span>
                <span className="info-value">TechCorp Inc.</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value">billing@techcorp.com</span>
              </div>
              <div className="info-row">
                <span className="info-label">Address</span>
                <span className="info-value">123 Business Ave, Suite 500<br />San Francisco, CA 94107</span>
              </div>
              <div className="info-row">
                <span className="info-label">Tax ID</span>
                <span className="info-value">US-12-3456789</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedInvoice.number}</h2>
                <span className={`status-badge ${selectedInvoice.status}`}>
                  {getStatusIcon(selectedInvoice.status)}
                  {selectedInvoice.status}
                </span>
              </div>
              <div className="modal-actions">
                <button className="icon-btn" title="Print">
                  <Printer size={18} />
                </button>
                <button className="icon-btn" title="Download">
                  <Download size={18} />
                </button>
                <button className="icon-btn close" onClick={() => setSelectedInvoice(null)}>
                  <XCircle size={18} />
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div className="invoice-meta">
                <div className="meta-item">
                  <span className="meta-label">Invoice Date</span>
                  <span className="meta-value">{formatDate(selectedInvoice.date)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Due Date</span>
                  <span className="meta-value">{formatDate(selectedInvoice.dueDate)}</span>
                </div>
              </div>
              <div className="invoice-items">
                <div className="items-header">
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Unit Price</span>
                  <span>Total</span>
                </div>
                {selectedInvoice.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <span>{item.name}</span>
                    <span>{item.quantity}</span>
                    <span>{formatCurrency(item.unitPrice)}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="invoice-total">
                <div className="total-row subtotal">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div className="total-row tax">
                  <span>Tax (0%)</span>
                  <span>{formatCurrency(0)}</span>
                </div>
                <div className="total-row grand-total">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.amount)}</span>
                </div>
              </div>
            </div>
            {selectedInvoice.status === 'pending' && (
              <div className="modal-footer">
                <button className="btn-primary full-width">
                  <CreditCard size={18} />
                  Pay Now - {formatCurrency(selectedInvoice.amount)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
