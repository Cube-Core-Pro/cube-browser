/**
 * CUBE Elite v6 - Browser Services Index
 * 
 * Unified export of all browser enhancement services competing with:
 * Opera GX, Opera One, Arc, Vivaldi, Brave, Edge, Firefox, SigmaOS, Safari
 * 
 * This module provides a complete elite browser feature set including:
 * 
 * FROM advanced-browser-service.ts:
 * - ResourceLimiter (CPU/RAM/Network) - Opera GX
 * - TabIslands (visual grouping) - Opera One
 * - Containers (isolation) - Firefox
 * - SleepingTabs - Edge
 * - SnoozeTabs - SigmaOS
 * - CommandBar - Arc
 * - MouseGestures - Vivaldi
 * - SessionManager - Vivaldi
 * 
 * FROM browser-boosts-service.ts:
 * - Boosts (custom CSS/JS) - Arc
 * - Collections (web clipping) - Edge
 * - BrowserNotes - Vivaldi
 * - ReadingList - Safari
 * - LinkPreview - SigmaOS
 * 
 * FROM browser-enhancements-service.ts:
 * - PiP Manager
 * - WebPanels - Vivaldi
 * - TabStacks - Vivaldi
 * - ReaderMode - Brave
 * - Workspaces - Arc
 * - SpeedDial - Opera
 * 
 * @module browser-services
 * @version 1.0.0
 */

// ============================================================================
// Re-exports from advanced-browser-service
// ============================================================================

export {
  // Services
  ResourceLimiterService,
  TabIslandService,
  ContainerService,
  SleepingTabsService,
  SnoozeTabsService,
  CommandBarService,
  MouseGesturesService,
  SessionManagerService,
  
  // Hook
  useAdvancedBrowser,
  
  // Constants
  DEFAULT_LIMITS,
  DEFAULT_CONTAINERS,
  DEFAULT_GESTURES,
  SNOOZE_PRESETS,
  
  // Types
  type ResourceLimits,
  type ResourceUsage,
  type TabIsland,
  type BrowserContainer,
  type SleepingTab,
  type SnoozedTab,
  type CommandResult,
  type MouseGesture,
  type GestureAction,
  type BrowserSession,
  type SessionWindow,
  type SessionTab,
} from './advanced-browser-service';

// ============================================================================
// Re-exports from browser-boosts-service
// ============================================================================

export {
  // Services
  BoostsService,
  CollectionsService,
  BrowserNotesService,
  ReadingListService,
  LinkPreviewService,
  
  // Hook
  useBrowserBoosts,
  
  // Constants
  BOOST_TEMPLATES,
  COLLECTION_COLORS,
  
  // Types
  type Boost,
  type BoostTemplate,
  type Collection,
  type CollectionItem,
  type CollectionItemType,
  type Annotation,
  type BrowserNote,
  type ReadingListItem,
  type LinkPreview,
  type SiteTheme,
} from './browser-boosts-service';

// ============================================================================
// Re-exports from browser-enhancements-service
// ============================================================================

export {
  // Services
  PiPService,
  WebPanelsService,
  TabStacksService,
  ReaderModeService,
  WorkspacesService,
  SpeedDialService,
  
  // Hook
  useBrowserEnhancements,
  
  // Constants
  DEFAULT_READER_SETTINGS,
  READER_THEMES,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS,
  
  // Types
  type PiPWindow,
  type PiPPresetPosition,
  type WebPanel,
  type TabStack,
  type ReaderModeSettings,
  type ReaderArticle,
  type SplitView,
  type SplitPane,
  type Workspace,
  type WorkspaceTab,
  type FlowItem,
  type SpeedDialItem,
  type SpeedDialFolder,
  type PageAction,
} from './browser-enhancements-service';

// ============================================================================
// Combined Types
// ============================================================================

import { useCallback, useState, useEffect } from 'react';
import { useAdvancedBrowser } from './advanced-browser-service';
import { useBrowserBoosts } from './browser-boosts-service';
import { useBrowserEnhancements } from './browser-enhancements-service';

/**
 * All browser feature categories
 */
export type BrowserFeatureCategory = 
  | 'resource-management'
  | 'tab-organization'
  | 'privacy-security'
  | 'productivity'
  | 'customization'
  | 'media'
  | 'sync';

/**
 * Feature info for UI display
 */
