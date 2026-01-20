'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Mail,
  Sparkles,
  BarChart3,
  Palette,
  Split,
  Globe,
  Bot,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  MousePointer,
  Workflow,
  Zap,
  Users,
  TrendingUp
} from 'lucide-react';
import './MarketingTour.css';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  action?: string;
}

interface MarketingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to Marketing Hub',
    description: 'Your all-in-one marketing automation center. Create campaigns, build funnels, automate workflows, and track ROI with AI-powered insights.',
    icon: <Megaphone className="tour-icon" />,
    highlight: 'marketing-dashboard',
    action: 'Start your marketing journey'
  },
  {
    title: 'Email Campaign Studio',
    description: 'Design stunning email campaigns with our drag-and-drop builder. AI generates subject lines, content, and optimal send times for maximum engagement.',
    icon: <Mail className="tour-icon" />,
    highlight: 'email-campaigns',
    action: 'Create → New Email Campaign'
  },
  {
    title: 'Smart Templates',
    description: 'Access 500+ professional email templates or let AI generate custom designs based on your brand. Automatic responsive optimization for all devices.',
    icon: <Palette className="tour-icon" />,
    highlight: 'email-templates',
    action: 'Browse → Template Gallery'
  },
  {
    title: 'Funnel Builder Pro',
    description: 'Build high-converting sales funnels with visual drag-and-drop. Create landing pages, upsells, downsells, and checkout flows without coding.',
    icon: <MousePointer className="tour-icon" />,
    highlight: 'funnel-builder',
    action: 'Funnels → Create Funnel'
  },
  {
    title: 'A/B Testing Engine',
    description: 'Test everything automatically. AI splits traffic, analyzes results, and auto-selects winners. Test subject lines, content, landing pages, and CTAs.',
    icon: <Split className="tour-icon" />,
    highlight: 'ab-testing',
    action: 'Create → Split Test'
  },
  {
    title: 'Marketing Automation',
    description: 'Design complex automation workflows visually. Trigger sequences based on behavior, time, tags, or custom events. Set up once, run forever.',
    icon: <Workflow className="tour-icon" />,
    highlight: 'automation-workflows',
    action: 'Automation → New Workflow'
  },
  {
    title: 'AI Content Generator',
    description: 'Generate blog posts, ad copy, social content, and email sequences with AI. Trained on your brand voice for consistent messaging across channels.',
    icon: <Sparkles className="tour-icon" />,
    highlight: 'ai-content',
    action: 'AI → Generate Content'
  },
  {
    title: 'Multi-Channel Campaigns',
    description: 'Orchestrate campaigns across email, SMS, push notifications, social media, and ads. Unified dashboard for all your marketing channels.',
    icon: <Globe className="tour-icon" />,
    highlight: 'multi-channel',
    action: 'Campaigns → Multi-Channel'
  },
  {
    title: 'Audience Segmentation',
    description: 'AI-powered audience segmentation based on behavior, demographics, and engagement. Create dynamic segments that update automatically.',
    icon: <Users className="tour-icon" />,
    highlight: 'segmentation',
    action: 'Audience → Segments'
  },
  {
    title: 'Campaign Analytics',
    description: 'Real-time analytics with AI insights. Track open rates, click rates, conversions, and revenue attribution. Predictive analytics forecast campaign performance.',
    icon: <BarChart3 className="tour-icon" />,
    highlight: 'analytics',
    action: 'Analytics → Performance'
  },
  {
    title: 'AI Marketing Assistant',
    description: 'Ask our AI to analyze campaigns, suggest improvements, or create entire marketing strategies. Natural language control of all marketing features.',
    icon: <Bot className="tour-icon" />,
    highlight: 'ai-assistant',
    action: 'Press Cmd+K for AI Assistant'
  },
  {
    title: 'ROI Dashboard',
    description: 'See exactly what each campaign generates. Track customer acquisition cost, lifetime value, and marketing ROI in real-time.',
    icon: <TrendingUp className="tour-icon" />,
    highlight: 'roi-dashboard',
    action: 'Analytics → ROI Report'
  },
  {
    title: 'Ready to Convert!',
    description: 'You\'re all set to launch powerful marketing campaigns. Start by creating an email campaign, building a funnel, or asking AI to develop your strategy.',
    icon: <CheckCircle className="tour-icon success" />,
    action: 'Explore Marketing Hub'
  }
];

export const MarketingTour: React.FC<MarketingTourProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleComplete = useCallback(() => {
    localStorage.setItem('marketing-tour-completed', 'true');
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
    <div className="marketing-tour-overlay" onClick={onClose}>
      <div className="marketing-tour-modal" onClick={(e) => e.stopPropagation()}>
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

export default MarketingTour;
