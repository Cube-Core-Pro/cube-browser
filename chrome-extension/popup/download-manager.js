// CUBE OmniFill - Download Manager Module v6.0 Elite
// Advanced download management with IDM-like features, scheduler, and video grabber

console.log('📥 Download Manager Module v6.0 Elite loaded');

// Forward declarations - classes are defined below DownloadManager
let DownloadScheduler;
let VideoGrabber;
let SegmentedDownload;

class DownloadManager {
  constructor() {
    this.downloads = new Map(); // downloadId -> downloadInfo
    this.queue = [];
    this.maxConcurrent = 3;
    this.activeDownloads = 0;
    this.listeners = [];
    
    // v6.0 Elite Features - initialized lazily to avoid TDZ errors
    this.scheduler = null;
    this.videoGrabber = null;
    this.categories = new Map();
    this.speedLimiter = {
      enabled: false,
      maxSpeed: 0, // 0 = unlimited
      currentSpeed: 0
    };
    this.segments = new Map(); // Multi-segment downloads
    this.settings = {
      autoStart: true,
      showNotifications: true,
      defaultCategory: 'general',
      resumeIncomplete: true,
      virusScan: false,
      maxRetries: 3,
      retryDelay: 5000
    };
    
    // Initialize categories
    this.initializeCategories();
    this.loadSettings();
    
    // Initialize elite features after class definitions are available
    this._initEliteFeatures();
  }
  
  /**
   * Initialize elite features (called after class definitions are loaded)
   */
  _initEliteFeatures() {
    // Use setTimeout to ensure classes are defined
    setTimeout(() => {
      if (typeof DownloadScheduler !== 'undefined' && DownloadScheduler) {
        this.scheduler = new DownloadScheduler();
      }
      if (typeof VideoGrabber !== 'undefined' && VideoGrabber) {
        this.videoGrabber = new VideoGrabber();
      }
    }, 0);
  }

