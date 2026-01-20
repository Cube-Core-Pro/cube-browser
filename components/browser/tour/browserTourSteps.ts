/**
 * Browser Elite Tour Steps - CUBE Nexum
 * 
 * Comprehensive guided tour for the Arc-like browser with:
 * - Spaces and tab organization
 * - Proxy-based full site access
 * - DevTools integration
 * - Privacy features (ad/tracker blocking)
 * - Split view and sharing
 * 
 * Total: 6 sections, ~28 steps, ~30 minutes
 */

import { TourStep, TourSection } from '../../tour/types';

// ============================================
// Section 1: Welcome & Overview
// ============================================

export const welcomeSteps: TourStep[] = [
  {
    id: 'browser-welcome',
    title: 'Welcome to CUBE Nexum',
    content: `
      <p>This is a full-featured browser built into CUBE Nexum with:</p>
      <ul>
        <li><strong>Spaces</strong> - Organize tabs by context (Work, Personal, Projects)</li>
        <li><strong>CUBE Proxy</strong> - Access ANY website without restrictions</li>
        <li><strong>DevTools</strong> - Built-in developer tools for debugging</li>
        <li><strong>Privacy</strong> - Block ads and trackers automatically</li>
        <li><strong>CUBE Integration</strong> - Use all CUBE tools on any page</li>
      </ul>
      <p>Let's explore each feature!</p>
    `,
    category: 'welcome',
    targetSelector: '.browser-elite-container',
    position: 'center',
    highlightType: 'none',
  },
  {
    id: 'browser-layout',
    title: 'Browser Layout',
    content: `
      <p>The browser has three main areas:</p>
      <ul>
        <li><strong>Sidebar (left)</strong> - Profiles, Spaces, and Tabs</li>
        <li><strong>Toolbar (top)</strong> - Navigation, URL bar, and actions</li>
        <li><strong>Content (center)</strong> - The web page you're viewing</li>
      </ul>
      <p>The sidebar can be toggled for more screen space.</p>
    `,
    category: 'welcome',
    targetSelector: '[data-tour="browser-layout"]',
    position: 'bottom',
    highlightType: 'border',
  },
];

// ============================================
// Section 2: Profiles & Spaces
// ============================================

export const profilesSpacesSteps: TourStep[] = [
  {
    id: 'browser-profiles',
    title: 'Browser Profiles',
    content: `
      <p>Profiles keep your browsing completely separate:</p>
      <ul>
        <li><strong>Personal</strong> - Your personal browsing</li>
        <li><strong>Work</strong> - Professional activities</li>
        <li><strong>Custom</strong> - Create profiles for any purpose</li>
      </ul>
      <p>Each profile has its own cookies, history, and settings.</p>
      <p>Click the profile selector to switch profiles.</p>
    `,
    category: 'organization',
    targetSelector: '[data-tour="profile-selector"]',
    position: 'right',
    highlightType: 'spotlight',
  },
  {
    id: 'browser-spaces',
    title: 'Spaces - Tab Groups',
    content: `
      <p>Spaces are like folders for your tabs:</p>
      <ul>
        <li><strong>🏠 Home</strong> - Default space for general browsing</li>
        <li><strong>💼 Work</strong> - Professional tabs</li>
        <li><strong>Create new</strong> - Add spaces for projects, research, etc.</li>
      </ul>
      <p>Spaces help you stay organized and focused.</p>
    `,
    category: 'organization',
    targetSelector: '[data-tour="spaces-list"]',
    position: 'right',
    highlightType: 'pulse',
  },
  {
    id: 'browser-new-space',
    title: 'Create New Space',
    content: `
      <p>Click the <strong>+</strong> button to create a new space.</p>
      <p>Each space gets:</p>
      <ul>
        <li>A unique icon and color</li>
        <li>Its own set of tabs</li>
        <li>Independent from other spaces</li>
      </ul>
      <p>Perfect for organizing different projects or contexts.</p>
    `,
    category: 'organization',
    targetSelector: '[data-tour="new-space-btn"]',
    position: 'right',
    highlightType: 'pulse',
    action: {
      type: 'click',
      label: 'Create New Space',
    },
  },
];

// ============================================
// Section 3: Tab Management
// ============================================

