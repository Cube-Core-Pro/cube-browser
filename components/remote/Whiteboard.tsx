"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('Whiteboard');

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card as _Card, CardContent as _CardContent, CardDescription as _CardDescription, CardHeader as _CardHeader, CardTitle as _CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input as _Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs as _Tabs, TabsContent as _TabsContent, TabsList as _TabsList, TabsTrigger as _TabsTrigger } from '@/components/ui/tabs';
import { Popover as _Popover, PopoverContent as _PopoverContent, PopoverTrigger as _PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import {
  Pencil,
  Highlighter,
  Eraser,
  Type,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Star,
  Minus,
  MousePointer,
  Crosshair,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Upload as _Upload,
  Copy as _Copy,
  Plus,
  Settings as _Settings,
  Users,
  Grid as _Grid,
  Move as _Move,
  ZoomIn,
  ZoomOut,
  Maximize as _Maximize,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import {
  WhiteboardConfig,
  WhiteboardTool,
  WhiteboardPage,
  WhiteboardCollaborator,
  ShapeType,
} from '@/types/remote-desktop-pro';
import './Whiteboard.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendWhiteboardElement {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface BackendWhiteboardSession {
  id: string;
  name: string;
  participants: number;
  createdAt: number;
}

interface BackendWhiteboardConfig {
  elements: BackendWhiteboardElement[];
  sessions: BackendWhiteboardSession[];
  currentTool: string;
  currentColor: string;
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

function convertSessionToPage(session: BackendWhiteboardSession, index: number): WhiteboardPage {
  return {
    id: session.id,
    name: session.name,
    background: index === 0 ? 'white' : 'grid',
    strokes: [],
    shapes: [],
    texts: [],
    createdAt: new Date(session.createdAt),
    modifiedAt: new Date(session.createdAt),
  };
}

const defaultCollaborators: WhiteboardCollaborator[] = [];

const colorPalette = [
  '#1f2937', '#dc2626', '#ea580c', '#ca8a04', '#16a34a',
  '#0891b2', '#2563eb', '#7c3aed', '#c026d3', '#6b7280',
];

const _brushSizes = [2, 4, 6, 8, 12, 16, 24, 32];

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

interface ToolDef {
  id: WhiteboardTool;
  name: string;
  icon: React.ElementType;
}

const tools: ToolDef[] = [
  { id: 'pen', name: 'Pen', icon: Pencil },
  { id: 'highlighter', name: 'Highlighter', icon: Highlighter },
  { id: 'eraser', name: 'Eraser', icon: Eraser },
  { id: 'text', name: 'Text', icon: Type },
  { id: 'shape', name: 'Shape', icon: Square },
  { id: 'arrow', name: 'Arrow', icon: ArrowRight },
  { id: 'pointer', name: 'Pointer', icon: MousePointer },
  { id: 'laser', name: 'Laser', icon: Crosshair },
];

const shapes: { id: ShapeType; icon: React.ElementType }[] = [
  { id: 'rectangle', icon: Square },
  { id: 'circle', icon: Circle },
  { id: 'triangle', icon: Triangle },
  { id: 'line', icon: Minus },
  { id: 'arrow', icon: ArrowRight },
  { id: 'star', icon: Star },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface WhiteboardProps {
  onClose?: () => void;
}

export function Whiteboard({ onClose: _onClose }: WhiteboardProps) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<WhiteboardConfig>({
    enabled: true,
    defaultTool: 'pen',
    defaultColor: '#1f2937',
    defaultWidth: 4,
    snapToGrid: false,
    gridSize: 20,
    maxPages: 10,
    autoSave: true,
    collaborators: defaultCollaborators,
  });
  const [activeTool, setActiveTool] = useState<WhiteboardTool>('pen');
  const [activeColor, setActiveColor] = useState('#1f2937');
  const [brushSize, setBrushSize] = useState(4);
  const [activeShape, setActiveShape] = useState<ShapeType>('rectangle');
  const [pages, setPages] = useState<WhiteboardPage[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [_isDrawing, _setIsDrawing] = useState(false);
  const [canUndo, _setCanUndo] = useState(true);
  const [canRedo, setCanRedo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const activeCollaborators = config.collaborators.filter(c => c.isActive).length;

  useEffect(() => {
    let mounted = true;

    const fetchWhiteboardConfig = async () => {
      try {
        const backendConfig = await invoke<BackendWhiteboardConfig>('get_whiteboard_config');
        
        if (mounted) {
          const convertedPages = backendConfig.sessions.length > 0
            ? backendConfig.sessions.map(convertSessionToPage)
            : [{
                id: 'page-1',
                name: 'Main Board',
                background: 'white' as const,
                strokes: [],
                shapes: [],
                texts: [],
                createdAt: new Date(),
                modifiedAt: new Date(),
              }];
          
          setPages(convertedPages);
          setActiveTool(backendConfig.currentTool as WhiteboardTool || 'pen');
          setActiveColor(backendConfig.currentColor || '#1f2937');
        }
      } catch (error) {
        log.error('Failed to fetch whiteboard config:', error);
        if (mounted) {
          setPages([{
            id: 'page-1',
            name: 'Main Board',
            background: 'white',
            strokes: [],
            shapes: [],
            texts: [],
            createdAt: new Date(),
            modifiedAt: new Date(),
          }]);
          toast({
            title: 'Error',
            description: 'Failed to load whiteboard configuration',
            variant: 'destructive',
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchWhiteboardConfig();
    return () => { mounted = false; };
  }, [toast]);

  const handleToolChange = useCallback((tool: WhiteboardTool) => {
    setActiveTool(tool);
  }, []);

  const handleClear = useCallback(async () => {
    try {
      await invoke('clear_whiteboard');
      toast({
        title: 'Board Cleared',
        description: 'All drawings have been removed',
      });
    } catch (error) {
      log.error('Failed to clear whiteboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear whiteboard',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleUndo = useCallback(() => {
    setCanRedo(true);
    toast({ title: 'Undo' });
  }, [toast]);

  const handleRedo = useCallback(() => {
    toast({ title: 'Redo' });
  }, [toast]);

  const handleExport = useCallback(() => {
    toast({
      title: 'Exporting',
      description: 'Saving whiteboard as image...',
    });
  }, [toast]);

  const handleAddPage = useCallback(() => {
    if (pages.length >= config.maxPages) {
      toast({
        title: 'Maximum Pages Reached',
        description: `You can have up to ${config.maxPages} pages`,
        variant: 'destructive',
      });
      return;
    }
    
    const newPage: WhiteboardPage = {
      id: `page-${pages.length + 1}`,
      name: `Page ${pages.length + 1}`,
      background: 'white',
      strokes: [],
      shapes: [],
      texts: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    setPages(prev => [...prev, newPage]);
    setActivePage(pages.length);
  }, [pages.length, config.maxPages, toast]);

  if (loading) {
    return (
      <div className="whiteboard">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="whiteboard">
      {/* Header */}
      <div className="whiteboard-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Pencil className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Whiteboard</h2>
            <p className="text-sm text-muted-foreground">
              Collaborative drawing canvas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            {activeCollaborators} active
          </Badge>
          <Badge variant="outline">{zoom}%</Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="whiteboard-container">
        {/* Toolbar */}
        <div className="whiteboard-toolbar">
          {/* Tools */}
          <div className="tool-group">
            <Label className="tool-group-label">Tools</Label>
            <div className="tool-buttons">
              {tools.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <Button
                    key={tool.id}
                    size="sm"
                    variant={activeTool === tool.id ? 'default' : 'ghost'}
                    onClick={() => handleToolChange(tool.id)}
                    title={tool.name}
                  >
                    <ToolIcon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Shapes (when shape tool is active) */}
          {activeTool === 'shape' && (
            <div className="tool-group">
              <Label className="tool-group-label">Shapes</Label>
              <div className="tool-buttons">
                {shapes.map((shape) => {
                  const ShapeIcon = shape.icon;
                  return (
                    <Button
                      key={shape.id}
                      size="sm"
                      variant={activeShape === shape.id ? 'default' : 'ghost'}
                      onClick={() => setActiveShape(shape.id)}
                    >
                      <ShapeIcon className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Colors */}
          <div className="tool-group">
            <Label className="tool-group-label">Color</Label>
            <div className="color-palette">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${activeColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setActiveColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Brush Size */}
          <div className="tool-group">
            <Label className="tool-group-label">Size: {brushSize}px</Label>
            <Slider
              value={[brushSize]}
              onValueChange={([value]) => setBrushSize(value)}
              min={1}
              max={32}
              step={1}
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="tool-group">
            <Label className="tool-group-label">Actions</Label>
            <div className="tool-buttons">
              <Button size="sm" variant="ghost" onClick={handleUndo} disabled={!canUndo}>
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRedo} disabled={!canRedo}>
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleClear}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Zoom */}
          <div className="tool-group">
            <Label className="tool-group-label">Zoom</Label>
            <div className="tool-buttons">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setZoom(Math.max(25, zoom - 25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setZoom(100)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setZoom(Math.min(200, zoom + 25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Grid */}
          <div className="tool-group">
            <div className="flex items-center justify-between">
              <Label className="tool-group-label">Snap to Grid</Label>
              <Switch
                checked={config.snapToGrid}
                onCheckedChange={(snapToGrid) => 
                  setConfig(prev => ({ ...prev, snapToGrid }))}
              />
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="canvas-container">
          {/* Page Tabs */}
          <div className="page-tabs">
            {pages.map((page, index) => (
              <button
                key={page.id}
                className={`page-tab ${activePage === index ? 'active' : ''}`}
                onClick={() => setActivePage(index)}
              >
                {page.name}
              </button>
            ))}
            <button className="page-tab add" onClick={handleAddPage}>
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Canvas */}
          <div 
            className="canvas-wrapper"
            style={{ 
              backgroundImage: pages[activePage].background === 'grid' 
                ? `url("data:image/svg+xml,%3Csvg width='${config.gridSize}' height='${config.gridSize}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M ${config.gridSize} 0 L 0 0 0 ${config.gridSize}' fill='none' stroke='%23e5e7eb' stroke-width='1'/%3E%3C/svg%3E")`
                : pages[activePage].background === 'dots'
                ? `url("data:image/svg+xml,%3Csvg width='${config.gridSize}' height='${config.gridSize}' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='${config.gridSize/2}' cy='${config.gridSize/2}' r='1' fill='%23d1d5db'/%3E%3C/svg%3E")`
                : 'none'
            }}
          >
            <canvas
              ref={canvasRef}
              className="whiteboard-canvas"
              style={{ transform: `scale(${zoom / 100})` }}
            />
            
            {/* Collaborator Cursors */}
            {config.collaborators.filter(c => c.isActive && c.cursor).map((collaborator) => (
              <div
                key={collaborator.id}
                className="collaborator-cursor"
                style={{
                  left: collaborator.cursor!.x,
                  top: collaborator.cursor!.y,
                  borderColor: collaborator.color,
                }}
              >
                <MousePointer 
                  className="h-4 w-4" 
                  style={{ color: collaborator.color }} 
                />
                <span 
                  className="cursor-label"
                  style={{ backgroundColor: collaborator.color }}
                >
                  {collaborator.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Collaborators Panel */}
        <div className="collaborators-panel">
          <div className="panel-header">
            <Users className="h-4 w-4" />
            <span>Collaborators</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="collaborator-list">
              {config.collaborators.map((collaborator) => (
                <div 
                  key={collaborator.id} 
                  className={`collaborator-item ${collaborator.isActive ? 'active' : ''}`}
                >
                  <div 
                    className="collaborator-avatar"
                    style={{ backgroundColor: collaborator.color }}
                  >
                    {collaborator.name.charAt(0)}
                  </div>
                  <div className="collaborator-info">
                    <span className="collaborator-name">{collaborator.name}</span>
                    {collaborator.isActive && collaborator.activeTool && (
                      <span className="collaborator-tool">
                        Using {collaborator.activeTool}
                      </span>
                    )}
                  </div>
                  <div className={`status-dot ${collaborator.isActive ? 'active' : ''}`} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default Whiteboard;
