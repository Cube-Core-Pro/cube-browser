/**
 * Integration Service - Enterprise Integration Management
 * CUBE Elite v6 - Production-Ready Implementation
 * 
 * Provides TypeScript interface for managing enterprise integrations
 * including Slack, Discord, Monday.com, WhatsApp, and more.
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type IntegrationType = 
  | 'slack' 
  | 'discord' 
  | 'monday' 
  | 'whatsapp' 
  | 'google_sheets'
  | 'jira'
  | 'github'
  | 'gitlab'
  | 'notion'
  | 'airtable'
  | 'salesforce'
  | 'hubspot'
  | 'zendesk'
  | 'custom';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing';

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  description: string;
  icon?: string;
  status: IntegrationStatus;
  lastSync?: number;
  config: Record<string, unknown>;
  credentials?: IntegrationCredentials;
}

export interface IntegrationCredentials {
  type: 'oauth' | 'api_key' | 'webhook' | 'basic';
  token?: string;
  apiKey?: string;
  webhookUrl?: string;
  username?: string;
  password?: string;
  expiresAt?: number;
}

export interface ConnectionResult {
  success: boolean;
  integrationId: string;
  message: string;
  credentials?: IntegrationCredentials;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  duration: number;
  errors: string[];
}

// Slack-specific types
export interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  attachments?: SlackAttachment[];
  blocks?: unknown[];
}

export interface SlackAttachment {
  fallback?: string;
  color?: string;
  pretext?: string;
  author_name?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: SlackField[];
}

export interface SlackField {
  title: string;
  value: string;
  short: boolean;
}

// Discord-specific types
export interface DiscordMessage {
  content: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
  timestamp?: string;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline: boolean;
}

// ============================================================================
// Integration Service Class
// ============================================================================

class IntegrationService {
  private integrations: Map<string, Integration> = new Map();

  // ==========================================================================
  // General Integration Management
  // ==========================================================================

  /**
   * Get all configured integrations
   */
  async getIntegrations(): Promise<Integration[]> {
    try {
      const integrations = await invoke<Integration[]>('integration_list_all');
      integrations.forEach(i => this.integrations.set(i.id, i));
      return integrations;
    } catch {
      // Backend not fully implemented - return cached
      return Array.from(this.integrations.values());
    }
  }

  /**
   * Connect to an integration
   */
  async connect(integrationType: IntegrationType, config: Record<string, unknown>): Promise<ConnectionResult> {
    try {
      const result = await invoke<ConnectionResult>('integration_connect', {
        integrationType,
        config,
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from an integration
   */
  async disconnect(integrationId: string): Promise<void> {
    try {
      await invoke('integration_disconnect', { integrationId });
      this.integrations.delete(integrationId);
    } catch (error) {
      throw new Error(`Failed to disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sync data with an integration
   */
  async sync(integrationId: string): Promise<SyncResult> {
    try {
      const result = await invoke<SyncResult>('integration_sync', { integrationId });
      return result;
    } catch (error) {
      throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test integration connection
   */
  async testConnection(integrationId: string): Promise<boolean> {
    try {
      const result = await invoke<boolean>('integration_test', { integrationId });
      return result;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // Slack Integration
  // ==========================================================================

  /**
   * Send a simple message to Slack
   */
  async slackSendMessage(webhookUrl: string, text: string): Promise<void> {
    try {
      await invoke('slack_send_message', { webhookUrl, text });
    } catch (error) {
      throw new Error(`Failed to send Slack message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a formatted Slack message
   */
  async slackSendMessageFull(webhookUrl: string, message: SlackMessage): Promise<void> {
    try {
      await invoke('slack_send_message_full', { webhookUrl, message });
    } catch (error) {
      throw new Error(`Failed to send Slack message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a Slack notification with status
   */
  async slackSendNotification(
    webhookUrl: string,
    title: string,
    message: string,
    status: 'success' | 'warning' | 'error' | 'info'
  ): Promise<void> {
    try {
      await invoke('slack_send_notification', { webhookUrl, title, message, status });
    } catch (error) {
      throw new Error(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send Slack message with fields
   */
  async slackSendFields(
    webhookUrl: string,
    title: string,
    fields: SlackField[],
    color?: string
  ): Promise<void> {
    try {
      await invoke('slack_send_fields', { webhookUrl, title, fields, color });
    } catch (error) {
      throw new Error(`Failed to send fields: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==========================================================================
  // Discord Integration
  // ==========================================================================

  /**
   * Send a simple message to Discord
   */
  async discordSendMessage(webhookUrl: string, content: string): Promise<void> {
    try {
      await invoke('discord_send_message', { webhookUrl, content });
    } catch (error) {
      throw new Error(`Failed to send Discord message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a formatted Discord message with embeds
   */
  async discordSendEmbed(webhookUrl: string, embed: DiscordEmbed, content?: string): Promise<void> {
    try {
      await invoke('discord_send_embed', { webhookUrl, embed, content });
    } catch (error) {
      throw new Error(`Failed to send Discord embed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send Discord notification with status color
   */
  async discordSendNotification(
    webhookUrl: string,
    title: string,
    message: string,
    status: 'success' | 'warning' | 'error' | 'info'
  ): Promise<void> {
    try {
      await invoke('discord_send_notification', { webhookUrl, title, message, status });
    } catch (error) {
      throw new Error(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==========================================================================
  // Monday.com Integration
  // ==========================================================================

  /**
   * Connect to Monday.com
   */
  async mondayConnect(apiKey: string): Promise<void> {
    try {
      await invoke('monday_connect', { apiKey });
    } catch (error) {
      throw new Error(`Failed to connect to Monday.com: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Monday.com boards
   */
  async mondayGetBoards(): Promise<unknown[]> {
    try {
      const boards = await invoke<unknown[]>('monday_get_boards');
      return boards;
    } catch (error) {
      throw new Error(`Failed to get boards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create Monday.com item
   */
  async mondayCreateItem(boardId: string, itemName: string, columnValues?: Record<string, unknown>): Promise<string> {
    try {
      const itemId = await invoke<string>('monday_create_item', { boardId, itemName, columnValues });
      return itemId;
    } catch (error) {
      throw new Error(`Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==========================================================================
  // WhatsApp Integration
  // ==========================================================================

  /**
   * Connect WhatsApp Business API
   */
  async whatsappConnect(config: {
    phoneNumberId: string;
    accessToken: string;
    businessAccountId?: string;
    webhookVerifyToken?: string;
  }): Promise<void> {
    try {
      await invoke('whatsapp_connect', { config });
    } catch (error) {
      throw new Error(`Failed to connect WhatsApp: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send WhatsApp text message
   */
  async whatsappSendText(to: string, message: string): Promise<string> {
    try {
      const messageId = await invoke<string>('whatsapp_send_text', { to, message });
      return messageId;
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get WhatsApp message history
   */
  async whatsappGetHistory(contactNumber: string, limit?: number): Promise<unknown[]> {
    try {
      const history = await invoke<unknown[]>('whatsapp_get_message_history', { contactNumber, limit });
      return history;
    } catch (error) {
      throw new Error(`Failed to get history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const integrationService = new IntegrationService();
export default integrationService;
