'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Network,
  Server,
  Database,
  Cloud,
  Globe,
  Container,
  Shield,
  Router,
  HardDrive,
  Cpu,
  Activity,
  Wifi,
  WifiOff,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Minus,
  Maximize2,
  Move,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  Box,
  Boxes,
  Layers,
  GitBranch,
  Link2,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Building,
  Laptop,
  Smartphone,
  Monitor,
  CircleDot
} from 'lucide-react';
import './network-topology.css';

interface NetworkNode {
  id: string;
  name: string;
  type: 'region' | 'vpc' | 'subnet' | 'loadbalancer' | 'server' | 'database' | 'cache' | 'cdn' | 'firewall' | 'gateway' | 'container' | 'service';
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  provider?: 'aws' | 'gcp' | 'azure' | 'cloudflare';
  ip?: string;
  connections: string[];
  metrics?: {
    cpu?: number;
    memory?: number;
    bandwidth?: string;
    latency?: number;
    requests?: number;
  };
  location?: string;
  details?: Record<string, string>;
}

interface NetworkConnection {
  id: string;
  source: string;
  target: string;
  type: 'vpc-peering' | 'direct' | 'vpn' | 'internet' | 'internal' | 'load-balanced';
  status: 'active' | 'degraded' | 'down';
  bandwidth?: string;
  latency?: number;
  encrypted: boolean;
}

interface TrafficFlow {
  id: string;
  source: string;
  destination: string;
  protocol: string;
  port: number;
  requests: number;
  bandwidth: string;
  status: 'allowed' | 'blocked';
}

