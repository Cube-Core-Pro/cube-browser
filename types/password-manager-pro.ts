/**
 * Password Manager Pro Type Definitions
 * 
 * Advanced types for enterprise-grade password management including:
 * - Passkey/FIDO2/WebAuthn support
 * - Vault Health Reports
 * - Secure Send (password-protected sharing)
 * - SSH Key Management
 * - Watchtower Dashboard
 * - Dark Web Monitoring
 * - Username Generator
 * - CLI Access
 * - Family Vaults
 */

// ============================================================================
// PASSKEY/FIDO2/WEBAUTHN TYPES
// ============================================================================

export type PasskeyAlgorithm = 'ES256' | 'RS256' | 'Ed25519';
export type PasskeyTransport = 'usb' | 'nfc' | 'ble' | 'internal' | 'hybrid';
export type PasskeyAttachment = 'platform' | 'cross-platform';
export type PasskeyVerification = 'required' | 'preferred' | 'discouraged';

export interface PasskeyCredential {
  id: string;
  credentialId: string;
  publicKey: string;
  algorithm: PasskeyAlgorithm;
  counter: number;
  transports: PasskeyTransport[];
  attachment: PasskeyAttachment;
  userVerification: PasskeyVerification;
  displayName: string;
  createdAt: Date;
  lastUsedAt: Date;
  origin: string;
  rpId: string;
  rpName: string;
  userId: string;
  aaguid: string;
  deviceInfo: {
    name: string;
    platform: string;
    browser: string;
  };
  isBackupEligible: boolean;
  isBackedUp: boolean;
  attestation?: {
    format: string;
    statement: Record<string, unknown>;
  };
}

export interface PasskeyRegistrationOptions {
  rpName: string;
  rpId: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  challenge: string;
  timeout?: number;
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise';
  authenticatorSelection?: {
    authenticatorAttachment?: PasskeyAttachment;
    residentKey?: 'required' | 'preferred' | 'discouraged';
    userVerification?: PasskeyVerification;
  };
  excludeCredentials?: Array<{
    id: string;
    type: 'public-key';
    transports?: PasskeyTransport[];
  }>;
  extensions?: {
    credProps?: boolean;
    largeBlob?: { support: 'required' | 'preferred' };
    minPinLength?: boolean;
  };
}

export interface PasskeyAuthenticationOptions {
  rpId: string;
  challenge: string;
  timeout?: number;
  userVerification?: PasskeyVerification;
  allowCredentials?: Array<{
    id: string;
    type: 'public-key';
    transports?: PasskeyTransport[];
  }>;
  extensions?: {
    appid?: string;
    largeBlob?: { read: boolean } | { write: Uint8Array };
  };
}

export interface PasskeyManager {
  credentials: PasskeyCredential[];
  isSupported: boolean;
  platformAuthenticatorAvailable: boolean;
  conditionalMediationAvailable: boolean;
  lastSync: Date;
}

// ============================================================================
// VAULT HEALTH REPORT TYPES
// ============================================================================

export type HealthIssueType = 
  | 'weak_password'
  | 'reused_password'
  | 'compromised_password'
  | 'old_password'
  | 'missing_2fa'
  | 'insecure_website'
  | 'expired_card'
  | 'empty_field'
  | 'duplicate_entry'
  | 'inactive_account'
  | 'unsecure_storage'
  | 'weak_master_password';

export type HealthIssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface VaultHealthIssue {
  id: string;
  type: HealthIssueType;
  severity: HealthIssueSeverity;
  itemId: string;
  itemTitle: string;
  itemType: 'login' | 'credit_card' | 'identity' | 'secure_note' | 'ssh_key';
  description: string;
  recommendation: string;
  affectedField?: string;
  currentValue?: string;
  suggestedValue?: string;
  detectedAt: Date;
  isResolved: boolean;
  resolvedAt?: Date;
  autoFixAvailable: boolean;
}

export interface VaultHealthCategory {
  name: string;
  score: number;
  maxScore: number;
  issues: VaultHealthIssue[];
  tips: string[];
}

export interface VaultHealthReport {
  id: string;
  generatedAt: Date;
  overallScore: number;
  previousScore?: number;
  trend: 'improving' | 'stable' | 'declining';
  categories: {
    passwordStrength: VaultHealthCategory;
    passwordReuse: VaultHealthCategory;
    compromisedCredentials: VaultHealthCategory;
    twoFactorAuth: VaultHealthCategory;
    passwordAge: VaultHealthCategory;
    websiteSecurity: VaultHealthCategory;
  };
  totalItems: number;
  itemsAnalyzed: number;
  issuesByPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  suggestedActions: Array<{
    priority: number;
    action: string;
    impact: string;
    affectedItems: number;
  }>;
  exportFormats: ('pdf' | 'csv' | 'json')[];
}

