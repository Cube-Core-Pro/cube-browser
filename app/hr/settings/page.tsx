'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Users,
  Calendar,
  Clock,
  Bell,
  Mail,
  Shield,
  Key,
  Globe,
  Palette,
  Database,
  FileText,
  Download,
  Upload,
  Workflow,
  Zap,
  Link,
  ChevronRight,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  RotateCcw,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RefreshCw,
  Server,
  Cloud,
  HardDrive
} from 'lucide-react';
import './settings.css';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface IntegrationApp {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  icon: string;
}

interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'active' | 'inactive';
  lastTriggered?: string;
}

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  entity: 'employee' | 'job' | 'department' | 'application';
  required: boolean;
  options?: string[];
}

const settingSections: SettingSection[] = [
  { id: 'general', title: 'General Settings', description: 'Company info, branding, and basics', icon: <Building2 size={20} /> },
  { id: 'users', title: 'Users & Permissions', description: 'Access control and roles', icon: <Users size={20} /> },
  { id: 'time', title: 'Time & Attendance', description: 'Work hours, holidays, and leave', icon: <Clock size={20} /> },
  { id: 'notifications', title: 'Notifications', description: 'Email and alert preferences', icon: <Bell size={20} /> },
  { id: 'security', title: 'Security', description: 'Authentication and data protection', icon: <Shield size={20} /> },
  { id: 'integrations', title: 'Integrations', description: 'Connected apps and services', icon: <Link size={20} /> },
  { id: 'workflows', title: 'Workflows', description: 'Automation rules and triggers', icon: <Workflow size={20} /> },
  { id: 'customfields', title: 'Custom Fields', description: 'Additional data fields', icon: <Database size={20} /> },
  { id: 'datamanagement', title: 'Data Management', description: 'Import, export, and backups', icon: <HardDrive size={20} /> }
];

const integrations: IntegrationApp[] = [
  { id: '1', name: 'Slack', category: 'Communication', status: 'connected', lastSync: '2025-01-27 14:30', icon: '💬' },
  { id: '2', name: 'Google Workspace', category: 'Productivity', status: 'connected', lastSync: '2025-01-27 14:00', icon: '📧' },
  { id: '3', name: 'Microsoft 365', category: 'Productivity', status: 'disconnected', icon: '📁' },
  { id: '4', name: 'Zoom', category: 'Communication', status: 'connected', lastSync: '2025-01-27 12:00', icon: '📹' },
  { id: '5', name: 'ADP', category: 'Payroll', status: 'connected', lastSync: '2025-01-26 23:00', icon: '💰' },
  { id: '6', name: 'QuickBooks', category: 'Finance', status: 'error', icon: '📊' },
  { id: '7', name: 'LinkedIn', category: 'Recruiting', status: 'connected', lastSync: '2025-01-27 10:00', icon: '💼' },
  { id: '8', name: 'Indeed', category: 'Recruiting', status: 'disconnected', icon: '🔍' }
];

const workflowRules: WorkflowRule[] = [
  { id: '1', name: 'New Hire Onboarding', trigger: 'Employee Created', action: 'Send welcome email + Create accounts', status: 'active', lastTriggered: '2025-01-25' },
  { id: '2', name: 'Leave Request Approval', trigger: 'Leave Request Submitted', action: 'Notify manager + Update calendar', status: 'active', lastTriggered: '2025-01-27' },
  { id: '3', name: 'Performance Review Reminder', trigger: '30 days before review date', action: 'Send reminder to manager', status: 'active', lastTriggered: '2025-01-20' },
  { id: '4', name: 'Birthday Announcement', trigger: 'Employee birthday', action: 'Post in Slack + Send card', status: 'active', lastTriggered: '2025-01-26' },
  { id: '5', name: 'Offboarding Checklist', trigger: 'Termination date set', action: 'Create offboarding tasks', status: 'inactive' },
  { id: '6', name: 'Document Expiry Alert', trigger: '30 days before expiry', action: 'Notify employee + HR', status: 'active', lastTriggered: '2025-01-22' }
];

