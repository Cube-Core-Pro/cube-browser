'use client';

import React, { useState } from 'react';
import { 
  Heart, 
  TrendingUp, 
  MessageSquare,
  Users,
  Star,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Meh,
  Frown,
  Award,
  Trophy,
  Gift,
  Calendar,
  Clock,
  Search,
  Filter,
  BarChart3,
  PieChart,
  Send,
  Plus,
  Eye,
  Edit,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Target,
  Zap,
  Bell,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download
} from 'lucide-react';
import './engagement.css';

interface Survey {
  id: string;
  title: string;
  type: 'pulse' | 'annual' | 'event' | 'onboarding' | 'exit';
  status: 'draft' | 'active' | 'completed' | 'scheduled';
  startDate: string;
  endDate: string;
  responses: number;
  totalInvited: number;
  avgScore: number;
  questions: number;
}

interface EngagementScore {
  category: string;
  score: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  benchmarkScore: number;
}

interface Recognition {
  id: string;
  from: string;
  fromDepartment: string;
  to: string;
  toDepartment: string;
  message: string;
  value: string;
  date: string;
  likes: number;
  badge?: string;
}

interface Feedback {
  id: string;
  type: 'suggestion' | 'concern' | 'praise' | 'question';
  message: string;
  department: string;
  date: string;
  status: 'new' | 'reviewing' | 'addressed' | 'closed';
  anonymous: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface Initiative {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'planning' | 'in-progress' | 'completed';
  impactScore: number;
  participantCount: number;
  startDate: string;
  endDate: string;
}

const surveys: Survey[] = [
  {
    id: '1',
    title: 'Q1 2025 Pulse Survey',
    type: 'pulse',
    status: 'active',
    startDate: '2025-01-15',
    endDate: '2025-01-31',
    responses: 234,
    totalInvited: 350,
    avgScore: 7.8,
    questions: 15
  },
  {
    id: '2',
    title: 'Annual Engagement Survey 2024',
    type: 'annual',
    status: 'completed',
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    responses: 312,
    totalInvited: 340,
    avgScore: 7.5,
    questions: 45
  },
  {
    id: '3',
    title: 'Company Offsite Feedback',
    type: 'event',
    status: 'completed',
    startDate: '2024-12-10',
    endDate: '2024-12-15',
    responses: 185,
    totalInvited: 200,
    avgScore: 8.4,
    questions: 12
  },
  {
    id: '4',
    title: 'New Hire Experience Survey',
    type: 'onboarding',
    status: 'active',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    responses: 28,
    totalInvited: 35,
    avgScore: 8.1,
    questions: 20
  },
  {
    id: '5',
    title: 'Q2 2025 Pulse Survey',
    type: 'pulse',
    status: 'scheduled',
    startDate: '2025-04-01',
    endDate: '2025-04-15',
    responses: 0,
    totalInvited: 360,
    avgScore: 0,
    questions: 15
  }
];

const engagementScores: EngagementScore[] = [
  { category: 'Overall Engagement', score: 78, previousScore: 75, trend: 'up', benchmarkScore: 72 },
  { category: 'Work-Life Balance', score: 72, previousScore: 74, trend: 'down', benchmarkScore: 68 },
  { category: 'Career Growth', score: 68, previousScore: 65, trend: 'up', benchmarkScore: 70 },
  { category: 'Manager Support', score: 82, previousScore: 80, trend: 'up', benchmarkScore: 75 },
  { category: 'Team Collaboration', score: 85, previousScore: 84, trend: 'stable', benchmarkScore: 78 },
  { category: 'Company Culture', score: 80, previousScore: 78, trend: 'up', benchmarkScore: 74 },
  { category: 'Compensation & Benefits', score: 65, previousScore: 63, trend: 'up', benchmarkScore: 68 },
  { category: 'Communication', score: 71, previousScore: 69, trend: 'up', benchmarkScore: 70 }
];

const recognitions: Recognition[] = [
  {
    id: '1',
    from: 'Sarah Chen',
    fromDepartment: 'Engineering',
    to: 'Michael Rodriguez',
    toDepartment: 'Design',
    message: 'Amazing work on the new dashboard design! The attention to detail is incredible.',
    value: 'Excellence',
    date: '2025-01-27',
    likes: 24,
    badge: '🌟'
  },
  {
    id: '2',
    from: 'James Wilson',
    fromDepartment: 'Sales',
    to: 'Emily Zhang',
    toDepartment: 'Customer Success',
    message: 'Thank you for helping close the enterprise deal. Your support was invaluable!',
    value: 'Teamwork',
    date: '2025-01-26',
    likes: 18,
    badge: '🤝'
  },
  {
    id: '3',
    from: 'Lisa Anderson',
    fromDepartment: 'HR',
    to: 'David Park',
    toDepartment: 'Engineering',
    message: 'Outstanding leadership during the system migration. You kept everyone calm and focused.',
    value: 'Leadership',
    date: '2025-01-25',
    likes: 31,
    badge: '👑'
  },
  {
    id: '4',
    from: 'Robert Taylor',
    fromDepartment: 'Marketing',
    to: 'Anna Kim',
    toDepartment: 'Marketing',
    message: 'The campaign results exceeded all expectations. Great creativity and execution!',
    value: 'Innovation',
    date: '2025-01-24',
    likes: 15,
    badge: '💡'
  },
  {
    id: '5',
    from: 'Jennifer Williams',
    fromDepartment: 'Finance',
    to: 'Chris Martinez',
    toDepartment: 'Operations',
    message: 'Your process improvements saved us 20 hours per week. Fantastic work!',
    value: 'Efficiency',
    date: '2025-01-23',
    likes: 22,
    badge: '⚡'
  }
];

const feedbackItems: Feedback[] = [
  {
    id: '1',
    type: 'suggestion',
    message: 'It would be great to have more flexible work-from-home options on Fridays.',
    department: 'Company-wide',
    date: '2025-01-27',
    status: 'reviewing',
    anonymous: true,
    priority: 'medium'
  },
  {
    id: '2',
    type: 'concern',
    message: 'The new project management tool is causing confusion among team members.',
    department: 'Product',
    date: '2025-01-26',
    status: 'addressed',
    anonymous: false,
    priority: 'high'
  },
  {
    id: '3',
    type: 'praise',
    message: 'The new benefits package is fantastic! Really appreciate the wellness stipend.',
    department: 'HR',
    date: '2025-01-25',
    status: 'closed',
    anonymous: false,
    priority: 'low'
  },
  {
    id: '4',
    type: 'question',
    message: 'When will we have more clarity on the promotion criteria for senior roles?',
    department: 'Engineering',
    date: '2025-01-24',
    status: 'new',
    anonymous: true,
    priority: 'medium'
  },
  {
    id: '5',
    type: 'suggestion',
    message: 'Consider adding more professional development budget for conferences.',
    department: 'Company-wide',
    date: '2025-01-23',
    status: 'reviewing',
    anonymous: true,
    priority: 'low'
  }
];

const initiatives: Initiative[] = [
  {
    id: '1',
    title: 'Mental Health Awareness Month',
    description: 'Series of workshops and resources focused on mental wellness',
    category: 'Wellness',
    status: 'in-progress',
    impactScore: 85,
    participantCount: 245,
    startDate: '2025-01-01',
    endDate: '2025-01-31'
  },
  {
    id: '2',
    title: 'Cross-Team Collaboration Program',
    description: 'Pairing employees from different departments for knowledge sharing',
    category: 'Culture',
    status: 'in-progress',
    impactScore: 78,
    participantCount: 120,
    startDate: '2025-01-15',
    endDate: '2025-04-15'
  },
  {
    id: '3',
    title: 'Leadership Development Workshop',
    description: 'Intensive leadership training for emerging managers',
    category: 'Growth',
    status: 'planning',
    impactScore: 0,
    participantCount: 30,
    startDate: '2025-02-01',
    endDate: '2025-02-28'
  },
  {
    id: '4',
    title: 'Company Hackathon 2024',
    description: 'Annual innovation hackathon with cross-functional teams',
    category: 'Innovation',
    status: 'completed',
    impactScore: 92,
    participantCount: 180,
    startDate: '2024-12-01',
    endDate: '2024-12-03'
  }
];

export default function EmployeeEngagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'surveys' | 'recognition' | 'feedback' | 'initiatives'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const getResponseRate = (responses: number, total: number): number => {
    return Math.round((responses / total) * 100);
  };

