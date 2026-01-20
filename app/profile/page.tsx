/**
 * User Profile Page
 * 
 * Comprehensive user profile with stats, achievements, and social features
 * CUBE Nexum v7.0.0
 * 
 * @page /profile
 */

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useCurrentProfile, 
  useUserActivity as _useUserActivity,
  TIER_COLORS,
  TIER_LABELS,
  BADGE_RARITY_COLORS,
  type UserProfile,
  type UserBadge
} from '@/lib/services/user-profile-service';
import { ActivityFeed } from '@/components/activity';
import './profile.css';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  change?: number;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, change, color }) => (
  <motion.div 
    className="stat-card"
    whileHover={{ scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 400 }}
  >
    <div className="stat-card__icon" style={{ color }}>
      {icon}
    </div>
    <div className="stat-card__content">
      <div className="stat-card__value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="stat-card__label">{label}</div>
      {change !== undefined && change !== 0 && (
        <div className={`stat-card__change ${change > 0 ? 'stat-card__change--positive' : 'stat-card__change--negative'}`}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      )}
    </div>
  </motion.div>
);

interface BadgeDisplayProps {
  badge: UserBadge;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badge }) => (
  <motion.div 
    className="badge-display"
    whileHover={{ scale: 1.05, y: -2 }}
    style={{ borderColor: BADGE_RARITY_COLORS[badge.rarity] }}
  >
    <div className="badge-display__icon">{badge.icon}</div>
    <div className="badge-display__info">
      <div className="badge-display__name">{badge.name}</div>
      <div 
        className="badge-display__rarity"
        style={{ color: BADGE_RARITY_COLORS[badge.rarity] }}
      >
        {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
      </div>
    </div>
    <div className="badge-display__tooltip">
      <strong>{badge.name}</strong>
      <p>{badge.description}</p>
      <span>Unlocked: {new Date(badge.unlockedAt).toLocaleDateString()}</span>
    </div>
  </motion.div>
);

interface LevelProgressProps {
  level: number;
  xp: number;
  nextLevelXp: number;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ level, xp, nextLevelXp }) => {
  const prevLevelXp = Math.floor(nextLevelXp * 0.7);
  const progress = ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100;
  const xpToNext = nextLevelXp - xp;

  return (
    <div className="level-progress">
      <div className="level-progress__header">
        <div className="level-progress__level">
          <span className="level-progress__level-badge">Lvl {level}</span>
          <span className="level-progress__xp">{xp.toLocaleString()} XP</span>
        </div>
        <div className="level-progress__next">
          {xpToNext.toLocaleString()} XP to Level {level + 1}
        </div>
      </div>
      <div className="level-progress__bar">
        <motion.div 
          className="level-progress__fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

interface TabProps {
  tabs: { id: string; label: string; icon: string }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNav: React.FC<TabProps> = ({ tabs, activeTab, onTabChange }) => (
  <div className="tab-nav">
    {tabs.map(tab => (
      <button
        key={tab.id}
        className={`tab-nav__tab ${activeTab === tab.id ? 'tab-nav__tab--active' : ''}`}
        onClick={() => onTabChange(tab.id)}
      >
        <span className="tab-nav__icon">{tab.icon}</span>
        <span className="tab-nav__label">{tab.label}</span>
      </button>
    ))}
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'activity', label: 'Activity', icon: '📰' },
  { id: 'workflows', label: 'Workflows', icon: '⚡' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

export default function ProfilePage() {
  const { profile, loading, error, updateProfile } = useCurrentProfile();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    company: ''
  });

  useEffect(() => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName,
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        company: profile.company || ''
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    await updateProfile(editForm);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="profile-page profile-page--loading">
        <div className="profile-page__loader">
          <div className="profile-page__spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page profile-page--error">
        <div className="profile-page__error">
          <span className="profile-page__error-icon">😕</span>
          <h2>Failed to load profile</h2>
          <p>{error || 'Profile not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header Section */}
      <header className="profile-header">
        <div className="profile-header__bg" />
        <div className="profile-header__content">
          <div className="profile-header__avatar-section">
            <div className="profile-header__avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.displayName} />
              ) : (
                <div className="profile-header__avatar-placeholder">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {profile.verified && (
                <div className="profile-header__verified" title="Verified">✓</div>
              )}
            </div>
            <div className="profile-header__info">
              <div className="profile-header__name-row">
                <h1 className="profile-header__name">{profile.displayName}</h1>
                <span 
                  className="profile-header__tier"
                  style={{ background: TIER_COLORS[profile.tier] }}
                >
                  {TIER_LABELS[profile.tier]}
                </span>
              </div>
              <p className="profile-header__username">@{profile.username}</p>
              {profile.bio && <p className="profile-header__bio">{profile.bio}</p>}
              <div className="profile-header__meta">
                {profile.location && (
                  <span className="profile-header__meta-item">📍 {profile.location}</span>
                )}
                {profile.company && (
                  <span className="profile-header__meta-item">🏢 {profile.company}</span>
                )}
                {profile.website && (
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="profile-header__meta-item profile-header__meta-item--link"
                  >
                    🔗 {profile.website.replace('https://', '')}
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="profile-header__actions">
            <button 
              className="profile-header__edit-btn"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Edit Profile
            </button>
            <button className="profile-header__share-btn">
              📤 Share
            </button>
          </div>
        </div>
        
        {/* Social Stats */}
        <div className="profile-header__social-stats">
          <div className="profile-header__social-stat">
            <span className="profile-header__social-value">{profile.stats.followers.toLocaleString()}</span>
            <span className="profile-header__social-label">Followers</span>
          </div>
          <div className="profile-header__social-stat">
            <span className="profile-header__social-value">{profile.stats.following.toLocaleString()}</span>
            <span className="profile-header__social-label">Following</span>
          </div>
          <div className="profile-header__social-stat">
            <span className="profile-header__social-value">{profile.stats.workflowsShared.toLocaleString()}</span>
            <span className="profile-header__social-label">Shared</span>
          </div>
        </div>
      </header>

      {/* Level Progress */}
      <section className="profile-section">
        <LevelProgress 
          level={profile.stats.level}
          xp={profile.stats.totalXp}
          nextLevelXp={Math.floor(profile.stats.totalXp * 1.3)}
        />
      </section>

      {/* Tab Navigation */}
      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="profile-content"
        >
          {activeTab === 'overview' && (
            <OverviewTab profile={profile} />
          )}
          {activeTab === 'achievements' && (
            <AchievementsTab profile={profile} />
          )}
          {activeTab === 'activity' && (
            <ActivityTab userId={profile.id} />
          )}
          {activeTab === 'workflows' && (
            <WorkflowsTab profile={profile} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab profile={profile} onUpdate={updateProfile} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            className="profile-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditing(false)}
          >
            <motion.div 
              className="profile-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="profile-modal__header">
                <h2>Edit Profile</h2>
                <button className="profile-modal__close" onClick={() => setIsEditing(false)}>
                  ✕
                </button>
              </div>
              <div className="profile-modal__content">
                <div className="profile-modal__field">
                  <label>Display Name</label>
                  <input 
                    type="text"
                    value={editForm.displayName}
                    onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                  />
                </div>
                <div className="profile-modal__field">
                  <label>Bio</label>
                  <textarea 
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="profile-modal__field">
                  <label>Location</label>
                  <input 
                    type="text"
                    value={editForm.location}
                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>
                <div className="profile-modal__field">
                  <label>Website</label>
                  <input 
                    type="url"
                    value={editForm.website}
                    onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                  />
                </div>
                <div className="profile-modal__field">
                  <label>Company</label>
                  <input 
                    type="text"
                    value={editForm.company}
                    onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                  />
                </div>
              </div>
              <div className="profile-modal__actions">
                <button className="profile-modal__cancel" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button className="profile-modal__save" onClick={handleSaveProfile}>
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

interface TabComponentProps {
  profile: UserProfile;
}

const OverviewTab: React.FC<TabComponentProps> = ({ profile }) => (
  <div className="overview-tab">
    {/* Stats Grid */}
    <section className="overview-section">
      <h3 className="overview-section__title">📊 Statistics</h3>
      <div className="stats-grid">
        <StatCard icon="⚡" value={profile.stats.totalXp} label="Total XP" color="#8b5cf6" />
        <StatCard icon="🔥" value={profile.stats.currentStreak} label="Day Streak" color="#ef4444" />
        <StatCard icon="📋" value={profile.stats.workflowsCreated} label="Workflows" color="#3b82f6" />
        <StatCard icon="🤖" value={profile.stats.automationsRun} label="Automations" color="#10b981" />
        <StatCard icon="📊" value={profile.stats.dataExtracted} label="Data Points" color="#f59e0b" />
        <StatCard icon="👥" value={profile.stats.referralsConverted} label="Referrals" color="#ec4899" />
        <StatCard icon="🏆" value={profile.stats.achievementsUnlocked} label="Achievements" color="#8b5cf6" />
        <StatCard icon="🎯" value={profile.stats.challengesCompleted} label="Challenges" color="#06b6d4" />
      </div>
    </section>

    {/* Badges Preview */}
    <section className="overview-section">
      <h3 className="overview-section__title">🎖️ Recent Badges</h3>
      <div className="badges-preview">
        {profile.badges.slice(0, 5).map(badge => (
          <BadgeDisplay key={badge.id} badge={badge} />
        ))}
      </div>
    </section>

    {/* Leaderboard Position */}
    <section className="overview-section">
      <h3 className="overview-section__title">🏅 Leaderboard Position</h3>
      <div className="leaderboard-preview">
        <div className="leaderboard-preview__rank">
          <span className="leaderboard-preview__rank-number">#{profile.stats.leaderboardRank}</span>
          <span className="leaderboard-preview__rank-label">Global Rank</span>
        </div>
        <div className="leaderboard-preview__percentile">
          <div className="leaderboard-preview__percentile-bar">
            <motion.div 
              className="leaderboard-preview__percentile-fill"
              initial={{ width: 0 }}
              animate={{ width: `${profile.stats.leaderboardPercentile}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <span className="leaderboard-preview__percentile-text">
            Top {100 - profile.stats.leaderboardPercentile}% of all users
          </span>
        </div>
      </div>
    </section>
  </div>
);

const AchievementsTab: React.FC<TabComponentProps> = ({ profile }) => {
  const achievementProgress = (profile.stats.achievementsUnlocked / profile.stats.totalAchievements) * 100;

  return (
    <div className="achievements-tab">
      <div className="achievements-tab__header">
        <div className="achievements-tab__progress">
          <span className="achievements-tab__count">
            {profile.stats.achievementsUnlocked} / {profile.stats.totalAchievements}
          </span>
          <span className="achievements-tab__label">Achievements Unlocked</span>
        </div>
        <div className="achievements-tab__progress-bar">
          <motion.div 
            className="achievements-tab__progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${achievementProgress}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      <div className="achievements-grid">
        {profile.badges.map(badge => (
          <motion.div 
            key={badge.id}
            className="achievement-card"
            whileHover={{ scale: 1.03 }}
            style={{ borderColor: BADGE_RARITY_COLORS[badge.rarity] }}
          >
            <div className="achievement-card__icon">{badge.icon}</div>
            <div className="achievement-card__content">
              <h4 className="achievement-card__name">{badge.name}</h4>
              <p className="achievement-card__description">{badge.description}</p>
              <div className="achievement-card__meta">
                <span 
                  className="achievement-card__rarity"
                  style={{ background: BADGE_RARITY_COLORS[badge.rarity] }}
                >
                  {badge.rarity}
                </span>
                <span className="achievement-card__date">
                  {new Date(badge.unlockedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

interface ActivityTabProps {
  userId: string;
}

const ActivityTab: React.FC<ActivityTabProps> = ({ userId }) => {
  return (
    <div className="activity-tab">
      <ActivityFeed userId={userId} showFilters showStats />
    </div>
  );
};

const WorkflowsTab: React.FC<TabComponentProps> = ({ profile: _profile }) => {
  const mockWorkflows = [
    { id: '1', name: 'Data Scraper Pro', description: 'Extract data from any website', runs: 156, shared: true },
    { id: '2', name: 'Form Filler', description: 'Automatically fill forms', runs: 89, shared: true },
    { id: '3', name: 'Price Tracker', description: 'Monitor prices across sites', runs: 234, shared: false },
  ];

  return (
    <div className="workflows-tab">
      <div className="workflows-tab__header">
        <h3>Your Workflows</h3>
        <button className="workflows-tab__create-btn">+ Create New</button>
      </div>
      <div className="workflows-grid">
        {mockWorkflows.map(workflow => (
          <motion.div 
            key={workflow.id}
            className="workflow-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="workflow-card__header">
              <span className="workflow-card__icon">⚡</span>
              <h4 className="workflow-card__name">{workflow.name}</h4>
              {workflow.shared && <span className="workflow-card__shared">Shared</span>}
            </div>
            <p className="workflow-card__description">{workflow.description}</p>
            <div className="workflow-card__stats">
              <span className="workflow-card__runs">🔄 {workflow.runs} runs</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

interface SettingsTabProps {
  profile: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => Promise<UserProfile | null>;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ profile, onUpdate }) => {
  const [notifications, setNotifications] = useState(profile.preferences.notifications);

  const handleNotificationChange = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    onUpdate({ preferences: { ...profile.preferences, notifications: updated } });
  };

  return (
    <div className="settings-tab">
      <section className="settings-section">
        <h3 className="settings-section__title">🔔 Notifications</h3>
        <div className="settings-toggles">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="settings-toggle">
              <div className="settings-toggle__info">
                <span className="settings-toggle__label">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </div>
              <button 
                className={`settings-toggle__switch ${value ? 'settings-toggle__switch--on' : ''}`}
                onClick={() => handleNotificationChange(key as keyof typeof notifications)}
              >
                <span className="settings-toggle__knob" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">🔒 Privacy</h3>
        <div className="settings-privacy">
          <p className="settings-privacy__note">
            Profile visibility: <strong>{profile.privacy.profileVisibility}</strong>
          </p>
          <button className="settings-privacy__btn">Manage Privacy Settings</button>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">🔗 Connected Accounts</h3>
        <div className="settings-connections">
          {profile.socialLinks.twitter && (
            <div className="settings-connection">
              <span>🐦 Twitter</span>
              <span>@{profile.socialLinks.twitter}</span>
            </div>
          )}
          {profile.socialLinks.github && (
            <div className="settings-connection">
              <span>🐱 GitHub</span>
              <span>@{profile.socialLinks.github}</span>
            </div>
          )}
          {profile.socialLinks.linkedin && (
            <div className="settings-connection">
              <span>💼 LinkedIn</span>
              <span>@{profile.socialLinks.linkedin}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
