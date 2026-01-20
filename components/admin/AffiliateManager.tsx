'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, DollarSign, Link2, Copy, TrendingUp,
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Download, Mail, Globe, Award, Gift, Share2, Eye, Edit,
  Trash2, Plus, ChevronDown, ChevronUp,
  BarChart3, Wallet,
  CreditCard, Send, FileText, Settings, Search, User, Star
} from 'lucide-react';
import {
  AffiliateManagementService,
  Affiliate as _BackendAffiliate,
  Payout as _BackendPayout,
  AffiliateGlobalStats as _AffiliateGlobalStats,
  CreateAffiliateRequest
} from '@/lib/services/admin-service';
import { logger } from '@/lib/services/logger-service';
import './AffiliateManager.css';

const log = logger.scope('AffiliateManager');

// ===== Types =====
interface Affiliate {
  id: string;
  userId: string;
  name: string;
  email: string;
  company?: string;
  website?: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  referralCode: string;
  referralLink: string;
  joinedAt: Date;
  lastActivityAt: Date;
  stats: AffiliateStats;
  paymentInfo: PaymentInfo;
  marketingMaterials: string[];
  notes?: string;
}

interface AffiliateStats {
  totalClicks: number;
  totalSignups: number;
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  conversionRate: number;
  avgOrderValue: number;
  lifetimeValue: number;
  monthlyClicks: number;
  monthlySignups: number;
  monthlySales: number;
  monthlyCommission: number;
}

interface PaymentInfo {
  method: 'paypal' | 'bank_transfer' | 'stripe' | 'crypto';
  paypalEmail?: string;
  bankAccount?: string;
  bankName?: string;
  cryptoWallet?: string;
  cryptoType?: string;
  minimumPayout: number;
  payoutFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  currency: string;
}

interface Referral {
  id: string;
  affiliateId: string;
  affiliateName: string;
  customerId: string;
  customerEmail: string;
  type: 'click' | 'signup' | 'trial' | 'purchase';
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  plan?: string;
  amount?: number;
  commission?: number;
  commissionRate?: number;
  createdAt: Date;
  convertedAt?: Date;
  paidAt?: Date;
  ipAddress?: string;
  country?: string;
  source?: string;
}

interface Payout {
  id: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  transactionId?: string;
  notes?: string;
}

interface CommissionTier {
  tier: string;
  name: string;
  minSales: number;
  maxSales: number | null;
  commissionRate: number;
  bonusRate: number;
  benefits: string[];
}

interface AffiliateProgram {
  name: string;
  description: string;
  cookieDuration: number;
  defaultCommissionRate: number;
  minimumPayout: number;
  payoutFrequency: string;
  tiers: CommissionTier[];
  rules: string[];
  isActive: boolean;
}

interface ProgramStats {
  totalAffiliates: number;
  activeAffiliates: number;
  pendingAffiliates: number;
  totalReferrals: number;
  totalClicks: number;
  totalSales: number;
  totalRevenue: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  avgCommissionRate: number;
  topAffiliate: { name: string; revenue: number } | null;
}

