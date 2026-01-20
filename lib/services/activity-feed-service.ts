/**
 * CUBE Nexum - Activity Feed Service
 * 
 * Complete activity feed system for viral engagement:
 * - User activity tracking
 * - Achievement notifications
 * - Social interactions
 * - Real-time updates
 * - Activity filtering and pagination
 * 
 * Now integrated with Tauri backend gamification commands
 */

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('ActivityFeed');

// ============================================================================
// BACKEND INTEGRATION
// ============================================================================

interface BackendAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  xp_reward: number;
  progress: number;
  max_progress: number;
  unlocked: boolean;
  unlocked_at?: number;
  hidden: boolean;
}

interface BackendChallenge {
  id: string;
  name: string;
  description: string;
  challenge_type: string;
  xp_reward: number;
  progress: number;
  target: number;
  completed: boolean;
  expires_at: number;
}

const BackendActivityAPI = {
  async getRecentAchievements(userId: string): Promise<BackendAchievement[]> {
    try {
      const achievements = await invoke<BackendAchievement[]>('gamification_get_achievements', { userId });
      // Filter to only unlocked achievements
      return achievements.filter(a => a.unlocked).slice(0, 20);
    } catch (error) {
      log.warn('Backend achievements fetch failed:', error);
      return [];
    }
  },

  async getChallenges(userId: string): Promise<BackendChallenge[]> {
    try {
      return await invoke<BackendChallenge[]>('gamification_get_challenges', { userId });
    } catch (error) {
      log.warn('Backend challenges fetch failed:', error);
      return [];
    }
  },

  async getStats(userId: string): Promise<{ user_level: { level: number; total_xp: number }; daily_streak: { current_streak: number }; achievements_unlocked: number } | null> {
    try {
      return await invoke<{ user_level: { level: number; total_xp: number }; daily_streak: { current_streak: number }; achievements_unlocked: number }>('gamification_get_stats', { userId });
    } catch (error) {
      log.warn('Backend stats fetch failed:', error);
      return null;
    }
  }
};

// ============================================================================
// TYPES
// ============================================================================

export type ActivityType = 
  | 'achievement_unlocked'
  | 'level_up'
  | 'streak_milestone'
  | 'challenge_completed'
  | 'referral_success'
  | 'workflow_created'
  | 'workflow_shared'
  | 'template_published'
  | 'template_used'
  | 'profile_update'
  | 'badge_earned'
  | 'reward_claimed'
  | 'leaderboard_rank'
  | 'collaboration_invite'
  | 'comment_received'
  | 'like_received'
  | 'follow_new'
  | 'milestone_reached';

export type ActivityVisibility = 'public' | 'friends' | 'private';

export interface ActivityUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  badge?: string;
  isVerified: boolean;
  isPro: boolean;
}

export interface ActivityMetadata {
  // Achievement related
  achievementId?: string;
  achievementName?: string;
  achievementIcon?: string;
  achievementRarity?: string;
  
  // Level related
  previousLevel?: number;
  newLevel?: number;
  
  // Streak related
  streakDays?: number;
  
  // Challenge related
  challengeId?: string;
  challengeName?: string;
  xpEarned?: number;
  
  // Referral related
  referralCode?: string;
  referredUser?: string;
  rewardAmount?: number;
  
  // Workflow related
  workflowId?: string;
  workflowName?: string;
  workflowDescription?: string;
  
  // Template related
  templateId?: string;
  templateName?: string;
  templateCategory?: string;
  usageCount?: number;
  
  // Leaderboard related
  rank?: number;
  previousRank?: number;
  leaderboardType?: string;
  
  // Social related
  targetUserId?: string;
  targetUsername?: string;
  commentText?: string;
  
  // Generic
  value?: number;
  label?: string;
  url?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  user: ActivityUser;
  title: string;
  description: string;
  metadata: ActivityMetadata;
  visibility: ActivityVisibility;
  createdAt: number;
  updatedAt: number;
  
  // Engagement
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLikedByMe: boolean;
  
  // Related activities (for grouping)
  relatedActivityIds?: string[];
}

export interface ActivityComment {
  id: string;
  activityId: string;
  userId: string;
  user: ActivityUser;
  text: string;
  createdAt: number;
  likesCount: number;
  isLikedByMe: boolean;
  replies?: ActivityComment[];
}

