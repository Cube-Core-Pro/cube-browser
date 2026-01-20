/**
 * Integration Service - External Platform Connectors
 *
 * Enterprise-grade integrations with popular automation platforms,
 * webhooks, and API connectors.
 *
 * M5 Features:
 * - Zapier integration
 * - n8n integration
 * - Make (Integromat) integration
 * - Webhook management
 * - API connectors
 * - OAuth2 management
 * - Custom integrations
 *
 * @module IntegrationService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService, SpanKind } from './telemetry-service';

// ============================================================================
// Base Integration Types
// ============================================================================

export interface Integration {
  /**
   * Integration ID
   */
  id: string;

  /**
   * Integration name
   */
  name: string;

  /**
   * Integration type
   */
  type: IntegrationType;

  /**
   * Platform-specific configuration
   */
  config: IntegrationConfig;

  /**
   * Authentication
   */
  auth?: IntegrationAuth;

  /**
   * Status
   */
  status: IntegrationStatus;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Last sync timestamp
   */
  lastSync?: number;

  /**
   * Error message if any
   */
  error?: string;

  /**
   * Usage statistics
   */
  stats: IntegrationStats;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;

  /**
   * Notes
   */
  notes?: string;

  /**
   * Tags
   */
  tags: string[];
}

export type IntegrationType =
  | 'zapier'
  | 'n8n'
  | 'make'
  | 'webhook'
  | 'rest-api'
  | 'graphql'
  | 'slack'
  | 'discord'
  | 'teams'
  | 'email'
  | 'sms'
  | 'database'
  | 'storage'
  | 'custom';

export type IntegrationStatus =
  | 'active'
  | 'inactive'
  | 'error'
  | 'pending'
  | 'configuring';

export interface IntegrationConfig {
  /**
   * Base URL
   */
  baseUrl?: string;

  /**
   * API key
   */
  apiKey?: string;

  /**
   * Custom headers
   */
  headers?: Record<string, string>;

  /**
   * Query parameters
   */
  queryParams?: Record<string, string>;

  /**
   * Timeout (ms)
   */
  timeout?: number;

  /**
   * Retry configuration
   */
  retry?: {
    maxRetries: number;
    backoffMultiplier: number;
  };

  /**
   * Rate limiting
   */
  rateLimit?: {
    requestsPerMinute: number;
  };

  /**
   * Platform-specific settings
   */
  platformSettings?: Record<string, unknown>;
}

export interface IntegrationAuth {
  /**
   * Auth type
   */
  type: 'api-key' | 'oauth2' | 'basic' | 'bearer' | 'custom';

  /**
   * API key (for api-key type)
   */
  apiKey?: string;

  /**
   * API key header name
   */
  apiKeyHeader?: string;

  /**
   * Username (for basic auth)
   */
  username?: string;

  /**
   * Password (for basic auth)
   */
  password?: string;

  /**
   * Bearer token
   */
  bearerToken?: string;

  /**
   * OAuth2 configuration
   */
  oauth2?: OAuth2Config;

  /**
   * Custom auth configuration
   */
  custom?: Record<string, unknown>;
}

export interface OAuth2Config {
  /**
   * Client ID
   */
  clientId: string;

  /**
   * Client secret
   */
  clientSecret: string;

  /**
   * Authorization URL
   */
  authorizationUrl: string;

  /**
   * Token URL
   */
  tokenUrl: string;

  /**
   * Scopes
   */
  scopes: string[];

  /**
   * Redirect URI
   */
  redirectUri: string;

  /**
   * Access token
   */
  accessToken?: string;

  /**
   * Refresh token
   */
  refreshToken?: string;

  /**
   * Token expiry timestamp
   */
  tokenExpiry?: number;

  /**
   * State parameter
   */
  state?: string;
}

export interface IntegrationStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastRequestAt?: number;
  averageLatency: number;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface Webhook {
  /**
   * Webhook ID
   */
  id: string;

  /**
   * Webhook name
   */
  name: string;

  /**
   * Webhook URL
   */
  url: string;

  /**
   * HTTP method
   */
  method: 'POST' | 'PUT' | 'PATCH';

  /**
   * Webhook type
   */
  type: 'incoming' | 'outgoing';

  /**
   * Events that trigger this webhook
   */
  events: WebhookEvent[];

  /**
   * Headers to send
   */
  headers: Record<string, string>;

  /**
   * Payload template
   */
  payloadTemplate?: string;

  /**
   * Secret for signature verification
   */
  secret?: string;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Status
   */
  status: WebhookStatus;

  /**
   * Last triggered
   */
  lastTriggeredAt?: number;

  /**
   * Statistics
   */
  stats: WebhookStats;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Notes
   */
  notes?: string;
}

