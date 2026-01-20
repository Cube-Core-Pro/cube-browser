'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  Laptop,
  Building2,
  Mail,
  Calendar,
  ChevronRight,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Edit,
  Trash2,
  X,
  ArrowRight,
  CheckSquare,
  Square,
  BookOpen,
  Shield,
  Key,
  CreditCard,
  Heart,
  GraduationCap,
  Briefcase,
  MapPin,
  Phone,
  Send,
  Download,
  Upload,
  MessageSquare,
  UserCheck,
  ClipboardList,
  Settings,
  Award,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';
import './onboarding.css';

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  category: 'documentation' | 'it-setup' | 'hr-forms' | 'training' | 'compliance' | 'team-intro';
  assignedTo: 'employee' | 'hr' | 'it' | 'manager' | 'finance';
  dueDay: number;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue' | 'skipped';
  requiredDocs?: string[];
  completedAt?: string;
}

interface NewHire {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  manager: string;
  startDate: string;
  status: 'pre-boarding' | 'in-progress' | 'completed' | 'on-hold';
  progress: number;
  completedTasks: number;
  totalTasks: number;
  avatar?: string;
  phone?: string;
  location?: string;
  employeeType: 'full-time' | 'part-time' | 'contractor' | 'intern';
  buddy?: string;
  notes?: string;
}

interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  department: string;
  duration: number;
  tasksCount: number;
  isDefault: boolean;
  createdAt: string;
}

interface OnboardingMetrics {
  activeOnboardings: number;
  completedThisMonth: number;
  averageDuration: number;
  completionRate: number;
  tasksCompletedToday: number;
  overdueItems: number;
}

type TabType = 'dashboard' | 'new-hires' | 'tasks' | 'templates' | 'calendar';

const onboardingMetrics: OnboardingMetrics = {
  activeOnboardings: 12,
  completedThisMonth: 8,
  averageDuration: 14,
  completionRate: 94,
  tasksCompletedToday: 23,
  overdueItems: 3
};

const newHires: NewHire[] = [
  {
    id: 'NH001',
    name: 'Alexandra Chen',
    email: 'alexandra.chen@company.com',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    manager: 'David Wilson',
    startDate: '2025-02-03',
    status: 'in-progress',
    progress: 65,
    completedTasks: 13,
    totalTasks: 20,
    phone: '+1 555-0123',
    location: 'San Francisco, CA',
    employeeType: 'full-time',
    buddy: 'Michael Johnson'
  },
  {
    id: 'NH002',
    name: 'Marcus Thompson',
    email: 'marcus.thompson@company.com',
    position: 'Product Designer',
    department: 'Design',
    manager: 'Sarah Martinez',
    startDate: '2025-02-05',
    status: 'in-progress',
    progress: 45,
    completedTasks: 9,
    totalTasks: 20,
    phone: '+1 555-0124',
    location: 'New York, NY',
    employeeType: 'full-time',
    buddy: 'Emma Davis'
  },
  {
    id: 'NH003',
    name: 'Elena Rodriguez',
    email: 'elena.rodriguez@company.com',
    position: 'Marketing Manager',
    department: 'Marketing',
    manager: 'James Brown',
    startDate: '2025-02-10',
    status: 'pre-boarding',
    progress: 15,
    completedTasks: 3,
    totalTasks: 20,
    phone: '+1 555-0125',
    location: 'Chicago, IL',
    employeeType: 'full-time',
    buddy: 'Lisa Wang'
  },
  {
    id: 'NH004',
    name: 'Ryan Park',
    email: 'ryan.park@company.com',
    position: 'Data Analyst',
    department: 'Analytics',
    manager: 'Jennifer Kim',
    startDate: '2025-01-27',
    status: 'completed',
    progress: 100,
    completedTasks: 20,
    totalTasks: 20,
    phone: '+1 555-0126',
    location: 'Austin, TX',
    employeeType: 'full-time',
    buddy: 'Chris Taylor'
  },
  {
    id: 'NH005',
    name: 'Sophie Anderson',
    email: 'sophie.anderson@company.com',
    position: 'Sales Representative',
    department: 'Sales',
    manager: 'Mark Stevens',
    startDate: '2025-02-12',
    status: 'pre-boarding',
    progress: 10,
    completedTasks: 2,
    totalTasks: 20,
    phone: '+1 555-0127',
    location: 'Denver, CO',
    employeeType: 'full-time'
  },
  {
    id: 'NH006',
    name: 'Kevin Nguyen',
    email: 'kevin.nguyen@company.com',
    position: 'DevOps Engineer',
    department: 'Engineering',
    manager: 'David Wilson',
    startDate: '2025-02-01',
    status: 'on-hold',
    progress: 30,
    completedTasks: 6,
    totalTasks: 20,
    phone: '+1 555-0128',
    location: 'Seattle, WA',
    employeeType: 'contractor',
    notes: 'Waiting for security clearance'
  }
];

