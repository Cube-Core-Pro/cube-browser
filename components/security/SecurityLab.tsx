'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('SecurityLab');

import React, { useState } from 'react';
import { securityLabService, type SecurityScan } from '@/lib/services/security-lab-service';

export function SecurityLab() {
  const [scans, setScans] = useState<SecurityScan[]>([]);
  const [targetUrl, setTargetUrl] = useState('');
  const [scanning, setScanning] = useState(false);

  const handleStartScan = async () => {
    if (!targetUrl) return;
    setScanning(true);
    try {
      await securityLabService.startScan(targetUrl, 'vulnerability', 'standard');
      const updated = await securityLabService.listScans();
      setScans(updated);
    } catch (err) {
      log.error('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Security Lab</h2>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-medium">⚠️ WARNING</p>
        <p className="text-yellow-700 text-sm">Only scan systems you own or have permission to test.</p>
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 px-4 py-2 border border-input rounded-lg bg-background"
        />
        <button
          onClick={handleStartScan}
          disabled={scanning || !targetUrl}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
        >
          {scanning ? 'Scanning...' : 'Start Scan'}
        </button>
      </div>
      <div className="space-y-2">
        {scans.map(scan => (
          <div key={scan.id} className="border border-border rounded-lg p-4">
            <p className="font-medium">{scan.targetUrl}</p>
            <p className="text-sm text-muted-foreground">Status: {scan.status} ({scan.progress}%)</p>
            <p className="text-sm">Findings: {scan.findingsCount} ({scan.criticalCount} critical)</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SecurityLab;
