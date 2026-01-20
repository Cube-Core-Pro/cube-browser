// CUBE Nexum - Screenshot React Component
// Advanced screenshot capture with editor, annotations, and recording

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  screenshotService,
  Screenshot,
  CaptureMode,
  type ImageFormat as _ImageFormat,
  AnnotationType,
  ScreenshotSettings,
  type EditorState as _EditorState,
  CaptureRegion,
  CAPTURE_MODES,
  type IMAGE_FORMATS as _IMAGE_FORMATS_TYPE,
  ANNOTATION_TYPES,
  PRESET_COLORS,
  formatFileSize,
  type formatTimestamp as _formatTimestamp,
} from '../../lib/services/browser-screenshot-service';
import { logger } from '@/lib/services/logger-service';
import './Screenshot.css';

const log = logger.scope('Screenshot');

// ==================== Icons ====================

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M2 6C2 4.9 2.9 4 4 4H5.5L7 2H13L14.5 4H16C17.1 4 18 4.9 18 6V15C18 16.1 17.1 17 16 17H4C2.9 17 2 16.1 2 15V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const FullPageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="3" y="2" width="14" height="16" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 6H14M6 10H14M6 14H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const RegionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M6 2V6H2M14 2V6H18M6 18V14H2M14 18V14H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="5" y="5" width="10" height="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
  </svg>
);

const ElementIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="4" y="4" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 15H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const RecordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="10" cy="10" r="3" fill="currentColor"/>
  </svg>
);

const StopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="5" y="5" width="10" height="10" rx="1" fill="currentColor"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="5" y="4" width="3" height="12" rx="1" fill="currentColor"/>
    <rect x="12" y="4" width="3" height="12" rx="1" fill="currentColor"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2V10M8 10L4 6M8 10L12 6M2 14H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 5V3C11 2.45 10.55 2 10 2H3C2.45 2 2 2.45 2 3V10C2 10.55 2.45 11 3 11H5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 14H5L13.5 5.5L10.5 2.5L2 11V14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 4L12 7" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4H14M5 4V2H11V4M6 7V12M10 7V12M3 4L4 14H12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M13 8C13 7.5 12.9 7 12.8 6.5L14 5.5L12.7 3.5L11.2 4C10.8 3.7 10.4 3.4 10 3.2L9.7 1.5H6.3L6 3.2C5.6 3.4 5.2 3.7 4.8 4L3.3 3.5L2 5.5L3.2 6.5C3.1 7 3 7.5 3 8C3 8.5 3.1 9 3.2 9.5L2 10.5L3.3 12.5L4.8 12C5.2 12.3 5.6 12.6 6 12.8L6.3 14.5H9.7L10 12.8C10.4 12.6 10.8 12.3 11.2 12L12.7 12.5L14 10.5L12.8 9.5C12.9 9 13 8.5 13 8Z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const GalleryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="5.5" cy="5.5" r="1.5" fill="currentColor"/>
    <path d="M2 12L5 9L7 11L11 7L14 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6L2 8L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 8H10C12.2 8 14 9.8 14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M12 6L14 8L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 8H6C3.8 8 2 9.8 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Helper function to get capture mode name
const getCaptureModeName = (mode: CaptureMode): string => {
  const found = CAPTURE_MODES.find(m => m.value === mode);
  return found?.name || mode;
};

// Helper function to get annotation name
const _getAnnotationName = (type: AnnotationType): string => {
  const found = ANNOTATION_TYPES.find(t => t.value === type);
  return found?.name || type;
};

// Annotation tool icons
const annotationIcons: Record<AnnotationType, () => JSX.Element> = {
  Arrow: () => <span>↗️</span>,
  Line: () => <span>➖</span>,
  Rectangle: () => <span>⬜</span>,
  Circle: () => <span>⭕</span>,
  Text: () => <span>T</span>,
  Highlight: () => <span>🖌️</span>,
  Blur: () => <span>🔳</span>,
  Pixelate: () => <span>▦</span>,
  Crop: () => <span>✂️</span>,
  FreeHand: () => <span>✏️</span>,
  Emoji: () => <span>😀</span>,
  Number: () => <span>#</span>,
};

// ==================== Sub-components ====================

interface CaptureModeModalProps {
  onSelect: (mode: CaptureMode) => void;
  onClose?: () => void;
}

