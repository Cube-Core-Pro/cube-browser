'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Building2,
  Shield,
  Activity,
  Network,
  Workflow,
  GitBranch,
  Gauge,
  Key,
  Eye,
  AlertTriangle,
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  LineChart,
  Boxes,
  Webhook
} from 'lucide-react';
import './EnterpriseTour.css';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  action?: string;
}

interface EnterpriseTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const tourSteps: TourStep[] = [
  {
    title: 'Enterprise Command Center',
    description: 'Your unified hub for enterprise-grade operations. Monitor systems, manage integrations, orchestrate workflows, and ensure security across your entire organization.',
    icon: <Building2 className="tour-icon" />,
    highlight: 'enterprise-dashboard',
    action: 'Explore enterprise capabilities'
  },
  {
    title: 'Security Dashboard',
    description: 'Real-time security monitoring with threat detection, vulnerability scanning, and compliance tracking. SOC2, GDPR, HIPAA compliance built-in.',
    icon: <Shield className="tour-icon" />,
    highlight: 'security-dashboard',
    action: 'Security → Dashboard'
  },
  {
    title: 'API Gateway',
    description: 'Manage all API connections from one place. Rate limiting, authentication, request/response transformation, and detailed analytics for every endpoint.',
    icon: <Network className="tour-icon" />,
    highlight: 'api-gateway',
    action: 'APIs → Gateway Console'
  },
  {
    title: 'Observability Center',
    description: 'Full-stack observability with distributed tracing, metrics, and logs. Monitor performance, track errors, and debug issues across all services.',
    icon: <Activity className="tour-icon" />,
    highlight: 'observability',
    action: 'Observe → Metrics & Traces'
  },
  {
    title: 'Workflow Designer',
    description: 'Visual workflow builder for complex business processes. Drag-and-drop nodes, conditional logic, parallel execution, and error handling.',
    icon: <Workflow className="tour-icon" />,
    highlight: 'workflow-designer',
    action: 'Workflows → Visual Designer'
  },
  {
    title: 'Data Pipelines',
    description: 'Build ETL/ELT pipelines visually. Transform, enrich, and move data between systems. Schedule jobs and monitor pipeline health in real-time.',
    icon: <GitBranch className="tour-icon" />,
    highlight: 'data-pipelines',
    action: 'Pipelines → Builder'
  },
  {
    title: 'Integration Hub',
    description: '500+ pre-built integrations with CRMs, ERPs, databases, and SaaS tools. Connect any system with custom API connectors and webhooks.',
    icon: <Boxes className="tour-icon" />,
    highlight: 'integrations',
    action: 'Integrations → Marketplace'
  },
  {
    title: 'Identity & Access',
    description: 'Enterprise SSO, SAML, OAuth 2.0, and SCIM provisioning. Granular role-based access control with audit logging for all actions.',
    icon: <Key className="tour-icon" />,
    highlight: 'identity',
    action: 'Security → Access Control'
  },
  {
    title: 'Threat Intelligence',
    description: 'AI-powered threat detection analyzing behavior patterns, detecting anomalies, and automatically responding to security incidents.',
    icon: <Eye className="tour-icon" />,
    highlight: 'threat-intel',
    action: 'Security → Threat Monitor'
  },
  {
    title: 'Incident Management',
    description: 'Automated incident detection, alerting, and escalation. On-call scheduling, runbook automation, and post-mortem tracking.',
    icon: <AlertTriangle className="tour-icon" />,
    highlight: 'incidents',
    action: 'Incidents → Response Center'
  },
  {
    title: 'Resource Monitor',
    description: 'Real-time infrastructure monitoring. CPU, memory, disk, network metrics with intelligent alerting and capacity planning.',
    icon: <Gauge className="tour-icon" />,
    highlight: 'resources',
    action: 'Infrastructure → Resources'
  },
  {
    title: 'Webhooks Manager',
    description: 'Create, manage, and monitor webhooks. Automatic retries, signature verification, and payload transformation for reliable event delivery.',
    icon: <Webhook className="tour-icon" />,
    highlight: 'webhooks',
    action: 'APIs → Webhooks'
  },
  {
    title: 'Enterprise Analytics',
    description: 'Business intelligence dashboards with custom reports, scheduled exports, and executive summaries. AI-generated insights and recommendations.',
    icon: <LineChart className="tour-icon" />,
    highlight: 'analytics',
    action: 'Analytics → Dashboards'
  },
  {
    title: 'Enterprise Ready!',
    description: 'Your organization has the tools for enterprise-scale operations. Start by exploring integrations or setting up your first workflow.',
    icon: <CheckCircle className="tour-icon success" />,
    action: 'Launch Enterprise Console'
  }
];

export const EnterpriseTour: React.FC<EnterpriseTourProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleComplete = useCallback(() => {
    localStorage.setItem('enterprise-tour-completed', 'true');
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
    <div className="enterprise-tour-overlay" onClick={onClose}>
      <div className="enterprise-tour-modal" onClick={(e) => e.stopPropagation()}>
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

export default EnterpriseTour;
