'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import {
  Mail,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Pause,
  Copy,
  Trash2,
  Edit,
  Eye,
  BarChart2,
  Clock,
  Users,
  MousePointer,
  TrendingUp,
  Send,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Download,
  Upload,
  Calendar,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Layout,
  Code,
  Globe,
  FileText,
  Tag,
  RefreshCw,
  X,
  Loader2,
  Wand2,
  FileEdit,
  MessageSquare,
  Megaphone
} from 'lucide-react';
import { CampaignService } from '@/lib/services/marketing-service';
import { AIService } from '@/lib/services/ai-service';
import {
  TourProvider,
  TourTooltip,
  TourOverlay,
  TourLauncher,
  TourWelcomeModal,
  TourCompletionModal,
  allTourSteps,
  allTourSections
} from '@/components/tour';
import { logger } from '@/lib/services/logger-service';
import './EmailCampaigns.css';

const log = logger.scope('EmailCampaigns');

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  type: 'broadcast' | 'automated' | 'sequence' | 'ab-test';
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  revenue: number;
  scheduledDate?: string;
  sentDate?: string;
  createdAt: string;
  tags: string[];
  fromName: string;
  fromEmail: string;
  previewText?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  isCustom: boolean;
}

interface EmailCampaignsProps {
  onBack?: () => void;
}

