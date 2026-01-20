"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  AlertTriangle,
  Target,
  Terminal,
  FileSearch,
  Bug,
  Lock,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecurityLabTourProps {
  onClose: () => void;
  onComplete: () => void;
}

const tourSteps = [
  {
    title: "Welcome to Security Lab",
    description: "Enterprise-grade vulnerability scanning and exploit framework",
    icon: Shield,
    content: [
      "🔍 OWASP ZAP integration for web scanning",
      "⚡ Nuclei for fast vulnerability detection",
      "🎯 Comprehensive security assessment",
      "📊 Detailed vulnerability reports",
      "🛡️ Enterprise-ready security testing"
    ]
  },
  {
    title: "Important Legal Notice",
    description: "Ethical security testing requirements",
    icon: AlertTriangle,
    content: [
      "⚠️ Only scan systems you own or have permission to test",
      "📜 Unauthorized scanning may be illegal",
      "✅ Always obtain written authorization first",
      "🏢 Respect organizational security policies",
      "📋 Document all testing activities"
    ]
  },
  {
    title: "Starting a Vulnerability Scan",
    description: "How to configure and launch scans",
    icon: Target,
    content: [
      "1️⃣ Enter the target URL (must be http:// or https://)",
      "2️⃣ Select scan type: Quick, Standard, or Full",
      "3️⃣ Choose scanner: OWASP ZAP, Nuclei, or Both",
      "4️⃣ Click 'Start Scan' to begin",
      "📈 Monitor progress in real-time"
    ]
  },
  {
    title: "Understanding Scan Types",
    description: "Choose the right scan for your needs",
    icon: FileSearch,
    content: [
      "⚡ Quick Scan - Fast surface-level check (5-10 min)",
      "🔄 Standard Scan - Balanced coverage (15-30 min)",
      "🔍 Full Scan - Comprehensive deep scan (1-2 hours)",
      "⚙️ Custom Scan - Configure specific test modules",
      "💡 Start with Quick for initial assessment"
    ]
  },
  {
    title: "Vulnerability Findings",
    description: "Interpreting and prioritizing results",
    icon: Bug,
    content: [
      "🔴 Critical - Immediate action required (CVSS 9.0-10.0)",
      "🟠 High - Priority fix needed (CVSS 7.0-8.9)",
      "🟡 Medium - Schedule remediation (CVSS 4.0-6.9)",
      "🟢 Low - Address when possible (CVSS 0.1-3.9)",
      "ℹ️ Info - Security best practice suggestions"
    ]
  },
  {
    title: "Exploit Shell",
    description: "Advanced security testing (Elite feature)",
    icon: Terminal,
    content: [
      "🖥️ Interactive exploit testing environment",
      "🤖 AI-powered payload suggestions",
      "📝 Pre-built exploit templates",
      "🔐 Safe sandboxed execution",
      "📊 Full audit logging of all actions"
    ]
  },
  {
    title: "AI Security Assistant",
    description: "Intelligent vulnerability analysis",
    icon: Sparkles,
    content: [
      "🧠 AI analyzes findings for false positives",
      "💡 Suggests prioritized remediation steps",
      "📄 Generates executive security reports",
      "🔍 Identifies attack chain possibilities",
      "📚 Provides relevant CVE/CWE references"
    ]
  },
  {
    title: "Best Practices",
    description: "Maximize your security testing effectiveness",
    icon: Lock,
    content: [
      "✅ Test in staging environments first",
      "✅ Schedule scans during off-peak hours",
      "✅ Review findings with development teams",
      "✅ Retest after applying fixes",
      "✅ Maintain regular scan schedules"
    ]
  }
];

export const SecurityLabTour: React.FC<SecurityLabTourProps> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tourSteps[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('security-lab-tour-completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10"
          onClick={handleSkip}
          title="Close tour"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </Button>

        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl mb-2">{step.title}</CardTitle>
            <CardDescription className="text-base">{step.description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            {step.content.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="text-lg leading-none mt-0.5">{item.split(' ')[0]}</div>
                <div className="flex-1 text-sm leading-relaxed">
                  {item.split(' ').slice(1).join(' ')}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === currentStep
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                title={`Go to step ${index + 1}`}
                aria-label={`Go to step ${index + 1}: ${tourSteps[index].title}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              {currentStep + 1} of {tourSteps.length}
            </div>

            <Button onClick={handleNext}>
              {currentStep === tourSteps.length - 1 ? (
                "Get Started!"
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityLabTour;
