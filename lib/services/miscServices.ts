/**
 * Remaining Services - VoIP, Downloads, Native Messaging
 * 
 * @module miscServices
 */

import { invoke } from '@tauri-apps/api/core';

// VoIP Service
export interface VoIPCall {
  id: string;
  peerId: string;
  peerName: string;
  status: 'calling' | 'ringing' | 'active' | 'ended';
  direction: 'incoming' | 'outgoing';
  startedAt?: number;
  endedAt?: number;
}

export async function initiateCall(peerId: string, peerName: string, audio: boolean = true, video: boolean = false): Promise<string> {
  return await invoke<string>('voip_initiate_call', { peerId, peerName, audio, video });
}

export async function answerCall(callId: string): Promise<void> {
  await invoke<void>('voip_answer_call', { callId });
}

export async function endCall(callId: string): Promise<void> {
  await invoke<void>('voip_end_call', { callId });
}

export async function toggleCallAudio(callId: string, enabled: boolean): Promise<void> {
  await invoke<void>('voip_toggle_audio', { callId, enabled });
}

export async function toggleCallVideo(callId: string, enabled: boolean): Promise<void> {
  await invoke<void>('voip_toggle_video', { callId, enabled });
}

export async function getActiveCalls(): Promise<VoIPCall[]> {
  return await invoke<VoIPCall[]>('voip_get_active_calls');
}

// Download Manager
export interface Download {
  id: string;
  url: string;
  filename: string;
  savePath: string;
  totalBytes: number;
  downloadedBytes: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed';
  speed: number;
  startedAt: number;
}

export async function startDownload(url: string, savePath: string): Promise<string> {
  return await invoke<string>('start_download', { url, savePath });
}

export async function pauseDownload(downloadId: string): Promise<void> {
  await invoke<void>('pause_download', { downloadId });
}

export async function resumeDownload(downloadId: string): Promise<void> {
  await invoke<void>('resume_download', { downloadId });
}

export async function cancelDownload(downloadId: string): Promise<void> {
  await invoke<void>('cancel_download', { downloadId });
}

export async function getDownloads(): Promise<Download[]> {
  return await invoke<Download[]>('get_all_downloads');
}

export async function getDownload(downloadId: string): Promise<Download> {
  return await invoke<Download>('get_download_info', { downloadId });
}

// Native Messaging
export async function sendNativeMessage(extensionId: string, message: unknown): Promise<unknown> {
  return await invoke<unknown>('send_native_message', { extensionId, message });
}

export async function registerNativeHost(hostName: string, executable: string): Promise<void> {
  await invoke<void>('register_native_host', { hostName, executable });
}

export async function unregisterNativeHost(hostName: string): Promise<void> {
  await invoke<void>('unregister_native_host', { hostName });
}

// Legacy VoIP service (kept for backwards compatibility)
// Use voipService from './voipService' for new implementations
export const voipServiceLegacy = {
  initiateCall,
  answerCall,
  endCall,
  toggleCallAudio,
  toggleCallVideo,
  getActiveCalls,
};

export const downloadService = {
  startDownload,
  pauseDownload,
  resumeDownload,
  cancelDownload,
  getDownloads,
  getDownload,
};

export const nativeMessagingService = {
  sendNativeMessage,
  registerNativeHost,
  unregisterNativeHost,
};

const miscServices = {
  voipLegacy: voipServiceLegacy,
  downloads: downloadService,
  nativeMessaging: nativeMessagingService,
};

export default miscServices;
