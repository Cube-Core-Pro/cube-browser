/**
 * Intelligence Center Tour Steps - CUBE Nexum
 * 
 * Comprehensive guided tour for the Intelligence/OSINT Research platform with:
 * - Person and company profiling
 * - Multi-source data aggregation
 * - Risk assessment
 * - AI-powered analysis
 * - Investigation management
 * 
 * Total: 6 sections, ~28 steps, ~30 minutes
 */

import { TourStep, TourSection } from '../../tour/types';

// ============================================
// Section 1: Welcome & Overview
// ============================================

export const welcomeSteps: TourStep[] = [
  {
    id: 'intel-welcome',
    title: 'Welcome to Intelligence Center',
    content: `
      <p>Your OSINT (Open Source Intelligence) research hub:</p>
      <ul>
        <li><strong>Person Search</strong> - Find information on individuals</li>
        <li><strong>Company Intel</strong> - Business research and analysis</li>
        <li><strong>Data Sources</strong> - Multi-source intelligence aggregation</li>
        <li><strong>Risk Assessment</strong> - AI-powered threat analysis</li>
        <li><strong>Reports</strong> - Generate detailed dossiers</li>
      </ul>
      <p>Let's explore your intelligence toolkit!</p>
    `,
    category: 'welcome',
    targetSelector: '.intelligence-center',
    position: 'center',
    highlightType: 'none',
  },
  {
    id: 'intel-search-types',
    title: 'Search Types',
    content: `
      <p>Different search methods for different needs:</p>
      <ul>
        <li><strong>Person</strong> - Name, age, location lookup</li>
        <li><strong>Company</strong> - Business entity research</li>
        <li><strong>Domain</strong> - Website ownership info</li>
        <li><strong>Email</strong> - Email address investigation</li>
        <li><strong>Phone</strong> - Number reverse lookup</li>
        <li><strong>Address</strong> - Property and location data</li>
      </ul>
    `,
    category: 'welcome',
    targetSelector: '[data-tour="intel-search-types"]',
    position: 'bottom',
    highlightType: 'border',
  },
];

// ============================================
// Section 2: Search & Discovery
// ============================================

export const searchSteps: TourStep[] = [
  {
    id: 'intel-search-bar',
    title: 'Intelligence Search',
    content: `
      <p>Start your investigation:</p>
      <ol>
        <li>Select search type (person, company, etc.)</li>
        <li>Enter your search terms</li>
        <li>Add filters for precision</li>
        <li>Run the search</li>
      </ol>
      <p>Results are aggregated from multiple data sources.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="intel-search-bar"]',
    position: 'bottom',
    highlightType: 'spotlight',
  },
  {
    id: 'intel-person-search',
    title: 'Person Search',
    content: `
      <p>Find information on individuals:</p>
      <ul>
        <li><strong>Basic Info</strong> - Name, age, addresses</li>
        <li><strong>Social Media</strong> - Online presence</li>
        <li><strong>Background</strong> - Employment, education</li>
        <li><strong>Public Records</strong> - Legal and financial</li>
      </ul>
      <p>All data comes from publicly available sources.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="person-search"]',
    position: 'right',
    highlightType: 'pulse',
  },
  {
    id: 'intel-company-search',
    title: 'Company Research',
    content: `
      <p>Investigate businesses and organizations:</p>
      <ul>
        <li><strong>Registration</strong> - Corporate records</li>
        <li><strong>Officers</strong> - Directors and executives</li>
        <li><strong>Financials</strong> - Revenue, funding</li>
        <li><strong>Relationships</strong> - Subsidiaries, partners</li>
      </ul>
      <p>Perfect for due diligence and competitive analysis.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="company-search"]',
    position: 'left',
    highlightType: 'pulse',
  },
  {
    id: 'intel-filters',
    title: 'Search Filters',
    content: `
      <p>Refine your search results:</p>
      <ul>
        <li><strong>Location</strong> - Geographic filtering</li>
        <li><strong>Date Range</strong> - Time-bound results</li>
        <li><strong>Source Type</strong> - Specific data sources</li>
        <li><strong>Confidence</strong> - Data reliability level</li>
      </ul>
      <p>Better filters = more accurate intelligence.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="intel-filters"]',
    position: 'bottom',
    highlightType: 'border',
  },
];

// ============================================
// Section 3: Data Sources
// ============================================

