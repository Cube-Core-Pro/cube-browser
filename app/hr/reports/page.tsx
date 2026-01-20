'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter, 
  RefreshCw,
  FileText,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  Building2,
  UserCheck,
  UserMinus,
  GraduationCap,
  Heart,
  ChevronRight,
  Eye,
  Mail,
  Printer,
  Share2,
  Star,
  PieChart,
  LineChart,
  Table2,
  LayoutGrid,
  Play,
  Pause,
  Settings,
  Plus,
  MoreVertical,
  Check,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import './reports.css';

interface Report {
  id: string;
  name: string;
  category: string;
  description: string;
  lastRun: string;
  frequency: string;
  status: 'active' | 'paused' | 'error';
  type: 'table' | 'chart' | 'dashboard';
  starred: boolean;
  recipients: number;
}

interface ReportCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  color: string;
}

interface ScheduledReport {
  id: string;
  reportName: string;
  nextRun: string;
  frequency: string;
  recipients: string[];
  format: string;
}

interface RecentExport {
  id: string;
  reportName: string;
  exportedAt: string;
  format: string;
  size: string;
  downloadUrl: string;
}

const reportCategories: ReportCategory[] = [
  { id: 'headcount', name: 'Headcount & Demographics', icon: <Users size={20} />, count: 12, color: '#3b82f6' },
  { id: 'compensation', name: 'Compensation & Benefits', icon: <DollarSign size={20} />, count: 8, color: '#10b981' },
  { id: 'attendance', name: 'Time & Attendance', icon: <Clock size={20} />, count: 10, color: '#f59e0b' },
  { id: 'performance', name: 'Performance & Goals', icon: <TrendingUp size={20} />, count: 7, color: '#8b5cf6' },
  { id: 'recruitment', name: 'Recruitment & Hiring', icon: <UserCheck size={20} />, count: 9, color: '#ec4899' },
  { id: 'turnover', name: 'Turnover & Retention', icon: <UserMinus size={20} />, count: 6, color: '#f43f5e' },
  { id: 'learning', name: 'Learning & Development', icon: <GraduationCap size={20} />, count: 5, color: '#06b6d4' },
  { id: 'compliance', name: 'Compliance & Audit', icon: <FileText size={20} />, count: 8, color: '#14b8a6' },
];

const reports: Report[] = [
  {
    id: 'RPT001',
    name: 'Monthly Headcount Summary',
    category: 'headcount',
    description: 'Organization-wide headcount with department breakdown and trends',
    lastRun: '2024-01-28',
    frequency: 'Monthly',
    status: 'active',
    type: 'dashboard',
    starred: true,
    recipients: 12
  },
  {
    id: 'RPT002',
    name: 'Compensation Analysis',
    category: 'compensation',
    description: 'Salary bands, pay equity analysis, and compensation trends',
    lastRun: '2024-01-25',
    frequency: 'Quarterly',
    status: 'active',
    type: 'chart',
    starred: true,
    recipients: 5
  },
  {
    id: 'RPT003',
    name: 'Attendance & Leave Report',
    category: 'attendance',
    description: 'Employee attendance patterns, leave balances, and absenteeism',
    lastRun: '2024-01-28',
    frequency: 'Weekly',
    status: 'active',
    type: 'table',
    starred: false,
    recipients: 8
  },
  {
    id: 'RPT004',
    name: 'Performance Review Status',
    category: 'performance',
    description: 'Review completion rates and performance distribution',
    lastRun: '2024-01-20',
    frequency: 'Monthly',
    status: 'paused',
    type: 'dashboard',
    starred: false,
    recipients: 15
  },
  {
    id: 'RPT005',
    name: 'Recruitment Pipeline',
    category: 'recruitment',
    description: 'Open positions, candidate pipeline, and hiring metrics',
    lastRun: '2024-01-28',
    frequency: 'Daily',
    status: 'active',
    type: 'chart',
    starred: true,
    recipients: 6
  },
  {
    id: 'RPT006',
    name: 'Turnover Analysis',
    category: 'turnover',
    description: 'Voluntary and involuntary turnover rates by department',
    lastRun: '2024-01-15',
    frequency: 'Monthly',
    status: 'active',
    type: 'chart',
    starred: false,
    recipients: 10
  },
  {
    id: 'RPT007',
    name: 'Training Completion',
    category: 'learning',
    description: 'Course completion rates and learning hours by employee',
    lastRun: '2024-01-27',
    frequency: 'Weekly',
    status: 'error',
    type: 'table',
    starred: false,
    recipients: 4
  },
  {
    id: 'RPT008',
    name: 'Compliance Status',
    category: 'compliance',
    description: 'Policy compliance, certification status, and audit findings',
    lastRun: '2024-01-22',
    frequency: 'Monthly',
    status: 'active',
    type: 'dashboard',
    starred: true,
    recipients: 8
  },
];

