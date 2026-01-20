'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('DealsManager');

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  CRMService, 
  type Deal as ServiceDeal, 
  type Pipeline as _ServicePipeline,
  type CRMStats as ServiceCRMStats,
  type DealStage 
} from '@/lib/services/crm-service';
import {
  Target,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  BarChart3,
  Percent,
  RefreshCw
} from 'lucide-react';
import './DealsManager.css';

// Extended Deal type for UI with additional display fields
interface Deal extends ServiceDeal {
  name?: string;  // UI alias for title
  contact_name?: string;
  company_name?: string;
  expected_close?: string;  // UI alias for expected_close_date
  actual_close?: string;
  assigned_to?: string;
  source?: string;
  description?: string;  // UI alias for notes
  lost_reason?: string;
  last_activity?: string;
}

interface PipelineStage {
  id: string;
  name: string;
  probability: number;
  order: number;
  color: string;
}

interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
  is_default: boolean;
  created_at?: string;
}

// Extended CRMStats for UI with additional computed fields
interface CRMStats extends ServiceCRMStats {
  contacts_this_month?: number;
  contacts_growth?: number;
  companies_growth?: number;
  open_deals?: number;  // alias for active_deals
  pipeline_value?: number;  // alias for total_value
  weighted_value?: number;
  win_rate?: number;  // can be computed from conversion_rate
}

interface CreateDealInput {
  name: string;
  value: number;
  stage?: string;
  contact_id?: string;
  company_id?: string;
  assigned_to?: string;
  expected_close?: string;
  description?: string;
  tags?: string[];
}

