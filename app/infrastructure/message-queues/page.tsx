'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Server,
  Activity,
  Inbox,
  Send,
  RefreshCw,
  Settings,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Layers,
  Zap,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Trash2,
  Eye,
  Copy,
  Archive,
  ArrowRight,
  ArrowDown,
  Hash,
  Users,
  Calendar,
  Filter,
  RotateCcw
} from 'lucide-react';
import './message-queues.css';

interface Queue {
  id: string;
  name: string;
  type: 'standard' | 'fifo' | 'dead-letter' | 'priority';
  status: 'active' | 'paused' | 'error';
  messages: {
    pending: number;
    inFlight: number;
    delayed: number;
  };
  throughput: {
    enqueued: number;
    processed: number;
  };
  consumers: number;
  maxRetries: number;
  retentionDays: number;
  avgProcessingTime: number;
  errorRate: number;
  createdAt: string;
}

interface Consumer {
  id: string;
  queueId: string;
  queueName: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  messagesProcessed: number;
  lastActivity: string;
  processingRate: number;
  errorRate: number;
}

interface Message {
  id: string;
  queueId: string;
  queueName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead-letter';
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
  payload: string;
}

interface QueueMetric {
  timestamp: string;
  enqueued: number;
  processed: number;
  failed: number;
}

const QUEUES: Queue[] = [
  {
    id: '1',
    name: 'order-processing',
    type: 'fifo',
    status: 'active',
    messages: { pending: 1234, inFlight: 56, delayed: 23 },
    throughput: { enqueued: 456, processed: 445 },
    consumers: 8,
    maxRetries: 3,
    retentionDays: 14,
    avgProcessingTime: 234,
    errorRate: 0.5,
    createdAt: '2024-06-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'email-notifications',
    type: 'standard',
    status: 'active',
    messages: { pending: 5678, inFlight: 234, delayed: 0 },
    throughput: { enqueued: 1234, processed: 1200 },
    consumers: 4,
    maxRetries: 5,
    retentionDays: 7,
    avgProcessingTime: 89,
    errorRate: 0.2,
    createdAt: '2024-03-20T08:30:00Z'
  },
  {
    id: '3',
    name: 'webhook-delivery',
    type: 'priority',
    status: 'active',
    messages: { pending: 234, inFlight: 12, delayed: 45 },
    throughput: { enqueued: 567, processed: 550 },
    consumers: 6,
    maxRetries: 10,
    retentionDays: 30,
    avgProcessingTime: 456,
    errorRate: 1.2,
    createdAt: '2024-08-10T14:00:00Z'
  },
  {
    id: '4',
    name: 'analytics-events',
    type: 'standard',
    status: 'paused',
    messages: { pending: 45678, inFlight: 0, delayed: 0 },
    throughput: { enqueued: 0, processed: 0 },
    consumers: 0,
    maxRetries: 1,
    retentionDays: 3,
    avgProcessingTime: 45,
    errorRate: 0,
    createdAt: '2024-01-05T12:00:00Z'
  },
  {
    id: '5',
    name: 'order-processing-dlq',
    type: 'dead-letter',
    status: 'active',
    messages: { pending: 156, inFlight: 0, delayed: 0 },
    throughput: { enqueued: 12, processed: 0 },
    consumers: 0,
    maxRetries: 0,
    retentionDays: 90,
    avgProcessingTime: 0,
    errorRate: 100,
    createdAt: '2024-06-15T10:00:00Z'
  }
];

