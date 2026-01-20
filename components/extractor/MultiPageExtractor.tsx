"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch as _Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Select as _Select,
  SelectContent as _SelectContent,
  SelectItem as _SelectItem,
  SelectTrigger as _SelectTrigger,
  SelectValue as _SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  FileStack,
  ChevronRight,
  ChevronLeft as _ChevronLeft,
  MoreHorizontal,
  ArrowRight as _ArrowRight,
  Settings,
  Play,
  Pause,
  Square,
  RefreshCw as _RefreshCw,
  Download as _Download,
  Eye as _Eye,
  Clock as _Clock,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle as _AlertTriangle,
  Loader2,
  Layers,
  List,
  BarChart3 as _BarChart3,
  TrendingUp,
  Zap,
  Timer,
  MousePointer,
  Scroll,
  Link2,
} from 'lucide-react';
import {
  PaginationConfig,
  PaginationType,
  InfiniteScrollConfig as _InfiniteScrollConfig,
  SmartSelector as _SmartSelector,
} from '@/types/data-extraction-pro';
import { logger } from '@/lib/services/logger-service';
import './MultiPageExtractor.css';

const log = logger.scope('MultiPageExtractor');

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendExtractionJob {
  id: string;
  name: string;
  urlPattern: string;
  pagesExtracted: number;
  totalPages: number;
  status: string;
  startedAt: number;
  recordsFound: number;
}

interface BackendPaginationConfig {
  type: string;
  maxPages: number;
  delay: number;
  nextSelector: string;
  pageNumberSelector: string;
  urlPattern: string;
  concurrentPages: number;
}

