'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Scissors, Copy, Trash2, Download, Upload, Type, 
  Music, Mic, Wand2, Sparkles, Film,
  RotateCcw, RotateCw, FlipHorizontal,
  ZoomIn, ZoomOut, Square, Circle, Triangle, Star,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Palette, Droplet, Sun, Contrast,
  RefreshCw, Plus, Minus,
  ChevronLeft,
  Settings, Share2, Eye,
  Grid, Crosshair, Magnet
} from 'lucide-react';
import './VideoShortsCreator.css';

// Types
interface VideoClip {
  id: string;
  source: string;
  thumbnail: string;
  duration: number;
  startTime: number;
  endTime: number;
  position: number;
  volume: number;
  speed: number;
  filters: VideoFilter[];
  transform: Transform;
}

interface VideoFilter {
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'grayscale' | 'sepia' | 'hue-rotate';
  value: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}

interface TextOverlay {
  id: string;
  text: string;
  font: string;
  size: number;
  color: string;
  backgroundColor?: string;
  x: number;
  y: number;
  startTime: number;
  endTime: number;
  animation: TextAnimation;
  style: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    alignment: 'left' | 'center' | 'right';
  };
}

interface TextAnimation {
  type: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'bounce' | 'typewriter' | 'zoom' | 'shake' | 'highlight';
  duration: number;
  delay: number;
}

interface AudioTrack {
  id: string;
  name: string;
  source: string;
  duration: number;
  volume: number;
  startTime: number;
  trimStart: number;
  trimEnd: number;
  fadeIn: number;
  fadeOut: number;
  isMuted: boolean;
}

interface StickerOverlay {
  id: string;
  type: 'emoji' | 'gif' | 'shape' | 'icon';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  startTime: number;
  endTime: number;
  animation: string;
}

interface ProjectSettings {
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '4:3';
  resolution: '720p' | '1080p' | '4K';
  fps: 24 | 30 | 60;
  backgroundColor: string;
  duration: number;
}

// Animation presets
const TEXT_ANIMATIONS = [
  { type: 'none', label: 'None', icon: '—' },
  { type: 'fade', label: 'Fade', icon: '🌫️' },
  { type: 'slide-up', label: 'Slide Up', icon: '⬆️' },
  { type: 'slide-down', label: 'Slide Down', icon: '⬇️' },
  { type: 'bounce', label: 'Bounce', icon: '🔵' },
  { type: 'typewriter', label: 'Typewriter', icon: '⌨️' },
  { type: 'zoom', label: 'Zoom', icon: '🔍' },
  { type: 'shake', label: 'Shake', icon: '📳' },
  { type: 'highlight', label: 'Highlight', icon: '✨' },
];

// Font presets
const FONTS = [
  { name: 'Impact', style: 'bold' },
  { name: 'Montserrat', style: 'modern' },
  { name: 'Roboto', style: 'clean' },
  { name: 'Bebas Neue', style: 'display' },
  { name: 'Poppins', style: 'friendly' },
  { name: 'Oswald', style: 'strong' },
  { name: 'Playfair Display', style: 'elegant' },
  { name: 'Comic Sans MS', style: 'casual' },
];

// Filter presets
const FILTER_PRESETS = [
  { name: 'Original', filters: [] },
  { name: 'Vibrant', filters: [{ type: 'saturation' as const, value: 140 }, { type: 'contrast' as const, value: 110 }] },
  { name: 'Moody', filters: [{ type: 'saturation' as const, value: 80 }, { type: 'contrast' as const, value: 120 }, { type: 'brightness' as const, value: 90 }] },
  { name: 'Vintage', filters: [{ type: 'sepia' as const, value: 40 }, { type: 'contrast' as const, value: 90 }] },
  { name: 'B&W', filters: [{ type: 'grayscale' as const, value: 100 }] },
  { name: 'Warm', filters: [{ type: 'hue-rotate' as const, value: -15 }, { type: 'saturation' as const, value: 120 }] },
  { name: 'Cool', filters: [{ type: 'hue-rotate' as const, value: 15 }, { type: 'saturation' as const, value: 110 }] },
  { name: 'Dreamy', filters: [{ type: 'blur' as const, value: 1 }, { type: 'brightness' as const, value: 110 }] },
];

