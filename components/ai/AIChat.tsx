'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AIService, type ChatMessage, type BrowserContext, type CommandSuggestion } from '@/lib/services/ai-service';
import { logger } from '@/lib/services/logger-service';
import './AIChat.css';

const log = logger.scope('AIChat');

// Web Speech API types (not natively available in TypeScript)
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl?: string;
  currentTitle?: string;
  tabsCount?: number;
}

export const AIChat: React.FC<AIChatProps> = ({ 
  isOpen, 
  onClose, 
  currentUrl = '', 
  currentTitle = '', 
  tabsCount = 0 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toast notification helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    if (isOpen && !sessionActive) {
      startSession();
      loadOpenAISettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionActive]);

  useEffect(() => {
    if (sessionActive) {
      updateContext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUrl, currentTitle, tabsCount, sessionActive]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startSession = async () => {
    try {
      const session = await AIService.Chat.startSession();
      setMessages(session.messages);
      setSessionActive(true);
      loadSuggestions('');
    } catch (error) {
      log.error('Error starting chat session:', error);
    }
  };

  const updateContext = async () => {
    try {
      const context: BrowserContext = {
        current_url: currentUrl,
        current_title: currentTitle,
        tabs_count: tabsCount,
        active_downloads: 0,
        last_command: undefined,
      };
      await AIService.Chat.updateContext(context);
    } catch (error) {
      log.error('Error updating context:', error);
    }
  };

  const loadSuggestions = async (query: string) => {
    try {
      const suggs = await AIService.Chat.getSuggestions(query);
      setSuggestions(suggs.slice(0, 4));
    } catch (error) {
      log.error('Error loading suggestions:', error);
    }
  };

  const loadOpenAISettings = async () => {
    try {
      const models = await AIService.OpenAI.getAvailableModels();
      setAvailableModels(models);
      
      const current = await AIService.OpenAI.getSelectedModel();
      setSelectedModel(current);
    } catch (error) {
      log.error('Error loading OpenAI settings:', error);
    }
  };

  const saveOpenAISettings = async () => {
    try {
      if (apiKey) {
        await AIService.OpenAI.setApiKey(apiKey);
      }
      await AIService.OpenAI.setSelectedModel(selectedModel);
      setShowSettings(false);
      
      // Show confirmation message
      const confirmMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `✅ Configuración guardada: Modelo ${selectedModel}${apiKey ? ' con API key configurada' : ''}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, confirmMsg]);
    } catch (error) {
      log.error('Error saving OpenAI settings:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      await AIService.Chat.sendMessage(userMessage);
      
      const history = await AIService.Chat.getHistory();
      setMessages(history);
      
      loadSuggestions('');
    } catch (error) {
      log.error('Error sending message:', error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Error: No se pudo procesar el mensaje. Intenta de nuevo.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = async () => {
    try {
      await AIService.Chat.clearHistory();
      const history = await AIService.Chat.getHistory();
      setMessages(history);
    } catch (error) {
      log.error('Error clearing history:', error);
    }
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast('info', 'Voice recognition not supported in this browser');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsListening(false);
      
      try {
        setIsLoading(true);
        await invoke<ChatMessage>('execute_voice_command', { 
          transcript 
        });
        const history = await invoke<ChatMessage[]>('get_chat_history');
        setMessages(history);
      } catch (error) {
        log.error('Error executing voice command:', error);
      } finally {
        setIsLoading(false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      log.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSuggestionClick = (suggestion: CommandSuggestion) => {
    setInputMessage(suggestion.example);
    inputRef.current?.focus();
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      browser: '🌐',
      downloads: '📥',
      screen: '📸',
      automation: '🤖',
      lendingpad: '🏦',
    };
    return icons[category] || '⚡';
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-panel">
        <div className="ai-chat-header">
          <div className="header-title">
            <span className="header-icon">🤖</span>
            <span className="header-text">AI Assistant</span>
            {isListening && <span className="listening-indicator">🎤 Escuchando...</span>}
          </div>
          <div className="header-actions">
            <button 
              className="header-btn" 
              onClick={() => setShowSettings(true)}
              title="Configuración OpenAI"
            >
              ⚙️
            </button>
            <button 
              className="header-btn" 
              onClick={clearHistory}
              title="Limpiar chat"
            >
              🗑️
            </button>
            <button 
              className="header-btn close-btn" 
              onClick={onClose}
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message message-${msg.role}`}
            >
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : msg.role === 'system' ? '💡' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                {msg.command_executed && (
                  <div className="message-command">
                    <span className="command-label">Comando ejecutado:</span>
                    <code>{msg.command_executed}</code>
                  </div>
                )}
                {msg.action_result && (
                  <div className={`message-result ${msg.action_result.success ? 'success' : 'error'}`}>
                    {msg.action_result.success ? '✅' : '❌'} {msg.action_result.message}
                  </div>
                )}
                <div className="message-time">{formatTimestamp(msg.timestamp)}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message message-assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {suggestions.length > 0 && (
          <div className="ai-chat-suggestions">
            <div className="suggestions-title">💡 Sugerencias:</div>
            <div className="suggestions-list">
              {suggestions.map((sugg, index) => (
                <button
                  key={index}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(sugg)}
                  title={sugg.description}
                >
                  <span className="suggestion-icon">{getCategoryIcon(sugg.category)}</span>
                  <span className="suggestion-text">{sugg.example}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="ai-chat-input">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje o comando..."
            disabled={isLoading}
            className="input-field"
          />
          <button
            onClick={startVoiceRecognition}
            disabled={isLoading || isListening}
            className="voice-btn"
            title="Comando de voz"
          >
            {isListening ? '🎤' : '🎙️'}
          </button>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="send-btn"
          >
            ➤
          </button>
        </div>

        {currentUrl && (
          <div className="ai-chat-context">
            <span className="context-label">📍 Contexto:</span>
            <span className="context-url" title={currentUrl}>
              {currentTitle || new URL(currentUrl).hostname}
            </span>
            <span className="context-tabs">| {tabsCount} tabs</span>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="settings-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h3>⚙️ Configuración OpenAI</h3>
              <button className="close-modal-btn" onClick={() => setShowSettings(false)}>✕</button>
            </div>

            <div className="settings-content">
              <div className="settings-group">
                <label className="settings-label">
                  🔑 API Key OpenAI
                </label>
                <input
                  type="password"
                  className="settings-input"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <span className="settings-hint">Tu API key se guarda de forma segura y nunca se comparte</span>
              </div>

              <div className="settings-group">
                <label className="settings-label">
                  🤖 Modelo de IA
                </label>
                <select
                  className="settings-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  aria-label="Seleccionar modelo de IA"
                >
                  {availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <span className="settings-hint">Modelos actuales de OpenAI disponibles</span>
              </div>

              <div className="settings-footer">
                <button 
                  className="settings-btn cancel-btn" 
                  onClick={() => setShowSettings(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="settings-btn save-btn" 
                  onClick={saveOpenAISettings}
                >
                  💾 Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

