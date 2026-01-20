'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Participant,
  ChatMessage,
  formatTimestamp,
} from '../../types/videoconference';
import './ChatSidebar.css';

interface ChatSidebarProps {
  messages: ChatMessage[];
  currentParticipant: Participant | null;
  onSendMessage: (content: string) => void;
  onClose: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  messages,
  currentParticipant,
  onSendMessage,
  onClose,
}) => {
  const [messageText, setMessageText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle send message
  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
      inputRef.current?.focus();
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Add emoji to message
  const addEmoji = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  // Common emojis
  const emojis = [
    '👍', '❤️', '😊', '😂', '🎉', '👏', '🙌', '💯',
    '✅', '❌', '⚡', '🔥', '💡', '📝', '📊', '🎯',
  ];

  return (
    <div className="chat-sidebar">
      <div className="chat-header">
        <h3>Chat</h3>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>No messages yet</p>
            <span>Start the conversation!</span>
          </div>
        )}

        {messages.map(message => {
          const isCurrentUser = message.participant_id === currentParticipant?.participant_id;
          const isSystem = message.type === 'system';

          if (isSystem) {
            return (
              <div key={message.id} className="message-item system-message">
                <div className="system-content">{message.content}</div>
                <div className="system-time">{formatTimestamp(message.timestamp)}</div>
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`message-item ${isCurrentUser ? 'own-message' : 'other-message'}`}
            >
              <div className="message-header">
                <span className="message-sender">
                  {isCurrentUser ? 'You' : message.participant_name}
                </span>
                <span className="message-time">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        {showEmoji && (
          <div className="emoji-picker">
            {emojis.map(emoji => (
              <button
                key={emoji}
                className="emoji-button"
                onClick={() => addEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input">
          <button
            className="emoji-toggle"
            onClick={() => setShowEmoji(!showEmoji)}
            title="Add emoji"
          >
            😊
          </button>

          <textarea
            ref={inputRef}
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
          />

          <button
            className="send-button"
            onClick={handleSend}
            disabled={!messageText.trim()}
            title="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};
