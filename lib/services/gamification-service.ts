/**
 * CUBE Nexum - Enterprise Gamification Service
 * 
 * Complete gamification system for viral growth:
 * - Achievements & Badges
 * - XP & Leveling System
 * - Daily Streaks
 * - Leaderboards
 * - Challenges & Missions
 * - Rewards & Unlockables
 * - Social Recognition
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Gamification');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type AchievementCategory = 
  | 'getting_started'
  | 'power_user'
  | 'security_master'
  | 'automation_guru'
  | 'social_butterfly'
  | 'speed_demon'
  | 'data_wizard'
  | 'ai_pioneer'
  | 'explorer'
  | 'collector'
  | 'streak_master'
  | 'community_hero';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  isSecret: boolean;
  tier: number; // 1-5 for tiered achievements
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: number;
  displayOrder: number;
}

export interface UserLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  title: string;
  perks: string[];
}

export interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  streakProtects: number;
  nextMilestone: number;
  milestoneReward: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  xpReward: number;
  progress: number;
  maxProgress: number;
  expiresAt: number;
  completed: boolean;
  claimed: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  level: number;
  badge?: Badge;
  isCurrentUser: boolean;
  trend: 'up' | 'down' | 'same';
  trendValue: number;
}

export interface Leaderboard {
  type: 'daily' | 'weekly' | 'monthly' | 'allTime';
  category: string;
  entries: LeaderboardEntry[];
  userRank?: number;
  totalParticipants: number;
  lastUpdated: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'theme' | 'feature' | 'badge' | 'title' | 'discount' | 'premium_days';
  cost: number;
  costType: 'xp' | 'coins' | 'tokens';
  icon: string;
  rarity: AchievementRarity;
  available: boolean;
  owned: boolean;
  expiresAt?: number;
}

export interface GamificationStats {
  totalXP: number;
  level: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  currentStreak: number;
  longestStreak: number;
  challengesCompleted: number;
  globalRank: number;
  weeklyRank: number;
  coins: number;
  tokens: number;
}

export interface XPGain {
  amount: number;
  source: string;
  multiplier: number;
  bonusReason?: string;
  timestamp: number;
}

export interface LevelUpReward {
  level: number;
  title: string;
  rewards: {
    type: string;
    value: string | number;
    description: string;
  }[];
  newPerks: string[];
}

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
  // Getting Started
  {
    id: 'first_login',
    name: 'Welcome Aboard',
    description: 'Log in to CUBE Nexum for the first time',
    icon: '👋',
    category: 'getting_started',
    rarity: 'common',
    xpReward: 50,
    maxProgress: 1,
    isSecret: false,
    tier: 1,
  },
  {
    id: 'complete_onboarding',
    name: 'Quick Learner',
    description: 'Complete the onboarding tutorial',
    icon: '🎓',
    category: 'getting_started',
    rarity: 'common',
    xpReward: 100,
    maxProgress: 1,
    isSecret: false,
    tier: 1,
  },
  {
    id: 'first_autofill',
    name: 'Form Ninja',
    description: 'Use autofill for the first time',
    icon: '⚡',
    category: 'getting_started',
    rarity: 'common',
    xpReward: 75,
    maxProgress: 1,
    isSecret: false,
    tier: 1,
  },
  {
    id: 'first_workflow',
    name: 'Automation Apprentice',
    description: 'Create your first automation workflow',
    icon: '🤖',
    category: 'getting_started',
    rarity: 'common',
    xpReward: 100,
    maxProgress: 1,
    isSecret: false,
    tier: 1,
  },
  {
    id: 'connect_account',
    name: 'Connected',
    description: 'Connect an external account or service',
    icon: '🔗',
    category: 'getting_started',
    rarity: 'common',
    xpReward: 75,
    maxProgress: 1,
    isSecret: false,
    tier: 1,
  },

  // Power User
  {
    id: 'autofill_100',
    name: 'Autofill Addict',
    description: 'Use autofill 100 times',
    icon: '🏃',
    category: 'power_user',
    rarity: 'uncommon',
    xpReward: 250,
    maxProgress: 100,
    isSecret: false,
    tier: 2,
  },
  {
    id: 'autofill_1000',
    name: 'Autofill Master',
    description: 'Use autofill 1,000 times',
    icon: '🚀',
    category: 'power_user',
    rarity: 'rare',
    xpReward: 500,
    maxProgress: 1000,
    isSecret: false,
    tier: 3,
  },
  {
    id: 'autofill_10000',
    name: 'Autofill Legend',
    description: 'Use autofill 10,000 times',
    icon: '👑',
    category: 'power_user',
    rarity: 'legendary',
    xpReward: 2000,
    maxProgress: 10000,
    isSecret: false,
    tier: 5,
  },
  {
    id: 'workflows_10',
    name: 'Workflow Wizard',
    description: 'Create 10 automation workflows',
    icon: '🧙',
    category: 'power_user',
    rarity: 'uncommon',
    xpReward: 300,
    maxProgress: 10,
    isSecret: false,
    tier: 2,
  },
  {
    id: 'workflows_50',
    name: 'Automation Architect',
    description: 'Create 50 automation workflows',
    icon: '🏗️',
    category: 'power_user',
    rarity: 'epic',
    xpReward: 1000,
    maxProgress: 50,
    isSecret: false,
    tier: 4,
  },
  {
    id: 'keyboard_shortcuts',
    name: 'Keyboard Warrior',
    description: 'Use 50 different keyboard shortcuts',
    icon: '⌨️',
    category: 'power_user',
    rarity: 'rare',
    xpReward: 400,
    maxProgress: 50,
    isSecret: false,
    tier: 3,
  },
  {
    id: 'time_saved_1h',
    name: 'Time Saver',
    description: 'Save 1 hour of time with CUBE',
    icon: '⏱️',
    category: 'power_user',
    rarity: 'uncommon',
    xpReward: 200,
    maxProgress: 60,
    isSecret: false,
    tier: 2,
  },
  {
    id: 'time_saved_100h',
    name: 'Productivity God',
    description: 'Save 100 hours of time with CUBE',
    icon: '🦸',
    category: 'power_user',
    rarity: 'legendary',
    xpReward: 3000,
    maxProgress: 6000,
    isSecret: false,
    tier: 5,
  },

  // Security Master
  {
    id: 'strong_passwords',
    name: 'Password Guardian',
    description: 'Generate 10 strong passwords',
    icon: '🔐',
    category: 'security_master',
    rarity: 'uncommon',
    xpReward: 200,
    maxProgress: 10,
    isSecret: false,
    tier: 2,
  },
  {
    id: 'enable_2fa',
    name: '2FA Champion',
    description: 'Enable two-factor authentication',
    icon: '🛡️',
    category: 'security_master',
    rarity: 'uncommon',
    xpReward: 150,
    maxProgress: 1,
    isSecret: false,
    tier: 2,
  },
  {
    id: 'security_audit',
    name: 'Security Auditor',
    description: 'Run a complete security audit',
    icon: '🔍',
    category: 'security_master',
    rarity: 'rare',
    xpReward: 350,
    maxProgress: 1,
    isSecret: false,
    tier: 3,
  },
  {
    id: 'breach_check',
    name: 'Breach Hunter',
    description: 'Check 50 accounts for breaches',
    icon: '🕵️',
    category: 'security_master',
    rarity: 'rare',
    xpReward: 400,
    maxProgress: 50,
    isSecret: false,
    tier: 3,
  },
  {
    id: 'vpn_100h',
    name: 'Privacy Protector',
    description: 'Use VPN for 100 hours',
    icon: '🔒',
    category: 'security_master',
    rarity: 'epic',
    xpReward: 750,
    maxProgress: 100,
    isSecret: false,
    tier: 4,
  },

  // AI Pioneer
  {
    id: 'ai_first_chat',
    name: 'AI Explorer',
    description: 'Have your first conversation with CUBE AI',
    icon: '🤖',
    category: 'ai_pioneer',
    rarity: 'common',
    xpReward: 100,
    maxProgress: 1,
    isSecret: false,
    tier: 1,
  },
  {
    id: 'ai_100_prompts',
    name: 'Prompt Engineer',
    description: 'Send 100 prompts to AI assistant',
    icon: '💬',
    category: 'ai_pioneer',
    rarity: 'uncommon',
    xpReward: 300,
    maxProgress: 100,
    isSecret: false,
    tier: 2,
  },
  {
    id: 'ai_workflow_gen',
    name: 'AI Workflow Creator',
    description: 'Generate 10 workflows using AI',
    icon: '🧠',
    category: 'ai_pioneer',
    rarity: 'rare',
    xpReward: 500,
    maxProgress: 10,
    isSecret: false,
    tier: 3,
  },
  {
    id: 'ai_code_gen',
    name: 'Code Conjurer',
    description: 'Generate code with AI 50 times',
    icon: '👨‍💻',
    category: 'ai_pioneer',
    rarity: 'epic',
    xpReward: 800,
    maxProgress: 50,
    isSecret: false,
    tier: 4,
  },

  // Social Butterfly
  {
    id: 'first_referral',
    name: 'Friend Finder',
    description: 'Refer your first friend to CUBE',
    icon: '👥',
    category: 'social_butterfly',
    rarity: 'uncommon',
    xpReward: 500,
    maxProgress: 1,
    isSecret: false,
    tier: 2,
  },
  {
    id: 'referrals_10',
    name: 'Social Star',
    description: 'Refer 10 friends to CUBE',
    icon: '⭐',
    category: 'social_butterfly',
    rarity: 'rare',
    xpReward: 1000,
    maxProgress: 10,
    isSecret: false,
    tier: 3,
  },
  {
    id: 'referrals_50',
    name: 'Community Champion',
    description: 'Refer 50 friends to CUBE',
    icon: '🏆',
    category: 'social_butterfly',
    rarity: 'epic',
    xpReward: 2500,
    maxProgress: 50,
    isSecret: false,
    tier: 4,
  },
  {
    id: 'referrals_100',
    name: 'CUBE Ambassador',
    description: 'Refer 100 friends to CUBE',
    icon: '🌟',
    category: 'social_butterfly',
    rarity: 'legendary',
    xpReward: 5000,
    maxProgress: 100,
    isSecret: false,
    tier: 5,
  },
  {
    id: 'share_workflow',
    name: 'Workflow Sharer',
    description: 'Share a workflow with the community',
    icon: '📤',
    category: 'social_butterfly',
    rarity: 'uncommon',
    xpReward: 200,
    maxProgress: 1,
    isSecret: false,
    tier: 2,
  },
  {
    id: 'help_others',
    name: 'Helper Hero',
    description: 'Help 10 users in the community',
    icon: '🦸‍♂️',
    category: 'social_butterfly',
    rarity: 'rare',
    xpReward: 600,
    maxProgress: 10,
    isSecret: false,
    tier: 3,
  },

  // Streak Master
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak_master',
    rarity: 'uncommon',
    xpReward: 200,
    maxProgress: 7,
    isSecret: false,
    tier: 2,
  },
  {
    id: 'streak_30',
    name: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '🔥🔥',
    category: 'streak_master',
    rarity: 'rare',
    xpReward: 500,
    maxProgress: 30,
    isSecret: false,
    tier: 3,
  },
  {
    id: 'streak_100',
    name: 'Century Streaker',
    description: 'Maintain a 100-day streak',
    icon: '💯',
    category: 'streak_master',
    rarity: 'epic',
    xpReward: 1500,
    maxProgress: 100,
    isSecret: false,
    tier: 4,
  },
  {
    id: 'streak_365',
    name: 'Year of Dedication',
    description: 'Maintain a 365-day streak',
    icon: '🏅',
    category: 'streak_master',
    rarity: 'legendary',
    xpReward: 5000,
    maxProgress: 365,
    isSecret: false,
    tier: 5,
  },

  // Explorer
  {
    id: 'use_all_features',
    name: 'Feature Explorer',
    description: 'Try every major feature in CUBE',
    icon: '🗺️',
    category: 'explorer',
    rarity: 'rare',
    xpReward: 750,
    maxProgress: 20,
    isSecret: false,
    tier: 3,
  },
  {
    id: 'visit_all_pages',
    name: 'Page Pioneer',
    description: 'Visit every page in CUBE',
    icon: '🧭',
    category: 'explorer',
    rarity: 'uncommon',
    xpReward: 250,
    maxProgress: 30,
    isSecret: false,
    tier: 2,
  },
  {
    id: 'customize_theme',
    name: 'Style Master',
    description: 'Customize your CUBE theme',
    icon: '🎨',
    category: 'explorer',
    rarity: 'common',
    xpReward: 100,
    maxProgress: 1,
    isSecret: false,
    tier: 1,
  },

  // Secret Achievements
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Use CUBE between 2 AM and 5 AM',
    icon: '🦉',
    category: 'explorer',
    rarity: 'rare',
    xpReward: 300,
    maxProgress: 1,
    isSecret: true,
    tier: 3,
  },
  {
    id: 'konami_code',
    name: 'Konami Master',
    description: '↑↑↓↓←→←→BA',
    icon: '🎮',
    category: 'explorer',
    rarity: 'epic',
    xpReward: 1000,
    maxProgress: 1,
    isSecret: true,
    tier: 4,
  },
  {
    id: 'speed_run',
    name: 'Speed Runner',
    description: 'Complete 10 autofills in under 60 seconds',
    icon: '⚡',
    category: 'speed_demon',
    rarity: 'epic',
    xpReward: 750,
    maxProgress: 1,
    isSecret: true,
    tier: 4,
  },
  {
    id: 'million_clicks',
    name: 'Click Master',
    description: 'Reach 1,000,000 clicks in CUBE',
    icon: '🖱️',
    category: 'power_user',
    rarity: 'legendary',
    xpReward: 10000,
    maxProgress: 1000000,
    isSecret: true,
    tier: 5,
  },
];

// ============================================================================
// LEVEL SYSTEM
// ============================================================================

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Newcomer',
  5: 'Explorer',
  10: 'Enthusiast',
  15: 'Practitioner',
  20: 'Expert',
  25: 'Specialist',
  30: 'Master',
  35: 'Grandmaster',
  40: 'Legend',
  45: 'Mythic',
  50: 'Transcendent',
  60: 'Immortal',
  70: 'Cosmic',
  80: 'Eternal',
  90: 'Ultimate',
  100: 'CUBE God',
};

export const LEVEL_PERKS: Record<number, string[]> = {
  5: ['Custom avatar border'],
  10: ['Profile badge display', 'Extended automation limits'],
  15: ['Priority support access'],
  20: ['Custom themes unlock', 'Advanced analytics'],
  25: ['Beta features access'],
  30: ['Community moderator eligibility', 'Exclusive badge'],
  40: ['VIP Discord channel access'],
  50: ['Lifetime achievement badge', 'Featured profile'],
  75: ['CUBE Hall of Fame'],
  100: ['Custom CUBE feature request', 'Eternal recognition'],
};

function calculateXPForLevel(level: number): number {
  // Progressive XP curve: each level requires more XP
  return Math.floor(100 * Math.pow(level, 1.5));
}

function getLevelFromXP(totalXP: number): { level: number; currentXP: number; xpToNext: number } {
  let level = 1;
  let xpRequired = calculateXPForLevel(level);
  let xpAccumulated = 0;

  while (xpAccumulated + xpRequired <= totalXP && level < 100) {
    xpAccumulated += xpRequired;
    level++;
    xpRequired = calculateXPForLevel(level);
  }

  return {
    level,
    currentXP: totalXP - xpAccumulated,
    xpToNext: xpRequired,
  };
}

function getTitleForLevel(level: number): string {
  const levels = Object.keys(LEVEL_TITLES)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const lvl of levels) {
    if (level >= lvl) {
      return LEVEL_TITLES[lvl];
    }
  }
  return 'Newcomer';
}

function getPerksForLevel(level: number): string[] {
  const perks: string[] = [];
  const levels = Object.keys(LEVEL_PERKS).map(Number).sort((a, b) => a - b);
  
  for (const lvl of levels) {
    if (level >= lvl) {
      perks.push(...LEVEL_PERKS[lvl]);
    }
  }
  return perks;
}

// ============================================================================
// GAMIFICATION SERVICE
// ============================================================================

export const GamificationService = {
  // -------------------------------------------------------------------------
  // User Stats
  // -------------------------------------------------------------------------

  /**
   * Get user's gamification stats
   */
  getStats: async (): Promise<GamificationStats> => {
    try {
      return await invoke<GamificationStats>('gamification_get_stats');
    } catch {
      // Return default stats if backend not available
      return {
        totalXP: 0,
        level: 1,
        achievementsUnlocked: 0,
        totalAchievements: ACHIEVEMENT_DEFINITIONS.length,
        currentStreak: 0,
        longestStreak: 0,
        challengesCompleted: 0,
        globalRank: 0,
        weeklyRank: 0,
        coins: 0,
        tokens: 0,
      };
    }
  },

  /**
   * Get user's level info
   */
  getLevel: async (): Promise<UserLevel> => {
    try {
      return await invoke<UserLevel>('gamification_get_level');
    } catch {
      const stats = await GamificationService.getStats();
      const { level, currentXP, xpToNext } = getLevelFromXP(stats.totalXP);
      return {
        level,
        currentXP,
        xpToNextLevel: xpToNext,
        totalXP: stats.totalXP,
        title: getTitleForLevel(level),
        perks: getPerksForLevel(level),
      };
    }
  },

  // -------------------------------------------------------------------------
  // XP System
  // -------------------------------------------------------------------------

  /**
   * Award XP to user
   */
  awardXP: async (amount: number, source: string): Promise<XPGain> => {
    try {
      return await invoke<XPGain>('gamification_award_xp', { amount, source });
    } catch {
      const multiplier = await GamificationService.getActiveMultiplier();
      return {
        amount: Math.floor(amount * multiplier),
        source,
        multiplier,
        timestamp: Date.now(),
      };
    }
  },

  /**
   * Get active XP multiplier (streaks, events, etc.)
   */
  getActiveMultiplier: async (): Promise<number> => {
    try {
      return await invoke<number>('gamification_get_multiplier');
    } catch {
      const streak = await GamificationService.getStreak();
      // Streak bonus: +10% per 7-day milestone, max 50%
      const streakBonus = Math.min(0.5, Math.floor(streak.currentStreak / 7) * 0.1);
      return 1 + streakBonus;
    }
  },

  /**
   * Get recent XP gains
   */
  getXPHistory: async (limit: number = 20): Promise<XPGain[]> => {
    try {
      return await invoke<XPGain[]>('gamification_get_xp_history', { limit });
    } catch {
      return [];
    }
  },

  // -------------------------------------------------------------------------
  // Achievements
  // -------------------------------------------------------------------------

  /**
   * Get all achievements with user progress
   */
  getAchievements: async (): Promise<Achievement[]> => {
    try {
      return await invoke<Achievement[]>('gamification_get_achievements');
    } catch {
      // Return definitions with default progress
      return ACHIEVEMENT_DEFINITIONS.map(def => ({
        ...def,
        progress: 0,
        unlockedAt: undefined,
      }));
    }
  },

  /**
   * Get achievements by category
   */
  getAchievementsByCategory: async (category: AchievementCategory): Promise<Achievement[]> => {
    const all = await GamificationService.getAchievements();
    return all.filter(a => a.category === category);
  },

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements: async (): Promise<Achievement[]> => {
    const all = await GamificationService.getAchievements();
    return all.filter(a => a.unlockedAt !== undefined);
  },

  /**
   * Update achievement progress
   */
  updateProgress: async (
    achievementId: string, 
    progress: number
  ): Promise<{ achievement: Achievement; levelUp?: LevelUpReward }> => {
    try {
      return await invoke('gamification_update_progress', { achievementId, progress });
    } catch {
      const achievements = await GamificationService.getAchievements();
      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement) {
        throw new Error('Achievement not found');
      }
      return { achievement };
    }
  },

  /**
   * Check if achievement should be unlocked
   */
  checkAchievement: async (achievementId: string): Promise<boolean> => {
    try {
      return await invoke<boolean>('gamification_check_achievement', { achievementId });
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // Streaks
  // -------------------------------------------------------------------------

  /**
   * Get current streak info
   */
  getStreak: async (): Promise<DailyStreak> => {
    try {
      return await invoke<DailyStreak>('gamification_get_streak');
    } catch {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: '',
        streakProtects: 0,
        nextMilestone: 7,
        milestoneReward: '200 XP + Badge',
      };
    }
  },

  /**
   * Record daily activity to maintain streak
   */
  recordDailyActivity: async (): Promise<DailyStreak> => {
    try {
      return await invoke<DailyStreak>('gamification_record_activity');
    } catch {
      return GamificationService.getStreak();
    }
  },

  /**
   * Use streak protect (prevents streak loss)
   */
  useStreakProtect: async (): Promise<boolean> => {
    try {
      return await invoke<boolean>('gamification_use_streak_protect');
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // Challenges
  // -------------------------------------------------------------------------

  /**
   * Get active challenges
   */
  getChallenges: async (): Promise<Challenge[]> => {
    try {
      return await invoke<Challenge[]>('gamification_get_challenges');
    } catch {
      // Return sample challenges
      const now = Date.now();
      return [
        {
          id: 'daily_1',
          name: 'Speed Demon',
          description: 'Complete 5 autofills today',
          type: 'daily',
          xpReward: 100,
          progress: 0,
          maxProgress: 5,
          expiresAt: now + 24 * 60 * 60 * 1000,
          completed: false,
          claimed: false,
          difficulty: 'easy',
        },
        {
          id: 'daily_2',
          name: 'AI Helper',
          description: 'Use AI assistant 3 times',
          type: 'daily',
          xpReward: 150,
          progress: 0,
          maxProgress: 3,
          expiresAt: now + 24 * 60 * 60 * 1000,
          completed: false,
          claimed: false,
          difficulty: 'easy',
        },
        {
          id: 'weekly_1',
          name: 'Workflow Master',
          description: 'Create 5 new workflows this week',
          type: 'weekly',
          xpReward: 500,
          progress: 0,
          maxProgress: 5,
          expiresAt: now + 7 * 24 * 60 * 60 * 1000,
          completed: false,
          claimed: false,
          difficulty: 'medium',
        },
        {
          id: 'weekly_2',
          name: 'Security Week',
          description: 'Generate 10 strong passwords',
          type: 'weekly',
          xpReward: 400,
          progress: 0,
          maxProgress: 10,
          expiresAt: now + 7 * 24 * 60 * 60 * 1000,
          completed: false,
          claimed: false,
          difficulty: 'medium',
        },
        {
          id: 'monthly_1',
          name: 'Community Builder',
          description: 'Refer 5 friends this month',
          type: 'monthly',
          xpReward: 2000,
          progress: 0,
          maxProgress: 5,
          expiresAt: now + 30 * 24 * 60 * 60 * 1000,
          completed: false,
          claimed: false,
          difficulty: 'hard',
        },
      ];
    }
  },

  /**
   * Update challenge progress
   */
  updateChallengeProgress: async (
    challengeId: string, 
    progress: number
  ): Promise<Challenge> => {
    try {
      return await invoke<Challenge>('gamification_update_challenge', { challengeId, progress });
    } catch {
      const challenges = await GamificationService.getChallenges();
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }
      return { ...challenge, progress };
    }
  },

  /**
   * Claim challenge reward
   */
  claimChallengeReward: async (challengeId: string): Promise<XPGain> => {
    try {
      return await invoke<XPGain>('gamification_claim_challenge', { challengeId });
    } catch {
      throw new Error('Failed to claim reward');
    }
  },

  // -------------------------------------------------------------------------
  // Leaderboards
  // -------------------------------------------------------------------------

  /**
   * Get leaderboard
   */
  getLeaderboard: async (
    type: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly',
    category: string = 'xp',
    limit: number = 100
  ): Promise<Leaderboard> => {
    try {
      return await invoke<Leaderboard>('gamification_get_leaderboard', { type, category, limit });
    } catch {
      return {
        type,
        category,
        entries: [],
        totalParticipants: 0,
        lastUpdated: Date.now(),
      };
    }
  },

  /**
   * Get user's rank on leaderboard
   */
  getUserRank: async (
    type: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly'
  ): Promise<LeaderboardEntry | null> => {
    try {
      return await invoke<LeaderboardEntry | null>('gamification_get_user_rank', { type });
    } catch {
      return null;
    }
  },

  // -------------------------------------------------------------------------
  // Rewards & Shop
  // -------------------------------------------------------------------------

  /**
   * Get available rewards
   */
  getRewards: async (): Promise<Reward[]> => {
    try {
      return await invoke<Reward[]>('gamification_get_rewards');
    } catch {
      return [
        {
          id: 'theme_dark_pro',
          name: 'Dark Pro Theme',
          description: 'Exclusive dark theme with purple accents',
          type: 'theme',
          cost: 1000,
          costType: 'xp',
          icon: '🎨',
          rarity: 'uncommon',
          available: true,
          owned: false,
        },
        {
          id: 'badge_early_adopter',
          name: 'Early Adopter Badge',
          description: 'Show your OG status',
          type: 'badge',
          cost: 500,
          costType: 'xp',
          icon: '🌟',
          rarity: 'rare',
          available: true,
          owned: false,
        },
        {
          id: 'title_custom',
          name: 'Custom Title',
          description: 'Create your own profile title',
          type: 'title',
          cost: 5000,
          costType: 'xp',
          icon: '✨',
          rarity: 'epic',
          available: true,
          owned: false,
        },
        {
          id: 'premium_7days',
          name: '7 Days Premium',
          description: 'One week of premium features',
          type: 'premium_days',
          cost: 2000,
          costType: 'coins',
          icon: '👑',
          rarity: 'rare',
          available: true,
          owned: false,
        },
      ];
    }
  },

  /**
   * Purchase a reward
   */
  purchaseReward: async (rewardId: string): Promise<boolean> => {
    try {
      return await invoke<boolean>('gamification_purchase_reward', { rewardId });
    } catch {
      throw new Error('Failed to purchase reward');
    }
  },

  /**
   * Get owned rewards
   */
  getOwnedRewards: async (): Promise<Reward[]> => {
    const all = await GamificationService.getRewards();
    return all.filter(r => r.owned);
  },

  // -------------------------------------------------------------------------
  // Events & Actions (for tracking)
  // -------------------------------------------------------------------------

  /**
   * Track an action for gamification
   */
  trackAction: async (
    action: string, 
    metadata?: Record<string, unknown>
  ): Promise<void> => {
    try {
      await invoke('gamification_track_action', { action, metadata });
    } catch {
      // Silently fail if backend not available
      log.debug('Gamification tracking:', { action, metadata });
    }
  },

  /**
   * Batch track multiple actions
   */
  trackActions: async (
    actions: Array<{ action: string; metadata?: Record<string, unknown> }>
  ): Promise<void> => {
    try {
      await invoke('gamification_track_actions', { actions });
    } catch {
      log.debug('Gamification batch tracking:', actions);
    }
  },

  // -------------------------------------------------------------------------
  // Social Features
  // -------------------------------------------------------------------------

  /**
   * Get user's badges for display
   */
  getBadges: async (): Promise<Badge[]> => {
    try {
      return await invoke<Badge[]>('gamification_get_badges');
    } catch {
      return [];
    }
  },

  /**
   * Set featured badge
   */
  setFeaturedBadge: async (badgeId: string): Promise<void> => {
    try {
      await invoke('gamification_set_featured_badge', { badgeId });
    } catch {
      throw new Error('Failed to set featured badge');
    }
  },

  /**
   * Get user's public profile
   */
  getPublicProfile: async (userId: string): Promise<{
    username: string;
    avatar?: string;
    level: number;
    title: string;
    badges: Badge[];
    achievements: number;
    streak: number;
  }> => {
    try {
      return await invoke('gamification_get_public_profile', { userId });
    } catch {
      throw new Error('Failed to get profile');
    }
  },
};

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export function useGamification() {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [streak, setStreak] = useState<DailyStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, levelData, streakData] = await Promise.all([
        GamificationService.getStats(),
        GamificationService.getLevel(),
        GamificationService.getStreak(),
      ]);
      setStats(statsData);
      setLevel(levelData);
      setStreak(streakData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, level, streak, loading, error, refresh };
}

export function useAchievements(category?: AchievementCategory) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = category 
          ? await GamificationService.getAchievementsByCategory(category)
          : await GamificationService.getAchievements();
        setAchievements(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load achievements');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category]);

  return { achievements, loading, error };
}

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await GamificationService.getChallenges();
      setChallenges(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { challenges, loading, error, refresh };
}

export function useLeaderboard(
  type: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly'
) {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [lb, rank] = await Promise.all([
        GamificationService.getLeaderboard(type),
        GamificationService.getUserRank(type),
      ]);
      setLeaderboard(lb);
      setUserRank(rank);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { leaderboard, userRank, loading, error, refresh };
}

export default GamificationService;
