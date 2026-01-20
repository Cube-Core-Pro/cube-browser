/**
 * CUBE Elite v7 - useSocial Hook
 * 
 * Centralized React hook for Social Media functionality.
 * Provides state management for accounts, posts, video projects, and analytics.
 * 
 * Features:
 * - Multi-platform account management
 * - Post creation, scheduling, and publishing
 * - Video project editing and rendering
 * - Social analytics and trending content
 * - AI content suggestions
 * - Real-time notifications
 * 
 * @module hooks/useSocial
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { logger } from '@/lib/services/logger-service';
import {
  AccountService,
  PostService,
  VideoProjectService,
  SocialAnalyticsService,
  SocialAccount,
  SocialPlatform,
  SocialPost,
  PostStatus,
  VideoProject,
  VideoStatus,
  SceneType,
  SocialAnalytics,
  SocialStats,
  TrendingContent,
  ContentSuggestion,
  SocialNotification,
} from '@/lib/services/social-service';

const log = logger.scope('useSocial');

// =============================================================================
// Types
// =============================================================================

export interface UseSocialOptions {
  /** Auto-refresh interval in milliseconds */
  autoRefresh?: number;
  /** Enable real-time updates */
  realtime?: boolean;
  /** Default account ID to load */
  defaultAccountId?: string;
  /** Analytics period */
  analyticsPeriod?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface SocialState {
  accounts: SocialAccount[];
  posts: SocialPost[];
  videoProjects: VideoProject[];
  analytics: SocialAnalytics | null;
  stats: SocialStats | null;
  trending: TrendingContent[];
  suggestions: ContentSuggestion[];
  notifications: SocialNotification[];
}

export interface SocialLoadingState {
  accounts: boolean;
  posts: boolean;
  videoProjects: boolean;
  analytics: boolean;
  global: boolean;
}

export interface SocialErrorState {
  accounts: string | null;
  posts: string | null;
  videoProjects: string | null;
  analytics: string | null;
}

export interface SocialFilters {
  accountId?: string;
  postStatus?: PostStatus;
  platform?: SocialPlatform;
  videoStatus?: VideoStatus;
}

export interface UseSocialReturn {
  // State
  data: SocialState;
  loading: SocialLoadingState;
  errors: SocialErrorState;
  filters: SocialFilters;
  
  // Filter Actions
  setFilters: (filters: Partial<SocialFilters>) => void;
  clearFilters: () => void;
  
  // Account Actions
  connectAccount: (platform: SocialPlatform, authCode?: string) => Promise<SocialAccount>;
  disconnectAccount: (accountId: string) => Promise<boolean>;
  syncAccount: (accountId: string) => Promise<SocialAccount>;
  
  // Post Actions
  createPost: (params: {
    accountId: string;
    content: string;
    mediaUrls?: string[];
    platforms?: SocialPlatform[];
    tags?: string[];
  }) => Promise<SocialPost>;
  updatePost: (params: {
    postId: string;
    content?: string;
    mediaUrls?: string[];
    tags?: string[];
  }) => Promise<SocialPost>;
  deletePost: (postId: string) => Promise<boolean>;
  schedulePost: (postId: string, scheduledAt: string) => Promise<SocialPost>;
  publishPost: (postId: string) => Promise<SocialPost>;
  
  // Video Project Actions
  createVideoProject: (params: {
    name: string;
    description?: string;
    resolution?: string;
  }) => Promise<VideoProject>;
  addVideoScene: (params: {
    projectId: string;
    sceneType: SceneType;
    content: string;
    duration: number;
    mediaUrl?: string;
  }) => Promise<VideoProject>;
  renderVideo: (projectId: string) => Promise<VideoProject>;
  deleteVideoProject: (projectId: string) => Promise<boolean>;
  
  // Analytics
  refreshAnalytics: (period?: 'day' | 'week' | 'month' | 'quarter' | 'year') => Promise<void>;
  refreshTrending: (platform?: SocialPlatform, limit?: number) => Promise<void>;
  refreshSuggestions: (accountId?: string, platform?: SocialPlatform) => Promise<void>;
  
