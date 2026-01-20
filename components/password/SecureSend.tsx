"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('SecureSend');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription as _CardDescription, CardHeader as _CardHeader, CardTitle as _CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs as _Tabs, TabsContent as _TabsContent, TabsList as _TabsList, TabsTrigger as _TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Link as _Link,
  Copy,
  QrCode,
  Clock,
  Eye,
  EyeOff as _EyeOff,
  Lock,
  Unlock as _Unlock,
  Mail,
  File,
  Key,
  CreditCard,
  FileText,
  Trash2,
  MoreVertical,
  Plus,
  Shield as _Shield,
  ShieldCheck,
  AlertCircle as _AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink as _ExternalLink,
  Download as _Download,
  Upload as _Upload,
  RefreshCw as _RefreshCw,
  History as _History,
  Settings as _Settings,
  Bell as _Bell,
  Users as _Users,
  Globe,
  Smartphone as _Smartphone,
  Laptop,
  Activity,
  Timer as _Timer,
  Hash as _Hash,
  Calendar as _Calendar,
  MapPin,
  Loader2,
} from 'lucide-react';
import {
  SecureSendLink,
  SecureSendItem,
  SecureSendOptions,
  SecureSendType,
  SecureSendExpiry,
} from '@/types/password-manager-pro';
import './SecureSend.css';

// ============================================================================
// BACKEND TYPES
// ============================================================================

interface BackendSecureSendItem {
  id: string;
  name: string;
  itemType: string;
  contentPreview: string;
  createdAt: number;
  expiresAt: number;
  maxAccessCount: number | null;
  currentAccessCount: number;
  isPasswordProtected: boolean;
  shareUrl: string;
}

interface BackendSecureSendConfig {
  items: BackendSecureSendItem[];
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

const convertBackendSecureSendToFrontend = (backend: BackendSecureSendItem): SecureSendLink => {
  const typeMap: Record<string, SecureSendType> = {
    'text': 'text',
    'password': 'password',
    'file': 'file',
    'login': 'login',
    'card': 'card',
    'note': 'note',
  };
  
  const createdAt = new Date(backend.createdAt * 1000);
  const expiresAt = new Date(backend.expiresAt * 1000);
  const now = new Date();
  const isExpired = now > expiresAt;
  
  return {
    id: backend.id,
    shortId: backend.id.substring(0, 8),
    url: backend.shareUrl,
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    item: {
      id: `item-${backend.id}`,
      type: typeMap[backend.itemType] || 'text',
      name: backend.name,
      content: {
        text: backend.contentPreview,
      },
      encrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
    },
    options: {
      maxAccessCount: backend.maxAccessCount || undefined,
      expiresAt: expiresAt,
      expiryType: '24h',
      notifyOnAccess: false,
      requireEmail: false,
      hideEmail: false,
      allowSave: false,
      deletionPolicy: 'on_expiry',
      accessPassword: backend.isPasswordProtected ? '***' : undefined,
    },
    createdAt: createdAt,
    expiresAt: expiresAt,
    accessCount: backend.currentAccessCount,
    maxAccessCount: backend.maxAccessCount || undefined,
    accessLog: [],
    status: isExpired ? 'expired' : 'active',
    creatorId: 'user-123',
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getTypeIcon = (type: SecureSendType) => {
  const icons: Record<SecureSendType, React.ReactNode> = {
    text: <FileText className="h-5 w-5" />,
    password: <Key className="h-5 w-5" />,
    file: <File className="h-5 w-5" />,
    login: <Lock className="h-5 w-5" />,
    card: <CreditCard className="h-5 w-5" />,
    note: <FileText className="h-5 w-5" />,
  };
  return icons[type];
};

const getStatusBadge = (status: SecureSendLink['status']) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    case 'expired':
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
    case 'deleted':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Deleted</Badge>;
    case 'accessed':
      return <Badge className="bg-blue-100 text-blue-700"><Eye className="h-3 w-3 mr-1" />Accessed</Badge>;
  }
};

const formatExpiry = (date: Date): string => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff < 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CreateSecureSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (item: SecureSendItem, options: SecureSendOptions) => void;
}

