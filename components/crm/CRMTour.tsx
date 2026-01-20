'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle, Users, DollarSign, Mail, Phone, Bot, BarChart3, Zap, TrendingUp, Brain } from 'lucide-react';
import './CRMTour.css';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  action?: string;
}

interface CRMTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to CRM Enterprise",
    description: "CUBE CRM is more powerful than HubSpot, Salesforce, and GoHighLevel combined. Manage your entire customer relationship lifecycle with AI-powered insights and automation.",
    icon: <Users className="tour-icon" />,
    highlight: "crm-dashboard"
  },
  {
    title: "Contact Management",
    description: "Import, organize, and manage unlimited contacts. AI automatically enriches profiles with social data, company information, and interaction history.",
    icon: <Users className="tour-icon" />,
    highlight: "contacts-section",
    action: "Click 'Add Contact' to import your first contacts"
  },
  {
    title: "Deal Pipeline",
    description: "Visual Kanban-style deal tracking. Drag and drop deals between stages, set values, assign team members, and track probability of closing.",
    icon: <DollarSign className="tour-icon" />,
    highlight: "pipeline-section",
    action: "Create your first deal in the pipeline"
  },
  {
    title: "AI Lead Scoring",
    description: "Our AI analyzes every interaction to score leads automatically. Know exactly which prospects to prioritize and when to reach out.",
    icon: <Brain className="tour-icon" />,
    highlight: "ai-scoring"
  },
  {
    title: "Multi-Channel Communication",
    description: "Email, SMS, WhatsApp, and phone calls - all from one place. Every interaction is logged automatically and analyzed by AI.",
    icon: <Mail className="tour-icon" />,
    highlight: "communication-hub"
  },
  {
    title: "VoIP Integration",
    description: "Make and receive calls directly from CUBE. Call recording, transcription, and AI analysis help you improve sales conversations.",
    icon: <Phone className="tour-icon" />,
    highlight: "voip-section"
  },
  {
    title: "Marketing Automation",
    description: "Create automated sequences that nurture leads, send follow-ups, and trigger actions based on contact behavior.",
    icon: <Zap className="tour-icon" />,
    highlight: "automation-section"
  },
  {
    title: "AI Sales Assistant",
    description: "Chat with our AI to get instant insights about any contact, deal, or campaign. Ask questions in natural language and get actionable recommendations.",
    icon: <Bot className="tour-icon" />,
    highlight: "ai-assistant"
  },
  {
    title: "Advanced Analytics",
    description: "Real-time dashboards show conversion rates, revenue forecasts, team performance, and pipeline health. AI predicts which deals will close.",
    icon: <BarChart3 className="tour-icon" />,
    highlight: "analytics-section"
  },
  {
    title: "Revenue Intelligence",
    description: "Track every dollar through your pipeline. See win rates, average deal size, sales velocity, and forecast revenue with AI accuracy.",
    icon: <TrendingUp className="tour-icon" />,
    highlight: "revenue-intelligence"
  },
  {
    title: "You're Ready!",
    description: "You now have access to the most powerful CRM on the market. Our AI assistant is always available to help you close more deals faster.",
    icon: <CheckCircle className="tour-icon success" />,
    action: "Start adding contacts and creating deals!"
  }
];

export const CRMTour: React.FC<CRMTourProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = tourSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('cube-crm-tour-completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('cube-crm-tour-skipped', 'true');
    onSkip();
  };

  useEffect(() => {
    const completed = localStorage.getItem('cube-crm-tour-completed');
    const skipped = localStorage.getItem('cube-crm-tour-skipped');
    if (completed || skipped) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="crm-tour-overlay">
      <div className="crm-tour-modal">
        <button className="tour-close-btn" onClick={handleSkip} aria-label="Skip tour">
          <X size={20} />
        </button>

        <div className="tour-content">
          <div className="tour-icon-wrapper">
            {step.icon}
          </div>

          <h2 className="tour-title">{step.title}</h2>
          <p className="tour-description">{step.description}</p>

          {step.action && (
            <div className="tour-action">
              <span className="action-label">💡 Try it:</span>
              <span className="action-text">{step.action}</span>
            </div>
          )}
        </div>

        <div className="tour-footer">
          <div className="tour-progress">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(index)}
                aria-label={`Go to step ${index + 1}: ${tourSteps[index].title}`}
              />
            ))}
          </div>

          <div className="tour-nav">
            <span className="step-counter">
              {currentStep + 1} of {tourSteps.length}
            </span>
            <div className="nav-buttons">
              {currentStep > 0 && (
                <button className="nav-btn prev" onClick={handlePrev}>
                  <ChevronLeft size={18} />
                  Back
                </button>
              )}
              {currentStep === tourSteps.length - 1 ? (
                <button className="nav-btn next complete" onClick={handleComplete}>
                  Get Started
                  <CheckCircle size={18} />
                </button>
              ) : (
                <button className="nav-btn next" onClick={handleNext}>
                  Next
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMTour;
