/**
 * Shared types for services
 */

export interface AIRequest {
  prompt: string;
  model: string;
  temperature: number;
  max_tokens?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
