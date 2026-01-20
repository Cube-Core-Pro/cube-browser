/**
 * Video Conference Service - WebRTC video calls
 * 
 * @module videoConferenceService
 */

import { invoke } from '@tauri-apps/api/core';

export interface ConferenceRoom {
  id: string;
  name: string;
  host: string;
  participants: number;
  maxParticipants: number;
  recording: boolean;
  createdAt: number;
}

export interface Participant {
  id: string;
  name: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  joinedAt: number;
}

export interface MediaStream {
  participantId: string;
  type: 'camera' | 'screen';
  enabled: boolean;
}

export interface ConferenceStats {
  roomId: string;
  participantId: string;
  videoBitrate: number;
  audioBitrate: number;
  packetLoss: number;
  latency: number;
}

export async function createRoom(name: string, hostName: string, maxParticipants: number = 10): Promise<ConferenceRoom> {
  return await invoke<ConferenceRoom>('conference_create_room', { name, hostName, maxParticipants });
}

export async function joinRoom(roomId: string, participantId: string, participantName: string): Promise<void> {
  await invoke<void>('conference_join_room', { roomId, participantId, participantName });
}

export async function leaveRoom(roomId: string, participantId: string): Promise<void> {
  await invoke<void>('conference_leave_room', { roomId, participantId });
}

export async function toggleAudio(roomId: string, participantId: string, enabled: boolean): Promise<void> {
  await invoke<void>('conference_toggle_audio', { roomId, participantId, enabled });
}

export async function toggleVideo(roomId: string, participantId: string, enabled: boolean): Promise<void> {
  await invoke<void>('conference_toggle_video', { roomId, participantId, enabled });
}

export async function startScreenShare(roomId: string, participantId: string): Promise<void> {
  await invoke<void>('conference_start_screen_share', { roomId, participantId });
}

export async function stopScreenShare(roomId: string, participantId: string): Promise<void> {
  await invoke<void>('conference_stop_screen_share', { roomId, participantId });
}

export async function toggleHand(roomId: string, participantId: string, raised: boolean): Promise<void> {
  await invoke<void>('conference_toggle_hand', { roomId, participantId, raised });
}

export async function startRecording(roomId: string, outputPath: string): Promise<void> {
  await invoke<void>('conference_start_recording', { roomId, outputPath });
}

export async function stopRecording(roomId: string): Promise<string> {
  return await invoke<string>('conference_stop_recording', { roomId });
}

export async function getRoom(roomId: string): Promise<ConferenceRoom> {
  return await invoke<ConferenceRoom>('conference_get_room', { roomId });
}

export async function listRooms(): Promise<ConferenceRoom[]> {
  return await invoke<ConferenceRoom[]>('conference_list_rooms');
}

export async function getParticipants(roomId: string): Promise<Participant[]> {
  return await invoke<Participant[]>('conference_get_participants', { roomId });
}

export async function getStreams(roomId: string): Promise<MediaStream[]> {
  return await invoke<MediaStream[]>('conference_get_streams', { roomId });
}

export async function updateStats(roomId: string, participantId: string, stats: Partial<ConferenceStats>): Promise<void> {
  await invoke<void>('conference_update_stats', { roomId, participantId, stats });
}

export async function getICEServers(): Promise<unknown[]> {
  return await invoke<unknown[]>('conference_get_ice_servers');
}

export const videoConferenceService = {
  createRoom,
  joinRoom,
  leaveRoom,
  toggleAudio,
  toggleVideo,
  startScreenShare,
  stopScreenShare,
  toggleHand,
  startRecording,
  stopRecording,
  getRoom,
  listRooms,
  getParticipants,
  getStreams,
  updateStats,
  getICEServers,
};

export default videoConferenceService;
