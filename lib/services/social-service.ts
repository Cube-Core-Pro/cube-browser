/**
 * Social Media Service - Enterprise Integration Layer
 * 
 * Complete backend integration for all Social Media Tauri commands.
 * Provides typed interfaces and service methods for accounts,
 * posts, video projects, analytics, and content suggestions.
 * 
 * @module lib/services/social-service
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  display_name: string;
  profile_url: string;
  followers: number;
  following: number;
  posts_count: number;
  is_connected: boolean;
  last_sync: Option<string>;
  created_at: string;
}

export type SocialPlatform = 
  | 'Twitter' 
  | 'Instagram' 
  | 'Facebook' 
  | 'LinkedIn' 
  | 'TikTok' 
  | 'YouTube' 
  | 'Pinterest';

export interface SocialPost {
  id: string;
  account_id: string;
  content: string;
  media_urls: string[];
  platforms: SocialPlatform[];
  status: PostStatus;
  scheduled_at: Option<string>;
  published_at: Option<string>;
  analytics: PostAnalytics;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type PostStatus = 'Draft' | 'Scheduled' | 'Published' | 'Failed';

export interface PostAnalytics {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  engagements: number;
  clicks: number;
  saves: number;
}

export interface VideoProject {
  id: string;
  name: string;
  description: string;
  scenes: VideoScene[];
  duration: number;
  resolution: string;
  status: VideoStatus;
  output_url: Option<string>;
  created_at: string;
  updated_at: string;
}

export type VideoStatus = 'Draft' | 'Editing' | 'Rendering' | 'Completed' | 'Failed';

export interface VideoScene {
  id: string;
  scene_type: SceneType;
  content: string;
  duration: number;
  order: number;
  media_url: Option<string>;
  transitions: VideoTransition;
  effects: string[];
}

export type SceneType = 'Text' | 'Image' | 'Video' | 'Audio' | 'Transition';

export interface VideoTransition {
  enter: string;
  exit: string;
}

export interface SocialAnalytics {
  period: string;
  total_followers: number;
  followers_growth: number;
  total_posts: number;
  total_engagement: number;
  avg_engagement_rate: number;
  top_posts: TopPost[];
  platform_breakdown: PlatformStats[];
  engagement_by_day: DailyEngagement[];
}

export interface TopPost {
  post_id: string;
  content_preview: string;
  engagement: number;
  platform: SocialPlatform;
}

export interface PlatformStats {
  platform: SocialPlatform;
  followers: number;
  posts: number;
  engagement: number;
  growth: number;
}

export interface DailyEngagement {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
}

export interface SocialStats {
  total_accounts: number;
  total_posts: number;
  scheduled_posts: number;
  total_followers: number;
  total_engagement: number;
}

export interface TrendingContent {
  id: string;
  topic: string;
  hashtags: string[];
  volume: number;
  growth: number;
  platforms: SocialPlatform[];
  suggested_content: string;
}

export interface ContentSuggestion {
  id: string;
  suggestion_type: string;
  title: string;
  content: string;
  platforms: SocialPlatform[];
  best_time: string;
  expected_engagement: number;
  hashtags: string[];
}

export interface SocialNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

type Option<T> = T | null;

// ============================================================================
// Account Service
// ============================================================================

export const AccountService = {
  /**
   * Connect a new social media account
   */
  async connect(params: {
    platform: SocialPlatform;
    authCode?: string;
  }): Promise<SocialAccount> {
    return invoke<SocialAccount>('social_connect_account', {
      platform: params.platform,
      authCode: params.authCode,
    });
  },

  /**
   * Get all connected accounts
   */
  async getAll(): Promise<SocialAccount[]> {
    return invoke<SocialAccount[]>('social_get_accounts');
  },

  /**
   * Disconnect an account
   */
  async disconnect(accountId: string): Promise<boolean> {
    return invoke<boolean>('social_disconnect_account', { accountId });
  },

  /**
   * Sync account data from platform
   */
  async sync(accountId: string): Promise<SocialAccount> {
    return invoke<SocialAccount>('social_sync_account', { accountId });
  },
};

// ============================================================================
// Post Service
// ============================================================================

