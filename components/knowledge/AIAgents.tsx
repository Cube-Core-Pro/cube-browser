"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AIAgents');

import React, { useState, useCallback, useMemo as _useMemo, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea as _Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar as _Avatar, AvatarFallback as _AvatarFallback, AvatarImage as _AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Bot,
  Plus,
  Play,
  Pause,
  Square,
  RefreshCcw,
  Settings,
  Sparkles,
  Send,
  MessageSquare,
  FileText,
  Search,
  Database as _Database,
  PenTool,
  BarChart3,
  Brain,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle as _AlertTriangle,
  Loader2,
  MoreVertical as _MoreVertical,
  Edit2 as _Edit2,
  Trash2 as _Trash2,
  Copy as _Copy,
  Download as _Download,
} from 'lucide-react';
import {
  AIAgent,
  AgentTask,
  AgentConversation as _AgentConversation,
  AIAgentsConfig,
  AgentType,
  AgentStatus,
} from '@/types/knowledge-management';
import './AIAgents.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendAIAgent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  capabilities: string[];
  model: string;
  isActive: boolean;
  createdAt: number;
  usageCount: number;
  lastUsed: number | null;
}

interface BackendAIAgentsConfig {
  agents: BackendAIAgent[];
}

const toFrontendAgent = (backend: BackendAIAgent): AIAgent => ({
  id: backend.id,
  name: backend.name,
  type: 'assistant' as AgentType,
  description: backend.description,
  model: backend.model,
  systemPrompt: '',
  capabilities: backend.capabilities,
  status: backend.isActive ? 'working' as AgentStatus : 'idle' as AgentStatus,
  tasksCompleted: backend.usageCount,
  tokensUsed: backend.usageCount * 1000,
  createdAt: new Date(backend.createdAt * 1000),
  lastActiveAt: backend.lastUsed ? new Date(backend.lastUsed * 1000) : new Date(),
});

