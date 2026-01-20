/**
 * Leaderboard Page
 * 
 * Competitive rankings with multiple categories and time periods
 * CUBE Nexum v7.0.0
 * 
 * @page /leaderboard
 */

"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useLeaderboard, 
  useCurrentProfile,
  TIER_COLORS,
  TIER_LABELS,
  type LeaderboardEntry 
} from '@/lib/services/user-profile-service';
import './leaderboard.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type LeaderboardCategory = 'xp' | 'workflows' | 'referrals' | 'streak';
type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

interface CategoryConfig {
  id: LeaderboardCategory;
  label: string;
  icon: string;
  description: string;
  scoreLabel: string;
}

interface PeriodConfig {
  id: LeaderboardPeriod;
  label: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES: CategoryConfig[] = [
  { id: 'xp', label: 'XP Points', icon: '⚡', description: 'Total experience points earned', scoreLabel: 'XP' },
  { id: 'workflows', label: 'Workflows', icon: '📋', description: 'Most workflows created', scoreLabel: 'workflows' },
  { id: 'referrals', label: 'Referrals', icon: '👥', description: 'Successful referrals made', scoreLabel: 'referrals' },
  { id: 'streak', label: 'Streak', icon: '🔥', description: 'Longest consecutive days', scoreLabel: 'days' }
];

const PERIODS: PeriodConfig[] = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This Week' },
  { id: 'monthly', label: 'This Month' },
  { id: 'all-time', label: 'All Time' }
];

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32'  // Bronze
};

