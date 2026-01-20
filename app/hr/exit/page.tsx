'use client';

import React, { useState } from 'react';
import {
  UserMinus,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Building2,
  Briefcase,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Download,
  Upload,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  ClipboardList,
  Package,
  Key,
  CreditCard,
  Shield,
  Award,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Settings,
  RefreshCw,
  Send,
  Printer,
  FileCheck,
  AlertCircle,
  UserCheck,
  LogOut,
  Gift,
  Heart,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import './exit.css';

interface ExitCase {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  manager: string;
  exitType: 'resignation' | 'termination' | 'retirement' | 'layoff' | 'end-of-contract';
  status: 'initiated' | 'in-progress' | 'pending-clearance' | 'completed' | 'cancelled';
  resignationDate: string;
  lastWorkingDay: string;
  noticePeriod: number;
  reason: string;
  rehireEligible: boolean;
  exitInterviewScheduled: boolean;
  exitInterviewCompleted: boolean;
  clearanceProgress: number;
}

interface ClearanceItem {
  id: string;
  category: string;
  item: string;
  department: string;
  responsible: string;
  status: 'pending' | 'in-progress' | 'completed' | 'not-applicable';
  dueDate: string;
  notes: string;
}

interface ExitInterviewResponse {
  question: string;
  rating: number;
  category: string;
}

interface ExitMetrics {
  totalExitsThisMonth: number;
  voluntary: number;
  involuntary: number;
  avgTenure: number;
  rehireRate: number;
  exitInterviewRate: number;
}

type TabType = 'overview' | 'cases' | 'clearance' | 'interviews' | 'analytics' | 'offboarding';

const exitCases: ExitCase[] = [
  {
    id: 'EXIT-001',
    employeeId: 'EMP-1234',
    employeeName: 'Michael Rodriguez',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    manager: 'Sarah Chen',
    exitType: 'resignation',
    status: 'in-progress',
    resignationDate: '2025-01-15',
    lastWorkingDay: '2025-02-15',
    noticePeriod: 30,
    reason: 'Career Advancement',
    rehireEligible: true,
    exitInterviewScheduled: true,
    exitInterviewCompleted: false,
    clearanceProgress: 45
  },
  {
    id: 'EXIT-002',
    employeeId: 'EMP-2345',
    employeeName: 'Jennifer Walsh',
    department: 'Marketing',
    position: 'Marketing Manager',
    manager: 'David Miller',
    exitType: 'resignation',
    status: 'pending-clearance',
    resignationDate: '2025-01-10',
    lastWorkingDay: '2025-02-10',
    noticePeriod: 30,
    reason: 'Relocation',
    rehireEligible: true,
    exitInterviewScheduled: true,
    exitInterviewCompleted: true,
    clearanceProgress: 78
  },
  {
    id: 'EXIT-003',
    employeeId: 'EMP-3456',
    employeeName: 'Robert Kim',
    department: 'Sales',
    position: 'Account Executive',
    manager: 'Lisa Johnson',
    exitType: 'termination',
    status: 'completed',
    resignationDate: '2025-01-05',
    lastWorkingDay: '2025-01-05',
    noticePeriod: 0,
    reason: 'Performance Issues',
    rehireEligible: false,
    exitInterviewScheduled: false,
    exitInterviewCompleted: false,
    clearanceProgress: 100
  },
  {
    id: 'EXIT-004',
    employeeId: 'EMP-4567',
    employeeName: 'Patricia Anderson',
    department: 'Finance',
    position: 'Financial Analyst',
    manager: 'James Wilson',
    exitType: 'retirement',
    status: 'in-progress',
    resignationDate: '2024-12-01',
    lastWorkingDay: '2025-02-28',
    noticePeriod: 90,
    reason: 'Retirement',
    rehireEligible: true,
    exitInterviewScheduled: true,
    exitInterviewCompleted: false,
    clearanceProgress: 30
  },
  {
    id: 'EXIT-005',
    employeeId: 'EMP-5678',
    employeeName: 'Christopher Lee',
    department: 'Operations',
    position: 'Operations Coordinator',
    manager: 'Emily Davis',
    exitType: 'end-of-contract',
    status: 'initiated',
    resignationDate: '2025-01-28',
    lastWorkingDay: '2025-02-28',
    noticePeriod: 30,
    reason: 'Contract End',
    rehireEligible: true,
    exitInterviewScheduled: false,
    exitInterviewCompleted: false,
    clearanceProgress: 0
  },
  {
    id: 'EXIT-006',
    employeeId: 'EMP-6789',
    employeeName: 'Amanda Thompson',
    department: 'HR',
    position: 'HR Specialist',
    manager: 'Robert Taylor',
    exitType: 'resignation',
    status: 'completed',
    resignationDate: '2025-01-02',
    lastWorkingDay: '2025-01-16',
    noticePeriod: 14,
    reason: 'Better Opportunity',
    rehireEligible: true,
    exitInterviewScheduled: true,
    exitInterviewCompleted: true,
    clearanceProgress: 100
  }
];

const clearanceItems: ClearanceItem[] = [
  { id: 'CLR-001', category: 'IT', item: 'Laptop Return', department: 'IT', responsible: 'IT Support', status: 'completed', dueDate: '2025-02-10', notes: 'MacBook Pro 14" returned' },
  { id: 'CLR-002', category: 'IT', item: 'Access Card Deactivation', department: 'Security', responsible: 'Security Team', status: 'pending', dueDate: '2025-02-15', notes: '' },
  { id: 'CLR-003', category: 'IT', item: 'Email Account Deactivation', department: 'IT', responsible: 'IT Admin', status: 'pending', dueDate: '2025-02-15', notes: '' },
  { id: 'CLR-004', category: 'IT', item: 'Software License Recovery', department: 'IT', responsible: 'IT Admin', status: 'in-progress', dueDate: '2025-02-12', notes: 'Adobe & MS Office licenses' },
  { id: 'CLR-005', category: 'Finance', item: 'Expense Report Settlement', department: 'Finance', responsible: 'Accounts Payable', status: 'completed', dueDate: '2025-02-08', notes: '$1,250 processed' },
  { id: 'CLR-006', category: 'Finance', item: 'Corporate Card Cancellation', department: 'Finance', responsible: 'Finance Team', status: 'pending', dueDate: '2025-02-15', notes: '' },
  { id: 'CLR-007', category: 'Finance', item: 'Final Paycheck Processing', department: 'Payroll', responsible: 'Payroll Team', status: 'pending', dueDate: '2025-02-15', notes: '' },
  { id: 'CLR-008', category: 'HR', item: 'Benefits Termination', department: 'HR', responsible: 'Benefits Admin', status: 'in-progress', dueDate: '2025-02-15', notes: 'COBRA info sent' },
  { id: 'CLR-009', category: 'HR', item: 'Exit Interview', department: 'HR', responsible: 'HR Manager', status: 'completed', dueDate: '2025-02-05', notes: 'Completed on 02/05' },
  { id: 'CLR-010', category: 'Department', item: 'Knowledge Transfer', department: 'Engineering', responsible: 'Manager', status: 'in-progress', dueDate: '2025-02-12', notes: 'Documentation 70% complete' },
  { id: 'CLR-011', category: 'Department', item: 'Project Handover', department: 'Engineering', responsible: 'Team Lead', status: 'pending', dueDate: '2025-02-14', notes: '' },
  { id: 'CLR-012', category: 'Facilities', item: 'Parking Pass Return', department: 'Facilities', responsible: 'Facilities Team', status: 'not-applicable', dueDate: '', notes: 'Remote employee' }
];

const exitInterviewData: ExitInterviewResponse[] = [
  { question: 'Overall job satisfaction', rating: 3.8, category: 'Satisfaction' },
  { question: 'Relationship with manager', rating: 4.2, category: 'Management' },
  { question: 'Career growth opportunities', rating: 2.9, category: 'Growth' },
  { question: 'Work-life balance', rating: 3.5, category: 'Balance' },
  { question: 'Compensation & benefits', rating: 3.1, category: 'Compensation' },
  { question: 'Company culture', rating: 4.0, category: 'Culture' },
  { question: 'Communication from leadership', rating: 3.4, category: 'Leadership' },
  { question: 'Would recommend as employer', rating: 3.6, category: 'Recommendation' }
];

const metrics: ExitMetrics = {
  totalExitsThisMonth: 12,
  voluntary: 9,
  involuntary: 3,
  avgTenure: 2.8,
  rehireRate: 75,
  exitInterviewRate: 89
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDaysRemaining = (dateString: string): number => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function ExitManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<ExitCase | null>(null);

  const getExitTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'resignation': 'info',
      'termination': 'danger',
      'retirement': 'warning',
      'layoff': 'danger',
      'end-of-contract': 'muted'
    };
    return <span className={`type-badge ${colors[type]}`}>{type.replace('-', ' ')}</span>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      'initiated': { color: 'info', icon: <Clock size={12} /> },
      'in-progress': { color: 'warning', icon: <RefreshCw size={12} /> },
      'pending-clearance': { color: 'orange', icon: <ClipboardList size={12} /> },
      'completed': { color: 'success', icon: <CheckCircle2 size={12} /> },
      'cancelled': { color: 'muted', icon: <XCircle size={12} /> }
    };
    const c = config[status] || { color: 'muted', icon: null };
    return (
      <span className={`status-badge ${c.color}`}>
        {c.icon}
        {status.replace('-', ' ')}
      </span>
    );
  };

  const getClearanceStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'warning',
      'in-progress': 'info',
      'completed': 'success',
      'not-applicable': 'muted'
    };
    return <span className={`clearance-badge ${colors[status]}`}>{status.replace('-', ' ')}</span>;
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="metrics-grid">
        <div className="metric-card highlight">
          <div className="metric-icon">
            <UserMinus size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-value">{metrics.totalExitsThisMonth}</span>
            <span className="metric-label">Exits This Month</span>
          </div>
          <div className="metric-breakdown">
            <span className="breakdown-item">
              <span className="dot voluntary" />
              {metrics.voluntary} Voluntary
            </span>
            <span className="breakdown-item">
              <span className="dot involuntary" />
              {metrics.involuntary} Involuntary
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon tenure">
            <Clock size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-value">{metrics.avgTenure} yrs</span>
            <span className="metric-label">Avg Tenure at Exit</span>
          </div>
          <div className="metric-trend down">
            <ArrowDownRight size={14} />
            <span>-0.3 yrs vs last quarter</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon rehire">
            <UserCheck size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-value">{metrics.rehireRate}%</span>
            <span className="metric-label">Rehire Eligible</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon interview">
            <MessageSquare size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-value">{metrics.exitInterviewRate}%</span>
            <span className="metric-label">Exit Interview Rate</span>
          </div>
          <div className="metric-trend up">
            <ArrowUpRight size={14} />
            <span>+5% vs last quarter</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3><AlertTriangle size={18} /> Active Exit Cases</h3>
            <button className="view-all-btn" onClick={() => setActiveTab('cases')}>
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="case-list">
            {exitCases
              .filter(c => c.status !== 'completed' && c.status !== 'cancelled')
              .slice(0, 4)
              .map(exitCase => {
                const daysRemaining = getDaysRemaining(exitCase.lastWorkingDay);
                return (
                  <div key={exitCase.id} className="case-item">
                    <div className="case-avatar">
                      {exitCase.employeeName.charAt(0)}
                    </div>
                    <div className="case-info">
                      <span className="case-name">{exitCase.employeeName}</span>
                      <span className="case-role">{exitCase.position} • {exitCase.department}</span>
                    </div>
                    <div className="case-meta">
                      <span className={`days-badge ${daysRemaining <= 7 ? 'urgent' : daysRemaining <= 14 ? 'soon' : ''}`}>
                        {daysRemaining > 0 ? `${daysRemaining}d left` : 'Today'}
                      </span>
                      {getStatusBadge(exitCase.status)}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3><ClipboardList size={18} /> Clearance Status</h3>
          </div>
          <div className="clearance-overview">
            <div className="clearance-chart">
              <div className="chart-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a24" strokeWidth="12" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray={`${45 * 2.51} 251`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="chart-center">
                  <span className="chart-value">45%</span>
                  <span className="chart-label">Complete</span>
                </div>
              </div>
            </div>
            <div className="clearance-stats">
              <div className="stat-row">
                <span className="stat-dot completed" />
                <span className="stat-label">Completed</span>
                <span className="stat-value">4</span>
              </div>
              <div className="stat-row">
                <span className="stat-dot in-progress" />
                <span className="stat-label">In Progress</span>
                <span className="stat-value">3</span>
              </div>
              <div className="stat-row">
                <span className="stat-dot pending" />
                <span className="stat-label">Pending</span>
                <span className="stat-value">4</span>
              </div>
              <div className="stat-row">
                <span className="stat-dot na" />
                <span className="stat-label">N/A</span>
                <span className="stat-value">1</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3><PieChart size={18} /> Exit Reasons</h3>
          </div>
          <div className="reasons-chart">
            {[
              { reason: 'Better Opportunity', count: 5, percentage: 42 },
              { reason: 'Career Growth', count: 3, percentage: 25 },
              { reason: 'Compensation', count: 2, percentage: 17 },
              { reason: 'Relocation', count: 1, percentage: 8 },
              { reason: 'Other', count: 1, percentage: 8 }
            ].map((item, index) => (
              <div key={item.reason} className="reason-row">
                <span className="reason-name">{item.reason}</span>
                <div className="reason-bar-container">
                  <div 
                    className="reason-bar"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="reason-percent">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3><Calendar size={18} /> Upcoming Last Days</h3>
          </div>
          <div className="upcoming-list">
            {exitCases
              .filter(c => c.status !== 'completed' && c.status !== 'cancelled')
              .sort((a, b) => new Date(a.lastWorkingDay).getTime() - new Date(b.lastWorkingDay).getTime())
              .slice(0, 4)
              .map(exitCase => (
                <div key={exitCase.id} className="upcoming-item">
                  <div className="upcoming-date">
                    <span className="date-day">{new Date(exitCase.lastWorkingDay).getDate()}</span>
                    <span className="date-month">
                      {new Date(exitCase.lastWorkingDay).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </div>
                  <div className="upcoming-info">
                    <span className="upcoming-name">{exitCase.employeeName}</span>
                    <span className="upcoming-dept">{exitCase.department}</span>
                  </div>
                  {getExitTypeBadge(exitCase.exitType)}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCases = () => (
    <div className="cases-content">
      <div className="content-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="resignation">Resignation</option>
            <option value="termination">Termination</option>
            <option value="retirement">Retirement</option>
            <option value="layoff">Layoff</option>
            <option value="end-of-contract">End of Contract</option>
          </select>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="initiated">Initiated</option>
            <option value="in-progress">In Progress</option>
            <option value="pending-clearance">Pending Clearance</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          New Exit Case
        </button>
      </div>

      <div className="cases-table">
        <div className="table-header">
          <span className="col-employee">Employee</span>
          <span className="col-department">Department</span>
          <span className="col-type">Exit Type</span>
          <span className="col-status">Status</span>
          <span className="col-lwd">Last Working Day</span>
          <span className="col-clearance">Clearance</span>
          <span className="col-actions">Actions</span>
        </div>
        {exitCases
          .filter(c =>
            (filterType === 'all' || c.exitType === filterType) &&
            (filterStatus === 'all' || c.status === filterStatus) &&
            (searchTerm === '' || 
              c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              c.id.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map(exitCase => (
            <div key={exitCase.id} className="table-row" onClick={() => setSelectedCase(exitCase)}>
              <div className="col-employee">
                <div className="employee-avatar">
                  {exitCase.employeeName.charAt(0)}
                </div>
                <div className="employee-info">
                  <span className="employee-name">{exitCase.employeeName}</span>
                  <span className="employee-id">{exitCase.employeeId} • {exitCase.position}</span>
                </div>
              </div>
              <span className="col-department">{exitCase.department}</span>
              <span className="col-type">{getExitTypeBadge(exitCase.exitType)}</span>
              <span className="col-status">{getStatusBadge(exitCase.status)}</span>
              <span className="col-lwd">
                <div className="lwd-info">
                  <span className="lwd-date">{formatDate(exitCase.lastWorkingDay)}</span>
                  <span className="lwd-days">
                    {getDaysRemaining(exitCase.lastWorkingDay) > 0 
                      ? `${getDaysRemaining(exitCase.lastWorkingDay)} days left`
                      : 'Completed'}
                  </span>
                </div>
              </span>
              <span className="col-clearance">
                <div className="clearance-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${exitCase.clearanceProgress >= 80 ? 'good' : exitCase.clearanceProgress >= 50 ? 'warning' : 'danger'}`}
                      style={{ width: `${exitCase.clearanceProgress}%` }}
                    />
                  </div>
                  <span className="progress-text">{exitCase.clearanceProgress}%</span>
                </div>
              </span>
              <span className="col-actions">
                <button className="action-btn"><Eye size={14} /></button>
                <button className="action-btn"><Edit size={14} /></button>
                <button className="action-btn"><MoreVertical size={14} /></button>
              </span>
            </div>
          ))}
      </div>
    </div>
  );

  const renderClearance = () => (
    <div className="clearance-content">
      <div className="clearance-header">
        <div className="employee-selector">
          <select className="filter-select large">
            <option value="EXIT-001">Michael Rodriguez - EXIT-001</option>
            <option value="EXIT-002">Jennifer Walsh - EXIT-002</option>
            <option value="EXIT-004">Patricia Anderson - EXIT-004</option>
            <option value="EXIT-005">Christopher Lee - EXIT-005</option>
          </select>
        </div>
        <div className="clearance-summary">
          <div className="summary-stat">
            <span className="stat-value">4</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">3</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">4</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <button className="btn-primary">
          <Printer size={16} />
          Print Checklist
        </button>
      </div>

      <div className="clearance-categories">
        {['IT', 'Finance', 'HR', 'Department', 'Facilities'].map(category => {
          const items = clearanceItems.filter(item => item.category === category);
          const completedCount = items.filter(i => i.status === 'completed').length;
          
          return (
            <div key={category} className="clearance-category">
              <div className="category-header">
                <div className="category-title">
                  {category === 'IT' && <Key size={18} />}
                  {category === 'Finance' && <DollarSign size={18} />}
                  {category === 'HR' && <Users size={18} />}
                  {category === 'Department' && <Briefcase size={18} />}
                  {category === 'Facilities' && <Building2 size={18} />}
                  <h4>{category}</h4>
                </div>
                <span className="category-progress">
                  {completedCount}/{items.length} completed
                </span>
              </div>
              <div className="category-items">
                {items.map(item => (
                  <div key={item.id} className={`clearance-item ${item.status}`}>
                    <div className="item-checkbox">
                      {item.status === 'completed' ? (
                        <CheckCircle2 size={18} className="checked" />
                      ) : item.status === 'not-applicable' ? (
                        <XCircle size={18} className="na" />
                      ) : (
                        <div className="checkbox" />
                      )}
                    </div>
                    <div className="item-content">
                      <span className="item-name">{item.item}</span>
                      <span className="item-responsible">{item.responsible}</span>
                    </div>
                    <div className="item-meta">
                      {item.dueDate && (
                        <span className="item-due">Due: {formatDate(item.dueDate)}</span>
                      )}
                      {getClearanceStatusBadge(item.status)}
                    </div>
                    {item.notes && (
                      <span className="item-notes">{item.notes}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderInterviews = () => (
    <div className="interviews-content">
      <div className="interview-stats">
        <div className="stat-card">
          <MessageSquare size={24} />
          <div className="stat-info">
            <span className="stat-value">89%</span>
            <span className="stat-label">Interview Completion Rate</span>
          </div>
        </div>
        <div className="stat-card">
          <Star size={24} />
          <div className="stat-info">
            <span className="stat-value">3.6</span>
            <span className="stat-label">Avg Overall Rating</span>
          </div>
        </div>
        <div className="stat-card">
          <ThumbsUp size={24} />
          <div className="stat-info">
            <span className="stat-value">72%</span>
            <span className="stat-label">Would Recommend</span>
          </div>
        </div>
        <div className="stat-card">
          <TrendingDown size={24} />
          <div className="stat-info">
            <span className="stat-value">2.9</span>
            <span className="stat-label">Lowest: Career Growth</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card wide">
          <div className="card-header">
            <h3><BarChart3 size={18} /> Exit Interview Scores</h3>
          </div>
          <div className="scores-chart">
            {exitInterviewData.map(item => (
              <div key={item.question} className="score-row">
                <span className="score-question">{item.question}</span>
                <div className="score-bar-container">
                  <div 
                    className={`score-bar ${item.rating >= 4 ? 'good' : item.rating >= 3 ? 'warning' : 'danger'}`}
                    style={{ width: `${(item.rating / 5) * 100}%` }}
                  />
                </div>
                <span className="score-value">{item.rating.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3><Calendar size={18} /> Scheduled Interviews</h3>
          </div>
          <div className="scheduled-list">
            {exitCases
              .filter(c => c.exitInterviewScheduled && !c.exitInterviewCompleted)
              .map(exitCase => (
                <div key={exitCase.id} className="scheduled-item">
                  <div className="scheduled-avatar">
                    {exitCase.employeeName.charAt(0)}
                  </div>
                  <div className="scheduled-info">
                    <span className="scheduled-name">{exitCase.employeeName}</span>
                    <span className="scheduled-dept">{exitCase.department}</span>
                  </div>
                  <button className="btn-outline small">
                    <MessageSquare size={14} />
                    Start
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3><FileCheck size={18} /> Recent Completions</h3>
          </div>
          <div className="completed-list">
            {exitCases
              .filter(c => c.exitInterviewCompleted)
              .map(exitCase => (
                <div key={exitCase.id} className="completed-item">
                  <div className="completed-avatar">
                    {exitCase.employeeName.charAt(0)}
                  </div>
                  <div className="completed-info">
                    <span className="completed-name">{exitCase.employeeName}</span>
                    <span className="completed-dept">{exitCase.department}</span>
                  </div>
                  <button className="btn-outline small">
                    <Eye size={14} />
                    View
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-content">
      <div className="analytics-grid">
        <div className="analytics-card wide">
          <div className="card-header">
            <h3><TrendingUp size={18} /> Monthly Exits Trend</h3>
          </div>
          <div className="trend-chart">
            {[
              { month: 'Jan', voluntary: 8, involuntary: 2 },
              { month: 'Feb', voluntary: 6, involuntary: 3 },
              { month: 'Mar', voluntary: 10, involuntary: 2 },
              { month: 'Apr', voluntary: 7, involuntary: 1 },
              { month: 'May', voluntary: 9, involuntary: 4 },
              { month: 'Jun', voluntary: 12, involuntary: 3 },
              { month: 'Jul', voluntary: 8, involuntary: 2 },
              { month: 'Aug', voluntary: 5, involuntary: 1 },
              { month: 'Sep', voluntary: 7, involuntary: 3 },
              { month: 'Oct', voluntary: 11, involuntary: 2 },
              { month: 'Nov', voluntary: 6, involuntary: 1 },
              { month: 'Dec', voluntary: 4, involuntary: 1 }
            ].map(data => (
              <div key={data.month} className="trend-bar-group">
                <div className="stacked-bars">
                  <div 
                    className="bar voluntary"
                    style={{ height: `${data.voluntary * 8}px` }}
                  />
                  <div 
                    className="bar involuntary"
                    style={{ height: `${data.involuntary * 8}px` }}
                  />
                </div>
                <span className="bar-label">{data.month}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot voluntary" />
              <span>Voluntary</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot involuntary" />
              <span>Involuntary</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><Building2 size={18} /> Exits by Department</h3>
          </div>
          <div className="dept-exits">
            {[
              { dept: 'Sales', count: 18, percentage: 28 },
              { dept: 'Engineering', count: 15, percentage: 23 },
              { dept: 'Customer Success', count: 12, percentage: 18 },
              { dept: 'Marketing', count: 8, percentage: 12 },
              { dept: 'Operations', count: 7, percentage: 11 },
              { dept: 'Other', count: 5, percentage: 8 }
            ].map(item => (
              <div key={item.dept} className="dept-row">
                <span className="dept-name">{item.dept}</span>
                <div className="dept-bar-container">
                  <div 
                    className="dept-bar"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="dept-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><Clock size={18} /> Tenure at Exit</h3>
          </div>
          <div className="tenure-dist">
            {[
              { range: '< 1 year', count: 22, percentage: 34 },
              { range: '1-2 years', count: 18, percentage: 28 },
              { range: '2-3 years', count: 12, percentage: 18 },
              { range: '3-5 years', count: 8, percentage: 12 },
              { range: '5+ years', count: 5, percentage: 8 }
            ].map(item => (
              <div key={item.range} className="tenure-row">
                <span className="tenure-range">{item.range}</span>
                <div className="tenure-bar-container">
                  <div 
                    className="tenure-bar"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="tenure-percent">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOffboarding = () => (
    <div className="offboarding-content">
      <div className="offboarding-timeline">
        <h3>Standard Offboarding Timeline</h3>
        <div className="timeline">
          {[
            { day: 'Day 1', title: 'Exit Initiated', tasks: ['HR notified', 'Manager informed', 'Exit case created'], icon: <FileText size={18} /> },
            { day: 'Week 1', title: 'Knowledge Transfer', tasks: ['Document processes', 'Train replacement', 'Handover projects'], icon: <Package size={18} /> },
            { day: 'Week 2', title: 'Clearance Process', tasks: ['Return equipment', 'Settle expenses', 'Access review'], icon: <ClipboardList size={18} /> },
            { day: 'Week 3', title: 'Exit Interview', tasks: ['Schedule interview', 'Complete survey', 'Feedback session'], icon: <MessageSquare size={18} /> },
            { day: 'Last Day', title: 'Final Steps', tasks: ['Final paycheck', 'Benefits info', 'Account deactivation'], icon: <LogOut size={18} /> },
            { day: 'Post-Exit', title: 'Alumni Relations', tasks: ['Alumni network invite', 'Reference setup', 'Stay connected'], icon: <Heart size={18} /> }
          ].map((step, index) => (
            <div key={step.day} className="timeline-step">
              <div className="step-marker">
                <div className="step-icon">{step.icon}</div>
                {index < 5 && <div className="step-line" />}
              </div>
              <div className="step-content">
                <span className="step-day">{step.day}</span>
                <h4 className="step-title">{step.title}</h4>
                <ul className="step-tasks">
                  {step.tasks.map(task => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="offboarding-resources">
        <h3>Resources & Templates</h3>
        <div className="resources-grid">
          {[
            { name: 'Resignation Letter Template', type: 'Document', icon: <FileText size={24} /> },
            { name: 'Exit Checklist', type: 'Checklist', icon: <ClipboardList size={24} /> },
            { name: 'Knowledge Transfer Template', type: 'Document', icon: <Package size={24} /> },
            { name: 'Exit Interview Questions', type: 'Survey', icon: <MessageSquare size={24} /> },
            { name: 'COBRA Information Guide', type: 'Guide', icon: <Shield size={24} /> },
            { name: 'Reference Request Form', type: 'Form', icon: <Award size={24} /> }
          ].map(resource => (
            <div key={resource.name} className="resource-card">
              <div className="resource-icon">{resource.icon}</div>
              <div className="resource-info">
                <span className="resource-name">{resource.name}</span>
                <span className="resource-type">{resource.type}</span>
              </div>
              <button className="btn-outline small">
                <Download size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'cases': return renderCases();
      case 'clearance': return renderClearance();
      case 'interviews': return renderInterviews();
      case 'analytics': return renderAnalytics();
      case 'offboarding': return renderOffboarding();
      default: return renderOverview();
    }
  };

  return (
    <div className="exit-page">
      <div className="exit__header">
        <div className="exit__title-section">
          <div className="exit__icon">
            <UserMinus size={28} />
          </div>
          <div>
            <h1>Exit Management</h1>
            <p>Manage employee offboarding, clearance, and exit interviews</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export Report
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Exit Case
          </button>
        </div>
      </div>

      <div className="exit__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'cases' ? 'active' : ''}`}
          onClick={() => setActiveTab('cases')}
        >
          <FileText size={16} />
          Exit Cases
        </button>
        <button 
          className={`tab-btn ${activeTab === 'clearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('clearance')}
        >
          <ClipboardList size={16} />
          Clearance
        </button>
        <button 
          className={`tab-btn ${activeTab === 'interviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('interviews')}
        >
          <MessageSquare size={16} />
          Interviews
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={16} />
          Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'offboarding' ? 'active' : ''}`}
          onClick={() => setActiveTab('offboarding')}
        >
          <LogOut size={16} />
          Offboarding
        </button>
      </div>

      <div className="exit__content">
        {renderContent()}
      </div>
    </div>
  );
}
