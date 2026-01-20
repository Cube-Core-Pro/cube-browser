/**
 * Download Manager Type Definitions
 * CUBE Nexum Platform v2.0
 */

// ============================================================================
// DOWNLOAD TYPES
// ============================================================================

export type DownloadStatus = 
  | 'pending'      // Waiting to start
  | 'downloading'  // In progress
  | 'paused'       // User paused
  | 'completed'    // Successfully completed
  | 'failed'       // Error occurred
  | 'cancelled';   // User cancelled

export type DownloadCategory = 
  | 'documents'
  | 'images'
  | 'videos'
  | 'audio'
  | 'archives'
  | 'software'
  | 'other';

export interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  destination: string;
  file_size: number;              // Total bytes
  downloaded_bytes: number;       // Current bytes
  status: DownloadStatus;
  category: DownloadCategory;
  mime_type?: string;
  speed: number;                  // Bytes per second
  eta: number;                    // Estimated time remaining (seconds)
  progress: number;               // Percentage (0-100)
  error?: string;
  start_time: number;             // Unix timestamp
  end_time?: number;              // Unix timestamp
  resume_supported: boolean;
  paused_at?: number;             // Unix timestamp
}

export interface DownloadQueue {
  active: DownloadItem[];         // Currently downloading
  pending: DownloadItem[];        // Waiting to start
  completed: DownloadItem[];      // Finished downloads
  failed: DownloadItem[];         // Failed downloads
}

export interface DownloadStats {
  total_downloads: number;
  active_downloads: number;
  completed_downloads: number;
  failed_downloads: number;
  total_bytes_downloaded: number;
  total_bytes_to_download: number;
  overall_speed: number;          // Combined speed (bytes/sec)
  average_speed: number;          // Average speed (bytes/sec)
}

export interface DownloadSettings {
  max_concurrent: number;         // Max simultaneous downloads
  speed_limit: number;            // Bytes/sec (0 = unlimited)
  default_destination: string;
  auto_organize: boolean;         // Organize by category
  resume_on_startup: boolean;
  show_notifications: boolean;
  delete_completed_after: number; // Days (0 = never)
  chunk_size: number;             // Download chunk size
}

export interface BandwidthLimit {
  enabled: boolean;
  limit: number;                  // Bytes per second
  schedule?: BandwidthSchedule[];
}

export interface BandwidthSchedule {
  id: string;
  start_time: string;             // HH:MM format
  end_time: string;               // HH:MM format
  days: number[];                 // 0=Sunday, 1=Monday, etc.
  limit: number;                  // Bytes per second
}

export interface DownloadFilter {
  status?: DownloadStatus[];
  category?: DownloadCategory[];
  date_range?: {
    start: number;
    end: number;
  };
  min_size?: number;
  max_size?: number;
  search?: string;
}

