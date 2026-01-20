'use client';

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  PieChart,
  BarChart2,
  Target,
  Briefcase,
  Building,
  Users,
  Package,
  Settings,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Layers,
  Activity,
  Wallet,
  CreditCard
} from 'lucide-react';
import './budget.css';

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  allocated: number;
  spent: number;
  committed: number;
  remaining: number;
  percentUsed: number;
  status: 'on-track' | 'warning' | 'over-budget' | 'under-utilized';
  department?: string;
  subcategories?: BudgetSubcategory[];
}

interface BudgetSubcategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
}

interface BudgetPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  totalSpent: number;
  totalCommitted: number;
  status: 'active' | 'closed' | 'draft';
}

interface BudgetForecast {
  month: string;
  projected: number;
  actual?: number | null;
  budget: number;
}

interface BudgetAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  category: string;
  message: string;
  threshold: number;
  currentUsage: number;
  date: string;
}

interface BudgetMetrics {
  totalBudget: number;
  totalSpent: number;
  totalCommitted: number;
  remaining: number;
  utilizationRate: number;
  projectedOverrun: number;
  savingsOpportunity: number;
  activeBudgets: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  personnel: <Users size={18} />,
  technology: <Package size={18} />,
  operations: <Settings size={18} />,
  marketing: <Target size={18} />,
  facilities: <Building size={18} />,
  travel: <Briefcase size={18} />,
  professional: <Activity size={18} />,
  other: <Layers size={18} />
};

const sampleCategories: BudgetCategory[] = [
  {
    id: 'CAT-001',
    name: 'Personnel & Salaries',
    icon: 'personnel',
    color: '#3b82f6',
    allocated: 2500000,
    spent: 1875000,
    committed: 312500,
    remaining: 312500,
    percentUsed: 75,
    status: 'on-track',
    department: 'HR',
    subcategories: [
      { id: 'SUB-001', name: 'Salaries', allocated: 2000000, spent: 1500000 },
      { id: 'SUB-002', name: 'Benefits', allocated: 350000, spent: 262500 },
      { id: 'SUB-003', name: 'Training', allocated: 150000, spent: 112500 }
    ]
  },
  {
    id: 'CAT-002',
    name: 'Technology & Software',
    icon: 'technology',
    color: '#8b5cf6',
    allocated: 850000,
    spent: 720000,
    committed: 85000,
    remaining: 45000,
    percentUsed: 94.7,
    status: 'warning',
    department: 'IT',
    subcategories: [
      { id: 'SUB-004', name: 'Cloud Services', allocated: 400000, spent: 380000 },
      { id: 'SUB-005', name: 'Software Licenses', allocated: 250000, spent: 220000 },
      { id: 'SUB-006', name: 'Hardware', allocated: 200000, spent: 120000 }
    ]
  },
  {
    id: 'CAT-003',
    name: 'Marketing & Advertising',
    icon: 'marketing',
    color: '#ec4899',
    allocated: 650000,
    spent: 520000,
    committed: 156000,
    remaining: -26000,
    percentUsed: 104,
    status: 'over-budget',
    department: 'Marketing',
    subcategories: [
      { id: 'SUB-007', name: 'Digital Marketing', allocated: 350000, spent: 320000 },
      { id: 'SUB-008', name: 'Events', allocated: 200000, spent: 150000 },
      { id: 'SUB-009', name: 'Content', allocated: 100000, spent: 50000 }
    ]
  },
  {
    id: 'CAT-004',
    name: 'Operations & Facilities',
    icon: 'facilities',
    color: '#10b981',
    allocated: 480000,
    spent: 288000,
    committed: 48000,
    remaining: 144000,
    percentUsed: 70,
    status: 'on-track',
    department: 'Operations'
  },
  {
    id: 'CAT-005',
    name: 'Travel & Entertainment',
    icon: 'travel',
    color: '#f59e0b',
    allocated: 180000,
    spent: 72000,
    committed: 27000,
    remaining: 81000,
    percentUsed: 55,
    status: 'under-utilized',
    department: 'All'
  },
  {
    id: 'CAT-006',
    name: 'Professional Services',
    icon: 'professional',
    color: '#06b6d4',
    allocated: 320000,
    spent: 240000,
    committed: 64000,
    remaining: 16000,
    percentUsed: 95,
    status: 'warning',
    department: 'Finance'
  }
];

