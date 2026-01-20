'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Coins, TrendingUp, Lock, Unlock, Clock, Gift,
  Shield, Zap, ArrowRight, Check, Info, Wallet,
  PiggyBank, BadgePercent, Calculator, RefreshCw
} from 'lucide-react';
import './staking.css';

// ============================================
// Types
// ============================================

interface StakingTier {
  name: string;
  minAmount: number;
  apy: number;
  discount: number;
  lockPeriod: number;
  benefits: string[];
  color: string;
}

interface StakingPosition {
  id: string;
  amount: number;
  tier: string;
  startDate: string;
  unlockDate: string;
  earnedRewards: number;
  status: 'active' | 'unlocking' | 'completed';
}

interface StakingStats {
  totalStaked: number;
  totalRewards: number;
  currentTier: string;
  availableToStake: number;
  positions: StakingPosition[];
}

// ============================================
// Data
// ============================================

const STAKING_TIERS: StakingTier[] = [
  {
    name: 'Bronze',
    minAmount: 10000,
    apy: 8,
    discount: 10,
    lockPeriod: 30,
    benefits: ['10% fee discount', '8% APY rewards', 'Basic governance'],
    color: '#cd7f32'
  },
  {
    name: 'Silver',
    minAmount: 50000,
    apy: 10,
    discount: 25,
    lockPeriod: 90,
    benefits: ['25% fee discount', '10% APY rewards', 'Enhanced governance', 'Early access'],
    color: '#c0c0c0'
  },
  {
    name: 'Gold',
    minAmount: 100000,
    apy: 12,
    discount: 35,
    lockPeriod: 180,
    benefits: ['35% fee discount', '12% APY rewards', 'Full governance', 'Beta features', 'Priority support'],
    color: '#ffd700'
  },
  {
    name: 'Platinum',
    minAmount: 500000,
    apy: 15,
    discount: 50,
    lockPeriod: 365,
    benefits: ['50% fee discount', '15% APY rewards', 'VIP governance', 'Exclusive features', 'Dedicated support', 'Investor calls'],
    color: '#e5e4e2'
  }
];