export type WebhookStatus =
  | 'active'
  | 'inactive'
  | 'failing'
  | 'disabled';

export type WebhookEvent =
  | 'workflow.started'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'workflow.paused'
  | 'data.extracted'
  | 'data.exported'
  | 'task.completed'
  | 'task.failed'
  | 'error.occurred'
  | 'schedule.triggered'
  | 'custom';

export interface WebhookStats {
  totalTriggers: number;
  successfulTriggers: number;
  failedTriggers: number;
  lastSuccessAt?: number;
  lastFailureAt?: number;
  averageLatency: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: unknown;
  status: 'pending' | 'success' | 'failed';
  statusCode?: number;
  response?: string;
  error?: string;
  attempts: number;
  triggeredAt: number;
  deliveredAt?: number;
  duration?: number;
}

// ============================================================================
// API Connector Types
// ============================================================================

export interface APIConnector {
  /**
   * Connector ID
   */
  id: string;

  /**
   * Connector name
   */
  name: string;

  /**
   * API type
   */
  type: 'rest' | 'graphql' | 'soap';

  /**
   * Base URL
   */
  baseUrl: string;

  /**
   * Authentication
   */
  auth: IntegrationAuth;

  /**
   * Default headers
   */
  defaultHeaders: Record<string, string>;

  /**
   * Endpoints
   */
  endpoints: APIEndpoint[];

  /**
   * Rate limiting
   */
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };

  /**
   * Retry configuration
   */
  retry: {
    enabled: boolean;
    maxRetries: number;
    backoffMultiplier: number;
  };

  /**
   * Documentation URL
   */
  documentationUrl?: string;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Status
   */
  status: IntegrationStatus;

  /**
   * Statistics
   */
  stats: IntegrationStats;

  /**
   * Creation timestamp
   */
  createdAt: number;
}

export interface APIEndpoint {
  /**
   * Endpoint ID
   */
  id: string;

  /**
   * Endpoint name
   */
  name: string;

  /**
   * HTTP method
   */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  /**
   * Path (relative to base URL)
   */
  path: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Request body schema
   */
  requestSchema?: Record<string, unknown>;

  /**
   * Response schema
   */
  responseSchema?: Record<string, unknown>;

  /**
   * Path parameters
   */
  pathParams?: APIParameter[];

  /**
   * Query parameters
   */
  queryParams?: APIParameter[];

  /**
   * Headers
   */
  headers?: APIParameter[];

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Cache configuration
   */
  cache?: {
    enabled: boolean;
    ttl: number;
  };
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: unknown;
  enum?: unknown[];
}

export interface APIRequest {
  connectorId: string;
  endpointId: string;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  duration: number;
  cached: boolean;
}

// ============================================================================
// Zapier Integration Types
// ============================================================================

export interface ZapierIntegration extends Integration {
  type: 'zapier';
  zapierConfig: {
    webhookUrl: string;
    triggers: ZapierTrigger[];
    actions: ZapierAction[];
  };
}

export interface ZapierTrigger {
  id: string;
  name: string;
  event: WebhookEvent;
  zapId?: string;
  isEnabled: boolean;
}

export interface ZapierAction {
  id: string;
  name: string;
  actionType: string;
  config: Record<string, unknown>;
}

// ============================================================================
// n8n Integration Types
// ============================================================================

export interface N8nIntegration extends Integration {
  type: 'n8n';
  n8nConfig: {
    instanceUrl: string;
    apiKey: string;
    workflows: N8nWorkflow[];
  };
}

export interface N8nWorkflow {
  id: string;
  name: string;
  workflowId: string;
  isActive: boolean;
  lastRun?: number;
}

// ============================================================================
// Make (Integromat) Integration Types
// ============================================================================

export interface MakeIntegration extends Integration {
  type: 'make';
  makeConfig: {
    teamId: string;
    apiKey: string;
    scenarios: MakeScenario[];
  };
}

export interface MakeScenario {
  id: string;
  name: string;
  scenarioId: string;
  isActive: boolean;
  lastRun?: number;
}

// ============================================================================
// Slack Integration Types
// ============================================================================

export interface SlackIntegration extends Integration {
  type: 'slack';
  slackConfig: {
    workspaceId: string;
    botToken: string;
    channels: SlackChannel[];
    notifications: SlackNotificationConfig;
  };
}

