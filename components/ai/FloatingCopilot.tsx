'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AINexus } from './AICopilot';
import { Bot, Sparkles, Minimize2, Maximize2 } from 'lucide-react';

interface FloatingNexusProps {
  context?: 'workflow' | 'selector' | 'automation' | 'general';
  onWorkflowGenerated?: (workflow: unknown) => void;
  onSelectorGenerated?: (selector: string) => void;
}

export const FloatingNexus: React.FC<FloatingNexusProps> = ({
  context = 'general',
  onWorkflowGenerated,
  onSelectorGenerated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 z-50 p-0"
        title="Open NEXUS AI"
      >
        <div className="relative">
          <Bot className="w-8 h-8 text-white" />
          <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
        </div>
      </Button>
    );
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isMinimized
          ? 'bottom-6 right-6 w-80 h-16'
          : 'bottom-6 right-6 w-[480px] h-[600px]'
      }`}
    >
      {isMinimized ? (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span className="font-semibold">NEXUS AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="text-white hover:bg-white/20"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              ✕
            </Button>
          </div>
        </div>
      ) : (
        <div className="h-full rounded-lg overflow-hidden shadow-2xl relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="absolute top-4 right-14 z-10"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>

          <AINexus
            context={context}
            onWorkflowGenerated={onWorkflowGenerated}
            onSelectorGenerated={onSelectorGenerated}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

// Keep backward compatible export
export const FloatingCopilot = FloatingNexus;