const NETWORK_NODES: NetworkNode[] = [
  // Regions
  {
    id: 'region-us-east',
    name: 'US East (N. Virginia)',
    type: 'region',
    status: 'healthy',
    provider: 'aws',
    connections: ['vpc-prod', 'vpc-staging'],
    location: 'us-east-1'
  },
  {
    id: 'region-eu-west',
    name: 'EU West (Ireland)',
    type: 'region',
    status: 'healthy',
    provider: 'aws',
    connections: ['vpc-eu-prod'],
    location: 'eu-west-1'
  },
  {
    id: 'region-apac',
    name: 'Asia Pacific (Singapore)',
    type: 'region',
    status: 'warning',
    provider: 'aws',
    connections: ['vpc-apac'],
    location: 'ap-southeast-1'
  },
  // VPCs
  {
    id: 'vpc-prod',
    name: 'Production VPC',
    type: 'vpc',
    status: 'healthy',
    provider: 'aws',
    ip: '10.0.0.0/16',
    connections: ['subnet-web', 'subnet-app', 'subnet-data'],
    details: { cidr: '10.0.0.0/16', subnets: '6', instances: '48' }
  },
  {
    id: 'vpc-staging',
    name: 'Staging VPC',
    type: 'vpc',
    status: 'healthy',
    provider: 'aws',
    ip: '10.1.0.0/16',
    connections: ['subnet-staging'],
    details: { cidr: '10.1.0.0/16', subnets: '3', instances: '12' }
  },
  {
    id: 'vpc-eu-prod',
    name: 'EU Production VPC',
    type: 'vpc',
    status: 'healthy',
    provider: 'aws',
    ip: '10.2.0.0/16',
    connections: ['subnet-eu-web', 'subnet-eu-app'],
    details: { cidr: '10.2.0.0/16', subnets: '4', instances: '24' }
  },
  {
    id: 'vpc-apac',
    name: 'APAC VPC',
    type: 'vpc',
    status: 'warning',
    provider: 'aws',
    ip: '10.3.0.0/16',
    connections: ['subnet-apac-web'],
    details: { cidr: '10.3.0.0/16', subnets: '2', instances: '8' }
  },
  // Load Balancers
  {
    id: 'alb-main',
    name: 'Main Application LB',
    type: 'loadbalancer',
    status: 'healthy',
    provider: 'aws',
    ip: 'alb-main-1234.us-east-1.elb.amazonaws.com',
    connections: ['web-cluster-1', 'web-cluster-2'],
    metrics: { requests: 125000, latency: 12, bandwidth: '2.4 Gbps' }
  },
  {
    id: 'nlb-api',
    name: 'API Network LB',
    type: 'loadbalancer',
    status: 'healthy',
    provider: 'aws',
    ip: 'nlb-api-5678.us-east-1.elb.amazonaws.com',
    connections: ['api-cluster-1', 'api-cluster-2'],
    metrics: { requests: 85000, latency: 8, bandwidth: '1.8 Gbps' }
  },
  // Server Clusters
  {
    id: 'web-cluster-1',
    name: 'Web Cluster A',
    type: 'server',
    status: 'healthy',
    provider: 'aws',
    connections: ['api-cluster-1', 'cache-redis'],
    metrics: { cpu: 45, memory: 62, requests: 62500 },
    details: { instances: '6', type: 'c5.2xlarge', az: 'us-east-1a' }
  },
  {
    id: 'web-cluster-2',
    name: 'Web Cluster B',
    type: 'server',
    status: 'healthy',
    provider: 'aws',
    connections: ['api-cluster-2', 'cache-redis'],
    metrics: { cpu: 42, memory: 58, requests: 62500 },
    details: { instances: '6', type: 'c5.2xlarge', az: 'us-east-1b' }
  },
  {
    id: 'api-cluster-1',
    name: 'API Cluster A',
    type: 'service',
    status: 'healthy',
    provider: 'aws',
    connections: ['db-primary', 'cache-redis', 'queue-sqs'],
    metrics: { cpu: 58, memory: 71, requests: 42500 },
    details: { pods: '12', type: 'EKS', version: '1.28' }
  },
  {
    id: 'api-cluster-2',
    name: 'API Cluster B',
    type: 'service',
    status: 'healthy',
    provider: 'aws',
    connections: ['db-primary', 'cache-redis', 'queue-sqs'],
    metrics: { cpu: 55, memory: 68, requests: 42500 },
    details: { pods: '12', type: 'EKS', version: '1.28' }
  },
  // Databases
  {
    id: 'db-primary',
    name: 'PostgreSQL Primary',
    type: 'database',
    status: 'healthy',
    provider: 'aws',
    ip: 'db-primary.cluster-xyz.us-east-1.rds.amazonaws.com',
    connections: ['db-replica-1', 'db-replica-2'],
    metrics: { cpu: 35, memory: 72, latency: 2 },
    details: { type: 'db.r6g.2xlarge', storage: '2TB', iops: '12000' }
  },
  {
    id: 'db-replica-1',
    name: 'PostgreSQL Replica 1',
    type: 'database',
    status: 'healthy',
    provider: 'aws',
    connections: [],
    metrics: { cpu: 28, memory: 65, latency: 3 },
    details: { type: 'db.r6g.xlarge', storage: '2TB', lag: '< 1ms' }
  },
  {
    id: 'db-replica-2',
    name: 'PostgreSQL Replica 2',
    type: 'database',
    status: 'healthy',
    provider: 'aws',
    connections: [],
    metrics: { cpu: 25, memory: 62, latency: 4 },
    details: { type: 'db.r6g.xlarge', storage: '2TB', lag: '< 1ms' }
  },
  // Cache
  {
    id: 'cache-redis',
    name: 'Redis Cluster',
    type: 'cache',
    status: 'healthy',
    provider: 'aws',
    connections: [],
    metrics: { cpu: 22, memory: 45, latency: 0.5 },
    details: { type: 'cache.r6g.xlarge', nodes: '6', mode: 'cluster' }
  },
  // CDN
  {
    id: 'cdn-cloudflare',
    name: 'Cloudflare CDN',
    type: 'cdn',
    status: 'healthy',
    provider: 'cloudflare',
    connections: ['alb-main'],
    metrics: { requests: 500000, bandwidth: '15 Gbps', latency: 25 },
    details: { pops: '285', cacheHit: '94.5%', threats: '12K blocked' }
  },
  // Gateway
  {
    id: 'api-gateway',
    name: 'API Gateway',
    type: 'gateway',
    status: 'healthy',
    provider: 'aws',
    connections: ['nlb-api'],
    metrics: { requests: 85000, latency: 5 },
    details: { type: 'REST', stages: '3', throttle: '10K/s' }
  },
  // Firewall
  {
    id: 'waf-main',
    name: 'Web Application Firewall',
    type: 'firewall',
    status: 'healthy',
    provider: 'aws',
    connections: ['cdn-cloudflare', 'alb-main'],
    metrics: { requests: 625000 },
    details: { rules: '45', blocked: '8.2K', mode: 'active' }
  }
];

