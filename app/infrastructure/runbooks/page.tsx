'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Search,
  Plus,
  Clock,
  Users,
  Tag,
  Play,
  CheckCircle,
  AlertTriangle,
  Edit3,
  Copy,
  ExternalLink,
  FileText,
  Zap,
  Server,
  Database,
  Shield,
  Globe,
  RefreshCw,
  Terminal,
  Code,
  ChevronRight,
  ChevronDown,
  Star,
  History,
  Bookmark,
  GitBranch,
  Eye,
  Settings,
  Filter,
  MoreVertical,
  ArrowRight,
  Download
} from 'lucide-react';
import './runbooks.css';

interface Runbook {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  service: string;
  owner: string;
  team: string;
  lastUpdated: string;
  lastExecuted: string | null;
  executionCount: number;
  avgDuration: string;
  successRate: number;
  tags: string[];
  version: string;
  status: 'active' | 'draft' | 'deprecated';
  steps: RunbookStep[];
  prerequisites: string[];
  relatedRunbooks: string[];
  starred: boolean;
}

interface RunbookStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: 'manual' | 'automated' | 'approval' | 'notification';
  command?: string;
  expectedDuration: string;
  rollback?: string;
}

interface RunbookExecution {
  id: string;
  runbookId: string;
  runbookTitle: string;
  executor: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed' | 'aborted';
  currentStep: number;
  totalSteps: number;
  incident?: string;
}

interface RunbookCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  count: number;
  color: string;
}

const RUNBOOK_CATEGORIES: RunbookCategory[] = [
  { id: 'incident', name: 'Incident Response', description: 'Emergency procedures', icon: AlertTriangle, count: 12, color: '#ef4444' },
  { id: 'deployment', name: 'Deployment', description: 'Release procedures', icon: Zap, count: 8, color: '#3b82f6' },
  { id: 'database', name: 'Database', description: 'DB operations', icon: Database, count: 6, color: '#8b5cf6' },
  { id: 'scaling', name: 'Scaling', description: 'Capacity management', icon: Server, count: 5, color: '#10b981' },
  { id: 'security', name: 'Security', description: 'Security procedures', icon: Shield, count: 7, color: '#f59e0b' },
  { id: 'networking', name: 'Networking', description: 'Network operations', icon: Globe, count: 4, color: '#06b6d4' }
];

