'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Server, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Square,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Send,
  Inbox,
  Archive,
  Trash2,
  Eye,
  MoreVertical,
  Layers,
  Zap,
  GitBranch,
  Users,
  Box,
  Radio,
  Repeat,
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';
import './message-queue.css';

interface Queue {
  id: string;
  name: string;
  type: 'standard' | 'fifo' | 'priority' | 'dead-letter';
  broker: 'rabbitmq' | 'kafka' | 'sqs' | 'redis';
  status: 'active' | 'paused' | 'error' | 'creating';
  messagesReady: number;
  messagesUnacked: number;
  messageRate: number;
  consumers: number;
  publishRate: number;
  deliverRate: number;
  redeliveryRate: number;
  environment: 'production' | 'staging' | 'development';
  maxLength: number | null;
  ttl: number | null;
  deadLetterQueue: string | null;
  retentionPeriod: string;
  createdAt: string;
}

interface Consumer {
  id: string;
  queueId: string;
  queueName: string;
  name: string;
  status: 'running' | 'idle' | 'disconnected';
  prefetchCount: number;
  messagesProcessed: number;
  avgProcessingTime: number;
  lastActivity: string;
  host: string;
}

interface Message {
  id: string;
  queueId: string;
  queueName: string;
  body: string;
  headers: Record<string, string>;
  priority: number;
  timestamp: string;
  deliveryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'dead-letter';
}

interface Broker {
  id: string;
  name: string;
  type: 'rabbitmq' | 'kafka' | 'sqs' | 'redis';
  host: string;
  port: number;
  status: 'healthy' | 'degraded' | 'offline';
  queues: number;
  connections: number;
  messagesPerSec: number;
  memoryUsage: number;
  diskUsage: number;
}

const QUEUES: Queue[] = [
  {
    id: 'q-001',
    name: 'order-processing',
    type: 'standard',
    broker: 'rabbitmq',
    status: 'active',
    messagesReady: 1245,
    messagesUnacked: 32,
    messageRate: 450,
    consumers: 5,
    publishRate: 480,
    deliverRate: 450,
    redeliveryRate: 2.1,
    environment: 'production',
    maxLength: 100000,
    ttl: 86400000,
    deadLetterQueue: 'order-processing-dlq',
    retentionPeriod: '7 days',
    createdAt: '2024-01-15'
  },
  {
    id: 'q-002',
    name: 'email-notifications',
    type: 'priority',
    broker: 'rabbitmq',
    status: 'active',
    messagesReady: 8420,
    messagesUnacked: 156,
    messageRate: 1250,
    consumers: 8,
    publishRate: 1300,
    deliverRate: 1250,
    redeliveryRate: 0.5,
    environment: 'production',
    maxLength: 500000,
    ttl: 172800000,
    deadLetterQueue: 'email-dlq',
    retentionPeriod: '14 days',
    createdAt: '2024-02-20'
  },
  {
    id: 'q-003',
    name: 'analytics-events',
    type: 'standard',
    broker: 'kafka',
    status: 'active',
    messagesReady: 45890,
    messagesUnacked: 0,
    messageRate: 12500,
    consumers: 12,
    publishRate: 12800,
    deliverRate: 12500,
    redeliveryRate: 0.1,
    environment: 'production',
    maxLength: null,
    ttl: null,
    deadLetterQueue: null,
    retentionPeriod: '30 days',
    createdAt: '2024-03-10'
  },
  {
    id: 'q-004',
    name: 'user-events',
    type: 'fifo',
    broker: 'sqs',
    status: 'active',
    messagesReady: 324,
    messagesUnacked: 12,
    messageRate: 85,
    consumers: 2,
    publishRate: 90,
    deliverRate: 85,
    redeliveryRate: 1.2,
    environment: 'production',
    maxLength: 10000,
    ttl: 345600000,
    deadLetterQueue: 'user-events-dlq',
    retentionPeriod: '4 days',
    createdAt: '2024-04-05'
  },
  {
    id: 'q-005',
    name: 'cache-invalidation',
    type: 'standard',
    broker: 'redis',
    status: 'active',
    messagesReady: 12,
    messagesUnacked: 3,
    messageRate: 2500,
    consumers: 4,
    publishRate: 2600,
    deliverRate: 2500,
    redeliveryRate: 0.2,
    environment: 'production',
    maxLength: 1000,
    ttl: 60000,
    deadLetterQueue: null,
    retentionPeriod: '1 hour',
    createdAt: '2024-05-15'
  },
  {
    id: 'q-006',
    name: 'order-processing-dlq',
    type: 'dead-letter',
    broker: 'rabbitmq',
    status: 'active',
    messagesReady: 156,
    messagesUnacked: 0,
    messageRate: 5,
    consumers: 1,
    publishRate: 5,
    deliverRate: 0,
    redeliveryRate: 0,
    environment: 'production',
    maxLength: 50000,
    ttl: null,
    deadLetterQueue: null,
    retentionPeriod: '30 days',
    createdAt: '2024-01-15'
  },
  {
    id: 'q-007',
    name: 'staging-events',
    type: 'standard',
    broker: 'rabbitmq',
    status: 'paused',
    messagesReady: 2450,
    messagesUnacked: 0,
    messageRate: 0,
    consumers: 0,
    publishRate: 45,
    deliverRate: 0,
    redeliveryRate: 0,
    environment: 'staging',
    maxLength: 10000,
    ttl: 3600000,
    deadLetterQueue: null,
    retentionPeriod: '1 day',
    createdAt: '2024-06-01'
  },
  {
    id: 'q-008',
    name: 'payment-processing',
    type: 'fifo',
    broker: 'rabbitmq',
    status: 'error',
    messagesReady: 8945,
    messagesUnacked: 500,
    messageRate: 0,
    consumers: 3,
    publishRate: 125,
    deliverRate: 0,
    redeliveryRate: 100,
    environment: 'production',
    maxLength: 25000,
    ttl: 86400000,
    deadLetterQueue: 'payment-dlq',
    retentionPeriod: '7 days',
    createdAt: '2024-01-20'
  }
];

