'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AISearchEngine');

import React, { useState, useRef, useEffect } from 'react';
import { SearchService } from '@/lib/services/search-service';
import { markdownToSafeHtml } from '@/lib/sanitize';
import {
  Search, Globe, Sparkles, Brain, Zap, Send, Copy, Share2,
  ThumbsUp, ThumbsDown, RefreshCw, Plus, History,
  ChevronRight, ChevronDown, ExternalLink, Image as ImageIcon,
  FileText, Code, Calculator,
  TrendingUp, Mic, Camera,
  Layers,
  Link2,
  Bot, User, Loader2, ArrowRight, Hash,
  Lightbulb, Target, Compass, BookOpen, HelpCircle
} from 'lucide-react';
import './AISearchEngine.css';

// ===== Types =====
type SearchMode = 'instant' | 'deep' | 'creative' | 'research' | 'code' | 'visual';
type SourceCategory = 'all' | 'news' | 'academic' | 'social' | 'images' | 'videos' | 'shopping';
type MessageRole = 'user' | 'assistant' | 'system';

interface SearchSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  favicon?: string;
  date?: Date;
  relevance: number;
  type: 'article' | 'academic' | 'video' | 'image' | 'product' | 'social';
}

interface SearchResult {
  id: string;
  query: string;
  mode: SearchMode;
  answer: string;
  sources: SearchSource[];
  relatedQuestions: string[];
  followUps: string[];
  confidence: number;
  processingTime: number;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: SearchSource[];
  relatedQuestions?: string[];
  timestamp: Date;
  isStreaming?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  category: string;
}

