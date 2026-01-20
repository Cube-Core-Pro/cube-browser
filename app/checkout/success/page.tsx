/**
 * Checkout Success Page
 * Web-compatible version without Tauri dependencies
 * Route: /checkout/success
 * 
 * This page is shown after successful Stripe checkout.
 * It verifies the session via API and displays subscription details.
 */

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, Loader2, AlertCircle, ArrowRight, 
  Download, Sparkles, Shield, Zap, Crown 
} from 'lucide-react';
import { CubeLogo } from '@/components/brand/CubeLogo';

// ============================================================================
// TYPES
// ============================================================================

interface SessionVerification {
  success: boolean;
  subscription?: {
    id: string;
    tier: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  customer?: {
    email: string;
    name: string;
  };
  error?: string;
}

// ============================================================================
// CHECKOUT SUCCESS CONTENT
// ============================================================================

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionVerification | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('No session ID provided. Please try your purchase again.');
      setLoading(false);
      return;
    }

    // Verify session via API
    const verifySession = async () => {
      try {
        const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
        const data: SessionVerification = await response.json();
        
        if (!response.ok || !data.success) {
          setError(data.error || 'Failed to verify checkout session');
          setLoading(false);
          return;
        }

        setSessionData(data);
        setLoading(false);
      } catch (err) {
        console.error('Session verification error:', err);
        setError('Failed to verify your purchase. Please contact support.');
        setLoading(false);
      }
    };
    
    verifySession();
  }, [searchParams]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 max-w-lg w-full text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-6 text-purple-400 animate-spin" />
          <h1 className="text-2xl font-bold text-white mb-3">Processing Your Payment...</h1>
          <p className="text-white/70">Please wait while we verify your subscription</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 max-w-lg w-full text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-400" />
          <h1 className="text-2xl font-bold text-white mb-3">Something Went Wrong</h1>
          <p className="text-white/70 mb-8">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/pricing')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
            >
              Back to Pricing
            </button>
            <Link
              href="/contact"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get tier display info
  const tierInfo = {
    pro: { name: 'Pro', icon: Zap, color: 'text-purple-400' },
    elite: { name: 'Elite', icon: Crown, color: 'text-amber-400' },
    enterprise: { name: 'Enterprise', icon: Shield, color: 'text-emerald-400' }
  };

  const currentTier = sessionData?.subscription?.tier?.toLowerCase() || 'pro';
  const TierIcon = tierInfo[currentTier as keyof typeof tierInfo]?.icon || Sparkles;
  const tierName = tierInfo[currentTier as keyof typeof tierInfo]?.name || 'Premium';
  const tierColor = tierInfo[currentTier as keyof typeof tierInfo]?.color || 'text-purple-400';

  // Success State
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2">
            <CubeLogo size="sm" />
            <span className="text-xl font-bold text-white">CUBE Nexum</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-white/10 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Welcome to CUBE Nexum {tierName}!
            </h1>
            <p className="text-white/70 text-lg">
              Your subscription has been activated successfully
            </p>
          </div>

          {/* Subscription Details */}
          <div className="p-8">
            <div className="bg-white/5 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <TierIcon className={`w-6 h-6 ${tierColor}`} />
                <h2 className="text-lg font-semibold text-white">Subscription Details</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/50">Plan</span>
                  <p className="text-white font-medium">{tierName}</p>
                </div>
                <div>
                  <span className="text-white/50">Status</span>
                  <p className="text-green-400 font-medium capitalize">
                    {sessionData?.subscription?.status || 'Active'}
                  </p>
                </div>
                {sessionData?.customer?.email && (
                  <div>
                    <span className="text-white/50">Email</span>
                    <p className="text-white font-medium">{sessionData.customer.email}</p>
                  </div>
                )}
                {sessionData?.subscription?.currentPeriodEnd && (
                  <div>
                    <span className="text-white/50">Next Billing</span>
                    <p className="text-white font-medium">
                      {new Date(sessionData.subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* What's Next */}
            <h2 className="text-lg font-semibold text-white mb-4">What&apos;s Next?</h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Download CUBE Nexum</h3>
                  <p className="text-white/60 text-sm">
                    Get the desktop app for Windows, Mac, or Linux to access all premium features
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Unlimited AI Assistance</h3>
                  <p className="text-white/60 text-sm">
                    Use GPT-4o powered features for smart automation and data extraction
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Priority Support</h3>
                  <p className="text-white/60 text-sm">
                    Get fast responses from our support team with your premium plan
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/get"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all"
              >
                <Download className="w-5 h-5" />
                Download App
              </Link>
              <Link
                href="/"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Help Link */}
        <p className="text-center text-white/50 text-sm mt-8">
          Need help? <Link href="/contact" className="text-purple-400 hover:text-purple-300">Contact our support team</Link>
        </p>
      </main>
    </div>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Loader2 className="w-16 h-16 text-purple-400 animate-spin" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
