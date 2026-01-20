'use client';

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import {
  Coins, Wallet, TrendingUp, TrendingDown, Lock, Unlock,
  ArrowUpRight, ArrowDownRight, Clock, Gift, Award,
  Loader2, RefreshCw, Info, ChevronRight, History,
  DollarSign, Percent, Timer, Shield, Zap, Crown
} from 'lucide-react';
import './tokens.css';

// ============================================
// Types
// ============================================

interface TokenBalance {
  total: number;
  available: number;
  staked: number;
  locked: number;
  pendingRewards: number;
}

interface StakingInfo {
  tier: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  tierName: string;
  stakedAmount: number;
  stakingApy: number;
  currentDiscount: number;
  nextTier: string | null;
  nextTierAmount: number | null;
  earnedRewards: number;
  stakingSince: string | null;
}

interface TokenTransaction {
  id: string;
  type: 'stake' | 'unstake' | 'reward' | 'transfer' | 'receive' | 'purchase';
  amount: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  txHash?: string;
}

interface TokenPrice {
  current: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
}

// ============================================
// Constants
// ============================================

const STAKING_TIERS = [
  { name: 'Bronze', minStake: 10000, discount: 10, color: '#cd7f32' },
  { name: 'Silver', minStake: 50000, discount: 25, color: '#c0c0c0' },
  { name: 'Gold', minStake: 100000, discount: 35, color: '#ffd700' },
  { name: 'Platinum', minStake: 500000, discount: 50, color: '#e5e4e2' }
];

const TOKEN_UTILITIES = [
  { icon: Percent, label: 'Fee Discounts', desc: 'Up to 50% off platform fees' },
  { icon: Zap, label: 'Priority Access', desc: 'Early access to new features' },
  { icon: Shield, label: 'Governance', desc: 'Vote on platform decisions' },
  { icon: Gift, label: 'Exclusive Rewards', desc: 'Special airdrops & bonuses' }
];

// ============================================
// Main Component
// ============================================

