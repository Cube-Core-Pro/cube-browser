/**
 * CUBE Nexum - Reader Mode Service
 * TypeScript service for clean reading view with TTS and annotations
 * Superior to Safari/Firefox reader modes with AI-powered features
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Reader');

// ==================== Enums ====================

export type ReaderTheme = 'Light' | 'Sepia' | 'Dark' | 'Night' | 'Custom';

export type ReaderFont = 
  | 'System'
  | 'Serif'
  | 'SansSerif'
  | 'Monospace'
  | 'OpenDyslexic'
  | { Custom: string };

export type TextAlignment = 'Left' | 'Center' | 'Justify';

export type AnnotationType = 'Highlight' | 'Underline' | 'Note' | 'Bookmark';

export type HighlightColor = 'Yellow' | 'Green' | 'Blue' | 'Pink' | 'Purple' | 'Orange';

export type TTSSpeed = 'VerySlow' | 'Slow' | 'Normal' | 'Fast' | 'VeryFast';

export type ReadingStatus = 'NotStarted' | 'InProgress' | 'Completed';

// ==================== Interfaces ====================

export interface ReaderSettings {
  theme: ReaderTheme;
  font: ReaderFont;
  font_size: number;
  line_height: number;
  content_width: number;
  text_alignment: TextAlignment;
  show_images: boolean;
  show_links: boolean;
  auto_dark_mode: boolean;
  keyboard_shortcuts: boolean;
  scroll_progress: boolean;
  estimated_reading_time: boolean;
  custom_css: string | null;
}

export interface CustomTheme {
  id: string;
  name: string;
  background_color: string;
  text_color: string;
  link_color: string;
  selection_color: string;
  accent_color: string;
}

export interface TTSSettings {
  enabled: boolean;
  voice: string;
  speed: TTSSpeed;
  pitch: number;
  volume: number;
  highlight_spoken: boolean;
  auto_scroll: boolean;
  pause_on_focus_loss: boolean;
}

export interface Annotation {
  id: string;
  article_id: string;
  annotation_type: AnnotationType;
  color: HighlightColor;
  selected_text: string;
  note: string | null;
  start_offset: number;
  end_offset: number;
  paragraph_index: number;
  created_at: number;
  updated_at: number;
}

export interface ParsedArticle {
  id: string;
  url: string;
  title: string;
  author: string | null;
  published_date: string | null;
  site_name: string | null;
  content: string;
  text_content: string;
  excerpt: string | null;
  lead_image_url: string | null;
  word_count: number;
  reading_time_minutes: number;
  language: string | null;
  parsed_at: number;
}

export interface ReadingSession {
  id: string;
  article_id: string;
  url: string;
  title: string;
  status: ReadingStatus;
  scroll_position: number;
  time_spent_seconds: number;
  annotations_count: number;
  started_at: number;
  last_read_at: number;
  completed_at: number | null;
}

export interface TTSPlaybackState {
  is_playing: boolean;
  is_paused: boolean;
  current_paragraph: number;
  current_word: number;
  total_paragraphs: number;
  elapsed_seconds: number;
  remaining_seconds: number;
}

export interface ReaderStats {
  articles_read: number;
  total_reading_time_minutes: number;
  words_read: number;
  annotations_created: number;
  tts_time_minutes: number;
  favorite_theme: string;
  average_session_minutes: number;
  streak_days: number;
  last_read_date: number | null;
}

// ==================== Event Types ====================

export type ReaderEventType =
  | 'article-parsed'
  | 'progress-updated'
  | 'annotation-created'
  | 'annotation-deleted'
  | 'tts-started'
  | 'tts-paused'
  | 'tts-stopped'
  | 'settings-changed'
  | 'theme-changed';

export interface ReaderEvent {
  type: ReaderEventType;
  data: unknown;
  timestamp: number;
}

type EventHandler = (event: ReaderEvent) => void;

// ==================== Constants ====================

export const THEMES: Array<{ id: ReaderTheme; name: string; description: string }> = [
  { id: 'Light', name: 'Light', description: 'Clean white background' },
  { id: 'Sepia', name: 'Sepia', description: 'Warm paper-like tone' },
  { id: 'Dark', name: 'Dark', description: 'Dark mode for low light' },
  { id: 'Night', name: 'Night', description: 'Pure black for OLED displays' },
];

export const FONTS: Array<{ id: ReaderFont; name: string; description: string }> = [
  { id: 'System', name: 'System', description: 'System default font' },
  { id: 'Serif', name: 'Serif', description: 'Classic serif (Georgia)' },
  { id: 'SansSerif', name: 'Sans Serif', description: 'Modern sans-serif' },
  { id: 'Monospace', name: 'Monospace', description: 'Fixed-width' },
  { id: 'OpenDyslexic', name: 'OpenDyslexic', description: 'Accessibility font' },
];

export const HIGHLIGHT_COLORS: Array<{ id: HighlightColor; name: string; hex: string }> = [
  { id: 'Yellow', name: 'Yellow', hex: '#fef08a' },
  { id: 'Green', name: 'Green', hex: '#bbf7d0' },
  { id: 'Blue', name: 'Blue', hex: '#bfdbfe' },
  { id: 'Pink', name: 'Pink', hex: '#fbcfe8' },
  { id: 'Purple', name: 'Purple', hex: '#ddd6fe' },
  { id: 'Orange', name: 'Orange', hex: '#fed7aa' },
];

export const TTS_SPEEDS: Array<{ id: TTSSpeed; name: string; rate: number }> = [
  { id: 'VerySlow', name: 'Very Slow', rate: 0.5 },
  { id: 'Slow', name: 'Slow', rate: 0.75 },
  { id: 'Normal', name: 'Normal', rate: 1.0 },
  { id: 'Fast', name: 'Fast', rate: 1.25 },
  { id: 'VeryFast', name: 'Very Fast', rate: 1.5 },
];

// ==================== Service Class ====================

class BrowserReaderService {
  private static instance: BrowserReaderService;
  private eventHandlers: Map<ReaderEventType, Set<EventHandler>> = new Map();
  private settings: ReaderSettings | null = null;

  private constructor() {
    this.initializeEventHandlers();
  }

  public static getInstance(): BrowserReaderService {
    if (!BrowserReaderService.instance) {
      BrowserReaderService.instance = new BrowserReaderService();
    }
    return BrowserReaderService.instance;
  }

  private initializeEventHandlers(): void {
    const eventTypes: ReaderEventType[] = [
      'article-parsed',
      'progress-updated',
      'annotation-created',
      'annotation-deleted',
      'tts-started',
      'tts-paused',
      'tts-stopped',
      'settings-changed',
      'theme-changed',
    ];
    eventTypes.forEach((type) => {
      this.eventHandlers.set(type, new Set());
    });
  }

  // ==================== Event System ====================

  public on(event: ReaderEventType, handler: EventHandler): () => void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.add(handler);
    }
    return () => this.off(event, handler);
  }

  public off(event: ReaderEventType, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: ReaderEventType, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const eventData: ReaderEvent = {
        type: event,
        data,
        timestamp: Date.now(),
      };
      handlers.forEach((handler) => {
        try {
          handler(eventData);
        } catch (error) {
          log.error(`Error in reader event handler for ${event}:`, error);
        }
      });
    }
  }

  // ==================== Settings ====================

  public async getSettings(): Promise<ReaderSettings> {
    try {
      const settings = await invoke<ReaderSettings>('reader_get_settings');
      this.settings = settings;
      return settings;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get reader settings: ${error.message}`);
      }
      throw new Error('Failed to get reader settings: Unknown error');
    }
  }

  public async updateSettings(settings: ReaderSettings): Promise<void> {
    try {
      await invoke('reader_update_settings', { settings });
      this.settings = settings;
      this.emit('settings-changed', settings);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update reader settings: ${error.message}`);
      }
      throw new Error('Failed to update reader settings: Unknown error');
    }
  }

  public async setTheme(theme: ReaderTheme): Promise<void> {
    try {
      await invoke('reader_set_theme', { theme });
      if (this.settings) {
        this.settings.theme = theme;
      }
      this.emit('theme-changed', theme);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set theme: ${error.message}`);
      }
      throw new Error('Failed to set theme: Unknown error');
    }
  }

  public async setFont(font: ReaderFont): Promise<void> {
    try {
      await invoke('reader_set_font', { font });
      if (this.settings) {
        this.settings.font = font;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set font: ${error.message}`);
      }
      throw new Error('Failed to set font: Unknown error');
    }
  }

  public async setFontSize(size: number): Promise<void> {
    try {
      await invoke('reader_set_font_size', { size });
      if (this.settings) {
        this.settings.font_size = size;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set font size: ${error.message}`);
      }
      throw new Error('Failed to set font size: Unknown error');
    }
  }

  public async increaseFontSize(): Promise<number> {
    try {
      return await invoke<number>('reader_increase_font_size');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to increase font size: ${error.message}`);
      }
      throw new Error('Failed to increase font size: Unknown error');
    }
  }

  public async decreaseFontSize(): Promise<number> {
    try {
      return await invoke<number>('reader_decrease_font_size');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to decrease font size: ${error.message}`);
      }
      throw new Error('Failed to decrease font size: Unknown error');
    }
  }

  public async setLineHeight(height: number): Promise<void> {
    try {
      await invoke('reader_set_line_height', { height });
      if (this.settings) {
        this.settings.line_height = height;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set line height: ${error.message}`);
      }
      throw new Error('Failed to set line height: Unknown error');
    }
  }

  public async setContentWidth(width: number): Promise<void> {
    try {
      await invoke('reader_set_content_width', { width });
      if (this.settings) {
        this.settings.content_width = width;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set content width: ${error.message}`);
      }
      throw new Error('Failed to set content width: Unknown error');
    }
  }

  public async setTextAlignment(alignment: TextAlignment): Promise<void> {
    try {
      await invoke('reader_set_text_alignment', { alignment });
      if (this.settings) {
        this.settings.text_alignment = alignment;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set text alignment: ${error.message}`);
      }
      throw new Error('Failed to set text alignment: Unknown error');
    }
  }

  public async toggleImages(): Promise<boolean> {
    try {
      return await invoke<boolean>('reader_toggle_images');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to toggle images: ${error.message}`);
      }
      throw new Error('Failed to toggle images: Unknown error');
    }
  }

  public async toggleLinks(): Promise<boolean> {
    try {
      return await invoke<boolean>('reader_toggle_links');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to toggle links: ${error.message}`);
      }
      throw new Error('Failed to toggle links: Unknown error');
    }
  }

  // ==================== TTS Settings ====================

  public async getTTSSettings(): Promise<TTSSettings> {
    try {
      return await invoke<TTSSettings>('reader_get_tts_settings');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get TTS settings: ${error.message}`);
      }
      throw new Error('Failed to get TTS settings: Unknown error');
    }
  }

  public async updateTTSSettings(settings: TTSSettings): Promise<void> {
    try {
      await invoke('reader_update_tts_settings', { settings });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update TTS settings: ${error.message}`);
      }
      throw new Error('Failed to update TTS settings: Unknown error');
    }
  }

  public async setTTSSpeed(speed: TTSSpeed): Promise<void> {
    try {
      await invoke('reader_set_tts_speed', { speed });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set TTS speed: ${error.message}`);
      }
      throw new Error('Failed to set TTS speed: Unknown error');
    }
  }

  public async setTTSVoice(voice: string): Promise<void> {
    try {
      await invoke('reader_set_tts_voice', { voice });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set TTS voice: ${error.message}`);
      }
      throw new Error('Failed to set TTS voice: Unknown error');
    }
  }

  public async setTTSVolume(volume: number): Promise<void> {
    try {
      await invoke('reader_set_tts_volume', { volume });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set TTS volume: ${error.message}`);
      }
      throw new Error('Failed to set TTS volume: Unknown error');
    }
  }

  // ==================== Themes ====================

  public async getThemes(): Promise<CustomTheme[]> {
    try {
      return await invoke<CustomTheme[]>('reader_get_themes');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get themes: ${error.message}`);
      }
      throw new Error('Failed to get themes: Unknown error');
    }
  }

  public async getTheme(id: string): Promise<CustomTheme | null> {
    try {
      return await invoke<CustomTheme | null>('reader_get_theme', { id });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get theme: ${error.message}`);
      }
      throw new Error('Failed to get theme: Unknown error');
    }
  }

  public async addTheme(theme: CustomTheme): Promise<string> {
    try {
      return await invoke<string>('reader_add_theme', { theme });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to add theme: ${error.message}`);
      }
      throw new Error('Failed to add theme: Unknown error');
    }
  }

  public async removeTheme(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('reader_remove_theme', { id });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to remove theme: ${error.message}`);
      }
      throw new Error('Failed to remove theme: Unknown error');
    }
  }

  // ==================== Articles ====================

  public async parseArticle(url: string, html: string): Promise<ParsedArticle> {
    try {
      const article = await invoke<ParsedArticle>('reader_parse_article', { url, html });
      this.emit('article-parsed', article);
      return article;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse article: ${error.message}`);
      }
      throw new Error('Failed to parse article: Unknown error');
    }
  }

  public async getArticle(id: string): Promise<ParsedArticle | null> {
    try {
      return await invoke<ParsedArticle | null>('reader_get_article', { id });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get article: ${error.message}`);
      }
      throw new Error('Failed to get article: Unknown error');
    }
  }

  public async getRecentArticles(limit: number = 20): Promise<ParsedArticle[]> {
    try {
      return await invoke<ParsedArticle[]>('reader_get_recent_articles', { limit });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get recent articles: ${error.message}`);
      }
      throw new Error('Failed to get recent articles: Unknown error');
    }
  }

  // ==================== Sessions ====================

  public async getSession(articleId: string): Promise<ReadingSession | null> {
    try {
      return await invoke<ReadingSession | null>('reader_get_session', { articleId });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get session: ${error.message}`);
      }
      throw new Error('Failed to get session: Unknown error');
    }
  }

  public async updateProgress(articleId: string, scrollPosition: number, timeSpent: number): Promise<void> {
    try {
      await invoke('reader_update_progress', { articleId, scrollPosition, timeSpent });
      this.emit('progress-updated', { articleId, scrollPosition, timeSpent });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update progress: ${error.message}`);
      }
      throw new Error('Failed to update progress: Unknown error');
    }
  }

  public async getHistory(limit: number = 50): Promise<ReadingSession[]> {
    try {
      return await invoke<ReadingSession[]>('reader_get_history', { limit });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get history: ${error.message}`);
      }
      throw new Error('Failed to get history: Unknown error');
    }
  }

  public async getInProgress(): Promise<ReadingSession[]> {
    try {
      return await invoke<ReadingSession[]>('reader_get_in_progress');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get in-progress articles: ${error.message}`);
      }
      throw new Error('Failed to get in-progress articles: Unknown error');
    }
  }

  // ==================== Annotations ====================

  public async createAnnotation(
    articleId: string,
    annotationType: AnnotationType,
    color: HighlightColor,
    selectedText: string,
    note: string | null,
    startOffset: number,
    endOffset: number,
    paragraphIndex: number
  ): Promise<Annotation> {
    try {
      const annotation = await invoke<Annotation>('reader_create_annotation', {
        articleId,
        annotationType,
        color,
        selectedText,
        note,
        startOffset,
        endOffset,
        paragraphIndex,
      });
      this.emit('annotation-created', annotation);
      return annotation;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create annotation: ${error.message}`);
      }
      throw new Error('Failed to create annotation: Unknown error');
    }
  }

  public async updateAnnotation(
    articleId: string,
    annotationId: string,
    note: string | null,
    color: HighlightColor | null
  ): Promise<void> {
    try {
      await invoke('reader_update_annotation', { articleId, annotationId, note, color });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update annotation: ${error.message}`);
      }
      throw new Error('Failed to update annotation: Unknown error');
    }
  }

  public async deleteAnnotation(articleId: string, annotationId: string): Promise<boolean> {
    try {
      const deleted = await invoke<boolean>('reader_delete_annotation', { articleId, annotationId });
      if (deleted) {
        this.emit('annotation-deleted', { articleId, annotationId });
      }
      return deleted;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete annotation: ${error.message}`);
      }
      throw new Error('Failed to delete annotation: Unknown error');
    }
  }

  public async getAnnotations(articleId: string): Promise<Annotation[]> {
    try {
      return await invoke<Annotation[]>('reader_get_annotations', { articleId });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get annotations: ${error.message}`);
      }
      throw new Error('Failed to get annotations: Unknown error');
    }
  }

  public async getAllAnnotations(): Promise<Annotation[]> {
    try {
      return await invoke<Annotation[]>('reader_get_all_annotations');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get all annotations: ${error.message}`);
      }
      throw new Error('Failed to get all annotations: Unknown error');
    }
  }

  public async exportAnnotations(articleId: string): Promise<string> {
    try {
      return await invoke<string>('reader_export_annotations', { articleId });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to export annotations: ${error.message}`);
      }
      throw new Error('Failed to export annotations: Unknown error');
    }
  }

  // ==================== TTS Control ====================

  public async startTTS(articleId: string): Promise<TTSPlaybackState> {
    try {
      const state = await invoke<TTSPlaybackState>('reader_start_tts', { articleId });
      this.emit('tts-started', state);
      return state;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to start TTS: ${error.message}`);
      }
      throw new Error('Failed to start TTS: Unknown error');
    }
  }

  public async pauseTTS(): Promise<void> {
    try {
      await invoke('reader_pause_tts');
      this.emit('tts-paused', null);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to pause TTS: ${error.message}`);
      }
      throw new Error('Failed to pause TTS: Unknown error');
    }
  }

  public async resumeTTS(): Promise<void> {
    try {
      await invoke('reader_resume_tts');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to resume TTS: ${error.message}`);
      }
      throw new Error('Failed to resume TTS: Unknown error');
    }
  }

  public async stopTTS(): Promise<void> {
    try {
      await invoke('reader_stop_tts');
      this.emit('tts-stopped', null);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to stop TTS: ${error.message}`);
      }
      throw new Error('Failed to stop TTS: Unknown error');
    }
  }

  public async getTTSState(): Promise<TTSPlaybackState | null> {
    try {
      return await invoke<TTSPlaybackState | null>('reader_get_tts_state');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get TTS state: ${error.message}`);
      }
      throw new Error('Failed to get TTS state: Unknown error');
    }
  }

  public async skipToParagraph(paragraph: number): Promise<void> {
    try {
      await invoke('reader_skip_to_paragraph', { paragraph });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to skip to paragraph: ${error.message}`);
      }
      throw new Error('Failed to skip to paragraph: Unknown error');
    }
  }

  // ==================== Statistics ====================

  public async getStats(): Promise<ReaderStats> {
    try {
      return await invoke<ReaderStats>('reader_get_stats');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get reader stats: ${error.message}`);
      }
      throw new Error('Failed to get reader stats: Unknown error');
    }
  }

  public async resetStats(): Promise<void> {
    try {
      await invoke('reader_reset_stats');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to reset reader stats: ${error.message}`);
      }
      throw new Error('Failed to reset reader stats: Unknown error');
    }
  }

  // ==================== Utilities ====================

  public async generateCSS(): Promise<string> {
    try {
      return await invoke<string>('reader_generate_css');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate CSS: ${error.message}`);
      }
      throw new Error('Failed to generate CSS: Unknown error');
    }
  }

  public async estimateReadingTime(wordCount: number): Promise<number> {
    try {
      return await invoke<number>('reader_estimate_reading_time', { wordCount });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to estimate reading time: ${error.message}`);
      }
      throw new Error('Failed to estimate reading time: Unknown error');
    }
  }

  public async formatReadingTime(minutes: number): Promise<string> {
    try {
      return await invoke<string>('reader_format_reading_time', { minutes });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to format reading time: ${error.message}`);
      }
      throw new Error('Failed to format reading time: Unknown error');
    }
  }

  // ==================== Helper Methods ====================

  public getThemeOptions(): typeof THEMES {
    return THEMES;
  }

  public getFontOptions(): typeof FONTS {
    return FONTS;
  }

  public getHighlightColorOptions(): typeof HIGHLIGHT_COLORS {
    return HIGHLIGHT_COLORS;
  }

  public getTTSSpeedOptions(): typeof TTS_SPEEDS {
    return TTS_SPEEDS;
  }

  public getColorHex(color: HighlightColor): string {
    const found = HIGHLIGHT_COLORS.find((c) => c.id === color);
    return found?.hex || '#fef08a';
  }

  public getSpeedRate(speed: TTSSpeed): number {
    const found = TTS_SPEEDS.find((s) => s.id === speed);
    return found?.rate || 1.0;
  }

  public formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  public getReadingProgress(session: ReadingSession): number {
    return Math.round(session.scroll_position * 100);
  }

  public getStatusLabel(status: ReadingStatus): string {
    const labels: Record<ReadingStatus, string> = {
      NotStarted: 'Not Started',
      InProgress: 'In Progress',
      Completed: 'Completed',
    };
    return labels[status] || status;
  }

  public getStatusColor(status: ReadingStatus): string {
    const colors: Record<ReadingStatus, string> = {
      NotStarted: '#6b7280',
      InProgress: '#f59e0b',
      Completed: '#10b981',
    };
    return colors[status] || '#6b7280';
  }

  public getKeyboardShortcuts(): Array<{ key: string; description: string }> {
    return [
      { key: 'R', description: 'Toggle Reader Mode' },
      { key: '+', description: 'Increase font size' },
      { key: '-', description: 'Decrease font size' },
      { key: 'T', description: 'Cycle themes' },
      { key: 'Space', description: 'Play/Pause TTS' },
      { key: '←', description: 'Previous paragraph (TTS)' },
      { key: '→', description: 'Next paragraph (TTS)' },
      { key: 'H', description: 'Highlight selection' },
      { key: 'N', description: 'Add note to selection' },
      { key: 'Esc', description: 'Exit Reader Mode' },
    ];
  }
}

// Export singleton instance
export const browserReaderService = BrowserReaderService.getInstance();

// Export class for testing
export { BrowserReaderService };
