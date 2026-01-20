'use client';

/**
 * CUBE Nexum - Social Proof Widget
 * 
 * Floating notification for real-time social proof
 * Displays user activity, reviews, and live stats
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useSocialProof,
  useLiveStats,
  useTestimonials,
  PROOF_TYPE_CONFIG,
  formatTimeSaved,
  formatNumber,
  type SocialProofItem,
  type LiveStats,
  type Testimonial,
  type SocialProofConfig,
} from '@/lib/services/social-proof-service';
import './SocialProofWidget.css';

// ============================================================================
// ICONS
// ============================================================================

const CloseIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const UsersIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const GlobeIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const StarIcon: React.FC<{ filled?: boolean }> = ({ filled = true }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const VerifiedIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

// ============================================================================
// PROOF NOTIFICATION
// ============================================================================

interface ProofNotificationProps {
  proof: SocialProofItem;
  position: SocialProofConfig['position'];
  onDismiss: () => void;
}

const ProofNotification: React.FC<ProofNotificationProps> = ({
  proof,
  position,
  onDismiss,
}) => {
  const config = PROOF_TYPE_CONFIG[proof.type];
  const isLeft = position.includes('left');
  const _isTop = position.includes('top');

  return (
    <motion.div
      className={`social-proof-notification social-proof-notification--${position}`}
      initial={{ opacity: 0, x: isLeft ? -100 : 100, y: 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: isLeft ? -100 : 100 }}
      style={{
        '--proof-color': config.color,
      } as React.CSSProperties}
    >
      <div className="social-proof-notification__icon">{proof.icon}</div>
      
      <div className="social-proof-notification__content">
        <div className="social-proof-notification__header">
          <span className="social-proof-notification__title">{proof.title}</span>
          {proof.user.verified && (
            <span className="social-proof-notification__verified">
              <VerifiedIcon />
            </span>
          )}
        </div>
        <p className="social-proof-notification__description">{proof.description}</p>
        <span className="social-proof-notification__time">Just now</span>
      </div>

      <button className="social-proof-notification__close" onClick={onDismiss}>
        <CloseIcon />
      </button>
    </motion.div>
  );
};

// ============================================================================
// LIVE STATS BAR
// ============================================================================

interface LiveStatsBarProps {
  stats: LiveStats;
  compact?: boolean;
}

const LiveStatsBar: React.FC<LiveStatsBarProps> = ({ stats, compact = false }) => {
  const [animatedStats, setAnimatedStats] = useState(stats);

  // Smooth animation for stat changes
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedStats((prev) => ({
        ...prev,
        activeUsers: prev.activeUsers + (stats.activeUsers > prev.activeUsers ? 1 : -1),
        workflowsRun: prev.workflowsRun + (stats.workflowsRun > prev.workflowsRun ? 1 : 0),
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [stats]);

  if (compact) {
    return (
      <div className="live-stats-bar live-stats-bar--compact">
        <span className="live-stats-bar__item">
          <span className="live-stats-bar__dot live-stats-bar__dot--pulse" />
          <UsersIcon /> {formatNumber(animatedStats.activeUsers)} online
        </span>
      </div>
    );
  }

  return (
    <div className="live-stats-bar">
      <div className="live-stats-bar__item">
        <span className="live-stats-bar__dot live-stats-bar__dot--pulse" />
        <UsersIcon />
        <span className="live-stats-bar__value">{formatNumber(animatedStats.activeUsers)}</span>
        <span className="live-stats-bar__label">online now</span>
      </div>

      <div className="live-stats-bar__divider" />

      <div className="live-stats-bar__item">
        <GlobeIcon />
        <span className="live-stats-bar__value">{stats.countries}</span>
        <span className="live-stats-bar__label">countries</span>
      </div>

      <div className="live-stats-bar__divider" />

      <div className="live-stats-bar__item">
        <ClockIcon />
        <span className="live-stats-bar__value">{formatTimeSaved(stats.timeSaved)}</span>
        <span className="live-stats-bar__label">saved today</span>
      </div>

      <div className="live-stats-bar__divider" />

      <div className="live-stats-bar__item">
        <StarIcon />
        <span className="live-stats-bar__value">{stats.averageRating}</span>
        <span className="live-stats-bar__label">({formatNumber(stats.totalReviews)} reviews)</span>
      </div>
    </div>
  );
};

// ============================================================================
// TESTIMONIAL CARD
// ============================================================================

interface TestimonialCardProps {
  testimonial: Testimonial;
  size?: 'sm' | 'md' | 'lg';
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  testimonial,
  size = 'md',
}) => {
  return (
    <div className={`testimonial-card testimonial-card--${size}`}>
      <div className="testimonial-card__rating">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} filled={i < testimonial.rating} />
        ))}
      </div>

      <blockquote className="testimonial-card__content">
        &ldquo;{testimonial.content}&rdquo;
      </blockquote>

      {testimonial.metrics && (
        <div className="testimonial-card__metrics">
          <span className="testimonial-card__metric-value">{testimonial.metrics.value}</span>
          <span className="testimonial-card__metric-label">{testimonial.metrics.label}</span>
          <span className="testimonial-card__metric-improvement">{testimonial.metrics.improvement}</span>
        </div>
      )}

      <div className="testimonial-card__author">
        <img
          src={testimonial.author.avatar}
          alt={testimonial.author.name}
          className="testimonial-card__avatar"
        />
        <div className="testimonial-card__author-info">
          <span className="testimonial-card__author-name">
            {testimonial.author.name}
            {testimonial.author.verified && <VerifiedIcon />}
          </span>
          <span className="testimonial-card__author-title">
            {testimonial.author.title}, {testimonial.author.company}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TESTIMONIAL CAROUSEL
// ============================================================================

interface TestimonialCarouselProps {
  autoplay?: boolean;
  interval?: number;
}

export const TestimonialCarousel: React.FC<TestimonialCarouselProps> = ({
  autoplay = true,
  interval = 5000,
}) => {
  const testimonials = useTestimonials({ featured: true, limit: 5 });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!autoplay || testimonials.length === 0) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoplay, interval, testimonials.length]);

  if (testimonials.length === 0) return null;

  return (
    <div className="testimonial-carousel">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <TestimonialCard testimonial={testimonials[activeIndex]} size="lg" />
        </motion.div>
      </AnimatePresence>

      <div className="testimonial-carousel__dots">
        {testimonials.map((_, index) => (
          <button
            key={index}
            className={`testimonial-carousel__dot ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN WIDGET
// ============================================================================

interface SocialProofWidgetProps {
  showNotifications?: boolean;
  showStats?: boolean;
  position?: SocialProofConfig['position'];
}

export const SocialProofWidget: React.FC<SocialProofWidgetProps> = ({
  showNotifications = true,
  showStats = true,
  position = 'bottom-left',
}) => {
  const { currentProof, dismiss, config: _config } = useSocialProof();
  const stats = useLiveStats();

  return (
    <div className="social-proof-widget">
      {/* Live Stats Bar */}
      {showStats && <LiveStatsBar stats={stats} />}

      {/* Floating Notifications */}
      {showNotifications && (
        <div className={`social-proof-notifications social-proof-notifications--${position}`}>
          <AnimatePresence>
            {currentProof && (
              <ProofNotification
                proof={currentProof}
                position={position}
                onDismiss={dismiss}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { LiveStatsBar };
export default SocialProofWidget;
