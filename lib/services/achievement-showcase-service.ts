/**
 * CUBE Nexum - Achievements Showcase Service
 * 
 * Service for public badge/achievement display and sharing
 * Enables users to showcase accomplishments and increase virality
 * 
 * Now integrated with Tauri backend gamification commands
 */

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('AchievementShowcase');

// ============================================================================
// BACKEND INTEGRATION
// ============================================================================

interface BackendBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  earned_at?: number;
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

const BackendShowcaseAPI = {
  async getBadges(userId: string): Promise<BackendBadge[]> {
    try {
      return await invoke<BackendBadge[]>('gamification_get_badges', { userId });
    } catch (error) {
      log.warn('Backend badges fetch failed:', error);
      return [];
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

  async getStats(userId: string): Promise<{ user_level: { level: number; total_xp: number }; achievements_unlocked: number; badges_earned: number } | null> {
    try {
      return await invoke<{ user_level: { level: number; total_xp: number }; achievements_unlocked: number; badges_earned: number }>('gamification_get_stats', { userId });
    } catch (error) {
      log.warn('Backend stats fetch failed:', error);
      return null;
    }
  }
};

// ============================================================================
// TYPES
// ============================================================================

export type ShowcaseLayout = 'grid' | 'list' | 'featured' | 'timeline';
export type ShowcaseTheme = 'default' | 'dark' | 'light' | 'gradient' | 'minimal';
export type SharePlatform = 'twitter' | 'linkedin' | 'facebook' | 'copy' | 'embed';
export type BadgeSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ShowcaseBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
  category: string;
  xpValue: number;
  featured: boolean;
  shareCount: number;
  viewCount: number;
}

export interface ShowcaseStats {
  totalBadges: number;
  legendaryCount: number;
  epicCount: number;
  rareCount: number;
  uncommonCount: number;
  commonCount: number;
  totalXP: number;
  shareCount: number;
  viewCount: number;
  uniqueCategories: number;
}

export interface ShowcaseConfig {
  layout: ShowcaseLayout;
  theme: ShowcaseTheme;
  showStats: boolean;
  showTimeline: boolean;
  featuredFirst: boolean;
  maxBadges: number;
  enableSharing: boolean;
  enableEmbed: boolean;
  customTitle?: string;
  customDescription?: string;
  backgroundColor?: string;
  accentColor?: string;
}

export interface PublicShowcase {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userLevel: number;
  badges: ShowcaseBadge[];
  stats: ShowcaseStats;
  config: ShowcaseConfig;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  isPublic: boolean;
  slug: string;
  shareUrl: string;
  embedCode: string;
}

export interface ShowcaseShareResult {
  success: boolean;
  platform: SharePlatform;
  url?: string;
  error?: string;
}

export interface ShowcaseEmbedOptions {
  width: number;
  height: number;
  theme: ShowcaseTheme;
  showHeader: boolean;
  showStats: boolean;
  maxBadges: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const RARITY_CONFIG: Record<string, { color: string; bgColor: string; glow: string; points: number }> = {
  common: {
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.1)',
    glow: '0 0 10px rgba(148, 163, 184, 0.3)',
    points: 10,
  },
  uncommon: {
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    glow: '0 0 15px rgba(34, 197, 94, 0.4)',
    points: 25,
  },
  rare: {
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    glow: '0 0 20px rgba(59, 130, 246, 0.5)',
    points: 50,
  },
  epic: {
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.1)',
    glow: '0 0 25px rgba(168, 85, 247, 0.6)',
    points: 100,
  },
  legendary: {
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    glow: '0 0 30px rgba(245, 158, 11, 0.7)',
    points: 250,
  },
};

export const LAYOUT_CONFIG: Record<ShowcaseLayout, { name: string; description: string; icon: string }> = {
  grid: {
    name: 'Grid',
    description: 'Display badges in a responsive grid',
    icon: '⊞',
  },
  list: {
    name: 'List',
    description: 'Show badges in a vertical list with details',
    icon: '☰',
  },
  featured: {
    name: 'Featured',
    description: 'Highlight top badges prominently',
    icon: '⭐',
  },
  timeline: {
    name: 'Timeline',
    description: 'Show badges chronologically',
    icon: '📅',
  },
};

