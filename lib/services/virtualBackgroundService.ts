/**
 * Virtual Background Service
 * Uses Canvas API and image segmentation for real-time background replacement
 * CUBE Nexum - Enterprise Video Conferencing
 * 
 * Now integrated with Tauri backend for:
 * - Video information extraction
 * - Frame extraction for analysis
 * - AI-powered frame analysis
 * - Temporary file management
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('VirtualBackground');

// ============================================================================
// Backend Integration Types
// ============================================================================

interface BackendVideoInfo {
  width: number;
  height: number;
  duration: number;
  fps: number;
  bitrate: number;
  codec?: string;
}

interface BackendExtractionResult {
  output_directory: string;
  frame_count: number;
  frames: string[];
  video_info: BackendVideoInfo;
}

interface BackendFrameAnalysis {
  frame_path: string;
  features: string[];
  ai_description?: string;
  confidence: number;
}

const BackendVideoProcessingAPI = {
  async getVideoInfo(videoPath: string): Promise<BackendVideoInfo> {
    try {
      return await invoke<BackendVideoInfo>('get_video_info', { videoPath });
    } catch (error) {
      log.warn('Backend get_video_info failed:', error);
      throw error;
    }
  },

  async extractFrames(
    videoPath: string,
    fps?: number,
    quality?: number,
    outputFormat?: string,
    startTime?: number,
    duration?: number
  ): Promise<BackendExtractionResult> {
    try {
      return await invoke<BackendExtractionResult>('extract_video_frames', {
        videoPath,
        fps,
        quality,
        outputFormat,
        startTime,
        duration,
      });
    } catch (error) {
      log.warn('Backend extract_video_frames failed:', error);
      throw error;
    }
  },

  async cleanupFrames(outputDirectory: string): Promise<void> {
    try {
      await invoke<void>('cleanup_video_frames', { outputDirectory });
    } catch (error) {
      log.warn('Backend cleanup_video_frames failed:', error);
    }
  },

  async getTempDir(): Promise<string> {
    try {
      return await invoke<string>('get_video_temp_dir');
    } catch (error) {
      log.warn('Backend get_video_temp_dir failed:', error);
      return '';
    }
  },

  async analyzeFrames(frames: string[], analysisPrompt?: string): Promise<BackendFrameAnalysis[]> {
    try {
      return await invoke<BackendFrameAnalysis[]>('analyze_video_frames', {
        frames,
        analysisPrompt,
      });
    } catch (error) {
      log.warn('Backend analyze_video_frames failed:', error);
      return [];
    }
  },
};

// Export backend API
export { BackendVideoProcessingAPI };
export type { BackendVideoInfo, BackendExtractionResult, BackendFrameAnalysis };

// ============================================================================
// Types and Enums
// ============================================================================

// Enum for background types (used by page-pro.tsx)
export enum BackgroundType {
  NONE = 'none',
  BLUR = 'blur',
  IMAGE = 'image',
  COLOR = 'color',
  VIDEO = 'video'
}

// Config interface for background settings
export interface BackgroundConfig {
  type: BackgroundType;
  blurStrength?: number;
  color?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface VirtualBackground {
  id: string;
  name: string;
  type: BackgroundType;
  value?: string; // URL for image, hex for color, blur level for blur
  thumbnail?: string;
}

export const DEFAULT_BACKGROUNDS: VirtualBackground[] = [
  { id: 'none', name: 'None', type: BackgroundType.NONE },
  { id: 'blur-light', name: 'Slight Blur', type: BackgroundType.BLUR, value: '5' },
  { id: 'blur-medium', name: 'Blur', type: BackgroundType.BLUR, value: '10' },
  { id: 'blur-heavy', name: 'Heavy Blur', type: BackgroundType.BLUR, value: '20' },
  { id: 'color-dark', name: 'Dark', type: BackgroundType.COLOR, value: '#1a1a2e' },
  { id: 'color-blue', name: 'Blue', type: BackgroundType.COLOR, value: '#0a192f' },
  { id: 'color-green', name: 'Green Screen', type: BackgroundType.COLOR, value: '#00b140' },
  { id: 'office', name: 'Office', type: BackgroundType.IMAGE, value: '/backgrounds/office.jpg' },
  { id: 'nature', name: 'Nature', type: BackgroundType.IMAGE, value: '/backgrounds/nature.jpg' },
  { id: 'space', name: 'Space', type: BackgroundType.IMAGE, value: '/backgrounds/space.jpg' },
  { id: 'beach', name: 'Beach', type: BackgroundType.IMAGE, value: '/backgrounds/beach.jpg' },
  { id: 'city', name: 'City', type: BackgroundType.IMAGE, value: '/backgrounds/city.jpg' },
];

interface SegmentationModel {
  segment: (input: ImageData) => Promise<ImageData>;
}

export class VirtualBackgroundService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private outputCanvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private outputCtx: CanvasRenderingContext2D | null = null;
  private currentBackground: VirtualBackground = DEFAULT_BACKGROUNDS[0];
  private backgroundImage: HTMLImageElement | null = null;
  private isProcessing = false;
  private animationFrameId: number | null = null;
  private segmentationModel: SegmentationModel | null = null;
  private useSimpleSegmentation = true; // Fallback when ML model not available
  
  // Color detection thresholds for simple segmentation
  private skinColorRanges = {
    minH: 0, maxH: 50,
    minS: 20, maxS: 255,
    minV: 70, maxV: 255,
  };

  constructor() {
    // Initialize canvas elements
    this.canvasElement = document.createElement('canvas');
    this.outputCanvas = document.createElement('canvas');
    this.ctx = this.canvasElement.getContext('2d', { willReadFrequently: true });
    this.outputCtx = this.outputCanvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Initialize the service with a video element
   */
  async initialize(videoElement: HTMLVideoElement): Promise<HTMLCanvasElement> {
    this.videoElement = videoElement;
    
    // Set canvas dimensions to match video
    const width = videoElement.videoWidth || 640;
    const height = videoElement.videoHeight || 480;
    
    if (this.canvasElement) {
      this.canvasElement.width = width;
      this.canvasElement.height = height;
    }
    
    if (this.outputCanvas) {
      this.outputCanvas.width = width;
      this.outputCanvas.height = height;
    }

    // Try to load ML segmentation model
    try {
      await this.loadSegmentationModel();
      this.useSimpleSegmentation = false;
      log.debug('[VirtualBG] ML segmentation model loaded');
    } catch (error) {
      log.warn('[VirtualBG] ML model not available, using simple segmentation:', error);
      this.useSimpleSegmentation = true;
    }

    return this.outputCanvas!;
  }

  /**
   * Load TensorFlow.js body segmentation model (if available)
   */
  private async loadSegmentationModel(): Promise<void> {
    // Check if TensorFlow.js is available
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).tf) {
      // Model loading would go here
      // For now, we'll use simple segmentation
      throw new Error('TensorFlow.js model not configured');
    }
    throw new Error('TensorFlow.js not available');
  }

  /**
   * Set the virtual background
   */
  async setBackground(background: VirtualBackground): Promise<void> {
    this.currentBackground = background;

    if (background.type === 'image' && background.value) {
      await this.loadBackgroundImage(background.value);
    } else {
      this.backgroundImage = null;
    }

    log.debug(`[VirtualBG] Background set to: ${background.name}`);
  }

  /**
   * Load a background image
   */
  private loadBackgroundImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.backgroundImage = img;
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Start processing video frames
   */
  startProcessing(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.processFrame();
    log.debug('[VirtualBG] Processing started');
  }

  /**
   * Stop processing video frames
   */
  stopProcessing(): void {
    this.isProcessing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    log.debug('[VirtualBG] Processing stopped');
  }

  /**
   * Process a single video frame
   */
  private processFrame = (): void => {
    if (!this.isProcessing || !this.videoElement || !this.ctx || !this.outputCtx) {
      return;
    }

    const video = this.videoElement;
    const canvas = this.canvasElement!;
    const outputCanvas = this.outputCanvas!;

    // Ensure canvas size matches video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
    }

    // Draw current video frame to processing canvas
    this.ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply background based on type
    if (this.currentBackground.type === 'none') {
      // No processing needed, just copy
      this.outputCtx.drawImage(canvas, 0, 0);
    } else if (this.currentBackground.type === 'blur') {
      this.applyBlurBackground();
    } else if (this.currentBackground.type === 'image' || this.currentBackground.type === 'color') {
      this.applyReplacementBackground();
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.processFrame);
  };

  /**
   * Apply blur background effect
   */
  private applyBlurBackground(): void {
    if (!this.ctx || !this.outputCtx || !this.canvasElement || !this.outputCanvas) return;

    const blurAmount = parseInt(this.currentBackground.value || '10', 10);
    
    // Get image data for segmentation
    const imageData = this.ctx.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);
    const mask = this.createPersonMask(imageData);

    // Draw blurred background
    this.outputCtx.filter = `blur(${blurAmount}px)`;
    this.outputCtx.drawImage(this.canvasElement, 0, 0);
    this.outputCtx.filter = 'none';

    // Get blurred image data
    const blurredData = this.outputCtx.getImageData(0, 0, this.outputCanvas.width, this.outputCanvas.height);
    
    // Get original image data
    const originalData = this.ctx.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);

    // Combine: use original where person is detected, blurred elsewhere
    const result = this.combineWithMask(originalData, blurredData, mask);
    this.outputCtx.putImageData(result, 0, 0);
  }

  /**
   * Apply image or color background replacement
   */
  private applyReplacementBackground(): void {
    if (!this.ctx || !this.outputCtx || !this.canvasElement || !this.outputCanvas) return;

    // Get image data for segmentation
    const imageData = this.ctx.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);
    const mask = this.createPersonMask(imageData);

    // Draw background first
    if (this.currentBackground.type === 'image' && this.backgroundImage) {
      // Draw image background, scaling to fit
      this.outputCtx.drawImage(
        this.backgroundImage, 
        0, 0, 
        this.outputCanvas.width, 
        this.outputCanvas.height
      );
    } else if (this.currentBackground.type === 'color') {
      // Draw solid color background
      this.outputCtx.fillStyle = this.currentBackground.value || '#1a1a2e';
      this.outputCtx.fillRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
    }

    // Get background image data
    const bgData = this.outputCtx.getImageData(0, 0, this.outputCanvas.width, this.outputCanvas.height);
    
    // Get original image data
    const originalData = this.ctx.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);

    // Combine: use original where person is detected, background elsewhere
    const result = this.combineWithMask(originalData, bgData, mask);
    this.outputCtx.putImageData(result, 0, 0);
  }

  /**
   * Create a mask for person segmentation
   * Uses color-based detection when ML model is not available
   */
  private createPersonMask(imageData: ImageData): Uint8ClampedArray {
    const { width, height, data } = imageData;
    const mask = new Uint8ClampedArray(width * height);

    if (this.useSimpleSegmentation) {
      // Simple color-based segmentation
      // Detect skin tones and clothing colors
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert RGB to HSV for better skin detection
        const hsv = this.rgbToHsv(r, g, b);
        
        // Check if pixel matches skin color range
        const isSkin = this.isSkinColor(hsv.h, hsv.s, hsv.v);
        
        // Also detect based on contrast with background
        const pixelIndex = i / 4;
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Combine skin detection with luminance-based detection
        // Assumes person is in center of frame with different characteristics than background
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        const distFromCenter = Math.sqrt(
          Math.pow((x - width / 2) / (width / 2), 2) + 
          Math.pow((y - height / 2) / (height / 2), 2)
        );
        
        // Weight by distance from center (person usually in center)
        const centerWeight = Math.max(0, 1 - distFromCenter * 0.7);
        
        // Final mask value (0-255)
        if (isSkin) {
          mask[pixelIndex] = 255;
        } else if (centerWeight > 0.3 && luminance > 30 && luminance < 230) {
          mask[pixelIndex] = Math.floor(centerWeight * 180);
        } else {
          mask[pixelIndex] = 0;
        }
      }

      // Apply morphological operations to clean up mask
      this.smoothMask(mask, width, height);
    }

    return mask;
  }

  /**
   * Check if HSV color is within skin tone range
   */
  private isSkinColor(h: number, s: number, v: number): boolean {
    return (
      h >= this.skinColorRanges.minH && h <= this.skinColorRanges.maxH &&
      s >= this.skinColorRanges.minS && s <= this.skinColorRanges.maxS &&
      v >= this.skinColorRanges.minV && v <= this.skinColorRanges.maxV
    );
  }

  /**
   * Convert RGB to HSV color space
   */
  private rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: h * 360,
      s: s * 255,
      v: v * 255,
    };
  }

  /**
   * Apply smoothing to the mask using a simple box blur
   */
  private smoothMask(mask: Uint8ClampedArray, width: number, height: number): void {
    const kernelSize = 5;
    const halfKernel = Math.floor(kernelSize / 2);
    const tempMask = new Uint8ClampedArray(mask);

    for (let y = halfKernel; y < height - halfKernel; y++) {
      for (let x = halfKernel; x < width - halfKernel; x++) {
        let sum = 0;
        let count = 0;

        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const idx = (y + ky) * width + (x + kx);
            sum += tempMask[idx];
            count++;
          }
        }

        mask[y * width + x] = Math.floor(sum / count);
      }
    }

    // Apply threshold to create cleaner edges
    for (let i = 0; i < mask.length; i++) {
      mask[i] = mask[i] > 100 ? 255 : mask[i] < 50 ? 0 : mask[i];
    }
  }

  /**
   * Combine two image data arrays using a mask
   */
  private combineWithMask(
    foreground: ImageData, 
    background: ImageData, 
    mask: Uint8ClampedArray
  ): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(foreground.data),
      foreground.width,
      foreground.height
    );

    for (let i = 0; i < mask.length; i++) {
      const dataIndex = i * 4;
      const alpha = mask[i] / 255;

      // Blend foreground and background based on mask
      result.data[dataIndex] = Math.floor(
        foreground.data[dataIndex] * alpha + background.data[dataIndex] * (1 - alpha)
      );
      result.data[dataIndex + 1] = Math.floor(
        foreground.data[dataIndex + 1] * alpha + background.data[dataIndex + 1] * (1 - alpha)
      );
      result.data[dataIndex + 2] = Math.floor(
        foreground.data[dataIndex + 2] * alpha + background.data[dataIndex + 2] * (1 - alpha)
      );
      result.data[dataIndex + 3] = 255; // Full opacity
    }

    return result;
  }

  /**
   * Get the output canvas stream
   */
  getOutputStream(): MediaStream | null {
    if (!this.outputCanvas) return null;
    return this.outputCanvas.captureStream(30); // 30 FPS
  }

  /**
   * Create a processed stream from input stream with background applied
   * This is the main entry point for applying virtual backgrounds
   */
  async createProcessedStream(
    inputStream: MediaStream, 
    config: BackgroundConfig
  ): Promise<MediaStream> {
    // Create a video element to play the input stream
    const video = document.createElement('video');
    video.srcObject = inputStream;
    video.muted = true;
    video.playsInline = true;
    
    // Wait for video to load
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });

    // Initialize with the video element
    await this.initialize(video);

    // Set background based on config
    let background: VirtualBackground;
    switch (config.type) {
      case BackgroundType.NONE:
        background = { id: 'none', name: 'None', type: BackgroundType.NONE };
        break;
      case BackgroundType.BLUR:
        background = { 
          id: 'blur', 
          name: 'Blur', 
          type: BackgroundType.BLUR, 
          value: String(config.blurStrength || 10) 
        };
        break;
      case BackgroundType.COLOR:
        background = { 
          id: 'color', 
          name: 'Color', 
          type: BackgroundType.COLOR, 
          value: config.color || '#1a1a24' 
        };
        break;
      case BackgroundType.IMAGE:
        background = { 
          id: 'image', 
          name: 'Image', 
          type: BackgroundType.IMAGE, 
          value: config.imageUrl || '' 
        };
        break;
      case BackgroundType.VIDEO:
        // For video backgrounds, we'd need additional handling
        background = { id: 'none', name: 'None', type: BackgroundType.NONE };
        break;
      default:
        background = { id: 'none', name: 'None', type: BackgroundType.NONE };
    }

    await this.setBackground(background);
    
    // Start processing
    this.startProcessing();

    // Get the output stream
    const outputStream = this.getOutputStream();
    if (!outputStream) {
      throw new Error('Failed to create output stream');
    }

    // Copy audio tracks from input to output
    inputStream.getAudioTracks().forEach(track => {
      outputStream.addTrack(track);
    });

    return outputStream;
  }

  /**
   * Clean up all resources (alias for dispose for compatibility)
   */
  cleanup(): void {
    this.dispose();
  }

  /**
   * Get current background
   */
  getCurrentBackground(): VirtualBackground {
    return this.currentBackground;
  }

  /**
   * Get available backgrounds
   */
  getAvailableBackgrounds(): VirtualBackground[] {
    return DEFAULT_BACKGROUNDS;
  }

  /**
   * Add custom background image
   */
  async addCustomBackground(name: string, imageUrl: string): Promise<VirtualBackground> {
    const background: VirtualBackground = {
      id: `custom-${Date.now()}`,
      name,
      type: BackgroundType.IMAGE,
      value: imageUrl,
      thumbnail: imageUrl,
    };

    DEFAULT_BACKGROUNDS.push(background);
    return background;
  }

  /**
   * Remove custom background
   */
  removeCustomBackground(id: string): boolean {
    const index = DEFAULT_BACKGROUNDS.findIndex(bg => bg.id === id);
    if (index > -1 && DEFAULT_BACKGROUNDS[index].id.startsWith('custom-')) {
      DEFAULT_BACKGROUNDS.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopProcessing();
    this.videoElement = null;
    this.canvasElement = null;
    this.outputCanvas = null;
    this.ctx = null;
    this.outputCtx = null;
    this.backgroundImage = null;
    this.segmentationModel = null;
  }
}

// Singleton instance
let virtualBackgroundServiceInstance: VirtualBackgroundService | null = null;

export function getVirtualBackgroundService(): VirtualBackgroundService {
  if (!virtualBackgroundServiceInstance) {
    virtualBackgroundServiceInstance = new VirtualBackgroundService();
  }
  return virtualBackgroundServiceInstance;
}

export default VirtualBackgroundService;
