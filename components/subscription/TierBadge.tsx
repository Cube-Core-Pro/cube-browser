import React from 'react';
import { useRouter } from 'next/navigation';
import { useSubscriptionStore, useTier } from '@/lib/stores/subscriptionStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles, Zap, AlertCircle } from 'lucide-react';
import './TierBadge.css';

interface TierBadgeProps {
  showDetails?: boolean;
  showUpgradeButton?: boolean;
  className?: string;
}

const TIER_ICONS = {
  free: Zap,
  pro: Sparkles,
  elite: Crown,
};

const TIER_COLORS = {
  free: 'bg-muted text-muted-foreground border-border',
  pro: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  elite: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
};

const TIER_ICON_COLORS = {
  free: 'text-muted-foreground',
  pro: 'text-blue-600 dark:text-blue-400',
  elite: 'text-purple-600 dark:text-purple-400',
};

const TIER_LABELS = {
  free: 'Free',
  pro: 'Pro',
  elite: 'Elite',
};

export const TierBadge: React.FC<TierBadgeProps> = ({
  showDetails = false,
  showUpgradeButton = false,
  className = '',
}) => {
  const router = useRouter();
  const { tier } = useTier();
  const subscription = useSubscriptionStore((state) => state.subscription);
  const daysUntilRenewal = useSubscriptionStore((state) => state.daysUntilRenewal);
  const isTrialing = useSubscriptionStore((state) => state.isTrialing);
  
  const Icon = TIER_ICONS[tier];
  const colorClass = TIER_COLORS[tier];
  const label = TIER_LABELS[tier];
  
  const handleUpgrade = () => {
    router.push('/pricing');
  };
  
  if (!showDetails) {
    return (
      <Badge variant="outline" className={`tier-badge tier-badge--${tier} ${colorClass} ${className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  }
  
  return (
    <Card className={`tier-badge-card ${className}`}>
      <div className="tier-badge-card__header">
        <div className="tier-badge-card__icon">
          <Icon className={`w-6 h-6 ${TIER_ICON_COLORS[tier]}`} />
        </div>
        <div className="tier-badge-card__info">
          <h3 className="tier-badge-card__title">{label} Plan</h3>
          <p className="tier-badge-card__subtitle">
            {subscription?.status === 'active' && 'Active subscription'}
            {subscription?.status === 'trialing' && 'Trial period'}
            {subscription?.status === 'canceled' && 'Ends soon'}
            {subscription?.status === 'past_due' && 'Payment required'}
            {!subscription && 'Free tier'}
          </p>
        </div>
      </div>
      
      {subscription && (
        <div className="tier-badge-card__details">
          {isTrialing() && (
            <div className="tier-badge-card__alert tier-badge-card__alert--info">
              <AlertCircle className="w-4 h-4" />
              <span>Trial ends in {daysUntilRenewal()} days</span>
            </div>
          )}
          
          {subscription.cancelAtPeriodEnd && (
            <div className="tier-badge-card__alert tier-badge-card__alert--warning">
              <AlertCircle className="w-4 h-4" />
              <span>Subscription ends in {daysUntilRenewal()} days</span>
            </div>
          )}
          
          {subscription.status === 'past_due' && (
            <div className="tier-badge-card__alert tier-badge-card__alert--error">
              <AlertCircle className="w-4 h-4" />
              <span>Payment failed - please update payment method</span>
            </div>
          )}
          
          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
            <div className="tier-badge-card__renewal">
              <span className="tier-badge-card__renewal-label">Renews in</span>
              <span className="tier-badge-card__renewal-value">{daysUntilRenewal()} days</span>
            </div>
          )}
        </div>
      )}
      
      {showUpgradeButton && tier !== 'elite' && (
        <div className="tier-badge-card__actions">
          <Button
            onClick={handleUpgrade}
            variant="default"
            className="tier-badge__upgrade-button"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to {tier === 'free' ? 'Pro' : 'Elite'}
          </Button>
        </div>
      )}
    </Card>
  );
};
