/**
 * User Profile Service
 * 
 * Comprehensive user profile management for CUBE Nexum v7.0.0
 * Handles profile data, settings, achievements, and social features
 * 
 * Now integrated with Tauri backend for persistence
 * 
 * @module lib/services/user-profile-service
 */

import { logger } from './logger-service';

const log = logger.scope('Service');

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// BACKEND TYPES (match gamification_commands.rs)
// ============================================================================

interface BackendGamificationStats {
  user_level: {
    level: number;
    current_xp: number;
    xp_for_next_level: number;
    total_xp: number;
    title: string;
  };
  daily_streak: {
    current_streak: number;
    longest_streak: number;
    last_activity: number;
    streak_multiplier: number;
  };
  achievements_unlocked: number;
  total_achievements: number;
  badges_earned: number;
  challenges_completed: number;
  total_rewards_claimed: number;
}

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

interface BackendLeaderboardEntry {
  user_id: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  level: number;
}

interface BackendSocialProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar?: string;
  level: number;
  bio?: string;
}

interface BackendProfileActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  timestamp: number;
  xp_earned?: number;
  metadata?: Record<string, unknown>;
}

// Backend API methods
const BackendGamificationAPI = {
  async getStats(userId: string): Promise<BackendGamificationStats | null> {
    try {
      return await invoke<BackendGamificationStats>('gamification_get_stats', { userId });
    } catch (error) {
      log.warn('Backend gamification stats failed:', error);
      return null;
    }
  },

  async getLevel(userId: string): Promise<{ level: number; current_xp: number; total_xp: number } | null> {
    try {
      return await invoke<{ level: number; current_xp: number; xp_for_next_level: number; total_xp: number; title: string }>('gamification_get_level', { userId });
    } catch (error) {
      log.warn('Backend level fetch failed:', error);
      return null;
    }
  },

  async addXp(userId: string, amount: number, source: string): Promise<{ new_level: number; total_xp: number; leveled_up: boolean } | null> {
    try {
      return await invoke<{ new_level: number; total_xp: number; leveled_up: boolean }>('gamification_add_xp', { userId, amount, source });
    } catch (error) {
      log.warn('Backend XP add failed:', error);
      return null;
    }
  },

  async getAchievements(userId: string): Promise<BackendAchievement[]> {
    try {
      return await invoke<BackendAchievement[]>('gamification_get_achievements', { userId });
    } catch (error) {
      log.warn('Backend achievements fetch failed:', error);
      return [];
    }
  },

  async getStreak(userId: string): Promise<{ current_streak: number; longest_streak: number; multiplier: number } | null> {
    try {
      const result = await invoke<{ current_streak: number; longest_streak: number; last_activity: number; streak_multiplier: number }>('gamification_get_streak', { userId });
      if (result) {
        return {
          current_streak: result.current_streak,
          longest_streak: result.longest_streak,
          multiplier: result.streak_multiplier
        };
      }
      return null;
    } catch (error) {
      log.warn('Backend streak fetch failed:', error);
      return null;
    }
  },

  async checkIn(userId: string): Promise<{ streak: number; bonus_xp: number } | null> {
    try {
      return await invoke<{ streak: number; bonus_xp: number; multiplier: number }>('gamification_check_in', { userId });
    } catch (error) {
      log.warn('Backend check-in failed:', error);
      return null;
    }
  },

  async getLeaderboard(category: string, period: string, limit: number): Promise<BackendLeaderboardEntry[]> {
    try {
      return await invoke<BackendLeaderboardEntry[]>('gamification_get_leaderboard', { category, period, limit });
    } catch (error) {
      log.warn('Backend leaderboard fetch failed:', error);
      return [];
    }
  },

  async getBadges(userId: string): Promise<Array<{ id: string; name: string; description: string; icon: string; tier: string; earned_at?: number }>> {
    try {
      return await invoke<Array<{ id: string; name: string; description: string; icon: string; tier: string; earned_at?: number }>>('gamification_get_badges', { userId });
    } catch (error) {
      log.warn('Backend badges fetch failed:', error);
      return [];
    }
  },

  async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('gamification_is_following', { currentUserId, targetUserId });
    } catch (error) {
      log.warn('Backend isFollowing check failed:', error);
      return false;
    }
  },

  async getFollowers(userId: string, page: number, limit: number): Promise<BackendSocialProfile[]> {
    try {
      return await invoke<BackendSocialProfile[]>('gamification_get_followers', { userId, page, limit });
    } catch (error) {
      log.warn('Backend followers fetch failed:', error);
      return [];
    }
  },

  async getFollowing(userId: string, page: number, limit: number): Promise<BackendSocialProfile[]> {
    try {
      return await invoke<BackendSocialProfile[]>('gamification_get_following', { userId, page, limit });
    } catch (error) {
      log.warn('Backend following fetch failed:', error);
      return [];
    }
  },

  async getActivity(userId: string, page: number, limit: number): Promise<BackendProfileActivity[]> {
    try {
      return await invoke<BackendProfileActivity[]>('gamification_get_activity', { userId, page, limit });
    } catch (error) {
      log.warn('Backend activity fetch failed:', error);
      return [];
    }
  },

  async followUser(currentUserId: string, targetUserId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('gamification_follow_user', { currentUserId, targetUserId });
    } catch (error) {
      log.warn('Backend follow user failed:', error);
      return false;
    }
  },

  async unfollowUser(currentUserId: string, targetUserId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('gamification_unfollow_user', { currentUserId, targetUserId });
    } catch (error) {
      log.warn('Backend unfollow user failed:', error);
      return false;
    }
  }
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  company?: string;
  role: UserRole;
  tier: UserTier;
  verified: boolean;
  createdAt: Date;
  lastActiveAt: Date;
  stats: UserStats;
  badges: UserBadge[];
  socialLinks: SocialLinks;
  preferences: UserPreferences;
  privacy: PrivacySettings;
}

