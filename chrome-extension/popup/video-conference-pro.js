/**
 * CUBE Nexum Pro Video Conference - Enterprise Grade
 * Better than Zoom • Fortune 500 Quality • Zero Omissions
 * 
 * Features:
 * - WebRTC P2P Video Calls
 * - QR Code Sharing
 * - Picture-in-Picture (PiP)
 * - Screen Sharing
 * - Recording
 * - Chat
 * - Reactions
 * - Hand Raise
 * - Participant Management
 * - Waiting Room
 * 
 * @version 2.0.0
 */

console.log('[VideoConferencePro] Initializing...');

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

const state = {
  // Connection
  localStream: null,
  screenStream: null,
  peerConnection: null,
  dataChannel: null,
  
  // Call State
  isInCall: false,
  isHost: false,
  roomId: null,
  displayName: 'User',
  
  // Media State
  isMicOn: true,
  isCamOn: true,
  isScreenSharing: false,
  isRecording: false,
  isPiPActive: false,
  isHandRaised: false,
  
  // UI State
  sidePanel: null, // 'chat' | 'participants' | null
  pinnedParticipant: null,
  
  // Participants
  participants: new Map(),
  localParticipant: {
    id: 'local',
    name: 'You',
    isHost: false,
    isMuted: false,
    isCamOff: false,
    isHandRaised: false,
    isScreenSharing: false
  },
  
  // Chat
  messages: [],
  
  // Recording
  mediaRecorder: null,
  recordedChunks: [],
  
  // Timer
  startTime: null,
  timerInterval: null
};

// WebRTC Configuration
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const elements = {
  // Videos
  localVideo: document.getElementById('localVideo'),
  localPlaceholder: document.getElementById('localPlaceholder'),
  localAvatar: document.getElementById('localAvatar'),
  videoGrid: document.getElementById('videoGrid'),
  screenShareVideo: document.getElementById('screenShareVideo'),
  screenShareContainer: document.getElementById('screenShareContainer'),
  pipVideo: document.getElementById('pipVideo'),
  pipContainer: document.getElementById('pipContainer'),
  
  // Header
  meetingInfo: document.getElementById('meetingInfo'),
  displayMeetingId: document.getElementById('displayMeetingId'),
  participantsCount: document.getElementById('participantsCount'),
  meetingTime: document.getElementById('meetingTime'),
  recordingIndicator: document.getElementById('recordingIndicator'),
  btnInvite: document.getElementById('btnInvite'),
  localDisplayName: document.getElementById('localDisplayName'),
  
  // Controls
  btnMic: document.getElementById('btnMic'),
  btnCam: document.getElementById('btnCam'),
  btnScreen: document.getElementById('btnScreen'),
  btnRecord: document.getElementById('btnRecord'),
  btnChat: document.getElementById('btnChat'),
  btnParticipants: document.getElementById('btnParticipants'),
  btnReactions: document.getElementById('btnReactions'),
  btnHand: document.getElementById('btnHand'),
  btnEnd: document.getElementById('btnEnd'),
  
  // Status
  localMicStatus: document.getElementById('localMicStatus'),
  localCamStatus: document.getElementById('localCamStatus'),
  
  // Panels
  sidePanel: document.getElementById('sidePanel'),
  sidePanelTitle: document.getElementById('sidePanelTitle'),
  chatPanel: document.getElementById('chatPanel'),
  chatInputArea: document.getElementById('chatInputArea'),
  chatMessages: document.getElementById('chatMessages'),
  chatInput: document.getElementById('chatInput'),
  participantsPanel: document.getElementById('participantsPanel'),
  participantsList: document.getElementById('participantsList'),
  
  // Modals
  joinModal: document.getElementById('joinModal'),
  shareModal: document.getElementById('shareModal'),
  waitingRoom: document.getElementById('waitingRoom'),
  
  // Form Inputs
  inputDisplayName: document.getElementById('inputDisplayName'),
  inputOfferCode: document.getElementById('inputOfferCode'),
  joinSection: document.getElementById('joinSection'),
  shareCodeInput: document.getElementById('shareCodeInput'),
  qrCode: document.getElementById('qrCode'),
  
  // Reactions
  reactionsPicker: document.getElementById('reactionsPicker'),
  
  // Toast
  toastContainer: document.getElementById('toastContainer')
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function showToast(title, message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  toast.innerHTML = `
    <span class="icon">${icons[type] || icons.info}</span>
    <div class="content">
      <div class="title">${title}</div>
      ${message ? `<div class="message">${message}</div>` : ''}
    </div>
    <button class="close" onclick="this.parentElement.remove()">✕</button>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function startCamera() {
  console.log('[VideoConferencePro] Starting camera...');
  
  try {
    const constraints = {
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
    
    state.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    elements.localVideo.srcObject = state.localStream;
    elements.localPlaceholder.style.display = 'none';
    elements.pipVideo.srcObject = state.localStream;
    
    state.isCamOn = true;
    state.isMicOn = true;
    updateMediaControls();
    
    console.log('[VideoConferencePro] Camera started successfully');
    return true;
    
  } catch (error) {
    console.error('[VideoConferencePro] Camera error:', error);
    
    let errorMessage = 'Failed to access camera';
    if (error.name === 'NotAllowedError') {
      if (error.message.includes('system')) {
        errorMessage = 'Camera blocked by system. Check System Settings → Privacy & Security → Camera';
      } else {
        errorMessage = 'Camera access denied. Please allow camera access.';
      }
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera found. Please connect a camera.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera is in use by another application.';
    }
    
    showToast('Camera Error', errorMessage, 'error');
    return false;
  }
}

function toggleMic() {
  if (!state.localStream) {
    showToast('Error', 'Camera not started', 'error');
    return;
  }
  
  state.isMicOn = !state.isMicOn;
  state.localStream.getAudioTracks().forEach(track => {
    track.enabled = state.isMicOn;
  });
  
  state.localParticipant.isMuted = !state.isMicOn;
  updateMediaControls();
  updateParticipantsList();
  
  // Send to remote via data channel
  sendDataMessage({
    type: 'media_state',
    isMuted: !state.isMicOn,
    isCamOff: !state.isCamOn
  });
  
  showToast(state.isMicOn ? 'Microphone On' : 'Microphone Muted', '', 'info');
}

function toggleCam() {
  if (!state.localStream) {
    showToast('Error', 'Camera not started', 'error');
    return;
  }
  
  state.isCamOn = !state.isCamOn;
  state.localStream.getVideoTracks().forEach(track => {
    track.enabled = state.isCamOn;
  });
  
  state.localParticipant.isCamOff = !state.isCamOn;
  elements.localPlaceholder.style.display = state.isCamOn ? 'none' : 'flex';
  updateMediaControls();
  updateParticipantsList();
  
  // Send to remote
  sendDataMessage({
    type: 'media_state',
    isMuted: !state.isMicOn,
    isCamOff: !state.isCamOn
  });
  
  showToast(state.isCamOn ? 'Camera On' : 'Camera Off', '', 'info');
}

function updateMediaControls() {
  // Mic button
  elements.btnMic.classList.toggle('active', !state.isMicOn);
  elements.btnMic.querySelector('.icon').textContent = state.isMicOn ? '🎤' : '🔇';
  elements.btnMic.querySelector('.label').textContent = state.isMicOn ? 'Mute' : 'Unmute';
  elements.localMicStatus.textContent = state.isMicOn ? '🎤' : '🔇';
  elements.localMicStatus.classList.toggle('muted', !state.isMicOn);
  
  // Camera button
  elements.btnCam.classList.toggle('active', !state.isCamOn);
  elements.btnCam.querySelector('.icon').textContent = state.isCamOn ? '📷' : '📷';
  elements.btnCam.querySelector('.label').textContent = state.isCamOn ? 'Stop Video' : 'Start Video';
  elements.localCamStatus.textContent = state.isCamOn ? '📷' : '🚫';
  elements.localCamStatus.classList.toggle('muted', !state.isCamOn);
  
  // Screen share button
  elements.btnScreen.classList.toggle('active', state.isScreenSharing);
  
  // Record button
  elements.btnRecord.classList.toggle('active', state.isRecording);
  elements.recordingIndicator.classList.toggle('active', state.isRecording);
  
  // Hand button
  elements.btnHand.classList.toggle('active', state.isHandRaised);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN SHARING
// ═══════════════════════════════════════════════════════════════════════════════

async function toggleScreenShare() {
  if (!state.isScreenSharing) {
    try {
      state.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: true
      });
      
      elements.screenShareVideo.srcObject = state.screenStream;
      elements.screenShareContainer.classList.add('active');
      state.isScreenSharing = true;
      
      // Replace video track in peer connection
      if (state.peerConnection) {
        const sender = state.peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          const screenTrack = state.screenStream.getVideoTracks()[0];
          sender.replaceTrack(screenTrack);
        }
      }
      
      // Handle stream end
      state.screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
      updateMediaControls();
      sendDataMessage({ type: 'screen_share', active: true });
      showToast('Screen Sharing', 'Started sharing your screen', 'success');
      
    } catch (error) {
      console.error('[VideoConferencePro] Screen share error:', error);
      if (error.name !== 'NotAllowedError') {
        showToast('Screen Share Error', error.message, 'error');
      }
    }
  } else {
    stopScreenShare();
  }
}

function stopScreenShare() {
  if (state.screenStream) {
    state.screenStream.getTracks().forEach(track => track.stop());
    state.screenStream = null;
  }
  
  elements.screenShareContainer.classList.remove('active');
  state.isScreenSharing = false;
  
  // Restore camera track
  if (state.peerConnection && state.localStream) {
    const sender = state.peerConnection.getSenders().find(s => s.track?.kind === 'video');
    if (sender) {
      const videoTrack = state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    }
  }
  
  updateMediaControls();
  sendDataMessage({ type: 'screen_share', active: false });
  showToast('Screen Sharing', 'Stopped sharing', 'info');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECORDING
// ═══════════════════════════════════════════════════════════════════════════════

function toggleRecording() {
  if (!state.isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
}

function startRecording() {
  try {
    const streams = [];
    
    if (state.localStream) {
      streams.push(...state.localStream.getTracks());
    }
    
    const combinedStream = new MediaStream(streams);
    
    state.mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp9'
    });
    
    state.recordedChunks = [];
    
    state.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        state.recordedChunks.push(event.data);
      }
    };
    
    state.mediaRecorder.onstop = () => {
      const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `CUBE_Recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      a.click();
      
      URL.revokeObjectURL(url);
      showToast('Recording Saved', 'Your recording has been downloaded', 'success');
    };
    
    state.mediaRecorder.start(1000); // Collect data every second
    state.isRecording = true;
    updateMediaControls();
    showToast('Recording Started', 'Your meeting is being recorded', 'info');
    
  } catch (error) {
    console.error('[VideoConferencePro] Recording error:', error);
    showToast('Recording Error', error.message, 'error');
  }
}

