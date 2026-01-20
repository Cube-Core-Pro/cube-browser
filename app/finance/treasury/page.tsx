'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, ArrowLeft, RefreshCw, Settings, Download, Filter,
  TrendingUp, TrendingDown, DollarSign, CreditCard, Building2,
  ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, CheckCircle,
  Clock, Calendar, PieChart, BarChart3, LineChart, ArrowLeftRight,
  Plus, MoreVertical, Eye, EyeOff, Send, Receipt, FileText,
  Banknote, Percent, Target, Shield, Globe, Zap, Lock,
  CircleDollarSign, Landmark, Briefcase, Calculator, ChevronRight
} from 'lucide-react';
import './treasury.css';

interface BankAccount {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  currency: string;
  balance: number;
  availableBalance: number;
  type: 'checking' | 'savings' | 'investment' | 'credit';
  status: 'active' | 'frozen' | 'closed';
  lastSync: string;
  monthlyChange: number;
}

interface Transaction {
  id: string;
  accountId: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  category: string;
  counterparty: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
}

interface CashForecast {
  date: string;
  projected: number;
  actual: number | null;
  inflows: number;
  outflows: number;
}

interface Investment {
  id: string;
  name: string;
  type: 'bonds' | 'money-market' | 'commercial-paper' | 'treasury-bills' | 'certificates';
  principal: number;
  currentValue: number;
  yield: number;
  maturityDate: string;
  risk: 'low' | 'medium' | 'high';
  status: 'active' | 'maturing' | 'matured';
}

interface FXPosition {
  currency: string;
  balance: number;
  valueUSD: number;
  exchangeRate: number;
  change24h: number;
}

interface TreasuryMetrics {
  totalCash: number;
  totalInvestments: number;
  netPosition: number;
  dailyChange: number;
  monthlyChange: number;
  fxExposure: number;
  liquidityRatio: number;
  pendingPayables: number;
  pendingReceivables: number;
}

const sampleAccounts: BankAccount[] = [
  {
    id: 'acc-1',
    name: 'Operating Account',
    bank: 'JP Morgan Chase',
    accountNumber: '****4521',
    currency: 'USD',
    balance: 4582340.50,
    availableBalance: 4532340.50,
    type: 'checking',
    status: 'active',
    lastSync: '2024-01-15T10:30:00Z',
    monthlyChange: 12.5
  },
  {
    id: 'acc-2',
    name: 'Payroll Account',
    bank: 'Bank of America',
    accountNumber: '****7832',
    currency: 'USD',
    balance: 1250000.00,
    availableBalance: 1250000.00,
    type: 'checking',
    status: 'active',
    lastSync: '2024-01-15T10:28:00Z',
    monthlyChange: -8.2
  },
  {
    id: 'acc-3',
    name: 'Reserve Fund',
    bank: 'Wells Fargo',
    accountNumber: '****9156',
    currency: 'USD',
    balance: 8750000.00,
    availableBalance: 8750000.00,
    type: 'savings',
    status: 'active',
    lastSync: '2024-01-15T10:25:00Z',
    monthlyChange: 0.8
  },
  {
    id: 'acc-4',
    name: 'EUR Operations',
    bank: 'Deutsche Bank',
    accountNumber: '****3478',
    currency: 'EUR',
    balance: 2150000.00,
    availableBalance: 2100000.00,
    type: 'checking',
    status: 'active',
    lastSync: '2024-01-15T09:45:00Z',
    monthlyChange: 5.3
  },
  {
    id: 'acc-5',
    name: 'GBP Treasury',
    bank: 'Barclays',
    accountNumber: '****6291',
    currency: 'GBP',
    balance: 1850000.00,
    availableBalance: 1850000.00,
    type: 'checking',
    status: 'active',
    lastSync: '2024-01-15T09:30:00Z',
    monthlyChange: -2.1
  },
  {
    id: 'acc-6',
    name: 'Credit Line',
    bank: 'Citibank',
    accountNumber: '****8824',
    currency: 'USD',
    balance: -500000.00,
    availableBalance: 4500000.00,
    type: 'credit',
    status: 'active',
    lastSync: '2024-01-15T10:30:00Z',
    monthlyChange: 0
  }
];