// ===== Component =====
export const AISearchEngine: React.FC = () => {
  // State
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('instant');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sourceCategory, setSourceCategory] = useState<SourceCategory>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentResult, setCurrentResult] = useState<SearchResult | null>(null);
  const [showSources, setShowSources] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick Actions
  const quickActions: QuickAction[] = [
    { id: 'explain', label: 'Explain', icon: <Lightbulb size={16} />, prompt: 'Explain in simple terms: ', category: 'learn' },
    { id: 'summarize', label: 'Summarize', icon: <FileText size={16} />, prompt: 'Summarize this: ', category: 'learn' },
    { id: 'compare', label: 'Compare', icon: <Layers size={16} />, prompt: 'Compare and contrast: ', category: 'analyze' },
    { id: 'analyze', label: 'Analyze', icon: <Target size={16} />, prompt: 'Analyze in detail: ', category: 'analyze' },
    { id: 'code', label: 'Code', icon: <Code size={16} />, prompt: 'Write code for: ', category: 'create' },
    { id: 'create', label: 'Create', icon: <Sparkles size={16} />, prompt: 'Create a: ', category: 'create' },
    { id: 'translate', label: 'Translate', icon: <Globe size={16} />, prompt: 'Translate to English: ', category: 'tools' },
    { id: 'calculate', label: 'Calculate', icon: <Calculator size={16} />, prompt: 'Calculate: ', category: 'tools' },
  ];

  // Trending Topics
  const trendingTopics = [
    { topic: 'AI Agents 2025', searches: '2.5M+' },
    { topic: 'Climate Summit Results', searches: '1.8M+' },
    { topic: 'Quantum Computing Breakthrough', searches: '1.2M+' },
    { topic: 'Space Tourism Update', searches: '890K+' },
  ];

  // Mode descriptions
  const modeDescriptions: Record<SearchMode, string> = {
    instant: 'Quick answers with real-time web data',
    deep: 'Comprehensive research with multiple sources',
    creative: 'Generate creative content and ideas',
    research: 'Academic and scientific analysis',
    code: 'Programming help and code generation',
    visual: 'Image analysis and visual search'
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Generate mock sources
  const generateMockSources = (query: string): SearchSource[] => {
    const sources: SearchSource[] = [
      {
        id: '1',
        title: `Comprehensive Guide to ${query}`,
        url: 'https://wikipedia.org/wiki/' + encodeURIComponent(query),
        snippet: `A detailed overview of ${query}, covering history, applications, and recent developments in the field...`,
        domain: 'wikipedia.org',
        relevance: 95,
        type: 'article'
      },
      {
        id: '2',
        title: `Latest Research on ${query} - Nature`,
        url: 'https://nature.com/articles/' + Math.random().toString(36).substr(2, 9),
        snippet: `Groundbreaking study reveals new insights into ${query}, with implications for future research and applications...`,
        domain: 'nature.com',
        date: new Date(),
        relevance: 92,
        type: 'academic'
      },
      {
        id: '3',
        title: `${query}: What Experts Say`,
        url: 'https://techcrunch.com/' + encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-')),
        snippet: `Industry experts weigh in on ${query}, discussing trends, challenges, and opportunities in the space...`,
        domain: 'techcrunch.com',
        date: new Date(),
        relevance: 88,
        type: 'article'
      },
      {
        id: '4',
        title: `Understanding ${query} - MIT Technology Review`,
        url: 'https://technologyreview.com/topic/' + encodeURIComponent(query),
        snippet: `MIT researchers explain the fundamentals of ${query} and its potential impact on society and technology...`,
        domain: 'technologyreview.com',
        relevance: 90,
        type: 'academic'
      },
      {
        id: '5',
        title: `${query} Explained (Video)`,
        url: 'https://youtube.com/watch?v=' + Math.random().toString(36).substr(2, 11),
        snippet: `Visual explanation of ${query} with animations and expert commentary. Perfect for beginners and advanced learners...`,
        domain: 'youtube.com',
        relevance: 85,
        type: 'video'
      }
    ];
    return sources;
  };

  // Generate AI response
  const generateAIResponse = async (userQuery: string): Promise<string> => {
    // Simulate AI thinking with a structured response
    const responses: Record<string, string> = {
      default: `## Understanding ${userQuery}

Based on my analysis of multiple sources, here's a comprehensive answer:

### Key Points

1. **Definition & Overview**
   ${userQuery} is a multifaceted topic that encompasses various aspects across technology, science, and everyday applications.

2. **Current State**
   Recent developments have significantly advanced our understanding and capabilities in this area. Major players and researchers continue to push boundaries.

3. **Applications**
   - Business and enterprise solutions
   - Consumer applications
   - Research and development
   - Educational purposes

### Recent Developments

The field has seen remarkable progress in 2025, with notable breakthroughs including:
- Enhanced efficiency and performance metrics
- New frameworks and methodologies
- Increased accessibility and adoption rates

### Expert Perspectives

Industry leaders emphasize the importance of continued innovation while maintaining ethical considerations. The consensus points toward sustainable growth and responsible development.

### Looking Ahead

Future trends suggest:
- Greater integration across platforms
- More sophisticated capabilities
- Broader accessibility
- Enhanced user experiences

*This answer synthesizes information from multiple verified sources to provide an accurate and comprehensive overview.*`
    };

    return responses.default;
  };

  // Handle search
  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);
    
    // Add to history
    setSearchHistory(prev => [query, ...prev.filter(q => q !== query).slice(0, 9)]);

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Create placeholder for assistant message
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      sources: [],
      relatedQuestions: [],
      timestamp: new Date(),
      isStreaming: true
    };
    setMessages(prev => [...prev, assistantMessage]);

    // Try to use backend search first
    let backendResults = null;
    try {
      backendResults = await SearchService.query.search({
        query: query,
        page: 1
      });
      log.debug('Backend search results:', backendResults);
      
      // Save to search history in backend
      await SearchService.query.getSuggestions(query);
    } catch (error) {
      log.error('Backend search failed, using mock response:', error);
    }

    // Simulate streaming response
    const fullResponse = await generateAIResponse(query);
    const sources = generateMockSources(query);
    const relatedQuestions = [
      `What are the latest developments in ${query}?`,
      `How does ${query} compare to alternatives?`,
      `What are the benefits of ${query}?`,
      `Who are the key players in ${query}?`,
    ];

    // Stream the response character by character
    let currentText = '';
    for (let i = 0; i < fullResponse.length; i++) {
      currentText += fullResponse[i];
      setStreamingText(currentText);
      
      // Update the message
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: currentText }
          : msg
      ));
      
      // Adjust delay for more natural streaming
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    // Finalize the message
    setMessages(prev => prev.map(msg => 
      msg.id === assistantMessageId 
        ? { ...msg, content: fullResponse, sources, relatedQuestions, isStreaming: false }
        : msg
    ));

    // Create search result
    const result: SearchResult = {
      id: `result-${Date.now()}`,
      query,
      mode: searchMode,
      answer: fullResponse,
      sources,
      relatedQuestions,
      followUps: [
        'Tell me more about the applications',
        'What are the challenges?',
        'How can I get started?'
      ],
      confidence: Math.floor(Math.random() * 10) + 90,
      processingTime: Math.random() * 2 + 0.5,
      timestamp: new Date()
    };
    setCurrentResult(result);

    setIsSearching(false);
    setStreamingText('');
    setQuery('');
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  // Handle quick action
  const handleQuickAction = (action: QuickAction) => {
    setQuery(action.prompt);
    searchInputRef.current?.focus();
  };

  // Handle follow-up question
  const handleFollowUp = (question: string) => {
    setQuery(question);
    handleSearch();
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // New chat
  const newChat = () => {
    setMessages([]);
    setCurrentResult(null);
    setQuery('');
  };

  // Format date
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  return (
    <div className="ai-search-engine">
      {/* Sidebar */}
      <aside className="search-sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <Brain size={24} />
            </div>
            <div className="brand-text">
              <span className="brand-name">CUBE Search</span>
              <span className="brand-tagline">AI-Powered Intelligence</span>
            </div>
          </div>
          <button className="new-chat-btn" onClick={newChat}>
            <Plus size={18} />
            New Search
          </button>
        </div>

        {/* Search Modes */}
        <div className="sidebar-section">
          <h4>Search Mode</h4>
          <div className="mode-selector">
            {(['instant', 'deep', 'creative', 'research', 'code', 'visual'] as SearchMode[]).map(mode => (
              <button
                key={mode}
                className={`mode-btn ${searchMode === mode ? 'active' : ''}`}
                onClick={() => setSearchMode(mode)}
                title={modeDescriptions[mode]}
              >
                {mode === 'instant' && <Zap size={16} />}
                {mode === 'deep' && <Compass size={16} />}
                {mode === 'creative' && <Sparkles size={16} />}
                {mode === 'research' && <BookOpen size={16} />}
                {mode === 'code' && <Code size={16} />}
                {mode === 'visual' && <ImageIcon size={16} />}
                <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        {searchHistory.length > 0 && (
          <div className="sidebar-section">
            <h4><History size={14} /> Recent</h4>
            <div className="history-list">
              {searchHistory.slice(0, 5).map((item, idx) => (
                <button 
                  key={idx} 
                  className="history-item"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <Search size={14} />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trending */}
        <div className="sidebar-section">
          <h4><TrendingUp size={14} /> Trending</h4>
          <div className="trending-list">
            {trendingTopics.map((item, idx) => (
              <button 
                key={idx} 
                className="trending-item"
                onClick={() => handleSuggestionClick(item.topic)}
              >
                <Hash size={14} />
                <span className="topic">{item.topic}</span>
                <span className="searches">{item.searches}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="search-main">
        {/* Welcome Screen (no messages) */}
        {messages.length === 0 && (
          <div className="welcome-screen">
            <div className="welcome-hero">
              <div className="hero-icon">
                <Brain size={64} />
                <div className="hero-glow"></div>
              </div>
              <h1>Ask anything. Get intelligent answers.</h1>
              <p>Powered by advanced AI with real-time web access and multi-source synthesis</p>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-grid">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  className="quick-action-card"
                  onClick={() => handleQuickAction(action)}
                >
                  <span className="action-icon">{action.icon}</span>
                  <span className="action-label">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Example Queries */}
            <div className="example-queries">
              <h3>Try asking:</h3>
              <div className="examples-grid">
                {[
                  'What are the latest breakthroughs in AI?',
                  'Explain quantum computing to a 10-year-old',
                  'Compare React vs Vue for large applications',
                  'What happened at the climate summit today?',
                  'Write a Python function to sort a linked list',
                  'How does CRISPR gene editing work?'
                ].map((example, idx) => (
                  <button 
                    key={idx} 
                    className="example-btn"
                    onClick={() => handleSuggestionClick(example)}
                  >
                    <ArrowRight size={14} />
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="chat-container">
            <div className="messages-list">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-avatar">
                    {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div className="message-content">
                    {message.role === 'user' ? (
                      <div className="user-query">{message.content}</div>
                    ) : (
                      <div className="assistant-response">
                        <div 
                          className="response-text markdown"
                          dangerouslySetInnerHTML={{ 
                            __html: markdownToSafeHtml(message.content)
                          }}
                        />
                        
                        {message.isStreaming && (
                          <span className="cursor-blink">|</span>
                        )}

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && !message.isStreaming && (
                          <div className="response-sources">
                            <button 
                              className="sources-toggle"
                              onClick={() => setShowSources(!showSources)}
                            >
                              <Link2 size={14} />
                              {message.sources.length} Sources
                              {showSources ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            {showSources && (
                              <div className="sources-list">
                                {message.sources.map((source, idx) => (
                                  <a 
                                    key={idx}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="source-card"
                                  >
                                    <div className="source-number">{idx + 1}</div>
                                    <div className="source-info">
                                      <span className="source-title">{source.title}</span>
                                      <span className="source-domain">{source.domain}</span>
                                    </div>
                                    <ExternalLink size={14} />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Related Questions */}
                        {message.relatedQuestions && message.relatedQuestions.length > 0 && !message.isStreaming && (
                          <div className="related-questions">
                            <h4>Related Questions</h4>
                            <div className="questions-list">
                              {message.relatedQuestions.map((q, idx) => (
                                <button 
                                  key={idx}
                                  className="related-btn"
                                  onClick={() => handleFollowUp(q)}
                                >
                                  <HelpCircle size={14} />
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        {!message.isStreaming && (
                          <div className="message-actions">
                            <button 
                              className="action-btn"
                              onClick={() => copyToClipboard(message.content)}
                              title="Copy"
                            >
                              <Copy size={14} />
                            </button>
                            <button className="action-btn" title="Like">
                              <ThumbsUp size={14} />
                            </button>
                            <button className="action-btn" title="Dislike">
                              <ThumbsDown size={14} />
                            </button>
                            <button className="action-btn" title="Regenerate">
                              <RefreshCw size={14} />
                            </button>
                            <button className="action-btn" title="Share">
                              <Share2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <div className="input-prefix">
              <Brain size={20} className="brain-icon" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Ask me anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSearch()}
              disabled={isSearching}
            />
            <div className="input-actions">
              <button 
                className="voice-btn"
                onClick={() => setIsListening(!isListening)}
                title="Voice input"
              >
                <Mic size={18} className={isListening ? 'listening' : ''} />
              </button>
              <button 
                className="upload-btn"
                title="Upload image"
              >
                <Camera size={18} />
              </button>
              <button
                className="send-btn"
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
              >
                {isSearching ? (
                  <Loader2 size={20} className="spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
          <div className="input-footer">
            <span className="mode-indicator">
              {searchMode === 'instant' && <Zap size={12} />}
              {searchMode === 'deep' && <Compass size={12} />}
              {searchMode === 'creative' && <Sparkles size={12} />}
              {searchMode === 'research' && <BookOpen size={12} />}
              {searchMode === 'code' && <Code size={12} />}
              {searchMode === 'visual' && <ImageIcon size={12} />}
              {searchMode.charAt(0).toUpperCase() + searchMode.slice(1)} Mode
            </span>
            <span className="disclaimer">AI can make mistakes. Verify important information.</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AISearchEngine;
