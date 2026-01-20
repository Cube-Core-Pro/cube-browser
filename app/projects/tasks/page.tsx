'use client';

import React, { useState, useEffect } from 'react';
import { 
  ListTodo,
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
  Kanban,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  Target,
  Zap,
  Activity,
  Users,
  Settings,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Star,
  Award,
  MapPin,
  Mail,
  Phone,
  Flag,
  Tag,
  Link2,
  MessageSquare,
  Paperclip,
  Play,
  Pause,
  RotateCcw,
  Check,
  CircleDot,
  Circle,
  Timer,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  LayoutList,
  CalendarDays
} from 'lucide-react';
import './tasks.css';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee: TaskAssignee;
  project: string;
  dueDate: string;
  estimatedHours: number;
  loggedHours: number;
  tags: string[];
  subtasks: SubTask[];
  attachments: number;
  comments: number;
  dependencies: string[];
  createdAt: string;
}

interface TaskAssignee {
  name: string;
  avatar?: string;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskMetrics {
  totalTasks: number;
  completed: number;
  inProgress: number;
  overdue: number;
  dueToday: number;
  avgCompletionTime: number;
  completionRate: number;
  blockedTasks: number;
}

export default function TasksPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const metrics: TaskMetrics = {
    totalTasks: 156,
    completed: 89,
    inProgress: 34,
    overdue: 8,
    dueToday: 12,
    avgCompletionTime: 3.2,
    completionRate: 57,
    blockedTasks: 5
  };

