/**
 * CUBE Nexum Video Conference - Standalone Page
 * Full video conferencing in a dedicated extension page with proper media access
 * 
 * @version 1.0.0
 */

console.log('[VideoConference] Page loaded');

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

const state = {
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  dataChannel: null,
  isVideoOn: false,
  isAudioOn: true,
  isScreenSharing: false,
  isHost: false,
  roomId: null
};

// WebRTC configuration
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const elements = {
  localVideo: document.getElementById('localVideo'),
  remoteVideo: document.getElementById('remoteVideo'),
  localPlaceholder: document.getElementById('localPlaceholder'),
  remotePlaceholder: document.getElementById('remotePlaceholder'),
  btnCamera: document.getElementById('btnCamera'),
  btnMic: document.getElementById('btnMic'),
  btnScreen: document.getElementById('btnScreen'),
  btnEnd: document.getElementById('btnEnd'),
  btnCreateRoom: document.getElementById('btnCreateRoom'),
  btnJoinRoom: document.getElementById('btnJoinRoom'),
  createRoomSection: document.getElementById('createRoomSection'),
  joinRoomSection: document.getElementById('joinRoomSection'),
  answerSection: document.getElementById('answerSection'),
  hostAnswerSection: document.getElementById('hostAnswerSection'),
  offerCode: document.getElementById('offerCode'),
  answerCode: document.getElementById('answerCode'),
  answerResponse: document.getElementById('answerResponse'),
  hostAnswerInput: document.getElementById('hostAnswerInput'),
  btnCopyOffer: document.getElementById('btnCopyOffer'),
  btnCopyAnswer: document.getElementById('btnCopyAnswer'),
  btnConnect: document.getElementById('btnConnect'),
  btnApplyAnswer: document.getElementById('btnApplyAnswer'),
  statusMessage: document.getElementById('statusMessage'),
  connectionStatus: document.getElementById('connectionStatus'),
  permissionNotice: document.getElementById('permissionNotice')
};

// ═══════════════════════════════════════════════════════════════════════════════
// CAMERA/MICROPHONE
// ═══════════════════════════════════════════════════════════════════════════════

async function toggleCamera() {
  console.log('[VideoConference] Toggle camera, current state:', state.isVideoOn);
  
  try {
    if (!state.isVideoOn) {
      // Start camera
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: state.isAudioOn
      };
      
      console.log('[VideoConference] Requesting getUserMedia...');
      state.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('[VideoConference] Got stream:', state.localStream.id);
      
      elements.localVideo.srcObject = state.localStream;
      elements.localPlaceholder.style.display = 'none';
      elements.permissionNotice.classList.remove('show');
      
      state.isVideoOn = true;
      elements.btnCamera.classList.add('active');
      
      // Add tracks to peer connection if exists
      if (state.peerConnection) {
        state.localStream.getTracks().forEach(track => {
          state.peerConnection.addTrack(track, state.localStream);
        });
      }
      
      showStatus('Camera started', 'success');
      
    } else {
      // Stop camera
      if (state.localStream) {
        state.localStream.getVideoTracks().forEach(track => track.stop());
      }
      
      elements.localPlaceholder.style.display = 'flex';
      state.isVideoOn = false;
      elements.btnCamera.classList.remove('active');
      
      showStatus('Camera stopped', 'info');
    }
  } catch (error) {
    console.error('[VideoConference] Camera error:', error);
    
    let message = error.message;
    if (error.name === 'NotAllowedError') {
      if (error.message.includes('system')) {
        message = 'Camera blocked by system. Go to System Settings → Privacy & Security → Camera → Enable Chrome';
        elements.permissionNotice.classList.add('show');
      } else {
        message = 'Camera access denied. Please click Allow when prompted.';
      }
    } else if (error.name === 'NotFoundError') {
      message = 'No camera found. Please connect a camera.';
    } else if (error.name === 'NotReadableError') {
      message = 'Camera in use by another app.';
    }
    
    showStatus(message, 'error');
  }
}

function toggleMicrophone() {
  if (state.localStream) {
    const audioTracks = state.localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    
    state.isAudioOn = audioTracks.length > 0 && audioTracks[0].enabled;
    elements.btnMic.classList.toggle('active', state.isAudioOn);
    elements.btnMic.textContent = state.isAudioOn ? '🎤' : '🔇';
    
    showStatus(state.isAudioOn ? 'Microphone on' : 'Microphone muted', 'info');
  } else {
    showStatus('Start camera first', 'error');
  }
}

async function toggleScreenShare() {
  try {
    if (!state.isScreenSharing) {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: true
      });
      
      // Replace video track
      if (state.localStream) {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = state.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
      
      elements.localVideo.srcObject = stream;
      state.isScreenSharing = true;
      elements.btnScreen.classList.add('active');
      
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
      showStatus('Screen sharing started', 'success');
      
    } else {
      stopScreenShare();
    }
  } catch (error) {
    console.error('[VideoConference] Screen share error:', error);
    showStatus('Screen share failed: ' + error.message, 'error');
  }
}

