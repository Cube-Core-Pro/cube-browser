"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('Canvas');

import React, { useState, useCallback, useRef, useEffect, useMemo as _useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card as _Card, CardContent as _CardContent, CardDescription as _CardDescription, CardHeader as _CardHeader, CardTitle as _CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider as _Slider } from '@/components/ui/slider';
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
  Layout as _Layout,
  Plus,
  Trash2,
  Move as _Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2 as _Minimize2,
  Grid3x3 as _Grid3x3,
  Type,
  FileText,
  Image,
  Link2,
  Square,
  Circle as _Circle,
  Triangle as _Triangle,
  ArrowRight as _ArrowRight,
  MoreVertical,
  Copy,
  Lock,
  Unlock,
  Palette as _Palette,
  AlignLeft as _AlignLeft,
  AlignCenter as _AlignCenter,
  AlignRight as _AlignRight,
  Layers,
  ChevronDown,
  Save,
  Download,
  Upload as _Upload,
  Undo,
  Redo,
  Settings,
  PenTool,
  MousePointer,
  Hand,
  Sparkles as _Sparkles,
  Loader2,
} from 'lucide-react';
import {
  Canvas as CanvasType,
  CanvasItem,
  CanvasConnection,
  CanvasConfig,
  CanvasItemType,
} from '@/types/knowledge-management';
import './Canvas.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendCanvasElement {
  id: string;
  elementType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: string;
}

interface BackendCanvasConfig {
  elements: BackendCanvasElement[];
  backgroundColor: string;
  gridEnabled: boolean;
}

