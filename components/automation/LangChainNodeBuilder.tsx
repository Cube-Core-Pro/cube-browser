/**
 * LangChainNodeBuilder - CUBE Elite v6
 * Constructor visual de nodos LangChain para automatización con IA
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  LangChainNode,
  LangChainNodeType,
  LangChainConfig,
} from '../../types/automation-advanced';
import './LangChainNodeBuilder.css';

// ============================================================================
// INTERFACES
// ============================================================================

interface LangChainNodeBuilderProps {
  onNodeCreate: (node: LangChainNode) => void;
  onNodeUpdate: (nodeId: string, config: LangChainConfig) => void;
  selectedNode?: LangChainNode;
  position?: { x: number; y: number };
  availableModels: AIModel[];
  availableTools: CustomTool[];
  onClose: () => void;
}

interface AIModel {
  id: string;
  provider: string;
  name: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsJsonMode: boolean;
  costPer1kTokens: number;
}

interface CustomTool {
  id: string;
  name: string;
  description: string;
  schema: Record<string, unknown>;
}

interface NodeTypeDefinition {
  type: LangChainNodeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'models' | 'chains' | 'memory' | 'tools' | 'data';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const NODE_TYPES: NodeTypeDefinition[] = [
  {
    type: 'llm',
    name: 'Language Model',
    description: 'GPT-4, Claude, Gemini and more',
    icon: '🧠',
    color: '#10B981',
    category: 'models',
  },
  {
    type: 'prompt',
    name: 'Prompt Template',
    description: 'Create reusable prompts with variables',
    icon: '📝',
    color: '#6366F1',
    category: 'chains',
  },
  {
    type: 'chain',
    name: 'Chain',
    description: 'Sequential, Router, MapReduce chains',
    icon: '🔗',
    color: '#F59E0B',
    category: 'chains',
  },
  {
    type: 'memory',
    name: 'Memory',
    description: 'Conversation history and context',
    icon: '💾',
    color: '#EC4899',
    category: 'memory',
  },
  {
    type: 'retriever',
    name: 'Vector Retriever',
    description: 'Search vector stores for context',
    icon: '🔍',
    color: '#8B5CF6',
    category: 'data',
  },
  {
    type: 'agent',
    name: 'AI Agent',
    description: 'Autonomous agent with tools',
    icon: '🤖',
    color: '#EF4444',
    category: 'tools',
  },
  {
    type: 'tool',
    name: 'Custom Tool',
    description: 'Create tools for agents',
    icon: '🔧',
    color: '#14B8A6',
    category: 'tools',
  },
  {
    type: 'parser',
    name: 'Output Parser',
    description: 'Parse LLM output to structured data',
    icon: '📊',
    color: '#F97316',
    category: 'data',
  },
  {
    type: 'embeddings',
    name: 'Embeddings',
    description: 'Convert text to vectors',
    icon: '🎯',
    color: '#06B6D4',
    category: 'data',
  },
  {
    type: 'splitter',
    name: 'Text Splitter',
    description: 'Split documents into chunks',
    icon: '✂️',
    color: '#84CC16',
    category: 'data',
  },
];

const DEFAULT_MODELS: AIModel[] = [
  { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o', maxTokens: 128000, supportsStreaming: true, supportsJsonMode: true, costPer1kTokens: 0.005 },
  { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini', maxTokens: 128000, supportsStreaming: true, supportsJsonMode: true, costPer1kTokens: 0.00015 },
  { id: 'gpt-4-turbo', provider: 'openai', name: 'GPT-4 Turbo', maxTokens: 128000, supportsStreaming: true, supportsJsonMode: true, costPer1kTokens: 0.01 },
  { id: 'claude-3-opus', provider: 'anthropic', name: 'Claude 3 Opus', maxTokens: 200000, supportsStreaming: true, supportsJsonMode: false, costPer1kTokens: 0.015 },
  { id: 'claude-3-sonnet', provider: 'anthropic', name: 'Claude 3.5 Sonnet', maxTokens: 200000, supportsStreaming: true, supportsJsonMode: false, costPer1kTokens: 0.003 },
  { id: 'gemini-pro', provider: 'google', name: 'Gemini Pro', maxTokens: 32000, supportsStreaming: true, supportsJsonMode: true, costPer1kTokens: 0.00025 },
  { id: 'llama-3-70b', provider: 'ollama', name: 'Llama 3 70B', maxTokens: 8192, supportsStreaming: true, supportsJsonMode: false, costPer1kTokens: 0 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const LangChainNodeBuilder: React.FC<LangChainNodeBuilderProps> = ({
  onNodeCreate,
  onNodeUpdate,
  selectedNode,
  position = { x: 100, y: 100 },
  availableModels = DEFAULT_MODELS,
  availableTools = [],
  onClose,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'select' | 'configure'>('select');
  const [selectedType, setSelectedType] = useState<LangChainNodeType | null>(
    selectedNode?.subType || null
  );
  const [config, setConfig] = useState<LangChainConfig>(
    selectedNode?.data.config || {}
  );
  const [nodeName, setNodeName] = useState(selectedNode?.data.label || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Computed
  const filteredNodeTypes = useMemo(() => {
    if (!searchQuery) return NODE_TYPES;
    const query = searchQuery.toLowerCase();
    return NODE_TYPES.filter(
      (nt) =>
        nt.name.toLowerCase().includes(query) ||
        nt.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const groupedNodeTypes = useMemo(() => {
    const groups: Record<string, NodeTypeDefinition[]> = {
      models: [],
      chains: [],
      memory: [],
      tools: [],
      data: [],
    };
    filteredNodeTypes.forEach((nt) => {
      groups[nt.category].push(nt);
    });
    return groups;
  }, [filteredNodeTypes]);

  // Handlers
  const handleTypeSelect = useCallback((type: LangChainNodeType) => {
    setSelectedType(type);
    const nodeType = NODE_TYPES.find((nt) => nt.type === type);
    setNodeName(nodeType?.name || type);
    setActiveTab('configure');
    
    // Set default config based on type
    const defaultConfig: LangChainConfig = {};
    switch (type) {
      case 'llm':
        defaultConfig.llm = {
          provider: 'openai',
          model: 'gpt-4o',
          temperature: 0.7,
          maxTokens: 4096,
          streaming: true,
        };
        break;
      case 'prompt':
        defaultConfig.prompt = {
          template: 'You are a helpful assistant. {input}',
          inputVariables: ['input'],
        };
        break;
      case 'chain':
        defaultConfig.chain = {
          type: 'sequential',
          steps: [],
        };
        break;
      case 'memory':
        defaultConfig.memory = {
          type: 'buffer',
          k: 10,
          returnMessages: true,
        };
        break;
      case 'retriever':
        defaultConfig.retriever = {
          vectorStore: 'local',
          searchType: 'similarity',
          k: 5,
        };
        break;
      case 'agent':
        defaultConfig.agent = {
          type: 'react',
          tools: [],
          maxIterations: 10,
          returnIntermediateSteps: true,
        };
        break;
      case 'tool':
        defaultConfig.tool = {
          name: 'custom_tool',
          description: 'A custom tool',
          function: '// Your JavaScript code here\nreturn input;',
        };
        break;
      case 'parser':
        defaultConfig.parser = {
          type: 'json',
        };
        break;
      case 'embeddings':
        defaultConfig.embeddings = {
          provider: 'openai',
          model: 'text-embedding-3-small',
          dimensions: 1536,
        };
        break;
      case 'splitter':
        defaultConfig.splitter = {
          type: 'recursive',
          chunkSize: 1000,
          chunkOverlap: 200,
        };
        break;
    }
    setConfig(defaultConfig);
  }, []);

  const handleConfigChange = useCallback(
    <K extends keyof LangChainConfig>(
      key: K,
      value: LangChainConfig[K]
    ) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!selectedType) return;

    const node: LangChainNode = {
      id: selectedNode?.id || `langchain-${Date.now()}`,
      type: 'langchain',
      subType: selectedType,
      position: selectedNode?.position || position,
      data: {
        label: nodeName,
        config,
        status: 'idle',
      },
    };

    if (selectedNode) {
      onNodeUpdate(node.id, config);
    } else {
      onNodeCreate(node);
    }
    onClose();
  }, [selectedType, nodeName, config, position, selectedNode, onNodeCreate, onNodeUpdate, onClose]);

  // Render configuration panel based on type
  const renderConfigPanel = () => {
    switch (selectedType) {
      case 'llm':
        return renderLLMConfig();
      case 'prompt':
        return renderPromptConfig();
      case 'chain':
        return renderChainConfig();
      case 'memory':
        return renderMemoryConfig();
      case 'retriever':
        return renderRetrieverConfig();
      case 'agent':
        return renderAgentConfig();
      case 'tool':
        return renderToolConfig();
      case 'parser':
        return renderParserConfig();
      case 'embeddings':
        return renderEmbeddingsConfig();
      case 'splitter':
        return renderSplitterConfig();
      default:
        return null;
    }
  };

  const renderLLMConfig = () => (
    <div className="config-section">
      <h4>Language Model Configuration</h4>
      
      <div className="config-field">
        <label>Provider</label>
        <select
          value={config.llm?.provider || 'openai'}
          onChange={(e) =>
            handleConfigChange('llm', {
              ...config.llm,
              provider: e.target.value as 'openai' | 'anthropic' | 'google' | 'azure' | 'ollama' | 'custom',
            })
          }
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="google">Google</option>
          <option value="azure">Azure OpenAI</option>
          <option value="ollama">Ollama (Local)</option>
          <option value="custom">Custom API</option>
        </select>
      </div>

      <div className="config-field">
        <label>Model</label>
        <select
          value={config.llm?.model || 'gpt-4o'}
          onChange={(e) =>
            handleConfigChange('llm', { ...config.llm, model: e.target.value })
          }
        >
          {availableModels
            .filter(
              (m) =>
                m.provider === config.llm?.provider ||
                config.llm?.provider === 'custom'
            )
            .map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.maxTokens.toLocaleString()} tokens)
              </option>
            ))}
        </select>
      </div>

      <div className="config-field">
        <label>Temperature: {config.llm?.temperature || 0.7}</label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={config.llm?.temperature || 0.7}
          onChange={(e) =>
            handleConfigChange('llm', {
              ...config.llm,
              temperature: parseFloat(e.target.value),
            })
          }
        />
        <span className="hint">0 = Deterministic, 2 = Creative</span>
      </div>

      <div className="config-field">
        <label>Max Tokens</label>
        <input
          type="number"
          value={config.llm?.maxTokens || 4096}
          onChange={(e) =>
            handleConfigChange('llm', {
              ...config.llm,
              maxTokens: parseInt(e.target.value, 10),
            })
          }
        />
      </div>

      <div className="config-field">
        <label>System Prompt</label>
        <textarea
          value={config.llm?.systemPrompt || ''}
          onChange={(e) =>
            handleConfigChange('llm', {
              ...config.llm,
              systemPrompt: e.target.value,
            })
          }
          placeholder="You are a helpful assistant..."
          rows={4}
        />
      </div>

      <div className="config-field checkbox">
        <label>
          <input
            type="checkbox"
            checked={config.llm?.streaming || false}
            onChange={(e) =>
              handleConfigChange('llm', {
                ...config.llm,
                streaming: e.target.checked,
              })
            }
          />
          Enable Streaming
        </label>
      </div>

      <div className="config-row">
        <div className="config-field">
          <label>Top P</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={config.llm?.topP || 1}
            onChange={(e) =>
              handleConfigChange('llm', {
                ...config.llm,
                topP: parseFloat(e.target.value),
              })
            }
          />
        </div>
        <div className="config-field">
          <label>Frequency Penalty</label>
          <input
            type="number"
            min="-2"
            max="2"
            step="0.1"
            value={config.llm?.frequencyPenalty || 0}
            onChange={(e) =>
              handleConfigChange('llm', {
                ...config.llm,
                frequencyPenalty: parseFloat(e.target.value),
              })
            }
          />
        </div>
      </div>
    </div>
  );

  const renderPromptConfig = () => (
    <div className="config-section">
      <h4>Prompt Template Configuration</h4>
      
      <div className="config-field">
        <label>Template</label>
        <textarea
          value={config.prompt?.template || ''}
          onChange={(e) =>
            handleConfigChange('prompt', {
              ...config.prompt,
              template: e.target.value,
              inputVariables: extractVariables(e.target.value),
            })
          }
          placeholder="Enter your prompt template. Use {variable_name} for dynamic values."
          rows={8}
          className="code-textarea"
        />
        <span className="hint">
          Use curly braces for variables: {'{input}'}, {'{context}'}, {'{query}'}
        </span>
      </div>

      <div className="config-field">
        <label>Detected Variables</label>
        <div className="variable-tags">
          {config.prompt?.inputVariables?.map((v) => (
            <span key={v} className="variable-tag">
              {'{'}
              {v}
              {'}'}
            </span>
          )) || <span className="no-vars">No variables detected</span>}
        </div>
      </div>

      <div className="config-field">
        <label>Output Parser</label>
        <select
          value={config.prompt?.outputParser || 'none'}
          onChange={(e) =>
            handleConfigChange('prompt', {
              ...config.prompt,
              outputParser: e.target.value as 'json' | 'list' | 'markdown' | 'structured' | undefined,
            })
          }
        >
          <option value="">None (Raw Text)</option>
          <option value="json">JSON</option>
          <option value="list">List</option>
          <option value="markdown">Markdown</option>
          <option value="structured">Structured</option>
        </select>
      </div>
    </div>
  );

  const renderChainConfig = () => (
    <div className="config-section">
      <h4>Chain Configuration</h4>
      
      <div className="config-field">
        <label>Chain Type</label>
        <select
          value={config.chain?.type || 'sequential'}
          onChange={(e) =>
            handleConfigChange('chain', {
              ...config.chain,
              type: e.target.value as 'sequential' | 'router' | 'map_reduce' | 'refine' | 'stuff',
            })
          }
        >
          <option value="sequential">Sequential - Steps run in order</option>
          <option value="router">Router - Dynamic routing based on input</option>
          <option value="map_reduce">Map-Reduce - Process in parallel, combine</option>
          <option value="refine">Refine - Iteratively improve output</option>
          <option value="stuff">Stuff - Combine all context into one call</option>
        </select>
      </div>

      {config.chain?.type === 'router' && (
        <div className="config-field">
          <label>Routing Function</label>
          <textarea
            value={config.chain?.routingFunction || ''}
            onChange={(e) =>
              handleConfigChange('chain', {
                ...config.chain,
                routingFunction: e.target.value,
              })
            }
            placeholder="// Return the name of the destination chain\nif (input.includes('code')) return 'code_chain';\nreturn 'default_chain';"
            rows={6}
            className="code-textarea"
          />
        </div>
      )}

      <div className="config-info">
        <p>
          <strong>Sequential:</strong> Each step passes output to the next
        </p>
        <p>
          <strong>Router:</strong> Dynamically choose which chain to use
        </p>
        <p>
          <strong>Map-Reduce:</strong> Process documents in parallel, then combine
        </p>
        <p>
          <strong>Refine:</strong> Iteratively refine answer with more context
        </p>
        <p>
          <strong>Stuff:</strong> Put all documents into a single prompt
        </p>
      </div>
    </div>
  );

  const renderMemoryConfig = () => (
    <div className="config-section">
      <h4>Memory Configuration</h4>
      
      <div className="config-field">
        <label>Memory Type</label>
        <select
          value={config.memory?.type || 'buffer'}
          onChange={(e) =>
            handleConfigChange('memory', {
              ...config.memory,
              type: e.target.value as 'buffer' | 'summary' | 'entity' | 'conversation' | 'vector',
            })
          }
        >
          <option value="buffer">Buffer - Keep last K messages</option>
          <option value="summary">Summary - Summarize conversation</option>
          <option value="entity">Entity - Track entities mentioned</option>
          <option value="conversation">Conversation - Full history with tokens limit</option>
          <option value="vector">Vector - Semantic search over history</option>
        </select>
      </div>

      <div className="config-field">
        <label>Messages to Keep (K)</label>
        <input
          type="number"
          min="1"
          max="100"
          value={config.memory?.k || 10}
          onChange={(e) =>
            handleConfigChange('memory', {
              ...config.memory,
              k: parseInt(e.target.value, 10),
            })
          }
        />
      </div>

      <div className="config-row">
        <div className="config-field">
          <label>Human Prefix</label>
          <input
            type="text"
            value={config.memory?.humanPrefix || 'Human'}
            onChange={(e) =>
              handleConfigChange('memory', {
                ...config.memory,
                humanPrefix: e.target.value,
              })
            }
          />
        </div>
        <div className="config-field">
          <label>AI Prefix</label>
          <input
            type="text"
            value={config.memory?.aiPrefix || 'AI'}
            onChange={(e) =>
              handleConfigChange('memory', {
                ...config.memory,
                aiPrefix: e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="config-field checkbox">
        <label>
          <input
            type="checkbox"
            checked={config.memory?.returnMessages || false}
            onChange={(e) =>
              handleConfigChange('memory', {
                ...config.memory,
                returnMessages: e.target.checked,
              })
            }
          />
          Return Messages (instead of string)
        </label>
      </div>
    </div>
  );

  const renderRetrieverConfig = () => (
    <div className="config-section">
      <h4>Vector Retriever Configuration</h4>
      
      <div className="config-field">
        <label>Vector Store</label>
        <select
          value={config.retriever?.vectorStore || 'local'}
          onChange={(e) =>
            handleConfigChange('retriever', {
              ...config.retriever,
              vectorStore: e.target.value as 'pinecone' | 'chroma' | 'weaviate' | 'supabase' | 'local',
            })
          }
        >
          <option value="local">Local (In-Memory)</option>
          <option value="chroma">Chroma</option>
          <option value="pinecone">Pinecone</option>
          <option value="weaviate">Weaviate</option>
          <option value="supabase">Supabase pgvector</option>
        </select>
      </div>

      <div className="config-field">
        <label>Search Type</label>
        <select
          value={config.retriever?.searchType || 'similarity'}
          onChange={(e) =>
            handleConfigChange('retriever', {
              ...config.retriever,
              searchType: e.target.value as 'similarity' | 'mmr' | 'threshold',
            })
          }
        >
          <option value="similarity">Similarity - Closest vectors</option>
          <option value="mmr">MMR - Diversity + Relevance</option>
          <option value="threshold">Threshold - Minimum score</option>
        </select>
      </div>

      <div className="config-field">
        <label>Results to Return (K)</label>
        <input
          type="number"
          min="1"
          max="50"
          value={config.retriever?.k || 5}
          onChange={(e) =>
            handleConfigChange('retriever', {
              ...config.retriever,
              k: parseInt(e.target.value, 10),
            })
          }
        />
      </div>

      {config.retriever?.searchType === 'threshold' && (
        <div className="config-field">
          <label>Score Threshold: {config.retriever?.scoreThreshold || 0.5}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.retriever?.scoreThreshold || 0.5}
            onChange={(e) =>
              handleConfigChange('retriever', {
                ...config.retriever,
                scoreThreshold: parseFloat(e.target.value),
              })
            }
          />
        </div>
      )}
    </div>
  );

  const renderAgentConfig = () => (
    <div className="config-section">
      <h4>AI Agent Configuration</h4>
      
      <div className="config-field">
        <label>Agent Type</label>
        <select
          value={config.agent?.type || 'react'}
          onChange={(e) =>
            handleConfigChange('agent', {
              ...config.agent,
              type: e.target.value as 'zero_shot' | 'react' | 'structured' | 'openai_functions' | 'plan_execute',
            })
          }
        >
          <option value="zero_shot">Zero-Shot - Simple reasoning</option>
          <option value="react">ReAct - Reasoning + Acting</option>
          <option value="structured">Structured Chat - For complex tools</option>
          <option value="openai_functions">OpenAI Functions - Native function calling</option>
          <option value="plan_execute">Plan-Execute - Plan then execute</option>
        </select>
      </div>

      <div className="config-field">
        <label>Available Tools</label>
        <div className="tools-list">
          {availableTools.length === 0 ? (
            <p className="no-tools">No tools available. Create a Tool node first.</p>
          ) : (
            availableTools.map((tool) => (
              <label key={tool.id} className="tool-checkbox">
                <input
                  type="checkbox"
                  checked={config.agent?.tools?.includes(tool.id) || false}
                  onChange={(e) => {
                    const tools = config.agent?.tools || [];
                    if (e.target.checked) {
                      handleConfigChange('agent', {
                        ...config.agent,
                        tools: [...tools, tool.id],
                      });
                    } else {
                      handleConfigChange('agent', {
                        ...config.agent,
                        tools: tools.filter((t) => t !== tool.id),
                      });
                    }
                  }}
                />
                <span className="tool-name">{tool.name}</span>
                <span className="tool-desc">{tool.description}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="config-field">
        <label>Max Iterations</label>
        <input
          type="number"
          min="1"
          max="50"
          value={config.agent?.maxIterations || 10}
          onChange={(e) =>
            handleConfigChange('agent', {
              ...config.agent,
              maxIterations: parseInt(e.target.value, 10),
            })
          }
        />
        <span className="hint">Prevent infinite loops</span>
      </div>

      <div className="config-field checkbox">
        <label>
          <input
            type="checkbox"
            checked={config.agent?.returnIntermediateSteps || false}
            onChange={(e) =>
              handleConfigChange('agent', {
                ...config.agent,
                returnIntermediateSteps: e.target.checked,
              })
            }
          />
          Return Intermediate Steps (for debugging)
        </label>
      </div>
    </div>
  );

  const renderToolConfig = () => (
    <div className="config-section">
      <h4>Custom Tool Configuration</h4>
      
      <div className="config-field">
        <label>Tool Name</label>
        <input
          type="text"
          value={config.tool?.name || ''}
          onChange={(e) =>
            handleConfigChange('tool', {
              ...config.tool,
              name: e.target.value.replace(/\s+/g, '_').toLowerCase(),
            })
          }
          placeholder="my_custom_tool"
        />
        <span className="hint">Use snake_case, no spaces</span>
      </div>

      <div className="config-field">
        <label>Description</label>
        <textarea
          value={config.tool?.description || ''}
          onChange={(e) =>
            handleConfigChange('tool', {
              ...config.tool,
              description: e.target.value,
            })
          }
          placeholder="Describe what this tool does. The AI will use this to decide when to call it."
          rows={3}
        />
      </div>

      <div className="config-field">
        <label>Function Code (JavaScript)</label>
        <textarea
          value={config.tool?.function || ''}
          onChange={(e) =>
            handleConfigChange('tool', {
              ...config.tool,
              function: e.target.value,
            })
          }
          placeholder={`// Input is available as 'input' variable
// Return the result

async function run(input) {
  // Your code here
  const result = await fetch('https://api.example.com/data');
  return await result.json();
}

return run(input);`}
          rows={12}
          className="code-textarea"
        />
      </div>
    </div>
  );

  const renderParserConfig = () => (
    <div className="config-section">
      <h4>Output Parser Configuration</h4>
      
      <div className="config-field">
        <label>Parser Type</label>
        <select
          value={config.parser?.type || 'json'}
          onChange={(e) =>
            handleConfigChange('parser', {
              ...config.parser,
              type: e.target.value as 'json' | 'list' | 'regex' | 'structured' | 'enum',
            })
          }
        >
          <option value="json">JSON - Parse as JSON object</option>
          <option value="list">List - Parse as array/list</option>
          <option value="regex">Regex - Extract with pattern</option>
          <option value="structured">Structured - Pydantic-style schema</option>
          <option value="enum">Enum - One of predefined values</option>
        </select>
      </div>

      {config.parser?.type === 'regex' && (
        <div className="config-field">
          <label>Regex Pattern</label>
          <input
            type="text"
            value={config.parser?.regex || ''}
            onChange={(e) =>
              handleConfigChange('parser', {
                ...config.parser,
                regex: e.target.value,
              })
            }
            placeholder="e.g., /answer:\s*(.+)/i"
          />
        </div>
      )}

      {config.parser?.type === 'enum' && (
        <div className="config-field">
          <label>Allowed Values (comma-separated)</label>
          <input
            type="text"
            value={config.parser?.enumValues?.join(', ') || ''}
            onChange={(e) =>
              handleConfigChange('parser', {
                ...config.parser,
                enumValues: e.target.value.split(',').map((v) => v.trim()),
              })
            }
            placeholder="yes, no, maybe"
          />
        </div>
      )}

      {config.parser?.type === 'structured' && (
        <div className="config-field">
          <label>Schema (JSON)</label>
          <textarea
            value={JSON.stringify(config.parser?.schema || {}, null, 2)}
            onChange={(e) => {
              try {
                const schema = JSON.parse(e.target.value);
                handleConfigChange('parser', {
                  ...config.parser,
                  schema,
                });
              } catch {
                // Invalid JSON, ignore
              }
            }}
            rows={8}
            className="code-textarea"
            placeholder={`{
  "name": { "type": "string", "description": "The name" },
  "age": { "type": "number", "description": "Age in years" }
}`}
          />
        </div>
      )}
    </div>
  );

  const renderEmbeddingsConfig = () => (
    <div className="config-section">
      <h4>Text Embeddings Configuration</h4>
      
      <div className="config-field">
        <label>Provider</label>
        <select
          value={config.embeddings?.provider || 'openai'}
          onChange={(e) =>
            handleConfigChange('embeddings', {
              ...config.embeddings,
              provider: e.target.value as 'openai' | 'cohere' | 'huggingface' | 'local',
            })
          }
        >
          <option value="openai">OpenAI</option>
          <option value="cohere">Cohere</option>
          <option value="huggingface">HuggingFace</option>
          <option value="local">Local Model</option>
        </select>
      </div>

      <div className="config-field">
        <label>Model</label>
        <select
          value={config.embeddings?.model || 'text-embedding-3-small'}
          onChange={(e) =>
            handleConfigChange('embeddings', {
              ...config.embeddings,
              model: e.target.value,
            })
          }
        >
          {config.embeddings?.provider === 'openai' && (
            <>
              <option value="text-embedding-3-small">text-embedding-3-small (1536d)</option>
              <option value="text-embedding-3-large">text-embedding-3-large (3072d)</option>
              <option value="text-embedding-ada-002">text-embedding-ada-002 (1536d)</option>
            </>
          )}
          {config.embeddings?.provider === 'cohere' && (
            <>
              <option value="embed-english-v3.0">embed-english-v3.0</option>
              <option value="embed-multilingual-v3.0">embed-multilingual-v3.0</option>
            </>
          )}
          {config.embeddings?.provider === 'huggingface' && (
            <option value="sentence-transformers/all-MiniLM-L6-v2">all-MiniLM-L6-v2</option>
          )}
          {config.embeddings?.provider === 'local' && (
            <option value="custom">Custom Model</option>
          )}
        </select>
      </div>

      <div className="config-field">
        <label>Dimensions (optional)</label>
        <input
          type="number"
          value={config.embeddings?.dimensions || ''}
          onChange={(e) =>
            handleConfigChange('embeddings', {
              ...config.embeddings,
              dimensions: parseInt(e.target.value, 10) || undefined,
            })
          }
          placeholder="Auto-detect"
        />
        <span className="hint">Some models support dimension reduction</span>
      </div>
    </div>
  );

  const renderSplitterConfig = () => (
    <div className="config-section">
      <h4>Text Splitter Configuration</h4>
      
      <div className="config-field">
        <label>Splitter Type</label>
        <select
          value={config.splitter?.type || 'recursive'}
          onChange={(e) =>
            handleConfigChange('splitter', {
              ...config.splitter,
              type: e.target.value as 'character' | 'token' | 'recursive' | 'markdown' | 'code',
            })
          }
        >
          <option value="character">Character - Split by character count</option>
          <option value="token">Token - Split by token count</option>
          <option value="recursive">Recursive - Smart paragraph splitting</option>
          <option value="markdown">Markdown - Respect markdown structure</option>
          <option value="code">Code - Respect code structure</option>
        </select>
      </div>

      <div className="config-row">
        <div className="config-field">
          <label>Chunk Size</label>
          <input
            type="number"
            min="100"
            max="10000"
            value={config.splitter?.chunkSize || 1000}
            onChange={(e) =>
              handleConfigChange('splitter', {
                ...config.splitter,
                chunkSize: parseInt(e.target.value, 10),
              })
            }
          />
        </div>
        <div className="config-field">
          <label>Chunk Overlap</label>
          <input
            type="number"
            min="0"
            max="1000"
            value={config.splitter?.chunkOverlap || 200}
            onChange={(e) =>
              handleConfigChange('splitter', {
                ...config.splitter,
                chunkOverlap: parseInt(e.target.value, 10),
              })
            }
          />
        </div>
      </div>

      {config.splitter?.type === 'code' && (
        <div className="config-field">
          <label>Programming Language</label>
          <select
            value={config.splitter?.language || 'javascript'}
            onChange={(e) =>
              handleConfigChange('splitter', {
                ...config.splitter,
                language: e.target.value,
              })
            }
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
          </select>
        </div>
      )}
    </div>
  );

  // Helper function to extract variables from template
  const extractVariables = (template: string): string[] => {
    const matches = template.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.slice(1, -1)))];
  };

  return (
    <div className="langchain-node-builder">
      <div className="builder-header">
        <h3>
          {selectedNode ? 'Edit' : 'Add'} LangChain Node
        </h3>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="builder-tabs">
        <button
          className={`tab ${activeTab === 'select' ? 'active' : ''}`}
          onClick={() => setActiveTab('select')}
        >
          Select Type
        </button>
        <button
          className={`tab ${activeTab === 'configure' ? 'active' : ''}`}
          onClick={() => setActiveTab('configure')}
          disabled={!selectedType}
        >
          Configure
        </button>
      </div>

      <div className="builder-content">
        {activeTab === 'select' && (
          <div className="type-selection">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search node types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {Object.entries(groupedNodeTypes).map(([category, types]) =>
              types.length > 0 ? (
                <div key={category} className="category-group">
                  <h4 className="category-title">{category}</h4>
                  <div className="type-grid">
                    {types.map((nodeType) => (
                      <button
                        key={nodeType.type}
                        className={`type-card ${
                          selectedType === nodeType.type ? 'selected' : ''
                        }`}
                        onClick={() => handleTypeSelect(nodeType.type)}
                        style={{ borderColor: nodeType.color }}
                      >
                        <span className="type-icon">{nodeType.icon}</span>
                        <span className="type-name">{nodeType.name}</span>
                        <span className="type-desc">{nodeType.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}

        {activeTab === 'configure' && selectedType && (
          <div className="configuration">
            <div className="config-field">
              <label>Node Name</label>
              <input
                type="text"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                placeholder="Enter a name for this node"
              />
            </div>

            {renderConfigPanel()}
          </div>
        )}
      </div>

      <div className="builder-footer">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={!selectedType || !nodeName}
        >
          {selectedNode ? 'Update Node' : 'Add Node'}
        </button>
      </div>
    </div>
  );
};

export default LangChainNodeBuilder;
