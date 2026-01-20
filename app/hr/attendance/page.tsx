'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Users,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Search,
  Filter,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Edit3,
  Trash2,
  Eye,
  Download,
  Upload,
  Share2,
  RefreshCw,
  ArrowRight,
  MoreVertical,
  Play,
  Pause,
  StopCircle,
  Timer,
  Coffee,
  Briefcase,
  Home,
  MapPin,
  Plane,
  Heart,
  ClipboardList,
  FileText,
  Send,
  Check,
  X,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Settings,
  Bell,
  LogIn,
  LogOut
} from 'lucide-react';
import './attendance.css';

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  avatar?: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'remote';
  checkInTime?: string;
  checkOutTime?: string;
}

interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  breakTime: number;
  workHours: number;
  overtime: number;
  status: 'complete' | 'in_progress' | 'missing';
  type: 'office' | 'remote' | 'field';
  notes?: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'vacation' | 'sick' | 'personal' | 'parental' | 'bereavement';
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  submittedDate: string;
}

interface AttendanceMetrics {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeave: number;
  remoteWorking: number;
  avgWorkHours: number;
  attendanceRate: number;
  pendingRequests: number;
}

interface ShiftSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  employees: number;
  color: string;
}

const AttendancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timesheet' | 'leave' | 'schedule' | 'reports'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clockedIn, setClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [breakActive, setBreakActive] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [metrics] = useState<AttendanceMetrics>({
    totalEmployees: 156,
    presentToday: 128,
    absentToday: 8,
    lateToday: 5,
    onLeave: 12,
    remoteWorking: 23,
    avgWorkHours: 8.2,
    attendanceRate: 94.3,
    pendingRequests: 7
  });

  const [employees] = useState<Employee[]>([
    { id: 'EMP-001', name: 'Sarah Chen', department: 'Engineering', position: 'Senior Developer', status: 'present', checkInTime: '08:45', checkOutTime: undefined },
    { id: 'EMP-002', name: 'Michael Brown', department: 'Sales', position: 'Sales Manager', status: 'present', checkInTime: '09:00', checkOutTime: undefined },
    { id: 'EMP-003', name: 'Emily Johnson', department: 'HR', position: 'HR Manager', status: 'late', checkInTime: '09:32', checkOutTime: undefined },
    { id: 'EMP-004', name: 'David Park', department: 'Engineering', position: 'Tech Lead', status: 'remote', checkInTime: '08:30', checkOutTime: undefined },
    { id: 'EMP-005', name: 'Jennifer Lee', department: 'Marketing', position: 'Marketing Director', status: 'leave', checkInTime: undefined, checkOutTime: undefined },
    { id: 'EMP-006', name: 'Robert Wilson', department: 'Finance', position: 'Financial Analyst', status: 'present', checkInTime: '08:55', checkOutTime: undefined },
    { id: 'EMP-007', name: 'Maria Garcia', department: 'Operations', position: 'Operations Manager', status: 'present', checkInTime: '08:40', checkOutTime: undefined },
    { id: 'EMP-008', name: 'James Taylor', department: 'Engineering', position: 'DevOps Engineer', status: 'absent', checkInTime: undefined, checkOutTime: undefined }
  ]);

  const [timeEntries] = useState<TimeEntry[]>([
    { id: 'TE-001', employeeId: 'EMP-001', employeeName: 'Sarah Chen', date: '2026-01-15', checkIn: '08:45', checkOut: '18:30', breakTime: 60, workHours: 8.75, overtime: 0.75, status: 'complete', type: 'office' },
    { id: 'TE-002', employeeId: 'EMP-002', employeeName: 'Michael Brown', date: '2026-01-15', checkIn: '09:00', checkOut: '17:45', breakTime: 45, workHours: 8.0, overtime: 0, status: 'complete', type: 'office' },
    { id: 'TE-003', employeeId: 'EMP-003', employeeName: 'Emily Johnson', date: '2026-01-15', checkIn: '09:32', checkOut: '18:15', breakTime: 60, workHours: 7.72, overtime: 0, status: 'complete', type: 'office', notes: 'Late arrival - traffic' },
    { id: 'TE-004', employeeId: 'EMP-004', employeeName: 'David Park', date: '2026-01-15', checkIn: '08:30', checkOut: '19:00', breakTime: 60, workHours: 9.5, overtime: 1.5, status: 'complete', type: 'remote' },
    { id: 'TE-005', employeeId: 'EMP-006', employeeName: 'Robert Wilson', date: '2026-01-15', checkIn: '08:55', checkOut: '17:30', breakTime: 45, workHours: 7.83, overtime: 0, status: 'complete', type: 'office' },
    { id: 'TE-006', employeeId: 'EMP-007', employeeName: 'Maria Garcia', date: '2026-01-15', checkIn: '08:40', checkOut: undefined, breakTime: 30, workHours: 0, overtime: 0, status: 'in_progress', type: 'office' }
  ]);

  const [leaveRequests] = useState<LeaveRequest[]>([
    { id: 'LR-001', employeeId: 'EMP-005', employeeName: 'Jennifer Lee', type: 'vacation', startDate: '2026-01-13', endDate: '2026-01-20', days: 6, status: 'approved', reason: 'Family vacation', submittedDate: '2025-12-20' },
    { id: 'LR-002', employeeId: 'EMP-008', employeeName: 'James Taylor', type: 'sick', startDate: '2026-01-15', endDate: '2026-01-16', days: 2, status: 'approved', reason: 'Flu symptoms', submittedDate: '2026-01-15' },
    { id: 'LR-003', employeeId: 'EMP-001', employeeName: 'Sarah Chen', type: 'personal', startDate: '2026-01-22', endDate: '2026-01-23', days: 2, status: 'pending', reason: 'Personal appointment', submittedDate: '2026-01-10' },
    { id: 'LR-004', employeeId: 'EMP-002', employeeName: 'Michael Brown', type: 'vacation', startDate: '2026-02-01', endDate: '2026-02-07', days: 5, status: 'pending', reason: 'Winter break', submittedDate: '2026-01-08' },
    { id: 'LR-005', employeeId: 'EMP-006', employeeName: 'Robert Wilson', type: 'parental', startDate: '2026-03-01', endDate: '2026-04-01', days: 22, status: 'pending', reason: 'Paternity leave', submittedDate: '2026-01-05' },
    { id: 'LR-006', employeeId: 'EMP-003', employeeName: 'Emily Johnson', type: 'personal', startDate: '2026-01-30', endDate: '2026-01-30', days: 1, status: 'pending', reason: 'Doctor appointment', submittedDate: '2026-01-12' }
  ]);

  const [shifts] = useState<ShiftSchedule[]>([
    { id: 'SH-001', name: 'Morning Shift', startTime: '06:00', endTime: '14:00', breakDuration: 45, employees: 42, color: '#f97316' },
    { id: 'SH-002', name: 'Day Shift', startTime: '09:00', endTime: '17:00', breakDuration: 60, employees: 78, color: '#3b82f6' },
    { id: 'SH-003', name: 'Evening Shift', startTime: '14:00', endTime: '22:00', breakDuration: 45, employees: 36, color: '#8b5cf6' },
    { id: 'SH-004', name: 'Night Shift', startTime: '22:00', endTime: '06:00', breakDuration: 60, employees: 12, color: '#ec4899' }
  ]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      present: 'success',
      absent: 'error',
      late: 'warning',
      leave: 'info',
      remote: 'accent',
      pending: 'warning',
      approved: 'success',
      rejected: 'error'
    };
    return colors[status] || 'muted';
  };

  const getLeaveTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      vacation: <Plane size={16} />,
      sick: <Heart size={16} />,
      personal: <Briefcase size={16} />,
      parental: <Home size={16} />,
      bereavement: <Heart size={16} />
    };
    return icons[type] || <Calendar size={16} />;
  };

  const handleClockIn = () => {
    setClockedIn(true);
  };

  const handleClockOut = () => {
    setClockedIn(false);
    setBreakActive(false);
  };

  const handleBreakToggle = () => {
    setBreakActive(!breakActive);
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="overview-top">
        <div className="clock-widget">
          <div className="clock-display">
            <div className="current-time">{formatTime(currentTime)}</div>
            <div className="current-date">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <div className="clock-actions">
            {!clockedIn ? (
              <button className="clock-btn clock-in" onClick={handleClockIn}>
                <LogIn size={20} />
                Clock In
              </button>
            ) : (
              <>
                <button 
                  className={`clock-btn break ${breakActive ? 'active' : ''}`} 
                  onClick={handleBreakToggle}
                >
                  <Coffee size={20} />
                  {breakActive ? 'End Break' : 'Start Break'}
                </button>
                <button className="clock-btn clock-out" onClick={handleClockOut}>
                  <LogOut size={20} />
                  Clock Out
                </button>
              </>
            )}
          </div>
          {clockedIn && (
            <div className="clock-status">
              <span className={`status-indicator ${breakActive ? 'break' : 'working'}`}></span>
              {breakActive ? 'On Break' : 'Working'} since 08:45 AM
            </div>
          )}
        </div>

        <div className="metrics-row">
          <div className="metric-card present">
            <div className="metric-icon">
              <UserCheck size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{metrics.presentToday}</span>
              <span className="metric-label">Present Today</span>
            </div>
          </div>
          <div className="metric-card absent">
            <div className="metric-icon">
              <UserX size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{metrics.absentToday}</span>
              <span className="metric-label">Absent</span>
            </div>
          </div>
          <div className="metric-card late">
            <div className="metric-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{metrics.lateToday}</span>
              <span className="metric-label">Late Arrivals</span>
            </div>
          </div>
          <div className="metric-card leave">
            <div className="metric-icon">
              <Plane size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{metrics.onLeave}</span>
              <span className="metric-label">On Leave</span>
            </div>
          </div>
          <div className="metric-card remote">
            <div className="metric-icon">
              <Home size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{metrics.remoteWorking}</span>
              <span className="metric-label">Remote</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="overview-card">
          <h3>
            <Users size={18} />
            Today&apos;s Attendance
          </h3>
          <div className="attendance-donut">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#2a2a3a"
                strokeWidth="12"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={`${(metrics.presentToday / metrics.totalEmployees) * 251.2} 251.2`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="donut-center">
              <span className="donut-value">{metrics.attendanceRate}%</span>
              <span className="donut-label">Attendance Rate</span>
            </div>
          </div>
          <div className="attendance-legend">
            <div className="legend-item">
              <span className="legend-dot present"></span>
              <span>Present ({metrics.presentToday})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot absent"></span>
              <span>Absent ({metrics.absentToday})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot late"></span>
              <span>Late ({metrics.lateToday})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot leave"></span>
              <span>Leave ({metrics.onLeave})</span>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>
            <Clock size={18} />
            Work Hours Summary
          </h3>
          <div className="hours-summary">
            <div className="hours-stat main">
              <span className="hours-value">{metrics.avgWorkHours}</span>
              <span className="hours-label">Avg Hours Today</span>
            </div>
            <div className="hours-breakdown">
              <div className="hours-item">
                <Sun size={16} />
                <div className="hours-detail">
                  <span className="detail-value">8.0h</span>
                  <span className="detail-label">Standard</span>
                </div>
              </div>
              <div className="hours-item">
                <TrendingUp size={16} />
                <div className="hours-detail">
                  <span className="detail-value">+0.2h</span>
                  <span className="detail-label">Overtime</span>
                </div>
              </div>
              <div className="hours-item">
                <Coffee size={16} />
                <div className="hours-detail">
                  <span className="detail-value">52m</span>
                  <span className="detail-label">Avg Break</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>
            <Bell size={18} />
            Pending Requests
            <span className="badge">{metrics.pendingRequests}</span>
          </h3>
          <div className="pending-list">
            {leaveRequests
              .filter(req => req.status === 'pending')
              .slice(0, 4)
              .map(request => (
                <div key={request.id} className="pending-item">
                  <div className="request-avatar">
                    {request.employeeName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="request-info">
                    <span className="request-name">{request.employeeName}</span>
                    <span className="request-type">
                      {getLeaveTypeIcon(request.type)} {request.type} • {request.days} days
                    </span>
                  </div>
                  <div className="request-actions">
                    <button className="action-btn approve">
                      <Check size={14} />
                    </button>
                    <button className="action-btn reject">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <button className="view-all-btn" onClick={() => setActiveTab('leave')}>
            View All Requests <ArrowRight size={14} />
          </button>
        </div>

        <div className="overview-card">
          <h3>
            <Calendar size={18} />
            Shift Overview
          </h3>
          <div className="shifts-overview">
            {shifts.map(shift => (
              <div key={shift.id} className="shift-row" style={{ borderLeftColor: shift.color }}>
                <div className="shift-info">
                  <span className="shift-name">{shift.name}</span>
                  <span className="shift-time">{shift.startTime} - {shift.endTime}</span>
                </div>
                <div className="shift-count">
                  <Users size={14} />
                  <span>{shift.employees}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card wide">
          <h3>
            <Users size={18} />
            Employee Status
          </h3>
          <div className="employee-grid">
            {employees.map(employee => (
              <div key={employee.id} className={`employee-status-card ${employee.status}`}>
                <div className="employee-avatar">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="employee-info">
                  <span className="employee-name">{employee.name}</span>
                  <span className="employee-dept">{employee.department}</span>
                </div>
                <div className={`status-badge ${getStatusColor(employee.status)}`}>
                  {employee.status === 'present' && <CheckCircle2 size={12} />}
                  {employee.status === 'absent' && <XCircle size={12} />}
                  {employee.status === 'late' && <AlertTriangle size={12} />}
                  {employee.status === 'leave' && <Plane size={12} />}
                  {employee.status === 'remote' && <Home size={12} />}
                  {employee.status}
                </div>
                {employee.checkInTime && (
                  <span className="check-time">
                    <LogIn size={12} /> {employee.checkInTime}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTimesheet = () => (
    <div className="timesheet-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="date-picker">
            <button className="date-nav" onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}>
              <ChevronLeft size={18} />
            </button>
            <span className="date-display">
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button className="date-nav" onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}>
              <ChevronRight size={18} />
            </button>
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="complete">Complete</option>
            <option value="in_progress">In Progress</option>
            <option value="missing">Missing</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div className="timesheet-table">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Break</th>
              <th>Work Hours</th>
              <th>Overtime</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {timeEntries.map(entry => (
              <tr key={entry.id}>
                <td>
                  <div className="employee-cell">
                    <div className="employee-avatar small">
                      {entry.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{entry.employeeName}</span>
                  </div>
                </td>
                <td>{formatDate(entry.date)}</td>
                <td>
                  <span className="time-badge in">{entry.checkIn}</span>
                </td>
                <td>
                  {entry.checkOut ? (
                    <span className="time-badge out">{entry.checkOut}</span>
                  ) : (
                    <span className="time-badge pending">In Progress</span>
                  )}
                </td>
                <td>{entry.breakTime}m</td>
                <td>
                  <span className={`hours-badge ${entry.workHours >= 8 ? 'full' : 'partial'}`}>
                    {entry.workHours.toFixed(2)}h
                  </span>
                </td>
                <td>
                  {entry.overtime > 0 ? (
                    <span className="overtime-badge">+{entry.overtime.toFixed(2)}h</span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  <span className={`type-badge ${entry.type}`}>
                    {entry.type === 'office' && <Briefcase size={12} />}
                    {entry.type === 'remote' && <Home size={12} />}
                    {entry.type === 'field' && <MapPin size={12} />}
                    {entry.type}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${entry.status === 'complete' ? 'success' : entry.status === 'in_progress' ? 'warning' : 'error'}`}>
                    {entry.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn" title="View Details">
                      <Eye size={14} />
                    </button>
                    <button className="action-btn" title="Edit">
                      <Edit3 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLeave = () => (
    <div className="leave-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search requests..." />
          </div>
          <select className="filter-select">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="filter-select">
            <option value="all">All Types</option>
            <option value="vacation">Vacation</option>
            <option value="sick">Sick Leave</option>
            <option value="personal">Personal</option>
            <option value="parental">Parental</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary">
            <Plus size={18} /> New Request
          </button>
        </div>
      </div>

      <div className="leave-stats">
        <div className="leave-stat-card">
          <div className="stat-icon vacation">
            <Plane size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-value">15</span>
            <span className="stat-label">Vacation Days Left</span>
          </div>
        </div>
        <div className="leave-stat-card">
          <div className="stat-icon sick">
            <Heart size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-value">8</span>
            <span className="stat-label">Sick Days Left</span>
          </div>
        </div>
        <div className="leave-stat-card">
          <div className="stat-icon personal">
            <Briefcase size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-value">3</span>
            <span className="stat-label">Personal Days Left</span>
          </div>
        </div>
        <div className="leave-stat-card">
          <div className="stat-icon used">
            <Calendar size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-value">12</span>
            <span className="stat-label">Days Used This Year</span>
          </div>
        </div>
      </div>

      <div className="leave-requests-grid">
        {leaveRequests.map(request => (
          <div key={request.id} className={`leave-request-card ${request.status}`}>
            <div className="request-header">
              <div className="request-type-icon" style={{ background: 
                request.type === 'vacation' ? '#3b82f6' :
                request.type === 'sick' ? '#ef4444' :
                request.type === 'personal' ? '#8b5cf6' :
                request.type === 'parental' ? '#10b981' :
                '#f59e0b'
              }}>
                {getLeaveTypeIcon(request.type)}
              </div>
              <div className="request-title">
                <h4>{request.type.charAt(0).toUpperCase() + request.type.slice(1)} Leave</h4>
                <span className="request-employee">{request.employeeName}</span>
              </div>
              <span className={`status-badge ${getStatusColor(request.status)}`}>
                {request.status}
              </span>
            </div>
            <div className="request-body">
              <div className="request-dates">
                <div className="date-range">
                  <Calendar size={14} />
                  <span>{formatDate(request.startDate)} - {formatDate(request.endDate)}</span>
                </div>
                <span className="days-count">{request.days} days</span>
              </div>
              <p className="request-reason">{request.reason}</p>
              <span className="request-submitted">Submitted: {formatDate(request.submittedDate)}</span>
            </div>
            {request.status === 'pending' && (
              <div className="request-actions">
                <button className="btn-outline small">
                  <X size={14} /> Reject
                </button>
                <button className="btn-primary small">
                  <Check size={14} /> Approve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="schedule-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="date-picker">
            <button className="date-nav">
              <ChevronLeft size={18} />
            </button>
            <span className="date-display">Week of Jan 13 - 19, 2026</span>
            <button className="date-nav">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <Settings size={18} /> Manage Shifts
          </button>
          <button className="btn-primary">
            <Plus size={18} /> Add Shift
          </button>
        </div>
      </div>

      <div className="shifts-grid">
        {shifts.map(shift => (
          <div key={shift.id} className="shift-card" style={{ '--shift-color': shift.color } as React.CSSProperties}>
            <div className="shift-header">
              <h4>{shift.name}</h4>
              <span className="shift-employees">
                <Users size={14} /> {shift.employees} employees
              </span>
            </div>
            <div className="shift-time-display">
              <div className="time-block">
                <Sunrise size={18} />
                <div className="time-info">
                  <span className="time-value">{shift.startTime}</span>
                  <span className="time-label">Start</span>
                </div>
              </div>
              <div className="time-arrow">→</div>
              <div className="time-block">
                <Sunset size={18} />
                <div className="time-info">
                  <span className="time-value">{shift.endTime}</span>
                  <span className="time-label">End</span>
                </div>
              </div>
            </div>
            <div className="shift-details">
              <div className="detail-item">
                <Coffee size={14} />
                <span>{shift.breakDuration}min break</span>
              </div>
              <div className="detail-item">
                <Clock size={14} />
                <span>8h shift</span>
              </div>
            </div>
            <div className="shift-actions">
              <button className="btn-outline small">
                <Edit3 size={14} /> Edit
              </button>
              <button className="btn-outline small">
                <Users size={14} /> Assign
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="weekly-calendar">
        <h3>
          <Calendar size={18} />
          Weekly Schedule
        </h3>
        <div className="calendar-grid">
          <div className="calendar-header">
            <div className="calendar-cell header">Employee</div>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="calendar-cell header">{day}</div>
            ))}
          </div>
          {employees.slice(0, 5).map(employee => (
            <div key={employee.id} className="calendar-row">
              <div className="calendar-cell employee">
                <div className="employee-mini">
                  <div className="employee-avatar tiny">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span>{employee.name}</span>
                </div>
              </div>
              {[...Array(7)].map((_, idx) => (
                <div key={idx} className="calendar-cell">
                  {idx < 5 && (
                    <div className="shift-block" style={{ background: shifts[Math.floor(Math.random() * 2) + 1].color }}>
                      9-17
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="reports-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <select className="filter-select">
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <select className="filter-select">
            <option value="all">All Departments</option>
            <option value="engineering">Engineering</option>
            <option value="sales">Sales</option>
            <option value="marketing">Marketing</option>
            <option value="hr">HR</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <Download size={18} /> Export Report
          </button>
        </div>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <h3>Attendance Trend</h3>
          <div className="trend-chart">
            <div className="chart-bars">
              {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, idx) => {
                const values = [92, 94, 91, 95];
                return (
                  <div key={week} className="chart-column">
                    <div className="bar-container">
                      <div className="bar" style={{ height: `${values[idx]}%` }}></div>
                    </div>
                    <span className="bar-label">{week}</span>
                    <span className="bar-value">{values[idx]}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="report-card">
          <h3>Overtime Analysis</h3>
          <div className="overtime-stats">
            <div className="overtime-main">
              <span className="overtime-value">124.5</span>
              <span className="overtime-label">Total Overtime Hours</span>
            </div>
            <div className="overtime-breakdown">
              <div className="overtime-row">
                <span>Engineering</span>
                <span className="overtime-hours">45.5h</span>
              </div>
              <div className="overtime-row">
                <span>Sales</span>
                <span className="overtime-hours">32.0h</span>
              </div>
              <div className="overtime-row">
                <span>Marketing</span>
                <span className="overtime-hours">28.0h</span>
              </div>
              <div className="overtime-row">
                <span>Operations</span>
                <span className="overtime-hours">19.0h</span>
              </div>
            </div>
          </div>
        </div>

        <div className="report-card">
          <h3>Leave Utilization</h3>
          <div className="leave-chart">
            <div className="leave-bars">
              {[
                { type: 'Vacation', used: 234, total: 520 },
                { type: 'Sick', used: 45, total: 208 },
                { type: 'Personal', used: 78, total: 156 },
                { type: 'Parental', used: 44, total: 88 }
              ].map(item => (
                <div key={item.type} className="leave-bar-row">
                  <span className="leave-type">{item.type}</span>
                  <div className="leave-bar-container">
                    <div className="leave-bar" style={{ width: `${(item.used / item.total) * 100}%` }}></div>
                  </div>
                  <span className="leave-ratio">{item.used}/{item.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="report-card">
          <h3>Department Attendance</h3>
          <div className="dept-stats">
            {[
              { name: 'Engineering', rate: 96.2, trend: 'up' },
              { name: 'Sales', rate: 93.8, trend: 'up' },
              { name: 'Marketing', rate: 95.1, trend: 'down' },
              { name: 'HR', rate: 97.5, trend: 'up' },
              { name: 'Finance', rate: 94.6, trend: 'same' }
            ].map(dept => (
              <div key={dept.name} className="dept-row">
                <span className="dept-name">{dept.name}</span>
                <div className="dept-rate">
                  <span className={`rate-value ${dept.rate >= 95 ? 'high' : ''}`}>{dept.rate}%</span>
                  {dept.trend === 'up' && <TrendingUp size={14} className="trend-up" />}
                  {dept.trend === 'down' && <TrendingDown size={14} className="trend-down" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="report-card wide">
          <h3>Monthly Summary</h3>
          <div className="monthly-summary">
            <div className="summary-stat">
              <div className="stat-circle">
                <span>3,847</span>
              </div>
              <span className="stat-desc">Total Work Days</span>
            </div>
            <div className="summary-stat">
              <div className="stat-circle">
                <span>30,776</span>
              </div>
              <span className="stat-desc">Total Work Hours</span>
            </div>
            <div className="summary-stat">
              <div className="stat-circle">
                <span>124.5</span>
              </div>
              <span className="stat-desc">Overtime Hours</span>
            </div>
            <div className="summary-stat">
              <div className="stat-circle">
                <span>357</span>
              </div>
              <span className="stat-desc">Leave Days Taken</span>
            </div>
            <div className="summary-stat">
              <div className="stat-circle highlight">
                <span>94.3%</span>
              </div>
              <span className="stat-desc">Avg Attendance Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="attendance-page">
      <div className="att__header">
        <div className="att__title-section">
          <div className="att__icon">
            <Clock size={28} />
          </div>
          <div>
            <h1>Time & Attendance</h1>
            <p>Track employee attendance, time, and leave management</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary">
            <FileText size={18} />
            Generate Report
          </button>
        </div>
      </div>

      <div className="att__tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={18} />
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'timesheet' ? 'active' : ''}`}
          onClick={() => setActiveTab('timesheet')}
        >
          <ClipboardList size={18} />
          Timesheet
        </button>
        <button
          className={`tab-btn ${activeTab === 'leave' ? 'active' : ''}`}
          onClick={() => setActiveTab('leave')}
        >
          <Plane size={18} />
          Leave Management
          <span className="tab-badge">{leaveRequests.filter(r => r.status === 'pending').length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={18} />
          Schedule
        </button>
        <button
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={18} />
          Reports
        </button>
      </div>

      <div className="att__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'timesheet' && renderTimesheet()}
        {activeTab === 'leave' && renderLeave()}
        {activeTab === 'schedule' && renderSchedule()}
        {activeTab === 'reports' && renderReports()}
      </div>
    </div>
  );
};

export default AttendancePage;
