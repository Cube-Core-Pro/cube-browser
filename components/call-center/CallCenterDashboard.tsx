/**
 * CUBE Nexum - AI Virtual Call Center Dashboard
 * 
 * Main dashboard component for the AI-powered call center
 * with conversation management, agent monitoring, and analytics.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  MessageSquare,
  Users,
  Bot,
  User,
  Search,
  Filter,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Play,
  Pause,
  Square,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  Mail,
  Globe,
  Smartphone,
  Instagram,
  Twitter,
  Hash,
  Star,
  Flag,
  Tag,
  Zap,
  Brain,
  Sparkles,
  Headphones,
  PhoneCall,
} from 'lucide-react';
import {
  useCallCenter,
  useConversations,
  useConversation,
  useAgents,
  useRealtimeDashboard,
} from '@/lib/services/call-center-service';
import {
  Conversation,
  Message,
  AIAgent,
  ChannelType,
  ConversationStatus,
  Priority,
} from '@/lib/types/call-center';
import './CallCenterDashboard.css';

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

interface CallCenterDashboardProps {
  organizationId: string;
}

export const CallCenterDashboard: React.FC<CallCenterDashboardProps> = ({ organizationId }) => {
  const { service, initialized, loading, error, initialize } = useCallCenter();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [view, setView] = useState<'conversations' | 'agents' | 'analytics'>('conversations');
  const [filters, setFilters] = useState<{
    channel?: ChannelType;
    status?: ConversationStatus;
  }>({});

  useEffect(() => {
    if (!initialized) {
      initialize(organizationId);
    }
  }, [initialized, initialize, organizationId]);

  if (loading) {
    return (
      <div className="call-center-loading">
        <RefreshCw className="spin" size={32} />
        <p>Initializing Call Center...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="call-center-error">
        <AlertCircle size={32} />
        <p>{error}</p>
        <button onClick={() => initialize(organizationId)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="call-center-dashboard">
      {/* Header */}
      <header className="cc-header">
        <div className="cc-header-left">
          <Headphones size={24} />
          <h1>AI Call Center</h1>
        </div>
        
        <nav className="cc-nav">
          <button
            className={view === 'conversations' ? 'active' : ''}
            onClick={() => setView('conversations')}
          >
            <MessageSquare size={18} />
            Conversations
          </button>
          <button
            className={view === 'agents' ? 'active' : ''}
            onClick={() => setView('agents')}
          >
            <Users size={18} />
            Agents
          </button>
          <button
            className={view === 'analytics' ? 'active' : ''}
            onClick={() => setView('analytics')}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
        </nav>

        <div className="cc-header-right">
          <RealtimeStats />
          <button className="btn-icon" title="Settings">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="cc-main">
        {view === 'conversations' && (
          <>
            <ConversationList
              filters={filters}
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
              onFilterChange={setFilters}
            />
            <ConversationView
              conversationId={selectedConversationId}
              onClose={() => setSelectedConversationId(null)}
            />
          </>
        )}
        {view === 'agents' && <AgentsDashboard />}
        {view === 'analytics' && <AnalyticsDashboard />}
      </div>
    </div>
  );
};

// =============================================================================
// REALTIME STATS
// =============================================================================

