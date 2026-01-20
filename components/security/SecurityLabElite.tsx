'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  useSecurityLab,
  VulnerabilityFinding,
  Finding,
  ProxyEntry,
  ScanResult,
  Severity,
} from '@/lib/services/security-lab-elite-service';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Bug,
  Search,
  Target,
  Zap,
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Download,
  Code,
  Filter,
  Trash2,
  ChevronRight,
  ExternalLink,
  X,
  Radio,
  BarChart3,
  Network,
  Terminal,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

type ActiveTab = 'scanner' | 'proxy' | 'fuzzer' | 'headers' | 'graphql';

// ============================================================================
// Sub-Components
// ============================================================================

interface SeverityBadgeProps {
  severity: Severity;
}

function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = {
    critical: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' },
    high: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
    medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' },
    low: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' },
    info: { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/30' },
  };

  const { bg, text, border } = config[severity];

  return (
    <Badge className={`${bg} ${text} border ${border} capitalize`}>
      {severity}
    </Badge>
  );
}

interface ScanStatusCardProps {
  scan: ScanResult | null;
  onStartScan: (url: string) => void;
  onStopScan: () => void;
}

function ScanStatusCard({ scan, onStartScan, onStopScan }: ScanStatusCardProps) {
  const [targetUrl, setTargetUrl] = useState('');

  const handleStart = () => {
    if (targetUrl.trim()) {
      onStartScan(targetUrl.trim());
    }
  };

  const isRunning = scan?.status === 'running';

  return (
    <Card className={isRunning ? 'border-blue-500/50' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Vulnerability Scanner
        </CardTitle>
        <CardDescription>
          Scan web applications for security vulnerabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!scan || scan.status === 'completed' || scan.status === 'cancelled' ? (
          <>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleStart} disabled={!targetUrl.trim()}>
                <Play className="h-4 w-4 mr-2" />
                Scan
              </Button>
            </div>
            {scan?.status === 'completed' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Last scan completed: {scan.findings.length} findings
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm font-medium">Scanning {scan.targetUrl}</span>
              </div>
              <Button variant="destructive" size="sm" onClick={onStopScan}>
                <StopCircle className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>
            
            <Progress value={scan.progress} className="h-2" />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{scan.requestsMade} requests</span>
              <span>{scan.progress}% complete</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FindingsSummaryProps {
  findings: AnyFinding[];
}

function FindingsSummary({ findings }: FindingsSummaryProps) {
  const summary = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Findings Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="p-2 rounded bg-red-500/10">
            <p className="text-2xl font-bold text-red-500">{summary.critical}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
          <div className="p-2 rounded bg-orange-500/10">
            <p className="text-2xl font-bold text-orange-500">{summary.high}</p>
            <p className="text-xs text-muted-foreground">High</p>
          </div>
          <div className="p-2 rounded bg-yellow-500/10">
            <p className="text-2xl font-bold text-yellow-500">{summary.medium}</p>
            <p className="text-xs text-muted-foreground">Medium</p>
          </div>
          <div className="p-2 rounded bg-blue-500/10">
            <p className="text-2xl font-bold text-blue-500">{summary.low}</p>
            <p className="text-xs text-muted-foreground">Low</p>
          </div>
          <div className="p-2 rounded bg-gray-500/10">
            <p className="text-2xl font-bold text-gray-500">{summary.info}</p>
            <p className="text-xs text-muted-foreground">Info</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Union type for findings that can come from different sources
type AnyFinding = VulnerabilityFinding | Finding;

interface FindingCardProps {
  finding: AnyFinding;
  onClick: () => void;
}

function FindingCard({ finding, onClick }: FindingCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={finding.severity} />
              {'cweId' in finding && finding.cweId && (
                <span className="text-xs text-muted-foreground">{finding.cweId}</span>
              )}
              {'cwe' in finding && finding.cwe && !('cweId' in finding) && (
                <span className="text-xs text-muted-foreground">{finding.cwe}</span>
              )}
            </div>
            <h4 className="font-medium">{finding.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {finding.description}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-medium">URL:</span> {finding.url}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

interface FindingDetailProps {
  finding: AnyFinding;
  onClose: () => void;
}

function FindingDetail({ finding, onClose }: FindingDetailProps) {
  // Helper to safely access properties that may not exist on all finding types
  const cweId = 'cweId' in finding ? finding.cweId : ('cwe' in finding ? finding.cwe : undefined);
  const foundAt = 'foundAt' in finding ? finding.foundAt : new Date();
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <SeverityBadge severity={finding.severity} />
            {cweId && <span className="text-sm text-muted-foreground">{cweId}</span>}
          </div>
          <DialogTitle className="text-xl">{finding.title}</DialogTitle>
          <DialogDescription>
            Found on {foundAt.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{finding.description}</p>
          </div>

          {/* Evidence */}
          <div>
            <h4 className="font-medium mb-2">Evidence</h4>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
              {finding.evidence}
            </pre>
          </div>

          {/* Affected URL */}
          <div>
            <h4 className="font-medium mb-2">Affected URL</h4>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-2 py-1 rounded text-sm flex-1 truncate">
                {finding.url}
              </code>
              <Button variant="ghost" size="icon" onClick={() => window.open(finding.url, '_blank')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            {finding.parameter && (
              <p className="text-sm text-muted-foreground mt-1">
                Parameter: <code className="bg-muted px-1 rounded">{finding.parameter}</code>
              </p>
            )}
          </div>

          {/* Remediation */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Remediation
            </h4>
            <p className="text-sm text-muted-foreground">{finding.remediation}</p>
          </div>

          {/* References */}
          {finding.references && finding.references.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">References</h4>
              <ul className="space-y-1">
                {finding.references.map((ref, i) => (
                  <li key={i}>
                    <a
                      href={ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {ref}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Request/Response */}
          {finding.request && (
            <div>
              <h4 className="font-medium mb-2">HTTP Request</h4>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-[200px]">
                {typeof finding.request === 'string' 
                  ? finding.request 
                  : (
                    <>
                      {finding.request.method} {finding.request.path}
                      {'\n'}
                      {Object.entries(finding.request.headers || {})
                        .map(([k, v]) => `${k}: ${v}`)
                        .join('\n')}
                      {finding.request.body && `\n\n${finding.request.body}`}
                    </>
                  )
                }
              </pre>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="destructive" size="sm">
            <Bug className="h-4 w-4 mr-2" />
            Mark as False Positive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ProxyPanelProps {
  entries: ProxyEntry[];
  isIntercepting: boolean;
  onToggleIntercept: () => void;
  onClear: () => void;
}

function ProxyPanel({ entries, isIntercepting, onToggleIntercept, onClear }: ProxyPanelProps) {
  const [selectedEntry, setSelectedEntry] = useState<ProxyEntry | null>(null);

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-green-500/10 text-green-500',
      POST: 'bg-blue-500/10 text-blue-500',
      PUT: 'bg-yellow-500/10 text-yellow-500',
      DELETE: 'bg-red-500/10 text-red-500',
      PATCH: 'bg-purple-500/10 text-purple-500',
    };
    return colors[method] || 'bg-gray-500/10 text-gray-500';
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 300 && status < 400) return 'text-yellow-500';
    if (status >= 400 && status < 500) return 'text-orange-500';
    if (status >= 500) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={isIntercepting ? 'destructive' : 'default'}
            onClick={onToggleIntercept}
          >
            {isIntercepting ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Intercept
              </>
            ) : (
              <>
                <Radio className="h-4 w-4 mr-2" />
                Start Intercept
              </>
            )}
          </Button>
          {isIntercepting && (
            <Badge variant="secondary" className="animate-pulse">
              <span className="h-2 w-2 bg-red-500 rounded-full mr-2 animate-pulse" />
              Intercepting
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onClear}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Request Table */}
      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Method</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[80px]">Time</TableHead>
                <TableHead className="w-[100px]">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className={`cursor-pointer hover:bg-muted/50 ${selectedEntry?.id === entry.id ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <TableCell>
                    <Badge className={getMethodColor(entry.request.method)}>
                      {entry.request.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs truncate max-w-[400px]">
                    {entry.request.url}
                  </TableCell>
                  <TableCell>
                    {entry.response && (
                      <span className={getStatusColor(entry.response.statusCode)}>
                        {entry.response.statusCode}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.response ? `${entry.response.responseTime}ms` : '-'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.response ? formatBytes(entry.response.contentLength) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {isIntercepting ? 'Waiting for requests...' : 'No requests captured'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Request Detail */}
      {selectedEntry && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Request Details</span>
              <Button variant="ghost" size="icon" onClick={() => setSelectedEntry(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="request">
              <TabsList>
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
              </TabsList>
              <TabsContent value="request">
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[200px]">
                  {selectedEntry.request.method} {selectedEntry.request.path} {selectedEntry.request.protocol}
                  {'\n'}Host: {selectedEntry.request.host}
                  {'\n'}
                  {Object.entries(selectedEntry.request.headers)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n')}
                  {selectedEntry.request.body && `\n\n${selectedEntry.request.body}`}
                </pre>
              </TabsContent>
              <TabsContent value="response">
                {selectedEntry.response ? (
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[200px]">
                    HTTP/1.1 {selectedEntry.response.statusCode} {selectedEntry.response.statusText}
                    {'\n'}
                    {Object.entries(selectedEntry.response.headers)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('\n')}
                    {selectedEntry.response.body && `\n\n${selectedEntry.response.body.slice(0, 5000)}`}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">No response yet</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface HeadersAnalyzerProps {
  onAnalyze: (url: string) => Promise<unknown>;
}

function HeadersAnalyzer({ onAnalyze }: HeadersAnalyzerProps) {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    headersPresent: { name: string; value: string; status: string; recommendation?: string }[];
  } | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    try {
      const res = await onAnalyze(url.trim()) as { score: number; headersPresent: { name: string; value: string; status: string; recommendation?: string }[] };
      setResult(res || null);
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'missing':
        return <X className="h-4 w-4 text-red-500" />;
      case 'bad':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Headers Analyzer
          </CardTitle>
          <CardDescription>
            Check if a website implements recommended security headers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAnalyze} disabled={analyzing || !url.trim()}>
              {analyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Analysis Results</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${
                  result.score >= 80 ? 'text-green-500' :
                  result.score >= 50 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {result.score}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.headersPresent.map((header, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
                  {getStatusIcon(header.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{header.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">{header.status}</Badge>
                    </div>
                    {header.value && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        Value: {header.value}
                      </p>
                    )}
                    {header.recommendation && (
                      <p className="text-xs text-blue-500 mt-1">{header.recommendation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ============================================================================
// Main Component
// ============================================================================

interface SecurityLabEliteProps {
  className?: string;
}

export function SecurityLabElite({ className }: SecurityLabEliteProps) {
  const { toast } = useToast();
  const {
    fuzzerResults,
    currentScan,
    isLoading,
    isIntercepting,
    toggleIntercept,
    getProxyEntries,
    clearProxyEntries,
    quickScan,
    stopScan,
    getPayloadSets,
    clearFuzzerResults,
    analyzeHeaders,
    introspectGraphQL,
    generateReport,
  } = useSecurityLab();

  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [selectedFinding, setSelectedFinding] = useState<AnyFinding | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');

  const handleStartScan = async (url: string) => {
    try {
      await quickScan(url);
      toast({ title: "Scan Started", description: `Scanning ${url}` });
    } catch (_error) {
      toast({ title: "Error", description: "Failed to start scan", variant: "destructive" });
    }
  };

  const handleStopScan = () => {
    stopScan();
    toast({ title: "Scan Stopped", description: "Vulnerability scan has been stopped" });
  };

  const filteredFindings = currentScan?.findings.filter(f => 
    severityFilter === 'all' || f.severity === severityFilter
  ) || [];

  const handleExportReport = async () => {
    if (!currentScan) return;
    const report = await generateReport(currentScan);
    const blob = new Blob([report || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: "Security report has been downloaded" });
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Security Lab</h1>
              <p className="text-sm text-muted-foreground">
                Professional security testing toolkit
              </p>
            </div>
          </div>
          {currentScan && currentScan.status === 'completed' && (
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Scanner
            </TabsTrigger>
            <TabsTrigger value="proxy" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Proxy
            </TabsTrigger>
            <TabsTrigger value="fuzzer" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Fuzzer
            </TabsTrigger>
            <TabsTrigger value="headers" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Headers
            </TabsTrigger>
            <TabsTrigger value="graphql" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              GraphQL
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Scanner Tab */}
        <TabsContent value="scanner" className="flex-1 p-4 pt-0 overflow-hidden">
          <div className="h-full flex flex-col gap-4">
            {/* Status and Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ScanStatusCard
                scan={currentScan}
                onStartScan={handleStartScan}
                onStopScan={handleStopScan}
              />
              <FindingsSummary findings={currentScan?.findings || []} />
            </div>

            {/* Findings List */}
            <Card className="flex-1 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    Vulnerabilities ({filteredFindings.length})
                  </CardTitle>
                  <Select
                    value={severityFilter}
                    onValueChange={(v) => setSeverityFilter(v as Severity | 'all')}
                  >
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-520px)]">
                  <div className="space-y-3 p-4">
                    {filteredFindings.map((finding) => (
                      <FindingCard
                        key={finding.id}
                        finding={finding}
                        onClick={() => setSelectedFinding(finding)}
                      />
                    ))}
                    {filteredFindings.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No vulnerabilities found</p>
                        <p className="text-sm">Start a scan to discover security issues</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Proxy Tab */}
        <TabsContent value="proxy" className="flex-1 p-4 pt-0 overflow-hidden">
          <ProxyPanel
            entries={getProxyEntries()}
            isIntercepting={isIntercepting}
            onToggleIntercept={toggleIntercept}
            onClear={clearProxyEntries}
          />
        </TabsContent>

        {/* Fuzzer Tab */}
        <TabsContent value="fuzzer" className="flex-1 p-4 pt-0 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Request Fuzzer
              </CardTitle>
              <CardDescription>
                Test parameters with various payloads to find vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a request from the Proxy tab to start fuzzing</p>
                <p className="text-sm">Available payload sets: {getPayloadSets().length}</p>
              </div>
            </CardContent>
          </Card>

          {/* Fuzzer Results */}
          {fuzzerResults.length > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Fuzzer Results ({fuzzerResults.length})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={clearFuzzerResults}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payload</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Interesting</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuzzerResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-mono text-xs truncate max-w-[200px]">
                            {result.payload}
                          </TableCell>
                          <TableCell>{result.response?.statusCode || '-'}</TableCell>
                          <TableCell>{result.response ? formatBytes(result.response.contentLength) : '-'}</TableCell>
                          <TableCell>{result.response?.responseTime}ms</TableCell>
                          <TableCell>
                            {result.interesting && (
                              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                                Interesting
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Headers Tab */}
        <TabsContent value="headers" className="flex-1 p-4 pt-0 overflow-auto">
          <HeadersAnalyzer onAnalyze={analyzeHeaders} />
        </TabsContent>

        {/* GraphQL Tab */}
        <TabsContent value="graphql" className="flex-1 p-4 pt-0 overflow-auto">
          <GraphQLAnalyzer onIntrospect={introspectGraphQL} />
        </TabsContent>
      </Tabs>

      {/* Finding Detail Modal */}
      {selectedFinding && (
        <FindingDetail
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      )}
    </div>
  );
}

// GraphQL Analyzer Component
interface GraphQLAnalyzerProps {
  onIntrospect: (endpoint: string) => Promise<unknown>;
}

function GraphQLAnalyzer({ onIntrospect }: GraphQLAnalyzerProps) {
  const [endpoint, setEndpoint] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    introspection: {
      endpoint: string;
      types: { name: string; kind: string }[];
      queries: string[];
      mutations: string[];
      subscriptions: string[];
      introspectionEnabled: boolean;
    };
    findings: VulnerabilityFinding[];
  } | null>(null);

  const handleAnalyze = async () => {
    if (!endpoint.trim()) return;
    setAnalyzing(true);
    try {
      const res = await onIntrospect(endpoint.trim()) as typeof result;
      setResult(res);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            GraphQL Introspection
          </CardTitle>
          <CardDescription>
            Analyze GraphQL endpoints for security issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://api.example.com/graphql"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAnalyze} disabled={analyzing || !endpoint.trim()}>
              {analyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Introspection Status */}
          <Card className={result.introspection.introspectionEnabled ? 'border-yellow-500/50' : 'border-green-500/50'}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                {result.introspection.introspectionEnabled ? (
                  <>
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    <div>
                      <h3 className="font-medium text-yellow-600">Introspection Enabled</h3>
                      <p className="text-sm text-muted-foreground">
                        GraphQL introspection should be disabled in production
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="font-medium text-green-600">Introspection Disabled</h3>
                      <p className="text-sm text-muted-foreground">
                        GraphQL introspection is properly disabled
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schema Overview */}
          {result.introspection.introspectionEnabled && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Schema Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded bg-muted">
                    <p className="text-2xl font-bold">{result.introspection.queries.length}</p>
                    <p className="text-sm text-muted-foreground">Queries</p>
                  </div>
                  <div className="p-4 rounded bg-muted">
                    <p className="text-2xl font-bold">{result.introspection.mutations.length}</p>
                    <p className="text-sm text-muted-foreground">Mutations</p>
                  </div>
                  <div className="p-4 rounded bg-muted">
                    <p className="text-2xl font-bold">{result.introspection.subscriptions.length}</p>
                    <p className="text-sm text-muted-foreground">Subscriptions</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Types ({result.introspection.types.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.introspection.types.slice(0, 20).map((type, i) => (
                      <Badge key={i} variant="outline" className="font-mono text-xs">
                        {type.name}
                      </Badge>
                    ))}
                    {result.introspection.types.length > 20 && (
                      <Badge variant="secondary">+{result.introspection.types.length - 20} more</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Findings */}
          {result.findings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Security Findings ({result.findings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.findings.map((finding, i) => (
                    <div key={i} className="p-3 rounded bg-muted">
                      <div className="flex items-center gap-2 mb-1">
                        <SeverityBadge severity={finding.severity} />
                        <span className="font-medium">{finding.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{finding.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default SecurityLabElite;
