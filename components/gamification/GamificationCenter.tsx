/**
 * CUBE Nexum - Gamification Center Component
 * 
 * Complete gamification UI with:
 * - XP & Level display
 * - Achievements showcase
 * - Daily challenges
 * - Streaks tracking
 * - Leaderboards
 * - Rewards shop
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Zap, Target, Gift, Users, Crown, 
  Flame, Clock, Lock, Check,
  TrendingUp, TrendingDown, Minus, Sparkles, Medal
} from 'lucide-react';
import { 
  GamificationService,
  useGamification,
  useAchievements,
  useChallenges,
  useLeaderboard,
  type Achievement,
  type Challenge,
  type LeaderboardEntry,
  type Reward,
  type AchievementCategory,
  type AchievementRarity,
} from '@/lib/services/gamification-service';
import { useTranslation } from '@/hooks/useTranslation';
import { logger } from '@/lib/services/logger-service';
import './GamificationCenter.css';

const log = logger.scope('GamificationCenter');

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const RarityBadge: React.FC<{ rarity: AchievementRarity }> = ({ rarity }) => {
  const colors: Record<AchievementRarity, string> = {
    common: 'bg-gray-500',
    uncommon: 'bg-green-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-yellow-500',
  };

  return (
    <span className={`rarity-badge ${colors[rarity]} text-white text-xs px-2 py-0.5 rounded-full capitalize`}>
      {rarity}
    </span>
  );
};

const ProgressBar: React.FC<{ 
  current: number; 
  max: number; 
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ current, max, color = 'var(--primary)', showLabel = true, size = 'md' }) => {
  const percentage = Math.min((current / max) * 100, 100);
  const heights = { sm: '4px', md: '8px', lg: '12px' };

  return (
    <div className="progress-bar-container">
      <div 
        className="progress-bar-bg" 
        style={{ height: heights[size] }}
      >
        <motion.div 
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="progress-label text-xs text-muted-foreground">
          {current.toLocaleString()} / {max.toLocaleString()}
        </span>
      )}
    </div>
  );
};

const XPDisplay: React.FC<{ amount: number; multiplier?: number }> = ({ amount, multiplier }) => (
  <div className="xp-display">
    <Zap className="w-4 h-4 text-yellow-500" />
    <span className="font-bold text-yellow-500">+{amount} XP</span>
    {multiplier && multiplier > 1 && (
      <span className="text-xs text-green-500 ml-1">×{multiplier.toFixed(1)}</span>
    )}
  </div>
);

// ============================================================================
// LEVEL CARD
// ============================================================================

const LevelCard: React.FC = () => {
  const { level, stats, streak } = useGamification();

  if (!level || !stats) return null;

  return (
    <motion.div 
      className="level-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="level-header">
        <div className="level-badge">
          <Crown className="w-6 h-6" />
          <span className="level-number">{level.level}</span>
        </div>
        <div className="level-info">
          <h3 className="level-title">{level.title}</h3>
          <p className="text-sm text-muted-foreground">
            {level.totalXP.toLocaleString()} Total XP
          </p>
        </div>
        <div className="streak-badge">
          <Flame className="w-5 h-5 text-orange-500" />
          <span>{streak?.currentStreak || 0}</span>
        </div>
      </div>

      <div className="level-progress">
        <div className="flex justify-between text-sm mb-1">
          <span>Level {level.level}</span>
          <span>Level {level.level + 1}</span>
        </div>
        <ProgressBar 
          current={level.currentXP} 
          max={level.xpToNextLevel}
          color="#eab308"
          size="lg"
        />
      </div>

      <div className="level-stats">
        <div className="stat-item">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span>{stats.achievementsUnlocked}/{stats.totalAchievements}</span>
          <small>Achievements</small>
        </div>
        <div className="stat-item">
          <Target className="w-4 h-4 text-blue-500" />
          <span>{stats.challengesCompleted}</span>
          <small>Challenges</small>
        </div>
        <div className="stat-item">
          <Users className="w-4 h-4 text-purple-500" />
          <span>#{stats.weeklyRank || '—'}</span>
          <small>Weekly Rank</small>
        </div>
      </div>

      {level.perks.length > 0 && (
        <div className="level-perks">
          <h4 className="text-sm font-medium mb-2">Your Perks</h4>
          <div className="perks-list">
            {level.perks.map((perk, i) => (
              <span key={i} className="perk-tag">
                <Sparkles className="w-3 h-3" />
                {perk}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// STREAK CARD
// ============================================================================

const StreakCard: React.FC = () => {
  const { streak } = useGamification();
  const { t: _t } = useTranslation();

  if (!streak) return null;

  const milestones = [7, 14, 30, 60, 100, 365];
  const nextMilestone = milestones.find(m => m > streak.currentStreak) || 365;
  const _progress = (streak.currentStreak / nextMilestone) * 100;

  return (
    <motion.div 
      className="streak-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="streak-header">
        <div className="streak-flame">
          <Flame className={`w-12 h-12 ${streak.currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-gray-400'}`} />
          <span className="streak-count">{streak.currentStreak}</span>
        </div>
        <div>
          <h3 className="text-lg font-bold">
            {streak.currentStreak > 0 ? `${streak.currentStreak} Day Streak!` : 'Start Your Streak'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Longest: {streak.longestStreak} days
          </p>
        </div>
      </div>

      <div className="streak-progress">
        <div className="flex justify-between text-sm mb-1">
          <span>Next Milestone</span>
          <span>{nextMilestone} days</span>
        </div>
        <ProgressBar 
          current={streak.currentStreak} 
          max={nextMilestone}
          color="#f97316"
          showLabel={false}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Reward: {streak.milestoneReward}
        </p>
      </div>

      {streak.streakProtects > 0 && (
        <div className="streak-protects">
          <span className="text-sm">
            🛡️ {streak.streakProtects} Streak Protect{streak.streakProtects !== 1 ? 's' : ''} available
          </span>
        </div>
      )}

      <div className="streak-milestones">
        {milestones.slice(0, 4).map(m => (
          <div 
            key={m} 
            className={`milestone ${streak.currentStreak >= m ? 'achieved' : ''}`}
          >
            {streak.currentStreak >= m ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <span>{m}</span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ============================================================================
// ACHIEVEMENTS SECTION
// ============================================================================

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const isUnlocked = achievement.unlockedAt !== undefined;
  const _progressPercent = (achievement.progress / achievement.maxProgress) * 100;

  return (
    <motion.div 
      className={`achievement-card ${isUnlocked ? 'unlocked' : ''} ${achievement.isSecret && !isUnlocked ? 'secret' : ''}`}
      whileHover={{ scale: 1.02 }}
      layout
    >
      <div className="achievement-icon">
        {achievement.isSecret && !isUnlocked ? (
          <Lock className="w-8 h-8 text-gray-400" />
        ) : (
          <span className="text-3xl">{achievement.icon}</span>
        )}
        {isUnlocked && (
          <motion.div 
            className="unlock-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Check className="w-3 h-3" />
          </motion.div>
        )}
      </div>

      <div className="achievement-content">
        <div className="achievement-header">
          <h4 className="font-medium">
            {achievement.isSecret && !isUnlocked ? '???' : achievement.name}
          </h4>
          <RarityBadge rarity={achievement.rarity} />
        </div>
        <p className="text-sm text-muted-foreground">
          {achievement.isSecret && !isUnlocked ? 'This is a secret achievement' : achievement.description}
        </p>
        
        {!isUnlocked && (
          <div className="mt-2">
            <ProgressBar 
              current={achievement.progress} 
              max={achievement.maxProgress}
              size="sm"
            />
          </div>
        )}

        <div className="achievement-footer">
          <XPDisplay amount={achievement.xpReward} />
          {isUnlocked && achievement.unlockedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(achievement.unlockedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const AchievementsSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const { achievements, loading } = useAchievements(
    selectedCategory === 'all' ? undefined : selectedCategory
  );

  const categories: { value: AchievementCategory | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '🏆' },
    { value: 'getting_started', label: 'Getting Started', icon: '🚀' },
    { value: 'power_user', label: 'Power User', icon: '💪' },
    { value: 'security_master', label: 'Security', icon: '🔐' },
    { value: 'ai_pioneer', label: 'AI Pioneer', icon: '🤖' },
    { value: 'social_butterfly', label: 'Social', icon: '👥' },
    { value: 'streak_master', label: 'Streaks', icon: '🔥' },
    { value: 'explorer', label: 'Explorer', icon: '🗺️' },
  ];

  const sortedAchievements = [...achievements].sort((a, b) => {
    // Unlocked first, then by progress percentage
    if (a.unlockedAt && !b.unlockedAt) return -1;
    if (!a.unlockedAt && b.unlockedAt) return 1;
    
    const aProgress = a.progress / a.maxProgress;
    const bProgress = b.progress / b.maxProgress;
    return bProgress - aProgress;
  });

  const unlockedCount = achievements.filter(a => a.unlockedAt).length;

  return (
    <div className="achievements-section">
      <div className="section-header">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Achievements
          </h2>
          <p className="text-sm text-muted-foreground">
            {unlockedCount} of {achievements.length} unlocked
          </p>
        </div>
      </div>

      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat.value}
            className={`category-tab ${selectedCategory === cat.value ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.value)}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">Loading achievements...</div>
      ) : (
        <motion.div className="achievements-grid" layout>
          <AnimatePresence>
            {sortedAchievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

// ============================================================================
// CHALLENGES SECTION
// ============================================================================

const ChallengeCard: React.FC<{ 
  challenge: Challenge;
  onClaim: (id: string) => void;
}> = ({ challenge, onClaim }) => {
  const isExpired = challenge.expiresAt < Date.now();
  const timeLeft = challenge.expiresAt - Date.now();
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const daysLeft = Math.floor(hoursLeft / 24);

  const difficultyColors = {
    easy: 'text-green-500',
    medium: 'text-yellow-500',
    hard: 'text-orange-500',
    extreme: 'text-red-500',
  };

  const typeColors = {
    daily: 'bg-blue-500/10 text-blue-500',
    weekly: 'bg-purple-500/10 text-purple-500',
    monthly: 'bg-pink-500/10 text-pink-500',
    special: 'bg-yellow-500/10 text-yellow-500',
  };

  return (
    <motion.div 
      className={`challenge-card ${challenge.completed ? 'completed' : ''} ${isExpired ? 'expired' : ''}`}
      whileHover={{ scale: 1.01 }}
    >
      <div className="challenge-header">
        <span className={`challenge-type ${typeColors[challenge.type]}`}>
          {challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)}
        </span>
        <span className={`challenge-difficulty ${difficultyColors[challenge.difficulty]}`}>
          {challenge.difficulty}
        </span>
      </div>

      <h4 className="font-medium mt-2">{challenge.name}</h4>
      <p className="text-sm text-muted-foreground">{challenge.description}</p>

      <div className="challenge-progress mt-3">
        <ProgressBar 
          current={challenge.progress} 
          max={challenge.maxProgress}
          color={challenge.completed ? '#22c55e' : 'var(--primary)'}
        />
      </div>

      <div className="challenge-footer">
        <div className="challenge-reward">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span>{challenge.xpReward} XP</span>
        </div>
        
        {!challenge.completed && !isExpired && (
          <div className="challenge-time">
            <Clock className="w-4 h-4" />
            <span>
              {daysLeft > 0 ? `${daysLeft}d` : `${hoursLeft}h`} left
            </span>
          </div>
        )}

        {challenge.completed && !challenge.claimed && (
          <button 
            className="claim-button"
            onClick={() => onClaim(challenge.id)}
          >
            <Gift className="w-4 h-4" />
            Claim
          </button>
        )}

        {challenge.claimed && (
          <span className="claimed-badge">
            <Check className="w-4 h-4" />
            Claimed
          </span>
        )}
      </div>
    </motion.div>
  );
};

const ChallengesSection: React.FC = () => {
  const { challenges, loading, refresh } = useChallenges();
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

  const handleClaim = async (challengeId: string) => {
    try {
      await GamificationService.claimChallengeReward(challengeId);
      refresh();
    } catch (err) {
      log.error('Failed to claim reward:', err);
    }
  };

  const filteredChallenges = challenges.filter(c => 
    filter === 'all' || c.type === filter
  );

  const activeChallenges = filteredChallenges.filter(c => !c.completed);
  const completedChallenges = filteredChallenges.filter(c => c.completed);

  return (
    <div className="challenges-section">
      <div className="section-header">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-500" />
            Challenges
          </h2>
          <p className="text-sm text-muted-foreground">
            Complete challenges to earn bonus XP
          </p>
        </div>
      </div>

      <div className="filter-tabs">
        {(['all', 'daily', 'weekly', 'monthly'] as const).map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">Loading challenges...</div>
      ) : (
        <>
          {activeChallenges.length > 0 && (
            <div className="challenges-group">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Active</h3>
              <div className="challenges-grid">
                {activeChallenges.map(challenge => (
                  <ChallengeCard 
                    key={challenge.id} 
                    challenge={challenge}
                    onClaim={handleClaim}
                  />
                ))}
              </div>
            </div>
          )}

          {completedChallenges.length > 0 && (
            <div className="challenges-group mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Completed</h3>
              <div className="challenges-grid">
                {completedChallenges.map(challenge => (
                  <ChallengeCard 
                    key={challenge.id} 
                    challenge={challenge}
                    onClaim={handleClaim}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// LEADERBOARD SECTION
// ============================================================================

const LeaderboardRow: React.FC<{ entry: LeaderboardEntry; index: number }> = ({ entry, index }) => {
  const rankIcons: Record<number, string> = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  };

  const TrendIcon = entry.trend === 'up' ? TrendingUp : entry.trend === 'down' ? TrendingDown : Minus;
  const trendColor = entry.trend === 'up' ? 'text-green-500' : entry.trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <motion.div 
      className={`leaderboard-row ${entry.isCurrentUser ? 'current-user' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="rank">
        {entry.rank <= 3 ? (
          <span className="text-2xl">{rankIcons[entry.rank]}</span>
        ) : (
          <span className="rank-number">{entry.rank}</span>
        )}
      </div>

      <div className="user-info">
        <div className="avatar">
          {entry.avatar ? (
            <img src={entry.avatar} alt={entry.username} />
          ) : (
            <span>{entry.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <span className="username">{entry.username}</span>
          <span className="user-level">Lvl {entry.level}</span>
        </div>
      </div>

      <div className="score">
        <span className="score-value">{entry.score.toLocaleString()}</span>
        <span className="score-label">XP</span>
      </div>

      <div className={`trend ${trendColor}`}>
        <TrendIcon className="w-4 h-4" />
        {entry.trendValue > 0 && <span>{entry.trendValue}</span>}
      </div>
    </motion.div>
  );
};

const LeaderboardSection: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'allTime'>('weekly');
  const { leaderboard, userRank, loading } = useLeaderboard(period);

  return (
    <div className="leaderboard-section">
      <div className="section-header">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Medal className="w-6 h-6 text-purple-500" />
            Leaderboard
          </h2>
          {leaderboard && (
            <p className="text-sm text-muted-foreground">
              {leaderboard.totalParticipants.toLocaleString()} participants
            </p>
          )}
        </div>
      </div>

      <div className="period-tabs">
        {(['daily', 'weekly', 'monthly', 'allTime'] as const).map(p => (
          <button
            key={p}
            className={`period-tab ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p === 'allTime' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">Loading leaderboard...</div>
      ) : leaderboard ? (
        <>
          {userRank && !leaderboard.entries.find(e => e.isCurrentUser) && (
            <div className="your-rank">
              <span className="text-sm text-muted-foreground">Your Rank</span>
              <LeaderboardRow entry={userRank} index={0} />
            </div>
          )}

          <div className="leaderboard-list">
            {leaderboard.entries.slice(0, 10).map((entry, index) => (
              <LeaderboardRow key={entry.userId} entry={entry} index={index} />
            ))}
          </div>

          {leaderboard.entries.length === 0 && (
            <div className="empty-state">
              <Users className="w-12 h-12 text-muted-foreground" />
              <p>No participants yet</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

// ============================================================================
// REWARDS SHOP
// ============================================================================

const RewardCard: React.FC<{ 
  reward: Reward;
  onPurchase: (id: string) => void;
  userCoins: number;
  userXP: number;
}> = ({ reward, onPurchase, userCoins, userXP }) => {
  const canAfford = reward.costType === 'xp' 
    ? userXP >= reward.cost 
    : userCoins >= reward.cost;

  return (
    <motion.div 
      className={`reward-card ${reward.owned ? 'owned' : ''}`}
      whileHover={{ scale: 1.02 }}
    >
      <div className="reward-icon">
        <span className="text-4xl">{reward.icon}</span>
        <RarityBadge rarity={reward.rarity} />
      </div>

      <div className="reward-content">
        <h4 className="font-medium">{reward.name}</h4>
        <p className="text-sm text-muted-foreground">{reward.description}</p>
      </div>

      <div className="reward-footer">
        <div className="reward-cost">
          {reward.costType === 'xp' ? (
            <Zap className="w-4 h-4 text-yellow-500" />
          ) : (
            <span>🪙</span>
          )}
          <span>{reward.cost.toLocaleString()}</span>
        </div>

        {reward.owned ? (
          <span className="owned-badge">
            <Check className="w-4 h-4" />
            Owned
          </span>
        ) : (
          <button 
            className="purchase-button"
            disabled={!canAfford || !reward.available}
            onClick={() => onPurchase(reward.id)}
          >
            {canAfford ? 'Get' : 'Need More'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const RewardsShop: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const { stats } = useGamification();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await GamificationService.getRewards();
        setRewards(data);
      } catch (err) {
        log.error('Failed to load rewards:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePurchase = async (rewardId: string) => {
    try {
      await GamificationService.purchaseReward(rewardId);
      const updated = await GamificationService.getRewards();
      setRewards(updated);
    } catch (err) {
      log.error('Failed to purchase:', err);
    }
  };

  return (
    <div className="rewards-section">
      <div className="section-header">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-pink-500" />
            Rewards Shop
          </h2>
          <p className="text-sm text-muted-foreground">
            Spend your hard-earned XP on exclusive rewards
          </p>
        </div>
        {stats && (
          <div className="currency-display">
            <div className="currency">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>{stats.totalXP.toLocaleString()} XP</span>
            </div>
            <div className="currency">
              <span>🪙</span>
              <span>{stats.coins.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-state">Loading rewards...</div>
      ) : (
        <div className="rewards-grid">
          {rewards.map(reward => (
            <RewardCard 
              key={reward.id} 
              reward={reward}
              onPurchase={handlePurchase}
              userCoins={stats?.coins || 0}
              userXP={stats?.totalXP || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type TabType = 'overview' | 'achievements' | 'challenges' | 'leaderboard' | 'rewards';

interface GamificationCenterProps {
  onAchievementUnlock?: (achievementId: string, xpReward: number) => void;
  onLevelUp?: (newLevel: number) => void;
  onRewardClaim?: (rewardName: string) => void;
}

export const GamificationCenter: React.FC<GamificationCenterProps> = ({
  onAchievementUnlock: _onAchievementUnlock,
  onLevelUp: _onLevelUp,
  onRewardClaim: _onRewardClaim
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { t: _t2 } = useTranslation();

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Star className="w-4 h-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-4 h-4" /> },
    { id: 'challenges', label: 'Challenges', icon: <Target className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Medal className="w-4 h-4" /> },
    { id: 'rewards', label: 'Rewards', icon: <Gift className="w-4 h-4" /> },
  ];

  return (
    <div className="gamification-center">
      <header className="gamification-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-yellow-500" />
            Gamification Center
          </h1>
          <p className="text-muted-foreground">
            Track your progress, earn achievements, and climb the leaderboard
          </p>
        </div>
      </header>

      <nav className="gamification-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="gamification-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="overview-grid"
            >
              <LevelCard />
              <StreakCard />
              <div className="quick-achievements">
                <AchievementsSection />
              </div>
              <div className="quick-challenges">
                <ChallengesSection />
              </div>
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AchievementsSection />
            </motion.div>
          )}

          {activeTab === 'challenges' && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ChallengesSection />
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <LeaderboardSection />
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RewardsShop />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default GamificationCenter;