export const THEME_CONFIG: Record<ShowcaseTheme, { name: string; preview: string }> = {
  default: { name: 'Default', preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
  dark: { name: 'Dark', preview: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)' },
  light: { name: 'Light', preview: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' },
  gradient: { name: 'Gradient', preview: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' },
  minimal: { name: 'Minimal', preview: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)' },
};

const DEFAULT_CONFIG: ShowcaseConfig = {
  layout: 'grid',
  theme: 'default',
  showStats: true,
  showTimeline: false,
  featuredFirst: true,
  maxBadges: 50,
  enableSharing: true,
  enableEmbed: true,
};

// ============================================================================
// SHOWCASE SERVICE
// ============================================================================

class AchievementShowcaseService {
  private static instance: AchievementShowcaseService;
  private currentShowcase: PublicShowcase | null = null;
  private listeners: Set<(showcase: PublicShowcase | null) => void> = new Set();

  private constructor() {}

  static getInstance(): AchievementShowcaseService {
    if (!AchievementShowcaseService.instance) {
      AchievementShowcaseService.instance = new AchievementShowcaseService();
    }
    return AchievementShowcaseService.instance;
  }

  // ---------------------------------------------------------------------------
  // Showcase CRUD
  // ---------------------------------------------------------------------------

  async createShowcase(userId: string, config?: Partial<ShowcaseConfig>): Promise<PublicShowcase> {
    const badges = await this.fetchUserBadges(userId);
    const stats = this.calculateStats(badges);
    const slug = this.generateSlug(userId);

    // Try to get real user stats from backend
    const backendStats = await BackendShowcaseAPI.getStats(userId);
    const userLevel = backendStats?.user_level?.level || 15;
    const totalXPFromBackend = backendStats?.user_level?.total_xp;
    
    // Update stats with backend data if available
    if (totalXPFromBackend !== undefined) {
      stats.totalXP = totalXPFromBackend;
    }

    const showcase: PublicShowcase = {
      id: `showcase_${Date.now()}`,
      userId,
      userName: 'User Name', // Would come from user service
      userAvatar: '/avatars/default.png',
      userLevel,
      badges,
      stats,
      config: { ...DEFAULT_CONFIG, ...config },
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      isPublic: true,
      slug,
      shareUrl: `https://cubenexum.com/showcase/${slug}`,
      embedCode: this.generateEmbedCode(slug),
    };

    this.currentShowcase = showcase;
    this.notifyListeners();

    // Save to backend
    await this.saveShowcase(showcase);

    return showcase;
  }

  async getShowcase(_showcaseId: string): Promise<PublicShowcase | null> {
    // Simulated API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.currentShowcase);
      }, 300);
    });
  }

  async getShowcaseBySlug(slug: string): Promise<PublicShowcase | null> {
    // Simulated API call
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.currentShowcase?.slug === slug) {
          this.currentShowcase.viewCount++;
          resolve(this.currentShowcase);
        } else {
          resolve(this.createMockShowcase(slug));
        }
      }, 300);
    });
  }

  async updateShowcase(showcaseId: string, updates: Partial<PublicShowcase>): Promise<PublicShowcase | null> {
    if (!this.currentShowcase || this.currentShowcase.id !== showcaseId) {
      return null;
    }

    this.currentShowcase = {
      ...this.currentShowcase,
      ...updates,
      updatedAt: new Date(),
    };

    this.notifyListeners();
    await this.saveShowcase(this.currentShowcase);

    return this.currentShowcase;
  }

  async updateConfig(showcaseId: string, config: Partial<ShowcaseConfig>): Promise<PublicShowcase | null> {
    if (!this.currentShowcase || this.currentShowcase.id !== showcaseId) {
      return null;
    }

    this.currentShowcase.config = {
      ...this.currentShowcase.config,
      ...config,
    };
    this.currentShowcase.updatedAt = new Date();

    this.notifyListeners();
    return this.currentShowcase;
  }

  async deleteShowcase(showcaseId: string): Promise<boolean> {
    if (this.currentShowcase?.id === showcaseId) {
      this.currentShowcase = null;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Badge Management
  // ---------------------------------------------------------------------------

  async toggleFeatured(showcaseId: string, badgeId: string): Promise<boolean> {
    if (!this.currentShowcase || this.currentShowcase.id !== showcaseId) {
      return false;
    }

    const badge = this.currentShowcase.badges.find((b) => b.id === badgeId);
    if (badge) {
      badge.featured = !badge.featured;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  async reorderBadges(showcaseId: string, badgeIds: string[]): Promise<boolean> {
    if (!this.currentShowcase || this.currentShowcase.id !== showcaseId) {
      return false;
    }

    const orderedBadges: ShowcaseBadge[] = [];
    badgeIds.forEach((id) => {
      const badge = this.currentShowcase!.badges.find((b) => b.id === id);
      if (badge) orderedBadges.push(badge);
    });

    this.currentShowcase.badges = orderedBadges;
    this.notifyListeners();
    return true;
  }

  // ---------------------------------------------------------------------------
  // Sharing
  // ---------------------------------------------------------------------------

  async shareShowcase(showcaseId: string, platform: SharePlatform): Promise<ShowcaseShareResult> {
    if (!this.currentShowcase || this.currentShowcase.id !== showcaseId) {
      return { success: false, platform, error: 'Showcase not found' };
    }

    const { shareUrl, stats } = this.currentShowcase;
    const text = `Check out my achievements on CUBE Nexum! 🏆 ${stats.totalBadges} badges earned, ${stats.totalXP.toLocaleString()} XP total.`;

    let url = '';

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        this.currentShowcase.stats.shareCount++;
        this.notifyListeners();
        return { success: true, platform, url: shareUrl };
      case 'embed':
        await navigator.clipboard.writeText(this.currentShowcase.embedCode);
        this.currentShowcase.stats.shareCount++;
        this.notifyListeners();
        return { success: true, platform, url: this.currentShowcase.embedCode };
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }

    // Track share
    this.currentShowcase.stats.shareCount++;
    this.notifyListeners();

    return { success: true, platform, url };
  }

  generateEmbedCode(slug: string, options?: Partial<ShowcaseEmbedOptions>): string {
    const opts: ShowcaseEmbedOptions = {
      width: options?.width || 600,
      height: options?.height || 400,
      theme: options?.theme || 'default',
      showHeader: options?.showHeader !== false,
      showStats: options?.showStats !== false,
      maxBadges: options?.maxBadges || 12,
    };

    return `<iframe 
  src="https://cubenexum.com/embed/showcase/${slug}?theme=${opts.theme}&header=${opts.showHeader}&stats=${opts.showStats}&max=${opts.maxBadges}" 
  width="${opts.width}" 
  height="${opts.height}" 
  frameborder="0" 
  allow="clipboard-write"
  title="CUBE Nexum Achievement Showcase"
></iframe>`;
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  async trackView(showcaseId: string): Promise<void> {
    if (this.currentShowcase?.id === showcaseId) {
      this.currentShowcase.viewCount++;
      this.notifyListeners();
    }
  }

  async getAnalytics(_showcaseId: string): Promise<{
    views: { date: string; count: number }[];
    shares: { platform: string; count: number }[];
    topBadges: { badge: ShowcaseBadge; views: number }[];
  }> {
    // Simulated analytics data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50) + 10,
      };
    });

    return {
      views: last7Days,
      shares: [
        { platform: 'twitter', count: 45 },
        { platform: 'linkedin', count: 28 },
        { platform: 'facebook', count: 15 },
        { platform: 'copy', count: 67 },
      ],
      topBadges: (this.currentShowcase?.badges || [])
        .slice(0, 5)
        .map((badge) => ({ badge, views: Math.floor(Math.random() * 100) + 20 })),
    };
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private async fetchUserBadges(userId: string): Promise<ShowcaseBadge[]> {
    // First try to fetch from backend
    const backendBadges = await BackendShowcaseAPI.getBadges(userId);
    const backendAchievements = await BackendShowcaseAPI.getAchievements(userId);
    
    // Convert backend badges to ShowcaseBadge format
    if (backendBadges.length > 0 || backendAchievements.length > 0) {
      const showcaseBadges: ShowcaseBadge[] = [];
      
      // Convert backend badges
      backendBadges.forEach((badge, index) => {
        const rarity = this.mapTierToRarity(badge.tier);
        showcaseBadges.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon || this.getDefaultIcon(index),
          rarity,
          earnedAt: badge.earned_at ? new Date(badge.earned_at) : new Date(),
          category: 'Badge',
          xpValue: RARITY_CONFIG[rarity].points,
          featured: index < 3,
          shareCount: 0,
          viewCount: 0,
        });
      });
      
      // Convert backend achievements (only unlocked ones)
      backendAchievements
        .filter((ach) => ach.unlocked)
        .forEach((ach, index) => {
          const rarity = (ach.rarity as ShowcaseBadge['rarity']) || 'common';
          showcaseBadges.push({
            id: ach.id,
            name: ach.name,
            description: ach.description,
            icon: ach.icon || this.getDefaultIcon(index + backendBadges.length),
            rarity,
            earnedAt: ach.unlocked_at ? new Date(ach.unlocked_at) : new Date(),
            category: ach.category || 'Achievement',
            xpValue: ach.xp_reward || RARITY_CONFIG[rarity].points,
            featured: false,
            shareCount: 0,
            viewCount: 0,
          });
        });
      
      if (showcaseBadges.length > 0) {
        // Sort by rarity (legendary first) then by date
        return showcaseBadges.sort((a, b) => {
          const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
          const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
          if (rarityDiff !== 0) return rarityDiff;
          return b.earnedAt.getTime() - a.earnedAt.getTime();
        });
      }
    }
    
    // Fallback to mock badges if backend returns nothing
    const categories = ['Automation', 'Security', 'Social', 'Learning', 'Achievement'];
    const rarities: ShowcaseBadge['rarity'][] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

    return Array.from({ length: 25 }, (_, i) => {
      const rarity = rarities[Math.floor(Math.random() * rarities.length)];
      const earnedAt = new Date();
      earnedAt.setDate(earnedAt.getDate() - Math.floor(Math.random() * 90));

      return {
        id: `badge_${i + 1}`,
        name: `Achievement ${i + 1}`,
        description: `Earned by completing milestone ${i + 1}`,
        icon: this.getDefaultIcon(i),
        rarity,
        earnedAt,
        category: categories[Math.floor(Math.random() * categories.length)],
        xpValue: RARITY_CONFIG[rarity].points,
        featured: i < 3,
        shareCount: Math.floor(Math.random() * 20),
        viewCount: Math.floor(Math.random() * 100),
      };
    });
  }

  private mapTierToRarity(tier: string): ShowcaseBadge['rarity'] {
    const tierMap: Record<string, ShowcaseBadge['rarity']> = {
      bronze: 'common',
      silver: 'uncommon',
      gold: 'rare',
      platinum: 'epic',
      diamond: 'legendary',
      legendary: 'legendary',
      epic: 'epic',
      rare: 'rare',
      uncommon: 'uncommon',
      common: 'common',
    };
    return tierMap[tier.toLowerCase()] || 'common';
  }

  private getDefaultIcon(index: number): string {
    const icons = ['🏆', '⭐', '🎯', '🚀', '💎', '🔥', '⚡', '🌟'];
    return icons[index % icons.length];
  }

  private calculateStats(badges: ShowcaseBadge[]): ShowcaseStats {
    const stats: ShowcaseStats = {
      totalBadges: badges.length,
      legendaryCount: 0,
      epicCount: 0,
      rareCount: 0,
      uncommonCount: 0,
      commonCount: 0,
      totalXP: 0,
      shareCount: 0,
      viewCount: 0,
      uniqueCategories: new Set(badges.map((b) => b.category)).size,
    };

    badges.forEach((badge) => {
      stats.totalXP += badge.xpValue;
      stats.shareCount += badge.shareCount;
      stats.viewCount += badge.viewCount;

      switch (badge.rarity) {
        case 'legendary':
          stats.legendaryCount++;
          break;
        case 'epic':
          stats.epicCount++;
          break;
        case 'rare':
          stats.rareCount++;
          break;
        case 'uncommon':
          stats.uncommonCount++;
          break;
        case 'common':
          stats.commonCount++;
          break;
      }
    });

    return stats;
  }

  private generateSlug(userId: string): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const random = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${userId.slice(0, 6)}-${random}`;
  }

  private createMockShowcase(slug: string): PublicShowcase {
    const badges = Array.from({ length: 15 }, (_, i) => ({
      id: `badge_${i}`,
      name: `Badge ${i + 1}`,
      description: `Achievement description ${i + 1}`,
      icon: ['🏆', '⭐', '🎯', '🚀', '💎'][i % 5],
      rarity: (['common', 'uncommon', 'rare', 'epic', 'legendary'] as const)[Math.floor(Math.random() * 5)],
      earnedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      category: 'General',
      xpValue: Math.floor(Math.random() * 100) + 10,
      featured: i < 3,
      shareCount: Math.floor(Math.random() * 20),
      viewCount: Math.floor(Math.random() * 100),
    }));

    return {
      id: `showcase_${slug}`,
      userId: 'user_123',
      userName: 'Demo User',
      userAvatar: '/avatars/default.png',
      userLevel: 10,
      badges,
      stats: this.calculateStats(badges),
      config: DEFAULT_CONFIG,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: Math.floor(Math.random() * 500),
      isPublic: true,
      slug,
      shareUrl: `https://cubenexum.com/showcase/${slug}`,
      embedCode: this.generateEmbedCode(slug),
    };
  }

  private async saveShowcase(showcase: PublicShowcase): Promise<void> {
    // Would save to backend
    log.debug('Saving showcase:', showcase.id);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentShowcase));
  }

  subscribe(listener: (showcase: PublicShowcase | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const achievementShowcaseService = AchievementShowcaseService.getInstance();

// ============================================================================
// REACT HOOKS
// ============================================================================

export function useShowcase(showcaseId?: string) {
  const [showcase, setShowcase] = useState<PublicShowcase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showcaseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    achievementShowcaseService
      .getShowcase(showcaseId)
      .then(setShowcase)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    return achievementShowcaseService.subscribe(setShowcase);
  }, [showcaseId]);

  const updateConfig = useCallback(
    async (config: Partial<ShowcaseConfig>) => {
      if (!showcaseId) return;
      await achievementShowcaseService.updateConfig(showcaseId, config);
    },
    [showcaseId]
  );

  const toggleFeatured = useCallback(
    async (badgeId: string) => {
      if (!showcaseId) return;
      await achievementShowcaseService.toggleFeatured(showcaseId, badgeId);
    },
    [showcaseId]
  );

  const share = useCallback(
    async (platform: SharePlatform) => {
      if (!showcaseId) return null;
      return achievementShowcaseService.shareShowcase(showcaseId, platform);
    },
    [showcaseId]
  );

  return {
    showcase,
    loading,
    error,
    updateConfig,
    toggleFeatured,
    share,
  };
}

export function usePublicShowcase(slug: string) {
  const [showcase, setShowcase] = useState<PublicShowcase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    achievementShowcaseService
      .getShowcaseBySlug(slug)
      .then((data) => {
        setShowcase(data);
        if (data) {
          achievementShowcaseService.trackView(data.id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return { showcase, loading, error };
}

export function useCreateShowcase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (userId: string, config?: Partial<ShowcaseConfig>) => {
    setLoading(true);
    setError(null);
    try {
      const showcase = await achievementShowcaseService.createShowcase(userId, config);
      return showcase;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create showcase');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

export function useShowcaseAnalytics(showcaseId?: string) {
  const [analytics, setAnalytics] = useState<{
    views: { date: string; count: number }[];
    shares: { platform: string; count: number }[];
    topBadges: { badge: ShowcaseBadge; views: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showcaseId) return;

    setLoading(true);
    achievementShowcaseService
      .getAnalytics(showcaseId)
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, [showcaseId]);

  return { analytics, loading };
}