const onboardingTasks: OnboardingTask[] = [
  {
    id: 'T001',
    title: 'Complete I-9 Form',
    description: 'Employment eligibility verification form',
    category: 'hr-forms',
    assignedTo: 'employee',
    dueDay: 1,
    status: 'completed',
    requiredDocs: ['Government ID', 'Social Security Card']
  },
  {
    id: 'T002',
    title: 'Sign Employee Handbook Acknowledgment',
    description: 'Review and acknowledge company policies',
    category: 'compliance',
    assignedTo: 'employee',
    dueDay: 1,
    status: 'completed'
  },
  {
    id: 'T003',
    title: 'Complete Tax Forms (W-4)',
    description: 'Federal tax withholding form',
    category: 'hr-forms',
    assignedTo: 'employee',
    dueDay: 1,
    status: 'in-progress'
  },
  {
    id: 'T004',
    title: 'Set Up Laptop & Equipment',
    description: 'Configure workstation and install required software',
    category: 'it-setup',
    assignedTo: 'it',
    dueDay: 0,
    status: 'completed'
  },
  {
    id: 'T005',
    title: 'Create Email & System Accounts',
    description: 'Set up corporate email and access credentials',
    category: 'it-setup',
    assignedTo: 'it',
    dueDay: -1,
    status: 'completed'
  },
  {
    id: 'T006',
    title: 'Security Awareness Training',
    description: 'Complete mandatory security training module',
    category: 'training',
    assignedTo: 'employee',
    dueDay: 3,
    status: 'pending'
  },
  {
    id: 'T007',
    title: 'Benefits Enrollment',
    description: 'Select health, dental, and other benefit plans',
    category: 'hr-forms',
    assignedTo: 'employee',
    dueDay: 5,
    status: 'pending'
  },
  {
    id: 'T008',
    title: 'Team Introduction Meeting',
    description: 'Meet with team members and stakeholders',
    category: 'team-intro',
    assignedTo: 'manager',
    dueDay: 1,
    status: 'in-progress'
  },
  {
    id: 'T009',
    title: 'Direct Deposit Setup',
    description: 'Configure payroll direct deposit',
    category: 'hr-forms',
    assignedTo: 'employee',
    dueDay: 3,
    status: 'pending'
  },
  {
    id: 'T010',
    title: 'Emergency Contact Information',
    description: 'Provide emergency contact details',
    category: 'documentation',
    assignedTo: 'employee',
    dueDay: 1,
    status: 'overdue'
  },
  {
    id: 'T011',
    title: 'Role-Specific Training',
    description: 'Complete department-specific training modules',
    category: 'training',
    assignedTo: 'employee',
    dueDay: 7,
    status: 'pending'
  },
  {
    id: 'T012',
    title: 'Set 30-Day Goals',
    description: 'Define initial performance objectives',
    category: 'team-intro',
    assignedTo: 'manager',
    dueDay: 5,
    status: 'pending'
  }
];

