'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  User,
  Users,
  Building2,
  Target,
  Flag,
  AlertCircle,
  CheckCircle2,
  Circle,
  MoreVertical,
  Phone,
  Mail,
  Video,
  MessageSquare,
  FileText,
  Coffee,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit,
  Eye,
  Link2,
  Repeat,
  Bell,
  MapPin,
  Timer,
  Zap,
  Tag,
  Grid3X3,
  List,
  CalendarDays,
  LayoutGrid,
  Star
} from 'lucide-react';
import './tasks.css';

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'call' | 'email' | 'meeting' | 'follow-up' | 'deadline';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  dueTime?: string;
  assignee: string;
  relatedTo: {
    type: 'contact' | 'company' | 'deal';
    name: string;
    id: string;
  };
  tags: string[];
  reminder?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    until?: string;
  };
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'deal' | 'task';
  title: string;
  description: string;
  user: string;
  timestamp: string;
  duration?: string;
  outcome?: 'positive' | 'negative' | 'neutral';
  relatedTo: {
    type: 'contact' | 'company' | 'deal';
    name: string;
  };
}

interface TaskStats {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'activities' | 'calendar'>('tasks');
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const tasks: Task[] = [
    {
      id: 'task-001',
      title: 'Follow up with TechCorp on proposal',
      description: 'Review feedback from stakeholders and prepare revised proposal',
      type: 'follow-up',
      status: 'pending',
      priority: 'high',
      dueDate: '2026-01-10',
      dueTime: '10:00',
      assignee: 'Sarah Johnson',
      relatedTo: { type: 'company', name: 'TechCorp Industries', id: 'comp-001' },
      tags: ['proposal', 'enterprise'],
      reminder: '1 hour before',
      createdAt: '2026-01-08'
    },
    {
      id: 'task-002',
      title: 'Quarterly review call with Global Finance',
      description: 'Discuss Q4 results and Q1 planning',
      type: 'call',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2026-01-09',
      dueTime: '14:00',
      assignee: 'Mike Chen',
      relatedTo: { type: 'company', name: 'Global Finance Ltd', id: 'comp-002' },
      tags: ['review', 'quarterly'],
      createdAt: '2026-01-05'
    },
    {
      id: 'task-003',
      title: 'Send contract renewal to Healthcare Plus',
      description: 'Prepare and send the annual contract renewal documentation',
      type: 'email',
      status: 'pending',
      priority: 'medium',
      dueDate: '2026-01-11',
      assignee: 'Lisa Brown',
      relatedTo: { type: 'company', name: 'Healthcare Plus', id: 'comp-004' },
      tags: ['contract', 'renewal'],
      createdAt: '2026-01-07'
    },
    {
      id: 'task-004',
      title: 'Product demo for StartupXYZ',
      description: 'Online demo of enterprise features',
      type: 'meeting',
      status: 'pending',
      priority: 'medium',
      dueDate: '2026-01-12',
      dueTime: '11:00',
      assignee: 'James Wilson',
      relatedTo: { type: 'company', name: 'StartupXYZ', id: 'comp-003' },
      tags: ['demo', 'sales'],
      recurring: { frequency: 'weekly' },
      createdAt: '2026-01-06'
    },
    {
      id: 'task-005',
      title: 'Complete onboarding checklist for EduSolutions',
      description: 'Ensure all onboarding steps are completed',
      type: 'task',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-08',
      assignee: 'Emily Davis',
      relatedTo: { type: 'company', name: 'EduSolutions', id: 'comp-008' },
      tags: ['onboarding', 'customer-success'],
      createdAt: '2026-01-03',
      completedAt: '2026-01-08'
    },
    {
      id: 'task-006',
      title: 'Prepare pricing proposal for Manufacturing Co',
      description: 'Create custom pricing based on volume requirements',
      type: 'deadline',
      status: 'overdue',
      priority: 'high',
      dueDate: '2026-01-07',
      assignee: 'Sarah Johnson',
      relatedTo: { type: 'deal', name: 'Enterprise License Deal', id: 'deal-003' },
      tags: ['pricing', 'urgent'],
      createdAt: '2026-01-02'
    },
    {
      id: 'task-007',
      title: 'Weekly check-in with Strategic Partners',
      description: 'Partnership progress update',
      type: 'call',
      status: 'pending',
      priority: 'low',
      dueDate: '2026-01-13',
      dueTime: '16:00',
      assignee: 'Mike Chen',
      relatedTo: { type: 'company', name: 'Strategic Partners', id: 'comp-007' },
      tags: ['partner', 'check-in'],
      recurring: { frequency: 'weekly' },
      createdAt: '2026-01-08'
    },
    {
      id: 'task-008',
      title: 'Send thank you note to Retail Giant',
      description: 'Follow up after successful meeting',
      type: 'email',
      status: 'completed',
      priority: 'low',
      dueDate: '2026-01-06',
      assignee: 'Emily Davis',
      relatedTo: { type: 'contact', name: 'Jennifer Martinez', id: 'contact-006' },
      tags: ['follow-up', 'relationship'],
      createdAt: '2026-01-05',
      completedAt: '2026-01-06'
    }
  ];

