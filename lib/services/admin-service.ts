/**
 * Admin Service - Enterprise Admin Panel Integration Layer
 * CUBE Nexum v7 - Complete Admin Operations Service
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types
// ============================================================================

export interface ServerStats {
  cpu: number;
  cpu_usage?: number;
  memory: number;
  memory_usage?: number;
  disk: number;
  disk_usage?: number;
  network: { in: number; out: number };
  network_in?: number;
  network_out?: number;
  uptime: number;
  uptime_percent?: number;
  requests: number;
  total_requests?: number;
  errors: number;
  error_count?: number;
  latency: number;
  avg_latency_ms?: number;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  created: Date;
  created_at?: string;
  lastLogin: Date;
  last_login?: string;
  apiCalls: number;
  api_calls?: number;
  features: string[];
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  key_preview?: string;
  userId: string;
  user_id?: string;
  permissions: string[];
  created: Date;
  created_at?: string;
  lastUsed: Date;
  last_used?: string;
  requests: number;
  status: 'active' | 'revoked';
  rate_limit?: number;
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  latency_ms?: number;
  uptime: number;
  uptime_percent?: number;
  lastCheck: Date;
  last_check?: string;
}

export interface SaleRecord {
  id: string;
  customerId: string;
  customer_id?: string;
  customerName: string;
  customer_name?: string;
  customerEmail: string;
  customer_email?: string;
  plan: 'pro' | 'elite' | 'enterprise';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  date: Date;
  paymentMethod: string;
  payment_method?: string;
  invoiceId: string;
  invoice_id?: string;
}

export interface DownloadRecord {
  id: string;
  userId: string;
  user_id?: string;
  userName: string;
  user_name?: string;
  platform: 'windows' | 'macos' | 'linux';
  version: string;
  date: Date;
  ipAddress: string;
  ip_address?: string;
  country: string;
  user_agent?: string;
}

export interface LicenseRecord {
  id: string;
  key: string;
  userId: string;
  user_id?: string;
  userName: string;
  user_name?: string;
  userEmail: string;
  user_email?: string;
  plan: 'pro' | 'elite' | 'enterprise';
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  activatedAt: Date;
  activated_at?: string;
  expiresAt: Date;
  expires_at?: string;
  devicesUsed: number;
  devices_used?: number;
  maxDevices: number;
  max_devices?: number;
}

export interface BusinessMetrics {
  totalRevenue: number;
  total_revenue?: number;
  monthlyRevenue: number;
  monthly_revenue?: number;
  totalSales: number;
  total_sales?: number;
  monthlySales: number;
  monthly_sales?: number;
  totalDownloads: number;
  total_downloads?: number;
  monthlyDownloads: number;
  monthly_downloads?: number;
  activeLicenses: number;
  active_licenses?: number;
  churnRate: number;
  churn_rate?: number;
  avgRevenuePerUser: number;
  avg_revenue_per_user?: number;
  conversionRate: number;
  conversion_rate?: number;
  mrr?: number;
  arr?: number;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  plan: string;
  features: string[];
}

export interface CreateLicenseRequest {
  user_id: string;
  plan: string;
  duration_days: number;
  max_devices: number;
}

export interface CreateApiKeyRequest {
  user_id: string;
  name: string;
  permissions: string[];
  rate_limit: number;
  expires_in_days?: number | null;
}

// ============================================================================
// User Management Service
// ============================================================================

export const UserManagementService = {
  /**
   * Get all users with optional filters
   */
  getUsers: async (
    planFilter: string | null = null,
    statusFilter: string | null = null,
    searchQuery: string | null = null
  ): Promise<UserAccount[]> => {
    return invoke<UserAccount[]>('admin_get_users', { planFilter, statusFilter, searchQuery });
  },

  /**
   * Create a new user
   */
  createUser: async (request: CreateUserRequest): Promise<UserAccount> => {
    return invoke<UserAccount>('admin_create_user', { request });
  },

  /**
   * Suspend a user account
   */
  suspendUser: async (userId: string, reason?: string): Promise<void> => {
    return invoke('admin_suspend_user', { userId, reason });
  },

  /**
   * Reactivate a suspended user
   */
  reactivateUser: async (userId: string): Promise<void> => {
    return invoke('admin_reactivate_user', { userId });
  },

  /**
   * Delete a user account
   */
  deleteUser: async (userId: string): Promise<void> => {
    return invoke('admin_delete_user', { userId });
  },
};

