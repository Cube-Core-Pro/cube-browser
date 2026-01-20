/**
 * CUBE Nexum - Reader Mode Component
 * Complete React implementation for clean reading view with TTS and annotations
 * Superior to Safari/Firefox reader modes with AI-powered features
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  browserReaderService,
  ReaderTheme,
  ReaderFont,
  type TextAlignment as _TextAlignment,
  type AnnotationType as _AnnotationType,
  HighlightColor,
  TTSSpeed,
  ReaderSettings,
  TTSSettings,
  ParsedArticle,
  type ReadingSession as _ReadingSession,
  Annotation,
  TTSPlaybackState,
  type ReaderStats as _ReaderStats,
  THEMES,
  FONTS,
  HIGHLIGHT_COLORS,
  TTS_SPEEDS,
} from '../../lib/services/browser-reader-service';
import { logger } from '@/lib/services/logger-service';
import './ReaderMode.css';

const log = logger.scope('ReaderMode');

// ==================== Icons ====================

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const StopIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

const SkipBackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="19 20 9 12 19 4 19 20" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);

const SkipForwardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

const HighlightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 11l-6 6v3h9l3-3" />
    <path d="M22 12l-4.6 4.6a2 2 0 01-2.8 0l-5.2-5.2a2 2 0 010-2.8L14 4" />
  </svg>
);

const NoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const _LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

const _ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const BookOpenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
);

const KeyboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <line x1="6" y1="8" x2="6" y2="8" />
    <line x1="10" y1="8" x2="10" y2="8" />
    <line x1="14" y1="8" x2="14" y2="8" />
    <line x1="18" y1="8" x2="18" y2="8" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="6" y1="16" x2="6" y2="16" />
    <line x1="18" y1="16" x2="18" y2="16" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

// ==================== Interfaces ====================

interface ReaderModeProps {
  url: string;
  html: string;
  onClose: () => void;
  onNavigate?: (url: string) => void;
}

interface SettingsPanelProps {
  settings: ReaderSettings;
  onSettingsChange: (settings: ReaderSettings) => void;
  onThemeChange: (theme: ReaderTheme) => void;
  onFontChange: (font: ReaderFont) => void;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
  onContentWidthChange: (width: number) => void;
  onToggleImages: () => void;
  onToggleLinks: () => void;
}

interface TTSPanelProps {
  settings: TTSSettings;
  playbackState: TTSPlaybackState | null;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSpeedChange: (speed: TTSSpeed) => void;
}

interface AnnotationsPanelProps {
  annotations: Annotation[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onJumpTo: (annotation: Annotation) => void;
}

interface SelectionPopupProps {
  position: { x: number; y: number };
  onHighlight: (color: HighlightColor) => void;
  onNote: () => void;
  onBookmark: () => void;
  onClose: () => void;
}

// ==================== Sub-Components ====================

const LoadingSpinner: React.FC = () => (
  <div className="reader-loading">
    <div className="reader-loading__spinner" />
    <div className="reader-loading__text">Preparing reader view...</div>
  </div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="reader-error">
    <CloseIcon />
    <h3 className="reader-error__title">Unable to load article</h3>
    <p className="reader-error__message">{message}</p>
    <button className="reader-error__button" onClick={onRetry}>
      Try Again
    </button>
  </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onThemeChange,
  onFontChange,
  onFontSizeChange,
  onLineHeightChange,
  onContentWidthChange,
  onToggleImages,
  onToggleLinks,
}) => {
  return (
    <div className="reader-settings">
      <div className="reader-settings__section">
        <span className="reader-settings__label">Theme</span>
        <div className="reader-settings__themes">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              className={`reader-settings__theme ${settings.theme === theme.id ? 'reader-settings__theme--active' : ''}`}
              onClick={() => onThemeChange(theme.id)}
              title={theme.description}
            >
              <div className={`reader-settings__theme-preview reader-settings__theme-preview--${theme.id.toLowerCase()}`} />
              <span className="reader-settings__theme-name">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="reader-settings__section">
        <span className="reader-settings__label">Font</span>
        <div className="reader-settings__fonts">
          {FONTS.map((font) => (
            <button
              key={typeof font.id === 'string' ? font.id : 'custom'}
              className={`reader-settings__font reader-settings__font--${font.name.toLowerCase().replace(' ', '-')} ${
                settings.font === font.id ? 'reader-settings__font--active' : ''
              }`}
              onClick={() => onFontChange(font.id)}
            >
              <span className="reader-settings__font-name">{font.name}</span>
              <span className="reader-settings__font-sample">Aa</span>
            </button>
          ))}
        </div>
      </div>

      <div className="reader-settings__section">
        <div className="reader-settings__slider">
          <div className="reader-settings__slider-header">
            <span className="reader-settings__slider-label">Font Size</span>
            <span className="reader-settings__slider-value">{settings.font_size}px</span>
          </div>
          <input
            type="range"
            min="12"
            max="32"
            value={settings.font_size}
            onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="reader-settings__section">
        <div className="reader-settings__slider">
          <div className="reader-settings__slider-header">
            <span className="reader-settings__slider-label">Line Height</span>
            <span className="reader-settings__slider-value">{settings.line_height.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="2.5"
            step="0.1"
            value={settings.line_height}
            onChange={(e) => onLineHeightChange(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="reader-settings__section">
        <div className="reader-settings__slider">
          <div className="reader-settings__slider-header">
            <span className="reader-settings__slider-label">Content Width</span>
            <span className="reader-settings__slider-value">{settings.content_width}px</span>
          </div>
          <input
            type="range"
            min="400"
            max="1200"
            step="50"
            value={settings.content_width}
            onChange={(e) => onContentWidthChange(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="reader-settings__section">
        <div className="reader-settings__toggle" onClick={onToggleImages}>
          <span className="reader-settings__toggle-label">Show Images</span>
          <div className={`reader-settings__toggle-switch ${settings.show_images ? 'reader-settings__toggle-switch--active' : ''}`} />
        </div>
        <div className="reader-settings__toggle" onClick={onToggleLinks}>
          <span className="reader-settings__toggle-label">Show Links</span>
          <div className={`reader-settings__toggle-switch ${settings.show_links ? 'reader-settings__toggle-switch--active' : ''}`} />
        </div>
      </div>
    </div>
  );
};

const TTSPanel: React.FC<TTSPanelProps> = ({
  settings,
  playbackState,
  onPlay,
  onPause,
  onStop,
  onSkipBack,
  onSkipForward,
  onSpeedChange,
}) => {
  const isPlaying = playbackState?.is_playing && !playbackState?.is_paused;
  const progress = playbackState
    ? (playbackState.current_paragraph / playbackState.total_paragraphs) * 100
    : 0;

  return (
    <div className="reader-tts">
      <div className="reader-tts__controls">
        <button className="reader-tts__button" onClick={onSkipBack} title="Previous paragraph">
          <SkipBackIcon />
        </button>
        {isPlaying ? (
          <button className="reader-tts__button reader-tts__button--primary" onClick={onPause} title="Pause">
            <PauseIcon />
          </button>
        ) : (
          <button className="reader-tts__button reader-tts__button--primary" onClick={onPlay} title="Play">
            <PlayIcon />
          </button>
        )}
        <button className="reader-tts__button" onClick={onStop} title="Stop">
          <StopIcon />
        </button>
        <button className="reader-tts__button" onClick={onSkipForward} title="Next paragraph">
          <SkipForwardIcon />
        </button>
      </div>

      <div className="reader-tts__progress">
        <div className="reader-tts__progress-bar">
          <div className="reader-tts__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="reader-tts__progress-time">
          <span>{browserReaderService.formatTime(playbackState?.elapsed_seconds || 0)}</span>
          <span>{browserReaderService.formatTime(playbackState?.remaining_seconds || 0)}</span>
        </div>
      </div>

      <div className="reader-settings__section">
        <span className="reader-settings__label">Speed</span>
        <div className="reader-tts__speed">
          {TTS_SPEEDS.map((speed) => (
            <button
              key={speed.id}
              className={`reader-tts__speed-option ${settings.speed === speed.id ? 'reader-tts__speed-option--active' : ''}`}
              onClick={() => onSpeedChange(speed.id)}
            >
              {speed.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AnnotationsPanel: React.FC<AnnotationsPanelProps> = ({ annotations, onDelete, onEdit, onJumpTo }) => {
  if (annotations.length === 0) {
    return (
      <div className="reader-annotations__empty">
        <HighlightIcon />
        <p className="reader-annotations__empty-text">
          Select text to add highlights and notes
        </p>
      </div>
    );
  }

  return (
    <div className="reader-annotations__list">
      {annotations.map((annotation) => (
        <div key={annotation.id} className="reader-annotations__item" onClick={() => onJumpTo(annotation)}>
          <div className="reader-annotations__item-header">
            <div className="reader-annotations__item-type">
              <div
                className="reader-annotations__item-color"
                style={{ backgroundColor: browserReaderService.getColorHex(annotation.color) }}
              />
              <span>{annotation.annotation_type}</span>
            </div>
            <div className="reader-annotations__item-actions">
              <button
                className="reader-annotations__item-action"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(annotation.id);
                }}
                title="Edit"
              >
                <EditIcon />
              </button>
              <button
                className="reader-annotations__item-action"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(annotation.id);
                }}
                title="Delete"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
          <p className="reader-annotations__item-text">&quot;{annotation.selected_text}&quot;</p>
          {annotation.note && <p className="reader-annotations__item-note">{annotation.note}</p>}
        </div>
      ))}
    </div>
  );
};

const SelectionPopup: React.FC<SelectionPopupProps> = ({ position, onHighlight, onNote, onBookmark, onClose }) => {
  const [showColors, setShowColors] = useState(false);

  return (
    <div
      className="reader-selection-popup"
      style={{ top: position.y - 50, left: position.x }}
    >
      {showColors ? (
        <>
          <div className="reader-selection-popup__colors">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.id}
                className="reader-selection-popup__color"
                style={{ backgroundColor: color.hex }}
                onClick={() => {
                  onHighlight(color.id);
                  setShowColors(false);
                }}
                title={color.name}
              />
            ))}
          </div>
          <button
            className="reader-selection-popup__button"
            onClick={() => setShowColors(false)}
          >
            <CloseIcon />
          </button>
        </>
      ) : (
        <>
          <button
            className="reader-selection-popup__button"
            onClick={() => setShowColors(true)}
            title="Highlight"
          >
            <HighlightIcon />
          </button>
          <button className="reader-selection-popup__button" onClick={onNote} title="Add Note">
            <NoteIcon />
          </button>
          <button className="reader-selection-popup__button" onClick={onBookmark} title="Bookmark">
            <BookmarkIcon />
          </button>
          <div className="reader-selection-popup__divider" />
          <button className="reader-selection-popup__button" onClick={onClose} title="Close">
            <CloseIcon />
          </button>
        </>
      )}
    </div>
  );
};

const KeyboardShortcutsOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const shortcuts = browserReaderService.getKeyboardShortcuts();

  return (
    <>
      <div className="reader-backdrop" onClick={onClose} />
      <div className="reader-shortcuts">
        <h4 className="reader-shortcuts__title">Keyboard Shortcuts</h4>
        <div className="reader-shortcuts__list">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="reader-shortcuts__item">
              <span className="reader-shortcuts__key">{shortcut.key}</span>
              <span className="reader-shortcuts__description">{shortcut.description}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ==================== Main Component ====================

export const ReaderMode: React.FC<ReaderModeProps> = ({ url, html, onClose, onNavigate: _onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<ParsedArticle | null>(null);
  const [settings, setSettings] = useState<ReaderSettings | null>(null);
  const [ttsSettings, setTTSSettings] = useState<TTSSettings | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [ttsPlaybackState, setTTSPlaybackState] = useState<TTSPlaybackState | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activePanel, setActivePanel] = useState<'settings' | 'tts' | 'annotations' | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectionPopup, setSelectionPopup] = useState<{ x: number; y: number; text: string } | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef(Date.now());

  // Load article and settings
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [parsedArticle, readerSettings, tts] = await Promise.all([
          browserReaderService.parseArticle(url, html),
          browserReaderService.getSettings(),
          browserReaderService.getTTSSettings(),
        ]);

        setArticle(parsedArticle);
        setSettings(readerSettings);
        setTTSSettings(tts);

        // Load annotations for this article
        const articleAnnotations = await browserReaderService.getAnnotations(parsedArticle.id);
        setAnnotations(articleAnnotations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [url, html]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const progress = scrollTop / (scrollHeight - clientHeight);
      setScrollProgress(Math.min(Math.max(progress, 0), 1) * 100);

      // Update reading progress
      if (article) {
        const timeSpent = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        browserReaderService.updateProgress(article.id, progress, timeSpent).catch(log.error);
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll);
      return () => content.removeEventListener('scroll', handleScroll);
    }
  }, [article]);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setSelectionPopup(null);
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setSelectionPopup(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectionPopup({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY,
        text,
      });
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  // Theme cycle - defined before keyboard shortcuts useEffect
  const handleCycleTheme = useCallback(async () => {
    if (!settings) return;

    const themes: ReaderTheme[] = ['Light', 'Sepia', 'Dark', 'Night'];
    const currentIndex = themes.indexOf(settings.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];

    await browserReaderService.setTheme(nextTheme);
    setSettings({ ...settings, theme: nextTheme });
  }, [settings]);

  // TTS handlers - defined before keyboard shortcuts useEffect
  const handleTTSPlay = useCallback(async () => {
    if (!article) return;
    try {
      const state = await browserReaderService.startTTS(article.id);
      setTTSPlaybackState(state);
    } catch (err) {
      log.error('Failed to start TTS:', err);
    }
  }, [article]);

  const handleTTSPause = useCallback(async () => {
    try {
      await browserReaderService.pauseTTS();
      if (ttsPlaybackState) {
        setTTSPlaybackState({ ...ttsPlaybackState, is_paused: true });
      }
    } catch (err) {
      log.error('Failed to pause TTS:', err);
    }
  }, [ttsPlaybackState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'escape':
          if (activePanel) {
            setActivePanel(null);
          } else if (showShortcuts) {
            setShowShortcuts(false);
          } else {
            onClose();
          }
          break;
        case 'r':
          if (!e.metaKey && !e.ctrlKey) {
            onClose();
          }
          break;
        case '+':
        case '=':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            const newSize = await browserReaderService.increaseFontSize();
            if (settings) {
              setSettings({ ...settings, font_size: newSize });
            }
          }
          break;
        case '-':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            const newSize = await browserReaderService.decreaseFontSize();
            if (settings) {
              setSettings({ ...settings, font_size: newSize });
            }
          }
          break;
        case 't':
          if (!e.metaKey && !e.ctrlKey) {
            handleCycleTheme();
          }
          break;
        case ' ':
          e.preventDefault();
          if (ttsPlaybackState?.is_playing && !ttsPlaybackState?.is_paused) {
            handleTTSPause();
          } else {
            handleTTSPlay();
          }
          break;
        case '?':
          setShowShortcuts(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePanel, showShortcuts, settings, ttsPlaybackState, onClose, handleCycleTheme, handleTTSPause, handleTTSPlay]);

  const handleTTSStop = useCallback(async () => {
    try {
      await browserReaderService.stopTTS();
      setTTSPlaybackState(null);
    } catch (err) {
      log.error('Failed to stop TTS:', err);
    }
  }, []);

  const handleTTSSkipBack = useCallback(async () => {
    if (!ttsPlaybackState) return;
    try {
      await browserReaderService.skipToParagraph(Math.max(0, ttsPlaybackState.current_paragraph - 1));
    } catch (err) {
      log.error('Failed to skip back:', err);
    }
  }, [ttsPlaybackState]);

  const handleTTSSkipForward = useCallback(async () => {
    if (!ttsPlaybackState) return;
    try {
      await browserReaderService.skipToParagraph(
        Math.min(ttsPlaybackState.total_paragraphs - 1, ttsPlaybackState.current_paragraph + 1)
      );
    } catch (err) {
      log.error('Failed to skip forward:', err);
    }
  }, [ttsPlaybackState]);

  const handleTTSSpeedChange = useCallback(async (speed: TTSSpeed) => {
    try {
      await browserReaderService.setTTSSpeed(speed);
      if (ttsSettings) {
        setTTSSettings({ ...ttsSettings, speed });
      }
    } catch (err) {
      log.error('Failed to change TTS speed:', err);
    }
  }, [ttsSettings]);

  // Annotation handlers
  const handleHighlight = useCallback(
    async (color: HighlightColor) => {
      if (!article || !selectionPopup) return;

      try {
        const annotation = await browserReaderService.createAnnotation(
          article.id,
          'Highlight',
          color,
          selectionPopup.text,
          null,
          0,
          selectionPopup.text.length,
          0
        );
        setAnnotations([...annotations, annotation]);
        setSelectionPopup(null);
        window.getSelection()?.removeAllRanges();
      } catch (err) {
        log.error('Failed to create highlight:', err);
      }
    },
    [article, selectionPopup, annotations]
  );

  const handleAddNote = useCallback(async () => {
    if (!article || !selectionPopup) return;

    const note = prompt('Add a note:');
    if (note === null) return;

    try {
      const annotation = await browserReaderService.createAnnotation(
        article.id,
        'Note',
        'Yellow',
        selectionPopup.text,
        note,
        0,
        selectionPopup.text.length,
        0
      );
      setAnnotations([...annotations, annotation]);
      setSelectionPopup(null);
      window.getSelection()?.removeAllRanges();
    } catch (err) {
      log.error('Failed to create note:', err);
    }
  }, [article, selectionPopup, annotations]);

  const handleBookmark = useCallback(async () => {
    if (!article || !selectionPopup) return;

    try {
      const annotation = await browserReaderService.createAnnotation(
        article.id,
        'Bookmark',
        'Blue',
        selectionPopup.text,
        null,
        0,
        selectionPopup.text.length,
        0
      );
      setAnnotations([...annotations, annotation]);
      setSelectionPopup(null);
      window.getSelection()?.removeAllRanges();
    } catch (err) {
      log.error('Failed to create bookmark:', err);
    }
  }, [article, selectionPopup, annotations]);

  const handleDeleteAnnotation = useCallback(
    async (id: string) => {
      if (!article) return;

      try {
        await browserReaderService.deleteAnnotation(article.id, id);
        setAnnotations(annotations.filter((a) => a.id !== id));
      } catch (err) {
        log.error('Failed to delete annotation:', err);
      }
    },
    [article, annotations]
  );

  const handleEditAnnotation = useCallback(
    async (id: string) => {
      if (!article) return;

      const annotation = annotations.find((a) => a.id === id);
      if (!annotation) return;

      const note = prompt('Edit note:', annotation.note || '');
      if (note === null) return;

      try {
        await browserReaderService.updateAnnotation(article.id, id, note, null);
        setAnnotations(annotations.map((a) => (a.id === id ? { ...a, note } : a)));
      } catch (err) {
        log.error('Failed to edit annotation:', err);
      }
    },
    [article, annotations]
  );

  const handleJumpToAnnotation = useCallback((annotation: Annotation) => {
    // In a real implementation, scroll to the annotation position
    log.debug('Jump to annotation:', annotation);
  }, []);

  // Settings handlers
  const handleThemeChange = useCallback(
    async (theme: ReaderTheme) => {
      try {
        await browserReaderService.setTheme(theme);
        if (settings) {
          setSettings({ ...settings, theme });
        }
      } catch (err) {
        log.error('Failed to change theme:', err);
      }
    },
    [settings]
  );

  const handleFontChange = useCallback(
    async (font: ReaderFont) => {
      try {
        await browserReaderService.setFont(font);
        if (settings) {
          setSettings({ ...settings, font });
        }
      } catch (err) {
        log.error('Failed to change font:', err);
      }
    },
    [settings]
  );

  const handleFontSizeChange = useCallback(
    async (size: number) => {
      try {
        await browserReaderService.setFontSize(size);
        if (settings) {
          setSettings({ ...settings, font_size: size });
        }
      } catch (err) {
        log.error('Failed to change font size:', err);
      }
    },
    [settings]
  );

  const handleLineHeightChange = useCallback(
    async (height: number) => {
      try {
        await browserReaderService.setLineHeight(height);
        if (settings) {
          setSettings({ ...settings, line_height: height });
        }
      } catch (err) {
        log.error('Failed to change line height:', err);
      }
    },
    [settings]
  );

  const handleContentWidthChange = useCallback(
    async (width: number) => {
      try {
        await browserReaderService.setContentWidth(width);
        if (settings) {
          setSettings({ ...settings, content_width: width });
        }
      } catch (err) {
        log.error('Failed to change content width:', err);
      }
    },
    [settings]
  );

  const handleToggleImages = useCallback(async () => {
    try {
      const showImages = await browserReaderService.toggleImages();
      if (settings) {
        setSettings({ ...settings, show_images: showImages });
      }
    } catch (err) {
      log.error('Failed to toggle images:', err);
    }
  }, [settings]);

  const handleToggleLinks = useCallback(async () => {
    try {
      const showLinks = await browserReaderService.toggleLinks();
      if (settings) {
        setSettings({ ...settings, show_links: showLinks });
      }
    } catch (err) {
      log.error('Failed to toggle links:', err);
    }
  }, [settings]);

  // Get font class
  const getFontClass = (): string => {
    if (!settings) return '';
    const font = settings.font;
    if (typeof font === 'string') {
      switch (font) {
        case 'Serif':
          return 'reader-article--font-serif';
        case 'SansSerif':
          return 'reader-article--font-sans-serif';
        case 'Monospace':
          return 'reader-article--font-monospace';
        case 'OpenDyslexic':
          return 'reader-article--font-opendyslexic';
        default:
          return '';
      }
    }
    return '';
  };

  // Retry handler
  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    browserReaderService
      .parseArticle(url, html)
      .then((parsed) => {
        setArticle(parsed);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load article');
        setLoading(false);
      });
  }, [url, html]);

  if (loading) {
    return (
      <div className={`reader-mode reader-mode--${(settings?.theme || 'Light').toLowerCase()}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className={`reader-mode reader-mode--${(settings?.theme || 'Light').toLowerCase()}`}>
        <ErrorState message={error || 'Article not found'} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className={`reader-mode reader-mode--${settings?.theme.toLowerCase() || 'light'}`}>
      {/* Progress Bar */}
      {settings?.scroll_progress && (
        <div className="reader-progress">
          <div className="reader-progress__bar" style={{ width: `${scrollProgress}%` }} />
        </div>
      )}

      {/* Toolbar */}
      <div className="reader-toolbar">
        <div className="reader-toolbar__left">
          <button className="reader-toolbar__close" onClick={onClose}>
            <CloseIcon />
            <span>Close</span>
          </button>
        </div>

        <div className="reader-toolbar__center">
          {article.site_name && <span>{article.site_name}</span>}
        </div>

        <div className="reader-toolbar__right">
          <button
            className={`reader-toolbar__button ${activePanel === 'annotations' ? 'reader-toolbar__button--active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'annotations' ? null : 'annotations')}
            title="Annotations"
          >
            <ListIcon />
          </button>
          <button
            className={`reader-toolbar__button ${activePanel === 'tts' ? 'reader-toolbar__button--active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'tts' ? null : 'tts')}
            title="Text to Speech"
          >
            <SpeakerIcon />
          </button>
          <button
            className={`reader-toolbar__button ${activePanel === 'settings' ? 'reader-toolbar__button--active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
            title="Settings"
          >
            <SettingsIcon />
          </button>
          <div className="reader-toolbar__divider" />
          <button
            className="reader-toolbar__button"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard Shortcuts"
          >
            <KeyboardIcon />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="reader-content" ref={contentRef}>
        <article
          className={`reader-article ${getFontClass()}`}
          style={{
            '--content-width': `${settings?.content_width || 680}px`,
            '--reader-font-size': `${settings?.font_size || 18}px`,
            '--reader-line-height': settings?.line_height || 1.7,
            '--reader-text-align': settings?.text_alignment?.toLowerCase() || 'left',
          } as React.CSSProperties}
        >
          <header className="reader-article__header">
            <h1 className="reader-article__title">{article.title}</h1>
            <div className="reader-article__meta">
              {article.author && (
                <div className="reader-article__meta-item">
                  <UserIcon />
                  <span>{article.author}</span>
                </div>
              )}
              {article.published_date && (
                <div className="reader-article__meta-item">
                  <ClockIcon />
                  <span>{article.published_date}</span>
                </div>
              )}
              {settings?.estimated_reading_time && (
                <div className="reader-article__meta-item">
                  <BookOpenIcon />
                  <span>{article.reading_time_minutes} min read</span>
                </div>
              )}
            </div>
            {article.lead_image_url && settings?.show_images && (
              <img
                src={article.lead_image_url}
                alt=""
                className="reader-article__lead-image"
              />
            )}
          </header>

          <div
            className={`reader-article__content ${!settings?.show_images ? 'hide-images' : ''} ${!settings?.show_links ? 'hide-links' : ''}`}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>
      </div>

      {/* Sidebar Panel */}
      <div className={`reader-sidebar ${activePanel ? 'reader-sidebar--open' : ''}`}>
        <div className="reader-sidebar__header">
          <h4 className="reader-sidebar__title">
            {activePanel === 'settings' && 'Settings'}
            {activePanel === 'tts' && 'Text to Speech'}
            {activePanel === 'annotations' && 'Annotations'}
          </h4>
          <button className="reader-sidebar__close" onClick={() => setActivePanel(null)}>
            <CloseIcon />
          </button>
        </div>
        <div className="reader-sidebar__content">
          {activePanel === 'settings' && settings && (
            <SettingsPanel
              settings={settings}
              onSettingsChange={setSettings}
              onThemeChange={handleThemeChange}
              onFontChange={handleFontChange}
              onFontSizeChange={handleFontSizeChange}
              onLineHeightChange={handleLineHeightChange}
              onContentWidthChange={handleContentWidthChange}
              onToggleImages={handleToggleImages}
              onToggleLinks={handleToggleLinks}
            />
          )}
          {activePanel === 'tts' && ttsSettings && (
            <TTSPanel
              settings={ttsSettings}
              playbackState={ttsPlaybackState}
              onPlay={handleTTSPlay}
              onPause={handleTTSPause}
              onStop={handleTTSStop}
              onSkipBack={handleTTSSkipBack}
              onSkipForward={handleTTSSkipForward}
              onSpeedChange={handleTTSSpeedChange}
            />
          )}
          {activePanel === 'annotations' && (
            <AnnotationsPanel
              annotations={annotations}
              onDelete={handleDeleteAnnotation}
              onEdit={handleEditAnnotation}
              onJumpTo={handleJumpToAnnotation}
            />
          )}
        </div>
      </div>

      {/* Selection Popup */}
      {selectionPopup && (
        <SelectionPopup
          position={{ x: selectionPopup.x, y: selectionPopup.y }}
          onHighlight={handleHighlight}
          onNote={handleAddNote}
          onBookmark={handleBookmark}
          onClose={() => setSelectionPopup(null)}
        />
      )}

      {/* Keyboard Shortcuts Overlay */}
      {showShortcuts && <KeyboardShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
    </div>
  );
};

// ==================== Floating Button ====================

interface ReaderFloatingButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const ReaderFloatingButton: React.FC<ReaderFloatingButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <button
      className="reader-float-button"
      onClick={onClick}
      disabled={disabled}
      title="Reader Mode (R)"
    >
      <BookOpenIcon />
    </button>
  );
};

export default ReaderMode;