const RUNBOOKS: Runbook[] = [
  {
    id: 'rb-001',
    title: 'Database Connection Pool Exhaustion',
    description: 'Steps to diagnose and resolve database connection pool exhaustion issues causing service degradation or outages.',
    category: 'database',
    severity: 'critical',
    service: 'PostgreSQL Cluster',
    owner: 'Mike Peters',
    team: 'Data Platform',
    lastUpdated: '2025-01-28T10:30:00Z',
    lastExecuted: '2025-01-29T08:15:00Z',
    executionCount: 47,
    avgDuration: '15 min',
    successRate: 94,
    tags: ['database', 'connections', 'performance', 'outage'],
    version: '2.3',
    status: 'active',
    starred: true,
    prerequisites: [
      'Access to database monitoring dashboard',
      'SSH access to database servers',
      'Permission to modify connection pool settings'
    ],
    relatedRunbooks: ['rb-002', 'rb-004'],
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Check Connection Pool Status',
        description: 'Monitor current connection pool utilization and identify bottlenecks',
        type: 'automated',
        command: 'kubectl exec -it postgres-primary -- psql -c "SELECT * FROM pg_stat_activity"',
        expectedDuration: '2 min',
        rollback: 'No rollback needed'
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Identify Long-Running Queries',
        description: 'Find queries that may be holding connections for extended periods',
        type: 'automated',
        command: 'SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state != \'idle\' ORDER BY duration DESC LIMIT 10;',
        expectedDuration: '2 min'
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Kill Stuck Connections',
        description: 'Terminate connections that have been idle for too long',
        type: 'approval',
        expectedDuration: '3 min',
        rollback: 'Connections will be re-established by applications'
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Scale Connection Pool',
        description: 'Increase PgBouncer max_client_conn if needed',
        type: 'manual',
        expectedDuration: '5 min',
        rollback: 'kubectl rollout undo deployment/pgbouncer'
      },
      {
        id: 'step-5',
        order: 5,
        title: 'Verify Recovery',
        description: 'Confirm connection pool metrics have normalized',
        type: 'automated',
        command: 'curl -s http://pgbouncer:9127/metrics | grep pgbouncer_pools',
        expectedDuration: '3 min'
      }
    ]
  },
  {
    id: 'rb-002',
    title: 'API Gateway High Latency',
    description: 'Troubleshooting guide for API gateway latency spikes affecting external traffic.',
    category: 'incident',
    severity: 'critical',
    service: 'Core API Gateway',
    owner: 'Alex Chen',
    team: 'Platform Engineering',
    lastUpdated: '2025-01-25T14:00:00Z',
    lastExecuted: '2025-01-27T16:30:00Z',
    executionCount: 32,
    avgDuration: '20 min',
    successRate: 91,
    tags: ['api', 'latency', 'performance', 'gateway'],
    version: '1.8',
    status: 'active',
    starred: true,
    prerequisites: [
      'Access to Grafana dashboards',
      'kubectl access to production cluster',
      'PagerDuty escalation permissions'
    ],
    relatedRunbooks: ['rb-001', 'rb-005'],
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Check Gateway Metrics',
        description: 'Review current P99 latency and error rates in Grafana',
        type: 'manual',
        expectedDuration: '3 min'
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Identify Slow Endpoints',
        description: 'Find which endpoints are contributing to latency',
        type: 'automated',
        command: 'kubectl top pods -l app=api-gateway --sort-by=cpu',
        expectedDuration: '2 min'
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Scale Gateway Replicas',
        description: 'Increase replicas if CPU/memory is constrained',
        type: 'automated',
        command: 'kubectl scale deployment api-gateway --replicas=10',
        expectedDuration: '5 min',
        rollback: 'kubectl scale deployment api-gateway --replicas=5'
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Notify Stakeholders',
        description: 'Send status update to #incidents Slack channel',
        type: 'notification',
        expectedDuration: '2 min'
      }
    ]
  },
  {
    id: 'rb-003',
    title: 'Production Deployment Rollback',
    description: 'Standard procedure for rolling back a failed production deployment.',
    category: 'deployment',
    severity: 'high',
    service: 'All Services',
    owner: 'Sarah Johnson',
    team: 'DevOps',
    lastUpdated: '2025-01-20T09:00:00Z',
    lastExecuted: '2025-01-22T11:45:00Z',
    executionCount: 18,
    avgDuration: '10 min',
    successRate: 100,
    tags: ['deployment', 'rollback', 'kubernetes', 'production'],
    version: '3.1',
    status: 'active',
    starred: false,
    prerequisites: [
      'kubectl access to production',
      'ArgoCD admin access',
      'Approval from on-call lead'
    ],
    relatedRunbooks: ['rb-006'],
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Pause ArgoCD Sync',
        description: 'Disable automatic sync to prevent re-deployment',
        type: 'automated',
        command: 'argocd app set <app-name> --sync-policy none',
        expectedDuration: '1 min'
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Get Previous Revision',
        description: 'Identify the last known good revision',
        type: 'automated',
        command: 'kubectl rollout history deployment/<deployment-name>',
        expectedDuration: '1 min'
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Execute Rollback',
        description: 'Roll back to the previous stable version',
        type: 'automated',
        command: 'kubectl rollout undo deployment/<deployment-name>',
        expectedDuration: '5 min'
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Verify Rollback',
        description: 'Confirm pods are healthy and serving traffic',
        type: 'automated',
        command: 'kubectl rollout status deployment/<deployment-name>',
        expectedDuration: '3 min'
      }
    ]
  },
  {
    id: 'rb-004',
    title: 'Redis Cluster Failover',
    description: 'Manual failover procedure for Redis cluster when automatic failover is not triggering.',
    category: 'database',
    severity: 'critical',
    service: 'Redis Cache Cluster',
    owner: 'David Kim',
    team: 'Platform Engineering',
    lastUpdated: '2025-01-15T11:00:00Z',
    lastExecuted: '2025-01-18T03:20:00Z',
    executionCount: 8,
    avgDuration: '12 min',
    successRate: 88,
    tags: ['redis', 'cache', 'failover', 'high-availability'],
    version: '1.4',
    status: 'active',
    starred: false,
    prerequisites: [
      'Redis CLI access',
      'Network access to Redis nodes',
      'Understanding of Redis Sentinel'
    ],
    relatedRunbooks: ['rb-001'],
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Check Cluster Status',
        description: 'Verify current cluster topology and identify failed master',
        type: 'automated',
        command: 'redis-cli -h sentinel-0 SENTINEL masters',
        expectedDuration: '2 min'
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Trigger Manual Failover',
        description: 'Force Sentinel to perform failover to healthy replica',
        type: 'automated',
        command: 'redis-cli -h sentinel-0 SENTINEL failover mymaster',
        expectedDuration: '3 min'
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Verify New Master',
        description: 'Confirm new master is accepting writes',
        type: 'automated',
        command: 'redis-cli -h redis-master SET test:key "test" && redis-cli -h redis-master GET test:key',
        expectedDuration: '2 min'
      }
    ]
  },
  {
    id: 'rb-005',
    title: 'SSL Certificate Renewal',
    description: 'Procedure for renewing SSL/TLS certificates before expiration.',
    category: 'security',
    severity: 'high',
    service: 'Certificate Manager',
    owner: 'Lisa Wong',
    team: 'Security Engineering',
    lastUpdated: '2025-01-10T16:00:00Z',
    lastExecuted: '2025-01-12T09:00:00Z',
    executionCount: 24,
    avgDuration: '25 min',
    successRate: 100,
    tags: ['ssl', 'tls', 'certificates', 'security'],
    version: '2.0',
    status: 'active',
    starred: true,
    prerequisites: [
      'Access to cert-manager',
      'DNS management access',
      'Approval for production changes'
    ],
    relatedRunbooks: [],
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Check Certificate Status',
        description: 'Review current certificate expiration dates',
        type: 'automated',
        command: 'kubectl get certificates -A',
        expectedDuration: '2 min'
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Trigger Certificate Renewal',
        description: 'Delete certificate secret to trigger renewal',
        type: 'manual',
        expectedDuration: '5 min',
        rollback: 'Restore from backup secret'
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Verify New Certificate',
        description: 'Confirm new certificate is issued and valid',
        type: 'automated',
        command: 'echo | openssl s_client -connect api.cube.io:443 2>/dev/null | openssl x509 -noout -dates',
        expectedDuration: '3 min'
      }
    ]
  },
  {
    id: 'rb-006',
    title: 'Horizontal Pod Autoscaler Tuning',
    description: 'Guide for adjusting HPA thresholds during traffic spikes.',
    category: 'scaling',
    severity: 'medium',
    service: 'Kubernetes Cluster',
    owner: 'Tom Anderson',
    team: 'Infrastructure',
    lastUpdated: '2025-01-05T12:00:00Z',
    lastExecuted: null,
    executionCount: 5,
    avgDuration: '15 min',
    successRate: 100,
    tags: ['kubernetes', 'hpa', 'scaling', 'autoscaling'],
    version: '1.2',
    status: 'active',
    starred: false,
    prerequisites: [
      'kubectl admin access',
      'Understanding of HPA metrics',
      'Access to monitoring dashboards'
    ],
    relatedRunbooks: ['rb-003'],
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Review Current HPA Config',
        description: 'Check existing HPA thresholds and behavior',
        type: 'automated',
        command: 'kubectl get hpa -o yaml',
        expectedDuration: '2 min'
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Adjust Target Utilization',
        description: 'Modify CPU/memory target percentage',
        type: 'manual',
        expectedDuration: '5 min',
        rollback: 'kubectl apply -f hpa-backup.yaml'
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Monitor Scaling Behavior',
        description: 'Watch pods scale in response to new thresholds',
        type: 'automated',
        command: 'kubectl get hpa -w',
        expectedDuration: '8 min'
      }
    ]
  }
];

