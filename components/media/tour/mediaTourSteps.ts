/**
 * Media Player Tour Steps
 * CUBE Elite v7.0.0 - Enterprise Media Player
 * 
 * Comprehensive guided tour for audio/video playback features
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for Media Player module
 * Covers: Audio, Video, Playlists, Controls, Equalizer, Visualizer
 */
export const mediaTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'media-welcome',
    target: '[data-tour="media-module"]',
    title: '🎵 Media Player',
    content: `Welcome to CUBE's enterprise media player!

**Key Features:**
• Audio & video playback
• Playlist management
• Audio visualizer (3 modes)
• 10-band equalizer
• Subtitle support
• Keyboard shortcuts

Professional media playback experience.`,
    placement: 'center',
    position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Video Player
  // ============================================================================
  {
    id: 'media-video-player',
    target: '[data-tour="video-player"]',
    title: '🎬 Video Player',
    content: `Full-featured video playback:

**Video Features:**
• HD/4K support
• Fullscreen mode
• Quality selection
• Subtitle overlay

**Supported Formats:**
• MP4, WebM, AVI
• MKV, MOV, WMV

Click ⤢ for fullscreen mode.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'video',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'media-subtitles',
    target: '[data-tour="subtitle-overlay"]',
    title: '💬 Subtitles',
    content: `Built-in subtitle support:

**Subtitle Formats:**
• SRT (SubRip)
• VTT (WebVTT)
• ASS/SSA

**Features:**
• Auto-sync with video
• Multiple language tracks
• Style customization

Load subtitles from Settings.`,
    placement: 'top',
    position: 'top',
    category: 'video',
    showProgress: true
  },
  {
    id: 'media-fullscreen',
    target: '[data-tour="fullscreen-btn"]',
    title: '⤢ Fullscreen Mode',
    content: `Immersive viewing:

**Toggle Fullscreen:**
• Click ⤢ button
• Press \`F\` key
• Double-click video

**Exit Fullscreen:**
• Press \`Escape\`
• Click ⤓ button

Overlay hides automatically.`,
    placement: 'left',
    position: 'left',
    category: 'video',
    showProgress: true,
    highlightClicks: true
  },

  // ============================================================================
  // SECTION 3: Audio Player
  // ============================================================================
  {
    id: 'media-audio-player',
    target: '[data-tour="audio-player"]',
    title: '🎵 Audio Player',
    content: `Professional audio playback:

**Audio Features:**
• Gapless playback
• Web Audio API
• Visualizer integration

**Supported Formats:**
• MP3, WAV, FLAC
• OGG, AAC, M4A

Combined with visualizer for immersion.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'audio',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'media-visualizer',
    target: '[data-tour="visualizer"]',
    title: '🌈 Audio Visualizer',
    content: `Real-time audio visualization:

**Visualizer Modes:**
• **Bars**: Frequency bars
• **Wave**: Waveform display
• **Circular**: Radial pattern

**Customization:**
• Color gradients
• Intensity control
• Enable/disable

Toggle in Settings panel.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'audio',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: Player Controls
  // ============================================================================
  {
    id: 'media-controls',
    target: '[data-tour="player-controls"]',
    title: '🎮 Playback Controls',
    content: `Control your media:

**Main Controls:**
• ⏮️ Previous track
• ⏪ Skip backward (10s)
• ▶️/⏸️ Play/Pause
• ⏩ Skip forward (10s)
• ⏭️ Next track

Full control at your fingertips.`,
    placement: 'top',
    position: 'top',
    category: 'controls',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'media-progress',
    target: '[data-tour="progress-bar"]',
    title: '⏱️ Progress Bar',
    content: `Navigate through media:

**Features:**
• Click to seek
• Drag to scrub
• Time display (current/total)

**Tips:**
• Click anywhere to jump
• Drag for precise control
• Hold Shift for fine seek`,
    placement: 'top',
    position: 'top',
    category: 'controls',
    showProgress: true
  },
  {
    id: 'media-volume',
    target: '[data-tour="volume-control"]',
    title: '🔊 Volume Control',
    content: `Adjust audio level:

**Volume Features:**
• Slider control (0-100%)
• Mute toggle button
• Visual indicator

**Icons:**
• 🔇 Muted
• 🔉 Low volume
• 🔊 Normal/high

**Shortcut:** \`M\` to mute.`,
    placement: 'top',
    position: 'top',
    category: 'controls',
    showProgress: true
  },
  {
    id: 'media-playback-rate',
    target: '[data-tour="playback-rate"]',
    title: '⚡ Playback Speed',
    content: `Control playback speed:

**Speed Options:**
• 0.5x - Half speed
• 0.75x - Slower
• 1.0x - Normal
• 1.25x - Faster
• 1.5x - Quick
• 2.0x - Double speed

Great for podcasts/lectures!`,
    placement: 'bottom',
    position: 'bottom',
    category: 'controls',
    showProgress: true
  },
  {
    id: 'media-shuffle-repeat',
    target: '[data-tour="shuffle-repeat"]',
    title: '🔀 Shuffle & Repeat',
    content: `Playlist playback modes:

**Shuffle (🔀):**
Random track order

**Repeat Modes:**
• ↻ Off (no repeat)
• 🔁 All (loop playlist)
• 🔂 One (loop track)

**Shortcuts:**
• \`S\` - Toggle shuffle
• \`R\` - Cycle repeat`,
    placement: 'bottom',
    position: 'bottom',
    category: 'controls',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: Playlist Manager
  // ============================================================================
  {
    id: 'media-playlist',
    target: '[data-tour="playlist-manager"]',
    title: '📋 Playlist Manager',
    content: `Organize your media:

**Playlist Features:**
• Create custom playlists
• Drag to reorder
• Search within playlist
• Sort by various criteria

**Quick Actions:**
• Double-click to play
• Right-click for menu`,
    placement: 'left',
    position: 'left',
    category: 'playlist',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'media-playlist-create',
    target: '[data-tour="create-playlist"]',
    title: '➕ Create Playlist',
    content: `Start a new playlist:

**How to Create:**
1. Click + New Playlist
2. Enter playlist name
3. Add files

**Add Files:**
• Drag & drop
• Browse button
• From library`,
    placement: 'right',
    position: 'right',
    category: 'playlist',
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'media-playlist-search',
    target: '[data-tour="playlist-search"]',
    title: '🔍 Search Playlist',
    content: `Find tracks quickly:

**Search Features:**
• Real-time filtering
• Searches title & artist
• Metadata matching

**Sorting Options:**
• Title
• Artist
• Duration
• Date added`,
    placement: 'bottom',
    position: 'bottom',
    category: 'playlist',
    showProgress: true
  },
  {
    id: 'media-now-playing',
    target: '[data-tour="now-playing"]',
    title: '🎶 Now Playing',
    content: `Current track info:

**Shows:**
• Track title
• Artist name
• Album (if available)
• Duration

**Visual:**
• Currently playing highlight
• Progress indicator`,
    placement: 'left',
    position: 'left',
    category: 'playlist',
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: Equalizer
  // ============================================================================
  {
    id: 'media-equalizer',
    target: '[data-tour="equalizer-btn"]',
    title: '🎛️ Equalizer',
    content: `Fine-tune your audio:

**10-Band Equalizer:**
• 60Hz - 16kHz range
• ±12dB adjustment

**Presets:**
• Flat, Rock, Pop
• Jazz, Classical
• Electronic, Bass Boost
• Treble Boost, Vocal

Click EQ button to open.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'equalizer',
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'media-eq-bands',
    target: '[data-tour="eq-bands"]',
    title: '📊 EQ Bands',
    content: `Adjust frequency bands:

**Band Frequencies:**
• 60Hz, 170Hz (Bass)
• 310Hz, 600Hz (Low-mid)
• 1kHz, 3kHz (Mid)
• 6kHz, 12kHz (High-mid)
• 14kHz, 16kHz (Treble)

Drag sliders up/down.`,
    placement: 'left',
    position: 'left',
    category: 'equalizer',
    showProgress: true
  },
  {
    id: 'media-eq-presets',
    target: '[data-tour="eq-presets"]',
    title: '🎯 EQ Presets',
    content: `Quick sound profiles:

**Presets:**
• **Rock**: Boosted bass/treble
• **Pop**: Balanced, vocal focus
• **Jazz**: Warm mids
• **Classical**: Natural, flat
• **Electronic**: Deep bass
• **Bass Boost**: +6dB low end
• **Vocal Boost**: Clear vocals

Select and customize!`,
    placement: 'right',
    position: 'right',
    category: 'equalizer',
    showProgress: true
  },

  // ============================================================================
  // SECTION 7: Settings
  // ============================================================================
  {
    id: 'media-settings',
    target: '[data-tour="media-settings"]',
    title: '⚙️ Media Settings',
    content: `Configure player behavior:

**Settings Include:**
• Playback options
• Visualizer settings
• Subtitle configuration
• Quality preferences

Customize your experience.`,
    placement: 'left',
    position: 'left',
    category: 'settings',
    showProgress: true
  },
  {
    id: 'media-visualizer-settings',
    target: '[data-tour="visualizer-settings"]',
    title: '🌈 Visualizer Settings',
    content: `Customize visualizer:

**Options:**
• **Type**: Bars/Wave/Circular
• **Colors**: Gradient selection
• **Intensity**: 0-100%
• **Enable/Disable**

Create your visual style.`,
    placement: 'right',
    position: 'right',
    category: 'settings',
    showProgress: true
  },

  // ============================================================================
  // SECTION 8: Keyboard Shortcuts
  // ============================================================================
  {
    id: 'media-keyboard',
    target: '[data-tour="keyboard-shortcuts"]',
    title: '⌨️ Keyboard Shortcuts',
    content: `Control with keyboard:

**Playback:**
• \`Space\` - Play/Pause
• \`←/→\` - Seek ±5s
• \`↑/↓\` - Volume ±5%

**Navigation:**
• \`N\` - Next track
• \`P\` - Previous track
• \`S\` - Shuffle toggle
• \`R\` - Repeat toggle

**Other:**
• \`M\` - Mute
• \`F\` - Fullscreen
• \`E\` - Equalizer`,
    placement: 'center',
    position: 'center',
    category: 'shortcuts',
    showProgress: true
  },

  // ============================================================================
  // SECTION 9: Tour Completion
  // ============================================================================
  {
    id: 'media-complete',
    target: '[data-tour="media-module"]',
    title: '✅ Media Player Tour Complete!',
    content: `You've mastered CUBE Media!

**Topics Covered:**
✓ Video playback & subtitles
✓ Audio player & visualizer
✓ Playback controls
✓ Playlist management
✓ Equalizer settings
✓ Keyboard shortcuts

**Pro Tips:**
• Use presets for quick EQ
• Keyboard for fast control
• Create themed playlists
• Enable visualizer for audio
• Adjust playback speed for podcasts

**Quick Reference:**
• Play/Pause: Space
• Seek: Arrow keys
• Volume: ↑/↓
• Mute: M
• Fullscreen: F

Enjoy your media!`,
    placement: 'center',
    position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for Media Player
 */
export const mediaTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '🎵' },
  { id: 'video', title: 'Video Player', icon: '🎬' },
  { id: 'audio', title: 'Audio Player', icon: '🎵' },
  { id: 'controls', title: 'Controls', icon: '🎮' },
  { id: 'playlist', title: 'Playlists', icon: '📋' },
  { id: 'equalizer', title: 'Equalizer', icon: '🎛️' },
  { id: 'settings', title: 'Settings', icon: '⚙️' },
  { id: 'shortcuts', title: 'Shortcuts', icon: '⌨️' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getMediaStepsBySection = (sectionId: string): TourStep[] => {
  return mediaTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getMediaRequiredSteps = (): TourStep[] => {
  return mediaTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const mediaTourConfig = {
  id: 'media-tour',
  name: 'Media Player Tour',
  description: 'Master audio and video playback with advanced features',
  version: '1.0.0',
  totalSteps: mediaTourSteps.length,
  estimatedTime: '6 minutes',
  sections: mediaTourSections,
  features: [
    'Audio & video playback',
    'Playlist management',
    '10-band equalizer',
    'Audio visualizer',
    'Subtitle support',
    'Keyboard shortcuts'
  ]
};

export default mediaTourSteps;
