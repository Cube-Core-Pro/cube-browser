/**
 * CUBE Web Engine View - True Embedded Browser Component
 * 
 * This component provides a REAL embedded browser experience using:
 * - Backend HTTP fetching (bypasses CORS completely)
 * - Sandboxed iframe rendering (content rendered inside app)
 * - Full DOM manipulation capabilities
 * - Real navigation history
 * - Tab management
 * 
 * Unlike WebviewWindow (creates external windows), this renders
 * content INSIDE the application window.
 * 
 * @author CUBE Team
 * @version 2.0.0
 */

"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { logger } from '@/lib/services/logger-service';
import { cn } from '@/lib/utils';
import { 
  X, Plus, Globe, RotateCw, ChevronLeft, ChevronRight,
  Home, Lock, Shield, Star, Settings,
  Download, Share2, Copy, Check, Camera,
  Volume2, VolumeX, Maximize2, Minimize2,
  Eye, EyeOff, Code2, Terminal, AlertCircle,
  Loader2, ExternalLink, PanelLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const log = logger.scope('CubeWebEngine');

// ============================================
// Types
// ============================================

interface CubeTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  loading: boolean;
  can_go_back: boolean;
  can_go_forward: boolean;
  is_active: boolean;
  created_at: string;
  bounds: TabBounds;
  scroll_position: { x: number; y: number };
  zoom_level: number;
  muted?: boolean;
  pinned?: boolean;
}

interface TabBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PageContent {
  html: string;
  base_url: string;
  scripts: string[];
  styles: string[];
  title?: string;
  favicon?: string;
  content_type: string;
  status_code: number;
}

interface NavigationEvent {
  tab_id: string;
  url: string;
  title?: string;
  favicon?: string;
}

interface EngineConfig {
  user_agent: string;
  proxy_url?: string;
  default_headers: Record<string, string>;
  enable_javascript: boolean;
  enable_cookies: boolean;
  enable_cache: boolean;
  timeout_ms: number;
}

// ============================================
// CUBE Web Engine View Component
// ============================================

interface CubeWebEngineViewProps {
  className?: string;
  onNavigate?: (url: string, tabId: string) => void;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  initialUrl?: string;
  showSidebar?: boolean;
}

