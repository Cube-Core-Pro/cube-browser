// ============================================
// CUBE Elite v6 - Compliance Reports Component
// Fortune 500 Ready - SOC2/GDPR/HIPAA/PCI
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAudit } from '../../hooks/useEnterpriseServices';
import type { AuditEvent, AuditReport, AuditQuery } from '../../hooks/useEnterpriseServices';
import './ComplianceReports.css';

// ============================================
// Types
// ============================================

type ComplianceStandard = 'SOC2' | 'GDPR' | 'HIPAA' | 'PCI_DSS' | 'ISO27001';
type ReportTimeRange = '7d' | '30d' | '90d' | '365d' | 'custom';

interface ComplianceStatus {
  standard: ComplianceStandard;
  status: 'compliant' | 'warning' | 'non-compliant' | 'pending';
  lastAudit: number;
  nextAudit: number;
  score: number;
  issues: number;
}

interface ComplianceReportsProps {
  tenantId: string;
  onClose?: () => void;
}

// ============================================
// Sub-Components
// ============================================

interface ComplianceCardProps {
  compliance: ComplianceStatus;
  onClick: () => void;
}

const ComplianceCard: React.FC<ComplianceCardProps> = ({ compliance, onClick }) => {
  const getStatusIcon = (status: ComplianceStatus['status']) => {
    switch (status) {
      case 'compliant': return '✅';
      case 'warning': return '⚠️';
      case 'non-compliant': return '❌';
      case 'pending': return '⏳';
    }
  };

  const getStandardDescription = (standard: ComplianceStandard) => {
    switch (standard) {
      case 'SOC2': return 'Service Organization Control 2';
      case 'GDPR': return 'General Data Protection Regulation';
      case 'HIPAA': return 'Health Insurance Portability and Accountability Act';
      case 'PCI_DSS': return 'Payment Card Industry Data Security Standard';
      case 'ISO27001': return 'Information Security Management';
    }
  };

  return (
    <div 
      className={`compliance-card compliance-card--${compliance.status}`}
      onClick={onClick}
    >
      <div className="compliance-card__header">
        <span className="compliance-card__icon">{getStatusIcon(compliance.status)}</span>
        <h3 className="compliance-card__title">{compliance.standard}</h3>
      </div>
      <p className="compliance-card__description">
        {getStandardDescription(compliance.standard)}
      </p>
      <div className="compliance-card__score">
        <div className="score-bar">
          <div 
            className="score-bar__fill" 
            style={{ width: `${compliance.score}%` }}
          />
        </div>
        <span className="score-value">{compliance.score}%</span>
      </div>
      <div className="compliance-card__meta">
        <span>Last audit: {new Date(compliance.lastAudit * 1000).toLocaleDateString()}</span>
        {compliance.issues > 0 && (
          <span className="issues-badge">{compliance.issues} issues</span>
        )}
      </div>
    </div>
  );
};

interface ReportGeneratorProps {
  onGenerate: (config: ReportConfig) => Promise<void>;
  loading: boolean;
}

