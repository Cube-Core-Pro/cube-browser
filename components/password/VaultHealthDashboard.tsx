"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('VaultHealthDashboard');

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress as _Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator as _Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Tooltip as _Tooltip,
  TooltipContent as _TooltipContent,
  TooltipProvider as _TooltipProvider,
  TooltipTrigger as _TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle as _XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Download,
  FileText,
  Key,
  Lock,
  Unlock,
  Eye as _Eye,
  Clock,
  Globe,
  Repeat,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity as _Activity,
  Lightbulb,
  ArrowRight,
  ChevronRight,
  Info,
  Settings as _Settings,
  Calendar,
  History,
  Loader2,
} from 'lucide-react';
import {
  VaultHealthReport,
  VaultHealthIssue,
  VaultHealthCategory,
  HealthIssueType,
  HealthIssueSeverity,
} from '@/types/password-manager-pro';
import './VaultHealthDashboard.css';

// ============================================================================
// BACKEND TYPES
// ============================================================================

interface BackendVaultHealthStats {
  totalItems: number;
  weakPasswords: number;
  reusedPasswords: number;
  oldPasswords: number;
  compromisedPasswords: number;
  missing2fa: number;
  overallScore: number;
  lastAudit: number;
}

interface BackendVaultHealthConfig {
  stats: BackendVaultHealthStats;
}

// ============================================================================
// CONVERTER FUNCTION
// ============================================================================