const NETWORK_CONNECTIONS: NetworkConnection[] = [
  { id: 'conn-1', source: 'cdn-cloudflare', target: 'waf-main', type: 'internet', status: 'active', bandwidth: '15 Gbps', latency: 25, encrypted: true },
  { id: 'conn-2', source: 'waf-main', target: 'alb-main', type: 'direct', status: 'active', bandwidth: '10 Gbps', latency: 1, encrypted: true },
  { id: 'conn-3', source: 'alb-main', target: 'web-cluster-1', type: 'load-balanced', status: 'active', bandwidth: '2.4 Gbps', latency: 1, encrypted: false },
  { id: 'conn-4', source: 'alb-main', target: 'web-cluster-2', type: 'load-balanced', status: 'active', bandwidth: '2.4 Gbps', latency: 1, encrypted: false },
  { id: 'conn-5', source: 'api-gateway', target: 'nlb-api', type: 'direct', status: 'active', bandwidth: '5 Gbps', latency: 2, encrypted: true },
  { id: 'conn-6', source: 'nlb-api', target: 'api-cluster-1', type: 'load-balanced', status: 'active', bandwidth: '1.8 Gbps', latency: 1, encrypted: false },
  { id: 'conn-7', source: 'nlb-api', target: 'api-cluster-2', type: 'load-balanced', status: 'active', bandwidth: '1.8 Gbps', latency: 1, encrypted: false },
  { id: 'conn-8', source: 'api-cluster-1', target: 'db-primary', type: 'internal', status: 'active', bandwidth: '1 Gbps', latency: 2, encrypted: true },
  { id: 'conn-9', source: 'api-cluster-2', target: 'db-primary', type: 'internal', status: 'active', bandwidth: '1 Gbps', latency: 2, encrypted: true },
  { id: 'conn-10', source: 'db-primary', target: 'db-replica-1', type: 'internal', status: 'active', bandwidth: '500 Mbps', latency: 1, encrypted: true },
  { id: 'conn-11', source: 'db-primary', target: 'db-replica-2', type: 'internal', status: 'active', bandwidth: '500 Mbps', latency: 1, encrypted: true },
  { id: 'conn-12', source: 'web-cluster-1', target: 'cache-redis', type: 'internal', status: 'active', bandwidth: '1 Gbps', latency: 0.5, encrypted: false },
  { id: 'conn-13', source: 'web-cluster-2', target: 'cache-redis', type: 'internal', status: 'active', bandwidth: '1 Gbps', latency: 0.5, encrypted: false },
  { id: 'conn-14', source: 'vpc-prod', target: 'vpc-eu-prod', type: 'vpc-peering', status: 'active', bandwidth: '5 Gbps', latency: 85, encrypted: true },
  { id: 'conn-15', source: 'vpc-prod', target: 'vpc-apac', type: 'vpc-peering', status: 'degraded', bandwidth: '2 Gbps', latency: 180, encrypted: true }
];

const TRAFFIC_FLOWS: TrafficFlow[] = [
  { id: 'flow-1', source: 'Internet', destination: 'cdn-cloudflare', protocol: 'HTTPS', port: 443, requests: 500000, bandwidth: '15 Gbps', status: 'allowed' },
  { id: 'flow-2', source: 'cdn-cloudflare', destination: 'alb-main', protocol: 'HTTPS', port: 443, requests: 250000, bandwidth: '8 Gbps', status: 'allowed' },
  { id: 'flow-3', source: 'alb-main', destination: 'web-cluster', protocol: 'HTTP', port: 8080, requests: 125000, bandwidth: '4.8 Gbps', status: 'allowed' },
  { id: 'flow-4', source: 'api-gateway', destination: 'api-cluster', protocol: 'HTTP', port: 3000, requests: 85000, bandwidth: '3.6 Gbps', status: 'allowed' },
  { id: 'flow-5', source: 'api-cluster', destination: 'db-primary', protocol: 'PostgreSQL', port: 5432, requests: 42000, bandwidth: '2 Gbps', status: 'allowed' },
  { id: 'flow-6', source: 'Unknown', destination: 'alb-main', protocol: 'HTTP', port: 80, requests: 8200, bandwidth: '150 Mbps', status: 'blocked' }
];