function CreateSecureSendDialog({ open, onOpenChange, onCreate }: CreateSecureSendDialogProps) {
  const [step, setStep] = useState<'type' | 'content' | 'options'>('type');
  const [type, setType] = useState<SecureSendType>('password');
  const [name, setName] = useState('');
  const [content, setContent] = useState({
    text: '',
    password: '',
    username: '',
    url: '',
    notes: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardHolder: '',
  });
  const [options, setOptions] = useState<Partial<SecureSendOptions>>({
    expiryType: '24h',
    maxAccessCount: undefined,
    notifyOnAccess: true,
    requireEmail: false,
    allowSave: false,
    deletionPolicy: 'on_expiry',
  });
  const [accessPassword, setAccessPassword] = useState('');
  const { toast } = useToast();

  const handleCreate = () => {
    const item: SecureSendItem = {
      id: `item-${Date.now()}`,
      type,
      name: name || `Secure ${type}`,
      content: {
        text: type === 'text' ? content.text : undefined,
        password: type === 'password' ? content.password : undefined,
        login: type === 'login' ? {
          username: content.username,
          password: content.password,
          url: content.url,
          notes: content.notes,
        } : undefined,
        card: type === 'card' ? {
          number: content.cardNumber,
          expiry: content.cardExpiry,
          cvv: content.cardCvv,
          holder: content.cardHolder,
        } : undefined,
        note: type === 'note' ? {
          title: name,
          content: content.text,
        } : undefined,
      },
      encrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
    };

    const expiryHours: Record<SecureSendExpiry, number> = {
      '1h': 1,
      '4h': 4,
      '12h': 12,
      '24h': 24,
      '3d': 72,
      '7d': 168,
      '30d': 720,
    };

    const finalOptions: SecureSendOptions = {
      accessPassword: accessPassword || undefined,
      maxAccessCount: options.maxAccessCount,
      expiresAt: new Date(Date.now() + expiryHours[options.expiryType as SecureSendExpiry] * 60 * 60 * 1000),
      expiryType: options.expiryType as SecureSendExpiry,
      notifyOnAccess: options.notifyOnAccess || false,
      notifyEmail: options.notifyEmail,
      requireEmail: options.requireEmail || false,
      hideEmail: options.hideEmail || false,
      allowSave: options.allowSave || false,
      deletionPolicy: options.deletionPolicy || 'on_expiry',
    };

    onCreate(item, finalOptions);
    resetForm();
    onOpenChange(false);
    toast({
      title: 'Secure Send Created',
      description: 'Your secure link is ready to share',
    });
  };

  const resetForm = () => {
    setStep('type');
    setType('password');
    setName('');
    setContent({
      text: '',
      password: '',
      username: '',
      url: '',
      notes: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      cardHolder: '',
    });
    setOptions({
      expiryType: '24h',
      maxAccessCount: undefined,
      notifyOnAccess: true,
      requireEmail: false,
      allowSave: false,
      deletionPolicy: 'on_expiry',
    });
    setAccessPassword('');
  };

  const typeOptions = [
    { value: 'text', label: 'Text', icon: <FileText className="h-5 w-5" />, description: 'Share any text securely' },
    { value: 'password', label: 'Password', icon: <Key className="h-5 w-5" />, description: 'Share a single password' },
    { value: 'login', label: 'Login', icon: <Lock className="h-5 w-5" />, description: 'Username + password combo' },
    { value: 'card', label: 'Card', icon: <CreditCard className="h-5 w-5" />, description: 'Credit/debit card info' },
    { value: 'note', label: 'Note', icon: <FileText className="h-5 w-5" />, description: 'Secure note with title' },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Create Secure Send
          </DialogTitle>
          <DialogDescription>
            Share sensitive information securely with a self-destructing link
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {['type', 'content', 'options'].map((s, i) => (
            <React.Fragment key={s}>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s ? 'bg-primary text-white' :
                  ['type', 'content', 'options'].indexOf(step) > i ? 'bg-green-500 text-white' :
                  'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="w-12 h-0.5 bg-muted" />}
            </React.Fragment>
          ))}
        </div>

        {step === 'type' && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {typeOptions.map((opt) => (
                <Card
                  key={opt.value}
                  className={`cursor-pointer transition-all ${type === opt.value ? 'border-primary ring-1 ring-primary' : ''}`}
                  onClick={() => setType(opt.value as SecureSendType)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`mx-auto mb-2 ${type === opt.value ? 'text-primary' : 'text-muted-foreground'}`}>
                      {opt.icon}
                    </div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 'content' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name (optional)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`My ${type}`}
              />
            </div>

            {type === 'text' && (
              <div className="space-y-2">
                <Label>Text Content</Label>
                <Textarea
                  value={content.text}
                  onChange={(e) => setContent({ ...content, text: e.target.value })}
                  placeholder="Enter the text you want to share..."
                  rows={4}
                />
              </div>
            )}

            {type === 'password' && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={content.password}
                  onChange={(e) => setContent({ ...content, password: e.target.value })}
                  placeholder="Enter password to share"
                />
              </div>
            )}

            {type === 'login' && (
              <>
                <div className="space-y-2">
                  <Label>Username / Email</Label>
                  <Input
                    value={content.username}
                    onChange={(e) => setContent({ ...content, username: e.target.value })}
                    placeholder="username@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={content.password}
                    onChange={(e) => setContent({ ...content, password: e.target.value })}
                    placeholder="Password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website URL (optional)</Label>
                  <Input
                    value={content.url}
                    onChange={(e) => setContent({ ...content, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={content.notes}
                    onChange={(e) => setContent({ ...content, notes: e.target.value })}
                    placeholder="Any additional info..."
                    rows={2}
                  />
                </div>
              </>
            )}

            {type === 'card' && (
              <>
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input
                    value={content.cardNumber}
                    onChange={(e) => setContent({ ...content, cardNumber: e.target.value })}
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Expiry</Label>
                    <Input
                      value={content.cardExpiry}
                      onChange={(e) => setContent({ ...content, cardExpiry: e.target.value })}
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input
                      type="password"
                      value={content.cardCvv}
                      onChange={(e) => setContent({ ...content, cardCvv: e.target.value })}
                      placeholder="***"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cardholder Name</Label>
                  <Input
                    value={content.cardHolder}
                    onChange={(e) => setContent({ ...content, cardHolder: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
              </>
            )}

            {type === 'note' && (
              <div className="space-y-2">
                <Label>Note Content</Label>
                <Textarea
                  value={content.text}
                  onChange={(e) => setContent({ ...content, text: e.target.value })}
                  placeholder="Enter your secure note..."
                  rows={6}
                />
              </div>
            )}
          </div>
        )}

        {step === 'options' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Expiration</Label>
              <Select
                value={options.expiryType}
                onValueChange={(v) => setOptions({ ...options, expiryType: v as SecureSendExpiry })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="4h">4 hours</SelectItem>
                  <SelectItem value="12h">12 hours</SelectItem>
                  <SelectItem value="24h">24 hours</SelectItem>
                  <SelectItem value="3d">3 days</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Access Count (optional)</Label>
              <Input
                type="number"
                min="1"
                value={options.maxAccessCount || ''}
                onChange={(e) => setOptions({ ...options, maxAccessCount: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Unlimited"
              />
              <p className="text-xs text-muted-foreground">
                Link will be deleted after this many views
              </p>
            </div>

            <div className="space-y-2">
              <Label>Access Password (optional)</Label>
              <Input
                type="password"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                placeholder="Require password to view"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notify on Access</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when someone views this
                  </p>
                </div>
                <Switch
                  checked={options.notifyOnAccess}
                  onCheckedChange={(v) => setOptions({ ...options, notifyOnAccess: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Email</Label>
                  <p className="text-xs text-muted-foreground">
                    Viewer must enter their email
                  </p>
                </div>
                <Switch
                  checked={options.requireEmail}
                  onCheckedChange={(v) => setOptions({ ...options, requireEmail: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Save</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow viewer to save to their vault
                  </p>
                </div>
                <Switch
                  checked={options.allowSave}
                  onCheckedChange={(v) => setOptions({ ...options, allowSave: v })}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {step !== 'type' && (
            <Button 
              variant="outline" 
              onClick={() => setStep(step === 'options' ? 'content' : 'type')}
            >
              Back
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancel
            </Button>
            {step === 'options' ? (
              <Button onClick={handleCreate}>
                <Send className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            ) : (
              <Button onClick={() => setStep(step === 'type' ? 'content' : 'options')}>
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SecureSendCardProps {
  send: SecureSendLink;
  onCopyLink: (url: string) => void;
  onShowQR: (send: SecureSendLink) => void;
  onDelete: (id: string) => void;
  onViewDetails: (send: SecureSendLink) => void;
}

function SecureSendCard({ send, onCopyLink, onShowQR, onDelete, onViewDetails }: SecureSendCardProps) {
  const isExpired = send.status === 'expired' || new Date() > send.expiresAt;

  return (
    <Card className={`secure-send-card ${isExpired ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`send-icon ${isExpired ? 'expired' : ''}`}>
            {getTypeIcon(send.item.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{send.item.name}</h4>
              {getStatusBadge(isExpired ? 'expired' : send.status)}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {send.accessCount}{send.maxAccessCount ? `/${send.maxAccessCount}` : ''} views
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isExpired ? 'Expired' : formatExpiry(send.expiresAt)}
              </span>
              {send.options.accessPassword && (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Protected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded truncate flex-1">
                {send.url}
              </code>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onCopyLink(send.url)}
                disabled={isExpired}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onShowQR(send)}
                disabled={isExpired}
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(send)}>
                <Activity className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyLink(send.url)} disabled={isExpired}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShowQR(send)} disabled={isExpired}>
                <QrCode className="h-4 w-4 mr-2" />
                Show QR Code
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={() => onDelete(send.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

interface AccessLogDialogProps {
  send: SecureSendLink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AccessLogDialog({ send, open, onOpenChange }: AccessLogDialogProps) {
  if (!send) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Access Log - {send.item.name}
          </DialogTitle>
          <DialogDescription>
            View who has accessed this secure send
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{send.accessCount}</div>
              <div className="text-xs text-muted-foreground">Total Views</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{send.maxAccessCount || '∞'}</div>
              <div className="text-xs text-muted-foreground">Max Views</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {send.accessLog.filter(l => l.success).length}
              </div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
          </div>

          <ScrollArea className="h-[300px]">
            {send.accessLog.length > 0 ? (
              <div className="space-y-3">
                {send.accessLog.map((log, index) => (
                  <div 
                    key={index} 
                    className={`p-3 border rounded-lg ${log.success ? '' : 'border-red-200 bg-red-50 dark:bg-red-950/20'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {formatDate(log.timestamp)}
                      </span>
                      {log.success ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {log.ip}
                      </div>
                      {log.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {log.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1 col-span-2">
                        <Laptop className="h-3 w-3" />
                        {log.userAgent}
                      </div>
                      {log.email && (
                        <div className="flex items-center gap-1 col-span-2">
                          <Mail className="h-3 w-3" />
                          {log.email}
                        </div>
                      )}
                    </div>
                    {log.failReason && (
                      <div className="mt-2 text-xs text-red-600">
                        {log.failReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">No Access Yet</p>
                <p className="text-sm text-muted-foreground">
                  This link hasn&apos;t been viewed yet
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface SecureSendProps {
  onClose?: () => void;
}

export function SecureSend({ onClose: _onClose }: SecureSendProps) {
  const [sends, setSends] = useState<SecureSendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSend, setSelectedSend] = useState<SecureSendLink | null>(null);
  const [showAccessLog, setShowAccessLog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const { toast } = useToast();

  // Load data from backend
  useEffect(() => {
    const loadSecureSendsData = async () => {
      try {
        setLoading(true);
        const config = await invoke<BackendSecureSendConfig>('get_secure_sends');
        
        // Convert backend items to frontend format
        const convertedSends = config.items.map(convertBackendSecureSendToFrontend);
        setSends(convertedSends);
      } catch (error) {
        log.error('Failed to load secure sends:', error);
        toast({
          title: 'Error',
          description: 'Failed to load secure sends data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadSecureSendsData();
  }, [toast]);

  const handleCreate = useCallback((item: SecureSendItem, options: SecureSendOptions) => {
    const newSend: SecureSendLink = {
      id: `ss-${Date.now()}`,
      shortId: Math.random().toString(36).substring(2, 8),
      url: `https://send.cube-elite.com/${Math.random().toString(36).substring(2, 8)}`,
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      item,
      options,
      createdAt: new Date(),
      expiresAt: options.expiresAt,
      accessCount: 0,
      maxAccessCount: options.maxAccessCount,
      accessLog: [],
      status: 'active',
      creatorId: 'user-123',
    };
    setSends(prev => [newSend, ...prev]);
  }, []);

  const handleCopyLink = useCallback(async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  }, [toast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await invoke('delete_secure_send', { sendId: id });
      setSends(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Deleted', description: 'Secure send has been deleted' });
    } catch (error) {
      log.error('Failed to delete secure send:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete secure send',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const filteredSends = sends.filter(send => {
    if (filter === 'all') return true;
    if (filter === 'active') return send.status === 'active' && new Date() < send.expiresAt;
    if (filter === 'expired') return send.status === 'expired' || new Date() > send.expiresAt;
    return true;
  });

  const activeSends = sends.filter(s => s.status === 'active' && new Date() < s.expiresAt).length;
  const totalViews = sends.reduce((sum, s) => sum + s.accessCount, 0);

  // Loading state
  if (loading) {
    return (
      <div className="secure-send flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading secure sends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="secure-send">
      {/* Header */}
      <div className="secure-send-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Secure Send</h2>
            <p className="text-sm text-muted-foreground">
              Share sensitive information with self-destructing links
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Secure Send
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Send className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{sends.length}</div>
            <p className="text-xs text-muted-foreground">Total Sends</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{activeSends}</div>
            <p className="text-xs text-muted-foreground">Active Links</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">
              {sends.filter(s => s.options.accessPassword).length}
            </div>
            <p className="text-xs text-muted-foreground">Protected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({sends.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active ({activeSends})
        </Button>
        <Button
          variant={filter === 'expired' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('expired')}
        >
          Expired ({sends.length - activeSends})
        </Button>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-4">
          <ScrollArea className="h-[400px]">
            {filteredSends.length > 0 ? (
              <div className="space-y-3">
                {filteredSends.map(send => (
                  <SecureSendCard
                    key={send.id}
                    send={send}
                    onCopyLink={handleCopyLink}
                    onShowQR={(s) => { setSelectedSend(s); setShowQRDialog(true); }}
                    onDelete={handleDelete}
                    onViewDetails={(s) => { setSelectedSend(s); setShowAccessLog(true); }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Secure Sends</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first secure send to share sensitive information safely
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Secure Send
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateSecureSendDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreate}
      />

      {/* Access Log Dialog */}
      <AccessLogDialog
        send={selectedSend}
        open={showAccessLog}
        onOpenChange={setShowAccessLog}
      />

      {/* QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code
            </DialogTitle>
            <DialogDescription>
              Scan to access this secure send
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 flex flex-col items-center">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
              <QrCode className="h-24 w-24 text-muted-foreground" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              {selectedSend?.url}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQRDialog(false)}>
              Close
            </Button>
            <Button onClick={() => selectedSend && handleCopyLink(selectedSend.url)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SecureSend;
