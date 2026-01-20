"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('GraphView');

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs as _Tabs, TabsContent as _TabsContent, TabsList as _TabsList, TabsTrigger as _TabsTrigger } from '@/components/ui/tabs';
import { Select as _Select, SelectContent as _SelectContent, SelectItem as _SelectItem, SelectTrigger as _SelectTrigger, SelectValue as _SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2 as _Maximize2,
  Move as _Move,
  Filter,
  Search,
  Plus,
  Trash2,
  Link2,
  Unlink,
  Settings as _Settings,
  Download as _Download,
  FileText,
  Folder,
  Tag,
  User,
  Calendar,
  BookOpen,
  Link,
  Image,
  MoreVertical,
  ChevronDown as _ChevronDown,
  RefreshCcw as _RefreshCcw,
  Focus,
  Layout as _Layout,
  Grid3x3,
  CircleDot,
  Layers,
  Loader2 as _Loader2,
} from 'lucide-react';
import {
  GraphNode,
  GraphLink,
  GraphFilter,
  GraphLayout as _GraphLayout,
  GraphViewConfig,
  NodeType,
  LinkType,
} from '@/types/knowledge-management';
import './GraphView.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendGraphNode {
  id: string;
  label: string;
  nodeType: string;
  x: number;
  y: number;
  connections: string[];
}

interface BackendGraphViewConfig {
  nodes: BackendGraphNode[];
  zoomLevel: number;
  centerX: number;
  centerY: number;
}

const toFrontendNode = (backend: BackendGraphNode): GraphNode => ({
  id: backend.id,
  type: (backend.nodeType as NodeType) || 'note',
  label: backend.label,
  title: backend.label,
  content: '',
  preview: '',
  x: backend.x + 400,
  y: backend.y + 300,
  size: 36,
  color: '#3b82f6',
  tags: [],
  connections: backend.connections.length,
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    color: '#3b82f6',
  },
  visible: true,
});

