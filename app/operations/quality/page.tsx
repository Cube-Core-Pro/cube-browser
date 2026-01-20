'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck,
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
  ClipboardCheck,
  FileText,
  AlertCircle,
  Target,
  Award,
  Zap,
  Activity,
  Users,
  Settings,
  ChevronRight,
  ChevronDown,
  Gauge,
  ThumbsUp,
  ThumbsDown,
  Flag,
  RefreshCw,
  Camera,
  FileCheck,
  BookOpen,
  Microscope,
  Scale,
  Ruler,
  Beaker,
  TestTube
} from 'lucide-react';
import './quality.css';

interface Inspection {
  id: string;
  inspectionNumber: string;
  type: 'incoming' | 'in-process' | 'final' | 'audit';
  product: string;
  batch: string;
  status: 'pending' | 'in-progress' | 'passed' | 'failed' | 'on-hold';
  inspector: string;
  inspectorAvatar: string;
  scheduledDate: string;
  completedDate: string | null;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  defectsFound: number;
  severity: 'critical' | 'major' | 'minor' | 'none';
  notes: string;
}

interface QualityMetrics {
  totalInspections: number;
  passRate: number;
  defectRate: number;
  pendingInspections: number;
  criticalIssues: number;
  avgInspectionTime: number;
}

interface DefectCategory {
  name: string;
  count: number;
  trend: number;
  severity: 'critical' | 'major' | 'minor';
}

interface QualityTrend {
  period: string;
  passRate: number;
  defectRate: number;
  inspections: number;
}

interface NCR {
  id: string;
  ncrNumber: string;
  title: string;
  product: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'open' | 'investigating' | 'corrective-action' | 'closed';
  assignee: string;
  dueDate: string;
  daysOpen: number;
}

interface Standard {
  name: string;
  code: string;
  status: 'compliant' | 'non-compliant' | 'pending-audit';
  lastAudit: string;
  nextAudit: string;
}

