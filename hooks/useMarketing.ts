/**
 * CUBE Elite v7 - useMarketing Hook
 * 
 * Centralized React hook for Marketing functionality.
 * Provides state management for campaigns, funnels, leads, templates, and segments.
 * 
 * Features:
 * - Campaign CRUD with scheduling and sending
 * - Funnel management with stages
 * - Lead tracking and scoring
 * - Email template management
 * - Audience segmentation
 * - Marketing analytics
 * 
 * @module hooks/useMarketing
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { logger } from '@/lib/services/logger-service';
import {
  CampaignService,
  FunnelService,
  LeadService,
  TemplateService,
  SegmentService,
  MarketingAnalyticsService,
  Campaign,
  CampaignStatus,
  CampaignType,
  MarketingFunnel,
  Lead,
  LeadStage,
  LeadSource,
  EmailTemplate,
  TemplateType,
  Segment,
  SegmentCriteria,
  MarketingAnalytics,
  MarketingStats,
  MarketingNotification,
} from '@/lib/services/marketing-service';

const log = logger.scope('useMarketing');

// =============================================================================
// Types
// =============================================================================

export interface UseMarketingOptions {
  /** Auto-refresh interval in milliseconds */
  autoRefresh?: number;
  /** Enable real-time updates */
  realtime?: boolean;
  /** Filter campaigns by status */
  campaignStatusFilter?: CampaignStatus;
  /** Filter leads by stage */
  leadStageFilter?: LeadStage;
}

export interface MarketingState {
  campaigns: Campaign[];
  funnels: MarketingFunnel[];
  leads: Lead[];
  templates: EmailTemplate[];
  segments: Segment[];
  analytics: MarketingAnalytics | null;
  stats: MarketingStats | null;
  notifications: MarketingNotification[];
}

export interface MarketingLoadingState {
  campaigns: boolean;
  funnels: boolean;
  leads: boolean;
  templates: boolean;
  segments: boolean;
  analytics: boolean;
  global: boolean;
}

export interface MarketingErrorState {
  campaigns: string | null;
  funnels: string | null;
  leads: string | null;
  templates: string | null;
  segments: string | null;
  analytics: string | null;
}

export interface MarketingFilters {
  campaignStatus?: CampaignStatus;
  campaignType?: CampaignType;
  leadStage?: LeadStage;
  leadSource?: LeadSource;
  templateType?: TemplateType;
  minLeadScore?: number;
}

export interface UseMarketingReturn {
  // State
  data: MarketingState;
  loading: MarketingLoadingState;
  errors: MarketingErrorState;
  filters: MarketingFilters;
  
  // Filter Actions
  setFilters: (filters: Partial<MarketingFilters>) => void;
  clearFilters: () => void;
  
  // Campaign Actions
  createCampaign: (params: {
    name: string;
    campaignType: CampaignType;
    subject: string;
    content: string;
    templateId?: string;
  }) => Promise<Campaign>;
  updateCampaign: (params: {
    id: string;
    name?: string;
    subject?: string;
    content?: string;
    status?: CampaignStatus;
  }) => Promise<Campaign>;
  deleteCampaign: (id: string) => Promise<boolean>;
  sendCampaign: (id: string) => Promise<Campaign>;
  scheduleCampaign: (id: string, scheduledAt: string) => Promise<Campaign>;
  
  // Funnel Actions
  createFunnel: (params: {
    name: string;
    description?: string;
    stages: Array<{ name: string; conversionGoal: number }>;
  }) => Promise<MarketingFunnel>;
  updateFunnel: (params: {
    id: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }) => Promise<MarketingFunnel>;
  deleteFunnel: (id: string) => Promise<boolean>;
  addFunnelStage: (funnelId: string, name: string, conversionGoal: number) => Promise<MarketingFunnel>;
  