  const activities: Activity[] = [
    {
      id: 'act-001',
      type: 'call',
      title: 'Discovery Call',
      description: 'Initial discovery call with StartupXYZ team to understand requirements',
      user: 'James Wilson',
      timestamp: '2 hours ago',
      duration: '45 min',
      outcome: 'positive',
      relatedTo: { type: 'company', name: 'StartupXYZ' }
    },
    {
      id: 'act-002',
      type: 'email',
      title: 'Proposal Sent',
      description: 'Sent revised enterprise proposal to TechCorp stakeholders',
      user: 'Sarah Johnson',
      timestamp: '3 hours ago',
      relatedTo: { type: 'company', name: 'TechCorp Industries' }
    },
    {
      id: 'act-003',
      type: 'meeting',
      title: 'Product Demo',
      description: 'Completed 1-hour product demonstration for Healthcare Plus IT team',
      user: 'Mike Chen',
      timestamp: '5 hours ago',
      duration: '1 hr',
      outcome: 'positive',
      relatedTo: { type: 'company', name: 'Healthcare Plus' }
    },
    {
      id: 'act-004',
      type: 'note',
      title: 'Added Note',
      description: 'Documented compliance requirements for regulated industries',
      user: 'Lisa Brown',
      timestamp: '6 hours ago',
      relatedTo: { type: 'company', name: 'Global Finance Ltd' }
    },
    {
      id: 'act-005',
      type: 'deal',
      title: 'Deal Stage Updated',
      description: 'Moved Enterprise License deal to Negotiation stage',
      user: 'Sarah Johnson',
      timestamp: '8 hours ago',
      relatedTo: { type: 'deal', name: 'Manufacturing Co - Enterprise' }
    },
    {
      id: 'act-006',
      type: 'call',
      title: 'Follow-up Call',
      description: 'Called to follow up on pending contract questions',
      user: 'Emily Davis',
      timestamp: '1 day ago',
      duration: '20 min',
      outcome: 'neutral',
      relatedTo: { type: 'contact', name: 'Robert Johnson' }
    }
  ];

  const stats: TaskStats[] = [
    { label: 'Open Tasks', value: '47', change: -12, trend: 'down' },
    { label: 'Due Today', value: '8', change: 3, trend: 'up' },
    { label: 'Overdue', value: '3', change: -2, trend: 'down' },
    { label: 'Completed (Week)', value: '34', change: 18, trend: 'up' }
  ];

