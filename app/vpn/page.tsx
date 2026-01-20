"use client";

import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  Shield, 
  Power, 
  Globe,
  Lock,
  Unlock,
  MapPin,
  Zap,
  Star,
  Settings,
  CheckCircle,
  Eye,
  Split,
  ShieldAlert,
  RefreshCw,
  Search,
  Plus
} from "lucide-react";
import {
  getStatus,
  connect,
  disconnect,
  getServers,
  type VPNStatus,
  type VPNServer
} from "@/lib/services/vpnService";
import { VPNTour } from "@/components/vpn/VPNTour";
import { VPNPremiumPlans } from "@/components/vpn/VPNPremiumPlans";
import { CustomVPNDialog } from "@/components/vpn/CustomVPNDialog";

// ==================== Types ====================
interface SecuritySettings {
  killSwitch: boolean;
  dnsLeakProtection: boolean;
  ipv6LeakProtection: boolean;
  splitTunneling: boolean;
  autoConnect: boolean;
  trustedNetworks: string[];
}

interface SplitTunnelApp {
  name: string;
  icon: string;
  enabled: boolean;
}

// ==================== Component ====================
export default function VpnPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [status, setStatus] = useState<VPNStatus | null>(null);
  const [servers, setServers] = useState<VPNServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("servers");
  
  // VPN Tour & Dialog States
  const [showTour, setShowTour] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  
  // Security Features (ExpressVPN-like)
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    killSwitch: true,
    dnsLeakProtection: true,
    ipv6LeakProtection: true,
    splitTunneling: false,
    autoConnect: false,
    trustedNetworks: [],
  });
  
  // Split Tunneling Apps
  const [splitTunnelApps, setSplitTunnelApps] = useState<SplitTunnelApp[]>([
    { name: 'Chrome', icon: '🌐', enabled: true },
    { name: 'Firefox', icon: '🦊', enabled: true },
    { name: 'Slack', icon: '💼', enabled: false },
    { name: 'Spotify', icon: '🎵', enabled: false },
    { name: 'Steam', icon: '🎮', enabled: false },
  ]);
  
  // Quick Connect Server
  const [favoriteServers, setFavoriteServers] = useState<string[]>([]);

  useEffect(() => {
    loadData();
    checkFirstVisit();
    loadSecuritySettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkFirstVisit = () => {
    const tourCompleted = localStorage.getItem('vpn-tour-completed');
    if (!tourCompleted) {
      setTimeout(() => setShowTour(true), 1000);
    }
  };

  const handleTourComplete = () => {
    localStorage.setItem('vpn-tour-completed', 'true');
    setShowTour(false);
  };
  
  const loadSecuritySettings = () => {
    const saved = localStorage.getItem('vpn-security-settings');
    if (saved) {
      setSecuritySettings(JSON.parse(saved));
    }
  };
  
  const saveSecuritySettings = (settings: SecuritySettings) => {
    setSecuritySettings(settings);
    localStorage.setItem('vpn-security-settings', JSON.stringify(settings));
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [vpnStatus, vpnServers] = await Promise.all([
        getStatus(),
        getServers()
      ]);
      setStatus(vpnStatus);
      setServers(vpnServers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('vpn.errors.loadFailed');
      setError(errorMessage);
      toast({
        title: 'VPN Error',
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const handleRetry = useCallback(() => {
    setError(null);
    loadData();
  }, [loadData]);

  const handleConnect = async (server: VPNServer) => {
    try {
      setConnecting(true);
      
      // Apply kill switch if enabled
      if (securitySettings.killSwitch) {
        toast({ title: "Kill Switch Active", description: "Your traffic is protected during connection" });
      }
      
      await connect(server.id);
      
      toast({
        title: "Connected",
        description: `Successfully connected to ${server.name}`,
      });

      await loadData();
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to VPN",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setConnecting(true);
      await disconnect();
      
      toast({
        title: "Disconnected",
        description: "VPN connection closed",
      });

      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disconnect",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };
  
  const handleQuickConnect = async () => {
    // Find best server (lowest load + lowest ping)
    const bestServer = [...servers].sort((a, b) => {
      const scoreA = a.load + (a.ping / 10);
      const scoreB = b.load + (b.ping / 10);
      return scoreA - scoreB;
    })[0];
    
    if (bestServer) {
      await handleConnect(bestServer);
    }
  };
  
  const toggleFavorite = (serverId: string) => {
    setFavoriteServers(prev => {
      const updated = prev.includes(serverId) 
        ? prev.filter(id => id !== serverId)
        : [...prev, serverId];
      localStorage.setItem('vpn-favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const filteredServers = servers.filter(server => 
    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.country.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const favoriteServerList = servers.filter(s => favoriteServers.includes(s.id));

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (ms: number | null) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };
  
  const getLoadColor = (load: number) => {
    if (load < 30) return 'text-green-500';
    if (load < 60) return 'text-yellow-500';
    if (load < 80) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <AppLayout tier="elite">
      {/* VPN Tour Modal */}
      {showTour && (
        <VPNTour 
          onClose={() => setShowTour(false)} 
          onComplete={handleTourComplete}
        />
      )}

      {/* Custom VPN Dialog */}
      <CustomVPNDialog
        open={showCustomDialog}
        onOpenChange={setShowCustomDialog}
        onSuccess={loadData}
      />

      {/* M5: Loading State */}
      {loading && (
        <LoadingState
          title={t('vpn.loading.title')}
          description={t('vpn.loading.description')}
          className="min-h-[60vh]"
        />
      )}

      {/* M5: Error State */}
      {!loading && error && (
        <ErrorState
          title={t('vpn.errors.title')}
          message={error}
          onRetry={handleRetry}
          className="min-h-[60vh]"
        />
      )}

      {/* M5: Main Content */}
      {!loading && !error && (
      <div className="h-full w-full p-6 space-y-6 overflow-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-teal-500">
                <Shield className="h-6 w-6 text-white" />
              </div>
              {t('vpn.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('vpn.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTour(true)}>
              <Zap className="mr-2 h-4 w-4" />{t('vpn.actions.tour')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCustomDialog(true)}>
              <Settings className="mr-2 h-4 w-4" />{t('vpn.actions.customVpn')}
            </Button>
          </div>
        </div>

        {/* Quick Connect Card */}
        <Card className={status?.connected ? "bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 border-green-200 dark:border-green-800" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${status?.connected ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {status?.connected ? (
                    <Lock className="h-8 w-8 text-white" />
                  ) : (
                    <Unlock className="h-8 w-8 text-gray-500" />
                  )}
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${status?.connected ? 'text-green-700 dark:text-green-400' : ''}`}>
                    {status?.connected ? 'Protected' : 'Not Protected'}
                  </h2>
                  <p className="text-muted-foreground">
                    {status?.connected && status.server 
                      ? `Connected to ${status.server.name}, ${status.server.country}`
                      : 'Your connection is not secure'
                    }
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                variant={status?.connected ? "destructive" : "default"}
                onClick={status?.connected ? handleDisconnect : handleQuickConnect}
                disabled={connecting}
                className={!status?.connected ? "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600" : ""}
              >
                {connecting ? (
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Power className="mr-2 h-5 w-5" />
                )}
                {status?.connected ? 'Disconnect' : 'Quick Connect'}
              </Button>
            </div>
            
            {/* Connection Stats */}
            {status?.connected && (
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-green-200 dark:border-green-800">
                <div>
                  <p className="text-xs text-muted-foreground">Your IP</p>
                  <p className="font-mono font-medium">{status.publicIp || 'Hidden'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                  <p className="font-medium">{formatUptime(status.connectionTime ? status.connectionTime * 1000 : null)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Downloaded</p>
                  <p className="font-medium">{formatBytes(status.bytesReceived)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Uploaded</p>
                  <p className="font-medium">{formatBytes(status.bytesSent)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={securitySettings.killSwitch ? "border-green-200 dark:border-green-800" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kill Switch</CardTitle>
              <ShieldAlert className={`h-4 w-4 ${securitySettings.killSwitch ? 'text-green-500' : 'text-gray-400'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${securitySettings.killSwitch ? 'text-green-600' : 'text-gray-500'}`}>
                {securitySettings.killSwitch ? 'Active' : 'Disabled'}
              </div>
              <p className="text-xs text-muted-foreground">Blocks traffic if VPN drops</p>
            </CardContent>
          </Card>
          
          <Card className={securitySettings.dnsLeakProtection ? "border-green-200 dark:border-green-800" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">DNS Protection</CardTitle>
              <Eye className={`h-4 w-4 ${securitySettings.dnsLeakProtection ? 'text-green-500' : 'text-gray-400'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${securitySettings.dnsLeakProtection ? 'text-green-600' : 'text-gray-500'}`}>
                {securitySettings.dnsLeakProtection ? 'Protected' : 'At Risk'}
              </div>
              <p className="text-xs text-muted-foreground">Prevents DNS leaks</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servers</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{servers.length}</div>
              <p className="text-xs text-muted-foreground">Worldwide locations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protocol</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">WireGuard</div>
              <p className="text-xs text-muted-foreground">Fastest & most secure</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
          </TabsList>

          {/* Servers Tab */}
          <TabsContent value="servers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Server Locations</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search servers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading servers...</div>
                ) : filteredServers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No servers found</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredServers.map((server) => (
                      <Card key={server.id} className="relative hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <CardTitle className="text-lg">{server.name}</CardTitle>
                            </div>
                            <button onClick={() => toggleFavorite(server.id)} className="text-yellow-500 hover:text-yellow-600">
                              {favoriteServers.includes(server.id) ? <Star className="h-5 w-5 fill-current" /> : <Star className="h-5 w-5" />}
                            </button>
                          </div>
                          <CardDescription>{server.country}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Load:</span>
                              <div className="flex items-center gap-2">
                                <Progress value={server.load} className="w-16 h-2" />
                                <span className={`font-medium ${getLoadColor(server.load)}`}>{server.load}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Latency:</span>
                              <span className="font-medium">{server.ping}ms</span>
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => handleConnect(server)}
                              disabled={connecting || (status?.connected && status.server?.id === server.id)}
                              variant={status?.connected && status.server?.id === server.id ? "secondary" : "default"}
                            >
                              {status?.connected && status.server?.id === server.id ? (
                                <><CheckCircle className="mr-2 h-4 w-4" />Connected</>
                              ) : (
                                <><Power className="mr-2 h-4 w-4" />{connecting ? "Connecting..." : "Connect"}</>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" />Favorite Servers</CardTitle>
                <CardDescription>Your saved server locations for quick access</CardDescription>
              </CardHeader>
              <CardContent>
                {favoriteServerList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No favorites yet</p>
                    <p className="text-sm">Click the star icon on any server to add it here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteServerList.map((server) => (
                      <Card key={server.id} className="relative hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <CardTitle className="text-lg">{server.name}</CardTitle>
                            </div>
                            <Star className="h-5 w-5 text-yellow-500 fill-current" />
                          </div>
                          <CardDescription>{server.country}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button className="w-full" onClick={() => handleConnect(server)} disabled={connecting}>
                            <Power className="mr-2 h-4 w-4" />Connect
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kill Switch & Leak Protection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" />Network Protection</CardTitle>
                  <CardDescription>Advanced security features to protect your traffic</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="killSwitch" className="font-medium">Kill Switch</Label>
                      <p className="text-sm text-muted-foreground">Block all traffic if VPN disconnects</p>
                    </div>
                    <Switch
                      id="killSwitch"
                      checked={securitySettings.killSwitch}
                      onCheckedChange={(checked) => saveSecuritySettings({ ...securitySettings, killSwitch: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dnsLeak" className="font-medium">DNS Leak Protection</Label>
                      <p className="text-sm text-muted-foreground">Use secure DNS servers</p>
                    </div>
                    <Switch
                      id="dnsLeak"
                      checked={securitySettings.dnsLeakProtection}
                      onCheckedChange={(checked) => saveSecuritySettings({ ...securitySettings, dnsLeakProtection: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ipv6Leak" className="font-medium">IPv6 Leak Protection</Label>
                      <p className="text-sm text-muted-foreground">Block IPv6 traffic to prevent leaks</p>
                    </div>
                    <Switch
                      id="ipv6Leak"
                      checked={securitySettings.ipv6LeakProtection}
                      onCheckedChange={(checked) => saveSecuritySettings({ ...securitySettings, ipv6LeakProtection: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoConnect" className="font-medium">Auto-Connect</Label>
                      <p className="text-sm text-muted-foreground">Connect automatically on startup</p>
                    </div>
                    <Switch
                      id="autoConnect"
                      checked={securitySettings.autoConnect}
                      onCheckedChange={(checked) => saveSecuritySettings({ ...securitySettings, autoConnect: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Split Tunneling */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Split className="h-5 w-5" />Split Tunneling</CardTitle>
                      <CardDescription>Choose which apps use the VPN</CardDescription>
                    </div>
                    <Switch
                      checked={securitySettings.splitTunneling}
                      onCheckedChange={(checked) => saveSecuritySettings({ ...securitySettings, splitTunneling: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {securitySettings.splitTunneling ? (
                    <div className="space-y-3">
                      {splitTunnelApps.map((app, index) => (
                        <div key={app.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{app.icon}</span>
                            <span className="font-medium">{app.name}</span>
                          </div>
                          <Switch
                            checked={app.enabled}
                            onCheckedChange={(checked) => {
                              const updated = [...splitTunnelApps];
                              updated[index].enabled = checked;
                              setSplitTunnelApps(updated);
                            }}
                          />
                        </div>
                      ))}
                      <Button variant="outline" className="w-full mt-4">
                        <Plus className="mr-2 h-4 w-4" />Add Application
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Split className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Enable split tunneling to choose which apps use the VPN</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Premium Tab */}
          <TabsContent value="premium">
            <VPNPremiumPlans />
          </TabsContent>
        </Tabs>
      </div>
      )}
    </AppLayout>
  );
}