// ============================================================================
// SECURE SEND TYPES
// ============================================================================

export type SecureSendType = 'text' | 'password' | 'file' | 'login' | 'card' | 'note';
export type SecureSendExpiry = '1h' | '4h' | '12h' | '24h' | '3d' | '7d' | '30d';

export interface SecureSendItem {
  id: string;
  type: SecureSendType;
  name: string;
  content: {
    text?: string;
    password?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileMimeType?: string;
    login?: {
      username: string;
      password: string;
      url?: string;
      notes?: string;
    };
    card?: {
      number: string;
      expiry: string;
      cvv: string;
      holder: string;
    };
    note?: {
      title: string;
      content: string;
    };
  };
  encrypted: boolean;
  encryptionAlgorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
}

export interface SecureSendOptions {
  accessPassword?: string;
  maxAccessCount?: number;
  expiresAt: Date;
  expiryType: SecureSendExpiry;
  notifyOnAccess: boolean;
  notifyEmail?: string;
  requireEmail: boolean;
  hideEmail: boolean;
  allowSave: boolean;
  deletionPolicy: 'on_expiry' | 'on_access' | 'manual';
  notes?: string;
}

export interface SecureSendLink {
  id: string;
  shortId: string;
  url: string;
  qrCode: string;
  item: SecureSendItem;
  options: SecureSendOptions;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  maxAccessCount?: number;
  lastAccessedAt?: Date;
  accessLog: Array<{
    timestamp: Date;
    ip: string;
    location?: string;
    userAgent: string;
    email?: string;
    success: boolean;
    failReason?: string;
  }>;
  status: 'active' | 'expired' | 'deleted' | 'accessed';
  creatorId: string;
}

// ============================================================================
// SSH KEY MANAGEMENT TYPES
// ============================================================================

export type SSHKeyType = 'rsa' | 'ed25519' | 'ecdsa' | 'dsa';
export type SSHKeyBits = 1024 | 2048 | 3072 | 4096;

export interface SSHKey {
  id: string;
  name: string;
  type: SSHKeyType;
  bits?: SSHKeyBits;
  privateKey: string;
  publicKey: string;
  fingerprint: string;
  comment?: string;
  passphrase?: string;
  hasPassphrase: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
  tags: string[];
  associatedHosts: SSHHost[];
  certType?: 'user' | 'host';
  validPrincipals?: string[];
  validAfter?: Date;
  validBefore?: Date;
  certSignature?: string;
}

export interface SSHHost {
  id: string;
  hostname: string;
  port: number;
  username: string;
  keyId: string;
  alias?: string;
  jumpHost?: string;
  proxyCommand?: string;
  identityFile?: string;
  forwardAgent: boolean;
  compression: boolean;
  keepAlive: boolean;
  serverAliveInterval: number;
  connectTimeout: number;
  customOptions: Record<string, string>;
  lastConnected?: Date;
  connectionCount: number;
  tags: string[];
  notes?: string;
}

export interface SSHAgent {
  isRunning: boolean;
  socketPath: string;
  loadedKeys: Array<{
    fingerprint: string;
    comment: string;
    type: SSHKeyType;
    addedAt: Date;
    lifetime?: number;
  }>;
  confirmedIdentities: string[];
}

export interface SSHKeyGenerationOptions {
  type: SSHKeyType;
  bits?: SSHKeyBits;
  comment?: string;
  passphrase?: string;
  certType?: 'user' | 'host';
  principals?: string[];
  validity?: {
    from?: Date;
    to?: Date;
  };
}

// ============================================================================
// WATCHTOWER DASHBOARD TYPES
// ============================================================================

export type WatchtowerAlertType = 
  | 'breach_detected'
  | 'password_leaked'
  | 'service_compromised'
  | 'weak_password'
  | 'reused_password'
  | 'expiring_item'
  | 'insecure_site'
  | 'inactive_2fa'
  | 'suspicious_activity'
  | 'policy_violation';

export type WatchtowerAlertPriority = 'critical' | 'high' | 'medium' | 'low';

export interface WatchtowerAlert {
  id: string;
  type: WatchtowerAlertType;
  priority: WatchtowerAlertPriority;
  title: string;
  description: string;
  affectedItems: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  source: string;
  detectedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  status: 'new' | 'acknowledged' | 'resolved' | 'ignored';
  actions: Array<{
    label: string;
    action: string;
    primary: boolean;
  }>;
  metadata: {
    breachDate?: Date;
    breachSource?: string;
    dataTypes?: string[];
    affectedUsers?: number;
    severity?: string;
  };
}

