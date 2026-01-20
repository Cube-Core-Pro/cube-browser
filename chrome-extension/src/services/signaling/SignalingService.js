/**
 * 📡 CUBE Nexum v7.0.0 - Signaling Service
 * 
 * SIMPLE P2P SIGNALING WITHOUT EXTERNAL SERVER
 * 
 * How it works:
 * 1. Host generates a connection code containing compressed SDP offer
 * 2. Client enters the code and generates answer code
 * 3. Host enters the answer code to complete connection
 * 
 * The codes are base64-encoded compressed SDP data.
 * No server needed - just copy/paste codes between users.
 * 
 * For enterprise: Can optionally use Firebase/Supabase for automatic signaling
 * 
 * @version 1.0.0
 * @license CUBE Nexum Enterprise
 */

class SignalingService {
  constructor() {
    this.pendingOffers = new Map();
    this.pendingAnswers = new Map();
    this.onOfferReceived = null;
    this.onAnswerReceived = null;
    this.onIceCandidateReceived = null;
    
    // Enterprise signaling (optional)
    this.useCloudSignaling = false;
    this.cloudEndpoint = null;
    
    console.log('📡 Signaling Service v1.0.0 initialized');
  }

  /**
   * Compress and encode SDP for sharing
   * @param {RTCSessionDescriptionInit} sdp - SDP offer or answer
   * @returns {string} - Compact shareable code
   */
  encodeSDP(sdp) {
    try {
      const sdpString = JSON.stringify({
        type: sdp.type,
        sdp: sdp.sdp
      });
      
      // Compress using simple LZ-based compression
      const compressed = this.compress(sdpString);
      
      // Base64 encode
      const base64 = btoa(compressed);
      
      // Add prefix for identification
      const prefix = sdp.type === 'offer' ? 'CUBE-O-' : 'CUBE-A-';
      
      return prefix + base64;
    } catch (error) {
      console.error('Failed to encode SDP:', error);
      throw error;
    }
  }

  /**
   * Decode SDP from shared code
   * @param {string} code - Shared connection code
   * @returns {RTCSessionDescriptionInit} - Decoded SDP
   */
  decodeSDP(code) {
    try {
      // Remove prefix
      let base64 = code;
      if (code.startsWith('CUBE-O-')) {
        base64 = code.substring(7);
      } else if (code.startsWith('CUBE-A-')) {
        base64 = code.substring(7);
      }
      
      // Base64 decode
      const compressed = atob(base64);
      
      // Decompress
      const sdpString = this.decompress(compressed);
      
      // Parse JSON
      const sdp = JSON.parse(sdpString);
      
      return new RTCSessionDescription(sdp);
    } catch (error) {
      console.error('Failed to decode SDP:', error);
      throw new Error('Invalid connection code. Please check and try again.');
    }
  }

  /**
   * Simple LZ-style compression
   * @param {string} str - String to compress
   * @returns {string} - Compressed string
   */
  compress(str) {
    // Simple run-length encoding + dictionary for common SDP patterns
    const dictionary = {
      'candidate:': '§1',
      'a=rtcp:': '§2',
      'a=ice-ufrag:': '§3',
      'a=ice-pwd:': '§4',
      'a=fingerprint:': '§5',
      'a=setup:': '§6',
      'a=mid:': '§7',
      'a=extmap:': '§8',
      'a=sendrecv': '§9',
      'a=rtcp-mux': '§a',
      'a=rtcp-rsize': '§b',
      'a=group:BUNDLE': '§c',
      'm=application': '§d',
      'c=IN IP4': '§e',
      'UDP/DTLS/SCTP': '§f',
      'webrtc-datachannel': '§g',
      'a=sctp-port:': '§h',
      'a=max-message-size:': '§i',
      '\\r\\n': '§n'
    };
    
    let result = str;
    for (const [pattern, replacement] of Object.entries(dictionary)) {
      result = result.split(pattern).join(replacement);
    }
    
    return result;
  }

  /**
   * Decompress string
   * @param {string} str - Compressed string
   * @returns {string} - Original string
   */
  decompress(str) {
    const dictionary = {
      '§1': 'candidate:',
      '§2': 'a=rtcp:',
      '§3': 'a=ice-ufrag:',
      '§4': 'a=ice-pwd:',
      '§5': 'a=fingerprint:',
      '§6': 'a=setup:',
      '§7': 'a=mid:',
      '§8': 'a=extmap:',
      '§9': 'a=sendrecv',
      '§a': 'a=rtcp-mux',
      '§b': 'a=rtcp-rsize',
      '§c': 'a=group:BUNDLE',
      '§d': 'm=application',
      '§e': 'c=IN IP4',
      '§f': 'UDP/DTLS/SCTP',
      '§g': 'webrtc-datachannel',
      '§h': 'a=sctp-port:',
      '§i': 'a=max-message-size:',
      '§n': '\\r\\n'
    };
    
    let result = str;
    for (const [pattern, replacement] of Object.entries(dictionary)) {
      result = result.split(pattern).join(replacement);
    }
    
    return result;
  }