export const PostService = {
  /**
   * Create a new post
   */
  async create(params: {
    accountId: string;
    content: string;
    mediaUrls?: string[];
    platforms?: SocialPlatform[];
    tags?: string[];
  }): Promise<SocialPost> {
    return invoke<SocialPost>('social_create_post', {
      accountId: params.accountId,
      content: params.content,
      mediaUrls: params.mediaUrls || [],
      platforms: params.platforms || [],
      tags: params.tags || [],
    });
  },

  /**
   * Get all posts with optional filters
   */
  async getAll(params?: {
    accountId?: string;
    status?: PostStatus;
    platform?: SocialPlatform;
  }): Promise<SocialPost[]> {
    return invoke<SocialPost[]>('social_get_posts', {
      accountId: params?.accountId,
      status: params?.status,
      platform: params?.platform,
    });
  },

  /**
   * Get a single post by ID
   */
  async getById(id: string): Promise<SocialPost | null> {
    return invoke<SocialPost | null>('social_get_post', { id });
  },

  /**
   * Update a post
   */
  async update(params: {
    postId: string;
    content?: string;
    mediaUrls?: string[];
    tags?: string[];
  }): Promise<SocialPost> {
    return invoke<SocialPost>('social_update_post', params);
  },

  /**
   * Delete a post
   */
  async delete(postId: string): Promise<boolean> {
    return invoke<boolean>('social_delete_post', { postId });
  },

  /**
   * Schedule a post
   */
  async schedule(params: {
    postId: string;
    scheduledAt: string;
  }): Promise<SocialPost> {
    return invoke<SocialPost>('social_schedule_post', params);
  },

  /**
   * Publish a post immediately
   */
  async publish(postId: string): Promise<SocialPost> {
    return invoke<SocialPost>('social_publish_post', { postId });
  },
};

// ============================================================================
// Video Project Service
// ============================================================================

export const VideoProjectService = {
  /**
   * Create a new video project
   */
  async create(params: {
    name: string;
    description?: string;
    resolution?: string;
  }): Promise<VideoProject> {
    return invoke<VideoProject>('social_create_video_project', {
      name: params.name,
      description: params.description || '',
      resolution: params.resolution || '1080p',
    });
  },

  /**
   * Get all video projects
   */
  async getAll(params?: {
    status?: VideoStatus;
  }): Promise<VideoProject[]> {
    return invoke<VideoProject[]>('social_get_video_projects', {
      status: params?.status,
    });
  },

  /**
   * Get a single project by ID
   */
  async getById(id: string): Promise<VideoProject | null> {
    return invoke<VideoProject | null>('social_get_video_project', { id });
  },

  /**
   * Add a scene to a video project
   */
  async addScene(params: {
    projectId: string;
    sceneType: SceneType;
    content: string;
    duration: number;
    mediaUrl?: string;
  }): Promise<VideoProject> {
    return invoke<VideoProject>('social_add_video_scene', {
      projectId: params.projectId,
      sceneType: params.sceneType,
      content: params.content,
      duration: params.duration,
      mediaUrl: params.mediaUrl,
    });
  },

  /**
   * Render a video project
   */
  async render(projectId: string): Promise<VideoProject> {
    return invoke<VideoProject>('social_render_video', { projectId });
  },

  /**
   * Delete a video project
   */
  async delete(projectId: string): Promise<boolean> {
    return invoke<boolean>('social_delete_video_project', { projectId });
  },
};

// ============================================================================
// Analytics Service
// ============================================================================

export const SocialAnalyticsService = {
  /**
   * Get social media analytics
   */
  async getAnalytics(params: {
    accountId?: string;
    period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  }): Promise<SocialAnalytics> {
    return invoke<SocialAnalytics>('social_get_analytics', {
      accountId: params.accountId,
      period: params.period,
    });
  },

  /**
   * Get social media statistics
   */
  async getStats(): Promise<SocialStats> {
    return invoke<SocialStats>('social_get_stats');
  },

  /**
   * Get trending content
   */
  async getTrending(params?: {
    platform?: SocialPlatform;
    limit?: number;
  }): Promise<TrendingContent[]> {
    return invoke<TrendingContent[]>('social_get_trending', {
      platform: params?.platform,
      limit: params?.limit || 10,
    });
  },

  /**
   * Get AI content suggestions
   */
  async getContentSuggestions(params?: {
    accountId?: string;
    platform?: SocialPlatform;
  }): Promise<ContentSuggestion[]> {
    return invoke<ContentSuggestion[]>('social_get_content_suggestions', {
      accountId: params?.accountId,
      platform: params?.platform,
    });
  },

  /**
   * Get notifications
   */
  async getNotifications(): Promise<SocialNotification[]> {
    return invoke<SocialNotification[]>('social_get_notifications');
  },
};

// ============================================================================
// Unified Social Service Export
// ============================================================================

export const SocialService = {
  accounts: AccountService,
  posts: PostService,
  video: VideoProjectService,
  analytics: SocialAnalyticsService,
};

export default SocialService;
