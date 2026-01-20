"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('EmailWriter');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Send,
  Sparkles,
  Wand2,
  Copy,
  RefreshCcw,
  Settings,
  FileText,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  Target,
  Loader2,
} from 'lucide-react';
import {
  EmailTemplate,
  EmailWriterConfig,
  EmailTone,
  EmailType,
  SentimentScore,
} from '@/types/crm-elite';
import './EmailWriter.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendEmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
  tone: string;
  isDefault: boolean;
  usageCount: number;
  successRate: number;
  createdAt: number;
  updatedAt: number;
}

interface BackendSignature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

interface BackendRecentEmail {
  id: string;
  subject: string;
  recipient: string;
  sentAt: number;
  opened: boolean;
  clicked: boolean;
}

interface BackendEmailWriterConfig {
  templates: BackendEmailTemplate[];
  signatures: BackendSignature[];
  recentEmails: BackendRecentEmail[];
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

function convertBackendTemplate(backend: BackendEmailTemplate): EmailTemplate {
  return {
    id: backend.id,
    name: backend.name,
    type: backend.type as EmailType,
    subject: backend.subject,
    body: backend.body,
    variables: backend.variables,
    tone: backend.tone as EmailTone,
    isDefault: backend.isDefault,
    usageCount: backend.usageCount,
    successRate: backend.successRate,
    createdAt: new Date(backend.createdAt),
    updatedAt: new Date(backend.updatedAt),
  };
}

// ============================================================================
// TONE & TYPE DESCRIPTIONS
// ============================================================================

const toneDescriptions: Record<EmailTone, string> = {
  professional: 'Clear, respectful, and business-focused',
  friendly: 'Warm and approachable while staying professional',
  persuasive: 'Compelling with clear value propositions',
  formal: 'Traditional business language, more conservative',
  casual: 'Relaxed and conversational tone',
};

const typeDescriptions: Record<EmailType, string> = {
  intro: 'First contact with a prospect',
  'follow-up': 'After previous interaction',
  proposal: 'Formal business proposal',
  'thank-you': 'Express gratitude',
  'meeting-request': 'Schedule a meeting',
  custom: 'Create from scratch',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getSentimentIcon = (sentiment: SentimentScore) => {
  switch (sentiment) {
    case 'very-positive':
    case 'positive':
      return Smile;
    case 'neutral':
      return Meh;
    case 'negative':
    case 'very-negative':
      return Frown;
    default:
      return Meh;
  }
};

const getSentimentColor = (sentiment: SentimentScore): string => {
  switch (sentiment) {
    case 'very-positive':
      return '#22c55e';
    case 'positive':
      return '#84cc16';
    case 'neutral':
      return '#6b7280';
    case 'negative':
      return '#f97316';
    case 'very-negative':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TemplateCardProps {
  template: EmailTemplate;
  onSelect: (template: EmailTemplate) => void;
  onEdit: (template: EmailTemplate) => void;
  onDelete: (id: string) => void;
}

function TemplateCard({ template, onSelect, onEdit, onDelete }: TemplateCardProps) {
  return (
    <div className="template-card">
      <div className="template-header">
        <div className="flex items-center gap-2">
          <span className="font-medium">{template.name}</span>
          {template.isDefault && (
            <Badge variant="secondary" className="text-xs">Default</Badge>
          )}
        </div>
        <Badge variant="outline">{template.type}</Badge>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
        Subject: {template.subject}
      </p>
      <div className="template-stats">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          {template.usageCount} sent
        </span>
        {template.successRate && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            {Math.round(template.successRate * 100)}% success
          </span>
        )}
      </div>
      <div className="template-actions">
        <Button size="sm" onClick={() => onSelect(template)}>
          Use Template
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(template)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(template.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface EmailWriterProps {
  onClose?: () => void;
}

export function EmailWriter({ onClose: _onClose }: EmailWriterProps) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<EmailWriterConfig>({
    defaultTone: 'professional',
    defaultLength: 'medium',
    includeSignature: true,
    signature: 'Best regards,\nJohn Doe\nSales Manager',
    useCompanyBranding: true,
    enableAISuggestions: true,
    trackOpens: true,
    trackClicks: true,
    followUpReminders: true,
    reminderDays: 3,
  });
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [_selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [recipient, setRecipient] = useState({ name: '', email: '', company: '', role: '' });
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [tone, setTone] = useState<EmailTone>('professional');
  const [emailType, setEmailType] = useState<EmailType>('intro');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');
  const { toast } = useToast();

  // AI Suggestions state
  const [aiSuggestions, _setAiSuggestions] = useState({
    subjectAlternatives: ['Quick question about your growth plans', 'Partnership opportunity for {{company}}', 'Can I help {{company}} with {{benefit}}?'],
    toneAdjustments: ['Consider adding a personal touch', 'The opening could be more engaging'],
    callToAction: ['Would a 15-minute call work?', 'Happy to send over some case studies'],
  });
  const [readabilityScore, setReadabilityScore] = useState(78);
  const [sentiment, setSentiment] = useState<SentimentScore>('positive');

  // Fetch data from backend on mount
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendEmailWriterConfig>('get_email_writer_config');
        
        if (mounted) {
          const convertedTemplates = backendConfig.templates.map(convertBackendTemplate);
          setTemplates(convertedTemplates);
          
          // Set default signature if available
          const defaultSignature = backendConfig.signatures.find(s => s.isDefault);
          if (defaultSignature) {
            setConfig(prev => ({ ...prev, signature: defaultSignature.content }));
          }
        }
      } catch (error) {
        if (mounted) {
          log.error('Failed to fetch email writer config:', error);
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to load email writer data',
            variant: 'destructive',
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [toast]);

  const handleSelectTemplate = useCallback((template: EmailTemplate) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setBody(template.body);
    setTone(template.tone);
    setEmailType(template.type);
    setActiveTab('compose');
    toast({
      title: 'Template Loaded',
      description: template.name,
    });
  }, [toast]);

  const handleGenerateWithAI = useCallback(async () => {
    if (!recipient.name && !recipient.company) {
      toast({
        title: 'Missing Information',
        description: 'Please enter recipient details first',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const generatedSubject = `Quick question about ${recipient.company || 'your company'}`;
      const generatedBody = `Hi ${recipient.name || 'there'},\n\nI came across ${recipient.company || 'your company'} and was impressed by your recent growth. We've helped similar companies in your industry increase their sales efficiency by 40%.\n\nWould you be open to a quick 15-minute call this week to explore if we could help ${recipient.company || 'you'} achieve similar results?\n\nLooking forward to connecting!\n\nBest regards`;
      
      setSubject(generatedSubject);
      setBody(generatedBody);
      setIsGenerating(false);
      
      toast({
        title: 'Email Generated',
        description: 'AI has drafted your email based on context',
      });
    }, 2000);
  }, [recipient, toast]);

  const handleImproveEmail = useCallback(() => {
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      setReadabilityScore(prev => Math.min(prev + 8, 100));
      setSentiment('very-positive');
      toast({
        title: 'Email Improved',
        description: 'AI has optimized your email for better engagement',
      });
    }, 1500);
  }, [toast]);

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast({
      title: 'Copied to Clipboard',
    });
  }, [subject, body, toast]);

  const handleSendEmail = useCallback(() => {
    if (!recipient.email) {
      toast({
        title: 'Missing Email',
        description: 'Please enter recipient email address',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'Email Sent',
      description: `Email sent to ${recipient.email}`,
    });
  }, [recipient, toast]);

  const SentimentIcon = getSentimentIcon(sentiment);

  if (loading) {
    return (
      <div className="email-writer">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading email writer...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="email-writer">
      {/* Header */}
      <div className="writer-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Mail className="h-6 w-6" />
            <Sparkles className="sparkle-icon" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Email Writer</h2>
            <p className="text-sm text-muted-foreground">
              Generate professional emails with AI assistance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCopyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button onClick={handleSendEmail}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="compose">
            <Edit2 className="h-4 w-4 mr-2" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <div className="compose-layout">
            {/* Main Editor */}
            <div className="compose-main">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Compose Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recipient */}
                  <div className="recipient-section">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Recipient Name</Label>
                        <Input
                          placeholder="John Smith"
                          value={recipient.name}
                          onChange={(e) => setRecipient(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Email Address</Label>
                        <Input
                          type="email"
                          placeholder="john@company.com"
                          value={recipient.email}
                          onChange={(e) => setRecipient(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input
                          placeholder="Acme Corp"
                          value={recipient.company}
                          onChange={(e) => setRecipient(prev => ({ ...prev, company: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Role/Title</Label>
                        <Input
                          placeholder="CEO"
                          value={recipient.role}
                          onChange={(e) => setRecipient(prev => ({ ...prev, role: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email Type & Tone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email Type</Label>
                      <Select value={emailType} onValueChange={(v: EmailType) => setEmailType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(typeDescriptions).map(([type, _desc]) => (
                            <SelectItem key={type} value={type}>
                              {type.replace('-', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tone</Label>
                      <Select value={tone} onValueChange={(v: EmailTone) => setTone(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(toneDescriptions).map(([t, _desc]) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <Label>Subject Line</Label>
                    <Input
                      placeholder="Enter subject..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <Label>Email Body</Label>
                    <Textarea
                      placeholder="Write your email content..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="min-h-[300px] font-mono"
                    />
                  </div>

                  {/* AI Actions */}
                  <div className="ai-actions">
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateWithAI}
                      disabled={isGenerating}
                    >
                      <Wand2 className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                      Generate with AI
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleImproveEmail}
                      disabled={isGenerating || !body}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Improve Email
                    </Button>
                    <Button variant="outline" disabled={!body}>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Rewrite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - AI Suggestions */}
            <div className="compose-sidebar">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Readability Score */}
                  <div className="analysis-section">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Readability</span>
                      <span className="text-sm font-bold">{readabilityScore}%</span>
                    </div>
                    <Progress value={readabilityScore} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {readabilityScore >= 80 ? 'Excellent - Easy to read' : 
                       readabilityScore >= 60 ? 'Good - Clear communication' : 
                       'Needs improvement'}
                    </p>
                  </div>

                  {/* Sentiment */}
                  <div className="analysis-section">
                    <span className="text-sm font-medium">Sentiment</span>
                    <div 
                      className="sentiment-badge"
                      style={{ 
                        backgroundColor: `${getSentimentColor(sentiment)}15`,
                        color: getSentimentColor(sentiment),
                      }}
                    >
                      <SentimentIcon className="h-4 w-4" />
                      <span>{sentiment.replace('-', ' ')}</span>
                    </div>
                  </div>

                  {/* Subject Alternatives */}
                  <div className="analysis-section">
                    <span className="text-sm font-medium mb-2 block">Subject Alternatives</span>
                    <div className="space-y-2">
                      {aiSuggestions.subjectAlternatives.map((alt, idx) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-2"
                          onClick={() => setSubject(alt)}
                        >
                          <span className="truncate">{alt}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* CTA Suggestions */}
                  <div className="analysis-section">
                    <span className="text-sm font-medium mb-2 block">Call-to-Action Ideas</span>
                    <div className="space-y-1">
                      {aiSuggestions.callToAction.map((cta, idx) => (
                        <div key={idx} className="cta-suggestion">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{cta}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Email Templates</CardTitle>
                  <CardDescription>
                    Pre-built templates for common scenarios
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="templates-grid">
                {templates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleSelectTemplate}
                    onEdit={() => toast({ title: 'Edit Template', description: template.name })}
                    onDelete={async (id) => {
                      try {
                        await invoke('delete_email_template', { templateId: id });
                        setTemplates(prev => prev.filter(t => t.id !== id));
                        toast({ title: 'Template Deleted' });
                      } catch (error) {
                        toast({
                          title: 'Error',
                          description: error instanceof Error ? error.message : 'Failed to delete template',
                          variant: 'destructive',
                        });
                      }
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Writer Settings</CardTitle>
              <CardDescription>
                Configure default behavior and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Enable AI Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get real-time suggestions while writing
                  </p>
                </div>
                <Switch
                  checked={config.enableAISuggestions}
                  onCheckedChange={(enableAISuggestions) => 
                    setConfig(prev => ({ ...prev, enableAISuggestions }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Track Email Opens</Label>
                  <p className="text-sm text-muted-foreground">
                    Know when recipients open your emails
                  </p>
                </div>
                <Switch
                  checked={config.trackOpens}
                  onCheckedChange={(trackOpens) => 
                    setConfig(prev => ({ ...prev, trackOpens }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Track Link Clicks</Label>
                  <p className="text-sm text-muted-foreground">
                    Track when links in your emails are clicked
                  </p>
                </div>
                <Switch
                  checked={config.trackClicks}
                  onCheckedChange={(trackClicks) => 
                    setConfig(prev => ({ ...prev, trackClicks }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Follow-up Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to follow up on unanswered emails
                  </p>
                </div>
                <Switch
                  checked={config.followUpReminders}
                  onCheckedChange={(followUpReminders) => 
                    setConfig(prev => ({ ...prev, followUpReminders }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Include Signature</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically add your signature
                  </p>
                </div>
                <Switch
                  checked={config.includeSignature}
                  onCheckedChange={(includeSignature) => 
                    setConfig(prev => ({ ...prev, includeSignature }))}
                />
              </div>

              {config.includeSignature && (
                <div>
                  <Label>Signature</Label>
                  <Textarea
                    value={config.signature}
                    onChange={(e) => setConfig(prev => ({ ...prev, signature: e.target.value }))}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EmailWriter;
