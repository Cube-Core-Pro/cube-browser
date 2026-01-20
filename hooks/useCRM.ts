/**
 * CUBE Elite v7 - useCRM Hook
 * 
 * Centralized React hook for CRM functionality.
 * Provides state management, caching, optimistic updates, and real-time sync.
 * 
 * Features:
 * - Automatic data fetching with SWR-like caching
 * - Optimistic updates for better UX
 * - Real-time updates via Tauri events
 * - Error handling and loading states
 * - Filter and search support
 * 
 * @module hooks/useCRM
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { logger } from '@/lib/services/logger-service';
import {
  ContactService,
  CompanyService,
  DealService,
  ActivityService,
  PipelineService,
  CRMAnalyticsService,
  Contact,
  Company,
  Deal,
  Activity,
  Pipeline,
  CRMStats,
  CRMInsights,
  ContactStatus,
  CompanySize,
  DealStage,
  ActivityType,
  ActivityStatus,
} from '@/lib/services/crm-service';

const log = logger.scope('useCRM');

// =============================================================================
// Types
// =============================================================================

export interface UseCRMOptions {
  /** Enable auto-refresh at interval (ms) */
  autoRefresh?: number;
  /** Initial filters */
  initialFilters?: CRMFilters;
  /** Enable real-time updates via Tauri events */
  realtime?: boolean;
}

export interface CRMFilters {
  contacts?: {
    status?: ContactStatus;
    tags?: string[];
    search?: string;
  };
  companies?: {
    industry?: string;
    size?: CompanySize;
    search?: string;
  };
  deals?: {
    stage?: DealStage;
    minValue?: number;
    maxValue?: number;
    search?: string;
  };
  activities?: {
    type?: ActivityType;
    status?: ActivityStatus;
    contactId?: string;
    dealId?: string;
  };
}

export interface CRMState {
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  activities: Activity[];
  pipelines: Pipeline[];
  stats: CRMStats | null;
  insights: CRMInsights | null;
}

export interface CRMLoadingState {
  contacts: boolean;
  companies: boolean;
  deals: boolean;
  activities: boolean;
  pipelines: boolean;
  stats: boolean;
  insights: boolean;
  global: boolean;
}

export interface CRMErrorState {
  contacts: string | null;
  companies: string | null;
  deals: string | null;
  activities: string | null;
  pipelines: string | null;
  stats: string | null;
  insights: string | null;
}

export interface UseCRMReturn {
  // State
  data: CRMState;
  loading: CRMLoadingState;
  errors: CRMErrorState;
  filters: CRMFilters;
  
  // Actions - Contacts
  createContact: (params: Parameters<typeof ContactService.create>[0]) => Promise<Contact>;
  updateContact: (params: Parameters<typeof ContactService.update>[0]) => Promise<Contact>;
  deleteContact: (id: string) => Promise<boolean>;
  toggleContactFavorite: (id: string) => Promise<boolean>;
  logContactInteraction: (params: Parameters<typeof ContactService.logInteraction>[0]) => Promise<Contact>;
  
  // Actions - Companies
  createCompany: (params: Parameters<typeof CompanyService.create>[0]) => Promise<Company>;
  deleteCompany: (id: string) => Promise<boolean>;
  
  // Actions - Deals
  createDeal: (params: Parameters<typeof DealService.create>[0]) => Promise<Deal>;
  updateDealStage: (id: string, stage: DealStage) => Promise<Deal>;
  deleteDeal: (id: string) => Promise<boolean>;
  
  // Actions - Activities
  createActivity: (params: Parameters<typeof ActivityService.create>[0]) => Promise<Activity>;
  completeActivity: (id: string) => Promise<Activity>;
  deleteActivity: (id: string) => Promise<boolean>;
  
  // Refresh
  refresh: () => Promise<void>;
  refreshContacts: () => Promise<void>;
  refreshCompanies: () => Promise<void>;
  refreshDeals: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // Filters
  setFilters: (filters: Partial<CRMFilters>) => void;
  clearFilters: () => void;
  
