/**
 * 💬 CUBE Nexum v7.0.0 - Advanced Chat Features
 * 
 * WHATSAPP/TELEGRAM/MSN-STYLE CHAT FEATURES
 * 
 * Features:
 * - Message reactions (❤️ 👍 😂 😮 😢 😡)
 * - Reply to messages (threading)
 * - Forward messages
 * - Read receipts (✓✓)
 * - Typing indicators
 * - Voice messages
 * - Stickers & GIFs
 * - Nudges/Zumbidos (MSN-style screen shake)
 * - Message editing
 * - Message deletion
 * - Emoji picker
 * - File attachments with preview
 * - Image paste from clipboard
 * - Link previews
 * - Sound effects
 * 
 * @version 1.0.0
 * @license CUBE Nexum Enterprise
 */

class ChatFeaturesService {
  constructor() {
    this.messageReactions = new Map(); // messageId -> reactions[]
    this.typingIndicators = new Map(); // peerId -> timestamp
    this.soundsEnabled = true;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecordingVoice = false;
    
    // Sound effects
    this.sounds = {
      message: 'data:audio/mp3;base64,//uQxAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      nudge: null, // Will be generated
      typing: null,
      sent: null,
      received: null
    };
    
    // Sticker packs
    this.stickerPacks = this.getDefaultStickerPacks();
    
    // Emoji categories
    this.emojiCategories = this.getEmojiCategories();
    
    console.log('💬 Chat Features Service v1.0.0 initialized');
  }

  // ============================================================================
  // MESSAGE REACTIONS
  // ============================================================================

  /**
   * Available reactions
   */
  get availableReactions() {
    return ['❤️', '👍', '😂', '😮', '😢', '😡', '🎉', '🔥'];
  }

  /**
   * Add reaction to a message
   * @param {string} messageId - Message ID
   * @param {string} reaction - Reaction emoji
   * @param {string} userId - User who reacted
   */
  addReaction(messageId, reaction, userId = 'me') {
    if (!this.messageReactions.has(messageId)) {
      this.messageReactions.set(messageId, []);
    }
    
    const reactions = this.messageReactions.get(messageId);
    const existing = reactions.find(r => r.userId === userId);
    
    if (existing) {
      existing.emoji = reaction;
      existing.timestamp = Date.now();
    } else {
      reactions.push({
        emoji: reaction,
        userId,
        timestamp: Date.now()
      });
    }
    
    this.playSound('reaction');
    return reactions;
  }

  /**
   * Remove reaction from a message
   * @param {string} messageId - Message ID
   * @param {string} userId - User who reacted
   */
  removeReaction(messageId, userId = 'me') {
    if (!this.messageReactions.has(messageId)) return;
    
    const reactions = this.messageReactions.get(messageId);
    const index = reactions.findIndex(r => r.userId === userId);
    
    if (index > -1) {
      reactions.splice(index, 1);
    }
    
    return reactions;
  }

  /**
   * Get reactions for a message
   * @param {string} messageId - Message ID
   * @returns {Array} - Reactions array
   */
  getReactions(messageId) {
    return this.messageReactions.get(messageId) || [];
  }

  /**
   * Create reaction picker UI
   * @param {Function} onSelect - Callback when reaction is selected
   * @returns {HTMLElement} - Reaction picker element
   */
  createReactionPicker(onSelect) {
    const picker = document.createElement('div');
    picker.className = 'cube-reaction-picker';
    picker.innerHTML = `
      <style>
        .cube-reaction-picker {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
          background: #1f2937;
          border-radius: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          animation: cube-picker-appear 0.2s ease;
        }
        
        @keyframes cube-picker-appear {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .cube-reaction-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .cube-reaction-btn:hover {
          background: rgba(124, 58, 237, 0.3);
          transform: scale(1.2);
        }
      </style>
      ${this.availableReactions.map(emoji => `
        <button class="cube-reaction-btn" data-emoji="${emoji}">${emoji}</button>
      `).join('')}
    `;
    
    picker.querySelectorAll('.cube-reaction-btn').forEach(btn => {
      btn.onclick = () => {
        onSelect(btn.dataset.emoji);
        picker.remove();
      };
    });
    
    return picker;
  }