export type UserRole = 'user' | 'pro' | 'team_member' | 'team_admin' | 'enterprise_admin' | 'admin';

export type UserTier = 'free' | 'starter' | 'pro' | 'team' | 'enterprise';

export interface UserStats {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  workflowsCreated: number;
  workflowsShared: number;
  templatesCreated: number;
  templatesUsed: number;
  automationsRun: number;
  dataExtracted: number;
  referralsMade: number;
  referralsConverted: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  challengesCompleted: number;
  leaderboardRank: number;
  leaderboardPercentile: number;
  followers: number;
  following: number;
  likesReceived: number;
  likesGiven: number;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  unlockedAt: Date;
  category: BadgeCategory;
}

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type BadgeCategory = 'achievement' | 'milestone' | 'special' | 'seasonal' | 'community';

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  discord?: string;
  website?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  accessibility: AccessibilityPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  marketing: boolean;
  weeklyDigest: boolean;
  achievementAlerts: boolean;
  socialAlerts: boolean;
  teamAlerts: boolean;
}

export interface AccessibilityPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private';
  showActivity: boolean;
  showStats: boolean;
  showBadges: boolean;
  showWorkflows: boolean;
  allowFollowers: boolean;
  allowMessages: boolean;
}

export interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  company?: string;
  avatar?: string;
  socialLinks?: Partial<SocialLinks>;
}

export interface FollowRelation {
  userId: string;
  followerId: string;
  createdAt: Date;
}

export interface ProfileActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  score: number;
  level: number;
  change: number;
  verified: boolean;
  tier: UserTier;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TIER_COLORS: Record<UserTier, string> = {
  free: '#64748b',
  starter: '#3b82f6',
  pro: '#8b5cf6',
  team: '#f59e0b',
  enterprise: '#ef4444'
};

export const TIER_LABELS: Record<UserTier, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  team: 'Team',
  enterprise: 'Enterprise'
};

export const BADGE_RARITY_COLORS: Record<BadgeRarity, string> = {
  common: '#64748b',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b'
};

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 4000, 7000, 11000, 16000,
  22000, 30000, 40000, 52000, 66000, 82000, 100000, 120000, 142000, 166000,
  192000, 220000, 250000, 282000, 316000, 352000, 390000, 430000, 472000, 516000,
  562000, 610000, 660000, 712000, 766000, 822000, 880000, 940000, 1002000, 1066000,
  1132000, 1200000, 1270000, 1342000, 1416000, 1492000, 1570000, 1650000, 1732000, 1816000
];

// ============================================================================
// SERVICE CLASS
// ============================================================================

