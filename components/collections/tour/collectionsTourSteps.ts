/**
 * Collections Tour Steps
 * CUBE Elite v7.0.0 - Web Page Collections Manager
 * 
 * Comprehensive guided tour for collections and bookmarks
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for Collections module
 * Covers: Collections, Pages, Sharing, Organization
 */
export const collectionsTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'collections-welcome',
    target: '[data-tour="collections-module"]',
    title: '📚 Collections Manager',
    content: `Welcome to CUBE's collections manager!

**Key Features:**
• Organize web pages into collections
• Color-coded organization
• Page previews & notes
• Share collections with others
• Grid & list views

Your personal web library.`,
    placement: 'center',
    position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Create & Manage Collections
  // ============================================================================
  {
    id: 'collections-create',
    target: '[data-tour="create-collection"]',
    title: '➕ Create Collection',
    content: `Start organizing with collections:

**Collection Properties:**
• Title (required)
• Description (optional)
• Color theme
• Custom icon

**Examples:**
• 📖 Research
• 🛒 Shopping
• 📰 News
• 💼 Work`,
    placement: 'bottom',
    position: 'bottom',
    category: 'create',
    isRequired: true,
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'collections-colors',
    target: '[data-tour="color-picker"]',
    title: '🎨 Collection Colors',
    content: `Color-code your collections:

**Available Colors:**
• 🔴 Red - Urgent/Important
• 🟠 Orange - Active
• 🟡 Yellow - Review
• 🟢 Green - Completed
• 🔵 Blue - Reference
• 🟣 Purple - Personal

Visual organization at a glance.`,
    placement: 'right',
    position: 'right',
    category: 'create',
    showProgress: true
  },

  // ============================================================================
  // SECTION 3: Collection Card
  // ============================================================================
  {
    id: 'collections-card',
    target: '[data-tour="collection-card"]',
    title: '📁 Collection Card',
    content: `Each collection shows:

**Card Information:**
• Collection title
• Color indicator
• Page count
• Last updated

**Quick Actions:**
• Click to expand
• Menu for options`,
    placement: 'right',
    position: 'right',
    category: 'cards',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'collections-menu',
    target: '[data-tour="collection-menu"]',
    title: '⋮ Collection Menu',
    content: `Manage collection:

**Menu Options:**
• ✏️ **Edit**: Change title/color
• 🗑️ **Delete**: Remove collection
• 🔗 **Share**: Generate share link

Click ⋮ to access menu.`,
    placement: 'left',
    position: 'left',
    category: 'cards',
    showProgress: true
  },
  {
    id: 'collections-edit',
    target: '[data-tour="edit-collection"]',
    title: '✏️ Edit Collection',
    content: `Modify collection properties:

**Editable Fields:**
• Title
• Description
• Color theme

**Save Changes:**
Click Save to confirm edits.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'cards',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: Pages Management
  // ============================================================================
  {
    id: 'collections-pages',
    target: '[data-tour="collection-pages"]',
    title: '📄 Collection Pages',
    content: `View pages in collection:

**Page Display:**
• Page title
• URL preview
• Favicon
• Date added

Click collection to expand pages.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'pages',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'collections-add-page',
    target: '[data-tour="add-page"]',
    title: '➕ Add Page',
    content: `Add pages to collection:

**Required Fields:**
• URL (valid web address)
• Title (page name)

**Optional:**
• Notes about the page

**From Extension:**
Right-click → Add to Collection`,
    placement: 'bottom',
    position: 'bottom',
    category: 'pages',
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'collections-page-actions',
    target: '[data-tour="page-actions"]',
    title: '🔗 Page Actions',
    content: `Actions for saved pages:

**Available Actions:**
• 🔗 **Open**: Open in new tab
• ✏️ **Edit**: Change notes
• 🗑️ **Remove**: Delete from collection

Quick access to your saved content.`,
    placement: 'left',
    position: 'left',
    category: 'pages',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: Sharing
  // ============================================================================
  {
    id: 'collections-share',
    target: '[data-tour="share-btn"]',
    title: '🔗 Share Collection',
    content: `Share with others:

**Sharing Options:**
• Generate unique share code
• Copy shareable link
• Toggle sharing on/off

**Privacy:**
• Only you control access
• Revoke anytime`,
    placement: 'left',
    position: 'left',
    category: 'sharing',
    showProgress: true
  },
  {
    id: 'collections-share-code',
    target: '[data-tour="share-code"]',
    title: '🔑 Share Code',
    content: `Share code details:

**Share Code:**
• Unique identifier
• Copy with one click
• Share via any channel

**Recipients Can:**
• View collection
• Access all pages
• Cannot edit`,
    placement: 'bottom',
    position: 'bottom',
    category: 'sharing',
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: View Modes
  // ============================================================================
  {
    id: 'collections-view-mode',
    target: '[data-tour="view-toggle"]',
    title: '👁️ View Modes',
    content: `Change display layout:

**Available Views:**
• **⊞ Grid**: Card layout
• **☰ List**: Compact list

**Grid View:**
Visual cards with previews

**List View:**
More items, less detail`,
    placement: 'bottom',
    position: 'bottom',
    category: 'views',
    showProgress: true
  },

  // ============================================================================
  // SECTION 7: Tour Completion
  // ============================================================================
  {
    id: 'collections-complete',
    target: '[data-tour="collections-module"]',
    title: '✅ Collections Tour Complete!',
    content: `You've mastered CUBE Collections!

**Topics Covered:**
✓ Creating collections
✓ Color-coded organization
✓ Adding pages
✓ Managing content
✓ Sharing collections
✓ View modes

**Pro Tips:**
• Use colors for categories
• Add notes for context
• Share with team members
• Use browser extension to add pages

**Quick Reference:**
• Create: + New Collection
• Add page: + in collection
• Share: 🔗 button
• Edit: ⋮ menu → Edit

Stay organized!`,
    placement: 'center',
    position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for Collections
 */
export const collectionsTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '📚' },
  { id: 'create', title: 'Create', icon: '➕' },
  { id: 'cards', title: 'Cards', icon: '📁' },
  { id: 'pages', title: 'Pages', icon: '📄' },
  { id: 'sharing', title: 'Sharing', icon: '🔗' },
  { id: 'views', title: 'Views', icon: '👁️' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getCollectionsStepsBySection = (sectionId: string): TourStep[] => {
  return collectionsTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getCollectionsRequiredSteps = (): TourStep[] => {
  return collectionsTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const collectionsTourConfig = {
  id: 'collections-tour',
  name: 'Collections Tour',
  description: 'Organize web pages with collections',
  version: '1.0.0',
  totalSteps: collectionsTourSteps.length,
  estimatedTime: '4 minutes',
  sections: collectionsTourSections,
  features: [
    'Page collections',
    'Color organization',
    'Notes & previews',
    'Sharing',
    'Grid/List views'
  ]
};

export default collectionsTourSteps;