const CONSUMERS: Consumer[] = [
  {
    id: 'c-001',
    queueId: 'q-001',
    queueName: 'order-processing',
    name: 'order-worker-1',
    status: 'running',
    prefetchCount: 10,
    messagesProcessed: 125890,
    avgProcessingTime: 45,
    lastActivity: '2025-01-15 14:55:32',
    host: 'worker-pod-001'
  },
  {
    id: 'c-002',
    queueId: 'q-001',
    queueName: 'order-processing',
    name: 'order-worker-2',
    status: 'running',
    prefetchCount: 10,
    messagesProcessed: 124560,
    avgProcessingTime: 48,
    lastActivity: '2025-01-15 14:55:30',
    host: 'worker-pod-002'
  },
  {
    id: 'c-003',
    queueId: 'q-002',
    queueName: 'email-notifications',
    name: 'email-sender-1',
    status: 'running',
    prefetchCount: 50,
    messagesProcessed: 892450,
    avgProcessingTime: 120,
    lastActivity: '2025-01-15 14:55:28',
    host: 'email-pod-001'
  },
  {
    id: 'c-004',
    queueId: 'q-003',
    queueName: 'analytics-events',
    name: 'analytics-consumer-group',
    status: 'running',
    prefetchCount: 100,
    messagesProcessed: 45890000,
    avgProcessingTime: 8,
    lastActivity: '2025-01-15 14:55:35',
    host: 'analytics-cluster'
  },
  {
    id: 'c-005',
    queueId: 'q-008',
    queueName: 'payment-processing',
    name: 'payment-worker-1',
    status: 'disconnected',
    prefetchCount: 5,
    messagesProcessed: 45890,
    avgProcessingTime: 250,
    lastActivity: '2025-01-15 12:30:00',
    host: 'payment-pod-001'
  }
];

