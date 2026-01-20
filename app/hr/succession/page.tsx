'use client';

import React, { useState } from 'react';
import { 
  UserCheck, 
  TrendingUp, 
  Target,
  Users,
  ArrowRight,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  BarChart3,
  Grid3X3,
  List,
  Shield,
  Award,
  Briefcase,
  Building2,
  Eye,
  Edit,
  Plus,
  XCircle,
  GitBranch,
  Zap,
  Calendar,
  MessageSquare
} from 'lucide-react';
import './succession.css';

interface SuccessionCandidate {
  id: string;
  name: string;
  currentRole: string;
  department: string;
  readiness: 'ready-now' | '1-2-years' | '3-5-years' | 'needs-development';
  potentialScore: number;
  performanceScore: number;
  flightRisk: 'low' | 'medium' | 'high';
  developmentPlan: boolean;
  avatar?: string;
  skills: string[];
  tenure: number;
  lastAssessment: string;
}

interface CriticalRole {
  id: string;
  title: string;
  department: string;
  incumbent: string;
  incumbentTenure: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  candidates: number;
  readyNow: number;
  vacancyRisk: boolean;
  nextReview: string;
}

interface TalentPool {
  id: string;
  name: string;
  description: string;
  members: number;
  avgReadiness: number;
  targetRoles: string[];
  color: string;
}

interface DevelopmentGoal {
  id: string;
  candidateId: string;
  candidateName: string;
  goal: string;
  targetDate: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'completed' | 'overdue';
}

const criticalRoles: CriticalRole[] = [
  {
    id: '1',
    title: 'Chief Technology Officer',
    department: 'Technology',
    incumbent: 'David Chen',
    incumbentTenure: 8,
    riskLevel: 'high',
    candidates: 3,
    readyNow: 1,
    vacancyRisk: true,
    nextReview: '2025-03-15'
  },
  {
    id: '2',
    title: 'VP of Engineering',
    department: 'Technology',
    incumbent: 'Sarah Martinez',
    incumbentTenure: 5,
    riskLevel: 'medium',
    candidates: 4,
    readyNow: 2,
    vacancyRisk: false,
    nextReview: '2025-04-01'
  },
  {
    id: '3',
    title: 'Director of Product',
    department: 'Product',
    incumbent: 'Michael Johnson',
    incumbentTenure: 3,
    riskLevel: 'low',
    candidates: 5,
    readyNow: 2,
    vacancyRisk: false,
    nextReview: '2025-05-20'
  },
  {
    id: '4',
    title: 'Chief Financial Officer',
    department: 'Finance',
    incumbent: 'Jennifer Williams',
    incumbentTenure: 12,
    riskLevel: 'critical',
    candidates: 2,
    readyNow: 0,
    vacancyRisk: true,
    nextReview: '2025-02-28'
  },
  {
    id: '5',
    title: 'Head of Sales',
    department: 'Sales',
    incumbent: 'Robert Taylor',
    incumbentTenure: 6,
    riskLevel: 'medium',
    candidates: 3,
    readyNow: 1,
    vacancyRisk: false,
    nextReview: '2025-04-15'
  },
  {
    id: '6',
    title: 'Chief Marketing Officer',
    department: 'Marketing',
    incumbent: 'Amanda Brown',
    incumbentTenure: 4,
    riskLevel: 'low',
    candidates: 4,
    readyNow: 2,
    vacancyRisk: false,
    nextReview: '2025-06-01'
  }
];