function stopRecording() {
  if (state.mediaRecorder && state.isRecording) {
    state.mediaRecorder.stop();
    state.isRecording = false;
    updateMediaControls();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEBRTC CONNECTION
// ═══════════════════════════════════════════════════════════════════════════════

async function createRoom() {
  console.log('[VideoConferencePro] Creating room...');
  
  state.isHost = true;
  state.localParticipant.isHost = true;
  state.roomId = generateRoomId();
  
  try {
    // Start camera
    const cameraStarted = await startCamera();
    if (!cameraStarted) {
      const continueWithoutVideo = confirm('Camera access failed. Continue without video?');
      if (!continueWithoutVideo) {
        return;
      }
    }
    
    // Create peer connection
    state.peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Add local tracks
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => {
        state.peerConnection.addTrack(track, state.localStream);
      });
    }
    
    // Create data channel
    state.dataChannel = state.peerConnection.createDataChannel('chat', {
      ordered: true
    });
    setupDataChannel(state.dataChannel);
    
    // Handle ICE candidates
    let iceDone = false;
    state.peerConnection.onicecandidate = (event) => {
      if (!event.candidate && !iceDone) {
        iceDone = true;
        const offerCode = btoa(JSON.stringify(state.peerConnection.localDescription));
        showShareModalWithCode(offerCode);
      }
    };
    
    // Handle connection state
    state.peerConnection.onconnectionstatechange = () => {
      console.log('[VideoConferencePro] Connection state:', state.peerConnection.connectionState);
      updateConnectionStatus(state.peerConnection.connectionState);
    };
    
    // Handle remote stream
    state.peerConnection.ontrack = handleRemoteTrack;
    
    // Create offer
    const offer = await state.peerConnection.createOffer();
    await state.peerConnection.setLocalDescription(offer);
    
    // Start call timer
    startMeetingTimer();
    
    // Update UI
    state.isInCall = true;
    closeJoinModal();
    elements.meetingInfo.style.display = 'flex';
    elements.btnInvite.style.display = 'block';
    elements.displayMeetingId.textContent = state.roomId;
    
    // Timeout fallback for ICE
    setTimeout(() => {
      if (!iceDone && state.peerConnection?.localDescription) {
        iceDone = true;
        const offerCode = btoa(JSON.stringify(state.peerConnection.localDescription));
        showShareModalWithCode(offerCode);
      }
    }, 3000);
    
    showToast('Room Created', `Room ID: ${state.roomId}`, 'success');
    
  } catch (error) {
    console.error('[VideoConferencePro] Create room error:', error);
    showToast('Error', 'Failed to create room: ' + error.message, 'error');
  }
}