const CONSUMERS: Consumer[] = [
  { id: '1', queueId: '1', queueName: 'order-processing', name: 'order-worker-1', status: 'running', messagesProcessed: 123456, lastActivity: '2025-01-27T16:45:00Z', processingRate: 56, errorRate: 0.3 },
  { id: '2', queueId: '1', queueName: 'order-processing', name: 'order-worker-2', status: 'running', messagesProcessed: 98765, lastActivity: '2025-01-27T16:44:55Z', processingRate: 52, errorRate: 0.5 },
  { id: '3', queueId: '2', queueName: 'email-notifications', name: 'email-sender-1', status: 'running', messagesProcessed: 567890, lastActivity: '2025-01-27T16:45:02Z', processingRate: 312, errorRate: 0.1 },
  { id: '4', queueId: '2', queueName: 'email-notifications', name: 'email-sender-2', status: 'error', messagesProcessed: 234567, lastActivity: '2025-01-27T16:30:00Z', processingRate: 0, errorRate: 5.2 },
  { id: '5', queueId: '3', queueName: 'webhook-delivery', name: 'webhook-dispatcher', status: 'running', messagesProcessed: 345678, lastActivity: '2025-01-27T16:44:58Z', processingRate: 92, errorRate: 0.8 }
];

const RECENT_MESSAGES: Message[] = [
  { id: 'msg-001', queueId: '1', queueName: 'order-processing', status: 'processing', priority: 1, attempts: 1, maxAttempts: 3, createdAt: '2025-01-27T16:44:30Z', payload: '{"orderId": "ORD-12345", "action": "process"}' },
  { id: 'msg-002', queueId: '2', queueName: 'email-notifications', status: 'completed', priority: 0, attempts: 1, maxAttempts: 5, createdAt: '2025-01-27T16:44:15Z', processedAt: '2025-01-27T16:44:20Z', payload: '{"type": "order_confirmation", "userId": "usr-789"}' },
  { id: 'msg-003', queueId: '3', queueName: 'webhook-delivery', status: 'failed', priority: 2, attempts: 3, maxAttempts: 10, createdAt: '2025-01-27T16:43:00Z', errorMessage: 'Connection timeout', payload: '{"endpoint": "https://example.com/webhook", "event": "payment.completed"}' },
  { id: 'msg-004', queueId: '5', queueName: 'order-processing-dlq', status: 'dead-letter', priority: 0, attempts: 3, maxAttempts: 3, createdAt: '2025-01-27T16:40:00Z', errorMessage: 'Max retries exceeded: Invalid order format', payload: '{"orderId": "ORD-ERROR", "data": "malformed"}' },
  { id: 'msg-005', queueId: '1', queueName: 'order-processing', status: 'pending', priority: 0, attempts: 0, maxAttempts: 3, createdAt: '2025-01-27T16:45:00Z', payload: '{"orderId": "ORD-12346", "action": "validate"}' }
];

const TYPE_CONFIG = {
  standard: { color: 'info', label: 'Standard', icon: Inbox },
  fifo: { color: 'purple', label: 'FIFO', icon: ArrowDown },
  'dead-letter': { color: 'danger', label: 'Dead Letter', icon: Archive },
  priority: { color: 'warning', label: 'Priority', icon: Zap }
};

const STATUS_CONFIG = {
  active: { color: 'success', label: 'Active', icon: CheckCircle },
  paused: { color: 'muted', label: 'Paused', icon: Pause },
  error: { color: 'danger', label: 'Error', icon: XCircle }
};

const MESSAGE_STATUS_CONFIG = {
  pending: { color: 'muted', label: 'Pending' },
  processing: { color: 'info', label: 'Processing' },
  completed: { color: 'success', label: 'Completed' },
  failed: { color: 'danger', label: 'Failed' },
  'dead-letter': { color: 'warning', label: 'Dead Letter' }
};

