'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users2,
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
  Briefcase,
  Star,
  Award,
  MapPin,
  Mail,
  Phone,
  CalendarDays,
  CalendarRange,
  Percent,
  UserPlus,
  UserMinus,
  UserCheck,
  FolderKanban,
  Layers,
  PieChart,
  BarChart2,
  TrendingDown as Trend,
  CircleDot
} from 'lucide-react';
import './resources.css';

interface Resource {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  skills: string[];
  availability: number;
  utilization: number;
  hourlyRate: number;
  allocatedProjects: ProjectAllocation[];
  status: 'available' | 'partially_available' | 'fully_allocated' | 'on_leave';
  avatar?: string;
}

interface ProjectAllocation {
  projectId: string;
  projectName: string;
  allocation: number;
  role: string;
  startDate: string;
  endDate: string;
}

interface ResourceMetrics {
  totalResources: number;
  available: number;
  fullyAllocated: number;
  onLeave: number;
  avgUtilization: number;
  overAllocated: number;
  totalCapacity: number;
  usedCapacity: number;
}

interface SkillGap {
  skill: string;
  required: number;
  available: number;
  gap: number;
}

export default function ResourcesPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('team');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  const metrics: ResourceMetrics = {
    totalResources: 48,
    available: 12,
    fullyAllocated: 28,
    onLeave: 3,
    avgUtilization: 78,
    overAllocated: 5,
    totalCapacity: 1920,
    usedCapacity: 1498
  };

  const resources: Resource[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 's.chen@company.com',
      role: 'Senior Project Manager',
      department: 'Project Management',
      skills: ['Agile', 'Scrum', 'Risk Management', 'Stakeholder Communication'],
      availability: 100,
      utilization: 95,
      hourlyRate: 150,
      status: 'fully_allocated',
      allocatedProjects: [
        { projectId: '1', projectName: 'CUBE Elite v7', allocation: 60, role: 'Project Manager', startDate: '2024-01-15', endDate: '2024-06-30' },
        { projectId: '2', projectName: 'Mobile App Redesign', allocation: 35, role: 'Project Advisor', startDate: '2024-02-01', endDate: '2024-05-15' }
      ]
    },
    {
      id: '2',
      name: 'John Smith',
      email: 'j.smith@company.com',
      role: 'Lead Developer',
      department: 'Engineering',
      skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'System Architecture'],
      availability: 100,
      utilization: 85,
      hourlyRate: 175,
      status: 'fully_allocated',
      allocatedProjects: [
        { projectId: '1', projectName: 'CUBE Elite v7', allocation: 85, role: 'Tech Lead', startDate: '2024-01-15', endDate: '2024-06-30' }
      ]
    },
    {
      id: '3',
      name: 'Emily Davis',
      email: 'e.davis@company.com',
      role: 'UI/UX Designer',
      department: 'Design',
      skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Accessibility'],
      availability: 100,
      utilization: 70,
      hourlyRate: 125,
      status: 'partially_available',
      allocatedProjects: [
        { projectId: '1', projectName: 'CUBE Elite v7', allocation: 50, role: 'Lead Designer', startDate: '2024-01-15', endDate: '2024-06-30' },
        { projectId: '4', projectName: 'Brand Refresh', allocation: 20, role: 'Designer', startDate: '2024-03-01', endDate: '2024-04-30' }
      ]
    },
    {
      id: '4',
      name: 'Mike Johnson',
      email: 'm.johnson@company.com',
      role: 'Backend Developer',
      department: 'Engineering',
      skills: ['Rust', 'Python', 'PostgreSQL', 'Redis', 'Microservices'],
      availability: 100,
      utilization: 110,
      hourlyRate: 145,
      status: 'fully_allocated',
      allocatedProjects: [
        { projectId: '1', projectName: 'CUBE Elite v7', allocation: 80, role: 'Backend Lead', startDate: '2024-01-15', endDate: '2024-06-30' },
        { projectId: '3', projectName: 'API Gateway', allocation: 30, role: 'Consultant', startDate: '2024-02-01', endDate: '2024-03-31' }
      ]
    },
    {
      id: '5',
      name: 'Lisa Wong',
      email: 'l.wong@company.com',
      role: 'QA Engineer',
      department: 'Quality Assurance',
      skills: ['Test Automation', 'Selenium', 'Cypress', 'Performance Testing', 'API Testing'],
      availability: 100,
      utilization: 60,
      hourlyRate: 110,
      status: 'partially_available',
      allocatedProjects: [
        { projectId: '1', projectName: 'CUBE Elite v7', allocation: 60, role: 'QA Lead', startDate: '2024-02-01', endDate: '2024-06-30' }
      ]
    },
    {
      id: '6',
      name: 'Tom Wilson',
      email: 't.wilson@company.com',
      role: 'Senior Designer',
      department: 'Design',
      skills: ['Visual Design', 'Motion Graphics', 'Branding', 'Illustration'],
      availability: 100,
      utilization: 45,
      hourlyRate: 130,
      status: 'available',
      allocatedProjects: [
        { projectId: '2', projectName: 'Mobile App Redesign', allocation: 45, role: 'Visual Designer', startDate: '2024-02-01', endDate: '2024-05-15' }
      ]
    },
    {
      id: '7',
      name: 'Anna Kim',
      email: 'a.kim@company.com',
      role: 'Mobile Developer',
      department: 'Engineering',
      skills: ['iOS', 'Swift', 'React Native', 'Flutter', 'Mobile Architecture'],
      availability: 100,
      utilization: 90,
      hourlyRate: 155,
      status: 'fully_allocated',
      allocatedProjects: [
        { projectId: '2', projectName: 'Mobile App Redesign', allocation: 90, role: 'iOS Lead', startDate: '2024-03-01', endDate: '2024-05-15' }
      ]
    },
    {
      id: '8',
      name: 'Chris Brown',
      email: 'c.brown@company.com',
      role: 'DevOps Engineer',
      department: 'Infrastructure',
      skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD'],
      availability: 0,
      utilization: 0,
      hourlyRate: 165,
      status: 'on_leave',
      allocatedProjects: []
    }
  ];

  const departments = ['Engineering', 'Design', 'Project Management', 'Quality Assurance', 'Infrastructure'];

  const skillGaps: SkillGap[] = [
    { skill: 'Machine Learning', required: 3, available: 1, gap: 2 },
    { skill: 'DevOps', required: 4, available: 2, gap: 2 },
    { skill: 'Security', required: 3, available: 1, gap: 2 },
    { skill: 'Data Engineering', required: 2, available: 1, gap: 1 }
  ];

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'available': 'status-available',
      'partially_available': 'status-partial',
      'fully_allocated': 'status-allocated',
      'on_leave': 'status-leave'
    };
    return colors[status] || '';
  };

  const getUtilizationColor = (utilization: number): string => {
    if (utilization > 100) return 'util-over';
    if (utilization >= 80) return 'util-high';
    if (utilization >= 50) return 'util-medium';
    return 'util-low';
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDepartment = selectedDepartment === 'all' || resource.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || resource.status === selectedStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  return (
    <div className="resources-container">
      <div className="resources-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <Users2 size={28} />
            </div>
            <div>
              <h1>Resource Management</h1>
              <p>Team allocation, capacity planning, and skill tracking</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn-secondary">
              <Download size={18} />
              Export
            </button>
            <button className="btn-secondary">
              <BarChart2 size={18} />
              Reports
            </button>
            <button className="btn-primary">
              <UserPlus size={18} />
              Add Resource
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card highlight">
            <div className="stat-icon total">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Resources</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.totalResources}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon available">
              <UserCheck size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Available</span>
              <div className="stat-row">
                <span className="stat-value good">{metrics.available}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon allocated">
              <Briefcase size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Fully Allocated</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.fullyAllocated}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon over">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Over-Allocated</span>
              <div className="stat-row">
                <span className="stat-value warn">{metrics.overAllocated}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon leave">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">On Leave</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.onLeave}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon util">
              <Percent size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Avg. Utilization</span>
              <div className="stat-row">
                <span className="stat-value">{metrics.avgUtilization}%</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card large">
            <div className="stat-icon capacity">
              <PieChart size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Capacity Utilization</span>
              <div className="capacity-bar">
                <div 
                  className="capacity-fill"
                  style={{ width: `${(metrics.usedCapacity / metrics.totalCapacity) * 100}%` }}
                ></div>
              </div>
              <div className="capacity-text">
                <span>{metrics.usedCapacity}h</span>
                <span>of {metrics.totalCapacity}h</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs */}
      <div className="main-tabs">
        <button 
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <Users size={18} />
          Team Members
        </button>
        <button 
          className={`tab-btn ${activeTab === 'allocation' ? 'active' : ''}`}
          onClick={() => setActiveTab('allocation')}
        >
          <Layers size={18} />
          Allocation
        </button>
        <button 
          className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Award size={18} />
          Skills Matrix
        </button>
        <button 
          className={`tab-btn ${activeTab === 'capacity' ? 'active' : ''}`}
          onClick={() => setActiveTab('capacity')}
        >
          <BarChart3 size={18} />
          Capacity Planning
        </button>
      </div>

      {/* Team Members Tab */}
      {activeTab === 'team' && (
        <div className="team-content">
          <div className="filters-bar">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <select 
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="partially_available">Partially Available</option>
                <option value="fully_allocated">Fully Allocated</option>
                <option value="on_leave">On Leave</option>
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

          {viewMode === 'list' && (
            <div className="resources-list">
              {filteredResources.map((resource) => (
                <div key={resource.id} className={`resource-item ${resource.status}`}>
                  <div 
                    className="resource-main"
                    onClick={() => setExpandedResource(expandedResource === resource.id ? null : resource.id)}
                  >
                    <div className="resource-avatar">
                      {resource.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    
                    <div className="resource-info">
                      <div className="resource-header">
                        <h3>{resource.name}</h3>
                        <span className={`status-badge ${getStatusColor(resource.status)}`}>
                          {resource.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="resource-meta">
                        <span className="role">{resource.role}</span>
                        <span className="department">
                          <Briefcase size={14} />
                          {resource.department}
                        </span>
                        <span className="email">
                          <Mail size={14} />
                          {resource.email}
                        </span>
                      </div>
                    </div>
                    
                    <div className="resource-skills">
                      <div className="skills-list">
                        {resource.skills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))}
                        {resource.skills.length > 3 && (
                          <span className="skill-more">+{resource.skills.length - 3}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="resource-utilization">
                      <div className="util-header">
                        <span className="util-label">Utilization</span>
                        <span className={`util-value ${getUtilizationColor(resource.utilization)}`}>
                          {resource.utilization}%
                        </span>
                      </div>
                      <div className="util-bar">
                        <div 
                          className={`util-fill ${getUtilizationColor(resource.utilization)}`}
                          style={{ width: `${Math.min(resource.utilization, 100)}%` }}
                        ></div>
                        {resource.utilization > 100 && (
                          <div 
                            className="util-over-indicator"
                            style={{ width: `${resource.utilization - 100}%` }}
                          ></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="resource-projects">
                      <span className="projects-count">
                        <FolderKanban size={14} />
                        {resource.allocatedProjects.length} projects
                      </span>
                    </div>
                    
                    <div className="resource-rate">
                      <span className="rate-value">${resource.hourlyRate}</span>
                      <span className="rate-unit">/hr</span>
                    </div>
                    
                    <div className="resource-actions">
                      <button className="action-btn"><Eye size={16} /></button>
                      <button className="action-btn"><Edit size={16} /></button>
                      <button className="action-btn">
                        {expandedResource === resource.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  {expandedResource === resource.id && (
                    <div className="resource-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h4>Project Allocations</h4>
                          {resource.allocatedProjects.length > 0 ? (
                            <div className="allocations-list">
                              {resource.allocatedProjects.map((alloc, index) => (
                                <div key={index} className="allocation-item">
                                  <div className="allocation-info">
                                    <span className="allocation-project">{alloc.projectName}</span>
                                    <span className="allocation-role">{alloc.role}</span>
                                  </div>
                                  <div className="allocation-details">
                                    <span className="allocation-percent">{alloc.allocation}%</span>
                                    <span className="allocation-dates">
                                      <Calendar size={12} />
                                      {alloc.startDate} → {alloc.endDate}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="no-allocations">No current allocations</p>
                          )}
                        </div>
                        
                        <div className="expanded-section">
                          <h4>All Skills</h4>
                          <div className="all-skills">
                            {resource.skills.map((skill, index) => (
                              <span key={index} className="skill-tag large">{skill}</span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="expanded-section">
                          <h4>Quick Actions</h4>
                          <div className="quick-actions">
                            <button className="quick-btn">
                              <FolderKanban size={14} />
                              Assign to Project
                            </button>
                            <button className="quick-btn">
                              <Calendar size={14} />
                              Schedule Leave
                            </button>
                            <button className="quick-btn">
                              <Award size={14} />
                              Update Skills
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

          {viewMode === 'grid' && (
            <div className="resources-grid">
              {filteredResources.map((resource) => (
                <div key={resource.id} className={`resource-card ${resource.status}`}>
                  <div className="card-header">
                    <div className="resource-avatar large">
                      {resource.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className={`status-indicator ${resource.status}`}></span>
                  </div>
                  
                  <div className="card-body">
                    <h3>{resource.name}</h3>
                    <span className="role">{resource.role}</span>
                    <span className="department">{resource.department}</span>
                    
                    <div className="card-utilization">
                      <div className="util-info">
                        <span>Utilization</span>
                        <span className={getUtilizationColor(resource.utilization)}>
                          {resource.utilization}%
                        </span>
                      </div>
                      <div className="util-bar">
                        <div 
                          className={`util-fill ${getUtilizationColor(resource.utilization)}`}
                          style={{ width: `${Math.min(resource.utilization, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="card-skills">
                      {resource.skills.slice(0, 2).map((skill, index) => (
                        <span key={index} className="skill-tag small">{skill}</span>
                      ))}
                      {resource.skills.length > 2 && (
                        <span className="skill-more">+{resource.skills.length - 2}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-footer">
                    <span className="projects-count">
                      {resource.allocatedProjects.length} projects
                    </span>
                    <button className="view-btn">View Profile</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Skills Matrix Tab */}
      {activeTab === 'skills' && (
        <div className="skills-content">
          <div className="skills-header">
            <h2>Skills Overview</h2>
          </div>
          
          <div className="skills-sections">
            <div className="skills-distribution">
              <h3>Team Skills Distribution</h3>
              <div className="skills-chart">
                {['React', 'TypeScript', 'Python', 'AWS', 'Figma', 'Agile'].map((skill, index) => {
                  const counts = [12, 10, 8, 6, 5, 14];
                  return (
                    <div key={skill} className="skill-row">
                      <span className="skill-name">{skill}</span>
                      <div className="skill-bar">
                        <div 
                          className="skill-fill"
                          style={{ width: `${(counts[index] / 15) * 100}%` }}
                        ></div>
                      </div>
                      <span className="skill-count">{counts[index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="skill-gaps">
              <h3>Skill Gaps Analysis</h3>
              <div className="gaps-list">
                {skillGaps.map((gap) => (
                  <div key={gap.skill} className="gap-item">
                    <div className="gap-header">
                      <span className="gap-skill">{gap.skill}</span>
                      <span className="gap-badge">-{gap.gap}</span>
                    </div>
                    <div className="gap-bars">
                      <div className="bar-group">
                        <span className="bar-label">Required</span>
                        <div className="gap-bar">
                          <div className="gap-fill required" style={{ width: `${(gap.required / 5) * 100}%` }}></div>
                        </div>
                        <span className="bar-value">{gap.required}</span>
                      </div>
                      <div className="bar-group">
                        <span className="bar-label">Available</span>
                        <div className="gap-bar">
                          <div className="gap-fill available" style={{ width: `${(gap.available / 5) * 100}%` }}></div>
                        </div>
                        <span className="bar-value">{gap.available}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Tab */}
      {activeTab === 'allocation' && (
        <div className="allocation-content">
          <h2>Team Allocation Overview</h2>
          <div className="allocation-grid">
            {resources.filter(r => r.status !== 'on_leave').map((resource) => (
              <div key={resource.id} className="allocation-card">
                <div className="alloc-header">
                  <div className="resource-avatar small">
                    {resource.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="alloc-info">
                    <h4>{resource.name}</h4>
                    <span className="alloc-role">{resource.role}</span>
                  </div>
                  <span className={`alloc-util ${getUtilizationColor(resource.utilization)}`}>
                    {resource.utilization}%
                  </span>
                </div>
                <div className="alloc-projects">
                  {resource.allocatedProjects.map((proj, index) => (
                    <div key={index} className="alloc-project">
                      <div className="project-bar" style={{ width: `${proj.allocation}%` }}>
                        <span className="project-name">{proj.projectName}</span>
                        <span className="project-percent">{proj.allocation}%</span>
                      </div>
                    </div>
                  ))}
                  {resource.utilization < 100 && (
                    <div className="alloc-project available">
                      <div className="project-bar available" style={{ width: `${100 - resource.utilization}%` }}>
                        <span className="project-name">Available</span>
                        <span className="project-percent">{100 - resource.utilization}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Capacity Planning Tab */}
      {activeTab === 'capacity' && (
        <div className="capacity-content">
          <h2>Capacity Planning</h2>
          <div className="capacity-overview">
            <div className="capacity-chart">
              <h3>Monthly Capacity Forecast</h3>
              <div className="forecast-chart">
                {['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((month, index) => {
                  const capacities = [78, 82, 88, 75, 70, 65];
                  return (
                    <div key={month} className="forecast-bar">
                      <div 
                        className={`bar-fill ${capacities[index] > 85 ? 'high' : capacities[index] > 70 ? 'medium' : 'low'}`}
                        style={{ height: `${capacities[index]}%` }}
                      >
                        <span className="bar-tooltip">{capacities[index]}%</span>
                      </div>
                      <span className="bar-label">{month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="capacity-summary">
              <h3>Current Period Summary</h3>
              <div className="summary-items">
                <div className="summary-item">
                  <span className="summary-label">Total Available Hours</span>
                  <span className="summary-value">{metrics.totalCapacity}h</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Allocated Hours</span>
                  <span className="summary-value">{metrics.usedCapacity}h</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Remaining Capacity</span>
                  <span className="summary-value good">{metrics.totalCapacity - metrics.usedCapacity}h</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Avg. Team Utilization</span>
                  <span className="summary-value">{metrics.avgUtilization}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