const CaptureModeModal: React.FC<CaptureModeModalProps> = ({ onSelect, onClose: _onClose }) => {
  const modes: { mode: CaptureMode; icon: () => JSX.Element }[] = [
    { mode: 'VisibleArea', icon: CameraIcon },
    { mode: 'FullPage', icon: FullPageIcon },
    { mode: 'SelectedRegion', icon: RegionIcon },
    { mode: 'Element', icon: ElementIcon },
    { mode: 'Window', icon: CameraIcon },
    { mode: 'AllTabs', icon: GalleryIcon },
  ];

  return (
    <div className="capture-mode-selector" onClick={(e) => e.stopPropagation()}>
      {modes.map(({ mode, icon: Icon }) => (
        <div
          key={mode}
          className="capture-mode-option"
          onClick={() => onSelect(mode)}
        >
          <div className="capture-mode-icon">
            <Icon />
          </div>
          <div className="capture-mode-label">{getCaptureModeName(mode)}</div>
          <div className="capture-mode-desc">
            {mode === 'VisibleArea' && 'Capture current view'}
            {mode === 'FullPage' && 'Capture entire page'}
            {mode === 'SelectedRegion' && 'Select area to capture'}
            {mode === 'Element' && 'Click on element'}
            {mode === 'Window' && 'Capture window'}
            {mode === 'AllTabs' && 'Capture all tabs'}
          </div>
        </div>
      ))}
    </div>
  );
};