export default function MessageQueuesPage() {
  const [activeTab, setActiveTab] = useState<'queues' | 'consumers' | 'messages' | 'metrics'>('queues');
  const [expandedQueue, setExpandedQueue] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const activeQueues = QUEUES.filter(q => q.status === 'active').length;
  const totalPending = QUEUES.reduce((acc, q) => acc + q.messages.pending, 0);
  const totalThroughput = QUEUES.reduce((acc, q) => acc + q.throughput.processed, 0);
  const activeConsumers = CONSUMERS.filter(c => c.status === 'running').length;

  const filteredQueues = QUEUES.filter(q => {
    const matchesType = filterType === 'all' || q.type === filterType;
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const renderQueues = () => (
    <div className="queues-section">
      <div className="queues-header">
        <div className="queues-filters">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="standard">Standard</option>
            <option value="fifo">FIFO</option>
            <option value="priority">Priority</option>
            <option value="dead-letter">Dead Letter</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="error">Error</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Create Queue
        </button>
      </div>

      <div className="queues-list">
        {filteredQueues.map(queue => {
          const typeConfig = TYPE_CONFIG[queue.type];
          const statusConfig = STATUS_CONFIG[queue.status];
          const TypeIcon = typeConfig.icon;
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedQueue === queue.id;

          return (
            <div key={queue.id} className={`queue-card ${queue.status}`}>
              <div className="queue-main">
                <div className={`queue-type-icon ${typeConfig.color}`}>
                  <TypeIcon size={20} />
                </div>

                <div className="queue-info">
                  <div className="queue-header">
                    <h4>{queue.name}</h4>
                    <span className={`type-badge ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                    <div className={`queue-status ${statusConfig.color}`}>
                      <StatusIcon size={14} />
                      {statusConfig.label}
                    </div>
                  </div>
                  <div className="queue-meta">
                    <span className="consumers">
                      <Users size={12} />
                      {queue.consumers} consumers
                    </span>
                    <span className="retention">
                      <Clock size={12} />
                      {queue.retentionDays}d retention
                    </span>
                  </div>
                </div>

                <div className="queue-metrics">
                  <div className="q-metric">
                    <span className="metric-value">{queue.messages.pending.toLocaleString()}</span>
                    <span className="metric-label">Pending</span>
                  </div>
                  <div className="q-metric">
                    <span className="metric-value">{queue.messages.inFlight}</span>
                    <span className="metric-label">In Flight</span>
                  </div>
                  <div className="q-metric">
                    <span className="metric-value">{queue.throughput.processed}/s</span>
                    <span className="metric-label">Processed</span>
                  </div>
                  <div className="q-metric">
                    <span className={`metric-value ${queue.errorRate > 1 ? 'danger' : queue.errorRate > 0.5 ? 'warning' : ''}`}>
                      {queue.errorRate}%
                    </span>
                    <span className="metric-label">Error Rate</span>
                  </div>
                </div>

                <div className="queue-actions">
                  {queue.status === 'active' ? (
                    <button className="action-btn" title="Pause">
                      <Pause size={16} />
                    </button>
                  ) : (
                    <button className="action-btn" title="Resume">
                      <Play size={16} />
                    </button>
                  )}
                  <button 
                    className="expand-btn"
                    onClick={() => setExpandedQueue(isExpanded ? null : queue.id)}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="queue-expanded">
                  <div className="expanded-grid">
                    <div className="expanded-section">
                      <h5>Message Statistics</h5>
                      <div className="stats-grid">
                        <div className="stat-item">
                          <span className="stat-label">In Flight</span>
                          <span className="stat-value">{queue.messages.inFlight}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Delayed</span>
                          <span className="stat-value">{queue.messages.delayed}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Avg Processing Time</span>
                          <span className="stat-value">{queue.avgProcessingTime}ms</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Max Retries</span>
                          <span className="stat-value">{queue.maxRetries}</span>
                        </div>
                      </div>
                    </div>
                    <div className="expanded-section">
                      <h5>Throughput</h5>
                      <div className="throughput-bars">
                        <div className="throughput-item">
                          <span className="throughput-label">Enqueued</span>
                          <div className="throughput-bar">
                            <div 
                              className="throughput-fill enqueued"
                              style={{ width: `${Math.min((queue.throughput.enqueued / 2000) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="throughput-value">{queue.throughput.enqueued}/s</span>
                        </div>
                        <div className="throughput-item">
                          <span className="throughput-label">Processed</span>
                          <div className="throughput-bar">
                            <div 
                              className="throughput-fill processed"
                              style={{ width: `${Math.min((queue.throughput.processed / 2000) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="throughput-value">{queue.throughput.processed}/s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="expanded-actions">
                    <button className="btn-sm">
                      <Eye size={14} />
                      View Messages
                    </button>
                    <button className="btn-sm">
                      <Send size={14} />
                      Send Test Message
                    </button>
                    <button className="btn-sm">
                      <Settings size={14} />
                      Configure
                    </button>
                    <button className="btn-sm">
                      <RotateCcw size={14} />
                      Purge
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderConsumers = () => (
    <div className="consumers-section">
      <div className="consumers-header">
        <h3>Queue Consumers</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Add Consumer
        </button>
      </div>

      <div className="consumers-table">
        <div className="ct-header">
          <span className="ct-th name">Consumer</span>
          <span className="ct-th queue">Queue</span>
          <span className="ct-th status">Status</span>
          <span className="ct-th processed">Processed</span>
          <span className="ct-th rate">Rate</span>
          <span className="ct-th error">Error Rate</span>
          <span className="ct-th activity">Last Activity</span>
          <span className="ct-th actions"></span>
        </div>
        <div className="ct-body">
          {CONSUMERS.map(consumer => (
            <div key={consumer.id} className={`ct-row ${consumer.status}`}>
              <span className="ct-td name">
                <Server size={14} />
                {consumer.name}
              </span>
              <span className="ct-td queue">{consumer.queueName}</span>
              <span className={`ct-td status ${consumer.status}`}>
                {consumer.status === 'running' && <CheckCircle size={14} />}
                {consumer.status === 'stopped' && <Pause size={14} />}
                {consumer.status === 'error' && <XCircle size={14} />}
                {consumer.status}
              </span>
              <span className="ct-td processed">{consumer.messagesProcessed.toLocaleString()}</span>
              <span className="ct-td rate">{consumer.processingRate}/s</span>
              <span className={`ct-td error ${consumer.errorRate > 1 ? 'danger' : consumer.errorRate > 0.5 ? 'warning' : ''}`}>
                {consumer.errorRate}%
              </span>
              <span className="ct-td activity">
                {new Date(consumer.lastActivity).toLocaleTimeString()}
              </span>
              <span className="ct-td actions">
                <button className="action-btn-sm" title="Restart">
                  <RefreshCw size={14} />
                </button>
                <button className="action-btn-sm" title="Stop">
                  <Pause size={14} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="messages-section">
      <div className="messages-header">
        <h3>Recent Messages</h3>
        <div className="messages-filters">
          <select>
            <option value="all">All Queues</option>
            {QUEUES.map(q => (
              <option key={q.id} value={q.id}>{q.name}</option>
            ))}
          </select>
          <select>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="dead-letter">Dead Letter</option>
          </select>
        </div>
      </div>

      <div className="messages-list">
        {RECENT_MESSAGES.map(message => {
          const statusConfig = MESSAGE_STATUS_CONFIG[message.status];

          return (
            <div key={message.id} className={`message-card ${message.status}`}>
              <div className="message-main">
                <div className={`message-status-icon ${statusConfig.color}`}>
                  {message.status === 'pending' && <Clock size={18} />}
                  {message.status === 'processing' && <RefreshCw size={18} className="spinning" />}
                  {message.status === 'completed' && <CheckCircle size={18} />}
                  {message.status === 'failed' && <XCircle size={18} />}
                  {message.status === 'dead-letter' && <Archive size={18} />}
                </div>

                <div className="message-info">
                  <div className="message-header">
                    <span className="message-id">{message.id}</span>
                    <span className={`status-badge ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    {message.priority > 0 && (
                      <span className="priority-badge">
                        Priority: {message.priority}
                      </span>
                    )}
                  </div>
                  <div className="message-meta">
                    <span className="queue-name">{message.queueName}</span>
                    <span className="attempts">
                      Attempts: {message.attempts}/{message.maxAttempts}
                    </span>
                    <span className="created">
                      <Clock size={12} />
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {message.errorMessage && (
                    <div className="error-message">
                      <AlertTriangle size={12} />
                      {message.errorMessage}
                    </div>
                  )}
                </div>

                <div className="message-actions">
                  <button className="action-btn" title="View Payload">
                    <Eye size={16} />
                  </button>
                  <button className="action-btn" title="Retry">
                    <RotateCcw size={16} />
                  </button>
                  <button className="action-btn" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="message-payload">
                <code>{message.payload}</code>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="metrics-section">
      <div className="metrics-header">
        <h3>Queue Metrics</h3>
        <div className="metrics-controls">
          <select>
            <option value="all">All Queues</option>
            {QUEUES.map(q => (
              <option key={q.id} value={q.id}>{q.name}</option>
            ))}
          </select>
          <select>
            <option value="1h">Last 1 Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card-header">
            <h4>Messages Processed</h4>
            <span className="metric-trend up">
              <TrendingUp size={14} />
              +18%
            </span>
          </div>
          <div className="metric-value-large">1.2M</div>
          <div className="metric-chart-placeholder">
            <Activity size={40} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <h4>Average Latency</h4>
            <span className="metric-trend down">
              <TrendingDown size={14} />
              -12%
            </span>
          </div>
          <div className="metric-value-large">156ms</div>
          <div className="metric-chart-placeholder">
            <Clock size={40} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <h4>Failed Messages</h4>
            <span className="metric-trend down">
              <TrendingDown size={14} />
              -25%
            </span>
          </div>
          <div className="metric-value-large">234</div>
          <div className="metric-chart-placeholder">
            <XCircle size={40} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <h4>Consumer Utilization</h4>
            <span className="metric-trend up">
              <TrendingUp size={14} />
              +5%
            </span>
          </div>
          <div className="metric-value-large">78%</div>
          <div className="metric-chart-placeholder">
            <Users size={40} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="message-queues">
      <div className="message-queues__header">
        <div className="message-queues__title-section">
          <div className="message-queues__icon">
            <MessageSquare size={28} />
          </div>
          <div>
            <h1>Message Queues</h1>
            <p>Manage and monitor message queues and consumers</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      <div className="message-queues__stats">
        <div className="stat-card">
          <div className="stat-icon active">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeQueues}/{QUEUES.length}</span>
            <span className="stat-label">Active Queues</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Inbox size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalPending.toLocaleString()}</span>
            <span className="stat-label">Pending Messages</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon throughput">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalThroughput}/s</span>
            <span className="stat-label">Total Throughput</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon consumers">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeConsumers}</span>
            <span className="stat-label">Active Consumers</span>
          </div>
        </div>
      </div>

      <div className="message-queues__tabs">
        <button
          className={`tab-btn ${activeTab === 'queues' ? 'active' : ''}`}
          onClick={() => setActiveTab('queues')}
        >
          <Inbox size={16} />
          Queues
        </button>
        <button
          className={`tab-btn ${activeTab === 'consumers' ? 'active' : ''}`}
          onClick={() => setActiveTab('consumers')}
        >
          <Users size={16} />
          Consumers
        </button>
        <button
          className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <MessageSquare size={16} />
          Messages
        </button>
        <button
          className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <Activity size={16} />
          Metrics
        </button>
      </div>

      <div className="message-queues__content">
        {activeTab === 'queues' && renderQueues()}
        {activeTab === 'consumers' && renderConsumers()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'metrics' && renderMetrics()}
      </div>
    </div>
  );
}