export const EmailCampaigns: React.FC<EmailCampaignsProps> = ({
  onBack
}) => {
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'analytics'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [editorStep, setEditorStep] = useState<'setup' | 'design' | 'recipients' | 'review'>('setup');
  
  // AI Writer Modal States
  const [showAIWriter, setShowAIWriter] = useState(false);
  const [aiWriterPrompt, setAIWriterPrompt] = useState('');
  const [aiWriterType, setAIWriterType] = useState<'subject' | 'body' | 'full'>('full');
  const [aiWriterTone, setAIWriterTone] = useState<'professional' | 'casual' | 'urgent' | 'friendly'>('professional');
  const [aiGeneratedContent, setAIGeneratedContent] = useState<{ subject: string; body: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  
  // Tour States
  const [showTourWelcome, setShowTourWelcome] = useState(false);
  const [showTourCompletion, setShowTourCompletion] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Campaigns state - loaded from backend
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);

  // Load campaigns from backend
  const loadCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const backendCampaigns = await CampaignService.getAll();
      
      // Map backend campaigns to frontend format
      const mappedCampaigns: EmailCampaign[] = backendCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        status: mapCampaignStatus(c.status),
        type: mapCampaignType(c.campaign_type),
        recipients: c.audience.total,
        sent: c.metrics.sent,
        opened: c.metrics.opened,
        clicked: c.metrics.clicked,
        bounced: c.metrics.bounced,
        unsubscribed: c.metrics.unsubscribed,
        revenue: c.metrics.converted * 50, // Estimated revenue per conversion
        scheduledDate: c.scheduled_at || undefined,
        sentDate: c.sent_at || undefined,
        createdAt: c.created_at,
        tags: c.audience.segments,
        fromName: 'CUBE Marketing',
        fromEmail: 'marketing@cube.com',
        previewText: c.content.substring(0, 100),
      }));
      
      setCampaigns(mappedCampaigns);
    } catch (err) {
      log.error('Failed to load campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      // Keep any existing campaigns on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper functions to map backend types to frontend types
  const mapCampaignStatus = (status: string): 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' => {
    const statusMap: Record<string, 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'> = {
      'Draft': 'draft',
      'Scheduled': 'scheduled',
      'Running': 'sending',
      'Completed': 'sent',
      'Paused': 'paused',
    };
    return statusMap[status] || 'draft';
  };

  const mapCampaignType = (type: string): 'broadcast' | 'automated' | 'sequence' | 'ab-test' => {
    const typeMap: Record<string, 'broadcast' | 'automated' | 'sequence' | 'ab-test'> = {
      'Email': 'broadcast',
      'SMS': 'broadcast',
      'Push': 'automated',
      'Social': 'sequence',
      'Ads': 'ab-test',
    };
    return typeMap[type] || 'broadcast';
  };

  // Load campaigns on mount
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Check if user should see tour welcome
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('cube-email-tour-seen');
    if (!hasSeenTour) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        setShowTourWelcome(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Tour handlers
  const handleStartTour = useCallback(() => {
    localStorage.setItem('cube-email-tour-seen', 'true');
    setShowTourWelcome(false);
  }, []);

  const handleSkipTour = useCallback(() => {
    localStorage.setItem('cube-email-tour-seen', 'true');
    setShowTourWelcome(false);
  }, []);

  const handleRestartTour = useCallback(() => {
    localStorage.removeItem('cube-tour-progress');
    setShowTourCompletion(false);
  }, []);

  const [templates] = useState<EmailTemplate[]>([
    { id: '1', name: 'Product Launch', category: 'Marketing', thumbnail: '🚀', isCustom: false },
    { id: '2', name: 'Newsletter', category: 'Content', thumbnail: '📰', isCustom: false },
    { id: '3', name: 'Welcome Email', category: 'Onboarding', thumbnail: '👋', isCustom: false },
    { id: '4', name: 'Sale Announcement', category: 'Promotional', thumbnail: '🎉', isCustom: false },
    { id: '5', name: 'Abandoned Cart', category: 'E-commerce', thumbnail: '🛒', isCustom: false },
    { id: '6', name: 'Feedback Request', category: 'Engagement', thumbnail: '⭐', isCustom: false },
    { id: '7', name: 'Event Invitation', category: 'Events', thumbnail: '📅', isCustom: false },
    { id: '8', name: 'Custom Template', category: 'Custom', thumbnail: '✨', isCustom: true }
  ]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [campaigns, searchQuery, statusFilter, typeFilter]);

  const totalStats = useMemo(() => {
    const sentCampaigns = campaigns.filter(c => c.status === 'sent' || c.status === 'sending');
    return {
      totalSent: sentCampaigns.reduce((sum, c) => sum + c.sent, 0),
      totalOpened: sentCampaigns.reduce((sum, c) => sum + c.opened, 0),
      totalClicked: sentCampaigns.reduce((sum, c) => sum + c.clicked, 0),
      totalRevenue: sentCampaigns.reduce((sum, c) => sum + c.revenue, 0),
      avgOpenRate: sentCampaigns.length > 0
        ? sentCampaigns.reduce((sum, c) => sum + (c.sent > 0 ? (c.opened / c.sent) * 100 : 0), 0) / sentCampaigns.length
        : 0,
      avgClickRate: sentCampaigns.length > 0
        ? sentCampaigns.reduce((sum, c) => sum + (c.opened > 0 ? (c.clicked / c.opened) * 100 : 0), 0) / sentCampaigns.length
        : 0
    };
  }, [campaigns]);

  const handleSelectAll = useCallback(() => {
    if (selectedCampaigns.length === filteredCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(filteredCampaigns.map(c => c.id));
    }
  }, [filteredCampaigns, selectedCampaigns]);

  const handleSelectCampaign = useCallback((id: string) => {
    setSelectedCampaigns(prev =>
      prev.includes(id)
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  }, []);

  const handleViewAnalytics = useCallback((campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setView('analytics');
  }, []);

  const handleEditCampaign = useCallback((campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setView('edit');
    setEditorStep('setup');
  }, []);

  // Campaign CRUD Operations
  const handleCreateCampaign = useCallback(async (campaignData: {
    name: string;
    subject: string;
    content: string;
    type: string;
    audience?: string[];
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newCampaign = await CampaignService.create({
        name: campaignData.name,
        campaignType: campaignData.type === 'broadcast' ? 'Email' : 
                       campaignData.type === 'automated' ? 'Push' :
                       campaignData.type === 'sequence' ? 'Social' : 'Email',
        subject: campaignData.subject,
        content: campaignData.content,
      });
      
      // Reload campaigns to get updated list
      await loadCampaigns();
      
      // Navigate back to list
      setView('list');
      
      return newCampaign;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [loadCampaigns]);

  const handleDuplicateCampaign = useCallback(async (campaign: EmailCampaign) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create a copy with "(Copy)" suffix
      await handleCreateCampaign({
        name: `${campaign.name} (Copy)`,
        subject: campaign.subject,
        content: campaign.previewText || '',
        type: campaign.type,
        audience: campaign.tags,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate campaign';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [handleCreateCampaign]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedCampaigns.length === 0) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Delete all selected campaigns
      await Promise.all(selectedCampaigns.map(id => CampaignService.delete(id)));
      
      // Reload campaigns
      await loadCampaigns();
      
      // Clear selection
      setSelectedCampaigns([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete campaigns';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCampaigns, loadCampaigns]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'sent': return <CheckCircle size={14} />;
      case 'scheduled': return <Clock size={14} />;
      case 'sending': return <RefreshCw size={14} className="spinning" />;
      case 'paused': return <Pause size={14} />;
      case 'draft': return <FileText size={14} />;
      default: return null;
    }
  };

  // AI Writer Functions
  const handleOpenAIWriter = useCallback(() => {
    setShowAIWriter(true);
    setAIWriterPrompt('');
    setAIGeneratedContent(null);
    setAIError(null);
  }, []);

  const handleCloseAIWriter = useCallback(() => {
    setShowAIWriter(false);
    setAIWriterPrompt('');
    setAIGeneratedContent(null);
    setAIError(null);
    setIsGenerating(false);
  }, []);

  const generateEmailContent = useCallback(async () => {
    if (!aiWriterPrompt.trim()) {
      setAIError('Please describe what you want to write about');
      return;
    }

    setIsGenerating(true);
    setAIError(null);

    try {
      // Build the AI prompt based on user input
      const toneDescriptions: Record<string, string> = {
        professional: 'Use a professional, business-appropriate tone.',
        casual: 'Use a casual, conversational tone.',
        urgent: 'Use an urgent, time-sensitive tone with clear calls to action.',
        friendly: 'Use a warm, friendly tone that builds rapport.'
      };

      const typeInstructions: Record<string, string> = {
        subject: 'Generate only an email subject line (max 60 characters).',
        body: 'Generate only the email body content (HTML formatted).',
        full: 'Generate both a compelling subject line AND the full email body content.'
      };

      const fullPrompt = `You are an expert email marketing copywriter. ${typeInstructions[aiWriterType]}

${toneDescriptions[aiWriterTone]}

User Request: ${aiWriterPrompt}

Please generate:
${aiWriterType === 'subject' || aiWriterType === 'full' ? '1. A compelling subject line (60 chars max) that drives opens' : ''}
${aiWriterType === 'body' || aiWriterType === 'full' ? `${aiWriterType === 'full' ? '2.' : '1.'} Professional email body with:
   - Strong opening hook
   - Clear value proposition
   - Compelling call-to-action
   - Professional sign-off` : ''}

Format the response as JSON:
{
  "subject": "Your subject line here",
  "body": "Your email body here (HTML formatted)"
}`;

      // Use the AI service to generate content
      const response = await AIService.Chat.sendMessage(fullPrompt);
      
      // Parse the AI response
      const content = response.content;
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*"subject"[\s\S]*"body"[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          setAIGeneratedContent({
            subject: parsed.subject || '',
            body: parsed.body || ''
          });
        } catch {
          // If JSON parsing fails, try to extract content manually
          const subjectMatch = content.match(/subject['":\s]+([^\n"]+)/i);
          const bodyMatch = content.match(/body['":\s]+([\s\S]+?)(?=\}|$)/i);
          
          setAIGeneratedContent({
            subject: subjectMatch ? subjectMatch[1].trim().replace(/['"]/g, '') : '',
            body: bodyMatch ? bodyMatch[1].trim().replace(/^['"]|['"]$/g, '') : content
          });
        }
      } else {
        // Fallback: use the content as body
        setAIGeneratedContent({
          subject: aiWriterType === 'body' ? '' : 'Generated Email',
          body: content
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate content';
      setAIError(errorMessage);
      log.error('AI Writer Error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [aiWriterPrompt, aiWriterType, aiWriterTone]);

  const handleUseGeneratedContent = useCallback(() => {
    // This would typically update the campaign form fields
    // For now, we'll just close the modal with the content available
    log.debug('Using generated content:', aiGeneratedContent);
    handleCloseAIWriter();
  }, [aiGeneratedContent, handleCloseAIWriter]);

  const renderListView = () => (
    <>
      <div className="email-header" data-tour="email-header">
        <div className="header-left">
          {onBack && (
            <button className="btn-back" onClick={onBack} title="Go back">
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1><Mail size={24} /> Email Campaigns</h1>
            <p className="header-subtitle">Create, manage, and track your email marketing campaigns</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-ai" onClick={handleOpenAIWriter} data-tour="ai-writer-btn" title="Open AI Writer">
            <Sparkles size={16} />
            AI Writer
          </button>
          <button className="btn-primary" onClick={() => setView('create')} data-tour="new-campaign-btn" title="Create new campaign">
            <Plus size={16} />
            New Campaign
          </button>
        </div>
      </div>

      <div className="email-stats" data-tour="stats-overview">
        <div className="stat-card" data-tour="open-rate">
          <div className="stat-icon emails">
            <Send size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatNumber(totalStats.totalSent)}</span>
            <span className="stat-label">Emails Sent</span>
          </div>
        </div>
        <div className="stat-card" data-tour="click-rate">
          <div className="stat-icon opens">
            <Eye size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalStats.avgOpenRate.toFixed(1)}%</span>
            <span className="stat-label">Avg Open Rate</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon clicks">
            <MousePointer size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalStats.avgClickRate.toFixed(1)}%</span>
            <span className="stat-label">Avg Click Rate</span>
          </div>
        </div>
        <div className="stat-card highlight" data-tour="revenue-tracking">
          <div className="stat-icon revenue">
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(totalStats.totalRevenue)}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>
      </div>

      <div className="email-toolbar" data-tour="toolbar">
        <div className="toolbar-left">
          <div className="search-box" data-tour="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={`btn-filter ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            data-tour="filter-btn"
            title="Toggle filters"
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
        <div className="toolbar-right">
          {selectedCampaigns.length > 0 && (
            <div className="bulk-actions" data-tour="bulk-actions">
              <span className="selected-count">{selectedCampaigns.length} selected</span>
              <button 
                className="btn-icon" 
                title="Duplicate"
                onClick={() => {
                  const firstSelected = campaigns.find(c => c.id === selectedCampaigns[0]);
                  if (firstSelected) handleDuplicateCampaign(firstSelected);
                }}
              >
                <Copy size={16} />
              </button>
              <button className="btn-icon" title="Archive">
                <Download size={16} />
              </button>
              <button 
                className="btn-icon danger" 
                title="Delete"
                onClick={handleBulkDelete}
                disabled={isLoading}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} title="Filter by status" aria-label="Filter campaigns by status">
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sending">Sending</option>
              <option value="sent">Sent</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} title="Filter by type" aria-label="Filter campaigns by type">
              <option value="all">All Types</option>
              <option value="broadcast">Broadcast</option>
              <option value="automated">Automated</option>
              <option value="sequence">Sequence</option>
              <option value="ab-test">A/B Test</option>
            </select>
          </div>
          <button className="btn-text" onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }} title="Clear all filters">
            Clear Filters
          </button>
        </div>
      )}

      <div className="campaigns-table" data-tour="campaign-list">
        <table>
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                  onChange={handleSelectAll}
                  title="Select all campaigns"
                  aria-label="Select all campaigns on this page"
                />
              </th>
              <th>Campaign</th>
              <th>Status</th>
              <th>Recipients</th>
              <th>Open Rate</th>
              <th>Click Rate</th>
              <th>Revenue</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <Mail size={64} />
                    <h3>No campaigns yet</h3>
                    <p>
                      {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
                        ? 'No campaigns match your filters. Try adjusting your search criteria.'
                        : 'Create your first email campaign to start engaging with your audience.'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
                      <button className="btn-primary" onClick={() => setView('create')} title="Create your first campaign">
                        <Plus size={16} />
                        Create Campaign
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredCampaigns.map(campaign => {
                const openRate = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : '0.0';
                const clickRate = campaign.opened > 0 ? ((campaign.clicked / campaign.opened) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={campaign.id}>
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.includes(campaign.id)}
                        onChange={() => handleSelectCampaign(campaign.id)}
                        title={`Select ${campaign.name}`}
                        aria-label={`Select campaign: ${campaign.name}`}
                      />
                    </td>
                    <td>
                      <div className="campaign-info">
                        <div className={`campaign-type-icon ${campaign.type}`}>
                          <Mail size={16} />
                        </div>
                        <div className="campaign-details">
                          <span className="campaign-name">{campaign.name}</span>
                          <span className="campaign-subject">{campaign.subject}</span>
                          <div className="campaign-tags">
                            {campaign.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="tag">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${campaign.status}`}>
                        {getStatusIcon(campaign.status)}
                        {campaign.status}
                      </span>
                    </td>
                    <td>
                      <span className="recipients-count">{formatNumber(campaign.recipients)}</span>
                    </td>
                    <td>
                      <div className="rate-cell">
                        <span className="rate-value">{openRate}%</span>
                        <div className="rate-bar">
                          <div className="rate-fill opens" ref={(el) => { if (el) el.style.width = `${Math.min(parseFloat(openRate), 100)}%`; }} />
                        </div>
                      </div>
                    </td>
                  <td>
                    <div className="rate-cell">
                      <span className="rate-value">{clickRate}%</span>
                      <div className="rate-bar">
                        <div className="rate-fill clicks" ref={(el) => { if (el) el.style.width = `${Math.min(parseFloat(clickRate) * 5, 100)}%`; }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="revenue-value">
                      {campaign.revenue > 0 ? formatCurrency(campaign.revenue) : '-'}
                    </span>
                  </td>
                  <td>
                    <span className="date-cell">
                      {campaign.sentDate || campaign.scheduledDate?.split('T')[0] || campaign.createdAt}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon"
                        title="View Analytics"
                        onClick={() => handleViewAnalytics(campaign)}
                      >
                        <BarChart2 size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Edit"
                        onClick={() => handleEditCampaign(campaign)}
                      >
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon" title="More">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderCreateView = () => (
    <>
      <div className="email-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => setView('list')} title="Back to campaign list">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1><Plus size={24} /> Create Campaign</h1>
            <p className="header-subtitle">Design and send a new email campaign</p>
          </div>
        </div>
      </div>

      <div className="editor-steps">
        <div className={`step ${editorStep === 'setup' ? 'active' : ''}`} onClick={() => setEditorStep('setup')}>
          <span className="step-number">1</span>
          <span className="step-label">Setup</span>
        </div>
        <div className="step-connector" />
        <div className={`step ${editorStep === 'design' ? 'active' : ''}`} onClick={() => setEditorStep('design')}>
          <span className="step-number">2</span>
          <span className="step-label">Design</span>
        </div>
        <div className="step-connector" />
        <div className={`step ${editorStep === 'recipients' ? 'active' : ''}`} onClick={() => setEditorStep('recipients')}>
          <span className="step-number">3</span>
          <span className="step-label">Recipients</span>
        </div>
        <div className="step-connector" />
        <div className={`step ${editorStep === 'review' ? 'active' : ''}`} onClick={() => setEditorStep('review')}>
          <span className="step-number">4</span>
          <span className="step-label">Review & Send</span>
        </div>
      </div>

      <div className="editor-content">
        {editorStep === 'setup' && (
          <div className="setup-step">
            <div className="form-section">
              <h3>Campaign Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Campaign Name</label>
                  <input type="text" placeholder="e.g., Holiday Sale 2024" />
                </div>
                <div className="form-group">
                  <label>Campaign Type</label>
                  <select title="Select campaign type" aria-label="Select campaign type">
                    <option value="broadcast">Broadcast (One-time send)</option>
                    <option value="automated">Automated (Trigger-based)</option>
                    <option value="sequence">Sequence (Drip campaign)</option>
                    <option value="ab-test">A/B Test</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Email Settings</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Subject Line</label>
                  <div className="input-with-ai">
                    <input type="text" placeholder="Enter your subject line..." />
                    <button className="btn-ai-suggest" title="Get AI suggestions for subject line">
                      <Sparkles size={14} />
                      AI Suggest
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Preview Text</label>
                  <input type="text" placeholder="Text that appears after subject in inbox..." />
                </div>
                <div className="form-group half">
                  <label>From Name</label>
                  <input type="text" placeholder="Your Name or Company" />
                </div>
                <div className="form-group half">
                  <label>From Email</label>
                  <input type="email" placeholder="email@company.com" />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setView('list')} title="Cancel and return to list">
                Cancel
              </button>
              <button className="btn-primary" onClick={() => setEditorStep('design')} title="Proceed to design step">
                Continue to Design
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {editorStep === 'design' && (
          <div className="design-step">
            <div className="template-section">
              <h3>Choose a Template</h3>
              <p className="section-description">Start with a pre-designed template or build from scratch</p>
              <div className="templates-grid">
                {templates.map(template => (
                  <div key={template.id} className={`template-card ${template.isCustom ? 'custom' : ''}`}>
                    <div className="template-preview">
                      <span className="template-emoji">{template.thumbnail}</span>
                    </div>
                    <div className="template-info">
                      <span className="template-name">{template.name}</span>
                      <span className="template-category">{template.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="design-tools">
              <h3>Design Tools</h3>
              <div className="tools-grid">
                <button className="tool-card" title="Open drag and drop email builder">
                  <Layout size={24} />
                  <span>Drag & Drop Builder</span>
                </button>
                <button className="tool-card" title="Edit email HTML directly">
                  <Code size={24} />
                  <span>HTML Editor</span>
                </button>
                <button className="tool-card" title="Get AI assistance with design">
                  <Sparkles size={24} />
                  <span>AI Design Assistant</span>
                </button>
                <button className="tool-card" title="Import HTML from file">
                  <Upload size={24} />
                  <span>Import HTML</span>
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setEditorStep('setup')} title="Go back to setup">
                <ArrowLeft size={16} />
                Back
              </button>
              <button className="btn-primary" onClick={() => setEditorStep('recipients')} title="Continue to recipients selection">
                Continue to Recipients
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {editorStep === 'recipients' && (
          <div className="recipients-step">
            <div className="form-section">
              <h3>Select Recipients</h3>
              <div className="recipient-options">
                <label className="recipient-option">
                  <input type="radio" name="recipients" value="all" />
                  <div className="option-content">
                    <Users size={20} />
                    <div>
                      <span className="option-title">All Subscribers</span>
                      <span className="option-count">52,340 contacts</span>
                    </div>
                  </div>
                </label>
                <label className="recipient-option">
                  <input type="radio" name="recipients" value="segment" />
                  <div className="option-content">
                    <Target size={20} />
                    <div>
                      <span className="option-title">Specific Segment</span>
                      <span className="option-desc">Choose from your saved segments</span>
                    </div>
                  </div>
                </label>
                <label className="recipient-option">
                  <input type="radio" name="recipients" value="tag" />
                  <div className="option-content">
                    <Tag size={20} />
                    <div>
                      <span className="option-title">By Tags</span>
                      <span className="option-desc">Select contacts with specific tags</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>Sending Options</h3>
              <div className="sending-options">
                <label className="sending-option">
                  <input type="radio" name="sending" value="now" />
                  <div className="option-content">
                    <Zap size={20} />
                    <div>
                      <span className="option-title">Send Immediately</span>
                      <span className="option-desc">Campaign will be sent right away</span>
                    </div>
                  </div>
                </label>
                <label className="sending-option">
                  <input type="radio" name="sending" value="schedule" />
                  <div className="option-content">
                    <Calendar size={20} />
                    <div>
                      <span className="option-title">Schedule for Later</span>
                      <span className="option-desc">Choose a specific date and time</span>
                    </div>
                  </div>
                </label>
                <label className="sending-option">
                  <input type="radio" name="sending" value="optimal" />
                  <div className="option-content">
                    <Sparkles size={20} />
                    <div>
                      <span className="option-title">AI Optimal Time</span>
                      <span className="option-desc">Let AI choose the best time for each recipient</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setEditorStep('design')} title="Go back to design">
                <ArrowLeft size={16} />
                Back
              </button>
              <button className="btn-primary" onClick={() => setEditorStep('review')} title="Review campaign before sending">
                Review Campaign
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {editorStep === 'review' && (
          <div className="review-step">
            <div className="review-summary">
              <h3>Campaign Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Campaign Name</span>
                  <span className="summary-value">Holiday Sale 2024</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Subject Line</span>
                  <span className="summary-value">🎄 25% Off Everything - Holiday Special!</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Recipients</span>
                  <span className="summary-value">52,340 subscribers</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Sending</span>
                  <span className="summary-value">AI Optimal Time</span>
                </div>
              </div>
            </div>

            <div className="review-checklist">
              <h3>Pre-Send Checklist</h3>
              <div className="checklist-items">
                <div className="checklist-item passed">
                  <CheckCircle size={20} />
                  <span>Subject line is set</span>
                </div>
                <div className="checklist-item passed">
                  <CheckCircle size={20} />
                  <span>Email content is ready</span>
                </div>
                <div className="checklist-item passed">
                  <CheckCircle size={20} />
                  <span>Recipients selected</span>
                </div>
                <div className="checklist-item passed">
                  <CheckCircle size={20} />
                  <span>Unsubscribe link present</span>
                </div>
                <div className="checklist-item warning">
                  <AlertCircle size={20} />
                  <span>Consider adding preview text for better inbox display</span>
                </div>
              </div>
            </div>

            <div className="review-actions">
              <button className="btn-secondary" title="Send a test email to yourself">
                <Eye size={16} />
                Send Test Email
              </button>
              <button className="btn-preview" title="Preview email in browser">
                <Globe size={16} />
                Preview in Browser
              </button>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setEditorStep('recipients')} title="Go back to recipients">
                <ArrowLeft size={16} />
                Back
              </button>
              <button className="btn-send" title="Schedule and send campaign">
                <Send size={16} />
                Schedule Campaign
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderAnalyticsView = () => {
    if (!selectedCampaign) return null;

    const openRate = selectedCampaign.sent > 0 ? ((selectedCampaign.opened / selectedCampaign.sent) * 100) : 0;
    const clickRate = selectedCampaign.opened > 0 ? ((selectedCampaign.clicked / selectedCampaign.opened) * 100) : 0;
    const bounceRate = selectedCampaign.sent > 0 ? ((selectedCampaign.bounced / selectedCampaign.sent) * 100) : 0;

    return (
      <>
        <div className="email-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => { setView('list'); setSelectedCampaign(null); }} title="Back to campaign list">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1><BarChart2 size={24} /> Campaign Analytics</h1>
              <p className="header-subtitle">{selectedCampaign.name}</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" title="Export analytics report">
              <Download size={16} />
              Export Report
            </button>
            <button className="btn-primary" onClick={() => handleEditCampaign(selectedCampaign)} title="Duplicate this campaign">
              <Copy size={16} />
              Duplicate Campaign
            </button>
          </div>
        </div>

        <div className="analytics-overview">
          <div className="analytics-card main">
            <div className="card-header">
              <h3>Performance Overview</h3>
              <span className={`status-badge status-${selectedCampaign.status}`}>
                {getStatusIcon(selectedCampaign.status)}
                {selectedCampaign.status}
              </span>
            </div>
            <div className="analytics-stats">
              <div className="analytics-stat">
                <Send size={24} className="stat-icon" />
                <div>
                  <span className="stat-value">{formatNumber(selectedCampaign.sent)}</span>
                  <span className="stat-label">Emails Sent</span>
                </div>
              </div>
              <div className="analytics-stat">
                <Eye size={24} className="stat-icon" />
                <div>
                  <span className="stat-value">{openRate.toFixed(1)}%</span>
                  <span className="stat-label">Open Rate</span>
                  <span className="stat-count">{formatNumber(selectedCampaign.opened)} opened</span>
                </div>
              </div>
              <div className="analytics-stat">
                <MousePointer size={24} className="stat-icon" />
                <div>
                  <span className="stat-value">{clickRate.toFixed(1)}%</span>
                  <span className="stat-label">Click Rate</span>
                  <span className="stat-count">{formatNumber(selectedCampaign.clicked)} clicked</span>
                </div>
              </div>
              <div className="analytics-stat highlight">
                <TrendingUp size={24} className="stat-icon" />
                <div>
                  <span className="stat-value">{formatCurrency(selectedCampaign.revenue)}</span>
                  <span className="stat-label">Revenue Generated</span>
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <h3>Delivery Stats</h3>
            <div className="delivery-stats">
              <div className="delivery-stat">
                <div className="stat-row">
                  <span>Delivered</span>
                  <span className="success">{formatNumber(selectedCampaign.sent - selectedCampaign.bounced)}</span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-fill success"
                    ref={(el) => { if (el) el.style.width = `${((selectedCampaign.sent - selectedCampaign.bounced) / selectedCampaign.sent) * 100}%`; }}
                  />
                </div>
              </div>
              <div className="delivery-stat">
                <div className="stat-row">
                  <span>Bounced</span>
                  <span className="danger">{formatNumber(selectedCampaign.bounced)} ({bounceRate.toFixed(1)}%)</span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-fill danger"
                    ref={(el) => { if (el) el.style.width = `${bounceRate}%`; }}
                  />
                </div>
              </div>
              <div className="delivery-stat">
                <div className="stat-row">
                  <span>Unsubscribed</span>
                  <span className="warning">{formatNumber(selectedCampaign.unsubscribed)}</span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-fill warning"
                    ref={(el) => { if (el) el.style.width = `${(selectedCampaign.unsubscribed / selectedCampaign.sent) * 100}%`; }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-details">
          <div className="analytics-card">
            <h3>Campaign Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Subject</span>
                <span className="detail-value">{selectedCampaign.subject}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">From</span>
                <span className="detail-value">{selectedCampaign.fromName} &lt;{selectedCampaign.fromEmail}&gt;</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Sent Date</span>
                <span className="detail-value">{selectedCampaign.sentDate || 'Not sent'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tags</span>
                <div className="detail-tags">
                  {selectedCampaign.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <h3>AI Insights</h3>
            <div className="ai-insights">
              <div className="ai-insight success">
                <CheckCircle size={18} />
                <div>
                  <span className="insight-title">Strong Subject Line</span>
                  <span className="insight-text">Your subject line emoji and clear value proposition contributed to above-average open rates.</span>
                </div>
              </div>
              <div className="ai-insight info">
                <Sparkles size={18} />
                <div>
                  <span className="insight-title">Best Performing Segment</span>
                  <span className="insight-text">VIP customers had 45% higher engagement. Consider creating more targeted content for this segment.</span>
                </div>
              </div>
              <div className="ai-insight warning">
                <AlertCircle size={18} />
                <div>
                  <span className="insight-title">Improvement Opportunity</span>
                  <span className="insight-text">Click rate is below average. Try A/B testing different CTA buttons or link placements.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // AI Writer Modal Component
  const renderAIWriterModal = () => {
    if (!showAIWriter) return null;

    return (
      <div className="ai-writer-overlay" onClick={handleCloseAIWriter}>
        <div className="ai-writer-modal" onClick={(e) => e.stopPropagation()}>
          <div className="ai-writer-header">
            <div className="ai-writer-title">
              <Wand2 size={24} />
              <span>AI Email Writer</span>
            </div>
            <button className="ai-writer-close" onClick={handleCloseAIWriter} title="Close AI Writer">
              <X size={20} />
            </button>
          </div>

          <div className="ai-writer-content">
            <div className="ai-writer-form">
              <div className="ai-writer-field">
                <label>What would you like to write about?</label>
                <textarea
                  value={aiWriterPrompt}
                  onChange={(e) => setAIWriterPrompt(e.target.value)}
                  placeholder="E.g., A promotional email for our Black Friday sale with 50% off all products, targeting existing customers..."
                  rows={4}
                  disabled={isGenerating}
                />
              </div>

              <div className="ai-writer-options">
                <div className="ai-writer-field">
                  <label>Content Type</label>
                  <div className="ai-writer-buttons">
                    <button
                      className={`ai-option-btn ${aiWriterType === 'full' ? 'active' : ''}`}
                      onClick={() => setAIWriterType('full')}
                      disabled={isGenerating}
                    >
                      <FileEdit size={16} />
                      Full Email
                    </button>
                    <button
                      className={`ai-option-btn ${aiWriterType === 'subject' ? 'active' : ''}`}
                      onClick={() => setAIWriterType('subject')}
                      disabled={isGenerating}
                    >
                      <MessageSquare size={16} />
                      Subject Only
                    </button>
                    <button
                      className={`ai-option-btn ${aiWriterType === 'body' ? 'active' : ''}`}
                      onClick={() => setAIWriterType('body')}
                      disabled={isGenerating}
                    >
                      <FileText size={16} />
                      Body Only
                    </button>
                  </div>
                </div>

                <div className="ai-writer-field">
                  <label>Tone</label>
                  <div className="ai-writer-buttons">
                    <button
                      className={`ai-option-btn ${aiWriterTone === 'professional' ? 'active' : ''}`}
                      onClick={() => setAIWriterTone('professional')}
                      disabled={isGenerating}
                    >
                      Professional
                    </button>
                    <button
                      className={`ai-option-btn ${aiWriterTone === 'casual' ? 'active' : ''}`}
                      onClick={() => setAIWriterTone('casual')}
                      disabled={isGenerating}
                    >
                      Casual
                    </button>
                    <button
                      className={`ai-option-btn ${aiWriterTone === 'urgent' ? 'active' : ''}`}
                      onClick={() => setAIWriterTone('urgent')}
                      disabled={isGenerating}
                    >
                      <Megaphone size={16} />
                      Urgent
                    </button>
                    <button
                      className={`ai-option-btn ${aiWriterTone === 'friendly' ? 'active' : ''}`}
                      onClick={() => setAIWriterTone('friendly')}
                      disabled={isGenerating}
                    >
                      Friendly
                    </button>
                  </div>
                </div>
              </div>

              {aiError && (
                <div className="ai-writer-error">
                  <AlertCircle size={16} />
                  <span>{aiError}</span>
                </div>
              )}

              <button
                className="ai-generate-btn"
                onClick={generateEmailContent}
                disabled={isGenerating || !aiWriterPrompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="spinning" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Content
                  </>
                )}
              </button>
            </div>

            {aiGeneratedContent && (
              <div className="ai-writer-result">
                <div className="ai-result-header">
                  <CheckCircle size={18} />
                  <span>Generated Content</span>
                </div>

                {(aiWriterType === 'subject' || aiWriterType === 'full') && aiGeneratedContent.subject && (
                  <div className="ai-result-section">
                    <label>Subject Line</label>
                    <div className="ai-result-content subject">
                      {aiGeneratedContent.subject}
                    </div>
                  </div>
                )}

                {(aiWriterType === 'body' || aiWriterType === 'full') && aiGeneratedContent.body && (
                  <div className="ai-result-section">
                    <label>Email Body</label>
                    <div className="ai-result-content body">
                      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(aiGeneratedContent.body) }} />
                    </div>
                  </div>
                )}

                <div className="ai-result-actions">
                  <button className="btn-secondary" onClick={generateEmailContent} disabled={isGenerating}>
                    <RefreshCw size={16} />
                    Regenerate
                  </button>
                  <button className="btn-primary" onClick={handleUseGeneratedContent}>
                    <CheckCircle size={16} />
                    Use This Content
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <TourProvider
      tourId="email-marketing"
      steps={allTourSteps}
      sections={allTourSections}
      onComplete={() => setShowTourCompletion(true)}
    >
      <div className="email-campaigns">
        {/* Global Loading Overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <RefreshCw className="spinning" size={32} />
              <span>Loading...</span>
            </div>
          </div>
        )}
        
        {/* Error Toast */}
        {error && (
          <div className="error-toast">
            <span className="error-message">{error}</span>
            <button className="btn-dismiss" onClick={() => setError(null)} title="Dismiss error" aria-label="Dismiss error message">
              <X size={16} />
            </button>
          </div>
        )}
        
        {view === 'list' && renderListView()}
        {view === 'create' && renderCreateView()}
        {view === 'edit' && renderCreateView()}
        {view === 'analytics' && renderAnalyticsView()}
        {renderAIWriterModal()}
        
        {/* Tour Components */}
        <TourTooltip />
        <TourOverlay />
        <TourLauncher variant="fab" showProgress />
        
        {/* Tour Welcome Modal */}
        <TourWelcomeModal
          isOpen={showTourWelcome}
          onClose={() => setShowTourWelcome(false)}
          onStartTour={handleStartTour}
          onSkip={handleSkipTour}
        />
        
        {/* Tour Completion Modal */}
        <TourCompletionModal
          isOpen={showTourCompletion}
          onClose={() => setShowTourCompletion(false)}
          onRestart={handleRestartTour}
        />
      </div>
    </TourProvider>
  );
};

export default EmailCampaigns;
