'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SpeechRecognition as SpeechRecognitionType, SpeechSynthesisVoice } from '@/types/web-speech-api';
import './WebAIChat.css';

// Local type definitions
interface TTSSettings {
  enabled: boolean;
  autoSpeak: boolean;
  voice: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

interface VoiceSettings {
  inputEnabled: boolean;
  outputEnabled: boolean;
  autoSend: boolean;
  language: string;
  tts: TTSSettings;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  spoken?: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface WebAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  context?: 'sales' | 'support' | 'general';
  initialMessage?: string;
  apiEndpoint?: string;
  draggable?: boolean;
  voiceEnabled?: boolean;
  ttsEnabled?: boolean;
  ttsAutoSpeak?: boolean;
  voiceSettings?: Partial<VoiceSettings>;
}

const WELCOME_MESSAGES = {
  sales: "👋 Hi! I'm CUBE's AI assistant. I can help you learn about our automation platform, pricing, and how CUBE can help your business. What would you like to know?",
  support: "👋 Hi! I'm here to help with any questions about CUBE. How can I assist you today?",
  general: "👋 Hello! I'm CUBE's AI assistant. How can I help you today?",
};

const QUICK_ACTIONS = {
  sales: [
    { label: '💰 Pricing', prompt: 'What are your pricing plans?' },
    { label: '🎯 Features', prompt: 'What features does CUBE offer?' },
    { label: '🏢 Enterprise', prompt: 'Tell me about enterprise solutions' },
    { label: '📅 Book Demo', prompt: "I'd like to schedule a demo" },
  ],
  support: [
    { label: '🔧 Setup Help', prompt: 'How do I set up CUBE?' },
    { label: '📚 Documentation', prompt: 'Where can I find documentation?' },
    { label: '🐛 Report Issue', prompt: 'I found a bug' },
    { label: '💬 Contact Human', prompt: 'Can I speak to a human?' },
  ],
  general: [
    { label: '❓ What is CUBE?', prompt: 'What is CUBE?' },
    { label: '🚀 Get Started', prompt: 'How do I get started?' },
    { label: '💬 Contact', prompt: 'How can I contact you?' },
  ],
};

export const WebAIChat: React.FC<WebAIChatProps> = ({
  isOpen,
  onClose,
  context = 'sales',
  initialMessage,
  apiEndpoint = '/api/ai/chat',
  draggable = true,
  voiceEnabled = true,
  ttsEnabled = true,
  ttsAutoSpeak = false,
  voiceSettings,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  
  // Voice recognition state (STT - Speech to Text)
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  
  // TTS state (Text to Speech)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [ttsSettings, setTtsSettings] = useState<TTSSettings>({
    enabled: ttsEnabled,
    autoSpeak: ttsAutoSpeak,
    voice: voiceSettings?.tts?.voice ?? null,
    rate: voiceSettings?.tts?.rate ?? 1.0,
    pitch: voiceSettings?.tts?.pitch ?? 1.0,
    volume: voiceSettings?.tts?.volume ?? 1.0,
  });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check voice support on mount (STT)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
      setVoiceSupported(!!SpeechRecognitionCtor && voiceEnabled);
    }
  }, [voiceEnabled]);

  // Check TTS support and load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setTtsSupported(true);
      
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        
        // Set default voice (prefer English voice)
        if (voices.length > 0 && !selectedVoice) {
          const preferredVoice = voices.find(v => 
            v.lang.startsWith('en') && v.localService
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
          setSelectedVoice(preferredVoice);
        }
      };
      
      loadVoices();
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, [selectedVoice]);

  // Initialize speech recognition
  useEffect(() => {
    if (!voiceSupported || typeof window === 'undefined') return;
    
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputValue(transcript);
      
      // Auto-send when speech ends with final result
      if (event.results[0].isFinal) {
        setIsListening(false);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [voiceSupported]);

  // Toggle voice recognition
  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) {
      console.warn('Speech recognition not available');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        // Stop any ongoing TTS when starting to listen
        if (isSpeaking) {
          stopSpeaking();
        }
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        console.error('Failed to start voice recognition:', err);
        setError('Could not start microphone. Please check permissions.');
      }
    }
  }, [isListening, isSpeaking]);

  // TTS - Speak text
  const speakText = useCallback((text: string, messageId?: string) => {
    if (!ttsSupported || !ttsSettings.enabled || !text) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = ttsSettings.rate;
    utterance.pitch = ttsSettings.pitch;
    utterance.volume = ttsSettings.volume;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      if (messageId) {
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, spoken: true } : m
        ));
      }
    };
    
    utterance.onerror = (event) => {
      console.error('TTS error:', event);
      setIsSpeaking(false);
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [ttsSupported, ttsSettings, selectedVoice]);

  // Stop TTS
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Toggle TTS for a specific message
  const toggleMessageTTS = useCallback((message: Message) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(message.content, message.id);
    }
  }, [isSpeaking, speakText, stopSpeaking]);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggable) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      setPosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
    };
    
    const handleEnd = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragStart]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: initialMessage || WELCOME_MESSAGES[context],
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, context, initialMessage, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const generateMessageId = (): string => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    setError(null);
    setShowQuickActions(false);
    
    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    const assistantMessageId = generateMessageId();
    const typingMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          context,
          history: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      const responseText = data.response || data.message;
      
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantMessageId
            ? { ...m, content: responseText, isTyping: false }
            : m
        )
      );
      
      // Auto-speak response if TTS autoSpeak is enabled
      if (ttsSettings.enabled && ttsSettings.autoSpeak && responseText) {
        setTimeout(() => speakText(responseText, assistantMessageId), 100);
      }
      
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again.');
      }
      
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowQuickActions(true);
    setError(null);
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGES[context],
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  if (!isOpen) return null;

  // Calculate style for draggable positioning
  const containerStyle = draggable && (position.x !== 0 || position.y !== 0)
    ? { transform: `translate(${position.x}px, ${position.y}px)` }
    : {};

  return (
    <div className={`web-ai-chat ${draggable ? 'draggable' : ''}`}>
      <div className="chat-overlay" onClick={onClose} />
      
      <div 
        ref={containerRef}
        className={`chat-container ${isDragging ? 'dragging' : ''}`}
        style={containerStyle}
      >
        <div 
          className={`chat-header ${draggable ? 'drag-handle' : ''}`}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="chat-header-info">
            <div className="chat-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="chat-header-text">
              <h3>CUBE Assistant</h3>
              <span className="chat-status">
                <span className="status-dot" />
                {isListening ? 'Listening...' : 'Online'}
              </span>
            </div>
          </div>
          <div className="chat-header-actions">
            {ttsSupported && (
              <button
                className={`chat-action-btn ${showVoiceSettings ? 'active' : ''}`}
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                title="Voice settings"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}
            <button
              className="chat-action-btn"
              onClick={clearChat}
              title="Clear chat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
            <button
              className="chat-action-btn chat-close-btn"
              onClick={onClose}
              title="Close chat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {showVoiceSettings && ttsSupported && (
            <div className="voice-settings-panel">
              <h4>Voice Settings</h4>
              <div className="voice-setting-row">
                <label>
                  <input 
                    type="checkbox" 
                    checked={ttsSettings.enabled}
                    onChange={(e) => setTtsSettings((prev: TTSSettings) => ({ ...prev, enabled: e.target.checked }))}
                  />
                  Enable Text-to-Speech
                </label>
              </div>
              <div className="voice-setting-row">
                <label>
                  <input 
                    type="checkbox" 
                    checked={ttsSettings.autoSpeak}
                    onChange={(e) => setTtsSettings((prev: TTSSettings) => ({ ...prev, autoSpeak: e.target.checked }))}
                    disabled={!ttsSettings.enabled}
                  />
                  Auto-speak responses
                </label>
              </div>
              <div className="voice-setting-row">
                <label htmlFor="voice-select">Voice:</label>
                <select 
                  id="voice-select"
                  title="Select voice for text-to-speech"
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = availableVoices.find(v => v.name === e.target.value);
                    setSelectedVoice(voice || null);
                  }}
                  disabled={!ttsSettings.enabled}
                >
                  {availableVoices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
              <div className="voice-setting-row">
                <label htmlFor="speed-range">Speed: {ttsSettings.rate.toFixed(1)}x</label>
                <input 
                  id="speed-range"
                  title="Speech rate"
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1"
                  value={ttsSettings.rate}
                  onChange={(e) => setTtsSettings((prev: TTSSettings) => ({ ...prev, rate: parseFloat(e.target.value) }))}
                  disabled={!ttsSettings.enabled}
                />
              </div>
              <div className="voice-setting-row">
                <label htmlFor="pitch-range">Pitch: {ttsSettings.pitch.toFixed(1)}</label>
                <input 
                  id="pitch-range"
                  title="Voice pitch"
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1"
                  value={ttsSettings.pitch}
                  onChange={(e) => setTtsSettings((prev: TTSSettings) => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                  disabled={!ttsSettings.enabled}
                />
              </div>
              <button 
                className="voice-settings-close"
                onClick={() => setShowVoiceSettings(false)}
              >
                Done
              </button>
            </div>
          )}
          
          {messages.map(message => (
            <div
              key={message.id}
              className={`chat-message ${message.role}`}
            >
              {message.role === 'assistant' && (
                <div className="message-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
              )}
              <div className="message-content">
                {message.isTyping ? (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  <>
                    <p>{message.content}</p>
                    {message.role === 'assistant' && ttsSupported && ttsSettings.enabled && (
                      <button
                        className={`message-tts-btn ${isSpeaking ? 'speaking' : ''}`}
                        onClick={() => toggleMessageTTS(message)}
                        title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                      >
                        {isSpeaking ? (
                          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                        )}
                      </button>
                    )}
                  </>
                )}
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {error && (
            <div className="chat-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {showQuickActions && QUICK_ACTIONS[context] && (
          <div className="quick-actions">
            {QUICK_ACTIONS[context].map((action, index) => (
              <button
                key={index}
                className="quick-action-btn"
                onClick={() => handleQuickAction(action.prompt)}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <form className="chat-input-form" onSubmit={handleSubmit}>
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              className={`chat-voice-btn ${isListening ? 'listening' : ''}`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
              disabled={isLoading}
            >
              {isListening ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : 'Type your message...'}
            disabled={isLoading}
            className="chat-input"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="chat-send-btn"
          >
            {isLoading ? (
              <span className="spinner" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </form>

        <div className="chat-footer">
          {draggable && <span className="drag-hint">Drag header to move</span>}
          <span>Powered by CUBE AI</span>
        </div>
      </div>
    </div>
  );
};

export default WebAIChat;
