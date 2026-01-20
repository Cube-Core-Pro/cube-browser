"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('LeadScoring');

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input as _Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress as _Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select as _Select, SelectContent as _SelectContent, SelectItem as _SelectItem, SelectTrigger as _SelectTrigger, SelectValue as _SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Settings,
  RefreshCcw,
  BarChart3 as _BarChart3,
  Users,
  Mail as _Mail,
  MousePointer,
  Calendar as _Calendar,
  Clock as _Clock,
  Building,
  Globe as _Globe,
  Briefcase as _Briefcase,
  DollarSign as _DollarSign,
  Activity,
  Zap,
  Star as _Star,
  AlertTriangle as _AlertTriangle,
  CheckCircle2 as _CheckCircle2,
  XCircle as _XCircle,
  Edit2,
  Trash2,
  Save as _Save,
  Play as _Play,
  Pause as _Pause,
  History as _History,
  Eye,
  Filter as _Filter,
  Loader2,
} from 'lucide-react';
import {
  ScoringRule,
  LeadScore,
  ScoringModel as _ScoringModel,
  LeadScoringConfig,
  ScoreCategory,
  ScoreTrend,
} from '@/types/crm-elite';
import './LeadScoring.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendScoringCondition {
  field: string;
  operator: string;
  value: string | number | boolean;
}

interface BackendScoringRule {
  id: string;
  name: string;
  category: string;
  condition: BackendScoringCondition;
  points: number;
  isActive: boolean;
  description: string;
}

interface BackendScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  rules: string[];
}

interface BackendScoreHistory {
  date: number;
  score: number;
  change: number;
  reason: string;
}

interface BackendLeadScore {
  id: string;
  leadId: string;
  totalScore: number;
  maxPossibleScore: number;
  percentile: number;
  grade: string;
  trend: string;
  breakdown: BackendScoreBreakdown[];
  lastUpdated: number;
  history: BackendScoreHistory[];
}