// ============================================
// Helper Functions
// ============================================

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
};

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(num);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getDaysRemaining = (unlockDate: string): number => {
  const now = new Date();
  const unlock = new Date(unlockDate);
  const diff = unlock.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ============================================
// Main Component
// ============================================

export default function StakingPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StakingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState<StakingTier | null>(null);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'stake' | 'positions'>('overview');

  useEffect(() => {
    loadStakingData();
  }, []);

  const loadStakingData = async () => {
    setLoading(true);
    try {
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setStats({
        totalStaked: 75000,
        totalRewards: 2340.50,
        currentTier: 'Silver',
        availableToStake: 25000,
        positions: [
          {
            id: '1',
            amount: 50000,
            tier: 'Silver',
            startDate: '2025-10-01',
            unlockDate: '2026-01-01',
            earnedRewards: 1250.00,
            status: 'active'
          },
          {
            id: '2',
            amount: 25000,
            tier: 'Bronze',
            startDate: '2025-12-01',
            unlockDate: '2026-01-01',
            earnedRewards: 166.67,
            status: 'active'
          }
        ]
      });
    } catch (error) {
      console.error('Failed to load staking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRewards = (amount: number, tier: StakingTier): number => {
    const annualReward = amount * (tier.apy / 100);
    const periodReward = annualReward * (tier.lockPeriod / 365);
    return periodReward;
  };

  const handleStake = async () => {
    if (!selectedTier || !stakeAmount) return;
    
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount < selectedTier.minAmount) return;
    
    try {
      // Mock staking operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowStakeModal(false);
      setStakeAmount('');
      setSelectedTier(null);
      loadStakingData();
    } catch (error) {
      console.error('Failed to stake:', error);
    }
  };

  const currentTierData = STAKING_TIERS.find(t => t.name === stats?.currentTier);

  if (loading) {
    return (
      <div className="staking-page">
        <div className="loading-container">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p>Loading staking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staking-page">
      {/* Header */}
      <header className="staking-header">
        <div className="header-content">
          <div className="header-title">
            <Coins className="w-10 h-10" />
            <div>
              <h1>CUBEX Staking</h1>
              <p>Stake your tokens to earn rewards and unlock benefits</p>
            </div>
          </div>
          <button 
            className="btn-primary"
            onClick={() => setShowStakeModal(true)}
          >
            <PiggyBank className="w-5 h-5" /> Stake CUBEX
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Lock className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Staked</span>
              <span className="stat-value">{formatNumber(stats?.totalStaked || 0)} CUBEX</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon rewards">
              <Gift className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-label">Rewards Earned</span>
              <span className="stat-value">{formatNumber(stats?.totalRewards || 0)} CUBEX</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon tier" style={{ background: `${currentTierData?.color}20`, color: currentTierData?.color }}>
              <Shield className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-label">Current Tier</span>
              <span className="stat-value" style={{ color: currentTierData?.color }}>{stats?.currentTier || 'None'}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon available">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="stat-info">
              <span className="stat-label">Available to Stake</span>
              <span className="stat-value">{formatNumber(stats?.availableToStake || 0)} CUBEX</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <nav className="staking-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp className="w-4 h-4" /> Overview
        </button>
        <button 
          className={`tab ${activeTab === 'stake' ? 'active' : ''}`}
          onClick={() => setActiveTab('stake')}
        >
          <PiggyBank className="w-4 h-4" /> Stake
        </button>
        <button 
          className={`tab ${activeTab === 'positions' ? 'active' : ''}`}
          onClick={() => setActiveTab('positions')}
        >
          <Lock className="w-4 h-4" /> My Positions
        </button>
      </nav>

      {/* Content */}
      <main className="staking-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Tiers Grid */}
            <div className="tiers-section">
              <h2>Staking Tiers</h2>
              <p className="section-subtitle">Choose a tier based on your stake amount</p>
              
              <div className="tiers-grid">
                {STAKING_TIERS.map((tier) => (
                  <div 
                    key={tier.name} 
                    className={`tier-card ${stats?.currentTier === tier.name ? 'current' : ''}`}
                    style={{ '--tier-color': tier.color } as React.CSSProperties}
                  >
                    <div className="tier-header">
                      <div className="tier-badge" style={{ background: tier.color }}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <h3>{tier.name}</h3>
                      {stats?.currentTier === tier.name && (
                        <span className="current-badge">Current</span>
                      )}
                    </div>
                    
                    <div className="tier-amount">
                      <span className="amount">{formatNumber(tier.minAmount)}</span>
                      <span className="currency">CUBEX min</span>
                    </div>
                    
                    <div className="tier-stats">
                      <div className="tier-stat">
                        <TrendingUp className="w-4 h-4" />
                        <span>{tier.apy}% APY</span>
                      </div>
                      <div className="tier-stat">
                        <BadgePercent className="w-4 h-4" />
                        <span>{tier.discount}% Discount</span>
                      </div>
                      <div className="tier-stat">
                        <Clock className="w-4 h-4" />
                        <span>{tier.lockPeriod} Days Lock</span>
                      </div>
                    </div>
                    
                    <ul className="tier-benefits">
                      {tier.benefits.map((benefit, i) => (
                        <li key={i}>
                          <Check className="w-4 h-4" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    
                    <button 
                      className="btn-tier"
                      onClick={() => {
                        setSelectedTier(tier);
                        setShowStakeModal(true);
                      }}
                    >
                      Stake for {tier.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="how-it-works">
              <h2>How Staking Works</h2>
              <div className="steps-grid">
                <div className="step">
                  <div className="step-number">1</div>
                  <h4>Choose Amount</h4>
                  <p>Select how many CUBEX tokens you want to stake based on tier requirements</p>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <h4>Lock Period</h4>
                  <p>Your tokens are locked for the tier&apos;s duration, earning rewards daily</p>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <h4>Earn Rewards</h4>
                  <p>Receive APY rewards and unlock platform discounts and benefits</p>
                </div>
                <div className="step">
                  <div className="step-number">4</div>
                  <h4>Claim or Restake</h4>
                  <p>After unlock, claim rewards or restake for compound growth</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stake' && (
          <div className="stake-content">
            <div className="stake-calculator">
              <h2><Calculator className="w-6 h-6" /> Staking Calculator</h2>
              
              <div className="calculator-form">
                <div className="form-group">
                  <label>Amount to Stake</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                    <span className="input-suffix">CUBEX</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Select Tier</label>
                  <div className="tier-selector">
                    {STAKING_TIERS.map((tier) => (
                      <button
                        key={tier.name}
                        className={`tier-option ${selectedTier?.name === tier.name ? 'selected' : ''}`}
                        onClick={() => setSelectedTier(tier)}
                        style={{ '--tier-color': tier.color } as React.CSSProperties}
                      >
                        <span className="tier-name">{tier.name}</span>
                        <span className="tier-apy">{tier.apy}% APY</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {stakeAmount && selectedTier && (
                  <div className="calculation-results">
                    <h3>Estimated Returns</h3>
                    <div className="results-grid">
                      <div className="result-item">
                        <span className="result-label">Lock Period</span>
                        <span className="result-value">{selectedTier.lockPeriod} days</span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">APY Rate</span>
                        <span className="result-value">{selectedTier.apy}%</span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Period Rewards</span>
                        <span className="result-value highlight">
                          +{formatNumber(calculateRewards(parseFloat(stakeAmount), selectedTier))} CUBEX
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="result-label">Fee Discount</span>
                        <span className="result-value">{selectedTier.discount}% off</span>
                      </div>
                    </div>
                    
                    <button className="btn-stake" onClick={() => setShowStakeModal(true)}>
                      Stake {formatNumber(parseFloat(stakeAmount))} CUBEX
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="positions-content">
            <h2>My Staking Positions</h2>
            
            {stats?.positions && stats.positions.length > 0 ? (
              <div className="positions-list">
                {stats.positions.map((position) => {
                  const tierData = STAKING_TIERS.find(t => t.name === position.tier);
                  const daysRemaining = getDaysRemaining(position.unlockDate);
                  
                  return (
                    <div key={position.id} className="position-card">
                      <div className="position-header">
                        <div className="position-tier">
                          <Shield 
                            className="w-5 h-5" 
                            style={{ color: tierData?.color }} 
                          />
                          <span style={{ color: tierData?.color }}>{position.tier}</span>
                        </div>
                        <span className={`position-status ${position.status}`}>
                          {position.status === 'active' && <Lock className="w-3 h-3" />}
                          {position.status === 'unlocking' && <Unlock className="w-3 h-3" />}
                          {position.status === 'completed' && <Check className="w-3 h-3" />}
                          {position.status.charAt(0).toUpperCase() + position.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="position-amount">
                        <span className="amount">{formatNumber(position.amount)}</span>
                        <span className="currency">CUBEX Staked</span>
                      </div>
                      
                      <div className="position-details">
                        <div className="detail">
                          <span className="detail-label">Start Date</span>
                          <span className="detail-value">{formatDate(position.startDate)}</span>
                        </div>
                        <div className="detail">
                          <span className="detail-label">Unlock Date</span>
                          <span className="detail-value">{formatDate(position.unlockDate)}</span>
                        </div>
                        <div className="detail">
                          <span className="detail-label">Days Remaining</span>
                          <span className="detail-value">{daysRemaining} days</span>
                        </div>
                        <div className="detail highlight">
                          <span className="detail-label">Rewards Earned</span>
                          <span className="detail-value">+{formatNumber(position.earnedRewards)} CUBEX</span>
                        </div>
                      </div>
                      
                      <div className="position-progress">
                        <div 
                          className="progress-bar"
                          style={{ 
                            width: `${Math.min(100, ((tierData?.lockPeriod || 30) - daysRemaining) / (tierData?.lockPeriod || 30) * 100)}%`,
                            background: tierData?.color
                          }}
                        />
                      </div>
                      
                      {position.status === 'active' && daysRemaining === 0 && (
                        <button className="btn-claim">
                          <Gift className="w-4 h-4" /> Claim Rewards
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-positions">
                <PiggyBank className="w-12 h-12" />
                <h3>No Active Positions</h3>
                <p>Start staking CUBEX to earn rewards and unlock benefits</p>
                <button 
                  className="btn-primary"
                  onClick={() => setActiveTab('stake')}
                >
                  Start Staking
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Stake Modal */}
      {showStakeModal && selectedTier && (
        <div className="modal-overlay" onClick={() => setShowStakeModal(false)}>
          <div className="stake-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Stake CUBEX</h2>
              <button className="close-btn" onClick={() => setShowStakeModal(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="selected-tier" style={{ '--tier-color': selectedTier.color } as React.CSSProperties}>
                <Shield className="w-8 h-8" style={{ color: selectedTier.color }} />
                <div>
                  <h3>{selectedTier.name} Tier</h3>
                  <p>{selectedTier.apy}% APY • {selectedTier.lockPeriod} days lock</p>
                </div>
              </div>
              
              <div className="form-group">
                <label>Amount to Stake</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder={`Min ${formatNumber(selectedTier.minAmount)}`}
                    min={selectedTier.minAmount}
                  />
                  <span className="input-suffix">CUBEX</span>
                </div>
                <span className="input-hint">
                  Available: {formatNumber(stats?.availableToStake || 0)} CUBEX
                </span>
              </div>
              
              <div className="stake-summary">
                <div className="summary-row">
                  <span>Lock Period</span>
                  <span>{selectedTier.lockPeriod} days</span>
                </div>
                <div className="summary-row">
                  <span>APY Rate</span>
                  <span>{selectedTier.apy}%</span>
                </div>
                <div className="summary-row">
                  <span>Estimated Rewards</span>
                  <span className="highlight">
                    +{stakeAmount ? formatNumber(calculateRewards(parseFloat(stakeAmount), selectedTier)) : '0'} CUBEX
                  </span>
                </div>
                <div className="summary-row">
                  <span>Fee Discount</span>
                  <span>{selectedTier.discount}%</span>
                </div>
              </div>
              
              <div className="modal-warning">
                <Info className="w-4 h-4" />
                <p>
                  Your tokens will be locked for {selectedTier.lockPeriod} days. 
                  Early unstaking is not available.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowStakeModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleStake}
                disabled={!stakeAmount || parseFloat(stakeAmount) < selectedTier.minAmount}
              >
                Confirm Stake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
