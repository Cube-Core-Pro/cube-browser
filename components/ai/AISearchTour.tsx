'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Sparkles,
  Search,
  Brain,
  Wand2,
  MessageSquare,
  Code,
  Image as ImageIcon,
  FileText,
  Globe,
  Database,
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Command,
  Shield
} from 'lucide-react';
import './AISearchTour.css';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  action?: string;
}

interface AISearchTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to AI Search Engine',
    description: 'Your intelligent assistant that understands context, generates content, writes code, and controls every module in CUBE Elite. Powered by GPT-5.2 with enterprise-grade security.',
    icon: <Sparkles className="tour-icon" />,
    highlight: 'ai-dashboard',
    action: 'Experience AI-powered everything'
  },
  {
    title: 'Universal AI Search',
    description: 'Search across your entire workspace - files, contacts, emails, deals, and web - with semantic understanding. AI interprets intent, not just keywords.',
    icon: <Search className="tour-icon" />,
    highlight: 'ai-search',
    action: 'Press Cmd+K to search anywhere'
  },
  {
    title: 'AI Chat Assistant',
    description: 'Have natural conversations with AI. Ask questions, get explanations, brainstorm ideas, or get help with complex tasks. Context-aware responses tailored to your work.',
    icon: <MessageSquare className="tour-icon" />,
    highlight: 'ai-chat',
    action: 'Chat → Start Conversation'
  },
  {
    title: 'Module Control',
    description: 'AI can execute actions across ALL CUBE modules. Say "Create a new contact named John" or "Send email to leads" - AI handles the rest automatically.',
    icon: <Command className="tour-icon" />,
    highlight: 'module-control',
    action: 'Try: "Create a sales funnel for SaaS"'
  },
  {
    title: 'Code Generation',
    description: 'Generate, explain, refactor, or debug code in 50+ languages. AI understands your codebase context and generates production-ready code.',
    icon: <Code className="tour-icon" />,
    highlight: 'code-gen',
    action: 'Code → Generate/Explain'
  },
  {
    title: 'Content Generation',
    description: 'Create marketing copy, blog posts, emails, social content, and more. AI writes in your brand voice with customizable tone and style.',
    icon: <FileText className="tour-icon" />,
    highlight: 'content-gen',
    action: 'Generate → Marketing Content'
  },
  {
    title: 'Image Understanding',
    description: 'Upload images for AI analysis. Extract text with OCR, describe images, analyze charts, or process documents. Multi-modal AI at your fingertips.',
    icon: <ImageIcon className="tour-icon" />,
    highlight: 'image-ai',
    action: 'Upload → Analyze Image'
  },
  {
    title: 'Smart Automation',
    description: 'Describe workflows in plain English, AI creates them automatically. "When a lead signs up, send welcome email, add to CRM, and notify sales."',
    icon: <Wand2 className="tour-icon" />,
    highlight: 'smart-automation',
    action: 'Automation → AI Builder'
  },
  {
    title: 'Web Intelligence',
    description: 'AI can browse, analyze, and extract information from any website. Research competitors, gather data, or monitor changes - all with natural language commands.',
    icon: <Globe className="tour-icon" />,
    highlight: 'web-intel',
    action: 'Web → Research Topic'
  },
  {
    title: 'Data Analysis',
    description: 'Upload spreadsheets or connect databases - AI analyzes patterns, generates insights, creates visualizations, and answers questions about your data.',
    icon: <Database className="tour-icon" />,
    highlight: 'data-analysis',
    action: 'Data → Analyze Dataset'
  },
  {
    title: 'AI Reasoning Engine',
    description: 'Advanced reasoning for complex tasks. AI breaks down problems, plans multi-step solutions, and executes them with full transparency into its thinking process.',
    icon: <Brain className="tour-icon" />,
    highlight: 'reasoning',
    action: 'Enable → Deep Reasoning Mode'
  },
  {
    title: 'Privacy & Security',
    description: 'Enterprise-grade security. Your data never leaves your control. Local processing available, encrypted communications, and full audit trails.',
    icon: <Shield className="tour-icon" />,
    highlight: 'ai-security',
    action: 'Settings → AI Privacy'
  },
  {
    title: 'AI is Ready!',
    description: 'Start using AI to supercharge your workflow. Press Cmd+K anywhere, chat with the assistant, or use voice commands. AI adapts to how you work.',
    icon: <CheckCircle className="tour-icon success" />,
    action: 'Try Cmd+K now!'
  }
];

export const AISearchTour: React.FC<AISearchTourProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleComplete = useCallback(() => {
    localStorage.setItem('ai-search-tour-completed', 'true');
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
    <div className="ai-tour-overlay" onClick={onClose}>
      <div className="ai-tour-modal" onClick={(e) => e.stopPropagation()}>
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

export default AISearchTour;