// Static tasks data (backend for tasks not yet implemented)
const staticTasks: AgentTask[] = [
  {
    id: 'task-1',
    agentId: 'agent-1',
    title: 'Research market trends',
    description: 'Analyze Q1 2025 market trends',
    type: 'research',
    priority: 'high',
    status: 'working',
    input: 'Research current AI/ML market trends for Q1 2025',
    progress: 65,
    startedAt: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: 'task-2',
    agentId: 'agent-2',
    title: 'Write product description',
    description: 'Create compelling copy for new feature',
    type: 'write',
    priority: 'medium',
    status: 'completed',
    input: 'Write a product description for AI agents feature',
    output: 'Introducing AI Agents - your intelligent automation partners...',
    progress: 100,
    startedAt: new Date(Date.now() - 30 * 60 * 1000),
    completedAt: new Date(Date.now() - 20 * 60 * 1000),
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getAgentIcon = (type: AgentType) => {
  switch (type) {
    case 'research':
      return Search;
    case 'writer':
      return PenTool;
    case 'analyst':
      return BarChart3;
    case 'assistant':
      return Bot;
    default:
      return Brain;
  }
};

const getStatusColor = (status: AgentStatus): string => {
  switch (status) {
    case 'working':
      return '#3b82f6';
    case 'completed':
      return '#22c55e';
    case 'paused':
      return '#f59e0b';
    case 'error':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const getStatusIcon = (status: AgentStatus) => {
  switch (status) {
    case 'working':
      return Loader2;
    case 'completed':
      return CheckCircle2;
    case 'paused':
      return Pause;
    case 'error':
      return XCircle;
    default:
      return Clock;
  }
};

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AgentCardProps {
  agent: AIAgent;
  onSelect: (agent: AIAgent) => void;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => void;
}

function AgentCard({ agent, onSelect, onStart, onPause, onStop }: AgentCardProps) {
  const AgentIcon = getAgentIcon(agent.type);
  const StatusIcon = getStatusIcon(agent.status);
  
  return (
    <div 
      className={`agent-card ${agent.status}`}
      onClick={() => onSelect(agent)}
    >
      <div className="agent-header">
        <div className="agent-avatar">
          <AgentIcon className="h-5 w-5" />
        </div>
        <div className="agent-info">
          <span className="agent-name">{agent.name}</span>
          <Badge variant="secondary" className="text-xs">
            {agent.type}
          </Badge>
        </div>
        <div 
          className="agent-status"
          style={{ 
            backgroundColor: `${getStatusColor(agent.status)}15`,
            color: getStatusColor(agent.status),
          }}
        >
          <StatusIcon className={`h-3 w-3 ${agent.status === 'working' ? 'animate-spin' : ''}`} />
          <span>{agent.status}</span>
        </div>
      </div>
      
      <p className="agent-description">{agent.description}</p>
      
      {agent.currentTask && agent.status === 'working' && (
        <div className="agent-task">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium">{agent.currentTask.title}</span>
            <span>{agent.currentTask.progress}%</span>
          </div>
          <Progress value={agent.currentTask.progress} className="h-1" />
        </div>
      )}
      
      <div className="agent-stats">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          {agent.tasksCompleted} tasks
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          {formatTokens(agent.tokensUsed)} tokens
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatTimeAgo(agent.lastActiveAt)}
        </span>
      </div>
      
      <div className="agent-actions" onClick={(e) => e.stopPropagation()}>
        {agent.status === 'idle' && (
          <Button size="sm" onClick={() => onStart(agent.id)}>
            <Play className="h-4 w-4 mr-1" />
            Start Task
          </Button>
        )}
        {agent.status === 'working' && (
          <>
            <Button size="sm" variant="outline" onClick={() => onPause(agent.id)}>
              <Pause className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onStop(agent.id)}>
              <Square className="h-4 w-4" />
            </Button>
          </>
        )}
        {agent.status === 'paused' && (
          <Button size="sm" onClick={() => onStart(agent.id)}>
            <Play className="h-4 w-4 mr-1" />
            Resume
          </Button>
        )}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: AgentTask;
  agentName: string;
  onView: (task: AgentTask) => void;
}

function TaskCard({ task, agentName, onView }: TaskCardProps) {
  const StatusIcon = getStatusIcon(task.status);
  
  return (
    <div className="task-card" onClick={() => onView(task)}>
      <div className="task-header">
        <span className="font-medium">{task.title}</span>
        <Badge 
          variant="secondary"
          style={{
            backgroundColor: `${getStatusColor(task.status)}15`,
            color: getStatusColor(task.status),
          }}
        >
          <StatusIcon className={`h-3 w-3 mr-1 ${task.status === 'working' ? 'animate-spin' : ''}`} />
          {task.status}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{task.description}</p>
      <div className="task-meta">
        <span className="text-xs text-muted-foreground">
          <Bot className="h-3 w-3 inline mr-1" />
          {agentName}
        </span>
        {task.status === 'working' && (
          <div className="flex items-center gap-2">
            <Progress value={task.progress} className="w-20 h-1" />
            <span className="text-xs">{task.progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface AIAgentsProps {
  onClose?: () => void;
}

export function AIAgents({ onClose: _onClose }: AIAgentsProps) {
  const [config, setConfig] = useState<AIAgentsConfig>({
    enabled: true,
    maxConcurrentTasks: 3,
    defaultModel: 'gpt-4',
    autoSaveOutputs: true,
    enableStreaming: true,
    contextWindow: 8000,
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 90000,
    },
  });
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, _setTasks] = useState<AgentTask[]>(staticTasks);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('agents');
  const { toast } = useToast();

  // Fetch agents from backend
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const config = await invoke<BackendAIAgentsConfig>('get_ai_agents_config');
        setAgents(config.agents.map(toFrontendAgent));
      } catch (err) {
        log.error('Failed to fetch AI agents:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const activeAgents = agents.filter(a => a.status === 'working');
  const totalTokens = agents.reduce((acc, a) => acc + a.tokensUsed, 0);
  const totalTasks = agents.reduce((acc, a) => acc + a.tasksCompleted, 0);

  const handleStartAgent = useCallback((id: string) => {
    setAgents(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'working' as AgentStatus, lastActiveAt: new Date() } : a
    ));
    toast({
      title: 'Agent Started',
      description: 'Task execution in progress',
    });
  }, [toast]);

  const handlePauseAgent = useCallback((id: string) => {
    setAgents(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'paused' as AgentStatus } : a
    ));
    toast({
      title: 'Agent Paused',
    });
  }, [toast]);

  const handleStopAgent = useCallback((id: string) => {
    setAgents(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'idle' as AgentStatus, currentTask: undefined } : a
    ));
    toast({
      title: 'Agent Stopped',
    });
  }, [toast]);

  const handleSelectAgent = useCallback((agent: AIAgent) => {
    setSelectedAgent(agent);
    setActiveTab('chat');
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || !selectedAgent) return;
    
    toast({
      title: 'Message Sent',
      description: `Task assigned to ${selectedAgent.name}`,
    });
    setChatInput('');
  }, [chatInput, selectedAgent, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="ai-agents">
      {/* Header */}
      <div className="agents-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Bot className="h-6 w-6" />
            <Sparkles className="sparkle-icon" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Agents</h2>
            <p className="text-sm text-muted-foreground">
              Autonomous AI assistants for knowledge work
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="agents-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{agents.length}</span>
            <span className="stat-label">Total Agents</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <Play className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{activeAgents.length}</span>
            <span className="stat-label">Active Now</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{totalTasks}</span>
            <span className="stat-label">Tasks Done</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="stat-value">{formatTokens(totalTokens)}</span>
            <span className="stat-label">Tokens Used</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="agents">
            <Bot className="h-4 w-4 mr-2" />
            Agents ({agents.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <FileText className="h-4 w-4 mr-2" />
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <div className="agents-grid">
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onSelect={handleSelectAgent}
                onStart={handleStartAgent}
                onPause={handlePauseAgent}
                onStop={handleStopAgent}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Queue</CardTitle>
              <CardDescription>
                Recent and ongoing agent tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {tasks.map(task => {
                    const agent = agents.find(a => a.id === task.agentId);
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        agentName={agent?.name || 'Unknown'}
                        onView={() => toast({ title: 'View Task', description: task.title })}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {selectedAgent ? `Chat with ${selectedAgent.name}` : 'Select an Agent'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAgent ? (
                <>
                  <ScrollArea className="h-[300px] mb-4">
                    <div className="text-center text-muted-foreground py-8">
                      <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Start a conversation with {selectedAgent.name}</p>
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Ask ${selectedAgent.name} to do something...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select an agent from the Agents tab to start chatting</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Agents Settings</CardTitle>
              <CardDescription>
                Configure agent behavior and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Enable AI Agents</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow agents to run tasks
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(enabled) => 
                    setConfig(prev => ({ ...prev, enabled }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Max Concurrent Tasks</Label>
                  <p className="text-sm text-muted-foreground">
                    Limit simultaneous task execution
                  </p>
                </div>
                <Select 
                  value={config.maxConcurrentTasks.toString()}
                  onValueChange={(value) => 
                    setConfig(prev => ({ ...prev, maxConcurrentTasks: parseInt(value) }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="setting-row">
                <div>
                  <Label>Auto-Save Outputs</Label>
                  <p className="text-sm text-muted-foreground">
                    Save task results automatically
                  </p>
                </div>
                <Switch
                  checked={config.autoSaveOutputs}
                  onCheckedChange={(autoSaveOutputs) => 
                    setConfig(prev => ({ ...prev, autoSaveOutputs }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Enable Streaming</Label>
                  <p className="text-sm text-muted-foreground">
                    Show real-time output as it generates
                  </p>
                </div>
                <Switch
                  checked={config.enableStreaming}
                  onCheckedChange={(enableStreaming) => 
                    setConfig(prev => ({ ...prev, enableStreaming }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIAgents;
