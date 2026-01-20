/**
 * Collaborative Whiteboard Service
 * Real-time drawing, shapes, and annotations for video conferences
 * CUBE Nexum - Enterprise Video Conferencing
 * 
 * Now integrated with Tauri backend for:
 * - Session management (create, join, leave)
 * - Real-time collaboration sync
 * - Screen sharing control
 * - Collaborative editing
 * - Session recording
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Whiteboard');

// ============================================================================
// Backend Integration Types
// ============================================================================

interface BackendParticipant {
  id: string;
  name: string;
  avatar_url?: string;
  cursor_position?: { x: number; y: number };
  is_host: boolean;
  is_speaker: boolean;
  is_screen_sharing: boolean;
  joined_at: string;
  last_activity: string;
  permissions: {
    can_control_screen: boolean;
    can_edit_workflow: boolean;
    can_speak: boolean;
    can_share_screen: boolean;
    can_control_browser: boolean;
  };
}

interface BackendCollaborationSession {
  id: string;
  name: string;
  host_id: string;
  participants: BackendParticipant[];
  created_at: string;
  is_screen_sharing: boolean;
  is_voice_active: boolean;
  is_video_active: boolean;
  shared_workflow_id?: string;
  permissions: {
    allow_screen_control: boolean;
    allow_workflow_edit: boolean;
    allow_voice: boolean;
    allow_video: boolean;
    allow_browser_control: boolean;
    max_participants: number;
  };
}

interface BackendCollaborativeEdit {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  edit_type: string;
  target_type: string;
  target_id: string;
  data: Record<string, unknown>;
  timestamp: string;
}

const BackendCollaborationAPI = {
  async createSession(
    name: string,
    hostName: string,
    permissions: BackendCollaborationSession['permissions']
  ): Promise<BackendCollaborationSession> {
    try {
      return await invoke<BackendCollaborationSession>('create_collaboration_session', {
        name,
        hostName,
        permissions,
      });
    } catch (error) {
      log.warn('Backend create_collaboration_session failed:', error);
      throw error;
    }
  },

  async joinSession(sessionId: string, participantName: string): Promise<BackendCollaborationSession> {
    try {
      return await invoke<BackendCollaborationSession>('join_collaboration_session', {
        sessionId,
        participantName,
      });
    } catch (error) {
      log.warn('Backend join_collaboration_session failed:', error);
      throw error;
    }
  },

  async updateCursorPosition(sessionId: string, participantId: string, x: number, y: number): Promise<void> {
    try {
      await invoke<void>('update_cursor_position', { sessionId, participantId, x, y });
    } catch (error) {
      log.warn('Backend update_cursor_position failed:', error);
    }
  },

  async startScreenSharing(sessionId: string, participantId: string): Promise<void> {
    try {
      await invoke<void>('start_screen_sharing', { sessionId, participantId });
    } catch (error) {
      log.warn('Backend start_screen_sharing failed:', error);
      throw error;
    }
  },

  async stopScreenSharing(sessionId: string, participantId: string): Promise<void> {
    try {
      await invoke<void>('stop_screen_sharing', { sessionId, participantId });
    } catch (error) {
      log.warn('Backend stop_screen_sharing failed:', error);
    }
  },

  async shareWorkflow(sessionId: string, workflowId: string, participantId: string): Promise<void> {
    try {
      await invoke<void>('share_workflow_in_session', { sessionId, workflowId, participantId });
    } catch (error) {
      log.warn('Backend share_workflow_in_session failed:', error);
      throw error;
    }
  },

  async applyEdit(edit: Omit<BackendCollaborativeEdit, 'id' | 'timestamp'>): Promise<BackendCollaborativeEdit> {
    try {
      return await invoke<BackendCollaborativeEdit>('apply_collaborative_edit', { edit });
    } catch (error) {
      log.warn('Backend apply_collaborative_edit failed:', error);
      throw error;
    }
  },

  async getSessionEdits(sessionId: string, sinceTimestamp?: string): Promise<BackendCollaborativeEdit[]> {
    try {
      return await invoke<BackendCollaborativeEdit[]>('get_session_edits', { sessionId, sinceTimestamp });
    } catch (error) {
      log.warn('Backend get_session_edits failed:', error);
      return [];
    }
  },

  async sendChatMessage(sessionId: string, userId: string, userName: string, message: string): Promise<void> {
    try {
      await invoke<void>('send_collaboration_chat', { sessionId, userId, userName, message });
    } catch (error) {
      log.warn('Backend send_collaboration_chat failed:', error);
    }
  },

  async startRecording(sessionId: string): Promise<string> {
    try {
      return await invoke<string>('start_session_recording', { sessionId });
    } catch (error) {
      log.warn('Backend start_session_recording failed:', error);
      throw error;
    }
  },

  async stopRecording(sessionId: string): Promise<void> {
    try {
      await invoke<void>('stop_session_recording', { sessionId });
    } catch (error) {
      log.warn('Backend stop_session_recording failed:', error);
    }
  },

  async grantPermission(
    sessionId: string,
    participantId: string,
    permission: string,
    granted: boolean
  ): Promise<void> {
    try {
      await invoke<void>('grant_participant_permission', { sessionId, participantId, permission, granted });
    } catch (error) {
      log.warn('Backend grant_participant_permission failed:', error);
      throw error;
    }
  },

  async leaveSession(sessionId: string, participantId: string): Promise<void> {
    try {
      await invoke<void>('leave_collaboration_session', { sessionId, participantId });
    } catch (error) {
      log.warn('Backend leave_collaboration_session failed:', error);
    }
  },

  async getActiveSessions(): Promise<BackendCollaborationSession[]> {
    try {
      return await invoke<BackendCollaborationSession[]>('get_active_sessions');
    } catch (error) {
      log.warn('Backend get_active_sessions failed:', error);
      return [];
    }
  },

  async getSessionDetails(sessionId: string): Promise<BackendCollaborationSession | null> {
    try {
      return await invoke<BackendCollaborationSession>('get_session_details', { sessionId });
    } catch (error) {
      log.warn('Backend get_session_details failed:', error);
      return null;
    }
  },
};

// Export backend API
export { BackendCollaborationAPI };
export type { BackendCollaborationSession, BackendParticipant, BackendCollaborativeEdit };

// ============================================================================
// Enum and Types
// ============================================================================

// Enum for tool types (used by page-pro.tsx)
export enum ToolType {
  PEN = 'pen',
  HIGHLIGHTER = 'highlighter',
  ERASER = 'eraser',
  LINE = 'line',
  RECTANGLE = 'rectangle',
  ELLIPSE = 'ellipse',
  ARROW = 'arrow',
  TEXT = 'text',
  SELECT = 'select',
  LASER = 'laser'
}

// Type alias for string-based tool type (backward compatibility)
export type ToolTypeString = 'pen' | 'highlighter' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'select' | 'laser';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingSettings {
  tool: ToolType;
  color: string;
  size: number;
  opacity: number;
}

export interface WhiteboardData {
  type: 'draw' | 'clear' | 'undo' | 'redo';
  element?: DrawingElement;
  elements?: DrawingElement[];
}

export interface DrawingElement {
  id: string;
  type: ToolType | ToolTypeString;
  points: Point[];
  color: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  fill?: string;
  text?: string;
  fontSize?: number;
  timestamp: number;
  userId: string;
  userName: string;
}

export interface WhiteboardState {
  elements: DrawingElement[];
  currentPage: number;
  totalPages: number;
  backgroundColor: string;
  gridEnabled: boolean;
  snapToGrid: boolean;
}

export interface WhiteboardConfig {
  width: number;
  height: number;
  backgroundColor?: string;
  gridSize?: number;
  maxUndoSteps?: number;
  snapToGrid?: boolean;
}

export const DEFAULT_COLORS = [
  '#000000', // Black
  '#ffffff', // White
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#6b7280', // Gray
];

export const STROKE_WIDTHS = [2, 4, 6, 8, 12, 16, 24];

type DrawEventCallback = (element: DrawingElement) => void;
type ClearEventCallback = () => void;
type UndoRedoCallback = (elements: DrawingElement[]) => void;
type RemoteDrawCallback = (data: WhiteboardData) => void;

export class WhiteboardService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private previewCanvas: HTMLCanvasElement | null = null;
  private previewCtx: CanvasRenderingContext2D | null = null;
  
  private state: WhiteboardState = {
    elements: [],
    currentPage: 1,
    totalPages: 1,
    backgroundColor: '#ffffff',
    gridEnabled: false,
    snapToGrid: false,
  };
  
  private config: WhiteboardConfig = {
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    gridSize: 20,
    maxUndoSteps: 50,
  };
  
  private currentTool: ToolType = ToolType.PEN;
  private currentColor = '#000000';
  private currentStrokeWidth = 4;
  private currentStrokeStyle: StrokeStyle = 'solid';
  private currentFill: string | undefined = undefined;
  
  private isDrawing = false;
  private currentPoints: Point[] = [];
  private currentElement: DrawingElement | null = null;
  
  private undoStack: DrawingElement[][] = [];
  private redoStack: DrawingElement[][] = [];
  
  private userId = '';
  private userName = '';
  
  // Event callbacks
  private onDrawCallbacks: DrawEventCallback[] = [];
  private onClearCallbacks: ClearEventCallback[] = [];
  private onUndoRedoCallbacks: UndoRedoCallback[] = [];
  private onRemoteDrawCallback: RemoteDrawCallback | null = null;
  
  // Laser pointer state
  private laserPosition: Point | null = null;
  private laserAnimationId: number | null = null;

  /**
   * Constructor - accepts optional config or canvas element for compatibility
   */
  constructor(configOrCanvas?: Partial<WhiteboardConfig> | HTMLCanvasElement) {
    if (configOrCanvas instanceof HTMLCanvasElement) {
      // Direct canvas initialization
      this.canvas = configOrCanvas;
      this.ctx = this.canvas.getContext('2d');
      this.config.width = configOrCanvas.width;
      this.config.height = configOrCanvas.height;
      
      // Create preview canvas
      this.previewCanvas = document.createElement('canvas');
      this.previewCanvas.width = this.config.width;
      this.previewCanvas.height = this.config.height;
      this.previewCtx = this.previewCanvas.getContext('2d');
      
      // Set up event listeners on main canvas
      this.setupEventListenersOnCanvas(configOrCanvas);
      
      // Set default user
      this.userId = `user_${Date.now()}`;
      this.userName = 'Anonymous';
      
      // Initial render
      this.render();
    } else if (configOrCanvas) {
      this.config = { ...this.config, ...configOrCanvas };
    }
  }

  /**
   * Set up event listeners directly on a canvas element
   */
  private setupEventListenersOnCanvas(canvas: HTMLCanvasElement): void {
    // Mouse events
    canvas.addEventListener('mousedown', this.handlePointerDown);
    canvas.addEventListener('mousemove', this.handlePointerMove);
    canvas.addEventListener('mouseup', this.handlePointerUp);
    canvas.addEventListener('mouseleave', this.handlePointerUp);

    // Touch events
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.handleTouchEnd);
  }

  /**
   * Initialize the whiteboard with canvas elements
   */
  initialize(
    mainCanvas: HTMLCanvasElement, 
    previewCanvas: HTMLCanvasElement,
    userId: string,
    userName: string
  ): void {
    this.canvas = mainCanvas;
    this.previewCanvas = previewCanvas;
    this.userId = userId;
    this.userName = userName;
    
    // Set canvas dimensions
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.previewCanvas.width = this.config.width;
    this.previewCanvas.height = this.config.height;
    
    this.ctx = this.canvas.getContext('2d');
    this.previewCtx = this.previewCanvas.getContext('2d');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initial render
    this.render();
    
    log.debug('[Whiteboard] Initialized');
  }
  
  /**
   * Set drawing settings (used by page-pro.tsx)
   */
  setSettings(settings: DrawingSettings): void {
    this.currentTool = settings.tool;
    this.currentColor = settings.color;
    this.currentStrokeWidth = settings.size;
    // Opacity can be applied through globalAlpha in ctx
    if (this.ctx) {
      this.ctx.globalAlpha = settings.opacity;
    }
    if (this.previewCtx) {
      this.previewCtx.globalAlpha = settings.opacity;
    }
  }
  
  /**
   * Set callback for remote draw events (for collaboration)
   */
  setOnRemoteDrawCallback(callback: RemoteDrawCallback): void {
    this.onRemoteDrawCallback = callback;
  }
  
  /**
   * Receive remote whiteboard data from another participant
   */
  receiveRemoteData(data: WhiteboardData): void {
    switch (data.type) {
      case 'draw':
        if (data.element) {
          this.state.elements.push(data.element);
          this.render();
        }
        break;
      case 'clear':
        this.state.elements = [];
        this.render();
        break;
      case 'undo':
        if (data.elements) {
          this.state.elements = data.elements;
          this.render();
        }
        break;
      case 'redo':
        if (data.elements) {
          this.state.elements = data.elements;
          this.render();
        }
        break;
    }
  }
  
  /**
   * Export whiteboard to SVG
   */
  exportToSVG(): string {
    // Generate SVG from elements
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.config.width}" height="${this.config.height}">`;
    svg += `<rect width="100%" height="100%" fill="${this.state.backgroundColor}"/>`;
    
    for (const element of this.state.elements) {
      if (element.type === ToolType.PEN || element.type === ToolType.HIGHLIGHTER) {
        if (element.points.length > 0) {
          const pathData = element.points.map((p, i) => 
            i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`
          ).join(' ');
          svg += `<path d="${pathData}" stroke="${element.color}" stroke-width="${element.strokeWidth}" fill="none"/>`;
        }
      }
    }
    
    svg += '</svg>';
    return svg;
  }

  /**
   * Set up mouse and touch event listeners
   */
  private setupEventListeners(): void {
    if (!this.previewCanvas) return;

    // Mouse events
    this.previewCanvas.addEventListener('mousedown', this.handlePointerDown);
    this.previewCanvas.addEventListener('mousemove', this.handlePointerMove);
    this.previewCanvas.addEventListener('mouseup', this.handlePointerUp);
    this.previewCanvas.addEventListener('mouseleave', this.handlePointerUp);

    // Touch events
    this.previewCanvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.previewCanvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.previewCanvas.addEventListener('touchend', this.handleTouchEnd);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (!this.previewCanvas) return;

    this.previewCanvas.removeEventListener('mousedown', this.handlePointerDown);
    this.previewCanvas.removeEventListener('mousemove', this.handlePointerMove);
    this.previewCanvas.removeEventListener('mouseup', this.handlePointerUp);
    this.previewCanvas.removeEventListener('mouseleave', this.handlePointerUp);
    this.previewCanvas.removeEventListener('touchstart', this.handleTouchStart);
    this.previewCanvas.removeEventListener('touchmove', this.handleTouchMove);
    this.previewCanvas.removeEventListener('touchend', this.handleTouchEnd);
  }

  /**
   * Get canvas coordinates from event
   */
  private getCanvasCoordinates(e: MouseEvent | Touch): Point {
    if (!this.previewCanvas) return { x: 0, y: 0 };
    
    const rect = this.previewCanvas.getBoundingClientRect();
    const scaleX = this.previewCanvas.width / rect.width;
    const scaleY = this.previewCanvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  /**
   * Handle pointer down (mouse/touch start)
   */
  private handlePointerDown = (e: MouseEvent): void => {
    const point = this.getCanvasCoordinates(e);
    this.startDrawing(point);
  };

  /**
   * Handle pointer move
   */
  private handlePointerMove = (e: MouseEvent): void => {
    const point = this.getCanvasCoordinates(e);
    
    if (this.currentTool === 'laser') {
      this.updateLaserPointer(point);
      return;
    }
    
    if (this.isDrawing) {
      this.continueDrawing(point);
    }
  };

  /**
   * Handle pointer up
   */
  private handlePointerUp = (): void => {
    this.finishDrawing();
  };

  /**
   * Handle touch start
   */
  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const point = this.getCanvasCoordinates(e.touches[0]);
      this.startDrawing(point);
    }
  };

  /**
   * Handle touch move
   */
  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDrawing) {
      const point = this.getCanvasCoordinates(e.touches[0]);
      this.continueDrawing(point);
    }
  };

  /**
   * Handle touch end
   */
  private handleTouchEnd = (): void => {
    this.finishDrawing();
  };

  /**
   * Start drawing
   */
  private startDrawing(point: Point): void {
    if (this.currentTool === 'laser') {
      this.updateLaserPointer(point);
      return;
    }

    this.isDrawing = true;
    this.currentPoints = [point];
    
    if (this.config.snapToGrid && this.state.gridEnabled) {
      point = this.snapToGrid(point);
    }

    this.currentElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.currentTool,
      points: [point],
      color: this.currentColor,
      strokeWidth: this.currentStrokeWidth,
      strokeStyle: this.currentStrokeStyle,
      fill: this.currentFill,
      timestamp: Date.now(),
      userId: this.userId,
      userName: this.userName,
    };

    this.renderPreview();
  }

  /**
   * Continue drawing
   */
  private continueDrawing(point: Point): void {
    if (!this.isDrawing || !this.currentElement) return;

    if (this.config.snapToGrid && this.state.gridEnabled) {
      point = this.snapToGrid(point);
    }

    this.currentPoints.push(point);
    this.currentElement.points = [...this.currentPoints];
    
    this.renderPreview();
  }

  /**
   * Finish drawing
   */
  private finishDrawing(): void {
    if (!this.isDrawing || !this.currentElement) {
      this.isDrawing = false;
      return;
    }

    this.isDrawing = false;

    // Save current state for undo
    this.saveUndoState();

    // Add element to state
    this.state.elements.push(this.currentElement);

    // Notify listeners
    this.onDrawCallbacks.forEach(cb => cb(this.currentElement!));

    // Clear preview and render main canvas
    this.clearPreview();
    this.render();

    this.currentElement = null;
    this.currentPoints = [];
  }

  /**
   * Snap point to grid
   */
  private snapToGrid(point: Point): Point {
    const gridSize = this.config.gridSize || 20;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }

  /**
   * Render the main canvas
   */
  render(): void {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.fillStyle = this.state.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid if enabled
    if (this.state.gridEnabled) {
      this.drawGrid();
    }

    // Draw all elements
    this.state.elements.forEach(element => {
      this.drawElement(this.ctx!, element);
    });
  }

  /**
   * Render the preview canvas
   */
  private renderPreview(): void {
    if (!this.previewCtx || !this.previewCanvas || !this.currentElement) return;

    // Clear preview
    this.clearPreview();

    // Draw current element being created
    this.drawElement(this.previewCtx, this.currentElement);
  }

  /**
   * Clear the preview canvas
   */
  private clearPreview(): void {
    if (!this.previewCtx || !this.previewCanvas) return;
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
  }

  /**
   * Draw grid lines
   */
  private drawGrid(): void {
    if (!this.ctx || !this.canvas) return;

    const gridSize = this.config.gridSize || 20;
    this.ctx.strokeStyle = '#e5e7eb';
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = gridSize; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = gridSize; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  /**
   * Draw a single element
   */
  private drawElement(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Set stroke style
    if (element.strokeStyle === 'dashed') {
      ctx.setLineDash([10, 10]);
    } else if (element.strokeStyle === 'dotted') {
      ctx.setLineDash([2, 8]);
    } else {
      ctx.setLineDash([]);
    }

    switch (element.type) {
      case 'pen':
      case 'highlighter':
        this.drawFreehand(ctx, element);
        break;
      case 'eraser':
        this.drawEraser(ctx, element);
        break;
      case 'line':
        this.drawLine(ctx, element);
        break;
      case 'rectangle':
        this.drawRectangle(ctx, element);
        break;
      case 'circle':
        this.drawCircle(ctx, element);
        break;
      case 'arrow':
        this.drawArrow(ctx, element);
        break;
      case 'text':
        this.drawText(ctx, element);
        break;
    }

    // Reset line dash
    ctx.setLineDash([]);
  }

  /**
   * Draw freehand path
   */
  private drawFreehand(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
    if (element.points.length < 2) return;

    if (element.type === 'highlighter') {
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = element.strokeWidth * 3;
    }

    ctx.beginPath();
    ctx.moveTo(element.points[0].x, element.points[0].y);

    for (let i = 1; i < element.points.length; i++) {
      const p1 = element.points[i - 1];
      const p2 = element.points[i];
      
      // Use quadratic curves for smoother lines
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /**
   * Draw eraser strokes (white color, thick line)
   */
  private drawEraser(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
    ctx.strokeStyle = this.state.backgroundColor;
    ctx.lineWidth = element.strokeWidth * 2;
    this.drawFreehand(ctx, element);
  }

  /**
   * Draw straight line
   */
  private drawLine(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
    if (element.points.length < 2) return;

    const start = element.points[0];
    const end = element.points[element.points.length - 1];

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  /**
   * Draw rectangle
   */
  private drawRectangle(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
    if (element.points.length < 2) return;

    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    const width = end.x - start.x;
    const height = end.y - start.y;

    if (element.fill) {
      ctx.fillStyle = element.fill;
      ctx.fillRect(start.x, start.y, width, height);
    }
    ctx.strokeRect(start.x, start.y, width, height);
  }

  /**
   * Draw circle/ellipse
   */
  private drawCircle(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
    if (element.points.length < 2) return;

    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    const radiusX = Math.abs(end.x - start.x) / 2;
    const radiusY = Math.abs(end.y - start.y) / 2;
    const centerX = start.x + (end.x - start.x) / 2;
    const centerY = start.y + (end.y - start.y) / 2;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    
    if (element.fill) {
      ctx.fillStyle = element.fill;
      ctx.fill();
    }
    ctx.stroke();
  }

  /**
   * Draw arrow
   */
  private drawArrow(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
    if (element.points.length < 2) return;

    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    const headLength = Math.min(30, element.strokeWidth * 5);
    const angle = Math.atan2(end.y - start.y, end.x - start.x);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }

  /**
   * Draw text
   */
  private drawText(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
    if (!element.text || element.points.length < 1) return;

    const pos = element.points[0];
    const fontSize = element.fontSize || 16;

    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = element.color;
    ctx.fillText(element.text, pos.x, pos.y);
  }

  /**
   * Update laser pointer position
   */
  private updateLaserPointer(point: Point): void {
    this.laserPosition = point;
    this.renderLaser();
  }

  /**
   * Render laser pointer
   */
  private renderLaser(): void {
    if (!this.previewCtx || !this.previewCanvas || !this.laserPosition) return;

    // Clear previous laser
    this.clearPreview();

    // Draw laser dot
    const ctx = this.previewCtx;
    const pos = this.laserPosition;

    // Outer glow
    const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 30);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 30, 0, 2 * Math.PI);
    ctx.fill();

    // Inner dot
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
    ctx.fill();
  }

  /**
   * Save current state for undo
   */
  private saveUndoState(): void {
    const currentState = this.state.elements.map(el => ({ ...el }));
    this.undoStack.push(currentState);
    
    // Limit undo stack size
    if (this.undoStack.length > (this.config.maxUndoSteps || 50)) {
      this.undoStack.shift();
    }
    
    // Clear redo stack on new action
    this.redoStack = [];
  }

  /**
   * Undo last action
   */
  undo(): void {
    if (this.undoStack.length === 0) return;

    // Save current state to redo stack
    this.redoStack.push(this.state.elements.map(el => ({ ...el })));

    // Restore previous state
    const previousState = this.undoStack.pop()!;
    this.state.elements = previousState;

    this.render();
    this.onUndoRedoCallbacks.forEach(cb => cb(this.state.elements));
  }

  /**
   * Redo last undone action
   */
  redo(): void {
    if (this.redoStack.length === 0) return;

    // Save current state to undo stack
    this.undoStack.push(this.state.elements.map(el => ({ ...el })));

    // Restore next state
    const nextState = this.redoStack.pop()!;
    this.state.elements = nextState;

    this.render();
    this.onUndoRedoCallbacks.forEach(cb => cb(this.state.elements));
  }

  /**
   * Clear the whiteboard
   */
  clear(): void {
    this.saveUndoState();
    this.state.elements = [];
    this.render();
    this.onClearCallbacks.forEach(cb => cb());
  }

  /**
   * Set current tool
   */
  setTool(tool: ToolType): void {
    this.currentTool = tool;
    
    if (tool === 'eraser') {
      this.currentColor = this.state.backgroundColor;
    }
  }

  /**
   * Set current color
   */
  setColor(color: string): void {
    this.currentColor = color;
  }

  /**
   * Set stroke width
   */
  setStrokeWidth(width: number): void {
    this.currentStrokeWidth = width;
  }

  /**
   * Set stroke style
   */
  setStrokeStyle(style: StrokeStyle): void {
    this.currentStrokeStyle = style;
  }

  /**
   * Set fill color
   */
  setFill(fill: string | undefined): void {
    this.currentFill = fill;
  }

  /**
   * Toggle grid
   */
  toggleGrid(): void {
    this.state.gridEnabled = !this.state.gridEnabled;
    this.render();
  }

  /**
   * Toggle snap to grid
   */
  toggleSnapToGrid(): void {
    this.state.snapToGrid = !this.state.snapToGrid;
  }

  /**
   * Set background color
   */
  setBackgroundColor(color: string): void {
    this.state.backgroundColor = color;
    this.render();
  }

  /**
   * Add text element
   */
  addText(text: string, position: Point, fontSize: number = 16): void {
    this.saveUndoState();

    const element: DrawingElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      points: [position],
      color: this.currentColor,
      strokeWidth: 1,
      strokeStyle: 'solid',
      text,
      fontSize,
      timestamp: Date.now(),
      userId: this.userId,
      userName: this.userName,
    };

    this.state.elements.push(element);
    this.render();
    this.onDrawCallbacks.forEach(cb => cb(element));
  }

  /**
   * Export whiteboard as PNG data URL
   */
  exportToPNG(): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL('image/png');
  }

  /**
   * Export whiteboard as JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.state);
  }

  /**
   * Import whiteboard from JSON
   */
  importFromJSON(json: string): void {
    try {
      const importedState = JSON.parse(json) as WhiteboardState;
      this.state = importedState;
      this.render();
    } catch (error) {
      log.error('[Whiteboard] Failed to import JSON:', error);
    }
  }

  /**
   * Add remote element (from another participant)
   */
  addRemoteElement(element: DrawingElement): void {
    this.state.elements.push(element);
    this.render();
  }

  /**
   * Register draw callback
   */
  onDraw(callback: DrawEventCallback): void {
    this.onDrawCallbacks.push(callback);
  }

  /**
   * Register clear callback
   */
  onClear(callback: ClearEventCallback): void {
    this.onClearCallbacks.push(callback);
  }

  /**
   * Register undo/redo callback
   */
  onUndoRedo(callback: UndoRedoCallback): void {
    this.onUndoRedoCallbacks.push(callback);
  }

  /**
   * Get current state
   */
  getState(): WhiteboardState {
    return { ...this.state };
  }

  /**
   * Get current tool
   */
  getCurrentTool(): ToolType {
    return this.currentTool;
  }

  /**
   * Get current color
   */
  getCurrentColor(): string {
    return this.currentColor;
  }

  /**
   * Get current stroke width
   */
  getCurrentStrokeWidth(): number {
    return this.currentStrokeWidth;
  }

  /**
   * Can undo
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Can redo
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.removeEventListeners();
    
    if (this.laserAnimationId) {
      cancelAnimationFrame(this.laserAnimationId);
    }
    
    this.canvas = null;
    this.previewCanvas = null;
    this.ctx = null;
    this.previewCtx = null;
    this.state.elements = [];
    this.undoStack = [];
    this.redoStack = [];
    this.onDrawCallbacks = [];
    this.onClearCallbacks = [];
    this.onUndoRedoCallbacks = [];
    
    log.debug('[Whiteboard] Disposed');
  }
}

// Factory function
export function createWhiteboardService(config?: Partial<WhiteboardConfig>): WhiteboardService {
  return new WhiteboardService(config);
}

export default WhiteboardService;