const onboardingTemplates: OnboardingTemplate[] = [
  {
    id: 'TPL001',
    name: 'Standard Employee Onboarding',
    description: 'Default onboarding template for full-time employees',
    department: 'All Departments',
    duration: 14,
    tasksCount: 20,
    isDefault: true,
    createdAt: '2024-06-15'
  },
  {
    id: 'TPL002',
    name: 'Engineering Onboarding',
    description: 'Specialized onboarding for engineering roles',
    department: 'Engineering',
    duration: 21,
    tasksCount: 28,
    isDefault: false,
    createdAt: '2024-07-20'
  },
  {
    id: 'TPL003',
    name: 'Sales Team Onboarding',
    description: 'Sales-specific training and CRM setup',
    department: 'Sales',
    duration: 10,
    tasksCount: 18,
    isDefault: false,
    createdAt: '2024-08-10'
  },
  {
    id: 'TPL004',
    name: 'Contractor Onboarding',
    description: 'Streamlined process for contractors',
    department: 'All Departments',
    duration: 7,
    tasksCount: 12,
    isDefault: false,
    createdAt: '2024-09-05'
  },
  {
    id: 'TPL005',
    name: 'Executive Onboarding',
    description: 'Comprehensive onboarding for leadership roles',
    department: 'Executive',
    duration: 30,
    tasksCount: 35,
    isDefault: false,
    createdAt: '2024-10-12'
  }
];

const getCategoryIcon = (category: OnboardingTask['category']) => {
  switch (category) {
    case 'documentation': return <FileText size={16} />;
    case 'it-setup': return <Laptop size={16} />;
    case 'hr-forms': return <ClipboardList size={16} />;
    case 'training': return <GraduationCap size={16} />;
    case 'compliance': return <Shield size={16} />;
    case 'team-intro': return <Users size={16} />;
    default: return <FileText size={16} />;
  }
};

const getCategoryColor = (category: OnboardingTask['category']) => {
  switch (category) {
    case 'documentation': return 'blue';
    case 'it-setup': return 'purple';
    case 'hr-forms': return 'teal';
    case 'training': return 'orange';
    case 'compliance': return 'red';
    case 'team-intro': return 'green';
    default: return 'blue';
  }
};

const getStatusColor = (status: NewHire['status'] | OnboardingTask['status']) => {
  switch (status) {
    case 'completed': return 'success';
    case 'in-progress': return 'info';
    case 'pre-boarding': return 'warning';
    case 'pending': return 'muted';
    case 'on-hold': return 'error';
    case 'overdue': return 'error';
    case 'skipped': return 'muted';
    default: return 'muted';
  }
};

