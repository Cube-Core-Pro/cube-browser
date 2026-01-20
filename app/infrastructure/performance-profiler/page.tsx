'use client';

import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Clock,
  Zap,
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Download,
  Upload,
  Settings,
  Flame,
  Layers,
  GitBranch,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Code,
  Database,
  Globe,
  Server,
  Terminal,
  BarChart3,
  PieChart,
  LineChart,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Copy,
  Share2,
  BookOpen,
  Eye,
  EyeOff,
  Maximize2,
  MoreVertical,
  FileCode,
  Bug,
  Timer,
  Gauge
} from 'lucide-react';
import './performance-profiler.css';

interface ProfileSession {
  id: string;
  name: string;
  type: 'cpu' | 'memory' | 'io' | 'full';
  status: 'running' | 'completed' | 'analyzing' | 'failed';
  startTime: string;
  duration: string;
  samples: number;
  service: string;
  environment: string;
  highlights: {
    hotspot?: string;
    memoryLeak?: boolean;
    cpuSpike?: boolean;
  };
}

interface FunctionProfile {
  id: string;
  name: string;
  module: string;
  selfTime: number;
  totalTime: number;
  selfPercent: number;
  totalPercent: number;
  calls: number;
  avgTime: number;
  children: FunctionProfile[];
}

interface MemorySnapshot {
  id: string;
  timestamp: string;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  allocations: { type: string; count: number; size: number }[];
}

interface Hotspot {
  id: string;
  function: string;
  file: string;
  line: number;
  selfTime: number;
  totalTime: number;
  samples: number;
  category: 'cpu' | 'memory' | 'io' | 'lock';
  severity: 'critical' | 'high' | 'medium' | 'low';
  optimization?: string;
}

const PROFILE_SESSIONS: ProfileSession[] = [
  {
    id: 'session-1',
    name: 'API Gateway Load Test',
    type: 'cpu',
    status: 'completed',
    startTime: '2025-01-27T14:00:00Z',
    duration: '15m 32s',
    samples: 485920,
    service: 'api-gateway',
    environment: 'production',
    highlights: { hotspot: 'JSON.parse', cpuSpike: true }
  },
  {
    id: 'session-2',
    name: 'Payment Service Memory Analysis',
    type: 'memory',
    status: 'completed',
    startTime: '2025-01-27T13:30:00Z',
    duration: '30m 45s',
    samples: 892450,
    service: 'payment-service',
    environment: 'production',
    highlights: { memoryLeak: true, hotspot: 'TransactionHandler' }
  },
  {
    id: 'session-3',
    name: 'Order Processing Full Profile',
    type: 'full',
    status: 'running',
    startTime: '2025-01-27T14:45:00Z',
    duration: '8m 12s',
    samples: 156890,
    service: 'order-service',
    environment: 'staging',
    highlights: {}
  },
  {
    id: 'session-4',
    name: 'Database Query Profiling',
    type: 'io',
    status: 'analyzing',
    startTime: '2025-01-27T14:20:00Z',
    duration: '12m 05s',
    samples: 234560,
    service: 'postgres-primary',
    environment: 'production',
    highlights: { hotspot: 'pg_query_execute' }
  },
  {
    id: 'session-5',
    name: 'Cache Layer Performance',
    type: 'cpu',
    status: 'completed',
    startTime: '2025-01-27T12:00:00Z',
    duration: '5m 20s',
    samples: 89450,
    service: 'redis-cache',
    environment: 'production',
    highlights: {}
  }
];