interface RegionSelectorProps {
  onSelect: (region: CaptureRegion) => void;
  onCancel: () => void;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({ onSelect, onCancel }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsSelecting(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting) {
      setCurrentPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isSelecting) {
      setIsSelecting(false);
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);
      
      if (width > 10 && height > 10) {
        onSelect({ x, y, width, height });
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const boxStyle = isSelecting
    ? {
        left: Math.min(startPos.x, currentPos.x),
        top: Math.min(startPos.y, currentPos.y),
        width: Math.abs(currentPos.x - startPos.x),
        height: Math.abs(currentPos.y - startPos.y),
      }
    : undefined;

  return (
    <div
      className="region-selection-overlay"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      tabIndex={0}
    >
      {isSelecting && boxStyle && (
        <div className="region-selection-box" style={boxStyle}>
          <div className="region-selection-info">
            {boxStyle.width} × {boxStyle.height}
          </div>
        </div>
      )}
    </div>
  );
};

interface ScreenshotEditorProps {
  screenshot: Screenshot;
  onSave: (data: string) => void;
  onClose: () => void;
}

const ScreenshotEditor: React.FC<ScreenshotEditorProps> = ({
  screenshot,
  onSave,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<AnnotationType | null>(null);
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !screenshot.data_url) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Save initial state
      const initialState = canvas.toDataURL();
      setHistory([initialState]);
      setHistoryIndex(0);
    };
    img.src = screenshot.data_url;
  }, [screenshot]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const data = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const newIndex = historyIndex - 1;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newIndex];
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const newIndex = historyIndex + 1;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newIndex];
      setHistoryIndex(newIndex);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !activeTool) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'FreeHand' || activeTool === 'Highlight') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL());
  };

  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
    } catch (error) {
      log.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="screenshot-editor">
      <div className="screenshot-editor-header">
        <div className="screenshot-editor-title">Screenshot Editor</div>
        <div className="screenshot-editor-actions">
          <button
            className="screenshot-editor-btn secondary"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <UndoIcon />
            Undo
          </button>
          <button
            className="screenshot-editor-btn secondary"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <RedoIcon />
            Redo
          </button>
          <button
            className="screenshot-editor-btn secondary"
            onClick={handleCopyToClipboard}
          >
            <CopyIcon />
            Copy
          </button>
          <button className="screenshot-editor-btn primary" onClick={handleSave}>
            <DownloadIcon />
            Save
          </button>
          <button className="screenshot-editor-btn danger" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="screenshot-editor-body">
        <div className="screenshot-canvas-container">
          <canvas
            ref={canvasRef}
            className="screenshot-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        <div className="screenshot-editor-sidebar screenshot-scrollable">
          <div className="screenshot-sidebar-section">
            <div className="screenshot-sidebar-title">Tools</div>
            <div className="annotation-tools">
              {ANNOTATION_TYPES.map((type) => {
                const Icon = annotationIcons[type.value];
                return (
                  <button
                    key={type.value}
                    className={`annotation-tool-btn ${activeTool === type.value ? 'active' : ''}`}
                    onClick={() => setActiveTool(activeTool === type.value ? null : type.value)}
                    title={type.name}
                  >
                    <span className="annotation-tool-icon">
                      <Icon />
                    </span>
                    <span className="annotation-tool-label">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="screenshot-sidebar-section">
            <div className="screenshot-sidebar-title">Color</div>
            <div className="annotation-colors">
              {PRESET_COLORS.map((color: string) => (
                <button
                  key={color}
                  className={`annotation-color-btn ${activeColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setActiveColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="screenshot-sidebar-section">
            <div className="screenshot-sidebar-title">Stroke Width</div>
            <div className="stroke-width-selector">
              <input
                type="range"
                className="stroke-width-input"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
              />
              <span className="stroke-width-value">{strokeWidth}px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
  onSelect: (screenshot: Screenshot) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({
  screenshots,
  onSelect,
  onDelete,
  onClose,
}) => {
  return (
    <div className="screenshot-gallery">
      <div className="screenshot-gallery-header">
        <div className="screenshot-gallery-title">Recent Screenshots</div>
        <button className="screenshot-gallery-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className="screenshot-gallery-list screenshot-scrollable">
        {screenshots.map((screenshot) => (
          <div
            key={screenshot.id}
            className="screenshot-gallery-item"
            onClick={() => onSelect(screenshot)}
          >
            <img
              src={screenshot.thumbnail || screenshot.data_url || ''}
              alt={screenshot.title}
              className="screenshot-gallery-thumb"
            />
            <div className="screenshot-gallery-info">
              <div className="screenshot-gallery-name">{screenshot.title}</div>
              <div className="screenshot-gallery-meta">
                {screenshot.width}×{screenshot.height} •{' '}
                {formatFileSize(screenshot.file_size)}
              </div>
            </div>
            <div className="screenshot-gallery-actions">
              <button
                className="screenshot-gallery-action"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(screenshot);
                }}
                title="Edit"
              >
                <EditIcon />
              </button>
              <button
                className="screenshot-gallery-action delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(screenshot.id);
                }}
                title="Delete"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
        {screenshots.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
            No screenshots yet
          </div>
        )}
      </div>
    </div>
  );
};

interface RecordingIndicatorProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({
  isRecording,
  isPaused,
  duration,
  onPause,
  onResume,
  onStop,
}) => {
  if (!isRecording) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="recording-indicator">
      <div className="recording-dot" style={{ animationPlayState: isPaused ? 'paused' : 'running' }} />
      <div className="recording-timer">{formatDuration(duration)}</div>
      <div className="recording-controls">
        <button
          className="recording-control-btn pause"
          onClick={isPaused ? onResume : onPause}
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? <RecordIcon /> : <PauseIcon />}
        </button>
        <button className="recording-control-btn stop" onClick={onStop} title="Stop">
          <StopIcon />
        </button>
      </div>
    </div>
  );
};

// ==================== Main Component ====================

interface ScreenshotProps {
  position?: 'vertical' | 'horizontal';
  onCaptureComplete?: (screenshot: Screenshot) => void;
  currentUrl?: string;
  currentTitle?: string;
}

export const ScreenshotComponent: React.FC<ScreenshotProps> = ({
  position = 'vertical',
  onCaptureComplete,
  currentUrl = 'about:blank',
  currentTitle = 'Untitled',
}) => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [settings, setSettings] = useState<ScreenshotSettings | null>(null);
  
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingScreenshot, setEditingScreenshot] = useState<Screenshot | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [stg, recent] = await Promise.all([
          screenshotService.getSettings(),
          screenshotService.getRecentScreenshots(20),
        ]);
        setSettings(stg);
        setScreenshots(recent);
      } catch (error) {
        log.error('Failed to load screenshot data:', error);
      }
    };
    loadData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Screenshot shortcuts (using configured shortcuts if available)
      if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && e.key === '3')) {
        e.preventDefault();
        handleCapture('VisibleArea');
      }
      if (e.metaKey && e.shiftKey && e.key === '4') {
        e.preventDefault();
        setShowRegionSelector(true);
      }
      if (e.metaKey && e.shiftKey && e.key === '5') {
        e.preventDefault();
        handleCapture('FullPage');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCapture = async (mode: CaptureMode, region?: CaptureRegion) => {
    try {
      setShowModeSelector(false);
      setShowRegionSelector(false);

      // Show flash effect
      const flash = document.createElement('div');
      flash.className = 'screenshot-flash';
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 300);

      let screenshot: Screenshot;

      switch (mode) {
        case 'VisibleArea':
          screenshot = await screenshotService.captureVisibleArea(currentUrl, currentTitle);
          break;
        case 'FullPage':
          screenshot = await screenshotService.captureFullPage(currentUrl, currentTitle);
          break;
        case 'SelectedRegion':
          if (region) {
            screenshot = await screenshotService.captureRegion(
              currentUrl,
              currentTitle,
              region.x,
              region.y,
              region.width,
              region.height
            );
          } else {
            return;
          }
          break;
        case 'Element':
          screenshot = await screenshotService.captureElement(currentUrl, currentTitle, 'body');
          break;
        default:
          screenshot = await screenshotService.captureVisibleArea(currentUrl, currentTitle);
      }

      setScreenshots((prev) => [screenshot, ...prev]);
      onCaptureComplete?.(screenshot);
      showToast('Screenshot captured!');

      // Auto-open editor if enabled
      if (settings?.open_editor_after_capture) {
        setEditingScreenshot(screenshot);
        setShowEditor(true);
      }

      // Auto-copy if enabled
      if (settings?.auto_copy_to_clipboard) {
        await screenshotService.copyToClipboard(screenshot.id);
      }
    } catch (error) {
      log.error('Failed to capture screenshot:', error);
      showToast('Failed to capture screenshot');
    }
  };

  const handleStartRecording = async () => {
    try {
      await screenshotService.startRecording(currentUrl, currentTitle);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      log.error('Failed to start recording:', error);
      showToast('Failed to start recording');
    }
  };

  const handlePauseRecording = async () => {
    try {
      await screenshotService.pauseRecording();
      setIsPaused(true);
    } catch (error) {
      log.error('Failed to pause recording:', error);
    }
  };

  const handleResumeRecording = async () => {
    try {
      await screenshotService.resumeRecording();
      setIsPaused(false);
    } catch (error) {
      log.error('Failed to resume recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      await screenshotService.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setRecordingDuration(0);
      showToast('Recording saved!');
    } catch (error) {
      log.error('Failed to stop recording:', error);
    }
  };

  const handleDeleteScreenshot = async (id: string) => {
    try {
      await screenshotService.deleteScreenshot(id);
      setScreenshots((prev) => prev.filter((s) => s.id !== id));
      showToast('Screenshot deleted');
    } catch (error) {
      log.error('Failed to delete screenshot:', error);
    }
  };

  const handleSaveEdited = async (_data: string) => {
    if (editingScreenshot) {
      try {
        await screenshotService.saveToFile(editingScreenshot.id);
        showToast('Screenshot saved!');
        setShowEditor(false);
        setEditingScreenshot(null);
      } catch (error) {
        log.error('Failed to save screenshot:', error);
      }
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className={`screenshot-toolbar ${position === 'horizontal' ? 'screenshot-toolbar-horizontal' : ''}`}>
        <button
          className="screenshot-toolbar-btn"
          onClick={() => handleCapture('VisibleArea')}
          title="Capture visible area"
        >
          <CameraIcon />
        </button>
        <button
          className="screenshot-toolbar-btn"
          onClick={() => handleCapture('FullPage')}
          title="Capture full page"
        >
          <FullPageIcon />
        </button>
        <button
          className="screenshot-toolbar-btn"
          onClick={() => setShowRegionSelector(true)}
          title="Capture region"
        >
          <RegionIcon />
        </button>
        <button
          className="screenshot-toolbar-btn"
          onClick={() => setShowModeSelector(true)}
          title="More capture options"
        >
          <ElementIcon />
        </button>

        <div className="screenshot-toolbar-divider" />

        <button
          className={`screenshot-toolbar-btn ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? <StopIcon /> : <RecordIcon />}
        </button>

        <div className="screenshot-toolbar-divider" />

        <button
          className="screenshot-toolbar-btn"
          onClick={() => setShowGallery(!showGallery)}
          title="Screenshot gallery"
        >
          <GalleryIcon />
        </button>
        <button className="screenshot-toolbar-btn" title="Settings">
          <SettingsIcon />
        </button>
      </div>

      {/* Capture Mode Modal */}
      {showModeSelector && (
        <div className="region-selection-overlay" onClick={() => setShowModeSelector(false)}>
          <CaptureModeModal
            onSelect={(mode) => {
              if (mode === 'SelectedRegion') {
                setShowModeSelector(false);
                setShowRegionSelector(true);
              } else {
                handleCapture(mode);
              }
            }}
            onClose={() => setShowModeSelector(false)}
          />
        </div>
      )}

      {/* Region Selector */}
      {showRegionSelector && (
        <RegionSelector
          onSelect={(region) => handleCapture('SelectedRegion', region)}
          onCancel={() => setShowRegionSelector(false)}
        />
      )}

      {/* Gallery */}
      {showGallery && (
        <ScreenshotGallery
          screenshots={screenshots}
          onSelect={(screenshot) => {
            setEditingScreenshot(screenshot);
            setShowEditor(true);
            setShowGallery(false);
          }}
          onDelete={handleDeleteScreenshot}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Editor */}
      {showEditor && editingScreenshot && (
        <ScreenshotEditor
          screenshot={editingScreenshot}
          onSave={handleSaveEdited}
          onClose={() => {
            setShowEditor(false);
            setEditingScreenshot(null);
          }}
        />
      )}

      {/* Recording Indicator */}
      <RecordingIndicator
        isRecording={isRecording}
        isPaused={isPaused}
        duration={recordingDuration}
        onPause={handlePauseRecording}
        onResume={handleResumeRecording}
        onStop={handleStopRecording}
      />

      {/* Toast */}
      {toast && (
        <div className={`screenshot-toast ${toast.visible ? 'visible' : ''}`}>
          <span className="screenshot-toast-icon">📸</span>
          <span className="screenshot-toast-message">{toast.message}</span>
        </div>
      )}
    </>
  );
};

export default ScreenshotComponent;