export interface WatchtowerStats {
  totalAlerts: number;
  unresolvedAlerts: number;
  criticalAlerts: number;
  breachesDetected: number;
  vulnerablePasswords: number;
  reusedPasswords: number;
  weakPasswords: number;
  expiringSoon: number;
  missingTwoFactor: number;
  insecureSites: number;
  lastScanAt: Date;
  scanFrequency: 'hourly' | 'daily' | 'weekly';
  nextScanAt: Date;
  protectedAccounts: number;
  monitoredDomains: string[];
}

export interface WatchtowerDashboard {
  stats: WatchtowerStats;
  alerts: WatchtowerAlert[];
  recentBreaches: Array<{
    id: string;
    name: string;
    domain: string;
    breachDate: Date;
    reportedAt: Date;
    dataTypes: string[];
    affectedAccounts: number;
    description: string;
    logo?: string;
    isResolved: boolean;
  }>;
  timeline: Array<{
    date: Date;
    type: string;
    description: string;
    severity: WatchtowerAlertPriority;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: number;
    impact: 'high' | 'medium' | 'low';
    effort: 'easy' | 'medium' | 'hard';
  }>;
}

// ============================================================================
// DARK WEB MONITORING TYPES
// ============================================================================

export type DarkWebDataType = 
  | 'email'
  | 'password'
  | 'username'
  | 'phone'
  | 'address'
  | 'ssn'
  | 'credit_card'
  | 'bank_account'
  | 'passport'
  | 'driver_license'
  | 'medical_record'
  | 'ip_address'
  | 'email_password'
  | 'financial'
  | 'identity';

export interface DarkWebMonitoredItem {
  id: string;
  type: DarkWebDataType;
  value: string;
  maskedValue: string;
  isVerified: boolean;
  verifiedAt?: Date;
  addedAt: Date;
  lastChecked: Date;
  status: 'safe' | 'exposed' | 'breached' | 'unknown';
  exposureCount: number;
  alertsEnabled: boolean;
}

export interface DarkWebExposure {
  id: string;
  monitoredItemId: string;
  source: string;
  discoveredAt: Date;
  breachDate?: Date;
  detectedAt?: Date;
  dataTypes: DarkWebDataType[];
  exposedData: {
    type: DarkWebDataType;
    value: string;
    isHashedOrPartial: boolean;
  }[];
  data?: string | Record<string, string>;
  type?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  actionsTaken: string[];
  recommendedActions: string[];
  recommendations?: string[];
  status: 'new' | 'reviewed' | 'resolved' | 'ignored' | 'acknowledged';
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  affectedMonitoredItems?: string[];
  marketplaceInfo?: {
    name: string;
    price?: string;
    lastSeen?: Date;
    listingCount?: number;
  };
}

// Type aliases for dark web monitoring
export type DarkWebExposureType = DarkWebDataType;
export type MonitoredItemType = 'email' | 'phone' | 'ssn' | 'passport' | 'drivers_license' | 'credit_card' | 'bank_account';

export interface MonitoredItem {
  id: string;
  type: MonitoredItemType;
  value: string;
  maskedValue?: string;
  status?: 'active' | 'inactive' | 'compromised' | 'resolved';
  addedAt?: Date;
  lastCheckedAt?: Date;
  exposureCount?: number;
  lastExposureAt?: Date;
}

export interface DarkWebMonitor {
  isActive: boolean;
  monitoredItems: DarkWebMonitoredItem[];
  exposures: DarkWebExposure[];
  scanFrequency: 'realtime' | 'daily' | 'weekly';
  lastScan: Date;
  nextScan: Date;
  totalExposures: number;
  resolvedExposures: number;
  alertPreferences: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    sms: boolean;
  };
  coverage: {
    forums: number;
    marketplaces: number;
    pasteSites: number;
    socialMedia: number;
    databases: number;
  };
}

// ============================================================================
// USERNAME GENERATOR TYPES
// ============================================================================

export type UsernameStyle = 
  | 'random'
  | 'memorable'
  | 'adjective_noun'
  | 'word_number'
  | 'initials'
  | 'email_prefix'
  | 'catchall'
  | 'subaddress'
  | 'anonymous'
  | 'professional'
  | 'random_words'
  | 'alphanumeric'
  | 'gamer_tag';

