/**
 * CUBE Mail - Type Definitions
 * 
 * Complete type system for the CUBE Mail email client.
 * Designed to compete with Gmail, Outlook, ProtonMail, and HEY.
 * 
 * @version 1.0.0
 * @author CUBE AI Tools Team
 */

// ============================================================================
// EMAIL TYPES
// ============================================================================

export interface Email {
  id: string;
  messageId: string;
  threadId: string;
  accountId: string;
  
  // Headers
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  
  subject: string;
  snippet: string;
  
  // Body
  bodyText?: string;
  bodyHtml?: string;
  
  // Metadata
  date: Date;
  receivedAt: Date;
  size: number;
  
  // Status
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isSpam: boolean;
  isTrash: boolean;
  isDraft: boolean;
  
  // Labels/Folders
  labels: string[];
  folder: MailFolder;
  
  // Attachments
  attachments: Attachment[];
  hasAttachments: boolean;
  
  // Security
  encryption: EncryptionStatus;
  spfStatus?: AuthenticationStatus;
  dkimStatus?: AuthenticationStatus;
  dmarcStatus?: AuthenticationStatus;
  
  // AI Features
  category?: EmailCategory;
  importance?: ImportanceLevel;
  aiSummary?: string;
  
  // Screener (HEY-inspired)
  screenerStatus?: ScreenerStatus;
}

export interface EmailAddress {
  name?: string;
  email: string;
  avatar?: string;
  isContact?: boolean;
  isVerified?: boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  contentId?: string;
  isInline: boolean;
  downloadUrl?: string;
  previewUrl?: string;
  encrypted: boolean;
}

export interface EncryptionStatus {
  isEncrypted: boolean;
  algorithm?: EncryptionAlgorithm;
  keyId?: string;
  verificationStatus?: VerificationStatus;
}

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

export interface MailAccount {
  id: string;
  email: string;
  name: string;
  provider: MailProvider;
  
  // Connection
  imapConfig: IMAPConfig;
  smtpConfig: SMTPConfig;
  
  // Status
  isActive: boolean;
  isPrimary: boolean;
  lastSync: Date;
  syncStatus: SyncStatus;
  
  // Quotas
  storageUsed: number;
  storageLimit: number;
  
  // Settings
  signature?: string;
  signatureHtml?: string;
  defaultFrom?: EmailAddress;
  aliases: string[];
  
  // Security
  encryptionEnabled: boolean;
  publicKey?: string;
}

export interface IMAPConfig {
  host: string;
  port: number;
  security: ConnectionSecurity;
  username: string;
  password?: string;
  oauthProvider?: OAuthProvider;
  oauthToken?: string;
}

export interface SMTPConfig {
  host: string;
  port: number;
  security: ConnectionSecurity;
  username: string;
  password?: string;
  oauthProvider?: OAuthProvider;
  oauthToken?: string;
}

export interface MailAccountConfig {
  email: string;
  name: string;
  provider: MailProvider;
  imap: IMAPConfig;
  smtp: SMTPConfig;
}

// ============================================================================
// COMPOSE TYPES
// ============================================================================

export interface ComposeDraft {
  id?: string;
  accountId: string;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  body: string;
  bodyFormat: BodyFormat;
  attachments: AttachmentUpload[];
  replyTo?: string;
  inReplyTo?: string;
  references?: string[];
  encryption: EncryptionConfig;
  scheduleSend?: Date;
  signature?: string;
  importance?: ImportanceLevel;
  readReceipt?: boolean;
  deliveryReceipt?: boolean;
}

