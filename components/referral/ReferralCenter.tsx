'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('ReferralCenter');

import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Users, Gift, DollarSign, TrendingUp, Link, Copy, Check,
  Mail, Twitter, Linkedin, Facebook,
  ChevronRight, Award, Crown, Zap,
  Calendar, RefreshCw, ExternalLink, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import './ReferralCenter.css';

// =============================================================================
// Types
// =============================================================================

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  convertedReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  conversionRate: number;
  thisMonthReferrals: number;
  thisMonthEarnings: number;
}

interface Referral {
  id: string;
  email: string;
  status: 'pending' | 'trial' | 'converted' | 'expired';
  referredAt: string;
  convertedAt?: string;
  plan?: 'pro' | 'elite';
  commission: number;
  isPaid: boolean;
}

interface TierInfo {
  name: string;
  commission: number;
  minReferrals: number;
  perks: string[];
}

interface ReferralCenterProps {
  compact?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const REFERRAL_TIERS: TierInfo[] = [
  {
    name: 'Starter',
    commission: 15,
    minReferrals: 0,
    perks: ['15% commission', 'Basic tracking', 'Monthly payouts']
  },
  {
    name: 'Bronze',
    commission: 20,
    minReferrals: 5,
    perks: ['20% commission', 'Priority support', 'Bi-weekly payouts']
  },
  {
    name: 'Silver',
    commission: 25,
    minReferrals: 15,
    perks: ['25% commission', 'Custom referral page', 'Weekly payouts']
  },
  {
    name: 'Gold',
    commission: 30,
    minReferrals: 30,
    perks: ['30% commission', 'Co-marketing', 'Dedicated manager']
  },
  {
    name: 'Platinum',
    commission: 35,
    minReferrals: 50,
    perks: ['35% commission', 'API access', 'Custom integrations']
  }
];

// =============================================================================
// Component
// =============================================================================

export const ReferralCenter: React.FC<ReferralCenterProps> = ({ compact = false }) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Load referral data from backend
  useEffect(() => {
    const loadReferralData = async () => {
      setError(null);
      try {
        // Use correct Tauri command names from referral_commands.rs
        const [backendStats, backendReferrals, codeData] = await Promise.all([
          invoke<{
            total_referrals: number;
            successful_referrals: number;
            pending_referrals: number;
            total_rewards_earned: number;
            current_tier: string;
            referrals_to_next_tier: number;
            lifetime_referrals: number;
            this_month_referrals: number;
            this_month_earnings: number;
          }>('referral_get_stats'),
          invoke<Array<{
            id: string;
            referrer_id: string;
            referee_id: string;
            code_used: string;
            status: string;
            reward_amount: number;
            created_at: number;
            completed_at?: number;
          }>>('referral_get_referrals', { userId: null, status: null }),
          invoke<{ code: string; user_id: string } | null>('referral_generate_code', { userId: 'current-user' })
        ]);
        
        // Transform backend data to frontend format
        setStats({
          totalReferrals: backendStats.total_referrals,
          pendingReferrals: backendStats.pending_referrals,
          convertedReferrals: backendStats.successful_referrals,
          totalEarnings: backendStats.total_rewards_earned,
          pendingEarnings: 0, // Calculate from referrals if needed
          paidEarnings: backendStats.total_rewards_earned,
          conversionRate: backendStats.total_referrals > 0 
            ? (backendStats.successful_referrals / backendStats.total_referrals) * 100 
            : 0,
          thisMonthReferrals: backendStats.this_month_referrals,
          thisMonthEarnings: backendStats.this_month_earnings
        });
        
        // Transform referrals
        setReferrals(backendReferrals.map(r => ({
          id: r.id,
          email: r.referee_id, // Backend uses referee_id
          status: r.status === 'completed' ? 'converted' : 
                  r.status === 'rewarded' ? 'converted' : 
                  r.status as 'pending' | 'trial' | 'converted' | 'expired',
          referredAt: new Date(r.created_at * 1000).toISOString().split('T')[0],
          convertedAt: r.completed_at ? new Date(r.completed_at * 1000).toISOString().split('T')[0] : undefined,
          commission: r.reward_amount / 100, // Convert cents to dollars
          isPaid: r.status === 'rewarded'
        })));
        
        if (codeData) {
          setReferralCode(codeData.code);
          setReferralLink(`https://cubeneuxm.com/r/${codeData.code}`);
        }
      } catch (err) {
        log.error('Failed to load referral data:', err);
        setError('Failed to load referral data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadReferralData();
  }, []);

  // Calculate current tier
  const currentTier = useMemo(() => {
    if (!stats) return REFERRAL_TIERS[0];
    const converted = stats.convertedReferrals;
    for (let i = REFERRAL_TIERS.length - 1; i >= 0; i--) {
      if (converted >= REFERRAL_TIERS[i].minReferrals) {
        return REFERRAL_TIERS[i];
      }
    }
    return REFERRAL_TIERS[0];
  }, [stats]);

  // Calculate next tier
  const nextTier = useMemo(() => {
    const currentIndex = REFERRAL_TIERS.findIndex(t => t.name === currentTier.name);
    return currentIndex < REFERRAL_TIERS.length - 1 ? REFERRAL_TIERS[currentIndex + 1] : null;
  }, [currentTier]);

  // Progress to next tier
  const tierProgress = useMemo(() => {
    if (!stats || !nextTier) return 100;
    const current = stats.convertedReferrals;
    const start = currentTier.minReferrals;
    const end = nextTier.minReferrals;
    return Math.min(100, ((current - start) / (end - start)) * 100);
  }, [stats, currentTier, nextTier]);

  // Copy referral link
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      log.error('Failed to copy:', error);
    }
  };

  // Share functions
  const shareVia = (platform: string) => {
    const message = `Check out CUBE Nexum - the ultimate productivity suite! Use my referral link: ${referralLink}`;
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      email: `mailto:?subject=Try CUBE Nexum&body=${encodeURIComponent(message)}`
    };
    window.open(urls[platform], '_blank');
  };

