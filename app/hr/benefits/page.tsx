'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Heart,
  DollarSign,
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
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
  CreditCard,
  Building2,
  Stethoscope,
  Glasses,
  Baby,
  Car,
  Briefcase,
  Plane,
  Gift,
  Wallet,
  PiggyBank,
  Calculator,
  Clock,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Info,
  Star,
  Award,
  Sparkles,
  Settings,
  Bell,
  UserPlus,
  UserMinus,
  Activity
} from 'lucide-react';
import './benefits.css';

interface BenefitPlan {
  id: string;
  name: string;
  type: 'health' | 'dental' | 'vision' | 'life' | '401k' | 'hsa' | 'fsa' | 'disability';
  provider: string;
  monthlyCost: number;
  employerContribution: number;
  enrolledCount: number;
  description: string;
  coverage: string;
  status: 'active' | 'inactive';
  tier?: 'basic' | 'standard' | 'premium';
}

interface Enrollment {
  id: string;
  employeeId: string;
  employeeName: string;
  planId: string;
  planName: string;
  planType: string;
  startDate: string;
  tier: string;
  monthlyCost: number;
  status: 'active' | 'pending' | 'cancelled';
  dependents: number;
}

interface Dependent {
  id: string;
  name: string;
  relationship: 'spouse' | 'child' | 'domestic_partner';
  dateOfBirth: string;
  coveredPlans: string[];
}

interface BenefitsMetrics {
  totalPlans: number;
  activeEnrollments: number;
  totalDependents: number;
  monthlyBudget: number;
  utilizationRate: number;
  openEnrollmentDays: number;
  averageCostPerEmployee: number;
  employerContribution: number;
}

interface ClaimHistory {
  id: string;
  employeeName: string;
  planType: string;
  claimDate: string;
  amount: number;
  status: 'approved' | 'pending' | 'denied';
  description: string;
}

const BenefitsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'enrollments' | 'dependents' | 'claims'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BenefitPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [metrics] = useState<BenefitsMetrics>({
    totalPlans: 12,
    activeEnrollments: 534,
    totalDependents: 312,
    monthlyBudget: 245000,
    utilizationRate: 87.5,
    openEnrollmentDays: 14,
    averageCostPerEmployee: 458,
    employerContribution: 186000
  });

  const [plans] = useState<BenefitPlan[]>([
    {
      id: 'PLN-001',
      name: 'Medical Premium Plus',
      type: 'health',
      provider: 'Blue Cross Blue Shield',
      monthlyCost: 650,
      employerContribution: 520,
      enrolledCount: 145,
      description: 'Comprehensive medical coverage with low deductibles and extensive network.',
      coverage: '$250 deductible, 90% coverage after deductible',
      status: 'active',
      tier: 'premium'
    },
    {
      id: 'PLN-002',
      name: 'Medical Standard',
      type: 'health',
      provider: 'Blue Cross Blue Shield',
      monthlyCost: 450,
      employerContribution: 360,
      enrolledCount: 89,
      description: 'Standard medical coverage with reasonable deductibles.',
      coverage: '$1,000 deductible, 80% coverage after deductible',
      status: 'active',
      tier: 'standard'
    },
    {
      id: 'PLN-003',
      name: 'Medical Basic',
      type: 'health',
      provider: 'Blue Cross Blue Shield',
      monthlyCost: 280,
      employerContribution: 224,
      enrolledCount: 56,
      description: 'Basic medical coverage for essential health needs.',
      coverage: '$2,500 deductible, 70% coverage after deductible',
      status: 'active',
      tier: 'basic'
    },
    {
      id: 'PLN-004',
      name: 'Dental Care Plus',
      type: 'dental',
      provider: 'Delta Dental',
      monthlyCost: 85,
      employerContribution: 68,
      enrolledCount: 267,
      description: 'Full dental coverage including orthodontics.',
      coverage: '100% preventive, 80% basic, 50% major',
      status: 'active',
      tier: 'premium'
    },
    {
      id: 'PLN-005',
      name: 'Vision Care',
      type: 'vision',
      provider: 'VSP Vision',
      monthlyCost: 35,
      employerContribution: 28,
      enrolledCount: 198,
      description: 'Complete vision coverage including frames and contacts.',
      coverage: '$150 frame allowance, $130 contact allowance',
      status: 'active'
    },
    {
      id: 'PLN-006',
      name: 'Life Insurance',
      type: 'life',
      provider: 'MetLife',
      monthlyCost: 45,
      employerContribution: 45,
      enrolledCount: 312,
      description: '2x annual salary coverage with optional additional coverage.',
      coverage: '2x salary base, up to $500K additional',
      status: 'active'
    },
    {
      id: 'PLN-007',
      name: '401(k) Retirement',
      type: '401k',
      provider: 'Fidelity',
      monthlyCost: 0,
      employerContribution: 0,
      enrolledCount: 287,
      description: 'Retirement savings with company match up to 6%.',
      coverage: '100% match up to 3%, 50% match 3-6%',
      status: 'active'
    },
    {
      id: 'PLN-008',
      name: 'Health Savings Account',
      type: 'hsa',
      provider: 'HSA Bank',
      monthlyCost: 0,
      employerContribution: 50,
      enrolledCount: 145,
      description: 'Tax-advantaged savings for medical expenses.',
      coverage: '$3,850 individual, $7,750 family annual limit',
      status: 'active'
    },
    {
      id: 'PLN-009',
      name: 'Flexible Spending Account',
      type: 'fsa',
      provider: 'WageWorks',
      monthlyCost: 0,
      employerContribution: 0,
      enrolledCount: 167,
      description: 'Pre-tax savings for healthcare and dependent care.',
      coverage: '$3,050 healthcare, $5,000 dependent care',
      status: 'active'
    },
    {
      id: 'PLN-010',
      name: 'Short-Term Disability',
      type: 'disability',
      provider: 'Unum',
      monthlyCost: 25,
      employerContribution: 25,
      enrolledCount: 298,
      description: 'Income protection for short-term disabilities.',
      coverage: '60% of salary, up to 26 weeks',
      status: 'active'
    }
  ]);

  const [enrollments] = useState<Enrollment[]>([
    { id: 'ENR-001', employeeId: 'EMP-001', employeeName: 'Sarah Chen', planId: 'PLN-001', planName: 'Medical Premium Plus', planType: 'health', startDate: '2025-01-01', tier: 'Family', monthlyCost: 650, status: 'active', dependents: 3 },
    { id: 'ENR-002', employeeId: 'EMP-001', employeeName: 'Sarah Chen', planId: 'PLN-004', planName: 'Dental Care Plus', planType: 'dental', startDate: '2025-01-01', tier: 'Family', monthlyCost: 85, status: 'active', dependents: 3 },
    { id: 'ENR-003', employeeId: 'EMP-002', employeeName: 'Michael Brown', planId: 'PLN-002', planName: 'Medical Standard', planType: 'health', startDate: '2025-01-01', tier: 'Employee + Spouse', monthlyCost: 450, status: 'active', dependents: 1 },
    { id: 'ENR-004', employeeId: 'EMP-003', employeeName: 'Emily Johnson', planId: 'PLN-001', planName: 'Medical Premium Plus', planType: 'health', startDate: '2025-01-01', tier: 'Employee Only', monthlyCost: 650, status: 'active', dependents: 0 },
    { id: 'ENR-005', employeeId: 'EMP-004', employeeName: 'David Park', planId: 'PLN-003', planName: 'Medical Basic', planType: 'health', startDate: '2025-01-01', tier: 'Family', monthlyCost: 280, status: 'active', dependents: 2 },
    { id: 'ENR-006', employeeId: 'EMP-005', employeeName: 'Jennifer Lee', planId: 'PLN-002', planName: 'Medical Standard', planType: 'health', startDate: '2025-06-15', tier: 'Employee + Children', monthlyCost: 450, status: 'pending', dependents: 2 }
  ]);

  const [dependents] = useState<Dependent[]>([
    { id: 'DEP-001', name: 'John Chen', relationship: 'spouse', dateOfBirth: '1988-05-12', coveredPlans: ['PLN-001', 'PLN-004', 'PLN-005'] },
    { id: 'DEP-002', name: 'Emma Chen', relationship: 'child', dateOfBirth: '2015-03-20', coveredPlans: ['PLN-001', 'PLN-004', 'PLN-005'] },
    { id: 'DEP-003', name: 'Lucas Chen', relationship: 'child', dateOfBirth: '2018-07-15', coveredPlans: ['PLN-001', 'PLN-004', 'PLN-005'] },
    { id: 'DEP-004', name: 'Lisa Brown', relationship: 'spouse', dateOfBirth: '1985-11-08', coveredPlans: ['PLN-002', 'PLN-004'] },
    { id: 'DEP-005', name: 'Sophie Park', relationship: 'spouse', dateOfBirth: '1992-02-28', coveredPlans: ['PLN-003', 'PLN-005'] },
    { id: 'DEP-006', name: 'Ryan Park', relationship: 'child', dateOfBirth: '2020-09-10', coveredPlans: ['PLN-003', 'PLN-005'] }
  ]);

  const [claims] = useState<ClaimHistory[]>([
    { id: 'CLM-001', employeeName: 'Sarah Chen', planType: 'health', claimDate: '2026-01-10', amount: 1250, status: 'approved', description: 'Annual physical examination' },
    { id: 'CLM-002', employeeName: 'Michael Brown', planType: 'dental', claimDate: '2026-01-08', amount: 380, status: 'approved', description: 'Dental cleaning and x-rays' },
    { id: 'CLM-003', employeeName: 'Emily Johnson', planType: 'vision', claimDate: '2026-01-05', amount: 285, status: 'pending', description: 'New prescription glasses' },
    { id: 'CLM-004', employeeName: 'David Park', planType: 'health', claimDate: '2025-12-28', amount: 2100, status: 'approved', description: 'Specialist consultation' },
    { id: 'CLM-005', employeeName: 'Jennifer Lee', planType: 'health', claimDate: '2025-12-20', amount: 890, status: 'denied', description: 'Out-of-network provider' },
    { id: 'CLM-006', employeeName: 'Robert Wilson', planType: 'dental', claimDate: '2025-12-15', amount: 1500, status: 'approved', description: 'Crown replacement' }
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

  const getPlanTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      health: <Stethoscope size={20} />,
      dental: <Heart size={20} />,
      vision: <Glasses size={20} />,
      life: <Shield size={20} />,
      '401k': <PiggyBank size={20} />,
      hsa: <Wallet size={20} />,
      fsa: <Calculator size={20} />,
      disability: <Activity size={20} />
    };
    return icons[type] || <Shield size={20} />;
  };

  const getPlanTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      health: 'blue',
      dental: 'teal',
      vision: 'purple',
      life: 'green',
      '401k': 'orange',
      hsa: 'cyan',
      fsa: 'yellow',
      disability: 'red'
    };
    return colors[type] || 'gray';
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="metrics-grid">
        <div className="metric-card large primary">
          <div className="metric-icon">
            <DollarSign size={28} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{formatCurrency(metrics.monthlyBudget)}</span>
            <span className="metric-label">Monthly Budget</span>
          </div>
          <div className="metric-trend">
            <span className="employer-contrib">
              Employer: {formatCurrency(metrics.employerContribution)}
            </span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.activeEnrollments}</span>
            <span className="metric-label">Active Enrollments</span>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <FileText size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.totalPlans}</span>
            <span className="metric-label">Benefit Plans</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <UserPlus size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.totalDependents}</span>
            <span className="metric-label">Covered Dependents</span>
          </div>
        </div>

        <div className="metric-card accent">
          <div className="metric-icon">
            <BarChart3 size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.utilizationRate}%</span>
            <span className="metric-label">Utilization Rate</span>
          </div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="overview-card">
          <h3>
            <Calendar size={18} />
            Open Enrollment Status
          </h3>
          <div className="enrollment-status">
            <div className="enrollment-countdown">
              <span className="countdown-number">{metrics.openEnrollmentDays}</span>
              <span className="countdown-label">Days Remaining</span>
            </div>
            <div className="enrollment-info">
              <p>Annual open enrollment period is now active. Review and update your benefit selections.</p>
              <div className="enrollment-dates">
                <span><Calendar size={14} /> Jan 1 - Jan 31, 2026</span>
              </div>
            </div>
            <button className="btn-primary">
              <Edit3 size={16} /> Review Benefits
            </button>
          </div>
        </div>

        <div className="overview-card">
          <h3>
            <DollarSign size={18} />
            Cost Breakdown
          </h3>
          <div className="cost-breakdown">
            <div className="cost-chart">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#2a2a3a" strokeWidth="15" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#costGradient)"
                  strokeWidth="15"
                  strokeDasharray={`${(metrics.employerContribution / metrics.monthlyBudget) * 251.2} 251.2`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="costGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="cost-center">
                <span className="cost-percent">76%</span>
                <span className="cost-label">Employer Paid</span>
              </div>
            </div>
            <div className="cost-legend">
              <div className="legend-item">
                <span className="legend-color employer"></span>
                <span>Employer: {formatCurrency(metrics.employerContribution)}</span>
              </div>
              <div className="legend-item">
                <span className="legend-color employee"></span>
                <span>Employee: {formatCurrency(metrics.monthlyBudget - metrics.employerContribution)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>
            <Shield size={18} />
            Popular Plans
          </h3>
          <div className="popular-plans">
            {plans
              .sort((a, b) => b.enrolledCount - a.enrolledCount)
              .slice(0, 4)
              .map(plan => (
                <div key={plan.id} className="popular-plan">
                  <div className={`plan-icon ${getPlanTypeColor(plan.type)}`}>
                    {getPlanTypeIcon(plan.type)}
                  </div>
                  <div className="plan-info">
                    <span className="plan-name">{plan.name}</span>
                    <span className="plan-enrolled">{plan.enrolledCount} enrolled</span>
                  </div>
                  <span className="plan-cost">{formatCurrency(plan.monthlyCost)}/mo</span>
                </div>
              ))}
          </div>
        </div>

        <div className="overview-card">
          <h3>
            <FileText size={18} />
            Recent Claims
          </h3>
          <div className="recent-claims">
            {claims.slice(0, 4).map(claim => (
              <div key={claim.id} className="claim-item">
                <div className="claim-info">
                  <span className="claim-employee">{claim.employeeName}</span>
                  <span className="claim-desc">{claim.description}</span>
                </div>
                <div className="claim-details">
                  <span className="claim-amount">{formatCurrency(claim.amount)}</span>
                  <span className={`claim-status ${claim.status}`}>{claim.status}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="view-all-btn" onClick={() => setActiveTab('claims')}>
            View All Claims <ArrowRight size={14} />
          </button>
        </div>

        <div className="overview-card wide">
          <h3>
            <BarChart3 size={18} />
            Plan Enrollment by Type
          </h3>
          <div className="enrollment-chart">
            {[
              { type: 'Health', count: 290, color: '#3b82f6' },
              { type: 'Dental', count: 267, color: '#14b8a6' },
              { type: 'Vision', count: 198, color: '#8b5cf6' },
              { type: 'Life', count: 312, color: '#10b981' },
              { type: '401(k)', count: 287, color: '#f97316' },
              { type: 'HSA/FSA', count: 312, color: '#06b6d4' }
            ].map(item => (
              <div key={item.type} className="chart-bar-group">
                <div className="bar-container">
                  <div
                    className="bar"
                    style={{ height: `${(item.count / 320) * 100}%`, background: item.color }}
                  ></div>
                </div>
                <span className="bar-label">{item.type}</span>
                <span className="bar-value">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlans = () => (
    <div className="plans-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="health">Health</option>
            <option value="dental">Dental</option>
            <option value="vision">Vision</option>
            <option value="life">Life Insurance</option>
            <option value="401k">401(k)</option>
            <option value="hsa">HSA</option>
            <option value="fsa">FSA</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary">
            <Plus size={18} /> Add Plan
          </button>
        </div>
      </div>

      <div className="plans-grid">
        {plans
          .filter(plan =>
            (typeFilter === 'all' || plan.type === typeFilter) &&
            (searchTerm === '' || plan.name.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map(plan => (
            <div
              key={plan.id}
              className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(selectedPlan?.id === plan.id ? null : plan)}
            >
              <div className="plan-header">
                <div className={`plan-type-icon ${getPlanTypeColor(plan.type)}`}>
                  {getPlanTypeIcon(plan.type)}
                </div>
                <div className="plan-title">
                  <h4>{plan.name}</h4>
                  <span className="plan-provider">{plan.provider}</span>
                </div>
                {plan.tier && (
                  <span className={`tier-badge ${plan.tier}`}>{plan.tier}</span>
                )}
              </div>
              <p className="plan-description">{plan.description}</p>
              <div className="plan-coverage">
                <span className="coverage-label">Coverage:</span>
                <span className="coverage-value">{plan.coverage}</span>
              </div>
              <div className="plan-pricing">
                <div className="price-row">
                  <span>Monthly Cost</span>
                  <span className="price-value">{formatCurrency(plan.monthlyCost)}</span>
                </div>
                <div className="price-row employer">
                  <span>Employer Pays</span>
                  <span className="price-value">-{formatCurrency(plan.employerContribution)}</span>
                </div>
                <div className="price-row total">
                  <span>Your Cost</span>
                  <span className="price-value">{formatCurrency(plan.monthlyCost - plan.employerContribution)}</span>
                </div>
              </div>
              <div className="plan-footer">
                <span className="enrolled-count">
                  <Users size={14} /> {plan.enrolledCount} enrolled
                </span>
                <span className={`status-badge ${plan.status === 'active' ? 'success' : 'muted'}`}>
                  {plan.status}
                </span>
              </div>
            </div>
          ))}
      </div>

      {selectedPlan && (
        <div className="plan-detail-panel">
          <div className="panel-header">
            <h3>{selectedPlan.name}</h3>
            <button className="close-btn" onClick={() => setSelectedPlan(null)}>
              <XCircle size={20} />
            </button>
          </div>
          <div className="panel-content">
            <div className={`detail-icon ${getPlanTypeColor(selectedPlan.type)}`}>
              {getPlanTypeIcon(selectedPlan.type)}
            </div>
            <div className="detail-provider">
              <Building2 size={16} />
              <span>{selectedPlan.provider}</span>
            </div>
            <p className="detail-description">{selectedPlan.description}</p>
            
            <div className="detail-section">
              <h4>Coverage Details</h4>
              <p>{selectedPlan.coverage}</p>
            </div>

            <div className="detail-section">
              <h4>Pricing</h4>
              <div className="detail-pricing">
                <div className="pricing-item">
                  <span>Monthly Premium</span>
                  <span>{formatCurrency(selectedPlan.monthlyCost)}</span>
                </div>
                <div className="pricing-item highlight">
                  <span>Employer Contribution</span>
                  <span>-{formatCurrency(selectedPlan.employerContribution)}</span>
                </div>
                <div className="pricing-item total">
                  <span>Employee Cost</span>
                  <span>{formatCurrency(selectedPlan.monthlyCost - selectedPlan.employerContribution)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Enrollment Stats</h4>
              <div className="enrollment-stats">
                <div className="stat-item">
                  <Users size={20} />
                  <div className="stat-info">
                    <span className="stat-value">{selectedPlan.enrolledCount}</span>
                    <span className="stat-label">Total Enrolled</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-primary">
                <UserPlus size={16} /> Enroll Now
              </button>
              <button className="btn-outline">
                <FileText size={16} /> View Documents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderEnrollments = () => (
    <div className="enrollments-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search enrollments..." />
          </div>
          <select className="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <Download size={18} /> Export
          </button>
          <button className="btn-primary">
            <Plus size={18} /> New Enrollment
          </button>
        </div>
      </div>

      <div className="enrollments-table">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Plan</th>
              <th>Type</th>
              <th>Tier</th>
              <th>Start Date</th>
              <th>Monthly Cost</th>
              <th>Dependents</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map(enrollment => (
              <tr key={enrollment.id}>
                <td>
                  <div className="employee-cell">
                    <div className="employee-avatar">
                      {enrollment.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{enrollment.employeeName}</span>
                  </div>
                </td>
                <td>{enrollment.planName}</td>
                <td>
                  <span className={`type-badge ${getPlanTypeColor(enrollment.planType)}`}>
                    {enrollment.planType}
                  </span>
                </td>
                <td>{enrollment.tier}</td>
                <td>{formatDate(enrollment.startDate)}</td>
                <td className="cost-cell">{formatCurrency(enrollment.monthlyCost)}</td>
                <td>
                  {enrollment.dependents > 0 ? (
                    <span className="dependents-badge">{enrollment.dependents}</span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${enrollment.status === 'active' ? 'success' : enrollment.status === 'pending' ? 'warning' : 'error'}`}>
                    {enrollment.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn" title="View">
                      <Eye size={14} />
                    </button>
                    <button className="action-btn" title="Edit">
                      <Edit3 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDependents = () => (
    <div className="dependents-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search dependents..." />
          </div>
          <select className="filter-select">
            <option value="all">All Relationships</option>
            <option value="spouse">Spouse</option>
            <option value="child">Child</option>
            <option value="domestic_partner">Domestic Partner</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary">
            <Plus size={18} /> Add Dependent
          </button>
        </div>
      </div>

      <div className="dependents-grid">
        {dependents.map(dependent => (
          <div key={dependent.id} className="dependent-card">
            <div className="dependent-header">
              <div className="dependent-avatar">
                {dependent.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="dependent-info">
                <h4>{dependent.name}</h4>
                <span className="relationship-badge">{dependent.relationship.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="dependent-details">
              <div className="detail-row">
                <Calendar size={14} />
                <span>DOB: {formatDate(dependent.dateOfBirth)}</span>
              </div>
              <div className="detail-row">
                <Shield size={14} />
                <span>{dependent.coveredPlans.length} plans</span>
              </div>
            </div>
            <div className="covered-plans">
              <span className="plans-label">Covered Plans:</span>
              <div className="plans-tags">
                {dependent.coveredPlans.map(planId => {
                  const plan = plans.find(p => p.id === planId);
                  return plan ? (
                    <span key={planId} className={`plan-tag ${getPlanTypeColor(plan.type)}`}>
                      {plan.type}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            <div className="dependent-actions">
              <button className="btn-outline small">
                <Edit3 size={14} /> Edit
              </button>
              <button className="btn-outline small danger">
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderClaims = () => (
    <div className="claims-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search claims..." />
          </div>
          <select className="filter-select">
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="denied">Denied</option>
          </select>
          <select className="filter-select">
            <option value="all">All Types</option>
            <option value="health">Health</option>
            <option value="dental">Dental</option>
            <option value="vision">Vision</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <Download size={18} /> Export
          </button>
          <button className="btn-primary">
            <Plus size={18} /> Submit Claim
          </button>
        </div>
      </div>

      <div className="claims-stats">
        <div className="claim-stat approved">
          <CheckCircle2 size={20} />
          <div className="stat-info">
            <span className="stat-value">{claims.filter(c => c.status === 'approved').length}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
        <div className="claim-stat pending">
          <Clock size={20} />
          <div className="stat-info">
            <span className="stat-value">{claims.filter(c => c.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="claim-stat denied">
          <XCircle size={20} />
          <div className="stat-info">
            <span className="stat-value">{claims.filter(c => c.status === 'denied').length}</span>
            <span className="stat-label">Denied</span>
          </div>
        </div>
        <div className="claim-stat total">
          <DollarSign size={20} />
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(claims.reduce((sum, c) => sum + (c.status === 'approved' ? c.amount : 0), 0))}</span>
            <span className="stat-label">Total Paid</span>
          </div>
        </div>
      </div>

      <div className="claims-table">
        <table>
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Employee</th>
              <th>Plan Type</th>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map(claim => (
              <tr key={claim.id}>
                <td className="claim-id">{claim.id}</td>
                <td>
                  <div className="employee-cell">
                    <div className="employee-avatar small">
                      {claim.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{claim.employeeName}</span>
                  </div>
                </td>
                <td>
                  <span className={`type-badge ${getPlanTypeColor(claim.planType)}`}>
                    {claim.planType}
                  </span>
                </td>
                <td>{formatDate(claim.claimDate)}</td>
                <td className="description-cell">{claim.description}</td>
                <td className="amount-cell">{formatCurrency(claim.amount)}</td>
                <td>
                  <span className={`status-badge ${claim.status === 'approved' ? 'success' : claim.status === 'pending' ? 'warning' : 'error'}`}>
                    {claim.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn" title="View Details">
                      <Eye size={14} />
                    </button>
                    <button className="action-btn" title="Download">
                      <Download size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="benefits-page">
      <div className="ben__header">
        <div className="ben__title-section">
          <div className="ben__icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>Benefits Administration</h1>
            <p>Manage employee benefits, enrollments, and claims</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary">
            <Settings size={18} />
            Configure Benefits
          </button>
        </div>
      </div>

      <div className="ben__tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={18} />
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <Shield size={18} />
          Benefit Plans
          <span className="tab-badge">{plans.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'enrollments' ? 'active' : ''}`}
          onClick={() => setActiveTab('enrollments')}
        >
          <Users size={18} />
          Enrollments
          <span className="tab-badge">{enrollments.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'dependents' ? 'active' : ''}`}
          onClick={() => setActiveTab('dependents')}
        >
          <UserPlus size={18} />
          Dependents
          <span className="tab-badge">{dependents.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          <FileText size={18} />
          Claims
          <span className="tab-badge">{claims.filter(c => c.status === 'pending').length}</span>
        </button>
      </div>

      <div className="ben__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'plans' && renderPlans()}
        {activeTab === 'enrollments' && renderEnrollments()}
        {activeTab === 'dependents' && renderDependents()}
        {activeTab === 'claims' && renderClaims()}
      </div>
    </div>
  );
};

export default BenefitsPage;