const FLAME_GRAPH_DATA: FunctionProfile[] = [
  {
    id: 'fn-1',
    name: 'handleRequest',
    module: 'api-gateway/router',
    selfTime: 12.5,
    totalTime: 245.8,
    selfPercent: 5.1,
    totalPercent: 100,
    calls: 45892,
    avgTime: 5.36,
    children: [
      {
        id: 'fn-2',
        name: 'authenticate',
        module: 'auth/middleware',
        selfTime: 8.2,
        totalTime: 45.6,
        selfPercent: 3.3,
        totalPercent: 18.5,
        calls: 45892,
        avgTime: 0.99,
        children: [
          {
            id: 'fn-3',
            name: 'verifyToken',
            module: 'auth/jwt',
            selfTime: 25.4,
            totalTime: 37.4,
            selfPercent: 10.3,
            totalPercent: 15.2,
            calls: 45892,
            avgTime: 0.81,
            children: []
          }
        ]
      },
      {
        id: 'fn-4',
        name: 'processRequest',
        module: 'api-gateway/handler',
        selfTime: 18.9,
        totalTime: 156.2,
        selfPercent: 7.7,
        totalPercent: 63.5,
        calls: 45892,
        avgTime: 3.40,
        children: [
          {
            id: 'fn-5',
            name: 'parseBody',
            module: 'body-parser',
            selfTime: 45.6,
            totalTime: 45.6,
            selfPercent: 18.5,
            totalPercent: 18.5,
            calls: 45892,
            avgTime: 0.99,
            children: []
          },
          {
            id: 'fn-6',
            name: 'executeHandler',
            module: 'api-gateway/executor',
            selfTime: 22.3,
            totalTime: 91.7,
            selfPercent: 9.1,
            totalPercent: 37.3,
            calls: 45892,
            avgTime: 2.00,
            children: [
              {
                id: 'fn-7',
                name: 'queryDatabase',
                module: 'db/postgres',
                selfTime: 56.4,
                totalTime: 69.4,
                selfPercent: 22.9,
                totalPercent: 28.2,
                calls: 23456,
                avgTime: 2.96,
                children: []
              }
            ]
          }
        ]
      },
      {
        id: 'fn-8',
        name: 'formatResponse',
        module: 'api-gateway/response',
        selfTime: 12.8,
        totalTime: 32.0,
        selfPercent: 5.2,
        totalPercent: 13.0,
        calls: 45892,
        avgTime: 0.70,
        children: []
      }
    ]
  }
];

const MEMORY_SNAPSHOTS: MemorySnapshot[] = [
  {
    id: 'snap-1',
    timestamp: '14:00:00',
    heapUsed: 245.8,
    heapTotal: 512,
    external: 24.5,
    arrayBuffers: 12.3,
    allocations: [
      { type: 'Object', count: 1245890, size: 89.4 },
      { type: 'Array', count: 456780, size: 45.2 },
      { type: 'String', count: 2345670, size: 67.8 },
      { type: 'Buffer', count: 12450, size: 34.5 }
    ]
  },
  {
    id: 'snap-2',
    timestamp: '14:15:00',
    heapUsed: 312.4,
    heapTotal: 512,
    external: 28.9,
    arrayBuffers: 15.6,
    allocations: [
      { type: 'Object', count: 1567890, size: 112.4 },
      { type: 'Array', count: 567890, size: 56.8 },
      { type: 'String', count: 2890120, size: 89.2 },
      { type: 'Buffer', count: 15680, size: 42.1 }
    ]
  },
  {
    id: 'snap-3',
    timestamp: '14:30:00',
    heapUsed: 389.2,
    heapTotal: 512,
    external: 32.4,
    arrayBuffers: 18.9,
    allocations: [
      { type: 'Object', count: 1892340, size: 145.6 },
      { type: 'Array', count: 678920, size: 68.4 },
      { type: 'String', count: 3456780, size: 112.8 },
      { type: 'Buffer', count: 18920, size: 51.6 }
    ]
  }
];

const HOTSPOTS: Hotspot[] = [
  {
    id: 'hs-1',
    function: 'JSON.parse',
    file: 'body-parser/index.js',
    line: 156,
    selfTime: 45.6,
    totalTime: 45.6,
    samples: 12450,
    category: 'cpu',
    severity: 'critical',
    optimization: 'Consider using fast-json-parse or streaming JSON parser for large payloads'
  },
  {
    id: 'hs-2',
    function: 'queryDatabase',
    file: 'db/postgres/client.js',
    line: 234,
    selfTime: 56.4,
    totalTime: 69.4,
    samples: 8920,
    category: 'io',
    severity: 'high',
    optimization: 'Add connection pooling and query caching for frequent queries'
  },
  {
    id: 'hs-3',
    function: 'verifyToken',
    file: 'auth/jwt.js',
    line: 89,
    selfTime: 25.4,
    totalTime: 37.4,
    samples: 6780,
    category: 'cpu',
    severity: 'medium',
    optimization: 'Cache decoded tokens with TTL matching token expiry'
  },
  {
    id: 'hs-4',
    function: 'TransactionHandler.process',
    file: 'payment/handlers.js',
    line: 456,
    selfTime: 18.9,
    totalTime: 89.2,
    samples: 4560,
    category: 'memory',
    severity: 'high',
    optimization: 'Memory leak detected - ensure proper cleanup of transaction objects'
  },
  {
    id: 'hs-5',
    function: 'formatResponse',
    file: 'api-gateway/response.js',
    line: 78,
    selfTime: 12.8,
    totalTime: 32.0,
    samples: 3890,
    category: 'cpu',
    severity: 'low',
    optimization: 'Pre-compile response templates for better performance'
  }
];

