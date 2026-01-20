'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Building,
  Briefcase,
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Eye,
  MoreHorizontal,
  XCircle,
  Play,
  Pause,
  Settings,
  PieChart,
  BarChart2,
  ArrowUpRight,
  CalendarDays,
  Wallet,
  BadgeCheck,
  Shield,
  CircleDollarSign,
  Banknote,
  Receipt
} from 'lucide-react';
import './payroll.css';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  employeeType: 'full-time' | 'part-time' | 'contractor';
  salary: number;
  payFrequency: 'weekly' | 'bi-weekly' | 'monthly';
  bankAccount: string;
  taxId: string;
  startDate: string;
  status: 'active' | 'on-leave' | 'terminated';
  avatar?: string;
}

interface PayrollRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  employeeCount: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  taxes: number;
  benefits: number;
}

interface PayStub {
  id: string;
  employeeId: string;
  employeeName: string;
  payrollRunId: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  healthInsurance: number;
  retirement401k: number;
  otherDeductions: number;
  netPay: number;
  hoursWorked: number;
  overtimeHours: number;
}

interface TaxFiling {
  id: string;
  type: string;
  period: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'filed' | 'paid';
}

interface PayrollMetrics {
  totalPayroll: number;
  averageSalary: number;
  employeeCount: number;
  nextPayrollDate: string;
  totalTaxes: number;
  totalBenefits: number;
  monthlyChange: number;
  pendingFilings: number;
}

const sampleEmployees: Employee[] = [
  {
    id: 'EMP-001',
    name: 'John Smith',
    email: 'john.smith@cube.com',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    employeeType: 'full-time',
    salary: 145000,
    payFrequency: 'bi-weekly',
    bankAccount: '****4521',
    taxId: '***-**-6789',
    startDate: '2022-03-15',
    status: 'active'
  },
  {
    id: 'EMP-002',
    name: 'Emily Davis',
    email: 'emily.davis@cube.com',
    department: 'Design',
    position: 'UX Lead',
    employeeType: 'full-time',
    salary: 125000,
    payFrequency: 'bi-weekly',
    bankAccount: '****7832',
    taxId: '***-**-4523',
    startDate: '2021-08-01',
    status: 'active'
  },
  {
    id: 'EMP-003',
    name: 'Michael Chen',
    email: 'michael.chen@cube.com',
    department: 'Engineering',
    position: 'DevOps Engineer',
    employeeType: 'full-time',
    salary: 135000,
    payFrequency: 'bi-weekly',
    bankAccount: '****2145',
    taxId: '***-**-8901',
    startDate: '2023-01-10',
    status: 'active'
  },
  {
    id: 'EMP-004',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@cube.com',
    department: 'Marketing',
    position: 'Marketing Director',
    employeeType: 'full-time',
    salary: 155000,
    payFrequency: 'bi-weekly',
    bankAccount: '****9087',
    taxId: '***-**-3456',
    startDate: '2020-06-20',
    status: 'active'
  },
  {
    id: 'EMP-005',
    name: 'David Park',
    email: 'david.park@cube.com',
    department: 'Sales',
    position: 'Account Executive',
    employeeType: 'full-time',
    salary: 95000,
    payFrequency: 'bi-weekly',
    bankAccount: '****5678',
    taxId: '***-**-7890',
    startDate: '2023-06-01',
    status: 'active'
  },
  {
    id: 'EMP-006',
    name: 'Lisa Wong',
    email: 'lisa.wong@cube.com',
    department: 'Finance',
    position: 'Financial Analyst',
    employeeType: 'full-time',
    salary: 105000,
    payFrequency: 'bi-weekly',
    bankAccount: '****3210',
    taxId: '***-**-2345',
    startDate: '2022-09-15',
    status: 'on-leave'
  }
];

const samplePayrollRuns: PayrollRun[] = [
  {
    id: 'PR-2025-003',
    periodStart: '2025-01-16',
    periodEnd: '2025-01-31',
    payDate: '2025-02-05',
    status: 'processing',
    employeeCount: 48,
    grossPay: 425000,
    totalDeductions: 127500,
    netPay: 297500,
    taxes: 89250,
    benefits: 38250
  },
  {
    id: 'PR-2025-002',
    periodStart: '2025-01-01',
    periodEnd: '2025-01-15',
    payDate: '2025-01-20',
    status: 'completed',
    employeeCount: 48,
    grossPay: 418500,
    totalDeductions: 125550,
    netPay: 292950,
    taxes: 87885,
    benefits: 37665
  },
  {
    id: 'PR-2025-001',
    periodStart: '2024-12-16',
    periodEnd: '2024-12-31',
    payDate: '2025-01-05',
    status: 'completed',
    employeeCount: 47,
    grossPay: 412000,
    totalDeductions: 123600,
    netPay: 288400,
    taxes: 86520,
    benefits: 37080
  }
];

