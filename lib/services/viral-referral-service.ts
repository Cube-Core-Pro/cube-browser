/**
 * CUBE Nexum - Advanced Viral Referral Service
 * 
 * Enterprise-grade referral system for viral growth:
 * - Multi-tier referral programs
 * - Viral loops & sharing
 * - Reward distribution
 * - Analytics & tracking
 * - Social integration
 * - Invite management
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ReferralTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface ReferralCode {
  code: string;
  userId: string;
  createdAt: number;
  expiresAt?: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  campaign?: string;
  customReward?: ReferralReward;
}

export interface ReferralReward {
  referrerXP: number;
  referrerCredits: number;
  referrerPremiumDays: number;
  referreeXP: number;
  referreeCredits: number;
  referreePremiumDays: number;
  bonusFeatures?: string[];
}

export interface Referral {
  id: string;
  referrerId: string;
  referreeId: string;
  referralCode: string;
  status: 'pending' | 'active' | 'rewarded' | 'expired' | 'cancelled';
  createdAt: number;
  activatedAt?: number;
  rewardedAt?: number;
  referreeEmail?: string;
  referreeName?: string;
  tier: ReferralTier;
  rewardsClaimed: boolean;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalEarned: {
    xp: number;
    credits: number;
    premiumDays: number;
  };
  currentTier: ReferralTier;
  nextTierProgress: number;
  nextTierRequirement: number;
  monthlyReferrals: number;
  conversionRate: number;
  topReferralSource: string;
}

export interface ShareableContent {
  type: 'link' | 'image' | 'video' | 'template';
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  hashtags: string[];
  platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram' | 'email' | 'copy';
}

export interface InviteTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  platform: 'email' | 'sms' | 'social';
  variables: string[];
  previewUrl?: string;
}

export interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  referralCount: number;
  tier: ReferralTier;
  isCurrentUser: boolean;
  badges: string[];
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: number;
  endDate: number;
  multiplier: number;
  bonusRewards: ReferralReward;
  targetAudience: string;
  isActive: boolean;
  participantCount: number;
  totalReferrals: number;
}

export interface SocialShareResult {
  platform: string;
  shared: boolean;
  clickCount: number;
  conversionCount: number;
  timestamp: number;
}

export interface ContactInvite {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  status: 'pending' | 'sent' | 'clicked' | 'registered' | 'rejected';
  sentAt?: number;
  registeredAt?: number;
  source: 'manual' | 'contacts' | 'import';
}

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

export const TIER_REQUIREMENTS: Record<ReferralTier, number> = {
  bronze: 0,
  silver: 5,
  gold: 15,
  platinum: 50,
  diamond: 100,
};

export const TIER_REWARDS: Record<ReferralTier, ReferralReward> = {
  bronze: {
    referrerXP: 500,
    referrerCredits: 100,
    referrerPremiumDays: 3,
    referreeXP: 250,
    referreeCredits: 50,
    referreePremiumDays: 7,
  },
  silver: {
    referrerXP: 750,
    referrerCredits: 150,
    referrerPremiumDays: 5,
    referreeXP: 250,
    referreeCredits: 50,
    referreePremiumDays: 7,
  },
  gold: {
    referrerXP: 1000,
    referrerCredits: 200,
    referrerPremiumDays: 7,
    referreeXP: 500,
    referreeCredits: 100,
    referreePremiumDays: 14,
  },
  platinum: {
    referrerXP: 1500,
    referrerCredits: 300,
    referrerPremiumDays: 14,
    referreeXP: 500,
    referreeCredits: 100,
    referreePremiumDays: 14,
  },
  diamond: {
    referrerXP: 2500,
    referrerCredits: 500,
    referrerPremiumDays: 30,
    referreeXP: 1000,
    referreeCredits: 200,
    referreePremiumDays: 30,
    bonusFeatures: ['priority_support', 'beta_access', 'exclusive_themes'],
  },
};

export const TIER_COLORS: Record<ReferralTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
  diamond: '#b9f2ff',
};

// ============================================================================
// REFERRAL SERVICE
// ============================================================================

export const ViralReferralService = {
  // -------------------------------------------------------------------------
  // Referral Codes
  // -------------------------------------------------------------------------

  /**
   * Get user's referral code
   */
  getMyCode: async (): Promise<ReferralCode> => {
    try {
      return await invoke<ReferralCode>('referral_get_my_code');
    } catch {
      // Generate local code for demo
      return {
        code: 'CUBE' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        userId: 'current-user',
        createdAt: Date.now(),
        usageCount: 0,
        isActive: true,
      };
    }
  },

  /**
   * Generate a new referral code
   */
  generateCode: async (options?: {
    campaign?: string;
    expiresAt?: number;
    usageLimit?: number;
  }): Promise<ReferralCode> => {
    try {
      return await invoke<ReferralCode>('referral_generate_code', { options });
    } catch {
      return {
        code: 'CUBE' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        userId: 'current-user',
        createdAt: Date.now(),
        expiresAt: options?.expiresAt,
        usageLimit: options?.usageLimit,
        usageCount: 0,
        isActive: true,
        campaign: options?.campaign,
      };
    }
  },

  /**
   * Validate a referral code
   */
  validateCode: async (code: string): Promise<{
    valid: boolean;
    reward?: ReferralReward;
    message?: string;
  }> => {
    try {
      return await invoke('referral_validate_code', { code });
    } catch {
      return { valid: false, message: 'Unable to validate code' };
    }
  },

  /**
   * Apply a referral code
   */
  applyCode: async (code: string): Promise<{
    success: boolean;
    reward?: ReferralReward;
    message: string;
  }> => {
    try {
      return await invoke('referral_apply_code', { code });
    } catch {
      return { success: false, message: 'Failed to apply code' };
    }
  },

  // -------------------------------------------------------------------------
  // Referrals
  // -------------------------------------------------------------------------

  /**
   * Get all referrals made by user
   */
  getMyReferrals: async (): Promise<Referral[]> => {
    try {
      return await invoke<Referral[]>('referral_get_my_referrals');
    } catch {
      return [];
    }
  },

  /**
   * Get referral statistics
   */
  getStats: async (): Promise<ReferralStats> => {
    try {
      return await invoke<ReferralStats>('referral_get_stats');
    } catch {
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        pendingReferrals: 0,
        totalEarned: { xp: 0, credits: 0, premiumDays: 0 },
        currentTier: 'bronze',
        nextTierProgress: 0,
        nextTierRequirement: 5,
        monthlyReferrals: 0,
        conversionRate: 0,
        topReferralSource: 'direct',
      };
    }
  },

  /**
   * Get current tier
   */
  getCurrentTier: async (): Promise<{
    tier: ReferralTier;
    rewards: ReferralReward;
    progress: number;
    nextTier?: ReferralTier;
    referralsNeeded?: number;
  }> => {
    try {
      return await invoke('referral_get_tier');
    } catch {
      return {
        tier: 'bronze',
        rewards: TIER_REWARDS.bronze,
        progress: 0,
        nextTier: 'silver',
        referralsNeeded: 5,
      };
    }
  },

  /**
   * Claim pending rewards
   */
  claimRewards: async (referralId: string): Promise<{
    success: boolean;
    rewards: ReferralReward;
  }> => {
    try {
      return await invoke('referral_claim_rewards', { referralId });
    } catch {
      return { success: false, rewards: TIER_REWARDS.bronze };
    }
  },

  // -------------------------------------------------------------------------
  // Sharing
  // -------------------------------------------------------------------------

  /**
   * Get shareable content
   */
  getShareableContent: async (
    platform: ShareableContent['platform']
  ): Promise<ShareableContent> => {
    try {
      return await invoke<ShareableContent>('referral_get_share_content', { platform });
    } catch {
      const code = await ViralReferralService.getMyCode();
      const baseUrl = 'https://cubeai.tools/invite';
      const referralUrl = `${baseUrl}?ref=${code.code}`;
      
      const messages: Record<string, { title: string; description: string }> = {
        twitter: {
          title: '🚀 Just discovered CUBE Nexum - the future of browser automation!',
          description: 'AI-powered, secure, and incredibly fast. Use my link for bonus rewards:',
        },
        facebook: {
          title: 'Game-changing browser automation with AI',
          description: 'CUBE Nexum has transformed how I work online. Get free premium with my referral:',
        },
        linkedin: {
          title: 'Revolutionizing productivity with AI-powered automation',
          description: 'CUBE Nexum combines browser automation, AI assistance, and enterprise security. Try it:',
        },
        whatsapp: {
          title: 'Hey! Check out CUBE Nexum',
          description: 'This AI browser automation tool is amazing. Use my link for free premium:',
        },
        telegram: {
          title: '🔥 CUBE Nexum - Must try this!',
          description: 'AI-powered browser with automation, security, and more. Free premium with my code:',
        },
        email: {
          title: 'You\'ll love CUBE Nexum - AI Browser Automation',
          description: 'I\'ve been using CUBE Nexum and it\'s incredible. Thought you\'d like it too!',
        },
        copy: {
          title: 'Try CUBE Nexum!',
          description: 'Use my referral link for bonus rewards:',
        },
      };

      return {
        type: 'link',
        title: messages[platform]?.title || messages.copy.title,
        description: messages[platform]?.description || messages.copy.description,
        url: referralUrl,
        hashtags: ['CUBENexum', 'AI', 'Automation', 'Productivity'],
        platform,
      };
    }
  },

  /**
   * Share on platform
   */
  share: async (platform: ShareableContent['platform']): Promise<SocialShareResult> => {
    const content = await ViralReferralService.getShareableContent(platform);
    const code = await ViralReferralService.getMyCode();
    const referralUrl = `https://cubeai.tools/invite?ref=${code.code}`;

    try {
      // Track share event
      await invoke('referral_track_share', { platform, code: code.code });
    } catch {
      // Continue even if tracking fails
    }

    const text = `${content.title}\n\n${content.description}\n${referralUrl}`;
    const hashtags = content.hashtags.join(',');

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=${hashtags}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent(content.title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(content.title)}`,
      email: `mailto:?subject=${encodeURIComponent(content.title)}&body=${encodeURIComponent(text)}`,
    };

    if (platform === 'copy') {
      await navigator.clipboard.writeText(referralUrl);
      return {
        platform,
        shared: true,
        clickCount: 0,
        conversionCount: 0,
        timestamp: Date.now(),
      };
    }

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }

    return {
      platform,
      shared: true,
      clickCount: 0,
      conversionCount: 0,
      timestamp: Date.now(),
    };
  },

  /**
   * Generate share image
   */
  generateShareImage: async (): Promise<string> => {
    try {
      return await invoke<string>('referral_generate_share_image');
    } catch {
      // Return placeholder
      return 'data:image/svg+xml,...';
    }
  },

  // -------------------------------------------------------------------------
  // Invites
  // -------------------------------------------------------------------------

  /**
   * Send email invite
   */
  sendEmailInvite: async (
    emails: string[],
    message?: string
  ): Promise<{ sent: number; failed: number }> => {
    try {
      return await invoke('referral_send_email_invites', { emails, message });
    } catch {
      return { sent: 0, failed: emails.length };
    }
  },

  /**
   * Get invite templates
   */
  getInviteTemplates: async (): Promise<InviteTemplate[]> => {
    try {
      return await invoke<InviteTemplate[]>('referral_get_templates');
    } catch {
      return [
        {
          id: 'casual',
          name: 'Casual Invite',
          subject: 'Check out CUBE Nexum! 🚀',
          body: 'Hey {{name}},\n\nI\'ve been using CUBE Nexum and thought you\'d love it. It\'s an AI-powered browser automation tool that\'s incredibly useful.\n\nUse my link to get started with bonus rewards: {{referral_link}}\n\nLet me know what you think!\n\n{{sender_name}}',
          platform: 'email',
          variables: ['name', 'referral_link', 'sender_name'],
        },
        {
          id: 'professional',
          name: 'Professional Invite',
          subject: 'Productivity Tool Recommendation: CUBE Nexum',
          body: 'Hello {{name}},\n\nI wanted to share a tool that has significantly improved my workflow: CUBE Nexum.\n\nKey features:\n- AI-powered automation\n- Enterprise-grade security\n- Cross-platform compatibility\n\nRegister with my referral for premium benefits: {{referral_link}}\n\nBest regards,\n{{sender_name}}',
          platform: 'email',
          variables: ['name', 'referral_link', 'sender_name'],
        },
        {
          id: 'team',
          name: 'Team Introduction',
          subject: 'Team Tool: CUBE Nexum for Automation',
          body: 'Team,\n\nI\'d like to introduce CUBE Nexum - an automation platform that could benefit our workflow.\n\nSchedule a demo or try it out: {{referral_link}}\n\n{{sender_name}}',
          platform: 'email',
          variables: ['referral_link', 'sender_name'],
        },
      ];
    }
  },

  /**
   * Get sent invites
   */
  getSentInvites: async (): Promise<ContactInvite[]> => {
    try {
      return await invoke<ContactInvite[]>('referral_get_sent_invites');
    } catch {
      return [];
    }
  },

  /**
   * Resend invite
   */
  resendInvite: async (inviteId: string): Promise<boolean> => {
    try {
      return await invoke<boolean>('referral_resend_invite', { inviteId });
    } catch {
      return false;
    }
  },

  /**
   * Import contacts (from file)
   */
  importContacts: async (contacts: Array<{ email: string; name?: string }>): Promise<number> => {
    try {
      return await invoke<number>('referral_import_contacts', { contacts });
    } catch {
      return 0;
    }
  },

  // -------------------------------------------------------------------------
  // Leaderboards & Campaigns
  // -------------------------------------------------------------------------

  /**
   * Get referral leaderboard
   */
  getLeaderboard: async (
    period: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'monthly',
    limit: number = 50
  ): Promise<LeaderboardUser[]> => {
    try {
      return await invoke<LeaderboardUser[]>('referral_get_leaderboard', { period, limit });
    } catch {
      return [];
    }
  },

  /**
   * Get active campaigns
   */
  getCampaigns: async (): Promise<Campaign[]> => {
    try {
      return await invoke<Campaign[]>('referral_get_campaigns');
    } catch {
      const now = Date.now();
      return [
        {
          id: 'new_year_2026',
          name: 'New Year Challenge',
          description: 'Earn 2x rewards on all referrals during January!',
          startDate: now,
          endDate: now + 30 * 24 * 60 * 60 * 1000,
          multiplier: 2,
          bonusRewards: {
            referrerXP: 1000,
            referrerCredits: 200,
            referrerPremiumDays: 7,
            referreeXP: 500,
            referreeCredits: 100,
            referreePremiumDays: 14,
          },
          targetAudience: 'all',
          isActive: true,
          participantCount: 1234,
          totalReferrals: 5678,
        },
      ];
    }
  },

  /**
   * Join campaign
   */
  joinCampaign: async (campaignId: string): Promise<boolean> => {
    try {
      return await invoke<boolean>('referral_join_campaign', { campaignId });
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // Analytics
  // -------------------------------------------------------------------------

  /**
   * Get referral analytics
   */
  getAnalytics: async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    referralsByDay: Array<{ date: string; count: number }>;
    conversionsBySource: Array<{ source: string; count: number; rate: number }>;
    topPerformingCodes: Array<{ code: string; uses: number; conversions: number }>;
    rewardsByType: Array<{ type: string; amount: number }>;
  }> => {
    try {
      return await invoke('referral_get_analytics', { period });
    } catch {
      return {
        referralsByDay: [],
        conversionsBySource: [],
        topPerformingCodes: [],
        rewardsByType: [],
      };
    }
  },

  /**
   * Track referral event
   */
  trackEvent: async (
    event: 'view' | 'click' | 'signup' | 'conversion',
    metadata?: Record<string, unknown>
  ): Promise<void> => {
    try {
      await invoke('referral_track_event', { event, metadata });
    } catch {
      // Silent fail
    }
  },
};

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export function useReferralCode() {
  const [code, setCode] = useState<ReferralCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ViralReferralService.getMyCode();
        setCode(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load code');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const regenerate = useCallback(async () => {
    try {
      setLoading(true);
      const newCode = await ViralReferralService.generateCode();
      setCode(newCode);
      return newCode;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate code');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { code, loading, error, regenerate };
}

export function useReferralStats() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [tier, setTier] = useState<{
    tier: ReferralTier;
    rewards: ReferralReward;
    progress: number;
    nextTier?: ReferralTier;
    referralsNeeded?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, tierData] = await Promise.all([
        ViralReferralService.getStats(),
        ViralReferralService.getCurrentTier(),
      ]);
      setStats(statsData);
      setTier(tierData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, tier, loading, error, refresh };
}

export function useReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ViralReferralService.getMyReferrals();
      setReferrals(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const claimRewards = useCallback(async (referralId: string) => {
    try {
      const result = await ViralReferralService.claimRewards(referralId);
      if (result.success) {
        await refresh();
      }
      return result;
    } catch (_err) {
      return { success: false, rewards: TIER_REWARDS.bronze };
    }
  }, [refresh]);

  return { referrals, loading, error, refresh, claimRewards };
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ViralReferralService.getCampaigns();
        setCampaigns(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { campaigns, loading };
}

export default ViralReferralService;