export default function QualityManagementPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('inspections');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null);

  const metrics: QualityMetrics = {
    totalInspections: 1284,
    passRate: 94.7,
    defectRate: 2.3,
    pendingInspections: 45,
    criticalIssues: 8,
    avgInspectionTime: 42
  };

  const inspections: Inspection[] = [
    {
      id: '1',
      inspectionNumber: 'INS-2024-0892',
      type: 'incoming',
      product: 'Aluminum Sheets 6061-T6',
      batch: 'BAT-2024-1234',
      status: 'passed',
      inspector: 'John Smith',
      inspectorAvatar: 'JS',
      scheduledDate: '2024-02-20',
      completedDate: '2024-02-20',
      totalChecks: 15,
      passedChecks: 15,
      failedChecks: 0,
      defectsFound: 0,
      severity: 'none',
      notes: 'All specifications met. Material quality excellent.'
    },
    {
      id: '2',
      inspectionNumber: 'INS-2024-0893',
      type: 'in-process',
      product: 'Precision Gears Assembly',
      batch: 'BAT-2024-1235',
      status: 'in-progress',
      inspector: 'Sarah Chen',
      inspectorAvatar: 'SC',
      scheduledDate: '2024-02-21',
      completedDate: null,
      totalChecks: 25,
      passedChecks: 18,
      failedChecks: 2,
      defectsFound: 2,
      severity: 'minor',
      notes: 'Minor dimensional variance detected on 2 units.'
    },
    {
      id: '3',
      inspectionNumber: 'INS-2024-0894',
      type: 'final',
      product: 'Electric Motor Unit',
      batch: 'BAT-2024-1236',
      status: 'failed',
      inspector: 'Mike Wilson',
      inspectorAvatar: 'MW',
      scheduledDate: '2024-02-21',
      completedDate: '2024-02-21',
      totalChecks: 30,
      passedChecks: 26,
      failedChecks: 4,
      defectsFound: 4,
      severity: 'major',
      notes: 'Performance tests failed. Requires rework.'
    },
    {
      id: '4',
      inspectionNumber: 'INS-2024-0895',
      type: 'audit',
      product: 'Production Line A',
      batch: 'N/A',
      status: 'pending',
      inspector: 'Emily Davis',
      inspectorAvatar: 'ED',
      scheduledDate: '2024-02-22',
      completedDate: null,
      totalChecks: 50,
      passedChecks: 0,
      failedChecks: 0,
      defectsFound: 0,
      severity: 'none',
      notes: 'Scheduled quality audit for production line.'
    },
    {
      id: '5',
      inspectionNumber: 'INS-2024-0896',
      type: 'incoming',
      product: 'Electronic Components Kit',
      batch: 'BAT-2024-1237',
      status: 'on-hold',
      inspector: 'Robert Lee',
      inspectorAvatar: 'RL',
      scheduledDate: '2024-02-21',
      completedDate: null,
      totalChecks: 20,
      passedChecks: 12,
      failedChecks: 3,
      defectsFound: 3,
      severity: 'critical',
      notes: 'Critical defects found. Awaiting supplier response.'
    }
  ];

  const defectCategories: DefectCategory[] = [
    { name: 'Dimensional', count: 45, trend: -12.5, severity: 'minor' },
    { name: 'Surface Finish', count: 32, trend: 8.3, severity: 'minor' },
    { name: 'Functionality', count: 18, trend: -5.2, severity: 'major' },
    { name: 'Material', count: 12, trend: 15.4, severity: 'critical' },
    { name: 'Assembly', count: 28, trend: -3.8, severity: 'minor' },
    { name: 'Documentation', count: 8, trend: -22.1, severity: 'minor' }
  ];

  const qualityTrends: QualityTrend[] = [
    { period: 'Jan', passRate: 92.5, defectRate: 3.2, inspections: 98 },
    { period: 'Feb', passRate: 93.8, defectRate: 2.8, inspections: 112 },
    { period: 'Mar', passRate: 94.2, defectRate: 2.5, inspections: 105 },
    { period: 'Apr', passRate: 93.9, defectRate: 2.7, inspections: 118 },
    { period: 'May', passRate: 95.1, defectRate: 2.1, inspections: 125 },
    { period: 'Jun', passRate: 94.7, defectRate: 2.3, inspections: 108 }
  ];

  const ncrs: NCR[] = [
    { id: '1', ncrNumber: 'NCR-2024-0045', title: 'Out of Spec Motor Bearings', product: 'Electric Motor Unit', severity: 'critical', status: 'investigating', assignee: 'Quality Team', dueDate: '2024-02-25', daysOpen: 5 },
    { id: '2', ncrNumber: 'NCR-2024-0044', title: 'Surface Coating Defects', product: 'Precision Gears', severity: 'major', status: 'corrective-action', assignee: 'Production Team', dueDate: '2024-02-28', daysOpen: 8 },
    { id: '3', ncrNumber: 'NCR-2024-0043', title: 'Missing Documentation', product: 'Various', severity: 'minor', status: 'open', assignee: 'Admin Team', dueDate: '2024-03-01', daysOpen: 3 }
  ];

  const standards: Standard[] = [
    { name: 'ISO 9001:2015', code: 'ISO-9001', status: 'compliant', lastAudit: '2024-01-15', nextAudit: '2025-01-15' },
    { name: 'ISO 14001:2015', code: 'ISO-14001', status: 'compliant', lastAudit: '2024-01-15', nextAudit: '2025-01-15' },
    { name: 'AS9100D', code: 'AS-9100', status: 'pending-audit', lastAudit: '2023-06-20', nextAudit: '2024-03-01' },
    { name: 'IATF 16949', code: 'IATF-16949', status: 'compliant', lastAudit: '2023-11-10', nextAudit: '2024-11-10' }
  ];

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'pending': 'status-pending',
      'in-progress': 'status-progress',
      'passed': 'status-passed',
      'failed': 'status-failed',
      'on-hold': 'status-hold',
      'open': 'status-open',
      'investigating': 'status-investigating',
      'corrective-action': 'status-action',
      'closed': 'status-closed',
      'compliant': 'status-compliant',
      'non-compliant': 'status-noncompliant',
      'pending-audit': 'status-pending-audit'
    };
    return colors[status] || '';
  };

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      'critical': 'severity-critical',
      'major': 'severity-major',
      'minor': 'severity-minor',
      'none': 'severity-none'
    };
    return colors[severity] || '';
  };

  const getTypeIcon = (type: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'incoming': <Truck size={16} />,
      'in-process': <Settings size={16} />,
      'final': <CheckCircle size={16} />,
      'audit': <ClipboardCheck size={16} />
    };
    return icons[type] || <FileCheck size={16} />;
  };

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inspection.inspectionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || inspection.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || inspection.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const maxPassRate = Math.max(...qualityTrends.map(t => t.passRate));

  return (
    <div className="quality-container">
      <div className="quality-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1>Quality Management</h1>
              <p>Inspections, compliance tracking and quality control</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-secondary">
              <FileText size={18} />
              Reports
            </button>
            <button className="btn-secondary">
              <Download size={18} />
              Export
            </button>
            <button className="btn-primary">
              <Plus size={18} />
              New Inspection
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <ClipboardCheck size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Inspections</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.totalInspections.toLocaleString()}</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  12.5%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card highlight">
            <div className="stat-icon success">
              <ThumbsUp size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Pass Rate</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.passRate}%</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  2.3%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon warning">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Defect Rate</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.defectRate}%</span>
                <span className="stat-change down-good">
                  <TrendingDown size={14} />
                  0.8%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Pending Inspections</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.pendingInspections}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card alert">
            <div className="stat-icon danger">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Critical Issues</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.criticalIssues}</span>
                <span className="stat-badge danger">Requires attention</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Gauge size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Avg. Inspection Time</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.avgInspectionTime}m</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs */}
      <div className="main-tabs">
        <button 
          className={`tab-btn ${activeTab === 'inspections' ? 'active' : ''}`}
          onClick={() => setActiveTab('inspections')}
        >
          <ClipboardCheck size={18} />
          Inspections
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ncr' ? 'active' : ''}`}
          onClick={() => setActiveTab('ncr')}
        >
          <Flag size={18} />
          NCRs
        </button>
        <button 
          className={`tab-btn ${activeTab === 'standards' ? 'active' : ''}`}
          onClick={() => setActiveTab('standards')}
        >
          <Award size={18} />
          Standards
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} />
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'inspections' && (
        <div className="main-content">
          <div className="content-left">
            {/* Filters */}
            <div className="filters-bar">
              <div className="search-box">
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Search inspections..."
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
                  <option value="incoming">Incoming</option>
                  <option value="in-process">In-Process</option>
                  <option value="final">Final</option>
                  <option value="audit">Audit</option>
                </select>
              </div>
              
              <div className="filter-group">
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="on-hold">On Hold</option>
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

            {/* Inspections List */}
            <div className="inspections-list">
              {filteredInspections.map((inspection) => (
                <div key={inspection.id} className={`inspection-item ${inspection.status}`}>
                  <div 
                    className="inspection-main"
                    onClick={() => setExpandedInspection(expandedInspection === inspection.id ? null : inspection.id)}
                  >
                    <div className="inspection-type">
                      <div className={`type-icon type-${inspection.type}`}>
                        {getTypeIcon(inspection.type)}
                      </div>
                    </div>
                    
                    <div className="inspection-info">
                      <div className="inspection-header">
                        <span className="inspection-number">{inspection.inspectionNumber}</span>
                        <span className={`status-badge ${getStatusColor(inspection.status)}`}>
                          {inspection.status.replace('-', ' ')}
                        </span>
                        {inspection.severity !== 'none' && (
                          <span className={`severity-badge ${getSeverityColor(inspection.severity)}`}>
                            {inspection.severity}
                          </span>
                        )}
                      </div>
                      <h3>{inspection.product}</h3>
                      <div className="inspection-meta">
                        <span className="batch">
                          <Tag size={14} />
                          {inspection.batch}
                        </span>
                        <span className="type-label">{inspection.type}</span>
                        <span className="date">
                          <Calendar size={14} />
                          {inspection.scheduledDate}
                        </span>
                      </div>
                    </div>
                    
                    <div className="inspection-progress">
                      <div className="progress-header">
                        <span>Checks</span>
                        <span>{inspection.passedChecks}/{inspection.totalChecks}</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill passed"
                          style={{ width: `${(inspection.passedChecks / inspection.totalChecks) * 100}%` }}
                        />
                        {inspection.failedChecks > 0 && (
                          <div 
                            className="progress-fill failed"
                            style={{ width: `${(inspection.failedChecks / inspection.totalChecks) * 100}%` }}
                          />
                        )}
                      </div>
                      {inspection.defectsFound > 0 && (
                        <span className="defects-found">{inspection.defectsFound} defects found</span>
                      )}
                    </div>
                    
                    <div className="inspection-inspector">
                      <div className="inspector-avatar">{inspection.inspectorAvatar}</div>
                      <span>{inspection.inspector}</span>
                    </div>
                    
                    <div className="inspection-actions">
                      <button className="action-btn" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn expand-btn">
                        {expandedInspection === inspection.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  {expandedInspection === inspection.id && (
                    <div className="inspection-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h4>Results Summary</h4>
                          <div className="results-grid">
                            <div className="result-item passed">
                              <CheckCircle size={16} />
                              <span className="result-value">{inspection.passedChecks}</span>
                              <span className="result-label">Passed</span>
                            </div>
                            <div className="result-item failed">
                              <XCircle size={16} />
                              <span className="result-value">{inspection.failedChecks}</span>
                              <span className="result-label">Failed</span>
                            </div>
                            <div className="result-item defects">
                              <AlertTriangle size={16} />
                              <span className="result-value">{inspection.defectsFound}</span>
                              <span className="result-label">Defects</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>Notes</h4>
                          <p className="notes-text">{inspection.notes}</p>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>Quick Actions</h4>
                          <div className="quick-actions">
                            <button className="quick-btn">
                              <Camera size={14} />
                              Add Photos
                            </button>
                            <button className="quick-btn">
                              <FileText size={14} />
                              View Report
                            </button>
                            <button className="quick-btn">
                              <Flag size={14} />
                              Create NCR
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
              <h3>Defect Categories</h3>
              <div className="defects-list">
                {defectCategories.map((defect, index) => (
                  <div key={index} className={`defect-item ${defect.severity}`}>
                    <div className="defect-info">
                      <span className="defect-name">{defect.name}</span>
                      <div className="defect-meta">
                        <span className="defect-count">{defect.count} issues</span>
                        <span className={`defect-trend ${defect.trend <= 0 ? 'good' : 'bad'}`}>
                          {defect.trend <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                          {Math.abs(defect.trend)}%
                        </span>
                      </div>
                    </div>
                    <span className={`severity-dot ${defect.severity}`}></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <h3>Quality Trend</h3>
              <div className="trend-chart">
                {qualityTrends.map((trend, index) => (
                  <div key={index} className="trend-bar">
                    <div 
                      className="bar-fill"
                      style={{ height: `${(trend.passRate / maxPassRate) * 100}%` }}
                    >
                      <span className="bar-tooltip">{trend.passRate}%</span>
                    </div>
                    <span className="bar-label">{trend.period}</span>
                  </div>
                ))}
              </div>
              <div className="trend-legend">
                <span className="legend-item">
                  <span className="legend-dot"></span>
                  Pass Rate
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ncr' && (
        <div className="ncr-content">
          <div className="ncr-header">
            <h2>Non-Conformance Reports</h2>
            <button className="btn-primary">
              <Plus size={18} />
              New NCR
            </button>
          </div>
          <div className="ncr-list">
            {ncrs.map((ncr) => (
              <div key={ncr.id} className={`ncr-item ${ncr.severity}`}>
                <div className="ncr-priority">
                  <Flag size={16} />
                </div>
                <div className="ncr-info">
                  <div className="ncr-header-row">
                    <span className="ncr-number">{ncr.ncrNumber}</span>
                    <span className={`status-badge ${getStatusColor(ncr.status)}`}>
                      {ncr.status.replace('-', ' ')}
                    </span>
                    <span className={`severity-badge ${getSeverityColor(ncr.severity)}`}>
                      {ncr.severity}
                    </span>
                  </div>
                  <h3>{ncr.title}</h3>
                  <div className="ncr-meta">
                    <span className="ncr-product">{ncr.product}</span>
                    <span className="ncr-assignee">
                      <Users size={14} />
                      {ncr.assignee}
                    </span>
                    <span className="ncr-due">
                      <Calendar size={14} />
                      Due: {ncr.dueDate}
                    </span>
                    <span className="ncr-days">{ncr.daysOpen} days open</span>
                  </div>
                </div>
                <div className="ncr-actions">
                  <button className="action-btn"><Eye size={16} /></button>
                  <button className="action-btn"><Edit size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'standards' && (
        <div className="standards-content">
          <div className="standards-header">
            <h2>Quality Standards & Certifications</h2>
            <button className="btn-secondary">
              <Plus size={18} />
              Add Standard
            </button>
          </div>
          <div className="standards-grid">
            {standards.map((standard, index) => (
              <div key={index} className={`standard-card ${standard.status}`}>
                <div className="standard-icon">
                  <Award size={24} />
                </div>
                <div className="standard-info">
                  <h3>{standard.name}</h3>
                  <span className="standard-code">{standard.code}</span>
                </div>
                <span className={`standard-status ${getStatusColor(standard.status)}`}>
                  {standard.status.replace('-', ' ')}
                </span>
                <div className="standard-dates">
                  <div className="date-row">
                    <span>Last Audit:</span>
                    <span>{standard.lastAudit}</span>
                  </div>
                  <div className="date-row">
                    <span>Next Audit:</span>
                    <span>{standard.nextAudit}</span>
                  </div>
                </div>
                <button className="view-details-btn">
                  View Details
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="analytics-content">
          <div className="analytics-header">
            <h2>Quality Analytics</h2>
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
              <h3>Pass Rate Trend</h3>
              <div className="line-chart">
                <div className="chart-grid">
                  {qualityTrends.map((trend, index) => (
                    <div key={index} className="chart-point">
                      <div 
                        className="point-marker"
                        style={{ bottom: `${(trend.passRate - 90) * 10}%` }}
                      >
                        <span className="point-value">{trend.passRate}%</span>
                      </div>
                      <span className="point-label">{trend.period}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="analytics-card">
              <h3>Inspection Distribution</h3>
              <div className="distribution-chart">
                <div className="dist-item">
                  <span className="dist-label">Incoming</span>
                  <div className="dist-bar">
                    <div className="dist-fill" style={{ width: '35%' }}></div>
                  </div>
                  <span className="dist-value">35%</span>
                </div>
                <div className="dist-item">
                  <span className="dist-label">In-Process</span>
                  <div className="dist-bar">
                    <div className="dist-fill" style={{ width: '28%' }}></div>
                  </div>
                  <span className="dist-value">28%</span>
                </div>
                <div className="dist-item">
                  <span className="dist-label">Final</span>
                  <div className="dist-bar">
                    <div className="dist-fill" style={{ width: '25%' }}></div>
                  </div>
                  <span className="dist-value">25%</span>
                </div>
                <div className="dist-item">
                  <span className="dist-label">Audit</span>
                  <div className="dist-bar">
                    <div className="dist-fill" style={{ width: '12%' }}></div>
                  </div>
                  <span className="dist-value">12%</span>
                </div>
              </div>
            </div>
            
            <div className="analytics-card">
              <h3>Top Defect Sources</h3>
              <div className="sources-list">
                <div className="source-item">
                  <span className="source-rank">1</span>
                  <span className="source-name">Supplier A - Raw Materials</span>
                  <span className="source-count">23 defects</span>
                </div>
                <div className="source-item">
                  <span className="source-rank">2</span>
                  <span className="source-name">Production Line B</span>
                  <span className="source-count">18 defects</span>
                </div>
                <div className="source-item">
                  <span className="source-rank">3</span>
                  <span className="source-name">Assembly Station 3</span>
                  <span className="source-count">12 defects</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Truck(props: { size: number }): React.JSX.Element {
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
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
      <path d="M15 18H9"/>
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
      <circle cx="17" cy="18" r="2"/>
      <circle cx="7" cy="18" r="2"/>
    </svg>
  );
}

function Tag(props: { size: number }): React.JSX.Element {
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
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>
    </svg>
  );
}
