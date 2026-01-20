"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Plus, Globe, RotateCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TabService, BrowserActionsService } from '@/lib/services/browser-service';
import { logger } from '@/lib/services/logger-service';
import { useRouter } from 'next/navigation';
import { BrowserToolbar } from './BrowserToolbar';

const log = logger.scope('BrowserWindow');
const PROXY_PORT = 9876;
const PROXY_BASE = `http://127.0.0.1:${PROXY_PORT}`;

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  displayUrl: string;
  favicon?: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  error?: string;
  history: string[];
  historyIndex: number;
}

interface BrowserWindowProps {
  className?: string;
}

/**
 * Convert a URL to go through the proxy
 */
const getProxiedUrl = (url: string): string => {
  if (!url || url === 'about:blank' || url.startsWith(PROXY_BASE)) {
    return url;
  }
  // Ensure URL is properly formatted
  let formattedUrl = url;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }
  return `${PROXY_BASE}/proxy?url=${encodeURIComponent(formattedUrl)}`;
};

interface BrowserWindowProps {
  className?: string;
}

export const BrowserWindow: React.FC<BrowserWindowProps> = ({ className }) => {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [proxyStatus, setProxyStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-initial',
      title: 'New Tab',
      url: 'about:blank',
      displayUrl: '',
      loading: false,
      canGoBack: false,
      canGoForward: false,
      history: [],
      historyIndex: -1,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-initial');

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Check proxy health on mount
  useEffect(() => {
    const checkProxy = async () => {
      try {
        const response = await fetch(`${PROXY_BASE}/health`, { 
          method: 'GET',
          mode: 'cors',
        });
        setProxyStatus(response.ok ? 'online' : 'offline');
      } catch (error) {
        log.warn('Proxy not available:', error);
        setProxyStatus('offline');
      }
    };
    checkProxy();
    const interval = setInterval(checkProxy, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Handle messages from iframe (CUBE injected script)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'cube-browser-light' && event.data.source !== 'cube-browser') {
        // Also handle messages without source (direct from CUBE script)
        if (!event.data?.type?.startsWith('CUBE_')) {
          return;
        }
      }
      
      const { type, data, payload } = event.data;
      const messageData = data || payload;
      
      switch (type) {
        case 'CUBE_NAVIGATE':
          if (messageData?.url) {
            handleNavigate(messageData.url);
          }
          break;
        case 'CUBE_PAGE_READY':
          if (messageData && activeTab) {
            setTabs(prev => prev.map(tab => 
              tab.id === activeTabId 
                ? { 
                    ...tab, 
                    loading: false, 
                    title: messageData.title || tab.title,
                    favicon: messageData.favicon || tab.favicon 
                  }
                : tab
            ));
          }
          break;
        case 'CUBE_OPEN_TAB':
          if (messageData?.url) {
            handleNewTabWithUrl(messageData.url);
          }
          break;
        case 'CUBE_FORM_SUBMIT':
          // Handle form submission - build URL and navigate
          if (messageData?.url && messageData?.method === 'GET') {
            // For GET forms (like search), build URL with query params
            const params = new URLSearchParams();
            if (messageData.data) {
              Object.entries(messageData.data).forEach(([key, value]) => {
                if (typeof value === 'string') {
                  params.append(key, value);
                }
              });
            }
            const separator = messageData.url.includes('?') ? '&' : '?';
            const fullUrl = `${messageData.url}${separator}${params.toString()}`;
            log.debug('[CUBE] Form GET navigation:', fullUrl);
            handleNavigate(fullUrl);
          } else if (messageData?.url) {
            // For POST forms, just navigate to the action URL
            log.debug('[CUBE] Form POST navigation:', messageData.url);
            handleNavigate(messageData.url);
          }
          break;
        default:
          console.debug('[CUBE] Message:', type, messageData);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, activeTab]);

  const handleNewTabWithUrl = useCallback((url: string) => {
    const timestamp = Date.now();
    const cleanId = `tab-${timestamp}`;
    
    const newTab: BrowserTab = {
      id: cleanId,
      title: 'Loading...',
      url: getProxiedUrl(url),
      displayUrl: url,
      loading: true,
      canGoBack: false,
      canGoForward: false,
      history: [url],
      historyIndex: 0,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(cleanId);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBackToDashboard = () => {
    router.push('/');
  };

  const handleDownload = async () => {
    try {
      if (activeTab && typeof window !== 'undefined' && '__TAURI__' in window) {
        await BrowserActionsService.downloadPage(activeTab.url);
        log.debug('✅ Descarga iniciada');
      }
    } catch (error) {
      log.error('❌ Error al descargar:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      if (activeTab && typeof window !== 'undefined' && '__TAURI__' in window) {
        await BrowserActionsService.addBookmark(activeTab.url, activeTab.title);
        log.debug('✅ Marcador agregado');
      }
    } catch (error) {
      log.error('❌ Error al agregar marcador:', error);
    }
  };

  const handleShare = async () => {
    try {
      if (activeTab && navigator.share) {
        await navigator.share({
          title: activeTab.title,
          url: activeTab.url
        });
      }
    } catch (error) {
      log.error('❌ Error al compartir:', error);
    }
  };

  const handlePrint = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        await BrowserActionsService.printPage();
        log.debug('🖨️ Impresión iniciada');
      }
    } catch (error) {
      log.error('❌ Error al imprimir:', error);
    }
  };

  const handleExtractData = () => {
    router.push(`/automation?url=${encodeURIComponent(activeTab?.url || '')}`);
  };

  const handleNewTab = async () => {
    // Generate a clean ID without dots (only alphanumeric, -, /, :, _)
    const timestamp = Date.now();
    const cleanId = `tab-${timestamp}`;
    
    const newTab: BrowserTab = {
      id: cleanId,
      title: 'New Tab',
      url: 'about:blank',
      displayUrl: '',
      loading: false,
      canGoBack: false,
      canGoForward: false,
      history: [],
      historyIndex: -1,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(cleanId);

    // Create browser tab in backend if the new tab should load a URL
    if (newTab.url !== 'about:blank') {
      try {
        await TabService.create(newTab.displayUrl);
      } catch (error) {
        log.error('Failed to create browser tab:', error);
      }
    }
  };

  const handleCloseTab = async (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (tabs.length === 1) {
      handleNewTab();
    }

    // Close browser tab in backend if exists
    try {
      await TabService.close(tabId);
    } catch (error) {
      log.error('Failed to close browser tab:', error);
    }
    
    const filteredTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(filteredTabs);
    
    if (activeTabId === tabId && filteredTabs.length > 0) {
      const currentIndex = tabs.findIndex(tab => tab.id === tabId);
      const newActiveTab = filteredTabs[Math.min(currentIndex, filteredTabs.length - 1)];
      setActiveTabId(newActiveTab.id);
    }
  };

  const handleNavigate = useCallback(async (url: string) => {
    if (!activeTab) return;
    
    // Validate and format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://') && formattedUrl !== 'about:blank') {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    // Get proxied URL for the iframe
    const proxiedUrl = formattedUrl === 'about:blank' ? 'about:blank' : getProxiedUrl(formattedUrl);
    
    // Update history
    const newHistory = [...(activeTab.history || []).slice(0, (activeTab.historyIndex || 0) + 1), formattedUrl];
    const newHistoryIndex = newHistory.length - 1;
    
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? { 
            ...tab, 
            url: proxiedUrl, 
            displayUrl: formattedUrl,
            loading: true, 
            title: 'Loading...',
            history: newHistory,
            historyIndex: newHistoryIndex,
            canGoBack: newHistoryIndex > 0,
            canGoForward: false,
            error: undefined,
          }
        : tab
    ));
    
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        // Use navigate_tab if tab already exists, create_browser_tab if new
        if (activeTab.displayUrl === '' || activeTab.url === 'about:blank') {
          // Create new tab
          await TabService.create(formattedUrl);
        } else {
          // Navigate existing tab
          await TabService.navigate(activeTabId, formattedUrl);
        }
      }
    } catch (error) {
      log.error('Navigation failed:', error);
      setTabs(tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, loading: false, title: 'Navigation Failed', error: String(error) }
          : tab
      ));
    }
  }, [activeTab, activeTabId, tabs]);

  const handleGoBack = useCallback(async () => {
    if (!activeTab || !activeTab.canGoBack || activeTab.historyIndex <= 0) return;
    
    const newIndex = activeTab.historyIndex - 1;
    const previousUrl = activeTab.history[newIndex];
    const proxiedUrl = getProxiedUrl(previousUrl);
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { 
            ...tab, 
            url: proxiedUrl,
            displayUrl: previousUrl,
            historyIndex: newIndex,
            canGoBack: newIndex > 0,
            canGoForward: true,
            loading: true,
          }
        : tab
    ));
    
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        await TabService.goBack(activeTabId);
      }
    } catch (error) {
      log.error('Go back failed:', error);
    }
  }, [activeTab, activeTabId]);

  const handleGoForward = useCallback(async () => {
    if (!activeTab || !activeTab.canGoForward || activeTab.historyIndex >= activeTab.history.length - 1) return;
    
    const newIndex = activeTab.historyIndex + 1;
    const nextUrl = activeTab.history[newIndex];
    const proxiedUrl = getProxiedUrl(nextUrl);
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { 
            ...tab, 
            url: proxiedUrl,
            displayUrl: nextUrl,
            historyIndex: newIndex,
            canGoBack: true,
            canGoForward: newIndex < activeTab.history.length - 1,
            loading: true,
          }
        : tab
    ));
    
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        await TabService.goForward(activeTabId);
      }
    } catch (error) {
      log.error('Go forward failed:', error);
    }
  }, [activeTab, activeTabId]);

  const handleReload = useCallback(async () => {
    if (!activeTab) return;
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, loading: true, error: undefined } : tab
    ));
    
    // Force iframe reload by adding a timestamp
    const currentUrl = activeTab.displayUrl;
    if (currentUrl && currentUrl !== 'about:blank' && iframeRef.current) {
      const proxiedUrl = getProxiedUrl(currentUrl);
      iframeRef.current.src = proxiedUrl + (proxiedUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
    }
    
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        await TabService.reload(activeTabId);
      }
      setTimeout(() => {
        setTabs(prev => prev.map(tab => 
          tab.id === activeTabId ? { ...tab, loading: false } : tab
        ));
      }, 1000);
    } catch (error) {
      log.error('Reload failed:', error);
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId ? { ...tab, loading: false } : tab
      ));
    }
  }, [activeTab, activeTabId]);

  const handleHome = () => {
    handleNavigate('about:blank');
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <TooltipProvider>
        {/* Tab Strip */}
        <div className="flex items-center gap-2 px-2 py-2 border-b bg-muted/30">
          <ScrollArea className="flex-1">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2 min-w-[180px] max-w-[240px] rounded-t-lg cursor-pointer transition-colors",
                    activeTabId === tab.id
                      ? "bg-background border border-b-0"
                      : "bg-muted/50 hover:bg-muted border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {tab.favicon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tab.favicon} alt="" className="w-4 h-4 shrink-0" />
                    ) : (
                      <Globe className="w-4 h-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm truncate flex-1">
                      {tab.title}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
            onClick={handleNewTab}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Compact Chrome-style Toolbar */}
        <BrowserToolbar
          activeTab={activeTab ? { ...activeTab, url: activeTab.displayUrl || activeTab.url } : undefined}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          onReload={handleReload}
          onHome={handleHome}
          onBookmark={handleBookmark}
          onDownload={handleDownload}
          onShare={handleShare}
          onPrint={handlePrint}
          onExtractData={handleExtractData}
        />

        {/* Proxy Status Indicator */}
        {proxyStatus === 'offline' && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              Proxy server is starting... Some sites may not load correctly.
            </span>
          </div>
        )}

        {/* WebView Content Area */}
        <div className="flex-1 bg-background overflow-hidden relative">
          {activeTab?.error ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <AlertCircle className="h-16 w-16 text-destructive" />
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Failed to Load Page</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {activeTab.error}
                  </p>
                  <Button onClick={handleReload} variant="outline">
                    <RotateCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          ) : activeTab?.loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <RotateCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading {activeTab.displayUrl || 'page'}...</p>
              </div>
            </div>
          ) : activeTab?.url === 'about:blank' || !activeTab?.displayUrl ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <Globe className="h-16 w-16 text-muted-foreground" />
                <div>
                  <h2 className="text-2xl font-semibold mb-2">New Tab</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter a URL in the address bar to start browsing
                  </p>
                  {proxyStatus === 'online' && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      ✓ Proxy server online
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={activeTab?.url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="no-referrer-when-downgrade"
              title={activeTab?.title || 'Browser Content'}
              onLoad={() => {
                setTabs(prev => prev.map(tab => 
                  tab.id === activeTabId ? { ...tab, loading: false } : tab
                ));
              }}
              onError={() => {
                setTabs(prev => prev.map(tab => 
                  tab.id === activeTabId ? { ...tab, loading: false, error: 'Failed to load page' } : tab
                ));
              }}
            />
          )}
        </div>
      </TooltipProvider>
    </div>
  );
};
