'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Settings,
  Eye,
  Edit,
  Trash2,
  X,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Target,
  Zap,
  Briefcase,
  Building2,
  MapPin,
  MoreVertical,
  FileText,
  Calculator,
  Percent,
  CreditCard,
  Wallet,
  Gift,
  Trophy,
  Sparkles,
  RefreshCw,
  Lock,
  Unlock,
  History
} from 'lucide-react';
import './compensation.css';

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  location: string;
  hireDate: string;
  salary: number;
  bonus: number;
  totalCompensation: number;
  grade: string;
  band: string;
  compaRatio: number;
  lastReview: string;
  nextReview: string;
  status: 'active' | 'on-leave' | 'terminated';
}

interface SalaryBand {
  id: string;
  grade: string;
  band: string;
  title: string;
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  department: string;
  employees: number;
}

interface CompensationReview {
  id: string;
  employeeId: string;
  employeeName: string;
  currentSalary: number;
  proposedSalary: number;
  changePercent: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  effectiveDate: string;
  submittedBy: string;
  submittedDate: string;
}

interface BonusAllocation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  targetBonus: number;
  actualBonus: number;
  performance: number;
  payoutDate: string;
  status: 'pending' | 'approved' | 'paid';
}

interface CompensationMetrics {
  totalPayroll: number;
  avgSalary: number;
  avgCompaRatio: number;
  bonusPool: number;
  pendingReviews: number;
  upcomingReviews: number;
  payrollGrowth: number;
  equityBudget: number;
}

type TabType = 'overview' | 'employees' | 'salary-bands' | 'reviews' | 'bonuses';

const compensationMetrics: CompensationMetrics = {
  totalPayroll: 12450000,
  avgSalary: 95000,
  avgCompaRatio: 0.98,
  bonusPool: 1850000,
  pendingReviews: 12,
  upcomingReviews: 28,
  payrollGrowth: 8.5,
  equityBudget: 2500000
};

const employees: Employee[] = [
  {
    id: 'EMP001',
    name: 'Sarah Johnson',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    hireDate: '2021-03-15',
    salary: 165000,
    bonus: 25000,
    totalCompensation: 190000,
    grade: 'L5',
    band: 'IC5',
    compaRatio: 1.05,
    lastReview: '2024-09-15',
    nextReview: '2025-03-15',
    status: 'active'
  },
  {
    id: 'EMP002',
    name: 'Michael Chen',
    position: 'Engineering Manager',
    department: 'Engineering',
    location: 'New York, NY',
    hireDate: '2020-06-01',
    salary: 185000,
    bonus: 35000,
    totalCompensation: 220000,
    grade: 'M3',
    band: 'MGR3',
    compaRatio: 0.98,
    lastReview: '2024-08-20',
    nextReview: '2025-02-20',
    status: 'active'
  },
  {
    id: 'EMP003',
    name: 'Emily Davis',
    position: 'Product Designer',
    department: 'Design',
    location: 'Los Angeles, CA',
    hireDate: '2022-01-10',
    salary: 125000,
    bonus: 15000,
    totalCompensation: 140000,
    grade: 'L4',
    band: 'IC4',
    compaRatio: 0.92,
    lastReview: '2024-10-05',
    nextReview: '2025-04-05',
    status: 'active'
  },
  {
    id: 'EMP004',
    name: 'James Wilson',
    position: 'Data Scientist',
    department: 'Analytics',
    location: 'Chicago, IL',
    hireDate: '2021-09-20',
    salary: 145000,
    bonus: 22000,
    totalCompensation: 167000,
    grade: 'L5',
    band: 'IC5',
    compaRatio: 0.95,
    lastReview: '2024-07-15',
    nextReview: '2025-01-15',
    status: 'active'
  },
  {
    id: 'EMP005',
    name: 'Lisa Martinez',
    position: 'Marketing Director',
    department: 'Marketing',
    location: 'Miami, FL',
    hireDate: '2019-11-01',
    salary: 175000,
    bonus: 40000,
    totalCompensation: 215000,
    grade: 'D2',
    band: 'DIR2',
    compaRatio: 1.02,
    lastReview: '2024-06-30',
    nextReview: '2024-12-30',
    status: 'active'
  },
  {
    id: 'EMP006',
    name: 'David Brown',
    position: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Seattle, WA',
    hireDate: '2022-04-15',
    salary: 140000,
    bonus: 18000,
    totalCompensation: 158000,
    grade: 'L4',
    band: 'IC4',
    compaRatio: 0.88,
    lastReview: '2024-11-01',
    nextReview: '2025-05-01',
    status: 'active'
  },
  {
    id: 'EMP007',
    name: 'Rachel Kim',
    position: 'Sales Manager',
    department: 'Sales',
    location: 'Boston, MA',
    hireDate: '2020-08-20',
    salary: 135000,
    bonus: 45000,
    totalCompensation: 180000,
    grade: 'M2',
    band: 'MGR2',
    compaRatio: 1.08,
    lastReview: '2024-05-15',
    nextReview: '2024-11-15',
    status: 'active'
  },
  {
    id: 'EMP008',
    name: 'Alex Thompson',
    position: 'Junior Developer',
    department: 'Engineering',
    location: 'Austin, TX',
    hireDate: '2023-07-01',
    salary: 85000,
    bonus: 8000,
    totalCompensation: 93000,
    grade: 'L2',
    band: 'IC2',
    compaRatio: 0.95,
    lastReview: '2024-12-01',
    nextReview: '2025-06-01',
    status: 'active'
  }
];