interface ReportConfig {
  name: string;
  standard: ComplianceStandard | 'all';
  timeRange: ReportTimeRange;
  customStart?: number;
  customEnd?: number;
  includeDetails: boolean;
  format: 'pdf' | 'csv' | 'json';
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onGenerate, loading }) => {
  const [config, setConfig] = useState<ReportConfig>({
    name: `Compliance Report - ${new Date().toISOString().split('T')[0]}`,
    standard: 'all',
    timeRange: '30d',
    includeDetails: true,
    format: 'pdf',
  });

  const handleGenerate = () => {
    onGenerate(config);
  };

  return (
    <div className="report-generator">
      <h3 className="report-generator__title">Generate Compliance Report</h3>
      
      <div className="generator-form">
        <div className="form-row">
          <div className="form-group">
            <label>Report Name</label>
            <input
              type="text"
              className="form-input"
              value={config.name}
              onChange={e => setConfig({ ...config, name: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row form-row--2col">
          <div className="form-group">
            <label>Compliance Standard</label>
            <select
              className="form-select"
              value={config.standard}
              onChange={e => setConfig({ ...config, standard: e.target.value as ComplianceStandard | 'all' })}
            >
              <option value="all">All Standards</option>
              <option value="SOC2">SOC2</option>
              <option value="GDPR">GDPR</option>
              <option value="HIPAA">HIPAA</option>
              <option value="PCI_DSS">PCI-DSS</option>
              <option value="ISO27001">ISO 27001</option>
            </select>
          </div>

          <div className="form-group">
            <label>Time Range</label>
            <select
              className="form-select"
              value={config.timeRange}
              onChange={e => setConfig({ ...config, timeRange: e.target.value as ReportTimeRange })}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="365d">Last 12 months</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
        </div>

        <div className="form-row form-row--2col">
          <div className="form-group">
            <label>Export Format</label>
            <select
              className="form-select"
              value={config.format}
              onChange={e => setConfig({ ...config, format: e.target.value as 'pdf' | 'csv' | 'json' })}
            >
              <option value="pdf">PDF Report</option>
              <option value="csv">CSV Export</option>
              <option value="json">JSON Data</option>
            </select>
          </div>

          <div className="form-group">
            <label>&nbsp;</label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.includeDetails}
                onChange={e => setConfig({ ...config, includeDetails: e.target.checked })}
              />
              <span>Include detailed event logs</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button 
            className="btn btn--primary btn--large"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? '⏳ Generating...' : '📊 Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface EventsTimelineProps {
  events: AuditEvent[];
  loading: boolean;
}

const EventsTimeline: React.FC<EventsTimelineProps> = ({ events, loading }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return '🔐';
      case 'data_access': return '📂';
      case 'security': return '🛡️';
      case 'admin': return '⚙️';
      case 'billing': return '💳';
      default: return '📋';
    }
  };

  if (loading) {
    return <div className="timeline-loading">Loading events...</div>;
  }

  return (
    <div className="events-timeline">
      <h3 className="timeline-title">Compliance Events</h3>
      <div className="timeline">
        {events.length === 0 ? (
          <div className="timeline-empty">No compliance events found</div>
        ) : (
          events.map(event => (
            <div 
              key={event.id} 
              className="timeline-item"
              style={{ borderLeftColor: getSeverityColor(event.severity) }}
            >
              <div className="timeline-item__header">
                <span className="timeline-item__icon">{getCategoryIcon(event.category)}</span>
                <span className="timeline-item__action">{event.action}</span>
                <span className="timeline-item__time">
                  {new Date(event.created_at * 1000).toLocaleString()}
                </span>
              </div>
              <div className="timeline-item__content">
                <span className="timeline-item__user">User: {event.user_id}</span>
                <span className="timeline-item__resource">
                  {event.resource_type} {event.resource_id || ''}
                </span>
              </div>
              {event.compliance_tags.length > 0 && (
                <div className="timeline-item__tags">
                  {event.compliance_tags.map(tag => (
                    <span key={tag} className="compliance-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface ReportsListProps {
  reports: AuditReport[];
  onDownload: (report: AuditReport) => void;
}

const ReportsList: React.FC<ReportsListProps> = ({ reports, onDownload }) => {
  return (
    <div className="reports-list">
      <h3 className="reports-list__title">Generated Reports</h3>
      {reports.length === 0 ? (
        <div className="reports-empty">
          <span className="empty-icon">📄</span>
          <p>No reports generated yet</p>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map(report => (
            <div key={report.id} className="report-item">
              <div className="report-item__header">
                <span className="report-item__icon">📊</span>
                <div className="report-item__info">
                  <h4>{report.name}</h4>
                  <span className="report-item__date">
                    {new Date(report.generated_at * 1000).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="report-item__stats">
                <span>{report.total_events.toLocaleString()} events</span>
                <span>•</span>
                <span>{report.top_actions.length} action types</span>
              </div>
              <button 
                className="btn btn--secondary btn--small"
                onClick={() => onDownload(report)}
              >
                📥 Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export const ComplianceReports: React.FC<ComplianceReportsProps> = ({
  tenantId,
  onClose = () => {},
}) => {
  const { events, reports, loading, queryEvents, generateReport, downloadExport } = useAudit();
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'reports' | 'generate'>('overview');
  const [complianceStatuses, setComplianceStatuses] = useState<ComplianceStatus[]>([]);
  const [selectedStandard, setSelectedStandard] = useState<ComplianceStandard | null>(null);
  const [generating, setGenerating] = useState(false);

  const loadComplianceData = useCallback(async () => {
    // Load audit events for compliance analysis
    await queryEvents({
      tenant_id: tenantId,
      limit: 500,
    });

    // Calculate compliance statuses (would be from backend in production)
    const statuses: ComplianceStatus[] = [
      {
        standard: 'SOC2',
        status: 'compliant',
        lastAudit: Math.floor(Date.now() / 1000) - 2592000, // 30 days ago
        nextAudit: Math.floor(Date.now() / 1000) + 7776000, // 90 days from now
        score: 94,
        issues: 2,
      },
      {
        standard: 'GDPR',
        status: 'compliant',
        lastAudit: Math.floor(Date.now() / 1000) - 604800, // 7 days ago
        nextAudit: Math.floor(Date.now() / 1000) + 15552000, // 180 days from now
        score: 98,
        issues: 0,
      },
      {
        standard: 'HIPAA',
        status: 'warning',
        lastAudit: Math.floor(Date.now() / 1000) - 5184000, // 60 days ago
        nextAudit: Math.floor(Date.now() / 1000) + 2592000, // 30 days from now
        score: 78,
        issues: 5,
      },
      {
        standard: 'PCI_DSS',
        status: 'compliant',
        lastAudit: Math.floor(Date.now() / 1000) - 1296000, // 15 days ago
        nextAudit: Math.floor(Date.now() / 1000) + 10368000, // 120 days from now
        score: 91,
        issues: 1,
      },
      {
        standard: 'ISO27001',
        status: 'pending',
        lastAudit: 0,
        nextAudit: Math.floor(Date.now() / 1000) + 7776000, // 90 days from now
        score: 0,
        issues: 0,
      },
    ];

    setComplianceStatuses(statuses);
  }, [tenantId, queryEvents]);

  useEffect(() => {
    loadComplianceData();
  }, [loadComplianceData]);

  const handleGenerateReport = async (config: ReportConfig) => {
    setGenerating(true);
    try {
      const timeRangeDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '365d': 365,
        'custom': 30,
      }[config.timeRange];

      const query: AuditQuery = {
        tenant_id: tenantId,
        start_date: Math.floor(Date.now() / 1000) - (timeRangeDays * 86400),
        compliance_tag: config.standard !== 'all' ? config.standard : undefined,
      };

      await generateReport(config.name, `Generated on ${new Date().toISOString()}`, query);

      if (config.format !== 'pdf') {
        await downloadExport(query, config.format as 'json' | 'csv', config.name);
      }

      setActiveTab('reports');
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (report: AuditReport) => {
    await downloadExport(report.query, 'json', report.name);
  };

  const handleComplianceClick = (standard: ComplianceStandard) => {
    setSelectedStandard(standard);
    queryEvents({
      tenant_id: tenantId,
      compliance_tag: standard,
      limit: 100,
    });
    setActiveTab('events');
  };

  const overallScore = complianceStatuses.length > 0
    ? Math.round(complianceStatuses.filter(c => c.score > 0).reduce((sum, c) => sum + c.score, 0) / complianceStatuses.filter(c => c.score > 0).length)
    : 0;

  const totalIssues = complianceStatuses.reduce((sum, c) => sum + c.issues, 0);

  return (
    <div className="compliance-reports">
      {/* Header */}
      <header className="compliance-header">
        <div className="compliance-header__left">
          <h1>Compliance Center</h1>
          <p>Monitor and maintain regulatory compliance</p>
        </div>
        <div className="compliance-header__right">
          <div className="overall-score">
            <div className="overall-score__circle">
              <svg viewBox="0 0 36 36">
                <path
                  className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle-fg"
                  strokeDasharray={`${overallScore}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="score-text">{overallScore}%</span>
            </div>
            <div className="overall-score__label">
              Overall Compliance
              {totalIssues > 0 && (
                <span className="issues-count">{totalIssues} issues</span>
              )}
            </div>
          </div>
          <button className="btn btn--ghost" onClick={onClose}>✕</button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="compliance-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab ${activeTab === 'events' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          📋 Events {selectedStandard && `(${selectedStandard})`}
        </button>
        <button
          className={`tab ${activeTab === 'reports' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📄 Reports ({reports.length})
        </button>
        <button
          className={`tab ${activeTab === 'generate' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          ➕ Generate
        </button>
      </nav>

      {/* Content */}
      <main className="compliance-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="compliance-cards">
              {complianceStatuses.map(compliance => (
                <ComplianceCard
                  key={compliance.standard}
                  compliance={compliance}
                  onClick={() => handleComplianceClick(compliance.standard)}
                />
              ))}
            </div>

            <div className="compliance-summary">
              <h3>Quick Actions</h3>
              <div className="quick-actions-grid">
                <button 
                  className="quick-action-btn"
                  onClick={() => setActiveTab('generate')}
                >
                  <span className="qa-icon">📊</span>
                  <span className="qa-label">Generate Report</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => queryEvents({ tenant_id: tenantId, severity: 'critical' })}
                >
                  <span className="qa-icon">🚨</span>
                  <span className="qa-label">Critical Events</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => downloadExport({ tenant_id: tenantId }, 'csv', 'audit-export')}
                >
                  <span className="qa-icon">📥</span>
                  <span className="qa-label">Export All</span>
                </button>
                <button className="quick-action-btn">
                  <span className="qa-icon">📅</span>
                  <span className="qa-label">Schedule Audit</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <EventsTimeline events={events} loading={loading} />
        )}

        {activeTab === 'reports' && (
          <ReportsList reports={reports} onDownload={handleDownloadReport} />
        )}

        {activeTab === 'generate' && (
          <ReportGenerator onGenerate={handleGenerateReport} loading={generating} />
        )}
      </main>
    </div>
  );
};

export default ComplianceReports;