// ============================================================================
// License Management Service
// ============================================================================

export const LicenseManagementService = {
  /**
   * Get all licenses with optional filters
   */
  getLicenses: async (
    statusFilter: string | null = null,
    planFilter: string | null = null,
    searchQuery: string | null = null
  ): Promise<LicenseRecord[]> => {
    return invoke<LicenseRecord[]>('admin_get_licenses', { statusFilter, planFilter, searchQuery });
  },

  /**
   * Create a new license
   */
  createLicense: async (request: CreateLicenseRequest): Promise<LicenseRecord> => {
    return invoke<LicenseRecord>('admin_create_license', { request });
  },

  /**
   * Revoke a license
   */
  revokeLicense: async (licenseId: string, reason?: string): Promise<void> => {
    return invoke('admin_revoke_license', { licenseId, reason });
  },

  /**
   * Extend a license expiration
   */
  extendLicense: async (licenseId: string, additionalDays: number): Promise<void> => {
    return invoke('admin_extend_license', { licenseId, additionalDays });
  },
};

// ============================================================================
// API Key Management Service
// ============================================================================

export const ApiKeyManagementService = {
  /**
   * Get all API keys for a user or all users
   */
  getApiKeys: async (userId: string | null = null): Promise<APIKey[]> => {
    return invoke<APIKey[]>('admin_get_api_keys', { userId });
  },

  /**
   * Create a new API key - returns [APIKey, rawKey]
   */
  createApiKey: async (request: CreateApiKeyRequest): Promise<[APIKey, string]> => {
    return invoke<[APIKey, string]>('admin_create_api_key', { request });
  },

  /**
   * Revoke an API key
   */
  revokeApiKey: async (keyId: string): Promise<void> => {
    return invoke('admin_revoke_api_key', { keyId });
  },
};

// ============================================================================
// Sales Management Service
// ============================================================================

export const SalesManagementService = {
  /**
   * Get all sales records with optional filters
   */
  getSales: async (
    statusFilter: string | null = null,
    planFilter: string | null = null,
    dateFrom: string | null = null,
    dateTo: string | null = null
  ): Promise<SaleRecord[]> => {
    return invoke<SaleRecord[]>('admin_get_sales', { statusFilter, planFilter, dateFrom, dateTo });
  },

  /**
   * Process a refund for a sale
   */
  refundSale: async (saleId: string, reason?: string): Promise<void> => {
    return invoke('admin_refund_sale', { saleId, reason });
  },
};

// ============================================================================
// Downloads Service
// ============================================================================

export const DownloadsService = {
  /**
   * Get all download records with optional filters
   */
  getDownloads: async (
    platformFilter: string | null = null,
    dateFrom: string | null = null,
    dateTo: string | null = null
  ): Promise<DownloadRecord[]> => {
    return invoke<DownloadRecord[]>('admin_get_downloads', { platformFilter, dateFrom, dateTo });
  },
};

// ============================================================================
// Metrics Service
// ============================================================================

export const AdminMetricsService = {
  /**
   * Get business metrics
   */
  getMetrics: async (): Promise<BusinessMetrics> => {
    return invoke<BusinessMetrics>('admin_get_metrics');
  },

  /**
   * Get server statistics
   */
  getServerStats: async (): Promise<ServerStats> => {
    return invoke<ServerStats>('admin_get_server_stats');
  },

  /**
   * Get service statuses
   */
  getServices: async (): Promise<ServiceStatus[]> => {
    return invoke<ServiceStatus[]>('admin_get_services');
  },
};

// ============================================================================
// Export Service
// ============================================================================

export const AdminExportService = {
  /**
   * Export data in specified format
   */
  exportData: async (dataType: string, format: string): Promise<string> => {
    return invoke<string>('admin_export_data', { dataType, format });
  },
};