  const taskTypes = [
    { key: 'all', label: 'All', icon: <CheckSquare className="w-4 h-4" /> },
    { key: 'task', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { key: 'call', label: 'Calls', icon: <Phone className="w-4 h-4" /> },
    { key: 'email', label: 'Emails', icon: <Mail className="w-4 h-4" /> },
    { key: 'meeting', label: 'Meetings', icon: <Video className="w-4 h-4" /> },
    { key: 'deadline', label: 'Deadlines', icon: <Flag className="w-4 h-4" /> }
  ];

  const getTypeIcon = (type: Task['type']) => {
    switch (type) {
      case 'task': return <CheckSquare className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Video className="w-4 h-4" />;
      case 'follow-up': return <Repeat className="w-4 h-4" />;
      case 'deadline': return <Flag className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending': return <Circle className="w-4 h-4" />;
      case 'in-progress': return <Timer className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Video className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      case 'deal': return <Target className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
    }
  };

  const getRelatedIcon = (type: 'contact' | 'company' | 'deal') => {
    switch (type) {
      case 'contact': return <User className="w-3 h-3" />;
      case 'company': return <Building2 className="w-3 h-3" />;
      case 'deal': return <Target className="w-3 h-3" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.relatedTo.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === 'pending' || t.status === 'overdue'),
    inProgress: filteredTasks.filter(t => t.status === 'in-progress'),
    completed: filteredTasks.filter(t => t.status === 'completed')
  };

  return (
    <div className="tasks-container">
      {/* Header */}
      <header className="tasks-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <CheckSquare className="w-8 h-8" />
            </div>
            <div>
              <h1>Tasks & Activities</h1>
              <p>Manage your tasks, calls, meetings, and activities</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary">
              <Calendar className="w-4 h-4" />
              Sync Calendar
            </button>
            <button className="btn-primary">
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className={`stat-card ${stat.label === 'Overdue' ? 'alert' : ''}`}>
              <div className="stat-content">
                <span className="stat-label">{stat.label}</span>
                <div className="stat-row">
                  <span className="stat-value">{stat.value}</span>
                  <span className={`stat-change ${stat.trend}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {Math.abs(stat.change)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Tabs */}
      <div className="main-tabs">
        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <CheckSquare className="w-4 h-4" />
          Tasks
        </button>
        <button 
          className={`tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          <Zap className="w-4 h-4" />
          Activity Feed
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <CalendarDays className="w-4 h-4" />
          Calendar View
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="tasks-content">
          {/* Filters */}
          <div className="tasks-filters">
            <div className="search-box">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="filter-group">
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                className={`view-btn ${viewMode === 'board' ? 'active' : ''}`}
                onClick={() => setViewMode('board')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List View */}
          {viewMode === 'list' && (
            <div className="tasks-list">
              {filteredTasks.map(task => (
                <div key={task.id} className={`task-item status-${task.status} priority-${task.priority}`}>
                  <div className="task-checkbox">
                    <button className={`check-btn ${task.status === 'completed' ? 'checked' : ''}`}>
                      {task.status === 'completed' ? 
                        <CheckCircle2 className="w-5 h-5" /> : 
                        <Circle className="w-5 h-5" />
                      }
                    </button>
                  </div>
                  <div className="task-content">
                    <div className="task-header">
                      <div className={`task-type type-${task.type}`}>
                        {getTypeIcon(task.type)}
                      </div>
                      <h4 className="task-title">{task.title}</h4>
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority}
                      </span>
                      {task.recurring && (
                        <span className="recurring-badge">
                          <Repeat className="w-3 h-3" />
                          {task.recurring.frequency}
                        </span>
                      )}
                    </div>
                    <div className="task-meta">
                      <span className="related-to">
                        {getRelatedIcon(task.relatedTo.type)}
                        {task.relatedTo.name}
                      </span>
                      <span className="task-assignee">
                        <User className="w-3 h-3" />
                        {task.assignee}
                      </span>
                      <span className={`task-due ${task.status === 'overdue' ? 'overdue' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        {task.dueDate}
                        {task.dueTime && ` at ${task.dueTime}`}
                      </span>
                    </div>
                    {task.tags.length > 0 && (
                      <div className="task-tags">
                        {task.tags.map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="task-actions">
                    <button className="action-btn" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="action-btn" title="Reminder">
                      <Bell className="w-4 h-4" />
                    </button>
                    <button className="action-btn">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Board View */}
          {viewMode === 'board' && (
            <div className="tasks-board">
              <div className="board-column">
                <div className="column-header">
                  <span className="column-title">To Do</span>
                  <span className="column-count">{tasksByStatus.pending.length}</span>
                </div>
                <div className="column-tasks">
                  {tasksByStatus.pending.map(task => (
                    <div key={task.id} className={`task-card priority-${task.priority}`}>
                      <div className="card-header">
                        <div className={`task-type type-${task.type}`}>
                          {getTypeIcon(task.type)}
                        </div>
                        <span className={`priority-dot priority-${task.priority}`} />
                      </div>
                      <h4>{task.title}</h4>
                      <div className="card-meta">
                        <span className="related-to">
                          {getRelatedIcon(task.relatedTo.type)}
                          {task.relatedTo.name}
                        </span>
                      </div>
                      <div className="card-footer">
                        <span className={`due-date ${task.status === 'overdue' ? 'overdue' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                        <div className="assignee-avatar">
                          {task.assignee.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="board-column">
                <div className="column-header in-progress">
                  <span className="column-title">In Progress</span>
                  <span className="column-count">{tasksByStatus.inProgress.length}</span>
                </div>
                <div className="column-tasks">
                  {tasksByStatus.inProgress.map(task => (
                    <div key={task.id} className={`task-card priority-${task.priority}`}>
                      <div className="card-header">
                        <div className={`task-type type-${task.type}`}>
                          {getTypeIcon(task.type)}
                        </div>
                        <span className={`priority-dot priority-${task.priority}`} />
                      </div>
                      <h4>{task.title}</h4>
                      <div className="card-meta">
                        <span className="related-to">
                          {getRelatedIcon(task.relatedTo.type)}
                          {task.relatedTo.name}
                        </span>
                      </div>
                      <div className="card-footer">
                        <span className="due-date">
                          <Calendar className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                        <div className="assignee-avatar">
                          {task.assignee.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="board-column">
                <div className="column-header completed">
                  <span className="column-title">Completed</span>
                  <span className="column-count">{tasksByStatus.completed.length}</span>
                </div>
                <div className="column-tasks">
                  {tasksByStatus.completed.map(task => (
                    <div key={task.id} className={`task-card completed`}>
                      <div className="card-header">
                        <div className={`task-type type-${task.type}`}>
                          {getTypeIcon(task.type)}
                        </div>
                        <CheckCircle2 className="w-4 h-4 completed-icon" />
                      </div>
                      <h4>{task.title}</h4>
                      <div className="card-meta">
                        <span className="related-to">
                          {getRelatedIcon(task.relatedTo.type)}
                          {task.relatedTo.name}
                        </span>
                      </div>
                      <div className="card-footer">
                        <span className="due-date">
                          <CheckCircle2 className="w-3 h-3" />
                          {task.completedAt}
                        </span>
                        <div className="assignee-avatar">
                          {task.assignee.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="activities-content">
          <div className="activities-header">
            <h2>Recent Activities</h2>
            <div className="activity-filters">
              <button className="filter-chip active">All</button>
              <button className="filter-chip">Calls</button>
              <button className="filter-chip">Emails</button>
              <button className="filter-chip">Meetings</button>
              <button className="filter-chip">Notes</button>
            </div>
          </div>
          <div className="activities-timeline">
            {activities.map((activity, index) => (
              <div key={activity.id} className="activity-item">
                <div className="timeline-line" />
                <div className={`activity-icon type-${activity.type}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <h4>{activity.title}</h4>
                    {activity.outcome && (
                      <span className={`outcome-badge outcome-${activity.outcome}`}>
                        {activity.outcome}
                      </span>
                    )}
                    {activity.duration && (
                      <span className="duration-badge">
                        <Clock className="w-3 h-3" />
                        {activity.duration}
                      </span>
                    )}
                  </div>
                  <p className="activity-description">{activity.description}</p>
                  <div className="activity-meta">
                    <span className="activity-user">
                      <User className="w-3 h-3" />
                      {activity.user}
                    </span>
                    <span className="activity-related">
                      {getRelatedIcon(activity.relatedTo.type)}
                      {activity.relatedTo.name}
                    </span>
                    <span className="activity-time">
                      <Clock className="w-3 h-3" />
                      {activity.timestamp}
                    </span>
                  </div>
                </div>
                <div className="activity-actions">
                  <button className="action-btn">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="action-btn">
                    <Link2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="calendar-content">
          <div className="calendar-header">
            <h2>January 2026</h2>
            <div className="calendar-nav">
              <button className="nav-btn">&lt;</button>
              <button className="today-btn">Today</button>
              <button className="nav-btn">&gt;</button>
            </div>
          </div>
          <div className="calendar-grid">
            <div className="calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 3;
                const isCurrentMonth = day > 0 && day <= 31;
                const isToday = day === 9;
                const hasTasks = [9, 10, 11, 12, 13].includes(day);
                
                return (
                  <div 
                    key={i} 
                    className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${hasTasks ? 'has-tasks' : ''}`}
                  >
                    <span className="day-number">{isCurrentMonth ? day : day <= 0 ? 31 + day : day - 31}</span>
                    {hasTasks && (
                      <div className="day-tasks">
                        {day === 9 && <div className="task-indicator high">2 tasks</div>}
                        {day === 10 && <div className="task-indicator medium">1 task</div>}
                        {day === 11 && <div className="task-indicator low">1 task</div>}
                        {day === 12 && <div className="task-indicator medium">1 task</div>}
                        {day === 13 && <div className="task-indicator low">1 task</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="upcoming-tasks">
            <h3>Upcoming Tasks</h3>
            <div className="upcoming-list">
              {tasks.filter(t => t.status !== 'completed').slice(0, 5).map(task => (
                <div key={task.id} className="upcoming-item">
                  <div className={`task-type type-${task.type}`}>
                    {getTypeIcon(task.type)}
                  </div>
                  <div className="upcoming-info">
                    <h4>{task.title}</h4>
                    <span>{task.dueDate} {task.dueTime && `at ${task.dueTime}`}</span>
                  </div>
                  <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