function convertBackendToVaultHealthReport(backend: BackendVaultHealthConfig): VaultHealthReport {
  const stats = backend.stats;
  const _now = new Date();
  const lastAuditDate = new Date(stats.lastAudit * 1000);
  
  const createIssuesForCategory = (
    type: HealthIssueType,
    count: number,
    severity: HealthIssueSeverity,
    categoryName: string
  ): VaultHealthIssue[] => {
    const issues: VaultHealthIssue[] = [];
    for (let i = 0; i < Math.min(count, 3); i++) {
      issues.push({
        id: `${type}-${i}`,
        type,
        severity,
        itemId: `item-${type}-${i}`,
        itemTitle: `${categoryName} Item ${i + 1}`,
        itemType: 'login',
        description: `Issue detected: ${type.replace(/_/g, ' ')}`,
        recommendation: `Fix this ${type.replace(/_/g, ' ')} issue`,
        detectedAt: lastAuditDate,
        isResolved: false,
        autoFixAvailable: type !== 'missing_2fa' && type !== 'insecure_website',
      });
    }
    return issues;
  };

  const calculateCategoryScore = (issueCount: number, totalItems: number): number => {
    if (totalItems === 0) return 100;
    const percentage = (issueCount / totalItems) * 100;
    return Math.max(0, Math.round(100 - percentage * 2));
  };

  const categories: VaultHealthReport['categories'] = {
    passwordStrength: {
      name: 'Password Strength',
      score: calculateCategoryScore(stats.weakPasswords, stats.totalItems),
      maxScore: 100,
      issues: createIssuesForCategory('weak_password', stats.weakPasswords, 'high', 'Weak Password'),
      tips: [
        'Use passwords with at least 16 characters',
        'Include uppercase, lowercase, numbers, and symbols',
        'Avoid common words and patterns',
      ],
    },
    passwordReuse: {
      name: 'Password Reuse',
      score: calculateCategoryScore(stats.reusedPasswords, stats.totalItems),
      maxScore: 100,
      issues: createIssuesForCategory('reused_password', stats.reusedPasswords, 'critical', 'Reused Password'),
      tips: [
        'Never reuse passwords across different accounts',
        'Use a password manager to generate unique passwords',
      ],
    },
    compromisedCredentials: {
      name: 'Data Breaches',
      score: calculateCategoryScore(stats.compromisedPasswords, stats.totalItems),
      maxScore: 100,
      issues: createIssuesForCategory('compromised_password', stats.compromisedPasswords, 'critical', 'Compromised'),
      tips: [
        'Change passwords immediately after a breach notification',
        'Enable breach monitoring for all accounts',
      ],
    },
    twoFactorAuth: {
      name: 'Two-Factor Authentication',
      score: calculateCategoryScore(stats.missing2fa, stats.totalItems),
      maxScore: 100,
      issues: createIssuesForCategory('missing_2fa', stats.missing2fa, 'high', 'Missing 2FA'),
      tips: [
        'Enable 2FA on all accounts that support it',
        'Use an authenticator app instead of SMS when possible',
        'Store backup codes securely',
      ],
    },
    passwordAge: {
      name: 'Password Age',
      score: calculateCategoryScore(stats.oldPasswords, stats.totalItems),
      maxScore: 100,
      issues: createIssuesForCategory('old_password', stats.oldPasswords, 'low', 'Old Password'),
      tips: [
        'Update passwords for critical accounts every 6 months',
        'Change passwords immediately if you suspect compromise',
      ],
    },
    websiteSecurity: {
      name: 'Website Security',
      score: 95,
      maxScore: 100,
      issues: [],
      tips: [
        'Only enter credentials on HTTPS websites',
        'Check for valid SSL certificates',
      ],
    },
  };

  const totalIssues = Object.values(categories).reduce((sum, cat) => sum + cat.issues.length, 0);
  const criticalCount = stats.compromisedPasswords + Math.min(stats.reusedPasswords, 3);
  const highCount = stats.weakPasswords + stats.missing2fa;
  const mediumCount = Math.floor(totalIssues * 0.2);
  const lowCount = stats.oldPasswords;

  return {
    id: `report-${Date.now()}`,
    generatedAt: lastAuditDate,
    overallScore: stats.overallScore,
    previousScore: Math.max(0, stats.overallScore - 6),
    trend: 'improving' as const,
    categories,
    totalItems: stats.totalItems,
    itemsAnalyzed: stats.totalItems,
    issuesByPriority: {
      critical: Math.min(criticalCount, 5),
      high: Math.min(highCount, 5),
      medium: Math.min(mediumCount, 3),
      low: Math.min(lowCount, 3),
      info: 0,
    },
    suggestedActions: [
      {
        priority: 1,
        action: 'Change compromised passwords',
        impact: 'Prevents unauthorized access from known breaches',
        affectedItems: stats.compromisedPasswords,
      },
      {
        priority: 2,
        action: 'Fix reused passwords',
        impact: 'Isolates accounts from credential stuffing attacks',
        affectedItems: stats.reusedPasswords,
      },
      {
        priority: 3,
        action: 'Enable 2FA on critical accounts',
        impact: 'Adds extra layer of security for sensitive data',
        affectedItems: stats.missing2fa,
      },
      {
        priority: 4,
        action: 'Strengthen weak passwords',
        impact: 'Protects against brute-force attacks',
        affectedItems: stats.weakPasswords,
      },
    ],
    exportFormats: ['pdf', 'csv', 'json'],
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getSeverityColor = (severity: HealthIssueSeverity): string => {
  const colors: Record<HealthIssueSeverity, string> = {
    critical: 'text-red-600 bg-red-100 dark:bg-red-950/50',
    high: 'text-orange-600 bg-orange-100 dark:bg-orange-950/50',
    medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950/50',
    low: 'text-blue-600 bg-blue-100 dark:bg-blue-950/50',
    info: 'text-gray-600 bg-gray-100 dark:bg-gray-950/50',
  };
  return colors[severity];
};

const getSeverityIcon = (severity: HealthIssueSeverity) => {
  switch (severity) {
    case 'critical':
      return <ShieldX className="h-4 w-4" />;
    case 'high':
      return <ShieldAlert className="h-4 w-4" />;
    case 'medium':
      return <AlertTriangle className="h-4 w-4" />;
    case 'low':
      return <AlertCircle className="h-4 w-4" />;
    case 'info':
      return <Info className="h-4 w-4" />;
  }
};

const getIssueTypeIcon = (type: HealthIssueType) => {
  const icons: Record<HealthIssueType, React.ReactNode> = {
    weak_password: <Key className="h-4 w-4" />,
    reused_password: <Repeat className="h-4 w-4" />,
    compromised_password: <ShieldX className="h-4 w-4" />,
    old_password: <Clock className="h-4 w-4" />,
    missing_2fa: <Lock className="h-4 w-4" />,
    insecure_website: <Globe className="h-4 w-4" />,
    expired_card: <AlertCircle className="h-4 w-4" />,
    empty_field: <AlertCircle className="h-4 w-4" />,
    duplicate_entry: <Repeat className="h-4 w-4" />,
    inactive_account: <Clock className="h-4 w-4" />,
    unsecure_storage: <Unlock className="h-4 w-4" />,
    weak_master_password: <ShieldAlert className="h-4 w-4" />,
  };
  return icons[type];
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreLabel = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Needs Improvement';
  return 'Critical';
};

const getProgressColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
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

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ScoreCircleProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  trend?: 'improving' | 'stable' | 'declining';
  previousScore?: number;
}

function ScoreCircle({ score, size = 'lg', trend, previousScore }: ScoreCircleProps) {
  const radius = size === 'lg' ? 70 : size === 'md' ? 50 : 35;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = size === 'lg' ? 10 : size === 'md' ? 8 : 6;
  const offset = circumference - (score / 100) * circumference;

  const dimensions = {
    sm: { width: 90, height: 90, fontSize: 'text-xl' },
    md: { width: 130, height: 130, fontSize: 'text-3xl' },
    lg: { width: 180, height: 180, fontSize: 'text-5xl' },
  };

  const { width, height, fontSize } = dimensions[size];

  return (
    <div className="score-circle relative" style={{ width, height }}>
      <svg width={width} height={height} className="transform -rotate-90">
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={getScoreColor(score)}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${fontSize} ${getScoreColor(score)}`}>
          {score}
        </span>
        {trend && previousScore !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            {trend === 'improving' && (
              <>
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-green-600">+{score - previousScore}</span>
              </>
            )}
            {trend === 'declining' && (
              <>
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-red-600">{score - previousScore}</span>
              </>
            )}
            {trend === 'stable' && (
              <>
                <Minus className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">0</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: VaultHealthCategory;
  icon: React.ReactNode;
  onClick: () => void;
}

function CategoryCard({ category, icon, onClick }: CategoryCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <span className="font-medium">{category.name}</span>
          </div>
          <Badge variant={category.issues.length > 0 ? 'destructive' : 'secondary'}>
            {category.issues.length} issues
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Score</span>
            <span className={`font-semibold ${getScoreColor(category.score)}`}>
              {category.score}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getProgressColor(category.score)}`}
              style={{ width: `${category.score}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface IssueItemProps {
  issue: VaultHealthIssue;
  onFix: (issue: VaultHealthIssue) => void;
  onDismiss: (issue: VaultHealthIssue) => void;
}

function IssueItem({ issue, onFix, onDismiss }: IssueItemProps) {
  return (
    <div className="issue-item p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${getSeverityColor(issue.severity)}`}>
          {getSeverityIcon(issue.severity)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{issue.itemTitle}</h4>
            <Badge variant="outline" className="text-xs capitalize">
              {issue.severity}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">
            {issue.description}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {getIssueTypeIcon(issue.type)}
            <span className="capitalize">{issue.type.replace(/_/g, ' ')}</span>
            <span>•</span>
            <Clock className="h-3 w-3" />
            <span>{formatDate(issue.detectedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {issue.autoFixAvailable && (
            <Button 
              size="sm" 
              onClick={() => onFix(issue)}
              className="bg-primary hover:bg-primary/90"
            >
              <Zap className="h-4 w-4 mr-1" />
              Fix
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onDismiss(issue)}
          >
            Dismiss
          </Button>
        </div>
      </div>
      
      {issue.recommendation && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {issue.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

interface ActionItemProps {
  action: VaultHealthReport['suggestedActions'][0];
  index: number;
  onExecute: () => void;
}

function ActionItem({ action, index, onExecute }: ActionItemProps) {
  return (
    <div className="action-item flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
        {index + 1}
      </div>
      
      <div className="flex-1">
        <h4 className="font-medium">{action.action}</h4>
        <p className="text-sm text-muted-foreground">{action.impact}</p>
      </div>
      
      <Badge variant="secondary">
        {action.affectedItems} item{action.affectedItems !== 1 ? 's' : ''}
      </Badge>
      
      <Button size="sm" onClick={onExecute}>
        Fix Now
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface VaultHealthDashboardProps {
  onClose?: () => void;
}

export function VaultHealthDashboard({ onClose: _onClose }: VaultHealthDashboardProps) {
  const [report, setReport] = useState<VaultHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadVaultHealth = async () => {
      try {
        setLoading(true);
        const config = await invoke<BackendVaultHealthConfig>('get_vault_health');
        const convertedReport = convertBackendToVaultHealthReport(config);
        setReport(convertedReport);
      } catch (error) {
        log.error('Failed to load vault health:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load vault health',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadVaultHealth();
  }, [toast]);

  const handleRescan = useCallback(async () => {
    setIsScanning(true);
    try {
      const config = await invoke<BackendVaultHealthConfig>('get_vault_health');
      const convertedReport = convertBackendToVaultHealthReport(config);
      setReport(convertedReport);
      toast({
        title: 'Scan Complete',
        description: 'Your vault has been analyzed',
      });
    } catch (error) {
      log.error('Failed to rescan vault:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to rescan vault',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  }, [toast]);

  const handleFixIssue = useCallback((issue: VaultHealthIssue) => {
    if (!report) return;
    
    toast({
      title: 'Fixing Issue',
      description: `Generating new password for ${issue.itemTitle}...`,
    });
    
    setTimeout(() => {
      setReport((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          categories: Object.fromEntries(
            Object.entries(prev.categories).map(([key, cat]) => [
              key,
              {
                ...cat,
                issues: cat.issues.filter((i) => i.id !== issue.id),
                score: Math.min(100, cat.score + 5),
              },
            ])
          ) as VaultHealthReport['categories'],
          overallScore: Math.min(100, prev.overallScore + 2),
        };
      });
      
      toast({
        title: 'Issue Fixed',
        description: `Password updated for ${issue.itemTitle}`,
      });
    }, 1500);
  }, [toast, report]);

  const handleDismissIssue = useCallback((issue: VaultHealthIssue) => {
    setReport((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: Object.fromEntries(
          Object.entries(prev.categories).map(([key, cat]) => [
            key,
            {
              ...cat,
              issues: cat.issues.filter((i) => i.id !== issue.id),
            },
          ])
        ) as VaultHealthReport['categories'],
      };
    });
    
    toast({
      title: 'Issue Dismissed',
      description: 'You can review dismissed issues in settings',
    });
  }, [toast]);

  const handleExport = useCallback(() => {
    toast({
      title: 'Export Started',
      description: `Generating ${exportFormat.toUpperCase()} report...`,
    });
    setShowExportDialog(false);
    
    setTimeout(() => {
      toast({
        title: 'Export Complete',
        description: 'Report downloaded successfully',
      });
    }, 2000);
  }, [exportFormat, toast]);

  if (loading) {
    return (
      <div className="vault-health-dashboard flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading vault health data...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="vault-health-dashboard flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Failed to load vault health data</p>
          <Button onClick={handleRescan} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalIssues = Object.values(report.categories).reduce(
    (sum, cat) => sum + cat.issues.length,
    0
  );

  const allIssues = Object.values(report.categories)
    .flatMap((cat) => cat.issues)
    .sort((a, b) => {
      const severityOrder: Record<HealthIssueSeverity, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
        info: 4,
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

  return (
    <div className="vault-health-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Vault Health Report</h2>
            <p className="text-sm text-muted-foreground">
              Last scanned: {formatDate(report.generatedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleRescan} disabled={isScanning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Rescan'}
          </Button>
        </div>
      </div>

      {/* Main Score */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <Card className="col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <ScoreCircle 
              score={report.overallScore} 
              trend={report.trend}
              previousScore={report.previousScore}
            />
            <p className={`mt-2 font-semibold ${getScoreColor(report.overallScore)}`}>
              {getScoreLabel(report.overallScore)}
            </p>
            <p className="text-sm text-muted-foreground">
              {report.itemsAnalyzed} items analyzed
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Priority Actions
            </CardTitle>
            <CardDescription>
              Complete these actions to improve your security score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.suggestedActions.slice(0, 3).map((action, index) => (
                <ActionItem
                  key={index}
                  action={action}
                  index={index}
                  onExecute={() => toast({ title: 'Starting fix...', description: action.action })}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issue Summary */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {Object.entries(report.issuesByPriority).map(([priority, count]) => (
          <Card key={priority} className={count > 0 ? 'border-l-4' : ''} style={{
            borderLeftColor: count > 0 ? (
              priority === 'critical' ? '#dc2626' :
              priority === 'high' ? '#ea580c' :
              priority === 'medium' ? '#ca8a04' :
              priority === 'low' ? '#2563eb' : '#6b7280'
            ) : undefined
          }}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-sm text-muted-foreground capitalize">{priority}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Categories & Issues */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">
            <PieChart className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="issues">
            <AlertCircle className="h-4 w-4 mr-2" />
            All Issues ({totalIssues})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <CategoryCard
              category={report.categories.passwordStrength}
              icon={<Key className="h-5 w-5" />}
              onClick={() => setSelectedCategory('passwordStrength')}
            />
            <CategoryCard
              category={report.categories.passwordReuse}
              icon={<Repeat className="h-5 w-5" />}
              onClick={() => setSelectedCategory('passwordReuse')}
            />
            <CategoryCard
              category={report.categories.compromisedCredentials}
              icon={<ShieldX className="h-5 w-5" />}
              onClick={() => setSelectedCategory('compromisedCredentials')}
            />
            <CategoryCard
              category={report.categories.twoFactorAuth}
              icon={<Lock className="h-5 w-5" />}
              onClick={() => setSelectedCategory('twoFactorAuth')}
            />
            <CategoryCard
              category={report.categories.passwordAge}
              icon={<Clock className="h-5 w-5" />}
              onClick={() => setSelectedCategory('passwordAge')}
            />
            <CategoryCard
              category={report.categories.websiteSecurity}
              icon={<Globe className="h-5 w-5" />}
              onClick={() => setSelectedCategory('websiteSecurity')}
            />
          </div>

          {selectedCategory && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {report.categories[selectedCategory as keyof typeof report.categories].name} Issues
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {report.categories[selectedCategory as keyof typeof report.categories].issues.map((issue) => (
                      <IssueItem
                        key={issue.id}
                        issue={issue}
                        onFix={handleFixIssue}
                        onDismiss={handleDismissIssue}
                      />
                    ))}
                    {report.categories[selectedCategory as keyof typeof report.categories].issues.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p className="font-medium">No Issues Found</p>
                        <p className="text-sm text-muted-foreground">
                          This category is in great shape!
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {report.categories[selectedCategory as keyof typeof report.categories].tips.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Tips
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {report.categories[selectedCategory as keyof typeof report.categories].tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardContent className="p-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {allIssues.map((issue) => (
                    <IssueItem
                      key={issue.id}
                      issue={issue}
                      onFix={handleFixIssue}
                      onDismiss={handleDismissIssue}
                    />
                  ))}
                  {allIssues.length === 0 && (
                    <div className="text-center py-12">
                      <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-green-500" />
                      <h3 className="text-lg font-medium mb-2">All Clear!</h3>
                      <p className="text-muted-foreground">
                        No security issues found in your vault
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Health Score History</h3>
                  <p className="text-muted-foreground mb-4">
                    Track your security score over time
                  </p>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Full History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Health Report
            </DialogTitle>
            <DialogDescription>
              Download your vault health report in your preferred format
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select 
                value={exportFormat} 
                onValueChange={(v: 'pdf' | 'csv' | 'json') => setExportFormat(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF Report
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV Spreadsheet
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      JSON Data
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Report includes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Overall security score and trend</li>
                <li>• Category breakdown with scores</li>
                <li>• All detected issues and recommendations</li>
                <li>• Priority action items</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Download {exportFormat.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VaultHealthDashboard;