export interface DownloadSort {
  by: 'name' | 'size' | 'date' | 'progress' | 'speed' | 'status';
  direction: 'asc' | 'desc';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique download ID
 */
export const generateDownloadId = (): string => {
  return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format bytes to human readable
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format speed (bytes/sec to readable)
 */
export const formatSpeed = (bytesPerSecond: number): string => {
  return formatBytes(bytesPerSecond) + '/s';
};

/**
 * Format ETA (seconds to readable)
 */
export const formatETA = (seconds: number): string => {
  if (seconds < 0 || !isFinite(seconds)) return 'Unknown';
  if (seconds === 0) return 'Complete';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Calculate download progress
 */
export const calculateProgress = (downloaded: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min(Math.round((downloaded / total) * 100), 100);
};

/**
 * Calculate download speed
 */
export const calculateSpeed = (
  bytesDownloaded: number,
  elapsedSeconds: number
): number => {
  if (elapsedSeconds === 0) return 0;
  return bytesDownloaded / elapsedSeconds;
};

/**
 * Calculate ETA
 */
export const calculateETA = (
  remainingBytes: number,
  speed: number
): number => {
  if (speed === 0) return Infinity;
  return remainingBytes / speed;
};

/**
 * Get category from filename
 */
export const getCategoryFromFilename = (filename: string): DownloadCategory => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const categoryMap: Record<string, DownloadCategory> = {
    // Documents
    pdf: 'documents',
    doc: 'documents',
    docx: 'documents',
    txt: 'documents',
    rtf: 'documents',
    odt: 'documents',
    xls: 'documents',
    xlsx: 'documents',
    ppt: 'documents',
    pptx: 'documents',
    
    // Images
    jpg: 'images',
    jpeg: 'images',
    png: 'images',
    gif: 'images',
    bmp: 'images',
    svg: 'images',
    webp: 'images',
    ico: 'images',
    
    // Videos
    mp4: 'videos',
    avi: 'videos',
    mkv: 'videos',
    mov: 'videos',
    wmv: 'videos',
    flv: 'videos',
    webm: 'videos',
    m4v: 'videos',
    
    // Audio
    mp3: 'audio',
    wav: 'audio',
    flac: 'audio',
    aac: 'audio',
    ogg: 'audio',
    m4a: 'audio',
    wma: 'audio',
    
    // Archives
    zip: 'archives',
    rar: 'archives',
    '7z': 'archives',
    tar: 'archives',
    gz: 'archives',
    bz2: 'archives',
    
    // Software
    exe: 'software',
    dmg: 'software',
    pkg: 'software',
    deb: 'software',
    rpm: 'software',
    msi: 'software',
    apk: 'software',
  };
  
  return categoryMap[ext] || 'other';
};

/**
 * Get category icon
 */
export const getCategoryIcon = (category: DownloadCategory): string => {
  const icons: Record<DownloadCategory, string> = {
    documents: '📄',
    images: '🖼️',
    videos: '🎬',
    audio: '🎵',
    archives: '📦',
    software: '💿',
    other: '📁',
  };
  
  return icons[category];
};

/**
 * Get status color
 */
export const getStatusColor = (status: DownloadStatus): string => {
  const colors: Record<DownloadStatus, string> = {
    pending: '#6b7280',      // Gray
    downloading: '#3b82f6',  // Blue
    paused: '#f59e0b',       // Orange
    completed: '#10b981',    // Green
    failed: '#ef4444',       // Red
    cancelled: '#6b7280',    // Gray
  };
  
  return colors[status];
};

/**
 * Get status icon
 */
export const getStatusIcon = (status: DownloadStatus): string => {
  const icons: Record<DownloadStatus, string> = {
    pending: '⏳',
    downloading: '⬇️',
    paused: '⏸️',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫',
  };
  
  return icons[status];
};

/**
 * Filter downloads
 */
export const filterDownloads = (
  downloads: DownloadItem[],
  filter: DownloadFilter
): DownloadItem[] => {
  return downloads.filter((item) => {
    // Status filter
    if (filter.status && filter.status.length > 0) {
      if (!filter.status.includes(item.status)) return false;
    }
    
    // Category filter
    if (filter.category && filter.category.length > 0) {
      if (!filter.category.includes(item.category)) return false;
    }
    
    // Date range filter
    if (filter.date_range) {
      if (item.start_time < filter.date_range.start || item.start_time > filter.date_range.end) {
        return false;
      }
    }
    
    // Size filter
    if (filter.min_size !== undefined && item.file_size < filter.min_size) {
      return false;
    }
    if (filter.max_size !== undefined && item.file_size > filter.max_size) {
      return false;
    }
    
    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      if (!item.filename.toLowerCase().includes(searchLower) &&
          !item.url.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Sort downloads
 */
export const sortDownloads = (
  downloads: DownloadItem[],
  sort: DownloadSort
): DownloadItem[] => {
  const sorted = [...downloads];
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    switch (sort.by) {
      case 'name':
        comparison = a.filename.localeCompare(b.filename);
        break;
      case 'size':
        comparison = a.file_size - b.file_size;
        break;
      case 'date':
        comparison = a.start_time - b.start_time;
        break;
      case 'progress':
        comparison = a.progress - b.progress;
        break;
      case 'speed':
        comparison = a.speed - b.speed;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return sort.direction === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
};

/**
 * Get overall queue stats
 */
export const getDownloadStats = (queue: DownloadQueue): DownloadStats => {
  const allDownloads = [
    ...queue.active,
    ...queue.pending,
    ...queue.completed,
    ...queue.failed,
  ];
  
  const totalBytesDownloaded = allDownloads.reduce(
    (sum, item) => sum + item.downloaded_bytes,
    0
  );
  
  const totalBytesToDownload = allDownloads.reduce(
    (sum, item) => sum + item.file_size,
    0
  );
  
  const overallSpeed = queue.active.reduce(
    (sum, item) => sum + item.speed,
    0
  );
  
  const averageSpeed = queue.active.length > 0
    ? overallSpeed / queue.active.length
    : 0;
  
  return {
    total_downloads: allDownloads.length,
    active_downloads: queue.active.length,
    completed_downloads: queue.completed.length,
    failed_downloads: queue.failed.length,
    total_bytes_downloaded: totalBytesDownloaded,
    total_bytes_to_download: totalBytesToDownload,
    overall_speed: overallSpeed,
    average_speed: averageSpeed,
  };
};

/**
 * Check if bandwidth limit is active
 */
export const isLimitActive = (limit: BandwidthLimit): boolean => {
  if (!limit.enabled) return false;
  if (!limit.schedule || limit.schedule.length === 0) return true;
  
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return limit.schedule.some((schedule) => {
    if (!schedule.days.includes(currentDay)) return false;
    return currentTime >= schedule.start_time && currentTime <= schedule.end_time;
  });
};

/**
 * Get active bandwidth limit
 */
export const getActiveBandwidthLimit = (limit: BandwidthLimit): number => {
  if (!limit.enabled) return 0;
  if (!limit.schedule || limit.schedule.length === 0) return limit.limit;
  
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  for (const schedule of limit.schedule) {
    if (schedule.days.includes(currentDay) &&
        currentTime >= schedule.start_time &&
        currentTime <= schedule.end_time) {
      return schedule.limit;
    }
  }
  
  return limit.limit;
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 255);
};

/**
 * Extract filename from URL
 */
export const extractFilename = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'download';
    return sanitizeFilename(decodeURIComponent(filename));
  } catch {
    return 'download';
  }
};

/**
 * Validate download URL
 */
export const isValidDownloadUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:', 'ftp:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};
