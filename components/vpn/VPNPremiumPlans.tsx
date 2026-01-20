"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('VPNPremiumPlans');

import React, { useEffect, useState } from 'react';
import { VPNPremiumService, type TierItem } from '@/lib/services/vpn-extended-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const VPNPremiumPlans: React.FC = () => {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<TierItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTiers = async () => {
    setLoading(true);
    try {
      const data = await VPNPremiumService.getTiers();
      // Expecting [{ provider, tier }, ...]
      setTiers(data || []);
    } catch (error) {
      log.error('Failed to load VPN tiers:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (provider: string, tier: unknown) => {
    try {
      const tierObj = tier as { name?: string; id?: string };
      const link = await VPNPremiumService.getPurchaseLink(provider, tierObj.name || tierObj.id || String(tier));
      if (link) {
        // Open affiliate/purchase link in external browser
        if (typeof window !== 'undefined') window.open(link, '_blank');
      } else {
        toast({ title: 'Error', description: 'No purchase link returned', variant: 'destructive' });
      }
    } catch (error) {
      log.error('Failed to get purchase link:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    }
  };

  if (loading && tiers.length === 0) return <div>Loading plans...</div>;

  return (
    <div className="space-y-4">
      {tiers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No premium plans available</CardTitle>
            <CardDescription>Try again later or refresh.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiers.map((item, idx) => (
            <Card key={`${item.provider}-${idx}`} className={cn('h-full')}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{item.tier.name || item.tier.title || `${item.provider} Plan`}</span>
                  <Badge>{item.provider}</Badge>
                </CardTitle>
                <CardDescription className="mt-2">{item.tier.description || item.tier.summary || ''}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-2xl font-bold">{item.tier.price ? `$${item.tier.price}` : item.tier.display_price || 'Contact'}</div>
                  <div className="text-xs text-muted-foreground">{item.tier.billing_interval || item.tier.interval || 'per month'}</div>
                </div>

                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  {(item.tier.features || []).slice(0, 6).map((f: string, i: number) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>

                <div className="flex gap-2">
                  <Button onClick={() => handleBuy(item.provider, item.tier)}>
                    Comprar
                  </Button>
                  <Button variant="ghost" onClick={() => navigator.clipboard?.writeText(JSON.stringify(item.tier) || '')}>
                    Copiar detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VPNPremiumPlans;
