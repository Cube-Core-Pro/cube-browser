'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart,
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit3,
  Trash2,
  Eye,
  Download,
  Upload,
  Share2,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clipboard,
  Flag,
  Zap,
  ArrowRight,
  MoreVertical,
  FileText,
  Send,
  Bell,
  Trophy,
  Medal,
  Crown,
  Sparkles
} from 'lucide-react';
import './performance.css';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  manager: string;
  startDate: string;
  avatar?: string;
}

interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  reviewPeriod: string;
  reviewType: 'annual' | 'quarterly' | 'probation' | '360';
  status: 'draft' | 'in_progress' | 'pending_approval' | 'completed';
  dueDate: string;
  completedDate?: string;
  overallRating: number;
  selfRating?: number;
  managerRating?: number;
  goals: Goal[];
  competencies: Competency[];
  feedback: ReviewFeedback[];
  strengths: string[];
  areasForImprovement: string[];
  reviewer: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'performance' | 'development' | 'project' | 'behavioral';
  priority: 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  dueDate: string;
  weight: number;
  metrics?: string;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface Competency {
  id: string;
  name: string;
  category: 'core' | 'leadership' | 'technical' | 'interpersonal';
  rating: number;
  maxRating: number;
  description: string;
  behaviors: string[];
}

interface ReviewFeedback {
  id: string;
  from: string;
  role: 'manager' | 'peer' | 'direct_report' | 'self';
  date: string;
  rating: number;
  comments: string;
  anonymous: boolean;
}

interface PerformanceMetrics {
  totalEmployees: number;
  reviewsInProgress: number;
  reviewsCompleted: number;
  averageRating: number;
  goalsAchieved: number;
  upcomingReviews: number;
  overdueReviews: number;
  topPerformers: number;
}

const PerformancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'goals' | 'feedback' | 'analytics'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  const [metrics] = useState<PerformanceMetrics>({
    totalEmployees: 156,
    reviewsInProgress: 42,
    reviewsCompleted: 89,
    averageRating: 4.2,
    goalsAchieved: 73,
    upcomingReviews: 24,
    overdueReviews: 5,
    topPerformers: 18
  });

  const [reviews] = useState<PerformanceReview[]>([
    {
      id: 'REV-001',
      employeeId: 'EMP-001',
      employeeName: 'Alex Thompson',
      department: 'Engineering',
      reviewPeriod: 'Q4 2025',
      reviewType: 'quarterly',
      status: 'completed',
      dueDate: '2025-12-31',
      completedDate: '2025-12-28',
      overallRating: 4.5,
      selfRating: 4.3,
      managerRating: 4.5,
      goals: [],
      competencies: [],
      feedback: [],
      strengths: ['Technical expertise', 'Problem solving', 'Team collaboration'],
      areasForImprovement: ['Documentation', 'Time estimation'],
      reviewer: 'Sarah Chen'
    },
    {
      id: 'REV-002',
      employeeId: 'EMP-002',
      employeeName: 'Maria Garcia',
      department: 'Product',
      reviewPeriod: 'Q4 2025',
      reviewType: 'quarterly',
      status: 'pending_approval',
      dueDate: '2025-12-31',
      overallRating: 4.8,
      selfRating: 4.5,
      managerRating: 4.8,
      goals: [],
      competencies: [],
      feedback: [],
      strengths: ['Strategic thinking', 'Stakeholder management', 'Innovation'],
      areasForImprovement: ['Delegation'],
      reviewer: 'David Park'
    },
    {
      id: 'REV-003',
      employeeId: 'EMP-003',
      employeeName: 'James Wilson',
      department: 'Design',
      reviewPeriod: 'Annual 2025',
      reviewType: 'annual',
      status: 'in_progress',
      dueDate: '2026-01-15',
      overallRating: 0,
      goals: [],
      competencies: [],
      feedback: [],
      strengths: [],
      areasForImprovement: [],
      reviewer: 'Emily Roberts'
    },
    {
      id: 'REV-004',
      employeeId: 'EMP-004',
      employeeName: 'Sarah Chen',
      department: 'Engineering',
      reviewPeriod: 'Q4 2025',
      reviewType: 'quarterly',
      status: 'completed',
      dueDate: '2025-12-31',
      completedDate: '2025-12-29',
      overallRating: 4.7,
      selfRating: 4.4,
      managerRating: 4.7,
      goals: [],
      competencies: [],
      feedback: [],
      strengths: ['Leadership', 'Mentoring', 'Code quality'],
      areasForImprovement: ['Work-life balance'],
      reviewer: 'Michael Brown'
    },
    {
      id: 'REV-005',
      employeeId: 'EMP-005',
      employeeName: 'David Park',
      department: 'Product',
      reviewPeriod: 'Annual 2025',
      reviewType: 'annual',
      status: 'draft',
      dueDate: '2026-01-20',
      overallRating: 0,
      goals: [],
      competencies: [],
      feedback: [],
      strengths: [],
      areasForImprovement: [],
      reviewer: 'Jennifer Lee'
    },
    {
      id: 'REV-006',
      employeeId: 'EMP-006',
      employeeName: 'Emma Davis',
      department: 'Sales',
      reviewPeriod: 'Q4 2025',
      reviewType: 'quarterly',
      status: 'completed',
      dueDate: '2025-12-31',
      completedDate: '2025-12-30',
      overallRating: 4.9,
      selfRating: 4.7,
      managerRating: 4.9,
      goals: [],
      competencies: [],
      feedback: [],
      strengths: ['Sales performance', 'Client relationships', 'Negotiation'],
      areasForImprovement: ['CRM documentation'],
      reviewer: 'Robert Kim'
    }
  ]);

  const [goals] = useState<Goal[]>([
    {
      id: 'GOAL-001',
      title: 'Increase code coverage to 90%',
      description: 'Improve unit test coverage across all critical modules',
      category: 'performance',
      priority: 'high',
      status: 'in_progress',
      progress: 72,
      dueDate: '2026-03-31',
      weight: 25,
      metrics: '90% code coverage',
      milestones: [
        { id: 'M1', title: 'Audit existing coverage', dueDate: '2026-01-15', completed: true },
        { id: 'M2', title: 'Write tests for core modules', dueDate: '2026-02-15', completed: false },
        { id: 'M3', title: 'Achieve 90% coverage', dueDate: '2026-03-31', completed: false }
      ]
    },
    {
      id: 'GOAL-002',
      title: 'Launch mobile app v2.0',
      description: 'Complete development and launch of mobile application version 2.0',
      category: 'project',
      priority: 'high',
      status: 'in_progress',
      progress: 85,
      dueDate: '2026-02-28',
      weight: 30,
      metrics: 'Successful launch with <0.1% crash rate',
      milestones: [
        { id: 'M1', title: 'Complete development', dueDate: '2026-01-31', completed: true },
        { id: 'M2', title: 'Beta testing', dueDate: '2026-02-15', completed: true },
        { id: 'M3', title: 'Production launch', dueDate: '2026-02-28', completed: false }
      ]
    },
    {
      id: 'GOAL-003',
      title: 'Complete AWS certification',
      description: 'Obtain AWS Solutions Architect certification',
      category: 'development',
      priority: 'medium',
      status: 'in_progress',
      progress: 60,
      dueDate: '2026-04-30',
      weight: 15,
      metrics: 'Certification achieved',
      milestones: [
        { id: 'M1', title: 'Complete training course', dueDate: '2026-02-28', completed: true },
        { id: 'M2', title: 'Practice exams', dueDate: '2026-03-31', completed: false },
        { id: 'M3', title: 'Pass certification exam', dueDate: '2026-04-30', completed: false }
      ]
    },
    {
      id: 'GOAL-004',
      title: 'Improve team communication',
      description: 'Implement regular stand-ups and improve async communication',
      category: 'behavioral',
      priority: 'medium',
      status: 'completed',
      progress: 100,
      dueDate: '2025-12-31',
      weight: 10,
      metrics: 'Team satisfaction score > 4.0',
      milestones: [
        { id: 'M1', title: 'Set up daily stand-ups', dueDate: '2025-10-31', completed: true },
        { id: 'M2', title: 'Implement communication guidelines', dueDate: '2025-11-30', completed: true },
        { id: 'M3', title: 'Achieve satisfaction target', dueDate: '2025-12-31', completed: true }
      ]
    },
    {
      id: 'GOAL-005',
      title: 'Reduce customer support tickets by 25%',
      description: 'Improve product quality and documentation to reduce support load',
      category: 'performance',
      priority: 'high',
      status: 'in_progress',
      progress: 45,
      dueDate: '2026-06-30',
      weight: 20,
      metrics: '25% reduction in tickets',
      milestones: [
        { id: 'M1', title: 'Analyze ticket categories', dueDate: '2026-01-31', completed: true },
        { id: 'M2', title: 'Implement fixes for top issues', dueDate: '2026-03-31', completed: false },
        { id: 'M3', title: 'Achieve 25% reduction', dueDate: '2026-06-30', completed: false }
      ]
    },
    {
      id: 'GOAL-006',
      title: 'Mentor 2 junior developers',
      description: 'Provide mentorship and guidance to help junior team members grow',
      category: 'development',
      priority: 'medium',
      status: 'in_progress',
      progress: 50,
      dueDate: '2026-06-30',
      weight: 15,
      metrics: 'Mentees promoted or meeting expectations',
      milestones: [
        { id: 'M1', title: 'Create mentorship plan', dueDate: '2026-01-15', completed: true },
        { id: 'M2', title: 'Weekly 1:1 sessions', dueDate: '2026-06-30', completed: false },
        { id: 'M3', title: 'Evaluate mentee progress', dueDate: '2026-06-30', completed: false }
      ]
    }
  ]);

  const [competencies] = useState<Competency[]>([
    { id: 'COMP-001', name: 'Communication', category: 'core', rating: 4.5, maxRating: 5, description: 'Ability to communicate effectively', behaviors: ['Clear written communication', 'Active listening', 'Presentation skills'] },
    { id: 'COMP-002', name: 'Problem Solving', category: 'core', rating: 4.8, maxRating: 5, description: 'Analytical and creative problem-solving', behaviors: ['Root cause analysis', 'Creative solutions', 'Data-driven decisions'] },
    { id: 'COMP-003', name: 'Leadership', category: 'leadership', rating: 4.2, maxRating: 5, description: 'Ability to lead and inspire others', behaviors: ['Team motivation', 'Vision setting', 'Accountability'] },
    { id: 'COMP-004', name: 'Technical Excellence', category: 'technical', rating: 4.7, maxRating: 5, description: 'Technical expertise and best practices', behaviors: ['Code quality', 'Architecture', 'Innovation'] },
    { id: 'COMP-005', name: 'Collaboration', category: 'interpersonal', rating: 4.4, maxRating: 5, description: 'Working effectively with others', behaviors: ['Team player', 'Cross-functional work', 'Conflict resolution'] },
    { id: 'COMP-006', name: 'Adaptability', category: 'core', rating: 4.3, maxRating: 5, description: 'Flexibility in changing situations', behaviors: ['Change management', 'Learning agility', 'Resilience'] }
  ]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
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
      completed: 'success',
      in_progress: 'primary',
      pending_approval: 'warning',
      draft: 'muted',
      not_started: 'muted',
      overdue: 'error'
    };
    return colors[status] || 'muted';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      high: 'error',
      medium: 'warning',
      low: 'info'
    };
    return colors[priority] || 'muted';
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return 'success';
    if (rating >= 3.5) return 'primary';
    if (rating >= 2.5) return 'warning';
    return 'error';
  };

  const topPerformers = reviews
    .filter(r => r.status === 'completed' && r.overallRating >= 4.5)
    .sort((a, b) => b.overallRating - a.overallRating)
    .slice(0, 5);

  const ratingDistribution = [
    { label: '5.0', count: 3, color: '#10b981' },
    { label: '4.5-4.9', count: 8, color: '#3b82f6' },
    { label: '4.0-4.4', count: 12, color: '#8b5cf6' },
    { label: '3.5-3.9', count: 6, color: '#f59e0b' },
    { label: '<3.5', count: 2, color: '#ef4444' }
  ];

  const renderOverview = () => (
    <div className="overview-content">
      <div className="metrics-row">
        <div className="metric-card primary">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.totalEmployees}</span>
            <span className="metric-label">Total Employees</span>
          </div>
        </div>
        
        <div className="metric-card warning">
          <div className="metric-icon">
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.reviewsInProgress}</span>
            <span className="metric-label">Reviews In Progress</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.reviewsCompleted}</span>
            <span className="metric-label">Reviews Completed</span>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <Star size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.averageRating.toFixed(1)}</span>
            <span className="metric-label">Average Rating</span>
          </div>
        </div>

        <div className="metric-card accent">
          <div className="metric-icon">
            <Target size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.goalsAchieved}%</span>
            <span className="metric-label">Goals Achieved</span>
          </div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="overview-card">
          <h3>
            <Trophy size={18} />
            Top Performers
          </h3>
          <div className="top-performers-list">
            {topPerformers.map((performer, index) => (
              <div key={performer.id} className="performer-item">
                <div className="rank-badge">
                  {index === 0 && <Crown size={16} />}
                  {index === 1 && <Medal size={16} />}
                  {index === 2 && <Award size={16} />}
                  {index > 2 && <span>#{index + 1}</span>}
                </div>
                <div className="performer-avatar">
                  {performer.employeeName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="performer-info">
                  <span className="performer-name">{performer.employeeName}</span>
                  <span className="performer-dept">{performer.department}</span>
                </div>
                <div className="performer-rating">
                  <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                  <span>{performer.overallRating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card">
          <h3>
            <BarChart3 size={18} />
            Rating Distribution
          </h3>
          <div className="rating-distribution">
            {ratingDistribution.map((item, index) => (
              <div key={index} className="distribution-item">
                <span className="dist-label">{item.label}</span>
                <div className="dist-bar-container">
                  <div 
                    className="dist-bar" 
                    style={{ 
                      width: `${(item.count / Math.max(...ratingDistribution.map(d => d.count))) * 100}%`,
                      background: item.color 
                    }}
                  ></div>
                </div>
                <span className="dist-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card">
          <h3>
            <Target size={18} />
            Goals Progress
          </h3>
          <div className="goals-summary">
            <div className="goal-stat">
              <div className="stat-circle completed">
                <CheckCircle2 size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{goals.filter(g => g.status === 'completed').length}</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>
            <div className="goal-stat">
              <div className="stat-circle in-progress">
                <Clock size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{goals.filter(g => g.status === 'in_progress').length}</span>
                <span className="stat-label">In Progress</span>
              </div>
            </div>
            <div className="goal-stat">
              <div className="stat-circle not-started">
                <AlertCircle size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{goals.filter(g => g.status === 'not_started').length}</span>
                <span className="stat-label">Not Started</span>
              </div>
            </div>
            <div className="goal-stat">
              <div className="stat-circle overdue">
                <XCircle size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{goals.filter(g => g.status === 'overdue').length}</span>
                <span className="stat-label">Overdue</span>
              </div>
            </div>
          </div>
          <div className="overall-progress">
            <div className="progress-header">
              <span>Overall Goal Progress</span>
              <span>{Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>
            <Calendar size={18} />
            Upcoming Reviews
          </h3>
          <div className="upcoming-reviews">
            {reviews
              .filter(r => r.status === 'draft' || r.status === 'in_progress')
              .slice(0, 4)
              .map(review => (
                <div key={review.id} className="upcoming-item">
                  <div className="upcoming-avatar">
                    {review.employeeName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="upcoming-info">
                    <span className="upcoming-name">{review.employeeName}</span>
                    <span className="upcoming-period">{review.reviewPeriod}</span>
                  </div>
                  <div className="upcoming-due">
                    <Calendar size={12} />
                    <span>{formatDate(review.dueDate)}</span>
                  </div>
                </div>
              ))}
          </div>
          <button className="view-all-btn" onClick={() => setActiveTab('reviews')}>
            View All Reviews <ArrowRight size={14} />
          </button>
        </div>

        <div className="overview-card wide">
          <h3>
            <Sparkles size={18} />
            Competency Scores
          </h3>
          <div className="competencies-chart">
            {competencies.map(comp => (
              <div key={comp.id} className="competency-item">
                <div className="comp-header">
                  <span className="comp-name">{comp.name}</span>
                  <span className="comp-score">{comp.rating.toFixed(1)}/{comp.maxRating}</span>
                </div>
                <div className="comp-bar">
                  <div 
                    className="comp-fill"
                    style={{ width: `${(comp.rating / comp.maxRating) * 100}%` }}
                  ></div>
                </div>
                <span className={`comp-category ${comp.category}`}>{comp.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="reviews-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="completed">Completed</option>
          </select>
          <select
            className="filter-select"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="all">All Periods</option>
            <option value="Q4 2025">Q4 2025</option>
            <option value="Annual 2025">Annual 2025</option>
            <option value="Q1 2026">Q1 2026</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline small">
            <Download size={16} /> Export
          </button>
          <button className="btn-primary">
            <Plus size={16} /> New Review
          </button>
        </div>
      </div>

      <div className="reviews-table">
        <div className="table-header">
          <span>Employee</span>
          <span>Review Period</span>
          <span>Type</span>
          <span>Status</span>
          <span>Rating</span>
          <span>Reviewer</span>
          <span>Due Date</span>
          <span>Actions</span>
        </div>
        {reviews
          .filter(r => 
            (statusFilter === 'all' || r.status === statusFilter) &&
            (periodFilter === 'all' || r.reviewPeriod === periodFilter) &&
            (searchTerm === '' || r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map(review => (
            <div 
              key={review.id} 
              className={`table-row ${selectedReview?.id === review.id ? 'selected' : ''}`}
              onClick={() => setSelectedReview(selectedReview?.id === review.id ? null : review)}
            >
              <div className="employee-cell">
                <div className="employee-avatar">
                  {review.employeeName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="employee-info">
                  <span className="name">{review.employeeName}</span>
                  <span className="dept">{review.department}</span>
                </div>
              </div>
              <span className="period-cell">{review.reviewPeriod}</span>
              <span className="type-cell">{review.reviewType}</span>
              <div className={`status-cell ${getStatusColor(review.status)}`}>
                {review.status.replace('_', ' ')}
              </div>
              <div className="rating-cell">
                {review.overallRating > 0 ? (
                  <div className={`rating-badge ${getRatingColor(review.overallRating)}`}>
                    <Star size={12} />
                    <span>{review.overallRating.toFixed(1)}</span>
                  </div>
                ) : (
                  <span className="no-rating">-</span>
                )}
              </div>
              <span className="reviewer-cell">{review.reviewer}</span>
              <span className="date-cell">{formatDate(review.dueDate)}</span>
              <div className="actions-cell">
                <button className="btn-icon small" title="View">
                  <Eye size={14} />
                </button>
                <button className="btn-icon small" title="Edit">
                  <Edit3 size={14} />
                </button>
                <button className="btn-icon small" title="More">
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>
          ))}
      </div>

      {selectedReview && (
        <div className="review-detail-panel">
          <div className="panel-header">
            <div className="review-header">
              <div className="large-avatar">
                {selectedReview.employeeName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="header-info">
                <h3>{selectedReview.employeeName}</h3>
                <p>{selectedReview.reviewPeriod} • {selectedReview.reviewType}</p>
              </div>
            </div>
            <button className="close-btn" onClick={() => setSelectedReview(null)}>
              <XCircle size={20} />
            </button>
          </div>
          <div className="panel-content">
            {selectedReview.overallRating > 0 && (
              <div className="ratings-section">
                <h4>Ratings</h4>
                <div className="ratings-grid">
                  <div className="rating-item overall">
                    <span className="rating-label">Overall</span>
                    <div className={`rating-value ${getRatingColor(selectedReview.overallRating)}`}>
                      <Star size={20} fill="currentColor" />
                      <span>{selectedReview.overallRating.toFixed(1)}</span>
                    </div>
                  </div>
                  {selectedReview.selfRating && (
                    <div className="rating-item">
                      <span className="rating-label">Self Rating</span>
                      <div className="rating-value">
                        <span>{selectedReview.selfRating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {selectedReview.managerRating && (
                    <div className="rating-item">
                      <span className="rating-label">Manager Rating</span>
                      <div className="rating-value">
                        <span>{selectedReview.managerRating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedReview.strengths.length > 0 && (
              <div className="detail-section">
                <h4><ThumbsUp size={16} /> Strengths</h4>
                <ul className="strengths-list">
                  {selectedReview.strengths.map((strength, idx) => (
                    <li key={idx}><CheckCircle2 size={14} /> {strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedReview.areasForImprovement.length > 0 && (
              <div className="detail-section">
                <h4><Target size={16} /> Areas for Improvement</h4>
                <ul className="improvement-list">
                  {selectedReview.areasForImprovement.map((area, idx) => (
                    <li key={idx}><Flag size={14} /> {area}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="detail-section">
              <h4><FileText size={16} /> Review Details</h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="label">Reviewer</span>
                  <span className="value">{selectedReview.reviewer}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Due Date</span>
                  <span className="value">{formatDate(selectedReview.dueDate)}</span>
                </div>
                {selectedReview.completedDate && (
                  <div className="detail-row">
                    <span className="label">Completed</span>
                    <span className="value">{formatDate(selectedReview.completedDate)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-primary">
                <Edit3 size={16} /> Edit Review
              </button>
              {selectedReview.status === 'pending_approval' && (
                <button className="btn-outline success">
                  <CheckCircle2 size={16} /> Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderGoals = () => (
    <div className="goals-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search goals..." />
          </div>
          <select className="filter-select">
            <option value="all">All Categories</option>
            <option value="performance">Performance</option>
            <option value="development">Development</option>
            <option value="project">Project</option>
            <option value="behavioral">Behavioral</option>
          </select>
          <select className="filter-select">
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="not_started">Not Started</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary">
            <Plus size={16} /> Add Goal
          </button>
        </div>
      </div>

      <div className="goals-grid">
        {goals.map(goal => (
          <div 
            key={goal.id} 
            className={`goal-card ${selectedGoal?.id === goal.id ? 'selected' : ''}`}
            onClick={() => setSelectedGoal(selectedGoal?.id === goal.id ? null : goal)}
          >
            <div className="goal-header">
              <div className={`category-badge ${goal.category}`}>
                {goal.category}
              </div>
              <div className={`priority-badge ${getPriorityColor(goal.priority)}`}>
                {goal.priority}
              </div>
            </div>
            <h4>{goal.title}</h4>
            <p className="goal-description">{goal.description}</p>
            
            <div className="goal-progress">
              <div className="progress-header">
                <span>Progress</span>
                <span className="progress-value">{goal.progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${getStatusColor(goal.status)}`}
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="goal-meta">
              <div className="meta-item">
                <Calendar size={14} />
                <span>Due: {formatDate(goal.dueDate)}</span>
              </div>
              <div className="meta-item">
                <Target size={14} />
                <span>Weight: {goal.weight}%</span>
              </div>
            </div>

            <div className="milestones-preview">
              <span className="milestones-label">
                Milestones: {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length}
              </span>
              <div className="milestones-dots">
                {goal.milestones.map(m => (
                  <div key={m.id} className={`milestone-dot ${m.completed ? 'completed' : ''}`}></div>
                ))}
              </div>
            </div>

            <div className="goal-footer">
              <div className={`status-badge ${getStatusColor(goal.status)}`}>
                {goal.status === 'completed' && <CheckCircle2 size={12} />}
                {goal.status === 'in_progress' && <Clock size={12} />}
                {goal.status === 'not_started' && <AlertCircle size={12} />}
                {goal.status === 'overdue' && <XCircle size={12} />}
                {goal.status.replace('_', ' ')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedGoal && (
        <div className="goal-detail-panel">
          <div className="panel-header">
            <h3>{selectedGoal.title}</h3>
            <button className="close-btn" onClick={() => setSelectedGoal(null)}>
              <XCircle size={20} />
            </button>
          </div>
          <div className="panel-content">
            <div className="detail-section">
              <p className="goal-full-description">{selectedGoal.description}</p>
            </div>

            <div className="detail-section">
              <h4>Progress</h4>
              <div className="large-progress">
                <div className="progress-circle">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#2a2a3a" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="#8b5cf6" 
                      strokeWidth="8" 
                      strokeDasharray={`${selectedGoal.progress * 2.83} 283`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="progress-text">
                    <span className="progress-value">{selectedGoal.progress}%</span>
                    <span className="progress-label">Complete</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Milestones</h4>
              <div className="milestones-list">
                {selectedGoal.milestones.map(milestone => (
                  <div key={milestone.id} className={`milestone-item ${milestone.completed ? 'completed' : ''}`}>
                    <div className="milestone-check">
                      {milestone.completed ? <CheckCircle2 size={18} /> : <div className="empty-check"></div>}
                    </div>
                    <div className="milestone-info">
                      <span className="milestone-title">{milestone.title}</span>
                      <span className="milestone-date">{formatDate(milestone.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedGoal.metrics && (
              <div className="detail-section">
                <h4>Success Metrics</h4>
                <p className="metrics-text">{selectedGoal.metrics}</p>
              </div>
            )}

            <div className="panel-actions">
              <button className="btn-primary">
                <Edit3 size={16} /> Update Progress
              </button>
              <button className="btn-outline">
                <MessageSquare size={16} /> Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFeedback = () => (
    <div className="feedback-content">
      <div className="feedback-header">
        <h3>360° Feedback Management</h3>
        <p>Collect and manage feedback from multiple sources</p>
      </div>

      <div className="feedback-actions">
        <button className="btn-primary">
          <Send size={16} /> Request Feedback
        </button>
        <button className="btn-outline">
          <MessageSquare size={16} /> Give Feedback
        </button>
      </div>

      <div className="feedback-grid">
        <div className="feedback-card">
          <h4>
            <Bell size={18} />
            Pending Requests
          </h4>
          <div className="pending-list">
            <div className="pending-item">
              <div className="pending-avatar">JW</div>
              <div className="pending-info">
                <span className="pending-name">James Wilson</span>
                <span className="pending-type">Peer Review</span>
              </div>
              <div className="pending-due">Due in 3 days</div>
              <button className="btn-primary small">Provide</button>
            </div>
            <div className="pending-item">
              <div className="pending-avatar">SC</div>
              <div className="pending-info">
                <span className="pending-name">Sarah Chen</span>
                <span className="pending-type">Manager Review</span>
              </div>
              <div className="pending-due">Due in 5 days</div>
              <button className="btn-primary small">Provide</button>
            </div>
          </div>
        </div>

        <div className="feedback-card">
          <h4>
            <MessageSquare size={18} />
            Recent Feedback Given
          </h4>
          <div className="given-list">
            <div className="given-item">
              <div className="given-avatar">AT</div>
              <div className="given-info">
                <span className="given-name">To: Alex Thompson</span>
                <span className="given-date">Jan 10, 2026</span>
              </div>
              <div className="given-rating">
                <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                <span>4.5</span>
              </div>
            </div>
            <div className="given-item">
              <div className="given-avatar">MG</div>
              <div className="given-info">
                <span className="given-name">To: Maria Garcia</span>
                <span className="given-date">Jan 8, 2026</span>
              </div>
              <div className="given-rating">
                <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                <span>4.8</span>
              </div>
            </div>
          </div>
        </div>

        <div className="feedback-card wide">
          <h4>
            <BarChart3 size={18} />
            Feedback Summary
          </h4>
          <div className="feedback-summary">
            <div className="summary-item">
              <div className="summary-icon received">
                <MessageSquare size={20} />
              </div>
              <div className="summary-info">
                <span className="summary-value">24</span>
                <span className="summary-label">Feedback Received</span>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-icon given">
                <Send size={20} />
              </div>
              <div className="summary-info">
                <span className="summary-value">18</span>
                <span className="summary-label">Feedback Given</span>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-icon pending">
                <Clock size={20} />
              </div>
              <div className="summary-info">
                <span className="summary-value">5</span>
                <span className="summary-label">Pending Requests</span>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-icon rating">
                <Star size={20} />
              </div>
              <div className="summary-info">
                <span className="summary-value">4.3</span>
                <span className="summary-label">Avg Rating Received</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-content">
      <div className="analytics-header">
        <h3>Performance Analytics</h3>
        <div className="analytics-filters">
          <select className="filter-select">
            <option>Last 12 Months</option>
            <option>Last 6 Months</option>
            <option>Last Quarter</option>
            <option>Year to Date</option>
          </select>
          <button className="btn-outline small">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Rating Trends</h4>
          <div className="trend-chart">
            <div className="trend-bars">
              {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, idx) => {
                const heights = [75, 80, 82, 88];
                return (
                  <div key={quarter} className="trend-bar-group">
                    <div className="trend-bar" style={{ height: `${heights[idx]}%` }}></div>
                    <span className="trend-label">{quarter}</span>
                  </div>
                );
              })}
            </div>
            <div className="trend-legend">
              <span>Average Rating by Quarter</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Department Performance</h4>
          <div className="dept-performance">
            {[
              { name: 'Engineering', rating: 4.5, employees: 45 },
              { name: 'Product', rating: 4.4, employees: 18 },
              { name: 'Design', rating: 4.3, employees: 12 },
              { name: 'Sales', rating: 4.6, employees: 28 },
              { name: 'Marketing', rating: 4.2, employees: 15 }
            ].map(dept => (
              <div key={dept.name} className="dept-item">
                <div className="dept-info">
                  <span className="dept-name">{dept.name}</span>
                  <span className="dept-count">{dept.employees} employees</span>
                </div>
                <div className="dept-bar-container">
                  <div 
                    className="dept-bar"
                    style={{ width: `${(dept.rating / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="dept-rating">{dept.rating.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h4>Goal Completion Rate</h4>
          <div className="completion-chart">
            <div className="completion-donut">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a3a" strokeWidth="12" />
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="12" 
                  strokeDasharray="184 251.2"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="donut-center">
                <span className="donut-value">73%</span>
                <span className="donut-label">Completed</span>
              </div>
            </div>
            <div className="completion-legend">
              <div className="legend-item">
                <span className="legend-dot completed"></span>
                <span>Completed (73%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot in-progress"></span>
                <span>In Progress (20%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot overdue"></span>
                <span>Overdue (7%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Review Cycle Status</h4>
          <div className="cycle-status">
            <div className="cycle-item">
              <div className="cycle-icon completed">
                <CheckCircle2 size={20} />
              </div>
              <div className="cycle-info">
                <span className="cycle-value">89</span>
                <span className="cycle-label">Completed</span>
              </div>
              <span className="cycle-percent">57%</span>
            </div>
            <div className="cycle-item">
              <div className="cycle-icon in-progress">
                <Clock size={20} />
              </div>
              <div className="cycle-info">
                <span className="cycle-value">42</span>
                <span className="cycle-label">In Progress</span>
              </div>
              <span className="cycle-percent">27%</span>
            </div>
            <div className="cycle-item">
              <div className="cycle-icon pending">
                <AlertCircle size={20} />
              </div>
              <div className="cycle-info">
                <span className="cycle-value">20</span>
                <span className="cycle-label">Not Started</span>
              </div>
              <span className="cycle-percent">13%</span>
            </div>
            <div className="cycle-item">
              <div className="cycle-icon overdue">
                <XCircle size={20} />
              </div>
              <div className="cycle-info">
                <span className="cycle-value">5</span>
                <span className="cycle-label">Overdue</span>
              </div>
              <span className="cycle-percent">3%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="performance-page">
      <div className="perf__header">
        <div className="perf__title-section">
          <div className="perf__icon">
            <Award size={28} />
          </div>
          <div>
            <h1>Performance Management</h1>
            <p>Track goals, reviews, and employee development</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            Start Review
          </button>
        </div>
      </div>

      <div className="perf__tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={18} />
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <Clipboard size={18} />
          Reviews
          <span className="tab-badge">{reviews.filter(r => r.status !== 'completed').length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          <Target size={18} />
          Goals
          <span className="tab-badge">{goals.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <MessageSquare size={18} />
          Feedback
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <LineChart size={18} />
          Analytics
        </button>
      </div>

      <div className="perf__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'goals' && renderGoals()}
        {activeTab === 'feedback' && renderFeedback()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
};

export default PerformancePage;
