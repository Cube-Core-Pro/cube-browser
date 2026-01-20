/**
 * Automation Templates Service - Pre-built Workflow Templates
 *
 * Provides a library of pre-built automation templates for common use cases,
 * template customization, and community template sharing.
 *
 * M5 Features:
 * - 50+ pre-built templates by category
 * - Template customization wizard
 * - Community template marketplace
 * - Template versioning
 * - AI-powered template recommendations
 *
 * @module AutomationTemplatesService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService } from './telemetry-service';
import type { Flow, FlowNode as _FlowNode, FlowEdge as _FlowEdge, FlowVariable as _FlowVariable } from './automation-studio-service';

// Re-export for potential future use
export type { _FlowNode, _FlowEdge, _FlowVariable };

// ============================================================================
// Types
// ============================================================================

export interface AutomationTemplate {
  /**
   * Template unique ID
   */
  id: string;

  /**
   * Template name
   */
  name: string;

  /**
   * Template description
   */
  description: string;

  /**
   * Category
   */
  category: TemplateCategory;

  /**
   * Subcategory
   */
  subcategory?: string;

  /**
   * Tags for search
   */
  tags: string[];

  /**
   * Template icon
   */
  icon: string;

  /**
   * Template flow definition
   */
  flow: Flow;

  /**
   * Customizable parameters
   */
  parameters: TemplateParameter[];

  /**
   * Required integrations
   */
  requiredIntegrations: string[];

  /**
   * Complexity level
   */
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  /**
   * Estimated setup time (minutes)
   */
  setupTime: number;

  /**
   * Average execution time (seconds)
   */
  avgExecutionTime?: number;

  /**
   * Usage count
   */
  usageCount: number;

  /**
   * Rating (0-5)
   */
  rating: number;

  /**
   * Number of ratings
   */
  ratingCount: number;

  /**
   * Template version
   */
  version: string;

  /**
   * Author information
   */
  author: TemplateAuthor;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last update timestamp
   */
  updatedAt: number;

  /**
   * Whether template is featured
   */
  isFeatured: boolean;

  /**
   * Whether template is official
   */
  isOfficial: boolean;

  /**
   * Preview images
   */
  previews: string[];

  /**
   * Related templates
   */
  relatedTemplates: string[];

  /**
   * Documentation URL
   */
  documentationUrl?: string;

  /**
   * Video tutorial URL
   */
  tutorialUrl?: string;
}

export type TemplateCategory =
  | 'web-scraping'
  | 'data-entry'
  | 'file-management'
  | 'email-automation'
  | 'social-media'
  | 'e-commerce'
  | 'finance'
  | 'hr-recruitment'
  | 'customer-service'
  | 'marketing'
  | 'sales'
  | 'it-operations'
  | 'document-processing'
  | 'reporting'
  | 'integrations'
  | 'utilities'
  | 'custom';

export interface TemplateParameter {
  /**
   * Parameter ID
   */
  id: string;

  /**
   * Parameter name
   */
  name: string;

  /**
   * Parameter description
   */
  description: string;

  /**
   * Parameter type
   */
  type: ParameterType;

  /**
   * Default value
   */
  defaultValue?: unknown;

  /**
   * Is required
   */
  required: boolean;

  /**
   * Validation rules
   */
  validation?: ParameterValidation;

  /**
   * Options for select/multiselect
   */
  options?: ParameterOption[];

  /**
   * Group for UI organization
   */
  group?: string;

  /**
   * Display order
   */
  order: number;

  /**
   * Conditional visibility
   */
  visibleWhen?: ParameterCondition;

  /**
   * Help text
   */
  helpText?: string;

  /**
   * Placeholder
   */
  placeholder?: string;
}

export type ParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'url'
  | 'email'
  | 'password'
  | 'file'
  | 'folder'
  | 'date'
  | 'datetime'
  | 'time'
  | 'cron'
  | 'selector'
  | 'json'
  | 'code'
  | 'credentials'
  | 'webhook';

