/**
 * FTP Manager Tour Steps
 * CUBE Elite v7.0.0 - Enterprise File Transfer
 * 
 * Comprehensive guided tour for FTP/SFTP file transfer features
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for FTP Manager module
 * Covers: Sites, connections, file browser, transfers
 */
export const ftpTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'ftp-welcome',
    target: '[data-tour="ftp-manager"]',
    title: '📁 FTP Manager',
    content: `Welcome to CUBE's enterprise file transfer system!

**Supported Protocols:**
• FTP - Standard File Transfer
• FTPS - FTP over TLS/SSL
• SFTP - SSH File Transfer
• FTPES - Explicit FTP over TLS

**Key Features:**
• Dual-pane file browser
• Transfer queue with progress
• Site manager for saved connections
• Built-in FTP server hosting
• Chmod, rename, delete operations

Secure, fast, and reliable file transfers.`,
    placement: 'center', position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Connection & Sites
  // ============================================================================
  {
    id: 'ftp-connection-dialog',
    target: '[data-tour="connection-dialog"]',
    title: '🔌 Connect to Server',
    content: `The connection dialog lets you connect to remote servers:

**Quick Connect:**
• Select from saved sites
• One-click connection
• Last used sites prioritized

**New Site:**
• Enter server details
• Choose protocol
• Save for future use

Click "Connect" in the toolbar to open this dialog.`,
    placement: 'bottom', position: 'bottom',
    category: 'connection',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'ftp-protocol-select',
    target: '[data-tour="protocol-selector"]',
    title: '🔐 Protocol Selection',
    content: `Choose the right protocol for your server:

**FTP (Port 21)**
Standard protocol, unencrypted
Use only on trusted networks

**FTPS (Port 990)**
FTP with implicit TLS/SSL
Encrypted from the start

**SFTP (Port 22)**
SSH File Transfer Protocol
Most secure, recommended

**FTPES (Port 21)**
Explicit TLS negotiation
Secure upgrade on standard port

**Recommendation:** Use SFTP when possible for best security.`,
    placement: 'right', position: 'right',
    category: 'connection',
    showProgress: true
  },
  {
    id: 'ftp-site-form',
    target: '[data-tour="site-form"]',
    title: '📝 Site Configuration',
    content: `Configure your FTP site details:

**Required Fields:**
• **Site Name**: Friendly identifier
• **Host**: Server address (ftp.example.com)
• **Port**: Auto-set based on protocol
• **Username**: Your login

**Authentication:**
• Password (encrypted storage)
• SSH Key path (SFTP only)

**Advanced:**
• Passive mode toggle
• Custom port numbers

All credentials are encrypted before storage.`,
    placement: 'left', position: 'left',
    category: 'connection',
    showProgress: true
  },
  {
    id: 'ftp-server-manager',
    target: '[data-tour="server-manager"]',
    title: '🖥️ Server Manager',
    content: `Manage your saved FTP sites:

**Site List Features:**
• View all saved sites
• Protocol badge (FTP/SFTP/etc.)
• Last connection time
• Quick connect button

**Actions:**
• **Connect**: Open connection
• **Delete**: Remove saved site
• **Refresh**: Update list

Sites are stored securely with encrypted credentials.`,
    placement: 'right', position: 'right',
    category: 'connection',
    showProgress: true
  },
  {
    id: 'ftp-site-card',
    target: '[data-tour="site-card"]',
    title: '📇 Site Card',
    content: `Each saved site shows:

**Information:**
• Site name (custom label)
• Protocol type (colored badge)
• Host and port
• Username
• Last used timestamp

**Quick Actions:**
• Click card to connect
• Delete with confirmation

**Pro Tip:**
Organize sites with descriptive names like "Production Server" or "Backup Storage".`,
    placement: 'right', position: 'right',
    category: 'connection',
    showProgress: true
  },

  // ============================================================================
  // SECTION 3: File Browser
  // ============================================================================
  {
    id: 'ftp-file-panes',
    target: '[data-tour="file-panes"]',
    title: '📂 Dual-Pane Browser',
    content: `The file browser has two panes:

**Left Pane (Local):**
Your local filesystem
Browse, select, upload

**Right Pane (Remote):**
Connected server files
Download, delete, manage

**Transfer:**
• Drag files between panes
• Use toolbar buttons
• Double-click to navigate

Both panes support search, sort, and multi-select.`,
    placement: 'center', position: 'center',
    category: 'browser',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'ftp-local-pane',
    target: '[data-tour="local-pane"]',
    title: '💻 Local Files',
    content: `The local file pane shows your computer's files:

**Features:**
• Full filesystem access
• Search by filename
• Sort by name/size/date/type
• Multi-file selection

**Navigation:**
• Double-click folders to enter
• ⬆️ button to go up
• Path bar shows current location

**Tip:**
Start in a project folder for faster uploads.`,
    placement: 'right', position: 'right',
    category: 'browser',
    showProgress: true
  },
  {
    id: 'ftp-remote-pane',
    target: '[data-tour="remote-pane"]',
    title: '🌐 Remote Files',
    content: `The remote pane shows server files:

**Features:**
• Live directory listing
• File permissions display
• Owner/group info (SFTP)
• Search and sort

**Operations:**
• Create folders
• Delete files
• Rename items
• Change permissions (chmod)

**Connection Status:**
Green dot = connected
Red dot = disconnected`,
    placement: 'left', position: 'left',
    category: 'browser',
    showProgress: true
  },
  {
    id: 'ftp-path-nav',
    target: '[data-tour="path-navigation"]',
    title: '🧭 Path Navigation',
    content: `Navigate efficiently with path controls:

**Path Bar:**
Shows current directory path
Click breadcrumbs to jump

**Navigation Buttons:**
• ⬆️ Go to parent folder
• 🔄 Refresh current view

**Quick Navigation:**
• Type path directly
• Use / for root
• ~ for home (SFTP)

**Keyboard:**
Backspace = Go up one level`,
    placement: 'bottom', position: 'bottom',
    category: 'browser',
    showProgress: true
  },
  {
    id: 'ftp-file-operations',
    target: '[data-tour="file-operations"]',
    title: '⚙️ File Operations',
    content: `Manage files with context menu:

**Right-Click Options:**
• **Rename**: Change filename
• **Delete**: Remove file/folder
• **Chmod**: Set permissions (SFTP)
• **New Folder**: Create directory

**Bulk Actions:**
Select multiple files with Ctrl/Cmd+click
Apply operations to selection

**Careful:**
Delete operations cannot be undone!`,
    placement: 'left', position: 'left',
    category: 'browser',
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'ftp-chmod',
    target: '[data-tour="chmod-dialog"]',
    title: '🔒 File Permissions',
    content: `Change file permissions (SFTP only):

**Permission Types:**
• **Read (r)**: View file contents
• **Write (w)**: Modify file
• **Execute (x)**: Run file/enter folder

**User Classes:**
• **Owner**: File creator
• **Group**: User group
• **Others**: Everyone else

**Common Values:**
• 644 - Files (owner write)
• 755 - Folders/scripts
• 600 - Private files

Enter octal value (e.g., 644) or use checkboxes.`,
    placement: 'left', position: 'left',
    category: 'browser',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: Transfer Queue
  // ============================================================================
  {
    id: 'ftp-transfer-queue',
    target: '[data-tour="transfer-queue"]',
    title: '📦 Transfer Queue',
    content: `Monitor all file transfers:

**Queue Sections:**
• **Active**: Currently transferring
• **Completed**: Finished transfers
• **Failed**: Error transfers

**Statistics:**
• Active count
• Completed count
• Total bytes transferred
• Average speed

The queue persists across sessions.`,
    placement: 'top', position: 'top',
    category: 'transfers',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'ftp-transfer-item',
    target: '[data-tour="transfer-item"]',
    title: '📊 Transfer Progress',
    content: `Each transfer shows:

**Progress Info:**
• Filename
• Direction (↑ upload / ↓ download)
• Progress bar percentage
• Transfer speed
• Estimated time remaining

**Status Colors:**
• 🔵 Transferring
• 🟡 Paused
• 🟢 Completed
• 🔴 Failed/Cancelled

Click a transfer for more details.`,
    placement: 'left', position: 'left',
    category: 'transfers',
    showProgress: true
  },
  {
    id: 'ftp-transfer-controls',
    target: '[data-tour="transfer-controls"]',
    title: '⏯️ Transfer Controls',
    content: `Control active transfers:

**Actions:**
• **Pause** ⏸️: Suspend transfer
• **Resume** ▶️: Continue paused
• **Cancel** ❌: Stop and remove

**Batch Operations:**
• Clear completed: Remove finished
• Cancel all: Stop everything

**Pro Tip:**
Pause large transfers for bandwidth management.`,
    placement: 'left', position: 'left',
    category: 'transfers',
    showProgress: true,
    highlightClicks: true
  },
  {
    id: 'ftp-transfer-stats',
    target: '[data-tour="transfer-stats"]',
    title: '📈 Transfer Statistics',
    content: `Track your transfer performance:

**Real-time Metrics:**
• Active transfers count
• Completed vs failed ratio
• Total data transferred
• Average transfer speed

**Session Stats:**
• Accumulated during session
• Reset on app restart
• Export available

Use stats to monitor bandwidth usage.`,
    placement: 'bottom', position: 'bottom',
    category: 'transfers',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: FTP Server
  // ============================================================================
  {
    id: 'ftp-server',
    target: '[data-tour="ftp-server"]',
    title: '🖧 Built-in FTP Server',
    content: `Host your own FTP server:

**Server Features:**
• Local FTP hosting
• Custom port selection
• User authentication
• Permission levels

**Use Cases:**
• Quick file sharing
• Testing FTP clients
• Local network transfers
• Development servers

Start a server with one click!`,
    placement: 'left', position: 'left',
    category: 'server',
    showProgress: true
  },
  {
    id: 'ftp-server-config',
    target: '[data-tour="server-config"]',
    title: '⚙️ Server Configuration',
    content: `Configure your FTP server:

**Basic Settings:**
• **Port**: Server listening port (default: 21)
• **Root Path**: Shared directory
• **Anonymous**: Allow guest access

**Security:**
• **Require TLS**: Force encryption
• **Max Connections**: Limit clients
• **User Accounts**: Define users

**User Permissions:**
• Read-only: View/download
• Read-write: Full access
• Admin: Server control`,
    placement: 'left', position: 'left',
    category: 'server',
    showProgress: true
  },
  {
    id: 'ftp-server-status',
    target: '[data-tour="server-status"]',
    title: '📊 Server Status',
    content: `Monitor your running server:

**Status Information:**
• Running/Stopped state
• Active connections count
• Total connections served
• Port and root path

**Connection Details:**
• Connected client IPs
• Session duration
• Transfer activity

**Controls:**
• Start/Stop server
• View logs
• Disconnect clients`,
    placement: 'bottom', position: 'bottom',
    category: 'server',
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: Tour Completion
  // ============================================================================
  {
    id: 'ftp-complete',
    target: '[data-tour="ftp-manager"]',
    title: '✅ FTP Manager Tour Complete!',
    content: `You've mastered CUBE FTP Manager!

**Topics Covered:**
✓ Protocol selection (FTP/SFTP/FTPS)
✓ Site management
✓ Dual-pane file browser
✓ File operations (chmod, delete, rename)
✓ Transfer queue management
✓ Built-in FTP server

**Pro Tips:**
• Use SFTP for secure transfers
• Save frequently used sites
• Monitor transfer queue for issues
• Use chmod 644 for files, 755 for folders

**Keyboard Shortcuts:**
• \`F5\` - Refresh current pane
• \`Enter\` - Open folder/start transfer
• \`Delete\` - Delete selected
• \`F2\` - Rename selected

Ready for enterprise file transfers!`,
    placement: 'center', position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for FTP Manager
 */
export const ftpTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '📁' },
  { id: 'connection', title: 'Connection', icon: '🔌' },
  { id: 'browser', title: 'File Browser', icon: '📂' },
  { id: 'transfers', title: 'Transfers', icon: '📦' },
  { id: 'server', title: 'FTP Server', icon: '🖧' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getFtpStepsBySection = (sectionId: string): TourStep[] => {
  return ftpTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getFtpRequiredSteps = (): TourStep[] => {
  return ftpTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const ftpTourConfig = {
  id: 'ftp-tour',
  name: 'FTP Manager Tour',
  description: 'Learn enterprise file transfer with FTP/SFTP',
  version: '1.0.0',
  totalSteps: ftpTourSteps.length,
  estimatedTime: '6 minutes',
  sections: ftpTourSections,
  features: [
    'FTP/SFTP/FTPS protocols',
    'Dual-pane file browser',
    'Transfer queue',
    'Site management',
    'Built-in FTP server'
  ]
};

export default ftpTourSteps;
