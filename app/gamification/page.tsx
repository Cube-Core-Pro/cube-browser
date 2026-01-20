"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { GamificationCenter } from '@/components/gamification/GamificationCenter';
import './page.css';

// ============================================================================
// GAMIFICATION PAGE - CUBE Nexum v7.0.0
// Complete Gamification Hub with XP, Levels, Achievements, Streaks & Leaderboards
// ============================================================================

interface PageNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'xp' | 'achievement' | 'level-up';
  title: string;
  message: string;
  icon?: string;
  xpAmount?: number;
  achievementId?: string;
  newLevel?: number;
}

interface GamificationStats {
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  challengesCompleted: number;
  rewardsEarned: number;
  rank: number;
  percentile: number;
}

export default function GamificationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [notifications, setNotifications] = useState<PageNotification[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);

  // Load initial stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await invoke<GamificationStats>('gamification_get_stats', {
          userId: 'current_user'
        });

        setStats(result);

        // Show welcome for new users
        if (result.totalXp === 0) {
          setShowWelcome(true);
        }
      } catch (err) {
        log.error('Failed to load gamification stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load gamification data');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  // Handle daily check-in
  const handleCheckIn = useCallback(async () => {
    try {
      const result = await invoke<{ xpEarned: number; newStreak: number; bonusXp: number }>('gamification_check_in', {
        userId: 'current_user'
      });

      // Add notification
      const notification: PageNotification = {
        id: `checkin-${Date.now()}`,
        type: 'xp',
        title: '🎉 Daily Check-in!',
        message: `+${result.xpEarned} XP earned! Streak: ${result.newStreak} days`,
        xpAmount: result.xpEarned
      };

      if (result.bonusXp > 0) {
        notification.message += ` (+${result.bonusXp} bonus XP!)`;
      }

      setNotifications(prev => [...prev, notification]);

      // Remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);

      // Reload stats
      const newStats = await invoke<GamificationStats>('gamification_get_stats', {
        userId: 'current_user'
      });
      setStats(newStats);
    } catch (err) {
      log.error('Check-in failed:', err);
      const notification: PageNotification = {
        id: `error-${Date.now()}`,
        type: 'error',
        title: 'Check-in Failed',
        message: err instanceof Error ? err.message : 'Unable to complete check-in'
      };
      setNotifications(prev => [...prev, notification]);
    }
  }, []);

  // Handle achievement unlock
  const handleAchievementUnlock = useCallback((achievementId: string, xpReward: number) => {
    const notification: PageNotification = {
      id: `achievement-${Date.now()}`,
      type: 'achievement',
      title: '🏆 Achievement Unlocked!',
      message: `You earned +${xpReward} XP`,
      achievementId,
      xpAmount: xpReward
    };

    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Handle level up
  const handleLevelUp = useCallback((newLevel: number) => {
    const notification: PageNotification = {
      id: `levelup-${Date.now()}`,
      type: 'level-up',
      title: '⬆️ Level Up!',
      message: `Congratulations! You reached Level ${newLevel}`,
      newLevel
    };

    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 7000);
  }, []);

  // Handle reward claim
  const handleRewardClaim = useCallback((rewardName: string) => {
    const notification: PageNotification = {
      id: `reward-${Date.now()}`,
      type: 'success',
      title: '🎁 Reward Claimed!',
      message: `You claimed: ${rewardName}`
    };

    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Dismiss welcome modal
  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="gamification-page">
        <div className="gamification-page__loading">
          <div className="gamification-page__loading-spinner" />
          <span>Loading your achievements...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="gamification-page">
        <div className="gamification-page__error">
          <span className="gamification-page__error-icon">⚠️</span>
          <h2>Failed to Load Gamification</h2>
          <p>{error}</p>
          <button
            className="gamification-page__retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gamification-page">
      {/* Page Header */}
      <header className="gamification-page__header">
        <div className="gamification-page__header-content">
          <h1 className="gamification-page__title">
            <span className="gamification-page__title-icon">🎮</span>
            Gamification Center
          </h1>
          <p className="gamification-page__subtitle">
            Track your progress, earn achievements, and climb the leaderboard!
          </p>
        </div>
        
        {/* Quick Stats Bar */}
        {stats && (
          <div className="gamification-page__quick-stats">
            <div className="gamification-page__stat">
              <span className="gamification-page__stat-value">{stats.totalXp.toLocaleString()}</span>
              <span className="gamification-page__stat-label">Total XP</span>
            </div>
            <div className="gamification-page__stat">
              <span className="gamification-page__stat-value">Lvl {stats.currentLevel}</span>
              <span className="gamification-page__stat-label">Level</span>
            </div>
            <div className="gamification-page__stat">
              <span className="gamification-page__stat-value">🔥 {stats.currentStreak}</span>
              <span className="gamification-page__stat-label">Day Streak</span>
            </div>
            <div className="gamification-page__stat">
              <span className="gamification-page__stat-value">#{stats.rank}</span>
              <span className="gamification-page__stat-label">Global Rank</span>
            </div>
            <button 
              className="gamification-page__checkin-button"
              onClick={handleCheckIn}
            >
              ✅ Daily Check-in
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="gamification-page__main">
        <GamificationCenter
          onAchievementUnlock={handleAchievementUnlock}
          onLevelUp={handleLevelUp}
          onRewardClaim={handleRewardClaim}
        />
      </main>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="gamification-page__notifications">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`gamification-page__notification gamification-page__notification--${notification.type}`}
            >
              <div className="gamification-page__notification-content">
                <span className="gamification-page__notification-title">
                  {notification.title}
                </span>
                <span className="gamification-page__notification-message">
                  {notification.message}
                </span>
              </div>
              <button
                className="gamification-page__notification-dismiss"
                onClick={() => dismissNotification(notification.id)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Welcome Modal for New Users */}
      {showWelcome && (
        <div className="gamification-page__modal-overlay">
          <div className="gamification-page__welcome-modal">
            <div className="gamification-page__welcome-icon">🎮</div>
            <h2>Welcome to CUBE Gamification!</h2>
            <p>
              Turn your productivity into a game! Complete challenges, unlock achievements,
              and compete with others on the global leaderboard.
            </p>
            <div className="gamification-page__welcome-features">
              <div className="gamification-page__welcome-feature">
                <span>⭐</span>
                <span>Earn XP for every action</span>
              </div>
              <div className="gamification-page__welcome-feature">
                <span>🏆</span>
                <span>Unlock 40+ achievements</span>
              </div>
              <div className="gamification-page__welcome-feature">
                <span>🔥</span>
                <span>Build daily streaks</span>
              </div>
              <div className="gamification-page__welcome-feature">
                <span>🎁</span>
                <span>Claim exclusive rewards</span>
              </div>
            </div>
            <button
              className="gamification-page__welcome-button"
              onClick={dismissWelcome}
            >
              Let&apos;s Get Started! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