const getAssigneeLabel = (assignee: OnboardingTask['assignedTo']) => {
  switch (assignee) {
    case 'employee': return 'New Hire';
    case 'hr': return 'HR Team';
    case 'it': return 'IT Team';
    case 'manager': return 'Manager';
    case 'finance': return 'Finance';
    default: return assignee;
  }
};

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedHire, setSelectedHire] = useState<NewHire | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilStart = (startDate: string): number => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredHires = newHires.filter(hire => {
    const matchesSearch = hire.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hire.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hire.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || hire.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTasks = onboardingTasks.filter(task => {
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="metrics-grid">
        <div className="metric-card large primary">
          <div className="metric-icon">
            <UserPlus size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{onboardingMetrics.activeOnboardings}</span>
            <span className="metric-label">Active Onboardings</span>
            <span className="metric-trend">+3 this week</span>
          </div>
        </div>
        <div className="metric-card success">
          <div className="metric-icon">
            <CheckCircle2 size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{onboardingMetrics.completedThisMonth}</span>
            <span className="metric-label">Completed This Month</span>
          </div>
        </div>
        <div className="metric-card info">
          <div className="metric-icon">
            <Clock size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{onboardingMetrics.averageDuration}</span>
            <span className="metric-label">Avg. Days to Complete</span>
          </div>
        </div>
        <div className="metric-card accent">
          <div className="metric-icon">
            <Target size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{onboardingMetrics.completionRate}%</span>
            <span className="metric-label">Completion Rate</span>
          </div>
        </div>
        <div className="metric-card warning">
          <div className="metric-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{onboardingMetrics.overdueItems}</span>
            <span className="metric-label">Overdue Items</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3><Zap size={18} /> Quick Actions</h3>
          <div className="quick-actions">
            <button className="quick-action-btn">
              <div className="action-icon blue">
                <UserPlus size={20} />
              </div>
              <span>Start New Onboarding</span>
              <ChevronRight size={16} />
            </button>
            <button className="quick-action-btn">
              <div className="action-icon purple">
                <FileText size={20} />
              </div>
              <span>Create Template</span>
              <ChevronRight size={16} />
            </button>
            <button className="quick-action-btn">
              <div className="action-icon teal">
                <Send size={20} />
              </div>
              <span>Send Welcome Email</span>
              <ChevronRight size={16} />
            </button>
            <button className="quick-action-btn">
              <div className="action-icon orange">
                <Download size={20} />
              </div>
              <span>Export Reports</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <h3><Clock size={18} /> Upcoming Start Dates</h3>
          <div className="upcoming-list">
            {newHires
              .filter(h => h.status === 'pre-boarding' || h.status === 'in-progress')
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .slice(0, 4)
              .map(hire => {
                const days = getDaysUntilStart(hire.startDate);
                return (
                  <div key={hire.id} className="upcoming-item">
                    <div className="upcoming-avatar">
                      {getInitials(hire.name)}
                    </div>
                    <div className="upcoming-info">
                      <span className="upcoming-name">{hire.name}</span>
                      <span className="upcoming-position">{hire.position}</span>
                    </div>
                    <div className="upcoming-date">
                      {days <= 0 ? (
                        <span className="date-badge started">Started</span>
                      ) : (
                        <span className="date-badge upcoming">
                          {days === 1 ? 'Tomorrow' : `${days} days`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="dashboard-card">
          <h3><CheckSquare size={18} /> Tasks Due Today</h3>
          <div className="tasks-due-list">
            {onboardingTasks
              .filter(t => t.status === 'pending' || t.status === 'in-progress')
              .slice(0, 5)
              .map(task => (
                <div key={task.id} className="task-due-item">
                  <div className={`task-check ${task.status === 'completed' ? 'checked' : ''}`}>
                    {task.status === 'completed' ? <CheckSquare size={16} /> : <Square size={16} />}
                  </div>
                  <div className="task-due-info">
                    <span className="task-due-title">{task.title}</span>
                    <span className="task-due-assignee">{getAssigneeLabel(task.assignedTo)}</span>
                  </div>
                  <div className={`category-badge ${getCategoryColor(task.category)}`}>
                    {getCategoryIcon(task.category)}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h3><Target size={18} /> Progress Overview</h3>
          <div className="progress-overview">
            {newHires
              .filter(h => h.status !== 'completed')
              .slice(0, 4)
              .map(hire => (
                <div key={hire.id} className="progress-item">
                  <div className="progress-header">
                    <span className="progress-name">{hire.name}</span>
                    <span className="progress-percent">{hire.progress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${hire.progress}%` }}
                    />
                  </div>
                  <span className="progress-tasks">
                    {hire.completedTasks}/{hire.totalTasks} tasks
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="dashboard-card wide">
          <h3><Award size={18} /> Recent Completions</h3>
          <div className="completions-list">
            {newHires
              .filter(h => h.status === 'completed')
              .map(hire => (
                <div key={hire.id} className="completion-item">
                  <div className="completion-avatar">
                    {getInitials(hire.name)}
                  </div>
                  <div className="completion-info">
                    <span className="completion-name">{hire.name}</span>
                    <span className="completion-position">{hire.position} • {hire.department}</span>
                  </div>
                  <div className="completion-badge">
                    <CheckCircle2 size={16} />
                    <span>Onboarding Complete</span>
                  </div>
                  <span className="completion-date">Started {formatDate(hire.startDate)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderNewHires = () => (
    <div className="new-hires-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search new hires..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pre-boarding">Pre-boarding</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <Filter size={16} />
            Filters
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Onboarding
          </button>
        </div>
      </div>

      <div className="hires-grid">
        {filteredHires.map(hire => (
          <div 
            key={hire.id} 
            className={`hire-card ${selectedHire?.id === hire.id ? 'selected' : ''}`}
            onClick={() => setSelectedHire(hire)}
          >
            <div className="hire-header">
              <div className="hire-avatar">{getInitials(hire.name)}</div>
              <div className="hire-title">
                <h4>{hire.name}</h4>
                <span className="hire-position">{hire.position}</span>
              </div>
              <span className={`status-badge ${getStatusColor(hire.status)}`}>
                {hire.status.replace('-', ' ')}
              </span>
            </div>

            <div className="hire-details">
              <div className="detail-row">
                <Building2 size={14} />
                <span>{hire.department}</span>
              </div>
              <div className="detail-row">
                <Calendar size={14} />
                <span>Start: {formatDate(hire.startDate)}</span>
              </div>
              <div className="detail-row">
                <UserCheck size={14} />
                <span>Manager: {hire.manager}</span>
              </div>
              {hire.buddy && (
                <div className="detail-row">
                  <Users size={14} />
                  <span>Buddy: {hire.buddy}</span>
                </div>
              )}
            </div>

            <div className="hire-progress">
              <div className="progress-header">
                <span>Onboarding Progress</span>
                <span className="progress-percent">{hire.progress}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className={`progress-bar-fill ${hire.status === 'completed' ? 'complete' : ''}`}
                  style={{ width: `${hire.progress}%` }}
                />
              </div>
              <span className="progress-tasks">
                {hire.completedTasks} of {hire.totalTasks} tasks completed
              </span>
            </div>

            {hire.notes && (
              <div className="hire-notes">
                <AlertTriangle size={14} />
                <span>{hire.notes}</span>
              </div>
            )}

            <div className="hire-actions">
              <button className="btn-outline small">
                <Eye size={14} />
                View Details
              </button>
              <button className="btn-primary small">
                <Play size={14} />
                Continue
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedHire && (
        <div className="hire-detail-panel">
          <div className="panel-header">
            <h3>Employee Details</h3>
            <button className="close-btn" onClick={() => setSelectedHire(null)}>
              <X size={20} />
            </button>
          </div>
          <div className="panel-content">
            <div className="detail-avatar large">
              {getInitials(selectedHire.name)}
            </div>
            <h4 className="detail-name">{selectedHire.name}</h4>
            <p className="detail-position">{selectedHire.position}</p>
            
            <div className="detail-section">
              <h5>Contact Information</h5>
              <div className="info-grid">
                <div className="info-item">
                  <Mail size={14} />
                  <span>{selectedHire.email}</span>
                </div>
                {selectedHire.phone && (
                  <div className="info-item">
                    <Phone size={14} />
                    <span>{selectedHire.phone}</span>
                  </div>
                )}
                {selectedHire.location && (
                  <div className="info-item">
                    <MapPin size={14} />
                    <span>{selectedHire.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h5>Employment Details</h5>
              <div className="info-grid">
                <div className="info-item">
                  <Building2 size={14} />
                  <span>{selectedHire.department}</span>
                </div>
                <div className="info-item">
                  <Briefcase size={14} />
                  <span className="capitalize">{selectedHire.employeeType.replace('-', ' ')}</span>
                </div>
                <div className="info-item">
                  <Calendar size={14} />
                  <span>{formatDate(selectedHire.startDate)}</span>
                </div>
                <div className="info-item">
                  <UserCheck size={14} />
                  <span>{selectedHire.manager}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h5>Onboarding Progress</h5>
              <div className="progress-circle-container">
                <svg className="progress-circle" viewBox="0 0 100 100">
                  <circle
                    className="progress-bg"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeWidth="8"
                  />
                  <circle
                    className="progress-fill"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeWidth="8"
                    strokeDasharray={`${selectedHire.progress * 2.83} 283`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="progress-center">
                  <span className="progress-value">{selectedHire.progress}%</span>
                  <span className="progress-label">Complete</span>
                </div>
              </div>
              <div className="task-summary">
                <span>{selectedHire.completedTasks} tasks completed</span>
                <span>{selectedHire.totalTasks - selectedHire.completedTasks} remaining</span>
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-outline">
                <MessageSquare size={16} />
                Send Message
              </button>
              <button className="btn-primary">
                <ClipboardList size={16} />
                View Checklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTasks = () => (
    <div className="tasks-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <select 
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="documentation">Documentation</option>
            <option value="it-setup">IT Setup</option>
            <option value="hr-forms">HR Forms</option>
            <option value="training">Training</option>
            <option value="compliance">Compliance</option>
            <option value="team-intro">Team Introduction</option>
          </select>
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      <div className="tasks-board">
        <div className="task-column">
          <div className="column-header pending">
            <Square size={18} />
            <span>Pending</span>
            <span className="column-count">
              {filteredTasks.filter(t => t.status === 'pending').length}
            </span>
          </div>
          <div className="task-list">
            {filteredTasks
              .filter(t => t.status === 'pending')
              .map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <div className={`category-icon ${getCategoryColor(task.category)}`}>
                      {getCategoryIcon(task.category)}
                    </div>
                    <button className="task-menu">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <h4 className="task-title">{task.title}</h4>
                  <p className="task-description">{task.description}</p>
                  <div className="task-meta">
                    <span className="assignee-badge">
                      {getAssigneeLabel(task.assignedTo)}
                    </span>
                    <span className="due-day">Day {task.dueDay}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="task-column">
          <div className="column-header in-progress">
            <Play size={18} />
            <span>In Progress</span>
            <span className="column-count">
              {filteredTasks.filter(t => t.status === 'in-progress').length}
            </span>
          </div>
          <div className="task-list">
            {filteredTasks
              .filter(t => t.status === 'in-progress')
              .map(task => (
                <div key={task.id} className="task-card active">
                  <div className="task-header">
                    <div className={`category-icon ${getCategoryColor(task.category)}`}>
                      {getCategoryIcon(task.category)}
                    </div>
                    <button className="task-menu">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <h4 className="task-title">{task.title}</h4>
                  <p className="task-description">{task.description}</p>
                  <div className="task-meta">
                    <span className="assignee-badge">
                      {getAssigneeLabel(task.assignedTo)}
                    </span>
                    <span className="due-day">Day {task.dueDay}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="task-column">
          <div className="column-header completed">
            <CheckCircle2 size={18} />
            <span>Completed</span>
            <span className="column-count">
              {filteredTasks.filter(t => t.status === 'completed').length}
            </span>
          </div>
          <div className="task-list">
            {filteredTasks
              .filter(t => t.status === 'completed')
              .map(task => (
                <div key={task.id} className="task-card completed">
                  <div className="task-header">
                    <div className={`category-icon ${getCategoryColor(task.category)}`}>
                      {getCategoryIcon(task.category)}
                    </div>
                    <button className="task-menu">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <h4 className="task-title">{task.title}</h4>
                  <p className="task-description">{task.description}</p>
                  <div className="task-meta">
                    <span className="assignee-badge">
                      {getAssigneeLabel(task.assignedTo)}
                    </span>
                    <span className="completed-badge">
                      <CheckCircle2 size={12} /> Done
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="task-column">
          <div className="column-header overdue">
            <AlertTriangle size={18} />
            <span>Overdue</span>
            <span className="column-count">
              {filteredTasks.filter(t => t.status === 'overdue').length}
            </span>
          </div>
          <div className="task-list">
            {filteredTasks
              .filter(t => t.status === 'overdue')
              .map(task => (
                <div key={task.id} className="task-card overdue">
                  <div className="task-header">
                    <div className={`category-icon ${getCategoryColor(task.category)}`}>
                      {getCategoryIcon(task.category)}
                    </div>
                    <button className="task-menu">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <h4 className="task-title">{task.title}</h4>
                  <p className="task-description">{task.description}</p>
                  <div className="task-meta">
                    <span className="assignee-badge">
                      {getAssigneeLabel(task.assignedTo)}
                    </span>
                    <span className="overdue-badge">
                      <AlertTriangle size={12} /> Overdue
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="templates-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search templates..." />
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <Upload size={16} />
            Import
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Create Template
          </button>
        </div>
      </div>

      <div className="templates-grid">
        {onboardingTemplates.map(template => (
          <div key={template.id} className={`template-card ${template.isDefault ? 'default' : ''}`}>
            {template.isDefault && (
              <div className="default-badge">Default</div>
            )}
            <div className="template-icon">
              <ClipboardList size={24} />
            </div>
            <h4 className="template-name">{template.name}</h4>
            <p className="template-description">{template.description}</p>
            
            <div className="template-meta">
              <div className="meta-item">
                <Building2 size={14} />
                <span>{template.department}</span>
              </div>
              <div className="meta-item">
                <Clock size={14} />
                <span>{template.duration} days</span>
              </div>
              <div className="meta-item">
                <CheckSquare size={14} />
                <span>{template.tasksCount} tasks</span>
              </div>
            </div>

            <div className="template-actions">
              <button className="btn-outline small">
                <Eye size={14} />
                Preview
              </button>
              <button className="btn-outline small">
                <Edit size={14} />
                Edit
              </button>
              <button className="btn-primary small">
                <Play size={14} />
                Use
              </button>
            </div>
          </div>
        ))}

        <div className="template-card add-new">
          <div className="add-icon">
            <Plus size={32} />
          </div>
          <h4>Create New Template</h4>
          <p>Build a custom onboarding workflow</p>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hiresOnDay = newHires.filter(h => h.startDate === dateStr);
      const isToday = day === today.getDate();

      days.push(
        <div key={day} className={`calendar-day ${isToday ? 'today' : ''} ${hiresOnDay.length > 0 ? 'has-event' : ''}`}>
          <span className="day-number">{day}</span>
          {hiresOnDay.map(hire => (
            <div key={hire.id} className="calendar-event">
              <span className="event-dot" />
              <span className="event-name">{hire.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="calendar-content">
        <div className="calendar-header">
          <button className="calendar-nav">
            <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <h3>
            {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button className="calendar-nav">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {days}
          </div>
        </div>

        <div className="calendar-legend">
          <h4>Upcoming Start Dates</h4>
          <div className="legend-list">
            {newHires
              .filter(h => h.status === 'pre-boarding')
              .map(hire => (
                <div key={hire.id} className="legend-item">
                  <div className="legend-avatar">{getInitials(hire.name)}</div>
                  <div className="legend-info">
                    <span className="legend-name">{hire.name}</span>
                    <span className="legend-date">{formatDate(hire.startDate)}</span>
                  </div>
                  <span className="legend-position">{hire.position}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'new-hires': return renderNewHires();
      case 'tasks': return renderTasks();
      case 'templates': return renderTemplates();
      case 'calendar': return renderCalendar();
      default: return renderDashboard();
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onb__header">
        <div className="onb__title-section">
          <div className="onb__icon">
            <UserPlus size={28} />
          </div>
          <div>
            <h1>Employee Onboarding</h1>
            <p>Streamline new hire integration and track onboarding progress</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
          <button className="btn-primary">
            <UserPlus size={16} />
            Start Onboarding
          </button>
        </div>
      </div>

      <div className="onb__tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Target size={16} />
          Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'new-hires' ? 'active' : ''}`}
          onClick={() => setActiveTab('new-hires')}
        >
          <Users size={16} />
          New Hires
          <span className="tab-badge">{newHires.filter(h => h.status !== 'completed').length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquare size={16} />
          Tasks
          <span className="tab-badge">{onboardingTasks.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <FileText size={16} />
          Templates
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={16} />
          Calendar
        </button>
      </div>

      <div className="onb__content">
        {renderContent()}
      </div>
    </div>
  );
}
