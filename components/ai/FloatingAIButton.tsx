'use client';

import React, { useState } from 'react';
import { AIChat } from './AIChat';
import { MessageSquare } from 'lucide-react';
import './FloatingAIButton.css';

/**
 * Floating AI Chat Button - Global AI assistant accessible from anywhere
 * Shows a floating button in bottom-right corner that opens AIChat
 */
export const FloatingAIButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          className="floating-ai-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
          title="AI Assistant (Ctrl+Shift+A)"
        >
          <MessageSquare className="floating-ai-icon" />
          <span className="floating-ai-pulse" />
        </button>
      )}

      {/* AI Chat Panel */}
      {isOpen && (
        <AIChat
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