export const tabManagementSteps: TourStep[] = [
  {
    id: 'browser-tabs-sidebar',
    title: 'Tab List',
    content: `
      <p>Your tabs appear in the sidebar, organized by space.</p>
      <p>Each tab shows:</p>
      <ul>
        <li><strong>Favicon</strong> - Site icon for quick identification</li>
        <li><strong>Title</strong> - Page title (truncated if long)</li>
        <li><strong>Status</strong> - Loading spinner, muted icon, etc.</li>
      </ul>
      <p>Hover to see close and mute buttons.</p>
    `,
    category: 'management',
    targetSelector: '[data-tour="tabs-list"]',
    position: 'right',
    highlightType: 'border',
  },
  {
    id: 'browser-pinned-tabs',
    title: 'Pinned Tabs',
    content: `
      <p>Pin important tabs to keep them always accessible:</p>
      <ul>
        <li>Pinned tabs appear at the top as small icons</li>
        <li>They stay open even when closing other tabs</li>
        <li>Great for email, calendar, or frequently used apps</li>
      </ul>
      <p>Click the star icon in the toolbar to pin the current tab.</p>
    `,
    category: 'management',
    targetSelector: '[data-tour="pinned-tabs"]',
    position: 'right',
    highlightType: 'spotlight',
  },
  {
    id: 'browser-tab-bar',
    title: 'Tab Bar',
    content: `
      <p>The compact tab bar shows all tabs in the current space.</p>
      <p>Features:</p>
      <ul>
        <li>Click to switch tabs</li>
        <li>Hover to see close button</li>
        <li><strong>+</strong> button to open new tab</li>
      </ul>
      <p>Scrollable when you have many tabs.</p>
    `,
    category: 'management',
    targetSelector: '[data-tour="tab-bar"]',
    position: 'bottom',
    highlightType: 'border',
  },
  {
    id: 'browser-new-tab',
    title: 'New Tab Page',
    content: `
      <p>New tabs show a quick access page with:</p>
      <ul>
        <li><strong>CUBE Tools</strong> - Quick access to all features</li>
        <li><strong>Quick Links</strong> - Popular sites to get started</li>
        <li><strong>Search</strong> - Type in URL bar to search</li>
      </ul>
      <p>Press <kbd>Ctrl/Cmd + T</kbd> to open a new tab.</p>
    `,
    category: 'management',
    targetSelector: '[data-tour="new-tab-content"]',
    position: 'center',
    highlightType: 'none',
  },
];

// ============================================
// Section 4: Navigation & Tools
// ============================================

