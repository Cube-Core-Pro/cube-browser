'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Plus,
  Calendar,
  Clock,
  BarChart2,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Database,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit,
  Copy,
  Eye,
  ChevronRight,
  Filter,
  RefreshCw,
  Mail,
  FileSpreadsheet,
  File,
  CheckCircle,
  XCircle,
  Loader,
  Zap,
  Globe,
  Shield
} from 'lucide-react';
import './reports.css';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'analytics' | 'financial' | 'security' | 'compliance' | 'usage' | 'custom';
  icon: string;
  fields: string[];
  estimatedTime: string;
  popular: boolean;
}

interface GeneratedReport {
  id: string;
  name: string;
  template: string;
  status: 'completed' | 'generating' | 'failed' | 'scheduled';
  createdAt: string;
  completedAt?: string;
  size?: string;
  format: 'pdf' | 'csv' | 'xlsx' | 'json';
  schedule?: {
    frequency: string;
    nextRun: string;
  };
}

interface ReportSchedule {
  id: string;
  name: string;
  template: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextRun: string;
  recipients: string[];
  format: 'pdf' | 'csv' | 'xlsx';
  enabled: boolean;
}

export default function ReportsGeneratorPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'generated' | 'scheduled' | 'custom'>('templates');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [generating, setGenerating] = useState<string | null>(null);

  const templates: ReportTemplate[] = [
    {
      id: 't1',
      name: 'Executive Dashboard',
      description: 'High-level overview of key business metrics and KPIs',
      category: 'analytics',
      icon: 'BarChart2',
      fields: ['Revenue', 'Users', 'Conversion', 'Growth'],
      estimatedTime: '2-3 min',
      popular: true
    },
    {
      id: 't2',
      name: 'Financial Summary',
      description: 'Detailed breakdown of revenue, costs, and profitability',
      category: 'financial',
      icon: 'DollarSign',
      fields: ['Revenue', 'MRR', 'ARR', 'Churn', 'LTV'],
      estimatedTime: '3-5 min',
      popular: true
    },
    {
      id: 't3',
      name: 'User Analytics',
      description: 'Comprehensive user behavior and engagement analysis',
      category: 'analytics',
      icon: 'Users',
      fields: ['Active Users', 'Sessions', 'Retention', 'Engagement'],
      estimatedTime: '2-4 min',
      popular: true
    },
    {
      id: 't4',
      name: 'Security Audit',
      description: 'Complete security assessment and vulnerability report',
      category: 'security',
      icon: 'Shield',
      fields: ['Threats', 'Vulnerabilities', 'Access Logs', 'Incidents'],
      estimatedTime: '5-7 min',
      popular: false
    },
    {
      id: 't5',
      name: 'Compliance Report',
      description: 'Regulatory compliance status across all frameworks',
      category: 'compliance',
      icon: 'CheckCircle',
      fields: ['SOC 2', 'GDPR', 'HIPAA', 'PCI DSS'],
      estimatedTime: '4-6 min',
      popular: false
    },
    {
      id: 't6',
      name: 'API Usage Report',
      description: 'Detailed API consumption and performance metrics',
      category: 'usage',
      icon: 'Activity',
      fields: ['Requests', 'Latency', 'Errors', 'Rate Limits'],
      estimatedTime: '2-3 min',
      popular: false
    },
    {
      id: 't7',
      name: 'Revenue Breakdown',
      description: 'Detailed analysis of revenue streams and sources',
      category: 'financial',
      icon: 'PieChart',
      fields: ['Subscriptions', 'One-time', 'Add-ons', 'Regions'],
      estimatedTime: '3-4 min',
      popular: false
    },
    {
      id: 't8',
      name: 'Growth Report',
      description: 'Month-over-month growth metrics and projections',
      category: 'analytics',
      icon: 'TrendingUp',
      fields: ['User Growth', 'Revenue Growth', 'Expansion', 'Forecasts'],
      estimatedTime: '3-5 min',
      popular: true
    },
    {
      id: 't9',
      name: 'Storage Usage',
      description: 'Data storage consumption and trends',
      category: 'usage',
      icon: 'Database',
      fields: ['Total Storage', 'By User', 'By Type', 'Growth Rate'],
      estimatedTime: '1-2 min',
      popular: false
    },
    {
      id: 't10',
      name: 'Team Activity',
      description: 'Team member activity and productivity metrics',
      category: 'analytics',
      icon: 'Users',
      fields: ['Active Members', 'Tasks', 'Collaborations', 'Performance'],
      estimatedTime: '2-3 min',
      popular: false
    }
  ];

  const generatedReports: GeneratedReport[] = [
    {
      id: 'r1',
      name: 'Executive Dashboard - January 2026',
      template: 'Executive Dashboard',
      status: 'completed',
      createdAt: '2026-01-29T10:00:00Z',
      completedAt: '2026-01-29T10:03:22Z',
      size: '2.4 MB',
      format: 'pdf'
    },
    {
      id: 'r2',
      name: 'Q4 2025 Financial Summary',
      template: 'Financial Summary',
      status: 'completed',
      createdAt: '2026-01-28T14:30:00Z',
      completedAt: '2026-01-28T14:35:45Z',
      size: '4.1 MB',
      format: 'xlsx'
    },
    {
      id: 'r3',
      name: 'Weekly Security Audit',
      template: 'Security Audit',
      status: 'generating',
      createdAt: '2026-01-29T14:00:00Z',
      format: 'pdf'
    },
    {
      id: 'r4',
      name: 'User Analytics - Week 4',
      template: 'User Analytics',
      status: 'completed',
      createdAt: '2026-01-27T09:00:00Z',
      completedAt: '2026-01-27T09:04:12Z',
      size: '1.8 MB',
      format: 'pdf'
    },
    {
      id: 'r5',
      name: 'API Usage Report - January',
      template: 'API Usage Report',
      status: 'failed',
      createdAt: '2026-01-26T16:00:00Z',
      format: 'csv'
    },
    {
      id: 'r6',
      name: 'Growth Report - December 2025',
      template: 'Growth Report',
      status: 'completed',
      createdAt: '2026-01-15T11:00:00Z',
      completedAt: '2026-01-15T11:05:33Z',
      size: '3.2 MB',
      format: 'pdf'
    }
  ];

  const schedules: ReportSchedule[] = [
    {
      id: 's1',
      name: 'Weekly Executive Summary',
      template: 'Executive Dashboard',
      frequency: 'weekly',
      nextRun: '2026-02-03T09:00:00Z',
      recipients: ['ceo@company.com', 'cfo@company.com'],
      format: 'pdf',
      enabled: true
    },
    {
      id: 's2',
      name: 'Monthly Financial Report',
      template: 'Financial Summary',
      frequency: 'monthly',
      nextRun: '2026-02-01T08:00:00Z',
      recipients: ['finance@company.com', 'cfo@company.com'],
      format: 'xlsx',
      enabled: true
    },
    {
      id: 's3',
      name: 'Daily Security Digest',
      template: 'Security Audit',
      frequency: 'daily',
      nextRun: '2026-01-30T07:00:00Z',
      recipients: ['security@company.com'],
      format: 'pdf',
      enabled: true
    },
    {
      id: 's4',
      name: 'Quarterly Compliance Report',
      template: 'Compliance Report',
      frequency: 'quarterly',
      nextRun: '2026-04-01T09:00:00Z',
      recipients: ['compliance@company.com', 'legal@company.com'],
      format: 'pdf',
      enabled: false
    }
  ];

  const categories = [
    { id: 'all', label: 'All Templates', count: templates.length },
    { id: 'analytics', label: 'Analytics', count: templates.filter(t => t.category === 'analytics').length },
    { id: 'financial', label: 'Financial', count: templates.filter(t => t.category === 'financial').length },
    { id: 'security', label: 'Security', count: templates.filter(t => t.category === 'security').length },
    { id: 'compliance', label: 'Compliance', count: templates.filter(t => t.category === 'compliance').length },
    { id: 'usage', label: 'Usage', count: templates.filter(t => t.category === 'usage').length }
  ];

  const getTemplateIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      BarChart2: <BarChart2 size={24} />,
      DollarSign: <DollarSign size={24} />,
      Users: <Users size={24} />,
      Shield: <Shield size={24} />,
      CheckCircle: <CheckCircle size={24} />,
      Activity: <Activity size={24} />,
      PieChart: <PieChart size={24} />,
      TrendingUp: <TrendingUp size={24} />,
      Database: <Database size={24} />
    };
    return icons[iconName] || <FileText size={24} />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={18} />;
      case 'generating': return <Loader size={18} className="spinning" />;
      case 'failed': return <XCircle size={18} />;
      case 'scheduled': return <Clock size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <File size={16} />;
      case 'csv':
      case 'xlsx': return <FileSpreadsheet size={16} />;
      case 'json': return <FileText size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const handleGenerateReport = (templateId: string) => {
    setGenerating(templateId);
    setTimeout(() => setGenerating(null), 3000);
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="reports-generator">
      <header className="reports-generator__header">
        <div className="reports-generator__title-section">
          <div className="reports-generator__icon">
            <FileText size={28} />
          </div>
          <div>
            <h1>Reports Generator</h1>
            <p>Create, schedule, and download custom reports</p>
          </div>
        </div>
        <div className="reports-generator__actions">
          <button className="reports-generator__custom-btn">
            <Plus size={18} />
            Custom Report
          </button>
        </div>
      </header>

      <nav className="reports-generator__tabs">
        {[
          { id: 'templates', label: 'Templates', icon: <FileText size={18} />, count: templates.length },
          { id: 'generated', label: 'Generated', icon: <Download size={18} />, count: generatedReports.length },
          { id: 'scheduled', label: 'Scheduled', icon: <Calendar size={18} />, count: schedules.length },
          { id: 'custom', label: 'Custom Builder', icon: <Settings size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            className={`reports-generator__tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="reports-generator__content">
        {activeTab === 'templates' && (
          <div className="reports-generator__templates">
            <div className="templates-sidebar">
              <h3>Categories</h3>
              <div className="category-list">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-item ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span>{cat.label}</span>
                    <span className="category-count">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="templates-grid">
              <div className="templates-header">
                <h3>{selectedCategory === 'all' ? 'All Templates' : categories.find(c => c.id === selectedCategory)?.label}</h3>
                <span className="templates-count">{filteredTemplates.length} templates</span>
              </div>
              <div className="templates-list">
                {filteredTemplates.map(template => (
                  <div key={template.id} className={`template-card ${template.popular ? 'popular' : ''}`}>
                    {template.popular && <span className="popular-badge">Popular</span>}
                    <div className="template-icon">
                      {getTemplateIcon(template.icon)}
                    </div>
                    <div className="template-content">
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                      <div className="template-fields">
                        {template.fields.slice(0, 3).map(field => (
                          <span key={field} className="field-tag">{field}</span>
                        ))}
                        {template.fields.length > 3 && (
                          <span className="field-more">+{template.fields.length - 3}</span>
                        )}
                      </div>
                      <div className="template-meta">
                        <span className="template-time">
                          <Clock size={14} />
                          {template.estimatedTime}
                        </span>
                        <span className={`template-category ${template.category}`}>
                          {template.category}
                        </span>
                      </div>
                    </div>
                    <div className="template-actions">
                      <button 
                        className={`generate-btn ${generating === template.id ? 'generating' : ''}`}
                        onClick={() => handleGenerateReport(template.id)}
                        disabled={generating === template.id}
                      >
                        {generating === template.id ? (
                          <>
                            <Loader size={16} className="spinning" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Play size={16} />
                            Generate
                          </>
                        )}
                      </button>
                      <button className="schedule-btn">
                        <Calendar size={16} />
                        Schedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'generated' && (
          <div className="reports-generator__generated">
            <div className="generated-header">
              <div className="generated-filters">
                <select className="filter-select">
                  <option value="all">All Reports</option>
                  <option value="completed">Completed</option>
                  <option value="generating">Generating</option>
                  <option value="failed">Failed</option>
                </select>
                <select className="filter-select">
                  <option value="all">All Formats</option>
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              <div className="generated-stats">
                <span className="stat-item completed">
                  <CheckCircle size={16} />
                  {generatedReports.filter(r => r.status === 'completed').length} Completed
                </span>
                <span className="stat-item generating">
                  <Loader size={16} />
                  {generatedReports.filter(r => r.status === 'generating').length} Generating
                </span>
              </div>
            </div>

            <div className="generated-list">
              {generatedReports.map(report => (
                <div key={report.id} className={`report-item ${report.status}`}>
                  <div className="report-status">
                    {getStatusIcon(report.status)}
                  </div>
                  <div className="report-info">
                    <h4>{report.name}</h4>
                    <div className="report-meta">
                      <span className="report-template">{report.template}</span>
                      <span className="report-date">
                        <Calendar size={14} />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      {report.size && (
                        <span className="report-size">{report.size}</span>
                      )}
                      <span className={`report-format ${report.format}`}>
                        {getFormatIcon(report.format)}
                        {report.format.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="report-actions">
                    {report.status === 'completed' && (
                      <>
                        <button className="action-btn primary">
                          <Download size={16} />
                          Download
                        </button>
                        <button className="action-btn">
                          <Eye size={16} />
                        </button>
                        <button className="action-btn">
                          <Copy size={16} />
                        </button>
                      </>
                    )}
                    {report.status === 'generating' && (
                      <span className="generating-text">
                        <Loader size={16} className="spinning" />
                        Processing...
                      </span>
                    )}
                    {report.status === 'failed' && (
                      <button className="action-btn retry">
                        <RefreshCw size={16} />
                        Retry
                      </button>
                    )}
                    <button className="action-btn delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="reports-generator__scheduled">
            <div className="scheduled-header">
              <h3>Scheduled Reports</h3>
              <button className="add-schedule-btn">
                <Plus size={18} />
                New Schedule
              </button>
            </div>

            <div className="scheduled-list">
              {schedules.map(schedule => (
                <div key={schedule.id} className={`schedule-item ${schedule.enabled ? 'enabled' : 'disabled'}`}>
                  <div className="schedule-toggle">
                    <label className="toggle-switch">
                      <input type="checkbox" checked={schedule.enabled} readOnly />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  <div className="schedule-info">
                    <h4>{schedule.name}</h4>
                    <div className="schedule-meta">
                      <span className="schedule-template">{schedule.template}</span>
                      <span className={`schedule-frequency ${schedule.frequency}`}>
                        <RefreshCw size={14} />
                        {schedule.frequency}
                      </span>
                      <span className="schedule-format">
                        {getFormatIcon(schedule.format)}
                        {schedule.format.toUpperCase()}
                      </span>
                    </div>
                    <div className="schedule-details">
                      <span className="next-run">
                        <Clock size={14} />
                        Next: {new Date(schedule.nextRun).toLocaleString()}
                      </span>
                      <span className="recipients">
                        <Mail size={14} />
                        {schedule.recipients.length} recipient{schedule.recipients.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="schedule-actions">
                    <button className="action-btn">
                      <Play size={16} />
                      Run Now
                    </button>
                    <button className="action-btn">
                      <Edit size={16} />
                    </button>
                    <button className="action-btn delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="reports-generator__custom">
            <div className="custom-builder">
              <div className="builder-section">
                <h3>
                  <span className="step-number">1</span>
                  Report Details
                </h3>
                <div className="form-group">
                  <label>Report Name</label>
                  <input type="text" placeholder="Enter report name..." />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea placeholder="Describe your report..." rows={3} />
                </div>
              </div>

              <div className="builder-section">
                <h3>
                  <span className="step-number">2</span>
                  Select Data Sources
                </h3>
                <div className="data-sources">
                  {[
                    { id: 'users', label: 'User Data', icon: <Users size={20} /> },
                    { id: 'revenue', label: 'Revenue', icon: <DollarSign size={20} /> },
                    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
                    { id: 'security', label: 'Security', icon: <Shield size={20} /> },
                    { id: 'api', label: 'API Usage', icon: <Activity size={20} /> },
                    { id: 'storage', label: 'Storage', icon: <Database size={20} /> }
                  ].map(source => (
                    <label key={source.id} className="source-checkbox">
                      <input type="checkbox" />
                      <span className="checkbox-custom" />
                      {source.icon}
                      <span>{source.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="builder-section">
                <h3>
                  <span className="step-number">3</span>
                  Date Range
                </h3>
                <div className="date-range-options">
                  {['Last 7 days', 'Last 30 days', 'Last 90 days', 'This Year', 'Custom'].map(range => (
                    <button key={range} className="range-btn">
                      {range}
                    </button>
                  ))}
                </div>
                <div className="custom-date-range">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input type="date" />
                  </div>
                </div>
              </div>

              <div className="builder-section">
                <h3>
                  <span className="step-number">4</span>
                  Output Format
                </h3>
                <div className="format-options">
                  {[
                    { id: 'pdf', label: 'PDF', icon: <File size={20} /> },
                    { id: 'xlsx', label: 'Excel', icon: <FileSpreadsheet size={20} /> },
                    { id: 'csv', label: 'CSV', icon: <FileSpreadsheet size={20} /> },
                    { id: 'json', label: 'JSON', icon: <FileText size={20} /> }
                  ].map(format => (
                    <label key={format.id} className="format-radio">
                      <input type="radio" name="format" />
                      <span className="radio-custom" />
                      {format.icon}
                      <span>{format.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="builder-actions">
                <button className="preview-btn">
                  <Eye size={18} />
                  Preview
                </button>
                <button className="generate-custom-btn">
                  <Zap size={18} />
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
