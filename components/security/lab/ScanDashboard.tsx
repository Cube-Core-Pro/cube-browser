'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, Clock, Play, Pause, RefreshCw, Target } from 'lucide-react';
import type { VulnerabilityScan, SecurityLabConfig } from '@/types/security-lab';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('ScanDashboard');

interface ScanDashboardProps {
  scans: VulnerabilityScan[];
  config: SecurityLabConfig | null;
  loading: boolean;
  onStartScan: (targetUrl: string, scanType: string, scanner: string) => Promise<void>;
  onCancelScan: (scanId: string) => Promise<void>;
  onSelectScan: (scan: VulnerabilityScan) => void;
  onVerifyDomain?: (domain: string, method: string) => Promise<void>;
  onUpdateConfig?: (config: SecurityLabConfig) => Promise<void>;
}

export const ScanDashboard: React.FC<ScanDashboardProps> = ({
  scans,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config,
  loading,
  onStartScan,
  onCancelScan,
  onSelectScan,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onVerifyDomain,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpdateConfig
}) => {
  const [targetUrl, setTargetUrl] = React.useState('');
  const [scanType, setScanType] = React.useState('full');
  const [scanner, setScanner] = React.useState('zap');
  const [selectedScanId, setSelectedScanId] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(false);
  const [urlError, setUrlError] = React.useState<string | null>(null);
  const [validatingUrl, setValidatingUrl] = React.useState(false);

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Check if URL is reachable
  const checkUrlReachable = async (url: string): Promise<boolean> => {
    try {
      // Use a simple fetch with no-cors mode to check if URL exists
      // Note: This won't work for all sites due to CORS, but catches obvious errors
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(url, { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTargetUrl(value);
    setUrlError(null);
    
    // Basic validation as user types
    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      if (value.includes('.') && !value.includes(' ')) {
        // Looks like a domain without protocol - don't show error yet
      } else if (value.length > 5) {
        setUrlError('URL must start with http:// or https://');
      }
    }
  };

  const handleStartScan = async () => {
    const url = targetUrl.trim();
    
    // Check if URL is empty
    if (!url) {
      setUrlError('Please enter a URL to scan');
      return;
    }
    
    // Add protocol if missing
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }

    // Validate URL format locally first
    if (!isValidUrl(finalUrl)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setValidatingUrl(true);
    setUrlError(null);

    // Check if URL is reachable (optional - CORS may block this)
    try {
      const isReachable = await checkUrlReachable(finalUrl);
      if (!isReachable) {
        log.warn('Could not verify URL reachability (may be due to CORS)');
      }
    } catch (reachError) {
      log.warn('Reachability check failed:', reachError);
    }

    setValidatingUrl(false);
    setStarting(true);
    
    try {
      await onStartScan(finalUrl, scanType, scanner);
      setTargetUrl('');
      setUrlError(null);
    } catch (error) {
      log.error('Failed to start scan:', error);
      // Extract and display the error message from the backend
      let errorMessage = 'Failed to start scan';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      // Make error messages more user-friendly
      if (errorMessage.includes('Invalid URL format')) {
        errorMessage = 'Invalid URL format. Please enter a valid URL starting with http:// or https://';
      } else if (errorMessage.includes('Invalid protocol')) {
        errorMessage = 'Only http:// and https:// protocols are supported';
      } else if (errorMessage.includes('Invalid domain')) {
        errorMessage = 'Please enter a valid domain name (e.g., example.com)';
      } else if (errorMessage.includes('cannot be empty')) {
        errorMessage = 'Please enter a URL to scan';
      }
      setUrlError(errorMessage);
    } finally {
      setStarting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    switch (s) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'pending': return 'bg-orange-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase() || '';
    switch (s) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4 animate-pulse" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* New Scan Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            New Vulnerability Scan
          </CardTitle>
          <CardDescription>
            Enter the target URL and configure scan parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="https://example.com"
                value={targetUrl}
                onChange={handleUrlChange}
                className={urlError ? 'border-red-500' : ''}
              />
              {urlError && (
                <p className="text-sm text-red-500">{urlError}</p>
              )}
            </div>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
              aria-label="Scan type"
              title="Select scan type"
            >
              <option value="full">Full Scan</option>
              <option value="quick">Quick Scan</option>
              <option value="standard">Standard</option>
              <option value="custom">Custom</option>
            </select>
            <select
              value={scanner}
              onChange={(e) => setScanner(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
              aria-label="Scanner"
              title="Select scanner"
            >
              <option value="zap">OWASP ZAP</option>
              <option value="nuclei">Nuclei</option>
              <option value="both">Both</option>
            </select>
            <Button onClick={handleStartScan} disabled={starting || validatingUrl || !targetUrl.trim() || !!urlError}>
              {validatingUrl ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : starting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Scan
                </>
              )}
            </Button>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              Only scan systems you own or have explicit permission to test.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Scans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Vulnerability Scans
          </CardTitle>
          <CardDescription>
            {scans.length} scan(s) in history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : scans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scans yet. Start a new scan above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan) => {
                const scanId = scan.scanId || scan.scan_id || '';
                return (
                <div
                  key={scanId}
                  onClick={() => {
                    setSelectedScanId(scanId);
                    onSelectScan(scan);
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                    selectedScanId === scanId ? 'border-primary bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`${getStatusColor(scan.status)} text-white`}>
                        {getStatusIcon(scan.status)}
                        <span className="ml-1">{scan.status}</span>
                      </Badge>
                      <span className="font-medium truncate max-w-md">{scan.targetUrl || scan.target_url}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(scan.status?.toLowerCase() === 'running' || scan.status?.toLowerCase() === 'pending') && (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onCancelScan(scan.scanId || scan.scan_id || ''); 
                          }}
                          title="Cancel this scan"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {(scan.status?.toLowerCase() === 'running' || scan.status?.toLowerCase() === 'pending') && (
                    <Progress value={(scan.progress || 0) * 100} className="h-2 mb-2" />
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Type: {scan.scanType || scan.scan_type}</span>
                    <span>Scanner: {scan.scanner}</span>
                    {(scan.findingsCount || scan.findings_count || 0) > 0 && (
                      <span className="text-red-600">
                        {scan.findingsCount || scan.findings_count} finding(s)
                        {(scan.criticalCount || scan.critical_count || 0) > 0 && ` (${scan.criticalCount || scan.critical_count} critical)`}
                      </span>
                    )}
                    <span>
                      Started: {new Date(scan.startedAt || scan.started_at || '').toLocaleString()}
                    </span>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanDashboard;
