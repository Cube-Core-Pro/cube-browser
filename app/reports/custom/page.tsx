'use client';

import React, { useState } from 'react';
import { 
  FileBarChart,
  Plus,
  Calendar,
  Clock,
  Star,
  Trash2,
  Edit3,
  Copy,
  Download,
  Eye,
  MoreHorizontal,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Table2,
  Layers,
  Database,
  Users,
  Activity,
  Shield,
  Zap,
  CheckCircle,
  X,
  PlayCircle,
  Pause,
  Settings,
  Share2,
  Bookmark,
  FolderOpen,
  Columns,
  Grid3X3,
  Mail,
  RefreshCw,
  ArrowUpRight,
  Lock,
  Unlock,
  GripVertical
} from 'lucide-react';
import './custom-reports.css';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'bar' | 'line' | 'pie' | 'table' | 'combo';
  category: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  creator: {
    name: string;
    avatar?: string;
  };
  isStarred: boolean;
  isShared: boolean;
  isScheduled: boolean;
  schedule?: string;
  dataSources: string[];
  metrics: string[];
  viewCount: number;
}

interface DataSource {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  fields: string[];
  recordCount: number;
}

interface ReportWidget {
  id: string;
  name: string;
  type: 'bar' | 'line' | 'pie' | 'stat' | 'table';
  icon: React.ReactNode;
  description: string;
}

const SAVED_REPORTS: Report[] = [
  {
    id: 'rep-001',
    name: 'Monthly Automation Performance',
    description: 'Track automation success rates and execution times across all workflows',
    type: 'combo',
    category: 'Performance',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-29T14:30:00Z',
    lastRunAt: '2025-01-29T14:30:00Z',
    creator: { name: 'John Smith' },
    isStarred: true,
    isShared: true,
    isScheduled: true,
    schedule: 'Weekly on Monday',
    dataSources: ['Automations', 'Execution Logs'],
    metrics: ['Success Rate', 'Avg Duration', 'Error Count'],
    viewCount: 245,
  },
  {
    id: 'rep-002',
    name: 'User Activity Overview',
    description: 'Comprehensive user engagement and activity metrics',
    type: 'bar',
    category: 'Users',
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-28T11:00:00Z',
    lastRunAt: '2025-01-28T11:00:00Z',
    creator: { name: 'Sarah Johnson' },
    isStarred: true,
    isShared: false,
    isScheduled: false,
    dataSources: ['Users', 'Activity Logs'],
    metrics: ['Active Users', 'Sessions', 'Actions'],
    viewCount: 128,
  },
  {
    id: 'rep-003',
    name: 'API Usage Breakdown',
    description: 'Detailed breakdown of API endpoint usage and response times',
    type: 'table',
    category: 'API',
    createdAt: '2025-01-20T14:00:00Z',
    updatedAt: '2025-01-29T08:00:00Z',
    lastRunAt: '2025-01-29T08:00:00Z',
    creator: { name: 'Mike Chen' },
    isStarred: false,
    isShared: true,
    isScheduled: true,
    schedule: 'Daily at 8:00 AM',
    dataSources: ['API Logs'],
    metrics: ['Requests', 'Latency', 'Error Rate'],
    viewCount: 89,
  },
  {
    id: 'rep-004',
    name: 'Security Audit Summary',
    description: 'Security events and compliance status overview',
    type: 'pie',
    category: 'Security',
    createdAt: '2025-01-05T16:00:00Z',
    updatedAt: '2025-01-27T10:00:00Z',
    lastRunAt: '2025-01-27T10:00:00Z',
    creator: { name: 'Emily Brown' },
    isStarred: false,
    isShared: false,
    isScheduled: false,
    dataSources: ['Security Logs', 'Audit Trail'],
    metrics: ['Events by Type', 'Risk Level', 'Resolution Time'],
    viewCount: 67,
  },
  {
    id: 'rep-005',
    name: 'Resource Utilization',
    description: 'System resource usage and capacity planning metrics',
    type: 'line',
    category: 'System',
    createdAt: '2025-01-08T11:00:00Z',
    updatedAt: '2025-01-29T06:00:00Z',
    lastRunAt: '2025-01-29T06:00:00Z',
    creator: { name: 'John Smith' },
    isStarred: true,
    isShared: true,
    isScheduled: true,
    schedule: 'Hourly',
    dataSources: ['System Metrics'],
    metrics: ['CPU', 'Memory', 'Storage', 'Network'],
    viewCount: 312,
  },
];

