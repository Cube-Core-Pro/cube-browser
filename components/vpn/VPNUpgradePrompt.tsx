// ============================================================================
// CUBE Nexum Elite - VPN Upgrade Prompt Component
// ============================================================================
// Beautiful upgrade UI with PureVPN affiliate integration
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  vpnAffiliateService,
  VPNUpgradePrompt as UpgradePromptData,
  PureVPNAffiliateInfo,
} from '../../lib/services/vpnAffiliateService';
import { logger } from '@/lib/services/logger-service';
import './VPNUpgradePrompt.css';

const log = logger.scope('VPNUpgradePrompt');

// ============================================================================
// Types
// ============================================================================

interface VPNUpgradePromptProps {
  licenseTier: 'free' | 'pro' | 'elite';
  onClose?: () => void;
  onUpgrade?: (tier: 'pro' | 'elite' | 'purevpn') => void;
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const VPNUpgradePrompt: React.FC<VPNUpgradePromptProps> = ({
  licenseTier,
  onClose,
  onUpgrade,
  compact = false,
}) => {
  const [promptData, setPromptData] = useState<UpgradePromptData | null>(null);
  const [affiliateInfo, setAffiliateInfo] = useState<PureVPNAffiliateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [prompt, affiliate] = await Promise.all([
          vpnAffiliateService.getUpgradePrompt(licenseTier),
          vpnAffiliateService.getAffiliateInfo(),
        ]);

        setPromptData(prompt);
        setAffiliateInfo(affiliate);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [licenseTier]);

  const handlePureVPNClick = useCallback(async () => {
    try {
      await vpnAffiliateService.openAffiliate('upgrade_prompt');
      if (onUpgrade) {
        onUpgrade('purevpn');
      }
    } catch (err) {
      log.error('Failed to open affiliate link:', err);
    }
  }, [onUpgrade]);

  const handleCubeUpgrade = useCallback((tier: 'pro' | 'elite') => {
    if (onUpgrade) {
      onUpgrade(tier);
    }
  }, [onUpgrade]);

  if (loading) {
    return (
      <div className="vpn-upgrade-prompt loading">
        <div className="loading-spinner" />
        <span>Loading VPN options...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vpn-upgrade-prompt error">
        <span className="error-icon">⚠️</span>
        <span>{error}</span>
      </div>
    );
  }

  if (!promptData || !promptData.showPrompt) {
    return null;
  }

