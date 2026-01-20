/**
 * VoIP Tour Steps
 * CUBE Elite v7.0.0 - Enterprise Voice/Video Communication
 * 
 * Comprehensive guided tour for WebRTC-based VoIP features
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for VoIP module
 * Covers: Contacts, calls, audio settings, call history
 */
export const voipTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'voip-welcome',
    target: '[data-tour="voip-module"]',
    title: '📞 VoIP Communication Center',
    content: `Welcome to CUBE's enterprise VoIP system!

**Key Features:**
• WebRTC HD audio/video calls
• TURN/STUN server support (Twilio, Xirsys, coturn)
• Contact management with presence
• Call history with statistics
• Audio device configuration
• Call quality monitoring

Built on industry-standard WebRTC for crystal-clear communications.`,
    placement: 'center', position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Contact Management
  // ============================================================================
  {
    id: 'voip-contacts',
    target: '[data-tour="voip-contacts"]',
    title: '👥 Contact List',
    content: `Manage your VoIP contacts efficiently:

**Contact Information:**
• Name, email, and phone number
• SIP URI for enterprise systems
• Custom avatar support
• Tags for organization

**Presence Status:**
• 🟢 Online - Available for calls
• 🟡 Away - Temporarily unavailable
• 🔴 Busy - In a call/meeting
• ⚫ Offline - Not connected

Click any contact to initiate a call.`,
    placement: 'right', position: 'right',
    category: 'contacts',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'voip-contact-search',
    target: '[data-tour="contact-search"]',
    title: '🔍 Search Contacts',
    content: `Quickly find contacts:

**Search By:**
• Name (partial match)
• Email address
• Phone number
• Tags

**Tips:**
• Search is instant and case-insensitive
• Clear button (×) resets the search
• Combine with filters for precision`,
    placement: 'bottom', position: 'bottom',
    category: 'contacts',
    showProgress: true
  },
  {
    id: 'voip-contact-filters',
    target: '[data-tour="contact-filters"]',
    title: '🏷️ Filter & Sort',
    content: `Organize your contact view:

**Filter Options:**
• **All**: Show all contacts
• **⭐ Favorites**: Only starred contacts
• **🟢 Online**: Currently available

**Sort Options:**
• **Name**: Alphabetical order
• **Status**: Online first

**Pro Tip:**
Combine filter and sort for efficient call routing.`,
    placement: 'bottom', position: 'bottom',
    category: 'contacts',
    showProgress: true
  },
  {
    id: 'voip-contact-card',
    target: '[data-tour="contact-card"]',
    title: '📇 Contact Card',
    content: `Each contact card displays:

**Visual Elements:**
• Avatar or initial placeholder
• Status indicator (colored dot)
• Favorite badge (⭐)

**Contact Details:**
• Full name
• Current status
• Email and phone
• Custom tags

**Actions:**
• 📞 Audio call
• 📹 Video call
• Click card to expand details`,
    placement: 'right', position: 'right',
    category: 'contacts',
    showProgress: true
  },
  {
    id: 'voip-call-buttons',
    target: '[data-tour="call-buttons"]',
    title: '📞 Initiate Calls',
    content: `Start a call from contact card:

**Call Types:**
• 📞 **Audio Call**: Voice-only connection
• 📹 **Video Call**: Audio + video stream

**Before Calling:**
• Check contact's status (online preferred)
• Verify your audio/video settings
• Ensure stable internet connection

**Call Flow:**
1. Select contact → 2. Choose call type → 3. Wait for connection`,
    placement: 'left', position: 'left',
    category: 'contacts',
    highlightClicks: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 3: Call Controls
  // ============================================================================
  {
    id: 'voip-call-controls',
    target: '[data-tour="call-controls"]',
    title: '🎮 Call Controls',
    content: `During an active call, you have full control:

**Control Panel:**
• Mute/Unmute microphone
• Enable/Disable camera
• View call statistics
• End call

**Status Display:**
• Connection state indicator
• Call duration timer
• Call type (audio/video)

The control panel appears at the bottom of the call screen.`,
    placement: 'top', position: 'top',
    category: 'calls',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'voip-mute-control',
    target: '[data-tour="mute-control"]',
    title: '🔇 Audio Control',
    content: `Toggle your microphone:

**States:**
• 🔊 Active - Your audio is transmitted
• 🔇 Muted - Your audio is blocked

**Indicators:**
• Button highlights when muted
• Remote party sees mute indicator

**Best Practice:**
Mute when not speaking in group calls to reduce noise.`,
    placement: 'top', position: 'top',
    category: 'calls',
    showProgress: true
  },
  {
    id: 'voip-video-control',
    target: '[data-tour="video-control"]',
    title: '📹 Video Control',
    content: `Manage your camera during video calls:

**States:**
• 📹 Camera On - Video transmitted
• 📷 Camera Off - Shows avatar

**Video Layout:**
• Remote video: Large main view
• Local video: Picture-in-picture corner

**Bandwidth Note:**
Disabling video conserves bandwidth on slow connections.`,
    placement: 'top', position: 'top',
    category: 'calls',
    showProgress: true
  },
  {
    id: 'voip-call-stats',
    target: '[data-tour="call-stats"]',
    title: '📊 Call Statistics',
    content: `Monitor call quality in real-time:

**Metrics Displayed:**
• **RTT**: Round-trip time (latency)
• **Packet Loss**: Data integrity
• **Jitter**: Timing consistency
• **Bitrate**: Audio/video quality

**Quality Indicators:**
• 🟢 Excellent: RTT < 100ms, loss < 1%
• 🟡 Good: RTT < 200ms, loss < 3%
• 🔴 Poor: Higher values

Click "Stats" button to toggle display.`,
    placement: 'left', position: 'left',
    category: 'calls',
    showProgress: true
  },
  {
    id: 'voip-end-call',
    target: '[data-tour="end-call"]',
    title: '📵 End Call',
    content: `Properly terminate a call:

**End Call Action:**
• Disconnects all streams
• Releases media devices
• Updates call history
• Notifies remote party

**After Ending:**
• Call duration saved
• Statistics recorded
• Entry added to history

The red "End Call" button is always visible during calls.`,
    placement: 'top', position: 'top',
    category: 'calls',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: Audio Settings
  // ============================================================================
  {
    id: 'voip-audio-settings',
    target: '[data-tour="audio-settings"]',
    title: '⚙️ Audio Settings',
    content: `Configure your VoIP audio setup:

**Settings Sections:**
• Audio devices (input/output)
• Media settings (codecs)
• ICE/TURN servers
• Connection policies

All changes are saved automatically and persist across sessions.`,
    placement: 'right', position: 'right',
    category: 'settings',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'voip-devices',
    target: '[data-tour="audio-devices"]',
    title: '🎤 Audio Devices',
    content: `Select your audio hardware:

**Input Devices (Microphones):**
• Built-in microphone
• USB headsets
• Bluetooth devices

**Output Devices (Speakers):**
• Built-in speakers
• External speakers
• Headphones

**Refresh Button:**
Click 🔄 to detect newly connected devices.

**Default Badge:**
System default device is marked.`,
    placement: 'right', position: 'right',
    category: 'settings',
    showProgress: true
  },
  {
    id: 'voip-codecs',
    target: '[data-tour="codec-settings"]',
    title: '🎵 Audio/Video Codecs',
    content: `Choose optimal codecs for your network:

**Audio Codecs:**
• **Opus**: Best quality, recommended
• **PCMU/PCMA**: Legacy compatibility

**Video Codecs:**
• **VP8**: Wide compatibility
• **VP9**: Better compression
• **H264**: Hardware acceleration
• **AV1**: Future-proof (newer devices)

**Recommendation:**
Opus + VP8 for best compatibility.`,
    placement: 'right', position: 'right',
    category: 'settings',
    showProgress: true
  },
  {
    id: 'voip-turn-servers',
    target: '[data-tour="turn-servers"]',
    title: '🌐 TURN/STUN Servers',
    content: `Configure NAT traversal servers:

**Server Types:**
• **STUN**: Discover public IP (free)
• **TURN**: Relay traffic (paid/self-hosted)

**Supported Providers:**
• Google STUN (default, free)
• Twilio (enterprise)
• Xirsys (pay-as-you-go)
• Metered.ca (free tier)
• Self-hosted coturn

**When to use TURN:**
Corporate firewalls, symmetric NAT, strict networks.`,
    placement: 'left', position: 'left',
    category: 'settings',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: Call History
  // ============================================================================
  {
    id: 'voip-call-history',
    target: '[data-tour="call-history"]',
    title: '📋 Call History',
    content: `Review your past calls:

**History Features:**
• Complete call log
• Grouped by date
• Filter by type
• Quick callback

**Entry Information:**
• Contact name
• Call type (audio/video)
• Direction (in/out)
• Duration & quality
• Timestamp`,
    placement: 'left', position: 'left',
    category: 'history',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'voip-history-filters',
    target: '[data-tour="history-filters"]',
    title: '🔍 History Filters',
    content: `Filter your call history:

**Filter Options:**
• **All**: Complete history
• **📵 Missed**: Unanswered calls
• **📞 Audio**: Voice-only calls
• **📹 Video**: Video calls

**Use Cases:**
• Check missed calls quickly
• Review video conference history
• Audit call patterns`,
    placement: 'bottom', position: 'bottom',
    category: 'history',
    showProgress: true
  },
  {
    id: 'voip-history-entry',
    target: '[data-tour="history-entry"]',
    title: '📝 Call Entry Details',
    content: `Each history entry shows:

**Call Information:**
• Contact name
• Call type icon
• Direction indicator
• Timestamp (grouped by day)
• Duration (if connected)

**Status Colors:**
• 🟢 Completed: Successful call
• 🔴 Missed/Failed: No connection
• 🟡 Declined/Cancelled: User action

**Callback:**
Click 📞 to quickly return a call.`,
    placement: 'right', position: 'right',
    category: 'history',
    showProgress: true
  },
  {
    id: 'voip-callback',
    target: '[data-tour="callback-button"]',
    title: '📲 Quick Callback',
    content: `Return calls instantly:

**Callback Action:**
• One-click to call back
• Uses same call type as original
• Contact details auto-filled

**From History:**
1. Find the call entry
2. Click callback button
3. Call initiates immediately

Great for returning missed calls quickly!`,
    placement: 'left', position: 'left',
    category: 'history',
    highlightClicks: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: Tour Completion
  // ============================================================================
  {
    id: 'voip-complete',
    target: '[data-tour="voip-module"]',
    title: '✅ VoIP Tour Complete!',
    content: `You've mastered CUBE VoIP!

**Topics Covered:**
✓ Contact management & presence
✓ Making audio/video calls
✓ Call controls & statistics
✓ Audio device configuration
✓ TURN/STUN server setup
✓ Call history & callbacks

**Pro Tips:**
• Test audio before important calls
• Use Opus codec for best quality
• Configure TURN for corporate networks
• Check call stats if quality drops

**Keyboard Shortcuts:**
• \`M\` - Toggle mute
• \`V\` - Toggle video
• \`Esc\` - End call

Ready for enterprise communications!`,
    placement: 'center', position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for VoIP
 */
export const voipTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '📞' },
  { id: 'contacts', title: 'Contacts', icon: '👥' },
  { id: 'calls', title: 'Call Controls', icon: '🎮' },
  { id: 'settings', title: 'Settings', icon: '⚙️' },
  { id: 'history', title: 'History', icon: '📋' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getVoipStepsBySection = (sectionId: string): TourStep[] => {
  return voipTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getVoipRequiredSteps = (): TourStep[] => {
  return voipTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const voipTourConfig = {
  id: 'voip-tour',
  name: 'VoIP Communication Tour',
  description: 'Learn to use enterprise voice and video communication',
  version: '1.0.0',
  totalSteps: voipTourSteps.length,
  estimatedTime: '5 minutes',
  sections: voipTourSections,
  features: [
    'WebRTC audio/video calls',
    'Contact management',
    'TURN/STUN configuration',
    'Call history',
    'Audio device settings'
  ]
};

export default voipTourSteps;
