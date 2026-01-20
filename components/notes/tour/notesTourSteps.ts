/**
 * Notes Tour Steps
 * CUBE Elite v7.0.0 - Notes & Task Manager
 * 
 * Comprehensive guided tour for notes and task management
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for Notes module
 * Covers: Notes, Tasks, Kanban, Categories, Tags, Views
 */
export const notesTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'notes-welcome',
    target: '[data-tour="notes-module"]',
    title: '📝 Notes & Tasks Manager',
    content: `Welcome to CUBE's notes and task manager!

**Key Features:**
• Notes with rich categorization
• Task management with due dates
• Kanban board for visual workflow
• Categories and tags system
• Auto-save functionality
• Multiple view modes

Organize your thoughts and tasks effectively.`,
    placement: 'center',
    position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Toolbar
  // ============================================================================
  {
    id: 'notes-toolbar',
    target: '[data-tour="notes-toolbar"]',
    title: '🛠️ Notes Toolbar',
    content: `The main control center for notes:

**Toolbar Features:**
• Search notes and tasks
• Toggle sidebar visibility
• Change view modes
• Create new notes/tasks
• View statistics

All controls at your fingertips.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'toolbar',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'notes-search',
    target: '[data-tour="notes-search"]',
    title: '🔍 Search Notes',
    content: `Find notes quickly:

**Search Features:**
• Real-time filtering
• Searches titles and content
• Matches tags automatically

**Tips:**
• Use keywords from titles
• Search by tag names
• Filter by category first`,
    placement: 'bottom',
    position: 'bottom',
    category: 'toolbar',
    showProgress: true
  },
  {
    id: 'notes-view-modes',
    target: '[data-tour="view-modes"]',
    title: '👁️ View Modes',
    content: `Choose how to display notes:

**Available Views:**
• **☰ List**: Traditional list view
• **⊞ Grid**: Card-based grid layout
• **≡ Kanban**: Task board with columns

**When to Use Each:**
• List: Detailed note management
• Grid: Visual overview
• Kanban: Task workflow tracking`,
    placement: 'bottom',
    position: 'bottom',
    category: 'toolbar',
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'notes-create',
    target: '[data-tour="create-note"]',
    title: '➕ Create Note/Task',
    content: `Add new notes or tasks:

**Create Options:**
• **+ Note**: General purpose note
• **+ Task**: Task with due date

**Notes Include:**
• Title and content
• Category assignment
• Tags for organization
• Priority level

**Tasks Add:**
• Due date tracking
• Subtasks support
• Progress tracking`,
    placement: 'bottom',
    position: 'bottom',
    category: 'toolbar',
    showProgress: true,
    highlightClicks: true
  },

  // ============================================================================
  // SECTION 3: Sidebar
  // ============================================================================
  {
    id: 'notes-sidebar',
    target: '[data-tour="notes-sidebar"]',
    title: '📂 Notes Sidebar',
    content: `Quick navigation and filtering:

**Sidebar Sections:**
• Quick Filters
• Categories
• Popular Tags

Toggle with ☰ button in toolbar.`,
    placement: 'right',
    position: 'right',
    category: 'sidebar',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'notes-quick-filters',
    target: '[data-tour="quick-filters"]',
    title: '⚡ Quick Filters',
    content: `Filter notes instantly:

**Filter Options:**
• 📝 **All Notes**: Show all active
• ⭐ **Favorites**: Starred notes only
• 📌 **Pinned**: Pinned to top
• 📦 **Archived**: Hidden notes

Click any filter to apply instantly.`,
    placement: 'right',
    position: 'right',
    category: 'sidebar',
    showProgress: true
  },
  {
    id: 'notes-categories',
    target: '[data-tour="categories-list"]',
    title: '🏷️ Categories',
    content: `Organize with categories:

**Category Features:**
• Custom name and color
• Icon assignment
• Count indicator

**Category Examples:**
• 💼 Work
• 🏠 Personal
• 💡 Ideas
• 📚 Learning

Click a category to filter notes.`,
    placement: 'right',
    position: 'right',
    category: 'sidebar',
    showProgress: true
  },
  {
    id: 'notes-tags',
    target: '[data-tour="tags-list"]',
    title: '#️⃣ Tags',
    content: `Flexible tagging system:

**Tag Features:**
• Add multiple per note
• Auto-complete suggestions
• Usage count shown

**Tag Tips:**
• Use short descriptive tags
• Combine related concepts
• Tags are searchable

Popular tags shown with count.`,
    placement: 'right',
    position: 'right',
    category: 'sidebar',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: Note Editor
  // ============================================================================
  {
    id: 'notes-editor',
    target: '[data-tour="note-editor"]',
    title: '✏️ Note Editor',
    content: `Edit notes with full features:

**Editor Sections:**
• Title field (top)
• Category & Priority selectors
• Main content area
• Tags input (bottom)

**Auto-Save:**
Changes save automatically!`,
    placement: 'left',
    position: 'left',
    category: 'editor',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'notes-editor-title',
    target: '[data-tour="editor-title"]',
    title: '📌 Note Title',
    content: `The note's title:

**Title Tips:**
• Keep it descriptive
• Use action verbs for tasks
• Make it searchable

Example titles:
• "Meeting Notes - Q4 Planning"
• "Project Ideas for 2025"
• "Shopping List"`,
    placement: 'bottom',
    position: 'bottom',
    category: 'editor',
    showProgress: true
  },
  {
    id: 'notes-editor-toolbar',
    target: '[data-tour="editor-toolbar"]',
    title: '🎨 Editor Toolbar',
    content: `Configure note properties:

**Options:**
• **Category**: Assign to folder
• **Priority**: Low → Urgent
• **Type**: Note vs Task

**Priority Levels:**
• 🟢 Low - No rush
• 🟡 Medium - Standard
• 🟠 High - Important
• 🔴 Urgent - Critical`,
    placement: 'bottom',
    position: 'bottom',
    category: 'editor',
    showProgress: true
  },
  {
    id: 'notes-editor-content',
    target: '[data-tour="editor-content"]',
    title: '📝 Content Area',
    content: `Write your note content:

**Features:**
• Free-form text entry
• No character limit
• Preserves formatting

**Tips:**
• Use line breaks for lists
• Keep paragraphs focused
• Add headers for sections`,
    placement: 'left',
    position: 'left',
    category: 'editor',
    showProgress: true
  },
  {
    id: 'notes-editor-tags',
    target: '[data-tour="editor-tags"]',
    title: '#️⃣ Tag Input',
    content: `Add tags to categorize:

**How to Add:**
• Type comma-separated tags
• Press Enter to confirm
• Tags auto-format

**Example:**
\`work, urgent, meeting, q4\`

Tags enable quick filtering later.`,
    placement: 'top',
    position: 'top',
    category: 'editor',
    showProgress: true
  },
  {
    id: 'notes-editor-actions',
    target: '[data-tour="editor-actions"]',
    title: '💾 Editor Actions',
    content: `Manage your note:

**Actions:**
• **Save**: Save changes
• **Delete**: Remove permanently
• **× Close**: Close editor

**Auto-Save:**
If enabled, saves automatically
after each change (configurable).`,
    placement: 'bottom',
    position: 'bottom',
    category: 'editor',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: Kanban Board
  // ============================================================================
  {
    id: 'notes-kanban',
    target: '[data-tour="kanban-board"]',
    title: '📋 Kanban Board',
    content: `Visual task management:

**Kanban Columns:**
• 🟡 **To Do**: Pending tasks
• 🔵 **In Progress**: Active work
• 🟢 **Completed**: Done tasks
• ⚫ **Cancelled**: Dropped tasks

Drag tasks between columns!`,
    placement: 'center',
    position: 'center',
    category: 'kanban',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'notes-kanban-columns',
    target: '[data-tour="kanban-columns"]',
    title: '📊 Kanban Columns',
    content: `Each column represents a status:

**Column Features:**
• Task count indicator
• Color-coded headers
• Drop zone for dragging

**Workflow:**
To Do → In Progress → Completed

Tasks auto-update when moved!`,
    placement: 'bottom',
    position: 'bottom',
    category: 'kanban',
    showProgress: true
  },
  {
    id: 'notes-kanban-cards',
    target: '[data-tour="kanban-card"]',
    title: '🃏 Task Cards',
    content: `Each card shows task details:

**Card Information:**
• Priority indicator (colored dot)
• Task title
• Content preview
• Due date (if set)
• Progress bar (subtasks)
• Tags

**Interactions:**
• Drag to move
• Click to edit`,
    placement: 'right',
    position: 'right',
    category: 'kanban',
    showProgress: true
  },
  {
    id: 'notes-kanban-drag',
    target: '[data-tour="kanban-drag"]',
    title: '✋ Drag & Drop',
    content: `Move tasks visually:

**How to Drag:**
1. Click and hold task card
2. Drag to target column
3. Release to drop

**Status Updates:**
• Moved to "Completed"?
   → Sets completion date
• Moved to "In Progress"?
   → Marks as active

No save needed - instant update!`,
    placement: 'top',
    position: 'top',
    category: 'kanban',
    showProgress: true
  },
  {
    id: 'notes-kanban-progress',
    target: '[data-tour="kanban-progress"]',
    title: '📈 Progress Tracking',
    content: `Track subtask completion:

**Progress Bar:**
Shows completed/total subtasks

**Example:**
█████░░░ 5/8 subtasks

**Subtask Features:**
• Add within task editor
• Check off as completed
• Contributes to progress`,
    placement: 'bottom',
    position: 'bottom',
    category: 'kanban',
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: List & Grid Views
  // ============================================================================
  {
    id: 'notes-list-view',
    target: '[data-tour="notes-list"]',
    title: '☰ List View',
    content: `Traditional list display:

**List Features:**
• Compact single-line items
• Full note preview
• Quick action buttons

**Item Shows:**
• Type icon (📝/✓)
• Pin/favorite status
• Title and preview
• Category badge
• Tags preview
• Last updated date`,
    placement: 'right',
    position: 'right',
    category: 'views',
    showProgress: true
  },
  {
    id: 'notes-grid-view',
    target: '[data-tour="notes-grid"]',
    title: '⊞ Grid View',
    content: `Card-based grid layout:

**Grid Features:**
• Visual card display
• Larger content preview
• Color-coded borders

**Card Shows:**
• Note type and badges
• Priority indicator
• Title and content
• Tags (up to 4)
• Quick actions on hover`,
    placement: 'left',
    position: 'left',
    category: 'views',
    showProgress: true
  },
  {
    id: 'notes-quick-actions',
    target: '[data-tour="note-actions"]',
    title: '⚡ Quick Actions',
    content: `Act on notes quickly:

**Available Actions:**
• 📌 **Pin**: Keep at top
• ⭐ **Favorite**: Mark important
• 📋 **Duplicate**: Copy note
• 📦 **Archive**: Hide note
• 🗑️ **Delete**: Remove permanently

Actions appear on hover/selection.`,
    placement: 'left',
    position: 'left',
    category: 'views',
    showProgress: true
  },

  // ============================================================================
  // SECTION 7: Statistics
  // ============================================================================
  {
    id: 'notes-stats',
    target: '[data-tour="notes-stats"]',
    title: '📊 Notes Statistics',
    content: `Track your productivity:

**Statistics Shown:**
• 📝 Total Notes
• ✓ Active Tasks
• ✅ Completed Tasks
• ⚠️ Overdue Tasks
• 📅 Due Today
• 📆 Due This Week

Toggle with 📊 button in toolbar.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'stats',
    showProgress: true
  },
  {
    id: 'notes-overdue',
    target: '[data-tour="overdue-indicator"]',
    title: '⚠️ Overdue Alerts',
    content: `Track overdue tasks:

**Overdue Indicators:**
• Red highlight on cards
• Warning badge in stats
• Due date shows in red

**Avoid Overdue:**
• Check stats regularly
• Set realistic due dates
• Use reminders`,
    placement: 'right',
    position: 'right',
    category: 'stats',
    showProgress: true
  },

  // ============================================================================
  // SECTION 8: Tour Completion
  // ============================================================================
  {
    id: 'notes-complete',
    target: '[data-tour="notes-module"]',
    title: '✅ Notes Tour Complete!',
    content: `You've mastered CUBE Notes!

**Topics Covered:**
✓ Creating notes and tasks
✓ Using the toolbar
✓ Sidebar navigation
✓ Note editor features
✓ Kanban board workflow
✓ List and Grid views
✓ Quick actions
✓ Statistics dashboard

**Pro Tips:**
• Use Kanban for task workflows
• Tag everything for easy search
• Pin important notes
• Check stats for overdue tasks
• Auto-save keeps work safe

**Quick Reference:**
• Create: + Note/+ Task buttons
• Search: Type in search bar
• Filter: Use sidebar
• Edit: Click any note
• Organize: Drag in Kanban

Stay organized and productive!`,
    placement: 'center',
    position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for Notes
 */
export const notesTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '📝' },
  { id: 'toolbar', title: 'Toolbar', icon: '🛠️' },
  { id: 'sidebar', title: 'Sidebar', icon: '📂' },
  { id: 'editor', title: 'Editor', icon: '✏️' },
  { id: 'kanban', title: 'Kanban', icon: '📋' },
  { id: 'views', title: 'Views', icon: '👁️' },
  { id: 'stats', title: 'Statistics', icon: '📊' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getNotesStepsBySection = (sectionId: string): TourStep[] => {
  return notesTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getNotesRequiredSteps = (): TourStep[] => {
  return notesTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const notesTourConfig = {
  id: 'notes-tour',
  name: 'Notes & Tasks Tour',
  description: 'Master notes and task management with Kanban workflow',
  version: '1.0.0',
  totalSteps: notesTourSteps.length,
  estimatedTime: '6 minutes',
  sections: notesTourSections,
  features: [
    'Notes & tasks',
    'Kanban board',
    'Categories & tags',
    'Multiple views',
    'Auto-save',
    'Statistics dashboard'
  ]
};

export default notesTourSteps;
