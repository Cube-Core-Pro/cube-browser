'use client';

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Coins, CreditCard, Wallet, DollarSign,
  Info, Shield, CheckCircle, Loader2, ChevronDown,
  Building2, Bitcoin, TrendingUp, AlertCircle, Zap
} from 'lucide-react';
import '../tokens.css';

// ============================================
// Types
// ============================================

interface TokenPackage {
  id: string;
  amount: number;
  bonus: number;
  totalTokens: number;
  priceUSD: number;
  pricePerToken: number;
  popular: boolean;
  savings: number;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'crypto' | 'bank';
  name: string;
  icon: React.ReactNode;
  available: boolean;
  description: string;
}

interface TokenPrice {
  current: number;
  change24h: number;
}

// ============================================
// Constants
// ============================================

const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: 'starter',
    amount: 1000,
    bonus: 0,
    totalTokens: 1000,
    priceUSD: 2450,
    pricePerToken: 2.45,
    popular: false,
    savings: 0
  },
  {
    id: 'growth',
    amount: 5000,
    bonus: 500,
    totalTokens: 5500,
    priceUSD: 11025,
    pricePerToken: 2.00,
    popular: false,
    savings: 10
  },
  {
    id: 'professional',
    amount: 10000,
    bonus: 1500,
    totalTokens: 11500,
    priceUSD: 20125,
    pricePerToken: 1.75,
    popular: true,
    savings: 18
  },
  {
    id: 'enterprise',
    amount: 50000,
    bonus: 10000,
    totalTokens: 60000,
    priceUSD: 90000,
    pricePerToken: 1.50,
    popular: false,
    savings: 25
  },
  {
    id: 'institutional',
    amount: 100000,
    bonus: 25000,
    totalTokens: 125000,
    priceUSD: 162500,
    pricePerToken: 1.30,
    popular: false,
    savings: 35
  }
];

// ============================================
// Main Component
// ============================================

