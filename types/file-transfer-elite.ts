// ============================================================================
// FILE TRANSFER ELITE - TYPE DEFINITIONS
// ============================================================================
// Professional file transfer with P2P sync, selective sync, bandwidth control,
// LAN transfer optimization, and version history management
// ============================================================================

// ============================================================================
// CORE FILE TYPES
// ============================================================================

export interface TransferFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: FileType;
  mimeType: string;
  hash: string;
  createdAt: Date;
  modifiedAt: Date;
  syncStatus: SyncStatus;
  versions: FileVersion[];
  isShared: boolean;
  permissions: FilePermission[];
}

export type FileType = 
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'code'
  | 'spreadsheet'
  | 'presentation'
  | 'other';

export type SyncStatus = 
  | 'synced'
  | 'syncing'
  | 'pending'
  | 'error'
  | 'conflict'
  | 'offline'
  | 'excluded';

export interface FileVersion {
  id: string;
  version: number;
  hash: string;
  size: number;
  createdAt: Date;
  createdBy: string;
  deviceId: string;
  deviceName: string;
  changeType: ChangeType;
  comment?: string;
  isRestored: boolean;
}

export type ChangeType = 'created' | 'modified' | 'renamed' | 'moved' | 'restored';

export interface FilePermission {
  userId: string;
  userName: string;
  email: string;
  accessLevel: AccessLevel;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export type AccessLevel = 'view' | 'comment' | 'edit' | 'admin';

// ============================================================================
// SYNC CONFIGURATION TYPES
// ============================================================================

export interface SyncConfig {
  enabled: boolean;
  mode: SyncMode;
  direction: SyncDirection;
  conflictResolution: ConflictResolution;
  syncRules: SyncRule[];
  excludePatterns: string[];
  includePatterns: string[];
  maxFileSize: number;
  syncOnMeteredConnection: boolean;
  pauseOnBattery: boolean;
  syncInterval: number;
}

export type SyncMode = 'automatic' | 'manual' | 'scheduled';
export type SyncDirection = 'bidirectional' | 'upload-only' | 'download-only';
export type ConflictResolution = 'newest' | 'oldest' | 'largest' | 'smallest' | 'manual' | 'keep-both';

export interface SyncRule {
  id: string;
  name: string;
  pattern: string;
  action: SyncRuleAction;
  priority: number;
  enabled: boolean;
}

export type SyncRuleAction = 'include' | 'exclude' | 'priority' | 'compress';

// ============================================================================
// SELECTIVE SYNC TYPES
// ============================================================================

export type FolderSyncState = 'synced' | 'syncing' | 'pending' | 'error' | 'partial' | 'offline' | 'online-only' | 'local-only' | 'excluded';

export interface SelectiveSyncConfig {
  enabled: boolean;
  mode: SelectiveSyncMode;
  selectedFolders: SelectedFolder[];
  smartFolders: SmartFolder[];
  virtualDrive: VirtualDriveConfig;
  placeholderEnabled: boolean;
  autoDownloadRecent: boolean;
  recentDays: number;
  freeSpaceThreshold: number;
  offlineAccess?: boolean | {
    enabled: boolean;
    maxSize: number;
    priorityFolders: string[];
  };
  excludePatterns?: string[];
}

export type SelectiveSyncMode = 'manual' | 'smart' | 'virtual';

export interface SelectedFolder {
  id: string;
  path: string;
  syncLocally: boolean;
  priority: FolderPriority;
  lastAccessed?: Date;
  sizeLocal: number;
  sizeCloud: number;
}

export type FolderPriority = 'high' | 'normal' | 'low';

export interface SmartFolder {
  id: string;
  name: string;
  rules: SmartFolderRule[];
  action: 'keep-local' | 'cloud-only' | 'auto' | 'online-only' | 'exclude';
  enabled?: boolean;
  priority?: 'high' | 'normal' | 'low' | number;
}

export interface SmartFolderRule {
  field: 'extension' | 'size' | 'age' | 'access' | 'name' | 'modifiedDate';
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'matches' | 'greaterThan' | 'lessThan';
  value: string | number;
}

export interface VirtualDriveConfig {
  enabled: boolean;
  driveLetter?: string;
  mountPoint?: string;
  cacheSize?: number;
  offlineFiles?: string[];
  showPlaceholders?: boolean;
}

// ============================================================================
// BANDWIDTH CONTROL TYPES
// ============================================================================

export interface BandwidthConfig {
  enabled: boolean;
  uploadLimit: number;
  downloadLimit: number;
  schedules: BandwidthSchedule[];
  priorityRules: BandwidthPriorityRule[];
  throttleOnNetwork: NetworkCondition[];
  adaptiveBandwidth: boolean;
  reserveForOther: number;
  pauseOnBattery?: boolean;
  pauseOnMetered?: boolean;
  pauseOnMeteredConnection?: boolean;
  throttleBackground?: boolean;
}

export interface BandwidthSchedule {
  id: string;
  name: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  uploadLimit: number;
  downloadLimit: number;
  enabled: boolean;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | string;

export interface BandwidthPriorityRule {
  id: string;
  name?: string;
  pattern: string;
  priority: TransferPriority;
  maxBandwidth?: number;
}

export type TransferPriority = 'critical' | 'high' | 'normal' | 'low' | 'lowest' | 'background';

export interface NetworkCondition {
  type: NetworkType;
  maxUpload: number;
  maxDownload: number;
}

export type NetworkType = 'ethernet' | 'wifi' | 'cellular' | 'metered' | 'vpn';

// ============================================================================
// LAN TRANSFER TYPES
// ============================================================================

export interface LANConfig {
  enabled: boolean;
  discoveryEnabled?: boolean;
  directTransferEnabled?: boolean;
  fallbackToCloud?: boolean;
  encryptLANTransfers?: boolean;
  maxConcurrentTransfers?: number;
  port?: number;
  transferPort?: number;
  multicastGroup?: string;
  trustedDevices?: TrustedDevice[];
  requireApproval?: boolean;
  autoDiscovery?: boolean;
  encryption?: boolean | string;
  discoveryPort?: number;
}

export interface TrustedDevice {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  macAddress?: string;
  lastSeen: Date;
  isTrusted: boolean;
  autoAccept: boolean;
  transferStats: DeviceTransferStats;
}

export interface DeviceTransferStats {
  totalTransfers?: number;
  totalBytes?: number;
  avgSpeed?: number;
  averageSpeed?: number;
  lastTransfer?: Date;
  totalSent?: number;
  totalReceived?: number;
  transferCount?: number;
}

export interface LANTransfer {
  id: string;
  sourceDevice: string;
  targetDevice: string;
  files: TransferFile[];
  status: TransferStatus;
  progress: TransferProgress;
  startedAt: Date;
  completedAt?: Date;
  speed: number;
  isLANDirect: boolean;
}

export type TransferStatus = 
  | 'pending'
  | 'connecting'
  | 'transferring'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export interface TransferProgress {
  bytesTransferred: number;
  totalBytes: number;
  filesCompleted: number;
  totalFiles: number;
  currentFile: string;
  speed: number;
  estimatedTimeRemaining: number;
}

// ============================================================================
// VERSION HISTORY TYPES
// ============================================================================

export interface VersionHistoryConfig {
  enabled: boolean;
  retentionDays?: number;
  maxVersionsPerFile?: number;
  maxVersions?: number;
  autoCleanup?: boolean;
  includeDeleted?: boolean;
  excludePatterns?: string[];
  includePatterns?: string[];
  compressionEnabled?: boolean;
  deduplicationEnabled?: boolean;
}

export interface VersionHistoryEntry {
  id: string;
  fileId?: string;
  fileName?: string;
  filePath?: string;
  version?: number;
  versionNumber?: number;
  size?: number;
  hash?: string;
  createdAt?: Date;
  createdBy?: string;
  modifiedBy?: string;
  deviceId?: string;
  deviceName?: string;
  changeType?: ChangeType;
  changeSummary?: string;
  changeDescription?: string;
  isDeleted?: boolean;
  isAutoSave?: boolean;
  canRestore?: boolean;
  retainUntil?: Date;
}

export interface VersionComparison {
  versionA: VersionHistoryEntry;
  versionB: VersionHistoryEntry;
  differences: FileDifference[];
  similarity: number;
}

export interface FileDifference {
  type: 'added' | 'removed' | 'modified';
  location: string;
  oldValue?: string;
  newValue?: string;
}

// ============================================================================
// P2P SYNC TYPES
// ============================================================================

export interface P2PSyncConfig {
  enabled: boolean;
  maxPeers: number;
  dhtEnabled: boolean;
  relayServers: string[];
  encryption: P2PEncryption;
  peerDiscovery: PeerDiscovery;
  shareableLinks: ShareableLinkConfig;
}

export type P2PEncryption = 'none' | 'tls' | 'e2e';

export interface PeerDiscovery {
  mdns: boolean;
  dht: boolean;
  tracker: boolean;
  manual: boolean;
}

export interface ShareableLinkConfig {
  enabled: boolean;
  defaultExpiry: number;
  passwordProtection: boolean;
  downloadLimit?: number;
  requireAuth: boolean;
}

export interface P2PPeer {
  id: string;
  name: string;
  publicKey: string;
  addresses: string[];
  isOnline: boolean;
  lastSeen: Date;
  sharedFolders: string[];
  bandwidth: {
    upload: number;
    download: number;
  };
}

export interface ShareableLink {
  id: string;
  fileId: string;
  fileName: string;
  url: string;
  shortUrl?: string;
  password?: string;
  expiresAt?: Date;
  downloadCount: number;
  downloadLimit?: number;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

// ============================================================================
// TRANSFER QUEUE TYPES
// ============================================================================

export interface TransferQueue {
  uploads: QueuedTransfer[];
  downloads: QueuedTransfer[];
  completed: CompletedTransfer[];
  failed: FailedTransfer[];
}

export interface QueuedTransfer {
  id: string;
  file: TransferFile;
  direction: 'upload' | 'download';
  priority: TransferPriority;
  status: TransferStatus;
  progress: TransferProgress;
  addedAt: Date;
  startedAt?: Date;
  pausedAt?: Date;
  retryCount: number;
  error?: string;
}

export interface CompletedTransfer extends QueuedTransfer {
  completedAt: Date;
  duration: number;
  avgSpeed: number;
  verified: boolean;
}

export interface FailedTransfer extends QueuedTransfer {
  failedAt: Date;
  errorCode: string;
  errorMessage: string;
  canRetry: boolean;
}

// ============================================================================
// STORAGE ANALYTICS TYPES
// ============================================================================

export interface StorageAnalytics {
  totalSpace: number;
  usedSpace: number;
  freeSpace: number;
  cloudUsed: number;
  localUsed: number;
  byCategory: CategoryStorage[];
  byFolder: FolderStorage[];
  byFileType: FileTypeStorage[];
  duplicates: DuplicateGroup[];
  largeFiles: TransferFile[];
  oldFiles: TransferFile[];
}

export interface CategoryStorage {
  category: FileType;
  size: number;
  count: number;
  percentage: number;
}

export interface FolderStorage {
  path: string;
  size: number;
  count: number;
  syncStatus: SyncStatus;
}

export interface FileTypeStorage {
  extension: string;
  mimeType: string;
  size: number;
  count: number;
}

export interface DuplicateGroup {
  hash: string;
  files: TransferFile[];
  wastedSpace: number;
}