const scheduledReports: ScheduledReport[] = [
  {
    id: 'SCH001',
    reportName: 'Monthly Headcount Summary',
    nextRun: '2024-02-01 08:00',
    frequency: 'Monthly',
    recipients: ['hr-leadership@company.com', 'executives@company.com'],
    format: 'PDF'
  },
  {
    id: 'SCH002',
    reportName: 'Recruitment Pipeline',
    nextRun: '2024-01-29 06:00',
    frequency: 'Daily',
    recipients: ['talent-team@company.com'],
    format: 'Excel'
  },
  {
    id: 'SCH003',
    reportName: 'Attendance & Leave Report',
    nextRun: '2024-01-29 07:00',
    frequency: 'Weekly',
    recipients: ['hr-ops@company.com', 'managers@company.com'],
    format: 'PDF'
  },
  {
    id: 'SCH004',
    reportName: 'Compliance Status',
    nextRun: '2024-02-01 09:00',
    frequency: 'Monthly',
    recipients: ['compliance@company.com', 'legal@company.com'],
    format: 'Excel'
  },
];

const recentExports: RecentExport[] = [
  {
    id: 'EXP001',
    reportName: 'Monthly Headcount Summary',
    exportedAt: '2024-01-28 14:32',
    format: 'PDF',
    size: '2.4 MB',
    downloadUrl: '#'
  },
  {
    id: 'EXP002',
    reportName: 'Recruitment Pipeline',
    exportedAt: '2024-01-28 11:15',
    format: 'Excel',
    size: '856 KB',
    downloadUrl: '#'
  },
  {
    id: 'EXP003',
    reportName: 'Compensation Analysis',
    exportedAt: '2024-01-27 16:45',
    format: 'PDF',
    size: '3.1 MB',
    downloadUrl: '#'
  },
  {
    id: 'EXP004',
    reportName: 'Turnover Analysis',
    exportedAt: '2024-01-26 09:20',
    format: 'Excel',
    size: '1.2 MB',
    downloadUrl: '#'
  },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'scheduled' | 'exports' | 'builder'>('library');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'active':
        return <span className="status-badge success"><Check size={10} /> Active</span>;
      case 'paused':
        return <span className="status-badge warning"><Pause size={10} /> Paused</span>;
      case 'error':
        return <span className="status-badge danger"><AlertCircle size={10} /> Error</span>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'table':
        return <Table2 size={14} />;
      case 'chart':
        return <LineChart size={14} />;
      case 'dashboard':
        return <PieChart size={14} />;
      default:
        return <FileText size={14} />;
    }
  };

  const renderLibraryContent = () => (
    <div className="library-content">
      {/* Categories Sidebar */}
      <aside className="categories-sidebar">
        <div className="sidebar-header">
          <h3>Categories</h3>
        </div>
        <div className="category-list">
          <button 
            className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <LayoutGrid size={18} />
            <span>All Reports</span>
            <span className="category-count">{reports.length}</span>
          </button>
          <button 
            className={`category-item ${selectedCategory === 'starred' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('starred')}
          >
            <Star size={18} />
            <span>Starred</span>
            <span className="category-count">{reports.filter(r => r.starred).length}</span>
          </button>
          <div className="category-divider" />
          {reportCategories.map(category => (
            <button 
              key={category.id}
              className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon" style={{ color: category.color }}>
                {category.icon}
              </span>
              <span>{category.name}</span>
              <span className="category-count">{category.count}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Reports Grid */}
      <div className="reports-main">
        <div className="reports-toolbar">
          <div className="search-filter-group">
            <div className="search-box">
              <Filter size={16} />
              <input 
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <Table2 size={16} />
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="reports-grid">
            {filteredReports.map(report => (
              <div key={report.id} className="report-card">
                <div className="report-card-header">
                  <div className="report-type">
                    {getTypeIcon(report.type)}
                    <span>{report.type}</span>
                  </div>
                  <div className="report-actions">
                    <button className={`star-btn ${report.starred ? 'starred' : ''}`}>
                      <Star size={14} />
                    </button>
                    <button className="more-btn">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
                <h4 className="report-title">{report.name}</h4>
                <p className="report-description">{report.description}</p>
                <div className="report-meta">
                  <span className="meta-item">
                    <Calendar size={12} />
                    {report.frequency}
                  </span>
                  <span className="meta-item">
                    <Clock size={12} />
                    Last: {report.lastRun}
                  </span>
                </div>
                <div className="report-footer">
                  {getStatusBadge(report.status)}
                  <div className="report-card-actions">
                    <button className="action-btn" title="View Report">
                      <Eye size={14} />
                    </button>
                    <button className="action-btn" title="Download">
                      <Download size={14} />
                    </button>
                    <button className="action-btn primary" title="Run Report">
                      <Play size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="reports-table">
            <div className="table-header">
              <span>Report Name</span>
              <span>Category</span>
              <span>Frequency</span>
              <span>Last Run</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {filteredReports.map(report => (
              <div key={report.id} className="table-row">
                <div className="col-name">
                  <button className={`star-btn small ${report.starred ? 'starred' : ''}`}>
                    <Star size={12} />
                  </button>
                  <div className="report-type-icon">
                    {getTypeIcon(report.type)}
                  </div>
                  <div className="name-info">
                    <span className="report-name">{report.name}</span>
                    <span className="report-desc">{report.description}</span>
                  </div>
                </div>
                <span className="col-category">{report.category}</span>
                <span className="col-frequency">{report.frequency}</span>
                <span className="col-lastrun">{report.lastRun}</span>
                <span className="col-status">{getStatusBadge(report.status)}</span>
                <div className="col-actions">
                  <button className="action-btn" title="View">
                    <Eye size={14} />
                  </button>
                  <button className="action-btn" title="Download">
                    <Download size={14} />
                  </button>
                  <button className="action-btn" title="Run">
                    <Play size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderScheduledContent = () => (
    <div className="scheduled-content">
      <div className="scheduled-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{scheduledReports.length}</span>
            <span className="stat-label">Scheduled Reports</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon daily">
            <RefreshCw size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">1</span>
            <span className="stat-label">Daily Reports</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon weekly">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">1</span>
            <span className="stat-label">Weekly Reports</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon monthly">
            <BarChart3 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">2</span>
            <span className="stat-label">Monthly Reports</span>
          </div>
        </div>
      </div>

      <div className="scheduled-table-container">
        <div className="table-header-section">
          <h3>Scheduled Reports</h3>
          <button className="btn-primary">
            <Plus size={16} />
            Add Schedule
          </button>
        </div>
        <div className="scheduled-table">
          <div className="table-header">
            <span>Report</span>
            <span>Frequency</span>
            <span>Next Run</span>
            <span>Recipients</span>
            <span>Format</span>
            <span>Actions</span>
          </div>
          {scheduledReports.map(schedule => (
            <div key={schedule.id} className="table-row">
              <span className="col-report">{schedule.reportName}</span>
              <span className="col-frequency">
                <span className={`freq-badge ${schedule.frequency.toLowerCase()}`}>
                  {schedule.frequency}
                </span>
              </span>
              <span className="col-nextrun">{schedule.nextRun}</span>
              <div className="col-recipients">
                {schedule.recipients.map((r, i) => (
                  <span key={i} className="recipient-badge">{r.split('@')[0]}</span>
                ))}
              </div>
              <span className="col-format">
                <span className={`format-badge ${schedule.format.toLowerCase()}`}>
                  {schedule.format}
                </span>
              </span>
              <div className="col-actions">
                <button className="action-btn" title="Edit">
                  <Settings size={14} />
                </button>
                <button className="action-btn" title="Run Now">
                  <Play size={14} />
                </button>
                <button className="action-btn" title="Pause">
                  <Pause size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExportsContent = () => (
    <div className="exports-content">
      <div className="exports-header">
        <h3>Recent Exports</h3>
        <div className="export-actions">
          <select className="filter-select">
            <option value="all">All Formats</option>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
          <select className="filter-select">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="exports-list">
        {recentExports.map(export_ => (
          <div key={export_.id} className="export-item">
            <div className="export-icon">
              <FileText size={24} />
            </div>
            <div className="export-info">
              <span className="export-name">{export_.reportName}</span>
              <span className="export-date">{export_.exportedAt}</span>
            </div>
            <span className={`format-badge ${export_.format.toLowerCase()}`}>
              {export_.format}
            </span>
            <span className="export-size">{export_.size}</span>
            <div className="export-actions">
              <button className="action-btn" title="Download">
                <Download size={14} />
              </button>
              <button className="action-btn" title="Email">
                <Mail size={14} />
              </button>
              <button className="action-btn" title="Share">
                <Share2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBuilderContent = () => (
    <div className="builder-content">
      <div className="builder-intro">
        <div className="intro-icon">
          <BarChart3 size={48} />
        </div>
        <h2>Report Builder</h2>
        <p>Create custom reports by selecting data sources, metrics, and visualizations</p>
        <button className="btn-primary large">
          <Plus size={18} />
          Create New Report
        </button>
      </div>

      <div className="builder-templates">
        <h3>Start from Template</h3>
        <div className="templates-grid">
          <div className="template-card">
            <div className="template-icon headcount">
              <Users size={24} />
            </div>
            <h4>Headcount Report</h4>
            <p>Track employee count across departments with trends</p>
            <button className="btn-outline small">
              Use Template <ArrowRight size={14} />
            </button>
          </div>
          <div className="template-card">
            <div className="template-icon compensation">
              <DollarSign size={24} />
            </div>
            <h4>Salary Analysis</h4>
            <p>Compare compensation across roles and departments</p>
            <button className="btn-outline small">
              Use Template <ArrowRight size={14} />
            </button>
          </div>
          <div className="template-card">
            <div className="template-icon turnover">
              <TrendingUp size={24} />
            </div>
            <h4>Turnover Report</h4>
            <p>Analyze attrition patterns and retention metrics</p>
            <button className="btn-outline small">
              Use Template <ArrowRight size={14} />
            </button>
          </div>
          <div className="template-card">
            <div className="template-icon performance">
              <Star size={24} />
            </div>
            <h4>Performance Summary</h4>
            <p>Review completion rates and score distribution</p>
            <button className="btn-outline small">
              Use Template <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="builder-features">
        <h3>Builder Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <PieChart size={20} />
            <span>Multiple Chart Types</span>
          </div>
          <div className="feature-card">
            <Filter size={20} />
            <span>Advanced Filters</span>
          </div>
          <div className="feature-card">
            <Calendar size={20} />
            <span>Date Range Selection</span>
          </div>
          <div className="feature-card">
            <Users size={20} />
            <span>Department Grouping</span>
          </div>
          <div className="feature-card">
            <Download size={20} />
            <span>Multiple Export Formats</span>
          </div>
          <div className="feature-card">
            <Mail size={20} />
            <span>Scheduled Delivery</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="reports-page">
      <header className="reports__header">
        <div className="reports__title-section">
          <div className="reports__icon">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1>HR Reports & Analytics</h1>
            <p>Generate, schedule, and analyze workforce reports</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh Data
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Report
          </button>
        </div>
      </header>

      <nav className="reports__tabs">
        <button 
          className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <FileText size={16} />
          Report Library
        </button>
        <button 
          className={`tab-btn ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          <Calendar size={16} />
          Scheduled Reports
        </button>
        <button 
          className={`tab-btn ${activeTab === 'exports' ? 'active' : ''}`}
          onClick={() => setActiveTab('exports')}
        >
          <Download size={16} />
          Exports
        </button>
        <button 
          className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          <Plus size={16} />
          Report Builder
        </button>
      </nav>

      <div className="reports__content">
        {activeTab === 'library' && renderLibraryContent()}
        {activeTab === 'scheduled' && renderScheduledContent()}
        {activeTab === 'exports' && renderExportsContent()}
        {activeTab === 'builder' && renderBuilderContent()}
      </div>
    </div>
  );
}