export interface BrowserFeatureInfo {
  id: string;
  name: string;
  description: string;
  category: BrowserFeatureCategory;
  source: 'Opera GX' | 'Opera One' | 'Arc' | 'Vivaldi' | 'Brave' | 'Edge' | 'Firefox' | 'SigmaOS' | 'Safari' | 'Original';
  icon: string;
  isEnabled: boolean;
}

/**
 * Complete list of browser features
 */
export const BROWSER_FEATURES: BrowserFeatureInfo[] = [
  // Resource Management
  {
    id: 'resource-limiter',
    name: 'Resource Limiter',
    description: 'Limit CPU, RAM, and network usage per tab',
    category: 'resource-management',
    source: 'Opera GX',
    icon: '⚡',
    isEnabled: true,
  },
  {
    id: 'sleeping-tabs',
    name: 'Sleeping Tabs',
    description: 'Automatically hibernate inactive tabs to save memory',
    category: 'resource-management',
    source: 'Edge',
    icon: '😴',
    isEnabled: true,
  },
  
  // Tab Organization
  {
    id: 'tab-islands',
    name: 'Tab Islands',
    description: 'Visual tab grouping with automatic domain clustering',
    category: 'tab-organization',
    source: 'Opera One',
    icon: '🏝️',
    isEnabled: true,
  },
  {
    id: 'tab-stacks',
    name: 'Tab Stacks',
    description: 'Vertical tab groups with collapse support',
    category: 'tab-organization',
    source: 'Vivaldi',
    icon: '📚',
    isEnabled: true,
  },
  {
    id: 'snooze-tabs',
    name: 'Snooze Tabs',
    description: 'Schedule tabs to reopen later',
    category: 'tab-organization',
    source: 'SigmaOS',
    icon: '⏰',
    isEnabled: true,
  },
  {
    id: 'workspaces',
    name: 'Workspaces',
    description: 'Separate browser contexts for different activities',
    category: 'tab-organization',
    source: 'Arc',
    icon: '📂',
    isEnabled: true,
  },
  
  // Privacy & Security
  {
    id: 'containers',
    name: 'Container Tabs',
    description: 'Isolated browsing contexts for different accounts',
    category: 'privacy-security',
    source: 'Firefox',
    icon: '🔒',
    isEnabled: true,
  },
  
  // Productivity
  {
    id: 'command-bar',
    name: 'Command Bar',
    description: 'Universal search and quick actions',
    category: 'productivity',
    source: 'Arc',
    icon: '⌘',
    isEnabled: true,
  },
  {
    id: 'mouse-gestures',
    name: 'Mouse Gestures',
    description: 'Navigate with mouse movements',
    category: 'productivity',
    source: 'Vivaldi',
    icon: '🖱️',
    isEnabled: true,
  },
  {
    id: 'web-panels',
    name: 'Web Panels',
    description: 'Sidebar panels for quick access to sites',
    category: 'productivity',
    source: 'Vivaldi',
    icon: '📱',
    isEnabled: true,
  },
  {
    id: 'speed-dial',
    name: 'Speed Dial',
    description: 'Visual bookmarks on new tab page',
    category: 'productivity',
    source: 'Opera GX',
    icon: '🚀',
    isEnabled: true,
  },
  {
    id: 'reading-list',
    name: 'Reading List',
    description: 'Save articles for later with offline support',
    category: 'productivity',
    source: 'Safari',
    icon: '📖',
    isEnabled: true,
  },
  {
    id: 'collections',
    name: 'Collections',
    description: 'Organize web content and notes',
    category: 'productivity',
    source: 'Edge',
    icon: '📋',
    isEnabled: true,
  },
  {
    id: 'notes',
    name: 'Browser Notes',
    description: 'Take notes with page screenshots',
    category: 'productivity',
    source: 'Vivaldi',
    icon: '📝',
    isEnabled: true,
  },
  {
    id: 'link-preview',
    name: 'Link Preview',
    description: 'Preview links on hover',
    category: 'productivity',
    source: 'SigmaOS',
    icon: '👁️',
    isEnabled: true,
  },
  
  // Customization
  {
    id: 'boosts',
    name: 'Boosts',
    description: 'Custom CSS/JS per website',
    category: 'customization',
    source: 'Arc',
    icon: '🎨',
    isEnabled: true,
  },
  {
    id: 'reader-mode',
    name: 'Reader Mode',
    description: 'Distraction-free reading experience',
    category: 'customization',
    source: 'Brave',
    icon: '📄',
    isEnabled: true,
  },
  
  // Media
  {
    id: 'pip-manager',
    name: 'Picture-in-Picture',
    description: 'Floating video player',
    category: 'media',
    source: 'Original',
    icon: '🎬',
    isEnabled: true,
  },
  
  // Sync
  {
    id: 'session-manager',
    name: 'Session Manager',
    description: 'Save and restore browsing sessions',
    category: 'sync',
    source: 'Vivaldi',
    icon: '💾',
    isEnabled: true,
  },
];

