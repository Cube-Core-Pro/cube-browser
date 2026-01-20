/**
 * Advanced Node Palette - CUBE Nexum
 * Visual workflow builder con categorías avanzadas
 * Supera a Zapier, n8n, Make.com, Apify
 */

import React, { useState, useMemo } from 'react';
import { Search, Zap, Code, Database, GitBranch, Clock, Brain, Globe, FileJson, AlertCircle } from 'lucide-react';
import './AdvancedNodePalette.css';

export interface AdvancedNodeTemplate {
  id: string;
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'trigger' | 'action' | 'logic' | 'data' | 'ai' | 'integration' | 'scraping' | 'transform';
  tier: 'free' | 'pro' | 'elite';
  defaultConfig: Record<string, unknown>;
  inputs?: string[];
  outputs?: string[];
}

const advancedNodeTemplates: AdvancedNodeTemplate[] = [
  // ============================================================================
  // TRIGGERS
  // ============================================================================
  {
    id: 'trigger-manual',
    type: 'trigger',
    label: 'Manual Trigger',
    description: 'Start workflow manually',
    icon: <Zap className="w-4 h-4" />,
    category: 'trigger',
    tier: 'free',
    defaultConfig: { triggerType: 'manual' },
    outputs: ['execution_start'],
  },
  {
    id: 'trigger-schedule',
    type: 'trigger',
    label: 'Schedule (Cron)',
    description: 'Run on schedule with cron expression',
    icon: <Clock className="w-4 h-4" />,
    category: 'trigger',
    tier: 'pro',
    defaultConfig: { 
      triggerType: 'schedule',
      schedule: '0 9 * * *',
      timezone: 'UTC',
      enabled: true,
    },
    outputs: ['scheduled_execution'],
  },
  {
    id: 'trigger-webhook',
    type: 'trigger',
    label: 'Webhook',
    description: 'Trigger via HTTP webhook (POST/GET)',
    icon: <Globe className="w-4 h-4" />,
    category: 'trigger',
    tier: 'pro',
    defaultConfig: { 
      triggerType: 'webhook',
      method: 'POST',
      authentication: 'api_key',
      responseFormat: 'json',
    },
    outputs: ['webhook_data'],
  },
  {
    id: 'trigger-file-watch',
    type: 'trigger',
    label: 'File Watcher',
    description: 'Trigger when files change in directory',
    icon: <FileJson className="w-4 h-4" />,
    category: 'trigger',
    tier: 'elite',
    defaultConfig: { 
      triggerType: 'file_watch',
      directory: '',
      pattern: '*.json',
      events: ['create', 'modify'],
    },
    outputs: ['file_path', 'file_content'],
  },

  // ============================================================================
  // BROWSER ACTIONS
  // ============================================================================
  {
    id: 'action-navigate',
    type: 'action',
    label: 'Navigate',
    description: 'Navigate to URL with wait strategies',
    icon: <Globe className="w-4 h-4" />,
    category: 'action',
    tier: 'free',
    defaultConfig: { 
      url: '',
      waitUntil: 'networkidle',
      timeout: 30000,
      retries: 3,
    },
    inputs: ['url'],
    outputs: ['page_loaded'],
  },
  {
    id: 'action-click',
    type: 'action',
    label: 'Click Element',
    description: 'Click with auto-healing selectors',
    icon: <Zap className="w-4 h-4" />,
    category: 'action',
    tier: 'free',
    defaultConfig: { 
      selector: '',
      waitForElement: true,
      scrollIntoView: true,
      clickType: 'single',
    },
    inputs: ['selector'],
    outputs: ['clicked'],
  },
  {
    id: 'action-fill',
    type: 'action',
    label: 'Fill Input',
    description: 'Fill form fields with validation',
    icon: <Code className="w-4 h-4" />,
    category: 'action',
    tier: 'free',
    defaultConfig: { 
      selector: '',
      value: '',
      clearFirst: true,
      pressEnter: false,
      delay: 100,
    },
    inputs: ['selector', 'value'],
    outputs: ['filled'],
  },
  {
    id: 'action-screenshot',
    type: 'action',
    label: 'Take Screenshot',
    description: 'Full page or element screenshot',
    icon: <FileJson className="w-4 h-4" />,
    category: 'action',
    tier: 'pro',
    defaultConfig: { 
      type: 'fullPage',
      format: 'png',
      quality: 90,
      selector: null,
    },
    outputs: ['screenshot_path'],
  },

  // ============================================================================
  // DATA SCRAPING
  // ============================================================================
  {
    id: 'scrape-element',
    type: 'scraping',
    label: 'Scrape Element',
    description: 'Extract text, attributes, or HTML',
    icon: <Database className="w-4 h-4" />,
    category: 'scraping',
    tier: 'free',
    defaultConfig: { 
      selector: '',
      extractType: 'text',
      attribute: null,
      multiple: false,
      cleanText: true,
    },
    inputs: ['selector'],
    outputs: ['extracted_data'],
  },
  {
    id: 'scrape-table',
    type: 'scraping',
    label: 'Scrape Table',
    description: 'Extract entire HTML table to JSON',
    icon: <Database className="w-4 h-4" />,
    category: 'scraping',
    tier: 'pro',
    defaultConfig: { 
      selector: 'table',
      hasHeaders: true,
      includeEmptyRows: false,
      format: 'json',
    },
    outputs: ['table_data'],
  },
  {
    id: 'scrape-list',
    type: 'scraping',
    label: 'Scrape List',
    description: 'Extract multiple items with patterns',
    icon: <Database className="w-4 h-4" />,
    category: 'scraping',
    tier: 'pro',
    defaultConfig: { 
      containerSelector: '',
      itemSelector: '',
      fields: [],
      pagination: false,
      maxPages: 10,
    },
    outputs: ['items_array'],
  },
  {
    id: 'scrape-infinite-scroll',
    type: 'scraping',
    label: 'Infinite Scroll Scraper',
    description: 'Auto-scroll and extract infinite feeds',
    icon: <Database className="w-4 h-4" />,
    category: 'scraping',
    tier: 'elite',
    defaultConfig: { 
      itemSelector: '',
      scrollDelay: 1000,
      maxScrolls: 50,
      deduplication: true,
    },
    outputs: ['all_items'],
  },

  // ============================================================================
  // LOGIC & CONTROL FLOW
  // ============================================================================
  {
    id: 'logic-condition',
    type: 'logic',
    label: 'If/Else Condition',
    description: 'Branch workflow based on conditions',
    icon: <GitBranch className="w-4 h-4" />,
    category: 'logic',
    tier: 'free',
    defaultConfig: { 
      conditionType: 'expression',
      expression: '',
      operator: '==',
      trueOutput: 'true_branch',
      falseOutput: 'false_branch',
    },
    inputs: ['condition'],
    outputs: ['true', 'false'],
  },
  {
    id: 'logic-loop',
    type: 'logic',
    label: 'Loop (For Each)',
    description: 'Iterate over arrays or numbers',
    icon: <GitBranch className="w-4 h-4" />,
    category: 'logic',
    tier: 'free',
    defaultConfig: { 
      loopType: 'array',
      array: [],
      maxIterations: 100,
      breakOnError: false,
    },
    inputs: ['items'],
    outputs: ['iteration', 'item', 'index'],
  },
  {
    id: 'logic-switch',
    type: 'logic',
    label: 'Switch/Case',
    description: 'Multi-way branch based on value',
    icon: <GitBranch className="w-4 h-4" />,
    category: 'logic',
    tier: 'pro',
    defaultConfig: { 
      value: '',
      cases: [
        { match: 'case1', output: 'output1' },
        { match: 'case2', output: 'output2' },
      ],
      defaultCase: 'default',
    },
    inputs: ['switch_value'],
    outputs: ['matched_case'],
  },
  {
    id: 'logic-wait',
    type: 'logic',
    label: 'Wait/Delay',
    description: 'Pause execution for specified time',
    icon: <Clock className="w-4 h-4" />,
    category: 'logic',
    tier: 'free',
    defaultConfig: { 
      delayType: 'fixed',
      duration: 1000,
      unit: 'milliseconds',
    },
    inputs: ['trigger'],
    outputs: ['resumed'],
  },
  {
    id: 'logic-parallel',
    type: 'logic',
    label: 'Parallel Execution',
    description: 'Run multiple branches simultaneously',
    icon: <GitBranch className="w-4 h-4" />,
    category: 'logic',
    tier: 'elite',
    defaultConfig: { 
      branches: 2,
      waitForAll: true,
      timeout: 60000,
    },
    inputs: ['start'],
    outputs: ['branch1', 'branch2', 'branch3'],
  },

  // ============================================================================
  // AI PROCESSING
  // ============================================================================
  {
    id: 'ai-analyze',
    type: 'ai',
    label: 'AI Analysis',
    description: 'Analyze content with GPT-5.2',
    icon: <Brain className="w-4 h-4" />,
    category: 'ai',
    tier: 'pro',
    defaultConfig: { 
      model: 'gpt-5-mini',
      prompt: '',
      temperature: 0.7,
      maxTokens: 1000,
    },
    inputs: ['content', 'prompt'],
    outputs: ['analysis'],
  },
  {
    id: 'ai-extract-structured',
    type: 'ai',
    label: 'AI Structured Extraction',
    description: 'Extract structured data with AI',
    icon: <Brain className="w-4 h-4" />,
    category: 'ai',
    tier: 'pro',
    defaultConfig: { 
      model: 'gpt-5-mini',
      schema: {},
      outputFormat: 'json',
    },
    inputs: ['unstructured_data'],
    outputs: ['structured_data'],
  },
  {
    id: 'ai-improve-selector',
    type: 'ai',
    label: 'AI Selector Improvement',
    description: 'Generate robust selectors with AI',
    icon: <Brain className="w-4 h-4" />,
    category: 'ai',
    tier: 'elite',
    defaultConfig: { 
      currentSelector: '',
      context: 'page_html',
      suggestAlternatives: 3,
    },
    inputs: ['selector', 'page_html'],
    outputs: ['improved_selectors'],
  },
  {
    id: 'ai-captcha-solver',
    type: 'ai',
    label: 'AI CAPTCHA Solver',
    description: 'Solve CAPTCHAs with AI (2Captcha)',
    icon: <Brain className="w-4 h-4" />,
    category: 'ai',
    tier: 'elite',
    defaultConfig: { 
      service: '2captcha',
      apiKey: '',
      captchaType: 'recaptcha_v2',
      timeout: 120000,
    },
    inputs: ['captcha_sitekey'],
    outputs: ['captcha_solution'],
  },

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================
  {
    id: 'transform-map',
    type: 'transform',
    label: 'Transform Data',
    description: 'Map and transform data structures',
    icon: <Code className="w-4 h-4" />,
    category: 'data',
    tier: 'free',
    defaultConfig: { 
      mapping: {},
      transformType: 'jsonata',
      expression: '',
    },
    inputs: ['input_data'],
    outputs: ['transformed_data'],
  },
  {
    id: 'transform-filter',
    type: 'transform',
    label: 'Filter Data',
    description: 'Filter arrays based on conditions',
    icon: <Code className="w-4 h-4" />,
    category: 'data',
    tier: 'free',
    defaultConfig: { 
      filterExpression: '',
      operator: 'includes',
      caseSensitive: false,
    },
    inputs: ['array'],
    outputs: ['filtered_array'],
  },
  {
    id: 'transform-aggregate',
    type: 'transform',
    label: 'Aggregate Data',
    description: 'Sum, count, average, group by',
    icon: <Database className="w-4 h-4" />,
    category: 'data',
    tier: 'pro',
    defaultConfig: { 
      operation: 'count',
      field: '',
      groupBy: null,
    },
    inputs: ['data_array'],
    outputs: ['aggregated_result'],
  },
  {
    id: 'transform-deduplicate',
    type: 'transform',
    label: 'Deduplicate',
    description: 'Remove duplicate entries by key',
    icon: <Database className="w-4 h-4" />,
    category: 'data',
    tier: 'pro',
    defaultConfig: { 
      uniqueKey: 'id',
      keepFirst: true,
    },
    inputs: ['array_with_duplicates'],
    outputs: ['unique_array'],
  },

  // ============================================================================
  // INTEGRATIONS
  // ============================================================================
  {
    id: 'integration-api',
    type: 'integration',
    label: 'HTTP API Call',
    description: 'REST API request with auth',
    icon: <Globe className="w-4 h-4" />,
    category: 'integration',
    tier: 'free',
    defaultConfig: { 
      method: 'GET',
      url: '',
      headers: {},
      body: null,
      auth: 'none',
    },
    inputs: ['url', 'params'],
    outputs: ['response_data'],
  },
  {
    id: 'integration-google-sheets',
    type: 'integration',
    label: 'Google Sheets',
    description: 'Read/write Google Sheets',
    icon: <FileJson className="w-4 h-4" />,
    category: 'integration',
    tier: 'pro',
    defaultConfig: { 
      operation: 'append',
      spreadsheetId: '',
      sheetName: 'Sheet1',
      range: 'A1',
    },
    inputs: ['data'],
    outputs: ['success'],
  },
  {
    id: 'integration-slack',
    type: 'integration',
    label: 'Slack Notification',
    description: 'Send messages to Slack',
    icon: <Globe className="w-4 h-4" />,
    category: 'integration',
    tier: 'pro',
    defaultConfig: { 
      webhookUrl: '',
      channel: '#general',
      username: 'CUBE Nexum',
      iconEmoji: ':robot_face:',
    },
    inputs: ['message'],
    outputs: ['sent'],
  },
  {
    id: 'integration-email',
    type: 'integration',
    label: 'Send Email',
    description: 'Send emails via SMTP',
    icon: <Globe className="w-4 h-4" />,
    category: 'integration',
    tier: 'elite',
    defaultConfig: { 
      to: '',
      subject: '',
      body: '',
      bodyType: 'html',
      attachments: [],
    },
    inputs: ['email_data'],
    outputs: ['sent'],
  },
  {
    id: 'integration-database',
    type: 'integration',
    label: 'Database Query',
    description: 'Execute SQL queries (PostgreSQL, MySQL)',
    icon: <Database className="w-4 h-4" />,
    category: 'integration',
    tier: 'elite',
    defaultConfig: { 
      connectionString: '',
      query: '',
      queryType: 'SELECT',
      parameters: [],
    },
    inputs: ['query_params'],
    outputs: ['query_results'],
  },

  // ============================================================================
  // EXPORT & STORAGE
  // ============================================================================
  {
    id: 'export-json',
    type: 'data',
    label: 'Export JSON',
    description: 'Save data as JSON file',
    icon: <FileJson className="w-4 h-4" />,
    category: 'data',
    tier: 'free',
    defaultConfig: { 
      path: '',
      pretty: true,
      append: false,
    },
    inputs: ['data'],
    outputs: ['file_path'],
  },
  {
    id: 'export-csv',
    type: 'data',
    label: 'Export CSV',
    description: 'Save data as CSV/Excel',
    icon: <FileJson className="w-4 h-4" />,
    category: 'data',
    tier: 'pro',
    defaultConfig: { 
      path: '',
      delimiter: ',',
      includeHeaders: true,
      encoding: 'utf-8',
    },
    inputs: ['data_array'],
    outputs: ['file_path'],
  },
  {
    id: 'export-sql',
    type: 'data',
    label: 'Export SQL',
    description: 'Generate SQL INSERT statements',
    icon: <Database className="w-4 h-4" />,
    category: 'data',
    tier: 'elite',
    defaultConfig: { 
      tableName: '',
      batchSize: 100,
      onConflict: 'skip',
    },
    inputs: ['data_array'],
    outputs: ['sql_statements'],
  },
];