export const dataSourcesSteps: TourStep[] = [
  {
    id: 'intel-sources',
    title: 'Data Sources',
    content: `
      <p>Intelligence is gathered from multiple sources:</p>
      <ul>
        <li><strong>Social Media</strong> - Public profiles and posts</li>
        <li><strong>Public Records</strong> - Government databases</li>
        <li><strong>News</strong> - Media mentions</li>
        <li><strong>Business</strong> - Corporate registrations</li>
        <li><strong>Dark Web</strong> - Breach monitoring</li>
      </ul>
      <p>All sources are legal and publicly accessible.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="data-sources"]',
    position: 'right',
    highlightType: 'spotlight',
  },
  {
    id: 'intel-source-status',
    title: 'Source Status',
    content: `
      <p>Monitor your data source connections:</p>
      <ul>
        <li><span style="color: #10b981;">●</span> <strong>Active</strong> - Connected and working</li>
        <li><span style="color: #f59e0b;">●</span> <strong>Limited</strong> - Partial access</li>
        <li><span style="color: #ef4444;">●</span> <strong>Offline</strong> - Temporarily unavailable</li>
      </ul>
      <p>More active sources = better intelligence coverage.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="source-status"]',
    position: 'left',
    highlightType: 'border',
  },
  {
    id: 'intel-add-source',
    title: 'Add Data Sources',
    content: `
      <p>Expand your intelligence network:</p>
      <ul>
        <li>Connect API credentials</li>
        <li>Add custom data feeds</li>
        <li>Import existing databases</li>
        <li>Configure access levels</li>
      </ul>
      <p>Enterprise accounts get additional premium sources.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="add-source"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
];

// ============================================
// Section 4: Investigations
// ============================================

export const investigationsSteps: TourStep[] = [
  {
    id: 'intel-investigations',
    title: 'Investigations',
    content: `
      <p>Organize your research into projects:</p>
      <ul>
        <li><strong>Create</strong> - New investigation case</li>
        <li><strong>Collect</strong> - Save relevant findings</li>
        <li><strong>Analyze</strong> - Find connections</li>
        <li><strong>Collaborate</strong> - Team sharing</li>
      </ul>
      <p>Keep your intelligence organized and actionable.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="investigations"]',
    position: 'center',
    highlightType: 'spotlight',
  },
  {
    id: 'intel-new-case',
    title: 'Create Investigation',
    content: `
      <p>Start a new investigation case:</p>
      <ol>
        <li>Click "New Investigation"</li>
        <li>Name your case</li>
        <li>Set priority level</li>
        <li>Add initial subjects</li>
      </ol>
      <p>All evidence is automatically timestamped.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="new-investigation"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
  {
    id: 'intel-timeline',
    title: 'Investigation Timeline',
    content: `
      <p>Track case progress over time:</p>
      <ul>
        <li>Evidence added chronologically</li>
        <li>Analysis milestones marked</li>
        <li>Team activity logged</li>
        <li>Export for legal proceedings</li>
      </ul>
      <p>Complete audit trail for compliance.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="case-timeline"]',
    position: 'right',
    highlightType: 'border',
  },
  {
    id: 'intel-link-analysis',
    title: 'Link Analysis',
    content: `
      <p>Visualize connections between entities:</p>
      <ul>
        <li><strong>Graph View</strong> - Network visualization</li>
        <li><strong>Relationships</strong> - See who knows who</li>
        <li><strong>Patterns</strong> - Detect hidden connections</li>
        <li><strong>Export</strong> - Share visualizations</li>
      </ul>
      <p>Powerful tool for complex investigations.</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="link-analysis"]',
    position: 'center',
    highlightType: 'spotlight',
  },
];

// ============================================
// Section 5: Risk Assessment
// ============================================

export const riskSteps: TourStep[] = [
  {
    id: 'intel-risk-assessment',
    title: 'Risk Assessment',
    content: `
      <p>AI-powered threat analysis:</p>
      <ul>
        <li><strong>Risk Score</strong> - Overall threat level</li>
        <li><strong>Factors</strong> - What contributes to risk</li>
        <li><strong>Trends</strong> - Risk over time</li>
        <li><strong>Recommendations</strong> - Suggested actions</li>
      </ul>
      <p>Make informed decisions with data-driven risk analysis.</p>
    `,
    category: 'analytics',
    targetSelector: '[data-tour="risk-assessment"]',
    position: 'bottom',
    highlightType: 'spotlight',
  },
  {
    id: 'intel-risk-indicators',
    title: 'Risk Indicators',
    content: `
      <p>Understanding risk levels:</p>
      <ul>
        <li><strong>Low (1-3)</strong> - Minimal concerns</li>
        <li><strong>Medium (4-6)</strong> - Monitor closely</li>
        <li><strong>High (7-8)</strong> - Significant issues</li>
        <li><strong>Critical (9-10)</strong> - Immediate attention</li>
      </ul>
      <p>Based on aggregated intelligence data.</p>
    `,
    category: 'analytics',
    targetSelector: '[data-tour="risk-indicators"]',
    position: 'left',
    highlightType: 'border',
  },
  {
    id: 'intel-monitoring',
    title: 'Continuous Monitoring',
    content: `
      <p>Set up alerts for changes:</p>
      <ul>
        <li><strong>New Info</strong> - When new data appears</li>
        <li><strong>Risk Change</strong> - Score increases</li>
        <li><strong>Mentions</strong> - News and social media</li>
        <li><strong>Breaches</strong> - Dark web exposure</li>
      </ul>
      <p>Stay informed without manual checking.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="monitoring"]',
    position: 'right',
    highlightType: 'pulse',
  },
];

