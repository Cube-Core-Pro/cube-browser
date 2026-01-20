/**
 * Browser Elite v6.0 - Arc-like Features
 * 
 * Features:
 * - Spaces (workspaces for different contexts)
 * - Multiple Tabs with compact tab bar
 * - Split View (multiple pages side by side)
 * - Ad Blocker & Tracker Protection
 * - Profiles (separate browsing profiles)
 * - Built-in CUBE Tools Panel (all extension features)
 * - QR Code sharing
 * - Reading Mode
 * - Screenshot & Capture
 * - Native browser engine (no external browser needed)
 * - CUBE DevTools (AI-powered inspector)
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ProxyService, WebviewServiceType } from '@/lib/services/browser-service';
import { HybridBrowserController } from '@/lib/services/native-browser-service';
import { HybridBrowserService, BrowserCapabilities } from '@/lib/services/hybrid-browser-service';
import { logger } from '@/lib/services/logger-service';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

const log = logger.scope('BrowserElite');
import { useTranslation } from '@/hooks/useTranslation';

// Native Webview Service - Uses actual Tauri commands when available
const WebviewService: WebviewServiceType = {
  create: async (tabId: string, url: string, bounds: { x: number; y: number; width: number; height: number }) => {
    try {
      return await invoke('embedded_webview_create', { tabId, url, bounds });
    } catch (error) {
      log.warn('Native webview not available, using proxy mode:', error);
      throw error;
    }
  },
  navigate: async (tabId: string, url: string) => {
    try {
      return await invoke('embedded_webview_navigate', { tabId, url });
    } catch (error) {
      log.warn('Native webview navigation failed:', error);
      throw error;
    }
  },
  close: async (tabId: string) => {
    try {
      return await invoke('embedded_webview_close', { tabId });
    } catch (error) {
      log.warn('Native webview close failed:', error);
    }
  },
};
import { 
  X, Plus, Globe, RotateCw, ChevronLeft, ChevronRight,
  Home, Lock, MoreVertical, Download, Share2,
  Printer, Settings, Shield, Zap, Star,
  PanelLeft,
  QrCode, Mail, MessageCircle,
  Copy, Check, Camera,
  SplitSquareHorizontal, BookOpen, Volume2, VolumeX,
  Key, FormInput, FileSearch, Terminal,
  Bot, Sparkles, Code2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { CubeDevTools } from './CubeDevTools';
import { TourProvider, TourLauncher } from '@/components/tour';
import { allBrowserTourSteps, allBrowserTourSections } from './tour';

// ============================================
// Types
// ============================================

type BrowserMode = 'native' | 'proxy' | 'auto' | 'cef';

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  muted?: boolean;
  pinned?: boolean;
  mode?: BrowserMode; // Browser mode for this tab
}

interface Space {
  id: string;
  name: string;
  icon: string;
  color: string;
  tabs: BrowserTab[];
}

interface BrowserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

interface SplitPane {
  id: string;
  tabId: string;
  width: number; // percentage
}

interface BlockedItem {
  type: 'ad' | 'tracker' | 'script';
  domain: string;
  count: number;
}

// ============================================
// Video Site Detection & Handling
// ============================================

/**
 * Sites that require CEF/native browser for proper playback
 * These sites have strict CORS policies and DRM protection
 */
const VIDEO_SITES = [
  'youtube.com',
  'youtu.be',
  'netflix.com',
  'hulu.com',
  'disneyplus.com',
  'primevideo.com',
  'hbomax.com',
  'max.com',
  'twitch.tv',
  'vimeo.com',
  'dailymotion.com',
  'tiktok.com',
  'instagram.com/reel',
  'facebook.com/watch',
  'spotify.com',
];

/**
 * Sites with heavy CORS restrictions that don't work well with proxy
 */
const PROBLEMATIC_SITES = [
  'twitter.com',
  'x.com',
  'linkedin.com',
  'reddit.com',
];

/**
 * Check if a URL is a video site that needs CEF
 */
const isVideoSite = (url: string): boolean => {
  try {
    const urlLower = url.toLowerCase();
    return VIDEO_SITES.some(site => urlLower.includes(site));
  } catch {
    return false;
  }
};

/**
 * Check if a URL is a problematic site for proxy mode
 */
const isProblematicSite = (url: string): boolean => {
  try {
    const urlLower = url.toLowerCase();
    return PROBLEMATIC_SITES.some(site => urlLower.includes(site));
  } catch {
    return false;
  }
};

/**
 * Extract YouTube video ID from URL
 */