const DealsManager: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [newDeal, setNewDeal] = useState<CreateDealInput>({
    name: '',
    value: 0,
    stage: 'lead',
    description: '',
    tags: []
  });

  const loadDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dealsData, pipelinesData, statsData] = await Promise.all([
        CRMService.deals.getAll(),
        CRMService.pipelines.getAll(),
        CRMService.analytics.getStats()
      ]);

      setDeals(dealsData);
      setPipelines(pipelinesData);
      // Use the default pipeline or first one
      const defaultPipeline = pipelinesData.find((p: Pipeline) => p.is_default) || pipelinesData[0];
      if (defaultPipeline) {
        setPipeline(defaultPipeline);
      }
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deals');
      log.error('Failed to load deals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeal.name.trim() || newDeal.value <= 0) return;

    try {
      const deal = await CRMService.deals.create({
        title: newDeal.name.trim(),
        value: newDeal.value,
        stage: (newDeal.stage as DealStage) || 'Lead',
        contactId: newDeal.contact_id,
        companyId: newDeal.company_id,
        expectedCloseDate: newDeal.expected_close,
        notes: newDeal.description
      });

      setDeals(prev => [...prev, deal]);
      setNewDeal({ name: '', value: 0, stage: 'lead', description: '', tags: [] });
      setShowNewDeal(false);
      await loadDeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deal');
    }
  };

  const handleUpdateStage = async (dealId: string, newStage: string) => {
    try {
      const stage = pipeline?.stages.find(s => s.id === newStage);
      await CRMService.deals.updateStage({
        dealId,
        newStage: newStage as DealStage,
        probability: stage?.probability
      });
      
      setDeals(prev => prev.map(d => 
        d.id === dealId 
          ? { ...d, stage: newStage as DealStage, probability: stage?.probability || d.probability }
          : d
      ));
      await loadDeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deal stage');
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      await CRMService.deals.delete(dealId);
      setDeals(prev => prev.filter(d => d.id !== dealId));
      setSelectedDeal(null);
      await loadDeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deal');
    }
  };

  const handleWinDeal = async (dealId: string) => {
    try {
      await CRMService.deals.updateStage({
        dealId,
        newStage: 'ClosedWon'
      });
      await loadDeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark deal as won');
    }
  };

  const handleLoseDeal = async (dealId: string, _reason: string) => {
    try {
      await CRMService.deals.updateStage({
        dealId,
        newStage: 'ClosedLost'
      });
      await loadDeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark deal as lost');
    }
  };

  // Filter deals
  const filteredDeals = useMemo(() => {
    let result = [...deals];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(deal => {
        const dealName = deal.name || deal.title || '';
        return dealName.toLowerCase().includes(query) ||
          (deal.company_name && deal.company_name.toLowerCase().includes(query)) ||
          (deal.contact_name && deal.contact_name.toLowerCase().includes(query));
      });
    }
    
    if (selectedStage) {
      result = result.filter(deal => deal.stage === selectedStage);
    }
    
    return result;
  }, [deals, searchQuery, selectedStage]);

  // Group deals by stage for Kanban
  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    if (pipeline) {
      pipeline.stages.forEach(stage => {
        grouped[stage.id] = filteredDeals.filter(d => d.stage === stage.id);
      });
    }
    return grouped;
  }, [filteredDeals, pipeline]);

  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '$0';
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
    
    if (days < 0) return `${Math.abs(days)} days ago`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `${days} days`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  const getStageColor = (stageId: string): string => {
    const stage = pipeline?.stages.find(s => s.id === stageId);
    return stage?.color || '#6b7280';
  };

  const getStageName = (stageId: string): string => {
    const stage = pipeline?.stages.find(s => s.id === stageId);
    return stage?.name || stageId;
  };

  const isOverdue = (deal: Deal): boolean => {
    if (!deal.expected_close) return false;
    return new Date(deal.expected_close) < new Date() && !['closed_won', 'closed_lost'].includes(deal.stage);
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId) {
      handleUpdateStage(dealId, stageId);
    }
  };

  if (loading) {
    return (
      <div className="deals-manager loading">
        <div className="loading-spinner">
          <RefreshCw className="animate-spin" size={32} />
          <p>Loading deals...</p>
        </div>
      </div>
    );
  }

  // Default stats to prevent undefined errors
  const safeStats = stats || {
    total_contacts: 0,
    contacts_this_month: 0,
    contacts_growth: 0,
    total_companies: 0,
    companies_growth: 0,
    total_deals: 0,
    open_deals: 0,
    won_deals: 0,
    lost_deals: 0,
    pipeline_value: 0,
    weighted_value: 0,
    won_value: 0,
    lost_value: 0,
    avg_deal_size: 0,
    win_rate: 0,
    conversion_rate: 0,
  };

  return (
    <div className="deals-manager">
      {/* Header */}
      <div className="deals-header">
        <div className="header-left">
          <h2>
            <Target size={24} />
            Deals
          </h2>
          <span className="deal-count">{filteredDeals.length} deals</span>
        </div>
        <div className="header-actions">
          <button 
            className="btn-refresh"
            onClick={loadDeals}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <div className="view-toggle">
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={viewMode === 'kanban' ? 'active' : ''}
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </button>
          </div>
          <button 
            className="btn-primary"
            onClick={() => setShowNewDeal(true)}
          >
            <Plus size={18} />
            New Deal
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="deals-stats">
        <div className="stat-card">
          <div className="stat-icon pipeline">
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(safeStats.pipeline_value)}</span>
            <span className="stat-label">Total Pipeline</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon weighted">
            <BarChart3 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(safeStats.weighted_value)}</span>
            <span className="stat-label">Weighted Value</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon won">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(safeStats.won_value)}</span>
            <span className="stat-label">{safeStats.won_deals} Won</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rate">
              <Percent size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{(safeStats.win_rate ?? 0).toFixed(0)}%</span>
              <span className="stat-label">Win Rate</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon avg">
              <TrendingUp size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(safeStats.avg_deal_size)}</span>
              <span className="stat-label">Avg Deal Size</span>
            </div>
          </div>
        </div>

      {/* Search & Filters */}
      <div className="deals-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="stage-filter">
          <select
            value={selectedStage || ''}
            onChange={(e) => setSelectedStage(e.target.value || null)}
          >
            <option value="">All Stages</option>
            {pipeline?.stages.map(stage => (
              <option key={stage.id} value={stage.id}>{stage.name}</option>
            ))}
          </select>
        </div>
        <button 
          className={`btn-filter ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* New Deal Form */}
      {showNewDeal && (
        <div className="new-deal-form">
          <form onSubmit={handleCreateDeal}>
            <h3>Create New Deal</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Deal Name *</label>
                <input
                  type="text"
                  value={newDeal.name}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter deal name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Value *</label>
                <input
                  type="number"
                  value={newDeal.value}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  placeholder="Deal value"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Stage</label>
                <select
                  value={newDeal.stage}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, stage: e.target.value }))}
                >
                  {pipeline?.stages.filter(s => !['closed_won', 'closed_lost'].includes(s.id)).map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Expected Close</label>
                <input
                  type="date"
                  value={newDeal.expected_close || ''}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, expected_close: e.target.value }))}
                />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={newDeal.description}
                  onChange={(e) => setNewDeal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deal description..."
                  rows={3}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Create Deal</button>
              <button type="button" className="btn-secondary" onClick={() => setShowNewDeal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'list' ? (
        <div className="deals-list">
          {filteredDeals.length === 0 ? (
            <div className="empty-state">
              <Target size={48} />
              <h3>No deals found</h3>
              <p>Create your first deal to get started</p>
            </div>
          ) : (
            <table className="deals-table">
              <thead>
                <tr>
                  <th>Deal</th>
                  <th>Value</th>
                  <th>Stage</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Expected Close</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map(deal => (
                  <tr 
                    key={deal.id} 
                    className={isOverdue(deal) ? 'overdue' : ''}
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <td className="deal-name">
                      <div className="deal-name-cell">
                        <span className="name">{deal.name}</span>
                        {deal.tags.length > 0 && (
                          <div className="tags">
                            {deal.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="deal-value">{formatCurrency(deal.value)}</td>
                    <td>
                      <span 
                        className="stage-badge"
                        style={{ backgroundColor: getStageColor(deal.stage) }}
                      >
                        {getStageName(deal.stage)}
                      </span>
                    </td>
                    <td>{deal.company_name || '-'}</td>
                    <td>{deal.contact_name || '-'}</td>
                    <td className={isOverdue(deal) ? 'overdue-date' : ''}>
                      {formatDate(deal.expected_close)}
                      {isOverdue(deal) && <AlertCircle size={14} />}
                    </td>
                    <td className="actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn-icon"
                        onClick={() => setSelectedDeal(deal)}
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      {!['closed_won', 'closed_lost'].includes(deal.stage) && (
                        <>
                          <button 
                            className="btn-icon success"
                            onClick={() => handleWinDeal(deal.id)}
                            title="Mark as Won"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            className="btn-icon danger"
                            onClick={() => {
                              const reason = prompt('Lost reason:');
                              if (reason) handleLoseDeal(deal.id, reason);
                            }}
                            title="Mark as Lost"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button 
                        className="btn-icon danger"
                        onClick={() => handleDeleteDeal(deal.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="deals-kanban">
          {pipeline?.stages.map(stage => (
            <div
              key={stage.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="column-header" style={{ borderColor: stage.color }}>
                <h4>{stage.name}</h4>
                <span className="count">{dealsByStage[stage.id]?.length || 0}</span>
              </div>
              <div className="column-content">
                {dealsByStage[stage.id]?.map(deal => (
                  <div
                    key={deal.id}
                    className={`kanban-card ${isOverdue(deal) ? 'overdue' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onClick={() => setSelectedDeal(deal)}
                  >
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
                    <div className="card-footer">
                      <span className="expected-close">
                        <Calendar size={14} />
                        {formatDate(deal.expected_close)}
                      </span>
                      {isOverdue(deal) && (
                        <span className="overdue-badge">Overdue</span>
                      )}
                    </div>
                    {deal.tags.length > 0 && (
                      <div className="card-tags">
                        {deal.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
                    style={{ backgroundColor: getStageColor(selectedDeal.stage) }}
                  >
                    {getStageName(selectedDeal.stage)}
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
              {!['closed_won', 'closed_lost'].includes(selectedDeal.stage) && (
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
                      const reason = prompt('Lost reason:');
                      if (reason) {
                        handleLoseDeal(selectedDeal.id, reason);
                        setSelectedDeal(null);
                      }
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
    </div>
  );
};

export default DealsManager;
