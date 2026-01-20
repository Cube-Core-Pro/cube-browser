'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Scale, FileText, CheckCircle, Square, CheckSquare } from 'lucide-react';

interface LegalDisclaimerProps {
  onAccept: () => void;
  onDecline: () => void;
}

interface CheckboxItemProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}

const CheckboxItem: React.FC<CheckboxItemProps> = ({ checked, onChange, children }) => {
  return (
    <div 
      className="flex items-start gap-3 cursor-pointer group"
      onClick={() => onChange(!checked)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    >
      <div className="mt-0.5 flex-shrink-0">
        {checked ? (
          <CheckSquare className="h-5 w-5 text-primary" />
        ) : (
          <Square className="h-5 w-5 text-muted-foreground group-hover:text-primary/70 transition-colors" />
        )}
      </div>
      <span className="text-sm select-none">{children}</span>
    </div>
  );
};

interface LegalDisclaimerProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ onAccept, onDecline }) => {
  const [acceptedTerms, setAcceptedTerms] = useState({
    legalResponsibility: false,
    ethicalUse: false,
    dataHandling: false,
    noMaliciousIntent: false,
  });

  const allAccepted = Object.values(acceptedTerms).every(Boolean);

  const handleAccept = () => {
    if (allAccepted) {
      // Store acceptance with timestamp for audit
      const acceptance = {
        acceptedAt: new Date().toISOString(),
        terms: acceptedTerms,
        version: '1.0.0',
      };
      localStorage.setItem('security_lab_disclaimer_accepted', JSON.stringify(acceptance));
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Scale className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Security Scanner - Legal Disclaimer</CardTitle>
              <CardDescription>Please read and accept before using the vulnerability scanner</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Purpose Section */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Purpose of This Tool
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              CUBE Security Lab is designed to help users assess the security posture of websites and web applications. 
              This tool enables transparency by allowing anyone to verify if a company truly protects user data and 
              privacy as they claim. Security should not be a marketing promise—it should be verifiable.
            </p>
          </div>

          {/* Legal Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
              <AlertTriangle className="h-5 w-5" />
              Important Legal Notice
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
              <li>• Unauthorized scanning of systems you don&apos;t own may violate computer crime laws in your jurisdiction.</li>
              <li>• Laws such as the CFAA (USA), Computer Misuse Act (UK), and similar legislation in other countries prohibit unauthorized access.</li>
              <li>• You are solely responsible for ensuring you have proper authorization before scanning any target.</li>
              <li>• CUBE and its developers assume no liability for misuse of this tool.</li>
            </ul>
          </div>

          {/* Acceptable Use */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              Acceptable Use Cases
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Scanning your own websites and applications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Authorized penetration testing with written permission</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Security research on systems with bug bounty programs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Verifying security claims of services before entrusting them with your data</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Educational purposes in controlled environments</span>
              </li>
            </ul>
          </div>

          {/* Acceptance Checkboxes */}
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm font-medium">To proceed, please confirm the following:</p>
            
            <CheckboxItem
              checked={acceptedTerms.legalResponsibility}
              onChange={(checked) => 
                setAcceptedTerms(prev => ({ ...prev, legalResponsibility: checked }))
              }
            >
              I understand that I am <strong>legally responsible</strong> for my use of this tool and will comply 
              with all applicable laws in my jurisdiction.
            </CheckboxItem>

            <CheckboxItem
              checked={acceptedTerms.ethicalUse}
              onChange={(checked) => 
                setAcceptedTerms(prev => ({ ...prev, ethicalUse: checked }))
              }
            >
              I will use this tool <strong>ethically</strong> and only scan targets I own or have 
              explicit authorization to test.
            </CheckboxItem>

            <CheckboxItem
              checked={acceptedTerms.dataHandling}
              onChange={(checked) => 
                setAcceptedTerms(prev => ({ ...prev, dataHandling: checked }))
              }
            >
              I understand that scan results may contain <strong>sensitive information</strong> and I will 
              handle any discovered vulnerabilities responsibly (responsible disclosure).
            </CheckboxItem>

            <CheckboxItem
              checked={acceptedTerms.noMaliciousIntent}
              onChange={(checked) => 
                setAcceptedTerms(prev => ({ ...prev, noMaliciousIntent: checked }))
              }
            >
              I confirm that I have <strong>no malicious intent</strong> and will not use discovered 
              vulnerabilities to harm, exploit, or gain unauthorized access to systems.
            </CheckboxItem>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onDecline}>
            Decline & Exit
          </Button>
          <Button 
            onClick={handleAccept} 
            disabled={!allAccepted}
            className={allAccepted ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {allAccepted ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept & Continue
              </>
            ) : (
              'Please accept all terms'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LegalDisclaimer;