export interface UsernameGeneratorOptions {
  style: UsernameStyle;
  length?: {
    min: number;
    max: number;
  };
  includeNumbers: boolean;
  includeSpecialChars: boolean;
  capitalize: boolean;
  separator?: '-' | '_' | '.' | '';
  prefix?: string;
  suffix?: string;
  excludeWords?: string[];
  wordLists?: string[];
  emailDomain?: string;
  catchallDomain?: string;
  subaddressBase?: string;
  customPattern?: string;
}

export interface GeneratedUsername {
  id: string;
  username: string;
  style: UsernameStyle;
  generatedAt: Date;
  usedAt?: Date;
  associatedItem?: {
    id: string;
    title: string;
    type: string;
  };
  emailAlias?: string;
  isFavorite: boolean;
}

export interface UsernameGenerator {
  options: UsernameGeneratorOptions;
  history: GeneratedUsername[];
  favorites: GeneratedUsername[];
  emailAliases: Array<{
    alias: string;
    domain: string;
    forwardTo: string;
    isActive: boolean;
    createdAt: Date;
    messagesReceived: number;
  }>;
  customWordLists: Array<{
    id: string;
    name: string;
    words: string[];
    category: string;
  }>;
}

// ============================================================================
// CLI ACCESS TYPES
// ============================================================================

export type CLICommandType = 
  | 'login'
  | 'logout'
  | 'sync'
  | 'list'
  | 'get'
  | 'create'
  | 'edit'
  | 'delete'
  | 'generate'
  | 'share'
  | 'export'
  | 'import'
  | 'config'
  | 'status'
  | 'unlock'
  | 'lock'
  | 'read'
  | 'write';

export interface CLICommand {
  id: string;
  command: string;
  timestamp: Date;
  success: boolean;
  output?: string;
  error?: string;
}

export interface CLISession {
  id: string;
  name?: string;
  startedAt?: Date;
  expiresAt?: Date;
  device?: string;
  deviceType?: 'desktop' | 'mobile' | 'server' | 'other';
  deviceName?: string;
  ipAddress: string;
  location?: string;
  isActive?: boolean;
  status?: 'active' | 'idle' | 'expired';
  permissions?: CLICommandType[];
  lastActivity?: Date;
  lastActiveAt?: Date;
  createdAt?: Date;
  commandCount: number;
}

export interface CLIConfig {
  sessionTimeout: number;
  outputFormat: 'json' | 'yaml' | 'table' | 'plain';
  colorOutput: boolean;
  verbose: boolean;
  confirmDestructive: boolean;
  defaultVault?: string;
  clipboardTimeout: number;
  shell: string;
  aliasPrefix: string;
  customAliases: Record<string, string>;
  envVarPrefix: string;
  enableBiometric: boolean;
  enableAutoComplete: boolean;
}

export interface CLICommandLog {
  id: string;
  timestamp: Date;
  command: CLICommandType | string;
  args?: string[];
  success: boolean;
  output?: string;
  error?: string;
  duration?: number;
  sessionId?: string;
}

export interface CLIAccess {
  isEnabled: boolean;
  sessions: CLISession[];
  config: CLIConfig;
  commandHistory: CLICommandLog[];
  apiToken?: {
    token: string;
    createdAt: Date;
    expiresAt?: Date;
    scopes: CLICommandType[] | string[];
    lastUsed?: Date;
  };
  tokens?: APIToken[];
  installationGuide: {
    platform: 'windows' | 'macos' | 'linux';
    packageManager: string;
    installCommand: string;
    configPath: string;
  };
}

export interface APIToken {
  id: string;
  name: string;
  token: string;
  permissions: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  usageCount: number;
  isActive: boolean;
}

// ============================================================================
// FAMILY VAULT TYPES
// ============================================================================

export type FamilyRole = 'owner' | 'admin' | 'member' | 'child' | 'limited';
export type FamilyPermission = 
  | 'view'
  | 'edit'
  | 'delete'
  | 'share'
  | 'invite'
  | 'manage_members'
  | 'manage_billing'
  | 'export'
  | 'admin';

export interface FamilyMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  role: FamilyRole;
  permissions?: FamilyPermission[];
  joinedAt: Date;
  lastActiveAt: Date;
  invitedBy?: string;
  status: 'active' | 'pending' | 'suspended' | 'removed';
  personalVaultItems?: number;
  sharedVaultItems?: number;
  storageUsed?: number;
  twoFactorEnabled?: boolean;
  emergencyAccessGranted?: string[];
  emergencyAccessReceived?: string[];
  recoveryKeyGenerated?: boolean;
  securityScore?: number;
  itemsOwned?: number;
  itemsShared?: number;
}

