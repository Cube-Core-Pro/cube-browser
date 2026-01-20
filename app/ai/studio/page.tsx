'use client';

import React, { useState } from 'react';
import { 
  Brain, Sparkles, Zap, Activity, TrendingUp, MessageSquare,
  Image, FileText, Code, Mic, Video, Globe, Settings, History,
  Play, Pause, RefreshCw, Download, Upload, Copy, ChevronDown,
  ChevronRight, AlertCircle, CheckCircle, Clock, BarChart3,
  PieChart, Target, Layers, Cpu, Database, Cloud, Star, 
  ThumbsUp, ThumbsDown, Send, Filter, Search, Plus, X,
  Wand2, Palette, BookOpen, Lightbulb, GitBranch, Terminal,
  Eye, Edit3, Trash2, MoreHorizontal, ExternalLink, Lock
} from 'lucide-react';
import './ai-studio.css';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'multimodal' | 'code' | 'embedding';
  version: string;
  contextWindow: number;
  maxTokens: number;
  costPer1kTokens: { input: number; output: number };
  latency: number;
  status: 'available' | 'degraded' | 'unavailable';
  capabilities: string[];
  recommended?: boolean;
}

interface Prompt {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: string;
  usageCount: number;
  rating: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  tokens?: number;
  latency?: number;
  timestamp: string;
}

interface UsageMetrics {
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  avgLatency: number;
  successRate: number;
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  status: 'draft' | 'active' | 'paused';
  executions: number;
  lastRun?: string;
}

interface PipelineStep {
  id: string;
  type: 'prompt' | 'transform' | 'condition' | 'output';
  name: string;
  config: Record<string, unknown>;
}

type TabType = 'playground' | 'models' | 'prompts' | 'pipelines' | 'analytics' | 'history';

const AI_MODELS: AIModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    type: 'multimodal',
    version: '2024-04-09',
    contextWindow: 128000,
    maxTokens: 4096,
    costPer1kTokens: { input: 0.01, output: 0.03 },
    latency: 850,
    status: 'available',
    capabilities: ['text', 'vision', 'json-mode', 'function-calling'],
    recommended: true
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    type: 'multimodal',
    version: '2024-05-13',
    contextWindow: 128000,
    maxTokens: 4096,
    costPer1kTokens: { input: 0.005, output: 0.015 },
    latency: 450,
    status: 'available',
    capabilities: ['text', 'vision', 'audio', 'json-mode', 'function-calling'],
    recommended: true
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    type: 'multimodal',
    version: '20240229',
    contextWindow: 200000,
    maxTokens: 4096,
    costPer1kTokens: { input: 0.015, output: 0.075 },
    latency: 1200,
    status: 'available',
    capabilities: ['text', 'vision', 'analysis', 'coding'],
    recommended: true
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    type: 'multimodal',
    version: '20240620',
    contextWindow: 200000,
    maxTokens: 8192,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    latency: 650,
    status: 'available',
    capabilities: ['text', 'vision', 'analysis', 'coding', 'artifacts']
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    type: 'multimodal',
    version: '001',
    contextWindow: 1000000,
    maxTokens: 8192,
    costPer1kTokens: { input: 0.0025, output: 0.01 },
    latency: 750,
    status: 'available',
    capabilities: ['text', 'vision', 'audio', 'video', 'long-context']
  },
  {
    id: 'llama-3.1-405b',
    name: 'Llama 3.1 405B',
    provider: 'Meta (via Together)',
    type: 'text',
    version: '3.1',
    contextWindow: 128000,
    maxTokens: 4096,
    costPer1kTokens: { input: 0.005, output: 0.015 },
    latency: 950,
    status: 'available',
    capabilities: ['text', 'coding', 'multilingual', 'function-calling']
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    type: 'text',
    version: '2407',
    contextWindow: 128000,
    maxTokens: 4096,
    costPer1kTokens: { input: 0.004, output: 0.012 },
    latency: 550,
    status: 'available',
    capabilities: ['text', 'coding', 'function-calling', 'json-mode']
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    type: 'image',
    version: '3',
    contextWindow: 4000,
    maxTokens: 0,
    costPer1kTokens: { input: 0.04, output: 0 },
    latency: 15000,
    status: 'available',
    capabilities: ['image-generation', 'editing', 'variations']
  },
  {
    id: 'whisper-large-v3',
    name: 'Whisper Large V3',
    provider: 'OpenAI',
    type: 'audio',
    version: 'large-v3',
    contextWindow: 0,
    maxTokens: 0,
    costPer1kTokens: { input: 0.006, output: 0 },
    latency: 3000,
    status: 'available',
    capabilities: ['speech-to-text', 'translation', 'timestamps']
  },
  {
    id: 'text-embedding-3-large',
    name: 'Text Embedding 3 Large',
    provider: 'OpenAI',
    type: 'embedding',
    version: '3-large',
    contextWindow: 8191,
    maxTokens: 0,
    costPer1kTokens: { input: 0.00013, output: 0 },
    latency: 150,
    status: 'available',
    capabilities: ['embeddings', 'semantic-search', 'clustering']
  }
];