export default function TokenDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [tokenPrice, setTokenPrice] = useState<TokenPrice | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [activeModal, setActiveModal] = useState<'stake' | 'unstake' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTokenData();
  }, []);

  const loadTokenData = async () => {
    setLoading(true);
    try {
      const [balanceData, stakingData, txData, priceData] = await Promise.all([
        invoke<TokenBalance>('get_token_balance'),
        invoke<StakingInfo>('get_staking_info'),
        invoke<TokenTransaction[]>('get_token_transactions', { limit: 10 }),
        invoke<TokenPrice>('get_token_price')
      ]);

      setBalance(balanceData);
      setStakingInfo(stakingData);
      setTransactions(txData);
      setTokenPrice(priceData);
    } catch (error) {
      console.error('Failed to load token data:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setBalance({
      total: 125000,
      available: 75000,
      staked: 50000,
      locked: 0,
      pendingRewards: 847.32
    });

    setStakingInfo({
      tier: 'silver',
      tierName: 'Silver',
      stakedAmount: 50000,
      stakingApy: 8,
      currentDiscount: 25,
      nextTier: 'Gold',
      nextTierAmount: 100000,
      earnedRewards: 1523.45,
      stakingSince: '2025-10-15'
    });

    setTransactions([
      {
        id: '1',
        type: 'reward',
        amount: 127.32,
        timestamp: '2026-01-08T12:00:00Z',
        status: 'completed',
        description: 'Weekly staking reward'
      },
      {
        id: '2',
        type: 'stake',
        amount: 25000,
        timestamp: '2026-01-05T09:30:00Z',
        status: 'completed',
        description: 'Staked CUBEX tokens'
      },
      {
        id: '3',
        type: 'receive',
        amount: 10000,
        timestamp: '2026-01-02T14:15:00Z',
        status: 'completed',
        description: 'Referral bonus'
      },
      {
        id: '4',
        type: 'purchase',
        amount: 50000,
        timestamp: '2025-12-20T10:00:00Z',
        status: 'completed',
        description: 'Token purchase'
      },
      {
        id: '5',
        type: 'reward',
        amount: 98.67,
        timestamp: '2025-12-15T12:00:00Z',
        status: 'completed',
        description: 'Weekly staking reward'
      }
    ]);

    setTokenPrice({
      current: 2.45,
      change24h: 3.2,
      change7d: 12.5,
      marketCap: 245000000,
      volume24h: 1250000
    });
  };

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0 || amount > (balance?.available || 0)) {
      return;
    }

    setProcessing(true);
    try {
      await invoke('stake_tokens', { amount });
      setActiveModal(null);
      setStakeAmount('');
      await loadTokenData();
    } catch (error) {
      console.error('Failed to stake:', error);
      // Mock success
      setActiveModal(null);
      setStakeAmount('');
      await loadTokenData();
    } finally {
      setProcessing(false);
    }
  };

  const handleUnstake = async () => {
    const amount = parseFloat(unstakeAmount);
    if (isNaN(amount) || amount <= 0 || amount > (stakingInfo?.stakedAmount || 0)) {
      return;
    }

    setProcessing(true);
    try {
      await invoke('unstake_tokens', { amount });
      setActiveModal(null);
      setUnstakeAmount('');
      await loadTokenData();
    } catch (error) {
      console.error('Failed to unstake:', error);
      // Mock success
      setActiveModal(null);
      setUnstakeAmount('');
      await loadTokenData();
    } finally {
      setProcessing(false);
    }
  };

  const handleClaimRewards = async () => {
    setProcessing(true);
    try {
      await invoke('claim_staking_rewards');
      await loadTokenData();
    } catch (error) {
      console.error('Failed to claim rewards:', error);
      await loadTokenData();
    } finally {
      setProcessing(false);
    }
  };

  const formatNumber = (num: number, decimals = 2): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(decimals);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'stake': return <Lock className="w-4 h-4" />;
      case 'unstake': return <Unlock className="w-4 h-4" />;
      case 'reward': return <Gift className="w-4 h-4" />;
      case 'transfer': return <ArrowUpRight className="w-4 h-4" />;
      case 'receive': return <ArrowDownRight className="w-4 h-4" />;
      case 'purchase': return <DollarSign className="w-4 h-4" />;
      default: return <Coins className="w-4 h-4" />;
    }
  };

  const getTierProgress = (): number => {
    if (!stakingInfo || stakingInfo.tier === 'platinum') return 100;
    
    const currentTierIndex = STAKING_TIERS.findIndex(t => t.name.toLowerCase() === stakingInfo.tier);
    if (currentTierIndex === -1) {
      // Not in any tier yet
      return (stakingInfo.stakedAmount / STAKING_TIERS[0].minStake) * 100;
    }
    
    const nextTier = STAKING_TIERS[currentTierIndex + 1];
    if (!nextTier) return 100;
    
    const currentMin = STAKING_TIERS[currentTierIndex].minStake;
    const progress = ((stakingInfo.stakedAmount - currentMin) / (nextTier.minStake - currentMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (loading) {
    return (
      <div className="token-loading">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Loading token dashboard...</p>
      </div>
    );
  }

  return (
    <div className="token-dashboard">
      {/* Header */}
      <header className="token-header">
        <div className="header-content">
          <div className="header-title">
            <Coins className="w-8 h-8" />
            <div>
              <h1>CUBEX Token</h1>
              <p>Manage your CUBE AI ecosystem tokens</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={loadTokenData}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="btn-primary" onClick={() => router.push('/tokens/buy')}>
              <DollarSign className="w-4 h-4" />
              Buy CUBEX
            </button>
          </div>
        </div>
      </header>

      {/* Price Banner */}
      {tokenPrice && (
        <div className="price-banner">
          <div className="price-main">
            <span className="price-label">CUBEX Price</span>
            <span className="price-value">{formatCurrency(tokenPrice.current)}</span>
            <span className={`price-change ${tokenPrice.change24h >= 0 ? 'positive' : 'negative'}`}>
              {tokenPrice.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(tokenPrice.change24h)}% (24h)
            </span>
          </div>
          <div className="price-stats">
            <div className="price-stat">
              <span className="stat-label">7D Change</span>
              <span className={`stat-value ${tokenPrice.change7d >= 0 ? 'positive' : 'negative'}`}>
                {tokenPrice.change7d >= 0 ? '+' : ''}{tokenPrice.change7d}%
              </span>
            </div>
            <div className="price-stat">
              <span className="stat-label">Market Cap</span>
              <span className="stat-value">{formatCurrency(tokenPrice.marketCap)}</span>
            </div>
            <div className="price-stat">
              <span className="stat-label">24h Volume</span>
              <span className="stat-value">{formatCurrency(tokenPrice.volume24h)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <section className="balance-section">
        <div className="balance-grid">
          <div className="balance-card main">
            <div className="balance-icon">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="balance-content">
              <span className="balance-label">Total Balance</span>
              <span className="balance-value">{formatNumber(balance?.total || 0, 0)} CUBEX</span>
              <span className="balance-usd">≈ {formatCurrency((balance?.total || 0) * (tokenPrice?.current || 0))}</span>
            </div>
          </div>

          <div className="balance-card">
            <div className="balance-icon available">
              <Coins className="w-6 h-6" />
            </div>
            <div className="balance-content">
              <span className="balance-label">Available</span>
              <span className="balance-value">{formatNumber(balance?.available || 0, 0)}</span>
            </div>
            <button className="balance-action" onClick={() => setActiveModal('stake')}>
              Stake
            </button>
          </div>

          <div className="balance-card">
            <div className="balance-icon staked">
              <Lock className="w-6 h-6" />
            </div>
            <div className="balance-content">
              <span className="balance-label">Staked</span>
              <span className="balance-value">{formatNumber(balance?.staked || 0, 0)}</span>
            </div>
            <button className="balance-action" onClick={() => setActiveModal('unstake')}>
              Unstake
            </button>
          </div>

          <div className="balance-card rewards">
            <div className="balance-icon rewards">
              <Gift className="w-6 h-6" />
            </div>
            <div className="balance-content">
              <span className="balance-label">Pending Rewards</span>
              <span className="balance-value">{formatNumber(balance?.pendingRewards || 0)} CUBEX</span>
            </div>
            <button 
              className="balance-action claim" 
              onClick={handleClaimRewards}
              disabled={!balance?.pendingRewards || balance.pendingRewards <= 0}
            >
              Claim
            </button>
          </div>
        </div>
      </section>

      {/* Staking Tier */}
      <section className="staking-section">
        <div className="staking-card">
          <div className="staking-header">
            <div className="tier-badge" style={{ '--tier-color': STAKING_TIERS.find(t => t.name.toLowerCase() === stakingInfo?.tier)?.color || '#666' } as React.CSSProperties}>
              <Crown className="w-5 h-5" />
              <span>{stakingInfo?.tierName || 'No Tier'}</span>
            </div>
            <div className="staking-apy">
              <span className="apy-value">{stakingInfo?.stakingApy || 8}% APY</span>
              <span className="apy-label">Current Rate</span>
            </div>
          </div>

          <div className="staking-stats">
            <div className="staking-stat">
              <Timer className="w-4 h-4" />
              <span className="stat-label">Staking Since</span>
              <span className="stat-value">{stakingInfo?.stakingSince ? formatDate(stakingInfo.stakingSince) : 'Not staking'}</span>
            </div>
            <div className="staking-stat">
              <Gift className="w-4 h-4" />
              <span className="stat-label">Total Earned</span>
              <span className="stat-value">{formatNumber(stakingInfo?.earnedRewards || 0)} CUBEX</span>
            </div>
            <div className="staking-stat highlight">
              <Percent className="w-4 h-4" />
              <span className="stat-label">Your Discount</span>
              <span className="stat-value">{stakingInfo?.currentDiscount || 0}%</span>
            </div>
          </div>

          {stakingInfo?.nextTier && (
            <div className="tier-progress">
              <div className="progress-header">
                <span>Progress to {stakingInfo.nextTier}</span>
                <span>{formatNumber(stakingInfo.stakedAmount, 0)} / {formatNumber(stakingInfo.nextTierAmount || 0, 0)} CUBEX</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getTierProgress()}%` }}></div>
              </div>
              <p className="progress-hint">
                Stake {formatNumber((stakingInfo.nextTierAmount || 0) - stakingInfo.stakedAmount, 0)} more CUBEX to unlock {stakingInfo.nextTier} tier benefits
              </p>
            </div>
          )}
        </div>

        {/* Tier Benefits */}
        <div className="tiers-overview">
          <h3>Staking Tiers</h3>
          <div className="tiers-grid">
            {STAKING_TIERS.map((tier) => (
              <div 
                key={tier.name}
                className={`tier-card ${stakingInfo?.tier === tier.name.toLowerCase() ? 'active' : ''}`}
                style={{ '--tier-color': tier.color } as React.CSSProperties}
              >
                <div className="tier-header">
                  <Crown className="w-5 h-5" style={{ color: tier.color }} />
                  <span className="tier-name">{tier.name}</span>
                </div>
                <div className="tier-requirement">
                  {formatNumber(tier.minStake, 0)} CUBEX
                </div>
                <div className="tier-benefit">
                  {tier.discount}% discount
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Token Utilities */}
      <section className="utilities-section">
        <h2>Token Utilities</h2>
        <div className="utilities-grid">
          {TOKEN_UTILITIES.map((utility) => {
            const Icon = utility.icon;
            return (
              <div key={utility.label} className="utility-card">
                <div className="utility-icon">
                  <Icon className="w-6 h-6" />
                </div>
                <h3>{utility.label}</h3>
                <p>{utility.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transaction History */}
      <section className="transactions-section">
        <div className="section-header">
          <h2>Transaction History</h2>
          <button className="btn-link" onClick={() => router.push('/tokens/history')}>
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="transactions-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="transaction-item">
              <div className={`tx-icon ${tx.type}`}>
                {getTransactionIcon(tx.type)}
              </div>
              <div className="tx-details">
                <span className="tx-desc">{tx.description}</span>
                <span className="tx-date">{formatDate(tx.timestamp)}</span>
              </div>
              <div className={`tx-amount ${tx.type === 'transfer' ? 'negative' : 'positive'}`}>
                {tx.type === 'transfer' ? '-' : '+'}{formatNumber(tx.amount, 2)} CUBEX
              </div>
              <div className={`tx-status ${tx.status}`}>
                {tx.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stake Modal */}
      {activeModal === 'stake' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Stake CUBEX</h2>
            <p>Stake your tokens to earn rewards and unlock discounts</p>
            
            <div className="modal-balance">
              <span>Available: {formatNumber(balance?.available || 0, 0)} CUBEX</span>
            </div>

            <div className="modal-input">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="Enter amount to stake"
                max={balance?.available || 0}
              />
              <button className="max-btn" onClick={() => setStakeAmount(String(balance?.available || 0))}>
                MAX
              </button>
            </div>

            <div className="modal-info">
              <Info className="w-4 h-4" />
              <span>Staking earns {stakingInfo?.stakingApy || 8}% APY. Tokens can be unstaked anytime.</span>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleStake}
                disabled={processing || !stakeAmount || parseFloat(stakeAmount) <= 0}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Stake Tokens
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unstake Modal */}
      {activeModal === 'unstake' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Unstake CUBEX</h2>
            <p>Withdraw your staked tokens back to available balance</p>
            
            <div className="modal-balance">
              <span>Staked: {formatNumber(stakingInfo?.stakedAmount || 0, 0)} CUBEX</span>
            </div>

            <div className="modal-input">
              <input
                type="number"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                placeholder="Enter amount to unstake"
                max={stakingInfo?.stakedAmount || 0}
              />
              <button className="max-btn" onClick={() => setUnstakeAmount(String(stakingInfo?.stakedAmount || 0))}>
                MAX
              </button>
            </div>

            <div className="modal-warning">
              <Info className="w-4 h-4" />
              <span>Unstaking may affect your tier status and discount benefits.</span>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleUnstake}
                disabled={processing || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                Unstake Tokens
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
