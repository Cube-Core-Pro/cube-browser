/**
 * CUBE Nexum - AI Browser Assistant Service
 * TypeScript service for AI-powered browser features
 * Superior to all competitors with page summary, translation, form filling, and smart search
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('AIAssistant');

// ==================== Enums ====================

export type AIModel = 'GPT4' | 'GPT4Turbo' | 'GPT35Turbo' | 'Claude3' | 'Local';

export type AITaskType = 
  | 'Summarize'
  | 'Translate'
  | 'FormFill'
  | 'SmartSearch'
  | 'ContentAnalysis'
  | 'QuestionAnswer'
  | 'TextRewrite'
  | 'CodeExplain'
  | 'FactCheck'
  | 'Sentiment';

export type Language = 
  | 'English'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Italian'
  | 'Portuguese'
  | 'Chinese'
  | 'Japanese'
  | 'Korean'
  | 'Arabic'
  | 'Russian'
  | 'Hindi'
  | 'Dutch'
  | 'Polish'
  | 'Turkish'
  | 'Vietnamese'
  | 'Thai'
  | 'Indonesian'
  | { Other: string };

export type SummaryLevel = 'Brief' | 'Standard' | 'Detailed' | 'KeyPoints';

export type FormFieldType =
  | 'Name'
  | 'Email'
  | 'Phone'
  | 'Address'
  | 'City'
  | 'State'
  | 'ZipCode'
  | 'Country'
  | 'Company'
  | 'JobTitle'
  | 'Website'
  | 'Username'
  | 'Password'
  | 'CreditCard'
  | 'ExpiryDate'
  | 'CVV'
  | 'Custom';

// ==================== Interfaces ====================

export interface AIAssistantSettings {
  enabled: boolean;
  default_model: AIModel;
  api_key: string | null;
  default_language: Language;
  auto_summarize: boolean;
  auto_translate_threshold: number;
  show_floating_button: boolean;
  keyboard_shortcut: string;
  max_tokens: number;
  temperature: number;
  save_history: boolean;
  cache_responses: boolean;
  offline_mode: boolean;
}

export interface PageSummary {
  id: string;
  url: string;
  title: string;
  summary: string;
  key_points: string[];
  topics: string[];
  word_count: number;
  reading_time_minutes: number;
  sentiment: string | null;
  level: SummaryLevel;
  model_used: AIModel;
  created_at: number;
  cached: boolean;
}

export interface TranslationResult {
  id: string;
  original_text: string;
  translated_text: string;
  source_language: Language;
  target_language: Language;
  confidence: number;
  alternatives: string[];
  model_used: AIModel;
  created_at: number;
}

export interface FormField {
  selector: string;
  field_type: FormFieldType;
  label: string | null;
  placeholder: string | null;
  current_value: string | null;
  suggested_value: string | null;
  confidence: number;
  required: boolean;
}

export interface FormFillSuggestion {
  id: string;
  url: string;
  form_selector: string;
  fields: FormField[];
  auto_detected: boolean;
  confidence: number;
  created_at: number;
}

export interface SmartSearchResult {
  id: string;
  query: string;
  enhanced_query: string;
  answer: string | null;
  sources: SearchSource[];
  related_questions: string[];
  model_used: AIModel;
  created_at: number;
}

export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  relevance_score: number;
}

export interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  confidence: number;
  source_quotes: string[];
  page_url: string;
  model_used: AIModel;
  created_at: number;
}

export interface ContentAnalysis {
  id: string;
  url: string;
  content_type: string;
  topics: TopicScore[];
  entities: NamedEntity[];
  sentiment: SentimentAnalysis;
  readability_score: number;
  complexity_level: string;
  key_phrases: string[];
  created_at: number;
}

export interface TopicScore {
  topic: string;
  score: number;
}

export interface NamedEntity {
  text: string;
  entity_type: string;
  confidence: number;
}

export interface SentimentAnalysis {
  overall: string;
  score: number;
  confidence: number;
}

export interface AITaskHistory {
  id: string;
  task_type: AITaskType;
  input: string;
  output: string;
  url: string | null;
  model_used: AIModel;
  tokens_used: number;
  duration_ms: number;
  created_at: number;
}

export interface AIAssistantStats {
  total_requests: number;
  total_tokens_used: number;
  summaries_generated: number;
  translations_done: number;
  forms_filled: number;
  searches_enhanced: number;
  questions_answered: number;
  cache_hits: number;
  average_response_time_ms: number;
  task_breakdown: Record<string, number>;
}

// ==================== Event Types ====================

export type AIAssistantEventType =
  | 'summary-generated'
  | 'translation-complete'
  | 'form-analyzed'
  | 'search-enhanced'
  | 'question-answered'
  | 'content-analyzed'
  | 'error';

export interface AIAssistantEvent {
  type: AIAssistantEventType;
  data: unknown;
  timestamp: number;
}

type EventHandler = (event: AIAssistantEvent) => void;

// ==================== Language Options ====================

export const LANGUAGES: Array<{ code: string; name: string; native: string }> = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
];

export const AI_MODELS: Array<{ id: AIModel; name: string; description: string }> = [
  { id: 'GPT4', name: 'GPT-4', description: 'Most capable model, best for complex tasks' },
  { id: 'GPT4Turbo', name: 'GPT-4 Turbo', description: 'Faster GPT-4 with latest knowledge' },
  { id: 'GPT35Turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
  { id: 'Claude3', name: 'Claude 3', description: 'Advanced reasoning and analysis' },
  { id: 'Local', name: 'Local (Offline)', description: 'Privacy-focused, no internet required' },
];

export const SUMMARY_LEVELS: Array<{ id: SummaryLevel; name: string; description: string }> = [
  { id: 'Brief', name: 'Brief', description: '1-2 sentences, quick overview' },
  { id: 'Standard', name: 'Standard', description: '1 paragraph, main points' },
  { id: 'Detailed', name: 'Detailed', description: 'Multiple paragraphs, comprehensive' },
  { id: 'KeyPoints', name: 'Key Points', description: 'Bullet list of important points' },
];

// ==================== Service Class ====================

class BrowserAIAssistantService {
  private static instance: BrowserAIAssistantService;
  private eventHandlers: Map<AIAssistantEventType, Set<EventHandler>> = new Map();
  private settings: AIAssistantSettings | null = null;

  private constructor() {
    this.initializeEventHandlers();
  }

  public static getInstance(): BrowserAIAssistantService {
    if (!BrowserAIAssistantService.instance) {
      BrowserAIAssistantService.instance = new BrowserAIAssistantService();
    }
    return BrowserAIAssistantService.instance;
  }

  private initializeEventHandlers(): void {
    const eventTypes: AIAssistantEventType[] = [
      'summary-generated',
      'translation-complete',
      'form-analyzed',
      'search-enhanced',
      'question-answered',
      'content-analyzed',
      'error',
    ];
    eventTypes.forEach((type) => {
      this.eventHandlers.set(type, new Set());
    });
  }

  // ==================== Event System ====================

  public on(event: AIAssistantEventType, handler: EventHandler): () => void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.add(handler);
    }
    return () => this.off(event, handler);
  }

  public off(event: AIAssistantEventType, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: AIAssistantEventType, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const eventData: AIAssistantEvent = {
        type: event,
        data,
        timestamp: Date.now(),
      };
      handlers.forEach((handler) => {
        try {
          handler(eventData);
        } catch (error) {
          log.error(`Error in AI assistant event handler for ${event}:`, error);
        }
      });
    }
  }

  // ==================== Settings ====================

  public async getSettings(): Promise<AIAssistantSettings> {
    try {
      const settings = await invoke<AIAssistantSettings>('ai_get_settings');
      this.settings = settings;
      return settings;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get AI settings: ${error.message}`);
      }
      throw new Error('Failed to get AI settings: Unknown error');
    }
  }

  public async updateSettings(settings: AIAssistantSettings): Promise<void> {
    try {
      await invoke('ai_update_settings', { settings });
      this.settings = settings;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update AI settings: ${error.message}`);
      }
      throw new Error('Failed to update AI settings: Unknown error');
    }
  }

  public async setApiKey(apiKey: string): Promise<void> {
    try {
      await invoke('ai_set_api_key', { apiKey });
      if (this.settings) {
        this.settings.api_key = apiKey;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set API key: ${error.message}`);
      }
      throw new Error('Failed to set API key: Unknown error');
    }
  }

  public async setDefaultModel(model: AIModel): Promise<void> {
    try {
      await invoke('ai_set_default_model', { model });
      if (this.settings) {
        this.settings.default_model = model;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set default model: ${error.message}`);
      }
      throw new Error('Failed to set default model: Unknown error');
    }
  }

  public async setDefaultLanguage(language: Language): Promise<void> {
    try {
      await invoke('ai_set_default_language', { language });
      if (this.settings) {
        this.settings.default_language = language;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set default language: ${error.message}`);
      }
      throw new Error('Failed to set default language: Unknown error');
    }
  }

  // ==================== Summarization ====================

  public async summarizePage(
    url: string,
    title: string,
    content: string,
    level: SummaryLevel = 'Standard'
  ): Promise<PageSummary> {
    try {
      const summary = await invoke<PageSummary>('ai_summarize_page', {
        url,
        title,
        content,
        level,
      });
      this.emit('summary-generated', summary);
      return summary;
    } catch (error) {
      this.emit('error', { type: 'summarize', error });
      if (error instanceof Error) {
        throw new Error(`Failed to summarize page: ${error.message}`);
      }
      throw new Error('Failed to summarize page: Unknown error');
    }
  }

  public async summarizeBrief(url: string, title: string, content: string): Promise<PageSummary> {
    try {
      return await invoke<PageSummary>('ai_summarize_brief', { url, title, content });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create brief summary: ${error.message}`);
      }
      throw new Error('Failed to create brief summary: Unknown error');
    }
  }

  public async summarizeDetailed(url: string, title: string, content: string): Promise<PageSummary> {
    try {
      return await invoke<PageSummary>('ai_summarize_detailed', { url, title, content });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create detailed summary: ${error.message}`);
      }
      throw new Error('Failed to create detailed summary: Unknown error');
    }
  }

  public async getKeyPoints(url: string, title: string, content: string): Promise<PageSummary> {
    try {
      return await invoke<PageSummary>('ai_get_key_points', { url, title, content });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to extract key points: ${error.message}`);
      }
      throw new Error('Failed to extract key points: Unknown error');
    }
  }

  // ==================== Translation ====================

  public async translateText(
    text: string,
    targetLanguage: Language,
    sourceLanguage?: Language
  ): Promise<TranslationResult> {
    try {
      const result = await invoke<TranslationResult>('ai_translate_text', {
        text,
        sourceLanguage: sourceLanguage || null,
        targetLanguage,
      });
      this.emit('translation-complete', result);
      return result;
    } catch (error) {
      this.emit('error', { type: 'translate', error });
      if (error instanceof Error) {
        throw new Error(`Failed to translate text: ${error.message}`);
      }
      throw new Error('Failed to translate text: Unknown error');
    }
  }

  public async translatePage(url: string, content: string, targetLanguage: Language): Promise<TranslationResult> {
    try {
      return await invoke<TranslationResult>('ai_translate_page', {
        url,
        content,
        targetLanguage,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to translate page: ${error.message}`);
      }
      throw new Error('Failed to translate page: Unknown error');
    }
  }

  public async translateToEnglish(text: string): Promise<TranslationResult> {
    try {
      return await invoke<TranslationResult>('ai_translate_to_english', { text });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to translate to English: ${error.message}`);
      }
      throw new Error('Failed to translate to English: Unknown error');
    }
  }

  public async translateToSpanish(text: string): Promise<TranslationResult> {
    try {
      return await invoke<TranslationResult>('ai_translate_to_spanish', { text });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to translate to Spanish: ${error.message}`);
      }
      throw new Error('Failed to translate to Spanish: Unknown error');
    }
  }

  public async translateToFrench(text: string): Promise<TranslationResult> {
    try {
      return await invoke<TranslationResult>('ai_translate_to_french', { text });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to translate to French: ${error.message}`);
      }
      throw new Error('Failed to translate to French: Unknown error');
    }
  }

  public async translateToGerman(text: string): Promise<TranslationResult> {
    try {
      return await invoke<TranslationResult>('ai_translate_to_german', { text });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to translate to German: ${error.message}`);
      }
      throw new Error('Failed to translate to German: Unknown error');
    }
  }

  public async translateToChinese(text: string): Promise<TranslationResult> {
    try {
      return await invoke<TranslationResult>('ai_translate_to_chinese', { text });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to translate to Chinese: ${error.message}`);
      }
      throw new Error('Failed to translate to Chinese: Unknown error');
    }
  }

  public async translateToJapanese(text: string): Promise<TranslationResult> {
    try {
      return await invoke<TranslationResult>('ai_translate_to_japanese', { text });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to translate to Japanese: ${error.message}`);
      }
      throw new Error('Failed to translate to Japanese: Unknown error');
    }
  }

  // ==================== Form Filling ====================

  public async analyzeForm(formHtml: string, url: string): Promise<FormFillSuggestion> {
    try {
      const suggestion = await invoke<FormFillSuggestion>('ai_analyze_form', {
        formHtml,
        url,
      });
      this.emit('form-analyzed', suggestion);
      return suggestion;
    } catch (error) {
      this.emit('error', { type: 'form-fill', error });
      if (error instanceof Error) {
        throw new Error(`Failed to analyze form: ${error.message}`);
      }
      throw new Error('Failed to analyze form: Unknown error');
    }
  }

  public async suggestFormValues(
    formHtml: string,
    url: string,
    userProfile: Record<string, string>
  ): Promise<FormFillSuggestion> {
    try {
      return await invoke<FormFillSuggestion>('ai_suggest_form_values', {
        formHtml,
        url,
        userProfile,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to suggest form values: ${error.message}`);
      }
      throw new Error('Failed to suggest form values: Unknown error');
    }
  }

  // ==================== Smart Search ====================

  public async enhanceSearch(query: string): Promise<SmartSearchResult> {
    try {
      const result = await invoke<SmartSearchResult>('ai_enhance_search', { query });
      this.emit('search-enhanced', result);
      return result;
    } catch (error) {
      this.emit('error', { type: 'search', error });
      if (error instanceof Error) {
        throw new Error(`Failed to enhance search: ${error.message}`);
      }
      throw new Error('Failed to enhance search: Unknown error');
    }
  }

  // ==================== Question Answering ====================

  public async answerQuestion(question: string, context: string, url: string): Promise<QuestionAnswer> {
    try {
      const answer = await invoke<QuestionAnswer>('ai_answer_question', {
        question,
        context,
        url,
      });
      this.emit('question-answered', answer);
      return answer;
    } catch (error) {
      this.emit('error', { type: 'question', error });
      if (error instanceof Error) {
        throw new Error(`Failed to answer question: ${error.message}`);
      }
      throw new Error('Failed to answer question: Unknown error');
    }
  }

  // ==================== Content Analysis ====================

  public async analyzeContent(url: string, content: string): Promise<ContentAnalysis> {
    try {
      const analysis = await invoke<ContentAnalysis>('ai_analyze_content', {
        url,
        content,
      });
      this.emit('content-analyzed', analysis);
      return analysis;
    } catch (error) {
      this.emit('error', { type: 'analysis', error });
      if (error instanceof Error) {
        throw new Error(`Failed to analyze content: ${error.message}`);
      }
      throw new Error('Failed to analyze content: Unknown error');
    }
  }

  // ==================== Text Rewriting ====================

  public async rewriteText(text: string, style: string): Promise<string> {
    try {
      return await invoke<string>('ai_rewrite_text', { text, style });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to rewrite text: ${error.message}`);
      }
      throw new Error('Failed to rewrite text: Unknown error');
    }
  }

  public async makeFormal(text: string): Promise<string> {
    try {
      return await invoke<string>('ai_make_formal', { text });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to make text formal: ${error.message}`);
      }
      throw new Error('Failed to make text formal: Unknown error');
    }
  }

  public async makeCasual(text: string): Promise<string> {
    try {
      return await invoke<string>('ai_make_casual', { text });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to make text casual: ${error.message}`);
      }
      throw new Error('Failed to make text casual: Unknown error');
    }
  }

  public async makeConcise(text: string): Promise<string> {
    try {
      return await invoke<string>('ai_make_concise', { text });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to make text concise: ${error.message}`);
      }
      throw new Error('Failed to make text concise: Unknown error');
    }
  }

  // ==================== Code Explanation ====================

  public async explainCode(code: string, language: string): Promise<string> {
    try {
      return await invoke<string>('ai_explain_code', { code, language });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to explain code: ${error.message}`);
      }
      throw new Error('Failed to explain code: Unknown error');
    }
  }

  // ==================== History ====================

  public async getHistory(limit: number = 50): Promise<AITaskHistory[]> {
    try {
      return await invoke<AITaskHistory[]>('ai_get_history', { limit });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get AI history: ${error.message}`);
      }
      throw new Error('Failed to get AI history: Unknown error');
    }
  }

  public async clearHistory(): Promise<void> {
    try {
      await invoke('ai_clear_history');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to clear AI history: ${error.message}`);
      }
      throw new Error('Failed to clear AI history: Unknown error');
    }
  }

  // ==================== Statistics ====================

  public async getStats(): Promise<AIAssistantStats> {
    try {
      return await invoke<AIAssistantStats>('ai_get_stats');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get AI stats: ${error.message}`);
      }
      throw new Error('Failed to get AI stats: Unknown error');
    }
  }

  public async resetStats(): Promise<void> {
    try {
      await invoke('ai_reset_stats');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to reset AI stats: ${error.message}`);
      }
      throw new Error('Failed to reset AI stats: Unknown error');
    }
  }

  // ==================== Cache ====================

  public async clearCache(): Promise<void> {
    try {
      await invoke('ai_clear_cache');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to clear AI cache: ${error.message}`);
      }
      throw new Error('Failed to clear AI cache: Unknown error');
    }
  }

  public async getCacheSize(): Promise<{ summaries: number; translations: number }> {
    try {
      const [summaries, translations] = await invoke<[number, number]>('ai_get_cache_size');
      return { summaries, translations };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get cache size: ${error.message}`);
      }
      throw new Error('Failed to get cache size: Unknown error');
    }
  }

  // ==================== Quick Actions ====================

  public async quickSummarize(content: string): Promise<string> {
    try {
      return await invoke<string>('ai_quick_summarize', { content });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to quick summarize: ${error.message}`);
      }
      throw new Error('Failed to quick summarize: Unknown error');
    }
  }

  public async quickTranslate(text: string, target: string): Promise<string> {
    try {
      return await invoke<string>('ai_quick_translate', { text, target });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to quick translate: ${error.message}`);
      }
      throw new Error('Failed to quick translate: Unknown error');
    }
  }

  public async quickAnswer(question: string, context: string): Promise<string> {
    try {
      return await invoke<string>('ai_quick_answer', { question, context });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to quick answer: ${error.message}`);
      }
      throw new Error('Failed to quick answer: Unknown error');
    }
  }

  // ==================== Utilities ====================

  public async getAvailableLanguages(): Promise<Array<[string, string]>> {
    try {
      return await invoke<Array<[string, string]>>('ai_get_available_languages');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get available languages: ${error.message}`);
      }
      throw new Error('Failed to get available languages: Unknown error');
    }
  }

  public async getAvailableModels(): Promise<Array<[string, string]>> {
    try {
      return await invoke<Array<[string, string]>>('ai_get_available_models');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get available models: ${error.message}`);
      }
      throw new Error('Failed to get available models: Unknown error');
    }
  }

  public async getSummaryLevels(): Promise<Array<[string, string]>> {
    try {
      return await invoke<Array<[string, string]>>('ai_get_summary_levels');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get summary levels: ${error.message}`);
      }
      throw new Error('Failed to get summary levels: Unknown error');
    }
  }

  // ==================== Helper Methods ====================

  public getLanguageOptions(): typeof LANGUAGES {
    return LANGUAGES;
  }

  public getModelOptions(): typeof AI_MODELS {
    return AI_MODELS;
  }

  public getSummaryLevelOptions(): typeof SUMMARY_LEVELS {
    return SUMMARY_LEVELS;
  }

  public languageToEnum(code: string): Language {
    const mapping: Record<string, Language> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
      ru: 'Russian',
      hi: 'Hindi',
      nl: 'Dutch',
      pl: 'Polish',
      tr: 'Turkish',
      vi: 'Vietnamese',
      th: 'Thai',
      id: 'Indonesian',
    };
    return mapping[code] || { Other: code };
  }

  public getKeyboardShortcuts(): Array<{ key: string; description: string }> {
    return [
      { key: 'Ctrl+Shift+A', description: 'Open AI Assistant' },
      { key: 'Ctrl+Shift+S', description: 'Summarize current page' },
      { key: 'Ctrl+Shift+T', description: 'Translate selection' },
      { key: 'Ctrl+Shift+Q', description: 'Ask question about page' },
      { key: 'Ctrl+Shift+F', description: 'Smart form fill' },
    ];
  }

  public formatReadingTime(minutes: number): string {
    if (minutes < 1) return 'Less than 1 min read';
    if (minutes === 1) return '1 min read';
    return `${minutes} min read`;
  }

  public formatConfidence(confidence: number): string {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Medium';
    if (confidence >= 0.3) return 'Low';
    return 'Very Low';
  }

  public getSentimentEmoji(sentiment: string): string {
    const mapping: Record<string, string> = {
      Positive: '😊',
      Negative: '😞',
      Neutral: '😐',
    };
    return mapping[sentiment] || '❓';
  }

  public getComplexityIcon(level: string): string {
    const mapping: Record<string, string> = {
      'Very Easy': '📗',
      Easy: '📘',
      'Fairly Easy': '📙',
      Standard: '📕',
      'Fairly Difficult': '📒',
      Difficult: '📓',
      'Very Difficult': '📔',
    };
    return mapping[level] || '📖';
  }
}

// Export singleton instance
export const browserAIAssistantService = BrowserAIAssistantService.getInstance();

// Export class for testing
export { BrowserAIAssistantService };
