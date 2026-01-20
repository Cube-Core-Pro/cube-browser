"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '@/components/subscription/TierBadge';
import { useSubscriptionStore, useTier } from '@/lib/stores/subscriptionStore';
import { StripeService } from '@/lib/services/stripeService';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';

export default function SubscriptionManagementPage() {
  const { tier } = useTier();
  const subscription = useSubscriptionStore((state) => state.subscription);
  const cancelSubscription = useSubscriptionStore((state) => state.cancelSubscription);
  const resumeSubscription = useSubscriptionStore((state) => state.resumeSubscription);
  const daysUntilRenewal = useSubscriptionStore((state) => state.daysUntilRenewal);
  const isTrialing = useSubscriptionStore((state) => state.isTrialing);

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { confirm } = useConfirm();

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    const confirmed = await confirm({
      title: 'Cancel Subscription',
      description: 'Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.',
      confirmText: 'Cancel Subscription',
      cancelText: 'Keep Subscription',
      variant: 'destructive',
    });
    
    if (!confirmed) return;

    setLoading('cancel');
    setError(null);

    try {
      await cancelSubscription();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setLoading(null);
    }
  };

  const handleResumeSubscription = async () => {
    if (!subscription) return;

    setLoading('resume');
    setError(null);

    try {
      await resumeSubscription();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume subscription');
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!subscription?.stripeCustomerId) return;

    setLoading('portal');
    setError(null);

    try {
      await StripeService.openPortal(subscription.stripeCustomerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <AppLayout tier="elite">
      <div className="p-6 space-y-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage your CUBE Nexum subscription and billing
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Plan */}
        <Card className="bg-card border p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Current Plan</h2>
          <TierBadge showDetails={true} showUpgradeButton={tier !== 'elite'} />
        </Card>

        {/* Subscription Details */}
        {subscription && (
          <Card className="bg-card border p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Subscription Details</h2>

            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between py-3 border-b border">
                <span className="text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {subscription.status === 'active' && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        Active
                      </Badge>
                    </>
                  )}
                  {subscription.status === 'trialing' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-blue-400" />
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        Trial
                      </Badge>
                    </>
                  )}
                  {subscription.status === 'canceled' && (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                        Canceled
                      </Badge>
                    </>
                  )}
                  {subscription.status === 'past_due' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                        Past Due
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Renewal Date */}
              <div className="flex items-center justify-between py-3 border-b border">
                <span className="text-muted-foreground">
                  {subscription.cancelAtPeriodEnd ? 'Ends on' : 'Renews on'}
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {formatDate(new Date(subscription.currentPeriodEnd))}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    ({daysUntilRenewal()} days)
                  </span>
                </div>
              </div>

              {/* Subscription ID */}
              <div className="flex items-center justify-between py-3">
                <span className="text-muted-foreground">Subscription ID</span>
                <span className="font-mono text-sm text-muted-foreground">
                  {subscription.stripeSubscriptionId || subscription.id}
                </span>
              </div>
            </div>

            {/* Alerts */}
            {isTrialing() && (
              <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-600 dark:text-blue-300">Trial Period Active</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your trial ends in {daysUntilRenewal()} days. Add a payment method to continue
                    your subscription.
                  </p>
                </div>
              </div>
            )}

            {subscription.cancelAtPeriodEnd && (
              <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-600 dark:text-yellow-300">Subscription Ending</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your subscription will end on{' '}
                    {formatDate(new Date(subscription.currentPeriodEnd))}. You can reactivate it
                    anytime before then.
                  </p>
                </div>
              </div>
            )}

            {subscription.status === 'past_due' && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-600 dark:text-red-300">Payment Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your last payment failed. Please update your payment method to avoid service
                    interruption.
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Actions */}
        <Card className="bg-card border p-6">
          <h2 className="text-2xl font-semibold mb-4">Manage Subscription</h2>

          <div className="space-y-3">
            {/* Billing Portal */}
            {subscription?.stripeCustomerId && (
              <Button
                onClick={handleManageBilling}
                disabled={loading === 'portal'}
                className="w-full bg-muted hover:bg-muted/80 flex items-center justify-center gap-2"
                size="lg"
              >
                {loading === 'portal' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening Portal...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Manage Billing & Payment Methods
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </>
                )}
              </Button>
            )}

            {/* Cancel/Resume */}
            {subscription && subscription.status !== 'canceled' && (
              <>
                {subscription.cancelAtPeriodEnd ? (
                  <Button
                    onClick={handleResumeSubscription}
                    disabled={loading === 'resume'}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {loading === 'resume' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Resuming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resume Subscription
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleCancelSubscription}
                    disabled={loading === 'cancel'}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-300 hover:bg-red-500/20"
                    size="lg"
                  >
                    {loading === 'cancel' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Canceling...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Subscription
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
      </div>
    </AppLayout>
  );
}