const customFields: CustomField[] = [
  { id: '1', name: 'T-Shirt Size', type: 'select', entity: 'employee', required: false, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { id: '2', name: 'Emergency Contact Name', type: 'text', entity: 'employee', required: true },
  { id: '3', name: 'Emergency Contact Phone', type: 'text', entity: 'employee', required: true },
  { id: '4', name: 'Work Permit Number', type: 'text', entity: 'employee', required: false },
  { id: '5', name: 'Remote Work Eligible', type: 'boolean', entity: 'job', required: false },
  { id: '6', name: 'Cost Center', type: 'text', entity: 'department', required: true },
  { id: '7', name: 'Referral Source', type: 'select', entity: 'application', required: false, options: ['LinkedIn', 'Indeed', 'Referral', 'Website', 'Other'] },
  { id: '8', name: 'Dietary Restrictions', type: 'multiselect', entity: 'employee', required: false, options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Kosher', 'Halal', 'None'] }
];

export default function HRSettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'CUBE Elite Corporation',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    fiscalYearStart: 'January',
    defaultLanguage: 'en'
  });

  const [timeSettings, setTimeSettings] = useState({
    workWeekStart: 'Monday',
    standardHours: 40,
    overtimeThreshold: 40,
    trackBreaks: true,
    flexibleHours: true,
    minBreakDuration: 30
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    slackNotifications: true,
    browserNotifications: false,
    dailyDigest: true,
    leaveRequests: true,
    performanceReviews: true,
    newHires: true,
    anniversaries: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    mfaRequired: true,
    passwordMinLength: 12,
    passwordExpiry: 90,
    sessionTimeout: 30,
    ipWhitelist: false,
    auditLogging: true
  });

  const handleSave = () => {
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  const getIntegrationStatusClass = (status: string) => {
    switch (status) {
      case 'connected': return 'integration-status connected';
      case 'disconnected': return 'integration-status disconnected';
      case 'error': return 'integration-status error';
      default: return 'integration-status';
    }
  };

  const getWorkflowStatusClass = (status: string) => {
    return status === 'active' ? 'workflow-status active' : 'workflow-status inactive';
  };

  const getFieldTypeClass = (type: string) => {
    return `field-type ${type}`;
  };

  const renderGeneralSettings = () => (
    <div className="settings-panel">
      <div className="panel-header">
        <h3>General Settings</h3>
        <p>Configure your company's basic information and preferences</p>
      </div>
      
      <div className="settings-form">
        <div className="form-group">
          <label>Company Name</label>
          <input 
            type="text" 
            value={generalSettings.companyName}
            onChange={(e) => setGeneralSettings({...generalSettings, companyName: e.target.value})}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Timezone</label>
            <select 
              value={generalSettings.timezone}
              onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Date Format</label>
            <select 
              value={generalSettings.dateFormat}
              onChange={(e) => setGeneralSettings({...generalSettings, dateFormat: e.target.value})}
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Currency</label>
            <select 
              value={generalSettings.currency}
              onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Fiscal Year Start</label>
            <select 
              value={generalSettings.fiscalYearStart}
              onChange={(e) => setGeneralSettings({...generalSettings, fiscalYearStart: e.target.value})}
            >
              <option value="January">January</option>
              <option value="April">April</option>
              <option value="July">July</option>
              <option value="October">October</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Default Language</label>
          <select 
            value={generalSettings.defaultLanguage}
            onChange={(e) => setGeneralSettings({...generalSettings, defaultLanguage: e.target.value})}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
          </select>
        </div>
      </div>
      
      <div className="panel-actions">
        <button className="btn-outline" onClick={() => setGeneralSettings({
          companyName: 'CUBE Elite Corporation',
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          currency: 'USD',
          fiscalYearStart: 'January',
          defaultLanguage: 'en'
        })}>
          <RotateCcw size={16} />
          Reset to Default
        </button>
        <button className="btn-primary" onClick={handleSave}>
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );

  const renderUsersPermissions = () => (
    <div className="settings-panel">
      <div className="panel-header">
        <h3>Users & Permissions</h3>
        <p>Manage user access and role-based permissions</p>
      </div>
      
      <div className="roles-section">
        <div className="section-subheader">
          <h4>Roles</h4>
          <button className="btn-outline small">
            <Plus size={14} />
            Add Role
          </button>
        </div>
        
        <div className="roles-list">
          <div className="role-card">
            <div className="role-info">
              <div className="role-icon admin">
                <Shield size={18} />
              </div>
              <div className="role-details">
                <h5>Super Admin</h5>
                <p>Full access to all features and settings</p>
              </div>
            </div>
            <div className="role-meta">
              <span className="role-users">3 users</span>
              <button className="action-btn">
                <Edit size={14} />
              </button>
            </div>
          </div>
          
          <div className="role-card">
            <div className="role-info">
              <div className="role-icon hr">
                <Users size={18} />
              </div>
              <div className="role-details">
                <h5>HR Manager</h5>
                <p>Manage employees, recruitment, and HR data</p>
              </div>
            </div>
            <div className="role-meta">
              <span className="role-users">8 users</span>
              <button className="action-btn">
                <Edit size={14} />
              </button>
            </div>
          </div>
          
          <div className="role-card">
            <div className="role-info">
              <div className="role-icon manager">
                <Building2 size={18} />
              </div>
              <div className="role-details">
                <h5>Department Manager</h5>
                <p>View and manage team members</p>
              </div>
            </div>
            <div className="role-meta">
              <span className="role-users">24 users</span>
              <button className="action-btn">
                <Edit size={14} />
              </button>
            </div>
          </div>
          
          <div className="role-card">
            <div className="role-info">
              <div className="role-icon employee">
                <Users size={18} />
              </div>
              <div className="role-details">
                <h5>Employee</h5>
                <p>Self-service access only</p>
              </div>
            </div>
            <div className="role-meta">
              <span className="role-users">315 users</span>
              <button className="action-btn">
                <Edit size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTimeSettings = () => (
    <div className="settings-panel">
      <div className="panel-header">
        <h3>Time & Attendance</h3>
        <p>Configure work schedules and time tracking options</p>
      </div>
      
      <div className="settings-form">
        <div className="form-row">
          <div className="form-group">
            <label>Work Week Starts On</label>
            <select 
              value={timeSettings.workWeekStart}
              onChange={(e) => setTimeSettings({...timeSettings, workWeekStart: e.target.value})}
            >
              <option value="Sunday">Sunday</option>
              <option value="Monday">Monday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Standard Work Hours (per week)</label>
            <input 
              type="number" 
              value={timeSettings.standardHours}
              onChange={(e) => setTimeSettings({...timeSettings, standardHours: parseInt(e.target.value)})}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Overtime Threshold (hours)</label>
            <input 
              type="number" 
              value={timeSettings.overtimeThreshold}
              onChange={(e) => setTimeSettings({...timeSettings, overtimeThreshold: parseInt(e.target.value)})}
            />
          </div>
          
          <div className="form-group">
            <label>Minimum Break Duration (minutes)</label>
            <input 
              type="number" 
              value={timeSettings.minBreakDuration}
              onChange={(e) => setTimeSettings({...timeSettings, minBreakDuration: parseInt(e.target.value)})}
            />
          </div>
        </div>
        
        <div className="toggle-group">
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Track Break Times</span>
              <span className="toggle-desc">Require employees to log breaks</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={timeSettings.trackBreaks}
                onChange={(e) => setTimeSettings({...timeSettings, trackBreaks: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Flexible Working Hours</span>
              <span className="toggle-desc">Allow employees to choose start/end times</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={timeSettings.flexibleHours}
                onChange={(e) => setTimeSettings({...timeSettings, flexibleHours: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="panel-actions">
        <button className="btn-outline">
          <RotateCcw size={16} />
          Reset to Default
        </button>
        <button className="btn-primary" onClick={handleSave}>
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-panel">
      <div className="panel-header">
        <h3>Notifications</h3>
        <p>Configure how and when you receive notifications</p>
      </div>
      
      <div className="notification-channels">
        <h4>Notification Channels</h4>
        <div className="toggle-group">
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">
                <Mail size={16} />
                Email Notifications
              </span>
              <span className="toggle-desc">Receive notifications via email</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">
                💬 Slack Notifications
              </span>
              <span className="toggle-desc">Receive notifications in Slack</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notificationSettings.slackNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, slackNotifications: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">
                <Bell size={16} />
                Browser Notifications
              </span>
              <span className="toggle-desc">Show desktop notifications</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notificationSettings.browserNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, browserNotifications: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">
                <FileText size={16} />
                Daily Digest
              </span>
              <span className="toggle-desc">Receive a daily summary email</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notificationSettings.dailyDigest}
                onChange={(e) => setNotificationSettings({...notificationSettings, dailyDigest: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="notification-types">
        <h4>Notification Types</h4>
        <div className="toggle-group">
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Leave Requests</span>
              <span className="toggle-desc">New requests and status updates</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notificationSettings.leaveRequests}
                onChange={(e) => setNotificationSettings({...notificationSettings, leaveRequests: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Performance Reviews</span>
              <span className="toggle-desc">Review assignments and reminders</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notificationSettings.performanceReviews}
                onChange={(e) => setNotificationSettings({...notificationSettings, performanceReviews: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">New Hires</span>
              <span className="toggle-desc">When new employees join</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notificationSettings.newHires}
                onChange={(e) => setNotificationSettings({...notificationSettings, newHires: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Work Anniversaries</span>
              <span className="toggle-desc">Employee anniversary reminders</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notificationSettings.anniversaries}
                onChange={(e) => setNotificationSettings({...notificationSettings, anniversaries: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="panel-actions">
        <button className="btn-primary" onClick={handleSave}>
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-panel">
      <div className="panel-header">
        <h3>Security</h3>
        <p>Configure authentication and data protection settings</p>
      </div>
      
      <div className="security-section">
        <h4>Authentication</h4>
        <div className="toggle-group">
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">
                <Key size={16} />
                Multi-Factor Authentication (MFA)
              </span>
              <span className="toggle-desc">Require MFA for all users</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={securitySettings.mfaRequired}
                onChange={(e) => setSecuritySettings({...securitySettings, mfaRequired: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">
                <Globe size={16} />
                IP Whitelist
              </span>
              <span className="toggle-desc">Restrict access to specific IP addresses</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={securitySettings.ipWhitelist}
                onChange={(e) => setSecuritySettings({...securitySettings, ipWhitelist: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">
                <FileText size={16} />
                Audit Logging
              </span>
              <span className="toggle-desc">Log all user actions for compliance</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={securitySettings.auditLogging}
                onChange={(e) => setSecuritySettings({...securitySettings, auditLogging: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="security-section">
        <h4>Password Policy</h4>
        <div className="settings-form">
          <div className="form-row">
            <div className="form-group">
              <label>Minimum Password Length</label>
              <input 
                type="number" 
                value={securitySettings.passwordMinLength}
                onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                min={8}
                max={32}
              />
            </div>
            
            <div className="form-group">
              <label>Password Expiry (days)</label>
              <input 
                type="number" 
                value={securitySettings.passwordExpiry}
                onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiry: parseInt(e.target.value)})}
                min={30}
                max={365}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Session Timeout (minutes)</label>
            <input 
              type="number" 
              value={securitySettings.sessionTimeout}
              onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
              min={5}
              max={120}
            />
            <span className="form-help">Auto-logout after inactivity</span>
          </div>
        </div>
      </div>
      
      <div className="panel-actions">
        <button className="btn-primary" onClick={handleSave}>
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="settings-panel">
      <div className="panel-header">
        <h3>Integrations</h3>
        <p>Connect your favorite apps and services</p>
      </div>
      
      <div className="integrations-grid">
        {integrations.map(integration => (
          <div key={integration.id} className="integration-card">
            <div className="integration-icon">{integration.icon}</div>
            <div className="integration-info">
              <h5>{integration.name}</h5>
              <span className="integration-category">{integration.category}</span>
            </div>
            <div className="integration-status-container">
              <span className={getIntegrationStatusClass(integration.status)}>
                {integration.status === 'connected' && <Check size={12} />}
                {integration.status === 'disconnected' && <X size={12} />}
                {integration.status === 'error' && <AlertTriangle size={12} />}
                {integration.status}
              </span>
              {integration.lastSync && (
                <span className="last-sync">Synced: {integration.lastSync}</span>
              )}
            </div>
            <div className="integration-actions">
              {integration.status === 'connected' ? (
                <>
                  <button className="action-btn">
                    <RefreshCw size={14} />
                  </button>
                  <button className="action-btn">
                    <Settings size={14} />
                  </button>
                </>
              ) : (
                <button className="btn-outline small">Connect</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWorkflows = () => (
    <div className="settings-panel">
      <div className="panel-header">
        <h3>Workflows</h3>
        <p>Automate HR processes with custom rules</p>
      </div>
      
      <div className="section-subheader">
        <span>{workflowRules.filter(w => w.status === 'active').length} active workflows</span>
        <button className="btn-primary small">
          <Plus size={14} />
          Create Workflow
        </button>
      </div>
      
      <div className="workflows-list">
        {workflowRules.map(workflow => (
          <div key={workflow.id} className="workflow-card">
            <div className="workflow-info">
              <div className="workflow-icon">
                <Zap size={18} />
              </div>
              <div className="workflow-details">
                <h5>{workflow.name}</h5>
                <div className="workflow-rule">
                  <span className="rule-trigger">
                    <span className="rule-label">When:</span> {workflow.trigger}
                  </span>
                  <span className="rule-action">
                    <span className="rule-label">Then:</span> {workflow.action}
                  </span>
                </div>
                {workflow.lastTriggered && (
                  <span className="last-triggered">Last triggered: {workflow.lastTriggered}</span>
                )}
              </div>
            </div>
            <div className="workflow-controls">
              <span className={getWorkflowStatusClass(workflow.status)}>
                {workflow.status}
              </span>
              <label className="toggle-switch small">
                <input type="checkbox" checked={workflow.status === 'active'} readOnly />
                <span className="toggle-slider"></span>
              </label>
              <button className="action-btn">
                <Edit size={14} />
              </button>
              <button className="action-btn danger">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCustomFields = () => (
    <div className="settings-panel">
      <div className="panel-header">
        <h3>Custom Fields</h3>
        <p>Create additional data fields for your organization</p>
      </div>
      
      <div className="section-subheader">
        <span>{customFields.length} custom fields</span>
        <button className="btn-primary small">
          <Plus size={14} />
          Add Field
        </button>
      </div>
      
      <div className="custom-fields-table">
        <div className="table-header">
          <span>Field Name</span>
          <span>Type</span>
          <span>Entity</span>
          <span>Required</span>
          <span>Actions</span>
        </div>
        {customFields.map(field => (
          <div key={field.id} className="table-row">
            <span className="field-name">{field.name}</span>
            <span className={getFieldTypeClass(field.type)}>{field.type}</span>
            <span className="field-entity">{field.entity}</span>
            <span className="field-required">
              {field.required ? <Check size={16} className="check" /> : <X size={16} className="cross" />}
            </span>
            <div className="field-actions">
              <button className="action-btn">
                <Edit size={14} />
              </button>
              <button className="action-btn danger">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDataManagement = () => (
    <div className="settings-panel">
      <div className="panel-header">
        <h3>Data Management</h3>
        <p>Import, export, and backup your HR data</p>
      </div>
      
      <div className="data-actions-grid">
        <div className="data-action-card">
          <div className="data-icon import">
            <Upload size={24} />
          </div>
          <h5>Import Data</h5>
          <p>Import employees, jobs, and departments from CSV or Excel files</p>
          <button className="btn-outline">
            <Upload size={16} />
            Import
          </button>
        </div>
        
        <div className="data-action-card">
          <div className="data-icon export">
            <Download size={24} />
          </div>
          <h5>Export Data</h5>
          <p>Export your HR data to CSV, Excel, or PDF formats</p>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
        </div>
        
        <div className="data-action-card">
          <div className="data-icon backup">
            <Cloud size={24} />
          </div>
          <h5>Backup</h5>
          <p>Create a full backup of all your HR data</p>
          <button className="btn-outline">
            <Cloud size={16} />
            Create Backup
          </button>
        </div>
        
        <div className="data-action-card">
          <div className="data-icon restore">
            <Server size={24} />
          </div>
          <h5>Restore</h5>
          <p>Restore data from a previous backup</p>
          <button className="btn-outline">
            <Server size={16} />
            Restore
          </button>
        </div>
      </div>
      
      <div className="backup-history">
        <h4>Recent Backups</h4>
        <div className="backup-list">
          <div className="backup-item">
            <div className="backup-info">
              <Cloud size={18} />
              <div>
                <span className="backup-name">Full Backup - Jan 27, 2025</span>
                <span className="backup-size">245 MB</span>
              </div>
            </div>
            <div className="backup-actions">
              <button className="btn-outline small">Download</button>
              <button className="btn-outline small">Restore</button>
            </div>
          </div>
          <div className="backup-item">
            <div className="backup-info">
              <Cloud size={18} />
              <div>
                <span className="backup-name">Full Backup - Jan 20, 2025</span>
                <span className="backup-size">243 MB</span>
              </div>
            </div>
            <div className="backup-actions">
              <button className="btn-outline small">Download</button>
              <button className="btn-outline small">Restore</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'users': return renderUsersPermissions();
      case 'time': return renderTimeSettings();
      case 'notifications': return renderNotificationSettings();
      case 'security': return renderSecuritySettings();
      case 'integrations': return renderIntegrations();
      case 'workflows': return renderWorkflows();
      case 'customfields': return renderCustomFields();
      case 'datamanagement': return renderDataManagement();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="hr-settings-page">
      <header className="settings__header">
        <div className="settings__title-section">
          <div className="settings__icon">
            <Settings size={28} />
          </div>
          <div>
            <h1>HR Settings</h1>
            <p>Configure your HR system preferences</p>
          </div>
        </div>
      </header>

      <div className="settings__layout">
        <nav className="settings__sidebar">
          {settingSections.map(section => (
            <button
              key={section.id}
              className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <div className="sidebar-icon">{section.icon}</div>
              <div className="sidebar-info">
                <span className="sidebar-title">{section.title}</span>
                <span className="sidebar-desc">{section.description}</span>
              </div>
              <ChevronRight size={16} className="sidebar-arrow" />
            </button>
          ))}
        </nav>

        <main className="settings__main">
          {renderActiveSection()}
        </main>
      </div>

      {showSaveNotification && (
        <div className="save-notification">
          <Check size={18} />
          Settings saved successfully
        </div>
      )}
    </div>
  );
}