const samplePeriods: BudgetPeriod[] = [
  {
    id: 'PRD-001',
    name: 'FY 2025',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    totalBudget: 4980000,
    totalSpent: 3715000,
    totalCommitted: 692500,
    status: 'active'
  },
  {
    id: 'PRD-002',
    name: 'Q1 2025',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    totalBudget: 1245000,
    totalSpent: 1120000,
    totalCommitted: 95000,
    status: 'closed'
  },
  {
    id: 'PRD-003',
    name: 'Q2 2025',
    startDate: '2025-04-01',
    endDate: '2025-06-30',
    totalBudget: 1245000,
    totalSpent: 890000,
    totalCommitted: 210000,
    status: 'active'
  }
];

const sampleForecasts: BudgetForecast[] = [
  { month: 'Jan', projected: 380000, actual: 395000, budget: 415000 },
  { month: 'Feb', projected: 410000, actual: 405000, budget: 415000 },
  { month: 'Mar', projected: 425000, actual: 420000, budget: 415000 },
  { month: 'Apr', projected: 395000, actual: 410000, budget: 415000 },
  { month: 'May', projected: 440000, actual: 445000, budget: 415000 },
  { month: 'Jun', projected: 420000, actual: null, budget: 415000 },
  { month: 'Jul', projected: 430000, actual: null, budget: 415000 },
  { month: 'Aug', projected: 415000, actual: null, budget: 415000 },
  { month: 'Sep', projected: 450000, actual: null, budget: 415000 },
  { month: 'Oct', projected: 425000, actual: null, budget: 415000 },
  { month: 'Nov', projected: 410000, actual: null, budget: 415000 },
  { month: 'Dec', projected: 380000, actual: null, budget: 415000 }
];

const sampleAlerts: BudgetAlert[] = [
  {
    id: 'ALT-001',
    type: 'critical',
    category: 'Marketing & Advertising',
    message: 'Budget exceeded by 4%',
    threshold: 100,
    currentUsage: 104,
    date: '2025-01-28'
  },
  {
    id: 'ALT-002',
    type: 'warning',
    category: 'Technology & Software',
    message: 'Approaching budget limit (94.7% used)',
    threshold: 90,
    currentUsage: 94.7,
    date: '2025-01-27'
  },
  {
    id: 'ALT-003',
    type: 'warning',
    category: 'Professional Services',
    message: 'High utilization rate (95% used)',
    threshold: 90,
    currentUsage: 95,
    date: '2025-01-26'
  },
  {
    id: 'ALT-004',
    type: 'info',
    category: 'Travel & Entertainment',
    message: 'Under-utilized budget (55% spent)',
    threshold: 70,
    currentUsage: 55,
    date: '2025-01-25'
  }
];

const sampleMetrics: BudgetMetrics = {
  totalBudget: 4980000,
  totalSpent: 3715000,
  totalCommitted: 692500,
  remaining: 572500,
  utilizationRate: 88.5,
  projectedOverrun: 45000,
  savingsOpportunity: 127500,
  activeBudgets: 6
};