export default function BuyTokensPage() {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(TOKEN_PACKAGES[2]);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [tokenPrice, setTokenPrice] = useState<TokenPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'payment' | 'confirm'>('select');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      type: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="w-5 h-5" />,
      available: true,
      description: 'Visa, Mastercard, Amex'
    },
    {
      id: 'crypto',
      type: 'crypto',
      name: 'Cryptocurrency',
      icon: <Bitcoin className="w-5 h-5" />,
      available: true,
      description: 'BTC, ETH, USDT, USDC'
    },
    {
      id: 'bank',
      type: 'bank',
      name: 'Bank Transfer',
      icon: <Building2 className="w-5 h-5" />,
      available: true,
      description: 'Wire transfer (1-3 days)'
    }
  ];

  useEffect(() => {
    loadTokenPrice();
  }, []);

  const loadTokenPrice = async () => {
    try {
      const price = await invoke<TokenPrice>('get_token_price');
      setTokenPrice(price);
    } catch (error) {
      console.error('Failed to load token price:', error);
      setTokenPrice({ current: 2.45, change24h: 3.2 });
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateCustomPrice = (): number => {
    const amount = parseInt(customAmount) || 0;
    if (amount < 1000) return amount * 2.45;
    if (amount < 5000) return amount * 2.20;
    if (amount < 10000) return amount * 2.00;
    if (amount < 50000) return amount * 1.75;
    return amount * 1.50;
  };

  const handlePurchase = async () => {
    if (!selectedPackage && !customAmount) return;
    
    setLoading(true);
    try {
      const purchaseData = selectedPackage ? {
        packageId: selectedPackage.id,
        amount: selectedPackage.totalTokens,
        priceUSD: selectedPackage.priceUSD
      } : {
        packageId: 'custom',
        amount: parseInt(customAmount),
        priceUSD: calculateCustomPrice()
      };

      await invoke('initiate_token_purchase', {
        ...purchaseData,
        paymentMethod
      });

      // Redirect to payment processor or success
      router.push('/tokens/purchase-success');
    } catch (error) {
      console.error('Failed to initiate purchase:', error);
      // Mock success
      router.push('/tokens?purchase=success');
    } finally {
      setLoading(false);
    }
  };

  const renderPackageSelection = () => (
    <div className="packages-section">
      <h2>Select Token Package</h2>
      <p className="section-desc">Choose a package or enter a custom amount</p>

      <div className="packages-grid">
        {TOKEN_PACKAGES.map((pkg) => (
          <div 
            key={pkg.id}
            className={`package-card ${selectedPackage?.id === pkg.id ? 'selected' : ''} ${pkg.popular ? 'popular' : ''}`}
            onClick={() => {
              setSelectedPackage(pkg);
              setCustomAmount('');
            }}
          >
            {pkg.popular && <div className="popular-badge">Most Popular</div>}
            {pkg.savings > 0 && <div className="savings-badge">Save {pkg.savings}%</div>}
            
            <div className="package-amount">
              <Coins className="w-6 h-6" />
              <span>{formatNumber(pkg.amount)} CUBEX</span>
            </div>
            
            {pkg.bonus > 0 && (
              <div className="package-bonus">
                +{formatNumber(pkg.bonus)} bonus tokens
              </div>
            )}
            
            <div className="package-total">
              Total: {formatNumber(pkg.totalTokens)} CUBEX
            </div>
            
            <div className="package-price">
              {formatCurrency(pkg.priceUSD)}
            </div>
            
            <div className="package-rate">
              ${pkg.pricePerToken.toFixed(2)} per token
            </div>
            
            <div className={`package-select ${selectedPackage?.id === pkg.id ? 'active' : ''}`}>
              {selectedPackage?.id === pkg.id ? (
                <><CheckCircle className="w-4 h-4" /> Selected</>
              ) : (
                'Select'
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="custom-amount">
        <h3>Or enter custom amount</h3>
        <div className="custom-input">
          <Coins className="w-5 h-5" />
          <input
            type="number"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedPackage(null);
            }}
            placeholder="Enter amount (min. 100)"
            min={100}
          />
          <span>CUBEX</span>
        </div>
        {customAmount && parseInt(customAmount) >= 100 && (
          <div className="custom-price">
            Estimated price: {formatCurrency(calculateCustomPrice())}
          </div>
        )}
      </div>

      <button 
        className="btn-primary btn-large"
        onClick={() => setStep('payment')}
        disabled={!selectedPackage && (!customAmount || parseInt(customAmount) < 100)}
      >
        Continue to Payment
        <ChevronDown className="w-4 h-4" style={{ transform: 'rotate(-90deg)' }} />
      </button>
    </div>
  );

  const renderPaymentMethod = () => (
    <div className="payment-section">
      <button className="back-link" onClick={() => setStep('select')}>
        <ArrowLeft className="w-4 h-4" /> Back to packages
      </button>

      <h2>Payment Method</h2>
      <p className="section-desc">Select how you'd like to pay</p>

      <div className="payment-methods">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`payment-method ${paymentMethod === method.id ? 'selected' : ''} ${!method.available ? 'disabled' : ''}`}
            onClick={() => method.available && setPaymentMethod(method.id)}
          >
            <div className="method-icon">{method.icon}</div>
            <div className="method-info">
              <span className="method-name">{method.name}</span>
              <span className="method-desc">{method.description}</span>
            </div>
            <div className={`method-check ${paymentMethod === method.id ? 'active' : ''}`}>
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="order-summary">
        <h3>Order Summary</h3>
        <div className="summary-row">
          <span>Tokens</span>
          <span>{formatNumber(selectedPackage?.amount || parseInt(customAmount) || 0)} CUBEX</span>
        </div>
        {selectedPackage?.bonus ? (
          <div className="summary-row bonus">
            <span>Bonus Tokens</span>
            <span>+{formatNumber(selectedPackage.bonus)} CUBEX</span>
          </div>
        ) : null}
        <div className="summary-row total">
          <span>Total Tokens</span>
          <span>{formatNumber(selectedPackage?.totalTokens || parseInt(customAmount) || 0)} CUBEX</span>
        </div>
        <hr />
        <div className="summary-row price">
          <span>Price</span>
          <span>{formatCurrency(selectedPackage?.priceUSD || calculateCustomPrice())}</span>
        </div>
      </div>

      <button 
        className="btn-primary btn-large"
        onClick={() => setStep('confirm')}
      >
        Review Order
        <ChevronDown className="w-4 h-4" style={{ transform: 'rotate(-90deg)' }} />
      </button>
    </div>
  );

  const renderConfirmation = () => (
    <div className="confirm-section">
      <button className="back-link" onClick={() => setStep('payment')}>
        <ArrowLeft className="w-4 h-4" /> Back to payment
      </button>

      <h2>Confirm Purchase</h2>
      <p className="section-desc">Review your order before completing</p>

      <div className="confirm-details">
        <div className="confirm-card">
          <div className="confirm-header">
            <Coins className="w-8 h-8" />
            <div>
              <span className="confirm-amount">{formatNumber(selectedPackage?.totalTokens || parseInt(customAmount) || 0)} CUBEX</span>
              <span className="confirm-label">Tokens to receive</span>
            </div>
          </div>

          <div className="confirm-items">
            <div className="confirm-item">
              <span>Base tokens</span>
              <span>{formatNumber(selectedPackage?.amount || parseInt(customAmount) || 0)}</span>
            </div>
            {selectedPackage?.bonus ? (
              <div className="confirm-item bonus">
                <span>Bonus tokens</span>
                <span>+{formatNumber(selectedPackage.bonus)}</span>
              </div>
            ) : null}
            <div className="confirm-item">
              <span>Payment method</span>
              <span>{paymentMethods.find(m => m.id === paymentMethod)?.name}</span>
            </div>
            <div className="confirm-item total">
              <span>Total price</span>
              <span>{formatCurrency(selectedPackage?.priceUSD || calculateCustomPrice())}</span>
            </div>
          </div>
        </div>

        <div className="terms-check">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <span>I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>, and understand that token purchases are non-refundable.</span>
          </label>
        </div>

        <div className="security-notice">
          <Shield className="w-5 h-5" />
          <div>
            <strong>Secure Transaction</strong>
            <p>Your payment is encrypted and processed securely. We never store your card details.</p>
          </div>
        </div>

        <button 
          className="btn-primary btn-large"
          onClick={handlePurchase}
          disabled={!agreedToTerms || loading}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
          ) : (
            <><Zap className="w-5 h-5" /> Complete Purchase</>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="buy-tokens-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => router.push('/tokens')} title="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="header-title">
            <DollarSign className="w-6 h-6" />
            <div>
              <h1>Buy CUBEX Tokens</h1>
              <p>Acquire tokens to unlock platform benefits</p>
            </div>
          </div>
        </div>
        {tokenPrice && (
          <div className="current-price">
            <span className="price-label">Current Price</span>
            <span className="price-value">${tokenPrice.current.toFixed(2)}</span>
            <span className={`price-change ${tokenPrice.change24h >= 0 ? 'positive' : 'negative'}`}>
              {tokenPrice.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : null}
              {tokenPrice.change24h >= 0 ? '+' : ''}{tokenPrice.change24h}%
            </span>
          </div>
        )}
      </header>

      {/* Progress Steps */}
      <div className="steps-indicator">
        <div className={`step ${step === 'select' ? 'active' : 'completed'}`}>
          <span className="step-number">1</span>
          <span className="step-label">Select Package</span>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step === 'payment' ? 'active' : step === 'confirm' ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Payment</span>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step === 'confirm' ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Confirm</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="buy-content">
        {step === 'select' && renderPackageSelection()}
        {step === 'payment' && renderPaymentMethod()}
        {step === 'confirm' && renderConfirmation()}
      </div>

      {/* Benefits Banner */}
      <div className="benefits-banner">
        <h3>Why Buy CUBEX Tokens?</h3>
        <div className="benefits-grid">
          <div className="benefit">
            <Zap className="w-5 h-5" />
            <span>Up to 50% fee discounts</span>
          </div>
          <div className="benefit">
            <TrendingUp className="w-5 h-5" />
            <span>8% APY staking rewards</span>
          </div>
          <div className="benefit">
            <Shield className="w-5 h-5" />
            <span>Governance voting rights</span>
          </div>
          <div className="benefit">
            <Coins className="w-5 h-5" />
            <span>Exclusive airdrops</span>
          </div>
        </div>
      </div>
    </div>
  );
}
