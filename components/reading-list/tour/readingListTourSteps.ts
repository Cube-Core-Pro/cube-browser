/**
 * Reading List Tour Steps
 * CUBE Elite v7.0.0 - Read Later Manager
 * 
 * Comprehensive guided tour for reading list features
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for Reading List module
 * Covers: Items, Tags, Read/Unread, Organization
 */
export const readingListTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'reading-welcome',
    target: '[data-tour="reading-list-module"]',
    title: '📖 Reading List',
    content: `Welcome to CUBE's reading list!

**Key Features:**
• Save articles for later
• Mark as read/unread
• Tag for organization
• Preview text snippets
• Track reading history

Never lose an interesting article again.`,
    placement: 'center',
    position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Adding Items
  // ============================================================================
  {
    id: 'reading-add',
    target: '[data-tour="add-reading-item"]',
    title: '➕ Add to Reading List',
    content: `Save pages for later:

**Ways to Add:**
• Browser extension button
• Right-click menu
• Direct URL input

**Auto-Captured:**
• Page title
• URL
• Preview text
• Favicon`,
    placement: 'bottom',
    position: 'bottom',
    category: 'add',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 3: Reading Items
  // ============================================================================
  {
    id: 'reading-item',
    target: '[data-tour="reading-item"]',
    title: '📄 Reading Item',
    content: `Each saved item shows:

**Item Information:**
• Page title
• Source URL
• Preview text
• Date added
• Read status

Click title to open article.`,
    placement: 'right',
    position: 'right',
    category: 'items',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'reading-status',
    target: '[data-tour="read-status"]',
    title: '✓ Read/Unread Status',
    content: `Track what you've read:

**Status Indicators:**
• ⭕ **Unread**: Not yet read
• ✅ **Read**: Completed

**Toggle:**
Click circle to mark as read.

Read items appear faded.`,
    placement: 'left',
    position: 'left',
    category: 'items',
    showProgress: true
  },
  {
    id: 'reading-preview',
    target: '[data-tour="preview-text"]',
    title: '📝 Preview Text',
    content: `Article preview:

**Preview Shows:**
• First ~200 characters
• Key content snippet

**Benefits:**
• Quick content scan
• Decide if worth reading
• Remember context`,
    placement: 'bottom',
    position: 'bottom',
    category: 'items',
    showProgress: true
  },
  {
    id: 'reading-metadata',
    target: '[data-tour="item-metadata"]',
    title: '📅 Item Metadata',
    content: `Track reading history:

**Dates Shown:**
• 📅 Date added
• 🕐 Date read (if read)

**Use For:**
• Find recent saves
• Track reading speed
• Review old items`,
    placement: 'bottom',
    position: 'bottom',
    category: 'items',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: Tags
  // ============================================================================
  {
    id: 'reading-tags',
    target: '[data-tour="item-tags"]',
    title: '🏷️ Item Tags',
    content: `Organize with tags:

**Tag Features:**
• Multiple tags per item
• Comma-separated input
• Filter by tag

**Example Tags:**
• tech, news, tutorial
• work, research, ideas
• read-first, archive`,
    placement: 'bottom',
    position: 'bottom',
    category: 'tags',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'reading-add-tags',
    target: '[data-tour="add-tags"]',
    title: '➕ Add Tags',
    content: `Tag your items:

**How to Add:**
1. Click "Add tags" area
2. Type comma-separated tags
3. Press Enter or click +

**Tips:**
• Use consistent naming
• Keep tags short
• Use categories`,
    placement: 'top',
    position: 'top',
    category: 'tags',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: Actions
  // ============================================================================
  {
    id: 'reading-open',
    target: '[data-tour="open-btn"]',
    title: '🔗 Open Article',
    content: `Open saved articles:

**Open Options:**
• Click title
• Click 🔗 button

**Opens In:**
New browser tab

Read at your convenience!`,
    placement: 'left',
    position: 'left',
    category: 'actions',
    showProgress: true
  },
  {
    id: 'reading-remove',
    target: '[data-tour="remove-btn"]',
    title: '🗑️ Remove Item',
    content: `Remove from list:

**Remove:**
Click 🗑️ button

**When to Remove:**
• Already read & done
• No longer interested
• Added by mistake

Items are permanently deleted.`,
    placement: 'left',
    position: 'left',
    category: 'actions',
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: Empty State
  // ============================================================================
  {
    id: 'reading-empty',
    target: '[data-tour="empty-state"]',
    title: '📭 Empty Reading List',
    content: `Start building your list:

**When Empty:**
• Add articles from browser
• Use extension to save
• Paste URLs directly

**Tip:**
When you find something
interesting, save it immediately!`,
    placement: 'center',
    position: 'center',
    category: 'tips',
    showProgress: true
  },

  // ============================================================================
  // SECTION 7: Tour Completion
  // ============================================================================
  {
    id: 'reading-complete',
    target: '[data-tour="reading-list-module"]',
    title: '✅ Reading List Tour Complete!',
    content: `You've mastered CUBE Reading List!

**Topics Covered:**
✓ Adding items
✓ Read/unread tracking
✓ Preview text
✓ Tag organization
✓ Opening articles
✓ Managing items

**Pro Tips:**
• Save interesting articles immediately
• Use consistent tags
• Review list weekly
• Mark as read when done
• Remove completed items

**Quick Reference:**
• Add: Browser extension
• Read: Click title
• Toggle: Click circle
• Tag: Click add tags
• Remove: 🗑️ button

Happy reading!`,
    placement: 'center',
    position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for Reading List
 */
export const readingListTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '📖' },
  { id: 'add', title: 'Add Items', icon: '➕' },
  { id: 'items', title: 'Items', icon: '📄' },
  { id: 'tags', title: 'Tags', icon: '🏷️' },
  { id: 'actions', title: 'Actions', icon: '🔗' },
  { id: 'tips', title: 'Tips', icon: '💡' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getReadingListStepsBySection = (sectionId: string): TourStep[] => {
  return readingListTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getReadingListRequiredSteps = (): TourStep[] => {
  return readingListTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const readingListTourConfig = {
  id: 'reading-list-tour',
  name: 'Reading List Tour',
  description: 'Save and organize articles for later reading',
  version: '1.0.0',
  totalSteps: readingListTourSteps.length,
  estimatedTime: '3 minutes',
  sections: readingListTourSections,
  features: [
    'Save for later',
    'Read tracking',
    'Tag organization',
    'Preview text',
    'Reading history'
  ]
};

export default readingListTourSteps;