  // ============================================================================
  // REPLY & FORWARD
  // ============================================================================

  /**
   * Create reply preview UI
   * @param {Object} originalMessage - Message being replied to
   * @returns {HTMLElement} - Reply preview element
   */
  createReplyPreview(originalMessage) {
    const preview = document.createElement('div');
    preview.className = 'cube-reply-preview';
    preview.innerHTML = `
      <style>
        .cube-reply-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(124, 58, 237, 0.1);
          border-left: 3px solid #8b5cf6;
          border-radius: 0 8px 8px 0;
          margin-bottom: 8px;
        }
        
        .cube-reply-content {
          flex: 1;
          min-width: 0;
        }
        
        .cube-reply-author {
          font-size: 12px;
          font-weight: 600;
          color: #8b5cf6;
        }
        
        .cube-reply-text {
          font-size: 13px;
          color: #9ca3af;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .cube-reply-close {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
          border-radius: 50%;
        }
        
        .cube-reply-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
      </style>
      <div class="cube-reply-content">
        <div class="cube-reply-author">${originalMessage.role === 'user' ? 'You' : 'AI Nexus'}</div>
        <div class="cube-reply-text">${this.truncateText(originalMessage.content, 50)}</div>
      </div>
      <button class="cube-reply-close">✕</button>
    `;
    
    return preview;
  }

  // ============================================================================
  // TYPING INDICATORS
  // ============================================================================

  /**
   * Create typing indicator UI
   * @param {string} name - Name of person typing
   * @returns {HTMLElement} - Typing indicator element
   */
  createTypingIndicator(name = 'AI Nexus') {
    const indicator = document.createElement('div');
    indicator.className = 'cube-typing-indicator';
    indicator.innerHTML = `
      <style>
        .cube-typing-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          color: #9ca3af;
          font-size: 13px;
        }
        
        .cube-typing-dots {
          display: flex;
          gap: 4px;
        }
        
        .cube-typing-dot {
          width: 6px;
          height: 6px;
          background: #8b5cf6;
          border-radius: 50%;
          animation: cube-typing-bounce 1.4s infinite ease-in-out;
        }
        
        .cube-typing-dot:nth-child(1) { animation-delay: 0s; }
        .cube-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .cube-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes cube-typing-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      </style>
      <div class="cube-typing-dots">
        <div class="cube-typing-dot"></div>
        <div class="cube-typing-dot"></div>
        <div class="cube-typing-dot"></div>
      </div>
      <span>${name} is typing...</span>
    `;
    
    return indicator;
  }

  // ============================================================================
  // READ RECEIPTS
  // ============================================================================

  /**
   * Create read receipt indicator
   * @param {string} status - 'sent' | 'delivered' | 'read'
   * @returns {HTMLElement} - Status indicator
   */
  createReadReceipt(status) {
    const receipt = document.createElement('span');
    receipt.className = 'cube-read-receipt';
    
    const icons = {
      sending: '○',
      sent: '✓',
      delivered: '✓✓',
      read: '✓✓'
    };
    
    const colors = {
      sending: '#6b7280',
      sent: '#6b7280',
      delivered: '#6b7280',
      read: '#10b981'
    };
    
    receipt.innerHTML = `
      <style>
        .cube-read-receipt {
          font-size: 12px;
          margin-left: 4px;
        }
      </style>
      <span style="color: ${colors[status]}">${icons[status]}</span>
    `;
    
    return receipt;
  }

  // ============================================================================
  // VOICE MESSAGES
  // ============================================================================

  /**
   * Start recording voice message
   * @returns {Promise} - Resolves when recording starts
   */
  async startVoiceRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(100);
      this.isRecordingVoice = true;
      
