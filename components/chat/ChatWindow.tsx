'use client';

import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../../lib/services/chatService';
import type { ChatMessage, ChatRoom, TypingIndicator } from '../../lib/services/chatService';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('ChatWindow');

interface ChatWindowProps {
  roomId: string;
  userId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ roomId, userId }) => {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRoomData();
    const interval = setInterval(loadMessages, 2000);
    const typingInterval = setInterval(loadTypingIndicators, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(typingInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRoomData = async () => {
    try {
      const roomData = await chatService.getRoom(roomId);
      setRoom(roomData);
      await loadMessages();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const msgs = await chatService.getMessages(roomId);
      setMessages(msgs);
    } catch (err) {
      log.error('Failed to load messages:', err);
    }
  };

  const loadTypingIndicators = async () => {
    try {
      const indicators = await chatService.getTypingIndicators(roomId);
      const now = Date.now();
      // Only show typing indicators from last 5 seconds
      setTypingUsers(indicators.filter(i => i.userId !== userId && (now - i.timestamp) < 5000));
    } catch (err) {
      log.error('Failed to load typing indicators:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await chatService.sendMessage(roomId, userId, 'User', newMessage, 'text');
      setNewMessage('');
      await loadMessages();
      
      // Stop typing indicator
      await chatService.setTyping(roomId, userId, 'User', false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Set typing indicator
    try {
      await chatService.setTyping(roomId, userId, 'User', true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(async () => {
        await chatService.setTyping(roomId, userId, 'User', false);
      }, 3000);
    } catch (err) {
      log.error('Failed to set typing indicator:', err);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await chatService.addReaction(messageId, userId, emoji);
      await loadMessages();
    } catch (err) {
      log.error('Failed to add reaction:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      await loadMessages();
    } catch (err) {
      log.error('Failed to delete message:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading chat...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          {room?.name || 'Chat Room'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {room?.participants.length || 0} participants
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.senderId === userId
                    ? 'bg-blue-500 text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.senderId !== userId && (
                  <div className="text-xs font-semibold mb-1 opacity-75">
                    {msg.senderName}
                  </div>
                )}
                <div className="break-words">{msg.content}</div>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <div className="text-xs opacity-75">
                    {formatTimestamp(msg.timestamp.toString())}
                    {msg.edited && ' (edited)'}
                  </div>
                  <div className="flex gap-1">
                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        className="text-xs px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20"
                      >
                        {emoji} {users.length}
                      </button>
                    ))}
                    <button
                      onClick={() => handleReaction(msg.id, '👍')}
                      className="text-xs px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20"
                    >
                      +
                    </button>
                  </div>
                </div>
                {msg.senderId === userId && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="text-xs mt-1 opacity-50 hover:opacity-100"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicators */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-muted-foreground">
          {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