  // Search
  search: (query: string) => void;
  
  // Computed
  totalContacts: number;
  totalDeals: number;
  pipelineValue: number;
  activeDeals: Deal[];
  overdueActivities: Activity[];
  recentContacts: Contact[];
}

// =============================================================================
// Cache
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 60000; // 1 minute
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

export function useCRM(options: UseCRMOptions = {}): UseCRMReturn {
  const { autoRefresh, initialFilters, realtime = true } = options;
  
  // State
  const [data, setData] = useState<CRMState>({
    contacts: [],
    companies: [],
    deals: [],
    activities: [],
    pipelines: [],
    stats: null,
    insights: null,
  });
  
  const [loading, setLoading] = useState<CRMLoadingState>({
    contacts: false,
    companies: false,
    deals: false,
    activities: false,
    pipelines: false,
    stats: false,
    insights: false,
    global: true,
  });
  
  const [errors, setErrors] = useState<CRMErrorState>({
    contacts: null,
    companies: null,
    deals: null,
    activities: null,
    pipelines: null,
    stats: null,
    insights: null,
  });
  
  const [filters, setFiltersState] = useState<CRMFilters>(initialFilters || {});
  
  // Refs
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==========================================================================
  // Data Fetching
  // ==========================================================================
  
  const fetchContacts = useCallback(async () => {
    const cacheKey = `contacts:${JSON.stringify(filters.contacts)}`;
    const cached = getCached<Contact[]>(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, contacts: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, contacts: true }));
    setErrors(prev => ({ ...prev, contacts: null }));
    
    try {
      const contacts = await ContactService.getAll(filters.contacts);
      setData(prev => ({ ...prev, contacts }));
      setCache(cacheKey, contacts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch contacts';
      setErrors(prev => ({ ...prev, contacts: message }));
      log.error('useCRM: Failed to fetch contacts:', error);
    } finally {
      setLoading(prev => ({ ...prev, contacts: false }));
    }
  }, [filters.contacts]);
  
  const fetchCompanies = useCallback(async () => {
    const cacheKey = `companies:${JSON.stringify(filters.companies)}`;
    const cached = getCached<Company[]>(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, companies: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, companies: true }));
    setErrors(prev => ({ ...prev, companies: null }));
    
    try {
      const companies = await CompanyService.getAll(filters.companies);
      setData(prev => ({ ...prev, companies }));
      setCache(cacheKey, companies);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch companies';
      setErrors(prev => ({ ...prev, companies: message }));
      log.error('useCRM: Failed to fetch companies:', error);
    } finally {
      setLoading(prev => ({ ...prev, companies: false }));
    }
  }, [filters.companies]);
  
  const fetchDeals = useCallback(async () => {
    const cacheKey = `deals:${JSON.stringify(filters.deals)}`;
    const cached = getCached<Deal[]>(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, deals: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, deals: true }));
    setErrors(prev => ({ ...prev, deals: null }));
    
    try {
      const deals = await DealService.getAll(filters.deals);
      setData(prev => ({ ...prev, deals }));
      setCache(cacheKey, deals);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch deals';
      setErrors(prev => ({ ...prev, deals: message }));
      log.error('useCRM: Failed to fetch deals:', error);
    } finally {
      setLoading(prev => ({ ...prev, deals: false }));
    }
  }, [filters.deals]);
  
  const fetchActivities = useCallback(async () => {
    const cacheKey = `activities:${JSON.stringify(filters.activities)}`;
    const cached = getCached<Activity[]>(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, activities: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, activities: true }));
    setErrors(prev => ({ ...prev, activities: null }));
    
    try {
      const activities = await ActivityService.getAll(filters.activities);
      setData(prev => ({ ...prev, activities }));
      setCache(cacheKey, activities);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch activities';
      setErrors(prev => ({ ...prev, activities: message }));
      log.error('useCRM: Failed to fetch activities:', error);
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  }, [filters.activities]);
  
  const fetchPipelines = useCallback(async () => {
    const cached = getCached<Pipeline[]>('pipelines');
    
    if (cached) {
      setData(prev => ({ ...prev, pipelines: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, pipelines: true }));
    setErrors(prev => ({ ...prev, pipelines: null }));
    
    try {
      const pipelines = await PipelineService.getAll();
      setData(prev => ({ ...prev, pipelines }));
      setCache('pipelines', pipelines);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch pipelines';
      setErrors(prev => ({ ...prev, pipelines: message }));
      log.error('useCRM: Failed to fetch pipelines:', error);
    } finally {
      setLoading(prev => ({ ...prev, pipelines: false }));
    }
  }, []);
  
  const fetchStats = useCallback(async () => {
    const cached = getCached<CRMStats>('stats');
    
    if (cached) {
      setData(prev => ({ ...prev, stats: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, stats: true }));
    setErrors(prev => ({ ...prev, stats: null }));
    
    try {
      const stats = await CRMAnalyticsService.getStats();
      setData(prev => ({ ...prev, stats }));
      setCache('stats', stats);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch stats';
      setErrors(prev => ({ ...prev, stats: message }));
      log.error('useCRM: Failed to fetch stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);
  
  const fetchInsights = useCallback(async () => {
    const cached = getCached<CRMInsights>('insights');
    
    if (cached) {
      setData(prev => ({ ...prev, insights: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, insights: true }));
    setErrors(prev => ({ ...prev, insights: null }));
    
    try {
      const insights = await CRMAnalyticsService.getInsights();
      setData(prev => ({ ...prev, insights }));
      setCache('insights', insights);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch insights';
      setErrors(prev => ({ ...prev, insights: message }));
      log.error('useCRM: Failed to fetch insights:', error);
    } finally {
      setLoading(prev => ({ ...prev, insights: false }));
    }
  }, []);
  
  // ==========================================================================
  // Refresh Functions
  // ==========================================================================
  
  const refresh = useCallback(async () => {
    invalidateCache();
    setLoading(prev => ({ ...prev, global: true }));
    
    await Promise.all([
      fetchContacts(),
      fetchCompanies(),
      fetchDeals(),
      fetchActivities(),
      fetchPipelines(),
      fetchStats(),
      fetchInsights(),
    ]);
    
    setLoading(prev => ({ ...prev, global: false }));
  }, [fetchContacts, fetchCompanies, fetchDeals, fetchActivities, fetchPipelines, fetchStats, fetchInsights]);
  
  const refreshContacts = useCallback(async () => {
    invalidateCache('contacts');
    await fetchContacts();
  }, [fetchContacts]);
  
  const refreshCompanies = useCallback(async () => {
    invalidateCache('companies');
    await fetchCompanies();
  }, [fetchCompanies]);
  
  const refreshDeals = useCallback(async () => {
    invalidateCache('deals');
    await fetchDeals();
  }, [fetchDeals]);
  
  const refreshActivities = useCallback(async () => {
    invalidateCache('activities');
    await fetchActivities();
  }, [fetchActivities]);
  
  const refreshStats = useCallback(async () => {
    invalidateCache('stats');
    await fetchStats();
  }, [fetchStats]);
  
  // ==========================================================================
  // Contact Actions
  // ==========================================================================
  
  const createContact = useCallback(async (params: Parameters<typeof ContactService.create>[0]) => {
    const contact = await ContactService.create(params);
    
    // Optimistic update
    setData(prev => ({
      ...prev,
      contacts: [contact, ...prev.contacts],
    }));
    
    invalidateCache('contacts');
    invalidateCache('stats');
    
    return contact;
  }, []);
  
  const updateContact = useCallback(async (params: Parameters<typeof ContactService.update>[0]) => {
    const contact = await ContactService.update(params);
    
    // Optimistic update
    setData(prev => ({
      ...prev,
      contacts: prev.contacts.map(c => c.id === contact.id ? contact : c),
    }));
    
    invalidateCache('contacts');
    
    return contact;
  }, []);
  
  const deleteContact = useCallback(async (id: string) => {
    const result = await ContactService.delete(id);
    
    if (result) {
      // Optimistic update
      setData(prev => ({
        ...prev,
        contacts: prev.contacts.filter(c => c.id !== id),
      }));
      
      invalidateCache('contacts');
      invalidateCache('stats');
    }
    
    return result;
  }, []);
  
  const toggleContactFavorite = useCallback(async (id: string) => {
    const result = await ContactService.toggleFavorite(id);
    
    // Optimistic update
    setData(prev => ({
      ...prev,
      contacts: prev.contacts.map(c => 
        c.id === id ? { ...c, is_favorite: !c.is_favorite } : c
      ),
    }));
    
    invalidateCache('contacts');
    
    return result;
  }, []);
  
  const logContactInteraction = useCallback(async (params: Parameters<typeof ContactService.logInteraction>[0]) => {
    const contact = await ContactService.logInteraction(params);
    
    // Optimistic update
    setData(prev => ({
      ...prev,
      contacts: prev.contacts.map(c => c.id === contact.id ? contact : c),
    }));
    
    invalidateCache('contacts');
    
    return contact;
  }, []);
  
  // ==========================================================================
  // Company Actions
  // ==========================================================================
  
  const createCompany = useCallback(async (params: Parameters<typeof CompanyService.create>[0]) => {
    const company = await CompanyService.create(params);
    
    setData(prev => ({
      ...prev,
      companies: [company, ...prev.companies],
    }));
    
    invalidateCache('companies');
    invalidateCache('stats');
    
    return company;
  }, []);
  
  const deleteCompany = useCallback(async (id: string) => {
    const result = await CompanyService.delete(id);
    
    if (result) {
      setData(prev => ({
        ...prev,
        companies: prev.companies.filter(c => c.id !== id),
      }));
      
      invalidateCache('companies');
      invalidateCache('stats');
    }
    
    return result;
  }, []);
  
  // ==========================================================================
  // Deal Actions
  // ==========================================================================
  
  const createDeal = useCallback(async (params: Parameters<typeof DealService.create>[0]) => {
    const deal = await DealService.create(params);
    
    setData(prev => ({
      ...prev,
      deals: [deal, ...prev.deals],
    }));
    
    invalidateCache('deals');
    invalidateCache('stats');
    
    return deal;
  }, []);
  
  const updateDealStage = useCallback(async (id: string, stage: DealStage, probability?: number) => {
    const deal = await DealService.updateStage({ dealId: id, newStage: stage, probability });
    
    setData(prev => ({
      ...prev,
      deals: prev.deals.map(d => d.id === deal.id ? deal : d),
    }));
    
    invalidateCache('deals');
    invalidateCache('stats');
    
    return deal;
  }, []);
  
  const deleteDeal = useCallback(async (id: string) => {
    const result = await DealService.delete(id);
    
    if (result) {
      setData(prev => ({
        ...prev,
        deals: prev.deals.filter(d => d.id !== id),
      }));
      
      invalidateCache('deals');
      invalidateCache('stats');
    }
    
    return result;
  }, []);
  
  // ==========================================================================
  // Activity Actions
  // ==========================================================================
  
  const createActivity = useCallback(async (params: Parameters<typeof ActivityService.create>[0]) => {
    const activity = await ActivityService.create(params);
    
    setData(prev => ({
      ...prev,
      activities: [activity, ...prev.activities],
    }));
    
    invalidateCache('activities');
    
    return activity;
  }, []);
  
  const completeActivity = useCallback(async (id: string) => {
    const activity = await ActivityService.complete(id);
    
    setData(prev => ({
      ...prev,
      activities: prev.activities.map(a => a.id === activity.id ? activity : a),
    }));
    
    invalidateCache('activities');
    
    return activity;
  }, []);
  
  const deleteActivity = useCallback(async (id: string) => {
    const result = await ActivityService.delete(id);
    
    if (result) {
      setData(prev => ({
        ...prev,
        activities: prev.activities.filter(a => a.id !== id),
      }));
      
      invalidateCache('activities');
    }
    
    return result;
  }, []);
  
  // ==========================================================================
  // Filter Functions
  // ==========================================================================
  
  const setFilters = useCallback((newFilters: Partial<CRMFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);
  
  // ==========================================================================
  // Search
  // ==========================================================================
  
  const search = useCallback((query: string) => {
    if (!query.trim()) {
      clearFilters();
      return;
    }
    
    setFilters({
      contacts: { search: query },
      companies: { search: query },
      deals: { search: query },
    });
  }, [setFilters, clearFilters]);
  
  // ==========================================================================
  // Computed Values
  // ==========================================================================
  
  const totalContacts = useMemo(() => data.contacts.length, [data.contacts]);
  
  const totalDeals = useMemo(() => data.deals.length, [data.deals]);
  
  const pipelineValue = useMemo(() => 
    data.deals.reduce((sum, deal) => sum + deal.value, 0),
    [data.deals]
  );
  
  const activeDeals = useMemo(() => 
    data.deals.filter(d => !['ClosedWon', 'ClosedLost'].includes(d.stage)),
    [data.deals]
  );
  
  const overdueActivities = useMemo(() => {
    const now = new Date();
    return data.activities.filter(a => {
      if (a.status !== 'Pending' || !a.scheduled_at) return false;
      return new Date(a.scheduled_at) < now;
    });
  }, [data.activities]);
  
  const recentContacts = useMemo(() => 
    [...data.contacts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10),
    [data.contacts]
  );
  
  // ==========================================================================
  // Effects
  // ==========================================================================
  
  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  // Re-fetch when filters change
  useEffect(() => {
    fetchContacts();
  }, [filters.contacts, fetchContacts]);
  
  useEffect(() => {
    fetchCompanies();
  }, [filters.companies, fetchCompanies]);
  
  useEffect(() => {
    fetchDeals();
  }, [filters.deals, fetchDeals]);
  
  useEffect(() => {
    fetchActivities();
  }, [filters.activities, fetchActivities]);
  
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
  
  // Real-time updates via Tauri events
  useEffect(() => {
    if (!realtime) return;
    
    const setupListeners = async () => {
      try {
        const unlistenContact = await listen<Contact>('crm:contact:updated', (event) => {
          setData(prev => ({
            ...prev,
            contacts: prev.contacts.map(c => c.id === event.payload.id ? event.payload : c),
          }));
          invalidateCache('contacts');
        });
        
        const unlistenDeal = await listen<Deal>('crm:deal:updated', (event) => {
          setData(prev => ({
            ...prev,
            deals: prev.deals.map(d => d.id === event.payload.id ? event.payload : d),
          }));
          invalidateCache('deals');
        });
        
        const unlistenActivity = await listen<Activity>('crm:activity:updated', (event) => {
          setData(prev => ({
            ...prev,
            activities: prev.activities.map(a => a.id === event.payload.id ? event.payload : a),
          }));
          invalidateCache('activities');
        });
        
        const unlistenRefresh = await listen('crm:refresh', () => {
          refresh();
        });
        
        unlistenRefs.current = [unlistenContact, unlistenDeal, unlistenActivity, unlistenRefresh];
      } catch (error) {
        log.warn('useCRM: Failed to setup Tauri event listeners:', error);
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
    
    // Contact Actions
    createContact,
    updateContact,
    deleteContact,
    toggleContactFavorite,
    logContactInteraction,
    
    // Company Actions
    createCompany,
    deleteCompany,
    
    // Deal Actions
    createDeal,
    updateDealStage,
    deleteDeal,
    
    // Activity Actions
    createActivity,
    completeActivity,
    deleteActivity,
    
    // Refresh
    refresh,
    refreshContacts,
    refreshCompanies,
    refreshDeals,
    refreshActivities,
    refreshStats,
    
    // Filters
    setFilters,
    clearFilters,
    
    // Search
    search,
    
    // Computed
    totalContacts,
    totalDeals,
    pipelineValue,
    activeDeals,
    overdueActivities,
    recentContacts,
  };
}

export default useCRM;