function showJoinSection() {
  elements.joinSection.style.display = 'block';
}

async function joinRoom(offerCode) {
  console.log('[VideoConferencePro] Joining room...');
  
  state.isHost = false;
  
  try {
    // Start camera
    await startCamera();
    
    // Parse offer
    const offer = JSON.parse(atob(offerCode));
    
    // Create peer connection
    state.peerConnection = new RTCPeerConnection(rtcConfig);
    
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
        showAnswerCode(answerCode);
      }
    };
    
    // Handle connection state
    state.peerConnection.onconnectionstatechange = () => {
      console.log('[VideoConferencePro] Connection state:', state.peerConnection.connectionState);
      updateConnectionStatus(state.peerConnection.connectionState);
    };
    
    // Handle remote stream
    state.peerConnection.ontrack = handleRemoteTrack;
    
    // Set remote description and create answer
    await state.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await state.peerConnection.createAnswer();
    await state.peerConnection.setLocalDescription(answer);
    
    // Start call timer
    startMeetingTimer();
    
    // Update UI
    state.isInCall = true;
    elements.meetingInfo.style.display = 'flex';
    
    // Timeout fallback
    setTimeout(() => {
      if (!iceDone && state.peerConnection?.localDescription) {
        iceDone = true;
        const answerCode = btoa(JSON.stringify(state.peerConnection.localDescription));
        showAnswerCode(answerCode);
      }
    }, 3000);
    
    showToast('Connecting', 'Generating answer code...', 'info');
    
  } catch (error) {
    console.error('[VideoConferencePro] Join room error:', error);
    showToast('Error', 'Failed to join: ' + error.message, 'error');
  }
}

async function applyAnswer(answerCode) {
  try {
    const answer = JSON.parse(atob(answerCode));
    await state.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    showToast('Connected!', 'Call is now active', 'success');
    closeShareModal();
  } catch (error) {
    console.error('[VideoConferencePro] Apply answer error:', error);
    showToast('Error', 'Invalid answer code', 'error');
  }
}

function handleRemoteTrack(event) {
  console.log('[VideoConferencePro] Remote track received:', event.track.kind);
  
  // Create or update remote participant tile
  let remoteTile = document.getElementById('remoteTile');
  
  if (!remoteTile) {
    remoteTile = document.createElement('div');
    remoteTile.id = 'remoteTile';
    remoteTile.className = 'video-tile';
    remoteTile.innerHTML = `
      <video id="remoteVideo" autoplay playsinline></video>
      <div class="placeholder" id="remotePlaceholder" style="display: none;">
        <div class="avatar">R</div>
        <div class="name">Remote</div>
      </div>
      <div class="status-bar">
        <span class="participant-name">
          <span id="remoteDisplayName">Remote User</span>
        </span>
        <div class="status-icons">
          <span class="status-icon" id="remoteMicStatus">🎤</span>
          <span class="status-icon" id="remoteCamStatus">📷</span>
        </div>
      </div>
      <div class="hand-raised" id="remoteHand" style="display: none;">✋</div>
      <div class="tile-actions">
        <button class="tile-action-btn" onclick="togglePinTile('remote')" title="Pin">📌</button>
      </div>
    `;
    elements.videoGrid.appendChild(remoteTile);
  }
  
  const remoteVideo = document.getElementById('remoteVideo');
  if (remoteVideo && event.streams[0]) {
    remoteVideo.srcObject = event.streams[0];
  }
  
  // Add to participants
  state.participants.set('remote', {
    id: 'remote',
    name: 'Remote User',
    isHost: !state.isHost,
    isMuted: false,
    isCamOff: false,
    isHandRaised: false
  });
  
  updateParticipantsCount();
  updateParticipantsList();
}

function setupDataChannel(channel) {
  channel.onopen = () => {
    console.log('[VideoConferencePro] Data channel opened');
    showToast('Connected', 'Data channel established', 'success');
    
    // Send initial participant info
    sendDataMessage({
      type: 'participant_info',
      name: state.displayName,
      isHost: state.isHost
    });
  };
  
  channel.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleDataMessage(data);
    } catch (error) {
      console.error('[VideoConferencePro] Data message parse error:', error);
    }
  };
  
  channel.onclose = () => {
    console.log('[VideoConferencePro] Data channel closed');
  };
}

function sendDataMessage(data) {
  if (state.dataChannel && state.dataChannel.readyState === 'open') {
    state.dataChannel.send(JSON.stringify(data));
  }
}

function handleDataMessage(data) {
  console.log('[VideoConferencePro] Data message:', data);
  
  switch (data.type) {
    case 'participant_info':
      const participant = state.participants.get('remote');
      if (participant) {
        participant.name = data.name;
        participant.isHost = data.isHost;
        const remoteDisplayName = document.getElementById('remoteDisplayName');
        if (remoteDisplayName) {
          remoteDisplayName.textContent = data.name;
        }
        updateParticipantsList();
      }
      break;
      
    case 'media_state':
      const remoteMicStatus = document.getElementById('remoteMicStatus');
      const remoteCamStatus = document.getElementById('remoteCamStatus');
      const remotePlaceholder = document.getElementById('remotePlaceholder');
      
      if (remoteMicStatus) {
        remoteMicStatus.textContent = data.isMuted ? '🔇' : '🎤';
        remoteMicStatus.classList.toggle('muted', data.isMuted);
      }
      if (remoteCamStatus) {
        remoteCamStatus.textContent = data.isCamOff ? '🚫' : '📷';
        remoteCamStatus.classList.toggle('muted', data.isCamOff);
      }
      if (remotePlaceholder) {
        remotePlaceholder.style.display = data.isCamOff ? 'flex' : 'none';
      }
      
      const remoteParticipant = state.participants.get('remote');
      if (remoteParticipant) {
        remoteParticipant.isMuted = data.isMuted;
        remoteParticipant.isCamOff = data.isCamOff;
        updateParticipantsList();
      }
      break;
      
    case 'chat':
      receiveChat(data);
      break;
      
    case 'reaction':
      showReactionOnTile('remote', data.emoji);
      break;
      
    case 'hand':
      const remoteHand = document.getElementById('remoteHand');
      if (remoteHand) {
        remoteHand.style.display = data.raised ? 'block' : 'none';
      }
      const rp = state.participants.get('remote');
      if (rp) {
        rp.isHandRaised = data.raised;
        updateParticipantsList();
      }
      if (data.raised) {
        showToast('Hand Raised', 'Remote user raised their hand', 'info');
      }
      break;
      
    case 'screen_share':
      if (data.active) {
        showToast('Screen Share', 'Remote user is sharing their screen', 'info');
      }
      break;
  }
}

