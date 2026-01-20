'use client';

import React, { useState, useEffect } from 'react';
import { WebAIChat } from './WebAIChat';
import './SalesChatWidget.css';

interface SalesChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  showDelay?: number;
  pulseAnimation?: boolean;
  badgeText?: string;
  welcomeMessage?: string;
}

export const SalesChatWidget: React.FC<SalesChatWidgetProps> = ({
  position = 'bottom-right',
  showDelay = 3000,
  pulseAnimation = true,
  badgeText = "Let's chat!",
  welcomeMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const hasSeenChat = sessionStorage.getItem('cube_chat_seen');
    
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      
      if (!hasSeenChat) {
        setTimeout(() => {
          setShowBadge(true);
        }, 1500);
      }
    }, showDelay);
    
    return () => clearTimeout(showTimer);
  }, [showDelay]);

  const handleOpen = () => {
    setIsOpen(true);
    setShowBadge(false);
    setHasInteracted(true);
    sessionStorage.setItem('cube_chat_seen', 'true');
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className={`sales-chat-widget ${position}`}>
        {showBadge && !hasInteracted && (
          <div className="chat-badge" onClick={handleOpen}>
            <span>{badgeText}</span>
            <button className="badge-close" onClick={(e) => { e.stopPropagation(); setShowBadge(false); }}>
              ×
            </button>
          </div>
        )}
        
        <button
          className={`chat-fab ${pulseAnimation && !hasInteracted ? 'pulse' : ''} ${isOpen ? 'active' : ''}`}
          onClick={isOpen ? handleClose : handleOpen}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </button>
      </div>

      <WebAIChat
        isOpen={isOpen}
        onClose={handleClose}
        context="sales"
        initialMessage={welcomeMessage}
      />
    </>
  );
};

export default SalesChatWidget;
