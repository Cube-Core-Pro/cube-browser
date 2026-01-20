/**
 * Affiliate & Referral Service - CUBE AI Ecosystem
 * 
 * Complete affiliate management system with:
 * - Multi-tier commission structure
 * - White-label program
 * - Real-time tracking
 * - Automated payouts
 * - Marketing materials
 * 
 * @module AffiliateService
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('AffiliateService');

// ============================================
// Types & Interfaces
// ============================================

export type AffiliateTier = 'starter' | 'professional' | 'elite' | 'enterprise';
export type CommissionType = 'signup' | 'subscription' | 'renewal' | 'upgrade' | 'investment';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AffiliateProfile {
  id: string;
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  website?: string;
  tier: AffiliateTier;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  referralCode: string;
  customDomain?: string; // For white-label
  brandingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Stats
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  lifetimeValue: number;
  
  // Payment info
  payoutMethod: 'paypal' | 'stripe' | 'bank' | 'crypto';
  payoutDetails: PayoutDetails;
  minimumPayout: number;
}

export interface PayoutDetails {
  paypalEmail?: string;
  stripeAccountId?: string;
  bankAccount?: BankAccountDetails;
  cryptoWallet?: CryptoWalletDetails;
}

export interface BankAccountDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode?: string;
  iban?: string;
}

export interface CryptoWalletDetails {
  currency: 'BTC' | 'ETH' | 'USDC' | 'USDT';
  walletAddress: string;
  network?: string;
}

export interface Referral {
  id: string;
  affiliateId: string;
  referredUserId: string;
  referredEmail: string;
  source: string;
  landingPage?: string;
  utmCampaign?: string;
  utmSource?: string;
  utmMedium?: string;
  status: 'clicked' | 'signed_up' | 'trial' | 'converted' | 'churned';
  subscriptionTier?: string;
  subscriptionValue: number;
  totalCommissions: number;
  createdAt: Date;
  convertedAt?: Date;
}

export interface Commission {
  id: string;
  affiliateId: string;
  referralId: string;
  type: CommissionType;
  amount: number;
  rate: number; // Percentage
  baseAmount: number; // What the commission was calculated from
  currency: 'USD';
  status: 'pending' | 'approved' | 'paid' | 'reversed';
  payoutId?: string;
  description: string;
  createdAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
}

export interface Payout {
  id: string;
  affiliateId: string;
  amount: number;
  currency: 'USD';
  method: 'paypal' | 'stripe' | 'bank' | 'crypto';
  status: PayoutStatus;
  transactionId?: string;
  commissionIds: string[];
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
}

export interface WhiteLabelConfig {
  affiliateId: string;
  enabled: boolean;
  
  // Branding
  companyName: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  
  // Domain
  customDomain?: string;
  subdomain?: string; // affiliate.cubeai.tools
  
  // Content
  customTerms?: string;
  customPrivacy?: string;
  supportEmail: string;
  supportUrl?: string;
  
  // Features
  hideOriginalBranding: boolean;
  customPricing?: PricingOverride[];
  
  // Commission override for their sub-affiliates
  subAffiliateEnabled: boolean;
  subAffiliateCommission: number;
}

export interface PricingOverride {
  tierId: string;
  monthlyPrice: number;
  yearlyPrice: number;
  margin: number; // Affiliate's profit margin
}

export interface AffiliateDashboardStats {
  // Overview
  totalEarnings: number;
  pendingEarnings: number;
  availableForPayout: number;
  lifetimeValue: number;
  
  // Referrals
  totalClicks: number;
  totalSignups: number;
  totalConversions: number;
  conversionRate: number;
  
  // Performance
  earningsThisMonth: number;
  earningsLastMonth: number;
  growthRate: number;
  
  // Charts
  earningsHistory: { date: string; amount: number }[];
  referralsHistory: { date: string; count: number }[];
  topSources: { source: string; count: number; earnings: number }[];
}

// ============================================
// Commission Tiers Configuration
// ============================================

export const AFFILIATE_TIERS = {
  starter: {
    name: 'Starter Affiliate',
    minReferrals: 0,
    commissionRates: {
      signup: 0, // No signup bonus
      subscription: 20, // 20% of subscription
      renewal: 10, // 10% on renewals
      upgrade: 15, // 15% on upgrades
      investment: 1, // 1% of investment (requires approval)
    },
    recurringMonths: 6, // Earn recurring for 6 months
    minimumPayout: 100,
    payoutFrequency: 'monthly',
    benefits: [
      'Basic tracking dashboard',
      'Standard affiliate links',
      'Email support',
      'Marketing materials kit'
    ],
  },
  professional: {
    name: 'Professional Affiliate',
    minReferrals: 10,
    commissionRates: {
      signup: 25, // $25 signup bonus
      subscription: 30, // 30% of subscription
      renewal: 15, // 15% on renewals
      upgrade: 20, // 20% on upgrades
      investment: 2, // 2% of investment
    },
    recurringMonths: 12,
    minimumPayout: 50,
    payoutFrequency: 'bi-weekly',
    benefits: [
      'All Starter benefits',
      'Priority support',
      'Custom landing pages',
      'Sub-affiliate program',
      'API access',
      'Weekly payouts option'
    ],
  },
  elite: {
    name: 'Elite Partner',
    minReferrals: 50,
    commissionRates: {
      signup: 50, // $50 signup bonus
      subscription: 40, // 40% of subscription
      renewal: 25, // 25% on renewals
      upgrade: 30, // 30% on upgrades
      investment: 3, // 3% of investment
    },
    recurringMonths: 24, // 2 years of recurring
    minimumPayout: 25,
    payoutFrequency: 'weekly',
    benefits: [
      'All Professional benefits',
      'White-label option',
      'Dedicated account manager',
      'Custom commission rates',
      'Co-marketing opportunities',
      'Revenue sharing deals',
      'Beta access to new products'
    ],
  },
  enterprise: {
    name: 'Enterprise Partner',
    minReferrals: 200,
    commissionRates: {
      signup: 100, // $100 signup bonus
      subscription: 50, // 50% of subscription
      renewal: 35, // 35% lifetime renewals
      upgrade: 40, // 40% on upgrades
      investment: 5, // 5% of investment
    },
    recurringMonths: -1, // Lifetime recurring
    minimumPayout: 0, // No minimum
    payoutFrequency: 'on-demand',
    benefits: [
      'All Elite benefits',
      'Full white-label platform',
      'Custom domain support',
      'API white-label',
      'Custom contracts',
      'Volume bonuses',
      'Equity consideration',
      'Board advisor potential'
    ],
  },
};

// ============================================
// Affiliate Service Implementation
// ============================================

export const AffiliateService = {
  /**
   * Create a new affiliate account
   */
  async createAffiliate(data: Partial<AffiliateProfile>): Promise<AffiliateProfile> {
    try {
      log.info('Creating new affiliate', { email: data.email });

      const affiliate: AffiliateProfile = {
        id: crypto.randomUUID(),
        email: data.email || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        company: data.company,
        website: data.website,
        tier: 'starter',
        status: 'pending',
        referralCode: this.generateReferralCode(),
        brandingEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
        lifetimeValue: 0,
        payoutMethod: 'paypal',
        payoutDetails: {},
        minimumPayout: AFFILIATE_TIERS.starter.minimumPayout,
      };

      await invoke('create_affiliate', { affiliate });
      
      log.info('Affiliate created', { affiliateId: affiliate.id });
      return affiliate;
    } catch (error) {
      log.error('Failed to create affiliate', error);
      throw error;
    }
  },

  /**
   * Generate unique referral code
   */
  generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /**
   * Generate affiliate link
   */
  generateAffiliateLink(
    referralCode: string, 
    options?: {
      campaign?: string;
      source?: string;
      landingPage?: string;
    }
  ): string {
    const baseUrl = 'https://cubeai.tools';
    const params = new URLSearchParams();
    params.set('ref', referralCode);
    
    if (options?.campaign) params.set('utm_campaign', options.campaign);
    if (options?.source) params.set('utm_source', options.source);
    
    const path = options?.landingPage || '/';
    return `${baseUrl}${path}?${params.toString()}`;
  },

  /**
   * Track referral click
   */
  async trackClick(
    referralCode: string,
    metadata: {
      ip?: string;
      userAgent?: string;
      source?: string;
      landingPage?: string;
      utmParams?: Record<string, string>;
    }
  ): Promise<string> {
    try {
      log.debug('Tracking click', { referralCode });

      const clickId = await invoke<string>('track_affiliate_click', {
        referralCode,
        metadata,
      });

      return clickId;
    } catch (error) {
      log.error('Failed to track click', error);
      throw error;
    }
  },

  /**
   * Convert click to referral on signup
   */
  async convertToReferral(
    clickId: string,
    userId: string,
    email: string
  ): Promise<Referral> {
    try {
      log.info('Converting click to referral', { clickId, userId });

      const referral = await invoke<Referral>('convert_to_referral', {
        clickId,
        userId,
        email,
      });

      return referral;
    } catch (error) {
      log.error('Failed to convert referral', error);
      throw error;
    }
  },

  /**
   * Track subscription and create commission
   */
  async trackSubscription(
    referralId: string,
    subscriptionData: {
      tier: string;
      amount: number;
      billingCycle: 'monthly' | 'yearly';
      isUpgrade?: boolean;
      isRenewal?: boolean;
    }
  ): Promise<Commission> {
    try {
      log.info('Tracking subscription for commission', { referralId, subscriptionData });

      // Get referral and affiliate
      const referral = await invoke<Referral>('get_referral', { referralId });
      const affiliate = await invoke<AffiliateProfile>('get_affiliate', { 
        affiliateId: referral.affiliateId 
      });

      // Determine commission type and rate
      const tierConfig = AFFILIATE_TIERS[affiliate.tier];
      let commissionType: CommissionType = 'subscription';
      let rate = tierConfig.commissionRates.subscription;

      if (subscriptionData.isRenewal) {
        commissionType = 'renewal';
        rate = tierConfig.commissionRates.renewal;
      } else if (subscriptionData.isUpgrade) {
        commissionType = 'upgrade';
        rate = tierConfig.commissionRates.upgrade;
      }

      // Calculate commission
      const commissionAmount = (subscriptionData.amount * rate) / 100;

      const commission: Commission = {
        id: crypto.randomUUID(),
        affiliateId: affiliate.id,
        referralId,
        type: commissionType,
        amount: commissionAmount,
        rate,
        baseAmount: subscriptionData.amount,
        currency: 'USD',
        status: 'pending',
        description: `${commissionType} commission for ${subscriptionData.tier} (${subscriptionData.billingCycle})`,
        createdAt: new Date(),
      };

      await invoke('create_commission', { commission });

      log.info('Commission created', { commissionId: commission.id, amount: commission.amount });
      return commission;
    } catch (error) {
      log.error('Failed to track subscription', error);
      throw error;
    }
  },

  /**
   * Get affiliate dashboard statistics
   */
  async getDashboardStats(affiliateId: string): Promise<AffiliateDashboardStats> {
    try {
      return await invoke<AffiliateDashboardStats>('get_affiliate_dashboard', { affiliateId });
    } catch (error) {
      log.error('Failed to get dashboard stats', error);
      throw error;
    }
  },

  /**
   * Request payout
   */
  async requestPayout(affiliateId: string): Promise<Payout> {
    try {
      log.info('Requesting payout', { affiliateId });

      const affiliate = await invoke<AffiliateProfile>('get_affiliate', { affiliateId });

      if (affiliate.pendingEarnings < affiliate.minimumPayout) {
        throw new Error(`Minimum payout is $${affiliate.minimumPayout}. Current pending: $${affiliate.pendingEarnings}`);
      }

      const payout = await invoke<Payout>('create_payout', { affiliateId });
      
      log.info('Payout requested', { payoutId: payout.id, amount: payout.amount });
      return payout;
    } catch (error) {
      log.error('Failed to request payout', error);
      throw error;
    }
  },

  /**
   * Process payouts (admin function)
   */
  async processPayouts(): Promise<void> {
    try {
      log.info('Processing payouts');
      await invoke('process_affiliate_payouts');
    } catch (error) {
      log.error('Failed to process payouts', error);
      throw error;
    }
  },

  /**
   * Upgrade affiliate tier based on performance
   */
  async checkTierUpgrade(affiliateId: string): Promise<AffiliateTier | null> {
    try {
      const affiliate = await invoke<AffiliateProfile>('get_affiliate', { affiliateId });

      // Check each tier from highest to lowest
      const tiers: AffiliateTier[] = ['enterprise', 'elite', 'professional', 'starter'];
      
      for (const tier of tiers) {
        if (affiliate.totalReferrals >= AFFILIATE_TIERS[tier].minReferrals) {
          if (tier !== affiliate.tier) {
            await invoke('upgrade_affiliate_tier', { affiliateId, newTier: tier });
            log.info('Affiliate upgraded', { affiliateId, newTier: tier });
            return tier;
          }
          break;
        }
      }

      return null;
    } catch (error) {
      log.error('Failed to check tier upgrade', error);
      throw error;
    }
  },

  // ==========================================
  // White-Label Functions
  // ==========================================

  /**
   * Enable white-label for affiliate
   */
  async enableWhiteLabel(
    affiliateId: string,
    config: Partial<WhiteLabelConfig>
  ): Promise<WhiteLabelConfig> {
    try {
      log.info('Enabling white-label', { affiliateId });

      // Verify affiliate is eligible (elite or enterprise tier)
      const affiliate = await invoke<AffiliateProfile>('get_affiliate', { affiliateId });
      
      if (!['elite', 'enterprise'].includes(affiliate.tier)) {
        throw new Error('White-label is only available for Elite and Enterprise affiliates');
      }

      const whiteLabelConfig: WhiteLabelConfig = {
        affiliateId,
        enabled: true,
        companyName: config.companyName || affiliate.company || 'Partner',
        logo: config.logo,
        favicon: config.favicon,
        primaryColor: config.primaryColor || '#3b82f6',
        secondaryColor: config.secondaryColor || '#8b5cf6',
        customDomain: config.customDomain,
        subdomain: config.subdomain || `${affiliate.referralCode.toLowerCase()}.cubeai.tools`,
        supportEmail: config.supportEmail || affiliate.email,
        supportUrl: config.supportUrl,
        hideOriginalBranding: config.hideOriginalBranding || false,
        customPricing: config.customPricing,
        subAffiliateEnabled: config.subAffiliateEnabled || false,
        subAffiliateCommission: config.subAffiliateCommission || 10,
      };

      await invoke('save_whitelabel_config', { config: whiteLabelConfig });
      
      // Update affiliate profile
      await invoke('update_affiliate', { 
        affiliateId, 
        updates: { 
          brandingEnabled: true,
          customDomain: whiteLabelConfig.customDomain || whiteLabelConfig.subdomain,
        } 
      });

      log.info('White-label enabled', { affiliateId, subdomain: whiteLabelConfig.subdomain });
      return whiteLabelConfig;
    } catch (error) {
      log.error('Failed to enable white-label', error);
      throw error;
    }
  },

  /**
   * Get white-label configuration
   */
  async getWhiteLabelConfig(affiliateId: string): Promise<WhiteLabelConfig | null> {
    try {
      return await invoke<WhiteLabelConfig | null>('get_whitelabel_config', { affiliateId });
    } catch (error) {
      log.error('Failed to get white-label config', error);
      return null;
    }
  },

  /**
   * Update white-label configuration
   */
  async updateWhiteLabelConfig(
    affiliateId: string,
    updates: Partial<WhiteLabelConfig>
  ): Promise<WhiteLabelConfig> {
    try {
      log.info('Updating white-label config', { affiliateId });
      return await invoke<WhiteLabelConfig>('update_whitelabel_config', { 
        affiliateId, 
        updates 
      });
    } catch (error) {
      log.error('Failed to update white-label config', error);
      throw error;
    }
  },

  /**
   * Verify custom domain
   */
  async verifyCustomDomain(affiliateId: string, domain: string): Promise<boolean> {
    try {
      log.info('Verifying custom domain', { affiliateId, domain });
      return await invoke<boolean>('verify_custom_domain', { affiliateId, domain });
    } catch (error) {
      log.error('Failed to verify domain', error);
      throw error;
    }
  },

  // ==========================================
  // Marketing Materials
  // ==========================================

  /**
   * Get marketing materials for affiliate
   */
  async getMarketingMaterials(affiliateId: string): Promise<MarketingMaterial[]> {
    try {
      return await invoke<MarketingMaterial[]>('get_marketing_materials', { affiliateId });
    } catch (error) {
      log.error('Failed to get marketing materials', error);
      throw error;
    }
  },

  /**
   * Get pre-built landing page templates
   */
  async getLandingPageTemplates(): Promise<LandingPageTemplate[]> {
    try {
      return await invoke<LandingPageTemplate[]>('get_landing_templates');
    } catch (error) {
      log.error('Failed to get landing templates', error);
      throw error;
    }
  },
};

// ============================================
// Supporting Types
// ============================================

export interface MarketingMaterial {
  id: string;
  type: 'banner' | 'email' | 'social' | 'video' | 'landing';
  name: string;
  description: string;
  thumbnailUrl: string;
  downloadUrl: string;
  sizes?: string[];
  format: string;
  createdAt: Date;
}

export interface LandingPageTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  category: 'general' | 'business' | 'tech' | 'finance';
  conversionRate: number;
  features: string[];
}

export default AffiliateService;
