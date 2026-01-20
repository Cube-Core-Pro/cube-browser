'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('PipelineKanban');

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { CRMService, Deal, Pipeline as _Pipeline, DealStage } from '@/lib/services/crm-service';
import {
  Target,
  Settings,
  MoreVertical,
  Calendar,
  Building2,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  Brain,
  Sparkles,
  Search,
  RefreshCw
} from 'lucide-react';
import './PipelineKanban.css';

// Extended Deal type for Kanban display
interface KanbanDeal extends Omit<Deal, 'title'> {
  name: string;  // Display name (mapped from title)
  contact_name: string;
  company_name: string;
  expected_close: string;
  actual_close?: string;
  assigned_to: string;
  source: string;
  description?: string;
  lost_reason?: string;
  last_activity: string;
}

// Extended PipelineStage with UI properties
interface KanbanPipelineStage {
  id: string;
  name: string;
  probability: number;
  order: number;
  color: string;
}

// Extended Pipeline for Kanban
interface KanbanPipeline {
  id: string;
  name: string;
  stages: KanbanPipelineStage[];
  is_default: boolean;
  created_at: string;
}

interface AIRecommendation {
  deal_id: string;
  type: 'move' | 'action' | 'risk';
  message: string;
  suggested_stage?: string;
  confidence: number;
}

// Helper function to get stage colors
const getStageColor = (index: number): string => {
  const colors = [
    '#6366f1', // Lead - Indigo
    '#8b5cf6', // Qualified - Purple
    '#ec4899', // Proposal - Pink
    '#f59e0b', // Negotiation - Amber
    '#10b981', // ClosedWon - Emerald
    '#ef4444', // ClosedLost - Red
  ];
  return colors[index % colors.length];
};

