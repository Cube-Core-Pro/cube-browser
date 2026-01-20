'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Workflow, Bot, Key, Globe, Database, Monitor,
  ChevronRight, ChevronLeft, Check, Sparkles, Target,
  Rocket, Crown, Gift, ArrowRight as _ArrowRight, X, Play as _Play,
  FileText as _FileText, Users, Zap as _Zap, Shield, MessageSquare as _MessageSquare
} from 'lucide-react';
import { logger } from '@/lib/services/logger-service';
import './OnboardingWizard.css';

const log = logger.scope('OnboardingWizard');

// =============================================================================
// =============================================================================

interface _OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'welcome' | 'usecase' | 'feature' | 'setup' | 'trial';
  action?: () => Promise<void>;
  features?: string[];
}

interface UseCase {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  templates: string[];
  color: string;
}

interface OnboardingState {
  completed: boolean;
  step: number;
  selectedUseCases: string[];
  completedAt?: string;
}

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

// =============================================================================
// Use Cases Configuration
// =============================================================================

const USE_CASES: UseCase[] = [
  {
    id: 'automation',
    name: 'Web Automation',
    description: 'Automate repetitive web tasks, form filling, and data entry',
    icon: <Workflow className="w-6 h-6" />,
    features: ['Visual workflow builder', 'Macro recording', 'Scheduled tasks'],
    templates: ['Form filler', 'Data scraper', 'Auto-login'],
    color: 'blue'
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Chat with CIPHER AI to get help with any task',
    icon: <Bot className="w-6 h-6" />,
    features: ['GPT-5.2 integration', 'Context awareness', 'Code generation'],
    templates: ['Email writer', 'Document summarizer', 'Research assistant'],
    color: 'purple'
  },
  {
    id: 'password-manager',
    name: 'Password Manager',
    description: 'Secure vault for all your credentials with auto-fill',
    icon: <Key className="w-6 h-6" />,
    features: ['Encrypted vault', '2FA/TOTP', 'Breach monitoring'],
    templates: ['Import from Chrome', 'Import from 1Password', 'Generate passwords'],
    color: 'green'
  },
  {
    id: 'data-extraction',
    name: 'Data Extraction',
    description: 'Scrape and extract data from any website',
    icon: <Target className="w-6 h-6" />,
    features: ['Visual selector', 'OCR support', 'Export to Excel'],
    templates: ['Price scraper', 'Contact extractor', 'News aggregator'],
    color: 'orange'
  },
  {
    id: 'vpn-security',
    name: 'VPN & Security',
    description: 'Browse privately with built-in VPN',
    icon: <Globe className="w-6 h-6" />,
    features: ['50+ locations', 'Kill switch', 'Split tunneling'],
    templates: ['Auto-connect', 'Geo-restricted access', 'Privacy mode'],
    color: 'cyan'
  },
  {
    id: 'team-collaboration',
    name: 'Team Collaboration',
    description: 'Share workflows and collaborate with your team',
    icon: <Users className="w-6 h-6" />,
    features: ['Shared workflows', 'Team chat', 'Video calls'],
    templates: ['Team onboarding', 'Project setup', 'Standup automation'],
    color: 'pink'
  },
  {
    id: 'developer-tools',
    name: 'Developer Tools',
    description: 'Database management, API testing, and more',
    icon: <Database className="w-6 h-6" />,
    features: ['Docker containers', 'SQL editor', 'API client'],
    templates: ['Dev environment', 'DB backup', 'API testing'],
    color: 'indigo'
  },
  {
    id: 'remote-access',
    name: 'Remote Desktop',
    description: 'Access and control remote computers',
    icon: <Monitor className="w-6 h-6" />,
    features: ['Screen sharing', 'File transfer', 'Wake-on-LAN'],
    templates: ['Quick connect', 'Server management', 'Support session'],
    color: 'red'
  }
];

