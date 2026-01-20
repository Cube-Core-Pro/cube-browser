/**
 * VideoConference Tour Steps
 * CUBE Elite v7.0.0 - Enterprise Video Conferencing
 * 
 * Comprehensive guided tour for WebRTC video conferencing features
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for VideoConference module
 * Covers: Room management, controls, screen sharing, recording
 */
export const videoConferenceTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'video-welcome',
    target: '[data-tour="video-conference"]',
    title: '🎥 Video Conference Center',
    content: `Welcome to CUBE's enterprise-grade video conferencing system!

**Key Features:**
• WebRTC-powered HD video calls
• Screen sharing capabilities
• Recording with local storage
• Real-time participant management
• Hand raise & reactions
• Multi-participant grid layouts

Built with industry-standard WebRTC technology for reliable, secure communications.`,
    placement: 'center', position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'video-header',
    target: '[data-tour="video-header"]',
    title: '📋 Conference Information',
    content: `The header displays essential meeting information:

**Room Details:**
• Conference room name
• Current participant count
• Recording status indicator (● Recording)

The recording indicator pulses when active, ensuring all participants know they're being recorded.`,
    placement: 'bottom', position: 'bottom',
    category: 'welcome',
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Video Grid & Participants
  // ============================================================================
  {
    id: 'video-grid',
    target: '[data-tour="video-grid"]',
    title: '👥 Participant Video Grid',
    content: `The intelligent video grid adapts to the number of participants:

**Grid Layouts:**
• **1 participant**: Full screen
• **2 participants**: Side by side
• **3-4 participants**: 2x2 grid
• **5-9 participants**: 3x3 grid
• **10+ participants**: Scrollable gallery

Each participant tile shows their video stream or avatar when camera is off.`,
    placement: 'top', position: 'top',
    category: 'participants',
    showProgress: true
  },
  {
    id: 'video-participant-tile',
    target: '[data-tour="video-participant"]',
    title: '👤 Participant Tile',
    content: `Each participant has a dedicated tile showing:

**Visual Elements:**
• Live video feed (when enabled)
• Avatar with initial (when video off)
• Name label with "(You)" for local user
• Status indicators in corner

**Status Indicators:**
• ✋ Hand raised
• 🔇 Microphone muted
• 🖥️ Screen sharing active

Speaking indicator pulses when audio is detected.`,
    placement: 'right', position: 'right',
    category: 'participants',
    showProgress: true
  },

  // ============================================================================
  // SECTION 3: Meeting Controls
  // ============================================================================
  {
    id: 'video-controls',
    target: '[data-tour="video-controls"]',
    title: '🎮 Meeting Controls',
    content: `The control bar provides quick access to all meeting functions:

**Available Controls:**
• Audio toggle (mute/unmute)
• Video toggle (camera on/off)
• Screen sharing
• Hand raise
• Recording
• Leave meeting

Controls change color to indicate their state:
• **Gray**: Default/inactive
• **Blue**: Active feature
• **Red**: Disabled or recording
• **Yellow**: Hand raised`,
    placement: 'top', position: 'top',
    category: 'controls',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'video-audio-toggle',
    target: '[data-tour="audio-toggle"]',
    title: '🎤 Audio Control',
    content: `Toggle your microphone on or off:

**States:**
• 🎤 Microphone active - you can be heard
• 🔇 Microphone muted - audio disabled

**Best Practices:**
• Mute when not speaking to reduce background noise
• Check audio before important meetings
• Use keyboard shortcut for quick toggle

Your mute status is visible to all participants.`,
    placement: 'top', position: 'top',
    category: 'controls',
    showProgress: true
  },
  {
    id: 'video-video-toggle',
    target: '[data-tour="video-toggle"]',
    title: '📹 Video Control',
    content: `Control your camera feed:

**States:**
• 📹 Camera on - others see your video
• 📵 Camera off - shows your avatar

**Bandwidth Note:**
Disabling video reduces bandwidth usage, helpful on slow connections.

**Privacy:**
When camera is off, your avatar (first letter of name) is displayed.`,
    placement: 'top', position: 'top',
    category: 'controls',
    showProgress: true
  },
  {
    id: 'video-screen-share',
    target: '[data-tour="screen-share"]',
    title: '🖥️ Screen Sharing',
    content: `Share your screen with all participants:

**Options:**
• Entire screen
• Application window
• Browser tab

**Features:**
• HD quality sharing
• System audio sharing (supported browsers)
• Presenter mode indicator

**Note:** Only one participant can share at a time. Your share will replace any active share.`,
    placement: 'top', position: 'top',
    category: 'controls',
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'video-hand-raise',
    target: '[data-tour="hand-raise"]',
    title: '✋ Raise Hand',
    content: `Get attention without interrupting:

**How it works:**
• Click to raise your hand (✋ appears on your tile)
• Click again to lower your hand
• Button turns yellow when hand is raised

**Use Cases:**
• Request to speak in large meetings
• Signal agreement or question
• Queue for presenter attention

All participants can see raised hands.`,
    placement: 'top', position: 'top',
    category: 'controls',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: Recording
  // ============================================================================
  {
    id: 'video-recording',
    target: '[data-tour="recording"]',
    title: '● Recording',
    content: `Record the meeting locally:

**Recording Features:**
• WebM format (high quality)
• Local storage only (privacy-first)
• Automatic timestamped filenames
• Audio + video streams

**Recording Indicator:**
• Red dot visible in header when recording
• All participants are notified

**Output:**
Files saved as \`recording_[timestamp].webm\``,
    placement: 'top', position: 'top',
    category: 'recording',
    isRequired: true,
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'video-recording-indicator',
    target: '[data-tour="recording-indicator"]',
    title: '🔴 Recording Status',
    content: `The recording indicator shows when a meeting is being captured:

**Visual Cues:**
• Pulsing red dot (●) in header
• "Recording" text label
• Control button turns red

**Privacy:**
All participants see the recording indicator to ensure transparency.

**Best Practice:**
Always inform participants before starting a recording.`,
    placement: 'bottom', position: 'bottom',
    category: 'recording',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: Advanced Features
  // ============================================================================
  {
    id: 'video-speaking-indicator',
    target: '[data-tour="speaking-indicator"]',
    title: '🔊 Speaking Detection',
    content: `Visual feedback shows who is speaking:

**Indicators:**
• Green pulse around active speaker's tile
• Audio level visualization
• Auto-focus on speaker (optional)

**Benefits:**
• Easy to follow conversation
• Identify unmuted microphones
• Detect background noise issues`,
    placement: 'left', position: 'left',
    category: 'advanced',
    showProgress: true
  },
  {
    id: 'video-leave-meeting',
    target: '[data-tour="leave-meeting"]',
    title: '🚪 Leave Meeting',
    content: `Exit the conference safely:

**Leave Actions:**
• Disconnects video/audio streams
• Notifies other participants
• Stops any active screen share
• Saves recording (if active)

**After Leaving:**
You can rejoin the same room if it's still active.

**Host Note:**
If you're the host, consider ending the meeting for all before leaving.`,
    placement: 'top', position: 'top',
    category: 'advanced',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: Tour Completion
  // ============================================================================
  {
    id: 'video-complete',
    target: '[data-tour="video-conference"]',
    title: '✅ Tour Complete!',
    content: `You've mastered CUBE Video Conference!

**Covered Topics:**
✓ Video grid & participant management
✓ Audio/video controls
✓ Screen sharing
✓ Hand raise feature
✓ Meeting recording
✓ Leave meeting safely

**Pro Tips:**
• Test audio/video before important meetings
• Use mute when not speaking
• Share specific windows instead of full screen
• Always notify before recording

**Keyboard Shortcuts:**
• \`M\` - Toggle mute
• \`V\` - Toggle video
• \`S\` - Screen share
• \`H\` - Raise hand

Ready for professional video conferencing!`,
    placement: 'center', position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for VideoConference
 */
export const videoConferenceTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '🎥' },
  { id: 'participants', title: 'Participants', icon: '👥' },
  { id: 'controls', title: 'Controls', icon: '🎮' },
  { id: 'recording', title: 'Recording', icon: '●' },
  { id: 'advanced', title: 'Advanced', icon: '⚡' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getVideoConferenceStepsBySection = (sectionId: string): TourStep[] => {
  return videoConferenceTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getVideoConferenceRequiredSteps = (): TourStep[] => {
  return videoConferenceTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const videoConferenceTourConfig = {
  id: 'video-conference-tour',
  name: 'Video Conference Tour',
  description: 'Learn to use enterprise video conferencing features',
  version: '1.0.0',
  totalSteps: videoConferenceTourSteps.length,
  estimatedTime: '4 minutes',
  sections: videoConferenceTourSections,
  features: [
    'WebRTC video calls',
    'Screen sharing',
    'Local recording',
    'Participant management',
    'Hand raise & reactions'
  ]
};

export default videoConferenceTourSteps;