  const getSurveyStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-badge active';
      case 'completed': return 'status-badge completed';
      case 'scheduled': return 'status-badge scheduled';
      case 'draft': return 'status-badge draft';
      default: return 'status-badge';
    }
  };

  const getSurveyTypeIcon = (type: string) => {
    switch (type) {
      case 'pulse': return <Zap size={16} />;
      case 'annual': return <Calendar size={16} />;
      case 'event': return <Star size={16} />;
      case 'onboarding': return <Users size={16} />;
      case 'exit': return <FileText size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'suggestion': return <Sparkles size={16} />;
      case 'concern': return <AlertTriangle size={16} />;
      case 'praise': return <ThumbsUp size={16} />;
      case 'question': return <MessageSquare size={16} />;
      default: return <MessageSquare size={16} />;
    }
  };

  const getFeedbackStatusClass = (status: string) => {
    switch (status) {
      case 'new': return 'feedback-status new';
      case 'reviewing': return 'feedback-status reviewing';
      case 'addressed': return 'feedback-status addressed';
      case 'closed': return 'feedback-status closed';
      default: return 'feedback-status';
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-badge high';
      case 'medium': return 'priority-badge medium';
      case 'low': return 'priority-badge low';
      default: return 'priority-badge';
    }
  };

  const getInitiativeStatusClass = (status: string) => {
    switch (status) {
      case 'planning': return 'initiative-status planning';
      case 'in-progress': return 'initiative-status in-progress';
      case 'completed': return 'initiative-status completed';
      default: return 'initiative-status';
    }
  };

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || survey.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    overallScore: 78,
    responseRate: 89,
    recognitionsSent: 156,
    activeInitiatives: initiatives.filter(i => i.status === 'in-progress').length
  };

  return (
    <div className="engagement-page">
      <header className="engagement__header">
        <div className="engagement__title-section">
          <div className="engagement__icon">
            <Heart size={28} />
          </div>
          <div>
            <h1>Employee Engagement</h1>
            <p>Measure, improve, and celebrate workplace culture</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={18} />
            Export Report
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            Create Survey
          </button>
        </div>
      </header>

      <div className="engagement__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <PieChart size={18} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'surveys' ? 'active' : ''}`}
          onClick={() => setActiveTab('surveys')}
        >
          <FileText size={18} />
          Surveys
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recognition' ? 'active' : ''}`}
          onClick={() => setActiveTab('recognition')}
        >
          <Award size={18} />
          Recognition
        </button>
        <button 
          className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <MessageSquare size={18} />
          Feedback
        </button>
        <button 
          className={`tab-btn ${activeTab === 'initiatives' ? 'active' : ''}`}
          onClick={() => setActiveTab('initiatives')}
        >
          <Target size={18} />
          Initiatives
        </button>
      </div>

      <div className="engagement__content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="overview-stats">
              <div className="stat-card highlight">
                <div className="stat-icon">
                  <Heart size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.overallScore}%</span>
                  <span className="stat-label">Engagement Score</span>
                </div>
                <div className="stat-trend up">
                  <ArrowUp size={14} />
                  +3%
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon response">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.responseRate}%</span>
                  <span className="stat-label">Response Rate</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon recognition">
                  <Award size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.recognitionsSent}</span>
                  <span className="stat-label">Recognitions This Month</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon initiatives">
                  <Target size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stats.activeInitiatives}</span>
                  <span className="stat-label">Active Initiatives</span>
                </div>
              </div>
            </div>

            <div className="overview-grid">
              <div className="engagement-scores-section">
                <div className="section-header">
                  <h3>Engagement by Category</h3>
                  <span className="benchmark-legend">
                    <span className="legend-item score">Your Score</span>
                    <span className="legend-item benchmark">Industry Benchmark</span>
                  </span>
                </div>
                <div className="scores-list">
                  {engagementScores.map((item, idx) => (
                    <div key={idx} className="score-row">
                      <div className="score-info">
                        <span className="score-category">{item.category}</span>
                        <div className="score-values">
                          <span className="current-score">{item.score}%</span>
                          <span className={`score-trend ${item.trend}`}>
                            {item.trend === 'up' && <ArrowUp size={12} />}
                            {item.trend === 'down' && <ArrowDown size={12} />}
                            {item.trend === 'stable' && '—'}
                            {item.trend !== 'stable' && `${Math.abs(item.score - item.previousScore)}%`}
                          </span>
                        </div>
                      </div>
                      <div className="score-bar-container">
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ width: `${item.score}%` }}
                          />
                          <div 
                            className="benchmark-marker" 
                            style={{ left: `${item.benchmarkScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recent-activity-section">
                <div className="section-header">
                  <h3>Recent Recognition</h3>
                  <button className="view-all-btn">
                    View All <ChevronRight size={14} />
                  </button>
                </div>
                <div className="activity-list">
                  {recognitions.slice(0, 4).map(rec => (
                    <div key={rec.id} className="activity-item">
                      <div className="activity-badge">{rec.badge}</div>
                      <div className="activity-content">
                        <div className="activity-header">
                          <span className="activity-from">{rec.from}</span>
                          <span className="activity-arrow">→</span>
                          <span className="activity-to">{rec.to}</span>
                        </div>
                        <p className="activity-message">{rec.message.substring(0, 60)}...</p>
                        <div className="activity-meta">
                          <span className="activity-value">{rec.value}</span>
                          <span className="activity-likes">
                            <ThumbsUp size={12} />
                            {rec.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mood-section">
              <div className="section-header">
                <h3>Team Mood Tracker</h3>
                <span className="mood-period">Last 7 days</span>
              </div>
              <div className="mood-summary">
                <div className="mood-item positive">
                  <Smile size={32} />
                  <span className="mood-percentage">68%</span>
                  <span className="mood-label">Positive</span>
                </div>
                <div className="mood-item neutral">
                  <Meh size={32} />
                  <span className="mood-percentage">24%</span>
                  <span className="mood-label">Neutral</span>
                </div>
                <div className="mood-item negative">
                  <Frown size={32} />
                  <span className="mood-percentage">8%</span>
                  <span className="mood-label">Negative</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'surveys' && (
          <div className="surveys-content">
            <div className="content-toolbar">
              <div className="search-box">
                <Search size={18} />
                <input 
                  type="text"
                  placeholder="Search surveys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <select 
                  className="filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            <div className="surveys-grid">
              {filteredSurveys.map(survey => (
                <div key={survey.id} className="survey-card">
                  <div className="survey-header">
                    <div className="survey-type">
                      {getSurveyTypeIcon(survey.type)}
                      <span>{survey.type}</span>
                    </div>
                    <span className={getSurveyStatusClass(survey.status)}>
                      {survey.status}
                    </span>
                  </div>
                  <h4 className="survey-title">{survey.title}</h4>
                  <div className="survey-dates">
                    <Calendar size={14} />
                    <span>{new Date(survey.startDate).toLocaleDateString()} - {new Date(survey.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="survey-stats">
                    <div className="survey-stat">
                      <span className="stat-num">{survey.responses}</span>
                      <span className="stat-text">Responses</span>
                    </div>
                    <div className="survey-stat">
                      <span className="stat-num">{getResponseRate(survey.responses, survey.totalInvited)}%</span>
                      <span className="stat-text">Response Rate</span>
                    </div>
                    {survey.avgScore > 0 && (
                      <div className="survey-stat">
                        <span className="stat-num">{survey.avgScore}</span>
                        <span className="stat-text">Avg Score</span>
                      </div>
                    )}
                  </div>
                  <div className="response-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${getResponseRate(survey.responses, survey.totalInvited)}%` }}
                      />
                    </div>
                  </div>
                  <div className="survey-actions">
                    <button className="action-btn">
                      <Eye size={16} />
                      View
                    </button>
                    <button className="action-btn">
                      <Edit size={16} />
                      Edit
                    </button>
                    {survey.status === 'active' && (
                      <button className="action-btn primary">
                        <Send size={16} />
                        Remind
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'recognition' && (
          <div className="recognition-content">
            <div className="recognition-header">
              <div className="recognition-stats">
                <div className="rec-stat">
                  <Trophy size={20} />
                  <span className="rec-stat-value">156</span>
                  <span className="rec-stat-label">This Month</span>
                </div>
                <div className="rec-stat">
                  <Star size={20} />
                  <span className="rec-stat-value">1,842</span>
                  <span className="rec-stat-label">This Year</span>
                </div>
                <div className="rec-stat">
                  <Users size={20} />
                  <span className="rec-stat-value">89%</span>
                  <span className="rec-stat-label">Participation</span>
                </div>
              </div>
              <button className="btn-primary">
                <Gift size={18} />
                Send Recognition
              </button>
            </div>

            <div className="recognition-grid">
              <div className="recognition-feed">
                <h3>Recognition Wall</h3>
                <div className="feed-list">
                  {recognitions.map(rec => (
                    <div key={rec.id} className="recognition-card">
                      <div className="rec-badge">{rec.badge}</div>
                      <div className="rec-content">
                        <div className="rec-header">
                          <div className="rec-from">
                            <span className="rec-avatar">{rec.from.split(' ').map(n => n[0]).join('')}</span>
                            <div className="rec-from-info">
                              <span className="rec-name">{rec.from}</span>
                              <span className="rec-dept">{rec.fromDepartment}</span>
                            </div>
                          </div>
                          <span className="rec-arrow">→</span>
                          <div className="rec-to">
                            <span className="rec-avatar highlight">{rec.to.split(' ').map(n => n[0]).join('')}</span>
                            <div className="rec-to-info">
                              <span className="rec-name">{rec.to}</span>
                              <span className="rec-dept">{rec.toDepartment}</span>
                            </div>
                          </div>
                        </div>
                        <p className="rec-message">{rec.message}</p>
                        <div className="rec-footer">
                          <span className="rec-value-tag">{rec.value}</span>
                          <div className="rec-interactions">
                            <button className="like-btn">
                              <ThumbsUp size={14} />
                              {rec.likes}
                            </button>
                            <span className="rec-date">{new Date(rec.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recognition-sidebar">
                <div className="top-recognized">
                  <h4>Top Recognized</h4>
                  <div className="top-list">
                    <div className="top-item">
                      <span className="top-rank">1</span>
                      <span className="top-avatar">MR</span>
                      <div className="top-info">
                        <span className="top-name">Michael Rodriguez</span>
                        <span className="top-count">24 recognitions</span>
                      </div>
                    </div>
                    <div className="top-item">
                      <span className="top-rank">2</span>
                      <span className="top-avatar">EZ</span>
                      <div className="top-info">
                        <span className="top-name">Emily Zhang</span>
                        <span className="top-count">21 recognitions</span>
                      </div>
                    </div>
                    <div className="top-item">
                      <span className="top-rank">3</span>
                      <span className="top-avatar">DP</span>
                      <div className="top-info">
                        <span className="top-name">David Park</span>
                        <span className="top-count">18 recognitions</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="values-breakdown">
                  <h4>By Value</h4>
                  <div className="values-list">
                    <div className="value-item">
                      <span className="value-name">Excellence</span>
                      <div className="value-bar">
                        <div className="value-fill" style={{ width: '85%' }} />
                      </div>
                      <span className="value-count">42</span>
                    </div>
                    <div className="value-item">
                      <span className="value-name">Teamwork</span>
                      <div className="value-bar">
                        <div className="value-fill" style={{ width: '72%' }} />
                      </div>
                      <span className="value-count">36</span>
                    </div>
                    <div className="value-item">
                      <span className="value-name">Innovation</span>
                      <div className="value-bar">
                        <div className="value-fill" style={{ width: '64%' }} />
                      </div>
                      <span className="value-count">32</span>
                    </div>
                    <div className="value-item">
                      <span className="value-name">Leadership</span>
                      <div className="value-bar">
                        <div className="value-fill" style={{ width: '56%' }} />
                      </div>
                      <span className="value-count">28</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="feedback-content">
            <div className="feedback-stats">
              <div className="fb-stat new">
                <Bell size={20} />
                <span className="fb-stat-value">{feedbackItems.filter(f => f.status === 'new').length}</span>
                <span className="fb-stat-label">New</span>
              </div>
              <div className="fb-stat reviewing">
                <Clock size={20} />
                <span className="fb-stat-value">{feedbackItems.filter(f => f.status === 'reviewing').length}</span>
                <span className="fb-stat-label">Reviewing</span>
              </div>
              <div className="fb-stat addressed">
                <CheckCircle size={20} />
                <span className="fb-stat-value">{feedbackItems.filter(f => f.status === 'addressed').length}</span>
                <span className="fb-stat-label">Addressed</span>
              </div>
              <div className="fb-stat total">
                <MessageSquare size={20} />
                <span className="fb-stat-value">{feedbackItems.length}</span>
                <span className="fb-stat-label">Total</span>
              </div>
            </div>

            <div className="feedback-list-section">
              <div className="section-header">
                <h3>Employee Feedback</h3>
                <button className="btn-outline small">
                  <Filter size={16} />
                  Filter
                </button>
              </div>

              <div className="feedback-list">
                {feedbackItems.map(item => (
                  <div key={item.id} className={`feedback-item ${item.type}`}>
                    <div className="feedback-icon">
                      {getFeedbackTypeIcon(item.type)}
                    </div>
                    <div className="feedback-body">
                      <div className="feedback-header">
                        <span className="feedback-type">{item.type}</span>
                        <span className={getPriorityClass(item.priority)}>{item.priority}</span>
                        <span className={getFeedbackStatusClass(item.status)}>{item.status}</span>
                        {item.anonymous && <span className="anonymous-badge">Anonymous</span>}
                      </div>
                      <p className="feedback-message">{item.message}</p>
                      <div className="feedback-meta">
                        <span className="feedback-dept">{item.department}</span>
                        <span className="feedback-date">{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="feedback-actions">
                      <button className="action-btn">
                        <Eye size={16} />
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

        {activeTab === 'initiatives' && (
          <div className="initiatives-content">
            <div className="initiatives-header">
              <h3>Engagement Initiatives</h3>
              <button className="btn-primary">
                <Plus size={18} />
                New Initiative
              </button>
            </div>

            <div className="initiatives-grid">
              {initiatives.map(initiative => (
                <div key={initiative.id} className={`initiative-card ${initiative.status}`}>
                  <div className="initiative-header">
                    <span className="initiative-category">{initiative.category}</span>
                    <span className={getInitiativeStatusClass(initiative.status)}>
                      {initiative.status.replace('-', ' ')}
                    </span>
                  </div>
                  <h4 className="initiative-title">{initiative.title}</h4>
                  <p className="initiative-desc">{initiative.description}</p>
                  <div className="initiative-dates">
                    <Calendar size={14} />
                    <span>{new Date(initiative.startDate).toLocaleDateString()} - {new Date(initiative.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="initiative-metrics">
                    <div className="metric">
                      <Users size={16} />
                      <span>{initiative.participantCount} Participants</span>
                    </div>
                    {initiative.impactScore > 0 && (
                      <div className="metric">
                        <TrendingUp size={16} />
                        <span>{initiative.impactScore}% Impact Score</span>
                      </div>
                    )}
                  </div>
                  <div className="initiative-actions">
                    <button className="btn-outline small">View Details</button>
                    <button className="action-btn">
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