const sampleTransactions: Transaction[] = [
  { id: 'tx-1', accountId: 'acc-1', type: 'credit', amount: 125000, currency: 'USD', description: 'Customer Payment - Invoice #INV-2024-0142', category: 'Revenue', counterparty: 'Acme Corporation', date: '2024-01-15T09:45:00Z', status: 'completed', reference: 'PAY-20240115-001' },
  { id: 'tx-2', accountId: 'acc-1', type: 'debit', amount: 45000, currency: 'USD', description: 'Vendor Payment - AWS Services', category: 'Infrastructure', counterparty: 'Amazon Web Services', date: '2024-01-15T08:30:00Z', status: 'completed', reference: 'PAY-20240115-002' },
  { id: 'tx-3', accountId: 'acc-2', type: 'debit', amount: 385000, currency: 'USD', description: 'Payroll - January 2024 W2', category: 'Payroll', counterparty: 'ADP Payroll', date: '2024-01-15T06:00:00Z', status: 'completed', reference: 'PR-20240115-001' },
  { id: 'tx-4', accountId: 'acc-1', type: 'credit', amount: 87500, currency: 'USD', description: 'Customer Payment - Invoice #INV-2024-0138', category: 'Revenue', counterparty: 'TechStart Inc', date: '2024-01-14T16:20:00Z', status: 'completed', reference: 'PAY-20240114-005' },
  { id: 'tx-5', accountId: 'acc-1', type: 'debit', amount: 28500, currency: 'USD', description: 'Software License Renewal', category: 'Software', counterparty: 'Salesforce', date: '2024-01-14T14:00:00Z', status: 'completed', reference: 'PAY-20240114-004' },
  { id: 'tx-6', accountId: 'acc-4', type: 'credit', amount: 95000, currency: 'EUR', description: 'Customer Payment - EU Region', category: 'Revenue', counterparty: 'EuroTech GmbH', date: '2024-01-14T11:30:00Z', status: 'completed', reference: 'PAY-20240114-003' },
  { id: 'tx-7', accountId: 'acc-1', type: 'transfer', amount: 250000, currency: 'USD', description: 'Internal Transfer to Reserve', category: 'Transfer', counterparty: 'Reserve Fund', date: '2024-01-13T15:00:00Z', status: 'completed', reference: 'TRF-20240113-001' },
  { id: 'tx-8', accountId: 'acc-1', type: 'debit', amount: 15200, currency: 'USD', description: 'Office Rent - Q1 2024', category: 'Operations', counterparty: 'Building Management LLC', date: '2024-01-12T10:00:00Z', status: 'pending', reference: 'PAY-20240112-001' }
];

const sampleForecasts: CashForecast[] = [
  { date: '2024-01-08', projected: 14200000, actual: 14350000, inflows: 450000, outflows: 320000 },
  { date: '2024-01-09', projected: 14330000, actual: 14280000, inflows: 380000, outflows: 450000 },
  { date: '2024-01-10', projected: 14210000, actual: 14425000, inflows: 520000, outflows: 375000 },
  { date: '2024-01-11', projected: 14355000, actual: 14510000, inflows: 410000, outflows: 325000 },
  { date: '2024-01-12', projected: 14440000, actual: 14650000, inflows: 490000, outflows: 350000 },
  { date: '2024-01-13', projected: 14580000, actual: 14720000, inflows: 380000, outflows: 310000 },
  { date: '2024-01-14', projected: 14650000, actual: 14580000, inflows: 340000, outflows: 480000 },
  { date: '2024-01-15', projected: 14510000, actual: null, inflows: 420000, outflows: 380000 },
  { date: '2024-01-16', projected: 14550000, actual: null, inflows: 380000, outflows: 340000 },
  { date: '2024-01-17', projected: 14590000, actual: null, inflows: 450000, outflows: 410000 }
];