export const navigationToolsSteps: TourStep[] = [
  {
    id: 'browser-navigation',
    title: 'Navigation Controls',
    content: `
      <p>Standard browser navigation:</p>
      <ul>
        <li><strong>←</strong> - Go back</li>
        <li><strong>→</strong> - Go forward</li>
        <li><strong>↻</strong> - Reload page</li>
        <li><strong>🏠</strong> - Go to home (Google)</li>
      </ul>
      <p>Keyboard shortcuts: <kbd>Alt + ←/→</kbd> for back/forward.</p>
    `,
    category: 'toolbar',
    targetSelector: '[data-tour="nav-controls"]',
    position: 'bottom',
    highlightType: 'border',
  },
  {
    id: 'browser-url-bar',
    title: 'Smart URL Bar',
    content: `
      <p>The URL bar is your command center:</p>
      <ul>
        <li><strong>Type a URL</strong> - Navigate directly</li>
        <li><strong>Search terms</strong> - Searches Google automatically</li>
        <li><strong>🔒 icon</strong> - Shows HTTPS security status</li>
      </ul>
      <p>Press <kbd>Ctrl/Cmd + L</kbd> to focus the URL bar.</p>
    `,
    category: 'toolbar',
    targetSelector: '[data-tour="url-bar"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
  {
    id: 'browser-split-view',
    title: 'Split View',
    content: `
      <p>View two pages side by side:</p>
      <ol>
        <li>Click the split view button</li>
        <li>Select a tab for the second pane</li>
        <li>Drag the divider to resize</li>
      </ol>
      <p>Great for comparing pages or multitasking.</p>
    `,
    category: 'toolbar',
    targetSelector: '[data-tour="split-view-btn"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
  {
    id: 'browser-share',
    title: 'Share Page',
    content: `
      <p>Share any page via:</p>
      <ul>
        <li><strong>Copy link</strong> - Quick clipboard copy</li>
        <li><strong>Email</strong> - Open email with link</li>
        <li><strong>WhatsApp</strong> - Send via WhatsApp</li>
        <li><strong>QR Code</strong> - Generate scannable code</li>
      </ul>
      <p>Click the share icon to see options.</p>
    `,
    category: 'toolbar',
    targetSelector: '[data-tour="share-btn"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
  {
    id: 'browser-cube-tools',
    title: 'CUBE Tools Integration',
    content: `
      <p>Access all CUBE features from the browser:</p>
      <ul>
        <li><strong>Auto-Fill</strong> - Smart form filling</li>
        <li><strong>Passwords</strong> - Password manager</li>
        <li><strong>Data Extractor</strong> - Extract page data</li>
        <li><strong>Automation</strong> - Create macros</li>
        <li><strong>AI Assistant</strong> - AI-powered help</li>
      </ul>
      <p>Click "CUBE Tools" in the sidebar or menu.</p>
    `,
    category: 'toolbar',
    targetSelector: '[data-tour="cube-tools-btn"]',
    position: 'right',
    highlightType: 'spotlight',
  },
];

// ============================================
// Section 5: Privacy & Security
// ============================================

export const privacySecuritySteps: TourStep[] = [
  {
    id: 'browser-proxy',
    title: 'CUBE Proxy Engine',
    content: `
      <p>The CUBE Proxy allows access to ANY website:</p>
      <ul>
        <li><strong>No restrictions</strong> - Bypass iframe blocking</li>
        <li><strong>Full functionality</strong> - JavaScript, forms, login</li>
        <li><strong>Local proxy</strong> - Runs on your machine</li>
      </ul>
      <p>When enabled, you'll see "🟢 Proxy Active" in the menu.</p>
    `,
    category: 'security',
    targetSelector: '[data-tour="browser-engine-menu"]',
    position: 'left',
    highlightType: 'spotlight',
  },
  {
    id: 'browser-ad-blocker',
    title: 'Ad Blocker',
    content: `
      <p>Block intrusive ads automatically:</p>
      <ul>
        <li>Removes banner ads</li>
        <li>Blocks popup ads</li>
        <li>Counter shows blocked items</li>
      </ul>
      <p>Toggle in Privacy menu or click the shield icon.</p>
    `,
    category: 'security',
    targetSelector: '[data-tour="ad-block-badge"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
  {
    id: 'browser-tracker-blocker',
    title: 'Tracker Blocker',
    content: `
      <p>Protect your privacy by blocking trackers:</p>
      <ul>
        <li>Stops analytics scripts</li>
        <li>Blocks social media trackers</li>
        <li>Prevents fingerprinting</li>
      </ul>
      <p>Enable in the Privacy submenu.</p>
    `,
    category: 'security',
    targetSelector: '[data-tour="privacy-menu"]',
    position: 'left',
    highlightType: 'border',
  },
  {
    id: 'browser-reading-mode',
    title: 'Reading Mode',
    content: `
      <p>Clean, distraction-free reading:</p>
      <ul>
        <li>Removes ads and sidebars</li>
        <li>Focuses on article content</li>
        <li>Customizable font and size</li>
      </ul>
      <p>Click the book icon to toggle reading mode.</p>
    `,
    category: 'security',
    targetSelector: '[data-tour="reading-mode-btn"]',
    position: 'bottom',
    highlightType: 'pulse',
  },
];

// ============================================
// Section 6: DevTools
// ============================================

export const devToolsSteps: TourStep[] = [
  {
    id: 'browser-devtools-intro',
    title: 'CUBE DevTools',
    content: `
      <p>Built-in developer tools for debugging:</p>
      <ul>
        <li><strong>DOM Inspector</strong> - View page structure</li>
        <li><strong>Console</strong> - JavaScript logs and commands</li>
        <li><strong>Network</strong> - Monitor requests</li>
        <li><strong>Performance</strong> - Analyze page speed</li>
      </ul>
      <p>Press <kbd>F12</kbd> or <kbd>Ctrl/Cmd + Shift + I</kbd> to toggle.</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="devtools-btn"]',
    position: 'bottom',
    highlightType: 'spotlight',
  },
  {
    id: 'browser-devtools-dom',
    title: 'DOM Inspector',
    content: `
      <p>Explore the page structure:</p>
      <ul>
        <li>View HTML elements tree</li>
        <li>See element attributes</li>
        <li>Highlight elements on page</li>
        <li>Copy selectors for automation</li>
      </ul>
      <p>Essential for data extraction and automation.</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="devtools-dom"]',
    position: 'left',
    highlightType: 'border',
  },
  {
    id: 'browser-devtools-console',
    title: 'Console',
    content: `
      <p>Execute JavaScript and view logs:</p>
      <ul>
        <li>See console.log outputs</li>
        <li>View errors and warnings</li>
        <li>Execute JavaScript commands</li>
        <li>Test selectors and code</li>
      </ul>
      <p>Great for debugging and testing.</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="devtools-console"]',
    position: 'left',
    highlightType: 'border',
  },
  {
    id: 'browser-devtools-network',
    title: 'Network Monitor',
    content: `
      <p>Track all network requests:</p>
      <ul>
        <li>See fetch and XHR requests</li>
        <li>View request/response details</li>
        <li>Monitor API calls</li>
        <li>Analyze loading performance</li>
      </ul>
      <p>Useful for understanding how pages load data.</p>
    `,
    category: 'advanced',
    targetSelector: '[data-tour="devtools-network"]',
    position: 'left',
    highlightType: 'border',
  },
  {
    id: 'browser-shortcuts',
    title: 'Keyboard Shortcuts',
    content: `
      <p>Speed up your workflow:</p>
      <table style="width:100%; font-size: 0.9em;">
        <tr><td><kbd>Ctrl/Cmd + T</kbd></td><td>New Tab</td></tr>
        <tr><td><kbd>Ctrl/Cmd + W</kbd></td><td>Close Tab</td></tr>
        <tr><td><kbd>Ctrl/Cmd + L</kbd></td><td>Focus URL Bar</td></tr>
        <tr><td><kbd>F12</kbd></td><td>Toggle DevTools</td></tr>
        <tr><td><kbd>Alt + ←/→</kbd></td><td>Back/Forward</td></tr>
      </table>
    `,
    category: 'tips',
    targetSelector: '[data-tour="browser-content"]',
    position: 'center',
    highlightType: 'none',
  },
  {
    id: 'browser-complete',
    title: '🎉 Browser Tour Complete!',
    content: `
      <p>You've mastered CUBE Nexum!</p>
      <p><strong>Key takeaways:</strong></p>
      <ul>
        <li>Use Spaces to organize tabs by context</li>
        <li>CUBE Proxy enables access to any site</li>
        <li>DevTools help with debugging and extraction</li>
        <li>Privacy features protect your browsing</li>
        <li>CUBE Tools integrate seamlessly</li>
      </ul>
      <p>Happy browsing! 🚀</p>
    `,
    category: 'welcome',
    targetSelector: '[data-tour="browser-layout"]',
    position: 'center',
    highlightType: 'glow',
  },
];

// ============================================
// Export All Steps
// ============================================

export const allBrowserTourSteps: TourStep[] = [
  ...welcomeSteps,
  ...profilesSpacesSteps,
  ...tabManagementSteps,
  ...navigationToolsSteps,
  ...privacySecuritySteps,
  ...devToolsSteps,
];

export const allBrowserTourSections: TourSection[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Introduction to CUBE Nexum',
    steps: welcomeSteps,
    icon: '👋',
    category: 'welcome',
    estimatedMinutes: 3,
    difficulty: 'beginner',
  },
  {
    id: 'profiles-spaces',
    title: 'Profiles & Spaces',
    description: 'Organize your browsing with profiles and spaces',
    steps: profilesSpacesSteps,
    icon: '📁',
    category: 'organization',
    estimatedMinutes: 5,
    difficulty: 'beginner',
  },
  {
    id: 'tabs',
    title: 'Tab Management',
    description: 'Manage tabs effectively',
    steps: tabManagementSteps,
    icon: '📑',
    category: 'management',
    estimatedMinutes: 5,
    difficulty: 'beginner',
  },
  {
    id: 'navigation-tools',
    title: 'Navigation & Tools',
    description: 'Navigate and use CUBE tools',
    steps: navigationToolsSteps,
    icon: '🧭',
    category: 'toolbar',
    estimatedMinutes: 6,
    difficulty: 'beginner',
  },
  {
    id: 'privacy-security',
    title: 'Privacy & Security',
    description: 'Protect your browsing',
    steps: privacySecuritySteps,
    icon: '🛡️',
    category: 'security',
    estimatedMinutes: 5,
    difficulty: 'intermediate',
  },
  {
    id: 'devtools',
    title: 'DevTools',
    description: 'Built-in developer tools',
    steps: devToolsSteps,
    icon: '🔧',
    category: 'advanced',
    estimatedMinutes: 6,
    difficulty: 'advanced',
  },
];

// ============================================
// Tour Statistics
// ============================================

export const browserTourStats = {
  totalSteps: allBrowserTourSteps.length,
  totalSections: allBrowserTourSections.length,
  estimatedMinutes: allBrowserTourSections.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0),
  features: [
    'Spaces for tab organization',
    'Profile switching',
    'CUBE Proxy for full site access',
    'Ad and tracker blocking',
    'Built-in DevTools',
    'Split view',
    'Page sharing (QR, email, WhatsApp)',
    'CUBE tools integration',
    'Keyboard shortcuts',
    'Reading mode',
  ],
};
