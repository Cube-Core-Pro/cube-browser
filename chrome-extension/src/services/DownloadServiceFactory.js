/**
 * DownloadServiceFactory - Factory for creating download services
 * 
 * Implements Factory Pattern for service instantiation
 * Supports different providers (Dropbox, Google Drive, OneDrive, LendingPad, etc.)
 * 
 * @version 5.2.0-ultimate
 * 
 * Dependencies (must be loaded before this script):
 * - DropboxDownloadService (from DropboxDownloadService.js)
 * - lendingPadService (from LendingPadService.js)
 */

class DownloadServiceFactory {
  constructor() {
    this.services = new Map();
    this.defaultConfig = {
      timeout: 15000,
      maxRetries: 3,
      validatePDF: true,
      enableLogging: true
    };
  }
  
  /**
   * Get service for specific provider
   * @param {string} provider - 'dropbox', 'gdrive', 'onedrive', etc.
   * @param {Object} config - Optional configuration override
   * @returns {DownloadService}
   */
  getService(provider, config = {}) {
    const normalizedProvider = provider.toLowerCase();
    
    // Check if service already exists
    if (this.services.has(normalizedProvider)) {
      return this.services.get(normalizedProvider);
    }
    
    // Create new service
    const service = this.createService(normalizedProvider, config);
    this.services.set(normalizedProvider, service);
    
    return service;
  }
  
