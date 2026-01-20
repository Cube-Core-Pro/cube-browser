'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, AlertCircle, Info, Shield, ExternalLink } from 'lucide-react';
import type { VulnerabilityFinding } from '@/types/security-lab';

interface FindingsListProps {
  findings: VulnerabilityFinding[];
  selectedFinding: VulnerabilityFinding | null;
  onSelectFinding: (finding: VulnerabilityFinding) => void;
  loading: boolean;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  selectedFinding,
  onSelectFinding,
  loading
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      case 'info': return 'bg-slate-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const groupedFindings = findings.reduce((acc, finding) => {
    const severity = finding.severity.toLowerCase();
    if (!acc[severity]) acc[severity] = [];
    acc[severity].push(finding);
    return acc;
  }, {} as Record<string, VulnerabilityFinding[]>);

  const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (findings.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Shield className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold mb-2">No Vulnerabilities Found</h3>
          <p className="text-muted-foreground">
            The scan completed without finding any security issues.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Security Findings ({findings.length})</span>
          <div className="flex gap-2">
            {Object.entries(groupedFindings).map(([severity, items]) => (
              <Badge key={severity} className={getSeverityColor(severity)}>
                {items.length} {severity}
              </Badge>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {severityOrder.map(severity => {
              const items = groupedFindings[severity];
              if (!items || items.length === 0) return null;

              return (
                <div key={severity} className="space-y-2">
                  <h3 className="font-semibold capitalize flex items-center gap-2">
                    {getSeverityIcon(severity)}
                    {severity} ({items.length})
                  </h3>
                  {items.map((finding) => (
                    <div
                      key={finding.finding_id}
                      onClick={() => onSelectFinding(finding)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                        selectedFinding?.finding_id === finding.finding_id ? 'border-primary bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(finding.severity)}>
                              {finding.severity}
                            </Badge>
                            <span className="font-medium">{finding.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {finding.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Scanner: {finding.scanner}</span>
                            {finding.cwe_id && <span>CWE: {finding.cwe_id}</span>}
                            {finding.cvss_score && <span>CVSS: {finding.cvss_score}</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FindingsList;
