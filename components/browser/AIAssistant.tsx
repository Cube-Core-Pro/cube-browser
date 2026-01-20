/**
 * CUBE Nexum - AI Assistant Component
 * React component for AI-powered browser features
 * Superior to all competitors with page summary, translation, form filling, and smart search
 */

'use client';

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AIAssistant');

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  browserAIAssistantService,
  AIAssistantSettings,
  PageSummary,
  TranslationResult,
  QuestionAnswer,
  ContentAnalysis,
  type FormFillSuggestion as _FormFillSuggestion,
  AIAssistantStats,
  SummaryLevel,
  type Language as _Language,
  AIModel,
  LANGUAGES,
  AI_MODELS,
  SUMMARY_LEVELS,
} from '@/lib/services/browser-ai-assistant-service';
import './AIAssistant.css';

// ==================== Types ====================

type TabType = 'summary' | 'translate' | 'question' | 'analysis' | 'form' | 'settings';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  pageUrl?: string;
  pageTitle?: string;
  pageContent?: string;
  selectedText?: string;
}

// ==================== Sub Components ====================

interface TabButtonProps {
  id: TabType;
  label: string;
  icon: string;
  active: boolean;
  onClick: (id: TabType) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, icon, active, onClick }) => (
  <button
    className={`ai-tab ${active ? 'active' : ''}`}
    onClick={() => onClick(id)}
  >
    <span className="ai-tab__icon">{icon}</span>
    {label}
  </button>
);

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = 'Processing...' }) => (
  <div className="ai-loading">
    <div className="ai-loading__spinner" />
    <span className="ai-loading__text">{text}</span>
  </div>
);

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => (
  <div className="ai-empty">
    <span className="ai-empty__icon">{icon}</span>
    <h3 className="ai-empty__title">{title}</h3>
    <p className="ai-empty__desc">{description}</p>
  </div>
);

// ==================== Summary Panel ====================

interface SummaryPanelProps {
  pageUrl: string;
  pageTitle: string;
  pageContent: string;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ pageUrl, pageTitle, pageContent }) => {
  const [level, setLevel] = useState<SummaryLevel>('Standard');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<PageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!pageContent) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await browserAIAssistantService.summarizePage(
        pageUrl,
        pageTitle,
        pageContent,
        level
      );
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to summarize');
    } finally {
      setLoading(false);
    }
  };

  if (!pageContent) {
    return (
      <EmptyState
        icon="📄"
        title="No Content Available"
        description="Navigate to a page to summarize its content"
      />
    );
  }

  return (
    <div className="ai-summary">
      <div className="ai-summary__input">
        <label>Summary Level</label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as SummaryLevel)}
        >
          {SUMMARY_LEVELS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name} - {opt.description}
            </option>
          ))}
        </select>
      </div>

      <button
        className="ai-button"
        onClick={handleSummarize}
        disabled={loading}
      >
        {loading ? '⏳ Summarizing...' : '✨ Summarize Page'}
      </button>

      {error && (
        <div className="ai-result" style={{ borderColor: 'var(--ai-error)' }}>
          <div className="ai-result__content" style={{ color: 'var(--ai-error)' }}>
            {error}
          </div>
        </div>
      )}

      {summary && !loading && (
        <div className="ai-result">
          <div className="ai-result__header">
            <span className="ai-result__title">
              📝 Summary
            </span>
            <div className="ai-result__meta">
              <span>📖 {summary.word_count} words</span>
              <span>⏱️ {browserAIAssistantService.formatReadingTime(summary.reading_time_minutes)}</span>
            </div>
          </div>
          
          {level === 'KeyPoints' ? (
            <ul className="ai-key-points">
              {summary.key_points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          ) : (
            <div className="ai-result__content">
              <p>{summary.summary}</p>
            </div>
          )}

          {summary.topics.length > 0 && (
            <div className="ai-analysis__topics" style={{ marginTop: 12 }}>
              {summary.topics.map((topic, i) => (
                <span key={i} className="ai-analysis__topic">
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== Translation Panel ====================

interface TranslatePanelProps {
  selectedText: string;
}

const TranslatePanel: React.FC<TranslatePanelProps> = ({ selectedText }) => {
  const [inputText, setInputText] = useState(selectedText);
  const [sourceLanguage, setSourceLanguage] = useState<string>('auto');
  const [targetLanguage, setTargetLanguage] = useState<string>('es');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedText) {
      setInputText(selectedText);
    }
  }, [selectedText]);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const targetLang = browserAIAssistantService.languageToEnum(targetLanguage);
      const sourceLang = sourceLanguage !== 'auto' 
        ? browserAIAssistantService.languageToEnum(sourceLanguage) 
        : undefined;
      
      const translation = await browserAIAssistantService.translateText(
        inputText,
        targetLang,
        sourceLang
      );
      setResult(translation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLanguage !== 'auto') {
      const temp = sourceLanguage;
      setSourceLanguage(targetLanguage);
      setTargetLanguage(temp);
    }
  };

  return (
    <div className="ai-translate">
      <div className="ai-translate__languages">
        <div className="ai-translate__language">
          <label>From</label>
          <select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
          >
            <option value="auto">Detect Language</option>
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.native})
              </option>
            ))}
          </select>
        </div>

        <button className="ai-translate__swap" onClick={handleSwapLanguages}>
          ↔️
        </button>

        <div className="ai-translate__language">
          <label>To</label>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.native})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ai-translate__input">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to translate..."
        />
      </div>

      <button
        className="ai-button"
        onClick={handleTranslate}
        disabled={loading || !inputText.trim()}
      >
        {loading ? '⏳ Translating...' : '🌍 Translate'}
      </button>

      {error && (
        <div className="ai-translate__result" style={{ color: 'var(--ai-error)' }}>
          {error}
        </div>
      )}

      {result && !loading && (
        <>
          <div className="ai-translate__result">
            {result.translated_text}
          </div>
          <div className="ai-translate__confidence">
            Confidence:
            <div className="ai-translate__confidence-bar">
              <div
                className="ai-translate__confidence-fill"
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
            {Math.round(result.confidence * 100)}%
          </div>
        </>
      )}
    </div>
  );
};