const toFrontendCanvasItem = (backend: BackendCanvasElement): CanvasItem => ({
  id: backend.id,
  type: (backend.elementType as CanvasItemType) || 'note',
  content: backend.content,
  x: backend.x,
  y: backend.y,
  width: backend.width,
  height: backend.height,
  style: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderRadius: 8,
  },
  zIndex: 1,
  locked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Static connections (backend for connections not yet implemented)
const staticConnections: CanvasConnection[] = [
  { id: 'conn-1', fromId: 'el-1', toId: 'el-2', type: 'arrow', color: '#6b7280' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getItemIcon = (type: CanvasItemType) => {
  switch (type) {
    case 'note':
      return FileText;
    case 'text':
      return Type;
    case 'image':
      return Image;
    case 'shape':
      return Square;
    case 'link':
      return Link2;
    case 'card':
      return Layers;
    case 'drawing':
      return PenTool;
    default:
      return Square;
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CanvasItemComponentProps {
  item: CanvasItem;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (dx: number, dy: number) => void;
  onResize: (width: number, height: number) => void;
}

function CanvasItemComponent({ 
  item, 
  isSelected, 
  onSelect, 
  onMove, 
  onResize: _onResize 
}: CanvasItemComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (item.locked) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX - item.x, y: e.clientY - item.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    onMove(e.clientX - dragStart.x - item.x, e.clientY - dragStart.y - item.y);
  }, [isDragging, dragStart, item.x, item.y, onMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const renderContent = () => {
    switch (item.type) {
      case 'note':
        return (
          <div 
            className="canvas-note"
            style={{
              backgroundColor: item.style?.backgroundColor || '#fef3c7',
              borderColor: item.style?.borderColor || '#f59e0b',
              borderRadius: item.style?.borderRadius || 8,
            }}
          >
            <pre className="note-content">{item.content}</pre>
          </div>
        );
      
      case 'text':
        return (
          <div 
            className="canvas-text"
            style={{
              fontSize: item.style?.fontSize || 14,
              fontWeight: item.style?.fontWeight || 'normal',
              textAlign: item.style?.textAlign as 'left' | 'center' | 'right' || 'left',
            }}
          >
            {item.content}
          </div>
        );
      
      case 'image':
        return (
          <div className="canvas-image">
            <img src={item.content} alt="" />
          </div>
        );
      
      case 'shape':
        return (
          <div 
            className="canvas-shape"
            style={{
              backgroundColor: item.style?.backgroundColor || '#dbeafe',
              borderColor: item.style?.borderColor || '#3b82f6',
              borderWidth: item.style?.borderWidth || 2,
              borderRadius: item.style?.borderRadius || 0,
            }}
          />
        );
      
      case 'card':
        try {
          const cardData = JSON.parse(item.content);
          return (
            <div 
              className="canvas-card"
              style={{
                backgroundColor: item.style?.backgroundColor || '#fff',
                borderColor: item.style?.borderColor || '#e5e7eb',
              }}
            >
              <h4 className="card-title">{cardData.title}</h4>
              <p className="card-description">{cardData.description}</p>
              {cardData.status && (
                <Badge variant="secondary">{cardData.status}</Badge>
              )}
            </div>
          );
        } catch {
          return <div className="canvas-card-error">Invalid card data</div>;
        }
      
      default:
        return <div className="canvas-placeholder">Unknown type</div>;
    }
  };

  return (
    <div
      className={`canvas-item ${isSelected ? 'selected' : ''} ${item.locked ? 'locked' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        zIndex: item.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {renderContent()}
      
      {isSelected && !item.locked && (
        <>
          <div className="resize-handle nw" />
          <div className="resize-handle ne" />
          <div className="resize-handle sw" />
          <div className="resize-handle se" />
        </>
      )}
      
      {item.locked && (
        <div className="lock-indicator">
          <Lock className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface CanvasProps {
  onClose?: () => void;
}

export function Canvas({ onClose: _onClose }: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [_canvasElements, setCanvasElements] = useState<CanvasItem[]>([]);
  const [config, setConfig] = useState<CanvasConfig>({
    enabled: true,
    defaultZoom: 1,
    minZoom: 0.25,
    maxZoom: 3,
    gridEnabled: true,
    enableGrid: true,
    snapToGrid: true,
    gridSize: 20,
    autoSave: true,
    saveInterval: 30000,
    defaultCardColor: '#ffffff',
    showMinimap: false,
    showRulers: false,
    defaultItemStyle: {},
  });
  const [canvas, setCanvas] = useState<CanvasType>({
    id: 'canvas-1',
    name: 'Project Canvas',
    items: [],
    connections: staticConnections,
    viewport: { x: 0, y: 0, zoom: 1 },
    gridEnabled: true,
    snapToGrid: true,
    gridSize: 20,
    settings: config,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'pan' | 'draw'>('select');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const { toast } = useToast();

  // Fetch canvas data from backend
  useEffect(() => {
    const fetchCanvasConfig = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendCanvasConfig>('get_canvas_config');
        const frontendElements = backendConfig.elements.map(toFrontendCanvasItem);
        setCanvasElements(frontendElements);
        setCanvas(prev => ({
          ...prev,
          items: frontendElements,
          gridEnabled: backendConfig.gridEnabled,
        }));
        setConfig(prev => ({
          ...prev,
          gridEnabled: backendConfig.gridEnabled,
          enableGrid: backendConfig.gridEnabled,
        }));
      } catch (error) {
        log.error('Failed to fetch canvas config:', error);
        toast({
          title: 'Error',
          description: 'Failed to load canvas data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCanvasConfig();
  }, [toast]);

  const selectedItem = canvas.items.find(i => i.id === selectedItemId);

  const handleAddItem = useCallback((type: CanvasItemType) => {
    const newItem: CanvasItem = {
      id: `item-${Date.now()}`,
      type,
      content: type === 'note' ? 'New note...' : type === 'text' ? 'New text' : '',
      x: 200 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      width: type === 'note' ? 200 : type === 'text' ? 200 : 150,
      height: type === 'note' ? 150 : type === 'text' ? 60 : 100,
      zIndex: canvas.items.length + 1,
      locked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCanvas(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setSelectedItemId(newItem.id);
    
    toast({ title: 'Item Added', description: `New ${type} created` });
  }, [canvas.items.length, toast]);

  const handleMoveItem = useCallback((id: string, dx: number, dy: number) => {
    setCanvas(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item;
        let newX = item.x + dx;
        let newY = item.y + dy;
        
        if (config.snapToGrid) {
          newX = Math.round(newX / config.gridSize) * config.gridSize;
          newY = Math.round(newY / config.gridSize) * config.gridSize;
        }
        
        return { ...item, x: newX, y: newY, updatedAt: new Date() };
      }),
    }));
  }, [config.snapToGrid, config.gridSize]);

  const handleDeleteItem = useCallback((id: string) => {
    setCanvas(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
      connections: prev.connections.filter(
        conn => conn.fromId !== id && conn.toId !== id
      ),
    }));
    setSelectedItemId(null);
    toast({ title: 'Item Deleted' });
  }, [toast]);

  const handleToggleLock = useCallback((id: string) => {
    setCanvas(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, locked: !item.locked } : item
      ),
    }));
  }, []);

  const handleDuplicateItem = useCallback((id: string) => {
    const original = canvas.items.find(i => i.id === id);
    if (!original) return;

    const duplicate: CanvasItem = {
      ...original,
      id: `item-${Date.now()}`,
      x: original.x + 20,
      y: original.y + 20,
      zIndex: canvas.items.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCanvas(prev => ({
      ...prev,
      items: [...prev.items, duplicate],
    }));
    setSelectedItemId(duplicate.id);
    toast({ title: 'Item Duplicated' });
  }, [canvas.items, toast]);

  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(config.minZoom, Math.min(config.maxZoom, prev + delta)));
  }, [config.minZoom, config.maxZoom]);

  // Loading state
  if (loading) {
    return (
      <div className="canvas-container flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-container">
      {/* Toolbar */}
      <div className="canvas-toolbar">
        <div className="toolbar-section">
          <Button
            variant={tool === 'select' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setTool('select')}
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === 'pan' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setTool('pan')}
          >
            <Hand className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === 'draw' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setTool('draw')}
          >
            <PenTool className="h-4 w-4" />
          </Button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleAddItem('note')}>
                <FileText className="h-4 w-4 mr-2" />
                Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddItem('text')}>
                <Type className="h-4 w-4 mr-2" />
                Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddItem('image')}>
                <Image className="h-4 w-4 mr-2" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddItem('shape')}>
                <Square className="h-4 w-4 mr-2" />
                Shape
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddItem('card')}>
                <Layers className="h-4 w-4 mr-2" />
                Card
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <Button variant="ghost" size="icon">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="toolbar-spacer" />

        <div className="toolbar-section">
          <Button variant="ghost" size="icon" onClick={() => handleZoom(-0.1)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="zoom-display">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => handleZoom(0.1)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <Button variant="ghost" size="icon">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="canvas-main">
        <div 
          ref={canvasRef}
          className={`canvas-workspace ${config.enableGrid ? 'with-grid' : ''}`}
          style={{
            backgroundSize: `${config.gridSize * zoom}px ${config.gridSize * zoom}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
          onClick={() => setSelectedItemId(null)}
        >
          {/* Connections */}
          <svg className="canvas-connections">
            {canvas.connections.map(conn => {
              const fromItem = canvas.items.find(i => i.id === conn.fromId);
              const toItem = canvas.items.find(i => i.id === conn.toId);
              if (!fromItem || !toItem) return null;

              const x1 = fromItem.x + fromItem.width / 2;
              const y1 = fromItem.y + fromItem.height / 2;
              const x2 = toItem.x + toItem.width / 2;
              const y2 = toItem.y + toItem.height / 2;

              return (
                <g key={conn.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={conn.color}
                    strokeWidth="2"
                    markerEnd={conn.type === 'arrow' ? 'url(#arrowhead)' : undefined}
                  />
                </g>
              );
            })}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
              </marker>
            </defs>
          </svg>

          {/* Items */}
          {canvas.items.map(item => (
            <CanvasItemComponent
              key={item.id}
              item={item}
              isSelected={selectedItemId === item.id}
              onSelect={() => setSelectedItemId(item.id)}
              onMove={(dx, dy) => handleMoveItem(item.id, dx, dy)}
              onResize={() => {}}
            />
          ))}
        </div>

        {/* Properties Panel */}
        {selectedItem && (
          <div className="canvas-properties">
            <div className="properties-header">
              <div className="flex items-center gap-2">
                {React.createElement(getItemIcon(selectedItem.type), { className: 'h-4 w-4' })}
                <span className="font-medium capitalize">{selectedItem.type}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDuplicateItem(selectedItem.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleLock(selectedItem.id)}>
                    {selectedItem.locked ? (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Lock
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleDeleteItem(selectedItem.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ScrollArea className="flex-1">
              <div className="properties-content">
                <div className="property-group">
                  <Label className="text-xs text-muted-foreground">Position</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">X</Label>
                      <Input 
                        type="number" 
                        value={Math.round(selectedItem.x)}
                        readOnly
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input 
                        type="number" 
                        value={Math.round(selectedItem.y)}
                        readOnly
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="property-group">
                  <Label className="text-xs text-muted-foreground">Size</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Width</Label>
                      <Input 
                        type="number" 
                        value={Math.round(selectedItem.width)}
                        readOnly
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height</Label>
                      <Input 
                        type="number" 
                        value={Math.round(selectedItem.height)}
                        readOnly
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {(selectedItem.type === 'note' || selectedItem.type === 'text') && (
                  <div className="property-group">
                    <Label className="text-xs text-muted-foreground">Content</Label>
                    <Textarea
                      value={selectedItem.content}
                      className="min-h-[100px] text-sm"
                      readOnly
                    />
                  </div>
                )}

                <div className="property-group">
                  <Label className="text-xs text-muted-foreground">Layer</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">z-index: {selectedItem.zIndex}</span>
                    <div className="flex gap-1 ml-auto">
                      <Button variant="outline" size="icon" className="h-7 w-7">
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7">
                        <ChevronDown className="h-3 w-3 rotate-180" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="canvas-statusbar">
        <span className="text-xs text-muted-foreground">
          {canvas.items.length} items · {canvas.connections.length} connections
        </span>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={config.enableGrid}
              onCheckedChange={(enableGrid) => setConfig(prev => ({ ...prev, enableGrid }))}
            />
            Grid
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={config.snapToGrid}
              onCheckedChange={(snapToGrid) => setConfig(prev => ({ ...prev, snapToGrid }))}
            />
            Snap
          </label>
        </div>
      </div>
    </div>
  );
}

export default Canvas;
