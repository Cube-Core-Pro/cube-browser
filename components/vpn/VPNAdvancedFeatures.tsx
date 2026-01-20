"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  ShieldAlert,
  Bug,
  Eye,
  Globe,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Lock,
  Layers,
  Ban,
  FileWarning,
  Link2
} from "lucide-react";

// ==================== Types ====================

export interface ThreatStats {
  malwareBlocked: number;
  trackersBlocked: number;
  adsBlocked: number;
  phishingBlocked: number;
  totalThreatsToday: number;
  lastScanTime: Date | null;
}

export interface DarkWebAlert {
  id: string;
  type: 'email' | 'password' | 'credit_card' | 'ssn' | 'phone';
  source: string;
  discoveredAt: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedData: string;
  resolved: boolean;
}

export interface DoubleVPNServer {
  id: string;
  entryCountry: string;
  entryCity: string;
  exitCountry: string;
  exitCity: string;
  load: number;
  ping: number;
}

interface ThreatProtectionProProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onStatsUpdate?: (stats: ThreatStats) => void;
}

interface DarkWebMonitorProps {
  onAlertFound?: (alerts: DarkWebAlert[]) => void;
}

interface DoubleVPNProps {
  onConnect: (server: DoubleVPNServer) => Promise<void>;
  isConnected: boolean;
  currentServer?: DoubleVPNServer | null;
}

// ==================== Threat Protection Pro Component ====================