  if (compact) {
    return (
      <div className="vpn-upgrade-prompt compact">
        <div className="compact-content">
          <span className="compact-icon">🔒</span>
          <span className="compact-text">Upgrade for VPN access</span>
          <button
            className="compact-button"
            onClick={() => handleCubeUpgrade('pro')}
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vpn-upgrade-prompt">
      {onClose && (
        <button className="close-button" onClick={onClose} aria-label="Close">
          ×
        </button>
      )}

      <div className="prompt-header">
        <h2>{promptData.title}</h2>
        <p>{promptData.message}</p>
      </div>

      <div className="upgrade-options">
        {/* CUBE Pro Option */}
        {licenseTier === 'free' && (
          <div className="upgrade-card cube-pro">
            <div className="card-badge">Recommended</div>
            <h3>CUBE Pro</h3>
            <div className="card-price">
              <span className="price">$9.99</span>
              <span className="period">/month</span>
            </div>
            <ul className="features-list">
              {promptData.cubeProFeatures.map((feature, index) => (
                <li key={index}>
                  <span className="check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className="upgrade-button pro"
              onClick={() => handleCubeUpgrade('pro')}
            >
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* CUBE Elite Option */}
        {(licenseTier === 'free' || licenseTier === 'pro') && (
          <div className="upgrade-card cube-elite">
            <div className="card-badge premium">Best Value</div>
            <h3>CUBE Elite</h3>
            <div className="card-price">
              <span className="price">$19.99</span>
              <span className="period">/month</span>
            </div>
            <ul className="features-list">
              {promptData.cubeEliteFeatures.map((feature, index) => (
                <li key={index}>
                  <span className="check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className="upgrade-button elite"
              onClick={() => handleCubeUpgrade('elite')}
            >
              Upgrade to Elite
            </button>
          </div>
        )}

        {/* PureVPN Option */}
        {affiliateInfo && (
          <div className="upgrade-card purevpn">
            <div className="card-badge affiliate">
              {affiliateInfo.discountPercent}% OFF
            </div>
            <div className="purevpn-logo">
              <span className="logo-text">PureVPN</span>
              <span className="partner-badge">Partner</span>
            </div>
            <div className="card-price">
              <span className="price-original">${affiliateInfo.monthlyPriceUsd}</span>
              <span className="price">${affiliateInfo.yearlyPriceUsd}</span>
              <span className="period">/month (billed yearly)</span>
            </div>
            <ul className="features-list purevpn-features">
              {promptData.purevpnFeatures.slice(0, 7).map((feature, index) => (
                <li key={index}>
                  <span className="check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="promo-code">
              Use code: <strong>{affiliateInfo.promoCode}</strong>
            </div>
            <button
              className="upgrade-button purevpn-btn"
              onClick={handlePureVPNClick}
            >
              Get PureVPN ({affiliateInfo.discountPercent}% Off)
            </button>
            <p className="money-back">
              💰 {affiliateInfo.moneyBackDays}-Day Money Back Guarantee
            </p>
          </div>
        )}
      </div>

      {affiliateInfo && (
        <div className="affiliate-benefits">
          <h4>Why PureVPN?</h4>
          <div className="benefits-grid">
            {affiliateInfo.benefits.slice(0, 6).map((benefit, index) => (
              <div key={index} className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Mini VPN Upgrade Banner
// ============================================================================

interface VPNUpgradeBannerProps {
  licenseTier: 'free' | 'pro' | 'elite';
  onUpgrade?: () => void;
}

export const VPNUpgradeBanner: React.FC<VPNUpgradeBannerProps> = ({
  licenseTier,
  onUpgrade,
}) => {
  const [affiliateInfo, setAffiliateInfo] = useState<PureVPNAffiliateInfo | null>(null);

  useEffect(() => {
    vpnAffiliateService.getAffiliateInfo().then(setAffiliateInfo).catch(log.error);
  }, []);

  const handleClick = useCallback(async () => {
    await vpnAffiliateService.trackClick('banner');
    if (onUpgrade) {
      onUpgrade();
    }
  }, [onUpgrade]);

  if (licenseTier === 'elite') {
    return null;
  }

  return (
    <div className="vpn-upgrade-banner" onClick={handleClick}>
      <div className="banner-content">
        <span className="banner-icon">🔐</span>
        <span className="banner-text">
          {licenseTier === 'free'
            ? 'Unlock VPN Protection with CUBE Pro'
            : 'Get Premium VPN with PureVPN'}
        </span>
        {affiliateInfo && licenseTier === 'pro' && (
          <span className="banner-discount">
            {affiliateInfo.discountPercent}% OFF
          </span>
        )}
      </div>
      <span className="banner-arrow">→</span>
    </div>
  );
};

// ============================================================================
// PureVPN Feature Card
// ============================================================================

export const PureVPNFeatureCard: React.FC = () => {
  const [affiliateInfo, setAffiliateInfo] = useState<PureVPNAffiliateInfo | null>(null);

  useEffect(() => {
    vpnAffiliateService.getAffiliateInfo().then(setAffiliateInfo).catch(log.error);
  }, []);

  const handleGetPureVPN = useCallback(async () => {
    await vpnAffiliateService.openAffiliate('feature_card');
  }, []);

  if (!affiliateInfo) {
    return null;
  }

  return (
    <div className="purevpn-feature-card">
      <div className="card-header">
        <div className="purevpn-branding">
          <span className="brand-name">PureVPN</span>
          <span className="discount-badge">{affiliateInfo.discountPercent}% OFF</span>
        </div>
        <p className="card-subtitle">Premium VPN Partner</p>
      </div>

      <div className="card-stats">
        <div className="stat">
          <span className="stat-value">6500+</span>
          <span className="stat-label">Servers</span>
        </div>
        <div className="stat">
          <span className="stat-value">78</span>
          <span className="stat-label">Countries</span>
        </div>
        <div className="stat">
          <span className="stat-value">10</span>
          <span className="stat-label">Devices</span>
        </div>
      </div>

      <div className="card-features">
        {affiliateInfo.benefits.slice(0, 4).map((benefit, index) => (
          <div key={index} className="feature-row">
            <span className="feature-check">✓</span>
            <span>{benefit}</span>
          </div>
        ))}
      </div>

      <div className="card-pricing">
        <div className="pricing-row">
          <span className="original-price">${affiliateInfo.monthlyPriceUsd}/mo</span>
          <span className="current-price">${affiliateInfo.yearlyPriceUsd}/mo</span>
        </div>
        <span className="billing-note">Billed yearly • {affiliateInfo.moneyBackDays}-day money-back</span>
      </div>

      <button className="get-purevpn-btn" onClick={handleGetPureVPN}>
        Get PureVPN Now
      </button>

      <p className="promo-hint">
        Use code <strong>{affiliateInfo.promoCode}</strong> at checkout
      </p>
    </div>
  );
};

export default VPNUpgradePrompt;
