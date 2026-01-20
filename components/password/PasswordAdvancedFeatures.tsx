"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Key,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  Copy,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Server,
  Terminal,
  Upload
} from "lucide-react";

// ==================== Types ====================

export interface SSHKey {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string; // Encrypted
  type: 'rsa' | 'ed25519' | 'ecdsa';
  bits: number;
  fingerprint: string;
  passphrase?: string; // Encrypted
  createdAt: Date;
  lastUsed?: Date;
  associatedHosts: string[];
}

export interface DarkWebBreachResult {
  id: string;
  email: string;
  source: string;
  breachDate: Date;
  dataTypes: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  resolved: boolean;
}

export interface PasswordHealthScore {
  overall: number;
  weak: number;
  reused: number;
  old: number;
  compromised: number;
  missing2FA: number;
}

// ==================== SSH Key Manager Component ====================

interface SSHKeyManagerProps {
  keys: SSHKey[];
  onAddKey: (key: Omit<SSHKey, 'id' | 'createdAt' | 'fingerprint'>) => Promise<void>;
  onDeleteKey: (keyId: string) => Promise<void>;
  onCopyKey: (key: SSHKey, type: 'public' | 'private') => void;
}

export function SSHKeyManager({ keys, onAddKey, onDeleteKey, onCopyKey }: SSHKeyManagerProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  // New key form
  const [newKey, setNewKey] = useState({
    name: '',
    type: 'ed25519' as 'rsa' | 'ed25519' | 'ecdsa',
    bits: 256,
    passphrase: '',
    publicKey: '',
    privateKey: ''
  });

  const generateKeyPair = async () => {
    setGenerating(true);
    
    // Simulate key generation (in real app, use crypto APIs or Tauri backend)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockPublicKey = `ssh-${newKey.type} AAAAC3NzaC1lZDI1NTE5AAAAI${btoa(Math.random().toString()).substring(0, 40)} ${newKey.name}@cube-nexum`;
    const mockPrivateKey = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIAAAAGYmNyeXB0AAAAGAAAABB${btoa(Math.random().toString()).substring(0, 40)}
${btoa(Math.random().toString() + Math.random().toString()).substring(0, 70)}
${btoa(Math.random().toString() + Math.random().toString()).substring(0, 70)}
-----END OPENSSH PRIVATE KEY-----`;
    
    setNewKey(prev => ({
      ...prev,
      publicKey: mockPublicKey,
      privateKey: mockPrivateKey
    }));
    
    setGenerating(false);
    toast({
      title: "Key Pair Generated",
      description: `${newKey.type.toUpperCase()} key pair created successfully`
    });
  };

  const handleAddKey = async () => {
    if (!newKey.name || !newKey.publicKey) {
      toast({
        title: "Error",
        description: "Please provide a name and key pair",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await onAddKey({
        name: newKey.name,
        type: newKey.type,
        bits: newKey.bits,
        publicKey: newKey.publicKey,
        privateKey: newKey.privateKey,
        passphrase: newKey.passphrase,
        associatedHosts: []
      });
      
      setShowAddDialog(false);
      setNewKey({
        name: '',
        type: 'ed25519',
        bits: 256,
        passphrase: '',
        publicKey: '',
        privateKey: ''
      });
      
      toast({
        title: "SSH Key Added",
        description: "Your SSH key has been securely stored"
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to add SSH key",
        variant: "destructive"
      });
    }
  };

  const _generateFingerprint = (publicKey: string): string => {
    // Simplified fingerprint generation
    const hash = publicKey.split(' ')[1]?.substring(0, 32) || '';
    return `SHA256:${btoa(hash).substring(0, 43)}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">SSH Key Manager</CardTitle>
              <CardDescription>Securely store and manage your SSH keys</CardDescription>
            </div>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add SSH Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add SSH Key</DialogTitle>
                <DialogDescription>
                  Generate a new key pair or import an existing one
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Key Name</Label>
                    <Input 
                      placeholder="My Server Key"
                      value={newKey.name}
                      onChange={(e) => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="key-type-select">Key Type</Label>
                    <select 
                      id="key-type-select"
                      title="Select SSH key type"
                      className="w-full h-10 px-3 rounded-md border bg-background"
                      value={newKey.type}
                      onChange={(e) => setNewKey(prev => ({ ...prev, type: e.target.value as typeof newKey.type }))}
                    >
                      <option value="ed25519">Ed25519 (Recommended)</option>
                      <option value="rsa">RSA</option>
                      <option value="ecdsa">ECDSA</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Passphrase (Optional)</Label>
                  <Input 
                    type="password"
                    placeholder="Enter passphrase for extra security"
                    value={newKey.passphrase}
                    onChange={(e) => setNewKey(prev => ({ ...prev, passphrase: e.target.value }))}
                  />
                </div>
                
                <Button 
                  onClick={generateKeyPair} 
                  disabled={generating || !newKey.name}
                  className="w-full"
                >
                  {generating ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Terminal className="mr-2 h-4 w-4" />
                  )}
                  {generating ? 'Generating...' : 'Generate Key Pair'}
                </Button>
                
                {newKey.publicKey && (
                  <>
                    <div className="space-y-2">
                      <Label>Public Key</Label>
                      <Textarea 
                        className="font-mono text-xs h-20"
                        value={newKey.publicKey}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Private Key (Keep Secret!)</Label>
                      <Textarea 
                        className="font-mono text-xs h-32 bg-red-50 dark:bg-red-950/20"
                        value={newKey.privateKey}
                        readOnly
                      />
                    </div>
                  </>
                )}
                
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Or import existing keys:</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Import Public Key
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Import Private Key
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddKey} disabled={!newKey.publicKey}>
                  Save SSH Key
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {keys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No SSH keys stored</p>
            <p className="text-sm text-muted-foreground">Add your first SSH key to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map(key => (
              <div 
                key={key.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <Server className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">{key.type.toUpperCase()}</Badge>
                      <span>•</span>
                      <span className="font-mono">{key.fingerprint.substring(0, 20)}...</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onCopyKey(key, 'public')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowPrivateKey(showPrivateKey === key.id ? null : key.id)}
                  >
                    {showPrivateKey === key.id ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDeleteKey(key.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Dark Web Scanner Component ====================

interface DarkWebScannerProps {
  onScanComplete: (results: DarkWebBreachResult[]) => void;
}

export function DarkWebScanner({ onScanComplete }: DarkWebScannerProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<DarkWebBreachResult[]>([]);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [emailsToScan, setEmailsToScan] = useState<string[]>([]);

  useEffect(() => {
    // Load saved scan results and emails
    const savedResults = localStorage.getItem('dark-web-scan-results');
    const savedLastScan = localStorage.getItem('dark-web-last-scan');
    const savedEmails = localStorage.getItem('dark-web-monitored-emails');
    
    if (savedResults) setResults(JSON.parse(savedResults));
    if (savedLastScan) setLastScan(new Date(savedLastScan));
    if (savedEmails) setEmailsToScan(JSON.parse(savedEmails));
  }, []);

  const runDarkWebScan = async () => {
    if (emailsToScan.length === 0) {
      toast({
        title: "No Emails to Scan",
        description: "Add emails from your vault to monitor",
        variant: "destructive"
      });
      return;
    }
    
    setScanning(true);
    setProgress(0);
    
    // Simulate scan progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(i);
    }
    
    // Simulate finding breaches (in real app, this would call Have I Been Pwned API or similar)
    const mockBreaches: DarkWebBreachResult[] = [
      {
        id: crypto.randomUUID(),
        email: emailsToScan[0] || 'user@example.com',
        source: 'LinkedIn (2023)',
        breachDate: new Date('2023-05-15'),
        dataTypes: ['Email', 'Password Hash', 'Name'],
        severity: 'high',
        resolved: false
      }
    ];
    
    const foundBreaches = Math.random() > 0.5;
    const newResults = foundBreaches ? mockBreaches : [];
    
    setResults(prev => [...prev, ...newResults]);
    setLastScan(new Date());
    setScanning(false);
    
    localStorage.setItem('dark-web-scan-results', JSON.stringify([...results, ...newResults]));
    localStorage.setItem('dark-web-last-scan', new Date().toISOString());
    
    onScanComplete(newResults);
    
    toast({
      title: foundBreaches ? "⚠️ Breaches Found" : "Scan Complete",
      description: foundBreaches 
        ? `Found ${newResults.length} breach(es). Review and take action.`
        : "No new breaches detected",
      variant: foundBreaches ? "destructive" : "default"
    });
  };

  const resolveBreachResult = (breachId: string) => {
    setResults(prev => {
      const updated = prev.map(r => r.id === breachId ? { ...r, resolved: true } : r);
      localStorage.setItem('dark-web-scan-results', JSON.stringify(updated));
      return updated;
    });
  };

  const unresolvedBreaches = results.filter(r => !r.resolved);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Dark Web Scanner</CardTitle>
              <CardDescription>Monitor if your credentials appear in data breaches</CardDescription>
            </div>
          </div>
          {unresolvedBreaches.length > 0 && (
            <Badge variant="destructive">
              {unresolvedBreaches.length} Breach{unresolvedBreaches.length !== 1 ? 'es' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scan Status */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium">Monitoring {emailsToScan.length} email(s)</p>
              <p className="text-xs text-muted-foreground">
                Last scan: {lastScan?.toLocaleDateString() || 'Never'}
              </p>
            </div>
            <Button onClick={runDarkWebScan} disabled={scanning}>
              {scanning ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              {scanning ? `Scanning... ${progress}%` : 'Scan Now'}
            </Button>
          </div>
          
          {scanning && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`bg-purple-500 h-2 rounded-full transition-all duration-300 w-[${progress}%]`}
              />
            </div>
          )}
        </div>

        {/* Results */}
        {unresolvedBreaches.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-red-600">Active Breaches</h4>
            {unresolvedBreaches.map(breach => (
              <div 
                key={breach.id}
                className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{breach.source}</p>
                      <p className="text-sm text-muted-foreground">{breach.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs text-white ${getSeverityColor(breach.severity)}`}>
                          {breach.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Breached: {breach.breachDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {breach.dataTypes.map(type => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => resolveBreachResult(breach.id)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-green-600">All Clear</p>
            <p className="text-sm text-muted-foreground">
              No unresolved breaches found
            </p>
          </div>
        )}

        {/* Recommendations */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-sm text-blue-700 dark:text-blue-400 mb-2">
            Recommendations
          </h4>
          <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
            <li>• Change passwords for any breached accounts immediately</li>
            <li>• Enable 2FA on all accounts when available</li>
            <li>• Use unique passwords for each account</li>
            <li>• Run scans monthly to stay protected</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Password Health Dashboard ====================

interface PasswordHealthDashboardProps {
  healthScore: PasswordHealthScore;
  onImprovePassword: (type: 'weak' | 'reused' | 'old') => void;
}

export function PasswordHealthDashboard({ healthScore, onImprovePassword }: PasswordHealthDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Password Health</CardTitle>
            <CardDescription>Your overall security score</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className={`text-6xl font-bold ${getScoreColor(healthScore.overall)}`}>
            {healthScore.overall}%
          </div>
          <p className={`font-medium ${getScoreColor(healthScore.overall)}`}>
            {getScoreLabel(healthScore.overall)}
          </p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
            onClick={() => onImprovePassword('weak')}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Weak</span>
              <span className="font-bold text-red-600">{healthScore.weak}</span>
            </div>
          </div>
          
          <div 
            className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
            onClick={() => onImprovePassword('reused')}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reused</span>
              <span className="font-bold text-orange-600">{healthScore.reused}</span>
            </div>
          </div>
          
          <div 
            className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors"
            onClick={() => onImprovePassword('old')}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Old (90+ days)</span>
              <span className="font-bold text-yellow-600">{healthScore.old}</span>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Missing 2FA</span>
              <span className="font-bold text-purple-600">{healthScore.missing2FA}</span>
            </div>
          </div>
        </div>

        {/* Compromised Alert */}
        {healthScore.compromised > 0 && (
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">
                  {healthScore.compromised} Compromised Password{healthScore.compromised !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-600">
                  These passwords have been found in data breaches. Change them immediately.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Main Advanced Password Features Component ====================

export interface PasswordAdvancedFeaturesProps {
  sshKeys: SSHKey[];
  healthScore: PasswordHealthScore;
  onAddSSHKey: (key: Omit<SSHKey, 'id' | 'createdAt' | 'fingerprint'>) => Promise<void>;
  onDeleteSSHKey: (keyId: string) => Promise<void>;
  onCopySSHKey: (key: SSHKey, type: 'public' | 'private') => void;
  onDarkWebScanComplete: (results: DarkWebBreachResult[]) => void;
  onImprovePassword: (type: 'weak' | 'reused' | 'old') => void;
}

export function PasswordAdvancedFeatures({
  sshKeys,
  healthScore,
  onAddSSHKey,
  onDeleteSSHKey,
  onCopySSHKey,
  onDarkWebScanComplete,
  onImprovePassword
}: PasswordAdvancedFeaturesProps) {
  return (
    <div className="space-y-6">
      {/* Password Health Dashboard */}
      <PasswordHealthDashboard 
        healthScore={healthScore}
        onImprovePassword={onImprovePassword}
      />
      
      <Tabs defaultValue="dark-web" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dark-web" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Dark Web Scanner
          </TabsTrigger>
          <TabsTrigger value="ssh-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            SSH Keys
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dark-web" className="mt-4">
          <DarkWebScanner onScanComplete={onDarkWebScanComplete} />
        </TabsContent>
        
        <TabsContent value="ssh-keys" className="mt-4">
          <SSHKeyManager 
            keys={sshKeys}
            onAddKey={onAddSSHKey}
            onDeleteKey={onDeleteSSHKey}
            onCopyKey={onCopySSHKey}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PasswordAdvancedFeatures;
