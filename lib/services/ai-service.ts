/**
 * AI Service - Frontend Integration Layer
 * CUBE Elite v6 - AI Assistant & Chat Integration
 * 
 * This service provides typed wrappers for all AI/Chat Tauri backend commands.
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('AI');

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  command_executed?: string;
  action_result?: {
    success: boolean;
    message: string;
    data?: unknown;
  };
}

export interface BrowserContext {
  current_url: string;
  current_title: string;
  tabs_count: number;
  active_downloads: number;
  last_command?: string;
}

export interface CommandSuggestion {
  command: string;
  description: string;
  example: string;
  category: string;
}

export interface ChatSession {
  messages: ChatMessage[];
}

export interface AISettings {
  api_key?: string;
  model: string;
  available_models: string[];
}

export interface WorkflowSuggestion {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  confidence: number;
}

export interface WorkflowStep {
  type: string;
  action: string;
  selector?: string;
  value?: string;
  wait?: number;
}

export interface SelectorSuggestion {
  selector: string;
  type: 'css' | 'xpath' | 'id' | 'class';
  confidence: number;
  description: string;
}

// ============================================================================
// Chat Service
// ============================================================================

export const ChatService = {
  /**
   * Start a new chat session
   */
  startSession: async (): Promise<ChatSession> => {
    return invoke<ChatSession>('start_chat_session');
  },

  /**
   * Send a message in the chat
   */
  sendMessage: async (message: string): Promise<ChatMessage> => {
    return invoke<ChatMessage>('send_chat_message', { message });
  },

  /**
   * Get chat history
   */
  getHistory: async (): Promise<ChatMessage[]> => {
    return invoke<ChatMessage[]>('get_chat_history');
  },

  /**
   * Clear chat history
   */
  clearHistory: async (): Promise<void> => {
    return invoke('clear_chat_history');
  },

  /**
   * Update browser context for AI assistance
   */
  updateContext: async (context: BrowserContext): Promise<void> => {
    return invoke('update_browser_context', { context });
  },

  /**
   * Get command suggestions based on query
   */
  getSuggestions: async (query: string): Promise<CommandSuggestion[]> => {
    return invoke<CommandSuggestion[]>('get_command_suggestions', { query });
  },
};

// ============================================================================
// OpenAI Settings Service
// ============================================================================

export const OpenAIService = {
  /**
   * Set OpenAI API key
   */
  setApiKey: async (apiKey: string): Promise<void> => {
    return invoke('set_openai_api_key', { apiKey });
  },

  /**
   * Get available AI models
   */
  getAvailableModels: async (): Promise<string[]> => {
    return invoke<string[]>('get_available_models');
  },

  /**
   * Get currently selected model
   */
  getSelectedModel: async (): Promise<string> => {
    return invoke<string>('get_selected_model');
  },

  /**
   * Set selected AI model
   */
  setSelectedModel: async (model: string): Promise<void> => {
    return invoke('set_selected_model', { model });
  },
};

// ============================================================================
// AI Workflow Service
// ============================================================================

export const AIWorkflowService = {
  /**
   * Generate workflow from natural language description
   */
  generateWorkflow: async (description: string): Promise<WorkflowSuggestion> => {
    return invoke<WorkflowSuggestion>('ai_generate_workflow', { description });
  },

  /**
   * Get workflow suggestions based on current page
   */
  getWorkflowSuggestions: async (url: string, pageContent?: string): Promise<WorkflowSuggestion[]> => {
    return invoke<WorkflowSuggestion[]>('ai_workflow_suggestions', { url, pageContent });
  },

  /**
   * Optimize existing workflow
   */
  optimizeWorkflow: async (workflow: unknown): Promise<WorkflowSuggestion> => {
    return invoke<WorkflowSuggestion>('ai_optimize_workflow', { workflow });
  },
};

// ============================================================================
// AI Selector Service
// ============================================================================

