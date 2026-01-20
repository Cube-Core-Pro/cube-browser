"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AIAssistant');

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { aiService } from '@/lib/services/ai-service';
import { Sparkles, Search, Wrench, Workflow, Copy, Check, AlertCircle } from 'lucide-react';

interface AIAssistantProps {
  onClose?: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('selector');
  
  // Selector Generation
  const [selectorDescription, setSelectorDescription] = useState('');
  const [generatedSelector, setGeneratedSelector] = useState('');
  const [generatingSelector, setGeneratingSelector] = useState(false);
  const [copiedSelector, setCopiedSelector] = useState(false);
  
  // Selector Improvement
  const [currentSelector, setCurrentSelector] = useState('');
  const [selectorIssue, setSelectorIssue] = useState('');
  const [improvedSelector, setImprovedSelector] = useState('');
  const [improvingSelector, setImprovingSelector] = useState(false);
  const [copiedImprovedSelector, setCopiedImprovedSelector] = useState(false);
  
  // Workflow Generation
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [generatedWorkflow, setGeneratedWorkflow] = useState('');
  const [generatingWorkflow, setGeneratingWorkflow] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSelector = async () => {
    if (!selectorDescription.trim()) return;
    
    setGeneratingSelector(true);
    setError(null);
    setGeneratedSelector('');
    
    try {
      const selector = await aiService.generateSelector(selectorDescription);
      setGeneratedSelector(selector);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate selector');
    } finally {
      setGeneratingSelector(false);
    }
  };

  const handleImproveSelector = async () => {
    if (!currentSelector.trim() || !selectorIssue.trim()) return;
    
    setImprovingSelector(true);
    setError(null);
    setImprovedSelector('');
    
    try {
      const selector = await aiService.improveSelector(currentSelector, selectorIssue);
      setImprovedSelector(selector);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve selector');
    } finally {
      setImprovingSelector(false);
    }
  };

  const handleGenerateWorkflow = async () => {
    if (!workflowDescription.trim()) return;
    
    setGeneratingWorkflow(true);
    setError(null);
    setGeneratedWorkflow('');
    
    try {
      const workflow = await aiService.generateWorkflow(workflowDescription);
      setGeneratedWorkflow(workflow);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate workflow');
    } finally {
      setGeneratingWorkflow(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'selector' | 'improved' | 'workflow') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'selector') {
        setCopiedSelector(true);
        setTimeout(() => setCopiedSelector(false), 2000);
      } else if (type === 'improved') {
        setCopiedImprovedSelector(true);
        setTimeout(() => setCopiedImprovedSelector(false), 2000);
      } else {
        setCopiedWorkflow(true);
        setTimeout(() => setCopiedWorkflow(false), 2000);
      }
    } catch (err) {
      log.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">AI Assistant</CardTitle>
              <CardDescription>
                Powered by GPT-5.2 - Maximum intelligence
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="selector" className="gap-2">
              <Search className="h-4 w-4" />
              Generate Selector
            </TabsTrigger>
            <TabsTrigger value="improve" className="gap-2">
              <Wrench className="h-4 w-4" />
              Improve Selector
            </TabsTrigger>
            <TabsTrigger value="workflow" className="gap-2">
              <Workflow className="h-4 w-4" />
              Create Workflow
            </TabsTrigger>
          </TabsList>

          {/* Generate Selector Tab */}
          <TabsContent value="selector" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Describe the element you want to select</label>
              <Input
                placeholder="e.g., The blue login button in the header"
                value={selectorDescription}
                onChange={(e) => setSelectorDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateSelector()}
              />
              <p className="text-xs text-muted-foreground">
                Be as specific as possible about the element&apos;s appearance, location, and purpose
              </p>
            </div>

            <Button
              onClick={handleGenerateSelector}
              disabled={!selectorDescription.trim() || generatingSelector}
              className="w-full"
            >
              {generatingSelector ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Generate Selector
                </>
              )}
            </Button>

            {generatedSelector && (
              <div className="space-y-2">
                <Separator />
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Generated CSS Selector</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedSelector, 'selector')}
                  >
                    {copiedSelector ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="p-4 bg-muted rounded-md font-mono text-sm">
                  {generatedSelector}
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Ready to use
                </Badge>
              </div>
            )}
          </TabsContent>

          {/* Improve Selector Tab */}
          <TabsContent value="improve" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Selector</label>
              <Input
                placeholder="e.g., button.login-btn"
                value={currentSelector}
                onChange={(e) => setCurrentSelector(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">What&apos;s the problem?</label>
              <Input
                placeholder="e.g., Selector is too generic and matches multiple elements"
                value={selectorIssue}
                onChange={(e) => setSelectorIssue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImproveSelector()}
              />
              <p className="text-xs text-muted-foreground">
                Describe why the current selector isn&apos;t working as expected
              </p>
            </div>

            <Button
              onClick={handleImproveSelector}
              disabled={!currentSelector.trim() || !selectorIssue.trim() || improvingSelector}
              className="w-full"
            >
              {improvingSelector ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Improving...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Improve Selector
                </>
              )}
            </Button>

            {improvedSelector && (
              <div className="space-y-2">
                <Separator />
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Improved CSS Selector</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(improvedSelector, 'improved')}
                  >
                    {copiedImprovedSelector ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="p-4 bg-muted rounded-md font-mono text-sm">
                  {improvedSelector}
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Wrench className="h-3 w-3 mr-1" />
                  Optimized
                </Badge>
              </div>
            )}
          </TabsContent>

          {/* Generate Workflow Tab */}
          <TabsContent value="workflow" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Describe the automation task</label>
              <Input
                placeholder="e.g., Login to website, navigate to products page, and extract all product names"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateWorkflow()}
              />
              <p className="text-xs text-muted-foreground">
                Explain step-by-step what you want to automate
              </p>
            </div>

            <Button
              onClick={handleGenerateWorkflow}
              disabled={!workflowDescription.trim() || generatingWorkflow}
              className="w-full"
            >
              {generatingWorkflow ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Generating Workflow...
                </>
              ) : (
                <>
                  <Workflow className="h-4 w-4 mr-2" />
                  Generate Workflow
                </>
              )}
            </Button>

            {generatedWorkflow && (
              <div className="space-y-2">
                <Separator />
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Generated Workflow</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedWorkflow, 'workflow')}
                  >
                    {copiedWorkflow ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy JSON
                      </>
                    )}
                  </Button>
                </div>
                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <pre className="p-4 text-xs">
                    {JSON.stringify(JSON.parse(generatedWorkflow), null, 2)}
                  </pre>
                </ScrollArea>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Workflow className="h-3 w-3 mr-1" />
                  Workflow created
                </Badge>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
                <p className="text-xs text-muted-foreground">
                  Make sure your OpenAI API key is configured in Settings
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