export interface ParameterValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  customValidator?: string;
}

export interface ParameterOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: string;
}

export interface ParameterCondition {
  parameterId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'exists';
  value: unknown;
}

export interface TemplateAuthor {
  id: string;
  name: string;
  avatar?: string;
  verified: boolean;
  organization?: string;
  website?: string;
}

export interface TemplateSearchResult {
  templates: AutomationTemplate[];
  total: number;
  page: number;
  pageSize: number;
  facets: TemplateFacets;
}

export interface TemplateFacets {
  categories: FacetCount[];
  complexity: FacetCount[];
  integrations: FacetCount[];
  tags: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface TemplateSearchOptions {
  query?: string;
  category?: TemplateCategory;
  complexity?: string;
  tags?: string[];
  integrations?: string[];
  sortBy?: 'relevance' | 'popularity' | 'rating' | 'newest' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  onlyOfficial?: boolean;
  onlyFeatured?: boolean;
}

export interface TemplateInstallResult {
  flow: Flow;
  warnings: string[];
  missingIntegrations: string[];
  appliedParameters: Record<string, unknown>;
}

export interface TemplateRecommendation {
  template: AutomationTemplate;
  score: number;
  reasons: string[];
}

export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  createdAt: number;
  helpful: number;
  response?: {
    content: string;
    createdAt: number;
  };
}

// ============================================================================
// Pre-built Template Categories
// ============================================================================

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { name: string; icon: string; description: string }> = {
  'web-scraping': {
    name: 'Web Scraping',
    icon: '🕷️',
    description: 'Extract data from websites, APIs, and online sources',
  },
  'data-entry': {
    name: 'Data Entry',
    icon: '⌨️',
    description: 'Automate form filling, data input, and record creation',
  },
  'file-management': {
    name: 'File Management',
    icon: '📁',
    description: 'Organize, rename, move, and process files automatically',
  },
  'email-automation': {
    name: 'Email Automation',
    icon: '📧',
    description: 'Send, process, and manage emails automatically',
  },
  'social-media': {
    name: 'Social Media',
    icon: '📱',
    description: 'Automate posting, monitoring, and engagement',
  },
  'e-commerce': {
    name: 'E-Commerce',
    icon: '🛒',
    description: 'Product management, order processing, inventory',
  },
  'finance': {
    name: 'Finance & Accounting',
    icon: '💰',
    description: 'Invoice processing, reconciliation, reporting',
  },
  'hr-recruitment': {
    name: 'HR & Recruitment',
    icon: '👥',
    description: 'Resume processing, onboarding, employee management',
  },
  'customer-service': {
    name: 'Customer Service',
    icon: '🎧',
    description: 'Ticket management, response automation, feedback',
  },
  'marketing': {
    name: 'Marketing',
    icon: '📣',
    description: 'Campaign management, lead generation, analytics',
  },
  'sales': {
    name: 'Sales',
    icon: '💼',
    description: 'CRM updates, lead qualification, pipeline management',
  },
  'it-operations': {
    name: 'IT Operations',
    icon: '🖥️',
    description: 'System monitoring, maintenance, deployments',
  },
  'document-processing': {
    name: 'Document Processing',
    icon: '📄',
    description: 'PDF processing, OCR, document conversion',
  },
  'reporting': {
    name: 'Reporting & Analytics',
    icon: '📊',
    description: 'Generate reports, dashboards, data analysis',
  },
  'integrations': {
    name: 'Integrations',
    icon: '🔗',
    description: 'Connect different systems and sync data',
  },
  'utilities': {
    name: 'Utilities',
    icon: '🔧',
    description: 'General purpose automation utilities',
  },
  'custom': {
    name: 'Custom',
    icon: '⚙️',
    description: 'User-created custom templates',
  },
};

// ============================================================================
// Automation Templates Service
// ============================================================================

