// CUBE Nexum - Screenshot TypeScript Service
// Superior to Chrome, Firefox, Edge screenshot tools
// Full TypeScript implementation with all types and methods

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Screenshot');

// ==================== Enums ====================

export type CaptureMode =
  | 'VisibleArea'
  | 'FullPage'
  | 'SelectedRegion'
  | 'Element'
  | 'Window'
  | 'AllTabs';

export type ImageFormat = 'PNG' | 'JPEG' | 'WEBP' | 'PDF';

export type AnnotationType =
  | 'Arrow'
  | 'Rectangle'
  | 'Circle'
  | 'Line'
  | 'FreeHand'
  | 'Text'
  | 'Highlight'
  | 'Blur'
  | 'Pixelate'
  | 'Emoji'
  | 'Number'
  | 'Crop';

export type ScreenshotAction =
  | 'SaveToFile'
  | 'CopyToClipboard'
  | 'Edit'
  | 'Share'
  | 'Upload'
  | 'Print';

export type UploadDestination =
  | 'Imgur'
  | 'CloudFlare'
  | { Custom: string };

// ==================== Interfaces ====================

export interface KeyboardShortcuts {
  capture_visible: string;
  capture_full_page: string;
  capture_region: string;
  capture_element: string;
  open_editor: string;
  quick_save: string;
}

export interface ScreenshotSettings {
  enabled: boolean;
  default_format: ImageFormat;
  jpeg_quality: number;
  webp_quality: number;
  default_action: ScreenshotAction;
  save_directory: string;
  filename_pattern: string;
  include_timestamp: boolean;
  include_url: boolean;
  show_cursor: boolean;
  play_sound: boolean;
  show_notification: boolean;
  auto_copy_to_clipboard: boolean;
  open_editor_after_capture: boolean;
  capture_delay_ms: number;
  scroll_delay_ms: number;
  keyboard_shortcuts: KeyboardShortcuts;
}

export interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CaptureOptions {
  mode: CaptureMode;
  format: ImageFormat;
  quality: number;
  region: CaptureRegion | null;
  element_selector: string | null;
  include_scrollbar: boolean;
  capture_shadow_dom: boolean;
  device_scale_factor: number;
  delay_ms: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  annotation_type: AnnotationType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  stroke_width: number;
  fill: string | null;
  text: string | null;
  font_size: number | null;
  font_family: string | null;
  points: Point[];
  blur_radius: number | null;
  emoji: string | null;
  number: number | null;
  arrow_head: boolean | null;
  opacity: number;
}

export interface Screenshot {
  id: string;
  url: string;
  title: string;
  mode: CaptureMode;
  format: ImageFormat;
  width: number;
  height: number;
  file_size: number;
  file_path: string | null;
  data_url: string | null;
  thumbnail: string | null;
  annotations: Annotation[];
  created_at: number;
  tags: string[];
  favorite: boolean;
}

export interface EditorState {
  active: boolean;
  screenshot_id: string | null;
  canvas_width: number;
  canvas_height: number;
  zoom: number;
  pan_x: number;
  pan_y: number;
  selected_tool: AnnotationType;
  selected_color: string;
  stroke_width: number;
  font_size: number;
  history: string[];
  history_index: number;
  can_undo: boolean;
  can_redo: boolean;
}

export interface ScreenshotStats {
  total_screenshots: number;
  total_size_mb: number;
  screenshots_today: number;
  screenshots_this_week: number;
  most_used_mode: CaptureMode;
  most_used_format: ImageFormat;
  favorite_count: number;
  annotated_count: number;
}

export interface UploadResult {
  success: boolean;
  url: string | null;
  delete_url: string | null;
  error: string | null;
}

export interface RecordingSettings {
  enabled: boolean;
  fps: number;
  include_audio: boolean;
  include_cursor: boolean;
  highlight_clicks: boolean;
  max_duration_seconds: number;
  output_format: string;
}

export interface Recording {
  id: string;
  url: string;
  title: string;
  duration_seconds: number;
  file_path: string;
  file_size: number;
  width: number;
  height: number;
  fps: number;
  has_audio: boolean;
  created_at: number;
}

// ==================== Constants ====================

