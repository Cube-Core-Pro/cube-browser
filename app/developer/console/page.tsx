'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Copy,
  ChevronRight,
  ChevronDown,
  Code,
  FileJson,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Book,
  Zap,
  Database,
  Globe,
  Lock,
  Key,
  Settings,
  Send,
  Trash2,
  Plus,
  Save,
  History,
  Bookmark,
  Star,
  MoreVertical,
  ArrowRight,
  Loader,
  Info
} from 'lucide-react';
import './console.css';

interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  name: string;
  description: string;
  category: string;
  requiresAuth: boolean;
  params?: { name: string; type: string; required: boolean; description: string }[];
  body?: { name: string; type: string; required: boolean; description: string }[];
}

interface RequestHistory {
  id: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  timestamp: string;
  response?: unknown;
}

interface SavedRequest {
  id: string;
  name: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
}

const endpoints: APIEndpoint[] = [
  {
    id: '1',
    method: 'GET',
    path: '/api/v1/users',
    name: 'List Users',
    description: 'Retrieve a list of all users in your organization',
    category: 'Users',
    requiresAuth: true,
    params: [
      { name: 'page', type: 'integer', required: false, description: 'Page number' },
      { name: 'limit', type: 'integer', required: false, description: 'Items per page' },
      { name: 'search', type: 'string', required: false, description: 'Search query' }
    ]
  },
  {
    id: '2',
    method: 'POST',
    path: '/api/v1/users',
    name: 'Create User',
    description: 'Create a new user in your organization',
    category: 'Users',
    requiresAuth: true,
    body: [
      { name: 'email', type: 'string', required: true, description: 'User email address' },
      { name: 'name', type: 'string', required: true, description: 'Full name' },
      { name: 'role', type: 'string', required: false, description: 'User role (admin, member)' }
    ]
  },
  {
    id: '3',
    method: 'GET',
    path: '/api/v1/users/:id',
    name: 'Get User',
    description: 'Retrieve a specific user by ID',
    category: 'Users',
    requiresAuth: true,
    params: [
      { name: 'id', type: 'string', required: true, description: 'User ID' }
    ]
  },
  {
    id: '4',
    method: 'PUT',
    path: '/api/v1/users/:id',
    name: 'Update User',
    description: 'Update an existing user',
    category: 'Users',
    requiresAuth: true,
    body: [
      { name: 'name', type: 'string', required: false, description: 'Full name' },
      { name: 'role', type: 'string', required: false, description: 'User role' }
    ]
  },
  {
    id: '5',
    method: 'DELETE',
    path: '/api/v1/users/:id',
    name: 'Delete User',
    description: 'Delete a user from your organization',
    category: 'Users',
    requiresAuth: true
  },
  {
    id: '6',
    method: 'GET',
    path: '/api/v1/automations',
    name: 'List Automations',
    description: 'Get all automation workflows',
    category: 'Automations',
    requiresAuth: true,
    params: [
      { name: 'status', type: 'string', required: false, description: 'Filter by status' }
    ]
  },
  {
    id: '7',
    method: 'POST',
    path: '/api/v1/automations',
    name: 'Create Automation',
    description: 'Create a new automation workflow',
    category: 'Automations',
    requiresAuth: true,
    body: [
      { name: 'name', type: 'string', required: true, description: 'Automation name' },
      { name: 'trigger', type: 'object', required: true, description: 'Trigger configuration' },
      { name: 'actions', type: 'array', required: true, description: 'Action steps' }
    ]
  },
  {
    id: '8',
    method: 'POST',
    path: '/api/v1/automations/:id/execute',
    name: 'Execute Automation',
    description: 'Manually trigger an automation',
    category: 'Automations',
    requiresAuth: true,
    body: [
      { name: 'input', type: 'object', required: false, description: 'Input data for execution' }
    ]
  },
  {
    id: '9',
    method: 'GET',
    path: '/api/v1/data/extract',
    name: 'Extract Data',
    description: 'Extract data from a URL using selectors',
    category: 'Data',
    requiresAuth: true,
    params: [
      { name: 'url', type: 'string', required: true, description: 'Target URL' },
      { name: 'selectors', type: 'string', required: true, description: 'CSS selectors' }
    ]
  },
  {
    id: '10',
    method: 'POST',
    path: '/api/v1/webhooks',
    name: 'Create Webhook',
    description: 'Register a new webhook endpoint',
    category: 'Webhooks',
    requiresAuth: true,
    body: [
      { name: 'url', type: 'string', required: true, description: 'Webhook URL' },
      { name: 'events', type: 'array', required: true, description: 'Events to subscribe to' },
      { name: 'secret', type: 'string', required: false, description: 'Signing secret' }
    ]
  }
];

const requestHistory: RequestHistory[] = [
  { id: '1', method: 'GET', path: '/api/v1/users', status: 200, duration: 124, timestamp: '2 min ago' },
  { id: '2', method: 'POST', path: '/api/v1/automations', status: 201, duration: 356, timestamp: '5 min ago' },
  { id: '3', method: 'GET', path: '/api/v1/users/123', status: 404, duration: 89, timestamp: '12 min ago' },
  { id: '4', method: 'DELETE', path: '/api/v1/webhooks/456', status: 204, duration: 201, timestamp: '25 min ago' },
  { id: '5', method: 'PUT', path: '/api/v1/users/789', status: 400, duration: 67, timestamp: '1 hour ago' }
];

