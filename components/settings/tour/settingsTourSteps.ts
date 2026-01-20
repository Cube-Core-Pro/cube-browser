/**
 * Settings Tour Steps
 * CUBE Elite v7.0.0 - Application Settings
 * 
 * Comprehensive guided tour for settings management
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for Settings module
 * Covers: Account, Email, Updates, Cloud Sync
 */
export const settingsTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'settings-welcome',
    target: '[data-tour="settings-module"]',
    title: '⚙️ Application Settings',
    content: `Welcome to CUBE Settings!

**Setting Categories:**
• 👤 Account & Profile
• 📧 Email Configuration
• 🔄 Updates & Sync
• ☁️ Cloud Backup

Customize your CUBE experience.`,
    placement: 'center',
    position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Account Settings
  // ============================================================================
  {
    id: 'settings-account',
    target: '[data-tour="account-settings"]',
    title: '👤 Account Settings',
    content: `Manage your profile:

**Profile Options:**
• Name & display name
• Email address
• Phone number
• Avatar/photo

**Preferences:**
• Timezone
• Date format
• Language`,
    placement: 'right',
    position: 'right',
    category: 'account',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'settings-avatar',
    target: '[data-tour="avatar-upload"]',
    title: '📷 Profile Avatar',
    content: `Customize your avatar:

**Options:**
• Upload photo
• Remove current
• Use initials

**Formats:**
JPG, PNG, GIF (max 5MB)

Click camera icon to change.`,
    placement: 'right',
    position: 'right',
    category: 'account',
    showProgress: true
  },
  {
    id: 'settings-billing',
    target: '[data-tour="billing-address"]',
    title: '💳 Billing Address',
    content: `Manage billing info:

**Billing Fields:**
• Name / Company
• Address lines
• City, State, ZIP
• Country
• VAT number (optional)

Used for invoices & receipts.`,
    placement: 'left',
    position: 'left',
    category: 'account',
    showProgress: true
  },
  {
    id: 'settings-notifications',
    target: '[data-tour="notification-prefs"]',
    title: '🔔 Notifications',
    content: `Control notifications:

**Categories:**
• Product updates
• Security alerts
• Marketing emails
• Weekly digest

Toggle each preference on/off.`,
    placement: 'right',
    position: 'right',
    category: 'account',
    showProgress: true
  },

  // ============================================================================
  // SECTION 3: Email Settings
  // ============================================================================
  {
    id: 'settings-email',
    target: '[data-tour="email-settings"]',
    title: '📧 Email Settings',
    content: `Configure email delivery:

**Providers:**
• SMTP (custom server)
• SendGrid (API)

**Features:**
• Connection testing
• Rate limiting
• Tracking options`,
    placement: 'right',
    position: 'right',
    category: 'email',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'settings-smtp',
    target: '[data-tour="smtp-config"]',
    title: '🖥️ SMTP Configuration',
    content: `Custom mail server:

**Required Fields:**
• Host (smtp.server.com)
• Port (587, 465, 25)
• Username
• Password
• Encryption (TLS/STARTTLS)

**From Address:**
• Email & display name
• Reply-to address`,
    placement: 'left',
    position: 'left',
    category: 'email',
    showProgress: true
  },
  {
    id: 'settings-sendgrid',
    target: '[data-tour="sendgrid-config"]',
    title: '📤 SendGrid Setup',
    content: `SendGrid API integration:

**Required:**
• API Key (from SendGrid)
• From email (verified)

**Options:**
• Open/click tracking
• Sandbox mode (testing)

Recommended for high volume.`,
    placement: 'left',
    position: 'left',
    category: 'email',
    showProgress: true
  },
  {
    id: 'settings-email-test',
    target: '[data-tour="email-test"]',
    title: '🧪 Test Email',
    content: `Verify email setup:

**Test Connection:**
Verifies server connectivity

**Send Test Email:**
Sends actual test message

Always test before going live!`,
    placement: 'bottom',
    position: 'bottom',
    category: 'email',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: Updates
  // ============================================================================
  {
    id: 'settings-updates',
    target: '[data-tour="update-settings"]',
    title: '🔄 Update Settings',
    content: `Keep CUBE current:

**Update Options:**
• Check for updates
• Auto-update toggle
• Update channel

**Shows:**
• Current version
• Latest available
• Update history`,
    placement: 'right',
    position: 'right',
    category: 'updates',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'settings-auto-update',
    target: '[data-tour="auto-update"]',
    title: '⚡ Auto-Updates',
    content: `Automatic updates:

**When Enabled:**
• Downloads in background
• Installs on restart
• Keeps you secure

**Channels:**
• Stable (recommended)
• Beta (early features)
• Nightly (cutting edge)`,
    placement: 'right',
    position: 'right',
    category: 'updates',
    showProgress: true
  },
  {
    id: 'settings-update-history',
    target: '[data-tour="update-history"]',
    title: '📜 Update History',
    content: `Track past updates:

**History Shows:**
• Version numbers
• Update dates
• Change summaries

Review what's changed.`,
    placement: 'left',
    position: 'left',
    category: 'updates',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: Cloud Sync
  // ============================================================================
  {
    id: 'settings-cloud',
    target: '[data-tour="cloud-sync"]',
    title: '☁️ Cloud Sync',
    content: `Sync across devices:

**Syncable Data:**
• Settings & preferences
• Collections & bookmarks
• Reading list
• Workflows

Stay in sync everywhere!`,
    placement: 'right',
    position: 'right',
    category: 'cloud',
    showProgress: true
  },
  {
    id: 'settings-sync-toggle',
    target: '[data-tour="sync-toggle"]',
    title: '🔄 Enable Sync',
    content: `Control synchronization:

**Options:**
• Enable/disable sync
• Sync on startup
• Sync interval

**Intervals:**
• Real-time
• Every 5 minutes
• Hourly
• Manual only`,
    placement: 'right',
    position: 'right',
    category: 'cloud',
    showProgress: true
  },
  {
    id: 'settings-devices',
    target: '[data-tour="devices-list"]',
    title: '📱 Connected Devices',
    content: `Manage devices:

**Device Info:**
• Device name
• Last sync time
• Platform (Desktop/Mobile)

**Actions:**
• Remove device
• Force sync`,
    placement: 'left',
    position: 'left',
    category: 'cloud',
    showProgress: true
  },
  {
    id: 'settings-backups',
    target: '[data-tour="backups"]',
    title: '💾 Cloud Backups',
    content: `Automatic backups:

**Backup Features:**
• Auto-backup toggle
• Backup frequency
• Restore from backup

**Keeps:**
• Last 10 backups
• Point-in-time recovery

Never lose your data!`,
    placement: 'left',
    position: 'left',
    category: 'cloud',
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: Tour Completion
  // ============================================================================
  {
    id: 'settings-complete',
    target: '[data-tour="settings-module"]',
    title: '✅ Settings Tour Complete!',
    content: `You've mastered CUBE Settings!

**Topics Covered:**
✓ Account & profile management
✓ Email configuration
✓ Update preferences
✓ Cloud sync setup
✓ Backup management

**Pro Tips:**
• Keep email settings tested
• Enable auto-updates for security
• Use cloud sync for multi-device
• Review backups periodically
• Update billing info when needed

**Quick Reference:**
• Save: Click Save button
• Test email: Test Connection
• Check updates: Refresh button
• Sync now: Manual sync button

Settings customized!`,
    placement: 'center',
    position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for Settings
 */
export const settingsTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '⚙️' },
  { id: 'account', title: 'Account', icon: '👤' },
  { id: 'email', title: 'Email', icon: '📧' },
  { id: 'updates', title: 'Updates', icon: '🔄' },
  { id: 'cloud', title: 'Cloud Sync', icon: '☁️' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getSettingsStepsBySection = (sectionId: string): TourStep[] => {
  return settingsTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getSettingsRequiredSteps = (): TourStep[] => {
  return settingsTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const settingsTourConfig = {
  id: 'settings-tour',
  name: 'Settings Tour',
  description: 'Configure CUBE application settings',
  version: '1.0.0',
  totalSteps: settingsTourSteps.length,
  estimatedTime: '5 minutes',
  sections: settingsTourSections,
  features: [
    'Account management',
    'Email configuration',
    'Auto-updates',
    'Cloud sync',
    'Backup management'
  ]
};

export default settingsTourSteps;