class UserProfileService {
  private currentProfile: UserProfile | null = null;
  private profileCache: Map<string, { profile: UserProfile; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private listeners: Set<(profile: UserProfile | null) => void> = new Set();

  /**
   * Get the current user's profile
   */
  async getCurrentProfile(): Promise<UserProfile | null> {
    if (this.currentProfile) {
      return this.currentProfile;
    }

    try {
      // Simulated API call - in production would fetch from backend
      const profile = await this.fetchProfile('current');
      this.currentProfile = profile;
      this.notifyListeners();
      return profile;
    } catch (error) {
      log.error('Failed to get current profile:', error);
      return null;
    }
  }

  /**
   * Get a user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const cached = this.profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.profile;
    }

    try {
      const profile = await this.fetchProfile(userId);
      if (profile) {
        this.profileCache.set(userId, { profile, timestamp: Date.now() });
      }
      return profile;
    } catch (error) {
      log.error(`Failed to get profile for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Update the current user's profile
   */
  async updateProfile(data: ProfileUpdateData): Promise<UserProfile | null> {
    try {
      // Simulated API call
      if (this.currentProfile) {
        this.currentProfile = {
          ...this.currentProfile,
          ...data,
          socialLinks: {
            ...this.currentProfile.socialLinks,
            ...data.socialLinks
          }
        };
        this.notifyListeners();
        return this.currentProfile;
      }
      return null;
    } catch (error) {
      log.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.currentProfile) return;

    this.currentProfile.preferences = {
      ...this.currentProfile.preferences,
      ...preferences
    };
    this.notifyListeners();
  }

  /**
   * Update privacy settings
   */
  async updatePrivacy(privacy: Partial<PrivacySettings>): Promise<void> {
    if (!this.currentProfile) return;

    this.currentProfile.privacy = {
      ...this.currentProfile.privacy,
      ...privacy
    };
    this.notifyListeners();
  }

  /**
   * Follow a user
   */
  async followUser(userId: string): Promise<boolean> {
    try {
      const currentUserId = this.currentProfile?.id || 'current-user';
      const success = await BackendGamificationAPI.followUser(currentUserId, userId);
      
      if (success && this.currentProfile) {
        this.currentProfile.stats.following += 1;
        this.notifyListeners();
      }
      return success;
    } catch (error) {
      log.error(`Failed to follow user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string): Promise<boolean> {
    try {
      const currentUserId = this.currentProfile?.id || 'current-user';
      const success = await BackendGamificationAPI.unfollowUser(currentUserId, userId);
      
      if (success && this.currentProfile) {
        this.currentProfile.stats.following = Math.max(0, this.currentProfile.stats.following - 1);
        this.notifyListeners();
      }
      return success;
    } catch (error) {
      log.error(`Failed to unfollow user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if current user is following another user
   */
  async isFollowing(userId: string): Promise<boolean> {
    try {
      const currentUserId = this.currentProfile?.id || 'current-user';
      return await BackendGamificationAPI.isFollowing(currentUserId, userId);
    } catch (error) {
      log.warn('Failed to check following status:', error);
      return false;
    }
  }

  /**
   * Get followers list
   */
  async getFollowers(userId: string, page = 1, limit = 20): Promise<UserProfile[]> {
    try {
      const backendFollowers = await BackendGamificationAPI.getFollowers(userId, page, limit);
      
      if (backendFollowers.length > 0) {
        return backendFollowers.map(follower => this.mapBackendProfileToUserProfile(follower));
      }
      
      // Return empty list if no followers
      return [];
    } catch (error) {
      log.warn('Failed to get followers:', error);
      return [];
    }
  }

  /**
   * Get following list
   */
  async getFollowing(userId: string, page = 1, limit = 20): Promise<UserProfile[]> {
    try {
      const backendFollowing = await BackendGamificationAPI.getFollowing(userId, page, limit);
      
      if (backendFollowing.length > 0) {
        return backendFollowing.map(following => this.mapBackendProfileToUserProfile(following));
      }
      
      // Return empty list if not following anyone
      return [];
    } catch (error) {
      log.warn('Failed to get following:', error);
      return [];
    }
  }

  /**
   * Get user's activity history
   */
  async getActivity(userId: string, page = 1, limit = 20): Promise<ProfileActivity[]> {
    try {
      const backendActivity = await BackendGamificationAPI.getActivity(userId, page, limit);
      
      if (backendActivity.length > 0) {
        return backendActivity.map(activity => ({
          id: activity.id,
          type: activity.activity_type as ProfileActivity['type'],
          title: activity.title,
          description: activity.description,
          timestamp: new Date(activity.timestamp * 1000),
          xpEarned: activity.xp_earned,
          metadata: activity.metadata
        }));
      }
      
      // Fallback to mock activity
      return this.generateMockActivity();
    } catch (error) {
      log.warn('Failed to get activity, using mock:', error);
      return this.generateMockActivity();
    }
  }

  /**
   * Map backend social profile to UserProfile
   */
  private mapBackendProfileToUserProfile(profile: BackendSocialProfile): UserProfile {
    return {
      id: profile.user_id,
      email: '',
      username: profile.username,
      displayName: profile.display_name,
      avatar: profile.avatar,
      bio: profile.bio || '',
      role: 'user',
      tier: 'free',
      verified: false,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      stats: {
        totalXp: 0,
        level: profile.level,
        currentStreak: 0,
        longestStreak: 0,
        workflowsCreated: 0,
        workflowsShared: 0,
        templatesCreated: 0,
        templatesUsed: 0,
        automationsRun: 0,
        dataExtracted: 0,
        referralsMade: 0,
        referralsConverted: 0,
        achievementsUnlocked: 0,
        totalAchievements: 0,
        challengesCompleted: 0,
        leaderboardRank: 0,
        leaderboardPercentile: 0,
        followers: 0,
        following: 0,
        likesReceived: 0,
        likesGiven: 0
      },
      badges: [],
      socialLinks: {},
      preferences: {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          inApp: true,
          marketing: false,
          weeklyDigest: true,
          achievementAlerts: true,
          socialAlerts: true,
          teamAlerts: true
        },
        accessibility: {
          reduceMotion: false,
          highContrast: false,
          largeText: false,
          screenReader: false
        }
      },
      privacy: {
        profileVisibility: 'public',
        showActivity: true,
        showStats: true,
        showBadges: true,
        showWorkflows: true,
        allowFollowers: true,
        allowMessages: true
      }
    };
  }

  /**
   * Get level title from level number
   */
  private getLevelTitle(level: number): string {
    if (level < 5) return 'Novice';
    if (level < 10) return 'Apprentice';
    if (level < 15) return 'Journeyman';
    if (level < 20) return 'Adept';
    if (level < 30) return 'Expert';
    if (level < 40) return 'Master';
    if (level < 50) return 'Grandmaster';
    if (level < 60) return 'Legend';
    if (level < 80) return 'Mythic';
    if (level < 100) return 'Immortal';
    return 'Transcendent';
  }

  /**
   * Get leaderboard entries
   */
  async getLeaderboard(
    category: 'xp' | 'workflows' | 'referrals' | 'streak' = 'xp',
    period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly',
    page = 1,
    limit = 20
  ): Promise<LeaderboardEntry[]> {
    try {
      // Fetch from backend
      const backendEntries = await BackendGamificationAPI.getLeaderboard(category, period, limit);
      
      if (backendEntries.length > 0) {
        return backendEntries.map(entry => ({
          rank: entry.rank,
          userId: entry.user_id,
          username: entry.username,
          displayName: entry.username,
          avatar: entry.avatar,
          score: entry.score,
          level: entry.level,
          change: 0, // Backend doesn't provide change, would need separate tracking
          verified: false,
          tier: this.getTierFromLevel(entry.level)
        }));
      }
      
      // Fallback to mock data
      return this.generateMockLeaderboard(page, limit);
    } catch (error) {
      log.warn('Failed to fetch leaderboard, using mock:', error);
      return this.generateMockLeaderboard(page, limit);
    }
  }

  /**
   * Get user tier from level
   */
  private getTierFromLevel(level: number): UserTier {
    if (level >= 40) return 'enterprise';
    if (level >= 25) return 'team';
    if (level >= 15) return 'pro';
    if (level >= 5) return 'starter';
    return 'free';
  }

  /**
   * Calculate level from XP
   */
  calculateLevel(xp: number): { level: number; progress: number; nextLevelXp: number } {
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
        break;
      }
    }

    const currentLevelXp = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextLevelXp = LEVEL_THRESHOLDS[level] || currentLevelXp;
    const progress = nextLevelXp > currentLevelXp 
      ? (xp - currentLevelXp) / (nextLevelXp - currentLevelXp)
      : 1;

    return { level, progress, nextLevelXp };
  }

  /**
   * Subscribe to profile changes
   */
  subscribe(callback: (profile: UserProfile | null) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentProfile));
  }

  private async fetchProfile(userId: string): Promise<UserProfile> {
    try {
      // Try to fetch gamification stats from backend
      const actualUserId = userId === 'current' ? this.getCurrentUserId() : userId;
      const [stats, _achievements, badges, streak] = await Promise.all([
        BackendGamificationAPI.getStats(actualUserId),
        BackendGamificationAPI.getAchievements(actualUserId),
        BackendGamificationAPI.getBadges(actualUserId),
        BackendGamificationAPI.getStreak(actualUserId)
      ]);

      // Build profile with backend data where available
      const mockProfile = this.generateMockProfile(userId);
      
      if (stats) {
        mockProfile.stats.totalXp = stats.user_level.total_xp;
        mockProfile.stats.level = stats.user_level.level;
        mockProfile.stats.achievementsUnlocked = stats.achievements_unlocked;
        mockProfile.stats.totalAchievements = stats.total_achievements;
      }

      if (streak) {
        mockProfile.stats.currentStreak = streak.current_streak;
        mockProfile.stats.longestStreak = streak.longest_streak;
      }

      if (badges.length > 0) {
        mockProfile.badges = badges.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon,
          rarity: this.mapTierToRarity(b.tier),
          unlockedAt: b.earned_at ? new Date(b.earned_at) : new Date(),
          category: 'achievement' as BadgeCategory
        }));
      }

      return mockProfile;
    } catch (error) {
      log.warn('Failed to fetch profile from backend, using mock:', error);
      return this.generateMockProfile(userId);
    }
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string {
    if (typeof window === 'undefined') {
      return 'default-user';
    }
    const stored = localStorage.getItem('cube_user_id');
    return stored || 'default-user';
  }

  /**
   * Map tier string to badge rarity
   */
  private mapTierToRarity(tier: string): BadgeRarity {
    const mapping: Record<string, BadgeRarity> = {
      'bronze': 'common',
      'silver': 'uncommon',
      'gold': 'rare',
      'platinum': 'epic',
      'diamond': 'legendary'
    };
    return mapping[tier.toLowerCase()] || 'common';
  }

  private generateMockProfile(userId: string): UserProfile {
    return {
      id: userId === 'current' ? 'user-001' : userId,
      email: 'user@example.com',
      username: 'cubemaster',
      displayName: 'CUBE Master',
      avatar: undefined,
      bio: 'Building automation workflows and loving it! 🚀',
      website: 'https://cube-nexum.io',
      location: 'San Francisco, CA',
      company: 'CUBE Technologies',
      role: 'pro',
      tier: 'pro',
      verified: true,
      createdAt: new Date('2024-01-15'),
      lastActiveAt: new Date(),
      stats: {
        totalXp: 15750,
        level: 12,
        currentStreak: 15,
        longestStreak: 42,
        workflowsCreated: 28,
        workflowsShared: 12,
        templatesCreated: 5,
        templatesUsed: 156,
        automationsRun: 1247,
        dataExtracted: 50000,
        referralsMade: 8,
        referralsConverted: 5,
        achievementsUnlocked: 24,
        totalAchievements: 50,
        challengesCompleted: 18,
        leaderboardRank: 127,
        leaderboardPercentile: 95,
        followers: 234,
        following: 89,
        likesReceived: 456,
        likesGiven: 312
      },
      badges: [
        {
          id: 'badge-001',
          name: 'Early Adopter',
          description: 'Joined during beta',
          icon: '🌟',
          rarity: 'rare',
          unlockedAt: new Date('2024-01-15'),
          category: 'special'
        },
        {
          id: 'badge-002',
          name: 'Workflow Master',
          description: 'Created 25+ workflows',
          icon: '⚡',
          rarity: 'epic',
          unlockedAt: new Date('2024-06-01'),
          category: 'achievement'
        },
        {
          id: 'badge-003',
          name: 'Community Hero',
          description: 'Helped 50+ users',
          icon: '🦸',
          rarity: 'legendary',
          unlockedAt: new Date('2024-08-15'),
          category: 'community'
        }
      ],
      socialLinks: {
        twitter: 'cubemaster',
        github: 'cube-master',
        linkedin: 'cube-master'
      },
      preferences: {
        theme: 'dark',
        language: 'en',
        timezone: 'America/Los_Angeles',
        notifications: {
          email: true,
          push: true,
          inApp: true,
          marketing: false,
          weeklyDigest: true,
          achievementAlerts: true,
          socialAlerts: true,
          teamAlerts: true
        },
        accessibility: {
          reduceMotion: false,
          highContrast: false,
          largeText: false,
          screenReader: false
        }
      },
      privacy: {
        profileVisibility: 'public',
        showActivity: true,
        showStats: true,
        showBadges: true,
        showWorkflows: true,
        allowFollowers: true,
        allowMessages: true
      }
    };
  }

  private generateMockActivity(): ProfileActivity[] {
    return [
      {
        id: 'act-001',
        type: 'achievement',
        title: 'Unlocked "Workflow Master"',
        description: 'Created 25 workflows',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'act-002',
        type: 'workflow',
        title: 'Created "Data Scraper Pro"',
        description: 'New automation workflow',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        id: 'act-003',
        type: 'level_up',
        title: 'Reached Level 12',
        description: 'Earned 500 XP',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];
  }

  private generateMockLeaderboard(page: number, limit: number): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];
    const startRank = (page - 1) * limit + 1;

    for (let i = 0; i < limit; i++) {
      const rank = startRank + i;
      entries.push({
        rank,
        userId: `user-${String(rank).padStart(3, '0')}`,
        username: `user${rank}`,
        displayName: `Player ${rank}`,
        score: Math.floor(100000 / rank),
        level: Math.max(1, 50 - Math.floor(rank / 5)),
        change: Math.floor(Math.random() * 10) - 5,
        verified: rank <= 10,
        tier: rank <= 3 ? 'enterprise' : rank <= 10 ? 'team' : rank <= 50 ? 'pro' : 'free'
      });
    }

    return entries;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const userProfileService = new UserProfileService();

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook for current user profile
 */
