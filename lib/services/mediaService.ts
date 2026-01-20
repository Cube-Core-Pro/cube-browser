/**
 * Media Services - Screen recording and video processing
 * 
 * @module mediaService
 */

import { invoke } from '@tauri-apps/api/core';

// Screen Recording
export interface Recording {
  id: string;
  filename: string;
  duration: number;
  status: 'recording' | 'paused' | 'stopped';
  startedAt: number;
  filesize?: number;
}

export async function startRecording(options?: { fps?: number; quality?: string }): Promise<string> {
  return await invoke<string>('start_screen_recording', { options });
}

export async function stopRecording(recordingId: string): Promise<string> {
  return await invoke<string>('stop_screen_recording', { recordingId });
}

export async function pauseRecording(recordingId: string): Promise<void> {
  await invoke<void>('pause_screen_recording', { recordingId });
}

export async function resumeRecording(recordingId: string): Promise<void> {
  await invoke<void>('resume_screen_recording', { recordingId });
}

export async function getRecording(recordingId: string): Promise<Recording> {
  return await invoke<Recording>('get_recording_info', { recordingId });
}

// Video Processing
export interface VideoProcessingJob {
  id: string;
  inputPath: string;
  outputPath: string;
  operation: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

export async function extractFrames(videoPath: string, outputDir: string, fps: number = 1): Promise<string[]> {
  return await invoke<string[]>('extract_video_frames', { videoPath, outputDir, fps });
}

export async function compressVideo(inputPath: string, outputPath: string, quality: string = 'medium'): Promise<string> {
  return await invoke<string>('compress_video', { inputPath, outputPath, quality });
}

export async function convertVideo(inputPath: string, outputPath: string, format: string): Promise<string> {
  return await invoke<string>('convert_video_format', { inputPath, outputPath, format });
}

export const mediaService = {
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  getRecording,
  extractFrames,
  compressVideo,
  convertVideo,
};

export default mediaService;