// Static links (backend links not yet implemented)
const staticLinks: GraphLink[] = [
  { id: 'link-1', source: 'node-1', target: 'node-2', type: 'reference', strength: 0.8 },
  { id: 'link-2', source: 'node-1', target: 'node-3', type: 'mention', strength: 0.5 },
  { id: 'link-3', source: 'node-2', target: 'node-4', type: 'hierarchy', strength: 0.9 },
  { id: 'link-4', source: 'node-3', target: 'node-5', type: 'reference', strength: 0.6 },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getNodeIcon = (type: NodeType) => {
  switch (type) {
    case 'note':
      return FileText;
    case 'document':
      return BookOpen;
    case 'folder':
      return Folder;
    case 'tag':
      return Tag;
    case 'person':
      return User;
    case 'date':
      return Calendar;
    case 'link':
      return Link;
    case 'image':
      return Image;
    default:
      return FileText;
  }
};

const getLinkColor = (type: LinkType): string => {
  switch (type) {
    case 'reference':
      return '#3b82f6';
    case 'hierarchy':
      return '#22c55e';
    case 'mention':
      return '#f59e0b';
    case 'author':
      return '#8b5cf6';
    case 'similar':
      return '#ec4899';
    default:
      return '#6b7280';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface GraphViewProps {
  onClose?: () => void;
}

export function GraphView({ onClose: _onClose }: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<GraphViewConfig>({
    enabled: true,
    layout: 'force',
    showLabels: true,
    linkStrengthThreshold: 0.3,
    filters: {
      nodeTypes: [],
      linkTypes: [],
      tags: [],
      showOrphans: true,
    },
    display: {
      showLabels: true,
      showLinkLabels: false,
      showNodeSize: true,
      colorByType: true,
      highlightConnected: true,
      animateLayout: true,
    },
    physics: {
      enabled: true,
      repulsion: 100,
      springLength: 150,
      springStrength: 0.05,
    },
  });
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [_loading, setLoading] = useState(true);
  const [links, _setLinks] = useState<GraphLink[]>(staticLinks);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, _setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<GraphFilter>({
    nodeTypes: [],
    linkTypes: [],
    tags: [],
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { toast: _toast } = useToast();

  // Fetch graph config from backend
  useEffect(() => {
    const fetchGraphConfig = async () => {
      try {
        const config = await invoke<BackendGraphViewConfig>('get_graph_view_config');
        setNodes(config.nodes.map(toFrontendNode));
        setZoom(config.zoomLevel);
      } catch (err) {
        log.error('Failed to fetch graph config:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraphConfig();
  }, []);

  // Filter nodes based on search and filter criteria
  const filteredNodes = useMemo(() => {
    let result = nodes;
    
    if (searchQuery) {
      result = result.filter(n => 
        (n.title || n.label).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filter.nodeTypes.length > 0) {
      result = result.filter(n => filter.nodeTypes.includes(n.type));
    }
    
    if (filter.tags.length > 0) {
      result = result.filter(n => 
        n.tags?.some(t => filter.tags.includes(t))
      );
    }
    
    return result;
  }, [nodes, searchQuery, filter]);

  // Filter links to only show connections between visible nodes
  const filteredLinks = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    return links.filter(link => 
      visibleNodeIds.has(link.source) && visibleNodeIds.has(link.target)
    );
  }, [links, filteredNodes]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations
    ctx.save();
    ctx.translate(pan.x + canvas.width / 2, pan.y + canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw links
    filteredLinks.forEach(link => {
      const sourceNode = filteredNodes.find(n => n.id === link.source);
      const targetNode = filteredNodes.find(n => n.id === link.target);
      if (!sourceNode || !targetNode || 
          sourceNode.x === undefined || sourceNode.y === undefined ||
          targetNode.x === undefined || targetNode.y === undefined) return;

      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      ctx.strokeStyle = getLinkColor(link.type);
      ctx.globalAlpha = link.strength * 0.6;
      ctx.lineWidth = Math.max(1, link.strength * 3);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    filteredNodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) return;
      
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode?.id === node.id;
      const size = typeof node.size === 'number' ? node.size : 24;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + (isHovered ? 4 : 0), 0, Math.PI * 2);
      ctx.fillStyle = node.color || '#6b7280';
      ctx.globalAlpha = isSelected ? 1 : isHovered ? 0.9 : 0.7;
      ctx.fill();
      
      // Selection ring
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1;

      // Label
      if (config.showLabels) {
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = 'var(--foreground)';
        ctx.textAlign = 'center';
        ctx.fillText(node.title || node.label, node.x, node.y + size + 16);
      }
    });

    ctx.restore();
  }, [filteredNodes, filteredLinks, zoom, pan, hoveredNode, selectedNode, config.showLabels]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x - canvas.width / 2) / zoom + canvas.width / 2;
    const y = (e.clientY - rect.top - pan.y - canvas.height / 2) / zoom + canvas.height / 2;

    // Find clicked node from filtered nodes only
    const clickedNode = filteredNodes.find(node => {
      if (node.x === undefined || node.y === undefined) return false;
      const size = typeof node.size === 'number' ? node.size : 24;
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < size;
    });

    setSelectedNode(clickedNode || null);
  }, [filteredNodes, zoom, pan]);

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
  }, []);

  const handleZoomToFit = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const stats = useMemo(() => ({
    totalNodes: nodes.length,
    visibleNodes: filteredNodes.length,
    totalLinks: links.length,
    visibleLinks: filteredLinks.length,
    nodeTypes: [...new Set(nodes.map(n => n.type))],
    avgConnections: (nodes.reduce((acc, n) => acc + (n.connections ?? 0), 0) / nodes.length).toFixed(1),
    isFiltered: filteredNodes.length !== nodes.length,
  }), [nodes, links, filteredNodes, filteredLinks]);

  return (
    <div className="graph-view">
      {/* Header */}
      <div className="graph-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Knowledge Graph</h2>
            <p className="text-sm text-muted-foreground">
              {stats.isFiltered 
                ? `${stats.visibleNodes} of ${stats.totalNodes} nodes · ${stats.visibleLinks} connections`
                : `${stats.totalNodes} nodes · ${stats.totalLinks} connections`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="search-container">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomToFit}>
            <Focus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="graph-content">
        {/* Canvas Area */}
        <div className="graph-canvas-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="graph-canvas"
            onClick={handleCanvasClick}
          />
          
          {/* Zoom Controls */}
          <div className="zoom-controls">
            <Button variant="outline" size="icon" onClick={() => handleZoom(0.1)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" onClick={() => handleZoom(-0.1)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Layout Controls */}
          <div className="layout-controls">
            <Button
              variant={config.layout === 'force' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setConfig(prev => ({ ...prev, layout: 'force' }))}
            >
              <CircleDot className="h-4 w-4 mr-1" />
              Force
            </Button>
            <Button
              variant={config.layout === 'hierarchical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setConfig(prev => ({ ...prev, layout: 'hierarchical' }))}
            >
              <Layers className="h-4 w-4 mr-1" />
              Tree
            </Button>
            <Button
              variant={config.layout === 'radial' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setConfig(prev => ({ ...prev, layout: 'radial' }))}
            >
              <Grid3x3 className="h-4 w-4 mr-1" />
              Radial
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className={`graph-sidebar ${selectedNode || isFilterOpen ? 'open' : ''}`}>
          {isFilterOpen && !selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Node Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['note', 'document', 'folder', 'tag', 'person', 'link'].map(type => (
                      <Badge
                        key={type}
                        variant={filter.nodeTypes.includes(type as NodeType) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setFilter(prev => ({
                          ...prev,
                          nodeTypes: prev.nodeTypes.includes(type as NodeType)
                            ? prev.nodeTypes.filter(t => t !== type)
                            : [...prev.nodeTypes, type as NodeType]
                        }))}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Show Labels</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      checked={config.showLabels}
                      onCheckedChange={(showLabels) => 
                        setConfig(prev => ({ ...prev, showLabels }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {config.showLabels ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Link Strength Threshold</Label>
                  <Slider
                    value={[config.linkStrengthThreshold ?? 0.3]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) => 
                      setConfig(prev => ({ ...prev, linkStrengthThreshold: value }))}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {selectedNode && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="node-icon"
                      style={{ backgroundColor: selectedNode.color }}
                    >
                      {React.createElement(getNodeIcon(selectedNode.type), { 
                        className: 'h-4 w-4' 
                      })}
                    </div>
                    <CardTitle className="text-base">{selectedNode.title}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Link2 className="h-4 w-4 mr-2" />
                        Create Link
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Unlink className="h-4 w-4 mr-2" />
                        Remove Links
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Node
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{selectedNode.preview}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="node-meta">
                  <div className="meta-item">
                    <span className="meta-label">Type</span>
                    <Badge variant="secondary">{selectedNode.type}</Badge>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Connections</span>
                    <span className="font-medium">{selectedNode.connections}</span>
                  </div>
                </div>

                {selectedNode.tags && selectedNode.tags.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedNode.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Connected To</Label>
                  <ScrollArea className="h-[150px] mt-2">
                    <div className="space-y-2">
                      {links
                        .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
                        .map(link => {
                          const connectedId = link.source === selectedNode.id ? link.target : link.source;
                          const connectedNode = nodes.find(n => n.id === connectedId);
                          if (!connectedNode) return null;
                          
                          return (
                            <div 
                              key={link.id}
                              className="connected-node"
                              onClick={() => setSelectedNode(connectedNode)}
                            >
                              <div 
                                className="node-icon small"
                                style={{ backgroundColor: connectedNode.color }}
                              >
                                {React.createElement(getNodeIcon(connectedNode.type), { 
                                  className: 'h-3 w-3' 
                                })}
                              </div>
                              <span className="text-sm">{connectedNode.title}</span>
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ color: getLinkColor(link.type) }}
                              >
                                {link.type}
                              </Badge>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    Open
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="graph-legend">
        <span className="legend-title">Node Types:</span>
        {['note', 'document', 'folder', 'tag', 'person', 'link'].map(type => {
          const NodeIcon = getNodeIcon(type as NodeType);
          return (
            <div key={type} className="legend-item">
              <NodeIcon className="h-3 w-3" />
              <span>{type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GraphView;