function stopScreenShare() {
  if (state.localStream && state.isVideoOn) {
    elements.localVideo.srcObject = state.localStream;
    
    const videoTrack = state.localStream.getVideoTracks()[0];
    const sender = state.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
    if (sender && videoTrack) {
      sender.replaceTrack(videoTrack);
    }
  }
  
  state.isScreenSharing = false;
  elements.btnScreen.classList.remove('active');
  showStatus('Screen sharing stopped', 'info');
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEBRTC CONNECTION
// ═══════════════════════════════════════════════════════════════════════════════

async function createRoom() {
  console.log('[VideoConference] Creating room...');
  
  state.isHost = true;
  elements.createRoomSection.style.display = 'block';
  elements.joinRoomSection.style.display = 'none';
  elements.offerCode.value = 'Generating connection code...';
  
  try {
    // Start camera first
    if (!state.isVideoOn) {
      await toggleCamera();
    }
    
    // Create peer connection
    state.peerConnection = new RTCPeerConnection(rtcConfig);
    console.log('[VideoConference] Peer connection created');
    
    // Add local tracks
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => {
        state.peerConnection.addTrack(track, state.localStream);
      });
    }
    
    // Create data channel
    state.dataChannel = state.peerConnection.createDataChannel('chat');
    setupDataChannel(state.dataChannel);
    
    // Handle ICE candidates
    let iceDone = false;
    state.peerConnection.onicecandidate = (event) => {
      if (!event.candidate && !iceDone) {
        iceDone = true;
        const offerCode = btoa(JSON.stringify(state.peerConnection.localDescription));
        elements.offerCode.value = offerCode;
        elements.hostAnswerSection.style.display = 'block';
        showStatus('Room created! Share the code with others.', 'success');
      }
    };
    
    // Handle connection state
    state.peerConnection.onconnectionstatechange = () => {
      updateConnectionStatus(state.peerConnection.connectionState);
    };
    
    // Handle remote stream
    state.peerConnection.ontrack = (event) => {
      console.log('[VideoConference] Received remote track');
      state.remoteStream = event.streams[0];
      elements.remoteVideo.srcObject = state.remoteStream;
      elements.remotePlaceholder.style.display = 'none';
    };
    
    // Create offer
    const offer = await state.peerConnection.createOffer();
    await state.peerConnection.setLocalDescription(offer);
    
    // Timeout fallback
    setTimeout(() => {
      if (!iceDone && state.peerConnection?.localDescription) {
        iceDone = true;
        const offerCode = btoa(JSON.stringify(state.peerConnection.localDescription));
        elements.offerCode.value = offerCode;
        elements.hostAnswerSection.style.display = 'block';
        showStatus('Room code ready (ICE may still be gathering)', 'info');
      }
    }, 3000);
    
  } catch (error) {
    console.error('[VideoConference] Create room error:', error);
    showStatus('Failed to create room: ' + error.message, 'error');
  }
}

async function joinRoom() {
  console.log('[VideoConference] Join room mode');
  
  state.isHost = false;
  elements.joinRoomSection.style.display = 'block';
  elements.createRoomSection.style.display = 'none';
}

async function connectToRoom() {
  const offerCode = elements.answerCode.value.trim();
  if (!offerCode) {
    showStatus('Please paste the room code', 'error');
    return;
  }
  
  console.log('[VideoConference] Connecting to room...');
  
  try {
    // Start camera first
    if (!state.isVideoOn) {
      await toggleCamera();
    }
    
    // Parse offer
    const offer = JSON.parse(atob(offerCode));
    
    // Create peer connection
    state.peerConnection = new RTCPeerConnection(rtcConfig);
    console.log('[VideoConference] Peer connection created');
    
    // Add local tracks
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => {
        state.peerConnection.addTrack(track, state.localStream);
      });
    }
    
    // Handle data channel
    state.peerConnection.ondatachannel = (event) => {
      state.dataChannel = event.channel;
      setupDataChannel(state.dataChannel);
    };
    
    // Handle ICE candidates
    let iceDone = false;
    state.peerConnection.onicecandidate = (event) => {
      if (!event.candidate && !iceDone) {
        iceDone = true;
        const answerCode = btoa(JSON.stringify(state.peerConnection.localDescription));
        elements.answerResponse.value = answerCode;
        elements.answerSection.style.display = 'block';
        showStatus('Answer ready! Copy and send to host.', 'success');
      }
    };
    
    // Handle connection state
    state.peerConnection.onconnectionstatechange = () => {
      updateConnectionStatus(state.peerConnection.connectionState);
    };
    
    // Handle remote stream
    state.peerConnection.ontrack = (event) => {
      console.log('[VideoConference] Received remote track');
      state.remoteStream = event.streams[0];
      elements.remoteVideo.srcObject = state.remoteStream;
      elements.remotePlaceholder.style.display = 'none';
    };
    
    // Set remote description and create answer
    await state.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await state.peerConnection.createAnswer();
    await state.peerConnection.setLocalDescription(answer);
    
    // Timeout fallback
    setTimeout(() => {
      if (!iceDone && state.peerConnection?.localDescription) {
        iceDone = true;
        const answerCode = btoa(JSON.stringify(state.peerConnection.localDescription));
        elements.answerResponse.value = answerCode;
        elements.answerSection.style.display = 'block';
        showStatus('Answer code ready', 'info');
      }
    }, 3000);
    
  } catch (error) {
    console.error('[VideoConference] Connect error:', error);
    showStatus('Failed to connect: ' + error.message, 'error');
  }
}