export interface SlackChannel {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface SlackNotificationConfig {
  onSuccess: boolean;
  onFailure: boolean;
  onWarning: boolean;
  mentionUsers: string[];
  customMessages: Record<string, string>;
}

// ============================================================================
// Integration Service
// ============================================================================

export const IntegrationService = {
  /**
   * Create an integration
   */
  createIntegration: async (
    integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt' | 'stats'>
  ): Promise<Integration> => {
    TelemetryService.trackEvent('integration_created', { type: integration.type });

    return invoke<Integration>('integration_create', { integration });
  },

  /**
   * Get all integrations
   */
  getIntegrations: async (filters?: {
    type?: IntegrationType;
    status?: IntegrationStatus;
    isEnabled?: boolean;
  }): Promise<Integration[]> => {
    return invoke<Integration[]>('integration_get_all', { filters });
  },

  /**
   * Get integration by ID
   */
  getIntegration: async (integrationId: string): Promise<Integration | null> => {
    return invoke<Integration | null>('integration_get', { integrationId });
  },

  /**
   * Update integration
   */
  updateIntegration: async (
    integrationId: string,
    updates: Partial<Integration>
  ): Promise<Integration> => {
    return invoke<Integration>('integration_update', { integrationId, updates });
  },

  /**
   * Delete integration
   */
  deleteIntegration: async (integrationId: string): Promise<void> => {
    return invoke('integration_delete', { integrationId });
  },

  /**
   * Test integration connection
   */
  testConnection: async (
    integrationId: string
  ): Promise<{ success: boolean; message: string; latency?: number }> => {
    return invoke('integration_test_connection', { integrationId });
  },

  /**
   * Enable/Disable integration
   */
  setEnabled: async (
    integrationId: string,
    enabled: boolean
  ): Promise<void> => {
    return invoke('integration_set_enabled', { integrationId, enabled });
  },

  /**
   * Sync integration
   */
  syncIntegration: async (integrationId: string): Promise<void> => {
    return invoke('integration_sync', { integrationId });
  },

  /**
   * Get integration logs
   */
  getLogs: async (
    integrationId: string,
    options?: { limit?: number; startTime?: number; endTime?: number }
  ): Promise<IntegrationLog[]> => {
    return invoke<IntegrationLog[]>('integration_get_logs', {
      integrationId,
      options,
    });
  },
};

export interface IntegrationLog {
  id: string;
  integrationId: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Webhook Service
// ============================================================================

export const WebhookService = {
  /**
   * Create a webhook
   */
  createWebhook: async (
    webhook: Omit<Webhook, 'id' | 'createdAt' | 'status' | 'stats'>
  ): Promise<Webhook> => {
    TelemetryService.trackEvent('webhook_created');

    return invoke<Webhook>('webhook_create', { webhook });
  },

  /**
   * Get all webhooks
   */
  getWebhooks: async (filters?: {
    type?: 'incoming' | 'outgoing';
    status?: WebhookStatus;
    isEnabled?: boolean;
  }): Promise<Webhook[]> => {
    return invoke<Webhook[]>('webhook_get_all', { filters });
  },

  /**
   * Get webhook by ID
   */
  getWebhook: async (webhookId: string): Promise<Webhook | null> => {
    return invoke<Webhook | null>('webhook_get', { webhookId });
  },

  /**
   * Update webhook
   */
  updateWebhook: async (
    webhookId: string,
    updates: Partial<Webhook>
  ): Promise<Webhook> => {
    return invoke<Webhook>('webhook_update', { webhookId, updates });
  },

  /**
   * Delete webhook
   */
  deleteWebhook: async (webhookId: string): Promise<void> => {
    return invoke('webhook_delete', { webhookId });
  },

  /**
   * Test webhook
   */
  testWebhook: async (
    webhookId: string,
    payload?: unknown
  ): Promise<{
    success: boolean;
    statusCode?: number;
    response?: string;
    error?: string;
    duration?: number;
  }> => {
    return invoke('webhook_test', { webhookId, payload });
  },

  /**
   * Trigger webhook
   */
  triggerWebhook: async (
    webhookId: string,
    event: WebhookEvent,
    payload: unknown
  ): Promise<WebhookDelivery> => {
    return invoke<WebhookDelivery>('webhook_trigger', {
      webhookId,
      event,
      payload,
    });
  },

  /**
   * Get webhook deliveries
   */
  getDeliveries: async (
    webhookId: string,
    options?: { limit?: number; status?: string }
  ): Promise<WebhookDelivery[]> => {
    return invoke<WebhookDelivery[]>('webhook_get_deliveries', {
      webhookId,
      options,
    });
  },

  /**
   * Retry delivery
   */
  retryDelivery: async (deliveryId: string): Promise<WebhookDelivery> => {
    return invoke<WebhookDelivery>('webhook_retry_delivery', { deliveryId });
  },

  /**
   * Generate incoming webhook URL
   */
  generateIncomingUrl: async (): Promise<{
    url: string;
    secret: string;
  }> => {
    return invoke('webhook_generate_incoming_url');
  },
};

// ============================================================================
// API Connector Service
// ============================================================================

export const APIConnectorService = {
  /**
   * Create an API connector
   */
  createConnector: async (
    connector: Omit<APIConnector, 'id' | 'createdAt' | 'status' | 'stats'>
  ): Promise<APIConnector> => {
    TelemetryService.trackEvent('api_connector_created');

    return invoke<APIConnector>('api_connector_create', { connector });
  },

  /**
   * Get all connectors
   */
  getConnectors: async (): Promise<APIConnector[]> => {
    return invoke<APIConnector[]>('api_connector_get_all');
  },

  /**
   * Get connector by ID
   */
  getConnector: async (connectorId: string): Promise<APIConnector | null> => {
    return invoke<APIConnector | null>('api_connector_get', { connectorId });
  },

  /**
   * Update connector
   */
  updateConnector: async (
    connectorId: string,
    updates: Partial<APIConnector>
  ): Promise<APIConnector> => {
    return invoke<APIConnector>('api_connector_update', { connectorId, updates });
  },

  /**
   * Delete connector
   */
  deleteConnector: async (connectorId: string): Promise<void> => {
    return invoke('api_connector_delete', { connectorId });
  },

  /**
   * Execute API request
   */
  executeRequest: async (request: APIRequest): Promise<APIResponse> => {
    const spanId = TelemetryService.startSpan('api.connector.request', {
      kind: SpanKind.CLIENT,
    });

    try {
      const response = await invoke<APIResponse>('api_connector_execute', {
        request,
      });
      TelemetryService.endSpan(spanId);
      return response;
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) });
      throw error;
    }
  },

  /**
   * Test endpoint
   */
  testEndpoint: async (
    connectorId: string,
    endpointId: string,
    testData?: Record<string, unknown>
  ): Promise<APIResponse> => {
    return invoke<APIResponse>('api_connector_test_endpoint', {
      connectorId,
      endpointId,
      testData,
    });
  },

  /**
   * Import OpenAPI spec
   */
  importOpenAPI: async (
    spec: string,
    name: string
  ): Promise<APIConnector> => {
    return invoke<APIConnector>('api_connector_import_openapi', { spec, name });
  },

  /**
   * Export OpenAPI spec
   */
  exportOpenAPI: async (connectorId: string): Promise<string> => {
    return invoke<string>('api_connector_export_openapi', { connectorId });
  },

  /**
   * Add endpoint
   */
  addEndpoint: async (
    connectorId: string,
    endpoint: Omit<APIEndpoint, 'id'>
  ): Promise<APIEndpoint> => {
    return invoke<APIEndpoint>('api_connector_add_endpoint', {
      connectorId,
      endpoint,
    });
  },

  /**
   * Update endpoint
   */
  updateEndpoint: async (
    connectorId: string,
    endpointId: string,
    updates: Partial<APIEndpoint>
  ): Promise<APIEndpoint> => {
    return invoke<APIEndpoint>('api_connector_update_endpoint', {
      connectorId,
      endpointId,
      updates,
    });
  },

  /**
   * Delete endpoint
   */
  deleteEndpoint: async (
    connectorId: string,
    endpointId: string
  ): Promise<void> => {
    return invoke('api_connector_delete_endpoint', { connectorId, endpointId });
  },
};

