'use client';

/**
 * CUBE Nexum - Activity Feed Component
 * 
 * Complete activity feed UI with:
 * - Real-time updates
 * - Infinite scroll
 * - Filtering by type
 * - Like, comment, share
 * - Social interactions
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useActivityFeed,
  useActivity as _useActivity,
  useActivityStats,
  useCreateActivity as _useCreateActivity,
  ActivityFeedService,
  ACTIVITY_TYPE_CONFIG,
  formatActivityTime,
  generateActivityMessage as _generateActivityMessage,
  type Activity,
  type ActivityType,
  type ActivityFilter,
  type ActivityComment as _ActivityComment,
} from '@/lib/services/activity-feed-service';
import './ActivityFeed.css';

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const HeartIcon: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const ShareIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const _FilterIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const RefreshIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface ActivityCardProps {
  activity: Activity;
  onLike: () => void;
  onComment: () => void;
  onShare: (platform: string) => void;
  expanded?: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onLike,
  onComment: _onComment,
  onShare,
  expanded = false,
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showComments, setShowComments] = useState(expanded);
  const [commentText, setCommentText] = useState('');
  const config = ACTIVITY_TYPE_CONFIG[activity.type];

  const handleShare = (platform: string) => {
    onShare(platform);
    setShowShareMenu(false);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      ActivityFeedService.addComment(activity.id, commentText.trim());
      setCommentText('');
    }
  };

  return (
    <motion.article
      className="activity-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <header className="activity-card__header">
        <div className="activity-card__avatar">
          {activity.user.avatar ? (
            <img src={activity.user.avatar} alt={activity.user.displayName} />
          ) : (
            <div className="activity-card__avatar-placeholder">
              {activity.user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {activity.user.badge && (
            <span className="activity-card__badge">{activity.user.badge}</span>
          )}
        </div>
        <div className="activity-card__user-info">
          <div className="activity-card__user-name">
            <span className="activity-card__display-name">{activity.user.displayName}</span>
            {activity.user.isVerified && <span className="activity-card__verified">✓</span>}
            {activity.user.isPro && <span className="activity-card__pro">PRO</span>}
          </div>
          <div className="activity-card__meta">
            <span className="activity-card__username">@{activity.user.username}</span>
            <span className="activity-card__separator">·</span>
            <span className="activity-card__level">Lvl {activity.user.level}</span>
            <span className="activity-card__separator">·</span>
            <time className="activity-card__time">{formatActivityTime(activity.createdAt)}</time>
          </div>
        </div>
        <div 
          className="activity-card__type-badge"
          style={{ backgroundColor: config.color }}
        >
          <span className="activity-card__type-icon">{config.icon}</span>
          <span className="activity-card__type-label">{config.label}</span>
        </div>
      </header>

      {/* Content */}
      <div className="activity-card__content">
        <p className="activity-card__description">{activity.description}</p>
        
        {/* Metadata based on type */}
        {activity.metadata.xpEarned && (
          <div className="activity-card__xp-badge">
            +{activity.metadata.xpEarned} XP
          </div>
        )}
        
        {activity.metadata.achievementRarity && (
          <span className={`activity-card__rarity activity-card__rarity--${activity.metadata.achievementRarity}`}>
            {activity.metadata.achievementRarity.toUpperCase()}
          </span>
        )}

        {activity.metadata.workflowName && (
          <div className="activity-card__workflow-preview">
            <span className="activity-card__workflow-icon">⚡</span>
            <span className="activity-card__workflow-name">{activity.metadata.workflowName}</span>
            {activity.metadata.workflowDescription && (
              <p className="activity-card__workflow-description">{activity.metadata.workflowDescription}</p>
            )}
          </div>
        )}

        {activity.metadata.rank && (
          <div className="activity-card__rank-change">
            <span className="activity-card__rank">#{activity.metadata.rank}</span>
            {activity.metadata.previousRank && activity.metadata.previousRank > activity.metadata.rank && (
              <span className="activity-card__rank-up">
                ↑{activity.metadata.previousRank - activity.metadata.rank}
              </span>
            )}
          </div>
        )}

        {activity.metadata.streakDays && (
          <div className="activity-card__streak">
            🔥 {activity.metadata.streakDays} days
          </div>
        )}
      </div>

      {/* Actions */}
      <footer className="activity-card__actions">
        <button 
          className={`activity-card__action ${activity.isLikedByMe ? 'activity-card__action--liked' : ''}`}
          onClick={onLike}
          aria-label={activity.isLikedByMe ? 'Unlike' : 'Like'}
        >
          <HeartIcon filled={activity.isLikedByMe} />
          <span>{activity.likesCount > 0 ? activity.likesCount : ''}</span>
        </button>
        
        <button 
          className="activity-card__action"
          onClick={() => setShowComments(!showComments)}
          aria-label="Comments"
        >
          <CommentIcon />
          <span>{activity.commentsCount > 0 ? activity.commentsCount : ''}</span>
        </button>

        {config.shareable && (
          <div className="activity-card__share-container">
            <button 
              className="activity-card__action"
              onClick={() => setShowShareMenu(!showShareMenu)}
              aria-label="Share"
            >
              <ShareIcon />
              <span>{activity.sharesCount > 0 ? activity.sharesCount : ''}</span>
            </button>
            
            <AnimatePresence>
              {showShareMenu && (
                <motion.div 
                  className="activity-card__share-menu"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <button onClick={() => handleShare('twitter')}>𝕏 Twitter</button>
                  <button onClick={() => handleShare('facebook')}>Facebook</button>
                  <button onClick={() => handleShare('linkedin')}>LinkedIn</button>
                  <button onClick={() => handleShare('whatsapp')}>WhatsApp</button>
                  <button onClick={() => handleShare('telegram')}>Telegram</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </footer>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            className="activity-card__comments"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <form className="activity-card__comment-form" onSubmit={handleSubmitComment}>
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="activity-card__comment-input"
              />
              <button 
                type="submit" 
                disabled={!commentText.trim()}
                className="activity-card__comment-submit"
              >
                Post
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

// Filter Types Button
const FILTER_OPTIONS: { type: ActivityType | 'all'; label: string; icon: string }[] = [
  { type: 'all', label: 'All', icon: '📋' },
  { type: 'achievement_unlocked', label: 'Achievements', icon: '🏆' },
  { type: 'level_up', label: 'Level Ups', icon: '⬆️' },
  { type: 'streak_milestone', label: 'Streaks', icon: '🔥' },
  { type: 'workflow_shared', label: 'Workflows', icon: '⚡' },
  { type: 'template_published', label: 'Templates', icon: '📋' },
  { type: 'leaderboard_rank', label: 'Rankings', icon: '📊' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ActivityFeedProps {
  userId?: string;
  showFilters?: boolean;
  showStats?: boolean;
  compact?: boolean;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userId,
  showFilters = true,
  showStats = true,
  compact = false,
  maxItems,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<ActivityType | 'all'>('all');
  const [_showFilterDropdown, _setShowFilterDropdown] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const filter: ActivityFilter | undefined = useMemo(() => {
    const f: ActivityFilter = {};
    if (userId) f.userId = userId;
    if (selectedFilter !== 'all') f.types = [selectedFilter];
    return Object.keys(f).length > 0 ? f : undefined;
  }, [userId, selectedFilter]);

  const { activities, loading, error, hasMore, total, loadMore, refresh } = useActivityFeed(filter);
  const { stats } = useActivityStats();

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const handleLike = useCallback((activityId: string) => {
    ActivityFeedService.toggleLike(activityId);
  }, []);

  const handleShare = useCallback((activityId: string, platform: string) => {
    ActivityFeedService.shareActivity(activityId, platform);
  }, []);

  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities;

  if (error) {
    return (
      <div className="activity-feed activity-feed--error">
        <p>Failed to load activity feed: {error}</p>
        <button onClick={refresh}>Try Again</button>
      </div>
    );
  }

  return (
    <div className={`activity-feed ${compact ? 'activity-feed--compact' : ''}`}>
      {/* Header */}
      <header className="activity-feed__header">
        <div className="activity-feed__title-row">
          <h2 className="activity-feed__title">
            <span className="activity-feed__title-icon">📰</span>
            Activity Feed
          </h2>
          <div className="activity-feed__header-actions">
            <button 
              className="activity-feed__refresh-btn"
              onClick={refresh}
              disabled={loading}
              aria-label="Refresh feed"
            >
              <RefreshIcon />
            </button>
          </div>
        </div>

        {/* Stats */}
        {showStats && stats && (
          <div className="activity-feed__stats">
            <div className="activity-feed__stat">
              <span className="activity-feed__stat-value">{stats.activitiesToday}</span>
              <span className="activity-feed__stat-label">Today</span>
            </div>
            <div className="activity-feed__stat">
              <span className="activity-feed__stat-value">{stats.activitiesThisWeek}</span>
              <span className="activity-feed__stat-label">This Week</span>
            </div>
            <div className="activity-feed__stat">
              <span className="activity-feed__stat-value">{stats.averageLikesPerActivity.toFixed(1)}</span>
              <span className="activity-feed__stat-label">Avg Likes</span>
            </div>
            <div className="activity-feed__stat">
              <span className="activity-feed__stat-value">{total}</span>
              <span className="activity-feed__stat-label">Total</span>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="activity-feed__filters">
            {FILTER_OPTIONS.map(option => (
              <button
                key={option.type}
                className={`activity-feed__filter-btn ${selectedFilter === option.type ? 'activity-feed__filter-btn--active' : ''}`}
                onClick={() => setSelectedFilter(option.type)}
              >
                <span className="activity-feed__filter-icon">{option.icon}</span>
                <span className="activity-feed__filter-label">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Activity List */}
      <div className="activity-feed__list">
        <AnimatePresence mode="popLayout">
          {displayedActivities.map(activity => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onLike={() => handleLike(activity.id)}
              onComment={() => {}}
              onShare={(platform) => handleShare(activity.id, platform)}
            />
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <div className="activity-feed__loading">
            <div className="activity-feed__loading-spinner" />
            <span>Loading activities...</span>
          </div>
        )}

        {/* Load more trigger */}
        {!maxItems && hasMore && <div ref={loadMoreRef} className="activity-feed__load-more" />}

        {/* Empty state */}
        {!loading && displayedActivities.length === 0 && (
          <div className="activity-feed__empty">
            <span className="activity-feed__empty-icon">📭</span>
            <h3>No activities yet</h3>
            <p>Start using CUBE Nexum to see your activities here!</p>
          </div>
        )}

        {/* End of feed */}
        {!loading && !hasMore && displayedActivities.length > 0 && !maxItems && (
          <div className="activity-feed__end">
            <span>You&apos;ve reached the end of the feed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