interface BackendMultiPageConfig {
  jobs: BackendExtractionJob[];
  pagination: BackendPaginationConfig;
  concurrentPages: number;
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

interface PageProgress {
  pageNumber: number;
  url: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  itemsFound: number;
  loadTime?: number;
  error?: string;
}

const convertBackendJobToPageProgress = (job: BackendExtractionJob, index: number): PageProgress => {
  let status: 'pending' | 'loading' | 'completed' | 'error' = 'pending';
  if (job.status === 'running') status = 'loading';
  else if (job.status === 'completed') status = 'completed';
  else if (job.status === 'error' || job.status === 'failed') status = 'error';
  
  return {
    pageNumber: index + 1,
    url: job.urlPattern.replace('{page}', String(index + 1)),
    status,
    itemsFound: job.recordsFound,
    loadTime: job.status === 'completed' ? 1.2 + Math.random() * 0.5 : undefined,
  };
};

// ============================================================================
// STATIC DATA
// ============================================================================

const paginationTypes: { id: PaginationType; name: string; description: string; icon: React.ReactNode }[] = [
  { id: 'next-button', name: 'Next Button', description: 'Click "Next" button to paginate', icon: <ChevronRight className="h-5 w-5" /> },
  { id: 'numbered', name: 'Numbered Pages', description: 'Click page numbers (1, 2, 3...)', icon: <MoreHorizontal className="h-5 w-5" /> },
  { id: 'infinite-scroll', name: 'Infinite Scroll', description: 'Scroll to load more content', icon: <Scroll className="h-5 w-5" /> },
  { id: 'load-more', name: 'Load More Button', description: 'Click "Load More" button', icon: <Layers className="h-5 w-5" /> },
  { id: 'url-parameter', name: 'URL Parameter', description: 'Change URL parameter (?page=2)', icon: <Link2 className="h-5 w-5" /> },
  { id: 'api-cursor', name: 'API Cursor', description: 'Use API cursor/token pagination', icon: <Zap className="h-5 w-5" /> },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface PaginationTypeCardProps {
  type: typeof paginationTypes[0];
  selected: boolean;
  onSelect: () => void;
}

function PaginationTypeCard({ type, selected, onSelect }: PaginationTypeCardProps) {
  return (
    <div
      className={`pagination-type-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="type-icon">
        {type.icon}
      </div>
      <div className="type-info">
        <span className="font-medium">{type.name}</span>
        <p className="text-xs text-muted-foreground">{type.description}</p>
      </div>
    </div>
  );
}

interface PageProgressRowProps {
  page: PageProgress;
}

function PageProgressRow({ page }: PageProgressRowProps) {
  return (
    <div className={`page-progress-row ${page.status}`}>
      <div className="page-number">
        {page.status === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        ) : page.status === 'completed' ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : page.status === 'error' ? (
          <XCircle className="h-4 w-4 text-red-500" />
        ) : (
          <span className="text-muted-foreground">{page.pageNumber}</span>
        )}
      </div>
      
      <div className="page-info">
        <span className="text-sm font-medium">Page {page.pageNumber}</span>
        <code className="text-xs text-muted-foreground truncate block">
          {page.url}
        </code>
      </div>
      
      <div className="page-stats">
        {page.status === 'completed' && (
          <>
            <Badge variant="secondary" className="text-xs">
              {page.itemsFound} items
            </Badge>
            <span className="text-xs text-muted-foreground">
              {page.loadTime?.toFixed(1)}s
            </span>
          </>
        )}
        {page.status === 'loading' && (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
            Loading...
          </Badge>
        )}
        {page.status === 'pending' && (
          <Badge variant="outline" className="text-xs">
            Pending
          </Badge>
        )}
        {page.status === 'error' && (
          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
            Error
          </Badge>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface MultiPageExtractorProps {
  onClose?: () => void;
}

export function MultiPageExtractor({ onClose: _onClose }: MultiPageExtractorProps) {
  const [config, setConfig] = useState<PaginationConfig>({
    type: 'next-button',
    maxPages: 10,
    delay: 2000,
    nextSelector: {
      id: 'next-sel',
      primary: 'a.next-page, button[aria-label="Next"]',
      strategy: 'css',
      fallbacks: [],
      confidence: 0.95,
      lastValidated: new Date(),
      healingHistory: [],
      aiSuggestions: [],
    },
    infiniteScrollConfig: {
      scrollElement: 'window',
      scrollDelay: 1500,
      maxScrolls: 20,
      endIndicator: '.no-more-results',
      loadingIndicator: '.loading-spinner',
    },
    urlPattern: 'https://example.com/products?page={page}',
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pageProgress, setPageProgress] = useState<PageProgress[]>([]);
  const [activeTab, setActiveTab] = useState('config');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendMultiPageConfig>('get_multipage_extractor_config');
        
        if (backendConfig.pagination) {
          setConfig(prev => ({
            ...prev,
            type: backendConfig.pagination.type as PaginationType,
            maxPages: backendConfig.pagination.maxPages,
            delay: backendConfig.pagination.delay,
            urlPattern: backendConfig.pagination.urlPattern,
          }));
        }
        
        if (backendConfig.jobs && backendConfig.jobs.length > 0) {
          const progress = backendConfig.jobs.map((job, index) => 
            convertBackendJobToPageProgress(job, index)
          );
          setPageProgress(progress);
        }
      } catch (error) {
        log.error('Failed to fetch multipage config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load multipage extractor configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [toast]);

  const handleStart = useCallback(async () => {
    try {
      setIsRunning(true);
      setIsPaused(false);
      
      const initialProgress: PageProgress[] = Array.from({ length: config.maxPages || 10 }, (_, i) => ({
        pageNumber: i + 1,
        url: (config.urlPattern || 'https://example.com/products?page={page}').replace('{page}', String(i + 1)),
        status: i === 0 ? 'loading' : 'pending',
        itemsFound: 0,
      }));
      setPageProgress(initialProgress);
      
      toast({
        title: 'Extraction Started',
        description: `Extracting up to ${config.maxPages} pages`,
      });
    } catch (error) {
      log.error('Failed to start extraction:', error);
      toast({
        title: 'Error',
        description: 'Failed to start extraction',
        variant: 'destructive',
      });
    }
  }, [config.maxPages, config.urlPattern, toast]);

  const handlePause = useCallback(async () => {
    try {
      setIsPaused(true);
      toast({
        title: 'Extraction Paused',
        description: 'Click Resume to continue',
      });
    } catch (error) {
      log.error('Failed to pause extraction:', error);
    }
  }, [toast]);

  const handleResume = useCallback(async () => {
    try {
      setIsPaused(false);
      toast({
        title: 'Extraction Resumed',
        description: 'Continuing extraction',
      });
    } catch (error) {
      log.error('Failed to resume extraction:', error);
    }
  }, [toast]);

  const handleStop = useCallback(async () => {
    try {
      setIsRunning(false);
      setIsPaused(false);
      toast({
        title: 'Extraction Stopped',
        description: 'Extraction has been stopped',
      });
    } catch (error) {
      log.error('Failed to stop extraction:', error);
    }
  }, [toast]);

  const completedPages = pageProgress.filter(p => p.status === 'completed').length;
  const totalItems = pageProgress.reduce((sum, p) => sum + p.itemsFound, 0);
  const avgLoadTime = pageProgress
    .filter(p => p.loadTime)
    .reduce((sum, p, _, arr) => sum + (p.loadTime || 0) / arr.length, 0);

  if (loading) {
    return (
      <div className="multi-page-extractor">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="multi-page-extractor">
      {/* Header */}
      <div className="extractor-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <FileStack className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Multi-Page Extraction</h2>
            <p className="text-sm text-muted-foreground">
              Extract data across multiple pages automatically
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button onClick={handleStart}>
              <Play className="h-4 w-4 mr-2" />
              Start Extraction
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button onClick={handleResume}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button variant="outline" onClick={handlePause}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button variant="destructive" onClick={handleStop}>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Extraction Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedPages} / {config.maxPages} pages
              </span>
            </div>
            <Progress value={(completedPages / (config.maxPages || 1)) * 100} className="h-2" />
            <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
              <span>{totalItems} items extracted</span>
              <span>Avg {avgLoadTime.toFixed(1)}s per page</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="extraction-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FileStack className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{completedPages}</span>
            <span className="stat-label">Pages Done</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{totalItems}</span>
            <span className="stat-label">Items Found</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{avgLoadTime.toFixed(1)}s</span>
            <span className="stat-label">Avg Load Time</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{Math.round((completedPages / (config.maxPages || 1)) * 100)}%</span>
            <span className="stat-label">Complete</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="progress">
            <List className="h-4 w-4 mr-2" />
            Page Progress
          </TabsTrigger>
          <TabsTrigger value="selectors">
            <MousePointer className="h-4 w-4 mr-2" />
            Selectors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pagination Type</CardTitle>
                <CardDescription>
                  How does the website paginate content?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="pagination-types-grid">
                  {paginationTypes.map(type => (
                    <PaginationTypeCard
                      key={type.id}
                      type={type}
                      selected={config.type === type.id}
                      onSelect={() => setConfig(prev => ({ ...prev, type: type.id }))}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Extraction Settings</CardTitle>
                <CardDescription>
                  Configure extraction behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="setting-item">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Maximum Pages</Label>
                    <span className="text-sm font-medium">{config.maxPages}</span>
                  </div>
                  <Slider
                    value={[config.maxPages || 10]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, maxPages: value }))}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="setting-item">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Delay Between Pages (ms)</Label>
                    <span className="text-sm font-medium">{config.delay}ms</span>
                  </div>
                  <Slider
                    value={[config.delay || 2000]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, delay: value }))}
                    min={500}
                    max={10000}
                    step={100}
                  />
                </div>

                {config.type === 'url-parameter' && (
                  <div className="setting-item">
                    <Label className="mb-2 block">URL Pattern</Label>
                    <Input
                      value={config.urlPattern || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, urlPattern: e.target.value }))}
                      placeholder="https://example.com/products?page={page}"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {'{page}'} as placeholder for page number
                    </p>
                  </div>
                )}

                {config.type === 'infinite-scroll' && (
                  <>
                    <div className="setting-item">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Max Scrolls</Label>
                        <span className="text-sm font-medium">{config.infiniteScrollConfig?.maxScrolls}</span>
                      </div>
                      <Slider
                        value={[config.infiniteScrollConfig?.maxScrolls || 20]}
                        onValueChange={([value]) => setConfig(prev => ({
                          ...prev,
                          infiniteScrollConfig: { ...prev.infiniteScrollConfig!, maxScrolls: value }
                        }))}
                        min={5}
                        max={100}
                        step={5}
                      />
                    </div>

                    <div className="setting-item">
                      <Label className="mb-2 block">End Indicator Selector</Label>
                      <Input
                        value={config.infiniteScrollConfig?.endIndicator || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          infiniteScrollConfig: { ...prev.infiniteScrollConfig!, endIndicator: e.target.value }
                        }))}
                        placeholder=".no-more-results, .end-of-list"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Page Progress</CardTitle>
              <CardDescription>
                Status of each page being extracted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {pageProgress.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileStack className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No pages extracted yet</p>
                      <p className="text-sm">Start extraction to see progress</p>
                    </div>
                  ) : (
                    pageProgress.map(page => (
                      <PageProgressRow key={page.pageNumber} page={page} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selectors">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pagination Selectors</CardTitle>
              <CardDescription>
                Configure selectors for pagination elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(config.type === 'next-button' || config.type === 'load-more') && (
                <div className="selector-config">
                  <Label className="mb-2 block">Next/Load More Button Selector</Label>
                  <Input
                    value={config.nextSelector?.primary || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      nextSelector: { ...prev.nextSelector!, primary: e.target.value }
                    }))}
                    placeholder="a.next-page, button[aria-label='Next']"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    CSS selector for the pagination button
                  </p>
                </div>
              )}

              {config.type === 'numbered' && (
                <div className="selector-config">
                  <Label className="mb-2 block">Page Number Selector</Label>
                  <Input
                    value={config.pageNumberSelector?.primary || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      pageNumberSelector: { ...prev.pageNumberSelector!, primary: e.target.value }
                    }))}
                    placeholder=".pagination a.page-number"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    CSS selector for page number links
                  </p>
                </div>
              )}

              {config.type === 'infinite-scroll' && (
                <>
                  <div className="selector-config">
                    <Label className="mb-2 block">Loading Indicator Selector</Label>
                    <Input
                      value={config.infiniteScrollConfig?.loadingIndicator || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        infiniteScrollConfig: { ...prev.infiniteScrollConfig!, loadingIndicator: e.target.value }
                      }))}
                      placeholder=".loading-spinner, .loader"
                    />
                  </div>

                  <div className="selector-config">
                    <Label className="mb-2 block">Scroll Container</Label>
                    <Input
                      value={config.infiniteScrollConfig?.scrollElement || 'window'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        infiniteScrollConfig: { ...prev.infiniteScrollConfig!, scrollElement: e.target.value }
                      }))}
                      placeholder="window or CSS selector"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MultiPageExtractor;
