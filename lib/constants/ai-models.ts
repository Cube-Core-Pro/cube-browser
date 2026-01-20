// AI Model Configurations for CUBE Nexum
// Supports OpenAI GPT-5.2 series, Claude 4, and specialized models
// Updated December 2025 with latest OpenAI models

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  category: 'general' | 'code' | 'vision' | 'reasoning';
  description: string;
  maxTokens: number;
  costPer1kTokens: number;
  features: string[];
}

// ============================================================================
// OPENAI MODELS - GPT-5.2 Series (Latest December 2025)
// ============================================================================

export const OPENAI_MODELS: AIModel[] = [
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    category: 'general',
    description: 'The best model for coding and agentic tasks with configurable reasoning',
    maxTokens: 200000,
    costPer1kTokens: 1.25,
    features: ['Best for coding', 'Agentic tasks', 'Configurable reasoning', '200K context']
  },
  {
    id: 'gpt-5.2-codex',
    name: 'GPT-5.2 Codex',
    provider: 'openai',
    category: 'code',
    description: 'Optimized for agentic coding tasks',
    maxTokens: 200000,
    costPer1kTokens: 1.25,
    features: ['Code generation', 'Agentic coding', 'Long-horizon tasks']
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    category: 'general',
    description: 'A faster, cheaper version of GPT-5 for well-defined tasks',
    maxTokens: 200000,
    costPer1kTokens: 0.25,
    features: ['Fast responses', 'Cost-effective', 'Well-defined tasks']
  },
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'openai',
    category: 'general',
    description: 'Fastest, cheapest version—great for summarization and classification',
    maxTokens: 128000,
    costPer1kTokens: 0.05,
    features: ['Ultra-fast', 'Cheapest', 'Summarization', 'Classification']
  },
  {
    id: 'gpt-5-pro',
    name: 'GPT-5 Pro',
    provider: 'openai',
    category: 'reasoning',
    description: 'The smartest and most precise model',
    maxTokens: 200000,
    costPer1kTokens: 15.0,
    features: ['Smartest', 'Most precise', 'Complex reasoning']
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    category: 'general',
    description: 'Smartest non-reasoning model',
    maxTokens: 128000,
    costPer1kTokens: 3.0,
    features: ['Non-reasoning', 'High intelligence', 'Fine-tunable']
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'openai',
    category: 'general',
    description: 'Smaller, faster version of GPT-4.1',
    maxTokens: 128000,
    costPer1kTokens: 0.8,
    features: ['Fast', 'Cost-effective', 'Fine-tunable']
  },
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    provider: 'openai',
    category: 'general',
    description: 'Smallest and fastest GPT-4.1 version',
    maxTokens: 128000,
    costPer1kTokens: 0.2,
    features: ['Ultra-fast', 'Cheapest', 'Fine-tunable']
  },
  {
    id: 'o3',
    name: 'O3',
    provider: 'openai',
    category: 'reasoning',
    description: 'Reasoning model for complex tasks',
    maxTokens: 200000,
    costPer1kTokens: 10.0,
    features: ['Deep reasoning', 'Complex tasks', 'STEM']
  },
  {
    id: 'o4-mini',
    name: 'O4 Mini',
    provider: 'openai',
    category: 'reasoning',
    description: 'Fast, cost-efficient reasoning model',
    maxTokens: 200000,
    costPer1kTokens: 4.0,
    features: ['Fast reasoning', 'Cost-efficient', 'STEM']
  }
];

// ============================================================================
// ANTHROPIC MODELS - Claude 4 Series
// ============================================================================

export const CLAUDE_MODELS: AIModel[] = [
  {
    id: 'claude-4-opus',
    name: 'Claude 4 Opus',
    provider: 'anthropic',
    category: 'general',
    description: 'Most capable Claude model for complex tasks',
    maxTokens: 200000,
    costPer1kTokens: 0.015,
    features: ['Superior reasoning', 'Long context', '200K tokens']
  },
  {
    id: 'claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    provider: 'anthropic',
    category: 'general',
    description: 'Best balance of intelligence and speed',
    maxTokens: 200000,
    costPer1kTokens: 0.003,
    features: ['Fast responses', 'High quality', 'Vision support']
  },
  {
    id: 'claude-4-haiku',
    name: 'Claude 4 Haiku',
    provider: 'anthropic',
    category: 'general',
    description: 'Fastest Claude model for quick interactions',
    maxTokens: 200000,
    costPer1kTokens: 0.00025,
    features: ['Ultra-fast', 'Low cost', 'Good quality']
  }
];

// ============================================================================
// GOOGLE MODELS - Gemini 3 Series
// ============================================================================

export const GEMINI_MODELS: AIModel[] = [
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'google',
    category: 'general',
    description: 'Most capable Gemini model',
    maxTokens: 1000000,
    costPer1kTokens: 0.01,
    features: ['1M context', 'Multi-modal', 'Advanced reasoning']
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    provider: 'google',
    category: 'general',
    description: 'Fast and efficient Gemini model',
    maxTokens: 1000000,
    costPer1kTokens: 0.001,
    features: ['Ultra-fast', 'Cost-effective', 'Multi-modal']
  }
];

// ============================================================================
// ALL MODELS COMBINED
// ============================================================================

export const ALL_AI_MODELS: AIModel[] = [
  ...OPENAI_MODELS,
  ...CLAUDE_MODELS,
  ...GEMINI_MODELS
];

// ============================================================================
// MODEL CATEGORIES
// ============================================================================

export const MODEL_CATEGORIES = {
  general: 'General Purpose',
  code: 'Code & Development',
  vision: 'Vision & Image Analysis',
  reasoning: 'Advanced Reasoning'
} as const;

// ============================================================================
// DEFAULT MODELS BY USE CASE
// ============================================================================

export const DEFAULT_MODELS = {
  assistant: 'gpt-5.2',
  nexus: 'gpt-5.2-codex',
  workflow: 'gpt-5.2',
  selector: 'gpt-5-mini',
  vision: 'gpt-5.2',
  reasoning: 'o4-mini'
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getModelById(id: string): AIModel | undefined {
  return ALL_AI_MODELS.find(model => model.id === id);
}

export function getModelsByCategory(category: AIModel['category']): AIModel[] {
  return ALL_AI_MODELS.filter(model => model.category === category);
}

export function getModelsByProvider(provider: AIModel['provider']): AIModel[] {
  return ALL_AI_MODELS.filter(model => model.provider === provider);
}

export function getModelDisplayName(id: string): string {
  const model = getModelById(id);
  return model ? model.name : id;
}