export function useCurrentProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const data = await userProfileService.getCurrentProfile();
        if (mounted) {
          setProfile(data);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
          setLoading(false);
        }
      }
    };

    loadProfile();

    const unsubscribe = userProfileService.subscribe((updatedProfile) => {
      if (mounted) {
        setProfile(updatedProfile);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const updateProfile = useCallback(async (data: ProfileUpdateData) => {
    setLoading(true);
    try {
      const updated = await userProfileService.updateProfile(data);
      setProfile(updated);
      return updated;
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, error, updateProfile };
}

/**
 * Hook for any user profile
 */
export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const [profileData, followingStatus] = await Promise.all([
          userProfileService.getProfile(userId),
          userProfileService.isFollowing(userId)
        ]);
        if (mounted) {
          setProfile(profileData);
          setIsFollowing(followingStatus);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const follow = useCallback(async () => {
    const success = await userProfileService.followUser(userId);
    if (success) {
      setIsFollowing(true);
      if (profile) {
        setProfile({
          ...profile,
          stats: { ...profile.stats, followers: profile.stats.followers + 1 }
        });
      }
    }
    return success;
  }, [userId, profile]);

  const unfollow = useCallback(async () => {
    const success = await userProfileService.unfollowUser(userId);
    if (success) {
      setIsFollowing(false);
      if (profile) {
        setProfile({
          ...profile,
          stats: { ...profile.stats, followers: Math.max(0, profile.stats.followers - 1) }
        });
      }
    }
    return success;
  }, [userId, profile]);

  return { profile, loading, error, isFollowing, follow, unfollow };
}

/**
 * Hook for leaderboard data
 */
export function useLeaderboard(
  category: 'xp' | 'workflows' | 'referrals' | 'streak' = 'xp',
  period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly'
) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setEntries([]);
    setPage(1);
    setHasMore(true);
  }, [category, period]);

  useEffect(() => {
    let mounted = true;

    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await userProfileService.getLeaderboard(category, period, page);
        if (mounted) {
          if (page === 1) {
            setEntries(data);
          } else {
            setEntries(prev => [...prev, ...data]);
          }
          setHasMore(data.length === 20);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
          setLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      mounted = false;
    };
  }, [category, period, page]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
    }
  }, [loading, hasMore]);

  return { entries, loading, error, hasMore, loadMore };
}

/**
 * Hook for user activity
 */
export function useUserActivity(userId: string) {
  const [activities, setActivities] = useState<ProfileActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadActivity = async () => {
      setLoading(true);
      try {
        const data = await userProfileService.getActivity(userId, page);
        if (mounted) {
          if (page === 1) {
            setActivities(data);
          } else {
            setActivities(prev => [...prev, ...data]);
          }
          setHasMore(data.length === 20);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load activity');
          setLoading(false);
        }
      }
    };

    loadActivity();

    return () => {
      mounted = false;
    };
  }, [userId, page]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
    }
  }, [loading, hasMore]);

  return { activities, loading, error, hasMore, loadMore };
}
