'use client';

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import {
  DollarSign, Users, TrendingUp, Link2, Copy, Check,
  ArrowUpRight, ArrowDownRight, Calendar, Download,
  CreditCard, Settings, Gift, Award, BarChart3,
  ExternalLink, ChevronRight, RefreshCw, Loader2,
  Network, Layers, Wallet, Clock, Eye, MousePointer,
  UserPlus, ShoppingCart
} from 'lucide-react';
import './affiliate-dashboard.css';

// ============================================
// Types
// ============================================

interface AffiliateStats {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  activeReferrals: number;
  subAffiliates: number;
  networkEarnings: number;
  tier: string;
  commissionRate: number;
}

interface Referral {
  id: string;
  email: string;
  plan: string;
  status: 'active' | 'trial' | 'churned';
  joinedDate: string;
  monthlyValue: number;
  totalEarned: number;
  level: number;
}

interface Commission {
  id: string;
  referralId: string;
  amount: number;
  rate: number;
  level: number;
  type: 'direct' | 'network' | 'bonus';
  status: 'pending' | 'approved' | 'paid';
  date: string;
  description: string;
}

interface PerformanceData {
  date: string;
  clicks: number;
  conversions: number;
  earnings: number;
}

// ============================================
// Constants
// ============================================

const AFFILIATE_TIERS = [
  { name: 'Starter', minReferrals: 0, commission: 20, color: '#6b7280' },
  { name: 'Professional', minReferrals: 10, commission: 30, color: '#3b82f6' },
  { name: 'Elite', minReferrals: 50, commission: 40, color: '#8b5cf6' },
  { name: 'Enterprise', minReferrals: 100, commission: 50, color: '#f59e0b' },
];

const COMMISSION_LEVELS = [
  { level: 1, rate: 30, label: 'Direct Referral' },
  { level: 2, rate: 10, label: 'Level 2 (Sub-affiliate)' },
  { level: 3, rate: 5, label: 'Level 3 (Network)' },
];