const samplePayStubs: PayStub[] = [
  {
    id: 'PS-001',
    employeeId: 'EMP-001',
    employeeName: 'John Smith',
    payrollRunId: 'PR-2025-002',
    periodStart: '2025-01-01',
    periodEnd: '2025-01-15',
    grossPay: 5576.92,
    federalTax: 892.31,
    stateTax: 334.62,
    socialSecurity: 345.77,
    medicare: 80.87,
    healthInsurance: 250.00,
    retirement401k: 334.62,
    otherDeductions: 50.00,
    netPay: 3288.73,
    hoursWorked: 80,
    overtimeHours: 0
  },
  {
    id: 'PS-002',
    employeeId: 'EMP-002',
    employeeName: 'Emily Davis',
    payrollRunId: 'PR-2025-002',
    periodStart: '2025-01-01',
    periodEnd: '2025-01-15',
    grossPay: 4807.69,
    federalTax: 721.15,
    stateTax: 288.46,
    socialSecurity: 298.08,
    medicare: 69.71,
    healthInsurance: 250.00,
    retirement401k: 288.46,
    otherDeductions: 0,
    netPay: 2891.83,
    hoursWorked: 80,
    overtimeHours: 0
  }
];

const sampleTaxFilings: TaxFiling[] = [
  {
    id: 'TF-001',
    type: 'Federal Withholding (941)',
    period: 'Q1 2025',
    dueDate: '2025-04-30',
    amount: 352500,
    status: 'pending'
  },
  {
    id: 'TF-002',
    type: 'State Income Tax',
    period: 'January 2025',
    dueDate: '2025-02-15',
    amount: 42500,
    status: 'pending'
  },
  {
    id: 'TF-003',
    type: 'FUTA',
    period: 'Q4 2024',
    dueDate: '2025-01-31',
    amount: 8400,
    status: 'filed'
  },
  {
    id: 'TF-004',
    type: 'W-2 Filing',
    period: '2024',
    dueDate: '2025-01-31',
    amount: 0,
    status: 'paid'
  }
];

const sampleMetrics: PayrollMetrics = {
  totalPayroll: 843500,
  averageSalary: 127500,
  employeeCount: 48,
  nextPayrollDate: '2025-02-05',
  totalTaxes: 177135,
  totalBenefits: 75915,
  monthlyChange: 2.3,
  pendingFilings: 2
};

