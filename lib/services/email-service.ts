/**
 * Email Service - Frontend Integration Layer
 * 
 * Complete backend integration for Email sending via SMTP and SendGrid.
 * Provides typed interfaces and service methods for:
 * - Email configuration (SMTP/SendGrid)
 * - Sending emails (single, batch, campaign)
 * - Connection testing
 * - Status monitoring
 * 
 * @module lib/services/email-service
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Type Definitions
// ============================================================================

export type EmailProvider = 'SMTP' | 'SendGrid' | 'None';

export type SmtpEncryption = 'None' | 'StartTls' | 'Tls';

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: SmtpEncryption;
  from_email: string;
  from_name: string;
  reply_to: string | null;
}

export interface SendGridConfig {
  api_key: string;
  from_email: string;
  from_name: string;
  reply_to: string | null;
  tracking_enabled: boolean;
  sandbox_mode: boolean;
}

export interface EmailConfig {
  active_provider: EmailProvider;
  smtp: SmtpConfig;
  sendgrid: SendGridConfig;
  default_from_email: string;
  default_from_name: string;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  retry_attempts: number;
  retry_delay_seconds: number;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  content_type: string;
}

export interface SendEmailParams {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  html_content: string;
  text_content?: string;
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  headers?: Record<string, string>;
  attachments?: EmailAttachment[];
  template_variables?: Record<string, string>;
  tracking_id?: string;
  campaign_id?: string;
}

export interface EmailSendResult {
  success: boolean;
  message_id: string | null;
  provider: EmailProvider;
  recipient: string;
  error: string | null;
  timestamp: string;
}

export interface EmailBatchResult {
  total: number;
  successful: number;
  failed: number;
  results: EmailSendResult[];
}

export interface EmailTestResult {
  success: boolean;
  provider: EmailProvider;
  message: string;
  latency_ms: number;
  details: string | null;
}

export interface EmailServiceStatus {
  configured: boolean;
  active_provider: EmailProvider;
  smtp_configured: boolean;
  sendgrid_configured: boolean;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  emails_sent_this_minute: number;
  emails_sent_this_hour: number;
}

// ============================================================================
// Configuration Service
// ============================================================================

export const EmailConfigService = {
  /**
   * Get current email configuration
   * Sensitive data (passwords, API keys) are masked
   */
  async getConfig(): Promise<EmailConfig> {
    return invoke<EmailConfig>('email_get_config');
  },

  /**
   * Set the active email provider
   * @param provider - 'smtp', 'sendgrid', or 'none'
   */
  async setActiveProvider(provider: 'smtp' | 'sendgrid' | 'none'): Promise<EmailConfig> {
    return invoke<EmailConfig>('email_set_active_provider', { provider });
  },

  /**
   * Configure SMTP settings
   */
  async configureSMTP(params: {
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: 'tls' | 'starttls' | 'none';
    fromEmail: string;
    fromName: string;
    replyTo?: string;
  }): Promise<EmailConfig> {
    return invoke<EmailConfig>('email_configure_smtp', {
      host: params.host,
      port: params.port,
      username: params.username,
      password: params.password,
      encryption: params.encryption,
      fromEmail: params.fromEmail,
      fromName: params.fromName,
      replyTo: params.replyTo || null,
    });
  },

  /**
   * Configure SendGrid settings
   */
  async configureSendGrid(params: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
    replyTo?: string;
    trackingEnabled?: boolean;
    sandboxMode?: boolean;
  }): Promise<EmailConfig> {
    return invoke<EmailConfig>('email_configure_sendgrid', {
      apiKey: params.apiKey,
      fromEmail: params.fromEmail,
      fromName: params.fromName,
      replyTo: params.replyTo || null,
      trackingEnabled: params.trackingEnabled ?? true,
      sandboxMode: params.sandboxMode ?? false,
    });
  },

  /**
   * Set rate limits for email sending
   */
  async setRateLimits(perMinute: number, perHour: number): Promise<EmailConfig> {
    return invoke<EmailConfig>('email_set_rate_limits', {
      perMinute,
      perHour,
    });
  },

  /**
   * Set retry settings for failed emails
   */
  async setRetrySettings(attempts: number, delaySeconds: number): Promise<EmailConfig> {
    return invoke<EmailConfig>('email_set_retry_settings', {
      attempts,
      delaySeconds,
    });
  },
};

// ============================================================================
// Testing Service
// ============================================================================

export const EmailTestService = {
  /**
   * Test email connection to provider
   * @param provider - Optional specific provider to test
   */
  async testConnection(provider?: 'smtp' | 'sendgrid'): Promise<EmailTestResult> {
    return invoke<EmailTestResult>('email_test_connection', {
      provider: provider || null,
    });
  },

  /**
   * Send a test email to verify configuration
   */
  async sendTestEmail(toEmail: string): Promise<EmailSendResult> {
    return invoke<EmailSendResult>('email_send_test', { toEmail });
  },
};

// ============================================================================
// Sending Service
// ============================================================================

export const EmailSendService = {
  /**
   * Send a single email with full options
   */
  async send(params: SendEmailParams): Promise<EmailSendResult> {
    return invoke<EmailSendResult>('email_send', { params });
  },

  /**
   * Send multiple emails in batch
   */
  async sendBatch(emails: SendEmailParams[]): Promise<EmailBatchResult> {
    return invoke<EmailBatchResult>('email_send_batch', { emails });
  },

  /**
   * Send a simple email (quick method)
   */
  async sendSimple(params: {
    toEmail: string;
    toName?: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
  }): Promise<EmailSendResult> {
    return invoke<EmailSendResult>('email_send_simple', {
      toEmail: params.toEmail,
      toName: params.toName || null,
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent || null,
    });
  },

  /**
   * Send campaign emails to multiple recipients
   */
  async sendCampaign(params: {
    campaignId: string;
    recipients: EmailRecipient[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    fromEmail?: string;
    fromName?: string;
    templateVariables?: Record<string, string>;
  }): Promise<EmailBatchResult> {
    return invoke<EmailBatchResult>('email_send_campaign', {
      campaignId: params.campaignId,
      recipients: params.recipients,
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent || null,
      fromEmail: params.fromEmail || null,
      fromName: params.fromName || null,
      templateVariables: params.templateVariables || null,
    });
  },
};

// ============================================================================
// Status Service
// ============================================================================

export const EmailStatusService = {
  /**
   * Get email service status
   */
  async getStatus(): Promise<EmailServiceStatus> {
    return invoke<EmailServiceStatus>('email_get_status');
  },

  /**
   * Reset rate limit counters
   */
  async resetRateCounters(): Promise<void> {
    return invoke('email_reset_rate_counters');
  },
};

// ============================================================================
// Unified Email Service Export
// ============================================================================

export const EmailService = {
  Config: EmailConfigService,
  Test: EmailTestService,
  Send: EmailSendService,
  Status: EmailStatusService,
};

export default EmailService;