// ============================================
// Main Component
// ============================================

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [affiliateLink, setAffiliateLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'network' | 'commissions'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, referralsData, commissionsData, performanceData, linkData] = await Promise.all([
        invoke<AffiliateStats>('get_affiliate_stats', { dateRange }),
        invoke<Referral[]>('get_affiliate_referrals', { dateRange }),
        invoke<Commission[]>('get_affiliate_commissions', { dateRange }),
        invoke<PerformanceData[]>('get_affiliate_performance', { dateRange }),
        invoke<string>('get_affiliate_link'),
      ]);
      
      setStats(statsData);
      setReferrals(referralsData);
      setCommissions(commissionsData);
      setPerformance(performanceData);
      setAffiliateLink(linkData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Mock data for development
      setStats({
        totalEarnings: 12450.75,
        pendingEarnings: 1875.50,
        paidEarnings: 10575.25,
        clicks: 8542,
        conversions: 127,
        conversionRate: 1.49,
        activeReferrals: 89,
        subAffiliates: 12,
        networkEarnings: 2340.00,
        tier: 'Professional',
        commissionRate: 30,
      });
      setReferrals(generateMockReferrals());
      setCommissions(generateMockCommissions());
      setPerformance(generateMockPerformance());
      setAffiliateLink('https://cubeai.tools/ref/USER123');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTierProgress = (): number => {
    if (!stats) return 0;
    const currentTier = AFFILIATE_TIERS.find(t => t.name === stats.tier);
    const nextTier = AFFILIATE_TIERS.find(t => t.minReferrals > (currentTier?.minReferrals || 0));
    if (!nextTier) return 100;
    const current = stats.activeReferrals - (currentTier?.minReferrals || 0);
    const needed = nextTier.minReferrals - (currentTier?.minReferrals || 0);
    return Math.min(100, (current / needed) * 100);
  };

  const getNextTier = (): typeof AFFILIATE_TIERS[0] | null => {
    if (!stats) return null;
    const currentIndex = AFFILIATE_TIERS.findIndex(t => t.name === stats.tier);
    return AFFILIATE_TIERS[currentIndex + 1] || null;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Loading your affiliate dashboard...</p>
      </div>
    );
  }

  return (
    <div className="affiliate-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Affiliate Dashboard</h1>
          <p>Track your referrals, commissions, and network performance</p>
        </div>
        <div className="header-actions">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="date-select"
            title="Select date range"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button className="btn-secondary" onClick={loadDashboardData} title="Refresh data">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="btn-primary" onClick={() => router.push('/affiliates/payout')}>
            <Wallet className="w-4 h-4" /> Request Payout
          </button>
        </div>
      </header>

      {/* Affiliate Link Banner */}
      <div className="link-banner">
        <div className="link-info">
          <Link2 className="w-5 h-5" />
          <div>
            <span className="link-label">Your Affiliate Link</span>
            <span className="link-url">{affiliateLink}</span>
          </div>
        </div>
        <div className="link-actions">
          <button className="btn-copy" onClick={copyLink}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button className="btn-share" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(affiliateLink)}`, '_blank')}>
            Share <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card main">
          <div className="stat-icon earnings">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Earnings</span>
            <span className="stat-value">{formatCurrency(stats?.totalEarnings || 0)}</span>
            <span className="stat-change positive">
              <ArrowUpRight className="w-3 h-3" /> +23.5% vs last period
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{formatCurrency(stats?.pendingEarnings || 0)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon clicks">
            <MousePointer className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Clicks</span>
            <span className="stat-value">{formatNumber(stats?.clicks || 0)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon conversions">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Conversions</span>
            <span className="stat-value">{formatNumber(stats?.conversions || 0)}</span>
            <span className="stat-rate">{stats?.conversionRate?.toFixed(2)}% rate</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon referrals">
            <Users className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Active Referrals</span>
            <span className="stat-value">{formatNumber(stats?.activeReferrals || 0)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon network">
            <Network className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Network Earnings</span>
            <span className="stat-value">{formatCurrency(stats?.networkEarnings || 0)}</span>
            <span className="stat-sub">{stats?.subAffiliates} sub-affiliates</span>
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="tier-section">
        <div className="tier-current">
          <Award className="w-8 h-8" />
          <div className="tier-info">
            <span className="tier-label">Current Tier</span>
            <span className="tier-name">{stats?.tier}</span>
            <span className="tier-commission">{stats?.commissionRate}% commission rate</span>
          </div>
        </div>
        {getNextTier() && (
          <div className="tier-progress">
            <div className="progress-header">
              <span>Progress to {getNextTier()?.name}</span>
              <span>{stats?.activeReferrals} / {getNextTier()?.minReferrals} referrals</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${getTierProgress()}%` }}></div>
            </div>
            <span className="progress-reward">Unlock {getNextTier()?.commission}% commission</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 className="w-4 h-4" /> Overview
        </button>
        <button 
          className={`tab ${activeTab === 'referrals' ? 'active' : ''}`}
          onClick={() => setActiveTab('referrals')}
        >
          <Users className="w-4 h-4" /> Referrals
        </button>
        <button 
          className={`tab ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          <Network className="w-4 h-4" /> Network
        </button>
        <button 
          className={`tab ${activeTab === 'commissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('commissions')}
        >
          <DollarSign className="w-4 h-4" /> Commissions
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Performance Chart Placeholder */}
            <div className="chart-card">
              <h3>Performance Overview</h3>
              <div className="chart-placeholder">
                <BarChart3 className="w-12 h-12" />
                <p>Performance chart will be rendered here</p>
              </div>
            </div>

            {/* Multi-Level Commission Info */}
            <div className="commission-levels">
              <h3>Multi-Level Commission Structure</h3>
              <div className="levels-grid">
                {COMMISSION_LEVELS.map((level) => (
                  <div key={level.level} className="level-card">
                    <div className="level-header">
                      <Layers className="w-5 h-5" />
                      <span className="level-number">Level {level.level}</span>
                    </div>
                    <span className="level-rate">{level.rate}%</span>
                    <span className="level-label">{level.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {commissions.slice(0, 5).map((c) => (
                  <div key={c.id} className="activity-item">
                    <div className={`activity-icon ${c.type}`}>
                      {c.type === 'direct' && <UserPlus className="w-4 h-4" />}
                      {c.type === 'network' && <Network className="w-4 h-4" />}
                      {c.type === 'bonus' && <Gift className="w-4 h-4" />}
                    </div>
                    <div className="activity-details">
                      <span className="activity-desc">{c.description}</span>
                      <span className="activity-date">{formatDate(c.date)}</span>
                    </div>
                    <span className={`activity-amount ${c.status}`}>
                      +{formatCurrency(c.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="referrals-content">
            <div className="referrals-header">
              <h3>Your Referrals</h3>
              <button className="btn-export">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
            <div className="referrals-table">
              <div className="table-header">
                <span>User</span>
                <span>Plan</span>
                <span>Status</span>
                <span>Joined</span>
                <span>Monthly Value</span>
                <span>Total Earned</span>
              </div>
              {referrals.map((ref) => (
                <div key={ref.id} className="table-row">
                  <span className="ref-email">{ref.email}</span>
                  <span className="ref-plan">{ref.plan}</span>
                  <span className={`ref-status ${ref.status}`}>{ref.status}</span>
                  <span className="ref-date">{formatDate(ref.joinedDate)}</span>
                  <span className="ref-value">{formatCurrency(ref.monthlyValue)}</span>
                  <span className="ref-earned">{formatCurrency(ref.totalEarned)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="network-content">
            <div className="network-summary">
              <h3>Your Affiliate Network</h3>
              <p>Earn from your sub-affiliates referrals across 3 levels</p>
            </div>
            <div className="network-tree">
              <div className="tree-level you">
                <div className="tree-node">
                  <Users className="w-6 h-6" />
                  <span>You</span>
                  <span className="node-rate">30%</span>
                </div>
              </div>
              <div className="tree-connector"></div>
              <div className="tree-level level-1">
                <div className="level-label">Level 1 - {stats?.subAffiliates || 0} sub-affiliates</div>
                <div className="tree-nodes">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="tree-node">
                      <Users className="w-4 h-4" />
                      <span>10%</span>
                    </div>
                  ))}
                  <div className="tree-node more">+{Math.max(0, (stats?.subAffiliates || 0) - 3)}</div>
                </div>
              </div>
              <div className="tree-connector"></div>
              <div className="tree-level level-2">
                <div className="level-label">Level 2 - Earn 5% from their referrals</div>
              </div>
            </div>
            <div className="network-cta">
              <h4>Grow Your Network</h4>
              <p>Share your affiliate link with other marketers to build your network</p>
              <button className="btn-primary" onClick={copyLink}>
                <Copy className="w-4 h-4" /> Copy Invite Link
              </button>
            </div>
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="commissions-content">
            <div className="commissions-header">
              <h3>Commission History</h3>
              <div className="commission-filters">
                <select title="Filter by type">
                  <option value="all">All Types</option>
                  <option value="direct">Direct</option>
                  <option value="network">Network</option>
                  <option value="bonus">Bonus</option>
                </select>
                <select title="Filter by status">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <div className="commissions-table">
              <div className="table-header">
                <span>Date</span>
                <span>Type</span>
                <span>Level</span>
                <span>Description</span>
                <span>Rate</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {commissions.map((c) => (
                <div key={c.id} className="table-row">
                  <span>{formatDate(c.date)}</span>
                  <span className={`type-badge ${c.type}`}>{c.type}</span>
                  <span>L{c.level}</span>
                  <span className="comm-desc">{c.description}</span>
                  <span>{c.rate}%</span>
                  <span className="comm-amount">{formatCurrency(c.amount)}</span>
                  <span className={`status-badge ${c.status}`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Mock Data Generators
// ============================================

function generateMockReferrals(): Referral[] {
  const plans = ['Starter', 'Professional', 'Business', 'Enterprise'];
  const statuses: Referral['status'][] = ['active', 'trial', 'churned'];
  const referrals: Referral[] = [];

  for (let i = 0; i < 20; i++) {
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const status = statuses[Math.floor(Math.random() * 3)];
    const monthlyValue = plan === 'Starter' ? 29 : plan === 'Professional' ? 79 : plan === 'Business' ? 99 : 299;

    referrals.push({
      id: `ref_${i}`,
      email: `user${i + 1}@example.com`,
      plan,
      status,
      joinedDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
      monthlyValue: status === 'active' ? monthlyValue : 0,
      totalEarned: Math.floor(Math.random() * 500 + 50),
      level: 1,
    });
  }

  return referrals;
}

function generateMockCommissions(): Commission[] {
  const types: Commission['type'][] = ['direct', 'network', 'bonus'];
  const statuses: Commission['status'][] = ['pending', 'approved', 'paid'];
  const commissions: Commission[] = [];

  for (let i = 0; i < 30; i++) {
    const type = types[Math.floor(Math.random() * 3)];
    const level = type === 'direct' ? 1 : type === 'network' ? Math.floor(Math.random() * 2) + 2 : 1;
    const rate = level === 1 ? 30 : level === 2 ? 10 : 5;

    commissions.push({
      id: `comm_${i}`,
      referralId: `ref_${Math.floor(Math.random() * 20)}`,
      amount: Math.floor(Math.random() * 100 + 10),
      rate,
      level,
      type,
      status: statuses[Math.floor(Math.random() * 3)],
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      description: type === 'direct' ? 'Direct referral commission' : type === 'network' ? `Level ${level} network commission` : 'Monthly bonus',
    });
  }

  return commissions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateMockPerformance(): PerformanceData[] {
  const data: PerformanceData[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toISOString(),
      clicks: Math.floor(Math.random() * 300 + 100),
      conversions: Math.floor(Math.random() * 10 + 1),
      earnings: Math.floor(Math.random() * 500 + 100),
    });
  }
  return data;
}