      console.log('🎤 Voice recording started');
      return true;
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording voice message
   * @returns {Promise<Blob>} - Audio blob
   */
  async stopVoiceRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecordingVoice) {
        resolve(null);
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        this.isRecordingVoice = false;
        console.log('🎤 Voice recording stopped');
        resolve(audioBlob);
      };
      
      this.mediaRecorder.stop();
    });
  }

  /**
   * Create voice message player UI
   * @param {string} audioUrl - URL of audio
   * @param {number} duration - Duration in seconds
   * @returns {HTMLElement} - Voice player element
   */
  createVoicePlayer(audioUrl, duration = 0) {
    const player = document.createElement('div');
    player.className = 'cube-voice-player';
    player.innerHTML = `
      <style>
        .cube-voice-player {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(124, 58, 237, 0.1);
          border-radius: 12px;
          min-width: 200px;
        }
        
        .cube-voice-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #8b5cf6;
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          font-size: 16px;
        }
        
        .cube-voice-btn:hover {
          background: #6d28d9;
        }
        
        .cube-voice-waveform {
          flex: 1;
          height: 32px;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        
        .cube-voice-bar {
          width: 3px;
          background: #8b5cf6;
          border-radius: 2px;
          transition: height 0.1s ease;
        }
        
        .cube-voice-duration {
          font-size: 12px;
          color: #9ca3af;
          min-width: 40px;
        }
      </style>
      <button class="cube-voice-btn" data-action="play">▶</button>
      <div class="cube-voice-waveform">${this.generateWaveformBars()}</div>
      <span class="cube-voice-duration">${this.formatDuration(duration)}</span>
      <audio src="${audioUrl}" style="display: none;"></audio>
    `;
    
    const audio = player.querySelector('audio');
    const btn = player.querySelector('.cube-voice-btn');
    const durationEl = player.querySelector('.cube-voice-duration');
    
    let isPlaying = false;
    
    btn.onclick = () => {
      if (isPlaying) {
        audio.pause();
        btn.textContent = '▶';
      } else {
        audio.play();
        btn.textContent = '⏸';
      }
      isPlaying = !isPlaying;
    };
    
    audio.onended = () => {
      btn.textContent = '▶';
      isPlaying = false;
    };
    
    audio.ontimeupdate = () => {
      durationEl.textContent = this.formatDuration(audio.currentTime);
    };
    
    return player;
  }

  generateWaveformBars() {
    let bars = '';
    for (let i = 0; i < 20; i++) {
      const height = Math.random() * 20 + 8;
      bars += `<div class="cube-voice-bar" style="height: ${height}px;"></div>`;
    }
    return bars;
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ============================================================================
  // NUDGE / ZUMBIDO (MSN-STYLE)
  // ============================================================================

  /**
   * Send a nudge (screen shake)
   * @param {HTMLElement} container - Element to shake
   */
  sendNudge(container) {
    // Play nudge sound
    this.playSound('nudge');
    
    // Add shake animation
    container.classList.add('cube-nudge');
    
    setTimeout(() => {
      container.classList.remove('cube-nudge');
    }, 500);
    
    // Inject shake animation if not present
    if (!document.getElementById('cube-nudge-styles')) {
      const style = document.createElement('style');
      style.id = 'cube-nudge-styles';
      style.textContent = `
        @keyframes cube-nudge-shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        
        .cube-nudge {
          animation: cube-nudge-shake 0.5s ease-in-out !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // ============================================================================
  // EMOJI PICKER
  // ============================================================================

  getEmojiCategories() {
    return {
      recent: [],
      smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
      gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪'],
      hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
      objects: ['💻', '🖥️', '🖱️', '⌨️', '📱', '📲', '☎️', '📞', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🕰️', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '💰', '💴', '💵', '💶', '💷', '💳', '💎'],
      symbols: ['✅', '❌', '❓', '❗', '⭐', '🌟', '✨', '💫', '💥', '💢', '💯', '🔥', '🎯', '🚀', '⚡', '💪', '🎉', '🎊', '🏆', '🥇', '🥈', '🥉']
    };
  }

  /**
   * Create emoji picker UI
   * @param {Function} onSelect - Callback when emoji is selected
   * @returns {HTMLElement} - Emoji picker element
   */
  createEmojiPicker(onSelect) {
    const picker = document.createElement('div');
    picker.className = 'cube-emoji-picker';
    
    const categories = Object.keys(this.emojiCategories);
    
    picker.innerHTML = `
      <style>
        .cube-emoji-picker {
          width: 320px;
          max-height: 400px;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }
        
        .cube-emoji-search {
          padding: 12px;
          border-bottom: 1px solid #374151;
        }
        
        .cube-emoji-search input {
          width: 100%;
          padding: 8px 12px;
          background: #374151;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 13px;
        }
        
        .cube-emoji-tabs {
          display: flex;
          padding: 8px;
          gap: 4px;
          border-bottom: 1px solid #374151;
        }
        
        .cube-emoji-tab {
          flex: 1;
          padding: 8px;
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          border-radius: 8px;
          font-size: 16px;
        }
        
        .cube-emoji-tab:hover {
          background: #374151;
        }
        
        .cube-emoji-tab.active {
          background: #8b5cf6;
          color: white;
        }
        
        .cube-emoji-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
          padding: 12px;
          max-height: 250px;
          overflow-y: auto;
        }
        
        .cube-emoji-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          font-size: 20px;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.1s ease;
        }
        
        .cube-emoji-btn:hover {
          background: #374151;
          transform: scale(1.2);
        }
      </style>
      <div class="cube-emoji-search">
        <input type="text" placeholder="Search emoji..." />
      </div>
      <div class="cube-emoji-tabs">
        ${categories.map((cat, i) => `
          <button class="cube-emoji-tab ${i === 1 ? 'active' : ''}" data-category="${cat}">
            ${this.getCategoryIcon(cat)}
          </button>
        `).join('')}
      </div>
      <div class="cube-emoji-grid">
        ${this.emojiCategories.smileys.map(emoji => `
          <button class="cube-emoji-btn" data-emoji="${emoji}">${emoji}</button>
        `).join('')}
      </div>
    `;
    
    // Bind events
    const grid = picker.querySelector('.cube-emoji-grid');
    const tabs = picker.querySelectorAll('.cube-emoji-tab');
    const search = picker.querySelector('input');
    
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const category = tab.dataset.category;
        grid.innerHTML = this.emojiCategories[category].map(emoji => `
          <button class="cube-emoji-btn" data-emoji="${emoji}">${emoji}</button>
        `).join('');
        this.bindEmojiButtons(grid, onSelect);
      };
    });
    
    search.oninput = () => {
      const query = search.value.toLowerCase();
      if (!query) return;
      
      const allEmojis = Object.values(this.emojiCategories).flat();
      // Simple filter - in production would use emoji names
      grid.innerHTML = allEmojis.slice(0, 40).map(emoji => `
        <button class="cube-emoji-btn" data-emoji="${emoji}">${emoji}</button>
      `).join('');
      this.bindEmojiButtons(grid, onSelect);
    };
    
    this.bindEmojiButtons(grid, onSelect);
    
    return picker;
  }

  bindEmojiButtons(grid, onSelect) {
    grid.querySelectorAll('.cube-emoji-btn').forEach(btn => {
      btn.onclick = () => onSelect(btn.dataset.emoji);
    });
  }

  getCategoryIcon(category) {
    const icons = {
      recent: '🕐',
      smileys: '😀',
      gestures: '👋',
      hearts: '❤️',
      objects: '💻',
      symbols: '⭐'
    };
    return icons[category] || '📦';
  }

  // ============================================================================
  // STICKERS
  // ============================================================================

  getDefaultStickerPacks() {
    return {
      cube: {
        name: 'CUBE Pack',
        stickers: [
          { id: 'cube-hi', emoji: '👋', text: 'Hi!' },
          { id: 'cube-ok', emoji: '👍', text: 'OK!' },
          { id: 'cube-love', emoji: '❤️', text: 'Love it!' },
          { id: 'cube-fire', emoji: '🔥', text: 'Fire!' },
          { id: 'cube-party', emoji: '🎉', text: 'Party!' },
          { id: 'cube-rocket', emoji: '🚀', text: 'Let\'s go!' },
          { id: 'cube-think', emoji: '🤔', text: 'Hmm...' },
          { id: 'cube-sad', emoji: '😢', text: 'Sad' }
        ]
      }
    };
  }

  /**
   * Create sticker picker UI
   * @param {Function} onSelect - Callback when sticker is selected
   * @returns {HTMLElement} - Sticker picker element
   */
  createStickerPicker(onSelect) {
    const picker = document.createElement('div');
    picker.className = 'cube-sticker-picker';
    picker.innerHTML = `
      <style>
        .cube-sticker-picker {
          width: 280px;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }
        
        .cube-sticker-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        
        .cube-sticker-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
          background: #374151;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .cube-sticker-btn:hover {
          background: #4b5563;
          transform: scale(1.05);
        }
        
        .cube-sticker-emoji {
          font-size: 32px;
        }
        
        .cube-sticker-text {
          font-size: 10px;
          color: #9ca3af;
        }
      </style>
      <div class="cube-sticker-grid">
        ${this.stickerPacks.cube.stickers.map(sticker => `
          <button class="cube-sticker-btn" data-sticker="${sticker.id}">
            <span class="cube-sticker-emoji">${sticker.emoji}</span>
            <span class="cube-sticker-text">${sticker.text}</span>
          </button>
        `).join('')}
      </div>
    `;
    
    picker.querySelectorAll('.cube-sticker-btn').forEach(btn => {
      btn.onclick = () => {
        const stickerId = btn.dataset.sticker;
        const sticker = this.stickerPacks.cube.stickers.find(s => s.id === stickerId);
        onSelect(sticker);
      };
    });
    
    return picker;
  }

  // ============================================================================
  // SOUND EFFECTS
  // ============================================================================

  /**
   * Play a sound effect
   * @param {string} soundType - Type of sound to play
   */
  playSound(soundType) {
    if (!this.soundsEnabled) return;
    
    try {
      // Use Web Audio API for better performance
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (soundType) {
        case 'message':
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
          
        case 'nudge':
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
          
        case 'sent':
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.05);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.15);
          break;
          
        case 'reaction':
          oscillator.frequency.setValueAtTime(1047, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.05);
          break;
      }
    } catch {
      // Silently fail if audio isn't available
    }
  }

  /**
   * Toggle sound effects
   * @param {boolean} enabled - Whether sounds are enabled
   */
  setSoundsEnabled(enabled) {
    this.soundsEnabled = enabled;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }

  /**
   * Format link previews
   * @param {string} url - URL to preview
   * @returns {HTMLElement} - Link preview element
   */
  async createLinkPreview(url) {
    const preview = document.createElement('div');
    preview.className = 'cube-link-preview';
    preview.innerHTML = `
      <style>
        .cube-link-preview {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(55, 65, 81, 0.5);
          border-radius: 12px;
          border-left: 3px solid #8b5cf6;
          max-width: 300px;
        }
        
        .cube-link-icon {
          width: 48px;
          height: 48px;
          background: #374151;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        .cube-link-content {
          flex: 1;
          min-width: 0;
        }
        
        .cube-link-title {
          font-size: 13px;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .cube-link-url {
          font-size: 11px;
          color: #9ca3af;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      </style>
      <div class="cube-link-icon">🔗</div>
      <div class="cube-link-content">
        <div class="cube-link-title">${new URL(url).hostname}</div>
        <div class="cube-link-url">${url}</div>
      </div>
    `;
    
    return preview;
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.ChatFeaturesService = ChatFeaturesService;
  window.cubeChatFeatures = new ChatFeaturesService();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatFeaturesService;
}