const RECENT_EXECUTIONS: RunbookExecution[] = [
  {
    id: 'exec-001',
    runbookId: 'rb-001',
    runbookTitle: 'Database Connection Pool Exhaustion',
    executor: 'Mike Peters',
    startedAt: '2025-01-29T08:15:00Z',
    completedAt: '2025-01-29T08:32:00Z',
    status: 'completed',
    currentStep: 5,
    totalSteps: 5,
    incident: 'INC-2025-0142'
  },
  {
    id: 'exec-002',
    runbookId: 'rb-002',
    runbookTitle: 'API Gateway High Latency',
    executor: 'Alex Chen',
    startedAt: '2025-01-27T16:30:00Z',
    completedAt: '2025-01-27T16:52:00Z',
    status: 'completed',
    currentStep: 4,
    totalSteps: 4,
    incident: 'INC-2025-0140'
  },
  {
    id: 'exec-003',
    runbookId: 'rb-003',
    runbookTitle: 'Production Deployment Rollback',
    executor: 'Sarah Johnson',
    startedAt: '2025-01-22T11:45:00Z',
    completedAt: '2025-01-22T11:55:00Z',
    status: 'completed',
    currentStep: 4,
    totalSteps: 4
  }
];

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: '#ef4444' },
  high: { label: 'High', color: '#f59e0b' },
  medium: { label: 'Medium', color: '#3b82f6' },
  low: { label: 'Low', color: '#64748b' }
};

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#22c55e' },
  draft: { label: 'Draft', color: '#f59e0b' },
  deprecated: { label: 'Deprecated', color: '#64748b' }
};

