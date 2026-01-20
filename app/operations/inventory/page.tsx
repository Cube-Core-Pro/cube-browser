'use client';

import React, { useState, useEffect } from 'react';
import { 
  Boxes,
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
  Package,
  Warehouse,
  Truck,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Tag,
  MapPin,
  Calendar,
  History,
  Scan,
  QrCode,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  ShoppingCart,
  AlertCircle,
  Layers,
  Target,
  Percent,
  Settings
} from 'lucide-react';
import './inventory.css';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  unitPrice: number;
  totalValue: number;
  location: string;
  warehouse: string;
  supplier: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstock' | 'discontinued';
  lastRestocked: string;
  lastSold: string;
  turnoverRate: number;
  image: string;
}

interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  turnoverRate: number;
  ordersPending: number;
}

interface Category {
  name: string;
  items: number;
  value: number;
  trend: number;
}

interface Movement {
  id: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  itemName: string;
  sku: string;
  quantity: number;
  date: string;
  reference: string;
  user: string;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  used: number;
  items: number;
}

export default function InventoryControlPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const stats: InventoryStats = {
    totalItems: 15847,
    totalValue: 2458920,
    lowStockItems: 234,
    outOfStockItems: 45,
    turnoverRate: 4.2,
    ordersPending: 89
  };

  const categories: Category[] = [
    { name: 'Electronics', items: 3245, value: 892000, trend: 12.5 },
    { name: 'Hardware', items: 4567, value: 567000, trend: 8.3 },
    { name: 'Software', items: 1234, value: 234000, trend: -3.2 },
    { name: 'Office Supplies', items: 2890, value: 145000, trend: 5.7 },
    { name: 'Raw Materials', items: 2345, value: 456000, trend: 15.8 },
    { name: 'Finished Goods', items: 1566, value: 164920, trend: 2.1 }
  ];

  const items: InventoryItem[] = [
    {
      id: '1',
      sku: 'ELEC-001',
      name: 'Wireless Bluetooth Headphones',
      category: 'Electronics',
      subcategory: 'Audio',
      description: 'High-quality wireless headphones with noise cancellation',
      quantity: 450,
      minStock: 100,
      maxStock: 600,
      reorderPoint: 150,
      unitPrice: 79.99,
      totalValue: 35995.50,
      location: 'A-12-3',
      warehouse: 'Main Warehouse',
      supplier: 'TechSupply Co.',
      status: 'in-stock',
      lastRestocked: '2024-02-15',
      lastSold: '2024-02-20',
      turnoverRate: 5.2,
      image: '/products/headphones.png'
    },
    {
      id: '2',
      sku: 'HW-045',
      name: 'Industrial Power Drill',
      category: 'Hardware',
      subcategory: 'Power Tools',
      description: 'Heavy-duty cordless power drill with multiple attachments',
      quantity: 85,
      minStock: 50,
      maxStock: 200,
      reorderPoint: 75,
      unitPrice: 149.99,
      totalValue: 12749.15,
      location: 'B-05-7',
      warehouse: 'Main Warehouse',
      supplier: 'ToolPro Industries',
      status: 'low-stock',
      lastRestocked: '2024-01-28',
      lastSold: '2024-02-19',
      turnoverRate: 3.8,
      image: '/products/drill.png'
    },
    {
      id: '3',
      sku: 'OFF-112',
      name: 'Premium Copy Paper (5000 sheets)',
      category: 'Office Supplies',
      subcategory: 'Paper Products',
      description: 'High-quality 80gsm copy paper, case of 10 reams',
      quantity: 1250,
      minStock: 200,
      maxStock: 1500,
      reorderPoint: 400,
      unitPrice: 45.99,
      totalValue: 57487.50,
      location: 'C-02-1',
      warehouse: 'Secondary Warehouse',
      supplier: 'Office Essentials',
      status: 'in-stock',
      lastRestocked: '2024-02-10',
      lastSold: '2024-02-21',
      turnoverRate: 8.5,
      image: '/products/paper.png'
    },
    {
      id: '4',
      sku: 'RAW-089',
      name: 'Aluminum Sheets (6061-T6)',
      category: 'Raw Materials',
      subcategory: 'Metals',
      description: 'Industrial grade aluminum sheets, 4x8 feet, 0.125" thick',
      quantity: 0,
      minStock: 100,
      maxStock: 500,
      reorderPoint: 150,
      unitPrice: 125.00,
      totalValue: 0,
      location: 'D-08-2',
      warehouse: 'Materials Depot',
      supplier: 'MetalWorks Inc.',
      status: 'out-of-stock',
      lastRestocked: '2024-01-05',
      lastSold: '2024-02-18',
      turnoverRate: 4.1,
      image: '/products/aluminum.png'
    },
    {
      id: '5',
      sku: 'ELEC-078',
      name: 'USB-C Charging Cable (6ft)',
      category: 'Electronics',
      subcategory: 'Cables',
      description: 'Premium braided USB-C to USB-C fast charging cable',
      quantity: 2500,
      minStock: 500,
      maxStock: 2000,
      reorderPoint: 800,
      unitPrice: 14.99,
      totalValue: 37475.00,
      location: 'A-03-5',
      warehouse: 'Main Warehouse',
      supplier: 'CableTech Solutions',
      status: 'overstock',
      lastRestocked: '2024-02-12',
      lastSold: '2024-02-20',
      turnoverRate: 12.3,
      image: '/products/cable.png'
    },
    {
      id: '6',
      sku: 'FG-034',
      name: 'Ergonomic Office Chair',
      category: 'Finished Goods',
      subcategory: 'Furniture',
      description: 'Adjustable ergonomic chair with lumbar support',
      quantity: 175,
      minStock: 50,
      maxStock: 300,
      reorderPoint: 100,
      unitPrice: 299.99,
      totalValue: 52498.25,
      location: 'E-01-1',
      warehouse: 'Furniture Warehouse',
      supplier: 'ComfortSeating Ltd.',
      status: 'in-stock',
      lastRestocked: '2024-02-08',
      lastSold: '2024-02-19',
      turnoverRate: 2.4,
      image: '/products/chair.png'
    }
  ];

  const recentMovements: Movement[] = [
    { id: '1', type: 'in', itemName: 'Wireless Bluetooth Headphones', sku: 'ELEC-001', quantity: 200, date: '2024-02-21', reference: 'PO-2024-0892', user: 'John Smith' },
    { id: '2', type: 'out', itemName: 'Premium Copy Paper', sku: 'OFF-112', quantity: 50, date: '2024-02-21', reference: 'SO-2024-1234', user: 'Sales Team' },
    { id: '3', type: 'transfer', itemName: 'Industrial Power Drill', sku: 'HW-045', quantity: 25, date: '2024-02-20', reference: 'TR-2024-0045', user: 'Warehouse Ops' },
    { id: '4', type: 'adjustment', itemName: 'USB-C Charging Cable', sku: 'ELEC-078', quantity: -15, date: '2024-02-20', reference: 'ADJ-2024-0023', user: 'Inventory Audit' }
  ];

  const warehouses: Warehouse[] = [
    { id: '1', name: 'Main Warehouse', location: 'Building A', capacity: 10000, used: 7850, items: 8234 },
    { id: '2', name: 'Secondary Warehouse', location: 'Building B', capacity: 5000, used: 3200, items: 4567 },
    { id: '3', name: 'Materials Depot', location: 'Building C', capacity: 3000, used: 2100, items: 1890 },
    { id: '4', name: 'Furniture Warehouse', location: 'Building D', capacity: 2000, used: 1156, items: 1156 }
  ];

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'in-stock': 'status-instock',
      'low-stock': 'status-lowstock',
      'out-of-stock': 'status-outofstock',
      'overstock': 'status-overstock',
      'discontinued': 'status-discontinued'
    };
    return colors[status] || '';
  };

  const getMovementIcon = (type: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'in': <ArrowDownRight size={16} />,
      'out': <ArrowUpRight size={16} />,
      'transfer': <RefreshCw size={16} />,
      'adjustment': <Settings size={16} />
    };
    return icons[type] || <Package size={16} />;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStockLevel = (item: InventoryItem): number => {
    return Math.min((item.quantity / item.maxStock) * 100, 100);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesWarehouse = selectedWarehouse === 'all' || item.warehouse === selectedWarehouse;
    return matchesSearch && matchesCategory && matchesWarehouse;
  });

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <Boxes size={28} />
            </div>
            <div>
              <h1>Inventory Control</h1>
              <p>Track stock levels, movements and warehouse operations</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-secondary">
              <Scan size={18} />
              Scan
            </button>
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
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Boxes size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Items</span>
              <div className="stat-row">
                <span className="stat-value">{stats.totalItems.toLocaleString()}</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  12.5%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Value</span>
              <div className="stat-row">
                <span className="stat-value">{formatCurrency(stats.totalValue)}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon warning">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Low Stock Items</span>
              <div className="stat-row">
                <span className="stat-value">{stats.lowStockItems}</span>
                <span className="stat-badge warning">Needs attention</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card danger">
            <div className="stat-icon danger">
              <XCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Out of Stock</span>
              <div className="stat-row">
                <span className="stat-value">{stats.outOfStockItems}</span>
                <span className="stat-badge danger">Critical</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <RotateCcw size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Turnover Rate</span>
              <div className="stat-row">
                <span className="stat-value">{stats.turnoverRate}x</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  8.2%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <ShoppingCart size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Pending Orders</span>
              <div className="stat-row">
                <span className="stat-value">{stats.ordersPending}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Row */}
      <section className="categories-section">
        <div className="categories-scroll">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className={`category-chip ${selectedCategory === category.name ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === category.name ? 'all' : category.name)}
            >
              <span className="chip-name">{category.name}</span>
              <span className="chip-count">{category.items.toLocaleString()}</span>
              <span className={`chip-trend ${category.trend >= 0 ? 'up' : 'down'}`}>
                {category.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(category.trend)}%
              </span>
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
                placeholder="Search by name, SKU, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <select 
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                <option value="all">All Warehouses</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <select>
                <option value="all">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="overstock">Overstock</option>
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

          {/* Inventory List */}
          {viewMode === 'list' ? (
            <div className="inventory-list">
              <div className="list-header">
                <span className="col-checkbox"><input type="checkbox" /></span>
                <span className="col-item">Item</span>
                <span className="col-sku">SKU</span>
                <span className="col-category">Category</span>
                <span className="col-stock">Stock Level</span>
                <span className="col-value">Value</span>
                <span className="col-location">Location</span>
                <span className="col-actions">Actions</span>
              </div>
              
              {filteredItems.map((item) => (
                <div key={item.id} className="inventory-item">
                  <div 
                    className="item-main"
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  >
                    <span className="col-checkbox">
                      <input type="checkbox" onClick={(e) => e.stopPropagation()} />
                    </span>
                    
                    <div className="col-item">
                      <div className="item-icon">
                        <Package size={20} />
                      </div>
                      <div className="item-info">
                        <h3>{item.name}</h3>
                        <span className={`status-badge ${getStatusColor(item.status)}`}>
                          {item.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <span className="col-sku">{item.sku}</span>
                    
                    <div className="col-category">
                      <span className="category-name">{item.category}</span>
                      <span className="subcategory">{item.subcategory}</span>
                    </div>
                    
                    <div className="col-stock">
                      <div className="stock-info">
                        <span className="stock-quantity">{item.quantity.toLocaleString()}</span>
                        <span className="stock-range">/ {item.maxStock.toLocaleString()}</span>
                      </div>
                      <div className="stock-bar">
                        <div 
                          className={`stock-fill ${item.quantity <= item.minStock ? 'low' : item.quantity >= item.maxStock ? 'over' : ''}`}
                          style={{ width: `${getStockLevel(item)}%` }}
                        />
                      </div>
                      {item.quantity <= item.reorderPoint && item.quantity > 0 && (
                        <span className="reorder-alert">Reorder soon</span>
                      )}
                    </div>
                    
                    <div className="col-value">
                      <span className="unit-price">${item.unitPrice.toFixed(2)}</span>
                      <span className="total-value">{formatCurrency(item.totalValue)}</span>
                    </div>
                    
                    <div className="col-location">
                      <span className="location-code">{item.location}</span>
                      <span className="warehouse-name">{item.warehouse}</span>
                    </div>
                    
                    <div className="col-actions">
                      <button className="action-btn" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn" title="Adjust Stock">
                        <Settings size={16} />
                      </button>
                      <button className="action-btn expand-btn">
                        {expandedItem === item.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  {expandedItem === item.id && (
                    <div className="item-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h4>Stock Details</h4>
                          <div className="details-list">
                            <div className="detail-row">
                              <span>Current Quantity</span>
                              <span>{item.quantity.toLocaleString()}</span>
                            </div>
                            <div className="detail-row">
                              <span>Min Stock</span>
                              <span>{item.minStock.toLocaleString()}</span>
                            </div>
                            <div className="detail-row">
                              <span>Max Stock</span>
                              <span>{item.maxStock.toLocaleString()}</span>
                            </div>
                            <div className="detail-row">
                              <span>Reorder Point</span>
                              <span>{item.reorderPoint.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>Supplier</h4>
                          <div className="supplier-info">
                            <span className="supplier-name">{item.supplier}</span>
                            <button className="order-btn">
                              <ShoppingCart size={14} />
                              Create PO
                            </button>
                          </div>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>History</h4>
                          <div className="dates-list">
                            <div className="date-row">
                              <Calendar size={14} />
                              <span>Last Restocked: {item.lastRestocked}</span>
                            </div>
                            <div className="date-row">
                              <Clock size={14} />
                              <span>Last Sold: {item.lastSold}</span>
                            </div>
                            <div className="date-row">
                              <RotateCcw size={14} />
                              <span>Turnover: {item.turnoverRate}x/year</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>Quick Actions</h4>
                          <div className="quick-actions">
                            <button className="quick-btn">
                              <ArrowDownRight size={14} />
                              Stock In
                            </button>
                            <button className="quick-btn">
                              <ArrowUpRight size={14} />
                              Stock Out
                            </button>
                            <button className="quick-btn">
                              <RefreshCw size={14} />
                              Transfer
                            </button>
                            <button className="quick-btn">
                              <History size={14} />
                              History
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
            <div className="inventory-grid">
              {filteredItems.map((item) => (
                <div key={item.id} className={`inventory-card ${item.status}`}>
                  <div className="card-header">
                    <div className="card-icon">
                      <Package size={24} />
                    </div>
                    <span className={`status-badge ${getStatusColor(item.status)}`}>
                      {item.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <h3>{item.name}</h3>
                  <span className="card-sku">{item.sku}</span>
                  
                  <div className="card-stock">
                    <div className="stock-header">
                      <span>Stock Level</span>
                      <span>{item.quantity.toLocaleString()} / {item.maxStock.toLocaleString()}</span>
                    </div>
                    <div className="stock-bar">
                      <div 
                        className={`stock-fill ${item.quantity <= item.minStock ? 'low' : item.quantity >= item.maxStock ? 'over' : ''}`}
                        style={{ width: `${getStockLevel(item)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="card-meta">
                    <div className="meta-row">
                      <MapPin size={14} />
                      <span>{item.location}</span>
                    </div>
                    <div className="meta-row">
                      <Warehouse size={14} />
                      <span>{item.warehouse}</span>
                    </div>
                  </div>
                  
                  <div className="card-value">
                    <div className="value-row">
                      <span>Unit Price</span>
                      <span>${item.unitPrice.toFixed(2)}</span>
                    </div>
                    <div className="value-row total">
                      <span>Total Value</span>
                      <span>{formatCurrency(item.totalValue)}</span>
                    </div>
                  </div>
                  
                  <div className="card-actions">
                    <button className="action-btn"><Eye size={14} /></button>
                    <button className="action-btn"><Edit size={14} /></button>
                    <button className="action-btn"><Settings size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="content-sidebar">
          <div className="sidebar-section">
            <h3>Recent Movements</h3>
            <div className="movements-list">
              {recentMovements.map((movement) => (
                <div key={movement.id} className={`movement-item type-${movement.type}`}>
                  <div className={`movement-icon type-${movement.type}`}>
                    {getMovementIcon(movement.type)}
                  </div>
                  <div className="movement-info">
                    <div className="movement-header">
                      <span className="movement-type">{movement.type.charAt(0).toUpperCase() + movement.type.slice(1)}</span>
                      <span className={`movement-qty ${movement.quantity > 0 ? 'positive' : 'negative'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </div>
                    <span className="movement-item-name">{movement.itemName}</span>
                    <div className="movement-meta">
                      <span>{movement.reference}</span>
                      <span>{movement.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="view-all-btn">
              View All Movements
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Warehouse Overview</h3>
            <div className="warehouses-list">
              {warehouses.map((warehouse) => (
                <div key={warehouse.id} className="warehouse-item">
                  <div className="warehouse-header">
                    <div className="warehouse-icon">
                      <Warehouse size={18} />
                    </div>
                    <div className="warehouse-info">
                      <h4>{warehouse.name}</h4>
                      <span>{warehouse.location}</span>
                    </div>
                  </div>
                  <div className="warehouse-capacity">
                    <div className="capacity-header">
                      <span>{warehouse.items.toLocaleString()} items</span>
                      <span>{Math.round((warehouse.used / warehouse.capacity) * 100)}%</span>
                    </div>
                    <div className="capacity-bar">
                      <div 
                        className="capacity-fill"
                        style={{ width: `${(warehouse.used / warehouse.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section alerts">
            <h3>Alerts</h3>
            <div className="alerts-list">
              <div className="alert-item critical">
                <AlertCircle size={16} />
                <div className="alert-content">
                  <span className="alert-title">45 items out of stock</span>
                  <span className="alert-desc">Immediate reorder required</span>
                </div>
              </div>
              <div className="alert-item warning">
                <AlertTriangle size={16} />
                <div className="alert-content">
                  <span className="alert-title">234 items low on stock</span>
                  <span className="alert-desc">Below reorder point</span>
                </div>
              </div>
              <div className="alert-item info">
                <Layers size={16} />
                <div className="alert-content">
                  <span className="alert-title">12 items overstocked</span>
                  <span className="alert-desc">Consider promotions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