const DATA_SOURCES: DataSource[] = [
  {
    id: 'ds-users',
    name: 'Users',
    description: 'User accounts and profiles',
    icon: <Users size={18} />,
    fields: ['user_id', 'name', 'email', 'role', 'created_at', 'last_active'],
    recordCount: 8432,
  },
  {
    id: 'ds-automations',
    name: 'Automations',
    description: 'Automation workflows',
    icon: <Zap size={18} />,
    fields: ['automation_id', 'name', 'status', 'trigger_type', 'created_at'],
    recordCount: 12450,
  },
  {
    id: 'ds-executions',
    name: 'Execution Logs',
    description: 'Automation run history',
    icon: <Activity size={18} />,
    fields: ['execution_id', 'automation_id', 'status', 'duration', 'timestamp'],
    recordCount: 456800,
  },
  {
    id: 'ds-api',
    name: 'API Logs',
    description: 'API request logs',
    icon: <Database size={18} />,
    fields: ['request_id', 'endpoint', 'method', 'status_code', 'latency'],
    recordCount: 2847562,
  },
  {
    id: 'ds-security',
    name: 'Security Events',
    description: 'Security and audit logs',
    icon: <Shield size={18} />,
    fields: ['event_id', 'type', 'severity', 'user_id', 'timestamp'],
    recordCount: 84200,
  },
];

const REPORT_WIDGETS: ReportWidget[] = [
  { id: 'w-bar', name: 'Bar Chart', type: 'bar', icon: <BarChart3 size={24} />, description: 'Compare values across categories' },
  { id: 'w-line', name: 'Line Chart', type: 'line', icon: <LineChart size={24} />, description: 'Show trends over time' },
  { id: 'w-pie', name: 'Pie Chart', type: 'pie', icon: <PieChart size={24} />, description: 'Show proportions of a whole' },
  { id: 'w-stat', name: 'Stat Card', type: 'stat', icon: <TrendingUp size={24} />, description: 'Display single metric' },
  { id: 'w-table', name: 'Data Table', type: 'table', icon: <Table2 size={24} />, description: 'Show detailed records' },
];

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const getChartIcon = (type: Report['type']): React.ReactNode => {
  switch (type) {
    case 'bar': return <BarChart3 size={20} />;
    case 'line': return <LineChart size={20} />;
    case 'pie': return <PieChart size={20} />;
    case 'table': return <Table2 size={20} />;
    case 'combo': return <Layers size={20} />;
    default: return <FileBarChart size={20} />;
  }
};