const STEP_TYPE_CONFIG = {
  manual: { label: 'Manual', color: '#f59e0b', icon: Edit3 },
  automated: { label: 'Automated', color: '#22c55e', icon: Zap },
  approval: { label: 'Approval', color: '#8b5cf6', icon: CheckCircle },
  notification: { label: 'Notification', color: '#06b6d4', icon: AlertTriangle }
};

export default function RunbooksPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'categories' | 'executions' | 'templates'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedRunbook, setExpandedRunbook] = useState<string | null>(null);
  const [viewingSteps, setViewingSteps] = useState<string | null>(null);

  const filteredRunbooks = RUNBOOKS.filter(runbook => {
    const matchesSearch = runbook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         runbook.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         runbook.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || runbook.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const starredRunbooks = RUNBOOKS.filter(rb => rb.starred);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="runbooks">
      <div className="runbooks__header">
        <div className="runbooks__title-section">
          <div className="runbooks__icon">
            <BookOpen size={28} />
          </div>
          <div>
            <h1>Runbook Management</h1>
            <p>Operational procedures and automated playbooks</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Create Runbook
          </button>
        </div>
      </div>

      <div className="runbooks__stats">
        <div className="stat-card primary">
          <div className="stat-icon total">
            <BookOpen size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{RUNBOOKS.length}</span>
            <span className="stat-label">Total Runbooks</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{RUNBOOKS.filter(r => r.status === 'active').length}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon executions">
            <Play size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{RUNBOOKS.reduce((sum, r) => sum + r.executionCount, 0)}</span>
            <span className="stat-label">Total Executions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <Zap size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{Math.round(RUNBOOKS.reduce((sum, r) => sum + r.successRate, 0) / RUNBOOKS.length)}%</span>
            <span className="stat-label">Avg Success Rate</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon starred">
            <Star size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{starredRunbooks.length}</span>
            <span className="stat-label">Starred</span>
          </div>
        </div>
      </div>

      <div className="runbooks__tabs">
        <button 
          className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <BookOpen size={16} />
          Library
          <span className="tab-badge">{RUNBOOKS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={16} />
          Categories
        </button>
        <button 
          className={`tab-btn ${activeTab === 'executions' ? 'active' : ''}`}
          onClick={() => setActiveTab('executions')}
        >
          <History size={16} />
          Executions
          <span className="tab-badge">{RECENT_EXECUTIONS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <FileText size={16} />
          Templates
        </button>
      </div>

      {activeTab === 'library' && (
        <div className="library-section">
          <div className="section-toolbar">
            <div className="search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search runbooks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {RUNBOOK_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select>
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {starredRunbooks.length > 0 && categoryFilter === 'all' && !searchQuery && (
            <div className="starred-section">
              <h3>
                <Star size={16} className="starred-icon" />
                Starred Runbooks
              </h3>
              <div className="starred-grid">
                {starredRunbooks.map(runbook => (
                  <div key={runbook.id} className="starred-card" onClick={() => setExpandedRunbook(runbook.id)}>
                    <div className="starred-header">
                      <span className="severity-dot" style={{ background: SEVERITY_CONFIG[runbook.severity].color }}></span>
                      <h4>{runbook.title}</h4>
                    </div>
                    <p>{runbook.service}</p>
                    <div className="starred-meta">
                      <span><Play size={12} /> {runbook.executionCount}</span>
                      <span><CheckCircle size={12} /> {runbook.successRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="runbooks-list">
            {filteredRunbooks.map(runbook => (
              <div 
                key={runbook.id} 
                className={`runbook-card ${runbook.severity} ${expandedRunbook === runbook.id ? 'expanded' : ''}`}
              >
                <div 
                  className="runbook-header"
                  onClick={() => setExpandedRunbook(expandedRunbook === runbook.id ? null : runbook.id)}
                >
                  <div className="runbook-icon-wrapper" style={{ background: `${SEVERITY_CONFIG[runbook.severity].color}20` }}>
                    <BookOpen size={20} style={{ color: SEVERITY_CONFIG[runbook.severity].color }} />
                  </div>
                  <div className="runbook-info">
                    <div className="runbook-title-row">
                      <h4>{runbook.title}</h4>
                      {runbook.starred && <Star size={14} className="star-icon filled" />}
                      <span className="version-tag">v{runbook.version}</span>
                    </div>
                    <div className="runbook-meta">
                      <span className="service-name">{runbook.service}</span>
                      <span className="team-name">{runbook.team}</span>
                      <span className="step-count">{runbook.steps.length} steps</span>
                    </div>
                  </div>
                  <div className="runbook-stats">
                    <div className="stat-item">
                      <Play size={14} />
                      <span>{runbook.executionCount}</span>
                    </div>
                    <div className="stat-item success">
                      <CheckCircle size={14} />
                      <span>{runbook.successRate}%</span>
                    </div>
                    <div className="stat-item">
                      <Clock size={14} />
                      <span>{runbook.avgDuration}</span>
                    </div>
                  </div>
                  <div className="runbook-badges">
                    <span 
                      className="severity-badge"
                      style={{ 
                        backgroundColor: `${SEVERITY_CONFIG[runbook.severity].color}20`,
                        color: SEVERITY_CONFIG[runbook.severity].color
                      }}
                    >
                      {SEVERITY_CONFIG[runbook.severity].label}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: `${STATUS_CONFIG[runbook.status].color}20`,
                        color: STATUS_CONFIG[runbook.status].color
                      }}
                    >
                      {STATUS_CONFIG[runbook.status].label}
                    </span>
                  </div>
                  <div className="runbook-expand">
                    {expandedRunbook === runbook.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </div>

                {expandedRunbook === runbook.id && (
                  <div className="runbook-details">
                    <div className="details-description">
                      <p>{runbook.description}</p>
                    </div>

                    <div className="details-grid">
                      <div className="detail-section">
                        <h5>Prerequisites</h5>
                        <ul className="prereq-list">
                          {runbook.prerequisites.map((prereq, i) => (
                            <li key={i}>
                              <CheckCircle size={12} />
                              {prereq}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="detail-section">
                        <h5>Information</h5>
                        <div className="info-items">
                          <div className="info-item">
                            <span className="info-label">Owner</span>
                            <span className="info-value">{runbook.owner}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Last Updated</span>
                            <span className="info-value">{formatDate(runbook.lastUpdated)}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Last Executed</span>
                            <span className="info-value">{formatDate(runbook.lastExecuted)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="steps-section">
                      <div className="steps-header">
                        <h5>Procedure Steps</h5>
                        <button 
                          className="toggle-steps-btn"
                          onClick={() => setViewingSteps(viewingSteps === runbook.id ? null : runbook.id)}
                        >
                          {viewingSteps === runbook.id ? 'Collapse' : 'Expand All'}
                        </button>
                      </div>
                      <div className="steps-list">
                        {runbook.steps.map(step => {
                          const StepIcon = STEP_TYPE_CONFIG[step.type].icon;
                          return (
                            <div key={step.id} className={`step-item ${step.type}`}>
                              <div className="step-number">{step.order}</div>
                              <div className="step-content">
                                <div className="step-header">
                                  <h6>{step.title}</h6>
                                  <div className="step-badges">
                                    <span 
                                      className="step-type-badge"
                                      style={{ 
                                        backgroundColor: `${STEP_TYPE_CONFIG[step.type].color}20`,
                                        color: STEP_TYPE_CONFIG[step.type].color
                                      }}
                                    >
                                      <StepIcon size={10} />
                                      {STEP_TYPE_CONFIG[step.type].label}
                                    </span>
                                    <span className="duration-badge">
                                      <Clock size={10} />
                                      {step.expectedDuration}
                                    </span>
                                  </div>
                                </div>
                                <p className="step-description">{step.description}</p>
                                {step.command && (
                                  <div className="step-command">
                                    <code>{step.command}</code>
                                    <button className="copy-btn">
                                      <Copy size={12} />
                                    </button>
                                  </div>
                                )}
                                {step.rollback && (
                                  <div className="step-rollback">
                                    <RefreshCw size={12} />
                                    <span>Rollback: {step.rollback}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="runbook-tags">
                      {runbook.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>

                    <div className="runbook-actions">
                      <button className="action-btn primary">
                        <Play size={14} />
                        Execute Runbook
                      </button>
                      <button className="action-btn">
                        <Edit3 size={14} />
                        Edit
                      </button>
                      <button className="action-btn">
                        <Copy size={14} />
                        Duplicate
                      </button>
                      <button className="action-btn">
                        <ExternalLink size={14} />
                        Open in Editor
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="categories-section">
          <div className="categories-grid">
            {RUNBOOK_CATEGORIES.map(category => {
              const CategoryIcon = category.icon;
              const categoryRunbooks = RUNBOOKS.filter(r => r.category === category.id);
              
              return (
                <div key={category.id} className="category-card">
                  <div className="category-header">
                    <div 
                      className="category-icon"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      <CategoryIcon size={24} />
                    </div>
                    <div className="category-info">
                      <h4>{category.name}</h4>
                      <p>{category.description}</p>
                    </div>
                    <span className="category-count">{categoryRunbooks.length}</span>
                  </div>
                  <div className="category-runbooks">
                    {categoryRunbooks.slice(0, 3).map(runbook => (
                      <div key={runbook.id} className="mini-runbook">
                        <span 
                          className="severity-dot" 
                          style={{ background: SEVERITY_CONFIG[runbook.severity].color }}
                        ></span>
                        <span className="mini-title">{runbook.title}</span>
                        <ChevronRight size={14} />
                      </div>
                    ))}
                    {categoryRunbooks.length > 3 && (
                      <button 
                        className="view-all-btn"
                        onClick={() => {
                          setCategoryFilter(category.id);
                          setActiveTab('library');
                        }}
                      >
                        View all {categoryRunbooks.length} runbooks
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'executions' && (
        <div className="executions-section">
          <div className="executions-header">
            <h3>Recent Executions</h3>
            <button className="btn-outline">
              <Filter size={16} />
              Filter
            </button>
          </div>

          <div className="executions-table">
            <table>
              <thead>
                <tr>
                  <th>Runbook</th>
                  <th>Executor</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Progress</th>
                  <th>Incident</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_EXECUTIONS.map(exec => (
                  <tr key={exec.id}>
                    <td className="runbook-cell">{exec.runbookTitle}</td>
                    <td>{exec.executor}</td>
                    <td>{formatDate(exec.startedAt)}</td>
                    <td>
                      {exec.completedAt ? 
                        `${Math.round((new Date(exec.completedAt).getTime() - new Date(exec.startedAt).getTime()) / 60000)} min` :
                        'Running...'
                      }
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${(exec.currentStep / exec.totalSteps) * 100}%` }}
                          ></div>
                        </div>
                        <span>{exec.currentStep}/{exec.totalSteps}</span>
                      </div>
                    </td>
                    <td>
                      {exec.incident ? (
                        <span className="incident-link">{exec.incident}</span>
                      ) : (
                        <span className="no-incident">-</span>
                      )}
                    </td>
                    <td>
                      <span className={`exec-status ${exec.status}`}>
                        {exec.status === 'completed' ? 'Completed' :
                         exec.status === 'running' ? 'Running' :
                         exec.status === 'failed' ? 'Failed' : 'Aborted'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="templates-section">
          <div className="templates-header">
            <h3>Runbook Templates</h3>
            <p>Start with pre-built templates for common scenarios</p>
          </div>
          <div className="templates-grid">
            <div className="template-card">
              <div className="template-icon incident">
                <AlertTriangle size={24} />
              </div>
              <h4>Incident Response</h4>
              <p>Standard incident response procedure with escalation paths</p>
              <button className="use-template-btn">
                <Plus size={14} />
                Use Template
              </button>
            </div>
            <div className="template-card">
              <div className="template-icon deployment">
                <Zap size={24} />
              </div>
              <h4>Deployment Rollback</h4>
              <p>Safe rollback procedure for failed deployments</p>
              <button className="use-template-btn">
                <Plus size={14} />
                Use Template
              </button>
            </div>
            <div className="template-card">
              <div className="template-icon database">
                <Database size={24} />
              </div>
              <h4>Database Failover</h4>
              <p>Manual database failover procedure</p>
              <button className="use-template-btn">
                <Plus size={14} />
                Use Template
              </button>
            </div>
            <div className="template-card">
              <div className="template-icon scaling">
                <Server size={24} />
              </div>
              <h4>Emergency Scaling</h4>
              <p>Rapid scaling for traffic spikes</p>
              <button className="use-template-btn">
                <Plus size={14} />
                Use Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
