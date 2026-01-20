'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  GanttChart,
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
  ChevronLeft,
  FolderOpen,
  Star,
  Flag,
  Tag,
  Link2,
  Milestone,
  CalendarDays,
  CalendarRange,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutList,
  Layers,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import './timeline.css';

interface Task {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  dependencies: string[];
  milestoneId?: string;
  color: string;
  type: 'task' | 'milestone' | 'phase';
}

interface GanttMilestone {
  id: string;
  name: string;
  date: string;
  projectId: string;
  projectName: string;
  status: 'pending' | 'completed' | 'overdue';
}

interface TimelineMetrics {
  totalTasks: number;
  onSchedule: number;
  behindSchedule: number;
  aheadOfSchedule: number;
  completedTasks: number;
  upcomingMilestones: number;
  blockedTasks: number;
  avgProgress: number;
}

export default function TimelinePage(): React.JSX.Element {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showDependencies, setShowDependencies] = useState<boolean>(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['1', '2', '3']));

  const metrics: TimelineMetrics = {
    totalTasks: 156,
    onSchedule: 98,
    behindSchedule: 24,
    aheadOfSchedule: 34,
    completedTasks: 72,
    upcomingMilestones: 8,
    blockedTasks: 5,
    avgProgress: 67
  };

  const tasks: Task[] = [
    // Project 1: CUBE Elite v7
    { id: '1', name: 'Requirements Gathering', projectId: '1', projectName: 'CUBE Elite v7', startDate: '2024-01-15', endDate: '2024-01-31', progress: 100, status: 'completed', priority: 'high', assignee: 'Sarah Chen', dependencies: [], color: '#6366f1', type: 'task' },
    { id: '2', name: 'Architecture Design', projectId: '1', projectName: 'CUBE Elite v7', startDate: '2024-02-01', endDate: '2024-02-20', progress: 100, status: 'completed', priority: 'critical', assignee: 'John Smith', dependencies: ['1'], color: '#6366f1', type: 'task' },
    { id: '3', name: 'Alpha Development', projectId: '1', projectName: 'CUBE Elite v7', startDate: '2024-02-21', endDate: '2024-03-15', progress: 85, status: 'in_progress', priority: 'critical', assignee: 'Mike Johnson', dependencies: ['2'], color: '#6366f1', type: 'phase' },
    { id: 'm1', name: 'Alpha Release', projectId: '1', projectName: 'CUBE Elite v7', startDate: '2024-03-15', endDate: '2024-03-15', progress: 0, status: 'not_started', priority: 'critical', assignee: '', dependencies: ['3'], color: '#f59e0b', type: 'milestone', milestoneId: 'm1' },
    { id: '4', name: 'Beta Development', projectId: '1', projectName: 'CUBE Elite v7', startDate: '2024-03-16', endDate: '2024-04-30', progress: 20, status: 'in_progress', priority: 'high', assignee: 'Emily Davis', dependencies: ['m1'], color: '#6366f1', type: 'phase' },
    { id: '5', name: 'UI/UX Refinement', projectId: '1', projectName: 'CUBE Elite v7', startDate: '2024-04-01', endDate: '2024-04-20', progress: 45, status: 'in_progress', priority: 'medium', assignee: 'Lisa Wong', dependencies: ['3'], color: '#6366f1', type: 'task' },
    { id: 'm2', name: 'Beta Release', projectId: '1', projectName: 'CUBE Elite v7', startDate: '2024-04-30', endDate: '2024-04-30', progress: 0, status: 'not_started', priority: 'critical', assignee: '', dependencies: ['4', '5'], color: '#f59e0b', type: 'milestone', milestoneId: 'm2' },
    
    // Project 2: Mobile App Redesign
    { id: '6', name: 'Design Research', projectId: '2', projectName: 'Mobile App Redesign', startDate: '2024-02-01', endDate: '2024-02-15', progress: 100, status: 'completed', priority: 'high', assignee: 'Tom Wilson', dependencies: [], color: '#10b981', type: 'task' },
    { id: '7', name: 'Wireframing', projectId: '2', projectName: 'Mobile App Redesign', startDate: '2024-02-16', endDate: '2024-03-01', progress: 100, status: 'completed', priority: 'medium', assignee: 'Anna Kim', dependencies: ['6'], color: '#10b981', type: 'task' },
    { id: '8', name: 'Visual Design', projectId: '2', projectName: 'Mobile App Redesign', startDate: '2024-03-02', endDate: '2024-03-20', progress: 60, status: 'in_progress', priority: 'high', assignee: 'Tom Wilson', dependencies: ['7'], color: '#10b981', type: 'task' },
    { id: 'm3', name: 'Design Approval', projectId: '2', projectName: 'Mobile App Redesign', startDate: '2024-03-20', endDate: '2024-03-20', progress: 0, status: 'not_started', priority: 'high', assignee: '', dependencies: ['8'], color: '#f59e0b', type: 'milestone', milestoneId: 'm3' },
    { id: '9', name: 'iOS Development', projectId: '2', projectName: 'Mobile App Redesign', startDate: '2024-03-21', endDate: '2024-05-01', progress: 15, status: 'in_progress', priority: 'critical', assignee: 'Anna Kim', dependencies: ['m3'], color: '#10b981', type: 'phase' },
    { id: '10', name: 'Android Development', projectId: '2', projectName: 'Mobile App Redesign', startDate: '2024-03-21', endDate: '2024-05-01', progress: 10, status: 'in_progress', priority: 'critical', assignee: 'Ryan Garcia', dependencies: ['m3'], color: '#10b981', type: 'phase' },
    
    // Project 3: Cloud Migration
    { id: '11', name: 'Infrastructure Assessment', projectId: '3', projectName: 'Cloud Migration', startDate: '2024-01-01', endDate: '2024-01-20', progress: 100, status: 'completed', priority: 'high', assignee: 'Chris Brown', dependencies: [], color: '#ec4899', type: 'task' },
    { id: '12', name: 'Migration Planning', projectId: '3', projectName: 'Cloud Migration', startDate: '2024-01-21', endDate: '2024-02-10', progress: 100, status: 'completed', priority: 'critical', assignee: 'Jessica Taylor', dependencies: ['11'], color: '#ec4899', type: 'task' },
    { id: '13', name: 'Phase 1 Migration', projectId: '3', projectName: 'Cloud Migration', startDate: '2024-02-11', endDate: '2024-02-28', progress: 100, status: 'completed', priority: 'critical', assignee: 'Kevin Martinez', dependencies: ['12'], color: '#ec4899', type: 'phase' },
    { id: 'm4', name: 'Phase 1 Complete', projectId: '3', projectName: 'Cloud Migration', startDate: '2024-02-28', endDate: '2024-02-28', progress: 100, status: 'completed', priority: 'critical', assignee: '', dependencies: ['13'], color: '#10b981', type: 'milestone', milestoneId: 'm4' },
    { id: '14', name: 'Phase 2 Migration', projectId: '3', projectName: 'Cloud Migration', startDate: '2024-03-01', endDate: '2024-03-25', progress: 80, status: 'in_progress', priority: 'critical', assignee: 'Chris Brown', dependencies: ['m4'], color: '#ec4899', type: 'phase' },
    { id: '15', name: 'Testing & Validation', projectId: '3', projectName: 'Cloud Migration', startDate: '2024-03-26', endDate: '2024-04-15', progress: 0, status: 'not_started', priority: 'high', assignee: 'Jessica Taylor', dependencies: ['14'], color: '#ec4899', type: 'task' }
  ];

  const milestones: GanttMilestone[] = [
    { id: 'm1', name: 'Alpha Release', date: '2024-03-15', projectId: '1', projectName: 'CUBE Elite v7', status: 'pending' },
    { id: 'm2', name: 'Beta Release', date: '2024-04-30', projectId: '1', projectName: 'CUBE Elite v7', status: 'pending' },
    { id: 'm3', name: 'Design Approval', date: '2024-03-20', projectId: '2', projectName: 'Mobile App Redesign', status: 'pending' },
    { id: 'm4', name: 'Phase 1 Complete', date: '2024-02-28', projectId: '3', projectName: 'Cloud Migration', status: 'completed' },
    { id: 'm5', name: 'Final Cutover', date: '2024-04-30', projectId: '3', projectName: 'Cloud Migration', status: 'pending' }
  ];

  const projects = [
    { id: '1', name: 'CUBE Elite v7', color: '#6366f1' },
    { id: '2', name: 'Mobile App Redesign', color: '#10b981' },
    { id: '3', name: 'Cloud Migration', color: '#ec4899' }
  ];

  const getDateRange = (): Date[] => {
    const dates: Date[] = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - 7);
    
    let daysToShow = viewMode === 'day' ? 14 : viewMode === 'week' ? 56 : 90;
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = useMemo(() => getDateRange(), [currentDate, viewMode]);

  const getTaskPosition = (task: Task): { left: number; width: number } => {
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const startOffset = Math.max(0, Math.ceil((startDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const left = (startOffset / totalDays) * 100;
    const width = Math.max((duration / totalDays) * 100, 1);
    
    return { left, width };
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const toggleProject = (projectId: string): void => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const navigateTimeline = (direction: 'prev' | 'next'): void => {
    const newDate = new Date(currentDate);
    const daysToMove = viewMode === 'day' ? 7 : viewMode === 'week' ? 14 : 30;
    newDate.setDate(newDate.getDate() + (direction === 'next' ? daysToMove : -daysToMove));
    setCurrentDate(newDate);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'not_started': 'status-not-started',
      'in_progress': 'status-in-progress',
      'completed': 'status-completed',
      'blocked': 'status-blocked',
      'on_hold': 'status-on-hold'
    };
    return colors[status] || '';
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === 'all' || task.projectId === selectedProject;
    return matchesSearch && matchesProject;
  });

  const groupedTasks = projects.map(project => ({
    ...project,
    tasks: filteredTasks.filter(t => t.projectId === project.id)
  }));

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <GanttChart size={28} />
            </div>
            <div>
              <h1>Project Timeline</h1>
              <p>Gantt chart view of all project tasks and milestones</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-secondary">
              <Download size={18} />
              Export
            </button>
            <button className="btn-secondary">
              <Maximize2 size={18} />
              Full Screen
            </button>
            <button className="btn-primary">
              <Plus size={18} />
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <LayoutList size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Tasks</span>
              <span className="stat-value">{metrics.totalTasks}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon on-track">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">On Schedule</span>
              <div className="stat-row">
                <span className="stat-value good">{metrics.onSchedule}</span>
                <span className="stat-percent">{Math.round((metrics.onSchedule / metrics.totalTasks) * 100)}%</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon behind">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Behind Schedule</span>
              <span className="stat-value warn">{metrics.behindSchedule}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon ahead">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Ahead of Schedule</span>
              <span className="stat-value">{metrics.aheadOfSchedule}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon completed">
              <Target size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{metrics.completedTasks}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon milestone">
              <Milestone size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Upcoming Milestones</span>
              <span className="stat-value">{metrics.upcomingMilestones}</span>
            </div>
          </div>
          
          <div className="stat-card alert">
            <div className="stat-icon blocked">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Blocked</span>
              <span className="stat-value danger">{metrics.blockedTasks}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon progress">
              <Activity size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Avg. Progress</span>
              <span className="stat-value">{metrics.avgProgress}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Controls */}
      <div className="timeline-controls">
        <div className="controls-left">
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
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        
        <div className="controls-center">
          <button className="nav-btn" onClick={() => navigateTimeline('prev')}>
            <ChevronLeft size={20} />
          </button>
          <button className="today-btn" onClick={() => setCurrentDate(new Date())}>
            Today
          </button>
          <button className="nav-btn" onClick={() => navigateTimeline('next')}>
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="controls-right">
          <div className="view-toggle">
            <button 
              className={viewMode === 'day' ? 'active' : ''}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button 
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button 
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
          
          <div className="zoom-controls">
            <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}>
              <ZoomOut size={18} />
            </button>
            <span>{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}>
              <ZoomIn size={18} />
            </button>
          </div>
          
          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={showDependencies}
              onChange={(e) => setShowDependencies(e.target.checked)}
            />
            <span>Dependencies</span>
          </label>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="gantt-wrapper">
        <div className="gantt-chart" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
          {/* Header */}
          <div className="gantt-header">
            <div className="gantt-sidebar-header">
              <span>Tasks</span>
            </div>
            <div className="gantt-timeline-header">
              <div className="timeline-dates">
                {dates.map((date, index) => {
                  if (viewMode === 'week' && date.getDay() !== 1 && index !== 0) return null;
                  if (viewMode === 'month' && date.getDate() !== 1 && index !== 0) return null;
                  return (
                    <div 
                      key={index} 
                      className={`date-cell ${isToday(date) ? 'today' : ''} ${isWeekend(date) ? 'weekend' : ''}`}
                      style={{ 
                        width: viewMode === 'day' ? '40px' : viewMode === 'week' ? '280px' : '120px'
                      }}
                    >
                      {viewMode === 'month' 
                        ? date.toLocaleDateString('en-US', { month: 'short' })
                        : formatDate(date)
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="gantt-body">
            {groupedTasks.map((project) => (
              <div key={project.id} className="project-group">
                <div 
                  className="project-row"
                  onClick={() => toggleProject(project.id)}
                >
                  <div className="gantt-sidebar">
                    <div className="project-toggle">
                      {expandedProjects.has(project.id) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>
                    <div 
                      className="project-color"
                      style={{ background: project.color }}
                    ></div>
                    <span className="project-name">{project.name}</span>
                    <span className="task-count">{project.tasks.length} tasks</span>
                  </div>
                  <div className="gantt-timeline">
                    <div className="timeline-bg">
                      {dates.map((date, index) => (
                        <div 
                          key={index} 
                          className={`grid-cell ${isToday(date) ? 'today' : ''} ${isWeekend(date) ? 'weekend' : ''}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {expandedProjects.has(project.id) && project.tasks.map((task) => {
                  const position = getTaskPosition(task);
                  return (
                    <div key={task.id} className="task-row">
                      <div className="gantt-sidebar">
                        <div className="task-indent"></div>
                        <span className={`task-type ${task.type}`}>
                          {task.type === 'milestone' ? (
                            <Milestone size={14} />
                          ) : task.type === 'phase' ? (
                            <Layers size={14} />
                          ) : (
                            <LayoutList size={14} />
                          )}
                        </span>
                        <span className="task-name" title={task.name}>{task.name}</span>
                        <span className={`task-status ${getStatusColor(task.status)}`}>
                          {task.progress}%
                        </span>
                      </div>
                      <div className="gantt-timeline">
                        <div className="timeline-bg">
                          {dates.map((date, index) => (
                            <div 
                              key={index} 
                              className={`grid-cell ${isToday(date) ? 'today' : ''} ${isWeekend(date) ? 'weekend' : ''}`}
                            ></div>
                          ))}
                        </div>
                        <div className="task-bars">
                          {task.type === 'milestone' ? (
                            <div 
                              className="milestone-marker"
                              style={{ left: `${position.left}%` }}
                              title={`${task.name} - ${task.startDate}`}
                            >
                              <div className="milestone-diamond" style={{ background: task.color }}>
                                <Milestone size={12} />
                              </div>
                            </div>
                          ) : (
                            <div 
                              className={`task-bar ${task.type} ${task.status}`}
                              style={{ 
                                left: `${position.left}%`, 
                                width: `${position.width}%`,
                                background: task.status === 'completed' 
                                  ? `linear-gradient(90deg, ${task.color}90, ${task.color}70)`
                                  : `linear-gradient(90deg, ${task.color}, ${task.color}90)`
                              }}
                              title={`${task.name} (${task.progress}%)`}
                            >
                              <div 
                                className="progress-fill"
                                style={{ width: `${task.progress}%` }}
                              ></div>
                              <span className="bar-label">{task.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestones Section */}
      <section className="milestones-section">
        <h2>
          <Milestone size={20} />
          Upcoming Milestones
        </h2>
        <div className="milestones-grid">
          {milestones.filter(m => m.status !== 'completed').slice(0, 4).map((milestone) => (
            <div key={milestone.id} className={`milestone-card ${milestone.status}`}>
              <div className="milestone-icon">
                <Milestone size={24} />
              </div>
              <div className="milestone-info">
                <h3>{milestone.name}</h3>
                <span className="milestone-project">{milestone.projectName}</span>
                <div className="milestone-date">
                  <Calendar size={14} />
                  {milestone.date}
                </div>
              </div>
              <span className={`milestone-status ${milestone.status}`}>
                {milestone.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