// ===== Component =====
export const AffiliateManager: React.FC = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [programStats, setProgramStats] = useState<ProgramStats | null>(null);
  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'affiliates' | 'referrals' | 'payouts' | 'materials' | 'settings'>('dashboard');
  const [_selectedAffiliate, _setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [expandedAffiliate, setExpandedAffiliate] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [error, setError] = useState<string | null>(null);

  // Create affiliate modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAffiliate, setNewAffiliate] = useState({
    email: '',
    name: '',
    company: '',
    website: '',
    tier: 'bronze' as const
  });

  // Payout modal
  const [_showPayoutModal, _setShowPayoutModal] = useState(false);
  const [_selectedPayouts, _setSelectedPayouts] = useState<string[]>([]);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load data from backend
      const statusParam = filterStatus !== 'all' ? filterStatus : undefined;
      const tierParam = filterTier !== 'all' ? filterTier : undefined;
      const searchParam = searchQuery || undefined;

      const [backendAffiliates, backendPayouts, backendStats] = await Promise.all([
        AffiliateManagementService.getAffiliates(statusParam, tierParam, searchParam),
        AffiliateManagementService.getPayouts(),
        AffiliateManagementService.getStats()
      ]);

      // Convert backend types to frontend types
      const convertedAffiliates: Affiliate[] = backendAffiliates.map(a => ({
        id: a.id,
        userId: a.user_id,
        name: a.name,
        email: a.email,
        company: a.company || undefined,
        website: a.website || undefined,
        status: a.status === 'inactive' ? 'suspended' : a.status,
        tier: a.tier,
        referralCode: a.referral_code,
        referralLink: a.referral_link,
        joinedAt: new Date(a.joined_at),
        lastActivityAt: new Date(a.last_activity_at),
        stats: {
          totalClicks: a.stats.total_clicks,
          totalSignups: a.stats.total_signups,
          totalSales: a.stats.total_sales,
          totalRevenue: a.stats.total_revenue,
          totalCommission: a.stats.total_commission,
          pendingCommission: a.stats.pending_commission,
          paidCommission: a.stats.paid_commission,
          conversionRate: a.stats.conversion_rate,
          avgOrderValue: a.stats.avg_order_value,
          lifetimeValue: a.stats.lifetime_value,
          monthlyClicks: a.stats.monthly_clicks,
          monthlySignups: a.stats.monthly_signups,
          monthlySales: a.stats.monthly_sales,
          monthlyCommission: a.stats.monthly_commission
        },
        paymentInfo: {
          method: a.payment_info.method === 'check' ? 'paypal' : a.payment_info.method,
          paypalEmail: a.payment_info.paypal_email || undefined,
          bankAccount: a.payment_info.bank_account || undefined,
          cryptoWallet: a.payment_info.crypto_address || undefined,
          minimumPayout: a.payment_info.minimum_payout,
          payoutFrequency: a.payment_info.payout_frequency === 'bi_weekly' ? 'biweekly' : a.payment_info.payout_frequency,
          currency: a.payment_info.currency
        },
        marketingMaterials: a.marketing_materials
      }));

      const convertedPayouts: Payout[] = backendPayouts.map(p => ({
        id: p.id,
        affiliateId: p.affiliate_id,
        affiliateName: p.affiliate_name,
        amount: p.amount,
        currency: p.currency,
        method: p.method.charAt(0).toUpperCase() + p.method.slice(1).replace('_', ' '),
        status: p.status === 'cancelled' ? 'failed' : p.status,
        createdAt: new Date(p.created_at),
        processedAt: p.processed_at ? new Date(p.processed_at) : undefined,
        transactionId: p.transaction_id || undefined,
        notes: p.notes || undefined
      }));

      const convertedStats: ProgramStats = {
        totalAffiliates: backendStats.total_affiliates,
        activeAffiliates: backendStats.active_affiliates,
        pendingAffiliates: Math.max(0, backendStats.total_affiliates - backendStats.active_affiliates),
        totalReferrals: 0,
        totalClicks: 0,
        totalSales: 0,
        totalRevenue: backendStats.total_revenue,
        totalCommissionPaid: backendStats.total_commissions_paid,
        pendingCommission: backendStats.pending_payouts,
        avgCommissionRate: backendStats.avg_commission_rate,
        topAffiliate: backendStats.top_performer_id 
          ? { name: 'Top Performer', revenue: 0 }
          : null
      };

      // Calculate totals from affiliates
      convertedAffiliates.forEach(a => {
        convertedStats.totalClicks += a.stats.totalClicks;
        convertedStats.totalSales += a.stats.totalSales;
        convertedStats.totalReferrals += a.stats.totalSignups;
      });

      // Mock referrals (would need separate API)
      const mockReferrals: Referral[] = [];

      // Default program settings
      const defaultProgram: AffiliateProgram = {
        name: 'CUBE Nexum Partner Program',
        description: 'Earn commissions by referring customers to CUBE Nexum',
        cookieDuration: 90,
        defaultCommissionRate: 20,
        minimumPayout: 50,
        payoutFrequency: 'monthly',
        tiers: [
          { tier: 'bronze', name: 'Bronze Partner', minSales: 0, maxSales: 10, commissionRate: 15, bonusRate: 0, benefits: ['Access to marketing materials', 'Monthly newsletter'] },
          { tier: 'silver', name: 'Silver Partner', minSales: 11, maxSales: 50, commissionRate: 18, bonusRate: 2, benefits: ['All Bronze benefits', 'Priority support', 'Exclusive webinars'] },
          { tier: 'gold', name: 'Gold Partner', minSales: 51, maxSales: 200, commissionRate: 20, bonusRate: 5, benefits: ['All Silver benefits', 'Custom landing pages', 'Co-marketing opportunities'] },
          { tier: 'platinum', name: 'Platinum Partner', minSales: 201, maxSales: 500, commissionRate: 25, bonusRate: 10, benefits: ['All Gold benefits', 'Dedicated account manager', 'Revenue share on renewals'] },
          { tier: 'diamond', name: 'Diamond Partner', minSales: 501, maxSales: null, commissionRate: 30, bonusRate: 15, benefits: ['All Platinum benefits', 'White-label options', 'API access', 'Custom integrations'] }
        ],
        rules: [
          'Commission is paid on first-year revenue only',
          'Self-referrals are not allowed',
          '90-day cookie duration',
          'Commissions are paid after 30-day refund period'
        ],
        isActive: true
      };

      setAffiliates(convertedAffiliates);
      setReferrals(mockReferrals);
      setPayouts(convertedPayouts);
      setProgram(defaultProgram);
      setProgramStats(convertedStats);
    } catch (err) {
      log.error('Failed to load affiliate data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterTier, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get tier color
  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'platinum': return '#e5e4e2';
      case 'diamond': return '#b9f2ff';
      default: return '#a1a1aa';
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': case 'approved': case 'completed': return 'green';
      case 'pending': case 'processing': return 'yellow';
      case 'suspended': case 'rejected': case 'failed': return 'red';
      case 'refunded': return 'orange';
      default: return 'gray';
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show toast notification
  };

  // Approve affiliate
  const handleApproveAffiliate = async (affiliateId: string) => {
    try {
      await AffiliateManagementService.approveAffiliate(affiliateId);
      await loadData();
    } catch (err) {
      log.error('Failed to approve affiliate:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve affiliate');
    }
  };

  // Suspend affiliate
  const handleSuspendAffiliate = async (affiliateId: string) => {
    try {
      await AffiliateManagementService.suspendAffiliate(affiliateId, 'Suspended by admin');
      await loadData();
    } catch (err) {
      log.error('Failed to suspend affiliate:', err);
      setError(err instanceof Error ? err.message : 'Failed to suspend affiliate');
    }
  };

  // Update affiliate tier
  const _handleUpdateTier = async (affiliateId: string, _newTier: Affiliate['tier']) => {
    try {
      await AffiliateManagementService.updateTier(affiliateId, _newTier);
      await loadData();
    } catch (err) {
      log.error('Failed to update tier:', err);
      setError(err instanceof Error ? err.message : 'Failed to update tier');
    }
  };

  // Create payout
  const _handleCreatePayout = async (affiliateId: string, _amount: number) => {
    try {
      await AffiliateManagementService.createPayout(affiliateId, _amount);
      await loadData();
    } catch (err) {
      log.error('Failed to create payout:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payout');
    }
  };

  // Process payout
  const handleProcessPayout = async (_payoutId: string) => {
    try {
      const transactionId = `TXN-${Date.now()}`;
      await AffiliateManagementService.processPayout(_payoutId, transactionId);
      await loadData();
    } catch (err) {
      log.error('Failed to process payout:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payout');
    }
  };

  // Create affiliate
  const _handleCreateAffiliate = async () => {
    if (!newAffiliate.email || !newAffiliate.name) {
      setError('Email and name are required');
      return;
    }
    try {
      const request: CreateAffiliateRequest = {
        email: newAffiliate.email,
        name: newAffiliate.name,
        company: newAffiliate.company || undefined,
        website: newAffiliate.website || undefined,
        tier: newAffiliate.tier
      };
      await AffiliateManagementService.createAffiliate(request);
      setShowCreateModal(false);
      setNewAffiliate({ email: '', name: '', company: '', website: '', tier: 'bronze' });
      await loadData();
    } catch (err) {
      log.error('Failed to create affiliate:', err);
      setError(err instanceof Error ? err.message : 'Failed to create affiliate');
    }
  };

  // Filter affiliates
  const filteredAffiliates = affiliates.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterTier !== 'all' && a.tier !== filterTier) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return a.name.toLowerCase().includes(query) || 
             a.email.toLowerCase().includes(query) ||
             a.referralCode.toLowerCase().includes(query);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="affiliate-manager-loading">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span>Loading affiliate program...</span>
      </div>
    );
  }

  return (
    <div className="affiliate-manager">
      {/* Header */}
      <div className="affiliate-manager-header">
        <div className="header-title">
          <Share2 className="w-6 h-6" />
          <h2>Affiliate Program</h2>
          <span className={`program-status ${program?.isActive ? 'active' : 'inactive'}`}>
            {program?.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="header-actions">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="date-range-select"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button className="btn-refresh" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Add Affiliate
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px'
        }}>
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>Error:</strong> {error}
            <button 
              onClick={() => setError(null)} 
              style={{ marginLeft: '12px', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: 'white' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {programStats && (
        <div className="affiliate-stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">
              <Users className="w-5 h-5" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{programStats.activeAffiliates}</span>
              <span className="stat-label">Active Affiliates</span>
              <span className="stat-sub">{programStats.pendingAffiliates} pending</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{formatNumber(programStats.totalClicks)}</span>
              <span className="stat-label">Total Clicks</span>
              <span className="stat-sub trend-up">+12.5% this month</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{formatCurrency(programStats.totalRevenue)}</span>
              <span className="stat-label">Total Revenue</span>
              <span className="stat-sub">{formatNumber(programStats.totalSales)} sales</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{formatCurrency(programStats.totalCommissionPaid)}</span>
              <span className="stat-label">Commission Paid</span>
              <span className="stat-sub">{formatCurrency(programStats.pendingCommission)} pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="affiliate-tabs">
        <button 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'affiliates' ? 'active' : ''}`}
          onClick={() => setActiveTab('affiliates')}
        >
          <Users className="w-4 h-4" />
          Affiliates
          {programStats?.pendingAffiliates ? (
            <span className="badge">{programStats.pendingAffiliates}</span>
          ) : null}
        </button>
        <button 
          className={`tab ${activeTab === 'referrals' ? 'active' : ''}`}
          onClick={() => setActiveTab('referrals')}
        >
          <Link2 className="w-4 h-4" />
          Referrals
        </button>
        <button 
          className={`tab ${activeTab === 'payouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          <CreditCard className="w-4 h-4" />
          Payouts
        </button>
        <button 
          className={`tab ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          <FileText className="w-4 h-4" />
          Marketing Materials
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="affiliate-content">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-section">
            <div className="dashboard-grid">
              {/* Top Affiliates */}
              <div className="dashboard-card">
                <h3>Top Affiliates</h3>
                <div className="top-affiliates-list">
                  {affiliates
                    .filter(a => a.status === 'active')
                    .sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue)
                    .slice(0, 5)
                    .map((affiliate, index) => (
                      <div key={affiliate.id} className="top-affiliate-item">
                        <span className="rank">#{index + 1}</span>
                        <div className="affiliate-info">
                          <span className="name">{affiliate.name}</span>
                          <span className="company">{affiliate.company}</span>
                        </div>
                        <div className="tier-badge" style={{ backgroundColor: getTierColor(affiliate.tier) + '20', color: getTierColor(affiliate.tier) }}>
                          <Star className="w-3 h-3" />
                          {affiliate.tier}
                        </div>
                        <span className="revenue">{formatCurrency(affiliate.stats.totalRevenue)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Commission Tiers */}
              <div className="dashboard-card">
                <h3>Commission Tiers</h3>
                <div className="tiers-list">
                  {program?.tiers.map(tier => (
                    <div key={tier.tier} className="tier-item">
                      <div className="tier-header">
                        <div className="tier-badge" style={{ backgroundColor: getTierColor(tier.tier) + '20', color: getTierColor(tier.tier) }}>
                          <Award className="w-4 h-4" />
                          {tier.name}
                        </div>
                        <span className="tier-rate">{tier.commissionRate}%</span>
                      </div>
                      <div className="tier-requirements">
                        <span>{tier.minSales} - {tier.maxSales ?? '∞'} sales</span>
                        {tier.bonusRate > 0 && <span className="bonus">+{tier.bonusRate}% bonus</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="dashboard-card wide">
                <h3>Recent Referrals</h3>
                <div className="recent-referrals">
                  {referrals.slice(0, 5).map(referral => (
                    <div key={referral.id} className="referral-item">
                      <div className={`referral-type ${referral.type}`}>
                        {referral.type === 'purchase' && <DollarSign className="w-4 h-4" />}
                        {referral.type === 'signup' && <User className="w-4 h-4" />}
                        {referral.type === 'click' && <Eye className="w-4 h-4" />}
                        {referral.type === 'trial' && <Gift className="w-4 h-4" />}
                      </div>
                      <div className="referral-info">
                        <span className="customer">{referral.customerEmail}</span>
                        <span className="affiliate">via {referral.affiliateName}</span>
                      </div>
                      <span className={`status-badge ${getStatusColor(referral.status)}`}>
                        {referral.status}
                      </span>
                      {referral.amount && (
                        <span className="amount">{formatCurrency(referral.amount)}</span>
                      )}
                      {referral.commission && (
                        <span className="commission">+{formatCurrency(referral.commission)}</span>
                      )}
                      <span className="date">{referral.createdAt.toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Chart Placeholder */}
              <div className="dashboard-card wide">
                <h3>Revenue by Affiliate (Last 30 Days)</h3>
                <div className="chart-placeholder">
                  <BarChart3 className="w-12 h-12 opacity-30" />
                  <span>Chart visualization coming soon</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Affiliates Tab */}
        {activeTab === 'affiliates' && (
          <div className="affiliates-section">
            {/* Filters */}
            <div className="affiliates-filters">
              <div className="search-box">
                <Search className="w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search affiliates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              <select 
                value={filterTier} 
                onChange={(e) => setFilterTier(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="diamond">Diamond</option>
              </select>
            </div>

            {/* Affiliates List */}
            <div className="affiliates-list">
              {filteredAffiliates.map(affiliate => (
                <div key={affiliate.id} className="affiliate-card">
                  <div className="affiliate-header" onClick={() => setExpandedAffiliate(expandedAffiliate === affiliate.id ? null : affiliate.id)}>
                    <div className="affiliate-basic">
                      <div className="avatar">
                        {affiliate.name.charAt(0)}
                      </div>
                      <div className="affiliate-info">
                        <span className="name">{affiliate.name}</span>
                        <span className="email">{affiliate.email}</span>
                        {affiliate.company && <span className="company">{affiliate.company}</span>}
                      </div>
                    </div>
                    <div className="affiliate-badges">
                      <span className={`status-badge ${getStatusColor(affiliate.status)}`}>
                        {affiliate.status}
                      </span>
                      <div className="tier-badge" style={{ backgroundColor: getTierColor(affiliate.tier) + '20', color: getTierColor(affiliate.tier) }}>
                        <Award className="w-3 h-3" />
                        {affiliate.tier}
                      </div>
                    </div>
                    <div className="affiliate-stats-summary">
                      <div className="stat">
                        <span className="value">{formatNumber(affiliate.stats.totalClicks)}</span>
                        <span className="label">Clicks</span>
                      </div>
                      <div className="stat">
                        <span className="value">{affiliate.stats.totalSales}</span>
                        <span className="label">Sales</span>
                      </div>
                      <div className="stat">
                        <span className="value">{formatCurrency(affiliate.stats.totalCommission)}</span>
                        <span className="label">Commission</span>
                      </div>
                    </div>
                    {expandedAffiliate === affiliate.id ? 
                      <ChevronUp className="w-5 h-5" /> : 
                      <ChevronDown className="w-5 h-5" />
                    }
                  </div>

                  {expandedAffiliate === affiliate.id && (
                    <div className="affiliate-details">
                      {/* Referral Link */}
                      <div className="referral-link-section">
                        <h4>Referral Link</h4>
                        <div className="link-box">
                          <Link2 className="w-4 h-4" />
                          <input type="text" value={affiliate.referralLink} readOnly />
                          <button className="btn-icon" onClick={() => copyToClipboard(affiliate.referralLink)}>
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="code-box">
                          <span>Code: <strong>{affiliate.referralCode}</strong></span>
                          <button className="btn-icon" onClick={() => copyToClipboard(affiliate.referralCode)}>
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Detailed Stats */}
                      <div className="stats-grid">
                        <div className="stat-box">
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                          <div className="stat-info">
                            <span className="value">{affiliate.stats.conversionRate}%</span>
                            <span className="label">Conversion Rate</span>
                          </div>
                        </div>
                        <div className="stat-box">
                          <DollarSign className="w-5 h-5 text-green-500" />
                          <div className="stat-info">
                            <span className="value">{formatCurrency(affiliate.stats.avgOrderValue)}</span>
                            <span className="label">Avg Order Value</span>
                          </div>
                        </div>
                        <div className="stat-box">
                          <Wallet className="w-5 h-5 text-purple-500" />
                          <div className="stat-info">
                            <span className="value">{formatCurrency(affiliate.stats.pendingCommission)}</span>
                            <span className="label">Pending Commission</span>
                          </div>
                        </div>
                        <div className="stat-box">
                          <Users className="w-5 h-5 text-orange-500" />
                          <div className="stat-info">
                            <span className="value">{formatCurrency(affiliate.stats.lifetimeValue)}</span>
                            <span className="label">Lifetime Value</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="payment-info-section">
                        <h4>Payment Information</h4>
                        <div className="payment-details">
                          <span><strong>Method:</strong> {affiliate.paymentInfo.method}</span>
                          {affiliate.paymentInfo.paypalEmail && (
                            <span><strong>PayPal:</strong> {affiliate.paymentInfo.paypalEmail}</span>
                          )}
                          <span><strong>Min Payout:</strong> {formatCurrency(affiliate.paymentInfo.minimumPayout)}</span>
                          <span><strong>Frequency:</strong> {affiliate.paymentInfo.payoutFrequency}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="affiliate-actions">
                        {affiliate.status === 'pending' && (
                          <>
                            <button className="btn-success" onClick={() => handleApproveAffiliate(affiliate.id)}>
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button className="btn-danger" onClick={() => handleSuspendAffiliate(affiliate.id)}>
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                        {affiliate.status === 'active' && (
                          <>
                            <button className="btn-primary" onClick={() => handleProcessPayout(affiliate.id)}>
                              <Send className="w-4 h-4" />
                              Process Payout
                            </button>
                            <button className="btn-secondary">
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button className="btn-secondary">
                              <Mail className="w-4 h-4" />
                              Contact
                            </button>
                            <button className="btn-danger" onClick={() => handleSuspendAffiliate(affiliate.id)}>
                              <AlertTriangle className="w-4 h-4" />
                              Suspend
                            </button>
                          </>
                        )}
                        {affiliate.status === 'suspended' && (
                          <button className="btn-success" onClick={() => handleApproveAffiliate(affiliate.id)}>
                            <CheckCircle className="w-4 h-4" />
                            Reactivate
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="referrals-section">
            <div className="referrals-table">
              <table>
                <thead>
                  <tr>
                    <th>Affiliate</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Commission</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map(referral => (
                    <tr key={referral.id}>
                      <td>{referral.affiliateName}</td>
                      <td>{referral.customerEmail}</td>
                      <td>
                        <span className={`type-badge ${referral.type}`}>{referral.type}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusColor(referral.status)}`}>
                          {referral.status}
                        </span>
                      </td>
                      <td>{referral.plan || '-'}</td>
                      <td>{referral.amount ? formatCurrency(referral.amount) : '-'}</td>
                      <td>{referral.commission ? formatCurrency(referral.commission) : '-'}</td>
                      <td>{referral.createdAt.toLocaleDateString()}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          {referral.status === 'pending' && (
                            <>
                              <button className="btn-icon success" title="Approve">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button className="btn-icon danger" title="Reject">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <div className="payouts-section">
            <div className="payouts-summary">
              <div className="summary-card">
                <DollarSign className="w-6 h-6 text-green-500" />
                <div>
                  <span className="value">{formatCurrency(programStats?.pendingCommission || 0)}</span>
                  <span className="label">Pending Payouts</span>
                </div>
              </div>
              <button className="btn-primary">
                <Send className="w-4 h-4" />
                Process All Pending
              </button>
            </div>

            <div className="payouts-table">
              <table>
                <thead>
                  <tr>
                    <th>Affiliate</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Processed</th>
                    <th>Transaction ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(payout => (
                    <tr key={payout.id}>
                      <td>{payout.affiliateName}</td>
                      <td className="amount">{formatCurrency(payout.amount, payout.currency)}</td>
                      <td>{payout.method}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                      </td>
                      <td>{payout.createdAt.toLocaleDateString()}</td>
                      <td>{payout.processedAt?.toLocaleDateString() || '-'}</td>
                      <td className="transaction-id">{payout.transactionId || '-'}</td>
                      <td>
                        <div className="table-actions">
                          {payout.status === 'pending' && (
                            <button className="btn-icon success" title="Process">
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button className="btn-icon" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Marketing Materials Tab */}
        {activeTab === 'materials' && (
          <div className="materials-section">
            <div className="materials-header">
              <h3>Marketing Materials</h3>
              <button className="btn-primary">
                <Plus className="w-4 h-4" />
                Upload Material
              </button>
            </div>

            <div className="materials-grid">
              {/* Banners */}
              <div className="material-category">
                <h4>Banner Ads</h4>
                <div className="materials-list">
                  {[
                    { name: 'Banner 728x90', size: '728x90', downloads: 234 },
                    { name: 'Banner 300x250', size: '300x250', downloads: 189 },
                    { name: 'Banner 160x600', size: '160x600', downloads: 145 },
                    { name: 'Banner 320x50', size: '320x50 (Mobile)', downloads: 98 },
                  ].map((banner, idx) => (
                    <div key={idx} className="material-item">
                      <div className="material-preview banner">
                        <span>{banner.size}</span>
                      </div>
                      <div className="material-info">
                        <span className="name">{banner.name}</span>
                        <span className="downloads">{banner.downloads} downloads</span>
                      </div>
                      <button className="btn-secondary">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Templates */}
              <div className="material-category">
                <h4>Email Templates</h4>
                <div className="materials-list">
                  {[
                    { name: 'Product Launch', type: 'HTML', downloads: 156 },
                    { name: 'Discount Offer', type: 'HTML', downloads: 203 },
                    { name: 'Feature Highlight', type: 'HTML', downloads: 87 },
                  ].map((template, idx) => (
                    <div key={idx} className="material-item">
                      <div className="material-preview email">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div className="material-info">
                        <span className="name">{template.name}</span>
                        <span className="type">{template.type}</span>
                        <span className="downloads">{template.downloads} downloads</span>
                      </div>
                      <button className="btn-secondary">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Videos */}
              <div className="material-category">
                <h4>Promotional Videos</h4>
                <div className="materials-list">
                  {[
                    { name: '30s Product Demo', duration: '0:30', downloads: 67 },
                    { name: '60s Feature Overview', duration: '1:00', downloads: 45 },
                  ].map((video, idx) => (
                    <div key={idx} className="material-item">
                      <div className="material-preview video">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div className="material-info">
                        <span className="name">{video.name}</span>
                        <span className="duration">{video.duration}</span>
                        <span className="downloads">{video.downloads} downloads</span>
                      </div>
                      <button className="btn-secondary">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && program && (
          <div className="settings-section">
            <div className="settings-card">
              <h3>Program Settings</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Program Name</label>
                  <input type="text" defaultValue={program.name} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea defaultValue={program.description} rows={3} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Cookie Duration (days)</label>
                    <input type="number" defaultValue={program.cookieDuration} />
                  </div>
                  <div className="form-group">
                    <label>Default Commission Rate (%)</label>
                    <input type="number" defaultValue={program.defaultCommissionRate} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Minimum Payout</label>
                    <input type="number" defaultValue={program.minimumPayout} />
                  </div>
                  <div className="form-group">
                    <label>Payout Frequency</label>
                    <select defaultValue={program.payoutFrequency}>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked={program.isActive} />
                    Program Active
                  </label>
                </div>
              </div>
            </div>

            <div className="settings-card">
              <h3>Commission Tiers</h3>
              <div className="tiers-settings">
                {program.tiers.map((tier, idx) => (
                  <div key={idx} className="tier-setting-item">
                    <div className="tier-header">
                      <div className="tier-badge" style={{ backgroundColor: getTierColor(tier.tier) + '20', color: getTierColor(tier.tier) }}>
                        <Award className="w-4 h-4" />
                        {tier.name}
                      </div>
                    </div>
                    <div className="tier-inputs">
                      <div className="input-group">
                        <label>Min Sales</label>
                        <input type="number" defaultValue={tier.minSales} />
                      </div>
                      <div className="input-group">
                        <label>Max Sales</label>
                        <input type="number" defaultValue={tier.maxSales || ''} placeholder="∞" />
                      </div>
                      <div className="input-group">
                        <label>Commission %</label>
                        <input type="number" defaultValue={tier.commissionRate} />
                      </div>
                      <div className="input-group">
                        <label>Bonus %</label>
                        <input type="number" defaultValue={tier.bonusRate} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-card">
              <h3>Program Rules</h3>
              <div className="rules-list">
                {program.rules.map((rule, idx) => (
                  <div key={idx} className="rule-item">
                    <span className="rule-number">{idx + 1}</span>
                    <input type="text" defaultValue={rule} />
                    <button className="btn-icon danger">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button className="btn-secondary">
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn-secondary">Cancel</button>
              <button className="btn-primary">Save Settings</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Affiliate Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Affiliate</h3>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newAffiliate.email}
                  onChange={(e) => setNewAffiliate(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="affiliate@example.com"
                />
              </div>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newAffiliate.name}
                  onChange={(e) => setNewAffiliate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  value={newAffiliate.company}
                  onChange={(e) => setNewAffiliate(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Company Name"
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={newAffiliate.website}
                  onChange={(e) => setNewAffiliate(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              <div className="form-group">
                <label>Starting Tier</label>
                <select
                  value={newAffiliate.tier}
                  onChange={(e) => setNewAffiliate(prev => ({ ...prev, tier: e.target.value as typeof newAffiliate.tier }))}
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                  <option value="diamond">Diamond</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <Plus className="w-4 h-4" />
                Add Affiliate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateManager;