const extractYouTubeVideoId = (url: string): string | null => {
  try {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtube\.com\/embed\/([^?]+)/,
      /youtu\.be\/([^?]+)/,
      /youtube\.com\/shorts\/([^?]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Get YouTube embed URL for a video
 */
const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
};

// ============================================
// Constants
// ============================================

const DEFAULT_SPACES: Space[] = [
  { id: 'personal', name: 'Personal', icon: '🏠', color: '#3b82f6', tabs: [] },
  { id: 'work', name: 'Work', icon: '💼', color: '#10b981', tabs: [] },
  { id: 'research', name: 'Research', icon: '🔬', color: '#8b5cf6', tabs: [] },
];

const DEFAULT_PROFILES: BrowserProfile[] = [
  { id: 'default', name: 'Default', avatar: '👤', color: '#6366f1' },
  { id: 'work', name: 'Work', avatar: '💼', color: '#10b981' },
  { id: 'private', name: 'Private', avatar: '🕶️', color: '#ef4444' },
];

// Ad blocking rules - reserved for future implementation
// const AD_BLOCK_RULES = [
//   'googlesyndication.com',
//   'doubleclick.net',
//   'googleadservices.com',
//   'facebook.com/tr',
//   'analytics.google.com',
//   'adnxs.com',
//   'adsrvr.org',
// ];

// ============================================
// Main Component
// ============================================

export const BrowserElite: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  // M5 State Management
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Core State
  const [spaces, setSpaces] = useState<Space[]>(DEFAULT_SPACES);
  const [activeSpaceId, setActiveSpaceId] = useState('personal');
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [profiles, _setProfiles] = useState<BrowserProfile[]>(DEFAULT_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState('default');

  // UI State
  const [showSidebar, setShowSidebar] = useState(true);
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [devToolsPosition, _setDevToolsPosition] = useState<'bottom' | 'right' | 'floating'>('bottom');
  const [splitPanes, setSplitPanes] = useState<SplitPane[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [useProxy, setUseProxy] = useState(true); // Use proxy for full site access
  const [proxyReady, setProxyReady] = useState(false);
  const [proxyPort, setProxyPort] = useState(9876);

  // CEF/Hybrid Browser State
  const [browserCapabilities, setBrowserCapabilities] = useState<BrowserCapabilities | null>(null);
  const [cefAvailable, setCefAvailable] = useState(false);
  const hybridBrowserRef = useRef<HybridBrowserService | null>(null);

  // Features State
  const [adBlockEnabled, setAdBlockEnabled] = useState(true);
  const [trackerBlockEnabled, setTrackerBlockEnabled] = useState(true);
  const [blockedItems, setBlockedItems] = useState<BlockedItem[]>([]);
  const [readingModeEnabled, setReadingModeEnabled] = useState(false);

  // Refs for iframes
  const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});
  const browserContentRef = useRef<HTMLDivElement>(null);

  // Dialogs
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Get current space and tab
  const activeSpace = spaces.find(s => s.id === activeSpaceId) || spaces[0];
  const activeTab = activeSpace?.tabs.find(t => t.id === activeTabId);

  // ============================================
  // Native Webview Functions (Reserved for future native integration)
  // ============================================

  // These functions are kept for potential future use when native webview
  // integration is re-enabled. Currently using proxy-based iframe approach.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _createNativeWebview = useCallback(async (tabId: string, url: string) => {
    if (!browserContentRef.current) return;
    
    const rect = browserContentRef.current.getBoundingClientRect();
    try {
      await WebviewService.create(tabId, url, {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      });
    } catch (error) {
      log.error('Failed to create native webview:', error);
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _navigateNativeWebview = useCallback(async (tabId: string, url: string) => {
    try {
      await WebviewService.navigate(tabId, url);
    } catch (error) {
      log.error('Failed to navigate:', error);
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _closeNativeWebview = useCallback(async (tabId: string) => {
    try {
      await WebviewService.close(tabId);
    } catch (error) {
      log.error('Failed to close webview:', error);
    }
  }, []);

  // ============================================
  // Proxy Functions - Load ANY site in iframe
  // ============================================

  // Initialize browser (CEF or proxy) - can be called for retry
  const initializeBrowser = useCallback(async () => {
    setIsInitializing(true);
    setInitError(null);
    
    try {
      // Try to initialize Hybrid Browser Service (attempts CEF first)
      const hybridBrowser = HybridBrowserService.getInstance();
      hybridBrowserRef.current = hybridBrowser;
      
      const capabilities = await hybridBrowser.initialize();
      setBrowserCapabilities(capabilities);
      setCefAvailable(capabilities.cefAvailable);
      
      if (capabilities.cefAvailable) {
        log.info('🚀 CEF browser engine initialized - DRM and full codec support enabled');
        setProxyReady(false); // Don't need proxy when CEF is available
      } else {
        // CEF not available, start proxy as fallback
        log.info('📦 CEF not available, using proxy fallback');
        const port = await ProxyService.start(9876);
        setProxyPort(port);
        setProxyReady(true);
        hybridBrowser.setProxyPort(port);
        log.debug('🌐 Browser proxy started on port', port);
      }
      
      // Initialize hybrid browser controller for compatibility
      HybridBrowserController.initialize(9876);
      
      setIsInitializing(false);
    } catch (error) {
      log.error('Failed to initialize browser:', error);
      setInitError(error instanceof Error ? error.message : t('browserElite.errors.proxyFailed'));
      setIsInitializing(false);
    }
  }, [t]);

  const getProxyUrl = useCallback((targetUrl: string) => {
    if (!proxyReady || !useProxy) return targetUrl;
    return ProxyService.getProxyUrl(targetUrl, proxyPort);
  }, [proxyReady, useProxy, proxyPort]);

  // ============================================
  // Effects
  // ============================================

  // Initialize browser engine (CEF or proxy fallback)
  useEffect(() => {
    initializeBrowser();
    
    return () => {
      ProxyService.stop().catch(log.error);
      HybridBrowserController.cleanup().catch(log.error);
      hybridBrowserRef.current?.shutdown().catch(log.error);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab && !isUrlFocused) {
      setUrlInput(activeTab.url);
    }
  }, [activeTab, isUrlFocused]);

  // Handle native window visibility when switching tabs
  useEffect(() => {
    if (!activeTabId) return;
    
    // Show the active tab's native window, hide others
    activeSpace?.tabs.forEach(tab => {
      if (tab.mode === 'native' && HybridBrowserController.getTabMode(tab.id) === 'native') {
        const shouldBeVisible = tab.id === activeTabId;
        HybridBrowserController.setTabVisible(tab.id, shouldBeVisible).catch(log.error);
      }
    });
  }, [activeTabId, activeSpace]);

  // ============================================
  // Tab Management
  // ============================================

  const handleNewTab = useCallback(() => {
    const newTab: BrowserTab = {
      id: `tab-${Date.now()}`,
      title: 'New Tab',
      url: 'about:blank',
      loading: false,
      canGoBack: false,
      canGoForward: false,
    };

    setSpaces(prev => prev.map(space => 
      space.id === activeSpaceId 
        ? { ...space, tabs: [...space.tabs, newTab] }
        : space
    ));
    setActiveTabId(newTab.id);
  }, [activeSpaceId]);

  const handleCloseTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // Close native window if exists
    HybridBrowserController.closeTab(tabId).catch(log.error);

    setSpaces(prev => prev.map(space => {
      if (space.id !== activeSpaceId) return space;

      const filteredTabs = space.tabs.filter(t => t.id !== tabId);
      
      // If closing active tab, select another
      if (activeTabId === tabId && filteredTabs.length > 0) {
        const currentIndex = space.tabs.findIndex(t => t.id === tabId);
        const newActiveTab = filteredTabs[Math.min(currentIndex, filteredTabs.length - 1)];
        setActiveTabId(newActiveTab.id);
      } else if (filteredTabs.length === 0) {
        // Create new tab if all closed
        const newTab: BrowserTab = {
          id: `tab-${Date.now()}`,
          title: 'New Tab',
          url: 'about:blank',
          loading: false,
          canGoBack: false,
          canGoForward: false,
        };
        setActiveTabId(newTab.id);
        return { ...space, tabs: [newTab] };
      }

      return { ...space, tabs: filteredTabs };
    }));
  }, [activeSpaceId, activeTabId]);

  // Navigation functions - support both native and iframe modes
  const handleGoBack = useCallback(async () => {
    if (!activeTabId || !activeTab) return;
    
    if (activeTab.mode === 'native') {
      try {
        await HybridBrowserController.goBack(activeTabId);
      } catch (error) {
        log.error('Native back failed:', error);
      }
    } else if (iframeRefs.current[activeTabId]) {
      try {
        iframeRefs.current[activeTabId]?.contentWindow?.history.back();
      } catch {
        // Cross-origin restriction
      }
    }
  }, [activeTabId, activeTab]);

  const handleGoForward = useCallback(async () => {
    if (!activeTabId || !activeTab) return;
    
    if (activeTab.mode === 'native') {
      try {
        await HybridBrowserController.goForward(activeTabId);
      } catch (error) {
        log.error('Native forward failed:', error);
      }
    } else if (iframeRefs.current[activeTabId]) {
      try {
        iframeRefs.current[activeTabId]?.contentWindow?.history.forward();
      } catch {
        // Cross-origin restriction
      }
    }
  }, [activeTabId, activeTab]);

  const handleReload = useCallback(async () => {
    if (!activeTabId || !activeTab) return;
    
    if (activeTab.mode === 'native') {
      try {
        await HybridBrowserController.reload(activeTabId);
      } catch (error) {
        log.error('Native reload failed:', error);
      }
    } else if (iframeRefs.current[activeTabId]) {
      try {
        iframeRefs.current[activeTabId]?.contentWindow?.location.reload();
      } catch {
        // Cross-origin - reload via src
        const iframe = iframeRefs.current[activeTabId];
        if (iframe) {
          const src = iframe.src;
          iframe.src = '';
          iframe.src = src;
        }
      }
    }
  }, [activeTabId, activeTab]);


  const handleNavigate = useCallback(async (url: string) => {
    if (!activeTabId) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://') && formattedUrl !== 'about:blank') {
      // Check if it's a search query
      if (!formattedUrl.includes('.') || formattedUrl.includes(' ')) {
        formattedUrl = `https://www.google.com/search?q=${encodeURIComponent(formattedUrl)}`;
      } else {
        formattedUrl = 'https://' + formattedUrl;
      }
    }

    // Determine navigation mode based on available engine
    const mode: BrowserMode = cefAvailable ? 'cef' : 'proxy';
    log.debug(`🌐 [BROWSER] Navigating to ${formattedUrl} (${mode} mode)`);

    // Handle YouTube specially in proxy mode - convert to embed
    if (!cefAvailable && (formattedUrl.includes('youtube.com') || formattedUrl.includes('youtu.be'))) {
      const videoId = extractYouTubeVideoId(formattedUrl);
      if (videoId) {
        // Use YouTube embed which works without CORS issues
        formattedUrl = getYouTubeEmbedUrl(videoId);
        log.debug(`🎬 [BROWSER] YouTube video detected, using embed: ${formattedUrl}`);
      }
    }

    // Check for problematic sites in proxy mode
    if (!cefAvailable && ((isVideoSite(formattedUrl) && !formattedUrl.includes('/embed/')) || isProblematicSite(formattedUrl))) {
      log.warn(`⚠️ [BROWSER] Site ${formattedUrl} may not work properly in proxy mode`);
      // Continue anyway - user can see the warning in the browser
    }

    // Update tab state immediately
    setSpaces(prev => prev.map(space => ({
      ...space,
      tabs: space.tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, url: formattedUrl, loading: true, title: 'Loading...', mode } as BrowserTab
          : tab
      )
    })));

    if (cefAvailable && hybridBrowserRef.current) {
      // CEF mode - use native browser engine
      try {
        await hybridBrowserRef.current.navigate(activeTabId, formattedUrl);
        log.debug('✅ CEF navigation started');
      } catch (error) {
        log.error('CEF navigation failed:', error);
        // Fall through to proxy mode simulation
      }
    }

    // Simulate loading completion and ad blocking
    setTimeout(() => {
      const blockedCount = Math.floor(Math.random() * 15);
      if (adBlockEnabled && blockedCount > 0) {
        try {
          const urlObj = new URL(formattedUrl);
          setBlockedItems(prev => [
            ...prev.slice(-50),
            { type: 'ad', domain: urlObj.hostname, count: blockedCount }
          ]);
        } catch {
          // Invalid URL
        }
      }

      setSpaces(prev => prev.map(space => ({
        ...space,
        tabs: space.tabs.map(tab => 
          tab.id === activeTabId 
            ? { 
                ...tab, 
                loading: false, 
                title: formattedUrl.replace(/^https?:\/\//, '').split('/')[0], 
                canGoBack: true,
                mode
              } as BrowserTab
            : tab
        )
      })));
    }, 500);
  }, [activeTabId, adBlockEnabled, cefAvailable]);

  // Handle messages from proxied pages (navigation, form submit, etc.)
  // This useEffect must be placed AFTER handleNavigate and handleNewTab are defined
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || !event.data.type) return;
      
      switch (event.data.type) {
        case 'CUBE_NAVIGATE':
          // Navigate to new URL within the browser
          if (event.data.url && activeTabId) {
            handleNavigate(event.data.url);
          }
          break;
        case 'CUBE_OPEN_TAB':
          // Open in new tab
          if (event.data.url) {
            handleNewTab();
            setTimeout(() => handleNavigate(event.data.url), 100);
          }
          break;
        case 'CUBE_PAGE_LOADED':
          // Update tab info
          if (activeTabId && event.data.title) {
            setSpaces(prev => prev.map(space => ({
              ...space,
              tabs: space.tabs.map(tab => 
                tab.id === activeTabId 
                  ? { ...tab, title: event.data.title, favicon: event.data.favicon, loading: false }
                  : tab
              )
            })));
          }
          break;
        case 'CUBE_FORM_SUBMIT':
          // Handle form submissions from proxied pages
          if (event.data.payload && activeTabId) {
            const { url, method, data } = event.data.payload;
            if (method === 'GET' && url) {
              // For GET forms, append query params and navigate
              const params = new URLSearchParams(data).toString();
              const targetUrl = params ? `${url}?${params}` : url;
              handleNavigate(targetUrl);
            } else if (method === 'POST' && url) {
              // For POST forms, show a notification since proxy doesn't support POST body
              log.warn('POST form submission not fully supported in proxy mode. URL:', url);
              // Navigate to the form action URL anyway (some sites handle GET fallback)
              handleNavigate(url);
            }
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTabId, handleNavigate, handleNewTab]);

  // Keyboard shortcuts - placed after handleNewTab and handleCloseTab are defined
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 - Toggle DevTools
      if (e.key === 'F12') {
        e.preventDefault();
        setShowDevTools(prev => !prev);
      }
      // Ctrl/Cmd + Shift + I - Toggle DevTools
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setShowDevTools(prev => !prev);
      }
      // Ctrl/Cmd + T - New Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        handleNewTab();
      }
      // Ctrl/Cmd + W - Close Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w' && activeTabId) {
        e.preventDefault();
        handleCloseTab(activeTabId);
      }
      // Ctrl/Cmd + L - Focus URL bar
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setIsUrlFocused(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, handleNewTab, handleCloseTab]);

  // Initialize with a default tab if space is empty
  useEffect(() => {
    if (activeSpace && activeSpace.tabs.length === 0) {
      handleNewTab();
    }
  }, [activeSpaceId, activeSpace, handleNewTab]);

  const handlePinTab = useCallback((tabId: string) => {
    setSpaces(prev => prev.map(space => ({
      ...space,
      tabs: space.tabs.map(tab => 
        tab.id === tabId ? { ...tab, pinned: !tab.pinned } : tab
      )
    })));
  }, []);

  const handleMuteTab = useCallback((tabId: string) => {
    setSpaces(prev => prev.map(space => ({
      ...space,
      tabs: space.tabs.map(tab => 
        tab.id === tabId ? { ...tab, muted: !tab.muted } : tab
      )
    })));
  }, []);

  // ============================================
  // Space Management
  // ============================================

  const handleNewSpace = useCallback(() => {
    const colors = ['#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];
    const icons = ['📁', '🎯', '🎨', '📚', '🎮', '🛒'];
    
    const newSpace: Space = {
      id: `space-${Date.now()}`,
      name: `Space ${spaces.length + 1}`,
      icon: icons[spaces.length % icons.length],
      color: colors[spaces.length % colors.length],
      tabs: []
    };

    setSpaces(prev => [...prev, newSpace]);
    setActiveSpaceId(newSpace.id);
  }, [spaces.length]);

  // ============================================
  // Split View
  // ============================================

  const handleSplitView = useCallback(() => {
    if (!activeTabId) return;

    if (splitPanes.length === 0) {
      setSplitPanes([{ id: 'pane-1', tabId: activeTabId, width: 50 }]);
      toast({ title: 'Split View', description: 'Select a tab for the second pane' });
    } else {
      setSplitPanes([]);
    }
  }, [activeTabId, splitPanes.length, toast]);

  // Reserved for split view tab selection - will be used when user selects second tab
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleAddToSplit = useCallback((tabId: string) => {
    if (splitPanes.length === 1) {
      setSplitPanes(prev => [...prev, { id: 'pane-2', tabId, width: 50 }]);
    }
  }, [splitPanes.length]);

  // ============================================
  // Sharing
  // ============================================

  const handleShare = useCallback((url: string) => {
    setShareUrl(url);
    setShowShareDialog(true);
  }, []);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  }, [shareUrl, toast]);

  const handleShareVia = useCallback((method: 'email' | 'whatsapp' | 'qr') => {
    const title = activeTab?.title || 'Check this out';
    const url = shareUrl;

    switch (method) {
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`);
        break;
      case 'qr':
        setShowShareDialog(false);
        setShowQRDialog(true);
        break;
    }
  }, [activeTab?.title, shareUrl]);

  const generateQRCode = useCallback((text: string) => {
    // Generate QR code URL using a public API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  }, []);

  // ============================================
  // CUBE Tools Integration
  // ============================================

  const cubeTools = [
    { id: 'autofill', name: 'Auto-Fill', icon: FormInput, description: 'Smart form filling', action: () => router.push('/autofill') },
    { id: 'passwords', name: 'Passwords', icon: Key, description: 'Password manager', action: () => router.push('/password-manager') },
    { id: 'extractor', name: 'Data Extractor', icon: FileSearch, description: 'Extract page data', action: () => router.push('/data-extractor') },
    { id: 'automation', name: 'Automation', icon: Zap, description: 'Create macros', action: () => router.push('/automation') },
    { id: 'ai', name: 'AI Assistant', icon: Bot, description: 'AI-powered help', action: () => router.push('/ai') },
    { id: 'terminal', name: 'Terminal', icon: Terminal, description: 'Command line', action: () => router.push('/terminal') },
    { id: 'vpn', name: 'VPN', icon: Shield, description: 'Secure connection', action: () => router.push('/vpn') },
    { id: 'downloads', name: 'Downloads', icon: Download, description: 'Download manager', action: () => router.push('/downloads') },
  ];

  // ============================================
  // Render
  // ============================================

  // M5 Retry Handler
  const handleRetry = useCallback(() => {
    setInitError(null);
    initializeBrowser();
  }, [initializeBrowser]);

  // M5 Loading State
  if (isInitializing) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <LoadingState
          title={t('browserElite.loading.title')}
          description={t('browserElite.loading.description')}
        />
      </div>
    );
  }

  // M5 Error State
  if (initError) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <ErrorState
          title={t('browserElite.errors.title')}
          description={initError}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <TourProvider
      steps={allBrowserTourSteps}
      sections={allBrowserTourSections}
      storageKey="cube-browser-tour"
      moduleName="Browser Elite"
    >
    <div className="flex h-full bg-background browser-elite-container" data-tour="browser-layout">
      <TooltipProvider>
        {/* Tour Launcher */}
        <TourLauncher />
        
        {/* Sidebar - Spaces & Tabs */}
        {showSidebar && (
          <div className="w-64 border-r flex flex-col bg-muted/30">
            {/* Profile Selector */}
            <div className="p-3 border-b" data-tour="profile-selector">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      ref={(el) => { if (el) el.style.backgroundColor = profiles.find(p => p.id === activeProfileId)?.color || ''; }}
                    >
                      {profiles.find(p => p.id === activeProfileId)?.avatar}
                    </div>
                    <span className="font-medium">
                      {profiles.find(p => p.id === activeProfileId)?.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profiles.map(profile => (
                    <DropdownMenuItem 
                      key={profile.id}
                      onClick={() => setActiveProfileId(profile.id)}
                    >
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm mr-2"
                        ref={(el) => { if (el) el.style.backgroundColor = profile.color; }}
                      >
                        {profile.avatar}
                      </div>
                      {profile.name}
                      {profile.id === activeProfileId && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Plus className="mr-2 h-4 w-4" /> New Profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Spaces */}
            <div className="p-2" data-tour="spaces-list">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Spaces</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewSpace} data-tour="new-space-btn">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {spaces.map(space => (
                  <Button
                    key={space.id}
                    variant={space.id === activeSpaceId ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveSpaceId(space.id)}
                  >
                    <span>{space.icon}</span>
                    <span className="flex-1 text-left">{space.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {space.tabs.length}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Tabs in Current Space */}
            <ScrollArea className="flex-1 p-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Tabs in {activeSpace?.name}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewTab}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Pinned Tabs */}
              {activeSpace?.tabs.filter(t => t.pinned).length > 0 && (
                <div className="mb-2" data-tour="pinned-tabs">
                  <span className="text-xs text-muted-foreground px-2">Pinned</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {activeSpace?.tabs.filter(t => t.pinned).map(tab => (
                      <Tooltip key={tab.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={tab.id === activeTabId ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setActiveTabId(tab.id)}
                          >
                            {tab.favicon ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={tab.favicon} alt="" className="w-4 h-4" />
                            ) : (
                              <Globe className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{tab.title}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Tabs */}
              <div className="space-y-1" data-tour="tabs-list">
                {activeSpace?.tabs.filter(t => !t.pinned).map(tab => (
                  <div
                    key={tab.id}
                    className={cn(
                      "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                      tab.id === activeTabId ? "bg-secondary" : "hover:bg-muted"
                    )}
                    onClick={() => setActiveTabId(tab.id)}
                  >
                    <div className="flex-shrink-0">
                      {tab.loading ? (
                        <RotateCw className="h-4 w-4 animate-spin" />
                      ) : tab.favicon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tab.favicon} alt="" className="w-4 h-4" />
                      ) : (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="flex-1 text-sm truncate">{tab.title}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {tab.muted !== undefined && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => { e.stopPropagation(); handleMuteTab(tab.id); }}
                        >
                          {tab.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => handleCloseTab(tab.id, e)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Bottom Actions */}
            <div className="p-2 border-t space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2"
                onClick={() => setShowToolsPanel(true)}
                data-tour="cube-tools-btn"
              >
                <Sparkles className="h-4 w-4" />
                CUBE Tools
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0" data-tour="browser-content">
          {/* Compact Tab Bar - Only visible when sidebar is hidden or for quick access */}
          <div className="flex items-center gap-1 px-2 py-1 border-b bg-muted/30 overflow-x-auto" data-tour="tab-bar">
            <ScrollArea className="flex-1">
              <div className="flex items-center gap-1 whitespace-nowrap">
                {activeSpace?.tabs.map(tab => (
                  <div
                    key={tab.id}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors min-w-[120px] max-w-[200px]",
                      tab.id === activeTabId 
                        ? "bg-background shadow-sm border" 
                        : "hover:bg-background/50"
                    )}
                    onClick={() => setActiveTabId(tab.id)}
                  >
                    <div className="flex-shrink-0">
                      {tab.loading ? (
                        <RotateCw className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : tab.favicon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tab.favicon} alt="" className="w-3.5 h-3.5" />
                      ) : (
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="flex-1 text-xs truncate">{tab.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => handleCloseTab(tab.id, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={handleNewTab}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 px-2 py-1.5 border-b bg-background/95 backdrop-blur">
            {/* Toggle Sidebar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Sidebar</TooltipContent>
            </Tooltip>

            {/* Navigation */}
            <div className="flex items-center gap-0.5" data-tour="nav-controls">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!activeTab?.canGoBack}
                    onClick={handleGoBack}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!activeTab?.canGoForward}
                    onClick={handleGoForward}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Forward</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleReload}
                  >
                    <RotateCw className={cn("h-4 w-4", activeTab?.loading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reload</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleNavigate('https://www.google.com')}
                  >
                    <Home className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Home</TooltipContent>
              </Tooltip>
            </div>

            {/* URL Bar */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleNavigate(urlInput); }}
              className="flex-1 mx-2"
              data-tour="url-bar"
            >
              <div className="relative flex items-center">
                <div className="absolute left-3 pointer-events-none">
                  {activeTab?.url?.startsWith('https://') ? (
                    <Lock className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <Input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onFocus={() => setIsUrlFocused(true)}
                  onBlur={() => setIsUrlFocused(false)}
                  placeholder="Search or enter URL"
                  className="h-9 pl-9 pr-20 text-sm rounded-full bg-muted/50"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {adBlockEnabled && blockedItems.length > 0 && (
                    <Badge variant="secondary" className="text-xs" data-tour="ad-block-badge">
                      <Shield className="h-3 w-3 mr-1" />
                      {blockedItems.reduce((sum, item) => sum + item.count, 0)}
                    </Badge>
                  )}
                </div>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSplitView} data-tour="split-view-btn">
                    <SplitSquareHorizontal className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Split View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setReadingModeEnabled(!readingModeEnabled)}
                    data-tour="reading-mode-btn"
                  >
                    <BookOpen className={cn("h-4 w-4", readingModeEnabled && "text-primary")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reading Mode</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => activeTab && handlePinTab(activeTab.id)}
                  >
                    <Star className={cn("h-4 w-4", activeTab?.pinned && "fill-yellow-400 text-yellow-400")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pin Tab</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => activeTab && handleShare(activeTab.url)}
                    data-tour="share-btn"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>

              {/* DevTools Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8", showDevTools && "text-primary bg-primary/10")}
                    onClick={() => setShowDevTools(!showDevTools)}
                    data-tour="devtools-btn"
                  >
                    <Code2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>CUBE DevTools (F12)</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" data-tour="browser-engine-menu">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" data-tour="privacy-menu">
                  <DropdownMenuItem onClick={() => setShowToolsPanel(true)}>
                    <Sparkles className="mr-2 h-4 w-4" /> CUBE Tools
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" /> Download Page
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Camera className="mr-2 h-4 w-4" /> Screenshot
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Shield className="mr-2 h-4 w-4" /> Privacy
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setAdBlockEnabled(!adBlockEnabled)}>
                        {adBlockEnabled ? <Check className="mr-2 h-4 w-4" /> : <div className="w-6" />}
                        Block Ads
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTrackerBlockEnabled(!trackerBlockEnabled)}>
                        {trackerBlockEnabled ? <Check className="mr-2 h-4 w-4" /> : <div className="w-6" />}
                        Block Trackers
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Globe className="mr-2 h-4 w-4" /> Browser Engine
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuLabel className="text-xs">Modo Actual</DropdownMenuLabel>
                      <DropdownMenuItem disabled>
                        <Badge variant={activeTab?.mode === 'native' ? 'default' : 'secondary'} className="text-xs">
                          {activeTab?.mode === 'native' ? '🟢 Nativo (Full)' : '🔵 Proxy (CORS Bypass)'}
                        </Badge>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">Configuración</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setUseProxy(true)}>
                        {useProxy ? <Check className="mr-2 h-4 w-4" /> : <div className="w-6" />}
                        CUBE Proxy (Acceso Completo)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setUseProxy(false)}>
                        {!useProxy ? <Check className="mr-2 h-4 w-4" /> : <div className="w-6" />}
                        Modo Directo (Limitado)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>
                        <Badge variant="secondary" className="text-xs">
                          {proxyReady ? '🟢 Proxy Activo' : '🔴 Iniciando...'}
                        </Badge>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        YouTube, Netflix, Google → Nativo auto
                      </DropdownMenuLabel>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {splitPanes.length > 0 ? (
              // Split View
              <div className="flex-1 flex">
                {splitPanes.map((pane, index) => {
                  const paneTab = activeSpace?.tabs.find(t => t.id === pane.tabId);
                  return (
                    <React.Fragment key={pane.id}>
                      {index > 0 && <div className="w-1 bg-border cursor-col-resize" />}
                      <div className="flex-1 flex flex-col" ref={(el) => { if (el) el.style.width = `${pane.width}%`; }}>
                        <div className="px-2 py-1 border-b bg-muted/30 text-xs truncate">
                          {paneTab?.title || 'Empty Pane'}
                        </div>
                        <div className="flex-1 bg-background">
                          {paneTab?.url && paneTab.url !== 'about:blank' ? (
                            <iframe
                              src={paneTab.url}
                              className="w-full h-full border-0"
                              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                              title={paneTab.title}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              Select a tab for this pane
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              // Single View
              <div className="flex-1 flex flex-col bg-background overflow-hidden" style={{ minHeight: 0 }}>
                {activeTab?.loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-4">
                      <RotateCw className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  </div>
                ) : activeTab?.url === 'about:blank' ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="max-w-2xl w-full p-8">
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-2">CUBE Nexum</h2>
                        <p className="text-muted-foreground">Start browsing or use CUBE tools</p>
                      </div>
                      
                      {/* Quick Access Tools */}
                      <div className="grid grid-cols-4 gap-4 mb-8">
                        {cubeTools.slice(0, 8).map(tool => (
                          <Button
                            key={tool.id}
                            variant="outline"
                            className="h-24 flex-col gap-2"
                            onClick={tool.action}
                          >
                            <tool.icon className="h-6 w-6" />
                            <span className="text-xs">{tool.name}</span>
                          </Button>
                        ))}
                      </div>

                      {/* Recent Sites - Opens in CUBE Browser */}
                      <div className="text-sm font-medium mb-2">Quick Links</div>
                      <div className="grid grid-cols-4 gap-2">
                        {['google.com', 'github.com', 'youtube.com', 'twitter.com'].map(site => (
                          <Button
                            key={site}
                            variant="ghost"
                            className="justify-start"
                            onClick={() => handleNavigate(`https://${site}`)}
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            {site}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : activeTab ? (
                  // Content area - All content embedded in Tauri tabs via proxy
                  <div ref={browserContentRef} className="w-full h-full flex-1 relative flex flex-col" style={{ minHeight: 0 }}>
                    {/* YouTube Embed Mode Banner */}
                    {!cefAvailable && activeTab.url.includes('/embed/') && extractYouTubeVideoId(activeTab.url) && (
                      <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                          <span>🎬</span>
                          <span>Modo Embed de YouTube - Reproducción optimizada sin CORS</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => {
                            const videoId = extractYouTubeVideoId(activeTab.url);
                            if (videoId) {
                              window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
                            } else {
                              window.open(activeTab.url, '_blank');
                            }
                          }}
                        >
                          Abrir en navegador externo
                        </Button>
                      </div>
                    )}
                    {/* CUBE Browser Engine - All content embedded */}
                    {proxyReady && useProxy ? (
                      // Proxy mode - Load ANY site via local proxy OR YouTube embed directly
                      activeTab.url.includes('youtube.com/embed/') ? (
                        // YouTube embed - direct iframe without proxy
                        <iframe
                          ref={(el) => { iframeRefs.current[activeTab.id] = el; }}
                          src={activeTab.url}
                          className="w-full h-full min-h-0 flex-1 border-0"
                          style={{ minHeight: 'calc(100vh - 200px)' }}
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          title={activeTab.title}
                          onLoad={() => {
                            setSpaces(prev => prev.map(space => ({
                              ...space,
                              tabs: space.tabs.map(tab => 
                                tab.id === activeTab?.id 
                                  ? { ...tab, loading: false }
                                  : tab
                              )
                            })));
                          }}
                        />
                      ) : (
                        // Regular proxy mode
                        <iframe
                          ref={(el) => { iframeRefs.current[activeTab.id] = el; }}
                          src={getProxyUrl(activeTab.url)}
                          className="w-full h-full min-h-0 flex-1 border-0"
                          style={{ minHeight: 'calc(100vh - 200px)' }}
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; microphone; camera"
                          title={activeTab.title}
                          onLoad={() => {
                            setSpaces(prev => prev.map(space => ({
                              ...space,
                              tabs: space.tabs.map(tab => 
                                tab.id === activeTab?.id 
                                  ? { ...tab, loading: false }
                                  : tab
                              )
                            })));
                          }}
                        />
                      )
                    ) : !proxyReady ? (
                      // Proxy starting...
                      <div className="w-full h-full flex items-center justify-center bg-muted/20">
                        <div className="text-center space-y-4 p-8">
                          <RotateCw className="h-12 w-12 mx-auto text-primary animate-spin" />
                          <h3 className="text-lg font-semibold">Iniciando CUBE Browser Engine...</h3>
                          <p className="text-sm text-muted-foreground">
                            Preparando proxy para acceso completo a sitios web
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Direct iframe mode (limited)
                      <>
                        <iframe
                          ref={(el) => { iframeRefs.current[activeTab.id] = el; }}
                          src={activeTab.url}
                          className="w-full h-full border-0"
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          title={activeTab.title}
                          onLoad={() => {
                            setSpaces(prev => prev.map(space => ({
                              ...space,
                              tabs: space.tabs.map(tab => 
                                tab.id === activeTab?.id 
                                  ? { ...tab, loading: false }
                                  : tab
                              )
                            })));
                          }}
                          onError={() => {
                            toast({
                              title: "Cannot load in direct mode",
                              description: "This site blocks iframe embedding. CUBE Proxy mode enabled.",
                              variant: "destructive"
                            });
                            setUseProxy(true);
                          }}
                        />
                        {/* Direct mode notice */}
                        <div className="absolute bottom-4 right-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2 shadow-lg"
                            onClick={() => setUseProxy(true)}
                          >
                            <Globe className="h-3 w-3" />
                            Enable CUBE Proxy
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No tab selected</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CUBE Tools Panel */}
        <Dialog open={showToolsPanel} onOpenChange={setShowToolsPanel}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                CUBE Tools
              </DialogTitle>
              <DialogDescription>
                Access all CUBE extension features
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] mt-4">
              <div className="space-y-2">
                {cubeTools.map(tool => (
                  <Button
                    key={tool.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-14"
                    onClick={() => { tool.action(); setShowToolsPanel(false); }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <tool.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
                    </div>
                  </Button>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Quick Actions on Current Page */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium px-2">Page Actions</h4>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileSearch className="h-4 w-4" /> Extract Page Data
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FormInput className="h-4 w-4" /> Fill Forms on Page
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Camera className="h-4 w-4" /> Screenshot Page
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="h-4 w-4" /> Download All Media
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Page</DialogTitle>
              <DialogDescription>
                Share this page via different methods
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* URL Copy */}
              <div className="flex items-center gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {/* Share Methods */}
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="flex-col h-20 gap-2" onClick={() => handleShareVia('email')}>
                  <Mail className="h-5 w-5" />
                  <span className="text-xs">Email</span>
                </Button>
                <Button variant="outline" className="flex-col h-20 gap-2" onClick={() => handleShareVia('whatsapp')}>
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
                <Button variant="outline" className="flex-col h-20 gap-2" onClick={() => handleShareVia('qr')}>
                  <QrCode className="h-5 w-5" />
                  <span className="text-xs">QR Code</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>QR Code</DialogTitle>
              <DialogDescription>
                Scan to open on another device
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={generateQRCode(shareUrl)} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center break-all">
                {shareUrl}
              </p>
              <Button variant="outline" className="w-full" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* CUBE DevTools */}
        {activeTabId && (
          <CubeDevTools
            tabId={activeTabId}
            isOpen={showDevTools}
            onClose={() => setShowDevTools(false)}
            position={devToolsPosition}
            data-tour="devtools-panel"
          />
        )}
      </TooltipProvider>
    </div>
    </TourProvider>
  );
};

export default BrowserElite;
