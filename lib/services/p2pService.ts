/**
 * P2P File Sharing Service - WebRTC peer-to-peer file transfer
 * 
 * @module p2pService
 */

import { invoke } from '@tauri-apps/api/core';

export interface P2PRoom {
  id: string;
  name: string;
  peerId: string;
  peers: number;
  createdAt: number;
}

export interface P2PTransfer {
  id: string;
  roomId: string;
  filename: string;
  filesize: number;
  transferred: number;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  direction: 'send' | 'receive';
  peerName: string;
  speed: number;
  startTime?: number;
  endTime?: number;
}

export interface ICEServer {
  urls: string[];
  username?: string;
  credential?: string;
}

export async function createRoom(name: string): Promise<P2PRoom> {
  return await invoke<P2PRoom>('p2p_create_room', { name });
}

export async function joinRoom(roomId: string, peerName: string): Promise<P2PRoom> {
  return await invoke<P2PRoom>('p2p_join_room', { roomId, peerName });
}

export async function leaveRoom(roomId: string): Promise<void> {
  await invoke<void>('p2p_leave_room', { roomId });
}

export async function sendFile(roomId: string, filePath: string, peerId: string): Promise<string> {
  return await invoke<string>('p2p_send_file', { roomId, filePath, peerId });
}

export async function receiveFile(transferId: string, savePath: string): Promise<void> {
  await invoke<void>('p2p_receive_file', { transferId, savePath });
}

export async function cancelTransfer(transferId: string): Promise<void> {
  await invoke<void>('p2p_cancel_transfer', { transferId });
}

export async function getTransfer(transferId: string): Promise<P2PTransfer> {
  return await invoke<P2PTransfer>('p2p_get_transfer', { transferId });
}

export async function listTransfers(): Promise<P2PTransfer[]> {
  return await invoke<P2PTransfer[]>('p2p_list_transfers');
}

export async function getRoom(roomId: string): Promise<P2PRoom> {
  return await invoke<P2PRoom>('p2p_get_room', { roomId });
}

export async function listRooms(): Promise<P2PRoom[]> {
  return await invoke<P2PRoom[]>('p2p_list_rooms');
}

export async function getICEServers(): Promise<ICEServer[]> {
  return await invoke<ICEServer[]>('p2p_get_ice_servers');
}

export async function getDownloadsDir(): Promise<string> {
  return await invoke<string>('get_downloads_dir');
}

export const p2pService = {
  createRoom,
  joinRoom,
  leaveRoom,
  sendFile,
  receiveFile,
  cancelTransfer,
  getTransfer,
  listTransfers,
  getRoom,
  listRooms,
  getICEServers,
  getDownloadsDir,
};

export default p2pService;
