'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Star,
  Mail,
  Phone,
  FileText,
  Video,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Eye,
  Edit3,
  Trash2,
  Download,
  Upload,
  Share2,
  MoreVertical,
  RefreshCw,
  ArrowRight,
  UserPlus,
  Building2,
  Globe,
  Target,
  Award,
  ThumbsUp,
  ThumbsDown,
  Linkedin,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import './recruitment.css';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  salaryMin: number;
  salaryMax: number;
  status: 'open' | 'paused' | 'closed' | 'draft';
  postedDate: string;
  closingDate: string;
  applicants: number;
  interviews: number;
  offers: number;
  description: string;
  requirements: string[];
  benefits: string[];
  hiringManager: string;
  recruiter: string;
  priority: 'high' | 'medium' | 'low';
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  currentRole: string;
  currentCompany: string;
  experience: number;
  location: string;
  status: 'new' | 'screening' | 'interview' | 'assessment' | 'offer' | 'hired' | 'rejected';
  appliedFor: string;
  appliedDate: string;
  rating: number;
  skills: string[];
  education: string;
  linkedIn?: string;
  resumeUrl: string;
  source: 'linkedin' | 'indeed' | 'referral' | 'website' | 'other';
  notes: string;
  interviewScore?: number;
  offerSalary?: number;
}

interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  type: 'phone' | 'video' | 'onsite' | 'technical';
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  interviewers: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  feedback?: string;
  rating?: number;
  location?: string;
  meetingLink?: string;
}

interface RecruitmentMetrics {
  openPositions: number;
  totalApplicants: number;
  interviewsThisWeek: number;
  offersExtended: number;
  timeToHire: number;
  offerAcceptanceRate: number;
  applicationConversionRate: number;
  pipelineValue: number;
}

const RecruitmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'candidates' | 'interviews' | 'pipeline'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const [metrics] = useState<RecruitmentMetrics>({
    openPositions: 24,
    totalApplicants: 487,
    interviewsThisWeek: 18,
    offersExtended: 5,
    timeToHire: 28,
    offerAcceptanceRate: 82.5,
    applicationConversionRate: 12.4,
    pipelineValue: 156
  });

  const [jobs] = useState<JobPosting[]>([
    {
      id: 'JOB-001',
      title: 'Senior Software Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'full-time',
      salaryMin: 150000,
      salaryMax: 200000,
      status: 'open',
      postedDate: '2026-01-02',
      closingDate: '2026-02-15',
      applicants: 87,
      interviews: 12,
      offers: 2,
      description: 'Lead development of core platform features...',
      requirements: ['5+ years experience', 'TypeScript', 'React', 'Node.js'],
      benefits: ['Health insurance', '401k', 'Remote work', 'Stock options'],
      hiringManager: 'Sarah Chen',
      recruiter: 'Mike Johnson',
      priority: 'high'
    },
    {
      id: 'JOB-002',
      title: 'Product Manager',
      department: 'Product',
      location: 'New York, NY',
      type: 'full-time',
      salaryMin: 130000,
      salaryMax: 170000,
      status: 'open',
      postedDate: '2026-01-05',
      closingDate: '2026-02-20',
      applicants: 54,
      interviews: 8,
      offers: 1,
      description: 'Drive product strategy and roadmap...',
      requirements: ['3+ years PM experience', 'B2B SaaS', 'Data-driven'],
      benefits: ['Health insurance', 'Unlimited PTO', 'Remote-first'],
      hiringManager: 'David Park',
      recruiter: 'Lisa Wong',
      priority: 'high'
    },
    {
      id: 'JOB-003',
      title: 'UX Designer',
      department: 'Design',
      location: 'Remote',
      type: 'remote',
      salaryMin: 100000,
      salaryMax: 140000,
      status: 'open',
      postedDate: '2026-01-08',
      closingDate: '2026-02-28',
      applicants: 72,
      interviews: 6,
      offers: 0,
      description: 'Create intuitive user experiences...',
      requirements: ['4+ years UX', 'Figma', 'User research', 'Design systems'],
      benefits: ['Health insurance', 'Learning budget', 'Equipment allowance'],
      hiringManager: 'Emily Roberts',
      recruiter: 'Mike Johnson',
      priority: 'medium'
    },
    {
      id: 'JOB-004',
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Austin, TX',
      type: 'full-time',
      salaryMin: 120000,
      salaryMax: 160000,
      status: 'paused',
      postedDate: '2025-12-20',
      closingDate: '2026-02-10',
      applicants: 43,
      interviews: 5,
      offers: 1,
      description: 'Build and maintain infrastructure...',
      requirements: ['AWS', 'Kubernetes', 'CI/CD', 'Terraform'],
      benefits: ['Health insurance', '401k match', 'Flexible hours'],
      hiringManager: 'James Wilson',
      recruiter: 'Lisa Wong',
      priority: 'medium'
    },
    {
      id: 'JOB-005',
      title: 'Sales Director',
      department: 'Sales',
      location: 'Chicago, IL',
      type: 'full-time',
      salaryMin: 140000,
      salaryMax: 180000,
      status: 'open',
      postedDate: '2026-01-10',
      closingDate: '2026-03-01',
      applicants: 38,
      interviews: 4,
      offers: 0,
      description: 'Lead enterprise sales team...',
      requirements: ['7+ years B2B sales', 'Team management', 'SaaS'],
      benefits: ['Commission', 'Health insurance', 'Car allowance'],
      hiringManager: 'Robert Kim',
      recruiter: 'Mike Johnson',
      priority: 'high'
    },
    {
      id: 'JOB-006',
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Los Angeles, CA',
      type: 'full-time',
      salaryMin: 90000,
      salaryMax: 120000,
      status: 'draft',
      postedDate: '2026-01-12',
      closingDate: '2026-03-15',
      applicants: 0,
      interviews: 0,
      offers: 0,
      description: 'Drive brand awareness and demand gen...',
      requirements: ['5+ years marketing', 'Digital marketing', 'Analytics'],
      benefits: ['Health insurance', 'Remote flexibility', 'Bonus'],
      hiringManager: 'Jennifer Lee',
      recruiter: 'Lisa Wong',
      priority: 'low'
    }
  ]);

  const [candidates] = useState<Candidate[]>([
    {
      id: 'CAND-001',
      name: 'Alex Thompson',
      email: 'alex.t@email.com',
      phone: '+1 (555) 123-4567',
      currentRole: 'Senior Developer',
      currentCompany: 'TechCorp Inc',
      experience: 7,
      location: 'San Francisco, CA',
      status: 'interview',
      appliedFor: 'Senior Software Engineer',
      appliedDate: '2026-01-05',
      rating: 4.5,
      skills: ['TypeScript', 'React', 'Node.js', 'AWS', 'PostgreSQL'],
      education: 'MS Computer Science, Stanford',
      linkedIn: 'linkedin.com/in/alexthompson',
      resumeUrl: '/resumes/alex-thompson.pdf',
      source: 'linkedin',
      notes: 'Strong technical background, excellent communication',
      interviewScore: 92
    },
    {
      id: 'CAND-002',
      name: 'Maria Garcia',
      email: 'maria.g@email.com',
      phone: '+1 (555) 234-5678',
      currentRole: 'Product Lead',
      currentCompany: 'Startup Hub',
      experience: 5,
      location: 'New York, NY',
      status: 'assessment',
      appliedFor: 'Product Manager',
      appliedDate: '2026-01-07',
      rating: 4.8,
      skills: ['Product Strategy', 'Agile', 'Data Analysis', 'Roadmapping'],
      education: 'MBA, Harvard Business School',
      linkedIn: 'linkedin.com/in/mariagarcia',
      resumeUrl: '/resumes/maria-garcia.pdf',
      source: 'referral',
      notes: 'Excellent references, strong track record',
      interviewScore: 95
    },
    {
      id: 'CAND-003',
      name: 'James Wilson',
      email: 'james.w@email.com',
      phone: '+1 (555) 345-6789',
      currentRole: 'Lead UX Designer',
      currentCompany: 'DesignLab',
      experience: 6,
      location: 'Austin, TX',
      status: 'offer',
      appliedFor: 'UX Designer',
      appliedDate: '2026-01-10',
      rating: 4.7,
      skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
      education: 'BFA Design, RISD',
      linkedIn: 'linkedin.com/in/jameswilson',
      resumeUrl: '/resumes/james-wilson.pdf',
      source: 'website',
      notes: 'Outstanding portfolio, culture fit',
      interviewScore: 90,
      offerSalary: 125000
    },
    {
      id: 'CAND-004',
      name: 'Sarah Chen',
      email: 'sarah.c@email.com',
      phone: '+1 (555) 456-7890',
      currentRole: 'DevOps Lead',
      currentCompany: 'CloudScale',
      experience: 8,
      location: 'Seattle, WA',
      status: 'screening',
      appliedFor: 'DevOps Engineer',
      appliedDate: '2026-01-12',
      rating: 4.3,
      skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Python'],
      education: 'BS Computer Engineering, MIT',
      resumeUrl: '/resumes/sarah-chen.pdf',
      source: 'indeed',
      notes: 'Overqualified? Salary expectations high'
    },
    {
      id: 'CAND-005',
      name: 'Michael Brown',
      email: 'michael.b@email.com',
      phone: '+1 (555) 567-8901',
      currentRole: 'Junior Developer',
      currentCompany: 'WebDev Co',
      experience: 2,
      location: 'Denver, CO',
      status: 'rejected',
      appliedFor: 'Senior Software Engineer',
      appliedDate: '2026-01-03',
      rating: 2.5,
      skills: ['JavaScript', 'React', 'CSS'],
      education: 'BS Computer Science, CU Boulder',
      resumeUrl: '/resumes/michael-brown.pdf',
      source: 'website',
      notes: 'Lacks required experience level'
    },
    {
      id: 'CAND-006',
      name: 'Emma Davis',
      email: 'emma.d@email.com',
      phone: '+1 (555) 678-9012',
      currentRole: 'Sales Manager',
      currentCompany: 'Enterprise Solutions',
      experience: 9,
      location: 'Chicago, IL',
      status: 'interview',
      appliedFor: 'Sales Director',
      appliedDate: '2026-01-11',
      rating: 4.6,
      skills: ['Enterprise Sales', 'Team Leadership', 'Negotiation', 'CRM'],
      education: 'BS Business, Northwestern',
      linkedIn: 'linkedin.com/in/emmadavis',
      resumeUrl: '/resumes/emma-davis.pdf',
      source: 'linkedin',
      notes: 'Strong quota attainment history',
      interviewScore: 88
    },
    {
      id: 'CAND-007',
      name: 'David Park',
      email: 'david.p@email.com',
      phone: '+1 (555) 789-0123',
      currentRole: 'Full Stack Developer',
      currentCompany: 'Innovation Labs',
      experience: 5,
      location: 'San Jose, CA',
      status: 'new',
      appliedFor: 'Senior Software Engineer',
      appliedDate: '2026-01-14',
      rating: 0,
      skills: ['TypeScript', 'Vue.js', 'Go', 'MongoDB'],
      education: 'MS Software Engineering, Carnegie Mellon',
      resumeUrl: '/resumes/david-park.pdf',
      source: 'referral',
      notes: 'Internal referral from Engineering'
    },
    {
      id: 'CAND-008',
      name: 'Lisa Wong',
      email: 'lisa.w@email.com',
      phone: '+1 (555) 890-1234',
      currentRole: 'Product Designer',
      currentCompany: 'Design Studio',
      experience: 4,
      location: 'Portland, OR',
      status: 'hired',
      appliedFor: 'UX Designer',
      appliedDate: '2025-12-15',
      rating: 4.9,
      skills: ['Figma', 'Sketch', 'User Testing', 'Visual Design'],
      education: 'BFA Interaction Design, SVA',
      linkedIn: 'linkedin.com/in/lisawong',
      resumeUrl: '/resumes/lisa-wong.pdf',
      source: 'linkedin',
      notes: 'Excellent hire - started Jan 2',
      interviewScore: 96,
      offerSalary: 115000
    }
  ]);

  const [interviews] = useState<Interview[]>([
    {
      id: 'INT-001',
      candidateId: 'CAND-001',
      candidateName: 'Alex Thompson',
      jobTitle: 'Senior Software Engineer',
      type: 'technical',
      scheduledDate: '2026-01-17',
      scheduledTime: '10:00 AM',
      duration: 90,
      interviewers: ['Sarah Chen', 'Mike Johnson'],
      status: 'scheduled',
      meetingLink: 'https://meet.cube.io/int-001'
    },
    {
      id: 'INT-002',
      candidateId: 'CAND-002',
      candidateName: 'Maria Garcia',
      jobTitle: 'Product Manager',
      type: 'video',
      scheduledDate: '2026-01-16',
      scheduledTime: '2:00 PM',
      duration: 60,
      interviewers: ['David Park', 'Emily Roberts'],
      status: 'scheduled',
      meetingLink: 'https://meet.cube.io/int-002'
    },
    {
      id: 'INT-003',
      candidateId: 'CAND-006',
      candidateName: 'Emma Davis',
      jobTitle: 'Sales Director',
      type: 'onsite',
      scheduledDate: '2026-01-18',
      scheduledTime: '9:00 AM',
      duration: 180,
      interviewers: ['Robert Kim', 'CEO', 'VP Sales'],
      status: 'scheduled',
      location: 'HQ - Chicago Office'
    },
    {
      id: 'INT-004',
      candidateId: 'CAND-003',
      candidateName: 'James Wilson',
      jobTitle: 'UX Designer',
      type: 'video',
      scheduledDate: '2026-01-10',
      scheduledTime: '11:00 AM',
      duration: 60,
      interviewers: ['Emily Roberts'],
      status: 'completed',
      feedback: 'Outstanding candidate. Strong portfolio, excellent culture fit.',
      rating: 5
    },
    {
      id: 'INT-005',
      candidateId: 'CAND-005',
      candidateName: 'Michael Brown',
      jobTitle: 'Senior Software Engineer',
      type: 'phone',
      scheduledDate: '2026-01-08',
      scheduledTime: '3:00 PM',
      duration: 30,
      interviewers: ['Mike Johnson'],
      status: 'completed',
      feedback: 'Candidate lacks required experience for senior role.',
      rating: 2
    }
  ]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
      open: 'success',
      paused: 'warning',
      closed: 'muted',
      draft: 'info',
      new: 'info',
      screening: 'warning',
      interview: 'primary',
      assessment: 'primary',
      offer: 'success',
      hired: 'success',
      rejected: 'error',
      scheduled: 'primary',
      completed: 'success',
      cancelled: 'error',
      rescheduled: 'warning'
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

  const pipelineStages = [
    { id: 'new', label: 'New', count: candidates.filter(c => c.status === 'new').length },
    { id: 'screening', label: 'Screening', count: candidates.filter(c => c.status === 'screening').length },
    { id: 'interview', label: 'Interview', count: candidates.filter(c => c.status === 'interview').length },
    { id: 'assessment', label: 'Assessment', count: candidates.filter(c => c.status === 'assessment').length },
    { id: 'offer', label: 'Offer', count: candidates.filter(c => c.status === 'offer').length },
    { id: 'hired', label: 'Hired', count: candidates.filter(c => c.status === 'hired').length }
  ];

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <Briefcase size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.openPositions}</span>
            <span className="metric-label">Open Positions</span>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={14} />
            <span>+3 this week</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.totalApplicants}</span>
            <span className="metric-label">Total Applicants</span>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={14} />
            <span>+47 this week</span>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <Video size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.interviewsThisWeek}</span>
            <span className="metric-label">Interviews This Week</span>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={14} />
            <span>+5 vs last week</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <Target size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.offersExtended}</span>
            <span className="metric-label">Offers Extended</span>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={14} />
            <span>+2 pending</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>
            <BarChart3 size={18} />
            Recruitment Funnel
          </h3>
          <div className="funnel-chart">
            {pipelineStages.slice(0, -1).map((stage, index) => {
              const maxCount = Math.max(...pipelineStages.map(s => s.count), 1);
              const width = Math.max((stage.count / maxCount) * 100, 15);
              return (
                <div key={stage.id} className="funnel-stage">
                  <div className="funnel-bar" style={{ width: `${width}%` }}>
                    <span className="funnel-label">{stage.label}</span>
                    <span className="funnel-count">{stage.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="funnel-footer">
            <div className="conversion-rate">
              <span className="rate-label">Conversion Rate</span>
              <span className="rate-value">{metrics.applicationConversionRate}%</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>
            <PieChart size={18} />
            Source Distribution
          </h3>
          <div className="source-chart">
            <div className="source-donut">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="15" strokeDasharray="75.4 176.9" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="15" strokeDasharray="50.3 201.9" strokeDashoffset="-75.4" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="15" strokeDasharray="37.7 214.6" strokeDashoffset="-125.7" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="15" strokeDasharray="25.1 227.2" strokeDashoffset="-163.4" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#6b7280" strokeWidth="15" strokeDasharray="62.8 189.5" strokeDashoffset="-188.5" transform="rotate(-90 50 50)" />
              </svg>
              <div className="donut-center">
                <span className="center-value">{candidates.length}</span>
                <span className="center-label">Total</span>
              </div>
            </div>
            <div className="source-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#3b82f6' }}></span>
                <span className="legend-name">LinkedIn</span>
                <span className="legend-percent">30%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#8b5cf6' }}></span>
                <span className="legend-name">Referrals</span>
                <span className="legend-percent">20%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#10b981' }}></span>
                <span className="legend-name">Website</span>
                <span className="legend-percent">15%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                <span className="legend-name">Indeed</span>
                <span className="legend-percent">10%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#6b7280' }}></span>
                <span className="legend-name">Other</span>
                <span className="legend-percent">25%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>
            <Clock size={18} />
            Key Metrics
          </h3>
          <div className="key-metrics">
            <div className="key-metric">
              <div className="metric-circle">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#2a2a3a" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="#8b5cf6" 
                    strokeWidth="8" 
                    strokeDasharray={`${(metrics.timeToHire / 45) * 283} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="circle-content">
                  <span className="circle-value">{metrics.timeToHire}</span>
                  <span className="circle-unit">days</span>
                </div>
              </div>
              <span className="metric-name">Avg Time to Hire</span>
            </div>
            <div className="key-metric">
              <div className="metric-circle">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#2a2a3a" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="8" 
                    strokeDasharray={`${(metrics.offerAcceptanceRate / 100) * 283} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="circle-content">
                  <span className="circle-value">{metrics.offerAcceptanceRate}%</span>
                </div>
              </div>
              <span className="metric-name">Offer Acceptance</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>
            <Calendar size={18} />
            Upcoming Interviews
          </h3>
          <div className="upcoming-list">
            {interviews
              .filter(i => i.status === 'scheduled')
              .slice(0, 4)
              .map(interview => (
                <div key={interview.id} className="upcoming-item">
                  <div className={`interview-type-icon ${interview.type}`}>
                    {interview.type === 'video' && <Video size={16} />}
                    {interview.type === 'phone' && <Phone size={16} />}
                    {interview.type === 'onsite' && <Building2 size={16} />}
                    {interview.type === 'technical' && <FileText size={16} />}
                  </div>
                  <div className="upcoming-info">
                    <span className="upcoming-name">{interview.candidateName}</span>
                    <span className="upcoming-job">{interview.jobTitle}</span>
                  </div>
                  <div className="upcoming-time">
                    <span className="time-date">{formatDate(interview.scheduledDate)}</span>
                    <span className="time-hour">{interview.scheduledTime}</span>
                  </div>
                </div>
              ))}
          </div>
          <button className="view-all-btn" onClick={() => setActiveTab('interviews')}>
            View All Interviews <ArrowRight size={14} />
          </button>
        </div>

        <div className="dashboard-card wide">
          <h3>
            <Star size={18} />
            Top Candidates
          </h3>
          <div className="top-candidates">
            {candidates
              .filter(c => c.rating >= 4.5 && c.status !== 'rejected' && c.status !== 'hired')
              .slice(0, 5)
              .map(candidate => (
                <div key={candidate.id} className="top-candidate">
                  <div className="candidate-avatar">
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="candidate-info">
                    <span className="candidate-name">{candidate.name}</span>
                    <span className="candidate-role">{candidate.currentRole} at {candidate.currentCompany}</span>
                    <span className="candidate-applying">Applying for: {candidate.appliedFor}</span>
                  </div>
                  <div className="candidate-rating">
                    <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                    <span>{candidate.rating.toFixed(1)}</span>
                  </div>
                  <div className={`candidate-status ${getStatusColor(candidate.status)}`}>
                    {candidate.status}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="jobs-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search jobs..."
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
            <option value="open">Open</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>
          <select
            className="filter-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Design">Design</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline small">
            <Download size={16} /> Export
          </button>
          <button className="btn-primary">
            <Plus size={16} /> Post New Job
          </button>
        </div>
      </div>

      <div className="jobs-grid">
        {jobs
          .filter(job => 
            (statusFilter === 'all' || job.status === statusFilter) &&
            (departmentFilter === 'all' || job.department === departmentFilter) &&
            (searchTerm === '' || job.title.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map(job => (
            <div 
              key={job.id} 
              className={`job-card ${selectedJob?.id === job.id ? 'selected' : ''}`}
              onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
            >
              <div className="job-header">
                <div className="job-title-section">
                  <h4>{job.title}</h4>
                  <span className="job-department">{job.department}</span>
                </div>
                <div className={`priority-badge ${getPriorityColor(job.priority)}`}>
                  {job.priority}
                </div>
              </div>
              
              <div className="job-details">
                <div className="detail-item">
                  <MapPin size={14} />
                  <span>{job.location}</span>
                </div>
                <div className="detail-item">
                  <DollarSign size={14} />
                  <span>{formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}</span>
                </div>
                <div className="detail-item">
                  <Clock size={14} />
                  <span className="type-badge">{job.type}</span>
                </div>
              </div>

              <div className="job-stats">
                <div className="stat-item">
                  <span className="stat-value">{job.applicants}</span>
                  <span className="stat-label">Applicants</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{job.interviews}</span>
                  <span className="stat-label">Interviews</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{job.offers}</span>
                  <span className="stat-label">Offers</span>
                </div>
              </div>

              <div className="job-footer">
                <div className={`status-badge ${getStatusColor(job.status)}`}>
                  {job.status === 'open' && <CheckCircle2 size={12} />}
                  {job.status === 'paused' && <AlertCircle size={12} />}
                  {job.status === 'closed' && <XCircle size={12} />}
                  {job.status}
                </div>
                <span className="posted-date">Posted {formatDate(job.postedDate)}</span>
              </div>
            </div>
          ))}
      </div>

      {selectedJob && (
        <div className="job-detail-panel">
          <div className="panel-header">
            <h3>{selectedJob.title}</h3>
            <button className="close-btn" onClick={() => setSelectedJob(null)}>
              <XCircle size={20} />
            </button>
          </div>
          <div className="panel-content">
            <div className="detail-section">
              <h4>Job Details</h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="label">Department</span>
                  <span className="value">{selectedJob.department}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Location</span>
                  <span className="value">{selectedJob.location}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Type</span>
                  <span className="value">{selectedJob.type}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Salary Range</span>
                  <span className="value">{formatCurrency(selectedJob.salaryMin)} - {formatCurrency(selectedJob.salaryMax)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Hiring Manager</span>
                  <span className="value">{selectedJob.hiringManager}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Recruiter</span>
                  <span className="value">{selectedJob.recruiter}</span>
                </div>
              </div>
            </div>
            <div className="detail-section">
              <h4>Requirements</h4>
              <ul className="requirements-list">
                {selectedJob.requirements.map((req, idx) => (
                  <li key={idx}><CheckCircle2 size={14} /> {req}</li>
                ))}
              </ul>
            </div>
            <div className="detail-section">
              <h4>Benefits</h4>
              <div className="benefits-tags">
                {selectedJob.benefits.map((benefit, idx) => (
                  <span key={idx} className="benefit-tag">{benefit}</span>
                ))}
              </div>
            </div>
            <div className="panel-actions">
              <button className="btn-primary">
                <Eye size={16} /> View Applicants
              </button>
              <button className="btn-outline">
                <Edit3 size={16} /> Edit Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCandidates = () => (
    <div className="candidates-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="screening">Screening</option>
            <option value="interview">Interview</option>
            <option value="assessment">Assessment</option>
            <option value="offer">Offer</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline small">
            <Upload size={16} /> Import
          </button>
          <button className="btn-primary">
            <UserPlus size={16} /> Add Candidate
          </button>
        </div>
      </div>

      <div className="candidates-table">
        <div className="table-header">
          <span>Candidate</span>
          <span>Applied For</span>
          <span>Experience</span>
          <span>Status</span>
          <span>Rating</span>
          <span>Source</span>
          <span>Applied</span>
          <span>Actions</span>
        </div>
        {candidates
          .filter(c => 
            (statusFilter === 'all' || c.status === statusFilter) &&
            (searchTerm === '' || c.name.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map(candidate => (
            <div 
              key={candidate.id} 
              className={`table-row ${selectedCandidate?.id === candidate.id ? 'selected' : ''}`}
              onClick={() => setSelectedCandidate(selectedCandidate?.id === candidate.id ? null : candidate)}
            >
              <div className="candidate-cell">
                <div className="avatar">
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="candidate-basic">
                  <span className="name">{candidate.name}</span>
                  <span className="role">{candidate.currentRole}</span>
                </div>
              </div>
              <span className="job-cell">{candidate.appliedFor}</span>
              <span className="exp-cell">{candidate.experience} years</span>
              <div className={`status-cell ${getStatusColor(candidate.status)}`}>
                {candidate.status}
              </div>
              <div className="rating-cell">
                {candidate.rating > 0 ? (
                  <>
                    <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                    <span>{candidate.rating.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="no-rating">-</span>
                )}
              </div>
              <span className="source-cell">{candidate.source}</span>
              <span className="date-cell">{formatDate(candidate.appliedDate)}</span>
              <div className="actions-cell">
                <button className="btn-icon small" title="View">
                  <Eye size={14} />
                </button>
                <button className="btn-icon small" title="Email">
                  <Mail size={14} />
                </button>
                <button className="btn-icon small" title="More">
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>
          ))}
      </div>

      {selectedCandidate && (
        <div className="candidate-detail-panel">
          <div className="panel-header">
            <div className="candidate-header">
              <div className="large-avatar">
                {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="header-info">
                <h3>{selectedCandidate.name}</h3>
                <p>{selectedCandidate.currentRole} at {selectedCandidate.currentCompany}</p>
              </div>
            </div>
            <button className="close-btn" onClick={() => setSelectedCandidate(null)}>
              <XCircle size={20} />
            </button>
          </div>
          <div className="panel-content">
            <div className="contact-info">
              <div className="contact-item">
                <Mail size={16} />
                <span>{selectedCandidate.email}</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>{selectedCandidate.phone}</span>
              </div>
              <div className="contact-item">
                <MapPin size={16} />
                <span>{selectedCandidate.location}</span>
              </div>
              {selectedCandidate.linkedIn && (
                <div className="contact-item">
                  <Linkedin size={16} />
                  <a href={`https://${selectedCandidate.linkedIn}`} target="_blank" rel="noopener noreferrer">
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>
            
            <div className="detail-section">
              <h4><GraduationCap size={16} /> Education</h4>
              <p>{selectedCandidate.education}</p>
            </div>

            <div className="detail-section">
              <h4><Sparkles size={16} /> Skills</h4>
              <div className="skills-tags">
                {selectedCandidate.skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h4><MessageSquare size={16} /> Notes</h4>
              <p className="notes">{selectedCandidate.notes}</p>
            </div>

            {selectedCandidate.interviewScore && (
              <div className="detail-section">
                <h4><Award size={16} /> Interview Score</h4>
                <div className="score-display">
                  <span className="score-value">{selectedCandidate.interviewScore}</span>
                  <span className="score-max">/100</span>
                </div>
              </div>
            )}

            <div className="panel-actions">
              <button className="btn-primary">
                <Calendar size={16} /> Schedule Interview
              </button>
              <button className="btn-outline success">
                <ThumbsUp size={16} /> Advance
              </button>
              <button className="btn-outline error">
                <ThumbsDown size={16} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInterviews = () => (
    <div className="interviews-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search interviews..." />
          </div>
          <select className="filter-select">
            <option value="all">All Types</option>
            <option value="phone">Phone</option>
            <option value="video">Video</option>
            <option value="onsite">On-site</option>
            <option value="technical">Technical</option>
          </select>
          <select className="filter-select">
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary">
            <Plus size={16} /> Schedule Interview
          </button>
        </div>
      </div>

      <div className="interviews-grid">
        {interviews.map(interview => (
          <div key={interview.id} className={`interview-card ${interview.status}`}>
            <div className="interview-header">
              <div className={`interview-type ${interview.type}`}>
                {interview.type === 'video' && <Video size={18} />}
                {interview.type === 'phone' && <Phone size={18} />}
                {interview.type === 'onsite' && <Building2 size={18} />}
                {interview.type === 'technical' && <FileText size={18} />}
                <span>{interview.type}</span>
              </div>
              <div className={`interview-status ${getStatusColor(interview.status)}`}>
                {interview.status}
              </div>
            </div>
            
            <div className="interview-body">
              <h4>{interview.candidateName}</h4>
              <p className="job-title">{interview.jobTitle}</p>
              
              <div className="interview-details">
                <div className="detail">
                  <Calendar size={14} />
                  <span>{formatDate(interview.scheduledDate)}</span>
                </div>
                <div className="detail">
                  <Clock size={14} />
                  <span>{interview.scheduledTime} ({interview.duration}min)</span>
                </div>
                {interview.location && (
                  <div className="detail">
                    <MapPin size={14} />
                    <span>{interview.location}</span>
                  </div>
                )}
              </div>

              <div className="interviewers">
                <span className="label">Interviewers:</span>
                <div className="interviewer-list">
                  {interview.interviewers.map((name, idx) => (
                    <span key={idx} className="interviewer-tag">{name}</span>
                  ))}
                </div>
              </div>

              {interview.feedback && (
                <div className="feedback-section">
                  <span className="label">Feedback:</span>
                  <p>{interview.feedback}</p>
                  {interview.rating && (
                    <div className="feedback-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={16}
                          fill={star <= interview.rating! ? '#f59e0b' : 'transparent'}
                          stroke={star <= interview.rating! ? '#f59e0b' : '#6b7280'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="interview-footer">
              {interview.status === 'scheduled' && (
                <>
                  {interview.meetingLink && (
                    <button className="btn-primary small">
                      <Video size={14} /> Join Meeting
                    </button>
                  )}
                  <button className="btn-outline small">
                    <Edit3 size={14} /> Reschedule
                  </button>
                </>
              )}
              {interview.status === 'completed' && (
                <button className="btn-outline small">
                  <Eye size={14} /> View Details
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPipeline = () => (
    <div className="pipeline-content">
      <div className="pipeline-header">
        <h3>Recruitment Pipeline</h3>
        <p>Drag and drop candidates between stages</p>
      </div>
      <div className="pipeline-board">
        {pipelineStages.map(stage => (
          <div key={stage.id} className="pipeline-column">
            <div className="column-header">
              <h4>{stage.label}</h4>
              <span className="count-badge">{stage.count}</span>
            </div>
            <div className="column-content">
              {candidates
                .filter(c => c.status === stage.id)
                .map(candidate => (
                  <div key={candidate.id} className="pipeline-card">
                    <div className="card-avatar">
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="card-info">
                      <span className="card-name">{candidate.name}</span>
                      <span className="card-job">{candidate.appliedFor}</span>
                      <span className="card-date">{formatDate(candidate.appliedDate)}</span>
                    </div>
                    {candidate.rating > 0 && (
                      <div className="card-rating">
                        <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
                        <span>{candidate.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                ))}
              {stage.count === 0 && (
                <div className="empty-column">
                  <Users size={24} />
                  <span>No candidates</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="recruitment-page">
      <div className="rec__header">
        <div className="rec__title-section">
          <div className="rec__icon">
            <Users size={28} />
          </div>
          <div>
            <h1>Recruitment Management</h1>
            <p>Streamline your hiring process and find top talent</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            New Job Posting
          </button>
        </div>
      </div>

      <div className="rec__tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={18} />
          Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <Briefcase size={18} />
          Jobs
          <span className="tab-badge">{jobs.filter(j => j.status === 'open').length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'candidates' ? 'active' : ''}`}
          onClick={() => setActiveTab('candidates')}
        >
          <Users size={18} />
          Candidates
          <span className="tab-badge">{candidates.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'interviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('interviews')}
        >
          <Calendar size={18} />
          Interviews
          <span className="tab-badge">{interviews.filter(i => i.status === 'scheduled').length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          <Target size={18} />
          Pipeline
        </button>
      </div>

      <div className="rec__content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'jobs' && renderJobs()}
        {activeTab === 'candidates' && renderCandidates()}
        {activeTab === 'interviews' && renderInterviews()}
        {activeTab === 'pipeline' && renderPipeline()}
      </div>
    </div>
  );
};

export default RecruitmentPage;
