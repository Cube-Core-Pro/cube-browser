/**
 * Investor Service - CUBE AI Ecosystem
 * 
 * Manages investor accounts, smart contracts, token distribution,
 * and ROI calculations for the CUBE investment platform.
 * 
 * Features:
 * - CUBE Token (CUBEX) for investment tracking
 * - Smart contract-based investment agreements
 * - Automated ROI distribution
 * - Multi-tier investment levels
 * - Portfolio management
 * 
 * @module InvestorService
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('InvestorService');

// ============================================
// Types & Interfaces
// ============================================

export type InvestmentTier = 'angel' | 'seed' | 'strategic' | 'institutional';
export type InvestmentStatus = 'pending' | 'active' | 'matured' | 'withdrawn';
export type PayoutFrequency = 'monthly' | 'quarterly' | 'annually' | 'maturity';

export interface InvestorProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  country: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  accreditedInvestor: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalInvested: number;
  totalReturns: number;
  cubeTokenBalance: number;
  tier: InvestmentTier;
  referralCode: string;
  referredBy?: string;
}

export interface Investment {
  id: string;
  investorId: string;
  contractId: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'BTC' | 'ETH' | 'USDC';
  cubeTokensIssued: number;
  tier: InvestmentTier;
  status: InvestmentStatus;
  interestRate: number; // Annual percentage
  payoutFrequency: PayoutFrequency;
  lockupPeriodMonths: number;
  startDate: Date;
  maturityDate: Date;
  nextPayoutDate: Date;
  totalPayouts: number;
  products: string[]; // Which CUBE products this investment covers
  benefits: string[];
  createdAt: Date;
}

export interface SmartContract {
  id: string;
  investmentId: string;
  investorId: string;
  contractHash: string; // SHA-256 hash of contract terms
  blockchainTxId?: string; // Optional on-chain reference
  terms: ContractTerms;
  signatures: ContractSignature[];
  status: 'draft' | 'pending_signature' | 'active' | 'completed' | 'terminated';
  createdAt: Date;
  activatedAt?: Date;
  completedAt?: Date;
}

export interface ContractTerms {
  investmentAmount: number;
  currency: string;
  cubeTokens: number;
  interestRate: number;
  payoutSchedule: PayoutScheduleItem[];
  lockupPeriod: number;
  earlyWithdrawalPenalty: number; // Percentage
  productAccess: ProductAccess[];
  specialBenefits: string[];
  governingLaw: string;
  arbitrationClause: string;
}

export interface PayoutScheduleItem {
  date: Date;
  amount: number;
  type: 'interest' | 'principal' | 'bonus';
  status: 'scheduled' | 'paid' | 'pending';
  transactionId?: string;
}

export interface ContractSignature {
  signer: 'investor' | 'company';
  signedAt: Date;
  ipAddress: string;
  signatureHash: string;
}

export interface ProductAccess {
  productId: string;
  productName: string;
  tier: string;
  validUntil: Date;
  features: string[];
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  pendingPayouts: number;
  cubeTokenBalance: number;
  investments: InvestmentSummary[];
  performanceHistory: PerformanceDataPoint[];
}

export interface InvestmentSummary {
  id: string;
  productName: string;
  amount: number;
  returns: number;
  status: InvestmentStatus;
  nextPayout: Date | null;
}

export interface PerformanceDataPoint {
  date: Date;
  value: number;
  returns: number;
}

// ============================================
// Investment Tiers Configuration
// ============================================

export const INVESTMENT_TIERS = {
  angel: {
    name: 'Angel Investor',
    minInvestment: 5000,
    maxInvestment: 25000,
    interestRate: 12, // 12% annual
    lockupPeriod: 12, // 12 months
    payoutFrequency: 'quarterly' as PayoutFrequency,
    cubeTokenMultiplier: 100, // 100 CUBEX per $1
    benefits: [
      'Early access to all CUBE products',
      'Quarterly ROI payments (12% APY)',
      'CUBE Nexum Professional license',
      'Investor community access',
      'Quarterly investor calls',
      'Name in investor credits'
    ],
    productAccess: ['nexum_pro'],
  },
  seed: {
    name: 'Seed Investor',
    minInvestment: 25000,
    maxInvestment: 100000,
    interestRate: 15, // 15% annual
    lockupPeriod: 18, // 18 months
    payoutFrequency: 'quarterly' as PayoutFrequency,
    cubeTokenMultiplier: 120, // 120 CUBEX per $1
    benefits: [
      'All Angel benefits',
      'Higher ROI (15% APY)',
      'CUBE Nexum Enterprise license',
      'CUBE Core early access',
      'Monthly investor updates',
      'Direct founder access',
      'Advisory board consideration'
    ],
    productAccess: ['nexum_enterprise', 'core_preview'],
  },
  strategic: {
    name: 'Strategic Partner',
    minInvestment: 100000,
    maxInvestment: 500000,
    interestRate: 18, // 18% annual
    lockupPeriod: 24, // 24 months
    payoutFrequency: 'monthly' as PayoutFrequency,
    cubeTokenMultiplier: 150, // 150 CUBEX per $1
    benefits: [
      'All Seed benefits',
      'Premium ROI (18% APY)',
      'Monthly dividend payments',
      'Equity consideration',
      'Board observer rights',
      'White-label rights',
      'Revenue sharing option',
      'Custom integration support'
    ],
    productAccess: ['nexum_enterprise', 'core_full', 'finance_preview', 'whitelabel'],
  },
  institutional: {
    name: 'Institutional Investor',
    minInvestment: 500000,
    maxInvestment: 10000000,
    interestRate: 20, // 20% annual + equity
    lockupPeriod: 36, // 36 months
    payoutFrequency: 'monthly' as PayoutFrequency,
    cubeTokenMultiplier: 200, // 200 CUBEX per $1
    benefits: [
      'All Strategic benefits',
      'Maximum ROI (20% APY)',
      'Equity stake included',
      'Board seat (>$1M)',
      'Co-development rights',
      'Geographic exclusivity options',
      'Acquisition preference rights',
      'Custom contract terms'
    ],
    productAccess: ['all_products', 'source_code_access', 'unlimited_whitelabel'],
  },
};

// ============================================
// CUBE Token (CUBEX) Configuration
// ============================================

export const CUBE_TOKEN = {
  symbol: 'CUBEX',
  name: 'CUBE AI Token',
  decimals: 18,
  totalSupply: 100000000, // 100 million tokens
  reservedForInvestors: 40000000, // 40% for investors
  reservedForTeam: 20000000, // 20% for team (vested)
  reservedForOperations: 25000000, // 25% for operations
  reservedForCommunity: 15000000, // 15% for community/affiliates
  
  // Token utility
  utilities: [
    'Governance voting rights',
    'Product access tiers',
    'Fee discounts',
    'Staking rewards',
    'Referral bonuses',
    'Exclusive features'
  ],
};

// ============================================
// Investor Service Implementation
// ============================================

export const InvestorService = {
  /**
   * Create a new investor account
   */
  async createInvestor(data: Partial<InvestorProfile>): Promise<InvestorProfile> {
    try {
      log.info('Creating new investor account', { email: data.email });
      
      const investor: InvestorProfile = {
        id: crypto.randomUUID(),
        email: data.email || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        company: data.company,
        phone: data.phone,
        country: data.country || 'US',
        kycStatus: 'pending',
        accreditedInvestor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalInvested: 0,
        totalReturns: 0,
        cubeTokenBalance: 0,
        tier: 'angel',
        referralCode: this.generateReferralCode(),
        referredBy: data.referredBy,
      };

      // Save to backend
      await invoke('create_investor', { investor });
      
      log.info('Investor account created', { investorId: investor.id });
      return investor;
    } catch (error) {
      log.error('Failed to create investor', error);
      throw error;
    }
  },

  /**
   * Generate unique referral code
   */
  generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'CUBE-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /**
   * Create a new investment with smart contract
   */
  async createInvestment(
    investorId: string,
    amount: number,
    tier: InvestmentTier,
    currency: 'USD' | 'EUR' | 'BTC' | 'ETH' | 'USDC' = 'USD'
  ): Promise<{ investment: Investment; contract: SmartContract }> {
    try {
      const tierConfig = INVESTMENT_TIERS[tier];
      
      // Validate amount
      if (amount < tierConfig.minInvestment || amount > tierConfig.maxInvestment) {
        throw new Error(`Investment amount must be between $${tierConfig.minInvestment} and $${tierConfig.maxInvestment} for ${tier} tier`);
      }

      log.info('Creating investment', { investorId, amount, tier });

      // Calculate CUBE tokens
      const cubeTokens = amount * tierConfig.cubeTokenMultiplier;
      
      // Calculate dates
      const startDate = new Date();
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + tierConfig.lockupPeriod);
      
      const nextPayoutDate = this.calculateNextPayoutDate(startDate, tierConfig.payoutFrequency);

      // Create investment
      const investment: Investment = {
        id: crypto.randomUUID(),
        investorId,
        contractId: '', // Will be set after contract creation
        amount,
        currency,
        cubeTokensIssued: cubeTokens,
        tier,
        status: 'pending',
        interestRate: tierConfig.interestRate,
        payoutFrequency: tierConfig.payoutFrequency,
        lockupPeriodMonths: tierConfig.lockupPeriod,
        startDate,
        maturityDate,
        nextPayoutDate,
        totalPayouts: 0,
        products: tierConfig.productAccess,
        benefits: tierConfig.benefits,
        createdAt: new Date(),
      };

      // Create smart contract
      const contract = await this.createSmartContract(investment);
      investment.contractId = contract.id;

      // Save to backend
      await invoke('create_investment', { investment, contract });

      log.info('Investment created', { investmentId: investment.id, contractId: contract.id });
      return { investment, contract };
    } catch (error) {
      log.error('Failed to create investment', error);
      throw error;
    }
  },

  /**
   * Create smart contract for investment
   */
  async createSmartContract(investment: Investment): Promise<SmartContract> {
    const tierConfig = INVESTMENT_TIERS[investment.tier];
    
    // Generate payout schedule
    const payoutSchedule = this.generatePayoutSchedule(
      investment.amount,
      investment.interestRate,
      investment.startDate,
      investment.maturityDate,
      investment.payoutFrequency
    );

    // Create contract terms
    const terms: ContractTerms = {
      investmentAmount: investment.amount,
      currency: investment.currency,
      cubeTokens: investment.cubeTokensIssued,
      interestRate: investment.interestRate,
      payoutSchedule,
      lockupPeriod: investment.lockupPeriodMonths,
      earlyWithdrawalPenalty: 25, // 25% penalty for early withdrawal
      productAccess: tierConfig.productAccess.map(productId => ({
        productId,
        productName: this.getProductName(productId),
        tier: investment.tier,
        validUntil: investment.maturityDate,
        features: this.getProductFeatures(productId, investment.tier),
      })),
      specialBenefits: tierConfig.benefits,
      governingLaw: 'State of Delaware, USA',
      arbitrationClause: 'Disputes resolved via binding arbitration under AAA rules',
    };

    // Generate contract hash
    const contractHash = await this.hashContractTerms(terms);

    const contract: SmartContract = {
      id: crypto.randomUUID(),
      investmentId: investment.id,
      investorId: investment.investorId,
      contractHash,
      terms,
      signatures: [],
      status: 'draft',
      createdAt: new Date(),
    };

    return contract;
  },

  /**
   * Generate payout schedule based on frequency
   */
  generatePayoutSchedule(
    principal: number,
    annualRate: number,
    startDate: Date,
    maturityDate: Date,
    frequency: PayoutFrequency
  ): PayoutScheduleItem[] {
    const schedule: PayoutScheduleItem[] = [];
    const monthlyRate = annualRate / 12 / 100;
    
    let intervalMonths: number;
    switch (frequency) {
      case 'monthly': intervalMonths = 1; break;
      case 'quarterly': intervalMonths = 3; break;
      case 'annually': intervalMonths = 12; break;
      case 'maturity': intervalMonths = -1; break; // Single payout at end
    }

    if (intervalMonths === -1) {
      // Single payout at maturity
      const totalMonths = Math.round((maturityDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
      const totalInterest = principal * monthlyRate * totalMonths;
      
      schedule.push({
        date: maturityDate,
        amount: principal + totalInterest,
        type: 'principal',
        status: 'scheduled',
      });
    } else {
      // Periodic interest payments
      let currentDate = new Date(startDate);
      currentDate.setMonth(currentDate.getMonth() + intervalMonths);
      
      const interestPerPeriod = principal * monthlyRate * intervalMonths;
      
      while (currentDate < maturityDate) {
        schedule.push({
          date: new Date(currentDate),
          amount: interestPerPeriod,
          type: 'interest',
          status: 'scheduled',
        });
        currentDate.setMonth(currentDate.getMonth() + intervalMonths);
      }
      
      // Final principal + last interest payment
      schedule.push({
        date: maturityDate,
        amount: principal + interestPerPeriod,
        type: 'principal',
        status: 'scheduled',
      });
    }

    return schedule;
  },

  /**
   * Calculate next payout date
   */
  calculateNextPayoutDate(startDate: Date, frequency: PayoutFrequency): Date {
    const next = new Date(startDate);
    switch (frequency) {
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'annually':
        next.setFullYear(next.getFullYear() + 1);
        break;
      case 'maturity':
        // Will be set to maturity date
        break;
    }
    return next;
  },

  /**
   * Hash contract terms for verification
   */
  async hashContractTerms(terms: ContractTerms): Promise<string> {
    const termsString = JSON.stringify(terms, null, 0);
    const encoder = new TextEncoder();
    const data = encoder.encode(termsString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Sign contract (investor or company)
   */
  async signContract(
    contractId: string,
    signer: 'investor' | 'company',
    ipAddress: string
  ): Promise<SmartContract> {
    try {
      log.info('Signing contract', { contractId, signer });

      const signature: ContractSignature = {
        signer,
        signedAt: new Date(),
        ipAddress,
        signatureHash: await this.generateSignatureHash(contractId, signer),
      };

      // Update contract in backend
      const contract = await invoke<SmartContract>('sign_contract', {
        contractId,
        signature,
      });

      // Check if both parties have signed
      if (contract.signatures.length === 2) {
        // Activate contract
        await this.activateContract(contractId);
      }

      return contract;
    } catch (error) {
      log.error('Failed to sign contract', error);
      throw error;
    }
  },

  /**
   * Generate signature hash
   */
  async generateSignatureHash(contractId: string, signer: string): Promise<string> {
    const data = `${contractId}:${signer}:${Date.now()}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Activate contract after both signatures
   */
  async activateContract(contractId: string): Promise<void> {
    try {
      log.info('Activating contract', { contractId });
      
      await invoke('activate_contract', { contractId });
      
      // Issue CUBE tokens to investor
      const contract = await invoke<SmartContract>('get_contract', { contractId });
      await this.issueCubeTokens(contract.investorId, contract.terms.cubeTokens);
      
      log.info('Contract activated and tokens issued', { contractId });
    } catch (error) {
      log.error('Failed to activate contract', error);
      throw error;
    }
  },

  /**
   * Issue CUBE tokens to investor
   */
  async issueCubeTokens(investorId: string, amount: number): Promise<void> {
    try {
      log.info('Issuing CUBE tokens', { investorId, amount });
      await invoke('issue_cube_tokens', { investorId, amount });
    } catch (error) {
      log.error('Failed to issue tokens', error);
      throw error;
    }
  },

  /**
   * Get investor portfolio summary
   */
  async getPortfolioSummary(investorId: string): Promise<PortfolioSummary> {
    try {
      return await invoke<PortfolioSummary>('get_portfolio_summary', { investorId });
    } catch (error) {
      log.error('Failed to get portfolio', error);
      throw error;
    }
  },

  /**
   * Process scheduled payouts
   */
  async processPayouts(): Promise<void> {
    try {
      log.info('Processing scheduled payouts');
      await invoke('process_scheduled_payouts');
    } catch (error) {
      log.error('Failed to process payouts', error);
      throw error;
    }
  },

  /**
   * Get product name from ID
   */
  getProductName(productId: string): string {
    const products: Record<string, string> = {
      'nexum_pro': 'CUBE Nexum Professional',
      'nexum_enterprise': 'CUBE Nexum Enterprise',
      'core_preview': 'CUBE Core (Preview)',
      'core_full': 'CUBE Core (Full Access)',
      'finance_preview': 'CUBE Finance (Preview)',
      'all_products': 'All CUBE Products',
      'whitelabel': 'White-Label Rights',
      'source_code_access': 'Source Code Access',
      'unlimited_whitelabel': 'Unlimited White-Label',
    };
    return products[productId] || productId;
  },

  /**
   * Get product features for tier
   */
  getProductFeatures(productId: string, tier: InvestmentTier): string[] {
    // This would be expanded based on actual product features
    const baseFeatures = ['Full product access', 'Priority support', 'API access'];
    if (tier === 'strategic' || tier === 'institutional') {
      baseFeatures.push('Custom integrations', 'Dedicated account manager');
    }
    return baseFeatures;
  },
};

export default InvestorService;