// ============================================================================
// Release Management Service (Update Manager)
// ============================================================================

export interface Release {
  id: string;
  version: string;
  name: string;
  description: string;
  release_notes: string;
  channel: 'stable' | 'beta' | 'alpha' | 'canary';
  status: 'draft' | 'published' | 'deprecated' | 'recalled';
  platforms: PlatformRelease[];
  created_at: string;
  published_at: string | null;
  downloads: number;
  active_installs: number;
  rollout_percentage: number;
  min_system_requirements: SystemRequirements;
  changelog: ChangelogEntry[];
  signature: string;
  is_critical: boolean;
  is_forced: boolean;
}

export interface PlatformRelease {
  platform: 'windows' | 'macos' | 'linux';
  architecture: string;
  file_url: string;
  file_name: string;
  file_size: number;
  checksum: string;
  signature: string;
  download_count: number;
}

export interface SystemRequirements {
  min_os_version: string;
  min_ram: number;
  min_disk: number;
  required_features: string[];
}

export interface ChangelogEntry {
  type: 'feature' | 'improvement' | 'fix' | 'security' | 'breaking' | 'deprecated';
  title: string;
  description: string;
}

export interface ReleaseStats {
  total_releases: number;
  published_releases: number;
  total_downloads: number;
  active_installs: number;
  avg_adoption_rate: number;
  update_success_rate: number;
  downloads_by_platform: Record<string, number>;
  downloads_by_channel: Record<string, number>;
}

export interface CreateReleaseRequest {
  version: string;
  name: string;
  description: string;
  release_notes: string;
  channel: 'stable' | 'beta' | 'alpha' | 'canary';
  changelog: ChangelogEntry[];
  is_critical: boolean;
  is_forced: boolean;
  rollout_percentage: number;
  min_system_requirements: SystemRequirements;
}

export const ReleaseManagementService = {
  createRelease: async (request: CreateReleaseRequest): Promise<Release> => {
    return invoke<Release>('admin_create_release', { request });
  },
  
  getReleases: async (channelFilter?: string, statusFilter?: string): Promise<Release[]> => {
    return invoke<Release[]>('admin_get_releases', { channelFilter, statusFilter });
  },
  
  getRelease: async (releaseId: string): Promise<Release | null> => {
    return invoke<Release | null>('admin_get_release', { releaseId });
  },
  
  publishRelease: async (releaseId: string): Promise<Release> => {
    return invoke<Release>('admin_publish_release', { releaseId });
  },
  
  recallRelease: async (releaseId: string, reason: string): Promise<Release> => {
    return invoke<Release>('admin_recall_release', { releaseId, reason });
  },
  
  updateRollout: async (releaseId: string, percentage: number): Promise<Release> => {
    return invoke<Release>('admin_update_rollout', { releaseId, percentage });
  },
  
  deleteRelease: async (releaseId: string): Promise<boolean> => {
    return invoke<boolean>('admin_delete_release', { releaseId });
  },
  
  addPlatformBinary: async (
    releaseId: string,
    platform: 'windows' | 'macos' | 'linux',
    architecture: string,
    fileName: string,
    fileSize: number,
    checksum: string
  ): Promise<Release> => {
    return invoke<Release>('admin_add_platform_binary', {
      releaseId, platform, architecture, fileName, fileSize, checksum
    });
  },
  
  getStats: async (): Promise<ReleaseStats> => {
    return invoke<ReleaseStats>('admin_get_release_stats');
  },
  
  recordDownload: async (releaseId: string, platform: 'windows' | 'macos' | 'linux'): Promise<void> => {
    return invoke('release_record_download', { releaseId, platform });
  },
};

// ============================================================================
// Affiliate Management Service
// ============================================================================

export interface Affiliate {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company: string | null;
  website: string | null;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  referral_code: string;
  referral_link: string;
  joined_at: string;
  last_activity_at: string;
  stats: AffiliateStats;
  payment_info: PaymentInfo;
  marketing_materials: string[];
}