  const tasks: Task[] = [
    {
      id: '1',
      title: 'Implement AI Assistant Integration',
      description: 'Complete the OpenAI GPT-5.2 integration for the AI assistant feature',
      status: 'in_progress',
      priority: 'critical',
      assignee: { name: 'John Smith' },
      project: 'CUBE Elite v7',
      dueDate: '2024-03-15',
      estimatedHours: 40,
      loggedHours: 28,
      tags: ['AI', 'Backend', 'Priority'],
      subtasks: [
        { id: '1a', title: 'Set up OpenAI API connection', completed: true },
        { id: '1b', title: 'Implement prompt engineering', completed: true },
        { id: '1c', title: 'Create response parsing', completed: false },
        { id: '1d', title: 'Add error handling', completed: false }
      ],
      attachments: 3,
      comments: 12,
      dependencies: [],
      createdAt: '2024-02-01'
    },
    {
      id: '2',
      title: 'Design New Dashboard Layout',
      description: 'Create wireframes and mockups for the new admin dashboard',
      status: 'review',
      priority: 'high',
      assignee: { name: 'Emily Davis' },
      project: 'CUBE Elite v7',
      dueDate: '2024-03-10',
      estimatedHours: 24,
      loggedHours: 22,
      tags: ['Design', 'UI/UX'],
      subtasks: [
        { id: '2a', title: 'Research competitors', completed: true },
        { id: '2b', title: 'Create wireframes', completed: true },
        { id: '2c', title: 'Design high-fidelity mockups', completed: true },
        { id: '2d', title: 'Prepare design specs', completed: false }
      ],
      attachments: 8,
      comments: 24,
      dependencies: [],
      createdAt: '2024-02-05'
    },
    {
      id: '3',
      title: 'Set Up CI/CD Pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment',
      status: 'done',
      priority: 'high',
      assignee: { name: 'Chris Brown' },
      project: 'Infrastructure',
      dueDate: '2024-03-08',
      estimatedHours: 16,
      loggedHours: 14,
      tags: ['DevOps', 'Automation'],
      subtasks: [
        { id: '3a', title: 'Configure build workflow', completed: true },
        { id: '3b', title: 'Set up test automation', completed: true },
        { id: '3c', title: 'Configure deployment', completed: true }
      ],
      attachments: 2,
      comments: 8,
      dependencies: [],
      createdAt: '2024-02-10'
    },
    {
      id: '4',
      title: 'User Authentication Flow',
      description: 'Implement OAuth 2.0 and social login options',
      status: 'todo',
      priority: 'high',
      assignee: { name: 'Mike Johnson' },
      project: 'CUBE Elite v7',
      dueDate: '2024-03-20',
      estimatedHours: 32,
      loggedHours: 0,
      tags: ['Security', 'Backend'],
      subtasks: [
        { id: '4a', title: 'Implement OAuth 2.0', completed: false },
        { id: '4b', title: 'Add Google login', completed: false },
        { id: '4c', title: 'Add GitHub login', completed: false },
        { id: '4d', title: 'Session management', completed: false }
      ],
      attachments: 1,
      comments: 5,
      dependencies: ['1'],
      createdAt: '2024-02-15'
    },
    {
      id: '5',
      title: 'Mobile App Testing',
      description: 'Conduct QA testing for iOS and Android apps',
      status: 'in_progress',
      priority: 'medium',
      assignee: { name: 'Lisa Wong' },
      project: 'Mobile App',
      dueDate: '2024-03-18',
      estimatedHours: 48,
      loggedHours: 20,
      tags: ['QA', 'Mobile'],
      subtasks: [
        { id: '5a', title: 'iOS functional testing', completed: true },
        { id: '5b', title: 'Android functional testing', completed: false },
        { id: '5c', title: 'Performance testing', completed: false },
        { id: '5d', title: 'Security testing', completed: false }
      ],
      attachments: 5,
      comments: 16,
      dependencies: [],
      createdAt: '2024-02-20'
    },
    {
      id: '6',
      title: 'API Documentation',
      description: 'Write comprehensive API documentation using OpenAPI spec',
      status: 'backlog',
      priority: 'low',
      assignee: { name: 'Tom Wilson' },
      project: 'Documentation',
      dueDate: '2024-03-30',
      estimatedHours: 20,
      loggedHours: 0,
      tags: ['Documentation', 'API'],
      subtasks: [],
      attachments: 0,
      comments: 2,
      dependencies: ['1', '4'],
      createdAt: '2024-02-25'
    },
    {
      id: '7',
      title: 'Database Optimization',
      description: 'Optimize database queries and add indexing',
      status: 'todo',
      priority: 'medium',
      assignee: { name: 'Mike Johnson' },
      project: 'Infrastructure',
      dueDate: '2024-03-12',
      estimatedHours: 16,
      loggedHours: 0,
      tags: ['Database', 'Performance'],
      subtasks: [
        { id: '7a', title: 'Analyze slow queries', completed: false },
        { id: '7b', title: 'Add missing indexes', completed: false },
        { id: '7c', title: 'Optimize joins', completed: false }
      ],
      attachments: 1,
      comments: 4,
      dependencies: [],
      createdAt: '2024-02-28'
    },
    {
      id: '8',
      title: 'Customer Feedback Analysis',
      description: 'Review and categorize Q1 customer feedback',
      status: 'done',
      priority: 'low',
      assignee: { name: 'Sarah Chen' },
      project: 'Research',
      dueDate: '2024-03-05',
      estimatedHours: 8,
      loggedHours: 10,
      tags: ['Research', 'Customer'],
      subtasks: [],
      attachments: 4,
      comments: 6,
      dependencies: [],
      createdAt: '2024-03-01'
    }
  ];

  const projects = ['CUBE Elite v7', 'Mobile App', 'Infrastructure', 'Documentation', 'Research'];

  const getPriorityIcon = (priority: string): React.ReactNode => {
    switch (priority) {
      case 'critical': return <AlertTriangle size={14} />;
      case 'high': return <ArrowUp size={14} />;
      case 'medium': return <ArrowRight size={14} />;
      case 'low': return <ArrowDown size={14} />;
      default: return null;
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'backlog': return <Circle size={14} />;
      case 'todo': return <CircleDot size={14} />;
      case 'in_progress': return <Play size={14} />;
      case 'review': return <Eye size={14} />;
      case 'done': return <Check size={14} />;
      default: return null;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesProject = selectedProject === 'all' || task.project === selectedProject;
    return matchesSearch && matchesPriority && matchesStatus && matchesProject;
  });

