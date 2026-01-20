/**
 * Chat Service - Real-time messaging
 * 
 * @module chatService
 */

import { invoke } from '@tauri-apps/api/core';

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  participants: string[];
  createdAt: number;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  timestamp: number;
  edited: boolean;
  reactions: Record<string, string[]>;
  readBy: string[];
}

export interface TypingIndicator {
  roomId: string;
  userId: string;
  username: string;
  timestamp: number;
}

export async function createRoom(name: string, type: 'direct' | 'group' | 'channel', participants: string[]): Promise<ChatRoom> {
  return await invoke<ChatRoom>('chat_create_room', { name, roomType: type, participants });
}

export async function joinRoom(roomId: string, userId: string, username: string): Promise<void> {
  await invoke<void>('chat_join_room', { roomId, userId, username });
}

export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  await invoke<void>('chat_leave_room', { roomId, userId });
}

export async function sendMessage(roomId: string, senderId: string, senderName: string, content: string, messageType: 'text' | 'file' | 'image' | 'system' = 'text'): Promise<ChatMessage> {
  return await invoke<ChatMessage>('chat_send_message', { roomId, senderId, senderName, content, messageType });
}

export async function getMessages(roomId: string, limit?: number, before?: number): Promise<ChatMessage[]> {
  return await invoke<ChatMessage[]>('chat_get_messages', { roomId, limit, before });
}

export async function markAsRead(roomId: string, userId: string, messageId: string): Promise<void> {
  await invoke<void>('chat_mark_as_read', { roomId, userId, messageId });
}

export async function addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
  await invoke<void>('chat_add_reaction', { messageId, userId, emoji });
}

export async function removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
  await invoke<void>('chat_remove_reaction', { messageId, userId, emoji });
}

export async function editMessage(messageId: string, newContent: string): Promise<ChatMessage> {
  return await invoke<ChatMessage>('chat_edit_message', { messageId, newContent });
}

export async function deleteMessage(messageId: string): Promise<void> {
  await invoke<void>('chat_delete_message', { messageId });
}

export async function setTyping(roomId: string, userId: string, username: string, typing: boolean): Promise<void> {
  await invoke<void>('chat_set_typing', { roomId, userId, username, typing });
}

export async function getTypingIndicators(roomId: string): Promise<TypingIndicator[]> {
  return await invoke<TypingIndicator[]>('chat_get_typing_indicators', { roomId });
}

export async function getRoom(roomId: string): Promise<ChatRoom> {
  return await invoke<ChatRoom>('chat_get_room', { roomId });
}

export async function listRooms(userId?: string): Promise<ChatRoom[]> {
  // userId is required by the backend - default to 'current-user' if not provided
  const effectiveUserId = userId || 'current-user';
  return await invoke<ChatRoom[]>('chat_list_rooms', { userId: effectiveUserId });
}

export async function searchMessages(roomId: string, query: string): Promise<ChatMessage[]> {
  return await invoke<ChatMessage[]>('chat_search_messages', { roomId, query });
}

export async function updateStatus(userId: string, status: 'online' | 'away' | 'busy' | 'offline'): Promise<void> {
  await invoke<void>('chat_update_status', { userId, status });
}

export const chatService = {
  createRoom,
  joinRoom,
  leaveRoom,
  sendMessage,
  getMessages,
  markAsRead,
  addReaction,
  removeReaction,
  editMessage,
  deleteMessage,
  setTyping,
  getTypingIndicators,
  getRoom,
  listRooms,
  searchMessages,
  updateStatus,
};

export default chatService;
