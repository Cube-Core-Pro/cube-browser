/**
 * AutomationTemplates - CUBE Elite v6
 * Galería de plantillas de automatización predefinidas
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  AutomationTemplate,
  TemplateCategory,
  TemplateStats,
} from '../../types/automation-advanced';
import './AutomationTemplates.css';

// ============================================================================
// INTERFACES
// ============================================================================

interface AutomationTemplatesProps {
  onSelectTemplate: (template: AutomationTemplate) => void;
  onPreview?: (template: AutomationTemplate) => void;
  onClose: () => void;
  customTemplates?: AutomationTemplate[];
}

// ============================================================================
// TEMPLATE DATA
// ============================================================================

const BUILT_IN_TEMPLATES: AutomationTemplate[] = [
  // Lead Generation Templates
  {
    id: 'tpl-lead-linkedin',
    name: 'LinkedIn Lead Scraper',
    description: 'Extract leads from LinkedIn search results with email finder integration',
    category: 'lead_generation',
    tags: ['linkedin', 'leads', 'b2b', 'sales'],
    icon: '💼',
    config: {
      nodes: [
        { id: 'trigger', type: 'trigger', data: { type: 'schedule', cron: '0 9 * * 1-5' } },
        { id: 'linkedin', type: 'browser', data: { action: 'scrape', url: 'linkedin.com/search' } },
        { id: 'enrich', type: 'api', data: { service: 'clearbit', action: 'enrich' } },
        { id: 'save', type: 'database', data: { action: 'insert', table: 'leads' } },
      ],
      edges: [
        { source: 'trigger', target: 'linkedin' },
        { source: 'linkedin', target: 'enrich' },
        { source: 'enrich', target: 'save' },
      ],
      variables: { searchQuery: '', maxResults: 100 },
    },
    requirements: ['Browser Automation', 'API Keys: Clearbit'],
    estimatedTime: '10-30 min/run',
    difficulty: 'intermediate',
    popularity: 4.8,
    usageCount: 12500,
    author: 'CUBE Elite',
    version: '2.1.0',
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'tpl-lead-website',
    name: 'Website Contact Finder',
    description: 'Find contact information from company websites using AI',
    category: 'lead_generation',
    tags: ['contacts', 'email', 'phone', 'ai'],
    icon: '🔍',
    config: {
      nodes: [
        { id: 'trigger', type: 'trigger', data: { type: 'webhook' } },
        { id: 'crawl', type: 'browser', data: { action: 'crawl', depth: 3 } },
        { id: 'ai-extract', type: 'ai', data: { model: 'gpt-4', task: 'extract_contacts' } },
        { id: 'validate', type: 'code', data: { language: 'javascript', code: 'validate email format' } },
        { id: 'export', type: 'output', data: { format: 'csv' } },
      ],
      edges: [
        { source: 'trigger', target: 'crawl' },
        { source: 'crawl', target: 'ai-extract' },
        { source: 'ai-extract', target: 'validate' },
        { source: 'validate', target: 'export' },
      ],
      variables: { websiteUrl: '', outputPath: '' },
    },
    requirements: ['AI Credits', 'Browser Automation'],
    estimatedTime: '5-15 min/site',
    difficulty: 'beginner',
    popularity: 4.6,
    usageCount: 8900,
    author: 'CUBE Elite',
    version: '1.5.0',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
  // Data Processing Templates
  {
    id: 'tpl-data-etl',
    name: 'ETL Pipeline',
    description: 'Extract, transform, and load data between systems',
    category: 'data_processing',
    tags: ['etl', 'data', 'transform', 'sync'],
    icon: '⚡',
    config: {
      nodes: [
        { id: 'source', type: 'database', data: { action: 'query', source: 'postgresql' } },
        { id: 'transform', type: 'code', data: { language: 'python', code: 'transform data' } },
        { id: 'validate', type: 'conditional', data: { condition: 'data.isValid' } },
        { id: 'destination', type: 'database', data: { action: 'upsert', destination: 'snowflake' } },
        { id: 'notify', type: 'notification', data: { channel: 'slack' } },
      ],
      edges: [
        { source: 'source', target: 'transform' },
        { source: 'transform', target: 'validate' },
        { source: 'validate', target: 'destination' },
        { source: 'destination', target: 'notify' },
      ],
      variables: { sourceQuery: '', destinationTable: '' },
    },
    requirements: ['Database Connections'],
    estimatedTime: 'Varies by data size',
    difficulty: 'advanced',
    popularity: 4.9,
    usageCount: 15600,
    author: 'CUBE Elite',
    version: '3.0.0',
    createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'tpl-data-cleanup',
    name: 'Data Cleanup & Deduplication',
    description: 'Clean and deduplicate data with AI-powered matching',
    category: 'data_processing',
    tags: ['cleanup', 'dedupe', 'quality', 'ai'],
    icon: '🧹',
    config: {
      nodes: [
        { id: 'input', type: 'input', data: { source: 'csv_upload' } },
        { id: 'normalize', type: 'code', data: { language: 'python', code: 'normalize fields' } },
        { id: 'ai-match', type: 'ai', data: { model: 'gpt-4', task: 'fuzzy_matching' } },
        { id: 'merge', type: 'code', data: { language: 'python', code: 'merge duplicates' } },
        { id: 'export', type: 'output', data: { format: 'csv' } },
      ],
      edges: [
        { source: 'input', target: 'normalize' },
        { source: 'normalize', target: 'ai-match' },
        { source: 'ai-match', target: 'merge' },
        { source: 'merge', target: 'export' },
      ],
      variables: { matchThreshold: 0.85, mergeStrategy: 'newest' },
    },
    requirements: ['AI Credits'],
    estimatedTime: '5-20 min/1000 records',
    difficulty: 'intermediate',
    popularity: 4.5,
    usageCount: 7200,
    author: 'CUBE Elite',
    version: '2.0.0',
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
  },
  // Notification Templates
  {
    id: 'tpl-notify-monitor',
    name: 'Website Monitor & Alert',
    description: 'Monitor websites for changes and send instant notifications',
    category: 'notifications',
    tags: ['monitor', 'alert', 'uptime', 'changes'],
    icon: '🔔',
    config: {
      nodes: [
        { id: 'schedule', type: 'trigger', data: { type: 'schedule', cron: '*/5 * * * *' } },
        { id: 'fetch', type: 'http', data: { method: 'GET', url: '{{monitorUrl}}' } },
        { id: 'compare', type: 'code', data: { language: 'javascript', code: 'compare with previous' } },
        { id: 'condition', type: 'conditional', data: { condition: 'hasChanged' } },
        { id: 'notify-slack', type: 'notification', data: { channel: 'slack' } },
        { id: 'notify-email', type: 'notification', data: { channel: 'email' } },
      ],
      edges: [
        { source: 'schedule', target: 'fetch' },
        { source: 'fetch', target: 'compare' },
        { source: 'compare', target: 'condition' },
        { source: 'condition', target: 'notify-slack' },
        { source: 'condition', target: 'notify-email' },
      ],
      variables: { monitorUrl: '', slackWebhook: '', emailTo: '' },
    },
    requirements: ['Slack Webhook', 'Email Service'],
    estimatedTime: '< 1 min/check',
    difficulty: 'beginner',
    popularity: 4.7,
    usageCount: 11200,
    author: 'CUBE Elite',
    version: '1.8.0',
    createdAt: Date.now() - 150 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  // Social Media Templates
  {
    id: 'tpl-social-scheduler',
    name: 'Social Media Scheduler',
    description: 'Schedule and publish content across multiple social platforms',
    category: 'social_media',
    tags: ['social', 'scheduling', 'publishing', 'multi-platform'],
    icon: '📱',
    config: {
      nodes: [
        { id: 'schedule', type: 'trigger', data: { type: 'schedule', cron: 'custom' } },
        { id: 'fetch-content', type: 'database', data: { action: 'query', table: 'scheduled_posts' } },
        { id: 'twitter', type: 'api', data: { service: 'twitter', action: 'post' } },
        { id: 'linkedin', type: 'api', data: { service: 'linkedin', action: 'post' } },
        { id: 'facebook', type: 'api', data: { service: 'facebook', action: 'post' } },
        { id: 'update-status', type: 'database', data: { action: 'update', table: 'scheduled_posts' } },
      ],
      edges: [
        { source: 'schedule', target: 'fetch-content' },
        { source: 'fetch-content', target: 'twitter' },
        { source: 'fetch-content', target: 'linkedin' },
        { source: 'fetch-content', target: 'facebook' },
        { source: 'twitter', target: 'update-status' },
        { source: 'linkedin', target: 'update-status' },
        { source: 'facebook', target: 'update-status' },
      ],
      variables: {},
    },
    requirements: ['Social Media API Keys'],
    estimatedTime: '< 1 min/post',
    difficulty: 'intermediate',
    popularity: 4.4,
    usageCount: 9500,
    author: 'CUBE Elite',
    version: '2.5.0',
    createdAt: Date.now() - 200 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  // E-commerce Templates
  {
    id: 'tpl-ecom-price-monitor',
    name: 'Competitor Price Monitor',
    description: 'Track competitor prices and get alerts on changes',
    category: 'ecommerce',
    tags: ['prices', 'competitor', 'monitor', 'alerts'],
    icon: '💰',
    config: {
      nodes: [
        { id: 'schedule', type: 'trigger', data: { type: 'schedule', cron: '0 */6 * * *' } },
        { id: 'products', type: 'database', data: { action: 'query', table: 'tracked_products' } },
        { id: 'scrape', type: 'browser', data: { action: 'scrape', selector: '.price' } },
        { id: 'compare', type: 'code', data: { language: 'javascript', code: 'compare prices' } },
        { id: 'condition', type: 'conditional', data: { condition: 'priceChanged' } },
        { id: 'save', type: 'database', data: { action: 'insert', table: 'price_history' } },
        { id: 'notify', type: 'notification', data: { channel: 'email' } },
      ],
      edges: [
        { source: 'schedule', target: 'products' },
        { source: 'products', target: 'scrape' },
        { source: 'scrape', target: 'compare' },
        { source: 'compare', target: 'condition' },
        { source: 'compare', target: 'save' },
        { source: 'condition', target: 'notify' },
      ],
      variables: { priceDropThreshold: 5, competitorUrls: [] },
    },
    requirements: ['Browser Automation'],
    estimatedTime: '10-30 min/run',
    difficulty: 'intermediate',
    popularity: 4.6,
    usageCount: 6800,
    author: 'CUBE Elite',
    version: '1.9.0',
    createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'tpl-ecom-inventory-sync',
    name: 'Multi-Channel Inventory Sync',
    description: 'Sync inventory across Shopify, Amazon, eBay, and more',
    category: 'ecommerce',
    tags: ['inventory', 'sync', 'multichannel', 'shopify', 'amazon'],
    icon: '📦',
    config: {
      nodes: [
        { id: 'trigger', type: 'trigger', data: { type: 'webhook' } },
        { id: 'fetch-inventory', type: 'api', data: { service: 'shopify', action: 'get_inventory' } },
        { id: 'transform', type: 'code', data: { language: 'javascript', code: 'map to other formats' } },
        { id: 'sync-amazon', type: 'api', data: { service: 'amazon', action: 'update_inventory' } },
        { id: 'sync-ebay', type: 'api', data: { service: 'ebay', action: 'update_inventory' } },
        { id: 'log', type: 'database', data: { action: 'insert', table: 'sync_log' } },
      ],
      edges: [
        { source: 'trigger', target: 'fetch-inventory' },
        { source: 'fetch-inventory', target: 'transform' },
        { source: 'transform', target: 'sync-amazon' },
        { source: 'transform', target: 'sync-ebay' },
        { source: 'sync-amazon', target: 'log' },
        { source: 'sync-ebay', target: 'log' },
      ],
      variables: {},
    },
    requirements: ['Shopify API', 'Amazon SP-API', 'eBay API'],
    estimatedTime: '< 2 min/sync',
    difficulty: 'advanced',
    popularity: 4.8,
    usageCount: 5400,
    author: 'CUBE Elite',
    version: '2.2.0',
    createdAt: Date.now() - 80 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
  },
  // AI Automation Templates
  {
    id: 'tpl-ai-content-gen',
    name: 'AI Content Generator',
    description: 'Generate blog posts, social content, and marketing copy with AI',
    category: 'ai_automation',
    tags: ['ai', 'content', 'blog', 'marketing', 'gpt'],
    icon: '✨',
    config: {
      nodes: [
        { id: 'trigger', type: 'trigger', data: { type: 'manual' } },
        { id: 'topics', type: 'input', data: { source: 'form' } },
        { id: 'research', type: 'browser', data: { action: 'search', engine: 'google' } },
        { id: 'langchain', type: 'langchain', data: { chain: 'rag', model: 'gpt-4' } },
        { id: 'format', type: 'code', data: { language: 'javascript', code: 'format output' } },
        { id: 'publish', type: 'api', data: { service: 'wordpress', action: 'create_post' } },
      ],
      edges: [
        { source: 'trigger', target: 'topics' },
        { source: 'topics', target: 'research' },
        { source: 'research', target: 'langchain' },
        { source: 'langchain', target: 'format' },
        { source: 'format', target: 'publish' },
      ],
      variables: { contentType: 'blog', wordCount: 1500, tone: 'professional' },
    },
    requirements: ['AI Credits', 'WordPress API'],
    estimatedTime: '5-10 min/article',
    difficulty: 'intermediate',
    popularity: 4.9,
    usageCount: 14200,
    author: 'CUBE Elite',
    version: '3.1.0',
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'tpl-ai-email-responder',
    name: 'AI Email Responder',
    description: 'Automatically draft and send email responses using AI',
    category: 'ai_automation',
    tags: ['ai', 'email', 'automation', 'customer-service'],
    icon: '📧',
    config: {
      nodes: [
        { id: 'trigger', type: 'trigger', data: { type: 'webhook', source: 'gmail' } },
        { id: 'classify', type: 'ai', data: { model: 'gpt-4', task: 'classify_email' } },
        { id: 'route', type: 'conditional', data: { condition: 'category' } },
        { id: 'draft-support', type: 'langchain', data: { chain: 'conversational', context: 'support' } },
        { id: 'draft-sales', type: 'langchain', data: { chain: 'conversational', context: 'sales' } },
        { id: 'review', type: 'human_in_loop', data: { timeout: 3600 } },
        { id: 'send', type: 'api', data: { service: 'gmail', action: 'send' } },
      ],
      edges: [
        { source: 'trigger', target: 'classify' },
        { source: 'classify', target: 'route' },
        { source: 'route', target: 'draft-support' },
        { source: 'route', target: 'draft-sales' },
        { source: 'draft-support', target: 'review' },
        { source: 'draft-sales', target: 'review' },
        { source: 'review', target: 'send' },
      ],
      variables: { autoSend: false, reviewRequired: true },
    },
    requirements: ['AI Credits', 'Gmail API'],
    estimatedTime: '< 1 min/email',
    difficulty: 'advanced',
    popularity: 4.7,
    usageCount: 8100,
    author: 'CUBE Elite',
    version: '2.0.0',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  // Integration Templates
  {
    id: 'tpl-int-crm-sync',
    name: 'CRM Data Sync',
    description: 'Sync data between Salesforce, HubSpot, and other CRMs',
    category: 'integration',
    tags: ['crm', 'sync', 'salesforce', 'hubspot'],
    icon: '🔄',
    config: {
      nodes: [
        { id: 'trigger', type: 'trigger', data: { type: 'schedule', cron: '0 * * * *' } },
        { id: 'fetch-sf', type: 'api', data: { service: 'salesforce', action: 'query' } },
        { id: 'transform', type: 'code', data: { language: 'javascript', code: 'map fields' } },
        { id: 'upsert-hs', type: 'api', data: { service: 'hubspot', action: 'upsert' } },
        { id: 'log', type: 'database', data: { action: 'insert', table: 'sync_log' } },
      ],
      edges: [
        { source: 'trigger', target: 'fetch-sf' },
        { source: 'fetch-sf', target: 'transform' },
        { source: 'transform', target: 'upsert-hs' },
        { source: 'upsert-hs', target: 'log' },
      ],
      variables: { syncDirection: 'bidirectional', conflictResolution: 'newest' },
    },
    requirements: ['Salesforce API', 'HubSpot API'],
    estimatedTime: '5-15 min/sync',
    difficulty: 'advanced',
    popularity: 4.5,
    usageCount: 4200,
    author: 'CUBE Elite',
    version: '1.6.0',
    createdAt: Date.now() - 140 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },
];

const CATEGORY_INFO: Partial<Record<TemplateCategory, { name: string; icon: string; color: string }>> = {
  lead_generation: { name: 'Lead Generation', icon: '🎯', color: '#10b981' },
  data_processing: { name: 'Data Processing', icon: '⚙️', color: '#3b82f6' },
  notifications: { name: 'Notifications', icon: '🔔', color: '#f59e0b' },
  social_media: { name: 'Social Media', icon: '📱', color: '#ec4899' },
  ecommerce: { name: 'E-commerce', icon: '🛒', color: '#8b5cf6' },
  ai_automation: { name: 'AI Automation', icon: '🤖', color: '#06b6d4' },
  integration: { name: 'Integration', icon: '🔗', color: '#6366f1' },
  custom: { name: 'Custom', icon: '🎨', color: '#64748b' },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AutomationTemplates: React.FC<AutomationTemplatesProps> = ({
  onSelectTemplate,
  onPreview,
  onClose,
  customTemplates = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'name'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Combine built-in and custom templates
  const allTemplates = useMemo(() => {
    return [...BUILT_IN_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let templates = allTemplates;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      templates = templates.filter(t => t.difficulty === selectedDifficulty);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        templates = [...templates].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case 'newest':
        templates = [...templates].sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'name':
        templates = [...templates].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return templates;
  }, [allTemplates, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  // Calculate stats
  const stats: TemplateStats = useMemo(() => {
    const categories: Partial<Record<TemplateCategory, number>> = {
      lead_generation: 0,
      data_processing: 0,
      notifications: 0,
      social_media: 0,
      ecommerce: 0,
      ai_automation: 0,
      integration: 0,
      custom: 0,
    };

    allTemplates.forEach(t => {
      if (categories[t.category] !== undefined) {
        categories[t.category]!++;
      }
    });

    return {
      totalTemplates: allTemplates.length,
      totalUsage: allTemplates.reduce((sum, t) => sum + (t.usageCount || 0), 0),
      categoryBreakdown: categories as Record<TemplateCategory, number>,
    };
  }, [allTemplates]);

  const handleUseTemplate = useCallback((template: AutomationTemplate) => {
    onSelectTemplate(template);
    onClose();
  }, [onSelectTemplate, onClose]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="automation-templates">
      <div className="templates-header">
        <div className="header-content">
          <h3>📚 Automation Templates</h3>
          <p>Get started quickly with pre-built automation workflows</p>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="templates-stats">
        <div className="stat-item">
          <span className="stat-value">{stats.totalTemplates}</span>
          <span className="stat-label">Templates</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{formatNumber(stats.totalUsage || 0)}</span>
          <span className="stat-label">Total Uses</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{Object.keys(stats.categoryBreakdown || {}).length}</span>
          <span className="stat-label">Categories</span>
        </div>
      </div>

      <div className="templates-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="filters">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <option key={key} value={key}>{info?.icon} {info?.name}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as 'all' | 'beginner' | 'intermediate' | 'advanced')}
          >
            <option value="all">All Levels</option>
            <option value="beginner">🟢 Beginner</option>
            <option value="intermediate">🟡 Intermediate</option>
            <option value="advanced">🔴 Advanced</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'popular' | 'newest' | 'name')}>
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="name">A-Z</option>
          </select>

          <div className="view-toggle">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
              ⊞
            </button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="templates-categories">
        <button
          className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All ({allTemplates.length})
        </button>
        {Object.entries(CATEGORY_INFO).map(([key, info]) => {
          const count = (stats.categoryBreakdown || {})[key as TemplateCategory] || 0;
          if (count === 0) return null;
          return (
            <button
              key={key}
              className={`category-chip ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(key as TemplateCategory)}
              style={{ '--category-color': info?.color } as React.CSSProperties}
            >
              {info?.icon} {info?.name} ({count})
            </button>
          );
        })}
      </div>

      <div className={`templates-grid ${viewMode}`}>
        {filteredTemplates.length === 0 ? (
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <h4>No templates found</h4>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-card-header">
                <span className="template-icon">{template.icon}</span>
                <div className="template-meta">
                  <span
                    className="template-category"
                    style={{ background: CATEGORY_INFO[template.category]?.color }}
                  >
                    {CATEGORY_INFO[template.category]?.name || template.category}
                  </span>
                  <span
                    className="template-difficulty"
                    style={{ color: DIFFICULTY_COLORS[template.difficulty] }}
                  >
                    {template.difficulty}
                  </span>
                </div>
              </div>

              <h4 className="template-name">{template.name}</h4>
              <p className="template-description">{template.description}</p>

              <div className="template-tags">
                {template.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
                {template.tags.length > 4 && (
                  <span className="tag more">+{template.tags.length - 4}</span>
                )}
              </div>

              <div className="template-info">
                <div className="info-item">
                  <span className="info-icon">⏱️</span>
                  <span>{template.estimatedTime}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">⭐</span>
                  <span>{template.popularity?.toFixed(1)}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">📊</span>
                  <span>{formatNumber(template.usageCount || 0)} uses</span>
                </div>
              </div>

              {viewMode === 'list' && template.requirements && (
                <div className="template-requirements">
                  <strong>Requirements:</strong> {template.requirements.join(', ')}
                </div>
              )}

              <div className="template-footer">
                <span className="template-author">
                  by {template.author} • v{template.version}
                </span>
                <span className="template-date">
                  Updated {formatDate(template.updatedAt)}
                </span>
              </div>

              <div className="template-actions">
                {onPreview && (
                  <button className="btn-preview" onClick={() => onPreview(template)}>
                    👁️ Preview
                  </button>
                )}
                <button className="btn-use" onClick={() => handleUseTemplate(template)}>
                  🚀 Use Template
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AutomationTemplates;
