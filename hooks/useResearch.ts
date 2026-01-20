/**
 * CUBE Elite v7 - useResearch Hook
 * 
 * Centralized React hook for Research/Intelligence functionality.
 * Provides state management for projects, competitors, sources, reports, and trends.
 * 
 * Features:
 * - Research project management
 * - Competitor analysis
 * - Source management
 * - Report generation
 * - Market trends tracking
 * - Search across sources
 * - Real-time notifications
 * 
 * @module hooks/useResearch
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { logger } from '@/lib/services/logger-service';
import {
  ProjectService,
  SourceService,
  CompetitorService,
  ReportService,
  TrendsService,
  ResearchAnalyticsService,
  ResearchProject,
  ProjectType,
  ProjectStatus,
  SourceType,
  Competitor,
  ResearchReport,
  ReportType,
  MarketTrend,
  SearchResult,
  ResearchStats,
  ResearchQuickStats,
  ResearchNotification,
} from '@/lib/services/research-service';

const log = logger.scope('useResearch');

// =============================================================================
// Types
// =============================================================================

export interface UseResearchOptions {
  /** Auto-refresh interval in milliseconds */
  autoRefresh?: number;
  /** Enable real-time updates */
  realtime?: boolean;
  /** Default project ID to load */
  defaultProjectId?: string;
}

export interface ResearchState {
  projects: ResearchProject[];
  currentProject: ResearchProject | null;
  competitors: Competitor[];
  reports: ResearchReport[];
  trends: MarketTrend[];
  searchResults: SearchResult[];
  stats: ResearchStats | null;
  quickStats: ResearchQuickStats | null;
  notifications: ResearchNotification[];
}

export interface ResearchLoadingState {
  projects: boolean;
  competitors: boolean;
  reports: boolean;
  trends: boolean;
  searching: boolean;
  analyzing: boolean;
  global: boolean;
}

export interface ResearchErrorState {
  projects: string | null;
  competitors: string | null;
  reports: string | null;
  search: string | null;
}

export interface ResearchFilters {
  projectStatus?: ProjectStatus;
  projectType?: ProjectType;
  reportType?: ReportType;
  trendCategory?: string;
}

export interface UseResearchReturn {
  // State
  data: ResearchState;
  loading: ResearchLoadingState;
  errors: ResearchErrorState;
  filters: ResearchFilters;
  
  // Filter Actions
  setFilters: (filters: Partial<ResearchFilters>) => void;
  clearFilters: () => void;
  
  // Project Actions
  createProject: (params: {
    name: string;
    description?: string;
    projectType: ProjectType;
  }) => Promise<ResearchProject>;
  updateProject: (params: {
    id: string;
    name?: string;
    description?: string;
    status?: ProjectStatus;
  }) => Promise<ResearchProject>;
  deleteProject: (id: string) => Promise<boolean>;
  loadProject: (id: string) => Promise<ResearchProject | null>;
  runProject: (projectId: string) => Promise<ResearchProject>;
  
  // Source Actions
  addSource: (params: {
    projectId: string;
    sourceType: SourceType;
    name: string;
    url?: string;
  }) => Promise<ResearchProject>;
  removeSource: (projectId: string, sourceId: string) => Promise<ResearchProject>;
  
  // Competitor Actions
  addCompetitor: (params: {
    projectId: string;
    name: string;
    website?: string;
    industry?: string;
  }) => Promise<Competitor>;
  analyzeCompetitor: (competitorId: string) => Promise<Competitor>;
  removeCompetitor: (projectId: string, competitorId: string) => Promise<boolean>;
  
  // Report Actions
  generateReport: (params: {
    projectId: string;
    reportType: ReportType;
    title?: string;
  }) => Promise<ResearchReport>;
  
  // Search & Trends
  search: (query: string, sources?: string[], limit?: number) => Promise<SearchResult[]>;
  refreshTrends: (category?: string, limit?: number) => Promise<void>;
  
  // Refresh
  refresh: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshCompetitors: () => Promise<void>;
  refreshReports: () => Promise<void>;
  