const sampleInvestments: Investment[] = [
  { id: 'inv-1', name: 'US Treasury Bills 3M', type: 'treasury-bills', principal: 2000000, currentValue: 2025000, yield: 5.25, maturityDate: '2024-04-15', risk: 'low', status: 'active' },
  { id: 'inv-2', name: 'Corporate Bonds AAA', type: 'bonds', principal: 1500000, currentValue: 1542000, yield: 4.8, maturityDate: '2025-06-30', risk: 'low', status: 'active' },
  { id: 'inv-3', name: 'Money Market Fund', type: 'money-market', principal: 3000000, currentValue: 3045000, yield: 4.5, maturityDate: '2024-01-31', risk: 'low', status: 'maturing' },
  { id: 'inv-4', name: 'Commercial Paper - Tech', type: 'commercial-paper', principal: 1000000, currentValue: 1015000, yield: 5.1, maturityDate: '2024-03-01', risk: 'medium', status: 'active' },
  { id: 'inv-5', name: 'Certificate of Deposit', type: 'certificates', principal: 500000, currentValue: 512500, yield: 4.2, maturityDate: '2024-07-15', risk: 'low', status: 'active' }
];

const sampleFXPositions: FXPosition[] = [
  { currency: 'USD', balance: 14082340.50, valueUSD: 14082340.50, exchangeRate: 1.0, change24h: 0 },
  { currency: 'EUR', balance: 2150000.00, valueUSD: 2343500.00, exchangeRate: 1.09, change24h: 0.35 },
  { currency: 'GBP', balance: 1850000.00, valueUSD: 2350750.00, exchangeRate: 1.27, change24h: -0.22 },
  { currency: 'JPY', balance: 125000000, valueUSD: 833333.33, exchangeRate: 0.0067, change24h: 0.18 },
  { currency: 'CHF', balance: 450000.00, valueUSD: 527850.00, exchangeRate: 1.173, change24h: 0.12 }
];

