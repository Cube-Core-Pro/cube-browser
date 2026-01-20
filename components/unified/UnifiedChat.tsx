'use client';

import React, { useState } from 'react';
import { X, Bot, Brain, Minimize2, Maximize2 } from 'lucide-react';
import { AINexus } from '@/components/ai/AICopilot';
import { EmbeddedAIChat } from '@/components/chat/EmbeddedAIChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UnifiedChatProps {
  onClose: () => void;
  defaultTab?: 'assistant' | 'nexus';
  context?: 'workflow' | 'selector' | 'automation' | 'general';
}

export function UnifiedChat({ onClose, defaultTab = 'assistant', context = 'general' }: UnifiedChatProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chat-header-drag')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - 400));
      const newY = Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - 100));
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragStart]);

  return (
    <div
      className="fixed z-40 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '300px' : '400px',
        height: isMinimized ? '60px' : '600px',
        transition: isDragging ? 'none' : 'width 0.3s, height 0.3s',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="chat-header-drag flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/20 to-primary/10 border-b border-border cursor-move">
        <div className="flex items-center gap-3">
          {activeTab === 'assistant' ? (
            <>
              <div className="p-2 rounded-lg bg-primary/20">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">CUBE AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Powered by OpenAI</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">NEXUS AI</h3>
                <p className="text-xs text-muted-foreground">Code & Automation Assistant</p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Minimize2 className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="h-[calc(100%-60px)]">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'assistant' | 'nexus')} className="h-full flex flex-col">
            {/* Tabs Navigation */}
            <TabsList className="w-full grid grid-cols-2 bg-muted p-1 m-2 rounded-lg">
              <TabsTrigger
                value="assistant"
                className="flex items-center gap-2 data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400"
              >
                <Bot className="w-4 h-4" />
                <span className="text-xs font-medium">AI Assistant</span>
              </TabsTrigger>
              <TabsTrigger
                value="nexus"
                className="flex items-center gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
              >
                <Brain className="w-4 h-4" />
                <span className="text-xs font-medium">NEXUS</span>
              </TabsTrigger>
            </TabsList>

            {/* AI Assistant Content */}
            <TabsContent value="assistant" className="flex-1 m-0 p-0 overflow-hidden">
              <div className="h-full">
                <EmbeddedAIChat />
              </div>
            </TabsContent>

            {/* NEXUS AI Content */}
            <TabsContent value="nexus" className="flex-1 m-0 p-0 overflow-hidden">
              <div className="h-full p-4 overflow-auto">
                <AINexus context={context} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