export interface FamilyVault {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  ownerId: string;
  members: FamilyMember[];
  maxMembers: number;
  currentMembers?: number;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  sharedItems?: number;
  storageUsed?: number;
  features?: string[];
  storageLimit?: number;
  categories: string[];
  permissions: Record<FamilyRole, FamilyPermission[]>;
  sharedCollections: Array<{
    id: string;
    name: string;
    description?: string;
    icon?: string;
    itemCount: number;
    sharedWith: string[];
    createdBy: string;
  }>;
  activityLog: Array<{
    id: string;
    timestamp: Date;
    userId: string;
    action: string;
    details: string;
    itemId?: string;
    itemTitle?: string;
  }>;
  settings: {
    allowGuestSharing: boolean;
    requireApprovalForSharing: boolean;
    autoLockTimeout: number;
    passwordPolicyEnabled: boolean;
    passwordPolicy?: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
      maxAge: number;
    };
  };
}

export interface EmergencyAccess {
  id: string;
  grantorId: string;
  grantorName: string;
  grantorEmail: string;
  granteeId: string;
  granteeName: string;
  granteeEmail: string;
  status: 'invited' | 'accepted' | 'confirmed' | 'recovery_initiated' | 'recovery_approved' | 'revoked' | 'pending';
  accessType: 'view' | 'takeover';
  accessLevel?: 'view' | 'edit' | 'full' | 'takeover';
  waitTime: number; // days
  waitingPeriod?: number;
  createdAt: Date;
  acceptedAt?: Date;
  confirmedAt?: Date;
  recoveryInitiatedAt?: Date;
  recoveryApprovedAt?: Date;
  expiresAt?: Date;
  lastActivity: Date;
}

export interface FamilyPlan {
  id: string;
  name: string;
  vaults: FamilyVault[];
  members: FamilyMember[];
  maxMembers: number;
  totalStorage: number;
  usedStorage: number;
  billing: {
    plan: 'free' | 'family' | 'teams' | 'enterprise';
    price: number;
    currency: string;
    billingCycle: 'monthly' | 'yearly';
    nextBillingDate: Date;
    paymentMethod?: string;
  };
  features: string[];
  emergencyAccess: EmergencyAccess[];
  invitations: Array<{
    id: string;
    email: string;
    role: FamilyRole;
    invitedBy: string;
    invitedAt: Date;
    expiresAt: Date;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  }>;
}

// ============================================================================
// AGGREGATED TYPES
// ============================================================================

export interface PasswordManagerProConfig {
  passkeys: {
    enabled: boolean;
    preferPasskeys: boolean;
    autoPrompt: boolean;
  };
  vaultHealth: {
    autoScan: boolean;
    scanFrequency: 'daily' | 'weekly' | 'monthly';
    notifications: boolean;
  };
  secureSend: {
    enabled: boolean;
    defaultExpiry: SecureSendExpiry;
    maxFileSize: number;
  };
  sshKeys: {
    enabled: boolean;
    agentIntegration: boolean;
    autoAddToAgent: boolean;
  };
  watchtower: {
    enabled: boolean;
    monitorBreaches: boolean;
    monitorWeakPasswords: boolean;
    realTimeAlerts: boolean;
  };
  darkWebMonitor: {
    enabled: boolean;
    monitorEmails: boolean;
    monitorPhones: boolean;
    monitorCreditCards: boolean;
  };
  usernameGenerator: {
    defaultStyle: UsernameStyle;
    saveHistory: boolean;
    emailAliasesEnabled: boolean;
  };
  cli: {
    enabled: boolean;
    sessionTimeout: number;
  };
  familyVaults: {
    enabled: boolean;
    emergencyAccessEnabled: boolean;
  };
}

export interface PasswordManagerProState {
  passkeyManager: PasskeyManager;
  healthReport: VaultHealthReport | null;
  secureSendLinks: SecureSendLink[];
  sshKeys: SSHKey[];
  sshHosts: SSHHost[];
  sshAgent: SSHAgent;
  watchtower: WatchtowerDashboard;
  darkWebMonitor: DarkWebMonitor;
  usernameGenerator: UsernameGenerator;
  cliAccess: CLIAccess;
  familyPlan: FamilyPlan | null;
  config: PasswordManagerProConfig;
}

// Alias exports for backwards compatibility
export type SharedCollection = FamilyVault['sharedCollections'][number];
export type FamilyMemberRole = FamilyRole;

// UsernameHistory represents a single history item with additional properties
export interface UsernameHistory {
  id: string;
  username: string;
  style?: UsernameStyle;
  usedFor?: string;
  createdAt?: Date;
  isFavorite?: boolean;
}