  /**
   * Create service based on provider
   */
  createService(provider, config) {
    const mergedConfig = { ...this.defaultConfig, ...config };
    
    switch (provider) {
      case 'lendingpad':
        // Return singleton instance of LendingPadService
        lendingPadService.initialize();
        return lendingPadService;
      
      case 'dropbox':
        return new DropboxDownloadService(mergedConfig);
      
      case 'gdrive':
      case 'googledrive':
        return new GoogleDriveDownloadService(mergedConfig);
      
      case 'onedrive':
        return new OneDriveDownloadService(mergedConfig);
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  
  /**
   * Detect provider from URL or current domain
   * @param {string} url - File URL (optional, uses window.location if not provided)
   * @returns {string} Provider name
   */
  detectProvider(url) {
    // Check current domain first
    const currentHostname = window.location.hostname;
    if (currentHostname.includes('lendingpad')) {
      return 'lendingpad';
    }
    
    // Then check URL if provided
    if (url) {
      const hostname = new URL(url).hostname;
      
      if (hostname.includes('lendingpad')) {
        return 'lendingpad';
      }
      if (hostname.includes('dropbox')) {
        return 'dropbox';
      }
      if (hostname.includes('google') || hostname.includes('drive.google')) {
        return 'gdrive';
      }
      if (hostname.includes('onedrive') || hostname.includes('sharepoint')) {
        return 'onedrive';
      }
    }
    
    throw new Error('Unknown provider from URL: ' + url);
  }
  
  /**
   * Download from any provider (auto-detect)
   * @param {Object} file - File metadata {url, filename}
   * @param {Object} config - Optional config
   * @returns {Promise<DownloadResult>}
   */
  async downloadAuto(file, config = {}) {
    const provider = this.detectProvider(file.url);
    const service = this.getService(provider, config);
    return await service.download(file);
  }
}

/**
 * Google Drive Download Service
 * Handles downloads from Google Drive with various URL formats
 */
class GoogleDriveDownloadService {
  constructor(config) {
    this.config = config;
    this.apiKey = config.apiKey || null;
    console.log('[GoogleDriveService] Initialized');
  }
  
  /**
   * Extract file ID from Google Drive URL
   * Supports: /file/d/{id}/, /open?id={id}, /uc?id={id}
   */
  extractFileId(url) {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /[?&]id=([a-zA-Z0-9_-]+)/,
      /\/folders\/([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }
  
  /**
   * Get direct download URL for Google Drive file
   */
  getDirectDownloadUrl(fileId) {
    // Use export URL for direct download
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  
  async download(file) {
    console.log('[GoogleDriveService] Starting download:', file.filename);
    
    const fileId = this.extractFileId(file.url);
    if (!fileId) {
      throw new Error('Could not extract file ID from Google Drive URL');
    }
    
    const directUrl = this.getDirectDownloadUrl(fileId);
    
    try {
      // First attempt: Direct download
      const response = await fetch(directUrl, {
        method: 'GET',
        credentials: 'include',
        redirect: 'follow'
      });
      
      // Check for virus scan warning page (large files)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        // Try to extract confirm token for large files
        const html = await response.text();
        const confirmMatch = html.match(/confirm=([a-zA-Z0-9_-]+)/);
        
        if (confirmMatch) {
          const confirmUrl = `${directUrl}&confirm=${confirmMatch[1]}`;
          const confirmedResponse = await fetch(confirmUrl, {
            method: 'GET',
            credentials: 'include',
            redirect: 'follow'
          });
          
          if (confirmedResponse.ok) {
            const blob = await confirmedResponse.blob();
            return this.saveBlobAsFile(blob, file.filename);
          }
        }
        
        // Fallback: Open in new tab for manual download
        console.log('[GoogleDriveService] Opening manual download page');
        window.open(directUrl, '_blank');
        return { success: true, method: 'manual', filename: file.filename };
      }
      
      if (response.ok) {
        const blob = await response.blob();
        return this.saveBlobAsFile(blob, file.filename);
      }
      
      throw new Error(`Download failed with status: ${response.status}`);
    } catch (error) {
      console.error('[GoogleDriveService] Download error:', error);
      // Fallback to opening URL directly
      window.open(directUrl, '_blank');
      return { success: true, method: 'fallback', filename: file.filename };
    }
  }
  
  saveBlobAsFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('[GoogleDriveService] Download completed:', filename);
    return { success: true, method: 'blob', filename: filename, size: blob.size };
  }
}

/**
 * OneDrive Download Service
 * Handles downloads from OneDrive/SharePoint with various URL formats
 */
class OneDriveDownloadService {
  constructor(config) {
    this.config = config;
    console.log('[OneDriveService] Initialized');
  }
  
  /**
   * Convert OneDrive share URL to direct download URL
   */
  getDirectDownloadUrl(url) {
    // Handle different OneDrive URL formats
    
    // Format 1: Share links (1drv.ms short URLs)
    if (url.includes('1drv.ms')) {
      // These need to be resolved first
      return url;
    }
    
    // Format 2: onedrive.live.com share links
    if (url.includes('onedrive.live.com')) {
      // Convert view link to download link
      // ?e=xxx to ?download=1
      const downloadUrl = url.replace(/\?.*$/, '?download=1');
      return downloadUrl;
    }
    
    // Format 3: SharePoint URLs
    if (url.includes('sharepoint.com')) {
      // Try to convert to download format
      if (url.includes('/personal/') || url.includes('/sites/')) {
        // Add download parameter
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}download=1`;
      }
    }
    
    return url;
  }
  
  async download(file) {
    console.log('[OneDriveService] Starting download:', file.filename);
    
    let downloadUrl = this.getDirectDownloadUrl(file.url);
    
    try {
      // Handle 1drv.ms short URLs by following redirect
      if (downloadUrl.includes('1drv.ms')) {
        const resolveResponse = await fetch(downloadUrl, {
          method: 'HEAD',
          redirect: 'follow'
        });
        downloadUrl = resolveResponse.url;
        downloadUrl = this.getDirectDownloadUrl(downloadUrl);
      }
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'include',
        redirect: 'follow'
      });
      
      // Check if we got an HTML page (login required)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        console.log('[OneDriveService] Login may be required, opening in new tab');
        window.open(file.url, '_blank');
        return { success: true, method: 'manual', filename: file.filename };
      }
      
      if (response.ok) {
        const blob = await response.blob();
        return this.saveBlobAsFile(blob, file.filename);
      }
      
      throw new Error(`Download failed with status: ${response.status}`);
    } catch (error) {
      console.error('[OneDriveService] Download error:', error);
      // Fallback: Open in new tab
      window.open(file.url, '_blank');
      return { success: true, method: 'fallback', filename: file.filename };
    }
  }
  
  saveBlobAsFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('[OneDriveService] Download completed:', filename);
    return { success: true, method: 'blob', filename: filename, size: blob.size };
  }
}

// Singleton factory instance - available globally as downloadServiceFactory
const downloadServiceFactory = new DownloadServiceFactory();