// ============================================
// Section 6: Reports & AI Analysis
// ============================================

export const reportsSteps: TourStep[] = [
  {
    id: 'intel-reports',
    title: 'Intelligence Reports',
    content: `
      <p>Generate comprehensive reports:</p>
      <ul>
        <li><strong>Dossier</strong> - Full subject profile</li>
        <li><strong>Summary</strong> - Executive overview</li>
        <li><strong>Timeline</strong> - Chronological events</li>
        <li><strong>Risk</strong> - Threat assessment</li>
      </ul>
      <p>Professional reports ready for stakeholders.</p>
    `,
    category: 'analytics',
    targetSelector: '[data-tour="reports"]',
    position: 'center',
    highlightType: 'spotlight',
  },
  {
    id: 'intel-ai-analysis',
    title: 'AI Analysis',
    content: `
      <p>Let AI enhance your investigation:</p>
      <ul>
        <li><strong>Pattern Detection</strong> - Find hidden links</li>
        <li><strong>Sentiment</strong> - Analyze tone of mentions</li>
        <li><strong>Predictions</strong> - Forecast future risks</li>
        <li><strong>Summaries</strong> - Condensed intelligence</li>
      </ul>
      <p>AI processes thousands of data points instantly.</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="ai-analysis"]',
    position: 'right',
    highlightType: 'pulse',
  },
  {
    id: 'intel-export',
    title: 'Export & Share',
    content: `
      <p>Share your findings:</p>
      <ul>
        <li><strong>PDF</strong> - Formatted reports</li>
        <li><strong>CSV</strong> - Raw data export</li>
        <li><strong>JSON</strong> - API integration</li>
        <li><strong>Share Link</strong> - Secure collaboration</li>
      </ul>
      <p>Control who sees what with permission settings.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="export"]',
    position: 'left',
    highlightType: 'border',
  },
  {
    id: 'intel-complete',
    title: '🎉 Intelligence Center Tour Complete!',
    content: `
      <p>You're ready to conduct professional investigations!</p>
      <p><strong>Key takeaways:</strong></p>
      <ul>
        <li>Use multi-source search for comprehensive results</li>
        <li>Organize findings into investigation cases</li>
        <li>Monitor subjects with continuous alerts</li>
        <li>Let AI help analyze complex data</li>
        <li>Generate professional reports</li>
      </ul>
      <p>Intelligence at your fingertips! 🔍</p>
    `,
    category: 'welcome',
    targetSelector: '.intelligence-center',
    position: 'center',
    highlightType: 'glow',
  },
];

// ============================================
// Export All Steps
// ============================================

export const allIntelligenceTourSteps: TourStep[] = [
  ...welcomeSteps,
  ...searchSteps,
  ...dataSourcesSteps,
  ...investigationsSteps,
  ...riskSteps,
  ...reportsSteps,
];

export const allIntelligenceTourSections: TourSection[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Introduction to Intelligence Center',
    steps: welcomeSteps,
    icon: '👋',
    category: 'welcome',
    estimatedMinutes: 3,
    difficulty: 'beginner',
  },
  {
    id: 'search',
    title: 'Search & Discovery',
    description: 'Find and gather intelligence',
    steps: searchSteps,
    icon: '🔍',
    category: 'campaigns',
    estimatedMinutes: 6,
    difficulty: 'beginner',
  },
  {
    id: 'data-sources',
    title: 'Data Sources',
    description: 'Intelligence source management',
    steps: dataSourcesSteps,
    icon: '📡',
    category: 'settings',
    estimatedMinutes: 5,
    difficulty: 'intermediate',
  },
  {
    id: 'investigations',
    title: 'Investigations',
    description: 'Manage research projects',
    steps: investigationsSteps,
    icon: '🕵️',
    category: 'campaigns',
    estimatedMinutes: 7,
    difficulty: 'intermediate',
  },
  {
    id: 'risk',
    title: 'Risk Assessment',
    description: 'AI-powered threat analysis',
    steps: riskSteps,
    icon: '⚠️',
    category: 'analytics',
    estimatedMinutes: 5,
    difficulty: 'intermediate',
  },
  {
    id: 'reports',
    title: 'Reports & AI',
    description: 'Generate reports and AI analysis',
    steps: reportsSteps,
    icon: '📊',
    category: 'analytics',
    estimatedMinutes: 4,
    difficulty: 'beginner',
  },
];

// ============================================
// Tour Statistics
// ============================================

export const intelligenceTourStats = {
  totalSteps: allIntelligenceTourSteps.length,
  totalSections: allIntelligenceTourSections.length,
  estimatedMinutes: allIntelligenceTourSections.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0),
  features: [
    'Person search',
    'Company research',
    'Domain lookup',
    'Email investigation',
    'Phone reverse lookup',
    'Multi-source aggregation',
    'Investigation cases',
    'Link analysis',
    'Risk assessment',
    'AI-powered analysis',
    'Report generation',
    'Continuous monitoring',
  ],
};