export const AutomationTemplatesService = {
  /**
   * Search templates
   */
  searchTemplates: async (
    options: TemplateSearchOptions = {}
  ): Promise<TemplateSearchResult> => {
    TelemetryService.trackEvent('template_search', {
      query: options.query || '',
      category: options.category || 'all',
    });

    return invoke<TemplateSearchResult>('automation_search_templates', {
      options,
    });
  },

  /**
   * Get template by ID
   */
  getTemplate: async (templateId: string): Promise<AutomationTemplate | null> => {
    return invoke<AutomationTemplate | null>('automation_get_template', {
      templateId,
    });
  },

  /**
   * Get featured templates
   */
  getFeaturedTemplates: async (limit?: number): Promise<AutomationTemplate[]> => {
    return invoke<AutomationTemplate[]>('automation_get_featured_templates', {
      limit: limit || 10,
    });
  },

  /**
   * Get templates by category
   */
  getTemplatesByCategory: async (
    category: TemplateCategory
  ): Promise<AutomationTemplate[]> => {
    return invoke<AutomationTemplate[]>('automation_get_templates_by_category', {
      category,
    });
  },

  /**
   * Get popular templates
   */
  getPopularTemplates: async (limit?: number): Promise<AutomationTemplate[]> => {
    return invoke<AutomationTemplate[]>('automation_get_popular_templates', {
      limit: limit || 20,
    });
  },

  /**
   * Get newest templates
   */
  getNewestTemplates: async (limit?: number): Promise<AutomationTemplate[]> => {
    return invoke<AutomationTemplate[]>('automation_get_newest_templates', {
      limit: limit || 20,
    });
  },

  /**
   * Install template (create flow from template)
   */
  installTemplate: async (
    templateId: string,
    parameters: Record<string, unknown>,
    flowName?: string
  ): Promise<TemplateInstallResult> => {
    TelemetryService.trackEvent('template_installed', {
      templateId,
    });

    return invoke<TemplateInstallResult>('automation_install_template', {
      templateId,
      parameters,
      flowName,
    });
  },

  /**
   * Preview template with parameters
   */
  previewTemplate: async (
    templateId: string,
    parameters: Record<string, unknown>
  ): Promise<Flow> => {
    return invoke<Flow>('automation_preview_template', {
      templateId,
      parameters,
    });
  },

  /**
   * Get AI recommendations based on user context
   */
  getRecommendations: async (
    context: {
      recentFlows?: string[];
      usedTemplates?: string[];
      integrations?: string[];
      industry?: string;
    }
  ): Promise<TemplateRecommendation[]> => {
    return invoke<TemplateRecommendation[]>('automation_get_template_recommendations', {
      context,
    });
  },

  /**
   * Get similar templates
   */
  getSimilarTemplates: async (
    templateId: string,
    limit?: number
  ): Promise<AutomationTemplate[]> => {
    return invoke<AutomationTemplate[]>('automation_get_similar_templates', {
      templateId,
      limit: limit || 5,
    });
  },

  /**
   * Rate a template
   */
  rateTemplate: async (
    templateId: string,
    rating: number,
    review?: string
  ): Promise<void> => {
    TelemetryService.trackEvent('template_rated', {
      templateId,
      rating,
    });

    return invoke('automation_rate_template', {
      templateId,
      rating,
      review,
    });
  },

  /**
   * Get template reviews
   */
  getTemplateReviews: async (
    templateId: string,
    page?: number,
    pageSize?: number
  ): Promise<{ reviews: TemplateReview[]; total: number }> => {
    return invoke<{ reviews: TemplateReview[]; total: number }>(
      'automation_get_template_reviews',
      { templateId, page: page || 1, pageSize: pageSize || 10 }
    );
  },

  /**
   * Submit a custom template to community
   */
  submitTemplate: async (
    flow: Flow,
    metadata: {
      name: string;
      description: string;
      category: TemplateCategory;
      tags: string[];
      parameters: TemplateParameter[];
    }
  ): Promise<string> => {
    TelemetryService.trackEvent('template_submitted');

    return invoke<string>('automation_submit_template', {
      flow,
      metadata,
    });
  },

  /**
   * Update a submitted template
   */
  updateTemplate: async (
    templateId: string,
    updates: Partial<AutomationTemplate>
  ): Promise<void> => {
    return invoke('automation_update_template', { templateId, updates });
  },

  /**
   * Delete a submitted template
   */
  deleteTemplate: async (templateId: string): Promise<void> => {
    return invoke('automation_delete_template', { templateId });
  },

  /**
   * Get user's submitted templates
   */
  getMyTemplates: async (): Promise<AutomationTemplate[]> => {
    return invoke<AutomationTemplate[]>('automation_get_my_templates');
  },

  /**
   * Get user's installed templates
   */
  getInstalledTemplates: async (): Promise<AutomationTemplate[]> => {
    return invoke<AutomationTemplate[]>('automation_get_installed_templates');
  },

  /**
   * Check for template updates
   */
  checkUpdates: async (
    installedTemplates: string[]
  ): Promise<{ templateId: string; newVersion: string }[]> => {
    return invoke<{ templateId: string; newVersion: string }[]>(
      'automation_check_template_updates',
      { installedTemplates }
    );
  },

  /**
   * Export template
   */
  exportTemplate: async (templateId: string): Promise<string> => {
    return invoke<string>('automation_export_template', { templateId });
  },

  /**
   * Import template from JSON
   */
  importTemplate: async (data: string): Promise<AutomationTemplate> => {
    return invoke<AutomationTemplate>('automation_import_template', { data });
  },

  /**
   * Validate template parameters
   */
  validateParameters: async (
    templateId: string,
    parameters: Record<string, unknown>
  ): Promise<{ valid: boolean; errors: Record<string, string> }> => {
    return invoke<{ valid: boolean; errors: Record<string, string> }>(
      'automation_validate_template_parameters',
      { templateId, parameters }
    );
  },

  /**
   * Get template parameter defaults
   */
  getParameterDefaults: async (
    templateId: string
  ): Promise<Record<string, unknown>> => {
    return invoke<Record<string, unknown>>(
      'automation_get_template_parameter_defaults',
      { templateId }
    );
  },

  /**
   * Get all categories with counts
   */
  getCategoryCounts: async (): Promise<FacetCount[]> => {
    return invoke<FacetCount[]>('automation_get_category_counts');
  },

  /**
   * Get popular tags
   */
  getPopularTags: async (limit?: number): Promise<FacetCount[]> => {
    return invoke<FacetCount[]>('automation_get_popular_tags', {
      limit: limit || 50,
    });
  },
};