  // Lead Actions
  createLead: (params: {
    email: string;
    name: string;
    phone?: string;
    company?: string;
    source?: LeadSource;
    tags?: string[];
  }) => Promise<Lead>;
  updateLeadScore: (leadId: string, newScore: number) => Promise<Lead>;
  moveLeadStage: (leadId: string, newStage: LeadStage) => Promise<Lead>;
  
  // Template Actions
  createTemplate: (params: {
    name: string;
    subject: string;
    content: string;
    templateType: TemplateType;
    previewText?: string;
  }) => Promise<EmailTemplate>;
  deleteTemplate: (id: string) => Promise<boolean>;
  
  // Segment Actions
  createSegment: (params: {
    name: string;
    description?: string;
    criteria: SegmentCriteria[];
  }) => Promise<Segment>;
  deleteSegment: (id: string) => Promise<boolean>;
  
  // Analytics
  refreshAnalytics: (period?: 'day' | 'week' | 'month' | 'quarter' | 'year') => Promise<void>;
  
  // Refresh
  refresh: () => Promise<void>;
  refreshCampaigns: () => Promise<void>;
  refreshFunnels: () => Promise<void>;
  refreshLeads: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  refreshSegments: () => Promise<void>;
  
  // Computed
  activeCampaigns: Campaign[];
  draftCampaigns: Campaign[];
  scheduledCampaigns: Campaign[];
  completedCampaigns: Campaign[];
  hotLeads: Lead[];
  coldLeads: Lead[];
  activeFunnels: MarketingFunnel[];
  unreadNotifications: MarketingNotification[];
  totalLeadScore: number;
  averageLeadScore: number;
}

