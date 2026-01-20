"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { ScanDashboard } from '../../../components/security/lab/ScanDashboard';
import { FindingsList } from '../../../components/security/lab/FindingsList';
import { ExploitShell } from '../../../components/security/lab/ExploitShell';
import { FindingDetails } from '../../../components/security/lab/FindingDetails';
import { LegalDisclaimer } from '../../../components/security/lab/LegalDisclaimer';
import { SecurityLabTour } from '../../../components/security/lab/SecurityLabTour';
import { SecurityLabConfig, VulnerabilityScan, VulnerabilityFinding, ExploitSession, ScanStatus } from '../../../types/security-lab';
import { AppLayout } from '@/components/layout';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import './security-lab.css';

const DISCLAIMER_STORAGE_KEY = 'security_lab_disclaimer_accepted';
const TOUR_STORAGE_KEY = 'security-lab-tour-completed';

export default function SecurityLabPage() {
  const { t: _t } = useTranslation();
  const [activeView, setActiveView] = useState<'dashboard' | 'findings' | 'exploit'>('dashboard');
  const [config, setConfig] = useState<SecurityLabConfig | null>(null);
  const [scans, setScans] = useState<VulnerabilityScan[]>([]);
  const [selectedScan, setSelectedScan] = useState<VulnerabilityScan | null>(null);
  const [findings, setFindings] = useState<VulnerabilityFinding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<VulnerabilityFinding | null>(null);
  const [exploitSession, setExploitSession] = useState<ExploitSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean | null>(null);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check if user has already accepted the disclaimer
    const checkDisclaimer = () => {
      try {
        const stored = localStorage.getItem(DISCLAIMER_STORAGE_KEY);
        if (stored) {
          const acceptance = JSON.parse(stored);
          // Check if acceptance is valid (not expired - valid for 30 days)
          const acceptedAt = new Date(acceptance.acceptedAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (acceptedAt > thirtyDaysAgo) {
            setDisclaimerAccepted(true);
            // Check if tour should be shown
            const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
            if (!tourCompleted) {
              setShowTour(true);
            }
          } else {
            // Expired - need to re-accept
            localStorage.removeItem(DISCLAIMER_STORAGE_KEY);
            setDisclaimerAccepted(false);
          }
        } else {
          setDisclaimerAccepted(false);
        }
      } catch {
        setDisclaimerAccepted(false);
      }
    };
    
    checkDisclaimer();
  }, []);

  useEffect(() => {
    if (disclaimerAccepted) {
      loadConfig();
      loadScans();
      setupEventListeners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disclaimerAccepted]);

  const handleAcceptDisclaimer = () => {
    setDisclaimerAccepted(true);
    // Show tour for first-time users
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      setShowTour(true);
    }
  };

  const handleTourComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setShowTour(false);
  };

  const handleTourClose = () => {
    setShowTour(false);
  };

  const handleStartTour = () => {
    setShowTour(true);
  };

  const handleDeclineDisclaimer = () => {
    // Redirect to home or previous page
    window.history.back();
  };

  const loadConfig = async () => {
    try {
      const cfg = await invoke<SecurityLabConfig>('security_lab_get_config');
      setConfig(cfg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    }
  };

  const loadScans = async () => {
    try {
      const scanList = await invoke<VulnerabilityScan[]>('security_lab_list_scans');
      setScans(scanList);
    } catch (err) {
      log.error('Failed to load scans:', err);
    }
  };

  const setupEventListeners = () => {
    const unlistenScanStarted = listen<VulnerabilityScan>('security_lab:scan_started', (event) => {
      setScans((prev) => [event.payload, ...prev]);
    });

    const unlistenScanProgress = listen<{ scan_id: string; progress: number }>('security_lab:scan_progress', (event) => {
      log.debug('📊 Scan progress update:', event.payload);
      setScans((prev) =>
        prev.map((scan) => {
          // Match by scan_id (snake_case from event) with scanId (camelCase from struct)
          const scanId = scan.scanId || scan.scan_id;
          if (scanId === event.payload.scan_id) {
            return { 
              ...scan, 
              progress: event.payload.progress,
              status: (event.payload.progress > 0 && event.payload.progress < 1 ? 'Running' : scan.status) as ScanStatus
            };
          }
          return scan;
        })
      );
    });

    const unlistenScanCompleted = listen<VulnerabilityScan>('security_lab:scan_completed', (event) => {
      log.debug('✅ Scan completed:', event.payload);
      setScans((prev) =>
        prev.map((scan) => {
          const scanId = scan.scanId || scan.scan_id;
          const eventScanId = event.payload.scanId || event.payload.scan_id;
          return scanId === eventScanId ? event.payload : scan;
        })
      );
    });

    const unlistenFindingDiscovered = listen<VulnerabilityFinding>('security_lab:finding_discovered', (event) => {
      if (selectedScan && event.payload.scan_id === selectedScan.scan_id) {
        setFindings((prev) => [...prev, event.payload]);
      }
    });

    const unlistenExploitStarted = listen<ExploitSession>('security_lab:exploit_session_started', (event) => {
      setExploitSession(event.payload);
      setActiveView('exploit');
    });

    return () => {
      unlistenScanStarted.then((fn) => fn());
      unlistenScanProgress.then((fn) => fn());
      unlistenScanCompleted.then((fn) => fn());
      unlistenFindingDiscovered.then((fn) => fn());
      unlistenExploitStarted.then((fn) => fn());
    };
  };

  const handleStartScan = async (targetUrl: string, scanType: string, scanner: string) => {
    setLoading(true);
    setError(null);
    try {
      const scan = await invoke<VulnerabilityScan>('security_lab_start_scan', {
        targetUrl,
        scanType,
        scanner,
      });
      setSelectedScan(scan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScan = async (scanId: string) => {
    try {
      await invoke('security_lab_cancel_scan', { scanId });
      loadScans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel scan');
    }
  };

  const handleSelectScan = async (scan: VulnerabilityScan) => {
    setSelectedScan(scan);
    try {
      const scanFindings = await invoke<VulnerabilityFinding[]>('security_lab_get_findings', {
        scanId: scan.scan_id,
      });
      setFindings(scanFindings);
      setActiveView('findings');
    } catch (err) {
      log.error('Failed to load findings:', err);
      setFindings([]);
    }
  };

  const handleSelectFinding = (finding: VulnerabilityFinding) => {
    setSelectedFinding(finding);
  };

  const handleStartExploit = async (findingId: string, exploitType: string) => {
    setLoading(true);
    setError(null);
    try {
      const session = await invoke<ExploitSession>('security_lab_start_exploit', {
        findingId,
        exploitType,
        aiAssistance: config?.openai_api_key ? true : false,
      });
      setExploitSession(session);
      setActiveView('exploit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start exploit session');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDomain = async (domain: string, method: string) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('security_lab_verify_domain', { domain, method });
      loadConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify domain');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (newConfig: SecurityLabConfig) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('security_lab_update_config', { config: newConfig });
      setConfig(newConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  const _handleMarkFalsePositive = async (findingId: string) => {
    try {
      await invoke('security_lab_mark_false_positive', { findingId });
      setFindings((prev) =>
        prev.map((f) => (f.finding_id === findingId ? { ...f, false_positive: true } : f))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as false positive');
    }
  };

  const _handleVerifyFinding = async (findingId: string) => {
    try {
      await invoke('security_lab_verify_finding', { findingId });
      setFindings((prev) =>
        prev.map((f) => (f.finding_id === findingId ? { ...f, verified: true } : f))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify finding');
    }
  };

  // Show loading state while checking disclaimer
  if (disclaimerAccepted === null) {
    return (
      <AppLayout tier="elite">
        <div className="security-lab-page flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Security Lab...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show disclaimer if not accepted
  if (!disclaimerAccepted) {
    return (
      <AppLayout tier="elite">
        <div className="security-lab-page">
          <LegalDisclaimer 
            onAccept={handleAcceptDisclaimer}
            onDecline={handleDeclineDisclaimer}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout tier="elite">
      <div className="security-lab-page">
      {/* Tour Modal */}
      {showTour && (
        <SecurityLabTour 
          onClose={handleTourClose}
          onComplete={handleTourComplete}
        />
      )}

      <header className="security-lab-header">
        <div className="header-content">
          <div className="header-title">
            <div className="icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7v6c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <div>
              <h1>Security Lab</h1>
              <p>Enterprise Vulnerability Scanner & Exploit Framework</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartTour}
              className="flex items-center gap-2"
              title="Start guided tour"
            >
              <HelpCircle className="h-4 w-4" />
              Tour
            </Button>
          </div>
        </div>
        <nav className="view-tabs">
            <button
              className={activeView === 'dashboard' ? 'active' : ''}
              onClick={() => setActiveView('dashboard')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
              </svg>
              Dashboard
            </button>
            <button
              className={activeView === 'findings' ? 'active' : ''}
              onClick={() => setActiveView('findings')}
              disabled={!selectedScan}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
              Findings
              {findings.length > 0 && (
                <span className="badge">{findings.length}</span>
              )}
            </button>
            <button
              className={activeView === 'exploit' ? 'active' : ''}
              onClick={() => setActiveView('exploit')}
              disabled={!exploitSession}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15l3-3-3-3" />
                <path d="M13 15h4" />
              </svg>
              Exploit Shell
            </button>
          </nav>
        {config?.ethical_mode && (
          <div className="ethical-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7v6c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Ethical Mode Enabled - Domain verification required
          </div>
        )}
      </header>

      {error && (
        <div className="error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      <main className="security-lab-content">
        {activeView === 'dashboard' && (
          <ScanDashboard
            scans={scans}
            config={config}
            loading={loading}
            onStartScan={handleStartScan}
            onCancelScan={handleCancelScan}
            onSelectScan={handleSelectScan}
            onVerifyDomain={handleVerifyDomain}
            onUpdateConfig={handleUpdateConfig}
          />
        )}

        {activeView === 'findings' && selectedScan && (
          <div className="findings-view">
            <FindingsList
              findings={findings}
              selectedFinding={selectedFinding}
              onSelectFinding={handleSelectFinding}
              loading={loading}
            />
            {selectedFinding && (
              <FindingDetails
                finding={selectedFinding}
                onExploit={(finding) => handleStartExploit(finding.finding_id, 'Custom')}
              />
            )}
          </div>
        )}

        {activeView === 'exploit' && exploitSession && (
          <ExploitShell
            finding={selectedFinding}
            session={exploitSession}
            onStartSession={async (findingId) => { await handleStartExploit(findingId, 'Custom'); }}
            onSendCommand={async () => { /* Command handling */ }}
            onEndSession={async () => {
              setExploitSession(null);
              setActiveView('findings');
            }}
          />
        )}
      </main>
    </div>
    </AppLayout>
  );
}