const PROMPTS: Prompt[] = [
  {
    id: 'prompt-1',
    name: 'Code Review Assistant',
    description: 'Analyze code for bugs, security issues, and suggest improvements',
    template: 'Review the following {{language}} code and provide:\n1. Bug analysis\n2. Security vulnerabilities\n3. Performance optimizations\n4. Code style improvements\n\nCode:\n```{{language}}\n{{code}}\n```',
    variables: ['language', 'code'],
    category: 'Development',
    usageCount: 1245,
    rating: 4.8,
    isPublic: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-03-20'
  },
  {
    id: 'prompt-2',
    name: 'Content Summarizer',
    description: 'Generate concise summaries of long documents or articles',
    template: 'Summarize the following content in {{length}} format. Focus on key points and main arguments.\n\nContent:\n{{content}}\n\nProvide:\n- Executive summary (2-3 sentences)\n- Key points (bullet list)\n- Action items (if any)',
    variables: ['length', 'content'],
    category: 'Content',
    usageCount: 892,
    rating: 4.6,
    isPublic: true,
    createdAt: '2024-02-01',
    updatedAt: '2024-03-18'
  },
  {
    id: 'prompt-3',
    name: 'SQL Query Generator',
    description: 'Generate SQL queries from natural language descriptions',
    template: 'Database Schema:\n{{schema}}\n\nGenerate a {{dialect}} SQL query to: {{description}}\n\nRequirements:\n- Use efficient joins\n- Include proper indexing hints\n- Add comments explaining the query',
    variables: ['schema', 'dialect', 'description'],
    category: 'Development',
    usageCount: 2156,
    rating: 4.9,
    isPublic: true,
    createdAt: '2024-01-20',
    updatedAt: '2024-04-05'
  },
  {
    id: 'prompt-4',
    name: 'API Documentation Writer',
    description: 'Generate comprehensive API documentation from code',
    template: 'Generate API documentation for the following endpoint:\n\nEndpoint Code:\n```{{language}}\n{{code}}\n```\n\nInclude:\n- Description\n- Request/Response schemas\n- Example requests\n- Error codes\n- Rate limiting info',
    variables: ['language', 'code'],
    category: 'Development',
    usageCount: 567,
    rating: 4.7,
    isPublic: true,
    createdAt: '2024-02-10',
    updatedAt: '2024-03-25'
  },
  {
    id: 'prompt-5',
    name: 'Customer Support Response',
    description: 'Generate professional customer support responses',
    template: 'Customer Issue: {{issue}}\nSentiment: {{sentiment}}\nPriority: {{priority}}\n\nGenerate a {{tone}} response that:\n- Acknowledges the issue\n- Provides solution or next steps\n- Sets clear expectations\n- Maintains brand voice',
    variables: ['issue', 'sentiment', 'priority', 'tone'],
    category: 'Support',
    usageCount: 3421,
    rating: 4.5,
    isPublic: false,
    createdAt: '2024-01-05',
    updatedAt: '2024-04-01'
  }
];