  /**
   * Generate a short human-readable session ID
   * @returns {string} - 6-character session ID
   */
  generateSessionId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create connection offer
   * @param {RTCPeerConnection} peerConnection - Peer connection with offer
   * @returns {Object} - Session info with codes
   */
  async createOffer(peerConnection) {
    const sessionId = this.generateSessionId();
    
    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Wait for ICE gathering
    await this.waitForICEGathering(peerConnection);
    
    // Get complete offer with ICE candidates
    const completeOffer = peerConnection.localDescription;
    
    // Encode for sharing
    const offerCode = this.encodeSDP(completeOffer);
    
    // Store pending offer
    this.pendingOffers.set(sessionId, {
      peerConnection,
      offer: completeOffer,
      created: Date.now()
    });
    
    console.log(`📡 Offer created: ${sessionId}`);
    console.log(`📋 Code length: ${offerCode.length} chars`);
    
    return {
      sessionId,
      offerCode,
      shortCode: sessionId // For display
    };
  }

  /**
   * Accept connection offer and create answer
   * @param {string} offerCode - Received offer code
   * @param {RTCPeerConnection} peerConnection - Local peer connection
   * @returns {Object} - Answer info with code
   */
  async acceptOffer(offerCode, peerConnection) {
    // Decode offer
    const offer = this.decodeSDP(offerCode);
    
    // Set remote description
    await peerConnection.setRemoteDescription(offer);
    
    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    // Wait for ICE gathering
    await this.waitForICEGathering(peerConnection);
    
    // Get complete answer
    const completeAnswer = peerConnection.localDescription;
    
    // Encode for sharing
    const answerCode = this.encodeSDP(completeAnswer);
    
    console.log(`📡 Answer created`);
    console.log(`📋 Code length: ${answerCode.length} chars`);
    
    return {
      answerCode
    };
  }

  /**
   * Complete connection with answer
   * @param {string} answerCode - Received answer code
   * @param {RTCPeerConnection} peerConnection - Host peer connection
   */
  async acceptAnswer(answerCode, peerConnection) {
    // Decode answer
    const answer = this.decodeSDP(answerCode);
    
    // Set remote description
    await peerConnection.setRemoteDescription(answer);
    
    console.log('📡 Answer accepted, connection establishing...');
  }

  /**
   * Wait for ICE gathering to complete
   * @param {RTCPeerConnection} peerConnection - Peer connection
   * @returns {Promise} - Resolves when ICE gathering is complete
   */
  waitForICEGathering(peerConnection) {
    return new Promise((resolve) => {
      if (peerConnection.iceGatheringState === 'complete') {
        resolve();
        return;
      }
      
      const timeout = setTimeout(() => {
        console.log('📡 ICE gathering timeout, proceeding...');
        resolve();
      }, 5000);
      
      peerConnection.addEventListener('icegatheringstatechange', () => {
        if (peerConnection.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }

  /**
   * Clean up old pending connections
   */
  cleanup() {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    for (const [id, data] of this.pendingOffers.entries()) {
      if (now - data.created > maxAge) {
        this.pendingOffers.delete(id);
      }
    }
    
    for (const [id, data] of this.pendingAnswers.entries()) {
      if (now - data.created > maxAge) {
        this.pendingAnswers.delete(id);
      }
    }
  }

  // ============================================================================
  // CLOUD SIGNALING (ENTERPRISE FEATURE)
  // ============================================================================

  /**
   * Enable cloud signaling for automatic connection
   * @param {string} endpoint - Cloud signaling endpoint
   */
  enableCloudSignaling(endpoint) {
    this.useCloudSignaling = true;
    this.cloudEndpoint = endpoint;
    console.log('📡 Cloud signaling enabled:', endpoint);
  }

  /**
   * Publish offer to cloud for automatic discovery
   * @param {string} sessionId - Session ID
   * @param {string} offerCode - Offer code
   */
  async publishOffer(sessionId, offerCode) {
    if (!this.useCloudSignaling) {
      throw new Error('Cloud signaling not enabled');
    }
    
    try {
      await fetch(`${this.cloudEndpoint}/offers/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer: offerCode })
      });
      console.log('📡 Offer published to cloud');
    } catch (error) {
      console.error('Failed to publish offer:', error);
      throw error;
    }
  }

  /**
   * Fetch offer from cloud by session ID
   * @param {string} sessionId - Session ID to fetch
   * @returns {string} - Offer code
   */
  async fetchOffer(sessionId) {
    if (!this.useCloudSignaling) {
      throw new Error('Cloud signaling not enabled');
    }
    
    try {
      const response = await fetch(`${this.cloudEndpoint}/offers/${sessionId}`);
      if (!response.ok) {
        throw new Error('Session not found');
      }
      const data = await response.json();
      return data.offer;
    } catch (error) {
      console.error('Failed to fetch offer:', error);
      throw error;
    }
  }

  /**
   * Publish answer to cloud
   * @param {string} sessionId - Session ID
   * @param {string} answerCode - Answer code
   */
  async publishAnswer(sessionId, answerCode) {
    if (!this.useCloudSignaling) {
      throw new Error('Cloud signaling not enabled');
    }
    
    try {
      await fetch(`${this.cloudEndpoint}/answers/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answerCode })
      });
      console.log('📡 Answer published to cloud');
    } catch (error) {
      console.error('Failed to publish answer:', error);
      throw error;
    }
  }

  /**
   * Poll for answer from cloud
   * @param {string} sessionId - Session ID
   * @param {number} timeout - Timeout in ms
   * @returns {string} - Answer code
   */
  async waitForAnswer(sessionId, timeout = 60000) {
    if (!this.useCloudSignaling) {
      throw new Error('Cloud signaling not enabled');
    }
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`${this.cloudEndpoint}/answers/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.answer) {
            return data.answer;
          }
        }
      } catch {
        // Ignore fetch errors during polling
      }
      
      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Timeout waiting for answer');
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.SignalingService = SignalingService;
  window.cubeSignaling = new SignalingService();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SignalingService;
}
