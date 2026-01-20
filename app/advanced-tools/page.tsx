"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { invoke } from '@tauri-apps/api/core';
import { 
  ArrowLeft, Wrench, Monitor, Terminal, Shield, Plus, Trash2, 
  Play, Square, Download, AlertTriangle,
  Key, Globe, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/layout';

type ActiveTab = 'rdp' | 'ssh' | 'vuln';

interface RdpConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  domain?: string;
}

interface SshConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  auth_method: string;
}

interface VulnScan {
  id: string;
  target_url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  findings_count: number;
  created_at: string;
}

export default function AdvancedToolsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('rdp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // RDP State
  const [rdpConfigs, setRdpConfigs] = useState<RdpConfig[]>([]);
  const [showNewRdp, setShowNewRdp] = useState(false);
  const [newRdp, setNewRdp] = useState({
    name: '', host: '', port: 3389, username: '', password: '', domain: ''
  });

  // SSH State
  const [sshConfigs, setSshConfigs] = useState<SshConfig[]>([]);
  const [showNewSsh, setShowNewSsh] = useState(false);
  const [newSsh, setNewSsh] = useState({
    name: '', host: '', port: 22, username: '', authMethod: 'password', password: '', keyPath: ''
  });

  // Vulnerability Scanner State
  const [scans, setScans] = useState<VulnScan[]>([]);
  const [newScanUrl, setNewScanUrl] = useState('');
  const [scanDepth, setScanDepth] = useState(3);

  useEffect(() => {
    if (activeTab === 'rdp') loadRdpConfigs();
    else if (activeTab === 'ssh') loadSshConfigs();
    else if (activeTab === 'vuln') loadScans();
  }, [activeTab]);

  // RDP Functions
  const loadRdpConfigs = async () => {
    try {
      const result = await invoke<RdpConfig[]>('get_rdp_configs');
      setRdpConfigs(result);
    } catch (err) {
      log.error('Failed to load RDP configs:', err);
    }
  };

  const handleCreateRdp = async () => {
    if (!newRdp.name || !newRdp.host || !newRdp.username) {
      setError('Name, host, and username are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await invoke('create_rdp_config', {
        name: newRdp.name,
        host: newRdp.host,
        port: newRdp.port,
        username: newRdp.username,
        password: newRdp.password || null,
        domain: newRdp.domain || null
      });
      await loadRdpConfigs();
      setShowNewRdp(false);
      setNewRdp({ name: '', host: '', port: 3389, username: '', password: '', domain: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create RDP config');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectRdp = async (configId: string) => {
    try {
      await invoke('connect_rdp', { configId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  };

  const handleDeleteRdp = async (configId: string) => {
    try {
      await invoke('delete_rdp_config', { configId });
      await loadRdpConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete config');
    }
  };

  // SSH Functions
  const loadSshConfigs = async () => {
    try {
      const result = await invoke<SshConfig[]>('get_ssh_configs');
      setSshConfigs(result);
    } catch (err) {
      log.error('Failed to load SSH configs:', err);
    }
  };

  const handleCreateSsh = async () => {
    if (!newSsh.name || !newSsh.host || !newSsh.username) {
      setError('Name, host, and username are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await invoke('create_ssh_config', {
        name: newSsh.name,
        host: newSsh.host,
        port: newSsh.port,
        username: newSsh.username,
        authMethod: newSsh.authMethod,
        password: newSsh.password || null,
        privateKeyPath: newSsh.keyPath || null
      });
      await loadSshConfigs();
      setShowNewSsh(false);
      setNewSsh({ name: '', host: '', port: 22, username: '', authMethod: 'password', password: '', keyPath: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create SSH config');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSsh = async (configId: string) => {
    try {
      await invoke('connect_ssh', { configId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  };

  const handleDeleteSsh = async (configId: string) => {
    try {
      await invoke('delete_ssh_config', { configId });
      await loadSshConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete config');
    }
  };

  // Vulnerability Scanner Functions
  const loadScans = async () => {
    try {
      const result = await invoke<VulnScan[]>('get_all_scans');
      setScans(result);
    } catch (err) {
      log.error('Failed to load scans:', err);
    }
  };

  const handleStartScan = async () => {
    if (!newScanUrl) {
      setError('Target URL is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await invoke('start_vulnerability_scan', {
        url: newScanUrl,
        scanDepth,
        maxUrls: 100
      });
      await loadScans();
      setNewScanUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scan');
    } finally {
      setLoading(false);
    }
  };

  const handleStopScan = async (scanId: string) => {
    try {
      await invoke('stop_scan', { scanId });
      await loadScans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop scan');
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    try {
      await invoke('delete_scan', { scanId });
      await loadScans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scan');
    }
  };

  const handleExportReport = async (scanId: string) => {
    try {
      await invoke('export_scan_report', { scanId, format: 'pdf' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    }
  };

  return (
    <AppLayout tier="elite">
      <div className="p-6 space-y-6">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Advanced Tools</h1>
                <p className="text-sm text-muted-foreground">RDP • SSH • Security Scanner</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex justify-between items-center">
              <p className="text-red-400 text-sm">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400" aria-label="Dismiss error">×</button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('rdp')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'rdp'
                  ? 'text-orange-500 dark:text-orange-400 border-b-2 border-orange-500 dark:border-orange-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Monitor className="w-4 h-4 inline mr-2" />
              RDP Client
            </button>
            <button
              onClick={() => setActiveTab('ssh')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'ssh'
                  ? 'text-orange-500 dark:text-orange-400 border-b-2 border-orange-500 dark:border-orange-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Terminal className="w-4 h-4 inline mr-2" />
              SSH Terminal
            </button>
            <button
              onClick={() => setActiveTab('vuln')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'vuln'
                  ? 'text-orange-500 dark:text-orange-400 border-b-2 border-orange-500 dark:border-orange-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Security Scanner
            </button>
          </div>

          {/* RDP Panel */}
          {activeTab === 'rdp' && (
            <div className="space-y-4">
              <Card className="p-4 bg-card border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold">RDP Connections</h2>
                  <Button
                    onClick={() => setShowNewRdp(!showNewRdp)}
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-red-500"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {showNewRdp && (
                  <div className="mb-4 p-3 bg-muted rounded-lg space-y-2">
                    <Input placeholder="Connection Name" value={newRdp.name} onChange={(e) => setNewRdp({...newRdp, name: e.target.value})} className="bg-background border text-sm" />
                    <div className="flex gap-2">
                      <Input placeholder="Host" value={newRdp.host} onChange={(e) => setNewRdp({...newRdp, host: e.target.value})} className="bg-background border text-sm flex-1" />
                      <Input type="number" placeholder="Port" value={newRdp.port} onChange={(e) => setNewRdp({...newRdp, port: parseInt(e.target.value) || 3389})} className="bg-background border text-sm w-24" />
                    </div>
                    <Input placeholder="Username" value={newRdp.username} onChange={(e) => setNewRdp({...newRdp, username: e.target.value})} className="bg-background border text-sm" />
                    <Input type="password" placeholder="Password (optional)" value={newRdp.password} onChange={(e) => setNewRdp({...newRdp, password: e.target.value})} className="bg-background border text-sm" />
                    <Input placeholder="Domain (optional)" value={newRdp.domain} onChange={(e) => setNewRdp({...newRdp, domain: e.target.value})} className="bg-background border text-sm" />
                    <div className="flex gap-2">
                      <Button onClick={handleCreateRdp} disabled={loading} size="sm" className="flex-1 bg-green-600">Create</Button>
                      <Button onClick={() => setShowNewRdp(false)} size="sm" variant="outline" className="border">Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-3">
                  {rdpConfigs.map((config) => (
                    <Card key={config.id} className="p-3 bg-muted border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                          <span className="font-medium text-sm">{config.name}</span>
                        </div>
                        <button onClick={() => handleDeleteRdp(config.id)} className="p-1 hover:bg-red-500/20 rounded" aria-label="Delete">
                          <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{config.username}@{config.host}:{config.port}</p>
                      <Button onClick={() => handleConnectRdp(config.id)} size="sm" className="w-full bg-orange-600">
                        <Play className="w-3 h-3 mr-2" />Connect
                      </Button>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* SSH Panel */}
          {activeTab === 'ssh' && (
            <div className="space-y-4">
              <Card className="p-4 bg-card border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold">SSH Connections</h2>
                  <Button
                    onClick={() => setShowNewSsh(!showNewSsh)}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {showNewSsh && (
                  <div className="mb-4 p-3 bg-muted rounded-lg space-y-2">
                    <Input placeholder="Connection Name" value={newSsh.name} onChange={(e) => setNewSsh({...newSsh, name: e.target.value})} className="bg-background border text-sm" />
                    <div className="flex gap-2">
                      <Input placeholder="Host" value={newSsh.host} onChange={(e) => setNewSsh({...newSsh, host: e.target.value})} className="bg-background border text-sm flex-1" />
                      <Input type="number" placeholder="Port" value={newSsh.port} onChange={(e) => setNewSsh({...newSsh, port: parseInt(e.target.value) || 22})} className="bg-background border text-sm w-24" />
                    </div>
                    <Input placeholder="Username" value={newSsh.username} onChange={(e) => setNewSsh({...newSsh, username: e.target.value})} className="bg-background border text-sm" />
                    <select value={newSsh.authMethod} onChange={(e) => setNewSsh({...newSsh, authMethod: e.target.value})} className="w-full px-3 py-2 bg-background border rounded-md text-sm" aria-label="Auth method">
                      <option value="password">Password</option>
                      <option value="publickey">SSH Key</option>
                      <option value="both">Both</option>
                    </select>
                    {(newSsh.authMethod === 'password' || newSsh.authMethod === 'both') && (
                      <Input type="password" placeholder="Password" value={newSsh.password} onChange={(e) => setNewSsh({...newSsh, password: e.target.value})} className="bg-background border text-sm" />
                    )}
                    {(newSsh.authMethod === 'publickey' || newSsh.authMethod === 'both') && (
                      <Input placeholder="Private Key Path" value={newSsh.keyPath} onChange={(e) => setNewSsh({...newSsh, keyPath: e.target.value})} className="bg-background border text-sm" />
                    )}
                    <div className="flex gap-2">
                      <Button onClick={handleCreateSsh} disabled={loading} size="sm" className="flex-1 bg-green-600">Create</Button>
                      <Button onClick={() => setShowNewSsh(false)} size="sm" variant="outline" className="border">Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-3">
                  {sshConfigs.map((config) => (
                    <Card key={config.id} className="p-3 bg-muted border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-green-500 dark:text-green-400" />
                          <span className="font-medium text-sm">{config.name}</span>
                        </div>
                        <button onClick={() => handleDeleteSsh(config.id)} className="p-1 hover:bg-red-500/20 rounded" aria-label="Delete">
                          <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{config.username}@{config.host}:{config.port}</p>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        {config.auth_method === 'publickey' ? <Key className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {config.auth_method}
                      </p>
                      <Button onClick={() => handleConnectSsh(config.id)} size="sm" className="w-full bg-green-600">
                        <Play className="w-3 h-3 mr-2" />Connect
                      </Button>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Vulnerability Scanner Panel */}
          {activeTab === 'vuln' && (
            <div className="space-y-4">
              <Card className="p-4 bg-card border">
                <h2 className="font-semibold mb-4">New Security Scan</h2>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Target URL (e.g., https://example.com)"
                    value={newScanUrl}
                    onChange={(e) => setNewScanUrl(e.target.value)}
                    className="bg-background border flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Depth"
                    value={scanDepth}
                    onChange={(e) => setScanDepth(parseInt(e.target.value) || 3)}
                    className="bg-background border w-24"
                  />
                  <Button
                    onClick={handleStartScan}
                    disabled={loading}
                    className="bg-gradient-to-r from-red-500 to-pink-500"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Scan
                  </Button>
                </div>
              </Card>

              <Card className="p-4 bg-card border">
                <h2 className="font-semibold mb-3">Scan Results</h2>
                <div className="space-y-2">
                  {scans.map((scan) => (
                    <div key={scan.id} className="p-3 bg-muted rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            <span className="font-medium text-sm">{scan.target_url}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className={`px-2 py-1 rounded-full ${
                              scan.status === 'completed' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                              scan.status === 'running' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                              scan.status === 'failed' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {scan.status}
                            </span>
                            {scan.findings_count > 0 && (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />
                                {scan.findings_count} findings
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {scan.status === 'running' && (
                            <button onClick={() => handleStopScan(scan.id)} className="p-1 hover:bg-muted rounded" aria-label="Stop scan">
                              <Square className="w-4 h-4 text-red-500 dark:text-red-400" />
                            </button>
                          )}
                          {scan.status === 'completed' && (
                            <button onClick={() => handleExportReport(scan.id)} className="p-1 hover:bg-muted rounded" aria-label="Export report">
                              <Download className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteScan(scan.id)} className="p-1 hover:bg-red-500/20 rounded" aria-label="Delete scan">
                            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {scans.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No scans yet. Start a new security scan above.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
      </div>
    </AppLayout>
  );
}