// ============================================================================
// OAuth2 Service
// ============================================================================

export const OAuth2Service = {
  /**
   * Start OAuth2 flow
   */
  startFlow: async (
    integrationId: string
  ): Promise<{ authUrl: string; state: string }> => {
    return invoke('oauth2_start_flow', { integrationId });
  },

  /**
   * Complete OAuth2 flow
   */
  completeFlow: async (
    integrationId: string,
    code: string,
    state: string
  ): Promise<void> => {
    TelemetryService.trackEvent('oauth2_completed');

    return invoke('oauth2_complete_flow', { integrationId, code, state });
  },

  /**
   * Refresh token
   */
  refreshToken: async (integrationId: string): Promise<void> => {
    return invoke('oauth2_refresh_token', { integrationId });
  },

  /**
   * Revoke token
   */
  revokeToken: async (integrationId: string): Promise<void> => {
    return invoke('oauth2_revoke_token', { integrationId });
  },

  /**
   * Get token status
   */
  getTokenStatus: async (
    integrationId: string
  ): Promise<{
    isValid: boolean;
    expiresAt?: number;
    scopes: string[];
  }> => {
    return invoke('oauth2_get_token_status', { integrationId });
  },
};

// ============================================================================
// Zapier Service
// ============================================================================

export const ZapierService = {
  /**
   * Create Zapier integration
   */
  createIntegration: async (
    config: {
      name: string;
      webhookUrl: string;
    }
  ): Promise<ZapierIntegration> => {
    TelemetryService.trackEvent('zapier_integration_created');

    return invoke<ZapierIntegration>('zapier_create_integration', { config });
  },

  /**
   * Add trigger
   */
  addTrigger: async (
    integrationId: string,
    trigger: Omit<ZapierTrigger, 'id'>
  ): Promise<ZapierTrigger> => {
    return invoke<ZapierTrigger>('zapier_add_trigger', {
      integrationId,
      trigger,
    });
  },

  /**
   * Remove trigger
   */
  removeTrigger: async (
    integrationId: string,
    triggerId: string
  ): Promise<void> => {
    return invoke('zapier_remove_trigger', { integrationId, triggerId });
  },

  /**
   * Test trigger
   */
  testTrigger: async (
    integrationId: string,
    triggerId: string,
    sampleData?: unknown
  ): Promise<{ success: boolean; response?: unknown; error?: string }> => {
    return invoke('zapier_test_trigger', {
      integrationId,
      triggerId,
      sampleData,
    });
  },
};

