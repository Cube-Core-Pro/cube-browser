'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Alert component inline since ui/alert doesn't exist
const Alert: React.FC<{ variant?: string; children: React.ReactNode; className?: string }> = ({ variant, children, className = '' }) => (
  <div className={`rounded-md border p-4 ${variant === 'destructive' ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100' : ''} ${className}`}>{children}</div>
);
const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`text-sm ${className}`}>{children}</div>
);
import { Separator } from '@/components/ui/separator';
import { 
  Key, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Crown,
  Zap,
  Monitor,
  RefreshCw,
  Copy,
  ExternalLink,
  WifiOff
} from 'lucide-react';
import { useLicenseStore } from '@/lib/stores/licenseStore';
import { useToast } from '@/hooks/use-toast';

interface LicenseActivationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LicenseActivation({ open, onOpenChange, onSuccess }: LicenseActivationProps) {
  const { toast } = useToast();
  const [licenseKey, setLicenseKey] = useState('');
  const [email, setEmail] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  
  const { activateLicense } = useLicenseStore();

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setActivationError('Please enter your license key');
      return;
    }
    
    if (!email.trim()) {
      setActivationError('Please enter your email address');
      return;
    }

    setIsActivating(true);
    setActivationError(null);

    try {
      await activateLicense(licenseKey.trim(), email.trim());
      
      toast({
        title: 'License Activated',
        description: 'Your license has been successfully activated.',
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      setActivationError(
        error instanceof Error ? error.message : 'Failed to activate license'
      );
    } finally {
      setIsActivating(false);
    }
  };

  const handleCopyDeviceId = async () => {
    const { deviceId } = useLicenseStore.getState();
    if (deviceId) {
      await navigator.clipboard.writeText(deviceId);
      toast({
        title: 'Copied',
        description: 'Device ID copied to clipboard',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-500" />
            Activate License
          </DialogTitle>
          <DialogDescription>
            Enter your license key to unlock Pro or Elite features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* License Key Input */}
          <div className="space-y-2">
            <Label htmlFor="license-key">License Key</Label>
            <Input
              id="license-key"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use the same email you used for purchase
            </p>
          </div>

          {/* Error Alert */}
          {activationError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{activationError}</AlertDescription>
            </Alert>
          )}

          {/* Device ID */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Device ID</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyDeviceId}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {useLicenseStore.getState().deviceId || 'Loading...'}
            </p>
          </div>

          {/* Help Links */}
          <div className="flex gap-4 text-sm">
            <a 
              href="https://cubeai.tools/pricing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-purple-500 hover:text-purple-600"
            >
              <ExternalLink className="h-3 w-3" />
              Get a License
            </a>
            <a 
              href="https://cubeai.tools/support" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Need Help?
            </a>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleActivate} disabled={isActivating}>
            {isActivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Activate License
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// License Status Card Component
// ============================================================================

interface LicenseStatusCardProps {
  className?: string;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

export function LicenseStatusCard({ className, onActivate, onDeactivate }: LicenseStatusCardProps) {
  const { 
    license, 
    tier, 
    isActive, 
    isOfflineMode, 
    daysRemaining,
    isLoading,
    error,
    deviceId,
    refreshLicense,
    deactivateLicense 
  } = useLicenseStore();
  const { toast } = useToast();
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleRefresh = async () => {
    await refreshLicense();
    toast({
      title: 'License Refreshed',
      description: 'License status has been updated.',
    });
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate this license? You can reactivate it later.')) {
      return;
    }

    setIsDeactivating(true);
    try {
      await deactivateLicense();
      toast({
        title: 'License Deactivated',
        description: 'Your license has been deactivated from this device.',
      });
      onDeactivate?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to deactivate',
        variant: 'destructive',
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  const getTierIcon = () => {
    switch (tier) {
      case 'elite': return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'pro': return <Zap className="h-5 w-5 text-purple-500" />;
      default: return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTierColor = () => {
    switch (tier) {
      case 'elite': return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case 'pro': return 'bg-gradient-to-r from-purple-500 to-indigo-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusBadge = () => {
    if (isLoading) {
      return <Badge variant="secondary">Checking...</Badge>;
    }
    
    if (!isActive) {
      return <Badge variant="outline">Not Activated</Badge>;
    }
    
    if (isOfflineMode) {
      return (
        <Badge variant="secondary" className="gap-1">
          <WifiOff className="h-3 w-3" />
          Offline Mode
        </Badge>
      );
    }
    
    return (
      <Badge className={getTierColor()}>
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Active
      </Badge>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getTierIcon()}
            License Status
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tier & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold capitalize">{tier}</span>
            {getStatusBadge()}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* License Details */}
        {isActive && license && (
          <>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{license.user_email}</span>
              </div>
              {daysRemaining !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Remaining</span>
                  <span className={daysRemaining < 7 ? 'text-yellow-500 font-medium' : ''}>
                    {daysRemaining} days
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Device ID</span>
                <span className="font-mono text-xs">{deviceId?.slice(0, 12)}...</span>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {!isActive ? (
            <Button className="w-full" onClick={onActivate}>
              <Key className="mr-2 h-4 w-4" />
              Activate License
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleDeactivate}
                disabled={isDeactivating}
              >
                {isDeactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deactivate
              </Button>
              <Button 
                variant="default" 
                className="flex-1"
                onClick={() => window.open('https://cubeai.tools/account', '_blank')}
              >
                Manage Account
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Feature Gate Component (License-based)
// ============================================================================

interface LicenseFeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LicenseFeatureGate({ feature, children, fallback }: LicenseFeatureGateProps) {
  const { checkFeature } = useLicenseStore();
  
  // Cast feature string to FeatureName type
  const isAllowed = checkFeature(feature as Parameters<typeof checkFeature>[0]);
  
  if (isAllowed) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Shield className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">Feature Locked</h3>
      <p className="text-sm text-muted-foreground mt-2">
        This feature requires a higher tier license.
      </p>
      <Button className="mt-4" variant="outline">
        <Crown className="mr-2 h-4 w-4" />
        Upgrade Now
      </Button>
    </div>
  );
}