  /**
   * Initialize default download categories
   */
  initializeCategories() {
    const defaultCategories = [
      { id: 'documents', name: 'Documents', extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'], icon: '📄' },
      { id: 'videos', name: 'Videos', extensions: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.webm', '.flv'], icon: '🎬' },
      { id: 'music', name: 'Music', extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'], icon: '🎵' },
      { id: 'images', name: 'Images', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'], icon: '🖼️' },
      { id: 'archives', name: 'Archives', extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'], icon: '📦' },
      { id: 'programs', name: 'Programs', extensions: ['.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.app'], icon: '💿' },
      { id: 'general', name: 'General', extensions: [], icon: '📁' }
    ];
    
    defaultCategories.forEach(cat => this.categories.set(cat.id, cat));
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get('downloadManagerSettings');
      if (result.downloadManagerSettings) {
        this.settings = { ...this.settings, ...result.downloadManagerSettings };
      }
    } catch (error) {
      console.warn('[DownloadManager] Could not load settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      await chrome.storage.local.set({ downloadManagerSettings: this.settings });
    } catch (error) {
      console.error('[DownloadManager] Could not save settings:', error);
    }
  }

  /**
   * Get category for file based on extension
   * @param {string} filename 
   * @returns {object} Category object
   */
  getCategoryForFile(filename) {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    for (const [id, category] of this.categories) {
      if (category.extensions.includes(ext)) {
        return category;
      }
    }
    return this.categories.get('general');
  }

  /**
   * Set speed limit for downloads
   * @param {number} maxSpeedKBps - Maximum speed in KB/s (0 = unlimited)
   */
  setSpeedLimit(maxSpeedKBps) {
    this.speedLimiter.enabled = maxSpeedKBps > 0;
    this.speedLimiter.maxSpeed = maxSpeedKBps * 1024; // Convert to bytes
    console.log(`[DownloadManager] Speed limit: ${maxSpeedKBps > 0 ? maxSpeedKBps + ' KB/s' : 'Unlimited'}`);
  }

  /**
   * Add download to queue with priority
   * @param {object} download 
   * @param {number} priority - Higher = more priority
   */
  queueDownload(download, priority = 0) {
    download.priority = priority;
    download.queuedAt = Date.now();
    this.queue.push(download);
    this.queue.sort((a, b) => b.priority - a.priority);
    this.processQueue();
  }

  /**
   * Process download queue
   */
  async processQueue() {
    while (this.activeDownloads < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        this.activeDownloads++;
        try {
          await this.downloadPDF(next);
        } catch (error) {
          console.error('[DownloadManager] Queue download failed:', error);
        }
        this.activeDownloads--;
      }
    }
  }

  /**
   * Start downloading a PDF
   * @param {Object} pdf - PDF object with url, filename, etc.
   * @returns {Promise<number>} Download ID
   */
  async downloadPDF(pdf) {
    console.log('[DownloadManager] Starting download:', pdf);
    
    let filename = this.sanitizeFilename(pdf.filename || pdf.name || pdf.title || 'document.pdf');
    
    // Ensure filename has .pdf extension
    if (!filename.toLowerCase().endsWith('.pdf')) {
      filename += '.pdf';
    }
    
    // Validate URL
    if (!pdf.url) {
      throw new Error('No URL provided for download');
    }
    
    let downloadUrl = pdf.url;
    
    // Handle different URL types
    if (pdf.url.startsWith('blob:') || pdf.url.startsWith('data:')) {
      console.log('[DownloadManager] Using blob/data URL directly');
      downloadUrl = pdf.url;
    } else if (!pdf.url.startsWith('http://') && !pdf.url.startsWith('https://')) {
      // Convert relative URLs to absolute
      try {
        const baseUrl = new URL(window.location.href);
        downloadUrl = new URL(pdf.url, baseUrl.origin).href;
        console.log('[DownloadManager] Converted relative URL to:', downloadUrl);
      } catch (e) {
        console.error('[DownloadManager] Failed to convert URL:', e);
      }
    }
    
    console.log('[DownloadManager] Final download URL:', downloadUrl);
    console.log('[DownloadManager] Filename:', filename);
    
    try {
      // ✨ NUEVA ESTRATEGIA: Fetch primero para validar contenido
      let finalUrl = downloadUrl;
      
      // Si NO es blob/data, hacer fetch para validar y obtener contenido real
      if (!downloadUrl.startsWith('blob:') && !downloadUrl.startsWith('data:')) {
        console.log('[DownloadManager] 🔍 Fetching to validate content...');
        
        try {
          const response = await fetch(downloadUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/pdf,application/octet-stream,*/*'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          // Verificar Content-Type
          const contentType = response.headers.get('content-type') || '';
          console.log('[DownloadManager] Content-Type:', contentType);
          
          // Obtener el contenido
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          
          // Validar que NO sea HTML
          const isHTML = this.detectHTML(bytes);
          
          if (isHTML) {
            console.error('[DownloadManager] ❌ HTML detected! Rejecting download');
            throw new Error('Downloaded content is HTML, not a PDF. The URL may be showing a viewer page instead of the actual document.');
          }
          
          // Validar que sea PDF válido (magic bytes)
          const isPDF = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
          
          if (!isPDF) {
            console.warn('[DownloadManager] ⚠️ Not a PDF file! Content type:', contentType);
            // Intentar descargar de todos modos, pero advertir
          } else {
            console.log('[DownloadManager] ✅ Valid PDF detected');
          }
          
          // Crear blob URL desde el contenido validado
          const validBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
          finalUrl = URL.createObjectURL(validBlob);
          console.log('[DownloadManager] Created blob URL from validated content');
          
        } catch (fetchError) {
          console.warn('[DownloadManager] Fetch validation failed, trying direct download:', fetchError.message);
          // Si falla el fetch, intentar descarga directa (fallback)
          finalUrl = downloadUrl;
        }
      }
      
      const downloadId = await new Promise((resolve, reject) => {
        chrome.downloads.download({
          url: finalUrl,
          filename: `CUBE_OmniFill/${filename}`,
          saveAs: false,
          conflictAction: 'uniquify'
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(downloadId);
          }
        });
      });

      // Store download info
      this.downloads.set(downloadId, {
        id: downloadId,
        pdf: pdf,
        filename: filename,
        status: 'in_progress',
        progress: 0,
        startTime: Date.now(),
        bytesReceived: 0,
        totalBytes: 0
      });

      // Start tracking
      this.trackDownload(downloadId);
      this.notifyListeners('started', downloadId);

      return downloadId;
    } catch (error) {
      console.error('[DownloadManager] Download failed:', error);
      throw error;
    }
  }

  /**
   * Download multiple PDFs with queue management
   * @param {Array} pdfs - Array of PDF objects
   */
  async downloadMultiple(pdfs) {
    console.log('[DownloadManager] Downloading multiple:', pdfs.length);
    
    const results = [];
    
    for (const pdf of pdfs) {
      try {
        const downloadId = await this.downloadPDF(pdf);
        results.push({ success: true, downloadId, pdf });
      } catch (error) {
        results.push({ success: false, error: error.message, pdf });
      }
      
      // Small delay between downloads to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  }

  /**
   * Track download progress
   * @param {number} downloadId 
   */
  trackDownload(downloadId) {
    const intervalId = setInterval(() => {
      chrome.downloads.search({ id: downloadId }, (items) => {
        if (items.length === 0) {
          clearInterval(intervalId);
          return;
        }

        const item = items[0];
        const downloadInfo = this.downloads.get(downloadId);
        
        if (!downloadInfo) {
          clearInterval(intervalId);
          return;
        }

        // Update progress
        downloadInfo.status = item.state;
        downloadInfo.bytesReceived = item.bytesReceived;
        downloadInfo.totalBytes = item.totalBytes;
        downloadInfo.progress = item.totalBytes > 0 
          ? Math.round((item.bytesReceived / item.totalBytes) * 100)
          : 0;

        this.notifyListeners('progress', downloadId, downloadInfo);

        // Check if complete or failed
        if (item.state === 'complete') {
          clearInterval(intervalId);
          downloadInfo.endTime = Date.now();
          downloadInfo.duration = downloadInfo.endTime - downloadInfo.startTime;
          this.notifyListeners('complete', downloadId, downloadInfo);
          console.log('[DownloadManager] Download complete:', downloadId, downloadInfo);
        } else if (item.state === 'interrupted') {
          clearInterval(intervalId);
          downloadInfo.error = item.error || 'Download interrupted';
          this.notifyListeners('error', downloadId, downloadInfo);
          console.error('[DownloadManager] Download failed:', downloadId, downloadInfo);
        }
      });
    }, 500); // Check every 500ms
  }

  /**
   * Pause a download
   * @param {number} downloadId 
   */
  async pauseDownload(downloadId) {
    try {
      await chrome.downloads.pause(downloadId);
      const downloadInfo = this.downloads.get(downloadId);
      if (downloadInfo) {
        downloadInfo.status = 'paused';
        this.notifyListeners('paused', downloadId, downloadInfo);
      }
    } catch (error) {
      console.error('[DownloadManager] Pause failed:', error);
      throw error;
    }
  }

  /**
   * Resume a download
   * @param {number} downloadId 
   */
  async resumeDownload(downloadId) {
    try {
      await chrome.downloads.resume(downloadId);
      const downloadInfo = this.downloads.get(downloadId);
      if (downloadInfo) {
        downloadInfo.status = 'in_progress';
        this.notifyListeners('resumed', downloadId, downloadInfo);
      }
    } catch (error) {
      console.error('[DownloadManager] Resume failed:', error);
      throw error;
    }
  }

  /**
   * Cancel a download
   * @param {number} downloadId 
   */
  async cancelDownload(downloadId) {
    try {
      await chrome.downloads.cancel(downloadId);
      const downloadInfo = this.downloads.get(downloadId);
      if (downloadInfo) {
        downloadInfo.status = 'cancelled';
        this.notifyListeners('cancelled', downloadId, downloadInfo);
      }
      this.downloads.delete(downloadId);
    } catch (error) {
      console.error('[DownloadManager] Cancel failed:', error);
      throw error;
    }
  }

  /**
   * Show download in folder
   * @param {number} downloadId 
   */
  async showInFolder(downloadId) {
    try {
      await chrome.downloads.show(downloadId);
    } catch (error) {
      console.error('[DownloadManager] Show in folder failed:', error);
      throw error;
    }
  }

  /**
   * Open downloaded file
   * @param {number} downloadId 
   */
  async openDownload(downloadId) {
    try {
      await chrome.downloads.open(downloadId);
    } catch (error) {
      console.error('[DownloadManager] Open failed:', error);
      throw error;
    }
  }

  /**
   * Get all active downloads
   */
  getActiveDownloads() {
    return Array.from(this.downloads.values()).filter(
      d => d.status === 'in_progress' || d.status === 'paused'
    );
  }

  /**
   * Get all downloads (including completed)
   */
  getAllDownloads() {
    return Array.from(this.downloads.values());
  }

  /**
   * Get download info
   * @param {number} downloadId 
   */
  getDownload(downloadId) {
    return this.downloads.get(downloadId);
  }

  /**
   * Clear completed downloads from list
   */
  clearCompleted() {
    for (const [id, info] of this.downloads.entries()) {
      if (info.status === 'complete' || info.status === 'interrupted') {
        this.downloads.delete(id);
      }
    }
    this.notifyListeners('cleared');
  }

  /**
   * Add event listener
   * @param {Function} callback - (event, downloadId, downloadInfo) => {}
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove event listener
   * @param {Function} callback 
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, downloadId, downloadInfo) {
    this.listeners.forEach(callback => {
      try {
        callback(event, downloadId, downloadInfo);
      } catch (error) {
        console.error('[DownloadManager] Listener error:', error);
      }
    });
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename) {
    // Remove invalid characters
    let clean = filename.replace(/[<>:"/\\|?*]/g, '_');
    
    // Ensure .pdf extension
    if (!clean.toLowerCase().endsWith('.pdf')) {
      clean += '.pdf';
    }
    
    // Limit length
    if (clean.length > 200) {
      const ext = '.pdf';
      clean = clean.substring(0, 200 - ext.length) + ext;
    }
    
    return clean;
  }

  /**
   * Detect if content is HTML
   * @param {Uint8Array} bytes 
   * @returns {boolean}
   */
  detectHTML(bytes) {
    // Check first 2048 bytes for HTML patterns
    const checkBytes = bytes.slice(0, Math.min(2048, bytes.length));
    
    // HTML patterns (case-insensitive)
    const htmlPatterns = [
      [0x3C, 0x21, 0x44, 0x4F, 0x43, 0x54, 0x59, 0x50, 0x45], // <!DOCTYPE
      [0x3C, 0x68, 0x74, 0x6D, 0x6C], // <html
      [0x3C, 0x48, 0x54, 0x4D, 0x4C], // <HTML
      [0x3C, 0x62, 0x6F, 0x64, 0x79], // <body
      [0x3C, 0x42, 0x4F, 0x44, 0x59], // <BODY
      [0x3C, 0x68, 0x65, 0x61, 0x64], // <head
      [0x3C, 0x48, 0x45, 0x41, 0x44], // <HEAD
    ];
    
    // Search for any HTML pattern
    for (const pattern of htmlPatterns) {
      if (this.searchBytesPattern(checkBytes, pattern)) {
        return true;
      }
    }
    
    // Also check text content for common HTML strings
    try {
      const text = new TextDecoder('utf-8', { fatal: false }).decode(checkBytes);
      const htmlStrings = [
        '<!DOCTYPE',
        '<html',
        '<HTML',
        '<body',
        '<BODY',
        '<head',
        '<HEAD',
        'text/html',
        'Content-Type: text/html'
      ];
      
      for (const str of htmlStrings) {
        if (text.includes(str)) {
          return true;
        }
      }
    } catch (e) {
      // Ignore decode errors
    }
    
    return false;
  }

  /**
   * Search for byte pattern in array
   * @param {Uint8Array} bytes 
   * @param {Array<number>} pattern 
   * @returns {boolean}
   */
  searchBytesPattern(bytes, pattern) {
    for (let i = 0; i <= bytes.length - pattern.length; i++) {
      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (bytes[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        return true;
      }
    }
    return false;
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format duration to human readable
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }
}

// NOTE: Singleton instance is created at the end of the file
// after all helper classes (DownloadScheduler, VideoGrabber, SegmentedDownload) are defined

/**
 * Download Scheduler - Schedule downloads for specific times
 */
DownloadScheduler = class {
  constructor() {
    this.scheduled = new Map();
    this.checkInterval = null;
    this.startScheduleChecker();
  }

  /**
   * Schedule a download for a specific time
   * @param {object} download - Download configuration
   * @param {Date} scheduledTime - When to start the download
   * @param {object} options - Additional options
   */
  schedule(download, scheduledTime, options = {}) {
    const id = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const scheduledDownload = {
      id,
      download,
      scheduledTime: scheduledTime.getTime(),
      repeat: options.repeat || 'none', // 'none', 'daily', 'weekly'
      enabled: true,
      createdAt: Date.now()
    };
    
    this.scheduled.set(id, scheduledDownload);
    this.saveScheduled();
    
    console.log(`[Scheduler] Download scheduled for ${scheduledTime.toLocaleString()}`);
    return id;
  }

  /**
   * Cancel a scheduled download
   * @param {string} id 
   */
  cancel(id) {
    this.scheduled.delete(id);
    this.saveScheduled();
    console.log(`[Scheduler] Scheduled download ${id} cancelled`);
  }

  /**
   * Get all scheduled downloads
   */
  getScheduled() {
    return Array.from(this.scheduled.values());
  }

  /**
   * Start the schedule checker
   */
  startScheduleChecker() {
    this.checkInterval = setInterval(() => this.checkScheduled(), 30000); // Check every 30 seconds
  }

  /**
   * Check and execute scheduled downloads
   */
  async checkScheduled() {
    const now = Date.now();
    
    for (const [id, scheduled] of this.scheduled) {
      if (!scheduled.enabled) continue;
      
      if (now >= scheduled.scheduledTime) {
        console.log(`[Scheduler] Executing scheduled download ${id}`);
        
        try {
          await window.downloadManager.downloadPDF(scheduled.download);
          
          // Handle repeat
          if (scheduled.repeat === 'daily') {
            scheduled.scheduledTime += 24 * 60 * 60 * 1000;
          } else if (scheduled.repeat === 'weekly') {
            scheduled.scheduledTime += 7 * 24 * 60 * 60 * 1000;
          } else {
            this.scheduled.delete(id);
          }
        } catch (error) {
          console.error(`[Scheduler] Failed to execute scheduled download:`, error);
        }
      }
    }
    
    this.saveScheduled();
  }

  /**
   * Save scheduled downloads to storage
   */
  async saveScheduled() {
    try {
      const data = Array.from(this.scheduled.entries());
      await chrome.storage.local.set({ scheduledDownloads: data });
    } catch (error) {
      console.warn('[Scheduler] Could not save scheduled downloads:', error);
    }
  }

  /**
   * Load scheduled downloads from storage
   */
  async loadScheduled() {
    try {
      const result = await chrome.storage.local.get('scheduledDownloads');
      if (result.scheduledDownloads) {
        this.scheduled = new Map(result.scheduledDownloads);
      }
    } catch (error) {
      console.warn('[Scheduler] Could not load scheduled downloads:', error);
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

/**
 * Video Grabber - Detect and download videos from web pages
 */
VideoGrabber = class {
  constructor() {
    this.detectedVideos = [];
    this.supportedSites = [
      { name: 'YouTube', patterns: [/youtube\.com\/watch/, /youtu\.be\//], extractor: 'youtube' },
      { name: 'Vimeo', patterns: [/vimeo\.com\/\d+/], extractor: 'vimeo' },
      { name: 'Dailymotion', patterns: [/dailymotion\.com\/video/], extractor: 'dailymotion' },
      { name: 'Generic', patterns: [/.*/], extractor: 'generic' }
    ];
  }

  /**
   * Scan page for video elements and sources
   * @returns {Promise<Array>} Detected videos
   */
  async scanPage() {
    console.log('[VideoGrabber] Scanning page for videos...');
    this.detectedVideos = [];
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return [];
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: this.detectVideosInPage
      });
      
      if (results && results[0] && results[0].result) {
        this.detectedVideos = results[0].result;
        console.log(`[VideoGrabber] Found ${this.detectedVideos.length} videos`);
      }
    } catch (error) {
      console.error('[VideoGrabber] Scan failed:', error);
    }
    
    return this.detectedVideos;
  }

  /**
   * Function to be injected into page to detect videos
   * @returns {Array} Detected video sources
   */
  detectVideosInPage() {
    const videos = [];
    
    // Detect HTML5 video elements
    document.querySelectorAll('video').forEach((video, index) => {
      const sources = [];
      
      if (video.src) {
        sources.push({ url: video.src, type: 'video/mp4' });
      }
      
      video.querySelectorAll('source').forEach(source => {
        if (source.src) {
          sources.push({ url: source.src, type: source.type || 'video/mp4' });
        }
      });
      
      if (sources.length > 0) {
        videos.push({
          id: `video_${index}`,
          type: 'html5',
          title: video.title || document.title || `Video ${index + 1}`,
          duration: video.duration || 0,
          poster: video.poster || null,
          sources,
          width: video.videoWidth || video.clientWidth || 0,
          height: video.videoHeight || video.clientHeight || 0
        });
      }
    });
    
    // Detect embedded iframes (YouTube, Vimeo, etc.)
    document.querySelectorAll('iframe').forEach((iframe, index) => {
      const src = iframe.src;
      
      if (src.includes('youtube.com/embed') || src.includes('player.vimeo.com')) {
        videos.push({
          id: `embed_${index}`,
          type: 'embed',
          title: iframe.title || document.title || `Embedded Video ${index + 1}`,
          url: src,
          platform: src.includes('youtube') ? 'YouTube' : src.includes('vimeo') ? 'Vimeo' : 'Unknown',
          width: iframe.width || iframe.clientWidth || 0,
          height: iframe.height || iframe.clientHeight || 0
        });
      }
    });
    
    // Detect video links
    document.querySelectorAll('a[href]').forEach((link, index) => {
      const href = link.href;
      const videoExtensions = ['.mp4', '.webm', '.mkv', '.avi', '.mov', '.m4v'];
      
      if (videoExtensions.some(ext => href.toLowerCase().includes(ext))) {
        videos.push({
          id: `link_${index}`,
          type: 'link',
          title: link.textContent || link.title || `Video Link ${index + 1}`,
          url: href
        });
      }
    });
    
    return videos;
  }

  /**
   * Download a detected video
   * @param {object} video - Video object from detection
   * @param {object} options - Download options
   */
  async downloadVideo(video, options = {}) {
    console.log('[VideoGrabber] Downloading video:', video);
    
    let downloadUrl = null;
    let filename = this.sanitizeFilename(video.title || 'video') + '.mp4';
    
    if (video.type === 'html5' && video.sources && video.sources.length > 0) {
      // Get highest quality source
      const bestSource = video.sources.reduce((best, current) => {
        if (!best) return current;
        // Prefer mp4
        if (current.type === 'video/mp4') return current;
        return best;
      }, null);
      
      downloadUrl = bestSource ? bestSource.url : video.sources[0].url;
    } else if (video.type === 'link') {
      downloadUrl = video.url;
    } else if (video.type === 'embed') {
      // For embedded videos, we can't directly download
      throw new Error('Cannot directly download embedded videos. Please use the platform\'s download feature or a dedicated video downloader.');
    }
    
    if (!downloadUrl) {
      throw new Error('No downloadable URL found for this video');
    }
    
    // Queue the download
    window.downloadManager.queueDownload({
      url: downloadUrl,
      filename,
      category: 'videos'
    }, options.priority || 1);
    
    return { success: true, url: downloadUrl, filename };
  }

  /**
   * Get all detected videos
   */
  getDetectedVideos() {
    return this.detectedVideos;
  }

  /**
   * Sanitize filename for video
   */
  sanitizeFilename(name) {
    return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
  }
}

/**
 * Multi-Segment Download Support
 * Splits large files into multiple segments for faster downloads
 */
SegmentedDownload = class {
  constructor(url, filename, numSegments = 4) {
    this.url = url;
    this.filename = filename;
    this.numSegments = numSegments;
    this.segments = [];
    this.status = 'pending';
    this.totalSize = 0;
    this.downloadedSize = 0;
  }

  /**
   * Check if server supports range requests
   */
  async checkRangeSupport() {
    try {
      const response = await fetch(this.url, { method: 'HEAD' });
      const acceptRanges = response.headers.get('Accept-Ranges');
      const contentLength = response.headers.get('Content-Length');
      
      return {
        supportsRange: acceptRanges === 'bytes',
        size: parseInt(contentLength, 10) || 0
      };
    } catch (error) {
      console.error('[SegmentedDownload] Range check failed:', error);
      return { supportsRange: false, size: 0 };
    }
  }

  /**
   * Start segmented download
   */
  async start() {
    const { supportsRange, size } = await this.checkRangeSupport();
    
    if (!supportsRange || size < 1024 * 1024) { // Less than 1MB or no range support
      console.log('[SegmentedDownload] Using single segment download');
      this.numSegments = 1;
    }
    
    this.totalSize = size;
    const segmentSize = Math.ceil(size / this.numSegments);
    
    console.log(`[SegmentedDownload] Starting ${this.numSegments}-segment download of ${this.formatBytes(size)}`);
    
    // Create segments
    for (let i = 0; i < this.numSegments; i++) {
      const start = i * segmentSize;
      const end = Math.min(start + segmentSize - 1, size - 1);
      
      this.segments.push({
        id: i,
        start,
        end,
        downloaded: 0,
        status: 'pending',
        data: null
      });
    }
    
    this.status = 'downloading';
    
    // Download all segments in parallel
    const downloadPromises = this.segments.map(segment => this.downloadSegment(segment));
    
    try {
      await Promise.all(downloadPromises);
      this.status = 'complete';
      console.log('[SegmentedDownload] All segments complete, merging...');
      return await this.mergeSegments();
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  /**
   * Download a single segment
   */
  async downloadSegment(segment) {
    const headers = this.numSegments > 1 
      ? { 'Range': `bytes=${segment.start}-${segment.end}` }
      : {};
    
    try {
      const response = await fetch(this.url, { headers });
      segment.data = await response.arrayBuffer();
      segment.downloaded = segment.data.byteLength;
      segment.status = 'complete';
      
      this.downloadedSize += segment.downloaded;
      console.log(`[SegmentedDownload] Segment ${segment.id} complete (${this.formatBytes(segment.downloaded)})`);
    } catch (error) {
      segment.status = 'error';
      throw error;
    }
  }

  /**
   * Merge all segments into final file
   */
  async mergeSegments() {
    const totalLength = this.segments.reduce((sum, seg) => sum + (seg.data?.byteLength || 0), 0);
    const merged = new Uint8Array(totalLength);
    
    let offset = 0;
    for (const segment of this.segments) {
      if (segment.data) {
        merged.set(new Uint8Array(segment.data), offset);
        offset += segment.data.byteLength;
      }
    }
    
    const blob = new Blob([merged]);
    const url = URL.createObjectURL(blob);
    
    return { blob, url, size: totalLength };
  }

  /**
   * Get download progress
   */
  getProgress() {
    if (this.totalSize === 0) return 0;
    return Math.round((this.downloadedSize / this.totalSize) * 100);
  }

  /**
   * Format bytes
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }
}

// Export for use in other modules
window.DownloadScheduler = DownloadScheduler;
window.VideoGrabber = VideoGrabber;
window.SegmentedDownload = SegmentedDownload;

// Create singleton instance AFTER all classes are defined
window.downloadManager = new DownloadManager();

console.log('✅ Download Manager v6.0 Elite - All modules loaded');