'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, Calendar, Clock, CheckCircle, AlertCircle,
  Download, Filter, Search, TrendingUp, Wallet,
  CreditCard, Building, Bitcoin, ArrowUpRight,
  RefreshCw, ChevronRight, ExternalLink
} from 'lucide-react';
import './payouts.css';

// ============================================
// Types
// ============================================

interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'bank' | 'paypal' | 'crypto' | 'stripe';
  requestedAt: string;
  processedAt?: string;
  transactionId?: string;
  commissions: string[];
  fees: number;
  netAmount: number;
}

interface PayoutStats {
  totalEarned: number;
  totalPaid: number;
  pendingAmount: number;
  availableBalance: number;
  nextPayoutDate: string;
  lifetimeCommissions: number;
}

interface Commission {
  id: string;
  saleId: string;
  amount: number;
  rate: number;
  level: number;
  referralName: string;
  product: string;
  status: 'pending' | 'approved' | 'paid';
  createdAt: string;
}

// ============================================
// Mock Data
// ============================================

const MOCK_STATS: PayoutStats = {
  totalEarned: 45680,
  totalPaid: 38500,
  pendingAmount: 3420,
  availableBalance: 3760,
  nextPayoutDate: '2026-01-15',
  lifetimeCommissions: 156
};

const MOCK_PAYOUTS: Payout[] = [
  {
    id: 'PAY-001',
    amount: 5000,
    status: 'completed',
    method: 'bank',
    requestedAt: '2025-12-28',
    processedAt: '2025-12-30',
    transactionId: 'TXN-789456123',
    commissions: ['COM-101', 'COM-102', 'COM-103'],
    fees: 25,
    netAmount: 4975
  },
  {
    id: 'PAY-002',
    amount: 2500,
    status: 'completed',
    method: 'paypal',
    requestedAt: '2025-12-15',
    processedAt: '2025-12-16',
    transactionId: 'PP-456789123',
    commissions: ['COM-098', 'COM-099'],
    fees: 75,
    netAmount: 2425
  },
  {
    id: 'PAY-003',
    amount: 1850,
    status: 'processing',
    method: 'stripe',
    requestedAt: '2026-01-05',
    commissions: ['COM-115', 'COM-116'],
    fees: 55.50,
    netAmount: 1794.50
  },
  {
    id: 'PAY-004',
    amount: 3200,
    status: 'pending',
    method: 'crypto',
    requestedAt: '2026-01-08',
    commissions: ['COM-120', 'COM-121', 'COM-122'],
    fees: 32,
    netAmount: 3168
  }
];

const MOCK_COMMISSIONS: Commission[] = [
  {
    id: 'COM-120',
    saleId: 'SALE-456',
    amount: 297,
    rate: 0.30,
    level: 1,
    referralName: 'TechCorp Inc.',
    product: 'Enterprise Annual',
    status: 'approved',
    createdAt: '2026-01-07'
  },
  {
    id: 'COM-121',
    saleId: 'SALE-457',
    amount: 59.40,
    rate: 0.30,
    level: 1,
    referralName: 'StartupHub',
    product: 'Professional Monthly',
    status: 'approved',
    createdAt: '2026-01-06'
  },
  {
    id: 'COM-122',
    saleId: 'SALE-458',
    amount: 19.80,
    rate: 0.10,
    level: 2,
    referralName: 'DevTeam Pro',
    product: 'Professional Monthly',
    status: 'pending',
    createdAt: '2026-01-05'
  },
  {
    id: 'COM-123',
    saleId: 'SALE-459',
    amount: 148.50,
    rate: 0.30,
    level: 1,
    referralName: 'AgencyPlus',
    product: 'Business Annual',
    status: 'pending',
    createdAt: '2026-01-04'
  }
];

// ============================================
// Helper Functions
// ============================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// ============================================
// Main Component
// ============================================

