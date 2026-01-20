import React from 'react';
import { useRouter } from 'next/navigation';
import { useFeatureAccess, useTier } from '@/lib/stores/subscriptionStore';
import { TierFeatures } from '@/types/subscription';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Sparkles } from 'lucide-react';
import './FeatureGate.css';

interface FeatureGateProps {
  feature: keyof TierFeatures;
  value?: unknown;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  upgradeMessage?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  value,
  children,
  fallback,
  showUpgradePrompt = true,
  upgradeMessage,
}) => {
  const router = useRouter();
  const { tier } = useTier();
  const hasAccess = useFeatureAccess(feature, value);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showUpgradePrompt) {
    return null;
  }
  
  const requiredTier = tier === 'free' ? 'pro' : 'elite';
  const TierIcon = requiredTier === 'elite' ? Crown : Sparkles;
  
  const defaultMessage = `This feature is available on the ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} plan`;
  
  const handleUpgrade = () => {
    router.push('/pricing');
  };
  
  return (
    <Card className="feature-gate">
      <div className="feature-gate__content">
        <div className="feature-gate__icon">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="feature-gate__title">Feature Locked</h3>
        <p className="feature-gate__message">
          {upgradeMessage || defaultMessage}
        </p>
        <Button
          onClick={handleUpgrade}
          variant="default"
          className="feature-gate__upgrade-button"
        >
          <TierIcon className="w-4 h-4 mr-2" />
          Upgrade to {requiredTier === 'elite' ? 'Elite' : 'Pro'}
        </Button>
      </div>
    </Card>
  );
};

interface FeatureCheckProps {
  feature: keyof TierFeatures;
  value?: unknown;
  onAccessDenied?: () => void;
}

export const useFeatureCheck = ({ feature, value, onAccessDenied }: FeatureCheckProps) => {
  const hasAccess = useFeatureAccess(feature, value);
  const router = useRouter();
  
  const checkAccess = () => {
    if (!hasAccess) {
      if (onAccessDenied) {
        onAccessDenied();
      } else {
        router.push('/pricing');
      }
      return false;
    }
    return true;
  };
  
  return { hasAccess, checkAccess };
};