export interface AttachmentUpload {
  file: File;
  id: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm?: EncryptionAlgorithm;
  recipientKeys?: string[];
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface MailSearchQuery {
  text?: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  isRead?: boolean;
  isStarred?: boolean;
  isUnread?: boolean;
  folder?: MailFolder;
  labels?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  category?: EmailCategory;
  sizeMin?: number;
  sizeMax?: number;
  hasEncryption?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

export interface MailSearchResult {
  emails: Email[];
  total: number;
  hasMore: boolean;
  query: MailSearchQuery;
  executionTime: number;
  facets?: SearchFacets;
}

export interface SearchFacets {
  folders: FacetItem[];
  senders: FacetItem[];
  dates: FacetItem[];
  labels: FacetItem[];
  categories: FacetItem[];
}

export interface FacetItem {
  value: string;
  count: number;
  label?: string;
}

// ============================================================================
// FILTER/RULES TYPES
// ============================================================================

export interface MailFilter {
  id: string;
  name: string;
  enabled: boolean;
  conditions: FilterCondition[];
  matchType: MatchType;
  actions: FilterAction[];
  stopProcessing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterCondition {
  field: FilterField;
  operator: FilterOperator;
  value: string;
  caseSensitive: boolean;
}

export interface FilterAction {
  type: FilterActionType;
  value?: string;
}

// ============================================================================
// SCREENER TYPES (HEY-inspired)
// ============================================================================

export interface ScreenerConfig {
  enabled: boolean;
  newSendersToScreener: boolean;
  approvedSenders: string[];
  blockedSenders: string[];
  autoApprove: AutoApproveConfig;
}

export interface AutoApproveConfig {
  contacts: boolean;
  previouslyReplied: boolean;
  sameOrganization: boolean;
  trustedDomains: string[];
}

export interface ScreenerDecision {
  senderId: string;
  senderEmail: string;
  decision: 'approve' | 'block';
  reason?: string;
  decidedAt: Date;
}

// ============================================================================
// SYNC TYPES
// ============================================================================

export interface SyncReport {
  accountId: string;
  startedAt: Date;
  completedAt: Date;
  status: SyncStatus;
  folders: FolderSyncReport[];
  newEmails: number;
  updatedEmails: number;
  deletedEmails: number;
  errors: SyncError[];
}

export interface FolderSyncReport {
  folder: string;
  messagesChecked: number;
  newMessages: number;
  updatedMessages: number;
  deletedMessages: number;
}

export interface SyncError {
  folder?: string;
  messageId?: string;
  error: string;
  timestamp: Date;
}

// ============================================================================
// LABEL TYPES
// ============================================================================

export interface MailLabel {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isSystem: boolean;
  parentId?: string;
  messageCount: number;
  unreadCount: number;
}

// ============================================================================
// THREAD TYPES
// ============================================================================

export interface EmailThread {
  id: string;
  subject: string;
  participants: EmailAddress[];
  messages: Email[];
  messageCount: number;
  unreadCount: number;
  lastMessageDate: Date;
  snippet: string;
  labels: string[];
  isStarred: boolean;
  hasAttachments: boolean;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface MailNotification {
  id: string;
  type: NotificationType;
  email?: Email;
  title: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  action?: NotificationAction;
}

export interface NotificationAction {
  type: 'open' | 'reply' | 'archive' | 'delete';
  emailId?: string;
  threadId?: string;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface MailSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  shortcuts: ShortcutSettings;
}

export interface GeneralSettings {
  defaultAccount: string;
  conversationView: boolean;
  previewPane: PreviewPanePosition;
  pageSize: number;
  autoAdvance: AutoAdvanceOption;
  undoSendDelay: number;
  defaultReplyBehavior: ReplyBehavior;
}

export interface AppearanceSettings {
  theme: ThemeOption;
  density: DensityOption;
  fontSize: FontSizeOption;
  showAvatars: boolean;
  showSnippets: boolean;
  showAttachmentPreviews: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  badge: boolean;
  vipOnly: boolean;
  quietHours: QuietHoursConfig;
}

export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: number[];
}

export interface PrivacySettings {
  blockTrackingPixels: boolean;
  sanitizeLinks: boolean;
  loadRemoteImages: 'always' | 'ask' | 'never';
  autoEncrypt: boolean;
  showEncryptionStatus: boolean;
}

export interface ShortcutSettings {
  enabled: boolean;
  customShortcuts: Record<string, string>;
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type MailProvider = 
  | 'gmail' 
  | 'outlook' 
  | 'yahoo' 
  | 'icloud' 
  | 'protonmail'
  | 'tutanota'
  | 'cube-mail'
  | 'custom';

export type MailFolder = 
  | 'inbox'
  | 'sent'
  | 'drafts'
  | 'archive'
  | 'spam'
  | 'trash'
  | 'important'
  | 'starred'
  | 'all'
  | 'screener'
  | string;

export type EmailCategory =
  | 'important'
  | 'personal'
  | 'newsletters'
  | 'receipts'
  | 'notifications'
  | 'social'
  | 'promotions'
  | 'updates'
  | 'forums';

export type ImportanceLevel = 'high' | 'normal' | 'low';

export type ScreenerStatus = 'pending' | 'approved' | 'blocked';

export type AuthenticationStatus = 'pass' | 'fail' | 'neutral' | 'none';

export type EncryptionAlgorithm = 
  | 'aes-256-gcm'
  | 'chacha20-poly1305'
  | 'x25519-kyber';

export type VerificationStatus = 'verified' | 'unverified' | 'failed';

export type ConnectionSecurity = 'SSL' | 'STARTTLS' | 'NONE';

export type OAuthProvider = 'google' | 'microsoft' | 'yahoo' | 'apple';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline' | 'paused';

export type BodyFormat = 'text' | 'html' | 'markdown';

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'error';

export type FilterField = 
  | 'from' 
  | 'to' 
  | 'subject' 
  | 'body' 
  | 'hasAttachment'
  | 'size'
  | 'date';

export type FilterOperator = 
  | 'contains' 
  | 'notContains'
  | 'equals' 
  | 'notEquals'
  | 'startsWith' 
  | 'endsWith' 
  | 'regex'
  | 'greaterThan'
  | 'lessThan';

export type FilterActionType = 
  | 'label' 
  | 'folder' 
  | 'archive' 
  | 'delete' 
  | 'star' 
  | 'markRead'
  | 'markImportant'
  | 'forward'
  | 'neverSpam';

export type MatchType = 'all' | 'any';

export type SortField = 'date' | 'from' | 'subject' | 'size' | 'relevance';

export type SortOrder = 'asc' | 'desc';

export type NotificationType = 
  | 'new-email' 
  | 'reply' 
  | 'mention'
  | 'calendar'
  | 'security';

export type PreviewPanePosition = 'right' | 'bottom' | 'off';

export type AutoAdvanceOption = 'next' | 'previous' | 'list';

export type ReplyBehavior = 'reply' | 'replyAll';

export type ThemeOption = 'light' | 'dark' | 'system';

export type DensityOption = 'comfortable' | 'cozy' | 'compact';

export type FontSizeOption = 'small' | 'medium' | 'large';

// ============================================================================
// PROVIDER CONFIGS
// ============================================================================

export const MAIL_PROVIDER_CONFIGS: Record<MailProvider, {
  name: string;
  imap: Partial<IMAPConfig>;
  smtp: Partial<SMTPConfig>;
  oauth?: OAuthProvider;
}> = {
  gmail: {
    name: 'Gmail',
    imap: { host: 'imap.gmail.com', port: 993, security: 'SSL' },
    smtp: { host: 'smtp.gmail.com', port: 465, security: 'SSL' },
    oauth: 'google',
  },
  outlook: {
    name: 'Outlook',
    imap: { host: 'outlook.office365.com', port: 993, security: 'SSL' },
    smtp: { host: 'smtp.office365.com', port: 587, security: 'STARTTLS' },
    oauth: 'microsoft',
  },
  yahoo: {
    name: 'Yahoo Mail',
    imap: { host: 'imap.mail.yahoo.com', port: 993, security: 'SSL' },
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, security: 'SSL' },
    oauth: 'yahoo',
  },
  icloud: {
    name: 'iCloud Mail',
    imap: { host: 'imap.mail.me.com', port: 993, security: 'SSL' },
    smtp: { host: 'smtp.mail.me.com', port: 587, security: 'STARTTLS' },
    oauth: 'apple',
  },
  protonmail: {
    name: 'ProtonMail',
    imap: { host: 'imap.protonmail.ch', port: 993, security: 'SSL' },
    smtp: { host: 'smtp.protonmail.ch', port: 465, security: 'SSL' },
  },
  tutanota: {
    name: 'Tutanota',
    imap: { host: '', port: 0, security: 'NONE' }, // No IMAP
    smtp: { host: '', port: 0, security: 'NONE' }, // No SMTP
  },
  'cube-mail': {
    name: 'CUBE Mail',
    imap: { host: 'imap.cubeai.tools', port: 993, security: 'SSL' },
    smtp: { host: 'smtp.cubeai.tools', port: 465, security: 'SSL' },
  },
  custom: {
    name: 'Custom',
    imap: {},
    smtp: {},
  },
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_MAIL_SETTINGS: MailSettings = {
  general: {
    defaultAccount: '',
    conversationView: true,
    previewPane: 'right',
    pageSize: 50,
    autoAdvance: 'next',
    undoSendDelay: 5,
    defaultReplyBehavior: 'reply',
  },
  appearance: {
    theme: 'system',
    density: 'comfortable',
    fontSize: 'medium',
    showAvatars: true,
    showSnippets: true,
    showAttachmentPreviews: true,
  },
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
    badge: true,
    vipOnly: false,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
      days: [0, 1, 2, 3, 4, 5, 6],
    },
  },
  privacy: {
    blockTrackingPixels: true,
    sanitizeLinks: true,
    loadRemoteImages: 'ask',
    autoEncrypt: false,
    showEncryptionStatus: true,
  },
  shortcuts: {
    enabled: true,
    customShortcuts: {},
  },
};

export const DEFAULT_SCREENER_CONFIG: ScreenerConfig = {
  enabled: true,
  newSendersToScreener: true,
  approvedSenders: [],
  blockedSenders: [],
  autoApprove: {
    contacts: true,
    previouslyReplied: true,
    sameOrganization: true,
    trustedDomains: [],
  },
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type EmailListItem = Pick<Email, 
  | 'id' 
  | 'from' 
  | 'subject' 
  | 'snippet' 
  | 'date' 
  | 'isRead' 
  | 'isStarred' 
  | 'hasAttachments'
  | 'labels'
  | 'category'
  | 'encryption'
>;

export type ComposeMode = 'new' | 'reply' | 'replyAll' | 'forward' | 'draft';

export interface ComposeContext {
  mode: ComposeMode;
  originalEmail?: Email;
  thread?: EmailThread;
}
