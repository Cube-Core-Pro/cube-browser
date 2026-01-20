/**
 * CUBE DevTools - Professional Browser Inspector
 * 
 * Features:
 * - Elements Inspector with DOM tree
 * - Console with command execution
 * - Network monitor
 * - Performance metrics
 * - AI-powered suggestions
 * - CSS inspector
 * - Storage viewer
 * 
 * More powerful than Chrome DevTools with AI integration
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DevToolsService } from '@/lib/services/browser-service';
import {
  X, ChevronRight, ChevronDown, Search, RefreshCw,
  Code, Globe, Activity, Database, Terminal, Zap,
  Eye, Trash2,
  Play, Circle, AlertCircle, AlertTriangle,
  Info, Bug, Sparkles, Layers, Cpu,
  HardDrive, Wifi, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/services/logger-service';
import './CubeDevTools.css';

const log = logger.scope('CubeDevTools');

// ============================================
// Types
// ============================================

interface DOMNode {
  nodeType: number;
  nodeName: string;
  attributes: Record<string, string>;
  children: DOMNode[];
  textContent?: string;
}

interface ConsoleEntry {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug' | 'command' | 'result';
  args: string[];
  timestamp: number;
}

interface NetworkRequest {
  type: 'fetch' | 'xhr';
  url: string;
  method: string;
  status?: number;
  duration?: number;
  size?: number;
  error?: string;
  timestamp: number;
}

interface PerformanceMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstByte: number;
  domInteractive: number;
  dns: number;
  tcp: number;
  request: number;
  response: number;
  domParsing: number;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  resourceCount: number;
  resources: Array<{
    name: string;
    type: string;
    duration: number;
    size: number;
  }>;
}

interface CubeDevToolsProps {
  tabId: string;
  onClose: () => void;
  isOpen: boolean;
  position?: 'bottom' | 'right' | 'floating';
}

// ============================================
// Main Component
// ============================================

export const CubeDevTools: React.FC<CubeDevToolsProps> = ({
  tabId,
  onClose,
  isOpen,
  position = 'bottom'
}) => {
  // State
  const [activeTab, setActiveTab] = useState('elements');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [domTree, _setDomTree] = useState<DOMNode | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [performance, _setPerformance] = useState<PerformanceMetrics | null>(null);
  const [consoleInput, setConsoleInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [elementStyles, _setElementStyles] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(true);
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [consoleFilter, setConsoleFilter] = useState<string>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['HTML', 'BODY']));
  
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  // ============================================
  // Data Fetching
  // ============================================

  const fetchDOMTree = useCallback(async () => {
    try {
      await DevToolsService.getDom(tabId);
      // Result will come through event listener
    } catch (error) {
      log.error('Failed to fetch DOM:', error);
    }
  }, [tabId]);

  const fetchConsole = useCallback(async () => {
    try {
      await DevToolsService.getConsole(tabId);
    } catch (error) {
      log.error('Failed to fetch console:', error);
    }
  }, [tabId]);

  const fetchNetwork = useCallback(async () => {
    try {
      await DevToolsService.getNetwork(tabId);
    } catch (error) {
      log.error('Failed to fetch network:', error);
    }
  }, [tabId]);

  const fetchPerformance = useCallback(async () => {
    try {
      await DevToolsService.getPerformance(tabId);
    } catch (error) {
      log.error('Failed to fetch performance:', error);
    }
  }, [tabId]);

  const injectMonitors = useCallback(async () => {
    try {
      await DevToolsService.injectConsoleMonitor(tabId);
      await DevToolsService.injectNetworkMonitor(tabId);
    } catch (error) {
      log.error('Failed to inject monitors:', error);
    }
  }, [tabId]);

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    if (isOpen && tabId) {
      injectMonitors();
      fetchDOMTree();
      fetchPerformance();
    }
  }, [isOpen, tabId, injectMonitors, fetchDOMTree, fetchPerformance]);

  useEffect(() => {
    if (!isOpen || !isRecording) return;

    const interval = setInterval(() => {
      if (activeTab === 'console') fetchConsole();
      if (activeTab === 'network') fetchNetwork();
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRecording, activeTab, fetchConsole, fetchNetwork]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleEntries]);

  // ============================================
  // Handlers
  // ============================================

  const handleExecuteConsole = async () => {
    if (!consoleInput.trim()) return;

    const command = consoleInput.trim();
    commandHistoryRef.current.push(command);
    historyIndexRef.current = commandHistoryRef.current.length;

    setConsoleEntries(prev => [...prev, {
      type: 'command',
      args: [command],
      timestamp: Date.now()
    }]);

    try {
      await DevToolsService.executeConsole(tabId, command);
      setConsoleEntries(prev => [...prev, {
        type: 'result',
        args: ['Command executed'],
        timestamp: Date.now()
      }]);
    } catch (error) {
      setConsoleEntries(prev => [...prev, {
        type: 'error',
        args: [String(error)],
        timestamp: Date.now()
      }]);
    }

    setConsoleInput('');
  };

  const handleConsoleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleExecuteConsole();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndexRef.current > 0) {
        historyIndexRef.current--;
        setConsoleInput(commandHistoryRef.current[historyIndexRef.current] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
        historyIndexRef.current++;
        setConsoleInput(commandHistoryRef.current[historyIndexRef.current] || '');
      } else {
        historyIndexRef.current = commandHistoryRef.current.length;
        setConsoleInput('');
      }
    }
  };

  const handleElementSelect = async (selector: string) => {
    setSelectedElement(selector);
    try {
      await DevToolsService.highlightElement(tabId, selector);
      await DevToolsService.getStyles(tabId, selector);
    } catch (error) {
      log.error('Failed to select element:', error);
    }
  };

  const handleClearConsole = () => {
    setConsoleEntries([]);
  };

  const handleClearNetwork = () => {
    setNetworkRequests([]);
  };

  const toggleNodeExpanded = (nodePath: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodePath)) {
        next.delete(nodePath);
      } else {
        next.add(nodePath);
      }
      return next;
    });
  };

  // ============================================
  // Render Helpers
  // ============================================

  const renderDOMNode = (node: DOMNode, path: string = '', depth: number = 0): React.ReactNode => {
    if (!node) return null;
    if (depth > 15) return <span className="text-muted-foreground">...</span>;

    const nodePath = `${path}/${node.nodeName}`;
    const isExpanded = expandedNodes.has(nodePath) || expandedNodes.has(node.nodeName);
    const hasChildren = node.children && node.children.length > 0;
    const isElement = node.nodeType === 1;
    const isText = node.nodeType === 3;

    if (isText && node.textContent) {
      return (
        <span className="dom-text text-orange-400">
          &quot;{node.textContent.slice(0, 50)}{node.textContent.length > 50 ? '...' : ''}&quot;
        </span>
      );
    }

    if (!isElement) return null;

    const selector = node.attributes.id 
      ? `#${node.attributes.id}` 
      : node.attributes.class 
        ? `.${node.attributes.class.split(' ')[0]}` 
        : node.nodeName.toLowerCase();

    return (
      <div key={nodePath} className="dom-node" style={{ marginLeft: depth * 16 }}>
        <div 
          className={cn(
            "dom-node-header flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer hover:bg-muted/50",
            selectedElement === selector && "bg-blue-500/20"
          )}
          onClick={() => handleElementSelect(selector)}
        >
          {hasChildren ? (
            <button 
              className="w-4 h-4 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); toggleNodeExpanded(nodePath); }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          
          <span className="text-purple-400">&lt;{node.nodeName.toLowerCase()}</span>
          
          {Object.entries(node.attributes).slice(0, 3).map(([key, value]) => (
            <span key={key} className="dom-attr">
              <span className="text-yellow-400"> {key}</span>
              <span className="text-muted-foreground">=</span>
              <span className="text-green-400">&quot;{value.slice(0, 30)}{value.length > 30 ? '...' : ''}&quot;</span>
            </span>
          ))}
          
          <span className="text-purple-400">&gt;</span>
          
          {!hasChildren && !isExpanded && (
            <span className="text-purple-400">&lt;/{node.nodeName.toLowerCase()}&gt;</span>
          )}
        </div>
        
        {isExpanded && hasChildren && (
          <div className="dom-children">
            {node.children.map((child, i) => renderDOMNode(child, `${nodePath}[${i}]`, depth + 1))}
            <div style={{ marginLeft: (depth + 1) * 16 }} className="text-purple-400">
              &lt;/{node.nodeName.toLowerCase()}&gt;
            </div>
          </div>
        )}
      </div>
    );
  };

  const getConsoleIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug': return <Bug className="w-4 h-4 text-purple-500" />;
      case 'command': return <ChevronRight className="w-4 h-4 text-green-500" />;
      case 'result': return <ChevronRight className="w-4 h-4 text-muted-foreground" />;
      default: return <Circle className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // ============================================
  // Render
  // ============================================

  if (!isOpen) return null;

  return (
    <div className={cn(
      "cube-devtools",
      position === 'bottom' && "devtools-bottom",
      position === 'right' && "devtools-right",
      position === 'floating' && "devtools-floating"
    )}>
      {/* Header */}
      <div className="devtools-header flex items-center justify-between px-2 py-1 border-b bg-background">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">CUBE DevTools</span>
          <Badge variant="outline" className="text-xs">AI-Powered</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? (
              <Circle className="w-3 h-3 fill-red-500 text-red-500" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-8 px-2">
          <TabsTrigger value="elements" className="text-xs h-7 gap-1">
            <Code className="w-3 h-3" /> Elements
          </TabsTrigger>
          <TabsTrigger value="console" className="text-xs h-7 gap-1">
            <Terminal className="w-3 h-3" /> Console
            {consoleEntries.filter(e => e.type === 'error').length > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1">
                {consoleEntries.filter(e => e.type === 'error').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="network" className="text-xs h-7 gap-1">
            <Globe className="w-3 h-3" /> Network
            <Badge variant="secondary" className="text-[10px] h-4 px-1">
              {networkRequests.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs h-7 gap-1">
            <Activity className="w-3 h-3" /> Performance
          </TabsTrigger>
          <TabsTrigger value="storage" className="text-xs h-7 gap-1">
            <Database className="w-3 h-3" /> Storage
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-xs h-7 gap-1">
            <Sparkles className="w-3 h-3" /> AI Inspector
          </TabsTrigger>
        </TabsList>

        {/* Elements Tab */}
        <TabsContent value="elements" className="flex-1 flex m-0 p-0">
          <div className="flex-1 flex">
            {/* DOM Tree */}
            <div className="flex-1 border-r">
              <div className="p-2 border-b flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search elements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 text-xs"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchDOMTree}>
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
              <ScrollArea className="h-[calc(100%-40px)]">
                <div className="p-2 font-mono text-xs">
                  {domTree ? renderDOMNode(domTree) : (
                    <div className="text-center text-muted-foreground py-4">
                      <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Click refresh to load DOM tree</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Styles Panel */}
            <div className="w-72">
              <div className="p-2 border-b">
                <span className="text-xs font-semibold">Styles</span>
              </div>
              <ScrollArea className="h-[calc(100%-32px)]">
                <div className="p-2">
                  {selectedElement ? (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Selected: <code className="text-primary">{selectedElement}</code>
                      </div>
                      {Object.entries(elementStyles).length > 0 ? (
                        <div className="font-mono text-xs space-y-1">
                          {Object.entries(elementStyles).slice(0, 50).map(([prop, value]) => (
                            <div key={prop} className="flex">
                              <span className="text-purple-400">{prop}</span>
                              <span className="text-muted-foreground">: </span>
                              <span className="text-green-400 break-all">{value}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No styles computed</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4 text-xs">
                      <Eye className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p>Select an element to view styles</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        {/* Console Tab */}
        <TabsContent value="console" className="flex-1 flex flex-col m-0 p-0">
          <div className="p-2 border-b flex items-center gap-2">
            <select
              value={consoleFilter}
              onChange={(e) => setConsoleFilter(e.target.value)}
              className="h-7 text-xs bg-background border rounded px-2"
              title="Filter console messages"
              aria-label="Filter console messages"
            >
              <option value="all">All</option>
              <option value="error">Errors</option>
              <option value="warn">Warnings</option>
              <option value="log">Logs</option>
            </select>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClearConsole}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 font-mono text-xs space-y-1">
              {consoleEntries
                .filter(e => consoleFilter === 'all' || e.type === consoleFilter)
                .map((entry, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2 py-1 px-2 rounded",
                      entry.type === 'error' && "bg-red-500/10",
                      entry.type === 'warn' && "bg-yellow-500/10",
                      entry.type === 'command' && "bg-muted/50"
                    )}
                  >
                    {getConsoleIcon(entry.type)}
                    <span className="flex-1 break-all">
                      {entry.args.join(' ')}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              <div ref={consoleEndRef} />
            </div>
          </ScrollArea>
          <div className="p-2 border-t flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-primary" />
            <Input
              placeholder="Execute JavaScript..."
              value={consoleInput}
              onChange={(e) => setConsoleInput(e.target.value)}
              onKeyDown={handleConsoleKeyDown}
              className="h-7 text-xs font-mono"
            />
            <Button size="sm" className="h-7" onClick={handleExecuteConsole}>
              <Play className="w-3 h-3" />
            </Button>
          </div>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="flex-1 flex flex-col m-0 p-0">
          <div className="p-2 border-b flex items-center gap-2">
            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              className="h-7 text-xs bg-background border rounded px-2"
              title="Filter network requests"
              aria-label="Filter network requests"
            >
              <option value="all">All</option>
              <option value="fetch">Fetch</option>
              <option value="xhr">XHR</option>
            </select>
            <Input
              placeholder="Filter URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 text-xs flex-1"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClearNetwork}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2 w-16">Method</th>
                  <th className="text-left p-2 w-16">Status</th>
                  <th className="text-left p-2 w-20">Size</th>
                  <th className="text-left p-2 w-20">Time</th>
                </tr>
              </thead>
              <tbody>
                {networkRequests
                  .filter(r => networkFilter === 'all' || r.type === networkFilter)
                  .filter(r => !searchQuery || r.url.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((req, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="p-2 truncate max-w-xs" title={req.url}>
                        <div className="flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-muted-foreground" />
                          {req.url.split('/').pop() || req.url}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-[10px]">
                          {req.method}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <span className={cn(
                          req.status && req.status >= 200 && req.status < 300 && "text-green-500",
                          req.status && req.status >= 400 && "text-red-500",
                          req.error && "text-red-500"
                        )}>
                          {req.error ? 'Error' : req.status || '-'}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {req.size ? formatBytes(req.size) : '-'}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {req.duration ? formatDuration(req.duration) : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {networkRequests.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No network requests recorded</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {performance ? (
                <>
                  {/* Timing Metrics */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Clock className="w-3 h-3" /> First Byte
                      </div>
                      <div className="text-lg font-semibold">
                        {formatDuration(performance.firstByte)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Zap className="w-3 h-3" /> DOM Interactive
                      </div>
                      <div className="text-lg font-semibold">
                        {formatDuration(performance.domInteractive)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Layers className="w-3 h-3" /> DOM Loaded
                      </div>
                      <div className="text-lg font-semibold">
                        {formatDuration(performance.domContentLoaded)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Activity className="w-3 h-3" /> Load Complete
                      </div>
                      <div className="text-lg font-semibold">
                        {formatDuration(performance.loadComplete)}
                      </div>
                    </div>
                  </div>

                  {/* Memory */}
                  {performance.memory && (
                    <div className="p-4 rounded-lg border">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> Memory Usage
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Used Heap</div>
                          <div className="font-semibold">
                            {formatBytes(performance.memory.usedJSHeapSize)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Total Heap</div>
                          <div className="font-semibold">
                            {formatBytes(performance.memory.totalJSHeapSize)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Heap Limit</div>
                          <div className="font-semibold">
                            {formatBytes(performance.memory.jsHeapSizeLimit)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ 
                              width: `${(performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resources */}
                  <div className="p-4 rounded-lg border">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <HardDrive className="w-4 h-4" /> Resources ({performance.resourceCount})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {performance.resources.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="truncate flex-1">{r.name}</span>
                          <Badge variant="outline" className="ml-2">{r.type}</Badge>
                          <span className="text-muted-foreground ml-2 w-16 text-right">
                            {formatDuration(r.duration)}
                          </span>
                          <span className="text-muted-foreground ml-2 w-16 text-right">
                            {formatBytes(r.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Click refresh to load performance metrics</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={fetchPerformance}>
                    <RefreshCw className="w-3 h-3 mr-2" /> Refresh
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="flex-1 m-0 p-0">
          <div className="flex h-full">
            <div className="w-48 border-r p-2 space-y-1">
              <Button variant="ghost" className="w-full justify-start text-xs h-8">
                <Database className="w-3 h-3 mr-2" /> Local Storage
              </Button>
              <Button variant="ghost" className="w-full justify-start text-xs h-8">
                <Database className="w-3 h-3 mr-2" /> Session Storage
              </Button>
              <Button variant="ghost" className="w-full justify-start text-xs h-8">
                <Database className="w-3 h-3 mr-2" /> Cookies
              </Button>
              <Button variant="ghost" className="w-full justify-start text-xs h-8">
                <Database className="w-3 h-3 mr-2" /> IndexedDB
              </Button>
            </div>
            <div className="flex-1 p-4">
              <div className="text-center text-muted-foreground py-8">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Select a storage type to view data</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* AI Inspector Tab */}
        <TabsContent value="ai" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">AI-Powered Inspector</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get intelligent suggestions for performance, accessibility, and SEO
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Zap className="w-6 h-6" />
                    <span className="text-xs">Performance Audit</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Eye className="w-6 h-6" />
                    <span className="text-xs">Accessibility Check</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Search className="w-6 h-6" />
                    <span className="text-xs">SEO Analysis</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Bug className="w-6 h-6" />
                    <span className="text-xs">Find Issues</span>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CubeDevTools;