const candidates: SuccessionCandidate[] = [
  {
    id: '1',
    name: 'Emily Zhang',
    currentRole: 'Senior Engineering Manager',
    department: 'Technology',
    readiness: 'ready-now',
    potentialScore: 95,
    performanceScore: 92,
    flightRisk: 'low',
    developmentPlan: true,
    skills: ['Leadership', 'Architecture', 'Strategy'],
    tenure: 6,
    lastAssessment: '2025-01-10'
  },
  {
    id: '2',
    name: 'James Wilson',
    currentRole: 'Principal Engineer',
    department: 'Technology',
    readiness: '1-2-years',
    potentialScore: 88,
    performanceScore: 95,
    flightRisk: 'medium',
    developmentPlan: true,
    skills: ['Technical Excellence', 'Innovation', 'Mentorship'],
    tenure: 4,
    lastAssessment: '2025-01-08'
  },
  {
    id: '3',
    name: 'Lisa Anderson',
    currentRole: 'Finance Director',
    department: 'Finance',
    readiness: '1-2-years',
    potentialScore: 90,
    performanceScore: 88,
    flightRisk: 'low',
    developmentPlan: true,
    skills: ['Financial Analysis', 'Strategic Planning', 'Risk Management'],
    tenure: 7,
    lastAssessment: '2025-01-05'
  },
  {
    id: '4',
    name: 'Marcus Thompson',
    currentRole: 'Product Lead',
    department: 'Product',
    readiness: 'ready-now',
    potentialScore: 92,
    performanceScore: 90,
    flightRisk: 'low',
    developmentPlan: true,
    skills: ['Product Strategy', 'User Research', 'Go-to-Market'],
    tenure: 5,
    lastAssessment: '2025-01-12'
  },
  {
    id: '5',
    name: 'Rachel Kim',
    currentRole: 'Senior Sales Manager',
    department: 'Sales',
    readiness: '1-2-years',
    potentialScore: 85,
    performanceScore: 93,
    flightRisk: 'high',
    developmentPlan: false,
    skills: ['Sales Strategy', 'Client Relations', 'Negotiation'],
    tenure: 3,
    lastAssessment: '2025-01-03'
  },
  {
    id: '6',
    name: 'Daniel Park',
    currentRole: 'Engineering Manager',
    department: 'Technology',
    readiness: '3-5-years',
    potentialScore: 80,
    performanceScore: 85,
    flightRisk: 'low',
    developmentPlan: true,
    skills: ['Team Management', 'Agile', 'Technical Skills'],
    tenure: 2,
    lastAssessment: '2025-01-15'
  },
  {
    id: '7',
    name: 'Sophie Martinez',
    currentRole: 'Marketing Director',
    department: 'Marketing',
    readiness: 'ready-now',
    potentialScore: 91,
    performanceScore: 89,
    flightRisk: 'low',
    developmentPlan: true,
    skills: ['Brand Strategy', 'Digital Marketing', 'Analytics'],
    tenure: 4,
    lastAssessment: '2025-01-11'
  },
  {
    id: '8',
    name: 'Chris Evans',
    currentRole: 'Operations Manager',
    department: 'Operations',
    readiness: 'needs-development',
    potentialScore: 75,
    performanceScore: 82,
    flightRisk: 'medium',
    developmentPlan: false,
    skills: ['Process Optimization', 'Project Management', 'Compliance'],
    tenure: 2,
    lastAssessment: '2025-01-02'
  }
];

const talentPools: TalentPool[] = [
  {
    id: '1',
    name: 'Executive Pipeline',
    description: 'High-potential leaders ready for C-suite roles',
    members: 12,
    avgReadiness: 78,
    targetRoles: ['CTO', 'CFO', 'CMO', 'COO'],
    color: '#8b5cf6'
  },
  {
    id: '2',
    name: 'Technical Leaders',
    description: 'Senior engineers with leadership potential',
    members: 24,
    avgReadiness: 65,
    targetRoles: ['VP Engineering', 'Principal Engineer', 'Tech Director'],
    color: '#3b82f6'
  },
  {
    id: '3',
    name: 'Emerging Talent',
    description: 'High performers with long-term potential',
    members: 45,
    avgReadiness: 35,
    targetRoles: ['Manager', 'Senior Specialist', 'Team Lead'],
    color: '#10b981'
  },
  {
    id: '4',
    name: 'Sales Leaders',
    description: 'Top performers ready for sales leadership',
    members: 18,
    avgReadiness: 55,
    targetRoles: ['Head of Sales', 'Regional Director', 'VP Sales'],
    color: '#f59e0b'
  }
];

const developmentGoals: DevelopmentGoal[] = [
  {
    id: '1',
    candidateId: '1',
    candidateName: 'Emily Zhang',
    goal: 'Complete Executive Leadership Program',
    targetDate: '2025-06-30',
    progress: 75,
    status: 'on-track'
  },
  {
    id: '2',
    candidateId: '2',
    candidateName: 'James Wilson',
    goal: 'Lead cross-functional initiative',
    targetDate: '2025-04-15',
    progress: 45,
    status: 'at-risk'
  },
  {
    id: '3',
    candidateId: '3',
    candidateName: 'Lisa Anderson',
    goal: 'Complete MBA Finance Specialization',
    targetDate: '2025-08-01',
    progress: 60,
    status: 'on-track'
  },
  {
    id: '4',
    candidateId: '4',
    candidateName: 'Marcus Thompson',
    goal: 'Mentor 3 junior product managers',
    targetDate: '2025-03-31',
    progress: 100,
    status: 'completed'
  },
  {
    id: '5',
    candidateId: '5',
    candidateName: 'Rachel Kim',
    goal: 'Develop strategic planning skills',
    targetDate: '2025-02-28',
    progress: 30,
    status: 'overdue'
  }
];

