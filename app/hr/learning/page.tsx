'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Video,
  FileText,
  Award,
  Clock,
  Calendar,
  Users,
  Star,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Search,
  Filter,
  Plus,
  ChevronRight,
  ChevronDown,
  Edit3,
  Trash2,
  Eye,
  Download,
  Upload,
  Share2,
  RefreshCw,
  ArrowRight,
  MoreVertical,
  Target,
  Trophy,
  Bookmark,
  BookmarkCheck,
  Heart,
  MessageSquare,
  Sparkles,
  Zap,
  Globe,
  Lock,
  Unlock,
  PlayCircle,
  StopCircle,
  SkipForward,
  Volume2,
  Maximize2,
  List,
  Grid3X3,
  ExternalLink
} from 'lucide-react';
import './learning.css';

interface Course {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'leadership' | 'compliance' | 'soft-skills' | 'product';
  level: 'beginner' | 'intermediate' | 'advanced';
  instructor: string;
  duration: number;
  modules: number;
  enrolled: number;
  rating: number;
  reviews: number;
  thumbnail: string;
  status: 'published' | 'draft' | 'archived';
  mandatory: boolean;
  certificationAvailable: boolean;
  completionRate: number;
  tags: string[];
  createdDate: string;
  updatedDate: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: string[];
  duration: number;
  level: string;
  enrolled: number;
  completionRate: number;
  skills: string[];
  thumbnail: string;
}

interface Enrollment {
  id: string;
  courseId: string;
  courseName: string;
  progress: number;
  startDate: string;
  lastAccessed: string;
  completedModules: number;
  totalModules: number;
  status: 'in_progress' | 'completed' | 'not_started';
  dueDate?: string;
  certificationEarned?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'certification' | 'badge' | 'milestone';
  earnedDate: string;
  course?: string;
  icon: string;
}

interface LearningMetrics {
  totalCourses: number;
  enrolledCourses: number;
  completedCourses: number;
  hoursLearned: number;
  certificationsEarned: number;
  averageRating: number;
  learningStreak: number;
  skillsAcquired: number;
}

const LearningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog' | 'my-learning' | 'paths' | 'achievements'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [metrics] = useState<LearningMetrics>({
    totalCourses: 156,
    enrolledCourses: 12,
    completedCourses: 24,
    hoursLearned: 87,
    certificationsEarned: 8,
    averageRating: 4.6,
    learningStreak: 15,
    skillsAcquired: 32
  });

  const [courses] = useState<Course[]>([
    {
      id: 'CRS-001',
      title: 'Advanced TypeScript Patterns',
      description: 'Master advanced TypeScript patterns including generics, conditional types, and mapped types for enterprise applications.',
      category: 'technical',
      level: 'advanced',
      instructor: 'Sarah Chen',
      duration: 480,
      modules: 12,
      enrolled: 1247,
      rating: 4.8,
      reviews: 342,
      thumbnail: '/courses/typescript.jpg',
      status: 'published',
      mandatory: false,
      certificationAvailable: true,
      completionRate: 78,
      tags: ['TypeScript', 'JavaScript', 'Programming'],
      createdDate: '2025-06-15',
      updatedDate: '2025-12-20'
    },
    {
      id: 'CRS-002',
      title: 'Leadership Excellence',
      description: 'Develop essential leadership skills including communication, delegation, and team motivation strategies.',
      category: 'leadership',
      level: 'intermediate',
      instructor: 'Michael Brown',
      duration: 360,
      modules: 8,
      enrolled: 892,
      rating: 4.7,
      reviews: 215,
      thumbnail: '/courses/leadership.jpg',
      status: 'published',
      mandatory: false,
      certificationAvailable: true,
      completionRate: 82,
      tags: ['Leadership', 'Management', 'Communication'],
      createdDate: '2025-04-10',
      updatedDate: '2025-11-15'
    },
    {
      id: 'CRS-003',
      title: 'Data Privacy & Security Compliance',
      description: 'Comprehensive training on GDPR, CCPA, and enterprise data security best practices.',
      category: 'compliance',
      level: 'beginner',
      instructor: 'Jennifer Lee',
      duration: 180,
      modules: 6,
      enrolled: 2341,
      rating: 4.5,
      reviews: 567,
      thumbnail: '/courses/compliance.jpg',
      status: 'published',
      mandatory: true,
      certificationAvailable: true,
      completionRate: 91,
      tags: ['Security', 'Compliance', 'GDPR', 'Privacy'],
      createdDate: '2025-01-20',
      updatedDate: '2025-10-30'
    },
    {
      id: 'CRS-004',
      title: 'Effective Communication Skills',
      description: 'Learn to communicate effectively in professional settings, including presentations and difficult conversations.',
      category: 'soft-skills',
      level: 'beginner',
      instructor: 'Emily Roberts',
      duration: 240,
      modules: 8,
      enrolled: 1567,
      rating: 4.6,
      reviews: 423,
      thumbnail: '/courses/communication.jpg',
      status: 'published',
      mandatory: false,
      certificationAvailable: false,
      completionRate: 85,
      tags: ['Communication', 'Soft Skills', 'Presentation'],
      createdDate: '2025-03-05',
      updatedDate: '2025-09-18'
    },
    {
      id: 'CRS-005',
      title: 'React & Next.js Masterclass',
      description: 'Build modern web applications with React 18 and Next.js 14, including server components and app router.',
      category: 'technical',
      level: 'intermediate',
      instructor: 'Alex Thompson',
      duration: 600,
      modules: 15,
      enrolled: 2156,
      rating: 4.9,
      reviews: 687,
      thumbnail: '/courses/react.jpg',
      status: 'published',
      mandatory: false,
      certificationAvailable: true,
      completionRate: 72,
      tags: ['React', 'Next.js', 'JavaScript', 'Web Development'],
      createdDate: '2025-07-01',
      updatedDate: '2026-01-10'
    },
    {
      id: 'CRS-006',
      title: 'CUBE Platform Deep Dive',
      description: 'Complete guide to CUBE platform features, integrations, and best practices for enterprise deployment.',
      category: 'product',
      level: 'beginner',
      instructor: 'David Park',
      duration: 300,
      modules: 10,
      enrolled: 3421,
      rating: 4.7,
      reviews: 892,
      thumbnail: '/courses/cube.jpg',
      status: 'published',
      mandatory: true,
      certificationAvailable: true,
      completionRate: 88,
      tags: ['CUBE', 'Product', 'Enterprise'],
      createdDate: '2025-02-15',
      updatedDate: '2026-01-05'
    },
    {
      id: 'CRS-007',
      title: 'AWS Cloud Architecture',
      description: 'Design and implement scalable cloud solutions using AWS services including EC2, Lambda, and S3.',
      category: 'technical',
      level: 'advanced',
      instructor: 'James Wilson',
      duration: 540,
      modules: 14,
      enrolled: 1089,
      rating: 4.8,
      reviews: 298,
      thumbnail: '/courses/aws.jpg',
      status: 'published',
      mandatory: false,
      certificationAvailable: true,
      completionRate: 65,
      tags: ['AWS', 'Cloud', 'Architecture', 'DevOps'],
      createdDate: '2025-05-20',
      updatedDate: '2025-12-15'
    },
    {
      id: 'CRS-008',
      title: 'Project Management Fundamentals',
      description: 'Learn Agile, Scrum, and traditional project management methodologies for effective team coordination.',
      category: 'soft-skills',
      level: 'intermediate',
      instructor: 'Maria Garcia',
      duration: 420,
      modules: 11,
      enrolled: 1678,
      rating: 4.6,
      reviews: 456,
      thumbnail: '/courses/pm.jpg',
      status: 'published',
      mandatory: false,
      certificationAvailable: true,
      completionRate: 79,
      tags: ['Project Management', 'Agile', 'Scrum'],
      createdDate: '2025-04-25',
      updatedDate: '2025-11-20'
    }
  ]);

  const [learningPaths] = useState<LearningPath[]>([
    {
      id: 'PATH-001',
      title: 'Full Stack Developer',
      description: 'Master front-end and back-end development with modern frameworks and best practices.',
      courses: ['CRS-001', 'CRS-005', 'CRS-007'],
      duration: 1620,
      level: 'Intermediate to Advanced',
      enrolled: 567,
      completionRate: 45,
      skills: ['TypeScript', 'React', 'Node.js', 'AWS', 'PostgreSQL'],
      thumbnail: '/paths/fullstack.jpg'
    },
    {
      id: 'PATH-002',
      title: 'Engineering Leadership',
      description: 'Transition from individual contributor to engineering leader with technical and people skills.',
      courses: ['CRS-002', 'CRS-004', 'CRS-008'],
      duration: 1020,
      level: 'Intermediate',
      enrolled: 324,
      completionRate: 52,
      skills: ['Leadership', 'Communication', 'Team Management', 'Agile'],
      thumbnail: '/paths/leadership.jpg'
    },
    {
      id: 'PATH-003',
      title: 'CUBE Platform Expert',
      description: 'Become a certified CUBE platform expert with comprehensive product knowledge.',
      courses: ['CRS-006', 'CRS-003'],
      duration: 480,
      level: 'Beginner to Intermediate',
      enrolled: 892,
      completionRate: 68,
      skills: ['CUBE Platform', 'Enterprise Features', 'Compliance'],
      thumbnail: '/paths/cube-expert.jpg'
    }
  ]);

  const [enrollments] = useState<Enrollment[]>([
    {
      id: 'ENR-001',
      courseId: 'CRS-005',
      courseName: 'React & Next.js Masterclass',
      progress: 65,
      startDate: '2025-12-01',
      lastAccessed: '2026-01-14',
      completedModules: 10,
      totalModules: 15,
      status: 'in_progress'
    },
    {
      id: 'ENR-002',
      courseId: 'CRS-003',
      courseName: 'Data Privacy & Security Compliance',
      progress: 100,
      startDate: '2025-11-15',
      lastAccessed: '2025-12-20',
      completedModules: 6,
      totalModules: 6,
      status: 'completed',
      certificationEarned: true
    },
    {
      id: 'ENR-003',
      courseId: 'CRS-006',
      courseName: 'CUBE Platform Deep Dive',
      progress: 40,
      startDate: '2026-01-05',
      lastAccessed: '2026-01-14',
      completedModules: 4,
      totalModules: 10,
      status: 'in_progress',
      dueDate: '2026-02-28'
    },
    {
      id: 'ENR-004',
      courseId: 'CRS-001',
      courseName: 'Advanced TypeScript Patterns',
      progress: 0,
      startDate: '2026-01-10',
      lastAccessed: '2026-01-10',
      completedModules: 0,
      totalModules: 12,
      status: 'not_started'
    },
    {
      id: 'ENR-005',
      courseId: 'CRS-002',
      courseName: 'Leadership Excellence',
      progress: 100,
      startDate: '2025-09-01',
      lastAccessed: '2025-11-30',
      completedModules: 8,
      totalModules: 8,
      status: 'completed',
      certificationEarned: true
    }
  ]);

  const [achievements] = useState<Achievement[]>([
    { id: 'ACH-001', title: 'TypeScript Expert', description: 'Completed Advanced TypeScript Patterns certification', type: 'certification', earnedDate: '2025-08-15', course: 'Advanced TypeScript Patterns', icon: '🏆' },
    { id: 'ACH-002', title: 'Security Champion', description: 'Completed Data Privacy & Security Compliance', type: 'certification', earnedDate: '2025-12-20', course: 'Data Privacy & Security Compliance', icon: '🛡️' },
    { id: 'ACH-003', title: 'Fast Learner', description: 'Completed 5 courses in one month', type: 'badge', earnedDate: '2025-10-30', icon: '⚡' },
    { id: 'ACH-004', title: 'Perfect Score', description: 'Achieved 100% on a course quiz', type: 'badge', earnedDate: '2025-11-15', icon: '💯' },
    { id: 'ACH-005', title: 'Leadership Certified', description: 'Completed Leadership Excellence certification', type: 'certification', earnedDate: '2025-11-30', course: 'Leadership Excellence', icon: '👑' },
    { id: 'ACH-006', title: '100 Hours Club', description: 'Logged 100+ hours of learning', type: 'milestone', earnedDate: '2025-12-01', icon: '📚' },
    { id: 'ACH-007', title: 'Streak Master', description: 'Maintained a 30-day learning streak', type: 'badge', earnedDate: '2025-12-15', icon: '🔥' },
    { id: 'ACH-008', title: 'CUBE Expert', description: 'Completed CUBE Platform certification', type: 'certification', earnedDate: '2026-01-10', course: 'CUBE Platform Deep Dive', icon: '🎯' }
  ]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      technical: 'blue',
      leadership: 'purple',
      compliance: 'red',
      'soft-skills': 'green',
      product: 'orange'
    };
    return colors[category] || 'gray';
  };

  const getLevelColor = (level: string): string => {
    const colors: Record<string, string> = {
      beginner: 'success',
      intermediate: 'warning',
      advanced: 'error'
    };
    return colors[level] || 'muted';
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <BookOpen size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.enrolledCourses}</span>
            <span className="metric-label">Enrolled Courses</span>
          </div>
          <div className="metric-trend">
            <span>of {metrics.totalCourses} available</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.completedCourses}</span>
            <span className="metric-label">Completed</span>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={14} />
            <span>+3 this month</span>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.hoursLearned}</span>
            <span className="metric-label">Hours Learned</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <Award size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.certificationsEarned}</span>
            <span className="metric-label">Certifications</span>
          </div>
        </div>

        <div className="metric-card accent">
          <div className="metric-icon">
            <Zap size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.learningStreak}</span>
            <span className="metric-label">Day Streak 🔥</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>
            <PlayCircle size={18} />
            Continue Learning
          </h3>
          <div className="continue-list">
            {enrollments
              .filter(e => e.status === 'in_progress')
              .slice(0, 3)
              .map(enrollment => (
                <div key={enrollment.id} className="continue-item">
                  <div className="course-thumbnail">
                    <PlayCircle size={24} />
                  </div>
                  <div className="course-info">
                    <span className="course-name">{enrollment.courseName}</span>
                    <div className="course-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${enrollment.progress}%` }}></div>
                      </div>
                      <span className="progress-text">{enrollment.progress}%</span>
                    </div>
                  </div>
                  <button className="continue-btn">
                    <Play size={16} /> Resume
                  </button>
                </div>
              ))}
          </div>
          <button className="view-all-btn" onClick={() => setActiveTab('my-learning')}>
            View All <ArrowRight size={14} />
          </button>
        </div>

        <div className="dashboard-card">
          <h3>
            <Trophy size={18} />
            Recent Achievements
          </h3>
          <div className="achievements-list">
            {achievements.slice(0, 4).map(achievement => (
              <div key={achievement.id} className={`achievement-item ${achievement.type}`}>
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-info">
                  <span className="achievement-title">{achievement.title}</span>
                  <span className="achievement-date">{formatDate(achievement.earnedDate)}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="view-all-btn" onClick={() => setActiveTab('achievements')}>
            View All <ArrowRight size={14} />
          </button>
        </div>

        <div className="dashboard-card">
          <h3>
            <Star size={18} />
            Recommended For You
          </h3>
          <div className="recommended-list">
            {courses.slice(0, 3).map(course => (
              <div key={course.id} className="recommended-item">
                <div className={`category-dot ${getCategoryColor(course.category)}`}></div>
                <div className="recommended-info">
                  <span className="recommended-title">{course.title}</span>
                  <div className="recommended-meta">
                    <span><Clock size={12} /> {formatDuration(course.duration)}</span>
                    <span><Star size={12} /> {course.rating}</span>
                  </div>
                </div>
                <button className="btn-icon small">
                  <Bookmark size={14} />
                </button>
              </div>
            ))}
          </div>
          <button className="view-all-btn" onClick={() => setActiveTab('catalog')}>
            Browse Catalog <ArrowRight size={14} />
          </button>
        </div>

        <div className="dashboard-card">
          <h3>
            <Target size={18} />
            Learning Goals
          </h3>
          <div className="goals-list">
            <div className="goal-item">
              <div className="goal-info">
                <span className="goal-title">Complete Security Training</span>
                <span className="goal-deadline">Due: Jan 31, 2026</span>
              </div>
              <div className="goal-progress">
                <div className="progress-circle complete">
                  <CheckCircle2 size={20} />
                </div>
              </div>
            </div>
            <div className="goal-item">
              <div className="goal-info">
                <span className="goal-title">Earn React Certification</span>
                <span className="goal-deadline">Due: Feb 28, 2026</span>
              </div>
              <div className="goal-progress">
                <div className="progress-ring">
                  <svg viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#2a2a3a"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeDasharray="65, 100"
                    />
                  </svg>
                  <span>65%</span>
                </div>
              </div>
            </div>
            <div className="goal-item">
              <div className="goal-info">
                <span className="goal-title">Learn 3 New Skills</span>
                <span className="goal-deadline">Due: Mar 31, 2026</span>
              </div>
              <div className="goal-progress">
                <span className="goal-count">2/3</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card wide">
          <h3>
            <BarChart3 size={18} />
            Learning Activity
          </h3>
          <div className="activity-chart">
            <div className="chart-bars">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const heights = [45, 72, 38, 85, 62, 25, 50];
                return (
                  <div key={day} className="chart-bar-group">
                    <div className="chart-bar" style={{ height: `${heights[idx]}%` }}></div>
                    <span className="chart-label">{day}</span>
                  </div>
                );
              })}
            </div>
            <div className="chart-legend">
              <span>Hours learned this week</span>
              <span className="total-hours">12.5 hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCatalog = () => (
    <div className="catalog-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="technical">Technical</option>
            <option value="leadership">Leadership</option>
            <option value="compliance">Compliance</option>
            <option value="soft-skills">Soft Skills</option>
            <option value="product">Product</option>
          </select>
          <select
            className="filter-select"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="toolbar-right">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className={`courses-${viewMode}`}>
        {courses
          .filter(course =>
            (categoryFilter === 'all' || course.category === categoryFilter) &&
            (levelFilter === 'all' || course.level === levelFilter) &&
            (searchTerm === '' || course.title.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map(course => (
            <div
              key={course.id}
              className={`course-card ${selectedCourse?.id === course.id ? 'selected' : ''}`}
              onClick={() => setSelectedCourse(selectedCourse?.id === course.id ? null : course)}
            >
              <div className="course-thumbnail">
                <div className={`thumbnail-placeholder ${getCategoryColor(course.category)}`}>
                  {course.category === 'technical' && <FileText size={32} />}
                  {course.category === 'leadership' && <Users size={32} />}
                  {course.category === 'compliance' && <Lock size={32} />}
                  {course.category === 'soft-skills' && <MessageSquare size={32} />}
                  {course.category === 'product' && <Sparkles size={32} />}
                </div>
                {course.mandatory && <span className="mandatory-badge">Required</span>}
                {course.certificationAvailable && <span className="cert-badge"><Award size={12} /></span>}
              </div>
              <div className="course-content">
                <div className="course-badges">
                  <span className={`category-badge ${getCategoryColor(course.category)}`}>
                    {course.category}
                  </span>
                  <span className={`level-badge ${getLevelColor(course.level)}`}>
                    {course.level}
                  </span>
                </div>
                <h4>{course.title}</h4>
                <p className="course-description">{course.description}</p>
                <div className="course-meta">
                  <span className="instructor">
                    <Users size={14} /> {course.instructor}
                  </span>
                  <span className="duration">
                    <Clock size={14} /> {formatDuration(course.duration)}
                  </span>
                  <span className="modules">
                    <BookOpen size={14} /> {course.modules} modules
                  </span>
                </div>
                <div className="course-footer">
                  <div className="course-rating">
                    <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                    <span>{course.rating}</span>
                    <span className="reviews">({course.reviews})</span>
                  </div>
                  <span className="enrolled">
                    <Users size={14} /> {course.enrolled.toLocaleString()} enrolled
                  </span>
                </div>
              </div>
              <div className="course-actions">
                <button className="btn-primary small">Enroll</button>
                <button className="btn-icon small">
                  <Bookmark size={14} />
                </button>
              </div>
            </div>
          ))}
      </div>

      {selectedCourse && (
        <div className="course-detail-panel">
          <div className="panel-header">
            <h3>{selectedCourse.title}</h3>
            <button className="close-btn" onClick={() => setSelectedCourse(null)}>
              <XCircle size={20} />
            </button>
          </div>
          <div className="panel-content">
            <div className="detail-thumbnail">
              <div className={`thumbnail-placeholder large ${getCategoryColor(selectedCourse.category)}`}>
                <PlayCircle size={48} />
              </div>
            </div>

            <div className="detail-badges">
              <span className={`category-badge ${getCategoryColor(selectedCourse.category)}`}>
                {selectedCourse.category}
              </span>
              <span className={`level-badge ${getLevelColor(selectedCourse.level)}`}>
                {selectedCourse.level}
              </span>
              {selectedCourse.mandatory && <span className="mandatory-badge">Required</span>}
              {selectedCourse.certificationAvailable && (
                <span className="cert-available">
                  <Award size={14} /> Certification
                </span>
              )}
            </div>

            <p className="detail-description">{selectedCourse.description}</p>

            <div className="detail-stats">
              <div className="stat-item">
                <Clock size={18} />
                <div className="stat-info">
                  <span className="stat-value">{formatDuration(selectedCourse.duration)}</span>
                  <span className="stat-label">Duration</span>
                </div>
              </div>
              <div className="stat-item">
                <BookOpen size={18} />
                <div className="stat-info">
                  <span className="stat-value">{selectedCourse.modules}</span>
                  <span className="stat-label">Modules</span>
                </div>
              </div>
              <div className="stat-item">
                <Star size={18} />
                <div className="stat-info">
                  <span className="stat-value">{selectedCourse.rating}</span>
                  <span className="stat-label">{selectedCourse.reviews} reviews</span>
                </div>
              </div>
              <div className="stat-item">
                <Users size={18} />
                <div className="stat-info">
                  <span className="stat-value">{selectedCourse.enrolled.toLocaleString()}</span>
                  <span className="stat-label">Enrolled</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Instructor</h4>
              <div className="instructor-info">
                <div className="instructor-avatar">
                  {selectedCourse.instructor.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="instructor-name">{selectedCourse.instructor}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Skills You&apos;ll Learn</h4>
              <div className="tags-list">
                {selectedCourse.tags.map((tag, idx) => (
                  <span key={idx} className="skill-tag">{tag}</span>
                ))}
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-primary">
                <Play size={16} /> Start Learning
              </button>
              <button className="btn-outline">
                <Bookmark size={16} /> Save for Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMyLearning = () => (
    <div className="my-learning-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search my courses..." />
          </div>
          <select className="filter-select">
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="not_started">Not Started</option>
          </select>
        </div>
      </div>

      <div className="enrollments-list">
        {enrollments.map(enrollment => (
          <div key={enrollment.id} className={`enrollment-card ${enrollment.status}`}>
            <div className="enrollment-thumbnail">
              <PlayCircle size={32} />
              {enrollment.status === 'completed' && (
                <div className="completed-overlay">
                  <CheckCircle2 size={32} />
                </div>
              )}
            </div>
            <div className="enrollment-content">
              <div className="enrollment-header">
                <h4>{enrollment.courseName}</h4>
                {enrollment.certificationEarned && (
                  <span className="cert-earned">
                    <Award size={14} /> Certified
                  </span>
                )}
              </div>
              <div className="enrollment-progress">
                <div className="progress-info">
                  <span>{enrollment.completedModules}/{enrollment.totalModules} modules</span>
                  <span className="progress-percent">{enrollment.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${enrollment.status === 'completed' ? 'complete' : ''}`}
                    style={{ width: `${enrollment.progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="enrollment-meta">
                <span><Calendar size={12} /> Started: {formatDate(enrollment.startDate)}</span>
                <span><Clock size={12} /> Last accessed: {formatDate(enrollment.lastAccessed)}</span>
                {enrollment.dueDate && (
                  <span className="due-date"><AlertCircle size={12} /> Due: {formatDate(enrollment.dueDate)}</span>
                )}
              </div>
            </div>
            <div className="enrollment-actions">
              {enrollment.status === 'in_progress' && (
                <button className="btn-primary">
                  <Play size={16} /> Continue
                </button>
              )}
              {enrollment.status === 'not_started' && (
                <button className="btn-primary">
                  <Play size={16} /> Start
                </button>
              )}
              {enrollment.status === 'completed' && (
                <>
                  <button className="btn-outline small">
                    <Eye size={14} /> Review
                  </button>
                  {enrollment.certificationEarned && (
                    <button className="btn-outline small">
                      <Download size={14} /> Certificate
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPaths = () => (
    <div className="paths-content">
      <div className="paths-header">
        <h3>Learning Paths</h3>
        <p>Structured courses to help you achieve your career goals</p>
      </div>

      <div className="paths-grid">
        {learningPaths.map(path => (
          <div key={path.id} className="path-card">
            <div className="path-thumbnail">
              <Target size={32} />
            </div>
            <div className="path-content">
              <h4>{path.title}</h4>
              <p>{path.description}</p>
              <div className="path-meta">
                <span><BookOpen size={14} /> {path.courses.length} courses</span>
                <span><Clock size={14} /> {formatDuration(path.duration)}</span>
                <span><Users size={14} /> {path.enrolled} enrolled</span>
              </div>
              <div className="path-skills">
                {path.skills.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
                {path.skills.length > 3 && (
                  <span className="more-skills">+{path.skills.length - 3}</span>
                )}
              </div>
              <div className="path-progress">
                <div className="progress-info">
                  <span>Progress</span>
                  <span>{path.completionRate}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${path.completionRate}%` }}></div>
                </div>
              </div>
            </div>
            <div className="path-actions">
              <button className="btn-primary">View Path</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAchievements = () => (
    <div className="achievements-content">
      <div className="achievements-header">
        <div className="achievements-stats">
          <div className="ach-stat">
            <Trophy size={24} />
            <div className="ach-stat-info">
              <span className="ach-stat-value">{achievements.filter(a => a.type === 'certification').length}</span>
              <span className="ach-stat-label">Certifications</span>
            </div>
          </div>
          <div className="ach-stat">
            <Award size={24} />
            <div className="ach-stat-info">
              <span className="ach-stat-value">{achievements.filter(a => a.type === 'badge').length}</span>
              <span className="ach-stat-label">Badges</span>
            </div>
          </div>
          <div className="ach-stat">
            <Target size={24} />
            <div className="ach-stat-info">
              <span className="ach-stat-value">{achievements.filter(a => a.type === 'milestone').length}</span>
              <span className="ach-stat-label">Milestones</span>
            </div>
          </div>
        </div>
      </div>

      <div className="achievements-section">
        <h3>Certifications</h3>
        <div className="achievements-grid">
          {achievements.filter(a => a.type === 'certification').map(achievement => (
            <div key={achievement.id} className="achievement-card certification">
              <div className="achievement-icon-large">{achievement.icon}</div>
              <div className="achievement-details">
                <h4>{achievement.title}</h4>
                <p>{achievement.description}</p>
                {achievement.course && <span className="achievement-course">{achievement.course}</span>}
                <span className="achievement-date">{formatDate(achievement.earnedDate)}</span>
              </div>
              <button className="btn-outline small">
                <Download size={14} /> Download
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="achievements-section">
        <h3>Badges</h3>
        <div className="badges-grid">
          {achievements.filter(a => a.type === 'badge').map(achievement => (
            <div key={achievement.id} className="badge-card">
              <div className="badge-icon">{achievement.icon}</div>
              <span className="badge-title">{achievement.title}</span>
              <span className="badge-date">{formatDate(achievement.earnedDate)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="achievements-section">
        <h3>Milestones</h3>
        <div className="milestones-list">
          {achievements.filter(a => a.type === 'milestone').map(achievement => (
            <div key={achievement.id} className="milestone-card">
              <div className="milestone-icon">{achievement.icon}</div>
              <div className="milestone-info">
                <span className="milestone-title">{achievement.title}</span>
                <span className="milestone-description">{achievement.description}</span>
              </div>
              <span className="milestone-date">{formatDate(achievement.earnedDate)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="learning-page">
      <div className="lrn__header">
        <div className="lrn__title-section">
          <div className="lrn__icon">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1>Learning & Development</h1>
            <p>Expand your skills and advance your career</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary">
            <BookOpen size={18} />
            Browse Courses
          </button>
        </div>
      </div>

      <div className="lrn__tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={18} />
          Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <BookOpen size={18} />
          Catalog
          <span className="tab-badge">{courses.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'my-learning' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-learning')}
        >
          <Play size={18} />
          My Learning
          <span className="tab-badge">{enrollments.filter(e => e.status === 'in_progress').length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'paths' ? 'active' : ''}`}
          onClick={() => setActiveTab('paths')}
        >
          <Target size={18} />
          Learning Paths
        </button>
        <button
          className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          <Trophy size={18} />
          Achievements
          <span className="tab-badge">{achievements.length}</span>
        </button>
      </div>

      <div className="lrn__content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'catalog' && renderCatalog()}
        {activeTab === 'my-learning' && renderMyLearning()}
        {activeTab === 'paths' && renderPaths()}
        {activeTab === 'achievements' && renderAchievements()}
      </div>
    </div>
  );
};

export default LearningPage;
