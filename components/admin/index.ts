/**
 * Admin Components
 * CUBE Elite v7 - Admin Panel
 * 
 * Complete enterprise admin components including:
 * - AdminPanel: Main admin dashboard
 * - EnterpriseSettings: SSO, LDAP, Tenants, Roles, Licenses, Audit, WhiteLabel
 * - AnalyticsDashboard: Dashboards, Reports, Metrics, Alerts, Usage
 * - NotificationCenter: Inbox, Templates, Preferences, Queue, Testing
 * - UpdateManager: Release management, version distribution, update channels
 * - AffiliateManager: Affiliate program, commissions, referrals, payouts
 * - HelpdeskManager: Ticket system, knowledge base, canned responses
 * - FileManager: File storage, uploads, downloads, sharing
 */

// Main Admin Panel
export { default as AdminPanel } from './AdminPanel';

// Enterprise Settings
export { EnterpriseSettings, default as EnterpriseSettingsDefault } from './EnterpriseSettings';

// Analytics Dashboard  
export { AnalyticsDashboard, default as AnalyticsDashboardDefault } from './AnalyticsDashboard';

// Notification Center
export { NotificationCenter, default as NotificationCenterDefault } from './NotificationCenter';

// Update Manager - Release & Version Management
export { UpdateManager, default as UpdateManagerDefault } from './UpdateManager';

// Affiliate Manager - Partner & Referral Program
export { AffiliateManager, default as AffiliateManagerDefault } from './AffiliateManager';

// Helpdesk Manager - Support Ticket System
export { HelpdeskManager, default as HelpdeskManagerDefault } from './HelpdeskManager';

// File Manager - Asset & Document Storage
export { FileManager, default as FileManagerDefault } from './FileManager';