const salaryBands: SalaryBand[] = [
  { id: 'SB001', grade: 'L2', band: 'IC2', title: 'Junior', minSalary: 65000, midSalary: 80000, maxSalary: 95000, department: 'Engineering', employees: 15 },
  { id: 'SB002', grade: 'L3', band: 'IC3', title: 'Mid-Level', minSalary: 85000, midSalary: 105000, maxSalary: 125000, department: 'Engineering', employees: 32 },
  { id: 'SB003', grade: 'L4', band: 'IC4', title: 'Senior', minSalary: 115000, midSalary: 140000, maxSalary: 165000, department: 'Engineering', employees: 28 },
  { id: 'SB004', grade: 'L5', band: 'IC5', title: 'Staff', minSalary: 150000, midSalary: 180000, maxSalary: 210000, department: 'Engineering', employees: 12 },
  { id: 'SB005', grade: 'L6', band: 'IC6', title: 'Principal', minSalary: 190000, midSalary: 230000, maxSalary: 270000, department: 'Engineering', employees: 5 },
  { id: 'SB006', grade: 'M2', band: 'MGR2', title: 'Manager', minSalary: 110000, midSalary: 135000, maxSalary: 160000, department: 'All', employees: 18 },
  { id: 'SB007', grade: 'M3', band: 'MGR3', title: 'Senior Manager', minSalary: 145000, midSalary: 175000, maxSalary: 205000, department: 'All', employees: 10 },
  { id: 'SB008', grade: 'D2', band: 'DIR2', title: 'Director', minSalary: 160000, midSalary: 195000, maxSalary: 230000, department: 'All', employees: 6 }
];