  // Refresh
  refresh: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  refreshVideoProjects: () => Promise<void>;
  
  // Computed
  connectedAccounts: SocialAccount[];
  draftPosts: SocialPost[];
  scheduledPosts: SocialPost[];
  publishedPosts: SocialPost[];
  renderingProjects: VideoProject[];
  completedProjects: VideoProject[];
  unreadNotifications: SocialNotification[];
  totalFollowers: number;
  totalEngagement: number;
  accountsByPlatform: Record<SocialPlatform, SocialAccount[]>;
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

export function useSocial(options: UseSocialOptions = {}): UseSocialReturn {
  const { 
    autoRefresh, 
    realtime = true, 
    defaultAccountId, 
    analyticsPeriod = 'month' 
  } = options;
  
  // State
  const [data, setData] = useState<SocialState>({
    accounts: [],
    posts: [],
    videoProjects: [],
    analytics: null,
    stats: null,
    trending: [],
    suggestions: [],
    notifications: [],
  });
  
  const [loading, setLoading] = useState<SocialLoadingState>({
    accounts: false,
    posts: false,
    videoProjects: false,
    analytics: false,
    global: true,
  });
  
  const [errors, setErrors] = useState<SocialErrorState>({
    accounts: null,
    posts: null,
    videoProjects: null,
    analytics: null,
  });
  
  const [filters, setFiltersState] = useState<SocialFilters>({
    accountId: defaultAccountId,
  });
  
  // Refs
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==========================================================================
  // Filter Actions
  // ==========================================================================
  
  const setFilters = useCallback((newFilters: Partial<SocialFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);
  
  // ==========================================================================
  // Data Fetching
  // ==========================================================================
  
  const fetchAccounts = useCallback(async () => {
    const cached = getCached<SocialAccount[]>('accounts');
    
    if (cached) {
      setData(prev => ({ ...prev, accounts: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, accounts: true }));
    setErrors(prev => ({ ...prev, accounts: null }));
    
    try {
      const accounts = await AccountService.getAll();
      setData(prev => ({ ...prev, accounts }));
      setCache('accounts', accounts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch accounts';
      setErrors(prev => ({ ...prev, accounts: message }));
      log.error('useSocial: Failed to fetch accounts:', error);
    } finally {
      setLoading(prev => ({ ...prev, accounts: false }));
    }
  }, []);
  
  const fetchPosts = useCallback(async () => {
    const cacheKey = `posts:${filters.accountId || 'all'}:${filters.postStatus || 'all'}:${filters.platform || 'all'}`;
    const cached = getCached<SocialPost[]>(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, posts: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, posts: true }));
    setErrors(prev => ({ ...prev, posts: null }));
    
    try {
      const posts = await PostService.getAll({
        accountId: filters.accountId,
        status: filters.postStatus,
        platform: filters.platform,
      });
      setData(prev => ({ ...prev, posts }));
      setCache(cacheKey, posts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch posts';
      setErrors(prev => ({ ...prev, posts: message }));
      log.error('useSocial: Failed to fetch posts:', error);
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  }, [filters.accountId, filters.postStatus, filters.platform]);
  
  const fetchVideoProjects = useCallback(async () => {
    const cacheKey = `videoProjects:${filters.videoStatus || 'all'}`;
    const cached = getCached<VideoProject[]>(cacheKey);
    
    if (cached) {
      setData(prev => ({ ...prev, videoProjects: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, videoProjects: true }));
    setErrors(prev => ({ ...prev, videoProjects: null }));
    
    try {
      const videoProjects = await VideoProjectService.getAll({
        status: filters.videoStatus,
      });
      setData(prev => ({ ...prev, videoProjects }));
      setCache(cacheKey, videoProjects);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch video projects';
      setErrors(prev => ({ ...prev, videoProjects: message }));
      log.error('useSocial: Failed to fetch video projects:', error);
    } finally {
      setLoading(prev => ({ ...prev, videoProjects: false }));
    }
  }, [filters.videoStatus]);
  
  const fetchAnalytics = useCallback(async (period: 'day' | 'week' | 'month' | 'quarter' | 'year' = analyticsPeriod) => {
    setLoading(prev => ({ ...prev, analytics: true }));
    setErrors(prev => ({ ...prev, analytics: null }));
    
    try {
      const [analytics, stats, notifications] = await Promise.all([
        SocialAnalyticsService.getAnalytics({ accountId: filters.accountId, period }),
        SocialAnalyticsService.getStats(),
        SocialAnalyticsService.getNotifications(),
      ]);
      setData(prev => ({ ...prev, analytics, stats, notifications }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch analytics';
      setErrors(prev => ({ ...prev, analytics: message }));
      log.error('useSocial: Failed to fetch analytics:', error);
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  }, [filters.accountId, analyticsPeriod]);
  
  const fetchTrending = useCallback(async (platform?: SocialPlatform, limit?: number) => {
    try {
      const trending = await SocialAnalyticsService.getTrending({ platform, limit });
      setData(prev => ({ ...prev, trending }));
    } catch (error) {
      log.error('useSocial: Failed to fetch trending:', error);
    }
  }, []);
  
  const fetchSuggestions = useCallback(async (accountId?: string, platform?: SocialPlatform) => {
    try {
      const suggestions = await SocialAnalyticsService.getContentSuggestions({ 
        accountId: accountId || filters.accountId, 
        platform 
      });
      setData(prev => ({ ...prev, suggestions }));
    } catch (error) {
      log.error('useSocial: Failed to fetch suggestions:', error);
    }
  }, [filters.accountId]);
  
  // ==========================================================================
  // Refresh Functions
  // ==========================================================================
  
  const refresh = useCallback(async () => {
    invalidateCache();
    setLoading(prev => ({ ...prev, global: true }));
    
    await Promise.all([
      fetchAccounts(),
      fetchPosts(),
      fetchVideoProjects(),
      fetchAnalytics(),
      fetchTrending(),
      fetchSuggestions(),
    ]);
    
    setLoading(prev => ({ ...prev, global: false }));
  }, [fetchAccounts, fetchPosts, fetchVideoProjects, fetchAnalytics, fetchTrending, fetchSuggestions]);
  
  const refreshAccounts = useCallback(async () => {
    invalidateCache('accounts');
    await fetchAccounts();
  }, [fetchAccounts]);
  
  const refreshPosts = useCallback(async () => {
    invalidateCache('posts');
    await fetchPosts();
  }, [fetchPosts]);
  
  const refreshVideoProjects = useCallback(async () => {
    invalidateCache('videoProjects');
    await fetchVideoProjects();
  }, [fetchVideoProjects]);
  
  const refreshAnalytics = useCallback(async (period?: 'day' | 'week' | 'month' | 'quarter' | 'year') => {
    await fetchAnalytics(period);
  }, [fetchAnalytics]);
  
  const refreshTrending = useCallback(async (platform?: SocialPlatform, limit?: number) => {
    await fetchTrending(platform, limit);
  }, [fetchTrending]);
  
  const refreshSuggestions = useCallback(async (accountId?: string, platform?: SocialPlatform) => {
    await fetchSuggestions(accountId, platform);
  }, [fetchSuggestions]);
  
  // ==========================================================================
  // Account Actions
  // ==========================================================================
  
  const connectAccount = useCallback(async (platform: SocialPlatform, authCode?: string) => {
    const account = await AccountService.connect({ platform, authCode });
    
    setData(prev => ({
      ...prev,
      accounts: [account, ...prev.accounts],
    }));
    
    invalidateCache('accounts');
    return account;
  }, []);
  
  const disconnectAccount = useCallback(async (accountId: string) => {
    const result = await AccountService.disconnect(accountId);
    
    if (result) {
      setData(prev => ({
        ...prev,
        accounts: prev.accounts.filter(a => a.id !== accountId),
      }));
      invalidateCache('accounts');
    }
    
    return result;
  }, []);
  
  const syncAccount = useCallback(async (accountId: string) => {
    const account = await AccountService.sync(accountId);
    
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === accountId ? account : a),
    }));
    
    invalidateCache('accounts');
    return account;
  }, []);
  
  // ==========================================================================
  // Post Actions
  // ==========================================================================
  
  const createPost = useCallback(async (params: {
    accountId: string;
    content: string;
    mediaUrls?: string[];
    platforms?: SocialPlatform[];
    tags?: string[];
  }) => {
    const post = await PostService.create(params);
    
    setData(prev => ({
      ...prev,
      posts: [post, ...prev.posts],
    }));
    
    invalidateCache('posts');
    return post;
  }, []);
  
  const updatePost = useCallback(async (params: {
    postId: string;
    content?: string;
    mediaUrls?: string[];
    tags?: string[];
  }) => {
    const post = await PostService.update(params);
    
    setData(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === params.postId ? post : p),
    }));
    
    invalidateCache('posts');
    return post;
  }, []);
  
  const deletePost = useCallback(async (postId: string) => {
    const result = await PostService.delete(postId);
    
    if (result) {
      setData(prev => ({
        ...prev,
        posts: prev.posts.filter(p => p.id !== postId),
      }));
      invalidateCache('posts');
    }
    
    return result;
  }, []);
  
  const schedulePost = useCallback(async (postId: string, scheduledAt: string) => {
    const post = await PostService.schedule({ postId, scheduledAt });
    
    setData(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === postId ? post : p),
    }));
    
