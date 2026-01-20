'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Video,
  TrendingUp,
  Share2,
  Users,
  BarChart3,
  Sparkles,
  Calendar,
  MessageCircle,
  Hash,
  Scissors,
  Music,
  Palette,
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Globe
} from 'lucide-react';
import './SocialTour.css';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  action?: string;
}

interface SocialTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to Social Hub',
    description: 'Your command center for social media dominance. Create viral content, schedule posts, analyze performance, and grow your audience across all platforms.',
    icon: <Share2 className="tour-icon" />,
    highlight: 'social-dashboard',
    action: 'Explore social tools'
  },
  {
    title: 'Video Shorts Creator',
    description: 'Create TikTok, Reels, and YouTube Shorts with AI assistance. One-click editing, auto-captions, trending templates, and multi-platform publishing.',
    icon: <Video className="tour-icon" />,
    highlight: 'video-creator',
    action: 'Video → Create Short'
  },
  {
    title: 'AI Video Editor',
    description: 'Edit videos with AI. Auto-trim dead air, enhance audio, add effects, generate captions, and apply trending styles with one click.',
    icon: <Scissors className="tour-icon" />,
    highlight: 'video-editor',
    action: 'Edit → AI Enhance'
  },
  {
    title: 'Trending Audio Library',
    description: 'Access 10,000+ trending sounds, music, and effects. AI recommends audio that increases engagement based on your content type.',
    icon: <Music className="tour-icon" />,
    highlight: 'audio-library',
    action: 'Audio → Trending Sounds'
  },
  {
    title: 'Content Scheduler',
    description: 'Plan and schedule posts for optimal times. AI analyzes your audience to recommend the best posting schedule across all platforms.',
    icon: <Calendar className="tour-icon" />,
    highlight: 'scheduler',
    action: 'Schedule → New Post'
  },
  {
    title: 'Multi-Platform Publishing',
    description: 'Publish to TikTok, Instagram, YouTube, Twitter, LinkedIn, and Facebook from one place. Auto-format content for each platform.',
    icon: <Globe className="tour-icon" />,
    highlight: 'multi-platform',
    action: 'Publish → All Platforms'
  },
  {
    title: 'AI Caption Generator',
    description: 'Generate engaging captions, hashtags, and hooks with AI. Trained on viral content to maximize reach and engagement.',
    icon: <MessageCircle className="tour-icon" />,
    highlight: 'captions',
    action: 'AI → Generate Caption'
  },
  {
    title: 'Hashtag Research',
    description: 'Discover trending hashtags for your niche. AI analyzes millions of posts to find the perfect tags for maximum discoverability.',
    icon: <Hash className="tour-icon" />,
    highlight: 'hashtags',
    action: 'Research → Find Hashtags'
  },
  {
    title: 'Viral Analytics',
    description: 'Real-time analytics across all platforms. Track views, engagement, follower growth, and revenue. AI predicts which content will go viral.',
    icon: <BarChart3 className="tour-icon" />,
    highlight: 'analytics',
    action: 'Analytics → Performance'
  },
  {
    title: 'Trend Detection',
    description: 'AI monitors trends 24/7. Get alerts when relevant trends emerge so you can create timely content that rides the wave.',
    icon: <TrendingUp className="tour-icon" />,
    highlight: 'trends',
    action: 'Trends → Discover'
  },
  {
    title: 'Audience Insights',
    description: 'Deep analytics on your audience. Demographics, best posting times, content preferences, and growth opportunities.',
    icon: <Users className="tour-icon" />,
    highlight: 'audience',
    action: 'Audience → Insights'
  },
  {
    title: 'AI Content Ideas',
    description: 'Never run out of content ideas. AI generates personalized suggestions based on your niche, trends, and what works for your audience.',
    icon: <Sparkles className="tour-icon" />,
    highlight: 'ideas',
    action: 'AI → Content Ideas'
  },
  {
    title: 'Brand Kit',
    description: 'Store your brand colors, fonts, logos, and templates. Apply consistent branding across all content with one click.',
    icon: <Palette className="tour-icon" />,
    highlight: 'brand-kit',
    action: 'Brand → Edit Kit'
  },
  {
    title: 'Go Viral!',
    description: 'You have all the tools to dominate social media. Start by creating your first short or scheduling content for the week.',
    icon: <CheckCircle className="tour-icon success" />,
    action: 'Create your first viral video!'
  }
];

export const SocialTour: React.FC<SocialTourProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleComplete = useCallback(() => {
    localStorage.setItem('social-tour-completed', 'true');
    if (onComplete) {
      onComplete();
    }
    onClose();
  }, [onComplete, onClose]);

  const handleNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setCompletedSteps([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <div className="social-tour-overlay" onClick={onClose}>
      <div className="social-tour-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="tour-close-btn"
          onClick={onClose}
          aria-label="Close tour"
          type="button"
        >
          <X size={18} />
        </button>

        <div className="tour-content">
          <div className="tour-icon-wrapper">
            {step.icon}
          </div>
          
          <h2 className="tour-title">{step.title}</h2>
          <p className="tour-description">{step.description}</p>

          {step.action && (
            <div className="tour-action">
              <Zap size={16} className="action-icon" />
              <span className="action-label">Quick Action:</span>
              <span className="action-text">{step.action}</span>
            </div>
          )}
        </div>

        <div className="tour-footer">
          <div className="tour-progress">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                className={`progress-dot ${
                  index === currentStep ? 'active' : ''
                } ${completedSteps.includes(index) ? 'completed' : ''}`}
                onClick={() => goToStep(index)}
                aria-label={`Go to step ${index + 1}`}
                type="button"
              />
            ))}
          </div>

          <div className="tour-nav">
            <span className="step-counter">
              {currentStep + 1} of {tourSteps.length}
            </span>
            
            <div className="nav-buttons">
              {currentStep > 0 && (
                <button
                  className="nav-btn prev"
                  onClick={handlePrev}
                  type="button"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
              )}
              
              <button
                className={`nav-btn next ${isLastStep ? 'complete' : ''}`}
                onClick={handleNext}
                type="button"
              >
                {isLastStep ? (
                  <>
                    Get Started
                    <CheckCircle size={18} />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialTour;