const BROKERS: Broker[] = [
  {
    id: 'br-001',
    name: 'RabbitMQ Cluster',
    type: 'rabbitmq',
    host: 'rabbitmq.cube.internal',
    port: 5672,
    status: 'healthy',
    queues: 24,
    connections: 156,
    messagesPerSec: 2450,
    memoryUsage: 68,
    diskUsage: 42
  },
  {
    id: 'br-002',
    name: 'Kafka Cluster',
    type: 'kafka',
    host: 'kafka.cube.internal',
    port: 9092,
    status: 'healthy',
    queues: 48,
    connections: 320,
    messagesPerSec: 45000,
    memoryUsage: 72,
    diskUsage: 65
  },
  {
    id: 'br-003',
    name: 'AWS SQS',
    type: 'sqs',
    host: 'sqs.us-east-1.amazonaws.com',
    port: 443,
    status: 'healthy',
    queues: 12,
    connections: 45,
    messagesPerSec: 890,
    memoryUsage: 0,
    diskUsage: 0
  },
  {
    id: 'br-004',
    name: 'Redis Pub/Sub',
    type: 'redis',
    host: 'redis-pubsub.cube.internal',
    port: 6379,
    status: 'healthy',
    queues: 8,
    connections: 89,
    messagesPerSec: 12500,
    memoryUsage: 45,
    diskUsage: 18
  }
];

const TYPE_CONFIG: Record<Queue['type'], { color: string; bg: string; icon: React.ElementType }> = {
  standard: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Inbox },
  fifo: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: Layers },
  priority: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Zap },
  'dead-letter': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: Archive }
};

const BROKER_CONFIG: Record<Queue['broker'], { color: string; bg: string; icon: string }> = {
  rabbitmq: { color: '#FF6600', bg: 'rgba(255, 102, 0, 0.15)', icon: '🐰' },
  kafka: { color: '#231F20', bg: 'rgba(35, 31, 32, 0.15)', icon: '📊' },
  sqs: { color: '#FF9900', bg: 'rgba(255, 153, 0, 0.15)', icon: '☁️' },
  redis: { color: '#DC382D', bg: 'rgba(220, 56, 45, 0.15)', icon: '⚡' }
};

const STATUS_CONFIG: Record<Queue['status'], { color: string; bg: string; icon: React.ElementType }> = {
  active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: CheckCircle },
  paused: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Pause },
  error: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: AlertCircle },
  creating: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: RefreshCw }
};

const CONSUMER_STATUS_CONFIG: Record<Consumer['status'], { color: string; bg: string }> = {
  running: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  idle: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  disconnected: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
};

const ENV_CONFIG: Record<Queue['environment'], { color: string; bg: string }> = {
  production: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  staging: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  development: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' }
};