const PIPELINES: Pipeline[] = [
  {
    id: 'pipe-1',
    name: 'Document Processing Pipeline',
    description: 'Extract, summarize, and categorize uploaded documents',
    steps: [
      { id: 's1', type: 'prompt', name: 'Extract Text', config: {} },
      { id: 's2', type: 'transform', name: 'Clean & Format', config: {} },
      { id: 's3', type: 'prompt', name: 'Summarize', config: {} },
      { id: 's4', type: 'prompt', name: 'Categorize', config: {} },
      { id: 's5', type: 'output', name: 'Store Results', config: {} }
    ],
    status: 'active',
    executions: 4521,
    lastRun: '5 minutes ago'
  },
  {
    id: 'pipe-2',
    name: 'Code Analysis Workflow',
    description: 'Analyze code quality, security, and generate documentation',
    steps: [
      { id: 's1', type: 'prompt', name: 'Parse Code', config: {} },
      { id: 's2', type: 'condition', name: 'Language Check', config: {} },
      { id: 's3', type: 'prompt', name: 'Security Scan', config: {} },
      { id: 's4', type: 'prompt', name: 'Generate Docs', config: {} },
      { id: 's5', type: 'output', name: 'Create Report', config: {} }
    ],
    status: 'active',
    executions: 1892,
    lastRun: '1 hour ago'
  },
  {
    id: 'pipe-3',
    name: 'Customer Feedback Analysis',
    description: 'Analyze feedback, extract sentiment, and generate insights',
    steps: [
      { id: 's1', type: 'prompt', name: 'Sentiment Analysis', config: {} },
      { id: 's2', type: 'prompt', name: 'Topic Extraction', config: {} },
      { id: 's3', type: 'transform', name: 'Aggregate Results', config: {} },
      { id: 's4', type: 'output', name: 'Dashboard Update', config: {} }
    ],
    status: 'paused',
    executions: 8934,
    lastRun: '2 days ago'
  }
];

const SAMPLE_MESSAGES: ConversationMessage[] = [
  {
    id: 'msg-1',
    role: 'system',
    content: 'You are an expert software engineer and code reviewer. Provide detailed, actionable feedback on code quality, security, and performance.',
    timestamp: '10:00 AM'
  },
  {
    id: 'msg-2',
    role: 'user',
    content: 'Can you review this Python function for potential issues?\n\n```python\ndef process_user_data(user_input):\n    query = f"SELECT * FROM users WHERE name = \'{user_input}\'";\n    result = db.execute(query)\n    return json.loads(result)\n```',
    timestamp: '10:01 AM'
  },
  {
    id: 'msg-3',
    role: 'assistant',
    content: '## Security Analysis\n\n🚨 **Critical: SQL Injection Vulnerability**\nThe function is vulnerable to SQL injection attacks. User input is directly interpolated into the SQL query.\n\n**Fix:**\n```python\ndef process_user_data(user_input):\n    query = "SELECT * FROM users WHERE name = %s"\n    result = db.execute(query, (user_input,))\n    return result.fetchall()\n```\n\n## Additional Issues\n\n1. **Type Safety**: No validation of `user_input` type\n2. **Error Handling**: No try-catch for database errors\n3. **Return Type**: `json.loads()` on query result is incorrect\n\n## Recommended Refactored Version\n\n```python\nfrom typing import Optional, List, Dict\nimport logging\n\ndef process_user_data(user_input: str) -> Optional[List[Dict]]:\n    if not isinstance(user_input, str) or not user_input.strip():\n        raise ValueError("Invalid user input")\n    \n    try:\n        query = "SELECT * FROM users WHERE name = %s"\n        result = db.execute(query, (user_input,))\n        return [dict(row) for row in result.fetchall()]\n    except DatabaseError as e:\n        logging.error(f"Database error: {e}")\n        raise\n```',
    model: 'gpt-4-turbo',
    tokens: 342,
    latency: 1250,
    timestamp: '10:01 AM'
  }
];