const NODE_ICONS: Record<NetworkNode['type'], React.ReactNode> = {
  region: <Globe size={20} />,
  vpc: <Cloud size={20} />,
  subnet: <Layers size={20} />,
  loadbalancer: <GitBranch size={20} />,
  server: <Server size={20} />,
  database: <Database size={20} />,
  cache: <HardDrive size={20} />,
  cdn: <Globe size={20} />,
  firewall: <Shield size={20} />,
  gateway: <Router size={20} />,
  container: <Container size={20} />,
  service: <Box size={20} />
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  healthy: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: 'Healthy' },
  warning: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Warning' },
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Critical' },
  unknown: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', label: 'Unknown' },
  active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: 'Active' },
  degraded: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Degraded' },
  down: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Down' }
};

export default function NetworkTopologyPage() {
  const [activeTab, setActiveTab] = useState<'topology' | 'nodes' | 'connections' | 'traffic'>('topology');
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [viewMode, setViewMode] = useState<'hierarchical' | 'force' | 'layers'>('hierarchical');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const healthyNodes = NETWORK_NODES.filter(n => n.status === 'healthy').length;
  const activeConnections = NETWORK_CONNECTIONS.filter(c => c.status === 'active').length;
  const totalBandwidth = '45 Gbps';
  const avgLatency = Math.round(NETWORK_CONNECTIONS.reduce((acc, c) => acc + (c.latency || 0), 0) / NETWORK_CONNECTIONS.length);

  const filteredNodes = NETWORK_NODES.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         node.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || node.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getNodesByType = (type: NetworkNode['type']) => {
    return NETWORK_NODES.filter(n => n.type === type);
  };

  return (
    <div className="network-topology">
      {/* Header */}
      <header className="nettop__header">
        <div className="nettop__title-section">
          <div className="nettop__icon">
            <Network size={28} />
          </div>
          <div>
            <h1>Network Topology</h1>
            <p>Visualize and monitor your infrastructure network</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export Diagram
          </button>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Auto-Discover
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Add Node
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="nettop__stats">
        <div className="stat-card primary">
          <div className="stat-icon nodes">
            <Server size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{healthyNodes}/{NETWORK_NODES.length}</span>
            <span className="stat-label">Nodes Healthy</span>
          </div>
          <span className="stat-badge healthy">All Systems Go</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon connections">
            <Link2 size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeConnections}</span>
            <span className="stat-label">Active Connections</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bandwidth">
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalBandwidth}</span>
            <span className="stat-label">Total Bandwidth</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon latency">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgLatency}ms</span>
            <span className="stat-label">Avg Latency</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="nettop__tabs">
        <button 
          className={`tab-btn ${activeTab === 'topology' ? 'active' : ''}`}
          onClick={() => setActiveTab('topology')}
        >
          <Network size={16} />
          Topology View
        </button>
        <button 
          className={`tab-btn ${activeTab === 'nodes' ? 'active' : ''}`}
          onClick={() => setActiveTab('nodes')}
        >
          <Server size={16} />
          Nodes
          <span className="tab-badge">{NETWORK_NODES.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          <Link2 size={16} />
          Connections
        </button>
        <button 
          className={`tab-btn ${activeTab === 'traffic' ? 'active' : ''}`}
          onClick={() => setActiveTab('traffic')}
        >
          <Activity size={16} />
          Traffic Flows
        </button>
      </div>

      {/* Content */}
      <div className="nettop__content">
        {activeTab === 'topology' && (
          <div className="topology-section">
            <div className="topology-toolbar">
              <div className="view-modes">
                <button 
                  className={`mode-btn ${viewMode === 'hierarchical' ? 'active' : ''}`}
                  onClick={() => setViewMode('hierarchical')}
                >
                  <Layers size={16} />
                  Hierarchical
                </button>
                <button 
                  className={`mode-btn ${viewMode === 'layers' ? 'active' : ''}`}
                  onClick={() => setViewMode('layers')}
                >
                  <Boxes size={16} />
                  Layers
                </button>
              </div>
              <div className="zoom-controls">
                <button className="zoom-btn"><Minus size={16} /></button>
                <span className="zoom-level">100%</span>
                <button className="zoom-btn"><Plus size={16} /></button>
                <button className="zoom-btn"><Maximize2 size={16} /></button>
              </div>
            </div>

            <div className="topology-canvas">
              {/* Layer: Edge/CDN */}
              <div className="topology-layer edge-layer">
                <div className="layer-label">Edge / CDN</div>
                <div className="layer-nodes">
                  {getNodesByType('cdn').map(node => (
                    <div 
                      key={node.id} 
                      className={`topology-node ${node.type} ${node.status}`}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="node-icon">{NODE_ICONS[node.type]}</div>
                      <div className="node-info">
                        <span className="node-name">{node.name}</span>
                        <span className="node-meta">{node.metrics?.bandwidth}</span>
                      </div>
                      <span className="node-status-dot" style={{ background: STATUS_CONFIG[node.status].color }} />
                    </div>
                  ))}
                  {getNodesByType('firewall').map(node => (
                    <div 
                      key={node.id} 
                      className={`topology-node ${node.type} ${node.status}`}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="node-icon">{NODE_ICONS[node.type]}</div>
                      <div className="node-info">
                        <span className="node-name">{node.name}</span>
                        <span className="node-meta">{node.details?.blocked} blocked</span>
                      </div>
                      <span className="node-status-dot" style={{ background: STATUS_CONFIG[node.status].color }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Connection Lines */}
              <div className="connection-line horizontal">
                <div className="line-label">HTTPS 443</div>
              </div>

              {/* Layer: Load Balancers */}
              <div className="topology-layer lb-layer">
                <div className="layer-label">Load Balancers</div>
                <div className="layer-nodes">
                  {getNodesByType('loadbalancer').map(node => (
                    <div 
                      key={node.id} 
                      className={`topology-node ${node.type} ${node.status}`}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="node-icon">{NODE_ICONS[node.type]}</div>
                      <div className="node-info">
                        <span className="node-name">{node.name}</span>
                        <span className="node-meta">{node.metrics?.requests?.toLocaleString()} req/s</span>
                      </div>
                      <span className="node-status-dot" style={{ background: STATUS_CONFIG[node.status].color }} />
                    </div>
                  ))}
                  {getNodesByType('gateway').map(node => (
                    <div 
                      key={node.id} 
                      className={`topology-node ${node.type} ${node.status}`}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="node-icon">{NODE_ICONS[node.type]}</div>
                      <div className="node-info">
                        <span className="node-name">{node.name}</span>
                        <span className="node-meta">{node.details?.throttle}</span>
                      </div>
                      <span className="node-status-dot" style={{ background: STATUS_CONFIG[node.status].color }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Connection Lines */}
              <div className="connection-line horizontal">
                <div className="line-label">Internal</div>
              </div>

              {/* Layer: Compute */}
              <div className="topology-layer compute-layer">
                <div className="layer-label">Compute / Services</div>
                <div className="layer-nodes">
                  {getNodesByType('server').map(node => (
                    <div 
                      key={node.id} 
                      className={`topology-node ${node.type} ${node.status}`}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="node-icon">{NODE_ICONS[node.type]}</div>
                      <div className="node-info">
                        <span className="node-name">{node.name}</span>
                        <span className="node-meta">CPU: {node.metrics?.cpu}%</span>
                      </div>
                      <span className="node-status-dot" style={{ background: STATUS_CONFIG[node.status].color }} />
                    </div>
                  ))}
                  {getNodesByType('service').map(node => (
                    <div 
                      key={node.id} 
                      className={`topology-node ${node.type} ${node.status}`}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="node-icon">{NODE_ICONS[node.type]}</div>
                      <div className="node-info">
                        <span className="node-name">{node.name}</span>
                        <span className="node-meta">{node.details?.pods} pods</span>
                      </div>
                      <span className="node-status-dot" style={{ background: STATUS_CONFIG[node.status].color }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Connection Lines */}
              <div className="connection-line horizontal">
                <div className="line-label">Internal</div>
              </div>

              {/* Layer: Data */}
              <div className="topology-layer data-layer">
                <div className="layer-label">Data Layer</div>
                <div className="layer-nodes">
                  {getNodesByType('database').map(node => (
                    <div 
                      key={node.id} 
                      className={`topology-node ${node.type} ${node.status}`}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="node-icon">{NODE_ICONS[node.type]}</div>
                      <div className="node-info">
                        <span className="node-name">{node.name}</span>
                        <span className="node-meta">{node.details?.storage}</span>
                      </div>
                      <span className="node-status-dot" style={{ background: STATUS_CONFIG[node.status].color }} />
                    </div>
                  ))}
                  {getNodesByType('cache').map(node => (
                    <div 
                      key={node.id} 
                      className={`topology-node ${node.type} ${node.status}`}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="node-icon">{NODE_ICONS[node.type]}</div>
                      <div className="node-info">
                        <span className="node-name">{node.name}</span>
                        <span className="node-meta">{node.details?.nodes} nodes</span>
                      </div>
                      <span className="node-status-dot" style={{ background: STATUS_CONFIG[node.status].color }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Node Details Panel */}
            {selectedNode && (
              <div className="node-details-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <div className={`panel-icon ${selectedNode.type}`}>
                      {NODE_ICONS[selectedNode.type]}
                    </div>
                    <div>
                      <h3>{selectedNode.name}</h3>
                      <span className="panel-type">{selectedNode.type}</span>
                    </div>
                  </div>
                  <button className="close-btn" onClick={() => setSelectedNode(null)}>×</button>
                </div>
                <div className="panel-content">
                  <div className="panel-status">
                    <span 
                      className="status-badge"
                      style={{ 
                        background: STATUS_CONFIG[selectedNode.status].bg,
                        color: STATUS_CONFIG[selectedNode.status].color
                      }}
                    >
                      {STATUS_CONFIG[selectedNode.status].label}
                    </span>
                    {selectedNode.provider && (
                      <span className="provider-badge">{selectedNode.provider.toUpperCase()}</span>
                    )}
                  </div>
                  {selectedNode.ip && (
                    <div className="panel-field">
                      <span className="field-label">Address</span>
                      <span className="field-value mono">{selectedNode.ip}</span>
                    </div>
                  )}
                  {selectedNode.metrics && (
                    <div className="panel-metrics">
                      <h4>Metrics</h4>
                      <div className="metrics-grid">
                        {selectedNode.metrics.cpu !== undefined && (
                          <div className="metric-item">
                            <Cpu size={14} />
                            <span>CPU: {selectedNode.metrics.cpu}%</span>
                          </div>
                        )}
                        {selectedNode.metrics.memory !== undefined && (
                          <div className="metric-item">
                            <HardDrive size={14} />
                            <span>Memory: {selectedNode.metrics.memory}%</span>
                          </div>
                        )}
                        {selectedNode.metrics.latency !== undefined && (
                          <div className="metric-item">
                            <Clock size={14} />
                            <span>Latency: {selectedNode.metrics.latency}ms</span>
                          </div>
                        )}
                        {selectedNode.metrics.requests !== undefined && (
                          <div className="metric-item">
                            <Activity size={14} />
                            <span>Requests: {selectedNode.metrics.requests.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedNode.metrics.bandwidth && (
                          <div className="metric-item">
                            <Wifi size={14} />
                            <span>Bandwidth: {selectedNode.metrics.bandwidth}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedNode.details && (
                    <div className="panel-details">
                      <h4>Details</h4>
                      <div className="details-list">
                        {Object.entries(selectedNode.details).map(([key, value]) => (
                          <div key={key} className="detail-row">
                            <span className="detail-key">{key}</span>
                            <span className="detail-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="panel-connections">
                    <h4>Connections ({selectedNode.connections.length})</h4>
                    <div className="connections-list">
                      {selectedNode.connections.map(connId => {
                        const targetNode = NETWORK_NODES.find(n => n.id === connId);
                        return targetNode ? (
                          <div key={connId} className="connection-item" onClick={() => setSelectedNode(targetNode)}>
                            <span className="conn-icon">{NODE_ICONS[targetNode.type]}</span>
                            <span className="conn-name">{targetNode.name}</span>
                            <ChevronRight size={14} />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nodes' && (
          <div className="nodes-section">
            <div className="nodes-toolbar">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text"
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="healthy">Healthy</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="nodes-grid">
              {filteredNodes.map(node => (
                <div key={node.id} className={`node-card ${node.status}`}>
                  <div className="node-header">
                    <div className={`node-type-icon ${node.type}`}>
                      {NODE_ICONS[node.type]}
                    </div>
                    <span 
                      className="node-status"
                      style={{ 
                        background: STATUS_CONFIG[node.status].bg,
                        color: STATUS_CONFIG[node.status].color
                      }}
                    >
                      {STATUS_CONFIG[node.status].label}
                    </span>
                  </div>
                  <h4 className="node-title">{node.name}</h4>
                  <span className="node-type-label">{node.type}</span>
                  {node.ip && <span className="node-ip">{node.ip}</span>}
                  {node.metrics && (
                    <div className="node-metrics">
                      {node.metrics.cpu !== undefined && (
                        <div className="mini-metric">
                          <span className="metric-label">CPU</span>
                          <span className="metric-value">{node.metrics.cpu}%</span>
                        </div>
                      )}
                      {node.metrics.memory !== undefined && (
                        <div className="mini-metric">
                          <span className="metric-label">Memory</span>
                          <span className="metric-value">{node.metrics.memory}%</span>
                        </div>
                      )}
                      {node.metrics.latency !== undefined && (
                        <div className="mini-metric">
                          <span className="metric-label">Latency</span>
                          <span className="metric-value">{node.metrics.latency}ms</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="node-actions">
                    <button className="node-action-btn" onClick={() => setSelectedNode(node)}>
                      <Eye size={14} />
                      View
                    </button>
                    <button className="node-action-btn">
                      <Settings size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="connections-section">
            <div className="connections-table">
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Target</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Bandwidth</th>
                    <th>Latency</th>
                    <th>Encrypted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {NETWORK_CONNECTIONS.map(conn => {
                    const sourceNode = NETWORK_NODES.find(n => n.id === conn.source);
                    const targetNode = NETWORK_NODES.find(n => n.id === conn.target);
                    const statusConfig = STATUS_CONFIG[conn.status];
                    return (
                      <tr key={conn.id}>
                        <td className="conn-cell">
                          <span className="conn-node">
                            {sourceNode && NODE_ICONS[sourceNode.type]}
                            {sourceNode?.name || conn.source}
                          </span>
                        </td>
                        <td className="conn-cell">
                          <span className="conn-node">
                            {targetNode && NODE_ICONS[targetNode.type]}
                            {targetNode?.name || conn.target}
                          </span>
                        </td>
                        <td>
                          <span className={`conn-type ${conn.type}`}>{conn.type}</span>
                        </td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ background: statusConfig.bg, color: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                        <td>{conn.bandwidth || '-'}</td>
                        <td>{conn.latency ? `${conn.latency}ms` : '-'}</td>
                        <td>
                          {conn.encrypted ? (
                            <Lock size={14} className="encrypted" />
                          ) : (
                            <Unlock size={14} className="unencrypted" />
                          )}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="icon-btn"><Eye size={14} /></button>
                            <button className="icon-btn"><Settings size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'traffic' && (
          <div className="traffic-section">
            <div className="traffic-header">
              <h3>Active Traffic Flows</h3>
              <span className="traffic-time">Last 5 minutes</span>
            </div>
            <div className="traffic-list">
              {TRAFFIC_FLOWS.map(flow => (
                <div key={flow.id} className={`traffic-card ${flow.status}`}>
                  <div className="traffic-flow">
                    <div className="flow-source">
                      <Globe size={16} />
                      <span>{flow.source}</span>
                    </div>
                    <div className="flow-arrow">
                      <ArrowUpRight size={16} />
                      <span className="flow-protocol">{flow.protocol}:{flow.port}</span>
                    </div>
                    <div className="flow-destination">
                      <Server size={16} />
                      <span>{flow.destination}</span>
                    </div>
                  </div>
                  <div className="traffic-stats">
                    <span className="traffic-stat">
                      <Activity size={12} />
                      {flow.requests.toLocaleString()} req/s
                    </span>
                    <span className="traffic-stat">
                      <Wifi size={12} />
                      {flow.bandwidth}
                    </span>
                    <span className={`traffic-status ${flow.status}`}>
                      {flow.status === 'allowed' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {flow.status}
                    </span>
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
