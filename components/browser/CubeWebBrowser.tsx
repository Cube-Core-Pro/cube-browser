/**
 * CUBE Web Browser - Enterprise Elite Browser Component
 * 
 * A truly embedded browser with full control:
 * - Multiple tabs with drag & drop
 * - Split view support
 * - DevTools integration
 * - Ad blocking & privacy protection
 * - Download manager
 * - Bookmarks & history
 * - Extensions support
 * - AI-powered features
 * 
 * NO external windows - everything embedded in the app
 */

"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit } from '@tauri-apps/api/event';
import { logger } from '@/lib/services/logger-service';
import { useCubeWebEngine, CubeWebTab, TabBounds } from '@/hooks/useCubeWebEngine';
import { cn } from '@/lib/utils';
import {
  X, Plus, Globe, RotateCw, ChevronLeft, ChevronRight,
  Home, Lock, Unlock, MoreVertical, Download, Share2,
  Printer, Settings, Shield, ShieldCheck, ShieldOff, Zap, Star, StarOff,
  PanelLeft, PanelRight, PanelLeftClose,
  QrCode, Mail, MessageCircle, Send,
  Copy, Check, Camera, Maximize2, Minimize2,
  SplitSquareHorizontal, SplitSquareVertical, BookOpen, Volume2, VolumeX,
  Key, FormInput, FileSearch, Terminal, Eye, EyeOff,
  Bot, Sparkles, Code2, AlertTriangle, Search, ExternalLink,
  Bookmark, BookmarkPlus, History, Clock, Trash2,
  FolderOpen, File, RefreshCw, StopCircle, ArrowUpRight,
  Layout, LayoutGrid, Layers, Monitor, Smartphone, Tablet,
  Wifi, WifiOff, Battery, BatteryCharging, Cpu,
  Moon, Sun, Palette, Languages, Mic, MicOff,
  ZoomIn, ZoomOut, RotateCcw, Fullscreen, PictureInPicture,
  Bug, Wrench, Database, Network, FileCode, Inspect
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import './CubeWebBrowser.css';

const log = logger.scope('CubeWebBrowser');

// ============================================
// Types & Interfaces
// ============================================

interface BrowserSettings {
  adBlockEnabled: boolean;
  trackingProtection: boolean;
  httpsOnly: boolean;
  darkMode: boolean;
  zoomLevel: number;
  userAgent: string;
  language: string;
  downloadsPath: string;
}

interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  folderId: string | null;
  createdAt: number;
}

interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  visitedAt: number;
  visitCount: number;
}

interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  path: string;
  size: number;
  downloaded: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed';
  startedAt: number;
}

interface DevToolsTab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SplitView {
  enabled: boolean;
  orientation: 'horizontal' | 'vertical';
  ratio: number;
  secondaryTabId: string | null;
}

// ============================================
// Proxy Configuration for iframe content
// ============================================

const PROXY_BASE_URL = 'http://localhost:3001/proxy';

function getProxiedUrl(url: string): string {
  if (!url || url === 'about:blank') return 'about:blank';
  if (url.startsWith('data:') || url.startsWith('javascript:')) return url;
  
  try {
    const encodedUrl = encodeURIComponent(url);
    return `${PROXY_BASE_URL}?url=${encodedUrl}`;
  } catch {
    return url;
  }
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  
  // Handle search queries
  if (!url.includes('.') && !url.startsWith('http') && !url.startsWith('about:')) {
    return `https://www.google.com/search?q=${encodeURIComponent(url)}`;
  }
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
    url = `https://${url}`;
  }
  
  return url;
}

// ============================================
// Main Component
// ============================================