const compensationReviews: CompensationReview[] = [
  {
    id: 'CR001',
    employeeId: 'EMP003',
    employeeName: 'Emily Davis',
    currentSalary: 125000,
    proposedSalary: 138000,
    changePercent: 10.4,
    reason: 'Annual performance review - Exceeds expectations',
    status: 'pending',
    effectiveDate: '2025-02-01',
    submittedBy: 'Sarah Johnson',
    submittedDate: '2025-01-15'
  },
  {
    id: 'CR002',
    employeeId: 'EMP006',
    employeeName: 'David Brown',
    currentSalary: 140000,
    proposedSalary: 155000,
    changePercent: 10.7,
    reason: 'Promotion to Senior DevOps Engineer',
    status: 'approved',
    effectiveDate: '2025-02-15',
    submittedBy: 'Michael Chen',
    submittedDate: '2025-01-10'
  },
  {
    id: 'CR003',
    employeeId: 'EMP008',
    employeeName: 'Alex Thompson',
    currentSalary: 85000,
    proposedSalary: 95000,
    changePercent: 11.8,
    reason: 'Market adjustment - Below band minimum',
    status: 'pending',
    effectiveDate: '2025-03-01',
    submittedBy: 'Michael Chen',
    submittedDate: '2025-01-20'
  },
  {
    id: 'CR004',
    employeeId: 'EMP004',
    employeeName: 'James Wilson',
    currentSalary: 145000,
    proposedSalary: 152000,
    changePercent: 4.8,
    reason: 'Annual merit increase',
    status: 'processed',
    effectiveDate: '2025-01-01',
    submittedBy: 'Lisa Martinez',
    submittedDate: '2024-12-15'
  },
  {
    id: 'CR005',
    employeeId: 'EMP007',
    employeeName: 'Rachel Kim',
    currentSalary: 135000,
    proposedSalary: 145000,
    changePercent: 7.4,
    reason: 'Exceptional Q4 performance',
    status: 'rejected',
    effectiveDate: '2025-02-01',
    submittedBy: 'Lisa Martinez',
    submittedDate: '2025-01-05'
  }
];

const bonusAllocations: BonusAllocation[] = [
  { id: 'BA001', employeeId: 'EMP001', employeeName: 'Sarah Johnson', department: 'Engineering', baseSalary: 165000, targetBonus: 24750, actualBonus: 28000, performance: 113, payoutDate: '2025-03-15', status: 'approved' },
  { id: 'BA002', employeeId: 'EMP002', employeeName: 'Michael Chen', department: 'Engineering', baseSalary: 185000, targetBonus: 37000, actualBonus: 42000, performance: 114, payoutDate: '2025-03-15', status: 'approved' },
  { id: 'BA003', employeeId: 'EMP005', employeeName: 'Lisa Martinez', department: 'Marketing', baseSalary: 175000, targetBonus: 35000, actualBonus: 40000, performance: 114, payoutDate: '2025-03-15', status: 'pending' },
  { id: 'BA004', employeeId: 'EMP007', employeeName: 'Rachel Kim', department: 'Sales', baseSalary: 135000, targetBonus: 40500, actualBonus: 52000, performance: 128, payoutDate: '2025-03-15', status: 'pending' },
  { id: 'BA005', employeeId: 'EMP003', employeeName: 'Emily Davis', department: 'Design', baseSalary: 125000, targetBonus: 15000, actualBonus: 16500, performance: 110, payoutDate: '2025-03-15', status: 'pending' },
  { id: 'BA006', employeeId: 'EMP004', employeeName: 'James Wilson', department: 'Analytics', baseSalary: 145000, targetBonus: 21750, actualBonus: 22000, performance: 101, payoutDate: '2025-03-15', status: 'paid' }
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const getCompaRatioColor = (ratio: number): string => {
  if (ratio < 0.9) return 'error';
  if (ratio < 0.95) return 'warning';
  if (ratio <= 1.05) return 'success';
  return 'info';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'approved': return 'success';
    case 'pending': return 'warning';
    case 'rejected': return 'error';
    case 'processed': return 'info';
    case 'paid': return 'success';
    default: return 'muted';
  }
};