const PROFILE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  cpu: { icon: <Cpu size={14} />, color: '#3b82f6', label: 'CPU' },
  memory: { icon: <MemoryStick size={14} />, color: '#10b981', label: 'Memory' },
  io: { icon: <HardDrive size={14} />, color: '#f59e0b', label: 'I/O' },
  full: { icon: <Layers size={14} />, color: '#8b5cf6', label: 'Full' }
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  running: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  completed: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  analyzing: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  failed: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  high: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  low: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' }
};

export default function PerformanceProfilerPage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'flamegraph' | 'memory' | 'hotspots' | 'compare'>('sessions');
  const [selectedSession, setSelectedSession] = useState<ProfileSession | null>(PROFILE_SESSIONS[0]);
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set(['fn-1', 'fn-4']));
  const [isRecording, setIsRecording] = useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const toggleFunction = (id: string) => {
    const newExpanded = new Set(expandedFunctions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFunctions(newExpanded);
  };

  const renderFunctionTree = (functions: FunctionProfile[], depth: number = 0): React.ReactNode => {
    return functions.map(fn => (
      <div key={fn.id} className="function-tree-item" style={{ marginLeft: `${depth * 24}px` }}>
        <div className="function-row" onClick={() => fn.children.length > 0 && toggleFunction(fn.id)}>
          <div className="function-expand">
            {fn.children.length > 0 ? (
              expandedFunctions.has(fn.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <span className="expand-spacer" />
            )}
          </div>
          <div className="function-info">
            <span className="function-name">{fn.name}</span>
            <span className="function-module">{fn.module}</span>
          </div>
          <div className="function-metrics">
            <div className="metric-col">
              <span className="metric-value">{fn.selfTime.toFixed(1)}ms</span>
              <span className="metric-label">Self</span>
            </div>
            <div className="metric-col">
              <span className="metric-value">{fn.totalTime.toFixed(1)}ms</span>
              <span className="metric-label">Total</span>
            </div>
            <div className="metric-col">
              <span className="metric-value">{fn.selfPercent.toFixed(1)}%</span>
              <span className="metric-label">Self %</span>
            </div>
            <div className="metric-col">
              <span className="metric-value">{formatNumber(fn.calls)}</span>
              <span className="metric-label">Calls</span>
            </div>
          </div>
          <div className="function-bar">
            <div 
              className="function-bar-fill self"
              style={{ width: `${fn.selfPercent}%` }}
            />
            <div 
              className="function-bar-fill total"
              style={{ width: `${fn.totalPercent - fn.selfPercent}%`, left: `${fn.selfPercent}%` }}
            />
          </div>
        </div>
        {expandedFunctions.has(fn.id) && fn.children.length > 0 && (
          <div className="function-children">
            {renderFunctionTree(fn.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  const renderSessions = () => (
    <div className="sessions-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search sessions..." />
          </div>
          <select>
            <option>All Types</option>
            <option>CPU</option>
            <option>Memory</option>
            <option>I/O</option>
            <option>Full</option>
          </select>
          <select>
            <option>All Services</option>
            <option>api-gateway</option>
            <option>payment-service</option>
            <option>order-service</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button 
            className={`btn-primary ${isRecording ? 'recording' : ''}`}
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? <Pause size={16} /> : <Play size={16} />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
      </div>

      <div className="sessions-list">
        {PROFILE_SESSIONS.map(session => (
          <div 
            key={session.id}
            className={`session-card ${selectedSession?.id === session.id ? 'selected' : ''}`}
            onClick={() => setSelectedSession(session)}
          >
            <div className="session-card-header">
              <div 
                className="session-type"
                style={{ 
                  background: PROFILE_TYPE_CONFIG[session.type].color + '20',
                  color: PROFILE_TYPE_CONFIG[session.type].color
                }}
              >
                {PROFILE_TYPE_CONFIG[session.type].icon}
                {PROFILE_TYPE_CONFIG[session.type].label}
              </div>
              <div 
                className="session-status"
                style={{ 
                  background: STATUS_CONFIG[session.status].bg,
                  color: STATUS_CONFIG[session.status].color
                }}
              >
                {session.status === 'running' && <Activity size={12} className="spin" />}
                {session.status}
              </div>
            </div>
            <h4>{session.name}</h4>
            <p className="session-service">
              <Server size={12} />
              {session.service}
              <span className="env-tag">{session.environment}</span>
            </p>
            <div className="session-stats">
              <div className="session-stat">
                <Clock size={14} />
                <span>{session.duration}</span>
              </div>
              <div className="session-stat">
                <Activity size={14} />
                <span>{formatNumber(session.samples)} samples</span>
              </div>
            </div>
            {(session.highlights.hotspot || session.highlights.memoryLeak || session.highlights.cpuSpike) && (
              <div className="session-highlights">
                {session.highlights.hotspot && (
                  <span className="highlight-tag hotspot">
                    <Flame size={12} />
                    {session.highlights.hotspot}
                  </span>
                )}
                {session.highlights.memoryLeak && (
                  <span className="highlight-tag leak">
                    <AlertTriangle size={12} />
                    Memory Leak
                  </span>
                )}
                {session.highlights.cpuSpike && (
                  <span className="highlight-tag spike">
                    <Zap size={12} />
                    CPU Spike
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderFlameGraph = () => (
    <div className="flamegraph-section">
      <div className="section-header">
        <h3>Flame Graph - {selectedSession?.name || 'Select a session'}</h3>
        <div className="header-actions">
          <button className="btn-outline small">
            <Search size={14} />
            Search
          </button>
          <button className="btn-outline small">
            <Maximize2 size={14} />
            Full Screen
          </button>
          <button className="btn-outline small">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      <div className="flamegraph-visual">
        <div className="flamegraph-placeholder">
          <Flame size={64} />
          <p>Interactive Flame Graph Visualization</p>
          <span>Click on any block to zoom in, right-click to zoom out</span>
        </div>
      </div>

      <div className="flamegraph-tree">
        <div className="tree-header">
          <h4>Call Tree</h4>
          <div className="tree-legend">
            <span className="legend-item"><span className="legend-color self" /> Self Time</span>
            <span className="legend-item"><span className="legend-color total" /> Children Time</span>
          </div>
        </div>
        <div className="tree-content">
          {renderFunctionTree(FLAME_GRAPH_DATA)}
        </div>
      </div>
    </div>
  );

  const renderMemory = () => (
    <div className="memory-section">
      <div className="section-header">
        <h3>Memory Analysis</h3>
        <div className="header-actions">
          <button className="btn-outline small">
            <RefreshCw size={14} />
            Take Snapshot
          </button>
          <button className="btn-outline small">
            <Download size={14} />
            Export Heap
          </button>
        </div>
      </div>

      <div className="memory-timeline">
        <h4>Heap Usage Over Time</h4>
        <div className="timeline-chart">
          {MEMORY_SNAPSHOTS.map((snap, idx) => (
            <div key={snap.id} className="timeline-bar">
              <div 
                className="bar-fill"
                style={{ height: `${(snap.heapUsed / snap.heapTotal) * 100}%` }}
              />
              <span className="bar-label">{snap.timestamp}</span>
              <span className="bar-value">{snap.heapUsed.toFixed(0)}MB</span>
            </div>
          ))}
        </div>
        <div className="timeline-stats">
          <div className="timeline-stat">
            <span className="stat-label">Growth Rate</span>
            <span className="stat-value warning">+58% in 30min</span>
          </div>
          <div className="timeline-stat">
            <span className="stat-label">Current Usage</span>
            <span className="stat-value">389.2 MB / 512 MB</span>
          </div>
          <div className="timeline-stat alert">
            <AlertTriangle size={14} />
            <span>Potential memory leak detected</span>
          </div>
        </div>
      </div>

      <div className="memory-snapshots">
        <h4>Allocation Breakdown (Latest Snapshot)</h4>
        <div className="allocations-table">
          <div className="allocations-header">
            <span>Type</span>
            <span>Count</span>
            <span>Size</span>
            <span>% of Heap</span>
          </div>
          {MEMORY_SNAPSHOTS[2].allocations.map((alloc, idx) => (
            <div key={idx} className="allocation-row">
              <span className="alloc-type">{alloc.type}</span>
              <span className="alloc-count">{formatNumber(alloc.count)}</span>
              <span className="alloc-size">{alloc.size.toFixed(1)} MB</span>
              <div className="alloc-bar">
                <div 
                  className="alloc-bar-fill"
                  style={{ width: `${(alloc.size / MEMORY_SNAPSHOTS[2].heapUsed) * 100}%` }}
                />
                <span>{((alloc.size / MEMORY_SNAPSHOTS[2].heapUsed) * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="memory-gc">
        <h4>Garbage Collection</h4>
        <div className="gc-stats">
          <div className="gc-stat-card">
            <span className="gc-label">Minor GC</span>
            <span className="gc-value">245</span>
            <span className="gc-sublabel">runs (avg 2.3ms)</span>
          </div>
          <div className="gc-stat-card">
            <span className="gc-label">Major GC</span>
            <span className="gc-value">12</span>
            <span className="gc-sublabel">runs (avg 45ms)</span>
          </div>
          <div className="gc-stat-card">
            <span className="gc-label">GC Pause Time</span>
            <span className="gc-value">1.2s</span>
            <span className="gc-sublabel">total (0.8%)</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHotspots = () => (
    <div className="hotspots-section">
      <div className="section-header">
        <h3>Performance Hotspots</h3>
        <div className="header-actions">
          <select>
            <option>All Categories</option>
            <option>CPU</option>
            <option>Memory</option>
            <option>I/O</option>
            <option>Lock Contention</option>
          </select>
          <select>
            <option>Sort by: Self Time</option>
            <option>Sort by: Total Time</option>
            <option>Sort by: Samples</option>
            <option>Sort by: Severity</option>
          </select>
        </div>
      </div>

      <div className="hotspots-list">
        {HOTSPOTS.map(hotspot => (
          <div key={hotspot.id} className={`hotspot-card ${hotspot.severity}`}>
            <div className="hotspot-header">
              <div className="hotspot-category">
                {hotspot.category === 'cpu' && <Cpu size={14} />}
                {hotspot.category === 'memory' && <MemoryStick size={14} />}
                {hotspot.category === 'io' && <HardDrive size={14} />}
                {hotspot.category === 'lock' && <Target size={14} />}
                {hotspot.category.toUpperCase()}
              </div>
              <div 
                className="hotspot-severity"
                style={{ 
                  background: SEVERITY_CONFIG[hotspot.severity].bg,
                  color: SEVERITY_CONFIG[hotspot.severity].color
                }}
              >
                {hotspot.severity}
              </div>
            </div>
            <h4 className="hotspot-function">{hotspot.function}</h4>
            <p className="hotspot-location">
              <FileCode size={12} />
              {hotspot.file}:{hotspot.line}
            </p>
            <div className="hotspot-metrics">
              <div className="hotspot-metric">
                <span className="metric-label">Self Time</span>
                <span className="metric-value">{hotspot.selfTime.toFixed(1)}ms</span>
              </div>
              <div className="hotspot-metric">
                <span className="metric-label">Total Time</span>
                <span className="metric-value">{hotspot.totalTime.toFixed(1)}ms</span>
              </div>
              <div className="hotspot-metric">
                <span className="metric-label">Samples</span>
                <span className="metric-value">{formatNumber(hotspot.samples)}</span>
              </div>
            </div>
            {hotspot.optimization && (
              <div className="hotspot-optimization">
                <Bug size={14} />
                <span>{hotspot.optimization}</span>
              </div>
            )}
            <div className="hotspot-actions">
              <button className="btn-outline small">
                <Code size={14} />
                View Code
              </button>
              <button className="btn-outline small">
                <Eye size={14} />
                View in Flame Graph
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompare = () => (
    <div className="compare-section">
      <div className="section-header">
        <h3>Compare Profiles</h3>
      </div>

      <div className="compare-selector">
        <div className="compare-profile">
          <label>Baseline Profile</label>
          <select>
            <option>Select profile...</option>
            {PROFILE_SESSIONS.filter(s => s.status === 'completed').map(s => (
              <option key={s.id}>{s.name} ({s.duration})</option>
            ))}
          </select>
        </div>
        <div className="compare-arrow">
          <ArrowRight size={24} />
        </div>
        <div className="compare-profile">
          <label>Comparison Profile</label>
          <select>
            <option>Select profile...</option>
            {PROFILE_SESSIONS.filter(s => s.status === 'completed').map(s => (
              <option key={s.id}>{s.name} ({s.duration})</option>
            ))}
          </select>
        </div>
        <button className="btn-primary">
          Compare
        </button>
      </div>

      <div className="compare-results">
        <div className="compare-summary">
          <div className="compare-summary-card improvement">
            <TrendingDown size={24} />
            <span className="summary-value">-23%</span>
            <span className="summary-label">CPU Time</span>
          </div>
          <div className="compare-summary-card regression">
            <TrendingUp size={24} />
            <span className="summary-value">+12%</span>
            <span className="summary-label">Memory Usage</span>
          </div>
          <div className="compare-summary-card improvement">
            <TrendingDown size={24} />
            <span className="summary-value">-45%</span>
            <span className="summary-label">I/O Wait</span>
          </div>
          <div className="compare-summary-card neutral">
            <Activity size={24} />
            <span className="summary-value">~</span>
            <span className="summary-label">GC Pause</span>
          </div>
        </div>

        <div className="compare-diff-chart">
          <h4>Performance Differential</h4>
          <div className="diff-placeholder">
            <LineChart size={48} />
            <p>Side-by-side flame graph comparison</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="performance-profiler">
      <header className="pp__header">
        <div className="pp__title-section">
          <div className="pp__icon">
            <Gauge size={28} />
          </div>
          <div>
            <h1>Performance Profiler</h1>
            <p>Analyze and optimize application performance</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Upload size={16} />
            Import Profile
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </header>

      <div className="pp__stats">
        <div className="stat-card">
          <div className="stat-icon sessions-icon">
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{PROFILE_SESSIONS.length}</span>
            <span className="stat-label">Profile Sessions</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon running-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{PROFILE_SESSIONS.filter(s => s.status === 'running').length}</span>
            <span className="stat-label">Running</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon hotspots-icon">
            <Flame size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{HOTSPOTS.filter(h => h.severity === 'critical' || h.severity === 'high').length}</span>
            <span className="stat-label">Critical Hotspots</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon samples-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(PROFILE_SESSIONS.reduce((sum, s) => sum + s.samples, 0))}</span>
            <span className="stat-label">Total Samples</span>
          </div>
        </div>
      </div>

      <div className="pp__tabs">
        <button 
          className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <Layers size={16} />
          Sessions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'flamegraph' ? 'active' : ''}`}
          onClick={() => setActiveTab('flamegraph')}
        >
          <Flame size={16} />
          Flame Graph
        </button>
        <button 
          className={`tab-btn ${activeTab === 'memory' ? 'active' : ''}`}
          onClick={() => setActiveTab('memory')}
        >
          <MemoryStick size={16} />
          Memory
        </button>
        <button 
          className={`tab-btn ${activeTab === 'hotspots' ? 'active' : ''}`}
          onClick={() => setActiveTab('hotspots')}
        >
          <Zap size={16} />
          Hotspots
          <span className="tab-badge">{HOTSPOTS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          <GitBranch size={16} />
          Compare
        </button>
      </div>

      <div className="pp__content">
        {activeTab === 'sessions' && renderSessions()}
        {activeTab === 'flamegraph' && renderFlameGraph()}
        {activeTab === 'memory' && renderMemory()}
        {activeTab === 'hotspots' && renderHotspots()}
        {activeTab === 'compare' && renderCompare()}
      </div>
    </div>
  );
}
