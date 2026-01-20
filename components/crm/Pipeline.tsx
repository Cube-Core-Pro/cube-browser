"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('Pipeline');

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Kanban,
  Plus,
  MoreVertical,
  DollarSign,
  User,
  Building,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Filter,
  Settings,
  BarChart3,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Target,
  Loader2,
} from 'lucide-react';
import {
  PipelineStage,
  Deal,
  DealStatus,
  PipelineConfig,
} from '@/types/crm-elite';
import './Pipeline.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendOwner {
  id: string;
  name: string;
  avatar?: string;
}

interface BackendCompany {
  id: string;
  name: string;
}

interface BackendContact {
  id: string;
  name: string;
  email: string;
  role: string;
  isPrimary: boolean;
}

interface BackendActivity {
  id: string;
  type: string;
  description: string;
  createdAt: number;
}

interface BackendProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface BackendDeal {
  id: string;
  name: string;
  pipelineId: string;
  stageId: string;
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate: number;
  status: string;
  owner: BackendOwner;
  company: BackendCompany;
  contacts: BackendContact[];
  products: BackendProduct[];
  activities: BackendActivity[];
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
}

interface BackendStageAutomation {
  onEnter: string[];
  onExit: string[];
}

interface BackendPipelineStage {
  id: string;
  name: string;
  type: string;
  order: number;
  probability: number;
  color: string;
  rottenAfterDays: number;
  requiredFields: string[];
  automations: BackendStageAutomation;
}