export interface AffiliateStats {
  total_clicks: number;
  total_signups: number;
  total_sales: number;
  total_revenue: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  conversion_rate: number;
  avg_order_value: number;
  lifetime_value: number;
  monthly_clicks: number;
  monthly_signups: number;
  monthly_sales: number;
  monthly_commission: number;
}

export interface PaymentInfo {
  method: 'paypal' | 'bank_transfer' | 'crypto' | 'check';
  paypal_email: string | null;
  bank_account: string | null;
  bank_routing: string | null;
  crypto_address: string | null;
  minimum_payout: number;
  payout_frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly';
  currency: string;
}

export interface Payout {
  id: string;
  affiliate_id: string;
  affiliate_name: string;
  amount: number;
  currency: string;
  method: 'paypal' | 'bank_transfer' | 'crypto' | 'check';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  processed_at: string | null;
  transaction_id: string | null;
  notes: string | null;
}

export interface AffiliateGlobalStats {
  total_affiliates: number;
  active_affiliates: number;
  total_revenue: number;
  total_commissions_paid: number;
  pending_payouts: number;
  avg_commission_rate: number;
  top_performer_id: string | null;
}

export interface CreateAffiliateRequest {
  email: string;
  name: string;
  company?: string;
  website?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export const AffiliateManagementService = {
  createAffiliate: async (request: CreateAffiliateRequest): Promise<Affiliate> => {
    return invoke<Affiliate>('admin_create_affiliate', { request });
  },
  
  getAffiliates: async (statusFilter?: string, tierFilter?: string, searchQuery?: string): Promise<Affiliate[]> => {
    return invoke<Affiliate[]>('admin_get_affiliates', { statusFilter, tierFilter, searchQuery });
  },
  
  getAffiliate: async (affiliateId: string): Promise<Affiliate | null> => {
    return invoke<Affiliate | null>('admin_get_affiliate', { affiliateId });
  },
  
  approveAffiliate: async (affiliateId: string): Promise<Affiliate> => {
    return invoke<Affiliate>('admin_approve_affiliate', { affiliateId });
  },
  
  suspendAffiliate: async (affiliateId: string, reason: string): Promise<Affiliate> => {
    return invoke<Affiliate>('admin_suspend_affiliate', { affiliateId, reason });
  },
  
  updateTier: async (affiliateId: string, newTier: Affiliate['tier']): Promise<Affiliate> => {
    return invoke<Affiliate>('admin_update_affiliate_tier', { affiliateId, newTier });
  },
  
  updatePayment: async (affiliateId: string, paymentInfo: PaymentInfo): Promise<Affiliate> => {
    return invoke<Affiliate>('admin_update_affiliate_payment', { affiliateId, paymentInfo });
  },
  
  createPayout: async (affiliateId: string, amount: number): Promise<Payout> => {
    return invoke<Payout>('admin_create_payout', { affiliateId, amount });
  },
  
  processPayout: async (payoutId: string, transactionId: string): Promise<Payout> => {
    return invoke<Payout>('admin_process_payout', { payoutId, transactionId });
  },
  
  getPayouts: async (affiliateId?: string, statusFilter?: string): Promise<Payout[]> => {
    return invoke<Payout[]>('admin_get_payouts', { affiliateId, statusFilter });
  },
  
  getStats: async (): Promise<AffiliateGlobalStats> => {
    return invoke<AffiliateGlobalStats>('admin_get_affiliate_stats');
  },
  
  recordReferral: async (
    affiliateId: string,
    customerEmail: string,
    customerName: string,
    referralType: 'click' | 'signup' | 'sale',
    amount?: number
  ): Promise<void> => {
    return invoke('admin_record_referral', {
      affiliateId, customerEmail, customerName, referralType, amount
    });
  },
};

// ============================================================================
// Helpdesk Service
// ============================================================================

export interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'feature' | 'bug' | 'account' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'in_progress' | 'on_hold' | 'resolved' | 'closed';
  customer: Customer;
  assignee: Agent | null;
  tags: string[];
  messages: TicketMessage[];
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  sla_status: 'on_track' | 'warning' | 'breached';
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string | null;
  plan: string;
  total_tickets: number;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'senior' | 'lead' | 'manager';
  status: 'online' | 'away' | 'busy' | 'offline';
  active_tickets: number;
}