    invalidateCache('posts');
    return post;
  }, []);
  
  const publishPost = useCallback(async (postId: string) => {
    const post = await PostService.publish(postId);
    
    setData(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === postId ? post : p),
    }));
    
    invalidateCache('posts');
    return post;
  }, []);
  
  // ==========================================================================
  // Video Project Actions
  // ==========================================================================
  
  const createVideoProject = useCallback(async (params: {
    name: string;
    description?: string;
    resolution?: string;
  }) => {
    const project = await VideoProjectService.create(params);
    
    setData(prev => ({
      ...prev,
      videoProjects: [project, ...prev.videoProjects],
    }));
    
    invalidateCache('videoProjects');
    return project;
  }, []);
  
  const addVideoScene = useCallback(async (params: {
    projectId: string;
    sceneType: SceneType;
    content: string;
    duration: number;
    mediaUrl?: string;
  }) => {
    const project = await VideoProjectService.addScene(params);
    
    setData(prev => ({
      ...prev,
      videoProjects: prev.videoProjects.map(p => p.id === params.projectId ? project : p),
    }));
    
    invalidateCache('videoProjects');
    return project;
  }, []);
  
  const renderVideo = useCallback(async (projectId: string) => {
    const project = await VideoProjectService.render(projectId);
    
    setData(prev => ({
      ...prev,
      videoProjects: prev.videoProjects.map(p => p.id === projectId ? project : p),
    }));
    
    invalidateCache('videoProjects');
    return project;
  }, []);
  
  const deleteVideoProject = useCallback(async (projectId: string) => {
    const result = await VideoProjectService.delete(projectId);
    
    if (result) {
      setData(prev => ({
        ...prev,
        videoProjects: prev.videoProjects.filter(p => p.id !== projectId),
      }));
      invalidateCache('videoProjects');
    }
    
    return result;
  }, []);
  
  // ==========================================================================
  // Computed Values
  // ==========================================================================
  
  const connectedAccounts = useMemo(() => 
    data.accounts.filter(a => a.is_connected),
    [data.accounts]
  );
  
  const draftPosts = useMemo(() => 
    data.posts.filter(p => p.status === 'Draft'),
    [data.posts]
  );
  
  const scheduledPosts = useMemo(() => 
    data.posts.filter(p => p.status === 'Scheduled'),
    [data.posts]
  );
  
  const publishedPosts = useMemo(() => 
    data.posts.filter(p => p.status === 'Published'),
    [data.posts]
  );
  
  const renderingProjects = useMemo(() => 
    data.videoProjects.filter(p => p.status === 'Rendering'),
    [data.videoProjects]
  );
  
  const completedProjects = useMemo(() => 
    data.videoProjects.filter(p => p.status === 'Completed'),
    [data.videoProjects]
  );
  
  const unreadNotifications = useMemo(() => 
    data.notifications.filter(n => !n.read),
    [data.notifications]
  );
  
  const totalFollowers = useMemo(() => 
    data.accounts.reduce((sum, a) => sum + a.followers, 0),
    [data.accounts]
  );
  
  const totalEngagement = useMemo(() => 
    data.stats?.total_engagement || 0,
    [data.stats]
  );
  
  const accountsByPlatform = useMemo(() => {
    const grouped: Record<SocialPlatform, SocialAccount[]> = {
      Twitter: [],
      Instagram: [],
      Facebook: [],
      LinkedIn: [],
      TikTok: [],
      YouTube: [],
      Pinterest: [],
    };
    
    data.accounts.forEach(account => {
      if (grouped[account.platform]) {
        grouped[account.platform].push(account);
      }
    });
    
    return grouped;
  }, [data.accounts]);
  
  // ==========================================================================
  // Effects
  // ==========================================================================
  
  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  // Re-fetch when filters change
  useEffect(() => {
    fetchPosts();
    fetchVideoProjects();
  }, [fetchPosts, fetchVideoProjects, filters]);
  
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
        const unlistenPost = await listen<SocialPost>('social:post:updated', (event) => {
          setData(prev => ({
            ...prev,
            posts: prev.posts.map(p => p.id === event.payload.id ? event.payload : p),
          }));
        });
        
        const unlistenAccount = await listen<SocialAccount>('social:account:synced', (event) => {
          setData(prev => ({
            ...prev,
            accounts: prev.accounts.map(a => a.id === event.payload.id ? event.payload : a),
          }));
        });
        
        const unlistenNotification = await listen<SocialNotification>('social:notification', (event) => {
          setData(prev => ({
            ...prev,
            notifications: [event.payload, ...prev.notifications],
          }));
        });
        
        const unlistenVideo = await listen<VideoProject>('social:video:updated', (event) => {
          setData(prev => ({
            ...prev,
            videoProjects: prev.videoProjects.map(p => p.id === event.payload.id ? event.payload : p),
          }));
        });
        
        const unlistenRefresh = await listen('social:refresh', () => {
          refresh();
        });
        
        unlistenRefs.current = [
          unlistenPost, 
          unlistenAccount, 
          unlistenNotification, 
          unlistenVideo, 
          unlistenRefresh
        ];
      } catch (error) {
        log.warn('useSocial: Failed to setup Tauri event listeners:', error);
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
    
    // Account Actions
    connectAccount,
    disconnectAccount,
    syncAccount,
    
    // Post Actions
    createPost,
    updatePost,
    deletePost,
    schedulePost,
    publishPost,
    
    // Video Project Actions
    createVideoProject,
    addVideoScene,
    renderVideo,
    deleteVideoProject,
    
    // Analytics
    refreshAnalytics,
    refreshTrending,
    refreshSuggestions,
    
    // Refresh
    refresh,
    refreshAccounts,
    refreshPosts,
    refreshVideoProjects,
    
    // Computed
    connectedAccounts,
    draftPosts,
    scheduledPosts,
    publishedPosts,
    renderingProjects,
    completedProjects,
    unreadNotifications,
    totalFollowers,
    totalEngagement,
    accountsByPlatform,
  };
}

export default useSocial;