const RANK_ICONS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉'
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  scoreLabel: string;
  index: number;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, isCurrentUser, scoreLabel, index }) => {
  const isTopThree = entry.rank <= 3;
  
  return (
    <motion.div 
      className={`leaderboard-row ${isCurrentUser ? 'leaderboard-row--current' : ''} ${isTopThree ? 'leaderboard-row--top' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.01 }}
      style={isTopThree ? { borderColor: RANK_COLORS[entry.rank] } : undefined}
    >
      <div className="leaderboard-row__rank">
        {isTopThree ? (
          <span className="leaderboard-row__rank-icon">{RANK_ICONS[entry.rank]}</span>
        ) : (
          <span className="leaderboard-row__rank-number">#{entry.rank}</span>
        )}
      </div>
      
      <div className="leaderboard-row__user">
        <div className="leaderboard-row__avatar">
          {entry.avatar ? (
            <img src={entry.avatar} alt={entry.displayName} />
          ) : (
            <div className="leaderboard-row__avatar-placeholder">
              {entry.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {entry.verified && (
            <span className="leaderboard-row__verified">✓</span>
          )}
        </div>
        <div className="leaderboard-row__user-info">
          <div className="leaderboard-row__name">
            {entry.displayName}
            <span 
              className="leaderboard-row__tier"
              style={{ background: TIER_COLORS[entry.tier] }}
            >
              {TIER_LABELS[entry.tier]}
            </span>
          </div>
          <div className="leaderboard-row__username">@{entry.username}</div>
        </div>
      </div>
      
      <div className="leaderboard-row__level">
        <span className="leaderboard-row__level-badge">Lvl {entry.level}</span>
      </div>
      
      <div className="leaderboard-row__score">
        <span className="leaderboard-row__score-value">{entry.score.toLocaleString()}</span>
        <span className="leaderboard-row__score-label">{scoreLabel}</span>
      </div>
      
      <div className={`leaderboard-row__change ${entry.change > 0 ? 'leaderboard-row__change--up' : entry.change < 0 ? 'leaderboard-row__change--down' : ''}`}>
        {entry.change > 0 && <span>↑ {entry.change}</span>}
        {entry.change < 0 && <span>↓ {Math.abs(entry.change)}</span>}
        {entry.change === 0 && <span>—</span>}
      </div>
    </motion.div>
  );
};

interface TopThreeCardProps {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
  scoreLabel: string;
}

const TopThreeCard: React.FC<TopThreeCardProps> = ({ entry, position, scoreLabel }) => (
  <motion.div 
    className={`top-card top-card--position-${position}`}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: position * 0.1 }}
    whileHover={{ y: -5 }}
  >
    <div className="top-card__rank">{RANK_ICONS[position]}</div>
    <div className="top-card__avatar">
      {entry.avatar ? (
        <img src={entry.avatar} alt={entry.displayName} />
      ) : (
        <div 
          className="top-card__avatar-placeholder"
          style={{ background: `linear-gradient(135deg, ${RANK_COLORS[position]}, #8b5cf6)` }}
        >
          {entry.displayName.charAt(0).toUpperCase()}
        </div>
      )}
      {entry.verified && <span className="top-card__verified">✓</span>}
    </div>
    <div className="top-card__name">{entry.displayName}</div>
    <div className="top-card__username">@{entry.username}</div>
    <div className="top-card__score">
      <span className="top-card__score-value">{entry.score.toLocaleString()}</span>
      <span className="top-card__score-label">{scoreLabel}</span>
    </div>
    <span 
      className="top-card__tier"
      style={{ background: TIER_COLORS[entry.tier] }}
    >
      {TIER_LABELS[entry.tier]}
    </span>
  </motion.div>
);

interface CategoryTabProps {
  categories: CategoryConfig[];
  activeCategory: LeaderboardCategory;
  onSelect: (category: LeaderboardCategory) => void;
}

const CategoryTabs: React.FC<CategoryTabProps> = ({ categories, activeCategory, onSelect }) => (
  <div className="category-tabs">
    {categories.map(cat => (
      <button
        key={cat.id}
        className={`category-tab ${activeCategory === cat.id ? 'category-tab--active' : ''}`}
        onClick={() => onSelect(cat.id)}
      >
        <span className="category-tab__icon">{cat.icon}</span>
        <span className="category-tab__label">{cat.label}</span>
      </button>
    ))}
  </div>
);

interface PeriodSelectorProps {
  periods: PeriodConfig[];
  activePeriod: LeaderboardPeriod;
  onSelect: (period: LeaderboardPeriod) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ periods, activePeriod, onSelect }) => (
  <div className="period-selector">
    {periods.map(period => (
      <button
        key={period.id}
        className={`period-btn ${activePeriod === period.id ? 'period-btn--active' : ''}`}
        onClick={() => onSelect(period.id)}
      >
        {period.label}
      </button>
    ))}
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LeaderboardPage() {
  const [category, setCategory] = useState<LeaderboardCategory>('xp');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const { entries, loading, error, hasMore, loadMore } = useLeaderboard(category, period);
  const { profile: currentProfile } = useCurrentProfile();
  
  const activeConfig = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  
  const topThree = entries.slice(0, 3);
  const restOfLeaderboard = entries.slice(3);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  return (
    <div className="leaderboard-page">
      {/* Header */}
      <header className="leaderboard-header">
        <div className="leaderboard-header__content">
          <h1 className="leaderboard-header__title">
            <span className="leaderboard-header__icon">🏆</span>
            Leaderboard
          </h1>
          <p className="leaderboard-header__subtitle">
            Compete with the community and climb the ranks
          </p>
        </div>
        
        {currentProfile && (
          <div className="leaderboard-header__user-rank">
            <div className="leaderboard-header__rank-info">
              <span className="leaderboard-header__rank-label">Your Rank</span>
              <span className="leaderboard-header__rank-value">#{currentProfile.stats.leaderboardRank}</span>
            </div>
            <div className="leaderboard-header__percentile">
              Top {100 - currentProfile.stats.leaderboardPercentile}%
            </div>
          </div>
        )}
      </header>

      {/* Category Tabs */}
      <CategoryTabs 
        categories={CATEGORIES}
        activeCategory={category}
        onSelect={setCategory}
      />

      {/* Category Description */}
      <div className="category-description">
        <span className="category-description__icon">{activeConfig.icon}</span>
        <p className="category-description__text">{activeConfig.description}</p>
        <PeriodSelector 
          periods={PERIODS}
          activePeriod={period}
          onSelect={setPeriod}
        />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading && entries.length === 0 ? (
          <motion.div 
            className="leaderboard-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="leaderboard-loading__spinner" />
            <p>Loading leaderboard...</p>
          </motion.div>
        ) : error ? (
          <motion.div 
            className="leaderboard-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="leaderboard-error__icon">😕</span>
            <h3>Failed to load leaderboard</h3>
            <p>{error}</p>
          </motion.div>
        ) : (
          <motion.div 
            className="leaderboard-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key={`${category}-${period}`}
          >
            {/* Top Three Podium */}
            {topThree.length >= 3 && (
              <div className="leaderboard-podium">
                <TopThreeCard 
                  entry={topThree[1]} 
                  position={2}
                  scoreLabel={activeConfig.scoreLabel}
                />
                <TopThreeCard 
                  entry={topThree[0]} 
                  position={1}
                  scoreLabel={activeConfig.scoreLabel}
                />
                <TopThreeCard 
                  entry={topThree[2]} 
                  position={3}
                  scoreLabel={activeConfig.scoreLabel}
                />
              </div>
            )}

            {/* Leaderboard Table */}
            <div className="leaderboard-table" onScroll={handleScroll}>
              <div className="leaderboard-table__header">
                <div className="leaderboard-table__col leaderboard-table__col--rank">Rank</div>
                <div className="leaderboard-table__col leaderboard-table__col--user">User</div>
                <div className="leaderboard-table__col leaderboard-table__col--level">Level</div>
                <div className="leaderboard-table__col leaderboard-table__col--score">Score</div>
                <div className="leaderboard-table__col leaderboard-table__col--change">Change</div>
              </div>
              
              <div className="leaderboard-table__body">
                {restOfLeaderboard.map((entry, index) => (
                  <LeaderboardRow 
                    key={entry.userId}
                    entry={entry}
                    isCurrentUser={currentProfile?.id === entry.userId}
                    scoreLabel={activeConfig.scoreLabel}
                    index={index}
                  />
                ))}
                
                {loading && (
                  <div className="leaderboard-table__loading">
                    <div className="leaderboard-loading__spinner" />
                  </div>
                )}
                
                {!hasMore && entries.length > 0 && (
                  <div className="leaderboard-table__end">
                    You&apos;ve reached the end of the leaderboard
                  </div>
                )}
              </div>
            </div>

            {/* Stats Summary */}
            <div className="leaderboard-stats">
              <div className="leaderboard-stat">
                <span className="leaderboard-stat__value">{entries.length}+</span>
                <span className="leaderboard-stat__label">Players</span>
              </div>
              <div className="leaderboard-stat">
                <span className="leaderboard-stat__value">
                  {topThree[0]?.score.toLocaleString() || '0'}
                </span>
                <span className="leaderboard-stat__label">Top Score</span>
              </div>
              <div className="leaderboard-stat">
                <span className="leaderboard-stat__value">
                  {Math.round(entries.reduce((sum, e) => sum + e.score, 0) / entries.length).toLocaleString() || '0'}
                </span>
                <span className="leaderboard-stat__label">Average</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rewards Banner */}
      <section className="leaderboard-rewards">
        <div className="leaderboard-rewards__content">
          <h3 className="leaderboard-rewards__title">🎁 Weekly Rewards</h3>
          <p className="leaderboard-rewards__description">
            Top performers receive exclusive rewards every week!
          </p>
          <div className="leaderboard-rewards__tiers">
            <div className="reward-tier reward-tier--gold">
              <span className="reward-tier__icon">🥇</span>
              <span className="reward-tier__name">1st Place</span>
              <span className="reward-tier__reward">+5,000 XP + Pro Month</span>
            </div>
            <div className="reward-tier reward-tier--silver">
              <span className="reward-tier__icon">🥈</span>
              <span className="reward-tier__name">2nd Place</span>
              <span className="reward-tier__reward">+2,500 XP + Exclusive Badge</span>
            </div>
            <div className="reward-tier reward-tier--bronze">
              <span className="reward-tier__icon">🥉</span>
              <span className="reward-tier__name">3rd Place</span>
              <span className="reward-tier__reward">+1,000 XP + Badge</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
