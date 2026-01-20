'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  RefreshCcw,
  Search,
  Filter,
  Calendar,
  DollarSign,
  PieChart,
  LineChart,
  Activity,
  Target,
  ChevronRight,
  MoreHorizontal,
  Plus,
  X,
  Eye,
  Printer,
  Share2,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  FileText,
  Settings,
  Bookmark
} from 'lucide-react';
import './reports.css';

interface ReportTemplate {
  id: string;
  name: string;
  type: 'income_statement' | 'balance_sheet' | 'cash_flow' | 'custom';
  description: string;
  lastGenerated?: string;
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  favorite: boolean;
}

interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  type: string;
  period: string;
  generatedAt: string;
  generatedBy: string;
  size: string;
  status: 'completed' | 'processing' | 'failed';
}

interface FinancialSummary {
  revenue: number;
  expenses: number;
  netIncome: number;
  assets: number;
  liabilities: number;
  equity: number;
  cashFlow: number;
  revenueGrowth: number;
  profitMargin: number;
}

interface LineItem {
  label: string;
  amount: number;
  change?: number;
  breakdown?: LineItem[];
}

interface IncomeStatement {
  period: string;
  revenue: LineItem[];
  costOfGoodsSold: LineItem[];
  operatingExpenses: LineItem[];
  otherIncome: LineItem[];
  taxes: LineItem[];
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
}

const sampleTemplates: ReportTemplate[] = [
  {
    id: 'TPL-001',
    name: 'Income Statement',
    type: 'income_statement',
    description: 'Comprehensive profit and loss statement showing revenue, expenses, and net income',
    lastGenerated: '2025-01-31',
    schedule: 'monthly',
    favorite: true
  },
  {
    id: 'TPL-002',
    name: 'Balance Sheet',
    type: 'balance_sheet',
    description: 'Snapshot of assets, liabilities, and equity at a specific point in time',
    lastGenerated: '2025-01-31',
    schedule: 'monthly',
    favorite: true
  },
  {
    id: 'TPL-003',
    name: 'Cash Flow Statement',
    type: 'cash_flow',
    description: 'Analysis of cash inflows and outflows from operating, investing, and financing activities',
    lastGenerated: '2025-01-31',
    schedule: 'monthly',
    favorite: true
  },
  {
    id: 'TPL-004',
    name: 'Quarterly Financial Review',
    type: 'custom',
    description: 'Comprehensive quarterly analysis with KPIs and trend analysis',
    lastGenerated: '2024-12-31',
    schedule: 'quarterly',
    favorite: false
  },
  {
    id: 'TPL-005',
    name: 'Department Budget vs Actual',
    type: 'custom',
    description: 'Comparison of budgeted vs actual spending by department',
    lastGenerated: '2025-01-31',
    schedule: 'monthly',
    favorite: false
  },
  {
    id: 'TPL-006',
    name: 'Revenue by Product/Service',
    type: 'custom',
    description: 'Revenue breakdown by product lines and service offerings',
    lastGenerated: '2025-01-31',
    schedule: 'monthly',
    favorite: false
  }
];

const sampleReports: GeneratedReport[] = [
  {
    id: 'RPT-001',
    templateId: 'TPL-001',
    name: 'Income Statement - January 2025',
    type: 'Income Statement',
    period: 'January 2025',
    generatedAt: '2025-02-01T09:00:00',
    generatedBy: 'System (Auto)',
    size: '245 KB',
    status: 'completed'
  },
  {
    id: 'RPT-002',
    templateId: 'TPL-002',
    name: 'Balance Sheet - January 2025',
    type: 'Balance Sheet',
    period: 'As of Jan 31, 2025',
    generatedAt: '2025-02-01T09:05:00',
    generatedBy: 'System (Auto)',
    size: '312 KB',
    status: 'completed'
  },
  {
    id: 'RPT-003',
    templateId: 'TPL-003',
    name: 'Cash Flow Statement - January 2025',
    type: 'Cash Flow',
    period: 'January 2025',
    generatedAt: '2025-02-01T09:10:00',
    generatedBy: 'System (Auto)',
    size: '198 KB',
    status: 'completed'
  },
  {
    id: 'RPT-004',
    templateId: 'TPL-004',
    name: 'Q4 2024 Financial Review',
    type: 'Quarterly Review',
    period: 'Q4 2024',
    generatedAt: '2025-01-15T14:30:00',
    generatedBy: 'Maria Garcia',
    size: '1.2 MB',
    status: 'completed'
  },
  {
    id: 'RPT-005',
    templateId: 'TPL-001',
    name: 'Income Statement - February 2025',
    type: 'Income Statement',
    period: 'February 2025',
    generatedAt: '2025-02-05T10:00:00',
    generatedBy: 'System (Auto)',
    size: '0 KB',
    status: 'processing'
  }
];

