'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Info, Shield, ExternalLink, 
  Copy, Check, Code, FileText, Link, BookOpen 
} from 'lucide-react';
import type { VulnerabilityFinding } from '@/types/security-lab';

interface FindingDetailsProps {
  finding: VulnerabilityFinding | null;
  onExploit: (finding: VulnerabilityFinding) => void;
}

export const FindingDetails: React.FC<FindingDetailsProps> = ({
  finding,
  onExploit
}) => {
  const [copiedPoc, setCopiedPoc] = useState(false);

  if (!finding) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Finding Selected</h3>
            <p className="text-muted-foreground">
              Select a vulnerability from the list to view details.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPoc(true);
    setTimeout(() => setCopiedPoc(false), 2000);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getSeverityColor(finding.severity)}>
              {finding.severity}
            </Badge>
            <span className="truncate">{finding.name}</span>
          </div>
          <Button onClick={() => onExploit(finding)} variant="destructive" size="sm">
            <Code className="h-4 w-4 mr-1" />
            Exploit
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="remediation">Remediation</TabsTrigger>
            <TabsTrigger value="references">References</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="overview" className="m-0 space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{finding.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Scanner</h4>
                  <Badge variant="outline">{finding.scanner}</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">CVSS Score</h4>
                  <span className="text-2xl font-bold">{finding.cvss_score || 'N/A'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Affected URL</h4>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <code className="text-xs font-mono flex-1 truncate">{finding.affected_url}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {finding.cwe_id && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">CWE Reference</h4>
                  <Badge variant="secondary">{finding.cwe_id}</Badge>
                </div>
              )}
            </TabsContent>

            <TabsContent value="technical" className="m-0 space-y-4">
              {finding.evidence && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">Evidence</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(finding.evidence || '')}
                    >
                      {copiedPoc ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto">
                    {finding.evidence}
                  </pre>
                </div>
              )}

              {finding.affected_parameter && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Affected Parameter</h4>
                  <code className="bg-muted px-2 py-1 rounded text-sm">{finding.affected_parameter}</code>
                </div>
              )}

              {finding.cve_id && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">CVE ID</h4>
                  <Badge variant="secondary">{finding.cve_id}</Badge>
                </div>
              )}
            </TabsContent>

            <TabsContent value="remediation" className="m-0 space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Recommended Fix</h4>
                <p className="text-sm text-muted-foreground">
                  {finding.solution || 'No specific remediation guidance available for this vulnerability.'}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2 text-blue-800 dark:text-blue-200">
                  <Info className="h-4 w-4 inline mr-2" />
                  Best Practices
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
                  <li>Always validate and sanitize user input</li>
                  <li>Use parameterized queries for database operations</li>
                  <li>Implement proper output encoding</li>
                  <li>Keep all dependencies updated</li>
                  <li>Follow the principle of least privilege</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="references" className="m-0 space-y-4">
              {finding.references && finding.references.length > 0 ? (
                <div className="space-y-2">
                  {finding.references.map((ref, index) => (
                    <a
                      key={index}
                      href={ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-accent transition-colors"
                    >
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate flex-1">{ref}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No external references available.</p>
              )}

              {finding.cwe_id && (
                <a
                  href={`https://cwe.mitre.org/data/definitions/${finding.cwe_id.replace('CWE-', '')}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-accent transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">CWE Database - {finding.cwe_id}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FindingDetails;
