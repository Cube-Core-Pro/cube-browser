'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, Calendar, Clock, CheckCircle, TrendingUp,
  Download, Filter, Coins, Wallet, PiggyBank, RefreshCw,
  ArrowUpRight, ArrowDownRight, ChevronRight, Eye
} from 'lucide-react';
import './payouts.css';

// ============================================
// Types
// ============================================

interface InvestorPayout {
  id: string;
  type: 'dividend' | 'interest' | 'principal' | 'token_reward';
  amount: number;
  tokenAmount?: number;
  status: 'scheduled' | 'processing' | 'completed' | 'pending';
  investmentId: string;
  investmentTier: string;
  scheduledDate: string;
  processedDate?: string;
  transactionHash?: string;
}

interface PayoutStats {
  totalReceived: number;
  upcomingPayouts: number;
  nextPayoutDate: string;
  nextPayoutAmount: number;
  yearToDateEarnings: number;
  averageMonthlyReturn: number;
  totalTokenRewards: number;
}

interface PayoutSchedule {
  date: string;
  amount: number;
  type: 'dividend' | 'interest' | 'principal';
  investmentId: string;
}

// ============================================
// Mock Data
// ============================================

const MOCK_STATS: PayoutStats = {
  totalReceived: 12500,
  upcomingPayouts: 3250,
  nextPayoutDate: '2026-01-15',
  nextPayoutAmount: 1250,
  yearToDateEarnings: 4800,
  averageMonthlyReturn: 625,
  totalTokenRewards: 25000
};

const MOCK_PAYOUTS: InvestorPayout[] = [
  {
    id: 'IPAY-001',
    type: 'interest',
    amount: 500,
    status: 'completed',
    investmentId: 'INV-001',
    investmentTier: 'Seed',
    scheduledDate: '2025-12-15',
    processedDate: '2025-12-15',
    transactionHash: '0x1234...abcd'
  },
  {
    id: 'IPAY-002',
    type: 'dividend',
    amount: 750,
    status: 'completed',
    investmentId: 'INV-001',
    investmentTier: 'Seed',
    scheduledDate: '2025-12-01',
    processedDate: '2025-12-01',
    transactionHash: '0x5678...efgh'
  },
  {
    id: 'IPAY-003',
    type: 'token_reward',
    amount: 0,
    tokenAmount: 5000,
    status: 'completed',
    investmentId: 'INV-001',
    investmentTier: 'Seed',
    scheduledDate: '2025-11-15',
    processedDate: '2025-11-15',
    transactionHash: '0x9abc...ijkl'
  },
  {
    id: 'IPAY-004',
    type: 'interest',
    amount: 1250,
    status: 'scheduled',
    investmentId: 'INV-001',
    investmentTier: 'Seed',
    scheduledDate: '2026-01-15'
  },
  {
    id: 'IPAY-005',
    type: 'dividend',
    amount: 2000,
    status: 'scheduled',
    investmentId: 'INV-002',
    investmentTier: 'Strategic',
    scheduledDate: '2026-02-01'
  }
];

const MOCK_SCHEDULE: PayoutSchedule[] = [
  { date: '2026-01-15', amount: 1250, type: 'interest', investmentId: 'INV-001' },
  { date: '2026-02-01', amount: 2000, type: 'dividend', investmentId: 'INV-002' },
  { date: '2026-02-15', amount: 1250, type: 'interest', investmentId: 'INV-001' },
  { date: '2026-03-01', amount: 2000, type: 'dividend', investmentId: 'INV-002' },
  { date: '2026-03-15', amount: 1250, type: 'interest', investmentId: 'INV-001' },
  { date: '2026-04-01', amount: 2000, type: 'dividend', investmentId: 'INV-002' }
];

// ============================================
// Helper Functions
// ============================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

// ============================================
// Main Component
// ============================================

