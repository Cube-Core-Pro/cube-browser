/**
 * WebhookBuilder - CUBE Elite v6
 * Constructor visual de webhooks con testing en tiempo real
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  WebhookConfig,
  WebhookAuth,
  WebhookHeader,
  WebhookParam,
  WebhookBodySchema,
  WebhookTest,
  WebhookStats,
} from '../../types/automation-advanced';
import './WebhookBuilder.css';

// ============================================================================
// INTERFACES
// ============================================================================

interface WebhookBuilderProps {
  webhook?: WebhookConfig;
  onSave: (webhook: WebhookConfig) => void;
  onClose: () => void;
  onTest?: (webhook: WebhookConfig, testData: Partial<WebhookTest>) => Promise<WebhookTest>;
  baseUrl?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ANY'] as const;
const AUTH_TYPES = ['none', 'basic', 'bearer', 'api_key', 'hmac', 'oauth2'] as const;
const BODY_TYPES = ['json', 'form', 'xml', 'raw'] as const;

const STATUS_CODES = [
  { code: 200, name: 'OK' },
  { code: 201, name: 'Created' },
  { code: 204, name: 'No Content' },
  { code: 400, name: 'Bad Request' },
  { code: 401, name: 'Unauthorized' },
  { code: 403, name: 'Forbidden' },
  { code: 404, name: 'Not Found' },
  { code: 500, name: 'Internal Server Error' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const WebhookBuilder: React.FC<WebhookBuilderProps> = ({
  webhook,
  onSave,
  onClose,
  onTest,
  baseUrl = 'https://cube-elite.app/webhooks',
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'basic' | 'auth' | 'schema' | 'response' | 'test' | 'stats'>('basic');
  const [name, setName] = useState(webhook?.name || '');
  const [description, setDescription] = useState(webhook?.description || '');
  const [method, setMethod] = useState<WebhookConfig['method']>(webhook?.method || 'POST');
  const [path, setPath] = useState(webhook?.path || `/webhook-${Date.now()}`);
  const [status, setStatus] = useState<WebhookConfig['status']>(webhook?.status || 'inactive');

  // Auth state
  const [authType, setAuthType] = useState<WebhookAuth['type']>(webhook?.authentication.type || 'none');
  const [authConfig, setAuthConfig] = useState<WebhookAuth['config']>(webhook?.authentication.config || {});

  // Headers & Params
  const [headers, setHeaders] = useState<WebhookHeader[]>(webhook?.headers || []);
  const [queryParams, setQueryParams] = useState<WebhookParam[]>(webhook?.queryParams || []);

  // Body Schema
  const [bodySchema, setBodySchema] = useState<WebhookBodySchema>(
    webhook?.bodySchema || { type: 'json', required: false }
  );

  // Response Config
  const [successCode, setSuccessCode] = useState(webhook?.responseConfig.successCode || 200);
  const [successBody, setSuccessBody] = useState(
    typeof webhook?.responseConfig.successBody === 'object'
      ? JSON.stringify(webhook.responseConfig.successBody, null, 2)
      : webhook?.responseConfig.successBody || '{"success": true}'
  );
  const [errorResponses, setErrorResponses] = useState(webhook?.responseConfig.errorResponses || []);

  // Rate Limit
  const [rateLimitEnabled, setRateLimitEnabled] = useState(webhook?.rateLimit?.enabled || false);
  const [rateLimitMax, setRateLimitMax] = useState(webhook?.rateLimit?.maxRequests || 100);
  const [rateLimitWindow, setRateLimitWindow] = useState(webhook?.rateLimit?.windowMs || 60000);

  // CORS
  const [corsEnabled, setCorsEnabled] = useState<boolean>(webhook?.cors?.enabled ?? true);
  const [corsOrigins, setCorsOrigins] = useState<string[]>(webhook?.cors?.origins || ['*']);

  // Test state
  const [testMethod, setTestMethod] = useState<string>(method === 'ANY' ? 'POST' : method);
  const [testHeaders, setTestHeaders] = useState<Record<string, string>>({});
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [testBody, setTestBody] = useState('');
  const [testResult, setTestResult] = useState<WebhookTest | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Computed
  const fullUrl = useMemo(() => `${baseUrl}${path}`, [baseUrl, path]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- stats is computed once from webhook
  const stats: WebhookStats = useMemo(() => webhook?.stats || {
    totalRequests: 0,
    successRequests: 0,
    errorRequests: 0,
    avgResponseTime: 0,
    requestsByDay: [],
  }, [webhook?.stats]);

  // Handlers
  const handleAddHeader = useCallback(() => {
    setHeaders([...headers, { name: '', required: false }]);
  }, [headers]);

  const handleUpdateHeader = useCallback((index: number, field: keyof WebhookHeader, value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  }, [headers]);

  const handleRemoveHeader = useCallback((index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  }, [headers]);

  const handleAddParam = useCallback(() => {
    setQueryParams([...queryParams, { name: '', required: false, type: 'string' }]);
  }, [queryParams]);

  const handleUpdateParam = useCallback((index: number, field: keyof WebhookParam, value: string | boolean) => {
    const newParams = [...queryParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setQueryParams(newParams);
  }, [queryParams]);

  const handleRemoveParam = useCallback((index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  }, [queryParams]);

  const handleAddErrorResponse = useCallback(() => {
    setErrorResponses([
      ...errorResponses,
      { code: 400, condition: '', body: '{"error": "Bad Request"}' },
    ]);
  }, [errorResponses]);

  const handleUpdateErrorResponse = useCallback(
    (index: number, field: string, value: string | number) => {
      const newResponses = [...errorResponses];
      newResponses[index] = { ...newResponses[index], [field]: value };
      setErrorResponses(newResponses);
    },
    [errorResponses]
  );

  const handleRemoveErrorResponse = useCallback((index: number) => {
    setErrorResponses(errorResponses.filter((_, i) => i !== index));
  }, [errorResponses]);

  const handleTest = useCallback(async () => {
    if (!onTest) return;

    setIsTesting(true);
    try {
      const webhookConfig = buildWebhookConfig();
      const result = await onTest(webhookConfig, {
        method: testMethod,
        headers: testHeaders,
        queryParams: testParams,
        body: testBody || undefined,
      });
      setTestResult(result);
    } catch (error) {
      setTestResult({
        id: `test-${Date.now()}`,
        webhookId: webhook?.id || '',
        method: testMethod,
        headers: testHeaders,
        queryParams: testParams,
        body: testBody,
        response: {
          status: 500,
          headers: {},
          body: error instanceof Error ? error.message : 'Test failed',
          time: 0,
        },
        timestamp: Date.now(),
      });
    } finally {
      setIsTesting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- buildWebhookConfig defined below
  }, [onTest, testMethod, testHeaders, testParams, testBody, webhook?.id]);

  const buildWebhookConfig = useCallback((): WebhookConfig => {
    let parsedSuccessBody: string | Record<string, unknown>;
    try {
      parsedSuccessBody = JSON.parse(successBody);
    } catch {
      parsedSuccessBody = successBody;
    }

    return {
      id: webhook?.id || `webhook-${Date.now()}`,
      name,
      description,
      method,
      path,
      authentication: {
        type: authType,
        config: authType !== 'none' ? authConfig : undefined,
      },
      headers: headers.filter(h => h.name),
      queryParams: queryParams.filter(p => p.name),
      bodySchema,
      responseConfig: {
        successCode,
        successBody: parsedSuccessBody,
        errorResponses: errorResponses.map(er => ({
          ...er,
          body: typeof er.body === 'string' ? JSON.parse(er.body) : er.body,
        })),
      },
      rateLimit: rateLimitEnabled
        ? { enabled: true, maxRequests: rateLimitMax, windowMs: rateLimitWindow }
        : undefined,
      cors: corsEnabled
        ? { enabled: true, origins: corsOrigins, methods: [method], headers: ['Content-Type'] }
        : undefined,
      status,
      createdAt: webhook?.createdAt || Date.now(),
      updatedAt: Date.now(),
      stats,
    };
  }, [
    webhook,
    name,
    description,
    method,
    path,
    authType,
    authConfig,
    headers,
    queryParams,
    bodySchema,
    successCode,
    successBody,
    errorResponses,
    rateLimitEnabled,
    rateLimitMax,
    rateLimitWindow,
    corsEnabled,
    corsOrigins,
    status,
    stats,
  ]);

  const handleSave = useCallback(() => {
    const config = buildWebhookConfig();
    onSave(config);
    onClose();
  }, [buildWebhookConfig, onSave, onClose]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Render auth config based on type
  const renderAuthConfig = () => {
    switch (authType) {
      case 'basic':
        return (
          <div className="auth-config">
            <div className="config-field">
              <label>Username</label>
              <input
                type="text"
                value={authConfig?.username || ''}
                onChange={(e) => setAuthConfig({ ...authConfig, username: e.target.value })}
              />
            </div>
            <div className="config-field">
              <label>Password</label>
              <input
                type="password"
                value={authConfig?.password || ''}
                onChange={(e) => setAuthConfig({ ...authConfig, password: e.target.value })}
              />
            </div>
          </div>
        );
      case 'bearer':
        return (
          <div className="auth-config">
            <div className="config-field">
              <label>Bearer Token</label>
              <input
                type="password"
                value={authConfig?.token || ''}
                onChange={(e) => setAuthConfig({ ...authConfig, token: e.target.value })}
                placeholder="Enter your bearer token"
              />
            </div>
          </div>
        );
      case 'api_key':
        return (
          <div className="auth-config">
            <div className="config-field">
              <label>Header Name</label>
              <input
                type="text"
                value={authConfig?.apiKeyHeader || 'X-API-Key'}
                onChange={(e) => setAuthConfig({ ...authConfig, apiKeyHeader: e.target.value })}
              />
            </div>
            <div className="config-field">
              <label>API Key Value</label>
              <input
                type="password"
                value={authConfig?.apiKeyValue || ''}
                onChange={(e) => setAuthConfig({ ...authConfig, apiKeyValue: e.target.value })}
              />
            </div>
          </div>
        );
      case 'hmac':
        return (
          <div className="auth-config">
            <div className="config-field">
              <label>HMAC Secret</label>
              <input
                type="password"
                value={authConfig?.hmacSecret || ''}
                onChange={(e) => setAuthConfig({ ...authConfig, hmacSecret: e.target.value })}
              />
            </div>
            <div className="config-field">
              <label>Signature Header</label>
              <input
                type="text"
                value={authConfig?.hmacHeader || 'X-Signature'}
                onChange={(e) => setAuthConfig({ ...authConfig, hmacHeader: e.target.value })}
              />
            </div>
          </div>
        );
      case 'oauth2':
        return (
          <div className="auth-config">
            <div className="config-field">
              <label>Client ID</label>
              <input
                type="text"
                value={authConfig?.oauth2Config?.clientId || ''}
                onChange={(e) =>
                  setAuthConfig({
                    ...authConfig,
                    oauth2Config: { 
                      clientId: e.target.value,
                      clientSecret: authConfig?.oauth2Config?.clientSecret || '',
                      tokenUrl: authConfig?.oauth2Config?.tokenUrl || '',
                      scopes: authConfig?.oauth2Config?.scopes || [],
                    },
                  })
                }
              />
            </div>
            <div className="config-field">
              <label>Client Secret</label>
              <input
                type="password"
                value={authConfig?.oauth2Config?.clientSecret || ''}
                onChange={(e) =>
                  setAuthConfig({
                    ...authConfig,
                    oauth2Config: { 
                      clientId: authConfig?.oauth2Config?.clientId || '',
                      clientSecret: e.target.value,
                      tokenUrl: authConfig?.oauth2Config?.tokenUrl || '',
                      scopes: authConfig?.oauth2Config?.scopes || [],
                    },
                  })
                }
              />
            </div>
            <div className="config-field">
              <label>Token URL</label>
              <input
                type="url"
                value={authConfig?.oauth2Config?.tokenUrl || ''}
                onChange={(e) =>
                  setAuthConfig({
                    ...authConfig,
                    oauth2Config: { 
                      clientId: authConfig?.oauth2Config?.clientId || '',
                      clientSecret: authConfig?.oauth2Config?.clientSecret || '',
                      tokenUrl: e.target.value,
                      scopes: authConfig?.oauth2Config?.scopes || [],
                    },
                  })
                }
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="auth-config">
            <p className="hint">No authentication required. Anyone with the URL can trigger this webhook.</p>
          </div>
        );
    }
  };

  return (
    <div className="webhook-builder">
      <div className="builder-header">
        <div className="header-content">
          <h3>🔗 {webhook ? 'Edit' : 'Create'} Webhook</h3>
          <div className="webhook-url">
            <span className="method-badge" data-method={method}>{method}</span>
            <code>{fullUrl}</code>
            <button className="copy-btn" onClick={() => copyToClipboard(fullUrl)} title="Copy URL">
              📋
            </button>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="builder-tabs">
        <button className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>
          Basic
        </button>
        <button className={`tab ${activeTab === 'auth' ? 'active' : ''}`} onClick={() => setActiveTab('auth')}>
          Auth
        </button>
        <button className={`tab ${activeTab === 'schema' ? 'active' : ''}`} onClick={() => setActiveTab('schema')}>
          Schema
        </button>
        <button className={`tab ${activeTab === 'response' ? 'active' : ''}`} onClick={() => setActiveTab('response')}>
          Response
        </button>
        <button className={`tab ${activeTab === 'test' ? 'active' : ''}`} onClick={() => setActiveTab('test')}>
          Test
        </button>
        <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          Stats
        </button>
      </div>

      <div className="builder-content">
        {activeTab === 'basic' && (
          <div className="tab-content">
            <div className="config-section">
              <h4>Webhook Information</h4>
              <div className="config-field">
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Webhook"
                />
              </div>
              <div className="config-field">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this webhook does..."
                  rows={3}
                />
              </div>
            </div>

            <div className="config-section">
              <h4>Endpoint Configuration</h4>
              <div className="config-row">
                <div className="config-field">
                  <label>Method</label>
                  <select value={method} onChange={(e) => setMethod(e.target.value as WebhookConfig['method'])}>
                    {HTTP_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="config-field" style={{ flex: 2 }}>
                  <label>Path</label>
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value.startsWith('/') ? e.target.value : `/${e.target.value}`)}
                    placeholder="/my-webhook"
                  />
                </div>
              </div>
            </div>

            <div className="config-section">
              <h4>Status</h4>
              <div className="status-toggle">
                {(['active', 'inactive', 'testing'] as const).map(s => (
                  <button
                    key={s}
                    className={`status-btn ${status === s ? 'active' : ''}`}
                    onClick={() => setStatus(s)}
                  >
                    <span className={`status-dot ${s}`} />
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-section">
              <h4>Rate Limiting</h4>
              <div className="config-field checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={rateLimitEnabled}
                    onChange={(e) => setRateLimitEnabled(e.target.checked)}
                  />
                  Enable rate limiting
                </label>
              </div>
              {rateLimitEnabled && (
                <div className="config-row">
                  <div className="config-field">
                    <label>Max Requests</label>
                    <input
                      type="number"
                      value={rateLimitMax}
                      onChange={(e) => setRateLimitMax(parseInt(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="config-field">
                    <label>Window (ms)</label>
                    <input
                      type="number"
                      value={rateLimitWindow}
                      onChange={(e) => setRateLimitWindow(parseInt(e.target.value))}
                      min={1000}
                      step={1000}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="config-section">
              <h4>CORS</h4>
              <div className="config-field checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={corsEnabled}
                    onChange={(e) => setCorsEnabled(e.target.checked)}
                  />
                  Enable CORS
                </label>
              </div>
              {corsEnabled && (
                <div className="config-field">
                  <label>Allowed Origins (comma-separated)</label>
                  <input
                    type="text"
                    value={corsOrigins.join(', ')}
                    onChange={(e) => setCorsOrigins(e.target.value.split(',').map(o => o.trim()))}
                    placeholder="* or https://example.com"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="tab-content">
            <div className="config-section">
              <h4>Authentication Type</h4>
              <div className="auth-type-grid">
                {AUTH_TYPES.map(type => (
                  <button
                    key={type}
                    className={`auth-type-btn ${authType === type ? 'active' : ''}`}
                    onClick={() => setAuthType(type)}
                  >
                    <span className="auth-icon">
                      {type === 'none' && '🔓'}
                      {type === 'basic' && '👤'}
                      {type === 'bearer' && '🔑'}
                      {type === 'api_key' && '🗝️'}
                      {type === 'hmac' && '🔐'}
                      {type === 'oauth2' && '🛡️'}
                    </span>
                    <span className="auth-name">{type === 'none' ? 'None' : type.replace('_', ' ').toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="config-section">
              <h4>Configuration</h4>
              {renderAuthConfig()}
            </div>
          </div>
        )}

        {activeTab === 'schema' && (
          <div className="tab-content">
            <div className="config-section">
              <h4>Headers</h4>
              <div className="items-list">
                {headers.map((header, index) => (
                  <div key={index} className="item-row">
                    <input
                      type="text"
                      value={header.name}
                      onChange={(e) => handleUpdateHeader(index, 'name', e.target.value)}
                      placeholder="Header name"
                    />
                    <label className="required-checkbox">
                      <input
                        type="checkbox"
                        checked={header.required}
                        onChange={(e) => handleUpdateHeader(index, 'required', e.target.checked)}
                      />
                      Required
                    </label>
                    <button className="remove-btn" onClick={() => handleRemoveHeader(index)}>×</button>
                  </div>
                ))}
                <button className="add-btn" onClick={handleAddHeader}>+ Add Header</button>
              </div>
            </div>

            <div className="config-section">
              <h4>Query Parameters</h4>
              <div className="items-list">
                {queryParams.map((param, index) => (
                  <div key={index} className="item-row">
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => handleUpdateParam(index, 'name', e.target.value)}
                      placeholder="Parameter name"
                    />
                    <select
                      value={param.type}
                      onChange={(e) => handleUpdateParam(index, 'type', e.target.value)}
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="array">Array</option>
                    </select>
                    <label className="required-checkbox">
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => handleUpdateParam(index, 'required', e.target.checked)}
                      />
                      Required
                    </label>
                    <button className="remove-btn" onClick={() => handleRemoveParam(index)}>×</button>
                  </div>
                ))}
                <button className="add-btn" onClick={handleAddParam}>+ Add Parameter</button>
              </div>
            </div>

            <div className="config-section">
              <h4>Request Body</h4>
              <div className="config-field">
                <label>Body Type</label>
                <select
                  value={bodySchema.type}
                  onChange={(e) => setBodySchema({ ...bodySchema, type: e.target.value as WebhookBodySchema['type'] })}
                >
                  {BODY_TYPES.map(t => (
                    <option key={t} value={t}>{t.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="config-field checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={bodySchema.required}
                    onChange={(e) => setBodySchema({ ...bodySchema, required: e.target.checked })}
                  />
                  Body is required
                </label>
              </div>
              <div className="config-field">
                <label>Example Body</label>
                <textarea
                  value={bodySchema.example || ''}
                  onChange={(e) => setBodySchema({ ...bodySchema, example: e.target.value })}
                  placeholder={bodySchema.type === 'json' ? '{\n  "key": "value"\n}' : 'Example body content'}
                  rows={6}
                  className="code-textarea"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'response' && (
          <div className="tab-content">
            <div className="config-section">
              <h4>Success Response</h4>
              <div className="config-field">
                <label>Status Code</label>
                <select
                  value={successCode}
                  onChange={(e) => setSuccessCode(parseInt(e.target.value))}
                >
                  {STATUS_CODES.filter(s => s.code < 400).map(s => (
                    <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="config-field">
                <label>Response Body (JSON)</label>
                <textarea
                  value={successBody}
                  onChange={(e) => setSuccessBody(e.target.value)}
                  rows={6}
                  className="code-textarea"
                />
              </div>
            </div>

            <div className="config-section">
              <h4>Error Responses</h4>
              <div className="error-responses-list">
                {errorResponses.map((er, index) => (
                  <div key={index} className="error-response-item">
                    <div className="error-response-header">
                      <select
                        value={er.code}
                        onChange={(e) => handleUpdateErrorResponse(index, 'code', parseInt(e.target.value))}
                      >
                        {STATUS_CODES.filter(s => s.code >= 400).map(s => (
                          <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                        ))}
                      </select>
                      <button className="remove-btn" onClick={() => handleRemoveErrorResponse(index)}>×</button>
                    </div>
                    <input
                      type="text"
                      value={er.condition}
                      onChange={(e) => handleUpdateErrorResponse(index, 'condition', e.target.value)}
                      placeholder="Condition (e.g., !body.email)"
                    />
                    <textarea
                      value={typeof er.body === 'string' ? er.body : JSON.stringify(er.body, null, 2)}
                      onChange={(e) => handleUpdateErrorResponse(index, 'body', e.target.value)}
                      rows={3}
                      className="code-textarea"
                    />
                  </div>
                ))}
                <button className="add-btn" onClick={handleAddErrorResponse}>+ Add Error Response</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="tab-content">
            <div className="config-section">
              <h4>Test Request</h4>
              <div className="test-url">
                <select value={testMethod} onChange={(e) => setTestMethod(e.target.value)}>
                  {HTTP_METHODS.filter(m => m !== 'ANY').map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <code>{fullUrl}</code>
              </div>

              <div className="config-field">
                <label>Test Headers (JSON)</label>
                <textarea
                  value={JSON.stringify(testHeaders, null, 2)}
                  onChange={(e) => {
                    try {
                      setTestHeaders(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON
                    }
                  }}
                  rows={4}
                  className="code-textarea"
                  placeholder='{"Content-Type": "application/json"}'
                />
              </div>

              <div className="config-field">
                <label>Test Query Params (JSON)</label>
                <textarea
                  value={JSON.stringify(testParams, null, 2)}
                  onChange={(e) => {
                    try {
                      setTestParams(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON
                    }
                  }}
                  rows={3}
                  className="code-textarea"
                  placeholder='{"key": "value"}'
                />
              </div>

              {['POST', 'PUT', 'PATCH'].includes(testMethod) && (
                <div className="config-field">
                  <label>Test Body</label>
                  <textarea
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    rows={6}
                    className="code-textarea"
                    placeholder='{"data": "test"}'
                  />
                </div>
              )}

              <button
                className="test-btn"
                onClick={handleTest}
                disabled={isTesting || !onTest}
              >
                {isTesting ? '⏳ Testing...' : '🚀 Send Test Request'}
              </button>
            </div>

            {testResult && (
              <div className="config-section">
                <h4>Test Result</h4>
                <div className={`test-result ${testResult.response && testResult.response.status < 400 ? 'success' : 'error'}`}>
                  <div className="test-result-header">
                    <span className="status-badge" data-status={testResult.response?.status}>
                      {testResult.response?.status || 'Error'}
                    </span>
                    <span className="response-time">{testResult.response?.time || 0}ms</span>
                  </div>
                  <div className="test-result-body">
                    <label>Response Headers</label>
                    <pre>{JSON.stringify(testResult.response?.headers || {}, null, 2)}</pre>
                    <label>Response Body</label>
                    <pre>{testResult.response?.body || 'No response body'}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="tab-content">
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{stats.totalRequests.toLocaleString()}</span>
                <span className="stat-label">Total Requests</span>
              </div>
              <div className="stat-card success">
                <span className="stat-value">{stats.successRequests.toLocaleString()}</span>
                <span className="stat-label">Successful</span>
              </div>
              <div className="stat-card error">
                <span className="stat-value">{stats.errorRequests.toLocaleString()}</span>
                <span className="stat-label">Errors</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.avgResponseTime.toFixed(0)}ms</span>
                <span className="stat-label">Avg Response</span>
              </div>
            </div>

            {stats.lastRequest && (
              <div className="config-section">
                <h4>Last Request</h4>
                <p className="last-request-time">
                  {new Date(stats.lastRequest).toLocaleString()}
                </p>
              </div>
            )}

            {stats.requestsByDay.length > 0 && (
              <div className="config-section">
                <h4>Requests by Day</h4>
                <div className="requests-chart">
                  {stats.requestsByDay.slice(-7).map((day, i) => (
                    <div key={i} className="chart-bar">
                      <div
                        className="bar-fill"
                        style={{
                          height: `${Math.min(100, (day.count / Math.max(...stats.requestsByDay.map(d => d.count))) * 100)}%`,
                        }}
                      />
                      <span className="bar-label">{day.date}</span>
                      <span className="bar-value">{day.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="builder-footer">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={!name || !path}>
          {webhook ? 'Update Webhook' : 'Create Webhook'}
        </button>
      </div>
    </div>
  );
};

export default WebhookBuilder;