export const AISelectorService = {
  /**
   * Generate smart selector for element
   */
  generateSelector: async (elementDescription: string, pageContext?: string): Promise<SelectorSuggestion[]> => {
    return invoke<SelectorSuggestion[]>('ai_generate_selector', { elementDescription, pageContext });
  },

  /**
   * Improve existing selector
   */
  improveSelector: async (selector: string, pageContext?: string): Promise<SelectorSuggestion[]> => {
    return invoke<SelectorSuggestion[]>('ai_improve_selector', { selector, pageContext });
  },

  /**
   * Validate selector on page
   */
  validateSelector: async (selector: string, url: string): Promise<{ valid: boolean; matches: number }> => {
    return invoke<{ valid: boolean; matches: number }>('ai_validate_selector', { selector, url });
  },
};

// ============================================================================
// AI Analysis Service
// ============================================================================

export const AIAnalysisService = {
  /**
   * Analyze page structure for automation
   */
  analyzePage: async (url: string): Promise<{ elements: unknown[]; suggestions: string[] }> => {
    return invoke<{ elements: unknown[]; suggestions: string[] }>('ai_analyze_page', { url });
  },

  /**
   * Generate schema from page
   */
  generateSchema: async (url: string, dataType: string): Promise<unknown> => {
    return invoke<unknown>('ai_generate_schema', { url, dataType });
  },

  /**
   * Get AI insights for data
   */
  getInsights: async (data: unknown, context: string): Promise<string[]> => {
    return invoke<string[]>('ai_get_insights', { data, context });
  },
};

// ============================================================================
// Unified AI Service Export
// ============================================================================

export const AIService = {
  Chat: ChatService,
  OpenAI: OpenAIService,
  Workflow: AIWorkflowService,
  Selector: AISelectorService,
  Analysis: AIAnalysisService,
};

// ============================================================================
// Legacy aiService Compatibility
// ============================================================================

class AIServiceLegacy {
  private apiKeySet = false;

  async setApiKey(apiKey: string): Promise<void> {
    try {
      await invoke('set_ai_api_key', { apiKey });
      this.apiKeySet = true;
    } catch (error) {
      log.error('Failed to set API key:', error);
      throw new Error(`Failed to set API key: ${error}`);
    }
  }

  async hasApiKey(): Promise<boolean> {
    try {
      const hasKey = await invoke<boolean>('has_ai_api_key');
      this.apiKeySet = hasKey;
      return hasKey;
    } catch (error) {
      log.error('Failed to check API key:', error);
      return false;
    }
  }

  async sendRequest(
    prompt: string,
    model: string = 'gpt-5.2',
    temperature: number = 0.7,
    maxTokens?: number
  ): Promise<{ content: string; model: string; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
    try {
      const response = await invoke<{ content: string; model: string; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }>('send_ai_request', { 
        request: { prompt, model, temperature, max_tokens: maxTokens }
      });
      return response;
    } catch (error) {
      log.error('AI request failed:', error);
      throw new Error(`AI request failed: ${error}`);
    }
  }

  async generateSelector(description: string, pageHtml?: string): Promise<string> {
    try {
      const selector = await invoke<string>('generate_selector', {
        description,
        pageHtml: pageHtml || null,
      });
      return selector;
    } catch (error) {
      log.error('Selector generation failed:', error);
      throw new Error(`Failed to generate selector: ${error}`);
    }
  }

  async improveSelector(currentSelector: string, issue: string): Promise<string> {
    try {
      const selector = await invoke<string>('improve_selector', {
        currentSelector,
        issue,
      });
      return selector;
    } catch (error) {
      log.error('Selector improvement failed:', error);
      throw new Error(`Failed to improve selector: ${error}`);
    }
  }

  async generateWorkflow(description: string): Promise<string> {
    try {
      const workflow = await invoke<string>('generate_workflow', { description });
      return workflow;
    } catch (error) {
      log.error('Workflow generation failed:', error);
      throw new Error(`Failed to generate workflow: ${error}`);
    }
  }

  isReady(): boolean {
    return this.apiKeySet;
  }
}

export const aiService = new AIServiceLegacy();

export default AIService;
