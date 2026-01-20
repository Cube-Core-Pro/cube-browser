/**
 * Contact Management Tour Steps - CUBE Nexum
 * 
 * Comprehensive guided tour for the Contact/Email Management platform with:
 * - Contact database management
 * - List and segment creation
 * - Import/export functionality
 * - Email engagement tracking
 * - Tag and organization system
 * 
 * Total: 5 sections, ~24 steps, ~25 minutes
 */

import { TourStep, TourSection } from '../../tour/types';

// ============================================
// Section 1: Welcome & Overview
// ============================================

export const welcomeSteps: TourStep[] = [
  {
    id: 'contact-welcome',
    title: 'Welcome to Contact Management',
    content: `
      <p>Your centralized contact and email management hub:</p>
      <ul>
        <li><strong>Contact Database</strong> - Store and organize contacts</li>
        <li><strong>Lists</strong> - Group contacts for campaigns</li>
        <li><strong>Segments</strong> - Dynamic smart groups</li>
        <li><strong>Import/Export</strong> - CSV, Excel, API sync</li>
        <li><strong>Analytics</strong> - Engagement metrics</li>
      </ul>
      <p>Let's organize your contacts effectively!</p>
    `,
    category: 'welcome',
    targetSelector: '.contact-management',
    position: 'center',
    highlightType: 'none',
  },
  {
    id: 'contact-overview',
    title: 'Dashboard Overview',
    content: `
      <p>Quick stats at a glance:</p>
      <ul>
        <li><strong>Total Contacts</strong> - Your database size</li>
        <li><strong>Active Lists</strong> - Organized groups</li>
        <li><strong>Segments</strong> - Smart groupings</li>
        <li><strong>Recent Activity</strong> - Latest changes</li>
      </ul>
    `,
    category: 'welcome',
    targetSelector: '[data-tour="contact-stats"]',
    position: 'bottom',
    highlightType: 'border',
  },
];

// ============================================
// Section 2: Contact List & Search
// ============================================

