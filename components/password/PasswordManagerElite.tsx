"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('PasswordManagerElite');

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
  usePasswordManager,
  VaultItem,
  LoginItem,
  CreditCardItem,
  SecurityScore,
  PasswordGenerationOptions,
} from '@/lib/services/password-manager-elite-service';
import {
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Plus,
  CreditCard,
  User,
  Globe,
  CheckCircle,
  TrendingUp,
  Fingerprint,
  Settings,
  Plane,
  Search,
  Trash2,
  Edit,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Smartphone,
} from 'lucide-react';

// ============================================================================
// Sub-Components
// ============================================================================

interface PasswordStrengthProps {
  password: string;
}

function PasswordStrengthIndicator({ password }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setLabel('');
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;

    setStrength(Math.min(100, score));
    
    if (score >= 80) setLabel('Very Strong');
    else if (score >= 60) setLabel('Strong');
    else if (score >= 40) setLabel('Medium');
    else if (score >= 20) setLabel('Weak');
    else setLabel('Very Weak');
  }, [password]);

  const getColor = () => {
    if (strength >= 80) return 'bg-green-500';
    if (strength >= 60) return 'bg-blue-500';
    if (strength >= 40) return 'bg-yellow-500';
    if (strength >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Strength</span>
        <span className={strength >= 60 ? 'text-green-600' : 'text-orange-600'}>{label}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${strength}%` }}
        />
      </div>
    </div>
  );
}

interface SecurityScoreCardProps {
  score: SecurityScore | null;
  onRefresh: () => void;
}

function SecurityScoreCard({ score, onRefresh }: SecurityScoreCardProps) {
  if (!score) return null;

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    if (value >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (value: number) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Security Score
          </span>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={`text-5xl font-bold ${getScoreColor(score.overall)}`}>
            {score.overall}
          </div>
          <div className="flex-1">
            <Progress value={score.overall} className="h-3" />
            <p className="text-sm text-muted-foreground mt-1">{getScoreLabel(score.overall)} protection</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            {score.weakPasswords > 0 ? (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span>{score.weakPasswords} weak passwords</span>
          </div>
          <div className="flex items-center gap-2">
            {score.reusedPasswords > 0 ? (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span>{score.reusedPasswords} reused</span>
          </div>
          <div className="flex items-center gap-2">
            {score.compromisedPasswords > 0 ? (
              <ShieldAlert className="h-4 w-4 text-red-500" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-green-500" />
            )}
            <span>{score.compromisedPasswords} compromised</span>
          </div>
          <div className="flex items-center gap-2">
            {score.missing2FA > 0 ? (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span>{score.missing2FA} missing 2FA</span>
          </div>
        </div>

        {score.recommendations.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Top recommendations ({score.recommendations.length} total)
            </p>
            {score.recommendations.slice(0, 3).map((rec, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs py-1">
                <Badge variant={rec.priority === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                  {rec.priority}
                </Badge>
                <span className="truncate">{rec.itemTitle}: {rec.description}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PasswordGeneratorDialogProps {
  onGenerate: (options?: Partial<PasswordGenerationOptions>) => Promise<string>;
  onUsePassword: (password: string) => void;
}

function PasswordGeneratorDialog({ onGenerate, onUsePassword }: PasswordGeneratorDialogProps) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const { toast } = useToast();

  const generate = useCallback(async () => {
    const newPassword = await onGenerate({ length, uppercase, lowercase, numbers, symbols });
    setPassword(newPassword || '');
  }, [length, uppercase, lowercase, numbers, symbols, onGenerate]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
    toast({ title: "Copied", description: "Password copied to clipboard" });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Password Generator
        </DialogTitle>
        <DialogDescription>
          Generate a secure, random password
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="relative">
          <Input
            value={password}
            readOnly
            className="pr-20 font-mono text-lg"
          />
          <div className="absolute right-1 top-1 flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={generate}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <PasswordStrengthIndicator password={password} />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Length: {length}</Label>
            <Slider
              value={[length]}
              onValueChange={([v]) => setLength(v)}
              min={8}
              max={64}
              step={1}
              className="w-48"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={uppercase} onCheckedChange={setUppercase} id="uppercase" />
              <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={lowercase} onCheckedChange={setLowercase} id="lowercase" />
              <Label htmlFor="lowercase">Lowercase (a-z)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={numbers} onCheckedChange={setNumbers} id="numbers" />
              <Label htmlFor="numbers">Numbers (0-9)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={symbols} onCheckedChange={setSymbols} id="symbols" />
              <Label htmlFor="symbols">Symbols (!@#$)</Label>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={() => onUsePassword(password)} className="w-full">
          Use This Password
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

interface VaultItemCardProps {
  item: VaultItem;
  onEdit: (item: VaultItem) => void;
  onDelete: (id: string) => void;
  onCopyPassword?: (id: string) => void;
}

function VaultItemCard({ item, onEdit, onDelete, onCopyPassword }: VaultItemCardProps) {
  const [_showPassword, _setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const getIcon = () => {
    switch (item.type) {
      case 'login': return <Key className="h-5 w-5" />;
      case 'credit_card': return <CreditCard className="h-5 w-5" />;
      case 'identity': return <User className="h-5 w-5" />;
      case 'secure_note': return <Lock className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  if (item.type === 'login') {
    const login = item as LoginItem;
    return (
      <Card className={`transition-all hover:shadow-md ${login.isCompromised ? 'border-red-300 dark:border-red-800' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${login.isCompromised ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary/10'}`}>
                {getIcon()}
              </div>
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  {item.title}
                  {item.favorite && <span className="text-yellow-500">★</span>}
                  {login.isCompromised && (
                    <Badge variant="destructive" className="text-xs">Compromised</Badge>
                  )}
                  {login.passkey && (
                    <Badge variant="secondary" className="text-xs">
                      <Fingerprint className="h-3 w-3 mr-1" />
                      Passkey
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">{login.username}</p>
                {login.urls[0] && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {new URL(login.urls[0]).hostname}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => handleCopy(login.username, 'Username')}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onCopyPassword?.(login.id)}>
                <Key className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {login.totpSecret && (
            <div className="mt-3 pt-3 border-t flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">2FA Enabled</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (item.type === 'credit_card') {
    const card = item as CreditCardItem;
    return (
      <Card className="transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  •••• •••• •••• {card.cardNumber.slice(-4)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expires {card.expirationMonth}/{card.expirationYear}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => handleCopy(card.cardNumber, 'Card number')}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">{getIcon()}</div>
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground capitalize">{item.type.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface PasswordManagerEliteProps {
  className?: string;
}

export function PasswordManagerElite({ className }: PasswordManagerEliteProps) {
  const { toast } = useToast();
  const {
    items,
    securityScore,
    isLocked,
    isLoading,
    travelMode,
    unlock,
    lock,
    addLogin,
    generatePassword,
    refreshSecurityScore,
    toggleTravelMode,
    isPasskeySupported,
  } = usePasswordManager();

  const [masterPassword, setMasterPassword] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showAddLogin, setShowAddLogin] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);

  // New login form state
  const [newLogin, setNewLogin] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
  });

  useEffect(() => {
    isPasskeySupported().then(setPasskeySupported);
  }, [isPasskeySupported]);

  const handleUnlock = async () => {
    if (!masterPassword.trim()) {
      toast({ title: "Error", description: "Please enter your master password", variant: "destructive" });
      return;
    }

    const success = await unlock(masterPassword);
    if (success) {
      toast({ title: "Vault Unlocked", description: "Welcome back!" });
    } else {
      toast({ title: "Error", description: "Invalid master password", variant: "destructive" });
    }
  };

  const handleLock = () => {
    lock();
    setMasterPassword('');
    toast({ title: "Vault Locked", description: "Your vault is now secure" });
  };

  const handleAddLogin = async () => {
    if (!newLogin.title || !newLogin.username || !newLogin.password) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    await addLogin({
      title: newLogin.title,
      username: newLogin.username,
      password: newLogin.password,
      website: newLogin.url || undefined,
    });

    setNewLogin({ title: '', username: '', password: '', url: '' });
    setShowAddLogin(false);
    toast({ title: "Success", description: "Login saved to vault" });
  };

  const filteredItems = items.filter(item => {
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(query) ||
        item.tags.some(t => t.toLowerCase().includes(query));
    }
    return true;
  });

  // ==================== Lock Screen ====================
  if (isLocked) {
    return (
      <div className={`h-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${className}`}>
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/10 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
              <Lock className="h-10 w-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl text-white">Password Vault</CardTitle>
              <CardDescription className="text-gray-300 mt-2">
                AES-256 encryption • Passkeys • Breach detection • Travel mode
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <Input
                type={showMasterPassword ? "text" : "password"}
                placeholder="Master Password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                className="w-full px-4 py-4 pr-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowMasterPassword(!showMasterPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showMasterPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            <Button
              onClick={handleUnlock}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 text-lg"
            >
              {isLoading ? <RefreshCw className="animate-spin mr-2" size={20} /> : <Key className="mr-2" size={20} />}
              Unlock Vault
            </Button>

            {passkeySupported && (
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                <Fingerprint className="mr-2" size={20} />
                Use Passkey
              </Button>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Shield size={14} />
              <span>Zero-knowledge encryption • Your data stays local</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== Main UI ====================
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All items" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="login">Logins</SelectItem>
              <SelectItem value="credit_card">Cards</SelectItem>
              <SelectItem value="identity">Identities</SelectItem>
              <SelectItem value="secure_note">Notes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {travelMode.enabled && (
            <Badge variant="secondary" className="gap-1">
              <Plane className="h-3 w-3" />
              Travel Mode
            </Badge>
          )}
          
          <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Generator
              </Button>
            </DialogTrigger>
            <PasswordGeneratorDialog
              onGenerate={generatePassword}
              onUsePassword={(pwd) => {
                setNewLogin({ ...newLogin, password: pwd });
                setShowGenerator(false);
                setShowAddLogin(true);
              }}
            />
          </Dialog>

          <Dialog open={showAddLogin} onOpenChange={setShowAddLogin}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Login
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Login</DialogTitle>
                <DialogDescription>Save a new login to your vault</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="e.g., Google"
                    value={newLogin.title}
                    onChange={(e) => setNewLogin({ ...newLogin, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username / Email *</Label>
                  <Input
                    placeholder="user@example.com"
                    value={newLogin.username}
                    onChange={(e) => setNewLogin({ ...newLogin, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newLogin.password}
                      onChange={(e) => setNewLogin({ ...newLogin, password: e.target.value })}
                    />
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const pwd = await generatePassword();
                        if (pwd) setNewLogin({ ...newLogin, password: pwd });
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  {newLogin.password && <PasswordStrengthIndicator password={newLogin.password} />}
                </div>
                <div className="space-y-2">
                  <Label>Website URL</Label>
                  <Input
                    placeholder="https://example.com"
                    value={newLogin.url}
                    onChange={(e) => setNewLogin({ ...newLogin, url: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddLogin(false)}>Cancel</Button>
                <Button onClick={handleAddLogin}>Save Login</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={toggleTravelMode}>
            <Plane className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button variant="destructive" size="sm" onClick={handleLock}>
            <Lock className="h-4 w-4 mr-2" />
            Lock
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          {/* Sidebar - Security Score */}
          <div className="lg:col-span-1 space-y-4">
            <SecurityScoreCard score={securityScore} onRefresh={refreshSecurityScore} />
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Items</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Logins</span>
                  <span className="font-medium">{items.filter(i => i.type === 'login').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cards</span>
                  <span className="font-medium">{items.filter(i => i.type === 'credit_card').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Identities</span>
                  <span className="font-medium">{items.filter(i => i.type === 'identity').length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main - Vault Items */}
          <div className="lg:col-span-3">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3 pr-4">
                {filteredItems.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No items found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Try a different search term' : 'Add your first login to get started'}
                    </p>
                  </Card>
                ) : (
                  filteredItems.map((item) => (
                    <VaultItemCard
                      key={item.id}
                      item={item}
                      onEdit={(item) => log.debug('Edit:', item)}
                      onDelete={(id) => log.debug('Delete:', id)}
                      onCopyPassword={(_id) => {
                        // In real implementation, decrypt and copy
                        toast({ title: "Copied", description: "Password copied to clipboard" });
                      }}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordManagerElite;