export default function AffiliatePayoutsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payouts' | 'commissions'>('payouts');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<string>('bank');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setStats(MOCK_STATS);
      setPayouts(MOCK_PAYOUTS);
      setCommissions(MOCK_COMMISSIONS);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayouts = payouts.filter(p => 
    filterStatus === 'all' || p.status === filterStatus
  );

  const filteredCommissions = commissions.filter(c =>
    filterStatus === 'all' || c.status === filterStatus
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'pending':
      case 'approved':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank': return <Building className="w-4 h-4" />;
      case 'paypal': return <Wallet className="w-4 h-4" />;
      case 'stripe': return <CreditCard className="w-4 h-4" />;
      case 'crypto': return <Bitcoin className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (stats && amount > stats.availableBalance) return;
    
    // Mock withdraw - would call backend
    console.log('Withdrawing:', amount, 'via', withdrawMethod);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
    loadData();
  };

  if (loading) {
    return (
      <div className="payouts-page">
        <div className="loading-container">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p>Loading payouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payouts-page">
      {/* Header */}
      <header className="payouts-header">
        <div className="header-content">
          <div className="header-title">
            <DollarSign className="w-8 h-8" />
            <div>
              <h1>Payouts & Earnings</h1>
              <p>Track your commissions and withdrawals</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary"
              onClick={() => setShowWithdrawModal(true)}
              disabled={!stats || stats.availableBalance < 100}
            >
              <Wallet className="w-4 h-4" /> Withdraw Funds
            </button>
            <button 
              className="btn-secondary"
              onClick={() => router.push('/affiliates/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <section className="payouts-stats">
          <div className="stat-card available">
            <div className="stat-icon">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.availableBalance)}</span>
              <span className="stat-label">Available Balance</span>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">
              <Clock className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.pendingAmount)}</span>
              <span className="stat-label">Pending Approval</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.totalEarned)}</span>
              <span className="stat-label">Total Earned</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.totalPaid)}</span>
              <span className="stat-label">Total Paid</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatDate(stats.nextPayoutDate)}</span>
              <span className="stat-label">Next Payout</span>
            </div>
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="payouts-tabs">
        <button
          className={`tab-btn ${activeTab === 'payouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          <Wallet className="w-4 h-4" /> Payouts
        </button>
        <button
          className={`tab-btn ${activeTab === 'commissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('commissions')}
        >
          <DollarSign className="w-4 h-4" /> Commissions
        </button>
      </div>

      {/* Filters */}
      <div className="payouts-filters">
        <div className="filter-group">
          <Filter className="w-4 h-4" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            {activeTab === 'payouts' ? (
              <>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </>
            ) : (
              <>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </>
            )}
          </select>
        </div>
        <button className="btn-icon" title="Export">
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      {activeTab === 'payouts' ? (
        <div className="payouts-list">
          {filteredPayouts.map((payout) => (
            <div key={payout.id} className={`payout-card ${payout.status}`}>
              <div className="payout-header">
                <div className="payout-method">
                  {getMethodIcon(payout.method)}
                  <span className="capitalize">{payout.method}</span>
                </div>
                <span className={`payout-status ${payout.status}`}>
                  {getStatusIcon(payout.status)}
                  {payout.status}
                </span>
              </div>
              
              <div className="payout-amount">
                <span className="gross">{formatCurrency(payout.amount)}</span>
                <span className="fees">- {formatCurrency(payout.fees)} fees</span>
                <span className="net">{formatCurrency(payout.netAmount)} net</span>
              </div>
              
              <div className="payout-meta">
                <span>
                  <Calendar className="w-3 h-3" />
                  Requested {formatDate(payout.requestedAt)}
                </span>
                {payout.processedAt && (
                  <span>
                    <CheckCircle className="w-3 h-3" />
                    Processed {formatDate(payout.processedAt)}
                  </span>
                )}
              </div>
              
              {payout.transactionId && (
                <div className="payout-tx">
                  <span className="tx-label">Transaction ID:</span>
                  <code>{payout.transactionId}</code>
                  <button className="btn-copy" title="Copy">
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              <div className="payout-commissions">
                <span>{payout.commissions.length} commission{payout.commissions.length !== 1 ? 's' : ''} included</span>
              </div>
            </div>
          ))}
          
          {filteredPayouts.length === 0 && (
            <div className="empty-state">
              <Wallet className="w-12 h-12" />
              <h3>No payouts found</h3>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </div>
      ) : (
        <div className="commissions-list">
          <table className="commissions-table">
            <thead>
              <tr>
                <th>Commission</th>
                <th>Referral</th>
                <th>Product</th>
                <th>Level</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.map((commission) => (
                <tr key={commission.id}>
                  <td className="commission-id">{commission.id}</td>
                  <td className="referral-name">{commission.referralName}</td>
                  <td className="product">{commission.product}</td>
                  <td className="level">
                    <span className={`level-badge level-${commission.level}`}>
                      L{commission.level}
                    </span>
                  </td>
                  <td className="rate">{(commission.rate * 100).toFixed(0)}%</td>
                  <td className="amount">{formatCurrency(commission.amount)}</td>
                  <td>
                    <span className={`status-badge ${commission.status}`}>
                      {getStatusIcon(commission.status)}
                      {commission.status}
                    </span>
                  </td>
                  <td className="date">{formatDate(commission.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCommissions.length === 0 && (
            <div className="empty-state">
              <DollarSign className="w-12 h-12" />
              <h3>No commissions found</h3>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && stats && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Withdraw Funds</h2>
              <button className="modal-close" onClick={() => setShowWithdrawModal(false)}>
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="available-info">
                <span className="label">Available Balance</span>
                <span className="value">{formatCurrency(stats.availableBalance)}</span>
              </div>
              
              <div className="form-group">
                <label>Withdrawal Amount</label>
                <div className="amount-input">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    min="100"
                    max={stats.availableBalance}
                  />
                </div>
                <span className="hint">Minimum withdrawal: $100</span>
              </div>
              
              <div className="form-group">
                <label>Withdrawal Method</label>
                <div className="method-options">
                  <button
                    className={`method-btn ${withdrawMethod === 'bank' ? 'selected' : ''}`}
                    onClick={() => setWithdrawMethod('bank')}
                  >
                    <Building className="w-5 h-5" />
                    <span>Bank Transfer</span>
                    <span className="fee">$25 fee</span>
                  </button>
                  <button
                    className={`method-btn ${withdrawMethod === 'paypal' ? 'selected' : ''}`}
                    onClick={() => setWithdrawMethod('paypal')}
                  >
                    <Wallet className="w-5 h-5" />
                    <span>PayPal</span>
                    <span className="fee">3% fee</span>
                  </button>
                  <button
                    className={`method-btn ${withdrawMethod === 'stripe' ? 'selected' : ''}`}
                    onClick={() => setWithdrawMethod('stripe')}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Stripe</span>
                    <span className="fee">2.9% fee</span>
                  </button>
                  <button
                    className={`method-btn ${withdrawMethod === 'crypto' ? 'selected' : ''}`}
                    onClick={() => setWithdrawMethod('crypto')}
                  >
                    <Bitcoin className="w-5 h-5" />
                    <span>Crypto (USDT)</span>
                    <span className="fee">1% fee</span>
                  </button>
                </div>
              </div>
              
              <div className="withdrawal-summary">
                <div className="summary-row">
                  <span>Withdrawal Amount</span>
                  <span>{formatCurrency(parseFloat(withdrawAmount) || 0)}</span>
                </div>
                <div className="summary-row">
                  <span>Processing Fee</span>
                  <span>-{formatCurrency(calculateFee(parseFloat(withdrawAmount) || 0, withdrawMethod))}</span>
                </div>
                <div className="summary-row total">
                  <span>You Will Receive</span>
                  <span>{formatCurrency(calculateNet(parseFloat(withdrawAmount) || 0, withdrawMethod))}</span>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowWithdrawModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) < 100 || parseFloat(withdrawAmount) > stats.availableBalance}
              >
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for fee calculation
function calculateFee(amount: number, method: string): number {
  if (!amount || amount <= 0) return 0;
  switch (method) {
    case 'bank': return 25;
    case 'paypal': return amount * 0.03;
    case 'stripe': return amount * 0.029;
    case 'crypto': return amount * 0.01;
    default: return 0;
  }
}

function calculateNet(amount: number, method: string): number {
  if (!amount || amount <= 0) return 0;
  return amount - calculateFee(amount, method);
}