// ============================================================================
// Built-in Template Definitions (Examples)
// ============================================================================

export const BUILT_IN_TEMPLATES: Partial<AutomationTemplate>[] = [
  {
    id: 'web-scraping-basic',
    name: 'Basic Web Scraper',
    description: 'Extract data from a single webpage using CSS selectors',
    category: 'web-scraping',
    tags: ['scraping', 'data-extraction', 'web'],
    icon: '🕷️',
    complexity: 'beginner',
    setupTime: 5,
    isOfficial: true,
    parameters: [
      {
        id: 'url',
        name: 'Target URL',
        description: 'The URL to scrape data from',
        type: 'url',
        required: true,
        order: 1,
      },
      {
        id: 'selectors',
        name: 'CSS Selectors',
        description: 'CSS selectors for data extraction',
        type: 'json',
        required: true,
        order: 2,
      },
      {
        id: 'outputFormat',
        name: 'Output Format',
        description: 'Format for extracted data',
        type: 'select',
        defaultValue: 'json',
        options: [
          { value: 'json', label: 'JSON' },
          { value: 'csv', label: 'CSV' },
          { value: 'excel', label: 'Excel' },
        ],
        required: true,
        order: 3,
      },
    ],
  },
  {
    id: 'form-filler-basic',
    name: 'Web Form Filler',
    description: 'Automatically fill web forms with data from spreadsheet',
    category: 'data-entry',
    tags: ['forms', 'data-entry', 'automation'],
    icon: '📝',
    complexity: 'intermediate',
    setupTime: 15,
    isOfficial: true,
    parameters: [
      {
        id: 'formUrl',
        name: 'Form URL',
        description: 'URL of the form to fill',
        type: 'url',
        required: true,
        order: 1,
      },
      {
        id: 'dataSource',
        name: 'Data Source',
        description: 'Excel or CSV file with form data',
        type: 'file',
        required: true,
        order: 2,
      },
      {
        id: 'fieldMapping',
        name: 'Field Mapping',
        description: 'Map spreadsheet columns to form fields',
        type: 'json',
        required: true,
        order: 3,
      },
    ],
  },
  {
    id: 'email-report-generator',
    name: 'Automated Email Report',
    description: 'Generate and send periodic reports via email',
    category: 'email-automation',
    tags: ['email', 'reports', 'scheduled'],
    icon: '📧',
    complexity: 'intermediate',
    setupTime: 20,
    isOfficial: true,
    parameters: [
      {
        id: 'reportType',
        name: 'Report Type',
        description: 'Type of report to generate',
        type: 'select',
        options: [
          { value: 'sales', label: 'Sales Report' },
          { value: 'traffic', label: 'Traffic Report' },
          { value: 'custom', label: 'Custom Report' },
        ],
        required: true,
        order: 1,
      },
      {
        id: 'recipients',
        name: 'Recipients',
        description: 'Email addresses to send report to',
        type: 'string',
        required: true,
        order: 2,
      },
      {
        id: 'schedule',
        name: 'Schedule',
        description: 'When to send the report',
        type: 'cron',
        defaultValue: '0 9 * * 1',
        required: true,
        order: 3,
      },
    ],
  },
  {
    id: 'invoice-processor',
    name: 'Invoice Processing',
    description: 'Extract data from invoices using OCR and create entries',
    category: 'finance',
    tags: ['invoices', 'ocr', 'accounting'],
    icon: '🧾',
    complexity: 'advanced',
    setupTime: 30,
    isOfficial: true,
    requiredIntegrations: ['ocr-service'],
    parameters: [
      {
        id: 'inputFolder',
        name: 'Invoice Folder',
        description: 'Folder containing invoice PDFs',
        type: 'folder',
        required: true,
        order: 1,
      },
      {
        id: 'accountingSystem',
        name: 'Accounting System',
        description: 'System to create entries in',
        type: 'select',
        options: [
          { value: 'quickbooks', label: 'QuickBooks' },
          { value: 'xero', label: 'Xero' },
          { value: 'freshbooks', label: 'FreshBooks' },
        ],
        required: true,
        order: 2,
      },
    ],
  },
  {
    id: 'social-media-scheduler',
    name: 'Social Media Post Scheduler',
    description: 'Schedule and publish posts across multiple platforms',
    category: 'social-media',
    tags: ['social', 'scheduling', 'marketing'],
    icon: '📱',
    complexity: 'intermediate',
    setupTime: 15,
    isOfficial: true,
    parameters: [
      {
        id: 'platforms',
        name: 'Platforms',
        description: 'Social media platforms to post to',
        type: 'multiselect',
        options: [
          { value: 'twitter', label: 'Twitter/X' },
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'facebook', label: 'Facebook' },
          { value: 'instagram', label: 'Instagram' },
        ],
        required: true,
        order: 1,
      },
      {
        id: 'contentSource',
        name: 'Content Source',
        description: 'Where to get post content from',
        type: 'select',
        options: [
          { value: 'spreadsheet', label: 'Spreadsheet' },
          { value: 'rss', label: 'RSS Feed' },
          { value: 'manual', label: 'Manual Input' },
        ],
        required: true,
        order: 2,
      },
    ],
  },
];

export default AutomationTemplatesService;
