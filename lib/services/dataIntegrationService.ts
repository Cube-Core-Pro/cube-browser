/**
 * Data Integrations Service
 * 
 * Connect extracted data to popular apps:
 * - Google Sheets (existing)
 * - Airtable
 * - Notion
 * - Webhooks
 * - CSV/JSON Export
 * - API Endpoints
 * 
 * @module integrationService
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types
// ============================================================================

export interface IntegrationConfig {
  id: string;
  type: IntegrationType;
  name: string;
  credentials: Record<string, string>;
  settings: Record<string, unknown>;
  enabled: boolean;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error';
}

export type IntegrationType = 
  | 'google_sheets'
  | 'airtable'
  | 'notion'
  | 'webhook'
  | 'slack'
  | 'discord'
  | 'email'
  | 'csv'
  | 'json'
  | 'api';

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors?: string[];
  syncTime: string;
}

export interface DataRow {
  [key: string]: string | number | boolean | null;
}

// ============================================================================
// Airtable Integration
// ============================================================================

export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  tableName: string;
}

export const airtableService = {
  /**
   * Validate Airtable credentials
   */
  async validateCredentials(config: AirtableConfig): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableName)}?maxRecords=1`,
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Push data to Airtable
   */
  async pushData(config: AirtableConfig, data: DataRow[]): Promise<SyncResult> {
    const _startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;

    // Airtable has a limit of 10 records per request
    const chunks = [];
    for (let i = 0; i < data.length; i += 10) {
      chunks.push(data.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableName)}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              records: chunk.map(row => ({
                fields: row,
              })),
            }),
          }
        );

        if (response.ok) {
          processed += chunk.length;
        } else {
          const error = await response.json();
          errors.push(error.error?.message || 'Unknown error');
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Network error');
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed: processed,
      errors: errors.length > 0 ? errors : undefined,
      syncTime: new Date().toISOString(),
    };
  },

  /**
   * Get records from Airtable
   */
  async getRecords(config: AirtableConfig, maxRecords = 100): Promise<DataRow[]> {
    const response = await fetch(
      `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableName)}?maxRecords=${maxRecords}`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Airtable records');
    }

    const data = await response.json();
    return data.records.map((record: { fields: DataRow }) => record.fields);
  },
};

// ============================================================================
// Notion Integration
// ============================================================================

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}

export const notionService = {
  /**
   * Validate Notion credentials
   */
  async validateCredentials(config: NotionConfig): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.notion.com/v1/databases/${config.databaseId}`,
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Notion-Version': '2022-06-28',
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Push data to Notion database
   */
  async pushData(config: NotionConfig, data: DataRow[], propertyMapping: Record<string, string>): Promise<SyncResult> {
    const errors: string[] = [];
    let processed = 0;

    for (const row of data) {
      try {
        const properties: Record<string, unknown> = {};
        
        for (const [key, value] of Object.entries(row)) {
          const notionType = propertyMapping[key] || 'rich_text';
          properties[key] = formatNotionProperty(value, notionType);
        }

        const response = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({
            parent: { database_id: config.databaseId },
            properties,
          }),
        });

        if (response.ok) {
          processed++;
        } else {
          const error = await response.json();
          errors.push(error.message || 'Unknown error');
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Network error');
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed: processed,
      errors: errors.length > 0 ? errors : undefined,
      syncTime: new Date().toISOString(),
    };
  },

  /**
   * Get database schema
   */
  async getDatabaseSchema(config: NotionConfig): Promise<Record<string, string>> {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${config.databaseId}`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Notion-Version': '2022-06-28',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Notion database schema');
    }

    const data = await response.json();
    const schema: Record<string, string> = {};
    
    for (const [key, prop] of Object.entries(data.properties as Record<string, { type: string }>)) {
      schema[key] = prop.type;
    }

    return schema;
  },
};

function formatNotionProperty(value: unknown, type: string): unknown {
  switch (type) {
    case 'title':
      return {
        title: [{ text: { content: String(value) } }],
      };
    case 'rich_text':
      return {
        rich_text: [{ text: { content: String(value) } }],
      };
    case 'number':
      return {
        number: Number(value) || 0,
      };
    case 'url':
      return {
        url: String(value),
      };
    case 'email':
      return {
        email: String(value),
      };
    case 'phone_number':
      return {
        phone_number: String(value),
      };
    case 'checkbox':
      return {
        checkbox: Boolean(value),
      };
    default:
      return {
        rich_text: [{ text: { content: String(value) } }],
      };
  }
}

// ============================================================================
// Webhook Integration
// ============================================================================

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  batchSize?: number;
}

export const webhookService = {
  /**
   * Test webhook connection
   */
  async testConnection(config: WebhookConfig): Promise<boolean> {
    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Send data to webhook
   */
  async sendData(config: WebhookConfig, data: DataRow[]): Promise<SyncResult> {
    const errors: string[] = [];
    let processed = 0;
    const batchSize = config.batchSize || 100;

    // Batch the data
    const chunks = [];
    for (let i = 0; i < data.length; i += batchSize) {
      chunks.push(data.slice(i, i + batchSize));
    }

    for (const chunk of chunks) {
      try {
        const response = await fetch(config.url, {
          method: config.method,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          body: JSON.stringify({
            records: chunk,
            timestamp: new Date().toISOString(),
            count: chunk.length,
          }),
        });

        if (response.ok) {
          processed += chunk.length;
        } else {
          errors.push(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Network error');
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed: processed,
      errors: errors.length > 0 ? errors : undefined,
      syncTime: new Date().toISOString(),
    };
  },
};

// ============================================================================
// Export Services
// ============================================================================

export const exportService = {
  /**
   * Export data to CSV
   */
  toCSV(data: DataRow[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        const escaped = String(value ?? '').replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  },

  /**
   * Export data to JSON
   */
  toJSON(data: DataRow[], pretty = true): string {
    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  },

  /**
   * Download file
   */
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Export to CSV file
   */
  exportToCSV(data: DataRow[], filename = 'export.csv'): void {
    const csv = this.toCSV(data);
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  },

  /**
   * Export to JSON file
   */
  exportToJSON(data: DataRow[], filename = 'export.json'): void {
    const json = this.toJSON(data);
    this.downloadFile(json, filename, 'application/json');
  },
};

// ============================================================================
// Integration Manager
// ============================================================================

export const integrationManager = {
  /**
   * Get all configured integrations
   */
  async getIntegrations(): Promise<IntegrationConfig[]> {
    try {
      return await invoke<IntegrationConfig[]>('get_integrations');
    } catch {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cube_integrations');
        return stored ? JSON.parse(stored) : [];
      }
      return [];
    }
  },

  /**
   * Save integration config
   */
  async saveIntegration(config: IntegrationConfig): Promise<void> {
    try {
      await invoke('save_integration', { config });
    } catch {
      if (typeof window !== 'undefined') {
        const integrations = await this.getIntegrations();
        const existing = integrations.findIndex(i => i.id === config.id);
        if (existing >= 0) {
          integrations[existing] = config;
        } else {
          integrations.push(config);
        }
        localStorage.setItem('cube_integrations', JSON.stringify(integrations));
      }
    }
  },

  /**
   * Delete integration
   */
  async deleteIntegration(id: string): Promise<void> {
    try {
      await invoke('delete_integration', { id });
    } catch {
      if (typeof window !== 'undefined') {
        const integrations = await this.getIntegrations();
        const filtered = integrations.filter(i => i.id !== id);
        localStorage.setItem('cube_integrations', JSON.stringify(filtered));
      }
    }
  },

  /**
   * Sync data to integration
   */
  async syncData(integrationId: string, data: DataRow[]): Promise<SyncResult> {
    const integrations = await this.getIntegrations();
    const config = integrations.find(i => i.id === integrationId);
    
    if (!config) {
      throw new Error('Integration not found');
    }

    switch (config.type) {
      case 'airtable':
        return airtableService.pushData(
          config.credentials as unknown as AirtableConfig,
          data
        );
      case 'notion':
        return notionService.pushData(
          config.credentials as unknown as NotionConfig,
          data,
          config.settings.propertyMapping as Record<string, string> || {}
        );
      case 'webhook':
        return webhookService.sendData(
          config.credentials as unknown as WebhookConfig,
          data
        );
      case 'google_sheets':
        return invoke<SyncResult>('sync_to_google_sheets', {
          credentials: config.credentials,
          data,
        });
      default:
        throw new Error(`Integration type ${config.type} not supported`);
    }
  },
};

export default integrationManager;
