/**
 * Download Manager Tour Steps
 * CUBE Elite v7.0.0 - Enterprise Download Manager
 * 
 * Comprehensive guided tour for download management features
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for Download Manager module
 * Covers: Downloads, Filters, Stats, Settings, Bandwidth
 */
export const downloadTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'download-welcome',
    target: '[data-tour="download-module"]',
    title: '📥 Download Manager',
    content: `Welcome to CUBE's enterprise download manager!

**Key Features:**
• Multi-threaded downloads
• Pause & resume support
• Bandwidth limiting
• Schedule-based limits
• Category organization
• Progress tracking

Professional download management at scale.`,
    placement: 'center',
    position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Add Download
  // ============================================================================
  {
    id: 'download-add',
    target: '[data-tour="add-download-btn"]',
    title: '➕ Add Download',
    content: `Start a new download:

**Quick Add:**
• Paste URL directly
• Click + Add button
• Ctrl+V to paste

**Supported Protocols:**
• HTTP/HTTPS
• FTP/FTPS

**Auto Detection:**
• File type categorization
• Size estimation
• Filename extraction`,
    placement: 'bottom',
    position: 'bottom',
    category: 'add',
    isRequired: true,
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'download-url-input',
    target: '[data-tour="url-input"]',
    title: '🔗 URL Input',
    content: `Enter the download URL:

**Supported Formats:**
• https://example.com/file.zip
• http://server.com/document.pdf
• ftp://files.com/archive.tar.gz

**Paste Button:**
Click 📋 to paste from clipboard.

**Validation:**
URL is validated before starting.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'add',
    showProgress: true
  },
  {
    id: 'download-destination',
    target: '[data-tour="destination-input"]',
    title: '📁 Destination',
    content: `Choose where to save:

**Options:**
• ✅ Use default destination
• 📁 Choose custom folder

**Default Location:**
Set in Settings → General

**Organization:**
Files auto-categorized by type.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'add',
    showProgress: true
  },

  // ============================================================================
  // SECTION 3: Download List
  // ============================================================================
  {
    id: 'download-list',
    target: '[data-tour="download-list"]',
    title: '📋 Download List',
    content: `View all your downloads:

**List Columns:**
• **Name**: File name & URL
• **Size**: Downloaded/Total
• **Progress**: Visual progress bar
• **Speed**: Current speed & ETA
• **Status**: Current state
• **Actions**: Control buttons

Click column headers to sort.`,
    placement: 'top',
    position: 'top',
    category: 'list',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'download-item',
    target: '[data-tour="download-item"]',
    title: '📄 Download Item',
    content: `Each download shows:

**File Information:**
• 🎵 Category icon (type)
• Filename
• Source URL (truncated)

**Progress:**
• Visual bar with color
• Percentage complete
• Bytes transferred

**Speed & ETA:**
• Current speed (MB/s)
• Estimated time remaining`,
    placement: 'right',
    position: 'right',
    category: 'list',
    showProgress: true
  },
  {
    id: 'download-status',
    target: '[data-tour="status-badge"]',
    title: '🏷️ Download Status',
    content: `Status indicators:

**Statuses:**
• ⏳ **Pending**: Waiting to start
• ⬇️ **Downloading**: Active
• ⏸️ **Paused**: Temporarily stopped
• ✅ **Completed**: Done
• ❌ **Failed**: Error occurred
• 🚫 **Cancelled**: Manually stopped

Colors help quick identification.`,
    placement: 'left',
    position: 'left',
    category: 'list',
    showProgress: true
  },
  {
    id: 'download-actions',
    target: '[data-tour="item-actions"]',
    title: '🎮 Item Actions',
    content: `Control each download:

**During Download:**
• ⏸️ **Pause**: Temporarily stop
• ⏹️ **Cancel**: Stop permanently

**When Paused:**
• ▶️ **Resume**: Continue download

**When Failed:**
• 🔄 **Retry**: Try again

**Any State:**
• 🗑️ **Remove**: Delete from list`,
    placement: 'left',
    position: 'left',
    category: 'list',
    showProgress: true
  },
  {
    id: 'download-sort',
    target: '[data-tour="sort-headers"]',
    title: '↕️ Sorting',
    content: `Sort downloads by column:

**Sortable Columns:**
• Name (alphabetical)
• Size (largest/smallest)
• Progress (%)
• Speed (fastest/slowest)
• Status (grouping)

**Toggle Direction:**
Click column again to reverse.

Arrow shows current sort direction.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'list',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: Filters
  // ============================================================================
  {
    id: 'download-filter',
    target: '[data-tour="filter-btn"]',
    title: '🔍 Filter Downloads',
    content: `Filter your download list:

**Filter Options:**
• By status (downloading, completed...)
• By category (video, document...)
• By search text

**Quick Filters:**
Access common filters quickly.

Click 🔍 to open filter panel.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'filter',
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'download-filter-status',
    target: '[data-tour="filter-status"]',
    title: '📊 Status Filters',
    content: `Filter by download status:

**Available Filters:**
• ⏳ Pending
• ⬇️ Downloading
• ⏸️ Paused
• ✅ Completed
• ❌ Failed
• 🚫 Cancelled

Select multiple for combined filter.`,
    placement: 'right',
    position: 'right',
    category: 'filter',
    showProgress: true
  },
  {
    id: 'download-filter-category',
    target: '[data-tour="filter-category"]',
    title: '📁 Category Filters',
    content: `Filter by file type:

**Categories:**
• 📄 Documents (PDF, DOC...)
• 🖼️ Images (JPG, PNG...)
• 🎬 Videos (MP4, AVI...)
• 🎵 Audio (MP3, WAV...)
• 📦 Archives (ZIP, RAR...)
• 💿 Software (EXE, DMG...)
• 📎 Other

Multi-select supported.`,
    placement: 'right',
    position: 'right',
    category: 'filter',
    showProgress: true
  },
  {
    id: 'download-filter-search',
    target: '[data-tour="filter-search"]',
    title: '🔎 Search Filter',
    content: `Search by text:

**Searches In:**
• Filename
• URL

**Tips:**
• Use partial matches
• Case insensitive
• Combine with other filters

Find downloads quickly!`,
    placement: 'right',
    position: 'right',
    category: 'filter',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: Statistics
  // ============================================================================
  {
    id: 'download-stats',
    target: '[data-tour="download-stats"]',
    title: '📊 Download Statistics',
    content: `Monitor your downloads:

**Statistics Shown:**
• 📊 Total Downloads
• ⬇️ Active Downloads
• ✅ Completed
• ❌ Failed
• 🚀 Current Speed
• 💾 Total Downloaded

Real-time updates as you download.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'stats',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'download-speed',
    target: '[data-tour="speed-stat"]',
    title: '🚀 Speed Monitor',
    content: `Track download speed:

**Speed Display:**
• Current aggregate speed
• MB/s or KB/s format

**Bandwidth Usage:**
• Progress bar if limit set
• Percentage of limit used

**Speed Optimization:**
• Limit background downloads
• Use wired connection
• Prioritize important files`,
    placement: 'bottom',
    position: 'bottom',
    category: 'stats',
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: Settings
  // ============================================================================
  {
    id: 'download-settings',
    target: '[data-tour="settings-btn"]',
    title: '⚙️ Download Settings',
    content: `Configure download manager:

**Setting Categories:**
• **General**: Paths, limits
• **Bandwidth**: Speed limits

Click ⚙️ to open settings.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'settings',
    isRequired: true,
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'download-settings-general',
    target: '[data-tour="settings-general"]',
    title: '📋 General Settings',
    content: `Basic configuration:

**Options:**
• **Max Concurrent**: How many downloads at once (1-10)
• **Default Location**: Where files save
• **Auto-Start**: Start downloads immediately
• **Show Notifications**: Alert on complete

Balance speed vs. system resources.`,
    placement: 'left',
    position: 'left',
    category: 'settings',
    showProgress: true
  },
  {
    id: 'download-settings-bandwidth',
    target: '[data-tour="settings-bandwidth"]',
    title: '📡 Bandwidth Settings',
    content: `Control download speed:

**Global Limit:**
• Enable/disable limiting
• Set max speed (MB/s)

**Why Limit?**
• Prevent network saturation
• Allow other activities
• Schedule for off-hours

Leave unrestricted for fastest downloads.`,
    placement: 'left',
    position: 'left',
    category: 'settings',
    showProgress: true
  },
  {
    id: 'download-schedule',
    target: '[data-tour="bandwidth-schedule"]',
    title: '📅 Bandwidth Schedule',
    content: `Schedule-based limits:

**Schedule Features:**
• Different limits by time
• Day-of-week settings
• Multiple schedules

**Example Use:**
• Full speed nights (off-hours)
• Limited during work (9-5)
• Unlimited weekends

Smart bandwidth management!`,
    placement: 'left',
    position: 'left',
    category: 'settings',
    showProgress: true
  },

  // ============================================================================
  // SECTION 7: Tour Completion
  // ============================================================================
  {
    id: 'download-complete',
    target: '[data-tour="download-module"]',
    title: '✅ Download Manager Tour Complete!',
    content: `You've mastered CUBE Downloads!

**Topics Covered:**
✓ Adding new downloads
✓ Managing download list
✓ Using filters effectively
✓ Monitoring statistics
✓ Configuring settings
✓ Bandwidth scheduling

**Pro Tips:**
• Use filters to find downloads
• Set bandwidth limits for shared networks
• Schedule heavy downloads off-hours
• Monitor stats for bottlenecks
• Pause/resume for priority changes

**Quick Reference:**
• Add: + button or paste URL
• Pause: ⏸️ on active download
• Filter: 🔍 button
• Settings: ⚙️ button

Download with confidence!`,
    placement: 'center',
    position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for Download Manager
 */
export const downloadTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '📥' },
  { id: 'add', title: 'Add Download', icon: '➕' },
  { id: 'list', title: 'Download List', icon: '📋' },
  { id: 'filter', title: 'Filters', icon: '🔍' },
  { id: 'stats', title: 'Statistics', icon: '📊' },
  { id: 'settings', title: 'Settings', icon: '⚙️' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getDownloadStepsBySection = (sectionId: string): TourStep[] => {
  return downloadTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getDownloadRequiredSteps = (): TourStep[] => {
  return downloadTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const downloadTourConfig = {
  id: 'download-tour',
  name: 'Download Manager Tour',
  description: 'Master enterprise download management with bandwidth control',
  version: '1.0.0',
  totalSteps: downloadTourSteps.length,
  estimatedTime: '5 minutes',
  sections: downloadTourSections,
  features: [
    'Multi-threaded downloads',
    'Pause & resume',
    'Bandwidth limiting',
    'Schedule-based limits',
    'Category organization',
    'Progress tracking'
  ]
};

export default downloadTourSteps;
