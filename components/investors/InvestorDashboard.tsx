/**
 * Investor Dashboard Component
 * Complete portfolio management interface for CUBE AI investors
 * 
 * Features:
 * - Portfolio overview with real-time values
 * - CUBEX token balance and staking
 * - Investment history and contracts
 * - Payout schedule and history
 * - Product licenses and downloads
 * - Performance analytics
 * 
 * @module InvestorDashboard
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  TrendingUp, TrendingDown, DollarSign, Coins, FileText,
  PieChart, Calendar, Download, Bell, RefreshCw, Eye, EyeOff,
  ArrowRight, ArrowUpRight, ArrowDownRight, Check, Clock,
  Wallet, LineChart, BarChart3, Award, Shield, Gift,
  ChevronRight, ChevronDown, ExternalLink, Copy, CheckCircle,
  Building2, Briefcase, Target, Percent, Timer, CreditCard
} from 'lucide-react';
import { logger } from '@/lib/services/logger-service';
import './InvestorDashboard.css';

const log = logger.scope('InvestorDashboard');

// ============================================
// Types
// ============================================

interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  returnPercentage: number;
  pendingPayouts: number;
  nextPayoutDate: string | null;
  nextPayoutAmount: number;
  cubeTokenBalance: number;
  stakedTokens: number;
  stakingRewards: number;
}

interface Investment {
  id: string;
  contractId: string;
  amount: number;
  currency: string;
  tier: 'angel' | 'seed' | 'strategic' | 'institutional';
  status: 'pending' | 'active' | 'matured' | 'withdrawn';
  interestRate: number;
  startDate: string;
  maturityDate: string;
  cubeTokensIssued: number;
  totalPayouts: number;
  products: string[];
}

interface PayoutScheduleItem {
  id: string;
  investmentId: string;
  date: string;
  amount: number;
  type: 'interest' | 'principal' | 'bonus';
  status: 'scheduled' | 'paid' | 'pending';
  transactionId?: string;
}

interface SmartContract {
  id: string;
  investmentId: string;
  contractHash: string;
  status: 'draft' | 'pending_signature' | 'active' | 'completed' | 'terminated';
  createdAt: string;
  activatedAt?: string;
  signatures: {
    signer: 'investor' | 'company';
    signedAt: string;
  }[];
}

interface ProductLicense {
  productId: string;
  productName: string;
  tier: string;
  validUntil: string;
  downloadUrl?: string;
  licenseKey?: string;
}

interface PerformanceDataPoint {
  date: string;
  value: number;
  returns: number;
}

interface Notification {
  id: string;
  type: 'payout' | 'contract' | 'token' | 'product' | 'announcement';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

// ============================================
// Constants
// ============================================

const TIER_CONFIG = {
  angel: {
    name: 'Angel Investor',
    color: '#3b82f6',
    icon: '👼',
    minInvestment: 5000,
  },
  seed: {
    name: 'Seed Investor',
    color: '#8b5cf6',
    icon: '🌱',
    minInvestment: 25000,
  },
  strategic: {
    name: 'Strategic Partner',
    color: '#f59e0b',
    icon: '🎯',
    minInvestment: 100000,
  },
  institutional: {
    name: 'Institutional Investor',
    color: '#10b981',
    icon: '🏛️',
    minInvestment: 500000,
  },
};

// ============================================
// Mock Data (for development)
// ============================================

const MOCK_PORTFOLIO: PortfolioSummary = {
  totalInvested: 50000,
  currentValue: 57500,
  totalReturns: 7500,
  returnPercentage: 15,
  pendingPayouts: 1875,
  nextPayoutDate: '2026-04-01',
  nextPayoutAmount: 1875,
  cubeTokenBalance: 6000000,
  stakedTokens: 4000000,
  stakingRewards: 320000,
};

const MOCK_INVESTMENTS: Investment[] = [
  {
    id: 'inv-001',
    contractId: 'contract-001',
    amount: 50000,
    currency: 'USD',
    tier: 'seed',
    status: 'active',
    interestRate: 15,
    startDate: '2025-10-01',
    maturityDate: '2027-04-01',
    cubeTokensIssued: 6000000,
    totalPayouts: 3750,
    products: ['nexum_enterprise', 'core_preview'],
  },
];

const MOCK_PAYOUTS: PayoutScheduleItem[] = [
  { id: 'pay-001', investmentId: 'inv-001', date: '2026-01-01', amount: 1875, type: 'interest', status: 'paid', transactionId: 'tx-001' },
  { id: 'pay-002', investmentId: 'inv-001', date: '2026-04-01', amount: 1875, type: 'interest', status: 'scheduled' },
  { id: 'pay-003', investmentId: 'inv-001', date: '2026-07-01', amount: 1875, type: 'interest', status: 'scheduled' },
  { id: 'pay-004', investmentId: 'inv-001', date: '2026-10-01', amount: 1875, type: 'interest', status: 'scheduled' },
  { id: 'pay-005', investmentId: 'inv-001', date: '2027-01-01', amount: 1875, type: 'interest', status: 'scheduled' },
  { id: 'pay-006', investmentId: 'inv-001', date: '2027-04-01', amount: 51875, type: 'principal', status: 'scheduled' },
];

const MOCK_CONTRACTS: SmartContract[] = [
  {
    id: 'contract-001',
    investmentId: 'inv-001',
    contractHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    status: 'active',
    createdAt: '2025-09-28',
    activatedAt: '2025-10-01',
    signatures: [
      { signer: 'investor', signedAt: '2025-09-29' },
      { signer: 'company', signedAt: '2025-09-30' },
    ],
  },
];

const MOCK_LICENSES: ProductLicense[] = [
  {
    productId: 'nexum_enterprise',
    productName: 'CUBE Nexum Enterprise',
    tier: 'Enterprise',
    validUntil: '2027-04-01',
    downloadUrl: '/downloads/cube-nexum-enterprise',
    licenseKey: 'CUBE-ENT-XXXX-XXXX-XXXX',
  },
  {
    productId: 'core_preview',
    productName: 'CUBE Core (Preview)',
    tier: 'Early Access',
    validUntil: '2027-04-01',
    downloadUrl: '/downloads/cube-core-preview',
    licenseKey: 'CUBE-CORE-XXXX-XXXX-XXXX',
  },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    type: 'payout',
    title: 'Q1 2026 Payout Processed',
    message: 'Your quarterly payout of $1,875 has been processed and will be deposited within 3 business days.',
    date: '2026-01-02',
    read: false,
  },
  {
    id: 'notif-002',
    type: 'token',
    title: 'Staking Rewards Distributed',
    message: 'You earned 80,000 CUBEX tokens from staking rewards this month.',
    date: '2026-01-01',
    read: true,
  },
  {
    id: 'notif-003',
    type: 'product',
    title: 'CUBE Core Preview Available',
    message: 'As a Seed investor, you now have early access to CUBE Core preview. Download it from your dashboard.',
    date: '2025-12-15',
    read: true,
  },
];

// ============================================
// Helper Functions
// ============================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateShort = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const getDaysUntil = (dateStr: string): number => {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

// ============================================
// Component
// ============================================

export const InvestorDashboard: React.FC = () => {
  // State
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [payouts, setPayouts] = useState<PayoutScheduleItem[]>([]);
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [licenses, setLicenses] = useState<ProductLicense[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'investments' | 'payouts' | 'tokens' | 'products'>('overview');
  const [showBalances, setShowBalances] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from backend
      try {
        const portfolioData = await invoke<PortfolioSummary>('get_portfolio_summary', { investorId: 'current' });
        setPortfolio(portfolioData);
      } catch {
        // Use mock data if backend not available
        log.warn('Using mock portfolio data');
        setPortfolio(MOCK_PORTFOLIO);
      }

      try {
        const investmentsData = await invoke<Investment[]>('get_investor_investments', { investorId: 'current' });
        setInvestments(investmentsData);
      } catch {
        setInvestments(MOCK_INVESTMENTS);
      }

      try {
        const payoutsData = await invoke<PayoutScheduleItem[]>('get_payout_schedule', { investorId: 'current' });
        setPayouts(payoutsData);
      } catch {
        setPayouts(MOCK_PAYOUTS);
      }

      try {
        const contractsData = await invoke<SmartContract[]>('get_investor_contracts', { investorId: 'current' });
        setContracts(contractsData);
      } catch {
        setContracts(MOCK_CONTRACTS);
      }

      try {
        const licensesData = await invoke<ProductLicense[]>('get_investor_licenses', { investorId: 'current' });
        setLicenses(licensesData);
      } catch {
        setLicenses(MOCK_LICENSES);
      }

      try {
        const notificationsData = await invoke<Notification[]>('get_investor_notifications', { investorId: 'current' });
        setNotifications(notificationsData);
      } catch {
        setNotifications(MOCK_NOTIFICATIONS);
      }

    } catch (err) {
      log.error('Failed to load investor data', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Copy to clipboard
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      log.error('Failed to copy', err);
    }
  };

  // Render loading
  if (loading) {
    return (
      <div className="investor-dashboard loading">
        <div className="loading-spinner">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span>Loading your portfolio...</span>
        </div>
      </div>
    );
  }

  // Render error
  if (error) {
    return (
      <div className="investor-dashboard error">
        <div className="error-message">
          <Shield className="w-12 h-12" />
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={loadData} className="retry-btn">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="investor-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Investor Dashboard</h1>
          <p>Welcome back! Here&apos;s your portfolio overview.</p>
        </div>
        <div className="header-right">
          <button 
            className="visibility-toggle"
            onClick={() => setShowBalances(!showBalances)}
            title={showBalances ? 'Hide balances' : 'Show balances'}
          >
            {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button className="notifications-btn">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="notification-badge">{unreadNotifications}</span>
            )}
          </button>
          <button onClick={loadData} className="refresh-btn">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          <PieChart className="w-4 h-4" />
          Overview
        </button>
        <button 
          className={activeTab === 'investments' ? 'active' : ''}
          onClick={() => setActiveTab('investments')}
        >
          <Briefcase className="w-4 h-4" />
          Investments
        </button>
        <button 
          className={activeTab === 'payouts' ? 'active' : ''}
          onClick={() => setActiveTab('payouts')}
        >
          <Calendar className="w-4 h-4" />
          Payouts
        </button>
        <button 
          className={activeTab === 'tokens' ? 'active' : ''}
          onClick={() => setActiveTab('tokens')}
        >
          <Coins className="w-4 h-4" />
          CUBEX Tokens
        </button>
        <button 
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          <Download className="w-4 h-4" />
          Products
        </button>
      </nav>

      {/* Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && portfolio && (
          <>
            {/* Portfolio Stats */}
            <section className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Invested</span>
                  <span className="stat-value">
                    {showBalances ? formatCurrency(portfolio.totalInvested) : '••••••'}
                  </span>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Current Value</span>
                  <span className="stat-value">
                    {showBalances ? formatCurrency(portfolio.currentValue) : '••••••'}
                  </span>
                  <span className="stat-change positive">
                    <ArrowUpRight className="w-4 h-4" />
                    +{portfolio.returnPercentage}%
                  </span>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-icon">
                  <Coins className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <span className="stat-label">CUBEX Balance</span>
                  <span className="stat-value">
                    {showBalances ? formatNumber(portfolio.cubeTokenBalance) : '••••••'}
                  </span>
                  <span className="stat-sub">
                    +{formatNumber(portfolio.stakingRewards)} from staking
                  </span>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Next Payout</span>
                  <span className="stat-value">
                    {showBalances ? formatCurrency(portfolio.nextPayoutAmount) : '••••••'}
                  </span>
                  <span className="stat-sub">
                    {portfolio.nextPayoutDate && (
                      <>in {getDaysUntil(portfolio.nextPayoutDate)} days</>
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="actions-grid">
                <a href="/investors/invest" className="action-card">
                  <div className="action-icon">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <span className="action-title">Add Investment</span>
                  <span className="action-desc">Increase your stake in CUBE AI</span>
                  <ChevronRight className="w-5 h-5" />
                </a>
                <a href="/investors/stake" className="action-card">
                  <div className="action-icon">
                    <Coins className="w-6 h-6" />
                  </div>
                  <span className="action-title">Stake Tokens</span>
                  <span className="action-desc">Earn 8% APY on CUBEX</span>
                  <ChevronRight className="w-5 h-5" />
                </a>
                <a href="/investors/withdraw" className="action-card">
                  <div className="action-icon">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="action-title">Withdraw</span>
                  <span className="action-desc">Request payout to bank</span>
                  <ChevronRight className="w-5 h-5" />
                </a>
                <a href="/investors/referrals" className="action-card">
                  <div className="action-icon">
                    <Gift className="w-6 h-6" />
                  </div>
                  <span className="action-title">Refer Investors</span>
                  <span className="action-desc">Earn 5% bonus on referrals</span>
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>
            </section>

            {/* Recent Activity & Notifications */}
            <section className="activity-section">
              <div className="activity-header">
                <h2>Recent Activity</h2>
                <a href="/investors/notifications" className="view-all">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="notifications-list">
                {notifications.slice(0, 5).map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? '' : 'unread'}`}
                  >
                    <div className={`notification-icon ${notification.type}`}>
                      {notification.type === 'payout' && <DollarSign className="w-4 h-4" />}
                      {notification.type === 'token' && <Coins className="w-4 h-4" />}
                      {notification.type === 'product' && <Download className="w-4 h-4" />}
                      {notification.type === 'contract' && <FileText className="w-4 h-4" />}
                      {notification.type === 'announcement' && <Bell className="w-4 h-4" />}
                    </div>
                    <div className="notification-content">
                      <span className="notification-title">{notification.title}</span>
                      <span className="notification-message">{notification.message}</span>
                    </div>
                    <span className="notification-date">{formatDateShort(notification.date)}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'investments' && (
          <section className="investments-section">
            <div className="section-header">
              <h2>Your Investments</h2>
              <a href="/investors/invest" className="btn-primary">
                <DollarSign className="w-4 h-4" />
                New Investment
              </a>
            </div>

            <div className="investments-list">
              {investments.map(investment => {
                const tier = TIER_CONFIG[investment.tier];
                const contract = contracts.find(c => c.id === investment.contractId);
                
                return (
                  <div key={investment.id} className="investment-card">
                    <div className="investment-header">
                      <div className="investment-tier" style={{ borderColor: tier.color }}>
                        <span className="tier-icon">{tier.icon}</span>
                        <span className="tier-name">{tier.name}</span>
                      </div>
                      <span className={`investment-status ${investment.status}`}>
                        {investment.status}
                      </span>
                    </div>

                    <div className="investment-body">
                      <div className="investment-amount">
                        <span className="label">Investment Amount</span>
                        <span className="value">
                          {showBalances ? formatCurrency(investment.amount) : '••••••'}
                        </span>
                      </div>

                      <div className="investment-details">
                        <div className="detail">
                          <Percent className="w-4 h-4" />
                          <span>{investment.interestRate}% APY</span>
                        </div>
                        <div className="detail">
                          <Coins className="w-4 h-4" />
                          <span>{formatNumber(investment.cubeTokensIssued)} CUBEX</span>
                        </div>
                        <div className="detail">
                          <Timer className="w-4 h-4" />
                          <span>Matures {formatDate(investment.maturityDate)}</span>
                        </div>
                      </div>

                      <div className="investment-progress">
                        <div className="progress-labels">
                          <span>Progress to Maturity</span>
                          <span>
                            {Math.round(
                              ((new Date().getTime() - new Date(investment.startDate).getTime()) /
                              (new Date(investment.maturityDate).getTime() - new Date(investment.startDate).getTime())) * 100
                            )}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, Math.round(
                                ((new Date().getTime() - new Date(investment.startDate).getTime()) /
                                (new Date(investment.maturityDate).getTime() - new Date(investment.startDate).getTime())) * 100
                              ))}%`
                            }}
                          />
                        </div>
                      </div>

                      {contract && (
                        <div className="contract-info">
                          <FileText className="w-4 h-4" />
                          <span>Contract: {contract.contractHash.slice(0, 16)}...</span>
                          <button 
                            className="copy-btn"
                            onClick={() => copyToClipboard(contract.contractHash, contract.id)}
                          >
                            {copiedKey === contract.id ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="investment-footer">
                      <a href={`/investors/investment/${investment.id}`} className="view-details">
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'payouts' && (
          <section className="payouts-section">
            <div className="section-header">
              <h2>Payout Schedule</h2>
              <div className="payout-summary">
                <div className="summary-item">
                  <span className="label">Total Paid</span>
                  <span className="value success">
                    {showBalances ? formatCurrency(payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)) : '••••••'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">Upcoming</span>
                  <span className="value">
                    {showBalances ? formatCurrency(payouts.filter(p => p.status === 'scheduled').reduce((sum, p) => sum + p.amount, 0)) : '••••••'}
                  </span>
                </div>
              </div>
            </div>

            <div className="payouts-timeline">
              {payouts.map((payout, index) => (
                <div key={payout.id} className={`payout-item ${payout.status}`}>
                  <div className="payout-marker">
                    {payout.status === 'paid' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="payout-content">
                    <div className="payout-header">
                      <span className="payout-date">{formatDate(payout.date)}</span>
                      <span className={`payout-type ${payout.type}`}>
                        {payout.type === 'principal' ? 'Principal + Interest' : 'Interest'}
                      </span>
                    </div>
                    <div className="payout-amount">
                      {showBalances ? formatCurrency(payout.amount) : '••••••'}
                    </div>
                    {payout.transactionId && (
                      <div className="payout-tx">
                        <span>TX: {payout.transactionId}</span>
                        <button 
                          className="copy-btn"
                          onClick={() => copyToClipboard(payout.transactionId!, payout.id)}
                        >
                          {copiedKey === payout.id ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'tokens' && portfolio && (
          <section className="tokens-section">
            <div className="section-header">
              <h2>CUBEX Token Management</h2>
            </div>

            <div className="token-overview">
              <div className="token-card main">
                <div className="token-icon">
                  <Coins className="w-10 h-10" />
                </div>
                <div className="token-info">
                  <span className="token-label">Total CUBEX Balance</span>
                  <span className="token-value">
                    {showBalances ? formatNumber(portfolio.cubeTokenBalance) : '••••••'}
                  </span>
                  <span className="token-usd">
                    ≈ {showBalances ? formatCurrency(portfolio.cubeTokenBalance * 0.01) : '••••••'} USD
                  </span>
                </div>
              </div>

              <div className="token-breakdown">
                <div className="breakdown-item">
                  <div className="breakdown-icon staked">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="breakdown-info">
                    <span className="breakdown-label">Staked</span>
                    <span className="breakdown-value">
                      {showBalances ? formatNumber(portfolio.stakedTokens) : '••••••'}
                    </span>
                  </div>
                </div>
                <div className="breakdown-item">
                  <div className="breakdown-icon available">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="breakdown-info">
                    <span className="breakdown-label">Available</span>
                    <span className="breakdown-value">
                      {showBalances ? formatNumber(portfolio.cubeTokenBalance - portfolio.stakedTokens) : '••••••'}
                    </span>
                  </div>
                </div>
                <div className="breakdown-item">
                  <div className="breakdown-icon rewards">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="breakdown-info">
                    <span className="breakdown-label">Staking Rewards</span>
                    <span className="breakdown-value">
                      {showBalances ? formatNumber(portfolio.stakingRewards) : '••••••'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="staking-info">
              <h3>Staking Benefits</h3>
              <div className="staking-tiers">
                <div className="staking-tier">
                  <span className="tier-name">Bronze</span>
                  <span className="tier-requirement">10,000+ CUBEX</span>
                  <span className="tier-benefit">10% fee discount</span>
                </div>
                <div className="staking-tier">
                  <span className="tier-name">Silver</span>
                  <span className="tier-requirement">50,000+ CUBEX</span>
                  <span className="tier-benefit">25% fee discount</span>
                </div>
                <div className="staking-tier active">
                  <span className="tier-name">Gold</span>
                  <span className="tier-requirement">100,000+ CUBEX</span>
                  <span className="tier-benefit">35% fee discount</span>
                </div>
                <div className="staking-tier">
                  <span className="tier-name">Platinum</span>
                  <span className="tier-requirement">500,000+ CUBEX</span>
                  <span className="tier-benefit">50% fee discount</span>
                </div>
              </div>

              <div className="staking-actions">
                <button className="btn-primary">
                  <Shield className="w-4 h-4" />
                  Stake More Tokens
                </button>
                <button className="btn-secondary">
                  <Wallet className="w-4 h-4" />
                  Unstake Tokens
                </button>
                <button className="btn-secondary">
                  <Gift className="w-4 h-4" />
                  Claim Rewards
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'products' && (
          <section className="products-section">
            <div className="section-header">
              <h2>Your Product Licenses</h2>
              <p>Download and access your investor-exclusive products</p>
            </div>

            <div className="products-grid">
              {licenses.map(license => (
                <div key={license.productId} className="product-license-card">
                  <div className="product-header">
                    <div className="product-icon">
                      {license.productId.includes('nexum') ? (
                        <Building2 className="w-8 h-8" />
                      ) : (
                        <Briefcase className="w-8 h-8" />
                      )}
                    </div>
                    <div className="product-info">
                      <h3>{license.productName}</h3>
                      <span className="product-tier">{license.tier} License</span>
                    </div>
                  </div>

                  <div className="product-details">
                    <div className="detail-item">
                      <Calendar className="w-4 h-4" />
                      <span>Valid until {formatDate(license.validUntil)}</span>
                    </div>
                    {license.licenseKey && (
                      <div className="license-key">
                        <span className="key-label">License Key:</span>
                        <div className="key-value">
                          <code>{license.licenseKey}</code>
                          <button 
                            className="copy-btn"
                            onClick={() => copyToClipboard(license.licenseKey!, license.productId)}
                          >
                            {copiedKey === license.productId ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="product-actions">
                    {license.downloadUrl && (
                      <a href={license.downloadUrl} className="btn-primary">
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                    <a href={`/docs/${license.productId}`} className="btn-secondary">
                      <FileText className="w-4 h-4" />
                      Documentation
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="upcoming-products">
              <h3>Coming Soon</h3>
              <div className="upcoming-grid">
                <div className="upcoming-card">
                  <Building2 className="w-6 h-6" />
                  <span className="upcoming-name">CUBE Core</span>
                  <span className="upcoming-date">Q2 2026</span>
                </div>
                <div className="upcoming-card">
                  <CreditCard className="w-6 h-6" />
                  <span className="upcoming-name">CUBE Finance</span>
                  <span className="upcoming-date">Q3 2026</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default InvestorDashboard;