async function applyAnswer() {
  const answerCode = elements.hostAnswerInput.value.trim();
  if (!answerCode) {
    showStatus('Please paste the answer code', 'error');
    return;
  }
  
  try {
    const answer = JSON.parse(atob(answerCode));
    await state.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    showStatus('Connected! Call is now active.', 'success');
  } catch (error) {
    console.error('[VideoConference] Apply answer error:', error);
    showStatus('Failed to apply answer: ' + error.message, 'error');
  }
}

function setupDataChannel(channel) {
  channel.onopen = () => {
    console.log('[VideoConference] Data channel opened');
    showStatus('Data channel connected', 'success');
  };
  
  channel.onmessage = (event) => {
    console.log('[VideoConference] Data channel message:', event.data);
  };
  
  channel.onclose = () => {
    console.log('[VideoConference] Data channel closed');
  };
}

function endCall() {
  console.log('[VideoConference] Ending call...');
  
  // Stop local stream
  if (state.localStream) {
    state.localStream.getTracks().forEach(track => track.stop());
    state.localStream = null;
  }
  
  // Close peer connection
  if (state.peerConnection) {
    state.peerConnection.close();
    state.peerConnection = null;
  }
  
  // Reset UI
  elements.localVideo.srcObject = null;
  elements.remoteVideo.srcObject = null;
  elements.localPlaceholder.style.display = 'flex';
  elements.remotePlaceholder.style.display = 'flex';
  elements.createRoomSection.style.display = 'none';
  elements.joinRoomSection.style.display = 'none';
  elements.answerSection.style.display = 'none';
  elements.hostAnswerSection.style.display = 'none';
  
  // Reset state
  state.isVideoOn = false;
  state.isAudioOn = true;
  state.isScreenSharing = false;
  elements.btnCamera.classList.remove('active');
  elements.btnMic.classList.add('active');
  elements.btnMic.textContent = '🎤';
  elements.btnScreen.classList.remove('active');
  
  updateConnectionStatus('disconnected');
  showStatus('Call ended', 'info');
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function showStatus(message, type = 'info') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = 'status ' + type;
  elements.statusMessage.style.display = 'block';
  
  // Auto-hide after 5 seconds for success/info
  if (type !== 'error') {
    setTimeout(() => {
      elements.statusMessage.style.display = 'none';
    }, 5000);
  }
}

function updateConnectionStatus(status) {
  const statusMap = {
    'new': '🔵 New',
    'connecting': '🟡 Connecting...',
    'connected': '🟢 Connected',
    'disconnected': '⚪ Disconnected',
    'failed': '🔴 Failed',
    'closed': '⚪ Closed'
  };
  
  elements.connectionStatus.textContent = statusMap[status] || status;
  elements.connectionStatus.className = 'status ' + (status === 'connected' ? 'success' : '');
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showStatus('Copied to clipboard!', 'success');
  }).catch(err => {
    showStatus('Failed to copy', 'error');
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════

elements.btnCamera.addEventListener('click', toggleCamera);
elements.btnMic.addEventListener('click', toggleMicrophone);
elements.btnScreen.addEventListener('click', toggleScreenShare);
elements.btnEnd.addEventListener('click', endCall);
elements.btnCreateRoom.addEventListener('click', createRoom);
elements.btnJoinRoom.addEventListener('click', joinRoom);
elements.btnConnect.addEventListener('click', connectToRoom);
elements.btnApplyAnswer.addEventListener('click', applyAnswer);
elements.btnCopyOffer.addEventListener('click', () => copyToClipboard(elements.offerCode.value));
elements.btnCopyAnswer.addEventListener('click', () => copyToClipboard(elements.answerResponse.value));

// Check for existing permission status on load
async function checkPermissions() {
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const result = await navigator.permissions.query({ name: 'camera' });
      console.log('[VideoConference] Camera permission:', result.state);
      
      if (result.state === 'denied') {
        elements.permissionNotice.classList.add('show');
      }
    }
  } catch (e) {
    console.log('[VideoConference] Permission check not supported');
  }
}

checkPermissions();

console.log('[VideoConference] Video conference page ready');
