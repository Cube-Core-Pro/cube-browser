'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  QrCode,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Wrench,
  History,
  FileText,
  BarChart3,
  Grid3X3,
  List,
  Tag,
  Building2,
  User,
  Cpu,
  HardDrive,
  Monitor,
  Printer,
  Car,
  Zap,
  Thermometer,
  Shield,
  RefreshCw,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import './assets.css';

interface Asset {
  id: string;
  name: string;
  assetTag: string;
  category: string;
  subcategory: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired' | 'disposed';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  location: string;
  department: string;
  assignedTo: string | null;
  assignedToAvatar: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  warrantyExpiry: string;
  nextMaintenance: string;
  lastMaintenance: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  specifications: Record<string, string>;
  documents: number;
  maintenanceHistory: number;
  image: string;
}

interface AssetStats {
  totalAssets: number;
  totalValue: number;
  activeAssets: number;
  maintenanceScheduled: number;
  warrantyExpiring: number;
  depreciationRate: number;
}

interface Category {
  name: string;
  icon: string;
  count: number;
  value: number;
}

interface MaintenanceItem {
  id: string;
  assetName: string;
  assetTag: string;
  type: string;
  scheduledDate: string;
  priority: 'high' | 'medium' | 'low';
  technician: string;
}

export default function AssetManagementPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  const stats: AssetStats = {
    totalAssets: 2847,
    totalValue: 4582340,
    activeAssets: 2456,
    maintenanceScheduled: 45,
    warrantyExpiring: 23,
    depreciationRate: 12.5
  };

  const categories: Category[] = [
    { name: 'IT Equipment', icon: 'cpu', count: 1245, value: 2345000 },
    { name: 'Vehicles', icon: 'car', count: 89, value: 892000 },
    { name: 'Machinery', icon: 'wrench', count: 234, value: 567000 },
    { name: 'Furniture', icon: 'building', count: 567, value: 234000 },
    { name: 'Electronics', icon: 'monitor', count: 456, value: 345000 },
    { name: 'Office Equipment', icon: 'printer', count: 256, value: 199340 }
  ];

  const assets: Asset[] = [
    {
      id: '1',
      name: 'Dell OptiPlex 7090',
      assetTag: 'IT-2024-001',
      category: 'IT Equipment',
      subcategory: 'Desktop Computer',
      status: 'active',
      condition: 'excellent',
      location: 'Building A, Floor 3',
      department: 'Engineering',
      assignedTo: 'John Smith',
      assignedToAvatar: 'JS',
      purchaseDate: '2024-01-15',
      purchasePrice: 1299,
      currentValue: 1169,
      warrantyExpiry: '2027-01-15',
      nextMaintenance: '2024-07-15',
      lastMaintenance: '2024-01-15',
      manufacturer: 'Dell',
      model: 'OptiPlex 7090',
      serialNumber: 'DELL7090X12345',
      specifications: { CPU: 'Intel i7-11700', RAM: '32GB', Storage: '512GB NVMe' },
      documents: 3,
      maintenanceHistory: 2,
      image: '/assets/computer.png'
    },
    {
      id: '2',
      name: 'MacBook Pro 16"',
      assetTag: 'IT-2024-002',
      category: 'IT Equipment',
      subcategory: 'Laptop',
      status: 'active',
      condition: 'excellent',
      location: 'Building B, Floor 2',
      department: 'Design',
      assignedTo: 'Sarah Chen',
      assignedToAvatar: 'SC',
      purchaseDate: '2024-02-20',
      purchasePrice: 3499,
      currentValue: 3149,
      warrantyExpiry: '2027-02-20',
      nextMaintenance: '2024-08-20',
      lastMaintenance: '2024-02-20',
      manufacturer: 'Apple',
      model: 'MacBook Pro 16" M3 Max',
      serialNumber: 'C02X12345ABC',
      specifications: { Chip: 'M3 Max', RAM: '64GB', Storage: '1TB SSD' },
      documents: 4,
      maintenanceHistory: 1,
      image: '/assets/laptop.png'
    },
    {
      id: '3',
      name: 'Toyota Camry 2023',
      assetTag: 'VH-2023-015',
      category: 'Vehicles',
      subcategory: 'Sedan',
      status: 'active',
      condition: 'good',
      location: 'Parking Lot A',
      department: 'Sales',
      assignedTo: 'Mike Wilson',
      assignedToAvatar: 'MW',
      purchaseDate: '2023-06-10',
      purchasePrice: 35000,
      currentValue: 29750,
      warrantyExpiry: '2026-06-10',
      nextMaintenance: '2024-03-10',
      lastMaintenance: '2023-12-10',
      manufacturer: 'Toyota',
      model: 'Camry XLE',
      serialNumber: '4T1BF1FK5NU123456',
      specifications: { Engine: '2.5L 4-Cylinder', Mileage: '15,234 mi', Color: 'Silver' },
      documents: 6,
      maintenanceHistory: 4,
      image: '/assets/car.png'
    },
    {
      id: '4',
      name: 'CNC Milling Machine',
      assetTag: 'MC-2022-008',
      category: 'Machinery',
      subcategory: 'Manufacturing',
      status: 'maintenance',
      condition: 'fair',
      location: 'Factory Floor B',
      department: 'Manufacturing',
      assignedTo: null,
      assignedToAvatar: '',
      purchaseDate: '2022-03-15',
      purchasePrice: 125000,
      currentValue: 87500,
      warrantyExpiry: '2024-03-15',
      nextMaintenance: '2024-02-28',
      lastMaintenance: '2024-02-01',
      manufacturer: 'Haas',
      model: 'VF-2SS',
      serialNumber: 'HAAS2022VF2SS',
      specifications: { Spindle: '12,000 RPM', Travel: '30x16x20 in', Power: '30 HP' },
      documents: 12,
      maintenanceHistory: 18,
      image: '/assets/machine.png'
    },
    {
      id: '5',
      name: 'HP LaserJet Pro',
      assetTag: 'OF-2023-042',
      category: 'Office Equipment',
      subcategory: 'Printer',
      status: 'active',
      condition: 'good',
      location: 'Building A, Floor 1',
      department: 'Administration',
      assignedTo: null,
      assignedToAvatar: '',
      purchaseDate: '2023-08-22',
      purchasePrice: 599,
      currentValue: 479,
      warrantyExpiry: '2025-08-22',
      nextMaintenance: '2024-08-22',
      lastMaintenance: '2023-08-22',
      manufacturer: 'HP',
      model: 'LaserJet Pro MFP M428fdw',
      serialNumber: 'HPLJ428FDW123',
      specifications: { Type: 'Laser', Speed: '40 ppm', Duplex: 'Yes' },
      documents: 2,
      maintenanceHistory: 3,
      image: '/assets/printer.png'
    },
    {
      id: '6',
      name: 'Server Rack R750',
      assetTag: 'IT-2023-089',
      category: 'IT Equipment',
      subcategory: 'Server',
      status: 'active',
      condition: 'excellent',
      location: 'Data Center',
      department: 'IT Infrastructure',
      assignedTo: null,
      assignedToAvatar: '',
      purchaseDate: '2023-11-05',
      purchasePrice: 18500,
      currentValue: 16650,
      warrantyExpiry: '2028-11-05',
      nextMaintenance: '2024-05-05',
      lastMaintenance: '2023-11-05',
      manufacturer: 'Dell',
      model: 'PowerEdge R750',
      serialNumber: 'DELLR750SRV789',
      specifications: { CPU: '2x Xeon Gold 6348', RAM: '512GB', Storage: '24TB NVMe' },
      documents: 8,
      maintenanceHistory: 2,
      image: '/assets/server.png'
    }
  ];

  const upcomingMaintenance: MaintenanceItem[] = [
    { id: '1', assetName: 'CNC Milling Machine', assetTag: 'MC-2022-008', type: 'Preventive', scheduledDate: '2024-02-28', priority: 'high', technician: 'Robert Davis' },
    { id: '2', assetName: 'Toyota Camry 2023', assetTag: 'VH-2023-015', type: 'Service', scheduledDate: '2024-03-10', priority: 'medium', technician: 'Auto Shop' },
    { id: '3', assetName: 'Server Rack R750', assetTag: 'IT-2023-089', type: 'Inspection', scheduledDate: '2024-05-05', priority: 'low', technician: 'IT Team' }
  ];

  const getCategoryIcon = (iconName: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      cpu: <Cpu size={20} />,
      car: <Car size={20} />,
      wrench: <Wrench size={20} />,
      building: <Building2 size={20} />,
      monitor: <Monitor size={20} />,
      printer: <Printer size={20} />
    };
    return iconMap[iconName] || <Package size={20} />;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: 'status-active',
      inactive: 'status-inactive',
      maintenance: 'status-maintenance',
      retired: 'status-retired',
      disposed: 'status-disposed'
    };
    return colors[status] || '';
  };

  const getConditionColor = (condition: string): string => {
    const colors: Record<string, string> = {
      excellent: 'condition-excellent',
      good: 'condition-good',
      fair: 'condition-fair',
      poor: 'condition-poor'
    };
    return colors[condition] || '';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.assetTag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="assets-container">
      <div className="assets-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <Package size={28} />
            </div>
            <div>
              <h1>Asset Management</h1>
              <p>Track, manage and maintain all organizational assets</p>
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
            <button className="btn-secondary">
              <QrCode size={18} />
              Scan
            </button>
            <button className="btn-primary">
              <Plus size={18} />
              Add Asset
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-label">Total Assets</span>
              <div className="stat-row">
                <span className="stat-value">{stats.totalAssets.toLocaleString()}</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  8.2%
                </span>
              </div>
            </div>
            <div className="stat-icon">
              <Package size={24} />
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-label">Total Value</span>
              <div className="stat-row">
                <span className="stat-value">{formatCurrency(stats.totalValue)}</span>
              </div>
            </div>
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-label">Active Assets</span>
              <div className="stat-row">
                <span className="stat-value">{stats.activeAssets.toLocaleString()}</span>
                <span className="stat-badge active">{Math.round((stats.activeAssets / stats.totalAssets) * 100)}%</span>
              </div>
            </div>
            <div className="stat-icon active">
              <CheckCircle size={24} />
            </div>
          </div>
          
          <div className="stat-card alert">
            <div className="stat-content">
              <span className="stat-label">Maintenance Due</span>
              <div className="stat-row">
                <span className="stat-value">{stats.maintenanceScheduled}</span>
              </div>
            </div>
            <div className="stat-icon warning">
              <Wrench size={24} />
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-content">
              <span className="stat-label">Warranty Expiring</span>
              <div className="stat-row">
                <span className="stat-value">{stats.warrantyExpiring}</span>
              </div>
            </div>
            <div className="stat-icon danger">
              <AlertTriangle size={24} />
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-label">Depreciation Rate</span>
              <div className="stat-row">
                <span className="stat-value">{stats.depreciationRate}%</span>
                <span className="stat-change down">
                  <TrendingDown size={14} />
                  2.1%
                </span>
              </div>
            </div>
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="categories-header">
          <h2>Asset Categories</h2>
          <button className="view-all-btn">View All</button>
        </div>
        <div className="categories-grid">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className={`category-card ${selectedCategory === category.name ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === category.name ? 'all' : category.name)}
            >
              <div className="category-icon">
                {getCategoryIcon(category.icon)}
              </div>
              <div className="category-info">
                <h3>{category.name}</h3>
                <div className="category-stats">
                  <span>{category.count} assets</span>
                  <span>{formatCurrency(category.value)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-left">
          {/* Filters */}
          <div className="filters-bar">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search assets by name, tag, or serial..."
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
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            
            <div className="filter-group">
              <select>
                <option value="all">All Locations</option>
                <option value="building-a">Building A</option>
                <option value="building-b">Building B</option>
                <option value="data-center">Data Center</option>
                <option value="factory">Factory</option>
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

          {/* Assets List */}
          {viewMode === 'list' ? (
            <div className="assets-list">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="asset-item">
                  <div 
                    className="asset-main"
                    onClick={() => setExpandedAsset(expandedAsset === asset.id ? null : asset.id)}
                  >
                    <div className="asset-checkbox">
                      <input type="checkbox" />
                    </div>
                    
                    <div className="asset-icon-container">
                      {getCategoryIcon(
                        asset.category === 'IT Equipment' ? 'cpu' :
                        asset.category === 'Vehicles' ? 'car' :
                        asset.category === 'Machinery' ? 'wrench' :
                        asset.category === 'Office Equipment' ? 'printer' : 'building'
                      )}
                    </div>
                    
                    <div className="asset-info">
                      <div className="asset-header">
                        <h3>{asset.name}</h3>
                        <span className={`status-badge ${getStatusColor(asset.status)}`}>
                          {asset.status}
                        </span>
                        <span className={`condition-badge ${getConditionColor(asset.condition)}`}>
                          {asset.condition}
                        </span>
                      </div>
                      <div className="asset-meta">
                        <span className="asset-tag">
                          <Tag size={14} />
                          {asset.assetTag}
                        </span>
                        <span className="asset-location">
                          <MapPin size={14} />
                          {asset.location}
                        </span>
                        <span className="asset-department">
                          <Building2 size={14} />
                          {asset.department}
                        </span>
                        {asset.assignedTo && (
                          <span className="asset-assignee">
                            <User size={14} />
                            {asset.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="asset-value">
                      <span className="value-label">Current Value</span>
                      <span className="value-amount">{formatCurrency(asset.currentValue)}</span>
                      <span className="value-purchase">
                        Purchase: {formatCurrency(asset.purchasePrice)}
                      </span>
                    </div>
                    
                    <div className="asset-actions">
                      <button className="action-btn" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn" title="QR Code">
                        <QrCode size={16} />
                      </button>
                      <button className="action-btn expand-btn">
                        {expandedAsset === asset.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  {expandedAsset === asset.id && (
                    <div className="asset-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h4>Specifications</h4>
                          <div className="specs-list">
                            {Object.entries(asset.specifications).map(([key, value]) => (
                              <div key={key} className="spec-item">
                                <span className="spec-key">{key}</span>
                                <span className="spec-value">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>Details</h4>
                          <div className="details-list">
                            <div className="detail-item">
                              <span>Manufacturer</span>
                              <span>{asset.manufacturer}</span>
                            </div>
                            <div className="detail-item">
                              <span>Model</span>
                              <span>{asset.model}</span>
                            </div>
                            <div className="detail-item">
                              <span>Serial Number</span>
                              <span>{asset.serialNumber}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>Dates</h4>
                          <div className="dates-list">
                            <div className="date-item">
                              <Calendar size={14} />
                              <span>Purchased: {asset.purchaseDate}</span>
                            </div>
                            <div className="date-item">
                              <Shield size={14} />
                              <span>Warranty: {asset.warrantyExpiry}</span>
                            </div>
                            <div className="date-item">
                              <Wrench size={14} />
                              <span>Next Maintenance: {asset.nextMaintenance}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>Records</h4>
                          <div className="records-list">
                            <button className="record-btn">
                              <FileText size={14} />
                              {asset.documents} Documents
                            </button>
                            <button className="record-btn">
                              <History size={14} />
                              {asset.maintenanceHistory} Maintenance Records
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="assets-grid">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="asset-card">
                  <div className="card-header">
                    <div className="card-icon">
                      {getCategoryIcon(
                        asset.category === 'IT Equipment' ? 'cpu' :
                        asset.category === 'Vehicles' ? 'car' :
                        asset.category === 'Machinery' ? 'wrench' :
                        asset.category === 'Office Equipment' ? 'printer' : 'building'
                      )}
                    </div>
                    <span className={`status-badge ${getStatusColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </div>
                  
                  <h3>{asset.name}</h3>
                  <span className="card-tag">{asset.assetTag}</span>
                  
                  <div className="card-meta">
                    <span>
                      <MapPin size={12} />
                      {asset.location}
                    </span>
                    <span>
                      <Building2 size={12} />
                      {asset.department}
                    </span>
                  </div>
                  
                  <div className="card-value">
                    <span className="label">Value</span>
                    <span className="amount">{formatCurrency(asset.currentValue)}</span>
                  </div>
                  
                  {asset.assignedTo && (
                    <div className="card-assignee">
                      <div className="assignee-avatar">{asset.assignedToAvatar}</div>
                      <span>{asset.assignedTo}</span>
                    </div>
                  )}
                  
                  <div className="card-actions">
                    <button className="action-btn"><Eye size={14} /></button>
                    <button className="action-btn"><Edit size={14} /></button>
                    <button className="action-btn"><QrCode size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="content-sidebar">
          <div className="sidebar-section">
            <h3>Upcoming Maintenance</h3>
            <div className="maintenance-list">
              {upcomingMaintenance.map((item) => (
                <div key={item.id} className={`maintenance-item priority-${item.priority}`}>
                  <div className="maintenance-info">
                    <h4>{item.assetName}</h4>
                    <span className="maintenance-tag">{item.assetTag}</span>
                    <div className="maintenance-meta">
                      <span className="maintenance-type">{item.type}</span>
                      <span className="maintenance-date">
                        <Calendar size={12} />
                        {item.scheduledDate}
                      </span>
                    </div>
                  </div>
                  <span className={`priority-badge priority-${item.priority}`}>
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
            <button className="view-all-maintenance">
              View All Maintenance
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon created">
                  <Plus size={14} />
                </div>
                <div className="activity-info">
                  <span>New asset added</span>
                  <span className="activity-asset">MacBook Pro 16"</span>
                  <span className="activity-time">2 hours ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon updated">
                  <RefreshCw size={14} />
                </div>
                <div className="activity-info">
                  <span>Maintenance completed</span>
                  <span className="activity-asset">CNC Milling Machine</span>
                  <span className="activity-time">5 hours ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon assigned">
                  <User size={14} />
                </div>
                <div className="activity-info">
                  <span>Asset reassigned</span>
                  <span className="activity-asset">Dell OptiPlex 7090</span>
                  <span className="activity-time">1 day ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon alert">
                  <AlertTriangle size={14} />
                </div>
                <div className="activity-info">
                  <span>Warranty expiring soon</span>
                  <span className="activity-asset">HP LaserJet Pro</span>
                  <span className="activity-time">2 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