export const CubeWebEngineView: React.FC<CubeWebEngineViewProps> = ({
  className,
  onNavigate,
  onTabChange,
  onTabClose,
  initialUrl = 'https://www.google.com',
  showSidebar = true
}) => {
  // State
  const [tabs, setTabs] = useState<CubeTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(!showSidebar);
  const [pageContent, setPageContent] = useState<Record<string, PageContent>>({});
  
  // Security state
  const [isSecure, setIsSecure] = useState(false);
  
  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  
  // Active tab
  const activeTab = useMemo(() => {
    return tabs.find(t => t.id === activeTabId) || null;
  }, [tabs, activeTabId]);

  // ============================================
  // Event Listeners
  // ============================================

  useEffect(() => {
    const unsubscribers: UnlistenFn[] = [];

    const setupListeners = async () => {
      try {
        // Tab created event
        const unsub1 = await listen<{ tab: CubeTab }>('cube-engine-tab-created', (event) => {
          log.info('Tab created:', event.payload.tab.id);
          setTabs(prev => [...prev, event.payload.tab]);
          setActiveTabId(event.payload.tab.id);
        });
        unsubscribers.push(unsub1);

        // Navigation completed event
        const unsub2 = await listen<NavigationEvent>('cube-engine-navigation-completed', (event) => {
          log.info('Navigation completed:', event.payload.url);
          setTabs(prev => prev.map(tab => 
            tab.id === event.payload.tab_id 
              ? { 
                  ...tab, 
                  url: event.payload.url,
                  title: event.payload.title || tab.title,
                  favicon: event.payload.favicon || tab.favicon,
                  loading: false
                }
              : tab
          ));
          setIsLoading(false);
          
          // Check if URL is secure
          setIsSecure(event.payload.url.startsWith('https://'));
        });
        unsubscribers.push(unsub2);

        // Tab updated event
        const unsub3 = await listen<{ tab_id: string; updates: Partial<CubeTab> }>('cube-engine-tab-updated', (event) => {
          setTabs(prev => prev.map(tab =>
            tab.id === event.payload.tab_id
              ? { ...tab, ...event.payload.updates }
              : tab
          ));
        });
        unsubscribers.push(unsub3);

        // Tab closed event
        const unsub4 = await listen<{ tab_id: string }>('cube-engine-tab-closed', (event) => {
          log.info('Tab closed:', event.payload.tab_id);
          setTabs(prev => {
            const filtered = prev.filter(t => t.id !== event.payload.tab_id);
            if (activeTabId === event.payload.tab_id && filtered.length > 0) {
              setActiveTabId(filtered[filtered.length - 1].id);
            } else if (filtered.length === 0) {
              setActiveTabId(null);
            }
            return filtered;
          });
          // Clean up page content
          setPageContent(prev => {
            const { [event.payload.tab_id]: removed, ...rest } = prev;
            return rest;
          });
        });
        unsubscribers.push(unsub4);

        // Page content loaded event
        const unsub5 = await listen<{ tab_id: string; content: PageContent }>('cube-engine-content-loaded', (event) => {
          log.info('Content loaded for tab:', event.payload.tab_id);
          setPageContent(prev => ({
            ...prev,
            [event.payload.tab_id]: event.payload.content
          }));
        });
        unsubscribers.push(unsub5);

        // Error event
        const unsub6 = await listen<{ tab_id: string; error: string }>('cube-engine-error', (event) => {
          log.error('Engine error:', event.payload.error);
          setError(event.payload.error);
          setIsLoading(false);
        });
        unsubscribers.push(unsub6);

      } catch (err) {
        log.error('Failed to setup event listeners:', err);
      }
    };

    setupListeners();

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [activeTabId]);

  // ============================================
  // Initialize with first tab
  // ============================================

  useEffect(() => {
    const initializeEngine = async () => {
      try {
        log.info('Initializing CUBE Web Engine...');
        
        // Create initial tab
        const tab = await invoke<CubeTab>('cube_engine_create_tab', {
          url: initialUrl,
          bounds: {
            x: 0,
            y: 0,
            width: 800,
            height: 600
          }
        });
        
        setTabs([tab]);
        setActiveTabId(tab.id);
        setUrlInput(initialUrl);
        
        // Fetch initial page
        if (initialUrl && initialUrl !== 'about:blank') {
          await navigateToUrl(tab.id, initialUrl);
        }
        
        log.info('CUBE Web Engine initialized successfully');
      } catch (err) {
        log.error('Failed to initialize engine:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize browser engine');
      }
    };

    initializeEngine();

    // Cleanup on unmount
    return () => {
      invoke('cube_engine_close_all_tabs').catch(log.error);
    };
  }, [initialUrl]);

  // ============================================
  // Navigation Functions
  // ============================================

  const navigateToUrl = useCallback(async (tabId: string, url: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Normalize URL
      let normalizedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
        // Check if it looks like a domain
        if (url.includes('.') && !url.includes(' ')) {
          normalizedUrl = `https://${url}`;
        } else {
          // Treat as search query
          normalizedUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
        }
      }

      log.info(`Navigating to: ${normalizedUrl}`);

      // Fetch page content from backend
      const content = await invoke<PageContent>('cube_engine_fetch_page', {
        tabId,
        url: normalizedUrl
      });

      // Store content
      setPageContent(prev => ({
        ...prev,
        [tabId]: content
      }));

      // Update tab
      setTabs(prev => prev.map(tab =>
        tab.id === tabId
          ? {
              ...tab,
              url: normalizedUrl,
              title: content.title || normalizedUrl,
              favicon: content.favicon,
              loading: false,
              can_go_back: true
            }
          : tab
      ));

      setUrlInput(normalizedUrl);
      setIsSecure(normalizedUrl.startsWith('https://'));
      setIsLoading(false);

      // Render content in iframe
      renderContentInIframe(content, normalizedUrl);

      onNavigate?.(normalizedUrl, tabId);

    } catch (err) {
      log.error('Navigation failed:', err);
      setError(err instanceof Error ? err.message : 'Navigation failed');
      setIsLoading(false);
      
      // Show error page
      renderErrorPage(err instanceof Error ? err.message : 'Failed to load page');
    }
  }, [onNavigate]);

  const renderContentInIframe = useCallback((content: PageContent, baseUrl: string) => {
    if (!iframeRef.current) return;

    try {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!doc) {
        log.error('Cannot access iframe document');
        return;
      }

      // Inject base tag and content
      const processedHtml = processHtmlContent(content.html, baseUrl);
      
      // Write to iframe
      doc.open();
      doc.write(processedHtml);
      doc.close();

      // Inject our monitoring scripts
      injectMonitoringScripts(doc);

      log.info('Content rendered in iframe successfully');

    } catch (err) {
      log.error('Failed to render content:', err);
      renderErrorPage('Failed to render page content');
    }
  }, []);

  const processHtmlContent = useCallback((html: string, baseUrl: string): string => {
    // Parse base URL
    let origin = '';
    try {
      const urlObj = new URL(baseUrl);
      origin = urlObj.origin;
    } catch {
      origin = baseUrl;
    }

    // Add base tag for relative URLs
    const baseTag = `<base href="${origin}/" target="_self">`;
    
    // Inject base tag after <head>
    let processedHtml = html;
    if (processedHtml.includes('<head>')) {
      processedHtml = processedHtml.replace('<head>', `<head>\n${baseTag}`);
    } else if (processedHtml.includes('<HEAD>')) {
      processedHtml = processedHtml.replace('<HEAD>', `<HEAD>\n${baseTag}`);
    } else {
      // No head tag, prepend base tag
      processedHtml = `${baseTag}\n${html}`;
    }

    // Add styles to ensure content fits in iframe
    const styleTag = `
      <style>
        html, body {
          margin: 0;
          padding: 0;
          overflow: auto;
          width: 100%;
          height: 100%;
        }
        /* Prevent content from breaking out */
        * {
          max-width: 100%;
          box-sizing: border-box;
        }
      </style>
    `;

    if (processedHtml.includes('</head>')) {
      processedHtml = processedHtml.replace('</head>', `${styleTag}</head>`);
    } else if (processedHtml.includes('</HEAD>')) {
      processedHtml = processedHtml.replace('</HEAD>', `${styleTag}</HEAD>`);
    }

    return processedHtml;
  }, []);

  const injectMonitoringScripts = useCallback((doc: Document) => {
    // Inject script to intercept link clicks
    const script = doc.createElement('script');
    script.textContent = `
      (function() {
        // Intercept all link clicks
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link && link.href) {
            e.preventDefault();
            e.stopPropagation();
            
            // Send to parent
            window.parent.postMessage({
              type: 'CUBE_NAVIGATE',
              url: link.href
            }, '*');
          }
        }, true);

        // Intercept form submissions
        document.addEventListener('submit', function(e) {
          const form = e.target;
          if (form && form.action) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const params = new URLSearchParams();
            formData.forEach((value, key) => params.append(key, value.toString()));
            
            const url = form.method.toLowerCase() === 'get' 
              ? form.action + '?' + params.toString()
              : form.action;
            
            window.parent.postMessage({
              type: 'CUBE_NAVIGATE',
              url: url,
              method: form.method,
              data: Object.fromEntries(formData)
            }, '*');
          }
        }, true);

        // Report title changes
        const originalTitle = document.title;
        new MutationObserver(function() {
          if (document.title !== originalTitle) {
            window.parent.postMessage({
              type: 'CUBE_TITLE_CHANGE',
              title: document.title
            }, '*');
          }
        }).observe(document.querySelector('title') || document.head, { 
          childList: true, 
          subtree: true,
          characterData: true 
        });

        // Report initial title
        window.parent.postMessage({
          type: 'CUBE_TITLE_CHANGE',
          title: document.title
        }, '*');

        // Capture console logs
        const originalConsole = { ...console };
        ['log', 'warn', 'error', 'info'].forEach(method => {
          console[method] = function(...args) {
            originalConsole[method].apply(console, args);
            window.parent.postMessage({
              type: 'CUBE_CONSOLE',
              method: method,
              args: args.map(a => String(a))
            }, '*');
          };
        });

        console.log('[CUBE Engine] Monitoring scripts injected');
      })();
    `;
    doc.body?.appendChild(script);
  }, []);

  const renderErrorPage = useCallback((errorMessage: string) => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!doc) return;

    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
          }
          .error-container {
            text-align: center;
            max-width: 500px;
          }
          .error-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 16px;
            color: #ff6b6b;
          }
          p {
            font-size: 16px;
            color: #a0a0a0;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .error-details {
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 16px;
            font-family: monospace;
            font-size: 14px;
            text-align: left;
            color: #ff6b6b;
            word-break: break-all;
          }
          button {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
          }
          button:hover {
            background: #4338ca;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h1>Unable to Load Page</h1>
          <p>The page could not be loaded. This might be due to network issues, the site blocking requests, or an invalid URL.</p>
          <div class="error-details">${errorMessage}</div>
          <button onclick="window.parent.postMessage({ type: 'CUBE_RETRY' }, '*')">
            Try Again
          </button>
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(errorHtml);
    doc.close();
  }, []);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.data || !event.data.type) return;

      switch (event.data.type) {
        case 'CUBE_NAVIGATE':
          if (activeTabId && event.data.url) {
            await navigateToUrl(activeTabId, event.data.url);
          }
          break;

        case 'CUBE_TITLE_CHANGE':
          if (activeTabId && event.data.title) {
            setTabs(prev => prev.map(tab =>
              tab.id === activeTabId
                ? { ...tab, title: event.data.title }
                : tab
            ));
          }
          break;

        case 'CUBE_RETRY':
          if (activeTab?.url) {
            await navigateToUrl(activeTabId!, activeTab.url);
          }
          break;

        case 'CUBE_CONSOLE':
          // Log to our logger - map console methods to logger methods
          const consoleMethod = event.data.method as 'log' | 'warn' | 'error' | 'info';
          const loggerMethod = consoleMethod === 'log' ? 'info' : consoleMethod;
          log[loggerMethod](`[Page Console] ${event.data.args.join(' ')}`);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTabId, activeTab, navigateToUrl]);

  // ============================================
  // Tab Management
  // ============================================

  const createNewTab = useCallback(async (url?: string) => {
    try {
      const tab = await invoke<CubeTab>('cube_engine_create_tab', {
        url: url || 'about:blank',
        bounds: {
          x: 0,
          y: 0,
          width: contentContainerRef.current?.clientWidth || 800,
          height: contentContainerRef.current?.clientHeight || 600
        }
      });

      setTabs(prev => [...prev, tab]);
      setActiveTabId(tab.id);
      setUrlInput(url || '');
      
      if (url && url !== 'about:blank') {
        await navigateToUrl(tab.id, url);
      }

      onTabChange?.(tab.id);
    } catch (err) {
      log.error('Failed to create tab:', err);
      setError(err instanceof Error ? err.message : 'Failed to create tab');
    }
  }, [navigateToUrl, onTabChange]);

  const closeTab = useCallback(async (tabId: string) => {
    try {
      await invoke('cube_engine_close_tab', { tabId });
      
      setTabs(prev => {
        const filtered = prev.filter(t => t.id !== tabId);
        if (activeTabId === tabId && filtered.length > 0) {
          setActiveTabId(filtered[filtered.length - 1].id);
        } else if (filtered.length === 0) {
          // Create new tab if all closed
          createNewTab();
        }
        return filtered;
      });

      // Clean up content
      setPageContent(prev => {
        const { [tabId]: removed, ...rest } = prev;
        return rest;
      });

      onTabClose?.(tabId);
    } catch (err) {
      log.error('Failed to close tab:', err);
    }
  }, [activeTabId, createNewTab, onTabClose]);

  const switchTab = useCallback(async (tabId: string) => {
    try {
      await invoke('cube_engine_set_active_tab', { tabId });
      setActiveTabId(tabId);
      
      const tab = tabs.find(t => t.id === tabId);
      if (tab) {
        setUrlInput(tab.url);
        setIsSecure(tab.url.startsWith('https://'));
        
        // Re-render content if we have it
        const content = pageContent[tabId];
        if (content) {
          renderContentInIframe(content, tab.url);
        }
      }

      onTabChange?.(tabId);
    } catch (err) {
      log.error('Failed to switch tab:', err);
    }
  }, [tabs, pageContent, renderContentInIframe, onTabChange]);

  // ============================================
  // Navigation Controls
  // ============================================

  const goBack = useCallback(async () => {
    if (!activeTabId) return;
    try {
      const result = await invoke<{ success: boolean; url?: string }>('cube_engine_go_back', { tabId: activeTabId });
      if (result.success && result.url) {
        await navigateToUrl(activeTabId, result.url);
      }
    } catch (err) {
      log.error('Failed to go back:', err);
    }
  }, [activeTabId, navigateToUrl]);

  const goForward = useCallback(async () => {
    if (!activeTabId) return;
    try {
      const result = await invoke<{ success: boolean; url?: string }>('cube_engine_go_forward', { tabId: activeTabId });
      if (result.success && result.url) {
        await navigateToUrl(activeTabId, result.url);
      }
    } catch (err) {
      log.error('Failed to go forward:', err);
    }
  }, [activeTabId, navigateToUrl]);

  const reload = useCallback(async () => {
    if (!activeTabId || !activeTab?.url) return;
    await navigateToUrl(activeTabId, activeTab.url);
  }, [activeTabId, activeTab, navigateToUrl]);

  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim() && activeTabId) {
      navigateToUrl(activeTabId, urlInput.trim());
    }
  }, [urlInput, activeTabId, navigateToUrl]);

  const goHome = useCallback(() => {
    if (activeTabId) {
      navigateToUrl(activeTabId, 'https://www.google.com');
    }
  }, [activeTabId, navigateToUrl]);

  // ============================================
  // Render
  // ============================================

  return (
    <TooltipProvider>
      <div className={cn(
        "flex flex-col h-full bg-background",
        className
      )}>
        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 border-b">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-5" />

          {/* Tabs */}
          <ScrollArea className="flex-1">
            <div className="flex items-center gap-1">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors min-w-[120px] max-w-[200px]",
                    tab.id === activeTabId
                      ? "bg-background shadow-sm"
                      : "hover:bg-muted"
                  )}
                  onClick={() => switchTab(tab.id)}
                >
                  {tab.loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                  ) : tab.favicon ? (
                    <img 
                      src={tab.favicon} 
                      alt="" 
                      className="h-3.5 w-3.5 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  
                  <span className="text-xs truncate flex-1">
                    {tab.title || 'New Tab'}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* New Tab Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => createNewTab()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Tab</TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-background border-b">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={goBack}
                  disabled={!activeTab?.can_go_back}
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
                  onClick={goForward}
                  disabled={!activeTab?.can_go_forward}
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
                  onClick={reload}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCw className="h-4 w-4" />
                  )}
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
                  onClick={goHome}
                >
                  <Home className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Home</TooltipContent>
            </Tooltip>
          </div>

          {/* URL Bar */}
          <form onSubmit={handleUrlSubmit} className="flex-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {isSecure ? (
                  <Lock className="h-4 w-4 text-green-500" />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <Input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onFocus={() => setIsUrlFocused(true)}
                onBlur={() => setIsUrlFocused(false)}
                placeholder="Search or enter URL..."
                className={cn(
                  "pl-10 pr-10 h-9 bg-muted/50",
                  isUrlFocused && "ring-2 ring-primary"
                )}
              />
              {urlInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setUrlInput('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Star className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bookmark</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Downloads</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Code2 className="h-4 w-4 mr-2" />
                  View Page Source
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Terminal className="h-4 w-4 mr-2" />
                  Developer Tools
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive border-b">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm flex-1">{error}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setError(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Content Area */}
        <div ref={contentContainerRef} className="flex-1 relative bg-white">
          {tabs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">CUBE Web Engine</h2>
                <p className="text-muted-foreground mb-4">True embedded browser - no external windows</p>
                <Button onClick={() => createNewTab('https://www.google.com')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Open New Tab
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              title="CUBE Web Engine"
            />
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-muted/30 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading {activeTab?.url}...</span>
              </>
            ) : activeTab?.url ? (
              <span className="truncate max-w-[400px]">{activeTab.url}</span>
            ) : (
              <span>Ready</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-xs">
              CUBE Engine v2.0
            </Badge>
            <span>{tabs.length} tab{tabs.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CubeWebEngineView;
