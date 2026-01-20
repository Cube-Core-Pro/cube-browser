"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  MessageSquare, 
  Send,
  Plus,
  Users,
  Hash,
  MoreVertical,
  Search,
  Smile,
  Paperclip,
  Loader2,
  File
} from "lucide-react";
import {
  createRoom,
  sendMessage,
  getMessages,
  listRooms,
  type ChatRoom,
  type ChatMessage
} from "@/lib/services/chatService";

// ==================== Types ====================
interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface ThreadMessage extends Omit<ChatMessage, 'reactions' | 'edited'> {
  reactions: Reaction[];
  isEdited: boolean;
  isPinned: boolean;
  replyCount: number;
}

interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

const _reactionEmojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🚀'];

export default function ChatPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Advanced Chat Features
  const [activeThread, setActiveThread] = useState<ThreadMessage | null>(null);
  const [_threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [_showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [_editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [_typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [_mentionQuery, _setMentionQuery] = useState<string | null>(null);
  const [_showEmojiPicker, _setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [_pinnedMessages, setPinnedMessages] = useState<ThreadMessage[]>([]);
  const [_showPinnedMessages, _setShowPinnedMessages] = useState(false);
  const [roomSearch, _setRoomSearch] = useState("");
  const [messageSearch, _setMessageSearch] = useState("");
  const [_showMessageSearch, _setShowMessageSearch] = useState(false);
  const [roomNotifications, setRoomNotifications] = useState<Record<string, boolean>>({});
  
  // File input ref
  const _fileInputRef = useRef<HTMLInputElement>(null);

  // Load rooms on mount
  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const roomList = await listRooms();
      setRooms(roomList);
    } catch (err) {
      log.error('Failed to load rooms:', err);
      const errorMessage = err instanceof Error ? err.message : t('chat.errors.loadRoomsFailed');
      setError(errorMessage);
      toast({
        title: t('chat.errors.title'),
        description: errorMessage,
        variant: "destructive",
      });
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (activeRoom) {
      loadMessages(activeRoom.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Simulate typing indicator cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => prev.filter(u => now - u.timestamp < 3000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async (roomId: string) => {
    try {
      setLoadingMessages(true);
      const msgs = await getMessages(roomId, 50);
      // Transform to ThreadMessage with default values
      const threadMsgs: ThreadMessage[] = msgs.map(m => ({
        ...m,
        reactions: [],
        isEdited: false,
        isPinned: false,
        replyCount: 0,
      }));
      setMessages(threadMsgs);
      // Load pinned messages
      setPinnedMessages(threadMsgs.filter(m => m.isPinned));
    } catch (error) {
      log.error('Failed to load messages:', error);
      toast({
        title: "Error Loading Messages",
        description: error instanceof Error ? error.message : "Failed to load messages",
        variant: "destructive",
      });
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // ==================== Message Actions ====================
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || sendingMessage) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setAttachments([]);

    try {
      setSendingMessage(true);
      const message = await sendMessage(
        activeRoom.id,
        'current-user',
        'You',
        messageContent,
        attachments.length > 0 ? 'file' : 'text'
      );
      const threadMsg: ThreadMessage = {
        ...message,
        reactions: [],
        isEdited: false,
        isPinned: false,
        replyCount: 0,
      };
      setMessages(prev => [...prev, threadMsg]);
    } catch (error) {
      log.error('Failed to send message:', error);
      toast({
        title: "Error Sending Message",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };
  
  // ==================== Reactions ====================
  
  const _addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const existingReaction = msg.reactions.find(r => r.emoji === emoji);
      if (existingReaction) {
        if (existingReaction.users.includes('current-user')) {
          // Remove reaction
          return {
            ...msg,
            reactions: msg.reactions.map(r => 
              r.emoji === emoji 
                ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== 'current-user') }
                : r
            ).filter(r => r.count > 0)
          };
        } else {
          // Add to existing reaction
          return {
            ...msg,
            reactions: msg.reactions.map(r =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, users: [...r.users, 'current-user'] }
                : r
            )
          };
        }
      } else {
        // New reaction
        return {
          ...msg,
          reactions: [...msg.reactions, { emoji, count: 1, users: ['current-user'] }]
        };
      }
    }));
    setShowReactionPicker(null);
  };
  
  // ==================== Threading ====================
  
  const _openThread = (message: ThreadMessage) => {
    setActiveThread(message);
    // In production, load thread messages from backend
    setThreadMessages([]);
  };
  
  const _closeThread = () => {
    setActiveThread(null);
    setThreadMessages([]);
  };
  
  const _sendThreadReply = async (content: string) => {
    if (!activeThread || !content.trim()) return;
    
    const reply: ThreadMessage = {
      id: Date.now().toString(),
      roomId: activeRoom?.id || '',
      senderId: 'current-user',
      senderName: 'You',
      content: content.trim(),
      type: 'text',
      timestamp: Date.now(),
      readBy: [],
      reactions: [],
      isEdited: false,
      isPinned: false,
      replyCount: 0,
    };
    
    setThreadMessages(prev => [...prev, reply]);
    setMessages(prev => prev.map(m => 
      m.id === activeThread.id ? { ...m, replyCount: m.replyCount + 1 } : m
    ));
  };
  
  // ==================== Message Editing ====================
  
  const _startEditing = (message: ThreadMessage) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };
  
  const _cancelEditing = () => {
    setEditingMessage(null);
    setEditContent("");
  };
  
  const _saveEdit = (messageId: string) => {
    if (!editContent.trim()) return;
    
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, content: editContent, isEdited: true } : msg
    ));
    setEditingMessage(null);
    setEditContent("");
    toast({ title: "Message edited" });
  };
  
  const _deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    toast({ title: "Message deleted" });
  };
  
  // ==================== Pinning ====================
  
  const _togglePin = (message: ThreadMessage) => {
    setMessages(prev => prev.map(m =>
      m.id === message.id ? { ...m, isPinned: !m.isPinned } : m
    ));
    setPinnedMessages(prev => {
      if (message.isPinned) {
        return prev.filter(m => m.id !== message.id);
      } else {
        return [...prev, { ...message, isPinned: true }];
      }
    });
    toast({ title: message.isPinned ? "Message unpinned" : "Message pinned" });
  };
  
  // ==================== File Handling ====================
  
  const _handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };
  
  const _removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // ==================== Notifications ====================
  
  const _toggleRoomNotifications = (roomId: string) => {
    setRoomNotifications(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
    toast({ 
      title: roomNotifications[roomId] ? "Notifications enabled" : "Notifications muted"
    });
  };
  
  // ==================== Search ====================
  
  const _filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(roomSearch.toLowerCase())
  );
  
  const _searchResults = messageSearch 
    ? messages.filter(m => m.content.toLowerCase().includes(messageSearch.toLowerCase()))
    : [];

  const handleCreateRoom = async () => {
    const name = prompt("Enter room name:");
    if (!name) return;

    try {
      const room = await createRoom(name, 'group', []);
      setRooms([...rooms, room]);
      toast({
        title: "Room Created",
        description: `${name} created successfully`,
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle retry after error
  const handleRetry = useCallback(() => {
    setError(null);
    loadRooms();
  }, [loadRooms]);

  // M5 Loading State
  if (loading) {
    return (
      <AppLayout tier="elite">
        <div className="h-full w-full flex items-center justify-center">
          <LoadingState
            title={t('chat.loading.rooms')}
            description={t('chat.loading.description')}
          />
        </div>
      </AppLayout>
    );
  }

  // M5 Error State
  if (error && rooms.length === 0) {
    return (
      <AppLayout tier="elite">
        <div className="h-full w-full flex items-center justify-center">
          <ErrorState
            title={t('chat.errors.title')}
            description={error}
            onRetry={handleRetry}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout tier="elite">
      <div className="h-full w-full flex">
        {/* Sidebar - Room List */}
        <div className="w-64 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t('chat.title')}
              </h2>
              <Button size="icon" variant="ghost" onClick={handleCreateRoom} aria-label={t('chat.actions.createRoom')}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('common.search')} className="pl-8" aria-label={t('chat.actions.searchChats')} />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {rooms.length === 0 ? (
                <EmptyState
                  title={t('chat.empty.noRooms')}
                  description={t('chat.empty.noRoomsDesc')}
                  icon={<MessageSquare className="h-8 w-8" />}
                  action={{
                    label: t('chat.actions.createRoom'),
                    onClick: handleCreateRoom
                  }}
                />
              ) : (
                rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      activeRoom?.id === room.id
                        ? 'bg-secondary'
                        : 'hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {room.type === 'channel' ? (
                        <Hash className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      <span className="font-medium flex-1">{room.name}</span>
                      {room.unreadCount > 0 && (
                        <Badge variant="default" className="h-5 min-w-5 px-1.5">
                          {room.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {activeRoom.type === 'channel' ? (
                      <Hash className="h-5 w-5" />
                    ) : (
                      <Users className="h-5 w-5" />
                    )}
                    {activeRoom.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {activeRoom.participants.length} members
                  </p>
                </div>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Loading messages...
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No messages yet. Start the conversation!
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          {message.senderName[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-sm">
                              {message.senderName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder={`Message ${activeRoom.name}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                    disabled={sendingMessage}
                  />
                  <Button size="icon" variant="ghost">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()}>
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a room to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