interface BackendPipelineConfig {
  deals: BackendDeal[];
  stages: BackendPipelineStage[];
  totalValue: number;
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

function convertBackendDeal(backend: BackendDeal): Deal {
  return {
    id: backend.id,
    name: backend.name,
    pipelineId: backend.pipelineId,
    stageId: backend.stageId,
    value: backend.value,
    currency: backend.currency,
    probability: backend.probability,
    expectedCloseDate: new Date(backend.expectedCloseDate),
    status: backend.status as DealStatus,
    owner: backend.owner,
    company: backend.company,
    contacts: backend.contacts,
    products: backend.products,
    activities: backend.activities.map(a => ({
      id: a.id,
      type: a.type as 'email' | 'note' | 'call' | 'meeting' | 'task',
      description: a.description,
      createdAt: new Date(a.createdAt),
    })),
    tags: backend.tags,
    customFields: backend.customFields,
    createdAt: new Date(backend.createdAt),
    updatedAt: new Date(backend.updatedAt),
    closedAt: backend.closedAt ? new Date(backend.closedAt) : undefined,
  };
}

function convertBackendStage(backend: BackendPipelineStage): PipelineStage {
  return {
    id: backend.id,
    name: backend.name,
    type: backend.type as 'open' | 'working' | 'closed-won' | 'closed-lost',
    order: backend.order,
    probability: backend.probability,
    color: backend.color,
    rottenAfterDays: backend.rottenAfterDays,
    requiredFields: backend.requiredFields,
    automations: backend.automations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) {
    return `${Math.abs(days)}d overdue`;
  } else if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Tomorrow';
  } else if (days <= 7) {
    return `${days}d`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

const getStatusColor = (status: DealStatus): string => {
  switch (status) {
    case 'active':
      return '#22c55e';
    case 'stalled':
      return '#f59e0b';
    case 'at-risk':
      return '#ef4444';
    case 'won':
      return '#22c55e';
    case 'lost':
      return '#6b7280';
    default:
      return '#6b7280';
  }
};

const getStatusIcon = (status: DealStatus) => {
  switch (status) {
    case 'active':
      return CheckCircle2;
    case 'stalled':
      return Clock;
    case 'at-risk':
      return AlertTriangle;
    case 'won':
      return CheckCircle2;
    case 'lost':
      return XCircle;
    default:
      return CheckCircle2;
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onMove: (deal: Deal, stageId: string) => void;
}

function DealCard({ deal, onEdit, onMove: _onMove }: DealCardProps) {
  const StatusIcon = getStatusIcon(deal.status);
  const isOverdue = deal.expectedCloseDate < new Date() && deal.status === 'active';
  
  return (
    <div 
      className={`deal-card ${deal.status} ${isOverdue ? 'overdue' : ''}`}
      draggable
    >
      <div className="deal-header">
        <span className="deal-name">{deal.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(deal)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-500">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="deal-company">
        <Building className="h-3 w-3" />
        <span>{deal.company.name}</span>
      </div>
      
      <div className="deal-value">
        {formatCurrency(deal.value, deal.currency)}
      </div>
      
      <div className="deal-footer">
        <div className="flex items-center gap-2">
          <StatusIcon 
            className="h-3 w-3"
            style={{ color: getStatusColor(deal.status) }}
          />
          <span 
            className="text-xs"
            style={{ color: isOverdue ? '#ef4444' : 'inherit' }}
          >
            {formatDate(deal.expectedCloseDate)}
          </span>
        </div>
        <div className="deal-owner">
          <User className="h-3 w-3" />
          <span className="text-xs">{deal.owner.name.split(' ')[0]}</span>
        </div>
      </div>
      
      {deal.tags.length > 0 && (
        <div className="deal-tags">
          {deal.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {deal.tags.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{deal.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface StageColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onEditDeal: (deal: Deal) => void;
  onMoveDeal: (deal: Deal, stageId: string) => void;
  onAddDeal: (stageId: string) => void;
}

function StageColumn({ stage, deals, onEditDeal, onMoveDeal, onAddDeal }: StageColumnProps) {
  const stageValue = deals.reduce((acc, deal) => acc + deal.value, 0);
  const weightedValue = deals.reduce((acc, deal) => acc + (deal.value * deal.probability / 100), 0);
  
  return (
    <div className="stage-column">
      <div className="stage-header" style={{ borderTopColor: stage.color }}>
        <div className="flex items-center gap-2">
          <span 
            className="stage-dot"
            style={{ backgroundColor: stage.color }}
          />
          <span className="font-medium">{stage.name}</span>
          <Badge variant="secondary" className="text-xs">
            {deals.length}
          </Badge>
        </div>
        <span className="text-sm font-medium">
          {formatCurrency(stageValue)}
        </span>
      </div>
      
      <div className="stage-meta">
        <span className="text-xs text-muted-foreground">
          {stage.probability}% probability
        </span>
        <span className="text-xs text-muted-foreground">
          Weighted: {formatCurrency(weightedValue)}
        </span>
      </div>
      
      <ScrollArea className="stage-content">
        <div className="space-y-2 pb-2">
          {deals.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              onEdit={onEditDeal}
              onMove={onMoveDeal}
            />
          ))}
        </div>
      </ScrollArea>
      
      <Button 
        variant="ghost" 
        className="stage-add-btn"
        onClick={() => onAddDeal(stage.id)}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Deal
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface PipelineProps {
  onClose?: () => void;
}

export function PipelineView({ onClose: _onClose }: PipelineProps) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<PipelineConfig>({
    defaultPipelineId: 'pipeline-1',
    showProbability: true,
    showWeightedValue: true,
    enableDragDrop: true,
    rottenDealAlerts: true,
    autoArchiveClosedDeals: false,
    archiveAfterDays: 30,
    dealCardFields: ['company', 'value', 'closeDate', 'owner'],
    sortBy: 'value',
    sortDirection: 'desc',
    viewMode: 'kanban',
  });
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeTab, setActiveTab] = useState('pipeline');
  const { toast } = useToast();

  // Fetch data from backend on mount
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendPipelineConfig>('get_pipeline_config');
        
        if (mounted) {
          const convertedDeals = backendConfig.deals.map(convertBackendDeal);
          const convertedStages = backendConfig.stages.map(convertBackendStage);
          setDeals(convertedDeals);
          setStages(convertedStages);
        }
      } catch (error) {
        if (mounted) {
          log.error('Failed to fetch pipeline config:', error);
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to load pipeline data',
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

  // Metrics
  const totalValue = deals.reduce((acc, d) => acc + d.value, 0);
  const weightedValue = deals.reduce((acc, d) => acc + (d.value * d.probability / 100), 0);
  const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0;
  const wonDeals = deals.filter(d => d.status === 'won');
  const wonValue = wonDeals.reduce((acc, d) => acc + d.value, 0);

  const dealsByStage = useMemo(() => {
    const result: Record<string, Deal[]> = {};
    stages.forEach(stage => {
      result[stage.id] = deals.filter(d => d.stageId === stage.id);
    });
    return result;
  }, [stages, deals]);

  const handleEditDeal = useCallback((deal: Deal) => {
    toast({
      title: 'Edit Deal',
      description: deal.name,
    });
  }, [toast]);

  const handleMoveDeal = useCallback(async (deal: Deal, newStageId: string) => {
    try {
      await invoke('move_deal_stage', { dealId: deal.id, stageId: newStageId });
      setDeals(prev => prev.map(d => 
        d.id === deal.id ? { ...d, stageId: newStageId } : d
      ));
      toast({
        title: 'Deal Moved',
        description: `${deal.name} moved to new stage`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to move deal',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleAddDeal = useCallback((stageId: string) => {
    toast({
      title: 'Add New Deal',
      description: `Adding to ${stages.find(s => s.id === stageId)?.name}`,
    });
  }, [stages, toast]);

  if (loading) {
    return (
      <div className="pipeline-view">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading pipeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pipeline-view">
      {/* Header */}
      <div className="pipeline-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Kanban className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Sales Pipeline</h2>
            <p className="text-sm text-muted-foreground">
              Track and manage your deals
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="pipeline-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{formatCurrency(totalValue)}</span>
            <span className="stat-label">Pipeline Value</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{formatCurrency(weightedValue)}</span>
            <span className="stat-label">Weighted Value</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{formatCurrency(wonValue)}</span>
            <span className="stat-label">Won This Month</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{formatCurrency(avgDealSize)}</span>
            <span className="stat-label">Avg Deal Size</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pipeline">
            <Kanban className="h-4 w-4 mr-2" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="forecast">
            <TrendingUp className="h-4 w-4 mr-2" />
            Forecast
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="pipeline-tab-content">
          <div className="kanban-board">
            {stages.filter(s => s.type !== 'closed-won' || dealsByStage[s.id].length > 0).map(stage => (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={dealsByStage[stage.id] || []}
                onEditDeal={handleEditDeal}
                onMoveDeal={handleMoveDeal}
                onAddDeal={handleAddDeal}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue Forecast</CardTitle>
              <CardDescription>
                Projected revenue based on deal probability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="forecast-grid">
                {stages.slice(0, -1).map(stage => {
                  const stageDeals = dealsByStage[stage.id] || [];
                  const total = stageDeals.reduce((acc, d) => acc + d.value, 0);
                  const weighted = stageDeals.reduce((acc, d) => acc + (d.value * stage.probability / 100), 0);
                  
                  return (
                    <div key={stage.id} className="forecast-item">
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="font-medium">{stage.name}</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(weighted)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stage.probability}% of {formatCurrency(total)}
                      </div>
                      <Progress 
                        value={stage.probability} 
                        className="mt-2"
                        style={{ '--progress-color': stage.color } as React.CSSProperties}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pipeline Settings</CardTitle>
              <CardDescription>
                Configure pipeline display and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Show Probability</Label>
                  <p className="text-sm text-muted-foreground">
                    Display probability % on deal cards
                  </p>
                </div>
                <Switch
                  checked={config.showProbability}
                  onCheckedChange={(showProbability) => 
                    setConfig(prev => ({ ...prev, showProbability }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Weighted Values</Label>
                  <p className="text-sm text-muted-foreground">
                    Show probability-weighted pipeline value
                  </p>
                </div>
                <Switch
                  checked={config.showWeightedValue}
                  onCheckedChange={(showWeightedValue) => 
                    setConfig(prev => ({ ...prev, showWeightedValue }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Drag & Drop</Label>
                  <p className="text-sm text-muted-foreground">
                    Move deals between stages by dragging
                  </p>
                </div>
                <Switch
                  checked={config.enableDragDrop}
                  onCheckedChange={(enableDragDrop) => 
                    setConfig(prev => ({ ...prev, enableDragDrop }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Rotten Deal Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Highlight deals that haven&apos;t moved
                  </p>
                </div>
                <Switch
                  checked={config.rottenDealAlerts}
                  onCheckedChange={(rottenDealAlerts) => 
                    setConfig(prev => ({ ...prev, rottenDealAlerts }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Auto-Archive Closed Deals</Label>
                  <p className="text-sm text-muted-foreground">
                    Archive won/lost deals after a period
                  </p>
                </div>
                <Switch
                  checked={config.autoArchiveClosedDeals}
                  onCheckedChange={(autoArchiveClosedDeals) => 
                    setConfig(prev => ({ ...prev, autoArchiveClosedDeals }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PipelineView;