const PipelineKanban: React.FC = () => {
  const [deals, setDeals] = useState<KanbanDeal[]>([]);
  const [pipeline, setPipeline] = useState<KanbanPipeline | null>(null);
  const [pipelines, setPipelines] = useState<KanbanPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState<KanbanDeal | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<KanbanDeal | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dealsData, pipelinesData] = await Promise.all([
        CRMService.deals.getAll(),
        CRMService.pipelines.getAll()
      ]);

      // Transform Deal data to KanbanDeal format
      const kanbanDeals: KanbanDeal[] = dealsData.map(deal => ({
        ...deal,
        name: deal.title,
        contact_name: '',  // Would need to be fetched separately
        company_name: '',  // Would need to be fetched separately
        expected_close: deal.expected_close_date || '',
        assigned_to: '',
        source: '',
        last_activity: deal.updated_at,
      }));

      // Transform Pipeline data to KanbanPipeline format
      const kanbanPipelines: KanbanPipeline[] = pipelinesData.map(p => ({
        ...p,
        created_at: '',
        stages: p.stages.map((s, idx) => ({
          ...s,
          probability: s.order * 20,  // Default probability based on order
          color: getStageColor(idx),
        })),
      }));

      setDeals(kanbanDeals);
      setPipelines(kanbanPipelines);
      
      // Select default pipeline
      const defaultPipeline = kanbanPipelines.find(p => p.is_default) || kanbanPipelines[0];
      if (defaultPipeline) {
        setPipeline(defaultPipeline);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline data');
      log.error('Failed to load pipeline:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDragStart = (deal: KanbanDeal) => {
    setDraggedDeal(deal);
  };

  const handleDragEnd = () => {
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedDeal || draggedDeal.stage === stageId) {
      setDraggedDeal(null);
      return;
    }

    try {
      await CRMService.deals.updateStage({
        dealId: draggedDeal.id,
        newStage: stageId as DealStage,
      });

      setDeals(prev => prev.map(d =>
        d.id === draggedDeal.id ? { ...d, stage: stageId as DealStage } : d
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deal stage');
    }

    setDraggedDeal(null);
  };

  const handleMoveDeal = async (dealId: string, direction: 'left' | 'right') => {
    if (!pipeline) return;

    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    const currentStageIndex = pipeline.stages.findIndex(s => s.id === deal.stage);
    const newStageIndex = direction === 'left' ? currentStageIndex - 1 : currentStageIndex + 1;

    if (newStageIndex < 0 || newStageIndex >= pipeline.stages.length) return;

    const newStage = pipeline.stages[newStageIndex];
    
    try {
      await CRMService.deals.updateStage({
        dealId: dealId,
        newStage: newStage.id as DealStage,
      });

      setDeals(prev => prev.map(d =>
        d.id === dealId ? { ...d, stage: newStage.id as DealStage } : d
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move deal');
    }
  };

  const handleWinDeal = async (dealId: string) => {
    try {
      await CRMService.deals.updateStage({
        dealId: dealId,
        newStage: 'ClosedWon',
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark deal as won');
    }
  };

  const handleLoseDeal = async (dealId: string) => {
    const reason = prompt('Enter lost reason:');
    if (!reason) return;

    try {
      await CRMService.deals.updateStage({
        dealId: dealId,
        newStage: 'ClosedLost',
        // Note: lost_reason would need to be handled separately
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark deal as lost');
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      await CRMService.deals.delete(dealId);
      setDeals(prev => prev.filter(d => d.id !== dealId));
      setSelectedDeal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deal');
    }
  };

  // Filter deals
  const filteredDeals = useMemo(() => {
    if (!searchQuery) return deals;
    const query = searchQuery.toLowerCase();
    return deals.filter(d =>
      d.name.toLowerCase().includes(query) ||
      d.company_name.toLowerCase().includes(query) ||
      d.contact_name.toLowerCase().includes(query)
    );
  }, [deals, searchQuery]);

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const grouped: Record<string, KanbanDeal[]> = {};
    if (pipeline) {
      pipeline.stages.forEach(stage => {
        grouped[stage.id] = filteredDeals.filter(d => d.stage === stage.id);
      });
    }
    return grouped;
  }, [filteredDeals, pipeline]);

  // Calculate stage totals
  const stageTotals = useMemo(() => {
    const totals: Record<string, { count: number; value: number }> = {};
    if (pipeline) {
      pipeline.stages.forEach(stage => {
        const stageDeals = dealsByStage[stage.id] || [];
        totals[stage.id] = {
          count: stageDeals.length,
          value: stageDeals.reduce((sum, d) => sum + d.value, 0)
        };
      });
    }
    return totals;
  }, [dealsByStage, pipeline]);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return `${Math.abs(days)}d ago`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `${days}d`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  const isOverdue = (deal: KanbanDeal): boolean => {
    if (!deal.expected_close) return false;
    return new Date(deal.expected_close) < new Date() && !['ClosedWon', 'ClosedLost'].includes(deal.stage);
  };

  const getDaysInStage = (deal: KanbanDeal): number => {
    const updated = new Date(deal.updated_at);
    const now = new Date();
    return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="pipeline-kanban loading">
        <div className="loading-spinner">
          <RefreshCw className="animate-spin" size={32} />
          <p>Loading pipeline...</p>
        </div>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="pipeline-kanban error">
        <AlertCircle size={48} />
        <h3>No Pipeline Found</h3>
        <p>Create a pipeline to get started</p>
      </div>
    );
  }

  return (
    <div className="pipeline-kanban">
      {/* Header */}
      <div className="kanban-header">
        <div className="header-left">
          <h2>
            <Target size={24} />
            {pipeline.name}
          </h2>
          {pipelines.length > 1 && (
            <select
              value={pipeline.id}
              onChange={(e) => {
                const selected = pipelines.find(p => p.id === e.target.value);
                if (selected) setPipeline(selected);
              }}
              className="pipeline-select"
            >
              {pipelines.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="btn-refresh"
            onClick={loadData}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            className={`btn-ai ${showAIPanel ? 'active' : ''}`}
            onClick={() => setShowAIPanel(!showAIPanel)}
            title="AI Recommendations"
          >
            <Brain size={18} />
          </button>
          <button
            className="btn-settings"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* AI Panel */}
      {showAIPanel && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <h3>
              <Sparkles size={18} />
              AI Recommendations
            </h3>
            <button onClick={() => setShowAIPanel(false)}>×</button>
          </div>
          <div className="ai-panel-content">
            {aiRecommendations.length === 0 ? (
              <p className="no-recommendations">
                No AI recommendations available. Recommendations will appear based on deal activity patterns.
              </p>
            ) : (
              aiRecommendations.map((rec, i) => (
                <div key={i} className={`ai-recommendation ${rec.type}`}>
                  <span className="rec-type">{rec.type}</span>
                  <p>{rec.message}</p>
                  <span className="confidence">{(rec.confidence * 100).toFixed(0)}% confidence</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="kanban-board">
        {pipeline.stages.map(stage => (
          <div
            key={stage.id}
            className={`kanban-column ${dragOverStage === stage.id ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Stage Header */}
            <div
              className="column-header"
              style={{ borderTopColor: stage.color }}
            >
              <div className="header-info">
                <h4>{stage.name}</h4>
                <span className="deal-count">{stageTotals[stage.id]?.count || 0}</span>
              </div>
              <div className="header-value">
                {formatCurrency(stageTotals[stage.id]?.value || 0)}
              </div>
              <div className="header-probability">
                {stage.probability}% probability
              </div>
            </div>

            {/* Deals */}
            <div className="column-content">
              {(dealsByStage[stage.id] || []).map(deal => (
                <div
                  key={deal.id}
                  className={`deal-card ${isOverdue(deal) ? 'overdue' : ''} ${draggedDeal?.id === deal.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(deal)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedDeal(deal)}
                >
                  <div className="card-grip">
                    <GripVertical size={14} />
                  </div>
                  
                  <div className="card-content">
                    <div className="card-header">
                      <span className="deal-name">{deal.name}</span>
                      <span className="deal-value">{formatCurrency(deal.value)}</span>
                    </div>

                    {deal.company_name && (
                      <div className="card-company">
                        <Building2 size={14} />
                        <span>{deal.company_name}</span>
                      </div>
                    )}

                    <div className="card-meta">
                      <span className="expected-close">
                        <Calendar size={12} />
                        {formatDate(deal.expected_close)}
                      </span>
                      <span className="days-in-stage">
                        <Clock size={12} />
                        {getDaysInStage(deal)}d
                      </span>
                    </div>

                    {isOverdue(deal) && (
                      <div className="overdue-badge">
                        <AlertCircle size={12} />
                        Overdue
                      </div>
                    )}

                    {deal.tags.length > 0 && (
                      <div className="card-tags">
                        {deal.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                        {deal.tags.length > 2 && (
                          <span className="tag more">+{deal.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-move"
                      onClick={() => handleMoveDeal(deal.id, 'left')}
                      disabled={pipeline.stages.findIndex(s => s.id === deal.stage) === 0}
                      title="Move left"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      className="btn-move"
                      onClick={() => handleMoveDeal(deal.id, 'right')}
                      disabled={pipeline.stages.findIndex(s => s.id === deal.stage) === pipeline.stages.length - 1}
                      title="Move right"
                    >
                      <ArrowRight size={14} />
                    </button>
                    <div className="more-actions">
                      <button className="btn-more">
                        <MoreVertical size={14} />
                      </button>
                      <div className="dropdown">
                        <button onClick={() => setSelectedDeal(deal)}>
                          <Eye size={14} /> View
                        </button>
                        <button className="success" onClick={() => handleWinDeal(deal.id)}>
                          <CheckCircle2 size={14} /> Mark Won
                        </button>
                        <button className="danger" onClick={() => handleLoseDeal(deal.id)}>
                          <XCircle size={14} /> Mark Lost
                        </button>
                        <button className="danger" onClick={() => handleDeleteDeal(deal.id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {(dealsByStage[stage.id] || []).length === 0 && (
                <div className="empty-stage">
                  <p>No deals in this stage</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <div className="deal-modal-overlay" onClick={() => setSelectedDeal(null)}>
          <div className="deal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedDeal.name}</h3>
              <button className="close-btn" onClick={() => setSelectedDeal(null)}>×</button>
            </div>
            <div className="modal-content">
              <div className="deal-details">
                <div className="detail-row">
                  <span className="label">Value</span>
                  <span className="value">{formatCurrency(selectedDeal.value)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Stage</span>
                  <span
                    className="stage-badge"
                    style={{ backgroundColor: pipeline.stages.find(s => s.id === selectedDeal.stage)?.color }}
                  >
                    {pipeline.stages.find(s => s.id === selectedDeal.stage)?.name || selectedDeal.stage}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Probability</span>
                  <span className="value">{selectedDeal.probability}%</span>
                </div>
                <div className="detail-row">
                  <span className="label">Company</span>
                  <span className="value">{selectedDeal.company_name || 'Not assigned'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Contact</span>
                  <span className="value">{selectedDeal.contact_name || 'Not assigned'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Expected Close</span>
                  <span className="value">{formatDate(selectedDeal.expected_close)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Owner</span>
                  <span className="value">{selectedDeal.assigned_to || 'Unassigned'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Days in Stage</span>
                  <span className="value">{getDaysInStage(selectedDeal)} days</span>
                </div>
                {selectedDeal.description && (
                  <div className="detail-row full">
                    <span className="label">Description</span>
                    <span className="value notes">{selectedDeal.description}</span>
                  </div>
                )}
                {selectedDeal.tags.length > 0 && (
                  <div className="detail-row">
                    <span className="label">Tags</span>
                    <div className="tags">
                      {selectedDeal.tags.map((tag, i) => (
                        <span key={i} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedDeal.lost_reason && (
                  <div className="detail-row full">
                    <span className="label">Lost Reason</span>
                    <span className="value lost">{selectedDeal.lost_reason}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              {!['closedwon', 'closedlost'].includes(selectedDeal.stage) && (
                <>
                  <button
                    className="btn-success"
                    onClick={() => {
                      handleWinDeal(selectedDeal.id);
                      setSelectedDeal(null);
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Mark as Won
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => {
                      handleLoseDeal(selectedDeal.id);
                      setSelectedDeal(null);
                    }}
                  >
                    <XCircle size={16} />
                    Mark as Lost
                  </button>
                </>
              )}
              <button
                className="btn-secondary"
                onClick={() => {
                  handleDeleteDeal(selectedDeal.id);
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="settings-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Settings size={20} />
                Pipeline Settings
              </h3>
              <button className="close-btn" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="settings-section">
                <h4>Stages</h4>
                <div className="stages-list">
                  {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                  {pipeline.stages.map((stage, _index) => (
                    <div key={stage.id} className="stage-item">
                      <div
                        className="stage-color"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="stage-name">{stage.name}</span>
                      <span className="stage-probability">{stage.probability}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineKanban;