  const tasksByStatus = {
    backlog: filteredTasks.filter(t => t.status === 'backlog'),
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    review: filteredTasks.filter(t => t.status === 'review'),
    done: filteredTasks.filter(t => t.status === 'done')
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <ListTodo size={28} />
            </div>
            <div>
              <h1>Task Management</h1>
              <p>Track, organize, and manage all project tasks</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-secondary">
              <Filter size={18} />
              Advanced Filter
            </button>
            <button className="btn-secondary">
              <Download size={18} />
              Export
            </button>
            <button className="btn-primary">
              <Plus size={18} />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card highlight">
            <div className="stat-icon total">
              <ListTodo size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Tasks</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.totalTasks}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon done">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Completed</span>
              <div className="stat-row">
                <span className="stat-value good">{metrics.completed}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon progress">
              <Activity size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">In Progress</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.inProgress}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon overdue">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Overdue</span>
              <div className="stat-row">
                <span className="stat-value warn">{metrics.overdue}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon today">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Due Today</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.dueToday}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon blocked">
              <XCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Blocked</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.blockedTasks}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card large">
            <div className="stat-icon rate">
              <Target size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Completion Rate</span>
              <div className="completion-bar">
                <div 
                  className="completion-fill"
                  style={{ width: `${metrics.completionRate}%` }}
                ></div>
              </div>
              <div className="completion-text">
                <span>{metrics.completionRate}%</span>
                <span>Avg. {metrics.avgCompletionTime} days</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map(proj => (
              <option key={proj} value={proj}>{proj}</option>
            ))}
          </select>
          
          <select 
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
        
        <div className="toolbar-right">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <LayoutList size={18} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban View"
            >
              <Kanban size={18} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
            >
              <CalendarDays size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="tasks-list-container">
          <div className="tasks-list">
            {filteredTasks.map((task) => (
              <div key={task.id} className={`task-item ${task.priority} ${task.status}`}>
                <div 
                  className="task-main"
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                >
                  <div className={`task-status-indicator ${task.status}`}>
                    {getStatusIcon(task.status)}
                  </div>
                  
                  <div className="task-info">
                    <div className="task-header">
                      <h3>{task.title}</h3>
                      <div className="task-badges">
                        <span className={`priority-badge ${task.priority}`}>
                          {getPriorityIcon(task.priority)}
                          {task.priority}
                        </span>
                        {task.dependencies.length > 0 && (
                          <span className="dependency-badge">
                            <Link2 size={12} />
                            {task.dependencies.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="task-meta">
                      <span className="project">
                        <Briefcase size={14} />
                        {task.project}
                      </span>
                      <span className="assignee">
                        <Users size={14} />
                        {task.assignee.name}
                      </span>
                      <span className="due-date">
                        <Calendar size={14} />
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
                  
                  <div className="task-progress">
                    <div className="progress-header">
                      <span className="progress-label">Progress</span>
                      <span className="progress-value">
                        {task.subtasks.length > 0 
                          ? Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100)
                          : task.status === 'done' ? 100 : 0
                        }%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${task.subtasks.length > 0 
                            ? (task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100
                            : task.status === 'done' ? 100 : 0
                          }%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="task-time">
                    <div className="time-info">
                      <Timer size={14} />
                      <span>{task.loggedHours}h / {task.estimatedHours}h</span>
                    </div>
                  </div>
                  
                  <div className="task-tags">
                    {task.tags.slice(0, 2).map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                    {task.tags.length > 2 && (
                      <span className="tag-more">+{task.tags.length - 2}</span>
                    )}
                  </div>
                  
                  <div className="task-stats">
                    <span className="stat" title="Subtasks">
                      <ListTodo size={14} />
                      {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                    </span>
                    <span className="stat" title="Comments">
                      <MessageSquare size={14} />
                      {task.comments}
                    </span>
                    <span className="stat" title="Attachments">
                      <Paperclip size={14} />
                      {task.attachments}
                    </span>
                  </div>
                  
                  <div className="task-actions">
                    <button className="action-btn"><Eye size={16} /></button>
                    <button className="action-btn"><Edit size={16} /></button>
                    <button className="action-btn">
                      {expandedTask === task.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
                
                {expandedTask === task.id && (
                  <div className="task-expanded">
                    <div className="expanded-grid">
                      <div className="expanded-section">
                        <h4>Description</h4>
                        <p className="task-description">{task.description}</p>
                      </div>
                      
                      <div className="expanded-section">
                        <h4>Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</h4>
                        {task.subtasks.length > 0 ? (
                          <div className="subtasks-list">
                            {task.subtasks.map((subtask) => (
                              <div key={subtask.id} className={`subtask-item ${subtask.completed ? 'completed' : ''}`}>
                                <span className="subtask-check">
                                  {subtask.completed ? <CheckCircle size={16} /> : <Circle size={16} />}
                                </span>
                                <span className="subtask-title">{subtask.title}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-subtasks">No subtasks defined</p>
                        )}
                      </div>
                      
                      <div className="expanded-section">
                        <h4>Quick Actions</h4>
                        <div className="quick-actions">
                          <button className="quick-btn">
                            <Play size={14} />
                            Start Task
                          </button>
                          <button className="quick-btn">
                            <MessageSquare size={14} />
                            Add Comment
                          </button>
                          <button className="quick-btn">
                            <Paperclip size={14} />
                            Attach File
                          </button>
                          <button className="quick-btn">
                            <Link2 size={14} />
                            Add Dependency
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
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="kanban-container">
          <div className="kanban-board">
            {[
              { key: 'backlog', label: 'Backlog', icon: <Circle size={16} /> },
              { key: 'todo', label: 'To Do', icon: <CircleDot size={16} /> },
              { key: 'in_progress', label: 'In Progress', icon: <Play size={16} /> },
              { key: 'review', label: 'Review', icon: <Eye size={16} /> },
              { key: 'done', label: 'Done', icon: <Check size={16} /> }
            ].map((column) => (
              <div key={column.key} className={`kanban-column ${column.key}`}>
                <div className="column-header">
                  <div className="column-title">
                    <span className={`column-icon ${column.key}`}>{column.icon}</span>
                    <h3>{column.label}</h3>
                    <span className="column-count">
                      {tasksByStatus[column.key as keyof typeof tasksByStatus].length}
                    </span>
                  </div>
                  <button className="column-add">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="column-tasks">
                  {tasksByStatus[column.key as keyof typeof tasksByStatus].map((task) => (
                    <div key={task.id} className={`kanban-card ${task.priority}`}>
                      <div className="card-header">
                        <span className={`priority-indicator ${task.priority}`}>
                          {getPriorityIcon(task.priority)}
                        </span>
                        <span className="card-project">{task.project}</span>
                      </div>
                      <h4 className="card-title">{task.title}</h4>
                      <div className="card-tags">
                        {task.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                      <div className="card-footer">
                        <div className="card-assignee">
                          <div className="assignee-avatar">
                            {task.assignee.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        </div>
                        <div className="card-stats">
                          {task.subtasks.length > 0 && (
                            <span>
                              <CheckCircle size={12} />
                              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                            </span>
                          )}
                          {task.comments > 0 && (
                            <span>
                              <MessageSquare size={12} />
                              {task.comments}
                            </span>
                          )}
                        </div>
                        <span className="card-due">
                          <Calendar size={12} />
                          {task.dueDate.split('-').slice(1).join('/')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="calendar-container">
          <div className="calendar-header">
            <h2>March 2024</h2>
            <div className="calendar-nav">
              <button className="nav-btn"><ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /></button>
              <button className="nav-btn today">Today</button>
              <button className="nav-btn"><ChevronRight size={18} /></button>
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
                const dayNum = i - 4;
                const isCurrentMonth = dayNum > 0 && dayNum <= 31;
                const dayTasks = tasks.filter(t => {
                  const taskDay = parseInt(t.dueDate.split('-')[2]);
                  return taskDay === dayNum;
                });
                return (
                  <div 
                    key={i} 
                    className={`calendar-day ${isCurrentMonth ? '' : 'other-month'} ${dayNum === 10 ? 'today' : ''}`}
                  >
                    <span className="day-number">{isCurrentMonth ? dayNum : ''}</span>
                    {isCurrentMonth && dayTasks.length > 0 && (
                      <div className="day-tasks">
                        {dayTasks.slice(0, 2).map(task => (
                          <div key={task.id} className={`day-task ${task.priority}`}>
                            {task.title.substring(0, 15)}...
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <span className="more-tasks">+{dayTasks.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
