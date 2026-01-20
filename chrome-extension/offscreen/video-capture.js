/**
 * CUBE Nexum Video Capture - Offscreen Document
 * Handles camera/microphone access for the extension
 * 
 * @version 1.0.0
 */

console.log('[VideoCapture] Offscreen document loaded');

let localStream = null;
let isVideoOn = false;
let isAudioOn = true;

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[VideoCapture] Received message:', message.type);
  
  switch (message.type) {
    case 'VIDEO_START_CAMERA':
      startCamera(message.constraints || {})
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message, errorName: error.name }));
      return true; // Keep channel open for async response
      
    case 'VIDEO_STOP_CAMERA':
      stopCamera();
      sendResponse({ success: true });
      return false;
      
    case 'VIDEO_TOGGLE_AUDIO':
      toggleAudio();
      sendResponse({ success: true, isAudioOn });
      return false;
      
    case 'VIDEO_GET_STATUS':
      sendResponse({
        success: true,
        isVideoOn,
        isAudioOn,
        hasStream: !!localStream
      });
      return false;
      
    case 'VIDEO_CHECK_PERMISSIONS':
      checkPermissions()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    default:
      return false;
  }
});

/**
 * Check camera/microphone permissions
 */
async function checkPermissions() {
  try {
    const results = {};
    
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' });
        results.camera = cameraPermission.state;
      } catch (e) {
        results.camera = 'unknown';
      }
      
      try {
        const micPermission = await navigator.permissions.query({ name: 'microphone' });
        results.microphone = micPermission.state;
      } catch (e) {
        results.microphone = 'unknown';
      }
    } else {
      results.camera = 'unknown';
      results.microphone = 'unknown';
    }
    
    return { success: true, permissions: results };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Start camera capture
 */
async function startCamera(customConstraints = {}) {
  console.log('[VideoCapture] Starting camera...');
  
  try {
    // Stop existing stream first
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    
    // Default constraints
    const constraints = {
      video: customConstraints.video || {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: customConstraints.audio !== false
    };
    
    console.log('[VideoCapture] Requesting getUserMedia with constraints:', constraints);
    
    // Request media access
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    console.log('[VideoCapture] Got stream:', localStream.id);
    console.log('[VideoCapture] Video tracks:', localStream.getVideoTracks().length);
    console.log('[VideoCapture] Audio tracks:', localStream.getAudioTracks().length);
    
    // Set video element source (for keeping stream alive)
    const videoEl = document.getElementById('localVideo');
    if (videoEl) {
      videoEl.srcObject = localStream;
    }
    
    isVideoOn = true;
    isAudioOn = localStream.getAudioTracks().length > 0;
    
    // Return stream info (not the stream itself - that needs to be transferred differently)
    return {
      success: true,
      streamId: localStream.id,
      videoTracks: localStream.getVideoTracks().map(t => ({
        id: t.id,
        label: t.label,
        enabled: t.enabled
      })),
      audioTracks: localStream.getAudioTracks().map(t => ({
        id: t.id,
        label: t.label,
        enabled: t.enabled
      }))
    };
    
  } catch (error) {
    console.error('[VideoCapture] Camera error:', error);
    console.error('[VideoCapture] Error name:', error.name);
    console.error('[VideoCapture] Error message:', error.message);
    
    isVideoOn = false;
    
    // Provide detailed error info
    let userMessage = error.message;
    
    if (error.name === 'NotAllowedError') {
      if (error.message.includes('system') || error.message.includes('denied by system')) {
        userMessage = 'Camera access is blocked by your operating system. ' +
          'macOS: System Settings → Privacy & Security → Camera → Enable Chrome. ' +
          'Windows: Settings → Privacy → Camera → Allow apps.';
      } else {
        userMessage = 'Camera access denied. Please allow camera access in Chrome settings.';
      }
    } else if (error.name === 'NotFoundError') {
      userMessage = 'No camera found. Please connect a camera and try again.';
    } else if (error.name === 'NotReadableError') {
      userMessage = 'Camera is in use by another application.';
    }
    
    return {
      success: false,
      error: userMessage,
      errorName: error.name,
      originalError: error.message
    };
  }
}

/**
 * Stop camera capture
 */
function stopCamera() {
  console.log('[VideoCapture] Stopping camera...');
  
  if (localStream) {
    localStream.getTracks().forEach(track => {
      console.log('[VideoCapture] Stopping track:', track.kind, track.label);
      track.stop();
    });
    localStream = null;
  }
  
  const videoEl = document.getElementById('localVideo');
  if (videoEl) {
    videoEl.srcObject = null;
  }
  
  isVideoOn = false;
  console.log('[VideoCapture] Camera stopped');
}

/**
 * Toggle audio on/off
 */
function toggleAudio() {
  if (localStream) {
    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    isAudioOn = audioTracks.length > 0 && audioTracks[0].enabled;
  }
}

/**
 * Get the current stream (for transferring to other contexts)
 */
function getStream() {
  return localStream;
}

// Export for potential direct access
window.CubeVideoCapture = {
  startCamera,
  stopCamera,
  toggleAudio,
  checkPermissions,
  getStream,
  get isVideoOn() { return isVideoOn; },
  get isAudioOn() { return isAudioOn; }
};

console.log('[VideoCapture] Video capture service ready');