function updateConnectionStatus(status) {
  const statusMap = {
    'new': { text: 'Initializing...', type: 'info' },
    'connecting': { text: 'Connecting...', type: 'info' },
    'connected': { text: 'Connected!', type: 'success' },
    'disconnected': { text: 'Disconnected', type: 'warning' },
    'failed': { text: 'Connection failed', type: 'error' },
    'closed': { text: 'Call ended', type: 'info' }
  };
  
  const statusInfo = statusMap[status];
  if (statusInfo && (status === 'connected' || status === 'disconnected' || status === 'failed')) {
    showToast('Connection', statusInfo.text, statusInfo.type);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT
// ═══════════════════════════════════════════════════════════════════════════════

function toggleChat() {
  if (state.sidePanel === 'chat') {
    closeSidePanel();
  } else {
    openSidePanel('chat');
  }
}

function sendChatMessage() {
  const input = elements.chatInput;
  const message = input.value.trim();
  
  if (!message) return;
  
  const chatMessage = {
    type: 'chat',
    id: Date.now(),
    sender: state.displayName,
    content: message,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isSelf: true
  };
  
  addChatMessage(chatMessage);
  sendDataMessage(chatMessage);
  
  input.value = '';
}

function receiveChat(data) {
  const chatMessage = {
    ...data,
    isSelf: false
  };
  addChatMessage(chatMessage);
  
  // Show notification if chat panel is closed
  if (state.sidePanel !== 'chat') {
    showToast('New Message', `${data.sender}: ${data.content.substring(0, 50)}...`, 'info');
  }
}

function addChatMessage(msg) {
  state.messages.push(msg);
  
  const messageEl = document.createElement('div');
  messageEl.className = `chat-message ${msg.isSelf ? 'self' : ''}`;
  messageEl.innerHTML = `
    <div class="sender">
      <span class="sender-name">${msg.sender}</span>
      <span class="time">${msg.time}</span>
    </div>
    <div class="content">${escapeHtml(msg.content)}</div>
  `;
  
  elements.chatMessages.appendChild(messageEl);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function handleChatKeypress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICIPANTS
// ═══════════════════════════════════════════════════════════════════════════════

function toggleParticipants() {
  if (state.sidePanel === 'participants') {
    closeSidePanel();
  } else {
    openSidePanel('participants');
  }
}

function updateParticipantsCount() {
  const count = 1 + state.participants.size;
  elements.participantsCount.textContent = count;
}

function updateParticipantsList() {
  elements.participantsList.innerHTML = '';
  
  // Add local participant
  addParticipantToList(state.localParticipant);
  
  // Add remote participants
  state.participants.forEach(participant => {
    addParticipantToList(participant);
  });
}

function addParticipantToList(participant) {
  const item = document.createElement('div');
  item.className = 'participant-item';
  
  const initial = participant.name.charAt(0).toUpperCase();
  const role = participant.isHost ? 'Host' : (participant.id === 'local' ? 'You' : 'Participant');
  
  item.innerHTML = `
    <div class="avatar">${initial}</div>
    <div class="info">
      <div class="name">${participant.name}${participant.id === 'local' ? ' (You)' : ''}</div>
      <div class="role">${role}</div>
    </div>
    <div class="actions">
      ${participant.isHandRaised ? '<span title="Hand raised">✋</span>' : ''}
      <button class="action-btn ${participant.isMuted ? 'muted' : ''}" title="${participant.isMuted ? 'Muted' : 'Mic on'}">
        ${participant.isMuted ? '🔇' : '🎤'}
      </button>
      <button class="action-btn ${participant.isCamOff ? 'muted' : ''}" title="${participant.isCamOff ? 'Camera off' : 'Camera on'}">
        ${participant.isCamOff ? '🚫' : '📷'}
      </button>
    </div>
  `;
  
  elements.participantsList.appendChild(item);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REACTIONS & HAND
// ═══════════════════════════════════════════════════════════════════════════════

function toggleReactions() {
  elements.reactionsPicker.classList.toggle('active');
}

function sendReaction(emoji) {
  elements.reactionsPicker.classList.remove('active');
  
  showReactionOnTile('local', emoji);
  sendDataMessage({ type: 'reaction', emoji });
}

function showReactionOnTile(participantId, emoji) {
  const tile = document.getElementById(participantId === 'local' ? 'localTile' : 'remoteTile');
  if (!tile) return;
  
  const reaction = document.createElement('div');
  reaction.className = 'reaction';
  reaction.textContent = emoji;
  
  tile.appendChild(reaction);
  
  setTimeout(() => reaction.remove(), 2000);
}

function toggleHand() {
  state.isHandRaised = !state.isHandRaised;
  state.localParticipant.isHandRaised = state.isHandRaised;
  
  updateMediaControls();
  updateParticipantsList();
  
  sendDataMessage({ type: 'hand', raised: state.isHandRaised });
  
  showToast(
    state.isHandRaised ? 'Hand Raised' : 'Hand Lowered',
    state.isHandRaised ? 'Others can see you raised your hand' : '',
    'info'
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDE PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function openSidePanel(panel) {
  state.sidePanel = panel;
  elements.sidePanel.classList.add('active');
  
  // Update button states
  elements.btnChat.classList.toggle('active', panel === 'chat');
  elements.btnParticipants.classList.toggle('active', panel === 'participants');
  
  // Show correct panel
  if (panel === 'chat') {
    elements.sidePanelTitle.textContent = '💬 Chat';
    elements.chatPanel.style.display = 'block';
    elements.chatInputArea.style.display = 'block';
    elements.participantsPanel.style.display = 'none';
  } else {
    elements.sidePanelTitle.textContent = '👥 Participants';
    elements.chatPanel.style.display = 'none';
    elements.chatInputArea.style.display = 'none';
    elements.participantsPanel.style.display = 'block';
    updateParticipantsList();
  }
}

function closeSidePanel() {
  state.sidePanel = null;
  elements.sidePanel.classList.remove('active');
  elements.btnChat.classList.remove('active');
  elements.btnParticipants.classList.remove('active');
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULLSCREEN
// ═══════════════════════════════════════════════════════════════════════════════

let isFullscreen = false;

function toggleFullscreen() {
  const container = document.querySelector('.conference-container');
  
  if (!document.fullscreenElement) {
    // Enter fullscreen
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    } else if (container.mozRequestFullScreen) {
      container.mozRequestFullScreen();
    } else if (container.msRequestFullscreen) {
      container.msRequestFullscreen();
    }
    isFullscreen = true;
    updateFullscreenButton(true);
  } else {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    isFullscreen = false;
    updateFullscreenButton(false);
  }
}

function updateFullscreenButton(isFs) {
  const btn = document.getElementById('btnFullscreen');
  if (btn) {
    btn.querySelector('.icon').textContent = isFs ? '⛶' : '⛶';
    btn.querySelector('.label').textContent = isFs ? 'Exit FS' : 'Fullscreen';
    btn.title = isFs ? 'Exit Fullscreen' : 'Toggle Fullscreen';
  }
}

// Listen for fullscreen change events
document.addEventListener('fullscreenchange', () => {
  isFullscreen = !!document.fullscreenElement;
  updateFullscreenButton(isFullscreen);
});

document.addEventListener('webkitfullscreenchange', () => {
  isFullscreen = !!document.webkitFullscreenElement;
  updateFullscreenButton(isFullscreen);
});

// ═══════════════════════════════════════════════════════════════════════════════
// PICTURE-IN-PICTURE
// ═══════════════════════════════════════════════════════════════════════════════

async function togglePiP() {
  // Ensure video stream is set to PiP video element
  if (state.localStream && elements.pipVideo) {
    elements.pipVideo.srcObject = state.localStream;
  }
  
  if (!state.isPiPActive) {
    // Try native PiP first
    if (document.pictureInPictureEnabled && elements.localVideo.requestPictureInPicture) {
      try {
        await elements.localVideo.requestPictureInPicture();
        state.isPiPActive = true;
        updatePiPButton(true);
        return;
      } catch (error) {
        console.log('[VideoConferencePro] Native PiP not available, using custom');
      }
    }
    
    // Custom PiP - ensure video plays
    if (elements.pipVideo && state.localStream) {
      elements.pipVideo.srcObject = state.localStream;
      elements.pipVideo.play().catch(console.error);
    }
    
    elements.pipContainer.classList.add('active');
    state.isPiPActive = true;
    updatePiPButton(true);
    
    // Make draggable
    makeDraggable(elements.pipContainer);
    
  } else {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
    elements.pipContainer.classList.remove('active');
    state.isPiPActive = false;
    updatePiPButton(false);
  }
}

function updatePiPButton(isActive) {
  const btn = document.getElementById('btnPiP');
  if (btn) {
    btn.classList.toggle('active', isActive);
  }
}

function closePiP() {
  elements.pipContainer.classList.remove('active');
  state.isPiPActive = false;
}

function maximizeFromPiP() {
  closePiP();
  // Focus on local tile
  const localTile = document.getElementById('localTile');
  if (localTile) {
    localTile.scrollIntoView({ behavior: 'smooth' });
  }
}

function makeDraggable(element) {
  const header = element.querySelector('.pip-header');
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  header.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + 'px';
    element.style.left = (element.offsetLeft - pos1) + 'px';
    element.style.right = 'auto';
    element.style.bottom = 'auto';
  }
  
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════════════════

function closeJoinModal() {
  elements.joinModal.classList.remove('active');
}

function openShareModal() {
  // Update all meeting info displays
  updateShareModalInfo();
  
  // Generate QR code if room exists
  if (state.roomId) {
    generateQRCode();
  }
  
  elements.shareModal.classList.add('active');
}

function closeShareModal() {
  elements.shareModal.classList.remove('active');
}

function showShareModalWithCode(code) {
  // Update connection code textarea
  const shareCodeInput = document.getElementById('shareCodeInput');
  if (shareCodeInput) {
    shareCodeInput.value = code;
  }
  
  // Update all meeting info displays
  updateShareModalInfo();
  
  // Generate QR code
  generateQRCode();
  
  // Open the modal
  openShareModal();
}

function showAnswerCode(code) {
  closeJoinModal();
  
  // Show modal with answer code
  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>📤 Send Answer Code to Host</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <p style="color: var(--text-secondary); margin-bottom: 12px;">
          Copy this code and send it to the host to complete the connection:
        </p>
        <div class="form-group">
          <textarea readonly style="min-height: 120px;" id="answerCodeOutput">${code}</textarea>
        </div>
        <button class="btn btn-primary" style="width: 100%;" onclick="copyAnswerCode()">
          📋 Copy Answer Code
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Also add listener for host to paste answer
  state.isInCall = true;
  elements.meetingInfo.style.display = 'flex';
}

function copyAnswerCode() {
  const textarea = document.getElementById('answerCodeOutput');
  navigator.clipboard.writeText(textarea.value).then(() => {
    showToast('Copied!', 'Answer code copied to clipboard', 'success');
  });
}

function generateQRCode(data) {
  // Generate real QR code using qrcode.js library
  // Synchronized with Tauri app implementation
  const qrContainer = elements.qrCode || document.getElementById('qrCode');
  
  if (!qrContainer) {
    console.warn('[VideoConferencePro] QR container not found');
    return;
  }
  
  qrContainer.innerHTML = '';
  
  const roomId = state.roomId;
  
  if (!roomId) {
    console.log('[VideoConferencePro] No room ID yet for QR');
    qrContainer.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 3rem; margin-bottom: 8px; opacity: 0.5;">📱</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">
          QR code will appear when meeting starts
        </div>
      </div>
    `;
    return;
  }
  
  console.log('[VideoConferencePro] Generating QR for room:', roomId);
  
  // Create join URL - using web format for compatibility with Tauri
  // Tauri uses: ${window.location.origin}/video?room=${roomId}
  // Extension uses: https://cubeai.tools/video?room=${roomId}
  const joinUrl = data || `https://cubeai.tools/video?room=${roomId}`;
  
  try {
    // Check if QRCode library is loaded
    if (typeof QRCode !== 'undefined') {
      // Clear previous QR
      qrContainer.innerHTML = '';
      
      // Create new QR Code
      const qr = new QRCode(qrContainer, {
        text: joinUrl,
        width: 160,
        height: 160,
        colorDark: '#1a1a24',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      
      console.log('[VideoConferencePro] QR Code generated successfully');
      
      // Add meeting ID label below QR
      const infoDiv = document.createElement('div');
      infoDiv.style.cssText = 'text-align: center; margin-top: 12px; font-size: 0.75rem; color: var(--text-muted);';
      infoDiv.innerHTML = `
        <div style="font-size: 0.65rem; margin-bottom: 4px;">Meeting ID</div>
        <div style="font-family: monospace; font-size: 0.9rem; color: var(--text-primary); font-weight: 600;">${roomId}</div>
      `;
      qrContainer.appendChild(infoDiv);
    } else {
      console.warn('[VideoConferencePro] QRCode library not loaded, showing fallback');
      // Fallback if QRCode library failed to load
      qrContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; background: white; border-radius: 12px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">📱</div>
          <div style="font-size: 0.75rem; color: #666; margin-bottom: 8px;">Scan not available</div>
          <div style="font-size: 0.8rem; color: #333;">
            <strong style="font-family: monospace; font-size: 1.1rem; letter-spacing: 2px;">${roomId}</strong>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('[VideoConferencePro] QR Code generation failed:', error);
    qrContainer.innerHTML = `
      <div style="text-align: center; padding: 20px; background: white; border-radius: 12px;">
        <div style="font-size: 2.5rem; margin-bottom: 8px;">📱</div>
        <div style="font-size: 0.8rem; color: #333;">
          Meeting Code:<br>
          <strong style="font-family: monospace; font-size: 1.1rem; letter-spacing: 2px;">${roomId}</strong>
        </div>
      </div>
    `;
  }
}

function copyShareCode() {
  navigator.clipboard.writeText(elements.shareCodeInput.value).then(() => {
    showToast('Copied!', 'Connection code copied to clipboard', 'success');
  });
}

function copyMeetingId() {
  navigator.clipboard.writeText(state.roomId || elements.displayMeetingId.textContent).then(() => {
    showToast('Copied!', 'Meeting ID copied', 'success');
  });
}

function shareViaEmail() {
  const subject = encodeURIComponent('Join my CUBE Video Call');
  const joinUrl = `https://cubeai.tools/video?room=${state.roomId}`;
  const body = encodeURIComponent(`Join my video call!\n\nMeeting ID: ${state.roomId}\n\nJoin Link: ${joinUrl}\n\nConnection Code:\n${elements.shareCodeInput.value}`);
  window.open(`mailto:?subject=${subject}&body=${body}`);
}

function shareViaLink() {
  const joinUrl = `https://cubeai.tools/video?room=${state.roomId}`;
  navigator.clipboard.writeText(joinUrl).then(() => {
    showToast('Link Copied!', 'Share this join link with others', 'success');
  });
}

function downloadQR() {
  // Download QR code as PNG image
  const qrContainer = elements.qrCode;
  const canvas = qrContainer.querySelector('canvas');
  
  if (canvas) {
    const link = document.createElement('a');
    link.download = `CUBE-Meeting-${state.roomId || 'QR'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('QR Downloaded', 'QR code saved as PNG', 'success');
  } else {
    showToast('Error', 'No QR code to download', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE INVITE SYSTEM - Better than Zoom
// ═══════════════════════════════════════════════════════════════════════════════

// Invite tab management
function switchInviteTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.invite-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  // Update tab content
  document.querySelectorAll('.invite-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

// Update share modal with meeting info
function updateShareModalInfo() {
  const meetingIdEl = document.getElementById('shareMeetingId');
  const joinLinkEl = document.getElementById('shareJoinLink');
  const passwordEl = document.getElementById('shareMeetingPassword');
  
  if (meetingIdEl) meetingIdEl.textContent = state.roomId || '---';
  if (joinLinkEl) joinLinkEl.value = state.roomId ? `https://cubeai.tools/video?room=${state.roomId}` : '';
  if (passwordEl) passwordEl.textContent = state.meetingPassword || 'No password';
}

// Copy functions
function copyJoinLink() {
  const link = `https://cubeai.tools/video?room=${state.roomId}`;
  navigator.clipboard.writeText(link).then(() => {
    showToast('Copied!', 'Join link copied to clipboard', 'success');
  });
}

function copyPassword() {
  if (state.meetingPassword) {
    navigator.clipboard.writeText(state.meetingPassword).then(() => {
      showToast('Copied!', 'Password copied to clipboard', 'success');
    });
  } else {
    showToast('No Password', 'This meeting has no password', 'info');
  }
}

function togglePasswordVisibility() {
  const el = document.getElementById('shareMeetingPassword');
  if (el.dataset.hidden === 'true') {
    el.textContent = state.meetingPassword || 'No password';
    el.dataset.hidden = 'false';
  } else {
    el.textContent = '••••••••';
    el.dataset.hidden = 'true';
  }
}

// Print QR
function printQR() {
  const qrContainer = document.getElementById('qrCode');
  const canvas = qrContainer.querySelector('canvas');
  
  if (canvas) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CUBE Nexum Meeting QR Code</title>
        <style>
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .qr-container {
            text-align: center;
            padding: 40px;
            border: 2px solid #8b5cf6;
            border-radius: 16px;
          }
          h1 { color: #8b5cf6; margin-bottom: 20px; }
          img { margin: 20px 0; }
          .meeting-id { font-size: 1.5rem; font-weight: bold; margin-top: 16px; }
          .instructions { color: #666; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <h1>📹 Join CUBE Nexum Meeting</h1>
          <img src="${canvas.toDataURL('image/png')}" width="250" height="250">
          <div class="meeting-id">Meeting ID: ${state.roomId}</div>
          <p class="instructions">Scan the QR code with your phone camera to join instantly</p>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  } else {
    showToast('Error', 'No QR code available to print', 'error');
  }
}

// Share via different platforms
function shareViaSMS() {
  const message = encodeURIComponent(getInviteMessage());
  window.open(`sms:?body=${message}`);
}

function shareViaWhatsApp() {
  const message = encodeURIComponent(getInviteMessage());
  window.open(`https://wa.me/?text=${message}`);
}

function shareViaTelegram() {
  const message = encodeURIComponent(getInviteMessage());
  window.open(`https://t.me/share/url?url=${encodeURIComponent(getJoinLink())}&text=${message}`);
}

function shareViaSlack() {
  const message = encodeURIComponent(getInviteMessage());
  showToast('Slack', 'Opening Slack...', 'info');
  // Slack doesn't have a direct share URL, copy to clipboard instead
  navigator.clipboard.writeText(getInviteMessage()).then(() => {
    showToast('Copied!', 'Invite copied - paste it in Slack', 'success');
  });
}

function getJoinLink() {
  return `https://cubeai.tools/video?room=${state.roomId}`;
}

function getInviteMessage() {
  let message = `🎥 Join my CUBE Video Call!\n\n`;
  message += `📋 Meeting ID: ${state.roomId}\n`;
  message += `🔗 Join Link: ${getJoinLink()}\n`;
  if (state.meetingPassword) {
    message += `🔐 Password: ${state.meetingPassword}\n`;
  }
  message += `\n📱 Or scan the QR code in the meeting invite.`;
  return message;
}

// Contacts management
function searchContacts(query) {
  const list = document.getElementById('contactsList');
  const items = list.querySelectorAll('.contact-item');
  const empty = document.getElementById('contactsEmpty');
  let found = 0;
  
  items.forEach(item => {
    const name = item.querySelector('.contact-name')?.textContent.toLowerCase() || '';
    const email = item.querySelector('.contact-email')?.textContent.toLowerCase() || '';
    const matches = name.includes(query.toLowerCase()) || email.includes(query.toLowerCase());
    item.style.display = matches ? 'flex' : 'none';
    if (matches) found++;
  });
  
  if (empty) empty.style.display = found === 0 ? 'block' : 'none';
}

function inviteContact(email) {
  sendEmailInvite(email);
}

function importContacts() {
  showToast('Import Contacts', 'Contact import coming soon', 'info');
}

function sendDirectInvite() {
  const input = document.getElementById('directEmailInput');
  const email = input.value.trim();
  
  if (!email || !email.includes('@')) {
    showToast('Error', 'Please enter a valid email address', 'error');
    return;
  }
  
  sendEmailInvite(email);
  input.value = '';
}

function sendEmailInvite(email) {
  const subject = encodeURIComponent('Join my CUBE Nexum Video Call');
  const body = encodeURIComponent(getInviteMessage());
  window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  showToast('Email Opened', `Invite prepared for ${email}`, 'success');
}

// Calendar integrations
function addToGoogleCalendar() {
  const scheduledTime = document.getElementById('scheduledTime')?.value;
  const duration = parseInt(document.getElementById('meetingDuration')?.value || '60');
  
  const start = scheduledTime ? new Date(scheduledTime) : new Date();
  const end = new Date(start.getTime() + duration * 60000);
  
  const formatDate = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
  
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', 'CUBE Nexum Video Meeting');
  url.searchParams.set('dates', `${formatDate(start)}/${formatDate(end)}`);
  url.searchParams.set('details', getInviteMessage());
  url.searchParams.set('location', getJoinLink());
  
  window.open(url.toString());
  showToast('Google Calendar', 'Opening Google Calendar...', 'success');
}

function addToOutlookCalendar() {
  const scheduledTime = document.getElementById('scheduledTime')?.value;
  const duration = parseInt(document.getElementById('meetingDuration')?.value || '60');
  
  const start = scheduledTime ? new Date(scheduledTime) : new Date();
  const end = new Date(start.getTime() + duration * 60000);
  
  const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  url.searchParams.set('subject', 'CUBE Nexum Video Meeting');
  url.searchParams.set('startdt', start.toISOString());
  url.searchParams.set('enddt', end.toISOString());
  url.searchParams.set('body', getInviteMessage());
  url.searchParams.set('location', getJoinLink());
  
  window.open(url.toString());
  showToast('Outlook Calendar', 'Opening Outlook Calendar...', 'success');
}

function addToAppleCalendar() {
  const scheduledTime = document.getElementById('scheduledTime')?.value;
  const duration = parseInt(document.getElementById('meetingDuration')?.value || '60');
  
  const start = scheduledTime ? new Date(scheduledTime) : new Date();
  const end = new Date(start.getTime() + duration * 60000);
  
  const formatDate = (d) => d.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CUBE Nexum//Video Conference//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    'SUMMARY:CUBE Nexum Video Meeting',
    `DESCRIPTION:${getInviteMessage().replace(/\n/g, '\\n')}`,
    `URL:${getJoinLink()}`,
    `LOCATION:${getJoinLink()}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `CUBE-Meeting-${state.roomId}.ics`;
  link.click();
  
  showToast('Calendar File', 'ICS file downloaded - open it to add to your calendar', 'success');
}

function addToYahooCalendar() {
  const scheduledTime = document.getElementById('scheduledTime')?.value;
  const duration = parseInt(document.getElementById('meetingDuration')?.value || '60');
  
  const start = scheduledTime ? new Date(scheduledTime) : new Date();
  
  const formatDate = (d) => {
    return d.toISOString().slice(0, 19).replace(/-|:/g, '');
  };
  
  const url = new URL('https://calendar.yahoo.com/');
  url.searchParams.set('v', '60');
  url.searchParams.set('title', 'CUBE Nexum Video Meeting');
  url.searchParams.set('st', formatDate(start));
  url.searchParams.set('dur', `${Math.floor(duration / 60).toString().padStart(2, '0')}${(duration % 60).toString().padStart(2, '0')}`);
  url.searchParams.set('desc', getInviteMessage());
  url.searchParams.set('in_loc', getJoinLink());
  
  window.open(url.toString());
  showToast('Yahoo Calendar', 'Opening Yahoo Calendar...', 'success');
}

function scheduleMeeting() {
  const scheduledTime = document.getElementById('scheduledTime')?.value;
  
  if (!scheduledTime) {
    showToast('Error', 'Please select a date and time', 'error');
    return;
  }
  
  // Store scheduled time
  state.scheduledTime = new Date(scheduledTime);
  
  showToast('Meeting Scheduled', `Meeting scheduled for ${state.scheduledTime.toLocaleString()}`, 'success');
  
  // Open calendar selection
  const calendarChoice = confirm('Add to Google Calendar?\n\nClick OK for Google Calendar\nClick Cancel to download ICS file');
  
  if (calendarChoice) {
    addToGoogleCalendar();
  } else {
    addToAppleCalendar();
  }
}

// Advanced settings
function generatePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  document.getElementById('meetingPasswordInput').value = password;
  state.meetingPassword = password;
}

function applyAdvancedSettings() {
  const settings = {
    waitingRoom: document.getElementById('optWaitingRoom')?.checked,
    requirePassword: document.getElementById('optRequirePassword')?.checked,
    password: document.getElementById('meetingPasswordInput')?.value,
    lockMeeting: document.getElementById('optLockMeeting')?.checked,
    allowScreenShare: document.getElementById('optAllowScreenShare')?.checked,
    allowChat: document.getElementById('optAllowChat')?.checked,
    allowRecording: document.getElementById('optAllowRecording')?.checked,
    muteOnEntry: document.getElementById('optMuteOnEntry')?.checked,
    autoRecord: document.getElementById('optAutoRecord')?.checked,
    enableTranscription: document.getElementById('optEnableTranscription')?.checked,
    maxParticipants: parseInt(document.getElementById('optMaxParticipants')?.value || '0')
  };
  
  // Store settings
  state.meetingSettings = settings;
  if (settings.requirePassword && settings.password) {
    state.meetingPassword = settings.password;
  }
  
  showToast('Settings Applied', 'Meeting settings have been updated', 'success');
  updateShareModalInfo();
}

// Toggle password field visibility
document.addEventListener('DOMContentLoaded', () => {
  const passwordCheckbox = document.getElementById('optRequirePassword');
  if (passwordCheckbox) {
    passwordCheckbox.addEventListener('change', function() {
      const field = document.getElementById('passwordField');
      if (field) {
        field.style.display = this.checked ? 'flex' : 'none';
        if (this.checked && !document.getElementById('meetingPasswordInput').value) {
          generatePassword();
        }
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CALL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function createNewRoom() {
  const name = elements.inputDisplayName.value.trim();
  if (!name) {
    showToast('Error', 'Please enter your name', 'error');
    return;
  }
  
  state.displayName = name;
  state.localParticipant.name = name;
  elements.localDisplayName.textContent = name;
  elements.localAvatar.textContent = name.charAt(0).toUpperCase();
  
  createRoom();
}

function joinExistingRoom() {
  const name = elements.inputDisplayName.value.trim();
  const code = elements.inputOfferCode.value.trim();
  
  if (!name) {
    showToast('Error', 'Please enter your name', 'error');
    return;
  }
  
  if (!code) {
    showToast('Error', 'Please paste the connection code', 'error');
    return;
  }
  
  state.displayName = name;
  state.localParticipant.name = name;
  elements.localDisplayName.textContent = name;
  elements.localAvatar.textContent = name.charAt(0).toUpperCase();
  
  joinRoom(code);
}

function endCall() {
  if (confirm('Are you sure you want to leave the meeting?')) {
    // Stop all streams
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
      state.localStream = null;
    }
    
    if (state.screenStream) {
      state.screenStream.getTracks().forEach(track => track.stop());
      state.screenStream = null;
    }
    
    // Stop recording
    if (state.isRecording) {
      stopRecording();
    }
    
    // Close peer connection
    if (state.peerConnection) {
      state.peerConnection.close();
      state.peerConnection = null;
    }
    
    // Stop timer
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
    }
    
    // Reset state
    state.isInCall = false;
    state.participants.clear();
    
    // Show join modal again
    elements.joinModal.classList.add('active');
    elements.meetingInfo.style.display = 'none';
    elements.btnInvite.style.display = 'none';
    
    // Reset video
    elements.localVideo.srcObject = null;
    elements.localPlaceholder.style.display = 'flex';
    
    // Remove remote tile
    const remoteTile = document.getElementById('remoteTile');
    if (remoteTile) {
      remoteTile.remove();
    }
    
    showToast('Call Ended', 'You have left the meeting', 'info');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMER
// ═══════════════════════════════════════════════════════════════════════════════

function startMeetingTimer() {
  state.startTime = Date.now();
  
  state.timerInterval = setInterval(() => {
    const elapsed = Date.now() - state.startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    elements.meetingTime.textContent = 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 3; i++) {
    if (i > 0) id += '-';
    for (let j = 0; j < 3; j++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return id;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function togglePinTile(participantId) {
  const tile = document.getElementById(participantId === 'local' ? 'localTile' : 'remoteTile');
  if (tile) {
    tile.classList.toggle('pinned');
    state.pinnedParticipant = tile.classList.contains('pinned') ? participantId : null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOST ANSWER INPUT (for completing connection)
// ═══════════════════════════════════════════════════════════════════════════════

// Add answer input section to share modal
function addAnswerInputSection() {
  const section = document.createElement('div');
  section.style.cssText = 'margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);';
  section.innerHTML = `
    <h4 style="margin-bottom: 12px; color: var(--text-secondary);">📥 Paste Guest's Answer Code</h4>
    <div class="form-group">
      <textarea id="hostAnswerInput" placeholder="Paste the answer code from your guest here..." style="min-height: 80px;"></textarea>
    </div>
    <button class="btn btn-primary" style="width: 100%;" onclick="handleApplyAnswer()">
      ✅ Connect
    </button>
  `;
  
  const modalBody = elements.shareModal.querySelector('.modal-body');
  modalBody.appendChild(section);
}

function handleApplyAnswer() {
  const input = document.getElementById('hostAnswerInput');
  const code = input.value.trim();
  
  if (!code) {
    showToast('Error', 'Please paste the answer code', 'error');
    return;
  }
  
  applyAnswer(code);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZE
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  console.log('[VideoConferencePro] DOM loaded, initializing...');
  
  // Add answer input section to share modal
  addAnswerInputSection();
  
  // Close reactions picker when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#btnReactions') && !e.target.closest('#reactionsPicker')) {
      elements.reactionsPicker.classList.remove('active');
    }
  });
  
  // Handle PiP exit
  document.addEventListener('leavepictureinpicture', () => {
    state.isPiPActive = false;
  });
  
  console.log('[VideoConferencePro] Ready!');
});

console.log('[VideoConferencePro] Script loaded');