export const contactListSteps: TourStep[] = [
  {
    id: 'contact-list-view',
    title: 'Contact List',
    content: `
      <p>View all your contacts in one place:</p>
      <ul>
        <li>Name, email, phone at a glance</li>
        <li>Tags and list membership</li>
        <li>Last activity and engagement</li>
        <li>Quick action buttons</li>
      </ul>
      <p>Click any row to view full details.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="contact-list"]',
    position: 'right',
    highlightType: 'spotlight',
  },
  {
    id: 'contact-search',
    title: 'Search & Filter',
    content: `
      <p>Find contacts quickly:</p>
      <ul>
        <li><strong>Search</strong> - By name, email, phone</li>
        <li><strong>Filter</strong> - By list, tag, status</li>
        <li><strong>Sort</strong> - Date, name, engagement</li>
        <li><strong>Bulk Select</strong> - Multi-contact actions</li>
      </ul>
      <p>Advanced search supports boolean operators.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="contact-search"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
  {
    id: 'contact-columns',
    title: 'Customize Columns',
    content: `
      <p>Show the data that matters:</p>
      <ul>
        <li>Add/remove display columns</li>
        <li>Drag to reorder columns</li>
        <li>Save column presets</li>
        <li>Export visible columns</li>
      </ul>
      <p>Click the columns icon to customize.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="column-settings"]',
    position: 'left',
    highlightType: 'border',
  },
];

// ============================================
// Section 3: Contact Management
// ============================================

export const managementSteps: TourStep[] = [
  {
    id: 'contact-add',
    title: 'Add New Contact',
    content: `
      <p>Create contacts manually:</p>
      <ol>
        <li>Click "Add Contact"</li>
        <li>Fill in contact details</li>
        <li>Add to lists (optional)</li>
        <li>Apply tags (optional)</li>
        <li>Save contact</li>
      </ol>
      <p>Required fields: Email or Phone.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="add-contact"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
  {
    id: 'contact-edit',
    title: 'Edit Contact',
    content: `
      <p>Update contact information:</p>
      <ul>
        <li>Click any contact to open</li>
        <li>Edit any field directly</li>
        <li>View activity history</li>
        <li>Add notes and tags</li>
      </ul>
      <p>Changes auto-save as you type.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="edit-contact"]',
    position: 'right',
    highlightType: 'border',
  },
  {
    id: 'contact-bulk-actions',
    title: 'Bulk Actions',
    content: `
      <p>Manage multiple contacts at once:</p>
      <ul>
        <li><strong>Select All</strong> - Check the header box</li>
        <li><strong>Add to List</strong> - Bulk list assignment</li>
        <li><strong>Apply Tags</strong> - Bulk tagging</li>
        <li><strong>Delete</strong> - Remove multiple contacts</li>
      </ul>
      <p>Select contacts first, then choose action.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="bulk-actions"]',
    position: 'bottom',
    highlightType: 'spotlight',
  },
  {
    id: 'contact-tags',
    title: 'Tags System',
    content: `
      <p>Organize with tags:</p>
      <ul>
        <li>Create custom tags</li>
        <li>Color-code for visibility</li>
        <li>Filter by multiple tags</li>
        <li>Use for segmentation</li>
      </ul>
      <p>Tags are flexible labels for any categorization.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="tags-section"]',
    position: 'left',
    highlightType: 'pulse',
  },
];

// ============================================
// Section 4: Lists & Segments
// ============================================

export const listsSegmentsSteps: TourStep[] = [
  {
    id: 'contact-lists',
    title: 'Contact Lists',
    content: `
      <p>Group contacts into lists:</p>
      <ul>
        <li><strong>Manual Lists</strong> - You add/remove contacts</li>
        <li><strong>Use Cases</strong> - Newsletters, campaigns, events</li>
        <li><strong>Multiple Lists</strong> - Contacts can be in many</li>
        <li><strong>List Stats</strong> - Size, engagement, growth</li>
      </ul>
      <p>Lists are the foundation for email campaigns.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="lists-panel"]',
    position: 'right',
    highlightType: 'spotlight',
  },
  {
    id: 'contact-create-list',
    title: 'Create New List',
    content: `
      <p>Start a new contact list:</p>
      <ol>
        <li>Click "New List"</li>
        <li>Name your list</li>
        <li>Add description (optional)</li>
        <li>Set visibility settings</li>
      </ol>
      <p>You can add contacts immediately or later.</p>
    `,
    category: 'campaigns',
    targetSelector: '[data-tour="create-list"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
  {
    id: 'contact-segments',
    title: 'Smart Segments',
    content: `
      <p>Dynamic groups that auto-update:</p>
      <ul>
        <li><strong>Rules-based</strong> - Define conditions</li>
        <li><strong>Auto-Update</strong> - Contacts move in/out</li>
        <li><strong>Examples:</strong>
          <ul>
            <li>Active in last 30 days</li>
            <li>High engagement score</li>
            <li>Located in specific region</li>
          </ul>
        </li>
      </ul>
      <p>Segments save time on manual list management.</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="segments-panel"]',
    position: 'left',
    highlightType: 'spotlight',
  },
  {
    id: 'contact-segment-rules',
    title: 'Segment Rules',
    content: `
      <p>Build segment conditions:</p>
      <ul>
        <li><strong>AND</strong> - All conditions must match</li>
        <li><strong>OR</strong> - Any condition can match</li>
        <li><strong>NOT</strong> - Exclude matches</li>
        <li><strong>Nested</strong> - Complex logic groups</li>
      </ul>
      <p>Preview results before saving.</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="segment-rules"]',
    position: 'bottom',
    highlightType: 'border',
  },
];

// ============================================
// Section 5: Import/Export
// ============================================