export default function MessageQueuePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'queues' | 'consumers' | 'brokers' | 'messages'>('overview');
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBroker, setFilterBroker] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredQueues = QUEUES.filter(q => {
    const matchesSearch = q.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBroker = filterBroker === 'all' || q.broker === filterBroker;
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchesSearch && matchesBroker && matchesStatus;
  });

  const totalMessages = QUEUES.reduce((sum, q) => sum + q.messagesReady, 0);
  const totalMessageRate = QUEUES.reduce((sum, q) => sum + q.messageRate, 0);
  const totalConsumers = QUEUES.reduce((sum, q) => sum + q.consumers, 0);
  const errorQueues = QUEUES.filter(q => q.status === 'error').length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'queues', label: 'Queues', icon: Inbox, count: QUEUES.length },
    { id: 'consumers', label: 'Consumers', icon: Users, count: CONSUMERS.length },
    { id: 'brokers', label: 'Brokers', icon: Server, count: BROKERS.length },
    { id: 'messages', label: 'Messages', icon: MessageSquare }
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="overview-metrics">
        <div className="metric-card large">
          <div className="metric-header">
            <h3>Message Throughput</h3>
            <span className="trend positive">
              <ArrowUpRight size={14} />
              +15.2%
            </span>
          </div>
          <div className="metric-value">
            <span className="value">{totalMessageRate.toLocaleString()}</span>
            <span className="unit">msg/s</span>
          </div>
          <div className="throughput-chart">
            <div className="chart-bar" style={{ height: '45%' }} />
            <div className="chart-bar" style={{ height: '58%' }} />
            <div className="chart-bar" style={{ height: '72%' }} />
            <div className="chart-bar" style={{ height: '65%' }} />
            <div className="chart-bar" style={{ height: '82%' }} />
            <div className="chart-bar" style={{ height: '78%' }} />
            <div className="chart-bar active" style={{ height: '88%' }} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Total Messages</h3>
          </div>
          <div className="metric-value">
            <span className="value">{totalMessages.toLocaleString()}</span>
          </div>
          <div className="metric-label">Across all queues</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Active Consumers</h3>
          </div>
          <div className="metric-value">
            <span className="value">{totalConsumers}</span>
          </div>
          <div className="metric-label">Processing messages</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Queue Health</h3>
          </div>
          <div className="metric-value">
            {errorQueues > 0 ? (
              <span className="value error">{errorQueues} Issues</span>
            ) : (
              <span className="value healthy">All Healthy</span>
            )}
          </div>
          <div className="metric-label">{QUEUES.length} queues monitored</div>
        </div>
      </div>

      <div className="overview-panels">
        <div className="panel queue-status">
          <h3>Queue Status</h3>
          <div className="queue-list">
            {QUEUES.slice(0, 5).map(queue => {
              const typeConfig = TYPE_CONFIG[queue.type];
              const statusConfig = STATUS_CONFIG[queue.status];
              const TypeIcon = typeConfig.icon;
              const StatusIcon = statusConfig.icon;
              return (
                <div 
                  key={queue.id} 
                  className={`queue-item ${queue.status}`}
                  onClick={() => setSelectedQueue(queue)}
                >
                  <div className="queue-info">
                    <div 
                      className="queue-type-icon"
                      style={{ background: typeConfig.bg, color: typeConfig.color }}
                    >
                      <TypeIcon size={18} />
                    </div>
                    <div className="queue-details">
                      <span className="queue-name">{queue.name}</span>
                      <span className="queue-meta">{queue.broker} • {queue.type}</span>
                    </div>
                  </div>
                  <div className="queue-stats">
                    <div className="queue-stat">
                      <span className="stat-value">{queue.messagesReady.toLocaleString()}</span>
                      <span className="stat-label">ready</span>
                    </div>
                    <div className="queue-stat">
                      <span className="stat-value">{queue.messageRate}</span>
                      <span className="stat-label">msg/s</span>
                    </div>
                    <span 
                      className="queue-status-badge"
                      style={{ background: statusConfig.bg, color: statusConfig.color }}
                    >
                      <StatusIcon size={12} className={queue.status === 'creating' ? 'spin' : ''} />
                      {queue.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel broker-status">
          <h3>Broker Health</h3>
          <div className="broker-list">
            {BROKERS.map(broker => {
              const config = BROKER_CONFIG[broker.type];
              return (
                <div key={broker.id} className={`broker-item ${broker.status}`}>
                  <div className="broker-info">
                    <div 
                      className="broker-icon"
                      style={{ background: config.bg }}
                    >
                      <span>{config.icon}</span>
                    </div>
                    <div className="broker-details">
                      <span className="broker-name">{broker.name}</span>
                      <span className="broker-meta">{broker.host}:{broker.port}</span>
                    </div>
                  </div>
                  <div className="broker-stats">
                    <div className="broker-stat">
                      <span className="stat-value">{broker.messagesPerSec.toLocaleString()}</span>
                      <span className="stat-label">msg/s</span>
                    </div>
                    <span className={`broker-status ${broker.status}`}>{broker.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {errorQueues > 0 && (
        <div className="error-alert">
          <AlertTriangle size={20} />
          <div className="alert-content">
            <span className="alert-title">{errorQueues} Queue{errorQueues > 1 ? 's' : ''} Require Attention</span>
            <span className="alert-desc">
              {QUEUES.filter(q => q.status === 'error').map(q => q.name).join(', ')}
            </span>
          </div>
          <button className="btn-outline small">View Issues</button>
        </div>
      )}
    </div>
  );

  const renderQueues = () => (
    <div className="queues-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search queues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select value={filterBroker} onChange={(e) => setFilterBroker(e.target.value)}>
            <option value="all">All Brokers</option>
            <option value="rabbitmq">RabbitMQ</option>
            <option value="kafka">Kafka</option>
            <option value="sqs">SQS</option>
            <option value="redis">Redis</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Create Queue
          </button>
        </div>
      </div>

      <div className="queue-cards">
        {filteredQueues.map(queue => {
          const typeConfig = TYPE_CONFIG[queue.type];
          const brokerConfig = BROKER_CONFIG[queue.broker];
          const statusConfig = STATUS_CONFIG[queue.status];
          const envConfig = ENV_CONFIG[queue.environment];
          const TypeIcon = typeConfig.icon;
          const StatusIcon = statusConfig.icon;
          
          return (
            <div 
              key={queue.id} 
              className={`queue-card ${queue.status}`}
              onClick={() => setSelectedQueue(queue)}
            >
              <div className="queue-card-header">
                <div 
                  className="queue-type-icon"
                  style={{ background: typeConfig.bg, color: typeConfig.color }}
                >
                  <TypeIcon size={22} />
                </div>
                <div className="queue-card-info">
                  <h4>{queue.name}</h4>
                  <div className="queue-badges">
                    <span className="broker-badge" style={{ background: brokerConfig.bg }}>
                      <span>{brokerConfig.icon}</span>
                      {queue.broker}
                    </span>
                    <span className="type-badge">{queue.type}</span>
                  </div>
                </div>
                <span 
                  className="status-badge"
                  style={{ background: statusConfig.bg, color: statusConfig.color }}
                >
                  <StatusIcon size={12} className={queue.status === 'creating' ? 'spin' : ''} />
                  {queue.status}
                </span>
              </div>

              <div className="queue-card-metrics">
                <div className="metric-item">
                  <Inbox size={14} />
                  <span className="metric-label">Ready</span>
                  <span className="metric-value">{queue.messagesReady.toLocaleString()}</span>
                </div>
                <div className="metric-item">
                  <Clock size={14} />
                  <span className="metric-label">Unacked</span>
                  <span className="metric-value">{queue.messagesUnacked}</span>
                </div>
                <div className="metric-item">
                  <Activity size={14} />
                  <span className="metric-label">Rate</span>
                  <span className="metric-value">{queue.messageRate}/s</span>
                </div>
                <div className="metric-item">
                  <Users size={14} />
                  <span className="metric-label">Consumers</span>
                  <span className="metric-value">{queue.consumers}</span>
                </div>
              </div>

              <div className="queue-card-flow">
                <div className="flow-item publish">
                  <Send size={14} />
                  <span>{queue.publishRate}/s</span>
                </div>
                <ArrowRight size={16} className="flow-arrow" />
                <div className="flow-item deliver">
                  <Inbox size={14} />
                  <span>{queue.deliverRate}/s</span>
                </div>
              </div>

              {queue.redeliveryRate > 5 && (
                <div className="queue-warning">
                  <AlertTriangle size={14} />
                  <span>High redelivery rate: {queue.redeliveryRate}%</span>
                </div>
              )}

              <div className="queue-card-footer">
                <span 
                  className="env-badge"
                  style={{ background: envConfig.bg, color: envConfig.color }}
                >
                  {queue.environment}
                </span>
                {queue.deadLetterQueue && (
                  <span className="dlq-badge">
                    <Archive size={12} />
                    DLQ
                  </span>
                )}
              </div>

              <div className="queue-card-actions">
                {queue.status === 'active' ? (
                  <button className="action-btn" title="Pause">
                    <Pause size={14} />
                  </button>
                ) : queue.status === 'paused' ? (
                  <button className="action-btn" title="Resume">
                    <Play size={14} />
                  </button>
                ) : null}
                <button className="action-btn" title="Purge">
                  <Trash2 size={14} />
                </button>
                <button className="action-btn" title="Settings">
                  <Settings size={14} />
                </button>
                <button className="action-btn" title="More">
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedQueue && (
        <div className="queue-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              <div 
                className="panel-icon"
                style={{ 
                  background: TYPE_CONFIG[selectedQueue.type].bg, 
                  color: TYPE_CONFIG[selectedQueue.type].color 
                }}
              >
                {React.createElement(TYPE_CONFIG[selectedQueue.type].icon, { size: 24 })}
              </div>
              <div>
                <h3>{selectedQueue.name}</h3>
                <span className="panel-subtitle">{selectedQueue.broker} • {selectedQueue.type}</span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setSelectedQueue(null)}>×</button>
          </div>

          <div className="panel-content">
            <div className="panel-section">
              <h4>Message Statistics</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Messages Ready</span>
                  <span className="stat-value">{selectedQueue.messagesReady.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Unacknowledged</span>
                  <span className="stat-value">{selectedQueue.messagesUnacked}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Publish Rate</span>
                  <span className="stat-value">{selectedQueue.publishRate}/s</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Deliver Rate</span>
                  <span className="stat-value">{selectedQueue.deliverRate}/s</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Consumers</span>
                  <span className="stat-value">{selectedQueue.consumers}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Redelivery Rate</span>
                  <span className={`stat-value ${selectedQueue.redeliveryRate > 5 ? 'warning' : ''}`}>
                    {selectedQueue.redeliveryRate}%
                  </span>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <h4>Configuration</h4>
              <div className="config-list">
                <div className="config-item">
                  <span className="config-label">Max Length</span>
                  <span className="config-value">
                    {selectedQueue.maxLength ? selectedQueue.maxLength.toLocaleString() : 'Unlimited'}
                  </span>
                </div>
                <div className="config-item">
                  <span className="config-label">Message TTL</span>
                  <span className="config-value">
                    {selectedQueue.ttl ? `${selectedQueue.ttl / 1000}s` : 'No TTL'}
                  </span>
                </div>
                <div className="config-item">
                  <span className="config-label">Retention</span>
                  <span className="config-value">{selectedQueue.retentionPeriod}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Dead Letter Queue</span>
                  <span className="config-value">{selectedQueue.deadLetterQueue || 'None'}</span>
                </div>
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-primary">
                <Eye size={16} />
                Browse Messages
              </button>
              <button className="btn-outline">
                <Send size={16} />
                Publish Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderConsumers = () => (
    <div className="consumers-section">
      <div className="section-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search consumers..." />
        </div>
        <button className="btn-outline">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="consumers-table">
        <table>
          <thead>
            <tr>
              <th>Consumer</th>
              <th>Queue</th>
              <th>Status</th>
              <th>Prefetch</th>
              <th>Processed</th>
              <th>Avg Time</th>
              <th>Last Activity</th>
              <th>Host</th>
            </tr>
          </thead>
          <tbody>
            {CONSUMERS.map(consumer => {
              const statusConfig = CONSUMER_STATUS_CONFIG[consumer.status];
              return (
                <tr key={consumer.id} className={consumer.status}>
                  <td>
                    <div className="consumer-cell">
                      <Radio size={14} />
                      <span>{consumer.name}</span>
                    </div>
                  </td>
                  <td className="queue-cell">{consumer.queueName}</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ background: statusConfig.bg, color: statusConfig.color }}
                    >
                      {consumer.status}
                    </span>
                  </td>
                  <td>{consumer.prefetchCount}</td>
                  <td>{consumer.messagesProcessed.toLocaleString()}</td>
                  <td>{consumer.avgProcessingTime}ms</td>
                  <td className="time-cell">{consumer.lastActivity}</td>
                  <td className="host-cell">{consumer.host}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBrokers = () => (
    <div className="brokers-section">
      <div className="brokers-header">
        <h3>Message Brokers</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Add Broker
        </button>
      </div>

      <div className="brokers-grid">
        {BROKERS.map(broker => {
          const config = BROKER_CONFIG[broker.type];
          return (
            <div key={broker.id} className={`broker-card ${broker.status}`}>
              <div className="broker-card-header">
                <div 
                  className="broker-card-icon"
                  style={{ background: config.bg }}
                >
                  <span>{config.icon}</span>
                </div>
                <span className={`broker-status-badge ${broker.status}`}>{broker.status}</span>
              </div>

              <h4>{broker.name}</h4>
              <span className="broker-host">{broker.host}:{broker.port}</span>

              <div className="broker-metrics">
                <div className="broker-metric">
                  <Activity size={14} />
                  <span className="metric-value">{broker.messagesPerSec.toLocaleString()}</span>
                  <span className="metric-label">msg/s</span>
                </div>
                <div className="broker-metric">
                  <Inbox size={14} />
                  <span className="metric-value">{broker.queues}</span>
                  <span className="metric-label">queues</span>
                </div>
                <div className="broker-metric">
                  <Users size={14} />
                  <span className="metric-value">{broker.connections}</span>
                  <span className="metric-label">connections</span>
                </div>
              </div>

              {broker.memoryUsage > 0 && (
                <div className="broker-usage">
                  <div className="usage-item">
                    <span className="usage-label">Memory</span>
                    <div className="usage-bar">
                      <div 
                        className="usage-fill"
                        style={{ 
                          width: `${broker.memoryUsage}%`,
                          background: broker.memoryUsage > 80 ? '#ef4444' : broker.memoryUsage > 60 ? '#f59e0b' : '#22c55e'
                        }}
                      />
                    </div>
                    <span className="usage-value">{broker.memoryUsage}%</span>
                  </div>
                  <div className="usage-item">
                    <span className="usage-label">Disk</span>
                    <div className="usage-bar">
                      <div 
                        className="usage-fill"
                        style={{ 
                          width: `${broker.diskUsage}%`,
                          background: broker.diskUsage > 80 ? '#ef4444' : broker.diskUsage > 60 ? '#f59e0b' : '#3b82f6'
                        }}
                      />
                    </div>
                    <span className="usage-value">{broker.diskUsage}%</span>
                  </div>
                </div>
              )}

              <div className="broker-actions">
                <button className="btn-outline small">
                  <Settings size={14} />
                  Configure
                </button>
                <button className="btn-outline small">
                  <FileText size={14} />
                  Logs
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="messages-section">
      <div className="messages-header">
        <h3>Message Browser</h3>
        <div className="header-actions">
          <select defaultValue="">
            <option value="" disabled>Select Queue</option>
            {QUEUES.map(q => (
              <option key={q.id} value={q.id}>{q.name}</option>
            ))}
          </select>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="messages-placeholder">
        <MessageSquare size={48} />
        <h4>Select a Queue</h4>
        <p>Choose a queue from the dropdown to browse its messages</p>
      </div>
    </div>
  );

  return (
    <div className="message-queue">
      <header className="mq__header">
        <div className="mq__title-section">
          <div className="mq__icon">
            <MessageSquare size={28} />
          </div>
          <div>
            <h1>Message Queue Management</h1>
            <p>Monitor and manage message brokers and queues</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Create Queue
          </button>
        </div>
      </header>

      <div className="mq__stats">
        <div className="stat-card primary">
          <div className="stat-icon queues-icon">
            <Inbox size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{QUEUES.length}</span>
            <span className="stat-label">Total Queues</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon messages-icon">
            <MessageSquare size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalMessages.toLocaleString()}</span>
            <span className="stat-label">Messages</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rate-icon">
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalMessageRate.toLocaleString()}</span>
            <span className="stat-label">Messages/sec</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon brokers-icon">
            <Server size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{BROKERS.length}</span>
            <span className="stat-label">Brokers</span>
          </div>
        </div>
      </div>

      <nav className="mq__tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && (
              <span className="tab-badge">{tab.count}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="mq__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'queues' && renderQueues()}
        {activeTab === 'consumers' && renderConsumers()}
        {activeTab === 'brokers' && renderBrokers()}
        {activeTab === 'messages' && renderMessages()}
      </main>
    </div>
  );
}