export interface TicketMessage {
  id: string;
  content: string;
  sender: 'customer' | 'agent' | 'system';
  sender_name: string;
  created_at: string;
  is_internal: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  url: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  usage_count: number;
}

export interface HelpdeskStats {
  total_tickets: number;
  open_tickets: number;
  pending_tickets: number;
  resolved_today: number;
  avg_response_time: number;
  avg_resolution_time: number;
  customer_satisfaction: number;
  sla_compliance: number;
  tickets_by_category: Record<string, number>;
  tickets_by_priority: Record<string, number>;
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: Ticket['category'];
  priority: Ticket['priority'];
  customer_id: string;
  customer_name: string;
  customer_email: string;
  tags?: string[];
}

export const HelpdeskService = {
  createTicket: async (request: CreateTicketRequest): Promise<Ticket> => {
    return invoke<Ticket>('helpdesk_create_ticket', { request });
  },
  
  getTickets: async (
    statusFilter?: string,
    priorityFilter?: string,
    categoryFilter?: string,
    assigneeFilter?: string,
    searchQuery?: string
  ): Promise<Ticket[]> => {
    return invoke<Ticket[]>('helpdesk_get_tickets', {
      statusFilter, priorityFilter, categoryFilter, assigneeFilter, searchQuery
    });
  },
  
  getTicket: async (ticketId: string): Promise<Ticket | null> => {
    return invoke<Ticket | null>('helpdesk_get_ticket', { ticketId });
  },
  
  assignTicket: async (ticketId: string, agentId: string): Promise<Ticket> => {
    return invoke<Ticket>('helpdesk_assign_ticket', { ticketId, agentId });
  },
  
  addReply: async (
    ticketId: string,
    content: string,
    senderId: string,
    senderName: string,
    isInternal: boolean = false
  ): Promise<Ticket> => {
    return invoke<Ticket>('helpdesk_add_reply', {
      ticketId, content, senderId, senderName, isInternal
    });
  },
  
  updateStatus: async (ticketId: string, newStatus: Ticket['status']): Promise<Ticket> => {
    return invoke<Ticket>('helpdesk_update_status', { ticketId, newStatus });
  },
  
  updatePriority: async (ticketId: string, newPriority: Ticket['priority']): Promise<Ticket> => {
    return invoke<Ticket>('helpdesk_update_priority', { ticketId, newPriority });
  },
  
  getAgents: async (): Promise<Agent[]> => {
    return invoke<Agent[]>('helpdesk_get_agents');
  },
  
  getCannedResponses: async (category?: string): Promise<CannedResponse[]> => {
    return invoke<CannedResponse[]>('helpdesk_get_canned_responses', { category });
  },
  
  createCannedResponse: async (
    title: string,
    content: string,
    category: string,
    tags: string[]
  ): Promise<CannedResponse> => {
    return invoke<CannedResponse>('helpdesk_create_canned_response', {
      title, content, category, tags
    });
  },
  
  useCannedResponse: async (responseId: string): Promise<CannedResponse> => {
    return invoke<CannedResponse>('helpdesk_use_canned_response', { responseId });
  },
  
  getStats: async (): Promise<HelpdeskStats> => {
    return invoke<HelpdeskStats>('helpdesk_get_stats');
  },
  
  mergeTickets: async (primaryTicketId: string, secondaryTicketId: string): Promise<Ticket> => {
    return invoke<Ticket>('helpdesk_merge_tickets', { primaryTicketId, secondaryTicketId });
  },
};

// ============================================================================
// File Manager Service
// ============================================================================

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size: number | null;
  mime_type: string | null;
  extension: string | null;
  created_at: string;
  modified_at: string;
  owner: string;
  permissions: 'private' | 'team' | 'public';
  starred: boolean;
  downloads: number;
  thumbnail_url: string | null;
  preview_url: string | null;
  metadata: Record<string, string>;
}

export interface ShareLink {
  id: string;
  file_id: string;
  url: string;
  password: string | null;
  expires_at: string | null;
  max_downloads: number | null;
  download_count: number;
  created_at: string;
  created_by: string;
}