const savedRequests: SavedRequest[] = [
  { id: '1', name: 'Get Active Users', method: 'GET', path: '/api/v1/users?status=active', headers: {}, body: '' },
  { id: '2', name: 'Create Test User', method: 'POST', path: '/api/v1/users', headers: { 'Content-Type': 'application/json' }, body: '{"email":"test@example.com","name":"Test User"}' },
  { id: '3', name: 'List All Automations', method: 'GET', path: '/api/v1/automations', headers: {}, body: '' }
];

export default function DeveloperConsolePage() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'console' | 'history' | 'saved'>('console');
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Users', 'Automations']));
  const [searchQuery, setSearchQuery] = useState('');
  
  // Console state
  const [method, setMethod] = useState<string>('GET');
  const [path, setPath] = useState('/api/v1/');
  const [headers, setHeaders] = useState('{\n  "Authorization": "Bearer sk_live_PLACEHOLDER...",\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState('{\n  \n}');
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const categories = [...new Set(endpoints.map(e => e.category))];

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const selectEndpoint = (endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint);
    setMethod(endpoint.method);
    setPath(endpoint.path);
    if (endpoint.body) {
      const bodyTemplate: Record<string, unknown> = {};
      endpoint.body.forEach(field => {
        bodyTemplate[field.name] = field.type === 'string' ? '' : field.type === 'array' ? [] : {};
      });
      setBody(JSON.stringify(bodyTemplate, null, 2));
    } else {
      setBody('{\n  \n}');
    }
  };

  const executeRequest = () => {
    setIsLoading(true);
    // Simulated API call
    setTimeout(() => {
      setResponseStatus(200);
      setResponse(JSON.stringify({
        success: true,
        data: {
          users: [
            { id: '1', email: 'john@example.com', name: 'John Doe', role: 'admin' },
            { id: '2', email: 'jane@example.com', name: 'Jane Smith', role: 'member' }
          ],
          pagination: { page: 1, limit: 10, total: 2 }
        }
      }, null, 2));
      setIsLoading(false);
    }, 800);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'method-get';
      case 'POST': return 'method-post';
      case 'PUT': return 'method-put';
      case 'DELETE': return 'method-delete';
      case 'PATCH': return 'method-patch';
      default: return '';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 400 && status < 500) return 'status-error';
    if (status >= 500) return 'status-error';
    return '';
  };

  const filteredEndpoints = endpoints.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="developer-console">
      {/* Header */}
      <div className="developer-console__header">
        <div className="developer-console__title-section">
          <div className="developer-console__icon">
            <Terminal size={28} />
          </div>
          <div>
            <h1>Developer Console</h1>
            <p>Explore and test API endpoints interactively</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Book size={18} />
            API Docs
          </button>
          <button className="btn-outline">
            <Key size={18} />
            API Keys
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="console-tabs">
        <button
          className={`console-tab ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('explorer')}
        >
          <Code size={16} />
          API Explorer
        </button>
        <button
          className={`console-tab ${activeTab === 'console' ? 'active' : ''}`}
          onClick={() => setActiveTab('console')}
        >
          <Terminal size={16} />
          Console
        </button>
        <button
          className={`console-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          History
          <span className="tab-count">{requestHistory.length}</span>
        </button>
        <button
          className={`console-tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark size={16} />
          Saved
          <span className="tab-count">{savedRequests.length}</span>
        </button>
      </div>

      <div className="console-main">
        {/* API Explorer */}
        {activeTab === 'explorer' && (
          <div className="api-explorer">
            <aside className="endpoints-sidebar">
              <div className="sidebar-header">
                <h3>Endpoints</h3>
                <div className="search-mini">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <nav className="endpoints-nav">
                {categories.map(category => (
                  <div key={category} className="endpoint-category">
                    <button
                      className="category-toggle"
                      onClick={() => toggleCategory(category)}
                    >
                      {expandedCategories.has(category) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                      <span>{category}</span>
                      <span className="category-count">
                        {filteredEndpoints.filter(e => e.category === category).length}
                      </span>
                    </button>
                    {expandedCategories.has(category) && (
                      <div className="category-endpoints">
                        {filteredEndpoints
                          .filter(e => e.category === category)
                          .map(endpoint => (
                            <button
                              key={endpoint.id}
                              className={`endpoint-item ${selectedEndpoint?.id === endpoint.id ? 'selected' : ''}`}
                              onClick={() => selectEndpoint(endpoint)}
                            >
                              <span className={`method-badge ${getMethodColor(endpoint.method)}`}>
                                {endpoint.method}
                              </span>
                              <span className="endpoint-path">{endpoint.path}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </aside>

            <div className="endpoint-detail">
              {selectedEndpoint ? (
                <>
                  <div className="endpoint-header">
                    <div className="endpoint-title">
                      <span className={`method-badge large ${getMethodColor(selectedEndpoint.method)}`}>
                        {selectedEndpoint.method}
                      </span>
                      <code>{selectedEndpoint.path}</code>
                    </div>
                    <h2>{selectedEndpoint.name}</h2>
                    <p>{selectedEndpoint.description}</p>
                    {selectedEndpoint.requiresAuth && (
                      <div className="auth-badge">
                        <Lock size={12} />
                        Requires Authentication
                      </div>
                    )}
                  </div>

                  {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                    <div className="params-section">
                      <h3>Parameters</h3>
                      <table className="params-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEndpoint.params.map(param => (
                            <tr key={param.name}>
                              <td><code>{param.name}</code></td>
                              <td><span className="type-badge">{param.type}</span></td>
                              <td>{param.required ? <CheckCircle size={14} className="required" /> : <span className="optional">Optional</span>}</td>
                              <td>{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedEndpoint.body && selectedEndpoint.body.length > 0 && (
                    <div className="params-section">
                      <h3>Request Body</h3>
                      <table className="params-table">
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEndpoint.body.map(field => (
                            <tr key={field.name}>
                              <td><code>{field.name}</code></td>
                              <td><span className="type-badge">{field.type}</span></td>
                              <td>{field.required ? <CheckCircle size={14} className="required" /> : <span className="optional">Optional</span>}</td>
                              <td>{field.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="try-it-section">
                    <button className="btn-primary" onClick={() => {
                      setActiveTab('console');
                      selectEndpoint(selectedEndpoint);
                    }}>
                      <Play size={16} />
                      Try it out
                    </button>
                  </div>
                </>
              ) : (
                <div className="no-endpoint">
                  <Code size={48} />
                  <h3>Select an endpoint</h3>
                  <p>Choose an endpoint from the sidebar to view its documentation</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Console */}
        {activeTab === 'console' && (
          <div className="request-console">
            <div className="request-builder">
              <div className="request-url-bar">
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/api/v1/..."
                />
                <button className="send-btn" onClick={executeRequest} disabled={isLoading}>
                  {isLoading ? <Loader size={18} className="spin" /> : <Send size={18} />}
                  Send
                </button>
              </div>

              <div className="request-panels">
                <div className="request-panel">
                  <div className="panel-header">
                    <span>Headers</span>
                    <button className="panel-action">
                      <Plus size={14} />
                    </button>
                  </div>
                  <textarea
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    placeholder="Enter headers as JSON..."
                  />
                </div>

                <div className="request-panel">
                  <div className="panel-header">
                    <span>Body</span>
                    <div className="panel-actions">
                      <button className="panel-action">
                        <FileJson size={14} />
                        Format
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter request body..."
                  />
                </div>
              </div>
            </div>

            <div className="response-viewer">
              <div className="response-header">
                <span>Response</span>
                {responseStatus && (
                  <div className="response-meta">
                    <span className={`status-code ${getStatusColor(responseStatus)}`}>
                      {responseStatus}
                    </span>
                    <span className="response-time">124ms</span>
                  </div>
                )}
                <div className="response-actions">
                  <button className="panel-action" title="Copy">
                    <Copy size={14} />
                  </button>
                  <button className="panel-action" title="Save">
                    <Save size={14} />
                  </button>
                </div>
              </div>
              <div className="response-body">
                {response ? (
                  <pre><code>{response}</code></pre>
                ) : (
                  <div className="no-response">
                    <Terminal size={32} />
                    <p>Send a request to see the response</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="history-panel">
            <div className="history-header">
              <h3>Request History</h3>
              <button className="btn-outline small">
                <Trash2 size={14} />
                Clear All
              </button>
            </div>
            <div className="history-list">
              {requestHistory.map(item => (
                <div key={item.id} className="history-item">
                  <span className={`method-badge ${getMethodColor(item.method)}`}>
                    {item.method}
                  </span>
                  <code className="history-path">{item.path}</code>
                  <span className={`status-code ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="history-duration">{item.duration}ms</span>
                  <span className="history-time">{item.timestamp}</span>
                  <button className="icon-btn" title="Replay">
                    <RefreshCw size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Requests */}
        {activeTab === 'saved' && (
          <div className="saved-panel">
            <div className="saved-header">
              <h3>Saved Requests</h3>
              <button className="btn-primary small">
                <Plus size={14} />
                Save Current
              </button>
            </div>
            <div className="saved-list">
              {savedRequests.map(item => (
                <div key={item.id} className="saved-item">
                  <div className="saved-info">
                    <div className="saved-title">
                      <Star size={14} className="star-icon" />
                      <span>{item.name}</span>
                    </div>
                    <div className="saved-meta">
                      <span className={`method-badge small ${getMethodColor(item.method)}`}>
                        {item.method}
                      </span>
                      <code>{item.path}</code>
                    </div>
                  </div>
                  <div className="saved-actions">
                    <button className="icon-btn" title="Load">
                      <Play size={14} />
                    </button>
                    <button className="icon-btn" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
