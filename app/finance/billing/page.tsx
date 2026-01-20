'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Grid3X3,
  List,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  Target,
  Zap,
  Activity,
  Users,
  Settings,
  ChevronRight,
  ChevronDown,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Send,
  Ban,
  Repeat,
  Building2,
  Mail,
  Phone,
  Globe,
  CreditCardIcon,
  Banknote,
  PiggyBank,
  CircleDollarSign
} from 'lucide-react';
import './billing.css';

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'active' | 'inactive' | 'suspended';
  subscriptionPlan: string;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  nextBillingDate: string;
  balance: number;
  totalSpent: number;
  paymentMethod: string;
  lastPayment: string;
}

interface Transaction {
  id: string;
  transactionId: string;
  customer: string;
  type: 'payment' | 'refund' | 'charge' | 'credit';
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  method: string;
  date: string;
  description: string;
}

interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  plan: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  amount: number;
  interval: string;
  startDate: string;
  nextBilling: string;
  cancelAt: string | null;
}

interface BillingMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  avgRevenuePerUser: number;
  pendingPayments: number;
  overdueAmount: number;
}

export default function BillingPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  const metrics: BillingMetrics = {
    mrr: 125840,
    arr: 1510080,
    totalRevenue: 2847650,
    activeSubscriptions: 1284,
    churnRate: 2.3,
    avgRevenuePerUser: 98,
    pendingPayments: 45,
    overdueAmount: 12450
  };

  const customers: Customer[] = [
    {
      id: '1',
      name: 'John Anderson',
      email: 'j.anderson@techcorp.com',
      company: 'TechCorp Industries',
      status: 'active',
      subscriptionPlan: 'Enterprise',
      billingCycle: 'annual',
      nextBillingDate: '2024-12-15',
      balance: 0,
      totalSpent: 45600,
      paymentMethod: 'Credit Card ****4242',
      lastPayment: '2024-02-15'
    },
    {
      id: '2',
      name: 'Sarah Miller',
      email: 's.miller@innovate.io',
      company: 'Innovate Solutions',
      status: 'active',
      subscriptionPlan: 'Professional',
      billingCycle: 'monthly',
      nextBillingDate: '2024-03-01',
      balance: 0,
      totalSpent: 12800,
      paymentMethod: 'Credit Card ****1234',
      lastPayment: '2024-02-01'
    },
    {
      id: '3',
      name: 'Michael Chen',
      email: 'm.chen@globaltech.com',
      company: 'GlobalTech Ltd',
      status: 'suspended',
      subscriptionPlan: 'Enterprise',
      billingCycle: 'quarterly',
      nextBillingDate: '2024-02-28',
      balance: 2450,
      totalSpent: 89200,
      paymentMethod: 'Bank Transfer',
      lastPayment: '2023-11-28'
    },
    {
      id: '4',
      name: 'Emily Watson',
      email: 'e.watson@startup.co',
      company: 'Startup Co',
      status: 'active',
      subscriptionPlan: 'Starter',
      billingCycle: 'monthly',
      nextBillingDate: '2024-03-05',
      balance: 0,
      totalSpent: 2400,
      paymentMethod: 'Credit Card ****5678',
      lastPayment: '2024-02-05'
    },
    {
      id: '5',
      name: 'David Park',
      email: 'd.park@enterprise.net',
      company: 'Enterprise Network',
      status: 'inactive',
      subscriptionPlan: 'Professional',
      billingCycle: 'annual',
      nextBillingDate: 'N/A',
      balance: 0,
      totalSpent: 18900,
      paymentMethod: 'Credit Card ****9012',
      lastPayment: '2023-08-20'
    }
  ];

  const transactions: Transaction[] = [
    { id: '1', transactionId: 'TXN-2024-8901', customer: 'TechCorp Industries', type: 'payment', amount: 4800, status: 'completed', method: 'Credit Card', date: '2024-02-20', description: 'Enterprise Plan - Annual' },
    { id: '2', transactionId: 'TXN-2024-8902', customer: 'Innovate Solutions', type: 'payment', amount: 299, status: 'completed', method: 'Credit Card', date: '2024-02-20', description: 'Professional Plan - Monthly' },
    { id: '3', transactionId: 'TXN-2024-8903', customer: 'GlobalTech Ltd', type: 'charge', amount: 2450, status: 'pending', method: 'Bank Transfer', date: '2024-02-19', description: 'Enterprise Plan - Quarterly' },
    { id: '4', transactionId: 'TXN-2024-8904', customer: 'Startup Co', type: 'refund', amount: 49, status: 'refunded', method: 'Credit Card', date: '2024-02-18', description: 'Pro-rated refund' },
    { id: '5', transactionId: 'TXN-2024-8905', customer: 'Enterprise Network', type: 'payment', amount: 1200, status: 'failed', method: 'Credit Card', date: '2024-02-17', description: 'Professional Plan - Annual' }
  ];

  const subscriptions: Subscription[] = [
    { id: '1', customerId: '1', customerName: 'TechCorp Industries', plan: 'Enterprise', status: 'active', amount: 4800, interval: 'year', startDate: '2023-12-15', nextBilling: '2024-12-15', cancelAt: null },
    { id: '2', customerId: '2', customerName: 'Innovate Solutions', plan: 'Professional', status: 'active', amount: 299, interval: 'month', startDate: '2023-06-01', nextBilling: '2024-03-01', cancelAt: null },
    { id: '3', customerId: '3', customerName: 'GlobalTech Ltd', plan: 'Enterprise', status: 'past_due', amount: 2450, interval: 'quarter', startDate: '2023-02-28', nextBilling: '2024-02-28', cancelAt: null },
    { id: '4', customerId: '4', customerName: 'Startup Co', plan: 'Starter', status: 'trialing', amount: 49, interval: 'month', startDate: '2024-02-05', nextBilling: '2024-03-05', cancelAt: null },
    { id: '5', customerId: '5', customerName: 'Enterprise Network', plan: 'Professional', status: 'cancelled', amount: 1899, interval: 'year', startDate: '2022-08-20', nextBilling: 'N/A', cancelAt: '2023-08-20' }
  ];

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'active': 'status-active',
      'inactive': 'status-inactive',
      'suspended': 'status-suspended',
      'completed': 'status-completed',
      'pending': 'status-pending',
      'failed': 'status-failed',
      'refunded': 'status-refunded',
      'cancelled': 'status-cancelled',
      'past_due': 'status-past-due',
      'trialing': 'status-trialing'
    };
    return colors[status] || '';
  };

  const getTypeIcon = (type: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'payment': <ArrowDownRight size={16} />,
      'refund': <ArrowUpRight size={16} />,
      'charge': <CreditCard size={16} />,
      'credit': <PiggyBank size={16} />
    };
    return icons[type] || <DollarSign size={16} />;
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="billing-container">
      <div className="billing-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <CreditCard size={28} />
            </div>
            <div>
              <h1>Billing & Payments</h1>
              <p>Subscriptions, transactions, and revenue management</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-secondary">
              <Download size={18} />
              Export
            </button>
            <button className="btn-secondary">
              <Receipt size={18} />
              Invoices
            </button>
            <button className="btn-primary">
              <Plus size={18} />
              New Charge
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card highlight">
            <div className="stat-icon mrr">
              <CircleDollarSign size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Monthly Recurring Revenue</span>
              <div className="stat-row">
                <span className="stat-value">${metrics.mrr.toLocaleString()}</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  8.5%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon arr">
              <Banknote size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Annual Recurring Revenue</span>
              <div className="stat-row">
                <span className="stat-value">${(metrics.arr / 1000000).toFixed(2)}M</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  12.3%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Wallet size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Revenue</span>
              <div className="stat-row">
                <span className="stat-value">${(metrics.totalRevenue / 1000000).toFixed(2)}M</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon subs">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Active Subscriptions</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.activeSubscriptions.toLocaleString()}</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  45
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon churn">
              <TrendingDown size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Churn Rate</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.churnRate}%</span>
                <span className="stat-change down-good">
                  <TrendingDown size={14} />
                  0.5%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Target size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">ARPU</span>
              <div className="stat-row">
                <span className="stat-value">${metrics.avgRevenuePerUser}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon pending">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Pending Payments</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.pendingPayments}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card alert">
            <div className="stat-icon danger">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Overdue Amount</span>
              <div className="stat-row">
                <span className="stat-value">${metrics.overdueAmount.toLocaleString()}</span>
                <span className="stat-badge danger">Action needed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs */}
      <div className="main-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={18} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          <Users size={18} />
          Customers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <Receipt size={18} />
          Transactions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <Repeat size={18} />
          Subscriptions
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-content">
          <div className="overview-grid">
            <div className="overview-card large">
              <h3>Revenue Trend</h3>
              <div className="revenue-chart">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
                  const values = [85, 92, 88, 105, 115, 126];
                  return (
                    <div key={month} className="chart-bar">
                      <div 
                        className="bar-fill"
                        style={{ height: `${(values[index] / 130) * 100}%` }}
                      >
                        <span className="bar-tooltip">${values[index]}K</span>
                      </div>
                      <span className="bar-label">{month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="overview-card">
              <h3>Subscription Distribution</h3>
              <div className="plan-distribution">
                <div className="plan-item">
                  <div className="plan-info">
                    <span className="plan-color enterprise"></span>
                    <span className="plan-name">Enterprise</span>
                  </div>
                  <div className="plan-stats">
                    <span className="plan-count">342</span>
                    <span className="plan-percent">27%</span>
                  </div>
                </div>
                <div className="plan-item">
                  <div className="plan-info">
                    <span className="plan-color professional"></span>
                    <span className="plan-name">Professional</span>
                  </div>
                  <div className="plan-stats">
                    <span className="plan-count">567</span>
                    <span className="plan-percent">44%</span>
                  </div>
                </div>
                <div className="plan-item">
                  <div className="plan-info">
                    <span className="plan-color starter"></span>
                    <span className="plan-name">Starter</span>
                  </div>
                  <div className="plan-stats">
                    <span className="plan-count">375</span>
                    <span className="plan-percent">29%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overview-card">
              <h3>Recent Activity</h3>
              <div className="recent-activity">
                {transactions.slice(0, 4).map((txn) => (
                  <div key={txn.id} className={`activity-item ${txn.type}`}>
                    <div className="activity-icon">
                      {getTypeIcon(txn.type)}
                    </div>
                    <div className="activity-info">
                      <span className="activity-customer">{txn.customer}</span>
                      <span className="activity-desc">{txn.description}</span>
                    </div>
                    <div className="activity-amount">
                      <span className={txn.type === 'refund' ? 'negative' : ''}>
                        {txn.type === 'refund' ? '-' : '+'}${txn.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="customers-content">
          <div className="filters-bar">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 size={18} />
              </button>
            </div>
          </div>

          <div className="customers-list">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className={`customer-item ${customer.status}`}>
                <div 
                  className="customer-main"
                  onClick={() => setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)}
                >
                  <div className="customer-avatar">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  <div className="customer-info">
                    <div className="customer-header">
                      <h3>{customer.name}</h3>
                      <span className={`status-badge ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </div>
                    <div className="customer-meta">
                      <span className="company">
                        <Building2 size={14} />
                        {customer.company}
                      </span>
                      <span className="email">
                        <Mail size={14} />
                        {customer.email}
                      </span>
                    </div>
                  </div>
                  
                  <div className="customer-plan">
                    <span className="plan-badge">{customer.subscriptionPlan}</span>
                    <span className="billing-cycle">{customer.billingCycle}</span>
                  </div>
                  
                  <div className="customer-billing">
                    <div className="billing-item">
                      <span className="billing-label">Total Spent</span>
                      <span className="billing-value">${customer.totalSpent.toLocaleString()}</span>
                    </div>
                    {customer.balance > 0 && (
                      <div className="billing-item balance">
                        <span className="billing-label">Balance Due</span>
                        <span className="billing-value danger">${customer.balance.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="customer-actions">
                    <button className="action-btn"><Eye size={16} /></button>
                    <button className="action-btn"><Edit size={16} /></button>
                    <button className="action-btn">
                      {expandedCustomer === customer.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
                
                {expandedCustomer === customer.id && (
                  <div className="customer-expanded">
                    <div className="expanded-grid">
                      <div className="expanded-section">
                        <h4>Payment Method</h4>
                        <div className="payment-info">
                          <CreditCard size={16} />
                          <span>{customer.paymentMethod}</span>
                        </div>
                      </div>
                      <div className="expanded-section">
                        <h4>Billing Details</h4>
                        <div className="billing-details">
                          <div className="detail-row">
                            <span>Next Billing:</span>
                            <span>{customer.nextBillingDate}</span>
                          </div>
                          <div className="detail-row">
                            <span>Last Payment:</span>
                            <span>{customer.lastPayment}</span>
                          </div>
                        </div>
                      </div>
                      <div className="expanded-section">
                        <h4>Quick Actions</h4>
                        <div className="quick-actions">
                          <button className="quick-btn">
                            <Receipt size={14} />
                            Invoice
                          </button>
                          <button className="quick-btn">
                            <Send size={14} />
                            Reminder
                          </button>
                          <button className="quick-btn danger">
                            <Ban size={14} />
                            Suspend
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="transactions-content">
          <div className="transactions-header">
            <h2>Transaction History</h2>
            <div className="transactions-filters">
              <select>
                <option>All Types</option>
                <option>Payments</option>
                <option>Refunds</option>
                <option>Charges</option>
              </select>
              <select>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>This Year</option>
              </select>
            </div>
          </div>
          <div className="transactions-list">
            {transactions.map((txn) => (
              <div key={txn.id} className={`transaction-item ${txn.status}`}>
                <div className={`txn-type type-${txn.type}`}>
                  {getTypeIcon(txn.type)}
                </div>
                <div className="txn-info">
                  <div className="txn-header">
                    <span className="txn-id">{txn.transactionId}</span>
                    <span className={`status-badge ${getStatusColor(txn.status)}`}>
                      {txn.status}
                    </span>
                  </div>
                  <h3>{txn.customer}</h3>
                  <div className="txn-meta">
                    <span className="txn-desc">{txn.description}</span>
                    <span className="txn-method">{txn.method}</span>
                    <span className="txn-date">
                      <Calendar size={14} />
                      {txn.date}
                    </span>
                  </div>
                </div>
                <div className={`txn-amount ${txn.type === 'refund' ? 'negative' : ''}`}>
                  <span>{txn.type === 'refund' ? '-' : ''}${txn.amount.toLocaleString()}</span>
                </div>
                <div className="txn-actions">
                  <button className="action-btn"><Eye size={16} /></button>
                  <button className="action-btn"><Receipt size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="subscriptions-content">
          <div className="subscriptions-header">
            <h2>Subscription Management</h2>
            <button className="btn-primary">
              <Plus size={18} />
              New Subscription
            </button>
          </div>
          <div className="subscriptions-list">
            {subscriptions.map((sub) => (
              <div key={sub.id} className={`subscription-item ${sub.status}`}>
                <div className="sub-status">
                  <span className={`status-indicator ${sub.status}`}></span>
                </div>
                <div className="sub-info">
                  <div className="sub-header">
                    <h3>{sub.customerName}</h3>
                    <span className={`status-badge ${getStatusColor(sub.status)}`}>
                      {sub.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="sub-meta">
                    <span className="sub-plan">{sub.plan}</span>
                    <span className="sub-interval">${sub.amount}/{sub.interval}</span>
                    <span className="sub-start">
                      <Calendar size={14} />
                      Started: {sub.startDate}
                    </span>
                  </div>
                </div>
                <div className="sub-billing">
                  <div className="billing-info">
                    <span className="billing-label">Next Billing</span>
                    <span className={`billing-value ${sub.status === 'past_due' ? 'overdue' : ''}`}>
                      {sub.nextBilling}
                    </span>
                  </div>
                  <div className="billing-amount">
                    <span className="amount-value">${sub.amount}</span>
                    <span className="amount-interval">/{sub.interval}</span>
                  </div>
                </div>
                <div className="sub-actions">
                  <button className="action-btn"><Eye size={16} /></button>
                  <button className="action-btn"><Edit size={16} /></button>
                  {sub.status === 'active' && (
                    <button className="action-btn danger"><Ban size={16} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