export default function SuccessionPlanningPage() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'candidates' | 'pools' | 'development'>('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<CriticalRole | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [readinessFilter, setReadinessFilter] = useState<string>('all');

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'critical': return 'risk-badge critical';
      case 'high': return 'risk-badge high';
      case 'medium': return 'risk-badge medium';
      case 'low': return 'risk-badge low';
      default: return 'risk-badge';
    }
  };

  const getReadinessLabel = (readiness: string) => {
    switch (readiness) {
      case 'ready-now': return 'Ready Now';
      case '1-2-years': return '1-2 Years';
      case '3-5-years': return '3-5 Years';
      case 'needs-development': return 'Needs Development';
      default: return readiness;
    }
  };

  const getReadinessClass = (readiness: string) => {
    switch (readiness) {
      case 'ready-now': return 'readiness-badge ready';
      case '1-2-years': return 'readiness-badge soon';
      case '3-5-years': return 'readiness-badge later';
      case 'needs-development': return 'readiness-badge development';
      default: return 'readiness-badge';
    }
  };

  const getFlightRiskClass = (risk: string) => {
    switch (risk) {
      case 'high': return 'flight-risk high';
      case 'medium': return 'flight-risk medium';
      case 'low': return 'flight-risk low';
      default: return 'flight-risk';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'on-track': return 'status-badge on-track';
      case 'at-risk': return 'status-badge at-risk';
      case 'completed': return 'status-badge completed';
      case 'overdue': return 'status-badge overdue';
      default: return 'status-badge';
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.currentRole.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReadiness = readinessFilter === 'all' || candidate.readiness === readinessFilter;
    return matchesSearch && matchesReadiness;
  });

  const stats = {
    criticalRoles: criticalRoles.length,
    highRiskRoles: criticalRoles.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high').length,
    totalCandidates: candidates.length,
    readyNow: candidates.filter(c => c.readiness === 'ready-now').length
  };

  return (
    <div className="succession-page">
      <header className="succession__header">
        <div className="succession__title-section">
          <div className="succession__icon">
            <GitBranch size={28} />
          </div>
          <div>
            <h1>Succession Planning</h1>
            <p>Identify, develop, and retain future leaders</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <BarChart3 size={18} />
            Analytics
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            Add Critical Role
          </button>
        </div>
      </header>

      <div className="succession__tabs">
        <button 
          className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          <GitBranch size={18} />
          Succession Pipeline
        </button>
        <button 
          className={`tab-btn ${activeTab === 'candidates' ? 'active' : ''}`}
          onClick={() => setActiveTab('candidates')}
        >
          <UserCheck size={18} />
          Candidates
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pools' ? 'active' : ''}`}
          onClick={() => setActiveTab('pools')}
        >
          <Users size={18} />
          Talent Pools
        </button>
        <button 
          className={`tab-btn ${activeTab === 'development' ? 'active' : ''}`}
          onClick={() => setActiveTab('development')}
        >
          <Target size={18} />
          Development Tracking
        </button>
      </div>

      <div className="succession__content">
        {activeTab === 'pipeline' && (
          <div className="pipeline-content">
            <div className="pipeline-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <Briefcase size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.criticalRoles}</span>
                  <span className="stat-label">Critical Roles</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon risk">
                  <AlertTriangle size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.highRiskRoles}</span>
                  <span className="stat-label">High/Critical Risk</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon candidates">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.totalCandidates}</span>
                  <span className="stat-label">Total Candidates</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon ready">
                  <CheckCircle size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.readyNow}</span>
                  <span className="stat-label">Ready Now</span>
                </div>
              </div>
            </div>

            <div className="critical-roles-section">
              <div className="section-header">
                <h3>Critical Roles Pipeline</h3>
                <div className="section-actions">
                  <button className="btn-outline small">
                    <Filter size={16} />
                    Filter
                  </button>
                </div>
              </div>

              <div className="roles-grid">
                {criticalRoles.map(role => (
                  <div 
                    key={role.id} 
                    className={`role-card ${selectedRole?.id === role.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="role-header">
                      <div className="role-info">
                        <h4>{role.title}</h4>
                        <span className="role-department">{role.department}</span>
                      </div>
                      <span className={getRiskBadgeClass(role.riskLevel)}>
                        {role.riskLevel === 'critical' && <AlertTriangle size={12} />}
                        {role.riskLevel}
                      </span>
                    </div>
                    
                    <div className="incumbent-info">
                      <div className="incumbent-avatar">
                        {role.incumbent.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="incumbent-details">
                        <span className="incumbent-name">{role.incumbent}</span>
                        <span className="incumbent-tenure">{role.incumbentTenure} years tenure</span>
                      </div>
                      {role.vacancyRisk && (
                        <div className="vacancy-warning">
                          <AlertTriangle size={14} />
                        </div>
                      )}
                    </div>

                    <div className="candidates-summary">
                      <div className="candidates-bar">
                        <div className="candidates-count">
                          <Users size={14} />
                          <span>{role.candidates} Candidates</span>
                        </div>
                        <div className="ready-count">
                          <CheckCircle size={14} />
                          <span>{role.readyNow} Ready Now</span>
                        </div>
                      </div>
                      <div className="pipeline-bar">
                        <div 
                          className="pipeline-fill" 
                          style={{ width: `${(role.readyNow / role.candidates) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="role-footer">
                      <span className="next-review">
                        <Clock size={12} />
                        Review: {new Date(role.nextReview).toLocaleDateString()}
                      </span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="candidates-content">
            <div className="content-toolbar">
              <div className="search-box">
                <Search size={18} />
                <input 
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <select 
                  className="filter-select"
                  value={readinessFilter}
                  onChange={(e) => setReadinessFilter(e.target.value)}
                >
                  <option value="all">All Readiness</option>
                  <option value="ready-now">Ready Now</option>
                  <option value="1-2-years">1-2 Years</option>
                  <option value="3-5-years">3-5 Years</option>
                  <option value="needs-development">Needs Development</option>
                </select>
              </div>
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 size={18} />
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="candidates-grid">
                {filteredCandidates.map(candidate => (
                  <div key={candidate.id} className="candidate-card">
                    <div className="candidate-header">
                      <div className="candidate-avatar">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className={getFlightRiskClass(candidate.flightRisk)}>
                        {candidate.flightRisk === 'high' && <AlertTriangle size={12} />}
                        {candidate.flightRisk} risk
                      </span>
                    </div>
                    <div className="candidate-info">
                      <h4>{candidate.name}</h4>
                      <span className="candidate-role">{candidate.currentRole}</span>
                      <span className="candidate-dept">{candidate.department}</span>
                    </div>
                    <div className="candidate-readiness">
                      <span className={getReadinessClass(candidate.readiness)}>
                        {getReadinessLabel(candidate.readiness)}
                      </span>
                    </div>
                    <div className="candidate-scores">
                      <div className="score-item">
                        <span className="score-label">Potential</span>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${candidate.potentialScore}%` }} />
                        </div>
                        <span className="score-value">{candidate.potentialScore}</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Performance</span>
                        <div className="score-bar">
                          <div className="score-fill performance" style={{ width: `${candidate.performanceScore}%` }} />
                        </div>
                        <span className="score-value">{candidate.performanceScore}</span>
                      </div>
                    </div>
                    <div className="candidate-skills">
                      {candidate.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                    <div className="candidate-footer">
                      <span className="tenure">{candidate.tenure} years</span>
                      {candidate.developmentPlan ? (
                        <span className="has-plan">
                          <Target size={12} />
                          Dev Plan
                        </span>
                      ) : (
                        <span className="no-plan">
                          <XCircle size={12} />
                          No Plan
                        </span>
                      )}
                    </div>
                    <div className="candidate-actions">
                      <button className="action-btn">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn">
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="candidates-table">
                <div className="table-header">
                  <span>Candidate</span>
                  <span>Current Role</span>
                  <span>Readiness</span>
                  <span>Potential</span>
                  <span>Performance</span>
                  <span>Flight Risk</span>
                  <span>Dev Plan</span>
                  <span>Actions</span>
                </div>
                {filteredCandidates.map(candidate => (
                  <div key={candidate.id} className="table-row">
                    <div className="col-candidate">
                      <div className="candidate-avatar small">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="candidate-name">{candidate.name}</span>
                    </div>
                    <div className="col-role">
                      <span className="role-text">{candidate.currentRole}</span>
                      <span className="dept-text">{candidate.department}</span>
                    </div>
                    <div className="col-readiness">
                      <span className={getReadinessClass(candidate.readiness)}>
                        {getReadinessLabel(candidate.readiness)}
                      </span>
                    </div>
                    <div className="col-score">
                      <span className="score">{candidate.potentialScore}</span>
                    </div>
                    <div className="col-score">
                      <span className="score">{candidate.performanceScore}</span>
                    </div>
                    <div className="col-risk">
                      <span className={getFlightRiskClass(candidate.flightRisk)}>
                        {candidate.flightRisk}
                      </span>
                    </div>
                    <div className="col-plan">
                      {candidate.developmentPlan ? (
                        <CheckCircle size={18} className="has-plan-icon" />
                      ) : (
                        <XCircle size={18} className="no-plan-icon" />
                      )}
                    </div>
                    <div className="col-actions">
                      <button className="action-btn">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn">
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pools' && (
          <div className="pools-content">
            <div className="pools-header">
              <h3>Talent Pools</h3>
              <button className="btn-primary small">
                <Plus size={16} />
                Create Pool
              </button>
            </div>

            <div className="pools-grid">
              {talentPools.map(pool => (
                <div key={pool.id} className="pool-card">
                  <div className="pool-header" style={{ borderColor: pool.color }}>
                    <div className="pool-icon" style={{ backgroundColor: `${pool.color}20`, color: pool.color }}>
                      <Users size={24} />
                    </div>
                    <div className="pool-info">
                      <h4>{pool.name}</h4>
                      <p>{pool.description}</p>
                    </div>
                  </div>
                  <div className="pool-stats">
                    <div className="pool-stat">
                      <span className="stat-number">{pool.members}</span>
                      <span className="stat-text">Members</span>
                    </div>
                    <div className="pool-stat">
                      <span className="stat-number">{pool.avgReadiness}%</span>
                      <span className="stat-text">Avg Readiness</span>
                    </div>
                  </div>
                  <div className="pool-readiness-bar">
                    <div className="readiness-fill" style={{ width: `${pool.avgReadiness}%`, backgroundColor: pool.color }} />
                  </div>
                  <div className="pool-targets">
                    <span className="targets-label">Target Roles:</span>
                    <div className="targets-list">
                      {pool.targetRoles.map((role, idx) => (
                        <span key={idx} className="target-tag">{role}</span>
                      ))}
                    </div>
                  </div>
                  <div className="pool-actions">
                    <button className="btn-outline small">View Members</button>
                    <button className="btn-outline small">
                      <Edit size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'development' && (
          <div className="development-content">
            <div className="dev-overview">
              <div className="dev-stats">
                <div className="dev-stat-card on-track">
                  <Zap size={20} />
                  <span className="dev-stat-value">{developmentGoals.filter(g => g.status === 'on-track').length}</span>
                  <span className="dev-stat-label">On Track</span>
                </div>
                <div className="dev-stat-card at-risk">
                  <AlertTriangle size={20} />
                  <span className="dev-stat-value">{developmentGoals.filter(g => g.status === 'at-risk').length}</span>
                  <span className="dev-stat-label">At Risk</span>
                </div>
                <div className="dev-stat-card completed">
                  <CheckCircle size={20} />
                  <span className="dev-stat-value">{developmentGoals.filter(g => g.status === 'completed').length}</span>
                  <span className="dev-stat-label">Completed</span>
                </div>
                <div className="dev-stat-card overdue">
                  <XCircle size={20} />
                  <span className="dev-stat-value">{developmentGoals.filter(g => g.status === 'overdue').length}</span>
                  <span className="dev-stat-label">Overdue</span>
                </div>
              </div>
            </div>

            <div className="goals-section">
              <div className="section-header">
                <h3>Development Goals</h3>
                <button className="btn-primary small">
                  <Plus size={16} />
                  Add Goal
                </button>
              </div>

              <div className="goals-list">
                {developmentGoals.map(goal => (
                  <div key={goal.id} className={`goal-item ${goal.status}`}>
                    <div className="goal-avatar">
                      {goal.candidateName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="goal-info">
                      <div className="goal-header">
                        <span className="goal-candidate">{goal.candidateName}</span>
                        <span className={getStatusClass(goal.status)}>
                          {goal.status === 'on-track' && <TrendingUp size={12} />}
                          {goal.status === 'at-risk' && <AlertTriangle size={12} />}
                          {goal.status === 'completed' && <CheckCircle size={12} />}
                          {goal.status === 'overdue' && <XCircle size={12} />}
                          {goal.status.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="goal-text">{goal.goal}</p>
                      <div className="goal-meta">
                        <span className="goal-date">
                          <Calendar size={12} />
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="goal-progress">
                      <div className="progress-ring">
                        <svg viewBox="0 0 36 36">
                          <path
                            className="progress-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={`progress-bar ${goal.status}`}
                            strokeDasharray={`${goal.progress}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="progress-text">{goal.progress}%</span>
                      </div>
                    </div>
                    <div className="goal-actions">
                      <button className="action-btn">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn">
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