export const CAPTURE_MODES: { name: string; value: CaptureMode; description: string }[] = [
  { name: 'Visible Area', value: 'VisibleArea', description: 'Capture the currently visible viewport' },
  { name: 'Full Page', value: 'FullPage', description: 'Capture the entire scrollable page' },
  { name: 'Selected Region', value: 'SelectedRegion', description: 'Select an area to capture' },
  { name: 'Element', value: 'Element', description: 'Capture a specific DOM element' },
  { name: 'Window', value: 'Window', description: 'Capture the entire window' },
  { name: 'All Tabs', value: 'AllTabs', description: 'Capture all open tabs' },
];

export const IMAGE_FORMATS: { name: string; value: ImageFormat; extension: string; mimeType: string }[] = [
  { name: 'PNG', value: 'PNG', extension: 'png', mimeType: 'image/png' },
  { name: 'JPEG', value: 'JPEG', extension: 'jpg', mimeType: 'image/jpeg' },
  { name: 'WebP', value: 'WEBP', extension: 'webp', mimeType: 'image/webp' },
  { name: 'PDF', value: 'PDF', extension: 'pdf', mimeType: 'application/pdf' },
];

export const ANNOTATION_TYPES: { name: string; value: AnnotationType; icon: string }[] = [
  { name: 'Arrow', value: 'Arrow', icon: '↗️' },
  { name: 'Rectangle', value: 'Rectangle', icon: '⬜' },
  { name: 'Circle', value: 'Circle', icon: '⭕' },
  { name: 'Line', value: 'Line', icon: '➖' },
  { name: 'Freehand', value: 'FreeHand', icon: '✏️' },
  { name: 'Text', value: 'Text', icon: '🔤' },
  { name: 'Highlight', value: 'Highlight', icon: '🖍️' },
  { name: 'Blur', value: 'Blur', icon: '🔲' },
  { name: 'Pixelate', value: 'Pixelate', icon: '🟦' },
  { name: 'Emoji', value: 'Emoji', icon: '😀' },
  { name: 'Number', value: 'Number', icon: '1️⃣' },
  { name: 'Crop', value: 'Crop', icon: '✂️' },
];

export const PRESET_COLORS: string[] = [
  '#ff0000', '#ff6b00', '#ffd500', '#00ff00', '#00d4ff',
  '#0066ff', '#9900ff', '#ff00ff', '#ffffff', '#000000',
];

export const STROKE_WIDTHS: number[] = [1, 2, 3, 5, 8, 12];

export const FONT_SIZES: number[] = [12, 14, 16, 18, 24, 32, 48];

// ==================== Event Types ====================

export type ScreenshotEventType =
  | 'capture-started'
  | 'capture-completed'
  | 'capture-cancelled'
  | 'screenshot-deleted'
  | 'editor-opened'
  | 'editor-closed'
  | 'annotation-added'
  | 'annotation-updated'
  | 'annotation-deleted'
  | 'recording-started'
  | 'recording-stopped'
  | 'settings-changed';

export interface ScreenshotEvent {
  type: ScreenshotEventType;
  screenshot_id?: string;
  recording_id?: string;
  annotation_id?: string;
  data?: unknown;
  timestamp: number;
}

// ==================== Utility Functions ====================

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getFormatInfo(format: ImageFormat): { extension: string; mimeType: string } {
  const found = IMAGE_FORMATS.find(f => f.value === format);
  return found ? { extension: found.extension, mimeType: found.mimeType } : { extension: 'png', mimeType: 'image/png' };
}

export function createDefaultAnnotation(type: AnnotationType): Omit<Annotation, 'id'> {
  return {
    annotation_type: type,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    color: '#ff0000',
    stroke_width: 3,
    fill: null,
    text: type === 'Text' ? 'Text' : null,
    font_size: 16,
    font_family: 'sans-serif',
    points: [],
    blur_radius: type === 'Blur' ? 10 : null,
    emoji: type === 'Emoji' ? '👍' : null,
    number: type === 'Number' ? 1 : null,
    arrow_head: type === 'Arrow' ? true : null,
    opacity: 1.0,
  };
}

// ==================== Service Class ====================

type EventCallback = (event: ScreenshotEvent) => void;

