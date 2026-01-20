"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('PasskeyManager');

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress as _Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Fingerprint,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  Usb,
  Bluetooth,
  Nfc,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Info as _Info,
  Globe as _Globe,
  Clock as _Clock,
  Activity as _Activity,
  Lock as _Lock,
  Unlock as _Unlock,
  Settings,
  HelpCircle,
  CheckCircle,
  ExternalLink as _ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Star as _Star,
  Download,
  Upload as _Upload,
  QrCode,
  Loader2,
} from 'lucide-react';
import {
  PasskeyCredential,
  PasskeyManager as _PasskeyManagerType,
  PasskeyRegistrationOptions,
  PasskeyTransport,
  PasskeyAlgorithm,
} from '@/types/password-manager-pro';
import './PasskeyManager.css';

// ============================================================================
// BACKEND TYPES
// ============================================================================

interface BackendPasskey {
  id: string;
  name: string;
  relyingParty: string;
  relyingPartyId: string;
  username: string;
  userDisplayName: string;
  createdAt: number;
  lastUsed: number | null;
  credentialId: string;
  publicKeyAlgorithm: string;
  isDiscoverable: boolean;
  isSynced: boolean;
}

interface PasskeyConfig {
  passkeys: BackendPasskey[];
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

const toPasskeyCredential = (backendPasskey: BackendPasskey): PasskeyCredential => ({
  id: backendPasskey.id,
  credentialId: backendPasskey.credentialId,
  publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...',
  algorithm: backendPasskey.publicKeyAlgorithm as PasskeyAlgorithm,
  counter: 0,
  transports: backendPasskey.isDiscoverable ? ['internal', 'hybrid'] : ['usb', 'nfc'],
  attachment: backendPasskey.isDiscoverable ? 'platform' : 'cross-platform',
  userVerification: 'required',
  displayName: backendPasskey.name,
  createdAt: new Date(backendPasskey.createdAt * 1000),
  lastUsedAt: backendPasskey.lastUsed ? new Date(backendPasskey.lastUsed * 1000) : new Date(),
  origin: `https://${backendPasskey.relyingPartyId}`,
  rpId: backendPasskey.relyingPartyId,
  rpName: backendPasskey.relyingParty,
  userId: 'user-123',
  aaguid: '00000000-0000-0000-0000-000000000000',
  deviceInfo: {
    name: backendPasskey.isDiscoverable ? 'MacBook Pro' : 'YubiKey 5 NFC',
    platform: backendPasskey.isDiscoverable ? 'macOS 14.2' : 'Hardware Key',
    browser: backendPasskey.isDiscoverable ? 'Chrome 121' : 'N/A',
  },
  isBackupEligible: backendPasskey.isDiscoverable,
  isBackedUp: backendPasskey.isSynced,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getTransportIcon = (transport: PasskeyTransport) => {
  switch (transport) {
    case 'usb':
      return <Usb className="h-4 w-4" />;
    case 'nfc':
      return <Nfc className="h-4 w-4" />;
    case 'ble':
      return <Bluetooth className="h-4 w-4" />;
    case 'internal':
      return <Fingerprint className="h-4 w-4" />;
    case 'hybrid':
      return <Smartphone className="h-4 w-4" />;
    default:
      return <Key className="h-4 w-4" />;
  }
};

const getTransportLabel = (transport: PasskeyTransport): string => {
  const labels: Record<PasskeyTransport, string> = {
    usb: 'USB',
    nfc: 'NFC',
    ble: 'Bluetooth',
    internal: 'Built-in',
    hybrid: 'Hybrid',
  };
  return labels[transport];
};

const getAlgorithmLabel = (algorithm: PasskeyAlgorithm): string => {
  const labels: Record<PasskeyAlgorithm, string> = {
    ES256: 'ECDSA P-256',
    RS256: 'RSA SHA-256',
    Ed25519: 'Ed25519',
  };
  return labels[algorithm];
};

const getDeviceIcon = (deviceInfo: PasskeyCredential['deviceInfo']) => {
  const name = deviceInfo.name.toLowerCase();
  if (name.includes('iphone') || name.includes('android') || name.includes('pixel')) {
    return <Smartphone className="h-5 w-5" />;
  }
  if (name.includes('yubikey') || name.includes('titan') || name.includes('security key')) {
    return <Key className="h-5 w-5" />;
  }
  return <Laptop className="h-5 w-5" />;
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface PasskeyCardProps {
  passkey: PasskeyCredential;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

function PasskeyCard({ passkey, onDelete, onRename, isSelected, onSelect }: PasskeyCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState(passkey.displayName);
  const { toast } = useToast();

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(passkey.credentialId);
    toast({ title: 'Copied', description: 'Credential ID copied to clipboard' });
  };

  const handleRename = () => {
    if (newName.trim() && newName !== passkey.displayName) {
      onRename(passkey.id, newName.trim());
    }
    setEditMode(false);
  };

  return (
    <Card 
      className={`passkey-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="passkey-icon">
            {getDeviceIcon(passkey.deviceInfo)}
          </div>

          <div className="flex-1 min-w-0">
            {editMode ? (
              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') {
                      setNewName(passkey.displayName);
                      setEditMode(false);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={(e) => { e.stopPropagation(); handleRename(); }}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setNewName(passkey.displayName);
                    setEditMode(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h4 
                  className="font-medium truncate cursor-pointer hover:text-primary"
                  onDoubleClick={(e) => { e.stopPropagation(); setEditMode(true); }}
                >
                  {passkey.displayName}
                </h4>
                {passkey.isBackedUp && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Backed up to iCloud/Google</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>{passkey.deviceInfo.platform}</span>
              <span>•</span>
              <span>{passkey.deviceInfo.browser}</span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {passkey.transports.map((transport) => (
                <Badge key={transport} variant="secondary" className="text-xs gap-1">
                  {getTransportIcon(transport)}
                  {getTransportLabel(transport)}
                </Badge>
              ))}
              <Badge variant="outline" className="text-xs">
                {getAlgorithmLabel(passkey.algorithm)}
              </Badge>
            </div>

            {showDetails && (
              <div className="mt-4 pt-4 border-t space-y-2 text-sm" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <p>{formatDate(passkey.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Used</Label>
                    <p>{formatRelativeTime(passkey.lastUsedAt)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Usage Count</Label>
                    <p>{passkey.counter} authentications</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">User Verification</Label>
                    <p className="capitalize">{passkey.userVerification}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Origin</Label>
                    <p className="truncate">{passkey.origin}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">RP ID</Label>
                    <p>{passkey.rpId}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground">Credential ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                      {passkey.credentialId}
                    </code>
                    <Button size="sm" variant="ghost" onClick={handleCopyId}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {passkey.isBackupEligible ? (
                    <Badge variant="outline" className="text-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Backup Eligible
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Backup Eligible
                    </Badge>
                  )}
                  {passkey.isBackedUp && (
                    <Badge variant="outline" className="text-green-600">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Synced
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => { e.stopPropagation(); onDelete(passkey.id); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RegisterPasskeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (options: Partial<PasskeyRegistrationOptions>) => Promise<void>;
}

function RegisterPasskeyDialog({ open, onOpenChange, onRegister }: RegisterPasskeyDialogProps) {
  const [step, setStep] = useState<'options' | 'registering' | 'success' | 'error'>('options');
  const [displayName, setDisplayName] = useState('');
  const [attachment, setAttachment] = useState<'platform' | 'cross-platform'>('platform');
  const [userVerification, setUserVerification] = useState<'required' | 'preferred'>('required');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRegister = async () => {
    if (!displayName.trim()) {
      toast({ 
        title: 'Name Required', 
        description: 'Please enter a name for this passkey',
        variant: 'destructive'
      });
      return;
    }

    setStep('registering');
    setError(null);

    try {
      await onRegister({
        userDisplayName: displayName,
        authenticatorSelection: {
          authenticatorAttachment: attachment,
          userVerification,
          residentKey: 'required',
        },
      });
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('options');
    setDisplayName('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            Register New Passkey
          </DialogTitle>
          <DialogDescription>
            Create a passwordless credential using your device&apos;s biometric authentication
          </DialogDescription>
        </DialogHeader>

        {step === 'options' && (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Passkey Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., MacBook Pro - Touch ID"
                />
                <p className="text-xs text-muted-foreground">
                  A friendly name to identify this passkey
                </p>
              </div>

              <div className="space-y-2">
                <Label>Authenticator Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Card 
                    className={`cursor-pointer transition-all ${attachment === 'platform' ? 'border-primary ring-1 ring-primary' : ''}`}
                    onClick={() => setAttachment('platform')}
                  >
                    <CardContent className="p-3 text-center">
                      <Fingerprint className="h-6 w-6 mx-auto mb-1 text-primary" />
                      <p className="text-sm font-medium">Platform</p>
                      <p className="text-xs text-muted-foreground">Touch ID, Face ID</p>
                    </CardContent>
                  </Card>
                  <Card 
                    className={`cursor-pointer transition-all ${attachment === 'cross-platform' ? 'border-primary ring-1 ring-primary' : ''}`}
                    onClick={() => setAttachment('cross-platform')}
                  >
                    <CardContent className="p-3 text-center">
                      <Key className="h-6 w-6 mx-auto mb-1 text-primary" />
                      <p className="text-sm font-medium">Security Key</p>
                      <p className="text-xs text-muted-foreground">YubiKey, USB keys</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-2">
                <Label>User Verification</Label>
                <Select value={userVerification} onValueChange={(v: 'required' | 'preferred') => setUserVerification(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="required">Required (Most Secure)</SelectItem>
                    <SelectItem value="preferred">Preferred</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Biometric or PIN verification when using this passkey
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleRegister}>
                <Fingerprint className="h-4 w-4 mr-2" />
                Register Passkey
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'registering' && (
          <div className="py-8 text-center">
            <div className="animate-pulse mb-4">
              <Fingerprint className="h-16 w-16 mx-auto text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">Complete Registration</h3>
            <p className="text-muted-foreground">
              Follow the prompts on your device to complete passkey registration
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="mb-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Passkey Registered!</h3>
            <p className="text-muted-foreground mb-4">
              Your new passkey &quot;{displayName}&quot; has been successfully registered
            </p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}

        {step === 'error' && (
          <div className="py-8 text-center">
            <div className="mb-4">
              <ShieldAlert className="h-16 w-16 mx-auto text-red-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Registration Failed</h3>
            <p className="text-muted-foreground mb-2">{error}</p>
            <p className="text-xs text-muted-foreground mb-4">
              Make sure your device supports passkeys and try again
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => setStep('options')}>Try Again</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface PasskeyManagerProps {
  onClose?: () => void;
}

export function PasskeyManager({ onClose: _onClose }: PasskeyManagerProps) {
  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
  const [selectedPasskey, setSelectedPasskey] = useState<string | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(true);
  const [preferPasskeys, setPreferPasskeys] = useState(true);
  const [autoPrompt, setAutoPrompt] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load passkeys from backend
  useEffect(() => {
    const loadPasskeys = async () => {
      try {
        setLoading(true);
        const config = await invoke<PasskeyConfig>('get_passkeys');
        const convertedPasskeys = config.passkeys.map(toPasskeyCredential);
        setPasskeys(convertedPasskeys);
      } catch (error) {
        log.error('Failed to load passkeys:', error);
        toast({
          title: 'Error',
          description: 'Failed to load passkeys from backend',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadPasskeys();
  }, [toast]);

  // Check WebAuthn support
  useEffect(() => {
    const checkSupport = async () => {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        setIsSupported(true);
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsPlatformAvailable(available);
        } catch {
          setIsPlatformAvailable(false);
        }
      } else {
        setIsSupported(false);
        setIsPlatformAvailable(false);
      }
    };
    checkSupport();
  }, []);

  const handleRegisterPasskey = useCallback(async (options: Partial<PasskeyRegistrationOptions>) => {
    // Simulate registration - in production this would use WebAuthn API
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const newPasskey: PasskeyCredential = {
      id: `pk-${Date.now()}`,
      credentialId: `cred-${Math.random().toString(36).substring(7)}`,
      publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...',
      algorithm: 'ES256',
      counter: 0,
      transports: options.authenticatorSelection?.authenticatorAttachment === 'platform' 
        ? ['internal'] 
        : ['usb', 'nfc'],
      attachment: options.authenticatorSelection?.authenticatorAttachment || 'platform',
      userVerification: options.authenticatorSelection?.userVerification || 'required',
      displayName: options.userDisplayName || 'New Passkey',
      createdAt: new Date(),
      lastUsedAt: new Date(),
      origin: 'https://app.cube-elite.com',
      rpId: 'cube-elite.com',
      rpName: 'CUBE Elite',
      userId: 'user-123',
      aaguid: '00000000-0000-0000-0000-000000000000',
      deviceInfo: {
        name: navigator.platform || 'Unknown Device',
        platform: navigator.userAgent.includes('Mac') ? 'macOS' : 'Windows',
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
      },
      isBackupEligible: options.authenticatorSelection?.authenticatorAttachment === 'platform',
      isBackedUp: false,
    };

    setPasskeys((prev) => [...prev, newPasskey]);
    toast({
      title: 'Passkey Registered',
      description: `Successfully registered "${newPasskey.displayName}"`,
    });
  }, [toast]);

  const handleDeletePasskey = useCallback(async (id: string) => {
    try {
      await invoke('delete_passkey', { passkeyId: id });
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
      if (selectedPasskey === id) {
        setSelectedPasskey(null);
      }
      toast({
        title: 'Passkey Deleted',
        description: 'The passkey has been removed from your account',
      });
    } catch (error) {
      log.error('Failed to delete passkey:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete passkey',
        variant: 'destructive',
      });
    }
  }, [selectedPasskey, toast]);

  const handleRenamePasskey = useCallback((id: string, newName: string) => {
    setPasskeys((prev) =>
      prev.map((p) => (p.id === id ? { ...p, displayName: newName } : p))
    );
    toast({
      title: 'Passkey Renamed',
      description: `Passkey renamed to "${newName}"`,
    });
  }, [toast]);

  const totalPasskeys = passkeys.length;
  const platformPasskeys = passkeys.filter((p) => p.attachment === 'platform').length;
  const securityKeyPasskeys = passkeys.filter((p) => p.attachment === 'cross-platform').length;
  const backedUpPasskeys = passkeys.filter((p) => p.isBackedUp).length;

  if (loading) {
    return (
      <div className="passkey-manager flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading passkeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="passkey-manager">
      {/* Header */}
      <div className="passkey-manager-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Fingerprint className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Passkey Manager</h2>
            <p className="text-sm text-muted-foreground">
              FIDO2/WebAuthn passwordless authentication
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open('https://passkeys.dev', '_blank')}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Learn More
          </Button>
          <Button onClick={() => setShowRegisterDialog(true)} disabled={!isSupported}>
            <Plus className="h-4 w-4 mr-2" />
            Add Passkey
          </Button>
        </div>
      </div>

      {/* Support Status */}
      {!isSupported && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 mb-4">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                WebAuthn Not Supported
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your browser doesn&apos;t support passkeys. Please use a modern browser like Chrome, Safari, or Firefox.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Key className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{totalPasskeys}</div>
            <p className="text-xs text-muted-foreground">Total Passkeys</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Fingerprint className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{platformPasskeys}</div>
            <p className="text-xs text-muted-foreground">Platform Auth</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Usb className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{securityKeyPasskeys}</div>
            <p className="text-xs text-muted-foreground">Security Keys</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{backedUpPasskeys}</div>
            <p className="text-xs text-muted-foreground">Backed Up</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Passkeys List */}
        <div className="col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Passkeys</CardTitle>
                <Button variant="ghost" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync
                </Button>
              </div>
              <CardDescription>
                Manage your passwordless credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {passkeys.length > 0 ? (
                  <div className="space-y-3">
                    {passkeys.map((passkey) => (
                      <PasskeyCard
                        key={passkey.id}
                        passkey={passkey}
                        onDelete={(id) => setDeleteConfirmId(id)}
                        onRename={handleRenamePasskey}
                        isSelected={selectedPasskey === passkey.id}
                        onSelect={() => setSelectedPasskey(passkey.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Fingerprint className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Passkeys Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first passkey to enable passwordless authentication
                    </p>
                    <Button onClick={() => setShowRegisterDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Passkey
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Passkey Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Prefer Passkeys</Label>
                  <p className="text-xs text-muted-foreground">
                    Use passkeys as the default sign-in method
                  </p>
                </div>
                <Switch
                  checked={preferPasskeys}
                  onCheckedChange={setPreferPasskeys}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Prompt</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically show passkey prompt on login
                  </p>
                </div>
                <Switch
                  checked={autoPrompt}
                  onCheckedChange={setAutoPrompt}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">WebAuthn Support</span>
                {isSupported ? (
                  <Badge className="bg-green-100 text-green-700">
                    <Check className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    Not Available
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Platform Authenticator</span>
                {isPlatformAvailable ? (
                  <Badge className="bg-green-100 text-green-700">
                    <Check className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <X className="h-3 w-3 mr-1" />
                    Not Available
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Conditional UI</span>
                <Badge className="bg-green-100 text-green-700">
                  <Check className="h-3 w-3 mr-1" />
                  Supported
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowRegisterDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Register New Passkey
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Passkeys
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code Sign-in
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Register Dialog */}
      <RegisterPasskeyDialog
        open={showRegisterDialog}
        onOpenChange={setShowRegisterDialog}
        onRegister={handleRegisterPasskey}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Passkey?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this passkey from your account. You won&apos;t be able to use it to sign in anymore.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirmId && handleDeletePasskey(deleteConfirmId)}
            >
              Delete Passkey
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PasskeyManager;