export interface FileVersion {
  id: string;
  file_id: string;
  version_number: number;
  size: number;
  created_at: string;
  created_by: string;
  comment: string | null;
  url: string;
}

export interface StorageStats {
  total_space: number;
  used_space: number;
  available_space: number;
  file_count: number;
  folder_count: number;
  usage_by_type: Record<string, number>;
}

export interface UploadFileRequest {
  name: string;
  parent_path: string;
  size: number;
  mime_type: string;
  content_base64?: string;
}

export const FileManagerService = {
  list: async (path?: string, includeHidden?: boolean): Promise<FileItem[]> => {
    return invoke<FileItem[]>('files_list', { path, includeHidden });
  },
  
  get: async (fileId: string): Promise<FileItem | null> => {
    return invoke<FileItem | null>('files_get', { fileId });
  },
  
  createFolder: async (name: string, parentPath: string, permissions?: FileItem['permissions']): Promise<FileItem> => {
    return invoke<FileItem>('files_create_folder', { name, parentPath, permissions });
  },
  
  upload: async (request: UploadFileRequest): Promise<FileItem> => {
    return invoke<FileItem>('files_upload', { request });
  },
  
  delete: async (fileId: string): Promise<boolean> => {
    return invoke<boolean>('files_delete', { fileId });
  },
  
  rename: async (fileId: string, newName: string): Promise<FileItem> => {
    return invoke<FileItem>('files_rename', { fileId, newName });
  },
  
  move: async (fileId: string, newParentPath: string): Promise<FileItem> => {
    return invoke<FileItem>('files_move', { fileId, newParentPath });
  },
  
  copy: async (fileId: string, destPath: string): Promise<FileItem> => {
    return invoke<FileItem>('files_copy', { fileId, destPath });
  },
  
  toggleStar: async (fileId: string): Promise<FileItem> => {
    return invoke<FileItem>('files_toggle_star', { fileId });
  },
  
  updatePermissions: async (fileId: string, permissions: FileItem['permissions']): Promise<FileItem> => {
    return invoke<FileItem>('files_update_permissions', { fileId, permissions });
  },
  
  createShareLink: async (
    fileId: string,
    password?: string,
    expiresInDays?: number,
    maxDownloads?: number
  ): Promise<ShareLink> => {
    return invoke<ShareLink>('files_create_share_link', {
      fileId, password, expiresInDays, maxDownloads
    });
  },
  
  getShareLinks: async (fileId: string): Promise<ShareLink[]> => {
    return invoke<ShareLink[]>('files_get_share_links', { fileId });
  },
  
  deleteShareLink: async (linkId: string): Promise<boolean> => {
    return invoke<boolean>('files_delete_share_link', { linkId });
  },
  
  getVersions: async (fileId: string): Promise<FileVersion[]> => {
    return invoke<FileVersion[]>('files_get_versions', { fileId });
  },
  
  getStats: async (): Promise<StorageStats> => {
    return invoke<StorageStats>('files_get_stats');
  },
  
  search: async (query: string, fileType?: string): Promise<FileItem[]> => {
    return invoke<FileItem[]>('files_search', { query, fileType });
  },
  
  getStarred: async (): Promise<FileItem[]> => {
    return invoke<FileItem[]>('files_get_starred');
  },
  
  getRecent: async (limit?: number): Promise<FileItem[]> => {
    return invoke<FileItem[]>('files_get_recent', { limit });
  },
  
  recordDownload: async (fileId: string): Promise<void> => {
    return invoke('files_record_download', { fileId });
  },
};

// ============================================================================
// Main Admin Service Export
// ============================================================================

export const AdminService = {
  Users: UserManagementService,
  Licenses: LicenseManagementService,
  ApiKeys: ApiKeyManagementService,
  Sales: SalesManagementService,
  Downloads: DownloadsService,
  Metrics: AdminMetricsService,
  Export: AdminExportService,
  Releases: ReleaseManagementService,
  Affiliates: AffiliateManagementService,
  Helpdesk: HelpdeskService,
  Files: FileManagerService,
};

export default AdminService;