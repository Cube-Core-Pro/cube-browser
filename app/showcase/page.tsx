"use client";

/**
 * CUBE Nexum - Achievement Showcase Page
 * 
 * Public showcase page for sharing achievements
 * Viral feature: Users can share and embed their badges
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useShowcase,
  useCreateShowcase,
  useShowcaseAnalytics,
  achievementShowcaseService as _achievementShowcaseService,
  RARITY_CONFIG,
  LAYOUT_CONFIG,
  THEME_CONFIG,
  type PublicShowcase,
  type ShowcaseBadge,
  type ShowcaseConfig,
  type ShowcaseLayout,
  type ShowcaseTheme,
  type SharePlatform,
} from '@/lib/services/achievement-showcase-service';
import './showcase.css';

// ============================================================================
// ICONS
// ============================================================================

const ShareIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const CopyIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CodeIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const SettingsIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const StarIcon: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const EyeIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// ============================================================================
// BADGE CARD COMPONENT
// ============================================================================

interface BadgeCardProps {
  badge: ShowcaseBadge;
  size?: 'sm' | 'md' | 'lg';
  onToggleFeatured?: () => void;
  showControls?: boolean;
}

const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  size = 'md',
  onToggleFeatured,
  showControls = false,
}) => {
  const rarityConfig = RARITY_CONFIG[badge.rarity];

  return (
    <motion.div
      className={`showcase-badge showcase-badge--${size} showcase-badge--${badge.rarity}`}
      style={{
        '--rarity-color': rarityConfig.color,
        '--rarity-bg': rarityConfig.bgColor,
        '--rarity-glow': rarityConfig.glow,
      } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      {badge.featured && (
        <div className="showcase-badge__featured">
          <StarIcon filled />
        </div>
      )}

      <div className="showcase-badge__icon">{badge.icon}</div>
      <div className="showcase-badge__content">
        <h4 className="showcase-badge__name">{badge.name}</h4>
        <p className="showcase-badge__description">{badge.description}</p>
        <div className="showcase-badge__meta">
          <span className="showcase-badge__rarity">{badge.rarity}</span>
          <span className="showcase-badge__xp">+{badge.xpValue} XP</span>
        </div>
        <span className="showcase-badge__date">
          {new Date(badge.earnedAt).toLocaleDateString()}
        </span>
      </div>

      {showControls && (
        <button
          className="showcase-badge__star-btn"
          onClick={onToggleFeatured}
          title={badge.featured ? 'Remove from featured' : 'Add to featured'}
        >
          <StarIcon filled={badge.featured} />
        </button>
      )}
    </motion.div>
  );
};

// ============================================================================
// STATS PANEL COMPONENT
// ============================================================================

interface StatsPanelProps {
  showcase: PublicShowcase;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ showcase }) => {
  const { stats } = showcase;

  return (
    <div className="showcase-stats">
      <div className="showcase-stats__grid">
        <div className="showcase-stats__item">
          <span className="showcase-stats__value">{stats.totalBadges}</span>
          <span className="showcase-stats__label">Total Badges</span>
        </div>
        <div className="showcase-stats__item showcase-stats__item--legendary">
          <span className="showcase-stats__value">{stats.legendaryCount}</span>
          <span className="showcase-stats__label">Legendary</span>
        </div>
        <div className="showcase-stats__item showcase-stats__item--epic">
          <span className="showcase-stats__value">{stats.epicCount}</span>
          <span className="showcase-stats__label">Epic</span>
        </div>
        <div className="showcase-stats__item showcase-stats__item--xp">
          <span className="showcase-stats__value">{stats.totalXP.toLocaleString()}</span>
          <span className="showcase-stats__label">Total XP</span>
        </div>
      </div>

      <div className="showcase-stats__engagement">
        <span className="showcase-stats__engagement-item">
          <EyeIcon /> {showcase.viewCount.toLocaleString()} views
        </span>
        <span className="showcase-stats__engagement-item">
          <ShareIcon /> {stats.shareCount} shares
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// SHARE PANEL COMPONENT
// ============================================================================

interface SharePanelProps {
  showcase: PublicShowcase;
  onShare: (platform: SharePlatform) => void;
}

const SharePanel: React.FC<SharePanelProps> = ({ showcase, onShare }) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onShare('copy');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="showcase-share">
      <h3 className="showcase-share__title">Share Your Achievements</h3>
      
      <div className="showcase-share__buttons">
        <button className="showcase-share__btn showcase-share__btn--twitter" onClick={() => onShare('twitter')}>
          𝕏 Twitter
        </button>
        <button className="showcase-share__btn showcase-share__btn--linkedin" onClick={() => onShare('linkedin')}>
          in LinkedIn
        </button>
        <button className="showcase-share__btn showcase-share__btn--facebook" onClick={() => onShare('facebook')}>
          f Facebook
        </button>
      </div>

      <div className="showcase-share__link">
        <input type="text" value={showcase.shareUrl} readOnly />
        <button onClick={handleCopy}>
          <CopyIcon />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <button 
        className="showcase-share__embed-toggle"
        onClick={() => setShowEmbed(!showEmbed)}
      >
        <CodeIcon />
        {showEmbed ? 'Hide' : 'Show'} Embed Code
      </button>

      {showEmbed && (
        <div className="showcase-share__embed">
          <textarea value={showcase.embedCode} readOnly rows={4} />
          <button onClick={() => onShare('embed')}>
            <CopyIcon /> Copy Embed Code
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CONFIG PANEL COMPONENT
// ============================================================================

interface ConfigPanelProps {
  config: ShowcaseConfig;
  onChange: (config: Partial<ShowcaseConfig>) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
  return (
    <div className="showcase-config">
      <h3 className="showcase-config__title">
        <SettingsIcon /> Customize Showcase
      </h3>

      <div className="showcase-config__section">
        <label>Layout</label>
        <div className="showcase-config__layouts">
          {(Object.keys(LAYOUT_CONFIG) as ShowcaseLayout[]).map((layout) => (
            <button
              key={layout}
              className={`showcase-config__layout-btn ${config.layout === layout ? 'active' : ''}`}
              onClick={() => onChange({ layout })}
              title={LAYOUT_CONFIG[layout].description}
            >
              <span className="showcase-config__layout-icon">{LAYOUT_CONFIG[layout].icon}</span>
              <span>{LAYOUT_CONFIG[layout].name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="showcase-config__section">
        <label>Theme</label>
        <div className="showcase-config__themes">
          {(Object.keys(THEME_CONFIG) as ShowcaseTheme[]).map((theme) => (
            <button
              key={theme}
              className={`showcase-config__theme-btn ${config.theme === theme ? 'active' : ''}`}
              onClick={() => onChange({ theme })}
              style={{ background: THEME_CONFIG[theme].preview }}
            >
              {config.theme === theme && '✓'}
            </button>
          ))}
        </div>
      </div>

      <div className="showcase-config__toggles">
        <label className="showcase-config__toggle">
          <input
            type="checkbox"
            checked={config.showStats}
            onChange={(e) => onChange({ showStats: e.target.checked })}
          />
          <span>Show Statistics</span>
        </label>
        <label className="showcase-config__toggle">
          <input
            type="checkbox"
            checked={config.featuredFirst}
            onChange={(e) => onChange({ featuredFirst: e.target.checked })}
          />
          <span>Featured First</span>
        </label>
        <label className="showcase-config__toggle">
          <input
            type="checkbox"
            checked={config.enableSharing}
            onChange={(e) => onChange({ enableSharing: e.target.checked })}
          />
          <span>Enable Sharing</span>
        </label>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN SHOWCASE PAGE
// ============================================================================

export default function ShowcasePage() {
  const [showcaseId, setShowcaseId] = useState<string | null>(null);
  const { showcase, loading, error, updateConfig, toggleFeatured, share } = useShowcase(showcaseId || undefined);
  const { create, loading: creating } = useCreateShowcase();
  const { analytics: _analytics } = useShowcaseAnalytics(showcaseId || undefined);
  
  const [showConfig, setShowConfig] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Create showcase on mount if none exists
  React.useEffect(() => {
    if (!showcaseId && !loading) {
      create('current_user_id').then((created) => {
        if (created) {
          setShowcaseId(created.id);
        }
      });
    }
  }, [showcaseId, loading, create]);

  const handleShare = useCallback(async (platform: SharePlatform) => {
    const result = await share(platform);
    if (result?.success) {
      setNotification(`Shared to ${platform}!`);
      setTimeout(() => setNotification(null), 3000);
    }
  }, [share]);

  const handleConfigChange = useCallback((config: Partial<ShowcaseConfig>) => {
    updateConfig(config);
  }, [updateConfig]);

  const sortedBadges = React.useMemo(() => {
    if (!showcase) return [];
    const badges = [...showcase.badges];
    if (showcase.config.featuredFirst) {
      badges.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return badges.slice(0, showcase.config.maxBadges);
  }, [showcase]);

  if (loading || creating) {
    return (
      <div className="showcase-page showcase-page--loading">
        <div className="showcase-page__spinner" />
        <p>Loading your achievements...</p>
      </div>
    );
  }

  if (error || !showcase) {
    return (
      <div className="showcase-page showcase-page--error">
        <h2>Unable to load showcase</h2>
        <p>{error || 'Please try again later'}</p>
      </div>
    );
  }

  return (
    <div className={`showcase-page showcase-page--${showcase.config.theme}`}>
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className="showcase-page__notification"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="showcase-page__header">
        <div className="showcase-page__user">
          <img
            src={showcase.userAvatar}
            alt={showcase.userName}
            className="showcase-page__avatar"
          />
          <div className="showcase-page__user-info">
            <h1 className="showcase-page__username">{showcase.userName}</h1>
            <span className="showcase-page__level">Level {showcase.userLevel}</span>
          </div>
        </div>

        <div className="showcase-page__actions">
          <button
            className="showcase-page__config-btn"
            onClick={() => setShowConfig(!showConfig)}
          >
            <SettingsIcon />
            Customize
          </button>
        </div>
      </header>

      {/* Stats */}
      {showcase.config.showStats && <StatsPanel showcase={showcase} />}

      {/* Config Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <ConfigPanel config={showcase.config} onChange={handleConfigChange} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badges Grid */}
      <section className="showcase-page__badges">
        <h2 className="showcase-page__section-title">
          🏆 Achievements ({showcase.stats.totalBadges})
        </h2>

        <div className={`showcase-badges showcase-badges--${showcase.config.layout}`}>
          {sortedBadges.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              size={showcase.config.layout === 'featured' && badge.featured ? 'lg' : 'md'}
              onToggleFeatured={() => toggleFeatured(badge.id)}
              showControls
            />
          ))}
        </div>

        {showcase.badges.length > showcase.config.maxBadges && (
          <p className="showcase-page__more">
            And {showcase.badges.length - showcase.config.maxBadges} more achievements...
          </p>
        )}
      </section>

      {/* Share Panel */}
      {showcase.config.enableSharing && (
        <SharePanel showcase={showcase} onShare={handleShare} />
      )}

      {/* Footer */}
      <footer className="showcase-page__footer">
        <p>
          Powered by <strong>CUBE Nexum</strong> • Create your own showcase at{' '}
          <a href="https://cubenexum.com/gamification">cubenexum.com</a>
        </p>
      </footer>
    </div>
  );
}