export default function InvestorPayoutsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [payouts, setPayouts] = useState<InvestorPayout[]>([]);
  const [schedule, setSchedule] = useState<PayoutSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'upcoming'>('history');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setStats(MOCK_STATS);
      setPayouts(MOCK_PAYOUTS);
      setSchedule(MOCK_SCHEDULE);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedPayouts = payouts.filter(p => p.status === 'completed');
  const upcomingPayouts = payouts.filter(p => p.status === 'scheduled' || p.status === 'processing');

  const filteredPayouts = (activeTab === 'history' ? completedPayouts : upcomingPayouts)
    .filter(p => filterType === 'all' || p.type === filterType);

  const getTypeIcon = (type: InvestorPayout['type']) => {
    switch (type) {
      case 'dividend': return <TrendingUp className="w-4 h-4" />;
      case 'interest': return <DollarSign className="w-4 h-4" />;
      case 'principal': return <PiggyBank className="w-4 h-4" />;
      case 'token_reward': return <Coins className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: InvestorPayout['type']): string => {
    switch (type) {
      case 'dividend': return 'Dividend';
      case 'interest': return 'Interest';
      case 'principal': return 'Principal';
      case 'token_reward': return 'Token Reward';
      default: return type;
    }
  };

  const getStatusBadge = (status: InvestorPayout['status']) => {
    switch (status) {
      case 'completed':
        return <span className="status-badge completed"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'processing':
        return <span className="status-badge processing"><RefreshCw className="w-3 h-3" /> Processing</span>;
      case 'scheduled':
        return <span className="status-badge scheduled"><Clock className="w-3 h-3" /> Scheduled</span>;
      case 'pending':
        return <span className="status-badge pending"><Clock className="w-3 h-3" /> Pending</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="investor-payouts-page">
        <div className="loading-container">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p>Loading payouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="investor-payouts-page">
      {/* Header */}
      <header className="payouts-header">
        <div className="header-content">
          <div className="header-title">
            <Wallet className="w-8 h-8" />
            <div>
              <h1>Payouts & Returns</h1>
              <p>Track your investment earnings and scheduled payouts</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => router.push('/investors/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <section className="payouts-stats">
          <div className="stat-card highlight">
            <div className="stat-icon">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.totalReceived)}</span>
              <span className="stat-label">Total Received</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.upcomingPayouts)}</span>
              <span className="stat-label">Upcoming Payouts</span>
            </div>
          </div>
          <div className="stat-card next-payout">
            <div className="stat-icon">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.nextPayoutAmount)}</span>
              <span className="stat-label">Next Payout • {formatDate(stats.nextPayoutDate)}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.yearToDateEarnings)}</span>
              <span className="stat-label">Year to Date</span>
            </div>
          </div>
          <div className="stat-card tokens">
            <div className="stat-icon">
              <Coins className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatNumber(stats.totalTokenRewards)}</span>
              <span className="stat-label">CUBEX Rewards</span>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="payouts-content">
        {/* Left Column - Payout History */}
        <div className="payouts-main">
          {/* Tabs */}
          <div className="payouts-tabs">
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <CheckCircle className="w-4 h-4" /> Payment History
            </button>
            <button
              className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              <Calendar className="w-4 h-4" /> Upcoming
            </button>
          </div>

          {/* Filters */}
          <div className="payouts-filters">
            <div className="filter-group">
              <Filter className="w-4 h-4" />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="dividend">Dividends</option>
                <option value="interest">Interest</option>
                <option value="principal">Principal</option>
                <option value="token_reward">Token Rewards</option>
              </select>
            </div>
            <button className="btn-icon" title="Export">
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Payouts List */}
          <div className="payouts-list">
            {filteredPayouts.map((payout) => (
              <div key={payout.id} className={`payout-card ${payout.type}`}>
                <div className="payout-icon">
                  {getTypeIcon(payout.type)}
                </div>
                <div className="payout-info">
                  <div className="payout-header">
                    <span className="payout-type">{getTypeLabel(payout.type)}</span>
                    {getStatusBadge(payout.status)}
                  </div>
                  <div className="payout-amount">
                    {payout.type === 'token_reward' ? (
                      <span className="token-amount">{formatNumber(payout.tokenAmount || 0)} CUBEX</span>
                    ) : (
                      <span className="cash-amount">{formatCurrency(payout.amount)}</span>
                    )}
                  </div>
                  <div className="payout-meta">
                    <span className="investment-tier">{payout.investmentTier} Investment</span>
                    <span className="payout-date">
                      {payout.status === 'completed' ? 'Paid ' : 'Scheduled '}
                      {formatDate(payout.processedDate || payout.scheduledDate)}
                    </span>
                  </div>
                </div>
                {payout.transactionHash && (
                  <a 
                    href={`https://etherscan.io/tx/${payout.transactionHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}

            {filteredPayouts.length === 0 && (
              <div className="empty-state">
                <Wallet className="w-12 h-12" />
                <h3>No payouts found</h3>
                <p>
                  {activeTab === 'history' 
                    ? 'Your completed payouts will appear here'
                    : 'No upcoming payouts scheduled'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Schedule */}
        <div className="payouts-sidebar">
          <div className="schedule-card">
            <h3>
              <Calendar className="w-5 h-5" /> Payout Schedule
            </h3>
            <div className="schedule-list">
              {schedule.slice(0, 6).map((item, index) => (
                <div key={index} className="schedule-item">
                  <div className="schedule-date">
                    <span className="month">{new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="day">{new Date(item.date).getDate()}</span>
                  </div>
                  <div className="schedule-info">
                    <span className="schedule-type capitalize">{item.type}</span>
                    <span className="schedule-amount">{formatCurrency(item.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="view-all-btn">
              View Full Schedule <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="summary-card">
            <h3>Earnings Summary</h3>
            <div className="summary-item">
              <span className="summary-label">Average Monthly Return</span>
              <span className="summary-value">{formatCurrency(stats?.averageMonthlyReturn || 0)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Effective APY</span>
              <span className="summary-value highlight">15.2%</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Investments</span>
              <span className="summary-value">2 Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