// ============================================================================
// n8n Service
// ============================================================================

export const N8nService = {
  /**
   * Create n8n integration
   */
  createIntegration: async (
    config: {
      name: string;
      instanceUrl: string;
      apiKey: string;
    }
  ): Promise<N8nIntegration> => {
    TelemetryService.trackEvent('n8n_integration_created');

    return invoke<N8nIntegration>('n8n_create_integration', { config });
  },

  /**
   * List workflows
   */
  listWorkflows: async (integrationId: string): Promise<N8nWorkflow[]> => {
    return invoke<N8nWorkflow[]>('n8n_list_workflows', { integrationId });
  },

  /**
   * Execute workflow
   */
  executeWorkflow: async (
    integrationId: string,
    workflowId: string,
    inputData?: unknown
  ): Promise<{ executionId: string; status: string }> => {
    return invoke('n8n_execute_workflow', {
      integrationId,
      workflowId,
      inputData,
    });
  },

  /**
   * Get workflow execution status
   */
  getExecutionStatus: async (
    integrationId: string,
    executionId: string
  ): Promise<{
    status: 'running' | 'success' | 'error';
    data?: unknown;
    error?: string;
  }> => {
    return invoke('n8n_get_execution_status', { integrationId, executionId });
  },
};

// ============================================================================
// Slack Service
// ============================================================================

export const SlackService = {
  /**
   * Create Slack integration
   */
  createIntegration: async (
    config: {
      name: string;
      botToken: string;
    }
  ): Promise<SlackIntegration> => {
    TelemetryService.trackEvent('slack_integration_created');

    return invoke<SlackIntegration>('slack_create_integration', { config });
  },

  /**
   * List channels
   */
  listChannels: async (integrationId: string): Promise<SlackChannel[]> => {
    return invoke<SlackChannel[]>('slack_list_channels', { integrationId });
  },

  /**
   * Send message
   */
  sendMessage: async (
    integrationId: string,
    channelId: string,
    message: string | { text: string; blocks?: unknown[] }
  ): Promise<{ ok: boolean; ts?: string; error?: string }> => {
    return invoke('slack_send_message', { integrationId, channelId, message });
  },

  /**
   * Send notification
   */
  sendNotification: async (
    integrationId: string,
    notification: {
      type: 'success' | 'failure' | 'warning' | 'info';
      title: string;
      message: string;
      fields?: { title: string; value: string; short?: boolean }[];
    }
  ): Promise<void> => {
    return invoke('slack_send_notification', { integrationId, notification });
  },
};

// ============================================================================
// Export
// ============================================================================

export const IntegrationServices = {
  Integration: IntegrationService,
  Webhook: WebhookService,
  APIConnector: APIConnectorService,
  OAuth2: OAuth2Service,
  Zapier: ZapierService,
  N8n: N8nService,
  Slack: SlackService,
};

export default IntegrationServices;