interface BackendLeadScoringConfig {
  leads: BackendLeadScore[];
  scoringRules: BackendScoringRule[];
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

function convertBackendRule(backend: BackendScoringRule): ScoringRule {
  return {
    id: backend.id,
    name: backend.name,
    category: backend.category as ScoreCategory,
    condition: {
      field: backend.condition.field,
      operator: backend.condition.operator as 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'exists',
      value: backend.condition.value,
    },
    points: backend.points,
    isActive: backend.isActive,
    description: backend.description,
  };
}

function convertBackendLeadScore(backend: BackendLeadScore): LeadScore {
  return {
    id: backend.id,
    leadId: backend.leadId,
    totalScore: backend.totalScore,
    maxPossibleScore: backend.maxPossibleScore,
    percentile: backend.percentile,
    grade: backend.grade as 'A' | 'B' | 'C' | 'D' | 'F',
    trend: backend.trend as ScoreTrend,
    breakdown: backend.breakdown.map(b => ({
      category: b.category as ScoreCategory,
      score: b.score,
      maxScore: b.maxScore,
      rules: b.rules.map(ruleId => ({
        ruleId,
        ruleName: ruleId,
        points: 0,
        triggered: true,
      })),
    })),
    lastUpdated: new Date(backend.lastUpdated),
    history: backend.history.map(h => ({
      date: new Date(h.date),
      score: h.score,
      change: h.change,
      reason: h.reason,
    })),
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getCategoryIcon = (category: ScoreCategory) => {
  switch (category) {
    case 'demographic':
      return Users;
    case 'behavioral':
      return MousePointer;
    case 'engagement':
      return Activity;
    case 'firmographic':
      return Building;
    default:
      return Target;
  }
};

const getCategoryColor = (category: ScoreCategory): string => {
  switch (category) {
    case 'demographic':
      return '#3b82f6';
    case 'behavioral':
      return '#8b5cf6';
    case 'engagement':
      return '#22c55e';
    case 'firmographic':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
};

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A':
      return '#22c55e';
    case 'B':
      return '#84cc16';
    case 'C':
      return '#f59e0b';
    case 'D':
      return '#f97316';
    case 'F':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const getTrendIcon = (trend: ScoreTrend) => {
  switch (trend) {
    case 'rising':
      return TrendingUp;
    case 'falling':
      return TrendingDown;
    default:
      return Minus;
  }
};

const getTrendColor = (trend: ScoreTrend): string => {
  switch (trend) {
    case 'rising':
      return '#22c55e';
    case 'falling':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface RuleCardProps {
  rule: ScoringRule;
  onToggle: (id: string) => void;
  onEdit: (rule: ScoringRule) => void;
  onDelete: (id: string) => void;
}

function RuleCard({ rule, onToggle, onEdit, onDelete }: RuleCardProps) {
  const CategoryIcon = getCategoryIcon(rule.category);
  
  return (
    <div className={`rule-card ${rule.isActive ? 'active' : 'inactive'}`}>
      <div className="rule-header">
        <div className="flex items-center gap-2">
          <div 
            className="rule-icon"
            style={{ 
              backgroundColor: `${getCategoryColor(rule.category)}15`,
              color: getCategoryColor(rule.category),
            }}
          >
            <CategoryIcon className="h-4 w-4" />
          </div>
          <div>
            <span className="font-medium">{rule.name}</span>
            <Badge variant="outline" className="ml-2 text-xs">
              {rule.category}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={rule.points > 0 ? 'default' : 'destructive'}
            className="font-mono"
          >
            {rule.points > 0 ? '+' : ''}{rule.points} pts
          </Badge>
          <Switch
            checked={rule.isActive}
            onCheckedChange={() => onToggle(rule.id)}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{rule.description}</p>
      <div className="rule-condition">
        <code className="text-xs">
          {rule.condition.field} {rule.condition.operator} {String(rule.condition.value)}
        </code>
      </div>
      <div className="rule-actions">
        <Button size="sm" variant="ghost" onClick={() => onEdit(rule)}>
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(rule.id)}>
          <Trash2 className="h-4 w-4 mr-1 text-red-500" />
          Delete
        </Button>
      </div>
    </div>
  );
}

interface ScoreBreakdownProps {
  score: LeadScore;
}

function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const TrendIcon = getTrendIcon(score.trend);
  
  return (
    <div className="score-breakdown">
      <div className="score-main">
        <div 
          className="score-grade"
          style={{ backgroundColor: getGradeColor(score.grade) }}
        >
          {score.grade}
        </div>
        <div className="score-value">
          <span className="text-4xl font-bold">{score.totalScore}</span>
          <span className="text-muted-foreground">/ {score.maxPossibleScore}</span>
        </div>
        <div 
          className="score-trend"
          style={{ color: getTrendColor(score.trend) }}
        >
          <TrendIcon className="h-4 w-4" />
          <span>{score.trend}</span>
        </div>
      </div>
      
      <div className="score-percentile">
        <span className="text-sm text-muted-foreground">Percentile</span>
        <div className="percentile-bar">
          <div 
            className="percentile-fill"
            style={{ width: `${score.percentile}%` }}
          />
        </div>
        <span className="text-sm font-medium">Top {100 - score.percentile}%</span>
      </div>
      
      <div className="score-categories">
        {score.breakdown.map(cat => {
          const CategoryIcon = getCategoryIcon(cat.category);
          const percentage = cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0;
          return (
            <div key={cat.category} className="category-row">
              <div className="flex items-center gap-2">
                <CategoryIcon 
                  className="h-4 w-4"
                  style={{ color: getCategoryColor(cat.category) }}
                />
                <span className="text-sm capitalize">{cat.category}</span>
              </div>
              <div className="category-bar-wrapper">
                <div className="category-bar">
                  <div 
                    className="category-fill"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: getCategoryColor(cat.category),
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {cat.score}/{cat.maxScore}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface LeadScoringProps {
  onClose?: () => void;
}

export function LeadScoring({ onClose: _onClose }: LeadScoringProps) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<LeadScoringConfig>({
    enabled: true,
    activeModelId: 'default',
    autoRefresh: true,
    refreshInterval: 'hourly',
    notifyOnHotLead: true,
    notifyThreshold: 80,
    includeHistoricalData: true,
    decayEnabled: true,
    decayRate: 5,
    decayPeriod: 30,
  });
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [_leadScores, setLeadScores] = useState<LeadScore[]>([]);
  const [selectedScore, _setSelectedScore] = useState<LeadScore | null>(null);
  const [activeTab, setActiveTab] = useState('rules');
  const { toast } = useToast();

  // Fetch data from backend on mount
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendLeadScoringConfig>('get_lead_scoring_config');
        
        if (mounted) {
          const convertedRules = backendConfig.scoringRules.map(convertBackendRule);
          const convertedScores = backendConfig.leads.map(convertBackendLeadScore);
          setRules(convertedRules);
          setLeadScores(convertedScores);
          if (convertedScores.length > 0) {
            _setSelectedScore(convertedScores[0]);
          }
        }
      } catch (error) {
        if (mounted) {
          log.error('Failed to fetch lead scoring config:', error);
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to load lead scoring data',
            variant: 'destructive',
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [toast]);

  const activeRules = rules.filter(r => r.isActive);
  const totalMaxScore = activeRules.reduce((acc, r) => acc + r.points, 0);
  
  const categoryStats = useMemo(() => {
    const stats: Record<ScoreCategory, { count: number; points: number }> = {
      demographic: { count: 0, points: 0 },
      behavioral: { count: 0, points: 0 },
      engagement: { count: 0, points: 0 },
      firmographic: { count: 0, points: 0 },
    };
    
    activeRules.forEach(rule => {
      stats[rule.category].count++;
      stats[rule.category].points += rule.points;
    });
    
    return stats;
  }, [activeRules]);

  const handleToggleRule = useCallback(async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    
    const newActiveState = !rule.isActive;
    
    try {
      await invoke('toggle_scoring_rule', { ruleId: id, active: newActiveState });
      setRules(prev => prev.map(r => 
        r.id === id ? { ...r, isActive: newActiveState } : r
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to toggle rule',
        variant: 'destructive',
      });
    }
  }, [rules, toast]);

  const handleEditRule = useCallback((rule: ScoringRule) => {
    toast({
      title: 'Edit Rule',
      description: rule.name,
    });
  }, [toast]);

  const handleDeleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast({
      title: 'Rule Deleted',
    });
  }, [toast]);

  const handleRecalculateScores = useCallback(() => {
    toast({
      title: 'Recalculating Scores',
      description: 'All lead scores are being updated...',
    });
  }, [toast]);

  if (loading) {
    return (
      <div className="lead-scoring">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading lead scoring...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="lead-scoring">
      {/* Header */}
      <div className="scoring-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Lead Scoring</h2>
            <p className="text-sm text-muted-foreground">
              Automated lead qualification and prioritization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRecalculateScores}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Recalculate All
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="scoring-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{activeRules.length}</span>
            <span className="stat-label">Active Rules</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{totalMaxScore}</span>
            <span className="stat-label">Max Score</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">24</span>
            <span className="stat-label">Hot Leads</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">68</span>
            <span className="stat-label">Avg Score</span>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score Distribution by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="category-distribution">
            {(Object.keys(categoryStats) as ScoreCategory[]).map(category => {
              const CategoryIcon = getCategoryIcon(category);
              const stats = categoryStats[category];
              const percentage = totalMaxScore > 0 ? (stats.points / totalMaxScore) * 100 : 0;
              
              return (
                <div key={category} className="distribution-item">
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryIcon 
                      className="h-4 w-4"
                      style={{ color: getCategoryColor(category) }}
                    />
                    <span className="font-medium capitalize">{category}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {stats.count} rules
                    </Badge>
                  </div>
                  <div className="distribution-bar">
                    <div 
                      className="distribution-fill"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getCategoryColor(category),
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{stats.points} points</span>
                    <span>{Math.round(percentage)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">
            <Target className="h-4 w-4 mr-2" />
            Scoring Rules ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Score Preview
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {rules.map(rule => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={handleToggleRule}
                  onEdit={handleEditRule}
                  onDelete={handleDeleteRule}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Score Preview</CardTitle>
              <CardDescription>
                See how scoring rules apply to a sample lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedScore && (
                <ScoreBreakdown score={selectedScore} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Scoring Settings</CardTitle>
              <CardDescription>
                Configure scoring behavior and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Enable Lead Scoring</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically score all leads
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(enabled) => 
                    setConfig(prev => ({ ...prev, enabled }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Auto-Refresh Scores</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically recalculate scores periodically
                  </p>
                </div>
                <Switch
                  checked={config.autoRefresh}
                  onCheckedChange={(autoRefresh) => 
                    setConfig(prev => ({ ...prev, autoRefresh }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Hot Lead Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a lead reaches hot status
                  </p>
                </div>
                <Switch
                  checked={config.notifyOnHotLead}
                  onCheckedChange={(notifyOnHotLead) => 
                    setConfig(prev => ({ ...prev, notifyOnHotLead }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Hot Lead Threshold</Label>
                  <p className="text-sm text-muted-foreground">
                    Score threshold for hot lead classification
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[config.notifyThreshold]}
                    onValueChange={([value]) => 
                      setConfig(prev => ({ ...prev, notifyThreshold: value }))}
                    min={50}
                    max={100}
                    step={5}
                    className="w-32"
                  />
                  <span className="text-sm font-medium w-8">{config.notifyThreshold}</span>
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <Label>Score Decay</Label>
                  <p className="text-sm text-muted-foreground">
                    Gradually reduce scores for inactive leads
                  </p>
                </div>
                <Switch
                  checked={config.decayEnabled}
                  onCheckedChange={(decayEnabled) => 
                    setConfig(prev => ({ ...prev, decayEnabled }))}
                />
              </div>

              {config.decayEnabled && (
                <div className="setting-row">
                  <div>
                    <Label>Decay Rate</Label>
                    <p className="text-sm text-muted-foreground">
                      Points to reduce per {config.decayPeriod} days of inactivity
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[config.decayRate]}
                      onValueChange={([value]) => 
                        setConfig(prev => ({ ...prev, decayRate: value }))}
                      min={1}
                      max={20}
                      step={1}
                      className="w-32"
                    />
                    <span className="text-sm font-medium w-8">-{config.decayRate}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LeadScoring;
