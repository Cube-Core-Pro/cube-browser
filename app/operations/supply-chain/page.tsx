'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Grid3X3,
  List,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Package,
  FileText,
  AlertCircle,
  Target,
  Globe,
  Zap,
  Activity,
  Users,
  Settings,
  ChevronRight,
  ChevronDown,
  MapPin,
  Navigation,
  Ship,
  Plane,
  Building2,
  Warehouse,
  Route,
  Timer,
  DollarSign,
  Layers,
  Link2,
  ArrowRightLeft,
  Box,
  Boxes,
  Tag,
  RefreshCw,
  Send,
  Anchor,
  CircleDot
} from 'lucide-react';
import './supply-chain.css';

interface Supplier {
  id: string;
  name: string;
  code: string;
  category: string;
  location: string;
  country: string;
  status: 'active' | 'inactive' | 'on-hold' | 'pending';
  rating: number;
  onTimeDelivery: number;
  qualityScore: number;
  contactPerson: string;
  email: string;
  totalOrders: number;
  openOrders: number;
  lastOrderDate: string;
  leadTime: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status: 'draft' | 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  items: number;
  totalAmount: number;
  orderDate: string;
  expectedDate: string;
  deliveredDate: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  carrier: string;
  mode: 'sea' | 'air' | 'road' | 'rail';
  status: 'in-transit' | 'customs' | 'delivered' | 'delayed' | 'pending';
  eta: string;
  items: number;
  weight: string;
  value: number;
  progress: number;
}

interface SupplyChainMetrics {
  totalSuppliers: number;
  activeOrders: number;
  shipmentsInTransit: number;
  avgLeadTime: number;
  onTimeDelivery: number;
  supplierScore: number;
}

interface InventoryAlert {
  id: string;
  item: string;
  type: 'low-stock' | 'overstock' | 'expiring' | 'reorder';
  severity: 'critical' | 'warning' | 'info';
  quantity: number;
  threshold: number;
  action: string;
}