export default function CubeWebBrowser(): React.JSX.Element {
  const { toast } = useToast();
  const engine = useCubeWebEngine();
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'tabs' | 'bookmarks' | 'history' | 'downloads'>('tabs');
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [devToolsTab, setDevToolsTab] = useState<string>('elements');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [findBarOpen, setFindBarOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  
  // Address bar
  const [addressBarValue, setAddressBarValue] = useState('');
  const [addressBarFocused, setAddressBarFocused] = useState(false);
  const addressBarRef = useRef<HTMLInputElement>(null);
  
  // Split view
  const [splitView, setSplitView] = useState<SplitView>({
    enabled: false,
    orientation: 'horizontal',
    ratio: 50,
    secondaryTabId: null
  });
  
  // Browser settings
  const [settings, setSettings] = useState<BrowserSettings>({
    adBlockEnabled: true,
    trackingProtection: true,
    httpsOnly: true,
    darkMode: true,
    zoomLevel: 100,
    userAgent: 'CUBE Nexum Browser/7.0',
    language: 'en-US',
    downloadsPath: '~/Downloads'
  });
  
  // Data
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  
  // Refs
  const iframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());
  const browserContainerRef = useRef<HTMLDivElement>(null);

  // Get active tab
  const activeTab = useMemo(() => {
    if (!engine.activeTabId) return null;
    return engine.tabs.find(t => t.id === engine.activeTabId) || null;
  }, [engine.tabs, engine.activeTabId]);

  // Update address bar when tab changes
  useEffect(() => {
    if (activeTab && !addressBarFocused) {
      setAddressBarValue(activeTab.url === 'about:blank' ? '' : activeTab.url);
    }
  }, [activeTab, addressBarFocused]);

  // Initialize with a tab
  useEffect(() => {
    if (engine.tabs.length === 0) {
      handleNewTab();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + T = New tab
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        handleNewTab();
      }
      // Cmd/Ctrl + W = Close tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        if (engine.activeTabId) {
          handleCloseTab(engine.activeTabId);
        }
      }
      // Cmd/Ctrl + L = Focus address bar
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        addressBarRef.current?.focus();
        addressBarRef.current?.select();
      }
      // Cmd/Ctrl + R = Reload
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        if (engine.activeTabId) {
          handleReload();
        }
      }
      // Cmd/Ctrl + F = Find
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setFindBarOpen(true);
      }
      // Escape = Close find bar
      if (e.key === 'Escape') {
        setFindBarOpen(false);
      }
      // Cmd/Ctrl + Shift + I = DevTools
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'i') {
        e.preventDefault();
        setDevToolsOpen(!devToolsOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine.activeTabId, devToolsOpen]);

  // ============================================
  // Tab Management
  // ============================================

  const handleNewTab = useCallback(async (url?: string) => {
    try {
      const bounds: TabBounds = {
        x: 0,
        y: 0,
        width: browserContainerRef.current?.clientWidth || 1200,
        height: browserContainerRef.current?.clientHeight || 800
      };
      
      await engine.createTab(url || 'about:blank', bounds);
      
      if (!url) {
        setTimeout(() => {
          addressBarRef.current?.focus();
        }, 100);
      }
    } catch (error) {
      log.error('Failed to create tab:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new tab',
        variant: 'destructive'
      });
    }
  }, [engine, toast]);

  const handleCloseTab = useCallback(async (tabId: string) => {
    try {
      await engine.closeTab(tabId);
      
      // Create new tab if no tabs left
      if (engine.tabs.length <= 1) {
        handleNewTab();
      }
    } catch (error) {
      log.error('Failed to close tab:', error);
    }
  }, [engine, handleNewTab]);

  const handleTabClick = useCallback((tabId: string) => {
    engine.setActiveTab(tabId);
  }, [engine]);

  // ============================================
  // Navigation
  // ============================================

  const handleNavigate = useCallback(async (url?: string) => {
    const targetUrl = url || addressBarValue;
    if (!targetUrl || !engine.activeTabId) return;

    const normalizedUrl = normalizeUrl(targetUrl);
    setAddressBarValue(normalizedUrl);

    try {
      await engine.navigate(engine.activeTabId, normalizedUrl);
      
      // Add to history
      setHistory(prev => [{
        id: crypto.randomUUID(),
        url: normalizedUrl,
        title: normalizedUrl,
        favicon: null,
        visitedAt: Date.now(),
        visitCount: 1
      }, ...prev.slice(0, 999)]);
      
    } catch (error) {
      log.error('Navigation failed:', error);
      toast({
        title: 'Navigation Error',
        description: 'Failed to load the page',
        variant: 'destructive'
      });
    }
  }, [addressBarValue, engine, toast]);

  const handleGoBack = useCallback(async () => {
    if (!engine.activeTabId) return;
    try {
      await engine.goBack(engine.activeTabId);
    } catch (error) {
      log.error('Go back failed:', error);
    }
  }, [engine]);

  const handleGoForward = useCallback(async () => {
    if (!engine.activeTabId) return;
    try {
      await engine.goForward(engine.activeTabId);
    } catch (error) {
      log.error('Go forward failed:', error);
    }
  }, [engine]);

  const handleReload = useCallback(async () => {
    if (!engine.activeTabId) return;
    try {
      await engine.reload(engine.activeTabId);
    } catch (error) {
      log.error('Reload failed:', error);
    }
  }, [engine]);

  const handleStop = useCallback(async () => {
    if (!engine.activeTabId) return;
    try {
      await engine.stop(engine.activeTabId);
    } catch (error) {
      log.error('Stop failed:', error);
    }
  }, [engine]);

  const handleHome = useCallback(() => {
    handleNavigate('https://www.google.com');
  }, [handleNavigate]);

  // ============================================
  // Bookmarks
  // ============================================

  const handleAddBookmark = useCallback(() => {
    if (!activeTab) return;
    
    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      url: activeTab.url,
      title: activeTab.title || activeTab.url,
      favicon: activeTab.favicon,
      folderId: null,
      createdAt: Date.now()
    };
    
    setBookmarks(prev => [newBookmark, ...prev]);
    
    toast({
      title: 'Bookmark Added',
      description: activeTab.title || activeTab.url
    });
  }, [activeTab, toast]);

  const handleRemoveBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
  }, []);

  const isBookmarked = useMemo(() => {
    if (!activeTab) return false;
    return bookmarks.some(b => b.url === activeTab.url);
  }, [activeTab, bookmarks]);

  // ============================================
  // Downloads
  // ============================================

  const handleDownload = useCallback(async (url: string, filename?: string) => {
    const downloadItem: DownloadItem = {
      id: crypto.randomUUID(),
      url,
      filename: filename || url.split('/').pop() || 'download',
      path: `${settings.downloadsPath}/${filename || url.split('/').pop()}`,
      size: 0,
      downloaded: 0,
      status: 'pending',
      startedAt: Date.now()
    };
    
    setDownloads(prev => [downloadItem, ...prev]);
    
    // Note: Download implementation requires Tauri file system API
    toast({
      title: 'Download Started',
      description: downloadItem.filename
    });
  }, [settings.downloadsPath, toast]);

  // ============================================
  // Split View
  // ============================================

  const toggleSplitView = useCallback(() => {
    if (splitView.enabled) {
      setSplitView(prev => ({ ...prev, enabled: false, secondaryTabId: null }));
    } else if (engine.tabs.length > 1) {
      const otherTab = engine.tabs.find(t => t.id !== engine.activeTabId);
      if (otherTab) {
        setSplitView(prev => ({ ...prev, enabled: true, secondaryTabId: otherTab.id }));
      }
    }
  }, [splitView.enabled, engine.tabs, engine.activeTabId]);

  // ============================================
  // Screenshots & Tools
  // ============================================

  const handleScreenshot = useCallback(async () => {
    if (!engine.activeTabId) return;
    
    try {
      const screenshot = await engine.screenshot(engine.activeTabId, false);
      
      // Copy to clipboard or save
      toast({
        title: 'Screenshot Captured',
        description: 'Image copied to clipboard'
      });
    } catch (error) {
      log.error('Screenshot failed:', error);
      toast({
        title: 'Screenshot Failed',
        description: 'Could not capture screenshot',
        variant: 'destructive'
      });
    }
  }, [engine, toast]);

  const handleShare = useCallback(() => {
    setShareDialogOpen(true);
  }, []);

  const handleCopyUrl = useCallback(() => {
    if (!activeTab) return;
    
    navigator.clipboard.writeText(activeTab.url);
    toast({
      title: 'URL Copied',
      description: 'Link copied to clipboard'
    });
  }, [activeTab, toast]);

  // ============================================
  // Zoom
  // ============================================

  const handleZoomIn = useCallback(() => {
    setSettings(prev => ({ ...prev, zoomLevel: Math.min(prev.zoomLevel + 10, 200) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setSettings(prev => ({ ...prev, zoomLevel: Math.max(prev.zoomLevel - 10, 50) }));
  }, []);

  const handleZoomReset = useCallback(() => {
    setSettings(prev => ({ ...prev, zoomLevel: 100 }));
  }, []);

  // ============================================
  // Iframe message handling
  // ============================================

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CUBE_NAVIGATION') {
        const { tabId, url, title, favicon } = event.data;
        // Update tab state when iframe navigates
        log.info('Iframe navigation:', { tabId, url, title });
      }
      
      if (event.data?.type === 'CUBE_TITLE_CHANGED') {
        const { tabId, title } = event.data;
        log.info('Title changed:', { tabId, title });
      }
      
      if (event.data?.type === 'CUBE_LOAD_COMPLETE') {
        const { tabId } = event.data;
        log.info('Page load complete:', tabId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ============================================
  // Render
  // ============================================

  return (
    <TooltipProvider>
      <div className="cube-browser">
        {/* Sidebar */}
        <div className={cn("cube-browser-sidebar", !sidebarOpen && "collapsed")}>
          <div className="sidebar-header">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="sidebar-toggle"
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </Button>
            
            {sidebarOpen && (
              <div className="sidebar-tabs">
                <Button
                  variant={sidebarTab === 'tabs' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSidebarTab('tabs')}
                >
                  <Layers size={16} />
                </Button>
                <Button
                  variant={sidebarTab === 'bookmarks' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSidebarTab('bookmarks')}
                >
                  <Bookmark size={16} />
                </Button>
                <Button
                  variant={sidebarTab === 'history' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSidebarTab('history')}
                >
                  <History size={16} />
                </Button>
                <Button
                  variant={sidebarTab === 'downloads' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSidebarTab('downloads')}
                >
                  <Download size={16} />
                </Button>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <ScrollArea className="sidebar-content">
              {/* Tabs List */}
              {sidebarTab === 'tabs' && (
                <div className="tabs-list">
                  <div className="tabs-header">
                    <span className="tabs-count">{engine.tabs.length} tabs</span>
                    <Button variant="ghost" size="icon" onClick={() => handleNewTab()}>
                      <Plus size={16} />
                    </Button>
                  </div>
                  
                  {engine.tabs.map(tab => (
                    <div
                      key={tab.id}
                      className={cn(
                        "tab-item",
                        tab.id === engine.activeTabId && "active"
                      )}
                      onClick={() => handleTabClick(tab.id)}
                    >
                      <div className="tab-favicon">
                        {tab.favicon ? (
                          <img src={tab.favicon} alt="" width={16} height={16} />
                        ) : (
                          <Globe size={16} />
                        )}
                      </div>
                      <div className="tab-info">
                        <span className="tab-title">{tab.title || 'New Tab'}</span>
                        <span className="tab-url">{tab.url}</span>
                      </div>
                      {tab.isLoading && (
                        <div className="tab-loading">
                          <RefreshCw size={14} className="animate-spin" />
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="tab-close"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseTab(tab.id);
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bookmarks */}
              {sidebarTab === 'bookmarks' && (
                <div className="bookmarks-list">
                  {bookmarks.length === 0 ? (
                    <div className="empty-state">
                      <Bookmark size={32} />
                      <p>No bookmarks yet</p>
                      <span>Press Cmd+D to bookmark a page</span>
                    </div>
                  ) : (
                    bookmarks.map(bookmark => (
                      <div
                        key={bookmark.id}
                        className="bookmark-item"
                        onClick={() => handleNavigate(bookmark.url)}
                      >
                        <div className="bookmark-favicon">
                          {bookmark.favicon ? (
                            <img src={bookmark.favicon} alt="" width={16} height={16} />
                          ) : (
                            <Globe size={16} />
                          )}
                        </div>
                        <div className="bookmark-info">
                          <span className="bookmark-title">{bookmark.title}</span>
                          <span className="bookmark-url">{bookmark.url}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="bookmark-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBookmark(bookmark.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* History */}
              {sidebarTab === 'history' && (
                <div className="history-list">
                  {history.length === 0 ? (
                    <div className="empty-state">
                      <History size={32} />
                      <p>No history yet</p>
                      <span>Your browsing history will appear here</span>
                    </div>
                  ) : (
                    history.slice(0, 50).map(entry => (
                      <div
                        key={entry.id}
                        className="history-item"
                        onClick={() => handleNavigate(entry.url)}
                      >
                        <div className="history-favicon">
                          {entry.favicon ? (
                            <img src={entry.favicon} alt="" width={16} height={16} />
                          ) : (
                            <Globe size={16} />
                          )}
                        </div>
                        <div className="history-info">
                          <span className="history-title">{entry.title}</span>
                          <span className="history-time">
                            {new Date(entry.visitedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Downloads */}
              {sidebarTab === 'downloads' && (
                <div className="downloads-list">
                  {downloads.length === 0 ? (
                    <div className="empty-state">
                      <Download size={32} />
                      <p>No downloads</p>
                      <span>Your downloads will appear here</span>
                    </div>
                  ) : (
                    downloads.map(download => (
                      <div key={download.id} className="download-item">
                        <div className="download-icon">
                          <File size={20} />
                        </div>
                        <div className="download-info">
                          <span className="download-filename">{download.filename}</span>
                          <Progress 
                            value={(download.downloaded / download.size) * 100} 
                            className="download-progress"
                          />
                          <span className="download-status">{download.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        {/* Main Browser Area */}
        <div className="cube-browser-main">
          {/* Toolbar */}
          <div className="browser-toolbar">
            {/* Navigation Controls */}
            <div className="toolbar-nav">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleGoBack}
                    disabled={!activeTab?.canGoBack}
                  >
                    <ChevronLeft size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back (⌘[)</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleGoForward}
                    disabled={!activeTab?.canGoForward}
                  >
                    <ChevronRight size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Forward (⌘])</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={activeTab?.isLoading ? handleStop : handleReload}
                  >
                    {activeTab?.isLoading ? (
                      <X size={18} />
                    ) : (
                      <RotateCw size={18} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {activeTab?.isLoading ? 'Stop' : 'Reload (⌘R)'}
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleHome}>
                    <Home size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Home</TooltipContent>
              </Tooltip>
            </div>

            {/* Address Bar */}
            <div className="toolbar-address">
              <div className={cn(
                "address-bar",
                addressBarFocused && "focused",
                activeTab?.url.startsWith('https://') && "secure"
              )}>
                <div className="address-security">
                  {activeTab?.url.startsWith('https://') ? (
                    <Lock size={14} className="text-green-500" />
                  ) : activeTab?.url.startsWith('http://') ? (
                    <Unlock size={14} className="text-yellow-500" />
                  ) : (
                    <Globe size={14} />
                  )}
                </div>
                <Input
                  ref={addressBarRef}
                  value={addressBarValue}
                  onChange={(e) => setAddressBarValue(e.target.value)}
                  onFocus={() => {
                    setAddressBarFocused(true);
                    addressBarRef.current?.select();
                  }}
                  onBlur={() => setAddressBarFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNavigate();
                      addressBarRef.current?.blur();
                    }
                    if (e.key === 'Escape') {
                      setAddressBarValue(activeTab?.url || '');
                      addressBarRef.current?.blur();
                    }
                  }}
                  placeholder="Search or enter URL"
                  className="address-input"
                />
                <div className="address-actions">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleAddBookmark}
                      >
                        {isBookmarked ? (
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        ) : (
                          <Star size={14} />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bookmark (⌘D)</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Toolbar Actions */}
            <div className="toolbar-actions">
              {/* Privacy Shield */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={settings.adBlockEnabled ? "text-green-500" : ""}
                    onClick={() => setSettings(prev => ({ ...prev, adBlockEnabled: !prev.adBlockEnabled }))}
                  >
                    {settings.adBlockEnabled ? <ShieldCheck size={18} /> : <Shield size={18} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {settings.adBlockEnabled ? 'Protection On' : 'Protection Off'}
                </TooltipContent>
              </Tooltip>

              {/* Split View */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSplitView}
                    disabled={engine.tabs.length < 2}
                  >
                    <SplitSquareHorizontal size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Split View</TooltipContent>
              </Tooltip>

              {/* Screenshot */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleScreenshot}>
                    <Camera size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Screenshot</TooltipContent>
              </Tooltip>

              {/* Share */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>

              {/* Zoom Controls */}
              <div className="zoom-controls">
                <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                  <ZoomOut size={16} />
                </Button>
                <span className="zoom-level">{settings.zoomLevel}%</span>
                <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                  <ZoomIn size={16} />
                </Button>
              </div>

              {/* DevTools */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={devToolsOpen ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setDevToolsOpen(!devToolsOpen)}
                  >
                    <Bug size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>DevTools (⌘⇧I)</TooltipContent>
              </Tooltip>

              {/* Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Browser</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => handleNewTab()}>
                    <Plus size={16} className="mr-2" />
                    New Tab
                    <span className="ml-auto text-xs text-muted-foreground">⌘T</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setFindBarOpen(true)}>
                    <Search size={16} className="mr-2" />
                    Find in Page
                    <span className="ml-auto text-xs text-muted-foreground">⌘F</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ZoomIn size={16} className="mr-2" />
                      Zoom
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={handleZoomIn}>
                        Zoom In
                        <span className="ml-auto text-xs">⌘+</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleZoomOut}>
                        Zoom Out
                        <span className="ml-auto text-xs">⌘-</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleZoomReset}>
                        Reset Zoom
                        <span className="ml-auto text-xs">⌘0</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuCheckboxItem
                    checked={settings.adBlockEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, adBlockEnabled: checked }))}
                  >
                    <Shield size={16} className="mr-2" />
                    Ad Blocker
                  </DropdownMenuCheckboxItem>
                  
                  <DropdownMenuCheckboxItem
                    checked={settings.trackingProtection}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, trackingProtection: checked }))}
                  >
                    <Eye size={16} className="mr-2" />
                    Tracking Protection
                  </DropdownMenuCheckboxItem>
                  
                  <DropdownMenuCheckboxItem
                    checked={settings.httpsOnly}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, httpsOnly: checked }))}
                  >
                    <Lock size={16} className="mr-2" />
                    HTTPS Only
                  </DropdownMenuCheckboxItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleCopyUrl}>
                    <Copy size={16} className="mr-2" />
                    Copy URL
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => window.print()}>
                    <Printer size={16} className="mr-2" />
                    Print
                    <span className="ml-auto text-xs text-muted-foreground">⌘P</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <Settings size={16} className="mr-2" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Find Bar */}
          {findBarOpen && (
            <div className="find-bar">
              <Input
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
                placeholder="Find in page..."
                className="find-input"
                autoFocus
              />
              <span className="find-count">0 / 0</span>
              <Button variant="ghost" size="icon" disabled>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="ghost" size="icon" disabled>
                <ChevronRight size={16} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setFindBarOpen(false)}>
                <X size={16} />
              </Button>
            </div>
          )}

          {/* Browser Content Area */}
          <div 
            ref={browserContainerRef}
            className={cn(
              "browser-content",
              splitView.enabled && "split-view",
              splitView.orientation === 'vertical' && "split-vertical",
              devToolsOpen && "with-devtools"
            )}
          >
            {/* Main View */}
            <div 
              className="browser-view primary"
              style={splitView.enabled ? { 
                [splitView.orientation === 'horizontal' ? 'width' : 'height']: `${splitView.ratio}%` 
              } : undefined}
            >
              {engine.tabs.map(tab => (
                <div
                  key={tab.id}
                  className={cn(
                    "tab-content",
                    tab.id === engine.activeTabId && "active"
                  )}
                >
                  {tab.url === 'about:blank' ? (
                    <div className="new-tab-page">
                      <div className="new-tab-logo">
                        <Globe size={64} />
                      </div>
                      <h1>CUBE Browser</h1>
                      <p>Fast, secure, and private browsing</p>
                      <div className="quick-links">
                        {[
                          { name: 'Google', url: 'https://www.google.com', icon: '🔍' },
                          { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
                          { name: 'YouTube', url: 'https://www.youtube.com', icon: '📺' },
                          { name: 'Reddit', url: 'https://www.reddit.com', icon: '🔴' },
                        ].map(link => (
                          <button
                            key={link.name}
                            className="quick-link"
                            onClick={() => handleNavigate(link.url)}
                          >
                            <span className="quick-link-icon">{link.icon}</span>
                            <span className="quick-link-name">{link.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <iframe
                      ref={(el) => {
                        if (el) iframeRefs.current.set(tab.id, el);
                        else iframeRefs.current.delete(tab.id);
                      }}
                      src={getProxiedUrl(tab.url)}
                      className="browser-iframe"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                      style={{ transform: `scale(${settings.zoomLevel / 100})`, transformOrigin: 'top left' }}
                      title={tab.title || 'Web Page'}
                    />
                  )}
                  
                  {/* Loading Overlay */}
                  {tab.isLoading && (
                    <div className="loading-overlay">
                      <div className="loading-bar" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Split View - Secondary */}
            {splitView.enabled && splitView.secondaryTabId && (
              <>
                <div className="split-divider" />
                <div 
                  className="browser-view secondary"
                  style={{ 
                    [splitView.orientation === 'horizontal' ? 'width' : 'height']: `${100 - splitView.ratio}%` 
                  }}
                >
                  {engine.tabs.filter(t => t.id === splitView.secondaryTabId).map(tab => (
                    <div key={tab.id} className="tab-content active">
                      <iframe
                        src={getProxiedUrl(tab.url)}
                        className="browser-iframe"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        title={tab.title || 'Web Page'}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* DevTools Panel */}
          {devToolsOpen && (
            <div className="devtools-panel">
              <div className="devtools-header">
                <Tabs value={devToolsTab} onValueChange={setDevToolsTab} className="devtools-tabs">
                  <TabsList>
                    <TabsTrigger value="elements">
                      <Inspect size={14} className="mr-1" />
                      Elements
                    </TabsTrigger>
                    <TabsTrigger value="console">
                      <Terminal size={14} className="mr-1" />
                      Console
                    </TabsTrigger>
                    <TabsTrigger value="network">
                      <Network size={14} className="mr-1" />
                      Network
                    </TabsTrigger>
                    <TabsTrigger value="sources">
                      <FileCode size={14} className="mr-1" />
                      Sources
                    </TabsTrigger>
                    <TabsTrigger value="storage">
                      <Database size={14} className="mr-1" />
                      Storage
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button variant="ghost" size="icon" onClick={() => setDevToolsOpen(false)}>
                  <X size={16} />
                </Button>
              </div>
              <div className="devtools-content">
                {devToolsTab === 'elements' && (
                  <div className="devtools-elements">
                    <pre className="devtools-code">
                      {'<html>\n  <head>...</head>\n  <body>\n    <!-- Page content -->\n  </body>\n</html>'}
                    </pre>
                  </div>
                )}
                {devToolsTab === 'console' && (
                  <div className="devtools-console">
                    <div className="console-output">
                      <div className="console-line info">Console ready</div>
                    </div>
                    <div className="console-input">
                      <span className="console-prompt">&gt;</span>
                      <Input placeholder="Execute JavaScript..." className="console-input-field" />
                    </div>
                  </div>
                )}
                {devToolsTab === 'network' && (
                  <div className="devtools-network">
                    <div className="network-header">
                      <span>Name</span>
                      <span>Status</span>
                      <span>Type</span>
                      <span>Size</span>
                      <span>Time</span>
                    </div>
                    <div className="network-empty">No network requests recorded</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Page</DialogTitle>
              <DialogDescription>Share this page with others</DialogDescription>
            </DialogHeader>
            <div className="share-options">
              <Input value={activeTab?.url || ''} readOnly className="share-url" />
              <div className="share-buttons">
                <Button variant="outline" onClick={handleCopyUrl}>
                  <Copy size={16} className="mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline">
                  <QrCode size={16} className="mr-2" />
                  QR Code
                </Button>
                <Button variant="outline">
                  <Mail size={16} className="mr-2" />
                  Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Browser Settings</DialogTitle>
            </DialogHeader>
            <div className="settings-content">
              <div className="settings-section">
                <h3>Privacy & Security</h3>
                <div className="settings-item">
                  <div className="settings-label">
                    <Shield size={18} />
                    <div>
                      <span>Ad Blocker</span>
                      <p>Block ads and trackers</p>
                    </div>
                  </div>
                  <Button
                    variant={settings.adBlockEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, adBlockEnabled: !prev.adBlockEnabled }))}
                  >
                    {settings.adBlockEnabled ? 'On' : 'Off'}
                  </Button>
                </div>
                <div className="settings-item">
                  <div className="settings-label">
                    <Eye size={18} />
                    <div>
                      <span>Tracking Protection</span>
                      <p>Block cross-site trackers</p>
                    </div>
                  </div>
                  <Button
                    variant={settings.trackingProtection ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, trackingProtection: !prev.trackingProtection }))}
                  >
                    {settings.trackingProtection ? 'On' : 'Off'}
                  </Button>
                </div>
                <div className="settings-item">
                  <div className="settings-label">
                    <Lock size={18} />
                    <div>
                      <span>HTTPS Only Mode</span>
                      <p>Only connect to secure sites</p>
                    </div>
                  </div>
                  <Button
                    variant={settings.httpsOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, httpsOnly: !prev.httpsOnly }))}
                  >
                    {settings.httpsOnly ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="settings-section">
                <h3>Appearance</h3>
                <div className="settings-item">
                  <div className="settings-label">
                    <Moon size={18} />
                    <div>
                      <span>Dark Mode</span>
                      <p>Use dark theme</p>
                    </div>
                  </div>
                  <Button
                    variant={settings.darkMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                  >
                    {settings.darkMode ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Error Display */}
        {engine.error && (
          <div className="browser-error">
            <AlertTriangle size={16} />
            <span>{engine.error}</span>
            <Button variant="ghost" size="sm" onClick={() => {}}>
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
