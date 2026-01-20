/**
 * Camera Test Diagnostic Tool
 * External script for CSP compliance in Manifest V3
 */

let currentStream = null;

function log(message, type = 'info') {
  const logEl = document.getElementById('log');
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  entry.textContent = `[${timestamp}] ${message}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
  console.log(`[${type.toUpperCase()}]`, message);
}

function clearLog() {
  document.getElementById('log').innerHTML = '';
}

function copyLog() {
  const logText = document.getElementById('log').innerText;
  navigator.clipboard.writeText(logText).then(() => {
    alert('Log copied to clipboard!');
  });
}

async function checkPermissions() {
  log('Checking permissions...');
  const statusEl = document.getElementById('permissionStatus');
  
  try {
    if (!navigator.permissions || !navigator.permissions.query) {
      statusEl.className = 'status warning';
      statusEl.textContent = '⚠️ Permissions API not available';
      log('Permissions API not available in this context', 'warn');
      return;
    }
    
    let results = [];
    
    // Check camera permission
    try {
      const camera = await navigator.permissions.query({ name: 'camera' });
      results.push(`Camera: ${camera.state}`);
      log(`Camera permission: ${camera.state}`, camera.state === 'granted' ? 'success' : 'warn');
      
      camera.onchange = () => {
        log(`Camera permission changed to: ${camera.state}`, 'info');
        checkPermissions();
      };
    } catch (e) {
      results.push(`Camera: Error (${e.message})`);
      log(`Camera permission query error: ${e.message}`, 'error');
    }
    
    // Check microphone permission
    try {
      const mic = await navigator.permissions.query({ name: 'microphone' });
      results.push(`Microphone: ${mic.state}`);
      log(`Microphone permission: ${mic.state}`, mic.state === 'granted' ? 'success' : 'warn');
    } catch (e) {
      results.push(`Microphone: Error (${e.message})`);
      log(`Microphone permission query error: ${e.message}`, 'error');
    }
    
    const allGranted = results.every(r => r.includes('granted'));
    const anyDenied = results.some(r => r.includes('denied'));
    
    statusEl.className = `status ${allGranted ? 'success' : anyDenied ? 'error' : 'warning'}`;
    statusEl.innerHTML = results.join('<br>');
    
  } catch (e) {
    statusEl.className = 'status error';
    statusEl.textContent = `Error: ${e.message}`;
    log(`Permission check error: ${e.message}`, 'error');
  }
}

async function enumerateDevices() {
  log('Enumerating devices...');
  const statusEl = document.getElementById('deviceStatus');
  
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      statusEl.className = 'status error';
      statusEl.textContent = '❌ MediaDevices API not available';
      log('MediaDevices API not available', 'error');
      return;
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    log(`Found ${devices.length} total devices`);
    
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    const audioDevices = devices.filter(d => d.kind === 'audioinput');
    
    log(`Video devices: ${videoDevices.length}`, videoDevices.length > 0 ? 'success' : 'warn');
    log(`Audio devices: ${audioDevices.length}`, audioDevices.length > 0 ? 'success' : 'warn');
    
    let html = `<strong>Video Inputs (${videoDevices.length}):</strong><br>`;
    videoDevices.forEach((d, i) => {
      const label = d.label || `Camera ${i + 1} (label hidden - need permission)`;
      html += `• ${label}<br>`;
      log(`  Video ${i}: ${label}`);
    });
    
    html += `<br><strong>Audio Inputs (${audioDevices.length}):</strong><br>`;
    audioDevices.forEach((d, i) => {
      const label = d.label || `Microphone ${i + 1} (label hidden - need permission)`;
      html += `• ${label}<br>`;
      log(`  Audio ${i}: ${label}`);
    });
    
    statusEl.className = `status ${videoDevices.length > 0 ? 'success' : 'warning'}`;
    statusEl.innerHTML = html;
    
  } catch (e) {
    statusEl.className = 'status error';
    statusEl.textContent = `Error: ${e.message}`;
    log(`Device enumeration error: ${e.message}`, 'error');
  }
}

async function testCamera(withAudio) {
  log(`Testing camera (audio: ${withAudio})...`);
  const statusEl = document.getElementById('cameraStatus');
  const videoEl = document.getElementById('testVideo');
  
  statusEl.className = 'status info';
  statusEl.textContent = '⏳ Requesting camera access...';
  
  // Stop existing stream first
  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop());
    currentStream = null;
  }
  
  try {
    log('Calling getUserMedia...');
    
    const constraints = {
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: withAudio
    };
    
    log(`Constraints: ${JSON.stringify(constraints)}`);
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    currentStream = stream;
    log(`✅ Got stream: ${stream.id}`, 'success');
    
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();
    
    log(`Video tracks: ${videoTracks.length}`, 'success');
    videoTracks.forEach((t, i) => log(`  Track ${i}: ${t.label} (${t.readyState})`));
    
    log(`Audio tracks: ${audioTracks.length}`, audioTracks.length > 0 || !withAudio ? 'success' : 'warn');
    audioTracks.forEach((t, i) => log(`  Track ${i}: ${t.label} (${t.readyState})`));
    
    // Show video
    videoEl.srcObject = stream;
    videoEl.style.display = 'block';
    
    statusEl.className = 'status success';
    statusEl.innerHTML = `✅ Camera working!<br>` +
      `Video: ${videoTracks.map(t => t.label).join(', ')}<br>` +
      `Audio: ${audioTracks.length > 0 ? audioTracks.map(t => t.label).join(', ') : 'None'}`;
    
    // Re-enumerate to get labels
    enumerateDevices();
    checkPermissions();
    
  } catch (e) {
    log(`❌ Camera error: ${e.name}`, 'error');
    log(`   Message: ${e.message}`, 'error');
    
    videoEl.style.display = 'none';
    
    let helpText = '';
    if (e.name === 'NotAllowedError') {
      if (e.message.includes('system') || e.message.includes('Permission denied by system')) {
        helpText = `<br><br><strong>🍎 macOS Fix:</strong><br>` +
          `1. Open System Settings<br>` +
          `2. Go to Privacy & Security → Camera<br>` +
          `3. Find and enable "Google Chrome"<br>` +
          `4. <strong>Restart Chrome completely</strong> (Cmd+Q, then reopen)<br>` +
          `5. Try again`;
        log('This is a SYSTEM-LEVEL denial from macOS', 'error');
      } else {
        helpText = `<br><br>Click "Allow" when Chrome asks for camera permission`;
        log('This is a browser-level denial', 'warn');
      }
    } else if (e.name === 'NotFoundError') {
      helpText = `<br><br>No camera detected. Is one connected?`;
    } else if (e.name === 'NotReadableError') {
      helpText = `<br><br>Camera in use by another app. Close other apps using camera.`;
    }
    
    statusEl.className = 'status error';
    statusEl.innerHTML = `❌ ${e.name}: ${e.message}${helpText}`;
  }
}

function stopCamera() {
  if (currentStream) {
    log('Stopping camera...');
    currentStream.getTracks().forEach(t => {
      log(`Stopping track: ${t.label}`);
      t.stop();
    });
    currentStream = null;
    
    const videoEl = document.getElementById('testVideo');
    videoEl.srcObject = null;
    videoEl.style.display = 'none';
    
    document.getElementById('cameraStatus').className = 'status info';
    document.getElementById('cameraStatus').textContent = 'Camera stopped';
    log('Camera stopped', 'success');
  }
}

function showSystemInfo() {
  const info = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor,
    secureContext: window.isSecureContext,
    protocol: window.location.protocol,
    origin: window.location.origin,
    mediaDevicesAvailable: !!navigator.mediaDevices,
    getUserMediaAvailable: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    permissionsAvailable: !!navigator.permissions
  };
  
  const statusEl = document.getElementById('systemInfo');
  statusEl.innerHTML = Object.entries(info).map(([k, v]) => `<strong>${k}:</strong> ${v}`).join('<br>');
  
  log('System info:');
  Object.entries(info).forEach(([k, v]) => log(`  ${k}: ${v}`));
  
  // Check if this is an extension page
  if (window.location.protocol === 'chrome-extension:') {
    log('Running in Chrome extension context', 'info');
  } else if (window.location.protocol === 'https:') {
    log('Running in secure HTTPS context', 'success');
  } else {
    log(`Running in ${window.location.protocol} context`, 'warn');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  log('=== Camera Diagnostic Tool Started ===', 'info');
  showSystemInfo();
  checkPermissions();
  enumerateDevices();
});

// Export functions for onclick handlers
window.clearLog = clearLog;
window.copyLog = copyLog;
window.checkPermissions = checkPermissions;
window.enumerateDevices = enumerateDevices;
window.testCamera = testCamera;
window.stopCamera = stopCamera;
window.showSystemInfo = showSystemInfo;
