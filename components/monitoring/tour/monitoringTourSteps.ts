/**
 * Monitoring Tour Steps
 * CUBE Elite v7.0.0 - Enterprise Monitoring Dashboard
 * 
 * Comprehensive guided tour for system monitoring
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for Monitoring module
 * Covers: Dashboard, Metrics, Logs, Alerts, Website Monitor
 */
export const monitoringTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'monitoring-welcome',
    target: '[data-tour="monitoring-module"]',
    title: '📊 Monitoring Dashboard',
    content: `Welcome to CUBE Monitoring!

**Key Features:**
• Real-time system statistics
• Active execution tracking
• Log viewer with filtering
• Alert management
• Website change detection

Enterprise-grade observability.`,
    placement: 'center',
    position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: System Statistics
  // ============================================================================
  {
    id: 'monitoring-stats',
    target: '[data-tour="system-stats"]',
    title: '📈 System Statistics',
    content: `Real-time metrics:

**Key Metrics:**
• Total executions
• Active executions
• Success rate (%)
• Average execution time
• System uptime

Updates every 5 seconds.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'stats',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'monitoring-executions',
    target: '[data-tour="active-executions"]',
    title: '⚡ Active Executions',
    content: `Track running workflows:

**Shows:**
• Workflow name
• Progress (nodes done/total)
• Duration
• Current node
• Resource usage

Monitor in real-time!`,
    placement: 'right',
    position: 'right',
    category: 'stats',
    showProgress: true
  },
  {
    id: 'monitoring-resources',
    target: '[data-tour="resource-usage"]',
    title: '💻 Resource Usage',
    content: `System resource metrics:

**Tracked Resources:**
• CPU usage (%)
• Memory (MB)
• Network I/O (KB)
• Disk I/O (KB)

Identify bottlenecks quickly.`,
    placement: 'left',
    position: 'left',
    category: 'stats',
    showProgress: true
  },

  // ============================================================================
  // SECTION 3: Logs
  // ============================================================================
  {
    id: 'monitoring-logs',
    target: '[data-tour="logs-viewer"]',
    title: '📜 Logs Viewer',
    content: `View system logs:

**Log Levels:**
• 🔵 Debug
• 🟢 Info
• 🟡 Warning
• 🔴 Error

Filter and search logs easily.`,
    placement: 'top',
    position: 'top',
    category: 'logs',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'monitoring-log-filters',
    target: '[data-tour="log-filters"]',
    title: '🔍 Log Filters',
    content: `Filter log entries:

**Filter Options:**
• By log level
• By workflow ID
• By execution ID
• By time range
• Text search

Find specific logs fast.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'logs',
    showProgress: true
  },
  {
    id: 'monitoring-log-stats',
    target: '[data-tour="log-stats"]',
    title: '📊 Log Statistics',
    content: `Log level breakdown:

**Shows Count Of:**
• Debug messages
• Info messages
• Warnings
• Errors

Quick health overview.`,
    placement: 'left',
    position: 'left',
    category: 'logs',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: Alerts
  // ============================================================================
  {
    id: 'monitoring-alerts',
    target: '[data-tour="alerts-panel"]',
    title: '🔔 Alerts',
    content: `Alert management:

**Alert Severities:**
• ℹ️ Info
• ⚠️ Warning
• ❌ Error
• 🚨 Critical

Stay informed of issues.`,
    placement: 'left',
    position: 'left',
    category: 'alerts',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'monitoring-alert-config',
    target: '[data-tour="alert-config"]',
    title: '⚙️ Alert Configuration',
    content: `Configure alert rules:

**Alert Types:**
• Execution failures
• Duration thresholds
• Error rate limits
• Resource alerts

**Notifications:**
• Email
• Slack/Discord
• Webhook`,
    placement: 'right',
    position: 'right',
    category: 'alerts',
    showProgress: true
  },
  {
    id: 'monitoring-alert-history',
    target: '[data-tour="alert-history"]',
    title: '📜 Alert History',
    content: `Review past alerts:

**History Shows:**
• Timestamp
• Workflow affected
• Alert message
• Severity level

Learn from past issues.`,
    placement: 'left',
    position: 'left',
    category: 'alerts',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: Website Monitor
  // ============================================================================
  {
    id: 'monitoring-website',
    target: '[data-tour="website-monitor"]',
    title: '🌐 Website Monitor',
    content: `Monitor websites for changes:

**Features:**
• Schedule checks (hourly/daily)
• Element-specific monitoring
• Visual diff comparison
• Smart change detection

Never miss important updates!`,
    placement: 'right',
    position: 'right',
    category: 'website',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'monitoring-add-site',
    target: '[data-tour="add-site"]',
    title: '➕ Add Website',
    content: `Add site to monitor:

**Required:**
• Website URL
• Name/label
• Schedule

**Optional:**
• CSS selector (specific element)
• Ignore patterns
• Sensitivity level`,
    placement: 'bottom',
    position: 'bottom',
    category: 'website',
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'monitoring-schedule',
    target: '[data-tour="monitor-schedule"]',
    title: '⏰ Check Schedule',
    content: `Set monitoring frequency:

**Schedules:**
• ⏰ Hourly
• 📅 Daily
• 📆 Weekly
• ⚙️ Custom (Cron)

Balance coverage vs. resources.`,
    placement: 'right',
    position: 'right',
    category: 'website',
    showProgress: true
  },
  {
    id: 'monitoring-sensitivity',
    target: '[data-tour="sensitivity"]',
    title: '🎚️ Sensitivity',
    content: `Change detection level:

**Levels:**
• **Low**: Only major changes
• **Medium**: Content changes
• **High**: Any change

Filter noise vs. catch all.`,
    placement: 'right',
    position: 'right',
    category: 'website',
    showProgress: true
  },
  {
    id: 'monitoring-changes',
    target: '[data-tour="change-history"]',
    title: '📝 Change History',
    content: `View detected changes:

**Change Info:**
• Change type (content/element)
• Severity (minor/major)
• Before/after content
• Visual diff

Track all website updates!`,
    placement: 'left',
    position: 'left',
    category: 'website',
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: Tour Completion
  // ============================================================================
  {
    id: 'monitoring-complete',
    target: '[data-tour="monitoring-module"]',
    title: '✅ Monitoring Tour Complete!',
    content: `You've mastered CUBE Monitoring!

**Topics Covered:**
✓ System statistics
✓ Active execution tracking
✓ Log viewing & filtering
✓ Alert management
✓ Website monitoring

**Pro Tips:**
• Set up critical alerts
• Review logs for errors
• Monitor resource usage
• Track website changes
• Use auto-refresh for real-time data

**Quick Reference:**
• Refresh: 🔄 button
• Filter logs: Use level dropdown
• Add site: + New Monitor
• Configure alerts: ⚙️ button

Stay informed!`,
    placement: 'center',
    position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for Monitoring
 */
export const monitoringTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '📊' },
  { id: 'stats', title: 'Statistics', icon: '📈' },
  { id: 'logs', title: 'Logs', icon: '📜' },
  { id: 'alerts', title: 'Alerts', icon: '🔔' },
  { id: 'website', title: 'Website Monitor', icon: '🌐' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getMonitoringStepsBySection = (sectionId: string): TourStep[] => {
  return monitoringTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getMonitoringRequiredSteps = (): TourStep[] => {
  return monitoringTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const monitoringTourConfig = {
  id: 'monitoring-tour',
  name: 'Monitoring Tour',
  description: 'Enterprise monitoring and observability dashboard',
  version: '1.0.0',
  totalSteps: monitoringTourSteps.length,
  estimatedTime: '5 minutes',
  sections: monitoringTourSections,
  features: [
    'Real-time statistics',
    'Execution tracking',
    'Log viewer',
    'Alert management',
    'Website monitoring'
  ]
};

export default monitoringTourSteps;