export interface ActivityFilter {
  types?: ActivityType[];
  userId?: string;
  visibility?: ActivityVisibility[];
  dateFrom?: number;
  dateTo?: number;
  hasAchievement?: boolean;
  minLikes?: number;
}

export interface ActivityFeedConfig {
  pageSize: number;
  enableRealtime: boolean;
  showOwnActivities: boolean;
  groupSimilar: boolean;
  notifyOnMention: boolean;
}

export interface ActivityStats {
  totalActivities: number;
  activitiesToday: number;
  activitiesThisWeek: number;
  activitiesThisMonth: number;
  topActivityType: ActivityType;
  engagementRate: number;
  averageLikesPerActivity: number;
}

// ============================================================================
// ACTIVITY TYPE CONFIGURATION
// ============================================================================

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, {
  icon: string;
  color: string;
  label: string;
  template: string;
  shareable: boolean;
  priority: number;
}> = {
  achievement_unlocked: {
    icon: '🏆',
    color: '#f59e0b',
    label: 'Achievement',
    template: '{user} unlocked the achievement "{achievement}"',
    shareable: true,
    priority: 10
  },
  level_up: {
    icon: '⬆️',
    color: '#8b5cf6',
    label: 'Level Up',
    template: '{user} reached Level {level}!',
    shareable: true,
    priority: 9
  },
  streak_milestone: {
    icon: '🔥',
    color: '#ef4444',
    label: 'Streak',
    template: '{user} hit a {days}-day streak!',
    shareable: true,
    priority: 8
  },
  challenge_completed: {
    icon: '✅',
    color: '#10b981',
    label: 'Challenge',
    template: '{user} completed the challenge "{challenge}"',
    shareable: true,
    priority: 7
  },
  referral_success: {
    icon: '👥',
    color: '#3b82f6',
    label: 'Referral',
    template: '{user} referred a new member!',
    shareable: false,
    priority: 6
  },
  workflow_created: {
    icon: '⚡',
    color: '#6366f1',
    label: 'Workflow',
    template: '{user} created a new workflow: "{workflow}"',
    shareable: true,
    priority: 5
  },
  workflow_shared: {
    icon: '📤',
    color: '#8b5cf6',
    label: 'Shared',
    template: '{user} shared their workflow "{workflow}"',
    shareable: true,
    priority: 5
  },
  template_published: {
    icon: '📋',
    color: '#ec4899',
    label: 'Template',
    template: '{user} published a new template: "{template}"',
    shareable: true,
    priority: 5
  },
  template_used: {
    icon: '📥',
    color: '#14b8a6',
    label: 'Template Used',
    template: '{user} used the template "{template}"',
    shareable: false,
    priority: 2
  },
  profile_update: {
    icon: '👤',
    color: '#64748b',
    label: 'Profile',
    template: '{user} updated their profile',
    shareable: false,
    priority: 1
  },
  badge_earned: {
    icon: '🎖️',
    color: '#f59e0b',
    label: 'Badge',
    template: '{user} earned the "{badge}" badge!',
    shareable: true,
    priority: 8
  },
  reward_claimed: {
    icon: '🎁',
    color: '#10b981',
    label: 'Reward',
    template: '{user} claimed a reward!',
    shareable: false,
    priority: 4
  },
  leaderboard_rank: {
    icon: '📊',
    color: '#f59e0b',
    label: 'Ranking',
    template: '{user} reached #{rank} on the leaderboard!',
    shareable: true,
    priority: 9
  },
  collaboration_invite: {
    icon: '🤝',
    color: '#3b82f6',
    label: 'Collaboration',
    template: '{user} invited you to collaborate',
    shareable: false,
    priority: 7
  },
  comment_received: {
    icon: '💬',
    color: '#64748b',
    label: 'Comment',
    template: '{user} commented on your activity',
    shareable: false,
    priority: 3
  },
  like_received: {
    icon: '❤️',
    color: '#ef4444',
    label: 'Like',
    template: '{user} liked your activity',
    shareable: false,
    priority: 2
  },
  follow_new: {
    icon: '👋',
    color: '#3b82f6',
    label: 'Follow',
    template: '{user} started following you',
    shareable: false,
    priority: 4
  },
  milestone_reached: {
    icon: '🎯',
    color: '#8b5cf6',
    label: 'Milestone',
    template: '{user} reached a milestone: {milestone}',
    shareable: true,
    priority: 8
  }
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

class ActivityFeedServiceClass {
  private activities: Activity[] = [];
  private comments: Map<string, ActivityComment[]> = new Map();
  private subscribers: Set<(activities: Activity[]) => void> = new Set();
  private config: ActivityFeedConfig = {
    pageSize: 20,
    enableRealtime: true,
    showOwnActivities: true,
    groupSimilar: true,
    notifyOnMention: true
  };
  private currentUserId: string = 'current_user';
  private backendSynced: boolean = false;

  // Initialize with mock data
  constructor() {
    this.initializeMockData();
    // Attempt to sync with backend (non-blocking)
    this.syncWithBackend().catch(err => log.warn('Backend sync deferred:', err));
  }

  // Sync activities from backend
  private async syncWithBackend(): Promise<void> {
    if (this.backendSynced) return;
    
    try {
      const userId = this.getCurrentUserId();
      
      // Fetch recent achievements and convert to activities
      const [achievements, challenges, stats] = await Promise.all([
        BackendActivityAPI.getRecentAchievements(userId),
        BackendActivityAPI.getChallenges(userId),
        BackendActivityAPI.getStats(userId)
      ]);

      const backendActivities: Activity[] = [];
      const now = Date.now();

      // Convert achievements to activities
      for (const achievement of achievements) {
        if (achievement.unlocked && achievement.unlocked_at) {
          backendActivities.push({
            id: `ach_${achievement.id}`,
            type: 'achievement_unlocked',
            userId,
            user: this.getCurrentUser(),
            title: 'Achievement Unlocked!',
            description: `You unlocked "${achievement.name}"`,
            metadata: {
              achievementId: achievement.id,
              achievementName: achievement.name,
              achievementIcon: achievement.icon,
              achievementRarity: achievement.rarity,
              xpEarned: achievement.xp_reward
            },
            visibility: 'public',
            createdAt: achievement.unlocked_at,
            updatedAt: achievement.unlocked_at,
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            isLikedByMe: false
          });
        }
      }

      // Convert completed challenges to activities
      for (const challenge of challenges) {
        if (challenge.completed) {
          backendActivities.push({
            id: `chl_${challenge.id}`,
            type: 'challenge_completed',
            userId,
            user: this.getCurrentUser(),
            title: 'Challenge Completed!',
            description: `You completed "${challenge.name}"`,
            metadata: {
              challengeId: challenge.id,
              challengeName: challenge.name,
              xpEarned: challenge.xp_reward
            },
            visibility: 'public',
            createdAt: now - 86400000, // Assume completed within last day
            updatedAt: now - 86400000,
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            isLikedByMe: false
          });
        }
      }

      // Add level and streak from stats
      if (stats) {
        if (stats.user_level.level > 1) {
          backendActivities.push({
            id: `level_${stats.user_level.level}`,
            type: 'level_up',
            userId,
            user: this.getCurrentUser(),
            title: 'Level Up!',
            description: `You reached Level ${stats.user_level.level}!`,
            metadata: {
              previousLevel: stats.user_level.level - 1,
              newLevel: stats.user_level.level
            },
            visibility: 'public',
            createdAt: now - 86400000 * 7,
            updatedAt: now - 86400000 * 7,
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            isLikedByMe: false
          });
        }

        if (stats.daily_streak.current_streak >= 7) {
          backendActivities.push({
            id: `streak_${stats.daily_streak.current_streak}`,
            type: 'streak_milestone',
            userId,
            user: this.getCurrentUser(),
            title: 'Streak Milestone!',
            description: `You've maintained a ${stats.daily_streak.current_streak}-day streak!`,
            metadata: {
              streakDays: stats.daily_streak.current_streak
            },
            visibility: 'public',
            createdAt: now - 3600000,
            updatedAt: now - 3600000,
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            isLikedByMe: false
          });
        }
      }

      // Merge backend activities with mock data
      if (backendActivities.length > 0) {
        const existingIds = new Set(this.activities.map(a => a.id));
        for (const activity of backendActivities) {
          if (!existingIds.has(activity.id)) {
            this.activities.push(activity);
          }
        }
        // Sort by date
        this.activities.sort((a, b) => b.createdAt - a.createdAt);
        this.notifySubscribers();
      }

      this.backendSynced = true;
    } catch (error) {
      log.warn('Failed to sync activities from backend:', error);
    }
  }

  private getCurrentUserId(): string {
    if (typeof window === 'undefined') {
      return 'default-user';
    }
    const stored = localStorage.getItem('cube_user_id');
    return stored || 'default-user';
  }

  private getCurrentUser(): ActivityUser {
    return {
      id: this.currentUserId,
      username: 'current_user',
      displayName: 'You',
      level: 1,
      isVerified: false,
      isPro: false
    };
  }

  private initializeMockData(): void {
    const mockUsers: ActivityUser[] = [
      { id: 'user1', username: 'alex_automation', displayName: 'Alex Chen', level: 42, isVerified: true, isPro: true, avatar: undefined, badge: '🏆' },
      { id: 'user2', username: 'sarah_dev', displayName: 'Sarah Johnson', level: 38, isVerified: false, isPro: true, avatar: undefined },
      { id: 'user3', username: 'mike_data', displayName: 'Mike Williams', level: 55, isVerified: true, isPro: true, avatar: undefined, badge: '👑' },
      { id: 'user4', username: 'emma_designer', displayName: 'Emma Davis', level: 29, isVerified: false, isPro: false, avatar: undefined },
      { id: 'user5', username: 'james_tech', displayName: 'James Miller', level: 67, isVerified: true, isPro: true, avatar: undefined, badge: '⭐' },
    ];

    const now = Date.now();
    const hour = 3600000;
    const day = 86400000;

    this.activities = [
      {
        id: 'act1',
        type: 'achievement_unlocked',
        userId: 'user1',
        user: mockUsers[0],
        title: 'Achievement Unlocked!',
        description: 'Alex Chen unlocked the "Automation Master" achievement',
        metadata: { achievementId: 'ach_automation_master', achievementName: 'Automation Master', achievementIcon: '🤖', achievementRarity: 'legendary', xpEarned: 500 },
        visibility: 'public',
        createdAt: now - hour,
        updatedAt: now - hour,
        likesCount: 24,
        commentsCount: 5,
        sharesCount: 3,
        isLikedByMe: false
      },
      {
        id: 'act2',
        type: 'level_up',
        userId: 'user3',
        user: mockUsers[2],
        title: 'Level Up!',
        description: 'Mike Williams reached Level 55!',
        metadata: { previousLevel: 54, newLevel: 55 },
        visibility: 'public',
        createdAt: now - hour * 2,
        updatedAt: now - hour * 2,
        likesCount: 45,
        commentsCount: 12,
        sharesCount: 0,
        isLikedByMe: true
      },
      {
        id: 'act3',
        type: 'streak_milestone',
        userId: 'user5',
        user: mockUsers[4],
        title: '100-Day Streak!',
        description: 'James Miller hit a 100-day streak! 🔥',
        metadata: { streakDays: 100 },
        visibility: 'public',
        createdAt: now - hour * 5,
        updatedAt: now - hour * 5,
        likesCount: 89,
        commentsCount: 23,
        sharesCount: 15,
        isLikedByMe: true
      },
      {
        id: 'act4',
        type: 'workflow_shared',
        userId: 'user2',
        user: mockUsers[1],
        title: 'Workflow Shared',
        description: 'Sarah Johnson shared their workflow "E-commerce Price Tracker"',
        metadata: { workflowId: 'wf_price_tracker', workflowName: 'E-commerce Price Tracker', workflowDescription: 'Automatically track prices across multiple stores' },
        visibility: 'public',
        createdAt: now - hour * 8,
        updatedAt: now - hour * 8,
        likesCount: 34,
        commentsCount: 8,
        sharesCount: 12,
        isLikedByMe: false
      },
      {
        id: 'act5',
        type: 'template_published',
        userId: 'user4',
        user: mockUsers[3],
        title: 'New Template Published',
        description: 'Emma Davis published a new template: "Social Media Scheduler"',
        metadata: { templateId: 'tpl_social_scheduler', templateName: 'Social Media Scheduler', templateCategory: 'marketing' },
        visibility: 'public',
        createdAt: now - day,
        updatedAt: now - day,
        likesCount: 56,
        commentsCount: 14,
        sharesCount: 28,
        isLikedByMe: false
      },
      {
        id: 'act6',
        type: 'leaderboard_rank',
        userId: 'user1',
        user: mockUsers[0],
        title: 'New Ranking!',
        description: 'Alex Chen reached #5 on the weekly leaderboard!',
        metadata: { rank: 5, previousRank: 12, leaderboardType: 'weekly' },
        visibility: 'public',
        createdAt: now - day - hour * 3,
        updatedAt: now - day - hour * 3,
        likesCount: 18,
        commentsCount: 4,
        sharesCount: 2,
        isLikedByMe: false
      },
      {
        id: 'act7',
        type: 'challenge_completed',
        userId: 'user3',
        user: mockUsers[2],
        title: 'Challenge Complete!',
        description: 'Mike Williams completed the "Data Master" weekly challenge',
        metadata: { challengeId: 'ch_data_master', challengeName: 'Data Master', xpEarned: 250 },
        visibility: 'public',
        createdAt: now - day * 2,
        updatedAt: now - day * 2,
        likesCount: 29,
        commentsCount: 6,
        sharesCount: 4,
        isLikedByMe: true
      },
      {
        id: 'act8',
        type: 'referral_success',
        userId: 'user5',
        user: mockUsers[4],
        title: 'Referral Success!',
        description: 'James Miller referred a new member and earned rewards!',
        metadata: { referralCode: 'JAMES2024', rewardAmount: 100 },
        visibility: 'public',
        createdAt: now - day * 2 - hour * 5,
        updatedAt: now - day * 2 - hour * 5,
        likesCount: 12,
        commentsCount: 2,
        sharesCount: 0,
        isLikedByMe: false
      },
      {
        id: 'act9',
        type: 'badge_earned',
        userId: 'user2',
        user: mockUsers[1],
        title: 'Badge Earned!',
        description: 'Sarah Johnson earned the "Early Adopter" badge!',
        metadata: { achievementId: 'badge_early_adopter', achievementName: 'Early Adopter', achievementIcon: '🌟' },
        visibility: 'public',
        createdAt: now - day * 3,
        updatedAt: now - day * 3,
        likesCount: 67,
        commentsCount: 18,
        sharesCount: 9,
        isLikedByMe: true
      },
      {
        id: 'act10',
        type: 'milestone_reached',
        userId: 'user4',
        user: mockUsers[3],
        title: 'Milestone Reached!',
        description: 'Emma Davis reached 1,000 workflow executions!',
        metadata: { value: 1000, label: '1,000 Workflow Executions' },
        visibility: 'public',
        createdAt: now - day * 4,
        updatedAt: now - day * 4,
        likesCount: 43,
        commentsCount: 11,
        sharesCount: 6,
        isLikedByMe: false
      }
    ];
  }

  // Get activities with filtering and pagination
  getActivities(filter?: ActivityFilter, page: number = 1): { activities: Activity[]; total: number; hasMore: boolean } {
    let filtered = [...this.activities];

    if (filter) {
      if (filter.types && filter.types.length > 0) {
        filtered = filtered.filter(a => filter.types!.includes(a.type));
      }
      if (filter.userId) {
        filtered = filtered.filter(a => a.userId === filter.userId);
      }
      if (filter.visibility && filter.visibility.length > 0) {
        filtered = filtered.filter(a => filter.visibility!.includes(a.visibility));
      }
      if (filter.dateFrom) {
        filtered = filtered.filter(a => a.createdAt >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        filtered = filtered.filter(a => a.createdAt <= filter.dateTo!);
      }
      if (filter.hasAchievement) {
        filtered = filtered.filter(a => 
          a.type === 'achievement_unlocked' || a.type === 'badge_earned'
        );
      }
      if (filter.minLikes !== undefined) {
        filtered = filtered.filter(a => a.likesCount >= filter.minLikes!);
      }
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    const startIndex = (page - 1) * this.config.pageSize;
    const endIndex = startIndex + this.config.pageSize;
    const paginatedActivities = filtered.slice(startIndex, endIndex);

    return {
      activities: paginatedActivities,
      total: filtered.length,
      hasMore: endIndex < filtered.length
    };
  }

  // Get single activity by ID
  getActivity(activityId: string): Activity | null {
    return this.activities.find(a => a.id === activityId) || null;
  }

  // Create new activity
  createActivity(
    type: ActivityType,
    title: string,
    description: string,
    metadata: ActivityMetadata,
    visibility: ActivityVisibility = 'public'
  ): Activity {
    const newActivity: Activity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId: this.currentUserId,
      user: {
        id: this.currentUserId,
        username: 'current_user',
        displayName: 'You',
        level: 1,
        isVerified: false,
        isPro: false
      },
      title,
      description,
      metadata,
      visibility,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLikedByMe: false
    };

    this.activities.unshift(newActivity);
    this.notifySubscribers();
    return newActivity;
  }

  // Like/unlike activity
  toggleLike(activityId: string): { liked: boolean; likesCount: number } {
    const activity = this.activities.find(a => a.id === activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }

    activity.isLikedByMe = !activity.isLikedByMe;
    activity.likesCount += activity.isLikedByMe ? 1 : -1;
    activity.updatedAt = Date.now();

    this.notifySubscribers();
    return { liked: activity.isLikedByMe, likesCount: activity.likesCount };
  }

  // Add comment to activity
  addComment(activityId: string, text: string): ActivityComment {
    const activity = this.activities.find(a => a.id === activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }

    const comment: ActivityComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      activityId,
      userId: this.currentUserId,
      user: {
        id: this.currentUserId,
        username: 'current_user',
        displayName: 'You',
        level: 1,
        isVerified: false,
        isPro: false
      },
      text,
      createdAt: Date.now(),
      likesCount: 0,
      isLikedByMe: false
    };

    const existingComments = this.comments.get(activityId) || [];
    existingComments.push(comment);
    this.comments.set(activityId, existingComments);

    activity.commentsCount += 1;
    activity.updatedAt = Date.now();

    this.notifySubscribers();
    return comment;
  }

  // Get comments for activity
  getComments(activityId: string): ActivityComment[] {
    return this.comments.get(activityId) || [];
  }

  // Share activity
  shareActivity(activityId: string, platform: string): void {
    const activity = this.activities.find(a => a.id === activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }

    activity.sharesCount += 1;
    activity.updatedAt = Date.now();

    const _config = ACTIVITY_TYPE_CONFIG[activity.type];
    const shareText = `${activity.description} - Check out CUBE Nexum!`;
    const shareUrl = `https://cube-nexum.app/activity/${activityId}`;

    // Open share dialog based on platform
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    };

    if (typeof window !== 'undefined' && shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }

    this.notifySubscribers();
  }

  // Delete activity
  deleteActivity(activityId: string): boolean {
    const index = this.activities.findIndex(a => a.id === activityId && a.userId === this.currentUserId);
    if (index === -1) {
      return false;
    }

    this.activities.splice(index, 1);
    this.comments.delete(activityId);
    this.notifySubscribers();
    return true;
  }

  // Get activity stats
  getStats(): ActivityStats {
    const now = Date.now();
    const dayMs = 86400000;
    const weekMs = dayMs * 7;
    const monthMs = dayMs * 30;

    const today = this.activities.filter(a => now - a.createdAt < dayMs);
    const thisWeek = this.activities.filter(a => now - a.createdAt < weekMs);
    const thisMonth = this.activities.filter(a => now - a.createdAt < monthMs);

    // Find top activity type
    const typeCounts = new Map<ActivityType, number>();
    this.activities.forEach(a => {
      typeCounts.set(a.type, (typeCounts.get(a.type) || 0) + 1);
    });
    
    let topType: ActivityType = 'achievement_unlocked';
    let maxCount = 0;
    typeCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        topType = type;
      }
    });

    const totalLikes = this.activities.reduce((sum, a) => sum + a.likesCount, 0);
    const totalEngagement = this.activities.reduce(
      (sum, a) => sum + a.likesCount + a.commentsCount + a.sharesCount, 0
    );

    return {
      totalActivities: this.activities.length,
      activitiesToday: today.length,
      activitiesThisWeek: thisWeek.length,
      activitiesThisMonth: thisMonth.length,
      topActivityType: topType,
      engagementRate: this.activities.length > 0 ? totalEngagement / this.activities.length : 0,
      averageLikesPerActivity: this.activities.length > 0 ? totalLikes / this.activities.length : 0
    };
  }

  // Subscribe to activity updates
  subscribe(callback: (activities: Activity[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.activities));
  }

  // Update config
  updateConfig(config: Partial<ActivityFeedConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ActivityFeedConfig {
    return { ...this.config };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const ActivityFeedService = new ActivityFeedServiceClass();

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook to access activity feed with filtering and pagination
 */
export function useActivityFeed(filter?: ActivityFilter) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const loadActivities = useCallback((reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const result = ActivityFeedService.getActivities(filter, currentPage);
      
      if (reset) {
        setActivities(result.activities);
        setPage(1);
      } else {
        setActivities(prev => [...prev, ...result.activities]);
      }
      
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    loadActivities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    const unsubscribe = ActivityFeedService.subscribe(() => {
      loadActivities(true);
    });
    return unsubscribe;
  }, [loadActivities]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    if (page > 1) {
      loadActivities(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const refresh = useCallback(() => {
    loadActivities(true);
  }, [loadActivities]);

  return {
    activities,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh
  };
}

/**
 * Hook to manage a single activity
 */
export function useActivity(activityId: string) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLoading(true);
      const act = ActivityFeedService.getActivity(activityId);
      setActivity(act);
      if (act) {
        setComments(ActivityFeedService.getComments(activityId));
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  const toggleLike = useCallback(() => {
    if (!activity) return;
    const result = ActivityFeedService.toggleLike(activityId);
    setActivity(prev => prev ? { ...prev, isLikedByMe: result.liked, likesCount: result.likesCount } : null);
  }, [activityId, activity]);

  const addComment = useCallback((text: string) => {
    const comment = ActivityFeedService.addComment(activityId, text);
    setComments(prev => [...prev, comment]);
    setActivity(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
    return comment;
  }, [activityId]);

  const share = useCallback((platform: string) => {
    ActivityFeedService.shareActivity(activityId, platform);
    setActivity(prev => prev ? { ...prev, sharesCount: prev.sharesCount + 1 } : null);
  }, [activityId]);

  return {
    activity,
    comments,
    loading,
    error,
    toggleLike,
    addComment,
    share
  };
}

/**
 * Hook for activity stats
 */
export function useActivityStats() {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const activityStats = ActivityFeedService.getStats();
    setStats(activityStats);
    setLoading(false);

    const unsubscribe = ActivityFeedService.subscribe(() => {
      setStats(ActivityFeedService.getStats());
    });

    return unsubscribe;
  }, []);

  return { stats, loading };
}

/**
 * Hook to create activities
 */
export function useCreateActivity() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createActivity = useCallback((
    type: ActivityType,
    title: string,
    description: string,
    metadata: ActivityMetadata,
    visibility?: ActivityVisibility
  ) => {
    try {
      setCreating(true);
      setError(null);
      const activity = ActivityFeedService.createActivity(type, title, description, metadata, visibility);
      return activity;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity');
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  return { createActivity, creating, error };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format activity timestamp for display
 */
export function formatActivityTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  
  if (diff < minute) {
    return 'Just now';
  } else if (diff < hour) {
    const mins = Math.floor(diff / minute);
    return `${mins}m ago`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}h ago`;
  } else if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days}d ago`;
  } else if (diff < month) {
    const weeks = Math.floor(diff / week);
    return `${weeks}w ago`;
  } else {
    const months = Math.floor(diff / month);
    return `${months}mo ago`;
  }
}

/**
 * Generate activity message from template
 */
export function generateActivityMessage(activity: Activity): string {
  const config = ACTIVITY_TYPE_CONFIG[activity.type];
  let message = config.template;
  
  message = message.replace('{user}', activity.user.displayName);
  
  if (activity.metadata.achievementName) {
    message = message.replace('{achievement}', activity.metadata.achievementName);
  }
  if (activity.metadata.newLevel) {
    message = message.replace('{level}', activity.metadata.newLevel.toString());
  }
  if (activity.metadata.streakDays) {
    message = message.replace('{days}', activity.metadata.streakDays.toString());
  }
  if (activity.metadata.challengeName) {
    message = message.replace('{challenge}', activity.metadata.challengeName);
  }
  if (activity.metadata.workflowName) {
    message = message.replace('{workflow}', activity.metadata.workflowName);
  }
  if (activity.metadata.templateName) {
    message = message.replace('{template}', activity.metadata.templateName);
  }
  if (activity.metadata.rank) {
    message = message.replace('{rank}', activity.metadata.rank.toString());
  }
  if (activity.metadata.label) {
    message = message.replace('{milestone}', activity.metadata.label);
  }
  if (activity.metadata.achievementName && activity.type === 'badge_earned') {
    message = message.replace('{badge}', activity.metadata.achievementName);
  }
  
  return message;
}