export default function TreasuryManagement(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'transactions' | 'investments' | 'forex'>('overview');
  const [accounts] = useState<BankAccount[]>(sampleAccounts);
  const [transactions] = useState<Transaction[]>(sampleTransactions);
  const [forecasts] = useState<CashForecast[]>(sampleForecasts);
  const [investments] = useState<Investment[]>(sampleInvestments);
  const [fxPositions] = useState<FXPosition[]>(sampleFXPositions);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [showBalances, setShowBalances] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const metrics: TreasuryMetrics = {
    totalCash: accounts.reduce((sum, acc) => sum + (acc.type !== 'credit' ? acc.balance : 0), 0),
    totalInvestments: investments.reduce((sum, inv) => sum + inv.currentValue, 0),
    netPosition: accounts.reduce((sum, acc) => sum + acc.balance, 0) + 
                 investments.reduce((sum, inv) => sum + inv.currentValue, 0),
    dailyChange: 125000 - 45000 - 15200,
    monthlyChange: 1250000,
    fxExposure: fxPositions.filter(p => p.currency !== 'USD').reduce((sum, p) => sum + p.valueUSD, 0),
    liquidityRatio: 2.8,
    pendingPayables: 485000,
    pendingReceivables: 892000
  };

  const handleRefresh = (): void => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const formatCurrency = (amount: number, currency: string = 'USD', showSign: boolean = false): string => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
    
    if (showSign && amount !== 0) {
      return amount > 0 ? `+${formatted}` : `-${formatted}`;
    }
    return amount < 0 ? `-${formatted}` : formatted;
  };

  const formatCompactCurrency = (amount: number): string => {
    if (Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const getMaxForecast = (): number => {
    return Math.max(...forecasts.map(f => Math.max(f.projected, f.actual || 0)));
  };

  const renderOverviewTab = (): React.ReactNode => (
    <div className="overview-tab">
      <div className="overview-grid">
        <div className="cash-position-card">
          <div className="card-header">
            <h3>Total Cash Position</h3>
            <button 
              className="btn-icon small" 
              onClick={() => setShowBalances(!showBalances)}
            >
              {showBalances ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          <div className="cash-amount">
            {showBalances ? formatCurrency(metrics.totalCash) : '••••••••'}
          </div>
          <div className="cash-change positive">
            <TrendingUp size={16} />
            {formatCurrency(metrics.monthlyChange, 'USD', true)} this month
          </div>
          <div className="cash-breakdown">
            <div className="breakdown-item">
              <span className="label">Operating Cash</span>
              <span className="value">{showBalances ? formatCompactCurrency(5832340.50) : '•••'}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">Reserves</span>
              <span className="value">{showBalances ? formatCompactCurrency(8750000) : '•••'}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">Foreign Currency</span>
              <span className="value">{showBalances ? formatCompactCurrency(metrics.fxExposure) : '•••'}</span>
            </div>
          </div>
        </div>

        <div className="investments-card">
          <div className="card-header">
            <h3>Investment Portfolio</h3>
            <span className="yield-badge">
              <Percent size={12} />
              4.77% avg yield
            </span>
          </div>
          <div className="investment-amount">
            {showBalances ? formatCurrency(metrics.totalInvestments) : '••••••••'}
          </div>
          <div className="investment-returns positive">
            <TrendingUp size={14} />
            {formatCurrency(139500, 'USD', true)} unrealized gains
          </div>
          <div className="investment-allocation">
            <div className="allocation-bar">
              <div className="segment treasury" style={{ width: '25%' }} title="Treasury Bills"></div>
              <div className="segment bonds" style={{ width: '19%' }} title="Corporate Bonds"></div>
              <div className="segment money-market" style={{ width: '38%' }} title="Money Market"></div>
              <div className="segment commercial" style={{ width: '12%' }} title="Commercial Paper"></div>
              <div className="segment certificates" style={{ width: '6%' }} title="Certificates"></div>
            </div>
            <div className="allocation-legend">
              <span><div className="dot treasury"></div>T-Bills</span>
              <span><div className="dot bonds"></div>Bonds</span>
              <span><div className="dot money-market"></div>MM Fund</span>
              <span><div className="dot commercial"></div>CP</span>
              <span><div className="dot certificates"></div>CDs</span>
            </div>
          </div>
        </div>

        <div className="liquidity-card">
          <div className="card-header">
            <h3>Liquidity Metrics</h3>
          </div>
          <div className="liquidity-ratio">
            <div className="ratio-value">{metrics.liquidityRatio.toFixed(1)}x</div>
            <div className="ratio-label">Current Ratio</div>
          </div>
          <div className="liquidity-items">
            <div className="liquidity-item receivable">
              <ArrowDownRight size={16} />
              <div className="item-info">
                <span className="item-label">Pending Receivables</span>
                <span className="item-value">{formatCurrency(metrics.pendingReceivables)}</span>
              </div>
            </div>
            <div className="liquidity-item payable">
              <ArrowUpRight size={16} />
              <div className="item-info">
                <span className="item-label">Pending Payables</span>
                <span className="item-value">{formatCurrency(metrics.pendingPayables)}</span>
              </div>
            </div>
            <div className="liquidity-item net">
              <ArrowLeftRight size={16} />
              <div className="item-info">
                <span className="item-label">Net Position</span>
                <span className="item-value positive">
                  {formatCurrency(metrics.pendingReceivables - metrics.pendingPayables, 'USD', true)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="forecast-section">
        <div className="section-header">
          <h3>Cash Flow Forecast</h3>
          <div className="forecast-controls">
            <div className="date-range-selector">
              <button 
                className={dateRange === '7d' ? 'active' : ''}
                onClick={() => setDateRange('7d')}
              >7D</button>
              <button 
                className={dateRange === '30d' ? 'active' : ''}
                onClick={() => setDateRange('30d')}
              >30D</button>
              <button 
                className={dateRange === '90d' ? 'active' : ''}
                onClick={() => setDateRange('90d')}
              >90D</button>
            </div>
          </div>
        </div>
        <div className="forecast-chart">
          <div className="chart-y-axis">
            <span>{formatCompactCurrency(getMaxForecast())}</span>
            <span>{formatCompactCurrency(getMaxForecast() * 0.75)}</span>
            <span>{formatCompactCurrency(getMaxForecast() * 0.5)}</span>
            <span>{formatCompactCurrency(getMaxForecast() * 0.25)}</span>
            <span>$0</span>
          </div>
          <div className="chart-content">
            {forecasts.map((forecast, idx) => (
              <div key={forecast.date} className="forecast-bar-group">
                <div className="bars">
                  <div 
                    className="bar projected"
                    style={{ height: `${(forecast.projected / getMaxForecast()) * 100}%` }}
                    title={`Projected: ${formatCurrency(forecast.projected)}`}
                  ></div>
                  {forecast.actual !== null && (
                    <div 
                      className={`bar actual ${forecast.actual >= forecast.projected ? 'positive' : 'negative'}`}
                      style={{ height: `${(forecast.actual / getMaxForecast()) * 100}%` }}
                      title={`Actual: ${formatCurrency(forecast.actual)}`}
                    ></div>
                  )}
                </div>
                <span className="bar-label">
                  {new Date(forecast.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-legend">
          <span><div className="legend-bar projected"></div>Projected</span>
          <span><div className="legend-bar actual"></div>Actual</span>
        </div>
      </div>

      <div className="recent-activity">
        <div className="section-header">
          <h3>Recent Activity</h3>
          <button className="btn-outline small" onClick={() => setActiveTab('transactions')}>
            View All
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="activity-list">
          {transactions.slice(0, 5).map(tx => (
            <div key={tx.id} className={`activity-item ${tx.type}`}>
              <div className={`activity-icon ${tx.type}`}>
                {tx.type === 'credit' && <ArrowDownRight size={16} />}
                {tx.type === 'debit' && <ArrowUpRight size={16} />}
                {tx.type === 'transfer' && <ArrowLeftRight size={16} />}
              </div>
              <div className="activity-details">
                <span className="activity-description">{tx.description}</span>
                <span className="activity-meta">
                  {tx.counterparty} · {new Date(tx.date).toLocaleDateString()}
                </span>
              </div>
              <div className={`activity-amount ${tx.type}`}>
                {tx.type === 'credit' ? '+' : tx.type === 'debit' ? '-' : ''}
                {formatCurrency(tx.amount, tx.currency)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAccountsTab = (): React.ReactNode => (
    <div className="accounts-tab">
      <div className="accounts-header">
        <h3>Bank Accounts</h3>
        <div className="accounts-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Sync All
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Add Account
          </button>
        </div>
      </div>

      <div className="accounts-grid">
        {accounts.map(account => (
          <div 
            key={account.id} 
            className={`account-card ${account.type} ${selectedAccount?.id === account.id ? 'selected' : ''}`}
            onClick={() => setSelectedAccount(account)}
          >
            <div className="account-header">
              <div className={`account-icon ${account.type}`}>
                {account.type === 'checking' && <Wallet size={20} />}
                {account.type === 'savings' && <Landmark size={20} />}
                {account.type === 'investment' && <Briefcase size={20} />}
                {account.type === 'credit' && <CreditCard size={20} />}
              </div>
              <div className="account-info">
                <span className="account-name">{account.name}</span>
                <span className="account-bank">{account.bank} · {account.accountNumber}</span>
              </div>
              <div className={`account-status ${account.status}`}>
                <CheckCircle size={14} />
              </div>
            </div>

            <div className="account-balance">
              <span className="balance-label">Current Balance</span>
              <span className={`balance-amount ${account.balance < 0 ? 'negative' : ''}`}>
                {showBalances ? formatCurrency(account.balance, account.currency) : '••••••••'}
              </span>
              <span className={`balance-change ${account.monthlyChange >= 0 ? 'positive' : 'negative'}`}>
                {account.monthlyChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {account.monthlyChange >= 0 ? '+' : ''}{account.monthlyChange}% this month
              </span>
            </div>

            <div className="account-meta">
              <div className="meta-item">
                <span className="meta-label">Available</span>
                <span className="meta-value">
                  {showBalances ? formatCurrency(account.availableBalance, account.currency) : '•••'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Last Sync</span>
                <span className="meta-value">
                  {new Date(account.lastSync).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="account-actions">
              <button className="btn-outline small">
                <Send size={14} />
                Transfer
              </button>
              <button className="btn-outline small">
                <Receipt size={14} />
                Statements
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTransactionsTab = (): React.ReactNode => (
    <div className="transactions-tab">
      <div className="transactions-header">
        <h3>Transaction History</h3>
        <div className="transactions-filters">
          <select className="filter-select">
            <option value="all">All Accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
          <select className="filter-select">
            <option value="all">All Types</option>
            <option value="credit">Credits</option>
            <option value="debit">Debits</option>
            <option value="transfer">Transfers</option>
          </select>
          <input type="date" className="date-input" />
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="transactions-table">
        <div className="table-header">
          <span>Date</span>
          <span>Description</span>
          <span>Category</span>
          <span>Counterparty</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Reference</span>
        </div>
        {transactions.map(tx => {
          const account = accounts.find(a => a.id === tx.accountId);
          return (
            <div key={tx.id} className={`table-row ${tx.type}`}>
              <div className="date-cell">
                <Calendar size={14} />
                <div className="date-info">
                  <span className="date">{new Date(tx.date).toLocaleDateString()}</span>
                  <span className="time">{new Date(tx.date).toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="description-cell">
                <div className={`tx-icon ${tx.type}`}>
                  {tx.type === 'credit' && <ArrowDownRight size={14} />}
                  {tx.type === 'debit' && <ArrowUpRight size={14} />}
                  {tx.type === 'transfer' && <ArrowLeftRight size={14} />}
                </div>
                <div className="tx-info">
                  <span className="tx-desc">{tx.description}</span>
                  <span className="tx-account">{account?.name}</span>
                </div>
              </div>
              <span className="category-cell">
                <span className="category-badge">{tx.category}</span>
              </span>
              <span className="counterparty-cell">{tx.counterparty}</span>
              <span className={`amount-cell ${tx.type}`}>
                {tx.type === 'credit' ? '+' : tx.type === 'debit' ? '-' : ''}
                {formatCurrency(tx.amount, tx.currency)}
              </span>
              <span className={`status-cell ${tx.status}`}>
                {tx.status === 'completed' && <CheckCircle size={14} />}
                {tx.status === 'pending' && <Clock size={14} />}
                {tx.status === 'failed' && <AlertTriangle size={14} />}
                {tx.status}
              </span>
              <span className="reference-cell code">{tx.reference}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderInvestmentsTab = (): React.ReactNode => (
    <div className="investments-tab">
      <div className="investments-header">
        <h3>Investment Portfolio</h3>
        <div className="portfolio-summary">
          <div className="summary-item">
            <span className="label">Total Principal</span>
            <span className="value">{formatCurrency(investments.reduce((s, i) => s + i.principal, 0))}</span>
          </div>
          <div className="summary-item">
            <span className="label">Current Value</span>
            <span className="value">{formatCurrency(metrics.totalInvestments)}</span>
          </div>
          <div className="summary-item positive">
            <span className="label">Total Returns</span>
            <span className="value">+{formatCurrency(139500)}</span>
          </div>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          New Investment
        </button>
      </div>

      <div className="investments-grid">
        {investments.map(investment => (
          <div key={investment.id} className={`investment-card ${investment.status}`}>
            <div className="investment-header">
              <div className={`investment-icon ${investment.type}`}>
                {investment.type === 'treasury-bills' && <Landmark size={18} />}
                {investment.type === 'bonds' && <FileText size={18} />}
                {investment.type === 'money-market' && <CircleDollarSign size={18} />}
                {investment.type === 'commercial-paper' && <Briefcase size={18} />}
                {investment.type === 'certificates' && <Shield size={18} />}
              </div>
              <div className="investment-title">
                <h4>{investment.name}</h4>
                <span className="investment-type">{investment.type.replace('-', ' ')}</span>
              </div>
              <div className={`risk-badge ${investment.risk}`}>
                {investment.risk} risk
              </div>
            </div>

            <div className="investment-values">
              <div className="value-item">
                <span className="label">Principal</span>
                <span className="value">{formatCurrency(investment.principal)}</span>
              </div>
              <div className="value-item">
                <span className="label">Current Value</span>
                <span className="value">{formatCurrency(investment.currentValue)}</span>
              </div>
              <div className="value-item">
                <span className="label">Return</span>
                <span className="value positive">
                  +{formatCurrency(investment.currentValue - investment.principal)}
                </span>
              </div>
            </div>

            <div className="investment-details">
              <div className="detail-item">
                <Percent size={14} />
                <span>{investment.yield}% yield</span>
              </div>
              <div className="detail-item">
                <Calendar size={14} />
                <span>Matures {new Date(investment.maturityDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className={`investment-status ${investment.status}`}>
              {investment.status === 'active' && <><CheckCircle size={14} /> Active</>}
              {investment.status === 'maturing' && <><Clock size={14} /> Maturing Soon</>}
              {investment.status === 'matured' && <><AlertTriangle size={14} /> Matured</>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderForexTab = (): React.ReactNode => (
    <div className="forex-tab">
      <div className="forex-header">
        <h3>Foreign Exchange Positions</h3>
        <div className="forex-summary">
          <div className="summary-item">
            <span className="label">Total FX Exposure</span>
            <span className="value">{formatCurrency(metrics.fxExposure)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Currencies</span>
            <span className="value">{fxPositions.length}</span>
          </div>
        </div>
        <button className="btn-primary">
          <ArrowLeftRight size={16} />
          Convert Currency
        </button>
      </div>

      <div className="forex-table">
        <div className="table-header">
          <span>Currency</span>
          <span>Balance</span>
          <span>USD Value</span>
          <span>Exchange Rate</span>
          <span>24h Change</span>
          <span>Actions</span>
        </div>
        {fxPositions.map(position => (
          <div key={position.currency} className="table-row">
            <div className="currency-cell">
              <div className="currency-icon">
                <Globe size={18} />
              </div>
              <div className="currency-info">
                <span className="currency-code">{position.currency}</span>
                <span className="currency-name">
                  {position.currency === 'USD' && 'US Dollar'}
                  {position.currency === 'EUR' && 'Euro'}
                  {position.currency === 'GBP' && 'British Pound'}
                  {position.currency === 'JPY' && 'Japanese Yen'}
                  {position.currency === 'CHF' && 'Swiss Franc'}
                </span>
              </div>
            </div>
            <span className="balance-cell">
              {showBalances ? new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: position.currency,
                minimumFractionDigits: 2
              }).format(position.balance) : '••••••••'}
            </span>
            <span className="usd-value-cell">
              {showBalances ? formatCurrency(position.valueUSD) : '••••••••'}
            </span>
            <span className="rate-cell">
              {position.currency === 'USD' ? '—' : `1 ${position.currency} = $${position.exchangeRate.toFixed(4)}`}
            </span>
            <span className={`change-cell ${position.change24h >= 0 ? 'positive' : 'negative'}`}>
              {position.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {position.change24h >= 0 ? '+' : ''}{position.change24h.toFixed(2)}%
            </span>
            <span className="actions-cell">
              {position.currency !== 'USD' && (
                <>
                  <button className="btn-outline small">
                    <ArrowLeftRight size={14} />
                    Convert
                  </button>
                  <button className="btn-outline small">
                    <Shield size={14} />
                    Hedge
                  </button>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="treasury-management">
      <div className="tm__header">
        <div className="tm__title-section">
          <div className="tm__icon">
            <Wallet size={28} />
          </div>
          <div>
            <h1>Treasury Management</h1>
            <p>Monitor and manage corporate finances and investments</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn-outline" 
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <Eye size={16} /> : <EyeOff size={16} />}
            {showBalances ? 'Hide' : 'Show'} Balances
          </button>
          <button 
            className="btn-outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Sync
          </button>
          <button className="btn-primary">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      <div className="treasury-summary">
        <div className="summary-card total">
          <div className="summary-icon"><DollarSign size={22} /></div>
          <div className="summary-info">
            <span className="summary-value">
              {showBalances ? formatCompactCurrency(metrics.netPosition) : '••••'}
            </span>
            <span className="summary-label">Net Position</span>
          </div>
        </div>
        <div className="summary-card cash">
          <div className="summary-icon"><Banknote size={22} /></div>
          <div className="summary-info">
            <span className="summary-value">
              {showBalances ? formatCompactCurrency(metrics.totalCash) : '••••'}
            </span>
            <span className="summary-label">Total Cash</span>
          </div>
        </div>
        <div className="summary-card investments">
          <div className="summary-icon"><Briefcase size={22} /></div>
          <div className="summary-info">
            <span className="summary-value">
              {showBalances ? formatCompactCurrency(metrics.totalInvestments) : '••••'}
            </span>
            <span className="summary-label">Investments</span>
          </div>
        </div>
        <div className="summary-card forex">
          <div className="summary-icon"><Globe size={22} /></div>
          <div className="summary-info">
            <span className="summary-value">
              {showBalances ? formatCompactCurrency(metrics.fxExposure) : '••••'}
            </span>
            <span className="summary-label">FX Exposure</span>
          </div>
        </div>
        <div className="summary-card receivables">
          <div className="summary-icon"><ArrowDownRight size={22} /></div>
          <div className="summary-info">
            <span className="summary-value">
              {showBalances ? formatCompactCurrency(metrics.pendingReceivables) : '••••'}
            </span>
            <span className="summary-label">Receivables</span>
          </div>
        </div>
        <div className="summary-card payables">
          <div className="summary-icon"><ArrowUpRight size={22} /></div>
          <div className="summary-info">
            <span className="summary-value">
              {showBalances ? formatCompactCurrency(metrics.pendingPayables) : '••••'}
            </span>
            <span className="summary-label">Payables</span>
          </div>
        </div>
      </div>

      <div className="tm__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          <Building2 size={16} />
          Accounts
          <span className="tab-badge">{accounts.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <ArrowLeftRight size={16} />
          Transactions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          <Briefcase size={16} />
          Investments
          <span className="tab-badge">{investments.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'forex' ? 'active' : ''}`}
          onClick={() => setActiveTab('forex')}
        >
          <Globe size={16} />
          Forex
        </button>
      </div>

      <div className="tm__content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'accounts' && renderAccountsTab()}
        {activeTab === 'transactions' && renderTransactionsTab()}
        {activeTab === 'investments' && renderInvestmentsTab()}
        {activeTab === 'forex' && renderForexTab()}
      </div>
    </div>
  );
}
