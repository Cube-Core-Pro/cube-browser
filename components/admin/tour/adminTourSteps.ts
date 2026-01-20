/**
 * Admin Panel Tour Steps
 * CUBE Elite v7.0.0 - Enterprise Administration
 * 
 * Comprehensive guided tour for admin features
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for Admin module
 * Covers: Users, Licenses, API Keys, Sales, Metrics
 */
export const adminTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'admin-welcome',
    target: '[data-tour="admin-module"]',
    title: '🛡️ Admin Panel',
    content: `Welcome to CUBE Administration!

**Admin Areas:**
• 👥 User Management
• 🔑 License Management
• 🔐 API Keys
• 💰 Sales & Revenue
• 📊 Business Metrics

Enterprise control center.`,
    placement: 'center',
    position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Dashboard Overview
  // ============================================================================
  {
    id: 'admin-dashboard',
    target: '[data-tour="admin-dashboard"]',
    title: '📊 Dashboard',
    content: `System overview:

**Key Metrics:**
• Total users
• Active licenses
• Monthly revenue
• System health

Quick status at a glance.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'dashboard',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'admin-server-stats',
    target: '[data-tour="server-stats"]',
    title: '🖥️ Server Statistics',
    content: `Monitor system health:

**Tracked Metrics:**
• CPU usage (%)
• Memory usage
• Disk space
• Network I/O
• Uptime

Real-time updates.`,
    placement: 'right',
    position: 'right',
    category: 'dashboard',
    showProgress: true
  },
  {
    id: 'admin-service-status',
    target: '[data-tour="service-status"]',
    title: '🚦 Service Status',
    content: `Service health:

**Status Indicators:**
• 🟢 Healthy
• 🟡 Degraded
• 🔴 Down

Monitor all services.`,
    placement: 'left',
    position: 'left',
    category: 'dashboard',
    showProgress: true
  },

  // ============================================================================
  // SECTION 3: User Management
  // ============================================================================
  {
    id: 'admin-users',
    target: '[data-tour="user-management"]',
    title: '👥 User Management',
    content: `Manage user accounts:

**User Details:**
• Email & name
• Plan (free/pro/enterprise)
• Status (active/suspended)
• API usage

Full user control.`,
    placement: 'right',
    position: 'right',
    category: 'users',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'admin-create-user',
    target: '[data-tour="create-user"]',
    title: '➕ Create User',
    content: `Add new user:

**Required Fields:**
• Email address
• Display name
• Plan selection

**Optional:**
• Initial features
• Custom limits`,
    placement: 'bottom',
    position: 'bottom',
    category: 'users',
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'admin-user-actions',
    target: '[data-tour="user-actions"]',
    title: '⚡ User Actions',
    content: `Manage users:

**Actions:**
• ✏️ Edit details
• 🔄 Change plan
• 🚫 Suspend account
• 🗑️ Delete user

Handle any situation.`,
    placement: 'left',
    position: 'left',
    category: 'users',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: License Management
  // ============================================================================
  {
    id: 'admin-licenses',
    target: '[data-tour="license-management"]',
    title: '🔑 License Management',
    content: `Manage licenses:

**License Info:**
• License key
• Assigned user
• Plan type
• Expiration date
• Device usage

Control access.`,
    placement: 'right',
    position: 'right',
    category: 'licenses',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'admin-create-license',
    target: '[data-tour="create-license"]',
    title: '➕ Create License',
    content: `Generate license:

**Options:**
• User assignment
• Plan selection
• Duration (days)
• Max devices

Issue new licenses.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'licenses',
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'admin-license-status',
    target: '[data-tour="license-status"]',
    title: '📊 License Status',
    content: `License states:

**Statuses:**
• 🟢 Active
• 🟡 Expiring soon
• 🔴 Expired
• ⚫ Revoked

Track all licenses.`,
    placement: 'left',
    position: 'left',
    category: 'licenses',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: API Keys
  // ============================================================================
  {
    id: 'admin-api-keys',
    target: '[data-tour="api-key-management"]',
    title: '🔐 API Keys',
    content: `Manage API access:

**Key Details:**
• Key name
• Owner
• Permissions
• Usage stats

Secure API access.`,
    placement: 'right',
    position: 'right',
    category: 'api',
    showProgress: true
  },
  {
    id: 'admin-create-key',
    target: '[data-tour="create-api-key"]',
    title: '➕ Create API Key',
    content: `Generate new key:

**Configure:**
• Key name
• User assignment
• Permissions
• Rate limit

Keys shown once only!`,
    placement: 'bottom',
    position: 'bottom',
    category: 'api',
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'admin-revoke-key',
    target: '[data-tour="revoke-key"]',
    title: '🚫 Revoke Key',
    content: `Disable API keys:

**When to Revoke:**
• Security breach
• User leaves
• Key compromised

Immediate effect.`,
    placement: 'left',
    position: 'left',
    category: 'api',
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: Sales & Revenue
  // ============================================================================
  {
    id: 'admin-sales',
    target: '[data-tour="sales-management"]',
    title: '💰 Sales Management',
    content: `Track revenue:

**Sales Data:**
• Customer info
• Plan purchased
• Amount & currency
• Payment status

Business overview.`,
    placement: 'right',
    position: 'right',
    category: 'sales',
    showProgress: true
  },
  {
    id: 'admin-revenue',
    target: '[data-tour="revenue-metrics"]',
    title: '📈 Revenue Metrics',
    content: `Business health:

**Metrics:**
• Total revenue
• MRR (Monthly Recurring)
• ARR (Annual Recurring)
• Churn rate
• ARPU

Track growth!`,
    placement: 'left',
    position: 'left',
    category: 'sales',
    showProgress: true
  },

  // ============================================================================
  // SECTION 7: Downloads
  // ============================================================================
  {
    id: 'admin-downloads',
    target: '[data-tour="downloads-tracking"]',
    title: '📥 Download Tracking',
    content: `Monitor downloads:

**Tracked Data:**
• User info
• Platform (Win/Mac/Linux)
• Version
• Geographic location

Understand adoption.`,
    placement: 'right',
    position: 'right',
    category: 'downloads',
    showProgress: true
  },

  // ============================================================================
  // SECTION 8: Export
  // ============================================================================
  {
    id: 'admin-export',
    target: '[data-tour="export-data"]',
    title: '📤 Export Data',
    content: `Export admin data:

**Export Options:**
• Users (CSV/JSON)
• Licenses
• Sales records
• API usage

For reporting & backup.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'export',
    showProgress: true
  },

  // ============================================================================
  // SECTION 9: Tour Completion
  // ============================================================================
  {
    id: 'admin-complete',
    target: '[data-tour="admin-module"]',
    title: '✅ Admin Tour Complete!',
    content: `You've mastered CUBE Admin!

**Topics Covered:**
✓ Dashboard overview
✓ User management
✓ License control
✓ API key management
✓ Sales tracking
✓ Download monitoring
✓ Data export

**Pro Tips:**
• Monitor server stats regularly
• Review suspicious activity
• Revoke unused API keys
• Track MRR for growth
• Export data for reports

**Quick Reference:**
• Create user: + button
• Issue license: License tab
• Generate key: API Keys tab
• Export: Export button

Manage with confidence!`,
    placement: 'center',
    position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for Admin
 */
export const adminTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '🛡️' },
  { id: 'dashboard', title: 'Dashboard', icon: '📊' },
  { id: 'users', title: 'Users', icon: '👥' },
  { id: 'licenses', title: 'Licenses', icon: '🔑' },
  { id: 'api', title: 'API Keys', icon: '🔐' },
  { id: 'sales', title: 'Sales', icon: '💰' },
  { id: 'downloads', title: 'Downloads', icon: '📥' },
  { id: 'export', title: 'Export', icon: '📤' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getAdminStepsBySection = (sectionId: string): TourStep[] => {
  return adminTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getAdminRequiredSteps = (): TourStep[] => {
  return adminTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const adminTourConfig = {
  id: 'admin-tour',
  name: 'Admin Panel Tour',
  description: 'Enterprise administration and management',
  version: '1.0.0',
  totalSteps: adminTourSteps.length,
  estimatedTime: '6 minutes',
  sections: adminTourSections,
  features: [
    'User management',
    'License control',
    'API key management',
    'Sales tracking',
    'Business metrics',
    'Data export'
  ]
};

export default adminTourSteps;