// =============================================================================
// Component
// =============================================================================

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [userName, setUserName] = useState('');
  const [_showTrialOffer, setShowTrialOffer] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  // Total steps
  const totalSteps = 5;

  // Load any existing onboarding state
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const state = await invoke<OnboardingState>('get_onboarding_state');
        if (state && state.completed) {
          onComplete();
        }
      } catch (_error) {
        log.debug('No existing onboarding state');
      }
    };
    loadOnboardingState();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setIsAnimating(true);
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentStep]);

  const toggleUseCase = (id: string) => {
    setSelectedUseCases(prev => 
      prev.includes(id) 
        ? prev.filter(uc => uc !== id)
        : [...prev, id]
    );
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      await invoke('start_trial', { tier: 'elite' });
      setShowTrialOffer(false);
      handleComplete();
    } catch (error) {
      log.error('Failed to start trial:', error);
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleComplete = async () => {
    try {
      await invoke('save_onboarding_state', {
        state: {
          completed: true,
          step: totalSteps,
          selectedUseCases,
          completedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      log.debug('Could not save onboarding state:', error);
    }
    onComplete();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      handleComplete();
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderUseCaseStep();
      case 2:
        return renderFeaturesStep();
      case 3:
        return renderSetupStep();
      case 4:
        return renderTrialStep();
      default:
        return null;
    }
  };

  // Step 1: Welcome
  const renderWelcomeStep = () => (
    <div className="onboarding-step welcome-step">
      <div className="welcome-hero">
        <div className="hero-icon">
          <Sparkles className="w-16 h-16" />
        </div>
        <h1>Welcome to CUBE Nexum</h1>
        <p className="hero-subtitle">
          The all-in-one productivity platform that replaces 5+ tools
        </p>
      </div>

      <div className="welcome-features">
        <div className="feature-pill">
          <Workflow className="w-4 h-4" />
          <span>Automation</span>
        </div>
        <div className="feature-pill">
          <Bot className="w-4 h-4" />
          <span>AI Assistant</span>
        </div>
        <div className="feature-pill">
          <Key className="w-4 h-4" />
          <span>Password Manager</span>
        </div>
        <div className="feature-pill">
          <Globe className="w-4 h-4" />
          <span>VPN</span>
        </div>
        <div className="feature-pill">
          <Monitor className="w-4 h-4" />
          <span>Remote Desktop</span>
        </div>
      </div>

      <div className="welcome-input">
        <label>What should we call you?</label>
        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="welcome-stats">
        <div className="stat">
          <span className="stat-value">50K+</span>
          <span className="stat-label">Users</span>
        </div>
        <div className="stat">
          <span className="stat-value">4.8★</span>
          <span className="stat-label">Rating</span>
        </div>
        <div className="stat">
          <span className="stat-value">$200+</span>
          <span className="stat-label">Saved/mo</span>
        </div>
      </div>
    </div>
  );

  // Step 2: Use Case Selection
  const renderUseCaseStep = () => (
    <div className="onboarding-step usecase-step">
      <div className="step-header">
        <h2>What will you use CUBE Nexum for?</h2>
        <p>Select all that apply - we&apos;ll personalize your experience</p>
      </div>

      <div className="usecase-grid">
        {USE_CASES.map((useCase) => (
          <div
            key={useCase.id}
            className={`usecase-card ${selectedUseCases.includes(useCase.id) ? 'selected' : ''} color-${useCase.color}`}
            onClick={() => toggleUseCase(useCase.id)}
          >
            <div className="usecase-check">
              {selectedUseCases.includes(useCase.id) && <Check className="w-4 h-4" />}
            </div>
            <div className="usecase-icon">{useCase.icon}</div>
            <h3>{useCase.name}</h3>
            <p>{useCase.description}</p>
          </div>
        ))}
      </div>

      <div className="selection-count">
        {selectedUseCases.length > 0 ? (
          <span>{selectedUseCases.length} selected - Great choices!</span>
        ) : (
          <span>Select at least one to continue</span>
        )}
      </div>
    </div>
  );

  // Step 3: Features Overview
  const renderFeaturesStep = () => {
    const selectedFeatures = USE_CASES.filter(uc => 
      selectedUseCases.includes(uc.id)
    );

    return (
      <div className="onboarding-step features-step">
        <div className="step-header">
          <h2>Your Personalized Features</h2>
          <p>Based on your selections, here&apos;s what we recommend</p>
        </div>

        <div className="features-timeline">
          {selectedFeatures.map((useCase, index) => (
            <div key={useCase.id} className="feature-section">
              <div className="feature-marker">
                <span className="marker-number">{index + 1}</span>
              </div>
              <div className="feature-content">
                <div className="feature-header">
                  <div className={`feature-icon color-${useCase.color}`}>
                    {useCase.icon}
                  </div>
                  <h3>{useCase.name}</h3>
                </div>
                <div className="feature-items">
                  {useCase.features.map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <Check className="w-4 h-4" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="suggested-templates">
                  <span className="templates-label">Quick start templates:</span>
                  <div className="template-chips">
                    {useCase.templates.map((template, idx) => (
                      <span key={idx} className="template-chip">{template}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedFeatures.length === 0 && (
          <div className="no-selection">
            <p>Go back and select some use cases to see personalized features!</p>
          </div>
        )}
      </div>
    );
  };

  // Step 4: Quick Setup
  const renderSetupStep = () => (
    <div className="onboarding-step setup-step">
      <div className="step-header">
        <h2>Quick Setup</h2>
        <p>Let&apos;s configure the essentials to get you started</p>
      </div>

      <div className="setup-tasks">
        <SetupTask
          icon={<Key className="w-5 h-5" />}
          title="Import Passwords"
          description="Import from Chrome, Firefox, or 1Password"
          action="Import Now"
          completed={false}
          onAction={() => invoke('open_password_import')}
        />
        <SetupTask
          icon={<Shield className="w-5 h-5" />}
          title="Enable Security Features"
          description="Set up biometric unlock and 2FA"
          action="Configure"
          completed={false}
          onAction={() => invoke('open_security_settings')}
        />
        <SetupTask
          icon={<Globe className="w-5 h-5" />}
          title="Test VPN Connection"
          description="Verify VPN works in your region"
          action="Test Now"
          completed={false}
          onAction={() => invoke('test_vpn_connection')}
        />
        <SetupTask
          icon={<Bot className="w-5 h-5" />}
          title="Meet CIPHER AI"
          description="Say hello to your AI assistant"
          action="Chat Now"
          completed={false}
          onAction={() => invoke('open_ai_chat')}
        />
      </div>

      <div className="setup-skip-note">
        <p>You can complete these later from Settings</p>
      </div>
    </div>
  );

  // Step 5: Trial Offer
  const renderTrialStep = () => (
    <div className="onboarding-step trial-step">
      <div className="trial-hero">
        <div className="trial-badge">
          <Gift className="w-6 h-6" />
          <span>Special Offer</span>
        </div>
        <h2>Start Your 30-Day Elite Trial</h2>
        <p>Experience everything CUBE Nexum has to offer - completely free</p>
      </div>

      <div className="trial-comparison">
        <div className="plan-column free">
          <h3>Free</h3>
          <div className="plan-features">
            <div className="plan-feature">
              <span>5 workflows</span>
            </div>
            <div className="plan-feature">
              <span>50 AI messages/day</span>
            </div>
            <div className="plan-feature">
              <span>25 passwords</span>
            </div>
            <div className="plan-feature">
              <span>3 VPN locations</span>
            </div>
          </div>
        </div>
        
        <div className="plan-column elite highlighted">
          <div className="elite-badge">
            <Crown className="w-4 h-4" />
            <span>30 Days Free</span>
          </div>
          <h3>Elite Trial</h3>
          <div className="plan-features">
            <div className="plan-feature">
              <Check className="w-4 h-4 text-green" />
              <span>Unlimited workflows</span>
            </div>
            <div className="plan-feature">
              <Check className="w-4 h-4 text-green" />
              <span>Unlimited AI (GPT-5.2)</span>
            </div>
            <div className="plan-feature">
              <Check className="w-4 h-4 text-green" />
              <span>Unlimited passwords</span>
            </div>
            <div className="plan-feature">
              <Check className="w-4 h-4 text-green" />
              <span>50+ VPN locations</span>
            </div>
            <div className="plan-feature">
              <Check className="w-4 h-4 text-green" />
              <span>Priority support (4h)</span>
            </div>
            <div className="plan-feature">
              <Check className="w-4 h-4 text-green" />
              <span>All premium features</span>
            </div>
          </div>
        </div>
      </div>

      <div className="trial-cta">
        <button 
          className="btn-trial-start"
          onClick={handleStartTrial}
          disabled={isStartingTrial}
        >
          {isStartingTrial ? (
            <span>Starting Trial...</span>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              <span>Start Free Elite Trial</span>
            </>
          )}
        </button>
        <p className="trial-note">No credit card required • Cancel anytime</p>
      </div>

      <button className="btn-skip-trial" onClick={handleComplete}>
        Continue with Free Plan
      </button>
    </div>
  );

  // Progress indicator
  const renderProgress = () => (
    <div className="onboarding-progress">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`progress-dot ${
            index === currentStep ? 'active' : ''
          } ${completedSteps.has(index) ? 'completed' : ''}`}
        />
      ))}
    </div>
  );

  return (
    <div className="onboarding-wizard">
      <div className="onboarding-container">
        {/* Skip button */}
        <button className="onboarding-skip" onClick={handleSkip}>
          <X className="w-4 h-4" />
          <span>Skip</span>
        </button>

        {/* Progress */}
        {renderProgress()}

        {/* Content */}
        <div className={`onboarding-content ${isAnimating ? 'animating' : ''}`}>
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="onboarding-nav">
          <button
            className="nav-btn prev"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          {currentStep < totalSteps - 1 ? (
            <button
              className="nav-btn next"
              onClick={handleNext}
              disabled={currentStep === 1 && selectedUseCases.length === 0}
            >
              <span>Continue</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Sub-components
// =============================================================================

interface SetupTaskProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  onAction: () => void;
}

const SetupTask: React.FC<SetupTaskProps> = ({
  icon,
  title,
  description,
  action,
  completed,
  onAction
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onAction();
    } catch (error) {
      log.error('Setup task failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`setup-task ${completed ? 'completed' : ''}`}>
      <div className="task-icon">{icon}</div>
      <div className="task-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <button 
        className="task-action"
        onClick={handleClick}
        disabled={isLoading || completed}
      >
        {completed ? (
          <Check className="w-4 h-4" />
        ) : isLoading ? (
          <span>...</span>
        ) : (
          <span>{action}</span>
        )}
      </button>
    </div>
  );
};

export default OnboardingWizard;