export default function BudgetPlanningPage(): React.JSX.Element {
  const [categories, setCategories] = useState<BudgetCategory[]>(sampleCategories);
  const [periods, setPeriods] = useState<BudgetPeriod[]>(samplePeriods);
  const [forecasts, setForecasts] = useState<BudgetForecast[]>(sampleForecasts);
  const [alerts, setAlerts] = useState<BudgetAlert[]>(sampleAlerts);
  const [metrics, setMetrics] = useState<BudgetMetrics>(sampleMetrics);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'forecasting' | 'alerts'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('PRD-001');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: BudgetCategory['status']) => {
    switch (status) {
      case 'on-track': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'over-budget': return '#ef4444';
      case 'under-utilized': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getAlertIcon = (type: BudgetAlert['type']) => {
    switch (type) {
      case 'critical': return <XCircle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'info': return <Activity size={16} />;
      default: return null;
    }
  };

  const maxForecast = Math.max(...forecasts.map(f => Math.max(f.projected, f.actual || 0, f.budget)));

  return (
    <div className="budget-planning">
      {/* Header */}
      <div className="bdg__header">
        <div className="bdg__title-section">
          <div className="bdg__icon">
            <Calculator size={28} />
          </div>
          <div>
            <h1>Budget Planning</h1>
            <p>Allocate, track, and optimize organizational budgets</p>
          </div>
        </div>
        <div className="header-actions">
          <select 
            className="period-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {periods.map(period => (
              <option key={period.id} value={period.id}>{period.name}</option>
            ))}
          </select>
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Budget
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="budget-summary">
        <div className="summary-card total">
          <Wallet className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.totalBudget)}</span>
            <span className="summary-label">Total Budget</span>
          </div>
        </div>
        <div className="summary-card spent">
          <CreditCard className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.totalSpent)}</span>
            <span className="summary-label">Total Spent</span>
          </div>
        </div>
        <div className="summary-card committed">
          <Clock className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.totalCommitted)}</span>
            <span className="summary-label">Committed</span>
          </div>
        </div>
        <div className="summary-card remaining">
          <DollarSign className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(metrics.remaining)}</span>
            <span className="summary-label">Remaining</span>
          </div>
        </div>
        <div className="summary-card utilization">
          <PieChart className="summary-icon" size={24} />
          <div className="summary-info">
            <span className="summary-value">{metrics.utilizationRate}%</span>
            <span className="summary-label">Utilization</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bdg__tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <PieChart size={16} />
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Layers size={16} />
          Categories
          <span className="tab-badge">{categories.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'forecasting' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecasting')}
        >
          <TrendingUp size={16} />
          Forecasting
        </button>
        <button
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <AlertTriangle size={16} />
          Alerts
          <span className="tab-badge alert">{alerts.filter(a => a.type !== 'info').length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="bdg__content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              {/* Budget Distribution */}
              <div className="overview-card distribution">
                <h3>Budget Distribution</h3>
                <div className="distribution-chart">
                  {categories.map((cat, index) => {
                    const percentage = (cat.allocated / metrics.totalBudget) * 100;
                    return (
                      <div 
                        key={cat.id}
                        className="distribution-segment"
                        style={{ 
                          width: `${percentage}%`,
                          background: cat.color
                        }}
                        title={`${cat.name}: ${formatCurrency(cat.allocated)} (${percentage.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>
                <div className="distribution-legend">
                  {categories.map(cat => (
                    <div key={cat.id} className="legend-item">
                      <span className="legend-color" style={{ background: cat.color }} />
                      <span className="legend-name">{cat.name}</span>
                      <span className="legend-value">{formatCurrency(cat.allocated)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spending Overview */}
              <div className="overview-card spending">
                <h3>Spending Overview</h3>
                <div className="spending-visual">
                  <div className="spending-ring">
                    <svg viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="var(--bdg-border)"
                        strokeWidth="12"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="var(--bdg-success)"
                        strokeWidth="12"
                        strokeDasharray={`${(metrics.totalSpent / metrics.totalBudget) * 251.2} 251.2`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="var(--bdg-warning)"
                        strokeWidth="12"
                        strokeDasharray={`${(metrics.totalCommitted / metrics.totalBudget) * 251.2} 251.2`}
                        strokeDashoffset={`${-(metrics.totalSpent / metrics.totalBudget) * 251.2}`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="ring-center">
                      <span className="ring-percent">{((metrics.totalSpent + metrics.totalCommitted) / metrics.totalBudget * 100).toFixed(1)}%</span>
                      <span className="ring-label">Used</span>
                    </div>
                  </div>
                  <div className="spending-legend">
                    <div className="legend-row">
                      <span className="dot spent" />
                      <span className="label">Spent</span>
                      <span className="value">{formatCurrency(metrics.totalSpent)}</span>
                    </div>
                    <div className="legend-row">
                      <span className="dot committed" />
                      <span className="label">Committed</span>
                      <span className="value">{formatCurrency(metrics.totalCommitted)}</span>
                    </div>
                    <div className="legend-row">
                      <span className="dot remaining" />
                      <span className="label">Available</span>
                      <span className="value">{formatCurrency(metrics.remaining)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Categories by Spending */}
              <div className="overview-card top-spending">
                <h3>Top Categories by Spending</h3>
                <div className="top-categories">
                  {[...categories]
                    .sort((a, b) => b.spent - a.spent)
                    .slice(0, 5)
                    .map((cat, index) => (
                      <div key={cat.id} className="top-category-item">
                        <span className="rank">{index + 1}</span>
                        <div 
                          className="cat-icon"
                          style={{ background: `${cat.color}20`, color: cat.color }}
                        >
                          {categoryIcons[cat.icon]}
                        </div>
                        <div className="cat-info">
                          <span className="cat-name">{cat.name}</span>
                          <div className="cat-bar-container">
                            <div 
                              className="cat-bar"
                              style={{ 
                                width: `${cat.percentUsed}%`,
                                background: cat.color
                              }}
                            />
                          </div>
                        </div>
                        <div className="cat-amounts">
                          <span className="spent">{formatCurrency(cat.spent)}</span>
                          <span className="allocated">of {formatCurrency(cat.allocated)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="overview-card recent-alerts">
                <div className="card-header">
                  <h3>Recent Alerts</h3>
                  <button className="btn-link" onClick={() => setActiveTab('alerts')}>
                    View All <ChevronRight size={14} />
                  </button>
                </div>
                <div className="alerts-list">
                  {alerts.slice(0, 4).map(alert => (
                    <div key={alert.id} className={`alert-item ${alert.type}`}>
                      <div className="alert-icon">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="alert-content">
                        <span className="alert-category">{alert.category}</span>
                        <span className="alert-message">{alert.message}</span>
                      </div>
                      <span className="alert-date">{formatDate(alert.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="categories-tab">
            <div className="categories-header">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search categories..." />
              </div>
              <button className="btn-primary">
                <Plus size={16} />
                Add Category
              </button>
            </div>

            <div className="categories-layout">
              <div className="categories-list">
                {categories.map(category => (
                  <div 
                    key={category.id}
                    className={`category-card ${selectedCategory?.id === category.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div className="category-header">
                      <div 
                        className="category-icon"
                        style={{ background: `${category.color}20`, color: category.color }}
                      >
                        {categoryIcons[category.icon]}
                      </div>
                      <div className="category-info">
                        <h4>{category.name}</h4>
                        <span className="category-dept">{category.department}</span>
                      </div>
                      <span 
                        className="category-status"
                        style={{ 
                          background: `${getStatusColor(category.status)}20`,
                          color: getStatusColor(category.status)
                        }}
                      >
                        {category.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="category-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-spent"
                          style={{ 
                            width: `${Math.min((category.spent / category.allocated) * 100, 100)}%`,
                            background: category.color
                          }}
                        />
                        <div 
                          className="progress-committed"
                          style={{ 
                            width: `${Math.min((category.committed / category.allocated) * 100, 100 - (category.spent / category.allocated) * 100)}%`,
                            background: `${category.color}60`,
                            left: `${(category.spent / category.allocated) * 100}%`
                          }}
                        />
                      </div>
                      <div className="progress-labels">
                        <span>{category.percentUsed}% used</span>
                        <span>{formatCurrency(category.remaining)} remaining</span>
                      </div>
                    </div>
                    <div className="category-amounts">
                      <div className="amount-item">
                        <span className="amount-label">Allocated</span>
                        <span className="amount-value">{formatCurrency(category.allocated)}</span>
                      </div>
                      <div className="amount-item">
                        <span className="amount-label">Spent</span>
                        <span className="amount-value">{formatCurrency(category.spent)}</span>
                      </div>
                      <div className="amount-item">
                        <span className="amount-label">Committed</span>
                        <span className="amount-value">{formatCurrency(category.committed)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedCategory && (
                <div className="category-detail-panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <div 
                        className="category-icon"
                        style={{ background: `${selectedCategory.color}20`, color: selectedCategory.color }}
                      >
                        {categoryIcons[selectedCategory.icon]}
                      </div>
                      <h3>{selectedCategory.name}</h3>
                    </div>
                    <button 
                      className="btn-icon"
                      onClick={() => setSelectedCategory(null)}
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                  <div className="panel-content">
                    <div className="detail-stats">
                      <div className="stat-card">
                        <span className="stat-label">Allocated</span>
                        <span className="stat-value">{formatCurrency(selectedCategory.allocated)}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Spent</span>
                        <span className="stat-value spent">{formatCurrency(selectedCategory.spent)}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Committed</span>
                        <span className="stat-value committed">{formatCurrency(selectedCategory.committed)}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Remaining</span>
                        <span className={`stat-value ${selectedCategory.remaining < 0 ? 'negative' : ''}`}>
                          {formatCurrency(selectedCategory.remaining)}
                        </span>
                      </div>
                    </div>

                    {selectedCategory.subcategories && (
                      <div className="subcategories">
                        <h4>Subcategories</h4>
                        <div className="subcategories-list">
                          {selectedCategory.subcategories.map(sub => (
                            <div key={sub.id} className="subcategory-item">
                              <div className="sub-info">
                                <span className="sub-name">{sub.name}</span>
                                <div className="sub-progress">
                                  <div 
                                    className="sub-bar"
                                    style={{ 
                                      width: `${(sub.spent / sub.allocated) * 100}%`,
                                      background: selectedCategory.color
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="sub-amounts">
                                <span className="sub-spent">{formatCurrency(sub.spent)}</span>
                                <span className="sub-allocated">/ {formatCurrency(sub.allocated)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="detail-info">
                      <div className="info-row">
                        <span className="info-label">Department</span>
                        <span className="info-value">{selectedCategory.department}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Status</span>
                        <span 
                          className="info-value status"
                          style={{ color: getStatusColor(selectedCategory.status) }}
                        >
                          {selectedCategory.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Utilization</span>
                        <span className="info-value">{selectedCategory.percentUsed}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="panel-actions">
                    <button className="btn-outline">
                      <Edit size={16} />
                      Edit Budget
                    </button>
                    <button className="btn-primary">
                      <BarChart2 size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Forecasting Tab */}
        {activeTab === 'forecasting' && (
          <div className="forecasting-tab">
            <div className="forecasting-header">
              <h3>Budget vs Actual vs Projected</h3>
              <div className="forecast-legend">
                <span className="legend-item">
                  <span className="dot budget" />
                  Budget
                </span>
                <span className="legend-item">
                  <span className="dot actual" />
                  Actual
                </span>
                <span className="legend-item">
                  <span className="dot projected" />
                  Projected
                </span>
              </div>
            </div>

            <div className="forecast-chart">
              <div className="chart-bars">
                {forecasts.map((forecast, index) => (
                  <div key={forecast.month} className="chart-bar-group">
                    <div className="bar-container">
                      <div 
                        className="bar budget"
                        style={{ height: `${(forecast.budget / maxForecast) * 180}px` }}
                      />
                      {forecast.actual != null && (
                        <div 
                          className="bar actual"
                          style={{ height: `${(forecast.actual / maxForecast) * 180}px` }}
                        />
                      )}
                      <div 
                        className="bar projected"
                        style={{ height: `${(forecast.projected / maxForecast) * 180}px` }}
                      />
                    </div>
                    <span className="bar-label">{forecast.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="forecast-insights">
              <div className="insight-card">
                <div className="insight-icon positive">
                  <TrendingDown size={20} />
                </div>
                <div className="insight-content">
                  <span className="insight-title">Potential Savings</span>
                  <span className="insight-value">{formatCurrency(metrics.savingsOpportunity)}</span>
                  <span className="insight-desc">Based on current spending trends</span>
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-icon warning">
                  <AlertTriangle size={20} />
                </div>
                <div className="insight-content">
                  <span className="insight-title">Projected Overrun</span>
                  <span className="insight-value">{formatCurrency(metrics.projectedOverrun)}</span>
                  <span className="insight-desc">Marketing exceeding allocation</span>
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-icon info">
                  <Activity size={20} />
                </div>
                <div className="insight-content">
                  <span className="insight-title">Year-End Projection</span>
                  <span className="insight-value">{formatCurrency(5025000)}</span>
                  <span className="insight-desc">Expected total spending</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="alerts-tab">
            <div className="alerts-header">
              <h3>Budget Alerts</h3>
              <div className="alert-filters">
                <button className="filter-btn active">All</button>
                <button className="filter-btn">Critical</button>
                <button className="filter-btn">Warning</button>
                <button className="filter-btn">Info</button>
              </div>
            </div>

            <div className="alerts-table">
              <div className="table-header">
                <span>Alert</span>
                <span>Category</span>
                <span>Threshold</span>
                <span>Current</span>
                <span>Date</span>
                <span>Actions</span>
              </div>
              {alerts.map(alert => (
                <div key={alert.id} className={`table-row ${alert.type}`}>
                  <div className="alert-cell">
                    <div className={`alert-icon ${alert.type}`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <span className="alert-message">{alert.message}</span>
                  </div>
                  <div className="category-cell">{alert.category}</div>
                  <div className="threshold-cell">{alert.threshold}%</div>
                  <div className={`current-cell ${alert.currentUsage > 100 ? 'over' : ''}`}>
                    {alert.currentUsage}%
                  </div>
                  <div className="date-cell">{formatDate(alert.date)}</div>
                  <div className="actions-cell">
                    <button className="btn-outline small">
                      <Eye size={14} />
                      Review
                    </button>
                    <button className="btn-icon small">
                      <MoreHorizontal size={14} />
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