// =============================================================================
// Cache
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 60000; // 60 seconds
const cache: Map<string, CacheEntry<unknown>> = new Map();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useMarketing(options: UseMarketingOptions = {}): UseMarketingReturn {
  const { 
    autoRefresh, 
    realtime = true, 
    campaignStatusFilter, 
    leadStageFilter 
  } = options;
  
  // State
  const [data, setData] = useState<MarketingState>({
    campaigns: [],
    funnels: [],
    leads: [],
    templates: [],
    segments: [],
    analytics: null,
    stats: null,
    notifications: [],
  });
  
  const [loading, setLoading] = useState<MarketingLoadingState>({
    campaigns: false,
    funnels: false,
    leads: false,
    templates: false,
    segments: false,
    analytics: false,
    global: true,
  });
  
  const [errors, setErrors] = useState<MarketingErrorState>({
    campaigns: null,
    funnels: null,
    leads: null,
    templates: null,
    segments: null,
    analytics: null,
  });
  
  const [filters, setFiltersState] = useState<MarketingFilters>({
    campaignStatus: campaignStatusFilter,
    leadStage: leadStageFilter,
  });
  
  // Refs
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==========================================================================
  // Filter Actions
  // ==========================================================================
  
  const setFilters = useCallback((newFilters: Partial<MarketingFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);
  
  // ==========================================================================
  // Data Fetching
  // ==========================================================================
  
  const fetchCampaigns = useCallback(async () => {
    const cacheKey = `campaigns:${filters.campaignStatus || 'all'}:${filters.campaignType || 'all'}`;
    const cached = getCached<Campaign[]>(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, campaigns: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, campaigns: true }));
    setErrors(prev => ({ ...prev, campaigns: null }));
    
    try {
      const campaigns = await CampaignService.getAll({
        status: filters.campaignStatus,
        campaignType: filters.campaignType,
      });
      setData(prev => ({ ...prev, campaigns }));
      setCache(cacheKey, campaigns);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch campaigns';
      setErrors(prev => ({ ...prev, campaigns: message }));
      log.error('useMarketing: Failed to fetch campaigns:', error);
    } finally {
      setLoading(prev => ({ ...prev, campaigns: false }));
    }
  }, [filters.campaignStatus, filters.campaignType]);
  
  const fetchFunnels = useCallback(async () => {
    const cached = getCached<MarketingFunnel[]>('funnels');
    
    if (cached) {
      setData(prev => ({ ...prev, funnels: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, funnels: true }));
    setErrors(prev => ({ ...prev, funnels: null }));
    
    try {
      const funnels = await FunnelService.getAll();
      setData(prev => ({ ...prev, funnels }));
      setCache('funnels', funnels);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch funnels';
      setErrors(prev => ({ ...prev, funnels: message }));
      log.error('useMarketing: Failed to fetch funnels:', error);
    } finally {
      setLoading(prev => ({ ...prev, funnels: false }));
    }
  }, []);
  
  const fetchLeads = useCallback(async () => {
    const cacheKey = `leads:${filters.leadStage || 'all'}:${filters.leadSource || 'all'}:${filters.minLeadScore || 0}`;
    const cached = getCached<Lead[]>(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, leads: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, leads: true }));
    setErrors(prev => ({ ...prev, leads: null }));
    
    try {
      const leads = await LeadService.getAll({
        stage: filters.leadStage,
        source: filters.leadSource,
        minScore: filters.minLeadScore,
      });
      setData(prev => ({ ...prev, leads }));
      setCache(cacheKey, leads);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch leads';
      setErrors(prev => ({ ...prev, leads: message }));
      log.error('useMarketing: Failed to fetch leads:', error);
    } finally {
      setLoading(prev => ({ ...prev, leads: false }));
    }
  }, [filters.leadStage, filters.leadSource, filters.minLeadScore]);
  
  const fetchTemplates = useCallback(async () => {
    const cacheKey = `templates:${filters.templateType || 'all'}`;
    const cached = getCached<EmailTemplate[]>(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, templates: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, templates: true }));
    setErrors(prev => ({ ...prev, templates: null }));
    
    try {
      const templates = await TemplateService.getAll({
        templateType: filters.templateType,
      });
      setData(prev => ({ ...prev, templates }));
      setCache(cacheKey, templates);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch templates';
      setErrors(prev => ({ ...prev, templates: message }));
      log.error('useMarketing: Failed to fetch templates:', error);
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
    }
  }, [filters.templateType]);
  
  const fetchSegments = useCallback(async () => {
    const cached = getCached<Segment[]>('segments');
    
    if (cached) {
      setData(prev => ({ ...prev, segments: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, segments: true }));
    setErrors(prev => ({ ...prev, segments: null }));
    
    try {
      const segments = await SegmentService.getAll();
      setData(prev => ({ ...prev, segments }));
      setCache('segments', segments);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch segments';
      setErrors(prev => ({ ...prev, segments: message }));
      log.error('useMarketing: Failed to fetch segments:', error);
    } finally {
      setLoading(prev => ({ ...prev, segments: false }));
    }
  }, []);
  
  const fetchAnalytics = useCallback(async (period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month') => {
    setLoading(prev => ({ ...prev, analytics: true }));
    setErrors(prev => ({ ...prev, analytics: null }));
    
    try {
      const [analytics, stats, notifications] = await Promise.all([
        MarketingAnalyticsService.getAnalytics(period),
        MarketingAnalyticsService.getStats(),
        MarketingAnalyticsService.getNotifications(),
      ]);
      setData(prev => ({ ...prev, analytics, stats, notifications }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch analytics';
      setErrors(prev => ({ ...prev, analytics: message }));
      log.error('useMarketing: Failed to fetch analytics:', error);
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  }, []);
  
  // ==========================================================================
  // Refresh Functions
  // ==========================================================================
  
  const refresh = useCallback(async () => {
    invalidateCache();
    setLoading(prev => ({ ...prev, global: true }));
    
    await Promise.all([
      fetchCampaigns(),
      fetchFunnels(),
      fetchLeads(),
      fetchTemplates(),
      fetchSegments(),
      fetchAnalytics(),
    ]);
    
    setLoading(prev => ({ ...prev, global: false }));
  }, [fetchCampaigns, fetchFunnels, fetchLeads, fetchTemplates, fetchSegments, fetchAnalytics]);
  
  const refreshCampaigns = useCallback(async () => {
    invalidateCache('campaigns');
    await fetchCampaigns();
  }, [fetchCampaigns]);
  
  const refreshFunnels = useCallback(async () => {
    invalidateCache('funnels');
    await fetchFunnels();
  }, [fetchFunnels]);
  
  const refreshLeads = useCallback(async () => {
    invalidateCache('leads');
    await fetchLeads();
  }, [fetchLeads]);
  
  const refreshTemplates = useCallback(async () => {
    invalidateCache('templates');
    await fetchTemplates();
  }, [fetchTemplates]);
  
  const refreshSegments = useCallback(async () => {
    invalidateCache('segments');
    await fetchSegments();
  }, [fetchSegments]);
  
  const refreshAnalytics = useCallback(async (period?: 'day' | 'week' | 'month' | 'quarter' | 'year') => {
    await fetchAnalytics(period);
  }, [fetchAnalytics]);
  
  // ==========================================================================
  // Campaign Actions
  // ==========================================================================
  
  const createCampaign = useCallback(async (params: {
    name: string;
    campaignType: CampaignType;
    subject: string;
    content: string;
    templateId?: string;
  }) => {
    const campaign = await CampaignService.create(params);
    
    setData(prev => ({
      ...prev,
      campaigns: [campaign, ...prev.campaigns],
    }));
    
    invalidateCache('campaigns');
    return campaign;
  }, []);
  
  const updateCampaign = useCallback(async (params: {
    id: string;
    name?: string;
    subject?: string;
    content?: string;
    status?: CampaignStatus;
  }) => {
    const campaign = await CampaignService.update(params);
    
    setData(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c => c.id === params.id ? campaign : c),
    }));
    
    invalidateCache('campaigns');
    return campaign;
  }, []);
  
  const deleteCampaign = useCallback(async (id: string) => {
    const result = await CampaignService.delete(id);
    
    if (result) {
      setData(prev => ({
        ...prev,
        campaigns: prev.campaigns.filter(c => c.id !== id),
      }));
      invalidateCache('campaigns');
    }
    
    return result;
  }, []);
  
  const sendCampaign = useCallback(async (id: string) => {
    const campaign = await CampaignService.send(id);
    
    setData(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c => c.id === id ? campaign : c),
    }));
    
    invalidateCache('campaigns');
    return campaign;
  }, []);
  
  const scheduleCampaign = useCallback(async (id: string, scheduledAt: string) => {
    const campaign = await CampaignService.schedule({
      campaignId: id,
      scheduledAt,
    });
    
    setData(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c => c.id === id ? campaign : c),
    }));
    
    invalidateCache('campaigns');
    return campaign;
  }, []);
  
  // ==========================================================================
  // Funnel Actions
  // ==========================================================================
  
  const createFunnel = useCallback(async (params: {
    name: string;
    description?: string;
    stages: Array<{ name: string; conversionGoal: number }>;
  }) => {
    const funnel = await FunnelService.create(params);
    
    setData(prev => ({
      ...prev,
      funnels: [funnel, ...prev.funnels],
    }));
    
    invalidateCache('funnels');
    return funnel;
  }, []);
  
  const updateFunnel = useCallback(async (params: {
    id: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }) => {
    const funnel = await FunnelService.update(params);
    
    setData(prev => ({
      ...prev,
      funnels: prev.funnels.map(f => f.id === params.id ? funnel : f),
    }));
    
    invalidateCache('funnels');
    return funnel;
  }, []);
  
  const deleteFunnel = useCallback(async (id: string) => {
    const result = await FunnelService.delete(id);
    
    if (result) {
      setData(prev => ({
        ...prev,
        funnels: prev.funnels.filter(f => f.id !== id),
      }));
      invalidateCache('funnels');
    }
    
    return result;
  }, []);
  
  const addFunnelStage = useCallback(async (funnelId: string, name: string, conversionGoal: number) => {
    const funnel = await FunnelService.addStage({
      funnelId,
      name,
      conversionGoal,
    });
    
    setData(prev => ({
      ...prev,
      funnels: prev.funnels.map(f => f.id === funnelId ? funnel : f),
    }));
    
    invalidateCache('funnels');
    return funnel;
  }, []);
  
  // ==========================================================================
  // Lead Actions
  // ==========================================================================
  
  const createLead = useCallback(async (params: {
    email: string;
    name: string;
    phone?: string;
    company?: string;
    source?: LeadSource;
    tags?: string[];
  }) => {
    const lead = await LeadService.create(params);
    
    setData(prev => ({
      ...prev,
      leads: [lead, ...prev.leads],
    }));
    
    invalidateCache('leads');
    return lead;
  }, []);
  
  const updateLeadScore = useCallback(async (leadId: string, newScore: number) => {
    const lead = await LeadService.updateScore({ leadId, newScore });
    
    setData(prev => ({
      ...prev,
      leads: prev.leads.map(l => l.id === leadId ? lead : l),
    }));
    
    invalidateCache('leads');
    return lead;
  }, []);
  
  const moveLeadStage = useCallback(async (leadId: string, newStage: LeadStage) => {
    const lead = await LeadService.moveStage({ leadId, newStage });
    
    setData(prev => ({
      ...prev,
      leads: prev.leads.map(l => l.id === leadId ? lead : l),
    }));
    
    invalidateCache('leads');
    return lead;
  }, []);
  
  // ==========================================================================
  // Template Actions
  // ==========================================================================
  
  const createTemplate = useCallback(async (params: {
    name: string;
    subject: string;
    content: string;
    templateType: TemplateType;
    previewText?: string;
  }) => {
    const template = await TemplateService.create(params);
    
    setData(prev => ({
      ...prev,
      templates: [template, ...prev.templates],
    }));
    
    invalidateCache('templates');
    return template;
  }, []);
  
  const deleteTemplate = useCallback(async (id: string) => {
    const result = await TemplateService.delete(id);
    
    if (result) {
      setData(prev => ({
        ...prev,
        templates: prev.templates.filter(t => t.id !== id),
      }));
      invalidateCache('templates');
    }
    
    return result;
  }, []);
  
  // ==========================================================================
  // Segment Actions
  // ==========================================================================
  
  const createSegment = useCallback(async (params: {
    name: string;
    description?: string;
    criteria: SegmentCriteria[];
  }) => {
    const segment = await SegmentService.create(params);
    
    setData(prev => ({
      ...prev,
      segments: [segment, ...prev.segments],
    }));
    
    invalidateCache('segments');
    return segment;
  }, []);
  
  const deleteSegment = useCallback(async (id: string) => {
    const result = await SegmentService.delete(id);
    
    if (result) {
      setData(prev => ({
        ...prev,
        segments: prev.segments.filter(s => s.id !== id),
      }));
      invalidateCache('segments');
    }
    
    return result;
  }, []);
  
  // ==========================================================================
  // Computed Values
  // ==========================================================================
  
  const activeCampaigns = useMemo(() => 
    data.campaigns.filter(c => c.status === 'Running'),
    [data.campaigns]
  );
  
  const draftCampaigns = useMemo(() => 
    data.campaigns.filter(c => c.status === 'Draft'),
    [data.campaigns]
  );
  
  const scheduledCampaigns = useMemo(() => 
    data.campaigns.filter(c => c.status === 'Scheduled'),
    [data.campaigns]
  );
  
  const completedCampaigns = useMemo(() => 
    data.campaigns.filter(c => c.status === 'Completed'),
    [data.campaigns]
  );
  
  const hotLeads = useMemo(() => 
    data.leads.filter(l => l.score >= 80),
    [data.leads]
  );
  
  const coldLeads = useMemo(() => 
    data.leads.filter(l => l.score < 30),
    [data.leads]
  );
  
  const activeFunnels = useMemo(() => 
    data.funnels.filter(f => f.is_active),
    [data.funnels]
  );
  
  const unreadNotifications = useMemo(() => 
    data.notifications.filter(n => !n.read),
    [data.notifications]
  );
  
  const totalLeadScore = useMemo(() => 
    data.leads.reduce((sum, lead) => sum + lead.score, 0),
    [data.leads]
  );
  
  const averageLeadScore = useMemo(() => {
    if (data.leads.length === 0) return 0;
    const total = data.leads.reduce((sum, lead) => sum + lead.score, 0);
    return Math.round(total / data.leads.length);
  }, [data.leads]);
  
  // ==========================================================================
  // Effects
  // ==========================================================================
  
  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  // Re-fetch when filters change
  useEffect(() => {
    fetchCampaigns();
    fetchLeads();
    fetchTemplates();
  }, [fetchCampaigns, fetchLeads, fetchTemplates, filters]);
  
  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh && autoRefresh > 0) {
      refreshIntervalRef.current = setInterval(refresh, autoRefresh);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refresh]);
  
  // Real-time updates
  useEffect(() => {
    if (!realtime) return;
    
    const setupListeners = async () => {
      try {
        const unlistenCampaign = await listen<Campaign>('marketing:campaign:updated', (event) => {
          setData(prev => ({
            ...prev,
            campaigns: prev.campaigns.map(c => c.id === event.payload.id ? event.payload : c),
          }));
        });
        
        const unlistenLead = await listen<Lead>('marketing:lead:updated', (event) => {
          setData(prev => ({
            ...prev,
            leads: prev.leads.map(l => l.id === event.payload.id ? event.payload : l),
          }));
        });
        
        const unlistenNewLead = await listen<Lead>('marketing:lead:created', (event) => {
          setData(prev => ({
            ...prev,
            leads: [event.payload, ...prev.leads],
          }));
        });
        
        const unlistenNotification = await listen<MarketingNotification>('marketing:notification', (event) => {
          setData(prev => ({
            ...prev,
            notifications: [event.payload, ...prev.notifications],
          }));
        });
        
        const unlistenRefresh = await listen('marketing:refresh', () => {
          refresh();
        });
        
        unlistenRefs.current = [
          unlistenCampaign, 
          unlistenLead, 
          unlistenNewLead, 
          unlistenNotification, 
          unlistenRefresh
        ];
      } catch (error) {
        log.warn('useMarketing: Failed to setup Tauri event listeners:', error);
      }
    };
    
    setupListeners();
    
    return () => {
      unlistenRefs.current.forEach(unlisten => unlisten());
      unlistenRefs.current = [];
    };
  }, [realtime, refresh]);
  
  // ==========================================================================
  // Return
  // ==========================================================================
  
  return {
    // State
    data,
    loading,
    errors,
    filters,
    
    // Filter Actions
    setFilters,
    clearFilters,
    
    // Campaign Actions
    createCampaign,
    updateCampaign,
    deleteCampaign,
    sendCampaign,
    scheduleCampaign,
    
    // Funnel Actions
    createFunnel,
    updateFunnel,
    deleteFunnel,
    addFunnelStage,
    
    // Lead Actions
    createLead,
    updateLeadScore,
    moveLeadStage,
    
    // Template Actions
    createTemplate,
    deleteTemplate,
    
    // Segment Actions
    createSegment,
    deleteSegment,
    
    // Analytics
    refreshAnalytics,
    
    // Refresh
    refresh,
    refreshCampaigns,
    refreshFunnels,
    refreshLeads,
    refreshTemplates,
    refreshSegments,
    
    // Computed
    activeCampaigns,
    draftCampaigns,
    scheduledCampaigns,
    completedCampaigns,
    hotLeads,
    coldLeads,
    activeFunnels,
    unreadNotifications,
    totalLeadScore,
    averageLeadScore,
  };
}

export default useMarketing;