export class BrowserScreenshotService {
  private eventCallbacks: Map<ScreenshotEventType, Set<EventCallback>> = new Map();
  private isCapturing: boolean = false;
  private isRecording: boolean = false;
  private currentRecordingId: string | null = null;

  constructor() {
    // Initialize
  }

  // ==================== Event System ====================

  public on(event: ScreenshotEventType, callback: EventCallback): () => void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);

    return () => {
      this.eventCallbacks.get(event)?.delete(callback);
    };
  }

  public off(event: ScreenshotEventType, callback: EventCallback): void {
    this.eventCallbacks.get(event)?.delete(callback);
  }

  private emit(type: ScreenshotEventType, data?: Partial<ScreenshotEvent>): void {
    const event: ScreenshotEvent = {
      type,
      timestamp: Date.now(),
      ...data,
    };

    this.eventCallbacks.get(type)?.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        log.error('Event callback error:', error);
      }
    });
  }

  // ==================== Settings ====================

  async getSettings(): Promise<ScreenshotSettings> {
    return invoke<ScreenshotSettings>('browser_screenshot_get_settings');
  }

  async updateSettings(settings: ScreenshotSettings): Promise<void> {
    await invoke('browser_screenshot_update_settings', { settings });
    this.emit('settings-changed', { data: settings });
  }

  async setDefaultFormat(format: ImageFormat): Promise<void> {
    await invoke('browser_screenshot_set_default_format', { format });
  }

  async setSaveDirectory(directory: string): Promise<void> {
    await invoke('browser_screenshot_set_save_directory', { directory });
  }

  async setQuality(jpegQuality: number, webpQuality: number): Promise<void> {
    await invoke('browser_screenshot_set_quality', { jpegQuality, webpQuality });
  }

  async setKeyboardShortcuts(shortcuts: KeyboardShortcuts): Promise<void> {
    await invoke('browser_screenshot_set_keyboard_shortcuts', { shortcuts });
  }

  async getKeyboardShortcuts(): Promise<KeyboardShortcuts> {
    return invoke<KeyboardShortcuts>('browser_screenshot_get_keyboard_shortcuts');
  }

  // ==================== Recording Settings ====================

  async getRecordingSettings(): Promise<RecordingSettings> {
    return invoke<RecordingSettings>('browser_screenshot_get_recording_settings');
  }

  async updateRecordingSettings(settings: RecordingSettings): Promise<void> {
    await invoke('browser_screenshot_update_recording_settings', { settings });
  }

  // ==================== Capture Operations ====================

  async captureVisibleArea(url: string, title: string): Promise<Screenshot> {
    this.isCapturing = true;
    this.emit('capture-started');
    
    try {
      const screenshot = await invoke<Screenshot>('browser_screenshot_capture_visible', { url, title });
      this.emit('capture-completed', { screenshot_id: screenshot.id, data: screenshot });
      return screenshot;
    } finally {
      this.isCapturing = false;
    }
  }

  async captureFullPage(url: string, title: string): Promise<Screenshot> {
    this.isCapturing = true;
    this.emit('capture-started');
    
    try {
      const screenshot = await invoke<Screenshot>('browser_screenshot_capture_full_page', { url, title });
      this.emit('capture-completed', { screenshot_id: screenshot.id, data: screenshot });
      return screenshot;
    } finally {
      this.isCapturing = false;
    }
  }

  async captureRegion(
    url: string,
    title: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Screenshot> {
    this.isCapturing = true;
    this.emit('capture-started');
    
    try {
      const screenshot = await invoke<Screenshot>('browser_screenshot_capture_region', {
        url,
        title,
        x,
        y,
        width,
        height,
      });
      this.emit('capture-completed', { screenshot_id: screenshot.id, data: screenshot });
      return screenshot;
    } finally {
      this.isCapturing = false;
    }
  }

  async captureElement(url: string, title: string, selector: string): Promise<Screenshot> {
    this.isCapturing = true;
    this.emit('capture-started');
    
    try {
      const screenshot = await invoke<Screenshot>('browser_screenshot_capture_element', {
        url,
        title,
        selector,
      });
      this.emit('capture-completed', { screenshot_id: screenshot.id, data: screenshot });
      return screenshot;
    } finally {
      this.isCapturing = false;
    }
  }

  async startCapture(options: CaptureOptions): Promise<string> {
    this.isCapturing = true;
    this.emit('capture-started');
    return invoke<string>('browser_screenshot_start_capture', { options });
  }

  async cancelCapture(): Promise<void> {
    await invoke('browser_screenshot_cancel_capture');
    this.isCapturing = false;
    this.emit('capture-cancelled');
  }

  async checkIsCapturing(): Promise<boolean> {
    return invoke<boolean>('browser_screenshot_is_capturing');
  }

  get capturing(): boolean {
    return this.isCapturing;
  }

  // ==================== Screenshot Management ====================

  async getScreenshot(screenshotId: string): Promise<Screenshot | null> {
    return invoke<Screenshot | null>('browser_screenshot_get', { screenshotId });
  }

  async getAllScreenshots(): Promise<Screenshot[]> {
    return invoke<Screenshot[]>('browser_screenshot_get_all');
  }

  async getRecentScreenshots(limit: number): Promise<Screenshot[]> {
    return invoke<Screenshot[]>('browser_screenshot_get_recent', { limit });
  }

  async deleteScreenshot(screenshotId: string): Promise<void> {
    await invoke('browser_screenshot_delete', { screenshotId });
    this.emit('screenshot-deleted', { screenshot_id: screenshotId });
  }

  async deleteAllScreenshots(): Promise<void> {
    await invoke('browser_screenshot_delete_all');
  }

  async toggleFavorite(screenshotId: string): Promise<boolean> {
    return invoke<boolean>('browser_screenshot_toggle_favorite', { screenshotId });
  }

  async addTag(screenshotId: string, tag: string): Promise<void> {
    await invoke('browser_screenshot_add_tag', { screenshotId, tag });
  }

  async removeTag(screenshotId: string, tag: string): Promise<void> {
    await invoke('browser_screenshot_remove_tag', { screenshotId, tag });
  }

  async searchScreenshots(query: string): Promise<Screenshot[]> {
    return invoke<Screenshot[]>('browser_screenshot_search', { query });
  }

  async getFavorites(): Promise<Screenshot[]> {
    return invoke<Screenshot[]>('browser_screenshot_get_favorites');
  }

  // ==================== Editor Operations ====================

  async openEditor(screenshotId: string): Promise<EditorState> {
    const state = await invoke<EditorState>('browser_screenshot_open_editor', { screenshotId });
    this.emit('editor-opened', { screenshot_id: screenshotId });
    return state;
  }

  async closeEditor(): Promise<void> {
    await invoke('browser_screenshot_close_editor');
    this.emit('editor-closed');
  }

  async getEditorState(): Promise<EditorState> {
    return invoke<EditorState>('browser_screenshot_get_editor_state');
  }

  async setEditorTool(tool: AnnotationType): Promise<void> {
    await invoke('browser_screenshot_set_editor_tool', { tool });
  }

  async setEditorColor(color: string): Promise<void> {
    await invoke('browser_screenshot_set_editor_color', { color });
  }

  async setEditorStrokeWidth(width: number): Promise<void> {
    await invoke('browser_screenshot_set_editor_stroke_width', { width });
  }

  async setEditorFontSize(size: number): Promise<void> {
    await invoke('browser_screenshot_set_editor_font_size', { size });
  }

  async setEditorZoom(zoom: number): Promise<void> {
    await invoke('browser_screenshot_set_editor_zoom', { zoom });
  }

  async setEditorPan(x: number, y: number): Promise<void> {
    await invoke('browser_screenshot_set_editor_pan', { x, y });
  }

  // ==================== Annotation Operations ====================

  async addAnnotation(screenshotId: string, annotation: Omit<Annotation, 'id'>): Promise<string> {
    const annotationWithId: Annotation = { ...annotation, id: '' };
    const id = await invoke<string>('browser_screenshot_add_annotation', { screenshotId, annotation: annotationWithId });
    this.emit('annotation-added', { screenshot_id: screenshotId, annotation_id: id });
    return id;
  }

  async updateAnnotation(screenshotId: string, annotationId: string, annotation: Annotation): Promise<void> {
    await invoke('browser_screenshot_update_annotation', { screenshotId, annotationId, annotation });
    this.emit('annotation-updated', { screenshot_id: screenshotId, annotation_id: annotationId });
  }

  async deleteAnnotation(screenshotId: string, annotationId: string): Promise<void> {
    await invoke('browser_screenshot_delete_annotation', { screenshotId, annotationId });
    this.emit('annotation-deleted', { screenshot_id: screenshotId, annotation_id: annotationId });
  }

  async clearAnnotations(screenshotId: string): Promise<void> {
    await invoke('browser_screenshot_clear_annotations', { screenshotId });
  }

  async getAnnotations(screenshotId: string): Promise<Annotation[]> {
    return invoke<Annotation[]>('browser_screenshot_get_annotations', { screenshotId });
  }

  // ==================== History ====================

  async undo(): Promise<boolean> {
    return invoke<boolean>('browser_screenshot_undo');
  }

  async redo(): Promise<boolean> {
    return invoke<boolean>('browser_screenshot_redo');
  }

  async addToHistory(stateJson: string): Promise<void> {
    await invoke('browser_screenshot_add_to_history', { stateJson });
  }

  // ==================== Export Operations ====================

  async saveToFile(screenshotId: string, path?: string): Promise<string> {
    return invoke<string>('browser_screenshot_save_to_file', { screenshotId, path: path || null });
  }

  async copyToClipboard(screenshotId: string): Promise<void> {
    await invoke('browser_screenshot_copy_to_clipboard', { screenshotId });
  }

  async exportAsFormat(screenshotId: string, format: ImageFormat, quality: number): Promise<Uint8Array> {
    return invoke<Uint8Array>('browser_screenshot_export_as_format', { screenshotId, format, quality });
  }

  async upload(screenshotId: string, destination: UploadDestination): Promise<UploadResult> {
    return invoke<UploadResult>('browser_screenshot_upload', { screenshotId, destination });
  }

  async print(screenshotId: string): Promise<void> {
    await invoke('browser_screenshot_print', { screenshotId });
  }

  // ==================== Recording Operations ====================

  async startRecording(url: string, title: string): Promise<string> {
    const recordingId = await invoke<string>('browser_screenshot_start_recording', { url, title });
    this.isRecording = true;
    this.currentRecordingId = recordingId;
    this.emit('recording-started', { recording_id: recordingId });
    return recordingId;
  }

  async stopRecording(): Promise<Recording> {
    const recording = await invoke<Recording>('browser_screenshot_stop_recording');
    this.isRecording = false;
    this.currentRecordingId = null;
    this.emit('recording-stopped', { recording_id: recording.id, data: recording });
    return recording;
  }

  async pauseRecording(): Promise<void> {
    await invoke('browser_screenshot_pause_recording');
  }

  async resumeRecording(): Promise<void> {
    await invoke('browser_screenshot_resume_recording');
  }

  async checkIsRecording(): Promise<boolean> {
    return invoke<boolean>('browser_screenshot_is_recording');
  }

  get recording(): boolean {
    return this.isRecording;
  }

  async getRecording(recordingId: string): Promise<Recording | null> {
    return invoke<Recording | null>('browser_screenshot_get_recording', { recordingId });
  }

  async getAllRecordings(): Promise<Recording[]> {
    return invoke<Recording[]>('browser_screenshot_get_all_recordings');
  }

  async deleteRecording(recordingId: string): Promise<void> {
    await invoke('browser_screenshot_delete_recording', { recordingId });
  }

  // ==================== Statistics ====================

  async getStats(): Promise<ScreenshotStats> {
    return invoke<ScreenshotStats>('browser_screenshot_get_stats');
  }

  // ==================== Utility ====================

  async getCaptureModes(): Promise<CaptureMode[]> {
    return invoke<CaptureMode[]>('browser_screenshot_get_capture_modes');
  }

  async getImageFormats(): Promise<ImageFormat[]> {
    return invoke<ImageFormat[]>('browser_screenshot_get_image_formats');
  }

  async getAnnotationTypes(): Promise<AnnotationType[]> {
    return invoke<AnnotationType[]>('browser_screenshot_get_annotation_types');
  }

  async getPresetColors(): Promise<string[]> {
    return invoke<string[]>('browser_screenshot_get_preset_colors');
  }
}

// ==================== Singleton Export ====================

export const screenshotService = new BrowserScreenshotService();
export default screenshotService;