const RealtimeStats: React.FC = () => {
  const stats = useRealtimeDashboard();

  if (!stats) {
    return <div className="realtime-stats loading">Loading...</div>;
  }

  return (
    <div className="realtime-stats">
      <div className="stat">
        <MessageSquare size={16} />
        <span>{stats.activeConversations}</span>
        <span className="label">Active</span>
      </div>
      <div className="stat">
        <Clock size={16} />
        <span>{stats.waitingInQueue}</span>
        <span className="label">Waiting</span>
      </div>
      <div className="stat">
        <Users size={16} />
        <span>{stats.onlineAgents}</span>
        <span className="label">Online</span>
      </div>
      <div className={`stat sentiment ${getSentimentClass(stats.currentSentiment)}`}>
        {stats.currentSentiment > 0 ? <TrendingUp size={16} /> : 
         stats.currentSentiment < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
        <span>{(stats.currentSentiment * 100).toFixed(0)}%</span>
        <span className="label">Sentiment</span>
      </div>
    </div>
  );
};

// =============================================================================
// CONVERSATION LIST
// =============================================================================

interface ConversationListProps {
  filters: { channel?: ChannelType; status?: ConversationStatus };
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFilterChange: (filters: { channel?: ChannelType; status?: ConversationStatus }) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  filters,
  selectedId,
  onSelect,
  onFilterChange,
}) => {
  const { conversations, loading, total, refresh } = useConversations(filters);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.customer.name?.toLowerCase().includes(query) ||
      conv.customer.email?.toLowerCase().includes(query) ||
      conv.customer.phone?.includes(query)
    );
  });

  return (
    <div className="conversation-list">
      {/* Search & Filters */}
      <div className="list-header">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className={`btn-icon ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
        </button>
        <button className="btn-icon" onClick={refresh}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Channel</label>
            <select
              value={filters.channel || ''}
              onChange={e => onFilterChange({ 
                ...filters, 
                channel: e.target.value as ChannelType || undefined 
              })}
            >
              <option value="">All Channels</option>
              <option value="voice">Voice</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="webchat">Web Chat</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status || ''}
              onChange={e => onFilterChange({ 
                ...filters, 
                status: e.target.value as ConversationStatus || undefined 
              })}
            >
              <option value="">All Status</option>
              <option value="waiting">Waiting</option>
              <option value="active">Active</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      )}

      {/* Conversation Items */}
      <div className="list-content">
        {filteredConversations.length === 0 ? (
          <div className="empty-list">
            <MessageSquare size={48} />
            <p>No conversations found</p>
          </div>
        ) : (
          filteredConversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              selected={conv.id === selectedId}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>

      {/* List Footer */}
      <div className="list-footer">
        <span>{filteredConversations.length} of {total} conversations</span>
      </div>
    </div>
  );
};

// =============================================================================
// CONVERSATION ITEM
// =============================================================================

interface ConversationItemProps {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  selected,
  onClick,
}) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  
  return (
    <div
      className={`conversation-item ${selected ? 'selected' : ''} ${conversation.status}`}
      onClick={onClick}
    >
      <div className="item-avatar">
        <ChannelIcon channel={conversation.channel} />
        {conversation.unreadCount > 0 && (
          <span className="unread-badge">{conversation.unreadCount}</span>
        )}
      </div>
      
      <div className="item-content">
        <div className="item-header">
          <span className="customer-name">
            {conversation.customer.name || conversation.customer.phone || 'Unknown'}
          </span>
          <span className="item-time">
            {formatRelativeTime(conversation.lastMessageAt)}
          </span>
        </div>
        
        <div className="item-preview">
          {lastMessage?.content.slice(0, 50)}
          {lastMessage?.content.length > 50 ? '...' : ''}
        </div>
        
        <div className="item-meta">
          <StatusBadge status={conversation.status} />
          {conversation.agent && (
            <span className="agent-badge">
              {conversation.agent.type === 'ai' ? <Bot size={12} /> : <User size={12} />}
              {conversation.agent.name}
            </span>
          )}
          <SentimentIndicator score={conversation.sentiment.score} />
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// CONVERSATION VIEW
// =============================================================================

interface ConversationViewProps {
  conversationId: string | null;
  onClose: () => void;
}

const ConversationView: React.FC<ConversationViewProps> = ({
  conversationId,
  onClose,
}) => {
  const { conversation, loading, sendMessage, generateResponse } = useConversation(conversationId);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    
    setSending(true);
    await sendMessage(message.trim());
    setMessage('');
    setSending(false);
  };

  const handleGenerateResponse = async () => {
    const result = await generateResponse(false);
    if (result) {
      setAiSuggestions(result.suggestions);
      setMessage(result.response);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversationId) {
    return (
      <div className="conversation-view empty">
        <MessageSquare size={64} />
        <h3>Select a conversation</h3>
        <p>Choose a conversation from the list to view messages</p>
      </div>
    );
  }

  if (loading || !conversation) {
    return (
      <div className="conversation-view loading">
        <RefreshCw className="spin" size={32} />
        <p>Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="conversation-view">
      {/* Header */}
      <div className="conv-header">
        <div className="conv-header-left">
          <div className="customer-avatar">
            {conversation.customer.avatar ? (
              <img src={conversation.customer.avatar} alt="" />
            ) : (
              <User size={24} />
            )}
          </div>
          <div className="customer-info">
            <h3>{conversation.customer.name || 'Unknown Customer'}</h3>
            <div className="customer-details">
              <span><ChannelIcon channel={conversation.channel} size={14} /></span>
              {conversation.customer.email && <span>{conversation.customer.email}</span>}
              {conversation.customer.phone && <span>{conversation.customer.phone}</span>}
            </div>
          </div>
        </div>
        
        <div className="conv-header-actions">
          {conversation.channel === 'voice' && (
            <>
              <button className="btn-icon" title="Mute">
                <Mic size={18} />
              </button>
              <button className="btn-icon red" title="End Call">
                <PhoneOff size={18} />
              </button>
            </>
          )}
          <button className="btn-icon" title="Transfer">
            <ArrowUpRight size={18} />
          </button>
          <button className="btn-icon" title="More options">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="conv-messages">
        {conversation.messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="ai-suggestions">
          <span><Sparkles size={14} /> AI Suggestions:</span>
          {aiSuggestions.map((suggestion, i) => (
            <button key={i} onClick={() => setMessage(suggestion)}>
              {suggestion.slice(0, 40)}...
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="conv-input">
        <button className="btn-icon" title="Attach file">
          <Paperclip size={18} />
        </button>
        <textarea
          placeholder="Type a message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
        />
        <button 
          className="btn-icon ai" 
          onClick={handleGenerateResponse}
          title="Generate AI response"
        >
          <Brain size={18} />
        </button>
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={!message.trim() || sending}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// MESSAGE BUBBLE
// =============================================================================

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isCustomer = message.senderType === 'customer';
  const isSystem = message.senderType === 'system';

  if (isSystem) {
    return (
      <div className="message-system">
        <span>{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`message-bubble ${isCustomer ? 'customer' : 'agent'}`}>
      <div className="bubble-header">
        <span className="sender-name">
          {message.aiGenerated && <Bot size={12} />}
          {message.senderName}
        </span>
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
      <div className="bubble-content">
        {message.content}
      </div>
      {message.aiGenerated && message.aiConfidence && (
        <div className="ai-confidence">
          <Sparkles size={12} />
          {(message.aiConfidence * 100).toFixed(0)}% confidence
        </div>
      )}
      {message.sentiment !== undefined && (
        <SentimentIndicator score={message.sentiment} />
      )}
    </div>
  );
};

// =============================================================================
// AGENTS DASHBOARD
// =============================================================================

const AgentsDashboard: React.FC = () => {
  const { agents, loading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const aiAgents = agents.filter(a => a.type === 'ai');
  const humanAgents = agents.filter(a => a.type === 'human');

  return (
    <div className="agents-dashboard">
      <div className="agents-list">
        <h2><Bot size={20} /> AI Agents ({aiAgents.length})</h2>
        <div className="agents-grid">
          {aiAgents.map(agent => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              selected={agent.id === selectedAgent}
              onClick={() => setSelectedAgent(agent.id)}
            />
          ))}
        </div>

        <h2><User size={20} /> Human Agents ({humanAgents.length})</h2>
        <div className="agents-grid">
          {humanAgents.map(agent => (
            <AgentCard 
              key={agent.id} 
              agent={agent}
              selected={agent.id === selectedAgent}
              onClick={() => setSelectedAgent(agent.id)}
            />
          ))}
        </div>
      </div>

      {selectedAgent && (
        <AgentDetails agentId={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  );
};

// =============================================================================
// AGENT CARD
// =============================================================================

interface AgentCardProps {
  agent: AIAgent;
  selected: boolean;
  onClick: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, selected, onClick }) => {
  return (
    <div className={`agent-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div className="agent-avatar">
        {agent.avatar ? (
          <img src={agent.avatar} alt={agent.name} />
        ) : agent.type === 'ai' ? (
          <Bot size={32} />
        ) : (
          <User size={32} />
        )}
        <span className={`status-dot ${agent.status}`} />
      </div>
      <div className="agent-info">
        <h4>{agent.name}</h4>
        <p className="agent-type">{agent.type === 'ai' ? 'AI Agent' : 'Human Agent'}</p>
      </div>
      <div className="agent-stats">
        <div className="stat">
          <MessageSquare size={14} />
          <span>{agent.metrics.totalConversations}</span>
        </div>
        <div className="stat">
          <Star size={14} />
          <span>{agent.metrics.customerSatisfaction.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// AGENT DETAILS
// =============================================================================

interface AgentDetailsProps {
  agentId: string;
  onClose: () => void;
}

const AgentDetails: React.FC<AgentDetailsProps> = ({ agentId, onClose }) => {
  const { agents } = useAgents();
  const agent = agents.find(a => a.id === agentId);

  if (!agent) return null;

  return (
    <div className="agent-details">
      <div className="details-header">
        <h3>{agent.name}</h3>
        <button className="btn-icon" onClick={onClose}>×</button>
      </div>

      <div className="details-content">
        <div className="metrics-grid">
          <div className="metric">
            <span className="value">{agent.metrics.totalConversations}</span>
            <span className="label">Total Conversations</span>
          </div>
          <div className="metric">
            <span className="value">{agent.metrics.resolvedConversations}</span>
            <span className="label">Resolved</span>
          </div>
          <div className="metric">
            <span className="value">{formatDuration(agent.metrics.averageResponseTime)}</span>
            <span className="label">Avg Response</span>
          </div>
          <div className="metric">
            <span className="value">{agent.metrics.customerSatisfaction.toFixed(1)}/5</span>
            <span className="label">CSAT</span>
          </div>
          <div className="metric">
            <span className="value">{agent.metrics.firstContactResolution}%</span>
            <span className="label">FCR</span>
          </div>
          <div className="metric">
            <span className="value">${agent.metrics.revenueGenerated.toLocaleString()}</span>
            <span className="label">Revenue</span>
          </div>
        </div>

        {agent.type === 'ai' && agent.aiConfig && (
          <div className="ai-config">
            <h4>AI Configuration</h4>
            <div className="config-item">
              <span>Model</span>
              <span>{agent.aiConfig.model}</span>
            </div>
            <div className="config-item">
              <span>Personality</span>
              <span>{agent.aiConfig.personality}</span>
            </div>
            <div className="config-item">
              <span>Temperature</span>
              <span>{agent.aiConfig.temperature}</span>
            </div>
            <div className="config-item">
              <span>Languages</span>
              <span>{agent.aiConfig.supportedLanguages.join(', ')}</span>
            </div>
          </div>
        )}

        <div className="agent-skills">
          <h4>Skills</h4>
          <div className="skills-list">
            {agent.skills.map(skill => (
              <div key={skill.id} className="skill-tag">
                {skill.name}
                <span className="level">{skill.proficiencyLevel}/5</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// ANALYTICS DASHBOARD
// =============================================================================

const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2><BarChart3 size={20} /> Call Center Analytics</h2>
        <div className="period-selector">
          <button className="active">Today</button>
          <button>Week</button>
          <button>Month</button>
          <button>Custom</button>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Conversations</h4>
          <div className="card-value">1,234</div>
          <div className="card-change positive">
            <TrendingUp size={14} />
            +12% vs yesterday
          </div>
        </div>
        
        <div className="analytics-card">
          <h4>AI Resolution Rate</h4>
          <div className="card-value">78%</div>
          <div className="card-change positive">
            <TrendingUp size={14} />
            +5% vs yesterday
          </div>
        </div>
        
        <div className="analytics-card">
          <h4>Avg Response Time</h4>
          <div className="card-value">23s</div>
          <div className="card-change negative">
            <TrendingDown size={14} />
            +3s vs yesterday
          </div>
        </div>
        
        <div className="analytics-card">
          <h4>Customer Satisfaction</h4>
          <div className="card-value">4.6/5</div>
          <div className="card-change positive">
            <TrendingUp size={14} />
            +0.2 vs yesterday
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-placeholder">
          <BarChart3 size={48} />
          <p>Conversation Volume Chart</p>
        </div>
        <div className="chart-placeholder">
          <TrendingUp size={48} />
          <p>Sentiment Trend Chart</p>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const ChannelIcon: React.FC<{ channel: ChannelType; size?: number }> = ({ channel, size = 16 }) => {
  const icons: Record<ChannelType, React.ReactNode> = {
    voice: <Phone size={size} />,
    sms: <Smartphone size={size} />,
    whatsapp: <MessageCircle size={size} />,
    webchat: <MessageSquare size={size} />,
    email: <Mail size={size} />,
    facebook: <Globe size={size} />,
    instagram: <Instagram size={size} />,
    twitter: <Twitter size={size} />,
    telegram: <Hash size={size} />,
    slack: <Hash size={size} />,
    teams: <Users size={size} />,
    video: <Video size={size} />,
  };
  return <span className={`channel-icon ${channel}`}>{icons[channel]}</span>;
};

const StatusBadge: React.FC<{ status: ConversationStatus }> = ({ status }) => {
  return <span className={`status-badge ${status}`}>{status.replace('_', ' ')}</span>;
};

const SentimentIndicator: React.FC<{ score: number }> = ({ score }) => {
  return (
    <span className={`sentiment-indicator ${getSentimentClass(score)}`}>
      {score > 0.2 ? <TrendingUp size={12} /> : 
       score < -0.2 ? <TrendingDown size={12} /> : <Minus size={12} />}
    </span>
  );
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getSentimentClass(score: number): string {
  if (score > 0.5) return 'very-positive';
  if (score > 0.2) return 'positive';
  if (score > -0.2) return 'neutral';
  if (score > -0.5) return 'negative';
  return 'very-negative';
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default CallCenterDashboard;