// ============================================================================
// Combined Hook
// ============================================================================

/**
 * Combined hook providing access to all browser services
 */
export function useBrowserServices() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize all hooks
  const advanced = useAdvancedBrowser();
  const boosts = useBrowserBoosts();
  const enhancements = useBrowserEnhancements();

  // Track loading state - services are ready when all refs are initialized
  useEffect(() => {
    // Check if services are initialized by verifying refs exist
    const advancedReady = advanced.services.resourceLimiter !== null;
    const boostsReady = boosts.services.boosts !== null;
    const enhancementsReady = enhancements.services.pip !== null;
    
    if (advancedReady && boostsReady && enhancementsReady) {
      setIsInitialized(true);
    }
  }, [advanced.services, boosts.services, enhancements.services]);

  // Get feature by ID
  const getFeature = useCallback((id: string): BrowserFeatureInfo | undefined => {
    return BROWSER_FEATURES.find(f => f.id === id);
  }, []);

  // Get features by category
  const getFeaturesByCategory = useCallback((category: BrowserFeatureCategory): BrowserFeatureInfo[] => {
    return BROWSER_FEATURES.filter(f => f.category === category);
  }, []);

  // Get features by source browser
  const getFeaturesBySource = useCallback((source: BrowserFeatureInfo['source']): BrowserFeatureInfo[] => {
    return BROWSER_FEATURES.filter(f => f.source === source);
  }, []);

  // Get all enabled features
  const getEnabledFeatures = useCallback((): BrowserFeatureInfo[] => {
    return BROWSER_FEATURES.filter(f => f.isEnabled);
  }, []);

  return {
    // Loading state
    isLoading: !isInitialized,
    isInitialized,

    // Feature info
    features: BROWSER_FEATURES,
    getFeature,
    getFeaturesByCategory,
    getFeaturesBySource,
    getEnabledFeatures,

    // Advanced Browser (Opera GX, Opera One, Firefox, Edge, SigmaOS, Arc, Vivaldi)
    resourceLimiter: {
      setLimits: advanced.setResourceLimits,
      usage: advanced.resourceUsage,
      getHotTabs: advanced.getHotTabs,
    },
    tabIslands: {
      create: advanced.createIsland,
      addTab: advanced.addTabToIsland,
      islands: advanced.islands,
      service: advanced.services.tabIsland,
    },
    containers: {
      create: advanced.createContainer,
      containers: advanced.containers,
      service: advanced.services.container,
    },
    sleepingTabs: {
      sleep: advanced.sleepTab,
      wake: advanced.wakeTab,
      tabs: advanced.sleepingTabs,
      service: advanced.services.sleepingTabs,
    },
    snoozeTabs: {
      snooze: advanced.snoozeTab,
      tabs: advanced.snoozedTabs,
      service: advanced.services.snoozeTabs,
    },
    commandBar: {
      search: advanced.searchCommands,
      open: advanced.openCommandBar,
      close: advanced.closeCommandBar,
      isOpen: advanced.commandBarOpen,
      results: advanced.commandResults,
      service: advanced.services.commandBar,
    },
    mouseGestures: {
      service: advanced.services.mouseGestures,
    },
    sessions: {
      service: advanced.services.sessionManager,
    },

    // Browser Boosts (Arc, Edge, Vivaldi, Safari, SigmaOS)
    boosts: {
      create: boosts.createBoost,
      toggle: boosts.toggleBoost,
      apply: boosts.applyBoosts,
      templates: boosts.getBoostTemplates,
      list: boosts.boosts,
      services: boosts.services.boosts,
    },
    collections: {
      create: boosts.createCollection,
      addItem: boosts.addToCollection,
      list: boosts.collections,
      services: boosts.services.collections,
    },
    notes: {
      create: boosts.createNote,
      list: boosts.notes,
      services: boosts.services.notes,
    },
    readingList: {
      add: boosts.addToReadingList,
      markRead: boosts.markAsRead,
      list: boosts.readingList,
      services: boosts.services.readingList,
    },
    linkPreview: {
      get: boosts.getLinkPreview,
      services: boosts.services.linkPreview,
    },

    // Browser Enhancements (Vivaldi, Arc, Brave, Opera)
    pip: {
      create: enhancements.createPiP,
      close: enhancements.closePiP,
      windows: enhancements.pipWindows,
      services: enhancements.services.pip,
    },
    webPanels: {
      add: enhancements.addPanel,
      toggle: enhancements.togglePanel,
      getActive: enhancements.getActivePanel,
      list: enhancements.panels,
      services: enhancements.services.panels,
    },
    tabStacks: {
      list: enhancements.stacks,
      services: enhancements.services.stacks,
    },
    reader: {
      parse: enhancements.parseForReader,
      getHtml: enhancements.getReaderHtml,
      getSettings: enhancements.getReaderSettings,
      updateSettings: enhancements.updateReaderSettings,
      services: enhancements.services.reader,
    },
    workspaces: {
      create: enhancements.createWorkspace,
      switch: enhancements.switchWorkspace,
      getActive: enhancements.getActiveWorkspace,
      list: enhancements.workspaces,
      services: enhancements.services.workspaces,
    },
    speedDial: {
      list: enhancements.speedDial,
      services: enhancements.services.speedDial,
    },
  };
}