export default function CompensationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const filteredReviews = compensationReviews.filter(review => {
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    return matchesStatus;
  });

  const renderOverview = () => (
    <div className="overview-content">
      <div className="metrics-grid">
        <div className="metric-card large primary">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{formatCurrency(compensationMetrics.totalPayroll)}</span>
            <span className="metric-label">Annual Payroll</span>
            <span className="metric-trend positive">
              <ArrowUpRight size={12} />
              +{compensationMetrics.payrollGrowth}% YoY
            </span>
          </div>
        </div>
        <div className="metric-card success">
          <div className="metric-icon">
            <Calculator size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{formatCurrency(compensationMetrics.avgSalary)}</span>
            <span className="metric-label">Average Salary</span>
          </div>
        </div>
        <div className="metric-card info">
          <div className="metric-icon">
            <Percent size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{(compensationMetrics.avgCompaRatio * 100).toFixed(0)}%</span>
            <span className="metric-label">Avg Compa-Ratio</span>
          </div>
        </div>
        <div className="metric-card warning">
          <div className="metric-icon">
            <Gift size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{formatCurrency(compensationMetrics.bonusPool)}</span>
            <span className="metric-label">Bonus Pool</span>
          </div>
        </div>
        <div className="metric-card accent">
          <div className="metric-icon">
            <Clock size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{compensationMetrics.pendingReviews}</span>
            <span className="metric-label">Pending Reviews</span>
          </div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="overview-card">
          <h3><PieChart size={18} /> Payroll by Department</h3>
          <div className="dept-breakdown">
            <div className="dept-chart">
              <svg viewBox="0 0 100 100" className="donut-chart">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a24" strokeWidth="20" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#ec4899" strokeWidth="20"
                  strokeDasharray="125.6 251.2" strokeDashoffset="0" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="20"
                  strokeDasharray="62.8 251.2" strokeDashoffset="-125.6" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#06b6d4" strokeWidth="20"
                  strokeDasharray="37.7 251.2" strokeDashoffset="-188.4" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20"
                  strokeDasharray="25.1 251.2" strokeDashoffset="-226.1" transform="rotate(-90 50 50)" />
              </svg>
            </div>
            <div className="dept-legend">
              <div className="legend-item">
                <span className="legend-color pink" />
                <span className="legend-label">Engineering</span>
                <span className="legend-value">50%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color purple" />
                <span className="legend-label">Sales</span>
                <span className="legend-value">25%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color cyan" />
                <span className="legend-label">Marketing</span>
                <span className="legend-value">15%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color green" />
                <span className="legend-label">Other</span>
                <span className="legend-value">10%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3><BarChart3 size={18} /> Compa-Ratio Distribution</h3>
          <div className="compa-distribution">
            <div className="compa-bar-group">
              <div className="compa-bar-container">
                <div className="compa-bar error" style={{ height: '15%' }} />
              </div>
              <span className="compa-label">&lt;90%</span>
              <span className="compa-count">8</span>
            </div>
            <div className="compa-bar-group">
              <div className="compa-bar-container">
                <div className="compa-bar warning" style={{ height: '25%' }} />
              </div>
              <span className="compa-label">90-95%</span>
              <span className="compa-count">18</span>
            </div>
            <div className="compa-bar-group">
              <div className="compa-bar-container">
                <div className="compa-bar success" style={{ height: '45%' }} />
              </div>
              <span className="compa-label">95-105%</span>
              <span className="compa-count">52</span>
            </div>
            <div className="compa-bar-group">
              <div className="compa-bar-container">
                <div className="compa-bar info" style={{ height: '15%' }} />
              </div>
              <span className="compa-label">&gt;105%</span>
              <span className="compa-count">12</span>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3><Clock size={18} /> Upcoming Reviews</h3>
          <div className="upcoming-reviews">
            {employees
              .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
              .slice(0, 5)
              .map(emp => (
                <div key={emp.id} className="review-item">
                  <div className="review-avatar">{getInitials(emp.name)}</div>
                  <div className="review-info">
                    <span className="review-name">{emp.name}</span>
                    <span className="review-position">{emp.position}</span>
                  </div>
                  <span className="review-date">{formatDate(emp.nextReview)}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="overview-card">
          <h3><AlertTriangle size={18} /> Compensation Alerts</h3>
          <div className="alerts-list">
            <div className="alert-item warning">
              <div className="alert-icon">
                <AlertTriangle size={16} />
              </div>
              <div className="alert-content">
                <span className="alert-title">Below Band Minimum</span>
                <span className="alert-desc">3 employees below salary band minimum</span>
              </div>
              <button className="alert-action">View</button>
            </div>
            <div className="alert-item info">
              <div className="alert-icon">
                <Clock size={16} />
              </div>
              <div className="alert-content">
                <span className="alert-title">Reviews Due</span>
                <span className="alert-desc">12 compensation reviews pending approval</span>
              </div>
              <button className="alert-action">Review</button>
            </div>
            <div className="alert-item success">
              <div className="alert-icon">
                <Gift size={16} />
              </div>
              <div className="alert-content">
                <span className="alert-title">Bonus Cycle</span>
                <span className="alert-desc">Q1 bonus allocations ready for review</span>
              </div>
              <button className="alert-action">View</button>
            </div>
          </div>
        </div>

        <div className="overview-card wide">
          <h3><TrendingUp size={18} /> Payroll Trends</h3>
          <div className="payroll-trend">
            <div className="trend-chart">
              {[9.2, 9.8, 10.1, 10.5, 10.8, 11.2, 11.5, 11.8, 12.0, 12.2, 12.3, 12.45].map((value, index) => (
                <div key={index} className="trend-bar-group">
                  <div className="trend-bar-container">
                    <div 
                      className="trend-bar"
                      style={{ height: `${(value / 12.45) * 100}%` }}
                    />
                  </div>
                  <span className="trend-label">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                  </span>
                </div>
              ))}
            </div>
            <div className="trend-summary">
              <div className="trend-stat">
                <span className="trend-value">{formatCurrency(12450000)}</span>
                <span className="trend-label">Current Payroll</span>
              </div>
              <div className="trend-stat">
                <span className="trend-value positive">+8.5%</span>
                <span className="trend-label">YoY Growth</span>
              </div>
              <div className="trend-stat">
                <span className="trend-value">131</span>
                <span className="trend-label">Total Employees</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmployees = () => (
    <div className="employees-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Analytics">Analytics</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      <div className="employees-table">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Position</th>
              <th>Grade</th>
              <th>Base Salary</th>
              <th>Total Comp</th>
              <th>Compa-Ratio</th>
              <th>Next Review</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.id} onClick={() => setSelectedEmployee(emp)}>
                <td>
                  <div className="employee-cell">
                    <div className="employee-avatar">{getInitials(emp.name)}</div>
                    <div className="employee-info">
                      <span className="employee-name">{emp.name}</span>
                      <span className="employee-dept">{emp.department}</span>
                    </div>
                  </div>
                </td>
                <td>{emp.position}</td>
                <td>
                  <span className="grade-badge">{emp.grade}</span>
                </td>
                <td className="salary-cell">{formatCurrency(emp.salary)}</td>
                <td className="salary-cell">{formatCurrency(emp.totalCompensation)}</td>
                <td>
                  <span className={`compa-badge ${getCompaRatioColor(emp.compaRatio)}`}>
                    {(emp.compaRatio * 100).toFixed(0)}%
                  </span>
                </td>
                <td>{formatDate(emp.nextReview)}</td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn" title="View">
                      <Eye size={14} />
                    </button>
                    <button className="action-btn" title="Edit">
                      <Edit size={14} />
                    </button>
                    <button className="action-btn" title="History">
                      <History size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEmployee && (
        <div className="employee-detail-panel">
          <div className="panel-header">
            <h3>Compensation Details</h3>
            <button className="close-btn" onClick={() => setSelectedEmployee(null)}>
              <X size={20} />
            </button>
          </div>
          <div className="panel-content">
            <div className="detail-avatar large">
              {getInitials(selectedEmployee.name)}
            </div>
            <h4 className="detail-name">{selectedEmployee.name}</h4>
            <p className="detail-position">{selectedEmployee.position}</p>
            
            <div className="comp-summary">
              <div className="comp-item">
                <span className="comp-label">Base Salary</span>
                <span className="comp-value">{formatCurrency(selectedEmployee.salary)}</span>
              </div>
              <div className="comp-item">
                <span className="comp-label">Target Bonus</span>
                <span className="comp-value">{formatCurrency(selectedEmployee.bonus)}</span>
              </div>
              <div className="comp-item total">
                <span className="comp-label">Total Compensation</span>
                <span className="comp-value">{formatCurrency(selectedEmployee.totalCompensation)}</span>
              </div>
            </div>

            <div className="detail-section">
              <h5>Grade & Band</h5>
              <div className="grade-info">
                <div className="grade-item">
                  <span className="grade-label">Grade Level</span>
                  <span className="grade-value">{selectedEmployee.grade}</span>
                </div>
                <div className="grade-item">
                  <span className="grade-label">Salary Band</span>
                  <span className="grade-value">{selectedEmployee.band}</span>
                </div>
                <div className="grade-item">
                  <span className="grade-label">Compa-Ratio</span>
                  <span className={`compa-badge ${getCompaRatioColor(selectedEmployee.compaRatio)}`}>
                    {(selectedEmployee.compaRatio * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h5>Review Schedule</h5>
              <div className="review-schedule">
                <div className="schedule-item">
                  <Calendar size={14} />
                  <span>Last Review: {formatDate(selectedEmployee.lastReview)}</span>
                </div>
                <div className="schedule-item">
                  <Clock size={14} />
                  <span>Next Review: {formatDate(selectedEmployee.nextReview)}</span>
                </div>
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-outline">
                <History size={16} />
                View History
              </button>
              <button className="btn-primary">
                <Edit size={16} />
                Adjust Compensation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSalaryBands = () => (
    <div className="salary-bands-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search salary bands..." />
          </div>
          <select className="filter-select">
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="All">Company-wide</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <Upload size={16} />
            Import
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Add Band
          </button>
        </div>
      </div>

      <div className="bands-grid">
        {salaryBands.map(band => (
          <div key={band.id} className="band-card">
            <div className="band-header">
              <div className="band-badge">{band.grade}</div>
              <span className="band-title">{band.title}</span>
              <button className="band-menu">
                <MoreVertical size={16} />
              </button>
            </div>
            
            <div className="band-range">
              <div className="range-bar">
                <div className="range-fill" />
                <div className="range-marker mid" style={{ left: '50%' }} />
              </div>
              <div className="range-labels">
                <span>{formatCurrency(band.minSalary)}</span>
                <span className="mid-point">{formatCurrency(band.midSalary)}</span>
                <span>{formatCurrency(band.maxSalary)}</span>
              </div>
            </div>

            <div className="band-meta">
              <div className="meta-item">
                <Building2 size={14} />
                <span>{band.department}</span>
              </div>
              <div className="meta-item">
                <Users size={14} />
                <span>{band.employees} employees</span>
              </div>
            </div>

            <div className="band-actions">
              <button className="btn-outline small">
                <Eye size={14} />
                View
              </button>
              <button className="btn-outline small">
                <Edit size={14} />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="reviews-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="processed">Processed</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Review
          </button>
        </div>
      </div>

      <div className="reviews-list">
        {filteredReviews.map(review => (
          <div key={review.id} className={`review-card ${review.status}`}>
            <div className="review-header">
              <div className="review-employee">
                <div className="review-avatar">{getInitials(review.employeeName)}</div>
                <div className="review-info">
                  <span className="review-name">{review.employeeName}</span>
                  <span className="review-id">ID: {review.employeeId}</span>
                </div>
              </div>
              <span className={`status-badge ${getStatusColor(review.status)}`}>
                {review.status}
              </span>
            </div>

            <div className="review-changes">
              <div className="salary-change">
                <div className="change-item current">
                  <span className="change-label">Current</span>
                  <span className="change-value">{formatCurrency(review.currentSalary)}</span>
                </div>
                <div className="change-arrow">
                  <ChevronRight size={20} />
                </div>
                <div className="change-item proposed">
                  <span className="change-label">Proposed</span>
                  <span className="change-value">{formatCurrency(review.proposedSalary)}</span>
                </div>
                <div className="change-percent">
                  <span className={review.changePercent > 0 ? 'positive' : 'negative'}>
                    {review.changePercent > 0 ? '+' : ''}{review.changePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="review-details">
              <p className="review-reason">{review.reason}</p>
              <div className="review-meta">
                <span>
                  <Calendar size={12} />
                  Effective: {formatDate(review.effectiveDate)}
                </span>
                <span>
                  <Users size={12} />
                  Submitted by: {review.submittedBy}
                </span>
              </div>
            </div>

            {review.status === 'pending' && (
              <div className="review-actions">
                <button className="btn-outline small danger">
                  <X size={14} />
                  Reject
                </button>
                <button className="btn-primary small">
                  <CheckCircle2 size={14} />
                  Approve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderBonuses = () => (
    <div className="bonuses-content">
      <div className="bonus-header-stats">
        <div className="bonus-stat">
          <Gift size={24} />
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(compensationMetrics.bonusPool)}</span>
            <span className="stat-label">Total Bonus Pool</span>
          </div>
        </div>
        <div className="bonus-stat">
          <Users size={24} />
          <div className="stat-info">
            <span className="stat-value">{bonusAllocations.length}</span>
            <span className="stat-label">Allocations</span>
          </div>
        </div>
        <div className="bonus-stat">
          <CheckCircle2 size={24} />
          <div className="stat-info">
            <span className="stat-value">{bonusAllocations.filter(b => b.status === 'approved' || b.status === 'paid').length}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
        <div className="bonus-stat">
          <Clock size={24} />
          <div className="stat-info">
            <span className="stat-value">{bonusAllocations.filter(b => b.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      </div>

      <div className="content-toolbar">
        <div className="toolbar-left">
          <select className="filter-select">
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
          </select>
          <select className="filter-select">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Calculator size={16} />
            Calculate Bonuses
          </button>
        </div>
      </div>

      <div className="bonuses-table">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Base Salary</th>
              <th>Target Bonus</th>
              <th>Performance</th>
              <th>Actual Bonus</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bonusAllocations.map(bonus => (
              <tr key={bonus.id}>
                <td>
                  <div className="employee-cell">
                    <div className="employee-avatar small">{getInitials(bonus.employeeName)}</div>
                    <span className="employee-name">{bonus.employeeName}</span>
                  </div>
                </td>
                <td>{bonus.department}</td>
                <td className="salary-cell">{formatCurrency(bonus.baseSalary)}</td>
                <td className="salary-cell">{formatCurrency(bonus.targetBonus)}</td>
                <td>
                  <span className={`performance-badge ${bonus.performance >= 100 ? 'above' : 'below'}`}>
                    {bonus.performance}%
                  </span>
                </td>
                <td className="salary-cell highlight">{formatCurrency(bonus.actualBonus)}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(bonus.status)}`}>
                    {bonus.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn" title="View">
                      <Eye size={14} />
                    </button>
                    <button className="action-btn" title="Edit">
                      <Edit size={14} />
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'employees': return renderEmployees();
      case 'salary-bands': return renderSalaryBands();
      case 'reviews': return renderReviews();
      case 'bonuses': return renderBonuses();
      default: return renderOverview();
    }
  };

  return (
    <div className="compensation-page">
      <div className="comp__header">
        <div className="comp__title-section">
          <div className="comp__icon">
            <DollarSign size={28} />
          </div>
          <div>
            <h1>Compensation Management</h1>
            <p>Manage salaries, bonuses, and total compensation packages</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
          <button className="btn-primary">
            <Calculator size={16} />
            Run Analysis
          </button>
        </div>
      </div>

      <div className="comp__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <Users size={16} />
          Employees
          <span className="tab-badge">{employees.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'salary-bands' ? 'active' : ''}`}
          onClick={() => setActiveTab('salary-bands')}
        >
          <TrendingUp size={16} />
          Salary Bands
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <FileText size={16} />
          Reviews
          <span className="tab-badge">{compensationReviews.filter(r => r.status === 'pending').length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'bonuses' ? 'active' : ''}`}
          onClick={() => setActiveTab('bonuses')}
        >
          <Gift size={16} />
          Bonuses
        </button>
      </div>

      <div className="comp__content">
        {renderContent()}
      </div>
    </div>
  );
}
