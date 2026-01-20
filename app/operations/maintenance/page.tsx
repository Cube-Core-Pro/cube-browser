'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench,
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
  Settings,
  Zap,
  Activity,
  Users,
  ChevronRight,
  ChevronDown,
  MapPin,
  Hammer,
  HardHat,
  Cog,
  Timer,
  DollarSign,
  ClipboardList,
  CalendarClock,
  CalendarCheck,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  Gauge,
  ThermometerSun,
  Droplets,
  Fuel,
  Battery,
  Layers,
  History,
  Bell,
  CheckSquare
} from 'lucide-react';
import './maintenance.css';

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  type: 'preventive' | 'corrective' | 'emergency' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled';
  asset: string;
  assetLocation: string;
  assignedTo: string;
  assignedAvatar: string;
  createdDate: string;
  scheduledDate: string;
  completedDate: string | null;
  estimatedHours: number;
  actualHours: number | null;
  estimatedCost: number;
  actualCost: number | null;
  description: string;
}

interface MaintenanceMetrics {
  totalWorkOrders: number;
  openWorkOrders: number;
  completedThisMonth: number;
  overdueOrders: number;
  mttr: number;
  mtbf: number;
  plannedVsUnplanned: number;
  laborUtilization: number;
}

interface ScheduledMaintenance {
  id: string;
  asset: string;
  maintenanceType: string;
  frequency: string;
  lastPerformed: string;
  nextDue: string;
  status: 'upcoming' | 'due-soon' | 'overdue';
  daysUntilDue: number;
}

interface MaintenanceLog {
  id: string;
  workOrderNumber: string;
  action: string;
  performedBy: string;
  timestamp: string;
  notes: string;
}