export default function CustomReportsPage() {
  const [reports, setReports] = useState<Report[]>(SAVED_REPORTS);
  const [activeTab, setActiveTab] = useState<'reports' | 'builder'>('reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);

  const categories = ['all', ...new Set(reports.map(r => r.category))];
  
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const starredReports = reports.filter(r => r.isStarred);
  const scheduledReports = reports.filter(r => r.isScheduled);

  const toggleStar = (id: string) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, isStarred: !r.isStarred } : r
    ));
  };

  const toggleDataSource = (id: string) => {
    setSelectedDataSources(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleWidget = (id: string) => {
    setSelectedWidgets(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  return (
    <div className="custom-reports">
      {/* Header */}
      <header className="custom-reports__header">
        <div className="custom-reports__title-section">
          <div className="custom-reports__icon">
            <FileBarChart size={28} />
          </div>
          <div>
            <h1>Custom Reports</h1>
            <p>Build and manage custom analytics reports</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <FolderOpen size={18} />
            Templates
          </button>
          <button className="btn-primary" onClick={() => setShowNewReportModal(true)}>
            <Plus size={18} />
            New Report
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="custom-reports__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <FileBarChart size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{reports.length}</span>
            <span className="stat-label">Total Reports</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon starred">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{starredReports.length}</span>
            <span className="stat-label">Starred</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon scheduled">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{scheduledReports.length}</span>
            <span className="stat-label">Scheduled</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon shared">
            <Share2 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{reports.filter(r => r.isShared).length}</span>
            <span className="stat-label">Shared</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="custom-reports__tabs">
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FolderOpen size={18} />
          My Reports
        </button>
        <button 
          className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          <Layers size={18} />
          Report Builder
        </button>
      </div>

      {/* Content */}
      {activeTab === 'reports' && (
        <div className="reports-section">
          {/* Toolbar */}
          <div className="reports-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="toolbar-actions">
              <div className="category-filter">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
              <div className="view-toggle">
                <button 
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 size={18} />
                </button>
                <button 
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <Columns size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Reports Grid/List */}
          <div className={`reports-container ${viewMode}`}>
            {filteredReports.map(report => (
              <div key={report.id} className="report-card">
                <div className="report-card__header">
                  <div className={`chart-type-icon ${report.type}`}>
                    {getChartIcon(report.type)}
                  </div>
                  <div className="report-badges">
                    {report.isShared && (
                      <span className="badge shared">
                        <Share2 size={12} />
                      </span>
                    )}
                    {report.isScheduled && (
                      <span className="badge scheduled">
                        <Clock size={12} />
                      </span>
                    )}
                  </div>
                  <button 
                    className={`star-btn ${report.isStarred ? 'starred' : ''}`}
                    onClick={() => toggleStar(report.id)}
                  >
                    <Star size={18} />
                  </button>
                </div>
                <div className="report-card__body">
                  <h3 className="report-name">{report.name}</h3>
                  <p className="report-desc">{report.description}</p>
                  <div className="report-meta">
                    <span className="category-badge">{report.category}</span>
                    <span className="data-sources">
                      <Database size={12} />
                      {report.dataSources.length} sources
                    </span>
                  </div>
                  <div className="report-metrics">
                    {report.metrics.slice(0, 3).map((metric, i) => (
                      <span key={i} className="metric-tag">{metric}</span>
                    ))}
                  </div>
                </div>
                <div className="report-card__footer">
                  <div className="footer-info">
                    <span className="creator">
                      <div className="avatar">{report.creator.name[0]}</div>
                      {report.creator.name}
                    </span>
                    <span className="last-run">
                      <Eye size={12} />
                      {report.viewCount}
                    </span>
                  </div>
                  <div className="report-actions">
                    <button className="action-btn primary">
                      <PlayCircle size={16} />
                      Run
                    </button>
                    <button className="action-btn">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'builder' && (
        <div className="builder-section">
          <div className="builder-layout">
            {/* Sidebar - Data Sources */}
            <div className="builder-sidebar">
              <div className="sidebar-section">
                <h3>Data Sources</h3>
                <div className="data-source-list">
                  {DATA_SOURCES.map(source => (
                    <button
                      key={source.id}
                      className={`data-source-item ${selectedDataSources.includes(source.id) ? 'selected' : ''}`}
                      onClick={() => toggleDataSource(source.id)}
                    >
                      <div className="source-icon">{source.icon}</div>
                      <div className="source-info">
                        <span className="source-name">{source.name}</span>
                        <span className="source-count">{formatNumber(source.recordCount)}</span>
                      </div>
                      {selectedDataSources.includes(source.id) && (
                        <CheckCircle size={16} className="check" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sidebar-section">
                <h3>Widgets</h3>
                <div className="widget-list">
                  {REPORT_WIDGETS.map(widget => (
                    <button
                      key={widget.id}
                      className={`widget-item ${selectedWidgets.includes(widget.id) ? 'selected' : ''}`}
                      onClick={() => toggleWidget(widget.id)}
                      draggable
                    >
                      <GripVertical size={14} className="drag-handle" />
                      <div className="widget-icon">{widget.icon}</div>
                      <div className="widget-info">
                        <span className="widget-name">{widget.name}</span>
                        <span className="widget-desc">{widget.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="builder-canvas">
              <div className="canvas-header">
                <input 
                  type="text" 
                  className="report-title-input"
                  placeholder="Untitled Report"
                />
                <div className="canvas-actions">
                  <button className="btn-outline small">
                    <Eye size={16} />
                    Preview
                  </button>
                  <button className="btn-primary small">
                    <Download size={16} />
                    Save
                  </button>
                </div>
              </div>
              <div className="canvas-body">
                {selectedWidgets.length === 0 ? (
                  <div className="canvas-empty">
                    <Layers size={48} />
                    <h3>Start Building Your Report</h3>
                    <p>Select data sources and drag widgets to the canvas</p>
                  </div>
                ) : (
                  <div className="canvas-grid">
                    {selectedWidgets.map(widgetId => {
                      const widget = REPORT_WIDGETS.find(w => w.id === widgetId);
                      if (!widget) return null;
                      return (
                        <div key={widgetId} className="canvas-widget">
                          <div className="widget-header">
                            {widget.icon}
                            <span>{widget.name}</span>
                            <button className="remove-btn" onClick={() => toggleWidget(widgetId)}>
                              <X size={14} />
                            </button>
                          </div>
                          <div className="widget-placeholder">
                            <span>Configure {widget.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Settings Panel */}
            <div className="builder-settings">
              <div className="settings-section">
                <h3>Report Settings</h3>
                <div className="setting-item">
                  <label>Date Range</label>
                  <select>
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Refresh Rate</label>
                  <select>
                    <option>Manual</option>
                    <option>Every Hour</option>
                    <option>Daily</option>
                    <option>Weekly</option>
                  </select>
                </div>
              </div>
              <div className="settings-section">
                <h3>Sharing</h3>
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <Share2 size={18} />
                    <span>Share with Team</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-setting">
                  <div className="toggle-info">
                    <Mail size={18} />
                    <span>Email Report</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Report Modal */}
      {showNewReportModal && (
        <div className="modal-overlay" onClick={() => setShowNewReportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-icon">
                  <Plus size={24} />
                </div>
                <h2>Create New Report</h2>
              </div>
              <button className="close-btn" onClick={() => setShowNewReportModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Report Name</label>
                <input type="text" placeholder="My Custom Report" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="What does this report show?" rows={3}></textarea>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select>
                  <option>Performance</option>
                  <option>Users</option>
                  <option>API</option>
                  <option>Security</option>
                  <option>System</option>
                  <option>Custom</option>
                </select>
              </div>
              <div className="template-section">
                <label>Start from Template</label>
                <div className="template-grid">
                  <button className="template-card">
                    <BarChart3 size={24} />
                    <span>Blank Report</span>
                  </button>
                  <button className="template-card">
                    <TrendingUp size={24} />
                    <span>Performance</span>
                  </button>
                  <button className="template-card">
                    <Users size={24} />
                    <span>User Activity</span>
                  </button>
                  <button className="template-card">
                    <Shield size={24} />
                    <span>Security</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowNewReportModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={() => { setShowNewReportModal(false); setActiveTab('builder'); }}>
                <Plus size={18} />
                Create Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
