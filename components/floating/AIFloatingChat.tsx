"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AIFloatingChat');

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Minimize2, Maximize2, Bot, Code, Users, 
  GripVertical, Sparkles, Search, Wrench, Workflow, Copy, Check, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ChatService, aiService } from '@/lib/services/ai-service';
import './AIFloatingChat.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Type for messages from backend session
interface SessionMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string | number;
}

type ChatMode = 'assistant' | 'nexus' | 'groups' | 'tools';

export const AIFloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatMode>('assistant');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [unreadGroups, setUnreadGroups] = useState(0);
  
  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth - 440, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // AI Tools state
  const [selectorDescription, setSelectorDescription] = useState('');
  const [generatedSelector, setGeneratedSelector] = useState('');
  const [generatingSelector, setGeneratingSelector] = useState(false);
  const [copiedSelector, setCopiedSelector] = useState(false);
  
  const [currentSelector, setCurrentSelector] = useState('');
  const [selectorIssue, setSelectorIssue] = useState('');
  const [improvedSelector, setImprovedSelector] = useState('');
  const [improvingSelector, setImprovingSelector] = useState(false);
  const [copiedImprovedSelector, setCopiedImprovedSelector] = useState(false);
  
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [generatedWorkflow, setGeneratedWorkflow] = useState('');
  const [generatingWorkflow, setGeneratingWorkflow] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [toolsTab, setToolsTab] = useState('selector');
  
  const [error, setError] = useState<string | null>(null);

  // Initialize position on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 440, y: 20 });
    }
  }, []);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 0);
        const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 0);
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Start chat session
  useEffect(() => {
    const startSession = async () => {
      if (isOpen && !sessionStarted && typeof window !== 'undefined' && '__TAURI__' in window) {
        try {
          const session = await ChatService.startSession();
          if (session && session.messages) {
            setMessages(session.messages.map((msg: SessionMessage) => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date(msg.timestamp)
            })));
          }
          setSessionStarted(true);
        } catch (error) {
          log.error('Failed to start chat session:', error);
          // Fallback to welcome message
          setMessages([{
            id: '1',
            role: 'assistant',
            content: '👋 ¡Hola! Soy tu asistente AI. ¿En qué puedo ayudarte?',
            timestamp: new Date()
          }]);
          setSessionStarted(true);
        }
      }
    };
    startSession();
  }, [isOpen, sessionStarted]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ChatService.sendMessage(input);
      
      const aiMessage: Message = {
        id: response.id || (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(response.timestamp || Date.now())
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      log.error('AI Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // AI Tools Handlers
  const handleGenerateSelector = async () => {
    if (!selectorDescription.trim()) return;
    
    setGeneratingSelector(true);
    setError(null);
    setGeneratedSelector('');
    
    try {
      const selector = await aiService.generateSelector(selectorDescription);
      setGeneratedSelector(selector);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate selector');
    } finally {
      setGeneratingSelector(false);
    }
  };

  const handleImproveSelector = async () => {
    if (!currentSelector.trim() || !selectorIssue.trim()) return;
    
    setImprovingSelector(true);
    setError(null);
    setImprovedSelector('');
    
    try {
      const selector = await aiService.improveSelector(currentSelector, selectorIssue);
      setImprovedSelector(selector);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve selector');
    } finally {
      setImprovingSelector(false);
    }
  };

  const handleGenerateWorkflow = async () => {
    if (!workflowDescription.trim()) return;
    
    setGeneratingWorkflow(true);
    setError(null);
    setGeneratedWorkflow('');
    
    try {
      const workflow = await aiService.generateWorkflow(workflowDescription);
      setGeneratedWorkflow(workflow);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate workflow');
    } finally {
      setGeneratingWorkflow(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'selector' | 'improved' | 'workflow') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'selector') {
        setCopiedSelector(true);
        setTimeout(() => setCopiedSelector(false), 2000);
      } else if (type === 'improved') {
        setCopiedImprovedSelector(true);
        setTimeout(() => setCopiedImprovedSelector(false), 2000);
      } else {
        setCopiedWorkflow(true);
        setTimeout(() => setCopiedWorkflow(false), 2000);
      }
    } catch (err) {
      log.error('Failed to copy:', err);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50"
        aria-label="Open AI Chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      ref={(el) => {
        if (containerRef) {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }
        if (el) {
          el.style.setProperty('--chat-x', `${position.x}px`);
          el.style.setProperty('--chat-y', `${position.y}px`);
        }
      }}
      className={cn(
        "ai-chat-window",
        isMinimized ? "ai-chat-window--minimized" : "ai-chat-window--normal",
        isDragging && "ai-chat-window--dragging"
      )}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b bg-muted/50 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-semibold text-sm">
            {activeTab === 'assistant' && 'AI Assistant'}
            {activeTab === 'nexus' && 'NEXUS AI'}
            {activeTab === 'tools' && 'AI Tools'}
            {activeTab === 'groups' && 'Group Chat'}
          </span>
          <Badge variant="secondary" className="text-xs">
            {activeTab === 'assistant' && 'GPT-5.2'}
            {activeTab === 'nexus' && 'GPT-5.2'}
            {activeTab === 'tools' && 'AI'}
            {activeTab === 'groups' && 'Live'}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content with Tabs */}
      {!isMinimized && (
        <>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ChatMode)} className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-4 rounded-none border-b bg-muted/30">
              <TabsTrigger value="assistant" className="gap-1.5 text-xs data-[state=active]:bg-background">
                <Bot className="h-3.5 w-3.5" />
                Assistant
              </TabsTrigger>
              <TabsTrigger value="nexus" className="gap-1.5 text-xs data-[state=active]:bg-background">
                <Code className="h-3.5 w-3.5" />
                NEXUS
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-1.5 text-xs data-[state=active]:bg-background">
                <Sparkles className="h-3.5 w-3.5" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-1.5 text-xs data-[state=active]:bg-background relative">
                <Users className="h-3.5 w-3.5" />
                Groups
                {unreadGroups > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                    {unreadGroups}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Assistant Tab */}
            <TabsContent value="assistant" className="flex-1 flex flex-col m-0 p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">AI Assistant Ready</p>
                      <p className="text-xs mt-1">Ask me anything!</p>
                    </div>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                          message.role === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <span className="text-[10px] opacity-70 mt-1 block">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce animation-delay-0" />
                            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce animation-delay-150" />
                            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce animation-delay-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* NEXUS Tab */}
            <TabsContent value="nexus" className="flex-1 flex flex-col m-0 p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  <div className="text-center py-8 text-muted-foreground">
                    <Code className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">NEXUS AI Ready</p>
                    <p className="text-xs mt-1">Specialized for code analysis</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2">
                    <p className="font-medium">What I can do:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Analyze code and find issues</li>
                      <li>• Generate selectors and patterns</li>
                      <li>• Debug automation workflows</li>
                      <li>• Optimize performance</li>
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="flex-1 flex flex-col m-0 p-0">
              <Tabs value={toolsTab} onValueChange={setToolsTab} className="flex-1 flex flex-col">
                <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
                  <TabsTrigger value="selector" className="text-xs">
                    <Search className="h-3 w-3 mr-1" />
                    Generate
                  </TabsTrigger>
                  <TabsTrigger value="improve" className="text-xs">
                    <Wrench className="h-3 w-3 mr-1" />
                    Improve
                  </TabsTrigger>
                  <TabsTrigger value="workflow" className="text-xs">
                    <Workflow className="h-3 w-3 mr-1" />
                    Workflow
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 p-3">
                  {/* Generate Selector */}
                  <TabsContent value="selector" className="mt-0 space-y-3">
                    <Input
                      placeholder="Describe the element (e.g., blue login button)"
                      value={selectorDescription}
                      onChange={(e) => setSelectorDescription(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateSelector()}
                      className="text-xs"
                    />
                    <Button
                      onClick={handleGenerateSelector}
                      disabled={!selectorDescription.trim() || generatingSelector}
                      className="w-full text-xs h-8"
                      size="sm"
                    >
                      {generatingSelector ? (
                        <>
                          <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Search className="h-3 w-3 mr-1" />
                          Generate Selector
                        </>
                      )}
                    </Button>

                    {generatedSelector && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Result:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => copyToClipboard(generatedSelector, 'selector')}
                            >
                              {copiedSelector ? (
                                <><Check className="h-3 w-3 mr-1" />Copied</>
                              ) : (
                                <><Copy className="h-3 w-3 mr-1" />Copy</>
                              )}
                            </Button>
                          </div>
                          <div className="p-2 bg-muted rounded text-xs font-mono">
                            {generatedSelector}
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {/* Improve Selector */}
                  <TabsContent value="improve" className="mt-0 space-y-3">
                    <Input
                      placeholder="Current selector"
                      value={currentSelector}
                      onChange={(e) => setCurrentSelector(e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="What's wrong with it?"
                      value={selectorIssue}
                      onChange={(e) => setSelectorIssue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleImproveSelector()}
                      className="text-xs"
                    />
                    <Button
                      onClick={handleImproveSelector}
                      disabled={!currentSelector.trim() || !selectorIssue.trim() || improvingSelector}
                      className="w-full text-xs h-8"
                      size="sm"
                    >
                      {improvingSelector ? (
                        <>
                          <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                          Improving...
                        </>
                      ) : (
                        <>
                          <Wrench className="h-3 w-3 mr-1" />
                          Improve Selector
                        </>
                      )}
                    </Button>

                    {improvedSelector && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Improved:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => copyToClipboard(improvedSelector, 'improved')}
                            >
                              {copiedImprovedSelector ? (
                                <><Check className="h-3 w-3 mr-1" />Copied</>
                              ) : (
                                <><Copy className="h-3 w-3 mr-1" />Copy</>
                              )}
                            </Button>
                          </div>
                          <div className="p-2 bg-muted rounded text-xs font-mono">
                            {improvedSelector}
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {/* Generate Workflow */}
                  <TabsContent value="workflow" className="mt-0 space-y-3">
                    <Input
                      placeholder="Describe automation task"
                      value={workflowDescription}
                      onChange={(e) => setWorkflowDescription(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateWorkflow()}
                      className="text-xs"
                    />
                    <Button
                      onClick={handleGenerateWorkflow}
                      disabled={!workflowDescription.trim() || generatingWorkflow}
                      className="w-full text-xs h-8"
                      size="sm"
                    >
                      {generatingWorkflow ? (
                        <>
                          <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Workflow className="h-3 w-3 mr-1" />
                          Generate Workflow
                        </>
                      )}
                    </Button>

                    {generatedWorkflow && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Workflow:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => copyToClipboard(generatedWorkflow, 'workflow')}
                            >
                              {copiedWorkflow ? (
                                <><Check className="h-3 w-3 mr-1" />Copied</>
                              ) : (
                                <><Copy className="h-3 w-3 mr-1" />Copy JSON</>
                              )}
                            </Button>
                          </div>
                          <ScrollArea className="h-32 rounded border">
                            <pre className="p-2 text-[10px]">
                              {JSON.stringify(JSON.parse(generatedWorkflow), null, 2)}
                            </pre>
                          </ScrollArea>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {error && (
                    <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium text-destructive">Error</p>
                          <p className="text-destructive/80">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </Tabs>
            </TabsContent>

            {/* Groups Tab */}
            <TabsContent value="groups" className="flex-1 flex flex-col m-0 p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Group Chat</p>
                    <p className="text-xs mt-1">Collaborate while you browse</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2">
                    <p className="font-medium">Available Groups:</p>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          T
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Team Workspace</p>
                          <p className="text-[10px] text-muted-foreground">3 members online</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-medium">
                          P
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Project Alpha</p>
                          <p className="text-[10px] text-muted-foreground">1 member online</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Input Area */}
          <div className="p-3 border-t bg-muted/30">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  activeTab === 'assistant' ? "Ask me anything..." :
                  activeTab === 'nexus' ? "Describe your code issue..." :
                  "Type your message..."
                }
                disabled={isLoading}
                className="flex-1 h-9 text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-9 w-9"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
};