export const importExportSteps: TourStep[] = [
  {
    id: 'contact-import',
    title: 'Import Contacts',
    content: `
      <p>Bring in contacts from other sources:</p>
      <ul>
        <li><strong>CSV/Excel</strong> - Upload spreadsheets</li>
        <li><strong>Copy/Paste</strong> - Quick text import</li>
        <li><strong>API</strong> - Sync from other systems</li>
        <li><strong>Integrations</strong> - CRM, email platforms</li>
      </ul>
      <p>Duplicates are automatically detected.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="import-btn"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
  {
    id: 'contact-import-mapping',
    title: 'Field Mapping',
    content: `
      <p>Match your columns to contact fields:</p>
      <ol>
        <li>Upload your file</li>
        <li>Map columns to fields</li>
        <li>Set import options</li>
        <li>Preview and import</li>
      </ol>
      <p>Save mapping templates for repeated imports.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="field-mapping"]',
    position: 'right',
    highlightType: 'border',
  },
  {
    id: 'contact-export',
    title: 'Export Contacts',
    content: `
      <p>Download your contact data:</p>
      <ul>
        <li><strong>All Contacts</strong> - Full database</li>
        <li><strong>Selected</strong> - Current selection</li>
        <li><strong>List/Segment</strong> - Specific group</li>
        <li><strong>Formats</strong> - CSV, Excel, JSON</li>
      </ul>
      <p>Choose which fields to include.</p>
    `,
    category: 'settings',
    targetSelector: '[data-tour="export-btn"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
  {
    id: 'contact-engagement',
    title: 'Engagement Tracking',
    content: `
      <p>Monitor contact activity:</p>
      <ul>
        <li><strong>Opens</strong> - Email open rate</li>
        <li><strong>Clicks</strong> - Link click tracking</li>
        <li><strong>Score</strong> - Engagement score</li>
        <li><strong>History</strong> - Full activity log</li>
      </ul>
      <p>Use engagement data to prioritize outreach.</p>
    `,
    category: 'analytics',
    targetSelector: '[data-tour="engagement-stats"]',
    position: 'left',
    highlightType: 'spotlight',
  },
  {
    id: 'contact-complete',
    title: '🎉 Contact Management Tour Complete!',
    content: `
      <p>You're ready to manage your contacts like a pro!</p>
      <p><strong>Key takeaways:</strong></p>
      <ul>
        <li>Add contacts manually or import in bulk</li>
        <li>Use lists for campaign organization</li>
        <li>Create segments for dynamic grouping</li>
        <li>Track engagement to prioritize contacts</li>
        <li>Export data anytime you need</li>
      </ul>
      <p>Happy organizing! 📧</p>
    `,
    category: 'welcome',
    targetSelector: '.contact-management',
    position: 'center',
    highlightType: 'glow',
  },
];

// ============================================
// Export All Steps
// ============================================

export const allContactTourSteps: TourStep[] = [
  ...welcomeSteps,
  ...contactListSteps,
  ...managementSteps,
  ...listsSegmentsSteps,
  ...importExportSteps,
];

export const allContactTourSections: TourSection[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Introduction to Contact Management',
    steps: welcomeSteps,
    icon: '👋',
    category: 'welcome',
    estimatedMinutes: 3,
    difficulty: 'beginner',
  },
  {
    id: 'contact-list',
    title: 'Contact List',
    description: 'View and search contacts',
    steps: contactListSteps,
    icon: '📋',
    category: 'campaigns',
    estimatedMinutes: 5,
    difficulty: 'beginner',
  },
  {
    id: 'management',
    title: 'Contact Management',
    description: 'Add, edit, and organize contacts',
    steps: managementSteps,
    icon: '👤',
    category: 'campaigns',
    estimatedMinutes: 6,
    difficulty: 'beginner',
  },
  {
    id: 'lists-segments',
    title: 'Lists & Segments',
    description: 'Group and segment your contacts',
    steps: listsSegmentsSteps,
    icon: '📁',
    category: 'advanced',
    estimatedMinutes: 6,
    difficulty: 'intermediate',
  },
  {
    id: 'import-export',
    title: 'Import/Export',
    description: 'Import, export, and sync contacts',
    steps: importExportSteps,
    icon: '📤',
    category: 'settings',
    estimatedMinutes: 5,
    difficulty: 'beginner',
  },
];

// ============================================
// Tour Statistics
// ============================================

export const contactTourStats = {
  totalSteps: allContactTourSteps.length,
  totalSections: allContactTourSections.length,
  estimatedMinutes: allContactTourSections.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0),
  features: [
    'Contact database',
    'Search and filter',
    'Bulk actions',
    'Tags system',
    'Contact lists',
    'Smart segments',
    'CSV/Excel import',
    'Export options',
    'Engagement tracking',
    'Activity history',
  ],
};