// ==================== Question Panel ====================

interface QuestionPanelProps {
  pageUrl: string;
  pageContent: string;
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({ pageUrl, pageContent }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<QuestionAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!question.trim() || !pageContent) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await browserAIAssistantService.answerQuestion(
        question,
        pageContent,
        pageUrl
      );
      setAnswer(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to answer question');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  if (!pageContent) {
    return (
      <EmptyState
        icon="❓"
        title="No Content Available"
        description="Navigate to a page to ask questions about its content"
      />
    );
  }

  return (
    <div className="ai-question">
      <div className="ai-question__input">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this page..."
        />
        <button
          className="ai-button"
          onClick={handleAsk}
          disabled={loading || !question.trim()}
        >
          {loading ? '⏳' : '🔍'}
        </button>
      </div>

      {error && (
        <div className="ai-question__answer" style={{ borderColor: 'var(--ai-error)' }}>
          <p style={{ color: 'var(--ai-error)' }}>{error}</p>
        </div>
      )}

      {answer && !loading && (
        <div className="ai-question__answer">
          <p className="ai-question__answer-text">{answer.answer}</p>
          
          {answer.source_quotes.length > 0 && (
            <div className="ai-question__sources">
              <p className="ai-question__sources-title">📚 Source Quotes:</p>
              {answer.source_quotes.map((quote, i) => (
                <div key={i} className="ai-question__source-quote">
                  &quot;{quote}&quot;
                </div>
              ))}
            </div>
          )}

          <div className="ai-translate__confidence" style={{ marginTop: 12 }}>
            Confidence: {browserAIAssistantService.formatConfidence(answer.confidence)}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== Analysis Panel ====================

interface AnalysisPanelProps {
  pageUrl: string;
  pageContent: string;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ pageUrl, pageContent }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!pageContent) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await browserAIAssistantService.analyzeContent(pageUrl, pageContent);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  if (!pageContent) {
    return (
      <EmptyState
        icon="📊"
        title="No Content Available"
        description="Navigate to a page to analyze its content"
      />
    );
  }

  if (loading) {
    return <LoadingSpinner text="Analyzing content..." />;
  }

  return (
    <div className="ai-analysis">
      {!analysis && (
        <button className="ai-button" onClick={handleAnalyze}>
          📊 Analyze Content
        </button>
      )}

      {error && (
        <div className="ai-result" style={{ borderColor: 'var(--ai-error)' }}>
          <p style={{ color: 'var(--ai-error)' }}>{error}</p>
        </div>
      )}

      {analysis && (
        <>
          {/* Content Type */}
          <div className="ai-analysis__section">
            <h4 className="ai-analysis__section-title">📑 Content Type</h4>
            <span>{analysis.content_type}</span>
          </div>

          {/* Sentiment */}
          <div className="ai-analysis__section">
            <h4 className="ai-analysis__section-title">💭 Sentiment</h4>
            <div className="ai-analysis__sentiment">
              <span className="ai-analysis__sentiment-emoji">
                {browserAIAssistantService.getSentimentEmoji(analysis.sentiment.overall)}
              </span>
              <div>
                <p className="ai-analysis__sentiment-text">{analysis.sentiment.overall}</p>
                <p className="ai-analysis__sentiment-score">
                  Score: {analysis.sentiment.score.toFixed(2)} | 
                  Confidence: {Math.round(analysis.sentiment.confidence * 100)}%
                </p>
              </div>
            </div>
          </div>

          {/* Readability */}
          <div className="ai-analysis__section">
            <h4 className="ai-analysis__section-title">📖 Readability</h4>
            <div className="ai-analysis__readability">
              <span className="ai-analysis__readability-score">
                {browserAIAssistantService.getComplexityIcon(analysis.complexity_level)}
                {Math.round(analysis.readability_score)}
              </span>
              <div className="ai-analysis__readability-level">
                <p className="ai-analysis__readability-label">{analysis.complexity_level}</p>
                <p className="ai-analysis__readability-desc">Flesch Reading Ease</p>
              </div>
            </div>
          </div>

          {/* Topics */}
          {analysis.topics.length > 0 && (
            <div className="ai-analysis__section">
              <h4 className="ai-analysis__section-title">🏷️ Topics</h4>
              <div className="ai-analysis__topics">
                {analysis.topics.map((topic, i) => (
                  <span key={i} className="ai-analysis__topic">
                    {topic.topic}
                    <span className="ai-analysis__topic-score">
                      {Math.round(topic.score * 100)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Phrases */}
          {analysis.key_phrases.length > 0 && (
            <div className="ai-analysis__section">
              <h4 className="ai-analysis__section-title">✨ Key Phrases</h4>
              <ul className="ai-key-points">
                {analysis.key_phrases.map((phrase, i) => (
                  <li key={i}>{phrase}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ==================== Settings Panel ====================

interface SettingsPanelProps {
  settings: AIAssistantSettings | null;
  onUpdate: (settings: AIAssistantSettings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate }) => {
  const [stats, setStats] = useState<AIAssistantStats | null>(null);

  useEffect(() => {
    browserAIAssistantService.getStats().then(setStats).catch(log.error);
  }, []);

  if (!settings) {
    return <LoadingSpinner text="Loading settings..." />;
  }

  const handleToggle = (key: keyof AIAssistantSettings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    onUpdate(newSettings);
  };

  return (
    <div className="ai-settings">
      {/* Stats */}
      {stats && (
        <div className="ai-settings__group">
          <h4 className="ai-settings__group-title">📊 Usage Statistics</h4>
          <div className="ai-stats">
            <div className="ai-stat">
              <span className="ai-stat__value">{stats.total_requests}</span>
              <span className="ai-stat__label">Total Requests</span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat__value">{stats.summaries_generated}</span>
              <span className="ai-stat__label">Summaries</span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat__value">{stats.translations_done}</span>
              <span className="ai-stat__label">Translations</span>
            </div>
            <div className="ai-stat">
              <span className="ai-stat__value">{stats.questions_answered}</span>
              <span className="ai-stat__label">Questions</span>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="ai-settings__group">
        <h4 className="ai-settings__group-title">🤖 AI Model</h4>
        <select
          value={settings.default_model}
          onChange={(e) => onUpdate({ ...settings, default_model: e.target.value as AIModel })}
          style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
        >
          {AI_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} - {model.description}
            </option>
          ))}
        </select>
      </div>

      {/* Feature Toggles */}
      <div className="ai-settings__group">
        <h4 className="ai-settings__group-title">⚙️ Features</h4>
        
        <div className="ai-settings__item">
          <div>
            <p className="ai-settings__item-label">Auto Summarize</p>
            <p className="ai-settings__item-desc">Automatically summarize pages on load</p>
          </div>
          <div
            className={`ai-toggle ${settings.auto_summarize ? 'active' : ''}`}
            onClick={() => handleToggle('auto_summarize')}
          >
            <div className="ai-toggle__handle" />
          </div>
        </div>

        <div className="ai-settings__item">
          <div>
            <p className="ai-settings__item-label">Floating Button</p>
            <p className="ai-settings__item-desc">Show AI assistant button on pages</p>
          </div>
          <div
            className={`ai-toggle ${settings.show_floating_button ? 'active' : ''}`}
            onClick={() => handleToggle('show_floating_button')}
          >
            <div className="ai-toggle__handle" />
          </div>
        </div>

        <div className="ai-settings__item">
          <div>
            <p className="ai-settings__item-label">Save History</p>
            <p className="ai-settings__item-desc">Keep record of AI interactions</p>
          </div>
          <div
            className={`ai-toggle ${settings.save_history ? 'active' : ''}`}
            onClick={() => handleToggle('save_history')}
          >
            <div className="ai-toggle__handle" />
          </div>
        </div>

        <div className="ai-settings__item">
          <div>
            <p className="ai-settings__item-label">Cache Responses</p>
            <p className="ai-settings__item-desc">Cache results for faster repeat requests</p>
          </div>
          <div
            className={`ai-toggle ${settings.cache_responses ? 'active' : ''}`}
            onClick={() => handleToggle('cache_responses')}
          >
            <div className="ai-toggle__handle" />
          </div>
        </div>

        <div className="ai-settings__item">
          <div>
            <p className="ai-settings__item-label">Offline Mode</p>
            <p className="ai-settings__item-desc">Use local AI model (limited features)</p>
          </div>
          <div
            className={`ai-toggle ${settings.offline_mode ? 'active' : ''}`}
            onClick={() => handleToggle('offline_mode')}
          >
            <div className="ai-toggle__handle" />
          </div>
        </div>
      </div>

      {/* Cache Actions */}
      <div className="ai-settings__group">
        <h4 className="ai-settings__group-title">🗑️ Data Management</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="ai-button ai-button--secondary"
            onClick={() => browserAIAssistantService.clearCache()}
            style={{ flex: 1 }}
          >
            Clear Cache
          </button>
          <button
            className="ai-button ai-button--secondary"
            onClick={() => browserAIAssistantService.clearHistory()}
            style={{ flex: 1 }}
          >
            Clear History
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== Main Component ====================

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  pageUrl = '',
  pageTitle = '',
  pageContent = '',
  selectedText = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [settings, setSettings] = useState<AIAssistantSettings | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      browserAIAssistantService.getSettings().then(setSettings).catch(log.error);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 300);
  }, [onClose]);

  const handleUpdateSettings = useCallback(async (newSettings: AIAssistantSettings) => {
    try {
      await browserAIAssistantService.updateSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      log.error('Failed to update settings:', error);
    }
  }, []);

  const tabs = useMemo(() => [
    { id: 'summary' as TabType, label: 'Summary', icon: '📝' },
    { id: 'translate' as TabType, label: 'Translate', icon: '🌍' },
    { id: 'question' as TabType, label: 'Ask', icon: '❓' },
    { id: 'analysis' as TabType, label: 'Analyze', icon: '📊' },
    { id: 'settings' as TabType, label: 'Settings', icon: '⚙️' },
  ], []);

  if (!isOpen) return null;

  return (
    <div className={`ai-assistant ${closing ? 'closing' : ''}`}>
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header__left">
          <div className="ai-header__icon">🤖</div>
          <div className="ai-header__title">
            <h2>CUBE AI Assistant</h2>
            <p>Powered by GPT-4</p>
          </div>
        </div>
        <button className="ai-header__close" onClick={handleClose}>
          ✕
        </button>
      </div>

      {/* Tab Bar */}
      <div className="ai-tabs">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            active={activeTab === tab.id}
            onClick={setActiveTab}
          />
        ))}
      </div>

      {/* Content */}
      <div className="ai-content">
        {activeTab === 'summary' && (
          <SummaryPanel
            pageUrl={pageUrl}
            pageTitle={pageTitle}
            pageContent={pageContent}
          />
        )}
        {activeTab === 'translate' && (
          <TranslatePanel selectedText={selectedText} />
        )}
        {activeTab === 'question' && (
          <QuestionPanel pageUrl={pageUrl} pageContent={pageContent} />
        )}
        {activeTab === 'analysis' && (
          <AnalysisPanel pageUrl={pageUrl} pageContent={pageContent} />
        )}
        {activeTab === 'settings' && (
          <SettingsPanel settings={settings} onUpdate={handleUpdateSettings} />
        )}
      </div>
    </div>
  );
};

// ==================== Floating Button ====================

interface AIFloatingButtonProps {
  onClick: () => void;
}

export const AIFloatingButton: React.FC<AIFloatingButtonProps> = ({ onClick }) => (
  <button className="ai-floating-button" onClick={onClick}>
    🤖
    <span className="ai-floating-button__tooltip">
      Open AI Assistant (Ctrl+Shift+A)
    </span>
  </button>
);

export default AIAssistant;