export function ThreatProtectionPro({ enabled, onToggle, onStatsUpdate }: ThreatProtectionProProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState<ThreatStats>({
    malwareBlocked: 0,
    trackersBlocked: 0,
    adsBlocked: 0,
    phishingBlocked: 0,
    totalThreatsToday: 0,
    lastScanTime: null
  });
  const [scanning, setScanning] = useState(false);
  
  // Feature toggles
  const [features, setFeatures] = useState({
    malwareProtection: true,
    trackerBlocking: true,
    adBlocking: true,
    phishingProtection: true,
    webProtection: true
  });

  // Load saved stats
  useEffect(() => {
    const saved = localStorage.getItem('threat-protection-stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      setStats({
        ...parsed,
        lastScanTime: parsed.lastScanTime ? new Date(parsed.lastScanTime) : null
      });
    }
  }, []);

  // Simulate threat blocking (in real app, this would come from the VPN service)
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      setStats(prev => {
        const newStats = {
          ...prev,
          trackersBlocked: prev.trackersBlocked + Math.floor(Math.random() * 3),
          adsBlocked: prev.adsBlocked + Math.floor(Math.random() * 5),
          totalThreatsToday: prev.totalThreatsToday + Math.floor(Math.random() * 2)
        };
        localStorage.setItem('threat-protection-stats', JSON.stringify(newStats));
        onStatsUpdate?.(newStats);
        return newStats;
      });
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [enabled, onStatsUpdate]);

  const runManualScan = async () => {
    setScanning(true);
    toast({
      title: "Scanning...",
      description: "Checking for threats in your network traffic"
    });
    
    // Simulate scan
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const threatsFound = Math.floor(Math.random() * 5);
    setStats(prev => ({
      ...prev,
      malwareBlocked: prev.malwareBlocked + threatsFound,
      totalThreatsToday: prev.totalThreatsToday + threatsFound,
      lastScanTime: new Date()
    }));
    
    setScanning(false);
    toast({
      title: "Scan Complete",
      description: threatsFound > 0 
        ? `Blocked ${threatsFound} potential threats`
        : "No threats detected",
      variant: threatsFound > 0 ? "default" : "default"
    });
  };

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Threat Protection Pro™</CardTitle>
              <CardDescription>Block malware, trackers, and ads</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={enabled ? "default" : "secondary"}>
              {enabled ? "Active" : "Disabled"}
            </Badge>
            <Switch checked={enabled} onCheckedChange={onToggle} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {enabled && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <Bug className="h-5 w-5 text-red-500 mb-1" />
                <p className="text-2xl font-bold">{stats.malwareBlocked}</p>
                <p className="text-xs text-muted-foreground">Malware Blocked</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <Eye className="h-5 w-5 text-yellow-500 mb-1" />
                <p className="text-2xl font-bold">{stats.trackersBlocked}</p>
                <p className="text-xs text-muted-foreground">Trackers Blocked</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <Ban className="h-5 w-5 text-purple-500 mb-1" />
                <p className="text-2xl font-bold">{stats.adsBlocked}</p>
                <p className="text-xs text-muted-foreground">Ads Blocked</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <FileWarning className="h-5 w-5 text-orange-500 mb-1" />
                <p className="text-2xl font-bold">{stats.phishingBlocked}</p>
                <p className="text-xs text-muted-foreground">Phishing Blocked</p>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Protection Features</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <Label className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Switch 
                      checked={value} 
                      onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, [key]: checked }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Scan */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm font-medium">Manual Threat Scan</p>
                <p className="text-xs text-muted-foreground">
                  Last scan: {stats.lastScanTime?.toLocaleTimeString() || 'Never'}
                </p>
              </div>
              <Button onClick={runManualScan} disabled={scanning} size="sm">
                {scanning ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                {scanning ? 'Scanning...' : 'Scan Now'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Dark Web Monitor Component ====================

export function DarkWebMonitor({ onAlertFound }: DarkWebMonitorProps) {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<DarkWebAlert[]>([]);
  const [_monitoredItems, setMonitoredItems] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  // Load saved data
  useEffect(() => {
    const savedAlerts = localStorage.getItem('dark-web-alerts');
    const savedItems = localStorage.getItem('dark-web-monitored');
    const savedLastScan = localStorage.getItem('dark-web-last-scan');
    
    if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
    if (savedItems) setMonitoredItems(JSON.parse(savedItems));
    if (savedLastScan) setLastScan(new Date(savedLastScan));
  }, []);

  const runDarkWebScan = async () => {
    setScanning(true);
    toast({
      title: "Scanning Dark Web...",
      description: "Checking for compromised credentials"
    });
    
    // Simulate scan (in real app, this would call a dark web monitoring API)
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Simulate finding breaches
    const possibleBreaches: DarkWebAlert[] = [
      {
        id: crypto.randomUUID(),
        type: 'email',
        source: 'Unknown Database Leak',
        discoveredAt: new Date(),
        severity: 'high',
        affectedData: 'user@example.com',
        resolved: false
      }
    ];
    
    const foundBreach = Math.random() > 0.7;
    if (foundBreach) {
      setAlerts(prev => [...prev, ...possibleBreaches]);
      localStorage.setItem('dark-web-alerts', JSON.stringify([...alerts, ...possibleBreaches]));
      onAlertFound?.(possibleBreaches);
      toast({
        title: "⚠️ Breach Detected",
        description: "Your credentials may have been compromised",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Scan Complete",
        description: "No new breaches found"
      });
    }
    
    setLastScan(new Date());
    localStorage.setItem('dark-web-last-scan', new Date().toISOString());
    setScanning(false);
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => {
      const updated = prev.map(a => a.id === alertId ? { ...a, resolved: true } : a);
      localStorage.setItem('dark-web-alerts', JSON.stringify(updated));
      return updated;
    });
    toast({
      title: "Alert Resolved",
      description: "This breach has been marked as resolved"
    });
  };

  const unresolvedAlerts = alerts.filter(a => !a.resolved);

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Dark Web Monitor</CardTitle>
              <CardDescription>Get alerts if your data appears in breaches</CardDescription>
            </div>
          </div>
          <Badge variant={unresolvedAlerts.length > 0 ? "destructive" : "secondary"}>
            {unresolvedAlerts.length} Alert{unresolvedAlerts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scan Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium">Monitoring Status</p>
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
            {scanning ? 'Scanning...' : 'Scan Now'}
          </Button>
        </div>

        {/* Alerts List */}
        {unresolvedAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-red-600">Active Alerts</h4>
            {unresolvedAlerts.map(alert => (
              <div 
                key={alert.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-sm">{alert.source}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.type.toUpperCase()} • Found {alert.discoveredAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => resolveAlert(alert.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolve
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* No Alerts */}
        {unresolvedAlerts.length === 0 && (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-green-600">All Clear</p>
            <p className="text-sm text-muted-foreground">No data breaches detected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Double VPN Component ====================

export function DoubleVPN({ onConnect, isConnected, currentServer }: DoubleVPNProps) {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  
  // Sample Double VPN servers
  const doubleVPNServers: DoubleVPNServer[] = [
    { id: 'us-ch', entryCountry: 'United States', entryCity: 'New York', exitCountry: 'Switzerland', exitCity: 'Zurich', load: 34, ping: 125 },
    { id: 'uk-nl', entryCountry: 'United Kingdom', entryCity: 'London', exitCountry: 'Netherlands', exitCity: 'Amsterdam', load: 28, ping: 85 },
    { id: 'ca-de', entryCountry: 'Canada', entryCity: 'Toronto', exitCountry: 'Germany', exitCity: 'Frankfurt', load: 41, ping: 140 },
    { id: 'au-sg', entryCountry: 'Australia', entryCity: 'Sydney', exitCountry: 'Singapore', exitCity: 'Singapore', load: 22, ping: 95 },
    { id: 'jp-kr', entryCountry: 'Japan', entryCity: 'Tokyo', exitCountry: 'South Korea', exitCity: 'Seoul', load: 18, ping: 65 },
  ];

  const handleConnect = async (server: DoubleVPNServer) => {
    setConnecting(true);
    try {
      await onConnect(server);
      toast({
        title: "Double VPN Connected",
        description: `${server.entryCountry} → ${server.exitCountry}`
      });
    } catch {
      toast({
        title: "Connection Failed",
        description: "Failed to establish Double VPN connection",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Card className="border-2 border-green-200 dark:border-green-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Double VPN (Multi-Hop)</CardTitle>
              <CardDescription>Route through two servers for extra encryption</CardDescription>
            </div>
          </div>
          {isConnected && currentServer && (
            <Badge variant="default" className="bg-green-500">
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* How it works */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="font-medium">You</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900">Entry Server</span>
            <span>→</span>
            <Lock className="h-4 w-4 text-green-500" />
            <span>→</span>
            <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900">Exit Server</span>
            <span>→</span>
            <span className="font-medium">Internet</span>
          </div>
        </div>

        {/* Server List */}
        <div className="space-y-2">
          {doubleVPNServers.map(server => (
            <div 
              key={server.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                currentServer?.id === server.id 
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="font-medium text-sm">{server.entryCountry}</p>
                  <p className="text-xs text-muted-foreground">{server.entryCity}</p>
                </div>
                <Link2 className="h-4 w-4 text-muted-foreground rotate-90" />
                <div className="text-center">
                  <p className="font-medium text-sm">{server.exitCountry}</p>
                  <p className="text-xs text-muted-foreground">{server.exitCity}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm">{server.ping}ms</p>
                  <p className="text-xs text-muted-foreground">{server.load}% load</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleConnect(server)}
                  disabled={connecting || (isConnected && currentServer?.id === server.id)}
                  variant={currentServer?.id === server.id ? "secondary" : "default"}
                >
                  {currentServer?.id === server.id ? 'Connected' : 'Connect'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            Double VPN provides maximum security but may reduce connection speed. 
            Recommended for sensitive activities.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Main Advanced Features Component ====================

interface VPNAdvancedFeaturesProps {
  threatProtectionEnabled: boolean;
  onThreatProtectionToggle: (enabled: boolean) => void;
  onDoubleVPNConnect: (server: DoubleVPNServer) => Promise<void>;
  isDoubleVPNConnected: boolean;
  currentDoubleVPNServer?: DoubleVPNServer | null;
}

export function VPNAdvancedFeatures({
  threatProtectionEnabled,
  onThreatProtectionToggle,
  onDoubleVPNConnect,
  isDoubleVPNConnected,
  currentDoubleVPNServer
}: VPNAdvancedFeaturesProps) {
  return (
    <Tabs defaultValue="threat-protection" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="threat-protection" className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          Threat Protection
        </TabsTrigger>
        <TabsTrigger value="dark-web" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Dark Web Monitor
        </TabsTrigger>
        <TabsTrigger value="double-vpn" className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Double VPN
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="threat-protection" className="mt-4">
        <ThreatProtectionPro 
          enabled={threatProtectionEnabled}
          onToggle={onThreatProtectionToggle}
        />
      </TabsContent>
      
      <TabsContent value="dark-web" className="mt-4">
        <DarkWebMonitor />
      </TabsContent>
      
      <TabsContent value="double-vpn" className="mt-4">
        <DoubleVPN 
          onConnect={onDoubleVPNConnect}
          isConnected={isDoubleVPNConnected}
          currentServer={currentDoubleVPNServer}
        />
      </TabsContent>
    </Tabs>
  );
}

export default VPNAdvancedFeatures;