export default function AIStudioPage() {
  const [activeTab, setActiveTab] = useState<TabType>('playground');
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [messages, setMessages] = useState<ConversationMessage[]>(SAMPLE_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  const metrics: UsageMetrics = {
    totalTokens: 1250420,
    totalCost: 156.78,
    totalRequests: 8945,
    avgLatency: 856,
    successRate: 99.2
  };

  const getModelIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText size={16} />;
      case 'image': return <Image size={16} />;
      case 'audio': return <Mic size={16} />;
      case 'video': return <Video size={16} />;
      case 'multimodal': return <Layers size={16} />;
      case 'code': return <Code size={16} />;
      case 'embedding': return <Database size={16} />;
      default: return <Brain size={16} />;
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'prompt': return <MessageSquare size={16} />;
      case 'transform': return <RefreshCw size={16} />;
      case 'condition': return <GitBranch size={16} />;
      case 'output': return <Download size={16} />;
      default: return <Zap size={16} />;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isGenerating) return;
    
    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsGenerating(true);
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ConversationMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'This is a simulated response. In production, this would connect to the selected AI model API.',
        model: selectedModel.id,
        tokens: 45,
        latency: 650,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsGenerating(false);
    }, 1500);
  };

  const renderPlayground = () => (
    <div className="playground-section">
      <div className="playground-main">
        <div className="conversation-area">
          <div className="conversation-header">
            <h3>Conversation</h3>
            <div className="conversation-actions">
              <button className="btn-icon small" title="Clear conversation">
                <Trash2 size={16} />
              </button>
              <button className="btn-icon small" title="Export">
                <Download size={16} />
              </button>
              <button className="btn-icon small" title="Share">
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
          
          <div className="messages-container">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? 'U' : msg.role === 'system' ? 'S' : <Brain size={18} />}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-role">
                      {msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'Assistant'}
                    </span>
                    {msg.model && (
                      <span className="message-model">{msg.model}</span>
                    )}
                    <span className="message-time">{msg.timestamp}</span>
                  </div>
                  <div className="message-text">
                    <pre>{msg.content}</pre>
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="message-meta">
                      {msg.tokens && <span>{msg.tokens} tokens</span>}
                      {msg.latency && <span>{msg.latency}ms</span>}
                      <button className="meta-btn"><Copy size={14} /> Copy</button>
                      <button className="meta-btn"><ThumbsUp size={14} /></button>
                      <button className="meta-btn"><ThumbsDown size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="message assistant generating">
                <div className="message-avatar"><Brain size={18} /></div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="input-area">
            <div className="input-tools">
              <button className="tool-btn" title="Upload file">
                <Upload size={18} />
              </button>
              <button className="tool-btn" title="Use prompt template">
                <BookOpen size={18} />
              </button>
              <button className="tool-btn" title="Add code">
                <Code size={18} />
              </button>
            </div>
            <div className="input-wrapper">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button 
                className="send-btn"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isGenerating}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="playground-sidebar">
          <div className="sidebar-section">
            <h4>Model</h4>
            <div className="model-selector">
              <div className="selected-model">
                <div className={`model-icon ${selectedModel.type}`}>
                  {getModelIcon(selectedModel.type)}
                </div>
                <div className="model-info">
                  <span className="model-name">{selectedModel.name}</span>
                  <span className="model-provider">{selectedModel.provider}</span>
                </div>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="model-stats">
              <div className="stat-row">
                <span>Context</span>
                <span>{formatNumber(selectedModel.contextWindow)} tokens</span>
              </div>
              <div className="stat-row">
                <span>Cost (input)</span>
                <span>${selectedModel.costPer1kTokens.input}/1K</span>
              </div>
              <div className="stat-row">
                <span>Latency</span>
                <span>~{selectedModel.latency}ms</span>
              </div>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h4>Parameters</h4>
            <div className="param-control">
              <div className="param-header">
                <span>Temperature</span>
                <span>{temperature}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              <div className="param-labels">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>
            <div className="param-control">
              <div className="param-header">
                <span>Max Tokens</span>
                <span>{maxTokens}</span>
              </div>
              <input 
                type="range" 
                min="256" 
                max="4096" 
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <div className="sidebar-section">
            <h4>Capabilities</h4>
            <div className="capabilities-list">
              {selectedModel.capabilities.map(cap => (
                <span key={cap} className="capability-tag">{cap}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModels = () => (
    <div className="models-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search models..." />
          </div>
          <select>
            <option value="">All Types</option>
            <option value="text">Text</option>
            <option value="multimodal">Multimodal</option>
            <option value="image">Image</option>
            <option value="audio">Audio</option>
            <option value="embedding">Embedding</option>
          </select>
          <select>
            <option value="">All Providers</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
            <option value="meta">Meta</option>
            <option value="mistral">Mistral AI</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Add Custom Model
        </button>
      </div>
      
      <div className="models-grid">
        {AI_MODELS.map(model => (
          <div key={model.id} className={`model-card ${model.recommended ? 'recommended' : ''}`}>
            <div className="model-header">
              <div className={`model-type-icon ${model.type}`}>
                {getModelIcon(model.type)}
              </div>
              {model.recommended && (
                <span className="recommended-badge">
                  <Star size={12} /> Recommended
                </span>
              )}
              <span className={`status-indicator ${model.status}`}></span>
            </div>
            
            <h4>{model.name}</h4>
            <p className="model-provider">{model.provider} • v{model.version}</p>
            
            <div className="model-specs">
              <div className="spec-item">
                <span className="spec-label">Context</span>
                <span className="spec-value">{formatNumber(model.contextWindow)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Latency</span>
                <span className="spec-value">{model.latency}ms</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Input Cost</span>
                <span className="spec-value">${model.costPer1kTokens.input}/1K</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Output Cost</span>
                <span className="spec-value">${model.costPer1kTokens.output}/1K</span>
              </div>
            </div>
            
            <div className="model-capabilities">
              {model.capabilities.slice(0, 3).map(cap => (
                <span key={cap} className="cap-tag">{cap}</span>
              ))}
              {model.capabilities.length > 3 && (
                <span className="cap-tag more">+{model.capabilities.length - 3}</span>
              )}
            </div>
            
            <div className="model-actions">
              <button className="btn-outline small">Configure</button>
              <button 
                className="btn-primary small"
                onClick={() => {
                  setSelectedModel(model);
                  setActiveTab('playground');
                }}
              >
                Use Model
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPrompts = () => (
    <div className="prompts-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search prompts..." />
          </div>
          <select>
            <option value="">All Categories</option>
            <option value="development">Development</option>
            <option value="content">Content</option>
            <option value="support">Support</option>
            <option value="analysis">Analysis</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Create Prompt
        </button>
      </div>
      
      <div className="prompts-list">
        {PROMPTS.map(prompt => (
          <div key={prompt.id} className="prompt-card">
            <div className="prompt-header">
              <div className="prompt-info">
                <h4>{prompt.name}</h4>
                <span className="prompt-category">{prompt.category}</span>
              </div>
              <div className="prompt-meta">
                <span className="usage-count">
                  <Activity size={14} /> {formatNumber(prompt.usageCount)} uses
                </span>
                <span className="rating">
                  <Star size={14} /> {prompt.rating}
                </span>
                {prompt.isPublic ? (
                  <span className="visibility public"><Globe size={14} /> Public</span>
                ) : (
                  <span className="visibility private"><Lock size={14} /> Private</span>
                )}
              </div>
            </div>
            
            <p className="prompt-description">{prompt.description}</p>
            
            <div className="prompt-variables">
              <span className="vars-label">Variables:</span>
              {prompt.variables.map(v => (
                <span key={v} className="var-tag">{`{{${v}}}`}</span>
              ))}
            </div>
            
            <div 
              className="prompt-template"
              onClick={() => setExpandedPrompt(expandedPrompt === prompt.id ? null : prompt.id)}
            >
              <div className="template-header">
                <span>Template</span>
                {expandedPrompt === prompt.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              {expandedPrompt === prompt.id && (
                <pre className="template-content">{prompt.template}</pre>
              )}
            </div>
            
            <div className="prompt-actions">
              <button className="btn-icon small"><Edit3 size={14} /></button>
              <button className="btn-icon small"><Copy size={14} /></button>
              <button className="btn-icon small"><Trash2 size={14} /></button>
              <button className="btn-primary small">Use Prompt</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPipelines = () => (
    <div className="pipelines-section">
      <div className="section-toolbar">
        <h3>AI Pipelines</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Create Pipeline
        </button>
      </div>
      
      <div className="pipelines-grid">
        {PIPELINES.map(pipeline => (
          <div key={pipeline.id} className={`pipeline-card ${pipeline.status}`}>
            <div className="pipeline-header">
              <div className="pipeline-info">
                <h4>{pipeline.name}</h4>
                <span className={`pipeline-status ${pipeline.status}`}>
                  {pipeline.status === 'active' && <Play size={12} />}
                  {pipeline.status === 'paused' && <Pause size={12} />}
                  {pipeline.status === 'draft' && <Edit3 size={12} />}
                  {pipeline.status}
                </span>
              </div>
              <button className="btn-icon small">
                <MoreHorizontal size={16} />
              </button>
            </div>
            
            <p className="pipeline-description">{pipeline.description}</p>
            
            <div className="pipeline-steps">
              {pipeline.steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div className={`step-node ${step.type}`}>
                    {getStepIcon(step.type)}
                    <span>{step.name}</span>
                  </div>
                  {idx < pipeline.steps.length - 1 && (
                    <div className="step-connector"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            <div className="pipeline-stats">
              <div className="stat">
                <Activity size={14} />
                <span>{formatNumber(pipeline.executions)} executions</span>
              </div>
              {pipeline.lastRun && (
                <div className="stat">
                  <Clock size={14} />
                  <span>Last: {pipeline.lastRun}</span>
                </div>
              )}
            </div>
            
            <div className="pipeline-actions">
              <button className="btn-outline small">Edit</button>
              {pipeline.status === 'active' ? (
                <button className="btn-outline small">Pause</button>
              ) : (
                <button className="btn-primary small">
                  <Play size={14} /> Run
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="summary-icon tokens">
            <Zap size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{formatNumber(metrics.totalTokens)}</span>
            <span className="summary-label">Total Tokens</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon cost">
            <Target size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">${metrics.totalCost.toFixed(2)}</span>
            <span className="summary-label">Total Cost</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon requests">
            <Activity size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{formatNumber(metrics.totalRequests)}</span>
            <span className="summary-label">Requests</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon latency">
            <Clock size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{metrics.avgLatency}ms</span>
            <span className="summary-label">Avg Latency</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon success">
            <CheckCircle size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">{metrics.successRate}%</span>
            <span className="summary-label">Success Rate</span>
          </div>
        </div>
      </div>
      
      <div className="analytics-charts">
        <div className="chart-card large">
          <div className="chart-header">
            <h4>Usage Over Time</h4>
            <select>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="usage-chart">
            {[45, 62, 78, 56, 89, 95, 72].map((value, idx) => (
              <div key={idx} className="usage-bar">
                <div className="bar-fill" style={{ height: `${value}%` }}></div>
                <span className="bar-label">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="chart-card">
          <div className="chart-header">
            <h4>Usage by Model</h4>
          </div>
          <div className="model-usage-list">
            {[
              { name: 'GPT-4 Turbo', percent: 42, tokens: 525000 },
              { name: 'Claude 3.5 Sonnet', percent: 28, tokens: 350000 },
              { name: 'GPT-4o', percent: 18, tokens: 225000 },
              { name: 'Gemini 1.5 Pro', percent: 8, tokens: 100000 },
              { name: 'Others', percent: 4, tokens: 50000 }
            ].map(model => (
              <div key={model.name} className="model-usage-row">
                <span className="model-name">{model.name}</span>
                <div className="usage-bar-container">
                  <div className="usage-bar-fill" style={{ width: `${model.percent}%` }}></div>
                </div>
                <span className="usage-percent">{model.percent}%</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="chart-card">
          <div className="chart-header">
            <h4>Cost by Category</h4>
          </div>
          <div className="cost-breakdown">
            {[
              { category: 'Code Analysis', cost: 45.20, percent: 29 },
              { category: 'Content Generation', cost: 38.50, percent: 25 },
              { category: 'Customer Support', cost: 32.80, percent: 21 },
              { category: 'Data Processing', cost: 25.40, percent: 16 },
              { category: 'Other', cost: 14.88, percent: 9 }
            ].map(item => (
              <div key={item.category} className="cost-row">
                <span className="category-name">{item.category}</span>
                <div className="cost-bar-container">
                  <div className="cost-bar-fill" style={{ width: `${item.percent}%` }}></div>
                </div>
                <span className="cost-value">${item.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="history-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search history..." />
          </div>
          <select>
            <option value="">All Models</option>
            {AI_MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <input type="date" />
        </div>
        <button className="btn-outline">
          <Download size={16} />
          Export
        </button>
      </div>
      
      <div className="history-list">
        {[
          { id: 'h1', model: 'GPT-4 Turbo', prompt: 'Code review for Python authentication module...', tokens: 1245, cost: 0.048, time: '10 minutes ago', status: 'success' },
          { id: 'h2', model: 'Claude 3.5 Sonnet', prompt: 'Generate API documentation for user endpoints...', tokens: 2340, cost: 0.042, time: '25 minutes ago', status: 'success' },
          { id: 'h3', model: 'GPT-4o', prompt: 'Analyze customer feedback sentiment from Q4...', tokens: 890, cost: 0.018, time: '1 hour ago', status: 'success' },
          { id: 'h4', model: 'Gemini 1.5 Pro', prompt: 'Summarize meeting transcript and extract action items...', tokens: 4560, cost: 0.057, time: '2 hours ago', status: 'success' },
          { id: 'h5', model: 'GPT-4 Turbo', prompt: 'Generate SQL query for complex reporting...', tokens: 567, cost: 0.023, time: '3 hours ago', status: 'error' }
        ].map(item => (
          <div key={item.id} className={`history-item ${item.status}`}>
            <div className="history-model">
              <Brain size={18} />
              <span>{item.model}</span>
            </div>
            <div className="history-prompt">{item.prompt}</div>
            <div className="history-stats">
              <span className="stat"><Zap size={14} /> {item.tokens} tokens</span>
              <span className="stat"><Target size={14} /> ${item.cost.toFixed(3)}</span>
              <span className="stat"><Clock size={14} /> {item.time}</span>
            </div>
            <div className="history-status">
              {item.status === 'success' ? (
                <CheckCircle size={16} className="success" />
              ) : (
                <AlertCircle size={16} className="error" />
              )}
            </div>
            <button className="btn-icon small">
              <Eye size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="ai-studio">
      <header className="ais__header">
        <div className="ais__title-section">
          <div className="ais__icon">
            <Brain size={28} />
          </div>
          <div>
            <h1>AI Studio</h1>
            <p>Multi-model AI playground and management</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <History size={16} />
            History
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
          <button className="btn-primary">
            <Sparkles size={16} />
            New Conversation
          </button>
        </div>
      </header>

      <div className="ais__stats">
        <div className="stat-card">
          <div className="stat-icon models-icon">
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{AI_MODELS.length}</span>
            <span className="stat-label">Available Models</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon prompts-icon">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{PROMPTS.length}</span>
            <span className="stat-label">Saved Prompts</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pipelines-icon">
            <GitBranch size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{PIPELINES.filter(p => p.status === 'active').length}</span>
            <span className="stat-label">Active Pipelines</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon tokens-icon">
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(metrics.totalTokens)}</span>
            <span className="stat-label">Tokens This Month</span>
          </div>
        </div>
      </div>

      <nav className="ais__tabs">
        <button 
          className={`tab-btn ${activeTab === 'playground' ? 'active' : ''}`}
          onClick={() => setActiveTab('playground')}
        >
          <Terminal size={18} />
          Playground
        </button>
        <button 
          className={`tab-btn ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          <Cpu size={18} />
          Models
          <span className="tab-badge">{AI_MODELS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          <BookOpen size={18} />
          Prompts
          <span className="tab-badge">{PROMPTS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pipelines' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipelines')}
        >
          <GitBranch size={18} />
          Pipelines
          <span className="tab-badge">{PIPELINES.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} />
          Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} />
          History
        </button>
      </nav>

      <main className="ais__content">
        {activeTab === 'playground' && renderPlayground()}
        {activeTab === 'models' && renderModels()}
        {activeTab === 'prompts' && renderPrompts()}
        {activeTab === 'pipelines' && renderPipelines()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'history' && renderHistory()}
      </main>
    </div>
  );
}
