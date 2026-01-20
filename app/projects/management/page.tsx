'use client';

import React, { useState, useEffect } from 'react';
import { 
  FolderKanban,
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
  FolderOpen,
  Star,
  Archive,
  Flag,
  Tag,
  Link2,
  Paperclip,
  MessageSquare,
  ListTodo,
  LayoutGrid,
  Layers,
  Kanban,
  GanttChart,
  PlayCircle,
  PauseCircle,
  StopCircle,
  CircleDot,
  Milestone,
  GitBranch,
  UserCheck,
  UserPlus,
  CalendarClock,
  CalendarCheck,
  Percent,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import './management.css';

interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate: string;
  progress: number;
  budget: number;
  spent: number;
  manager: TeamMember;
  team: TeamMember[];
  tasksTotal: number;
  tasksCompleted: number;
  milestones: Milestone[];
  lastActivity: string;
  category: string;
  tags: string[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface Milestone {
  id: string;
  name: string;
  date: string;
  status: 'pending' | 'completed' | 'overdue';
}

interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedThisMonth: number;
  overallProgress: number;
  totalBudget: number;
  totalSpent: number;
  onTrack: number;
  atRisk: number;
  overdue: number;
  teamUtilization: number;
}

export default function ProjectManagementPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const metrics: ProjectMetrics = {
    totalProjects: 48,
    activeProjects: 24,
    completedThisMonth: 6,
    overallProgress: 67,
    totalBudget: 2450000,
    totalSpent: 1680000,
    onTrack: 18,
    atRisk: 4,
    overdue: 2,
    teamUtilization: 84
  };

  const projects: Project[] = [
    {
      id: '1',
      name: 'CUBE Elite v7 Development',
      code: 'PRJ-2024-001',
      description: 'Next-generation enterprise automation platform with AI integration',
      status: 'active',
      priority: 'critical',
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      progress: 45,
      budget: 450000,
      spent: 185000,
      manager: { id: '1', name: 'Sarah Chen', role: 'Project Manager' },
      team: [
        { id: '2', name: 'John Smith', role: 'Lead Developer' },
        { id: '3', name: 'Emily Davis', role: 'UI/UX Designer' },
        { id: '4', name: 'Mike Johnson', role: 'Backend Developer' },
        { id: '5', name: 'Lisa Wong', role: 'QA Engineer' }
      ],
      tasksTotal: 156,
      tasksCompleted: 72,
      milestones: [
        { id: '1', name: 'Alpha Release', date: '2024-03-01', status: 'completed' },
        { id: '2', name: 'Beta Release', date: '2024-04-15', status: 'pending' },
        { id: '3', name: 'Production Release', date: '2024-06-30', status: 'pending' }
      ],
      lastActivity: '2 hours ago',
      category: 'Product Development',
      tags: ['AI', 'Enterprise', 'Automation']
    },
    {
      id: '2',
      name: 'Mobile App Redesign',
      code: 'PRJ-2024-002',
      description: 'Complete redesign of mobile application with new UX patterns',
      status: 'active',
      priority: 'high',
      startDate: '2024-02-01',
      endDate: '2024-05-15',
      progress: 35,
      budget: 180000,
      spent: 62000,
      manager: { id: '6', name: 'David Park', role: 'Project Manager' },
      team: [
        { id: '7', name: 'Anna Kim', role: 'Mobile Developer' },
        { id: '8', name: 'Tom Wilson', role: 'UI Designer' }
      ],
      tasksTotal: 89,
      tasksCompleted: 31,
      milestones: [
        { id: '1', name: 'Design Approval', date: '2024-03-01', status: 'completed' },
        { id: '2', name: 'Development Complete', date: '2024-04-30', status: 'pending' }
      ],
      lastActivity: '4 hours ago',
      category: 'Mobile',
      tags: ['Mobile', 'UX', 'iOS', 'Android']
    },
    {
      id: '3',
      name: 'Cloud Infrastructure Migration',
      code: 'PRJ-2024-003',
      description: 'Migration of legacy infrastructure to cloud-native architecture',
      status: 'active',
      priority: 'high',
      startDate: '2024-01-01',
      endDate: '2024-04-30',
      progress: 72,
      budget: 320000,
      spent: 245000,
      manager: { id: '9', name: 'Robert Lee', role: 'Technical Lead' },
      team: [
        { id: '10', name: 'Chris Brown', role: 'DevOps Engineer' },
        { id: '11', name: 'Jessica Taylor', role: 'Cloud Architect' },
        { id: '12', name: 'Kevin Martinez', role: 'SRE' }
      ],
      tasksTotal: 112,
      tasksCompleted: 81,
      milestones: [
        { id: '1', name: 'Phase 1 Migration', date: '2024-02-15', status: 'completed' },
        { id: '2', name: 'Phase 2 Migration', date: '2024-03-31', status: 'completed' },
        { id: '3', name: 'Final Cutover', date: '2024-04-30', status: 'pending' }
      ],
      lastActivity: '30 minutes ago',
      category: 'Infrastructure',
      tags: ['Cloud', 'AWS', 'Migration', 'DevOps']
    },
    {
      id: '4',
      name: 'Customer Portal Enhancement',
      code: 'PRJ-2024-004',
      description: 'Adding new features and improving customer self-service portal',
      status: 'on_hold',
      priority: 'medium',
      startDate: '2024-02-15',
      endDate: '2024-06-15',
      progress: 22,
      budget: 95000,
      spent: 28000,
      manager: { id: '13', name: 'Michelle Adams', role: 'Product Owner' },
      team: [
        { id: '14', name: 'Ryan Garcia', role: 'Full Stack Developer' },
        { id: '15', name: 'Nicole Chen', role: 'Frontend Developer' }
      ],
      tasksTotal: 67,
      tasksCompleted: 15,
      milestones: [
        { id: '1', name: 'Requirements Complete', date: '2024-03-01', status: 'completed' },
        { id: '2', name: 'MVP Launch', date: '2024-05-01', status: 'pending' }
      ],
      lastActivity: '3 days ago',
      category: 'Web Application',
      tags: ['Portal', 'Customer', 'Self-Service']
    },
    {
      id: '5',
      name: 'Security Compliance Audit',
      code: 'PRJ-2024-005',
      description: 'SOC 2 Type II compliance preparation and audit',
      status: 'active',
      priority: 'critical',
      startDate: '2024-01-20',
      endDate: '2024-03-31',
      progress: 88,
      budget: 75000,
      spent: 68000,
      manager: { id: '16', name: 'James Wilson', role: 'Security Manager' },
      team: [
        { id: '17', name: 'Amy Thompson', role: 'Compliance Analyst' },
        { id: '18', name: 'Mark Stevens', role: 'Security Engineer' }
      ],
      tasksTotal: 45,
      tasksCompleted: 40,
      milestones: [
        { id: '1', name: 'Gap Analysis', date: '2024-02-15', status: 'completed' },
        { id: '2', name: 'Remediation Complete', date: '2024-03-15', status: 'completed' },
        { id: '3', name: 'Audit Complete', date: '2024-03-31', status: 'pending' }
      ],
      lastActivity: '1 hour ago',
      category: 'Compliance',
      tags: ['Security', 'SOC2', 'Compliance', 'Audit']
    },
    {
      id: '6',
      name: 'API Gateway Implementation',
      code: 'PRJ-2024-006',
      description: 'New centralized API gateway for microservices architecture',
      status: 'completed',
      priority: 'high',
      startDate: '2023-11-01',
      endDate: '2024-02-15',
      progress: 100,
      budget: 125000,
      spent: 118000,
      manager: { id: '19', name: 'Daniel Brooks', role: 'Tech Lead' },
      team: [
        { id: '20', name: 'Sophia Lee', role: 'Backend Developer' },
        { id: '21', name: 'Alex Turner', role: 'API Architect' }
      ],
      tasksTotal: 78,
      tasksCompleted: 78,
      milestones: [
        { id: '1', name: 'Design Complete', date: '2023-11-30', status: 'completed' },
        { id: '2', name: 'Implementation', date: '2024-01-31', status: 'completed' },
        { id: '3', name: 'Production Deploy', date: '2024-02-15', status: 'completed' }
      ],
      lastActivity: '5 days ago',
      category: 'Infrastructure',
      tags: ['API', 'Microservices', 'Gateway']
    }
  ];

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'planning': 'status-planning',
      'active': 'status-active',
      'on_hold': 'status-hold',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
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

  const getStatusIcon = (status: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'planning': <CircleDot size={14} />,
      'active': <PlayCircle size={14} />,
      'on_hold': <PauseCircle size={14} />,
      'completed': <CheckCircle size={14} />,
      'cancelled': <StopCircle size={14} />
    };
    return icons[status] || null;
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = selectedPriority === 'all' || project.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && project.status === 'active') ||
                      (activeTab === 'completed' && project.status === 'completed') ||
                      (activeTab === 'archived' && (project.status === 'cancelled' || project.status === 'on_hold'));
    return matchesSearch && matchesPriority && matchesStatus && matchesTab;
  });

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return 'progress-high';
    if (progress >= 50) return 'progress-medium';
    return 'progress-low';
  };

  const getBudgetStatus = (budget: number, spent: number): string => {
    const ratio = spent / budget;
    if (ratio > 0.9) return 'budget-danger';
    if (ratio > 0.75) return 'budget-warning';
    return 'budget-good';
  };

  return (
    <div className="project-management-container">
      <div className="project-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <FolderKanban size={28} />
            </div>
            <div>
              <h1>Project Management</h1>
              <p>Plan, track, and deliver projects on time</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-secondary">
              <Download size={18} />
              Export
            </button>
            <button className="btn-secondary">
              <GanttChart size={18} />
              Timeline
            </button>
            <button className="btn-primary">
              <Plus size={18} />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card highlight">
            <div className="stat-icon total">
              <FolderOpen size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Projects</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.totalProjects}</span>
                <span className="stat-badge active">{metrics.activeProjects} active</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon progress-icon">
              <Percent size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Overall Progress</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.overallProgress}%</span>
                <div className="mini-progress">
                  <div className="mini-progress-fill" style={{ width: `${metrics.overallProgress}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon completed">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Completed (Month)</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.completedThisMonth}</span>
                <span className="stat-change up">
                  <TrendingUp size={14} />
                  +2
                </span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon budget">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Budget Utilization</span>
              <div className="stat-row">
                <span className="stat-value">${(metrics.totalSpent / 1000000).toFixed(2)}M</span>
                <span className="stat-sub">of ${(metrics.totalBudget / 1000000).toFixed(2)}M</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon on-track">
              <Target size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">On Track</span>
              <div className="stat-row">
                <span className="stat-value good">{metrics.onTrack}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon at-risk">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">At Risk</span>
              <div className="stat-row">
                <span className="stat-value warn">{metrics.atRisk}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card alert">
            <div className="stat-icon overdue">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Overdue</span>
              <div className="stat-row">
                <span className="stat-value danger">{metrics.overdue}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon team">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Team Utilization</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.teamUtilization}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs */}
      <div className="main-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Layers size={18} />
          All Projects
        </button>
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <PlayCircle size={18} />
          Active
          <span className="tab-badge">{metrics.activeProjects}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <CheckCircle size={18} />
          Completed
        </button>
        <button 
          className={`tab-btn ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          <Archive size={18} />
          On Hold/Archived
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select 
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
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
            <List size={18} />
          </button>
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
          >
            <Kanban size={18} />
          </button>
        </div>
      </div>

      {/* Projects List View */}
      {viewMode === 'list' && (
        <div className="projects-list">
          {filteredProjects.map((project) => (
            <div key={project.id} className={`project-item ${project.status} ${project.priority}`}>
              <div 
                className="project-main"
                onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
              >
                <div className="project-priority">
                  <span className={`priority-indicator ${getPriorityColor(project.priority)}`}></span>
                </div>
                
                <div className="project-info">
                  <div className="project-header">
                    <div className="project-title">
                      <span className="project-code">{project.code}</span>
                      <h3>{project.name}</h3>
                    </div>
                    <div className="project-badges">
                      <span className={`status-badge ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        {project.status.replace('_', ' ')}
                      </span>
                      <span className={`priority-badge ${getPriorityColor(project.priority)}`}>
                        <Flag size={12} />
                        {project.priority}
                      </span>
                    </div>
                  </div>
                  <p className="project-description">{project.description}</p>
                  <div className="project-meta">
                    <span className="meta-item">
                      <Calendar size={14} />
                      {project.startDate} → {project.endDate}
                    </span>
                    <span className="meta-item">
                      <Tag size={14} />
                      {project.category}
                    </span>
                    <span className="meta-item">
                      <Clock size={14} />
                      {project.lastActivity}
                    </span>
                  </div>
                </div>
                
                <div className="project-progress-section">
                  <div className="progress-header">
                    <span className="progress-label">Progress</span>
                    <span className="progress-value">{project.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${getProgressColor(project.progress)}`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <div className="tasks-count">
                    <ListTodo size={14} />
                    {project.tasksCompleted}/{project.tasksTotal} tasks
                  </div>
                </div>
                
                <div className="project-budget">
                  <div className="budget-header">
                    <span className="budget-label">Budget</span>
                  </div>
                  <div className={`budget-info ${getBudgetStatus(project.budget, project.spent)}`}>
                    <span className="budget-spent">${(project.spent / 1000).toFixed(0)}K</span>
                    <span className="budget-separator">/</span>
                    <span className="budget-total">${(project.budget / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="budget-bar">
                    <div 
                      className={`budget-fill ${getBudgetStatus(project.budget, project.spent)}`}
                      style={{ width: `${(project.spent / project.budget) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="project-team">
                  <div className="team-avatars">
                    {project.team.slice(0, 3).map((member, index) => (
                      <div 
                        key={member.id} 
                        className="team-avatar"
                        style={{ zIndex: 3 - index }}
                        title={member.name}
                      >
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    ))}
                    {project.team.length > 3 && (
                      <div className="team-avatar more">
                        +{project.team.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="team-manager">
                    <UserCheck size={14} />
                    {project.manager.name}
                  </span>
                </div>
                
                <div className="project-actions">
                  <button className="action-btn"><Eye size={16} /></button>
                  <button className="action-btn"><Edit size={16} /></button>
                  <button className="action-btn">
                    {expandedProject === project.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
              
              {expandedProject === project.id && (
                <div className="project-expanded">
                  <div className="expanded-grid">
                    <div className="expanded-section milestones-section">
                      <h4>
                        <Milestone size={16} />
                        Milestones
                      </h4>
                      <div className="milestones-list">
                        {project.milestones.map((milestone) => (
                          <div key={milestone.id} className={`milestone-item ${milestone.status}`}>
                            <span className={`milestone-indicator ${milestone.status}`}></span>
                            <span className="milestone-name">{milestone.name}</span>
                            <span className="milestone-date">{milestone.date}</span>
                            <span className={`milestone-status ${milestone.status}`}>
                              {milestone.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="expanded-section team-section">
                      <h4>
                        <Users size={16} />
                        Team Members
                      </h4>
                      <div className="team-list">
                        <div className="team-member manager">
                          <div className="member-avatar">
                            {project.manager.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="member-info">
                            <span className="member-name">{project.manager.name}</span>
                            <span className="member-role">{project.manager.role}</span>
                          </div>
                        </div>
                        {project.team.map((member) => (
                          <div key={member.id} className="team-member">
                            <div className="member-avatar">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="member-info">
                              <span className="member-name">{member.name}</span>
                              <span className="member-role">{member.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="expanded-section tags-section">
                      <h4>
                        <Tag size={16} />
                        Tags
                      </h4>
                      <div className="tags-list">
                        {project.tags.map((tag, index) => (
                          <span key={index} className="tag-item">{tag}</span>
                        ))}
                      </div>
                      
                      <h4 className="actions-title">
                        <Zap size={16} />
                        Quick Actions
                      </h4>
                      <div className="quick-actions">
                        <button className="quick-btn">
                          <ListTodo size={14} />
                          View Tasks
                        </button>
                        <button className="quick-btn">
                          <GanttChart size={14} />
                          Timeline
                        </button>
                        <button className="quick-btn">
                          <MessageSquare size={14} />
                          Discussion
                        </button>
                        <button className="quick-btn">
                          <Paperclip size={14} />
                          Files
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className={`project-card ${project.status} ${project.priority}`}>
              <div className="card-header">
                <div className="card-badges">
                  <span className={`status-badge ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    {project.status.replace('_', ' ')}
                  </span>
                  <span className={`priority-badge ${getPriorityColor(project.priority)}`}>
                    <Flag size={12} />
                    {project.priority}
                  </span>
                </div>
                <button className="action-btn"><MoreVertical size={16} /></button>
              </div>
              
              <div className="card-body">
                <span className="project-code">{project.code}</span>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                
                <div className="card-progress">
                  <div className="progress-info">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${getProgressColor(project.progress)}`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="card-meta">
                  <div className="meta-row">
                    <Calendar size={14} />
                    <span>{project.endDate}</span>
                  </div>
                  <div className="meta-row">
                    <ListTodo size={14} />
                    <span>{project.tasksCompleted}/{project.tasksTotal}</span>
                  </div>
                </div>
              </div>
              
              <div className="card-footer">
                <div className="team-avatars">
                  {project.team.slice(0, 3).map((member, index) => (
                    <div 
                      key={member.id} 
                      className="team-avatar"
                      style={{ zIndex: 3 - index }}
                    >
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                  {project.team.length > 3 && (
                    <div className="team-avatar more">+{project.team.length - 3}</div>
                  )}
                </div>
                <button className="view-btn">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="kanban-board">
          {['planning', 'active', 'on_hold', 'completed'].map((status) => (
            <div key={status} className="kanban-column">
              <div className="column-header">
                <span className={`column-indicator ${status}`}></span>
                <h3>{status.replace('_', ' ')}</h3>
                <span className="column-count">
                  {projects.filter(p => p.status === status).length}
                </span>
              </div>
              <div className="column-content">
                {projects.filter(p => p.status === status).map((project) => (
                  <div key={project.id} className={`kanban-card ${project.priority}`}>
                    <div className="kanban-card-header">
                      <span className="project-code">{project.code}</span>
                      <span className={`priority-badge ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                    </div>
                    <h4>{project.name}</h4>
                    <div className="kanban-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${getProgressColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="kanban-footer">
                      <div className="team-avatars mini">
                        {project.team.slice(0, 2).map((member, index) => (
                          <div key={member.id} className="team-avatar" style={{ zIndex: 2 - index }}>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        ))}
                      </div>
                      <span className="due-date">
                        <Calendar size={12} />
                        {project.endDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