  // Computed
  activeProjects: ResearchProject[];
  completedProjects: ResearchProject[];
  draftReports: ResearchReport[];
  finalReports: ResearchReport[];
  unreadNotifications: ResearchNotification[];
  totalCompetitors: number;
  avgConfidence: number;
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

export function useResearch(options: UseResearchOptions = {}): UseResearchReturn {
  const { autoRefresh, realtime = true, defaultProjectId } = options;
  
  // State
  const [data, setData] = useState<ResearchState>({
    projects: [],
    currentProject: null,
    competitors: [],
    reports: [],
    trends: [],
    searchResults: [],
    stats: null,
    quickStats: null,
    notifications: [],
  });
  
  const [loading, setLoading] = useState<ResearchLoadingState>({
    projects: false,
    competitors: false,
    reports: false,
    trends: false,
    searching: false,
    analyzing: false,
    global: true,
  });
  
  const [errors, setErrors] = useState<ResearchErrorState>({
    projects: null,
    competitors: null,
    reports: null,
    search: null,
  });
  
  const [filters, setFiltersState] = useState<ResearchFilters>({});
  
  // Refs
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==========================================================================
  // Filter Actions
  // ==========================================================================
  
  const setFilters = useCallback((newFilters: Partial<ResearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);
  
  // ==========================================================================
  // Data Fetching
  // ==========================================================================
  
  const fetchProjects = useCallback(async () => {
    const cacheKey = `projects:${filters.projectStatus || 'all'}:${filters.projectType || 'all'}`;
    const cached = getCached<ResearchProject[]>(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, projects: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, projects: true }));
    setErrors(prev => ({ ...prev, projects: null }));
    
    try {
      const projects = await ProjectService.getAll({
        status: filters.projectStatus,
        projectType: filters.projectType,
      });
      setData(prev => ({ ...prev, projects }));
      setCache(cacheKey, projects);
      
      // Load default project if specified
      if (defaultProjectId && !data.currentProject) {
        const defaultProject = projects.find(p => p.id === defaultProjectId);
        if (defaultProject) {
          setData(prev => ({ ...prev, currentProject: defaultProject }));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch projects';
      setErrors(prev => ({ ...prev, projects: message }));
      log.error('useResearch: Failed to fetch projects:', error);
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  }, [filters.projectStatus, filters.projectType, defaultProjectId, data.currentProject]);
  
  const fetchCompetitors = useCallback(async () => {
    if (!data.currentProject) return;
    
    setLoading(prev => ({ ...prev, competitors: true }));
    setErrors(prev => ({ ...prev, competitors: null }));
    
    try {
      const competitors = await CompetitorService.getAll(data.currentProject.id);
      setData(prev => ({ ...prev, competitors }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch competitors';
      setErrors(prev => ({ ...prev, competitors: message }));
      log.error('useResearch: Failed to fetch competitors:', error);
    } finally {
      setLoading(prev => ({ ...prev, competitors: false }));
    }
  }, [data.currentProject]);
  
  const fetchReports = useCallback(async () => {
    const cacheKey = `reports:${filters.reportType || 'all'}`;
    const cached = getCached<ResearchReport[]>(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, reports: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, reports: true }));
    setErrors(prev => ({ ...prev, reports: null }));
    
    try {
      const reports = await ReportService.getAll({
        projectId: data.currentProject?.id,
        reportType: filters.reportType,
      });
      setData(prev => ({ ...prev, reports }));
      setCache(cacheKey, reports);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch reports';
      setErrors(prev => ({ ...prev, reports: message }));
      log.error('useResearch: Failed to fetch reports:', error);
    } finally {
      setLoading(prev => ({ ...prev, reports: false }));
    }
  }, [filters.reportType, data.currentProject]);
  
  const fetchTrends = useCallback(async (category?: string, limit?: number) => {
    setLoading(prev => ({ ...prev, trends: true }));
    
    try {
      const trends = await TrendsService.get({
        category: category || filters.trendCategory,
        limit,
      });
      setData(prev => ({ ...prev, trends }));
    } catch (error) {
      log.error('useResearch: Failed to fetch trends:', error);
    } finally {
      setLoading(prev => ({ ...prev, trends: false }));
    }
  }, [filters.trendCategory]);
  
  const fetchStats = useCallback(async () => {
    try {
      const [stats, quickStats, notifications] = await Promise.all([
        ResearchAnalyticsService.getStats(),
        ResearchAnalyticsService.getQuickStats(),
        ResearchAnalyticsService.getNotifications(),
      ]);
      setData(prev => ({ ...prev, stats, quickStats, notifications }));
    } catch (error) {
      log.error('useResearch: Failed to fetch stats:', error);
    }
  }, []);
  
  // ==========================================================================
  // Refresh Functions
  // ==========================================================================
  
  const refresh = useCallback(async () => {
    invalidateCache();
    setLoading(prev => ({ ...prev, global: true }));
    
    await Promise.all([
      fetchProjects(),
      fetchReports(),
      fetchTrends(),
      fetchStats(),
    ]);
    
    setLoading(prev => ({ ...prev, global: false }));
  }, [fetchProjects, fetchReports, fetchTrends, fetchStats]);
  
  const refreshProjects = useCallback(async () => {
    invalidateCache('projects');
    await fetchProjects();
  }, [fetchProjects]);
  
  const refreshCompetitors = useCallback(async () => {
    await fetchCompetitors();
  }, [fetchCompetitors]);
  
  const refreshReports = useCallback(async () => {
    invalidateCache('reports');
    await fetchReports();
  }, [fetchReports]);
  
  const refreshTrends = useCallback(async (category?: string, limit?: number) => {
    await fetchTrends(category, limit);
  }, [fetchTrends]);
  
  // ==========================================================================
  // Project Actions
  // ==========================================================================
  
  const createProject = useCallback(async (params: {
    name: string;
    description?: string;
    projectType: ProjectType;
  }) => {
    const project = await ProjectService.create(params);
    
    setData(prev => ({
      ...prev,
      projects: [project, ...prev.projects],
      currentProject: project,
    }));
    
    invalidateCache('projects');
    return project;
  }, []);
  
  const updateProject = useCallback(async (params: {
    id: string;
    name?: string;
    description?: string;
    status?: ProjectStatus;
  }) => {
    const project = await ProjectService.update(params);
    
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === params.id ? project : p),
      currentProject: prev.currentProject?.id === params.id ? project : prev.currentProject,
    }));
    
    invalidateCache('projects');
    return project;
  }, []);
  
  const deleteProject = useCallback(async (id: string) => {
    const result = await ProjectService.delete(id);
    
    if (result) {
      setData(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== id),
        currentProject: prev.currentProject?.id === id ? null : prev.currentProject,
      }));
      invalidateCache('projects');
    }
    
    return result;
  }, []);
  
  const loadProject = useCallback(async (id: string) => {
    const project = await ProjectService.getById(id);
    
    if (project) {
      setData(prev => ({ ...prev, currentProject: project }));
    }
    
    return project;
  }, []);
  
  const runProject = useCallback(async (projectId: string) => {
    setLoading(prev => ({ ...prev, analyzing: true }));
    
    try {
      const project = await ProjectService.run(projectId);
      
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === projectId ? project : p),
        currentProject: prev.currentProject?.id === projectId ? project : prev.currentProject,
      }));
      
      invalidateCache('projects');
      return project;
    } finally {
      setLoading(prev => ({ ...prev, analyzing: false }));
    }
  }, []);
  
  // ==========================================================================
  // Source Actions
  // ==========================================================================
  
  const addSource = useCallback(async (params: {
    projectId: string;
    sourceType: SourceType;
    name: string;
    url?: string;
  }) => {
    const project = await SourceService.add(params);
    
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === params.projectId ? project : p),
      currentProject: prev.currentProject?.id === params.projectId ? project : prev.currentProject,
    }));
    
    invalidateCache('projects');
    return project;
  }, []);
  
  const removeSource = useCallback(async (projectId: string, sourceId: string) => {
    const project = await SourceService.remove({ projectId, sourceId });
    
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? project : p),
      currentProject: prev.currentProject?.id === projectId ? project : prev.currentProject,
    }));
    
    invalidateCache('projects');
    return project;
  }, []);
  
  // ==========================================================================
  // Competitor Actions
  // ==========================================================================
  
  const addCompetitor = useCallback(async (params: {
    projectId: string;
    name: string;
    website?: string;
    industry?: string;
  }) => {
    const competitor = await CompetitorService.add(params);
    
    setData(prev => ({
      ...prev,
      competitors: [...prev.competitors, competitor],
    }));
    
    return competitor;
  }, []);
  
  const analyzeCompetitor = useCallback(async (competitorId: string) => {
    setLoading(prev => ({ ...prev, analyzing: true }));
    
    try {
      const competitor = await CompetitorService.analyze(competitorId);
      
      setData(prev => ({
        ...prev,
        competitors: prev.competitors.map(c => c.id === competitorId ? competitor : c),
      }));
      
      return competitor;
    } finally {
      setLoading(prev => ({ ...prev, analyzing: false }));
    }
  }, []);
  
  const removeCompetitor = useCallback(async (projectId: string, competitorId: string) => {
    const result = await CompetitorService.remove({ projectId, competitorId });
    
    if (result) {
      setData(prev => ({
        ...prev,
        competitors: prev.competitors.filter(c => c.id !== competitorId),
      }));
    }
    
    return result;
  }, []);
  
  // ==========================================================================
  // Report Actions
  // ==========================================================================
  
  const generateReport = useCallback(async (params: {
    projectId: string;
    reportType: ReportType;
    title?: string;
  }) => {
    setLoading(prev => ({ ...prev, analyzing: true }));
    
    try {
      const report = await ReportService.generate(params);
      
      setData(prev => ({
        ...prev,
        reports: [report, ...prev.reports],
      }));
      
      invalidateCache('reports');
      return report;
    } finally {
      setLoading(prev => ({ ...prev, analyzing: false }));
    }
  }, []);
  
  // ==========================================================================
  // Search
  // ==========================================================================
  
  const searchAction = useCallback(async (query: string, sources?: string[], limit?: number) => {
    setLoading(prev => ({ ...prev, searching: true }));
    setErrors(prev => ({ ...prev, search: null }));
    
    try {
      const results = await TrendsService.search({ query, sources, limit });
      setData(prev => ({ ...prev, searchResults: results }));
      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed';
      setErrors(prev => ({ ...prev, search: message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, searching: false }));
    }
  }, []);
  
  // ==========================================================================
  // Computed Values
  // ==========================================================================
  
  const activeProjects = useMemo(() => 
    data.projects.filter(p => p.status === 'InProgress' || p.status === 'Analyzing'),
    [data.projects]
  );
  
  const completedProjects = useMemo(() => 
    data.projects.filter(p => p.status === 'Completed'),
    [data.projects]
  );
  
  const draftReports = useMemo(() => 
    data.reports.filter(r => r.status === 'Draft'),
    [data.reports]
  );
  
  const finalReports = useMemo(() => 
    data.reports.filter(r => r.status === 'Final'),
    [data.reports]
  );
  
  const unreadNotifications = useMemo(() => 
    data.notifications.filter(n => !n.read),
    [data.notifications]
  );
  
  const totalCompetitors = useMemo(() => 
    data.competitors.length,
    [data.competitors]
  );
  
  const avgConfidence = useMemo(() => 
    data.stats?.avg_confidence || 0,
    [data.stats]
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
    fetchProjects();
    fetchReports();
  }, [fetchProjects, fetchReports, filters]);
  
  // Fetch competitors when current project changes
  useEffect(() => {
    if (data.currentProject) {
      fetchCompetitors();
    }
  }, [data.currentProject, fetchCompetitors]);
  
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
        const unlistenProject = await listen<ResearchProject>('research:project:updated', (event) => {
          setData(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === event.payload.id ? event.payload : p),
            currentProject: prev.currentProject?.id === event.payload.id ? event.payload : prev.currentProject,
          }));
        });
        
        const unlistenCompetitor = await listen<Competitor>('research:competitor:analyzed', (event) => {
          setData(prev => ({
            ...prev,
            competitors: prev.competitors.map(c => c.id === event.payload.id ? event.payload : c),
          }));
        });
        
        const unlistenNotification = await listen<ResearchNotification>('research:notification', (event) => {
          setData(prev => ({
            ...prev,
            notifications: [event.payload, ...prev.notifications],
          }));
        });
        
        const unlistenRefresh = await listen('research:refresh', () => {
          refresh();
        });
        
        unlistenRefs.current = [unlistenProject, unlistenCompetitor, unlistenNotification, unlistenRefresh];
      } catch (error) {
        log.warn('useResearch: Failed to setup Tauri event listeners:', error);
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
    
    // Project Actions
    createProject,
    updateProject,
    deleteProject,
    loadProject,
    runProject,
    
    // Source Actions
    addSource,
    removeSource,
    
    // Competitor Actions
    addCompetitor,
    analyzeCompetitor,
    removeCompetitor,
    
    // Report Actions
    generateReport,
    
    // Search & Trends
    search: searchAction,
    refreshTrends,
    
    // Refresh
    refresh,
    refreshProjects,
    refreshCompetitors,
    refreshReports,
    
    // Computed
    activeProjects,
    completedProjects,
    draftReports,
    finalReports,
    unreadNotifications,
    totalCompetitors,
    avgConfidence,
  };
}

export default useResearch;