interface AdvancedNodePaletteProps {
  onAddNode: (template: AdvancedNodeTemplate) => void;
  onClose: () => void;
  userTier: 'free' | 'pro' | 'elite';
}

export const AdvancedNodePalette: React.FC<AdvancedNodePaletteProps> = ({
  onAddNode,
  onClose,
  userTier,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Nodes', icon: <Zap className="w-4 h-4" /> },
    { id: 'trigger', label: 'Triggers', icon: <Clock className="w-4 h-4" /> },
    { id: 'action', label: 'Actions', icon: <Zap className="w-4 h-4" /> },
    { id: 'scraping', label: 'Scraping', icon: <Database className="w-4 h-4" /> },
    { id: 'logic', label: 'Logic', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'ai', label: 'AI', icon: <Brain className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <FileJson className="w-4 h-4" /> },
    { id: 'integration', label: 'Integrations', icon: <Globe className="w-4 h-4" /> },
  ];

  const filteredNodes = useMemo(() => {
    return advancedNodeTemplates.filter((node) => {
      const matchesSearch = 
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || node.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const isNodeLocked = (tier: string) => {
    const tierOrder = { free: 0, pro: 1, elite: 2 };
    const userTierLevel = tierOrder[userTier];
    const nodeTierLevel = tierOrder[tier as keyof typeof tierOrder];
    return nodeTierLevel > userTierLevel;
  };

  const getTierBadgeClass = (tier: string) => {
    switch (tier) {
      case 'free': return 'tier-badge-free';
      case 'pro': return 'tier-badge-pro';
      case 'elite': return 'tier-badge-elite';
      default: return '';
    }
  };

  return (
    <div className="advanced-node-palette">
      <div className="palette-header">
        <h3 className="palette-title">
          <Zap className="w-5 h-5" />
          Node Palette
        </h3>
        <button onClick={onClose} className="palette-close">
          ×
        </button>
      </div>

      <div className="palette-search">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="palette-search-input"
        />
      </div>

      <div className="palette-categories">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="palette-nodes">
        {filteredNodes.length === 0 ? (
          <div className="palette-empty">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
            <p>No nodes found</p>
          </div>
        ) : (
          filteredNodes.map((node) => {
            const locked = isNodeLocked(node.tier);
            
            return (
              <div
                key={node.id}
                className={`palette-node ${locked ? 'locked' : ''}`}
                onClick={() => !locked && onAddNode(node)}
                draggable={!locked}
                onDragStart={(e) => {
                  if (!locked) {
                    e.dataTransfer.setData('application/reactflow', node.type);
                    e.dataTransfer.setData('node-template', JSON.stringify(node));
                    e.dataTransfer.effectAllowed = 'move';
                  }
                }}
              >
                <div className="palette-node-icon">
                  {node.icon}
                </div>
                <div className="palette-node-content">
                  <div className="palette-node-header">
                    <span className="palette-node-label">{node.label}</span>
                    <span className={`tier-badge ${getTierBadgeClass(node.tier)}`}>
                      {node.tier.toUpperCase()}
                    </span>
                  </div>
                  <p className="palette-node-description">{node.description}</p>
                  {locked && (
                    <div className="palette-node-locked">
                      <AlertCircle className="w-3 h-3" />
                      <span>Upgrade to {node.tier}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="palette-footer">
        <p className="palette-stats">
          {filteredNodes.length} nodes available
        </p>
      </div>
    </div>
  );
};

export { advancedNodeTemplates };