const financialSummary: FinancialSummary = {
  revenue: 2450000,
  expenses: 1890000,
  netIncome: 560000,
  assets: 8750000,
  liabilities: 3200000,
  equity: 5550000,
  cashFlow: 425000,
  revenueGrowth: 15.3,
  profitMargin: 22.9
};

const incomeStatementData: IncomeStatement = {
  period: 'January 2025',
  revenue: [
    { label: 'Software Licenses', amount: 1250000, change: 12.5 },
    { label: 'SaaS Subscriptions', amount: 850000, change: 18.2 },
    { label: 'Professional Services', amount: 280000, change: 5.8 },
    { label: 'Support & Maintenance', amount: 70000, change: -2.1 }
  ],
  costOfGoodsSold: [
    { label: 'Infrastructure Costs', amount: 185000, change: 8.5 },
    { label: 'Third-Party Software', amount: 95000, change: 3.2 },
    { label: 'Direct Labor', amount: 245000, change: 5.0 }
  ],
  operatingExpenses: [
    { label: 'Salaries & Benefits', amount: 680000, change: 4.5 },
    { label: 'Marketing & Sales', amount: 245000, change: 12.3 },
    { label: 'Research & Development', amount: 185000, change: 8.7 },
    { label: 'General & Administrative', amount: 125000, change: 2.1 },
    { label: 'Facilities & Rent', amount: 85000, change: 0 },
    { label: 'Depreciation', amount: 45000, change: 0 }
  ],
  otherIncome: [
    { label: 'Interest Income', amount: 12000, change: 25.0 },
    { label: 'Investment Gains', amount: 8500, change: -5.2 }
  ],
  taxes: [
    { label: 'Income Tax Expense', amount: 140000, change: 18.5 }
  ],
  grossProfit: 1925000,
  operatingIncome: 560000,
  netIncome: 440500
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
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'income_statement':
      return <TrendingUp size={18} />;
    case 'balance_sheet':
      return <Layers size={18} />;
    case 'cash_flow':
      return <Activity size={18} />;
    default:
      return <FileSpreadsheet size={18} />;
  }
};

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'reports' | 'builder'>('overview');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
  const [templates, setTemplates] = useState<ReportTemplate[]>(sampleTemplates);
  const [reports, setReports] = useState<GeneratedReport[]>(sampleReports);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'detail'>('preview');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const favoriteTemplates = templates.filter(t => t.favorite);

  const renderOverviewTab = () => {
    const totalRevenue = incomeStatementData.revenue.reduce((s, r) => s + r.amount, 0);

    return (
      <div className="overview-grid">
        <div className="overview-card financial-highlights">
          <h3>Financial Highlights</h3>
          <div className="highlights-grid">
            <div className="highlight-item revenue">
              <div className="highlight-icon">
                <DollarSign size={20} />
              </div>
              <div className="highlight-info">
                <span className="highlight-value">{formatCurrency(financialSummary.revenue)}</span>
                <span className="highlight-label">Revenue</span>
              </div>
              <div className="highlight-trend positive">
                <TrendingUp size={14} />
                <span>{financialSummary.revenueGrowth}%</span>
              </div>
            </div>
            <div className="highlight-item expenses">
              <div className="highlight-icon">
                <CreditCard size={20} />
              </div>
              <div className="highlight-info">
                <span className="highlight-value">{formatCurrency(financialSummary.expenses)}</span>
                <span className="highlight-label">Expenses</span>
              </div>
              <div className="highlight-trend negative">
                <TrendingUp size={14} />
                <span>8.2%</span>
              </div>
            </div>
            <div className="highlight-item net-income">
              <div className="highlight-icon">
                <Target size={20} />
              </div>
              <div className="highlight-info">
                <span className="highlight-value">{formatCurrency(financialSummary.netIncome)}</span>
                <span className="highlight-label">Net Income</span>
              </div>
              <div className="highlight-trend positive">
                <TrendingUp size={14} />
                <span>24.5%</span>
              </div>
            </div>
            <div className="highlight-item margin">
              <div className="highlight-icon">
                <PieChart size={20} />
              </div>
              <div className="highlight-info">
                <span className="highlight-value">{financialSummary.profitMargin}%</span>
                <span className="highlight-label">Profit Margin</span>
              </div>
              <div className="highlight-trend positive">
                <TrendingUp size={14} />
                <span>2.3pp</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-card revenue-breakdown">
          <h3>Revenue Breakdown</h3>
          <div className="revenue-chart">
            <div className="revenue-donut">
              <svg viewBox="0 0 100 100">
                {incomeStatementData.revenue.map((item, index) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                  const percent = (item.amount / totalRevenue) * 100;
                  const previousPercent = incomeStatementData.revenue
                    .slice(0, index)
                    .reduce((s, r) => s + (r.amount / totalRevenue) * 100, 0);
                  const startAngle = previousPercent * 3.6;
                  const endAngle = (previousPercent + percent) * 3.6;
                  const largeArcFlag = percent > 50 ? 1 : 0;
                  
                  const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                  
                  return (
                    <path
                      key={index}
                      d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={colors[index]}
                      opacity={0.85}
                    />
                  );
                })}
                <circle cx="50" cy="50" r="24" fill="#12121a" />
              </svg>
              <div className="donut-center">
                <span className="total-value">{formatCurrency(totalRevenue)}</span>
                <span className="total-label">Total</span>
              </div>
            </div>
            <div className="revenue-legend">
              {incomeStatementData.revenue.map((item, index) => {
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                return (
                  <div key={index} className="legend-item">
                    <span className="legend-color" style={{ background: colors[index] }} />
                    <span className="legend-label">{item.label}</span>
                    <span className="legend-value">{formatCurrency(item.amount)}</span>
                    <span className={`legend-change ${item.change && item.change >= 0 ? 'positive' : 'negative'}`}>
                      {item.change && item.change >= 0 ? '+' : ''}{item.change}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="overview-card balance-overview">
          <h3>Balance Sheet Summary</h3>
          <div className="balance-bars">
            <div className="balance-item">
              <div className="balance-header">
                <span className="balance-label">Assets</span>
                <span className="balance-value">{formatCurrency(financialSummary.assets)}</span>
              </div>
              <div className="balance-bar">
                <div className="bar-fill assets" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="balance-item">
              <div className="balance-header">
                <span className="balance-label">Liabilities</span>
                <span className="balance-value">{formatCurrency(financialSummary.liabilities)}</span>
              </div>
              <div className="balance-bar">
                <div 
                  className="bar-fill liabilities" 
                  style={{ width: `${(financialSummary.liabilities / financialSummary.assets) * 100}%` }} 
                />
              </div>
            </div>
            <div className="balance-item">
              <div className="balance-header">
                <span className="balance-label">Equity</span>
                <span className="balance-value">{formatCurrency(financialSummary.equity)}</span>
              </div>
              <div className="balance-bar">
                <div 
                  className="bar-fill equity" 
                  style={{ width: `${(financialSummary.equity / financialSummary.assets) * 100}%` }} 
                />
              </div>
            </div>
          </div>
          <div className="balance-equation">
            <span>Assets = Liabilities + Equity</span>
            <CheckCircle size={16} />
          </div>
        </div>

        <div className="overview-card quick-reports">
          <h3>Quick Reports</h3>
          <div className="quick-report-list">
            {favoriteTemplates.map((template) => (
              <div 
                key={template.id} 
                className="quick-report-item"
                onClick={() => {
                  setSelectedTemplate(template);
                  setActiveTab('templates');
                }}
              >
                <div className={`report-icon ${template.type}`}>
                  {getTypeIcon(template.type)}
                </div>
                <div className="report-info">
                  <span className="report-name">{template.name}</span>
                  <span className="report-schedule">{template.schedule}</span>
                </div>
                <ChevronRight size={16} />
              </div>
            ))}
          </div>
          <button className="view-all-btn" onClick={() => setActiveTab('templates')}>
            View All Templates
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="overview-card recent-reports">
          <h3>Recent Reports</h3>
          <div className="recent-list">
            {reports.slice(0, 4).map((report) => (
              <div key={report.id} className="recent-item">
                <div className="recent-icon">
                  <FileSpreadsheet size={16} />
                </div>
                <div className="recent-info">
                  <span className="recent-name">{report.name}</span>
                  <span className="recent-date">{formatDateTime(report.generatedAt)}</span>
                </div>
                <div className={`recent-status ${report.status}`}>
                  {report.status === 'completed' && <CheckCircle size={14} />}
                  {report.status === 'processing' && <Clock size={14} />}
                  {report.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card cash-flow-summary">
          <h3>Cash Flow Summary</h3>
          <div className="cash-flow-visual">
            <div className="cash-flow-item inflow">
              <ArrowDownRight size={20} />
              <div className="cf-info">
                <span className="cf-label">Operating Cash Flow</span>
                <span className="cf-value">{formatCurrency(525000)}</span>
              </div>
            </div>
            <div className="cash-flow-item outflow">
              <ArrowUpRight size={20} />
              <div className="cf-info">
                <span className="cf-label">Investing Activities</span>
                <span className="cf-value">-{formatCurrency(85000)}</span>
              </div>
            </div>
            <div className="cash-flow-item outflow">
              <ArrowUpRight size={20} />
              <div className="cf-info">
                <span className="cf-label">Financing Activities</span>
                <span className="cf-value">-{formatCurrency(15000)}</span>
              </div>
            </div>
            <div className="cash-flow-total">
              <span className="total-label">Net Cash Change</span>
              <span className="total-value positive">{formatCurrency(financialSummary.cashFlow)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTemplatesTab = () => (
    <div className="templates-content">
      <div className="templates-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search templates..." />
          </div>
          <select className="filter-select">
            <option value="all">All Types</option>
            <option value="income_statement">Income Statement</option>
            <option value="balance_sheet">Balance Sheet</option>
            <option value="cash_flow">Cash Flow</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary small">
            <Plus size={16} />
            New Template
          </button>
        </div>
      </div>

      <div className="templates-grid">
        {templates.map((template) => (
          <div 
            key={template.id} 
            className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
            onClick={() => setSelectedTemplate(template)}
          >
            <div className="template-header">
              <div className={`template-icon ${template.type}`}>
                {getTypeIcon(template.type)}
              </div>
              <button 
                className={`favorite-btn ${template.favorite ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setTemplates(templates.map(t => 
                    t.id === template.id ? { ...t, favorite: !t.favorite } : t
                  ));
                }}
              >
                <Bookmark size={16} />
              </button>
            </div>
            <div className="template-content">
              <h4>{template.name}</h4>
              <p>{template.description}</p>
            </div>
            <div className="template-footer">
              <div className="template-meta">
                <span className="meta-item">
                  <Calendar size={12} />
                  {template.lastGenerated ? formatDate(template.lastGenerated) : 'Never'}
                </span>
                {template.schedule && (
                  <span className="meta-item schedule">
                    <Clock size={12} />
                    {template.schedule}
                  </span>
                )}
              </div>
              <div className="template-actions">
                <button className="btn-outline small">
                  <Eye size={14} />
                  Preview
                </button>
                <button className="btn-primary small">
                  Generate
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="reports-content">
      <div className="reports-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search reports..." />
          </div>
          <select className="filter-select">
            <option value="all">All Types</option>
            <option value="income_statement">Income Statement</option>
            <option value="balance_sheet">Balance Sheet</option>
            <option value="cash_flow">Cash Flow</option>
          </select>
          <select className="filter-select">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline small">
            <Download size={16} />
            Bulk Export
          </button>
        </div>
      </div>

      <div className="reports-table">
        <div className="table-header">
          <span>Report Name</span>
          <span>Type</span>
          <span>Period</span>
          <span>Generated</span>
          <span>By</span>
          <span>Size</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {reports.map((report) => (
          <div 
            key={report.id} 
            className={`table-row ${selectedReport?.id === report.id ? 'selected' : ''}`}
            onClick={() => setSelectedReport(report)}
          >
            <div className="name-cell">
              <FileSpreadsheet size={16} />
              <span>{report.name}</span>
            </div>
            <div className="type-cell">{report.type}</div>
            <div className="period-cell">{report.period}</div>
            <div className="date-cell">{formatDateTime(report.generatedAt)}</div>
            <div className="by-cell">{report.generatedBy}</div>
            <div className="size-cell">{report.size}</div>
            <div className={`status-cell ${report.status}`}>
              {report.status === 'completed' && <CheckCircle size={14} />}
              {report.status === 'processing' && <Clock size={14} className="spinning" />}
              {report.status === 'failed' && <AlertCircle size={14} />}
              {report.status}
            </div>
            <div className="actions-cell">
              <button className="btn-icon small" title="View">
                <Eye size={14} />
              </button>
              <button className="btn-icon small" title="Download">
                <Download size={14} />
              </button>
              <button className="btn-icon small" title="Print">
                <Printer size={14} />
              </button>
              <button className="btn-icon small" title="Share">
                <Share2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBuilderTab = () => (
    <div className="builder-content">
      <div className="builder-header">
        <h3>Report Builder</h3>
        <p>Create custom financial reports with drag-and-drop simplicity</p>
      </div>

      <div className="builder-layout">
        <div className="builder-sidebar">
          <div className="sidebar-section">
            <h4>Data Sources</h4>
            <div className="source-list">
              <div className="source-item" draggable>
                <DollarSign size={14} />
                <span>Revenue</span>
              </div>
              <div className="source-item" draggable>
                <CreditCard size={14} />
                <span>Expenses</span>
              </div>
              <div className="source-item" draggable>
                <Wallet size={14} />
                <span>Assets</span>
              </div>
              <div className="source-item" draggable>
                <Building2 size={14} />
                <span>Liabilities</span>
              </div>
              <div className="source-item" draggable>
                <Activity size={14} />
                <span>Cash Flow</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Visualizations</h4>
            <div className="viz-list">
              <div className="viz-item" draggable>
                <BarChart3 size={14} />
                <span>Bar Chart</span>
              </div>
              <div className="viz-item" draggable>
                <LineChart size={14} />
                <span>Line Chart</span>
              </div>
              <div className="viz-item" draggable>
                <PieChart size={14} />
                <span>Pie Chart</span>
              </div>
              <div className="viz-item" draggable>
                <FileText size={14} />
                <span>Table</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Time Period</h4>
            <select className="period-select">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        <div className="builder-canvas">
          <div className="canvas-placeholder">
            <Layers size={48} />
            <h4>Drag elements here to build your report</h4>
            <p>Add data sources and visualizations from the sidebar</p>
          </div>
        </div>

        <div className="builder-properties">
          <h4>Properties</h4>
          <div className="properties-empty">
            <Settings size={24} />
            <p>Select an element to edit its properties</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="financial-reports">
      <div className="rpt__header">
        <div className="rpt__title-section">
          <div className="rpt__icon">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1>Financial Reports</h1>
            <p>Generate and analyze comprehensive financial statements</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCcw size={16} className={isRefreshing ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Report
          </button>
        </div>
      </div>

      <div className="reports-summary">
        <div className="summary-card revenue">
          <div className="summary-icon">
            <DollarSign size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(financialSummary.revenue)}</span>
            <span className="summary-label">Total Revenue</span>
          </div>
          <div className="summary-trend positive">
            <TrendingUp size={14} />
            {financialSummary.revenueGrowth}%
          </div>
        </div>
        <div className="summary-card net-income">
          <div className="summary-icon">
            <Target size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(financialSummary.netIncome)}</span>
            <span className="summary-label">Net Income</span>
          </div>
          <div className="summary-trend positive">
            <TrendingUp size={14} />
            24.5%
          </div>
        </div>
        <div className="summary-card assets">
          <div className="summary-icon">
            <Wallet size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{formatCurrency(financialSummary.assets)}</span>
            <span className="summary-label">Total Assets</span>
          </div>
        </div>
        <div className="summary-card margin">
          <div className="summary-icon">
            <PieChart size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{financialSummary.profitMargin}%</span>
            <span className="summary-label">Profit Margin</span>
          </div>
        </div>
        <div className="summary-card reports-count">
          <div className="summary-icon">
            <FileSpreadsheet size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{reports.length}</span>
            <span className="summary-label">Reports Generated</span>
          </div>
        </div>
      </div>

      <div className="rpt__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <Layers size={16} />
          Templates
          <span className="tab-badge">{templates.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileSpreadsheet size={16} />
          Generated Reports
          <span className="tab-badge">{reports.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          <Settings size={16} />
          Report Builder
        </button>
      </div>

      <div className="rpt__content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'reports' && renderReportsTab()}
        {activeTab === 'builder' && renderBuilderTab()}
      </div>
    </div>
  );
}
