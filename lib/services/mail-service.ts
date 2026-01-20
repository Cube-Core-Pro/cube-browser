/**
 * CUBE Mail Service
 * 
 * Main service for email operations in CUBE Mail.
 * Supports both Tauri (desktop) and web modes.
 * 
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';
import type {
  Email,
  EmailAddress,
  MailAccount,
  MailAccountConfig,
  ComposeDraft,
  MailSearchQuery,
  MailSearchResult,
  MailFilter,
  MailLabel,
  EmailThread,
  SyncReport,
  MailSettings,
  ScreenerConfig,
  ScreenerDecision,
  MailFolder,
  EmailCategory,
  SyncStatus,
} from '../types/mail';

const log = logger.scope('Mail');

// ============================================================================
// SERVICE CLASS
// ============================================================================

class MailService {
  private static instance: MailService;
  private isTauri: boolean;
  private accounts: Map<string, MailAccount> = new Map();
  private settings: MailSettings | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  private constructor() {
    this.isTauri = typeof window !== 'undefined' && 
      (window as Window & { __TAURI__?: unknown }).__TAURI__ !== undefined;
  }

  static getInstance(): MailService {
    if (!MailService.instance) {
      MailService.instance = new MailService();
    }
    return MailService.instance;
  }

  // ==========================================================================
  // ACCOUNT MANAGEMENT
  // ==========================================================================

  /**
   * Add a new mail account
   */
  async addAccount(config: MailAccountConfig): Promise<MailAccount> {
    if (this.isTauri) {
      const account = await invoke<MailAccount>('mail_add_account', { config });
      this.accounts.set(account.id, account);
      this.emit('account:added', account);
      return account;
    }
    
    // Web fallback - API call
    const response = await fetch('/api/mail/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add account: ${response.statusText}`);
    }
    
    const account = await response.json();
    this.accounts.set(account.id, account);
    this.emit('account:added', account);
    return account;
  }

  /**
   * Remove a mail account
   */
  async removeAccount(accountId: string): Promise<void> {
    if (this.isTauri) {
      await invoke('mail_remove_account', { accountId });
    } else {
      await fetch(`/api/mail/accounts/${accountId}`, { method: 'DELETE' });
    }
    
    this.accounts.delete(accountId);
    this.emit('account:removed', accountId);
  }

  /**
   * Get all accounts
   */
  async getAccounts(): Promise<MailAccount[]> {
    if (this.isTauri) {
      const accounts = await invoke<MailAccount[]>('mail_get_accounts');
      accounts.forEach(a => this.accounts.set(a.id, a));
      return accounts;
    }
    
    const response = await fetch('/api/mail/accounts');
    const accounts = await response.json();
    accounts.forEach((a: MailAccount) => this.accounts.set(a.id, a));
    return accounts;
  }

  /**
   * Update account settings
   */
  async updateAccount(accountId: string, updates: Partial<MailAccount>): Promise<MailAccount> {
    if (this.isTauri) {
      const account = await invoke<MailAccount>('mail_update_account', { 
        accountId, 
        updates 
      });
      this.accounts.set(account.id, account);
      this.emit('account:updated', account);
      return account;
    }
    
    const response = await fetch(`/api/mail/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    const account = await response.json();
    this.accounts.set(account.id, account);
    this.emit('account:updated', account);
    return account;
  }

  // ==========================================================================
  // EMAIL OPERATIONS
  // ==========================================================================

  /**
   * Fetch emails from a folder
   */
  async fetchEmails(
    accountId: string,
    folder: MailFolder,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Email[]> {
    const { limit = 50, offset = 0 } = options;
    
    if (this.isTauri) {
      return invoke<Email[]>('mail_fetch_emails', {
        accountId,
        folder,
        limit,
        offset,
      });
    }
    
    const params = new URLSearchParams({
      accountId,
      folder,
      limit: String(limit),
      offset: String(offset),
    });
    
    const response = await fetch(`/api/mail/emails?${params}`);
    return response.json();
  }

  /**
   * Get a single email by ID
   */
  async getEmail(accountId: string, emailId: string): Promise<Email> {
    if (this.isTauri) {
      return invoke<Email>('mail_get_email', { accountId, emailId });
    }
    
    const response = await fetch(`/api/mail/emails/${emailId}?accountId=${accountId}`);
    return response.json();
  }

  /**
   * Get email thread
   */
  async getThread(accountId: string, threadId: string): Promise<EmailThread> {
    if (this.isTauri) {
      return invoke<EmailThread>('mail_get_thread', { accountId, threadId });
    }
    
    const response = await fetch(`/api/mail/threads/${threadId}?accountId=${accountId}`);
    return response.json();
  }

  /**
   * Send an email
   */
  async sendEmail(draft: ComposeDraft): Promise<Email> {
    if (this.isTauri) {
      const email = await invoke<Email>('mail_send_email', { draft });
      this.emit('email:sent', email);
      return email;
    }
    
    const response = await fetch('/api/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    
    const email = await response.json();
    this.emit('email:sent', email);
    return email;
  }

  /**
   * Save draft
   */
  async saveDraft(draft: ComposeDraft): Promise<Email> {
    if (this.isTauri) {
      return invoke<Email>('mail_save_draft', { draft });
    }
    
    const response = await fetch('/api/mail/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    
    return response.json();
  }

  /**
   * Delete email
   */
  async deleteEmail(accountId: string, emailId: string, permanent = false): Promise<void> {
    if (this.isTauri) {
      await invoke('mail_delete_email', { accountId, emailId, permanent });
    } else {
      await fetch(`/api/mail/emails/${emailId}?accountId=${accountId}&permanent=${permanent}`, {
        method: 'DELETE',
      });
    }
    
    this.emit('email:deleted', { accountId, emailId, permanent });
  }

  /**
   * Move email to folder
   */
  async moveEmail(accountId: string, emailId: string, folder: MailFolder): Promise<void> {
    if (this.isTauri) {
      await invoke('mail_move_email', { accountId, emailId, folder });
    } else {
      await fetch(`/api/mail/emails/${emailId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, folder }),
      });
    }
    
    this.emit('email:moved', { accountId, emailId, folder });
  }

  /**
   * Mark email as read/unread
   */
  async markAsRead(accountId: string, emailIds: string[], isRead = true): Promise<void> {
    if (this.isTauri) {
      await invoke('mail_mark_as_read', { accountId, emailIds, isRead });
    } else {
      await fetch('/api/mail/emails/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, emailIds, isRead }),
      });
    }
    
    this.emit('email:readStatusChanged', { accountId, emailIds, isRead });
  }

  /**
   * Star/unstar email
   */
  async setStarred(accountId: string, emailIds: string[], isStarred = true): Promise<void> {
    if (this.isTauri) {
      await invoke('mail_set_starred', { accountId, emailIds, isStarred });
    } else {
      await fetch('/api/mail/emails/star', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, emailIds, isStarred }),
      });
    }
    
    this.emit('email:starredChanged', { accountId, emailIds, isStarred });
  }

  /**
   * Archive emails
   */
  async archiveEmails(accountId: string, emailIds: string[]): Promise<void> {
    return this.moveEmail(accountId, emailIds[0], 'archive');
  }

  /**
   * Report as spam
   */
  async reportSpam(accountId: string, emailIds: string[]): Promise<void> {
    if (this.isTauri) {
      await invoke('mail_report_spam', { accountId, emailIds });
    } else {
      await fetch('/api/mail/emails/spam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, emailIds }),
      });
    }
    
    this.emit('email:reportedSpam', { accountId, emailIds });
  }

  // ==========================================================================
  // SEARCH
  // ==========================================================================

  /**
   * Search emails
   */
  async search(query: MailSearchQuery): Promise<MailSearchResult> {
    if (this.isTauri) {
      return invoke<MailSearchResult>('mail_search', { query });
    }
    
    const response = await fetch('/api/mail/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });
    
    return response.json();
  }

  /**
   * Full-text search using SQLite FTS5
   */
  async searchFTS(
    accountId: string,
    query: string,
    options: {
      folder?: MailFolder;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{
    emails: Email[];
    totalCount: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    if (this.isTauri) {
      return invoke('cube_mail_search_fts', {
        accountId,
        query,
        folder: options.folder,
        page: options.page,
        pageSize: options.pageSize,
      });
    }
    
    const response = await fetch('/api/mail/search/fts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, query, ...options }),
    });
    
    return response.json();
  }

  /**
   * Advanced search with multiple filters
   */
  async searchAdvanced(
    accountId: string,
    filters: {
      from?: string;
      to?: string;
      subject?: string;
      body?: string;
      hasAttachment?: boolean;
      isUnread?: boolean;
      dateFrom?: string;
      dateTo?: string;
      labels?: string[];
      folder?: MailFolder;
    },
    options: {
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{
    emails: Email[];
    totalCount: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    if (this.isTauri) {
      return invoke('cube_mail_search_advanced', {
        accountId,
        ...filters,
        page: options.page,
        pageSize: options.pageSize,
      });
    }
    
    const response = await fetch('/api/mail/search/advanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, ...filters, ...options }),
    });
    
    return response.json();
  }

  /**
   * Get mail statistics for an account
   */
  async getStatistics(accountId: string): Promise<{
    totalEmails: number;
    unreadCount: number;
    starredCount: number;
    inboxCount: number;
    sentCount: number;
    draftsCount: number;
    spamCount: number;
    trashCount: number;
    archiveCount: number;
    screenerCount: number;
    storageUsedBytes: number;
  }> {
    if (this.isTauri) {
      return invoke('cube_mail_get_statistics', { accountId });
    }
    
    const response = await fetch(`/api/mail/statistics?accountId=${accountId}`);
    return response.json();
  }

  // ==========================================================================
  // BATCH OPERATIONS
  // ==========================================================================

  /**
   * Batch mark emails as read/unread
   */
  async batchMarkRead(
    accountId: string,
    emailIds: string[],
    isRead: boolean
  ): Promise<number> {
    if (this.isTauri) {
      return invoke('cube_mail_batch_mark_read', { accountId, emailIds, isRead });
    }
    
    const response = await fetch('/api/mail/batch/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, emailIds, isRead }),
    });
    
    const result = await response.json();
    this.emit('email:batchReadChanged', { accountId, emailIds, isRead });
    return result.count;
  }

  /**
   * Batch move emails to folder
   */
  async batchMove(
    accountId: string,
    emailIds: string[],
    folder: MailFolder
  ): Promise<number> {
    if (this.isTauri) {
      return invoke('cube_mail_batch_move', { accountId, emailIds, folder });
    }
    
    const response = await fetch('/api/mail/batch/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, emailIds, folder }),
    });
    
    const result = await response.json();
    this.emit('email:batchMoved', { accountId, emailIds, folder });
    return result.count;
  }

  /**
   * Batch delete emails
   */
  async batchDelete(
    accountId: string,
    emailIds: string[],
    permanent = false
  ): Promise<number> {
    if (this.isTauri) {
      return invoke('cube_mail_batch_delete', { accountId, emailIds, permanent });
    }
    
    const response = await fetch('/api/mail/batch/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, emailIds, permanent }),
    });
    
    const result = await response.json();
    this.emit('email:batchDeleted', { accountId, emailIds, permanent });
    return result.count;
  }

  /**
   * Batch add labels
   */
  async batchAddLabels(
    accountId: string,
    emailIds: string[],
    labels: string[]
  ): Promise<number> {
    if (this.isTauri) {
      return invoke('cube_mail_batch_add_labels', { accountId, emailIds, labels });
    }
    
    const response = await fetch('/api/mail/batch/add-labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, emailIds, labels }),
    });
    
    const result = await response.json();
    this.emit('email:batchLabelsAdded', { accountId, emailIds, labels });
    return result.count;
  }

  // ==========================================================================
  // LABELS
  // ==========================================================================

  /**
   * Get all labels
   */
  async getLabels(accountId: string): Promise<MailLabel[]> {
    if (this.isTauri) {
      return invoke<MailLabel[]>('mail_get_labels', { accountId });
    }
    
    const response = await fetch(`/api/mail/labels?accountId=${accountId}`);
    return response.json();
  }

  /**
   * Create label
   */
  async createLabel(accountId: string, name: string, color?: string): Promise<MailLabel> {
    if (this.isTauri) {
      return invoke<MailLabel>('mail_create_label', { accountId, name, color });
    }
    
    const response = await fetch('/api/mail/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, name, color }),
    });
    
    return response.json();
  }

  /**
   * Apply labels to emails
   */
  async applyLabels(accountId: string, emailIds: string[], labelIds: string[]): Promise<void> {
    if (this.isTauri) {
      await invoke('mail_apply_labels', { accountId, emailIds, labelIds });
    } else {
      await fetch('/api/mail/emails/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, emailIds, labelIds }),
      });
    }
    
    this.emit('email:labelsChanged', { accountId, emailIds, labelIds });
  }

  // ==========================================================================
  // FILTERS
  // ==========================================================================

  /**
   * Get all filters
   */
  async getFilters(accountId: string): Promise<MailFilter[]> {
    if (this.isTauri) {
      return invoke<MailFilter[]>('mail_get_filters', { accountId });
    }
    
    const response = await fetch(`/api/mail/filters?accountId=${accountId}`);
    return response.json();
  }

  /**
   * Create filter
   */
  async createFilter(accountId: string, filter: Omit<MailFilter, 'id' | 'createdAt' | 'updatedAt'>): Promise<MailFilter> {
    if (this.isTauri) {
      return invoke<MailFilter>('mail_create_filter', { accountId, filter });
    }
    
    const response = await fetch('/api/mail/filters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, filter }),
    });
    
    return response.json();
  }

  /**
   * Update filter
   */
  async updateFilter(accountId: string, filterId: string, updates: Partial<MailFilter>): Promise<MailFilter> {
    if (this.isTauri) {
      return invoke<MailFilter>('mail_update_filter', { accountId, filterId, updates });
    }
    
    const response = await fetch(`/api/mail/filters/${filterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, ...updates }),
    });
    
    return response.json();
  }

  /**
   * Delete filter
   */
  async deleteFilter(accountId: string, filterId: string): Promise<void> {
    if (this.isTauri) {
      await invoke('mail_delete_filter', { accountId, filterId });
    } else {
      await fetch(`/api/mail/filters/${filterId}?accountId=${accountId}`, {
        method: 'DELETE',
      });
    }
  }

  // ==========================================================================
  // SCREENER (HEY-inspired)
  // ==========================================================================

  /**
   * Get screener config
   */
  async getScreenerConfig(accountId: string): Promise<ScreenerConfig> {
    if (this.isTauri) {
      return invoke<ScreenerConfig>('mail_get_screener_config', { accountId });
    }
    
    const response = await fetch(`/api/mail/screener/config?accountId=${accountId}`);
    return response.json();
  }

  /**
   * Update screener config
   */
  async updateScreenerConfig(accountId: string, config: Partial<ScreenerConfig>): Promise<ScreenerConfig> {
    if (this.isTauri) {
      return invoke<ScreenerConfig>('mail_update_screener_config', { accountId, config });
    }
    
    const response = await fetch('/api/mail/screener/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, ...config }),
    });
    
    return response.json();
  }

  /**
   * Get pending screener emails
   */
  async getScreenerPending(accountId: string): Promise<Email[]> {
    if (this.isTauri) {
      return invoke<Email[]>('mail_get_screener_pending', { accountId });
    }
    
    const response = await fetch(`/api/mail/screener/pending?accountId=${accountId}`);
    return response.json();
  }

  /**
   * Make screener decision
   */
  async screenerDecision(accountId: string, decision: ScreenerDecision): Promise<void> {
    if (this.isTauri) {
      await invoke('mail_screener_decision', { accountId, decision });
    } else {
      await fetch('/api/mail/screener/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, ...decision }),
      });
    }
    
    this.emit('screener:decision', { accountId, decision });
  }

  // ==========================================================================
  // SYNC
  // ==========================================================================

  /**
   * Sync account
   */
  async syncAccount(accountId: string): Promise<SyncReport> {
    if (this.isTauri) {
      const report = await invoke<SyncReport>('mail_sync_account', { accountId });
      this.emit('sync:completed', report);
      return report;
    }
    
    const response = await fetch(`/api/mail/sync/${accountId}`, { method: 'POST' });
    const report = await response.json();
    this.emit('sync:completed', report);
    return report;
  }

  /**
   * Get sync status
   */
  async getSyncStatus(accountId: string): Promise<SyncStatus> {
    if (this.isTauri) {
      return invoke<SyncStatus>('mail_get_sync_status', { accountId });
    }
    
    const response = await fetch(`/api/mail/sync/${accountId}/status`);
    return response.json();
  }

  // ==========================================================================
  // SETTINGS
  // ==========================================================================

  /**
   * Get settings
   */
  async getSettings(): Promise<MailSettings> {
    if (this.settings) {
      return this.settings;
    }
    
    if (this.isTauri) {
      this.settings = await invoke<MailSettings>('mail_get_settings');
    } else {
      const response = await fetch('/api/mail/settings');
      this.settings = await response.json();
    }
    
    return this.settings!;
  }

  /**
   * Update settings
   */
  async updateSettings(updates: Partial<MailSettings>): Promise<MailSettings> {
    if (this.isTauri) {
      this.settings = await invoke<MailSettings>('mail_update_settings', { updates });
    } else {
      const response = await fetch('/api/mail/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      this.settings = await response.json();
    }
    
    this.emit('settings:updated', this.settings);
    return this.settings!;
  }

  // ==========================================================================
  // AI FEATURES
  // ==========================================================================

  /**
   * Get AI categorization for email
   */
  async categorizeEmail(email: Email): Promise<EmailCategory> {
    if (this.isTauri) {
      return invoke<EmailCategory>('mail_categorize_email', { email });
    }
    
    const response = await fetch('/api/mail/ai/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email),
    });
    
    const result = await response.json();
    return result.category;
  }

  /**
   * Get AI summary for email
   */
  async summarizeEmail(email: Email): Promise<string> {
    if (this.isTauri) {
      return invoke<string>('mail_summarize_email', { email });
    }
    
    const response = await fetch('/api/mail/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email),
    });
    
    const result = await response.json();
    return result.summary;
  }

  /**
   * Get AI-suggested reply
   */
  async suggestReply(email: Email, tone?: string): Promise<string> {
    if (this.isTauri) {
      return invoke<string>('mail_suggest_reply', { email, tone });
    }
    
    const response = await fetch('/api/mail/ai/suggest-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, tone }),
    });
    
    const result = await response.json();
    return result.suggestion;
  }

  // ==========================================================================
  // EVENT SYSTEM
  // ==========================================================================

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        log.error(`Error in mail event listener for ${event}:`, error);
      }
    });
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const mailService = MailService.getInstance();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format email address for display
 */
export function formatEmailAddress(address: EmailAddress): string {
  if (address.name) {
    return `${address.name} <${address.email}>`;
  }
  return address.email;
}

/**
 * Parse email address string
 */
export function parseEmailAddress(str: string): EmailAddress {
  const match = str.match(/^(?:"?([^"]*)"?\s*)?<?([^>]+)>?$/);
  if (match) {
    return {
      name: match[1]?.trim() || undefined,
      email: match[2].trim(),
    };
  }
  return { email: str.trim() };
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Get initials from email address
 */
export function getInitials(address: EmailAddress): string {
  if (address.name) {
    return address.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return address.email[0].toUpperCase();
}

/**
 * Check if email is encrypted
 */
export function isEmailEncrypted(email: Email): boolean {
  return email.encryption?.isEncrypted ?? false;
}

/**
 * Check if email authentication passed
 */
export function isAuthenticationValid(email: Email): boolean {
  return (
    email.spfStatus === 'pass' &&
    email.dkimStatus === 'pass' &&
    email.dmarcStatus === 'pass'
  );
}