// ============================================================================
// Feature Toggle Utilities
// ============================================================================

/**
 * Storage key for feature toggles
 */
const FEATURE_TOGGLES_KEY = 'cube_browser_feature_toggles';

/**
 * Get feature toggle state
 */
export function getFeatureToggle(featureId: string): boolean {
  try {
    const stored = localStorage.getItem(FEATURE_TOGGLES_KEY);
    if (stored) {
      const toggles = JSON.parse(stored);
      return toggles[featureId] ?? true;
    }
  } catch {
    // Ignore errors
  }
  return true;
}

/**
 * Set feature toggle state
 */
export function setFeatureToggle(featureId: string, enabled: boolean): void {
  try {
    const stored = localStorage.getItem(FEATURE_TOGGLES_KEY);
    const toggles = stored ? JSON.parse(stored) : {};
    toggles[featureId] = enabled;
    localStorage.setItem(FEATURE_TOGGLES_KEY, JSON.stringify(toggles));
  } catch {
    // Ignore errors
  }
}

/**
 * Reset all feature toggles
 */
export function resetFeatureToggles(): void {
  localStorage.removeItem(FEATURE_TOGGLES_KEY);
}

// ============================================================================
// Browser Comparison Data
// ============================================================================

/**
 * Feature comparison with other browsers
 */
export const BROWSER_COMPARISON = {
  'Opera GX': {
    features: ['resource-limiter', 'speed-dial'],
    missing: ['containers', 'web-panels', 'tab-stacks'],
  },
  'Opera One': {
    features: ['tab-islands'],
    missing: ['containers', 'mouse-gestures', 'reader-mode'],
  },
  'Arc': {
    features: ['command-bar', 'boosts', 'workspaces'],
    missing: ['mouse-gestures', 'tab-stacks', 'resource-limiter'],
  },
  'Vivaldi': {
    features: ['web-panels', 'tab-stacks', 'mouse-gestures', 'notes', 'session-manager'],
    missing: ['boosts', 'containers'],
  },
  'Brave': {
    features: ['reader-mode'],
    missing: ['web-panels', 'boosts', 'workspaces'],
  },
  'Edge': {
    features: ['sleeping-tabs', 'collections'],
    missing: ['boosts', 'mouse-gestures', 'web-panels'],
  },
  'Firefox': {
    features: ['containers'],
    missing: ['boosts', 'workspaces', 'tab-islands'],
  },
  'SigmaOS': {
    features: ['snooze-tabs', 'link-preview'],
    missing: ['mouse-gestures', 'containers', 'web-panels'],
  },
  'Safari': {
    features: ['reading-list'],
    missing: ['boosts', 'containers', 'web-panels', 'mouse-gestures'],
  },
  'CUBE Elite': {
    features: BROWSER_FEATURES.map(f => f.id),
    missing: [],
  },
};

/**
 * Get features that CUBE has but competitor doesn't
 */
export function getCUBEAdvantages(competitor: keyof typeof BROWSER_COMPARISON): string[] {
  const competitorFeatures = BROWSER_COMPARISON[competitor].features;
  return BROWSER_FEATURES
    .filter(f => !competitorFeatures.includes(f.id))
    .map(f => f.name);
}

/**
 * Get total feature count comparison
 */
export function getFeatureCountComparison(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [browser, data] of Object.entries(BROWSER_COMPARISON)) {
    counts[browser] = data.features.length;
  }
  return counts;
}
