'use client';

import React, { useState, useCallback } from 'react';
import { 
  Network,
  Globe,
  Server,
  Database,
  Cloud,
  Shield,
  Wifi,
  WifiOff,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Search,
  RefreshCw,
  Download,
  Maximize2,
  Minimize2,
  Settings,
  ChevronRight,
  ChevronDown,
  Router,
  HardDrive,
  Layers,
  Link2,
  Unlink,
  ArrowRight,
  ArrowLeftRight,
  Circle,
  Box,
  Cpu,
  MonitorSpeaker,
  FileJson,
  Info,
  MoreVertical,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Copy
} from 'lucide-react';
import './network-topology.css';

interface NetworkNode {
  id: string;
  name: string;
  type: 'vpc' | 'subnet' | 'load-balancer' | 'instance' | 'database' | 'cache' | 'firewall' | 'gateway' | 'cdn' | 'dns';
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  region: string;
  zone?: string;
  ip?: string;
  publicIp?: string;
  connections: string[];
  metadata: Record<string, string>;
}

interface NetworkConnection {
  id: string;
  source: string;
  target: string;
  type: 'vpc-peering' | 'internet' | 'private' | 'vpn' | 'direct-connect';
  status: 'active' | 'degraded' | 'down';
  bandwidth: string;
  latency: string;
  encrypted: boolean;
}

interface TrafficFlow {
  id: string;
  source: string;
  target: string;
  protocol: string;
  port: number;
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  status: 'normal' | 'high' | 'blocked';
}

interface SecurityGroup {
  id: string;
  name: string;
  description: string;
  inboundRules: number;
  outboundRules: number;
  attachedResources: number;
  region: string;
}

const NetworkTopologyViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'topology' | 'connections' | 'traffic' | 'security'>('topology');
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'hierarchical' | 'force' | 'geographic'>('hierarchical');

  const nodes: NetworkNode[] = [
    {
      id: 'vpc-1',
      name: 'Production VPC',
      type: 'vpc',
      status: 'healthy',
      region: 'us-east-1',
      ip: '10.0.0.0/16',
      connections: ['igw-1', 'nat-1', 'subnet-1', 'subnet-2', 'subnet-3'],
      metadata: { cidr: '10.0.0.0/16', tenancy: 'default' }
    },
    {
      id: 'subnet-1',
      name: 'Public Subnet A',
      type: 'subnet',
      status: 'healthy',
      region: 'us-east-1',
      zone: 'us-east-1a',
      ip: '10.0.1.0/24',
      connections: ['alb-1', 'bastion-1'],
      metadata: { availableIps: '250', type: 'public' }
    },
    {
      id: 'subnet-2',
      name: 'Private Subnet A',
      type: 'subnet',
      status: 'healthy',
      region: 'us-east-1',
      zone: 'us-east-1a',
      ip: '10.0.2.0/24',
      connections: ['app-1', 'app-2', 'cache-1'],
      metadata: { availableIps: '240', type: 'private' }
    },
    {
      id: 'subnet-3',
      name: 'Database Subnet',
      type: 'subnet',
      status: 'healthy',
      region: 'us-east-1',
      zone: 'us-east-1b',
      ip: '10.0.3.0/24',
      connections: ['db-1', 'db-2'],
      metadata: { availableIps: '252', type: 'private' }
    },
    {
      id: 'igw-1',
      name: 'Internet Gateway',
      type: 'gateway',
      status: 'healthy',
      region: 'us-east-1',
      connections: ['vpc-1', 'cdn-1'],
      metadata: { attachedVpc: 'vpc-1' }
    },
    {
      id: 'nat-1',
      name: 'NAT Gateway',
      type: 'gateway',
      status: 'healthy',
      region: 'us-east-1',
      publicIp: '54.23.123.45',
      connections: ['vpc-1', 'subnet-1'],
      metadata: { type: 'nat', elasticIp: '54.23.123.45' }
    },
    {
      id: 'alb-1',
      name: 'Application Load Balancer',
      type: 'load-balancer',
      status: 'healthy',
      region: 'us-east-1',
      publicIp: '52.44.55.66',
      connections: ['app-1', 'app-2', 'subnet-1'],
      metadata: { type: 'application', scheme: 'internet-facing' }
    },
    {
      id: 'app-1',
      name: 'API Server 1',
      type: 'instance',
      status: 'healthy',
      region: 'us-east-1',
      zone: 'us-east-1a',
      ip: '10.0.2.10',
      connections: ['alb-1', 'db-1', 'cache-1'],
      metadata: { instanceType: 't3.large', ami: 'ami-0123456789' }
    },
    {
      id: 'app-2',
      name: 'API Server 2',
      type: 'instance',
      status: 'warning',
      region: 'us-east-1',
      zone: 'us-east-1b',
      ip: '10.0.2.11',
      connections: ['alb-1', 'db-1', 'cache-1'],
      metadata: { instanceType: 't3.large', ami: 'ami-0123456789' }
    },
    {
      id: 'db-1',
      name: 'Primary Database',
      type: 'database',
      status: 'healthy',
      region: 'us-east-1',
      zone: 'us-east-1a',
      ip: '10.0.3.10',
      connections: ['app-1', 'app-2', 'db-2'],
      metadata: { engine: 'PostgreSQL 15', instanceClass: 'db.r5.xlarge' }
    },
    {
      id: 'db-2',
      name: 'Replica Database',
      type: 'database',
      status: 'healthy',
      region: 'us-east-1',
      zone: 'us-east-1b',
      ip: '10.0.3.11',
      connections: ['db-1'],
      metadata: { engine: 'PostgreSQL 15', instanceClass: 'db.r5.large', role: 'replica' }
    },
    {
      id: 'cache-1',
      name: 'Redis Cache',
      type: 'cache',
      status: 'healthy',
      region: 'us-east-1',
      ip: '10.0.2.50',
      connections: ['app-1', 'app-2'],
      metadata: { engine: 'Redis 7.0', nodeType: 'cache.r6g.large' }
    },
    {
      id: 'cdn-1',
      name: 'CloudFront CDN',
      type: 'cdn',
      status: 'healthy',
      region: 'global',
      connections: ['igw-1', 'alb-1'],
      metadata: { priceClass: 'PriceClass_All', origins: '2' }
    },
    {
      id: 'fw-1',
      name: 'Network Firewall',
      type: 'firewall',
      status: 'healthy',
      region: 'us-east-1',
      connections: ['vpc-1', 'igw-1'],
      metadata: { rulesCount: '45', policyType: 'stateful' }
    },
    {
      id: 'dns-1',
      name: 'Route 53',
      type: 'dns',
      status: 'healthy',
      region: 'global',
      connections: ['cdn-1', 'alb-1'],
      metadata: { hostedZones: '3', recordSets: '48' }
    }
  ];

  const connections: NetworkConnection[] = [
    { id: 'conn-1', source: 'dns-1', target: 'cdn-1', type: 'internet', status: 'active', bandwidth: '10 Gbps', latency: '2ms', encrypted: true },
    { id: 'conn-2', source: 'cdn-1', target: 'alb-1', type: 'internet', status: 'active', bandwidth: '5 Gbps', latency: '15ms', encrypted: true },
    { id: 'conn-3', source: 'alb-1', target: 'app-1', type: 'private', status: 'active', bandwidth: '1 Gbps', latency: '0.5ms', encrypted: false },
    { id: 'conn-4', source: 'alb-1', target: 'app-2', type: 'private', status: 'degraded', bandwidth: '1 Gbps', latency: '2ms', encrypted: false },
    { id: 'conn-5', source: 'app-1', target: 'db-1', type: 'private', status: 'active', bandwidth: '1 Gbps', latency: '0.3ms', encrypted: true },
    { id: 'conn-6', source: 'app-2', target: 'db-1', type: 'private', status: 'active', bandwidth: '1 Gbps', latency: '0.4ms', encrypted: true },
    { id: 'conn-7', source: 'db-1', target: 'db-2', type: 'private', status: 'active', bandwidth: '500 Mbps', latency: '1ms', encrypted: true },
    { id: 'conn-8', source: 'app-1', target: 'cache-1', type: 'private', status: 'active', bandwidth: '1 Gbps', latency: '0.2ms', encrypted: false },
    { id: 'conn-9', source: 'vpc-1', target: 'igw-1', type: 'internet', status: 'active', bandwidth: '10 Gbps', latency: '1ms', encrypted: false },
    { id: 'conn-10', source: 'vpc-1', target: 'nat-1', type: 'private', status: 'active', bandwidth: '5 Gbps', latency: '0.5ms', encrypted: false }
  ];

  const trafficFlows: TrafficFlow[] = [
    { id: 'flow-1', source: 'cdn-1', target: 'alb-1', protocol: 'HTTPS', port: 443, bytesIn: 125000000, bytesOut: 850000000, packetsIn: 180000, packetsOut: 920000, status: 'normal' },
    { id: 'flow-2', source: 'alb-1', target: 'app-1', protocol: 'HTTP', port: 8080, bytesIn: 95000000, bytesOut: 420000000, packetsIn: 145000, packetsOut: 580000, status: 'normal' },
    { id: 'flow-3', source: 'alb-1', target: 'app-2', protocol: 'HTTP', port: 8080, bytesIn: 30000000, bytesOut: 180000000, packetsIn: 35000, packetsOut: 200000, status: 'high' },
    { id: 'flow-4', source: 'app-1', target: 'db-1', protocol: 'PostgreSQL', port: 5432, bytesIn: 45000000, bytesOut: 120000000, packetsIn: 68000, packetsOut: 156000, status: 'normal' },
    { id: 'flow-5', source: 'app-1', target: 'cache-1', protocol: 'Redis', port: 6379, bytesIn: 8000000, bytesOut: 65000000, packetsIn: 250000, packetsOut: 890000, status: 'normal' },
    { id: 'flow-6', source: 'app-2', target: 'cache-1', protocol: 'Redis', port: 6379, bytesIn: 2500000, bytesOut: 18000000, packetsIn: 75000, packetsOut: 245000, status: 'normal' },
    { id: 'flow-7', source: 'db-1', target: 'db-2', protocol: 'PostgreSQL', port: 5432, bytesIn: 500000, bytesOut: 85000000, packetsIn: 1200, packetsOut: 125000, status: 'normal' }
  ];

  const securityGroups: SecurityGroup[] = [
    { id: 'sg-1', name: 'alb-security-group', description: 'Security group for Application Load Balancer', inboundRules: 3, outboundRules: 1, attachedResources: 1, region: 'us-east-1' },
    { id: 'sg-2', name: 'app-security-group', description: 'Security group for API servers', inboundRules: 5, outboundRules: 3, attachedResources: 2, region: 'us-east-1' },
    { id: 'sg-3', name: 'db-security-group', description: 'Security group for database instances', inboundRules: 2, outboundRules: 1, attachedResources: 2, region: 'us-east-1' },
    { id: 'sg-4', name: 'cache-security-group', description: 'Security group for Redis cache', inboundRules: 2, outboundRules: 1, attachedResources: 1, region: 'us-east-1' },
    { id: 'sg-5', name: 'bastion-security-group', description: 'Security group for bastion host', inboundRules: 1, outboundRules: 1, attachedResources: 1, region: 'us-east-1' }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'vpc': return <Cloud size={20} />;
      case 'subnet': return <Layers size={20} />;
      case 'load-balancer': return <Router size={20} />;
      case 'instance': return <Server size={20} />;
      case 'database': return <Database size={20} />;
      case 'cache': return <HardDrive size={20} />;
      case 'firewall': return <Shield size={20} />;
      case 'gateway': return <Globe size={20} />;
      case 'cdn': return <Globe size={20} />;
      case 'dns': return <Network size={20} />;
      default: return <Box size={20} />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`;
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    if (bytes >= 1000) return `${(bytes / 1000).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const healthyNodes = nodes.filter(n => n.status === 'healthy').length;
  const warningNodes = nodes.filter(n => n.status === 'warning').length;
  const criticalNodes = nodes.filter(n => n.status === 'critical').length;
  const activeConnections = connections.filter(c => c.status === 'active').length;

  const filteredNodes = nodes.filter(node => 
    node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`network-topology ${isFullscreen ? 'fullscreen' : ''}`}>
      <header className="nt__header">
        <div className="nt__title-section">
          <div className="nt__icon">
            <Network size={28} />
          </div>
          <div>
            <h1>Network Topology</h1>
            <p>Visualize and manage your infrastructure network</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className={`btn-icon ${showLabels ? 'active' : ''}`}
            onClick={() => setShowLabels(!showLabels)}
            title="Toggle labels"
          >
            {showLabels ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
            Refresh
          </button>
          <button 
            className="btn-icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button className="btn-primary">
            <Download size={16} />
            Export
          </button>
        </div>
      </header>

      <div className="topology-summary">
        <div className="summary-card healthy">
          <CheckCircle2 size={20} />
          <div className="summary-info">
            <span className="summary-value">{healthyNodes}</span>
            <span className="summary-label">Healthy</span>
          </div>
        </div>
        <div className="summary-card warning">
          <AlertTriangle size={20} />
          <div className="summary-info">
            <span className="summary-value">{warningNodes}</span>
            <span className="summary-label">Warning</span>
          </div>
        </div>
        <div className="summary-card critical">
          <AlertTriangle size={20} />
          <div className="summary-info">
            <span className="summary-value">{criticalNodes}</span>
            <span className="summary-label">Critical</span>
          </div>
        </div>
        <div className="summary-card connections">
          <Link2 size={20} />
          <div className="summary-info">
            <span className="summary-value">{activeConnections}/{connections.length}</span>
            <span className="summary-label">Active Links</span>
          </div>
        </div>
        <div className="summary-card total">
          <Server size={20} />
          <div className="summary-info">
            <span className="summary-value">{nodes.length}</span>
            <span className="summary-label">Total Nodes</span>
          </div>
        </div>
      </div>

      <nav className="nt__tabs">
        <button 
          className={`tab-btn ${activeTab === 'topology' ? 'active' : ''}`}
          onClick={() => setActiveTab('topology')}
        >
          <Network size={16} />
          Topology View
        </button>
        <button 
          className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          <Link2 size={16} />
          Connections
          <span className="tab-badge">{connections.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'traffic' ? 'active' : ''}`}
          onClick={() => setActiveTab('traffic')}
        >
          <Activity size={16} />
          Traffic Flow
        </button>
        <button 
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={16} />
          Security Groups
        </button>
      </nav>

      <main className="nt__content">
        {activeTab === 'topology' && (
          <div className="topology-tab">
            <div className="topology-controls">
              <div className="view-mode-selector">
                <button 
                  className={viewMode === 'hierarchical' ? 'active' : ''}
                  onClick={() => setViewMode('hierarchical')}
                >
                  Hierarchical
                </button>
                <button 
                  className={viewMode === 'force' ? 'active' : ''}
                  onClick={() => setViewMode('force')}
                >
                  Force Layout
                </button>
                <button 
                  className={viewMode === 'geographic' ? 'active' : ''}
                  onClick={() => setViewMode('geographic')}
                >
                  Geographic
                </button>
              </div>
              <div className="zoom-controls">
                <button className="btn-icon small"><Minus size={14} /></button>
                <span>100%</span>
                <button className="btn-icon small"><Plus size={14} /></button>
              </div>
            </div>

            <div className="topology-canvas">
              <div className="topology-layers">
                <div className="layer internet-layer">
                  <div className="layer-label">Internet / Edge</div>
                  <div className="layer-nodes">
                    {filteredNodes.filter(n => ['dns', 'cdn', 'gateway'].includes(n.type) && n.region === 'global' || n.id === 'dns-1').map(node => (
                      <div 
                        key={node.id}
                        className={`topology-node ${node.type} ${node.status} ${selectedNode?.id === node.id ? 'selected' : ''}`}
                        onClick={() => setSelectedNode(node)}
                      >
                        <div className={`node-icon ${node.type}`}>
                          {getNodeIcon(node.type)}
                        </div>
                        {showLabels && (
                          <div className="node-info">
                            <span className="node-name">{node.name}</span>
                            <span className="node-type">{node.type}</span>
                          </div>
                        )}
                        <div className={`status-indicator ${node.status}`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="layer vpc-layer">
                  <div className="layer-label">VPC Layer</div>
                  <div className="layer-nodes">
                    {filteredNodes.filter(n => n.type === 'vpc' || n.type === 'firewall' || (n.type === 'gateway' && n.region !== 'global')).map(node => (
                      <div 
                        key={node.id}
                        className={`topology-node ${node.type} ${node.status} ${selectedNode?.id === node.id ? 'selected' : ''}`}
                        onClick={() => setSelectedNode(node)}
                      >
                        <div className={`node-icon ${node.type}`}>
                          {getNodeIcon(node.type)}
                        </div>
                        {showLabels && (
                          <div className="node-info">
                            <span className="node-name">{node.name}</span>
                            <span className="node-type">{node.ip || node.type}</span>
                          </div>
                        )}
                        <div className={`status-indicator ${node.status}`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="layer subnet-layer">
                  <div className="layer-label">Subnet / Load Balancer</div>
                  <div className="layer-nodes">
                    {filteredNodes.filter(n => n.type === 'subnet' || n.type === 'load-balancer').map(node => (
                      <div 
                        key={node.id}
                        className={`topology-node ${node.type} ${node.status} ${selectedNode?.id === node.id ? 'selected' : ''}`}
                        onClick={() => setSelectedNode(node)}
                      >
                        <div className={`node-icon ${node.type}`}>
                          {getNodeIcon(node.type)}
                        </div>
                        {showLabels && (
                          <div className="node-info">
                            <span className="node-name">{node.name}</span>
                            <span className="node-type">{node.ip || node.type}</span>
                          </div>
                        )}
                        <div className={`status-indicator ${node.status}`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="layer compute-layer">
                  <div className="layer-label">Compute / Application</div>
                  <div className="layer-nodes">
                    {filteredNodes.filter(n => n.type === 'instance' || n.type === 'cache').map(node => (
                      <div 
                        key={node.id}
                        className={`topology-node ${node.type} ${node.status} ${selectedNode?.id === node.id ? 'selected' : ''}`}
                        onClick={() => setSelectedNode(node)}
                      >
                        <div className={`node-icon ${node.type}`}>
                          {getNodeIcon(node.type)}
                        </div>
                        {showLabels && (
                          <div className="node-info">
                            <span className="node-name">{node.name}</span>
                            <span className="node-type">{node.ip || node.type}</span>
                          </div>
                        )}
                        <div className={`status-indicator ${node.status}`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="layer data-layer">
                  <div className="layer-label">Data / Database</div>
                  <div className="layer-nodes">
                    {filteredNodes.filter(n => n.type === 'database').map(node => (
                      <div 
                        key={node.id}
                        className={`topology-node ${node.type} ${node.status} ${selectedNode?.id === node.id ? 'selected' : ''}`}
                        onClick={() => setSelectedNode(node)}
                      >
                        <div className={`node-icon ${node.type}`}>
                          {getNodeIcon(node.type)}
                        </div>
                        {showLabels && (
                          <div className="node-info">
                            <span className="node-name">{node.name}</span>
                            <span className="node-type">{node.ip || node.type}</span>
                          </div>
                        )}
                        <div className={`status-indicator ${node.status}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {selectedNode && (
              <div className="node-detail-panel">
                <div className="panel-header">
                  <div className={`panel-icon ${selectedNode.type}`}>
                    {getNodeIcon(selectedNode.type)}
                  </div>
                  <div className="panel-title">
                    <h3>{selectedNode.name}</h3>
                    <span className="panel-type">{selectedNode.type}</span>
                  </div>
                  <button className="btn-icon" onClick={() => setSelectedNode(null)}>
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="panel-content">
                  <div className="panel-section">
                    <h4>Status</h4>
                    <div className={`status-badge ${selectedNode.status}`}>
                      {selectedNode.status === 'healthy' && <CheckCircle2 size={14} />}
                      {selectedNode.status === 'warning' && <AlertTriangle size={14} />}
                      {selectedNode.status === 'critical' && <AlertTriangle size={14} />}
                      {selectedNode.status}
                    </div>
                  </div>

                  <div className="panel-section">
                    <h4>Location</h4>
                    <div className="detail-row">
                      <span className="detail-label">Region</span>
                      <span className="detail-value">{selectedNode.region}</span>
                    </div>
                    {selectedNode.zone && (
                      <div className="detail-row">
                        <span className="detail-label">Zone</span>
                        <span className="detail-value">{selectedNode.zone}</span>
                      </div>
                    )}
                  </div>

                  <div className="panel-section">
                    <h4>Network</h4>
                    {selectedNode.ip && (
                      <div className="detail-row">
                        <span className="detail-label">Private IP</span>
                        <span className="detail-value code">{selectedNode.ip}</span>
                      </div>
                    )}
                    {selectedNode.publicIp && (
                      <div className="detail-row">
                        <span className="detail-label">Public IP</span>
                        <span className="detail-value code">{selectedNode.publicIp}</span>
                      </div>
                    )}
                  </div>

                  <div className="panel-section">
                    <h4>Metadata</h4>
                    {Object.entries(selectedNode.metadata).map(([key, value]) => (
                      <div key={key} className="detail-row">
                        <span className="detail-label">{key}</span>
                        <span className="detail-value">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="panel-section">
                    <h4>Connections ({selectedNode.connections.length})</h4>
                    <div className="connections-list">
                      {selectedNode.connections.map(connId => {
                        const connNode = nodes.find(n => n.id === connId);
                        return connNode ? (
                          <div key={connId} className="connection-item" onClick={() => setSelectedNode(connNode)}>
                            <div className={`conn-icon ${connNode.type}`}>
                              {getNodeIcon(connNode.type)}
                            </div>
                            <span>{connNode.name}</span>
                            <ChevronRight size={14} />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                <div className="panel-actions">
                  <button className="btn-outline">
                    <Settings size={14} />
                    Configure
                  </button>
                  <button className="btn-outline">
                    <FileJson size={14} />
                    View JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="connections-tab">
            <div className="connections-table">
              <div className="table-header">
                <span>Source</span>
                <span>Target</span>
                <span>Type</span>
                <span>Status</span>
                <span>Bandwidth</span>
                <span>Latency</span>
                <span>Encrypted</span>
                <span>Actions</span>
              </div>
              {connections.map(conn => {
                const sourceNode = nodes.find(n => n.id === conn.source);
                const targetNode = nodes.find(n => n.id === conn.target);
                return (
                  <div key={conn.id} className="table-row">
                    <span className="source-cell">
                      <div className={`conn-node-icon ${sourceNode?.type}`}>
                        {sourceNode && getNodeIcon(sourceNode.type)}
                      </div>
                      {sourceNode?.name || conn.source}
                    </span>
                    <span className="target-cell">
                      <ArrowRight size={14} className="arrow-icon" />
                      <div className={`conn-node-icon ${targetNode?.type}`}>
                        {targetNode && getNodeIcon(targetNode.type)}
                      </div>
                      {targetNode?.name || conn.target}
                    </span>
                    <span className="type-cell">
                      <span className={`type-badge ${conn.type}`}>{conn.type}</span>
                    </span>
                    <span className={`status-cell ${conn.status}`}>
                      {conn.status === 'active' && <Wifi size={14} />}
                      {conn.status === 'degraded' && <Activity size={14} />}
                      {conn.status === 'down' && <WifiOff size={14} />}
                      {conn.status}
                    </span>
                    <span className="bandwidth-cell">{conn.bandwidth}</span>
                    <span className="latency-cell">{conn.latency}</span>
                    <span className="encrypted-cell">
                      {conn.encrypted ? (
                        <Shield size={14} className="encrypted" />
                      ) : (
                        <Unlink size={14} className="not-encrypted" />
                      )}
                    </span>
                    <span className="actions-cell">
                      <button className="btn-icon small" title="View details">
                        <Eye size={14} />
                      </button>
                      <button className="btn-icon small" title="More options">
                        <MoreVertical size={14} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'traffic' && (
          <div className="traffic-tab">
            <div className="traffic-overview">
              <div className="traffic-stat">
                <Zap size={20} />
                <div className="stat-info">
                  <span className="stat-value">{formatBytes(trafficFlows.reduce((sum, f) => sum + f.bytesIn + f.bytesOut, 0))}</span>
                  <span className="stat-label">Total Traffic</span>
                </div>
              </div>
              <div className="traffic-stat">
                <ArrowRight size={20} />
                <div className="stat-info">
                  <span className="stat-value">{formatBytes(trafficFlows.reduce((sum, f) => sum + f.bytesIn, 0))}</span>
                  <span className="stat-label">Inbound</span>
                </div>
              </div>
              <div className="traffic-stat">
                <ArrowLeftRight size={20} />
                <div className="stat-info">
                  <span className="stat-value">{formatBytes(trafficFlows.reduce((sum, f) => sum + f.bytesOut, 0))}</span>
                  <span className="stat-label">Outbound</span>
                </div>
              </div>
              <div className="traffic-stat">
                <Activity size={20} />
                <div className="stat-info">
                  <span className="stat-value">{trafficFlows.length}</span>
                  <span className="stat-label">Active Flows</span>
                </div>
              </div>
            </div>

            <div className="traffic-table">
              <div className="table-header">
                <span>Source → Target</span>
                <span>Protocol</span>
                <span>Port</span>
                <span>Inbound</span>
                <span>Outbound</span>
                <span>Packets</span>
                <span>Status</span>
              </div>
              {trafficFlows.map(flow => {
                const sourceNode = nodes.find(n => n.id === flow.source);
                const targetNode = nodes.find(n => n.id === flow.target);
                return (
                  <div key={flow.id} className={`table-row ${flow.status}`}>
                    <span className="flow-cell">
                      <span className="flow-source">{sourceNode?.name}</span>
                      <ArrowRight size={14} />
                      <span className="flow-target">{targetNode?.name}</span>
                    </span>
                    <span className="protocol-cell">{flow.protocol}</span>
                    <span className="port-cell">{flow.port}</span>
                    <span className="bytes-cell">{formatBytes(flow.bytesIn)}</span>
                    <span className="bytes-cell">{formatBytes(flow.bytesOut)}</span>
                    <span className="packets-cell">
                      {(flow.packetsIn + flow.packetsOut).toLocaleString()}
                    </span>
                    <span className={`status-cell ${flow.status}`}>
                      <span className="status-dot" />
                      {flow.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="security-tab">
            <div className="security-header">
              <h3>Security Groups</h3>
              <button className="btn-primary">
                <Plus size={16} />
                Create Security Group
              </button>
            </div>

            <div className="security-groups-grid">
              {securityGroups.map(sg => (
                <div key={sg.id} className="security-group-card">
                  <div className="sg-header">
                    <div className="sg-icon">
                      <Shield size={20} />
                    </div>
                    <div className="sg-title">
                      <h4>{sg.name}</h4>
                      <span className="sg-id">{sg.id}</span>
                    </div>
                    <button className="btn-icon small">
                      <MoreVertical size={14} />
                    </button>
                  </div>

                  <p className="sg-description">{sg.description}</p>

                  <div className="sg-stats">
                    <div className="sg-stat">
                      <ArrowRight size={14} />
                      <span>{sg.inboundRules} Inbound</span>
                    </div>
                    <div className="sg-stat">
                      <ArrowLeftRight size={14} />
                      <span>{sg.outboundRules} Outbound</span>
                    </div>
                    <div className="sg-stat">
                      <Server size={14} />
                      <span>{sg.attachedResources} Resources</span>
                    </div>
                  </div>

                  <div className="sg-actions">
                    <button className="btn-outline small">
                      <Eye size={14} />
                      View Rules
                    </button>
                    <button className="btn-outline small">
                      <Edit3 size={14} />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NetworkTopologyViewer;