export default function PayrollManagementPage(): React.JSX.Element {
  const [employees, setEmployees] = useState<Employee[]>(sampleEmployees);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(samplePayrollRuns);
  const [payStubs, setPayStubs] = useState<PayStub[]>(samplePayStubs);
  const [taxFilings, setTaxFilings] = useState<TaxFiling[]>(sampleTaxFilings);
  const [metrics, setMetrics] = useState<PayrollMetrics>(sampleMetrics);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'payroll' | 'taxes'>('overview');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRun | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const filteredEmployees = employees.filter(emp => {
    const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={14} />;
      case 'on-leave': return <Clock size={14} />;
      case 'terminated': return <XCircle size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      case 'processing': return <RefreshCw size={14} className="spinning" />;
      case 'draft': return <FileText size={14} />;
      case 'failed': return <AlertTriangle size={14} />;
      case 'filed': return <CheckCircle size={14} />;
      case 'paid': return <BadgeCheck size={14} />;
      case 'pending': return <Clock size={14} />;
      default: return null;
    }
  };

  const getDepartments = () => {
    const depts = new Set(employees.map(e => e.department));
    return Array.from(depts);
  };

  return (
    <div className="payroll-management">
      {/* Header */}
      <div className="pay__header">
        <div className="pay__title-section">
          <div className="pay__icon">
            <Banknote size={28} />
          </div>
          <div>
            <h1>Payroll Management</h1>
            <p>Process payroll, manage employees, and handle tax filings</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Play size={16} />
            Run Payroll
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="payroll-summary">
        <div className="summary-card total">
          <CircleDollarSign className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.totalPayroll)}</span>
            <span className="summary-label">Total Payroll (MTD)</span>
          </div>
        </div>
        <div className="summary-card employees">
          <Users className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{metrics.employeeCount}</span>
            <span className="summary-label">Active Employees</span>
          </div>
        </div>
        <div className="summary-card taxes">
          <Receipt className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.totalTaxes)}</span>
            <span className="summary-label">Total Taxes</span>
          </div>
        </div>
        <div className="summary-card next">
          <CalendarDays className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{formatDate(metrics.nextPayrollDate)}</span>
            <span className="summary-label">Next Pay Date</span>
          </div>
        </div>
        <div className="summary-card filings">
          <Shield className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{metrics.pendingFilings}</span>
            <span className="summary-label">Pending Filings</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pay__tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <PieChart size={16} />
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
          className={`tab-btn ${activeTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          <Wallet size={16} />
          Payroll Runs
        </button>
        <button
          className={`tab-btn ${activeTab === 'taxes' ? 'active' : ''}`}
          onClick={() => setActiveTab('taxes')}
        >
          <FileText size={16} />
          Tax Filings
          {metrics.pendingFilings > 0 && (
            <span className="tab-badge alert">{metrics.pendingFilings}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="pay__content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              {/* Payroll Distribution */}
              <div className="overview-card distribution">
                <h3>Payroll Distribution</h3>
                <div className="distribution-chart">
                  <div className="donut-chart">
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--pay-border)" strokeWidth="15" />
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="none" 
                        stroke="var(--pay-primary)" 
                        strokeWidth="15"
                        strokeDasharray="188.5 251.2"
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="none" 
                        stroke="var(--pay-warning)" 
                        strokeWidth="15"
                        strokeDasharray="37.68 251.2"
                        strokeDashoffset="-188.5"
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <circle 
                        cx="50" cy="50" r="40" 
                        fill="none" 
                        stroke="var(--pay-success)" 
                        strokeWidth="15"
                        strokeDasharray="25.12 251.2"
                        strokeDashoffset="-226.18"
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="donut-center">
                      <span className="total-label">Net Pay</span>
                      <span className="total-value">{formatCurrency(297500)}</span>
                    </div>
                  </div>
                  <div className="distribution-legend">
                    <div className="legend-item">
                      <span className="legend-color" style={{ background: 'var(--pay-primary)' }} />
                      <span className="legend-label">Net Pay</span>
                      <span className="legend-value">{formatCurrency(297500)}</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{ background: 'var(--pay-warning)' }} />
                      <span className="legend-label">Taxes</span>
                      <span className="legend-value">{formatCurrency(89250)}</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{ background: 'var(--pay-success)' }} />
                      <span className="legend-label">Benefits</span>
                      <span className="legend-value">{formatCurrency(38250)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Payroll Status */}
              <div className="overview-card status">
                <h3>Current Payroll</h3>
                <div className="current-payroll">
                  <div className="payroll-status-badge processing">
                    <RefreshCw size={16} className="spinning" />
                    Processing
                  </div>
                  <div className="payroll-details">
                    <div className="detail-row">
                      <span className="label">Pay Period</span>
                      <span className="value">Jan 16 - Jan 31, 2025</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Pay Date</span>
                      <span className="value">Feb 5, 2025</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Employees</span>
                      <span className="value">48</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Gross Pay</span>
                      <span className="value">{formatCurrency(425000)}</span>
                    </div>
                  </div>
                  <div className="payroll-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '65%' }} />
                    </div>
                    <span className="progress-label">65% Complete</span>
                  </div>
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="overview-card departments">
                <h3>By Department</h3>
                <div className="department-list">
                  {[
                    { name: 'Engineering', count: 18, total: 2340000 },
                    { name: 'Sales', count: 12, total: 1440000 },
                    { name: 'Marketing', count: 8, total: 880000 },
                    { name: 'Finance', count: 5, total: 575000 },
                    { name: 'Design', count: 5, total: 625000 }
                  ].map(dept => (
                    <div key={dept.name} className="department-item">
                      <div className="dept-info">
                        <span className="dept-name">{dept.name}</span>
                        <span className="dept-count">{dept.count} employees</span>
                      </div>
                      <span className="dept-total">{formatCurrency(dept.total / 12)}/mo</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="overview-card deadlines">
                <h3>Upcoming Deadlines</h3>
                <div className="deadlines-list">
                  {taxFilings.filter(f => f.status === 'pending').map(filing => (
                    <div key={filing.id} className="deadline-item">
                      <div className="deadline-icon">
                        <AlertTriangle size={16} />
                      </div>
                      <div className="deadline-info">
                        <span className="deadline-type">{filing.type}</span>
                        <span className="deadline-period">{filing.period}</span>
                      </div>
                      <div className="deadline-date">
                        <CalendarDays size={14} />
                        {formatDate(filing.dueDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="employees-tab">
            <div className="employees-toolbar">
              <div className="toolbar-left">
                <div className="search-box">
                  <Search size={16} />
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
                  {getDepartments().map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="toolbar-right">
                <button className="btn-primary">
                  <Plus size={16} />
                  Add Employee
                </button>
              </div>
            </div>

            <div className="employees-layout">
              <div className="employees-table">
                <div className="table-header">
                  <span>Employee</span>
                  <span>Department</span>
                  <span>Position</span>
                  <span>Salary</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                {filteredEmployees.map(employee => (
                  <div
                    key={employee.id}
                    className={`table-row ${selectedEmployee?.id === employee.id ? 'selected' : ''}`}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <div className="employee-cell">
                      <div className="employee-avatar">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="employee-info">
                        <span className="employee-name">{employee.name}</span>
                        <span className="employee-email">{employee.email}</span>
                      </div>
                    </div>
                    <div className="department-cell">{employee.department}</div>
                    <div className="position-cell">{employee.position}</div>
                    <div className="salary-cell">{formatCurrency(employee.salary)}/yr</div>
                    <div className={`status-cell ${employee.status}`}>
                      {getStatusIcon(employee.status)}
                      {employee.status.replace('-', ' ')}
                    </div>
                    <div className="actions-cell">
                      <button className="btn-icon small">
                        <Eye size={14} />
                      </button>
                      <button className="btn-icon small">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedEmployee && (
                <div className="employee-detail-panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <div className="employee-avatar large">
                        {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3>{selectedEmployee.name}</h3>
                        <span className={`status-badge ${selectedEmployee.status}`}>
                          {getStatusIcon(selectedEmployee.status)}
                          {selectedEmployee.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="btn-icon"
                      onClick={() => setSelectedEmployee(null)}
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                  <div className="panel-content">
                    <div className="employee-contact">
                      <div className="contact-item">
                        <Mail size={14} />
                        {selectedEmployee.email}
                      </div>
                      <div className="contact-item">
                        <Building size={14} />
                        {selectedEmployee.department}
                      </div>
                      <div className="contact-item">
                        <Briefcase size={14} />
                        {selectedEmployee.position}
                      </div>
                    </div>

                    <div className="compensation-section">
                      <h4>Compensation</h4>
                      <div className="compensation-grid">
                        <div className="comp-item">
                          <span className="comp-label">Annual Salary</span>
                          <span className="comp-value">{formatCurrency(selectedEmployee.salary)}</span>
                        </div>
                        <div className="comp-item">
                          <span className="comp-label">Pay Frequency</span>
                          <span className="comp-value capitalize">{selectedEmployee.payFrequency}</span>
                        </div>
                        <div className="comp-item">
                          <span className="comp-label">Per Pay Period</span>
                          <span className="comp-value">
                            {formatCurrency(selectedEmployee.salary / (selectedEmployee.payFrequency === 'monthly' ? 12 : selectedEmployee.payFrequency === 'bi-weekly' ? 26 : 52))}
                          </span>
                        </div>
                        <div className="comp-item">
                          <span className="comp-label">Employee Type</span>
                          <span className="comp-value capitalize">{selectedEmployee.employeeType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="payment-section">
                      <h4>Payment Details</h4>
                      <div className="payment-grid">
                        <div className="payment-item">
                          <CreditCard size={14} />
                          <span>Bank Account: {selectedEmployee.bankAccount}</span>
                        </div>
                        <div className="payment-item">
                          <Shield size={14} />
                          <span>Tax ID: {selectedEmployee.taxId}</span>
                        </div>
                        <div className="payment-item">
                          <CalendarDays size={14} />
                          <span>Start Date: {formatDate(selectedEmployee.startDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="recent-paystubs">
                      <h4>Recent Pay Stubs</h4>
                      <div className="paystubs-list">
                        {payStubs
                          .filter(ps => ps.employeeId === selectedEmployee.id)
                          .map(stub => (
                            <div key={stub.id} className="paystub-item">
                              <div className="paystub-period">
                                {formatDate(stub.periodStart)} - {formatDate(stub.periodEnd)}
                              </div>
                              <div className="paystub-amounts">
                                <span className="gross">{formatCurrency(stub.grossPay)}</span>
                                <span className="net">{formatCurrency(stub.netPay)}</span>
                              </div>
                              <button className="btn-icon small">
                                <Download size={14} />
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className="panel-actions">
                    <button className="btn-outline">
                      <Edit size={16} />
                      Edit
                    </button>
                    <button className="btn-primary">
                      <FileText size={16} />
                      View All Stubs
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
          <div className="payroll-tab">
            <div className="payroll-header">
              <h3>Payroll History</h3>
              <button className="btn-primary">
                <Plus size={16} />
                New Payroll Run
              </button>
            </div>

            <div className="payroll-table">
              <div className="table-header">
                <span>Payroll ID</span>
                <span>Pay Period</span>
                <span>Pay Date</span>
                <span>Employees</span>
                <span>Gross Pay</span>
                <span>Net Pay</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {payrollRuns.map(run => (
                <div key={run.id} className="table-row">
                  <div className="id-cell">{run.id}</div>
                  <div className="period-cell">
                    {formatDate(run.periodStart)} - {formatDate(run.periodEnd)}
                  </div>
                  <div className="date-cell">{formatDate(run.payDate)}</div>
                  <div className="count-cell">{run.employeeCount}</div>
                  <div className="amount-cell">{formatCurrency(run.grossPay)}</div>
                  <div className="amount-cell net">{formatCurrency(run.netPay)}</div>
                  <div className={`status-cell ${run.status}`}>
                    {getStatusIcon(run.status)}
                    {run.status}
                  </div>
                  <div className="actions-cell">
                    <button className="btn-outline small">
                      <Eye size={14} />
                      View
                    </button>
                    {run.status === 'draft' && (
                      <button className="btn-primary small">
                        <Play size={14} />
                        Run
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Taxes Tab */}
        {activeTab === 'taxes' && (
          <div className="taxes-tab">
            <div className="taxes-header">
              <h3>Tax Filings & Compliance</h3>
              <button className="btn-primary">
                <Plus size={16} />
                New Filing
              </button>
            </div>

            <div className="taxes-grid">
              <div className="tax-summary-cards">
                <div className="tax-card">
                  <div className="tax-card-header">
                    <span className="tax-type">Federal Taxes</span>
                    <span className="tax-period">YTD 2025</span>
                  </div>
                  <div className="tax-amount">{formatCurrency(352500)}</div>
                  <div className="tax-status pending">2 filings pending</div>
                </div>
                <div className="tax-card">
                  <div className="tax-card-header">
                    <span className="tax-type">State Taxes</span>
                    <span className="tax-period">YTD 2025</span>
                  </div>
                  <div className="tax-amount">{formatCurrency(85000)}</div>
                  <div className="tax-status filed">All filed</div>
                </div>
                <div className="tax-card">
                  <div className="tax-card-header">
                    <span className="tax-type">FICA</span>
                    <span className="tax-period">YTD 2025</span>
                  </div>
                  <div className="tax-amount">{formatCurrency(128700)}</div>
                  <div className="tax-status filed">All filed</div>
                </div>
              </div>

              <div className="filings-table">
                <div className="table-header">
                  <span>Filing Type</span>
                  <span>Period</span>
                  <span>Due Date</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                {taxFilings.map(filing => (
                  <div key={filing.id} className="table-row">
                    <div className="type-cell">{filing.type}</div>
                    <div className="period-cell">{filing.period}</div>
                    <div className="due-cell">
                      <CalendarDays size={14} />
                      {formatDate(filing.dueDate)}
                    </div>
                    <div className="amount-cell">
                      {filing.amount > 0 ? formatCurrency(filing.amount) : '-'}
                    </div>
                    <div className={`status-cell ${filing.status}`}>
                      {getStatusIcon(filing.status)}
                      {filing.status}
                    </div>
                    <div className="actions-cell">
                      {filing.status === 'pending' && (
                        <button className="btn-primary small">
                          <FileText size={14} />
                          File Now
                        </button>
                      )}
                      <button className="btn-icon small">
                        <Eye size={14} />
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