export default function SupplyChainPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('suppliers');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);

  const metrics: SupplyChainMetrics = {
    totalSuppliers: 156,
    activeOrders: 47,
    shipmentsInTransit: 23,
    avgLeadTime: 8.5,
    onTimeDelivery: 94.2,
    supplierScore: 4.3
  };

  const suppliers: Supplier[] = [
    {
      id: '1',
      name: 'Global Materials Inc.',
      code: 'SUP-001',
      category: 'Raw Materials',
      location: 'Shanghai, China',
      country: 'CN',
      status: 'active',
      rating: 4.8,
      onTimeDelivery: 96.5,
      qualityScore: 98.2,
      contactPerson: 'Li Wei',
      email: 'li.wei@globalmaterials.cn',
      totalOrders: 234,
      openOrders: 5,
      lastOrderDate: '2024-02-18',
      leadTime: 12
    },
    {
      id: '2',
      name: 'TechParts Solutions',
      code: 'SUP-002',
      category: 'Electronics',
      location: 'Seoul, South Korea',
      country: 'KR',
      status: 'active',
      rating: 4.6,
      onTimeDelivery: 94.2,
      qualityScore: 96.8,
      contactPerson: 'Park Min-jun',
      email: 'minjun@techparts.kr',
      totalOrders: 189,
      openOrders: 3,
      lastOrderDate: '2024-02-15',
      leadTime: 7
    },
    {
      id: '3',
      name: 'EuroComponents GmbH',
      code: 'SUP-003',
      category: 'Components',
      location: 'Munich, Germany',
      country: 'DE',
      status: 'active',
      rating: 4.9,
      onTimeDelivery: 98.1,
      qualityScore: 99.1,
      contactPerson: 'Hans Mueller',
      email: 'h.mueller@eurocomponents.de',
      totalOrders: 156,
      openOrders: 2,
      lastOrderDate: '2024-02-20',
      leadTime: 5
    },
    {
      id: '4',
      name: 'American Steel Works',
      code: 'SUP-004',
      category: 'Metals',
      location: 'Pittsburgh, USA',
      country: 'US',
      status: 'on-hold',
      rating: 4.2,
      onTimeDelivery: 88.5,
      qualityScore: 94.5,
      contactPerson: 'John Davis',
      email: 'jdavis@americansteel.com',
      totalOrders: 98,
      openOrders: 0,
      lastOrderDate: '2024-01-28',
      leadTime: 10
    },
    {
      id: '5',
      name: 'Pacific Logistics Co.',
      code: 'SUP-005',
      category: 'Packaging',
      location: 'Tokyo, Japan',
      country: 'JP',
      status: 'active',
      rating: 4.7,
      onTimeDelivery: 95.8,
      qualityScore: 97.3,
      contactPerson: 'Tanaka Yuki',
      email: 'yuki@pacificlogistics.jp',
      totalOrders: 145,
      openOrders: 4,
      lastOrderDate: '2024-02-19',
      leadTime: 6
    }
  ];

  const purchaseOrders: PurchaseOrder[] = [
    { id: '1', poNumber: 'PO-2024-0456', supplier: 'Global Materials Inc.', status: 'shipped', items: 12, totalAmount: 45680, orderDate: '2024-02-10', expectedDate: '2024-02-25', deliveredDate: null, priority: 'high' },
    { id: '2', poNumber: 'PO-2024-0457', supplier: 'TechParts Solutions', status: 'approved', items: 8, totalAmount: 23450, orderDate: '2024-02-15', expectedDate: '2024-02-28', deliveredDate: null, priority: 'medium' },
    { id: '3', poNumber: 'PO-2024-0458', supplier: 'EuroComponents GmbH', status: 'delivered', items: 15, totalAmount: 67890, orderDate: '2024-02-05', expectedDate: '2024-02-18', deliveredDate: '2024-02-17', priority: 'medium' },
    { id: '4', poNumber: 'PO-2024-0459', supplier: 'Pacific Logistics Co.', status: 'pending', items: 6, totalAmount: 12340, orderDate: '2024-02-20', expectedDate: '2024-03-05', deliveredDate: null, priority: 'low' },
    { id: '5', poNumber: 'PO-2024-0460', supplier: 'Global Materials Inc.', status: 'shipped', items: 20, totalAmount: 89250, orderDate: '2024-02-12', expectedDate: '2024-02-28', deliveredDate: null, priority: 'urgent' }
  ];

  const shipments: Shipment[] = [
    { id: '1', trackingNumber: 'SHP-2024-8901', origin: 'Shanghai, CN', destination: 'Los Angeles, US', carrier: 'Maersk Line', mode: 'sea', status: 'in-transit', eta: '2024-03-05', items: 45, weight: '2,450 kg', value: 125000, progress: 65 },
    { id: '2', trackingNumber: 'SHP-2024-8902', origin: 'Seoul, KR', destination: 'Chicago, US', carrier: 'DHL Express', mode: 'air', status: 'customs', eta: '2024-02-24', items: 12, weight: '180 kg', value: 45000, progress: 85 },
    { id: '3', trackingNumber: 'SHP-2024-8903', origin: 'Munich, DE', destination: 'New York, US', carrier: 'FedEx', mode: 'air', status: 'in-transit', eta: '2024-02-26', items: 8, weight: '95 kg', value: 32000, progress: 45 },
    { id: '4', trackingNumber: 'SHP-2024-8904', origin: 'Tokyo, JP', destination: 'Seattle, US', carrier: 'NYK Line', mode: 'sea', status: 'delayed', eta: '2024-03-12', items: 30, weight: '1,850 kg', value: 78000, progress: 30 },
    { id: '5', trackingNumber: 'SHP-2024-8905', origin: 'Local Warehouse', destination: 'Distribution Center', carrier: 'Internal Logistics', mode: 'road', status: 'delivered', eta: '2024-02-21', items: 120, weight: '3,200 kg', value: 156000, progress: 100 }
  ];

  const alerts: InventoryAlert[] = [
    { id: '1', item: 'Aluminum Sheets 6061-T6', type: 'low-stock', severity: 'critical', quantity: 45, threshold: 100, action: 'Reorder immediately' },
    { id: '2', item: 'Electronic Capacitors C12', type: 'reorder', severity: 'warning', quantity: 250, threshold: 300, action: 'Create purchase order' },
    { id: '3', item: 'Rubber Gaskets Type-A', type: 'expiring', severity: 'info', quantity: 500, threshold: 0, action: 'Use within 30 days' }
  ];

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'active': 'status-active',
      'inactive': 'status-inactive',
      'on-hold': 'status-hold',
      'pending': 'status-pending',
      'draft': 'status-draft',
      'approved': 'status-approved',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled',
      'in-transit': 'status-transit',
      'customs': 'status-customs',
      'delayed': 'status-delayed'
    };
    return colors[status] || '';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      'low': 'priority-low',
      'medium': 'priority-medium',
      'high': 'priority-high',
      'urgent': 'priority-urgent'
    };
    return colors[priority] || '';
  };

  const getModeIcon = (mode: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'sea': <Ship size={16} />,
      'air': <Plane size={16} />,
      'road': <Truck size={16} />,
      'rail': <TrainIcon size={16} />
    };
    return icons[mode] || <Package size={16} />;
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || supplier.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getRatingStars = (rating: number): React.ReactNode => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= Math.floor(rating) ? 'filled' : i - 0.5 <= rating ? 'half' : ''}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="supply-chain-container">
      <div className="supply-chain-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <Link2 size={28} />
            </div>
            <div>
              <h1>Supply Chain Management</h1>
              <p>Suppliers, purchase orders and logistics tracking</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-secondary">
              <Upload size={18} />
              Import
            </button>
            <button className="btn-secondary">
              <Download size={18} />
              Export
            </button>
            <button className="btn-primary">
              <Plus size={18} />
              Add Supplier
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Building2 size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Suppliers</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.totalSuppliers}</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  8.2%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon orders">
              <FileText size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Active Orders</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.activeOrders}</span>
                <span className="stat-badge info">{metrics.activeOrders > 40 ? 'High volume' : 'Normal'}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon transit">
              <Ship size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">In Transit</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.shipmentsInTransit}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Timer size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Avg Lead Time</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.avgLeadTime} days</span>
                <span className="stat-change down-good">
                  <TrendingDown size={14} />
                  1.2d
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card highlight">
            <div className="stat-icon success">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">On-Time Delivery</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.onTimeDelivery}%</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  2.1%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon star">
              <StarIcon size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Supplier Score</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.supplierScore}/5</span>
                <div className="mini-stars">{getRatingStars(metrics.supplierScore)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <section className="alerts-section">
          <div className="alerts-header">
            <h2><AlertTriangle size={20} /> Supply Chain Alerts</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="alerts-grid">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-card ${alert.severity}`}>
                <div className="alert-icon">
                  <AlertCircle size={20} />
                </div>
                <div className="alert-content">
                  <span className="alert-type">{alert.type.replace('-', ' ')}</span>
                  <h4>{alert.item}</h4>
                  <p>{alert.action}</p>
                </div>
                <div className="alert-stats">
                  <span className="current">{alert.quantity} units</span>
                  {alert.threshold > 0 && <span className="threshold">/ {alert.threshold} min</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Tabs */}
      <div className="main-tabs">
        <button 
          className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <Building2 size={18} />
          Suppliers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <FileText size={18} />
          Purchase Orders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'shipments' ? 'active' : ''}`}
          onClick={() => setActiveTab('shipments')}
        >
          <Ship size={18} />
          Shipments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} />
          Analytics
        </button>
      </div>

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="main-content">
          <div className="content-area">
            {/* Filters */}
            <div className="filters-bar">
              <div className="search-box">
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on-hold">On Hold</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div className="filter-group">
                <select>
                  <option value="all">All Categories</option>
                  <option value="raw-materials">Raw Materials</option>
                  <option value="electronics">Electronics</option>
                  <option value="components">Components</option>
                  <option value="metals">Metals</option>
                  <option value="packaging">Packaging</option>
                </select>
              </div>
              
              <div className="view-toggle">
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 size={18} />
                </button>
              </div>
            </div>

            {/* Suppliers List */}
            <div className="suppliers-list">
              {filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className={`supplier-item ${supplier.status}`}>
                  <div 
                    className="supplier-main"
                    onClick={() => setExpandedSupplier(expandedSupplier === supplier.id ? null : supplier.id)}
                  >
                    <div className="supplier-logo">
                      <Building2 size={20} />
                    </div>
                    
                    <div className="supplier-info">
                      <div className="supplier-header">
                        <span className="supplier-code">{supplier.code}</span>
                        <span className={`status-badge ${getStatusColor(supplier.status)}`}>
                          {supplier.status}
                        </span>
                        <span className="category-badge">{supplier.category}</span>
                      </div>
                      <h3>{supplier.name}</h3>
                      <div className="supplier-meta">
                        <span className="location">
                          <MapPin size={14} />
                          {supplier.location}
                        </span>
                        <span className="country-flag">{getCountryFlag(supplier.country)}</span>
                        <span className="lead-time">
                          <Clock size={14} />
                          {supplier.leadTime} days lead
                        </span>
                      </div>
                    </div>
                    
                    <div className="supplier-scores">
                      <div className="score-item">
                        <span className="score-label">Rating</span>
                        <div className="score-value">
                          <span className="rating-num">{supplier.rating}</span>
                          <span className="rating-stars">{getRatingStars(supplier.rating)}</span>
                        </div>
                      </div>
                      <div className="score-item">
                        <span className="score-label">On-Time</span>
                        <span className={`score-value ${supplier.onTimeDelivery >= 95 ? 'excellent' : supplier.onTimeDelivery >= 90 ? 'good' : 'needs-improvement'}`}>
                          {supplier.onTimeDelivery}%
                        </span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Quality</span>
                        <span className={`score-value ${supplier.qualityScore >= 98 ? 'excellent' : supplier.qualityScore >= 95 ? 'good' : 'needs-improvement'}`}>
                          {supplier.qualityScore}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="supplier-orders">
                      <div className="orders-stat">
                        <span className="orders-value">{supplier.totalOrders}</span>
                        <span className="orders-label">Total Orders</span>
                      </div>
                      <div className="orders-stat open">
                        <span className="orders-value">{supplier.openOrders}</span>
                        <span className="orders-label">Open</span>
                      </div>
                    </div>
                    
                    <div className="supplier-actions">
                      <button className="action-btn" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn expand-btn">
                        {expandedSupplier === supplier.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  {expandedSupplier === supplier.id && (
                    <div className="supplier-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h4>Contact Information</h4>
                          <div className="contact-info">
                            <div className="contact-row">
                              <Users size={14} />
                              <span>{supplier.contactPerson}</span>
                            </div>
                            <div className="contact-row">
                              <MailIcon size={14} />
                              <span>{supplier.email}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>Performance Metrics</h4>
                          <div className="performance-bars">
                            <div className="perf-bar">
                              <span className="perf-label">On-Time Delivery</span>
                              <div className="bar-track">
                                <div className="bar-fill" style={{ width: `${supplier.onTimeDelivery}%` }}></div>
                              </div>
                              <span className="perf-value">{supplier.onTimeDelivery}%</span>
                            </div>
                            <div className="perf-bar">
                              <span className="perf-label">Quality Score</span>
                              <div className="bar-track">
                                <div className="bar-fill quality" style={{ width: `${supplier.qualityScore}%` }}></div>
                              </div>
                              <span className="perf-value">{supplier.qualityScore}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>Quick Actions</h4>
                          <div className="quick-actions">
                            <button className="quick-btn">
                              <Plus size={14} />
                              New PO
                            </button>
                            <button className="quick-btn">
                              <FileText size={14} />
                              View Orders
                            </button>
                            <button className="quick-btn">
                              <Activity size={14} />
                              Performance
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'orders' && (
        <div className="orders-content">
          <div className="orders-header">
            <h2>Purchase Orders</h2>
            <button className="btn-primary">
              <Plus size={18} />
              Create PO
            </button>
          </div>
          <div className="orders-list">
            {purchaseOrders.map((order) => (
              <div key={order.id} className={`order-item ${order.status}`}>
                <div className="order-priority">
                  <span className={`priority-indicator ${getPriorityColor(order.priority)}`}></span>
                </div>
                <div className="order-info">
                  <div className="order-header-row">
                    <span className="order-number">{order.poNumber}</span>
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`priority-badge ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </div>
                  <h3>{order.supplier}</h3>
                  <div className="order-meta">
                    <span className="order-items">
                      <Package size={14} />
                      {order.items} items
                    </span>
                    <span className="order-date">
                      <Calendar size={14} />
                      Ordered: {order.orderDate}
                    </span>
                    <span className="order-expected">
                      <Clock size={14} />
                      Expected: {order.expectedDate}
                    </span>
                  </div>
                </div>
                <div className="order-amount">
                  <span className="amount-value">${order.totalAmount.toLocaleString()}</span>
                  <span className="amount-label">Total Value</span>
                </div>
                <div className="order-actions">
                  <button className="action-btn"><Eye size={16} /></button>
                  <button className="action-btn"><Edit size={16} /></button>
                  <button className="action-btn"><Send size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipments Tab */}
      {activeTab === 'shipments' && (
        <div className="shipments-content">
          <div className="shipments-header">
            <h2>Shipment Tracking</h2>
            <div className="shipments-filters">
              <select>
                <option value="all">All Shipments</option>
                <option value="in-transit">In Transit</option>
                <option value="customs">In Customs</option>
                <option value="delivered">Delivered</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
          </div>
          <div className="shipments-list">
            {shipments.map((shipment) => (
              <div key={shipment.id} className={`shipment-item ${shipment.status}`}>
                <div className="shipment-mode">
                  <div className={`mode-icon mode-${shipment.mode}`}>
                    {getModeIcon(shipment.mode)}
                  </div>
                </div>
                <div className="shipment-info">
                  <div className="shipment-header-row">
                    <span className="tracking-number">{shipment.trackingNumber}</span>
                    <span className={`status-badge ${getStatusColor(shipment.status)}`}>
                      {shipment.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="route-info">
                    <span className="origin">{shipment.origin}</span>
                    <ArrowRightLeft size={14} className="route-arrow" />
                    <span className="destination">{shipment.destination}</span>
                  </div>
                  <div className="shipment-meta">
                    <span className="carrier">{shipment.carrier}</span>
                    <span className="items">
                      <Boxes size={14} />
                      {shipment.items} items
                    </span>
                    <span className="weight">{shipment.weight}</span>
                  </div>
                </div>
                <div className="shipment-progress">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span>{shipment.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${shipment.status === 'delayed' ? 'delayed' : ''}`}
                      style={{ width: `${shipment.progress}%` }}
                    />
                  </div>
                  <div className="eta">
                    <Clock size={12} />
                    ETA: {shipment.eta}
                  </div>
                </div>
                <div className="shipment-value">
                  <span className="value-amount">${shipment.value.toLocaleString()}</span>
                  <span className="value-label">Value</span>
                </div>
                <div className="shipment-actions">
                  <button className="action-btn"><Eye size={16} /></button>
                  <button className="action-btn"><MapPin size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-content">
          <div className="analytics-header">
            <h2>Supply Chain Analytics</h2>
            <div className="analytics-filters">
              <select>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Last 12 Months</option>
              </select>
              <button className="btn-secondary">
                <Download size={18} />
                Export
              </button>
            </div>
          </div>
          
          <div className="analytics-grid">
            <div className="analytics-card large">
              <h3>Supplier Performance Comparison</h3>
              <div className="performance-chart">
                {suppliers.slice(0, 5).map((supplier, index) => (
                  <div key={index} className="perf-row">
                    <span className="perf-name">{supplier.name}</span>
                    <div className="perf-bars-container">
                      <div className="perf-bar-item">
                        <div className="bar-track">
                          <div className="bar-fill delivery" style={{ width: `${supplier.onTimeDelivery}%` }}></div>
                        </div>
                        <span className="bar-value">{supplier.onTimeDelivery}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot delivery"></span>On-Time Delivery</span>
              </div>
            </div>
            
            <div className="analytics-card">
              <h3>Order Status Distribution</h3>
              <div className="status-distribution">
                <div className="dist-item">
                  <span className="dist-color pending"></span>
                  <span className="dist-label">Pending</span>
                  <span className="dist-value">12</span>
                </div>
                <div className="dist-item">
                  <span className="dist-color approved"></span>
                  <span className="dist-label">Approved</span>
                  <span className="dist-value">8</span>
                </div>
                <div className="dist-item">
                  <span className="dist-color shipped"></span>
                  <span className="dist-label">Shipped</span>
                  <span className="dist-value">15</span>
                </div>
                <div className="dist-item">
                  <span className="dist-color delivered"></span>
                  <span className="dist-label">Delivered</span>
                  <span className="dist-value">12</span>
                </div>
              </div>
            </div>
            
            <div className="analytics-card">
              <h3>Shipment by Mode</h3>
              <div className="mode-distribution">
                <div className="mode-item">
                  <div className="mode-icon-lg sea">
                    <Ship size={20} />
                  </div>
                  <span className="mode-label">Sea Freight</span>
                  <span className="mode-value">45%</span>
                </div>
                <div className="mode-item">
                  <div className="mode-icon-lg air">
                    <Plane size={20} />
                  </div>
                  <span className="mode-label">Air Freight</span>
                  <span className="mode-value">30%</span>
                </div>
                <div className="mode-item">
                  <div className="mode-icon-lg road">
                    <Truck size={20} />
                  </div>
                  <span className="mode-label">Road</span>
                  <span className="mode-value">25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StarIcon(props: { size: number }): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function TrainIcon(props: { size: number }): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="16" x="4" y="3" rx="2"/>
      <path d="M4 11h16"/>
      <path d="M12 3v8"/>
      <path d="m8 19-2 3"/>
      <path d="m18 22-2-3"/>
      <path d="M8 15h0"/>
      <path d="M16 15h0"/>
    </svg>
  );
}

function MailIcon(props: { size: number }): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    'CN': '🇨🇳',
    'KR': '🇰🇷',
    'DE': '🇩🇪',
    'US': '🇺🇸',
    'JP': '🇯🇵'
  };
  return flags[code] || '🌍';
}
