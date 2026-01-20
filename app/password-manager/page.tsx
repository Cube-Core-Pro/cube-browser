"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import { AppLayout } from "@/components/layout";
import { PasswordVault } from "@/components/password/PasswordVault";
import { PasswordGenerator } from "@/components/password/PasswordGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  Shield, Key, Lock, AlertTriangle, Eye, EyeOff, 
  RefreshCw, Copy, Plus, Smartphone, Clock,
  CheckCircle, XCircle, TrendingUp, Fingerprint, 
  QrCode, Settings, CreditCard, FileText
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { invoke } from "@tauri-apps/api/core";
import { 
  MasterPasswordService, 
  PasswordVaultService, 
  PasswordEntry as _ServicePasswordEntry,
  PasswordStats as _PasswordStats 
} from "@/lib/services/password-service";

// ==================== Types ====================
interface SecurityReport {
  score: number;
  totalPasswords: number;
  weakPasswords: number;
  reusedPasswords: number;
  oldPasswords: number;
  compromisedPasswords: number;
  totpEnabled: number;
}

interface TotpEntry {
  id: string;
  name: string;
  title: string;
  username: string;
  totpSecret: string;
}

// ==================== Component ====================
export default function PasswordManagerPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLocked, setIsLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState("");
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [_error, _setError] = useState<string | null>(null);
  
  // Stats
  const [totalPasswords, setTotalPasswords] = useState(0);
  const [weakPasswords, setWeakPasswords] = useState(0);
  const [securityScore, setSecurityScore] = useState(0);
  
  // Security Report (Watchtower-like)
  const [securityReport, setSecurityReport] = useState<SecurityReport | null>(null);
  const [showSecurityReport, setShowSecurityReport] = useState(false);
  
  // TOTP
  const [totpEntries, setTotpEntries] = useState<TotpEntry[]>([]);
  const [totpCodes, setTotpCodes] = useState<Map<string, string>>(new Map());
  const [totpCountdown, setTotpCountdown] = useState(30);
  
  // Biometric
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // ==================== Effects ====================
  
  // TOTP countdown timer
  useEffect(() => {
    if (!isLocked && totpEntries.length > 0) {
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const remaining = 30 - (now % 30);
        setTotpCountdown(remaining);
        if (remaining === 30) generateTotpCodes();
      }, 1000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, totpEntries]);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  // ==================== Functions ====================
  
  const checkBiometricAvailability = async () => {
    try {
      const available = await invoke<boolean>('check_biometric_available');
      setBiometricAvailable(available);
      if (available) {
        const enabled = localStorage.getItem('biometric_enabled') === 'true';
        setBiometricEnabled(enabled);
      }
    } catch (_error) {
      log.debug('Biometric not available');
    }
  };

  const handleUnlock = async () => {
    if (!masterPassword.trim()) {
      toast({ title: "Error", description: "Please enter your master password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const isValid = await MasterPasswordService.verify(masterPassword);
      if (!isValid) throw new Error('Invalid master password');
      setIsLocked(false);
      loadAllData();
      toast({ title: "Vault Unlocked", description: "Your password vault is now accessible" });
    } catch (error) {
      toast({ title: "Unlock Failed", description: error instanceof Error ? error.message : "Invalid master password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    try {
      const authenticated = await invoke<boolean>('authenticate_biometric');
      if (authenticated) {
        const savedPassword = await invoke<string>('get_saved_master_password');
        setMasterPassword(savedPassword);
        setIsLocked(false);
        loadAllData();
        toast({ title: "Vault Unlocked", description: "Biometric authentication successful" });
      }
    } catch (_error) {
      toast({ title: "Biometric Failed", description: "Please use your master password", variant: "destructive" });
    }
  };

  const loadAllData = async () => {
    await Promise.all([loadStats(), loadSecurityReport(), loadTotpEntries()]);
  };

  const loadStats = async () => {
    try {
      const stats = await PasswordVaultService.getStats();
      setTotalPasswords(stats.total_passwords);
      setWeakPasswords(stats.weak_passwords);
      const totalStrong = stats.total_passwords - stats.weak_passwords;
      const score = stats.total_passwords > 0 
        ? Math.round((totalStrong / stats.total_passwords) * 100) 
        : 100;
      setSecurityScore(score);
    } catch (error) {
      log.error('Failed to load stats:', error);
    }
  };

  const loadSecurityReport = async () => {
    try {
      const report = await PasswordVaultService.getSecurityReport();
      setSecurityReport({ 
        score: report.score, 
        totalPasswords: report.totalPasswords, 
        weakPasswords: report.weakPasswords, 
        reusedPasswords: report.reusedPasswords, 
        oldPasswords: report.oldPasswords,
        compromisedPasswords: report.compromisedPasswords,
        totpEnabled: report.totpEnabled
      });
    } catch (error) {
      log.error('Failed to load security report:', error);
    }
  };

  const loadTotpEntries = async () => {
    try {
      // TOTP entries would need a separate field in the model
      // For now, we'll leave this empty until TOTP support is added
      setTotpEntries([]);
    } catch (error) {
      log.error('Failed to load TOTP entries:', error);
    }
  };

  const generateTotpCodes = useCallback(async () => {
    const codes = new Map<string, string>();
    for (const entry of totpEntries) {
      if (entry.totpSecret) {
        try {
          const code = await invoke<string>('generate_totp', { secret: entry.totpSecret });
          codes.set(entry.id, code);
        } catch (_error) {
          codes.set(entry.id, '------');
        }
      }
    }
    setTotpCodes(codes);
  }, [totpEntries]);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  // ==================== Lock Screen ====================
  if (isLocked) {
    return (
      <AppLayout tier="elite">
        <div className="h-full w-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <Card className="w-full max-w-md border-0 shadow-2xl bg-white/10 backdrop-blur-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                <Lock className="h-10 w-10 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl text-white">Password Vault</CardTitle>
                <CardDescription className="text-gray-300 mt-2">
                  AES-256-GCM encryption • Inline autofill • TOTP • Passkeys • Phishing protection
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
                  className="w-full px-4 py-4 pr-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 text-lg"
                />
                <button type="button" onClick={() => setShowMasterPassword(!showMasterPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showMasterPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <Button onClick={handleUnlock} disabled={loading} className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 text-lg font-semibold hover:opacity-90 shadow-lg shadow-purple-500/30">
                {loading ? <RefreshCw className="animate-spin mr-2" size={20} /> : <Key className="mr-2" size={20} />}
                Unlock Vault
              </Button>
              {biometricAvailable && biometricEnabled && (
                <>
                  <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/20" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-gray-400">or</span></div></div>
                  <Button variant="outline" onClick={handleBiometricUnlock} className="w-full border-white/20 text-white hover:bg-white/10">
                    <Fingerprint className="mr-2" size={20} />Use Touch ID / Face ID
                  </Button>
                </>
              )}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Shield size={14} /><span>Zero-knowledge encryption • Your data never leaves your device</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // ==================== Main UI ====================
  return (
    <AppLayout tier="elite">
      <div className="h-full w-full p-6 space-y-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500"><Shield className="h-6 w-6 text-white" /></div>
              {t('passwordManager.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('passwordManager.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSecurityReport(true)}><TrendingUp size={16} className="mr-2" />{t('passwordManager.actions.securityReport')}</Button>
            <Button variant="outline" size="sm"><Settings size={16} className="mr-2" />{t('common.settings')}</Button>
            <Button variant="destructive" size="sm" onClick={() => { setIsLocked(true); setMasterPassword(""); }}><Lock size={16} className="mr-2" />{t('passwordManager.actions.lock')}</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(securityScore)}`}>{securityScore}%</div>
              <Progress value={securityScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(securityScore)} protection</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Passwords</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalPasswords}</div>
              <p className="text-xs text-muted-foreground">Encrypted & secure</p>
            </CardContent>
          </Card>

          <Card className={weakPasswords > 0 ? "border-orange-200 dark:border-orange-800" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weak Passwords</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${weakPasswords > 0 ? 'text-orange-500' : 'text-green-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${weakPasswords > 0 ? 'text-orange-500' : 'text-green-600'}`}>{weakPasswords}</div>
              <p className="text-xs text-muted-foreground">{weakPasswords > 0 ? 'Need attention' : 'All strong'}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">2FA Codes</CardTitle>
              <Smartphone className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{totpEntries.length}</div>
              <p className="text-xs text-green-600">TOTP authenticator active</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="vault" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="vault" className="flex items-center gap-2"><Key size={16} />Vault</TabsTrigger>
            <TabsTrigger value="authenticator" className="flex items-center gap-2"><Smartphone size={16} />Authenticator</TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-2"><RefreshCw size={16} />Generator</TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-2"><CreditCard size={16} />Cards</TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2"><FileText size={16} />Secure Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="vault" className="space-y-4 mt-4">
            <PasswordVault masterPassword={masterPassword} onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="authenticator" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" />Two-Factor Authentication</CardTitle>
                    <CardDescription>Generate time-based one-time passwords (TOTP)</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200" />
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={`${(totpCountdown / 30) * 125.6} 125.6`} className={totpCountdown <= 5 ? "text-red-500" : "text-blue-500"} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{totpCountdown}</span>
                    </div>
                    <Button size="sm"><Plus size={16} className="mr-2" />Add Account</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {totpEntries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No authenticator entries yet</p>
                    <p className="text-sm">Scan a QR code or enter a setup key to add 2FA</p>
                    <Button className="mt-4"><QrCode size={16} className="mr-2" />Scan QR Code</Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {totpEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">{entry.title.charAt(0).toUpperCase()}</div>
                          <div><p className="font-medium">{entry.title}</p><p className="text-xs text-muted-foreground">{entry.username}</p></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-mono font-bold tracking-widest">{totpCodes.get(entry.id) || '------'}</span>
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(totpCodes.get(entry.id) || '', 'Code')}><Copy size={16} /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generator" className="space-y-4 mt-4">
            <PasswordGenerator />
          </TabsContent>

          <TabsContent value="cards" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Payment Cards</CardTitle><CardDescription>Securely store and autofill payment information</CardDescription></div>
                  <Button size="sm"><Plus size={16} className="mr-2" />Add Card</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No cards saved yet</p>
                  <p className="text-sm">Add your payment cards for quick autofill</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Secure Notes</CardTitle><CardDescription>Encrypted storage for sensitive information</CardDescription></div>
                  <Button size="sm"><Plus size={16} className="mr-2" />Add Note</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No secure notes yet</p>
                  <p className="text-sm">Store sensitive documents, licenses, and more</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Security Report Modal */}
        {showSecurityReport && securityReport && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Security Report (Watchtower)</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowSecurityReport(false)}><XCircle size={20} /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
                  <div className={`text-6xl font-bold ${getScoreColor(securityReport.score)}`}>{securityReport.score}</div>
                  <p className="text-lg font-medium mt-2">Security Score</p>
                  <p className="text-sm text-muted-foreground">{getScoreLabel(securityReport.score)} protection level</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border"><div className="flex items-center gap-2 text-orange-600"><AlertTriangle size={20} /><span className="font-medium">Weak Passwords</span></div><p className="text-2xl font-bold mt-2">{securityReport.weakPasswords}</p><p className="text-xs text-muted-foreground">Need stronger passwords</p></div>
                  <div className="p-4 rounded-lg border"><div className="flex items-center gap-2 text-red-600"><Copy size={20} /><span className="font-medium">Reused Passwords</span></div><p className="text-2xl font-bold mt-2">{securityReport.reusedPasswords}</p><p className="text-xs text-muted-foreground">Using same password</p></div>
                  <div className="p-4 rounded-lg border"><div className="flex items-center gap-2 text-yellow-600"><Clock size={20} /><span className="font-medium">Old Passwords</span></div><p className="text-2xl font-bold mt-2">{securityReport.oldPasswords}</p><p className="text-xs text-muted-foreground">Not changed in 90+ days</p></div>
                  <div className="p-4 rounded-lg border"><div className="flex items-center gap-2 text-green-600"><Smartphone size={20} /><span className="font-medium">2FA Enabled</span></div><p className="text-2xl font-bold mt-2">{securityReport.totpEnabled}</p><p className="text-xs text-muted-foreground">Extra protection active</p></div>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium flex items-center gap-2 text-blue-700 dark:text-blue-400"><CheckCircle size={16} />Recommendations</h4>
                  <ul className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-300">
                    {securityReport.weakPasswords > 0 && <li>• Update {securityReport.weakPasswords} weak password(s) with stronger alternatives</li>}
                    {securityReport.reusedPasswords > 0 && <li>• Change {securityReport.reusedPasswords} reused password(s) to unique ones</li>}
                    {securityReport.oldPasswords > 0 && <li>• Consider updating {securityReport.oldPasswords} old password(s)</li>}
                    <li>• Enable 2FA on all critical accounts</li>
                  </ul>
                </div>
                <Button className="w-full" onClick={() => setShowSecurityReport(false)}>Close Report</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