  // Get status badge variant
  const getStatusVariant = (status: Referral['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      trial: 'secondary',
      converted: 'default',
      expired: 'destructive'
    };
    return variants[status] || 'outline';
  };

  const getStatusLabel = (status: Referral['status']): string => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      trial: 'In Trial',
      converted: 'Converted',
      expired: 'Expired'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading referral data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Gift className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center">
            <p className="font-medium text-destructive">Failed to Load Referral Data</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              setError(null);
              window.location.reload();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Your Referrals</p>
            <p className="text-sm font-semibold">
              ${stats?.totalEarnings.toFixed(0)} earned • {stats?.totalReferrals} referrals
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift className="w-6 h-6 text-amber-500" />
          <div>
            <h2 className="text-2xl font-bold">Referral Center</h2>
            <p className="text-sm text-muted-foreground">
              Earn {currentTier.commission}% commission on every referral
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn(
          "flex items-center gap-1.5 px-3 py-1",
          currentTier.name === 'Gold' && "border-amber-500/50 text-amber-500",
          currentTier.name === 'Platinum' && "border-purple-500/50 text-purple-500",
          currentTier.name === 'Silver' && "border-slate-400/50 text-slate-400",
          currentTier.name === 'Bronze' && "border-orange-600/50 text-orange-600"
        )}>
          <Crown className="w-4 h-4" />
          {currentTier.name}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats?.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-amber-500">
              ${stats?.pendingEarnings.toFixed(2)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalReferrals}</p>
                <p className="text-xs text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.convertedReferrals}</p>
                <p className="text-xs text-muted-foreground">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border">
              <Link className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={referralLink}
                readOnly
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
              />
            </div>
            <Button
              variant={copied ? "default" : "outline"}
              onClick={() => handleCopy(referralLink)}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Code:</span>
            <code className="px-2 py-1 bg-muted rounded text-primary font-mono">{referralCode}</code>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(referralCode)}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Share via:</span>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-sky-500/20 hover:text-sky-500 hover:border-sky-500/50" onClick={() => shareVia('twitter')}>
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-blue-600/20 hover:text-blue-600 hover:border-blue-600/50" onClick={() => shareVia('linkedin')}>
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-500 hover:border-blue-500/50" onClick={() => shareVia('facebook')}>
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50" onClick={() => shareVia('email')}>
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Progress */}
      {nextTier && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Progress to {nextTier.name}</CardTitle>
              <Badge variant="secondary">+{nextTier.commission - currentTier.commission}% commission</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={tierProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats?.convertedReferrals} referrals</span>
              <span>{nextTier.minReferrals - (stats?.convertedReferrals || 0)} more to {nextTier.name}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission Tiers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Commission Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {REFERRAL_TIERS.map((tier, index) => (
              <div
                key={tier.name}
                className={cn(
                  "relative p-4 rounded-lg border text-center transition-colors",
                  tier.name === currentTier.name 
                    ? "bg-primary/10 border-primary" 
                    : "bg-muted/50 border-border hover:bg-muted"
                )}
              >
                {tier.name === currentTier.name && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]">
                    Current
                  </Badge>
                )}
                <div className={cn(
                  "w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center",
                  index === 0 && "bg-slate-500/20 text-slate-500",
                  index === 1 && "bg-orange-600/20 text-orange-600",
                  index === 2 && "bg-slate-400/20 text-slate-400",
                  index === 3 && "bg-amber-500/20 text-amber-500",
                  index === 4 && "bg-purple-500/20 text-purple-500"
                )}>
                  {index === 0 && <Zap className="w-4 h-4" />}
                  {index === 1 && <Award className="w-4 h-4" />}
                  {index === 2 && <Award className="w-4 h-4" />}
                  {index === 3 && <Crown className="w-4 h-4" />}
                  {index === 4 && <Sparkles className="w-4 h-4" />}
                </div>
                <p className="font-medium text-sm">{tier.name}</p>
                <p className="text-lg font-bold text-primary">{tier.commission}%</p>
                <p className="text-[10px] text-muted-foreground">
                  {tier.minReferrals === 0 ? 'No minimum' : `${tier.minReferrals}+ referrals`}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Referrals</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {referrals.slice(0, 5).map(referral => (
              <div key={referral.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium">{referral.email}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(referral.referredAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={getStatusVariant(referral.status)}>
                  {getStatusLabel(referral.status)}
                </Badge>
                <div className="w-20 text-right">
                  {referral.commission > 0 ? (
                    <span className="text-sm font-semibold text-green-500">${referral.commission.toFixed(2)}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { num: '1', title: 'Share Your Link', desc: 'Send your unique referral link to friends and colleagues' },
              { num: '2', title: 'They Sign Up', desc: 'When they register using your link, they get a 30-day free trial' },
              { num: '3', title: 'They Subscribe', desc: 'If they become a paying customer, you earn a commission' },
              { num: '4', title: 'Get Paid', desc: `Receive ${currentTier.commission}% commission on their subscription` }
            ].map(step => (
              <div key={step.num} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                  {step.num}
                </div>
                <div>
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold">Maximize Your Earnings</p>
            <p className="text-sm text-muted-foreground">
              Reach {nextTier?.name || 'Platinum'} tier to earn up to {nextTier?.commission || 35}% commission
            </p>
          </div>
          <Button>
            <ExternalLink className="w-4 h-4 mr-2" />
            Marketing Resources
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralCenter;