// Trending sounds mock data
const TRENDING_SOUNDS = [
  { id: '1', name: 'Aesthetic Vibes', artist: 'LoFi Producer', uses: '2.5M', duration: 30, category: 'lofi' },
  { id: '2', name: 'Viral Beat 2024', artist: 'TrendMaster', uses: '5.1M', duration: 15, category: 'trending' },
  { id: '3', name: 'Emotional Piano', artist: 'Cinematic Sounds', uses: '1.8M', duration: 45, category: 'emotional' },
  { id: '4', name: 'Comedy Timing', artist: 'Sound FX Lab', uses: '3.2M', duration: 10, category: 'comedy' },
  { id: '5', name: 'Hype Energy', artist: 'Bass Drop', uses: '4.7M', duration: 20, category: 'energetic' },
  { id: '6', name: 'Chill Sunset', artist: 'Ambient World', uses: '890K', duration: 60, category: 'ambient' },
];

export const VideoShortsCreator: React.FC = () => {
  // Project state
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    aspectRatio: '9:16',
    resolution: '1080p',
    fps: 30,
    backgroundColor: '#000000',
    duration: 0,
  });

  // Timeline state
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stickers, setStickers] = useState<StickerOverlay[]>([]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // UI state
  const [activePanel, setActivePanel] = useState<'media' | 'text' | 'audio' | 'effects' | 'stickers' | 'settings'>('media');
  const [selectedElement, setSelectedElement] = useState<{ type: string; id: string } | null>(null);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(100);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total duration
  useEffect(() => {
    const maxClipEnd = Math.max(...clips.map(c => c.position + (c.endTime - c.startTime)), 0);
    const maxTextEnd = Math.max(...textOverlays.map(t => t.endTime), 0);
    const maxAudioEnd = Math.max(...audioTracks.map(a => a.startTime + (a.trimEnd - a.trimStart)), 0);
    
    setProjectSettings(prev => ({
      ...prev,
      duration: Math.max(maxClipEnd, maxTextEnd, maxAudioEnd, prev.duration)
    }));
  }, [clips, textOverlays, audioTracks]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      
      if (file.type.startsWith('video/')) {
        // Get video metadata
        const video = document.createElement('video');
        video.src = url;
        
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            const thumbnail = generateVideoThumbnail(video);
            
            const newClip: VideoClip = {
              id: crypto.randomUUID(),
              source: url,
              thumbnail,
              duration: video.duration,
              startTime: 0,
              endTime: video.duration,
              position: projectSettings.duration,
              volume: 100,
              speed: 1,
              filters: [],
              transform: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false }
            };
            
            setClips(prev => [...prev, newClip]);
            resolve();
          };
        });
      } else if (file.type.startsWith('audio/')) {
        const audio = document.createElement('audio');
        audio.src = url;
        
        await new Promise<void>((resolve) => {
          audio.onloadedmetadata = () => {
            const newAudio: AudioTrack = {
              id: crypto.randomUUID(),
              name: file.name,
              source: url,
              duration: audio.duration,
              volume: 100,
              startTime: 0,
              trimStart: 0,
              trimEnd: audio.duration,
              fadeIn: 0,
              fadeOut: 0,
              isMuted: false
            };
            
            setAudioTracks(prev => [...prev, newAudio]);
            resolve();
          };
        });
      }
    }
  }, [projectSettings.duration]);

  // Generate video thumbnail
  const generateVideoThumbnail = (video: HTMLVideoElement): string => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    return canvas.toDataURL();
  };

  // Add text overlay
  const addTextOverlay = useCallback(() => {
    const newText: TextOverlay = {
      id: crypto.randomUUID(),
      text: 'Your text here',
      font: 'Impact',
      size: 48,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      x: 50,
      y: 50,
      startTime: currentTime,
      endTime: currentTime + 3,
      animation: { type: 'none', duration: 0.5, delay: 0 },
      style: { bold: false, italic: false, underline: false, alignment: 'center' }
    };
    
    setTextOverlays(prev => [...prev, newText]);
    setSelectedElement({ type: 'text', id: newText.id });
  }, [currentTime]);

  // AI Caption Generator
  const generateAICaptions = useCallback(async () => {
    setIsGeneratingCaptions(true);
    
    // Simulate AI caption generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock generated captions
    const mockCaptions: TextOverlay[] = [
      {
        id: crypto.randomUUID(),
        text: 'Hey everyone!',
        font: 'Impact',
        size: 40,
        color: '#FFFFFF',
        backgroundColor: '#00000080',
        x: 50,
        y: 80,
        startTime: 0,
        endTime: 2,
        animation: { type: 'fade', duration: 0.3, delay: 0 },
        style: { bold: true, italic: false, underline: false, alignment: 'center' }
      },
      {
        id: crypto.randomUUID(),
        text: 'Check this out! 🔥',
        font: 'Impact',
        size: 40,
        color: '#FFFFFF',
        backgroundColor: '#00000080',
        x: 50,
        y: 80,
        startTime: 2,
        endTime: 4,
        animation: { type: 'bounce', duration: 0.3, delay: 0 },
        style: { bold: true, italic: false, underline: false, alignment: 'center' }
      },
      {
        id: crypto.randomUUID(),
        text: 'This is going to blow your mind',
        font: 'Impact',
        size: 36,
        color: '#FFD700',
        backgroundColor: '#00000080',
        x: 50,
        y: 80,
        startTime: 4,
        endTime: 7,
        animation: { type: 'highlight', duration: 0.5, delay: 0 },
        style: { bold: true, italic: false, underline: false, alignment: 'center' }
      }
    ];
    
    setTextOverlays(prev => [...prev, ...mockCaptions]);
    setIsGeneratingCaptions(false);
  }, []);

  // Apply filter preset
  const applyFilterPreset = useCallback((presetName: string) => {
    if (!selectedElement || selectedElement.type !== 'clip') return;
    
    const preset = FILTER_PRESETS.find(p => p.name === presetName);
    if (!preset) return;
    
    setClips(prev => prev.map(clip => 
      clip.id === selectedElement.id 
        ? { ...clip, filters: preset.filters }
        : clip
    ));
  }, [selectedElement]);

  // Timeline scrub
  const handleTimelineScrub = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * projectSettings.duration;
    
    setCurrentTime(Math.max(0, Math.min(newTime, projectSettings.duration)));
  }, [projectSettings.duration]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Get aspect ratio dimensions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAspectRatioDimensions = (): { width: number; height: number } => {
    switch (projectSettings.aspectRatio) {
      case '9:16': return { width: 1080, height: 1920 };
      case '16:9': return { width: 1920, height: 1080 };
      case '1:1': return { width: 1080, height: 1080 };
      case '4:5': return { width: 1080, height: 1350 };
      case '4:3': return { width: 1440, height: 1080 };
      default: return { width: 1080, height: 1920 };
    }
  };

  return (
    <div className="video-shorts-creator">
      {/* Top Toolbar */}
      <div className="vsc-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn" onClick={() => window.history.back()}>
            <ChevronLeft size={18} />
          </button>
          <div className="project-name">
            <input type="text" defaultValue="Untitled Short" />
          </div>
          <span className="auto-save">Auto-saved</span>
        </div>
        
        <div className="toolbar-center">
          <div className="aspect-ratio-selector">
            <button 
              className={projectSettings.aspectRatio === '9:16' ? 'active' : ''}
              onClick={() => setProjectSettings(p => ({ ...p, aspectRatio: '9:16' }))}
            >
              9:16
            </button>
            <button 
              className={projectSettings.aspectRatio === '1:1' ? 'active' : ''}
              onClick={() => setProjectSettings(p => ({ ...p, aspectRatio: '1:1' }))}
            >
              1:1
            </button>
            <button 
              className={projectSettings.aspectRatio === '16:9' ? 'active' : ''}
              onClick={() => setProjectSettings(p => ({ ...p, aspectRatio: '16:9' }))}
            >
              16:9
            </button>
            <button 
              className={projectSettings.aspectRatio === '4:5' ? 'active' : ''}
              onClick={() => setProjectSettings(p => ({ ...p, aspectRatio: '4:5' }))}
            >
              4:5
            </button>
          </div>
        </div>
        
        <div className="toolbar-right">
          <button className="toolbar-btn">
            <Eye size={18} /> Preview
          </button>
          <button className="toolbar-btn primary">
            <Download size={18} /> Export
          </button>
          <button className="toolbar-btn accent">
            <Share2 size={18} /> Share
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="vsc-main">
        {/* Left Panel - Tools */}
        <div className="vsc-panel left">
          <div className="panel-tabs">
            <button 
              className={activePanel === 'media' ? 'active' : ''}
              onClick={() => setActivePanel('media')}
            >
              <Film size={18} />
              <span>Media</span>
            </button>
            <button 
              className={activePanel === 'text' ? 'active' : ''}
              onClick={() => setActivePanel('text')}
            >
              <Type size={18} />
              <span>Text</span>
            </button>
            <button 
              className={activePanel === 'audio' ? 'active' : ''}
              onClick={() => setActivePanel('audio')}
            >
              <Music size={18} />
              <span>Audio</span>
            </button>
            <button 
              className={activePanel === 'effects' ? 'active' : ''}
              onClick={() => setActivePanel('effects')}
            >
              <Wand2 size={18} />
              <span>Effects</span>
            </button>
            <button 
              className={activePanel === 'stickers' ? 'active' : ''}
              onClick={() => setActivePanel('stickers')}
            >
              <Star size={18} />
              <span>Stickers</span>
            </button>
          </div>

          <div className="panel-content">
            {/* Media Panel */}
            {activePanel === 'media' && (
              <div className="media-panel">
                <div className="panel-section">
                  <h4>Upload Media</h4>
                  <label className="upload-zone">
                    <Upload size={24} />
                    <span>Drop files or click to upload</span>
                    <span className="hint">Video, Images, Audio</span>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="video/*,image/*,audio/*" 
                      multiple 
                      onChange={handleFileUpload}
                      hidden 
                    />
                  </label>
                </div>

                <div className="panel-section">
                  <h4>Project Media</h4>
                  <div className="media-grid">
                    {clips.map(clip => (
                      <div 
                        key={clip.id} 
                        className={`media-item ${selectedElement?.id === clip.id ? 'selected' : ''}`}
                        onClick={() => setSelectedElement({ type: 'clip', id: clip.id })}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={clip.thumbnail} alt="" />
                        <span className="duration">{formatTime(clip.duration)}</span>
                      </div>
                    ))}
                    {clips.length === 0 && (
                      <div className="empty-state">
                        <Video size={32} />
                        <span>No media yet</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel-section">
                  <h4>Stock Media</h4>
                  <div className="search-bar">
                    <input type="text" placeholder="Search videos, images..." />
                  </div>
                  <div className="stock-categories">
                    <button>🎬 Videos</button>
                    <button>📸 Photos</button>
                    <button>🎨 Graphics</button>
                    <button>🔊 Audio</button>
                  </div>
                </div>
              </div>
            )}

            {/* Text Panel */}
            {activePanel === 'text' && (
              <div className="text-panel">
                <div className="panel-section">
                  <h4>Add Text</h4>
                  <button className="add-text-btn" onClick={addTextOverlay}>
                    <Plus size={16} /> Add Text
                  </button>
                </div>

                <div className="panel-section">
                  <h4>
                    <Sparkles size={16} /> AI Captions
                  </h4>
                  <p className="hint">Automatically generate captions from your video</p>
                  <button 
                    className="ai-btn"
                    onClick={generateAICaptions}
                    disabled={isGeneratingCaptions}
                  >
                    {isGeneratingCaptions ? (
                      <><RefreshCw className="spin" size={16} /> Generating...</>
                    ) : (
                      <><Mic size={16} /> Auto-Generate Captions</>
                    )}
                  </button>
                </div>

                <div className="panel-section">
                  <h4>Text Styles</h4>
                  <div className="text-styles-grid">
                    {[
                      { label: 'Bold', style: { fontWeight: 'bold', color: 'white', background: 'black', padding: '8px' } as React.CSSProperties },
                      { label: 'Outline', style: { color: 'white', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' } as React.CSSProperties },
                      { label: 'Glow', style: { color: 'white', textShadow: '0 0 10px #8b5cf6' } as React.CSSProperties },
                      { label: 'Neon', style: { color: '#ff00ff', textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff' } as React.CSSProperties },
                      { label: 'Comic', style: { fontFamily: 'Comic Sans MS', color: 'yellow', background: 'red', padding: '4px 12px', transform: 'rotate(-2deg)' } as React.CSSProperties },
                      { label: 'Minimal', style: { fontFamily: 'Helvetica', color: 'white', letterSpacing: '2px' } as React.CSSProperties },
                    ].map((preset, i) => (
                      <button key={i} className="style-preset">
                        <span style={preset.style}>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel-section">
                  <h4>Animations</h4>
                  <div className="animations-grid">
                    {TEXT_ANIMATIONS.map(anim => (
                      <button key={anim.type} className="animation-btn">
                        <span className="anim-icon">{anim.icon}</span>
                        <span>{anim.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Properties (when text selected) */}
                {selectedElement?.type === 'text' && (
                  <div className="panel-section properties">
                    <h4>Text Properties</h4>
                    <div className="property-group">
                      <label>Font</label>
                      <select>
                        {FONTS.map(font => (
                          <option key={font.name} value={font.name}>{font.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="property-group">
                      <label>Size</label>
                      <input type="range" min="12" max="120" defaultValue="48" />
                    </div>
                    <div className="property-group">
                      <label>Color</label>
                      <input type="color" defaultValue="#FFFFFF" />
                    </div>
                    <div className="property-group">
                      <label>Alignment</label>
                      <div className="button-group">
                        <button><AlignLeft size={16} /></button>
                        <button className="active"><AlignCenter size={16} /></button>
                        <button><AlignRight size={16} /></button>
                      </div>
                    </div>
                    <div className="property-group">
                      <label>Style</label>
                      <div className="button-group">
                        <button><Bold size={16} /></button>
                        <button><Italic size={16} /></button>
                        <button><Underline size={16} /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audio Panel */}
            {activePanel === 'audio' && (
              <div className="audio-panel">
                <div className="panel-section">
                  <h4>🔥 Trending Sounds</h4>
                  <div className="trending-sounds">
                    {TRENDING_SOUNDS.map(sound => (
                      <div key={sound.id} className="sound-item">
                        <button className="sound-play">
                          <Play size={14} />
                        </button>
                        <div className="sound-info">
                          <span className="sound-name">{sound.name}</span>
                          <span className="sound-artist">{sound.artist}</span>
                        </div>
                        <div className="sound-meta">
                          <span className="uses">{sound.uses}</span>
                          <span className="duration">{sound.duration}s</span>
                        </div>
                        <button className="sound-add">
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-section">
                  <h4>Your Audio</h4>
                  <div className="audio-list">
                    {audioTracks.map(track => (
                      <div key={track.id} className="audio-track-item">
                        <Music size={16} />
                        <span>{track.name}</span>
                        <span className="duration">{formatTime(track.duration)}</span>
                        <button onClick={() => setAudioTracks(prev => 
                          prev.map(t => t.id === track.id ? { ...t, isMuted: !t.isMuted } : t)
                        )}>
                          {track.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                      </div>
                    ))}
                    {audioTracks.length === 0 && (
                      <div className="empty-state small">
                        <Music size={24} />
                        <span>No audio tracks</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel-section">
                  <h4>Voice Over</h4>
                  <button className="record-btn">
                    <Mic size={16} /> Record Voice
                  </button>
                  <button className="ai-btn">
                    <Sparkles size={16} /> AI Voice Generator
                  </button>
                </div>
              </div>
            )}

            {/* Effects Panel */}
            {activePanel === 'effects' && (
              <div className="effects-panel">
                <div className="panel-section">
                  <h4>Filter Presets</h4>
                  <div className="filter-presets">
                    {FILTER_PRESETS.map(preset => (
                      <button 
                        key={preset.name}
                        className="filter-preset"
                        onClick={() => applyFilterPreset(preset.name)}
                      >
                        <div className="filter-preview" data-filter={preset.name.toLowerCase()}></div>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel-section">
                  <h4>Adjustments</h4>
                  <div className="adjustment-sliders">
                    <div className="slider-group">
                      <label><Sun size={14} /> Brightness</label>
                      <input type="range" min="0" max="200" defaultValue="100" />
                    </div>
                    <div className="slider-group">
                      <label><Contrast size={14} /> Contrast</label>
                      <input type="range" min="0" max="200" defaultValue="100" />
                    </div>
                    <div className="slider-group">
                      <label><Droplet size={14} /> Saturation</label>
                      <input type="range" min="0" max="200" defaultValue="100" />
                    </div>
                    <div className="slider-group">
                      <label><Palette size={14} /> Hue</label>
                      <input type="range" min="-180" max="180" defaultValue="0" />
                    </div>
                  </div>
                </div>

                <div className="panel-section">
                  <h4>Video Effects</h4>
                  <div className="effects-grid">
                    <button className="effect-btn">🌟 Glow</button>
                    <button className="effect-btn">⚡ Flash</button>
                    <button className="effect-btn">🔄 Zoom</button>
                    <button className="effect-btn">💫 Sparkle</button>
                    <button className="effect-btn">📱 Shake</button>
                    <button className="effect-btn">🌈 Rainbow</button>
                    <button className="effect-btn">❄️ Freeze</button>
                    <button className="effect-btn">🔥 Fire</button>
                  </div>
                </div>

                <div className="panel-section">
                  <h4>Speed</h4>
                  <div className="speed-controls">
                    <button className={playbackSpeed === 0.25 ? 'active' : ''}>0.25x</button>
                    <button className={playbackSpeed === 0.5 ? 'active' : ''}>0.5x</button>
                    <button className={playbackSpeed === 1 ? 'active' : ''}>1x</button>
                    <button className={playbackSpeed === 1.5 ? 'active' : ''}>1.5x</button>
                    <button className={playbackSpeed === 2 ? 'active' : ''}>2x</button>
                  </div>
                </div>
              </div>
            )}

            {/* Stickers Panel */}
            {activePanel === 'stickers' && (
              <div className="stickers-panel">
                <div className="panel-section">
                  <h4>Emojis</h4>
                  <div className="emoji-grid">
                    {['😀', '😂', '🤣', '😍', '🥰', '😎', '🤩', '🥳', '🔥', '💯', '✨', '💫', '⭐', '❤️', '💖', '👍', '👏', '🙌', '💪', '🚀'].map(emoji => (
                      <button key={emoji} className="emoji-btn">{emoji}</button>
                    ))}
                  </div>
                </div>

                <div className="panel-section">
                  <h4>Shapes</h4>
                  <div className="shapes-grid">
                    <button><Square size={24} /></button>
                    <button><Circle size={24} /></button>
                    <button><Triangle size={24} /></button>
                    <button><Star size={24} /></button>
                  </div>
                </div>

                <div className="panel-section">
                  <h4>GIFs</h4>
                  <div className="search-bar">
                    <input type="text" placeholder="Search GIFs..." />
                  </div>
                  <div className="gif-grid">
                    {/* GIF placeholders */}
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="gif-item"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center - Preview */}
        <div className="vsc-preview">
          <div className="preview-controls-top">
            <div className="zoom-controls">
              <button onClick={() => setZoom(z => Math.max(50, z - 10))}>
                <ZoomOut size={16} />
              </button>
              <span>{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 10))}>
                <ZoomIn size={16} />
              </button>
            </div>
            <div className="view-controls">
              <button 
                className={showGrid ? 'active' : ''}
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid size={16} />
              </button>
              <button 
                className={snapToGrid ? 'active' : ''}
                onClick={() => setSnapToGrid(!snapToGrid)}
              >
                <Magnet size={16} />
              </button>
              <button>
                <Crosshair size={16} />
              </button>
            </div>
          </div>

          <div 
            className="preview-canvas-container"
            style={{ 
              aspectRatio: projectSettings.aspectRatio === '9:16' ? '9/16' : 
                          projectSettings.aspectRatio === '16:9' ? '16/9' :
                          projectSettings.aspectRatio === '1:1' ? '1/1' :
                          projectSettings.aspectRatio === '4:5' ? '4/5' : '4/3'
            }}
          >
            <div 
              className="preview-canvas"
              style={{ 
                transform: `scale(${zoom / 100})`,
                backgroundColor: projectSettings.backgroundColor 
              }}
            >
              {/* Video Layer */}
              {clips.length > 0 && (
                <video 
                  ref={videoRef}
                  className="preview-video"
                  src={clips[0]?.source}
                />
              )}

              {/* Grid Overlay */}
              {showGrid && <div className="grid-overlay" />}

              {/* Text Overlays */}
              {textOverlays.map(text => (
                <div 
                  key={text.id}
                  className={`text-overlay ${selectedElement?.id === text.id ? 'selected' : ''}`}
                  style={{
                    left: `${text.x}%`,
                    top: `${text.y}%`,
                    fontFamily: text.font,
                    fontSize: `${text.size}px`,
                    color: text.color,
                    backgroundColor: text.backgroundColor,
                    fontWeight: text.style.bold ? 'bold' : 'normal',
                    fontStyle: text.style.italic ? 'italic' : 'normal',
                    textDecoration: text.style.underline ? 'underline' : 'none',
                    textAlign: text.style.alignment,
                  }}
                  onClick={() => setSelectedElement({ type: 'text', id: text.id })}
                >
                  {text.text}
                </div>
              ))}

              {/* Placeholder when empty */}
              {clips.length === 0 && (
                <div className="preview-placeholder">
                  <Film size={48} />
                  <p>Upload media to get started</p>
                  <button onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} /> Upload Files
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="playback-controls">
            <div className="playback-time">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(projectSettings.duration)}</span>
            </div>
            
            <div className="playback-buttons">
              <button onClick={() => setCurrentTime(0)}>
                <SkipBack size={18} />
              </button>
              <button 
                className="play-btn"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button onClick={() => setCurrentTime(projectSettings.duration)}>
                <SkipForward size={18} />
              </button>
            </div>

            <div className="volume-control">
              <button onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setIsMuted(false);
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="vsc-panel right">
          <div className="panel-header">
            <h3>
              <Settings size={16} /> Properties
            </h3>
          </div>
          
          <div className="panel-content">
            {selectedElement ? (
              <div className="properties-panel">
                <div className="property-section">
                  <h4>Transform</h4>
                  <div className="transform-controls">
                    <div className="property-row">
                      <label>Position X</label>
                      <input type="number" defaultValue="0" />
                    </div>
                    <div className="property-row">
                      <label>Position Y</label>
                      <input type="number" defaultValue="0" />
                    </div>
                    <div className="property-row">
                      <label>Scale</label>
                      <input type="range" min="10" max="200" defaultValue="100" />
                    </div>
                    <div className="property-row">
                      <label>Rotation</label>
                      <input type="range" min="-180" max="180" defaultValue="0" />
                    </div>
                    <div className="flip-buttons">
                      <button><FlipHorizontal size={16} /></button>
                      <button><RotateCcw size={16} /></button>
                      <button><RotateCw size={16} /></button>
                    </div>
                  </div>
                </div>

                <div className="property-section">
                  <h4>Timing</h4>
                  <div className="timing-controls">
                    <div className="property-row">
                      <label>Start</label>
                      <input type="text" defaultValue="00:00.00" />
                    </div>
                    <div className="property-row">
                      <label>End</label>
                      <input type="text" defaultValue="00:03.00" />
                    </div>
                  </div>
                </div>

                <div className="property-actions">
                  <button className="delete-btn">
                    <Trash2 size={14} /> Delete
                  </button>
                  <button className="duplicate-btn">
                    <Copy size={14} /> Duplicate
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <p>Select an element to edit its properties</p>
              </div>
            )}

            {/* Project Settings */}
            <div className="project-settings">
              <h4>Project Settings</h4>
              <div className="setting-row">
                <label>Resolution</label>
                <select 
                  value={projectSettings.resolution}
                  onChange={(e) => setProjectSettings(p => ({ ...p, resolution: e.target.value as '720p' | '1080p' | '4K' }))}
                >
                  <option value="720p">720p (HD)</option>
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="4K">4K (Ultra HD)</option>
                </select>
              </div>
              <div className="setting-row">
                <label>Frame Rate</label>
                <select 
                  value={projectSettings.fps}
                  onChange={(e) => setProjectSettings(p => ({ ...p, fps: Number(e.target.value) as 24 | 30 | 60 }))}
                >
                  <option value="24">24 fps</option>
                  <option value="30">30 fps</option>
                  <option value="60">60 fps</option>
                </select>
              </div>
              <div className="setting-row">
                <label>Background</label>
                <input 
                  type="color" 
                  value={projectSettings.backgroundColor}
                  onChange={(e) => setProjectSettings(p => ({ ...p, backgroundColor: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="vsc-timeline">
        <div className="timeline-toolbar">
          <div className="timeline-tools">
            <button><Scissors size={16} /> Split</button>
            <button><Copy size={16} /> Duplicate</button>
            <button><Trash2 size={16} /> Delete</button>
          </div>
          <div className="timeline-zoom">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))}>
              <Minus size={14} />
            </button>
            <span>Timeline Zoom</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="timeline-content" ref={timelineRef} onClick={handleTimelineScrub}>
          {/* Time ruler */}
          <div className="timeline-ruler">
            {Array.from({ length: Math.ceil(projectSettings.duration) + 1 }, (_, i) => (
              <div key={i} className="ruler-mark" style={{ left: `${(i / Math.max(projectSettings.duration, 1)) * 100}%` }}>
                <span>{i}s</span>
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div 
            className="playhead"
            style={{ left: `${(currentTime / Math.max(projectSettings.duration, 1)) * 100}%` }}
          />

          {/* Tracks */}
          <div className="timeline-tracks">
            {/* Video Track */}
            <div className="track">
              <div className="track-label">
                <Video size={14} /> Video
              </div>
              <div className="track-content">
                {clips.map(clip => (
                  <div 
                    key={clip.id}
                    className={`clip-block ${selectedElement?.id === clip.id ? 'selected' : ''}`}
                    style={{
                      left: `${(clip.position / Math.max(projectSettings.duration, 1)) * 100}%`,
                      width: `${((clip.endTime - clip.startTime) / Math.max(projectSettings.duration, 1)) * 100}%`
                    }}
                    onClick={() => setSelectedElement({ type: 'clip', id: clip.id })}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={clip.thumbnail} alt="" />
                    <span className="clip-duration">{formatTime(clip.endTime - clip.startTime)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Track */}
            <div className="track">
              <div className="track-label">
                <Music size={14} /> Audio
              </div>
              <div className="track-content">
                {audioTracks.map(track => (
                  <div 
                    key={track.id}
                    className="audio-block"
                    style={{
                      left: `${(track.startTime / Math.max(projectSettings.duration, 1)) * 100}%`,
                      width: `${((track.trimEnd - track.trimStart) / Math.max(projectSettings.duration, 1)) * 100}%`
                    }}
                  >
                    <Music size={12} />
                    <span>{track.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Text Track */}
            <div className="track">
              <div className="track-label">
                <Type size={14} /> Text
              </div>
              <div className="track-content">
                {textOverlays.map(text => (
                  <div 
                    key={text.id}
                    className={`text-block ${selectedElement?.id === text.id ? 'selected' : ''}`}
                    style={{
                      left: `${(text.startTime / Math.max(projectSettings.duration, 1)) * 100}%`,
                      width: `${((text.endTime - text.startTime) / Math.max(projectSettings.duration, 1)) * 100}%`
                    }}
                    onClick={() => setSelectedElement({ type: 'text', id: text.id })}
                  >
                    <Type size={12} />
                    <span>{text.text.substring(0, 20)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoShortsCreator;
