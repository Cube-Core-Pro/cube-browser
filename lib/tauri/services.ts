import { invoke } from '@tauri-apps/api/core';

export interface AIRequest {
  prompt: string;
  model: string;
  temperature: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const aiService = {
  /**
   * Set OpenAI API key
   */
  setApiKey: async (apiKey: string): Promise<void> => {
    try {
      await invoke('set_ai_api_key', { apiKey });
    } catch (error) {
      throw new Error(`Failed to set API key: ${error}`);
    }
  },

  /**
   * Check if API key is configured
   */
  hasApiKey: async (): Promise<boolean> => {
    try {
      return await invoke<boolean>('has_ai_api_key');
    } catch (error) {
      throw new Error(`Failed to check API key: ${error}`);
    }
  },

  /**
   * Send request to AI
   */
  sendRequest: async (request: AIRequest): Promise<AIResponse> => {
    try {
      const response = await invoke<AIResponse>('send_ai_request', {
        request: {
          prompt: request.prompt,
          model: request.model,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
        },
      });
      
      return {
        content: response.content,
        model: response.model,
        usage: {
          promptTokens: response.usage.promptTokens || 0,
          completionTokens: response.usage.completionTokens || 0,
          totalTokens: response.usage.totalTokens || 0,
        },
      };
    } catch (error) {
      throw new Error(`AI request failed: ${error}`);
    }
  },

  /**
   * Generate CSS selector from description
   */
  generateSelector: async (
    description: string,
    pageHtml?: string
  ): Promise<string> => {
    try {
      return await invoke<string>('generate_selector', {
        description,
        pageHtml,
      });
    } catch (error) {
      throw new Error(`Failed to generate selector: ${error}`);
    }
  },

  /**
   * Improve existing CSS selector
   */
  improveSelector: async (
    currentSelector: string,
    issue: string
  ): Promise<string> => {
    try {
      return await invoke<string>('improve_selector', {
        currentSelector,
        issue,
      });
    } catch (error) {
      throw new Error(`Failed to improve selector: ${error}`);
    }
  },

  /**
   * Generate workflow from description
   */
  generateWorkflow: async (description: string): Promise<string> => {
    try {
      return await invoke<string>('generate_workflow', { description });
    } catch (error) {
      throw new Error(`Failed to generate workflow: ${error}`);
    }
  },
};

export const storageService = {
  /**
   * Set value in storage
   */
  set: async (key: string, value: string): Promise<void> => {
    try {
      await invoke('storage_set', { key, value });
    } catch (error) {
      throw new Error(`Failed to set storage value: ${error}`);
    }
  },

  /**
   * Get value from storage
   */
  get: async (key: string): Promise<string | null> => {
    try {
      return await invoke<string | null>('storage_get', { key });
    } catch (error) {
      throw new Error(`Failed to get storage value: ${error}`);
    }
  },

  /**
   * Remove value from storage
   */
  remove: async (key: string): Promise<boolean> => {
    try {
      return await invoke<boolean>('storage_remove', { key });
    } catch (error) {
      throw new Error(`Failed to remove storage value: ${error}`);
    }
  },

  /**
   * Clear all storage
   */
  clear: async (): Promise<void> => {
    try {
      await invoke('storage_clear');
    } catch (error) {
      throw new Error(`Failed to clear storage: ${error}`);
    }
  },

  /**
   * Get all storage keys
   */
  keys: async (): Promise<string[]> => {
    try {
      return await invoke<string[]>('storage_keys');
    } catch (error) {
      throw new Error(`Failed to get storage keys: ${error}`);
    }
  },

  /**
   * Check if key exists
   */
  has: async (key: string): Promise<boolean> => {
    try {
      return await invoke<boolean>('storage_has', { key });
    } catch (error) {
      throw new Error(`Failed to check storage key: ${error}`);
    }
  },
};

export const encryptionService = {
  /**
   * Encrypt data with password
   */
  encrypt: async (data: string, password: string): Promise<string> => {
    try {
      return await invoke<string>('encrypt_data', { data, password });
    } catch (error) {
      throw new Error(`Failed to encrypt data: ${error}`);
    }
  },

  /**
   * Decrypt data with password
   */
  decrypt: async (encrypted: string, password: string): Promise<string> => {
    try {
      return await invoke<string>('decrypt_data', { encrypted, password });
    } catch (error) {
      throw new Error(`Failed to decrypt data: ${error}`);
    }
  },

  /**
   * Hash data
   */
  hash: async (data: string): Promise<string> => {
    try {
      return await invoke<string>('hash_data', { data });
    } catch (error) {
      throw new Error(`Failed to hash data: ${error}`);
    }
  },

  /**
   * Generate random string
   */
  generateRandomString: async (length: number): Promise<string> => {
    try {
      return await invoke<string>('generate_random_string', { length });
    } catch (error) {
      throw new Error(`Failed to generate random string: ${error}`);
    }
  },
};