interface SparePartUsage {
  partNumber: string;
  partName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export default function MaintenancePage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('work-orders');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedWorkOrder, setExpandedWorkOrder] = useState<string | null>(null);

  const metrics: MaintenanceMetrics = {
    totalWorkOrders: 892,
    openWorkOrders: 47,
    completedThisMonth: 124,
    overdueOrders: 8,
    mttr: 4.2,
    mtbf: 720,
    plannedVsUnplanned: 78,
    laborUtilization: 86.5
  };

  const workOrders: WorkOrder[] = [
    {
      id: '1',
      workOrderNumber: 'WO-2024-0456',
      title: 'Quarterly Pump Inspection',
      type: 'preventive',
      priority: 'medium',
      status: 'in-progress',
      asset: 'Hydraulic Pump HP-101',
      assetLocation: 'Production Floor A',
      assignedTo: 'Mike Johnson',
      assignedAvatar: 'MJ',
      createdDate: '2024-02-15',
      scheduledDate: '2024-02-20',
      completedDate: null,
      estimatedHours: 4,
      actualHours: 2.5,
      estimatedCost: 450,
      actualCost: null,
      description: 'Quarterly preventive maintenance inspection of hydraulic pump system.'
    },
    {
      id: '2',
      workOrderNumber: 'WO-2024-0457',
      title: 'Motor Bearing Replacement',
      type: 'corrective',
      priority: 'high',
      status: 'open',
      asset: 'Electric Motor EM-205',
      assetLocation: 'Assembly Line B',
      assignedTo: 'Sarah Chen',
      assignedAvatar: 'SC',
      createdDate: '2024-02-18',
      scheduledDate: '2024-02-21',
      completedDate: null,
      estimatedHours: 6,
      actualHours: null,
      estimatedCost: 1200,
      actualCost: null,
      description: 'Replace worn bearings in motor assembly. Abnormal vibration detected.'
    },
    {
      id: '3',
      workOrderNumber: 'WO-2024-0458',
      title: 'HVAC System Emergency Repair',
      type: 'emergency',
      priority: 'critical',
      status: 'in-progress',
      asset: 'HVAC Unit AC-003',
      assetLocation: 'Building C',
      assignedTo: 'Robert Lee',
      assignedAvatar: 'RL',
      createdDate: '2024-02-20',
      scheduledDate: '2024-02-20',
      completedDate: null,
      estimatedHours: 8,
      actualHours: 5,
      estimatedCost: 2500,
      actualCost: null,
      description: 'Emergency repair of HVAC compressor failure. Critical for production area temperature control.'
    },
    {
      id: '4',
      workOrderNumber: 'WO-2024-0459',
      title: 'Annual Safety Inspection',
      type: 'inspection',
      priority: 'medium',
      status: 'completed',
      asset: 'Overhead Crane CR-001',
      assetLocation: 'Warehouse',
      assignedTo: 'Emily Davis',
      assignedAvatar: 'ED',
      createdDate: '2024-02-10',
      scheduledDate: '2024-02-15',
      completedDate: '2024-02-15',
      estimatedHours: 5,
      actualHours: 4.5,
      estimatedCost: 600,
      actualCost: 550,
      description: 'Annual safety inspection and certification of overhead crane system.'
    },
    {
      id: '5',
      workOrderNumber: 'WO-2024-0460',
      title: 'Conveyor Belt Tensioning',
      type: 'preventive',
      priority: 'low',
      status: 'open',
      asset: 'Conveyor System CV-102',
      assetLocation: 'Packaging Area',
      assignedTo: 'Tom Wilson',
      assignedAvatar: 'TW',
      createdDate: '2024-02-19',
      scheduledDate: '2024-02-25',
      completedDate: null,
      estimatedHours: 2,
      actualHours: null,
      estimatedCost: 150,
      actualCost: null,
      description: 'Routine belt tensioning and alignment check for conveyor system.'
    }
  ];

  const scheduledMaintenance: ScheduledMaintenance[] = [
    { id: '1', asset: 'CNC Machine CNC-001', maintenanceType: 'Lubrication', frequency: 'Weekly', lastPerformed: '2024-02-14', nextDue: '2024-02-21', status: 'due-soon', daysUntilDue: 1 },
    { id: '2', asset: 'Compressor CP-003', maintenanceType: 'Filter Change', frequency: 'Monthly', lastPerformed: '2024-01-22', nextDue: '2024-02-22', status: 'due-soon', daysUntilDue: 2 },
    { id: '3', asset: 'Generator GN-001', maintenanceType: 'Full Service', frequency: 'Quarterly', lastPerformed: '2023-11-15', nextDue: '2024-02-15', status: 'overdue', daysUntilDue: -5 },
    { id: '4', asset: 'Hydraulic Press HP-002', maintenanceType: 'Oil Change', frequency: 'Monthly', lastPerformed: '2024-02-01', nextDue: '2024-03-01', status: 'upcoming', daysUntilDue: 9 },
    { id: '5', asset: 'Welding Robot WR-004', maintenanceType: 'Calibration', frequency: 'Bi-weekly', lastPerformed: '2024-02-10', nextDue: '2024-02-24', status: 'upcoming', daysUntilDue: 4 }
  ];

  const maintenanceLogs: MaintenanceLog[] = [
    { id: '1', workOrderNumber: 'WO-2024-0456', action: 'Started inspection', performedBy: 'Mike Johnson', timestamp: '2024-02-20 09:00', notes: 'Beginning pump inspection procedure' },
    { id: '2', workOrderNumber: 'WO-2024-0456', action: 'Parts ordered', performedBy: 'System', timestamp: '2024-02-20 10:30', notes: 'Replacement seals ordered - 2 day ETA' },
    { id: '3', workOrderNumber: 'WO-2024-0458', action: 'Emergency escalated', performedBy: 'System', timestamp: '2024-02-20 08:15', notes: 'HVAC failure reported - critical priority assigned' },
    { id: '4', workOrderNumber: 'WO-2024-0459', action: 'Completed', performedBy: 'Emily Davis', timestamp: '2024-02-15 16:30', notes: 'All safety checks passed. Certification renewed.' }
  ];

  const spareParts: SparePartUsage[] = [
    { partNumber: 'BRG-2205', partName: 'Ball Bearing 22x47x14', quantity: 4, unitCost: 45.00, totalCost: 180.00 },
    { partNumber: 'SL-1002', partName: 'Hydraulic Seal Kit', quantity: 2, unitCost: 85.00, totalCost: 170.00 },
    { partNumber: 'FLT-AC01', partName: 'Air Filter HVAC', quantity: 6, unitCost: 32.00, totalCost: 192.00 }
  ];

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'open': 'status-open',
      'in-progress': 'status-progress',
      'on-hold': 'status-hold',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'upcoming': 'status-upcoming',
      'due-soon': 'status-due-soon',
      'overdue': 'status-overdue'
    };
    return colors[status] || '';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      'low': 'priority-low',
      'medium': 'priority-medium',
      'high': 'priority-high',
      'critical': 'priority-critical'
    };
    return colors[priority] || '';
  };

  const getTypeIcon = (type: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'preventive': <ShieldCheck size={16} />,
      'corrective': <Wrench size={16} />,
      'emergency': <AlertTriangle size={16} />,
      'inspection': <ClipboardList size={16} />
    };
    return icons[type] || <Wrench size={16} />;
  };

  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch = wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         wo.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         wo.asset.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || wo.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || wo.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="maintenance-container">
      <div className="maintenance-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <Wrench size={28} />
            </div>
            <div>
              <h1>Maintenance Management</h1>
              <p>Work orders, schedules, and asset maintenance tracking</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-secondary">
              <Calendar size={18} />
              Schedule
            </button>
            <button className="btn-secondary">
              <Download size={18} />
              Export
            </button>
            <button className="btn-primary">
              <Plus size={18} />
              New Work Order
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <ClipboardList size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Work Orders</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.totalWorkOrders.toLocaleString()}</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  5.2%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card active">
            <div className="stat-icon info">
              <Wrench size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Open Orders</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.openWorkOrders}</span>
                <span className="stat-badge">{metrics.openWorkOrders} active</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card highlight">
            <div className="stat-icon success">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Completed This Month</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.completedThisMonth}</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  12.8%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card alert">
            <div className="stat-icon danger">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Overdue Orders</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.overdueOrders}</span>
                <span className="stat-badge danger">Needs attention</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Timer size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">MTTR (hours)</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.mttr}</span>
                <span className="stat-change down-good">
                  <TrendingDown size={14} />
                  0.5h
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Activity size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">MTBF (hours)</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.mtbf}</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  48h
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon planned">
              <CalendarCheck size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Planned Maintenance</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.plannedVsUnplanned}%</span>
                <span className="stat-badge success">Target: 80%</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Labor Utilization</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.laborUtilization}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs */}
      <div className="main-tabs">
        <button 
          className={`tab-btn ${activeTab === 'work-orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('work-orders')}
        >
          <ClipboardList size={18} />
          Work Orders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <CalendarClock size={18} />
          PM Schedule
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} />
          History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} />
          Analytics
        </button>
      </div>

      {/* Work Orders Tab */}
      {activeTab === 'work-orders' && (
        <div className="main-content">
          <div className="content-left">
            {/* Filters */}
            <div className="filters-bar">
              <div className="search-box">
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Search work orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="preventive">Preventive</option>
                  <option value="corrective">Corrective</option>
                  <option value="emergency">Emergency</option>
                  <option value="inspection">Inspection</option>
                </select>
              </div>
              
              <div className="filter-group">
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
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

            {/* Work Orders List */}
            <div className="work-orders-list">
              {filteredWorkOrders.map((wo) => (
                <div key={wo.id} className={`work-order-item ${wo.status} ${wo.priority}`}>
                  <div 
                    className="work-order-main"
                    onClick={() => setExpandedWorkOrder(expandedWorkOrder === wo.id ? null : wo.id)}
                  >
                    <div className="wo-type">
                      <div className={`type-icon type-${wo.type}`}>
                        {getTypeIcon(wo.type)}
                      </div>
                    </div>
                    
                    <div className="wo-info">
                      <div className="wo-header">
                        <span className="wo-number">{wo.workOrderNumber}</span>
                        <span className={`status-badge ${getStatusColor(wo.status)}`}>
                          {wo.status.replace('-', ' ')}
                        </span>
                        <span className={`priority-badge ${getPriorityColor(wo.priority)}`}>
                          {wo.priority}
                        </span>
                      </div>
                      <h3>{wo.title}</h3>
                      <div className="wo-meta">
                        <span className="asset">
                          <Settings size={14} />
                          {wo.asset}
                        </span>
                        <span className="location">
                          <MapPin size={14} />
                          {wo.assetLocation}
                        </span>
                        <span className="scheduled">
                          <Calendar size={14} />
                          {wo.scheduledDate}
                        </span>
                      </div>
                    </div>
                    
                    <div className="wo-hours">
                      <div className="hours-item">
                        <span className="hours-label">Est. Hours</span>
                        <span className="hours-value">{wo.estimatedHours}h</span>
                      </div>
                      {wo.actualHours !== null && (
                        <div className="hours-item actual">
                          <span className="hours-label">Actual</span>
                          <span className="hours-value">{wo.actualHours}h</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="wo-assignee">
                      <div className="assignee-avatar">{wo.assignedAvatar}</div>
                      <span>{wo.assignedTo}</span>
                    </div>
                    
                    <div className="wo-actions">
                      <button className="action-btn" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn expand-btn">
                        {expandedWorkOrder === wo.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  {expandedWorkOrder === wo.id && (
                    <div className="wo-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h4>Description</h4>
                          <p className="description-text">{wo.description}</p>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>Cost Estimate</h4>
                          <div className="cost-info">
                            <div className="cost-row">
                              <span>Estimated:</span>
                              <span className="cost-value">${wo.estimatedCost.toLocaleString()}</span>
                            </div>
                            {wo.actualCost !== null && (
                              <div className="cost-row">
                                <span>Actual:</span>
                                <span className="cost-value">${wo.actualCost.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>Quick Actions</h4>
                          <div className="quick-actions">
                            {wo.status === 'open' && (
                              <button className="quick-btn primary">
                                <Play size={14} />
                                Start Work
                              </button>
                            )}
                            {wo.status === 'in-progress' && (
                              <>
                                <button className="quick-btn">
                                  <Pause size={14} />
                                  Pause
                                </button>
                                <button className="quick-btn success">
                                  <CheckCircle size={14} />
                                  Complete
                                </button>
                              </>
                            )}
                            <button className="quick-btn">
                              <FileText size={14} />
                              Add Notes
                            </button>
                            <button className="quick-btn">
                              <Package size={14} />
                              Request Parts
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

          {/* Sidebar */}
          <div className="content-sidebar">
            <div className="sidebar-section">
              <h3>Upcoming PM</h3>
              <div className="pm-list">
                {scheduledMaintenance.slice(0, 4).map((pm) => (
                  <div key={pm.id} className={`pm-item ${pm.status}`}>
                    <div className="pm-status">
                      <span className={`status-dot ${pm.status}`}></span>
                    </div>
                    <div className="pm-info">
                      <span className="pm-asset">{pm.asset}</span>
                      <span className="pm-type">{pm.maintenanceType}</span>
                      <span className="pm-due">
                        {pm.status === 'overdue' 
                          ? `${Math.abs(pm.daysUntilDue)} days overdue`
                          : pm.daysUntilDue === 0 
                            ? 'Due today'
                            : `Due in ${pm.daysUntilDue} days`
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="view-all-btn">View All Schedules</button>
            </div>

            <div className="sidebar-section">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {maintenanceLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="activity-item">
                    <div className="activity-icon">
                      <Activity size={14} />
                    </div>
                    <div className="activity-content">
                      <span className="activity-wo">{log.workOrderNumber}</span>
                      <span className="activity-action">{log.action}</span>
                      <span className="activity-time">{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PM Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="schedule-content">
          <div className="schedule-header">
            <h2>Preventive Maintenance Schedule</h2>
            <button className="btn-primary">
              <Plus size={18} />
              Add PM Task
            </button>
          </div>
          <div className="schedule-list">
            {scheduledMaintenance.map((pm) => (
              <div key={pm.id} className={`schedule-item ${pm.status}`}>
                <div className="schedule-status">
                  <span className={`status-indicator ${pm.status}`}></span>
                </div>
                <div className="schedule-info">
                  <div className="schedule-header-row">
                    <h3>{pm.asset}</h3>
                    <span className={`status-badge ${getStatusColor(pm.status)}`}>
                      {pm.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="schedule-meta">
                    <span className="maintenance-type">
                      <Wrench size={14} />
                      {pm.maintenanceType}
                    </span>
                    <span className="frequency">
                      <RotateCcw size={14} />
                      {pm.frequency}
                    </span>
                  </div>
                </div>
                <div className="schedule-dates">
                  <div className="date-item">
                    <span className="date-label">Last Performed</span>
                    <span className="date-value">{pm.lastPerformed}</span>
                  </div>
                  <div className="date-item">
                    <span className="date-label">Next Due</span>
                    <span className={`date-value ${pm.status === 'overdue' ? 'overdue' : ''}`}>
                      {pm.nextDue}
                    </span>
                  </div>
                </div>
                <div className="schedule-countdown">
                  <span className={`countdown-value ${pm.status}`}>
                    {pm.status === 'overdue' 
                      ? `-${Math.abs(pm.daysUntilDue)}`
                      : pm.daysUntilDue
                    }
                  </span>
                  <span className="countdown-label">days</span>
                </div>
                <div className="schedule-actions">
                  <button className="action-btn primary">
                    <Play size={16} />
                  </button>
                  <button className="action-btn">
                    <Edit size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-content">
          <div className="history-header">
            <h2>Maintenance History</h2>
            <div className="history-filters">
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
          <div className="history-timeline">
            {maintenanceLogs.map((log, index) => (
              <div key={log.id} className="timeline-item">
                <div className="timeline-marker">
                  <div className="marker-dot"></div>
                  {index < maintenanceLogs.length - 1 && <div className="marker-line"></div>}
                </div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-wo">{log.workOrderNumber}</span>
                    <span className="timeline-time">{log.timestamp}</span>
                  </div>
                  <h4>{log.action}</h4>
                  <p>{log.notes}</p>
                  <span className="timeline-by">by {log.performedBy}</span>
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
            <h2>Maintenance Analytics</h2>
            <div className="analytics-filters">
              <select>
                <option>This Month</option>
                <option>Last 3 Months</option>
                <option>This Year</option>
              </select>
              <button className="btn-secondary">
                <Download size={18} />
                Export
              </button>
            </div>
          </div>
          
          <div className="analytics-grid">
            <div className="analytics-card large">
              <h3>Work Order Distribution</h3>
              <div className="distribution-chart">
                <div className="dist-row">
                  <span className="dist-label">Preventive</span>
                  <div className="dist-bar">
                    <div className="dist-fill preventive" style={{ width: '45%' }}></div>
                  </div>
                  <span className="dist-value">45%</span>
                </div>
                <div className="dist-row">
                  <span className="dist-label">Corrective</span>
                  <div className="dist-bar">
                    <div className="dist-fill corrective" style={{ width: '33%' }}></div>
                  </div>
                  <span className="dist-value">33%</span>
                </div>
                <div className="dist-row">
                  <span className="dist-label">Emergency</span>
                  <div className="dist-bar">
                    <div className="dist-fill emergency" style={{ width: '12%' }}></div>
                  </div>
                  <span className="dist-value">12%</span>
                </div>
                <div className="dist-row">
                  <span className="dist-label">Inspection</span>
                  <div className="dist-bar">
                    <div className="dist-fill inspection" style={{ width: '10%' }}></div>
                  </div>
                  <span className="dist-value">10%</span>
                </div>
              </div>
            </div>
            
            <div className="analytics-card">
              <h3>Top Parts Usage</h3>
              <div className="parts-list">
                {spareParts.map((part, index) => (
                  <div key={index} className="part-item">
                    <span className="part-name">{part.partName}</span>
                    <span className="part-qty">{part.quantity} units</span>
                    <span className="part-cost">${part.totalCost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="analytics-card">
              <h3>Key Performance Indicators</h3>
              <div className="kpi-list">
                <div className="kpi-item">
                  <div className="kpi-icon">
                    <Timer size={20} />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Avg. Response Time</span>
                    <span className="kpi-value">2.4 hours</span>
                  </div>
                  <span className="kpi-trend good">-15%</span>
                </div>
                <div className="kpi-item">
                  <div className="kpi-icon">
                    <CheckSquare size={20} />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">First-Time Fix Rate</span>
                    <span className="kpi-value">87%</span>
                  </div>
                  <span className="kpi-trend good">+3%</span>
                </div>
                <div className="kpi-item">
                  <div className="kpi-icon">
                    <DollarSign size={20} />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Maintenance Cost/Asset</span>
                    <span className="kpi-value">$1,245</span>
                  </div>
                  <span className="kpi-trend bad">+8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
